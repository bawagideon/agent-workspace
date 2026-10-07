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
  ShieldAlert, 
  Activity, 
  RefreshCw,
  FolderGit2,
  ExternalLink,
  Hammer,
  BookOpen,
  Cpu,
  Layers,
  ShieldCheck,
  ChevronDown,
  Info,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  Code2
} from 'lucide-react';
import { ChatMessage } from './GideonChatConsole';

export interface GideonContextChatProps {
  page?: string;
  projectId?: string;
  missionId?: string;
  agentId?: string;
  conversationId?: string;
  contextType?: 'GLOBAL' | 'OPPORTUNITY' | 'TASK' | 'WORKSPACE' | 'AGENT' | 'PROJECT';
  contextId?: string;
  onConversationChange?: (id: string) => void;
  onSidecarAction?: (tab: string, payload?: any) => void;
  placeholder?: string;
  autoDispatch?: boolean;
}

interface ChatAttachment {
  name: string;
  dataUrl: string;
  type: 'image' | 'file';
  size?: string;
}

export function GideonContextChat({
  page = 'workspace',
  projectId,
  missionId,
  agentId,
  conversationId,
  contextType,
  contextId,
  onConversationChange,
  onSidecarAction,
  placeholder = "Message Gideon, Atlas, Forge, or Sentinel... (Press Shift+Enter for new line)",
  autoDispatch = true
}: GideonContextChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConvoId, setCurrentConvoId] = useState<string | undefined>(conversationId);
  const [contextEnvelope, setContextEnvelope] = useState<any>(null);
  const [showContextBadge, setShowContextBadge] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const toggleThought = (id: string) => {
    setExpandedThoughts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTool = (id: string) => {
    setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine effective context type
  const effectiveContextType = contextType || (projectId?.startsWith('opp-') ? 'OPPORTUNITY' : (projectId ? 'WORKSPACE' : (agentId ? 'AGENT' : 'GLOBAL')));
  const effectiveContextId = contextId || projectId || agentId || page;

  // Load context envelope on mount or scope change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (projectId) params.set('projectId', projectId);
    if (missionId) params.set('missionId', missionId);
    if (agentId) params.set('agentId', agentId);

    fetch(`/api/context/resolve?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.envelope) {
          setContextEnvelope(data.envelope);
        }
      })
      .catch(err => console.warn('[GideonContextChat] Failed to resolve context:', err));
  }, [page, projectId, missionId, agentId]);

  // Load existing conversation messages
  useEffect(() => {
    if (conversationId) {
      setCurrentConvoId(conversationId);
      fetch(`/api/chat?conversationId=${conversationId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.messages)) {
            setMessages(data.messages);
          }
        })
        .catch(err => console.warn('[GideonContextChat] Failed to load messages:', err));
    } else {
      setMessages([]);
      setCurrentConvoId(undefined);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Clipboard Image Paste (Screenshots)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachment({
              name: `screenshot-${Date.now().toString().slice(-4)}.png`,
              dataUrl: event.target?.result as string,
              type: 'image',
              size: `${(file.size / 1024).toFixed(1)} KB`
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && !attachment) || loading) return;

    const currentAttachment = attachment;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text || (currentAttachment ? `[Attached: ${currentAttachment.name}]` : ''),
      createdAt: new Date().toISOString(),
      metadata: currentAttachment ? { attachment: currentAttachment } : undefined
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setAttachment(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: text,
          message: text,
          conversationId: currentConvoId,
          contextType: effectiveContextType,
          contextId: effectiveContextId,
          projectId,
          attachment: currentAttachment ? {
            name: currentAttachment.name,
            type: currentAttachment.type,
            dataUrl: currentAttachment.dataUrl
          } : undefined,
          autoDispatch
        })
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.success && data.message) {
        if (!currentConvoId && data.message.conversationId) {
          setCurrentConvoId(data.message.conversationId);
          onConversationChange?.(data.message.conversationId);
        }
        setMessages(prev => [...prev, data.message]);

        // Auto-signal sidecar if files or tests or diff were touched
        if (data.message.metadata?.filesTouched) {
          onSidecarAction?.('files', data.message.metadata.filesTouched);
        }
        if (data.message.metadata?.testRuns) {
          onSidecarAction?.('tests', data.message.metadata.testRuns);
        }
        if (data.message.metadata?.evidenceId) {
          onSidecarAction?.('evidence', data.message.metadata.evidenceId);
        }
      } else {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'system',
          content: data.error || 'Failed to process command. Please verify runner status.',
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      const netErrorMsg: ChatMessage = {
        id: `net-err-${Date.now()}`,
        role: 'system',
        content: isTimeout 
          ? '⏱️ Request timed out after 12s. Please retry or click one of the quick inquiry chips below.'
          : `Network or dispatch error: ${err.message}`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, netErrorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const isLogOrError = (text: string) => {
    return (
      text.includes('Error:') || 
      text.includes('MODULE_NOT_FOUND') || 
      text.includes('node:internal') || 
      text.includes('at Module.') || 
      text.includes('[HTTP/1.1') ||
      text.includes('Fast Refresh') ||
      text.includes('XHR GET') ||
      text.includes('XHR POST')
    );
  };

  const getAgentBadge = (agent?: string) => {
    switch ((agent || '').toLowerCase()) {
      case 'forge':
        return { label: 'FORGE', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', role: 'Architect & Builder' };
      case 'atlas':
        return { label: 'ATLAS', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', role: 'Strategic Planner' };
      case 'sentinel':
        return { label: 'SENTINEL', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', role: 'Independent Observer' };
      case 'scout':
        return { label: 'SCOUT', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', role: 'Opportunity Researcher' };
      default:
        return { label: 'GIDEON', bg: 'bg-red-500/20 text-red-300 border-red-500/40', role: 'Autonomous Engineering OS' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Top Context & Agent Bar */}
      <div className="px-4 py-3 bg-[#090d16] border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 relative" />
          </div>
          <div>
            <div className="text-xs font-black tracking-wider text-white flex items-center gap-2">
              <span>GIDEON CONVERSATIONAL WORKBENCH</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Scope: {page.toUpperCase()}</span>
              {projectId && <span>• Project: {projectId}</span>}
              {agentId && <span>• Agent: {agentId}</span>}
            </div>
          </div>
        </div>

        {/* Dynamic Context Envelope Pill */}
        {contextEnvelope && (
          <div className="relative">
            <button
              onClick={() => setShowContextBadge(!showContextBadge)}
              className="flex items-center gap-1.5 bg-black/60 hover:bg-black/90 border border-white/10 hover:border-red-500/50 px-2.5 py-1 rounded-lg text-[11px] text-gray-300 font-mono transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span>Context: {contextEnvelope.facts?.length || 0} Facts</span>
              <span className="text-gray-500">•</span>
              <span>{contextEnvelope.verifiedLessons?.length || 0} Lessons</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showContextBadge ? 'rotate-180' : ''}`} />
            </button>

            {/* Context Dropdown Inspector */}
            {showContextBadge && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0d121f] border border-white/15 rounded-xl p-3 shadow-2xl z-30 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-red-400" />
                    Active Context Envelope
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Fact != Opinion</span>
                </div>

                {/* Facts */}
                <div>
                  <div className="text-[10px] font-mono uppercase text-gray-400 font-bold mb-1">
                    Verified Facts ({contextEnvelope.facts?.length || 0})
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {contextEnvelope.facts?.map((f: any) => (
                      <div key={f.id} className="p-1.5 rounded bg-black/40 border border-white/5 text-[11px] text-gray-300">
                        {f.statement}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lessons */}
                <div>
                  <div className="text-[10px] font-mono uppercase text-amber-400 font-bold mb-1">
                    Verified Lessons ({contextEnvelope.verifiedLessons?.length || 0})
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {contextEnvelope.verifiedLessons?.map((l: any) => (
                      <div key={l.ruleId} className="p-1.5 rounded bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200/90 font-mono">
                        {l.ruleId}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>Reusable Capabilities: {contextEnvelope.capabilities?.length || 0}</span>
                  <button 
                    onClick={() => { setShowContextBadge(false); onSidecarAction?.('context'); }}
                    className="text-red-400 hover:underline font-bold"
                  >
                    View All ↗
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-black p-0.5 shadow-glow-primary">
              <div className="w-full h-full bg-[#090d16] rounded-2xl flex items-center justify-center">
                <Terminal className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-white">
                {effectiveContextType === 'OPPORTUNITY' ? 'Opportunity Intelligence & Build Workbench' : 'Gideon AI Engineering Workspace'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {effectiveContextType === 'OPPORTUNITY' 
                  ? 'Ask Forge about component architecture, query Ledger on $2,400 pricing and confidence, or dispatch the build.' 
                  : 'Direct natural-language operating surface. Paste logs, screenshots (Ctrl+V), or ask Forge to resolve build failures.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2 text-left">
              {(effectiveContextType === 'OPPORTUNITY' ? [
                { prompt: 'Who is the decision maker and what is the contact info for this lead and how do we reach them?', label: '📞 Decision Maker & How to Reach' },
                { prompt: 'What does Forge have to build for this lead?', label: '🔨 What does Forge build?' },
                { prompt: 'Is what we are attempting to build any good for that price quote and is that what the confidence is addressing and what does it have to build can i get a way to speak with forge about what that is addressing or do i get a better dossier about that', label: '💰 Price, Confidence & Forge Audit' },
                { prompt: 'start build', label: '⚡ Dispatch Forge to Build' },
              ] : [
                { prompt: 'Resolve B2B automation and Stripe preview build issues', label: '🛠️ Fix Lab Process Issues' },
                { prompt: 'Run showcase loop test suite', label: '⚡ Run Sentinel QA Suite' },
                { prompt: 'Generate 3D isometric slide pack', label: '🎨 Render 3D Story Pack' },
                { prompt: 'Check Gate 1, 2, and 3 readiness', label: '🛡️ Audit Release Gates' },
              ]).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-red-500/50 hover:bg-red-950/20 text-xs text-gray-300 transition-all font-mono"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const agentBadge = !isUser ? getAgentBadge(msg.agentId) : null;
            const hasErrorFormat = isLogOrError(msg.content);
            const userAttachment = msg.metadata?.attachment;

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {!isUser && agentBadge && (
                  <div className="flex items-center gap-2 px-1">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${agentBadge.bg}`}>
                      {agentBadge.label}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{agentBadge.role}</span>
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-sm shadow-glow-primary'
                      : 'bg-[#0f1422] border border-white/10 text-gray-200 rounded-tl-sm shadow-xl'
                  }`}
                >
                  {/* Attached Image / File Preview */}
                  {userAttachment && (
                    <div className="mb-3 p-2 rounded-xl bg-black/50 border border-white/10">
                      {userAttachment.type === 'image' ? (
                        <div className="space-y-1">
                          <img
                            src={userAttachment.dataUrl}
                            alt={userAttachment.name}
                            onClick={() => setSelectedPreviewImage(userAttachment.dataUrl)}
                            className="max-h-56 max-w-full rounded-lg border border-white/20 object-contain cursor-pointer hover:opacity-90 transition"
                          />
                          <div className="text-[10px] font-mono text-gray-300 flex items-center justify-between">
                            <span>📷 {userAttachment.name}</span>
                            <span>{userAttachment.size}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-200">
                          <FileText className="w-4 h-4 text-red-400" />
                          <span>{userAttachment.name} ({userAttachment.size})</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Message Content */}
                  {!isUser && msg.thought && (
                    <div className="mb-2.5 pb-2 border-b border-white/10">
                      <button
                        type="button"
                        onClick={() => toggleThought(msg.id)}
                        className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 hover:text-gray-200 transition py-0.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-red-400" />
                        <span>Thought for {msg.thoughtDurationSec || 4}s</span>
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedThoughts[msg.id] ? 'rotate-180' : ''}`} />
                      </button>
                      {expandedThoughts[msg.id] && (
                        <div className="mt-2 p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-gray-400 whitespace-pre-wrap leading-relaxed border-l-2 border-l-red-500/70 select-text">
                          {msg.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {!isUser && msg.toolActivities && msg.toolActivities.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {msg.toolActivities.map((tool) => {
                        const isToolExpanded = expandedTools[tool.id];
                        return (
                          <div key={tool.id} className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => toggleTool(tool.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/80 border border-white/10 hover:border-white/20 text-[11px] font-mono transition text-gray-300 shadow-sm"
                            >
                              {tool.type === 'EXPLORE' && <FolderGit2 className="w-3.5 h-3.5 text-blue-400" />}
                              {tool.type === 'EDIT' && <Code2 className="w-3.5 h-3.5 text-purple-400" />}
                              {tool.type === 'COMMAND' && <Terminal className="w-3.5 h-3.5 text-emerald-400" />}
                              {tool.type === 'TASK' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{tool.label}</span>
                              {tool.diff && (
                                <span className="flex items-center gap-1 font-mono text-[10px] ml-1">
                                  <span className="text-emerald-400">+{tool.diff.added}</span>
                                  <span className="text-red-400">-{tool.diff.removed}</span>
                                </span>
                              )}
                              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isToolExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isToolExpanded && (
                              <div className="mt-1 p-2.5 rounded-lg bg-black/90 border border-white/10 text-[10px] font-mono text-gray-300 max-w-md shadow-xl overflow-x-auto z-10">
                                {tool.target && <div className="text-cyan-400 font-bold mb-1">Target: {tool.target}</div>}
                                {tool.detail && <div className="text-gray-400 mb-1 whitespace-pre-wrap">{tool.detail}</div>}
                                {tool.stdout && (
                                  <pre className="p-2 bg-[#050811] rounded border border-white/5 text-gray-300 text-[10px] whitespace-pre-wrap">
                                    {tool.stdout}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {hasErrorFormat && isUser ? (
                    <div className="space-y-2">
                      <div className="text-white font-sans">{msg.content.split('[10:')[0] || msg.content.split('node:internal')[0] || 'Console Log / Trace:'}</div>
                      <pre className="font-mono text-[11px] bg-black/80 p-3 rounded-xl border border-white/15 text-red-200 overflow-x-auto whitespace-pre-wrap select-text leading-tight">
                        {msg.content}
                      </pre>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                  )}

                  {/* Execution Steps if returned */}
                  {msg.executionSteps && msg.executionSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                      <div className="text-[10px] font-mono uppercase text-gray-400 font-bold">
                        Execution Pipeline
                      </div>
                      {msg.executionSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-[11px] font-mono">
                          {step.status === 'PASSED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {step.status === 'RUNNING' && <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                          {step.status === 'FAILED' && <AlertOctagon className="w-3.5 h-3.5 text-red-400" />}
                          {step.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-gray-500" />}
                          <span className={step.status === 'FAILED' ? 'text-red-300' : 'text-gray-300'}>
                            {step.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata Quick Actions */}
                  {msg.metadata && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-2 text-[11px] font-mono">
                      {msg.metadata.filesTouched && (
                        <button
                          onClick={() => onSidecarAction?.('files', msg.metadata?.filesTouched)}
                          className="px-2 py-0.5 rounded bg-black/50 border border-white/10 hover:border-cyan-400/50 text-cyan-300 flex items-center gap-1"
                        >
                          <FolderGit2 className="w-3 h-3" />
                          View Touched Files ({msg.metadata.filesTouched.length})
                        </button>
                      )}
                      {msg.metadata.testRuns && (
                        <button
                          onClick={() => onSidecarAction?.('tests', msg.metadata?.testRuns)}
                          className="px-2 py-0.5 rounded bg-black/50 border border-white/10 hover:border-emerald-400/50 text-emerald-300 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Inspect Test Results
                        </button>
                      )}
                      {msg.metadata.evidenceId && (
                        <button
                          onClick={() => onSidecarAction?.('evidence', msg.metadata?.evidenceId)}
                          className="px-2 py-0.5 rounded bg-black/50 border border-white/10 hover:border-amber-400/50 text-amber-300 flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          View Sealed Evidence
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#090d18] border border-white/10 text-xs text-gray-300 font-mono shadow-md w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-bold text-white">1 task running</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400">Thinking and exploring workspace...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 md:p-4 bg-[#090d16] border-t border-white/[0.07] space-y-2">
        {/* Attachment Preview Box */}
        {attachment && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-black/80 border border-red-500/40 w-fit">
            {attachment.type === 'image' ? (
              <img src={attachment.dataUrl} alt="Thumbnail" className="w-10 h-10 object-cover rounded-lg border border-white/20" />
            ) : (
              <FileText className="w-6 h-6 text-red-400" />
            )}
            <div className="text-xs font-mono text-gray-200">
              <div className="font-bold truncate max-w-xs">{attachment.name}</div>
              <div className="text-[10px] text-gray-500">{attachment.size} • Ready to send</div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 text-gray-400 hover:text-red-400 transition"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {effectiveContextType === 'OPPORTUNITY' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-[10px] font-mono">
            <button
              type="button"
              onClick={() => handleSendMessage('What does Forge have to build for this lead?')}
              className="px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap transition"
            >
              🔨 What to build?
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Is what we are attempting to build any good for that price quote and is that what the confidence is addressing?')}
              className="px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap transition"
            >
              💰 Price & Confidence ($2,400)
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Who is the decision maker and what is the contact info for this lead and how do we reach them?')}
              className="px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap transition"
            >
              📞 Contact & Comms
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Explain the verified evidence and pain points discovered by Scout')}
              className="px-2 py-0.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap transition"
            >
              🔍 Scout Evidence
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('start build')}
              className="px-2 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap transition font-bold"
            >
              ⚡ Dispatch Build
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('next lead')}
              className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 whitespace-nowrap transition"
            >
              ➡️ Next Lead
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-black/60 border border-white/10 focus-within:border-red-500/60 rounded-xl p-2 transition-all shadow-inner">
          {/* File & Screenshot Attachment Button */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.log,.txt,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const isImg = file.type.startsWith('image/');
                const reader = new FileReader();
                reader.onload = (event) => {
                  setAttachment({
                    name: file.name,
                    dataUrl: event.target?.result as string,
                    type: isImg ? 'image' : 'file',
                    size: `${(file.size / 1024).toFixed(1)} KB`
                  });
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-red-400 transition rounded-lg hover:bg-white/5"
            title="Attach screenshot or log file (or paste directly with Ctrl+V)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Multiline Textarea supporting Shift+Enter for newline, Enter to send */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            onPaste={handlePaste}
            rows={1}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 px-2 py-2 focus:outline-none resize-none min-h-[40px] max-h-36 overflow-y-auto font-sans leading-relaxed"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!input.trim() && !attachment) || loading}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white p-2.5 rounded-lg transition-all shadow-glow-primary shrink-0"
            title="Send (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-gray-500 font-mono">
          <span>Enter to send • Shift+Enter for new line • Ctrl+V to paste screenshot</span>
          <span>⚡ Auto-dispatch enabled for low/medium risk actions</span>
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
        >
          <img
            src={selectedPreviewImage}
            alt="Expanded Screenshot"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl border border-white/20 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
