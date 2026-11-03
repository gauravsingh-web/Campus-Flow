import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  AlertCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  MapPin,
  Paperclip,
  ChevronRight,
  Loader2,
  X,
  Send,
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  'Infrastructure',
  'Classroom',
  'Laboratory',
  'Electricity',
  'Internet/Wi-Fi',
  'Cleanliness',
  'Other',
];

const STATUSES = [
  'All',
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [facultyList, setFacultyList] = useState([]);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'Classroom',
    priority: 'Medium',
    location: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Status Update & Assign State
  const [statusForm, setStatusForm] = useState({
    status: '',
    resolutionNotes: '',
    assignedTo: '',
  });

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let url = '/complaints?';
      if (selectedStatus !== 'All') url += `status=${selectedStatus}&`;
      if (selectedCategory !== 'All') url += `category=${selectedCategory}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [selectedStatus, selectedCategory, search]);

  useEffect(() => {
    if (['admin', 'faculty'].includes(user?.role)) {
      api.get('/faculty').then((res) => {
        if (res.data.success) setFacultyList(res.data.faculty);
      });
    }
  }, [user?.role]);

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', createForm.title);
      formData.append('description', createForm.description);
      formData.append('category', createForm.category);
      formData.append('priority', createForm.priority);
      formData.append('location', createForm.location);
      if (attachment) formData.append('attachment', attachment);

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          title: '',
          description: '',
          category: 'Classroom',
          priority: 'Medium',
          location: '',
        });
        setAttachment(null);
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to file grievance');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (complaintId) => {
    try {
      const res = await api.patch(`/complaints/${complaintId}/status`, {
        status: statusForm.status,
        resolutionNotes: statusForm.resolutionNotes,
        assignedTo: statusForm.assignedTo || undefined,
      });

      if (res.data.success) {
        setSelectedComplaint(res.data.complaint);
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignFaculty = async (complaintId) => {
    if (!statusForm.assignedTo) return;
    try {
      const res = await api.patch(`/complaints/${complaintId}/assign`, {
        assignedTo: statusForm.assignedTo,
        notes: statusForm.resolutionNotes,
      });

      if (res.data.success) {
        setSelectedComplaint(res.data.complaint);
        fetchComplaints();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign complaint');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300';
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Grievance & Complaint Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lodge campus maintenance tickets, classroom issues, internet outages, and monitor remediation progress.
          </p>
        </div>

        {user?.role === 'student' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Lodge New Grievance</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Complaint ID, title, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === st
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Complaints List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={30} className="animate-spin text-brand-600" />
          <span className="text-xs text-slate-400">Loading grievance records...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={36} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Complaints Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no grievances matching your selected criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((item) => (
            <div
              key={item._id}
              onClick={() => {
                setSelectedComplaint(item);
                setStatusForm({
                  status: item.status,
                  resolutionNotes: item.resolutionNotes || '',
                  assignedTo: item.assignedTo?._id || '',
                });
              }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md">
                    {item.complaintId}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="text-xs text-slate-400">Category: {item.category}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${item.priority === 'High' || item.priority === 'Emergency' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {item.priority} Priority
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>

                <div className="flex items-center space-x-4 text-xs text-slate-400 mt-3">
                  <span className="flex items-center space-x-1">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{item.location}</span>
                  </span>
                  {item.assignedTo && (
                    <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
                      <UserCheck size={13} className="text-blue-500" />
                      <span>Assigned to: {item.assignedTo.name}</span>
                    </span>
                  )}
                  {item.attachmentUrl && (
                    <span className="flex items-center space-x-1 text-brand-600">
                      <Paperclip size={13} />
                      <span>Has photo</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-auto text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition shrink-0">
                <span>View Details & Timeline</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail / Audit Trail Drawer Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">{selectedComplaint.complaintId}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedComplaint.title}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Description</span>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl whitespace-pre-line">
                  {selectedComplaint.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 font-semibold">Campus Location:</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{selectedComplaint.location}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <span className="text-slate-400 font-semibold">Lodged By:</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">{selectedComplaint.student?.name} ({selectedComplaint.student?.email})</p>
                </div>
              </div>

              {selectedComplaint.attachmentUrl && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attached Evidence</span>
                  <div className="mt-1">
                    <img
                      src={selectedComplaint.attachmentUrl}
                      alt="Complaint proof"
                      className="max-h-48 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Status Update Section (Admin / Faculty) */}
              {['admin', 'faculty'].includes(user?.role) && (
                <div className="p-4 bg-brand-50/60 dark:bg-brand-950/30 rounded-2xl border border-brand-200 dark:border-brand-900/60 space-y-3">
                  <span className="text-xs font-bold text-brand-900 dark:text-brand-300">Administrative Action</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Change Status
                      </label>
                      <select
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700"
                      >
                        {STATUSES.filter((s) => s !== 'All').map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {user?.role === 'admin' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Assign Faculty / Maintenance Lead
                        </label>
                        <select
                          value={statusForm.assignedTo}
                          onChange={(e) => setStatusForm({ ...statusForm, assignedTo: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700"
                        >
                          <option value="">Unassigned</option>
                          {facultyList.map((f) => (
                            <option key={f._id} value={f._id}>{f.name} ({f.department?.code || 'Staff'})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Resolution Notes / Inspection Comments
                    </label>
                    <textarea
                      rows={2}
                      value={statusForm.resolutionNotes}
                      onChange={(e) => setStatusForm({ ...statusForm, resolutionNotes: e.target.value })}
                      placeholder="e.g. Technician dispatched, parts replaced, or inspection verified."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    {user?.role === 'admin' && statusForm.assignedTo && statusForm.assignedTo !== selectedComplaint.assignedTo?._id && (
                      <button
                        type="button"
                        onClick={() => handleAssignFaculty(selectedComplaint._id)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Assign Member
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedComplaint._id)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-brand-600 text-white hover:bg-brand-700"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              )}

              {/* Audit History Stepper */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Timeline & Audit History
                </span>
                <div className="space-y-3 relative pl-4 border-l-2 border-brand-200 dark:border-slate-700">
                  {selectedComplaint.history?.map((h, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 dark:text-white">{h.status}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{h.notes || 'Status changed'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lodge New Grievance Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Lodge Campus Grievance</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Projector not powering on in Seminar Hall"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Exact Campus Location
                </label>
                <input
                  type="text"
                  required
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="e.g. Block A, 2nd Floor, Room 204"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Detailed Grievance Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Explain the problem clearly to assist technicians..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Photo Evidence (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAttachment(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Grievance...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
