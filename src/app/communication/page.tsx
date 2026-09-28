import { AppShell } from '@/components/layout/app-shell';
import { CommunicationView } from '@/components/communication/communication-view';

export default function CommunicationPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Internal Communication' }]}>
      <CommunicationView />
    </AppShell>
  );
}
