'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  LayoutDashboard, CheckSquare, Flag, 
  Users, BarChart3, MessageSquare, 
  Orbit, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/badges';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { currentUser, teams } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const userTeam = teams.find(t => t.id === currentUser.team_id);

  const navItems = [
    {
      name: isOfficeBearer ? 'Command Center' : 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
    },
    {
      name: isOfficeBearer ? 'All Tasks' : 'My Tasks',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
    },
    {
      name: 'Sprint Planning',
      href: '/sprints',
      icon: Flag,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
    },
    {
      name: isOfficeBearer ? 'All Teams' : 'My Team',
      href: '/teams',
      icon: Users,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
    },
    {
      name: 'Communication',
      href: '/communication',
      icon: MessageSquare,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0c13] border-r border-[#191e30] flex flex-col transition-transform duration-200 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[#181d2f] bg-[#0c0e17]">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-400/40">
            <Orbit className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wider text-sm">SEDS REC</span>
              <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-1 rounded">OS</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">Team Sprint Platform</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              COMMAND CENTER
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-indigo-600/15 text-white border border-indigo-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                    )}
                  >
                    <Icon className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                    )} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Teams Directory / Project Quick List */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span>{isOfficeBearer ? 'ALL TEAMS' : 'TEAMS'}</span>
              <span className="font-mono text-[9px] bg-slate-900 px-1 rounded text-slate-400">{teams.length}</span>
            </div>
            <div className="space-y-0.5">
              {teams.slice(0, 5).map((t) => {
                const isSelected = userTeam?.id === t.id;
                return (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors group',
                      isSelected 
                        ? 'text-indigo-200 bg-indigo-950/40 border border-indigo-800/40' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    )}
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="truncate flex-1">{t.name}</span>
                    {isSelected && (
                      <span className="text-[9px] font-mono uppercase bg-indigo-900/80 text-indigo-300 px-1 rounded">
                        You
                      </span>
                    )}
                  </Link>
                );
              })}
              {teams.length > 5 && (
                <Link
                  href="/teams"
                  onClick={onCloseMobile}
                  className="block px-3 py-1 text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  +{teams.length - 5} more teams...
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-[#181d2f] bg-[#0c0e17]">
          <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-center gap-3">
            <UserAvatar user={currentUser} size="md" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-white truncate">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {userTeam ? userTeam.name : 'Organization-Wide'}
              </div>
              <div className="mt-1">
                <RoleBadge role={currentUser.role} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
