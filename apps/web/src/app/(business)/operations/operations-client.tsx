'use client';

import { useSession } from '@/lib/auth-client';
import { Card, LoadingRows } from '@/components/ui';
import OperationsDashboardView from '../dashboard/operations-dashboard';

export default function OperationsPageClient() {
  const session = useSession();
  if (session.isPending) return <LoadingRows />;
  if (!session.data) {
    return (
      <Card title="Operations">
        <p style={{ margin: 0, fontSize: 13 }}>You are not signed in.</p>
      </Card>
    );
  }
  return <OperationsDashboardView userName={session.data.user.name ?? session.data.user.email} />;
}
