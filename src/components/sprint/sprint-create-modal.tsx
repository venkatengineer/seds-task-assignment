'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Modal } from '@/components/ui/modal';
import { Permissions } from '@/lib/permissions';
import { AlertCircle } from 'lucide-react';

interface SprintCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

export const SprintCreateModal: React.FC<SprintCreateModalProps> = ({
  isOpen,
  onClose,
  defaultTeamId,
}) => {
  const { currentUser, teams, createSprint } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const initialTeamId = defaultTeamId || currentUser.team_id || teams[0]?.id || '';

  const [teamId, setTeamId] = useState(initialTeamId);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  
  // Default dates: 2 weeks sprint starting today
  const today = new Date().toISOString().split('T')[0];
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(twoWeeksLater);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Sprint name is required');
      return;
    }
    if (!goal.trim()) {
      setError('Sprint goal is required');
      return;
    }

    try {
      createSprint({
        team_id: teamId,
        name: name.trim(),
        goal: goal.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
      });

      setName('');
      setGoal('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create sprint');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subsystem Sprint"
      description="Define milestone deliverables, sprint duration, and strategic subsystem goals."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {isOfficeBearer && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Team / Subsystem</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500 font-medium"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Sprint Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 05 - Avionics Qualification"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Sprint Goal *</label>
          <textarea
            rows={2}
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Validate zero-drift IMU filter and pass thermal chamber endurance tests."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Scope Notes</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hardware revisions, lab clearances, partner dependencies..."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Create Sprint
          </button>
        </div>
      </form>
    </Modal>
  );
};
