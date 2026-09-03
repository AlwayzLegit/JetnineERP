'use client';

import { useSession } from '@/lib/auth-client';
import { Alert, LinkButton, LoadingRows, PageHeader } from '@/components/ui';
import OperationsDashboardView from '../dashboard/operations-dashboard';

export default function OperationsPageClient() {
  const session = useSession();
  if (session.isPending) return <LoadingRows />;
  if (!session.data) {
    return (
      <>
        <PageHeader title="Operations" />
        <Alert
          tone="info"
          action={
            <LinkButton size="sm" variant="primary" href="/login">
              Sign in
            </LinkButton>
          }
        >
          You are not signed in.
        </Alert>
      </>
    );
  }
  return <OperationsDashboardView userName={session.data.user.name ?? session.data.user.email} />;
}
