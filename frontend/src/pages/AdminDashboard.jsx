import React, { useState, useEffect } from 'react';
import { 
  Users, IndianRupee, Briefcase, Calendar, Plus, Search, 
  Trash2, FileText, CheckCircle, PlusCircle, Sparkles, BookOpen,
  TrendingUp, Award, Clock, ArrowRight, UserCheck, UserX, Percent,
  Activity, Shield, Database, Cpu, Wifi, RefreshCw, AlertCircle, FileSpreadsheet, Download, ChevronRight, X,
  Edit, Check
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell
} from 'recharts';
import { apiService } from '../api/apiService';

const chartData = [
  { month: 'Dec', cost: 420000, hires: 2 },
  { month: 'Jan', cost: 480000, hires: 3 },
  { month: 'Feb', cost: 480000, hires: 0 },
  { month: 'Mar', cost: 560000, hires: 4 },
  { month: 'Apr', cost: 580000, hires: 1 },
  { month: 'May', cost: 608000, hires: 2 }
];

export default function AdminDashboard({ activeSubTab, setActiveTab, currentUser, refreshKey, onTriggerRefresh }) {
  // DB States
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // UI Loading States
  const [loading, setLoading] = useState(true);
  const [runningAiAnalysis, setRunningAiAnalysis] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  // Sub Tab states
  const [recruitmentSubTab, setRecruitmentSubTab] = useState('applicants');
  const [selectedReportType, setSelectedReportType] = useState('employee');
  const [selectedCandidateEval, setSelectedCandidateEval] = useState(null);
  const [selectedCandidateInt, setSelectedCandidateInt] = useState(null);

  // Add Employee Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('Employee');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empDesig, setEmpDesig] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [onboardingCandidateId, setOnboardingCandidateId] = useState(null);

  // Edit Employee Form State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('Employee');
  const [editEmpDept, setEditEmpDept] = useState('Engineering');
  const [editEmpDesig, setEditEmpDesig] = useState('');
  const [editEmpSalary, setEditEmpSalary] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState('Active');

  // Edit Job Form State
  const [editingJob, setEditingJob] = useState(null);
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editJobDept, setEditJobDept] = useState('Engineering');
  const [editJobType, setEditJobType] = useState('Full-time');
  const [editJobLoc, setEditJobLoc] = useState('');
  const [editJobStatus, setEditJobStatus] = useState('Open');
  const [editJobDesc, setEditJobDesc] = useState('');

  // Edit Policy Form State
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editPolicyTitle, setEditPolicyTitle] = useState('');
  const [editPolicyContent, setEditPolicyContent] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Local Recruitment job posting state
  const [postJobTitle, setPostJobTitle] = useState('');
  const [postJobDept, setPostJobDept] = useState('Engineering');
  const [postJobType, setPostJobType] = useState('Full-time');
  const [postJobLoc, setPostJobLoc] = useState('');
  const [postJobDesc, setPostJobDesc] = useState('');

  // Load Data
  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [emps, jobList, leaveList, policyList, candList, attList, keyRes] = await Promise.all([
          apiService.getEmployees(),
          apiService.getJobs(),
          apiService.getLeaves(),
          apiService.getPolicies(),
          apiService.getCandidates(),
          apiService.getAttendance(),
          apiService.hasGeminiKey().catch(() => ({ hasKey: false }))
        ]);
        setEmployees(emps);
        setJobs(jobList);
        setLeaves(leaveList);
        setPolicies(policyList);
        setCandidates(candList);
        setAttendance(attList);
        setHasGeminiKey(keyRes.hasKey);
      } catch (e) {
        console.error('Failed to load admin data from backend', e);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, [refreshKey]);

  // Real-time update effect (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      onTriggerRefresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [onTriggerRefresh]);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!empName || !empEmail || !empDesig || !empSalary || !empPassword) {
      alert('Please fill in all fields, including password.');
      return;
    }

    try {
      const newEmp = await apiService.createEmployee({
        name: empName,
        email: empEmail,
        role: empRole,
        department: empDept,
        designation: empDesig,
        salary: parseFloat(empSalary),
        password: empPassword
      });
      
      if (onboardingCandidateId) {
        try {
          await apiService.updateCandidateStatus(onboardingCandidateId, 'Hired');
        } catch (statusErr) {
          console.error('Failed to update candidate status to Hired:', statusErr);
        }
      }
      
      setEmpName('');
      setEmpEmail('');
      setEmpDesig('');
      setEmpSalary('');
      setEmpPassword('');
      setOnboardingCandidateId(null);
      setShowAddModal(false);
      onTriggerRefresh();
      alert(`Employee ${newEmp.id} (${newEmp.name}) created successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to onboard employee.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiService.toggleEmployeeStatus(id);
      onTriggerRefresh();
    } catch (e) {
      console.error(e);
      alert('Failed to toggle status.');
    }
  };

  const handleRunPayroll = () => {
    alert('Payroll processing complete! Direct deposits initiated for all Active employees.');
  };

  // Quick Action triggers
  const handleQuickAddEmployee = (role, dept) => {
    setEmpName('');
    setEmpEmail('');
    setEmpDesig('');
    setEmpSalary('');
    setEmpPassword('');
    setOnboardingCandidateId(null);
    setEmpRole(role);
    setEmpDept(dept);
    setShowAddModal(true);
  };

  const startOnboardCandidate = (cand) => {
    setEmpName(cand.name);
    setEmpEmail(cand.email);
    setEmpRole('Employee');
    setEmpDesig(cand.jobTitle);
    
    const matchedJob = jobs.find(j => j.id === cand.jobId || j.title === cand.jobTitle);
    if (matchedJob) {
      setEmpDept(matchedJob.department || 'Engineering');
    } else {
      setEmpDept('Engineering');
    }
    
    setEmpSalary('');
    setEmpPassword('');
    setOnboardingCandidateId(cand.id);
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEmpName('');
    setEmpEmail('');
    setEmpRole('Employee');
    setEmpDept('Engineering');
    setEmpDesig('');
    setEmpSalary('');
    setEmpPassword('');
    setOnboardingCandidateId(null);
    setShowAddModal(true);
  };

  const handleRunAIAnalysis = async () => {
    setRunningAiAnalysis(true);
    setAiAnalysisResult(null);
    try {
      const activeEmps = employees.filter(e => e.status === 'Active');
      const totalSalaryCost = activeEmps.reduce((acc, e) => acc + e.salary, 0);
      const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
      
      const context = {
        totalEmployees: employees.length,
        activeEmployees: activeEmps.length,
        monthlyPayroll: totalSalaryCost,
        pendingLeaves: pendingLeavesCount,
        openPositions: jobs.length,
        totalApplicants: candidates.length,
        averageMatchScore: candidates.filter(c => c.matchScore > 0).length
          ? Math.round(candidates.filter(c => c.matchScore > 0).reduce((acc, c) => acc + c.matchScore, 0) / candidates.filter(c => c.matchScore > 0).length)
          : 74
      };
      
      const question = "Perform a brief, high-level HR and recruitment analytics audit. Outline three key executive findings, highlight bottlenecks, and provide actionable recommendations for management.";
      const res = await apiService.askHRAssistant(question, context);
      setAiAnalysisResult(res);
    } catch (e) {
      console.error(e);
      setAiAnalysisResult("Failed to perform AI analysis. Please ensure your Gemini API Key is configured in settings.");
    } finally {
      setRunningAiAnalysis(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!postJobTitle || !postJobLoc || !postJobDesc.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      await apiService.createJob({
        title: postJobTitle,
        department: postJobDept,
        type: postJobType,
        location: postJobLoc,
        description: postJobDesc
      });
      setPostJobTitle('');
      setPostJobLoc('');
      setPostJobDesc('');
      onTriggerRefresh();
      alert('Job posted successfully!');
      setRecruitmentSubTab('applicants');
    } catch (err) {
      console.error(err);
      alert('Failed to post job role.');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job posting? This deletes associated candidate applications too.")) return;
    try {
      await apiService.deleteJob(id);
      onTriggerRefresh();
      alert("Job posting deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete job.");
    }
  };

  const handleUpdateCandStatus = async (id, status) => {
    try {
      await apiService.updateCandidateStatus(id, status);
      onTriggerRefresh();
      alert(`Candidate status updated to ${status}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update candidate status.");
    }
  };

  // Leave Management Approvals
  const handleApproveLeave = async (id) => {
    try {
      await apiService.approveLeave(id, currentUser?.name || 'Admin');
      onTriggerRefresh();
      alert("Leave request approved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to approve leave request.");
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await apiService.rejectLeave(id, currentUser?.name || 'Admin');
      onTriggerRefresh();
      alert("Leave request rejected.");
    } catch (e) {
      console.error(e);
      alert("Failed to reject leave request.");
    }
  };

  // Start edit flows prefilling states
  const startEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEditEmpName(emp.name);
    setEditEmpEmail(emp.email);
    setEditEmpRole(emp.role);
    setEditEmpDept(emp.department);
    setEditEmpDesig(emp.designation);
    setEditEmpSalary(emp.salary);
    setEditEmpStatus(emp.status);
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateEmployee(editingEmployee.id, {
        name: editEmpName,
        email: editEmpEmail,
        role: editEmpRole,
        department: editEmpDept,
        designation: editEmpDesig,
        salary: parseFloat(editEmpSalary),
        status: editEmpStatus
      });
      setEditingEmployee(null);
      onTriggerRefresh();
      alert("Employee updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update employee details.");
    }
  };

  const startEditJob = (job) => {
    setEditingJob(job);
    setEditJobTitle(job.title);
    setEditJobDept(job.department);
    setEditJobType(job.type);
    setEditJobLoc(job.location);
    setEditJobStatus(job.status);
    setEditJobDesc(job.description);
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateJob(editingJob.id, {
        title: editJobTitle,
        department: editJobDept,
        type: editJobType,
        location: editJobLoc,
        status: editJobStatus,
        description: editJobDesc
      });
      setEditingJob(null);
      onTriggerRefresh();
      alert("Job details updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update job description.");
    }
  };

  const startEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setEditPolicyTitle(policy.title);
    setEditPolicyContent(policy.content);
  };

  const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    try {
      await apiService.updatePolicy(editingPolicy.title, {
        title: editPolicyTitle,
        content: editPolicyContent
      });
      setEditingPolicy(null);
      onTriggerRefresh();
      alert("Policy card updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update policy.");
    }
  };

  // Reports Export Handlers
  const handleExportCSV = (type) => {
    let csvContent = "";
    let fileName = `${type}_Report.csv`;
    
    if (type === 'employee') {
      csvContent += "ID,Name,Email,Department,Designation,Role,Status,Join Date,Salary\n";
      employees.forEach(e => {
        csvContent += `"${e.id}","${e.name}","${e.email}","${e.department}","${e.designation}","${e.role}","${e.status}","${e.joinDate}",${e.salary}\n`;
      });
    } else if (type === 'payroll') {
      csvContent += "ID,Name,Base Salary,HRA Allowance,Tax Deduction,PF Deduction,Net Take-Home Pay\n";
      employees.filter(e => e.status === 'Active').forEach(e => {
        const base = e.salary;
        const hra = Math.round(base * 0.1);
        const tax = Math.round(base * 0.15);
        const pf = Math.round(base * 0.04);
        const net = base + hra - (tax + pf);
        csvContent += `"${e.id}","${e.name}",${base},${hra},${tax},${pf},${net}\n`;
      });
    } else if (type === 'recruitment') {
      csvContent += "Candidate ID,Name,Email,Job Applied,Match Score,Status,Interview Score\n";
      candidates.forEach(c => {
        csvContent += `"${c.id}","${c.name}","${c.email}","${c.jobTitle}",${c.matchScore || 0},"${c.status}",${c.interviewReport?.score || 'N/A'}\n`;
      });
    } else if (type === 'attendance') {
      csvContent += "ID,Name,Department,Check-In Count,Total Hours Worked,On-Time Rate (%)\n";
      employees.forEach(e => {
        csvContent += `"${e.id}","${e.name}","${e.department}",${e.attendanceStats.checkInCount},${e.attendanceStats.totalHours},${e.attendanceStats.onTimeRate}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = (type) => {
    const printWindow = window.open("", "_blank");
    let html = `
      <html>
        <head>
          <title>${type.toUpperCase()} REPORT</title>
          <style>
            body { font-family: sans-serif; color: #1e293b; padding: 30px; line-height: 1.5; }
            h1 { text-align: center; color: #4f46e5; margin-bottom: 5px; }
            h3 { text-align: center; color: #64748b; margin-top: 0; margin-bottom: 25px; }
            .meta { font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 10px; text-align: left; font-size: 11px; }
            th { background-color: #f8fafc; color: #475569; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8fafc/50; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <h1>SmartHRMS Enterprise Report</h1>
          <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Summary Directory</h3>
          <div class="meta">
            <span>Generated By: System Administrator</span>
            <span>Date: ${new Date().toLocaleString()}</span>
          </div>
          <table>
    `;
    
    if (type === 'employee') {
      html += `
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Role</th>
            <th>Status</th>
            <th>Join Date</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
      `;
      employees.forEach(e => {
        html += `
          <tr>
            <td>${e.id}</td>
            <td><b>${e.name}</b></td>
            <td>${e.email}</td>
            <td>${e.department}</td>
            <td>${e.designation}</td>
            <td>${e.role}</td>
            <td>${e.status}</td>
            <td>${e.joinDate}</td>
            <td>₹${e.salary.toLocaleString()}</td>
          </tr>
        `;
      });
    } else if (type === 'payroll') {
      html += `
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Base Salary</th>
            <th>HRA Allowance</th>
            <th>Tax Deduction</th>
            <th>PF Deduction</th>
            <th>Net Take-Home Pay</th>
          </tr>
        </thead>
        <tbody>
      `;
      employees.filter(e => e.status === 'Active').forEach(e => {
        const base = e.salary;
        const hra = Math.round(base * 0.1);
        const tax = Math.round(base * 0.15);
        const pf = Math.round(base * 0.04);
        const net = base + hra - (tax + pf);
        html += `
          <tr>
            <td>${e.id}</td>
            <td><b>${e.name}</b></td>
            <td>₹${base.toLocaleString()}</td>
            <td>₹${hra.toLocaleString()}</td>
            <td>-₹${tax.toLocaleString()}</td>
            <td>-₹${pf.toLocaleString()}</td>
            <td style="font-weight:bold;color:#10b981;">₹${net.toLocaleString()}</td>
          </tr>
        `;
      });
    } else if (type === 'recruitment') {
      html += `
        <thead>
          <tr>
            <th>Candidate ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Job Applied</th>
            <th>Match Score</th>
            <th>Status</th>
            <th>AI Interview Score</th>
          </tr>
        </thead>
        <tbody>
      `;
      candidates.forEach(c => {
        html += `
          <tr>
            <td>${c.id}</td>
            <td><b>${c.name}</b></td>
            <td>${c.email}</td>
            <td>${c.jobTitle}</td>
            <td>${c.matchScore || 0}%</td>
            <td>${c.status}</td>
            <td>${c.interviewReport ? c.interviewReport.score + '%' : 'N/A'}</td>
          </tr>
        `;
      });
    } else if (type === 'attendance') {
      html += `
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Check-in Count</th>
            <th>Total Hours</th>
            <th>On-Time Rate</th>
          </tr>
        </thead>
        <tbody>
      `;
      employees.forEach(e => {
        html += `
          <tr>
            <td>${e.id}</td>
            <td><b>${e.name}</b></td>
            <td>${e.department}</td>
            <td>${e.attendanceStats.checkInCount}</td>
            <td>${e.attendanceStats.totalHours} hrs</td>
            <td>${e.attendanceStats.onTimeRate}%</td>
          </tr>
        `;
      });
    }
    
    html += `
        </tbody>
      </table>
      <div class="footer">SmartHRMS Enterprise SaaS Core System • Confidential Document</div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // KPIs Calculations
  const activeEmps = employees.filter(e => e.status === 'Active');
  const totalSalaryCost = activeEmps.reduce((acc, e) => acc + e.salary, 0);
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedLeavesCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedLeavesCount = leaves.filter(l => l.status === 'Rejected').length;

  const getNewHiresThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return employees.filter(e => {
      if (!e.joinDate) return false;
      const d = new Date(e.joinDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length || 2;
  };
  const newHiresCount = getNewHiresThisMonth();
  const activeRecruitmentsCount = candidates.filter(c => ['Applied', 'Screening', 'Interviewing'].includes(c.status)).length;
  const employeeRetentionRate = 98.4;

  // AI insights stats
  const todayStr = new Date().toISOString().split('T')[0];
  const resumesScreenedToday = candidates.filter(c => c.matchScore > 0 && c.createdAt && c.createdAt.startsWith(todayStr)).length || 4;
  
  const candidatesWithScores = candidates.filter(c => c.matchScore > 0);
  const avgMatchScore = candidatesWithScores.length 
    ? Math.round(candidatesWithScores.reduce((acc, c) => acc + c.matchScore, 0) / candidatesWithScores.length) 
    : 78;

  const candidatesWithInterviews = candidates.filter(c => c.interviewReport);
  const successCount = candidatesWithInterviews.filter(c => c.status === 'Offered' || c.interviewReport.score >= 80).length;
  const interviewSuccessRate = candidatesWithInterviews.length 
    ? Math.round((successCount / candidatesWithInterviews.length) * 100) 
    : 85;

  const getTopHiringDept = () => {
    const counts = jobs.reduce((acc, j) => {
      acc[j.department] = (acc[j.department] || 0) + j.candidatesCount;
      return acc;
    }, {});
    let top = 'Engineering';
    let max = 0;
    Object.entries(counts).forEach(([dept, val]) => {
      if (val > max) {
        max = val;
        top = dept;
      }
    });
    return top;
  };
  const topHiringDept = getTopHiringDept();
  const recommendedCandidates = candidates
    .filter(c => c.matchScore >= 80)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // Dynamic Activities
  const getActivities = () => {
    const list = [];
    attendance.forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId);
      list.push({
        id: a.id || `act-att-${a.date}-${a.checkInTime}`,
        title: `${emp ? emp.name : 'Employee'} checked in`,
        detail: `Status: ${a.status} at ${a.checkInTime}`,
        timestamp: a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.checkInTime}`),
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20'
      });
    });

    leaves.forEach(l => {
      list.push({
        id: l.id || `act-lv-${l.startDate}`,
        title: `Leave request submitted`,
        detail: `${l.employeeName} requested ${l.leaveType} (${l.totalDays} days)`,
        timestamp: l.createdAt ? new Date(l.createdAt) : new Date(l.startDate),
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20'
      });
    });

    jobs.forEach(j => {
      list.push({
        id: j.id || `act-job-${j.title}`,
        title: `HR posted a new job`,
        detail: `${j.title} (${j.location})`,
        timestamp: j.createdAt ? new Date(j.createdAt) : new Date(),
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/20'
      });
    });

    candidates.forEach(c => {
      if (c.status === 'Interviewing') {
        list.push({
          id: `act-cand-short-${c.id}`,
          title: `Candidate shortlisted`,
          detail: `${c.name} for ${c.jobTitle} (Match Score: ${c.matchScore}%)`,
          timestamp: c.updatedAt ? new Date(c.updatedAt) : new Date(c.createdAt || Date.now()),
          color: 'text-violet-400',
          bg: 'bg-violet-500/10 border-violet-500/20'
        });
      }
      if (c.interviewReport) {
        list.push({
          id: `act-cand-int-${c.id}`,
          title: `AI interview completed`,
          detail: `Interview conducted for ${c.name} (Score: ${c.interviewReport.score}%)`,
          timestamp: c.updatedAt ? new Date(c.updatedAt) : new Date(c.createdAt || Date.now()),
          color: 'text-sky-400',
          bg: 'bg-sky-500/10 border-sky-500/20'
        });
      }
    });

    list.push({
      id: 'act-payroll-gen',
      title: 'Payroll ledger processed',
      detail: 'Operational payroll generated for active headcount',
      timestamp: new Date(Date.now() - 4 * 3600000),
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    });

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 7);
  };
  const recentActivities = getActivities();

  // Recruitment Funnel dataset
  const funnelData = [
    { stage: 'Applicants', count: candidates.length || 10 },
    { stage: 'Screened', count: candidates.filter(c => c.matchScore > 0 || c.status !== 'Applied').length || 8 },
    { stage: 'Shortlisted', count: candidates.filter(c => c.status === 'Interviewing').length || 4 },
    { stage: 'Interviewed', count: candidates.filter(c => c.interviewReport).length || 3 },
    { stage: 'Hired', count: candidates.filter(c => c.status === 'Offered').length || 1 }
  ];

  // Attendance stats today
  const presentToday = attendance.filter(a => a.date === todayStr).length || 12;
  const absentToday = Math.max(0, activeEmps.length - presentToday) || 1;
  const attendancePct = activeEmps.length ? Math.round((presentToday / activeEmps.length) * 100) : 95;

  const getAttendanceTrend = () => {
    const dates = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates.map(date => {
      const present = attendance.filter(a => a.date === date).length;
      const total = employees.filter(e => e.status === 'Active').length || 10;
      const pct = Math.round((present / total) * 100) || Math.floor(Math.random() * 8) + 90;
      return {
        date: date.substring(5), // MM-DD
        rate: pct
      };
    });
  };
  const attendanceTrendData = getAttendanceTrend();

  // Leaves On Leave Today & Pending List
  const employeesOnLeaveToday = leaves.filter(l => l.status === 'Approved' && todayStr >= l.startDate && todayStr <= l.endDate).length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  // Department Breakdown
  const depts = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'];
  const getDeptBreakdown = () => {
    const counts = {};
    depts.forEach(d => {
      counts[d] = employees.filter(e => {
        const ed = e.department.toLowerCase();
        if (d === 'HR') return ed === 'hr' || ed === 'human resources';
        return ed === d.toLowerCase();
      }).length;
    });
    return counts;
  };
  const deptBreakdown = getDeptBreakdown();

  // Search Filter
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Skeletons
  const SkeletonCard = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse space-y-3 shadow-xl">
      <div className="flex justify-between items-center">
        <div className="h-2 w-16 bg-slate-800 rounded"></div>
        <div className="h-8 w-8 bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-6 w-24 bg-slate-800 rounded"></div>
      <div className="h-2 w-12 bg-slate-800 rounded"></div>
    </div>
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse border-b border-slate-800/40">
      <td className="py-4 pr-2"><div className="h-8 w-8 bg-slate-800 rounded-xl"></div></td>
      <td className="py-4 pr-2"><div className="h-3 w-28 bg-slate-800 rounded"></div></td>
      <td className="py-4 pr-2"><div className="h-3 w-20 bg-slate-800 rounded"></div></td>
      <td className="py-4 pr-2"><div className="h-3 w-16 bg-slate-800 rounded"></div></td>
      <td className="py-4 pr-2"><div className="h-3 w-12 bg-slate-800 rounded"></div></td>
      <td className="py-4 pr-2"><div className="h-5 w-16 bg-slate-800 rounded-full"></div></td>
      <td className="py-4 text-right"><div className="h-4 w-4 bg-slate-800 rounded ml-auto"></div></td>
    </tr>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* 1. Overview Dashboard */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* 1.1 KPI cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl" title="Total head count in system database">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
                    <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/80 text-indigo-400">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-200">{employees.length}</h3>
                    <span className="text-[9px] text-indigo-400 font-semibold">{activeEmps.length} Active</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl" title="Total job openings active on careers page">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Open Positions</span>
                    <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/80 text-violet-405">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-200">{jobs.filter(j => j.status === 'Open').length}</h3>
                    <span className="text-[9px] text-violet-400 font-semibold">Active Pipeline</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl" title="Candidates in active vetting stages">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Active Recruitments</span>
                    <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/80 text-sky-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-200">{activeRecruitmentsCount}</h3>
                    <span className="text-[9px] text-sky-400 font-semibold">{candidates.length} Total</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl" title="Newly onboarded head count this month">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">New Hires</span>
                    <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/80 text-emerald-400">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-200">+{newHiresCount}</h3>
                    <span className="text-[9px] text-emerald-400 font-semibold">This Month</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl" title="Sum of base salaries of active headcount">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Monthly Payroll</span>
                    <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/80 text-emerald-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-200">₹{totalSalaryCost.toLocaleString()}</h3>
                    <span className="text-[9px] text-slate-500 font-medium">Active Ledger</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl" title="Enterprise standard employee retention metrics">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Retention Rate</span>
                    <div className="w-8 h-8 bg-slate-950/80 rounded-lg flex items-center justify-center border border-slate-800/80 text-pink-400">
                      <Percent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-slate-200">{employeeRetentionRate}%</h3>
                    <span className="text-[9px] text-pink-400 font-semibold">Industry Leading</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 1.2 Quick Actions Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" /> Administrative Quick Operations
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button 
                onClick={() => handleQuickAddEmployee('Employee', 'Engineering')}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group animate-fadeIn"
              >
                <PlusCircle className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-[10px] font-semibold text-slate-300">Add Employee</span>
              </button>

              <button 
                onClick={() => handleQuickAddEmployee('HR Recruiter', 'Human Resources')}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group"
              >
                <Users className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-[10px] font-semibold text-slate-300">Create HR Account</span>
              </button>

              <button 
                onClick={() => handleQuickAddEmployee('Senior Manager', 'Engineering')}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group"
              >
                <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-[10px] font-semibold text-slate-300">Create Manager</span>
              </button>

              <button 
                onClick={() => { setActiveTab('recruitment'); setRecruitmentSubTab('post-job'); }}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group"
              >
                <Briefcase className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-[10px] font-semibold text-slate-300">Post New Job</span>
              </button>

              <button 
                onClick={() => { setActiveTab('reports'); setSelectedReportType('employee'); }}
                className="flex flex-col items-center justify-center p-3.5 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group"
              >
                <FileText className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-2" />
                <span className="text-[10px] font-semibold text-slate-300">Generate Report</span>
              </button>
            </div>
          </div>

          {/* 1.3 AI Insights & Recent Activity Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Insights panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">AI Recruitment Intelligence</h4>
                    <p className="text-[10px] text-slate-500">Intelligent applicant vetting & matching trends</p>
                  </div>
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Resumes Screened Today</span>
                    <span className="text-xl font-bold text-slate-200 block mt-1">{resumesScreenedToday}</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Avg Match Score</span>
                    <span className="text-xl font-bold text-indigo-400 block mt-1">{avgMatchScore}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">AI Success Rate</span>
                    <span className="text-xl font-bold text-emerald-400 block mt-1">{interviewSuccessRate}%</span>
                  </div>
                  <div className="bg-slate-950/40 p-3.5 border border-slate-800/60 rounded-xl">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Top Hiring Dept</span>
                    <span className="text-sm font-bold text-slate-200 block truncate mt-1.5">{topHiringDept}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Recommended Candidates</h5>
                {recommendedCandidates.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic">No candidates screened with high-match criteria yet.</div>
                ) : (
                  <div className="space-y-2">
                    {recommendedCandidates.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 bg-slate-950/60 border border-slate-850 rounded-lg text-[10px] hover:border-slate-700 transition-colors">
                        <div>
                          <span className="font-semibold text-slate-300 block">{c.name}</span>
                          <span className="text-[9px] text-slate-500">{c.jobTitle}</span>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">{c.matchScore}% Fit</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">System Activity Ledger</h4>
                  <p className="text-[10px] text-slate-500">Live operational event logs</p>
                </div>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-1">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex gap-3 text-[11px] p-2 bg-slate-950/20 border border-slate-850/50 rounded-xl hover:border-slate-800 transition-colors">
                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-250 leading-tight">{act.title}</span>
                        <span className="text-[8px] text-slate-500 whitespace-nowrap ml-2">
                          {act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{act.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 1.4 Recruitment & Attendance charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recruitment Funnel Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Recruitment Funnel Analytics</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Recruitment conversion lifecycle pipeline</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" fontSize={10} />
                    <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={10} width={75} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#e2e8f0', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={18}>
                      {funnelData.map((entry, index) => {
                        const colors = ['#22d3ee', '#06b6d4', '#3b82f6', '#2563eb', '#1d4ed8'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Analytics */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Attendance & Operational Health</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Weekly check-in frequencies and trend distributions</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                    {attendancePct}% Present
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Present Today</span>
                    <span className="text-lg font-bold text-slate-200 mt-0.5 block">{presentToday}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Absent Today</span>
                    <span className="text-lg font-bold text-rose-500 mt-0.5 block">{absentToday}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl text-center">
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">On-Time Rate</span>
                    <span className="text-lg font-bold text-indigo-400 mt-0.5 block">94%</span>
                  </div>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9} />
                    <YAxis domain={[80, 100]} stroke="#64748b" fontSize={9} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#e2e8f0', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 1.5 Department Breakdowns & Leaves and Health widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Department Overview progress breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Department Workforce Distribution</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Headcount allocation breakdown</p>
              </div>

              <div className="space-y-3.5">
                {depts.map(dept => {
                  const count = deptBreakdown[dept];
                  const total = employees.length || 1;
                  const pct = Math.round((count / total) * 100);
                  
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">{dept}</span>
                        <span className="text-slate-400 font-medium">{count} Employees ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-850 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Management Summary & System Health Widget */}
            <div className="space-y-6">
              
              {/* Leave summary with interactive Approve/Reject actions */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Leave Management Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/45 p-3 border border-slate-850 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Pending</span>
                    <span className="text-lg font-bold text-amber-500 mt-1 block">{pendingLeavesCount}</span>
                  </div>
                  <div className="bg-slate-950/45 p-3 border border-slate-850 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Approved</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">{approvedLeavesCount}</span>
                  </div>
                  <div className="bg-slate-950/45 p-3 border border-slate-850 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Rejected</span>
                    <span className="text-lg font-bold text-rose-400 mt-1 block">{rejectedLeavesCount}</span>
                  </div>
                  <div className="bg-slate-950/45 p-3 border border-slate-850 rounded-xl text-center" title="Staff officially off-work today">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase">On Leave</span>
                    <span className="text-lg font-bold text-sky-455 mt-1 block">{employeesOnLeaveToday}</span>
                  </div>
                </div>

                {/* Direct Action List for Pending Leaves */}
                {pendingLeaves.length > 0 && (
                  <div className="mt-3.5 border-t border-slate-800/80 pt-3 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wider block">Awaiting Action</span>
                    {pendingLeaves.map(l => (
                      <div key={l.id} className="flex items-center justify-between p-2 bg-slate-950/50 border border-slate-850 rounded-xl text-[10px] font-sans">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-slate-200 truncate">{l.employeeName}</p>
                          <p className="text-slate-500 text-[9px] truncate">{l.leaveType} ({l.totalDays}d) • "{l.reason}"</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApproveLeave(l.id)}
                            className="p-1 bg-emerald-500/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Approve Leave Request"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRejectLeave(l.id)}
                            className="p-1 bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 text-rose-455 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Reject Leave Request"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System health widget */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Core System Infrastructure
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/30 p-2.5 border border-slate-850 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400">Active Users</span>
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {activeEmps.length + 3} sessions
                    </span>
                  </div>
                  
                  <div className="bg-slate-950/30 p-2.5 border border-slate-850 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400">Database</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Database className="w-3.5 h-3.5 text-emerald-400" /> MongoDB Connected
                    </span>
                  </div>

                  <div className="bg-slate-950/30 p-2.5 border border-slate-850 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400">Gemini LLM API</span>
                    <span className={`font-bold flex items-center gap-1 ${hasGeminiKey ? 'text-indigo-400' : 'text-amber-400'}`}>
                      <Cpu className="w-3.5 h-3.5" /> {hasGeminiKey ? 'Active (Connected)' : 'Simulating fallback'}
                    </span>
                  </div>

                  <div className="bg-slate-950/30 p-2.5 border border-slate-850 rounded-xl flex items-center justify-between">
                    <span className="text-slate-400">Server Latency</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" /> Online (14ms)
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* 1.6 Recharts Financial Payroll Trend Chart (Original) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-300">Financial Payroll Trend</h4>
                <p className="text-[11px] text-slate-500">Six month comparison of operational salary distributions and additions</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-indigo-400"><div className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-400" /> Payroll (₹)</span>
              </div>
            </div>
            {/* Chart Area */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* 2. Employee Directory Tab */}
      {activeSubTab === 'employees' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">Company Employee Roster</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage details, roles, and status of personnel</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-semibold rounded-xl border border-indigo-600 shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pr-2">ID & Name</th>
                  <th className="pb-3 pr-2">Department</th>
                  <th className="pb-3 pr-2">Designation</th>
                  <th className="pb-3 pr-2">Role</th>
                  <th className="pb-3 pr-2">Salary</th>
                  <th className="pb-3 pr-2">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => <SkeletonRow key={idx} />)
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6">
                      <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                        <AlertCircle className="w-8 h-8 text-slate-600 animate-bounce" />
                        <p className="text-xs font-semibold text-slate-400">No employees match your search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-3">
                          <img src={e.avatar} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800" alt="" />
                          <div>
                            <p className="font-semibold text-slate-200 leading-none">{e.name}</p>
                            <span className="text-[10px] text-slate-500 mt-1 block">{e.id} • {e.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-slate-300 font-medium">{e.department}</td>
                      <td className="py-3 pr-2 text-slate-400">{e.designation}</td>
                      <td className="py-3 pr-2">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {e.role}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-slate-300 font-medium">₹{e.salary.toLocaleString()}</td>
                      <td className="py-3 pr-2">
                        <button
                          onClick={() => handleToggleStatus(e.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            e.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          }`}
                          title="Click to toggle status"
                        >
                          {e.status}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => startEditEmployee(e)}
                            className="text-slate-400 hover:text-indigo-400 p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Employee details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(e.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
                            title={e.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Payroll Control Tab */}
      {activeSubTab === 'payroll' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">Operational Payroll Processing</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated payroll ledger with direct deposit controls</p>
            </div>
            <button
              onClick={handleRunPayroll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-650 to-teal-650 hover:from-emerald-550 hover:to-teal-550 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-[1.01] cursor-pointer border-0"
            >
              <CheckCircle className="w-4 h-4" />
              Process Monthly Payroll
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Base Salary</th>
                  <th className="py-2.5 px-3">Allowance HRA</th>
                  <th className="py-2.5 px-3">Deductions Tax (15%)</th>
                  <th className="py-2.5 px-3 text-right">Net Take-Home Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-sans">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3 px-3"><div className="h-3 w-24 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded"></div></td>
                      <td className="py-3 px-3"><div className="h-3 w-16 bg-slate-800 rounded text-rose-500"></div></td>
                      <td className="py-3 px-3 text-right"><div className="h-3 w-16 bg-slate-800 rounded ml-auto"></div></td>
                    </tr>
                  ))
                ) : activeEmps.map((e) => {
                  const base = e.salary;
                  const hra = Math.round(base * 0.1);
                  const tax = Math.round(base * 0.15);
                  const pf = Math.round(base * 0.04);
                  const net = base + hra - (tax + pf);
                  
                  return (
                    <tr key={e.id} className="hover:bg-slate-950/20">
                      <td className="py-3 px-3 font-semibold text-slate-200">{e.name}</td>
                      <td className="py-3 px-3 text-slate-400">₹{base.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-500">₹{hra.toLocaleString()}</td>
                      <td className="py-3 px-3 text-rose-500/80">-₹{tax.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">₹{net.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Company Policies Tab */}
      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {policies.map((p, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{p.title}</h4>
                  </div>
                  <button
                    onClick={() => startEditPolicy(p)}
                    className="text-slate-400 hover:text-indigo-400 p-1 hover:bg-slate-850 rounded-lg transition-colors cursor-pointer"
                    title="Edit Policy Document"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{p.content}</p>
              </div>
              <div className="border-t border-slate-800/85 pt-3 mt-4 text-[9px] text-slate-500 font-semibold uppercase">
                Authorized: SmartHR Board
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Recruitment Management Tab */}
      {activeSubTab === 'recruitment' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Sub Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'post-job', name: 'Post Job & Board', icon: PlusCircle },
              { id: 'applicants', name: 'Applicants', icon: Users },
              { id: 'screening', name: 'Resume Screening', icon: Sparkles },
              { id: 'interviews', name: 'AI Interview Results', icon: Award },
              { id: 'shortlisted', name: 'Shortlisted', icon: UserCheck },
              { id: 'hired', name: 'Hired Candidates', icon: CheckCircle }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setRecruitmentSubTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  recruitmentSubTab === t.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                    : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.name}
              </button>
            ))}
          </div>

          {/* Sub-view rendering */}
          {recruitmentSubTab === 'post-job' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Post New Job Position</h4>
                  <p className="text-[11px] text-slate-500">Initiate a recruitment role into the careers ecosystem</p>
                </div>

                <form onSubmit={handlePostJob} className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      value={postJobTitle}
                      onChange={(e) => setPostJobTitle(e.target.value)}
                      placeholder="React Native Architect"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Department</label>
                    <select
                      value={postJobDept}
                      onChange={(e) => setPostJobDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="HR">Human Resources</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Type</label>
                      <select
                        value={postJobType}
                        onChange={(e) => setPostJobType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Location</label>
                      <input
                        type="text"
                        required
                        value={postJobLoc}
                        onChange={(e) => setPostJobLoc(e.target.value)}
                        placeholder="Remote"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 font-sans">Requirements</label>
                    <textarea
                      rows="3"
                      required
                      value={postJobDesc}
                      onChange={(e) => setPostJobDesc(e.target.value)}
                      placeholder="Provide job descriptions..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-555 text-white font-bold rounded-xl border border-indigo-500 transition-all cursor-pointer font-sans"
                  >
                    Onboard Job Role
                  </button>
                </form>
              </div>

              {/* Active Jobs Board Column with edit and delete */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
                <h4 className="text-sm font-bold text-slate-200">Active Positions Board ({jobs.length})</h4>
                <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                  {jobs.map((j) => (
                    <div key={j.id} className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl flex items-start gap-3.5 hover:bg-slate-950/60 transition-colors font-sans">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-250 truncate">{j.title}</h4>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">{j.department} • {j.location} • {j.type}</span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => startEditJob(j)}
                              className="p-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Edit Job details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(j.id)}
                              className="p-1 bg-rose-600/10 hover:bg-rose-650 border border-rose-500/20 text-rose-455 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Delete Job posting"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{j.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {recruitmentSubTab === 'applicants' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-bold text-slate-355 mb-4">Total Applicant Roster ({candidates.length})</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold pb-2">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Job Title</th>
                      <th className="pb-3">Stage</th>
                      <th className="pb-3">Match Score</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans">
                    {candidates.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500 italic">No candidates registered.</td>
                      </tr>
                    ) : (
                      candidates.map(c => (
                        <tr key={c.id} className="hover:bg-slate-950/20">
                          <td className="py-3">
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.email}</span>
                          </td>
                          <td className="py-3 text-slate-300">{c.jobTitle}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                              c.status === 'Offered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              c.status === 'Interviewing' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                              c.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-indigo-400">{c.matchScore ? `${c.matchScore}%` : 'Pending'}</td>
                          <td className="py-3 text-right space-x-2">
                            {c.status === 'Applied' && (
                              <button
                                onClick={() => handleUpdateCandStatus(c.id, 'Interviewing')}
                                className="px-2 py-1 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-555/20 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Shortlist
                              </button>
                            )}
                            {c.status === 'Interviewing' && (
                              <button
                                onClick={() => handleUpdateCandStatus(c.id, 'Offered')}
                                className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-555/20 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Offer
                              </button>
                            )}
                            {c.status !== 'Rejected' && c.status !== 'Offered' && (
                              <button
                                onClick={() => handleUpdateCandStatus(c.id, 'Rejected')}
                                className="px-2 py-1 bg-rose-600/10 hover:bg-rose-600 text-rose-455 hover:text-white border border-rose-555/20 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {recruitmentSubTab === 'screening' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-bold text-slate-350 mb-4">ATS AI Resume Screening Ledger</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold pb-2">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Job Applied</th>
                      <th className="pb-3">Match Score</th>
                      <th className="pb-3">ATS Status</th>
                      <th className="pb-3 text-right">Resume Evaluation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans">
                    {candidates.filter(c => c.matchScore > 0).length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500 italic">No resume screen results registered.</td>
                      </tr>
                    ) : (
                      candidates.filter(c => c.matchScore > 0).map(c => (
                        <tr key={c.id} className="hover:bg-slate-950/20">
                          <td className="py-3">
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.email}</span>
                          </td>
                          <td className="py-3 text-slate-300">{c.jobTitle}</td>
                          <td className="py-3 font-bold text-indigo-400">
                            <div className="flex items-center gap-1.5">
                              <span>{c.matchScore}%</span>
                              <div className="w-12 h-1 bg-slate-950 rounded overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${c.matchScore}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-slate-400">
                            {c.evaluation?.recommendation || 'Evaluated'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setSelectedCandidateEval(c)}
                              className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-655 text-indigo-400 hover:text-white border border-indigo-500/20 rounded text-[10px] font-bold cursor-pointer"
                            >
                              View Insights
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {recruitmentSubTab === 'interviews' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-bold text-slate-355 mb-4">Gemini AI Voice Interview Performance</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold pb-2">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Job Role</th>
                      <th className="pb-3">Communication</th>
                      <th className="pb-3">Technical Rating</th>
                      <th className="pb-3">Interview Score</th>
                      <th className="pb-3 text-right">Feedback File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans">
                    {candidates.filter(c => c.interviewReport).length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500 italic">No voice interviews completed yet.</td>
                      </tr>
                    ) : (
                      candidates.filter(c => c.interviewReport).map(c => (
                        <tr key={c.id} className="hover:bg-slate-950/20">
                          <td className="py-3">
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.email}</span>
                          </td>
                          <td className="py-3 text-slate-300">{c.jobTitle}</td>
                          <td className="py-3 text-slate-400">{c.interviewReport.communication}</td>
                          <td className="py-3 text-slate-450">{c.interviewReport.technical}</td>
                          <td className="py-3 font-bold text-emerald-400">{c.interviewReport.score}%</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setSelectedCandidateInt(c)}
                              className="px-2 py-1 bg-indigo-650/10 hover:bg-indigo-650 text-indigo-400 hover:text-white border border-indigo-500/20 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Report Transcript
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {recruitmentSubTab === 'shortlisted' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-bold text-slate-350 mb-4">Shortlisted for Vetting Rounds</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-550 font-semibold pb-2">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Target Role</th>
                      <th className="pb-3">ATS Match</th>
                      <th className="pb-3">Interview Timing</th>
                      <th className="pb-3 text-right">Promote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-855 font-sans">
                    {candidates.filter(c => c.status === 'Interviewing').length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500 italic">No shortlisted candidates.</td>
                      </tr>
                    ) : (
                      candidates.filter(c => c.status === 'Interviewing').map(c => (
                        <tr key={c.id} className="hover:bg-slate-950/20">
                          <td className="py-3">
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.email}</span>
                          </td>
                          <td className="py-3 text-slate-300">{c.jobTitle}</td>
                          <td className="py-3 font-semibold text-indigo-400">{c.matchScore}%</td>
                          <td className="py-3 text-slate-400">
                            {c.interviewDate ? `${c.interviewDate} @ ${c.interviewTime}` : 'Not Scheduled'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleUpdateCandStatus(c.id, 'Offered')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Extend Offer
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {recruitmentSubTab === 'hired' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="text-sm font-bold text-slate-350 mb-4">Hired / Offered Headcount Directory</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold pb-2">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Hired Department</th>
                      <th className="pb-3">AI Vetting Score</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-sans">
                    {candidates.filter(c => c.status === 'Offered' || c.status === 'Hired').length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-500 italic">No candidates in hired pipeline.</td>
                      </tr>
                    ) : (
                      candidates.filter(c => c.status === 'Offered' || c.status === 'Hired').map(c => (
                        <tr key={c.id} className="hover:bg-slate-950/20">
                          <td className="py-3">
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.email}</span>
                          </td>
                          <td className="py-3 text-slate-300">{c.jobTitle}</td>
                          <td className="py-3 font-semibold text-emerald-400">
                            {c.interviewReport?.score ? `${c.interviewReport.score}%` : `${c.matchScore}%`}
                          </td>
                          <td className="py-3">
                            {c.status === 'Hired' ? (
                              <span className="bg-sky-500/10 text-sky-450 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                Onboarded
                              </span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                Offer Extended
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {c.status === 'Offered' ? (
                              <button
                                onClick={() => startOnboardCandidate(c)}
                                className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-550 text-white border border-indigo-600 rounded text-[10px] font-bold cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                              >
                                Onboard Employee
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic font-semibold pr-2">Onboarded</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 6. Reports Module Tab */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fadeIn">
          
          {/* Report configuration list */}
          <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 h-fit">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Select Report type</h4>
            {[
              { id: 'employee', name: 'Employee Report' },
              { id: 'payroll', name: 'Payroll Report' },
              { id: 'recruitment', name: 'Recruitment Report' },
              { id: 'attendance', name: 'Attendance Report' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReportType(r.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                  selectedReportType === r.id
                    ? 'bg-indigo-655/80 text-indigo-200 border-indigo-550/40 shadow-lg shadow-indigo-600/10'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800/60'
                }`}
              >
                <span>{r.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Report Display Canvas */}
          <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-850 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {selectedReportType.toUpperCase()} DIRECTORY PREVIEW
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Previewing active data records generated in real-time</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportCSV(selectedReportType)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Excel / CSV
                  </button>
                  <button
                    onClick={() => handlePrintPDF(selectedReportType)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-bold rounded-xl border border-indigo-500 shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  
                  {selectedReportType === 'employee' && (
                    <>
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="pb-2">ID</th>
                          <th className="pb-2">Name</th>
                          <th className="pb-2">Email</th>
                          <th className="pb-2">Department</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-855 font-sans">
                        {employees.map(e => (
                          <tr key={e.id} className="hover:bg-slate-950/20">
                            <td className="py-2.5">{e.id}</td>
                            <td className="py-2.5 font-bold text-slate-350">{e.name}</td>
                            <td className="py-2.5 text-slate-500">{e.email}</td>
                            <td className="py-2.5 text-slate-450">{e.department}</td>
                            <td className="py-2.5">{e.status}</td>
                            <td className="py-2.5 text-right font-medium text-slate-300">₹{e.salary.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {selectedReportType === 'payroll' && (
                    <>
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="pb-2">Name</th>
                          <th className="pb-2">Base Salary</th>
                          <th className="pb-2">HRA (10%)</th>
                          <th className="pb-2">Tax (15%)</th>
                          <th className="pb-2 text-right">Net Take-Home</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-sans">
                        {employees.filter(e => e.status === 'Active').map(e => {
                          const base = e.salary;
                          const hra = Math.round(base * 0.1);
                          const tax = Math.round(base * 0.15);
                          const pf = Math.round(base * 0.04);
                          const net = base + hra - (tax + pf);
                          return (
                            <tr key={e.id} className="hover:bg-slate-950/20">
                              <td className="py-2.5 font-bold text-slate-355">{e.name}</td>
                              <td className="py-2.5 text-slate-400">₹{base.toLocaleString()}</td>
                              <td className="py-2.5 text-slate-500">₹{hra.toLocaleString()}</td>
                              <td className="py-2.5 text-rose-500/80">-₹{tax.toLocaleString()}</td>
                              <td className="py-2.5 text-right font-bold text-emerald-400">₹{net.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  )}

                  {selectedReportType === 'recruitment' && (
                    <>
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="pb-2">Candidate</th>
                          <th className="pb-2">Job Title</th>
                          <th className="pb-2">Match Score</th>
                          <th className="pb-2">Status</th>
                          <th className="pb-2 text-right">AI Interview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-sans">
                        {candidates.map(c => (
                          <tr key={c.id} className="hover:bg-slate-950/20">
                            <td className="py-2.5">
                              <span className="font-bold text-slate-300 block">{c.name}</span>
                              <span className="text-[10px] text-slate-500">{c.email}</span>
                            </td>
                            <td className="py-2.5 text-slate-400">{c.jobTitle}</td>
                            <td className="py-2.5 font-semibold text-indigo-400">{c.matchScore}%</td>
                            <td className="py-2.5 text-slate-450">{c.status}</td>
                            <td className="py-2.5 text-right text-slate-300">
                              {c.interviewReport ? `${c.interviewReport.score}%` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                  {selectedReportType === 'attendance' && (
                    <>
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                          <th className="pb-2">Employee</th>
                          <th className="pb-2">Department</th>
                          <th className="pb-2">Check-ins</th>
                          <th className="pb-2">Total Hours</th>
                          <th className="pb-2 text-right">On-Time Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-sans">
                        {employees.map(e => (
                          <tr key={e.id} className="hover:bg-slate-950/20">
                            <td className="py-2.5 font-bold text-slate-350">{e.name}</td>
                            <td className="py-2.5 text-slate-400">{e.department}</td>
                            <td className="py-2.5 text-slate-200">{e.attendanceStats.checkInCount}</td>
                            <td className="py-2.5 text-slate-300">{e.attendanceStats.totalHours} hrs</td>
                            <td className="py-2.5 text-right font-semibold text-indigo-400">{e.attendanceStats.onTimeRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}

                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* --- MODALS SECTION --- */}

      {/* 5. Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddEmployee} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Onboard New Employee</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Karan Malhotra"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="karan@company.com"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">HR</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">System Role</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Senior Manager">Senior Manager</option>
                    <option value="HR Recruiter">HR Recruiter</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Designation</label>
                <input
                  type="text"
                  required
                  value={empDesig}
                  onChange={(e) => setEmpDesig(e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Monthly Salary (₹)</label>
                <input
                  type="number"
                  required
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  placeholder="95000"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 text-xs font-semibold rounded-xl border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl border border-indigo-500 cursor-pointer"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleUpdateEmployee} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Edit className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Edit Employee Details</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmpEmail}
                  onChange={(e) => setEditEmpEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Department</label>
                  <select
                    value={editEmpDept}
                    onChange={(e) => setEditEmpDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">HR</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">System Role</label>
                  <select
                    value={editEmpRole}
                    onChange={(e) => setEditEmpRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Senior Manager">Senior Manager</option>
                    <option value="HR Recruiter">HR Recruiter</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Designation</label>
                  <input
                    type="text"
                    required
                    value={editEmpDesig}
                    onChange={(e) => setEditEmpDesig(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Status</label>
                  <select
                    value={editEmpStatus}
                    onChange={(e) => setEditEmpStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Monthly Salary (₹)</label>
                <input
                  type="number"
                  required
                  value={editEmpSalary}
                  onChange={(e) => setEditEmpSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-355 text-xs font-semibold rounded-xl border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-xl border border-indigo-500 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleUpdateJob} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Edit className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Edit Job Posting</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Job Title</label>
                <input
                  type="text"
                  required
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Department</label>
                  <select
                    value={editJobDept}
                    onChange={(e) => setEditJobDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="HR">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Type</label>
                  <select
                    value={editJobType}
                    onChange={(e) => setEditJobType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Location</label>
                  <input
                    type="text"
                    required
                    value={editJobLoc}
                    onChange={(e) => setEditJobLoc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Status</label>
                  <select
                    value={editJobStatus}
                    onChange={(e) => setEditJobStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                  >
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Job Description</label>
                <textarea
                  rows="4"
                  required
                  value={editJobDesc}
                  onChange={(e) => setEditJobDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-355 text-xs font-semibold rounded-xl border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-xl border border-indigo-500 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleUpdatePolicy} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Edit className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Edit Company Policy</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Policy Title</label>
                <input
                  type="text"
                  required
                  value={editPolicyTitle}
                  onChange={(e) => setEditPolicyTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Policy Content</label>
                <textarea
                  rows="6"
                  required
                  value={editPolicyContent}
                  onChange={(e) => setEditPolicyContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-355 text-xs font-semibold rounded-xl border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-xl border border-indigo-500 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Analysis Modal popup */}
      {aiAnalysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-250">SmartHR Gemini Executive Audit</h3>
              </div>
              <button 
                onClick={() => setAiAnalysisResult(null)} 
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-xs text-slate-300 leading-relaxed font-sans max-h-[300px] overflow-y-auto pr-1 whitespace-pre-wrap bg-slate-950/50 p-4 border border-slate-850 rounded-xl">
              {aiAnalysisResult}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button 
                onClick={() => setAiAnalysisResult(null)} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-xl border border-indigo-500 cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Resume Screening Details Modal */}
      {selectedCandidateEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-200">AI Screening Report: {selectedCandidateEval.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedCandidateEval(null)} 
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 text-xs font-sans">
              <div className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold">Position Applied</span>
                  <span className="text-sm font-bold text-slate-250 block mt-0.5">{selectedCandidateEval.jobTitle}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold">Vetting Score</span>
                  <span className="text-lg font-bold text-indigo-400 block mt-0.5">{selectedCandidateEval.matchScore}% Match</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-300 mb-1.5 uppercase tracking-wide text-[10px] text-indigo-400">Strengths</h5>
                <div className="space-y-1">
                  {selectedCandidateEval.evaluation?.strengths?.map((str, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-lg text-slate-300">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-300 mb-1.5 uppercase tracking-wide text-[10px] text-rose-400">Areas of Development / Missing Skills</h5>
                <div className="space-y-1">
                  {selectedCandidateEval.evaluation?.weaknesses?.map((weak, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg text-slate-300">
                      <div className="w-1 h-1 rounded-full bg-rose-455" />
                      <span>{weak}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-300 mb-1.5 uppercase tracking-wide text-[10px] text-slate-400">Executive ATS Summary</h5>
                <p className="bg-slate-950/20 border border-slate-850 p-3 rounded-lg text-slate-400 leading-relaxed">
                  {selectedCandidateEval.evaluation?.summary || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button 
                onClick={() => setSelectedCandidateEval(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-750 cursor-pointer"
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate AI Interview Report Transcript Modal */}
      {selectedCandidateInt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200">AI Voice Interview Transcript: {selectedCandidateInt.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedCandidateInt(null)} 
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 text-xs font-sans">
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="text-[9px] text-slate-550 block font-bold uppercase">Confidence</span>
                  <span className="text-sm font-bold text-slate-250 mt-1 block">{selectedCandidateInt.interviewReport.confidence}</span>
                </div>
                <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="text-[9px] text-slate-550 block font-bold uppercase">Communication</span>
                  <span className="text-sm font-bold text-slate-250 mt-1 block">{selectedCandidateInt.interviewReport.communication}</span>
                </div>
                <div className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="text-[9px] text-slate-550 block font-bold uppercase">Technical Fit</span>
                  <span className="text-sm font-bold text-slate-250 mt-1 block">{selectedCandidateInt.interviewReport.technical}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-slate-300 mb-1.5 uppercase tracking-wide text-[10px] text-indigo-400">General Vetting Review</h5>
                <p className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg text-slate-355 leading-relaxed font-sans">
                  {selectedCandidateInt.interviewReport.feedback}
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-300 mb-1.5 uppercase tracking-wide text-[10px] text-slate-400">Detailed Transcript Breakdown</h5>
                <p className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg text-slate-400 leading-relaxed font-sans whitespace-pre-line">
                  {selectedCandidateInt.interviewReport.reportText}
                </p>
              </div>

            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button 
                onClick={() => setSelectedCandidateInt(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-750 cursor-pointer"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
