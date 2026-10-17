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
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
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

          <nav className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/chat"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Studio</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/audit"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit</span>
            </Link>
            <span className="w-px h-4 bg-slate-800 my-auto mx-1"></span>
            <Link
              href="/rates"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm"
            >
              Rates (ISR)
            </Link>
            <Link
              href="/status"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-950/40 transition-colors"
            >
              Status (SSR)
            </Link>
            <Link
              href="/faq"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              FAQ (SSG)
            </Link>
          </nav>

          <Link
            href="/chat"
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Remittance Corridors &amp; FX Benchmark</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold font-mono">
              <RefreshCw className="w-3 h-3 text-purple-400" />
              <span>ISR: Incremental Static Regeneration (revalidate: 60s)</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Cross-Border Remittance Corridors
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Public clearing rails and live foreign exchange rates for student tuition transfers from Bangladesh to North American and European universities. Pre-rendered statically with background revalidation every 60 seconds.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/50 text-purple-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Architectural Note:</strong> This page utilizes <strong>ISR (Incremental Static Regeneration)</strong>. Requests are served in under 10ms from the edge cache, and Next.js re-queries the banking API in the background every 60 seconds when new visitors arrive.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-purple-300 shrink-0 hidden sm:inline bg-purple-900/50 border border-purple-700/60 px-2 py-0.5 rounded">
            revalidate = 60s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between backdrop-blur-md"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">{rate.provider_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                        {rate.source_currency} &rarr; {rate.target_currency}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-800/60">
                        {rate.compliance_rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">FX Exchange Rate</span>
                    <span className="text-xl font-bold font-mono text-teal-300">
                      {rate.inverse_rate.toFixed(2)} BDT
                    </span>
                    <span className="text-[10px] text-slate-500 block">per 1 USD</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs my-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Flat Wire Fee</span>
                    <span className="font-bold font-mono text-white mt-0.5 block">
                      {rate.transfer_fee_flat_bdt.toLocaleString()} BDT
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Variable Margin</span>
                    <span className="font-bold font-mono text-white mt-0.5 block">
                      {(rate.transfer_fee_percent * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Campus Reliability</span>
                    <span className="font-bold font-mono text-emerald-400 mt-0.5 block">
                      {Math.round(rate.reliability_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 mb-4">
                  <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Settlement Speed: <strong>{rate.speed_description}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-mono">ID: {rate.id}</span>
                <Link
                  href="/chat"
                  className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Select Route in Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/80">
        FinTechathon 2026 • Incremental Static Regeneration (ISR) Corridor Architecture
      </footer>
    </div>
  );
}
