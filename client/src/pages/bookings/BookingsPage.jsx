import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  DoorOpen,
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Users,
  Loader2,
  X,
} from 'lucide-react';
import api from '../../services/api';

export default function BookingsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'rooms'

  // Booking Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Room Modal (Admin only)
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({
    roomId: '',
    name: '',
    type: 'Classroom',
    building: '',
    capacity: 60,
    facilities: 'Projector, Whiteboard, Wi-Fi',
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [bookingForm, setBookingForm] = useState({
    room: '',
    purpose: '',
    date: tomorrow.toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/bookings'),
      ]);

      if (roomsRes.data.success) {
        setRooms(roomsRes.data.rooms);
        if (roomsRes.data.rooms.length > 0 && !bookingForm.room) {
          setBookingForm((prev) => ({ ...prev, room: roomsRes.data.rooms[0]._id }));
        }
      }

      if (bookingsRes.data.success) {
        setBookings(bookingsRes.data.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setSubmitting(true);

    try {
      const res = await api.post('/bookings', bookingForm);
      if (res.data.success) {
        alert(res.data.message);
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message || 'Conflict detected or booking submission failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      const res = await api.patch(`/bookings/${bookingId}/status`, { status });
      if (res.data.success) {
        alert(`Booking ${status.toLowerCase()} successfully.`);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this room reservation?')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      fetchData();
    } catch (err) {
      alert('Cancellation failed');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/rooms', {
        ...roomForm,
        facilities: roomForm.facilities.split(',').map((f) => f.trim()),
      });
      if (res.data.success) {
        setIsAddRoomOpen(false);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create room');
    }
  };

  const canApprove = ['admin', 'faculty'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Classroom & Laboratory Booking Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reserve smart seminar halls, computing labs, and lecture theatres with real-time overlap conflict prevention.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAddRoomOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition"
            >
              Add Room
            </button>
          )}

          <button
            onClick={() => {
              setBookingError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition"
          >
            <Plus size={16} />
            <span>Book Room / Lab</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'bookings'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Reservations Schedule ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'rooms'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Campus Room Directory ({rooms.length})
        </button>
      </div>

      {/* Tab 1: Bookings List */}
      {activeTab === 'bookings' && (
        <>
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-2">
              <Loader2 size={30} className="animate-spin text-brand-600" />
              <span className="text-xs text-slate-400">Loading reservation schedules...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <DoorOpen className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={36} />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Reservations Found</h3>
              <p className="text-xs text-slate-400 mt-1">There are no room bookings matching your view.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((bkg) => {
                const isOwner = bkg.requester?._id === user?._id;

                return (
                  <div
                    key={bkg._id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md">
                          {bkg.room?.roomId || 'ROOM'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {bkg.room?.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            bkg.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : bkg.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {bkg.status}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        "{bkg.purpose}"
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                        <span className="flex items-center space-x-1">
                          <Calendar size={13} />
                          <span>{new Date(bkg.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={13} />
                          <span>{bkg.startTime} – {bkg.endTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users size={13} />
                          <span>Booked by: {bkg.requester?.name} ({bkg.requester?.role})</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                      {canApprove && bkg.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(bkg._id, 'Approved')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(bkg._id, 'Rejected')}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {(isOwner || user?.role === 'admin') && bkg.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelBooking(bkg._id)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-medium transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab 2: Rooms Directory */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                  {room.roomId}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {room.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{room.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{room.building} • {room.type}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Capacity: <strong>{room.capacity} seats</strong></span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {room.facilities?.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md"
                  >
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  setBookingForm({ ...bookingForm, room: room._id });
                  setIsModalOpen(true);
                }}
                className="w-full mt-2 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs font-bold transition"
              >
                Reserve This Space
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Book Room Modal with Concurrency Conflict Display */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Reserve Campus Facility</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {bookingError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start space-x-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Select Room / Laboratory
                </label>
                <select
                  required
                  value={bookingForm.room}
                  onChange={(e) => setBookingForm({ ...bookingForm, room: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roomId} – {r.name} ({r.type}, Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Purpose / Agenda
                </label>
                <input
                  type="text"
                  required
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="e.g. ACM Club Algorithm Workshop"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Reservation Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Start Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    End Time (24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Validating Conflicts...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal (Admin Only) */}
      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">Register New Campus Facility</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Room ID</label>
                  <input
                    type="text"
                    required
                    value={roomForm.roomId}
                    onChange={(e) => setRoomForm({ ...roomForm, roomId: e.target.value })}
                    placeholder="LH-201"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  placeholder="Ada Lovelace Lecture Theatre"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Building</label>
                  <input
                    type="text"
                    required
                    value={roomForm.building}
                    onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                    placeholder="Block C"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                  <select
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Seminar Hall">Seminar Hall</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Conference Room">Conference Room</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Facilities (Comma-separated)</label>
                <input
                  type="text"
                  value={roomForm.facilities}
                  onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
