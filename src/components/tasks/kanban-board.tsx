'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { TaskStatus, Task } from '@/types/database';
import { PriorityBadge } from '@/components/ui/badges';
import { AvatarGroup } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { 
  Plus, MessageSquare, Calendar, 
  Search, CheckCheck, CheckCircle2, History, 
  Kanban, RotateCcw, Award, Users, Layers, ArrowUpRight,
  Filter, X
} from 'lucide-react';
import { TaskCreateModal } from './task-create-modal';
import { TaskDetailDrawer } from './task-detail-drawer';

const COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', dotColor: 'bg-gray-400' },
  { id: 'TODO', label: 'To Do', dotColor: 'bg-sky-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-blue-600' },
  { id: 'IN_REVIEW', label: 'In Review', dotColor: 'bg-purple-600' },
  { id: 'COMPLETED', label: 'Completed', dotColor: 'bg-emerald-600' },
  { id: 'BLOCKED', label: 'Blocked', dotColor: 'bg-red-600' },
];

export const KanbanBoard: React.FC = () => {
  const { 
    currentUser, teams, visibleTasks, 
    updateTaskStatus, verifyTask, unverifyTask 
  } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isTeamLead = Permissions.isTeamLead(currentUser);
  const isMember = currentUser.role === 'TEAM_MEMBER';

  // View state: 'board' for Active Kanban Board, 'history' for Task History
  const [activeView, setActiveView] = useState<'board' | 'history'>('board');

  // Filters
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    isOfficeBearer ? 'ALL' : currentUser.team_id || teams[0]?.id || ''
  );
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);

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
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [visibleTasks, selectedTeamId, selectedPriority, searchQuery]);

  // Active Board Tasks: Only tasks that are NOT yet verified
  const boardTasks = useMemo(() => {
    return filteredTasks.filter(t => !t.is_verified);
  }, [filteredTasks]);

  // Task History Tasks: Verified tasks
  const historyTasks = useMemo(() => {
    return filteredTasks
      .filter(t => t.is_verified)
      .sort((a, b) => {
        const dateA = a.verified_at ? new Date(a.verified_at).getTime() : 0;
        const dateB = b.verified_at ? new Date(b.verified_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [filteredTasks]);

  // Overall counts for badges
  const totalActiveBoardTasksCount = useMemo(() => {
    return visibleTasks.filter(t => !t.is_verified).length;
  }, [visibleTasks]);

  const totalVerifiedHistoryCount = useMemo(() => {
    return visibleTasks.filter(t => t.is_verified).length;
  }, [visibleTasks]);

  // Summary Metrics for Task History
  const historyStats = useMemo(() => {
    const totalPoints = historyTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
    const uniqueEngineers = new Set<string>();
    const uniqueTeams = new Set<string>();

    historyTasks.forEach(t => {
      (t.assignee_ids || []).forEach(id => uniqueEngineers.add(id));
      if (t.team_id) uniqueTeams.add(t.team_id);
    });

    return {
      totalDeliverables: historyTasks.length,
      totalPoints,
      engineersCount: uniqueEngineers.size,
      teamsCount: uniqueTeams.size,
    };
  }, [historyTasks]);

  const hasActiveFilters = selectedPriority !== 'ALL' || (isOfficeBearer && selectedTeamId !== 'ALL') || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedPriority('ALL');
    if (isOfficeBearer) setSelectedTeamId('ALL');
    setSearchQuery('');
  };

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

  const handleVerifyTask = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    try {
      setVerifyingTaskId(task.id);
      await verifyTask(task.id);
    } finally {
      setVerifyingTaskId(null);
    }
  };

  const handleUnverifyTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await unverifyTask(taskId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Upper Header: Title, Description, View Switcher & Primary Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
              {isMember ? 'Restricted Member Scope' : 'Engineering Task Operations'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {activeView === 'board' ? 'Task Operations Board' : 'Deliverables & Task History'}
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            {activeView === 'board'
              ? 'Real-time aerospace task board. When completed deliverables are verified, they are removed from the board and archived to Task History.'
              : 'Permanent audit archive of completed and verified engineering deliverables across SEDS subsystems.'}
          </p>
        </div>

        {/* View Switcher and Create Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Board vs Task History Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'board'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-blue-600" />
              <span>Active Board</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-bold">
                {totalActiveBoardTasksCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-emerald-600" />
              <span>Task History</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {totalVerifiedHistoryCount}
              </span>
            </button>
          </div>

          {/* Create Task Button (Leads & Office Bearers) */}
          {(isTeamLead || isOfficeBearer) && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Lower Toolbar: Search and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables by title or description..."
              className="w-full bg-gray-50/60 border border-gray-200 hover:border-gray-300 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Team Filter (Office Bearers only) */}
          {isOfficeBearer && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline">Team:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="bg-gray-50/60 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="ALL">All Subsystems</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-gray-50/60 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-hidden focus:bg-white focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Filter Count & Reset */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
          <span className="text-xs text-gray-500 font-mono">
            {activeView === 'board' ? `${boardTasks.length} active` : `${historyTasks.length} verified`}
          </span>
        </div>
      </div>

      {/* VIEW 1: ACTIVE KANBAN BOARD */}
      {activeView === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[620px]">
          {COLUMNS.map(col => {
            const colTasks = boardTasks.filter(t => t.status === col.id);
            const totalPoints = colTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-[290px] shrink-0 bg-gray-50/80 border border-gray-200/90 rounded-2xl flex flex-col min-h-[550px] transition-colors shadow-2xs ${
                  draggedTaskId ? 'hover:border-blue-400 hover:bg-blue-50/20' : ''
                }`}
              >
                {/* Column Header */}
                <div className="px-3.5 py-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dotColor}`} />
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                      {colTasks.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-400 shrink-0 ml-2">
                    {totalPoints} pts
                  </span>
                </div>

                {/* Task Cards Container */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[70vh]">
                  {colTasks.length === 0 ? (
                    col.id === 'COMPLETED' && totalVerifiedHistoryCount > 0 ? (
                      /* Dedicated Empty State for Completed column when tasks have been verified into History */
                      <div className="py-10 px-4 flex flex-col items-center justify-center text-center border border-dashed border-emerald-200 bg-emerald-50/30 rounded-xl space-y-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                          <CheckCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">All Deliverables Verified</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Archived into Task History</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveView('history')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          <span>View History ({totalVerifiedHistoryCount})</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-center text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-xl bg-white/40">
                        No tasks
                      </div>
                    )
                  ) : (
                    colTasks.map(task => {
                      const canDrag = Permissions.canUpdateTaskStatus(currentUser, task);
                      const isCollaborative = task.assignee_ids.length > 1;
                      const canVerify = Permissions.canVerifyTask(currentUser, task);
                      const isVerifying = verifyingTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable={canDrag}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`p-3.5 bg-white border border-gray-200 hover:border-blue-400 rounded-xl shadow-2xs hover:shadow-xs transition-all cursor-pointer group ${
                            draggedTaskId === task.id ? 'opacity-40' : ''
                          } ${task.status === 'COMPLETED' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/10' : ''}`}
                        >
                          {/* Priority & Story Points */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <PriorityBadge priority={task.priority} size="sm" />
                            <span className="text-[10px] font-mono font-medium text-gray-600 px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                              {task.story_points} pts
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                            {task.title}
                          </h4>

                          {/* Subsystem & Sprint info */}
                          <div className="text-[11px] text-gray-400 mt-1 truncate">
                            {task.team_name}
                            {task.sprint_name && ` • ${task.sprint_name}`}
                          </div>

                          {/* Card Footer: Due Date, Collaborative Indicator, Assignees */}
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-gray-500 gap-2">
                            <div className="flex items-center gap-2 text-[11px]">
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-gray-500 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span>{formatDate(task.due_date)}</span>
                                </div>
                              )}
                              {task.comments_count > 0 && (
                                <div className="flex items-center gap-0.5 text-gray-500">
                                  <MessageSquare className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span>{task.comments_count}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCollaborative && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  Collab
                                </span>
                              )}
                              <AvatarGroup users={task.assignees} size="xs" max={2} />
                            </div>
                          </div>

                          {/* Verification Bar for Completed Deliverables */}
                          {task.status === 'COMPLETED' && (
                            <div className="mt-2.5 pt-2 border-t border-emerald-100/90 flex items-center justify-between gap-1.5 -mx-3.5 -mb-3.5 px-3.5 py-2 bg-emerald-50/60 rounded-b-xl">
                              <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Completed</span>
                              </span>
                              {canVerify ? (
                                <button
                                  type="button"
                                  disabled={isVerifying}
                                  onClick={(e) => handleVerifyTask(e, task)}
                                  title="Verify deliverable and move to Task History"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50 hover:shadow-xs active:scale-95"
                                >
                                  <CheckCheck className="w-3 h-3" />
                                  <span>{isVerifying ? 'Verifying...' : 'Verify'}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">
                                  Awaiting Lead verification
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: VERIFIED TASK HISTORY */}
      {activeView === 'history' && (
        <div className="space-y-6">
          {/* History KPI Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Verified Tasks
                </span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {historyStats.totalDeliverables}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">Stored in History</span>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Story Points
                </span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {historyStats.totalPoints}
              </div>
              <span className="text-[10px] text-gray-500">Points delivered</span>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Engineers
                </span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {historyStats.engineersCount}
              </div>
              <span className="text-[10px] text-gray-500">Active contributors</span>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Subsystems
                </span>
                <Kanban className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {historyStats.teamsCount}
              </div>
              <span className="text-[10px] text-gray-500">Teams represented</span>
            </div>
          </div>

          {/* Historical Deliverables List */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Verified Deliverables Archive ({historyTasks.length})
                </h3>
              </div>
              <span className="text-xs text-gray-500">
                Tasks removed from active board upon Lead verification
              </span>
            </div>

            {historyTasks.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-sm font-semibold text-gray-700">No verified tasks found in history</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  When team members update tasks to &quot;Completed&quot; and a Team Lead or Office Bearer clicks &quot;Verify&quot;, 
                  those tasks are removed from the board and permanently preserved here.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('board')}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Return to Active Board
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyTasks.map(task => {
                  const canVerify = Permissions.canVerifyTask(currentUser, task);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-4 sm:p-5 hover:bg-gray-50/80 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        {/* Badges line */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                          <PriorityBadge priority={task.priority} size="sm" />
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                            {task.story_points} pts
                          </span>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {task.team_name}
                          </span>
                          {task.sprint_name && (
                            <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                              {task.sprint_name}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Verification metadata & Assignees */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              Verified by <span className="font-semibold text-gray-900">{task.verifier?.full_name || 'Team Lead'}</span>
                              {task.verified_at && ` on ${formatDate(task.verified_at)}`}
                            </span>
                          </div>

                          {task.due_date && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>Due {formatDate(task.due_date)}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400">Assignees:</span>
                            <AvatarGroup users={task.assignees} size="xs" max={3} />
                          </div>
                        </div>
                      </div>

                      {/* Right action controls */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {canVerify && (
                          <button
                            type="button"
                            onClick={(e) => handleUnverifyTask(e, task.id)}
                            title="Restore deliverable back to Active Board"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors font-medium shadow-2xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                            <span>Restore to Board</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 rounded-lg border border-blue-200 font-semibold transition-colors cursor-pointer"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
