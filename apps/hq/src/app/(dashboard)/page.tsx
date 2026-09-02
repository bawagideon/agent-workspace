import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldAlert,
  PlayCircle,
  HardDrive,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Terminal,
  Cpu
} from 'lucide-react';

export default function CommandCenterPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome & High Level Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            GOOD AFTERNOON, GIDEON
            <span className="text-xs bg-primary-600/20 text-primary-400 px-2.5 py-1 rounded-full font-mono border border-primary-500/30">
              HQ V3 ACTIVE
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Workforce OS is actively monitoring 3 registered agents across 1 machine.
          </p>
        </div>

        {/* Global Workforce Health Card */}
        <div className="flex items-center gap-3 bg-card border border-card-border p-2.5 rounded-xl">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-bold text-success">1 Working</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs font-bold text-warning">1 Approval</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-xs font-bold text-gray-300">1 Idle</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Mission & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Mission (2 Columns) */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                ACTIVE MISSION IN PROGRESS
              </div>
              <span className="text-xs bg-card-border text-gray-300 px-2.5 py-0.5 rounded font-mono">
                TASK #104
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              Audit TypeScript Strictness & Verify Build
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Assigned to <span className="text-white font-bold">🔨 Forge</span> inside workspace <span className="font-mono text-gray-300">ws-agent-workspace</span>.
            </p>

            {/* Live Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Step 2 of 3: Applying Verified Fix</span>
                <span className="text-primary-400 font-bold">66%</span>
              </div>
              <div className="w-full h-2 bg-card-border rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full w-2/3 transition-all duration-500" />
              </div>
            </div>

            {/* Live Action Terminal Box */}
            <div className="bg-[#090a0f] border border-card-border rounded-lg p-3 text-xs font-mono text-gray-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary-400" />
                <span>Forge: Running typecheck via Local Runner...</span>
              </div>
              <span className="text-[10px] text-gray-500">12s elapsed</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-card-border">
            <div className="text-[11px] text-gray-400 font-mono">
              Tokens: 1,420 • Est. Cost: $0.003
            </div>
            <Link
              href="/tasks/task-104"
              className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1"
            >
              Open Mission Room <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Attention Required / Approvals Card (1 Column) */}
        <div className="bg-card border border-warning/30 rounded-xl p-6 flex flex-col justify-between shadow-lg shadow-warning/5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-warning mb-4">
              <ShieldAlert className="w-4 h-4" />
              HUMAN APPROVAL REQUIRED (1)
            </div>

            <div className="p-4 bg-[#0d0f15] border border-warning/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">🔨 Forge</span>
                <span className="text-[10px] bg-warning/20 text-warning px-2 py-0.5 rounded font-bold">
                  PLAN APPROVAL
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Forge proposes modifying <span className="font-mono text-accent">VerifiedComponent.tsx</span> and running <span className="font-mono text-accent">npm test</span>.
              </p>
              <div className="text-[10px] font-mono text-gray-400">
                Risk: MEDIUM • 1 file affected
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Link
              href="/approvals"
              className="w-full py-2 px-3 bg-warning hover:bg-warning/90 text-black font-bold text-xs rounded-lg text-center transition-all shadow-md"
            >
              Review & Authorize
            </Link>
          </div>
        </div>
      </div>

      {/* Workforce Roster & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Directory Snapshot */}
        <div className="bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              Digital Workforce Roster
            </h3>
            <Link href="/agents" className="text-xs text-gray-400 hover:text-white">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {/* Forge */}
            <div className="p-3 bg-[#0d0f15] border border-card-border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔨</span>
                <div>
                  <div className="text-xs font-bold text-white">Forge</div>
                  <div className="text-[10px] text-gray-400">Senior Software Engineer</div>
                </div>
              </div>
              <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded font-mono font-bold">
                WORKING
              </span>
            </div>

            {/* Sentinel */}
            <div className="p-3 bg-[#0d0f15] border border-card-border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <div className="text-xs font-bold text-white">Sentinel</div>
                  <div className="text-[10px] text-gray-400">Staff QA & Reliability</div>
                </div>
              </div>
              <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded font-mono font-bold">
                WAITING QA
              </span>
            </div>

            {/* Atlas */}
            <div className="p-3 bg-[#0d0f15] border border-card-border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🧠</span>
                <div>
                  <div className="text-xs font-bold text-white">Atlas</div>
                  <div className="text-[10px] text-gray-400">Chief of Staff</div>
                </div>
              </div>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono font-bold">
                IDLE
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Activity Ledger (2 Columns) */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              Live Telemetry & Activity Ledger
            </h3>
            <span className="text-[10px] font-mono text-gray-400">REALTIME STREAM</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-2.5 rounded bg-[#0d0f15] border border-card-border flex items-start justify-between">
              <div className="flex items-start gap-2">
                <span className="text-success font-bold">●</span>
                <div>
                  <span className="text-white font-bold">Forge</span> executed tool <span className="text-accent">fs_list_dir</span> inside workspace <span className="text-gray-400">ws-agent-workspace</span>.
                </div>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">16:42:01</span>
            </div>

            <div className="p-2.5 rounded bg-[#0d0f15] border border-card-border flex items-start justify-between">
              <div className="flex items-start gap-2">
                <span className="text-warning font-bold">●</span>
                <div>
                  <span className="text-white font-bold">PolicyEngine</span> evaluated Plan Step #2 as <span className="text-warning font-bold">MEDIUM RISK</span>. Created approval request.
                </div>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">16:42:05</span>
            </div>

            <div className="p-2.5 rounded bg-[#0d0f15] border border-card-border flex items-start justify-between">
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">●</span>
                <div>
                  <span className="text-white font-bold">GideonRunner</span> on machine <span className="text-gray-300 font-bold">GIDMACHINE_WIN</span> emitted heartbeat. All processes healthy.
                </div>
              </div>
              <span className="text-[10px] text-gray-500 shrink-0">16:42:15</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
