import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Briefcase, Calendar, Plus, Search, 
  Trash2, FileText, CheckCircle, PlusCircle, Sparkles, BookOpen
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { apiService } from '../api/apiService';

const chartData = [
  { month: 'Dec', cost: 420000, hires: 2 },
  { month: 'Jan', cost: 480000, hires: 3 },
  { month: 'Feb', cost: 480000, hires: 0 },
  { month: 'Mar', cost: 560000, hires: 4 },
  { month: 'Apr', cost: 580000, hires: 1 },
  { month: 'May', cost: 608000, hires: 2 }
];

export default function AdminDashboard({ activeSubTab, refreshKey, onTriggerRefresh }) {
  const [employees, setEmployees] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [policies, setPolicies] = useState([]);

  // Add Employee Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState('Employee');
  const [empDept, setEmpDept] = useState('Engineering');
  const [empDesig, setEmpDesig] = useState('');
  const [empSalary, setEmpSalary] = useState('');
  const [empPassword, setEmpPassword] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const emps = await apiService.getEmployees();
        setEmployees(emps);
        
        const jobList = await apiService.getJobs();
        setJobs(jobList);
        
        const leaveList = await apiService.getLeaves();
        setLeaves(leaveList);
        
        const policyList = await apiService.getPolicies();
        setPolicies(policyList);
      } catch (e) {
        console.error('Failed to load admin data from backend', e);
      }
    };
    loadAdminData();
  }, [refreshKey]);

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
      
      // Clear state
      setEmpName('');
      setEmpEmail('');
      setEmpDesig('');
      setEmpSalary('');
      setEmpPassword('');
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

  // Stats calculation
  const activeEmps = employees.filter(e => e.status === 'Active');
  const totalSalaryCost = activeEmps.reduce((acc, e) => acc + e.salary, 0);
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* 1. Overview Dashboard */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Stats Summary Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{employees.length} Employees</h3>
                <span className="text-[10px] text-indigo-400 font-semibold">{activeEmps.length} Active, {employees.length - activeEmps.length} Inactive</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Payroll</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">${totalSalaryCost.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-400 font-semibold">Average: ${(totalSalaryCost / (activeEmps.length || 1)).toLocaleString()}/emp</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open Roles</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{jobs.length} Positions</h3>
                <span className="text-[10px] text-indigo-400 font-semibold">HR pipeline active</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-indigo-400">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{pendingLeavesCount} Requests</h3>
                <span className="text-[10px] text-amber-400 font-semibold">Awaiting Manager actions</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Recharts Salary & Growth Analytics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-300">Financial Payroll Trend</h4>
                <p className="text-[11px] text-slate-500">Six month comparison of operational salary distributions and additions</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-indigo-400"><div className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-400" /> Payroll ($)</span>
              </div>
            </div>
            {/* Chart Area */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. Employee Directory subtab */}
      {activeSubTab === 'employees' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
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
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl border border-indigo-500 shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01]"
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
              <tbody className="divide-y divide-slate-800/60">
                {filteredEmployees.map((e) => (
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
                    <td className="py-3 pr-2 text-slate-300 font-medium">${e.salary.toLocaleString()}</td>
                    <td className="py-3 pr-2">
                      <button
                        onClick={() => handleToggleStatus(e.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
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
                      <button
                        onClick={() => handleToggleStatus(e.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 hover:bg-slate-800/40 rounded-lg transition-colors"
                        title={e.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Payroll Control subtab */}
      {activeSubTab === 'payroll' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">Operational Payroll Processing</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated payroll ledger with direct deposit controls</p>
            </div>
            <button
              onClick={handleRunPayroll}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-[1.01]"
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
                  <th className="py-2.5 px-3">Deductions PF (4%)</th>
                  <th className="py-2.5 px-3 text-right">Net Take-Home Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {activeEmps.map((e) => {
                  const base = e.salary;
                  const hra = Math.round(base * 0.1);
                  const tax = Math.round(base * 0.15);
                  const pf = Math.round(base * 0.04);
                  const net = base + hra - (tax + pf);
                  
                  return (
                    <tr key={e.id} className="hover:bg-slate-950/20">
                      <td className="py-3 px-3 font-semibold text-slate-200">{e.name}</td>
                      <td className="py-3 px-3 text-slate-400">${base.toLocaleString()}</td>
                      <td className="py-3 px-3 text-slate-500">${hra.toLocaleString()}</td>
                      <td className="py-3 px-3 text-rose-500/80">-${tax.toLocaleString()}</td>
                      <td className="py-3 px-3 text-rose-500/80">-${pf.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">${net.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Company Policies Subtab */}
      {activeSubTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {policies.map((p, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{p.title}</h4>
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

      {/* 5. Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddEmployee} className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <PlusCircle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Onboard New Employee</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Karan Malhotra"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Monthly Salary ($)</label>
                <input
                  type="number"
                  required
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  placeholder="95000"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
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
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl border border-indigo-500"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
