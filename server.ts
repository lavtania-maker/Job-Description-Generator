import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = path.join(process.cwd(), 'jobs.json');
const EMAILS_FILE = path.join(process.cwd(), 'emails.json');

// Initialize DB
async function initDB() {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify([]));
  }
  try {
    await fs.access(EMAILS_FILE);
  } catch {
    await fs.writeFile(EMAILS_FILE, JSON.stringify([]));
  }
}
initDB();

async function getJobs() {
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveJobs(jobs: any[]) {
  await fs.writeFile(DB_FILE, JSON.stringify(jobs, null, 2));
}

async function getEmails() {
  const data = await fs.readFile(EMAILS_FILE, 'utf-8');
  return JSON.parse(data);
}

async function saveEmails(emails: any[]) {
  await fs.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2));
}

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

app.post('/api/generate', async (req, res) => {
  const { jobTitle, industry, location } = req.body;

  if (!jobTitle) {
    return res.status(400).json({ error: 'Job title is required' });
  }

  try {
    const slug = slugify(`${jobTitle} job description`);
    const jobs = await getJobs();
    
    // Check for duplicate
    const existingJob = jobs.find((j: any) => j.slug === slug);
    if (existingJob) {
      return res.json({ slug: existingJob.slug, isExisting: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is missing. Please configure it in the Secrets panel.' });
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
              items: { type: Type.STRING }
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            faqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING }
                },
                required: ["question", "answer"]
              }
            }
          },
          required: ["category", "description", "responsibilities", "requirements", "faqs"]
        }
      }
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
      createdAt: new Date().toISOString()
    };

    jobs.push(newJob);
    await saveJobs(jobs);

    res.json({ slug: newJob.slug, isExisting: false });
  } catch (error: any) {
    console.error('Error generating job description:', error);
    
    // Check for API key errors
    if (error.message && error.message.includes('API key not valid')) {
      return res.status(500).json({ error: 'Invalid Gemini API key. Please check your API key in the Secrets panel.' });
    }
    
    res.status(500).json({ error: error.message || 'Failed to generate job description' });
  }
});

app.get('/api/jobs/:slug', async (req, res) => {
  try {
    const jobs = await getJobs();
    const job = jobs.find((j: any) => j.slug === req.params.slug);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await getJobs();
    // Return summary data for the list
    const summary = jobs.map((j: any) => ({
      id: j.id,
      slug: j.slug,
      jobTitle: j.jobTitle,
      industry: j.industry,
      category: j.category || `${j.industry} job descriptions`,
      published: j.published !== false, // Default to true if not specified
      views: j.views || 0,
      createdAt: j.createdAt
    }));
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Record Page View
app.post('/api/jobs/:slug/view', async (req, res) => {
  try {
    const jobs = await getJobs();
    const index = jobs.findIndex((j: any) => j.slug === req.params.slug);
    if (index !== -1) {
      jobs[index].views = (jobs[index].views || 0) + 1;
      await saveJobs(jobs);
      return res.json({ success: true, views: jobs[index].views });
    }
    res.status(404).json({ error: 'Job not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// Admin Auth Middleware
const adminAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer admin-token-2026') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'ajtjayajayajaya' && password === 'LetsDoIt2026!') {
    res.json({ token: 'admin-token-2026' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin CRUD
app.post('/api/admin/jobs', adminAuth, async (req, res) => {
  try {
    const jobs = await getJobs();
    const newJob = {
      ...req.body,
      location: req.body.location || 'Malaysia',
      id: Date.now().toString(),
      slug: slugify(req.body.jobTitle + ' job description'),
      createdAt: new Date().toISOString()
    };
    jobs.push(newJob);
    await saveJobs(jobs);
    res.json(newJob);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

app.get('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const jobs = await getJobs();
    const job = jobs.find((j: any) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

app.put('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const jobs = await getJobs();
    const index = jobs.findIndex((j: any) => j.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Job not found' });
    
    jobs[index] = { 
      ...jobs[index], 
      ...req.body,
      location: req.body.location || jobs[index].location || 'Malaysia'
    };
    await saveJobs(jobs);
    res.json(jobs[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

app.delete('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const jobs = await getJobs();
    const filtered = jobs.filter((j: any) => j.id !== req.params.id);
    await saveJobs(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Email Recording
app.post('/api/record-email', async (req, res) => {
  try {
    const { email, jobTitle, source } = req.body;
    const emails = await getEmails();
    emails.push({
      email,
      jobTitle,
      source,
      createdAt: new Date().toISOString()
    });
    await saveEmails(emails);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record email' });
  }
});

app.get('/api/admin/emails', adminAuth, async (req, res) => {
  try {
    const emails = await getEmails();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', async (req, res) => {
      try {
        const template = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const url = req.path;
        
        let content = '';
        let title = 'Free Job Description Generator for Malaysia Employers & HR';
        let description = 'Create clear and effective job descriptions for any role in just seconds. Tailored for the Malaysia job market.';

        if (url === '/all') {
          const jobs = await getJobs();
          title = 'Job Description Templates Library | HR Toolkit Malaysia';
          description = 'Browse our comprehensive library of professionally written job templates across all industries in Malaysia.';
          content = `
            <div class="max-w-7xl mx-auto px-4 py-12">
              <h1 class="text-4xl font-bold mb-8">Job Description Templates</h1>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${jobs.map((j: any) => `
                  <a href="/${j.slug}" class="p-4 border rounded-lg hover:border-purple-500 transition-colors">
                    <h2 class="font-bold">${j.jobTitle}</h2>
                    <p class="text-sm text-gray-500">${j.category || 'General'}</p>
                  </a>
                `).join('')}
              </div>
            </div>
          `;
        } else if (url !== '/') {
          const slug = url.startsWith('/') ? url.substring(1) : url;
          const jobs = await getJobs();
          const job = jobs.find((j: any) => j.slug === slug);
          
          if (job) {
            title = `${job.jobTitle} Job Description | HR Templates Malaysia`;
            description = job.content.description.substring(0, 155) + '...';
            content = `
              <div class="max-w-4xl mx-auto px-4 py-12">
                <h1 class="text-4xl font-bold mb-4">${job.jobTitle} Job Description</h1>
                <p class="text-gray-600 mb-8">${job.content.description}</p>
                <h2 class="text-2xl font-bold mb-4">Responsibilities</h2>
                <ul class="list-disc pl-6 mb-8">
                  ${job.content.responsibilities.map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
                <h2 class="text-2xl font-bold mb-4">Requirements</h2>
                <ul class="list-disc pl-6 mb-8">
                  ${job.content.requirements.map((r: string) => `<li>${r}</li>`).join('')}
                </ul>
              </div>
            `;
          }
        }

        const html = template
          .replace('<title>Free Job Description Generator for Malaysia Employers & HR</title>', `<title>${title}</title>`)
          .replace('<meta name="description" content="Create clear and effective job descriptions for any role in just seconds. Tailored for the Malaysia job market." />', `<meta name="description" content="${description}" />`)
          .replace('<div id="root"></div>', `<div id="root">${content}</div>`);
        
        res.send(html);
      } catch (e) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
