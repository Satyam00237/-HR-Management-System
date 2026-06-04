import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../db.json');

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const defaultEmployees = [
  {
    id: 'EMP001',
    name: 'Satyam Sharma',
    email: 'satyam@company.com',
    role: 'Admin',
    department: 'Executive',
    designation: 'Chief Technology Officer',
    joinDate: getRelativeDate(-365),
    status: 'Active',
    salary: 150000,
    leaveBalance: { casual: 12, medical: 10, earned: 18 },
    attendanceStats: { checkInCount: 22, totalHours: 176, onTimeRate: 98 },
    performanceScore: 95,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Satyam'
  },
  {
    id: 'EMP002',
    name: 'Rajesh Kumar',
    email: 'rajesh@company.com',
    role: 'Senior Manager',
    department: 'Engineering',
    designation: 'Engineering Director',
    joinDate: getRelativeDate(-280),
    status: 'Active',
    salary: 120000,
    leaveBalance: { casual: 8, medical: 9, earned: 15 },
    attendanceStats: { checkInCount: 20, totalHours: 158, onTimeRate: 90 },
    performanceScore: 91,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh'
  },
  {
    id: 'EMP003',
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.com',
    role: 'HR Recruiter',
    department: 'Human Resources',
    designation: 'Lead Talent Acquisition',
    joinDate: getRelativeDate(-180),
    status: 'Active',
    salary: 80000,
    leaveBalance: { casual: 10, medical: 7, earned: 12 },
    attendanceStats: { checkInCount: 21, totalHours: 165, onTimeRate: 95 },
    performanceScore: 88,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: 'EMP004',
    name: 'Amit Patel',
    email: 'amit@company.com',
    role: 'Employee',
    department: 'Engineering',
    designation: 'Senior Frontend Engineer',
    joinDate: getRelativeDate(-120),
    status: 'Active',
    salary: 95000,
    leaveBalance: { casual: 10, medical: 8, earned: 14 },
    attendanceStats: { checkInCount: 19, totalHours: 150, onTimeRate: 92 },
    performanceScore: 90,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit'
  },
  {
    id: 'EMP005',
    name: 'Priya Nair',
    email: 'priya@company.com',
    role: 'Employee',
    department: 'Sales',
    designation: 'Enterprise Account Manager',
    joinDate: getRelativeDate(-90),
    status: 'Active',
    salary: 75000,
    leaveBalance: { casual: 11, medical: 6, earned: 11 },
    attendanceStats: { checkInCount: 18, totalHours: 140, onTimeRate: 85 },
    performanceScore: 84,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
  },
  {
    id: 'EMP006',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Employee',
    department: 'Finance',
    designation: 'Senior Financial Analyst',
    joinDate: getRelativeDate(-200),
    status: 'Active',
    salary: 88000,
    leaveBalance: { casual: 6, medical: 5, earned: 8 },
    attendanceStats: { checkInCount: 20, totalHours: 160, onTimeRate: 95 },
    performanceScore: 89,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  }
];

