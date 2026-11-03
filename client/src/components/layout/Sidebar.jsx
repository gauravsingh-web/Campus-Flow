import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  AlertCircle,
  Search,
  Calendar,
  DoorOpen,
  QrCode,
  Users,
  GraduationCap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/timetable',
      label: 'Class Timetable',
      icon: Clock,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/subjects',
      label: 'Course Catalog',
      icon: BookOpen,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/datesheets',
      label: 'Exam Date Sheets',
      icon: FileText,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/announcements',
      label: 'Announcements',
      icon: Bell,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/complaints',
      label: 'Complaints',
      icon: AlertCircle,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/lost-found',
      label: 'Lost & Found',
      icon: Search,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/events',
      label: 'Campus Events',
      icon: Calendar,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/bookings',
      label: 'Room Bookings',
      icon: DoorOpen,
      roles: ['student', 'faculty', 'admin'],
    },
    {
      to: '/identity',
      label: 'Campus ID Card',
      icon: QrCode,
      roles: ['student', 'faculty'],
    },
    {
      to: '/students',
      label: 'Student Directory',
      icon: GraduationCap,
      roles: ['faculty', 'admin'],
    },
    {
      to: '/faculty',
      label: 'Faculty Directory',
      icon: Users,
      roles: ['admin', 'faculty'],
    },
    {
      to: '/verify-gate',
      label: 'QR Scanner Gate',
      icon: ShieldCheck,
      roles: ['faculty', 'admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              CF
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-700 to-blue-600 dark:from-brand-400 dark:to-blue-400 bg-clip-text text-transparent">
                  CampusFlow
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Smart University
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon
                  size={20}
                  className="shrink-0 transition-transform group-hover:scale-110"
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Mini Card at Bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
          <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center uppercase text-sm shrink-0">
            {user?.name ? user.name[0] : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] capitalize text-slate-500 dark:text-slate-400">
                  {user?.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
