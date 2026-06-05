import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Briefcase, FileText, CheckCircle, Clock, 
  Play, Volume2, Mic, MicOff, RefreshCw, Star, Sparkles, Send, Award, MessageSquare, AlertCircle, Upload
} from 'lucide-react';
import { apiService } from '../api/apiService';

export default function RecruiterDashboard({ activeSubTab, refreshKey, onTriggerRefresh }) {
  // DB States
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  
  // Job Form States
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('Engineering');
  const [jobType, setJobType] = useState('Full-time');
  const [jobLoc, setJobLoc] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobMsg, setJobMsg] = useState(null);

  // Resume Screening States
  const [screenJobId, setScreenJobId] = useState('');
  const [screenName, setScreenName] = useState('');
  const [screenEmail, setScreenEmail] = useState('');
  const [screenSkills, setScreenSkills] = useState('');
  const [screenResumeText, setScreenResumeText] = useState('');
  const [screenMethod, setScreenMethod] = useState('paste'); // 'paste' or 'upload'
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [screenResult, setScreenResult] = useState(null);

  // Job Description Source States
  const [jdSourceType, setJdSourceType] = useState('select'); // 'select' or 'custom'
  const [customJdText, setCustomJdText] = useState('');
  const [jdMethod, setJdMethod] = useState('paste'); // 'paste' or 'upload'
  const [uploadingJdFile, setUploadingJdFile] = useState(false);

  // Candidate Vetting States
  const [selectedVettingCand, setSelectedVettingCand] = useState(null);
  const [selectedScheduleCand, setSelectedScheduleCand] = useState(null);
  const [isVettingScreening, setIsVettingScreening] = useState(false);
  const [schDate, setSchDate] = useState('');
  const [schTime, setSchTime] = useState('');
  const [isShortlisting, setIsShortlisting] = useState(false);

  // Sync date/time when candidate is loaded
  useEffect(() => {
    if (selectedVettingCand) {
      setSchDate(selectedVettingCand.interviewDate || '');
      setSchTime(selectedVettingCand.interviewTime || '');
      setIsShortlisting(selectedVettingCand.status === 'Interviewing');
    } else if (selectedScheduleCand) {
      setSchDate(selectedScheduleCand.interviewDate || '');
      setSchTime(selectedScheduleCand.interviewTime || '');
    } else {
      setSchDate('');
      setSchTime('');
      setIsShortlisting(false);
    }
  }, [selectedVettingCand, selectedScheduleCand]);

  // Voice Interview States
  const [interviewJobId, setInterviewJobId] = useState('');
  const [interviewName, setInterviewName] = useState('');
  const [interviewEmail, setInterviewEmail] = useState('');
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [interviewRound, setInterviewRound] = useState(1); // 1, 2, 3
  const [interviewHistory, setInterviewHistory] = useState([]); // [{role: 'assistant'|'user', content: string}]
  const [isListening, setIsListening] = useState(false);
  const [speechAnswer, setSpeechAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [interviewReport, setInterviewReport] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Load Data
  useEffect(() => {
    const loadRecruiterData = async () => {
      try {
        const jList = await apiService.getJobs();
        setJobs(jList);
        
        const cList = await apiService.getCandidates();
        setCandidates(cList);

        if (jList.length > 0 && !screenJobId) {
          setScreenJobId(jList[0].id);
          setInterviewJobId(jList[0].id);
        }
      } catch (e) {
        console.error('Failed to load recruiter data from backend', e);
      }
    };
    loadRecruiterData();

    // Check Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, [refreshKey]);

  // Create Job
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobLoc || !jobDesc.trim()) {
      setJobMsg({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    try {
      await apiService.createJob({
        title: jobTitle,
        department: jobDept,
        type: jobType,
        location: jobLoc,
        description: jobDesc
      });
      setJobTitle('');
      setJobLoc('');
      setJobDesc('');
      setJobMsg({ type: 'success', text: 'Job posted successfully!' });
      onTriggerRefresh();
      setTimeout(() => setJobMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setJobMsg({ type: 'error', text: 'Failed to post job role.' });
    }
  };

  // Quick Load Resume Templates (Hackathon judges helper)
  const loadSampleResume = (type) => {
    if (type === 'react') {
      setScreenName('Ananya Rao');
      setScreenEmail('ananya.rao@gmail.com');
      setScreenResumeText(`ANANYA RAO
ananya.rao@gmail.com | +91 91111 22222
Frontend Developer (React Specialist)

SUMMARY:
A passionate React Developer with 4 years of experience building modern dashboards and user portals. Strong advocate for clean CSS, modular JavaScript, and optimized rendering.

SKILLS:
- React, Redux, Context API, Hooks, Javascript ES6
- Tailwind CSS, HTML5, CSS3, Vite
- Jest, React Testing Library, Git, REST APIs

EXPERIENCE:
React Engineer | AppCrafters (2022 - Present)
- Refactored legacy CSS codebases into Tailwind, reducing styling bundle size by 40%.
- Implemented state management using Redux Toolkit for complex checkout flows.
- Optimized app performance, increasing Lighthouse scores from 65 to 90+.

Frontend Developer | WebSparks (2020 - 2022)
- Built interactive UI widgets and charts using Recharts and React.
- Integrated auth services (JWT) and third-party dashboard APIs.`);
    } else {
      setScreenName('Rahul Mehta');
      setScreenEmail('rahul.mehta@gmail.com');
      setScreenResumeText(`RAHUL MEHTA
rahul.mehta@gmail.com | HR Recruiter

SUMMARY:
Dedicated HR Specialist with 3 years of experience managing employee relations, onboarding, and recruitment pipelines. Highly skilled in conflict resolution, payroll processing, and organizing engagement activities.

SKILLS:
Talent Acquisition, Onboarding, Employee Relations, MS Office, Workday

EXPERIENCE:
HR Generalist | FinTech Solutions (2023 - Present)
- Handled recruitment for engineering and marketing roles, screening 100+ resumes monthly.
- Managed onboarding checklist for 40+ new hires.
- Organized company-wide sports leagues and annual team events.`);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      return;
    }

    setUploadingFile(true);
    try {
      const res = await apiService.parseResumePDF(file);
      setScreenResumeText(res.text);
      alert('Resume PDF uploaded and parsed successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to parse resume PDF.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleJdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      return;
    }

    setUploadingJdFile(true);
    try {
      const res = await apiService.parseResumePDF(file);
      setCustomJdText(res.text);
      alert('Job Description PDF uploaded and parsed successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to parse Job Description PDF.');
    } finally {
      setUploadingJdFile(false);
    }
  };

  // AI Resume Screening Action
  const handleScreenResume = async () => {
    if (!customJdText.trim()) {
      alert('Please enter or upload Job Description details.');
      return;
    }

    if (!screenResumeText.trim()) {
      alert('Please enter or upload Candidate Resume details.');
      return;
    }

    setIsScreening(true);
    setScreenResult(null);

    try {
      const result = await apiService.screenResume(customJdText.trim(), screenResumeText.trim(), '');
      setScreenResult(result);
    } catch (e) {
      console.error(e);
      alert('AI Screening failed.');
    } finally {
      setIsScreening(false);
    }
  };

  const handleSaveScreenedCandidate = async () => {
    if (!screenResult) return;
    
    try {
      // Add candidate to DB
      const newCand = await apiService.addCandidate({
        jobId: screenJobId,
        name: screenName,
        email: screenEmail,
        skills: screenSkills,
        resumeText: screenResumeText
      });
      
      // Update candidate evaluation report details
      const status = (screenResult.recommendation === 'Strong Match' || screenResult.recommendation === 'Recommended') ? 'Interviewing' : 'Screening';
      await apiService.saveCandidateEvaluation(newCand.id, status, screenResult.matchScore, screenResult);

      // Reset screening forms
      setScreenName('');
      setScreenEmail('');
      setScreenSkills('');
      setScreenResumeText('');
      setCustomJdText('');
      setScreenResult(null);
      onTriggerRefresh();
      alert('Candidate successfully screened and added to the recruitment pipeline!');
    } catch (e) {
      console.error(e);
      alert('Failed to save candidate.');
    }
  };

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
  const handleStartInterview = async () => {
    if (!interviewName || !interviewEmail) {
      alert('Please fill in candidate details.');
      return;
    }

    setIsInterviewing(true);
    setInterviewRound(1);
    setInterviewReport(null);
    setSpeechAnswer('');
    
    const selectedJob = jobs.find(j => j.id === interviewJobId);
    const jobTitle = selectedJob ? selectedJob.title : 'Software Engineer';
    
    const welcomeText = `Hello ${interviewName}, thank you for joining the interview for the ${jobTitle} position today. Let's begin.`;
    
    setEvaluating(true);
    try {
      const initialQuestion = await apiService.getNextInterviewQuestion(jobTitle, 1, []);
      
      setInterviewHistory([
        { role: 'assistant', content: initialQuestion }
      ]);
      
      const combinedSpeech = `${welcomeText} ${initialQuestion}`;
      speakQuestion(combinedSpeech);
    } catch (e) {
      console.error(e);
      alert('Failed to start interview.');
      setIsInterviewing(false);
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

    const selectedJob = jobs.find(j => j.id === interviewJobId);
    const jobTitle = selectedJob ? selectedJob.title : 'Software Engineer';

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
        
        // Save report to database
        const newCand = await apiService.addCandidate({
          jobId: interviewJobId,
          name: interviewName,
          email: interviewEmail,
          resumeText: 'Conducted via AI Voice Interviewer'
        });
        
        const status = report.score >= 80 ? 'Offered' : 'Interviewing';
        await apiService.saveInterviewReport(newCand.id, status, report.score, report);

        setInterviewReport(report);
        setIsInterviewing(false);
        onTriggerRefresh();
        speakQuestion("Thank you. The interview is now complete. We have generated your performance report.");
      } catch (e) {
        console.error(e);
        alert('Evaluation failed.');
        setIsInterviewing(false);
      } finally {
        setEvaluating(false);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Offered': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'Interviewing': return 'bg-violet-500/15 text-violet-400 border-violet-500/20';
      case 'Screening': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'Rejected': return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* 1. Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Open Positions', count: jobs.length, icon: Briefcase, color: 'text-indigo-400' },
              { label: 'Active Candidates', count: candidates.length, icon: FileText, color: 'text-violet-400' },
              { label: 'Recommended Fit', count: candidates.filter(c => c.matchScore >= 80).length, icon: Award, color: 'text-emerald-400' },
              { label: 'Interview Rounds', count: candidates.filter(c => c.interviewReport).length, icon: MessageSquare, color: 'text-amber-400' }
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                  <h3 className="text-2xl font-bold text-slate-200 mt-1">{s.count}</h3>
                </div>
                <div className={`w-11 h-11 bg-slate-950/80 rounded-xl flex items-center justify-center border border-slate-800/80 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Candidates Pipeline Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Recruitment Pipeline & Candidate Stage</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 pr-2">Candidate Info</th>
                    <th className="pb-3 pr-2">Applied Position</th>
                    <th className="pb-3 pr-2">AI Match Score</th>
                    <th className="pb-3 pr-2">Stage</th>
                    <th className="pb-3 pr-2 text-right">Interview Evaluation</th>
                    <th className="pb-3 text-right">Vetting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-950/20 transition-colors">
                      <td className="py-3.5 pr-2">
                        <p className="font-semibold text-slate-200">{c.name}</p>
                        <p className="text-[10px] text-slate-500">{c.email}</p>
                      </td>
                      <td className="py-3.5 pr-2 text-slate-300 font-medium">{c.jobTitle}</td>
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            c.matchScore >= 85 ? 'text-emerald-400' :
                            c.matchScore >= 70 ? 'text-amber-400' :
                            'text-rose-400'
                          }`}>{c.matchScore || 'N/A'}%</span>
                          {c.matchScore > 0 && (
                            <div className="w-16 h-1.5 bg-slate-950 rounded-full border border-slate-900 overflow-hidden">
                              <div className={`h-full rounded-full ${
                                c.matchScore >= 85 ? 'bg-emerald-500' :
                                c.matchScore >= 70 ? 'bg-amber-500' :
                                'bg-rose-500'
                              }`} style={{ width: `${c.matchScore}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(c.status)}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-medium text-slate-400">
                        {c.interviewReport ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-emerald-400 font-bold">Score: {c.interviewReport.score}%</span>
                            <span className="text-[9px] text-slate-500 font-medium">Confidence: {c.interviewReport.confidence}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No Interview Conducted</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right font-medium flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedVettingCand(c)}
                          className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Review & Vet
                        </button>
                        {c.status === 'Interviewing' && (
                          <button
                            onClick={() => setSelectedScheduleCand(c)}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Interview Timing
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Job Postings Tab */}
      {activeSubTab === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Job Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Create New Position</h4>
              {jobMsg && (
                <div className={`p-3 text-xs rounded-xl mb-4 border ${
                  jobMsg.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {jobMsg.text}
                </div>
              )}
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Lead React Architect"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Department</label>
                    <select
                      value={jobDept}
                      onChange={(e) => setJobDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">HR</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Job Type</label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={jobLoc}
                    onChange={(e) => setJobLoc(e.target.value)}
                    placeholder="Bangalore, IN or Remote"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description & Skills</label>
                  <textarea
                    rows={4}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    placeholder="Outline job description and key requirements..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold border border-indigo-500 shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01]"
                >
                  <Plus className="w-4 h-4" />
                  Post Job Role
                </button>
              </form>
            </div>
          </div>

          {/* Job List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 font-sans">Active Positions Board</h4>
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {jobs.map((j) => (
                <div key={j.id} className="bg-slate-950/40 p-5 border border-slate-800 rounded-2xl hover:bg-slate-950/60 transition-colors flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{j.title}</h4>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">{j.department} • {j.location} • {j.type}</span>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                        {j.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{j.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-indigo-300 font-bold pt-1.5 border-t border-slate-900/60">
                      <span>Total Applications: {j.candidatesCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. AI Resume Screening Tab */}
      {activeSubTab === 'screening' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Screening Workspace */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-300">AI Screen Setup</h4>
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              
              <div className="space-y-4">
                {/* 1. Job Description block */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">1. Job Description (JD)</label>
                  <div className="flex gap-2 mb-3 bg-slate-950 p-1 border border-slate-800 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setJdMethod('paste')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        jdMethod === 'paste' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                      }`}
                    >
                      Paste JD Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setJdMethod('upload')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        jdMethod === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                      }`}
                    >
                      Upload JD PDF
                    </button>
                  </div>

                  {jdMethod === 'paste' ? (
                    <textarea
                      rows={5}
                      value={customJdText}
                      onChange={(e) => setCustomJdText(e.target.value)}
                      placeholder="Paste Job Description / Requirements here..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-100 font-mono placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="border border-dashed border-slate-850 rounded-2xl p-5 bg-slate-950/20 flex flex-col items-center justify-center text-center space-y-2 hover:border-indigo-500/40 transition-colors relative">
                        <Upload className="w-8 h-8 text-indigo-400 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Select Job Description PDF</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">PDF format only. Max 5MB.</p>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleJdUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingJdFile}
                        />
                      </div>

                      {uploadingJdFile && (
                        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold bg-indigo-500/5 p-3 border border-indigo-500/10 rounded-xl">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          Parsing Job Description text from PDF file...
                        </div>
                      )}

                      {customJdText && !uploadingJdFile && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Job Description text parsed successfully
                            </span>
                            <button
                              type="button"
                              onClick={() => setCustomJdText('')}
                              className="text-[9px] text-rose-455 font-bold hover:underline"
                            >
                              Clear Text
                            </button>
                          </div>
                          <div className="bg-slate-950/50 p-2.5 border border-slate-850 rounded-xl max-h-[120px] overflow-y-auto">
                            <pre className="text-[9px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">{customJdText}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">2. Candidate Resume</label>
                  
                  {/* Method Toggle Buttons */}
                  <div className="flex gap-2 mb-3 bg-slate-950 p-1 border border-slate-800 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setScreenMethod('paste')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        screenMethod === 'paste' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setScreenMethod('upload')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                        screenMethod === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                      }`}
                    >
                      Upload PDF File
                    </button>
                  </div>

                  {screenMethod === 'paste' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold">Enter candidate resume text details</span>
                        {/* Hackathon quick-load helpers */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => loadSampleResume('react')}
                            className="text-[9px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-0.5 border border-indigo-500/20 rounded font-semibold transition-all"
                          >
                            Sample React
                          </button>
                          <button
                            type="button"
                            onClick={() => loadSampleResume('hr')}
                            className="text-[9px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 px-2 py-0.5 border border-violet-500/20 rounded font-semibold transition-all"
                          >
                            Sample HR
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={8}
                        value={screenResumeText}
                        onChange={(e) => setScreenResumeText(e.target.value)}
                        placeholder="Copy-paste the resume text content here for OCR simulation extraction..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-[11px] text-slate-100 font-mono placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border border-dashed border-slate-800 rounded-2xl p-6 bg-slate-950/20 flex flex-col items-center justify-center text-center space-y-3 hover:border-indigo-500/40 transition-colors relative">
                        <Upload className="w-8 h-8 text-indigo-400 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-slate-300">Select candidate resume PDF</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">PDF format only. Maximum size: 5MB.</p>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleResumeUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingFile}
                        />
                      </div>
                      
                      {uploadingFile && (
                        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold bg-indigo-500/5 p-3 border border-indigo-500/10 rounded-xl">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          Parsing resume text from PDF file...
                        </div>
                      )}

                      {screenResumeText && !uploadingFile && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Resume text parsed successfully
                            </span>
                            <button
                              type="button"
                              onClick={() => setScreenResumeText('')}
                              className="text-[9px] text-rose-455 font-bold hover:underline"
                            >
                              Clear Text
                            </button>
                          </div>
                          <div className="bg-slate-950/50 p-3.5 border border-slate-850 rounded-2xl max-h-[140px] overflow-y-auto">
                            <pre className="text-[9px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">{screenResumeText}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleScreenResume}
                disabled={isScreening}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                {isScreening ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI Analyzing Resume (Gemini Service)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Run AI Screening Check
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[400px]">
            {isScreening ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border border-indigo-500/30 border-t-indigo-500 animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-slate-200">Gemini Parsing Resume Details</h5>
                  <p className="text-[10px] text-slate-500 mt-1">Comparing experience benchmarks, checking skill matrix, & predicting fit index</p>
                </div>
              </div>
            ) : screenResult ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">AI Screening Results</h4>
                      <p className="text-[10px] text-slate-500">Evaluated Candidate: {screenName}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      (screenResult.recommendation === 'Strong Match' || screenResult.recommendation === 'Recommended') ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                      (screenResult.recommendation === 'Moderate Match' || screenResult.recommendation === 'Borderline') ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/15 text-rose-400 border-rose-500/20'
                    }`}>
                      {screenResult.recommendation.toUpperCase()}
                    </span>
                  </div>
 
                  {/* Match Gauge */}
                  <div className="flex items-center gap-4 py-4">
                    <div className="relative w-20 h-20 flex items-center justify-center shrink-0 bg-slate-950/60 rounded-full border border-slate-800">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="26" stroke="#0f172a" strokeWidth="4" fill="transparent" />
                        <circle cx="32" cy="32" r="26" stroke={screenResult.matchScore >= 80 ? '#10b981' : screenResult.matchScore >= 60 ? '#f59e0b' : '#ef4444'} 
                          strokeWidth="4" fill="transparent" 
                          strokeDasharray="163" strokeDashoffset={163 - (163 * screenResult.matchScore) / 100}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-sm font-extrabold text-slate-100">{screenResult.matchScore}%</span>
                        <span className="text-[7px] text-slate-500 uppercase font-bold">Match</span>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-300">AI Profile Match Score</h5>
                      <p className="text-[10px] text-slate-400 mt-1">{(screenResult.recommendation === 'Strong Match' || screenResult.recommendation === 'Recommended') ? 'Exceeds standard qualifications. Move candidate to interviews.' : 'Gaps in skills require validation in manual vetting.'}</p>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Core Strengths
                      </span>
                      <ul className="space-y-1.5">
                        {screenResult.strengths.map((str, idx) => (
                          <li key={idx} className="text-[11px] text-slate-300 list-disc list-inside">{str}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" /> Areas to Investigate / Gaps
                      </span>
                      <ul className="space-y-1.5">
                        {screenResult.weaknesses.map((w, idx) => (
                          <li key={idx} className="text-[11px] text-slate-300 list-disc list-inside">{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex gap-3">
                  <button
                    onClick={() => setScreenResult(null)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                  >
                    Clear Results & Screen Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-slate-500">
                <FileText className="w-10 h-10 text-slate-750 mb-3" />
                <h5 className="text-xs font-semibold text-slate-400">Screening Panel Idle</h5>
                <p className="text-[10px] text-slate-500 max-w-[280px] mt-1">Provide job description and candidate resume (by pasting text or uploading PDF files), then trigger the AI screening check.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. AI Voice Interviewer Tab */}
      {activeSubTab === 'interviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup / Detail Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[450px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-300">Voice Interview Workspace</h4>
                <Volume2 className="w-4 h-4 text-indigo-400" />
              </div>

              {!speechSupported && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 rounded-xl mb-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Web Speech API Unrecognized:</span> Voice capabilities are unavailable in this browser. You can type candidate responses instead.
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Job Role Position</label>
                  <select
                    value={interviewJobId}
                    onChange={(e) => setInterviewJobId(e.target.value)}
                    disabled={isInterviewing}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Candidate Full Name</label>
                  <input
                    type="text"
                    value={interviewName}
                    onChange={(e) => setInterviewName(e.target.value)}
                    disabled={isInterviewing}
                    placeholder="Aditya Verma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Candidate Email</label>
                  <input
                    type="email"
                    value={interviewEmail}
                    onChange={(e) => setInterviewEmail(e.target.value)}
                    disabled={isInterviewing}
                    placeholder="aditya.verma@outlook.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              {isInterviewing ? (
                <button
                  onClick={() => {
                    setIsInterviewing(false);
                    window.speechSynthesis.cancel();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold border border-rose-500 shadow-md transition-colors"
                >
                  Terminate Interview Session
                </button>
              ) : (
                <button
                  onClick={handleStartInterview}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 text-white" />
                  Initiate AI Voice Interviewer
                </button>
              )}
            </div>
          </div>

          {/* Active Voice Chat Portal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col justify-between min-h-[450px]">
            {isInterviewing ? (
              <div className="flex-1 flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">Active Live Round Session</h5>
                    <p className="text-[10px] text-slate-500">Candidate: {interviewName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                    ROUND {interviewRound} OF 3
                  </span>
                </div>

                {/* Speech Wave / Dialog Stream */}
                <div className="flex-1 my-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl overflow-y-auto max-h-[220px] space-y-3.5 scrollbar-thin">
                  {interviewHistory.map((h, idx) => (
                    <div key={idx} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed ${
                        h.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/65'
                      }`}>
                        <span className="font-bold block mb-1 text-[9px] uppercase tracking-wide opacity-80">
                          {h.role === 'user' ? interviewName : 'AI Interviewer'}
                        </span>
                        {h.content}
                      </div>
                    </div>
                  ))}
                  {evaluating && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span className="text-[11px]">Evaluating answer...</span>
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
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-750'
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
                        placeholder={isListening ? "Listening to voice input..." : "Speak using mic or type candidate response here..."}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                      />
                      <button
                        onClick={handleNextRound}
                        disabled={evaluating || !speechAnswer.trim()}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isListening && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-rose-400 font-semibold animate-pulse">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                      <span>Microphone Active: Transcribing your voice live...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : interviewReport ? (
              // Stunning Interview Report Card
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">AI Recruiter Evaluation Report</h4>
                      <p className="text-[10px] text-slate-500">Candidate: {interviewName} ({interviewEmail})</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      COMPLETED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    {/* Circle Score */}
                    <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Interview Score</span>
                      <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">{interviewReport.score}%</h3>
                      <span className="text-[9px] text-slate-500 font-semibold mt-1">Recommended Fit</span>
                    </div>

                    {/* Matrix Status */}
                    <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl space-y-1 md:col-span-2 text-xs">
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

                  <div className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl text-xs space-y-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">AI HR FEEDBACK SUMMARY</span>
                    <p className="text-slate-300 leading-relaxed italic">"{interviewReport.feedback}"</p>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-relaxed font-sans mt-3 whitespace-pre-line border-t border-slate-850 pt-3">
                    {interviewReport.reportText}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex gap-3">
                  <button
                    onClick={() => {
                      setInterviewReport(null);
                      setInterviewName('');
                      setInterviewEmail('');
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl border border-indigo-500 shadow-md transition-all hover:scale-[1.01]"
                  >
                    Return to Lobby
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-slate-500">
                <Volume2 className="w-10 h-10 text-slate-750 mb-3" />
                <h5 className="text-xs font-semibold text-slate-400">Interviewer Lobby Empty</h5>
                <p className="text-[10px] text-slate-500 max-w-[280px] mt-1">Configure candidate details on the left panel, and initialize to open a microphone speech session.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Candidate Review & Vetting Modal */}
      {selectedVettingCand && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Review Candidate Application</h3>
                <p className="text-[10px] text-indigo-400 font-semibold">{selectedVettingCand.name} — {selectedVettingCand.email}</p>
              </div>
              <button
                onClick={() => setSelectedVettingCand(null)}
                className="text-xs text-slate-500 hover:text-slate-350 font-bold transition-colors"
              >
                Close Panel
              </button>
            </div>

            {/* Content Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Candidate Info and Resume */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Profile Information</h4>
                  <div className="bg-slate-950/50 p-4 border border-slate-850 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Job Title:</span>
                      <span className="text-slate-300 font-bold">{selectedVettingCand.jobTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Education:</span>
                      <span className="text-slate-300 font-bold">{selectedVettingCand.education || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Experience:</span>
                      <span className="text-slate-300 font-bold">{selectedVettingCand.experience || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Skills:</span>
                      <span className="text-slate-300 font-bold">{selectedVettingCand.skills || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Extracted PDF Resume Text {selectedVettingCand.resumeFileName && `(${selectedVettingCand.resumeFileName})`}
                  </h4>
                  <div className="bg-slate-950/50 p-3.5 border border-slate-850 rounded-2xl max-h-[200px] overflow-y-auto">
                    <pre className="text-[10px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap">{selectedVettingCand.resumeText}</pre>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Analysis */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Resume Vetting Analysis</h4>
                
                {selectedVettingCand.matchScore > 0 ? (
                  <div className="bg-slate-950/40 p-5 border border-slate-850 rounded-2xl space-y-4">
                    <div className="flex items-center gap-4 border-b border-slate-850/60 pb-3">
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0 bg-slate-900 rounded-full border border-slate-800">
                        <span className="text-xs font-extrabold text-slate-200">{selectedVettingCand.matchScore}%</span>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-300">Profile Match Score</h5>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-1 rounded border ${
                          (selectedVettingCand.evaluation?.recommendation === 'Strong Match' || selectedVettingCand.evaluation?.recommendation === 'Recommended') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          (selectedVettingCand.evaluation?.recommendation === 'Moderate Match' || selectedVettingCand.evaluation?.recommendation === 'Borderline') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {(selectedVettingCand.evaluation?.recommendation || 'Borderline').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-450 uppercase tracking-wider block mb-1">Key Strengths</span>
                        <ul className="space-y-1 text-[11px] text-slate-350 list-disc list-inside">
                          {(selectedVettingCand.evaluation?.strengths || []).map((str, idx) => (
                            <li key={idx}>{str}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-amber-450 uppercase tracking-wider block mb-1">Areas to Investigate</span>
                        <ul className="space-y-1 text-[11px] text-slate-350 list-disc list-inside">
                          {(selectedVettingCand.evaluation?.weaknesses || []).map((wk, idx) => (
                            <li key={idx}>{wk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 p-6 border border-slate-850 rounded-2xl text-center py-10 space-y-4">
                    <Sparkles className="w-8 h-8 text-slate-750 mx-auto animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-slate-400">AI Screening Not Run Yet</p>
                      <p className="text-[9px] text-slate-650 mt-0.5">This candidate applied from the careers portal. Run AI screening check to compute the profile matching metrics.</p>
                    </div>
                    
                    <button
                      onClick={async () => {
                        setIsVettingScreening(true);
                        try {
                          const res = await apiService.screenExistingCandidate(selectedVettingCand.id);
                          setSelectedVettingCand(res.candidate);
                          onTriggerRefresh(); // Reload main pipeline candidate list
                          alert('AI Screening completed successfully!');
                        } catch (err) {
                          console.error(err);
                          alert('AI Resume screening failed.');
                        } finally {
                          setIsVettingScreening(false);
                        }
                      }}
                      disabled={isVettingScreening}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 transition-colors"
                    >
                      {isVettingScreening ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          Running Gemini Screening Analysis...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-pulse text-white" />
                          Execute AI Resume Analysis
                        </>
                      )}
                    </button>
                  </div>
                )}
                {/* Interview Scheduling Card */}
                {isShortlisting && (
                  <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider text-indigo-400">
                      <Clock className="w-3.5 h-3.5" />
                      Interview Schedule
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Interview Date</label>
                        <input
                          type="date"
                          value={schDate}
                          onChange={(e) => setSchDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Interview Time</label>
                        <input
                          type="time"
                          value={schTime}
                          onChange={(e) => setSchTime(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                    {selectedVettingCand.interviewDate && (
                      <p className="text-[10px] text-emerald-405 font-bold">
                        Current Schedule: {selectedVettingCand.interviewDate} at {selectedVettingCand.interviewTime}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              {!isShortlisting ? (
                <div className="flex justify-between gap-3 w-full">
                  <button
                    onClick={async () => {
                      try {
                        await apiService.updateCandidateStatus(selectedVettingCand.id, 'Rejected');
                        setSelectedVettingCand(null);
                        onTriggerRefresh();
                        alert('Candidate status updated: Rejected');
                      } catch (e) {
                        alert('Failed to reject candidate.');
                      }
                    }}
                    className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 hover:border-rose-500/35 transition-all"
                  >
                    Reject Candidate
                  </button>
                  <button
                    onClick={() => setIsShortlisting(true)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-500 shadow-md shadow-emerald-600/15 transition-all hover:scale-[1.01]"
                  >
                    Shortlist Candidate
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  {selectedVettingCand.status !== 'Interviewing' ? (
                    <div className="flex justify-between gap-3 w-full">
                      <button
                        onClick={() => {
                          setIsShortlisting(false);
                          setSchDate('');
                          setSchTime('');
                        }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!schDate || !schTime) {
                            alert('Please select both Interview Date and Time.');
                            return;
                          }
                          try {
                            await apiService.updateCandidateStatus(selectedVettingCand.id, 'Interviewing', schDate, schTime);
                            setSelectedVettingCand(null);
                            onTriggerRefresh();
                            alert('Candidate status updated: Shortlisted for Interviews');
                          } catch (e) {
                            alert('Failed to shortlist candidate.');
                          }
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border border-emerald-500 shadow-md shadow-emerald-600/15 transition-all hover:scale-[1.01]"
                      >
                        Confirm Schedule & Shortlist
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-3 w-full">
                      <button
                        onClick={async () => {
                          try {
                            await apiService.updateCandidateStatus(selectedVettingCand.id, 'Rejected');
                            setSelectedVettingCand(null);
                            onTriggerRefresh();
                            alert('Candidate status updated: Rejected');
                          } catch (e) {
                            alert('Failed to reject candidate.');
                          }
                        }}
                        className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20 hover:border-rose-500/35 transition-all"
                      >
                        Reject Candidate
                      </button>
                      <button
                        onClick={async () => {
                          if (!schDate || !schTime) {
                            alert('Please select both Interview Date and Time.');
                            return;
                          }
                          try {
                            await apiService.updateCandidateStatus(selectedVettingCand.id, 'Interviewing', schDate, schTime);
                            setSelectedVettingCand(null);
                            onTriggerRefresh();
                            alert('Candidate Interview Rescheduled Successfully.');
                          } catch (e) {
                            alert('Failed to reschedule candidate.');
                          }
                        }}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-bold rounded-xl border border-indigo-500 shadow-md transition-all hover:scale-[1.01]"
                      >
                        Update Schedule
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Quick Schedule Interview Modal */}
      {selectedScheduleCand && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Schedule Interview</h3>
                <p className="text-[10px] text-indigo-400 font-semibold">{selectedScheduleCand.name} — {selectedScheduleCand.jobTitle}</p>
              </div>
              <button
                onClick={() => setSelectedScheduleCand(null)}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Interview Date</label>
                <input
                  type="date"
                  value={schDate}
                  onChange={(e) => setSchDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Interview Time</label>
                <input
                  type="time"
                  value={schTime}
                  onChange={(e) => setSchTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setSelectedScheduleCand(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!schDate || !schTime) {
                    alert('Please select both Interview Date and Time.');
                    return;
                  }
                  try {
                    await apiService.updateCandidateStatus(selectedScheduleCand.id, 'Interviewing', schDate, schTime);
                    setSelectedScheduleCand(null);
                    onTriggerRefresh();
                    alert('Interview scheduled successfully!');
                  } catch (e) {
                    alert('Failed to schedule interview.');
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-semibold rounded-xl border border-indigo-500 shadow-md shadow-indigo-600/10 transition-all hover:scale-[1.01]"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
