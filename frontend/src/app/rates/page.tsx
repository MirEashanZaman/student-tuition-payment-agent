import React from 'react';
import Link from 'next/link';
import {
  Zap,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Home as HomeIcon,
  Activity,
  Layers,
} from 'lucide-react';

export const revalidate = 60;

interface RateRecord {
  id: string;
  provider_name: string;
  source_currency: string;
  target_currency: string;
  exchange_rate: number;
  inverse_rate: number;
  transfer_fee_flat_bdt: number;
  transfer_fee_percent: number;
  speed_hours: number;
  speed_description: string;
  reliability_score: number;
  compliance_rating: string;
}

const fallbackRates: RateRecord[] = [
  {
    id: 'route-edupay-prime',
    provider_name: 'EduPay Prime (Campus Direct Clearing)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.00839,
    inverse_rate: 119.19,
    transfer_fee_flat_bdt: 350.0,
    transfer_fee_percent: 0.0015,
    speed_hours: 24,
    speed_description: '24 Hours (Next-day settlement)',
    reliability_score: 0.99,
    compliance_rating: 'Tier-1 Education Network',
  },
  {
    id: 'route-swiftwire-express',
    provider_name: 'SwiftWire Express (Priority Rail)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.008325,
    inverse_rate: 120.11,
    transfer_fee_flat_bdt: 1200.0,
    transfer_fee_percent: 0.0035,
    speed_hours: 4,
    speed_description: '4 Hours (Urgent Same-Day Express)',
    reliability_score: 0.97,
    compliance_rating: 'SWIFT gpi Certified',
  },
  {
    id: 'route-dhakabank-forex',
    provider_name: 'DhakaBank Forex (Student File Rail)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.008354,
    inverse_rate: 119.7,
    transfer_fee_flat_bdt: 600.0,
    transfer_fee_percent: 0.002,
    speed_hours: 48,
    speed_description: '48 Hours (Standard Campus Clearing)',
    reliability_score: 0.94,
    compliance_rating: 'Central Bank Authorized',
  },
  {
    id: 'route-globalstudy-wire',
    provider_name: 'GlobalStudy Wire (Correspondent Bank)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.008271,
    inverse_rate: 120.9,
    transfer_fee_flat_bdt: 2500.0,
    transfer_fee_percent: 0.005,
    speed_hours: 72,
    speed_description: '72 Hours (Legacy International Wire)',
    reliability_score: 0.91,
    compliance_rating: 'Correspondent Network',
  },
];

async function getRates(): Promise<RateRecord[]> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4568/api';
    const res = await fetch(`${apiBase}/rates`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return fallbackRates;
    }
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : fallbackRates;
  } catch {
    return fallbackRates;
  }
}

export default async function RatesPage() {
  const rates = await getRates();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0D9488] selection:text-white">
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

          <nav className="hidden md:flex items-center gap-1.5 bg-[#172E6F] border border-[#2B4C9B] p-1 rounded-lg">
            <Link
              href="/"
              className="px-3 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors flex items-center gap-1.5"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/chat"
              className="px-3 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/audit"
              className="px-3 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit</span>
            </Link>
            <span className="w-px h-4 bg-[#2B4C9B] my-auto mx-1"></span>
            <Link
              href="/rates"
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0D9488] text-white shadow-sm"
            >
              Rates (ISR)
            </Link>
            <Link
              href="/status"
              className="px-2.5 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors"
            >
              Status (SSR)
            </Link>
            <Link
              href="/faq"
              className="px-2.5 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors"
            >
              FAQ (SSG)
            </Link>
          </nav>

          <Link
            href="/chat"
            className="py-2 px-3.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Remittance Corridors &amp; FX Benchmark</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EFF6FF] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-bold font-mono">
              <RefreshCw className="w-3 h-3 text-[#2563EB]" />
              <span>ISR: Incremental Static Regeneration (revalidate: 60s)</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] mb-2">
            Cross-Border Remittance Corridors
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-3xl leading-relaxed">
            Public clearing rails and verified foreign exchange rates for student tuition transfers from Bangladesh to international accredited universities. Pre-rendered statically with background revalidation every 60 seconds.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>
              <strong>Architectural Note:</strong> This page utilizes <strong>ISR (Incremental Static Regeneration)</strong>. Requests are served from edge cache in under 10ms, while Next.js refreshes exchange rate data asynchronously in the background.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-[#1E3A8A] shrink-0 hidden sm:inline bg-white border border-[#BFDBFE] px-2 py-0.5 rounded">
            revalidate = 60s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl p-6 shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-[#0F172A]">{rate.provider_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E3A8A] border border-[#DBEAFE]">
                        {rate.source_currency} &rarr; {rate.target_currency}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]">
                        {rate.compliance_rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#64748B] block font-medium">FX Exchange Rate</span>
                    <span className="text-xl font-bold font-mono text-[#0D9488]">
                      {rate.inverse_rate.toFixed(2)} BDT
                    </span>
                    <span className="text-[10px] text-[#64748B] block">per 1 USD</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-xs my-4">
                  <div>
                    <span className="text-[#64748B] text-[10px] block">Flat Wire Fee</span>
                    <span className="font-bold font-mono text-[#0F172A] mt-0.5 block">
                      {rate.transfer_fee_flat_bdt.toLocaleString()} BDT
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] block">Variable Margin</span>
                    <span className="font-bold font-mono text-[#0F172A] mt-0.5 block">
                      {(rate.transfer_fee_percent * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] text-[10px] block">Campus Reliability</span>
                    <span className="font-bold font-mono text-[#16A34A] mt-0.5 block">
                      {Math.round(rate.reliability_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#0F172A] mb-4">
                  <Clock className="w-4 h-4 text-[#0D9488] shrink-0" />
                  <span>Settlement Speed: <strong>{rate.speed_description}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
                <span className="text-[11px] text-[#64748B] font-mono">ID: {rate.id}</span>
                <Link
                  href="/chat"
                  className="py-1.5 px-3 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6F] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Select Route in Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-[#64748B] py-6 border-t border-[#E2E8F0] bg-white">
        FinTechathon 2026 • Incremental Static Regeneration (ISR) Corridor Architecture
      </footer>
    </div>
  );
}
