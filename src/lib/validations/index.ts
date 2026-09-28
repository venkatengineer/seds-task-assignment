import { z } from 'zod';

export const TaskCreateSchema = z.object({
  team_id: z.string().uuid({ message: 'Valid team ID is required' }),
  sprint_id: z.string().uuid().nullable().optional(),
  title: z.string().min(3, { message: 'Task title must be at least 3 characters' }).max(120),
  description: z.string().max(2000).default(''),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  due_date: z.string().nullable().optional(),
  story_points: z.number().int().min(0, { message: 'Points cannot be negative' }).max(100),
  assignee_ids: z.array(z.string().uuid()).default([]),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const SprintCreateSchema = z.object({
  team_id: z.string().uuid({ message: 'Valid team ID is required' }),
  name: z.string().min(2, { message: 'Sprint name must be at least 2 characters' }).max(60),
  goal: z.string().min(5, { message: 'Sprint goal is required' }).max(300),
  description: z.string().max(1000).nullable().optional(),
  start_date: z.string().min(8, { message: 'Start date is required' }),
  end_date: z.string().min(8, { message: 'End date is required' }),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('PLANNED'),
});

export const CommentCreateSchema = z.object({
  task_id: z.string().uuid({ message: 'Task ID is required' }),
  content: z.string().min(1, { message: 'Comment content cannot be empty' }).max(1000),
});

export const AnnouncementCreateSchema = z.object({
  team_id: z.string().uuid().nullable().optional(), // null is org-wide
  title: z.string().min(3, { message: 'Announcement title is required' }).max(100),
  content: z.string().min(5, { message: 'Announcement content is required' }).max(3000),
  priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL'),
});

export const LeadMessageCreateSchema = z.object({
  team_id: z.string().uuid({ message: 'Team ID is required' }),
  recipient_id: z.string().uuid().nullable().optional(),
  subject: z.string().min(3, { message: 'Subject is required' }).max(120),
  message: z.string().min(5, { message: 'Message content is required' }).max(2000),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100),
  title: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
});
