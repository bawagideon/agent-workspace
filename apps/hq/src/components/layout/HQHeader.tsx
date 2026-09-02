'use client';

import React from 'react';
import { Bell, ShieldCheck, Terminal, Search, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function HQHeader() {
  return (
    <header className="h-16 bg-card border-b border-card-border px-8 flex items-center justify-between sticky top-0 z-10">
      {/* Quick Search / Command Palette Hint */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#0d0f15] border border-card-border px-3 py-1.5 rounded-lg text-xs text-gray-400 w-80">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <span>Search tasks, agents, workspaces...</span>
          <kbd className="ml-auto bg-card-border px-1.5 py-0.5 rounded text-[10px] text-gray-400 font-mono">⌘K</kbd>
        </div>
      </div>

      {/* Action Controls & Active Alerts */}
      <div className="flex items-center gap-4">
        <Link
          href="/tasks?new=true"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Dispatch Task
        </Link>

        <div className="h-6 w-[1px] bg-card-border" />

        <Link
          href="/approvals"
          className="relative p-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-300 transition-all"
          title="Approval Queue"
        >
          <ShieldCheck className="w-4 h-4 text-warning" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-warning rounded-full ring-2 ring-card" />
        </Link>

        {/* Profile Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent flex items-center justify-center font-bold text-white text-xs shadow-md">
            GD
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-white leading-tight">Gideon</div>
            <div className="text-[10px] text-gray-400 font-mono">Chief Commander</div>
          </div>
        </div>
      </div>
    </header>
  );
}
