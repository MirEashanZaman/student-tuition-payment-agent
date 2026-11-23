'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api, authStorage } from '../../lib/api';
import { AuthSession } from '../../types';
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState<{
    studentIdOrEmail: string;
    password: string;
    permissionTier: 'READ_ONLY' | 'DRAFT' | 'EXECUTE';
  }>({
    studentIdOrEmail: 'STU-2026-BDT01',
    password: 'student123',
    permissionTier: 'EXECUTE',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  const handleDemoFill = () => {
    setLoginInput({ studentIdOrEmail: 'STU-2026-BDT01', password: 'student123', permissionTier: 'EXECUTE' });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({
        studentIdOrEmail: loginInput.studentIdOrEmail,
        password: loginInput.password,
        permissionTier: loginInput.permissionTier,
      });
      setSession(res);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fintech_logged_out');
      }
      authStorage.setToken(res.accessToken, res.user.studentId);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col justify-between font-sans">
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-[#111827]/[0.08] px-6 sm:px-8 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#0F766E]" aria-hidden="true" />
            <span className="text-base font-medium text-[#111827]">FinTechathon 2026</span>
            <span className="hidden sm:inline font-mono text-xs text-[#6B7487]">BDT → USD</span>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Overview
            </Link>
            <Link
              href="/registration"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Registration
            </Link>
            <Link
              href="/chat"
              className="h-9 px-4 rounded-lg bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-medium inline-flex items-center gap-2 transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
            >
              <span>Payment studio</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-white border border-[#111827]/[0.08] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-medium text-[#111827] leading-tight">Student sign in</h1>
              <p className="text-sm text-[#4B5565] mt-1">JWT session for tuition transfers</p>
            </div>
            <span className="font-mono text-xs text-[#6B7487] bg-[#ECEFF4] px-2 py-1 rounded-md">
              JWT
            </span>
          </div>

          <div className="bg-[#F5F7FA] border border-[#111827]/[0.08] rounded-xl p-4 text-xs text-[#111827] space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-medium text-[#111827]">Sandbox demo account</span>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md bg-white border border-[#111827]/[0.12] text-[#0F766E] hover:bg-[#ECEFF4] text-xs font-medium transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                onClick={handleDemoFill}
              >
                Auto-fill
              </button>
            </div>
            <div className="flex justify-between font-mono text-xs tabular-figures">
              <span className="text-[#6B7487]">
                ID <span className="text-[#111827] font-medium">STU-2026-BDT01</span>
              </span>
              <span className="text-[#6B7487]">
                Pass <span className="text-[#111827] font-medium">student123</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-[#111827]/[0.08]">
              <span className="text-[#4B5565]">Mir Eashan Zaman</span>
              <span className="font-mono text-[#111827] font-medium tabular-figures">850,000 BDT</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/20 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          {session ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#16A34A]/20 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm text-[#16A34A]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>Session authenticated</span>
                </div>
                <p className="text-[#4B5565]">
                  Signed in as <span className="font-medium text-[#111827]">{session.user.studentName}</span> with{' '}
                  <span className="font-mono text-[#111827]">{session.user.permissionTier || 'EXECUTE'}</span> tier.
                </p>
                <div className="p-3 bg-white text-[#4B5565] font-mono text-xs rounded-lg border border-[#111827]/[0.08] break-all">
                  {session.accessToken.substring(0, 90)}...
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/chat"
                  className="flex-1 h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-colors duration-150 ease-unslop"
                >
                  <span>Open payment studio</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </Link>
                <Link
                  href="/dashboard"
                  className="h-10 px-4 rounded-lg bg-[#ECEFF4] hover:bg-[#E2E8F0] text-[#111827] border border-[#111827]/[0.08] font-medium text-sm inline-flex items-center justify-center transition-colors duration-150 ease-unslop"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Student ID or university email
                </label>
                <input
                  type="text"
                  className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] placeholder-[#6B7487] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 font-mono transition-colors duration-150 ease-unslop"
                  value={loginInput.studentIdOrEmail}
                  onChange={(e) =>
                    setLoginInput((prev) => ({ ...prev, studentIdOrEmail: e.target.value }))
                  }
                  placeholder="STU-2026-BDT01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Account password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 pr-10 text-sm text-[#111827] placeholder-[#6B7487] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop"
                    value={loginInput.password}
                    onChange={(e) =>
                      setLoginInput((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7487] hover:text-[#111827] transition-colors duration-150 ease-unslop"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Authorization tier
                </label>
                <select
                  value={loginInput.permissionTier}
                  onChange={(e) =>
                    setLoginInput((prev) => ({
                      ...prev,
                      permissionTier: e.target.value as 'READ_ONLY' | 'DRAFT' | 'EXECUTE',
                    }))
                  }
                  className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop"
                >
                  <option value="EXECUTE">EXECUTE — Full transfer execution</option>
                  <option value="DRAFT">DRAFT — Route comparison and drafts</option>
                  <option value="READ_ONLY">READ_ONLY — Inquiries and balances only</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 ease-unslop active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign in'}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <p className="text-center text-sm text-[#4B5565] pt-2">
                Need a new account?{' '}
                <Link
                  href="/registration"
                  className="font-medium text-[#0F766E] hover:text-[#115E59] underline underline-offset-4 transition-colors duration-150 ease-unslop"
                >
                  Register student profile
                </Link>
              </p>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-[#111827]/[0.08] flex items-center justify-center gap-2 text-[#6B7487] text-xs">
            <ShieldCheck className="w-4 h-4 text-[#6B7487]" strokeWidth={1.5} />
            <span>Scrypt password hashing and HMAC-SHA256 JWT sessions</span>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#6B7487] py-6 border-t border-[#111827]/[0.08] bg-white">
        FinTechathon 2026 · Cross-border student tuition payment desk
      </footer>
    </div>
  );
}
