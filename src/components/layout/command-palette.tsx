'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  Search, CheckSquare, Users, Flag, Sparkles, 
  ArrowRight, Rocket, Radio, Hash, CornerDownLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaskStatusBadge } from '@/components/ui/badges';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (taskId: string) => void;
}

interface CommandItem {
  id: string;
  type: 'page' | 'task' | 'team' | 'sprint' | 'member';
  title: string;
  subtitle?: string;
  path?: string;
  taskId?: string;
  badge?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const router = useRouter();
  const { currentUser, visibleTasks, teams, sprints, allProfiles } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo((): CommandItem[] => {
    if (!query.trim()) {
      // Default quick actions based on role
      const actions: CommandItem[] = [
        { id: 'act-dash', type: 'page', title: 'Go to Command Center Overview', path: '/dashboard', icon: Sparkles },
        { id: 'act-tasks', type: 'page', title: 'View My Tasks & Board', path: '/tasks', icon: CheckSquare },
        { id: 'act-sprint', type: 'page', title: 'Open Active Sprint', path: '/sprints', icon: Flag },
        { id: 'act-comm', type: 'page', title: 'Open Communication & Announcements', path: '/communication', icon: Radio },
        { id: 'act-analytics', type: 'page', title: 'View Analytics & Burndown', path: '/analytics', icon: Hash },
      ];
      if (Permissions.isOfficeBearer(currentUser)) {
        actions.push({ id: 'act-teams', type: 'page', title: 'Manage All Teams', path: '/teams', icon: Rocket });
      }
      return actions;
    }

    const q = query.toLowerCase();
    const results: CommandItem[] = [];

    // Search tasks (strictly filtered to visible tasks)
    visibleTasks.forEach(task => {
      if (task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q)) {
        results.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          subtitle: `${task.team_name} • ${task.story_points} pts`,
          taskId: task.id,
          badge: <TaskStatusBadge status={task.status} size="sm" />,
          icon: CheckSquare,
        });
      }
    });

    // Search teams (if authorized or viewing public team directory)
    teams.forEach(team => {
      if (team.name.toLowerCase().includes(q) || team.description?.toLowerCase().includes(q)) {
        results.push({
          id: `team-${team.id}`,
          type: 'team',
          title: team.name,
          subtitle: team.description || undefined,
          path: `/teams/${team.id}`,
          icon: Rocket,
        });
      }
    });

    // Search sprints
    sprints.forEach(sprint => {
      if (
        (Permissions.isOfficeBearer(currentUser) || sprint.team_id === currentUser.team_id) &&
        (sprint.name.toLowerCase().includes(q) || sprint.goal.toLowerCase().includes(q))
      ) {
        results.push({
          id: `sprint-${sprint.id}`,
          type: 'sprint',
          title: `${sprint.name}: ${sprint.goal}`,
          subtitle: sprint.team_name,
          path: `/sprints`,
          icon: Flag,
        });
      }
    });

    // Search members (if office bearer or team lead)
    if (Permissions.isTeamLead(currentUser)) {
      allProfiles.forEach(p => {
        if (
          (Permissions.isOfficeBearer(currentUser) || p.team_id === currentUser.team_id) &&
          (p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.title?.toLowerCase().includes(q))
        ) {
          results.push({
            id: `member-${p.id}`,
            type: 'member',
            title: p.full_name,
            subtitle: `${p.title || p.role} • ${p.email}`,
            path: `/teams`,
            icon: Users,
          });
        }
      });
    }

    return results.slice(0, 10);
  }, [query, visibleTasks, teams, sprints, allProfiles, currentUser]);

  const handleSelect = (item: any) => {
    onClose();
    if (item.taskId) {
      if (onSelectTask) {
        onSelectTask(item.taskId);
      } else {
        router.push(`/tasks?taskId=${item.taskId}`);
      }
    } else if (item.path) {
      router.push(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#0b0d14] border border-[#23293f] rounded-xl shadow-2xl overflow-hidden z-10 glow-subtle">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1b2034] bg-[#0e101a]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, sprints, teams, or jump to..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/30">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No matching records found for "{query}".
            </div>
          ) : (
            searchResults.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors text-sm text-slate-200 hover:bg-indigo-950/40 hover:border-indigo-800/40 border border-transparent group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-indigo-300 group-hover:border-indigo-600/50 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-slate-200 group-hover:text-white truncate">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-xs text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge}
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom hints */}
        <div className="px-4 py-2 border-t border-[#1b2034] bg-[#0a0c13] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <CornerDownLeft className="w-3 h-3 text-slate-400" /> to select
            </span>
            <span className="font-mono">Role: {currentUser.role}</span>
          </div>
          <span className="text-indigo-400/80 font-mono text-[10px]">SEDS REC Command Palette</span>
        </div>
      </div>
    </div>
  );
};
