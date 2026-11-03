import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

export default function StudentDirectoryPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/students?page=${page}&limit=12&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedDept) url += `department=${selectedDept}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setStudents(res.data.students);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, selectedDept]);

  useEffect(() => {
    api.get('/departments').then((res) => {
      if (res.data.success) setDepartments(res.data.departments);
    });
  }, []);

  const handleToggleStatus = async (studentId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.patch(`/students/${studentId}/status`, { status: nextStatus });
      if (res.data.success) {
        setStudents((prev) =>
          prev.map((s) => (s._id === studentId ? { ...s, status: nextStatus } : s))
        );
      }
    } catch (err) {
      alert('Failed to update student status');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Student Academic Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Official University student registry with Roll Numbers, Enrolment Numbers, Departmental affiliations, and batch records.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search students by name, roll number, or enrolment number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={30} className="animate-spin text-brand-600" />
          <span className="text-xs text-slate-400">Loading student directory...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <GraduationCap className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={36} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Students Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no student profiles matching your search query.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Roll Number</th>
                  <th className="px-4 py-3.5">Enrolment Number</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Batch / Sem</th>
                  <th className="px-4 py-3.5">Status</th>
                  {isAdmin && <th className="px-4 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center uppercase shrink-0 text-xs">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {student.studentProfile?.studentId || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {student.studentProfile?.enrolmentNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {student.department?.code || student.department?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                      Sem {student.studentProfile?.semester || 1} • {student.studentProfile?.batch || '2025-2029'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(student._id, student.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                            student.status === 'active'
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {student.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {pagination.pages || 1} ({pagination.total} registered students)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
