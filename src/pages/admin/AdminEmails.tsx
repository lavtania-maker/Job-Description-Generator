import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Download, Mail, Search, Calendar, Briefcase, CheckSquare, Square } from 'lucide-react';

export default function AdminEmails() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const fetchEmails = async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/minjob');
      return;
    }

    try {
      const res = await fetch('/api/admin/emails', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Add a unique index for selection since emails might not have IDs
        const dataWithIds = data.map((e: any, idx: number) => ({ ...e, tempId: idx }));
        setEmails(dataWithIds.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else if (res.status === 401) {
        navigate('/minjob');
      } else {
        setError('Failed to fetch emails');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter(e => 
    e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.jobTitle && e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map(e => e.tempId)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportCSV = () => {
    const itemsToExport = selectedIds.size > 0 
      ? filteredEmails.filter(e => selectedIds.has(e.tempId))
      : filteredEmails;

    if (itemsToExport.length === 0) {
      alert('No emails to export');
      return;
    }

    const headers = ['Date Submitted', 'Email', 'From'];
    const rows = itemsToExport.map(e => {
      const date = new Date(e.createdAt).toLocaleString();
      const email = e.email;
      let from = 'other';
      if (e.source === 'homepage_copy') from = 'homepage';
      if (e.source === 'template_print') from = 'templates';
      
      return [date, email, from];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `emails_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/minjob/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Email Records</h1>
            </div>
            <div className="flex items-center gap-3">
              {selectedIds.size > 0 && (
                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  {selectedIds.size} selected
                </span>
              )}
              <button 
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm"
              >
                <Download className="w-4 h-4" />
                {selectedIds.size > 0 ? 'Export Selected' : 'Export All'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="max-w-md w-full relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search emails or jobs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {!loading && filteredEmails.length > 0 && (
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-purple-600 transition-colors"
            >
              {selectedIds.size === filteredEmails.length ? (
                <CheckSquare className="w-5 h-5 text-purple-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              {selectedIds.size === filteredEmails.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
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
                    <th className="px-6 py-4 w-10">
                      <button onClick={toggleSelectAll}>
                        {selectedIds.size === filteredEmails.length && filteredEmails.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Job Title</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">From</th>
                    <th className="px-6 py-4 text-sm font-bold text-gray-700 uppercase tracking-wider">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmails.map((e) => (
                    <tr 
                      key={e.tempId} 
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedIds.has(e.tempId) ? 'bg-purple-50/50' : ''}`}
                      onClick={() => toggleSelect(e.tempId)}
                    >
                      <td className="px-6 py-4">
                        {selectedIds.has(e.tempId) ? (
                          <CheckSquare className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{e.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {e.jobTitle || <span className="text-gray-400 italic">General Interest</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          e.source === 'homepage_copy' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {e.source === 'homepage_copy' ? 'Homepage' : 'Templates'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredEmails.length === 0 && (
              <div className="py-12 text-center text-gray-500 font-medium">
                No email records found matching your search.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
