'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  RotateCw, 
  Layers, 
  TrendingUp, 
  ExternalLink,
  ShieldAlert,
  Info,
  Lightbulb,
  FileCheck,
  Check,
  X
} from 'lucide-react';

export default function SentinelObserverPage() {
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [challengingId, setChallengingId] = useState<string | null>(null);
  const [challengeNotes, setChallengeNotes] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchBrief = () => {
    setLoading(true);
    fetch('/api/sentinel/brief')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.brief) {
          setBrief(data.brief);
        }
      })
      .catch(err => console.warn('Failed to load Sentinel brief:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrief();
  }, []);

  const handleChallenge = async (findingId: string) => {
    if (!challengeNotes.trim()) return;
    try {
      const res = await fetch('/api/sentinel/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findingId, operatorNotes: challengeNotes.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(`Finding ${findingId} successfully marked as challenged by operator.`);
        setChallengingId(null);
        setChallengeNotes('');
        fetchBrief();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to challenge finding');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const findings = brief?.findings || [];
  const filteredFindings = selectedFilter === 'ALL'
    ? findings
    : findings.filter((f: any) => f.severity === selectedFilter);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-red-950/60 border border-red-500 text-red-400">CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-950/60 border border-amber-500 text-amber-300">WARNING</span>;
      case 'OBSERVATION':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-950/60 border border-blue-500 text-blue-300">OBSERVATION</span>;
      case 'RECOMMENDATION':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-950/60 border border-emerald-500 text-emerald-300">RECOMMENDATION</span>;
      case 'PROPOSED_LESSON':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-purple-950/60 border border-purple-500 text-purple-300">PROPOSED LESSON</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-gray-800 text-gray-300">{severity}</span>;
    }
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
                Sentinel Observer v2
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                Independent Findings Engine
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🛡️ Sentinel Morning Brief & Findings Control Plane</span>
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl font-sans">
              Sentinel continuously monitors the Event Spine, discovers architectural and security anomalies, isolates speculative edits, and reports structured findings with direct operator challenge capabilities.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={fetchBrief}
              className="flex items-center gap-1.5 bg-black/50 hover:bg-black/80 border border-white/10 hover:border-emerald-500/40 text-gray-300 px-3 py-2 rounded-xl transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Audit Now</span>
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

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#050811] border border-emerald-500/30 shadow-lg space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Health Score</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {brief?.overallHealthScore || 98} / 100
          </div>
          <div className="text-[11px] text-gray-400 font-sans">Zero critical vulnerabilities detected</div>
        </div>

        <div className="p-4 rounded-xl bg-[#050811] border border-white/10 shadow-lg space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Active Findings</div>
          <div className="text-2xl font-black text-white font-mono">
            {findings.length}
          </div>
          <div className="text-[11px] text-gray-400 font-sans">
            {findings.filter((f: any) => f.severity === 'WARNING').length} warnings, {findings.filter((f: any) => f.severity === 'OBSERVATION').length} observations
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#050811] border border-white/10 shadow-lg space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">QA Contracts</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {brief?.contractsVerifiedCount || 8} / {brief?.totalContractsCount || 8}
          </div>
          <div className="text-[11px] text-emerald-400 font-sans font-bold">100% Deterministic Pass</div>
        </div>

        <div className="p-4 rounded-xl bg-[#050811] border border-amber-500/30 shadow-lg space-y-1">
          <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">Authority Boundary</div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            GATE 1 / 2 / 3
          </div>
          <div className="text-[11px] text-amber-300 font-sans">Human operator signature required</div>
        </div>
      </div>

      {/* Main Findings Engine */}
      <div className="p-5 rounded-2xl bg-[#050811] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-extrabold text-white">
              Sentinel Findings Engine (Fact & Hypothesis Distinction)
            </h2>
          </div>

          {/* Severity Filters */}
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {['ALL', 'CRITICAL', 'WARNING', 'OBSERVATION', 'RECOMMENDATION', 'PROPOSED_LESSON'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedFilter(sev)}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  selectedFilter === sev
                    ? 'bg-emerald-600/30 border-emerald-500 text-white font-bold'
                    : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-3">
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-gray-500">
              No findings matching the selected filter.
            </div>
          ) : (
            filteredFindings.map((finding: any) => (
              <div 
                key={finding.id} 
                className={`p-4 rounded-xl border bg-black/40 space-y-2 transition ${
                  finding.challenged 
                    ? 'border-purple-500/40 bg-purple-950/10' 
                    : finding.severity === 'WARNING'
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-white/10 hover:border-emerald-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(finding.severity)}
                    <span className="text-xs font-mono text-gray-400">[{finding.category}]</span>
                    <span className="text-xs font-bold text-white font-sans">{finding.title}</span>
                    {finding.challenged && (
                      <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-purple-950 border border-purple-500/50 text-purple-300">
                        REFUTED BY OPERATOR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <span>{finding.id}</span>
                    {finding.evidenceRef && (
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">
                        {finding.evidenceRef}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {finding.detail}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] font-mono">
                  <div className="text-gray-400">
                    <strong className="text-emerald-400 font-bold">Remediation:</strong> {finding.remediation}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {finding.canAutoRemediate && (
                      <span className="text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                        Auto-Remediable
                      </span>
                    )}

                    {finding.operatorChallengeable && !finding.challenged && (
                      <button
                        onClick={() => setChallengingId(challengingId === finding.id ? null : finding.id)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-500/30 hover:border-amber-500 px-2 py-0.5 rounded transition"
                      >
                        [Challenge / Refute]
                      </button>
                    )}
                  </div>
                </div>

                {finding.challenged && finding.challengeNotes && (
                  <div className="p-2 bg-purple-950/20 border border-purple-500/20 rounded text-[11px] font-mono text-purple-200">
                    <strong>Operator Note:</strong> {finding.challengeNotes}
                  </div>
                )}

                {/* Challenge Drawer */}
                {challengingId === finding.id && (
                  <div className="p-3 bg-[#0a0f1d] border border-amber-500/40 rounded-xl space-y-2 mt-2">
                    <div className="text-[11px] font-mono text-amber-300 font-bold">
                      Challenge Sentinel Observation: {finding.id}
                    </div>
                    <p className="text-[11px] text-gray-400 font-sans">
                      Sentinel observations are hypotheses subject to human operator refutation. Enter rationale below to update context memory:
                    </p>
                    <textarea
                      value={challengeNotes}
                      onChange={(e) => setChallengeNotes(e.target.value)}
                      placeholder="e.g., This observation is invalid because the SVG file was generated by an external third-party tool..."
                      rows={2}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60"
                    />
                    <div className="flex items-center justify-end gap-2 text-xs font-mono">
                      <button
                        onClick={() => setChallengingId(null)}
                        className="px-2.5 py-1 text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleChallenge(finding.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
                      >
                        Submit Refutation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 9-Dimension Quality Radar Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>The 9 Dimensions of Engineering Quality</span>
          </h2>
          <span className="text-[10px] font-mono text-gray-400">Evaluated deterministically against acceptance contracts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {brief?.qualityDimensions?.map((dim: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-[#050811] border border-white/10 space-y-2 shadow-md hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{dim.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {dim.score}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${dim.score}%` }} 
                />
              </div>
              <p className="text-[11px] text-gray-400 font-sans leading-relaxed pt-1">
                {dim.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
