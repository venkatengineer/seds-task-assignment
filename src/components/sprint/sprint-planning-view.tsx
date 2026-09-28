'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { SprintStatusBadge, TaskStatusBadge, PriorityBadge } from '@/components/ui/badges';
import { AvatarGroup } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { 
  Plus, Flag, Play, CheckCircle2, ArrowRight, ArrowLeft, 
  Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SprintCreateModal } from './sprint-create-modal';
import { TaskCreateModal } from '@/components/tasks/task-create-modal';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';

export const SprintPlanningView: React.FC = () => {
  const { 
    currentUser, teams, sprints, tasks, 
    startSprint, completeSprint, moveTaskToSprint 
  } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isTeamLead = Permissions.isTeamLead(currentUser);
  const canManage = isOfficeBearer || isTeamLead;

  // Selected Team
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    currentUser.team_id || teams[0]?.id || ''
  );

  // Available sprints for this team
  const teamSprints = useMemo(() => {
    return sprints.filter(s => s.team_id === selectedTeamId);
  }, [sprints, selectedTeamId]);

  // Selected Sprint
  const [selectedSprintId, setSelectedSprintId] = useState<string>(() => {
    const active = teamSprints.find(s => s.status === 'ACTIVE');
    return active ? active.id : (teamSprints[0]?.id || '');
  });

  const currentSprint = useMemo(() => {
    return teamSprints.find(s => s.id === selectedSprintId) || teamSprints[0];
  }, [teamSprints, selectedSprintId]);

  // Backlog tasks
  const backlogTasks = useMemo(() => {
    return tasks.filter(t => t.team_id === selectedTeamId && (!t.sprint_id || t.status === 'BACKLOG'));
  }, [tasks, selectedTeamId]);

  // Sprint tasks
  const sprintTasks = useMemo(() => {
    if (!currentSprint) return [];
    return tasks.filter(t => t.sprint_id === currentSprint.id);
  }, [tasks, currentSprint]);

  // Modals state
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalSprintId, setTaskModalSprintId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Metrics for current sprint
  const totalPoints = sprintTasks.reduce((acc, t) => acc + t.story_points, 0);
  const completedTasks = sprintTasks.filter(t => t.status === 'COMPLETED');
  const completedPoints = completedTasks.reduce((acc, t) => acc + t.story_points, 0);
  const progressPercent = sprintTasks.length > 0 
    ? Math.round((completedTasks.length / sprintTasks.length) * 100) 
    : 0;

  const handleStartSprint = () => {
    if (!currentSprint || !canManage) return;
    startSprint(currentSprint.id);
  };

  const handleCompleteSprint = () => {
    if (!currentSprint || !canManage) return;
    completeSprint(currentSprint.id);
    
    // Celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canManage) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropToSprint = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canManage || !currentSprint) return;
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTaskToSprint(taskId, currentSprint.id);
      setDraggedTaskId(null);
    }
  };

  const handleDropToBacklog = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTaskToSprint(taskId, null);
      setDraggedTaskId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
              Sprint Planning Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Subsystem Sprint Planning
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage backlog deliverables, assign story points, and commit milestones to active sprint.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team Switcher (Office Bearer only) */}
          {isOfficeBearer && (
            <select
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                const firstSprint = sprints.find(s => s.team_id === e.target.value);
                setSelectedSprintId(firstSprint?.id || '');
              }}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:border-blue-500 font-medium"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* New Sprint Button */}
          {canManage && (
            <button
              onClick={() => setIsSprintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Sprint Info Banner & Lifecycle Controls */}
      {currentSprint ? (
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {/* Sprint Selector */}
                <select
                  value={currentSprint.id}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="bg-white border border-gray-200 text-sm font-bold text-gray-900 rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-blue-500"
                >
                  {teamSprints.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
                <SprintStatusBadge status={currentSprint.status} />
              </div>
              <p className="text-xs text-gray-600 italic pt-1">
                Goal: &quot;{currentSprint.goal}&quot;
              </p>
            </div>

            {/* Lifecycle Buttons (Start / Complete) */}
            {canManage && (
              <div className="flex items-center gap-2">
                {currentSprint.status === 'PLANNED' && (
                  <button
                    onClick={handleStartSprint}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Sprint</span>
                  </button>
                )}

                {currentSprint.status === 'ACTIVE' && (
                  <button
                    onClick={handleCompleteSprint}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Sprint</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar & Telemetry */}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Committed Progress</span>
                <span className="text-gray-900 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-xs">
              <span className="text-gray-500 block text-[11px] font-semibold uppercase tracking-wider">Time Window</span>
              <span className="text-gray-900 font-medium">
                {formatDate(currentSprint.start_date)} - {formatDate(currentSprint.end_date)}
              </span>
            </div>

            <div className="text-xs">
              <span className="text-gray-500 block text-[11px] font-semibold uppercase tracking-wider">Story Points</span>
              <span className="text-gray-900 font-medium">
                {completedPoints} / {totalPoints} committed pts
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-xl text-gray-500 text-xs">
          No sprints created for this subsystem yet. Click &quot;Create Sprint&quot; above to begin.
        </div>
      )}

      {/* Two Columns: Backlog vs Sprint Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* BACKLOG COLUMN */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToBacklog}
          className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Backlog
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200">
                {backlogTasks.length} tasks
              </span>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  setTaskModalSprintId(null);
                  setIsTaskModalOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[65vh]">
            {backlogTasks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-center text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-xl">
                Backlog is empty. Add tasks or drop items here.
              </div>
            ) : (
              backlogTasks.map(task => (
                <div
                  key={task.id}
                  draggable={canManage}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3 bg-white border border-gray-200 hover:border-blue-400 rounded-lg shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={task.priority} size="sm" />
                      <span className="text-[10px] font-mono text-gray-500">
                        {task.story_points} pts
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {task.title}
                    </h4>
                  </div>

                  {/* Move to Sprint Action button */}
                  {canManage && currentSprint && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskToSprint(task.id, currentSprint.id);
                      }}
                      title={`Move into ${currentSprint.name}`}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 transition-colors shrink-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* TARGET SPRINT COLUMN */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToSprint}
          className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                {currentSprint ? currentSprint.name : 'Sprint'}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {sprintTasks.length} committed ({totalPoints} pts)
              </span>
            </div>

            {canManage && currentSprint && (
              <button
                onClick={() => {
                  setTaskModalSprintId(currentSprint.id);
                  setIsTaskModalOpen(true);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[65vh]">
            {sprintTasks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-center text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-xl">
                No tasks in this sprint. Drag tasks from Backlog or click &quot;+ Add Task&quot;.
              </div>
            ) : (
              sprintTasks.map(task => (
                <div
                  key={task.id}
                  draggable={canManage}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3 bg-white border border-gray-200 hover:border-blue-400 rounded-lg shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TaskStatusBadge status={task.status} size="sm" />
                      <PriorityBadge priority={task.priority} size="sm" />
                      <span className="text-[10px] font-mono text-gray-500">
                        {task.story_points} pts
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <AvatarGroup users={task.assignees} size="xs" />
                      <span className="text-[10px] text-gray-500 truncate">
                        {task.assignees.map(a => a.full_name.split(' ')[0]).join(', ') || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Move back to Backlog Action button */}
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskToSprint(task.id, null);
                      }}
                      title="Move back to Backlog"
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sprint Create Modal */}
      <SprintCreateModal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        defaultTeamId={selectedTeamId}
      />

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultTeamId={selectedTeamId}
        defaultSprintId={taskModalSprintId}
      />

      {/* Task Details Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
};
