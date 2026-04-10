import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Plus, Edit2, Trash2, CheckCircle, XCircle, Mail, LogOut, Search, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const totalViews = jobs.reduce((sum, job) => sum + (job.views || 0), 0);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/minjob');
      return;
    }

    try {
      const [jobsRes, emailsRes] = await Promise.all([
        fetch('/api/jobs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/emails', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      if (emailsRes.ok) {
        const emailsData = await emailsRes.json();
        setEmails(emailsData);
      }

      if (!jobsRes.ok && jobsRes.status === 401) {
        navigate('/minjob');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(jobs.filter(j => j.id !== id));
      } else {
        alert('Failed to delete job');
      }
    } catch (err) {
      alert('Something went wrong');
    }
  };

  const handleTogglePublish = async (job: any) => {
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ published: !job.published })
      });
      if (res.ok) {
        setJobs(jobs.map(j => j.id === job.id ? { ...j, published: !job.published } : j));
      } else {
        alert('Failed to update job');
      }
    } catch (err) {
      alert('Something went wrong');
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/minjob');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/minjob/emails" className="text-gray-600 hover:text-purple-600 flex items-center gap-2 font-medium">
                <Mail className="w-5 h-5" />
                Email Records
              </Link>
              <button 
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Job Descriptions</p>
            <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Views</p>
            <p className="text-3xl font-bold text-blue-600">{totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Published</p>
            <p className="text-3xl font-bold text-green-600">{jobs.filter(j => j.published).length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Drafts</p>
            <p className="text-3xl font-bold text-gray-600">{jobs.filter(j => !j.published).length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Emails Collected</p>
            <p className="text-3xl font-bold text-purple-600">{emails.length}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link 
            to="/minjob/jobs/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Job
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center font-medium">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider text-center">Views</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{job.jobTitle}</div>
                        <div className="text-xs text-gray-500">{job.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{job.industry}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-gray-700">
                          <Eye className="w-4 h-4 text-gray-400" />
                          {job.views || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleTogglePublish(job)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            job.published 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {job.published ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {job.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link 
                          to={`/minjob/jobs/edit/${job.id}`}
                          className="inline-flex p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(job.id)}
                          className="inline-flex p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredJobs.length === 0 && (
              <div className="py-12 text-center text-gray-500 font-medium">
                No jobs found matching your search.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
