'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Filter, 
  Terminal, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RotateCw,
  FolderGit2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Film
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ActivityEvent {
  id: string;
  created_at: string;
  agent_id?: string;
  project_id?: string;
  event_type: string;
  severity?: string;
  message: string;
  payload?: any;
}

const DEFAULT_EVENTS: ActivityEvent[] = [
  {
    id: 'evt-qa-008',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    agent_id: 'sentinel',
    project_id: 'webhook-billing-bridge',
    event_type: 'SENTINEL_QA_PASSED',
    severity: 'INFO',
    message: 'All 8 Acceptance Contracts verified. SHA-256 seal matches Gate 3 draft.',
    payload: { contractsPassed: 8, total: 8, sha256: '56b0975b6e5ed749aaefdb32df5ce5994e871c276a26fa604cc8656b2f85e9e8' }
  },
  {
    id: 'evt-forge-007',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    agent_id: 'forge',
    project_id: 'webhook-billing-bridge',
    event_type: 'STORY_PACK_RENDERED',
    severity: 'INFO',
    message: 'Rendered 8x mathematical 3D isometric slides with illuminated top and ambient shadow facets.',
    payload: { generator: 'StoryPackGenerator.ts', slides: 8, fps: 60 }
  },
  {
    id: 'evt-sup-006',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    agent_id: 'sentinel',
    project_id: 'gideon-hq',
    event_type: 'LESSON_INSTITUTIONALIZED',
    severity: 'WARN',
    message: 'RULE_GENERATED_ARTIFACT_PRESERVATION loaded into MissionSupervisor. Direct SVG edits blocked.',
    payload: { ruleId: 'RULE_GENERATED_ARTIFACT_PRESERVATION', confidence: 0.98 }
  },
  {
    id: 'evt-atlas-005',
    created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    agent_id: 'atlas',
    project_id: 'gideon-hq',
    event_type: 'ROADMAP_SYNTHESIZED',
    severity: 'INFO',
    message: 'Synthesized Gideon V5 Engineering Intelligence and Primary AI Workspace master plan.',
    payload: { stages: 8, currentStage: 'Stage 1' }
  },
  {
    id: 'evt-gate-004',
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    agent_id: 'release',
    project_id: 'webhook-billing-bridge',
    event_type: 'GATE_STAGED',
    severity: 'INFO',
    message: 'Gate 1 (GitHub) and Gate 2 (Netlify) staged awaiting operator cryptographic sign-off.',
    payload: { gate1: 'PENDING_SIGNATURE', gate2: 'PENDING_SIGNATURE' }
  }
];

export default function ActivityLogPage() {
  const [events, setEvents] = useState<ActivityEvent[]>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hq_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        setEvents(data as ActivityEvent[]);
      } else {
        setEvents(DEFAULT_EVENTS);
      }
    } catch (err) {
      console.warn('Activity fetch error, falling back to local memory:', err);
      setEvents(DEFAULT_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchSeverity = severityFilter === 'ALL' || (e.severity || 'INFO').toUpperCase() === severityFilter;
    const matchAgent = agentFilter === 'ALL' || (e.agent_id || '').toLowerCase() === agentFilter.toLowerCase();
    return matchSeverity && matchAgent;
  });

  const getAgentPill = (agentId?: string) => {
    switch ((agentId || '').toLowerCase()) {
      case 'forge':
        return { label: 'FORGE', color: 'text-amber-400 bg-amber-950/30 border-amber-500/40' };
      case 'atlas':
        return { label: 'ATLAS', color: 'text-cyan-400 bg-cyan-950/30 border-cyan-500/40' };
      case 'sentinel':
        return { label: 'SENTINEL', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/40' };
      case 'scout':
        return { label: 'SCOUT', color: 'text-purple-400 bg-purple-950/30 border-purple-500/40' };
      case 'release':
        return { label: 'RELEASE', color: 'text-red-400 bg-red-950/30 border-red-500/40' };
      default:
        return { label: 'SYSTEM', color: 'text-gray-300 bg-gray-900 border-gray-700' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#070b14] border border-white/[0.08] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Operational Event Spine
              </span>
              <span className="text-[11px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                Chronological Nervous System
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span>Gideon Activity Stream & Event Spine</span>
            </h1>
            <p className="text-xs text-gray-400 max-w-2xl font-sans">
              Real-time chronological timeline tracking code modifications, 3D renders, test suites, mission states, and authority gate triggers.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={fetchEvents}
              className="p-2 rounded-xl bg-black/50 border border-white/10 hover:border-red-500/40 text-gray-400 hover:text-white transition"
              title="Refresh Activity Log"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/workspace"
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3.5 py-2 rounded-xl transition shadow-glow-primary"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#050811] p-3 rounded-xl border border-white/[0.08] text-xs font-mono">
        {/* Agent Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-gray-500 uppercase text-[10px] font-bold mr-1">Agent:</span>
          {['ALL', 'atlas', 'forge', 'sentinel', 'scout', 'release'].map((agent) => (
            <button
              key={agent}
              onClick={() => setAgentFilter(agent)}
              className={`px-2.5 py-1 rounded-lg uppercase text-[11px] transition ${
                agentFilter === agent
                  ? 'bg-red-600 text-white font-bold shadow-glow-primary'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {agent}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 uppercase text-[10px] font-bold mr-1">Severity:</span>
          {['ALL', 'INFO', 'WARN', 'ERROR'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition ${
                severityFilter === sev
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-3">
        {filteredEvents.map((evt) => {
          const pill = getAgentPill(evt.agent_id);
          return (
            <div
              key={evt.id}
              className="p-4 rounded-xl bg-[#050811] border border-white/[0.08] hover:border-red-500/40 transition shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-red-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${pill.color}`}>
                      {pill.label}
                    </span>
                    <span className="text-xs font-extrabold text-white font-mono">
                      {evt.event_type}
                    </span>
                    {evt.project_id && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                        {evt.project_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 font-sans">{evt.message}</p>
                  {evt.payload && (
                    <div className="text-[10px] font-mono text-gray-400 truncate max-w-2xl bg-black/40 px-2 py-1 rounded border border-white/5">
                      {JSON.stringify(evt.payload)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between gap-1 text-[11px] font-mono text-gray-500 shrink-0">
                <span>{new Date(evt.created_at).toLocaleTimeString()}</span>
                <Link
                  href="/workspace"
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
