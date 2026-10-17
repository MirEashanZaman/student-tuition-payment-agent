'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Zap,
  User,
  Mail,
  Wallet,
  CheckCircle2,
  Globe,
  Building2,
  Coins,
  Landmark,
  Home as HomeIcon,
} from 'lucide-react';

interface CountryConfig {
  code: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  idPrefix: string;
  isPrimaryRail: boolean;
  grantLabel: string;
}

const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'BD',
    name: 'Bangladesh',
    currencyCode: 'BDT',
    currencyName: 'Bangladeshi Taka',
    idPrefix: 'STU-2026-BDT',
    isPrimaryRail: true,
    grantLabel: '850,000.00 BDT (Active Sandbox Rail)',
  },
  {
    code: 'IN',
    name: 'India',
    currencyCode: 'INR',
    currencyName: 'Indian Rupee',
    idPrefix: 'STU-2026-INR',
    isPrimaryRail: false,
    grantLabel: '600,000.00 INR Equiv (850k BDT Rail)',
  },
  {
    code: 'NP',
    name: 'Nepal',
    currencyCode: 'NPR',
    currencyName: 'Nepalese Rupee',
    idPrefix: 'STU-2026-NPR',
    isPrimaryRail: false,
    grantLabel: '950,000.00 NPR Equiv (850k BDT Rail)',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    currencyCode: 'MYR',
    currencyName: 'Malaysian Ringgit',
    idPrefix: 'STU-2026-MYR',
    isPrimaryRail: false,
    grantLabel: '33,000.00 MYR Equiv (850k BDT Rail)',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    currencyCode: 'NGN',
    currencyName: 'Nigerian Naira',
    idPrefix: 'STU-2026-NGN',
    isPrimaryRail: false,
    grantLabel: '10,500,000.00 NGN Equiv (850k BDT Rail)',
  },
];

const TARGET_CORRIDORS = [
  { code: 'USD', symbol: '$', name: 'United States', sample: 'Harvard, MIT, Stanford' },
  { code: 'GBP', symbol: '£', name: 'United Kingdom', sample: 'Oxford, Cambridge, UCL' },
  { code: 'EUR', symbol: '€', name: 'European Union', sample: 'TU Munich, ETH Zurich' },
  { code: 'CAD', symbol: 'C$', name: 'Canada', sample: 'Toronto, UBC, McGill' },
  { code: 'AUD', symbol: 'A$', name: 'Australia', sample: 'Melbourne, Sydney, UNSW' },
];

export default function RegistrationPage() {
  const router = useRouter();
  const [selectedCountryCode, setSelectedCountryCode] = useState('BD');
  const [studentId, setStudentId] = useState('STU-2026-BDT02');
  const [studentName, setStudentName] = useState('Ayesha Khan');
  const [email, setEmail] = useState('ayesha.student@fintechathon.org');
  const [password, setPassword] = useState('student123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeCountry =
    SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode) || SUPPORTED_COUNTRIES[0];
    const randomSuffix = Math.floor(10 + Math.random() * 89);
    setStudentId(`${country.idPrefix}${randomSuffix}`);
    setError(null);
  };

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

  const handleQuickDemoFill = (
    countryCode: string,
    id: string,
    name: string,
    mail: string,
    pass: string,
  ) => {
    setSelectedCountryCode(countryCode);
    setStudentId(id);
    setStudentName(name);
    setEmail(mail);
    setPassword(pass);
    setError(null);
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
              href="/login"
              className="px-3 py-1.5 rounded-lg font-semibold text-blue-100 hover:text-white hover:bg-[#172E6F] transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-teal-300" />
              <span>Sign In</span>
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

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="max-w-xl w-full bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-sm font-bold">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Student Registration</h1>
                <p className="text-xs text-[#64748B] font-medium">Cross-Border Tuition Payment Agent</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] text-[11px] font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Global Rail</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-[#64748B]">
              Register your verified student profile to route cross-border tuition directly to foreign universities with zero-trust safety guardrails.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>Registration successful! Launching student dashboard...</span>
            </div>
          )}

          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Country of Origin &amp; Currency</span>
                </label>
                <span className="text-[11px] font-mono font-semibold text-[#0D9488] bg-[#F0FDFA] border border-[#CCFBF1] px-2 py-0.5 rounded">
                  {activeCountry.currencyCode} - {activeCountry.currencyName}
                </span>
              </div>

              <select
                value={selectedCountryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#0D9488] transition-colors cursor-pointer"
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code} className="bg-white text-[#0F172A]">
                    {country.name} ({country.currencyCode} - {country.currencyName})
                  </option>
                ))}
              </select>

              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-[#64748B]" />
                    <span>Destination Tuition Corridors</span>
                  </span>
                  <span className="text-[10px] text-[#64748B]">Foreign University Endpoints</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {TARGET_CORRIDORS.map((corridor) => (
                    <div
                      key={corridor.code}
                      className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] flex flex-col items-center text-center"
                    >
                      <span className="text-xs font-bold text-[#0F172A] font-mono">
                        {corridor.code} ({corridor.symbol})
                      </span>
                      <span className="text-[10px] text-[#64748B] truncate w-full">{corridor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Student ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] transition-colors font-mono"
                    placeholder="STU-2026-BDT02"
                  />
                  <User className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Student Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] transition-colors"
                    placeholder="Ayesha Khan"
                  />
                  <User className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] transition-colors"
                    placeholder="ayesha.student@fintechathon.org"
                  />
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] transition-colors"
                    placeholder="Minimum 6 characters"
                  />
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0D9488] flex items-start gap-2.5">
              <Wallet className="w-4 h-4 shrink-0 text-[#0D9488] mt-0.5" />
              <div>
                <div className="font-semibold text-[#0F172A]">
                  Sandbox Initial Grant: {activeCountry.grantLabel}
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Provides initial liquidity for testing tuition settlements to US, UK, and European universities through AI-optimized banking corridors.
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6F] text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Processing Registration...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                International Demo Personas
              </span>
              <span className="text-[11px] text-[#64748B]">1-Click Auto-Fill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoFill(
                    'BD',
                    'STU-2026-BDT02',
                    'Ayesha Khan',
                    'ayesha.student@fintechathon.org',
                    'student123',
                  )
                }
                className="text-left p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0D9488] transition-colors"
              >
                <div className="text-xs font-bold text-[#0F172A] truncate">Ayesha Khan</div>
                <div className="text-[10px] text-[#0D9488] font-mono">BD - BDT (STU-02)</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoFill(
                    'IN',
                    'STU-2026-INR01',
                    'Priya Sharma',
                    'priya.student@fintechathon.org',
                    'student123',
                  )
                }
                className="text-left p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0D9488] transition-colors"
              >
                <div className="text-xs font-bold text-[#0F172A] truncate">Priya Sharma</div>
                <div className="text-[10px] text-[#0D9488] font-mono">IN - INR (STU-01)</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoFill(
                    'NP',
                    'STU-2026-NPR01',
                    'Rohan Shrestha',
                    'rohan.student@fintechathon.org',
                    'student123',
                  )
                }
                className="text-left p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0D9488] transition-colors"
              >
                <div className="text-xs font-bold text-[#0F172A] truncate">Rohan Shrestha</div>
                <div className="text-[10px] text-[#0D9488] font-mono">NP - NPR (STU-01)</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-[#64748B]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-semibold text-[#0D9488] hover:text-[#0F766E] underline underline-offset-4 transition-colors"
              >
                Return to Login
              </button>
            </p>
          </div>

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
