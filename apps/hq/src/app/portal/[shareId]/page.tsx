'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RotateCw, 
  Smartphone, 
  Tablet, 
  Monitor, 
  MessageSquare, 
  ThumbsUp, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Lock
} from 'lucide-react';

interface PublicProject {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  businessObjective: string;
  problemSolved?: string;
  targetCustomer?: string;
  currentVersion: string;
  pricingCents: number;
  currency: 'USD' | 'NGN';
  cashReceivedCents: number;
  settledSpendCents: number;
  previewAvailable: boolean;
}

export default function ClientPortalPage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<PublicProject | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  // Feedback Modal State
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackArea, setFeedbackArea] = useState('General UI/UX');
  const [feedbackText, setFeedbackText] = useState('');
  const [requestedChanges, setRequestedChanges] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Approval Modal State
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);

        // 1. Check for ephemeral access secret in URL hash or query params
        let accessSecret = '';
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash.includes('access=')) {
            const match = hash.match(/access=([^&]+)/);
            if (match) accessSecret = match[1];
          }
          if (!accessSecret) {
            const search = new URLSearchParams(window.location.search);
            accessSecret = search.get('access') || '';
          }
        }

        // If secret present, bootstrap session
        if (accessSecret) {
          const res = await fetch('/api/portal/session/bootstrap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shareId, accessSecret })
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Session authorization failed.');
          }

          const data = await res.json();
          setCsrfToken(data.csrfToken);
          setPermissions(data.permissions || []);

          // Wipe secret from browser address bar
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', `/portal/${shareId}`);
          }
        }

        // 2. Fetch authenticated project projection
        const meRes = await fetch('/api/portal/session/me');
        if (!meRes.ok) {
          const errData = await meRes.json();
          throw new Error(errData.message || 'Failed to load project details.');
        }

        const meData = await meRes.json();
        setProject(meData.project);
        if (meData.csrfToken) setCsrfToken(meData.csrfToken);
        if (meData.permissions) setPermissions(meData.permissions);
      } catch (err: any) {
        setError(err.message || 'Unable to access client portal.');
      } finally {
        setLoading(false);
      }
    }

    if (shareId) {
      bootstrap();
    }
  }, [shareId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      setError(null);

      const idempotencyKey = `idemp_fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const res = await fetch('/api/portal/session/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
          'idempotency-key': idempotencyKey
        },
        body: JSON.stringify({
          areaOfConcern: feedbackArea,
          feedbackText,
          requestedChanges
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit feedback.');
      }

      setFeedbackSuccess('Revision request successfully recorded. The autonomous workforce will review it.');
      if (project) {
        setProject({ ...project, status: data.status || 'REWORK_REQUESTED' });
      }
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackSuccess(null);
        setFeedbackText('');
        setRequestedChanges('');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleMilestoneApproval = async () => {
    try {
      setSubmittingApproval(true);
      setError(null);

      const res = await fetch('/api/portal/session/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Milestone approval failed.');
      }

      setApprovalSuccess(data.message || 'Milestone successfully accepted.');
      if (project) {
        setProject({ ...project, status: data.status || 'CLIENT_ACCEPTED' });
      }
      setTimeout(() => {
        setApprovalOpen(false);
        setApprovalSuccess(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Milestone approval failed.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RotateCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
          <p className="text-slate-400 font-mono text-sm tracking-wide">VERIFYING PORTAL SESSION AUTHORIZATION...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-xl p-8 shadow-2xl backdrop-blur-md text-center space-y-5">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Portal Access Restricted</h1>
            <p className="text-sm text-slate-400 mt-2 font-mono">{error || 'Session credential invalid or expired.'}</p>
          </div>
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
            GIDEON SOVEREIGN EXPOSURE GATEWAY • STRICT FAIL-CLOSED AUTHENTICATION
          </div>
        </div>
      </div>
    );
  }

  const getViewportWidth = () => {
    if (viewport === 'mobile') return 'max-w-[375px]';
    if (viewport === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  const isReviewable = project.status === 'CLIENT_REVIEW';
  const isAccepted = project.status === 'CLIENT_ACCEPTED';
  const isRework = project.status === 'REWORK_REQUESTED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Sovereign Exposure Bar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-100">{project.name}</h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {project.currentVersion}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  isAccepted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  isRework ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {project.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">{project.businessObjective}</p>
            </div>
          </div>

          {/* Action Strip */}
          <div className="flex items-center gap-3">
            {permissions.includes('feedback:write') && isReviewable && (
              <button
                onClick={() => setFeedbackOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                Request Changes
              </button>
            )}

            {permissions.includes('milestone:accept') && isReviewable && (
              <button
                onClick={() => setApprovalOpen(true)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Approve Deliverable
              </button>
            )}

            {isAccepted && (
              <div className="px-3 py-1.5 rounded-lg text-xs font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Deliverable Accepted
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Verification Strip & Badges */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono">QA Verification</div>
              <div className="text-sm font-semibold text-slate-200">Sentinel Certified</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <Lock className="w-8 h-8 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono">Security Isolation</div>
              <div className="text-sm font-semibold text-slate-200">Zero Secret Leakage</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono">Environment</div>
              <div className="text-sm font-semibold text-slate-200">Staging Sandbox</div>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-400 uppercase font-mono">Commercial Settlement</div>
              <div className="text-sm font-semibold text-slate-200">
                {project.cashReceivedCents >= project.pricingCents ? 'Fully Settled' : 'Deposit Funded'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Staging Preview Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col flex-1 min-h-[600px]">
          {/* Preview Navigation & Viewport Bar */}
          <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${project.previewAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-mono text-slate-300">
                {project.previewAvailable ? 'LIVE STAGING RUNNER' : 'STAGING PREVIEW OFFLINE'}
              </span>
            </div>

            {/* Viewport Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                title="Desktop View"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1.5 rounded ${viewport === 'tablet' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Reload Preview"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sandboxed Preview Frame Container */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-auto">
            <div className={`h-full transition-all duration-300 shadow-xl border border-slate-800/80 rounded-lg overflow-hidden bg-white ${getViewportWidth()}`}>
              {project.previewAvailable ? (
                <iframe
                  key={iframeKey}
                  src="/api/portal/preview/"
                  title="Staging Application Preview"
                  className="w-full h-full min-h-[580px] border-none"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                />
              ) : (
                <div className="w-full h-full min-h-[580px] flex items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p>The staging runner process is currently stopped.</p>
                    <p className="text-slate-600">The operator can start the runner from the Gideon HQ Cockpit.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Revision Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                Submit Revision Feedback
              </h2>
              <button onClick={() => setFeedbackOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">
                &times;
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{feedbackSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">AREA OF CONCERN</label>
                  <select
                    value={feedbackArea}
                    onChange={e => setFeedbackArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="General UI/UX">General UI/UX</option>
                    <option value="Business Logic">Business Logic</option>
                    <option value="Copy & Content">Copy & Content</option>
                    <option value="Mobile Responsiveness">Mobile Responsiveness</option>
                    <option value="Performance">Performance</option>
                    <option value="Bug / Error">Bug / Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    FEEDBACK / OBSERVATION ({feedbackText.length}/5000)
                  </label>
                  <textarea
                    required
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    rows={4}
                    placeholder="Describe what you observed and what should be improved..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    REQUESTED SPECIFIC CHANGES ({requestedChanges.length}/5000)
                  </label>
                  <textarea
                    value={requestedChanges}
                    onChange={e => setRequestedChanges(e.target.value)}
                    rows={3}
                    placeholder="Provide specific change instructions or acceptance criteria..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Recording...' : 'Submit Revision'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Milestone Approval Modal */}
      {approvalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-emerald-400" />
                Approve Milestone Deliverable
              </h2>
              <button onClick={() => setApprovalOpen(false)} className="text-slate-400 hover:text-slate-200 text-lg">
                &times;
              </button>
            </div>

            {approvalSuccess ? (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{approvalSuccess}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  By approving this deliverable, you confirm that the staging application fulfills the agreed milestone specifications.
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1 text-slate-400">
                  <div>PROJECT: {project.name}</div>
                  <div>VERSION: {project.currentVersion}</div>
                  <div>STATUS TRANSITION: CLIENT_REVIEW ➔ CLIENT_ACCEPTED</div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setApprovalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleMilestoneApproval}
                    disabled={submittingApproval}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
                  >
                    {submittingApproval ? 'Processing...' : 'Confirm Acceptance'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
