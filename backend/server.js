import { polyfillsActive } from './polyfills.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/dbConnector.js';

console.log('Server environment polyfills active:', polyfillsActive);
import jwt from 'jsonwebtoken';
import { geminiService } from './services/geminiService.js';
import multer from 'multer';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite development server and production/Vercel URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

app.get('/', (req, res) => {
  const rawUri = process.env.MONGODB_URI || '';
  const maskedUri = rawUri.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+@/, '$1****@');
  res.json({
    message: 'SmartHRMS API is running successfully.',
    status: 'healthy',
    uri: rawUri,
    isMongoConnected: db.isMongoConnected,
    connectionError: db.connectionError,
    mongoUriMasked: maskedUri || null,
    timestamp: new Date()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to the SmartHRMS Backend API.',
    version: '1.0.0'
  });
});

// --- Candidate Portal Auth & Profile Endpoints ---
app.post('/api/candidate/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing name, email, or password' });
    }

    const existing = await db.getJobSeeker(email);
    if (existing) {
      return res.status(400).json({ error: 'A candidate with this email already exists.' });
    }

    const newSeeker = await db.addJobSeeker({ name, email, password });

    const token = jwt.sign(
      { email: newSeeker.email, name: newSeeker.name, role: 'Candidate' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      name: newSeeker.name,
      email: newSeeker.email,
      role: 'Candidate',
      token
    });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/candidate/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const seeker = await db.getJobSeeker(email);
    if (!seeker || seeker.password !== password) {
      return res.status(401).json({ error: 'Invalid candidate credentials.' });
    }

    const token = jwt.sign(
      { email: seeker.email, name: seeker.name, role: 'Candidate' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      name: seeker.name,
      email: seeker.email,
      role: 'Candidate',
      token
    });
  } catch (e) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/candidate/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Candidate') {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }
    const seeker = await db.getJobSeeker(req.user.email);
    if (!seeker) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json(seeker);
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

app.put('/api/candidate/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Candidate') {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }
    const { name, skills, education, experience } = req.body;
    const updated = await db.updateJobSeekerProfile(req.user.email, {
      name,
      skills,
      education,
      experience
    });
    if (!updated) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.get('/api/candidate/applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Candidate') {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }
    const list = await db.getCandidates();
    const filtered = list.filter(c => c.email.toLowerCase() === req.user.email.toLowerCase());
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
});

app.post('/api/candidate/profile/resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'Candidate') {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: req.file.buffer });
    const parsedPdf = await parser.getText();
    const textContent = parsedPdf.text || '';
    await parser.destroy();

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'Could not extract text content from the PDF file.' });
    }

    const updated = await db.updateJobSeekerProfile(req.user.email, {
      resumeText: textContent,
      resumeFileName: req.file.originalname
    });

    res.json({
      success: true,
      message: 'Resume PDF uploaded and parsed successfully.',
      resumeFileName: req.file.originalname,
      profile: updated
    });
  } catch (e) {
    console.error('PDF parsing error:', e);
    res.status(500).json({ error: 'Failed to parse and save PDF resume.' });
  }
});

app.post('/api/candidate/apply', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'Candidate') {
      return res.status(403).json({ error: 'Access denied. Candidates only.' });
    }
    const { jobId, name, skills, education, experience } = req.body;
    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }

    const seeker = await db.getJobSeeker(req.user.email);
    if (!seeker) {
      return res.status(404).json({ error: 'Candidate profile not found.' });
    }

    let resumeText = seeker.resumeText;
    let resumeFileName = seeker.resumeFileName;

    if (req.file) {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: req.file.buffer });
      const parsedPdf = await parser.getText();
      resumeText = parsedPdf.text || '';
      resumeFileName = req.file.originalname;
      await parser.destroy();
    }

    if (!resumeText) {
      return res.status(400).json({ error: 'Please upload a PDF resume first or during application.' });
    }

    const appDetails = {
      name: name || seeker.name || req.user.name,
      resumeText,
      resumeFileName,
      skills: skills !== undefined ? skills : seeker.skills,
      education: education !== undefined ? education : seeker.education,
      experience: experience !== undefined ? experience : seeker.experience
    };

    const application = await db.applyForJob(jobId, req.user.email, appDetails);
    res.status(201).json(application);
  } catch (e) {
    console.error('Job application error:', e);
    res.status(500).json({ error: e.message || 'Failed to submit job application.' });
  }
});

