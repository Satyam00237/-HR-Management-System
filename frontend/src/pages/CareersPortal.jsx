import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, FileText, CheckCircle, Clock, 
  User, Lock, Mail, Upload, Sparkles, LogOut, 
  MapPin, Calendar, ArrowLeft, Send, AlertCircle, Search, Building, ChevronRight,
  Heart, Cpu, Globe, Award, Shield, Check, Bell,
  Play, Volume2, Mic, MicOff, RefreshCw, MessageSquare
} from 'lucide-react';
import { apiService } from '../api/apiService';

export default function CareersPortal({ onClose, onLoginSuccess, currentUser, onLogout }) {
  // Navigation tabs for logged-in candidates
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'applications', 'profile'

  // Voice Interview States
  const [activeInterviewApp, setActiveInterviewApp] = useState(null);
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [interviewRound, setInterviewRound] = useState(1); // 1, 2, 3
  const [interviewHistory, setInterviewHistory] = useState([]); // [{role: 'assistant'|'user', content: string}]
  const [isListening, setIsListening] = useState(false);
  const [speechAnswer, setSpeechAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [interviewReport, setInterviewReport] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // Auth Modal States (Login / Registration)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingJobApply, setPendingJobApply] = useState(null); // Holds the job candidate clicked while guest

  // Job Board States
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null); // Detailed view

  // Application Form Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyName, setApplyName] = useState('');
  const [applySkills, setApplySkills] = useState('');
  const [applyEducation, setApplyEducation] = useState('');
  const [applyExperience, setApplyExperience] = useState('');
  const [applyResumeFile, setApplyResumeFile] = useState(null);
  const [applyError, setApplyError] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Profile Editor States
  const [profile, setProfile] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileEducation, setProfileEducation] = useState('');
  const [profileExperience, setProfileExperience] = useState('');
  const [profileResumeFile, setProfileResumeFile] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Applications List States
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Load Active Jobs
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await apiService.getJobs();
        setJobs(data);
      } catch (e) {
        console.error('Failed to fetch jobs:', e);
      }
    };
    loadJobs();
  }, []);

  // Load profile / application list if user is a logged-in candidate
  useEffect(() => {
    if (currentUser && currentUser.role === 'Candidate') {
      loadProfileData();
      loadApplications();
      // If candidate just authenticated after clicking "Apply", open the apply form modal immediately
      if (pendingJobApply) {
        setSelectedJob(pendingJobApply);
        setShowApplyModal(true);
        setPendingJobApply(null);
      }

      // Keep applications list synchronized periodically to get timing updates
      const interval = setInterval(() => {
        loadApplications();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Speech Recognition Check
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Text-To-Speech (AI Speaking)
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start Voice Interview Flow
  const handleStartInterview = async (app) => {
    setActiveInterviewApp(app);
    setIsInterviewing(true);
    setInterviewRound(1);
    setInterviewReport(null);
    setSpeechAnswer('');
    
    const welcomeText = `Hello ${currentUser.name}, thank you for joining the interview for the ${app.jobTitle} position today. Let's begin.`;
    
    setEvaluating(true);
    try {
      const initialQuestion = await apiService.getNextInterviewQuestion(app.jobTitle, 1, []);
      
      setInterviewHistory([
        { role: 'assistant', content: initialQuestion }
      ]);
      
      const combinedSpeech = `${welcomeText} ${initialQuestion}`;
      speakQuestion(combinedSpeech);
    } catch (e) {
      console.error(e);
      alert('Failed to start interview.');
      setIsInterviewing(false);
      setActiveInterviewApp(null);
    } finally {
      setEvaluating(false);
    }
  };

  // Start Voice Speech Recognition
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
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
      setSpeechAnswer(prev => prev + ' ' + text);
    };

    rec.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
  };

  // Submit Answer
  const handleNextRound = async () => {
    if (!speechAnswer.trim()) {
      alert('Please voice or type your answer before submitting.');
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech

    const jobTitle = activeInterviewApp.jobTitle;

    // Save answer to history
    const updatedHistory = [...interviewHistory, { role: 'user', content: speechAnswer }];
    setInterviewHistory(updatedHistory);
    setSpeechAnswer('');

    if (interviewRound < 3) {
      const nextRoundNum = interviewRound + 1;
      setInterviewRound(nextRoundNum);
      
      setEvaluating(true);
      try {
        const nextQ = await apiService.getNextInterviewQuestion(jobTitle, nextRoundNum, updatedHistory);
        setInterviewHistory(prev => [...prev, { role: 'assistant', content: nextQ }]);
        speakQuestion(nextQ);
      } catch (e) {
        console.error(e);
      } finally {
        setEvaluating(false);
      }
    } else {
      // Interview complete! Evaluate.
      setEvaluating(true);
      try {
        const report = await apiService.evaluateInterview(jobTitle, updatedHistory);
        
        // Auto-shortlist threshold: 75+
        const passed = report.score >= 75;
        const status = passed ? 'Shortlisted' : 'Rejected';
        
        await apiService.saveInterviewReport(activeInterviewApp.id, status, report.score, report);

        setInterviewReport(report);
        setIsInterviewing(false);
        loadApplications();
        
        if (passed) {
          speakQuestion(`Congratulations! You are shortlisted for the one-to-one technical interview. Date and time will be notified later.`);
        } else {
          speakQuestion("Thank you. The interview is now complete. We have generated your performance report.");
        }
      } catch (e) {
        console.error(e);
        alert('Evaluation failed.');
        setIsInterviewing(false);
        setActiveInterviewApp(null);
      } finally {
        setEvaluating(false);
      }
    }
  };

  const loadProfileData = async () => {
    try {
      const data = await apiService.getCandidateProfile();
      setProfile(data);
      setProfileName(data.name || '');
      setProfileSkills(data.skills || '');
      setProfileEducation(data.education || '');
      setProfileExperience(data.experience || '');
      
      setApplyName(data.name || '');
      setApplySkills(data.skills || '');
      setApplyEducation(data.education || '');
      setApplyExperience(data.experience || '');
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const loadApplications = async () => {
    setAppsLoading(true);
    try {
      const data = await apiService.getCandidateApplications();
      setApplications(data);
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setAppsLoading(false);
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail || !authPassword || (authMode === 'register' && !authName)) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    setAuthLoading(true);
    try {
      let result;
      if (authMode === 'login') {
        result = await apiService.candidateLogin(authEmail, authPassword);
      } else {
        result = await apiService.candidateRegister(authName, authEmail, authPassword);
      }
      onLoginSuccess(result);
      setShowAuthModal(false);
      setAuthName('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Resume Upload to Profile
  const handleProfileResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setProfileMsg({ type: 'error', text: 'Only PDF files are supported.' });
      return;
    }

    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await apiService.uploadCandidateResume(file);
      setProfile(res.profile);
      setProfileMsg({ type: 'success', text: `Resume PDF "${file.name}" uploaded and parsed successfully!` });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to upload resume PDF.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Update Profile Text Info
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const updated = await apiService.updateCandidateProfile({
        name: profileName,
        skills: profileSkills,
        education: profileEducation,
        experience: profileExperience
      });
      setProfile(updated);
      setProfileMsg({ type: 'success', text: 'Candidate profile details updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Apply Action (Triggers auth if guest)
  const handleApplyClick = (job) => {
    if (!currentUser) {
      setPendingJobApply(job);
      setAuthMode('login');
      setShowAuthModal(true);
    } else {
      setSelectedJob(job);
      setShowApplyModal(true);
    }
  };

  // Apply Form Submission
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');
    setApplySuccess(false);

    if (!selectedJob) return;

    if (!applyResumeFile && (!profile || !profile.resumeText)) {
      setApplyError('Please upload a PDF resume file.');
      return;
    }

    setApplyLoading(true);
    try {
      await apiService.candidateApply(
        selectedJob.id,
        {
          name: applyName,
          skills: applySkills,
          education: applyEducation,
          experience: applyExperience
        },
        applyResumeFile
      );
      
      setApplySuccess(true);
      loadApplications();
      setTimeout(() => {
        setShowApplyModal(false);
        setApplySuccess(false);
        setApplyResumeFile(null);
        setSelectedJob(null);
      }, 2000);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setApplyLoading(false);
    }
  };

  const departments = ['All', ...new Set(jobs.map(j => j.department))];
  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        j.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = selectedDept === 'All' || j.department === selectedDept;
    return matchSearch && matchDept;
  });

  const isAlreadyApplied = (jobId) => {
    return applications.some(app => app.jobId === jobId);
  };

  const notifications = applications.filter(app => ['Interviewing', 'Shortlisted', 'Rejected', 'Offered'].includes(app.status));

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Offered': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'Shortlisted': return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20';
      case 'Interviewing': return 'bg-violet-500/15 text-violet-400 border-violet-500/20';
      case 'Screening': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'Rejected': return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (activeInterviewApp) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 max-w-2xl w-full min-h-[500px] flex flex-col justify-between shadow-2xl relative animate-fade-in">
          
          {isInterviewing ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h5 className="text-sm font-bold text-slate-200">AI Voice Interview Round</h5>
                  <p className="text-xs text-indigo-400 font-semibold">{activeInterviewApp.jobTitle}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                  ROUND {interviewRound} OF 3
                </span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 my-4 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl overflow-y-auto max-h-[260px] space-y-3.5 scrollbar-thin">
                {interviewHistory.map((h, idx) => (
                  <div key={idx} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      h.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                        : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/65'
                    }`}>
                      <span className="font-bold block mb-1 text-[9px] uppercase tracking-wide opacity-80">
                        {h.role === 'user' ? currentUser.name : 'AI Interviewer'}
                      </span>
                      {h.content}
                    </div>
                  </div>
                ))}
                {evaluating && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span className="text-xs">Evaluating answer...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Soundwave Mic Button & Fallback Input */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  {speechSupported && (
                    <button
                      onClick={toggleListening}
                      disabled={evaluating}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg border transition-all ${
                        isListening 
                          ? 'bg-rose-600 text-white border-rose-500 animate-pulse scale-[1.05]' 
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-850 hover:border-slate-750'
                      }`}
                      title={isListening ? "Listening... Click to pause" : "Click to speak answer"}
                    >
                      {isListening ? <Mic className="w-6 h-6 animate-pulse" /> : <MicOff className="w-6 h-6" />}
                    </button>
                  )}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={speechAnswer}
                      onChange={(e) => setSpeechAnswer(e.target.value)}
                      disabled={evaluating}
                      placeholder={isListening ? "Listening to voice input..." : "Speak using mic or type response..."}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-10 py-3.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleNextRound}
                      disabled={evaluating || !speechAnswer.trim()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {isListening && (
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-rose-455 font-semibold animate-pulse">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                    <span>Microphone Active: Transcribing your voice live...</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setIsInterviewing(false);
                    setActiveInterviewApp(null);
                    window.speechSynthesis.cancel();
                  }}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/20 hover:border-rose-500/35 transition-colors"
                >
                  Terminate Interview Session
                </button>
              </div>
            </div>
          ) : interviewReport ? (
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                  <div>
                    <h4 className="text-base font-bold text-slate-200">AI Recruiter Evaluation Report</h4>
                    <p className="text-xs text-indigo-400 font-semibold">{activeInterviewApp.jobTitle}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    interviewReport.score >= 75 
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' 
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                  }`}>
                    {interviewReport.score >= 75 ? 'SHORTLISTED' : 'COMPLETED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interview Score</span>
                    <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">{interviewReport.score}%</h3>
                    <span className="text-[9px] text-slate-500 font-semibold mt-1">AI Recommendation</span>
                  </div>

                  <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-1.5 md:col-span-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Technical Knowledge:</span>
                      <span className="text-slate-200 font-bold">{interviewReport.technical}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Communication Skill:</span>
                      <span className="text-slate-200 font-bold">{interviewReport.communication}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Confidence Indicator:</span>
                      <span className="text-slate-200 font-bold">{interviewReport.confidence}</span>
                    </div>
                  </div>
                </div>

                {interviewReport.score >= 75 ? (
                  <div className="bg-cyan-950/10 border border-cyan-550/30 p-4 rounded-2xl space-y-1.5">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 animate-bounce" />
                      Congratulations! You are shortlisted!
                    </span>
                    <p className="text-slate-350 leading-relaxed text-xs">
                      Congratulations! You are shortlisted for the one-to-one technical interview. Date and time will be notified later.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 p-4 border border-slate-855 rounded-2xl text-xs space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI Recruiter Feedback</span>
                    <p className="text-slate-300 leading-relaxed italic">"{interviewReport.feedback}"</p>
                  </div>
                )}

                <div className="text-xs text-slate-400 leading-relaxed mt-4 whitespace-pre-line border-t border-slate-850 pt-3 max-h-[160px] overflow-y-auto">
                  {interviewReport.reportText}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-3">
                <button
                  onClick={() => {
                    setInterviewReport(null);
                    setActiveInterviewApp(null);
                  }}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  Return to My Applications
                </button>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-y-auto">
      
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/80 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && !currentUser && (
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-indigo-100 to-white bg-clip-text text-transparent flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                SmartHRMS Careers
              </h1>
            </div>
          </div>

          {/* Center Tabs (Logged-in Candidates) */}
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 border border-slate-850 rounded-xl">
              {[
                { id: 'jobs', label: 'Explore Jobs' },
                { id: 'applications', label: 'My Applications' },
                { id: 'profile', label: 'My Profile' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedJob(null); }}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Right Controls */}
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-200">{currentUser.name}</p>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10">Candidate</span>
              </div>

              {/* Notification Bell Dropdown Container */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      loadApplications();
                    }
                  }}
                  className={`p-2 rounded-xl border transition-all relative ${
                    showNotifications 
                      ? 'bg-indigo-650 border-indigo-550 text-white shadow-md' 
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-255'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 border border-slate-950 rounded-full animate-pulse" />
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-805 pb-2">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Alerts Center</h4>
                      {notifications.length > 0 && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold">
                          {notifications.length} Message{notifications.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto space-y-2.5 divide-y divide-slate-850/60 scrollbar-thin pr-1">
                      {notifications.length > 0 ? (
                        notifications.map((app, idx) => (
                          <div 
                            key={app.id} 
                            onClick={() => {
                              setActiveTab('applications');
                              setSelectedJob(null);
                              setShowNotifications(false);
                            }}
                            className="pt-2.5 first:pt-0 cursor-pointer text-left hover:opacity-90 transition-opacity"
                          >
                            <div className="flex items-start gap-2.5">
                              {app.status === 'Offered' && <Award className="w-4 h-4 text-emerald-455 shrink-0 mt-0.5" />}
                              {app.status === 'Interviewing' && <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
                              {app.status === 'Rejected' && <AlertCircle className="w-4 h-4 text-rose-455 shrink-0 mt-0.5" />}
                              <div className="text-[11px] leading-relaxed">
                                <p className="font-bold text-slate-200 leading-tight">{app.jobTitle}</p>
                                {app.status === 'Offered' && (
                                  <p className="text-emerald-400 font-semibold mt-0.5">🎉 Offered! Click to view details.</p>
                                )}
                                {app.status === 'Interviewing' && (
                                  <div>
                                    <p className="text-indigo-400 font-semibold mt-0.5">✨ Shortlisted for interview</p>
                                    {app.interviewDate ? (
                                      <p className="text-slate-400 text-[10px] mt-0.5">
                                        Date: {app.interviewDate} at {app.interviewTime}
                                      </p>
                                    ) : (
                                      <p className="text-slate-500 italic text-[10px] mt-0.5">Interview schedule pending</p>
                                    )}
                                  </div>
                                )}
                                {app.status === 'Shortlisted' && (
                                  <div>
                                    <p className="text-cyan-400 font-semibold mt-0.5">🏆 Shortlisted for 1-to-1 Technical Interview!</p>
                                    {app.techInterviewDate ? (
                                      <p className="text-slate-400 text-[10px] mt-0.5">
                                        Date: {app.techInterviewDate} at {app.techInterviewTime}
                                      </p>
                                    ) : (
                                      <p className="text-slate-500 italic text-[10px] mt-0.5">Date & time will be notified later</p>
                                    )}
                                  </div>
                                )}
                                {app.status === 'Rejected' && (
                                  <p className="text-rose-400 mt-0.5">Application vetted (not selected).</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-slate-500 text-[11px] font-semibold italic">
                          No alerts right now.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-450 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.01]"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 2. MAIN PAGE WRAPPER */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* ==================================================== */}
        {activeTab === 'jobs' && !selectedJob && (
          <div className="space-y-12">
            
            {/* HERO SECTION */}
            <div className="text-center py-16 relative max-w-4xl mx-auto space-y-6">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-605/10 rounded-full blur-[100px] pointer-events-none" />
              <span className="text-sm font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-4 py-1.5 rounded-full border border-indigo-500/15">
                We're Hiring!
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Build the Future of AI-Powered HR Systems With Us
              </h2>
              <p className="text-base sm:text-lg text-slate-350 max-w-2xl mx-auto leading-relaxed">
                Join our high-performing team and build next-generation AI automation portals. We value ownership, speed, and design-first thinking.
              </p>
              
              {/* Micro-perks */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-slate-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400" /> Remote First</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400" /> Learning Stipends</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-indigo-400" /> Global Team</span>
              </div>
            </div>

            {/* COMPANY CULTURE / BENEFITS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'AI-First Projects', desc: 'Work with LLMs, Gemini APIs, and voice synthesis pipelines.', icon: Cpu, color: 'text-indigo-400' },
                { title: 'Global Freedom', desc: 'Work from anywhere in the world. Choose your own workspace.', icon: Globe, color: 'text-emerald-400' },
                { title: 'Competitive Rewards', desc: 'Excellent base pay, medical benefits, and equity grants.', icon: Award, color: 'text-amber-400' },
                { title: 'Health & Wellness', desc: 'Comprehensive coverage, fitness stipends, and wellness allowances.', icon: Heart, color: 'text-rose-400' }
              ].map((benefit, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-850 transition-colors shadow-lg">
                  <div className={`w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-900 ${benefit.color}`}>
                    <benefit.icon className="w-5 h-5" />
                  </div>
                  <div className="mt-5">
                    <h4 className="text-base font-bold text-slate-200">{benefit.title}</h4>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* OPEN POSITIONS BOARD SECTION */}
            <div className="space-y-6 pt-8 border-t border-slate-900">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">Open Opportunities</h3>
                  <p className="text-sm text-slate-450 mt-1">Filter by departments or search positions directly</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-650" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-slate-850 rounded-xl pl-11 pr-3 py-3 text-sm text-slate-205 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-650"
                    />
                  </div>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="bg-slate-900 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors font-semibold shadow-sm"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d} Department</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Jobs List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map(job => (
                    <div 
                      key={job.id} 
                      className="bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800 p-6 rounded-2xl flex flex-col justify-between transition-all group shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-bold text-slate-200 group-hover:text-indigo-400 transition-colors leading-tight">{job.title}</h4>
                          <span className="text-xs font-bold px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md whitespace-nowrap">
                            {job.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-450 font-bold uppercase mt-3">
                          <span>{job.department}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mt-4 mb-6">{job.description}</p>
                      </div>

                      <div className="flex gap-3 pt-3 border-t border-slate-900/40">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-855 text-slate-400 text-sm font-semibold rounded-xl transition-colors"
                        >
                          View Details
                        </button>
                        {isAlreadyApplied(job.id) ? (
                          <button
                            disabled
                            className="flex-1 py-2.5 bg-slate-800 text-slate-500 border border-slate-700 text-sm font-semibold rounded-xl cursor-not-allowed"
                          >
                            Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(job)}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-indigo-650/10"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/10 border border-dashed border-slate-855 rounded-2xl">
                    <Briefcase className="w-10 h-10 mx-auto text-slate-800 mb-2" />
                    <h5 className="text-sm font-bold text-slate-450">No active vacancies match your criteria</h5>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* JOB DETAILS FULL-SCREEN COVER VIEW                   */}
        {/* ==================================================== */}
        {activeTab === 'jobs' && selectedJob && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setSelectedJob(null)}
              className="text-sm font-bold text-slate-400 hover:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to open positions
            </button>

            <div className="border-b border-slate-850 pb-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-slate-100">{selectedJob.title}</h2>
                  <p className="text-sm text-indigo-400 font-bold uppercase mt-1.5">{selectedJob.department} • {selectedJob.location}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  {selectedJob.type}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Detailed Description</h4>
              <p className="text-base text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedJob.description}</p>
            </div>

            {isAlreadyApplied(selectedJob.id) ? (
              <button
                disabled
                className="w-full py-3.5 bg-slate-800 text-slate-500 border border-slate-700 text-sm font-bold rounded-xl cursor-not-allowed"
              >
                Applied to this Role
              </button>
            ) : (
              <button
                onClick={() => handleApplyClick(selectedJob)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-550 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-650/10 transition-colors"
              >
                Apply to this Role
              </button>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* MY APPLICATIONS TAB (CANDIDATE MODE)                 */}
        {/* ==================================================== */}
        {activeTab === 'applications' && currentUser && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-855 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Submitted Applications</h3>
                <p className="text-xs text-slate-450 mt-0.5">Track the screening and evaluation stage of your submissions</p>
              </div>
              <button 
                onClick={loadApplications}
                className="text-xs font-extrabold text-indigo-400 hover:text-indigo-350 transition-colors"
              >
                Refresh Board
              </button>
            </div>

            {appsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <h4 className="text-sm sm:text-base font-bold text-slate-200">{app.jobTitle}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-450 font-semibold">
                        <span>Submitted: {new Date(app.createdAt).toLocaleDateString()}</span>
                        {app.resumeFileName && (
                          <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {app.resumeFileName}</span>
                        )}
                      </div>
                             {/* Selection / Interview Schedule / Rejection details */}
                      {app.status === 'Interviewing' && (
                        <div className="mt-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-3 max-w-md animate-fade-in">
                          <p className="text-indigo-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Shortlisted for AI Voice Interview
                          </p>
                          {app.interviewDate ? (
                            <div className="space-y-2">
                              <p className="text-slate-350">
                                Date: <span className="font-bold text-slate-200">{app.interviewDate}</span> at <span className="font-bold text-slate-200">{app.interviewTime}</span>
                              </p>
                              {(() => {
                                const now = new Date();
                                const scheduledDateTime = new Date(`${app.interviewDate}T${app.interviewTime}`);
                                const isLocked = isNaN(scheduledDateTime.getTime()) ? true : now < scheduledDateTime;

                                if (isLocked) {
                                  return (
                                    <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-lg text-slate-500 text-[11px] font-semibold border border-slate-900">
                                      <Clock className="w-3.5 h-3.5 shrink-0" />
                                      <span>Locked until scheduled date and time</span>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <button
                                      onClick={() => handleStartInterview(app)}
                                      className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.01]"
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                      Start AI Voice Interview
                                    </button>
                                  );
                                }
                              })()}
                            </div>
                          ) : (
                            <p className="text-slate-455 italic">Interview timing will be scheduled shortly by HR.</p>
                          )}
                        </div>
                      )}
                      {app.status === 'Shortlisted' && (
                        <div className="mt-2 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs space-y-2.5 max-w-md shadow-lg shadow-cyan-950/20">
                          <p className="text-cyan-400 font-extrabold flex items-center gap-1.5 text-sm">
                            <Award className="w-4 h-4 text-cyan-400 animate-pulse" />
                            Shortlisted for 1-to-1 Interview!
                          </p>
                          {app.techInterviewDate ? (
                            <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
                              <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider">Scheduled Technical Round</p>
                              <p className="text-slate-200 font-bold text-xs">
                                Date: {app.techInterviewDate} at {app.techInterviewTime}
                              </p>
                              <p className="text-indigo-400 text-[10px] font-medium mt-1">Please be ready at the scheduled time. A recruiter will contact you.</p>
                            </div>
                          ) : (
                            <p className="text-slate-350 leading-relaxed font-semibold">
                              Congratulations! You are shortlisted for the one-to-one technical interview. Date and time will be notified later.
                            </p>
                          )}
                        </div>
                      )}
                      {app.status === 'Rejected' && (
                        <div className="mt-2 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/15 text-xs max-w-md">
                          <p className="text-rose-455 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Application Vetted (Not Selected)
                          </p>
                          <p className="text-slate-500 mt-0.5">Thank you for applying. We wish you success in your future endeavors.</p>
                        </div>
                      )}
                      {app.status === 'Offered' && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs max-w-md">
                          <p className="text-emerald-450 font-bold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Congratulations! You have received a job offer!
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      {app.matchScore > 0 ? (
                        <div className="text-right">
                          <span className="text-[10px] sm:text-xs text-slate-450 font-semibold uppercase block">AI Match Score</span>
                          <span className="text-sm font-extrabold text-indigo-400">{app.matchScore}% Match</span>
                        </div>
                      ) : (
                        <div className="text-right text-xs text-slate-500 italic font-semibold">
                          Vetting Process Running
                        </div>
                      )}

                      <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${getStatusStyle(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500">
                <FileText className="w-9 h-9 mx-auto text-slate-750 mb-3" />
                <h4 className="text-sm font-bold text-slate-450">No opportunities applied for yet</h4>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="text-sm text-indigo-400 hover:text-indigo-350 font-bold mt-2 underline"
                >
                  Explore Vacancies
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* CANDIDATE PROFILE SCREEN                             */}
        {/* ==================================================== */}
        {activeTab === 'profile' && currentUser && profile && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-855 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">My Candidate Profile</h3>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">Ensure your contact details and skills list match your latest resume file to help AI algorithms index your profile.</p>
            </div>

            {profileMsg && (
              <div className={`p-3 text-sm rounded-xl border ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PDF Resume Parser Card */}
              <div className="bg-slate-950/40 p-5 border border-slate-850 rounded-2xl flex flex-col justify-between min-h-[260px]">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                    <Upload className="w-3.5 h-3.5" /> PDF Resume File
                  </span>
                  
                  {profile.resumeFileName ? (
                    <div className="bg-indigo-500/5 p-4 border border-indigo-500/15 rounded-xl flex items-center gap-3 mb-4">
                      <FileText className="w-8 h-8 text-indigo-400 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-200 truncate">{profile.resumeFileName}</p>
                        <span className="text-xs text-slate-450 font-semibold block uppercase">PDF Uploaded & Parsed</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 border-2 border-dashed border-slate-855 rounded-xl flex flex-col items-center justify-center text-center text-slate-500 mb-4">
                      <FileText className="w-8 h-8 text-slate-800 mb-2 animate-pulse" />
                      <p className="text-sm font-semibold text-slate-400">No resume PDF uploaded</p>
                      <p className="text-xs text-slate-500 mt-0.5 uppercase font-bold tracking-wider">PDF Standard required</p>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    id="profile-pdf-upload"
                    onChange={handleProfileResumeUpload}
                    disabled={profileLoading}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-pdf-upload"
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-slate-850 hover:border-slate-750 hover:bg-slate-850 text-slate-350 hover:text-slate-200 rounded-xl text-sm font-bold cursor-pointer transition-all shadow-sm"
                  >
                    {profileLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Parsing PDF resume...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        {profile.resumeFileName ? 'Replace PDF Resume' : 'Upload PDF Resume'}
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Profile Fields Editor Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Core Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={profileSkills}
                    onChange={(e) => setProfileSkills(e.target.value)}
                    placeholder="React, CSS, Node, MongoDB"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Education</label>
                  <input
                    type="text"
                    value={profileEducation}
                    onChange={(e) => setProfileEducation(e.target.value)}
                    placeholder="M.Sc Computer Science"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Professional Experience</label>
                  <textarea
                    rows={3}
                    value={profileExperience}
                    onChange={(e) => setProfileExperience(e.target.value)}
                    placeholder="2 Years Lead Developer at DevCorp..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-550 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                >
                  Update Profile Info
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* POPUP AUTH MODAL (LOGIN / REGISTER DIALOG)            */}
      {/* ==================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">
            
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-300 uppercase tracking-wider">
                {authMode === 'login' ? 'Candidate Access' : 'Register Candidate Profile'}
              </h3>
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {authMode === 'login' ? 'Create Account?' : 'Have Account?'}
              </button>
            </div>

            {authError && (
              <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-650" />
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Aditya Verma"
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-9 pr-3 text-sm text-slate-202 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-650" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="aditya@example.com"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-9 pr-3 text-sm text-slate-202 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-650" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-3 pl-9 pr-3 text-sm text-slate-202 focus:outline-none focus:border-indigo-500 placeholder-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-405 text-sm font-bold rounded-xl border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-550 hover:to-violet-550 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-650/10 flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* POPUP SUBMIT APPLICATION FORM MODAL (PDF ATTACHER)   */}
      {/* ==================================================== */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            
            <div className="border-b border-slate-850 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Apply for Job Role</h3>
              <p className="text-xs text-indigo-400 font-semibold">{selectedJob.title} • {selectedJob.location}</p>
            </div>

            {applyError && (
              <div className="p-3 text-sm rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                {applyError}
              </div>
            )}

            {applySuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
                <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                <h4 className="text-base font-bold text-slate-200">Application Staged Successfully!</h4>
                <p className="text-xs text-slate-450">Your profile credentials and parsed PDF resume have been successfully forwarded to recruitment.</p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Candidate Name</label>
                  <input
                    type="text"
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-550 placeholder-slate-700"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Highest Education</label>
                    <input
                      type="text"
                      value={applyEducation}
                      onChange={(e) => setApplyEducation(e.target.value)}
                      placeholder="e.g. Master of Computer Applications"
                      required
                      className="w-full bg-slate-955 border border-slate-855 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-550 placeholder-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Years of Experience</label>
                    <input
                      type="text"
                      value={applyExperience}
                      onChange={(e) => setApplyExperience(e.target.value)}
                      placeholder="e.g. 2 Years at Startup"
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-555 placeholder-slate-700"
                    />
                  </div>
                </div>

                {/* PDF Resume Upload Section */}
                <div className="bg-slate-955/40 p-4 border border-slate-850 rounded-2xl">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <Upload className="w-3.5 h-3.5" /> PDF Application Resume
                  </span>
                  
                  {applyResumeFile ? (
                    <div className="bg-indigo-500/5 p-3.5 border border-indigo-500/15 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-7 h-7 text-indigo-400 shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-200 truncate">{applyResumeFile.name}</p>
                          <span className="text-xs text-slate-450 font-semibold block uppercase">File attached to application</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setApplyResumeFile(null)}
                        type="button"
                        className="text-xs font-bold text-rose-400 hover:text-rose-350 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : profile && profile.resumeText ? (
                    <div className="flex flex-col gap-2">
                      <div className="bg-slate-900/60 p-3 border border-slate-850 rounded-xl flex items-center gap-2.5">
                        <CheckCircle className="w-4.5 h-4.5 text-indigo-400" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-350">Reuse Profile Resume</p>
                          <span className="text-xs text-slate-500 block truncate">{profile.resumeFileName || 'Saved Resume PDF'}</span>
                        </div>
                      </div>
                      <div className="text-center py-1.5">
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">or</span>
                        <input
                          type="file"
                          accept=".pdf"
                          id="modal-pdf-upload"
                          onChange={(e) => setApplyResumeFile(e.target.files[0])}
                          className="hidden"
                        />
                        <label
                          htmlFor="modal-pdf-upload"
                          className="text-xs font-bold text-indigo-400 hover:text-indigo-350 border border-indigo-500/20 hover:border-indigo-500/40 px-3 py-1 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-lg cursor-pointer transition-all inline-block"
                        >
                          Upload Custom PDF Resume
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept=".pdf"
                        id="modal-pdf-upload"
                        onChange={(e) => setApplyResumeFile(e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="modal-pdf-upload"
                        className="w-full py-5 border-2 border-dashed border-slate-850 hover:border-slate-700 bg-slate-955/40 hover:bg-slate-900/10 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all text-slate-550 group"
                      >
                        <Upload className="w-5.5 h-5.5 text-slate-700 group-hover:text-indigo-400 transition-colors mb-1.5" />
                        <p className="text-sm font-bold text-slate-300 group-hover:text-slate-200 transition-colors">Select PDF Resume File</p>
                        <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide">PDF required for AI Match check</p>
                      </label>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-805 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-400 text-sm font-bold rounded-xl border border-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-550 disabled:opacity-50 text-white text-sm font-bold rounded-xl border border-indigo-550 shadow-md shadow-indigo-650/15 flex items-center justify-center gap-1.5 transition-all"
                  >
                    {applyLoading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

