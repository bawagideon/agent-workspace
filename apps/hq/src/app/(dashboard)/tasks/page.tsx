'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckSquare, 
  PlusCircle, 
  Filter, 
  ArrowUpRight, 
  Clock, 
  ShieldCheck, 
  Search,
  X,
  AlertCircle,
  Play,
  RotateCw
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  goal: string;
  assigned_agent_id: string;
  workspace_id: string;
  status: string;
  priority: string;
  autonomy_mode?: string;
  created_at: string;
  result_summary?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('forge');
  const [workspaceId, setWorkspaceId] = useState('ws-agent-workspace');
  const [priority, setPriority] = useState('HIGH');
  const [autonomyMode, setAutonomyMode] = useState('PLAN_APPROVAL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
    } catch (err: any) {
      console.warn('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim()) {
      setError('Title and Goal are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          goal: goal.trim(),
          assignedAgentId,
          workspaceId,
          priority,
          autonomyMode
        })
      });

      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => [data.task, ...prev]);
        setIsModalOpen(false);
        setTitle('');
        setGoal('');
      } else {
        setError(data.error || 'Failed to dispatch task.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with task API.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = 
      filter === 'ALL' || 
      task.status?.toUpperCase() === filter;

    const matchesSearch = 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.goal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigned_agent_id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

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

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            className="p-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            title="Refresh Tasks"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Task
          </button>
        </div>
      </div>

      {/* Task Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 bg-card border border-card-border p-1 rounded-lg text-xs overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CREATED', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
                filter === f
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, goals, or agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-card-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between text-xs text-gray-400">
          <span>
            {loading ? 'Fetching tasks...' : `Showing ${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'}`}
          </span>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>Filter: <strong className="text-primary-400">{filter}</strong></span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-primary-500" />
            <p className="text-xs">Loading operational tasks from Supabase...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <CheckSquare className="w-10 h-10 text-gray-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No Tasks Match Selection</h3>
              <p className="text-xs text-gray-400">
                {tasks.length === 0 
                  ? 'The task queue is currently empty. Dispatch your first autonomous mission.'
                  : 'No tasks found matching current filter or search criteria.'}
              </p>
            </div>
            {tasks.length === 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Dispatch First Task
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-5 hover:bg-white/[0.02] transition-all flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-gray-400 shrink-0">
                      {task.id.slice(0, 8)}...
                    </span>
                    <h3 className="text-sm font-bold text-white hover:text-primary-400 transition-colors truncate">
                      <Link href={`/tasks/${task.id}`}>{task.title}</Link>
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono shrink-0 ${
                        task.status === 'COMPLETED'
                          ? 'bg-success/10 text-success border border-success/20'
                          : task.status === 'WAITING_APPROVAL'
                          ? 'bg-warning/10 text-warning border border-warning/20'
                          : task.status === 'FAILED'
                          ? 'bg-danger/10 text-danger border border-danger/20'
                          : 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-1">{task.goal}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-gray-500">
                    <span>Agent: <strong className="text-gray-300">{task.assigned_agent_id}</strong></span>
                    <span>Workspace: <strong className="text-gray-300">{task.workspace_id}</strong></span>
                    <span>Priority: <strong className="text-gray-300">{task.priority}</strong></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(task.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-card-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary-500" />
                Dispatch New Autonomous Task
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              {error && (
                <div className="p-2.5 bg-danger/10 border border-danger/30 text-danger rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-gray-300 font-bold">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Audit package.json and update dependencies"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-bold">Mission Goal & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Describe the exact requirements and expected deliverables..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Assigned Agent</label>
                  <select
                    value={assignedAgentId}
                    onChange={(e) => setAssignedAgentId(e.target.value)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  >
                    <option value="forge">🔨 Forge (Developer)</option>
                    <option value="sentinel">🛡️ Sentinel (QA / Security)</option>
                    <option value="atlas">🧠 Atlas (Chief of Staff)</option>
                    <option value="scout">🔭 Scout (Market Scanner)</option>
                    <option value="ledger">⚖️ Ledger (Financial Controller)</option>
                    <option value="release">🚀 Release (Deployment)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Workspace</label>
                  <input
                    type="text"
                    value={workspaceId}
                    onChange={(e) => setWorkspaceId(e.target.value)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Autonomy Mode</label>
                  <select
                    value={autonomyMode}
                    onChange={(e) => setAutonomyMode(e.target.value)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  >
                    <option value="PLAN_APPROVAL">PLAN_APPROVAL (Safe Default)</option>
                    <option value="ALWAYS_ASK">ALWAYS_ASK (Strict Human Check)</option>
                    <option value="AUTO">AUTO (Full Autonomous)</option>
                  </select>
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
                  {submitting ? 'Dispatching...' : 'Dispatch Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
