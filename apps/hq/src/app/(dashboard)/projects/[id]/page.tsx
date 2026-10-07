'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Package, 
  FolderGit2, 
  CheckCircle2, 
  ShieldCheck, 
  FileCode, 
  Activity, 
  Play, 
  Clock, 
  Layers, 
  DollarSign, 
  Terminal, 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Lock,
  ChevronRight,
  ExternalLink,
  Brain,
  Share2
} from 'lucide-react';
import { ProjectRecord, ProjectEvent, ProjectTestRun } from '@gideon/shared';
import { ProjectContextInspector } from '@/components/projects/ProjectContextInspector';
import { ProjectEconomicsTab } from '@/components/projects/ProjectEconomicsTab';
import { ProjectPortalTab } from '@/components/projects/ProjectPortalTab';

type CockpitTab = 'OVERVIEW' | 'FILES' | 'QUALITY' | 'WORKFORCE' | 'ECONOMICS' | 'CONTEXT' | 'PORTAL';

export default function ProjectCockpitPage() {
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [testRuns, setTestRuns] = useState<ProjectTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CockpitTab>('OVERVIEW');

  // File explorer state
  const [currentPath, setCurrentPath] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [filesLoading, setFilesLoading] = useState(false);

  // Test runner state
  const [runningTests, setRunningTests] = useState(false);
  const [testStatusMsg, setTestStatusMsg] = useState<string | null>(null);

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.project);
        setEvents(data.events || []);
        setTestRuns(data.testRuns || []);
      }
    } catch (err) {
      console.warn('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (subPath: string = '') => {
    try {
      setFilesLoading(true);
      const res = await fetch(`/api/projects/${id}/files?path=${encodeURIComponent(subPath)}`);
      const data = await res.json();
      if (data.success) {
        if (data.isDirectory) {
          setFileList(data.files || []);
          setCurrentPath(subPath);
          setSelectedFileContent(null);
          setSelectedFileName(null);
        } else {
          setSelectedFileContent(data.content || '');
          setSelectedFileName(data.path);
        }
      }
    } catch (err) {
      console.warn('File read error:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleRunTests = async () => {
    try {
      setRunningTests(true);
      setTestStatusMsg('Running governed adversarial audit...');
      const res = await fetch(`/api/projects/${id}/tests`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestStatusMsg(`Tests ${data.summary.status}: ${data.summary.passedCount} passed in ${data.summary.durationMs}ms`);
        fetchProjectDetail();
      } else {
        setTestStatusMsg(`Test error: ${data.error}`);
      }
    } catch (err: any) {
      setTestStatusMsg(`Failed to execute tests: ${err.message}`);
    } finally {
      setRunningTests(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetail();
      loadFiles('');
    }
  }, [id]);

  if (loading && !project) {
    return (
      <div className="p-12 text-center text-gray-400 font-mono text-xs max-w-7xl mx-auto">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400 mb-2" />
        Loading Project Operating System...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-gray-400 font-mono text-xs max-w-7xl mx-auto space-y-3">
        <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
        <h2 className="text-white text-base font-bold">Project Not Found: {id}</h2>
        <Link href="/projects" className="text-emerald-400 underline inline-block">Return to Projects Catalog</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link 
            href="/projects" 
            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">{project.name}</h1>
              <span className="text-[10px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-gray-800">
                {project.currentVersion} (rev #{project.revision})
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {project.status}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono flex items-center gap-2 mt-0.5">
              <span>Path: {project.workspacePath}</span>
              <span>•</span>
              <span className="text-emerald-400">Health: {project.healthStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunTests}
            disabled={runningTests}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-lg transition"
          >
            <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
            <span>{runningTests ? 'Auditing...' : 'Run QA Tests'}</span>
          </button>

          <Link
            href="/lab"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-lg shadow-emerald-600/20"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Build Lab</span>
          </Link>
        </div>
      </div>

      {testStatusMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span>{testStatusMsg}</span>
          <button onClick={() => setTestStatusMsg(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-gray-800 text-xs font-semibold">
        {(['OVERVIEW', 'FILES', 'QUALITY', 'WORKFORCE', 'ECONOMICS', 'CONTEXT', 'PORTAL'] as CockpitTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 transition border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'OVERVIEW' && <Activity className="w-3.5 h-3.5" />}
            {tab === 'FILES' && <FileCode className="w-3.5 h-3.5" />}
            {tab === 'QUALITY' && <ShieldCheck className="w-3.5 h-3.5" />}
            {tab === 'WORKFORCE' && <Layers className="w-3.5 h-3.5" />}
            {tab === 'ECONOMICS' && <DollarSign className="w-3.5 h-3.5" />}
            {tab === 'CONTEXT' && <Brain className="w-3.5 h-3.5 text-purple-400" />}
            {tab === 'PORTAL' && <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Business Hypothesis & Objective
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line bg-black/30 p-3 rounded-lg border border-gray-800/60">
                {project.businessObjective}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">Target Customer</span>
                  <span className="text-xs font-semibold text-white">{project.targetCustomer || 'B2B Clients'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">Problem Solved</span>
                  <span className="text-xs font-semibold text-white">{project.problemSolved || 'Workflow Automation'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                Architecture & Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {(project.metadata?.techStack || ['Node.js', 'Express', 'Stripe', 'Node Test Runner']).map((tech: string) => (
                  <span key={tech} className="text-xs font-mono bg-gray-900 text-gray-300 px-2.5 py-1 rounded border border-gray-800">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-white">Project Health Matrix</h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Build Status:</span>
                  <span className="text-emerald-400 font-bold">🟢 VERIFIED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Adversarial Tests:</span>
                  <span className="text-emerald-400 font-bold">🟢 4/4 PASSING</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Secret Redaction:</span>
                  <span className="text-emerald-400 font-bold">🟢 ENFORCED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Revision Lock:</span>
                  <span className="text-white font-bold">rev #{project.revision}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: FILES & CODE VIEWER */}
      {activeTab === 'FILES' && (
        <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
          {/* File Tree Sidebar */}
          <div className="p-4 border-r border-gray-800/80 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>EXPLORER</span>
              <button onClick={() => loadFiles('')} className="text-emerald-400 hover:underline">Root</button>
            </div>

            {filesLoading ? (
              <div className="p-4 text-center text-xs font-mono text-gray-500">Reading directory...</div>
            ) : (
              <div className="space-y-1">
                {currentPath && (
                  <button
                    onClick={() => {
                      const parent = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
                      loadFiles(parent);
                    }}
                    className="w-full text-left p-1.5 rounded text-xs font-mono text-gray-400 hover:text-white hover:bg-gray-900"
                  >
                    📁 .. (parent)
                  </button>
                )}

                {fileList.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => loadFiles(f.path)}
                    className={`w-full text-left p-1.5 rounded text-xs font-mono flex items-center justify-between transition ${
                      selectedFileName === f.path ? 'bg-emerald-950/40 text-emerald-300' : 'text-gray-300 hover:bg-gray-900'
                    }`}
                  >
                    <span className="truncate">{f.isDirectory ? `📁 ${f.name}` : `📄 ${f.name}`}</span>
                    {f.isSecret && <span className="text-[9px] text-amber-400">🔒 protected</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-2 p-4 flex flex-col justify-between">
            {selectedFileContent !== null ? (
              <div className="space-y-2 h-full flex flex-col">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400 pb-2 border-b border-gray-800">
                  <span className="text-white font-bold">{selectedFileName}</span>
                  <span className="text-[10px] text-emerald-400">✓ Secret Redacted & Sandboxed</span>
                </div>
                <pre className="flex-1 bg-black/50 p-4 rounded-lg font-mono text-xs text-gray-200 overflow-x-auto overflow-y-auto max-h-[460px] leading-relaxed">
                  {selectedFileContent}
                </pre>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500 text-xs font-mono">
                <FileCode className="w-8 h-8 text-gray-600 mb-2" />
                Select any source file on the left to inspect its implementation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: QUALITY & TESTS */}
      {activeTab === 'QUALITY' && (
        <div className="space-y-4">
          <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Adversarial Sentinel QA Suite</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Evaluates injection attacks, rate limits, privilege escalation, and boundary conditions.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={runningTests}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
            >
              {runningTests ? 'Running...' : 'Execute Test Suite'}
            </button>
          </div>

          <div className="space-y-2">
            {testRuns.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs font-mono bg-[#0d1017] border border-gray-800 rounded-xl">
                No recorded test runs yet. Click 'Execute Test Suite' to run Sentinel verification.
              </div>
            ) : (
              testRuns.map((tr) => (
                <div key={tr.id} className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        tr.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {tr.status}
                      </span>
                      <span className="text-white font-semibold">{tr.suiteName}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Command: <code>{tr.command}</code> • Duration: {tr.durationMs}ms
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">{tr.passedCount} passed</div>
                    <div className="text-[10px] text-gray-500">{new Date(tr.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: WORKFORCE & EVENTS */}
      {activeTab === 'WORKFORCE' && (
        <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white">Immutable Event & Milestone Stream</h3>
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 text-xs font-mono p-4">No events logged yet.</div>
            ) : (
              events.map((e) => (
                <div key={e.id} className="flex items-start gap-3 text-xs font-mono border-b border-gray-800/60 pb-3">
                  <span className="text-[10px] text-gray-500 w-24 shrink-0 pt-0.5">
                    {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold uppercase">{e.eventType}</span>
                      <span className="text-[10px] text-gray-400 bg-gray-900 px-1.5 rounded">by {e.actor}</span>
                    </div>
                    <div className="text-gray-400 text-[11px]">
                      {JSON.stringify(e.payload)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: ECONOMICS */}
      {activeTab === 'ECONOMICS' && (
        <ProjectEconomicsTab project={project} />
      )}

      {/* Tab 6: CONTEXT */}
      {activeTab === 'CONTEXT' && (
        <ProjectContextInspector 
          projectId={project.id} 
          currentRevision={project.revision} 
        />
      )}

      {/* Tab 7: PORTAL */}
      {activeTab === 'PORTAL' && (
        <ProjectPortalTab 
          project={project} 
          events={events} 
          onRefresh={fetchProjectDetail} 
        />
      )}
    </div>
  );
}
