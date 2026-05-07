'use client';

import { useEffect, useState } from 'react';
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
        <h1 style={{ fontSize: 22, marginBottom: 12 }}>Platform metrics</h1>
        <p style={{ color: '#b00' }}>{error}</p>
      </div>
    );
  }
  if (!metrics) return <p>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Platform metrics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card label="Total businesses" value={String(metrics.totalBusinesses)} />
        <Card label="Active businesses" value={String(metrics.activeBusinesses)} />
        <Card label="Total users" value={String(metrics.totalUsers)} />
        <Card
          label="Sales (last 30d)"
          value={`${metrics.salesLast30Days.count} · $${(metrics.salesLast30Days.grossCents / 100).toFixed(2)}`}
        />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: '#fff',
        padding: 20,
        borderRadius: 6,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
