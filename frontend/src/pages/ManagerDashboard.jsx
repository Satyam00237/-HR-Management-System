import React, { useState, useEffect } from 'react';
import { 
  Users, Check, X, Calendar, ClipboardList, Clock, 
  AlertCircle, Award, CheckCircle, UserCheck, BarChart2
} from 'lucide-react';
import { apiService } from '../api/apiService';

export default function ManagerDashboard({ activeSubTab, currentEmployee, refreshKey, onTriggerRefresh }) {
  const [team, setTeam] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);

  // Load Manager's Department data (Rajesh Kumar manages Engineering)
  useEffect(() => {
    const loadManagerData = async () => {
      try {
        const allEmps = await apiService.getEmployees();
        const allAtt = await apiService.getAttendance();
        const allLeaves = await apiService.getLeaves();
        const today = new Date().toISOString().split('T')[0];

        // Filter to Engineering department for Rajesh
        const dept = currentEmployee.department === 'Executive' ? 'Engineering' : currentEmployee.department;
        const teamList = allEmps.filter(e => e.department === dept && e.id !== currentEmployee.id);
        setTeam(teamList);

        // Get today's attendance logs
        const todayAtt = allAtt.filter(a => a.date === today);
        setAttendanceToday(todayAtt);

        // Get pending leaves for department members
        const teamIds = teamList.map(t => t.id);
        const pending = allLeaves.filter(l => l.status === 'Pending' && teamIds.includes(l.employeeId));
        setPendingLeaves(pending);

        const approvedLeaves = allLeaves.filter(l => l.status === 'Approved' && teamIds.includes(l.employeeId));
        setTeamLeaves(approvedLeaves);
      } catch (e) {
        console.error('Failed to load manager dashboard logs from backend', e);
      }
    };
    loadManagerData();
  }, [currentEmployee, refreshKey]);

  const handleApproveLeave = async (leaveId) => {
    try {
      await apiService.approveLeave(leaveId, currentEmployee.name);
      onTriggerRefresh();
      alert('Leave request approved successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to approve leave request.');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await apiService.rejectLeave(leaveId, currentEmployee.name);
      onTriggerRefresh();
      alert('Leave request marked as rejected.');
    } catch (e) {
      console.error(e);
      alert('Failed to reject leave request.');
    }
  };

  // Helper to determine team member's live status today
  const getMemberStatus = (empId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if on leave approved today
    const leaves = teamLeaves.filter(l => l.employeeId === empId);
    const isOnLeave = leaves.some(l => today >= l.startDate && today <= l.endDate);
    
    if (isOnLeave) return { label: 'On Leave', class: 'bg-rose-500/10 text-rose-400 border-rose-500/25', time: null };

    const record = attendanceToday.find(a => a.employeeId === empId);
    if (!record) return { label: 'Absent', class: 'bg-slate-800 text-slate-500 border-slate-750', time: null };
    
    if (record.checkOutTime) return { label: 'Checked Out', class: 'bg-slate-800 text-slate-400 border-slate-750', time: `Out: ${record.checkOutTime}` };
    
    return { 
      label: record.status === 'On Time' ? 'Checked In' : 'Checked In (Late)', 
      class: record.status === 'On Time' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      time: `In: ${record.checkInTime}`
    };
  };

  // Stats calculation
  const totalTeam = team.length;
  const checkedInCount = team.filter(t => {
    const status = getMemberStatus(t.id);
    return status.label.includes('Checked In');
  }).length;
  const attendanceRate = totalTeam > 0 ? Math.round((checkedInCount / totalTeam) * 100) : 0;
  const averagePerformance = totalTeam > 0 ? Math.round(team.reduce((acc, t) => acc + t.performanceScore, 0) / totalTeam) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      
      {/* 1. Overview Subtab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Dashboard widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Managed Team</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{totalTeam} Employees</h3>
                <span className="text-[10px] text-indigo-400 font-semibold">{currentEmployee.department} Dept</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{checkedInCount} Present</h3>
                <span className="text-[10px] text-emerald-400 font-semibold">{attendanceRate}% Active Rate</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{pendingLeaves.length} Requests</h3>
                <span className="text-[10px] text-amber-400 font-semibold">Requires Approval</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Perf Score</span>
                <h3 className="text-2xl font-bold text-slate-200 mt-1">{averagePerformance}%</h3>
                <span className="text-[10px] text-indigo-400 font-semibold">Department Target: 85%</span>
              </div>
              <div className="w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 text-indigo-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Leave approvals banner if any */}
          {pendingLeaves.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Pending Leave Approvals Queue</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">There are {pendingLeaves.length} pending time-off requests from your team that require review.</p>
                </div>
              </div>
            </div>
          )}

          {/* Team presence list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Team Presence & Check-In Status</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pr-2">Employee Info</th>
                    <th className="pb-3 pr-2">Designation</th>
                    <th className="pb-3 pr-2">Live Status</th>
                    <th className="pb-3 pr-2">Activity Time</th>
                    <th className="pb-3 text-right">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {team.map((t) => {
                    const status = getMemberStatus(t.id);
                    return (
                      <tr key={t.id} className="hover:bg-slate-950/20 transition-colors">
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-3">
                            <img src={t.avatar} className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800" alt="" />
                            <div>
                              <p className="font-semibold text-slate-200">{t.name}</p>
                              <p className="text-[10px] text-slate-500">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-2 text-slate-400 font-medium">{t.designation}</td>
                        <td className="py-3.5 pr-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-slate-500 font-medium font-mono">
                          {status.time || 'N/A'}
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-300">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{t.performanceScore}%</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Team Performance subtab */}
      {activeSubTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-300">KPI Distribution Matrix</h4>
              <BarChart2 className="w-4 h-4 text-indigo-400" />
            </div>
            
            <div className="space-y-4">
              {team.map((t) => (
                <div key={t.id} className="space-y-1.5 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{t.name}</span>
                    <span className="text-indigo-400 font-bold">{t.performanceScore}% Score</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Designation: {t.designation}</span>
                    <span>Status: Active</span>
                  </div>
                  <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 mt-1">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${t.performanceScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Department Goals & Deliverables</h4>
              <div className="space-y-3">
                {[
                  { title: 'Migrate architecture to React 19 / Vite', progress: 85, status: 'On Track' },
                  { title: 'Design client portal with custom responsive panels', progress: 100, status: 'Completed' },
                  { title: 'Setup database triggers and mock schemas', progress: 95, status: 'On Track' },
                  { title: 'Conduct technical recruiting screening rounds', progress: 50, status: 'Delayed' }
                ].map((g, idx) => (
                  <div key={idx} className="bg-slate-950/30 p-3 border border-slate-850 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">{g.title}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        g.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        g.status === 'On Track' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>{g.status}</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Leave Requests Approvals subtab */}
      {activeSubTab === 'leaves' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-300">Pending Approvals Queue</h4>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
              {pendingLeaves.length} ACTION REQUIRED
            </span>
          </div>

          <div className="space-y-3.5">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <CheckCircle className="w-8 h-8 text-slate-750 mx-auto mb-2" />
                No pending leave requests in your queue.
              </div>
            ) : (
              pendingLeaves.map((req) => (
                <div key={req.id} className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-950/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h5 className="text-xs font-bold text-slate-200">{req.employeeName}</h5>
                      <span className="text-[10px] text-slate-500 font-semibold">•</span>
                      <span className="text-[10px] text-indigo-300 font-bold">{req.leaveType} Leave</span>
                      <span className="text-[10px] text-slate-500 font-semibold">•</span>
                      <span className="text-[10px] text-slate-400 font-medium">{req.totalDays} Days</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Timeline: {req.startDate} to {req.endDate}</p>
                    <p className="text-[11px] text-slate-400 italic font-medium mt-1 font-sans">"{req.reason}"</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectLeave(req.id)}
                      className="p-2 bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-500/20 transition-all"
                      title="Reject request"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleApproveLeave(req.id)}
                      className="p-2 bg-emerald-500/10 text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-xl border border-emerald-500/20 transition-all"
                      title="Approve request"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
