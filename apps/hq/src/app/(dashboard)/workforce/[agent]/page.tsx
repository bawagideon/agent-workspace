'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Terminal, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Cpu, 
  BookOpen, 
  Activity, 
  FileCode, 
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FastForward,
  Clock,
  Lock,
  GitBranch,
  GraduationCap
} from 'lucide-react';
import { GideonContextChat } from '@/components/chat/GideonContextChat';

interface AgentOperationalProfile {
  name: string;
  role: string;
  badge: string;
  color: string;
  borderColor: string;
  systemDirective: string;
  operationalBrief: {
    now: string;
    why: string;
    next: string;
    blocked: string | null;
    dependencies: string[];
    release: string;
    learning: string;
  };
  guidelines: string[];
  activeProjects: string[];
  reusableCapabilities: string[];
}

const AGENT_PROFILES: Record<string, AgentOperationalProfile> = {
  forge: {
    name: 'Forge',
    role: 'Lead Architect & Builder',
    badge: 'ARCHITECTURE',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    systemDirective: 'Authoritative implementation engine. Produces Solution Briefs before large changes, enforces single source of truth, designs 3D isometric vectors, and complies with all Sentinel test contracts.',
    operationalBrief: {
      now: 'Generating Engineering Solution Brief for Story Pack 3D Isometric Vectors and Canonical Generator Logic.',
      why: 'Eliminate derived artifact drift and guarantee 100% deterministic Sentinel QA contract passage across all 8 slides.',
      next: 'Execute StoryPackGenerator.ts code updates and trigger automated regeneration to apps/hq/public/story/.',
      blocked: null,
      dependencies: ['cap-3d-isometric-engine', 'CapabilityRegistry v2', 'GideonEventBus'],
      release: 'Gate 1 (GitHub) & Gate 2 (Netlify) ready for operator cryptographic signature.',
      learning: 'RULE_GENERATED_ARTIFACT_PRESERVATION: Never modify derived SVG/HTML directly; edit the source generator.'
    },
    guidelines: [
      'RULE_GENERATED_ARTIFACT_PRESERVATION: Never modify derived SVG/HTML directly; edit the source generator.',
      'Timing-Safe HMAC: Enforce constant-time comparison for all security digests.',
      'Atomic Idempotency: Lock operations to prevent double-billing or duplicate credit.',
      'Self-Contained Artifacts: Maintain zero-dependency standalone deliverables.'
    ],
    activeProjects: ['Webhook Billing Bridge', 'Gideon HQ Workspace V5', 'Story Pack 3D Isometric Engine'],
    reusableCapabilities: ['Timing-Safe HMAC', 'Anti-Replay Decay', 'Atomic Idempotency Mutex', '3D Isometric SVG Generator']
  },
  atlas: {
    name: 'Atlas',
    role: 'Chief Strategic Planner',
    badge: 'STRATEGY',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    systemDirective: 'Strategic mission planner. Translates operator intentions into bounded execution roadmaps, checks capability registry for reusable blocks, and coordinates workforce phasing.',
    operationalBrief: {
      now: 'Synthesizing user engineering intents and dynamically generating Context Envelopes with Fact vs. Opinion boundaries.',
      why: 'Ensure autonomous workforce operates with complete architectural context and zero speculative hallucination.',
      next: 'Auto-dispatch Forge on low/medium risk engineering tasks without requiring manual user dispatch prompts.',
      blocked: null,
      dependencies: ['ContextResolver', 'CapabilityRegistry', 'MissionSupervisor'],
      release: 'Orchestrating Gate 1 / 2 / 3 verification stages across workforce stations.',
      learning: 'Autonomous Dispatch Invariant: Low/medium risk tasks must trigger execution immediately upon mission formulation.'
    },
    guidelines: [
      'Deconstruct complex intents into discrete, verifiable engineering steps.',
      'Map existing capabilities to minimize speculative code generation.',
      'Ensure high-consequence deployment gates require human operator sign-off.',
      'Maintain commercial velocity without sacrificing architectural rigor.'
    ],
    activeProjects: ['Gideon V5 Master Plan', 'SaaS Webhook Infrastructure Playbook'],
    reusableCapabilities: ['Intent Deconstruction', 'Roadmap Phasing', 'Authority Bound Mapping']
  },
  sentinel: {
    name: 'Sentinel',
    role: 'Independent Observer & Conscience',
    badge: 'OBSERVER',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    systemDirective: 'Independent quality conscience. Performs 9-Dimension reviews, monitors Event Spine for friction and repeated retries, generates the Sentinel Daily Brief, and seals evidence contracts with SHA-256 hashes.',
    operationalBrief: {
      now: 'Running real-time 9-Dimension quality audit and auditing Event Spine for failure loops or derived artifact modifications.',
      why: 'Protect codebase from subtle regressions, security timing side-channels, and unauthorized production broadcasts.',
      next: 'Seal verified deliverables with cryptographic SHA-256 evidence tokens and update Morning Brief findings.',
      blocked: null,
      dependencies: ['EventSpine', 'TestContractHarness', 'CapabilityRegistry'],
      release: 'Authority Gatekeeper: Agent != Signer invariant enforced at all times.',
      learning: 'RULE_CRYPTO_SEAL_HASH_BINDING: Gate 3 draft hash must match canonical disk SHA-256 byte-for-byte.'
    },
    guidelines: [
      'Correctness: 100% deterministic test passage; reject false positives.',
      'Architecture: Flag duplicate logic and enforce single source of truth.',
      'Aesthetics: Maintain Apple/Linear visual standards and 3D isometric fidelity.',
      'Integrity: Agent != Signer; never allow autonomous self-approval of Gate 1, 2, or 3.'
    ],
    activeProjects: ['Engineering Acceptance Contracts', 'Sentinel Daily Brief', 'Friction Anomaly Detector'],
    reusableCapabilities: ['9-Dimension Review', 'Friction Mining', 'Daily Brief Generator', 'SHA-256 Sealing']
  },
  scout: {
    name: 'Scout',
    role: 'Opportunity & Market Intelligence',
    badge: 'INTELLIGENCE',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    systemDirective: 'Opportunity detection and problem validation engine. Analyzes market signals, pain points, and technical RFPs to identify lucrative engineering challenges.',
    operationalBrief: {
      now: 'Scanning Developer APIs and webhook infrastructure marketplaces for high-margin reliability primitives.',
      why: 'Surface enterprise architectural demands that command $10k+ commercial contract value.',
      next: 'Construct Opportunity Dossier and unit-economics model for autonomous B2B workflow micro-services.',
      blocked: null,
      dependencies: ['OpportunityMemory', 'SignalCrawler', 'MarketBenchmarkIndex'],
      release: 'Staged in Opportunity Vault awaiting operator selection.',
      learning: 'High-Margin Invariant: Filter out commodity freelance requests in favor of hardened system architecture.'
    },
    guidelines: [
      'Validate problem urgency before proposing technical solutions.',
      'Compile competitor dossiers and pricing benchmarks.',
      'Filter out low-margin or commodity freelance tasks in favor of hardened system architecture.'
    ],
    activeProjects: ['B2B Webhook Reliability Market Scan', 'Autonomous AI Workforce Economics'],
    reusableCapabilities: ['Signal Detection', 'Competitor Dossiers', 'Economic Feasibility']
  },
  release: {
    name: 'Release',
    role: 'Deployment & Gate Orchestrator',
    badge: 'DEPLOYMENT',
    color: 'text-red-400',
    borderColor: 'border-red-500/40',
    systemDirective: 'Deployment controller and Gate guardian. Prepares release candidates, validates rollback pathways, and verifies staging environments prior to production push.',
    operationalBrief: {
      now: 'Staging Release Candidate v5.2-RC1 and validating Netlify staging environment hashes.',
      why: 'Guarantee zero-downtime cutover and strict adherence to human cryptographic sign-off.',
      next: 'Stage Gate 1, Gate 2, and Gate 3 signature requests in operator approval tray.',
      blocked: 'Awaiting Operator Cryptographic Signature for Production Deploy (Gate 2/3).',
      dependencies: ['GitHubActionsAPI', 'NetlifyCliRunner', 'GateAuthorityController'],
      release: 'Staged & Sealed: 8/8 contract proofs verified.',
      learning: 'Human Gate Invariant: No deployment script may execute without operator authorization token.'
    },
    guidelines: [
      'Strictly enforce human cryptographic signature before triggering Netlify or GitHub pushes.',
      'Validate preflight integrity checks on all build bundles.',
      'Provide zero-downtime rollback targets for every release candidate.'
    ],
    activeProjects: ['Release Candidate v5.2-RC1', 'Gate 1/2/3 Authorization Pipeline'],
    reusableCapabilities: ['Zero-Downtime Rollback', 'Candidate Staging', 'Audit Trail Hashing']
  },
  ledger: {
    name: 'Ledger',
    role: 'Financial Control Plane',
    badge: 'ECONOMICS',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    systemDirective: 'Immutable double-entry financial ledger and token expenditure accountant. Tracks per-agent inference margins, client invoices, and Stripe webhook settlements.',
    operationalBrief: {
      now: 'Auditing token burn and compute overhead across active mission DAGs.',
      why: 'Enforce $0 cash spend policy until operator explicitly authorizes external gateway expenditure.',
      next: 'Emit gross-margin summary and sync settlement transactions with Client Portal.',
      blocked: null,
      dependencies: ['PricingEngine', 'DoubleEntryStore', 'StripeSyncAdapter'],
      release: 'Audit trails locked and reconciled in Financial Ledger.',
      learning: 'Ledger Rule of Iron: Halt execution immediately if mission spend hits 100% of budget cap.'
    },
    guidelines: [
      'Maintain immutable double-entry records for every compute and revenue transaction.',
      'Enforce budget limits to eliminate runaway inference loops.',
      'Track real-time gross margins across projects.'
    ],
    activeProjects: ['Client Portal Billing', 'Token Expenditure Telemetry'],
    reusableCapabilities: ['Double-Entry Accounting', 'Token Margin Tracking', 'Stripe Webhook Sync']
  }
};

