'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nq-bg-primary flex flex-col">
      <Sidebar />
      <div className="md:ml-[260px] transition-all duration-300 flex flex-col flex-1 min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col p-4 md:p-6 pb-20 md:pb-6 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
