export type UserRole = 'OFFICE_BEARER' | 'TEAM_LEAD' | 'TEAM_MEMBER' | 'ADMIN';

export type AccountStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type TaskStatus = 
  | 'BACKLOG' 
  | 'TODO' 
  | 'IN_PROGRESS' 
  | 'IN_REVIEW' 
  | 'COMPLETED' 
  | 'BLOCKED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  team_id: string | null; // null for Office Bearers and Admins
  title: string | null;   // e.g. "President", "Propulsion Lead", "Avionics Specialist"
  account_status?: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  accent: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  active_sprint?: Sprint | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  membership_role: UserRole;
  joined_at: string;
  profile?: Profile;
}

export interface Sprint {
  id: string;
  team_id: string;
  name: string;
  goal: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  team_name?: string;
  total_tasks?: number;
  completed_tasks?: number;
  total_points?: number;
  completed_points?: number;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  profile?: Profile;
}

export type TaskAssignmentType = 'DIRECT' | 'OPEN';

export type OpenTaskStatus = 'DRAFT' | 'PUBLISHED' | 'ASSIGNED' | 'CANCELLED' | 'EXPIRED';

export type InterestStatus = 'INTERESTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface Task {
  id: string;
  team_id: string;
  sprint_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  story_points: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Open Task auction attributes
  assignment_type: TaskAssignmentType;
  open_task_status?: OpenTaskStatus | null;
  max_assignees?: number;
  requires_approval?: boolean;
  skills?: string[];
  interested_count?: number;
  // Augmented/Joined properties
  team_name?: string;
  sprint_name?: string;
  assignees: Profile[];
  assignee_ids: string[];
  comments_count: number;
  creator?: Profile;
}

export interface OpenTaskInterest {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  status: InterestStatus;
  created_at: string;
  updated_at: string;
  user?: Profile;
  task?: Task;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface ActivityLog {
  id: string;
  actor_id: string;
  team_id: string | null;
  task_id: string | null;
  sprint_id: string | null;
  action: 
    | 'task_created'
    | 'task_updated'
    | 'task_assigned'
    | 'task_reassigned'
    | 'task_completed'
    | 'task_status_changed'
    | 'sprint_created'
    | 'sprint_started'
    | 'sprint_completed'
    | 'comment_added'
    | 'member_added'
    | 'member_removed'
    | 'announcement_posted'
    | 'open_task_published'
    | 'interest_expressed'
    | 'interest_approved'
    | 'interest_rejected'
    | 'interest_withdrawn'
    | 'broadcast_sent'
    | 'user_created'
    | 'user_updated'
    | 'user_suspended'
    | 'user_activated';
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
  task_title?: string;
  team_name?: string;
}

export interface Announcement {
  id: string;
  team_id: string | null; // null represents org-wide announcement from Office Bearers
  created_by: string;
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  created_at: string;
  updated_at: string;
  author?: Profile;
  team_name?: string;
}

export interface LeadMessage {
  id: string;
  team_id: string;
  sender_id: string;
  recipient_id: string | null; // null represents message to all leads of the team
  subject: string;
  message: string;
  reply?: string | null;
  replied_at?: string | null;
  replied_by?: string | null;
  created_at: string;
  sender?: Profile;
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_COMMENT'
  | 'TASK_BLOCKED'
  | 'OPEN_TASK_PUBLISHED'
  | 'TASK_INTEREST'
  | 'INTEREST_APPROVED'
  | 'INTEREST_REJECTED'
  | 'SPRINT_STARTED'
  | 'SPRINT_ENDING'
  | 'SPRINT_COMPLETED'
  | 'TEAM_ANNOUNCEMENT'
  | 'ORG_ANNOUNCEMENT'
  | 'MANUAL_NOTIFICATION'
  // Legacy aliases and lowercase variants
  | 'task_assigned' 
  | 'task_status_changed' 
  | 'sprint_update' 
  | 'sprint_started'
  | 'sprint_completed'
  | 'announcement' 
  | 'comment'
  | 'open_task_interest'
  | 'open_task_approved'
  | 'open_task_rejected'
  | 'manual_broadcast';

export type NotificationPriority = 'INFO' | 'IMPORTANT' | 'URGENT';

export interface NotificationItem {
  id: string;
  recipient_id?: string;
  user_id?: string;
  sender_id?: string | null;
  actor_id?: string | null;
  team_id?: string | null;
  task_id?: string | null;
  sprint_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  related_task_id?: string | null;
  related_sprint_id?: string | null;
  related_team_id?: string | null;
  link?: string;
  action_url?: string;
  is_read?: boolean;
  read?: boolean;
  read_at?: string | null;
  created_at: string;
  sender?: Profile;
}

export interface PushSubscriptionItem {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  device_name: string;
  user_agent?: string;
  created_at: string;
  updated_at?: string;
  last_used_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  task_assignments: boolean;
  task_comments: boolean;
  open_tasks: boolean;
  sprint_updates: boolean;
  team_announcements: boolean;
  manual_notifications: boolean;
  deadline_reminders: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
}
