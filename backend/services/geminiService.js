import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { db } from '../db/dbConnector.js';

dotenv.config();

// Helper to initialize Gemini API using process environment variable or database settings
const getGeminiClient = () => {
  const key = process.env.GEMINI_API_KEY || db.getGeminiKey();
  if (!key) return null;
  try {
    return new GoogleGenerativeAI(key);
  } catch (error) {
    console.error('Failed to initialize server-side Gemini Client', error);
    return null;
  }
};

// Robust model wrapper that falls back to gemini-pro if gemini-1.5-flash is unsupported or fails
const generateWithModelFallback = async (genAI, prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    return await model.generateContent(prompt);
  } catch (err) {
    console.warn('Failed with gemini-1.5-flash, trying gemini-pro fallback:', err.message);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    return await model.generateContent(prompt);
  }
};

// Clean JSON response from Gemini (strips markdown wrapper if present)
const cleanJSONResponse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
};

// Canonicalize skill aliases to ensure exact matches
const canonicalizeSkill = (skill) => {
  const s = (skill || '').toLowerCase().trim();
  if (['react', 'react.js', 'reactjs'].includes(s)) return 'react';
  if (['node', 'node.js', 'nodejs'].includes(s)) return 'node';
  if (['js', 'javascript', 'es6'].includes(s)) return 'javascript';
  if (['mongo', 'mongodb'].includes(s)) return 'mongodb';
  if (['ts', 'typescript'].includes(s)) return 'typescript';
  if (['py', 'python'].includes(s)) return 'python';
  if (['express', 'expressjs', 'express.js'].includes(s)) return 'express';
  if (['redux', 'redux-toolkit'].includes(s)) return 'redux';
  if (['jwt', 'json web token'].includes(s)) return 'jwt';
  if (['html', 'html5'].includes(s)) return 'html';
  if (['css', 'css3'].includes(s)) return 'css';
  return s;
};

// Domain-sensitive skills that should never be inferred from project names
const DOMAIN_SENSITIVE_SKILLS = [
  'hr', 'human resources', 'recruitment', 'recruiting', 'payroll', 'onboarding',
  'talent acquisition', 'sourcing', 'employee engagement', 'performance scorecards',
  'hr policies', 'devops', 'figma', 'design', 'ui', 'ux', 'ui/ux'
];

