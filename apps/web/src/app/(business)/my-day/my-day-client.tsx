'use client';

import { useSession } from '@/lib/auth-client';
import { Card, LoadingRows } from '@/components/ui';
import MyDayDashboardView from '../dashboard/my-day-dashboard';

export default function MyDayPageClient() {
  const session = useSession();
  if (session.isPending) return <LoadingRows />;
  if (!session.data) {
    return (
      <Card title="My Day">
        <p style={{ margin: 0, fontSize: 13 }}>You are not signed in.</p>
      </Card>
    );
  }
  return <MyDayDashboardView userName={session.data.user.name ?? session.data.user.email} />;
}
