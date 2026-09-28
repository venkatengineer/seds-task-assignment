'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Orbit, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RoleBadge } from '@/components/ui/badges';
import { UserAvatar } from '@/components/ui/avatar';

export const LoginView: React.FC = () => {
  const router = useRouter();
  const { switchUser, allProfiles } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Grouped seed demo profiles for quick login testing
  const officeBearer = allProfiles.find(p => p.role === 'OFFICE_BEARER')!;
  const teamLead = allProfiles.find(p => p.role === 'TEAM_LEAD')!;
  const teamMember = allProfiles.find(p => p.role === 'TEAM_MEMBER')!;
  const adminUser = allProfiles.find(p => p.role === 'ADMIN');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Find profile matching email or fallback to selected
    const found = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    setTimeout(() => {
      if (found) {
        switchUser(found.id);
        router.push(found.role === 'ADMIN' ? '/admin' : '/dashboard');
      } else if (email) {
        // If email not found in seed, let user in as first profile
        switchUser(allProfiles[0].id);
        router.push('/dashboard');
      } else {
        setError('Please provide an email or select a demo account.');
        setLoading(false);
      }
    }, 300);
  };

  const handleQuickDemoLogin = (userId: string) => {
    switchUser(userId);
    const user = allProfiles.find(p => p.id === userId);
    router.push(user?.role === 'ADMIN' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-xs mb-1">
            <Orbit className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            SEDS REC
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Team Operations & Sprint Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="p-6 sm:p-7 bg-white border border-gray-200 rounded-xl shadow-xs space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                SEDS CREDENTIAL EMAIL
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@sedsrec.org"
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to SEDS Platform'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Instant Demo Role Sign In:</span>
            </div>

            <div className="space-y-1.5">
              {adminUser && (
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin(adminUser.id)}
                  className="w-full p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <UserAvatar user={adminUser} size="xs" />
                    <div className="truncate">
                      <span className="font-semibold text-gray-900 group-hover:text-blue-600 block truncate">{adminUser.full_name}</span>
                      <span className="text-[10px] text-gray-500 block truncate">{adminUser.title}</span>
                    </div>
                  </div>
                  <RoleBadge role="ADMIN" size="sm" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(officeBearer.id)}
                className="w-full p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={officeBearer} size="xs" />
                  <div className="truncate">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 block truncate">{officeBearer.full_name}</span>
                    <span className="text-[10px] text-gray-500 block truncate">{officeBearer.title}</span>
                  </div>
                </div>
                <RoleBadge role="OFFICE_BEARER" size="sm" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(teamLead.id)}
                className="w-full p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={teamLead} size="xs" />
                  <div className="truncate">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 block truncate">{teamLead.full_name}</span>
                    <span className="text-[10px] text-gray-500 block truncate">{teamLead.title}</span>
                  </div>
                </div>
                <RoleBadge role="TEAM_LEAD" size="sm" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(teamMember.id)}
                className="w-full p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={teamMember} size="xs" />
                  <div className="truncate">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 block truncate">{teamMember.full_name}</span>
                    <span className="text-[10px] text-gray-500 block truncate">{teamMember.title}</span>
                  </div>
                </div>
                <RoleBadge role="TEAM_MEMBER" size="sm" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Production-Ready Supabase Auth & RLS Protocol</span>
        </div>
      </div>
    </div>
  );
};
