'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GitBranch, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Cpu, 
  RotateCcw, 
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  FileCheck
} from 'lucide-react';

interface ReleaseCandidate {
  version: string;
  codename: string;
  project: string;
  status: 'STAGED' | 'PRODUCTION_READY' | 'DEPLOYED';
  gates: {
    gateA: boolean; // Problem Excellence
    gateB: boolean; // Solution Excellence (8/8 tests pass)
    gate1: boolean; // GitHub Push (Human signature)
    gate2: boolean; // Netlify Deploy (Human signature)
    gate3: boolean; // Social / LinkedIn Broadcast (Human signature)
  };
  sha256: string;
  rollbackTarget: string;
  highlights: string[];
}

const CANDIDATES: ReleaseCandidate[] = [
  {
    version: 'v5.2.0-rc1',
    codename: 'Crimson Vanguard',
    project: 'gideon-hq',
    status: 'PRODUCTION_READY',
    gates: {
      gateA: true,
      gateB: true,
      gate1: false,
      gate2: false,
      gate3: false
    },
    sha256: '56b0975b6e5ed749aaefdb32df5ce5994e871c276a26fa604cc8656b2f85e9e8',
    rollbackTarget: 'commit-7f41a82 (v5.1.0-stable)',
    highlights: [
      'Primary AI Workspace (/workspace) with multi-tab sidecar',
      'Workforce Command Hub (/workforce) for 6 digital employees',
      'Context & Knowledge Console (/context) with Fact vs. Opinion engine',
      'Sentinel Daily Brief & 9-Dimension Quality Radar (/sentinel)',
      'Brand Identity Integration: Crimson (#DC2626) & Obsidian (#030712)'
    ]
  },
  {
    version: 'v1.4.0-rc2',
    codename: 'Isometric Bridge',
    project: 'webhook-billing-bridge',
    status: 'PRODUCTION_READY',
    gates: {
      gateA: true,
      gateB: true,
      gate1: false,
      gate2: false,
      gate3: false
    },
    sha256: '56b0975b6e5ed749aaefdb32df5ce5994e871c276a26fa604cc8656b2f85e9e8',
    rollbackTarget: 'commit-3c99e12 (v1.3.2)',
    highlights: [
      '3D Isometric SVG Slide Generator (8/8 slides verified XML)',
      'Hardware-accelerated 60fps Cinema Motion Reel Player',
      'Timing-Safe HMAC, Anti-Replay TTL, and Atomic Mutex primitives',
      'Rule RULE_GENERATED_ARTIFACT_PRESERVATION enforced in supervisor'
    ]
  }
];

export default function ReleasesOSPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<ReleaseCandidate>(CANDIDATES[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Release Operating System
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                Gate B & Deployment Control
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-red-500" />
              <span>Gideon Releases & Gate Control</span>
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl font-sans">
              Autonomous agents prepare release candidates, verify test contracts, and stage bundles. High-consequence deployments (GitHub, Netlify, LinkedIn) remain strictly locked until operator cryptographic signature.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <Link
              href="/approvals"
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-lg"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approval Center</span>
            </Link>
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-glow-primary"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Release Candidates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CANDIDATES.map((cand) => (
          <div
            key={cand.version}
            onClick={() => setSelectedCandidate(cand)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xl ${
              selectedCandidate.version === cand.version
                ? 'bg-[#0b101e] border-red-500/50'
                : 'bg-[#050811] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-white font-mono">{cand.version}</span>
                  <span className="text-xs text-red-400 font-bold">"{cand.codename}"</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">Project: {cand.project}</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {cand.status}
              </span>
            </div>

            {/* Gates Readiness Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
              <div className={`p-1.5 rounded border ${cand.gates.gateA ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                Gate A
              </div>
              <div className={`p-1.5 rounded border ${cand.gates.gateB ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-black/40 border-white/10 text-gray-500'}`}>
                Gate B
              </div>
              <div className={`p-1.5 rounded border ${cand.gates.gate1 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/30 border-amber-500/30 text-amber-300'}`}>
                Gate 1
              </div>
              <div className={`p-1.5 rounded border ${cand.gates.gate2 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/30 border-amber-500/30 text-amber-300'}`}>
                Gate 2
              </div>
              <div className={`p-1.5 rounded border ${cand.gates.gate3 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/30 border-amber-500/30 text-amber-300'}`}>
                Gate 3
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Candidate Detailed Inspection */}
      <div className="p-6 rounded-2xl bg-[#050811] border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 gap-2">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-red-500" />
              <span>Inspection: {selectedCandidate.version} ({selectedCandidate.codename})</span>
            </h2>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              Rollback Target: {selectedCandidate.rollbackTarget}
            </div>
          </div>
          <div className="text-[11px] font-mono text-gray-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 truncate max-w-md">
            SHA-256: {selectedCandidate.sha256}
          </div>
        </div>

        {/* Gate Descriptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Gate A & B: Automated Excellence</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-gray-300 font-sans">
              Problem intent verified by Atlas. 8/8 Sentinel acceptance contracts passing deterministically.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Gate 1 & 2: Staging & Deploy</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-gray-300 font-sans">
              GitHub repository push and Netlify site deployment. Awaiting operator cryptographic approval.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/50 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Gate 3: LinkedIn Broadcast</span>
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-gray-300 font-sans">
              Narrative post & 3D story assets. Bound to disk hash {selectedCandidate.sha256.slice(0, 12)}...
            </p>
          </div>
        </div>

        {/* Release Highlights */}
        <div className="space-y-2 pt-2">
          <div className="text-[10px] uppercase font-mono font-bold text-gray-400">
            Changelog & Key Deliverables
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {selectedCandidate.highlights.map((h, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2 text-xs text-gray-300 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
