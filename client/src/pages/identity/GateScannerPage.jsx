import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Ticket,
  Calendar,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

export default function GateScannerPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('identity'); // 'identity' or 'event'
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    if (mode === 'event') {
      api.get('/events').then((res) => {
        if (res.data.success && res.data.events.length > 0) {
          setEvents(res.data.events);
          setSelectedEventId(res.data.events[0]._id);
        }
      });
    }
  }, [mode]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      if (mode === 'identity') {
        const res = await api.post('/qr/verify-identity', { token: tokenInput.trim() });
        setResult({
          success: true,
          type: 'identity',
          message: res.data.message,
          data: res.data.identity,
        });
      } else {
        const res = await api.post(`/events/${selectedEventId}/verify-attendance`, {
          ticketToken: tokenInput.trim(),
        });
        setResult({
          success: true,
          type: 'event',
          message: res.data.message,
          data: res.data.attendee,
          registration: res.data.registration,
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || 'Verification failed. Invalid token.',
        alreadyAttended: err.response?.data?.alreadyAttended,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center mb-2">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Campus Gate & Check-in Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Scan or input identity tokens to authenticate campus entry passes and event attendance in real time.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl grid grid-cols-2 gap-1 text-xs font-bold">
        <button
          onClick={() => {
            setMode('identity');
            setResult(null);
            setTokenInput('');
          }}
          className={`py-2 rounded-xl transition ${
            mode === 'identity'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Campus ID Badge Gate
        </button>
        <button
          onClick={() => {
            setMode('event');
            setResult(null);
            setTokenInput('');
          }}
          className={`py-2 rounded-xl transition ${
            mode === 'event'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Event Ticket Attendance
        </button>
      </div>

      {/* Verification Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        {mode === 'event' && (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Select Event for Check-in
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border"
            >
              {events.map((e) => (
                <option key={e._id} value={e._id}>{e.title} ({e.venue})</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              {mode === 'identity' ? 'Scan or Enter Campus ID Token' : 'Scan or Enter Event Ticket Token'}
            </label>
            <div className="relative">
              <QrCode size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={mode === 'identity' ? 'e.g. CF-ID-7B92A...' : 'e.g. EVT-TKT-SUMMIT-001'}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition disabled:opacity-50"
          >
            {loading ? 'Verifying on Backend...' : 'Verify Token Authenticity'}
          </button>
        </form>

        {/* Verification Outcome Display */}
        {result && (
          <div
            className={`p-5 rounded-2xl border text-xs animate-in zoom-in-95 duration-150 ${
              result.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2.5 mb-2">
              {result.success ? (
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
              ) : (
                <XCircle size={22} className="text-rose-600 shrink-0" />
              )}
              <h4 className={`text-sm font-bold ${result.success ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
                {result.message}
              </h4>
            </div>

            {result.success && result.data && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 space-y-1 text-slate-800 dark:text-slate-200">
                <p><strong>Name:</strong> {result.data.name}</p>
                <p><strong>Email:</strong> {result.data.email}</p>
                <p><strong>Department:</strong> {result.data.department}</p>
                {result.data.studentProfile && (
                  <p><strong>Student Roll:</strong> {result.data.studentProfile.studentId} (Sem {result.data.studentProfile.semester})</p>
                )}
                {result.data.facultyProfile && (
                  <p><strong>Employee ID:</strong> {result.data.facultyProfile.employeeId} ({result.data.facultyProfile.designation})</p>
                )}
                <div className="pt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                    Gate Access Permitted
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
