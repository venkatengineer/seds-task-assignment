'use client';

import React from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { DevRoleSwitcher } from './role-switcher';
import { NotificationsDropdown } from './notifications-dropdown';
import { Search, Plus, Menu } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenCreateTask?: () => void;
  onToggleMobileSidebar: () => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenCommandPalette,
  onOpenCreateTask,
  onToggleMobileSidebar,
  breadcrumbs = [{ label: 'SEDS REC', href: '/dashboard' }],
}) => {
  const { currentUser } = useApp();
  const canCreate = Permissions.isTeamLead(currentUser) || Permissions.isOfficeBearer(currentUser);

  return (
    <header className="h-16 border-b border-[#1b2033] bg-[#090b12]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-600">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-indigo-300 transition-colors text-slate-300 font-medium truncate max-w-[140px] sm:max-w-xs"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-100 font-semibold truncate max-w-[140px] sm:max-w-xs">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Actions, Search, Notifications, Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl K
          </kbd>
        </button>

        {/* Create Task Button (Permitted for Leads & Office Bearers) */}
        {canCreate && onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shadow-indigo-950 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Dev Role Switcher */}
        <DevRoleSwitcher />
      </div>
    </header>
  );
};
