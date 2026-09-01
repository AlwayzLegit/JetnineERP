/**
 * The Operations home as a route of its own.
 *
 * `/dashboard` opens here automatically for the Operations role; owners
 * and managers — who hold `ops.dashboard.view` like every other business
 * permission — reach the same page from the nav without losing their own
 * home. One component, two doors.
 */
export const dynamic = 'force-dynamic';

import OperationsPageClient from './operations-client';

export default function OperationsPage() {
  return <OperationsPageClient />;
}
