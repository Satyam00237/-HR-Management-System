import React from 'react';
import { 
  Users, Calendar, FileText, ClipboardList, Briefcase, 
  Search, ShieldAlert, BookOpen, User, Sparkles, LogOut, Clock
} from 'lucide-react';

const navItems = {
  Admin: [
    { id: 'overview', name: 'Admin Dashboard', icon: ShieldAlert },
    { id: 'employees', name: 'Employees', icon: Users },
    { id: 'payroll', name: 'Payroll Control', icon: FileText },
    { id: 'recruitment', name: 'Recruitment', icon: Briefcase, badge: 'AI' },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'policies', name: 'Company Policies', icon: BookOpen }
  ],
  'Senior Manager': [
    { id: 'overview', name: 'Manager Dashboard', icon: ClipboardList },
    { id: 'team', name: 'Team Performance', icon: Users },
    { id: 'leaves', name: 'Approval Requests', icon: Calendar }
  ],
  'HR Recruiter': [
    { id: 'overview', name: 'Recruiter Dashboard', icon: Briefcase },
    { id: 'jobs', name: 'Job Postings', icon: Search },
    { id: 'screening', name: 'AI Resume Screening', icon: Sparkles, badge: 'AI' }
  ],
  Employee: [
    { id: 'portal', name: 'Attendance Portal', icon: Clock },
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'leaves', name: 'My Leaves', icon: Calendar },
    { id: 'payslips', name: 'My Payslips', icon: FileText },
    { id: 'performance', name: 'My Performance', icon: ClipboardList }
  ]
};

export default function Sidebar({ activeTab, setActiveTab, currentRole, currentEmployee, onLogout }) {
  const items = navItems[currentRole] || [];

  return (
    <aside className="w-64 shrink-0 h-screen bg-slate-900/40 backdrop-blur-md border-r border-slate-800 flex flex-col justify-between sticky top-0">
      <div className="flex flex-col">
        {/* Brand Logo */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-none">SmartHRMS</h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">AI Core v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md shadow-indigo-600/10 border-l-4 border-indigo-400 font-medium' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.badge === 'AI' 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                      : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/25 space-y-3">
        <div className="flex items-center gap-3 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800/50">
          <img
            src={currentEmployee?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
            alt="User Avatar"
            className="w-10 h-10 rounded-xl bg-slate-800 shrink-0 border border-slate-700/60"
          />
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{currentEmployee?.name}</p>
            <p className="text-[10px] text-slate-500 font-medium leading-none truncate mt-0.5">{currentEmployee?.designation}</p>
            <span className="mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {currentRole}
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800/60 hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
