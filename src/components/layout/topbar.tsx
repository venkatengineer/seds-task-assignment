'use client';

import React from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { DevRoleSwitcher } from './role-switcher';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { Search, Plus, Menu, ChevronRight } from 'lucide-react';
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
    <header className="h-14 border-b border-gray-200 bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-1.5 text-xs text-gray-500">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-blue-600 transition-colors font-medium truncate max-w-[140px] sm:max-w-xs"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-semibold truncate max-w-[140px] sm:max-w-xs">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search, Create Task, Notification Center, Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-800 text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-white text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Create Task Button (Permitted for Leads & Office Bearers) */}
        {canCreate && onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}

        {/* Dual-Channel Notification Center */}
        <NotificationCenter />

        {/* Dev Role Switcher */}
        <DevRoleSwitcher />
      </div>
    </header>
  );
};
