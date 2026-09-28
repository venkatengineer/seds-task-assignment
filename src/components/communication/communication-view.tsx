'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { Permissions } from '@/lib/permissions';
import { 
  Send, Plus, CornerDownRight 
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/modal';
import { formatTimeAgo } from '@/lib/utils';

export const CommunicationView: React.FC = () => {
  const { 
    currentUser, teams, announcements, 
    leadMessages, comments, tasks, 
    createAnnouncement, sendLeadMessage, replyLeadMessage 
  } = useApp();

  const isOfficeBearer = Permissions.isOfficeBearer(currentUser);
  const isTeamLead = Permissions.isTeamLead(currentUser);
  const userTeam = teams.find(t => t.id === currentUser.team_id) || teams[0];

  const [activeTab, setActiveTab] = useState<'announcements' | 'lead_messages' | 'discussions'>('announcements');

  // Announcement Modal State
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announceScope, setAnnounceScope] = useState<'ORG' | 'TEAM'>(isOfficeBearer ? 'ORG' : 'TEAM');
  const [announcePriority, setAnnouncePriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');

  // Member Inquiry to Lead State
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');

  // Lead Reply Input State
  const [replyInput, setReplyInput] = useState<{ [id: string]: string }>({});

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter(a => {
    if (a.team_id === null) return true; // Org-wide
    if (isOfficeBearer) return true;
    return a.team_id === currentUser.team_id;
  });

  // Filtered Lead Messages
  const filteredMessages = leadMessages.filter(m => {
    if (isOfficeBearer) return true;
    if (isTeamLead) return m.team_id === currentUser.team_id;
    return m.sender_id === currentUser.id;
  });

  // Permitted Task Comments
  const permittedTasks = tasks.filter(t => Permissions.canViewTask(currentUser, t));
  const permittedTaskIds = new Set(permittedTasks.map(t => t.id));
  const recentComments = comments.filter(c => permittedTaskIds.has(c.task_id)).slice(0, 15);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceContent.trim()) return;

    createAnnouncement({
      team_id: announceScope === 'TEAM' ? (currentUser.team_id || teams[0]?.id) : null,
      title: announceTitle.trim(),
      content: announceContent.trim(),
      priority: announcePriority,
    });

    setAnnounceTitle('');
    setAnnounceContent('');
    setIsAnnounceModalOpen(false);
  };

  const handleSendLeadMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgContent.trim()) return;

    sendLeadMessage({
      team_id: userTeam.id,
      subject: msgSubject.trim(),
      message: msgContent.trim(),
    });

    setMsgSubject('');
    setMsgContent('');
    setIsMsgModalOpen(false);
  };

  const handleReplyMessage = (messageId: string) => {
    const text = replyInput[messageId]?.trim();
    if (!text) return;
    replyLeadMessage(messageId, text);
    setReplyInput(prev => ({ ...prev, [messageId]: '' }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2135]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded">
              COMMUNICATION & TELEMETRY DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SEDS Internal Communication
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contextual announcements, direct lead inquiries, and task discussion logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Post Announcement (Leads & Office Bearers) */}
          {(isTeamLead || isOfficeBearer) && (
            <button
              onClick={() => setIsAnnounceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Post Announcement</span>
            </button>
          )}

          {/* Member to Lead Inquiry */}
          <button
            onClick={() => setIsMsgModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>Message Team Leads</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'announcements'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Announcements ({filteredAnnouncements.length})
        </button>
        <button
          onClick={() => setActiveTab('lead_messages')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'lead_messages'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Lead Inquiries ({filteredMessages.length})
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
            activeTab === 'discussions'
              ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Task Comment Feed ({recentComments.length})
        </button>
      </div>

      {/* Tab 1: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#0a0c14] border border-slate-800 rounded-xl">
              No announcements posted yet.
            </div>
          ) : (
            filteredAnnouncements.map(ann => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl bg-[#0b0e17] border border-[#1e2439] shadow-lg space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                      {ann.team_name}
                    </span>
                    {ann.priority === 'URGENT' && (
                      <span className="text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold animate-pulse">
                        CRITICAL / URGENT
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-500">{formatTimeAgo(ann.created_at)}</span>
                </div>

                <h3 className="text-base font-bold text-white">{ann.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={ann.author} size="xs" />
                    <span>Posted by <strong className="text-slate-200">{ann.author?.full_name}</strong> ({ann.author?.title || ann.author?.role})</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Lead Messages & Inquiries */}
      {activeTab === 'lead_messages' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-300">
            Internal channel for engineers to request equipment clearances, notify blockers, or ask questions to Team Leads.
          </div>

          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#0a0c14] border border-slate-800 rounded-xl">
              No lead inquiries logged. Click "Message Team Leads" to send a dispatch.
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div
                key={msg.id}
                className="p-5 rounded-2xl bg-[#0b0e17] border border-[#1e2439] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={msg.sender} size="xs" />
                    <span className="text-xs font-bold text-white">{msg.sender?.full_name}</span>
                    <span className="text-[10px] font-mono text-slate-500">to Team Leads</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{formatTimeAgo(msg.created_at)}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-indigo-300 mb-1">{msg.subject}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{msg.message}</p>
                </div>

                {/* Reply Section */}
                {msg.reply ? (
                  <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/40 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-[10px]">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>TEAM LEAD RESOLUTION / REPLY:</span>
                    </div>
                    <p className="text-slate-200 pl-4">{msg.reply}</p>
                  </div>
                ) : (
                  (isTeamLead || isOfficeBearer) && (
                    <div className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={replyInput[msg.id] || ''}
                        onChange={(e) => setReplyInput(prev => ({ ...prev, [msg.id]: e.target.value }))}
                        placeholder="Reply to this engineer inquiry..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleReplyMessage(msg.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Reply
                      </button>
                    </div>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Discussions */}
      {activeTab === 'discussions' && (
        <div className="space-y-3">
          {recentComments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#0a0c14] border border-slate-800 rounded-xl">
              No task comments recorded yet.
            </div>
          ) : (
            recentComments.map(comment => {
              const task = tasks.find(t => t.id === comment.task_id);
              return (
                <div
                  key={comment.id}
                  className="p-3.5 rounded-xl bg-[#0b0e17] border border-[#1e2439] flex items-start gap-3"
                >
                  <UserAvatar user={comment.author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{comment.author?.full_name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    <div className="text-[10px] font-mono text-indigo-400 mt-0.5">
                      On Task: {task ? task.title : 'Task'}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">{comment.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Announcement Creation Modal */}
      <Modal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        title="Broadcast Subsystem Announcement"
        description="Deliver a high-visibility bulletin to engineers across the mission platform."
        maxWidth="md"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">BULLETIN TITLE *</label>
            <input
              type="text"
              required
              value={announceTitle}
              onChange={(e) => setAnnounceTitle(e.target.value)}
              placeholder="e.g. Flight Qualification Test Window Clearances"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">BROADCAST SCOPE</label>
              <select
                disabled={!isOfficeBearer}
                value={announceScope}
                onChange={(e) => setAnnounceScope(e.target.value as 'ORG' | 'TEAM')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                {isOfficeBearer && <option value="ORG">Organization-Wide</option>}
                <option value="TEAM">{userTeam.name} Subsystem</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">PRIORITY</label>
              <select
                value={announcePriority}
                onChange={(e) => setAnnouncePriority(e.target.value as 'NORMAL' | 'URGENT')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="URGENT">Critical / Urgent Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">CONTENT DETAILS *</label>
            <textarea
              rows={4}
              required
              value={announceContent}
              onChange={(e) => setAnnounceContent(e.target.value)}
              placeholder="Announcement text, lab timing instructions, or safety guidelines..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAnnounceModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              Publish Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Lead Inquiry Modal */}
      <Modal
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        title="Direct Message to Team Leads"
        description="Notify leads about equipment access, technical blockers, or lab scheduling."
        maxWidth="md"
      >
        <form onSubmit={handleSendLeadMessage} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">SUBJECT *</label>
            <input
              type="text"
              required
              value={msgSubject}
              onChange={(e) => setMsgSubject(e.target.value)}
              placeholder="e.g. Need thermal chamber booking clearance"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">INQUIRY / MESSAGE *</label>
            <textarea
              rows={4}
              required
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              placeholder="Explain the technical requirement or question in detail..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMsgModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
            >
              Transmit to Leads
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
