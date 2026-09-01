/**
 * The Warehouse home as a route of its own — same two-door pattern as
 * /operations: the Warehouse role lands here from /dashboard, everyone
 * else with `warehouse.dashboard.view` reaches it from the nav.
 */
export const dynamic = 'force-dynamic';

import WarehousePageClient from './warehouse-client';

export default function WarehousePage() {
  return <WarehousePageClient />;
}
