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
  Globe,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
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
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between font-sans selection:bg-[#0D9488] selection:text-white">
      <header className="sticky top-0 z-40 bg-[#1E3A8A] border-b border-[#1E3A8A] text-white px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-left focus:outline-none">
            <div className="w-9 h-9 rounded-lg bg-[#0D9488] flex items-center justify-center text-white shadow-sm font-bold">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">FinTechathon 2026</span>
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#0D9488] text-white">
                  Topic C
                </span>
              </div>
              <p className="text-[11px] text-blue-100 font-medium">Cross-Border Student Tuition Agent</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg font-semibold text-blue-100 hover:text-white hover:bg-[#172E6F] transition-colors flex items-center gap-1.5"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/registration"
              className="px-3 py-1.5 rounded-lg font-semibold text-blue-100 hover:text-white hover:bg-[#172E6F] transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Registration</span>
            </Link>
            <Link
              href="/chat"
              className="py-1.5 px-3 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Agent Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Student Sign In</h1>
                <p className="text-xs text-[#64748B] font-medium">Zero-Trust Authentication Session</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>JWT Guarded</span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 text-xs text-[#0F172A] space-y-2 mb-5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#0F172A]">Sandbox Demo Account</span>
              <button
                type="button"
                className="py-1 px-2.5 rounded bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] hover:bg-[#CCFBF1] text-[11px] font-semibold transition-colors"
                onClick={handleDemoFill}
              >
                Auto-Fill
              </button>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-[#64748B]">Student ID: <strong className="text-[#0F172A]">STU-2026-BDT01</strong></span>
              <span className="text-[#64748B]">Password: <strong className="text-[#0F172A]">student123</strong></span>
            </div>
            <div className="flex justify-between text-[11px] pt-1 border-t border-[#E2E8F0]">
              <span className="text-[#64748B]">Mir Eashan Zaman</span>
              <span className="font-mono text-[#16A34A] font-bold">850,000.00 BDT</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {session ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#16A34A]">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                  <span>Authentication Successful!</span>
                </div>
                <p className="text-[#0F172A]">
                  Welcome back, <strong className="text-[#0F172A]">{session.user.studentName}</strong>. JWT session is authenticated ({session.user.permissionTier || 'EXECUTE'}).
                </p>
                <div className="p-2.5 bg-white text-[#0D9488] font-mono text-[10px] rounded border border-[#BBF7D0] break-all">
                  {session.accessToken.substring(0, 90)}...
                </div>
              </div>

              <div className="flex gap-2.5">
                <Link
                  href="/chat"
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6F] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Launch Chat Assistant</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="py-2.5 px-4 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] font-semibold text-xs transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Student ID or University Email
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] font-mono transition-colors"
                    value={loginInput.studentIdOrEmail}
                    onChange={(e) =>
                      setLoginInput((prev) => ({ ...prev, studentIdOrEmail: e.target.value }))
                    }
                    placeholder="STU-2026-BDT01"
                    required
                  />
                  <User className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] pr-10 transition-colors"
                    value={loginInput.password}
                    onChange={(e) =>
                      setLoginInput((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder="student123"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-[#94A3B8] hover:text-[#0F172A]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Authorization Tier
                </label>
                <select
                  value={loginInput.permissionTier}
                  onChange={(e) =>
                    setLoginInput((prev) => ({
                      ...prev,
                      permissionTier: e.target.value as 'READ_ONLY' | 'DRAFT' | 'EXECUTE',
                    }))
                  }
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#0D9488] transition-colors"
                >
                  <option value="EXECUTE">EXECUTE - Full Transfer Execution</option>
                  <option value="DRAFT">DRAFT - Route Comparison and Drafts</option>
                  <option value="READ_ONLY">READ_ONLY - Inquiries and Balances Only</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6F] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In & Get JWT'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-[#64748B]">
                  Need a new account?{' '}
                  <Link
                    href="/registration"
                    className="font-semibold text-[#0D9488] hover:text-[#0F766E] underline underline-offset-4 transition-colors"
                  >
                    Go to Student Registration
                  </Link>
                </p>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-[#64748B] text-xs pt-4 border-t border-[#E2E8F0]">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>Secured with Scrypt Password Hashing and JWT Sessions</span>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#64748B] py-6 border-t border-[#E2E8F0] bg-white">
        FinTechathon 2026 • Cross-Border Student Tuition Payment Agent
      </footer>
    </div>
  );
}
