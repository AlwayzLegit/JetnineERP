/**
 * The Cashier home as a route of its own — same two-door pattern as
 * /operations and /warehouse: the Cashier role lands here from
 * /dashboard, everyone else with `cashier.dashboard.view` reaches it
 * from the nav.
 */
export const dynamic = 'force-dynamic';

import MyDayPageClient from './my-day-client';

export default function MyDayPage() {
  return <MyDayPageClient />;
}
