'use client';

import React from 'react';
import { useApp } from '@/lib/store/app-context';
import { 
  Flag, ArrowUpRight, Activity, Plus, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badges';
import { formatTimeAgo } from '@/lib/utils';

export const OfficeBearerDashboard: React.FC<{
  onSelectTask?: (taskId: string) => void;
  onCreateTask?: () => void;
}> = ({ onSelectTask, onCreateTask }) => {
  const { teams, sprints, tasks, allProfiles, activityLogs } = useApp();

  // Metrics
  const totalTeams = teams.length;
  const activeMembers = allProfiles.length;
  const activeSprints = sprints.filter(s => s.status === 'ACTIVE');
  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'BACKLOG');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');

  // Overdue calculation (due date < today and not completed)
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-purple-950/80 text-purple-300 border border-purple-800/80">
              EXECUTIVE COMMAND CENTER
            </span>
            <span className="text-xs text-slate-500 font-mono">SEDS REC Space Systems</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            SEDS Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organization-wide telemetry, subsystem sprint progression, and flight readiness metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shadow-indigo-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
          <Link
            href="/sprints"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Flag className="w-4 h-4 text-indigo-400" />
            <span>Manage Sprints</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-3.5 bg-[#0c0e17] border border-[#1d2338] rounded-xl">
          <span className="block text-[11px] font-mono text-slate-400 uppercase">TEAMS</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalTeams}</div>
          <span className="text-[10px] text-slate-400">Subsystems</span>
        </div>

        <div className="p-3.5 bg-[#0c0e17] border border-[#1d2338] rounded-xl">
          <span className="block text-[11px] font-mono text-slate-400 uppercase">MEMBERS</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{activeMembers}</div>
          <span className="text-[10px] text-emerald-400">All registered</span>
        </div>

        <div className="p-3.5 bg-[#0c0e17] border border-[#1d2338] rounded-xl">
          <span className="block text-[11px] font-mono text-slate-400 uppercase">ACTIVE SPRINTS</span>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">{activeSprints.length}</div>
          <span className="text-[10px] text-slate-400">In flight</span>
        </div>

        <div className="p-3.5 bg-[#0c0e17] border border-[#1d2338] rounded-xl">
          <span className="block text-[11px] font-mono text-slate-400 uppercase">ACTIVE TASKS</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{activeTasks.length}</div>
          <span className="text-[10px] text-slate-400">In pipeline</span>
        </div>

        <div className="p-3.5 bg-[#0c0e17] border border-[#1d2338] rounded-xl">
          <span className="block text-[11px] font-mono text-slate-400 uppercase">COMPLETED</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{completedTasks.length}</div>
          <span className="text-[10px] text-emerald-400">Verified</span>
        </div>

        <div className="p-3.5 bg-[#0c0e17] border border-[#1d2338] rounded-xl">
          <span className="block text-[11px] font-mono text-slate-400 uppercase">OVERDUE</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{overdueTasks.length}</div>
          <span className="text-[10px] text-amber-400">Requires review</span>
        </div>

        <div className="p-3.5 bg-[#0c0e17] border border-rose-900/40 rounded-xl bg-rose-950/20">
          <span className="block text-[11px] font-mono text-rose-300 uppercase">BLOCKED</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{blockedTasks.length}</div>
          <span className="text-[10px] text-rose-400">Critical attention</span>
        </div>
      </div>

      {/* Section 9: Organization Sprint Health */}
      <div className="bg-[#0b0e17] border border-[#1e2439] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2135] mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Organization Sprint Health</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational visibility across all subsystems. Teams are observed collaboratively, not ranked competitively.
            </p>
          </div>
          <Link
            href="/teams"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
          >
            <span>Drill down teams</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Matrix of Teams */}
        <div className="space-y-4">
          {teams.map(team => {
            const teamTasks = tasks.filter(t => t.team_id === team.id);
            const teamSprint = sprints.find(s => s.team_id === team.id && s.status === 'ACTIVE') || sprints.find(s => s.team_id === team.id);
            const sprintTasks = teamSprint ? teamTasks.filter(t => t.sprint_id === teamSprint.id) : teamTasks;
            
            const completed = sprintTasks.filter(t => t.status === 'COMPLETED').length;
            const blocked = sprintTasks.filter(t => t.status === 'BLOCKED').length;
            const remaining = sprintTasks.filter(t => t.status !== 'COMPLETED').length;
            const overdue = sprintTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED').length;
            
            const percentage = sprintTasks.length > 0 ? Math.round((completed / sprintTasks.length) * 100) : 0;

            return (
              <div 
                key={team.id}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: team.color }}
                    />
                    <Link
                      href={`/teams/${team.id}`}
                      className="text-sm font-semibold text-white hover:text-indigo-300 transition-colors"
                    >
                      {team.name}
                    </Link>
                    <span className="text-xs font-mono text-slate-400">
                      • {teamSprint ? teamSprint.name : 'No active sprint'}
                    </span>
                  </div>

                  {/* Operational Telemetry counts */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-400">{completed} Completed</span>
                    <span className="text-slate-400">{remaining} Remaining</span>
                    {blocked > 0 && (
                      <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/60">
                        {blocked} Blocked
                      </span>
                    )}
                    {overdue > 0 && (
                      <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                        {overdue} Overdue
                      </span>
                    )}
                    <span className="font-bold text-white ml-2 text-sm">{percentage}%</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill-down Quick Access & Recent Org Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Blocked Tasks Watch */}
        <div className="lg:col-span-2 bg-[#0b0e17] border border-[#1e2439] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2135] mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Blocked & High Priority Focus</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {blockedTasks.length} requiring intervention
            </span>
          </div>

          <div className="space-y-2.5">
            {blockedTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No blocked tasks across the organization.</p>
            ) : (
              blockedTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask && onSelectTask(task.id)}
                  className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 hover:border-rose-700/60 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white group-hover:text-rose-300 truncate">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {task.team_name} • {task.sprint_name || 'Backlog'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-xs font-mono text-slate-400">{task.story_points} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-[#0b0e17] border border-[#1e2439] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2135] mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Recent Activity Stream</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activityLogs.slice(0, 7).map(act => (
              <div key={act.id} className="text-xs pb-2 border-b border-slate-900/80">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold text-slate-200 truncate">{act.actor?.full_name || 'System'}</span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{formatTimeAgo(act.created_at)}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {act.action.replace('_', ' ')}: <span className="text-slate-300">{act.task_title || act.team_name || 'milestone'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
