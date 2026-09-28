import React from 'react';
import { TaskStatus, TaskPriority, UserRole, SprintStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Clock, AlertCircle, 
  PlayCircle, Archive, Shield, Users, User, ArrowUpRight
} from 'lucide-react';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ 
  status, 
  size = 'md',
  className 
}) => {
  const configs: Record<TaskStatus, { label: string; icon: React.ReactNode; styles: string }> = {
    BACKLOG: {
      label: 'Backlog',
      icon: <Clock className="w-3 h-3" />,
      styles: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    },
    TODO: {
      label: 'To Do',
      icon: <Clock className="w-3 h-3 text-sky-400" />,
      styles: 'bg-sky-950/40 text-sky-300 border-sky-800/60',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: <PlayCircle className="w-3 h-3 text-indigo-400 animate-pulse" />,
      styles: 'bg-indigo-950/50 text-indigo-300 border-indigo-700/70',
    },
    IN_REVIEW: {
      label: 'In Review',
      icon: <ArrowUpRight className="w-3 h-3 text-purple-400" />,
      styles: 'bg-purple-950/40 text-purple-300 border-purple-700/70',
    },
    COMPLETED: {
      label: 'Completed',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
      styles: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60',
    },
    BLOCKED: {
      label: 'Blocked',
      icon: <AlertCircle className="w-3 h-3 text-rose-400" />,
      styles: 'bg-rose-950/60 text-rose-300 border-rose-700/80 animate-pulse',
    },
  };

  const config = configs[status] || configs.BACKLOG;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-md font-mono tracking-wide',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.styles,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  size = 'md',
  className 
}) => {
  const configs: Record<TaskPriority, { label: string; dotColor: string; styles: string }> = {
    LOW: {
      label: 'Low',
      dotColor: 'bg-slate-400',
      styles: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
    },
    MEDIUM: {
      label: 'Medium',
      dotColor: 'bg-blue-400',
      styles: 'bg-blue-950/40 text-blue-300 border-blue-800/60',
    },
    HIGH: {
      label: 'High',
      dotColor: 'bg-amber-400',
      styles: 'bg-amber-950/50 text-amber-300 border-amber-700/70',
    },
    URGENT: {
      label: 'Urgent',
      dotColor: 'bg-rose-500 animate-ping',
      styles: 'bg-rose-950/60 text-rose-300 border-rose-600/80 shadow-sm shadow-rose-900/50',
    },
  };

  const config = configs[priority] || configs.MEDIUM;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold border rounded font-mono uppercase tracking-wider',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        config.styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full inline-block', config.dotColor)} />
      <span>{config.label}</span>
    </span>
  );
};

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  role, 
  size = 'md',
  className 
}) => {
  const configs: Record<UserRole, { label: string; icon: React.ReactNode; styles: string }> = {
    OFFICE_BEARER: {
      label: 'Office Bearer',
      icon: <Shield className="w-3.5 h-3.5 text-purple-400" />,
      styles: 'bg-purple-950/60 text-purple-200 border-purple-600/70 shadow-purple-950/50',
    },
    TEAM_LEAD: {
      label: 'Team Lead',
      icon: <Users className="w-3.5 h-3.5 text-indigo-400" />,
      styles: 'bg-indigo-950/50 text-indigo-200 border-indigo-600/60',
    },
    TEAM_MEMBER: {
      label: 'Team Member',
      icon: <User className="w-3.5 h-3.5 text-slate-400" />,
      styles: 'bg-slate-800/80 text-slate-300 border-slate-700/80',
    },
  };

  const config = configs[role] || configs.TEAM_MEMBER;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-md shadow-xs',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.styles,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

interface SprintStatusBadgeProps {
  status: SprintStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const SprintStatusBadge: React.FC<SprintStatusBadgeProps> = ({
  status,
  size = 'md',
  className
}) => {
  const configs: Record<SprintStatus, { label: string; icon: React.ReactNode; styles: string }> = {
    PLANNED: {
      label: 'Planned',
      icon: <Clock className="w-3 h-3 text-slate-400" />,
      styles: 'bg-slate-800/60 text-slate-300 border-slate-700',
    },
    ACTIVE: {
      label: 'Active Sprint',
      icon: <PlayCircle className="w-3 h-3 text-emerald-400 animate-pulse" />,
      styles: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/80',
    },
    COMPLETED: {
      label: 'Completed',
      icon: <CheckCircle2 className="w-3 h-3 text-sky-400" />,
      styles: 'bg-sky-950/40 text-sky-300 border-sky-700/70',
    },
    ARCHIVED: {
      label: 'Archived',
      icon: <Archive className="w-3 h-3 text-slate-500" />,
      styles: 'bg-slate-900 text-slate-400 border-slate-800',
    },
  };

  const config = configs[status] || configs.PLANNED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-medium border rounded-md uppercase tracking-wider',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.styles,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
