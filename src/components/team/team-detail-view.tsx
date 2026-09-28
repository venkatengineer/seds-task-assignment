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
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teams Directory</span>
        </Link>

        <span className="text-[11px] font-mono text-gray-400">
          ID: {team.id.slice(0, 8)}...
        </span>
      </div>

      {/* Team Header Hero */}
      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-xs text-xl font-bold"
            style={{ backgroundColor: team.color }}
          >
            {team.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Team Drill-Down
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {activeSprint ? `Active: ${activeSprint.name}` : 'No Active Sprint'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{team.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              {team.description}
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'tasks'
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Deliverables & Tasks ({teamTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('sprints')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'sprints'
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Sprints ({teamSprints.length})
        </button>
        <button
          onClick={() => setActiveTab('engineers')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            activeTab === 'engineers'
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Team Members ({teamMembers.length})
        </button>
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-2.5">
          {teamTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-xl">
              No tasks logged for this team yet.
            </div>
          ) : (
            teamTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="p-3.5 bg-white border border-gray-200 hover:border-blue-400 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-xs group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} size="sm" />
                    <span className="text-[10px] font-mono text-gray-500">
                      {task.story_points} pts
                    </span>
                    {task.sprint_name && (
                      <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        {task.sprint_name}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {task.title}
                  </h4>
                  {task.due_date && (
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Due: {formatDate(task.due_date)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <AvatarGroup users={task.assignees} size="xs" max={3} />
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Sprints */}
      {activeTab === 'sprints' && (
        <div className="space-y-3">
          {teamSprints.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-xl">
              No sprints planned for this team yet.
            </div>
          ) : (
            teamSprints.map(s => {
              const sTasks = teamTasks.filter(t => t.sprint_id === s.id);
              const doneTasks = sTasks.filter(t => t.status === 'COMPLETED').length;
              const pct = sTasks.length > 0 ? Math.round((doneTasks / sTasks.length) * 100) : 0;

              return (
                <div
                  key={s.id}
                  className="p-4 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      <SprintStatusBadge status={s.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-500 italic">"{s.goal}"</p>
                    <div className="text-[10px] font-mono text-gray-400 mt-1">
                      {formatDate(s.start_date)} - {formatDate(s.end_date)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Progress</span>
                      <span className="text-gray-900 font-semibold">{doneTasks} / {sTasks.length} tasks ({pct}%)</span>
                    </div>
                    <Link
                      href="/sprints"
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-medium transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Subsystem Engineers */}
      {activeTab === 'engineers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teamMembers.map(member => {
            const assigned = teamTasks.filter(t => t.assignee_ids.includes(member.id));
            const active = assigned.filter(t => t.status !== 'COMPLETED');

            return (
              <div
                key={member.id}
                className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={member} size="md" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-gray-900 flex items-center gap-2 truncate">
                      <span>{member.full_name}</span>
                      <RoleBadge role={member.role} size="sm" />
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{member.title || 'Member'}</div>
                    <div className="text-[10px] font-mono text-gray-400 truncate">{member.email}</div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs shrink-0">
                  <span className="text-gray-900 font-bold text-sm block">{active.length}</span>
                  <span className="text-[10px] text-gray-400 block uppercase font-mono">active tasks</span>
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
