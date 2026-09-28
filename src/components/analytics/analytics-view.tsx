'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  BarChart3, TrendingDown, 
  Zap, Filter 
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { currentUser, teams, tasks, sprints, allProfiles } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);

  // Selected team filter
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    isOfficeBearer ? 'ALL' : currentUser.team_id || teams[0]?.id || ''
  );

  // Filter tasks based on selection and user permissions
  const relevantTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedTeamId !== 'ALL' && t.team_id !== selectedTeamId) {
        return false;
      }
      if (currentUser.role === 'TEAM_MEMBER') {
        return t.team_id === currentUser.team_id;
      }
      return true;
    });
  }, [tasks, selectedTeamId, currentUser]);

  // Filter sprints based on selection and user permissions
  const relevantSprints = useMemo(() => {
    return sprints.filter(s => {
      if (selectedTeamId !== 'ALL' && s.team_id !== selectedTeamId) {
        return false;
      }
      if (currentUser.role === 'TEAM_MEMBER') {
        return s.team_id === currentUser.team_id;
      }
      return true;
    });
  }, [sprints, selectedTeamId, currentUser]);

  // Selected sprint for Burndown tracking
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');

  const currentSprint = useMemo(() => {
    if (selectedSprintId) {
      const match = relevantSprints.find(s => s.id === selectedSprintId);
      if (match) return match;
    }
    // Default to active sprint, or first available sprint
    return relevantSprints.find(s => s.status === 'ACTIVE') || relevantSprints[0] || null;
  }, [relevantSprints, selectedSprintId]);

  // Overall counts (computed strictly from real tasks)
  const totalTasksCount = relevantTasks.length;
  const completedTasks = relevantTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = relevantTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewTasks = relevantTasks.filter(t => t.status === 'IN_REVIEW').length;
  const todoTasks = relevantTasks.filter(t => t.status === 'TODO').length;
  const blockedTasks = relevantTasks.filter(t => t.status === 'BLOCKED').length;
  const backlogTasks = relevantTasks.filter(t => t.status === 'BACKLOG').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = relevantTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED').length;
  
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;

  const totalPoints = relevantTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
  const completedPoints = relevantTasks
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + (t.story_points || 0), 0);

  // Task Status Distribution Chart Data
  const statusData = [
    { name: 'To Do', count: todoTasks, fill: '#60A5FA' },
    { name: 'In Progress', count: inProgressTasks, fill: '#2563EB' },
    { name: 'In Review', count: inReviewTasks, fill: '#8B5CF6' },
    { name: 'Completed', count: completedTasks, fill: '#10B981' },
    { name: 'Blocked', count: blockedTasks, fill: '#EF4444' },
    { name: 'Backlog', count: backlogTasks, fill: '#9CA3AF' },
  ];

  // Real Burndown Chart Calculation derived from actual sprint tasks and completion dates
  const burndownData = useMemo(() => {
    if (!currentSprint) return [];

    const sprintTasks = tasks.filter(t => t.sprint_id === currentSprint.id);
    const sprintTotalPoints = sprintTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);

    if (sprintTotalPoints === 0 && sprintTasks.length === 0) {
      return [];
    }

    const startDate = new Date(currentSprint.start_date);
    const endDate = new Date(currentSprint.end_date);
    const now = new Date();

    const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const stepCount = Math.min(diffDays + 1, 8); // At most 8 checkpoints for clear rendering

    const result: { day: string; ideal: number; actual: number | null }[] = [];

    for (let i = 0; i < stepCount; i++) {
      const fraction = i / (stepCount - 1);
      const dayOffset = Math.round(fraction * diffDays);
      const pointDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

      const dayLabel = i === 0 ? 'Start' : (i === stepCount - 1 ? 'End' : `Day ${dayOffset}`);
      const idealBurn = Math.max(0, Math.round(sprintTotalPoints * (1 - fraction)));

      // If checkpoint is in future for an active sprint, actual line is null
      if (pointDate > now && i > 0 && currentSprint.status === 'ACTIVE') {
        result.push({
          day: dayLabel,
          ideal: idealBurn,
          actual: null,
        });
      } else {
        const completedPointsOnOrBefore = sprintTasks
          .filter(t => t.status === 'COMPLETED' && new Date(t.updated_at) <= pointDate)
          .reduce((sum, t) => sum + (t.story_points || 0), 0);

        result.push({
          day: dayLabel,
          ideal: idealBurn,
          actual: Math.max(0, sprintTotalPoints - completedPointsOnOrBefore),
        });
      }
    }

    return result;
  }, [currentSprint, tasks]);

  // Workload by Member Data (derived strictly from real assigned tasks)
  const teamEngineers = useMemo(() => {
    return allProfiles.filter(p => {
      if (selectedTeamId !== 'ALL') return p.team_id === selectedTeamId;
      return p.role !== 'OFFICE_BEARER' && p.role !== 'ADMIN';
    });
  }, [allProfiles, selectedTeamId]);

  const workloadData = useMemo(() => {
    return teamEngineers
      .map(member => {
        const assigned = relevantTasks.filter(t => t.assignee_ids.includes(member.id));
        const points = assigned.reduce((acc, t) => acc + (t.story_points || 0), 0);
        return {
          name: member.full_name.split(' ')[0],
          tasks: assigned.length,
          points: points,
        };
      })
      .slice(0, 8);
  }, [teamEngineers, relevantTasks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
              Performance & Velocity
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SEDS Analytics & Metrics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real sprint burn rates, task distribution models, and team delivery velocity.
          </p>
        </div>

        {/* Subsystem Filter */}
        {isOfficeBearer && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium shadow-xs"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-gray-500 block uppercase font-medium">TOTAL TASKS</span>
          <span className="text-2xl font-bold font-mono text-gray-900 mt-1 block">{totalTasksCount}</span>
          <span className="text-[10px] text-gray-400 font-mono">Assigned & Backlog</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-emerald-600 block uppercase font-medium">COMPLETED</span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">{completedTasks}</span>
          <span className="text-[10px] text-emerald-600 font-mono">{completionPercentage}% rate</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-blue-600 block uppercase font-medium">POINTS BURNED</span>
          <span className="text-2xl font-bold font-mono text-blue-600 mt-1 block">{completedPoints}</span>
          <span className="text-[10px] text-gray-400 font-mono">of {totalPoints} total pts</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-sky-600 block uppercase font-medium">IN PROGRESS</span>
          <span className="text-2xl font-bold font-mono text-sky-600 mt-1 block">{inProgressTasks}</span>
          <span className="text-[10px] text-gray-400 font-mono">Active tasks</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-amber-600 block uppercase font-medium">OVERDUE</span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">{overdueTasks}</span>
          <span className="text-[10px] text-amber-600 font-mono">Requires attention</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] font-mono text-rose-600 block uppercase font-medium">BLOCKED</span>
          <span className="text-2xl font-bold font-mono text-rose-600 mt-1 block">{blockedTasks}</span>
          <span className="text-[10px] text-rose-500 font-mono">Impediments logged</span>
        </div>
      </div>

      {/* Main Charts: Burndown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Burndown Chart */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-600" />
                <span>Sprint Burndown (Story Points)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentSprint ? `Live burndown for ${currentSprint.name}` : 'Ideal linear burn line vs actual remaining points.'}
              </p>
            </div>
            {relevantSprints.length > 0 && (
              <select
                value={currentSprint?.id || ''}
                onChange={(e) => setSelectedSprintId(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500"
              >
                {relevantSprints.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {burndownData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ideal"
                    name="Ideal Burn"
                    stroke="#9CA3AF"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual Remaining"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563EB' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              <TrendingDown className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-700">No Sprint Burndown Data</p>
              <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                {relevantSprints.length === 0 
                  ? 'No sprints found for this team. Create a sprint in Sprint Management to view live burndown metrics.'
                  : 'No tasks with story points assigned to this sprint yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Task Status Distribution Bar Chart */}
        <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Task Distribution by Status</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Breakdown across workflow states.
              </p>
            </div>
          </div>

          {totalTasksCount > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-semibold text-gray-700">No Tasks Recorded</p>
              <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                Tasks created and tracked in sprints will display their status distribution here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Member Workload Distribution Chart */}
      <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span>Workload Allocation by Member (Story Points)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Assigned story points per team member.
            </p>
          </div>
        </div>

        {workloadData.length > 0 && workloadData.some(m => m.points > 0 || m.tasks > 0) ? (
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="points" name="Story Points" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-60 flex flex-col items-center justify-center text-center p-6 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
            <Zap className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-700">No Workload Assigned</p>
            <p className="text-[11px] text-gray-500 max-w-xs mt-1">
              Assign tasks with story points to engineers to see capacity and workload distribution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
