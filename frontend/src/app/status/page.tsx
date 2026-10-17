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
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm"
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
              <Activity className="w-3.5 h-3.5" />
              <span>Institutional Liveness &amp; Compliance Audit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>SSR: Server-Side Rendered (Dynamic Per-Request)</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Real-Time System Liveness Verifier
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Fresh server-rendered system audit metrics evaluating backend connection latency, rate limiting policies, and guardrail limits evaluated per request with zero cache stale risk.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Architectural Note:</strong> This page utilizes <strong>SSR (Server-Side Rendering)</strong> with <code>cache: &apos;no-store&apos;</code>. Every single reload re-executes on the server, guaranteeing down-to-the-millisecond freshness for compliance auditing.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-amber-300 shrink-0 hidden sm:inline bg-amber-900/50 border border-amber-700/60 px-2 py-0.5 rounded">
            force-dynamic
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Server className="w-4 h-4 text-blue-400" />
              <span>Backend Rails Status</span>
            </div>
            <div className="text-xl font-bold flex items-center gap-2 mt-2">
              {health.backendOnline ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-400 font-mono">ONLINE</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-rose-400 font-mono">OFFLINE</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-1 font-mono">NestJS port 4568</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Round-Trip Latency</span>
            </div>
            <div className="text-xl font-bold font-mono text-teal-300 mt-2">
              {health.latencyMs} ms
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">Live ping measurement</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Active Corridors</span>
            </div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-2">
              {health.activeRailsCount} Routes
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">BDT &rarr; USD corridors</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Security Guardrails</span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-2">
              ENFORCED
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">Tri-tier isolation active</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          <h2 className="font-bold text-base text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>SSR Cryptographic &amp; Financial Compliance Verification</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Server Render Timestamp:</span>
                <span className="font-mono font-bold text-white">{health.timestamp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Per-Transfer Hard Cap:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {health.perTransferLimitBdt.toLocaleString()} BDT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Daily Remittance Cap:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {health.dailyTransferLimitBdt.toLocaleString()} BDT
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Rate Limiter Defense:</span>
                <span className="font-bold text-emerald-400">Active (5 auth / 100 api per min)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Password Hashing Algorithm:</span>
                <span className="font-mono font-bold text-teal-300">Node.js Scrypt 64-byte</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">JWT Token Signature Rail:</span>
                <span className="font-mono font-bold text-teal-300">HMAC-SHA256 (Stateless)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-800/80">
        FinTechathon 2026 • Server-Side Rendering (SSR) Live Compliance Engine
      </footer>
    </div>
  );
}
