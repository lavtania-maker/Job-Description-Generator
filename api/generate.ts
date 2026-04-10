import { kv } from '@vercel/kv';
import { GoogleGenAI, Type } from '@google/genai';

export const config = {
  runtime: 'edge',
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default async function handler(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { jobTitle, industry, location } = await request.json();

    if (!jobTitle) {
      return new Response(JSON.stringify({ error: 'Job title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const slug = slugify(`${jobTitle} job description`);
    const jobs = (await kv.get<any[]>('jobs')) || [];

    // Check for duplicate
    const existingJob = jobs.find((j: any) => j.slug === slug);
    if (existingJob) {
      return new Response(JSON.stringify({ slug: existingJob.slug, isExisting: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is missing. Please configure it in environment variables.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const categoriesList = `Accounting job descriptions, Finance job descriptions, Administrative job descriptions, IT and Development job descriptions, Design job descriptions, Customer service job descriptions, Educator & Education job descriptions, Corporate training job descriptions, Engineering job descriptions, Construction job descriptions, Production job descriptions, Healthcare job descriptions, Pharmaceuticals job descriptions, Hospitality job descriptions, Travel & Tourism job descriptions, Human Resources (HR) job descriptions, Law enforcement / Security job descriptions, Legal job descriptions, Logistics job descriptions, Facilities job descriptions, Marketing job descriptions, Public Relations (PR) job descriptions, Media job descriptions, Real estate job descriptions, Sales job descriptions, Retail job descriptions`;

    const industryString = industry && industry !== 'Generic' ? `in the '${industry}' industry` : 'in a relevant industry';
    const locationString = location ? `located in '${location}', Malaysia` : 'located in Malaysia';
    const prompt = `You are an expert HR copywriter in Malaysia. Generate a job description for a '${jobTitle}' ${industryString}, ${locationString}.
    
    Generate the content in simple English, tailored to the Malaysia job market.
    
    Also, classify this job into EXACTLY ONE of the following categories:
    ${categoriesList}
    
    Output JSON format strictly:
    {
      "category": "exact category string from the list above",
      "description": "150-250 words tailored to Malaysia job market, including hiring appeal and industry relevance.",
      "responsibilities": ["bullet 1", "bullet 2", ... 6-8 items],
      "requirements": ["bullet 1", "bullet 2", ... 6-8 items],
      "faqs": [
        {"question": "What does this role do?", "answer": "..."},
        {"question": "What are the key responsibilities?", "answer": "..."},
        {"question": "What are the required skills?", "answer": "..."},
        {"question": "Who do they work with?", "answer": "..."}
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            responsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ['question', 'answer'],
              },
            },
          },
          required: ['category', 'description', 'responsibilities', 'requirements', 'faqs'],
        },
      },
    });

    const content = JSON.parse(response.text || '{}');
    const category = content.category || `${industry} job descriptions`;

    const newJob = {
      id: Date.now().toString(),
      slug,
      jobTitle,
      industry,
      category,
      location,
      content,
      createdAt: new Date().toISOString(),
    };

    jobs.push(newJob);
    await kv.set('jobs', jobs);

    return new Response(JSON.stringify({ slug: newJob.slug, isExisting: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error generating job description:', error);

    if (error.message && error.message.includes('API key not valid')) {
      return new Response(JSON.stringify({ error: 'Invalid Gemini API key. Please check your API key.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: error.message || 'Failed to generate job description' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
