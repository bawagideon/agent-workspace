'use client';

import React, { useState } from 'react';
import { Terminal, Play, Pause, AlertOctagon, Sun, CheckCircle2, ShieldAlert, Send } from 'lucide-react';

export function GideonCommandBar() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<{
    verb: string;
    executionMs: number;
    message: string;
    success: boolean;
  } | null>(null);

  const sendCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer gideon-master-control-key-2026'
        },
        body: JSON.stringify({
          command: cmdText,
          senderId: 'pwa-client',
          source: 'pwa'
        })
      });
      const data = await res.json();
      setLastResponse({
        verb: data.verb || 'COMMAND',
        executionMs: data.executionMs || 15,
        message: data.message || (data.success ? 'Command executed successfully.' : data.error),
        success: data.success
      });
      setInput('');
    } catch (err: any) {
      setLastResponse({
        verb: 'ERROR',
        executionMs: 0,
        message: err.message || 'Failed to reach Command API',
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendCommand(input);
    }
  };

  return (
    <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
            Gideon Remote Command Console
          </span>
        </div>
        <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
          ROL v5.0.5 • Sub-50ms Direct
        </span>
      </div>

      {/* Quick Action Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => sendCommand('briefing')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-amber-300 text-xs font-medium border border-gray-700/60 transition"
        >
          <Sun className="w-3.5 h-3.5" />
          Briefing
        </button>

        <button
          onClick={() => sendCommand('status')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-blue-300 text-xs font-medium border border-gray-700/60 transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Status
        </button>

        <button
          onClick={() => sendCommand('pause all')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-yellow-300 text-xs font-medium border border-gray-700/60 transition"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause All
        </button>

        <button
          onClick={() => sendCommand('resume all')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-emerald-300 text-xs font-medium border border-gray-700/60 transition"
        >
          <Play className="w-3.5 h-3.5" />
          Resume All
        </button>

        <button
          onClick={() => sendCommand('kill-all')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-bold border border-red-800/50 transition ml-auto"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Emergency Kill Switch
        </button>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Type verb (e.g. 'pause', 'resume', 'approve appr-1234', 'briefing') or strategic goal..."
            className="w-full bg-[#090b0e] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <button
          onClick={() => sendCommand(input)}
          disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
        >
          <Send className="w-3.5 h-3.5" />
          Run
        </button>
      </div>

      {/* Output card */}
      {lastResponse && (
        <div
          className={`mt-3 p-3 rounded-lg border text-xs font-mono transition-all ${
            lastResponse.success
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/20 border-red-800/60 text-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1 text-[11px] text-gray-400">
            <span className="font-bold text-gray-200">VERB: {lastResponse.verb}</span>
            <span>⚡ {lastResponse.executionMs}ms</span>
          </div>
          <p className="whitespace-pre-line">{lastResponse.message}</p>
        </div>
      )}
    </div>
  );
}
