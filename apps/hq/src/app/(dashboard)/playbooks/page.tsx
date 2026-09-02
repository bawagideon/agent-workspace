import React from 'react';
import { BookOpen, PlusCircle, Play, CheckCircle2, ArrowRight } from 'lucide-react';

export default function PlaybooksPage() {
  const playbooks = [
    {
      id: 'playbook-safe-coding',
      name: 'Safe Coding & Verification Routine',
      category: 'Development',
      type: 'DETERMINISTIC',
      description: 'Standard 7-step engineering routine followed by Forge for every code modification.',
      steps: [
        'Inspect workspace & read affected files',
        'Formulate atomic plan with diff strategy',
        'Request Plan Approval if modifying code',
        'Apply verified modifications inside sandbox',
        'Run typecheck & unit tests',
        'Compute automated self-review scorecard',
        'Hand off to Sentinel QA for independent audit'
      ],
      status: 'ACTIVE',
      version: 1
    },
    {
      id: 'playbook-build-verification',
      name: 'Next.js Production Build Validation',
      category: 'QA',
      type: 'DETERMINISTIC',
      description: 'Strict clean-room build verification routine executed by Sentinel.',
      steps: [
        'Clean build cache (.next/ directory)',
        'Execute TypeScript validation (tsc --noEmit)',
        'Execute Next.js production build (npm run build)',
        'Audit chunk bundle size limits',
        'Report build scorecard'
      ],
      status: 'ACTIVE',
      version: 1
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-500" />
            Playbook & Routine Engine
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Codified, repeatable workflows that agents fetch and execute deterministically.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20">
          <PlusCircle className="w-4 h-4" />
          Create Playbook
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playbooks.map((pb) => (
          <div key={pb.id} className="bg-card border border-card-border rounded-xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-gray-400">{pb.id}</span>
                <span className="text-[10px] bg-primary-600/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded font-mono font-bold">
                  {pb.type} • v{pb.version}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{pb.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{pb.description}</p>

              <div className="space-y-2 bg-[#090a0f] p-3 rounded-lg border border-card-border">
                <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider font-bold">
                  Routine Steps:
                </div>
                {pb.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="font-mono text-primary-400 font-bold shrink-0">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-card-border flex items-center justify-between">
              <span className="text-xs text-success flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Dispatch
              </span>
              <button className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1">
                Edit Routine <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
