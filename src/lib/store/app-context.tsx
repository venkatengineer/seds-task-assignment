'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Profile, Team, Sprint, Task, TaskComment, Announcement, 
  ActivityLog, NotificationItem, LeadMessage, TaskStatus, TaskPriority,
  TaskAssignmentType, OpenTaskStatus, OpenTaskInterest, UserRole,
  NotificationPriority, PushSubscriptionItem, NotificationPreferences
} from '@/types/database';
import { 
  SEED_TEAMS, SEED_PROFILES, SEED_SPRINTS, SEED_TASKS, 
  SEED_COMMENTS, SEED_ANNOUNCEMENTS, SEED_ACTIVITY_LOGS, 
  SEED_NOTIFICATIONS, SEED_LEAD_MESSAGES, SEED_OPEN_TASK_INTERESTS,
  SEED_NOTIFICATION_PREFERENCES
} from './seed-data';
import { Permissions } from '@/lib/permissions';

interface AppContextType {
  currentUser: Profile;
  allProfiles: Profile[];
  teams: Team[];
  sprints: Sprint[];
  tasks: Task[];
  visibleTasks: Task[];
  openTasks: Task[];
  openTaskInterests: OpenTaskInterest[];
  comments: TaskComment[];
  announcements: Announcement[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  leadMessages: LeadMessage[];
  notificationPreferences: NotificationPreferences;
  pushSubscriptions: PushSubscriptionItem[];
  unreadNotificationCount: number;
  isDevSimulation: boolean;
  
  // User simulation / Auth switching
  switchUser: (userId: string) => void;
  setCurrentUserByRole: (role: 'OFFICE_BEARER' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'ADMIN') => void;
  
  // Notification operations
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => void;
  subscribeToPush: (sub: { endpoint: string; p256dh_key: string; auth_key: string; device_name?: string }) => void;
  sendManualNotification: (data: {
    title: string;
    message: string;
    priority: NotificationPriority;
    audience: 'MY_TEAM' | 'SELECTED_MEMBERS' | 'ALL_SEDS' | 'ALL_LEADS' | 'OFFICE_BEARERS';
    targetTeamId?: string | null;
    targetMemberIds?: string[];
  }) => void;

  // Admin user & team operations
  createUser: (data: { full_name: string; email: string; role: UserRole; team_id: string | null; title?: string }) => Profile;
  updateUser: (userId: string, updates: Partial<Profile>) => void;
  suspendUser: (userId: string) => void;
  activateUser: (userId: string) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  archiveTeam: (teamId: string) => void;
  
  // Task operations
  createTask: (data: {
    team_id: string;
    sprint_id?: string | null;
    title: string;
    description: string;
    priority: TaskPriority;
    due_date?: string | null;
    story_points: number;
    assignee_ids?: string[];
    status?: TaskStatus;
    assignment_type?: TaskAssignmentType;
    open_task_status?: OpenTaskStatus;
    max_assignees?: number;
    requires_approval?: boolean;
    skills?: string[];
  }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  moveTaskToSprint: (taskId: string, sprintId: string | null) => void;

  // Open Task operations
  expressInterest: (taskId: string, message: string) => void;
  withdrawInterest: (taskId: string) => void;
  approveInterest: (interestId: string) => void;
  rejectInterest: (interestId: string) => void;
  
  // Sprint operations
  createSprint: (data: {
    team_id: string;
    name: string;
    goal: string;
    description?: string | null;
    start_date: string;
    end_date: string;
  }) => Sprint;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
  startSprint: (sprintId: string) => void;
  completeSprint: (sprintId: string) => void;
  
  // Comments
  addComment: (taskId: string, content: string) => void;
  
  // Announcements
  createAnnouncement: (data: {
    team_id: string | null;
    title: string;
    content: string;
    priority: 'NORMAL' | 'URGENT';
  }) => void;

  // Lead Messages
  sendLeadMessage: (data: {
    team_id: string;
    subject: string;
    message: string;
    recipient_id?: string | null;
  }) => void;
  replyLeadMessage: (messageId: string, reply: string) => void;

  // Team Operations
  createTeam: (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    accent: string;
  }) => Team;
  
  // Diagnostics & Reset
  resetToSeedData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'seds_os_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial state helper with local storage persistence
  const loadStored = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveStored = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  };

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return loadStored<string>('current_user_id', SEED_PROFILES[0].id); // Defaults to Office Bearer
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => loadStored<Profile[]>('profiles', SEED_PROFILES));
  const [teams, setTeams] = useState<Team[]>(() => loadStored<Team[]>('teams', SEED_TEAMS));
  const [sprints, setSprints] = useState<Sprint[]>(() => loadStored<Sprint[]>('sprints', SEED_SPRINTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadStored<Task[]>('tasks', SEED_TASKS));
  const [comments, setComments] = useState<TaskComment[]>(() => loadStored<TaskComment[]>('comments', SEED_COMMENTS));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadStored<Announcement[]>('announcements', SEED_ANNOUNCEMENTS));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadStored<ActivityLog[]>('activities', SEED_ACTIVITY_LOGS));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadStored<NotificationItem[]>('notifications', SEED_NOTIFICATIONS));
  const [leadMessages, setLeadMessages] = useState<LeadMessage[]>(() => loadStored<LeadMessage[]>('lead_messages', SEED_LEAD_MESSAGES));
  const [openTaskInterests, setOpenTaskInterests] = useState<OpenTaskInterest[]>(() => 
    loadStored<OpenTaskInterest[]>('open_task_interests', SEED_OPEN_TASK_INTERESTS)
  );
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() => 
    loadStored<NotificationPreferences>('notification_preferences', SEED_NOTIFICATION_PREFERENCES)
  );
  const [pushSubscriptions, setPushSubscriptions] = useState<PushSubscriptionItem[]>(() => 
    loadStored<PushSubscriptionItem[]>('push_subscriptions', [])
  );

  // Sync state changes to localStorage
  useEffect(() => saveStored('current_user_id', currentUserId), [currentUserId]);
  useEffect(() => saveStored('profiles', profiles), [profiles]);
  useEffect(() => saveStored('teams', teams), [teams]);
  useEffect(() => saveStored('sprints', sprints), [sprints]);
  useEffect(() => saveStored('tasks', tasks), [tasks]);
  useEffect(() => saveStored('comments', comments), [comments]);
  useEffect(() => saveStored('announcements', announcements), [announcements]);
  useEffect(() => saveStored('activities', activityLogs), [activityLogs]);
  useEffect(() => saveStored('notifications', notifications), [notifications]);
  useEffect(() => saveStored('lead_messages', leadMessages), [leadMessages]);
  useEffect(() => saveStored('open_task_interests', openTaskInterests), [openTaskInterests]);
  useEffect(() => saveStored('notification_preferences', notificationPreferences), [notificationPreferences]);
  useEffect(() => saveStored('push_subscriptions', pushSubscriptions), [pushSubscriptions]);

  const currentUser = useMemo(() => {
    const found = profiles.find(p => p.id === currentUserId);
    return found || profiles[0];
  }, [profiles, currentUserId]);

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
  }, []);

  const setCurrentUserByRole = useCallback((role: 'OFFICE_BEARER' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'ADMIN') => {
    const found = profiles.find(p => p.role === role);
    if (found) {
      setCurrentUserId(found.id);
    }
  }, [profiles]);

  // Tasks visible to the current user strictly matching role permissions (Kanban / My Tasks)
  const visibleTasks = useMemo(() => {
    if (currentUser.role === 'ADMIN') {
      return []; // Admin is strictly for user provisioning and membership management
    }
    if (currentUser.role === 'OFFICE_BEARER') {
      return tasks;
    }
    if (currentUser.role === 'TEAM_LEAD') {
      return tasks.filter(t => t.team_id === currentUser.team_id);
    }
    // TEAM_MEMBER: Only assigned tasks or collaborative tasks
    return tasks.filter(t => t.assignee_ids.includes(currentUser.id));
  }, [currentUser, tasks]);

  // Open Tasks discovery list based on permissions
  const openTasks = useMemo(() => {
    if (currentUser.role === 'ADMIN') {
      return [];
    }
    if (currentUser.role === 'OFFICE_BEARER') {
      return tasks.filter(t => t.assignment_type === 'OPEN');
    }
    if (currentUser.role === 'TEAM_LEAD') {
      return tasks.filter(t => t.assignment_type === 'OPEN' && t.team_id === currentUser.team_id);
    }
    // TEAM_MEMBER: Only published open tasks of their team
    return tasks.filter(t => t.assignment_type === 'OPEN' && t.team_id === currentUser.team_id && t.open_task_status === 'PUBLISHED');
  }, [currentUser, tasks]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => 
      (n.recipient_id === currentUser.id || n.user_id === currentUser.id) && !(n.is_read || n.read)
    ).length;
  }, [notifications, currentUser.id]);

  // Task Operations
  const createTask = useCallback((data: {
    team_id: string;
    sprint_id?: string | null;
    title: string;
    description: string;
    priority: TaskPriority;
    due_date?: string | null;
    story_points: number;
    assignee_ids?: string[];
    status?: TaskStatus;
    assignment_type?: TaskAssignmentType;
    open_task_status?: OpenTaskStatus;
    max_assignees?: number;
    requires_approval?: boolean;
    skills?: string[];
  }): Task => {
    if (!Permissions.canCreateTask(currentUser, data.team_id)) {
      throw new Error('Unauthorized to create task for this team');
    }

    const taskId = crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`;
    const assigneeIds = data.assignee_ids || [];
    const assignees = profiles.filter(p => assigneeIds.includes(p.id));
    const team = teams.find(t => t.id === data.team_id);
    const sprint = sprints.find(s => s.id === data.sprint_id);
    const isOpen = data.assignment_type === 'OPEN';

    const newTask: Task = {
      id: taskId,
      team_id: data.team_id,
      sprint_id: data.sprint_id || null,
      title: data.title,
      description: data.description,
      status: data.status || (data.sprint_id ? 'TODO' : 'BACKLOG'),
      priority: data.priority,
      due_date: data.due_date || null,
      story_points: data.story_points,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      team_name: team?.name || 'Unknown Team',
      sprint_name: sprint?.name,
      assignee_ids: assigneeIds,
      assignees,
      comments_count: 0,
      creator: currentUser,
      assignment_type: data.assignment_type || 'DIRECT',
      open_task_status: isOpen ? (data.open_task_status || 'PUBLISHED') : null,
      max_assignees: isOpen ? (data.max_assignees || 1) : 1,
      requires_approval: isOpen ? (data.requires_approval ?? true) : false,
      skills: isOpen ? (data.skills || []) : [],
      interested_count: 0,
    };

    setTasks(prev => [newTask, ...prev]);

    // Add activity log
    const newActivity: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: data.team_id,
      task_id: taskId,
      sprint_id: data.sprint_id || null,
      action: isOpen ? 'open_task_published' : 'task_created',
      metadata: { title: data.title, points: data.story_points, type: newTask.assignment_type },
      created_at: new Date().toISOString(),
      actor: currentUser,
      task_title: data.title,
      team_name: team?.name,
    };
    setActivityLogs(prev => [newActivity, ...prev]);

    // Send notifications
    if (isOpen) {
      profiles
        .filter(p => p.team_id === data.team_id && p.role === 'TEAM_MEMBER')
        .forEach(m => {
          const notif: NotificationItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${m.id}`,
            user_id: m.id,
            recipient_id: m.id,
            actor_id: currentUser.id,
            team_id: data.team_id,
            task_id: taskId,
            sprint_id: data.sprint_id || null,
            title: `New task available in ${team?.name || 'your team'}`,
            message: `Open Task: "${data.title}" (${data.story_points} pts). Review and express interest.`,
            type: 'open_task_interest',
            priority: 'INFO',
            link: '/open-tasks',
            action_url: '/open-tasks',
            read: false,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications(prev => [notif, ...prev]);
        });
    } else {
      const isCollab = assigneeIds.length > 1;
      assigneeIds.forEach(uid => {
        if (uid !== currentUser.id) {
          const notif: NotificationItem = {
            id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${uid}`,
            user_id: uid,
            recipient_id: uid,
            actor_id: currentUser.id,
            team_id: data.team_id,
            task_id: taskId,
            sprint_id: data.sprint_id || null,
            title: isCollab ? 'New collaborative task assigned to you' : 'New task assigned to you',
            message: isCollab
              ? `${currentUser.full_name} assigned you to collaborative task "${data.title}" with ${assigneeIds.length - 1} other member(s)`
              : `${currentUser.full_name} assigned you to "${data.title}"`,
            type: 'task_assigned',
            priority: data.priority === 'URGENT' ? 'URGENT' : (data.priority === 'HIGH' ? 'IMPORTANT' : 'INFO'),
            link: `/tasks/${taskId}`,
            action_url: `/tasks/${taskId}`,
            read: false,
            is_read: false,
            created_at: new Date().toISOString(),
          };
          setNotifications(prev => [notif, ...prev]);
        }
      });
    }

    return newTask;
  }, [currentUser, profiles, teams, sprints]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      
      const updatedAssignees = updates.assignee_ids 
        ? profiles.filter(p => updates.assignee_ids!.includes(p.id))
        : t.assignees;

      const updatedSprint = updates.sprint_id !== undefined
        ? sprints.find(s => s.id === updates.sprint_id)?.name
        : t.sprint_name;

      return {
        ...t,
        ...updates,
        assignees: updatedAssignees,
        sprint_name: updatedSprint,
        updated_at: new Date().toISOString(),
      };
    }));
  }, [profiles, sprints]);

  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;

      if (!Permissions.canUpdateTaskStatus(currentUser, task)) {
        console.warn('Unauthorized status change attempt');
        return prev;
      }

      // Activity log
      const act: ActivityLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
        actor_id: currentUser.id,
        team_id: task.team_id,
        task_id: taskId,
        sprint_id: task.sprint_id,
        action: newStatus === 'COMPLETED' ? 'task_completed' : 'task_status_changed',
        metadata: { title: task.title, old_status: task.status, new_status: newStatus },
        created_at: new Date().toISOString(),
        actor: currentUser,
        task_title: task.title,
        team_name: task.team_name,
      };
      setActivityLogs(acts => [act, ...acts]);
      // Send notifications based on new status
      if (newStatus === 'BLOCKED') {
        const recipients = profiles.filter(p => (p.role === 'TEAM_LEAD' && p.team_id === task.team_id) || p.role === 'OFFICE_BEARER');
        recipients.forEach(r => {
          if (r.id !== currentUser.id) {
            setNotifications(n => [{
              id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${r.id}`,
              user_id: r.id,
              recipient_id: r.id,
              actor_id: currentUser.id,
              team_id: task.team_id,
              task_id: taskId,
              sprint_id: task.sprint_id,
              title: `Task Blocked: ${task.title}`,
              message: `${currentUser.full_name} marked "${task.title}" as blocked. Attention required.`,
              type: 'task_status_changed',
              priority: 'URGENT',
              link: `/tasks/${taskId}`,
              action_url: `/tasks/${taskId}`,
              read: false,
              is_read: false,
              created_at: new Date().toISOString(),
            }, ...n]);
          }
        });
      } else if (newStatus === 'IN_REVIEW') {
        const recipients = profiles.filter(p => (p.role === 'TEAM_LEAD' && p.team_id === task.team_id) || p.id === task.created_by);
        recipients.forEach(r => {
          if (r.id !== currentUser.id) {
            setNotifications(n => [{
              id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${r.id}`,
              user_id: r.id,
              recipient_id: r.id,
              actor_id: currentUser.id,
              team_id: task.team_id,
              task_id: taskId,
              sprint_id: task.sprint_id,
              title: `Task Ready for Review: ${task.title}`,
              message: `${currentUser.full_name} submitted "${task.title}" for review.`,
              type: 'task_status_changed',
              priority: 'IMPORTANT',
              link: `/tasks/${taskId}`,
              action_url: `/tasks/${taskId}`,
              read: false,
              is_read: false,
              created_at: new Date().toISOString(),
            }, ...n]);
          }
        });
      } else if (newStatus === 'COMPLETED') {
        const recipients = profiles.filter(p => p.id === task.created_by || (p.role === 'TEAM_LEAD' && p.team_id === task.team_id));
        recipients.forEach(r => {
          if (r.id !== currentUser.id) {
            setNotifications(n => [{
              id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${r.id}`,
              user_id: r.id,
              recipient_id: r.id,
              actor_id: currentUser.id,
              team_id: task.team_id,
              task_id: taskId,
              sprint_id: task.sprint_id,
              title: `Task Completed: ${task.title}`,
              message: `${currentUser.full_name} marked "${task.title}" as completed.`,
              type: 'task_status_changed',
              priority: 'INFO',
              link: `/tasks/${taskId}`,
              action_url: `/tasks/${taskId}`,
              read: false,
              is_read: false,
              created_at: new Date().toISOString(),
            }, ...n]);
          }
        });
      }

      return prev.map(t => t.id === taskId ? {
        ...t,
        status: newStatus,
        updated_at: new Date().toISOString()
      } : t);
    });
  }, [currentUser, profiles]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task || !Permissions.canDeleteTask(currentUser, task)) {
        return prev;
      }
      return prev.filter(t => t.id !== taskId);
    });
  }, [currentUser]);

  const moveTaskToSprint = useCallback((taskId: string, sprintId: string | null) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task || !Permissions.canEditTask(currentUser, task)) {
        return prev;
      }
      const targetSprint = sprintId ? sprints.find(s => s.id === sprintId) : null;
      return prev.map(t => t.id === taskId ? {
        ...t,
        sprint_id: sprintId,
        sprint_name: targetSprint?.name,
        status: sprintId ? (t.status === 'BACKLOG' ? 'TODO' : t.status) : 'BACKLOG',
        updated_at: new Date().toISOString()
      } : t);
    });
  }, [currentUser, sprints]);

  // Open Task Operations
  const expressInterest = useCallback((taskId: string, message: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!Permissions.canExpressInterest(currentUser, task)) {
      console.warn('Unauthorized or ineligible to express interest');
      return;
    }

    // Check if auto-claim is allowed (requires_approval === false)
    if (task.requires_approval === false) {
      const updatedAssigneeIds = [...task.assignee_ids, currentUser.id];
      const isFull = updatedAssigneeIds.length >= (task.max_assignees || 1);

      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          assignee_ids: updatedAssigneeIds,
          assignees: [...t.assignees, currentUser],
          open_task_status: isFull ? 'ASSIGNED' : t.open_task_status,
          status: t.status === 'BACKLOG' ? 'TODO' : t.status,
          updated_at: new Date().toISOString(),
        };
      }));

      const interestId = crypto.randomUUID ? crypto.randomUUID() : `interest-${Date.now()}`;
      const newInterest: OpenTaskInterest = {
        id: interestId,
        task_id: taskId,
        user_id: currentUser.id,
        message: message || 'Claimed directly (no lead approval required)',
        status: 'APPROVED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: currentUser,
        task,
      };
      setOpenTaskInterests(prev => [newInterest, ...prev.filter(i => !(i.task_id === taskId && i.user_id === currentUser.id))]);

      const memberNotif: NotificationItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
        user_id: currentUser.id,
        title: 'Task Claimed Successfully',
        message: `You claimed "${task.title}". It has been added to your tasks.`,
        type: 'open_task_approved',
        link: `/tasks/${taskId}`,
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [memberNotif, ...prev]);
      return;
    }

    // Requires approval: Record interest
    const interestId = crypto.randomUUID ? crypto.randomUUID() : `interest-${Date.now()}`;
    const newInterest: OpenTaskInterest = {
      id: interestId,
      task_id: taskId,
      user_id: currentUser.id,
      message,
      status: 'INTERESTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: currentUser,
      task,
    };

    setOpenTaskInterests(prev => {
      const filtered = prev.filter(i => !(i.task_id === taskId && i.user_id === currentUser.id));
      return [newInterest, ...filtered];
    });

    // Update interested count on task
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        interested_count: (t.interested_count || 0) + 1,
        updated_at: new Date().toISOString(),
      };
    }));

    // Activity log
    const act: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: task.team_id,
      task_id: taskId,
      sprint_id: task.sprint_id,
      action: 'interest_expressed',
      metadata: { task_title: task.title, message },
      created_at: new Date().toISOString(),
      actor: currentUser,
      task_title: task.title,
      team_name: task.team_name,
    };
    setActivityLogs(prev => [act, ...prev]);

    // Notify Team Leads & Office Bearers
    const leads = profiles.filter(p => 
      (p.role === 'TEAM_LEAD' && p.team_id === task.team_id) || p.role === 'OFFICE_BEARER'
    );
    leads.forEach(lead => {
      const notif: NotificationItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${lead.id}`,
        user_id: lead.id,
        title: 'New Open Task Applicant',
        message: `${currentUser.full_name} expressed interest in "${task.title}": "${message}"`,
        type: 'open_task_interest',
        link: '/open-tasks',
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev]);
    });
  }, [currentUser, tasks, profiles]);

  const withdrawInterest = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setOpenTaskInterests(prev => prev.map(i => {
      if (i.task_id === taskId && i.user_id === currentUser.id && i.status === 'INTERESTED') {
        return {
          ...i,
          status: 'WITHDRAWN',
          updated_at: new Date().toISOString(),
        };
      }
      return i;
    }));

    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        interested_count: Math.max(0, (t.interested_count || 1) - 1),
        updated_at: new Date().toISOString(),
      };
    }));

    if (task) {
      const act: ActivityLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
        actor_id: currentUser.id,
        team_id: task.team_id,
        task_id: taskId,
        sprint_id: task.sprint_id,
        action: 'interest_withdrawn',
        metadata: { task_title: task.title },
        created_at: new Date().toISOString(),
        actor: currentUser,
        task_title: task.title,
        team_name: task.team_name,
      };
      setActivityLogs(prev => [act, ...prev]);
    }
  }, [currentUser, tasks]);

  const approveInterest = useCallback((interestId: string) => {
    const interest = openTaskInterests.find(i => i.id === interestId);
    if (!interest) return;
    const task = tasks.find(t => t.id === interest.task_id);
    if (!task) return;

    if (!Permissions.canManageOpenTask(currentUser, task)) {
      console.warn('Unauthorized to approve interest for this task');
      return;
    }

    const applicant = profiles.find(p => p.id === interest.user_id);
    if (!applicant) return;

    // Update interest status
    setOpenTaskInterests(prev => prev.map(i => 
      i.id === interestId 
        ? { ...i, status: 'APPROVED', updated_at: new Date().toISOString() } 
        : i
    ));

    // Update task assignees and open_task_status
    setTasks(prev => prev.map(t => {
      if (t.id !== task.id) return t;
      const alreadyAssigned = t.assignee_ids.includes(applicant.id);
      const newAssigneeIds = alreadyAssigned ? t.assignee_ids : [...t.assignee_ids, applicant.id];
      const newAssignees = alreadyAssigned ? t.assignees : [...t.assignees, applicant];
      const isCapacityReached = newAssigneeIds.length >= (t.max_assignees || 1);

      return {
        ...t,
        assignee_ids: newAssigneeIds,
        assignees: newAssignees,
        open_task_status: isCapacityReached ? 'ASSIGNED' : t.open_task_status,
        status: t.status === 'BACKLOG' ? 'TODO' : t.status,
        updated_at: new Date().toISOString(),
      };
    }));

    // Activity log
    const act: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: task.team_id,
      task_id: task.id,
      sprint_id: task.sprint_id,
      action: 'interest_approved',
      metadata: { task_title: task.title, member_name: applicant.full_name },
      created_at: new Date().toISOString(),
      actor: currentUser,
      task_title: task.title,
      team_name: task.team_name,
    };
    setActivityLogs(prev => [act, ...prev]);

    // Send notification to approved member
    const notif: NotificationItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      user_id: applicant.id,
      title: 'Open Task Application Approved!',
      message: `Your application for "${task.title}" was approved by ${currentUser.full_name}. The task is now in your active assignments.`,
      type: 'open_task_approved',
      link: `/tasks/${task.id}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  }, [currentUser, openTaskInterests, tasks, profiles]);

  const rejectInterest = useCallback((interestId: string) => {
    const interest = openTaskInterests.find(i => i.id === interestId);
    if (!interest) return;
    const task = tasks.find(t => t.id === interest.task_id);
    if (!task) return;

    if (!Permissions.canManageOpenTask(currentUser, task)) {
      console.warn('Unauthorized to reject interest for this task');
      return;
    }

    setOpenTaskInterests(prev => prev.map(i => 
      i.id === interestId 
        ? { ...i, status: 'REJECTED', updated_at: new Date().toISOString() } 
        : i
    ));

    const act: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: task.team_id,
      task_id: task.id,
      sprint_id: task.sprint_id,
      action: 'interest_rejected',
      metadata: { task_title: task.title },
      created_at: new Date().toISOString(),
      actor: currentUser,
      task_title: task.title,
      team_name: task.team_name,
    };
    setActivityLogs(prev => [act, ...prev]);

    // Notify member
    const notif: NotificationItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}`,
      user_id: interest.user_id,
      title: 'Open Task Application Update',
      message: `Your application for "${task.title}" was not selected at this time.`,
      type: 'open_task_rejected',
      link: '/open-tasks',
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);
  }, [currentUser, openTaskInterests, tasks]);

  // Sprint Operations
  const createSprint = useCallback((data: {
    team_id: string;
    name: string;
    goal: string;
    description?: string | null;
    start_date: string;
    end_date: string;
  }): Sprint => {
    if (!Permissions.canCreateSprint(currentUser, data.team_id)) {
      throw new Error('Unauthorized to create sprint for this team');
    }

    const sprintId = crypto.randomUUID ? crypto.randomUUID() : `sprint-${Date.now()}`;
    const team = teams.find(t => t.id === data.team_id);

    const newSprint: Sprint = {
      id: sprintId,
      team_id: data.team_id,
      name: data.name,
      goal: data.goal,
      description: data.description || null,
      start_date: data.start_date,
      end_date: data.end_date,
      status: 'PLANNED',
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      team_name: team?.name,
      total_tasks: 0,
      completed_tasks: 0,
      total_points: 0,
      completed_points: 0,
    };

    setSprints(prev => [newSprint, ...prev]);

    const act: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: data.team_id,
      task_id: null,
      sprint_id: sprintId,
      action: 'sprint_created',
      metadata: { name: data.name, goal: data.goal },
      created_at: new Date().toISOString(),
      actor: currentUser,
      team_name: team?.name,
    };
    setActivityLogs(prev => [act, ...prev]);

    return newSprint;
  }, [currentUser, teams]);

  const updateSprint = useCallback((sprintId: string, updates: Partial<Sprint>) => {
    setSprints(prev => prev.map(s => s.id === sprintId ? {
      ...s,
      ...updates,
      updated_at: new Date().toISOString(),
    } : s));
  }, []);

  const startSprint = useCallback((sprintId: string) => {
    setSprints(prev => prev.map(s => {
      if (s.id !== sprintId) {
        // If another sprint was active in the same team, complete it or keep it
        return s;
      }
      return {
        ...s,
        status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      };
    }));

    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      const act: ActivityLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
        actor_id: currentUser.id,
        team_id: sprint.team_id,
        task_id: null,
        sprint_id: sprintId,
        action: 'sprint_started',
        metadata: { name: sprint.name },
        created_at: new Date().toISOString(),
        actor: currentUser,
        team_name: sprint.team_name,
      };
      setActivityLogs(prev => [act, ...prev]);

      profiles.filter(p => p.team_id === sprint.team_id && p.id !== currentUser.id).forEach(r => {
        setNotifications(n => [{
          id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${r.id}`,
          user_id: r.id,
          recipient_id: r.id,
          actor_id: currentUser.id,
          team_id: sprint.team_id,
          sprint_id: sprint.id,
          title: `Sprint Started: ${sprint.name}`,
          message: `${sprint.name} is now active. Review your sprint backlog.`,
          type: 'sprint_started',
          priority: 'IMPORTANT',
          link: '/sprints',
          action_url: '/sprints',
          read: false,
          is_read: false,
          created_at: new Date().toISOString(),
        }, ...n]);
      });
    }
  }, [sprints, currentUser, profiles]);

  const completeSprint = useCallback((sprintId: string) => {
    setSprints(prev => prev.map(s => s.id === sprintId ? {
      ...s,
      status: 'COMPLETED',
      updated_at: new Date().toISOString(),
    } : s));

    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      const act: ActivityLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
        actor_id: currentUser.id,
        team_id: sprint.team_id,
        task_id: null,
        sprint_id: sprintId,
        action: 'sprint_completed',
        metadata: { name: sprint.name },
        created_at: new Date().toISOString(),
        actor: currentUser,
        team_name: sprint.team_name,
      };
      setActivityLogs(prev => [act, ...prev]);

      profiles.filter(p => p.team_id === sprint.team_id && p.id !== currentUser.id).forEach(r => {
        setNotifications(n => [{
          id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${r.id}`,
          user_id: r.id,
          recipient_id: r.id,
          actor_id: currentUser.id,
          team_id: sprint.team_id,
          sprint_id: sprint.id,
          title: `Sprint Completed: ${sprint.name}`,
          message: `${sprint.name} has concluded. Check retrospective summary.`,
          type: 'sprint_completed',
          priority: 'INFO',
          link: '/sprints',
          action_url: '/sprints',
          read: false,
          is_read: false,
          created_at: new Date().toISOString(),
        }, ...n]);
      });
    }
  }, [sprints, currentUser, profiles]);

  // Comment Operations
  const addComment = useCallback((taskId: string, content: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newComment: TaskComment = {
      id: crypto.randomUUID ? crypto.randomUUID() : `comm-${Date.now()}`,
      task_id: taskId,
      author_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: currentUser,
    };

    setComments(prev => [...prev, newComment]);

    // Update comments count on task
    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      comments_count: (t.comments_count || 0) + 1,
    } : t));

    // Notify other assignees on this task
    task.assignee_ids.forEach(uid => {
      if (uid !== currentUser.id) {
        const notif: NotificationItem = {
          id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${uid}`,
          user_id: uid,
          title: 'New Comment',
          message: `${currentUser.full_name} commented on "${task.title}"`,
          type: 'comment',
          link: `/tasks/${taskId}`,
          read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });
  }, [currentUser, tasks]);

  // Announcements
  const createAnnouncement = useCallback((data: {
    team_id: string | null;
    title: string;
    content: string;
    priority: 'NORMAL' | 'URGENT';
  }) => {
    const team = data.team_id ? teams.find(t => t.id === data.team_id) : null;
    const newAnnouncement: Announcement = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ann-${Date.now()}`,
      team_id: data.team_id,
      created_by: currentUser.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: currentUser,
      team_name: team ? team.name : 'Organization-Wide',
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);

    // Notify users
    const recipients = data.team_id 
      ? profiles.filter(p => p.team_id === data.team_id && p.id !== currentUser.id)
      : profiles.filter(p => p.id !== currentUser.id);

    recipients.forEach(r => {
      const notif: NotificationItem = {
        id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${r.id}`,
        user_id: r.id,
        title: `${data.priority === 'URGENT' ? '🚨 ' : ''}Announcement: ${data.title}`,
        message: `${currentUser.full_name} posted an announcement: "${data.title}"`,
        type: 'announcement',
        link: '/communication',
        read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev]);
    });
  }, [currentUser, teams, profiles]);

  // Lead Messages
  const sendLeadMessage = useCallback((data: {
    team_id: string;
    subject: string;
    message: string;
    recipient_id?: string | null;
  }) => {
    const newMsg: LeadMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      team_id: data.team_id,
      sender_id: currentUser.id,
      recipient_id: data.recipient_id || null,
      subject: data.subject,
      message: data.message,
      created_at: new Date().toISOString(),
      sender: currentUser,
    };
    setLeadMessages(prev => [newMsg, ...prev]);
  }, [currentUser]);

  const replyLeadMessage = useCallback((messageId: string, reply: string) => {
    setLeadMessages(prev => prev.map(m => m.id === messageId ? {
      ...m,
      reply,
      replied_at: new Date().toISOString(),
      replied_by: currentUser.id,
    } : m));
  }, [currentUser]);

  // Create Team
  const createTeam = useCallback((data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    accent: string;
  }): Team => {
    const teamId = crypto.randomUUID ? crypto.randomUUID() : `team-${Date.now()}`;
    const newTeam: Team = {
      id: teamId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      accent: data.accent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_count: 0,
    };
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  }, []);

  // Notification operations
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, is_read: true, read_at: new Date().toISOString() } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => 
      (n.user_id === currentUser.id || n.recipient_id === currentUser.id)
        ? { ...n, read: true, is_read: true, read_at: now }
        : n
    ));
  }, [currentUser.id]);

  const updateNotificationPreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setNotificationPreferences(prev => ({
      ...prev,
      ...prefs,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const subscribeToPush = useCallback((sub: { endpoint: string; p256dh_key: string; auth_key: string; device_name?: string }) => {
    const newSub: PushSubscriptionItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `push-${Date.now()}`,
      user_id: currentUser.id,
      endpoint: sub.endpoint,
      p256dh_key: sub.p256dh_key,
      auth_key: sub.auth_key,
      device_name: sub.device_name || 'Browser Device',
      created_at: new Date().toISOString(),
    };
    setPushSubscriptions(prev => [newSub, ...prev.filter(p => p.endpoint !== sub.endpoint)]);
  }, [currentUser.id]);

  const sendManualNotification = useCallback((data: {
    title: string;
    message: string;
    priority: NotificationPriority;
    audience: 'MY_TEAM' | 'SELECTED_MEMBERS' | 'ALL_SEDS' | 'ALL_LEADS' | 'OFFICE_BEARERS';
    targetTeamId?: string | null;
    targetMemberIds?: string[];
  }) => {
    if (!Permissions.canSendBroadcast(currentUser)) {
      throw new Error('Unauthorized to send broadcast notifications');
    }

    let recipientIds: string[] = [];

    if (currentUser.role === 'TEAM_LEAD') {
      const myTeamId = currentUser.team_id;
      if (data.audience === 'MY_TEAM') {
        recipientIds = profiles.filter(p => p.team_id === myTeamId && p.id !== currentUser.id).map(p => p.id);
      } else if (data.audience === 'SELECTED_MEMBERS' && data.targetMemberIds) {
        recipientIds = profiles
          .filter(p => p.team_id === myTeamId && data.targetMemberIds!.includes(p.id) && p.id !== currentUser.id)
          .map(p => p.id);
      } else {
        throw new Error('Team Leads may only send notifications to their own team or team members');
      }
    } else if (currentUser.role === 'OFFICE_BEARER') {
      if (data.audience === 'ALL_SEDS') {
        recipientIds = profiles.filter(p => p.id !== currentUser.id).map(p => p.id);
      } else if (data.audience === 'ALL_LEADS') {
        recipientIds = profiles.filter(p => p.role === 'TEAM_LEAD' && p.id !== currentUser.id).map(p => p.id);
      } else if (data.audience === 'OFFICE_BEARERS') {
        recipientIds = profiles.filter(p => p.role === 'OFFICE_BEARER' && p.id !== currentUser.id).map(p => p.id);
      } else if (data.audience === 'MY_TEAM' && data.targetTeamId) {
        recipientIds = profiles.filter(p => p.team_id === data.targetTeamId && p.id !== currentUser.id).map(p => p.id);
      } else if (data.audience === 'SELECTED_MEMBERS' && data.targetMemberIds) {
        recipientIds = data.targetMemberIds.filter(id => id !== currentUser.id);
      }
    }

    const createdNotifications: NotificationItem[] = recipientIds.map(uid => ({
      id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${uid}`,
      user_id: uid,
      recipient_id: uid,
      actor_id: currentUser.id,
      team_id: currentUser.team_id || data.targetTeamId || null,
      title: data.title,
      message: data.message,
      type: 'manual_broadcast',
      priority: data.priority,
      link: '/communication',
      action_url: '/communication',
      read: false,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    setNotifications(prev => [...createdNotifications, ...prev]);

    // Activity log
    const act: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: currentUser.team_id || null,
      task_id: null,
      sprint_id: null,
      action: 'broadcast_sent',
      metadata: { title: data.title, audience: data.audience, recipient_count: recipientIds.length },
      created_at: new Date().toISOString(),
      actor: currentUser,
    };
    setActivityLogs(prev => [act, ...prev]);
  }, [currentUser, profiles]);

  // Admin user & team operations
  const createUser = useCallback((data: {
    full_name: string;
    email: string;
    role: UserRole;
    team_id: string | null;
    title?: string;
  }): Profile => {
    if (!Permissions.canManageUsers(currentUser)) {
      throw new Error('Unauthorized to manage users');
    }

    if ((data.role === 'TEAM_MEMBER' || data.role === 'TEAM_LEAD') && !data.team_id) {
      throw new Error('Team Members and Team Leads must be assigned to exactly one team.');
    }

    const newId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;
    const newProfile: Profile = {
      id: newId,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      team_id: data.team_id,
      title: data.title || (data.role === 'ADMIN' ? 'Platform Administrator' : (data.role === 'TEAM_LEAD' ? 'Team Lead' : 'Engineer')),
      account_status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.full_name)}`,
    };

    setProfiles(prev => [...prev, newProfile]);

    // If assigned to a team, increment team count
    if (data.team_id) {
      setTeams(prev => prev.map(t => t.id === data.team_id ? { ...t, member_count: (t.member_count || 0) + 1 } : t));
    }

    const act: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: data.team_id,
      task_id: null,
      sprint_id: null,
      action: 'user_created',
      metadata: { full_name: data.full_name, email: data.email, role: data.role },
      created_at: new Date().toISOString(),
      actor: currentUser,
    };
    setActivityLogs(prev => [act, ...prev]);

    return newProfile;
  }, [currentUser]);

  const updateUser = useCallback((userId: string, updates: Partial<Profile>) => {
    if (!Permissions.canManageUsers(currentUser)) {
      throw new Error('Unauthorized to edit users');
    }

    setProfiles(prev => prev.map(p => {
      if (p.id !== userId) return p;
      return {
        ...p,
        ...updates,
      };
    }));
  }, [currentUser]);

  const suspendUser = useCallback((userId: string) => {
    if (!Permissions.canManageUsers(currentUser)) {
      throw new Error('Unauthorized to suspend users');
    }
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, account_status: 'SUSPENDED' } : p));
  }, [currentUser]);

  const activateUser = useCallback((userId: string) => {
    if (!Permissions.canManageUsers(currentUser)) {
      throw new Error('Unauthorized to activate users');
    }
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, account_status: 'ACTIVE' } : p));
  }, [currentUser]);

  const updateTeam = useCallback((teamId: string, updates: Partial<Team>) => {
    if (!Permissions.canManageUsers(currentUser) && currentUser.role !== 'OFFICE_BEARER') {
      throw new Error('Unauthorized to update team');
    }
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
  }, [currentUser]);

  const archiveTeam = useCallback((teamId: string) => {
    if (!Permissions.canManageUsers(currentUser) && currentUser.role !== 'OFFICE_BEARER') {
      throw new Error('Unauthorized to archive team');
    }
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, description: `[Archived] ${t.description}`, updated_at: new Date().toISOString() } : t));
  }, [currentUser]);

  const resetToSeedData = useCallback(() => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
    setTeams(SEED_TEAMS);
    setSprints(SEED_SPRINTS);
    setTasks(SEED_TASKS);
    setComments(SEED_COMMENTS);
    setAnnouncements(SEED_ANNOUNCEMENTS);
    setActivityLogs(SEED_ACTIVITY_LOGS);
    setNotifications(SEED_NOTIFICATIONS);
    setLeadMessages(SEED_LEAD_MESSAGES);
    setOpenTaskInterests(SEED_OPEN_TASK_INTERESTS);
    setProfiles(SEED_PROFILES);
    setNotificationPreferences(SEED_NOTIFICATION_PREFERENCES);
    setPushSubscriptions([]);
    setCurrentUserId(SEED_PROFILES[0].id);
  }, []);

  return (
    <AppContext.Provider value={{
      currentUser,
      allProfiles: profiles,
      teams,
      sprints,
      tasks,
      visibleTasks,
      openTasks,
      openTaskInterests,
      comments,
      announcements,
      activityLogs,
      notifications,
      leadMessages,
      notificationPreferences,
      pushSubscriptions,
      unreadNotificationCount,
      isDevSimulation: true,
      switchUser,
      setCurrentUserByRole,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      moveTaskToSprint,
      expressInterest,
      withdrawInterest,
      approveInterest,
      rejectInterest,
      createSprint,
      updateSprint,
      startSprint,
      completeSprint,
      addComment,
      createAnnouncement,
      sendLeadMessage,
      replyLeadMessage,
      createTeam,
      markNotificationRead,
      markAllNotificationsRead,
      updateNotificationPreferences,
      subscribeToPush,
      sendManualNotification,
      createUser,
      updateUser,
      suspendUser,
      activateUser,
      updateTeam,
      archiveTeam,
      resetToSeedData,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
