'use client';

import React from 'react';
import { Profile } from '@/types/database';
import { Modal } from '@/components/ui/modal';
import { MemberDetailAnalytics } from './member-detail-analytics';
import { Award } from 'lucide-react';

interface MemberAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Profile | null;
  teamMembers?: Profile[];
  onSelectMember?: (memberId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

export const MemberAnalyticsModal: React.FC<MemberAnalyticsModalProps> = ({
  isOpen,
  onClose,
  member,
  teamMembers = [],
  onSelectMember,
  onSelectTask,
}) => {
  if (!member) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          <span>Member Analytics & History Inspection</span>
        </div>
      }
      description="Inspect member-wise completed story points, sprint velocity trends, and deliverable logs."
      size="2xl"
      className="max-w-5xl w-full max-h-[92vh]"
    >
      <div className="py-2">
        <MemberDetailAnalytics
          member={member}
          teamMembers={teamMembers}
          onSelectMember={onSelectMember}
          onSelectTask={onSelectTask}
        />
      </div>
    </Modal>
  );
};
