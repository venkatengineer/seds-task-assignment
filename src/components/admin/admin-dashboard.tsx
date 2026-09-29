'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Profile, Team, UserRole } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { RoleBadge } from '@/components/ui/badges';
import { ChangePasswordModal } from '@/components/profile/change-password-modal';
import { 
  Users, UserPlus, Search, 
  Edit2, Ban, CheckCircle, AlertTriangle,
  UserCheck, UserX, Mail, Building, Plus,
  RotateCcw, KeyRound, Loader2
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
    adminResetPassword,
    createTeam,
    updateTeam,
    archiveTeam,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [resettingUser, setResettingUser] = useState<Profile | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isChangeMyPasswordOpen, setIsChangeMyPasswordOpen] = useState(false);
  const [resetCustomPassword, setResetCustomPassword] = useState('Seds@2026');

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TEAM_MEMBER');
  const [newTeamId, setNewTeamId] = useState<string>(teams[0]?.id || '');
  const [newTitle, setNewTitle] = useState('');
  const [newPassword, setNewPassword] = useState('Seds@2026');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotification, setSuccessNotification] = useState<{ title: string; message: string; password?: string } | null>(null);

  // Auto-sync team selection whenever teams load or change
  useEffect(() => {
    if (teams.length > 0 && !newTeamId) {
      setNewTeamId(teams[0].id);
    }
  }, [teams, newTeamId]);

  // New Team Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#2563EB');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);
  const [isTeamSubmitting, setIsTeamSubmitting] = useState(false);

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    const effectiveTeamId = (newRole === 'OFFICE_BEARER' || newRole === 'ADMIN')
      ? (newTeamId || null)
      : (newTeamId || (teams.length > 0 ? teams[0].id : ''));

    if ((newRole === 'TEAM_MEMBER' || newRole === 'TEAM_LEAD') && !effectiveTeamId) {
      setFormError('Team Members and Team Leads must be assigned to an active team. Please create a team first if none exist.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const cleanEmail = newEmail.trim().toLowerCase();

      // Check if user already exists
      const existing = allProfiles.find(p => p.email.toLowerCase() === cleanEmail);
      if (existing) {
        setFormError(`${existing.full_name} (${existing.email}) is already registered as ${existing.role.replace('_', ' ')}. They can sign in directly at /login.`);
        setIsSubmitting(false);
        return;
      }

      const initialPass = newPassword.trim() || 'Seds@2026';

      await createUser({
        full_name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        team_id: effectiveTeamId,
        title: newTitle.trim() || undefined,
        password: initialPass,
      });

      setSuccessNotification({
        title: 'Member Account Provisioned Successfully!',
        message: `${newName.trim()} (${newEmail.trim().toLowerCase()}) has been activated in the system.`,
        password: initialPass,
      });

      // Reset
      setNewName('');
      setNewEmail('');
      setNewTitle('');
      setNewPassword('Seds@2026');
      setIsCreateUserOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resettingUser) return;
    try {
      setIsResettingPassword(true);
      const targetPass = resetCustomPassword.trim() || 'Seds@2026';
      const res = await adminResetPassword(resettingUser.id, targetPass);
      if (res.error) {
        setFormError(res.error);
      } else {
        setSuccessNotification({
          title: 'Password Updated Successfully!',
          message: `Password for ${resettingUser.full_name} (${resettingUser.email}) has been set to "${res.password || targetPass}".`,
          password: res.password || targetPass,
        });
        setResettingUser(null);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setTeamFormError(null);
    setIsTeamSubmitting(true);

    try {
      await createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim(),
        icon: '🚀',
        color: newTeamColor,
        accent: newTeamColor,
      });
      setNewTeamName('');
      setNewTeamDescription('');
      setIsCreateTeamOpen(false);
    } catch (err: unknown) {
      console.error('Failed to create team:', err);
      setTeamFormError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setIsTeamSubmitting(false);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if ((editingUser.role === 'TEAM_MEMBER' || editingUser.role === 'TEAM_LEAD') && !editingUser.team_id) {
      alert('Team Members and Team Leads must be assigned to a team.');
      return;
    }

    await updateUser(editingUser.id, {
      full_name: editingUser.full_name,
      role: editingUser.role,
      team_id: editingUser.team_id,
      title: editingUser.title,
    });
    setEditingUser(null);
  };

  const handleUpdateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    await updateTeam(editingTeam.id, {
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
            SEDS Administration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provision SEDS organization members, enforce single-team constraints, and configure project teams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsChangeMyPasswordOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50/50 border border-gray-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Change your administrator password"
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Change My Password</span>
          </button>
          <button
            onClick={() => setIsCreateTeamOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gray-500" />
            <span>Create Team</span>
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setNewTeamId(teams[0]?.id || '');
              setIsCreateUserOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Member</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successNotification.title}</span>
            </div>
            <p>{successNotification.message}</p>
            {successNotification.password && (
              <p className="font-mono bg-white border border-emerald-200 px-2 py-1 rounded inline-block text-[11px] text-gray-800 mt-1">
                Temporary Password: <span className="font-bold text-emerald-700">{successNotification.password}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* First-Run Experience */}
      {teams.length === 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-gray-900">Welcome to SEDS Administration</h3>
          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            Your organization is ready to be configured. Create your engineering subsystem teams and provision member accounts. Team Leads and Members will then receive setup notifications and access their role-based workspaces.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsCreateTeamOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Create First Team
            </button>
            <button
              onClick={() => setIsCreateUserOpen(true)}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium shadow-xs"
            >
              Provision First User
            </button>
          </div>
        </div>
      )}

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
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{stats.suspended}</div>
          <p className="text-[11px] text-gray-500 mt-1">Access revoked / blocked</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Project Teams</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.teamCount}</div>
          <p className="text-[11px] text-gray-500 mt-1">Configured subsystems</p>
        </div>
      </div>

      {/* Users Management Section */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name, email, or title..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
            >
              <option value="ALL">All Roles</option>
              <option value="OFFICE_BEARER">Office Bearer</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="TEAM_MEMBER">Team Member</option>
              <option value="ADMIN">Platform Admin</option>
            </select>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
            >
              <option value="ALL">All Teams</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Subsystem Team</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No members match the current search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const assignedTeam = teams.find(t => t.id === user.team_id);
                  const isSuspended = user.account_status === 'SUSPENDED';

                  return (
                    <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{user.full_name}</span>
                          {user.id === currentUser.id && (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-sm">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <RoleBadge role={user.role} size="sm" />
                      </td>

                      <td className="py-3 px-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {assignedTeam ? (
                          <div className="flex items-center gap-1.5 font-medium text-gray-900">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: assignedTeam.color || '#2563EB' }}
                            />
                            <span>{assignedTeam.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            {user.role === 'OFFICE_BEARER' || user.role === 'ADMIN' ? 'Org-Wide' : 'Unassigned'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {user.title || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.id === currentUser.id ? (
                            <button
                              type="button"
                              onClick={() => setIsChangeMyPasswordOpen(true)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                              title="Change your admin password"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Change Password</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingUser(user)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Edit member details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  setResetCustomPassword('Seds@2026');
                                  setResettingUser(user);
                                }}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                title="Reset or update member password"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {isSuspended ? (
                                <button
                                  onClick={() => activateUser(user.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                  title="Reactivate account"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => suspendUser(user.id)}
                                  disabled={user.id === currentUser.id}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
                                  title="Suspend account"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
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
          <button
            onClick={() => setIsCreateTeamOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teams.length === 0 ? (
            <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-xs">
              No project teams configured yet. Click "Add Team" to create one.
            </div>
          ) : (
            teams.map((team) => {
              const teamMembers = allProfiles.filter(p => p.team_id === team.id && p.role !== 'ADMIN');
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
                        className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
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
            })
          )}
        </div>
      </div>

      {/* Modal: Provision New Member */}
      <Modal isOpen={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} title="Provision SEDS Member" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4 py-2">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{formError}</span>
                {(formError.includes('SUPABASE_SERVICE_ROLE_KEY') || formError.includes('SUPABASE_SECRET_KEY') || formError.includes('admin secret key')) && (
                  <p className="text-[11px] text-red-600 mt-1 leading-relaxed">
                    <strong>Resolution:</strong> In your Vercel Project Settings &gt; Environment Variables, ensure <code className="bg-red-100 font-mono px-1 py-0.5 rounded">SUPABASE_SECRET_KEY</code> or <code className="bg-red-100 font-mono px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> is enabled for your environment and redeploy.
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
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
              placeholder="e.g. rahul@sedsrec.org"
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
                value={newTeamId || (teams[0]?.id || '')}
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">Initial Password *</label>
              <span className="text-[10px] text-gray-400 font-mono">Default: Seds@2026</span>
            </div>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="e.g. Seds@2026"
              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-blue-500 font-mono text-gray-900"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              The member will use this password to sign in at <span className="font-semibold text-blue-600">/login</span>. They can change it anytime via &quot;Forgot Password&quot;.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateUserOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Team */}
      <Modal isOpen={isCreateTeamOpen} onClose={() => setIsCreateTeamOpen(false)} title="Create Project Team" size="md">
        <form onSubmit={handleCreateTeamSubmit} className="space-y-4 py-2">
          {teamFormError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {teamFormError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Team Name *</label>
            <input
              type="text"
              required
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Propulsion Subsystem"
              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              rows={3}
              placeholder="Responsibilities, mission scope, and technical objectives..."
              className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-hidden text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Team Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTeamColor}
                onChange={(e) => setNewTeamColor(e.target.value)}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
              />
              <span className="text-xs font-mono text-gray-500">{newTeamColor}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateTeamOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTeamSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isTeamSubmitting ? 'Creating...' : 'Create Team'}
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
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
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
                className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                Archive Team
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
                >
                  Update Team
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Confirm Reset Password */}
      {resettingUser && (
        <Modal
          isOpen={Boolean(resettingUser)}
          onClose={() => setResettingUser(null)}
          title="Reset / Update Member Password"
          size="sm"
        >
          <div className="space-y-4 py-1">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs text-gray-700 leading-relaxed">
                  Reset account password for <strong className="text-gray-900">{resettingUser.full_name}</strong> (
                  <span className="font-mono text-gray-600">{resettingUser.email}</span>).
                </p>

                <div className="mt-3 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    New Password
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resetCustomPassword}
                      onChange={(e) => setResetCustomPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setResetCustomPassword('Seds@2026')}
                      className="shrink-0 px-2.5 py-2 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                      title="Reset to default Seds@2026"
                    >
                      Default
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Default: <span className="font-mono font-semibold text-gray-700">Seds@2026</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isResettingPassword}
                onClick={() => setResettingUser(null)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResettingPassword || !resetCustomPassword.trim()}
                onClick={handleConfirmResetPassword}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Set Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin's Own Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangeMyPasswordOpen}
        onClose={() => setIsChangeMyPasswordOpen(false)}
      />
    </div>
  );
};
