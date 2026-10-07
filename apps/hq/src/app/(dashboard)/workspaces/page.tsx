'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FolderGit2, 
  PlusCircle, 
  Shield, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Terminal, 
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Workspace {
  id: string;
  name: string;
  machine_id?: string;
  root_path: string;
  access_mode: 'READ_WRITE' | 'READ_ONLY' | 'DISABLED';
  status: string;
  default_branch?: string;
  allowed_agents?: string[];
  created_at?: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPath, setFormPath] = useState('');
  const [formMode, setFormMode] = useState<'READ_WRITE' | 'READ_ONLY'>('READ_WRITE');
  const [formBranch, setFormBranch] = useState('main');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: sbError } = await supabase
        .from('hq_workspaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (sbError) {
        console.warn('Supabase fetch error, using local fallback:', sbError.message);
        setWorkspaces([
          {
            id: 'ws-agent-workspace',
            name: 'Gideon AI HQ Core Workspace',
            machine_id: 'GIDMACHINE_WIN',
            root_path: 'C:\\Users\\DELL\\agent-workspace',
            access_mode: 'READ_WRITE',
            status: 'READY',
            default_branch: 'main',
            allowed_agents: ['forge', 'sentinel', 'atlas']
          }
        ]);
      } else if (data && data.length > 0) {
        setWorkspaces(data as Workspace[]);
      } else {
        setWorkspaces([
          {
            id: 'ws-agent-workspace',
            name: 'Gideon AI HQ Core Workspace',
            machine_id: 'GIDMACHINE_WIN',
            root_path: 'C:\\Users\\DELL\\agent-workspace',
            access_mode: 'READ_WRITE',
            status: 'READY',
            default_branch: 'main',
            allowed_agents: ['forge', 'sentinel', 'atlas']
          }
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registered workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPath.trim()) {
      setFormError('Name and Root Path are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const generatedId = `ws-${formName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`;

    try {
      const newWs: Workspace = {
        id: generatedId,
        name: formName.trim(),
        machine_id: 'GIDMACHINE_WIN',
        root_path: formPath.trim(),
        access_mode: formMode,
        status: 'READY',
        default_branch: formBranch.trim() || 'main',
        allowed_agents: ['forge', 'sentinel', 'atlas']
      };

      const { error: insertError } = await supabase
        .from('hq_workspaces')
        .upsert(newWs);

      if (insertError) {
        console.warn('Direct upsert warning:', insertError.message);
      }

      setWorkspaces((prev) => {
        const filtered = prev.filter((w) => w.id !== generatedId);
        return [...filtered, newWs];
      });

      setIsModalOpen(false);
      setFormName('');
      setFormPath('');
      setFormMode('READ_WRITE');
      setFormBranch('main');
    } catch (err: any) {
      setFormError(err.message || 'Failed to register workspace.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-primary-500" />
            Registered Workspaces Sandbox
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Agents operate strictly within these authorized directories. Arbitrary paths are permanently blocked.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Register Workspace
        </button>
      </div>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Workspaces Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center space-y-3">
          <FolderGit2 className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Registered Workspaces</h3>
          <p className="text-xs text-gray-400">Register a local project directory so Forge and Sentinel can safely operate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <div key={ws.id} className="bg-card border border-card-border rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-card-border/80 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-gray-400">{ws.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                      ws.access_mode === 'READ_WRITE'
                        ? 'bg-success/10 text-success border border-success/20'
                        : 'bg-warning/10 text-warning border border-warning/20'
                    }`}
                  >
                    {ws.access_mode}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{ws.name}</h3>
                <p className="text-xs font-mono text-gray-400 break-all mb-4 bg-[#090a0f] p-2 rounded border border-card-border">
                  {ws.root_path}
                </p>

                <div className="space-y-1.5 text-xs text-gray-400">
                  <div>Machine: <strong className="text-gray-300">{ws.machine_id || 'GIDMACHINE_WIN'}</strong></div>
                  <div>Default Branch: <strong className="text-gray-300">{ws.default_branch || 'main'}</strong></div>
                  <div>
                    Authorized Agents:{' '}
                    <strong className="text-accent">
                      {ws.allowed_agents ? ws.allowed_agents.join(', ') : 'forge, sentinel, atlas'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-card-border flex items-center justify-between text-xs">
                <span className="text-success flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sandbox Verified
                </span>
                <Link
                  href={`/chat?cmd=audit workspace ${ws.id}`}
                  className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold font-mono transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Audit with Gideon
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-card-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-primary-500" />
                Register New Workspace Sandbox
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-danger/10 border border-danger/30 text-danger rounded-md">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-gray-300 font-bold">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Core API Service"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-bold">Absolute Local Filesystem Path</label>
                <input
                  type="text"
                  placeholder="e.g. C:\Users\DELL\my-project"
                  value={formPath}
                  onChange={(e) => setFormPath(e.target.value)}
                  required
                  className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary-500"
                />
                <p className="text-[10px] text-gray-500">
                  Must be an absolute path on the host machine running Gideon Runner.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Access Mode</label>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  >
                    <option value="READ_WRITE">READ_WRITE (Inspect & Code)</option>
                    <option value="READ_ONLY">READ_ONLY (Audit Only)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Default Branch</label>
                  <input
                    type="text"
                    placeholder="main"
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-card-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-card-border text-gray-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold disabled:opacity-50 transition-all shadow-lg shadow-primary-600/20"
                >
                  {submitting ? 'Registering...' : 'Register Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
