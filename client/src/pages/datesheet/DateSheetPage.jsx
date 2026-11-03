import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText,
  Upload,
  Download,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Loader2,
  Eye,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import api from '../../services/api';

export default function DateSheetPage() {
  const { user } = useAuth();
  const [dateSheets, setDateSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Form states
  const [title, setTitle] = useState('End-Term Theory Examination Date Sheet - December 2026');
  const [semester, setSemester] = useState('Odd Semester (Dec 2026)');
  const [department, setDepartment] = useState('All');
  const [notes, setNotes] = useState('Official University of Delhi End-Term Examination Date Sheet');
  const [file, setFile] = useState(null);

  const isStaff = ['admin', 'faculty'].includes(user?.role);

  const fetchDateSheets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/datesheets');
      if (res.data.success) {
        setDateSheets(res.data.dateSheets);
      }
    } catch (err) {
      console.error('Failed to load examination date sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDateSheets();
  }, []);

  const handlePublishDefault = async () => {
    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('title', 'Official End-Term Theory Date Sheet - December 2026');
      formData.append('semester', 'Odd Semester (Dec 2026)');
      formData.append('department', 'All (CSE, ECE, EE)');
      formData.append(
        'notes',
        'Official University of Delhi Examination Branch Notification for December 2026 End-Term Examinations'
      );
      formData.append('status', 'published');

      const res = await api.post('/datesheets', formData);
      if (res.data.success) {
        await fetchDateSheets();
        setUploadModalOpen(false);
      }
    } catch (err) {
      alert('Failed to publish date sheet: ' + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  const handleCustomUpload = async (e) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('semester', semester);
      formData.append('department', department);
      formData.append('notes', notes);
      formData.append('status', 'published');
      if (file) {
        formData.append('file', file);
      }

      const res = await api.post('/datesheets', formData);
      if (res.data.success) {
        await fetchDateSheets();
        setUploadModalOpen(false);
      }
    } catch (err) {
      alert('Failed to upload date sheet: ' + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this date sheet?')) return;
    try {
      const res = await api.delete(`/datesheets/${id}`);
      if (res.data.success) {
        setDateSheets((prev) => prev.filter((d) => d._id !== id));
      }
    } catch (err) {
      alert('Failed to delete date sheet');
    }
  };

  const publishedSheets = dateSheets.filter((d) => d.status === 'published');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <span>Academic Affairs & Examination Branch</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            End-Term Examination Date Sheets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official University examination schedules, session timetables, and notification circulars.
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition cursor-pointer"
          >
            <Upload size={16} />
            <span>Upload Official Date Sheet</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-xs text-slate-400">Loading examination date sheet records...</p>
        </div>
      ) : publishedSheets.length === 0 ? (
        /* Empty State Message - Explicitly required by prompt */
        <div className="p-12 sm:p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Official end-term date sheet has not been published yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
            The University examination branch has not released the verified schedule for the upcoming semester.
            Students will receive an immediate notification once the authenticated date sheet is uploaded.
          </p>

          {isStaff && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Faculty & Administrator Action
              </span>
              <button
                onClick={handlePublishDefault}
                disabled={publishing}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-md shadow-brand-500/25 cursor-pointer disabled:opacity-50"
              >
                {publishing ? (
                  <Loader2 size={16} className="animate-spin mr-1" />
                ) : (
                  <ShieldCheck size={16} className="mr-1" />
                )}
                <span>Publish Official December 2026 Date Sheet</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Published Date Sheets List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedSheets.map((ds) => (
            <div
              key={ds._id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Official Verified Date Sheet
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{ds.fileSize}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{ds.title}</h3>
                <p className="text-xs text-slate-500 mb-4">{ds.notes}</p>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Academic Session:</span>
                    <span className="font-semibold">{ds.academicSession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Semester:</span>
                    <span className="font-semibold">{ds.semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Departments:</span>
                    <span className="font-semibold">{ds.department}</span>
                  </div>
                  {ds.publishedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Published Date:</span>
                      <span className="font-semibold">{new Date(ds.publishedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                <a
                  href={`http://localhost:5000${ds.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-xs font-semibold transition"
                >
                  <Eye size={15} />
                  <span>View PDF</span>
                </a>

                <a
                  href={`http://localhost:5000${ds.fileUrl}`}
                  download
                  className="flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                  title="Download Date Sheet"
                >
                  <Download size={16} />
                </a>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(ds._id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                    title="Remove Date Sheet"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal for Admin / Faculty */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Upload Official Examination Date Sheet
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Publish university end-term examination datesheet for student and faculty access.
            </p>

            <form onSubmit={handleCustomUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semester & Session</label>
                <input
                  type="text"
                  required
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Instructions</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Upload PDF Document (Optional - default source file used if blank)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish Date Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
