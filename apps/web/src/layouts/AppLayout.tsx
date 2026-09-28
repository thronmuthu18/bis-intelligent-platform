import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopHeader } from '@/components/layout/TopHeader';

// ─────────────────────────────────────────────────────────────────────────────
//  AppLayout — Main Authenticated Application Shell
//  Fixed/Collapsible Sidebar + Top Header + Scrollable Content Area.
// ─────────────────────────────────────────────────────────────────────────────

export function AppLayout(): React.ReactElement {
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-surface-page text-text-primary">
          {/* ── Sidebar ── */}
          <Sidebar />

          {/* ── Main Layout Column ── */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            {/* Top Navigation Bar */}
            <TopHeader />

            {/* Scrollable Page Body */}
            <main className="flex-1 overflow-y-auto bg-surface-page p-4 md:p-6 lg:p-8 scrollbar-thin">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}
