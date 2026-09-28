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
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#08090e]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 bg-[#0e111a] border border-[#23293f] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-[#111420]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="px-1.5 py-0.2 font-mono text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                  {unreadNotificationCount} new
                </span>
              )}
            </div>
            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/40">
            {userNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
                <span>No notifications yet</span>
              </div>
            ) : (
              userNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.link)}
                  className={`p-3 text-left transition-colors cursor-pointer flex gap-3 ${
                    n.read ? 'hover:bg-slate-800/40 opacity-70' : 'bg-indigo-950/20 hover:bg-indigo-950/40'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'announcement' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-200 truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
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
