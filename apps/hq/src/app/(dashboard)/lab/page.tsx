'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Terminal, 
  Play, 
  Square, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  Activity, 
  Laptop, 
  Tablet, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Server, 
  Layers,
  ArrowLeft,
  Search,
  Trash2
} from 'lucide-react';
import { ProjectRecord } from '@gideon/shared';

interface ManagedProcessInfo {
  id: string;
  projectId: string;
  port: number;
  pid: number;
  executionTarget: string;
  status: 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'FAILED' | 'TERMINATION_FAILED';
  health: 'UNKNOWN' | 'HEALTHY' | 'UNHEALTHY';
  startedAt: string;
  stoppedAt?: string;
  exitCode?: number;
  logCount: number;
}

function BuildLabContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('project') || '';

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [activeProcess, setActiveProcess] = useState<ManagedProcessInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load project list
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
          if (!selectedProjectId && data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load projects:', err);
      }
    }
    loadProjects();
  }, []);

  // Sync selected project with active process
  const pollProcess = async (projId: string) => {
    if (!projId) return;
    try {
      const res = await fetch(`/api/lab/processes?projectId=${projId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.processes)) {
        const running = data.processes.find(
          (p: ManagedProcessInfo) => p.status === 'RUNNING' || p.status === 'STARTING'
        );
        setActiveProcess(running || null);
      }
    } catch (err) {
      console.warn('Failed to poll process:', err);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      setActiveProcess(null);
      setLogs([]);
      pollProcess(selectedProjectId);
      const interval = setInterval(() => pollProcess(selectedProjectId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedProjectId]);

  // Poll logs when process is active
  useEffect(() => {
    if (!activeProcess || (activeProcess.status !== 'RUNNING' && activeProcess.status !== 'STARTING')) {
      return;
    }

    if (activeProcess.projectId !== selectedProjectId) {
      return;
    }

    const fetchLogs = async () => {
      try {
        const res = await fetch(
          `/api/lab/processes/${activeProcess.id}/logs?projectId=${activeProcess.projectId}&tail=250`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.warn('Failed to fetch logs:', err);
      }
    };

    fetchLogs();
    const logInterval = setInterval(fetchLogs, 1500);
    return () => clearInterval(logInterval);
  }, [activeProcess?.id, activeProcess?.status, activeProcess?.projectId, selectedProjectId]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleStartProcess = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/lab/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          executionTarget: 'dev'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveProcess(data.process);
        setLogs([`[SUPERVISOR] Starting supervised process on leased port ${data.process.port}...`]);
      } else {
        alert(`Failed to start dev server: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Start server error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStopProcess = async () => {
    if (!activeProcess) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/lab/processes/${activeProcess.id}?projectId=${selectedProjectId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success || data.alreadyStopped || res.status === 404 || data.error?.includes('not found')) {
        setActiveProcess(null);
        setLogs(prev => [...prev, '[SUPERVISOR] Process tree terminated and port lease released.']);
      } else {
        alert(`Failed to stop process: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Stop server error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    await handleStopProcess();
    setTimeout(() => {
      handleStartProcess();
    }, 1000);
  };

  const filteredLogs = logFilter
    ? logs.filter(line => line.toLowerCase().includes(logFilter.toLowerCase()))
    : logs;

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const previewUrl = activeProcess && activeProcess.status === 'RUNNING' 
    ? `http://127.0.0.1:${activeProcess.port}` 
    : null;

  const getViewportWidthClass = () => {
    if (viewport === 'mobile') return 'max-w-[375px]';
    if (viewport === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Bar: Selector & Action Controls */}
      <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h1 className="text-base font-bold text-white tracking-tight">Controlled Build Lab</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                PORT POOL 4100–4199
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Isolated supervisor executing governed project dev servers and live preview sandboxes.
            </p>
          </div>
        </div>

        {/* Project Selector & Process Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-black/50 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.currentVersion})
              </option>
            ))}
          </select>

          {/* Status Badge */}
          {activeProcess ? (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border flex items-center gap-1.5 ${
                activeProcess.status === 'RUNNING'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : activeProcess.status === 'STARTING'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeProcess.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`} />
                {activeProcess.status} (PORT {activeProcess.port})
              </span>

              <button
                onClick={handleStopProcess}
                disabled={loading}
                className="flex items-center gap-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>

              <button
                onClick={handleRestart}
                disabled={loading}
                className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 rounded-lg transition"
                title="Restart Process"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartProcess}
              disabled={loading || !selectedProjectId}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loading ? 'Launching...' : 'Start Dev Server'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Split Cockpit: Terminal Log Console (Left) + Sandbox Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left Pane: Supervised Terminal Log Stream */}
        <div className="bg-[#0b0e14] border border-gray-800/80 rounded-xl flex flex-col min-h-0 overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-[#0e121a] px-4 py-2.5 border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white">Controlled stdout / stderr</span>
              <span className="text-[10px] text-gray-500 font-mono">({filteredLogs.length} lines)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-black/60 border border-gray-800 rounded px-2 py-0.5 text-[11px] font-mono text-gray-300 pl-6 w-32 focus:w-44 transition-all focus:outline-none"
                />
                <Search className="w-3 h-3 text-gray-500 absolute left-1.5 top-1.5" />
              </div>

              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                  autoScroll 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-gray-900 text-gray-400 border-gray-800'
                }`}
              >
                Auto-scroll
              </button>

              <button
                onClick={() => setLogs([])}
                className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-900 transition"
                title="Clear Logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Terminal Console Output Window */}
          <div className="p-4 font-mono text-[11px] text-gray-300 flex-1 overflow-y-auto space-y-1 bg-black/40">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-600 text-center py-16">
                {activeProcess 
                  ? 'Waiting for process stream output...' 
                  : 'Dev server is stopped. Click "Start Dev Server" to begin.'}
              </div>
            ) : (
              filteredLogs.map((line, idx) => (
                <div key={idx} className="leading-relaxed hover:bg-white/[0.02] px-1 rounded break-all">
                  {line.includes('ERROR') || line.includes('ERR') || line.includes('fail') ? (
                    <span className="text-red-400">{line}</span>
                  ) : line.includes('WARN') ? (
                    <span className="text-amber-400">{line}</span>
                  ) : line.includes('READY') || line.includes('listening') || line.includes('http') ? (
                    <span className="text-emerald-300 font-semibold">{line}</span>
                  ) : (
                    <span className="text-gray-300">{line}</span>
                  )}
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Right Pane: Sandboxed Preview Iframe */}
        <div className="bg-[#0b0e14] border border-gray-800/80 rounded-xl flex flex-col min-h-0 overflow-hidden">
          {/* Preview Header & Controls */}
          <div className="bg-[#0e121a] px-4 py-2 border-b border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white">Sandboxed Interactive Preview</span>
              {previewUrl && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {previewUrl}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Viewport Switcher */}
              <div className="flex items-center bg-black/60 p-0.5 rounded border border-gray-800">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-1 rounded transition ${viewport === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Desktop View"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-1 rounded transition ${viewport === 'tablet' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Tablet View"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-1 rounded transition ${viewport === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {previewUrl && (
                <>
                  <button
                    onClick={() => setIframeKey(k => k + 1)}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
                    title="Reload Preview"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-gray-400 hover:text-emerald-400 rounded hover:bg-gray-800 transition"
                    title="Open in New Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Iframe Preview Body */}
          <div className="flex-1 bg-[#090b0e] flex items-center justify-center p-2 overflow-hidden">
            {previewUrl ? (
              <div className={`h-full bg-[#0a0d14] rounded-xl border border-white/10 shadow-2xl transition-all overflow-hidden flex flex-col ${getViewportWidthClass()}`}>
                <iframe
                  key={iframeKey}
                  src={previewUrl}
                  title="Project Build Lab Preview"
                  sandbox="allow-scripts allow-forms allow-same-origin"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="text-center p-8 max-w-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Preview Offline</h3>
                <p className="text-xs text-gray-500">
                  Launch the supervised process to inspect live interactive UI and test endpoints directly inside the isolated loopback sandbox.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuildLabPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-gray-500 font-mono text-xs">Loading Build Lab...</div>}>
      <BuildLabContent />
    </React.Suspense>
  );
}
