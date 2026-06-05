import React, { useState } from 'react';
import { Mail, Lock, Sparkles, Shield, Cpu, ArrowRight } from 'lucide-react';
import { apiService } from '../api/apiService';

const demoUsers = [
  { name: 'Satyam Sharma', email: 'satyam@company.com', role: 'Admin', avatar: 'Satyam', color: 'from-indigo-500 to-blue-600' },
  { name: 'Rajesh Kumar', email: 'rajesh@company.com', role: 'Senior Manager', avatar: 'Rajesh', color: 'from-violet-500 to-purple-600' },
  { name: 'Sarah Jenkins', email: 'sarah.j@company.com', role: 'HR Recruiter', avatar: 'Sarah', color: 'from-fuchsia-500 to-pink-600' },
  { name: 'Amit Patel', email: 'amit@company.com', role: 'Employee', avatar: 'Amit', color: 'from-emerald-500 to-teal-600' }
];

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const user = await apiService.login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser) => {
    setError('');
    setLoading(true);
    try {
      const user = await apiService.login(demoUser.email, 'password');
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Demo Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 font-sans relative overflow-hidden p-4">
      {/* Background decoration glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Container */}
      <div className="w-full max-w-5xl grid md:grid-cols-12 rounded-3xl border border-slate-800/80 bg-slate-900/20 backdrop-blur-xl shadow-2xl overflow-hidden z-10">
        
        {/* Left Side: Brand & Feature Presentation */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/50 p-8 flex flex-col justify-between border-r border-slate-800/60 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none" />
          
          <div>
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-200 to-white bg-clip-text text-transparent">
                SmartHRMS
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight leading-tight mb-4 bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
              The Future of <br />HR Management
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Empowering organizations with secure authentication, AI-driven automation, automatic resume evaluation, and voice candidate screening tools.
            </p>
          </div>

          {/* AI Metrics Mini Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/40">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Resume Screening</div>
              <div className="text-lg font-bold text-slate-200 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-amber-400" /> Instant
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/40">
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Voice Evaluator</div>
              <div className="text-lg font-bold text-slate-200 flex items-center gap-1">
                <Cpu className="w-4 h-4 text-indigo-400" /> Active
              </div>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="mt-8 pt-4 border-t border-slate-800/50 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-slate-500 font-medium">Role-Based Access Control Enabled</span>
          </div>
        </div>

        {/* Right Side: Form & Quick Demo Profile Selection */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center max-h-[90vh] overflow-y-auto">
          <div className="max-w-md w-full mx-auto">
            
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
            <p className="text-xs text-slate-400 mb-6">Enter credentials or select a demo role profile below</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2 animate-shake">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Header */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-800/60"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-3 text-slate-500 font-semibold tracking-wider">
                  Demo Profiles Quick Access
                </span>
              </div>
            </div>

            {/* Quick Demo Access Grid */}
            <div className="grid grid-cols-2 gap-3">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => handleQuickLogin(user)}
                  type="button"
                  className="flex flex-col items-start p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 hover:border-indigo-500/40 hover:bg-slate-900/30 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                      {user.role}
                    </span>
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${user.color}`} />
                  </div>
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-slate-500 overflow-hidden text-ellipsis w-full whitespace-nowrap">
                    {user.email}
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
