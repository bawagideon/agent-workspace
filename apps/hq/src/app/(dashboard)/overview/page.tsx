'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldAlert,
  HardDrive,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Terminal,
  Cpu,
  Coins,
  Radar,
  Sparkles,
  Zap,
  Plus,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { GideonChatConsole } from '@/components/chat/GideonChatConsole';

export default function CommandCenterPage() {
  const [metrics, setMetrics] = useState({
    machineStatus: 'ONLINE',
    openclawStatus: 'ONLINE',
    activeTasks: 0,
    pendingApprovals: 0,
    totalProjects: 0,
    realizedRevenue: '$0.00',
    inferenceCost: '$0.00'
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch live status from /api/command
    fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'status', senderId: 'hq-web-user' })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetrics((prev) => ({
            ...prev,
            machineStatus: data.data.machineStatus || 'ONLINE',
            openclawStatus: data.data.openclawStatus || 'ONLINE',
            activeTasks: data.data.activeTasks || 0,
            pendingApprovals: data.data.pendingApprovals || 0
          }));
        }
      })
      .catch((e) => console.warn('Status fetch error:', e));

    // 2. Fetch live tasks from /api/tasks
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tasks)) {
          setRecentTasks(data.tasks.slice(0, 5));
        }
      })
      .catch((e) => console.warn('Tasks fetch error:', e));

    // 3. Fetch project count
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.projects)) {
          setMetrics((prev) => ({
            ...prev,
            totalProjects: data.projects.length
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Hero Banner */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/[0.08] relative overflow-hidden shadow-glass">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono font-bold tracking-widest text-primary-400 uppercase bg-primary-500/15 border border-primary-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                Autonomous Workforce OS
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                V6.5 Enterprise
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Gideon Mission Control
            </h1>
            <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Governed agent workforce orchestrating market research, production engineering, and evidence-backed public showcase deliverables under strict human authority.
            </p>
          </div>

          {/* Quick System Health Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/workspace"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono transition shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Launch AI Workspace (/workspace)</span>
            </Link>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>OpenClaw :18789 ({metrics.openclawStatus})</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-primary-500/30 text-primary-300 text-xs font-mono font-bold shadow-sm">
              <Cpu className="w-3.5 h-3.5 text-primary-400" />
              <span>Runner: {metrics.machineStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 0: Embedded Gideon Command Cockpit & Natural Language Chat */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.08] shadow-glass h-[480px]">
        <GideonChatConsole />
      </div>

      {/* Layer 1: Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Realized Cash */}
        <Link 
          href="/ledger" 
          className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/[0.08] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Realized Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400">
            {metrics.realizedRevenue}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Double-entry verified ledger</span>
          </div>
        </Link>

        {/* Inference Cost */}
        <Link 
          href="/ledger" 
          className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/[0.08] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Token & LLM Cost</span>
            <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-white">
            {metrics.inferenceCost}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1 font-mono">
            <span>Spend reservation controls active</span>
          </div>
        </Link>

        {/* Showcase Fleet */}
        <Link 
          href="/showcase" 
          className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/[0.08] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Showcase Fleet</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-cyan-400">
            {metrics.totalProjects} Codebases
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>Commercial Exposure Governed</span>
          </div>
        </Link>

        {/* Pending Approvals */}
        <Link 
          href="/approvals" 
          className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/[0.08] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Authority Gates</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400">
            {metrics.pendingApprovals} Pending
          </div>
          <div className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
            <span>Human signature required</span>
          </div>
        </Link>
      </div>

      {/* Layer 2: Governed Workforce Hierarchy (6 Digital Personas) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-400" />
              Governed Autonomous Workforce
            </h2>
            <p className="text-xs text-gray-400">6 specialized personas operating under strict policy constraints</p>
          </div>
          <Link href="/agents" className="text-xs font-mono text-primary-400 hover:text-primary-300 flex items-center gap-1 group">
            <span>View Workforce Matrix</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Atlas */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.07] hover:border-primary-500/40 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary-600/15 border border-primary-500/30 text-2xl flex items-center justify-center shrink-0 shadow-glow-primary">
              🧠
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Atlas</span>
                <span className="text-[9px] bg-primary-500/20 text-primary-400 border border-primary-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  TIER 1
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug">Chief of Staff & Strategic Orchestrator</p>
              <div className="text-[11px] text-emerald-400 font-mono pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active • Routing Missions & Plans
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.07] hover:border-emerald-500/40 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-2xl flex items-center justify-center shrink-0 shadow-glow-emerald">
              💰
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Ledger</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  TIER 1
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug">Chief Financial Officer & Spend Governor</p>
              <div className="text-[11px] text-emerald-400 font-mono pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active • Spend Reservations Online
              </div>
            </div>
          </div>

          {/* Forge */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.07] hover:border-blue-500/40 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-2xl flex items-center justify-center shrink-0">
              🔨
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Forge</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  TIER 2
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug">Lead Software & Systems Engineer</p>
              <div className="text-[11px] text-blue-400 font-mono pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Active • Workspace Sandboxed
              </div>
            </div>
          </div>

          {/* Sentinel */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.07] hover:border-amber-500/40 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-2xl flex items-center justify-center shrink-0">
              🛡️
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Sentinel</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  TIER 2
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug">Staff QA, Security & Invariant Auditor</p>
              <div className="text-[11px] text-amber-400 font-mono pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Active • 4-Pillar Verification Enforced
              </div>
            </div>
          </div>

          {/* Release Captain */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.07] hover:border-purple-500/40 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-2xl flex items-center justify-center shrink-0">
              🚀
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Release Captain</span>
                <span className="text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  TIER 2
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug">Release & Publication Governor</p>
              <div className="text-[11px] text-purple-400 font-mono pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Active • 3-Gate Authority Bound
              </div>
            </div>
          </div>

          {/* Scout */}
          <div className="glass-panel rounded-2xl p-5 border border-white/[0.07] hover:border-accent-cyan/40 transition-all flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-2xl flex items-center justify-center shrink-0 shadow-glow-cyan">
              🔭
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Scout</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold font-mono">
                  TIER 3
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-snug">Market Intelligence & Starter Story Miner</p>
              <div className="text-[11px] text-cyan-400 font-mono pt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Active • Clone Risk Filter Engaged
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
