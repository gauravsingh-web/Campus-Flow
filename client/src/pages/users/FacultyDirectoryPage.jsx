import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  Search,
  Plus,
  Mail,
  MapPin,
  Phone,
  Briefcase,
  Loader2,
  X,
  CheckCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function FacultyDirectoryPage() {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    employeeId: '',
    designation: 'Assistant Professor',
    specialization: '',
    officeRoom: '',
    phone: '',
  });

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      let url = '/faculty?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedDept) url += `department=${selectedDept}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setFaculty(res.data.faculty);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [search, selectedDept]);

  useEffect(() => {
    api.get('/departments').then((res) => {
      if (res.data.success) {
        setDepartments(res.data.departments);
        if (res.data.departments.length > 0 && !form.department) {
          setForm((prev) => ({ ...prev, department: res.data.departments[0]._id }));
        }
      }
    });
  }, []);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/faculty', {
        ...form,
        specialization: form.specialization.split(',').map((s) => s.trim()),
      });

      if (res.data.success) {
        setIsAddModalOpen(false);
        setForm({
          name: '',
          email: '',
          password: '',
          department: departments[0]?._id || '',
          employeeId: '',
          designation: 'Assistant Professor',
          specialization: '',
          officeRoom: '',
          phone: '',
        });
        fetchFaculty();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create faculty account');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Faculty & Academic Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse university department chairs, professors, and research mentors across all faculties.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Faculty Account</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search faculty by name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
          ))}
        </select>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={30} className="animate-spin text-brand-600" />
          <span className="text-xs text-slate-400">Loading faculty profiles...</span>
        </div>
      ) : faculty.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={36} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Faculty Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no faculty members matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculty.map((member) => (
            <div
              key={member._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-600 text-white font-black text-lg flex items-center justify-center uppercase shadow-md">
                    {member.name[0]}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {member.facultyProfile?.employeeId || 'FACULTY'}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    {member.facultyProfile?.designation || 'Faculty Member'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {member.department?.name || 'Department'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Mail size={13} className="text-slate-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.facultyProfile?.officeRoom && (
                    <div className="flex items-center space-x-2">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{member.facultyProfile.officeRoom}</span>
                    </div>
                  )}
                </div>

                {member.facultyProfile?.specialization?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                    {member.facultyProfile.specialization.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 rounded-md"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Faculty Modal (Admin only) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Faculty Account</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Prof. Jane Doe"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    placeholder="EMP-CSE-105"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane.doe@campusflow.edu"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  >
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Associate Professor"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Office Room</label>
                  <input
                    type="text"
                    value={form.officeRoom}
                    onChange={(e) => setForm({ ...form, officeRoom: e.target.value })}
                    placeholder="Block B, Room 302"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Specialization (Comma-separated)</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="Robotics, AI, Data"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
