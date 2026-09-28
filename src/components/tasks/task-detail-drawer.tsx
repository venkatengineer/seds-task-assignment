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
            {task.assignment_type === 'OPEN' && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Compass className="w-3 h-3" />
                <span>Open Task • {task.open_task_status || 'PUBLISHED'}</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{task.title}</h2>
          {task.skills && task.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.skills.map(skill => (
                <span key={skill} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Open Task Staffing & Applications Section */}
        {task.assignment_type === 'OPEN' && (
          <div className="p-3.5 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-mono text-amber-300 uppercase">
                  Staffing: {task.assignee_ids.length} / {task.max_assignees || 1} Assigned
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {task.requires_approval !== false ? 'Lead Approval Required' : 'Instant Auto-Claim'}
              </span>
            </div>

            {/* For Leads & Office Bearers: Review Applicants for this Task */}
            {Permissions.canManageOpenTask(currentUser, task) && (
              <div className="space-y-2 pt-2 border-t border-amber-900/30">
                <div className="text-[11px] font-mono text-slate-400 uppercase">
                  Applicant Requests ({openTaskInterests.filter(i => i.task_id === task.id && i.status === 'INTERESTED').length})
                </div>
                {openTaskInterests.filter(i => i.task_id === task.id && i.status === 'INTERESTED').length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No pending applicant requests for this task.</p>
                ) : (
                  openTaskInterests
                    .filter(i => i.task_id === task.id && i.status === 'INTERESTED')
                    .map(interest => {
                      const applicant = allProfiles.find(p => p.id === interest.user_id) || interest.user;
                      return (
                        <div key={interest.id} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserAvatar user={applicant} size="xs" />
                              <span className="text-xs font-medium text-white">{applicant?.full_name}</span>
                              <span className="text-[9px] font-mono text-slate-400">{applicant?.title || applicant?.role}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => rejectInterest(interest.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => approveInterest(interest.id)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                Approve & Assign
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded">
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
              <div className="pt-2 border-t border-amber-900/30">
                {openTaskInterests.some(i => i.task_id === task.id && i.user_id === currentUser.id && i.status === 'INTERESTED') ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-800/40">
                    <div className="flex items-center gap-2 text-xs text-amber-300">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Application submitted — Awaiting Lead review</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => withdrawInterest(task.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPitchBox(false)}
                          className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs cursor-pointer"
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
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          Submit Application
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPitchBox(true)}
                      className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Express Interest in this Task</span>
                    </button>
                  )
                ) : (
                  <p className="text-xs text-slate-500 italic">This open task has reached maximum capacity.</p>
                )}
              </div>
            )}
          </div>
        )}

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
