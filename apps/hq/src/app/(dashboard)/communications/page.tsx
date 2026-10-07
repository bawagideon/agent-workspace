'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Clock,
  DollarSign,
  FileText,
  User,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';

interface Contact {
  id: string;
  displayName: string;
  primaryContact: string;
  organization?: string;
  channels: Array<{ type: string; address: string; isVerified: boolean }>;
}

interface Conversation {
  id: string;
  opportunityId?: string;
  projectId?: string;
  contactId: string;
  channel: string;
  subject: string;
  stage: string;
  status: string;
  messageCount: number;
  unreadCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  senderStatus: 'VERIFIED' | 'UNVERIFIED';
  senderAddress: string;
  sanitizedContent: string;
  metadata?: any;
  createdAt: string;
}

interface Draft {
  id: string;
  conversationId: string;
  proposedSubject: string;
  proposedBody: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'DISPATCH_UNCERTAIN';
  approvedContentHash?: string;
  metadata?: {
    classification?: { category: string; confidence: number; rationale: string };
    confidence?: { confidence: string; score: number; rationale: string };
    pricingRecommendation?: {
      originalPricingCents: number;
      deltaPriceCents: number;
      recommendedNewPriceCents: number;
      estimatedComputeCostCents: number;
      depositRequirementCents: number;
      marginPercent: number;
      pricingNotes: string;
    };
  };
}

