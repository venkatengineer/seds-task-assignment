'use client';

import React, { useState, useMemo } from 'react';
import { Profile, TaskStatus, TaskPriority } from '@/types/database';
import { useApp } from '@/lib/store/app-context';
import { UserAvatar } from '@/components/ui/avatar';
import { TaskStatusBadge, PriorityBadge, SprintStatusBadge, RoleBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  TrendingUp, CheckCircle2, Clock, AlertTriangle, 
  Search, Calendar, ArrowUpRight, BarChart3, 
  Layers, Zap, CheckCheck, ChevronLeft, ChevronRight,
  Target, Sparkles, Filter, ChevronDown, ChevronUp
} from 'lucide-react';

interface MemberDetailAnalyticsProps {
  member: Profile;
  teamMembers?: Profile[];
  onSelectMember?: (memberId: string) => void;
  onSelectTask?: (taskId: string) => void;
  compact?: boolean;
}

export const MemberDetailAnalytics: React.FC<MemberDetailAnalyticsProps> = ({
  member,
  teamMembers = [],
  onSelectMember,
  onSelectTask,
  compact = false,
}) => {
  const { tasks, sprints, teams } = useApp();

  const [activeTab, setActiveTab] = useState<'sprints' | 'analytics' | 'history'>('sprints');
  const [expandedSprintIds, setExpandedSprintIds] = useState<Record<string, boolean>>({});

  // Search and filter state for Previous Task History
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [sprintFilter, setSprintFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');

  // Find member team
  const memberTeam = useMemo(() => {
    return teams.find(t => t.id === member.team_id);
  }, [teams, member.team_id]);

  // Tasks assigned to this member
  const memberTasks = useMemo(() => {
    return tasks.filter(t => t.assignee_ids && t.assignee_ids.includes(member.id));
  }, [tasks, member.id]);

  // Core metrics computation
  const completedTasks = useMemo(() => memberTasks.filter(t => t.status === 'COMPLETED'), [memberTasks]);
  const inProgressTasks = useMemo(() => memberTasks.filter(t => t.status === 'IN_PROGRESS'), [memberTasks]);
  const inReviewTasks = useMemo(() => memberTasks.filter(t => t.status === 'IN_REVIEW'), [memberTasks]);
  const todoTasks = useMemo(() => memberTasks.filter(t => t.status === 'TODO'), [memberTasks]);
  const blockedTasks = useMemo(() => memberTasks.filter(t => t.status === 'BLOCKED'), [memberTasks]);
  const backlogTasks = useMemo(() => memberTasks.filter(t => !t.sprint_id), [memberTasks]);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = useMemo(() => {
    return memberTasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'COMPLETED');
  }, [memberTasks, todayStr]);

  const totalAssignedPoints = useMemo(() => {
    return memberTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  }, [memberTasks]);

  const completedStoryPoints = useMemo(() => {
    return completedTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  }, [completedTasks]);

  const inProgressPoints = useMemo(() => {
    return inProgressTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
  }, [inProgressTasks]);

  const pointsCompletionRate = totalAssignedPoints > 0 
    ? Math.round((completedStoryPoints / totalAssignedPoints) * 100) 
    : 0;

  const taskCompletionRate = memberTasks.length > 0 
    ? Math.round((completedTasks.length / memberTasks.length) * 100) 
    : 0;

  // Sprints breakdown: collect all sprints where member has tasks OR sprints of member's team
  const memberSprintsData = useMemo(() => {
    const taskSprintIds = new Set(memberTasks.map(t => t.sprint_id).filter(Boolean));
    const relevant = sprints.filter(s => 
      (member.team_id && s.team_id === member.team_id) || taskSprintIds.has(s.id)
    );

    // Sort chronologically (oldest to newest)
    const sorted = [...relevant].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return sorted.map(sprint => {
      const sTasks = memberTasks.filter(t => t.sprint_id === sprint.id);
      const sCompletedTasks = sTasks.filter(t => t.status === 'COMPLETED');
      const sCommittedPoints = sTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
      const sCompletedPoints = sCompletedTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
      const sRate = sCommittedPoints > 0 ? Math.round((sCompletedPoints / sCommittedPoints) * 100) : 0;

      return {
        sprint,
        tasks: sTasks,
        completedTasks: sCompletedTasks,
        committedPoints: sCommittedPoints,
        completedPoints: sCompletedPoints,
        completionRate: sRate,
      };
    });
  }, [sprints, memberTasks, member.team_id]);

  // Velocity Calculation: average completed points across sprints where work was committed
  const averageVelocity = useMemo(() => {
    const sprintsWithWork = memberSprintsData.filter(s => s.committedPoints > 0 || s.completedPoints > 0);
    if (sprintsWithWork.length === 0) {
      return completedStoryPoints > 0 ? completedStoryPoints.toString() : '0';
    }
    const sumCompleted = sprintsWithWork.reduce((acc, s) => acc + s.completedPoints, 0);
    return (sumCompleted / sprintsWithWork.length).toFixed(1);
  }, [memberSprintsData, completedStoryPoints]);

  // Chart Data: Sprint Velocity
  const velocityChartData = useMemo(() => {
    return memberSprintsData.map(s => ({
      name: s.sprint.name,
      'Completed Points': s.completedPoints,
      'Committed Points': s.committedPoints,
      rate: s.completionRate,
      status: s.sprint.status,
    }));
  }, [memberSprintsData]);

  // Status breakdown data for charts
  const statusDistributionData = useMemo(() => {
    return [
      { name: 'Completed', count: completedTasks.length, points: completedStoryPoints, color: '#10B981' },
      { name: 'In Progress', count: inProgressTasks.length, points: inProgressPoints, color: '#2563EB' },
      { name: 'In Review', count: inReviewTasks.length, points: inReviewTasks.reduce((s, t) => s + (t.story_points || 0), 0), color: '#8B5CF6' },
      { name: 'To Do', count: todoTasks.length, points: todoTasks.reduce((s, t) => s + (t.story_points || 0), 0), color: '#60A5FA' },
      { name: 'Blocked', count: blockedTasks.length, points: blockedTasks.reduce((s, t) => s + (t.story_points || 0), 0), color: '#EF4444' },
    ];
  }, [completedTasks, inProgressTasks, inReviewTasks, todoTasks, blockedTasks, completedStoryPoints, inProgressPoints]);

  // Priority breakdown
  const priorityBreakdown = useMemo(() => {
    const priorities: TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
    return priorities.map(pri => {
      const pTasks = memberTasks.filter(t => t.priority === pri);
      const pCompleted = pTasks.filter(t => t.status === 'COMPLETED');
      const pPointsTotal = pTasks.reduce((s, t) => s + (t.story_points || 0), 0);
      const pPointsCompleted = pCompleted.reduce((s, t) => s + (t.story_points || 0), 0);
      return {
        priority: pri,
        totalTasks: pTasks.length,
        completedTasks: pCompleted.length,
        totalPoints: pPointsTotal,
        completedPoints: pPointsCompleted,
      };
    });
  }, [memberTasks]);

  // Filtered Task History
  const filteredHistoryTasks = useMemo(() => {
    return memberTasks.filter(task => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      if (sprintFilter !== 'ALL') {
        if (sprintFilter === 'BACKLOG' && task.sprint_id) return false;
        if (sprintFilter !== 'BACKLOG' && task.sprint_id !== sprintFilter) return false;
      }
      return true;
    });
  }, [memberTasks, searchQuery, statusFilter, priorityFilter, sprintFilter]);

  // Member navigation (previous/next)
  const currentIndex = teamMembers.findIndex(m => m.id === member.id);
  const prevMember = currentIndex > 0 ? teamMembers[currentIndex - 1] : null;
  const nextMember = currentIndex >= 0 && currentIndex < teamMembers.length - 1 ? teamMembers[currentIndex + 1] : null;

  const toggleSprintExpand = (sprintId: string) => {
    setExpandedSprintIds(prev => ({
      ...prev,
      [sprintId]: !prev[sprintId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Card & Switcher Header */}
      <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar user={member} size="xl" className="shadow-xs border-2 border-white ring-2 ring-gray-100" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900 truncate tracking-tight">
                  {member.full_name}
                </h2>
                <RoleBadge role={member.role} size="sm" />
                {memberTeam && (
                  <span 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border"
                    style={{ 
                      backgroundColor: `${memberTeam.color}15`,
                      color: memberTeam.color,
                      borderColor: `${memberTeam.color}30`
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full inline-block" 
                      style={{ backgroundColor: memberTeam.color }} 
                    />
                    <span>{memberTeam.name}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {member.title || 'Subsystem Engineer'} • <span className="font-mono text-gray-400">{member.email}</span>
              </p>
            </div>
          </div>

          {/* Member Navigator Dropdown & Prev/Next Buttons */}
          {teamMembers.length > 1 && onSelectMember && (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
              <button
                onClick={() => prevMember && onSelectMember(prevMember.id)}
                disabled={!prevMember}
                title={prevMember ? `Previous: ${prevMember.full_name}` : 'No previous member'}
                className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={member.id}
                onChange={(e) => onSelectMember(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded px-2.5 py-1 text-gray-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.title || m.role})
                  </option>
                ))}
              </select>

              <button
                onClick={() => nextMember && onSelectMember(nextMember.id)}
                disabled={!nextMember}
                title={nextMember ? `Next: ${nextMember.full_name}` : 'No next member'}
                className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* High-Level KPI Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          {/* Completed Story Points */}
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-emerald-800 tracking-wider">Completed Points</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-700">{completedStoryPoints}</span>
              <span className="text-xs text-emerald-600/80 font-medium">/ {totalAssignedPoints} pts</span>
            </div>
            <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${pointsCompletionRate}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block">
              {pointsCompletionRate}% delivered
            </span>
          </div>

          {/* Sprint Velocity */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-blue-800 tracking-wider">Sprint Velocity</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-blue-700">{averageVelocity}</span>
              <span className="text-xs text-blue-600/80 font-medium">pts / sprint</span>
            </div>
            <span className="text-[10px] text-blue-600/80 block mt-2 font-medium">
              Across {memberSprintsData.length} team sprints
            </span>
          </div>

          {/* Task Completion Rate */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-indigo-800 tracking-wider">Tasks Delivered</span>
              <CheckCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-indigo-700">{completedTasks.length}</span>
              <span className="text-xs text-indigo-600/80 font-medium">/ {memberTasks.length} tasks</span>
            </div>
            <div className="w-full bg-indigo-200/60 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-700 font-medium block">
              {taskCompletionRate}% task success
            </span>
          </div>

          {/* Active & Blocked Risk */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase text-gray-600 tracking-wider">Current Load</span>
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-gray-900">{inProgressTasks.length + inReviewTasks.length + todoTasks.length}</span>
              <span className="text-xs text-gray-500 font-medium">active tasks</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {blockedTasks.length > 0 ? (
                <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {blockedTasks.length} blocked
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-medium">
                  ✓ 0 blocked tasks
                </span>
              )}
              {overdueTasks.length > 0 && (
                <span className="text-[10px] font-semibold text-amber-600">
                  • {overdueTasks.length} overdue
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('sprints')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'sprints'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Sprint History & Velocity ({memberSprintsData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Story Points Breakdown & Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-blue-50 text-blue-700 font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Previous Task History ({memberTasks.length})</span>
        </button>
      </div>

      {/* Tab 1: Sprint Velocity & History */}
      {activeTab === 'sprints' && (
        <div className="space-y-6">
          {/* Velocity Recharts Bar Chart */}
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Sprint Velocity: Completed vs Committed Story Points</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Member story points completed vs planned across subsystem sprints.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-gray-600">Completed Points</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />
                  <span className="text-gray-600">Committed Points</span>
                </span>
              </div>
            </div>

            {velocityChartData.length > 0 && velocityChartData.some(d => d['Committed Points'] > 0 || d['Completed Points'] > 0) ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E5E7EB',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: any, name: any) => [`${value} points`, name]}
                    />
                    <Bar dataKey="Committed Points" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed Points" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-6 bg-gray-50/60 rounded-lg border border-dashed border-gray-200">
                <Target className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No Sprint Story Points Recorded</p>
                <p className="text-[11px] text-gray-500 max-w-sm mt-1">
                  Once tasks in active or completed sprints are assigned to {member.full_name}, velocity charts will display their points trajectory here.
                </p>
              </div>
            )}
          </div>

          {/* Sprint-by-Sprint History Accordion/Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Historical Sprints Breakdown
              </h4>
              <span className="text-xs text-gray-500">
                {memberSprintsData.length} sprints
              </span>
            </div>

            {memberSprintsData.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-xl">
                No sprints associated with this engineer&apos;s team yet.
              </div>
            ) : (
              memberSprintsData.map(({ sprint, tasks: sTasks, completedTasks: sCompTasks, committedPoints: sCommPts, completedPoints: sCompPts, completionRate: sRate }) => {
                const isExpanded = expandedSprintIds[sprint.id] ?? true; // default expanded

                return (
                  <div
                    key={sprint.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
                  >
                    {/* Sprint Header Row */}
                    <div 
                      onClick={() => toggleSprintExpand(sprint.id)}
                      className="p-4 bg-gray-50/70 hover:bg-gray-100/60 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          className="mt-0.5 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{sprint.name}</span>
                            <SprintStatusBadge status={sprint.status} size="sm" />
                          </div>
                          {sprint.goal && (
                            <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">
                              &quot;{sprint.goal}&quot;
                            </p>
                          )}
                          <div className="text-[10px] text-gray-400 font-mono mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sprint Points & Progress */}
                      <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                        <div className="text-right">
                          <div className="text-gray-900 font-bold">
                            <span className="text-emerald-600">{sCompPts}</span>
                            <span className="text-gray-400"> / {sCommPts} pts completed</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-sans mt-0.5">
                            {sCompTasks.length} of {sTasks.length} tasks delivered ({sRate}%)
                          </div>
                        </div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${sRate}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sprint Assigned Tasks List */}
                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {sTasks.length === 0 ? (
                          <p className="text-xs text-gray-400 italic py-2">
                            No tasks assigned to {member.full_name} in this sprint.
                          </p>
                        ) : (
                          sTasks.map(t => (
                            <div
                              key={t.id}
                              onClick={() => onSelectTask && onSelectTask(t.id)}
                              className="p-3 bg-white border border-gray-100 hover:border-blue-300 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-2xs group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <TaskStatusBadge status={t.status} size="sm" />
                                  <PriorityBadge priority={t.priority} size="sm" />
                                  <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                    {t.story_points} pts
                                  </span>
                                </div>
                                <h5 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                  {t.title}
                                </h5>
                                {t.due_date && (
                                  <span className="text-[10px] text-gray-400 mt-1 block">
                                    Due: {formatDate(t.due_date)}
                                  </span>
                                )}
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 shrink-0" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Backlog / Non-Sprint Tasks */}
            {backlogTasks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800">Unscheduled / Backlog Tasks</span>
                    <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                      {backlogTasks.length} tasks
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-700">
                    {backlogTasks.reduce((s, t) => s + (t.story_points || 0), 0)} pts total
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {backlogTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask && onSelectTask(t.id)}
                      className="p-3 bg-white border border-gray-100 hover:border-blue-300 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-2xs group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <TaskStatusBadge status={t.status} size="sm" />
                          <PriorityBadge priority={t.priority} size="sm" />
                          <span className="text-[10px] font-bold font-mono bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded border border-gray-200">
                            {t.story_points} pts
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {t.title}
                        </h5>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Story Points Breakdown & Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Story Points & Tasks by Status</span>
              </h3>
              <div className="space-y-3">
                {statusDistributionData.map(item => {
                  const pct = totalAssignedPoints > 0 ? Math.round((item.points / totalAssignedPoints) * 100) : 0;
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <div className="font-mono text-gray-900">
                          <span className="font-bold">{item.points} pts</span>
                          <span className="text-gray-400 ml-1.5">({item.count} tasks • {pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Story Points by Priority */}
            <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Deliverables by Priority Level</span>
              </h3>
              <div className="space-y-3">
                {priorityBreakdown.map(pb => {
                  const rate = pb.totalPoints > 0 ? Math.round((pb.completedPoints / pb.totalPoints) * 100) : 0;
                  return (
                    <div key={pb.priority} className="p-3 bg-gray-50/70 border border-gray-100 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <PriorityBadge priority={pb.priority} size="sm" />
                        <span className="text-xs font-mono font-semibold text-gray-800">
                          {pb.completedPoints} / {pb.totalPoints} pts completed ({rate}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {pb.completedTasks} completed out of {pb.totalTasks} total tasks
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Summary Card */}
          <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Team Lead Performance Insights
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Total Points Completed</span>
                <span className="text-lg font-bold font-mono text-emerald-600 mt-0.5 block">
                  {completedStoryPoints} pts
                </span>
                <span className="text-[10px] text-gray-400">
                  {pointsCompletionRate}% of total workload committed
                </span>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Estimated Velocity</span>
                <span className="text-lg font-bold font-mono text-blue-600 mt-0.5 block">
                  {averageVelocity} pts / sprint
                </span>
                <span className="text-[10px] text-gray-400">
                  Capacity baseline for upcoming sprint planning
                </span>
              </div>

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-500 block text-[11px]">Active Sprint Commitment</span>
                <span className="text-lg font-bold font-mono text-gray-800 mt-0.5 block">
                  {inProgressPoints + todoTasks.reduce((s, t) => s + (t.story_points || 0), 0)} pts pending
                </span>
                <span className="text-[10px] text-gray-400">
                  {blockedTasks.length > 0 ? `⚠️ ${blockedTasks.length} blocked task(s)` : 'No current blockers'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Complete Previous Task History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search historical tasks by title or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="TODO">To Do</option>
                <option value="BLOCKED">Blocked</option>
              </select>

              {/* Sprint Filter */}
              <select
                value={sprintFilter}
                onChange={(e) => setSprintFilter(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All Sprints</option>
                {memberSprintsData.map(s => (
                  <option key={s.sprint.id} value={s.sprint.id}>
                    {s.sprint.name} ({s.sprint.status})
                  </option>
                ))}
                <option value="BACKLOG">Backlog Only</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Task History List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>Showing {filteredHistoryTasks.length} of {memberTasks.length} tasks</span>
              <span className="font-mono">
                {filteredHistoryTasks.reduce((s, t) => s + (t.story_points || 0), 0)} story points
              </span>
            </div>

            {filteredHistoryTasks.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 bg-white border border-gray-200 rounded-xl">
                No matching historical tasks found for the selected filters.
              </div>
            ) : (
              filteredHistoryTasks.map(task => {
                const sprint = sprints.find(s => s.id === task.sprint_id);

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask && onSelectTask(task.id)}
                    className="p-3.5 bg-white border border-gray-200 hover:border-blue-400 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <TaskStatusBadge status={task.status} size="sm" />
                        {task.is_verified && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        )}
                        <PriorityBadge priority={task.priority} size="sm" />
                        <span className="text-[10px] font-bold font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                          {task.story_points} pts
                        </span>
                        {sprint ? (
                          <span className="text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded">
                            {sprint.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.2 rounded">
                            Backlog
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-1">
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                        <span>Updated: {formatDate(task.updated_at)}</span>
                      </div>
                    </div>

                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
