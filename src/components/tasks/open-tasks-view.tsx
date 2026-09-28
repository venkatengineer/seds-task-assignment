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

  // Active view tab for Leads / Bearers: 'published' | 'applicants'
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Open Task System</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isLeadOrBearer ? 'Open Task Management & Staffing' : 'Open Tasks Board'}
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            {isLeadOrBearer 
              ? 'Publish voluntary subsystem tasks, specify required skills and capacities, and review member applications to staff missions.'
              : 'Discover available tasks within your team. Volunteer for tasks aligned with your engineering skillset and take ownership of critical items.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isLeadOrBearer && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Open Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Open Tasks</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {openTasks.filter(t => t.open_task_status === 'PUBLISHED').length}
          </div>
          <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3" /> Ready for claims
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Applications</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {pendingInterests.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" /> Awaiting review
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned via Auction</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {openTasks.filter(t => t.open_task_status === 'ASSIGNED').length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Staffed & active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Subsystem</div>
          <div className="text-sm font-bold text-gray-900 mt-1 truncate">
            {currentUser.team_id ? teams.find(t => t.id === currentUser.team_id)?.name : 'Organization-Wide'}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 truncate">
            {currentUser.title || currentUser.role}
          </div>
        </div>
      </div>

      {/* Lead Tabs (if Team Lead or Office Bearer) */}
      {isLeadOrBearer && (
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setLeadTab('published')}
            className={`pb-2.5 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              leadTab === 'published'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Published Tasks ({filteredOpenTasks.length})</span>
          </button>

          <button
            onClick={() => setLeadTab('applicants')}
            className={`pb-2.5 text-xs font-medium transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
              leadTab === 'applicants'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Applicant Requests</span>
            {pendingInterests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-200">
                {pendingInterests.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or skill (e.g. React, CFD, CAD)..."
            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Subsystem filter for Office Bearer */}
          {isOfficeBearer && (
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-hidden"
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
              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-hidden"
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
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Pending Applicant Requests ({pendingInterests.length})
            </h2>
          </div>

          {pendingInterests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-gray-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-semibold text-gray-900">All applicant requests reviewed</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                There are no pending open task interest requests waiting for approval in your queue.
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
                    className="p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 transition-all space-y-3.5 shadow-xs"
                  >
                    {/* Task context header */}
                    <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                          Open Task Application
                        </div>
                        <h4 
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {task.title}
                        </h4>
                        <div className="text-[11px] text-gray-500 mt-0.5">
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
                          <span className="font-semibold text-gray-900 text-xs">{applicant.full_name}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {applicant.title || applicant.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-blue-600 mt-0.5 flex items-center gap-1 font-medium">
                          <Award className="w-3 h-3" />
                          <span>{completedCount} completed tasks in SEDS</span>
                        </div>
                      </div>
                    </div>

                    {/* Member's Pitch Message */}
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 italic">
                      &quot;{interest.message}&quot;
                    </div>

                    {/* Lead Decision Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-gray-400">
                        Submitted {formatDate(interest.created_at)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => rejectInterest(interest.id)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 border border-gray-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => approveInterest(interest.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
            <div className="pt-6 border-t border-gray-200 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reviewed Decisions ({resolvedInterests.length})
              </h3>
              <div className="space-y-2">
                {resolvedInterests.slice(0, 5).map(res => {
                  const t = tasks.find(x => x.id === res.task_id);
                  const u = allProfiles.find(x => x.id === res.user_id) || res.user;
                  return (
                    <div 
                      key={res.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <UserAvatar user={u} size="xs" />
                        <span className="text-gray-900 font-semibold">{u?.full_name}</span>
                        <span className="text-gray-400">applied for</span>
                        <span className="text-gray-700 font-medium">{t?.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 border border-red-200 text-red-700">
                            Rejected
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
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
        /* Published Open Tasks Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Available Open Tasks ({filteredOpenTasks.length})
            </h2>
          </div>

          {filteredOpenTasks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-gray-200 space-y-2">
              <Compass className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="text-sm font-semibold text-gray-900">No open tasks found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                There are currently no open tasks matching your filter criteria. Team Leads publish open tasks when new items are ready for staffing.
              </p>
              {isLeadOrBearer && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
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
                    className="flex flex-col justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-400 transition-all shadow-xs group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                            OPEN TASK
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            {task.team_name}
                          </span>
                        </div>
                        <PriorityBadge priority={task.priority} size="sm" />
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 
                          onClick={() => setSelectedTaskId(task.id)}
                          className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2"
                        >
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">
                          {task.description || 'No additional technical specifications provided.'}
                        </p>
                      </div>

                      {/* Meta Pill Strip: PRIORITY • POINTS • DEADLINE */}
                      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 py-1 border-y border-gray-100">
                        <span className="text-gray-900 font-semibold">{task.priority}</span>
                        <span>•</span>
                        <span className="font-mono">{task.story_points} POINTS</span>
                        {task.due_date && (
                          <>
                            <span>•</span>
                            <span>{formatDate(task.due_date)}</span>
                          </>
                        )}
                      </div>

                      {/* Required Skills Badges */}
                      {(task.skills && task.skills.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {task.skills.map(skill => (
                            <span 
                              key={skill}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Staffing capacity line */}
                      <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                        <span className="font-medium">
                          {assignedCount} / {maxMembers} {maxMembers === 1 ? 'member' : 'members'}
                        </span>
                        {task.requires_approval !== false ? (
                          <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            <ShieldCheck className="w-3 h-3" /> Lead approval
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Sparkles className="w-3 h-3" /> Auto claim
                          </span>
                        )}
                      </div>

                      {/* Posted by */}
                      {creator && (
                        <div className="text-[11px] text-gray-500 pt-0.5">
                          Posted by <span className="font-medium text-gray-700">{creator.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      {isAssignedToMe ? (
                        <div className="w-full py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>You are assigned</span>
                          </div>
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="text-[11px] underline text-emerald-700 hover:text-emerald-900 cursor-pointer font-medium"
                          >
                            View
                          </button>
                        </div>
                      ) : hasPendingInterest ? (
                        <div className="w-full space-y-2">
                          <div className="py-2 px-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600 animate-pulse" />
                            <div className="leading-tight">
                              <span className="font-semibold block">Interest submitted</span>
                              <span className="text-[11px] text-amber-700">Waiting for Team Lead approval</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => withdrawInterest(task.id)}
                            className="w-full py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 transition-colors cursor-pointer"
                          >
                            Withdraw Interest
                          </button>
                        </div>
                      ) : isFull ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium cursor-not-allowed border border-gray-200"
                        >
                          Capacity Reached (Closed)
                        </button>
                      ) : currentUser.role === 'TEAM_MEMBER' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenApplyModal(task)}
                          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Express Interest</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedTaskId(task.id)}
                          className="w-full py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-medium border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Manage Task & Applicants</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
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
          size="md"
        >
          <form onSubmit={handleConfirmExpressInterest} className="space-y-4 py-1">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-500 font-medium">
                <span>Team: {applyingTask.team_name}</span>
                <span>{applyingTask.story_points} Points</span>
              </div>
              <div className="text-gray-900 font-semibold">{applyingTask.title}</div>
              {applyingTask.skills && applyingTask.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {applyingTask.skills.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-700 text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Your Pitch & Relevant Experience
              </label>
              <textarea
                rows={3}
                required
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                placeholder="e.g. I have experience with React and UI/UX styling. I'd love to build this component."
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 resize-none"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Your Team Lead will review your pitch and completion history before approving assignment.
              </span>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyingTaskId(null)}
                className="px-3.5 py-1.5 rounded-lg text-gray-600 hover:text-gray-800 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
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
