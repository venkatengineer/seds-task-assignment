'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { NotificationPreferencesModal } from './notification-preferences-modal';
import { NotificationComposerModal } from './notification-composer-modal';
import { 
  Bell, Check, Settings, Send, CheckCheck, 
  Clock, Inbox
} from 'lucide-react';
import { NotificationItem } from '@/types/database';

export const NotificationCenter: React.FC = () => {
  const router = useRouter();
  const { 
    currentUser, 
    notifications, 
    unreadNotificationCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'TASKS' | 'SPRINTS' | 'TEAM' | 'ANNOUNCEMENTS'>('ALL');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Current user's notifications
  const userNotifications = useMemo(() => {
    return notifications.filter(n => n.recipient_id === currentUser.id || n.user_id === currentUser.id);
  }, [notifications, currentUser.id]);

  // Filtered by tab
  const filteredNotifications = useMemo(() => {
    return userNotifications.filter(n => {
      const isUnread = !(n.is_read || n.read);
      if (activeTab === 'UNREAD') return isUnread;
      if (activeTab === 'TASKS') {
        return (
          n.type === 'TASK_ASSIGNED' || 
          n.type === 'task_assigned' || 
          n.type === 'TASK_UPDATED' || 
          n.type === 'task_status_changed' || 
          n.type === 'TASK_COMPLETED' || 
          n.type === 'TASK_COMMENT' || 
          n.type === 'comment' || 
          n.type === 'TASK_BLOCKED' ||
          n.type === 'open_task_interest' ||
          n.type === 'open_task_approved' ||
          n.type === 'open_task_rejected' ||
          n.type === 'OPEN_TASK_PUBLISHED'
        );
      }
      if (activeTab === 'SPRINTS') {
        return (
          n.type === 'SPRINT_STARTED' || 
          n.type === 'sprint_started' || 
          n.type === 'SPRINT_COMPLETED' || 
          n.type === 'sprint_completed' || 
          n.type === 'sprint_update' || 
          n.type === 'SPRINT_ENDING'
        );
      }
      if (activeTab === 'ANNOUNCEMENTS') {
        return (
          n.type === 'TEAM_ANNOUNCEMENT' || 
          n.type === 'ORG_ANNOUNCEMENT' || 
          n.type === 'announcement' || 
          n.type === 'MANUAL_NOTIFICATION' || 
          n.type === 'manual_broadcast'
        );
      }
      if (activeTab === 'TEAM') {
        return (
          n.type === 'TEAM_ANNOUNCEMENT' || 
          n.type === 'open_task_interest' ||
          n.team_id !== null
        );
      }
      return true;
    });
  }, [userNotifications, activeTab]);

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationRead(item.id);
    setIsOpen(false);

    const dest = item.action_url || item.link;
    if (dest) {
      router.push(dest);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  const canBroadcast = Permissions.canSendBroadcast(currentUser);

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-hidden"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none ring-2 ring-white">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Notifications</h3>
              {unreadNotificationCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadNotificationCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="p-1.5 text-xs text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-medium">Mark read</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowPreferences(true);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                title="Notification preferences"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1.5 border-b border-gray-100 overflow-x-auto text-[11px] scrollbar-none bg-white">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'UNREAD', label: `Unread (${unreadNotificationCount})` },
              { id: 'TASKS', label: 'Tasks' },
              { id: 'SPRINTS', label: 'Sprints' },
              { id: 'ANNOUNCEMENTS', label: 'Directives' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-800">All caught up</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  No {activeTab.toLowerCase()} notifications found for your account.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = !(item.is_read || item.read);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 group relative ${
                      isUnread ? 'bg-blue-50/20' : 'bg-white'
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="pt-1.5 shrink-0">
                      {isUnread ? (
                        <div className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={`text-xs leading-snug truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {item.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      {/* Tag badges */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {item.priority === 'URGENT' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Urgent
                          </span>
                        )}
                        {item.priority === 'IMPORTANT' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Important
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono">
                          {item.type.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Single mark as read button */}
                    {isUnread && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationRead(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all shrink-0"
                        title="Mark read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            {canBroadcast ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowComposer(true);
                }}
                className="w-full py-1.5 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Broadcast Directive</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowPreferences(true);
                }}
                className="w-full py-1 text-xs text-gray-500 hover:text-gray-700 font-medium text-center"
              >
                Configure Notification Settings
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NotificationPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {canBroadcast && (
        <NotificationComposerModal
          isOpen={showComposer}
          onClose={() => setShowComposer(false)}
        />
      )}
    </div>
  );
};
