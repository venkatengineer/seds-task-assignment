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
  const verifiedTasks = tasks.filter(t => t.is_verified);
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');

  // Overdue calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Executive Command Center
            </span>
            <span className="text-xs text-gray-500">SEDS REC</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SEDS Command Center
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Organization-wide telemetry, subsystem sprint progression, and flight readiness metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCreateTask && (
            <button
              onClick={onCreateTask}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
          <Link
            href="/sprints"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium transition-colors shadow-xs"
          >
            <Flag className="w-4 h-4 text-gray-500" />
            <span>Manage Sprints</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">TEAMS</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalTeams}</div>
          <span className="text-[10px] text-gray-500">Subsystems</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">MEMBERS</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{activeMembers}</div>
          <span className="text-[10px] text-emerald-600">Active accounts</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">SPRINTS</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{activeSprints.length}</div>
          <span className="text-[10px] text-gray-500">Active now</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">TASKS</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{activeTasks.length}</div>
          <span className="text-[10px] text-gray-500">In pipeline</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">COMPLETED</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completedTasks.length}</div>
          <span className="text-[10px] text-emerald-600">{verifiedTasks.length} verified in history</span>
        </div>

        <div className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">OVERDUE</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{overdueTasks.length}</div>
          <span className="text-[10px] text-amber-600">Action needed</span>
        </div>

        <div className="p-3.5 bg-red-50/50 border border-red-200 rounded-xl shadow-xs">
          <span className="block text-[11px] font-semibold text-red-700 uppercase tracking-wider">BLOCKED</span>
          <div className="text-2xl font-bold text-red-600 mt-1">{blockedTasks.length}</div>
          <span className="text-[10px] text-red-600">Intervention</span>
        </div>
      </div>

      {/* Section: Organization Sprint Health */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Subsystem Sprint Progression</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Live operational visibility across all subsystems. Teams collaborate synchronously toward launch milestones.
            </p>
          </div>
          <Link
            href="/teams"
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
          >
            <span>View all teams</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Matrix of Teams */}
        <div className="space-y-3">
          {teams.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
              No teams created yet. Administrators can configure project teams in the Admin Panel.
            </div>
          ) : (
            teams.map(team => {
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
                className="p-3.5 rounded-lg bg-gray-50/60 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: team.color || '#2563EB' }}
                    />
                    <Link
                      href={`/teams/${team.id}`}
                      className="text-xs font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {team.name}
                    </Link>
                    <span className="text-xs text-gray-500">
                      • {teamSprint ? teamSprint.name : 'No active sprint'}
                    </span>
                  </div>

                  {/* Telemetry counts */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-700 font-medium">{completed} Completed</span>
                    <span className="text-gray-500">{remaining} Remaining</span>
                    {blocked > 0 && (
                      <span className="text-red-700 font-semibold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                        {blocked} Blocked
                      </span>
                    )}
                    {overdue > 0 && (
                      <span className="text-amber-800 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {overdue} Overdue
                      </span>
                    )}
                    <span className="font-bold text-gray-900 ml-2">{percentage}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Focus & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Blocked Tasks Focus */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>Blocked Tasks Watch</span>
            </h3>
            <span className="text-xs font-medium text-gray-500">
              {blockedTasks.length} requiring intervention
            </span>
          </div>

          <div className="space-y-2">
            {blockedTasks.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">No blocked tasks across the organization.</p>
            ) : (
              blockedTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask && onSelectTask(task.id)}
                  className="p-3 rounded-lg bg-red-50/40 border border-red-200 hover:border-red-300 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-gray-900 group-hover:text-red-700 truncate">
                        {task.title}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {task.team_name} • {task.sprint_name || 'Backlog'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-xs text-gray-500 font-mono">{task.story_points} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Recent Activity Stream</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4 text-center">No recent activity</p>
            ) : (
              activityLogs.slice(0, 7).map(act => (
                <div key={act.id} className="text-xs pb-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-gray-900 truncate">{act.actor?.full_name || 'System'}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatTimeAgo(act.created_at)}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {act.action.replace('_', ' ')}: <span className="text-gray-700 font-medium">{act.task_title || act.team_name || 'update'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
