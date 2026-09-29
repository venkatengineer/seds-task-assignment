'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/app-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { CommandPalette } from './command-palette';
import { TaskCreateModal } from '@/components/tasks/task-create-modal';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { Orbit, Loader2, ShieldAlert, LogOut } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  breadcrumbs,
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isSuspended, signOut } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading State (Prevents UI flash)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-black border border-gray-800 text-white flex items-center justify-center shadow-md overflow-hidden p-1.5 animate-pulse">
            <img src="/logo.png" alt="SEDS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-gray-900">SEDS REC</h2>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5 mt-1">
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              <span>Verifying session credentials...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Suspended Account State
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Account Suspended</h1>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Your SEDS account has been suspended. Please contact an administrator.
          </p>
          <div className="mt-6">
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated Fallback (while redirect is executing)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#171717] flex">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        <Topbar
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          breadcrumbs={breadcrumbs}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTask={(id) => setSelectedTaskId(id)}
      />

      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
};
