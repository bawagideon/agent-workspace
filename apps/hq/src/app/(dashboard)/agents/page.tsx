'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  PlusCircle, 
  Wrench, 
  Shield, 
  ArrowUpRight, 
  Sparkles, 
  RotateCw,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DigitalEmployee {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  description: string;
  model: string;
  status: string;
  capabilities: string[];
}

const DEFAULT_AGENTS: DigitalEmployee[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    avatar: '🧠',
    role: 'Chief of Staff & Orchestrator',
    department: 'Management',
    description: 'Workforce coordinator managing task DAGs, routing goals between specialists, and synthesizing executive briefings.',
    model: 'gemini-2.0-flash',
    status: 'IDLE',
    capabilities: ['agent_delegate', 'agent_inspect', 'memory_search', 'approval_request']
  },
  {
    id: 'forge',
    name: 'Forge',
    avatar: '🔨',
    role: 'Senior Software Engineer',
    department: 'Development',
    description: 'Full-stack engineer specializing in Next.js 15, TypeScript 5, Tailwind CSS, API architecture, and Supabase sandboxes.',
    model: 'gemini-2.0-flash',
    status: 'IDLE',
    capabilities: ['fs_read', 'fs_write', 'fs_list', 'git_status', 'git_diff', 'terminal_run_build']
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    avatar: '🛡️',
    role: 'QA & Reliability Engineer',
    department: 'QA',
    description: 'Staff QA engineer performing independent code reviews, boundary tests, regression detection, and build verification.',
    model: 'gemini-2.0-flash',
    status: 'IDLE',
    capabilities: ['fs_read', 'fs_list', 'git_diff', 'terminal_run_test', 'terminal_run_lint']
  },
  {
    id: 'scout',
    name: 'Scout',
    avatar: '🔭',
    role: 'Market Scanner & Opportunity Lead',
    department: 'Intelligence',
    description: 'Discovers and calibrates market opportunities, validates willingness to pay, and calculates Bayesian prior/posteriors.',
    model: 'gemini-2.0-flash',
    status: 'IDLE',
    capabilities: ['market_scan', 'bounty_fetch', 'score_opportunity', 'bayesian_calibrate']
  },
  {
    id: 'ledger',
    name: 'Ledger',
    avatar: '⚖️',
    role: 'Financial Controller & CFO Engine',
    department: 'Finance',
    description: 'Enforces the Rule of Iron: strict dual-currency accounting, budget caps, inference token costs, and verified revenue tracking.',
    model: 'gemini-2.0-flash',
    status: 'IDLE',
    capabilities: ['ledger_record', 'verify_payout', 'budget_audit', 'margin_calculate']
  },
  {
    id: 'release',
    name: 'Release',
    avatar: '🚀',
    role: 'Deployment & Infrastructure Engineer',
    department: 'Operations',
    description: 'Manages OpenClaw Gateway connectivity, VPS deployments, health checks, rollback triggers, and container state.',
    model: 'gemini-2.0-flash',
    status: 'IDLE',
    capabilities: ['container_health', 'gateway_ping', 'vps_deploy', 'canary_check']
  }
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<DigitalEmployee[]>(DEFAULT_AGENTS);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hq_agents')
        .select('*');

      if (!error && data && data.length > 0) {
        // Merge Supabase agents with the full 6-agent roster
        const merged = DEFAULT_AGENTS.map((def) => {
          const dbMatch = data.find((d: any) => d.id === def.id);
          if (dbMatch) {
            return {
              ...def,
              status: dbMatch.status || def.status,
              role: dbMatch.role || def.role,
              department: dbMatch.department || def.department,
              capabilities: dbMatch.capabilities || def.capabilities
            };
          }
          return def;
        });
        setAgents(merged);
      }
    } catch (err) {
      console.warn('Agent fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Digital Employee Directory
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Governed autonomous agent roster with specialized domain proficiencies, tool whitelists, and model backends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAgents}
            className="p-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            title="Refresh Agents"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/chat"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20"
          >
            <MessageSquare className="w-4 h-4" />
            Command All in Chat
          </Link>
        </div>
      </div>

      {/* 6-Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-card border border-card-border rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-card-border/80 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2 rounded-xl bg-[#090a0f] border border-card-border">{agent.avatar}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded font-bold font-mono ${
                    agent.status === 'WORKING' || agent.status === 'BUSY'
                      ? 'bg-success/10 text-success border border-success/20'
                      : agent.status === 'WAITING_APPROVAL'
                      ? 'bg-warning/10 text-warning border border-warning/20'
                      : 'bg-[#090a0f] text-gray-400 border border-card-border'
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-0.5">{agent.name}</h3>
              <div className="text-xs font-mono text-primary-400 mb-3">{agent.role}</div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{agent.description}</p>

              <div className="p-3 bg-[#090a0f] border border-card-border rounded-lg text-xs font-mono space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="text-accent">{agent.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Primary Model:</span>
                  <span className="text-gray-300 font-bold">{agent.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tool Whitelist:</span>
                  <span className="text-gray-400">{agent.capabilities.length} tools</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-card-border flex items-center justify-between">
              <span className="text-[11px] text-gray-500 font-mono">@{agent.id}</span>
              <Link
                href={`/chat?cmd=@${agent.id} status`}
                className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 font-mono transition-colors"
              >
                Ask {agent.name} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
