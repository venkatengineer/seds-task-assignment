import { AppShell } from '@/components/layout/app-shell';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export default function DashboardPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Command Center' }]}>
      <DashboardView />
    </AppShell>
  );
}
