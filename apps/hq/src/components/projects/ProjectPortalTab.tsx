'use client';

import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Trash2, 
  Lock, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { ProjectRecord, ProjectEvent } from '@gideon/shared';

interface PortalCredential {
  id: string;
  projectId: string;
  permissions: string[];
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  createdBy: string;
  createdAt: string;
}

interface ProjectPortalTabProps {
  project: ProjectRecord;
  events: ProjectEvent[];
  onRefresh: () => void;
}

export function ProjectPortalTab({ project, events, onRefresh }: ProjectPortalTabProps) {
  const [credentials, setCredentials] = useState<PortalCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Credential Form State
  const [ttlDays, setTtlDays] = useState(7);
  const [allowFeedback, setAllowFeedback] = useState(true);
  const [allowAccept, setAllowAccept] = useState(true);

  // Newly generated link
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/portal-credentials`);
      const data = await res.json();
      if (data.success) {
        setCredentials(data.credentials || []);
      } else {
        setError(data.message || 'Failed to fetch portal credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching portal credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [project.id]);

  const handleGenerateShare = async () => {
    try {
      setGenerating(true);
      setError(null);
      setGeneratedUrl(null);

      const permissions = ['preview:read'];
      if (allowFeedback) permissions.push('feedback:write');
      if (allowAccept) permissions.push('milestone:accept');

      const res = await fetch(`/api/projects/${project.id}/portal-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttlDays, permissions })
      });

      const data = await res.json();
      if (data.success && data.shareUrl) {
        setGeneratedUrl(data.shareUrl);
        await fetchCredentials();
        onRefresh();
      } else {
        setError(data.message || 'Failed to generate share link.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate share link.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to revoke this client portal link? All active client sessions will be immediately terminated.')) {
      return;
    }

    try {
      setError(null);
      const res = await fetch(`/api/projects/${project.id}/portal-credentials/${shareId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchCredentials();
        onRefresh();
      } else {
        setError(data.message || 'Failed to revoke portal access.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to revoke portal access.');
    }
  };

  const copyToClipboard = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter portal events
  const feedbackEvents = events.filter(e => e.eventType === 'CLIENT_REVIEW_FEEDBACK');
  const approvalEvents = events.filter(e => e.eventType === 'CLIENT_MILESTONE_ACCEPTED');

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Share2 className="w-4 h-4 text-cyan-400" />
            Client Portal & Sovereign Exposure Gateway
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            PHASE 5 GATE • ISOLATED
          </span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Create opaque, cryptographically verified share credentials for external clients. Clients can inspect project deliverables, test live sandboxed previews, submit structured revision feedback, and record milestone acceptance without accessing internal agent prompts, memory lessons, terminal commands, or database credentials.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generator Card */}
      <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider font-mono">
          Generate Shareable Client Portal Link
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono text-gray-400 mb-1">VALIDITY DURATION (TTL)</label>
            <select
              value={ttlDays}
              onChange={e => setTtlDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-gray-800 text-gray-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days (Default)</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col justify-end space-y-2">
            <span className="text-[11px] font-mono text-gray-400">CLIENT PERMISSIONS</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowFeedback}
                  onChange={e => setAllowFeedback(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
                <span>Allow Revision Feedback (<code className="text-[10px] text-gray-400">feedback:write</code>)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowAccept}
                  onChange={e => setAllowAccept(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
                <span>Allow Milestone Acceptance (<code className="text-[10px] text-gray-400">milestone:accept</code>)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleGenerateShare}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            {generating ? 'Generating Secret Credential...' : 'Generate New Client Link'}
          </button>
        </div>

        {/* Generated URL Box */}
        {generatedUrl && (
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-xl space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                ONE-TIME EPHEMERAL BOOTSTRAP SHARE URL
              </span>
              <button
                onClick={copyToClipboard}
                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[10px] flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED!' : 'COPY URL'}
              </button>
            </div>
            <p className="text-[11px] font-mono text-gray-300 break-all bg-black/50 p-2 rounded border border-cyan-900/50 select-all">
              {generatedUrl}
            </p>
            <p className="text-[10px] text-gray-400">
              Note: This URL contains a one-time ephemeral access secret. When opened by the client, it is automatically exchanged for an HttpOnly session cookie and wiped from the browser history.
            </p>
          </div>
        )}
      </div>

      {/* Active Shares Table */}
      <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider font-mono">
            Active & Historical Portal Credentials
          </h3>
          <button
            onClick={fetchCredentials}
            className="p-1 rounded text-gray-400 hover:text-white"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {credentials.length === 0 ? (
          <p className="text-xs text-gray-500 font-mono py-4 text-center">No portal credentials issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase">
                  <th className="pb-2">Share ID</th>
                  <th className="pb-2">Permissions</th>
                  <th className="pb-2">Bootstrap Status</th>
                  <th className="pb-2">Expires</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {credentials.map(c => {
                  const isRevoked = Boolean(c.revokedAt);
                  const isExpired = new Date() > new Date(c.expiresAt);
                  const isUsed = Boolean(c.usedAt);

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 font-semibold text-white">{c.id}</td>
                      <td className="py-2.5 text-[10px] text-gray-400">
                        {c.permissions.map(p => p.split(':')[0]).join(', ')}
                      </td>
                      <td className="py-2.5">
                        {isUsed ? (
                          <span className="text-cyan-400 text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Bootstrapped
                          </span>
                        ) : (
                          <span className="text-amber-400 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Access
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-[10px] text-gray-400">
                        {new Date(c.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5">
                        {isRevoked ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                            REVOKED
                          </span>
                        ) : isExpired ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevokeShare(c.id)}
                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] transition"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Feedback Audit Feed */}
      <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-xs text-gray-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          Client Feedback & Acceptance Stream ({feedbackEvents.length + approvalEvents.length})
        </h3>

        {feedbackEvents.length === 0 && approvalEvents.length === 0 ? (
          <p className="text-xs text-gray-500 font-mono py-4 text-center">
            No feedback or milestone approvals recorded from client yet.
          </p>
        ) : (
          <div className="space-y-3">
            {feedbackEvents.map(e => (
              <div key={e.id} className="p-3 bg-black/30 border border-amber-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    REVISION REQUEST: {e.payload?.areaOfConcern || 'General'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-200 font-mono bg-black/40 p-2.5 rounded border border-gray-800">
                  {e.payload?.feedbackText}
                </p>
                {e.payload?.requestedChanges && (
                  <div className="text-[11px] text-gray-300 font-mono">
                    <span className="text-amber-400 font-bold block mb-0.5">REQUESTED CHANGES:</span>
                    {e.payload.requestedChanges}
                  </div>
                )}
              </div>
            ))}

            {approvalEvents.map(e => (
              <div key={e.id} className="p-3 bg-black/30 border border-emerald-500/30 rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    DELIVERABLE ACCEPTED BY CLIENT
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono">
                  Client milestone approval recorded. Sovereign deployment gate remains governed by Release Captain.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
