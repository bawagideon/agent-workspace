import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Terminal,
  ShieldAlert,
  FileCode2,
  Cpu,
  ArrowLeft,
  PauseCircle,
  StopCircle,
  CheckSquare
} from 'lucide-react';

export default function TaskMissionViewPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation & Mission Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="p-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">MISSION ROOM</span>
              <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded font-bold font-mono">
                WAITING_APPROVAL
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Audit TypeScript Strictness & Verify Build
            </h1>
          </div>
        </div>

        {/* Mission Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg transition-all">
            <PauseCircle className="w-4 h-4 text-warning" />
            Pause Mission
          </button>
          <button className="flex items-center gap-2 bg-danger/10 border border-danger/30 hover:bg-danger/20 text-danger text-xs font-bold px-3.5 py-2 rounded-lg transition-all">
            <StopCircle className="w-4 h-4" />
            Abort Task
          </button>
        </div>
      </div>

      {/* 3-Column Mission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mission Timeline (3 cols) */}
        <div className="lg:col-span-3 bg-card border border-card-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider">
            Execution Timeline
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5 font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-white">1. Context Retrieval</div>
                <div className="text-[11px] text-gray-400">Loaded 2 project memories</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5 font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-white">2. Workspace Inspection</div>
                <div className="text-[11px] text-gray-400">fs_list_dir executed</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5 font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-white">3. Plan Formulation</div>
                <div className="text-[11px] text-gray-400">3 atomic steps defined</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0 mt-0.5 font-bold animate-pulse">
                !
              </div>
              <div>
                <div className="font-bold text-warning">4. Waiting Approval</div>
                <div className="text-[11px] text-gray-400">Step #2 requires Plan Approval</div>
              </div>
            </div>

            <div className="flex items-start gap-3 opacity-50">
              <div className="w-5 h-5 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center shrink-0 mt-0.5 font-mono">
                5
              </div>
              <div>
                <div className="font-bold text-gray-300">5. Self Review & QA</div>
                <div className="text-[11px] text-gray-500">Sentinel audit pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Live Telemetry & Terminal Stream (6 cols) */}
        <div className="lg:col-span-6 bg-card border border-card-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                Live Subprocess & Runner Output
              </h3>
              <span className="text-[10px] bg-card-border text-gray-300 px-2 py-0.5 rounded font-mono">
                GIDMACHINE_WIN
              </span>
            </div>

            <div className="bg-[#090a0f] border border-card-border rounded-lg p-4 font-mono text-xs text-gray-300 h-80 overflow-y-auto space-y-2">
              <p className="text-gray-500">[16:42:00] Initializing task run for agent: forge...</p>
              <p className="text-gray-400">[16:42:01] Context loaded. Retrieving memories for workspace: ws-agent-workspace</p>
              <p className="text-accent">[16:42:02] Tool execution: fs_list_dir (found 14 files)</p>
              <p className="text-gray-300">[16:42:03] Planner formulated ExecutionPlan #plan-1725291723 with 3 steps</p>
              <p className="text-warning">[16:42:04] RiskEngine evaluated Step #2 (fs_write_file) -> MEDIUM RISK</p>
              <p className="text-warning font-bold">[16:42:05] Task paused in WAITING_APPROVAL state. Dispatched approval request appr-1725291725</p>
            </div>
          </div>

          <div className="p-3 bg-[#0d0f15] border border-card-border rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Agent: <strong className="text-white">Forge (Gemini 2.0 Flash)</strong></span>
            <span className="text-gray-400">Tokens: <strong className="text-accent">1,420</strong> ($0.003)</span>
          </div>
        </div>

        {/* Right Column: Approval Card & Context Artifacts (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Pending Approval Action Box */}
          <div className="bg-card border border-warning/30 rounded-xl p-5 space-y-4 shadow-lg shadow-warning/5">
            <div className="flex items-center gap-2 text-xs font-bold text-warning">
              <ShieldAlert className="w-4 h-4" />
              Action Requires Approval
            </div>

            <p className="text-xs text-gray-300">
              Forge proposes applying verified fix to <span className="font-mono text-white">VerifiedComponent.tsx</span>.
            </p>

            <div className="space-y-2 pt-2">
              <Link
                href="/approvals"
                className="w-full py-2 bg-warning hover:bg-warning/90 text-black font-bold text-xs rounded-lg text-center block transition-all shadow-md"
              >
                Inspect & Authorize
              </Link>
            </div>
          </div>

          {/* Artifacts Stored */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-primary-500" />
              Generated Artifacts (1)
            </h3>

            <div className="p-2.5 rounded bg-[#0d0f15] border border-card-border text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-white">ExecutionPlan_v1.json</div>
                <div className="text-[10px] text-gray-500 font-mono">Structured Plan Token</div>
              </div>
              <span className="text-[10px] text-accent font-mono font-bold">VIEW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
