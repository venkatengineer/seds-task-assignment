'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { Drawer } from '@/components/ui/modal';
import { TaskStatusBadge, PriorityBadge } from '@/components/ui/badges';
import { UserAvatar } from '@/components/ui/avatar';
import { TaskStatus, TaskPriority } from '@/types/database';
import { formatDate, formatTimeAgo } from '@/lib/utils';
import { 
  Calendar, MessageSquare, Send, 
  Trash2, ShieldAlert
} from 'lucide-react';

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  taskId,
  onClose,
}) => {
  const { 
    currentUser, tasks, comments, activityLogs, 
    updateTaskStatus, updateTask, deleteTask, addComment 
  } = useApp();

  const [commentInput, setCommentInput] = useState('');

  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;

  // Authorization check
  const canView = Permissions.canViewTask(currentUser, task);
  const canEdit = Permissions.canEditTask(currentUser, task);
  const canUpdateStatus = Permissions.canUpdateTaskStatus(currentUser, task);
  const canDelete = Permissions.canDeleteTask(currentUser, task);

  if (!canView) {
    return (
      <Drawer isOpen={Boolean(taskId)} onClose={onClose} title="Access Restricted">
        <div className="py-12 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h4 className="text-base font-semibold text-white">Access Denied by SEDS Security Policy</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You are logged in as a Team Member and are not an assigned engineer on this task. 
            Under SEDS REC policy, private tasks are restricted to assigned collaborators and team leads.
          </p>
        </div>
      </Drawer>
    );
  }

  const taskComments = comments.filter(c => c.task_id === task.id);
  const taskActivities = activityLogs.filter(a => a.task_id === task.id);

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (canEdit) {
      updateTask(task.id, { priority: newPriority });
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(task.id, commentInput.trim());
    setCommentInput('');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <Drawer
      isOpen={Boolean(taskId)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">{task.team_name}</span>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono text-slate-400">{task.sprint_name || 'Backlog'}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Title and Badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {task.story_points} Story Points
            </span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{task.title}</h2>
        </div>

        {/* Action Bar (Status Changer for Permitted Users) */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 uppercase">Change Status:</span>
            {!canUpdateStatus && (
              <span className="text-[10px] text-amber-400 font-mono">View-only</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'] as TaskStatus[]).map(st => (
              <button
                key={st}
                disabled={!canUpdateStatus}
                onClick={() => handleStatusChange(st)}
                className={`px-2 py-1.5 rounded text-[11px] font-mono transition-all border ${
                  task.status === st
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-xs'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                } ${!canUpdateStatus ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-mono text-slate-400 uppercase mb-1.5">Description & Specifications</h4>
          <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {task.description || 'No detailed description provided.'}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 text-xs">
          <div>
            <span className="block text-[11px] font-mono text-slate-400 mb-1">DUE DATE</span>
            <div className="flex items-center gap-1.5 text-slate-200">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-mono text-slate-400 mb-1">PRIORITY LEVEL</span>
            {canEdit ? (
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            ) : (
              <PriorityBadge priority={task.priority} size="sm" />
            )}
          </div>
        </div>

        {/* Collaborative Assignees */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-mono text-slate-400 uppercase">
              Assigned Engineers ({task.assignees.length})
            </h4>
            {task.assignees.length > 1 && (
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                Collaborative Task
              </span>
            )}
          </div>
          <div className="space-y-2">
            {task.assignees.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No engineers assigned yet</p>
            ) : (
              task.assignees.map(engineer => (
                <div
                  key={engineer.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={engineer} size="sm" />
                    <div>
                      <div className="text-xs font-medium text-white">{engineer.full_name}</div>
                      <div className="text-[10px] text-slate-400">{engineer.title || engineer.role}</div>
                    </div>
                  </div>
                  {engineer.id === currentUser.id && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Realtime Contextual Comments */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-mono text-slate-300 uppercase">Comments & Technical Thread</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{taskComments.length} messages</span>
          </div>

          {/* Comment Stream */}
          <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
            {taskComments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No comments yet. Start the discussion below.</p>
            ) : (
              taskComments.map(comment => (
                <div key={comment.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={comment.author} size="xs" />
                      <span className="text-xs font-medium text-slate-200">{comment.author?.full_name || 'Member'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed pl-6">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a technical note or status update..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </form>
        </div>

        {/* Task Activity Logs */}
        <div className="pt-4 border-t border-slate-800">
          <h4 className="text-xs font-mono text-slate-400 uppercase mb-2">Audit Trail / Activity</h4>
          <div className="space-y-1.5">
            {taskActivities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No activity recorded yet</p>
            ) : (
              taskActivities.map(act => (
                <div key={act.id} className="flex items-center justify-between text-[11px] text-slate-400 font-mono py-1 border-b border-slate-900">
                  <span>{act.actor?.full_name || 'System'} {act.action.replace('_', ' ')}</span>
                  <span className="text-slate-600">{formatTimeAgo(act.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Task (Permitted for Leads & Office Bearers) */}
        {canDelete && (
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>
          </div>
        )}
      </div>
    </Drawer>
  );
};
