'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Users,
  ShieldCheck,
  FolderGit2,
  HardDrive,
  BrainCircuit,
  BookOpen,
  Activity,
  FlaskConical,
  Mail,
  Coins,
  Radar,
  Package,
  Sparkles,
  Zap,
  Globe,
  Terminal,
  Cpu,
  BookmarkCheck,
  Radio,
  FileBadge,
  GitBranch
} from 'lucide-react';

interface NavSection {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
  }>;
}

const navSections: NavSection[] = [
  {
    title: 'AUTONOMOUS WORKSPACE',
    items: [
      { name: 'AI Workspace', href: '/workspace', icon: Terminal, badge: 'Studio', badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40' },
      { name: '3 Core Loops', href: '/loops', icon: Zap, badge: 'Flywheel', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      { name: 'Workforce Hub', href: '/workforce', icon: Users, badge: 'Agents', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
      { name: 'Context Console', href: '/context', icon: BrainCircuit, badge: 'Facts' },
      { name: 'Sentinel Observer', href: '/sentinel', icon: ShieldCheck, badge: '9-Dim', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    ]
  },
  {
    title: 'ENGINEERING & SHOWCASE',
    items: [
      { name: 'Showcase Hub', href: '/showcase', icon: Sparkles, badge: '⚡ Loop', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
      { name: 'Projects OS', href: '/projects', icon: Package },
      { name: 'Releases OS', href: '/releases', icon: GitBranch, badge: 'Gate B' },
      { name: 'Build Lab', href: '/lab', icon: FlaskConical },
    ]
  },
  {
    title: 'BUSINESS & REVENUE',
    items: [
      { name: 'Opportunity Radar', href: '/opportunities', icon: Radar },
      { name: 'Communications', href: '/communications', icon: Mail, badge: '6.5' },
      { name: 'Money & Ledger', href: '/ledger', icon: Coins },
      { name: 'Profile & Brand OS', href: '/profile', icon: FileBadge },
    ]
  },
  {
    title: 'GOVERNANCE & INFRA',
    items: [
      { name: 'Command Center', href: '/overview', icon: LayoutDashboard },
      { name: 'Approval Center', href: '/approvals', icon: ShieldCheck, badge: 'Gates', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
      { name: 'Tasks & Missions', href: '/tasks', icon: CheckSquare },
      { name: 'Audit & Activity Spine', href: '/activity', icon: Activity },
    ]
  }
];

export function HQSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 glass-panel border-r border-white/[0.07] flex flex-col justify-between shrink-0 min-h-screen z-20">
      <div className="overflow-y-auto max-h-[calc(100vh-5rem)]">
        {/* Brand Header with Official Emblem */}
        <Link href="/workspace" className="h-16 flex items-center px-5 border-b border-white/[0.07] gap-3 hover:bg-white/[0.02] transition">
          <div className="w-9 h-9 rounded-xl bg-black border border-red-500/40 flex items-center justify-center p-1.5 shadow-glow-primary shrink-0">
            {/* Embedded Official Dual Chevron SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              <polygon points="50,15 80,45 65,45 50,30 35,45 20,45" fill="#DC2626" />
              <polygon points="50,45 80,75 65,75 50,60 35,75 20,75" fill="#EF4444" />
            </svg>
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-white flex items-center gap-1.5 text-sm">
              GIDEON AI HQ
            </div>
            <div className="text-[10px] text-red-400 font-mono tracking-wider font-bold">
              ENGINEERING OS V5.2
            </div>
          </div>
        </Link>

        {/* Live Runner Status Pill */}
        <div className="mx-4 my-3 p-2.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-xs font-semibold text-gray-200">GIDEON SPUR</span>
          </div>
          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
            OPERATING
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="px-3 pb-4 space-y-4">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-gray-500">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600/20 via-red-600/10 to-transparent text-white border-l-2 border-red-500 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-red-400' : 'text-gray-400 group-hover:text-gray-200'}`} />
                      <span className="font-medium tracking-tight">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono border ${
                        item.badgeColor || 'bg-white/5 text-gray-400 border-white/10'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Profile Info */}
      <div className="p-3 border-t border-white/[0.07] bg-black/40">
        <Link href="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition">
          <div className="w-8 h-8 rounded-full bg-red-950 border border-red-500/40 flex items-center justify-center font-bold text-xs text-red-200">
            GB
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">Gideon Bawa</div>
            <div className="text-[10px] text-gray-400 font-mono truncate">Lead Architect</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
