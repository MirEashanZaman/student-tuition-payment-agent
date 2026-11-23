import React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

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
    speed_description: '24 hours (Next-day settlement)',
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
    speed_description: '4 hours (Same-day express)',
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
    speed_description: '48 hours (Standard campus clearing)',
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
    speed_description: '72 hours (Correspondent wire)',
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
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] flex flex-col font-sans">
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-[#111827]/[0.08] px-6 sm:px-8 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E] rounded-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#0F766E]" aria-hidden="true" />
            <span className="text-base font-medium text-[#111827]">FinTechathon 2026</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Overview
            </Link>
            <Link
              href="/chat"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Studio
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Dashboard
            </Link>
            <Link
              href="/audit"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Audit
            </Link>
            <span className="w-px h-4 bg-[#111827]/[0.12] mx-1" aria-hidden="true" />
            <Link
              href="/rates"
              className="px-3 py-2 rounded-lg bg-[#ECEFF4] text-[#111827] font-medium"
            >
              Rates
            </Link>
            <Link
              href="/status"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              Status
            </Link>
            <Link
              href="/faq"
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
            >
              FAQ
            </Link>
          </nav>

          <Link
            href="/chat"
            className="h-9 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm inline-flex items-center gap-2 transition-colors duration-150 ease-unslop"
          >
            <span>Open studio</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 py-8 space-y-6">
        <div className="bg-white border border-[#111827]/[0.08] rounded-xl p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-mono text-xs text-[#6B7487]">BDT ──▶ USD clearing corridors</span>
            <span className="font-mono text-xs text-[#6B7487] bg-[#ECEFF4] px-2 py-1 rounded-md">
              ISR · revalidate 60s
            </span>
          </div>
          <h1 className="text-3xl font-medium text-[#111827] leading-tight">
            Cross-border remittance corridors
          </h1>
          <p className="text-sm text-[#4B5565] max-w-3xl mt-2 leading-relaxed">
            Public clearing rails and foreign exchange benchmarks for student tuition transfers from Bangladesh to accredited foreign universities, refreshed statically every 60 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rates.map((rate, index) => {
            const isBestRate = index === 0;
            return (
              <div
                key={rate.id}
                className="bg-white border border-[#111827]/[0.08] hover:border-[#111827]/[0.18] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-150 ease-unslop flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h2 className="font-medium text-base text-[#111827]">{rate.provider_name}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-[#4B5565]">
                          {rate.source_currency} ──▶ {rate.target_currency}
                        </span>
                        <span className="text-xs text-[#6B7487]">· {rate.compliance_rating}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-[#6B7487] block">FX rate</span>
                      <span
                        className={`text-2xl font-medium font-mono tabular-figures ${
                          isBestRate ? 'text-[#0F766E]' : 'text-[#111827]'
                        }`}
                      >
                        {rate.inverse_rate.toFixed(2)} BDT
                      </span>
                      <span className="text-xs text-[#6B7487] block">per 1 USD</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-4 bg-[#F5F7FA] rounded-lg border border-[#111827]/[0.06] text-xs my-4">
                    <div>
                      <span className="text-[#6B7487] block">Flat wire fee</span>
                      <span className="font-medium font-mono text-[#111827] text-sm mt-1 block tabular-figures">
                        {rate.transfer_fee_flat_bdt.toLocaleString()} BDT
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7487] block">Variable margin</span>
                      <span className="font-medium font-mono text-[#111827] text-sm mt-1 block tabular-figures">
                        {(rate.transfer_fee_percent * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7487] block">Reliability</span>
                      <span className="font-medium font-mono text-[#16A34A] text-sm mt-1 block tabular-figures">
                        {Math.round(rate.reliability_score * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#4B5565] mb-4">
                    <Clock className="w-4 h-4 text-[#6B7487] shrink-0" strokeWidth={1.5} />
                    <span>
                      Settlement speed: <span className="font-medium text-[#111827]">{rate.speed_description}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#111827]/[0.08] flex justify-between items-center gap-4">
                  <span className="text-xs text-[#6B7487] font-mono">{rate.id}</span>
                  <Link
                    href="/chat"
                    className="h-9 px-3 rounded-lg bg-[#ECEFF4] hover:bg-[#E2E8F0] text-[#111827] font-medium text-xs inline-flex items-center gap-2 transition-colors duration-150 ease-unslop"
                  >
                    <span>Select in studio</span>
                    <ArrowRight className="w-4 h-4 text-[#6B7487]" strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="text-center text-xs text-[#6B7487] py-6 border-t border-[#111827]/[0.08] bg-white">
        FinTechathon 2026 · Incremental Static Regeneration corridor rates
      </footer>
    </div>
  );
}
