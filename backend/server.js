import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/dbConnector.js';
import jwt from 'jsonwebtoken';
import { geminiService } from './services/geminiService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'smarthrms_jwt_secret_token_key_2026';
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// --- JWT Auth & Role Access Middlewares ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token missing.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Access denied. Invalid or expired token.' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized role.' });
    }
    next();
  };
};

// --- API Endpoints ---

// Auth Controllers
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const employees = db.getEmployees();
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // Verify password (either the custom saved password or default 'password')
    const correctPassword = user.password || 'password';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token
    });
  } catch (e) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, department, designation, salary } = req.body;
    
    if (!name || !email || !password || !department || !designation || !salary) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }

    const list = db.getEmployees();
    
    // Check if email already exists
    const exists = list.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'An employee with this email already exists' });
    }

    const newId = `EMP${String(list.length + 1).padStart(3, '0')}`;
    const newEmp = {
      id: newId,
      name,
      email,
      password,
      role: 'Employee', // Enforce role restriction for public signups
      department,
      designation,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      salary: parseFloat(salary),
      leaveBalance: { casual: 12, medical: 10, earned: 18 },
      attendanceStats: { checkInCount: 0, totalHours: 0, onTimeRate: 100 },
      performanceScore: 85,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    list.unshift(newEmp);
    db.saveEmployees(list);

    const token = jwt.sign(
      { id: newEmp.id, name: newEmp.name, email: newEmp.email, role: newEmp.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      id: newEmp.id,
      name: newEmp.name,
      email: newEmp.email,
      role: newEmp.role,
      avatar: newEmp.avatar,
      token
    });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 1. Employee Management
app.get('/api/employees', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), (req, res) => {
  try {
    res.json(db.getEmployees());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  try {
    const { name, email, role, department, designation, salary } = req.body;
    
    if (!name || !email || !role || !department || !designation || !salary) {
      return res.status(400).json({ error: 'Missing required employee fields' });
    }

    const list = db.getEmployees();
    const newId = `EMP${String(list.length + 1).padStart(3, '0')}`;
    const newEmp = {
      id: newId,
      name,
      email,
      role,
      department,
      designation,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      salary: parseFloat(salary),
      leaveBalance: { casual: 12, medical: 10, earned: 18 },
      attendanceStats: { checkInCount: 0, totalHours: 0, onTimeRate: 100 },
      performanceScore: 85,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    list.unshift(newEmp);
    db.saveEmployees(list);
    res.status(201).json(newEmp);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.put('/api/employees/:id/toggle-status', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  try {
    const { id } = req.params;
    const list = db.getEmployees();
    const idx = list.findIndex(e => e.id === id);
    
    if (idx !== -1) {
      list[idx].status = list[idx].status === 'Active' ? 'Inactive' : 'Active';
      db.saveEmployees(list);
      res.json(list[idx]);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update employee status' });
  }
});

// 2. Attendance System
app.get('/api/attendance', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), (req, res) => {
  try {
    res.json(db.getAttendance());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance/check-in', authenticateToken, (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
    
    // Secure Check-In restriction: employees can only check in for themselves
    if (req.user.role !== 'Admin' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied. You cannot check in for another employee.' });
    }

    const entry = db.checkIn(employeeId);
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: 'Check-in failed' });
  }
});

app.post('/api/attendance/check-out', authenticateToken, (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });
    
    // Secure Check-Out restriction: employees can only check out for themselves
    if (req.user.role !== 'Admin' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied. You cannot check out for another employee.' });
    }

    const entry = db.checkOut(employeeId);
    if (entry) {
      res.json(entry);
    } else {
      res.status(400).json({ error: 'No active check-in found for today' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// 3. Leave Requests
app.get('/api/leaves', authenticateToken, (req, res) => {
  try {
    const list = db.getLeaves();
    if (req.user.role === 'Employee') {
      // Employees can only fetch their own leaves
      const filtered = list.filter(l => l.employeeId === req.user.id);
      return res.json(filtered);
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

app.post('/api/leaves', authenticateToken, (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required leave fields' });
    }

    // Secure Leave restriction: employees can only request leave for themselves
    if (req.user.role !== 'Admin' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied. You cannot request leave for another employee.' });
    }

    const reqEntry = db.requestLeave(employeeId, leaveType, startDate, endDate, reason);
    res.status(201).json(reqEntry);
  } catch (e) {
    res.status(500).json({ error: 'Failed to request leave' });
  }
});

app.put('/api/leaves/:id/approve', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), (req, res) => {
  try {
    const { id } = req.params;
    const { approverName } = req.body;
    if (!approverName) return res.status(400).json({ error: 'Missing approverName' });

    const entry = db.approveLeave(id, approverName);
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Leave request not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

app.put('/api/leaves/:id/reject', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), (req, res) => {
  try {
    const { id } = req.params;
    const { approverName } = req.body;
    if (!approverName) return res.status(400).json({ error: 'Missing approverName' });

    const entry = db.rejectLeave(id, approverName);
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Leave request not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject leave' });
  }
});

// 4. Recruitment Management (Jobs)
app.get('/api/jobs', (req, res) => {
  try {
    res.json(db.getJobs());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), (req, res) => {
  try {
    const { title, department, type, location, description } = req.body;
    if (!title || !department || !type || !location || !description) {
      return res.status(400).json({ error: 'Missing required job fields' });
    }

    const newJob = db.createJob(title, department, type, location, description);
    res.status(201).json(newJob);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// 5. Candidates Management
app.get('/api/candidates', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), (req, res) => {
  try {
    res.json(db.getCandidates());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

app.post('/api/candidates', (req, res) => {
  try {
    const { jobId, name, email, resumeText } = req.body;
    if (!jobId || !name || !email || !resumeText) {
      return res.status(400).json({ error: 'Missing required candidate fields' });
    }

    const cand = db.addCandidate(jobId, name, email, resumeText);
    res.status(201).json(cand);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

app.put('/api/candidates/:id/evaluation', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, matchScore, evaluation } = req.body;
    
    const list = db.getCandidates();
    const idx = list.findIndex(c => c.id === id);
    
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, matchScore, evaluation };
      db.saveCandidates(list);
      res.json(list[idx]);
    } else {
      res.status(404).json({ error: 'Candidate not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to save candidate evaluation' });
  }
});

app.put('/api/candidates/:id/interview-report', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, matchScore, interviewReport } = req.body;
    
    const list = db.getCandidates();
    const idx = list.findIndex(c => c.id === id);
    
    if (idx !== -1) {
      list[idx] = { ...list[idx], status, matchScore, interviewReport };
      db.saveCandidates(list);
      res.json(list[idx]);
    } else {
      res.status(404).json({ error: 'Candidate not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to save interview report' });
  }
});

// Policies
app.get('/api/policies', authenticateToken, (req, res) => {
  try {
    res.json(db.getPolicies());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// --- AI Service SECURE Proxies ---
app.post('/api/ai/screen', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { jobDescription, resumeText } = req.body;
    if (!jobDescription || !resumeText) {
      return res.status(400).json({ error: 'Missing jobDescription or resumeText' });
    }

    const result = await geminiService.screenResume(jobDescription, resumeText);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'AI Resume screening failed' });
  }
});

app.post('/api/ai/interview/question', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { jobTitle, currentRound, history } = req.body;
    if (!jobTitle || !currentRound || !history) {
      return res.status(400).json({ error: 'Missing question generation params' });
    }

    const question = await geminiService.getNextInterviewQuestion(jobTitle, currentRound, history);
    res.json({ question });
  } catch (e) {
    res.status(500).json({ error: 'AI question generation failed' });
  }
});

app.post('/api/ai/interview/evaluate', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { jobTitle, history } = req.body;
    if (!jobTitle || !history) {
      return res.status(400).json({ error: 'Missing evaluation params' });
    }

    const report = await geminiService.evaluateInterview(jobTitle, history);
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: 'AI interview evaluation failed' });
  }
});

app.post('/api/ai/chatbot', authenticateToken, async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question || !context) {
      return res.status(400).json({ error: 'Missing chatbot question or context' });
    }

    const answer = await geminiService.askHRAssistant(question, context);
    res.json({ answer });
  } catch (e) {
    res.status(500).json({ error: 'AI HR Chatbot assistant query failed' });
  }
});

// Settings Endpoints
app.get('/api/settings/has-key', (req, res) => {
  try {
    const hasKey = !!(process.env.GEMINI_API_KEY || db.getGeminiKey());
    res.json({ hasKey });
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve settings status' });
  }
});

app.post('/api/settings/key', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  try {
    const { geminiKey } = req.body;
    db.saveGeminiKey(geminiKey);
    res.json({ success: true, message: 'Gemini API key updated on server.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update Gemini API key' });
  }
});

// App listener
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  SmartHRMS Backend API running on port ${PORT} `);
  console.log(`  Targeting database: db.json (JSON Local DB)   `);
  console.log(`===============================================`);
});
