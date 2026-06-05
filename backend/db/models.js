import mongoose from 'mongoose';

// Employee Schema
const employeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  password: { type: String, default: 'password' },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  joinDate: { type: String, required: true },
  status: { type: String, default: 'Active' },
  salary: { type: Number, required: true },
  leaveBalance: {
    casual: { type: Number, default: 12 },
    medical: { type: Number, default: 10 },
    earned: { type: Number, default: 18 }
  },
  attendanceStats: {
    checkInCount: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 100 }
  },
  performanceScore: { type: Number, default: 85 },
  avatar: { type: String }
}, { timestamps: true });

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  date: { type: String, required: true },
  checkInTime: { type: String, required: true },
  checkOutTime: { type: String, default: null },
  hoursWorked: { type: Number, default: null },
  status: { type: String, required: true } // 'On Time' or 'Late'
}, { timestamps: true });

// Leave Schema
const leaveSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  leaveType: { type: String, required: true }, // 'Casual', 'Medical', 'Earned'
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Pending' }, // 'Pending', 'Approved', 'Rejected'
  approvedBy: { type: String, default: null }
}, { timestamps: true });

// Job Schema
const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  department: { type: String, required: true },
  type: { type: String, required: true }, // 'Full-time', 'Part-time', etc.
  location: { type: String, required: true },
  status: { type: String, default: 'Open' }, // 'Open', 'Closed'
  description: { type: String, required: true },
  candidatesCount: { type: Number, default: 0 }
}, { timestamps: true });

// Candidate Schema
const candidateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  jobId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  resumeText: { type: String, required: true },
  resumeFileName: { type: String, default: '' },
  skills: { type: String, default: '' },
  education: { type: String, default: '' },
  experience: { type: String, default: '' },
  matchScore: { type: Number, default: 0 },
  status: { type: String, default: 'Applied' }, // 'Applied', 'Screening', 'Interviewing', etc.
  interviewDate: { type: String, default: '' },
  interviewTime: { type: String, default: '' },
  evaluation: {
    score: Number,
    strengths: [String],
    weaknesses: [String],
    recommendation: String
  },
  interviewReport: {
    score: Number,
    confidence: String,
    communication: String,
    technical: String,
    feedback: String,
    reportText: String
  }
}, { timestamps: true });

// JobSeeker (Candidate Account) Schema
const jobSeekerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  skills: { type: String, default: '' },
  education: { type: String, default: '' },
  experience: { type: String, default: '' },
  resumeText: { type: String, default: '' },
  resumeFileName: { type: String, default: '' }
}, { timestamps: true });

// Policy Schema
const policySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  content: { type: String, required: true }
}, { timestamps: true });

// Setting Schema
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
}, { timestamps: true });

export const Employee = mongoose.model('Employee', employeeSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
export const Leave = mongoose.model('Leave', leaveSchema);
export const Job = mongoose.model('Job', jobSchema);
export const Candidate = mongoose.model('Candidate', candidateSchema);
export const JobSeeker = mongoose.model('JobSeeker', jobSeekerSchema);
export const Policy = mongoose.model('Policy', policySchema);
export const Setting = mongoose.model('Setting', settingSchema);
