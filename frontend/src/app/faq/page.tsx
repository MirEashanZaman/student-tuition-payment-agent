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
        'No. This system operates entirely within a high-fidelity institutional sandbox simulation. All student balances, correspondent banking rails, and university accounts are sandboxed to demonstrate real-world production safety without capital exposure.',
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
        'The system executes an automated Saga compensation workflow. If any clearing rail fails or a university receiving bank rejects the transaction, the transfer status transitions to FAILED and a compensating transaction immediately unreserves and restores the funds back into your available balance.',
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
              className="px-2.5 py-1.5 rounded text-xs font-semibold text-blue-100 hover:text-white hover:bg-[#1E3A8A] transition-colors"
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
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0D9488] text-white shadow-sm"
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
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Institutional Compliance &amp; Architectural Answers</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EFF6FF] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-bold font-mono">
              <span>SSG: Pre-rendered Build-Time Static Page</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] mb-2">
            How It Works &amp; Security FAQ
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-3xl leading-relaxed">
            Transparent explanations on fund custody, velocity limits, zero-trust human confirmation, and autonomous agent safety for evaluators and international students.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl p-6 shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <span className="w-8 h-8 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] text-xs font-bold flex items-center justify-center shrink-0">
                  Q{idx + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <h2 className="font-bold text-base sm:text-lg text-[#0F172A]">
                    {item.question}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {item.answer}
                  </p>
                  <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-xs font-medium flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <span>{item.highlight}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h3 className="font-bold text-base text-[#0F172A]">
              Ready to evaluate live tuition payment processing?
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Launch the Agent Chat Studio to test quotes, route ranking, and human-in-the-loop confirmation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="py-2 px-4 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold transition-colors"
            >
              Back to Overview
            </Link>
            <Link
              href="/chat"
              className="py-2 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#172E6F] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#64748B] py-6 border-t border-[#E2E8F0] bg-white">
        FinTechathon 2026 • Cross-Border Student Tuition Payment Agent
      </footer>
    </div>
  );
}
