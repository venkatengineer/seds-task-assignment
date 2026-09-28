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
    } catch (err: any) {
      setError(err?.message || 'Failed to create sprint');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subsystem Sprint"
      description="Define milestone deliverables, sprint duration, and strategic subsystem goals."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {isOfficeBearer && (
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">TEAM / SUBSYSTEM</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">SPRINT NAME *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 05 - Avionics Qualification"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">PRIMARY SPRINT GOAL *</label>
          <textarea
            rows={2}
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Validate zero-drift IMU filter and pass thermal chamber endurance tests."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">START DATE</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">END DATE</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">ADDITIONAL SCOPE NOTES</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hardware revisions, lab clearances, partner dependencies..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shadow-indigo-950 transition-colors"
          >
            Create Sprint
          </button>
        </div>
      </form>
    </Modal>
  );
};
