'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/store/app-context';
import { RoleBadge } from '@/components/ui/badges';
import { UserAvatar } from '@/components/ui/avatar';
import { ChevronDown, RefreshCw, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DevRoleSwitcher: React.FC = () => {
  const { currentUser, allProfiles, switchUser, resetToSeedData } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Group profiles by role for clear selector
  const admins = allProfiles.filter(p => p.role === 'ADMIN');
  const officeBearers = allProfiles.filter(p => p.role === 'OFFICE_BEARER');
  const teamLeads = allProfiles.filter(p => p.role === 'TEAM_LEAD');
  const teamMembers = allProfiles.filter(p => p.role === 'TEAM_MEMBER');

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium transition-all shadow-xs group"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-mono text-gray-500">SWITCH USER:</span>
        <span className="font-semibold text-gray-900 max-w-[120px] truncate">{currentUser.full_name}</span>
        <RoleBadge role={currentUser.role} size="sm" />
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Simulate Role & Session</span>
            </div>
            <button
              onClick={() => {
                resetToSeedData();
                setIsOpen(false);
              }}
              title="Reset all tasks, comments, and sprints back to default seed"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-amber-600 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {/* Admins Section */}
            {admins.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-700 font-semibold px-2 mb-1">
                  Administrators (User Provisioning)
                </div>
                <div className="space-y-1">
                  {admins.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        switchUser(p.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors",
                        p.id === currentUser.id 
                          ? "bg-purple-50 border border-purple-200 text-purple-900 font-medium" 
                          : "hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar user={p} size="sm" />
                        <div className="truncate">
                          <div className="font-medium text-gray-900 truncate">{p.full_name}</div>
                          <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                        </div>
                      </div>
                      {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-purple-600 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Office Bearers Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-semibold px-2 mb-1">
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
                        ? "bg-blue-50 border border-blue-200 text-blue-900 font-medium" 
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={p} size="sm" />
                      <div className="truncate">
                        <div className="font-medium text-gray-900 truncate">{p.full_name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Leads Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold px-2 mb-1">
                Team Leads (Team Control)
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
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium" 
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={p} size="sm" />
                      <div className="truncate">
                        <div className="font-medium text-gray-900 truncate">{p.full_name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Members Section */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-700 font-semibold px-2 mb-1">
                Team Members (Assigned Work)
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
                        ? "bg-gray-100 border border-gray-300 text-gray-900 font-medium" 
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar user={p} size="sm" />
                      <div className="truncate">
                        <div className="font-medium text-gray-900 truncate">{p.full_name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{p.title}</div>
                      </div>
                    </div>
                    {p.id === currentUser.id && <UserCheck className="w-4 h-4 text-gray-900 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Simulates Supabase Auth & RLS policies in real time</span>
          </div>
        </div>
      )}
    </div>
  );
};
