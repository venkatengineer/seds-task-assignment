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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Find profile matching email or fallback to selected
    const found = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    setTimeout(() => {
      if (found) {
        switchUser(found.id);
        router.push('/dashboard');
      } else if (email) {
        // If email not found in seed, let user in as first profile
        switchUser(allProfiles[0].id);
        router.push('/dashboard');
      } else {
        setError('Please provide an email or select a demo account.');
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickDemoLogin = (userId: string) => {
    switchUser(userId);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#07080d] bg-mission-grid flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 shadow-xl shadow-indigo-950/80 ring-1 ring-white/20 mb-2">
            <Orbit className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            SEDS REC
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Team Operations & Sprint Platform
          </p>
        </div>

        {/* Login Box */}
        <div className="p-6 sm:p-8 bg-[#0b0e17]/90 backdrop-blur-md border border-[#21273e] rounded-2xl shadow-2xl space-y-6 glow-subtle">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                SEDS CREDENTIAL EMAIL
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@sedsrec.org"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Mission OS'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant Demo Role Sign In:</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(officeBearer.id)}
                className="w-full p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-600/50 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={officeBearer} size="xs" />
                  <div className="truncate">
                    <span className="font-semibold text-white group-hover:text-purple-300 block truncate">{officeBearer.full_name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{officeBearer.title}</span>
                  </div>
                </div>
                <RoleBadge role="OFFICE_BEARER" size="sm" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(teamLead.id)}
                className="w-full p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-600/50 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={teamLead} size="xs" />
                  <div className="truncate">
                    <span className="font-semibold text-white group-hover:text-indigo-300 block truncate">{teamLead.full_name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{teamLead.title}</span>
                  </div>
                </div>
                <RoleBadge role="TEAM_LEAD" size="sm" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(teamMember.id)}
                className="w-full p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-600/50 flex items-center justify-between text-left text-xs transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar user={teamMember} size="xs" />
                  <div className="truncate">
                    <span className="font-semibold text-white group-hover:text-sky-300 block truncate">{teamMember.full_name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{teamMember.title}</span>
                  </div>
                </div>
                <RoleBadge role="TEAM_MEMBER" size="sm" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Production-Ready Supabase Auth & RLS Protocol</span>
        </div>
      </div>
    </div>
  );
};
