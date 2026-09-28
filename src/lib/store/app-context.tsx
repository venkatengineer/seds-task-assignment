'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Profile, Team, Sprint, Task, TaskComment, Announcement, 
  ActivityLog, NotificationItem, LeadMessage, TaskStatus, TaskPriority,
  TaskAssignmentType, OpenTaskStatus, OpenTaskInterest, UserRole,
  NotificationPriority, PushSubscriptionItem, NotificationPreferences, AccountStatus
} from '@/types/database';
import { Permissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

const GUEST_PROFILE: Profile = {
  id: '',
  full_name: '',
  email: '',
  avatar_url: null,
  role: 'TEAM_MEMBER',
  team_id: null,
  title: null,
  account_status: 'ACTIVE',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  user_id: '',
  task_assignments: true,
  task_comments: true,
  open_tasks: true,
  sprint_updates: true,
  team_announcements: true,
  manual_notifications: true,
  deadline_reminders: true,
  push_notifications: false,
  in_app_notifications: true,
};

interface AppContextType {
  session: Session | null;
  user: User | null;
  currentUser: Profile;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuspended: boolean;
  accountStatus: AccountStatus | null;

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
  
  // Real Supabase Auth Operations
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;

  // Notification operations
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  subscribeToPush: (sub: { endpoint: string; p256dh_key: string; auth_key: string; device_name?: string }) => Promise<void>;
  sendManualNotification: (data: {
    title: string;
    message: string;
    priority: NotificationPriority;
    audience: 'MY_TEAM' | 'SELECTED_MEMBERS' | 'ALL_SEDS' | 'ALL_LEADS' | 'OFFICE_BEARERS';
    targetTeamId?: string | null;
    targetMemberIds?: string[];
  }) => Promise<void>;

  // Admin user & team operations
  createUser: (data: { full_name: string; email: string; role: UserRole; team_id: string | null; title?: string }) => Promise<Profile>;
  updateUser: (userId: string, updates: Partial<Profile>) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  createTeam: (data: { name: string; description: string; icon: string; color: string; accent: string }) => Promise<Team>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  archiveTeam: (teamId: string) => Promise<void>;
  
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
  }) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTaskToSprint: (taskId: string, sprintId: string | null) => Promise<void>;

  // Open Task operations
  expressInterest: (taskId: string, message: string) => Promise<void>;
  withdrawInterest: (taskId: string) => Promise<void>;
  approveInterest: (interestId: string) => Promise<void>;
  rejectInterest: (interestId: string) => Promise<void>;
  
  // Sprint operations
  createSprint: (data: {
    team_id: string;
    name: string;
    goal: string;
    description?: string | null;
    start_date: string;
    end_date: string;
  }) => Promise<Sprint>;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => Promise<void>;
  startSprint: (sprintId: string) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  
  // Comments
  addComment: (taskId: string, content: string) => Promise<void>;
  
  // Announcements
  createAnnouncement: (data: {
    team_id: string | null;
    title: string;
    content: string;
    priority: 'NORMAL' | 'URGENT';
  }) => Promise<void>;

  // Lead Messages
  sendLeadMessage: (data: {
    team_id: string;
    subject: string;
    message: string;
    recipient_id?: string | null;
  }) => Promise<void>;
  replyLeadMessage: (messageId: string, reply: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();

  // Authentication State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile>(GUEST_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);

  // Business Data Collections (Empty by default in production)
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [leadMessages, setLeadMessages] = useState<LeadMessage[]>([]);
  const [openTaskInterests, setOpenTaskInterests] = useState<OpenTaskInterest[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [pushSubscriptions] = useState<PushSubscriptionItem[]>([]);

  // Fetch all application records from Supabase for authenticated user
  const fetchAllData = useCallback(async (activeUserId: string) => {
    try {
      const [
        profilesRes,
        teamsRes,
        sprintsRes,
        tasksRes,
        assigneesRes,
        interestsRes,
        commentsRes,
        announcementsRes,
        activitiesRes,
        notificationsRes,
        leadMsgsRes,
        prefsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('teams').select('*').order('name'),
        supabase.from('sprints').select('*').order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_assignees').select('*'),
        supabase.from('open_task_interests').select('*'),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('notifications').select('*').eq('recipient_id', activeUserId).order('created_at', { ascending: false }),
        supabase.from('lead_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('notification_preferences').select('*').eq('user_id', activeUserId).single(),
      ]);

      const allProfilesList: Profile[] = profilesRes.data || [];
      setProfiles(allProfilesList);

      const allTeamsList: Team[] = teamsRes.data || [];
      setTeams(allTeamsList);

      const allSprintsList: Sprint[] = sprintsRes.data || [];
      setSprints(allSprintsList);

      // Hydrate tasks with assignees
      const rawTasks: any[] = tasksRes.data || [];
      const assigneesMap: { [taskId: string]: string[] } = {};
      (assigneesRes.data || []).forEach((row: any) => {
        if (!assigneesMap[row.task_id]) assigneesMap[row.task_id] = [];
        assigneesMap[row.task_id].push(row.user_id);
      });

      const hydratedTasks: Task[] = rawTasks.map(t => {
        const aIds = assigneesMap[t.id] || [];
        const assignees = allProfilesList.filter(p => aIds.includes(p.id));
        const sprint = allSprintsList.find(s => s.id === t.sprint_id);
        const team = allTeamsList.find(tm => tm.id === t.team_id);
        const creator = allProfilesList.find(p => p.id === t.created_by);
        return {
          ...t,
          assignee_ids: aIds,
          assignees,
          sprint_name: sprint?.name,
          team_name: team?.name,
          creator,
        };
      });
      setTasks(hydratedTasks);

      // Hydrate interests
      const rawInterests: any[] = interestsRes.data || [];
      const hydratedInterests: OpenTaskInterest[] = rawInterests.map(i => ({
        ...i,
        user: allProfilesList.find(p => p.id === i.user_id),
      }));
      setOpenTaskInterests(hydratedInterests);

      // Hydrate comments
      const rawComments: any[] = commentsRes.data || [];
      const hydratedComments: TaskComment[] = rawComments.map(c => ({
        ...c,
        author: allProfilesList.find(p => p.id === c.user_id),
      }));
      setComments(hydratedComments);

      // Hydrate announcements
      const rawAnnouncements: any[] = announcementsRes.data || [];
      const hydratedAnnouncements: Announcement[] = rawAnnouncements.map(a => {
        const tm = allTeamsList.find(t => t.id === a.team_id);
        return {
          ...a,
          team_name: tm ? tm.name : 'Organization-Wide',
          author: allProfilesList.find(p => p.id === a.created_by),
        };
      });
      setAnnouncements(hydratedAnnouncements);

      // Hydrate lead messages
      const rawLeadMsgs: any[] = leadMsgsRes.data || [];
      const hydratedLeadMsgs: LeadMessage[] = rawLeadMsgs.map(m => ({
        ...m,
        sender: allProfilesList.find(p => p.id === m.sender_id),
        team: allTeamsList.find(t => t.id === m.team_id),
      }));
      setLeadMessages(hydratedLeadMsgs);

      setActivityLogs(activitiesRes.data || []);
      setNotifications(notificationsRes.data || []);

      if (prefsRes.data) {
        setNotificationPreferences(prefsRes.data);
      }
    } catch (err) {
      console.error('Error fetching production database records:', err);
    }
  }, []);

  // Supabase Auth Listener & Profile Resolution
  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);

          // Authoritative profile resolution from database
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();

          if (profile && !error) {
            setCurrentUser(profile);
            if (profile.account_status === 'SUSPENDED') {
              setIsSuspended(true);
            } else {
              setIsSuspended(false);
              await fetchAllData(initialSession.user.id);
            }
          } else {
            // Profile row missing in DB for auth user: construct fallback
            const fallback: Profile = {
              id: initialSession.user.id,
              full_name: initialSession.user.user_metadata?.full_name || initialSession.user.email?.split('@')[0] || 'SEDS Member',
              email: initialSession.user.email || '',
              avatar_url: null,
              role: (initialSession.user.user_metadata?.role as UserRole) || 'TEAM_MEMBER',
              team_id: null,
              title: 'Member',
              account_status: 'ACTIVE',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setCurrentUser(fallback);
            await fetchAllData(initialSession.user.id);
          }
        } else {
          setSession(null);
          setUser(null);
          setCurrentUser(GUEST_PROFILE);
          setIsSuspended(false);
        }
      } catch (err) {
        console.error('Authentication resolution error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    resolveSession();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !newSession?.user) {
        setSession(null);
        setUser(null);
        setCurrentUser(GUEST_PROFILE);
        setIsSuspended(false);
        setTasks([]);
        setSprints([]);
        setNotifications([]);
        setIsLoading(false);
        router.replace('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(newSession);
        setUser(newSession.user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single();

        if (profile) {
          setCurrentUser(profile);
          if (profile.account_status === 'SUSPENDED') {
            setIsSuspended(true);
          } else {
            setIsSuspended(false);
            await fetchAllData(newSession.user.id);
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAllData, router]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!user || isSuspended) return;

    const channel = supabase
      .channel('seds_production_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchAllData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchAllData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        fetchAllData(user.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAllData(user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isSuspended, fetchAllData]);

  // Derived role-based filtered collections
  const visibleTasks = useMemo(() => {
    if (!currentUser.id) return [];
    return tasks.filter(t => Permissions.canViewTask(currentUser, t));
  }, [currentUser, tasks]);

  const openTasks = useMemo(() => {
    if (!currentUser.id) return [];
    return tasks.filter(t => {
      const isOpen = t.assignment_type === 'OPEN' || t.open_task_status !== undefined;
      if (!isOpen) return false;
      if (Permissions.isAdmin(currentUser)) return false;
      if (Permissions.isOfficeBearer(currentUser)) return true;
      return t.team_id === currentUser.team_id;
    });
  }, [currentUser, tasks]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.is_read && (n.recipient_id === currentUser.id || n.user_id === currentUser.id)).length;
  }, [notifications, currentUser]);

  // Auth Action: Sign In
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message || 'Invalid email or password.' };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile?.account_status === 'SUSPENDED') {
          await supabase.auth.signOut();
          return { error: 'Your SEDS account has been suspended. Please contact an administrator.' };
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Authentication failed. Please try again.' };
    }
  };

  // Auth Action: Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setCurrentUser(GUEST_PROFILE);
    router.replace('/login');
  };

  // Auth Action: Reset Password
  const resetPassword = async (email: string) => {
    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : 'http://localhost:3000/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });
    return error ? { error: error.message } : {};
  };

  // Auth Action: Update Password
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? { error: error.message } : {};
  };

  // Task Operations
  const createTask = async (data: {
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
  }): Promise<Task> => {
    const isDirect = data.assignment_type !== 'OPEN';
    const initialStatus: TaskStatus = data.status || (data.sprint_id ? 'TODO' : 'BACKLOG');
    const initialOpenStatus: OpenTaskStatus | undefined = !isDirect
      ? (data.open_task_status || 'PUBLISHED')
      : undefined;

    const taskPayload = {
      team_id: data.team_id,
      sprint_id: data.sprint_id || null,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: initialStatus,
      story_points: data.story_points,
      due_date: data.due_date || null,
      created_by: currentUser.id,
      assignment_type: data.assignment_type || 'DIRECT',
      open_task_status: initialOpenStatus,
      max_assignees: data.max_assignees || 1,
      requires_approval: data.requires_approval ?? true,
      skills: data.skills || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedTask, error: taskError } = await supabase
      .from('tasks')
      .insert(taskPayload)
      .select()
      .single();

    if (taskError) {
      console.error('Failed to create task in Supabase:', taskError);
      throw taskError;
    }

    const taskId = insertedTask.id;
    const assigneeIds = isDirect ? (data.assignee_ids || []) : [];

    if (assigneeIds.length > 0) {
      const assigneeRows = assigneeIds.map(uid => ({
        task_id: taskId,
        user_id: uid,
        assigned_at: new Date().toISOString(),
        assigned_by: currentUser.id,
      }));
      await supabase.from('task_assignees').insert(assigneeRows);

      // Automated Assignment Notifications
      const isCollab = assigneeIds.length > 1;
      const notifRows = assigneeIds.map(uid => ({
        recipient_id: uid,
        title: isCollab ? 'New collaborative task assigned to you' : 'New task assigned to you',
        message: `${data.title} (${data.priority} priority, ${data.story_points} points)`,
        type: 'TASK_ASSIGNED',
        priority: (data.priority === 'HIGH' || data.priority === 'URGENT') ? 'IMPORTANT' : 'INFO',
        action_url: '/tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(notifRows);
    } else if (data.assignment_type === 'OPEN') {
      // Notify team members of new open task
      const teamMbrs = profiles.filter(p => p.team_id === data.team_id && p.id !== currentUser.id);
      if (teamMbrs.length > 0) {
        const openNotifs = teamMbrs.map(m => ({
          recipient_id: m.id,
          title: `New task available in ${teams.find(t => t.id === data.team_id)?.name || 'team'}`,
          message: data.title,
          type: 'OPEN_TASK_PUBLISHED',
          priority: 'INFO',
          action_url: '/open-tasks',
          is_read: false,
          created_at: new Date().toISOString(),
        }));
        await supabase.from('notifications').insert(openNotifs);
      }
    }

    if (user) await fetchAllData(user.id);
    return insertedTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) console.error('Error updating task:', error);
    if (user) await fetchAllData(user.id);
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const existingTask = tasks.find(t => t.id === taskId);
    if (!existingTask) return;

    await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    // Automated Status Notifications
    if (newStatus === 'BLOCKED') {
      const leads = profiles.filter(p => (p.role === 'TEAM_LEAD' && p.team_id === existingTask.team_id) || p.role === 'OFFICE_BEARER');
      const blockedNotifs = leads.map(l => ({
        recipient_id: l.id,
        title: `Task Blocked: ${existingTask.title}`,
        message: `${currentUser.full_name} reported an impediment on task "${existingTask.title}".`,
        type: 'TASK_BLOCKED',
        priority: 'URGENT',
        action_url: '/tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(blockedNotifs);
    } else if (newStatus === 'COMPLETED') {
      const targets = profiles.filter(p => p.id === existingTask.created_by || (p.role === 'TEAM_LEAD' && p.team_id === existingTask.team_id));
      const doneNotifs = targets.map(tgt => ({
        recipient_id: tgt.id,
        title: `Task Completed: ${existingTask.title}`,
        message: `${currentUser.full_name} completed task "${existingTask.title}".`,
        type: 'TASK_COMPLETED',
        priority: 'INFO',
        action_url: '/tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(doneNotifs);
    }

    if (user) await fetchAllData(user.id);
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('task_assignees').delete().eq('task_id', taskId);
    await supabase.from('open_task_interests').delete().eq('task_id', taskId);
    await supabase.from('comments').delete().eq('task_id', taskId);
    await supabase.from('tasks').delete().eq('id', taskId);
    if (user) await fetchAllData(user.id);
  };

  const moveTaskToSprint = async (taskId: string, sprintId: string | null) => {
    await supabase
      .from('tasks')
      .update({ sprint_id: sprintId, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (user) await fetchAllData(user.id);
  };

  // Open Task Auction Operations
  const expressInterest = async (taskId: string, message: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.requires_approval === false) {
      // Auto-claim
      await supabase.from('task_assignees').insert({
        task_id: taskId,
        user_id: currentUser.id,
        assigned_at: new Date().toISOString(),
        assigned_by: currentUser.id,
      });
      await supabase.from('tasks').update({
        open_task_status: 'ASSIGNED',
        status: 'TODO',
        updated_at: new Date().toISOString(),
      }).eq('id', taskId);
    } else {
      // Create interest record
      await supabase.from('open_task_interests').insert({
        task_id: taskId,
        user_id: currentUser.id,
        message: message.trim(),
        status: 'INTERESTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Notify leads
      const leads = profiles.filter(p => (p.role === 'TEAM_LEAD' && p.team_id === task.team_id) || p.role === 'OFFICE_BEARER');
      const leadNotifs = leads.map(l => ({
        recipient_id: l.id,
        title: `${currentUser.full_name} is interested in '${task.title}'`,
        message: message.trim() || 'Expressed interest in taking this open task.',
        type: 'TASK_INTEREST',
        priority: 'INFO',
        action_url: '/open-tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(leadNotifs);
    }

    if (user) await fetchAllData(user.id);
  };

  const withdrawInterest = async (taskId: string) => {
    await supabase
      .from('open_task_interests')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', currentUser.id);
    if (user) await fetchAllData(user.id);
  };

  const approveInterest = async (interestId: string) => {
    const interest = openTaskInterests.find(i => i.id === interestId);
    if (!interest) return;

    await supabase
      .from('open_task_interests')
      .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
      .eq('id', interestId);

    await supabase.from('task_assignees').insert({
      task_id: interest.task_id,
      user_id: interest.user_id,
      assigned_at: new Date().toISOString(),
      assigned_by: currentUser.id,
    });

    const task = tasks.find(t => t.id === interest.task_id);
    if (task) {
      await supabase.from('tasks').update({
        open_task_status: 'ASSIGNED',
        status: 'TODO',
        updated_at: new Date().toISOString(),
      }).eq('id', task.id);

      await supabase.from('notifications').insert({
        recipient_id: interest.user_id,
        title: `You've been assigned to '${task.title}'`,
        message: 'Your interest expression was approved by the Team Lead.',
        type: 'INTEREST_APPROVED',
        priority: 'IMPORTANT',
        action_url: '/tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (user) await fetchAllData(user.id);
  };

  const rejectInterest = async (interestId: string) => {
    const interest = openTaskInterests.find(i => i.id === interestId);
    if (!interest) return;

    await supabase
      .from('open_task_interests')
      .update({ status: 'REJECTED', updated_at: new Date().toISOString() })
      .eq('id', interestId);

    const task = tasks.find(t => t.id === interest.task_id);
    if (task) {
      await supabase.from('notifications').insert({
        recipient_id: interest.user_id,
        title: `Update regarding '${task.title}'`,
        message: `Your request to join '${task.title}' was reviewed.`,
        type: 'INTEREST_REJECTED',
        priority: 'INFO',
        action_url: '/open-tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    if (user) await fetchAllData(user.id);
  };

  // Sprint Operations
  const createSprint = async (data: {
    team_id: string;
    name: string;
    goal: string;
    description?: string | null;
    start_date: string;
    end_date: string;
  }): Promise<Sprint> => {
    const payload = {
      team_id: data.team_id,
      name: data.name,
      goal: data.goal,
      description: data.description || null,
      start_date: data.start_date,
      end_date: data.end_date,
      status: 'PLANNED' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('sprints')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    if (user) await fetchAllData(user.id);
    return inserted;
  };

  const updateSprint = async (sprintId: string, updates: Partial<Sprint>) => {
    await supabase.from('sprints').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', sprintId);
    if (user) await fetchAllData(user.id);
  };

  const startSprint = async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    await supabase.from('sprints').update({ status: 'ACTIVE', updated_at: new Date().toISOString() }).eq('id', sprintId);

    const teamMbrs = profiles.filter(p => p.team_id === sprint.team_id);
    const notifs = teamMbrs.map(m => ({
      recipient_id: m.id,
      title: `${sprint.name} is now active`,
      message: `Goal: ${sprint.goal}`,
      type: 'SPRINT_STARTED',
      priority: 'IMPORTANT',
      action_url: '/sprints',
      is_read: false,
      created_at: new Date().toISOString(),
    }));
    await supabase.from('notifications').insert(notifs);

    if (user) await fetchAllData(user.id);
  };

  const completeSprint = async (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    await supabase.from('sprints').update({ status: 'COMPLETED', updated_at: new Date().toISOString() }).eq('id', sprintId);

    const teamMbrs = profiles.filter(p => p.team_id === sprint.team_id);
    const notifs = teamMbrs.map(m => ({
      recipient_id: m.id,
      title: `${sprint.name} has concluded`,
      message: `Sprint '${sprint.name}' completed. Check velocity analytics.`,
      type: 'SPRINT_COMPLETED',
      priority: 'INFO',
      action_url: '/analytics',
      is_read: false,
      created_at: new Date().toISOString(),
    }));
    await supabase.from('notifications').insert(notifs);

    if (user) await fetchAllData(user.id);
  };

  // Communication & Comments
  const addComment = async (taskId: string, content: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !content.trim()) return;

    await supabase.from('comments').insert({
      task_id: taskId,
      user_id: currentUser.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify task assignees
    const recipients = task.assignee_ids.filter(id => id !== currentUser.id);
    if (recipients.length > 0) {
      const notifs = recipients.map(uid => ({
        recipient_id: uid,
        title: `${currentUser.full_name} commented on '${task.title}'`,
        message: content.trim().slice(0, 120),
        type: 'TASK_COMMENT',
        priority: 'INFO',
        action_url: '/tasks',
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(notifs);
    }

    if (user) await fetchAllData(user.id);
  };

  const createAnnouncement = async (data: {
    team_id: string | null;
    title: string;
    content: string;
    priority: 'NORMAL' | 'URGENT';
  }) => {
    await supabase.from('announcements').insert({
      team_id: data.team_id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const targets = data.team_id
      ? profiles.filter(p => p.team_id === data.team_id && p.id !== currentUser.id)
      : profiles.filter(p => p.id !== currentUser.id);

    if (targets.length > 0) {
      const notifs = targets.map(t => ({
        recipient_id: t.id,
        title: data.title,
        message: data.content.slice(0, 120),
        type: data.team_id ? 'TEAM_ANNOUNCEMENT' : 'ORG_ANNOUNCEMENT',
        priority: data.priority === 'URGENT' ? 'URGENT' : 'INFO',
        action_url: '/communication',
        is_read: false,
        created_at: new Date().toISOString(),
      }));
      await supabase.from('notifications').insert(notifs);
    }

    if (user) await fetchAllData(user.id);
  };

  const sendLeadMessage = async (data: {
    team_id: string;
    subject: string;
    message: string;
    recipient_id?: string | null;
  }) => {
    await supabase.from('lead_messages').insert({
      team_id: data.team_id,
      sender_id: currentUser.id,
      recipient_id: data.recipient_id || null,
      subject: data.subject,
      message: data.message,
      created_at: new Date().toISOString(),
    });
    if (user) await fetchAllData(user.id);
  };

  const replyLeadMessage = async (messageId: string, reply: string) => {
    await supabase
      .from('lead_messages')
      .update({
        reply: reply.trim(),
        replied_at: new Date().toISOString(),
        replied_by: currentUser.id,
      })
      .eq('id', messageId);
    if (user) await fetchAllData(user.id);
  };

  // Team Operations
  const createTeam = async (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
    accent: string;
  }): Promise<Team> => {
    const { data: inserted, error } = await supabase
      .from('teams')
      .insert({
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        accent: data.accent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    if (user) await fetchAllData(user.id);
    return inserted;
  };

  const updateTeam = async (teamId: string, updates: Partial<Team>) => {
    await supabase.from('teams').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', teamId);
    if (user) await fetchAllData(user.id);
  };

  const archiveTeam = async (teamId: string) => {
    await supabase.from('teams').delete().eq('id', teamId);
    if (user) await fetchAllData(user.id);
  };

  // Admin User Provisioning
  const createUser = async (data: {
    full_name: string;
    email: string;
    role: UserRole;
    team_id: string | null;
    title?: string;
  }): Promise<Profile> => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create user account');
    }

    if (user) await fetchAllData(user.id);
    return json.user;
  };

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId);
    if (user) await fetchAllData(user.id);
  };

  const suspendUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ account_status: 'SUSPENDED', updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (user) await fetchAllData(user.id);
  };

  const activateUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ account_status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (user) await fetchAllData(user.id);
  };

  // Notifications Operations
  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', currentUser.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
  };

  const updateNotificationPreferences = async (prefs: Partial<NotificationPreferences>) => {
    if (!currentUser.id) return;
    const updated = { ...notificationPreferences, ...prefs, user_id: currentUser.id };
    setNotificationPreferences(updated);
    await supabase.from('notification_preferences').upsert(updated);
  };

  const subscribeToPush = async (sub: { endpoint: string; p256dh_key: string; auth_key: string; device_name?: string }) => {
    if (!currentUser.id) return;
    const payload = {
      user_id: currentUser.id,
      endpoint: sub.endpoint,
      p256dh_key: sub.p256dh_key,
      auth_key: sub.auth_key,
      device_name: sub.device_name || 'Browser',
      created_at: new Date().toISOString(),
    };
    await supabase.from('push_subscriptions').upsert(payload, { onConflict: 'endpoint' });
  };

  const sendManualNotification = async (data: {
    title: string;
    message: string;
    priority: NotificationPriority;
    audience: 'MY_TEAM' | 'SELECTED_MEMBERS' | 'ALL_SEDS' | 'ALL_LEADS' | 'OFFICE_BEARERS';
    targetTeamId?: string | null;
    targetMemberIds?: string[];
  }) => {
    let targetUserIds: string[] = [];

    if (data.audience === 'MY_TEAM') {
      targetUserIds = profiles.filter(p => p.team_id === currentUser.team_id).map(p => p.id);
    } else if (data.audience === 'SELECTED_MEMBERS') {
      targetUserIds = data.targetMemberIds || [];
    } else if (data.audience === 'ALL_SEDS') {
      targetUserIds = profiles.map(p => p.id);
    } else if (data.audience === 'ALL_LEADS') {
      targetUserIds = profiles.filter(p => p.role === 'TEAM_LEAD' || p.role === 'OFFICE_BEARER').map(p => p.id);
    } else if (data.audience === 'OFFICE_BEARERS') {
      targetUserIds = profiles.filter(p => p.role === 'OFFICE_BEARER').map(p => p.id);
    }

    if (targetUserIds.length === 0) return;

    const notifRows = targetUserIds.map(uid => ({
      recipient_id: uid,
      title: data.title,
      message: data.message,
      type: 'MANUAL_NOTIFICATION',
      priority: data.priority,
      action_url: '/dashboard',
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    await supabase.from('notifications').insert(notifRows);
    if (user) await fetchAllData(user.id);
  };

  const value = {
    session,
    user,
    currentUser,
    isAuthenticated: Boolean(session && user && currentUser.id),
    isLoading,
    isSuspended,
    accountStatus: currentUser.account_status || null,

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

    signIn,
    signOut,
    resetPassword,
    updatePassword,

    markNotificationRead,
    markAllNotificationsRead,
    updateNotificationPreferences,
    subscribeToPush,
    sendManualNotification,

    createUser,
    updateUser,
    suspendUser,
    activateUser,
    createTeam,
    updateTeam,
    archiveTeam,

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
  };

  return (
    <AppContext.Provider value={value}>
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
