'use client';

import { useEffect, useState } from 'react';
import { formatMoney } from '@jetnine/shared';
import { LoadingRows, PageHeader } from '@/components/ui';
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
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }
  if (!metrics) return <LoadingRows />;

  return (
    <div>
      <PageHeader title="Platform metrics" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total businesses" value={String(metrics.totalBusinesses)} />
        <StatCard label="Active businesses" value={String(metrics.activeBusinesses)} />
        <StatCard label="Total users" value={String(metrics.totalUsers)} />
        <StatCard
          label="Sales (last 30d)"
          value={`${metrics.salesLast30Days.count} · ${formatMoney(metrics.salesLast30Days.grossCents)}`}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 20, marginTop: 0 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}
