'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, authStorage } from '../../lib/api';
import { AuthSession } from '../../types';
import {
  Lock,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Key,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState({
    studentIdOrEmail: 'STU-2026-BDT01',
    password: 'student123',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  const handleDemoFill = () => {
    setLoginInput({ studentIdOrEmail: 'STU-2026-BDT01', password: 'student123' });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(loginInput.studentIdOrEmail, loginInput.password);
      setSession(res);
      authStorage.setToken(res.accessToken);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] via-[#172554] to-[#0F172A] text-white flex flex-col justify-between p-6">
      <header className="max-w-5xl w-full mx-auto flex justify-between items-center py-4">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white font-extrabold shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">FinTechathon 2026</h1>
            <p className="text-[11px] text-teal-300">Student Tuition Payment Agent</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-blue-200 hover:text-white font-medium transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/registration"
            className="text-xs text-teal-300 hover:text-teal-200 font-medium transition-colors"
          >
            Registration
          </Link>
          <Link
            href="/chat"
            className="btn btn-xs bg-[#0D9488] hover:bg-teal-700 text-white border-none font-semibold"
          >
            Agent Chat
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-10">
        <div className="card bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="bg-[#1E3A8A] text-white p-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Trust Student Access</span>
            </div>
            <h2 className="text-xl font-bold text-white">Student Sign In</h2>
            <p className="text-xs text-blue-100/80 mt-1">
              Authenticate your student profile to access permission-guarded tuition payments.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Sandbox Demo Account</span>
                <button
                  type="button"
                  className="btn btn-xs bg-[#1E3A8A] text-white border-none font-bold"
                  onClick={handleDemoFill}
                >
                  Auto-Fill
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-blue-800 font-mono">
                <span>Student ID: <strong>STU-2026-BDT01</strong></span>
                <span>Password: <strong>student123</strong></span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Name: Tanvir Ahmed</span>
                <span>Balance: <strong className="text-emerald-700 font-mono">850,000 BDT</strong></span>
              </div>
            </div>

            {error && (
              <div className="alert bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {session ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1 text-[#0D9488]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Authentication Successful!</span>
                  </div>
                  <p className="text-slate-600 mb-3">
                    Welcome back, <strong>{session.user.studentName}</strong>. JWT token session is active.
                  </p>
                  <div className="p-2.5 bg-slate-900 text-teal-300 font-mono text-[10px] rounded-xl break-all">
                    {session.accessToken.substring(0, 80)}...
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/chat"
                    className="btn bg-[#0D9488] hover:bg-teal-700 text-white flex-1 border-none font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <span>Launch Chat Assistant</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn btn-outline border-slate-300 text-slate-700 text-xs px-4"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Student ID or University Email</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full text-xs bg-slate-50 text-slate-900 border-slate-300 focus:bg-white focus:border-[#1E3A8A]"
                    value={loginInput.studentIdOrEmail}
                    onChange={(e) =>
                      setLoginInput((prev) => ({ ...prev, studentIdOrEmail: e.target.value }))
                    }
                    placeholder="STU-2026-BDT01"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input input-bordered w-full text-xs bg-slate-50 text-slate-900 border-slate-300 focus:bg-white focus:border-[#1E3A8A] pr-10"
                      value={loginInput.password}
                      onChange={(e) =>
                        setLoginInput((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="student123"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn bg-[#0D9488] hover:bg-teal-700 text-white w-full border-none font-bold text-xs shadow-md"
                  >
                    {loading ? 'Authenticating...' : 'Sign In & Get JWT'}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    Need a new account?{' '}
                    <Link
                      href="/registration"
                      className="font-semibold text-[#0D9488] hover:underline"
                    >
                      Go to Student Registration
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-blue-200/60 py-2">
        FinTechathon 2026 - Cross-Border Student Tuition Payment Agent
      </footer>
    </div>
  );
}
