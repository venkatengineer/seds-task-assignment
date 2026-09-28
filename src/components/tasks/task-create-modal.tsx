'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { Modal } from '@/components/ui/modal';
import { TaskPriority, TaskStatus } from '@/types/database';
import { UserAvatar } from '@/components/ui/avatar';
import { AlertCircle } from 'lucide-react';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
  defaultSprintId?: string | null;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  defaultTeamId,
  defaultSprintId,
}) => {
  const { currentUser, teams, sprints, allProfiles, createTask } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const initialTeamId = defaultTeamId || currentUser.team_id || teams[0]?.id || '';
  
  const [teamId, setTeamId] = useState(initialTeamId);
  const [sprintId, setSprintId] = useState<string | null>(defaultSprintId || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status] = useState<TaskStatus>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Available team members for assignment
  const teamMembers = allProfiles.filter(p => p.team_id === teamId);
  const teamSprints = sprints.filter(s => s.team_id === teamId);

  const handleToggleAssignee = (userId: string) => {
    setAssigneeIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      createTask({
        team_id: teamId,
        sprint_id: sprintId || null,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: sprintId ? status : 'BACKLOG',
        due_date: dueDate || null,
        story_points: Number(storyPoints),
        assignee_ids: assigneeIds,
      });

      // Reset & close
      setTitle('');
      setDescription('');
      setAssigneeIds([]);
      setStoryPoints(3);
      setDueDate('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create task');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New SEDS Task"
      description="Create a work item, assign aerospace engineers, and schedule in active sprint."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Team Selector (Office Bearer only) */}
        {isOfficeBearer && (
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">TEAM / SUBSYSTEM</label>
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setSprintId(null);
                setAssigneeIds([]);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">TASK TITLE *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build telemetry dashboard"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">DESCRIPTION & SPECS</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Technical details, acceptance criteria, or hardware dependencies..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Sprint & Story Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">SPRINT</label>
            <select
              value={sprintId || ''}
              onChange={(e) => setSprintId(e.target.value ? e.target.value : null)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Move to Backlog</option>
              {teamSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">STORY POINTS (ESTIMATE)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={storyPoints}
              onChange={(e) => setStoryPoints(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">PRIORITY</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">DUE DATE</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Assignees (Multi-select Collaborative Tasks) */}
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1.5 flex items-center justify-between">
            <span>ASSIGN ENGINEERS (COLLABORATIVE)</span>
            <span className="text-[10px] text-indigo-400">{assigneeIds.length} selected</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800">
            {teamMembers.map(member => {
              const isSelected = assigneeIds.includes(member.id);
              return (
                <div
                  key={member.id}
                  onClick={() => handleToggleAssignee(member.id)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer border text-xs transition-colors ${
                    isSelected 
                      ? 'bg-indigo-950/70 border-indigo-600/70 text-indigo-200' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <UserAvatar user={member} size="xs" />
                  <div className="truncate flex-1">
                    <div className="font-medium truncate text-white">{member.full_name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{member.title || member.role}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent div
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shadow-indigo-950 transition-colors"
          >
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
