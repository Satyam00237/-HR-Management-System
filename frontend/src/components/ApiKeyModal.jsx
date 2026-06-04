import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiService } from '../api/apiService';

export default function ApiKeyModal({ isOpen, onClose, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setStatus('idle');
    }
  }, [isOpen]);

  const handleSave = async () => {
    try {
      await apiService.saveGeminiKey(apiKey.trim());
      onSave(apiKey.trim());
      onClose();
    } catch (e) {
      alert('Failed to save API key on server.');
    }
  };

  const testKey = async () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setErrorMsg('Please enter an API Key.');
      return;
    }

    setTesting(true);
    setStatus('idle');
    
    try {
      // Direct call to Gemini API for a lightweight testing
      const response = await fetch(
        `https://generativelink.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.candidates && data.candidates.length > 0) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error?.message || 'Invalid API Key. Please verify and try again.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Connection failed. Verify internet connection or key.');
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Gemini API Configuration</h3>
            <p className="text-xs text-slate-400">Power AI features like screening, voice interviewer, & chatbot</p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Your key is saved locally in your browser's <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-400">localStorage</code> and is sent directly to Google APIs.
            </p>
          </div>

          {/* Test Status Feedback */}
          {status === 'success' && (
            <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Connection Successful!</span> Your key is verified and active.
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Verification Failed</span>
                <p className="text-[11px] opacity-90 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={testKey}
              disabled={testing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 disabled:opacity-50 text-sm font-medium rounded-xl border border-slate-700 transition-all"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Key'
              )}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl border border-indigo-500 shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