// --- Recruiter AI Screening & Vetting Endpoints ---
app.post('/api/candidates/:id/screen', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const list = await db.getCandidates();
    const candidateObj = list.find(c => c.id === id);
    if (!candidateObj) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const { Candidate: CandidateModel, Job: JobModel } = await import('./db/models.js');
    const candidate = await CandidateModel.findOne({ id });
    const job = await JobModel.findOne({ id: candidate.jobId });
    const jobDescStr = job ? `${job.title} - ${job.description}` : 'General Role';

    const result = await geminiService.screenResume(jobDescStr, candidate.resumeText, candidate.skills);

    candidate.matchScore = result.matchScore;
    candidate.evaluation = result;
    candidate.status = (result.recommendation === 'Strong Match' || result.recommendation === 'Recommended') ? 'Interviewing' : 'Screening';
    await candidate.save();

    res.json({
      success: true,
      candidate: candidate.toObject(),
      result
    });
  } catch (e) {
    console.error('Error screening existing candidate:', e);
    res.status(500).json({ error: 'Failed to run AI screening.' });
  }
});

app.post('/api/candidates/parse-resume', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: req.file.buffer });
    const parsedPdf = await parser.getText();
    const textContent = parsedPdf.text || '';
    await parser.destroy();

    if (!textContent.trim()) {
      return res.status(400).json({ error: 'Could not extract text content from the PDF file.' });
    }

    res.json({ text: textContent });
  } catch (e) {
    console.error('PDF parsing error:', e);
    res.status(500).json({ error: 'Failed to parse PDF resume.' });
  }
});

app.put('/api/candidates/:id/status', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, interviewDate, interviewTime, techInterviewDate, techInterviewTime } = req.body;
    if (!['Applied', 'Screening', 'Interviewing', 'Shortlisted', 'Rejected', 'Offered', 'Hired'].includes(status)) {
      return res.status(400).json({ error: 'Invalid candidate status.' });
    }

    const { Candidate: CandidateModel } = await import('./db/models.js');
    const candidate = await CandidateModel.findOne({ id });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    candidate.status = status;
    if (interviewDate !== undefined) candidate.interviewDate = interviewDate;
    if (interviewTime !== undefined) candidate.interviewTime = interviewTime;
    if (techInterviewDate !== undefined) candidate.techInterviewDate = techInterviewDate;
    if (techInterviewTime !== undefined) candidate.techInterviewTime = techInterviewTime;
    await candidate.save();

    res.json(candidate.toObject());
  } catch (e) {
    res.status(500).json({ error: 'Failed to update candidate status.' });
  }
});

// Auth Controllers
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const employees = await db.getEmployees();
    let user = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    let isCandidate = false;

    if (!user) {
      // Fallback: Check JobSeekers (Candidates)
      const seeker = await db.getJobSeeker(email);
      if (seeker) {
        user = seeker;
        isCandidate = true;
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // Verify password (either the custom saved password or default 'password')
    const correctPassword = user.password || 'password';
    if (password !== correctPassword) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      isCandidate
        ? { email: user.email, name: user.name, role: 'Candidate' }
        : { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      id: isCandidate ? undefined : user.id,
      name: user.name,
      email: user.email,
      role: isCandidate ? 'Candidate' : user.role,
      avatar: isCandidate ? undefined : user.avatar,
      token
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Authentication failed', details: e.message || String(e) });
  }
});



