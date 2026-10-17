import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  RefreshCw,
  Clock,
  Home as HomeIcon,
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
            href="/chat"
            className="btn btn-sm bg-[#0D9488] hover:bg-teal-700 text-white border-none font-bold flex items-center gap-1.5"
          >
            <span>Agent Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        <div className="bg-gradient-to-br from-[#1E3A8A] via-[#172554] to-[#0F172A] text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-blue-900/50">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Institutional Compliance &amp; Architectural Answers</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold font-mono">
              <span>SSG: Pre-rendered Build-Time Static Page</span>
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            How It Works &amp; Security FAQ
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl leading-relaxed">
            Transparent explanations on fund custody, velocity limits, zero-trust human confirmation, and autonomous agent safety for judges and international students.
          </p>
        </div>

        <div className="space-y-5">
          {faqItems.map((item, idx) => (
            <div
              key={item.id}
              className="card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-xl bg-teal-50 text-[#0D9488] text-sm font-bold flex items-center justify-center shrink-0 border border-teal-200">
                  Q{idx + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">
                    {item.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                  <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-900 text-xs font-medium flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>{item.highlight}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-slate-100 border border-slate-200 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-base text-slate-900">
              Ready to evaluate live tuition payment processing?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Launch the Agent Chat Studio to test quotes, route ranking, and human-in-the-loop confirmation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold"
            >
              Back to Overview
            </Link>
            <Link
              href="/chat"
              className="btn bg-[#0D9488] hover:bg-teal-700 text-white border-none text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>Launch Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-200">
        FinTechathon 2026 - Cross-Border Student Tuition Payment Agent
      </footer>
    </div>
  );
}
