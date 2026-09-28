import React from 'react';
import { TaskStatus, TaskPriority, UserRole, SprintStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { Shield, Users, User, ShieldAlert } from 'lucide-react';

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
  const configs: Record<TaskStatus, { label: string; dotColor: string; styles: string }> = {
    BACKLOG: {
      label: 'Backlog',
      dotColor: 'bg-gray-400',
      styles: 'bg-gray-50 text-gray-600 border-gray-200',
    },
    TODO: {
      label: 'To Do',
      dotColor: 'bg-gray-500',
      styles: 'bg-gray-100 text-gray-700 border-gray-200',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      dotColor: 'bg-blue-600',
      styles: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    IN_REVIEW: {
      label: 'In Review',
      dotColor: 'bg-amber-600',
      styles: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    COMPLETED: {
      label: 'Completed',
      dotColor: 'bg-emerald-600',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    BLOCKED: {
      label: 'Blocked',
      dotColor: 'bg-rose-600',
      styles: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };

  const config = configs[status] || configs.BACKLOG;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-md font-sans tracking-tight',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full inline-block', config.dotColor)} />
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
      dotColor: 'bg-gray-400',
      styles: 'bg-gray-50 text-gray-600 border-gray-200',
    },
    MEDIUM: {
      label: 'Medium',
      dotColor: 'bg-blue-500',
      styles: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    HIGH: {
      label: 'High',
      dotColor: 'bg-amber-500',
      styles: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    URGENT: {
      label: 'Urgent',
      dotColor: 'bg-rose-600',
      styles: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    },
  };

  const config = configs[priority] || configs.MEDIUM;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-md font-sans tracking-tight',
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
    ADMIN: {
      label: 'Admin',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-gray-700" />,
      styles: 'bg-gray-100 text-gray-800 border-gray-300 font-semibold',
    },
    OFFICE_BEARER: {
      label: 'Office Bearer',
      icon: <Shield className="w-3.5 h-3.5 text-purple-600" />,
      styles: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
    },
    TEAM_LEAD: {
      label: 'Team Lead',
      icon: <Users className="w-3.5 h-3.5 text-blue-600" />,
      styles: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
    },
    TEAM_MEMBER: {
      label: 'Team Member',
      icon: <User className="w-3.5 h-3.5 text-gray-500" />,
      styles: 'bg-gray-50 text-gray-600 border-gray-200 font-medium',
    },
  };

  const config = configs[role] || configs.TEAM_MEMBER;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans border rounded-md',
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
  const configs: Record<SprintStatus, { label: string; dotColor: string; styles: string }> = {
    PLANNED: {
      label: 'Planned',
      dotColor: 'bg-gray-400',
      styles: 'bg-gray-50 text-gray-600 border-gray-200',
    },
    ACTIVE: {
      label: 'Active Sprint',
      dotColor: 'bg-emerald-600',
      styles: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    },
    COMPLETED: {
      label: 'Completed',
      dotColor: 'bg-blue-600',
      styles: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    ARCHIVED: {
      label: 'Archived',
      dotColor: 'bg-gray-400',
      styles: 'bg-gray-100 text-gray-500 border-gray-200',
    },
  };

  const config = configs[status] || configs.PLANNED;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans border rounded-md',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.styles,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full inline-block', config.dotColor)} />
      <span>{config.label}</span>
    </span>
  );
};
