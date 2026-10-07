'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  Pause, 
  Play, 
  Sun, 
  ShieldAlert, 
  Search,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderGit2,
  ExternalLink,
  Hammer,
  DollarSign
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  agentId?: string;
  content: string;
  commandVerb?: string;
  missionId?: string;
  taskId?: string;
  opportunityId?: string;
  approvalId?: string;
  executionSteps?: Array<{ step: string; status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' }>;
  thought?: string;
  thoughtDurationSec?: number;
  toolActivities?: Array<{
    id: string;
    type: 'EXPLORE' | 'EDIT' | 'COMMAND' | 'THINKING' | 'TASK';
    label: string;
    target?: string;
    detail?: string;
    diff?: { added: number; removed: number };
    lineRange?: string;
    stdout?: string;
    durationSec?: number;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  }>;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface GideonChatConsoleProps {
  conversationId?: string;
  onConversationChange?: (id: string) => void;
  contextType?: 'GLOBAL' | 'OPPORTUNITY' | 'TASK' | 'WORKSPACE' | 'AGENT';
  contextId?: string;
  initialPrompt?: string;
  onSelectMission?: (mission: any) => void;
}

export function GideonChatConsole({
  conversationId,
  onConversationChange,
  contextType = 'GLOBAL',
  contextId,
  initialPrompt,
  onSelectMission
}: GideonChatConsoleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [currentConvoId, setCurrentConvoId] = useState<string | undefined>(conversationId);
  const loadedConvoIdRef = useRef<string | undefined>(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load existing messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      // If we already have the messages for this conversation loaded in memory, don't wipe or refetch
      if (conversationId === loadedConvoIdRef.current && messages.length > 0) {
        return;
      }
      loadedConvoIdRef.current = conversationId;
      setCurrentConvoId(conversationId);
      fetch(`/api/chat?conversationId=${conversationId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.messages)) {
            setMessages(data.messages);
            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg?.metadata?.commandData?.opportunity || lastMsg?.metadata?.commandData?.mission) {
              onSelectMission?.(lastMsg.metadata.commandData.mission || lastMsg.metadata.commandData.opportunity);
            }
          }
        })
        .catch((err) => console.warn('Failed to load messages:', err));
    } else {
      // New session requested explicitly
      if (loadedConvoIdRef.current !== undefined) {
        loadedConvoIdRef.current = undefined;
        setCurrentConvoId(undefined);
        setMessages([]);
      }
    }
  }, [conversationId]);

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConvoId,
          text,
          senderId: 'hq-web-user',
          contextType,
          contextId
        })
      });

      const data = await res.json();
      if (data.success) {
        if (!currentConvoId && data.session?.id) {
          loadedConvoIdRef.current = data.session.id;
          setCurrentConvoId(data.session.id);
          onConversationChange?.(data.session.id);
        }

        // Replace with real assistant message
        setMessages((prev) => [...prev, data.message]);

        if (onSelectMission && (data.commandResponse?.data?.mission || data.commandResponse?.data?.opportunity)) {
          onSelectMission(data.commandResponse.data.mission || data.commandResponse.data.opportunity);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'system',
            content: `❌ Command Error: ${data.error || 'Failed to process command'}`,
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'system',
          content: `❌ Network Error: ${err.message}`,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAgentBadge = (agentId?: string) => {
    switch (agentId) {
      case 'scout':
        return { label: 'Scout (Market Radar)', emoji: '🔭', color: 'text-accent bg-accent/10 border-accent/20' };
      case 'forge':
        return { label: 'Forge (Engineering)', emoji: '🔨', color: 'text-primary-400 bg-primary-500/10 border-primary-500/20' };
      case 'sentinel':
        return { label: 'Sentinel (QA & Security)', emoji: '🛡️', color: 'text-warning bg-warning/10 border-warning/20' };
      case 'ledger':
        return { label: 'Ledger (CFO)', emoji: '💰', color: 'text-success bg-success/10 border-success/20' };
      case 'release':
        return { label: 'Release Captain', emoji: '🚀', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      default:
        return { label: 'Atlas (Chief of Staff)', emoji: '🧠', color: 'text-primary-300 bg-primary-600/10 border-primary-500/20' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d13] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Cockpit Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d111a] border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              Gideon Command Cockpit
            </span>
          </div>
          <span className="text-[10px] font-mono bg-gray-900 border border-gray-800 text-gray-400 px-2 py-0.5 rounded">
            Governed Operating Surface v5.2
          </span>
        </div>

        {contextId && (
          <div className="text-[11px] font-mono text-accent bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
            Context: {contextType} #{contextId}
          </div>
        )}
      </div>

      {/* Action Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-[#090b0e] border-b border-gray-800/60 overflow-x-auto text-xs">
        <button
          onClick={() => sendMessage('status')}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 text-blue-300 border border-gray-800 transition"
        >
          <Activity className="w-3.5 h-3.5" />
          Status
        </button>

        <button
          onClick={() => sendMessage('briefing')}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 text-amber-300 border border-gray-800 transition"
        >
          <Sun className="w-3.5 h-3.5" />
          Briefing
        </button>

        <button
          onClick={() => sendMessage('investigate BuildVault')}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 text-accent border border-gray-800 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Investigate BuildVault
        </button>

        <button
          onClick={() => sendMessage('pause all')}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 text-yellow-300 border border-gray-800 transition"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause All
        </button>

        <button
          onClick={() => sendMessage('resume all')}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 text-emerald-300 border border-gray-800 transition"
        >
          <Play className="w-3.5 h-3.5" />
          Resume All
        </button>

        <button
          onClick={() => sendMessage('kill-all')}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold border border-red-800/50 transition ml-auto"
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Killswitch
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Gideon Operational Command Surface</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Speak directly with Gideon. Inquire about system health (ASK) or issue operational directives (COMMAND) to orchestrate Forge, Sentinel, Scout, and Ledger.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <span className="text-[11px] font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                • "status"
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                • "briefing"
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                • "investigate &lt;idea&gt;"
              </span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                • "why-not &lt;oppId&gt;"
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const badge = getAgentBadge(msg.agentId);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Role Header */}
                {!isUser && (
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.emoji} {badge.label}
                    </span>
                    {msg.commandVerb && (
                      <span className="text-[9px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                        VERB: {msg.commandVerb}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 shadow-md ${
                    isUser
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : 'bg-[#11151f] border border-gray-800 text-gray-200 rounded-tl-none font-mono'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* Execution Steps Checklist */}
                  {msg.executionSteps && msg.executionSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800/80 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Workforce Execution Pipeline:</span>
                      </div>
                      {msg.executionSteps.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px]">
                          {step.status === 'PASSED' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {step.status === 'RUNNING' && (
                            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          )}
                          {step.status === 'PENDING' && (
                            <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          )}
                          {step.status === 'FAILED' && (
                            <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                          <span
                            className={
                              step.status === 'PASSED'
                                ? 'text-gray-300'
                                : step.status === 'RUNNING'
                                ? 'text-blue-300 font-bold'
                                : 'text-gray-500'
                            }
                          >
                            {step.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 1-Tap Action Cards for Opportunities */}
                  {msg.opportunityId && (
                    <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => sendMessage(`create-mission ${msg.opportunityId}`)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-xs transition shadow-md"
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          🚀 Forge: Build Standalone Microservice
                        </button>
                        <a
                          href="/opportunities"
                          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          Opportunity Radar
                        </a>
                        <a
                          href="/ledger"
                          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs transition"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          View Ledger
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-1 rounded border border-gray-800/80">
                        <FolderGit2 className="w-3 h-3 text-amber-400" />
                        <span>Target Microservice: <span className="text-white">projects/b2b-automation-service/</span> (Isolated Directory)</span>
                      </div>
                    </div>
                  )}

                  {/* 1-Tap Action Buttons for Missions */}
                  {msg.missionId && !msg.approvalId && (() => {
                    const isMissionCompleted =
                      msg.metadata?.commandData?.alreadyCompleted === true ||
                      msg.metadata?.commandData?.mission?.status === 'COMPLETED' ||
                      msg.content.includes('Mission Executed Successfully') ||
                      msg.content.includes('already 100% completed') ||
                      (msg.executionSteps && msg.executionSteps.length > 0 && msg.executionSteps.every((s) => s.status === 'PASSED'));

                    return (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        {isMissionCompleted ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-bold px-2.5 py-1 rounded text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Mission 100% Completed</span>
                              </div>
                              <a
                                href="/tasks"
                                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded text-xs transition"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                                Tasks & Telemetry
                              </a>
                              <a
                                href="/ledger"
                                className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-2.5 py-1 rounded text-xs transition"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                Spend: ${((msg.metadata?.commandData?.mission?.currentSpendCents || 1) / 100).toFixed(2)}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-1 rounded border border-gray-800/80">
                              <FolderGit2 className="w-3 h-3 text-emerald-400" />
                              <span>Deliverable Ready in: <span className="text-white font-bold">projects/b2b-automation-service/</span></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-400">
                              <span className="text-gray-500 font-mono">Next:</span>
                              <button
                                onClick={() => sendMessage('investigate AI voice receptionist')}
                                className="text-emerald-400 hover:underline cursor-pointer bg-gray-900/60 px-2 py-0.5 rounded border border-gray-800"
                              >
                                "investigate AI voice receptionist"
                              </button>
                              <button
                                onClick={() => sendMessage('status')}
                                className="text-blue-400 hover:underline cursor-pointer bg-gray-900/60 px-2 py-0.5 rounded border border-gray-800"
                              >
                                "status"
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => sendMessage(`start ${msg.missionId}`)}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs transition"
                            >
                              <Play className="w-3.5 h-3.5" />
                              Execute Mission
                            </button>
                            <a
                              href="/tasks"
                              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                              Missions Board
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 1-Tap Action Buttons for Approvals */}
                  {msg.approvalId && (
                    <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                      <button
                        onClick={() => sendMessage(`approve ${msg.approvalId}`)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-xs transition"
                      >
                        ✓ Grant Approval
                      </button>
                      <button
                        onClick={() => sendMessage(`reject ${msg.approvalId}`)}
                        className="bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-bold px-3 py-1.5 rounded text-xs transition"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-mono text-gray-500 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            );
          })
        )}

        {/* Live Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-3 bg-[#11151f] border border-gray-800 rounded-xl text-gray-400 max-w-[200px]">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span className="text-xs font-mono">Governed execution...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[#0d111a] border-t border-gray-800">
        <div className="flex items-end gap-2 bg-[#080a0e] border border-gray-800 rounded-lg px-3 py-1.5 focus-within:border-emerald-500 transition">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            placeholder="Issue command or ask Gideon (e.g. 'status', 'investigate BuildVault')... (Shift+Enter for newline)"
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none font-mono py-1.5 resize-none min-h-[36px] max-h-32 overflow-y-auto leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white p-2 rounded-md text-xs font-semibold flex items-center justify-center transition shrink-0 mb-0.5"
            title="Send (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between px-1 mt-1 text-[10px] text-gray-500 font-mono">
          <span>Enter to send • Shift+Enter for new line</span>
          <span>Governed Execution Active</span>
        </div>
      </div>
    </div>
  );
}
