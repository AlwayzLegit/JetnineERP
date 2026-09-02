'use client';

import { useSession } from '@/lib/auth-client';
import { Alert, LinkButton, LoadingRows, PageHeader } from '@/components/ui';
import MyDayDashboardView from '../dashboard/my-day-dashboard';

export default function MyDayPageClient() {
  const session = useSession();
  if (session.isPending) return <LoadingRows />;
  if (!session.data) {
    return (
      <>
        <PageHeader title="My Day" />
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
  return <MyDayDashboardView userName={session.data.user.name ?? session.data.user.email} />;
}
