'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Cpu, 
  ShieldCheck, 
  Compass, 
  Coins, 
  GitBranch, 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Activity, 
  Layers,
  FileCode,
  ExternalLink
} from 'lucide-react';
import { GideonContextChat } from '@/components/chat/GideonContextChat';

interface AgentCard {
  id: string;
  name: string;
  role: string;
  badge: string;
  color: string;
  borderColor: string;
  bgGlow: string;
  description: string;
  currentTask: string;
  capabilities: string[];
  status: 'IDLE' | 'ACTIVE' | 'WAITING_FOR_GATE';
}

const AGENTS: AgentCard[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Chief Strategic Planner',
    badge: 'STRATEGY',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgGlow: 'bg-cyan-950/20',
    description: 'Deconstructs high-level operator intents into phased execution plans, verifies scope bounds, and aligns release schedules.',
    currentTask: 'Synthesizing Gideon V5 Engineering Intelligence Roadmap',
    capabilities: ['Intent Deconstruction', 'Roadmap Phasing', 'Authority Bound Mapping', 'Commercial Alignment'],
    status: 'ACTIVE'
  },
  {
    id: 'forge',
    name: 'Forge',
    role: 'Lead Architect & Builder',
    badge: 'ARCHITECTURE',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgGlow: 'bg-amber-950/20',
    description: 'Authoritative implementation engine. Author of Solution Briefs, ADRs, 3D isometric vectors, and hardened resilient code.',
    currentTask: 'Compiling Context Envelopes & Capability Registry',
    capabilities: ['3D Isometric SVG Engine', 'Timing-Safe Cryptography', 'Atomic Mutexes', 'Solution Briefs'],
    status: 'ACTIVE'
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    role: 'Independent Observer & Conscience',
    badge: 'OBSERVER',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgGlow: 'bg-emerald-950/20',
    description: 'Independent quality conscience. Conducts 9-Dimension reviews, monitors Event Spine for friction, and authors the Sentinel Daily Brief.',
    currentTask: 'Monitoring Event Spine • 8/8 Contracts Verified',
    capabilities: ['9-Dimension Review', 'Friction Mining', 'Daily Brief Generation', 'Cryptographic Sealing'],
    status: 'ACTIVE'
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Opportunity & Market Intelligence',
    badge: 'INTELLIGENCE',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgGlow: 'bg-purple-950/20',
    description: 'Monitors inbound leads, public RFPs, client signals, and open problems to build high-conviction project proposals.',
    currentTask: 'Scanning B2B Webhook reliability pain points in SaaS ecosystem',
    capabilities: ['Signal Detection', 'Competitor Dossiers', 'Economic Feasibility', 'Lead Qualification'],
    status: 'IDLE'
  },
  {
    id: 'release',
    name: 'Release',
    role: 'Deployment & Gate Orchestrator',
    badge: 'DEPLOYMENT',
    color: 'text-red-400',
    borderColor: 'border-red-500/40',
    bgGlow: 'bg-red-950/20',
    description: 'Manages candidate staging, Gate 1 (GitHub) & Gate 2 (Netlify) readiness, rollback strategies, and deployment verification.',
    currentTask: 'Ready for Gate 1/2 cryptographic human sign-off',
    capabilities: ['Zero-Downtime Rollback', 'Candidate Staging', 'Audit Trail Hashing', 'Verification Testing'],
    status: 'WAITING_FOR_GATE'
  },
  {
    id: 'ledger',
    name: 'Ledger',
    role: 'Financial Control Plane',
    badge: 'ECONOMICS',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgGlow: 'bg-blue-950/20',
    description: 'Maintains double-entry immutable accounting for inference expenditure, client billings, compute margins, and ROI.',
    currentTask: 'Tracking zero-overhead local runner telemetry',
    capabilities: ['Double-Entry Accounting', 'Token Margin Tracking', 'Stripe Webhook Sync', 'Audit Logging'],
    status: 'IDLE'
  }
];

export default function WorkforceHubPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('forge');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Workforce Command Hub
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                6 Digital Employees
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Autonomous Engineering Workforce
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl font-sans">
              Specialized digital agents operating under strict separation of powers. Strategy is guided by Atlas, code is built by Forge, verified by Sentinel, and gated by the human operator.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-glow-primary"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Launch Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <div
            key={agent.id}
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${agent.bgGlow} ${agent.borderColor} hover:scale-[1.01]`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    {agent.name}
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${agent.color} bg-black/40`}>
                      {agent.badge}
                    </span>
                  </h3>
                  <div className="text-xs text-gray-400 font-sans mt-0.5">{agent.role}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className={`w-2 h-2 rounded-full ${agent.status === 'ACTIVE' ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
                  <span className={agent.status === 'ACTIVE' ? 'text-emerald-400' : 'text-gray-400'}>
                    {agent.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                {agent.description}
              </p>

              {/* Current Task */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1">
                <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Current Focus</div>
                <div className="text-xs text-gray-200 font-mono truncate">{agent.currentTask}</div>
              </div>

              {/* Capabilities */}
              <div className="space-y-1 pt-1">
                <div className="text-[10px] font-mono uppercase text-gray-500 font-bold">Capabilities</div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((cap, i) => (
                    <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
              <Link
                href={`/workforce/${agent.id}`}
                className="text-xs font-bold text-white hover:text-red-400 flex items-center gap-1.5 transition font-mono"
              >
                <span>Open Command Station</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedAgent(agent.id)}
                className={`text-[11px] font-mono px-2 py-1 rounded transition ${
                  selectedAgent === agent.id ? 'bg-white/20 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Direct Chat ↓
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded Direct Agent Console */}
      <div className="p-6 rounded-2xl bg-[#050811] border border-white/[0.08] shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-extrabold text-white">
              Direct Agent Dispatch: {selectedAgent.toUpperCase()}
            </h2>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Context Envelope Auto-Injected
          </span>
        </div>
        <div className="h-96">
          <GideonContextChat
            page="workforce"
            agentId={selectedAgent}
            placeholder={`Instruct ${selectedAgent.toUpperCase()} directly...`}
          />
        </div>
      </div>
    </div>
  );
}
