import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  Award,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [paperType, setPaperType] = useState('All');
  const [semester, setSemester] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      let url = `/subjects?page=${page}&limit=15&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (department !== 'All') url += `department=${encodeURIComponent(department)}&`;
      if (paperType !== 'All') url += `paperType=${encodeURIComponent(paperType)}&`;
      if (semester !== 'All') url += `semester=${encodeURIComponent(semester)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setSubjects(res.data.subjects);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [page, search, department, paperType, semester]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
          <span>Official UPC Curriculum Directory</span>
          <span>•</span>
          <span>Faculty of Technology, University of Delhi</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Academic Courses & UPC Paper Catalog
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete University syllabus records with Unique Paper Codes (UPC), L-T-P hour structure, and assigned credit weights.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by subject name or 10-digit UPC code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EE">EE</option>
            <option value="General">General / Foundation</option>
          </select>

          <select
            value={paperType}
            onChange={(e) => {
              setPaperType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Paper Types</option>
            <option value="DSC">DSC (Discipline Specific)</option>
            <option value="DSE">DSE (Discipline Elective)</option>
            <option value="GE">GE (Generic Elective)</option>
            <option value="VAC">VAC (Value Addition)</option>
            <option value="AEC">AEC (Ability Enhancement)</option>
            <option value="SEC">SEC (Skill Enhancement)</option>
          </select>

          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="All">All Semesters</option>
            <option value="I">Semester I</option>
            <option value="II">Semester II</option>
            <option value="III">Semester III</option>
            <option value="IV">Semester IV</option>
            <option value="V">Semester V</option>
            <option value="VI">Semester VI</option>
            <option value="VII">Semester VII</option>
            <option value="VIII">Semester VIII</option>
          </select>
        </div>
      </div>

      {/* Courses List Table */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-xs text-slate-400">Loading course syllabus records...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <BookOpen className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={36} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Courses Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no courses matching your query.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">UPC Code</th>
                  <th className="px-4 py-3.5">Course / Paper Name</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5 text-center">Semester</th>
                  <th className="px-4 py-3.5 text-center">L - T - P</th>
                  <th className="px-4 py-3.5 text-center">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subjects.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {s.upcCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {s.department}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {s.paperType}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {s.semester}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-600 dark:text-slate-300 font-semibold">
                      {s.lectureHours} - {s.tutorialHours} - {s.practicalHours}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {s.totalCredits}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {pagination.pages || 1} ({pagination.total} registered courses)
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
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
