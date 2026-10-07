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
  CheckSquare,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default async function TaskMissionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch Task
  const { data: task } = await supabase
    .from('hq_tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!task) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12 text-center">
        <div className="bg-card border border-card-border rounded-xl p-12 space-y-4">
          <AlertCircle className="w-12 h-12 text-warning mx-auto" />
          <h1 className="text-lg font-bold text-white">Task Not Found</h1>
          <p className="text-xs text-gray-400 font-mono">
            Could not find an active or historical task with identifier: <span className="text-white">{id}</span>
          </p>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Task Registry
          </Link>
        </div>
      </div>
    );
  }

  // 2. Fetch associated runs & approvals
  const [runsRes, approvalsRes, eventsRes] = await Promise.all([
    supabase.from('hq_task_runs').select('*').eq('task_id', id).order('run_number', { ascending: false }),
    supabase.from('hq_approvals').select('*').eq('task_id', id).order('created_at', { ascending: false }),
    supabase.from('hq_events').select('*').contains('payload', { taskId: id }).order('created_at', { ascending: true })
  ]);

  const runs = runsRes.data || [];
  const approvals = approvalsRes.data || [];
  const events = eventsRes.data || [];
  const pendingApproval = approvals.find((a: any) => a.status === 'PENDING');

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
              <span className="text-xs font-mono text-gray-400">MISSION ROOM • {task.id.slice(0, 8)}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                  task.status === 'COMPLETED'
                    ? 'bg-success/10 text-success border border-success/20'
                    : task.status === 'WAITING_APPROVAL'
                    ? 'bg-warning/10 text-warning border border-warning/20'
                    : task.status === 'FAILED'
                    ? 'bg-danger/10 text-danger border border-danger/20'
                    : 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                }`}
              >
                {task.status}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
              {task.title}
            </h1>
          </div>
        </div>

        {/* Mission Action Link to Gideon Chat */}
        <div className="flex items-center gap-3">
          <Link
            href={`/chat?cmd=task status ${task.id}`}
            className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
          >
            <Terminal className="w-4 h-4 text-accent" />
            Control in Chat
          </Link>
        </div>
      </div>

      {/* 3-Column Mission Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mission Timeline (3 cols) */}
        <div className="lg:col-span-3 bg-card border border-card-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider">
            Execution Stages
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5 font-bold">
                ✓
              </div>
              <div>
                <div className="font-bold text-white">1. Task Ingestion</div>
                <div className="text-[11px] text-gray-400">Created in state {task.status}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                ['RUNNING', 'WAITING_APPROVAL', 'COMPLETED'].includes(task.status)
                  ? 'bg-success/20 text-success'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {['RUNNING', 'WAITING_APPROVAL', 'COMPLETED'].includes(task.status) ? '✓' : '2'}
              </div>
              <div>
                <div className="font-bold text-white">2. Agent Assignment</div>
                <div className="text-[11px] text-gray-400">Assigned to {task.assigned_agent_id}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                task.status === 'WAITING_APPROVAL'
                  ? 'bg-warning/20 text-warning animate-pulse'
                  : task.status === 'COMPLETED'
                  ? 'bg-success/20 text-success'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {task.status === 'COMPLETED' ? '✓' : task.status === 'WAITING_APPROVAL' ? '!' : '3'}
              </div>
              <div>
                <div className="font-bold text-white">3. Governance & Risk</div>
                <div className="text-[11px] text-gray-400">
                  {task.status === 'WAITING_APPROVAL' ? 'Waiting for Plan Approval' : 'Policy checked'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                task.status === 'COMPLETED'
                  ? 'bg-success/20 text-success'
                  : task.status === 'FAILED'
                  ? 'bg-danger/20 text-danger'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {task.status === 'COMPLETED' ? '✓' : task.status === 'FAILED' ? '✕' : '4'}
              </div>
              <div>
                <div className="font-bold text-white">4. Final Outcome</div>
                <div className="text-[11px] text-gray-400">{task.status}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-card-border text-xs space-y-1.5 font-mono text-gray-400">
            <div>Workspace: <strong className="text-gray-300">{task.workspace_id}</strong></div>
            <div>Priority: <strong className="text-gray-300">{task.priority}</strong></div>
            <div>Autonomy: <strong className="text-accent">{task.autonomy_mode || 'PLAN_APPROVAL'}</strong></div>
          </div>
        </div>

        {/* Center Column: Telemetry / Goal / Summary (6 cols) */}
        <div className="lg:col-span-6 bg-card border border-card-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                Mission Objective & Deliverable Summary
              </h3>
              <span className="text-[10px] bg-card-border text-gray-300 px-2 py-0.5 rounded font-mono">
                {task.workspace_id}
              </span>
            </div>

            <div className="bg-[#090a0f] border border-card-border rounded-lg p-4 font-mono text-xs text-gray-300 space-y-3">
              <div>
                <span className="text-gray-500 font-bold block mb-1">TASK GOAL:</span>
                <p className="text-gray-200 leading-relaxed">{task.goal}</p>
              </div>

              {task.result_summary && (
                <div className="pt-3 border-t border-card-border">
                  <span className="text-success font-bold block mb-1">RESULT SUMMARY:</span>
                  <p className="text-gray-300 leading-relaxed">{task.result_summary}</p>
                </div>
              )}
            </div>

            {/* Event Activity Stream */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold font-mono text-gray-400">Execution Telemetry Events ({events.length})</h4>
              {events.length === 0 ? (
                <p className="text-[11px] text-gray-500 font-mono italic">No telemetry events logged for this task yet.</p>
              ) : (
                <div className="bg-[#090a0f] border border-card-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                  {events.map((ev: any) => (
                    <div key={ev.id} className="text-gray-400 text-[11px]">
                      <span className="text-gray-500">[{new Date(ev.created_at).toLocaleTimeString()}]</span>{' '}
                      <span className="text-accent">{ev.event_type}</span>: {ev.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#0d0f15] border border-card-border rounded-lg flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Agent: <strong className="text-white">{task.assigned_agent_id}</strong></span>
            <span className="text-gray-400">
              Runs: <strong className="text-accent">{runs.length}</strong>
            </span>
          </div>
        </div>

        {/* Right Column: Approval Card & Context Artifacts (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {pendingApproval ? (
            <div className="bg-card border border-warning/30 rounded-xl p-5 space-y-4 shadow-lg shadow-warning/5">
              <div className="flex items-center gap-2 text-xs font-bold text-warning">
                <ShieldAlert className="w-4 h-4" />
                Action Requires Approval
              </div>

              <p className="text-xs text-gray-300">
                {pendingApproval.description || 'A high-risk mutation step is waiting for operator authorization.'}
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
          ) : (
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-success font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                No Pending Approvals
              </div>
              <p className="text-gray-400 text-[11px]">
                This task has no actions blocked awaiting human operator decision.
              </p>
            </div>
          )}

          {/* Runs Stored */}
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary-500" />
              Task Runs ({runs.length})
            </h3>

            {runs.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono italic">No runs recorded.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((r: any) => (
                  <div key={r.id} className="p-2.5 rounded bg-[#0d0f15] border border-card-border text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-white">Run #{r.run_number}</span>
                      <span className="text-[10px] text-accent">{r.status}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Tokens: {r.total_tokens || 0} • Cost: ${(Number(r.total_cost || 0)).toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
