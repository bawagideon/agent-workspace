'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Terminal, 
  Search, 
  PlusCircle, 
  Sparkles, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Zap,
  X,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface SentinelNotification {
  id: string;
  type: 'QA_AUDIT' | 'SECURITY' | 'OPPORTUNITY' | 'GATE' | 'FLYWEEL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export function HQHeader() {
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState<SentinelNotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchApprovals = () => {
    fetch('/api/approvals')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.approvals)) {
          const pending = data.approvals.filter((a: any) => a.status === 'PENDING').length;
          setPendingCount(pending);
        }
      })
      .catch(() => {});
  };

  const fetchNotifications = () => {
    fetch('/api/sentinel/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          setUnreadNotifsCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchApprovals();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/sentinel/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadNotifsCount(0);
      }
    } catch {}
  };

  const markItemRead = async (id: string) => {
    try {
      const res = await fetch('/api/sentinel/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_READ', id })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadNotifsCount(data.unreadCount);
      }
    } catch {}
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'QA_AUDIT':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'OPPORTUNITY':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'SECURITY':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'GATE':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <header className="h-16 glass-panel border-b border-white/[0.07] px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
      {/* Quick Search / Command Palette Hint */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 bg-black/40 border border-white/[0.08] hover:border-primary-500/40 px-3.5 py-1.5 rounded-xl text-xs text-gray-400 w-72 md:w-80 transition-all shadow-inner">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <span className="truncate">Search tasks, projects, evidence...</span>
          <kbd className="ml-auto bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] text-gray-300 font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Action Controls & Active Alerts */}
      <div className="flex items-center gap-3 md:gap-4">
        <Link
          href="/showcase"
          className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Showcase Hub</span>
        </Link>

        <Link
          href="/tasks?new=true"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-glow-primary hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Dispatch Task</span>
        </Link>

        <div className="h-5 w-[1px] bg-white/10" />

        {/* Sentinel Live Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 rounded-xl bg-black/40 border border-white/[0.08] hover:border-emerald-500/40 text-gray-300 hover:text-white transition-all group"
            title="Sentinel Autonomous Observer Notifications"
          >
            <Bell className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-2 ring-black animate-pulse font-mono">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#090d16] border border-white/15 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-white font-sans tracking-wide">SENTINEL OBSERVER FEED</span>
                  {unreadNotifsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {unreadNotifsCount} NEW
                    </span>
                  )}
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-gray-400 hover:text-emerald-300 font-mono transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 text-xs font-mono">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-xs">
                    No notifications from Sentinel.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markItemRead(n.id)}
                      className={`p-3.5 transition flex gap-3 ${
                        n.read ? 'bg-transparent opacity-65 hover:opacity-100 hover:bg-white/5' : 'bg-emerald-950/20 hover:bg-emerald-950/30'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px] font-sans">{n.title}</span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 font-sans leading-relaxed">{n.message}</p>
                        {(n as any).observation && (
                          <div className="p-1.5 rounded bg-black/60 border border-white/10 text-[10px] text-amber-300 font-sans mt-1">
                            <span className="font-bold text-amber-400">Observation: </span> {(n as any).observation}
                          </div>
                        )}
                        {(n as any).recommendation && (
                          <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-sans mt-1">
                            <span className="font-bold text-emerald-400">Recommendation: </span> {(n as any).recommendation}
                          </div>
                        )}
                        {(n as any).proposedLesson && (
                          <div className="p-1.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 font-sans mt-1">
                            <span className="font-bold text-cyan-400">Lesson: </span> {(n as any).proposedLesson}
                          </div>
                        )}
                        {n.actionUrl && (
                          <Link
                            href={n.actionUrl}
                            onClick={() => setShowNotifDropdown(false)}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold mt-1.5"
                          >
                            <span>Open in Studio</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-black/60 border-t border-white/10 text-center">
                <Link
                  href="/sentinel"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[10px] text-gray-400 hover:text-white font-mono transition inline-flex items-center gap-1"
                >
                  <span>View Full Sentinel 9-Dimensional Audit Console</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Gate Approvals Shield */}
        <Link
          href="/approvals"
          className="relative p-2 rounded-xl bg-black/40 border border-white/[0.08] hover:border-amber-500/40 text-gray-300 hover:text-white transition-all group"
          title="Human Authority Gates"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black ring-2 ring-black animate-pulse">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* Live Portfolio Shortcut */}
        <a
          href="https://gideonbawa-website.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex p-2 rounded-xl bg-black/40 border border-white/[0.08] hover:border-cyan-500/40 text-gray-300 hover:text-white transition-all"
          title="View Live 3D Portfolio"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
        </a>
      </div>
    </header>
  );
}
