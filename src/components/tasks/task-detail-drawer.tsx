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
  Trash2, ShieldAlert, Compass, Clock 
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
    updateTaskStatus, updateTask, deleteTask, addComment,
    openTaskInterests, expressInterest, withdrawInterest, 
    approveInterest, rejectInterest, allProfiles
  } = useApp();

  const [commentInput, setCommentInput] = useState('');
  const [pitchText, setPitchText] = useState('');
  const [showPitchBox, setShowPitchBox] = useState(false);

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
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h4 className="text-base font-semibold text-gray-900">Access Denied by SEDS Security Policy</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
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
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{task.team_name}</span>
          <span className="text-gray-300">/</span>
          <span className="text-xs text-gray-500">{task.sprint_name || 'Backlog'}</span>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Title and Badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 font-mono font-medium">
              {task.story_points} Points
            </span>
            {task.assignment_type === 'OPEN' && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-medium">
                <Compass className="w-3 h-3" />
                <span>Open Task • {task.open_task_status || 'PUBLISHED'}</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900 leading-snug">{task.title}</h2>
          {task.skills && task.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.skills.map(skill => (
                <span key={skill} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Open Task Staffing & Applications Section */}
        {task.assignment_type === 'OPEN' && (
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold text-amber-900 uppercase">
                  Staffing: {task.assignee_ids.length} / {task.max_assignees || 1} Assigned
                </h4>
              </div>
              <span className="text-[11px] text-gray-500">
                {task.requires_approval !== false ? 'Lead Approval Required' : 'Instant Auto-Claim'}
              </span>
            </div>

            {/* For Leads & Office Bearers: Review Applicants for this Task */}
            {Permissions.canManageOpenTask(currentUser, task) && (
              <div className="space-y-2 pt-2 border-t border-amber-200/80">
                <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  Applicant Requests ({openTaskInterests.filter(i => i.task_id === task.id && i.status === 'INTERESTED').length})
                </div>
                {openTaskInterests.filter(i => i.task_id === task.id && i.status === 'INTERESTED').length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No pending applicant requests for this task.</p>
                ) : (
                  openTaskInterests
                    .filter(i => i.task_id === task.id && i.status === 'INTERESTED')
                    .map(interest => {
                      const applicant = allProfiles.find(p => p.id === interest.user_id) || interest.user;
                      return (
                        <div key={interest.id} className="p-2.5 rounded-lg bg-white border border-amber-200 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserAvatar user={applicant} size="xs" />
                              <span className="text-xs font-semibold text-gray-900">{applicant?.full_name}</span>
                              <span className="text-[10px] text-gray-500">{applicant?.title || applicant?.role}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => rejectInterest(interest.id)}
                                className="px-2 py-1 rounded bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 text-[11px] font-medium transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => approveInterest(interest.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                              >
                                Approve & Assign
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-700 italic bg-gray-50 p-2 rounded-md border border-gray-100">
                            &quot;{interest.message}&quot;
                          </p>
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* For Team Member: Application Action & Status */}
            {currentUser.role === 'TEAM_MEMBER' && !task.assignee_ids.includes(currentUser.id) && (
              <div className="pt-2 border-t border-amber-200/80">
                {openTaskInterests.some(i => i.task_id === task.id && i.user_id === currentUser.id && i.status === 'INTERESTED') ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-100/60 border border-amber-300/80">
                    <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>Application submitted — Awaiting Lead review</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => withdrawInterest(task.id)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition-colors"
                    >
                      Withdraw
                    </button>
                  </div>
                ) : (task.assignee_ids.length < (task.max_assignees || 1)) ? (
                  showPitchBox ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={pitchText}
                        onChange={(e) => setPitchText(e.target.value)}
                        placeholder="Write a brief pitch about your skillset and interest..."
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs text-gray-900 focus:outline-hidden focus:border-amber-500 resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPitchBox(false)}
                          className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            expressInterest(task.id, pitchText || 'Interested in taking this open task');
                            setShowPitchBox(false);
                            setPitchText('');
                          }}
                          className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                        >
                          Submit Pitch
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPitchBox(true)}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Express Interest in this Task</span>
                    </button>
                  )
                ) : (
                  <p className="text-xs text-gray-500 italic">This open task has reached maximum capacity.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Bar (Status Changer for Permitted Users) */}
        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Workflow Status</span>
            {!canUpdateStatus && (
              <span className="text-[11px] text-gray-400 font-mono">View-only</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED'] as TaskStatus[]).map(st => (
              <button
                key={st}
                disabled={!canUpdateStatus}
                onClick={() => handleStatusChange(st)}
                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  task.status === st
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                } ${!canUpdateStatus ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 text-[11px]">
            Description & Specifications
          </h4>
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
            {task.description || 'No detailed description provided.'}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 p-3.5 bg-white rounded-xl border border-gray-200 text-xs shadow-2xs">
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Date</span>
            <div className="flex items-center gap-1.5 text-gray-900 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority</span>
            {canEdit ? (
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-900 font-medium focus:outline-hidden focus:border-blue-500"
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
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider text-[11px]">
              Assigned Engineers ({task.assignees.length})
            </h4>
            {task.assignees.length > 1 && (
              <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Collaborative Task
              </span>
            )}
          </div>
          <div className="space-y-2">
            {task.assignees.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No engineers assigned yet</p>
            ) : (
              task.assignees.map(engineer => (
                <div
                  key={engineer.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={engineer} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{engineer.full_name}</div>
                      <div className="text-[10px] text-gray-500">{engineer.title || engineer.role}</div>
                    </div>
                  </div>
                  {engineer.id === currentUser.id && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      You
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Realtime Contextual Comments */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider text-[11px]">Comments & Discussion</h4>
            </div>
            <span className="text-[11px] text-gray-500 font-mono">{taskComments.length} messages</span>
          </div>

          {/* Comment Stream */}
          <div className="space-y-2.5 mb-3 max-h-56 overflow-y-auto pr-1">
            {taskComments.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">No comments yet. Start the discussion below.</p>
            ) : (
              taskComments.map(comment => (
                <div key={comment.id} className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={comment.author} size="xs" />
                      <span className="text-xs font-semibold text-gray-900">{comment.author?.full_name || 'Member'}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-6">{comment.content}</p>
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
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!commentInput.trim()}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </form>
        </div>

        {/* Task Activity Logs */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 text-[11px]">Audit Trail / Activity</h4>
          <div className="space-y-1">
            {taskActivities.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No activity recorded yet</p>
            ) : (
              taskActivities.map(act => (
                <div key={act.id} className="flex items-center justify-between text-[11px] text-gray-500 py-1 border-b border-gray-50">
                  <span>{act.actor?.full_name || 'System'} {act.action.replace('_', ' ')}</span>
                  <span className="text-gray-400">{formatTimeAgo(act.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete Task (Permitted for Leads & Office Bearers) */}
        {canDelete && (
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
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
