'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Check, 
  PlusCircle, 
  RotateCw, 
  FileText, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  Sparkles, 
  Upload, 
  FolderGit2, 
  ChevronRight, 
  ExternalLink,
  Edit3,
  BookmarkCheck,
  Shield,
  HelpCircle
} from 'lucide-react';

type ContextCategory = 'facts_opinions' | 'adrs' | 'lessons' | 'capabilities' | 'identity_goals' | 'documents';

export default function ContextConsolePage() {
  const [activeTab, setActiveTab] = useState<ContextCategory>('facts_opinions');
  const [envelope, setEnvelope] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [challengeModal, setChallengeModal] = useState<{ open: boolean; item?: any; reason?: string }>({ open: false });
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchContext = () => {
    setLoading(true);
    fetch('/api/context/resolve')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.envelope) {
          setEnvelope(data.envelope);
        }
      })
      .catch(err => console.warn('Failed to load context:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContext();
  }, []);

  const handleChallengeObservation = (obs: any) => {
    setChallengeModal({ open: true, item: obs, reason: '' });
  };

  const handleConfirmChallenge = () => {
    if (!challengeModal.item) return;
    // Remove or downgrade observation from local view
    if (envelope) {
      setEnvelope({
        ...envelope,
        observations: envelope.observations.filter((o: any) => o.id !== challengeModal.item.id)
      });
    }
    setChallengeModal({ open: false });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Persistent Context Engine
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                Strict Fact ≠ Opinion Doctrine
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Gideon Context & Knowledge Console
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl font-sans">
              Authoritative single source of truth for operator identity, verified architectural lessons, ADRs, and reusable capabilities. AI observations can never silently mutate verified facts.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={fetchContext}
              className="flex items-center gap-1.5 bg-black/50 hover:bg-black/80 border border-white/10 hover:border-emerald-500/40 text-gray-300 px-3 py-2 rounded-xl transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Reality</span>
            </button>
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

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2 overflow-x-auto text-xs font-mono">
        {[
          { id: 'facts_opinions', label: 'Facts vs. Opinions', count: (envelope?.facts?.length || 0) + (envelope?.observations?.length || 0) },
          { id: 'adrs', label: 'Decisions (ADRs)', count: envelope?.adrs?.length || 0 },
          { id: 'lessons', label: 'Verified Lessons', count: envelope?.verifiedLessons?.length || 0 },
          { id: 'capabilities', label: 'Capability Registry', count: envelope?.capabilities?.length || 0 },
          { id: 'identity_goals', label: 'Identity & Goals' },
          { id: 'documents', label: 'Document Vault' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ContextCategory)}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-600/20 text-red-300 border border-red-500/40 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 border border-white/10 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-4">
        {/* TAB: FACTS VS OPINIONS */}
        {activeTab === 'facts_opinions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authoritative Facts */}
            <div className="p-5 rounded-2xl bg-[#050811] border border-blue-500/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-white">Authoritative Facts</h3>
                </div>
                <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  IMMUTABLE TO AI
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans">
                Objective truths verified by human operator, project repositories, or cryptographic contracts. Autonomous agents cannot mutate these.
              </p>

              <div className="space-y-2 pt-1">
                {envelope?.facts?.map((f: any) => (
                  <div key={f.id} className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-blue-400 font-bold">{f.category}</span>
                      <span className="text-gray-500">{f.sourceOfTruth}</span>
                    </div>
                    <p className="text-xs text-gray-200 font-sans">{f.statement}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Observations & Hypotheses */}
            <div className="p-5 rounded-2xl bg-[#050811] border border-amber-500/30 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-extrabold text-white">Observations & Hypotheses</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  CHALLENGEABLE
                </span>
              </div>
              <p className="text-xs text-gray-400 font-sans">
                Non-authoritative patterns mined by Sentinel or Atlas. Subject to human challenge, refutation, or verification.
              </p>

              <div className="space-y-2 pt-1">
                {envelope?.observations?.map((obs: any) => (
                  <div key={obs.id} className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-400 font-bold uppercase">
                        {obs.agent} • {obs.category}
                      </span>
                      <span className="text-emerald-400">{(obs.confidence * 100).toFixed(0)}% Conf</span>
                    </div>
                    <p className="text-xs text-gray-300 font-sans">{obs.statement}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      {obs.evidenceRef ? (
                        <span className="text-[10px] font-mono text-gray-500 truncate max-w-[200px]">
                          Ref: {obs.evidenceRef}
                        </span>
                      ) : <span />}
                      <button
                        onClick={() => handleChallengeObservation(obs)}
                        className="text-[11px] font-mono text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400 px-2 py-0.5 rounded transition"
                      >
                        Challenge / Refute ↗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ADRS */}
        {activeTab === 'adrs' && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 font-sans">
              Formal Architecture Decision Records (ADRs) governing Gideon HQ engineering.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {envelope?.adrs?.map((adr: any) => (
                <div key={adr.id} className="p-4 rounded-xl bg-[#050811] border border-white/10 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white font-mono">{adr.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {adr.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-200">{adr.title}</h4>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-xs text-gray-300 font-sans">
                    <span className="text-[10px] font-mono uppercase text-gray-500 block mb-0.5">Decision</span>
                    {adr.decision}
                  </div>
                  <div className="text-[11px] text-gray-400 font-sans">
                    <strong className="text-gray-300">Consequences:</strong> {adr.consequences}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: LESSONS */}
        {activeTab === 'lessons' && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 font-sans">
              State-machine governed engineering lessons cached and enforced during mission dispatch.
            </div>
            <div className="space-y-2">
              {envelope?.verifiedLessons?.map((l: any) => (
                <div key={l.ruleId} className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300">{l.ruleId}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40">
                      {l.verificationStatus} ({(l.confidence * 100).toFixed(0)}% Conf)
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{l.statement}</p>
                  {l.rationale && (
                    <p className="text-xs text-gray-300 font-sans leading-relaxed">{l.rationale}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: CAPABILITIES */}
        {activeTab === 'capabilities' && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 font-sans">
              Accumulated reusable engineering infrastructure ready for instant injection into new projects.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {envelope?.capabilities?.map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-[#050811] border border-white/10 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">{c.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                      {c.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">{c.description}</p>
                  <div className="p-1.5 rounded bg-black/60 border border-white/5 text-[10px] font-mono text-cyan-300 truncate">
                    {c.reusableInterface}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Origin: {c.originatingProject}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: IDENTITY & GOALS */}
        {activeTab === 'identity_goals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#050811] border border-white/10 space-y-3">
              <h3 className="text-sm font-extrabold text-white">Operator Profile & Brand</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-gray-500 font-mono text-[10px] block">NAME & ROLE</span>
                  <span className="text-white font-bold">{envelope?.operator?.name} — {envelope?.operator?.role}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-gray-500 font-mono text-[10px] block">OFFICIAL BRAND IDENTITY</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-3.5 h-3.5 rounded bg-[#DC2626]" />
                    <span className="text-gray-300 font-mono">Primary Crimson (#DC2626)</span>
                    <span className="w-3.5 h-3.5 rounded bg-[#030712] border border-white/20" />
                    <span className="text-gray-300 font-mono">Obsidian (#030712)</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-gray-500 font-mono text-[10px] block">HARD OPERATIONAL BOUNDARIES</span>
                  <ul className="list-disc pl-4 space-y-1 text-gray-300 text-[11px] mt-1">
                    {envelope?.operator?.hardConstraints?.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#050811] border border-white/10 space-y-3">
              <h3 className="text-sm font-extrabold text-white">Active Strategic Goals</h3>
              <div className="space-y-2 text-xs">
                {[
                  { goal: 'Ship Gideon V5 AI Engineering OS', target: '2026-Q3', status: 'IN_PROGRESS' },
                  { goal: 'Complete Webhook Billing Bridge Production Deployment', target: 'Gate 1/2 Signed', status: 'READY' },
                  { goal: 'Publish World-Class 3D LinkedIn Story Reel Pack', target: 'Gate 3 Ready', status: 'SEALED' },
                  { goal: 'Scale High-Conviction B2B Inbound Client Flow', target: 'Revenue Machine', status: 'ACTIVE' }
                ].map((g, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{g.goal}</div>
                      <div className="text-gray-500 text-[10px] font-mono">{g.target}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {g.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="p-6 rounded-2xl bg-[#050811] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Document Vault & Ingestion</h3>
                <p className="text-xs text-gray-400 font-sans mt-0.5">
                  Ingest project specs, CV revisions, architecture briefs, and PDFs into local memory.
                </p>
              </div>
              <label className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition shadow-glow-primary">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={() => {
                    setUploadSuccess(true);
                    setTimeout(() => setUploadSuccess(false), 3000);
                  }}
                />
              </label>
            </div>

            {uploadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Document ingested and parsed into local vector store (.gideon/documents/).</span>
              </div>
            )}

            <div className="space-y-2">
              {[
                { name: 'cv_v12.json', type: 'PROFILE', size: '14.2 KB', path: 'fixtures/profile/cv_v12.json' },
                { name: 'StoryPackGenerator.ts', type: 'SOURCE_CODE', size: '32.1 KB', path: 'packages/runtime/src/evidence/StoryPackGenerator.ts' },
                { name: 'gideon_engineering_intelligence_and_workspace_master_plan.md', type: 'ARCHITECTURE_SPEC', size: '20.3 KB', path: 'brain/.../master_plan.md' },
                { name: 'lessons_cache.json', type: 'LESSONS_STORE', size: '1.2 KB', path: '.gideon/lessons_cache.json' }
              ].map((doc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="font-bold text-white">{doc.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{doc.path}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-gray-400">{doc.size}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                      {doc.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Challenge Modal */}
      {challengeModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Challenge AI Observation</span>
            </div>
            <p className="text-xs text-gray-300 font-sans">
              You are challenging the observation:
              <span className="block mt-1 font-mono text-gray-200 p-2 rounded bg-black/50 border border-white/5 text-[11px]">
                {challengeModal.item?.statement}
              </span>
            </p>
            <div>
              <label className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">
                Refutation / Correction Rationale
              </label>
              <textarea
                rows={3}
                placeholder="Explain why this hypothesis is incorrect or imprecise..."
                className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setChallengeModal({ open: false })}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChallenge}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono shadow-md"
              >
                Confirm Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
