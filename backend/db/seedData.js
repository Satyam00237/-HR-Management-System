// Built-in demo seed data for MongoDB (replaces local db.json on Vercel/serverless)

const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export function getDefaultSeedData() {
  const employees = [
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

  const attendance = [
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

  const leaves = [
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

  const jobs = [
    {
      id: 'JOB001',
      title: 'Senior React Developer',
      department: 'Engineering',
      type: 'Full-time',
      location: 'Remote (India)',
      status: 'Open',
      description: 'We are seeking an expert Frontend Engineer skilled in React.js, Tailwind CSS, and state management.',
      candidatesCount: 3
    },
    {
      id: 'JOB002',
      title: 'Lead AI Engineer',
      department: 'Engineering',
      type: 'Full-time',
      location: 'Hybrid (Bangalore)',
      status: 'Open',
      description: 'Looking for an AI engineer to integrate LLMs (Gemini, OpenAI) into enterprise flows.',
      candidatesCount: 1
    },
    {
      id: 'JOB003',
      title: 'HR Generalist',
      department: 'Human Resources',
      type: 'Full-time',
      location: 'On-site',
      status: 'Open',
      description: 'Seeking an HR Specialist to run employee engagement and manage performance scorecards.',
      candidatesCount: 2
    }
  ];

  const candidates = [
    {
      id: 'CAN001',
      jobId: 'JOB001',
      jobTitle: 'Senior React Developer',
      name: 'Karan Malhotra',
      email: 'karan@malhotra.dev',
      resumeText: 'Senior React Developer with 5+ years experience in React, Tailwind CSS, and Vite.',
      matchScore: 92,
      status: 'Interviewing',
      evaluation: {
        score: 92,
        strengths: ['5+ years of robust React experience', 'Strong Tailwind styling capabilities'],
        weaknesses: ['Limited backend experience'],
        recommendation: 'Highly Recommended.'
      },
      interviewReport: {
        score: 88,
        confidence: 'High',
        communication: 'Excellent',
        technical: 'Very Strong',
        feedback: 'Strong React and communication skills.',
        reportText: 'Excellent fit for the Senior React role.'
      }
    },
    {
      id: 'CAN002',
      jobId: 'JOB001',
      jobTitle: 'Senior React Developer',
      name: 'Nisha Sen',
      email: 'nisha.sen@gmail.com',
      resumeText: 'Frontend Developer with 3 years experience in React, Tailwind, and Framer Motion.',
      matchScore: 78,
      status: 'Screening',
      evaluation: {
        score: 78,
        strengths: ['Great aesthetic sense', 'Good React knowledge'],
        weaknesses: ['Limited large-scale state management experience'],
        recommendation: 'Recommended for interview.'
      },
      interviewReport: null
    },
    {
      id: 'CAN003',
      jobId: 'JOB002',
      jobTitle: 'Lead AI Engineer',
      name: 'Vikram Aditya',
      email: 'vikram.ai@gmail.com',
      resumeText: 'AI engineer with LangChain, Gemini API, and RAG experience.',
      matchScore: 95,
      status: 'Applied',
      evaluation: null,
      interviewReport: null
    }
  ];

  const policies = [
    {
      title: 'Work From Home Policy',
      content: 'All employees are allowed up to 2 days of work from home per week, subject to manager approval.'
    },
    {
      title: 'Leave Policy',
      content: 'Employees receive 12 casual leaves, 10 medical leaves, and 18 earned leaves annually.'
    },
    {
      title: 'Performance & KPI Reviews',
      content: 'Performance scores are evaluated on a quarterly basis with bonus eligibility above 90.'
    }
  ];

  return { employees, attendance, leaves, jobs, candidates, policies };
}
