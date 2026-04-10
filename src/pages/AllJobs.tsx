import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Search, ChevronDown, ChevronRight, Briefcase, Calculator, Laptop, 
  Palette, Headphones, GraduationCap, Building2, Stethoscope, Utensils, 
  Users, Shield, Truck, Megaphone, Home, ShoppingBag, Sparkles, ArrowRight,
  Factory
} from 'lucide-react';
import { JobSummary } from '../types';
import { CATEGORIES } from '../constants';

const CATEGORY_ICONS: Record<string, any> = {
  "Accounting job descriptions": Calculator,
  "Finance job descriptions": Calculator,
  "Administrative job descriptions": Briefcase,
  "IT and Development job descriptions": Laptop,
  "Design job descriptions": Palette,
  "Customer service job descriptions": Headphones,
  "Educator & Education job descriptions": GraduationCap,
  "Engineering job descriptions": Building2,
  "Healthcare job descriptions": Stethoscope,
  "Hospitality job descriptions": Utensils,
  "Human Resources (HR) job descriptions": Users,
  "Law enforcement / Security job descriptions": Shield,
  "Logistics job descriptions": Truck,
  "Marketing job descriptions": Megaphone,
  "Real estate job descriptions": Home,
  "Sales job descriptions": ShoppingBag,
  "Retail job descriptions": ShoppingBag,
  "Manufacturing job descriptions": Factory,
  "Construction job descriptions": Building2,
  "Administration job descriptions": Briefcase,
};

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  "Accounting job descriptions": "Accounting & Finance",
  "Finance job descriptions": "Investment & Banking",
  "Administrative job descriptions": "Office & Administration",
  "Administration job descriptions": "Office & Administration",
  "IT and Development job descriptions": "Technology & Software",
  "Design job descriptions": "Creative & Design",
  "Customer service job descriptions": "Support & Success",
  "Educator & Education job descriptions": "Teaching & Education",
  "Engineering job descriptions": "Engineering & Technical",
  "Construction job descriptions": "Construction & Property",
  "Healthcare job descriptions": "Medical & Health",
  "Hospitality job descriptions": "Hospitality & F&B",
  "Human Resources (HR) job descriptions": "HR & Recruitment",
  "Law enforcement / Security job descriptions": "Safety & Security",
  "Logistics job descriptions": "Supply Chain & Logistics",
  "Marketing job descriptions": "Marketing & Growth",
  "Real estate job descriptions": "Property & Real Estate",
  "Sales job descriptions": "Sales & Business Development",
  "Retail job descriptions": "Retail & Commerce",
  "Manufacturing job descriptions": "Manufacturing & Production",
};

export default function AllJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [readyToHireTitle, setReadyToHireTitle] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        const sortedData = data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setJobs(sortedData);
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (job.published === false) return false;
      const matchesSearch = job.jobTitle.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory ? job.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [jobs, search, selectedCategory]);

  const groupedJobs = useMemo(() => {
    const groups: Record<string, JobSummary[]> = {};
    filteredJobs.forEach(job => {
      const cat = job.category || `${job.industry} job descriptions`;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(job);
    });
    
    const sortedGroups: Record<string, JobSummary[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
    });
    
    return sortedGroups;
  }, [filteredJobs]);

  const handleReadyToHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readyToHireTitle) {
      navigate(`/?title=${encodeURIComponent(readyToHireTitle)}`);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      <Helmet>
        <title>Job Description Templates for Malaysian HR & Employers</title>
        <meta name="description" content="Browse our library of free job description templates for Malaysian companies. Find professional job ad samples for all industries and roles." />
      </Helmet>

      {/* Hero Section - Modern & Bold */}
      <header className="relative pt-24 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#772DBC]/5 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#9b4dca]/5 blur-[120px]"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#772DBC] text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            HR & Recruitment Resources
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Job Description Templates for <br />
            <span className="bg-gradient-to-r from-[#772DBC] to-[#9b4dca] bg-clip-text text-transparent">
              HR & Employers
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Save time writing job ads. Browse our library of ready-to-use templates for any role.
          </p>
        </div>
      </header>

      {/* Search & Filter Bar - Sticky-ish */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search for a job role (e.g. Sales, Admin)..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#772DBC] transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-64">
            <select
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl appearance-none text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#772DBC]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-[#772DBC] rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Loading templates...</p>
          </div>
        ) : Object.keys(groupedJobs).length === 0 ? (
          <div className="text-center py-32 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No matches found</h3>
            <p className="text-slate-500">Try a different keyword or browse all categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Category Navigation - Desktop Only */}
            <aside className="hidden lg:block lg:col-span-3 space-y-8">
              <div className="sticky top-32">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Explore Categories</h3>
                <nav className="space-y-4">
                  {Object.keys(groupedJobs).map(cat => {
                    const displayName = CATEGORY_DISPLAY_NAMES[cat] || cat.replace(' job descriptions', '');
                    return (
                      <a 
                        key={cat}
                        href={`#${cat.replace(/\s+/g, '-').toLowerCase()}`}
                        className="block text-sm font-medium text-[#772DBC] hover:underline transition-all"
                      >
                        {displayName}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Job Listings */}
            <div className="lg:col-span-9 space-y-24">
              {/* Trending Section */}
              {!search && !selectedCategory && (
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Popular Job Ads</h2>
                    <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                    {jobs.slice(0, 4).map(job => (
                      <Link 
                        key={job.slug}
                        to={`/${job.slug}`}
                        className="text-[#772DBC] hover:underline font-bold text-lg transition-all"
                      >
                        {job.jobTitle}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {Object.entries(groupedJobs).map(([category, categoryJobs]) => {
                const Icon = CATEGORY_ICONS[category] || Briefcase;
                const displayName = CATEGORY_DISPLAY_NAMES[category] || category.replace(' job descriptions', '');
                const id = category.replace(/\s+/g, '-').toLowerCase();
                const jobsList = categoryJobs as JobSummary[];
                
                return (
                  <section key={category} id={id} className="scroll-mt-32 space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#772DBC] to-[#9b4dca] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900">{displayName}</h2>
                        <p className="text-sm text-slate-400 font-medium">{jobsList.length} Templates Available</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                      {jobsList.map(job => (
                        <Link 
                          key={job.slug}
                          to={`/${job.slug}`}
                          className="text-[#772DBC] hover:underline font-medium transition-all py-1 block"
                        >
                          {job.jobTitle}
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Redesigned Ready to Hire Section */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <div className="relative rounded-[3rem] bg-slate-900 p-12 md:p-20 overflow-hidden text-center">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#772DBC]/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#9b4dca]/10 blur-[120px] rounded-full"></div>
          </div>

          <div className="relative z-10 space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Create Your Job Ad Now
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Can't find what you need? Generate a custom job description in seconds or use our templates to post your next vacancy.
              </p>
            </div>

            <form onSubmit={handleReadyToHireSubmit} className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Type a job title to start..."
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#772DBC] transition-all"
                  value={readyToHireTitle}
                  onChange={(e) => setReadyToHireTitle(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-10 py-5 bg-gradient-to-r from-[#772DBC] to-[#9b4dca] hover:opacity-90 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/20"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                100% Free
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Instant Access
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Hiring Optimized
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
