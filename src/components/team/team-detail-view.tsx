'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  Plus, ArrowLeft, Calendar, ArrowUpRight, BarChart3, Award, FolderArchive, ChevronDown 
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar, AvatarGroup } from '@/components/ui/avatar';
import { TaskStatusBadge, PriorityBadge, SprintStatusBadge, RoleBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { TaskCreateModal } from '@/components/tasks/task-create-modal';
import { MemberAnalyticsModal } from '@/components/analytics/member-analytics-modal';
import { SprintDocumentsModal } from '@/components/sprint/sprint-documents-modal';
import { Profile, Sprint, UserRole } from '@/types/database';

interface TeamDetailViewProps {
  teamId: string;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({ teamId }) => {
  const { currentUser, teams, sprints, sprintDocuments, tasks, allProfiles, updateUser } = useApp();

  const team = teams.find(t => t.id === teamId) || teams[0];
  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isLeadOfThisTeam = currentUser.role === 'TEAM_LEAD' && currentUser.team_id === team.id;
  const canManage = isOfficeBearer || isLeadOfThisTeam || Permissions.canManageUsers(currentUser);

  const teamMembers = allProfiles.filter(p => p.team_id === team.id && p.role !== 'ADMIN' && p.role !== 'OFFICE_BEARER');

  const handleMemberRoleChange = async (targetMember: Profile, newRole: UserRole) => {
    if (targetMember.role === newRole) return;
    const newTeamId = (newRole === 'OFFICE_BEARER' || newRole === 'ADMIN') ? null : team.id;
    try {
      await updateUser(targetMember.id, {
        role: newRole,
        team_id: newTeamId,
        title: (newRole === 'OFFICE_BEARER' && (!targetMember.title || targetMember.title === 'SEDS Member' || targetMember.title === 'Team Lead'))
          ? 'Office Bearer'
          : (newRole === 'TEAM_LEAD' && (!targetMember.title || targetMember.title === 'SEDS Member'))
          ? 'Team Lead'
          : targetMember.title,
      });
    } catch (err: unknown) {
      alert('Failed to change role: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };
  
  const teamSprints = sprints.filter(s => s.team_id === team.id);
  const activeSprint = teamSprints.find(s => s.status === 'ACTIVE');
  const teamTasks = tasks.filter(t => t.team_id === team.id);

  const [activeTab, setActiveTab] = useState<'tasks' | 'sprints' | 'engineers'>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMemberForInspection, setSelectedMemberForInspection] = useState<Profile | null>(null);
  const [selectedSprintForDocs, setSelectedSprintForDocs] = useState<Sprint | null>(null);
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

                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs flex-wrap">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono">Progress</span>
                      <span className="text-gray-900 font-semibold">{doneTasks} / {sTasks.length} tasks ({pct}%)</span>
                    </div>
                    <button
                      onClick={() => setSelectedSprintForDocs(s)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                      title="Inspect and upload deliverables stored in database"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Deliverables ({sprintDocuments.filter(d => d.sprint_id === s.id).length})</span>
                    </button>
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
            const assigned = teamTasks.filter(t => t.assignee_ids && t.assignee_ids.includes(member.id));
            const active = assigned.filter(t => t.status !== 'COMPLETED');
            const completed = assigned.filter(t => t.status === 'COMPLETED');
            const totalPoints = assigned.reduce((s, t) => s + (t.story_points || 0), 0);
            const completedPoints = completed.reduce((s, t) => s + (t.story_points || 0), 0);

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMemberForInspection(member)}
                className="p-4 bg-white hover:bg-blue-50/20 border border-gray-200 hover:border-blue-300 rounded-xl flex items-center justify-between gap-3 shadow-xs cursor-pointer transition-all hover:shadow-2xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar user={member} size="md" />
                  <div className="truncate">
                    <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2 truncate">
                      <span>{member.full_name}</span>
                      {canManage ? (
                        <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={member.role}
                            onChange={(e) => handleMemberRoleChange(member, e.target.value as UserRole)}
                            className={`text-[10px] font-semibold py-0.5 px-2 rounded-md border cursor-pointer transition-all focus:outline-hidden appearance-none pr-5 ${
                              member.role === 'ADMIN'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : member.role === 'OFFICE_BEARER'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : member.role === 'TEAM_LEAD'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                            title="Click to change member role anytime"
                          >
                            <option value="TEAM_MEMBER">Team Member</option>
                            <option value="TEAM_LEAD">Team Lead</option>
                            {(isOfficeBearer || currentUser.role === 'ADMIN') && (
                              <option value="OFFICE_BEARER">Office Bearer (Org-Wide)</option>
                            )}
                            {currentUser.role === 'ADMIN' && (
                              <option value="ADMIN">Platform Admin</option>
                            )}
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 text-gray-400 absolute right-1 pointer-events-none" />
                        </div>
                      ) : (
                        <RoleBadge role={member.role} size="sm" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{member.title || 'Member'}</div>
                    <div className="text-[10px] font-mono text-gray-400 truncate">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono text-xs">
                    <div className="text-gray-900 font-bold">
                      <span className="text-emerald-600">{completedPoints}</span>
                      <span className="text-gray-400"> / {totalPoints} pts</span>
                    </div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">{active.length} active</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMemberForInspection(member);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                    title={`Inspect analytics & completed story points for ${member.full_name}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Inspect</span>
                  </button>
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

      {/* Member Analytics Inspection Modal */}
      <MemberAnalyticsModal
        isOpen={Boolean(selectedMemberForInspection)}
        onClose={() => setSelectedMemberForInspection(null)}
        member={selectedMemberForInspection}
        teamMembers={teamMembers}
        onSelectMember={(id) => {
          const found = teamMembers.find(m => m.id === id);
          if (found) setSelectedMemberForInspection(found);
        }}
        onSelectTask={setSelectedTaskId}
      />

      {/* Sprint Documents & Deliverables Modal */}
      <SprintDocumentsModal
        isOpen={Boolean(selectedSprintForDocs)}
        onClose={() => setSelectedSprintForDocs(null)}
        sprint={selectedSprintForDocs}
      />
    </div>
  );
};
