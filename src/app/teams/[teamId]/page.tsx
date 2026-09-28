import { AppShell } from '@/components/layout/app-shell';
import { TeamDetailView } from '@/components/team/team-detail-view';

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <AppShell
      breadcrumbs={[
        { label: 'SEDS REC', href: '/' },
        { label: 'Subsystems', href: '/teams' },
        { label: 'Subsystem Detail' },
      ]}
    >
      <TeamDetailView teamId={teamId} />
    </AppShell>
  );
}
