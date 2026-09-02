import React from 'react';
import Link from 'next/link';
import { Users, PlusCircle, Wrench, Shield, ArrowUpRight } from 'lucide-react';

export default function AgentsPage() {
  const agents = [
    {
      id: 'forge',
      name: 'Forge',
      avatar: '🔨',
      role: 'Senior Software Engineer',
      department: 'Development',
      description: 'Full-stack software engineer specializing in Next.js 15, TypeScript 5, Tailwind CSS, API architecture, and Supabase.',
      model: 'gemini-2.0-flash',
      status: 'WORKING',
      tasksCompleted: 42,
      successRate: '94%',
    },
    {
      id: 'sentinel',
      name: 'Sentinel',
      avatar: '🛡️',
      role: 'QA & Reliability Engineer',
      department: 'QA',
      description: 'Staff QA engineer performing independent code reviews, boundary tests, regression detection, and build verification.',
      model: 'gemini-2.0-flash',
      status: 'WAITING_APPROVAL',
      tasksCompleted: 38,
      successRate: '98%',
    },
    {
      id: 'atlas',
      name: 'Atlas',
      avatar: '🧠',
      role: 'Chief of Staff & Orchestrator',
      department: 'Management',
      description: 'Workforce coordinator managing task DAGs, routing goals between Forge & Sentinel, and synthesizing executive summaries.',
      model: 'gemini-2.0-flash',
      status: 'IDLE',
      tasksCompleted: 15,
      successRate: '100%',
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Digital Employee Directory
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Active autonomous agent roster with specialized domain proficiencies and tool capabilities.
          </p>
        </div>

        <Link
          href="/lab"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Employee
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-card border border-card-border rounded-xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2 rounded-xl bg-[#090a0f] border border-card-border">{agent.avatar}</span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded font-bold font-mono ${
                    agent.status === 'WORKING'
                      ? 'bg-success/10 text-success border border-success/20'
                      : agent.status === 'WAITING_APPROVAL'
                      ? 'bg-warning/10 text-warning border border-warning/20'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-0.5">{agent.name}</h3>
              <div className="text-xs font-mono text-primary-400 mb-3">{agent.role}</div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">{agent.description}</p>

              <div className="p-3 bg-[#090a0f] border border-card-border rounded-lg text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Model:</span>
                  <span className="text-gray-300 font-bold">{agent.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="text-accent">{agent.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Success Rate:</span>
                  <span className="text-success font-bold">{agent.successRate}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-card-border flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">{agent.tasksCompleted} tasks completed</span>
              <button className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1">
                Profile <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
