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
        Your task is to compare a candidate's resume against the uploaded Job Description and calculate how well the candidate matches the role.

        Rules:
        * Do NOT calculate the score using semantic similarity.
        * Calculate the score strictly based on:
          1. Required skills match.
          2. Experience requirements match.
          3. Education requirements match.
        * Ignore generic words such as: Project, Product, Team, Development, System, Application, Technology, Software.
        * Only count explicit technical skills.
        * Do NOT consider project names, project titles, or application names as proof of professional skills (e.g., building an HR Management System does NOT mean they have HR Operations experience; building a Payroll App does NOT mean they have Payroll expertise; building a Recruitment Platform does NOT mean they have Talent Acquisition experience).
        * Only consider explicit skills, work experience, certifications, education, and responsibilities mentioned in the resume.
        * If more than 70% of required skills are missing, the final matchPercentage must not exceed 30% (cap it at 30%).
        * Return the exact matched skills and missing skills used for scoring in "matchedSkills" and "missingSkills" arrays.
        * Do not give random or arbitrary scores. Base the score strictly on the Job Description.

        Scoring Weights:
        * Skills Match = 50% (Proportion of required explicit technical skills matched)
        * Experience Match = 25% (Align candidate's years/depth of experience with Job Description requirements)
        * Education Match = 10% (Align candidate's degree with Job Description requirements)
        * Projects & Achievements = 15% (Align candidate's achievements/projects with Job Description responsibilities)

        Provide the output strictly in JSON format matching this schema:
        {
          "matchPercentage": number, // Sum of: Skills Match (0-50) + Experience Match (0-25) + Education Match (0-10) + Projects Match (0-15). Cap strictly at 30 if >70% of required skills are missing.
          "matchedSkills": [string], // Exact explicit technical skills found in both JD and resume (excluding generic words)
          "missingSkills": [string], // Exact explicit technical skills found in JD but missing in resume (excluding generic words)
          "experienceMatch": string, // Explanation of experience comparison
          "educationMatch": string, // Explanation of education comparison
          "strengths": [string],
          "weaknesses": [string],
          "summary": string, // Provide the exact mathematical breakdown (e.g., Skills Match: X/50, Experience Match: Y/25, Education Match: Z/10, Projects Match: W/15) followed by a short summary
          "recommendation": "Strong Match" | "Moderate Match" | "Weak Match" // "Strong Match" if matchPercentage >= 80, "Moderate Match" if 60-79, "Weak Match" if < 60
        }
        Respond ONLY with the JSON. Do not include markdown code block syntax. Just raw JSON.

        JOB DESCRIPTION:
        ${jobDescription}

        CANDIDATE SKILLS:
        ${skills || "Not explicitly listed"}

        CANDIDATE RESUME:
        ${resumeText}
      `;

      const result = await generateWithModelFallback(genAI, prompt);
      const response = await result.response;
      const parsed = cleanJSONResponse(response.text());
      parsed.matchScore = parsed.matchPercentage; // map for frontend backwards compatibility
      return parsed;
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
      'react', 'node', 'javascript', 'typescript', 'tailwind', 'python', 'sql', 'aws', 'docker', 'kubernetes',
      'java', 'golang', 'rust', 'vue', 'angular', 'html', 'css', 'mongodb', 'postgresql', 'mysql', 'git',
      'ci/cd', 'jenkins', 'github', 'jira', 'agile', 'scrum', 'sales', 'marketing', 'seo', 'sem', 'hr',
      'recruitment', 'payroll', 'onboarding', 'finance', 'accounting', 'excel', 'management', 'leadership',
      'communication', 'collaboration', 'design', 'figma'
    ];

    const ignoreWords = ['project', 'product', 'team', 'development', 'system', 'application', 'technology', 'software'];
    const filteredSkillKeywords = skillKeywords.filter(k => !ignoreWords.includes(k));

    // Identify required skills from Job Description
    const requiredSkills = filteredSkillKeywords.filter(skill => descLower.includes(skill));

    // Only use explicitly provided candidate skills from the `skills` parameter (exclude ignore words)
    const candSkills = (skills || '')
      .toLowerCase()
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !ignoreWords.includes(s));

    // Match candidate skills against required skills
    const matchedSkills = requiredSkills.filter(skill => candSkills.includes(skill));
    const missingSkills = requiredSkills.filter(skill => !candSkills.includes(skill));
    
    // 1. Skills Match (50% max)
    let skillsScore = 0;
    if (requiredSkills.length > 0) {
      skillsScore = (matchedSkills.length / requiredSkills.length) * 50;
    }

    // 2. Experience Match (25% max) - baseline experienceScore = 0
    let experienceScore = 0;
    let experienceMatch = "No matching experience requirements identified.";
    const hasSrRole = resumeLower.includes('senior') || resumeLower.includes('lead') || resumeLower.includes('manager');
    const requiresSrRole = descLower.includes('senior') || descLower.includes('lead') || descLower.includes('manager');
    
    if (hasSrRole && requiresSrRole) {
      experienceScore = 25;
      experienceMatch = "Strong Match. Experience level aligns with the senior/leadership requirements.";
    } else if (!requiresSrRole && resumeLower.includes('developer')) {
      experienceScore = 15;
      experienceMatch = "Moderate Match. Experience aligns with professional developer benchmarks.";
    }

    // 3. Education Match (10% max) - baseline educationScore = 0
    let educationScore = 0;
    let educationMatch = "No matching education credentials identified.";
    const degreeKeywords = ['btech', 'mtech', 'bca', 'mca', 'bachelor', 'master', 'degree', 'phd', 'graduate'];
    const jdDegrees = degreeKeywords.filter(d => descLower.includes(d));
    const resumeDegrees = degreeKeywords.filter(d => resumeLower.includes(d));
    
    if (jdDegrees.length > 0) {
      const matchedDegrees = jdDegrees.filter(d => resumeDegrees.includes(d));
      if (matchedDegrees.length > 0) {
        educationScore = 10;
        educationMatch = "Strong Match. Academic credentials align with job requirements.";
      }
    }

    // 4. Projects & Achievements (15% max) - baseline projectsScore = 0
    let projectsScore = 0;
    // Check for explicit achievements/responsibilities keywords (avoiding project name inferences)
    if (resumeLower.includes('achieved') || resumeLower.includes('responsible') || resumeLower.includes('led') || resumeLower.includes('implemented')) {
      projectsScore = 15;
    }

    // Sum matching components
    let matchPercentage = Math.round(skillsScore + experienceScore + educationScore + projectsScore);

    // Apply strict check: If more than 70% of required skills are missing, matchPercentage must not exceed 20%
    if (requiredSkills.length > 0) {
      const missingRatio = missingSkills.length / requiredSkills.length;
      if (missingRatio > 0.70) {
        matchPercentage = Math.min(matchPercentage, 20);
      }
    }

    const matchScore = matchPercentage; // compatibility

    const strengths = [];
    matchedSkills.slice(0, 3).forEach(skill => {
      strengths.push(`Possesses required technical skill: ${skill.toUpperCase()}`);
    });
    if (experienceScore >= 20) {
      strengths.push("Experience matches job requirements.");
    }
    if (strengths.length === 0) {
      strengths.push("Meets base professional benchmarks.");
    }

    const weaknesses = [];
    missingSkills.slice(0, 2).forEach(skill => {
      weaknesses.push(`Missing required skill: ${skill.toUpperCase()}`);
    });
    if (weaknesses.length === 0 && requiredSkills.length > 0) {
      weaknesses.push("No major skill gaps identified.");
    }

    let recommendation = 'Moderate Match';
    if (matchPercentage >= 80) recommendation = 'Strong Match';
    else if (matchPercentage < 60) recommendation = 'Weak Match';

    const summary = `ATS Evaluation: Profile match score is evaluated at ${matchPercentage}%. Skills Match: ${Math.round(skillsScore)}/50%, Experience Match: ${experienceScore}/25%, Education Match: ${educationScore}/10%, Projects Match: ${projectsScore}/15%.`;

    return {
      matchPercentage,
      matchScore, // compatibility
      matchedSkills,
      missingSkills,
      experienceMatch,
      educationMatch,
      strengths,
      weaknesses,
      summary,
      recommendation
    };
  },

  /**
   * AI Recruitment Voice Interviewer - Get Next Question
   */
  async getNextInterviewQuestion(jobTitle, currentRound, history) {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.mockNextQuestion(jobTitle, currentRound);
    }

    try {
      const formattedHistory = history.map(h => `${h.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${h.content}`).join('\n');
      
      const prompt = `
        You are an elite AI technical interviewer conducting a voice interview for the position: "${jobTitle}".
        This is question number ${currentRound} out of 3.
        
        Previous Conversation History:
        ${formattedHistory}
        
        Generate the next single, concise interview question for the candidate.
        If it's question 1: Ask an icebreaker technical question.
        If it's question 2 or 3: Ask a specific follow-up based on their previous answers or a new scenario.
        
        Keep your question highly focused, friendly, and under 30 words so it sounds natural when spoken. Do not write any pleasantries except a brief transition.
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
   * AI HR Assistant Q&A Chatbot
   */
  async askHRAssistant(question, context) {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.mockHRAssistant(question, context);
    }

    try {
      const prompt = `
        You are a friendly, helpful HR assistant chatbot named "SmartHR Assistant" at our company.
        The currently logged-in employee has this profile context:
        ${JSON.stringify(context)}
        
        Answer their question: "${question}"
        
        Be precise, professional, and friendly. Limit your response to 3 sentences maximum. Use the employee context data (like remaining leaves, salary, check-in history) to make your response highly personalized. If they ask about policies not in context, refer them to the official policy documents or their manager.
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
    const name = context.name || 'Employee';
    const leaves = context.leaveBalance || { casual: 0, medical: 0, earned: 0 };
    const salary = context.salary || 0;
    const checkInCount = context.attendanceStats ? context.attendanceStats.checkInCount : 0;

    if (q.includes('leave') || q.includes('balance') || q.includes('vacation')) {
      return `Hi ${name}, you currently have ${leaves.casual} Casual, ${leaves.medical} Medical, and ${leaves.earned} Earned leaves remaining. You can apply for a leave directly from your employee dashboard under the 'Request Leave' section!`;
    }
    
    if (q.includes('salary') || q.includes('pay') || q.includes('money') || q.includes('payslip')) {
      return `Hi ${name}, your monthly base salary is $${salary.toLocaleString()}. Your latest payslip has been generated for the current month and is ready for download in your dashboard under 'Payslips'.`;
    }

    if (q.includes('attendance') || q.includes('check') || q.includes('hours')) {
      return `Hi ${name}, you have checked in ${checkInCount} times this month with an average on-time rate of ${context.attendanceStats?.onTimeRate || 95}%. Make sure to check in daily before 09:15 AM to avoid being marked late!`;
    }

    if (q.includes('wfh') || q.includes('policy') || q.includes('home')) {
      return `According to our policy, you are permitted to work from home up to 2 days per week, coordinating with your manager (${context.manager || 'Rajesh Kumar'}). Core collaboration hours are 11:00 AM to 04:00 PM.`;
    }

    return `Hello ${name}! I'm your SmartHR Assistant. I can help you check your leave balance, view salary details, check-in records, or answer questions about company policies. How can I help you today?`;
  }
};
