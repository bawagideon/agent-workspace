'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Terminal, 
  Search, 
  Sparkles, 
  Activity, 
  Sun, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Pause,
  Play,
  AlertOctagon,
  MessageSquare
} from 'lucide-react';

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const executeCommand = async (cmdText: string) => {
    if (!cmdText.trim()) return;
    setLoading(true);
    setFeedback(null);

    // If query looks like a chat question, route to /chat
    if (cmdText.startsWith('chat ') || cmdText.startsWith('ask ')) {
      router.push(`/chat?prompt=${encodeURIComponent(cmdText)}`);
      setOpen(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: cmdText,
          senderId: 'hq-web-user',
          source: 'pwa'
        })
      });
      const data = await res.json();
      setFeedback(data.message || (data.success ? 'Command executed successfully.' : data.error));
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  if (!open) return null;

  const suggestions = [
    { label: 'System Status', cmd: 'status', icon: Activity, tag: 'Fast' },
    { label: 'Executive Briefing', cmd: 'briefing', icon: Sun, tag: 'Live' },
    { label: 'Investigate BuildVault', cmd: 'investigate BuildVault', icon: Sparkles, tag: 'Scout' },
    { label: 'Why Not BuildVault', cmd: 'why-not BuildVault', icon: Terminal, tag: 'Rationale' },
    { label: 'Pause All Missions', cmd: 'pause all', icon: Pause, tag: 'Control' },
    { label: 'Resume All Missions', cmd: 'resume all', icon: Play, tag: 'Control' },
    { label: 'Emergency Killswitch', cmd: 'kill-all', icon: AlertOctagon, tag: 'Halt' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-[#0b0e14] border border-gray-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100 font-sans">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0e121b]">
          <Search className="w-4 h-4 text-emerald-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                executeCommand(query);
              }
            }}
            placeholder="Type command or natural language directive (e.g. 'status', 'investigate BuildVault')..."
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none font-mono py-1"
            autoFocus
          />
          <kbd className="text-[10px] font-mono text-gray-500 bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Feedback Card */}
        {feedback && (
          <div className="p-3 bg-emerald-950/30 border-b border-emerald-800/40 text-emerald-300 text-xs font-mono whitespace-pre-line">
            {feedback}
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="p-2 space-y-1 max-h-80 overflow-y-auto text-xs">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500 px-3 py-1.5">
            Quick Directives
          </div>
          {suggestions.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setQuery(s.cmd);
                  executeCommand(s.cmd);
                }}
                disabled={loading}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800/60 text-left text-gray-300 hover:text-white transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-400" />
                  <span className="font-mono text-xs">{s.cmd}</span>
                  <span className="text-[11px] text-gray-500 font-sans">({s.label})</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 text-gray-400">
                  {s.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Help Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#080a0f] border-t border-gray-800/80 text-[11px] font-mono text-gray-500">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="bg-gray-900 border border-gray-800 px-1 rounded text-[10px]">Enter</kbd>
            <span>to execute</span>
          </div>
          <button
            onClick={() => {
              router.push('/chat');
              setOpen(false);
            }}
            className="flex items-center gap-1 text-emerald-400 hover:underline"
          >
            <MessageSquare className="w-3 h-3" />
            Open Full Chat
          </button>
        </div>
      </div>
    </div>
  );
}
