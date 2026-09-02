import React from 'react';
import { FolderGit2, PlusCircle, Shield, CheckCircle2, Lock } from 'lucide-react';

export default function WorkspacesPage() {
  const workspaces = [
    {
      id: 'ws-agent-workspace',
      name: 'Gideon AI HQ Core Workspace',
      machine: 'GIDMACHINE_WIN',
      path: 'C:\\Users\\DELL\\agent-workspace',
      accessMode: 'READ_WRITE',
      status: 'READY',
      branch: 'main',
      allowedAgents: ['Forge', 'Sentinel', 'Atlas'],
    },
    {
      id: 'ws-stemi-ai',
      name: 'Stemi AI Repository',
      machine: 'GIDMACHINE_WIN',
      path: 'C:\\Users\\DELL\\projects\\stemi',
      accessMode: 'READ_WRITE',
      status: 'READY',
      branch: 'main',
      allowedAgents: ['Forge', 'Sentinel'],
    },
    {
      id: 'ws-yt-automation-ref',
      name: 'YouTube Automation (Reference Only)',
      machine: 'GIDMACHINE_WIN',
      path: 'C:\\Users\\DELL\\yt-automation',
      accessMode: 'READ_ONLY',
      status: 'READY',
      branch: 'main',
      allowedAgents: ['Forge', 'Sentinel', 'Atlas'],
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20">
          <PlusCircle className="w-4 h-4" />
          Register Workspace
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((ws) => (
          <div key={ws.id} className="bg-card border border-card-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-gray-400">{ws.id}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                    ws.accessMode === 'READ_WRITE'
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-warning/10 text-warning border border-warning/20'
                  }`}
                >
                  {ws.accessMode}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mb-1">{ws.name}</h3>
              <p className="text-xs font-mono text-gray-400 break-all mb-4 bg-[#090a0f] p-2 rounded border border-card-border">
                {ws.path}
              </p>

              <div className="space-y-1.5 text-xs text-gray-400">
                <div>Machine: <strong className="text-gray-300">{ws.machine}</strong></div>
                <div>Default Branch: <strong className="text-gray-300">{ws.branch}</strong></div>
                <div>Authorized Agents: <strong className="text-accent">{ws.allowedAgents.join(', ')}</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-card-border flex items-center justify-between text-xs">
              <span className="text-success flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sandbox Verified
              </span>
              <button className="text-gray-400 hover:text-white font-bold">Configure</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
