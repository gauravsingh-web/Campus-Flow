import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  QrCode,
  ShieldCheck,
  RefreshCw,
  Download,
  GraduationCap,
  Building,
  CheckCircle,
  Hash,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

export default function IdentityPage() {
  const { user } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchIdentity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qr/my-identity');
      if (res.data.success) {
        setQrData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentity();
  }, []);

  const handleRegenerate = async () => {
    if (
      !window.confirm(
        'Regenerating will invalidate your current physical/digital QR badge immediately. Proceed?'
      )
    )
      return;

    setRegenerating(true);
    try {
      const res = await api.post('/qr/regenerate');
      if (res.data.success) {
        alert('Campus Identity Token successfully renewed!');
        fetchIdentity();
      }
    } catch (err) {
      alert('Failed to regenerate token');
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-2">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <span className="text-xs text-slate-400">Loading verifiable campus identity badge...</span>
      </div>
    );
  }

  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Campus Identity & Access Pass
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cryptographically random, revocable QR identification for library checkout, campus gate security, and event attendance.
        </p>
      </div>

      {/* High-Fidelity Smart ID Card */}
      <div className="relative rounded-3xl bg-gradient-to-tr from-brand-900 via-indigo-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-brand-500/20 overflow-hidden">
        {/* Background decorative watermark */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-lg">
              CF
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-brand-300 block">
                CAMPUSFLOW UNIVERSITY
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Official Digital Identity Card
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <ShieldCheck size={14} />
            <span className="uppercase">{qrData?.user?.status || 'Active'}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="py-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="space-y-4 flex-1 text-center sm:text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Authorized Identity
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {qrData?.user?.name}
              </h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-white/10 text-brand-200 text-xs font-bold capitalize">
                {qrData?.user?.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {isStudent ? 'Student ID / Roll' : 'Employee ID'}
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {isStudent ? qrData?.user?.studentId || 'N/A' : qrData?.user?.employeeId || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Department
                </span>
                <span className="font-bold text-white truncate block">
                  {qrData?.user?.department || 'University'}
                </span>
              </div>

              {isStudent ? (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Semester & Section
                  </span>
                  <span className="font-bold text-white">
                    Semester {qrData?.user?.semester || 1} • Sec {qrData?.user?.section || 'A'}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Designation
                  </span>
                  <span className="font-bold text-white">
                    {qrData?.user?.designation || 'Faculty'}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Email
                </span>
                <span className="text-slate-300 truncate block text-[11px]">
                  {qrData?.user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center bg-white p-3 rounded-2xl shadow-xl shrink-0">
            {qrData?.qrDataUrl ? (
              <img
                src={qrData.qrDataUrl}
                alt="Verifiable Campus Identity QR"
                className="w-36 h-36 rounded-lg"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                QR Unavailable
              </div>
            )}
            <span className="text-[10px] font-mono font-bold text-slate-600 mt-2 select-all">
              {qrData?.qrToken}
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
          <span>Non-transferable university property</span>
          <span>Security Token Revocable on Demand</span>
        </div>
      </div>

      {/* Management Controls */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw size={15} className={regenerating ? 'animate-spin' : ''} />
          <span>Regenerate Compromised Token</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Download size={15} />
          <span>Print / Save Badge</span>
        </button>
      </div>
    </div>
  );
}
