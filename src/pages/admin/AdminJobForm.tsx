import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Save, Plus, Trash2, HelpCircle } from 'lucide-react';
import { INDUSTRIES, CATEGORIES } from '../../constants';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function AdminJobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [error, setError] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [formData, setFormData] = useState({
    jobTitle: '',
    industry: 'Retail',
    category: CATEGORIES[0],
    published: false,
    content: {
      category: '',
      summary: '',
      shortIntro: '',
      description: '',
      homepageDescription: '',
      sections: [
        { heading: 'What is it?', content: '' },
        { heading: 'Responsibilities', content: '' },
        { heading: 'Job Brief', content: '' }
      ],
      responsibilities: [] as string[],
      requirements: [] as string[],
      faqs: [{ question: '', answer: '' }]
    }
  });

  // State for bulk textareas
  const [bulkResp, setBulkResp] = useState('');
  const [bulkReq, setBulkReq] = useState('');

  useEffect(() => {
    if (id) {
      const fetchJob = async () => {
        try {
          const token = localStorage.getItem('admin_token');
          const res = await fetch(`/api/admin/jobs/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error('Failed to fetch job data');
          const fullJob = await res.json();
          
          // Migration logic for old jobs
          let homepageDesc = fullJob.content.homepageDescription || '';
          let richDescription = fullJob.content.description || '';
          
          // If it's an old job (has sections but no homepageDescription)
          if (fullJob.content.sections && !fullJob.content.homepageDescription) {
            // Use the old plain description as homepage description
            homepageDesc = fullJob.content.description;
            
            // Build rich text description from intro + sections
            const intro = fullJob.content.description 
              ? fullJob.content.description.split('\n\n').map((p: string) => `<p>${p}</p>`).join('')
              : '';
            const sectionsHtml = (fullJob.content.sections || []).map((s: any) => {
              return `<h2>${s.heading}</h2><p>${s.content}</p>`;
            }).join('');
            
            richDescription = intro + sectionsHtml;
          }
          
          // Merge with default state to ensure all fields exist
          const mergedData = {
            ...formData,
            ...fullJob,
            content: {
              ...formData.content,
              ...fullJob.content,
              homepageDescription: homepageDesc,
              description: richDescription
            }
          };
          
          setFormData(mergedData);
          setBulkResp((mergedData.content.responsibilities || []).map((r: string) => `• ${r}`).join('\n'));
          setBulkReq((mergedData.content.requirements || []).map((r: string) => `• ${r}`).join('\n'));
          
          if (mergedData.category && !CATEGORIES.includes(mergedData.category)) {
            setShowNewCategory(true);
            setNewCategory(mergedData.category);
          }
        } catch (err) {
          setError('Failed to fetch job data');
        } finally {
          setFetching(false);
        }
      };
      fetchJob();
    }
  }, [id]);

  const parseBulkList = (text: string) => {
    return text
      .split('\n')
      .map(line => line.replace(/^[•\-\*\d\.\s]+/, '').trim())
      .filter(line => line.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    const url = id ? `/api/admin/jobs/${id}` : '/api/admin/jobs';
    const method = id ? 'PUT' : 'POST';

    const finalCategory = showNewCategory ? newCategory : formData.category;
    
    const finalData = {
      ...formData,
      category: finalCategory,
      content: {
        ...formData.content,
        category: finalCategory,
        responsibilities: parseBulkList(bulkResp),
        requirements: parseBulkList(bulkReq)
      }
    };

    // Remove legacy sections if we have the new format
    if (finalData.content.homepageDescription) {
      delete (finalData.content as any).sections;
      delete (finalData.content as any).shortIntro;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalData)
      });

      if (res.ok) {
        navigate('/minjob/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save job');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const addFaq = () => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        faqs: [...formData.content.faqs, { question: '', answer: '' }]
      }
    });
  };

  const removeFaq = (index: number) => {
    const newFaqs = [...formData.content.faqs];
    newFaqs.splice(index, 1);
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        faqs: newFaqs
      }
    });
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...formData.content.faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        faqs: newFaqs
      }
    });
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/minjob/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{id ? 'Edit Job' : 'Add New Job'}</h1>
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Job
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Basic Info */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Industry</label>
                <select
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                {!showNewCategory ? (
                  <div className="flex gap-2">
                    <select
                      required
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-bold text-xs"
                    >
                      Add New
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter new category..."
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-bold text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <label htmlFor="published" className="text-sm font-semibold text-gray-700">Publish immediately</label>
            </div>
          </section>

          {/* Content */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Job Description Content</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Homepage Description (Generated Content)</label>
                <p className="text-xs text-gray-400 mb-2">This content will be shown on the homepage when a user generates a job.</p>
                <textarea
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.content.homepageDescription || ''}
                  onChange={(e) => setFormData({ ...formData, content: { ...formData.content, homepageDescription: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Template Page Description (Full Content)</label>
                <p className="text-xs text-gray-400 mb-2">This content will be shown on the dedicated template page. Supports rich text (H2, H3, Bold, Italic, Links).</p>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={formData.content.description || ''}
                    onChange={(val) => setFormData({ ...formData, content: { ...formData.content, description: val } })}
                    modules={{
                      toolbar: [
                        [{ 'header': [2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ],
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Summary (Italic Intro)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.content.summary || ''}
                  onChange={(e) => setFormData({ ...formData, content: { ...formData.content, summary: e.target.value } })}
                />
              </div>
            </div>
          </section>

          {/* Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Responsibilities</h2>
                <p className="text-xs text-gray-400">Paste bullet points here. Each line will be a list item.</p>
              </div>
              <textarea
                rows={10}
                placeholder="• Responsible for...&#10;• Manage team...&#10;• Report to..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono"
                value={bulkResp}
                onChange={(e) => setBulkResp(e.target.value)}
              />
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Requirements</h2>
                <p className="text-xs text-gray-400">Paste bullet points here. Each line will be a list item.</p>
              </div>
              <textarea
                rows={10}
                placeholder="• Bachelor degree...&#10;• 3 years experience...&#10;• Strong skills in..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-mono"
                value={bulkReq}
                onChange={(e) => setBulkReq(e.target.value)}
              />
            </section>
          </div>

          {/* FAQs */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">FAQs</h2>
              <button 
                type="button"
                onClick={addFaq}
                className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              {(formData.content.faqs || []).map((faq, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3 relative">
                  <button 
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                      value={faq.question}
                      onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Answer</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center font-medium">
              {error}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
