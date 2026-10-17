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
  Home as HomeIcon,
  Activity,
  Layers,
  Globe,
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
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between font-sans selection:bg-teal-500 selection:text-white">
      <header className="sticky top-0 z-40 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-left focus:outline-none group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">FinTechathon 2026</span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  Topic C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Cross-Border Student Tuition Agent</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/registration"
              className="px-3 py-1.5 rounded-lg font-semibold text-teal-300 hover:text-white hover:bg-teal-950/40 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Registration</span>
            </Link>
            <Link
              href="/chat"
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>Agent Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Student Sign In</h1>
                <p className="text-xs text-slate-400 font-medium">Zero-Trust Authentication Session</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>JWT Guarded</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2 mb-5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Sandbox Demo Account</span>
              <button
                type="button"
                className="py-1 px-2.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-300 hover:bg-teal-900 text-[11px] font-semibold transition-colors"
                onClick={handleDemoFill}
              >
                Auto-Fill
              </button>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">Student ID: <strong className="text-white">STU-2026-BDT01</strong></span>
              <span className="text-slate-400">Password: <strong className="text-white">student123</strong></span>
            </div>
            <div className="flex justify-between text-[11px] pt-1 border-t border-slate-900">
              <span className="text-slate-400">Tanvir Ahmed</span>
              <span className="font-mono text-emerald-400 font-bold">850,000.00 BDT</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {session ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Authentication Successful!</span>
                </div>
                <p className="text-slate-300">
                  Welcome back, <strong className="text-white">{session.user.studentName}</strong>. JWT session is authenticated.
                </p>
                <div className="p-2.5 bg-slate-950 text-teal-300 font-mono text-[10px] rounded-lg break-all border border-slate-800">
                  {session.accessToken.substring(0, 90)}...
                </div>
              </div>

              <div className="flex gap-2.5">
                <Link
                  href="/chat"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/20"
                >
                  <span>Launch Chat Assistant</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-xs transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Student ID or University Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono transition-colors"
                    value={loginInput.studentIdOrEmail}
                    onChange={(e) =>
                      setLoginInput((prev) => ({ ...prev, studentIdOrEmail: e.target.value }))
                    }
                    placeholder="STU-2026-BDT01"
                    required
                  />
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 pr-10 transition-colors"
                    value={loginInput.password}
                    onChange={(e) =>
                      setLoginInput((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="student123"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In & Get JWT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400">
                  Need a new account?{' '}
                  <Link
                    href="/registration"
                    className="font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-4 transition-colors"
                  >
                    Go to Student Registration
                  </Link>
                </p>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs pt-4 border-t border-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Secured with Scrypt Password Hashing and JWT Sessions</span>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/80">
        FinTechathon 2026 • Cross-Border Student Tuition Payment Agent
      </footer>
    </div>
  );
}
