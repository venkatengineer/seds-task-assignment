'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Profile, Team, Sprint, Task, TaskComment, Announcement, 
  ActivityLog, NotificationItem, LeadMessage, TaskStatus, TaskPriority 
} from '@/types/database';
import { 
  SEED_TEAMS, SEED_PROFILES, SEED_SPRINTS, SEED_TASKS, 
  SEED_COMMENTS, SEED_ANNOUNCEMENTS, SEED_ACTIVITY_LOGS, 
  SEED_NOTIFICATIONS, SEED_LEAD_MESSAGES 
} from './seed-data';
import { Permissions } from '@/lib/permissions';

interface AppContextType {
  currentUser: Profile;
  allProfiles: Profile[];
  teams: Team[];
  sprints: Sprint[];
  tasks: Task[];
  visibleTasks: Task[];
  comments: TaskComment[];
  announcements: Announcement[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  leadMessages: LeadMessage[];
  unreadNotificationCount: number;
  isDevSimulation: boolean;
  
  // User simulation / Auth switching
  switchUser: (userId: string) => void;
  setCurrentUserByRole: (role: 'OFFICE_BEARER' | 'TEAM_LEAD' | 'TEAM_MEMBER') => void;
  
  // Task operations
  createTask: (data: {
    team_id: string;
    sprint_id?: string | null;
    title: string;
    description: string;
    priority: TaskPriority;
    due_date?: string | null;
    story_points: number;
    assignee_ids: string[];
    status?: TaskStatus;
  }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  moveTaskToSprint: (taskId: string, sprintId: string | null) => void;
  
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

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
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

  const [profiles] = useState<Profile[]>(SEED_PROFILES);
  const [teams, setTeams] = useState<Team[]>(() => loadStored<Team[]>('teams', SEED_TEAMS));
  const [sprints, setSprints] = useState<Sprint[]>(() => loadStored<Sprint[]>('sprints', SEED_SPRINTS));
  const [tasks, setTasks] = useState<Task[]>(() => loadStored<Task[]>('tasks', SEED_TASKS));
  const [comments, setComments] = useState<TaskComment[]>(() => loadStored<TaskComment[]>('comments', SEED_COMMENTS));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => loadStored<Announcement[]>('announcements', SEED_ANNOUNCEMENTS));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadStored<ActivityLog[]>('activities', SEED_ACTIVITY_LOGS));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadStored<NotificationItem[]>('notifications', SEED_NOTIFICATIONS));
  const [leadMessages, setLeadMessages] = useState<LeadMessage[]>(() => loadStored<LeadMessage[]>('lead_messages', SEED_LEAD_MESSAGES));

  // Sync state changes to localStorage
  useEffect(() => saveStored('current_user_id', currentUserId), [currentUserId]);
  useEffect(() => saveStored('teams', teams), [teams]);
  useEffect(() => saveStored('sprints', sprints), [sprints]);
  useEffect(() => saveStored('tasks', tasks), [tasks]);
  useEffect(() => saveStored('comments', comments), [comments]);
  useEffect(() => saveStored('announcements', announcements), [announcements]);
  useEffect(() => saveStored('activities', activityLogs), [activityLogs]);
  useEffect(() => saveStored('notifications', notifications), [notifications]);
  useEffect(() => saveStored('lead_messages', leadMessages), [leadMessages]);

  const currentUser = useMemo(() => {
    const found = profiles.find(p => p.id === currentUserId);
    return found || profiles[0];
  }, [profiles, currentUserId]);

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
  }, []);

  const setCurrentUserByRole = useCallback((role: 'OFFICE_BEARER' | 'TEAM_LEAD' | 'TEAM_MEMBER') => {
    const found = profiles.find(p => p.role === role);
    if (found) {
      setCurrentUserId(found.id);
    }
  }, [profiles]);

  // Tasks visible to the current user strictly matching role permissions
  const visibleTasks = useMemo(() => {
    if (currentUser.role === 'OFFICE_BEARER') {
      return tasks;
    }
    if (currentUser.role === 'TEAM_LEAD') {
      return tasks.filter(t => t.team_id === currentUser.team_id);
    }
    // TEAM_MEMBER: Only assigned tasks or collaborative tasks
    return tasks.filter(t => t.assignee_ids.includes(currentUser.id));
  }, [currentUser, tasks]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => n.user_id === currentUser.id && !n.read).length;
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
    assignee_ids: string[];
    status?: TaskStatus;
  }): Task => {
    if (!Permissions.canCreateTask(currentUser, data.team_id)) {
      throw new Error('Unauthorized to create task for this team');
    }

    const taskId = crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`;
    const assignees = profiles.filter(p => data.assignee_ids.includes(p.id));
    const team = teams.find(t => t.id === data.team_id);
    const sprint = sprints.find(s => s.id === data.sprint_id);

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
      assignee_ids: data.assignee_ids,
      assignees,
      comments_count: 0,
      creator: currentUser,
    };

    setTasks(prev => [newTask, ...prev]);

    // Add activity log
    const newActivity: ActivityLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`,
      actor_id: currentUser.id,
      team_id: data.team_id,
      task_id: taskId,
      sprint_id: data.sprint_id || null,
      action: 'task_created',
      metadata: { title: data.title, points: data.story_points },
      created_at: new Date().toISOString(),
      actor: currentUser,
      task_title: data.title,
      team_name: team?.name,
    };
    setActivityLogs(prev => [newActivity, ...prev]);

    // Send notifications to assignees
    data.assignee_ids.forEach(uid => {
      if (uid !== currentUser.id) {
        const notif: NotificationItem = {
          id: crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${uid}`,
          user_id: uid,
          title: 'New Task Assigned',
          message: `${currentUser.full_name} assigned you to "${data.title}"`,
          type: 'task_assigned',
          link: `/tasks/${taskId}`,
          read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications(prev => [notif, ...prev]);
      }
    });

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

      return prev.map(t => t.id === taskId ? {
        ...t,
        status: newStatus,
        updated_at: new Date().toISOString()
      } : t);
    });
  }, [currentUser]);

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
    }
  }, [sprints, currentUser]);

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
    }
  }, [sprints, currentUser]);

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

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => n.user_id === currentUser.id ? { ...n, read: true } : n));
  }, [currentUser.id]);

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
      comments,
      announcements,
      activityLogs,
      notifications,
      leadMessages,
      unreadNotificationCount,
      isDevSimulation: true,
      switchUser,
      setCurrentUserByRole,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      moveTaskToSprint,
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
