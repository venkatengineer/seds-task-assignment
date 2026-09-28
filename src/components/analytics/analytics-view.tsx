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
  const { currentUser, teams, tasks, allProfiles } = useApp();

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

  // Overall counts
  const totalTasks = relevantTasks.length || 1;
  const completedTasks = relevantTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = relevantTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const inReviewTasks = relevantTasks.filter(t => t.status === 'IN_REVIEW').length;
  const todoTasks = relevantTasks.filter(t => t.status === 'TODO').length;
  const blockedTasks = relevantTasks.filter(t => t.status === 'BLOCKED').length;
  const backlogTasks = relevantTasks.filter(t => t.status === 'BACKLOG').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = relevantTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED').length;
  
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  const totalPoints = relevantTasks.reduce((acc, t) => acc + t.story_points, 0);
  const completedPoints = relevantTasks
    .filter(t => t.status === 'COMPLETED')
    .reduce((acc, t) => acc + t.story_points, 0);

  // Task Status Distribution Chart Data
  const statusData = [
    { name: 'To Do', count: todoTasks, fill: '#38bdf8' },
    { name: 'In Progress', count: inProgressTasks, fill: '#6366f1' },
    { name: 'In Review', count: inReviewTasks, fill: '#a855f7' },
    { name: 'Completed', count: completedTasks, fill: '#10b981' },
    { name: 'Blocked', count: blockedTasks, fill: '#f43f5e' },
    { name: 'Backlog', count: backlogTasks, fill: '#64748b' },
  ];

  // Burndown Chart Simulation Data (14-day sprint trajectory)
  const burndownData = [
    { day: 'Day 1', ideal: 26, actual: 26 },
    { day: 'Day 3', ideal: 22, actual: 26 },
    { day: 'Day 5', ideal: 18, actual: 23 },
    { day: 'Day 7', ideal: 15, actual: 20 },
    { day: 'Day 9', ideal: 11, actual: 15 },
    { day: 'Day 11', ideal: 7, actual: 11 },
    { day: 'Day 13', ideal: 4, actual: 8 },
    { day: 'Day 14', ideal: 0, actual: null },
  ];

  // Workload by Member Data
  const teamEngineers = useMemo(() => {
    return allProfiles.filter(p => {
      if (selectedTeamId !== 'ALL') return p.team_id === selectedTeamId;
      return p.role !== 'OFFICE_BEARER';
    });
  }, [allProfiles, selectedTeamId]);

  const workloadData = useMemo(() => {
    return teamEngineers.map(member => {
      const assigned = relevantTasks.filter(t => t.assignee_ids.includes(member.id));
      const points = assigned.reduce((acc, t) => acc + t.story_points, 0);
      return {
        name: member.full_name.split(' ')[0],
        tasks: assigned.length,
        points: points,
      };
    }).slice(0, 8);
  }, [teamEngineers, relevantTasks]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded">
              PERFORMANCE & BURNDOWN TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SEDS Analytics & Velocity
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sprint burn rates, task distribution models, and subsystem engineering output.
          </p>
        </div>

        {/* Subsystem Filter */}
        {isOfficeBearer && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="ALL">All Subsystems</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-[#0b0e17] border border-[#1e2439] rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 block uppercase">TOTAL TASKS</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{relevantTasks.length}</span>
          <span className="text-[10px] text-slate-400 font-mono">Assigned & Backlog</span>
        </div>

        <div className="p-3.5 bg-[#0b0e17] border border-[#1e2439] rounded-xl">
          <span className="text-[11px] font-mono text-emerald-400 block uppercase">COMPLETED</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{completedTasks}</span>
          <span className="text-[10px] text-emerald-400 font-mono">{completionPercentage}% rate</span>
        </div>

        <div className="p-3.5 bg-[#0b0e17] border border-[#1e2439] rounded-xl">
          <span className="text-[11px] font-mono text-indigo-400 block uppercase">POINTS BURNED</span>
          <span className="text-2xl font-bold font-mono text-indigo-400 mt-1 block">{completedPoints}</span>
          <span className="text-[10px] text-slate-400 font-mono">of {totalPoints} total pts</span>
        </div>

        <div className="p-3.5 bg-[#0b0e17] border border-[#1e2439] rounded-xl">
          <span className="text-[11px] font-mono text-sky-400 block uppercase">IN PROGRESS</span>
          <span className="text-2xl font-bold font-mono text-sky-400 mt-1 block">{inProgressTasks}</span>
          <span className="text-[10px] text-slate-400 font-mono">Active engineering</span>
        </div>

        <div className="p-3.5 bg-[#0b0e17] border border-[#1e2439] rounded-xl">
          <span className="text-[11px] font-mono text-amber-400 block uppercase">OVERDUE</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{overdueTasks}</span>
          <span className="text-[10px] text-amber-400 font-mono">Requires attention</span>
        </div>

        <div className="p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl">
          <span className="text-[11px] font-mono text-rose-300 block uppercase">BLOCKED</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">{blockedTasks}</span>
          <span className="text-[10px] text-rose-400 font-mono">Impediments logged</span>
        </div>
      </div>

      {/* Main Charts: Burndown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Burndown Chart */}
        <div className="p-5 bg-[#0b0e17] border border-[#1e2439] rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-indigo-400" />
                <span>Sprint Burndown (Story Points)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ideal linear burn line vs actual remaining points.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Active Sprint
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f253d" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d101a', borderColor: '#2b3352', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name="Ideal Burn"
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Remaining"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Distribution Bar Chart */}
        <div className="p-5 bg-[#0b0e17] border border-[#1e2439] rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Task Distribution by Status</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Breakdown across state machines.
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f253d" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d101a', borderColor: '#2b3352', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Member Workload Distribution Chart */}
      <div className="p-5 bg-[#0b0e17] border border-[#1e2439] rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Workload Allocation by Engineer (Story Points)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Assigned story points per subsystem team engineer.
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f253d" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d101a', borderColor: '#2b3352', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="points" name="Story Points" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