export default function AgentWorkstationPage() {
  const params = useParams();
  const agentKey = (params?.agent as string || 'forge').toLowerCase();
  const agent = AGENT_PROFILES[agentKey] || AGENT_PROFILES.forge;
  const brief = agent.operationalBrief;

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-3 max-w-[1700px] mx-auto min-w-0">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#070b14] border border-white/[0.08] rounded-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/workforce"
            className="p-1.5 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white">
                WORKFORCE STATION: {agent.name.toUpperCase()}
              </h1>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${agent.color} bg-black/40`}>
                {agent.badge}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono">
              {agent.role} • Real-Time Operational Brief & Console
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-lg transition text-xs shadow-glow-primary"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Conversational Console Dedicated to Agent (7 cols) */}
        <div className="lg:col-span-7 h-full min-h-0 flex flex-col">
          <GideonContextChat
            page={`workforce-${agentKey}`}
            agentId={agentKey}
            placeholder={`Instruct ${agent.name} directly on active tasks...`}
          />
        </div>

        {/* Right Column: Real-Time Operational Brief (NOW, WHY, NEXT, BLOCKED, DEPENDENCIES, RELEASE, LEARNING) */}
        <div className="lg:col-span-5 h-full min-h-0 flex flex-col bg-[#050811] border border-white/[0.08] rounded-2xl overflow-y-auto p-4 space-y-3.5 text-xs font-mono shadow-2xl">
          
          {/* NOW: Active Execution */}
          <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/30 space-y-1.5 shadow-sm">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                NOW (ACTIVE EXECUTION)
              </span>
              <span className="bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.2 rounded text-[9px]">
                IN PROGRESS
              </span>
            </div>
            <p className="text-gray-200 font-sans text-xs leading-relaxed font-medium">
              {brief.now}
            </p>
          </div>

          {/* WHY: Core Technical Motivation */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>WHY (CORE RATIONALE)</span>
            </div>
            <p className="text-gray-300 font-sans text-xs leading-relaxed">
              {brief.why}
            </p>
          </div>

          {/* NEXT: Downstream Pipeline Action */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
              <FastForward className="w-3.5 h-3.5" />
              <span>NEXT (DOWNSTREAM ACTION)</span>
            </div>
            <p className="text-gray-300 font-sans text-xs leading-relaxed">
              {brief.next}
            </p>
          </div>

          {/* BLOCKED: Active Blockers */}
          <div className={`p-3.5 rounded-xl border space-y-1.5 ${
            brief.blocked 
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
              : 'bg-black/40 border-white/10 text-gray-400'
          }`}>
            <div className="text-[10px] uppercase font-bold flex items-center gap-1.5">
              <AlertCircle className={`w-3.5 h-3.5 ${brief.blocked ? 'text-amber-400' : 'text-gray-500'}`} />
              <span className={brief.blocked ? 'text-amber-300' : 'text-gray-400'}>
                BLOCKED
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed">
              {brief.blocked || 'None (Unconstrained velocity — autonomous execution enabled)'}
            </p>
          </div>

          {/* DEPENDENCIES: Required Modules & Primitives */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span>DEPENDENCIES & PRIMITIVES</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {brief.dependencies.map((dep, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-blue-950/40 border border-blue-500/30 text-blue-300 text-[10px]">
                  {dep}
                </span>
              ))}
            </div>
          </div>

          {/* RELEASE: Gate Readiness */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>RELEASE & AUTHORITY STATUS</span>
            </div>
            <p className="text-gray-300 font-sans text-xs leading-relaxed">
              {brief.release}
            </p>
          </div>

          {/* LEARNING: Institutional Lesson */}
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-purple-300 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>LEARNING & INSTITUTIONAL MEMORY</span>
            </div>
            <p className="text-purple-200/90 font-sans text-xs leading-relaxed">
              {brief.learning}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
