'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Network, FileText,
  Settings as SettingsIcon, ChevronLeft, ChevronRight,
  Shield, BarChart3, Lightbulb, Brain, Zap, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/equipment', label: 'Equipment', icon: SettingsIcon },
  { href: '/compliance', label: 'Compliance', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/tribal-knowledge', label: 'Tribal Knowledge', icon: Lightbulb },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-nq-bg-secondary/95 backdrop-blur-xl border-t border-nq-border md:hidden">
        <div className="flex justify-around items-center py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all',
                  isActive ? 'text-nq-accent-blue' : 'text-nq-text-muted hover:text-nq-text-secondary'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          <Link href="/tribal-knowledge" className="flex flex-col items-center gap-1 px-3 py-1.5 text-nq-text-muted">
            <Menu size={20} />
            <span className="text-[10px]">More</span>
          </Link>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-full bg-nq-bg-secondary/95 backdrop-blur-xl border-r border-nq-border z-40 transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-nq-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-nq-accent-blue/20">
            <Brain size={22} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight text-nq-text-primary whitespace-nowrap">
                NEXUS <span className="text-nq-accent-cyan">IQ</span>
              </h1>
              <p className="text-[10px] text-nq-text-muted tracking-widest uppercase">Industrial Intelligence</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isActive ? 'sidebar-link-active' : 'sidebar-link',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-4 border-t border-nq-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-nq-text-muted hover:text-nq-text-secondary hover:bg-nq-bg-card transition-all w-full"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>

        {/* Status indicator */}
        {!collapsed && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-nq-accent-emerald/5 border border-nq-accent-emerald/10">
              <div className="w-2 h-2 rounded-full bg-nq-accent-emerald animate-pulse" />
              <span className="text-xs text-nq-accent-emerald">System Online</span>
              <Zap size={12} className="text-nq-accent-emerald ml-auto" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
