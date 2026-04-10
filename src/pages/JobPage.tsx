import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ChevronRight, Copy, Download, Share, Briefcase, MapPin, 
  Building2, CheckCircle2, Linkedin, ChevronDown, ChevronUp, 
  Search, Plus, Sparkles, Printer, Mail, Twitter, Facebook, X
} from 'lucide-react';
import { Job } from '../types';

export default function JobPage({ slugOverride }: { slugOverride?: string }) {
  const { slug: paramsSlug } = useParams();
  const slug = slugOverride || paramsSlug;
  const [job, setJob] = useState<Job | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${slug}`);
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        setJob(data);

        // Record view
        fetch(`/api/jobs/${slug}/view`, { method: 'POST' }).catch(console.error);

        // Fetch all jobs for related links
        const allRes = await fetch('/api/jobs');
        if (allRes.ok) {
          const allData = await allRes.json();
          const sortedAllData = allData.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setAllJobs(sortedAllData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [slug]);

  const handleCopy = () => {
    if (!job) return;
    const text = `
${job.jobTitle} Job Description

${plainDescription}

Responsibility:
${job.content.responsibilities.map(r => `- ${r}`).join('\n')}

Requirements and Skills:
${job.content.requirements.map(r => `- ${r}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await fetch('/api/record-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          jobTitle: job?.jobTitle,
          source: 'template_print'
        })
      });
    } catch (err) {
      console.error('Failed to record email', err);
    }

    setShowEmailModal(false);
    // Use setTimeout to ensure the modal is hidden before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`${job?.jobTitle} Job Description`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    mail: `mailto:?subject=${encodeURIComponent(`${job?.jobTitle} Job Description`)}&body=${encodeURIComponent(`Check out this job description template for ${job?.jobTitle}: ${window.location.href}`)}`
  };

  const relatedJobs = allJobs
    .filter(j => j.slug !== slug)
    .slice(0, 5);

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#772DBC]"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen px-4 text-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description Not Found</h2>
        <p className="text-gray-600 mb-8">The job description you are looking for does not exist or has been removed.</p>
        <Link to="/" className="text-[#772DBC] hover:text-[#6525a0] font-medium">
          Generate a new job description
        </Link>
      </div>
    );
  }

  const plainDescription = stripHtml(job.content.description);

  return (
    <article className="bg-white min-h-screen font-sans text-slate-900">
      <Helmet>
        <title>{job.jobTitle} Job Description | HR Templates Malaysia</title>
        <meta name="description" content={plainDescription.substring(0, 155) + '...'} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      {/* Breadcrumbs - Minimal */}
      <nav className="border-b border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Link to="/" className="hover:text-[#772DBC]">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/all" className="hover:text-[#772DBC]">Templates</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600">{job.jobTitle}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Sidebar - Meta & Actions */}
          <aside className="lg:col-span-3 space-y-10 order-2 lg:order-1">
            <div className="space-y-6 sticky top-24">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#772DBC] text-white rounded-xl font-bold text-sm hover:bg-[#6525a0] transition-all shadow-lg shadow-purple-100"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy Template'}
                  </button>
                  <button 
                    onClick={() => setShowEmailModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print PDF
                  </button>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share</h3>
                <div className="flex items-center gap-4">
                  <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-[#0077b5] transition-colors"><Linkedin className="w-5 h-5" /></a>
                  <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-[#1da1f2] transition-colors"><Twitter className="w-5 h-5" /></a>
                  <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-[#1877f2] transition-colors"><Facebook className="w-5 h-5" /></a>
                  <a href={shareLinks.mail} className="p-2 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"><Mail className="w-5 h-5" /></a>
                </div>
              </div>

              {relatedJobs.length > 0 && (
                <div className="p-6 rounded-2xl border border-slate-100 space-y-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Related Templates</h3>
                  <div className="space-y-4">
                    {relatedJobs.map((rj) => (
                      <Link 
                        key={rj.slug} 
                        to={`/${rj.slug}`}
                        className="block text-sm font-bold text-slate-600 hover:text-[#772DBC] transition-colors leading-tight"
                      >
                        {rj.jobTitle} Job Description
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#772DBC] to-[#9b4dca] text-white space-y-4">
                <Sparkles className="w-8 h-8 opacity-50" />
                <h3 className="text-lg font-bold leading-tight">Need a custom job description?</h3>
                <p className="text-sm text-purple-100 leading-relaxed">Our AI can generate a tailored description for any role in seconds.</p>
                <Link to="/" className="block w-full py-3 bg-white text-[#772DBC] rounded-xl font-bold text-sm text-center hover:bg-purple-50 transition-all">
                  Try AI Generator
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 order-1 lg:order-2 space-y-16">
            <header className="space-y-8">
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-[#772DBC] text-[10px] font-bold uppercase tracking-wider">
                  {job.category || 'HR Templates'}
                </span>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                  {job.jobTitle} Job Description
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Location: {job.location && job.location !== 'Malaysia' ? `${job.location}, Malaysia` : 'Malaysia'}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <span>Updated March 2024</span>
                <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                <span>4 min read</span>
              </div>

              <div className="p-8 rounded-3xl bg-slate-50 border-l-4 border-[#772DBC]">
                <p className="text-xl text-slate-600 leading-relaxed italic">
                  "{job.content.summary || plainDescription.split('\n')[0]}"
                </p>
              </div>
            </header>

            <section className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600">
              <div className="space-y-12">
                {/* Intro */}
                <div className="space-y-6">
                  <div 
                    dangerouslySetInnerHTML={{ __html: job.content.description }}
                  />
                </div>

                {/* Dynamic Sections (Legacy Support) */}
                {!job.content.homepageDescription && job.content.sections?.filter(s => {
                  const heading = s.heading.toLowerCase();
                  const jobTitleLower = job.jobTitle.toLowerCase();
                  return heading !== 'job brief' && 
                         heading !== `what is a ${jobTitleLower}?` &&
                         heading !== `what is ${jobTitleLower}?`;
                }).map((section, idx) => (
                  <div key={idx} className="space-y-6">
                    <h2 className="text-3xl font-bold">{section.heading}</h2>
                    <div className="whitespace-pre-wrap">{section.content}</div>
                  </div>
                ))}

                {/* Responsibilities */}
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">Responsibilities</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 list-none p-0">
                    {job.content.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 m-0">
                        <CheckCircle2 className="w-5 h-5 text-[#772DBC] flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold">Requirements and Skills</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 list-none p-0">
                    {job.content.requirements.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 m-0">
                        <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#772DBC]"></div>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FAQ Section */}
                <div className="pt-16 border-t border-slate-100 space-y-10">
                  <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {job.content.faqs.map((faq, i) => (
                      <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden">
                        <button 
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-bold text-slate-900">{faq.question}</span>
                          {openFaq === i ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>
                        {openFaq === i && (
                          <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Footer CTA */}
            <section className="pt-20">
              <div className="p-10 rounded-[2rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 text-center md:text-left">
                  <h2 className="text-3xl font-bold">Ready to hire your next {job.jobTitle}?</h2>
                  <p className="text-slate-400">Post this job description on 200+ job boards with one click.</p>
                </div>
                <a 
                  href="https://www.ajobthing.com/register?utm_source=jobdescriptiongenerator&utm_medium=referral&utm_campaign=ajt-post-job"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-all whitespace-nowrap"
                >
                  Post Job Now
                </a>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Email Modal for PDF */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowEmailModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Download PDF</h3>
                <p className="text-slate-500">Please enter your email address to download the job description as a PDF.</p>
              </div>
              <form onSubmit={handlePrint} className="space-y-4">
                <input 
                  type="email" 
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#772DBC] transition-all"
                />
                <button 
                  type="submit"
                  className="w-full py-4 bg-[#772DBC] text-white rounded-xl font-bold hover:bg-[#6525a0] transition-all shadow-lg shadow-purple-100"
                >
                  Continue to Print
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
