import { Suspense } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { AnalyticsView } from '@/components/analytics/analytics-view';

export default function AnalyticsPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Analytics & Burndown' }]}>
      <Suspense fallback={<div className="p-12 text-center text-xs text-gray-400">Loading metrics and analytics...</div>}>
        <AnalyticsView />
      </Suspense>
    </AppShell>
  );
}
