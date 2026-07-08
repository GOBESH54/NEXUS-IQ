'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, Factory, ChevronDown, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const [role, setRole] = useState('Plant Engineer');
  const [plant, setPlant] = useState('Bharat Steel Limited — Unit 1');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('nexusiq_role');
    const storedPlant = localStorage.getItem('nexusiq_plant');
    if (storedRole) setRole(storedRole);
    if (storedPlant) setPlant(storedPlant);
  }, []);

  const notifications = [
    { id: 1, text: 'BF-C-03 vibration alert — exceeds threshold', time: '15m ago', critical: true },
    { id: 2, text: 'PESO compliance report processing complete', time: '1h ago', critical: false },
    { id: 3, text: 'CK-HE-04 maintenance 60% complete', time: '2h ago', critical: false },
    { id: 4, text: 'Safety valve calibration overdue — BF-V-11', time: '6h ago', critical: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-nq-bg-primary/80 backdrop-blur-xl border-b border-nq-border">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Left: Plant info */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-nq-text-secondary">
            <Factory size={16} className="text-nq-accent-cyan" />
            <span className="text-sm font-medium">{plant}</span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nq-text-muted" />
            <input
              type="text"
              placeholder="Search equipment, documents, incidents..."
              className="w-full pl-10 pr-4 py-2 bg-nq-bg-secondary border border-nq-border rounded-lg text-sm text-nq-text-primary placeholder-nq-text-muted focus:outline-none focus:ring-2 focus:ring-nq-accent-blue/30 focus:border-nq-accent-blue/50 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-nq-text-muted bg-nq-bg-card px-1.5 py-0.5 rounded border border-nq-border">⌘K</kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <div className="hidden md:block badge-cyan">
            {role}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="relative p-2 rounded-lg text-nq-text-secondary hover:text-nq-text-primary hover:bg-nq-bg-card transition-all"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-nq-accent-red rounded-full animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-nq-bg-card border border-nq-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-nq-border">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 border-b border-nq-border/50 hover:bg-nq-bg-card-hover transition-colors cursor-pointer">
                      <div className="flex items-start gap-2">
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.critical ? 'bg-nq-accent-red' : 'bg-nq-accent-blue')} />
                        <div>
                          <p className="text-sm text-nq-text-primary">{n.text}</p>
                          <p className="text-xs text-nq-text-muted mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-nq-border">
                  <button className="text-xs text-nq-accent-blue hover:text-nq-accent-cyan transition-colors">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-nq-bg-card transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <ChevronDown size={14} className="text-nq-text-muted hidden md:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-56 bg-nq-bg-card border border-nq-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-nq-border">
                  <p className="text-sm font-semibold">Rajesh Krishnamurthy</p>
                  <p className="text-xs text-nq-text-muted">{role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-nq-text-secondary hover:text-nq-accent-red hover:bg-nq-bg-card-hover transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
