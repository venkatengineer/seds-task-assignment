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
      return task.assignee_ids.includes(user.id);
    }
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
    return this.canViewTask(user, task);
  },

  canManageTeam(user: Profile | null | undefined): boolean {
    return user?.role === 'OFFICE_BEARER';
  }
};