// 1. Employee Management
app.get('/api/employees/me', authenticateToken, async (req, res) => {
  try {
    const list = await db.getEmployees();
    const user = list.find(e => e.id === req.user.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Employee profile not found' });
    }
  } catch (e) {
    console.error('Error in /api/employees/me:', e);
    res.status(500).json({ error: 'Failed to retrieve profile', details: e.message || String(e) });
  }
});

app.get('/api/employees', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), async (req, res) => {
  try {
    res.json(await db.getEmployees());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, email, role, department, designation, salary, password } = req.body;

    if (!name || !email || !role || !department || !designation || !salary || !password) {
      return res.status(400).json({ error: 'Missing required employee fields, including password' });
    }

    const list = await db.getEmployees();

    // Check if email already exists
    const exists = list.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: 'An employee with this email already exists' });
    }

    const newEmp = await db.addEmployee({ name, email, role, password, department, designation, salary });
    res.status(201).json(newEmp);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.put('/api/employees/:id/toggle-status', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.toggleEmployeeStatus(id);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update employee status' });
  }
});

app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const list = await db.getAttendance();
    if (req.user.role === 'Employee') {
      // Employees should only retrieve their own attendance records
      const filtered = list.filter(a => a.employeeId === req.user.id);
      return res.json(filtered);
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance/check-in', authenticateToken, async (req, res) => {
  try {
    const { employeeId, localDate, localTime } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });

    // Secure Check-In restriction: employees can only check in for themselves
    if (req.user.role !== 'Admin' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied. You cannot check in for another employee.' });
    }

    const entry = await db.checkIn(employeeId, localDate, localTime);
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: 'Check-in failed' });
  }
});

app.post('/api/attendance/check-out', authenticateToken, async (req, res) => {
  try {
    const { employeeId, localDate, localTime } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Missing employeeId' });

    // Secure Check-Out restriction: employees can only check out for themselves
    if (req.user.role !== 'Admin' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied. You cannot check out for another employee.' });
    }

    const entry = await db.checkOut(employeeId, localDate, localTime);
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
app.get('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const list = await db.getLeaves();
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

app.post('/api/leaves', authenticateToken, async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Missing required leave fields' });
    }

    // Secure Leave restriction: employees can only request leave for themselves
    if (req.user.role !== 'Admin' && req.user.id !== employeeId) {
      return res.status(403).json({ error: 'Access denied. You cannot request leave for another employee.' });
    }

    const reqEntry = await db.requestLeave(employeeId, leaveType, startDate, endDate, reason);
    res.status(201).json(reqEntry);
  } catch (e) {
    res.status(500).json({ error: 'Failed to request leave' });
  }
});

app.put('/api/leaves/:id/approve', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approverName } = req.body;
    if (!approverName) return res.status(400).json({ error: 'Missing approverName' });

    const entry = await db.approveLeave(id, approverName);
    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Leave request not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

app.put('/api/leaves/:id/reject', authenticateToken, authorizeRoles('Admin', 'Senior Manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approverName } = req.body;
    if (!approverName) return res.status(400).json({ error: 'Missing approverName' });

    const entry = await db.rejectLeave(id, approverName);
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
app.get('/api/jobs', async (req, res) => {
  try {
    res.json(await db.getJobs());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { title, department, type, location, description } = req.body;
    if (!title || !department || !type || !location || !description) {
      return res.status(400).json({ error: 'Missing required job fields' });
    }

    const newJob = await db.createJob(title, department, type, location, description);
    res.status(201).json(newJob);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

app.delete('/api/jobs/:id', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteJob(id);
    if (success) {
      res.json({ success: true, message: 'Job deleted successfully.' });
    } else {
      res.status(404).json({ error: 'Job not found.' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete job.' });
  }
});

// 5. Candidates Management
app.get('/api/candidates', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    res.json(await db.getCandidates());
  } catch (e) {
    console.error('Error in GET /api/candidates:', e);
    res.status(500).json({ error: 'Failed to fetch candidates', details: e.message || String(e) });
  }
});

app.post('/api/candidates', async (req, res) => {
  try {
    const { jobId, name, email, skills, resumeText } = req.body;
    if (!jobId || !name || !email || !resumeText) {
      return res.status(400).json({ error: 'Missing required candidate fields' });
    }

    const cand = await db.addCandidate(jobId, name, email, resumeText, skills || '');
    res.status(201).json(cand);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add candidate' });
  }
});

app.put('/api/candidates/:id/evaluation', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, matchScore, evaluation } = req.body;
    const updated = await db.updateCandidateEvaluation(id, status, matchScore, evaluation);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Candidate not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to save candidate evaluation' });
  }
});

app.put('/api/candidates/:id/interview-report', authenticateToken, authorizeRoles('Admin', 'HR Recruiter', 'Candidate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, matchScore, interviewReport } = req.body;
    const updated = await db.updateCandidateInterviewReport(id, status, matchScore, interviewReport);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Candidate not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to save interview report' });
  }
});

// Policies
app.get('/api/policies', authenticateToken, async (req, res) => {
  try {
    res.json(await db.getPolicies());
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch policies' });
  }
});

// --- AI Service SECURE Proxies ---
app.post('/api/ai/screen', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { jobDescription, resumeText, skills } = req.body;
    if (!jobDescription || !resumeText) {
      return res.status(400).json({ error: 'Missing jobDescription or resumeText' });
    }

    const result = await geminiService.screenResume(jobDescription, resumeText, skills || '');
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'AI Resume screening failed' });
  }
});