const defaultAttendance = [
  { id: 'ATT001', employeeId: 'EMP001', date: getRelativeDate(-1), checkInTime: '09:02:15', checkOutTime: '18:05:00', hoursWorked: 9, status: 'On Time' },
  { id: 'ATT002', employeeId: 'EMP002', date: getRelativeDate(-1), checkInTime: '09:45:10', checkOutTime: '17:40:00', hoursWorked: 8, status: 'Late' },
  { id: 'ATT003', employeeId: 'EMP003', date: getRelativeDate(-1), checkInTime: '08:55:00', checkOutTime: '18:00:00', hoursWorked: 9, status: 'On Time' },
  { id: 'ATT004', employeeId: 'EMP004', date: getRelativeDate(-1), checkInTime: '09:05:00', checkOutTime: '18:15:00', hoursWorked: 9.1, status: 'On Time' },
  { id: 'ATT005', employeeId: 'EMP005', date: getRelativeDate(-1), checkInTime: '10:15:00', checkOutTime: '18:00:00', hoursWorked: 7.75, status: 'Late' },
  { id: 'ATT006', employeeId: 'EMP006', date: getRelativeDate(-1), checkInTime: '08:50:00', checkOutTime: '17:55:00', hoursWorked: 9, status: 'On Time' },
  
  { id: 'ATT007', employeeId: 'EMP001', date: getRelativeDate(-2), checkInTime: '08:58:00', checkOutTime: '18:00:00', hoursWorked: 9, status: 'On Time' },
  { id: 'ATT008', employeeId: 'EMP002', date: getRelativeDate(-2), checkInTime: '09:00:00', checkOutTime: '18:30:00', hoursWorked: 9.5, status: 'On Time' },
  { id: 'ATT009', employeeId: 'EMP003', date: getRelativeDate(-2), checkInTime: '09:12:00', checkOutTime: '18:00:00', hoursWorked: 8.8, status: 'Late' },
  { id: 'ATT010', employeeId: 'EMP004', date: getRelativeDate(-2), checkInTime: '09:02:00', checkOutTime: '18:05:00', hoursWorked: 9, status: 'On Time' },
  { id: 'ATT011', employeeId: 'EMP005', date: getRelativeDate(-2), checkInTime: '09:00:00', checkOutTime: '17:30:00', hoursWorked: 8.5, status: 'On Time' },
  { id: 'ATT012', employeeId: 'EMP006', date: getRelativeDate(-2), checkInTime: '08:52:00', checkOutTime: '17:50:00', hoursWorked: 9, status: 'On Time' }
];

const defaultLeaves = [
  {
    id: 'LV001',
    employeeId: 'EMP004',
    employeeName: 'Amit Patel',
    leaveType: 'Casual',
    startDate: getRelativeDate(2),
    endDate: getRelativeDate(4),
    totalDays: 3,
    reason: 'Family gathering attending cousin marriage',
    status: 'Pending',
    approvedBy: null
  },
  {
    id: 'LV002',
    employeeId: 'EMP005',
    employeeName: 'Priya Nair',
    leaveType: 'Medical',
    startDate: getRelativeDate(-5),
    endDate: getRelativeDate(-4),
    totalDays: 2,
    reason: 'Severe fever and dental checkup',
    status: 'Approved',
    approvedBy: 'Rajesh Kumar'
  },
  {
    id: 'LV003',
    employeeId: 'EMP006',
    employeeName: 'John Doe',
    leaveType: 'Earned',
    startDate: getRelativeDate(10),
    endDate: getRelativeDate(17),
    totalDays: 8,
    reason: 'Annual family summer vacation trip',
    status: 'Pending',
    approvedBy: null
  }
];

const defaultJobs = [
  {
    id: 'JOB001',
    title: 'Senior React Developer',
    department: 'Engineering',
    type: 'Full-time',
    location: 'Remote (India)',
    status: 'Open',
    description: 'We are seeking an expert Frontend Engineer skilled in React.js, Tailwind CSS, and state management. The ideal candidate will create fluid user experiences and maintain core dashboard UI architectures.',
    candidatesCount: 3
  },
  {
    id: 'JOB002',
    title: 'Lead AI Engineer',
    department: 'Engineering',
    type: 'Full-time',
    location: 'Hybrid (Bangalore)',
    status: 'Open',
    description: 'Looking for an AI engineer to integrate LLMs (Gemini, OpenAI) into enterprise flows. Experience with LangChain, vector databases, and speech models (Whisper/SpeechRecognition) is highly preferred.',
    candidatesCount: 1
  },
  {
    id: 'JOB003',
    title: 'HR Generalist',
    department: 'Human Resources',
    type: 'Full-time',
    location: 'On-site',
    status: 'Open',
    description: 'Seeking an HR Specialist to run employee engagement, resolve queries, manage performance scorecards, and implement onboarding checklists.',
    candidatesCount: 2
  }
];

