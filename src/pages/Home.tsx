import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, Sparkles, AlertCircle, Copy, CheckCircle2, X } from 'lucide-react';
import { LOCATIONS } from '../constants';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    location: ''
  });
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [allJobs, setAllJobs] = useState<any[]>([]);

  const [generatedJob, setGeneratedJob] = useState<{
    jobTitle: string;
    location: string;
    description: string;
    homepageDescription?: string;
    responsibilities: string[];
    requirements: string[];
  } | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          industry: ''
        })
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.log('[v0] generate response (non-JSON):', text.slice(0, 200));
        throw new Error('Server returned an unexpected response. Check that the API server is running and GEMINI_API_KEY is set.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate');
      }

      const jobRes = await fetch(`/api/jobs/${data.slug}`);
      if (!jobRes.ok) throw new Error('Failed to fetch generated job');
      const jobData = await jobRes.json();
      
      setGeneratedJob({
        jobTitle: jobData.jobTitle,
        location: formData.location || jobData.location,
        description: jobData.content.description,
        homepageDescription: jobData.content.homepageDescription,
        responsibilities: jobData.content.responsibilities,
        requirements: jobData.content.requirements
      });
    } catch (err: any) {
      setError(err.message || 'We are sorry, something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedJob) return;

    if (!hasSubmittedEmail) {
      setShowEmailModal(true);
      return;
    }

    performCopy();
  };

  const performCopy = () => {
    if (!generatedJob) return;
    const locationDisplay = generatedJob.location && generatedJob.location !== 'Malaysia' 
      ? `${generatedJob.location}, Malaysia` 
      : 'Malaysia';

    const stripHtml = (html: string) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    const descriptionText = generatedJob.homepageDescription || stripHtml(generatedJob.description);

    const text = `
${generatedJob.jobTitle} Job Description
Location: ${locationDisplay}

Description:
${descriptionText}

Responsibilities:
${generatedJob.responsibilities.map(r => `- ${r}`).join('\n')}

Requirements:
${generatedJob.requirements.map(r => `- ${r}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      await fetch('/api/record-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          jobTitle: generatedJob?.jobTitle,
          source: 'homepage_copy'
        })
      });
    } catch (err) {
      console.error('Failed to record email', err);
    }

    localStorage.setItem('jd_generator_email_submitted', 'true');
    setHasSubmittedEmail(true);
    setShowEmailModal(false);
    performCopy();
  };

  useEffect(() => {
    const submitted = localStorage.getItem('jd_generator_email_submitted');
    if (submitted === 'true') {
      setHasSubmittedEmail(true);
    }

    // Fetch existing job titles for autocomplete
    const fetchJobTitles = async () => {
      try {
        const res = await fetch('/api/jobs');
        if (res.ok) {
          const data = await res.json();
          const publishedJobs = data.filter((j: any) => j.published !== false);
          const sortedData = publishedJobs.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllJobs(sortedData);
          const titles = Array.from(new Set(sortedData.map((j: any) => j.jobTitle))) as string[];
          setJobTitles(titles);
        }
      } catch (err) {
        console.error('Failed to fetch job titles', err);
      }
    };
    fetchJobTitles();

    const params = new URLSearchParams(window.location.search);
    const title = params.get('title');
    if (title) {
      setFormData(prev => ({ ...prev, jobTitle: title }));
      // We need to use the title directly here because setFormData is async
      const submitWithTitle = async (t: string) => {
        setLoading(true);
        setError('');
        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobTitle: t,
              location: '',
              industry: ''
            })
          });
          const text = await res.text();
          let data: any;
          try { data = JSON.parse(text); } catch {
            throw new Error('Server returned an unexpected response.');
          }
          if (!res.ok) throw new Error(data.error || 'Failed to generate');
          const jobRes = await fetch(`/api/jobs/${data.slug}`);
          if (!jobRes.ok) throw new Error('Failed to fetch generated job');
          const jobData = await jobRes.json();
          setGeneratedJob({
            jobTitle: jobData.jobTitle,
            location: jobData.location,
            description: jobData.content.description,
            homepageDescription: jobData.content.homepageDescription,
            responsibilities: jobData.content.responsibilities,
            requirements: jobData.content.requirements
          });
        } catch (err: any) {
          setError(err.message || 'We are sorry, something went wrong. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      submitWithTitle(title);
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Free Job Description Generator for Malaysia Employers & HR</title>
        <meta name="description" content="Create clear and effective job descriptions for any role in just seconds. Tailored for the Malaysia job market." />
      </Helmet>
      
      <div 
        className="flex-1 py-16 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(https://img.freepik.com/free-vector/white-background-gradient-modern-abstract-design-wave_343694-2337.jpg)' }}
      >
        <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#772DBC] to-[#9b4dca] bg-clip-text text-transparent">
              Free Job Description Generator
            </span>
            <br className="hidden md:block" />
            <span className="text-slate-900"> for HR/Recruiter</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
            Generate clear, effective job descriptions in seconds.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end text-left">
              <div className="w-full md:flex-1">
                <label htmlFor="jobTitle" className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                <input
                  id="jobTitle"
                  type="text"
                  required
                  list="job-titles"
                  placeholder="Job Title"
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#772DBC] focus:border-[#772DBC] transition-shadow text-gray-700"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
                <datalist id="job-titles">
                  {jobTitles.map(title => (
                    <option key={title} value={title} />
                  ))}
                </datalist>
              </div>

              <div className="w-full md:flex-1">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-1">Location (Optional)</label>
                <select
                  id="location"
                  className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#772DBC] focus:border-[#772DBC] bg-white text-gray-700"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="">Location (Optional)</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-gradient-to-r from-[#772DBC] to-[#9b4dca] hover:from-[#6525a0] hover:to-[#8a3eb8] text-white font-bold py-3.5 px-8 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-yellow-300" />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="max-w-4xl mx-auto mt-8 bg-white rounded-2xl border border-[#772DBC] overflow-hidden">
            <div className="p-12 md:p-20 flex flex-col items-center justify-center text-center">
              <div className="relative mb-8">
                <Sparkles className="w-16 h-16 text-yellow-400 animate-pulse" />
                <Sparkles className="w-8 h-8 text-orange-400 absolute -top-2 -right-2 animate-bounce" />
              </div>
              <p className="text-gray-600 text-lg font-medium">
                We are generating your Job Description. It may take up to 10 secs.
              </p>
            </div>
          </div>
        )}

        {generatedJob && !loading && (
          <div className="max-w-4xl mx-auto mt-8 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{generatedJob.jobTitle}</h2>
                  <p className="text-gray-500 font-medium">
                    Location: {generatedJob.location && generatedJob.location !== 'Malaysia' ? `${generatedJob.location}, Malaysia` : 'Malaysia'}
                  </p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-[#772DBC] rounded-lg text-sm font-bold text-[#772DBC] hover:bg-purple-50 transition-colors shadow-sm"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy Template'}
                </button>
              </div>

              <div className="space-y-10 text-left">
                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                  {generatedJob.homepageDescription ? (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {generatedJob.homepageDescription}
                    </p>
                  ) : (
                    <div 
                      className="text-gray-700 leading-relaxed prose prose-slate max-w-none prose-p:text-gray-700 prose-p:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: generatedJob.description }}
                    />
                  )}
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Responsibilities</h3>
                  <ul className="space-y-3">
                    {generatedJob.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
                  <ul className="space-y-3">
                    {generatedJob.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        )}

        {allJobs.length > 0 && (
          <div className="max-w-5xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
            <section className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">Popular Job Ads</h3>
              <div className="grid grid-cols-1 gap-3">
                {allJobs.slice(0, 10).map(job => (
                  <Link 
                    key={job.slug} 
                    to={`/${job.slug}`}
                    className="text-[#772DBC] hover:underline text-sm font-medium transition-all"
                  >
                    {job.jobTitle} Job Description
                  </Link>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">Related Job Ads</h3>
              <div className="grid grid-cols-1 gap-3">
                {allJobs.slice(10, 20).map(job => (
                  <Link 
                    key={job.slug} 
                    to={`/${job.slug}`}
                    className="text-[#772DBC] hover:underline text-sm font-medium transition-all"
                  >
                    {job.jobTitle} Job Description
                  </Link>
                ))}
                {allJobs.length <= 10 && <p className="text-slate-400 text-sm">More templates coming soon...</p>}
              </div>
            </section>
          </div>
        )}

        <div className="max-w-5xl mx-auto mt-24 mb-16 px-8 py-12 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-4 text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Want to explore our ready-to-use job description library (1,000+)?
            </h2>
            <p className="text-slate-600">
              Browse our extensive collection of professional job templates tailored for Malaysian HR.
            </p>
            <div className="pt-2">
              <button 
                onClick={() => navigate('/all')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-all shadow-sm"
              >
                View all templates
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
            <img 
              src="https://cdn3d.iconscout.com/3d/premium/thumb/job-posting-3d-icon-png-download-12122574.png" 
              alt="Job Search" 
              className="w-48 h-auto rounded-2xl shadow-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Email Modal for Copy */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">One last step!</h3>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Please enter your email to copy this job description template.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="modal-email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#772DBC] focus:border-[#772DBC] outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#772DBC] to-[#9b4dca] text-white font-bold rounded-lg hover:opacity-90 transition-opacity shadow-md"
                >
                  Submit & Copy
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
