import React from 'react';
import Link from 'next/link';
import { CheckSquare, PlusCircle, Filter, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';

export default function TasksPage() {
  const tasks = [
    {
      id: 'task-104',
      title: 'Audit TypeScript Strictness & Verify Build',
      goal: 'Identify type errors in registered workspace and verify production build.',
      agent: '🔨 Forge',
      workspace: 'ws-agent-workspace',
      status: 'WAITING_APPROVAL',
      priority: 'HIGH',
      createdAt: '10 mins ago',
      progress: 66,
    },
    {
      id: 'task-103',
      title: 'Inspect Package Dependencies & Check Vulnerabilities',
      goal: 'Audit package.json and generate dependency health scorecard.',
      agent: '🛡️ Sentinel',
      workspace: 'ws-agent-workspace',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      createdAt: '2 hours ago',
      progress: 100,
    },
    {
      id: 'task-102',
      title: 'Scaffold Next.js 15 App Router Layout & Components',
      goal: 'Implement modular layout components with Tailwind CSS styling.',
      agent: '🔨 Forge',
      workspace: 'ws-agent-workspace',
      status: 'COMPLETED',
      priority: 'HIGH',
      createdAt: '4 hours ago',
      progress: 100,
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-500" />
            Task Management & Mission Dispatcher
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create, monitor, and inspect autonomous task runs across registered workspaces.
          </p>
        </div>

        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20">
          <PlusCircle className="w-4 h-4" />
          Create New Task
        </button>
      </div>

      {/* Task List Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between text-xs text-gray-400">
          <span>Showing 3 tasks</span>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by status, agent, or workspace</span>
          </div>
        </div>

        <div className="divide-y divide-card-border">
          {tasks.map((task) => (
            <div key={task.id} className="p-5 hover:bg-white/[0.02] transition-all flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-gray-400">{task.id}</span>
                  <h3 className="text-sm font-bold text-white hover:text-primary-400 transition-colors">
                    <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                      task.status === 'COMPLETED'
                        ? 'bg-success/10 text-success border border-success/20'
                        : task.status === 'WAITING_APPROVAL'
                        ? 'bg-warning/10 text-warning border border-warning/20'
                        : 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{task.goal}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500">
                  <span>Agent: <strong className="text-gray-300">{task.agent}</strong></span>
                  <span>Workspace: <strong className="text-gray-300">{task.workspace}</strong></span>
                  <span>Priority: <strong className="text-gray-300">{task.priority}</strong></span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.createdAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href={`/tasks/${task.id}`}
                  className="p-2 bg-card-border/50 hover:bg-card-border rounded-lg text-gray-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                >
                  Inspect <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
