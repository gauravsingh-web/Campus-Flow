import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DoorOpen,
  Bell,
  Search,
  BookOpen,
  QrCode,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        let endpoint = '/analytics/student';
        if (user.role === 'admin') endpoint = '/analytics/admin';
        else if (user.role === 'faculty') endpoint = '/analytics/faculty';

        const res = await api.get(endpoint);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user.role]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="text-sm text-slate-500">Loading campus intelligence dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-blue-700 text-white shadow-xl shadow-brand-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-200 uppercase tracking-wider mb-1">
            <span>Unified Smart Campus Portal</span>
            <span>•</span>
            <span className="capitalize">{user.role} workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-sm text-brand-100 max-w-xl mt-1">
            {user.role === 'admin'
              ? 'CampusFlow administration console is active. Monitor student enrollment, academic courses, classroom bookings, and university operations in real time.'
              : user.role === 'faculty'
              ? 'Review your assigned complaints, departmental notices, weekly lecture schedules, and verify hall bookings.'
              : 'Access your campus identity QR, weekly class timetable, check in to upcoming campus events, and manage campus requests.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/timetable"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium text-xs transition border border-white/20"
          >
            <Clock size={16} />
            <span>Class Timetable</span>
          </Link>
          <Link
            to="/complaints"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-brand-900 font-semibold text-xs shadow-md hover:bg-slate-100 transition"
          >
            <AlertCircle size={16} className="text-brand-700" />
            <span>{user.role === 'student' ? 'Submit Complaint' : 'Complaint Center'}</span>
          </Link>
        </div>
      </div>

      {/* ADMIN DASHBOARD VIEW */}
      {user.role === 'admin' && data?.stats && (
        <>
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Students</span>
                <GraduationCap size={20} className="text-brand-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.stats.totalStudents}
              </div>
              <div className="text-xs text-slate-500 mt-1">Enrolled university students</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Faculty</span>
                <Users size={20} className="text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.stats.totalFaculty}
              </div>
              <div className="text-xs text-slate-500 mt-1">Teaching & academic staff</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Courses & Papers</span>
                <BookOpen size={20} className="text-indigo-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.stats.totalSubjects || 142}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                Active UPC curriculum subjects
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Room Bookings</span>
                <DoorOpen size={20} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {data.stats.totalBookings}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                {data.stats.pendingBookings} awaiting approval
              </div>
            </div>
          </div>

          {/* Recharts Data Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Categories Chart */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Complaints by Category</span>
                <span className="text-xs font-normal text-slate-400">Campus Flow Analytics</span>
              </h3>
              <div className="h-64">
                {data.complaintsByCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.complaintsByCategory}>
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No complaints registered in system yet.
                  </div>
                )}
              </div>
            </div>

            {/* Event Participation Chart */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                <span>Event Turnout & Capacity</span>
                <span className="text-xs font-normal text-slate-400">Top Campus Events</span>
              </h3>
              <div className="h-64">
                {data.eventStats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.eventStats} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="title" type="category" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="registeredCount" name="Registered" fill="#10B981" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="capacity" name="Max Capacity" fill="#E2E8F0" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No campus events created yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* FACULTY DASHBOARD VIEW */}
      {user.role === 'faculty' && data?.stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Tickets</span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {data.stats.assignedTotal}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">Total student complaints routed to you</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Remediation</span>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {data.stats.assignedPending}
              </div>
              <span className="text-xs text-amber-600 font-medium mt-1 block">Awaiting inspection or update</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolved Complaints</span>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {data.stats.assignedResolved}
              </div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">Successfully resolved cases</span>
            </div>
          </div>

          {/* Assigned Complaint Action Items */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Complaints Requiring Your Action
            </h3>
            {data.myAssignedComplaints?.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.myAssignedComplaints.map((c) => (
                  <div key={c._id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-brand-600">{c.complaintId}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Location: {c.location} • Student: {c.student?.name}</p>
                    </div>
                    <Link
                      to="/complaints"
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 transition"
                    >
                      Update Status
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={24} />
                No pending student complaints currently assigned to you.
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT DASHBOARD VIEW */}
      {user.role === 'student' && data?.stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">My Lodged Complaints</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {data.stats.myComplaintsCount}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">Total filed tickets</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolved Complaints</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                {data.stats.myResolvedComplaints}
              </div>
              <span className="text-xs text-emerald-600 mt-0.5 block">Closed by campus staff</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Event Registrations</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 mt-1">
                {data.stats.myEventRegistrationsCount}
              </div>
              <span className="text-xs text-brand-600 mt-0.5 block">Active QR entry passes</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Room Bookings</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
                {data.stats.myBookingsCount}
              </div>
              <span className="text-xs text-blue-600 mt-0.5 block">Classrooms & labs</span>
            </div>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* My Active Complaints */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Complaint Status</h3>
                <Link to="/complaints" className="text-xs text-brand-600 hover:underline">
                  View all
                </Link>
              </div>

              {data.recentComplaints?.length > 0 ? (
                <div className="space-y-3">
                  {data.recentComplaints.map((c) => (
                    <div
                      key={c._id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-600">{c.complaintId}</span>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-xs">
                          {c.title}
                        </h4>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  You haven't filed any complaints yet. Need campus assistance?{' '}
                  <Link to="/complaints" className="text-brand-600 underline font-medium">
                    Submit one now
                  </Link>.
                </div>
              )}
            </div>

            {/* Upcoming Campus Events */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Featured Campus Events</h3>
                <Link to="/events" className="text-xs text-brand-600 hover:underline">
                  Browse events
                </Link>
              </div>

              {data.upcomingEvents?.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingEvents.map((evt) => (
                    <div
                      key={evt._id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{evt.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(evt.date).toLocaleDateString()} • {evt.venue}
                        </p>
                      </div>
                      <Link
                        to="/events"
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
                      >
                        RSVP
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No upcoming events scheduled right now.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
