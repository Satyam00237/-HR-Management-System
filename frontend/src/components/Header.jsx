import React from 'react';
import { Shield, Sparkles, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../db/mockDb';

export default function Header({ currentRole, onOpenApiKey, hasKey }) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/10 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Title / Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/50">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-slate-300">RBAC Secured</span>
        </div>
      </div>

      {/* Status Info */}
      <div className="hidden md:flex items-center gap-2 bg-slate-950/40 px-3.5 py-1.5 rounded-xl border border-slate-800/60">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span className="text-[11px] font-semibold text-slate-400">Enterprise AI Operations Active</span>
      </div>

      {/* API Key Status & Config Panel Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenApiKey}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:scale-[1.02] ${
            hasKey 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/15'
          }`}
        >
          {hasKey ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Gemini Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
              <span>Configure Gemini API</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
