import React from 'react';
import { FlaskConical, Play, Sparkles, Sliders, Shield } from 'lucide-react';

export default function AgentLabPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-accent" />
            Agent Lab & Sandbox Creator
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Prompt-engineer, configure skills, and sandbox-test custom digital employees before deployment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Configuration Form */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Sliders className="w-4 h-4 text-primary-500" />
            Employee Persona & Instructions
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Agent Name & Emoji</label>
              <input
                type="text"
                defaultValue="Tailor 📝"
                className="w-full bg-[#090a0f] border border-card-border rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Role Title & Department</label>
              <input
                type="text"
                defaultValue="Resume & Opportunity Specialist (Career HQ)"
                className="w-full bg-[#090a0f] border border-card-border rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">System Instructions</label>
              <textarea
                rows={5}
                defaultValue="You are Tailor, Career Specialist for Gideon AI HQ. Your mission is to analyze job listings and tailor Gideon's portfolio and cover letters."
                className="w-full bg-[#090a0f] border border-card-border rounded-lg p-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Sandbox Test Console */}
        <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-warning" />
              Isolated Sandbox Run
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Test how the agent formulates plans without touching real workspace files.
            </p>

            <div className="bg-[#090a0f] border border-card-border rounded-lg p-3 text-xs font-mono text-gray-400 h-48 overflow-y-auto">
              [Sandbox Ready] Enter a test goal and click Simulate Plan...
            </div>
          </div>

          <button className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all">
            <Play className="w-3.5 h-3.5" />
            Simulate Execution Plan
          </button>
        </div>
      </div>
    </div>
  );
}
