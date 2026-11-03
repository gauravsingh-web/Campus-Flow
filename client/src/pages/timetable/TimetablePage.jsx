import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Clock,
  Calendar,
  Filter,
  GraduationCap,
  DoorOpen,
  User,
  BookOpen,
  Loader2,
  CalendarDays,
  Layers,
} from 'lucide-react';
import api from '../../services/api';

const TIME_SLOTS = [
  '8-9 AM',
  '9-10 AM',
  '10-11 AM',
  '11 AM-12 PM',
  '12-1 PM',
  '1-2 PM',
  '2-3 PM',
  '3-4 PM',
  '4-5 PM',
  '5-6 PM',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetablePage() {
  const { user } = useAuth();
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('2nd Year');
  const [section, setSection] = useState('A');
  const [timetable, setTimetable] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    departments: ['CSE', 'ECE', 'EE'],
    years: ['2nd Year'],
    sections: ['A', 'B'],
  });
  const [loading, setLoading] = useState(true);

  // If student, check if they want to view their default class
  const isStudent = user?.role === 'student';

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/timetable?department=${department}&year=${encodeURIComponent(year)}&section=${section}`
      );
      if (res.data.success) {
        setTimetable(res.data.timetable);
        if (res.data.filterOptions) {
          setFilterOptions(res.data.filterOptions);
        }
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [department, year, section]);

  // Map slots into day & timeSlot lookup
  const getSlotData = (day, timeSlot) => {
    return timetable.filter((t) => t.day === day && t.timeSlot === timeSlot);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1">
            <span>Academic Session: 2026–27</span>
            <span>•</span>
            <span>Effective 17 September 2026</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Official Class Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Weekly scheduled lectures, tutorials, and practical laboratory sessions across academic departments.
          </p>
        </div>

        {/* Live Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center space-x-1.5 px-2 text-xs font-bold text-slate-500">
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            {filterOptions.departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            {filterOptions.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            {filterOptions.sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timetable Sub-header Information Pill */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border border-blue-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-slate-900 dark:text-white">
            Displaying: {year} {department}-{section}
          </span>
          <span>•</span>
          <span>Faculty of Technology, University of Delhi</span>
        </div>
        <div className="hidden sm:flex items-center space-x-3 text-[11px] font-semibold">
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Lecture</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Practical (Lab)</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Tutorial</span>
          </span>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          <p className="text-xs text-slate-400">Loading schedule matrix...</p>
        </div>
      ) : timetable.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CalendarDays className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={40} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Timetable Configured</h3>
          <p className="text-xs text-slate-400 mt-1">
            No class schedules recorded for {department}-{section} in {year}.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-bold uppercase tracking-wider text-slate-400 w-28 sticky left-0 bg-slate-50 dark:bg-slate-800/80 z-10 border-r border-slate-200 dark:border-slate-800">
                    Day / Time
                  </th>
                  {TIME_SLOTS.map((slot) => (
                    <th
                      key={slot}
                      className="p-3 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center min-w-[120px] border-r border-slate-200 dark:border-slate-800 last:border-none"
                    >
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {DAYS.map((day) => (
                  <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-3 font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10">
                      {day}
                    </td>
                    {TIME_SLOTS.map((slot) => {
                      const slotsInCell = getSlotData(day, slot);
                      return (
                        <td
                          key={slot}
                          className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-none align-top"
                        >
                          {slotsInCell.length > 0 ? (
                            <div className="space-y-1.5">
                              {slotsInCell.map((item, idx) => {
                                const isLab =
                                  item.type === 'Practical' ||
                                  item.subjectCode.includes('(P)') ||
                                  item.subjectName.toLowerCase().includes('lab');
                                const isTutorial = item.type === 'Tutorial' || item.subjectCode.includes('(T)');

                                return (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-xl border text-[11px] leading-tight ${
                                      isLab
                                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200'
                                        : isTutorial
                                        ? 'bg-purple-50/70 border-purple-200 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800/60 dark:text-purple-200'
                                        : 'bg-indigo-50/70 border-indigo-200 text-indigo-900 dark:bg-indigo-950/40 dark:border-indigo-800/60 dark:text-indigo-200'
                                    }`}
                                  >
                                    <div className="font-bold flex items-center justify-between">
                                      <span>{item.subjectCode}</span>
                                      {item.subGroup && item.subGroup !== 'All' && (
                                        <span className="text-[9px] px-1 rounded bg-black/10 dark:bg-white/10 font-mono font-bold">
                                          {item.subGroup}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] truncate mt-0.5 opacity-90 font-medium">
                                      {item.subjectName}
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-[10px] font-semibold opacity-80 pt-1 border-t border-black/5 dark:border-white/5">
                                      <span className="font-bold" title={item.facultyName}>
                                        [{item.facultyAcronym}]
                                      </span>
                                      <span className="font-mono">{item.roomNumber}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="h-14 flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs font-mono">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Faculty Legend & Committee Reference */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
          <User size={14} />
          <span>Faculty Acronym Key & Course Teachers (FoT Timetable Committee)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="font-bold text-brand-600 font-mono">[JJ]</span> Dr. Juhi Jain
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="font-bold text-brand-600 font-mono">[GB]</span> Dr. Geetanjali Bhola
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="font-bold text-brand-600 font-mono">[BR]</span> Dr. Bhawna Rawat
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="font-bold text-brand-600 font-mono">[AZK]</span> Dr. Ahmad Zaman Khan
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="font-bold text-brand-600 font-mono">[AP]</span> Dr. Ashutosh Pandey
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="font-bold text-brand-600 font-mono">[UDS]</span> Dr. Udita Sharma
          </div>
        </div>
      </div>
    </div>
  );
}
