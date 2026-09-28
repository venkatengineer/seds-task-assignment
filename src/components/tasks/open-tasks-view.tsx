'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { PriorityBadge } from '@/components/ui/badges';
import { UserAvatar } from '@/components/ui/avatar';
import { Task } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { TaskCreateModal } from './task-create-modal';
import { TaskDetailDrawer } from './task-detail-drawer';
import { Modal } from '@/components/ui/modal';
import { 
  Compass, Plus, Search, 
  Users, CheckCircle2, XCircle, Clock, 
  Award, Sparkles, Send,
  ArrowRight, ShieldCheck, Check
} from 'lucide-react';

export const OpenTasksView: React.FC = () => {
  const { 
    currentUser, 
    tasks, 
    openTasks, 
    openTaskInterests, 
    teams, 
    allProfiles,
    expressInterest, 
    withdrawInterest, 
    approveInterest, 
    rejectInterest 
  } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isTeamLead = currentUser.role === 'TEAM_LEAD';
  const isLeadOrBearer = isOfficeBearer || isTeamLead;

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [applyingTaskId, setApplyingTaskId] = useState<string | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');

  // Active view tab for Leads / Bearers: 'published' | 'applicants' | 'all'
  const [leadTab, setLeadTab] = useState<'published' | 'applicants'>('published');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');

  // Find task currently being applied to
  const applyingTask = useMemo(() => {
    return tasks.find(t => t.id === applyingTaskId);
  }, [tasks, applyingTaskId]);

  // Extract all unique skills across open tasks
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    openTasks.forEach(t => {
      (t.skills || []).forEach(s => set.add(s));
    });
    return Array.from(set);
  }, [openTasks]);

  // Filtered Open Tasks
  const filteredOpenTasks = useMemo(() => {
    return openTasks.filter(t => {
      if (selectedTeamFilter !== 'ALL' && t.team_id !== selectedTeamFilter) return false;
      if (selectedSkillFilter !== 'ALL' && !(t.skills || []).includes(selectedSkillFilter)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = t.description.toLowerCase().includes(query);
        const matchSkills = (t.skills || []).some(s => s.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchSkills) return false;
      }
      return true;
    });
  }, [openTasks, selectedTeamFilter, selectedSkillFilter, searchQuery]);

  // Interests for Leads / Office Bearers
  const pendingInterests = useMemo(() => {
    return openTaskInterests.filter(i => {
      const task = tasks.find(t => t.id === i.task_id);
      if (!task) return false;
      if (!isOfficeBearer && task.team_id !== currentUser.team_id) return false;
      return i.status === 'INTERESTED';
    });
  }, [openTaskInterests, tasks, isOfficeBearer, currentUser.team_id]);

  const resolvedInterests = useMemo(() => {
    return openTaskInterests.filter(i => {
      const task = tasks.find(t => t.id === i.task_id);
      if (!task) return false;
      if (!isOfficeBearer && task.team_id !== currentUser.team_id) return false;
      return i.status === 'APPROVED' || i.status === 'REJECTED';
    });
  }, [openTaskInterests, tasks, isOfficeBearer, currentUser.team_id]);

  // Handle open interest modal
  const handleOpenApplyModal = (task: Task) => {
    setApplyingTaskId(task.id);
    setPitchMessage('');
  };

  // Submit member pitch/interest
  const handleConfirmExpressInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingTaskId) return;
    expressInterest(applyingTaskId, pitchMessage.trim() || 'Volunteering for this open task.');
    setApplyingTaskId(null);
    setPitchMessage('');
  };

  // Helper to get completed tasks count for a user
  const getUserCompletedTasksCount = (userId: string) => {
    return tasks.filter(t => t.assignee_ids.includes(userId) && t.status === 'COMPLETED').length;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-950/40 via-indigo-950/30 to-slate-900 border border-amber-900/40 p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>SEDS Open Task Auction & Discovery</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isLeadOrBearer ? 'Open Task Management' : 'Open Tasks Board'}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {isLeadOrBearer 
                ? 'Publish voluntary subsystem tasks, specify required skills and capacities, and review member applications to staff missions.'
                : 'Discover voluntary tasks within your subsystem. Step up, showcase your engineering skillset, and gain hands-on aerospace experience.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isLeadOrBearer && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-950/50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Publish Open Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative Grid Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Available Open Tasks</div>
          <div className="text-2xl font-bold text-white mt-1">
            {openTasks.filter(t => t.open_task_status === 'PUBLISHED').length}
          </div>
          <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Ready for claims
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Pending Applications</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {pendingInterests.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting review
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Assigned via Auction</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {openTasks.filter(t => t.open_task_status === 'ASSIGNED').length}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Staffed & In Flight
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-400 uppercase">My Team Subsystem</div>
          <div className="text-base font-bold text-indigo-300 mt-1 truncate">
            {currentUser.team_id ? teams.find(t => t.id === currentUser.team_id)?.name : 'All Subsystems (Org-wide)'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {currentUser.title || currentUser.role}
          </div>
        </div>
      </div>

      {/* Lead Tabs (if Team Lead or Office Bearer) */}
      {isLeadOrBearer && (
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setLeadTab('published')}
            className={`pb-3 text-xs font-mono font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              leadTab === 'published'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Published Open Tasks ({filteredOpenTasks.length})</span>
          </button>

          <button
            onClick={() => setLeadTab('applicants')}
            className={`pb-3 text-xs font-mono font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              leadTab === 'applicants'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Applicant Requests</span>
            {pendingInterests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {pendingInterests.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or skill (e.g. React, CFD, 4NEC2)..."
            className="w-full bg-slate-950/70 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Subsystem filter for Office Bearer */}
          {isOfficeBearer && (
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Subsystems</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {/* Skill Filter */}
          {allSkills.length > 0 && (
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Skills</option>
              {allSkills.map(sk => (
                <option key={sk} value={sk}>{sk}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLeadOrBearer && leadTab === 'applicants' ? (
        /* Applicant Queue Tab for Leads */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Pending Applicant Requests ({pendingInterests.length})
            </h2>
          </div>

          {pendingInterests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
              <h3 className="text-sm font-medium text-slate-300">All applicant requests reviewed</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are no pending open task interest requests waiting for approval in your subsystem queue.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInterests.map(interest => {
                const task = tasks.find(t => t.id === interest.task_id);
                const applicant = allProfiles.find(p => p.id === interest.user_id) || interest.user;
                if (!task || !applicant) return null;

                const completedCount = getUserCompletedTasksCount(applicant.id);
                const capacityRemaining = (task.max_assignees || 1) - task.assignee_ids.length;

                return (
                  <div
                    key={interest.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                  >
                    {/* Task context header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                          OPEN TASK APPLICATION
                        </div>
                        <h4 
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-sm font-bold text-white hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          {task.title}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {task.team_name} • {task.story_points} Points • {capacityRemaining} spot{capacityRemaining === 1 ? '' : 's'} remaining
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} size="sm" />
                    </div>

                    {/* Applicant Profile & Pitch */}
                    <div className="flex items-start gap-3">
                      <UserAvatar user={applicant} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{applicant.full_name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {applicant.title || applicant.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Award className="w-3 h-3" />
                          <span>{completedCount} completed tasks in SEDS</span>
                        </div>
                      </div>
                    </div>

                    {/* Member's Pitch Message */}
                    <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs text-slate-300 italic">
                      &quot;{interest.message}&quot;
                    </div>

                    {/* Lead Decision Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        Submitted {formatDate(interest.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => rejectInterest(interest.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:border-rose-700/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => approveInterest(interest.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs shadow-emerald-950 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve & Assign</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recently Resolved History */}
          {resolvedInterests.length > 0 && (
            <div className="pt-6 border-t border-slate-800/80 space-y-3">
              <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Reviewed Decisions ({resolvedInterests.length})
              </h3>
              <div className="space-y-2">
                {resolvedInterests.slice(0, 5).map(res => {
                  const t = tasks.find(x => x.id === res.task_id);
                  const u = allProfiles.find(x => x.id === res.user_id) || res.user;
                  return (
                    <div 
                      key={res.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar user={u} size="xs" />
                        <span className="text-white font-medium">{u?.full_name}</span>
                        <span className="text-slate-400">applied for</span>
                        <span className="text-indigo-300 font-mono">{t?.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                            APPROVED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/60 border border-rose-800 text-rose-300">
                            REJECTED
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatDate(res.updated_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Published Open Tasks Grid (Available to Members and Leads) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Available Open Tasks ({filteredOpenTasks.length})
            </h2>
          </div>

          {filteredOpenTasks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
              <Compass className="w-10 h-10 text-amber-500/50 mx-auto" />
              <h3 className="text-sm font-medium text-slate-300">No open tasks found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                There are currently no open tasks matching your filter criteria. Team Leads publish open tasks when new mission items are ready for staffing.
              </p>
              {isLeadOrBearer && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Open Task Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOpenTasks.map(task => {
                const assignedCount = task.assignee_ids.length;
                const maxMembers = task.max_assignees || 1;
                const isFull = assignedCount >= maxMembers;
                const isAssignedToMe = task.assignee_ids.includes(currentUser.id);

                // Check current user's interest record on this task
                const myInterest = openTaskInterests.find(
                  i => i.task_id === task.id && i.user_id === currentUser.id
                );
                const hasPendingInterest = myInterest?.status === 'INTERESTED';
                const creator = allProfiles.find(p => p.id === task.created_by) || task.creator;

                return (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold">
                            OPEN TASK
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {task.team_name}
                          </span>
                        </div>
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer line-clamp-2"
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                          {task.description || 'No additional technical specifications provided.'}
                        </p>
                      </div>

                      {/* Required Skills Badges */}
                      {(task.skills && task.skills.length > 0) && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {task.skills.map(skill => (
                            <span 
                              key={skill}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-slate-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Details Strip */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono">
                        <div>
                          <span className="text-slate-400 block text-[9px]">POINTS</span>
                          <span className="text-slate-200 font-semibold">{task.story_points} Points</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">DEADLINE</span>
                          <span className="text-slate-200">{formatDate(task.due_date)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">STAFFING</span>
                          <span className={`font-semibold ${isFull ? 'text-rose-400' : 'text-amber-400'}`}>
                            {assignedCount} / {maxMembers} {maxMembers === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">SPRINT</span>
                          <span className="text-slate-300 truncate block">{task.sprint_name || 'Backlog'}</span>
                        </div>
                      </div>

                      {/* Creator info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar user={creator} size="xs" />
                          <span className="truncate">Posted by {creator?.full_name?.split(' ')[0] || 'Lead'}</span>
                        </div>
                        {task.requires_approval !== false ? (
                          <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Lead approval
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Auto claim
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA depending on role and application status */}
                    <div className="pt-4 mt-3 border-t border-slate-800">
                      {isAssignedToMe ? (
                        <div className="w-full py-2 px-3 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>You are assigned</span>
                          </div>
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="text-[11px] underline text-emerald-300 hover:text-emerald-100 cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      ) : hasPendingInterest ? (
                        <div className="w-full space-y-2">
                          <div className="py-1.5 px-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-400" />
                            <div className="leading-tight">
                              <span className="font-semibold block">Interest submitted</span>
                              <span className="text-[10px] text-amber-400/80">Waiting for Team Lead approval</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => withdrawInterest(task.id)}
                            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            Withdraw Interest
                          </button>
                        </div>
                      ) : isFull ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-lg bg-slate-800/60 text-slate-500 text-xs font-semibold cursor-not-allowed border border-slate-800"
                        >
                          Capacity Reached (Closed)
                        </button>
                      ) : currentUser.role === 'TEAM_MEMBER' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenApplyModal(task)}
                          className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Express Interest</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Manage Task & Applicants</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Express Interest Modal */}
      {applyingTask && (
        <Modal
          isOpen={Boolean(applyingTaskId)}
          onClose={() => setApplyingTaskId(null)}
          title="Express Interest in Open Task"
          description={`Submit your application to take responsibility for "${applyingTask.title}".`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmExpressInterest} className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subsystem: {applyingTask.team_name}</span>
                <span>{applyingTask.story_points} Story Points</span>
              </div>
              <div className="text-white font-medium">{applyingTask.title}</div>
              {applyingTask.skills && applyingTask.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {applyingTask.skills.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/60 text-amber-300 text-[10px] font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                YOUR PITCH & RELEVANT EXPERIENCE
              </label>
              <textarea
                rows={3}
                required
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                placeholder="e.g. I have experience with React and UI/UX styling. I'd love to take responsibility for this attendee workflow."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
              <span className="text-[10px] text-slate-400">
                Your Team Lead will review your pitch and completion history before approving assignment.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyingTaskId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs shadow-amber-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Interest</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultTeamId={currentUser.team_id || undefined}
        defaultAssignmentType="OPEN"
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
};
