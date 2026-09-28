import { AppShell } from '@/components/layout/app-shell';
import { KanbanBoard } from '@/components/tasks/kanban-board';

export default function TasksPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Task Operations Board' }]}>
      <KanbanBoard />
    </AppShell>
  );
}
