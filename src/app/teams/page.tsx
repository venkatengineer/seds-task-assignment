import { AppShell } from '@/components/layout/app-shell';
import { TeamsDirectory } from '@/components/team/teams-directory';

export default function TeamsPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'SEDS REC', href: '/' }, { label: 'Subsystems Directory' }]}>
      <TeamsDirectory />
    </AppShell>
  );
}
