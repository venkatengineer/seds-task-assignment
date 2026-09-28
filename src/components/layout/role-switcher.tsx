'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { RoleBadge } from '@/components/ui/badges';
import { UserAvatar } from '@/components/ui/avatar';
import { ChevronDown, RefreshCw, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DevRoleSwitcher: React.FC = () => {
  const { currentUser, allProfiles, switchUser, resetToSeedData } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Group profiles by role for clear selector
  const officeBearers = allProfiles.filter(p => p.role === 'OFFICE_BEARER');
  const teamLeads = allProfiles.filter(p => p.role === 'TEAM_LEAD');
  const teamMembers = allProfiles.filter(p => p.role === 'TEAM_MEMBER');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/50 text-indigo-200 text-xs font-medium transition-all shadow-xs group"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-mono text-indigo-300">DEMO SWITCHER:</span>
        <span className="font-semibold text-white max-w-[130px] truncate">{currentUser.full_name}</span>
        <RoleBadge role={currentUser.role} size="sm" />
        <ChevronDown className={cn("w-3.5 h-3.5 text-indigo-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0e111a] border border-[#262c45] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulate Role & Session</span>
            </div>
            <button
              onClick={() => {
                resetToSeedData();
                setIsOpen(false);
              }}
              title="Reset all tasks, comments, and sprints back to default seed"
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {/* Office Bearers Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold px-2 mb-1">
                Office Bearers (Org-wide Authority)
              </div>
              <div className="space-y-1">
                {officeBearers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchUser(p.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors",
                      p.id === currentUser.id 
                        ? "bg-purple-950/70 border border-purple-600/60 text-purple-200" 
                        : "hover:bg-slate-800/80 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={p} size="sm" />
                      <div className="truncate">
                        <div className="font-medium text-white truncate">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-purple-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Leads Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold px-2 mb-1">
                Team Leads (Team Scope)
              </div>
              <div className="space-y-1">
                {teamLeads.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchUser(p.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors",
                      p.id === currentUser.id 
                        ? "bg-indigo-950/70 border border-indigo-600/60 text-indigo-200" 
                        : "hover:bg-slate-800/80 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={p} size="sm" />
                      <div className="truncate">
                        <div className="font-medium text-white truncate">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Members Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold px-2 mb-1">
                Team Members (Restricted Scope)
              </div>
              <div className="space-y-1">
                {teamMembers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchUser(p.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors",
                      p.id === currentUser.id 
                        ? "bg-sky-950/70 border border-sky-600/60 text-sky-200" 
                        : "hover:bg-slate-800/80 text-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={p} size="sm" />
                      <div className="truncate">
                        <div className="font-medium text-white truncate">{p.full_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-sky-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Simulates Supabase Auth & RLS policies in real time</span>
          </div>
        </div>
      )}
    </div>
  );
};
