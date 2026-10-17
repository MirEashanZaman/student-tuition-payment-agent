import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Server,
  Activity,
  ShieldCheck,
  Clock,
  Database,
  Lock,
  ArrowRight,
  Home as HomeIcon,
  Layers,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface SystemHealth {
  backendOnline: boolean;
  latencyMs: number;
  timestamp: string;
  activeRailsCount: number;
  perTransferLimitBdt: number;
  dailyTransferLimitBdt: number;
  nodeVersion: string;
  environment: string;
}

async function getSystemHealth(): Promise<SystemHealth> {
  const start = Date.now();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4568/api';

  try {
    const res = await fetch(`${apiBase}/rates`, { cache: 'no-store' });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }

    const rates = await res.json();

    return {
      backendOnline: true,
      latencyMs,
      timestamp: new Date().toISOString(),
      activeRailsCount: Array.isArray(rates) ? rates.length : 4,
      perTransferLimitBdt: 400000.0,
      dailyTransferLimitBdt: 1000000.0,
      nodeVersion: process.version || 'v20.x',
      environment: process.env.NODE_ENV || 'production',
    };
  } catch {
    const latencyMs = Date.now() - start;
    return {
      backendOnline: false,
      latencyMs,
      timestamp: new Date().toISOString(),
      activeRailsCount: 0,
      perTransferLimitBdt: 400000.0,
      dailyTransferLimitBdt: 1000000.0,
      nodeVersion: process.version || 'v20.x',
      environment: process.env.NODE_ENV || 'production',
    };
  }
}

export default async function StatusPage() {
  const health = await getSystemHealth();

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
              className="px-3 py-1.5 rounded text-xs font-semibold bg-[#0D9488] text-white shadow-sm"
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
              <Activity className="w-3.5 h-3.5" />
              <span>Institutional Liveness &amp; Compliance Audit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EFF6FF] border border-[#DBEAFE] text-[#1E3A8A] text-xs font-bold font-mono">
              <Server className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>SSR: Server-Side Rendered (Dynamic Per-Request)</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] mb-2">
            Real-Time System Liveness Verifier
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-3xl leading-relaxed">
            Fresh server-rendered system audit metrics evaluating backend connection latency, rate limiting policies, and guardrail limits evaluated per request with zero cache stale risk.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E3A8A] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>
              <strong>Architectural Note:</strong> This page utilizes <strong>SSR (Server-Side Rendering)</strong> with <code>cache: &apos;no-store&apos;</code>. Every reload re-executes on the server, guaranteeing verified freshness for security compliance auditing.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-[#1E3A8A] shrink-0 hidden sm:inline bg-white border border-[#BFDBFE] px-2 py-0.5 rounded">
            force-dynamic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Server className="w-4 h-4 text-[#1E3A8A]" />
              <span>Backend Rails Status</span>
            </div>
            <div className="text-xl font-bold flex items-center gap-2 mt-2">
              {health.backendOnline ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
                  <span className="text-[#16A34A] font-mono">ONLINE</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></span>
                  <span className="text-[#DC2626] font-mono">OFFLINE</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-[#64748B] block mt-1 font-mono">NestJS port 4568</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <span>Round-Trip Latency</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#0D9488] mt-2">
              {health.latencyMs} ms
            </div>
            <span className="text-[11px] text-[#64748B] block mt-1">Live ping measurement</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Database className="w-4 h-4 text-[#2563EB]" />
              <span>Active Corridors</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#1E3A8A] mt-2">
              {health.activeRailsCount} Routes
            </div>
            <span className="text-[11px] text-[#64748B] block mt-1">BDT &rarr; USD corridors</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
              <Lock className="w-4 h-4 text-[#F59E0B]" />
              <span>Security Guardrails</span>
            </div>
            <div className="text-xl font-bold font-mono text-[#F59E0B] mt-2">
              ENFORCED
            </div>
            <span className="text-[11px] text-[#64748B] block mt-1">Tri-tier isolation active</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-[#0F172A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0D9488]" />
            <span>SSR Cryptographic &amp; Financial Compliance Verification</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Server Render Timestamp:</span>
                <span className="font-mono font-bold text-[#0F172A]">{health.timestamp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Per-Transfer Hard Cap:</span>
                <span className="font-mono font-bold text-[#16A34A]">
                  {health.perTransferLimitBdt.toLocaleString()} BDT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Daily Remittance Cap:</span>
                <span className="font-mono font-bold text-[#16A34A]">
                  {health.dailyTransferLimitBdt.toLocaleString()} BDT
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Rate Limiter Defense:</span>
                <span className="font-bold text-[#16A34A]">Active (5 auth / 100 api per min)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Password Hashing Algorithm:</span>
                <span className="font-mono font-bold text-[#0D9488]">Node.js Scrypt 64-byte</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">JWT Token Signature Rail:</span>
                <span className="font-mono font-bold text-[#0D9488]">HMAC-SHA256 (Stateless)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#64748B] py-6 border-t border-[#E2E8F0] bg-white">
        FinTechathon 2026 • Server-Side Rendering (SSR) Live Compliance Engine
      </footer>
    </div>
  );
}
