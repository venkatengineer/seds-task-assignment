'use client';

import React from 'react';
import { useApp } from '@/lib/store/app-context';
import { 
  CheckCircle2, Users, MessageSquare, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';
import { AvatarGroup } from '@/components/ui/avatar';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { TaskStatus } from '@/types/database';

export const TeamMemberDashboard: React.FC<{
  onSelectTask?: (taskId: string) => void;
}> = ({ onSelectTask }) => {
  const { currentUser, teams, sprints, tasks, updateTaskStatus, announcements } = useApp();

  const userTeam = teams.find(t => t.id === currentUser.team_id) || teams[0] || {
    id: '',
    name: 'Your Subsystem Team',
    color: '#2563EB',
    description: '',
    icon: '🚀',
    accent: '#2563EB',
    created_at: '',
    updated_at: '',
  };
  const activeSprint = sprints.find(s => s.team_id === userTeam.id && s.status === 'ACTIVE');

  // Member's assigned tasks ONLY (strict role permission enforcement)
  const myTasks = tasks.filter(t => t.assignee_ids.includes(currentUser.id));
  
  // Collaborative tasks: tasks where member is assigned AND other members are also assigned
  const collaborativeTasks = myTasks.filter(t => t.assignee_ids.length > 1);

  // Grouped tasks: In Progress & Todo vs Completed
  const pendingTasks = myTasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED');

  // Current Sprint metrics
  const teamSprintTasks = activeSprint ? tasks.filter(t => t.sprint_id === activeSprint.id) : [];
  const teamSprintCompleted = teamSprintTasks.filter(t => t.status === 'COMPLETED').length;
  const sprintProgress = teamSprintTasks.length > 0
    ? Math.round((teamSprintCompleted / teamSprintTasks.length) * 100)
    : 0;

  // Recent announcements / lead messages
  const recentAnnouncements = announcements
    .filter(a => a.team_id === null || a.team_id === userTeam.id)
    .slice(0, 2);

  const handleToggleComplete = (taskId: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    updateTaskStatus(taskId, nextStatus);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="pb-5 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: userTeam.color || '#2563EB' }} />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            {userTeam.name} Subsystem • Mission Dashboard
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {currentUser.full_name.split(' ')[0]}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Here is your focused telemetry for today. Complete assigned deliverables, coordinate with team members, and log progress.
        </p>
      </div>

      {/* Top 2 Summary Cards: Active Sprint & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Sprint Overview */}
        <div className="md:col-span-2 p-5 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                Active Subsystem Sprint
              </span>
              <span className="text-xs font-bold text-gray-900">{sprintProgress}%</span>
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {activeSprint ? activeSprint.name : 'No Active Sprint'}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5 italic">
              &quot;{activeSprint?.goal || 'Awaiting sprint activation by team leads.'}&quot;
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${sprintProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>{teamSprintCompleted} of {teamSprintTasks.length} deliverables completed</span>
              <Link href="/sprints" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                <span>View Sprint</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Member Personal Progress */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">My Assigned Workload</span>
          <div className="my-2">
            <div className="text-3xl font-bold text-gray-900">
              {pendingTasks.length} <span className="text-xs font-normal text-gray-500">active tasks</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">
              {completedTasks.length} completed
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Collaborative tasks:</span>
            <span className="font-bold text-gray-900">{collaborativeTasks.length}</span>
          </div>
        </div>
      </div>

      {/* My Tasks List */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>My Tasks</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tasks assigned specifically to you. Click any task to view specifications or discuss with peers.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500">{myTasks.length} total</span>
        </div>

        {myTasks.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No tasks assigned yet. Your Team Leads will assign deliverables for the active sprint.
          </div>
        ) : (
          <div className="space-y-2">
            {myTasks.map(task => {
              const isCompleted = task.status === 'COMPLETED';
              const isCollaborative = task.assignee_ids.length > 1;

              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-gray-50/70 border-gray-200 opacity-60'
                      : 'bg-white border-gray-200 hover:border-blue-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Completion checkbox button */}
                    <button
                      onClick={() => handleToggleComplete(task.id, task.status)}
                      title={isCompleted ? 'Mark In Progress' : 'Mark Completed'}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 hover:border-blue-600 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>

                    <div
                      className="cursor-pointer truncate"
                      onClick={() => onSelectTask && onSelectTask(task.id)}
                    >
                      <div className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900 hover:text-blue-600'}`}>
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>Due: {formatDate(task.due_date)}</span>
                        <span>•</span>
                        <span className="font-mono">{task.story_points} pts</span>
                        {isCollaborative && (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[10px] font-medium">
                            You + {task.assignees.length - 1} members
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <PriorityBadge priority={task.priority} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collaborative Tasks Section */}
      {collaborativeTasks.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Collaborative Tasks (Team Subsystems)</span>
            </h3>
            <span className="text-xs font-medium text-gray-500">{collaborativeTasks.length} active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {collaborativeTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask && onSelectTask(task.id)}
                className="p-4 rounded-xl bg-gray-50/60 border border-gray-200 hover:border-blue-300 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <TaskStatusBadge status={task.status} size="sm" />
                  <span className="text-xs font-mono text-gray-500 font-medium">{task.story_points} pts</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {task.title}
                </h4>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                  {task.description}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AvatarGroup users={task.assignees} size="xs" />
                    <span className="text-[11px] text-gray-500">
                      {task.assignees.map(a => a.full_name.split(' ')[0]).join(', ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-blue-600 flex items-center">
                    Details <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication & Announcements from Leads */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Subsystem Directives & Announcements</span>
          </h3>
          <Link href="/communication" className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
            <span>Directives center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentAnnouncements.map(ann => (
            <div key={ann.id} className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-gray-900 truncate">{ann.title}</span>
                {ann.priority === 'URGENT' && (
                  <span className="text-[10px] font-semibold bg-red-50 text-red-700 px-1.5 py-0.2 rounded border border-red-200">
                    Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">{ann.content}</p>
              <div className="text-[11px] text-gray-500 flex justify-between">
                <span>By {ann.author?.full_name || 'Office Bearer'}</span>
                <span className="font-medium text-gray-700">{ann.team_name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
