'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  Plus, ArrowLeft, Calendar, ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar, AvatarGroup } from '@/components/ui/avatar';
import { TaskStatusBadge, PriorityBadge, SprintStatusBadge, RoleBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { TaskCreateModal } from '@/components/tasks/task-create-modal';

interface TeamDetailViewProps {
  teamId: string;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({ teamId }) => {
  const { currentUser, teams, sprints, tasks, allProfiles } = useApp();

  const team = teams.find(t => t.id === teamId) || teams[0];
  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isLeadOfThisTeam = currentUser.role === 'TEAM_LEAD' && currentUser.team_id === team.id;
  const canManage = isOfficeBearer || isLeadOfThisTeam;

  const teamMembers = allProfiles.filter(p => p.team_id === team.id);
  
  const teamSprints = sprints.filter(s => s.team_id === team.id);
  const activeSprint = teamSprints.find(s => s.status === 'ACTIVE');
  const teamTasks = tasks.filter(t => t.team_id === team.id);

  const [activeTab, setActiveTab] = useState<'tasks' | 'sprints' | 'engineers'>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back button & Breadcrumbs indicator */}
      <div className="flex items-center justify-between">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Subsystems Directory</span>
        </Link>

        <span className="text-[11px] font-mono text-slate-500">
          ID: {team.id.slice(0, 8)}...
        </span>
      </div>

      {/* Team Header Hero */}
      <div className="p-6 bg-[#0c0f1a] border border-[#20273f] rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 glow-subtle">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg text-xl font-bold"
            style={{ backgroundColor: team.color }}
          >
            {team.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                SUBSYSTEM DRILL-DOWN
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-emerald-400">
                {activeSprint ? `Active: ${activeSprint.name}` : 'No Active Sprint'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{team.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              {team.description}
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'tasks'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Deliverables & Tasks ({teamTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('sprints')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'sprints'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sprints ({teamSprints.length})
        </button>
        <button
          onClick={() => setActiveTab('engineers')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'engineers'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Subsystem Engineers ({teamMembers.length})
        </button>
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {teamTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#0a0c14] border border-slate-800 rounded-xl">
              No tasks logged for this team yet.
            </div>
          ) : (
            teamTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="p-3.5 bg-[#0b0e17] border border-[#1e2439] hover:border-indigo-600/60 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400">
                      {task.story_points} pts
                    </span>
                    {task.sprint_name && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 rounded">
                        {task.sprint_name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {task.title}
                  </h4>
                  {task.due_date && (
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Due: {formatDate(task.due_date)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <AvatarGroup users={task.assignees} size="xs" max={3} />
                  <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Sprints */}
      {activeTab === 'sprints' && (
        <div className="space-y-3">
          {teamSprints.map(s => {
            const sTasks = teamTasks.filter(t => t.sprint_id === s.id);
            const doneTasks = sTasks.filter(t => t.status === 'COMPLETED').length;
            const pct = sTasks.length > 0 ? Math.round((doneTasks / sTasks.length) * 100) : 0;

            return (
              <div
                key={s.id}
                className="p-4 bg-[#0b0e17] border border-[#1e2439] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{s.name}</span>
                    <SprintStatusBadge status={s.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-300 italic">"{s.goal}"</p>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    {formatDate(s.start_date)} - {formatDate(s.end_date)}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PROGRESS</span>
                    <span className="text-white font-bold">{doneTasks} / {sTasks.length} tasks ({pct}%)</span>
                  </div>
                  <Link
                    href="/sprints"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-700 transition-colors"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Subsystem Engineers */}
      {activeTab === 'engineers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers.map(member => {
            const assigned = teamTasks.filter(t => t.assignee_ids.includes(member.id));
            const active = assigned.filter(t => t.status !== 'COMPLETED');

            return (
              <div
                key={member.id}
                className="p-4 bg-[#0b0e17] border border-[#1e2439] rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={member} size="md" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-white flex items-center gap-2 truncate">
                      <span>{member.full_name}</span>
                      <RoleBadge role={member.role} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{member.title || 'Engineer'}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">{member.email}</div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs shrink-0">
                  <span className="text-white font-bold">{active.length}</span>
                  <span className="text-[10px] text-slate-400 block">active tasks</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultTeamId={team.id}
        defaultSprintId={activeSprint?.id}
      />
    </div>
  );
};