const defaultCandidates = [
  {
    id: 'CAN001',
    jobId: 'JOB001',
    jobTitle: 'Senior React Developer',
    name: 'Karan Malhotra',
    email: 'karan@malhotra.dev',
    resumeText: `KARAN MALHOTRA
Senior Frontend Specialist
karan@malhotra.dev | +91 98765 43210

PROFESSIONAL SUMMARY
Highly competent React Developer with 5+ years of experience building responsive SaaS applications. Expert in React Hooks, Redux Toolkit, Tailwind CSS, and Vite.

TECHNICAL SKILLS
- Frontend: ReactJS, JavaScript (ES6+), TypeScript, HTML5, CSS3, Tailwind CSS, Sass
- Tools: Vite, Webpack, Git, Docker, Jest, Cypress
- State Management: Redux Toolkit, Context API, Zustand

EXPERIENCE
Frontend Developer | TechCorp Solutions (2022 - Present)
- Architected the redesign of a core analytics dashboard, boosting performance by 35%.
- Implemented responsive styles with Tailwind CSS, ensuring 100% mobile readiness.
- Mentored 4 junior frontend developers.

Software Engineer | DevSystems (2020 - 2022)
- Built reusable UI components for an internal CRM.
- Optimized network requests reducing data usage by 20%.

EDUCATION
B.Tech in Computer Science | Delhi Technological University (2016-2020)`,
    matchScore: 92,
    status: 'Interviewing',
    evaluation: {
      score: 92,
      strengths: ['5+ years of robust React experience', 'Strong Tailwind styling capabilities', 'Experience with performance optimization'],
      weaknesses: ['Has not worked extensively with backend technologies', 'Zustand knowledge is basic'],
      recommendation: 'Highly Recommended. The technical resume perfectly matches our Senior React developer profile.'
    },
    interviewReport: {
      score: 88,
      confidence: 'High',
      communication: 'Excellent',
      technical: 'Very Strong',
      feedback: 'The candidate demonstrated a thorough understanding of React reconciliation, rendering cycles, and custom hooks. Communication was clear and structured. Confidently answered tricky Javascript prototype questions.',
      reportText: 'Overall, Karan is an excellent fit. He demonstrated deep familiarity with component optimization, clean code practices, and displayed very good communication skills throughout the mock session.'
    }
  },
  {
    id: 'CAN002',
    jobId: 'JOB001',
    jobTitle: 'Senior React Developer',
    name: 'Nisha Sen',
    email: 'nisha.sen@gmail.com',
    resumeText: `NISHA SEN
Nisha.sen@gmail.com | Bangalore
React UI Designer & Engineer

SUMMARY:
Vibrant Frontend Developer with 3 years of experience. Specializes in beautiful interface design, transitions, React, and CSS.

SKILLS:
React, Javascript, Tailwind, Framer Motion, HTML, CSS, Figma

EXPERIENCE:
UI Developer at CreativeWeb (2023-Present)
- Developed aesthetic marketing landing pages and user dashboards.
- Utilized Framer Motion for smooth animations and transitions.

Junior Web Developer at PixelCraft (2021-2023)
- Maintained legacy React projects, upgrading dependencies.`,
    matchScore: 78,
    status: 'Screening',
    evaluation: {
      score: 78,
      strengths: ['Great aesthetic sense and design-to-code skills', 'Good knowledge of React and Framer Motion'],
      weaknesses: ['Limited experience with large scale state management (Redux/Zustand)', 'Only 3 years total experience, which is on the lower side for a Senior role'],
      recommendation: 'Recommended. Worth interviewing, but evaluate technical depth in systems architecture.'
    },
    interviewReport: null
  },
  {
    id: 'CAN003',
    jobId: 'JOB002',
    jobTitle: 'Lead AI Engineer',
    name: 'Vikram Aditya',
    email: 'vikram.ai@gmail.com',
    resumeText: `VIKRAM ADITYA
AI Research & Integration Engineer
vikram.ai@gmail.com

SUMMARY:
4+ years developing machine learning and LLM agent architectures. Experienced in LangChain, OpenAI API, Gemini API, Python, and microservice deployments.

SKILLS:
Python, PyTorch, LangChain, Gemini API, RAG, Node.js, Docker, API Design

EXPERIENCE:
AI Solutions Architect | Innovate AI (2023-Present)
- Built a multi-agent HR assistant chatbot saving HR 40% response times.
- Designed vector databases using Pinecone and LangChain for internal search.`,
    matchScore: 95,
    status: 'Applied',
    evaluation: null,
    interviewReport: null
  }
];

