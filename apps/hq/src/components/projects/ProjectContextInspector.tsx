'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Copy, 
  Check, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  FileCode, 
  Terminal, 
  Activity, 
  Clock, 
  Layers, 
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { ProjectContextPack, ContextTargetAgent, ContextPackFreshnessCheck } from '@gideon/shared';

interface ProjectContextInspectorProps {
  projectId: string;
  currentRevision: number;
}

export function ProjectContextInspector({ projectId, currentRevision }: ProjectContextInspectorProps) {
  const [targetAgent, setTargetAgent] = useState<ContextTargetAgent>('forge');
  const [pack, setPack] = useState<ProjectContextPack | null>(null);
  const [freshness, setFreshness] = useState<ContextPackFreshnessCheck | null>(null);
  const [traceability, setTraceability] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const fetchContext = async (agent: ContextTargetAgent) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/context?agent=${agent}`);
      const data = await res.json();
      if (data.success) {
        setPack(data.pack);
        setFreshness(data.freshness);
        setTraceability(data.traceability || {});
      }
    } catch (err) {
      console.warn('Failed to fetch context pack:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext(targetAgent);
  }, [projectId, targetAgent]);

  const copyJson = () => {
    if (pack) {
      navigator.clipboard.writeText(JSON.stringify(pack, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Context Pack Inspector (🧠)</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 font-bold">
                READ-ONLY PROJECTION
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Deterministic, permission-scoped operational memory snapshot briefed to autonomous agents before execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Freshness Badge */}
            {freshness && (
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                freshness.isCurrent
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {freshness.isCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {freshness.isCurrent ? `FRESH (rev #${freshness.packRevision})` : `STALE (pack: #${freshness.packRevision} vs db: #${freshness.authoritativeRevision})`}
              </span>
            )}

            <button
              onClick={() => fetchContext(targetAgent)}
              disabled={loading}
              className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition"
              title="Refresh Projection"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Agent Persona Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-800/60">
          <span className="text-xs text-gray-400 font-mono mr-2">Target Perspective:</span>
          {(['forge', 'scout', 'sentinel'] as ContextTargetAgent[]).map((agent) => (
            <button
              key={agent}
              onClick={() => setTargetAgent(agent)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border flex items-center gap-1.5 ${
                targetAgent === agent
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                  : 'bg-gray-900/80 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300'
              }`}
            >
              {agent === 'forge' && <span>🔨 Forge (Engineer)</span>}
              {agent === 'scout' && <span>🔭 Scout (Researcher)</span>}
              {agent === 'sentinel' && <span>🛡️ Sentinel (QA & Audit)</span>}
            </button>
          ))}
        </div>

        {/* Dual Hashes Metadata */}
        {pack && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] font-mono text-gray-400 bg-black/30 p-2.5 rounded-lg border border-gray-800/50">
            <div>
              <span className="text-gray-400">Authoritative State Hash: </span>
              <span className="text-emerald-400" title={pack.authoritativeStateHash || pack.sourceStateHash}>
                {(pack.authoritativeStateHash || pack.sourceStateHash).slice(0, 16)}...
              </span>
            </div>
            <div>
              <span className="text-gray-400">Projected Context Hash: </span>
              <span className="text-purple-400" title={pack.projectedContextHash}>
                {(pack.projectedContextHash || 'N/A').slice(0, 16)}...
              </span>
            </div>
          </div>
        )}
      </div>

      {loading && !pack ? (
        <div className="p-8 text-center text-gray-400 font-mono text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-400 mb-2" />
          Computing permission-scoped Context Pack for {targetAgent}...
        </div>
      ) : pack ? (
        <div className="space-y-4">
          {/* Grid of First-Class Operational Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Card 1: Identity */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    [1/8] Project Identity & Objective
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400">{pack.projectIdentity.slug}</span>
                </div>
                <p className="text-xs text-white font-medium mb-2">{pack.projectIdentity.businessObjective}</p>
                {pack.projectIdentity.targetCustomer && (
                  <div className="text-[11px] text-gray-400 mb-1">
                    <span className="text-gray-400">Customer: </span>{pack.projectIdentity.targetCustomer}
                  </div>
                )}
                {pack.projectIdentity.problemSolved && (
                  <div className="text-[11px] text-gray-400 mb-2">
                    <span className="text-gray-400">Problem: </span>{pack.projectIdentity.problemSolved}
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {pack.projectIdentity.techStack.map(t => (
                    <span key={t} className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: hq_projects (id: {pack.projectIdentity.id}, rev: #{pack.projectRevision})
              </div>
            </div>

            {/* Card 2: History */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    [2/8] Operational History
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400">{pack.history.completedMissionsCount} missions</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recent Test Status:</span>
                    <span className={`font-mono font-bold ${pack.history.recentTestStatus === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {pack.history.recentTestStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audit Events Logged:</span>
                    <span className="text-white font-mono">{pack.history.auditEventCount}</span>
                  </div>
                  {pack.history.lastCompletedMission && (
                    <div className="pt-2 border-t border-gray-800/50">
                      <div className="text-[11px] text-gray-400">Last Mission:</div>
                      <div className="text-xs text-white font-medium truncate">{pack.history.lastCompletedMission.title}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: hq_project_missions, hq_project_events
              </div>
            </div>

            {/* Card 3: Current State */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    [3/8] Current State & OCC Revision
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{pack.currentState.status}</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Authoritative Revision:</span>
                    <span className="text-white font-mono font-bold">#{pack.currentState.revision}</span>
                  </div>
                  {pack.currentState.assignedPort && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Assigned Port:</span>
                      <span className="text-emerald-400 font-mono">:{pack.currentState.assignedPort}</span>
                    </div>
                  )}
                  {pack.currentState.openUnknowns.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] text-amber-400">Open Unknowns ({pack.currentState.openUnknowns.length}):</span>
                      <ul className="list-disc list-inside text-[11px] text-gray-400 mt-0.5">
                        {pack.currentState.openUnknowns.map((u, i) => <li key={i} className="truncate">{u}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: hq_projects (status, revision, leases)
              </div>
            </div>

            {/* Card 4: Decision Rationale */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    [4/8] Decision Rationale
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-400">
                    Conf: {Math.round(pack.decisionRationale.decisionConfidence * 100)}%
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="text-white font-medium">{pack.decisionRationale.strategicObjective}</div>
                  <div className="text-[11px] text-gray-400">
                    <span className="text-gray-400">Action: </span>{pack.decisionRationale.actionRecommendation}
                  </div>
                  {pack.decisionRationale.whyNotExplanation && (
                    <div className="text-[11px] text-amber-300/80 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                      {pack.decisionRationale.whyNotExplanation}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: hq_projects.metadata.decisionRationale
              </div>
            </div>

            {/* Card 5: Evidence */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    [5/8] Evidence & Cryptographic Proof
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {pack.evidence.hmacSignaturesPresent ? 'HMAC SEALED' : 'STANDARD'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Evidence Citations:</span>
                    <span className="text-white font-mono">{pack.evidence.evidenceIds.length} citations</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Test Log Artifacts:</span>
                    <span className="text-white font-mono">{pack.evidence.testArtifactIds.length} artifacts</span>
                  </div>
                  {pack.evidence.evidenceIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {pack.evidence.evidenceIds.slice(0, 3).map(eid => (
                        <span key={eid} className="text-[10px] font-mono bg-black/40 text-emerald-400/90 border border-emerald-500/20 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                          {eid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: .gideon/evidence, hq_project_test_runs
              </div>
            </div>

            {/* Card 6: Constraints */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    [6/8] Execution Constraints
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Budget: ${(pack.constraints.budgetLimitCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-gray-400 text-[11px] truncate">
                    <span className="text-gray-400">Root: </span>{pack.constraints.workingDirectory}
                  </div>
                  {pack.constraints.allowedStartCommand && (
                    <div className="text-emerald-400 text-[11px]">
                      <span className="text-gray-400">Start: </span>{pack.constraints.allowedStartCommand}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {pack.constraints.allowedTestCommands.map(cmd => (
                      <span key={cmd} className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                        {cmd}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ ZERO OUTBOUND
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ FINANCIAL RULE OF IRON
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: ProjectExecutionProfile
              </div>
            </div>

            {/* Card 7: Next Agent Brief */}
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-300 font-mono flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    [7/8] Next Agent Brief ({pack.nextAgentBrief.assignedRole})
                  </h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="text-white font-medium">{pack.nextAgentBrief.targetTaskGoal}</div>
                  <div className="text-[11px] text-gray-400">
                    <span className="text-gray-400">Deliverable: </span>{pack.nextAgentBrief.expectedDeliverable}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    <span className="text-gray-400">Contracts: </span>{pack.nextAgentBrief.interfaceContracts.join(', ')}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-800/50 text-[10px] font-mono text-gray-400">
                source: AgentSecurityPolicy [{pack.targetAgent}]
              </div>
            </div>

            {/* Card 8: Inaccessible Information (Question 8) */}
            <div className="bg-[#120a10] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-red-400 font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    [8/8] Inaccessible Information (Firewall)
                  </h3>
                  <span className="text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                    LEAST PRIVILEGE
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-red-300/80">{pack.inaccessibleInformation.policyReason}</p>
                  
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1">
                    {(pack.inaccessibleInformation.inaccessibleCategories || pack.inaccessibleInformation.redactedKeys).map(cat => (
                      <span key={cat} className="text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded">
                        🔒 {cat}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono text-gray-400 pt-1">
                    Strictly enforced by Security Projection Pipeline. Zero secret ingress into agent context.
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-red-900/40 text-[10px] font-mono text-gray-400">
                source: SecurityProjectionPipeline (Least Privilege Firewall)
              </div>
            </div>

          </div>

          {/* Verified Lessons */}
          {pack.verifiedLessons && pack.verifiedLessons.length > 0 && (
            <div className="bg-[#0d1017] border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Organizational Lessons ({pack.verifiedLessons.length})
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  VERIFIED ONLY
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pack.verifiedLessons.map(lesson => (
                  <div key={lesson.id} className="bg-black/30 border border-gray-800 p-3 rounded-lg space-y-1 text-xs">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-purple-400">{lesson.category}</span>
                      <span className="text-emerald-400 font-bold">{lesson.verificationStatus}</span>
                    </div>
                    <div className="text-white font-medium">{lesson.statement}</div>
                    <div className="text-[11px] text-gray-400">{lesson.rationale}</div>
                    <div className="text-[10px] font-mono text-gray-400 pt-1 flex justify-between">
                      <span>Verified by: {lesson.verifiedBy || 'sentinel'}</span>
                      <span>Rev: #{lesson.revision || 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Inspector Accordion */}
          <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="w-full px-5 py-3 text-left font-mono text-xs font-bold text-gray-300 hover:text-white flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-400" />
                Raw Canonical Context Pack JSON ({showRawJson ? 'Hide' : 'Inspect'})
              </span>
              <span className="text-[11px] text-gray-400">{showRawJson ? '▲' : '▼'}</span>
            </button>

            {showRawJson && (
              <div className="p-4 border-t border-gray-800/60 bg-black/40 space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={copyJson}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold bg-gray-900 hover:bg-gray-800 border border-gray-800 text-purple-300 px-2.5 py-1 rounded transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-gray-300 overflow-x-auto max-h-[400px] p-3 rounded bg-black/60 border border-gray-800/80">
                  {JSON.stringify(pack, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
