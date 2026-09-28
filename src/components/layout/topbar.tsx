'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { UserAvatar } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/badges';
import { Search, Plus, Menu, ChevronRight, LogOut, Shield, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { ChangePasswordModal } from '@/components/profile/change-password-modal';

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
  const { currentUser, signOut } = useApp();
  const canCreate = Permissions.isTeamLead(currentUser) || Permissions.isOfficeBearer(currentUser);
  const isAdmin = Permissions.isAdmin(currentUser);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

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

      {/* Right: Search, Create Task, Notification Center, User Profile Menu */}
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

        {/* Real User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="User Profile"
          >
            <UserAvatar user={currentUser} size="sm" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-98 duration-100 p-1">
              <div className="p-3 border-b border-gray-100">
                <div className="font-semibold text-xs text-gray-900 truncate">
                  {currentUser.full_name}
                </div>
                <div className="text-[11px] text-gray-500 font-mono truncate">
                  {currentUser.email}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <RoleBadge role={currentUser.role} size="sm" />
                </div>
              </div>

              <div className="p-1 space-y-0.5">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  >
                    <Shield className="w-3.5 h-3.5 text-gray-500" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};
