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

  const userTeam = teams.find(t => t.id === currentUser.team_id) || teams[0];
  const teamMembers = allProfiles.filter(p => p.team_id === userTeam.id);
  const teamTasks = tasks.filter(t => t.team_id === userTeam.id);
  const activeSprint = sprints.find(s => s.team_id === userTeam.id && s.status === 'ACTIVE') || sprints.find(s => s.team_id === userTeam.id);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: userTeam.color }} 
            />
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
              TEAM LEAD MISSION CONTROL • {userTeam.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {userTeam.name} Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Subsystem sprint pacing, active engineer workload distribution, and deliverable tracking.
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
            <span>Manage Sprint</span>
          </Link>
        </div>
      </div>

      {/* Section 11: Current Sprint Card */}
      <div className="p-6 bg-linear-to-br from-[#0e1220] to-[#0a0c14] border border-[#222942] rounded-2xl shadow-xl glow-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded">
                CURRENT SPRINT
              </span>
              {activeSprint && <SprintStatusBadge status={activeSprint.status} size="sm" />}
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              {activeSprint ? activeSprint.name : 'No Active Sprint'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 italic">
              "{activeSprint ? activeSprint.goal : 'Plan and start a sprint in Sprint Planning.'}"
            </p>
          </div>

          <div className="text-right flex items-center md:flex-col md:items-end justify-between gap-1">
            <span className="text-xs font-mono text-slate-400">
              {activeSprint ? `${formatDate(activeSprint.start_date)} - ${formatDate(activeSprint.end_date)}` : ''}
            </span>
            <div className="text-lg font-bold font-mono text-white">
              {completedTasks.length} / {sprintTasks.length} tasks completed
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Sprint Progress</span>
            <span className="font-bold text-white">{sprintPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${sprintPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/60">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">TOTAL TASKS</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">{sprintTasks.length}</span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-emerald-400 block">COMPLETED</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">{completedTasks.length}</span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-amber-400 block">OVERDUE</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">{overdueTasks.length}</span>
          </div>
          <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/50">
            <span className="text-[10px] font-mono uppercase text-rose-300 block">BLOCKED</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-0.5 block">{blockedTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Member Workload & Task Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Workload Column */}
        <div className="lg:col-span-2 bg-[#0b0e17] border border-[#1e2439] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2135] mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Team Workload & Engineer Assignments</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">{teamMembers.length} engineers</span>
          </div>

          <div className="space-y-3">
            {memberWorkload.map(({ member, activeCount, totalPoints }) => (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={member} size="md" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{member.full_name}</span>
                      {member.role === 'TEAM_LEAD' && (
                        <span className="text-[9px] font-mono bg-indigo-950 text-indigo-300 px-1 rounded">Lead</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{member.title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <div className="text-slate-200">{activeCount} active tasks</div>
                    <div className="text-[10px] text-slate-500">{totalPoints} story points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-[#0b0e17] border border-[#1e2439] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-[#1b2135] mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Tasks by Status</span>
            </h3>
          </div>

          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => {
              const pct = sprintTasks.length > 0 ? Math.round((count / sprintTasks.length) * 100) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <TaskStatusBadge status={status} size="sm" />
                    <span className="text-slate-300">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <Link
              href="/tasks"
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-700/40 transition-colors"
            >
              <span>Open Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
