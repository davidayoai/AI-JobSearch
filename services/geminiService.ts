import { GoogleGenAI, Type } from "@google/genai";
import type { SearchFilters, Job } from '../types';
import { InsightType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const jobSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING, description: 'A unique identifier for the job' },
    title: { type: Type.STRING, description: 'The title of the job position' },
    company: { type: Type.STRING, description: 'The name of the company hiring' },
    location: { type: Type.STRING, description: 'The location of the job (e.g., "San Francisco, CA")' },
    type: { type: Type.STRING, description: 'The type of employment (e.g., "Full-time")' },
    description: { type: Type.STRING, description: 'A detailed description of the job responsibilities and requirements' },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of key skills required for the job'
    },
    salaryRange: { type: Type.STRING, description: 'An estimated salary range (e.g., "$120,000 - $150,000")', nullable: true },
  },
  required: ['id', 'title', 'company', 'location', 'type', 'description', 'skills'],
};

export const findJobs = async (filters: SearchFilters): Promise<Job[]> => {
  try {
    const prompt = `Find AI-related jobs based on the following criteria and rank them by relevance:
    - Keywords: ${filters.query || 'any'}
    - Location: ${filters.location || 'any'}
    - Job Type: ${filters.type || 'any'}
    - Desired Salary: ${filters.salary || 'any'}
    - Work Location Preference: ${filters.workLocation || 'any'}
    - Target Industry: ${filters.industry || 'any'}
    
    Generate between 8 and 12 realistic but fictional job listings that are the best match for these criteria. The most relevant jobs should appear first.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an AI Job Board API. Your purpose is to generate realistic, fictional job listings based on user queries. Respond ONLY with a valid JSON array matching the provided schema. Do not include any introductory text, markdown formatting, or explanations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: jobSchema,
        },
      },
    });
    
    const jsonString = response.text;
    const jobs = JSON.parse(jsonString);
    return jobs as Job[];
  } catch (error) {
    console.error("Error finding jobs:", error);
    throw new Error("Failed to fetch job listings from Gemini API.");
  }
};

export const getJobInsight = async (job: Job, insightType: InsightType): Promise<string> => {
  let prompt = '';
  switch (insightType) {
    case InsightType.SUMMARY:
      prompt = `Summarize the key responsibilities and qualifications from the following job description in 3-4 concise bullet points:\n\n---\n\n${job.description}`;
      break;
    case InsightType.SKILLS:
      prompt = `Based on this job description, list the top 5 most important technical skills as a comma-separated list. Only list the skills.\n\n---\n\n${job.description}`;
      break;
    case InsightType.COVER_LETTER:
      prompt = `Write a compelling and professional opening paragraph (2-3 sentences) for a cover letter for the role of '${job.title}' at '${job.company}'. The paragraph should be concise and express enthusiasm for the role and the company based on the provided job description.\n\n---\n\n${job.description}`;
      break;
    default:
      throw new Error('Invalid insight type');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error(`Error getting job insight (${insightType}):`, error);
    throw new Error(`Failed to generate insight for the job.`);
  }
};

export const analyzeResume = async (
  resume: { text?: string; file?: { data: string; mimeType: string } }, 
  job: Job
): Promise<string> => {
  
  const promptText = `
    As an expert career coach and resume writer, analyze the following resume against the provided job description.

    **Job Description:**
    Title: ${job.title}
    Company: ${job.company}
    Description: ${job.description}
    Required Skills: ${job.skills.join(', ')}

    **User's Resume is provided as a file attachment or as text below.**

    ---

    Provide a detailed analysis with the following sections, formatted in markdown:

    ### Overall Match
    Provide a brief summary (2-3 sentences) of how well the resume aligns with the job description and a qualitative rating (e.g., Strong Match, Good Match, Needs Improvement).

    ### Keyword Analysis
    - **Keywords to Add:** List critical keywords and skills from the job description that are missing from the resume.
    - **Keywords to Emphasize:** List keywords that are present but could be highlighted more effectively.

    ### Tailoring Suggestions
    Provide 3-5 specific, actionable suggestions for tailoring the resume. For each suggestion, explain *why* it's important and provide an example of how to phrase it. For instance, suggest rephrasing a bullet point to include specific metrics or technologies mentioned in the job description.
  `;

  const parts: any[] = [];
  
  if (resume.file) {
    parts.push({text: promptText});
    parts.push({
      inlineData: {
        mimeType: resume.file.mimeType,
        data: resume.file.data,
      },
    });
  } else if (resume.text) {
     parts.push({text: `${promptText}\n\n**User's Resume:**\n${resume.text}`});
  } else {
    throw new Error("No resume provided for analysis.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: { parts },
    });
    return response.text;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw new Error('Failed to analyze resume with Gemini API.');
  }
};


export const parseJobPosting = async (jobPostingText: string): Promise<Job> => {
  try {
    const prompt = `
      Analyze the following job posting text and extract the key information.
      If a specific piece of information (like salaryRange) is not present, omit the field or set it to null.
      The 'type' should be one of 'Full-time', 'Part-time', 'Contract', or 'Internship'. If you can't determine it, default to 'Full-time'.
      The location should be specific (e.g., "San Francisco, CA" or "Remote").
      Generate a list of 5-10 relevant skills based on the description.
      Generate a plausible but random ID for the job.

      Job Posting Text:
      ---
      ${jobPostingText}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a more powerful model for better parsing accuracy
      contents: prompt,
      config: {
        systemInstruction: "You are an expert job description parser. Your task is to extract job details from raw text and respond ONLY with a single valid JSON object matching the provided schema. Do not include any introductory text, markdown formatting, or explanations.",
        responseMimeType: "application/json",
        responseSchema: jobSchema,
      },
    });

    const jsonString = response.text;
    const parsedJobData = JSON.parse(jsonString);

    // Ensure the job has a unique ID client-side, overriding whatever Gemini provided.
    const jobWithId: Job = { ...parsedJobData, id: crypto.randomUUID() };
    
    return jobWithId;

  } catch (error) {
    console.error("Error parsing job posting:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("AI failed to return valid JSON. The job description might be too complex or unclear. Please try again with a different posting.");
    }
    throw new Error("Failed to parse job posting with Gemini API.");
  }
};