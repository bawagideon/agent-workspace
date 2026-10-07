'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileBadge, 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Terminal, 
  FolderGit2, 
  Sparkles,
  Palette,
  Copy,
  Check
} from 'lucide-react';

const BRAND_COLORS = [
  { name: 'Primary Crimson', hex: '#DC2626', role: 'Strategic Intelligence & Active Highlights', bg: 'bg-[#DC2626]' },
  { name: 'Deep Crimson', hex: '#8B0000', role: 'Official Brand Header & Primary Chevron Base', bg: 'bg-[#8B0000]' },
  { name: 'Obsidian Void', hex: '#050507', role: 'Primary App Canvas & Deep Contrast', bg: 'bg-[#050507]' },
  { name: 'Surface Slate', hex: '#111827', role: 'Elevated Cards & Container Panels', bg: 'bg-[#111827]' }
];

export default function ProfileBrandPage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Profile & Brand OS
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                Evidence-Backed CV & Visual Assets
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Gideon Bawa — Systems Architect & Brand Identity</span>
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl font-sans">
              Authoritative professional profile backed by cryptographic evidence contracts, verifiable project deliverables, and the official Gideon HQ Crimson/Obsidian design system.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <a
              href="/fixtures/profile/cv_v12.json"
              download="Gideon_Bawa_CV_v12.json"
              className="flex items-center gap-1.5 bg-black/50 hover:bg-black/80 border border-white/10 hover:border-red-500/40 text-gray-300 px-3 py-2 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CV JSON</span>
            </a>
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-glow-primary"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Launch Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 1: OFFICIAL BRAND IDENTITY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Official Gideon HQ Brand Assets & Vector Suite
            </h2>
          </div>
          <span className="text-[10px] font-mono text-gray-400">media_1790697040575.png Canonical Vectorization</span>
        </div>

        {/* Brand Asset Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Crimson Banner */}
          <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="aspect-[2/1] rounded-xl overflow-hidden border border-red-500/30 bg-[#8B0000] p-4 flex items-center justify-center">
                <img
                  src="/brand/gideon-hq-crimson.svg"
                  alt="Gideon HQ Crimson Brand"
                  className="max-h-full max-w-full object-contain drop-shadow-xl"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Crimson Wordmark</span>
                <span className="text-[10px] font-mono text-red-400">SVG • 800x400</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Primary presentation banner with rich crimson background, white interlocking chevrons, and bold typography.
              </p>
            </div>
            <a
              href="/brand/gideon-hq-crimson.svg"
              download="gideon-hq-crimson.svg"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black/50 border border-white/10 hover:border-red-500/50 text-xs text-gray-200 font-mono transition"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Download Vector SVG</span>
            </a>
          </div>

          {/* Card 2: Dark Obsidian Banner */}
          <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="aspect-[2/1] rounded-xl overflow-hidden border border-white/10 bg-[#050507] p-4 flex items-center justify-center">
                <img
                  src="/brand/gideon-hq-dark.svg"
                  alt="Gideon HQ Dark Brand"
                  className="max-h-full max-w-full object-contain drop-shadow-xl"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Obsidian Wordmark</span>
                <span className="text-[10px] font-mono text-gray-400">SVG • 800x400</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                High-contrast dark variant for GitHub repositories, documentation headers, and software splash screens.
              </p>
            </div>
            <a
              href="/brand/gideon-hq-dark.svg"
              download="gideon-hq-dark.svg"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black/50 border border-white/10 hover:border-red-500/50 text-xs text-gray-200 font-mono transition"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Download Vector SVG</span>
            </a>
          </div>

          {/* Card 3: App Icon Emblem */}
          <div className="p-4 rounded-2xl bg-[#050811] border border-white/10 space-y-3 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="aspect-[2/1] rounded-xl overflow-hidden border border-white/10 bg-black/80 p-4 flex items-center justify-center">
                <img
                  src="/brand/gideon-hq-icon.svg"
                  alt="Gideon HQ Icon Emblem"
                  className="max-h-24 max-w-24 object-contain drop-shadow-xl"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Emblem & Favicon</span>
                <span className="text-[10px] font-mono text-cyan-400">SVG • 256x256</span>
              </div>
              <p className="text-[11px] text-gray-400 font-sans">
                Circular emblem and tab favicon representing intelligence and execution converging down-right.
              </p>
            </div>
            <a
              href="/brand/gideon-hq-icon.svg"
              download="gideon-hq-icon.svg"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-black/50 border border-white/10 hover:border-red-500/50 text-xs text-gray-200 font-mono transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Vector SVG</span>
            </a>
          </div>
        </div>

        {/* Color Palette Tokens */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {BRAND_COLORS.map((col) => (
            <div
              key={col.hex}
              onClick={() => copyToClipboard(col.hex)}
              className="p-3 rounded-xl bg-[#050811] border border-white/10 hover:border-red-500/50 cursor-pointer transition space-y-2 group shadow-md"
            >
              <div className={`h-8 rounded-lg ${col.bg} border border-white/10`} />
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{col.name}</span>
                  {copiedHex === col.hex ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-500 group-hover:text-gray-300" />
                  )}
                </div>
                <div className="text-[11px] font-mono text-gray-400 mt-0.5">{col.hex}</div>
                <p className="text-[10px] text-gray-500 font-sans mt-1 line-clamp-1">{col.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: EVIDENCE-BACKED CV */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <FileBadge className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">
              Evidence-Backed Systems Architect CV
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Empirically Verified</span>
        </div>

        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#050811] border border-white/10 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-black p-0.5 shadow-glow-primary">
                <div className="w-full h-full bg-[#050811] rounded-2xl flex items-center justify-center font-black text-white text-xl">
                  GB
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Gideon Bawa</h3>
                <div className="text-xs text-red-400 font-bold font-mono">
                  Senior Systems & Autonomous Software Architect
                </div>
                <div className="text-[11px] text-gray-400 font-sans mt-0.5">
                  London, United Kingdom • bawagideon@gmail.com
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <a
                href="https://gideonbawa-website.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-cyan-400/50 text-cyan-300 transition"
              >
                <span>Live Portfolio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://linkedin.com/in/gideon-bawa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-blue-400/50 text-blue-300 transition"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-300 font-sans leading-relaxed">
            Senior Systems Architect specializing in autonomous agent engineering, resilient distributed payment systems, and cryptographic evidence verification. Designed zero-failure webhook ingress engines, 3D mathematical presentation generators, and the Gideon V5 multi-agent engineering operating system.
          </p>
        </div>

        {/* Verified Project Deliverables */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase text-gray-400 font-bold">
            Empirical Project Deliverables & Contracts
          </div>

          {/* Project 1 */}
          <div className="p-5 rounded-2xl bg-[#050811] border border-white/10 space-y-3 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Webhook Billing Bridge</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    8/8 CONTRACTS PASSING
                  </span>
                </h4>
                <div className="text-xs text-gray-400 font-sans mt-0.5">
                  High-reliability webhook ingress bridge eliminating duplicate allocations and silent webhook dropouts.
                </div>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">Role: Lead Architect</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Timing-Safe Buffer HMAC',
                'Anti-Replay TTL (300s)',
                'Atomic Idempotency Mutex',
                'Uncertainty Quarantine',
                '3D Isometric SVG Slide Engine',
                '60fps Cinema Motion Reel'
              ].map((tech, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300">
                  {tech}
                </span>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 font-mono text-[10px] text-gray-400">
              <div className="text-emerald-400 font-bold uppercase">Sealed Acceptance Evidence:</div>
              <div className="truncate">ev-qa-contract-1790494152855-97bed37d • Timing-Safe HMAC Verified</div>
              <div className="truncate">ev-qa-contract-1790494558627-9cf7345d • Idempotency Mutex Verified</div>
              <div className="truncate">ev-qa-contract-1790547094069-41f1e2d3 • 3D Isometric Generator Verified</div>
              <div className="text-amber-300 truncate">SHA-256 Digest: 56b0975b6e5ed749aaefdb32df5ce5994e871c276a26fa604cc8656b2f85e9e8</div>
            </div>
          </div>

          {/* Project 2 */}
          <div className="p-5 rounded-2xl bg-[#050811] border border-white/10 space-y-3 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Gideon AI HQ (v5.2)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    AUTONOMOUS WORKFORCE OS
                  </span>
                </h4>
                <div className="text-xs text-gray-400 font-sans mt-0.5">
                  Autonomous AI Engineering Operating System with conversational multi-turn workbench, specialized workforce stations, and strict Fact vs. Opinion memory.
                </div>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">Role: Author & Principal Architect</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                'Next.js 14 App Router',
                'Conversational Multi-Turn Workbench',
                '6 Specialized Workforce Stations',
                'Fact vs Opinion Context Engine',
                'Sentinel 9-Dimension Review Radar',
                'Immutable Activity Spine'
              ].map((tech, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
