'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  Rocket, ChevronRight, Plus, 
  Satellite, Radio, Video, Globe, Cpu, Calendar 
} from 'lucide-react';
import Link from 'next/link';
import { UserAvatar, AvatarGroup } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';

export const TeamsDirectory: React.FC = () => {
  const { currentUser, teams, sprints, tasks, allProfiles, createTeam } = useApp();
  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#2563EB');

  const getTeamIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'satellite': return <Satellite className="w-5 h-5" />;
      case 'rocket': return <Rocket className="w-5 h-5" />;
      case 'radio': return <Radio className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'globe': return <Globe className="w-5 h-5" />;
      case 'cpu': return <Cpu className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    createTeam({
      name: newTeamName.trim(),
      description: newTeamDesc.trim(),
      icon: 'Rocket',
      color: newTeamColor,
      accent: 'blue',
    });

    setNewTeamName('');
    setNewTeamDesc('');
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
              Subsystem Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SEDS Engineering Teams & Projects
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Subsystem rosters, team leads, active sprint metrics, and assigned engineers.
          </p>
        </div>

        {isOfficeBearer && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Subsystem Team</span>
          </button>
        )}
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map(team => {
          const teamMembers = allProfiles.filter(p => p.team_id === team.id && p.role !== 'ADMIN' && p.role !== 'OFFICE_BEARER');
          const teamLeads = teamMembers.filter(p => p.role === 'TEAM_LEAD');
          const teamSprints = sprints.filter(s => s.team_id === team.id);
          const activeSprint = teamSprints.find(s => s.status === 'ACTIVE');
          const teamTasks = tasks.filter(t => t.team_id === team.id);
          const completedTasks = teamTasks.filter(t => t.status === 'COMPLETED');

          const isUserInTeam = currentUser.team_id === team.id;

          return (
            <div
              key={team.id}
              className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between shadow-xs ${
                isUserInTeam 
                  ? 'border-blue-500 ring-1 ring-blue-500/20 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: team.color || '#2563EB' }}
                    >
                      {getTeamIcon(team.icon)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{team.name}</h3>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {teamMembers.length} Engineers
                      </span>
                    </div>
                  </div>

                  {isUserInTeam && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      Your Team
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                  {team.description || 'No description provided.'}
                </p>

                {/* Team Leads */}
                <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-semibold uppercase text-gray-500 block mb-1.5 tracking-wider">
                    Team Leads ({teamLeads.length})
                  </span>
                  <div className="space-y-1.5">
                    {teamLeads.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">No assigned leads</span>
                    ) : (
                      teamLeads.map(lead => (
                        <div key={lead.id} className="flex items-center gap-2">
                          <UserAvatar user={lead} size="xs" />
                          <span className="text-xs text-gray-900 font-medium truncate">{lead.full_name}</span>
                          <span className="text-[10px] text-gray-500 truncate">({lead.title || 'Lead'})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Sprint & Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-semibold uppercase">Active Sprint</span>
                    <span className="text-gray-900 font-bold truncate block mt-0.5">
                      {activeSprint ? activeSprint.name : 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-500 block font-semibold uppercase">Deliverables</span>
                    <span className="text-gray-900 font-bold block mt-0.5">
                      {completedTasks.length} / {teamTasks.length} done
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Engineer Avatars + Drill down link */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <AvatarGroup users={teamMembers} size="xs" max={4} />
                <Link
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  <span>Drill down</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Office Bearer Team Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Subsystem Team"
        description="Establish an organizational project unit in SEDS REC with isolated scope and assigned leads."
        size="md"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Team Name *</label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Guidance & Navigation Subsystem"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              placeholder="Subsystem scope, mission deliverables, hardware integration..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-hidden focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                className="w-10 h-10 rounded border border-gray-200 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-700">{newTeamColor}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              Create Subsystem
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
