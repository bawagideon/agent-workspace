import React from 'react';
import { Activity, Filter, Terminal, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export default function ActivityLogPage() {
  const events = [
    {
      id: 'evt-1',
      time: '16:42:15',
      agent: 'GideonRunner',
      machine: 'GIDMACHINE_WIN',
      type: 'RUNNER_HEARTBEAT',
      severity: 'INFO',
      message: 'Runner emitted periodic health heartbeat. All 7 capabilities verified.'
    },
    {
      id: 'evt-2',
      time: '16:42:05',
      agent: 'PolicyEngine',
      machine: 'CLOUD',
      type: 'APPROVAL_REQUESTED',
      severity: 'WARN',
      message: 'Evaluated Plan Step #2 (fs_write_file) as MEDIUM RISK. Dispatched approval request appr-1725291725.'
    },
    {
      id: 'evt-3',
      time: '16:42:02',
      agent: 'Forge',
      machine: 'GIDMACHINE_WIN',
      type: 'TOOL_EXECUTION_COMPLETED',
      severity: 'INFO',
      message: 'Executed fs_list_dir inside workspace ws-agent-workspace. Found 14 directories.'
    },
    {
      id: 'evt-4',
      time: '16:42:00',
      agent: 'Atlas',
      machine: 'CLOUD',
      type: 'TASK_CREATED',
      severity: 'INFO',
      message: 'Dispatched task #104: Audit TypeScript Strictness to Forge.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Immutable Activity Stream & Audit Ledger
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Cryptographically bound operational log of all agent decisions, tool executions, and security checks.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-gray-300 text-xs font-bold px-3.5 py-2 rounded-lg transition-all">
          <Filter className="w-3.5 h-3.5" />
          Filter Audit Stream
        </button>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="divide-y divide-card-border">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 hover:bg-white/[0.02] transition-all flex items-start justify-between gap-4 font-mono text-xs">
              <div className="flex items-start gap-3">
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    evt.severity === 'WARN'
                      ? 'bg-warning'
                      : evt.severity === 'ERROR'
                      ? 'bg-danger'
                      : 'bg-accent'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{evt.agent}</strong>
                    <span className="text-[10px] bg-card-border text-gray-400 px-1.5 py-0.2 rounded">
                      {evt.type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      on {evt.machine}
                    </span>
                  </div>
                  <p className="text-gray-300 font-sans text-xs">{evt.message}</p>
                </div>
              </div>

              <span className="text-[11px] text-gray-500 shrink-0">{evt.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