export default function CommunicationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversation' | 'timeline'>('conversation');
  const [draftReply, setDraftReply] = useState('');
  const [approving, setApproving] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      loadConversationDetails(selectedConvId);
      loadTimeline(selectedConvId);
    }
  }, [selectedConvId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/communications');
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        const contactMap: Record<string, Contact> = {};
        (data.contacts || []).forEach((c: Contact) => {
          contactMap[c.id] = c;
        });
        setContacts(contactMap);
        if (data.conversations && data.conversations.length > 0 && !selectedConvId) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/communications/${id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setActiveDraft(data.activeDraft || null);
        if (data.activeDraft) {
          setDraftReply(data.activeDraft.proposedBody || '');
        } else {
          setDraftReply('');
        }
      }
    } catch (err) {
      console.error('Failed to load details:', err);
    }
  };

  const loadTimeline = async (id: string) => {
    try {
      const res = await fetch(`/api/communications/${id}/timeline`);
      const data = await res.json();
      if (data.success) {
        setTimeline(data.timeline || []);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const handleApproveDraft = async () => {
    if (!selectedConvId || !activeDraft) return;
    setApproving(true);
    setDispatchResult(null);
    try {
      const res = await fetch(`/api/communications/${selectedConvId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftId: activeDraft.id,
          operatorId: 'operator_human_command',
          notes: 'Approved via Gideon AI HQ Cockpit'
        })
      });
      const data = await res.json();
      if (data.success) {
        setDispatchResult(data.dispatchResult);
        loadConversationDetails(selectedConvId);
        loadTimeline(selectedConvId);
      } else {
        alert(`Dispatch failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const selectedContact = selectedConv ? contacts[selectedConv.contactId] : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#0b0d13] text-gray-100 font-sans">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-[#1f2430] bg-[#10141d] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              Communications Control Plane
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Phase 6.5
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Atlas Relationship Nervous System • Inbound Quarantine • Authoritative Pricing • Cryptographic Dispatch Gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (selectedConvId) { loadConversationDetails(selectedConvId); loadTimeline(selectedConvId); } }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a202c] border border-gray-700 hover:border-gray-500 text-xs font-medium text-gray-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main 3-Pane Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Conversations & Threads List */}
        <div className="w-80 border-r border-[#1f2430] bg-[#0e111a] flex flex-col">
          <div className="p-3 border-b border-[#1f2430] bg-[#131722]">
            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Client Threads</span>
              <span className="text-indigo-400 font-mono text-[10px]">{conversations.length} Active</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1a1f2c]">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <Inbox className="w-6 h-6 text-gray-600" />
                <span>No active communication threads</span>
              </div>
            ) : (
              conversations.map(conv => {
                const contact = contacts[conv.contactId];
                const isSelected = conv.id === selectedConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                        : 'hover:bg-[#151a26]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-200 truncate">
                        {contact?.displayName || contact?.primaryContact || 'Unknown Contact'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                        {conv.stage}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{conv.subject}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                      <span className="font-mono">{conv.channel}</span>
                      <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Pane: Active Thread & Draft Composer */}
        <div className="flex-1 flex flex-col bg-[#0b0d13]">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-[#1f2430] bg-[#121622] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                    {selectedContact?.displayName?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white">
                        {selectedContact?.displayName || 'Client'}
                      </h2>
                      <span className="text-xs text-gray-400 font-mono">
                        ({selectedContact?.primaryContact})
                      </span>
                      {selectedContact?.channels?.[0]?.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <ShieldAlert className="w-3 h-3" /> UNVERIFIED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span>Subject: <strong className="text-gray-300">{selectedConv.subject}</strong></span>
                      {selectedConv.projectId && (
                        <span className="font-mono text-indigo-400">• Project: {selectedConv.projectId}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center rounded bg-[#1b202e] p-1 border border-gray-700">
                  <button
                    onClick={() => setActiveTab('conversation')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                      activeTab === 'conversation' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Conversation
                  </button>
                  <button
                    onClick={() => setActiveTab('timeline')}
                    className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                      activeTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Deal Timeline
                  </button>
                </div>
              </div>

              {activeTab === 'conversation' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-xs text-gray-500 py-12">
                        No messages in this thread yet.
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-2xl ${
                            msg.direction === 'OUTBOUND' ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 text-[10px] text-gray-400">
                            <span className="font-mono">{msg.senderAddress}</span>
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                            {msg.senderStatus === 'UNVERIFIED' && (
                              <span className="text-amber-400 bg-amber-500/10 px-1 rounded">UNVERIFIED SENDER</span>
                            )}
                          </div>
                          <div
                            className={`p-3.5 rounded-lg text-xs leading-relaxed ${
                              msg.direction === 'OUTBOUND'
                                ? 'bg-indigo-900/40 border border-indigo-700/50 text-indigo-100'
                                : 'bg-[#161a25] border border-gray-700/60 text-gray-200'
                            }`}
                          >
                            {msg.direction === 'INBOUND' && (
                              <div className="text-[10px] font-mono text-amber-400/80 mb-1 border-b border-amber-500/20 pb-1">
                                &lt;&lt;&lt;UNTRUSTED_CLIENT_MESSAGE&gt;&gt;&gt;
                              </div>
                            )}
                            <div className="whitespace-pre-wrap">{msg.sanitizedContent}</div>
                            {msg.direction === 'OUTBOUND' && msg.metadata?.envelope && (
                              <div className="mt-2 pt-2 border-t border-indigo-500/30 text-[9px] font-mono text-indigo-300 flex items-center justify-between">
                                <span>SEAL: {msg.metadata.envelope.envelopeSignature?.substring(0, 16)}...</span>
                                <span>SIGNED BY OPERATOR</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Active Draft & Atlas Recommendations */}
                  {activeDraft && (
                    <div className="border-t border-[#1f2430] bg-[#101420] p-4 flex flex-col gap-3">
                      {/* Atlas Classification & Acceptance Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Atlas Proposed Draft:
                        </span>

                        {activeDraft.metadata?.classification && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Intent: {activeDraft.metadata.classification.category} ({Math.round(activeDraft.metadata.classification.confidence * 100)}%)
                          </span>
                        )}

                        {activeDraft.metadata?.confidence && (
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${
                            activeDraft.metadata.confidence.confidence === 'EXPLICIT'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : activeDraft.metadata.confidence.confidence === 'AMBIGUOUS'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            Acceptance: {activeDraft.metadata.confidence.confidence}
                          </span>
                        )}
                      </div>

                      {/* Commercial Pricing Recommendation Card */}
                      {activeDraft.metadata?.pricingRecommendation && (
                        <div className="p-2.5 rounded bg-indigo-950/50 border border-indigo-800/60 text-xs">
                          <div className="font-semibold text-indigo-300 flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" /> Deterministic Change Order Pricing
                            </span>
                            <span className="font-mono text-emerald-400">
                              +\${(activeDraft.metadata.pricingRecommendation.deltaPriceCents / 100).toFixed(2)} USD
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-300 font-mono">
                            <div>New Price: \${(activeDraft.metadata.pricingRecommendation.recommendedNewPriceCents / 100).toFixed(2)}</div>
                            <div>Compute Cost: \${(activeDraft.metadata.pricingRecommendation.estimatedComputeCostCents / 100).toFixed(2)}</div>
                            <div>Required Deposit: \${(activeDraft.metadata.pricingRecommendation.depositRequirementCents / 100).toFixed(2)}</div>
                          </div>
                        </div>
                      )}

                      {/* Draft Text Preview & Editor */}
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[10px] font-mono text-gray-400">
                          Subject: {activeDraft.proposedSubject}
                        </div>
                        <textarea
                          value={draftReply}
                          onChange={(e) => setDraftReply(e.target.value)}
                          rows={3}
                          className="w-full bg-[#161a25] border border-gray-700 rounded p-2.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Cryptographic Gate Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Requires cryptographic operator signature. Draft is immutable once signed.</span>
                        </div>

                        <button
                          onClick={handleApproveDraft}
                          disabled={approving || activeDraft.status === 'APPROVED'}
                          className="flex items-center gap-2 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {approving ? 'Signing & Dispatching...' : 'Authorize & Dispatch Outbound'}
                        </button>
                      </div>

                      {dispatchResult && (
                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Dispatched successfully to {dispatchResult.channel} (ID: {dispatchResult.externalDeliveryId})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Right / Timeline Tab */
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-4">
                    Unified Chronological Deal Timeline
                  </h3>
                  {timeline.length === 0 ? (
                    <div className="text-xs text-gray-500">No events recorded for this deal.</div>
                  ) : (
                    <div className="relative pl-6 border-l border-gray-800 space-y-6">
                      {timeline.map((evt, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-[#0b0d13]" />
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-white">{evt.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                              {evt.type}
                            </span>
                            <span className="text-[10px] text-gray-500 ml-auto font-mono">
                              {new Date(evt.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{evt.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs">
              <Mail className="w-8 h-8 text-gray-600 mb-2" />
              <span>Select a conversation from the left to view communications</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
