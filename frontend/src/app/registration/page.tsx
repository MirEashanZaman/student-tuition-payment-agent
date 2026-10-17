'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Zap, User, Mail, Wallet, CheckCircle2 } from 'lucide-react';

export default function RegistrationPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('STU-2026-BDT02');
  const [studentName, setStudentName] = useState('Ayesha Khan');
  const [email, setEmail] = useState('ayesha.student@fintechathon.org');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.registration({
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        email: email.trim(),
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (id: string, name: string, mail: string, pass: string) => {
    setStudentId(id);
    setStudentName(name);
    setEmail(mail);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FinTechathon 2026</h1>
            <p className="text-xs text-slate-400 font-medium">Cross-Border Tuition Payment Agent</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-100">Student Registration</h2>
          <p className="text-xs text-slate-400 mt-1">Create your verified student account for tuition remittance</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Registration successful! Launching student dashboard...</span>
          </div>
        )}

        <form onSubmit={handleRegistration} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Student ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors font-mono"
                placeholder="STU-2026-BDT02"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Student Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Ayesha Khan"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="ayesha.student@fintechathon.org"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="Minimum 6 characters"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs text-teal-300 flex items-center gap-2.5">
            <Wallet className="w-4 h-4 shrink-0 text-teal-400" />
            <div>
              <span className="font-semibold text-white">Sandbox Grant:</span> 850,000.00 BDT initial balance & 1,000,000.00 BDT daily remittance limit allocated upon registration.
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Processing Registration...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demo Registration Persona</span>
          </div>
          <button
            type="button"
            onClick={() => handleQuickDemoFill('STU-2026-BDT02', 'Ayesha Khan', 'ayesha.student@fintechathon.org', 'student123')}
            className="w-full text-left p-3 rounded-xl bg-slate-950/50 border border-slate-700/70 hover:border-slate-600 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white font-mono">Ayesha Khan (STU-2026-BDT02)</div>
              <div className="text-[11px] text-slate-400 font-mono">ayesha.student@fintechathon.org</div>
            </div>
            <span className="text-[11px] font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-md">
              Load Persona
            </span>
          </button>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-4 transition-colors"
            >
              Return to Login
            </button>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Secured with Scrypt Password Hashing and JWT Sessions</span>
        </div>
      </div>
    </div>
  );
}
