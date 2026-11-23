'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
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
    grantLabel: '850,000 BDT (Active sandbox rail)',
  },
  {
    code: 'CN',
    name: 'China',
    currencyCode: 'CNY',
    currencyName: 'Chinese Yuan (¥)',
    idPrefix: 'STU-2026-CNY',
    isPrimaryRail: false,
    grantLabel: '52,000 CNY equiv (850k BDT rail)',
  },
  {
    code: 'IN',
    name: 'India',
    currencyCode: 'INR',
    currencyName: 'Indian Rupee',
    idPrefix: 'STU-2026-INR',
    isPrimaryRail: false,
    grantLabel: '600,000 INR equiv (850k BDT rail)',
  },
  {
    code: 'NP',
    name: 'Nepal',
    currencyCode: 'NPR',
    currencyName: 'Nepalese Rupee',
    idPrefix: 'STU-2026-NPR',
    isPrimaryRail: false,
    grantLabel: '950,000 NPR equiv (850k BDT rail)',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    currencyCode: 'MYR',
    currencyName: 'Malaysian Ringgit',
    idPrefix: 'STU-2026-MYR',
    isPrimaryRail: false,
    grantLabel: '33,000 MYR equiv (850k BDT rail)',
  },
  {
    code: 'NG',
    name: 'Nigeria',
    currencyCode: 'NGN',
    currencyName: 'Nigerian Naira',
    idPrefix: 'STU-2026-NGN',
    isPrimaryRail: false,
    grantLabel: '10,500,000 NGN equiv (850k BDT rail)',
  },
];

const TARGET_CORRIDORS = [
  { code: 'CNY', symbol: '¥', name: 'China', sample: 'Tsinghua, Peking, Fudan' },
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
  const [permissionTier, setPermissionTier] = useState<'READ_ONLY' | 'DRAFT' | 'EXECUTE'>('EXECUTE');
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
        permissionTier,
      });
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fintech_logged_out');
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Check your inputs and try again.');
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
              href="/login"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Sign in
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

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-xl w-full bg-white border border-[#111827]/[0.08] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-medium text-[#111827] leading-tight">Student registration</h1>
              <p className="text-sm text-[#4B5565] mt-1">
                Create a sandbox student profile to route tuition payments to accredited foreign universities
              </p>
            </div>
            <span className="hidden sm:inline font-mono text-xs text-[#6B7487] bg-[#ECEFF4] px-2 py-1 rounded-md shrink-0">
              {activeCountry.currencyCode} → USD
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/20 text-[#DC2626] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 rounded-lg bg-[#F0FDF4] border border-[#16A34A]/20 text-[#16A34A] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Registration complete. Redirecting to overview...</span>
            </div>
          )}

          <form onSubmit={handleRegistration} className="space-y-4 mt-6">
            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#111827]/[0.08] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-[#111827]">
                  Origin country and currency
                </label>
                <span className="text-xs font-mono text-[#0F766E]">
                  {activeCountry.currencyCode} · {activeCountry.currencyName}
                </span>
              </div>

              <select
                value={selectedCountryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop cursor-pointer"
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.currencyCode} — {country.currencyName})
                  </option>
                ))}
              </select>

              <div className="pt-3 border-t border-[#111827]/[0.08]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#4B5565]">
                    Destination tuition corridors
                  </span>
                  <span className="text-xs text-[#6B7487]">University clearing endpoints</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {TARGET_CORRIDORS.map((corridor) => (
                    <div
                      key={corridor.code}
                      className="p-2 rounded-lg bg-white border border-[#111827]/[0.08] flex flex-col items-center text-center"
                    >
                      <span className="text-xs font-medium text-[#111827] font-mono">
                        {corridor.code} {corridor.symbol}
                      </span>
                      <span className="text-[11px] text-[#6B7487] truncate w-full mt-0.5">{corridor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Student ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] placeholder-[#6B7487] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop font-mono"
                  placeholder="STU-2026-BDT02"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] placeholder-[#6B7487] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop"
                  placeholder="Ayesha Khan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] placeholder-[#6B7487] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop"
                  placeholder="ayesha.student@fintechathon.org"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4B5565] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] placeholder-[#6B7487] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4B5565] mb-1">
                Initial authorization tier
              </label>
              <select
                value={permissionTier}
                onChange={(e) => setPermissionTier(e.target.value as 'READ_ONLY' | 'DRAFT' | 'EXECUTE')}
                className="w-full h-10 bg-white border border-[#111827]/[0.12] rounded-lg px-3 text-sm text-[#111827] focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 transition-colors duration-150 ease-unslop"
              >
                <option value="EXECUTE">EXECUTE — Full transfer execution</option>
                <option value="DRAFT">DRAFT — Route comparison and drafts</option>
                <option value="READ_ONLY">READ_ONLY — Inquiries and balances only</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F7FA] border border-[#111827]/[0.08] text-xs space-y-1">
              <div className="font-medium text-[#111827] font-mono tabular-figures">
                Sandbox initial grant: {activeCountry.grantLabel}
              </div>
              <p className="text-[#4B5565]">
                Provides sandbox liquidity for testing tuition settlements to China, US, UK, and European universities.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition-[background-color,transform] duration-150 ease-unslop active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] focus-visible:ring-offset-2"
              >
                <span>{loading ? 'Processing registration...' : 'Complete registration'}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-[#111827]/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#4B5565]">
                Demo student personas
              </span>
              <span className="text-xs text-[#6B7487]">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { country: 'BD', id: 'STU-2026-BDT02', name: 'Ayesha Khan', mail: 'ayesha.student@fintechathon.org', meta: 'BD · BDT' },
                { country: 'CN', id: 'STU-2026-CNY01', name: 'Li Wei', mail: 'liwei.student@fintechathon.org', meta: 'CN · CNY' },
                { country: 'IN', id: 'STU-2026-INR01', name: 'Priya Sharma', mail: 'priya.student@fintechathon.org', meta: 'IN · INR' },
                { country: 'NP', id: 'STU-2026-NPR01', name: 'Rohan Shrestha', mail: 'rohan.student@fintechathon.org', meta: 'NP · NPR' },
              ].map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() =>
                    handleQuickDemoFill(persona.country, persona.id, persona.name, persona.mail, 'student123')
                  }
                  className="text-left p-3 rounded-lg bg-[#F5F7FA] border border-[#111827]/[0.08] hover:border-[#0F766E] transition-colors duration-150 ease-unslop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]"
                >
                  <div className="text-xs font-medium text-[#111827] truncate">{persona.name}</div>
                  <div className="text-[11px] text-[#6B7487] font-mono mt-0.5">{persona.meta}</div>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[#4B5565]">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-medium text-[#0F766E] hover:text-[#115E59] underline underline-offset-4 transition-colors duration-150 ease-unslop"
            >
              Sign in
            </button>
          </p>

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
