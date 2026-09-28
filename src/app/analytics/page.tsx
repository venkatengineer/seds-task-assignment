import { AppShell } from '@/components/layout/app-shell';
import { AnalyticsView } from '@/components/analytics/analytics-view';

export default function AnalyticsPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Analytics & Burndown' }]}>
      <AnalyticsView />
    </AppShell>
  );
}
