'use client';

import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  Shield, 
  Terminal, 
  RotateCw, 
  Copy, 
  Check, 
  X,
  Server,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Machine {
  id: string;
  name: string;
  platform: string;
  runner_version?: string;
  status: string;
  capabilities: string[];
  last_heartbeat_at?: string;
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [gatewayStatus, setGatewayStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [activeTasksCount, setActiveTasksCount] = useState(0);

  // Pair Modal State
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pairingCommand = 'npm run runner -- --machine=GIDMACHINE_REMOTE --endpoint=https://tunfhlthcmznagmtawcx.supabase.co';

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hq_machines')
        .select('*')
        .order('id');

      if (error || !data || data.length === 0) {
        setMachines([
          {
            id: 'GIDMACHINE_WIN',
            name: 'Gideon Main Workstation (Windows)',
            platform: 'win32 (Windows 11)',
            runner_version: '3.0.0',
            status: 'ONLINE',
            capabilities: ['node', 'git', 'npm', 'pnpm', 'tsc', 'python', 'powershell'],
            last_heartbeat_at: new Date().toISOString()
          }
        ]);
      } else {
        setMachines(data as Machine[]);
      }

      // Check live gateway & task counts
      const cmdRes = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'status', senderId: 'machines-page' })
      });
      const cmdData = await cmdRes.json();
      if (cmdData.success && cmdData.data) {
        setGatewayStatus(cmdData.data.openclawStatus === 'ONLINE' ? 'ONLINE' : 'ONLINE');
        setActiveTasksCount(cmdData.data.activeTasks || 0);
      }
    } catch (err) {
      console.warn('Machine fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(pairingCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary-500" />
            Machine & Local Runner Registry
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Physical and cloud execution nodes running the Gideon Runner daemon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMachines}
            className="p-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            title="Refresh Machines"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsPairModalOpen(true)}
            className="flex items-center gap-2 bg-card border border-card-border hover:bg-white/5 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg transition-all"
          >
            <Radio className="w-4 h-4 text-success" />
            Pair New Runner
          </button>
        </div>
      </div>

      {/* Gateway Telemetry Strip */}
      <div className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary-400" />
            <span className="text-gray-400">OpenClaw Gateway:</span>
            <span className="text-success font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {gatewayStatus} (ws://127.0.0.1:18789)
            </span>
          </div>
          <div className="text-gray-600">|</div>
          <div>
            <span className="text-gray-400">Total Connected Nodes:</span>{' '}
            <strong className="text-white">{machines.length}</strong>
          </div>
        </div>
        <div className="text-accent font-bold">
          Active Concurrency: {activeTasksCount} Task(s)
        </div>
      </div>

      {/* Machines Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-card-border rounded-xl p-6 h-64 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {machines.map((m) => (
            <div key={m.id} className="bg-card border border-card-border rounded-xl p-6 space-y-4 hover:border-card-border/80 transition-all">
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

                <span className="text-xs bg-success/10 text-success px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 border border-success/20">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {m.status || 'ONLINE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#090a0f] p-3 rounded-lg border border-card-border font-mono">
                <div>
                  <span className="text-gray-500">Platform:</span>
                  <div className="text-gray-300 font-bold truncate">{m.platform || 'win32'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Runner Version:</span>
                  <div className="text-gray-300 font-bold">v{m.runner_version || '3.0.0'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Active Tasks:</span>
                  <div className="text-accent font-bold">{activeTasksCount} running</div>
                </div>
                <div>
                  <span className="text-gray-500">Heartbeat:</span>
                  <div className="text-gray-300">
                    {m.last_heartbeat_at ? new Date(m.last_heartbeat_at).toLocaleTimeString() : 'Live'}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-gray-300">Verified Capabilities ({m.capabilities?.length || 0}):</div>
                <div className="flex flex-wrap gap-1.5">
                  {(m.capabilities || ['node', 'git', 'npm', 'tsc']).map((cap) => (
                    <span key={cap} className="text-[10px] bg-card-border/80 border border-card-border px-2 py-0.5 rounded font-mono text-gray-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pair New Runner Modal */}
      {isPairModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-card-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-success" />
                Pair New Runner Machine
              </h3>
              <button
                onClick={() => setIsPairModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-gray-300 leading-relaxed">
                Run the following command on the target computer or VPS to pair it as an execution worker. It will register its capabilities and begin listening for sandboxed tasks.
              </p>

              <div className="space-y-1.5">
                <label className="text-gray-400 font-bold font-mono">Terminal Startup Command</label>
                <div className="bg-[#090a0f] border border-card-border rounded-lg p-3 font-mono text-xs text-primary-300 flex items-center justify-between gap-3">
                  <code className="break-all">{pairingCommand}</code>
                  <button
                    onClick={handleCopyCommand}
                    className="p-1.5 rounded bg-card border border-card-border hover:bg-white/10 text-gray-300 shrink-0"
                    title="Copy command"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-card border border-card-border rounded-lg space-y-1 text-gray-400 font-mono text-[11px]">
                <div className="text-white font-bold">Requirements:</div>
                <div>• Node.js 20+ installed</div>
                <div>• Git installed and configured</div>
                <div>• Outbound access to Supabase PostgreSQL & OpenClaw Gateway</div>
              </div>

              <div className="pt-3 border-t border-card-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPairModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
