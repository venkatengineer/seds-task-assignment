import { AppShell } from '@/components/layout/app-shell';
import { OpenTasksView } from '@/components/tasks/open-tasks-view';

export default function OpenTasksPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Open Tasks' }]}>
      <OpenTasksView />
    </AppShell>
  );
}
