import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  QrCode,
  X,
  Ticket,
  Loader2,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';

const EVENT_CATEGORIES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Hackathon',
];

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ticketModalData, setTicketModalData] = useState(null);
  const [attendeesModalData, setAttendeesModalData] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Technical',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '04:00 PM',
    venue: '',
    registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    capacity: 100,
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = '/events?';
      if (selectedCategory !== 'All') url += `category=${selectedCategory}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, search]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) => formData.append(k, form[k]));
      if (bannerFile) formData.append('banner', bannerFile);

      const res = await api.post('/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setIsCreateModalOpen(false);
        fetchEvents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      if (res.data.success) {
        setTicketModalData({
          qrDataUrl: res.data.qrTicketDataUrl,
          ticketToken: res.data.registration.ticketToken,
          event: events.find((e) => e._id === eventId),
        });
        fetchEvents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    try {
      const res = await api.delete(`/events/${eventId}/register`);
      if (res.data.success) {
        fetchEvents();
      }
    } catch (err) {
      alert('Cancellation failed');
    }
  };

  const handleViewTicket = async (event) => {
    try {
      const res = await api.get(`/events/${event._id}`);
      if (res.data.success && res.data.qrTicketDataUrl) {
        setTicketModalData({
          qrDataUrl: res.data.qrTicketDataUrl,
          ticketToken: res.data.registration.ticketToken,
          event,
        });
      }
    } catch (err) {
      alert('Could not fetch ticket pass');
    }
  };

  const handleViewAttendees = async (event) => {
    try {
      const res = await api.get(`/events/${event._id}/attendees`);
      if (res.data.success) {
        setAttendeesModalData({ event, attendees: res.data.attendees });
      }
    } catch (err) {
      alert('Could not load attendees roster');
    }
  };

  const canCreate = ['admin', 'faculty'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Campus Events & Symposia
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover university seminars, technical hackathons, cultural festivals, and generate verifiable QR entry passes.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Campus Event</span>
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
            placeholder="Search events by title or venue..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={30} className="animate-spin text-brand-600" />
          <span className="text-xs text-slate-400">Loading scheduled events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Calendar className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={36} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Events Scheduled</h3>
          <p className="text-xs text-slate-400 mt-1">There are no campus events matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const isFull = evt.registeredCount >= evt.capacity;
            const percentage = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));

            return (
              <div
                key={evt._id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700 transition"
              >
                <div>
                  {evt.bannerUrl ? (
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-tr from-brand-700 via-indigo-700 to-blue-700 flex items-center justify-center text-white font-black text-xl p-4 text-center">
                      {evt.title}
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {evt.category}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {evt.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Calendar size={14} className="text-brand-600" />
                        <span>{new Date(evt.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-brand-600" />
                        <span>{evt.startTime} – {evt.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-brand-600" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>Capacity: {evt.registeredCount} / {evt.capacity}</span>
                        <span>{percentage}% full</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isFull ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {canCreate && (
                    <button
                      onClick={() => handleViewAttendees(evt)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition"
                    >
                      Roster ({evt.registeredCount})
                    </button>
                  )}

                  {evt.isRegistered ? (
                    <div className="flex items-center space-x-2 flex-1 justify-end">
                      <button
                        onClick={() => handleViewTicket(evt)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        <Ticket size={14} />
                        <span>View Pass</span>
                      </button>
                      <button
                        onClick={() => handleCancelRegistration(evt._id)}
                        className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-medium"
                        title="Cancel RSVP"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isFull}
                      onClick={() => handleRegister(evt._id)}
                      className={`flex-1 flex items-center justify-center space-x-1 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                        isFull
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
                      }`}
                    >
                      <Ticket size={14} />
                      <span>{isFull ? 'Event Full' : 'Register (Get Pass)'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Pass QR Modal */}
      {ticketModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Event Entry Pass Confirmed
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Present this verified ticket QR code at the event gate entrance.
            </p>

            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <img
                src={ticketModalData.qrDataUrl}
                alt="Ticket QR Code"
                className="w-48 h-48 rounded-xl shadow-xs"
              />
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-3">
                {ticketModalData.ticketToken}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 font-medium">
                Pass Holder: {user?.name}
              </span>
            </div>

            <div className="mt-4 text-xs text-slate-500 font-medium text-left bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
              <p className="font-bold text-slate-800 dark:text-slate-200">{ticketModalData.event?.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ticketModalData.event?.venue} • {ticketModalData.event?.startTime}
              </p>
            </div>

            <button
              onClick={() => setTicketModalData(null)}
              className="w-full mt-4 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Attendee Roster Modal */}
      {attendeesModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Attendee Roster</h3>
                <span className="text-xs text-slate-400">{attendeesModalData.event.title}</span>
              </div>
              <button
                onClick={() => setAttendeesModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {attendeesModalData.attendees.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No registrations yet.</p>
              ) : (
                attendeesModalData.attendees.map((a) => (
                  <div
                    key={a._id}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{a.user?.name}</p>
                      <p className="text-slate-400">{a.user?.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.attended ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {a.attended ? 'Attended' : 'Registered'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create Campus Event</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AI & Quantum Computing Summit 2026"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Keynote speakers, workshop agenda, eligibility..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    {EVENT_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    placeholder="04:00 PM"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Campus Venue
                  </label>
                  <input
                    type="text"
                    required
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="Auditorium Hall A"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Registration Deadline Date
                </label>
                <input
                  type="date"
                  required
                  value={form.registrationDeadline}
                  onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
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
                  {submitting ? 'Creating Event...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
