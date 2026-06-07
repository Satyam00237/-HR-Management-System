import React, { useState, useEffect } from 'react';
import { 
  Play, Square, Calendar, CreditCard, Award, 
  Plus, CheckCircle, Clock, Check, X, FileText, Download, UserCheck,
  User, Mail, Key, RefreshCw, Sparkles
} from 'lucide-react';
import { apiService } from '../api/apiService';

export default function EmployeeDashboard({ activeSubTab, currentEmployee, refreshKey, onTriggerRefresh }) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  // Loaded States
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Leave Form State
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState(null);

  // Payslip Modal State
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(currentEmployee?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentEmployee?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(currentEmployee?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Load check-in status on mount/refresh
  useEffect(() => {
    const loadPortalData = async () => {
      try {
        const list = await apiService.getAttendance();
        const filteredAtt = list.filter(a => a.employeeId === currentEmployee.id);
        setAttendanceRecords(filteredAtt);

        const today = new Date().toISOString().split('T')[0];
        const todayRecord = filteredAtt.find(a => a.date === today);
        
        if (todayRecord) {
          setActiveCheckIn(todayRecord);
          setIsCheckedIn(!todayRecord.checkOutTime);
        } else {
          setActiveCheckIn(null);
          setIsCheckedIn(false);
        }

        const leaves = await apiService.getLeaves();
        const filteredLeaves = leaves.filter(l => l.employeeId === currentEmployee.id);
        setLeaveRequests(filteredLeaves);

        if (currentEmployee) {
          setProfileName(currentEmployee.name || '');
          setProfileEmail(currentEmployee.email || '');
          setProfileAvatar(currentEmployee.avatar || '');
        }
      } catch (e) {
        console.error('Failed to load portal data from backend', e);
      }
    };
    loadPortalData();
  }, [currentEmployee, refreshKey]);

  // Live Timer for Check-In
  useEffect(() => {
    let timer;
    if (isCheckedIn && activeCheckIn && !activeCheckIn.checkOutTime) {
      const calculateElapsed = () => {
        let checkInDate;
        if (activeCheckIn.createdAt) {
          checkInDate = new Date(activeCheckIn.createdAt);
        } else {
          const [h, m, s] = activeCheckIn.checkInTime.split(':').map(Number);
          checkInDate = new Date();
          checkInDate.setHours(h, m, s);
        }
        
        const now = new Date();
        const diffMs = now - checkInDate;
        
        if (diffMs < 0 || isNaN(diffMs)) return '00:00:00';
        
        const diffSecs = Math.floor(diffMs / 1000);
        const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
        const seconds = String(diffSecs % 60).padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
      };

      setElapsedTime(calculateElapsed());
      timer = setInterval(() => {
        setElapsedTime(calculateElapsed());
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }

    return () => clearInterval(timer);
  }, [isCheckedIn, activeCheckIn]);

  const handleCheckIn = async () => {
    try {
      const entry = await apiService.checkIn(currentEmployee.id);
      setActiveCheckIn(entry);
      setIsCheckedIn(true);
      onTriggerRefresh();
    } catch (e) {
      console.error(e);
      alert('Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiService.checkOut(currentEmployee.id);
      setIsCheckedIn(false);
      onTriggerRefresh();
    } catch (e) {
      console.error(e);
      alert('Check-out failed');
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setLeaveMsg({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    try {
      await apiService.requestLeave({
        employeeId: currentEmployee.id,
        leaveType,
        startDate,
        endDate,
        reason
      });
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveMsg({ type: 'success', text: 'Leave request submitted successfully!' });
      onTriggerRefresh();
      setTimeout(() => setLeaveMsg(null), 3000);
    } catch (err) {
      setLeaveMsg({ type: 'error', text: 'Leave request submission failed.' });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      setProfileMsg({ type: 'error', text: 'Name and Email are required.' });
      return;
    }
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const payload = {
        name: profileName,
        email: profileEmail,
        avatar: profileAvatar
      };
      if (profilePassword) {
        payload.password = profilePassword;
      }
      await apiService.updateEmployeeProfile(payload);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setProfilePassword('');
      onTriggerRefresh();
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRandomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setProfileAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  // Helper for rendering attendance calendar
  const renderCalendar = () => {
    const records = attendanceRecords;
    const daysInMonth = 30; // Mock calendar days
    const calendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = String(i).padStart(2, '0');
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      
      const record = records.find(r => r.date === dateStr);
      calendarDays.push({ dayNum: i, record, dateStr });
    }

    return (
      <div className="grid grid-cols-7 gap-2 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
          <div key={w} className="text-center text-[10px] text-slate-500 font-bold uppercase">{w}</div>
        ))}
        {calendarDays.map(({ dayNum, record, dateStr }) => {
          let statusClass = 'bg-slate-950/40 text-slate-600 border border-slate-900';
          let tooltip = 'No Record';

          if (record) {
            if (record.status === 'On Time') {
              statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
              tooltip = `Checked in at ${record.checkInTime} (${record.status})`;
            } else if (record.status === 'Late') {
              statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
              tooltip = `Checked in at ${record.checkInTime} (${record.status})`;
            }
          } else {
            const dateObj = new Date(dateStr);
            const isWeekday = dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
            const todayStr = new Date().toISOString().split('T')[0];
            if (dateStr < todayStr && isWeekday) {
              statusClass = 'bg-rose-500/5 text-rose-500/50 border border-rose-500/15';
              tooltip = 'Absent / Holiday';
            }
          }

          return (
            <div 
              key={dayNum} 
              title={tooltip}
              className={`h-10 flex flex-col items-center justify-center rounded-lg text-xs font-semibold select-none transition-all cursor-pointer hover:scale-[1.05] ${statusClass}`}
            >
              <span>{dayNum}</span>
              {record && <div className={`w-1 h-1 rounded-full mt-0.5 ${record.status === 'On Time' ? 'bg-emerald-400' : 'bg-amber-400'}`} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* 1. Portal view */}
      {activeSubTab === 'portal' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Check-In Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-300">Live Attendance Portal</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCheckedIn ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCheckedIn ? 'ACTIVE CHECK-IN' : 'CHECKED OUT'}
                </span>
              </div>
              
              <div className="text-center py-6">
                {isCheckedIn ? (
                  <>
                    <p className="text-xs text-slate-400">Total hours logged today</p>
                    <h2 className="text-4xl font-extrabold text-indigo-400 font-mono tracking-wider mt-1">{elapsedTime}</h2>
                    <p className="text-[10px] text-slate-500 mt-2">Started check-in at {activeCheckIn?.checkInTime}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-slate-400">Ready to log hours?</p>
                    <h2 className="text-4xl font-bold text-slate-600 font-mono tracking-wider mt-1">00:00:00</h2>
                    <p className="text-[10px] text-slate-500 mt-2">Check-in limit: 09:15 AM</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              {isCheckedIn ? (
                <button
                  onClick={handleCheckOut}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl font-medium border border-rose-500 shadow-lg shadow-rose-600/10 transition-all active:scale-[0.98]"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Check Out
                </button>
              ) : (
                <button
                  onClick={handleCheckIn}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium border border-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Check In
                </button>
              )}
            </div>
          </div>

          {/* Monthly Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Monthly Overview</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">On-Time Rate</span>
                  <p className="text-xl font-bold text-emerald-400 mt-0.5">{currentEmployee.attendanceStats.onTimeRate}%</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Days Logged</span>
                  <p className="text-xl font-bold text-slate-300 mt-0.5">{currentEmployee.attendanceStats.checkInCount}</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Total Hours</span>
                  <p className="text-xl font-bold text-indigo-400 mt-0.5">{currentEmployee.attendanceStats.totalHours} hrs</p>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                  <p className="text-xl font-bold text-slate-300 mt-0.5">Good Stand</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 border-t border-slate-800/80 pt-4 mt-4">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Checked in today: {activeCheckIn ? (isCheckedIn ? 'Active' : 'Completed') : 'Not yet'}</span>
            </div>
          </div>

          {/* Calendar Log Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-300">Attendance Log Calendar</h4>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" /> On-Time
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500/10 border border-amber-500/30" /> Late
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30" /> Absent
                </span>
              </div>
            </div>
            {renderCalendar()}
          </div>
        </div>
      )}

      {/* 2. Leaves view */}
      {activeSubTab === 'leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Balances */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            {Object.entries(currentEmployee.leaveBalance).map(([type, val]) => (
              <div key={type} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{type} Leave</span>
                  <h3 className="text-2xl font-bold text-slate-200 mt-1">{val} Days</h3>
                  <span className="text-[10px] text-slate-500">Available balance</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800/80">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Leave Request Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Request Time Off</h4>
              {leaveMsg && (
                <div className={`p-3 text-xs rounded-xl mb-4 border ${
                  leaveMsg.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {leaveMsg.text}
                </div>
              )}
              <form onSubmit={handleRequestLeave} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="Casual">Casual</option>
                    <option value="Medical">Medical</option>
                    <option value="Earned">Earned</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Reason</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief detail for time-off..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border border-indigo-500 shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01]"
                >
                  <Plus className="w-4 h-4" />
                  Submit Request
                </button>
              </form>
            </div>
          </div>

          {/* History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Leave Requests History</h4>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">No leave requests logged yet.</div>
              ) : (
                leaveRequests.map((req) => (
                  <div key={req.id} className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl flex items-center justify-between transition-all hover:bg-slate-950/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{req.leaveType} Leave</span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-indigo-400 font-semibold">{req.totalDays} Days</span>
                      </div>
                      <p className="text-[10px] text-slate-400">{req.startDate} to {req.endDate}</p>
                      <p className="text-[11px] text-slate-500 italic mt-1 font-medium truncate max-w-[280px]">"{req.reason}"</p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        req.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                        req.status === 'Rejected' ? 'bg-rose-500/15 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      }`}>
                        {req.status}
                      </span>
                      {req.approvedBy && (
                        <span className="text-[9px] text-slate-500 font-medium">By: {req.approvedBy}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Payslips View */}
      {activeSubTab === 'payslips' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-300">Earnings & Payslips</h4>
              <p className="text-xs text-slate-500 mt-0.5">Select a month to view and download official payslips</p>
            </div>
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="space-y-3">
            {[
              { month: 'May 2026', id: 'PAY-2605', amount: currentEmployee.salary },
              { month: 'April 2026', id: 'PAY-2604', amount: currentEmployee.salary },
              { month: 'March 2026', id: 'PAY-2603', amount: currentEmployee.salary }
            ].map((p, idx) => (
              <div key={idx} className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-950/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800/80 text-indigo-400 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">{p.month}</h5>
                    <span className="text-[10px] text-slate-500">Ref: {p.id}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 text-right uppercase font-bold">Net Salary</p>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">${p.amount.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPayslip({ ...p, employee: currentEmployee })}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Performance View */}
      {activeSubTab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 mb-4">
              <Award className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">Performance Rating Score</h4>
            <div className="relative flex items-center justify-center my-6">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="46" stroke="#0f172a" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="46" stroke="#10b981" strokeWidth="8" fill="transparent" 
                  strokeDasharray="289" strokeDashoffset={289 - (289 * currentEmployee.performanceScore) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-100">{currentEmployee.performanceScore}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Grade A</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">Your score places you in the top 15% tier across the entire {currentEmployee.department} department.</p>
          </div>

          {/* Goal List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Active Key Performance Indicators (KPIs) & Goals</h4>
            <div className="space-y-4">
              {[
                { name: 'Core Code Coverage Rate', target: '90%', progress: 95, color: 'bg-emerald-500' },
                { name: 'Average Ticket Resolution Time', target: '<24 Hours', progress: 85, color: 'bg-indigo-500' },
                { name: 'Platform Optimization (Vite Migrations)', target: '100% Done', progress: 100, color: 'bg-violet-500' },
                { name: 'Technical Mentorship Hours', target: '15 Hrs/Mo', progress: 60, color: 'bg-amber-500' }
              ].map((g, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{g.name}</span>
                    <span className="text-slate-500 font-medium">Target: {g.target} ({g.progress}%)</span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4.5 Profile View */}
      {activeSubTab === 'profile' && (
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn font-sans">
          {/* Official profile overview card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="space-y-4">
              <div className="relative group">
                <img 
                  src={profileAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} 
                  className="w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg object-cover mx-auto" 
                  alt="Avatar" 
                />
                <button
                  onClick={handleRandomizeAvatar}
                  type="button"
                  className="absolute -bottom-2 right-1/4 p-1.5 bg-indigo-650 hover:bg-indigo-550 border border-indigo-600 rounded-xl text-white shadow-md shadow-indigo-650/20 hover:scale-105 transition-transform cursor-pointer"
                  title="Randomize Avatar seed"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-200">{currentEmployee.name}</h4>
                <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block mt-0.5">
                  {currentEmployee.designation}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  ID: {currentEmployee.id}
                </span>
              </div>
            </div>

            <div className="w-full border-t border-slate-800/80 pt-4 mt-6 space-y-3.5 text-xs text-left">
              <div className="flex justify-between items-center bg-slate-950/20 px-3 py-2 border border-slate-850 rounded-xl">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-semibold text-slate-350">{currentEmployee.department}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/20 px-3 py-2 border border-slate-850 rounded-xl">
                <span className="text-slate-500 font-medium">Monthly Salary</span>
                <span className="font-semibold text-emerald-450">${currentEmployee.salary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/20 px-3 py-2 border border-slate-850 rounded-xl">
                <span className="text-slate-500 font-medium">Role Level</span>
                <span className="font-semibold text-slate-350">{currentEmployee.role}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/20 px-3 py-2 border border-slate-850 rounded-xl">
                <span className="text-slate-500 font-medium">Join Date</span>
                <span className="font-semibold text-slate-350">{currentEmployee.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Personal Profile Credentials
            </h4>

            {profileMsg && (
              <div className={`p-3 text-xs rounded-xl mb-4 border ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Change Password</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Leave empty to keep current password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Printable Payslip Preview Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 border-4 border-slate-200">
            {/* Close */}
            <button 
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Payslip Logo/Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-indigo-700">SmartHRMS Corporation</h2>
                <p className="text-xs text-slate-500">100 Innovation Way, Bangalore, India</p>
                <p className="text-xs text-slate-500">payslips@smarthrms.com</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Salary Slips</h3>
                <p className="text-xs text-slate-500">Month: {selectedPayslip.month}</p>
                <p className="text-xs text-slate-500">Receipt ID: {selectedPayslip.id}</p>
              </div>
            </div>

            {/* Employee Metadata */}
            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-slate-500 py-1 pr-2 w-24">Employee ID:</td>
                      <td className="text-slate-800 font-medium">{selectedPayslip.employee.id}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-500 py-1 pr-2">Name:</td>
                      <td className="text-slate-800 font-medium">{selectedPayslip.employee.name}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-500 py-1 pr-2">Department:</td>
                      <td className="text-slate-800 font-medium">{selectedPayslip.employee.department}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="font-semibold text-slate-500 py-1 pr-2 w-24">Designation:</td>
                      <td className="text-slate-800 font-medium">{selectedPayslip.employee.designation}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-500 py-1 pr-2">Join Date:</td>
                      <td className="text-slate-800 font-medium">{selectedPayslip.employee.joinDate}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold text-slate-500 py-1 pr-2">Status:</td>
                      <td className="text-slate-800 font-medium">{selectedPayslip.employee.status}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden my-4 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="py-2 px-3 font-semibold text-slate-700">Earnings Description</th>
                    <th className="py-2 px-3 font-semibold text-slate-700 text-right">Amount</th>
                    <th className="py-2 px-3 font-semibold text-slate-700">Deductions Description</th>
                    <th className="py-2 px-3 font-semibold text-slate-700 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-150">
                    <td className="py-2.5 px-3">Base Salary</td>
                    <td className="py-2.5 px-3 text-right">${selectedPayslip.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3">Income Tax (15%)</td>
                    <td className="py-2.5 px-3 text-right">${(selectedPayslip.amount * 0.15).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-slate-150">
                    <td className="py-2.5 px-3">HRA Allowance</td>
                    <td className="py-2.5 px-3 text-right">${(selectedPayslip.amount * 0.10).toLocaleString()}</td>
                    <td className="py-2.5 px-3">Provident Fund (4%)</td>
                    <td className="py-2.5 px-3 text-right">${(selectedPayslip.amount * 0.04).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-slate-150">
                    <td className="py-2.5 px-3">Special Performance Bonus</td>
                    <td className="py-2.5 px-3 text-right">$5,000</td>
                    <td className="py-2.5 px-3">Professional Tax</td>
                    <td className="py-2.5 px-3 text-right">$200</td>
                  </tr>
                  <tr className="font-bold bg-slate-50">
                    <td className="py-2.5 px-3 text-indigo-700">Gross Earnings</td>
                    <td className="py-2.5 px-3 text-right text-indigo-700">${(selectedPayslip.amount * 1.1 + 5000).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-rose-700">Total Deductions</td>
                    <td className="py-2.5 px-3 text-right text-rose-700">${(selectedPayslip.amount * 0.19 + 200).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Total Summary */}
            <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200 mt-6">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Net Take Home Pay</span>
                <h2 className="text-xl font-extrabold text-indigo-800">${(selectedPayslip.amount * 1.1 + 5000 - (selectedPayslip.amount * 0.19 + 200)).toLocaleString()}</h2>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-md transition-colors print:hidden"
              >
                <Download className="w-3.5 h-3.5" />
                Print Slips
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 mt-6 italic">This is a system-generated document, signed electronically under SmartHRMS authorization.</p>
          </div>
        </div>
      )}
    </div>
  );
}