app.post('/api/ai/interview/question', authenticateToken, authorizeRoles('Admin', 'HR Recruiter', 'Candidate'), async (req, res) => {
  try {
    const { jobTitle, currentRound, history, resumeText } = req.body;
    if (!jobTitle || !currentRound || !history) {
      return res.status(400).json({ error: 'Missing question generation params' });
    }

    const question = await geminiService.getNextInterviewQuestion(jobTitle, currentRound, history, resumeText || '');
    res.json({ question });
  } catch (e) {
    res.status(500).json({ error: 'AI question generation failed' });
  }
});

app.post('/api/ai/interview/evaluate', authenticateToken, authorizeRoles('Admin', 'HR Recruiter', 'Candidate'), async (req, res) => {
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
app.put('/api/employees/me/profile', authenticateToken, async (req, res) => {
  try {
    const updated = await db.updateEmployeeProfile(req.user.id, req.body);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Updatable endpoints for Admin
app.put('/api/employees/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateEmployee(id, req.body);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.put('/api/jobs/:id', authenticateToken, authorizeRoles('Admin', 'HR Recruiter'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await db.updateJob(id, req.body);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

app.put('/api/policies/:title', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { title } = req.params;
    const updated = await db.updatePolicy(title, req.body);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Policy not found' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

// Settings Endpoints
app.get('/api/settings/has-key', async (req, res) => {
  try {
    const geminiKey = await db.getGeminiKey();
    const hasKey = !!(process.env.GEMINI_API_KEY || geminiKey);
    res.json({ hasKey });
  } catch (e) {
    res.status(500).json({ error: 'Failed to retrieve settings status' });
  }
});

app.post('/api/settings/key', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { geminiKey } = req.body;
    await db.saveGeminiKey(geminiKey);
    res.json({ success: true, message: 'Gemini API key updated on server.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update Gemini API key' });
  }
});

// Database connection status debug route
app.get('/api/db-status', (req, res) => {
  res.json({
    isMongoConnected: db.isMongoConnected,
    connectionError: db.connectionError,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) : 'none'
  });
});

// App listener
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  SmartHRMS Backend API running on port ${PORT} `);
  console.log(`  Targeting database: MongoDB                   `);
  console.log(`===============================================`);
});
