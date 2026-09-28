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
  const [newTeamColor, setNewTeamColor] = useState('#6366f1');

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
      accent: 'indigo',
    });

    setNewTeamName('');
    setNewTeamDesc('');
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded">
              SEDS REC SUBSYSTEM DIRECTORY
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SEDS Engineering Teams & Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete subsystem roster, team leads, active sprint metrics, and assigned engineers.
          </p>
        </div>

        {isOfficeBearer && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Subsystem Team</span>
          </button>
        )}
      </div>

      {/* Grid of Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map(team => {
          const teamMembers = allProfiles.filter(p => p.team_id === team.id);
          const teamLeads = teamMembers.filter(p => p.role === 'TEAM_LEAD');
          const teamSprints = sprints.filter(s => s.team_id === team.id);
          const activeSprint = teamSprints.find(s => s.status === 'ACTIVE');
          const teamTasks = tasks.filter(t => t.team_id === team.id);
          const completedTasks = teamTasks.filter(t => t.status === 'COMPLETED');

          const isUserInTeam = currentUser.team_id === team.id;

          return (
            <div
              key={team.id}
              className={`p-5 rounded-2xl bg-[#0b0e17] border transition-all flex flex-col justify-between ${
                isUserInTeam 
                  ? 'border-indigo-600/60 shadow-lg shadow-indigo-950/30' 
                  : 'border-[#1e2439] hover:border-slate-700'
              }`}
            >
              <div>
                {/* Team Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ring-1 ring-white/10"
                      style={{ backgroundColor: team.color }}
                    >
                      {getTeamIcon(team.icon)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{team.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        {teamMembers.length} Engineers
                      </span>
                    </div>
                  </div>

                  {isUserInTeam && (
                    <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full font-semibold">
                      Your Team
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                  {team.description || 'No description provided.'}
                </p>

                {/* Team Leads */}
                <div className="mb-4 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-semibold">
                    TEAM LEADS ({teamLeads.length})
                  </span>
                  <div className="space-y-1.5">
                    {teamLeads.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">No assigned leads</span>
                    ) : (
                      teamLeads.map(lead => (
                        <div key={lead.id} className="flex items-center gap-2">
                          <UserAvatar user={lead} size="xs" />
                          <span className="text-xs text-slate-200 font-medium truncate">{lead.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">({lead.title || 'Lead'})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Sprint & Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                  <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">ACTIVE SPRINT</span>
                    <span className="text-slate-200 font-semibold truncate block">
                      {activeSprint ? activeSprint.name : 'None'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900/40 rounded-lg border border-slate-800">
                    <span className="text-[9px] text-slate-400 block">DELIVERABLES</span>
                    <span className="text-slate-200 font-semibold">
                      {completedTasks.length} / {teamTasks.length} done
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Engineer Avatars + Drill down link */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <AvatarGroup users={teamMembers} size="xs" max={4} />
                <Link
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-1 text-xs font-mono text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
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
        maxWidth="md"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">TEAM NAME *</label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Guidance & Navigation Subsystem"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">DESCRIPTION</label>
            <textarea
              rows={3}
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              placeholder="Subsystem scope, mission deliverables, hardware integration..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">ACCENT COLOR</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-300">{newTeamColor}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              Create Subsystem
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
