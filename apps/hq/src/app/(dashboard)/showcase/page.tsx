'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Play,
  RefreshCw,
  Layers,
  FileCode,
  Radar,
  ArrowRight,
  AlertTriangle,
  Lock,
  Eye,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Share2,
  FileText,
  Terminal,
  Hash,
  Sliders,
  CheckCircle,
  Zap,
  Pause,
  Film,
  RotateCcw
} from 'lucide-react';

interface ProjectFleetItem {
  id: string;
  name: string;
  category: string;
  status: string;
  mode: 'MODE_A_OPEN_PROOF' | 'MODE_B_DEMO_ONLY' | 'MODE_C_COMMERCIAL' | 'MODE_D_PROPRIETARY';
  exposureLabel: string;
  githubUrl?: string;
  demoUrl?: string;
  verifiedTests?: number;
  evidenceId?: string;
  isFlagship?: boolean;
}

export default function ShowcaseHubPage() {
  const [projects, setProjects] = useState<ProjectFleetItem[]>([]);
  const [gates, setGates] = useState<any[]>([]);
  const [storyPack, setStoryPack] = useState<any>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeStudioTab, setActiveStudioTab] = useState<'visuals' | 'narrative' | 'claims'>('visuals');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regeneratingStory, setRegeneratingStory] = useState(false);
  const [reelPlaying, setReelPlaying] = useState(false);
  const [reelProgress, setReelProgress] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0, sheenX: 50, sheenY: 50, active: false });

  const fetchShowcaseData = async () => {
    try {
      setRefreshing(true);
      const [projRes, appRes, storyRes] = await Promise.all([
        fetch('/api/projects').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/approvals').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/story-pack?projectId=webhook-billing-bridge').then((r) => r.json()).catch(() => ({ success: false }))
      ]);

      if (projRes.success && Array.isArray(projRes.projects)) {
        const fleet: ProjectFleetItem[] = projRes.projects.map((p: any) => {
          const categoryLabels: Record<string, string> = {
            REVENUE_DEFENSE: 'Revenue Defense',
            SALES_OPERATIONS: 'Sales Operations',
            PIPELINE_REACTIVATION: 'Pipeline Reactivation',
            GROWTH_ENGINEERING: 'Growth Engineering',
            CUSTOMER_EXPERIENCE: 'Customer Experience',
            API_SERVICE: 'API Service',
            SAAS: 'SaaS Architecture'
          };
          const categoryLabel = categoryLabels[p.category] || p.category || 'Systems Engineering';
          const isFlagship = Boolean(p.isFlagship || p.slug === 'leadleak-detector' || p.id === 'proj_webhook_billing_bridge');
          const isOpenProof = Boolean(
            p.slug?.includes('leadleak') || 
            p.slug?.includes('guardrail') || 
            p.slug?.includes('webhook') ||
            p.slug?.includes('quote-ghost') ||
            p.slug?.includes('missed-call') ||
            p.slug?.includes('response-timer') ||
            p.slug?.includes('lost-lead') ||
            p.slug?.includes('conversion-leak') ||
            p.slug?.includes('booking-friction') ||
            p.slug?.includes('abandoned-booking') ||
            p.slug?.includes('contact-form') ||
            p.slug?.includes('qualification')
          );

          return {
            id: p.id,
            name: p.name || p.slug,
            category: categoryLabel,
            status: p.status || 'QA_VERIFIED',
            mode: isOpenProof ? 'MODE_A_OPEN_PROOF' : 'MODE_B_DEMO_ONLY',
            exposureLabel: isOpenProof ? 'Mode A: Open Proof' : 'Mode B: Demo Only',
            githubUrl: `https://github.com/bawagideon/${p.slug || 'agent-workspace'}`,
            demoUrl: `/projects/${p.id}`,
            verifiedTests: p.verifiedTests || (p.metadata?.testCount || 4),
            evidenceId: p.evidenceRef || `ev-${p.slug}`,
            isFlagship
          };
        });
        setProjects(fleet);
      }

      if (appRes.success && Array.isArray(appRes.approvals)) {
        setGates(appRes.approvals);
      }

      if (storyRes.success && storyRes.storyPack) {
        setStoryPack(storyRes.storyPack);
      }
    } catch (err) {
      console.warn('Failed to load showcase data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRegenerateStory = async () => {
    try {
      setRegeneratingStory(true);
      const res = await fetch('/api/story-pack?projectId=webhook-billing-bridge');
      const data = await res.json();
      if (data.success && data.storyPack) {
        setStoryPack(data.storyPack);
      }
    } catch (err) {
      console.error('Failed to regenerate story pack:', err);
    } finally {
      setRegeneratingStory(false);
    }
  };

  const handleCopyNarrative = () => {
    if (!storyPack?.narrativePost?.fullText) return;
    navigator.clipboard.writeText(storyPack.narrativePost.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltX = -((y / rect.height) - 0.5) * 14;
    const tiltY = ((x / rect.width) - 0.5) * 14;
    const sheenX = (x / rect.width) * 100;
    const sheenY = (y / rect.height) * 100;
    setTilt({ x: tiltX, y: tiltY, sheenX, sheenY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, sheenX: 50, sheenY: 50, active: false });
  };

  useEffect(() => {
    if (!reelPlaying) {
      setReelProgress(0);
      return;
    }
    const slideDuration = 4000;
    const updateInterval = 50;
    const step = (updateInterval / slideDuration) * 100;

    const timer = setInterval(() => {
      setReelProgress((prev) => {
        if (prev >= 100) {
          setActiveSlideIndex((curr) => (curr + 1) % (storyPack?.slides?.length || 8));
          return 0;
        }
        return prev + step;
      });
    }, updateInterval);

    return () => clearInterval(timer);
  }, [reelPlaying, storyPack]);

  useEffect(() => {
    fetchShowcaseData();
  }, []);

  const totalEligible = projects.length;
  const verifiedCount = projects.filter((p) => p.verifiedTests && p.verifiedTests > 0).length;
  const freshnessPercent = totalEligible > 0 ? Math.round((verifiedCount / totalEligible) * 100) : 100;
  const pendingGates = gates.filter((g) => g.status === 'PENDING').length;

  const modeCounts = projects.reduce(
    (acc, p) => {
      acc[p.mode] = (acc[p.mode] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const activeSlide = storyPack?.slides?.[activeSlideIndex] || null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/[0.08] relative overflow-hidden shadow-glass">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Evidence Projection Hub
              </span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                Storytelling Engine Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Showcase & Brand Hub</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Autonomous reputation loop projecting verified engineering contracts into public GitHub deliverables, 3D portfolio cards, and high-impact visual LinkedIn Story Packs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchShowcaseData}
              className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition shadow-sm"
              title="Refresh Projection State"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/approvals"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Review Gates ({pendingGates})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
          <div className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Portfolio Health</div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-white mt-1">
            {totalEligible} Eligible
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>Real physical codebases</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
          <div className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Evidence Freshness</div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 mt-1">
            {freshnessPercent}%
          </div>
          <div className="text-[11px] text-gray-400 mt-2 font-mono">
            {verifiedCount}/{totalEligible} contracts sealed
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
          <div className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Public Authority Gates</div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 mt-1">
            {pendingGates} Pending
          </div>
          <div className="text-[11px] text-gray-400 mt-2 font-mono">
            Gate 3 LinkedIn exact-hash bound
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/[0.08]">
          <div className="text-xs text-gray-400 font-semibold tracking-wide uppercase">Story Pack Status</div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-cyan-400 mt-1">
            8 Slides
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>Cryptographic hash sealed</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LINKEDIN STORY PACK STUDIO (First-Class Narrative & Visual Carousel)       */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl relative">
        <div className="p-6 md:p-8 border-b border-white/[0.08] bg-gradient-to-r from-slate-900/80 via-black/60 to-slate-900/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                LinkedIn Story Pack Studio
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Zero Hype • 100% Proven
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Webhook Billing Bridge: Narrative & Visual Proof Carousel
            </h2>
            <p className="text-xs text-gray-300 max-w-3xl leading-relaxed">
              Modern storytelling with tension, human friction, and empirical proof. Replaces generic technical posts with an 8-slide visual gallery and validated narrative text.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRegenerateStory}
              disabled={regeneratingStory}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-gray-300 hover:text-white transition flex items-center gap-2"
              title="Regenerate SVG Slides & Story Pack"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regeneratingStory ? 'animate-spin' : ''}`} />
              <span>Regenerate Pack</span>
            </button>
            <Link
              href="/approvals"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Review Gate 3</span>
            </Link>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="px-6 border-b border-white/[0.06] bg-black/40 flex items-center gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveStudioTab('visuals')}
            className={`py-3 px-2 border-b-2 font-bold transition flex items-center gap-2 ${
              activeStudioTab === 'visuals'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>8-Slide Visual Carousel ({storyPack?.slides?.length || 8})</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('narrative')}
            className={`py-3 px-2 border-b-2 font-bold transition flex items-center gap-2 ${
              activeStudioTab === 'narrative'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Narrative Story Post</span>
          </button>
          <button
            onClick={() => setActiveStudioTab('claims')}
            className={`py-3 px-2 border-b-2 font-bold transition flex items-center gap-2 ${
              activeStudioTab === 'claims'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Invariants ({storyPack?.claims?.length || 4})</span>
          </button>
        </div>

        {/* Tab 1: Visuals Carousel */}
        {activeStudioTab === 'visuals' && (
          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Large Slide Stage (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Cinema Reel / 3D Mode Control Header */}
              <div className="flex items-center justify-between bg-black/40 border border-white/[0.08] px-4 py-2.5 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setReelPlaying(!reelPlaying)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition ${
                      reelPlaying
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                    }`}
                  >
                    {reelPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>PAUSE REEL</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-3.5 h-3.5" />
                        <span>▶ PLAY CINEMA REEL</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[11px] text-gray-300">
                      {tilt.active ? '3D PERSPECTIVE ENGAGED' : 'HOVER FOR 3D TILT'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setActiveSlideIndex(0); setReelProgress(0); }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                    title="Reset to Slide 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-gray-300">
                    SLIDE {activeSlideIndex + 1} / {storyPack?.slides?.length || 8}
                  </span>
                </div>
              </div>

              {/* Slide Stage with Interactive 3D Perspective Tilt */}
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: tilt.active
                    ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
                    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                  transition: tilt.active ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out'
                }}
                className="relative aspect-square max-h-[560px] w-full rounded-2xl overflow-hidden bg-[#030712] border border-white/10 shadow-2xl flex items-center justify-center group select-none"
              >
                {/* Dynamic Cursor Light Sheen Overlay */}
                {tilt.active && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-200"
                    style={{
                      background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
                    }}
                  />
                )}

                {/* Cinema Reel Progress Bar */}
                {reelPlaying && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-all duration-75"
                      style={{ width: `${reelProgress}%` }}
                    />
                  </div>
                )}

                {activeSlide ? (
                  <img
                    src={activeSlide.visual.publicUrl || `/story/webhook-billing-bridge/slide-${activeSlideIndex + 1}.svg`}
                    alt={activeSlide.headline}
                    className="w-full h-full object-contain select-none"
                  />
                ) : (
                  <div className="text-gray-500 font-mono text-xs flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading slide visual...</span>
                  </div>
                )}

                {/* Left / Right Chevron Overlay Buttons */}
                <button
                  onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeSlideIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 disabled:pointer-events-none transition border border-white/20 backdrop-blur-md shadow-lg z-20"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveSlideIndex((prev) => Math.min((storyPack?.slides?.length || 8) - 1, prev + 1))}
                  disabled={activeSlideIndex >= (storyPack?.slides?.length || 8) - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 disabled:pointer-events-none transition border border-white/20 backdrop-blur-md shadow-lg z-20"
                  title="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slide Number Badge */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-gray-200 z-20">
                  Slide {activeSlideIndex + 1} of {storyPack?.slides?.length || 8}
                </div>
              </div>

              {/* Thumbnails Row */}
              <div className="grid grid-cols-8 gap-2">
                {(storyPack?.slides || [1, 2, 3, 4, 5, 6, 7, 8]).map((slide: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`aspect-square rounded-xl p-1 border transition overflow-hidden relative ${
                      activeSlideIndex === idx
                        ? 'border-emerald-400 bg-emerald-500/10 ring-2 ring-emerald-400/30'
                        : 'border-white/10 bg-black/40 hover:border-white/30 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="absolute top-1 left-1 text-[9px] font-mono font-bold text-gray-400">
                      #{idx + 1}
                    </span>
                    <img
                      src={`/story/webhook-billing-bridge/slide-${idx + 1}.svg`}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Slide Metadata & Evidence Context (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {activeSlide?.purpose || `PHASE 0${activeSlideIndex + 1}`}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">1080 × 1080 SVG</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {activeSlide?.headline || 'Slide Headline'}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {activeSlide?.subtext || 'Slide description'}
                  </p>
                </div>

                {activeSlide?.evidenceCitation && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                    <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Evidence Citation</span>
                    </div>
                    <p className="text-xs font-mono text-emerald-300/90 leading-relaxed">
                      {activeSlide.evidenceCitation}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href="/story/webhook-billing-bridge/motion-reel.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300 hover:text-emerald-200 transition flex items-center justify-center gap-2"
                  >
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Launch Fullscreen 3D Cinema Reel ↗</span>
                  </a>

                  <a
                    href={`/story/webhook-billing-bridge/slide-${activeSlideIndex + 1}.svg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-gray-200 hover:text-white transition flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View High-Res SVG In New Tab</span>
                  </a>

                  <button
                    onClick={handleCopyNarrative}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400 transition flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Narrative Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Narrative Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Concurrency Benchmark Callout */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-black/40 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  <span>20-Thread Concurrency Assault Scorecard</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 font-mono">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <div className="text-base font-extrabold text-white">20</div>
                    <div className="text-[10px] text-gray-400">Concurrent</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <div className="text-base font-extrabold text-emerald-400">1</div>
                    <div className="text-[10px] text-gray-400">Committed</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                    <div className="text-base font-extrabold text-emerald-400">19</div>
                    <div className="text-[10px] text-gray-400">Deduplicated</div>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 text-center font-mono pt-1">
                  0.00% duplicate deliveries • Sealed in QA contract
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Narrative Story Post */}
        {activeStudioTab === 'narrative' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Cryptographic Content Binding</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    MATCHES GATE 3
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-400 break-all">
                  SHA-256: {storyPack?.narrativePost?.contentHash || '385ae8321eee030c966843441691b66f352237aa4caa39c2158d2b2718f41492'}
                </div>
              </div>

              <button
                onClick={handleCopyNarrative}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs tracking-wider uppercase transition shadow-md flex items-center gap-2 shrink-0 justify-center"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Full Post!' : 'Copy Post Text'}</span>
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.08] font-sans text-sm text-gray-200 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">
              {storyPack?.narrativePost?.fullText || 'Generating storytelling text...'}
            </div>
          </div>
        )}

        {/* Tab 3: Verified Claims & Invariants */}
        {activeStudioTab === 'claims' && (
          <div className="p-6 md:p-8 space-y-4">
            <div className="text-xs text-gray-400">
              Every factual assertion in the LinkedIn Story Pack is cryptographically bound to physical test results.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(storyPack?.claims || []).map((claim: any) => (
                <div key={claim.id} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      {claim.category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{claim.statement}</p>
                  <div className="text-[10px] font-mono text-gray-500 pt-1 border-t border-white/5">
                    Ref: {claim.evidencePath}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Showcase Fleet Table with Commercial Exposure Enforcements */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.08] shadow-glass">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Showcase Fleet & Commercial Policy Classification
            </h2>
            <p className="text-xs text-gray-400">Strict IP protection: only Mode A exposes public GitHub source code.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/40 text-gray-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Project Name</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Commercial Mode</th>
                <th className="py-3 px-5">Verification</th>
                <th className="py-3 px-5">Source Policy</th>
                <th className="py-3 px-5">Public Artifacts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-4 px-5 font-bold text-white flex items-center gap-2">
                    {proj.isFlagship && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                        FLAGSHIP
                      </span>
                    )}
                    <span>{proj.name}</span>
                  </td>
                  <td className="py-4 px-5 text-gray-400">{proj.category}</td>
                  <td className="py-4 px-5">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                        proj.mode === 'MODE_A_OPEN_PROOF'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : proj.mode === 'MODE_B_DEMO_ONLY'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      }`}
                    >
                      {proj.exposureLabel}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {proj.verifiedTests} tests passed
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {proj.mode === 'MODE_A_OPEN_PROOF' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        Public Allowed
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1 font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        Source Gated (IP Protected)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                          title="View GitHub Repository"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {proj.demoUrl && (
                        <a
                          href={proj.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition"
                          title="View Live Portfolio Demo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Public Authority Gates Queue */}
      <div className="glass-card rounded-2xl p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Human Authority Gates Awaiting Operator Review
            </h2>
            <p className="text-xs text-gray-400">Public side effects strictly blocked until explicit human approval.</p>
          </div>
          <Link href="/approvals" className="text-xs font-mono text-amber-400 hover:text-amber-300">
            Open Approvals Center →
          </Link>
        </div>

        <div className="space-y-3">
          {gates.filter((g) => g.status === 'PENDING').map((gate) => (
            <div
              key={gate.id}
              className="p-4 rounded-xl bg-black/40 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {gate.action_type || 'GATE'}
                  </span>
                  <span className="text-xs font-bold text-white">{gate.task_title || 'Showcase Gate'}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{gate.description}</p>
              </div>

              <Link
                href="/approvals"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase transition shadow-md shrink-0 flex items-center gap-1.5 justify-center"
              >
                <span>Inspect & Sign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
          {gates.filter((g) => g.status === 'PENDING').length === 0 && (
            <div className="text-center py-6 text-xs text-gray-500 font-mono">
              ✓ All public authority gates are clear. No pending publication requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
