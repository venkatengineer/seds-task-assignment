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

  // Selected Sprint (defaults to ACTIVE or first planned)
  const [selectedSprintId, setSelectedSprintId] = useState<string>(() => {
    const active = teamSprints.find(s => s.status === 'ACTIVE');
    return active ? active.id : (teamSprints[0]?.id || '');
  });

  const currentSprint = useMemo(() => {
    return teamSprints.find(s => s.id === selectedSprintId) || teamSprints[0];
  }, [teamSprints, selectedSprintId]);

  // Backlog tasks (team tasks with sprint_id === null)
  const backlogTasks = useMemo(() => {
    return tasks.filter(t => t.team_id === selectedTeamId && (!t.sprint_id || t.status === 'BACKLOG'));
  }, [tasks, selectedTeamId]);

  // Sprint tasks (tasks for this sprint)
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded">
              SPRINT PLANNING ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Subsystem Sprint Planning
          </h1>
          <p className="text-xs text-slate-400 mt-1">
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
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Sprint Info Banner & Lifecycle Controls */}
      {currentSprint ? (
        <div className="p-5 bg-[#0e111b] border border-[#20273f] rounded-2xl shadow-xl space-y-4 glow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                {/* Sprint Selector */}
                <select
                  value={currentSprint.id}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-sm font-bold text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                >
                  {teamSprints.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
                <SprintStatusBadge status={currentSprint.status} />
              </div>
              <p className="text-xs text-slate-300 italic pt-1">
                Goal: "{currentSprint.goal}"
              </p>
            </div>

            {/* Lifecycle Buttons (Start / Complete) */}
            {canManage && (
              <div className="flex items-center gap-2">
                {currentSprint.status === 'PLANNED' && (
                  <button
                    onClick={handleStartSprint}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Sprint</span>
                  </button>
                )}

                {currentSprint.status === 'ACTIVE' && (
                  <button
                    onClick={handleCompleteSprint}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Sprint</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar & Telemetry */}
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Burn Progress</span>
                <span className="text-white font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">TIME WINDOW</span>
              <span className="text-slate-200">
                {formatDate(currentSprint.start_date)} - {formatDate(currentSprint.end_date)}
              </span>
            </div>

            <div className="text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">STORY POINTS</span>
              <span className="text-slate-200">
                {completedPoints} / {totalPoints} committed pts
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#0e111a] border border-slate-800 rounded-xl text-slate-400 text-xs">
          No sprints created for this subsystem yet. Click "Create Sprint" above to begin.
        </div>
      )}

      {/* Two Columns: Backlog vs Sprint Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* BACKLOG COLUMN */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToBacklog}
          className="bg-[#0b0d14] border border-[#1d2338] rounded-2xl p-4 shadow-lg flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#181d2f] mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider">
                BACKLOG
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {backlogTasks.length} tasks
              </span>
            </div>

            {canManage && (
              <button
                onClick={() => {
                  setTaskModalSprintId(null);
                  setIsTaskModalOpen(true);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[65vh]">
            {backlogTasks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-center text-slate-600 text-xs italic border border-dashed border-slate-800/80 rounded-xl">
                Backlog is empty. Add tasks or drop items here.
              </div>
            ) : (
              backlogTasks.map(task => (
                <div
                  key={task.id}
                  draggable={canManage}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3 bg-[#0f121d] border border-[#21273c] hover:border-indigo-500/60 rounded-xl shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={task.priority} size="sm" />
                      <span className="text-[10px] font-mono text-slate-400">
                        {task.story_points} pts
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
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
                      className="p-2 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 transition-colors shrink-0"
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
          className="bg-[#0b0d14] border border-[#1d2338] rounded-2xl p-4 shadow-lg flex flex-col min-h-[500px]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#181d2f] mb-3">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wider">
                {currentSprint ? currentSprint.name : 'SPRINT'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {sprintTasks.length} committed ({totalPoints} pts)
              </span>
            </div>

            {canManage && currentSprint && (
              <button
                onClick={() => {
                  setTaskModalSprintId(currentSprint.id);
                  setIsTaskModalOpen(true);
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[65vh]">
            {sprintTasks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-center text-slate-600 text-xs italic border border-dashed border-slate-800/80 rounded-xl">
                No tasks in this sprint. Drag tasks from Backlog or click "+ Add Task".
              </div>
            ) : (
              sprintTasks.map(task => (
                <div
                  key={task.id}
                  draggable={canManage}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3 bg-[#0f121d] border border-[#21273c] hover:border-indigo-500/60 rounded-xl shadow-xs transition-all cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TaskStatusBadge status={task.status} size="sm" />
                      <PriorityBadge priority={task.priority} size="sm" />
                      <span className="text-[10px] font-mono text-slate-400">
                        {task.story_points} pts
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <AvatarGroup users={task.assignees} size="xs" />
                      <span className="text-[10px] font-mono text-slate-400 truncate">
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
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors shrink-0"
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
