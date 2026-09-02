import React from 'react';
import { BrainCircuit, Shield, Check, Trash2, Power, PlusCircle } from 'lucide-react';

export default function MemoryVaultPage() {
  const memories = [
    {
      id: 'mem-1',
      category: 'USER',
      key: 'developer_stack_preferences',
      summary: 'Gideon prefers Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase PostgreSQL, and Vercel.',
      confidence: 1.0,
      source: 'USER_EXPLICIT',
      sourceRef: 'Initial System Configuration',
      status: 'ACTIVE',
      lastConfirmed: 'September 2026'
    },
    {
      id: 'mem-2',
      category: 'PROJECT',
      key: 'safety_policy_baseline',
      summary: 'Strict zero-secret-file leak policy. Plan approval is required for all write modifications.',
      confidence: 1.0,
      source: 'USER_EXPLICIT',
      sourceRef: 'Security Mandate',
      status: 'ACTIVE',
      lastConfirmed: 'September 2026'
    },
    {
      id: 'mem-3',
      category: 'LESSON',
      key: 'lesson_stemi_pnpm_requirement',
      summary: 'Stemi AI project strictly requires pnpm due to monorepo workspace dependencies. Do not use standard npm.',
      confidence: 0.95,
      source: 'TASK_LESSON',
      sourceRef: 'Task #102 Post-Review',
      status: 'ACTIVE',
      lastConfirmed: '1 day ago'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary-500" />
            Personal & Project Memory Vault
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Scoped knowledge repository with explicit provenance tags, confidence metrics, and editable verification status.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20">
          <PlusCircle className="w-4 h-4" />
          Add Memory Fact
        </button>
      </div>

      <div className="space-y-4">
        {memories.map((mem) => (
          <div key={mem.id} className="bg-card border border-card-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded font-mono font-bold">
                  {mem.category}
                </span>
                <span className="text-xs font-mono font-bold text-white">{mem.key}</span>
                <span className="text-[10px] text-success font-mono font-bold bg-success/10 px-2 py-0.5 rounded">
                  {mem.confidence * 100}% CONFIDENCE
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{mem.summary}</p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500">
                <span>Source: <strong className="text-gray-400">{mem.source}</strong> ({mem.sourceRef})</span>
                <span>Confirmed: <strong className="text-gray-400">{mem.lastConfirmed}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-card-border hover:bg-white/10 text-gray-300 text-xs font-bold transition-all">
                Edit Source
              </button>
              <button className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
