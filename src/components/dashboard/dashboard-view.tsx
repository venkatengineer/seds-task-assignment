'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store/app-context';
import { OfficeBearerDashboard } from './office-bearer-dashboard';
import { TeamLeadDashboard } from './team-lead-dashboard';
import { TeamMemberDashboard } from './team-member-dashboard';
import { TaskDetailDrawer } from '@/components/tasks/task-detail-drawer';
import { TaskCreateModal } from '@/components/tasks/task-create-modal';

export const DashboardView: React.FC = () => {
  const { currentUser } = useApp();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  return (
    <>
      {currentUser.role === 'OFFICE_BEARER' && (
        <OfficeBearerDashboard
          onSelectTask={setSelectedTaskId}
          onCreateTask={() => setIsCreateTaskOpen(true)}
        />
      )}

      {currentUser.role === 'TEAM_LEAD' && (
        <TeamLeadDashboard
          onSelectTask={setSelectedTaskId}
          onCreateTask={() => setIsCreateTaskOpen(true)}
        />
      )}

      {currentUser.role === 'TEAM_MEMBER' && (
        <TeamMemberDashboard
          onSelectTask={setSelectedTaskId}
        />
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Task Create Modal */}
      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />
    </>
  );
};
