'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  ArrowLeft, 
  Terminal, 
  FileCode2, 
  Clock, 
  AlertTriangle,
  RotateCw,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface ApprovalRequest {
  id: string;
  task_id: string;
  task_title?: string;
  agent_id?: string;
  workspace_id?: string;
  risk_level: string;
  approval_mode: string;
  action_type?: string;
  description: string;
  target_file?: string;
  diff_preview?: string;
  command_preview?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reviewer_notes?: string;
  expires_at?: string;
  created_at?: string;
}

export default function ApprovalCenterPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'RESOLVED'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/approvals');
      const data = await res.json();
      if (data.success && Array.isArray(data.approvals)) {
        setApprovals(data.approvals);
      }
    } catch (err: any) {
      console.warn('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessingId(id);
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId: id,
          decision,
          reviewerNotes: `Resolved via HQ Web Approval Center`
        })
      });

      const data = await res.json();
      if (data.success) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === id ? { 
            ...a, 
            status: decision,
            reviewer_notes: data.approval?.reviewer_notes || a.reviewer_notes
          } : a))
        );
        const execNote = data.execution?.output ? ` — Command executed cleanly!` : '';
        setActionFeedback(`Success: Request ${id.slice(0, 8)} ${decision}${execNote}`);
        setTimeout(() => setActionFeedback(null), 6000);
      } else {
        setActionFeedback(`Action failed: ${data.error}`);
      }
    } catch (err: any) {
      setActionFeedback(`Network error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingList = approvals.filter((a) => a.status === 'PENDING');
  const resolvedList = approvals.filter((a) => a.status !== 'PENDING');
  const displayList = activeTab === 'PENDING' ? pendingList : resolvedList;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </span>
            Human-in-the-Loop Governance & Approvals
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Cryptographically sealed human authority gate. Authorize live pushes, production builds, and external broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApprovals}
            className="p-2.5 rounded-xl bg-[#0e131f]/80 border border-white/10 hover:border-cyan-500/40 text-gray-400 hover:text-white transition-all shadow-sm"
            title="Refresh Approvals"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-gray-300 bg-[#0e131f]/80 border border-white/10 px-3.5 py-2 rounded-xl shadow-inner">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Pending Gates: <strong className="text-amber-400">{pendingList.length}</strong></span>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center justify-between transition-all shadow-lg ${
          actionFeedback.includes('failed') || actionFeedback.includes('error')
            ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
            : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{actionFeedback.includes('failed') ? '⚠️' : '⚡'}</span>
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          Pending Decisions ({pendingList.length})
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            activeTab === 'RESOLVED'
              ? 'bg-white/10 border border-white/20 text-white shadow-sm'
              : 'text-gray-400 hover:text-white border border-transparent'
          }`}
        >
          Resolved History ({resolvedList.length})
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center text-gray-500 space-y-3">
          <RotateCw className="w-7 h-7 animate-spin mx-auto text-cyan-400" />
          <p className="text-xs font-mono">Syncing control plane with Supabase...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-[#0b0f19]/60 backdrop-blur-md border border-white/5 rounded-2xl p-16 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            {activeTab === 'PENDING' ? 'All Clear — No Pending Approvals' : 'No Resolved Approvals in History'}
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {activeTab === 'PENDING'
              ? 'Autonomous agents are operating strictly within their pre-authorized policy scopes.'
              : 'Decisions taken on high-risk operations will appear here for governance auditing.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayList.map((req) => (
            <div
              key={req.id}
              className={`bg-[#0b0f19]/70 backdrop-blur-md border rounded-2xl overflow-hidden transition-all shadow-xl ${
                req.status === 'PENDING'
                  ? 'border-amber-500/30 shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : req.status === 'APPROVED'
                  ? 'border-emerald-500/30 shadow-emerald-500/5'
                  : 'border-white/10 opacity-75'
              }`}
            >
              {/* Approval Request Header */}
              <div className="p-5 border-b border-white/5 bg-[#0e1322]/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                      {req.id.slice(0, 12)}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono border ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {req.risk_level || 'MEDIUM'} RISK • {req.action_type || req.approval_mode || 'PLAN_APPROVAL'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" /> {req.created_at ? new Date(req.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    <Link href={`/tasks/${req.task_id}`} className="hover:text-cyan-400 transition-colors">
                      {req.task_title || `Task #${req.task_id.slice(0, 8)}`}
                    </Link>
                  </h2>
                </div>

                {/* Quick Details */}
                <div className="text-xs font-mono text-gray-400 space-y-0.5 md:text-right">
                  <div>Assigned Agent: <strong className="text-white capitalize">{req.agent_id || 'forge'}</strong></div>
                  <div>Gate Status: <strong className={
                    req.status === 'APPROVED' ? 'text-emerald-400' : req.status === 'PENDING' ? 'text-amber-400' : 'text-rose-400'
                  }>{req.status}</strong></div>
                </div>
              </div>

              {/* Rationale & Action Description */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  {req.description}
                </p>

                {/* Visual Code Diff Preview */}
                {req.diff_preview && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-gray-400 flex items-center gap-1.5">
                      <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                      Payload / Content Preview: <span className="text-white">{req.target_file || 'Standard Manifest'}</span>
                    </div>
                    <pre className="bg-[#06080e] border border-white/5 p-4 rounded-xl font-mono text-xs overflow-x-auto text-gray-300 max-h-64 leading-relaxed">
                      {req.diff_preview}
                    </pre>
                  </div>
                )}

                {/* Command Preview */}
                {req.command_preview && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-gray-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      Authorized Command to Execute on Approval:
                    </div>
                    <div className="bg-[#06080e] border border-white/5 p-3 rounded-xl font-mono text-xs text-amber-300/90 flex items-center justify-between">
                      <code className="break-all">{req.command_preview}</code>
                      <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap ml-2">Sandbox (GIDMACHINE)</span>
                    </div>
                  </div>
                )}

                {/* Resolved Reviewer Notes / Execution Log */}
                {req.reviewer_notes && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-white/5">
                    <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Resolution & Execution Audit Trail:
                    </div>
                    <pre className="bg-[#06080e] border border-emerald-500/20 p-3.5 rounded-xl font-mono text-xs overflow-x-auto text-emerald-300/90 max-h-48 whitespace-pre-wrap">
                      {req.reviewer_notes}
                    </pre>
                  </div>
                )}
              </div>

              {/* Action Buttons (Only for PENDING) */}
              {req.status === 'PENDING' && (
                <div className="p-5 bg-[#0e1322]/80 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-mono">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Human Authority Gate: Clicking authorize executes the verified script via GIDMACHINE.</span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => handleDecision(req.id, 'REJECTED')}
                      disabled={processingId === req.id}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/30 text-gray-300 hover:text-rose-300 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      Reject Plan
                    </button>
                    <button
                      onClick={() => handleDecision(req.id, 'APPROVED')}
                      disabled={processingId === req.id}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-extrabold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95"
                    >
                      {processingId === req.id ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          Authorizing & Executing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Authorize Execution
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
