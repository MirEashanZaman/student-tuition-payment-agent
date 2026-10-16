'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Zap, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('STU-2026-BDT01');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.login(studentId, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (id: string, pass: string) => {
    setStudentId(id);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-8 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">FinTechathon 2026</h1>
            <p className="text-xs text-slate-400 font-medium">Cross-Border Tuition Payment Agent</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-100">Sign in to your account</h2>
          <p className="text-xs text-slate-400 mt-1">Authenticate to access student tuition remittance services</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Student ID / Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                placeholder="STU-2026-BDT01"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
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
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Password"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700/60">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Demo Persona</p>
          <button
            type="button"
            onClick={() => handleQuickDemoFill('STU-2026-BDT01', 'student123')}
            className="w-full text-left p-3 rounded-xl bg-slate-950/40 border border-slate-700/60 hover:border-slate-600 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white font-mono">Tanvir Ahmed (STU-2026-BDT01)</div>
              <div className="text-[11px] text-slate-400 font-mono">student123 | 850,000 BDT</div>
            </div>
            <span className="text-[11px] font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded-md">
              Load Demo
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Secured with Scrypt Password Hashing and JWT Sessions</span>
        </div>
      </div>
    </div>
  );
}
