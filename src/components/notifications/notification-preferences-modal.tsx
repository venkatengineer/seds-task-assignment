'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/store/app-context';
import { Check, BellRing } from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notificationPreferences, updateNotificationPreferences, subscribeToPush } = useApp();
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as 'default' | 'granted' | 'denied';
    }
    return 'default';
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [successSaved, setSuccessSaved] = useState(false);

  const handleToggle = (key: keyof typeof notificationPreferences) => {
    if (key === 'user_id') return;
    const currentVal = notificationPreferences[key];
    updateNotificationPreferences({ [key]: !currentVal });
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 2000);
  };

  const handleEnablePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Web Push is not supported by your browser.');
      return;
    }

    try {
      setIsSubscribing(true);
      const permission = await Notification.requestPermission();
      setPushStatus(permission as 'default' | 'granted' | 'denied');

      if (permission === 'granted') {
        // Register mock/real push subscription
        subscribeToPush({
          endpoint: `https://fcm.googleapis.com/fcm/send/simulated-${Date.now()}`,
          p256dh_key: 'BCX15...simulatedKey',
          auth_key: 'AuthKey...simulated',
          device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
        });
        updateNotificationPreferences({ push_notifications: true });
        setSuccessSaved(true);
      }
    } catch (e) {
      console.error('Error enabling push:', e);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Preferences" size="md">
      <div className="space-y-6 py-2">
        <p className="text-xs text-gray-500">
          Control how and when you receive in-app alerts and browser notifications across your assigned teams and sprints.
        </p>

        {/* Web Push Banner */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Desktop & Mobile Push</p>
              <p className="text-[11px] text-gray-500">
                {pushStatus === 'granted' ? 'Push notifications active' : 'Receive instant alerts when away'}
              </p>
            </div>
          </div>

          {pushStatus === 'granted' ? (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Enabled
            </span>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={isSubscribing}
              className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
            >
              {isSubscribing ? 'Requesting...' : 'Enable Push'}
            </button>
          )}
        </div>

        {/* Channels & Categories */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Channels</h4>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">In-App Notification Center</p>
                <p className="text-[11px] text-gray-500">Show notification drawer alerts in navigation header</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.in_app_notifications}
                onChange={() => handleToggle('in_app_notifications')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">Web Push Alerts</p>
                <p className="text-[11px] text-gray-500">Receive system push notifications on this device</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.push_notifications}
                onChange={() => handleToggle('push_notifications')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Event Triggers</h4>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">Task Assignments</p>
                <p className="text-[11px] text-gray-500">When assigned to a task or collaborative task</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.task_assignments}
                onChange={() => handleToggle('task_assignments')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">Task Comments & Discussion</p>
                <p className="text-[11px] text-gray-500">When a team member comments on your task</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.task_comments}
                onChange={() => handleToggle('task_comments')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">Open Task Marketplace</p>
                <p className="text-[11px] text-gray-500">When new open tasks are published in your team</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.open_tasks}
                onChange={() => handleToggle('open_tasks')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">Sprint Lifecycle</p>
                <p className="text-[11px] text-gray-500">When sprints are planned, started, or completed</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.sprint_updates}
                onChange={() => handleToggle('sprint_updates')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-medium text-gray-900">Broadcasts & Announcements</p>
                <p className="text-[11px] text-gray-500">Official directives from Leads & Office Bearers</p>
              </div>
              <input
                type="checkbox"
                checked={notificationPreferences.team_announcements}
                onChange={() => handleToggle('team_announcements')}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            {successSaved && (
              <span className="text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Preferences saved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
