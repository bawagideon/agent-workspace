'use client';

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, X, ArrowLeft, Terminal, FileCode2, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ApprovalCenterPage() {
  const [approvals, setApprovals] = useState([
    {
      id: 'appr-1725291725',
      taskId: 'task-104',
      taskTitle: 'Audit TypeScript Strictness & Verify Build',
      agent: '🔨 Forge (Senior Developer)',
      workspace: 'ws-agent-workspace (C:\\Users\\DELL\\agent-workspace)',
      riskLevel: 'MEDIUM',
      approvalMode: 'PLAN APPROVAL',
      actionType: 'FILE_WRITE & TEST',
      description: 'Apply targeted type corrections to VerifiedComponent.tsx and execute npm test verification.',
      targetFile: 'src/components/VerifiedComponent.tsx',
      diffPreview: `--- a/src/components/VerifiedComponent.tsx
+++ b/src/components/VerifiedComponent.tsx
@@ -1,3 +1,4 @@
+// Verified fix for: Audit TypeScript Strictness
-export const VerifiedComponent = (props: any) => <div>Old</div>;
+export const VerifiedComponent = (props: { title?: string }) => <div>Fixed</div>;
`,
      commandPreview: 'npm test -- --runInBand',
      status: 'PENDING',
      expiresIn: '24 minutes'
    }
  ]);

  const handleDecision = (id: string, decision: 'APPROVED' | 'REJECTED') => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    alert(`Approval Request ${id} has been ${decision}. The Local Runner has been notified.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-warning" />
            Human-in-the-Loop Approval Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review, inspect diffs, and authorize proposed agent mutations and high-risk operations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <span>Pending Decisions: <strong className="text-warning">{approvals.length}</strong></span>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-success mx-auto" />
          <h3 className="text-sm font-bold text-white">All Clear — No Pending Approvals</h3>
          <p className="text-xs text-gray-400">Agents are operating within their authorized policy scopes.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {approvals.map((req) => (
            <div key={req.id} className="bg-card border border-warning/30 rounded-xl overflow-hidden shadow-xl shadow-warning/5">
              {/* Approval Request Header */}
              <div className="p-5 border-b border-card-border bg-[#0d0f15] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-gray-400">{req.id}</span>
                    <span className="text-[10px] bg-warning/20 text-warning px-2.5 py-0.5 rounded font-bold font-mono border border-warning/30">
                      {req.riskLevel} RISK • {req.approvalMode}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires in {req.expiresIn}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    <Link href={`/tasks/${req.taskId}`} className="hover:text-primary-400">
                      {req.taskTitle}
                    </Link>
                  </h2>
                </div>

                {/* Quick Details */}
                <div className="text-xs font-mono text-gray-400 space-y-0.5 md:text-right">
                  <div>Agent: <strong className="text-white">{req.agent}</strong></div>
                  <div>Workspace: <strong className="text-gray-300">{req.workspace}</strong></div>
                </div>
              </div>

              {/* Rationale & Action Description */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {req.description}
                </p>

                {/* Visual Code Diff Preview */}
                {req.diffPreview && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-gray-400 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-accent" />
                      Target File Modification: <span className="text-white">{req.targetFile}</span>
                    </div>
                    <pre className="bg-[#090a0f] border border-card-border p-3.5 rounded-lg font-mono text-xs overflow-x-auto text-gray-300">
                      {req.diffPreview}
                    </pre>
                  </div>
                )}

                {/* Command Preview */}
                {req.commandPreview && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-gray-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-primary-400" />
                      Verification Command to Execute:
                    </div>
                    <div className="bg-[#090a0f] border border-card-border p-2.5 rounded-lg font-mono text-xs text-primary-300 flex items-center justify-between">
                      <code>{req.commandPreview}</code>
                      <span className="text-[10px] text-gray-500 font-mono">Sandboxed (GIDMACHINE)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-5 bg-[#0d0f15] border-t border-card-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <span>Authorizing this plan grants Forge permission to execute only these listed changes.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDecision(req.id, 'REJECTED')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-300 text-xs font-bold transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-danger" />
                    Reject Plan
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, 'APPROVED')}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-warning hover:bg-warning/90 text-black text-xs font-bold transition-all shadow-lg shadow-warning/10"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Authorize Execution
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
