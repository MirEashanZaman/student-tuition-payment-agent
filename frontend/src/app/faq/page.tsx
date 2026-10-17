import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Home as HomeIcon,
  Activity,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-static';

export default function FaqPage() {
  const faqItems = [
    {
      id: 'real-money',
      question: 'Is this real money?',
      answer:
        'No. This system operates entirely within a high-fidelity institutional sandbox simulation. All student balances, correspondent banking rails (Standard Chartered, City Bank, bKash remittance), and university student accounts are sandboxed to demonstrate real-world production safety without capital exposure.',
      highlight:
        'Sandbox environment: safe for full functional evaluation without real monetary debit.',
    },
    {
      id: 'protection',
      question: 'How is my payment protected?',
      answer:
        'Every transaction is guarded through defense-in-depth: (1) Hard compiled velocity limits of 400,000 BDT per transfer and 1,000,000 BDT daily, (2) Pre-draft balance validation and atomic balance reservation, (3) Single-use cryptographic confirmation tokens that expire, (4) Pre-settlement re-verification, and (5) Tamper-evident immutable audit logging.',
      highlight:
        'Compiled security controls cannot be overridden by conversational prompts or agent instructions.',
    },
    {
      id: 'unilateral-move',
      question: 'Can the AI agent move funds without my explicit approval?',
      answer:
        'Never. By architectural design, the AI agent is strictly quarantined to READ_ONLY and DRAFT permission tiers. The agent can only fetch corridors, compare quotes, and generate a draft. The EXECUTE tier is locked to human students; funds cannot move until you physically confirm the transfer details.',
      highlight:
        'Zero-trust execution: human confirmation is mandatory for every single financial movement.',
    },
    {
      id: 'failure-rollback',
      question: 'What happens if a corridor clearance or wire transfer fails?',
      answer:
        'The system executes an automated Saga compensation workflow. If any clearing rail fails or a university receiving bank rejects the transaction, the transfer status transitions to FAILED and a compensating transaction immediately unreserves and restores the funds back into your available BDT balance.',
      highlight:
        'Deterministic rollback: no funds can be stranded in pending or indeterminate states.',
    },
    {
      id: 'route-ranking',
      question: 'How are cross-border payment routes ranked and scored?',
      answer:
        'Corridors are evaluated using a multi-objective formula: 40% Net Landed Cost (FX spread + rail fees), 30% Settlement Speed, 20% Historical Rail Reliability, and 10% Deadline Buffer. If a route delivery date exceeds the student tuition deadline, a heavy penalty is applied to safeguard students against late payment fees.',
      highlight:
        'Transparent scoring: complete itemized breakdown of FX margins and landing fees.',
    },
  ];

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
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-950/40 transition-colors"
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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-sm"
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
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Institutional Compliance &amp; Architectural Answers</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
              <span>SSG: Pre-rendered Build-Time Static Page</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            How It Works &amp; Security FAQ
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Transparent explanations on fund custody, velocity limits, zero-trust human confirmation, and autonomous agent safety for judges and international students.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 shadow-xl transition-all backdrop-blur-md"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-800 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0">
                  Q{idx + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <h2 className="font-bold text-base sm:text-lg text-white">
                    {item.question}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.answer}
                  </p>
                  <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/60 text-teal-300 text-xs font-medium flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{item.highlight}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
          <div>
            <h3 className="font-bold text-base text-white">
              Ready to evaluate live tuition payment processing?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Launch the Agent Chat Studio to test quotes, route ranking, and human-in-the-loop confirmation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Back to Overview
            </Link>
            <Link
              href="/chat"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/80">
        FinTechathon 2026 • Cross-Border Student Tuition Payment Agent
      </footer>
    </div>
  );
}
