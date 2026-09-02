'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@jetnine/shared';
import { Alert, LoadingRows, PageHeader, StatGrid, StatTile } from '@/components/ui';
import { api } from '@/lib/api';

interface Metrics {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  salesLast30Days: { count: number; grossCents: number };
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Metrics>('/v1/admin/metrics')
      .then(setMetrics)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Platform metrics" />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (!metrics) {
    return (
      <div>
        <PageHeader title="Platform metrics" />
        <LoadingRows />
      </div>
    );
  }

  const sales = metrics.salesLast30Days;
  return (
    <div>
      <PageHeader title="Platform metrics" sub="Every tenant on the platform" />
      <StatGrid cols={4}>
        <StatTile label="Total businesses" value={metrics.totalBusinesses} />
        <StatTile
          label="Active businesses"
          value={metrics.activeBusinesses}
          sub={`of ${metrics.totalBusinesses}`}
        />
        <StatTile label="Total users" value={metrics.totalUsers} />
        <StatTile
          label="Sales (last 30d)"
          value={formatMoney(sales.grossCents)}
          sub={`${sales.count} ${sales.count === 1 ? 'order' : 'orders'}`}
        />
      </StatGrid>
    </div>
  );
}