// Helper to determine if a matched skill in the resume is just part of a project name
const isProjectInference = (resumeText, skill) => {
  const text = (resumeText || '').toLowerCase();
  const s = (skill || '').toLowerCase().trim();
  
  // Find all whole-word occurrences of the skill
  const regex = new RegExp(`\\b${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
  const matches = [...text.matchAll(regex)];
  
  if (matches.length === 0) return true; // not found
  
  // Project indicator terms
  const projectPatterns = [
    'management system',
    'management app',
    'management portal',
    'platform',
    'app',
    'application',
    'portal',
    'project',
    'software',
    'tool',
    'website',
    'dashboard',
    'tracker',
    'system'
  ];
  
  // Check if all occurrences are part of a project title or description pattern
  const allAreProjects = matches.every(match => {
    const pos = match.index;
    // Get surrounding context window (35 characters before and after)
    const start = Math.max(0, pos - 35);
    const end = Math.min(text.length, pos + s.length + 35);
    const context = text.slice(start, end);
    
    return projectPatterns.some(pattern => context.includes(pattern));
  });
  
  return allAreProjects;
};

// Strict ATS scoring engine
const calculateATSScore = (rawRequiredSkills, rawCandidateSkills, experienceMatch, educationMatch, projectsMatch, resumeText, jobDesc) => {
  const ignoreWords = ['project', 'product', 'team', 'development', 'system', 'application', 'technology', 'software'];
  
  const cleanArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map(s => (s || '').trim())
      .filter(s => s.length > 0)
      .filter(s => !ignoreWords.includes(s.toLowerCase()));
  };

  const reqSkills = cleanArray(rawRequiredSkills);
  const candSkills = cleanArray(rawCandidateSkills);

  const reqCanonical = reqSkills.map(canonicalizeSkill);
  const candCanonical = candSkills.map(canonicalizeSkill);

  const matchedSkills = [];
  const missingSkills = [];

  reqSkills.forEach((skill, idx) => {
    const canonical = reqCanonical[idx];
    if (candCanonical.includes(canonical)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // 1. Skills Match (60% weight)
  let skillsScore = 0;
  if (reqSkills.length > 0) {
    skillsScore = (matchedSkills.length / reqSkills.length) * 60;
  }

  // 2. Experience Match (20% weight)
  let experienceScore = 0;
  const expMatchLower = (experienceMatch || '').toLowerCase();
  if (expMatchLower.includes('strong') || expMatchLower.includes('excellent') || expMatchLower.includes('perfect') || expMatchLower.includes('highly')) {
    experienceScore = 20;
  } else if (expMatchLower.includes('moderate') || expMatchLower.includes('good') || expMatchLower.includes('partial') || expMatchLower.includes('benchmarks')) {
    experienceScore = 12;
  } else if (expMatchLower.includes('weak') || expMatchLower.includes('poor') || expMatchLower.includes('insufficient')) {
    experienceScore = 5;
  }

  // 3. Education Match (10% weight)
  let educationScore = 0;
  const eduMatchLower = (educationMatch || '').toLowerCase();
  if (eduMatchLower.includes('strong') || eduMatchLower.includes('perfect') || eduMatchLower.includes('matches') || eduMatchLower.includes('align')) {
    educationScore = 10;
  } else if (eduMatchLower.includes('moderate') || eduMatchLower.includes('partial') || eduMatchLower.includes('related')) {
    educationScore = 6;
  } else if (eduMatchLower.includes('weak') || eduMatchLower.includes('poor')) {
    educationScore = 2;
  }

  // 4. Projects Match (10% weight)
  let projectsScore = 0;
  const projMatchLower = (projectsMatch || '').toLowerCase();
  if (projMatchLower.includes('strong') || projMatchLower.includes('excellent') || projMatchLower.includes('perfect') || projMatchLower.includes('highly')) {
    projectsScore = 10;
  } else if (projMatchLower.includes('moderate') || projMatchLower.includes('good') || projMatchLower.includes('partial') || projMatchLower.includes('some')) {
    projectsScore = 6;
  } else if (projMatchLower.includes('weak') || projMatchLower.includes('poor') || projMatchLower.includes('insufficient')) {
    projectsScore = 2;
  }

  let matchPercentage = Math.round(skillsScore + experienceScore + educationScore + projectsScore);

  // Strict ATS Rules:
  if (reqSkills.length > 0) {
    const missingRatio = missingSkills.length / reqSkills.length;
    if (missingRatio > 0.70) {
      matchPercentage = Math.min(matchPercentage, 20);
    } else if (missingRatio > 0.50) {
      matchPercentage = Math.min(matchPercentage, 40);
    }
    if (matchedSkills.length === 0) {
      matchPercentage = Math.min(matchPercentage, 14);
    }
  } else {
    matchPercentage = Math.min(matchPercentage, 14);
  }

  let recommendation = 'Weak Match';
  if (matchPercentage >= 80) {
    recommendation = 'Strong Match';
  } else if (matchPercentage >= 60) {
    recommendation = 'Moderate Match';
  }

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    recommendation
  };
};

export const geminiService = {
  /**
   * AI Resume Screening based on strict JD criteria weights
   */
  async screenResume(jobDescription, resumeText, skills = '') {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      console.log('Gemini API Key missing on backend. Running in simulated fallback mode.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.mockScreenResume(jobDescription, resumeText, skills);
    }

    try {
      const prompt = `
        You are an AI Recruitment Assistant.
        Your task is to compare a candidate's resume against the Job Description and extract technical skills, experience details, education compatibility, and project relevancy.

        Rules for extraction:
        1. Do NOT calculate the matching score yourself.
        2. Never infer domain skills from candidate project names, application titles, or website creations. E.g., if a candidate has a project named "HR Management System", do NOT infer that they have "HR", "Human Resources", "Recruitment", "Payroll", or "Onboarding" skills. If they built a "Recruitment Platform", do NOT infer they have "Talent Acquisition" or "Recruitment" skills. If they built a "Payroll Application", do NOT infer "Payroll" expertise. Only extract skills if the candidate has explicit work experience, certifications, or has listed them in their skills section.
        3. Ignore generic words such as: Project, Product, Team, Development, System, Application, Technology, Software.
        4. Extract the required skills list strictly from the Job Description.
        5. Extract candidate skills from BOTH the resume text and the explicit skills field provided below.
        6. Extract only explicit, technical domain skills.

        Provide the output strictly in JSON format matching this schema:
        {
          "requiredSkills": [string], // List of technical skills required in the Job Description
          "candidateSkills": [string], // List of explicit candidate skills found in resume or provided list
          "experienceMatch": string, // "Strong Match" | "Moderate Match" | "Weak Match" plus explanation
          "educationMatch": string, // "Strong Match" | "Moderate Match" | "Weak Match" plus explanation
          "projectsMatch": string, // "Strong Match" | "Moderate Match" | "Weak Match" plus explanation
          "strengths": [string],
          "weaknesses": [string],
          "summary": string
        }
        Respond ONLY with the JSON. Do not include markdown code block syntax. Just raw JSON.

        JOB DESCRIPTION:
        ${jobDescription}

        CANDIDATE SKILLS FIELD:
        ${skills || "Not explicitly listed"}

        CANDIDATE RESUME:
        ${resumeText}
      `;

      const result = await generateWithModelFallback(genAI, prompt);
      const response = await result.response;
      const parsed = cleanJSONResponse(response.text());
      
      const scoreData = calculateATSScore(
        parsed.requiredSkills || [],
        parsed.candidateSkills || [],
        parsed.experienceMatch || "",
        parsed.educationMatch || "",
        parsed.projectsMatch || "",
        resumeText,
        jobDescription
      );

      return {
        matchPercentage: scoreData.matchPercentage,
        matchScore: scoreData.matchPercentage, // compatibility
        matchedSkills: scoreData.matchedSkills,
        missingSkills: scoreData.missingSkills,
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        experienceMatch: parsed.experienceMatch || "",
        educationMatch: parsed.educationMatch || "",
        projectsMatch: parsed.projectsMatch || "",
        summary: parsed.summary || `ATS Summary: Match percentage is ${scoreData.matchPercentage}%. Matched: ${scoreData.matchedSkills.join(', ') || 'None'}. Missing: ${scoreData.missingSkills.join(', ') || 'None'}.`,
        recommendation: scoreData.recommendation
      };
    } catch (e) {
      console.warn('Backend Gemini API resume screening error, falling back to mock screen:', e);
      return this.mockScreenResume(jobDescription, resumeText, skills);
    }
  },

  mockScreenResume(jobDesc, resumeText, skills = '') {
    const cleanText = (text) => (text || '').toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ');

    const descLower = cleanText(jobDesc);
    const resumeLower = cleanText(resumeText);

    const skillKeywords = [
      // Frontend
      'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'vuejs', 'angular', 'angularjs', 'angular.js',
      'svelte', 'next.js', 'nextjs', 'nuxt.js', 'nuxtjs', 'gatsby', 'html', 'html5', 'css', 'css3',
      'tailwind', 'tailwindcss', 'bootstrap', 'sass', 'scss', 'less', 'framer motion', 'vite', 'webpack',
      'redux', 'redux toolkit', 'redux-toolkit', 'zustand', 'recoil', 'context api',
      // Backend & Languages
      'node', 'node.js', 'nodejs', 'express', 'express.js', 'expressjs', 'javascript', 'js', 'typescript', 'ts',
      'python', 'py', 'java', 'spring', 'spring boot', 'springboot', 'go', 'golang', 'rust', 'ruby', 'rails',
      'php', 'laravel', 'c#', 'c++', 'c', 'dotnet', '.net', 'asp.net', 'django', 'flask', 'fastapi',
      // Database & API
      'mongodb', 'mongo', 'postgresql', 'postgres', 'mysql', 'sql', 'sqlite', 'redis', 'memcached',
      'graphql', 'apollo', 'rest api', 'restful api', 'api', 'apis', 'grpc', 'web sockets', 'websocket',
      // Cloud, DevOps & Tools
      'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
      'ci/cd', 'github actions', 'jenkins', 'gitlab', 'circleci', 'terraform', 'ansible', 'prometheus', 'grafana',
      'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'agile', 'scrum',
      // AI / ML / Data Science
      'ai', 'artificial intelligence', 'ml', 'machine learning', 'deep learning', 'nlp', 'natural language processing',
      'cv', 'computer vision', 'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy',
      'langchain', 'llm', 'large language models', 'openai', 'gemini', 'anthropic', 'vector database', 'vector databases',
      'pinecone', 'milvus', 'chromadb', 'weaviate', 'rag', 'retrieval-augmented generation',
      // Design & UI/UX
      'figma', 'sketch', 'adobe xd', 'ui', 'ux', 'ui/ux', 'design', 'wireframing', 'prototyping',
      // HR & Recruitment (JD specific keywords)
      'hr', 'human resources', 'recruitment', 'recruiting', 'payroll', 'onboarding', 'sourcing',
      'talent acquisition', 'employee engagement', 'performance scorecards', 'hr policies'
    ];

    const ignoreWords = ['project', 'product', 'team', 'development', 'system', 'application', 'technology', 'software'];
    const filteredSkillKeywords = skillKeywords.filter(k => !ignoreWords.includes(k));

    // Extract required skills from JD
    const requiredSkills = [];
    filteredSkillKeywords.forEach(skill => {
      const s = skill.toLowerCase();
      const regex = new RegExp(`\\b${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(descLower) && !requiredSkills.includes(skill)) {
        requiredSkills.push(skill);
      }
    });

    // Extract candidate skills from skills parameter
    const skillsList = (skills || '')
      .split(/[,\n;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Extract candidate skills from resume, preventing inferences from project names
    const resumeSkills = [];
    filteredSkillKeywords.forEach(skill => {
      const s = skill.toLowerCase();
      const regex = new RegExp(`\\b${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeLower)) {
        if (DOMAIN_SENSITIVE_SKILLS.includes(s)) {
          if (!isProjectInference(resumeText, s)) {
            resumeSkills.push(skill);
          }
        } else {
          resumeSkills.push(skill);
        }
      }
    });

    const candidateSkills = Array.from(new Set([...skillsList, ...resumeSkills]));

    // Experience Match details
    const hasSrRole = resumeLower.includes('senior') || resumeLower.includes('lead') || resumeLower.includes('manager');
    const requiresSrRole = descLower.includes('senior') || descLower.includes('lead') || descLower.includes('manager');
    let experienceMatch = "Weak Match. Experience alignment needs review.";
    if (requiresSrRole) {
      if (hasSrRole) {
        experienceMatch = "Strong Match. Candidate experience aligns with leadership requirements.";
      } else {
        experienceMatch = "Weak Match. Role requires leadership/senior experience which candidate lacks.";
      }
    } else {
      if (hasSrRole || resumeLower.includes('developer') || resumeLower.includes('engineer') || resumeLower.includes('specialist')) {
        experienceMatch = "Strong Match. Candidate has good professional experience.";
      } else {
        experienceMatch = "Moderate Match. Candidate has some professional experience.";
      }
    }

    // Education Match details
    const degreeKeywords = ['btech', 'mtech', 'bca', 'mca', 'bachelor', 'master', 'degree', 'phd', 'graduate', 'computer science', 'mba', 'bba'];
    const jdDegrees = degreeKeywords.filter(d => descLower.includes(d));
    const resumeDegrees = degreeKeywords.filter(d => resumeLower.includes(d));
    let educationMatch = "Weak Match. Academic credentials not matching.";
    if (jdDegrees.length === 0) {
      educationMatch = "Strong Match. No specific degree required, candidate credentials are acceptable.";
    } else {
      const matchedDegrees = jdDegrees.filter(d => resumeDegrees.includes(d));
      if (matchedDegrees.length > 0) {
        educationMatch = "Strong Match. Academic degree matches requirements.";
      } else if (resumeDegrees.length > 0) {
        educationMatch = "Moderate Match. Candidate has a related degree.";
      }
    }

    // Projects Match details
    let projectsMatch = "Weak Match. Projects do not show strong alignment with job requirements.";
    const reqCanonical = requiredSkills.map(canonicalizeSkill);
    const candCanonical = candidateSkills.map(canonicalizeSkill);
    const matchedCount = reqCanonical.filter(c => candCanonical.includes(c)).length;
    
    if (requiredSkills.length > 0) {
      const matchRatio = matchedCount / requiredSkills.length;
      if (matchRatio >= 0.75) {
        projectsMatch = "Strong Match. Candidate's projects and experience strongly align with core technologies.";
      } else if (matchRatio >= 0.40) {
        projectsMatch = "Moderate Match. Projects display partial relevance to the required skill set.";
      }
    } else {
      projectsMatch = "Strong Match. No specific projects required.";
    }

    const scoreData = calculateATSScore(
      requiredSkills,
      candidateSkills,
      experienceMatch,
      educationMatch,
      projectsMatch,
      resumeText,
      jobDesc
    );

    const strengths = scoreData.matchedSkills.map(sk => `Matches required technical skill: ${sk.toUpperCase()}`);
    if (experienceMatch.includes('Strong')) strengths.push("Experience matches job level.");
    if (strengths.length === 0) strengths.push("Basic professional background.");

    const weaknesses = scoreData.missingSkills.map(sk => `Missing technical skill: ${sk.toUpperCase()}`);
    if (weaknesses.length === 0) weaknesses.push("None identified.");

    return {
      matchPercentage: scoreData.matchPercentage,
      matchScore: scoreData.matchPercentage, // compatibility
      matchedSkills: scoreData.matchedSkills,
      missingSkills: scoreData.missingSkills,
      strengths,
      weaknesses,
      experienceMatch,
      educationMatch,
      projectsMatch,
      summary: `ATS Summary: Match percentage is ${scoreData.matchPercentage}%. Matched: ${scoreData.matchedSkills.join(', ') || 'None'}. Missing: ${scoreData.missingSkills.join(', ') || 'None'}.`,
      recommendation: scoreData.recommendation
    };
  },

  /**
   * AI Recruitment Voice Interviewer - Get Next Question
   */
  async getNextInterviewQuestion(jobTitle, currentRound, history, resumeText = '') {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.mockNextQuestion(jobTitle, currentRound);
    }

    try {
      const formattedHistory = history.map(h => `${h.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${h.content}`).join('\n');
      
      const prompt = `
        You are an elite AI technical interviewer conducting a video/voice interview for the position: "${jobTitle}".
        This is question number ${currentRound} out of 3.
        
        Candidate's Uploaded Resume:
        ${resumeText || "Not provided"}

        Previous Conversation History:
        ${formattedHistory}
        
        Generate the next single, concise interview question for the candidate.
        The question MUST be tailored to the candidate's background, skills, projects, and work experience as detailed in their resume.
        If it's question 1: Ask an initial question about a project, skill, or experience listed on their resume.
        If it's question 2 or 3: Ask a specific technical follow-up based on their previous answers or dive into another detail of their resume.
        
        Keep your question highly focused, professional, and under 35 words so it sounds natural when spoken. Do not write any pleasantries except a brief transition.
      `;

      const result = await generateWithModelFallback(genAI, prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (e) {
      console.warn('Backend Gemini API question error, falling back to mock:', e);
      return this.mockNextQuestion(jobTitle, currentRound);
    }
  },

  mockNextQuestion(jobTitle, round) {
    const reactQuestions = [
      "Could you explain the difference between the virtual DOM and the real DOM in React? How does fiber reconciliation work?",
      "How do you optimize a React component that is rendering too frequently? What tools or hooks do you use?",
      "In a large application, what state management library do you prefer (like Redux or Zustand) and what are its trade-offs compared to Context API?"
    ];

    const aiQuestions = [
      "What is your experience with Retrieval-Augmented Generation (RAG)? How do you prevent hallucination in LLM outputs?",
      "Can you describe how you would design a multi-agent workflow where agents need to collaborate to solve a task?",
      "How do you handle rate-limiting and connection issues when calling external LLM APIs in production apps?"
    ];

    const hrQuestions = [
      "How do you handle conflicts within your team, especially when trying to deliver projects on a tight timeline?",
      "What strategies do you use to keep remote team members engaged and aligned with company goals?",
      "Describe a time you had to deliver difficult performance feedback to a direct report. How did you approach it?"
    ];

    const isReact = jobTitle.toLowerCase().includes('react');
    const isAi = jobTitle.toLowerCase().includes('ai') || jobTitle.toLowerCase().includes('engineer');
    const questions = isReact ? reactQuestions : (isAi ? aiQuestions : hrQuestions);
    
    return questions[round - 1] || "That completes the interview questions. Thank you!";
  },

  /**
   * AI Recruitment Voice Interviewer - Evaluate Interview Answers
   */
  async evaluateInterview(jobTitle, history) {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.mockEvaluateInterview(jobTitle, history);
    }

    try {
      const formattedHistory = history.map(h => `${h.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${h.content}`).join('\n');
      
      const prompt = `
        You are an AI Talent Evaluator. Review the transcript of a voice interview for the "${jobTitle}" position.
        
        Interview Transcript:
        ${formattedHistory}
        
        Evaluate the candidate on Confidence, Communication, and Technical Knowledge.
        Generate:
        - Confidence score rating ("High" | "Medium" | "Low")
        - Communication rating ("Excellent" | "Good" | "Average" | "Needs Improvement")
        - Technical Knowledge rating ("Very Strong" | "Strong" | "Average" | "Weak")
        - An overall performance score (0-100)
        - Short feedback summary (under 60 words)
        - Detailed report paragraphs summarizing the candidate's strong points and areas to improve.
        
        Provide the output strictly in JSON format matching this schema:
        {
          "score": number,
          "confidence": "High" | "Medium" | "Low",
          "communication": "Excellent" | "Good" | "Average" | "Needs Improvement",
          "technical": "Very Strong" | "Strong" | "Average" | "Weak",
          "feedback": string,
          "reportText": string
        }
        Respond ONLY with the JSON. Do not include markdown code block syntax. Just raw JSON.
      `;

      const result = await generateWithModelFallback(genAI, prompt);
      const response = await result.response;
      return cleanJSONResponse(response.text());
    } catch (e) {
      console.warn('Backend Gemini API evaluation error, falling back to mock:', e);
      return this.mockEvaluateInterview(jobTitle, history);
    }
  },

  mockEvaluateInterview(jobTitle, history) {
    const candidateResponses = history.filter(h => h.role === 'user');
    let totalLength = 0;
    candidateResponses.forEach(r => totalLength += r.content.length);
    
    let score = 70;
    if (totalLength > 150) score = 88;
    else if (totalLength > 50) score = 80;
    else score = 62;

    let confidence = 'Medium';
    let communication = 'Good';
    let technical = 'Average';

    if (score >= 85) {
      confidence = 'High';
      communication = 'Excellent';
      technical = 'Strong';
    } else if (score < 70) {
      confidence = 'Low';
      communication = 'Needs Improvement';
      technical = 'Weak';
    }

    return {
      score,
      confidence,
      communication,
      technical,
      feedback: `The candidate showed good effort in answering the interview questions for ${jobTitle}. Communication was direct, though technical details could be expanded further in a real-world scenario.`,
      reportText: `Evaluation Report for ${jobTitle}:
1. Confidence: The candidate expressed their thoughts with a ${confidence.toLowerCase()} level of assurance. They addressed questions without long pauses.
2. Communication: Expressed answers in an ${communication.toLowerCase()} manner. Structuring answers using STAR methodology could elevate responses.
3. Technical Skills: Evaluated as ${technical.toLowerCase()}. The candidate understands basic workflows and structures, but needs more depth in architectural discussions and troubleshooting.`
    };
  },

  /**
   * AI HR Assistant Q&A Chatbot (Context & Role Sensitive)
   */
  async askHRAssistant(question, context) {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.mockHRAssistant(question, context);
    }

    try {
      let rolePrompt = '';
      const role = context.role || 'Guest';

      if (role === 'Admin') {
        rolePrompt = `You are a SmartHR Operations Assistant advising an Admin.
        Help them analyze organization stats, manage system settings, and optimize operational workflows.
        Context: Average employee performance scorecard is 85%. Departments are: Engineering, Sales, HR, Marketing, Operations.
        Keep answers operational, direct, and system-focused.`;
      } else if (role === 'Senior Manager') {
        rolePrompt = `You are a SmartHR Management Coach advising a Senior Manager.
        Help them manage team leaves, coaching issues, team attendance, and leadership metrics.
        Keep answers focused on people management, leadership best practices, and team wellness.`;
      } else if (role === 'HR Recruiter') {
        rolePrompt = `You are a SmartHR Recruiting Copilot advising an HR Recruiter.
        Help them with active recruitment metrics, screening advice, job postings structure, and ATS scoring mechanism (ATS uses 60% skills, 20% experience, 10% education, 10% projects weights).
        Keep answers talent acquisition-focused, speedy, and metric-driven.`;
      } else if (role === 'Employee') {
        rolePrompt = `You are a SmartHR Employee Guide advising an employee.
        Help them navigate leaves balance, salary details, attendance check-in status, and office policies.
        Context: Remaining leaves: ${JSON.stringify(context.leaveBalance)}, Base Salary: $${context.salary || 'N/A'}, Attendance check-ins this month: ${context.attendanceStats?.checkInCount || 0}.
        Keep answers warm, personalized, and supportive.`;
      } else {
        rolePrompt = `You are a SmartHR Career Guide advising a job seeker / candidate.
        Help them learn about open positions, company perks (remote-first, global learning stipends, health coverage), and preparing for the AI voice/video interview (uses SpeechRecognition and local video feed confidence processing, threshold is 75+ for shortlisting).
        Keep answers encouraging, structured, and recruitment-oriented.`;
      }

      const prompt = `
        ${rolePrompt}
        
        Currently logged-in user profile context:
        ${JSON.stringify(context)}
        
        Answer their question: "${question}"
        
        Be precise, professional, and helpful. Limit your response to 3-4 sentences maximum. Use the context details when relevant to personalize the response.
      `;

      const result = await generateWithModelFallback(genAI, prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (e) {
      console.warn('Backend Gemini API assistant error, falling back to mock:', e);
      return this.mockHRAssistant(question, context);
    }
  },

  mockHRAssistant(question, context) {
    const q = question.toLowerCase();
    const name = context.name || 'User';
    const role = context.role || 'Guest';

    // 1. Candidate / Job Seeker mock replies
    if (role === 'Candidate' || role === 'Guest') {
      if (q.includes('job') || q.includes('open') || q.includes('vacancy') || q.includes('position')) {
        return `Hi ${name}, we currently have exciting vacancies for Software Engineers, React Developers, DevOps Engineers, and Product Managers. You can browse, read job descriptions, and apply directly under the 'Explore Jobs' tab!`;
      }
      if (q.includes('interview') || q.includes('prepare') || q.includes('process') || q.includes('video')) {
        return `Our hiring process involves a resume suitability check, an AI Video/Voice interview in your portal, and a final 1-to-1 interview. To prepare for the AI interview, ensure a quiet background, review concepts matching your resume, and speak clearly into your mic.`;
      }
      if (q.includes('benefit') || q.includes('perk') || q.includes('culture') || q.includes('wfh')) {
        return `We are a remote-first company with global workspaces, learning stipends, comprehensive health coverage, and quarterly team retreats. We value design quality, high execution speed, and absolute ownership.`;
      }
      if (q.includes('status') || q.includes('application')) {
        return `You can monitor the live progress of your job applications under the 'My Applications' tab. It will update as your status changes from Screening to Interviewing, Shortlisted, or Offered.`;
      }
      return `Hello ${name}! I'm your SmartHR Career Assistant. I can help you find open roles, track application statuses, check benefits, or give you tips on passing our AI voice interview. How can I help you today?`;
    }

    // 2. Admin mock replies
    if (role === 'Admin') {
      if (q.includes('count') || q.includes('employee') || q.includes('department') || q.includes('people')) {
        return `We have 5 departments: Engineering (45%), Sales (20%), Operations (15%), Marketing (10%), and HR (10%). Active head count is 142 employees with an average performance rating of 85%.`;
      }
      if (q.includes('key') || q.includes('gemini') || q.includes('api') || q.includes('settings')) {
        return `The server-side Gemini API key configuration is active. Admins can update or rotate keys at any time via the 'API Key Settings' gear icon in the top header bar.`;
      }
      if (q.includes('performance') || q.includes('rating') || q.includes('average')) {
        return `The current organization-wide average performance rating is 85%. High performers are concentrated in the Engineering and Sales divisions. Individual scorecards can be reviewed in the Admin Reports dashboard.`;
      }
      if (q.includes('report') || q.includes('generate')) {
        return `You can generate complete system logs, payroll summaries, or policy usage charts directly in the Admin Dashboard under 'Reports'. Data can be exported as CSV/PDF.`;
      }
      return `Hello Admin ${name}! I am your SmartHR Operations Assistant. I can provide organizational metrics, check database/API settings status, or help analyze department ratings. How can I help you today?`;
    }

    // 3. Senior Manager mock replies
    if (role === 'Senior Manager') {
      if (q.includes('leave') || q.includes('team') || q.includes('request')) {
        return `As a Senior Manager, you can review and approve team leave requests under the 'Leaves' sub-tab. There are currently 2 pending leaves awaiting your decision.`;
      }
      if (q.includes('attendance') || q.includes('hours') || q.includes('time')) {
        return `Your direct reports have maintained a 96% on-time attendance rate this week. You can see check-in summaries, late check-ins, and weekly hours worked in your 'Team' dashboard view.`;
      }
      if (q.includes('coaching') || q.includes('tip') || q.includes('leadership') || q.includes('conflict')) {
        return `For professional coaching: Encourage one-to-ones weekly, set clear SMART goals for quarterly metrics, and resolve conflicts by focusing on processes rather than personalities. Use our standard templates in the Manager Hub.`;
      }
      if (q.includes('performance') || q.includes('team stats')) {
        return `Your team's average performance score is 87%. Engineering leads have the highest scores, while marketing coordinates are on track. You can set new metrics in the Performance tracker.`;
      }
      return `Hello Manager ${name}! I am your SmartHR Leadership Coach. I can help you review team leaves, check attendance logs, or provide operational management advice. How can I help you today?`;
    }

    // 4. HR Recruiter mock replies
    if (role === 'HR Recruiter') {
      if (q.includes('job') || q.includes('active') || q.includes('post')) {
        return `You can manage, edit, or create jobs under the 'Manage Jobs' tab. Currently, there are 5 active job postings online receiving candidate applications.`;
      }
      if (q.includes('ats') || q.includes('match') || q.includes('score')) {
        return `Our ATS matches resumes based on a weighted algorithm: 60% skills compatibility, 20% experience matching, 10% educational credentials, and 10% project relevance. Candidates scoring 75+ in AI Voice Interviews are automatically shortlisted for technical rounds.`;
      }
      if (q.includes('screen') || q.includes('candidate') || q.includes('resume')) {
        return `You can view candidate applications and trigger instant AI Resume Screening in the 'Screening' tab. The panel displays match percentage, strengths/weaknesses, and suitability recommendations.`;
      }
      if (q.includes('schedule') || q.includes('interview')) {
        return `Recruiters have scheduling access to assign AI dates and follow-up 1-to-1 Technical Interviews. Shortlisted candidates will view their scheduled times directly in their applicant portal.`;
      }
      return `Hello Recruiter ${name}! I am your SmartHR Recruiting Copilot. I can help screen candidate details, explain the ATS scoring setup, or view job stats. What can I do for you today?`;
    }

    // 5. Employee mock replies (Default/Fallback)
    const leaves = context.leaveBalance || { casual: 12, medical: 10, earned: 18 };
    const salary = context.salary || 5000;
    const checkInCount = context.attendanceStats ? context.attendanceStats.checkInCount : 0;

    if (q.includes('leave') || q.includes('balance') || q.includes('vacation')) {
      return `Hi ${name}, you currently have ${leaves.casual} Casual, ${leaves.medical} Medical, and ${leaves.earned} Earned leaves remaining. You can apply for a leave directly from your employee dashboard under the 'Request Leave' section!`;
    }
    
    if (q.includes('salary') || q.includes('pay') || q.includes('money') || q.includes('payslip')) {
      return `Hi ${name}, your monthly base salary is $${salary.toLocaleString()}. Your latest payslip has been generated for the current month and is ready for download in your dashboard under 'Payslips'.`;
    }

    if (q.includes('attendance') || q.includes('check') || q.includes('hours')) {
      return `Hi ${name}, you have checked in ${checkInCount} times this month. Make sure to check in daily before 09:15 AM to avoid being marked late!`;
    }

    if (q.includes('wfh') || q.includes('policy') || q.includes('home')) {
      return `According to our policy, you are permitted to work from home up to 2 days per week, coordinating with your manager (${context.manager || 'Rajesh Kumar'}). Core collaboration hours are 11:00 AM to 04:00 PM.`;
    }

    return `Hello ${name}! I'm your SmartHR Employee Guide. I can check your leaves balance, view salary details, check attendance, or answer company policy questions. How can I help you today?`;
  },

  // Main matching function with Gemini AI integration
  async matchResume(resume, job) {
    const resumeText = normalize(resume || "");
    const jobDescription = job?.description ? String(job.description) : "";
    const jobTitle = job?.title ? String(job.title) : "";
    
    // Extract required skills ONLY from job.skills array OR Explicit "Required Skills" section
    const rawSkills = [];
    if (Array.isArray(job?.skills)) {
      job.skills.forEach(s => {
        if (typeof s === 'string' && s.trim()) {
          rawSkills.push(s.trim());
        }
      });
    }

    // Check for "Required Skills" or "Key Skills" explicitly
    const patterns = [
      /required skills\s*[:\-]?\s*([^\n]+(?:\n\s*[-*•]?\s*[^\n]+)*)/i,
      /key skills\s*[:\-]?\s*([^\n]+(?:\n\s*[-*•]?\s*[^\n]+)*)/i
    ];
    for (const pattern of patterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        const lines = match[1].split(/[\n,;•\-*]+/);
        lines.forEach(line => {
          const cleaned = line.trim();
          if (cleaned && !cleaned.toLowerCase().includes("experience") && !cleaned.toLowerCase().includes("education") && cleaned.length < 50) {
            rawSkills.push(cleaned);
          }
        });
        break; // Only extract from first matched section
      }
    }

    // Normalize and alias map skills:
    const ALIAS_MAP = {
      "js": "javascript",
      "javascript": "javascript",
      "reactjs": "react",
      "react.js": "react",
      "react": "react",
      "nodejs": "node",
      "node.js": "node",
      "node": "node",
      "mongo": "mongodb",
      "mongodb": "mongodb",
      "api": "api",
      "apis": "api",
      "rest api": "api",
      "restful api": "api",
      "ai": "artificial intelligence",
      "artificial intelligence": "artificial intelligence"
    };

    const normalizedSkills = rawSkills.map(s => {
      const cleaned = s.toLowerCase().trim();
      return ALIAS_MAP[cleaned] || cleaned;
    });

    // Remove duplicates after normalization
    const declaredSkills = Array.from(new Set(normalizedSkills)).filter(s => s.length > 0);

    // Validation
    if (!resumeText || resumeText.length < 20) {
      return {
        score: 0,
        matchedSkills: [],
        missingSkills: declaredSkills.slice(0, 8),
        isMatch: false,
        rejectionReason: "Resume text is too short or empty",
        aiSummary: "Unable to analyze - insufficient resume content",
        confidenceLevel: "low",
      };
    }

    if (declaredSkills.length === 0) {
      return {
        score: 0,
        matchedSkills: [],
        missingSkills: [],
        isMatch: false,
        rejectionReason: "Job must have declared skills for matching",
        aiSummary: "Job posting lacks required skills list",
        confidenceLevel: "low",
      };
    }

    // Step 1: Basic skill matching with alias/normalization checks
    const matchedSkills = [];
    const missingSkills = [];

    // Helper to check candidate skills with alias support
    const candidateHasSkill = (normalizedSkill, text) => {
      const ALIASES = {
        "javascript": ["js", "javascript", "es6"],
        "react": ["react", "reactjs", "react.js"],
        "node": ["node", "node.js", "nodejs"],
        "mongodb": ["mongo", "mongodb"],
        "api": ["api", "apis", "rest api", "restful api"],
        "artificial intelligence": ["ai", "artificial intelligence"]
      };
      const synonyms = ALIASES[normalizedSkill] || [normalizedSkill];
      return synonyms.some(syn => phrasePresent(syn, text));
    };

    declaredSkills.forEach((skill) => {
      if (candidateHasSkill(skill, resumeText)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const skillRatio = declaredSkills.length > 0
      ? matchedSkills.length / declaredSkills.length
      : 0;

    // Step 2: Keyword overlap analysis
    const keywordScore = calculateKeywordScore(resumeText, jobDescription);

    // Step 3: Use Gemini AI for intelligent analysis
    let aiAnalysis = null;
    let aiScore = 0;
    let aiSummary = "";

    try {
      const genAI = getGeminiClient();
      if (!genAI) throw new Error("Gemini client is not initialized");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are an expert recruiter analyzing candidate-job fit.

Job Title: ${jobTitle}
Required Skills: ${declaredSkills.join(", ")}
Job Description: ${jobDescription.substring(0, 500)}

Candidate Resume: ${resume.substring(0, 1000)}

Task: Analyze if this candidate is a good match for this job. Consider:
1. Skills alignment (technical and soft skills)
2. Experience relevance
3. Domain knowledge
4. Overall fit

Respond in JSON format:
{
  "matchScore": <number 0-100>,
  "isRelevant": <boolean>,
  "summary": "<2-3 sentence analysis>",
  "confidence": "<high/medium/low>",
  "keyStrengths": ["<strength1>", "<strength2>"],
  "concerns": ["<concern1>", "<concern2>"]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
        aiScore = aiAnalysis.matchScore || 0;
        aiSummary = aiAnalysis.summary || "";
      }
    } catch (error) {
      console.error("Gemini API Error:", error.message);
      // Fallback if Gemini fails - use basic scoring
      aiScore = Math.round((skillRatio * 0.6 + keywordScore * 0.4) * 100);
      aiSummary = "AI analysis unavailable - using basic keyword matching";
    }

    // Step 4: Calculate final score (weighted combination)
    const skillScore = Math.round(skillRatio * 100);
    const keywordScorePercent = Math.round(keywordScore * 100);

    // Weighted scoring: AI (50%), Skills (30%), Keywords (20%)
    const finalScore = aiAnalysis
      ? Math.round(aiScore * 0.5 + skillScore * 0.3 + keywordScorePercent * 0.2)
      : Math.round(skillScore * 0.6 + keywordScorePercent * 0.4);

    // Step 5: Determine match status with strict thresholds
    const MIN_SCORE = 30; // Minimum 30% to be considered a match
    const MIN_SKILLS = 3; // Or at least 3 matching skills
    const MIN_SKILL_RATIO = 0.4; // Or 40% of required skills

    const isMatch = finalScore >= MIN_SCORE &&
      (matchedSkills.length >= MIN_SKILLS || skillRatio >= MIN_SKILL_RATIO);

    // Step 6: Determine confidence level
    let confidenceLevel = "low";
    if (finalScore >= 70 && matchedSkills.length >= 5) {
      confidenceLevel = "high";
    } else if (finalScore >= 50 && matchedSkills.length >= 3) {
      confidenceLevel = "medium";
    }

    // Step 7: Generate rejection reason if not a match
    let rejectionReason = "";
    if (!isMatch) {
      if (matchedSkills.length === 0) {
        rejectionReason = "No matching skills found - completely different profile";
      } else if (skillRatio < MIN_SKILL_RATIO) {
        rejectionReason = `Only ${matchedSkills.length}/${declaredSkills.length} required skills matched (need ${Math.ceil(declaredSkills.length * MIN_SKILL_RATIO)}+)`;
      } else if (finalScore < MIN_SCORE) {
        rejectionReason = `Match score ${finalScore}% is below minimum threshold of ${MIN_SCORE}%`;
      } else {
        rejectionReason = "Insufficient overall relevance to job requirements";
      }
    }

    // Step 8: Enhance AI summary
    if (!aiSummary && aiAnalysis) {
      const strengths = aiAnalysis.keyStrengths?.join(", ") || "";
      const concerns = aiAnalysis.concerns?.join(", ") || "";
      aiSummary = `Strengths: ${strengths}. Concerns: ${concerns}`;
    } else if (!aiSummary) {
      aiSummary = isMatch
        ? `Candidate shows ${confidenceLevel} alignment with job requirements`
        : `Candidate profile does not align with job requirements`;
    }

    return {
      score: finalScore,
      matchedSkills: matchedSkills.slice(0, 8),
      missingSkills: missingSkills.slice(0, 8),
      isMatch,
      rejectionReason,
      aiSummary,
      confidenceLevel,
    };
  }
};

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has",
  "will", "your", "you", "are", "but", "not", "can", "our"
]);

// Normalize text for comparison
function normalize(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract meaningful words from text
function wordsFrom(text) {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Check if a phrase/skill is present in text
function phrasePresent(phrase, text) {
  const p = normalize(phrase).trim();
  const t = normalize(text);
  if (!p) return false;

  const isSingle = p.split(/\s+/).length === 1;
  if (isSingle) {
    const esc = p.replace(/[.*+?^${}()|[\]{}]/g, "\\$&");
    const re = new RegExp("\\b" + esc + "\\b", "i");
    return re.test(t);
  }
  return t.includes(p);
}

// Calculate basic keyword overlap score
function calculateKeywordScore(resumeText, jobDescription) {
  const jobWords = [...new Set(wordsFrom(jobDescription))];
  const resumeWords = [...new Set(wordsFrom(resumeText))];

  if (jobWords.length === 0) return 0;

  const matched = jobWords.filter((w) => resumeWords.includes(w));
  return matched.length / jobWords.length;
}
