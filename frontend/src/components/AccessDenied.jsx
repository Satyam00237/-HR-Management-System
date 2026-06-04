import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export default function AccessDenied({ currentRole, onLogout, onGoHome }) {
  return (
    <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
      {/* Glow decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl border border-rose-500/20 bg-slate-900/20 backdrop-blur-xl shadow-2xl text-center relative z-10 animate-fade-in">
        
        {/* Warning Icon with pulse glow */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-lg shadow-rose-500/5 mb-6 animate-pulse">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-100 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Your active profile role (<span className="text-rose-400 font-semibold">{currentRole}</span>) does not possess permission rights to access this enterprise dashboard panel.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all hover:scale-[1.02]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to My Dashboard</span>
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 transition-all hover:scale-[1.02]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
}
