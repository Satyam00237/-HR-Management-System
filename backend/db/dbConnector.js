import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force DNS resolution to prefer IPv4 (fixes MongoDB Atlas connection issues on IPv6 networks)
dns.setDefaultResultOrder('ipv4first');

import {
  Employee,
  Attendance,
  Leave,
  Job,
  Candidate,
  Policy,
  Setting
} from './models.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_JSON_PATH = path.join(__dirname, '../db.json');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing in process.env.");
  process.exit(1);
}

export const db = {
  async init() {
    try {
      console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected successfully.');

      // Check if data seeding is required
      const empCount = await Employee.countDocuments();
      if (empCount === 0) {
        console.log('MongoDB collections are empty. Beginning migration from db.json...');
        await this.seedData();
      }
    } catch (err) {
      console.error('Failed to initialize database connector:', err);
    }
  },

  async seedData() {
    try {
      let seedSource = null;
      if (fs.existsSync(DB_JSON_PATH)) {
        try {
          const raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
          seedSource = JSON.parse(raw);
          console.log(`Loaded migration seed source from ${DB_JSON_PATH}`);
        } catch (e) {
          console.error('Error parsing db.json, falling back to basic defaults', e);
        }
      }

      if (!seedSource) {
        console.log('No db.json found or failed to parse. Creating fresh database setup.');
        return;
      }

      // Migrating Employees
      if (seedSource.employees && seedSource.employees.length > 0) {
        await Employee.insertMany(seedSource.employees);
        console.log(`Seeded ${seedSource.employees.length} employees.`);
      }

      // Migrating Attendance
      if (seedSource.attendance && seedSource.attendance.length > 0) {
        await Attendance.insertMany(seedSource.attendance);
        console.log(`Seeded ${seedSource.attendance.length} attendance records.`);
      }

      // Migrating Leaves
      if (seedSource.leaves && seedSource.leaves.length > 0) {
        await Leave.insertMany(seedSource.leaves);
        console.log(`Seeded ${seedSource.leaves.length} leave requests.`);
      }

      // Migrating Jobs
      if (seedSource.jobs && seedSource.jobs.length > 0) {
        await Job.insertMany(seedSource.jobs);
        console.log(`Seeded ${seedSource.jobs.length} jobs.`);
      }

      // Migrating Candidates
      if (seedSource.candidates && seedSource.candidates.length > 0) {
        await Candidate.insertMany(seedSource.candidates);
        console.log(`Seeded ${seedSource.candidates.length} candidates.`);
      }

      // Migrating Policies
      if (seedSource.policies && seedSource.policies.length > 0) {
        await Policy.insertMany(seedSource.policies);
        console.log(`Seeded ${seedSource.policies.length} policies.`);
      }

      // Migrating Settings
      if (seedSource.settings && seedSource.settings.geminiKey) {
        await Setting.create({ key: 'geminiKey', value: seedSource.settings.geminiKey });
        console.log('Seeded settings config.');
      }

      console.log('Database seeding/migration finished successfully.');
    } catch (err) {
      console.error('Failed to seed database:', err);
    }
  },

  // Settings
  async getGeminiKey() {
    const setting = await Setting.findOne({ key: 'geminiKey' });
    return setting ? setting.value : '';
  },

  async saveGeminiKey(key) {
    await Setting.findOneAndUpdate(
      { key: 'geminiKey' },
      { value: key },
      { upsert: true, new: true }
    );
  },

  // Employees
  async getEmployees() {
    return await Employee.find().sort({ createdAt: 1 }).lean();
  },

  async addEmployee(empData) {
    const list = await Employee.find().lean();
    const newId = `EMP${String(list.length + 1).padStart(3, '0')}`;
    const employee = new Employee({
      id: newId,
      name: empData.name,
      email: empData.email,
      role: empData.role,
      password: empData.password,
      department: empData.department,
      designation: empData.designation,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      salary: parseFloat(empData.salary),
      leaveBalance: { casual: 12, medical: 10, earned: 18 },
      attendanceStats: { checkInCount: 0, totalHours: 0, onTimeRate: 100 },
      performanceScore: 85,
      avatar: empData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${empData.name}`
    });
    return await employee.save();
  },

  async toggleEmployeeStatus(id) {
    const emp = await Employee.findOne({ id });
    if (emp) {
      emp.status = emp.status === 'Active' ? 'Inactive' : 'Active';
      await emp.save();
      return emp.toObject();
    }
    return null;
  },

  // Attendance
  async getAttendance() {
    return await Attendance.find().sort({ date: -1, checkInTime: -1 }).lean();
  },

  async checkIn(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    const exists = await Attendance.findOne({ employeeId, date: today });
    if (exists) return exists.toObject();

    const time = new Date().toTimeString().split(' ')[0];
    const checkInHour = parseInt(time.split(':')[0]);
    
    // 09:00 AM limit for On Time
    const status = checkInHour < 9 || (checkInHour === 9 && parseInt(time.split(':')[1]) <= 15) ? 'On Time' : 'Late';
    
    const newEntry = new Attendance({
      id: `ATT${Date.now()}`,
      employeeId,
      date: today,
      checkInTime: time,
      checkOutTime: null,
      hoursWorked: null,
      status
    });

    await newEntry.save();

    // Update employee checkInCount
    const emp = await Employee.findOne({ id: employeeId });
    if (emp) {
      emp.attendanceStats.checkInCount += 1;
      
      // Recalculate onTimeRate
      const empAtt = await Attendance.find({ employeeId });
      const onTimeCount = empAtt.filter(a => a.status === 'On Time').length;
      emp.attendanceStats.onTimeRate = Math.round((onTimeCount / empAtt.length) * 100);
      await emp.save();
    }

    return newEntry.toObject();
  },

  async checkOut(employeeId) {
    const today = new Date().toISOString().split('T')[0];
    const entry = await Attendance.findOne({ employeeId, date: today, checkOutTime: null });
    
    if (!entry) return null;

    const time = new Date().toTimeString().split(' ')[0];
    entry.checkOutTime = time;

    // Calculate hours worked
    const [inH, inM, inS] = entry.checkInTime.split(':').map(Number);
    const [outH, outM, outS] = time.split(':').map(Number);
    const inDate = new Date(2000, 0, 1, inH, inM, inS);
    const outDate = new Date(2000, 0, 1, outH, outM, outS);
    const hours = Math.round(((outDate - inDate) / 1000 / 60 / 60) * 100) / 100;
    
    entry.hoursWorked = hours;
    await entry.save();

    // Update employee stats
    const emp = await Employee.findOne({ id: employeeId });
    if (emp) {
      emp.attendanceStats.totalHours = Math.round((emp.attendanceStats.totalHours + hours) * 10) / 10;
      await emp.save();
    }

    return entry.toObject();
  },

  // Leaves
  async getLeaves() {
    return await Leave.find().sort({ createdAt: -1 }).lean();
  },

  async requestLeave(employeeId, leaveType, startDate, endDate, reason) {
    const emp = await Employee.findOne({ id: employeeId });
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const newRequest = new Leave({
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
    });

    await newRequest.save();
    return newRequest.toObject();
  },

  async approveLeave(leaveId, approverName) {
    const leave = await Leave.findOne({ id: leaveId });
    if (!leave) return null;

    if (leave.status !== 'Pending') return leave.toObject();

    leave.status = 'Approved';
    leave.approvedBy = approverName;
    
    // Deduct leave balance
    const emp = await Employee.findOne({ id: leave.employeeId });
    if (emp) {
      const typeKey = leave.leaveType.toLowerCase();
      if (emp.leaveBalance[typeKey] !== undefined) {
        emp.leaveBalance[typeKey] = Math.max(0, emp.leaveBalance[typeKey] - leave.totalDays);
      }
      await emp.save();
    }

    await leave.save();
    return leave.toObject();
  },

  async rejectLeave(leaveId, approverName) {
    const leave = await Leave.findOne({ id: leaveId });
    if (!leave) return null;

    leave.status = 'Rejected';
    leave.approvedBy = approverName;
    await leave.save();
    return leave.toObject();
  },

  // Jobs
  async getJobs() {
    return await Job.find().sort({ createdAt: -1 }).lean();
  },

  async createJob(title, department, type, location, description) {
    const list = await Job.find().lean();
    const newJob = new Job({
      id: `JOB${String(list.length + 1).padStart(3, '0')}`,
      title,
      department,
      type,
      location,
      status: 'Open',
      description,
      candidatesCount: 0
    });
    await newJob.save();
    return newJob.toObject();
  },

  // Candidates
  async getCandidates() {
    return await Candidate.find().sort({ createdAt: -1 }).lean();
  },

  async addCandidate(jobId, name, email, resumeText) {
    const job = await Job.findOne({ id: jobId });
    
    const newCandidate = new Candidate({
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
    });

    await newCandidate.save();

    // Update job candidates count
    if (job) {
      job.candidatesCount += 1;
      await job.save();
    }

    return newCandidate.toObject();
  },

  async updateCandidateEvaluation(id, status, matchScore, evaluation) {
    const cand = await Candidate.findOne({ id });
    if (cand) {
      cand.status = status;
      cand.matchScore = matchScore;
      cand.evaluation = evaluation;
      await cand.save();
      return cand.toObject();
    }
    return null;
  },

  async updateCandidateInterviewReport(id, status, matchScore, interviewReport) {
    const cand = await Candidate.findOne({ id });
    if (cand) {
      cand.status = status;
      cand.matchScore = matchScore;
      cand.interviewReport = interviewReport;
      await cand.save();
      return cand.toObject();
    }
    return null;
  },

  // Policies
  async getPolicies() {
    return await Policy.find().lean();
  }
};

// Initialize data files / connection on start
db.init();
export default db;
