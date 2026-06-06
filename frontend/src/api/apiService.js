let API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = API_BASE.replace(/\/$/, '') + '/api';
}

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const getAuthHeaders = (contentType = 'application/json') => {
  const saved = localStorage.getItem('smart_hrms_user');
  const user = saved ? JSON.parse(saved) : null;
  const token = user?.token || '';

  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  // 1. Employees
  async getEmployees() {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/employees/me`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async createEmployee(empData) {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(empData)
    });
    return handleResponse(res);
  },

  async toggleEmployeeStatus(id) {
    const res = await fetch(`${API_BASE}/employees/${id}/toggle-status`, {
      method: 'PUT',
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  // 2. Attendance
  async getAttendance() {
    const res = await fetch(`${API_BASE}/attendance`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async checkIn(employeeId) {
    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ employeeId })
    });
    return handleResponse(res);
  },

  async checkOut(employeeId) {
    const res = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ employeeId })
    });
    return handleResponse(res);
  },

  // 3. Leaves
  async getLeaves() {
    const res = await fetch(`${API_BASE}/leaves`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async requestLeave(leaveData) {
    const res = await fetch(`${API_BASE}/leaves`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(leaveData)
    });
    return handleResponse(res);
  },

  async approveLeave(id, approverName) {
    const res = await fetch(`${API_BASE}/leaves/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ approverName })
    });
    return handleResponse(res);
  },

  async rejectLeave(id, approverName) {
    const res = await fetch(`${API_BASE}/leaves/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ approverName })
    });
    return handleResponse(res);
  },

  // 4. Jobs
  async getJobs() {
    const res = await fetch(`${API_BASE}/jobs`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async createJob(jobData) {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(jobData)
    });
    return handleResponse(res);
  },

  async deleteJob(id) {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  // 5. Candidates
  async getCandidates() {
    const res = await fetch(`${API_BASE}/candidates`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async addCandidate(candData) {
    const res = await fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Public candidate apply, no auth header
      body: JSON.stringify(candData)
    });
    return handleResponse(res);
  },

  async saveCandidateEvaluation(id, status, matchScore, evaluation) {
    const res = await fetch(`${API_BASE}/candidates/${id}/evaluation`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ status, matchScore, evaluation })
    });
    return handleResponse(res);
  },

  async saveInterviewReport(id, status, matchScore, interviewReport) {
    const res = await fetch(`${API_BASE}/candidates/${id}/interview-report`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ status, matchScore, interviewReport })
    });
    return handleResponse(res);
  },

  // 6. Policies
  async getPolicies() {
    const res = await fetch(`${API_BASE}/policies`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  // --- AI secure proxies ---
  async screenResume(jobDescription, resumeText, skills = '') {
    const res = await fetch(`${API_BASE}/ai/screen`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ jobDescription, resumeText, skills })
    });
    return handleResponse(res);
  },

  async getNextInterviewQuestion(jobTitle, currentRound, history) {
    const res = await fetch(`${API_BASE}/ai/interview/question`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ jobTitle, currentRound, history })
    });
    const data = await handleResponse(res);
    return data.question;
  },

  async evaluateInterview(jobTitle, history) {
    const res = await fetch(`${API_BASE}/ai/interview/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ jobTitle, history })
    });
    return handleResponse(res);
  },

  async askHRAssistant(question, context) {
    const res = await fetch(`${API_BASE}/ai/chatbot`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ question, context })
    });
    const data = await handleResponse(res);
    return data.answer;
  },

  async hasGeminiKey() {
    const res = await fetch(`${API_BASE}/settings/has-key`);
    return handleResponse(res);
  },

  async saveGeminiKey(geminiKey) {
    const res = await fetch(`${API_BASE}/settings/key`, {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify({ geminiKey })
    });
    return handleResponse(res);
  },

  // Candidate Authentication
  async candidateRegister(name, email, password) {
    const res = await fetch(`${API_BASE}/candidate/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return handleResponse(res);
  },

  async candidateLogin(email, password) {
    const res = await fetch(`${API_BASE}/candidate/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  // Candidate Profile
  async getCandidateProfile() {
    const res = await fetch(`${API_BASE}/candidate/profile`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async getCandidateApplications() {
    const res = await fetch(`${API_BASE}/candidate/applications`, {
      headers: getAuthHeaders(null)
    });
    return handleResponse(res);
  },

  async updateCandidateProfile(profileData) {
    const res = await fetch(`${API_BASE}/candidate/profile`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  async uploadCandidateResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    const headers = getAuthHeaders(null);
    const res = await fetch(`${API_BASE}/candidate/profile/resume`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  async parseResumePDF(file) {
    const formData = new FormData();
    formData.append('resume', file);

    const headers = getAuthHeaders(null);
    const res = await fetch(`${API_BASE}/candidates/parse-resume`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  // Job Application (multipart/FormData)
  async candidateApply(jobId, applicationData, resumeFile) {
    const headers = getAuthHeaders(null);
    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('name', applicationData.name || '');
    formData.append('skills', applicationData.skills || '');
    formData.append('education', applicationData.education || '');
    formData.append('experience', applicationData.experience || '');
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }

    const res = await fetch(`${API_BASE}/candidate/apply`, {
      method: 'POST',
      headers,
      body: formData
    });
    return handleResponse(res);
  },

  // Recruiter Screening on Applied Candidates
  async screenExistingCandidate(candidateId) {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/screen`, {
      method: 'POST',
      headers: getAuthHeaders('application/json')
    });
    return handleResponse(res);
  },

  async updateCandidateStatus(candidateId, status, interviewDate = '', interviewTime = '') {
    const payload = { status };
    if (interviewDate) payload.interviewDate = interviewDate;
    if (interviewTime) payload.interviewTime = interviewTime;
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateEmployee(id, empData) {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(empData)
    });
    return handleResponse(res);
  },

  async updateJob(id, jobData) {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(jobData)
    });
    return handleResponse(res);
  },

  async updatePolicy(title, policyData) {
    const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(title)}`, {
      method: 'PUT',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(policyData)
    });
    return handleResponse(res);
  }
};
