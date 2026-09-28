'use client';

import React from 'react';
import { useApp } from '@/lib/store/app-context';
import { 
  Users, Flag, Plus, ArrowRight, BarChart3 
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/ui/avatar';
import { TaskStatusBadge, SprintStatusBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { TaskStatus } from '@/types/database';

export const TeamLeadDashboard: React.FC<{
  onSelectTask?: (taskId: string) => void;
  onCreateTask?: () => void;
}> = ({ onCreateTask }) => {
  const { currentUser, teams, sprints, tasks, allProfiles } = useApp();

  const userTeam = teams.find(t => t.id === currentUser.team_id) || teams[0] || {
    id: '',
    name: 'Your Subsystem Team',
    color: '#2563EB',
    description: 'No team assigned yet. An administrator can assign you to a project team.',
    icon: '🚀',
    accent: '#2563EB',
    created_at: '',
    updated_at: '',
  };
  const teamMembers = allProfiles.filter(p => userTeam.id && p.team_id === userTeam.id && p.role !== 'ADMIN');
  const teamTasks = tasks.filter(t => userTeam.id && t.team_id === userTeam.id);
  const activeSprint = sprints.find(s => userTeam.id && s.team_id === userTeam.id && s.status === 'ACTIVE') || sprints.find(s => userTeam.id && s.team_id === userTeam.id);

  const sprintTasks = activeSprint ? teamTasks.filter(t => t.sprint_id === activeSprint.id) : teamTasks;
  const completedTasks = sprintTasks.filter(t => t.status === 'COMPLETED');
  const blockedTasks = sprintTasks.filter(t => t.status === 'BLOCKED');

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = sprintTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED');

  const sprintPercentage = sprintTasks.length > 0 
    ? Math.round((completedTasks.length / sprintTasks.length) * 100) 
    : 0;

  // Status breakdown
  const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'];
  const statusCounts = statuses.map(st => ({
    status: st,
    count: sprintTasks.filter(t => t.status === st).length,
  }));

  // Member workload breakdown
  const memberWorkload = teamMembers.map(member => {
    const assignedTasks = teamTasks.filter(t => t.assignee_ids.includes(member.id));
    const activeAssigned = assignedTasks.filter(t => t.status !== 'COMPLETED');
    const totalPoints = assignedTasks.reduce((acc, t) => acc + t.story_points, 0);
    return {
      member,
      totalCount: assignedTasks.length,
      activeCount: activeAssigned.length,
      totalPoints,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: userTeam.color || '#2563EB' }} 
            />
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Team Lead Control • {userTeam.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {userTeam.name} Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Subsystem sprint pacing, engineer workload distribution, and deliverable tracking.
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
            <span>Manage Sprint</span>
          </Link>
        </div>
      </div>

      {/* Current Sprint Card */}
      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                Current Sprint
              </span>
              {activeSprint && <SprintStatusBadge status={activeSprint.status} size="sm" />}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">
              {activeSprint ? activeSprint.name : 'No Active Sprint'}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5 italic">
              &quot;{activeSprint ? activeSprint.goal : 'Plan and start a sprint in Sprint Planning.'}&quot;
            </p>
          </div>

          <div className="text-right flex items-center md:flex-col md:items-end justify-between gap-1">
            <span className="text-xs text-gray-500">
              {activeSprint ? `${formatDate(activeSprint.start_date)} - ${formatDate(activeSprint.end_date)}` : ''}
            </span>
            <div className="text-base font-bold text-gray-900">
              {completedTasks.length} / {sprintTasks.length} tasks completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-500">Sprint Completion</span>
            <span className="font-bold text-gray-900">{sprintPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${sprintPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[11px] font-semibold uppercase text-gray-500 block">Total Tasks</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">{sprintTasks.length}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[11px] font-semibold uppercase text-emerald-700 block">Completed</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{completedTasks.length}</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[11px] font-semibold uppercase text-amber-800 block">Overdue</span>
            <span className="text-xl font-bold text-amber-600 mt-0.5 block">{overdueTasks.length}</span>
          </div>
          <div className="p-3 bg-red-50/50 rounded-xl border border-red-200">
            <span className="text-[11px] font-semibold uppercase text-red-700 block">Blocked</span>
            <span className="text-xl font-bold text-red-600 mt-0.5 block">{blockedTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Member Workload & Task Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Workload Column */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Team Workload & Engineer Assignments</span>
            </h3>
            <span className="text-xs font-medium text-gray-500">{teamMembers.length} engineers</span>
          </div>

          <div className="space-y-2.5">
            {memberWorkload.map(({ member, activeCount, totalPoints }) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-gray-50/60 border border-gray-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={member} size="md" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-gray-900 truncate flex items-center gap-1.5">
                      <span>{member.full_name}</span>
                      {member.role === 'TEAM_LEAD' && (
                        <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">Lead</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{member.title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="text-right">
                    <div className="text-gray-900 font-semibold">{activeCount} active tasks</div>
                    <div className="text-[11px] text-gray-500">{totalPoints} story points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Tasks by Status</span>
            </h3>
          </div>

          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => {
              const pct = sprintTasks.length > 0 ? Math.round((count / sprintTasks.length) * 100) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <TaskStatusBadge status={status} size="sm" />
                    <span className="text-gray-700">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link
              href="/tasks"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200 transition-colors"
            >
              <span>Open Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
