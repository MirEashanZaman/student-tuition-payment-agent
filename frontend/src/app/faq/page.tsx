import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';

export default function FaqPage() {
  const faqItems = [
    {
      id: 'real-money',
      question: 'Is this real money?',
      answer:
        'No. This system operates inside a sandbox simulation. Student balances, correspondent banking rails, and university accounts are sandboxed to demonstrate production safety without real capital exposure.',
      highlight:
        'Sandbox environment for full evaluation without monetary debit',
    },
    {
      id: 'protection',
      question: 'How is my payment protected?',
      answer:
        'Every transaction passes five layers of protection: compiled velocity limits of 400,000 BDT per transfer and 1,000,000 BDT daily, pre-draft balance validation and atomic reservation, single-use expiring confirmation tokens, pre-settlement re-verification, and append-only audit logging.',
      highlight:
        'Compiled limits cannot be overridden by conversational prompts or agent instructions',
    },
    {
      id: 'unilateral-move',
      question: 'Can the agent move funds without my approval?',
      answer:
        'No. The agent is restricted to READ_ONLY and DRAFT permission tiers. It can fetch corridors, compare quotes, and prepare a transfer draft. The EXECUTE tier requires human confirmation with a 6-digit step-up OTP before funds move.',
      highlight:
        'Human confirmation is mandatory for every financial movement',
    },
    {
      id: 'failure-rollback',
      question: 'What happens if a corridor clearance or wire transfer fails?',
      answer:
        'The system runs an automated Saga compensation workflow. If a clearing rail fails or a university receiving bank rejects the transfer, the record transitions to FAILED and a compensating transaction restores the reserved funds to your available balance.',
      highlight:
        'Deterministic rollback prevents funds from staying stuck in pending states',
    },
    {
      id: 'route-ranking',
      question: 'How are cross-border payment routes ranked?',
      answer:
        'Corridors are scored using a multi-objective formula weighing Net Landed Cost (FX spread plus rail fees), Settlement Speed, Historical Rail Reliability, and Deadline Buffer. Routes arriving past the tuition deadline receive a penalty to help avoid late fees.',
      highlight:
        'Itemized breakdown of FX margins, flat fees, and arrival time',
    },
  ];

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
              className="px-3 py-2 rounded-lg text-[#4B5565] hover:text-[#111827] hover:bg-[#ECEFF4] transition-colors duration-150 ease-unslop"
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
              className="px-3 py-2 rounded-lg bg-[#ECEFF4] text-[#111827] font-medium"
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
            <span className="font-mono text-xs text-[#6B7487]">Compliance and architecture reference</span>
            <span className="font-mono text-xs text-[#6B7487] bg-[#ECEFF4] px-2 py-1 rounded-md">
              SSG · static build
            </span>
          </div>
          <h1 className="text-3xl font-medium text-[#111827] leading-tight">
            How it works and security FAQ
          </h1>
          <p className="text-sm text-[#4B5565] max-w-3xl mt-2 leading-relaxed">
            How fund custody, velocity limits, human confirmation, and corridor scoring operate for evaluators and international students.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-[#111827]/[0.08] hover:border-[#111827]/[0.18] rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors duration-150 ease-unslop"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-lg bg-[#ECEFF4] text-[#4B5565] font-mono text-xs font-medium flex items-center justify-center shrink-0 tabular-figures">
                  0{idx + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <h2 className="font-medium text-base text-[#111827]">
                    {item.question}
                  </h2>
                  <p className="text-sm text-[#4B5565] leading-relaxed">
                    {item.answer}
                  </p>
                  <div className="p-3 rounded-lg bg-[#F5F7FA] border border-[#111827]/[0.06] text-[#4B5565] text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" strokeWidth={1.5} />
                    <span>{item.highlight}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#111827]/[0.08] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div>
            <h3 className="font-medium text-base text-[#111827]">
              Evaluate live tuition payment processing
            </h3>
            <p className="text-sm text-[#4B5565] mt-1">
              Open the Payment Studio to compare quotes, rank corridors, and test human confirmation
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="h-10 px-4 rounded-lg bg-[#ECEFF4] hover:bg-[#E2E8F0] border border-[#111827]/[0.08] text-[#111827] text-sm font-medium inline-flex items-center transition-colors duration-150 ease-unslop"
            >
              Back to overview
            </Link>
            <Link
              href="/chat"
              className="h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white font-medium text-sm inline-flex items-center gap-2 transition-colors duration-150 ease-unslop"
            >
              <span>Open studio</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#6B7487] py-6 border-t border-[#111827]/[0.08] bg-white">
        FinTechathon 2026 · Cross-border student tuition payment desk
      </footer>
    </div>
  );
}
