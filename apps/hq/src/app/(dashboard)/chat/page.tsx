'use client';

import React, { useState, useEffect } from 'react';
import { GideonChatConsole } from '@/components/chat/GideonChatConsole';
import { MissionContextPanel } from '@/components/chat/MissionContextPanel';
import { Plus, MessageSquare, Clock, Terminal, ChevronRight } from 'lucide-react';

interface SessionItem {
  id: string;
  title: string;
  status: string;
  contextType: string;
  contextId?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>();
  const [selectedMission, setSelectedMission] = useState<any>(null);

  const fetchSessions = (autoSelectFirst = false) => {
    fetch('/api/chat')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
          if (autoSelectFirst && !activeSessionId && data.sessions.length > 0) {
            setActiveSessionId(data.sessions[0].id);
          }
        }
      })
      .catch((err) => console.warn('Failed to load chat sessions:', err));
  };

  useEffect(() => {
    fetchSessions(true);
  }, []);

  const handleStartNewSession = () => {
    setActiveSessionId(undefined);
    setSelectedMission(null);
  };

  return (
    <div className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex flex-col space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Gideon Command Cockpit & Chat
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Direct natural-language operating surface for Gideon, Atlas, Forge, and Sentinel.
          </p>
        </div>

        <button
          onClick={handleStartNewSession}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          New Session
        </button>
      </div>

      {/* Main 3-Column Cockpit Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Left: Durable Conversation History */}
        <div className="hidden lg:flex flex-col bg-[#0a0d13] border border-gray-800 rounded-xl overflow-hidden p-3 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 px-1">
            <span>Sessions History</span>
            <span className="text-gray-500">({sessions.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-xs font-mono">
                No past sessions. Start chatting to begin.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col space-y-1 ${
                      isActive
                        ? 'bg-emerald-950/30 border-emerald-800/80 text-white'
                        : 'bg-[#0d111a] border-gray-800/60 hover:border-gray-700 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate max-w-[170px]">
                        {s.title}
                      </span>
                      <ChevronRight className={`w-3 h-3 ${isActive ? 'text-emerald-400' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span>{s.contextType}</span>
                      <span>{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Interactive Chat Surface (2 Columns) */}
        <div className="lg:col-span-2 h-full flex flex-col min-h-0">
          <GideonChatConsole
            conversationId={activeSessionId}
            onConversationChange={(id) => {
              setActiveSessionId(id);
              fetchSessions(false);
            }}
            onSelectMission={(m) => setSelectedMission(m)}
          />
        </div>

        {/* Right: Mission Context Panel (1 Column) */}
        <div className="hidden lg:block h-full overflow-y-auto">
          <MissionContextPanel mission={selectedMission} />
        </div>
      </div>
    </div>
  );
}
