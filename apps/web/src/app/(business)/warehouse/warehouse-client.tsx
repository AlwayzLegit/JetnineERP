'use client';

import { useSession } from '@/lib/auth-client';
import { Alert, LinkButton, LoadingRows, PageHeader } from '@/components/ui';
import WarehouseDashboardView from '../dashboard/warehouse-dashboard';

export default function WarehousePageClient() {
  const session = useSession();
  if (session.isPending) return <LoadingRows />;
  if (!session.data) {
    return (
      <>
        <PageHeader title="Warehouse" />
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
  return <WarehouseDashboardView userName={session.data.user.name ?? session.data.user.email} />;
}
