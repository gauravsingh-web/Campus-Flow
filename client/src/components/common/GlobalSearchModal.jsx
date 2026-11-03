import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Bell,
  Calendar,
  AlertTriangle,
  DoorOpen,
  User,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut listener (Ctrl+K or Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const hasAnyResults =
    results &&
    (results.announcements.length > 0 ||
      results.events.length > 0 ||
      results.lostFound.length > 0 ||
      results.rooms.length > 0 ||
      results.people.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search size={20} className="text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campus notices, events, rooms, lost items..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
          {loading && <Loader2 size={18} className="animate-spin text-brand-600 mr-2" />}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!results && !loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all campus services.
            </div>
          )}

          {results && !hasAnyResults && !loading && (
            <div className="py-8 text-center text-sm text-slate-400">
              No results found for "<span className="text-slate-700 dark:text-slate-300 font-medium">{query}</span>".
            </div>
          )}

          {/* Announcements Results */}
          {results?.announcements?.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <Bell size={13} className="text-blue-500" />
                <span>Announcements ({results.announcements.length})</span>
              </span>
              <div className="space-y-1">
                {results.announcements.map((a) => (
                  <div
                    key={a._id}
                    onClick={() => handleNavigate('/announcements')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {a.title}
                      </h4>
                      <span className="text-xs text-slate-400 capitalize">{a.category} Notice</span>
                    </div>
                    {a.priority === 'Urgent' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Results */}
          {results?.events?.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <Calendar size={13} className="text-emerald-500" />
                <span>Events ({results.events.length})</span>
              </span>
              <div className="space-y-1">
                {results.events.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => handleNavigate('/events')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {e.title}
                      </h4>
                      <span className="text-xs text-slate-400">Venue: {e.venue}</span>
                    </div>
                    <span className="text-xs text-brand-600 font-medium">View Event</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms Results */}
          {results?.rooms?.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <DoorOpen size={13} className="text-purple-500" />
                <span>Classrooms & Labs ({results.rooms.length})</span>
              </span>
              <div className="space-y-1">
                {results.rooms.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => handleNavigate('/bookings')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {r.roomId} – {r.name}
                      </h4>
                      <span className="text-xs text-slate-400">{r.building} • {r.type}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                      Cap: {r.capacity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lost & Found Results */}
          {results?.lostFound?.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <AlertTriangle size={13} className="text-amber-500" />
                <span>Lost & Found ({results.lostFound.length})</span>
              </span>
              <div className="space-y-1">
                {results.lostFound.map((lf) => (
                  <div
                    key={lf._id}
                    onClick={() => handleNavigate('/lost-found')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {lf.title}
                      </h4>
                      <span className="text-xs text-slate-400">{lf.location} • Status: {lf.status}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lf.reportType === 'Lost' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {lf.reportType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People Directory */}
          {results?.people?.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 mb-2">
                <User size={13} className="text-blue-500" />
                <span>Campus People ({results.people.length})</span>
              </span>
              <div className="space-y-1">
                {results.people.map((p) => (
                  <div
                    key={p._id}
                    onClick={() => handleNavigate(p.role === 'student' ? '/students' : '/faculty')}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center uppercase">
                        {p.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {p.name}
                        </h4>
                        <span className="text-xs text-slate-400">{p.email}</span>
                      </div>
                    </div>
                    <span className="text-xs capitalize px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                      {p.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>CampusFlow Intelligent Search</span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border rounded font-mono">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
}
