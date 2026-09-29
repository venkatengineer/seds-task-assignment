'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  LayoutDashboard, CheckSquare, Flag, 
  Users, BarChart3, MessageSquare, 
  Orbit, ChevronRight, Compass, Shield, LogOut, KeyRound
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/ui/badges';
import { ChangePasswordModal } from '@/components/profile/change-password-modal';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { currentUser, teams, openTasks, openTaskInterests, signOut } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isAdmin = Permissions.isAdmin(currentUser);
  const canManageAdmin = Permissions.canManageUsers(currentUser);
  const userTeam = teams.find(t => t.id === currentUser.team_id);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  const pendingInterestsCount = React.useMemo(() => {
    if (isAdmin) return 0;
    if (currentUser.role === 'TEAM_MEMBER') {
      return openTasks.filter(t => t.open_task_status === 'PUBLISHED').length;
    }
    const myTeamTaskIds = openTasks.map(t => t.id);
    return openTaskInterests.filter(i => myTeamTaskIds.includes(i.task_id) && i.status === 'INTERESTED').length;
  }, [currentUser, isAdmin, openTasks, openTaskInterests]);

  const navItems = [
    // Admin navigation item
    ...(canManageAdmin ? [{
      name: 'Admin Panel',
      href: '/admin',
      icon: Shield,
      roles: ['ADMIN', 'OFFICE_BEARER'],
    }] : []),
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
      name: 'Open Tasks',
      href: '/open-tasks',
      icon: Compass,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER'],
      badge: pendingInterestsCount > 0 ? pendingInterestsCount : undefined,
      badgeColor: currentUser.role === 'TEAM_MEMBER' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200',
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
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER', 'ADMIN'],
    },
    {
      name: 'Communication',
      href: '/communication',
      icon: MessageSquare,
      roles: ['OFFICE_BEARER', 'TEAM_LEAD', 'TEAM_MEMBER', 'ADMIN'],
    },
  ];

  // Filter based on user role
  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center gap-3 px-4 border-b border-gray-100 bg-white">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-black border border-gray-800 shadow-xs shrink-0">
            <img src="/logo.png" alt="SEDS Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 tracking-tight text-xs">SEDS REC</span>
              <span className="text-[10px] font-mono uppercase bg-gray-100 text-gray-600 border border-gray-200 px-1 rounded-sm">OS</span>
            </div>
            <p className="text-[10px] text-gray-500 truncate">Sprint & Team Platform</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          {/* Main Navigation */}
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Workspace
            </div>
            <nav className="space-y-0.5">
              {allowedNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors group',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge !== undefined && (
                      <span className={cn(
                        'text-[10px] font-mono px-1.5 py-0.2 rounded-full border',
                        item.badgeColor || 'bg-blue-50 text-blue-700 border-blue-200'
                      )}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Teams Directory (Only if not Admin) */}
          {!isAdmin && (
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>{isOfficeBearer ? 'All Teams' : 'Teams'}</span>
                <span className="text-[10px] text-gray-400 font-mono">{teams.length}</span>
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
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors group',
                        isSelected 
                          ? 'text-gray-900 bg-gray-100 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: t.color || '#2563EB' }}
                      />
                      <span className="truncate flex-1">{t.name}</span>
                      {isSelected && (
                        <span className="text-[9px] font-medium bg-gray-200 text-gray-700 px-1 rounded-sm">
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
                    className="block px-2.5 py-1 text-[11px] text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    +{teams.length - 5} more teams...
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Profile Section */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <div className="p-2 rounded-lg bg-white border border-gray-200 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <UserAvatar user={currentUser} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-900 truncate">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {userTeam ? userTeam.name : (isAdmin ? 'Administration' : 'Organization-Wide')}
                </div>
                <div className="mt-1">
                  <RoleBadge role={currentUser.role} size="sm" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                title="Change Password"
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out"
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};