const defaultPolicies = [
  {
    title: 'Work From Home Policy',
    content: 'All employees are allowed up to 2 days of work from home per week, subject to approval from their reporting manager. Core collaboration hours are between 11:00 AM and 4:00 PM. Check-in on the portal is required even when working from home.'
  },
  {
    title: 'Leave Policy',
    content: 'Employees receive 12 casual leaves, 10 medical leaves, and 18 earned leaves annually, credited monthly. Leaves must be requested at least 3 days in advance except for medical emergencies. Unused casual and medical leaves expire at the end of the calendar year.'
  },
  {
    title: 'Performance & KPI Reviews',
    content: 'Performance scores are evaluated on a quarterly basis. Scores above 90 receive excellent bonuses, while scores between 80-90 are eligible for general performance incentives. Performance metrics are tracked in the goals panel.'
  }
];

const defaultDb = {
  employees: defaultEmployees,
  attendance: defaultAttendance,
  leaves: defaultLeaves,
  jobs: defaultJobs,
  candidates: defaultCandidates,
  policies: defaultPolicies,
  settings: { geminiKey: '' }
};

export const localJsonDb = {
  init() {
    if (!fs.existsSync(DB_PATH) || fs.statSync(DB_PATH).size === 0) {
      this.writeAll(defaultDb);
    }
  },

  readAll() {
    this.init();
    try {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(data);
      // Ensure settings exists
      if (!parsed.settings) parsed.settings = { geminiKey: '' };
      return parsed;
    } catch (e) {
      console.error('Failed to read db.json, returning defaults', e);
      return defaultDb;
    }
  },

  writeAll(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write to db.json', e);
    }
  },

  // Settings
  getGeminiKey() {
    return this.readAll().settings?.geminiKey || '';
  },
  saveGeminiKey(key) {
    const data = this.readAll();
    if (!data.settings) data.settings = {};
    data.settings.geminiKey = key;
    this.writeAll(data);
  },

  // Employees
  getEmployees() {
    return this.readAll().employees;
  },
  saveEmployees(employees) {
    const data = this.readAll();
    data.employees = employees;
    this.writeAll(data);
  },
  updateEmployee(updatedEmp) {
    const list = this.getEmployees();
    const idx = list.findIndex(e => e.id === updatedEmp.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedEmp };
      this.saveEmployees(list);
      return list[idx];
    }
    return null;
  },

  // Attendance
  getAttendance() {
    return this.readAll().attendance;
  },
  saveAttendance(attendance) {
    const data = this.readAll();
    data.attendance = attendance;
    this.writeAll(data);
  },
  checkIn(employeeId) {
    const list = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const exists = list.find(a => a.employeeId === employeeId && a.date === today);
    if (exists) return exists;

    const time = new Date().toTimeString().split(' ')[0];
    const checkInHour = parseInt(time.split(':')[0]);
    
    // 09:00 AM limit for On Time
    const status = checkInHour < 9 || (checkInHour === 9 && parseInt(time.split(':')[1]) <= 15) ? 'On Time' : 'Late';
    
    const newEntry = {
      id: `ATT${Date.now()}`,
      employeeId,
      date: today,
      checkInTime: time,
      checkOutTime: null,
      hoursWorked: null,
      status
    };

    list.unshift(newEntry);
    this.saveAttendance(list);

    // Update employee checkInCount
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      emp.attendanceStats.checkInCount += 1;
      // Recalculate onTimeRate
      const empAtt = list.filter(a => a.employeeId === employeeId);
      const onTimeCount = empAtt.filter(a => a.status === 'On Time').length;
      emp.attendanceStats.onTimeRate = Math.round((onTimeCount / empAtt.length) * 100);
      this.saveEmployees(employees);
    }

    return newEntry;
  },
  checkOut(employeeId) {
    const list = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const entryIndex = list.findIndex(a => a.employeeId === employeeId && a.date === today && !a.checkOutTime);
    
    if (entryIndex === -1) return null;

    const time = new Date().toTimeString().split(' ')[0];
    const entry = list[entryIndex];
    entry.checkOutTime = time;

    // Calculate hours worked
    const [inH, inM, inS] = entry.checkInTime.split(':').map(Number);
    const [outH, outM, outS] = time.split(':').map(Number);
    const inDate = new Date(2000, 0, 1, inH, inM, inS);
    const outDate = new Date(2000, 0, 1, outH, outM, outS);
    const hours = Math.round(((outDate - inDate) / 1000 / 60 / 60) * 100) / 100;
    
    entry.hoursWorked = hours;
    this.saveAttendance(list);

    // Update employee stats
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      emp.attendanceStats.totalHours = Math.round((emp.attendanceStats.totalHours + hours) * 10) / 10;
      this.saveEmployees(employees);
    }

    return entry;
  },

  // Leaves
  getLeaves() {
    return this.readAll().leaves;
  },
  saveLeaves(leaves) {
    const data = this.readAll();
    data.leaves = leaves;
    this.writeAll(data);
  },
  requestLeave(employeeId, leaveType, startDate, endDate, reason) {
    const list = this.getLeaves();
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === employeeId);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const newRequest = {
      id: `LV${Date.now()}`,
      employeeId,
      employeeName: emp ? emp.name : 'Unknown',
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'Pending',
      approvedBy: null
    };

    list.unshift(newRequest);
    this.saveLeaves(list);
    return newRequest;
  },
  approveLeave(leaveId, approverName) {
    const leaves = this.getLeaves();
    const lIdx = leaves.findIndex(l => l.id === leaveId);
    if (lIdx === -1) return null;

    const leave = leaves[lIdx];
    if (leave.status !== 'Pending') return leave;

    leave.status = 'Approved';
    leave.approvedBy = approverName;
    
    // Deduct leave balance
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === leave.employeeId);
    if (emp) {
      const typeKey = leave.leaveType.toLowerCase();
      if (emp.leaveBalance[typeKey] !== undefined) {
        emp.leaveBalance[typeKey] = Math.max(0, emp.leaveBalance[typeKey] - leave.totalDays);
      }
      this.saveEmployees(employees);
    }

    this.saveLeaves(leaves);
    return leave;
  },
  rejectLeave(leaveId, approverName) {
    const leaves = this.getLeaves();
    const lIdx = leaves.findIndex(l => l.id === leaveId);
    if (lIdx === -1) return null;

    const leave = leaves[lIdx];
    leave.status = 'Rejected';
    leave.approvedBy = approverName;
    this.saveLeaves(leaves);
    return leave;
  },

  // Jobs
  getJobs() {
    return this.readAll().jobs;
  },
  saveJobs(jobs) {
    const data = this.readAll();
    data.jobs = jobs;
    this.writeAll(data);
  },
  createJob(title, department, type, location, description) {
    const list = this.getJobs();
    const newJob = {
      id: `JOB${String(list.length + 1).padStart(3, '0')}`,
      title,
      department,
      type,
      location,
      status: 'Open',
      description,
      candidatesCount: 0
    };
    list.unshift(newJob);
    this.saveJobs(list);
    return newJob;
  },

  // Candidates
  getCandidates() {
    return this.readAll().candidates;
  },
  saveCandidates(candidates) {
    const data = this.readAll();
    data.candidates = candidates;
    this.writeAll(data);
  },
  addCandidate(jobId, name, email, resumeText) {
    const list = this.getCandidates();
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);
    
    const newCandidate = {
      id: `CAN${Date.now()}`,
      jobId,
      jobTitle: job ? job.title : 'Unknown Position',
      name,
      email,
      resumeText,
      matchScore: 0,
      status: 'Applied',
      evaluation: null,
      interviewReport: null
    };

    list.unshift(newCandidate);
    this.saveCandidates(list);

    // Update job candidates count
    if (job) {
      job.candidatesCount += 1;
      this.saveJobs(jobs);
    }

    return newCandidate;
  },

  // Policies
  getPolicies() {
    return this.readAll().policies;
  }
};
