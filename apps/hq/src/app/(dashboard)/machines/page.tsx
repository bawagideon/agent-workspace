import React from 'react';
import { HardDrive, CheckCircle2, Cpu, Radio, Shield, Terminal } from 'lucide-react';

export default function MachinesPage() {
  const machines = [
    {
      id: 'GIDMACHINE_WIN',
      name: 'Gideon Main Workstation (Windows)',
      platform: 'win32 (Windows 11)',
      runnerVersion: '3.0.0',
      status: 'ONLINE',
      capabilities: ['node', 'git', 'npm', 'pnpm', 'tsc', 'python', 'powershell'],
      activeTasks: 1,
      lastHeartbeat: '5s ago',
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary-500" />
            Machine & Local Runner Registry
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Registered machines running the Gideon Runner daemon. Physical tasks execute here.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg transition-all">
          <Radio className="w-4 h-4 text-success" />
          Pair New Runner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {machines.map((m) => (
          <div key={m.id} className="bg-card border border-card-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{m.name}</h3>
                  <div className="text-xs font-mono text-gray-400">{m.id}</div>
                </div>
              </div>

              <span className="text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {m.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#090a0f] p-3 rounded-lg border border-card-border font-mono">
              <div>
                <span className="text-gray-500">Platform:</span>
                <div className="text-gray-300 font-bold">{m.platform}</div>
              </div>
              <div>
                <span className="text-gray-500">Runner Version:</span>
                <div className="text-gray-300 font-bold">v{m.runnerVersion}</div>
              </div>
              <div>
                <span className="text-gray-500">Active Tasks:</span>
                <div className="text-accent font-bold">{m.activeTasks} running</div>
              </div>
              <div>
                <span className="text-gray-500">Heartbeat:</span>
                <div className="text-gray-300">{m.lastHeartbeat}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-gray-300">Verified Capabilities:</div>
              <div className="flex flex-wrap gap-1.5">
                {m.capabilities.map((cap) => (
                  <span key={cap} className="text-[10px] bg-card-border px-2 py-0.5 rounded font-mono text-gray-400">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
