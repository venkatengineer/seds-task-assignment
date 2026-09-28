'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { Modal } from '@/components/ui/modal';
import { TaskPriority, TaskStatus, TaskAssignmentType } from '@/types/database';
import { UserAvatar } from '@/components/ui/avatar';
import { AlertCircle, Users, Compass } from 'lucide-react';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
  defaultSprintId?: string | null;
  defaultAssignmentType?: TaskAssignmentType;
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  isOpen,
  onClose,
  defaultTeamId,
  defaultSprintId,
  defaultAssignmentType = 'DIRECT',
}) => {
  const { currentUser, teams, sprints, allProfiles, createTask } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const initialTeamId = defaultTeamId || currentUser.team_id || teams[0]?.id || '';
  
  const [assignmentType, setAssignmentType] = useState<TaskAssignmentType>(defaultAssignmentType);
  const [teamId, setTeamId] = useState(initialTeamId);
  const [sprintId, setSprintId] = useState<string | null>(defaultSprintId || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status] = useState<TaskStatus>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  // Open Task specific state
  const [skillsInput, setSkillsInput] = useState('');
  const [maxMembers, setMaxMembers] = useState<number>(1);
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Available team members for assignment
  const teamMembers = allProfiles.filter(p => p.team_id === teamId);
  const teamSprints = sprints.filter(s => s.team_id === teamId);

  const handleToggleAssignee = (userId: string) => {
    setAssigneeIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleAddSkillPill = (skill: string) => {
    const current = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(skill)) {
      setSkillsInput(current.length > 0 ? `${skillsInput}, ${skill}` : skill);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      const parsedSkills = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      createTask({
        team_id: teamId,
        sprint_id: sprintId || null,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: sprintId ? status : 'BACKLOG',
        due_date: dueDate || null,
        story_points: Number(storyPoints),
        assignee_ids: assignmentType === 'DIRECT' ? assigneeIds : [],
        assignment_type: assignmentType,
        open_task_status: assignmentType === 'OPEN' ? 'PUBLISHED' : undefined,
        max_assignees: assignmentType === 'OPEN' ? maxMembers : 1,
        requires_approval: assignmentType === 'OPEN' ? requiresApproval : false,
        skills: assignmentType === 'OPEN' ? parsedSkills : [],
      });

      // Reset & close
      setTitle('');
      setDescription('');
      setAssigneeIds([]);
      setSkillsInput('');
      setMaxMembers(1);
      setRequiresApproval(true);
      setStoryPoints(3);
      setDueDate('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New SEDS Task"
      description="Create a work item, assign aerospace engineers, and schedule in active sprint."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Assignment Mode Toggle */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assignment Mechanism</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAssignmentType('DIRECT')}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                assignmentType === 'DIRECT'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 ring-1 ring-blue-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className={`p-1.5 rounded-md ${assignmentType === 'DIRECT' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">Direct Assignment</div>
                <div className="text-[11px] text-gray-500">Assign to specific member(s)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentType('OPEN')}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-colors ${
                assignmentType === 'OPEN'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className={`p-1.5 rounded-md ${assignmentType === 'OPEN' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">Open Task (Auction)</div>
                <div className="text-[11px] text-gray-500">Publish for team discovery</div>
              </div>
            </button>
          </div>
        </div>

        {/* Team Selector (Office Bearer only) */}
        {isOfficeBearer && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Team / Subsystem</label>
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setSprintId(null);
                setAssigneeIds([]);
              }}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={assignmentType === 'OPEN' ? 'e.g. Build SEDS Event Registration Page' : 'e.g. Build telemetry dashboard'}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Description & Requirements</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Technical details, acceptance criteria, or hardware dependencies..."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 resize-none"
          />
        </div>

        {/* Sprint & Story Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sprint</label>
            <select
              value={sprintId || ''}
              onChange={(e) => setSprintId(e.target.value ? e.target.value : null)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="">Move to Backlog</option>
              {teamSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Story Points (Estimate)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={storyPoints}
              onChange={(e) => setStoryPoints(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline / Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        {/* Dynamic Section: Direct Assignment vs Open Task Configuration */}
        {assignmentType === 'DIRECT' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>Assign Engineers (Collaborative)</span>
              <span className="text-[11px] text-blue-600 font-medium">{assigneeIds.length} selected</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1.5 bg-gray-50 rounded-lg border border-gray-200">
              {teamMembers.map(member => {
                const isSelected = assigneeIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleAssignee(member.id)}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border text-xs transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-300 text-blue-900' 
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <UserAvatar user={member} size="sm" />
                    <div className="truncate flex-1">
                      <div className="font-semibold truncate text-gray-900">{member.full_name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{member.title || member.role}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3.5 bg-amber-50/50 border border-amber-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Required Skills & Tags (Comma-Separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. Frontend, React, UI/UX"
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-amber-500"
              />
              {/* Quick tags */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['React', 'UI/UX', 'Frontend', 'Python', 'CAD', 'CFD', 'OpenRocket', 'RF Engineering', 'MATLAB'].map(pill => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleAddSkillPill(pill)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors"
                  >
                    + {pill}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Maximum Members (Capacity)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-amber-500 font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">Up to this many members can be assigned</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Lead Approval Configuration
                </label>
                <div 
                  onClick={() => setRequiresApproval(!requiresApproval)}
                  className="flex items-center gap-2 p-2 bg-white border border-amber-200 rounded-lg cursor-pointer hover:border-amber-300 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-0"
                  />
                  <div className="text-[11px] leading-tight text-gray-800">
                    {requiresApproval ? (
                      <span className="text-amber-800 font-semibold">Team Lead approval required</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">Instant auto-claim</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  {requiresApproval ? 'Applicants submit pitch for review' : 'First member to click claims task'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
              assignmentType === 'OPEN'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {assignmentType === 'OPEN' ? (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span>Publish Open Task</span>
              </>
            ) : (
              <span>Create Task</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
