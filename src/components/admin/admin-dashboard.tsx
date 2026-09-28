'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Profile, Team, UserRole } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { RoleBadge } from '@/components/ui/badges';
import { 
  Users, UserPlus, Search, 
  Edit2, Ban, CheckCircle, AlertTriangle,
  UserCheck, UserX, Mail, Building
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    allProfiles, 
    teams, 
    createUser, 
    updateUser, 
    suspendUser, 
    activateUser,
    updateTeam,
    archiveTeam
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TEAM_MEMBER');
  const [newTeamId, setNewTeamId] = useState<string>(teams[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allProfiles.filter(p => {
      const matchesSearch = 
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
      const matchesTeam = teamFilter === 'ALL' || p.team_id === teamFilter;
      const matchesStatus = statusFilter === 'ALL' || (p.account_status || 'ACTIVE') === statusFilter;

      return matchesSearch && matchesRole && matchesTeam && matchesStatus;
    });
  }, [allProfiles, searchQuery, roleFilter, teamFilter, statusFilter]);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = allProfiles.length;
    const active = allProfiles.filter(p => (p.account_status || 'ACTIVE') === 'ACTIVE').length;
    const suspended = allProfiles.filter(p => p.account_status === 'SUSPENDED').length;
    const teamCount = teams.length;
    return { total, active, suspended, teamCount };
  }, [allProfiles, teams]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    if ((newRole === 'TEAM_MEMBER' || newRole === 'TEAM_LEAD') && !newTeamId) {
      setFormError('Team Members and Team Leads must be assigned to exactly one team.');
      return;
    }

    try {
      setFormError(null);
      createUser({
        full_name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        team_id: (newRole === 'OFFICE_BEARER' || newRole === 'ADMIN') ? (newTeamId || null) : newTeamId,
        title: newTitle.trim() || undefined,
      });

      // Reset
      setNewName('');
      setNewEmail('');
      setNewTitle('');
      setIsCreateUserOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if ((editingUser.role === 'TEAM_MEMBER' || editingUser.role === 'TEAM_LEAD') && !editingUser.team_id) {
      alert('Team Members and Team Leads must be assigned to a team.');
      return;
    }

    updateUser(editingUser.id, {
      full_name: editingUser.full_name,
      role: editingUser.role,
      team_id: editingUser.team_id,
      title: editingUser.title,
    });
    setEditingUser(null);
  };

  const handleUpdateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    updateTeam(editingTeam.id, {
      name: editingTeam.name,
      description: editingTeam.description,
    });
    setEditingTeam(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 rounded-md">
              Platform Administration
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            User & Member Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provision SEDS organization members, enforce single-team constraints, and configure platform roles.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateUserOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Member</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Members</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-[11px] text-gray-500 mt-1">SEDS REC registered accounts</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Accounts</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          <p className="text-[11px] text-gray-500 mt-1">Operational & authenticated</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Suspended</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.suspended}</div>
          <p className="text-[11px] text-gray-500 mt-1">Deactivated access</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Engineering Teams</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.teamCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Configured project units</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or designation..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-700"
            >
              <option value="ALL">All Roles</option>
              <option value="OFFICE_BEARER">Office Bearer</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* Team Filter */}
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-700"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const assignedTeam = teams.find(t => t.id === user.team_id);
                  const isSuspended = user.account_status === 'SUSPENDED';

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 leading-tight truncate">
                              {user.full_name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <RoleBadge role={user.role} />
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4">
                        {assignedTeam ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {assignedTeam.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">None / Org-wide</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {user.title || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit member details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => activateUser(user.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Reactivate account"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => suspendUser(user.id)}
                              disabled={user.id === currentUser.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-md transition-colors"
                              title="Suspend account"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Project Teams Configuration</h2>
            <p className="text-xs text-gray-500">SEDS sub-organizations and department units</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.map((team) => {
            const teamMembers = allProfiles.filter(p => p.team_id === team.id);
            const teamLeads = teamMembers.filter(p => p.role === 'TEAM_LEAD');

            return (
              <div key={team.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-xs text-gray-800">
                        {team.name.charAt(0)}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900">{team.name}</h3>
                    </div>
                    <button
                      onClick={() => setEditingTeam(team)}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                      title="Edit team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                    {team.description || 'No description provided'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{teamMembers.length} members</span>
                  <span className="text-[11px] font-medium text-gray-700">
                    {teamLeads.length} Lead{teamLeads.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Provision New Member */}
      <Modal isOpen={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} title="Provision SEDS Member" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4 py-2">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Vikramaditya Sharma"
              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. vikram@seds.in"
              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">System Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
              >
                <option value="TEAM_MEMBER">Team Member</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="OFFICE_BEARER">Office Bearer</option>
                <option value="ADMIN">Platform Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Assigned Team {(newRole === 'TEAM_MEMBER' || newRole === 'TEAM_LEAD') && <span className="text-red-500">*</span>}
              </label>
              <select
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
              >
                {(newRole === 'OFFICE_BEARER' || newRole === 'ADMIN') && (
                  <option value="">None (Org-wide access)</option>
                )}
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Designation / Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Propulsion Subsystems Engineer"
              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Provision Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Existing User */}
      {editingUser && (
        <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit Member Profile" size="md">
          <form onSubmit={handleUpdateUserSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={editingUser.full_name}
                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
                >
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="OFFICE_BEARER">Office Bearer</option>
                  <option value="ADMIN">Platform Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Team</label>
                <select
                  value={editingUser.team_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, team_id: e.target.value || null })}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
                >
                  <option value="">None / Org-wide</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={editingUser.title || ''}
                onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Edit Team */}
      {editingTeam && (
        <Modal isOpen={!!editingTeam} onClose={() => setEditingTeam(null)} title="Edit Project Team" size="md">
          <form onSubmit={handleUpdateTeamSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Team Name</label>
              <input
                type="text"
                value={editingTeam.name}
                onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={editingTeam.description || ''}
                onChange={(e) => setEditingTeam({ ...editingTeam, description: e.target.value })}
                rows={3}
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Archive team "${editingTeam.name}"?`)) {
                    archiveTeam(editingTeam.id);
                    setEditingTeam(null);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Archive Team
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Update Team
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
