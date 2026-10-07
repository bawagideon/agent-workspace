'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Layers, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  FolderGit2, 
  Activity, 
  Coins, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface MissionContextPanelProps {
  mission?: {
    id?: string;
    title?: string;
    status?: string;
    agentId?: string;
    workspaceId?: string;
    riskLevel?: string;
    autonomyTier?: string;
    estimatedCost?: string;
    actualCost?: string;
    evidenceStatus?: string;
    steps?: Array<{ name: string; status: 'PASSED' | 'RUNNING' | 'PENDING' | 'FAILED' }>;
  } | null;
}

export function MissionContextPanel({ mission }: MissionContextPanelProps) {
  const isOpp = Boolean(mission?.id?.startsWith('opp-') || (mission as any)?.confidenceScore);

  const activeMission = {
    id: mission?.id || 'MIS-CORE-OPS',
    title: mission?.title || 'Gideon Executive Control Loop',
    status: mission?.status || 'ACTIVE',
    agentId: mission?.agentId || (isOpp ? 'scout' : 'atlas'),
    workspaceId: mission?.workspaceId || 'ws-agent-workspace',
    riskLevel: mission?.riskLevel || 'LOW',
    autonomyTier: mission?.autonomyTier || 'Tier 2 (Supervised)',
    estimatedCost: mission?.estimatedCost || ((mission as any)?.estimatedValueCents ? `$${((mission as any).estimatedValueCents / 100).toFixed(2)}` : '$0.00'),
    actualCost: mission?.actualCost || '$0.00',
    evidenceStatus: mission?.evidenceStatus || 'VERIFIED',
    steps: (mission?.steps && mission.steps.length > 0) ? mission.steps : (
      isOpp ? [
        { name: 'Opportunity Ingest & Market Scan', status: 'PASSED' as const },
        { name: 'Unit Economic Margin Modeling', status: 'PASSED' as const },
        { name: 'Bayesian Confidence Calibration', status: 'PASSED' as const }
      ] : [
        { name: 'Discovery & Ingest', status: 'PASSED' as const },
        { name: 'Policy & Risk Evaluation', status: 'PASSED' as const },
        { name: 'Workforce Planning (Atlas)', status: 'PASSED' as const },
        { name: 'Sentinel Verification Gate', status: 'PENDING' as const },
        { name: 'Ledger Unit Cost Accounting', status: 'PENDING' as const }
      ]
    )
  };

  return (
    <div className="bg-[#0a0d13] border border-gray-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-xl">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Active Mission Context
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {activeMission.status}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white leading-snug">
          {activeMission.title}
        </h3>
        <div className="text-[11px] font-mono text-gray-500 mt-0.5">
          ID: {activeMission.id}
        </div>
      </div>

      {/* Primary Details Grid */}
      <div className="space-y-3 bg-[#0d111a] p-3 rounded-lg border border-gray-800/80 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-blue-400" />
            Orchestrator:
          </span>
          <span className="text-white font-bold capitalize">{activeMission.agentId}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1.5">
            <FolderGit2 className="w-3 h-3 text-emerald-400" />
            Workspace:
          </span>
          <Link
            href="/workspaces"
            className="text-emerald-400 hover:underline flex items-center gap-1"
          >
            {activeMission.workspaceId}
            <ArrowUpRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            Risk / Autonomy:
          </span>
          <span className="text-amber-300 font-bold">{activeMission.riskLevel} • {activeMission.autonomyTier}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-success" />
            Recorded Spend:
          </span>
          <span className="text-success font-bold">{activeMission.actualCost}</span>
        </div>
      </div>

      {/* Step DAG Pipeline */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
          Governed Execution Pipeline
        </div>
        <div className="space-y-1.5 bg-[#090b0e] p-2.5 rounded-lg border border-gray-800">
          {(activeMission.steps || []).map((step, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-mono text-[11px] truncate max-w-[180px]">
                {step.name || (step as any).title || `Step ${idx + 1}`}
              </span>
              {(step.status === 'PASSED' || (step.status as string) === 'COMPLETED') && (
                <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PASS
                </span>
              )}
              {step.status === 'RUNNING' && (
                <span className="text-[10px] text-blue-400 font-bold font-mono animate-pulse">
                  ● ACTIVE
                </span>
              )}
              {step.status === 'FAILED' && (
                <span className="text-[10px] text-rose-400 font-bold font-mono">
                  ✕ FAILED
                </span>
              )}
              {(step.status === 'PENDING' || (step.status as string) === 'BLOCKED') && (
                <span className="text-[10px] text-gray-500 font-mono">
                  {(step.status as string) === 'BLOCKED' ? 'QUEUED' : 'WAITING'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deep Links Action Bar */}
      <div className="pt-2 border-t border-gray-800 flex flex-col gap-1.5">
        <Link
          href="/tasks"
          className="flex items-center justify-between p-2 rounded bg-gray-900 hover:bg-gray-800 text-xs font-mono text-gray-300 transition"
        >
          <span>View Task Telemetry</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
        <Link
          href="/approvals"
          className="flex items-center justify-between p-2 rounded bg-gray-900 hover:bg-gray-800 text-xs font-mono text-gray-300 transition"
        >
          <span>Pending Approvals</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
