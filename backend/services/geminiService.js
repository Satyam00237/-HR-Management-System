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
   * AI Resume Screening
   */
  async screenResume(jobDescription, resumeText) {
    const genAI = getGeminiClient();
    
    if (!genAI) {
      console.log('Gemini API Key missing on backend. Running in simulated fallback mode.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return this.mockScreenResume(jobDescription, resumeText);
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are an expert HR Talent Acquisition Specialist. Evaluate the following Candidate Resume against the Job Description.
        
        Job Description:
        ${jobDescription}
        
        Candidate Resume:
        ${resumeText}
        
        Analyze the skills, education, and experience. Generates a match score (0-100%), 3 key strengths, 2 weaknesses/gaps, and a final recommendation ("Recommended" | "Not Recommended" | "Borderline").
        
        Provide the output strictly in JSON format matching this schema:
        {
          "matchScore": number,
          "strengths": [string],
          "weaknesses": [string],
          "recommendation": "Recommended" | "Not Recommended" | "Borderline"
        }
        Respond ONLY with the JSON. Do not include markdown code block syntax. Just raw JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return cleanJSONResponse(response.text());
    } catch (e) {
      console.warn('Backend Gemini API resume screening error, falling back to mock screen:', e);
      return this.mockScreenResume(jobDescription, resumeText);
    }
  },

  mockScreenResume(jobDesc, resumeText) {
    const text = (resumeText || '').toLowerCase();
    const desc = (jobDesc || '').toLowerCase();
    
    let matchScore = 50;
    const strengths = [];
    const weaknesses = [];

    const keywords = ['react', 'node', 'javascript', 'typescript', 'tailwind', 'python', 'sql', 'aws', 'docker', 'lead', 'management', 'ai', 'css', 'html'];
    const matched = keywords.filter(k => text.includes(k));

    if (matched.length > 0) {
      matchScore += Math.min(45, matched.length * 7);
    }

    if (text.includes('senior') || text.includes('lead') || text.includes('years') && parseInt(text.match(/\d+/) || [0]) > 4) {
      matchScore = Math.min(98, matchScore + 10);
      strengths.push('Demonstrates solid career growth and experience in technical roles.');
    }

    matched.slice(0, 3).forEach(kw => {
      strengths.push(`Proven skills in ${kw.toUpperCase()} matching core requirements.`);
    });

    if (strengths.length === 0) {
      strengths.push('Clean resume format and clear presentation of experience.');
    }

    const jobKeywords = keywords.filter(k => desc.includes(k));
    const missing = jobKeywords.filter(k => !text.includes(k));

    missing.slice(0, 2).forEach(m => {
      weaknesses.push(`Lack of explicit mention of ${m.toUpperCase()} in the resume.`);
    });

    if (weaknesses.length === 0) {
      weaknesses.push('Could provide more metric-driven accomplishments.');
      weaknesses.push('Limited public portfolio references.');
    }

    let recommendation = 'Borderline';
    if (matchScore >= 80) recommendation = 'Recommended';
    else if (matchScore < 60) recommendation = 'Not Recommended';

    return {
      matchScore,
      strengths,
      weaknesses,
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

      const result = await model.generateContent(prompt);
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

      const result = await model.generateContent(prompt);
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are a friendly, helpful HR assistant chatbot named "SmartHR Assistant" at our company.
        The currently logged-in employee has this profile context:
        ${JSON.stringify(context)}
        
        Answer their question: "${question}"
        
        Be precise, professional, and friendly. Limit your response to 3 sentences maximum. Use the employee context data (like remaining leaves, salary, check-in history) to make your response highly personalized. If they ask about policies not in context, refer them to the official policy documents or their manager.
      `;

      const result = await model.generateContent(prompt);
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
