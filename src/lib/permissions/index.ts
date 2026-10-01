import { Profile, Task, Sprint } from '@/types/database';

export const Permissions = {
  isOfficeBearer(user: Profile | null | undefined): boolean {
    return user?.role === 'OFFICE_BEARER';
  },

  isTeamLead(user: Profile | null | undefined, teamId?: string | null): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD') {
      return teamId ? user.team_id === teamId : true;
    }
    return false;
  },

  canViewTask(user: Profile | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === task.team_id) return true;
    if (user.role === 'TEAM_MEMBER') {
      // Normal assigned tasks or collaborative tasks
      if (task.assignee_ids.includes(user.id)) return true;
      // Published Open Tasks of the user's team are visible for discovery
      if (task.assignment_type === 'OPEN' && task.open_task_status === 'PUBLISHED' && task.team_id === user.team_id) {
        return true;
      }
    }
    return false;
  },

  canExpressInterest(user: Profile | null | undefined, task: Task): boolean {
    if (!user || user.role !== 'TEAM_MEMBER') return false;
    if (user.team_id !== task.team_id) return false;
    if (task.assignment_type !== 'OPEN' || task.open_task_status !== 'PUBLISHED') return false;
    if (task.assignee_ids.includes(user.id)) return false; // Already an assignee
    const currentAssigneeCount = task.assignee_ids.length;
    const maxAssignees = task.max_assignees || 1;
    return currentAssigneeCount < maxAssignees;
  },

  canManageOpenTask(user: Profile | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === task.team_id) return true;
    return false;
  },

  canCreateTask(user: Profile | null | undefined, targetTeamId: string): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === targetTeamId) return true;
    return false;
  },

  canEditTask(user: Profile | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === task.team_id) return true;
    return false;
  },

  canUpdateTaskStatus(user: Profile | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === task.team_id) return true;
    if (user.role === 'TEAM_MEMBER') {
      return task.assignee_ids.includes(user.id);
    }
    return false;
  },

  canDeleteTask(user: Profile | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === task.team_id) return true;
    return false;
  },

  canCreateSprint(user: Profile | null | undefined, targetTeamId: string): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === targetTeamId) return true;
    return false;
  },

  canManageSprint(user: Profile | null | undefined, sprint: Sprint): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === sprint.team_id) return true;
    return false;
  },

  canCreateAnnouncement(user: Profile | null | undefined, targetTeamId: string | null): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER') return true;
    if (user.role === 'TEAM_LEAD' && targetTeamId !== null && user.team_id === targetTeamId) return true;
    return false;
  },

  canCommentOnTask(user: Profile | null | undefined, task: Task): boolean {
    if (user?.role === 'ADMIN') return false; // Admin is not an operational role
    return this.canViewTask(user, task);
  },

  canManageTeam(user: Profile | null | undefined): boolean {
    return user?.role === 'OFFICE_BEARER' || user?.role === 'ADMIN';
  },

  isAdmin(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN';
  },

  canManageUsers(user: Profile | null | undefined): boolean {
    return user?.role === 'ADMIN' || user?.role === 'OFFICE_BEARER';
  },

  canSendBroadcast(user: Profile | null | undefined): boolean {
    return user?.role === 'OFFICE_BEARER' || user?.role === 'TEAM_LEAD';
  },

  canVerifyTask(user: Profile | null | undefined, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'OFFICE_BEARER' || user.role === 'ADMIN') return true;
    if (user.role === 'TEAM_LEAD' && user.team_id === task.team_id) return true;
    if (task.created_by === user.id) return true;
    return false;
  }
};
