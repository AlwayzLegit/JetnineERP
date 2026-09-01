'use client';

import { useSession } from '@/lib/auth-client';
import { Card, LoadingRows } from '@/components/ui';
import WarehouseDashboardView from '../dashboard/warehouse-dashboard';

export default function WarehousePageClient() {
  const session = useSession();
  if (session.isPending) return <LoadingRows />;
  if (!session.data) {
    return (
      <Card title="Warehouse">
        <p style={{ margin: 0, fontSize: 13 }}>You are not signed in.</p>
      </Card>
    );
  }
  return <WarehouseDashboardView userName={session.data.user.name ?? session.data.user.email} />;
}
