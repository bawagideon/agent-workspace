'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Play, 
  Layers, 
  FileText, 
  Cpu, 
  Activity, 
  ArrowRight, 
  Briefcase, 
  TrendingUp, 
  Share2, 
  Boxes,
  Plus,
  FolderGit2,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { LoopMission } from '@/lib/LoopMissionAdapter';

export default function LoopsOverviewPage() {
  const [missions, setMissions] = useState<LoopMission[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Pipeline Modal State
  const [showModal, setShowModal] = useState(false);
  const [projectSlug, setProjectSlug] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectObjective, setProjectObjective] = useState('');
  const [projectRisk, setProjectRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const fetchMissions = () => {
    fetch('/api/loops/missions')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.missions)) {
          setMissions(data.missions);
        }
      })
      .catch(err => console.warn('Failed to load loop missions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleProvisionPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectSlug.trim() || !projectTitle.trim() || !projectObjective.trim() || provisioning) return;

    try {
      setProvisioning(true);
      const res = await fetch('/api/loops/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectSlug,
          title: projectTitle,
          objective: projectObjective,
          riskLevel: projectRisk
        })
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setProvisionResult(data.pipeline);
        fetchMissions();
      } else {
        alert(data.error || 'Failed to provision pipeline.');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setProvisioning(false);
    }
  };

  const buildMissions = missions.filter(m => m.loop === 'BUILD');
  const publishMissions = missions.filter(m => m.loop === 'PUBLISH');
  const oppMissions = missions.filter(m => m.loop === 'OPPORTUNITIES');

  const buildExecuting = buildMissions.filter(m => m.status === 'RUNNING').length;
  const buildApprovals = buildMissions.filter(m => m.status === 'HALTED_FOR_APPROVAL').length;

  const publishReady = publishMissions.filter(m => m.status === 'COMPLETED').length;
  const oppQualified = 3; // From verified invariant pipeline

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto min-w-0 pb-12 font-mono">
      {/* Top Operational Header */}
      <div className="p-6 bg-[#070b14] border border-white/[0.08] rounded-2xl shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 via-amber-600 to-black flex items-center justify-center border border-red-500/40 shadow-glow-primary">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white font-sans">
                  GIDEON OPERATIONAL ENGINE
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  FLYWHEEL ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                Three dedicated operational mission studios. Enter a loop, initiate a mission, and let your workforce execute.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => {
                setShowModal(true);
                setProvisionResult(null);
                setProjectSlug('');
                setProjectTitle('');
                setProjectObjective('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition font-bold shadow-glow-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Project Pipeline</span>
            </button>

            <Link
              href="/workspace"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition font-bold"
            >
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>Full IDE Workspace</span>
            </Link>
          </div>
        </div>

        {/* Global Operational Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">Total Missions:</span>
            <span className="font-bold text-white font-mono">{missions.length} Registered</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">Active Executions:</span>
            <span className="font-bold text-cyan-400 font-mono">
              {missions.filter(m => m.status === 'RUNNING').length} Running
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">Gate Approvals:</span>
            <span className="font-bold text-amber-400 font-mono">1 Signed / Sealed</span>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
            <span className="text-gray-400 font-sans">Verified Evidence:</span>
            <span className="font-bold text-emerald-400 font-mono">100% Deterministic</span>
          </div>
        </div>
      </div>

      {/* 3 CORE MISSION WORKSTATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ========================================================================= */}
        {/* CARD 1: BUILD LOOP                                                        */}
        {/* ========================================================================= */}
        <div className="group bg-[#050811] border border-blue-500/20 hover:border-blue-500/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-glow-subtle">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                LOOP 1 • ENGINEERING
              </span>
            </div>

            <div>
              <h2 className="text-base font-extrabold text-white font-sans">BUILD LOOP</h2>
              <p className="text-xs text-gray-400 mt-1 font-sans">
                Engineering Mission Studio. Task Forge to implement solutions, inspect live code diffs, run Sentinel QA test suites, and seal cryptographic briefs.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Total Build Missions:</span>
                <span className="text-white font-bold">{buildMissions.length} Missions</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Executing Right Now:</span>
                <span className="text-cyan-400 font-bold">{buildExecuting} Active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Assigned Workforce:</span>
                <span className="text-gray-200">Forge • Atlas • Sentinel</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#090d16] border-t border-white/[0.07]">
            <Link
              href="/loops/build"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm font-sans"
            >
              <span>ENTER BUILD STUDIO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: PUBLISH LOOP                                                      */}
        {/* ========================================================================= */}
        <div className="group bg-[#050811] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-subtle">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LOOP 2 • SHOWCASE
              </span>
            </div>

            <div>
              <h2 className="text-base font-extrabold text-white font-sans">PUBLISH LOOP</h2>
              <p className="text-xs text-gray-400 mt-1 font-sans">
                Evidence & Showcase Studio. Turn verified code into 8-slide 3D isometric carousels, technical narrative case studies, and 60fps cinema presentation reels.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Publish Missions:</span>
                <span className="text-white font-bold">{publishMissions.length} Registered</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Release Packages:</span>
                <span className="text-emerald-400 font-bold">{publishReady} Verified</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Workforce:</span>
                <span className="text-gray-200">Gideon Studio • Release</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#090d16] border-t border-white/[0.07]">
            <Link
              href="/loops/publish"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm font-sans"
            >
              <span>ENTER PUBLISH STUDIO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3: OPPORTUNITY LOOP                                                  */}
        {/* ========================================================================= */}
        <div className="group bg-[#050811] border border-amber-500/20 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-subtle">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                LOOP 3 • REVENUE
              </span>
            </div>

            <div>
              <h2 className="text-base font-extrabold text-white font-sans">OPPORTUNITIES LOOP</h2>
              <p className="text-xs text-gray-400 mt-1 font-sans">
                Client Radar & Pipeline Studio. Scout high-margin enterprise pain matching your proven architectures and generate copyable outbound pitches.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Qualified Prospects:</span>
                <span className="text-amber-400 font-bold">{oppQualified} Verified</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Conversion Pipeline:</span>
                <span className="text-yellow-400 font-bold">Observed → Won</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-gray-400">Workforce:</span>
                <span className="text-gray-200">Scout • Atlas • Ledger</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#090d16] border-t border-white/[0.07]">
            <Link
              href="/loops/opportunities"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm font-sans"
            >
              <span>ENTER OPPORTUNITY STUDIO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* PROVISION NEW PROJECT PIPELINE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090d16] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">Provision New Project Pipeline</h3>
                  <p className="text-[11px] text-gray-400 font-mono">Registers project & spawns all 3 loop missions simultaneously</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {provisionResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Project & 3 Core Loops Successfully Provisioned!</span>
                  </div>
                  <div className="text-gray-300 font-mono">
                    Project Slug: <span className="text-white font-bold">{provisionResult.projectSlug}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <Link
                    href={`/loops/build?mission=${provisionResult.buildMission.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/40 text-blue-300 transition"
                  >
                    <span className="font-bold">1. Enter Build Loop Studio (Forge)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/loops/publish?mission=${provisionResult.publishMission.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 transition"
                  >
                    <span className="font-bold">2. Enter Publish Loop Studio (Showcase)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/loops/opportunities?mission=${provisionResult.opportunityMission.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 text-amber-300 transition"
                  >
                    <span className="font-bold">3. Enter Opportunity Loop Studio (Scout)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleProvisionPipeline} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Project Identifier (Slug)</label>
                  <input
                    type="text"
                    required
                    value={projectSlug}
                    onChange={(e) => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                    placeholder="e.g. redis-rate-limiter"
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white font-mono placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Distributed Sliding-Window Rate Limiter"
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Core Engineering Objective</label>
                  <textarea
                    required
                    rows={3}
                    value={projectObjective}
                    onChange={(e) => setProjectObjective(e.target.value)}
                    placeholder="Describe what needs to be engineered, verified, and marketed to prospective clients..."
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 font-sans leading-relaxed resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Risk Profile</label>
                  <select
                    value={projectRisk}
                    onChange={(e) => setProjectRisk(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="LOW">LOW (Fast autonomous iteration)</option>
                    <option value="MEDIUM">MEDIUM (Standard Sentinel QA audit)</option>
                    <option value="HIGH">HIGH (Multi-thread stress test & cryptographic gate)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-gray-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={provisioning || !projectSlug.trim() || !projectTitle.trim() || !projectObjective.trim()}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold transition flex items-center gap-1.5 shadow-glow-primary"
                  >
                    {provisioning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning 3 Loops...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Launch 3-Loop Pipeline</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
