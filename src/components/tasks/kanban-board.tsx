'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { TaskStatus } from '@/types/database';
import { PriorityBadge } from '@/components/ui/badges';
import { AvatarGroup } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { 
  Plus, MessageSquare, Calendar, 
  Search 
} from 'lucide-react';
import { TaskCreateModal } from './task-create-modal';
import { TaskDetailDrawer } from './task-detail-drawer';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-700' },
  { id: 'TODO', label: 'To Do', color: 'border-sky-700/60' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-indigo-600/70' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'border-purple-600/70' },
  { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-600/70' },
  { id: 'BLOCKED', label: 'Blocked', color: 'border-rose-600/80' },
];

export const KanbanBoard: React.FC = () => {
  const { 
    currentUser, teams, visibleTasks, 
    updateTaskStatus 
  } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isTeamLead = Permissions.isTeamLead(currentUser);
  const isMember = currentUser.role === 'TEAM_MEMBER';

  // Filters
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    isOfficeBearer ? 'ALL' : currentUser.team_id || teams[0]?.id || ''
  );
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Filter tasks based on selected criteria and role visibility
  const filteredTasks = useMemo(() => {
    return visibleTasks.filter(task => {
      if (selectedTeamId !== 'ALL' && task.team_id !== selectedTeamId) {
        return false;
      }
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [visibleTasks, selectedTeamId, selectedPriority, searchQuery]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    const task = visibleTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Check permission to update
    if (!Permissions.canUpdateTaskStatus(currentUser, task)) {
      e.preventDefault();
      return;
    }

    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      updateTaskStatus(taskId, columnId);
      setDraggedTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded">
              {isMember ? 'RESTRICTED MEMBER SCOPE' : 'SUBSYSTEM TASK BOARD'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isMember ? 'My Tasks & Permitted Board' : 'Task Operations Board'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isMember
              ? 'Displaying only your assigned and collaborative tasks. Drag permitted tasks to update status.'
              : 'Interactive 6-column aerospace Kanban board with real-time sync and drag-and-drop state transitions.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Team Filter (Office Bearers only) */}
          {isOfficeBearer && (
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48"
            />
          </div>

          {/* Create Task Button (Leads & Office Bearers) */}
          {(isTeamLead || isOfficeBearer) && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4 items-start min-h-[600px]">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          const totalPoints = colTasks.reduce((acc, t) => acc + t.story_points, 0);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-[#0a0c14] border border-[#1c2236] rounded-xl flex flex-col min-h-[500px] transition-colors ${
                draggedTaskId ? 'hover:border-indigo-500/50 hover:bg-[#0e111d]' : ''
              }`}
            >
              {/* Column Header */}
              <div className={`p-3 border-b border-[#181d2f] flex items-center justify-between ${col.color}`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                    {colTasks.length}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {totalPoints} pts
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[70vh]">
                {colTasks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-center text-slate-600 text-xs italic border border-dashed border-slate-800/60 rounded-lg">
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => {
                    const canDrag = Permissions.canUpdateTaskStatus(currentUser, task);
                    const isCollaborative = task.assignee_ids.length > 1;

                    return (
                      <div
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`p-3 bg-[#0f121d] border border-[#22283e] hover:border-indigo-500/60 rounded-lg shadow-xs hover:shadow-indigo-950/40 transition-all cursor-pointer group ${
                          draggedTaskId === task.id ? 'opacity-40' : ''
                        }`}
                      >
                        {/* Priority & Story Points */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <PriorityBadge priority={task.priority} size="sm" />
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {task.story_points} pts
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-relaxed">
                          {task.title}
                        </h4>

                        {/* Team and Sprint tags */}
                        <div className="text-[10px] font-mono text-slate-400 mt-1.5 truncate">
                          {task.team_name}
                          {task.sprint_name && ` • ${task.sprint_name}`}
                        </div>

                        {/* Card Footer: Due Date, Collaborative Indicator, Assignees */}
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-slate-400">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{formatDate(task.due_date)}</span>
                              </div>
                            )}
                            {task.comments_count > 0 && (
                              <div className="flex items-center gap-0.5 text-slate-400">
                                <MessageSquare className="w-3 h-3 text-slate-500" />
                                <span>{task.comments_count}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isCollaborative && (
                              <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950 px-1 rounded">
                                Collab
                              </span>
                            )}
                            <AvatarGroup users={task.assignees} size="xs" max={2} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultTeamId={selectedTeamId !== 'ALL' ? selectedTeamId : undefined}
      />
    </div>
  );
};
