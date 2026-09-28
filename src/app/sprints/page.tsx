import { AppShell } from '@/components/layout/app-shell';
import { SprintPlanningView } from '@/components/sprint/sprint-planning-view';

export default function SprintsPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Sprint Planning Engine' }]}>
      <SprintPlanningView />
    </AppShell>
  );
}
