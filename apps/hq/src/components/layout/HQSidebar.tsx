'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  ShieldCheck,
  FolderGit2,
  HardDrive,
  BrainCircuit,
  BookOpen,
  Activity,
  FlaskConical,
  Radio,
  Power
} from 'lucide-react';

const navItems = [
  { name: 'Command Center', href: '/', icon: LayoutDashboard },
  { name: 'Tasks & Missions', href: '/tasks', icon: CheckSquare },
  { name: 'Approvals', href: '/approvals', icon: ShieldCheck, badge: 'Active' },
  { name: 'Digital Workforce', href: '/agents', icon: Users },
  { name: 'Workspaces', href: '/workspaces', icon: FolderGit2 },
  { name: 'Machines & Runner', href: '/machines', icon: HardDrive },
  { name: 'Memory Vault', href: '/memory', icon: BrainCircuit },
  { name: 'Playbooks', href: '/playbooks', icon: BookOpen },
  { name: 'Audit & Activity', href: '/activity', icon: Activity },
  { name: 'Agent Lab', href: '/lab', icon: FlaskConical },
];

export function HQSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-card-border flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-card-border gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-600/30">
            G
          </div>
          <div>
            <div className="font-bold tracking-tight text-white flex items-center gap-2">
              GIDEON AI HQ
            </div>
            <div className="text-[10px] text-gray-400 font-mono">WORKFORCE OS V3</div>
          </div>
        </div>

        {/* Live Runner Status Pill */}
        <div className="mx-4 my-4 p-2.5 rounded-lg bg-[#0d0f15] border border-card-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-gray-200">GIDMACHINE</span>
          </div>
          <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded font-mono font-bold">
            ONLINE
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-500 border border-primary-500/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                  {item.name}
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.2 rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Emergency Kill Switch Button */}
      <div className="p-4 border-t border-card-border">
        <button
          onClick={() => {
            if (confirm('🚨 ACTIVATE UNIVERSAL KILL SWITCH?\nThis will immediately terminate all active agent operations on GIDMACHINE.')) {
              fetch('/api/killswitch', { method: 'POST' });
              alert('Emergency Kill Switch signal broadcasted.');
            }
          }}
          className="w-full py-2 px-3 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-danger/10"
        >
          <Power className="w-3.5 h-3.5" />
          UNIVERSAL KILL SWITCH
        </button>
      </div>
    </aside>
  );
}
