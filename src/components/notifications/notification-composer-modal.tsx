'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useApp } from '@/lib/store/app-context';
import { NotificationPriority } from '@/types/database';
import { Send, AlertCircle, Check } from 'lucide-react';

interface NotificationComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationComposerModal: React.FC<NotificationComposerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, teams, allProfiles, sendManualNotification } = useApp();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>('INFO');
  const [audience, setAudience] = useState<'MY_TEAM' | 'SELECTED_MEMBERS' | 'ALL_SEDS' | 'ALL_LEADS' | 'OFFICE_BEARERS'>(
    currentUser.role === 'OFFICE_BEARER' ? 'ALL_SEDS' : 'MY_TEAM'
  );
  const [targetTeamId, setTargetTeamId] = useState<string>(currentUser.team_id || (teams[0]?.id || ''));
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Eligible members for selection
  const eligibleMembers = currentUser.role === 'TEAM_LEAD'
    ? allProfiles.filter(p => p.team_id === currentUser.team_id && p.id !== currentUser.id)
    : allProfiles.filter(p => p.id !== currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please provide both a title and message.');
      return;
    }

    if (audience === 'SELECTED_MEMBERS' && targetMemberIds.length === 0) {
      setError('Please select at least one recipient.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      sendManualNotification({
        title: title.trim(),
        message: message.trim(),
        priority,
        audience,
        targetTeamId: audience === 'MY_TEAM' ? (currentUser.team_id || targetTeamId) : null,
        targetMemberIds: audience === 'SELECTED_MEMBERS' ? targetMemberIds : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle('');
        setMessage('');
        setTargetMemberIds([]);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setTargetMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Broadcast Notification" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Notification dispatched successfully to selected audience!</span>
          </div>
        )}

        {/* Priority Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority Level</label>
          <div className="grid grid-cols-3 gap-2">
            {(['INFO', 'IMPORTANT', 'URGENT'] as NotificationPriority[]).map((p) => {
              const active = priority === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    active
                      ? p === 'URGENT'
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : p === 'IMPORTANT'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p === 'URGENT' ? '🚨 Urgent' : p === 'IMPORTANT' ? '⚡ Important' : 'ℹ️ Standard / Info'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audience Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Target Audience</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentUser.role === 'OFFICE_BEARER' && (
              <>
                <label className="flex items-center gap-2.5 p-2.5 border rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="audience"
                    value="ALL_SEDS"
                    checked={audience === 'ALL_SEDS'}
                    onChange={() => setAudience('ALL_SEDS')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">All SEDS REC</p>
                    <p className="text-[11px] text-gray-500">All active teams & members</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 border rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="audience"
                    value="ALL_LEADS"
                    checked={audience === 'ALL_LEADS'}
                    onChange={() => setAudience('ALL_LEADS')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">All Team Leads</p>
                    <p className="text-[11px] text-gray-500">Leadership channel only</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 border rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="audience"
                    value="OFFICE_BEARERS"
                    checked={audience === 'OFFICE_BEARER' as any || audience === 'OFFICE_BEARERS'}
                    onChange={() => setAudience('OFFICE_BEARERS')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Office Bearers</p>
                    <p className="text-[11px] text-gray-500">Executive board only</p>
                  </div>
                </label>
              </>
            )}

            <label className="flex items-center gap-2.5 p-2.5 border rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
              <input
                type="radio"
                name="audience"
                value="MY_TEAM"
                checked={audience === 'MY_TEAM'}
                onChange={() => setAudience('MY_TEAM')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {currentUser.role === 'TEAM_LEAD' ? 'My Team Members' : 'Specific Team'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {currentUser.role === 'TEAM_LEAD'
                    ? teams.find(t => t.id === currentUser.team_id)?.name || 'Your Team'
                    : 'Select a project team'}
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 border rounded-lg hover:bg-gray-50 cursor-pointer text-xs">
              <input
                type="radio"
                name="audience"
                value="SELECTED_MEMBERS"
                checked={audience === 'SELECTED_MEMBERS'}
                onChange={() => setAudience('SELECTED_MEMBERS')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-semibold text-gray-900">Specific Members</p>
                <p className="text-[11px] text-gray-500">Custom recipient list</p>
              </div>
            </label>
          </div>

          {/* If Office Bearer selected MY_TEAM, pick which team */}
          {currentUser.role === 'OFFICE_BEARER' && audience === 'MY_TEAM' && (
            <div className="mt-2.5">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Select Target Team</label>
              <select
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* If SELECTED_MEMBERS, display checklist */}
          {audience === 'SELECTED_MEMBERS' && (
            <div className="mt-2.5 border border-gray-200 rounded-lg p-2.5 max-h-40 overflow-y-auto space-y-1.5 bg-gray-50">
              <p className="text-[11px] font-semibold text-gray-600 mb-1">Select Members ({targetMemberIds.length} chosen):</p>
              {eligibleMembers.map(m => (
                <label key={m.id} className="flex items-center gap-2 text-xs text-gray-800 p-1 rounded hover:bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetMemberIds.includes(m.id)}
                    onChange={() => toggleMemberSelection(m.id)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="font-medium">{m.full_name}</span>
                  <span className="text-[11px] text-gray-400">({m.title || m.role})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Notification Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Critical Sprint 04 Retrospective & Review"
            className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Notification Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Write clear, actionable details for the team..."
            className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Sending...' : 'Dispatch Broadcast'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
