import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { apiService } from '../api/apiService';

const promptsByRole = {
  Admin: [
    "Show employee count by department",
    "Is the Gemini API key active?",
    "What is the company performance average?",
    "Generate department reports"
  ],
  'Senior Manager': [
    "Who in my team is on leave?",
    "How is my team's attendance?",
    "Give me leadership coaching tips",
    "Summarize performance statistics"
  ],
  'HR Recruiter': [
    "What job postings are active?",
    "How does the ATS matching work?",
    "Tips to screen candidates effectively",
    "Active interview schedules"
  ],
  Employee: [
    "What is my leave balance?",
    "Tell me about my salary",
    "Explain the WFH policy",
    "How is my attendance?"
  ],
  Candidate: [
    "What jobs are open?",
    "Explain the interview process",
    "What are the company benefits?",
    "How do I prepare for the AI Interview?"
  ]
};

export default function HRAssistant({ currentEmployee }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const role = currentEmployee?.role || 'Candidate';
  const name = currentEmployee?.name || 'Guest';
  const quickPrompts = promptsByRole[role] || promptsByRole.Candidate;

  const getWelcomeInfo = () => {
    switch (role) {
      case 'Admin':
        return {
          title: "SmartHR Operations Advisor",
          subtitle: "Admin System Control",
          welcome: `Hi ${name}! 👋 I am your SmartHR Operations Advisor. Ask me about organizational stats, database settings status, or system controls.`
        };
      case 'Senior Manager':
        return {
          title: "SmartHR Leadership Coach",
          subtitle: "Team Management Advisor",
          welcome: `Hi ${name}! 👋 I am your SmartHR Leadership Coach. Ask me about team leave approvals, attendance summaries, or professional leadership tips.`
        };
      case 'HR Recruiter':
        return {
          title: "SmartHR Recruiting Copilot",
          subtitle: "Talent Acquisition Advisor",
          welcome: `Hi ${name}! 👋 I am your SmartHR Recruiting Copilot. Ask me about screening stats, ATS compatibility rules, or candidate summaries.`
        };
      case 'Employee':
        return {
          title: "SmartHR Employee Guide",
          subtitle: "Personal HR Assistant",
          welcome: `Hi ${name}! 👋 I am your SmartHR personal assistant. Ask me about your remaining leaves, salary, attendance records, or office policies.`
        };
      case 'Candidate':
      default:
        return {
          title: "SmartHR Career Guide",
          subtitle: "AI Candidate Assistant",
          welcome: name !== 'Guest' 
            ? `Hi ${name}! 👋 Welcome to your Career Dashboard. Ask me about open job openings, the hiring process, benefits, or preparing for the AI voice interview.`
            : `Welcome to SmartHRMS! 👋 I am your AI Career Guide. Ask me about active job openings, WFH flexibility, employee benefits, or preparing for the AI voice interview.`
        };
    }
  };

  const welcomeInfo = getWelcomeInfo();

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        role: 'assistant',
        content: welcomeInfo.welcome
      }
    ]);
  }, [currentEmployee]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Cleanup speech synthesis and recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSend = async (text) => {
    const query = text || input;
    if (!query.trim()) return;

    if (!text) setInput('');

    // Append user message
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      // Gather employee/candidate context
      const context = currentEmployee ? {
        name: currentEmployee.name,
        role: currentEmployee.role || 'Guest',
        designation: currentEmployee.designation || '',
        department: currentEmployee.department || '',
        salary: currentEmployee.salary || 0,
        leaveBalance: currentEmployee.leaveBalance || null,
        attendanceStats: currentEmployee.attendanceStats || null,
        performanceScore: currentEmployee.performanceScore || null,
        manager: 'Rajesh Kumar'
      } : {
        name: 'Guest Candidate',
        role: 'Candidate',
        manager: 'N/A'
      };

      const response = await apiService.askHRAssistant(query, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an error processing your query. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInput(prev => {
        const base = prev.trim();
        return base ? `${base} ${text}` : text;
      });
    };

    rec.onerror = (e) => {
      console.error('Speech recognition error in chatbot:', e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleToggleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && activeSpeechText === text) {
        window.speechSynthesis.cancel();
        setActiveSpeechText('');
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setActiveSpeechText('');
        utterance.onerror = () => setActiveSpeechText('');
        window.speechSynthesis.speak(utterance);
        setActiveSpeechText(text);
      }
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    
    return lines.map((line, lineIdx) => {
      const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const content = isListItem ? line.trim().slice(2) : line;
      
      const parts = content.split('**');
      const parsedElements = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return <strong key={partIdx} className="font-extrabold text-indigo-300">{part}</strong>;
        }
        return part;
      });
      
      if (isListItem) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-1.5 my-0.5">
            <span className="text-indigo-400 mt-1.5 shrink-0 w-1 h-1 rounded-full bg-indigo-500" />
            <span className="flex-1 text-slate-250">{parsedElements}</span>
          </div>
        );
      }
      
      return <p key={lineIdx} className={lineIdx > 0 ? "mt-1.5" : ""}>{parsedElements}</p>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat window */}
      {isOpen && (
        <div className="w-[380px] h-[500px] mb-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-indigo-950 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-100">{welcomeInfo.title}</h4>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase tracking-wider animate-pulse shadow-sm shadow-indigo-500/10">
                    AI Powered
                  </span>
                </div>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{welcomeInfo.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/20 scrollbar-thin">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col space-y-1 max-w-[80%] relative group">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50 shadow-md'
                    }`}
                  >
                    {renderFormattedText(m.content)}
                  </div>
                  {m.role === 'assistant' && (
                    <div className="flex justify-end pr-1">
                      <button
                        onClick={() => handleToggleSpeak(m.content)}
                        className={`flex items-center gap-1 text-[9px] font-bold uppercase transition-all px-1.5 py-0.5 rounded bg-slate-900/40 border border-slate-800/40 ${
                          activeSpeechText === m.content ? 'text-indigo-400 border-indigo-500/20 shadow' : 'text-slate-500 hover:text-slate-400'
                        }`}
                        title="Listen to response"
                      >
                        <Volume2 className={`w-2.5 h-2.5 ${activeSpeechText === m.content ? 'animate-pulse' : ''}`} />
                        <span>{activeSpeechText === m.content ? 'Playing' : 'Listen'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Pills */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/50">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1.5">Suggested Questions:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p)}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-350 px-2.5 py-1 rounded-full border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2 items-center"
          >
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              title={isListening ? "Listening... Click to stop" : "Voice input"}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening to voice..." : "Ask anything..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
              disabled={isListening}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || isListening}
              className="p-2 bg-indigo-600 hover:bg-indigo-550 disabled:opacity-40 text-white rounded-xl border border-indigo-500 shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-[1.05] border border-indigo-400/40 transition-transform cursor-pointer relative"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-400 rounded-full border-2 border-slate-950 animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-400 rounded-full border-2 border-slate-950" />
      </button>
    </div>
  );
}
