import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  Home as HomeIcon,
  Layers,
  Award,
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
  is_active: boolean;
}

const fallbackRates: RateRecord[] = [
  {
    id: 'route-edupay-prime',
    provider_name: 'EduPay Prime (Campus Direct Clearing)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.00839,
    inverse_rate: 119.1895,
    transfer_fee_flat_bdt: 350.0,
    transfer_fee_percent: 0.0015,
    speed_hours: 24,
    speed_description: '24 Hours (Next-day settlement)',
    reliability_score: 0.99,
    compliance_rating: 'Tier-1 Education Network',
    is_active: true,
  },
  {
    id: 'route-swiftwire-express',
    provider_name: 'SwiftWire Express (Priority Rail)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.008326,
    inverse_rate: 120.1056,
    transfer_fee_flat_bdt: 1200.0,
    transfer_fee_percent: 0.0035,
    speed_hours: 4,
    speed_description: '4 Hours (Urgent Same-Day Express)',
    reliability_score: 0.97,
    compliance_rating: 'SWIFT gpi Certified',
    is_active: true,
  },
  {
    id: 'route-globalcampus-pay',
    provider_name: 'GlobalCampus Pay (Standard Remittance)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.008347,
    inverse_rate: 119.8035,
    transfer_fee_flat_bdt: 600.0,
    transfer_fee_percent: 0.002,
    speed_hours: 48,
    speed_description: '48 Hours (2 Business Days)',
    reliability_score: 0.94,
    compliance_rating: 'Licensed MTO',
    is_active: true,
  },
  {
    id: 'route-national-tt-wire',
    provider_name: 'National Bank Traditional Wire (SWIFT TT)',
    source_currency: 'BDT',
    target_currency: 'USD',
    exchange_rate: 0.00823,
    inverse_rate: 121.5066,
    transfer_fee_flat_bdt: 2500.0,
    transfer_fee_percent: 0.005,
    speed_hours: 72,
    speed_description: '72 Hours (3-4 Business Days)',
    reliability_score: 0.89,
    compliance_rating: 'Legacy Commercial Bank',
    is_active: true,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="navbar bg-[#1E3A8A] text-white px-6 py-3 shadow-md sticky top-0 z-40">
        <div className="navbar-start flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center text-white font-extrabold shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">FinTechathon 2026</h1>
              <p className="text-xs text-teal-300 font-medium">Topic C: Cross-Border Student Tuition Payment Agent</p>
            </div>
          </Link>
        </div>

        <div className="navbar-end flex items-center gap-3">
          <Link
            href="/"
            className="btn btn-sm btn-ghost text-blue-200 hover:text-white flex items-center gap-1.5"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Overview</span>
          </Link>
          <Link
            href="/status"
            className="btn btn-sm btn-ghost text-teal-300 hover:text-white"
          >
            <span>Live SSR Status</span>
          </Link>
          <Link
            href="/chat"
            className="btn btn-sm bg-[#0D9488] hover:bg-teal-700 text-white border-none font-bold flex items-center gap-1.5"
          >
            <span>Agent Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-8">
        <div className="bg-gradient-to-br from-[#1E3A8A] via-[#172554] to-[#0F172A] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-blue-900/50">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Remittance Corridors &amp; FX Benchmark</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold font-mono">
              <RefreshCw className="w-3 h-3" />
              <span>ISR: Incremental Static Regeneration (revalidate: 60s)</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Cross-Border Remittance Corridors
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
            Public clearing rails and live foreign exchange rates for student tuition transfers from Bangladesh to North American and European universities. Pre-rendered statically with background revalidation every 60 seconds.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              <strong>Architectural Note:</strong> This page utilizes <strong>ISR (Incremental Static Regeneration)</strong>. Requests are served in under 10ms from the edge cache, and Next.js re-queries the banking API in the background every 60 seconds when new visitors arrive.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-purple-700 shrink-0 hidden sm:inline">
            revalidate = 60s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{rate.provider_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge badge-sm bg-blue-100 text-[#1E3A8A] font-semibold border-none text-[10px]">
                        {rate.source_currency} &rarr; {rate.target_currency}
                      </span>
                      <span className="badge badge-sm bg-teal-100 text-[#0D9488] font-semibold border-none text-[10px]">
                        {rate.compliance_rating}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">FX Exchange Rate</span>
                    <span className="text-lg font-bold font-mono text-[#0D9488]">
                      {rate.inverse_rate.toFixed(2)} BDT
                    </span>
                    <span className="text-[10px] text-slate-500 block">per 1 USD</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs my-4">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Flat Fee</span>
                    <span className="font-bold font-mono text-slate-800">
                      {rate.transfer_fee_flat_bdt.toLocaleString()} BDT
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Percentage Fee</span>
                    <span className="font-bold font-mono text-slate-800">
                      {(rate.transfer_fee_percent * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Reliability</span>
                    <span className="font-bold font-mono text-emerald-700">
                      {Math.round(rate.reliability_score * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Settlement Speed: <strong>{rate.speed_description}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-mono">ID: {rate.id}</span>
                <Link
                  href="/chat"
                  className="btn btn-sm bg-[#1E3A8A] hover:bg-blue-900 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <span>Select Route in Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-200">
        FinTechathon 2026 - Incremental Static Regeneration (ISR) Corridor Architecture
      </footer>
    </div>
  );
}
