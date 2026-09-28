'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Bell, CheckCheck, Info, AlertTriangle } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export const NotificationsDropdown: React.FC = () => {
  const router = useRouter();
  const { notifications, currentUser, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const userNotifications = notifications.filter(n => n.user_id === currentUser.id);

  const handleNotificationClick = (id: string, link?: string) => {
    markNotificationRead(id);
    setIsOpen(false);
    if (link) {
      router.push(link);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-3.5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-900">Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="px-1.5 py-0.2 font-mono text-[10px] rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {userNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-60" />
                <span>No notifications yet</span>
              </div>
            ) : (
              userNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.link || n.action_url)}
                  className={`p-3 text-left transition-colors cursor-pointer flex gap-3 ${
                    n.is_read || n.read ? 'hover:bg-gray-50 opacity-75' : 'bg-blue-50/40 hover:bg-blue-50/70'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'TEAM_ANNOUNCEMENT' || n.type === 'ORG_ANNOUNCEMENT' || n.type === 'announcement' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-gray-900 truncate">{n.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono shrink-0">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
