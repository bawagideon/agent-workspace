'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  FolderGit2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  ArrowRight, 
  DollarSign, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Activity,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ProjectRecord } from '@gideon/shared';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.warn('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'QA_VERIFIED':
      case 'DEPLOYED':
        return { label: status, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'BUILDING':
      case 'TESTING':
        return { label: status, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'STAGING':
      case 'CLIENT_REVIEW':
        return { label: status, color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      default:
        return { label: status, color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Projects Operating System
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Governed digital assets, microservices, and client software built and tested by Forge and Sentinel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4">
          <div className="text-[11px] font-mono text-gray-400">REGISTERED PROJECTS</div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary?.totalProjects ?? projects.length}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{summary?.healthyCount ?? projects.length} Healthy</span>
          </div>
        </div>

        <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4">
          <div className="text-[11px] font-mono text-gray-400">PIPELINE VALUE</div>
          <div className="text-2xl font-bold text-white mt-1">
            ${(((summary?.totalValueCents || 0)) / 100).toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Quoted Client Value</div>
        </div>

        <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4">
          <div className="text-[11px] font-mono text-gray-400">AGENT BUILD SPEND</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ${(((summary?.totalBuildCostCents || 1)) / 100).toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">Total Token Inferences</div>
        </div>

        <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4">
          <div className="text-[11px] font-mono text-gray-400">SECURITY & QA GATE</div>
          <div className="text-2xl font-bold text-white mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>100%</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Sentinel Audited</div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
          <span>Active Codebases ({projects.length})</span>
          <span>Attached Workspace Root: projects/</span>
        </div>

        {loading && projects.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs font-mono bg-[#0d1017] border border-gray-800 rounded-xl">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
            Scanning physical codebases and synchronizing database records...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs font-mono bg-[#0d1017] border border-gray-800 rounded-xl">
            No projects discovered yet. Ask Forge to scaffold a microservice in Chat.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => {
              const statusBadge = getStatusBadge(p.status);

              return (
                <div 
                  key={p.id}
                  className="bg-[#0d1017] border border-gray-800/80 hover:border-gray-700 rounded-xl p-5 flex flex-col justify-between space-y-4 transition shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white hover:text-emerald-400 transition">
                            <Link href={`/projects/${p.id}`}>{p.name}</Link>
                          </h3>
                          <span className="text-[10px] font-mono text-gray-500 bg-black/40 px-1.5 py-0.5 rounded border border-gray-800">
                            {p.currentVersion}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <FolderGit2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{p.workspacePath}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                      {p.businessObjective || p.problemSolved || 'Automated client microservice'}
                    </p>

                    {/* Tech stack badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(p.metadata?.techStack || ['Node.js', 'Express', 'Stripe']).map((tech: string) => (
                        <span key={tech} className="text-[10px] font-mono bg-gray-900 text-gray-400 px-2 py-0.5 rounded border border-gray-800">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-gray-500 block">COST</span>
                        <span className="text-emerald-400 font-bold">${((p.buildCostCents || 1) / 100).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">OFFER</span>
                        <span className="text-white font-bold">${((p.pricingCents || 85000) / 100).toLocaleString()}</span>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${p.id}`}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                    >
                      <span>Open Cockpit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
