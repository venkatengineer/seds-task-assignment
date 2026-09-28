import React from 'react';
import { Profile } from '@/types/database';
import { cn } from '@/lib/utils';


interface UserAvatarProps {
  user?: Profile | null;
  name?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  avatarUrl,
  size = 'md',
  className,
  showTooltip = false,
}) => {
  const displayName = user?.full_name || name || 'Anonymous';
  const url = user?.avatar_url || avatarUrl;

  const initials = displayName
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      title={showTooltip ? `${displayName} ${user?.title ? `(${user.title})` : ''}` : undefined}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none overflow-hidden bg-linear-to-br from-indigo-900 to-slate-900 border border-indigo-700/50 text-indigo-200 shadow-xs',
        sizeClasses[size],
        className
      )}
    >
      {url ? (
        <img
          src={url}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

interface AvatarGroupProps {
  users: Profile[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 3,
  size = 'sm',
  className,
}) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn('flex items-center -space-x-2 overflow-hidden', className)}>
      {visible.map((user) => (
        <div key={user.id} className="ring-2 ring-slate-950 rounded-full">
          <UserAvatar user={user} size={size} showTooltip />
        </div>
      ))}
      {remaining > 0 && (
        <div
          title={`${remaining} more assignee${remaining > 1 ? 's' : ''}`}
          className={cn(
            'relative inline-flex items-center justify-center rounded-full font-mono font-medium bg-slate-800 text-slate-300 ring-2 ring-slate-950 border border-slate-700 text-xs px-1',
            size === 'xs' ? 'w-5 h-5 text-[9px]' : size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-xs'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
