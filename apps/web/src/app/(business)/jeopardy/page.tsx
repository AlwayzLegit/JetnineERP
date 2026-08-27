'use client';

import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';

interface JeopardyRow {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  locationName: string | null;
  lineId: string;
  productName: string;
  sku: string | null;
  shortfall: number;
  deliveryDate: string;
  risk: 'no_supply' | 'late';
  daysLate: number | null;
  supplySource: 'po' | 'transfer' | null;
  supplyReference: string | null;
  supplyDate: string | null;
}

interface JeopardyReport {
  horizonDays: number;
  generatedAt: string;
  rows: JeopardyRow[];
}

/**
 * The call list: open order lines whose unreserved quantity has no
 * inbound supply, or supply that lands after the promised date. Explicit
 * risk states — a line with no supply and a line that is merely late are
 * different problems.
 */
export default function JeopardyPage() {
  const [report, setReport] = useState<JeopardyReport | null>(null);
  const [horizon, setHorizon] = useState('30');
  const [error, setError] = useState<string | null>(null);

  async function load(days: string = horizon) {
    try {
      setReport(
        await api<JeopardyReport>(
          `/v1/reports/delivery-jeopardy?horizonDays=${encodeURIComponent(days || '30')}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Delivery dates in jeopardy" />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Field label="Horizon (days)">
            <Input
              type="number"
              min={1}
              max={365}
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              style={{ width: 110 }}
            />
          </Field>
          <Button variant="secondary" onClick={() => void load()}>
            <RefreshCw size={14} aria-hidden />
            Refresh
          </Button>
          {report && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {report.rows.length} at-risk line{report.rows.length === 1 ? '' : 's'} in the next{' '}
              {report.horizonDays} days
            </span>
          )}
        </div>
        {!report ? (
          <LoadingRows />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" data-testid="jeopardy-table">
              <thead>
                <tr>
                  <th>Promised</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Product</th>
                  <th className="num">Short</th>
                  <th>Risk</th>
                  <th>Inbound supply</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState>
                        Nothing at risk — every short line has supply arriving in time.
                      </EmptyState>
                    </td>
                  </tr>
                )}
                {report.rows.map((r) => (
                  <tr key={r.lineId}>
                    <td>{r.deliveryDate}</td>
                    <td>
                      <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td>{r.locationName ?? '—'}</td>
                    <td>
                      {r.productName}
                      {r.sku && (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> {r.sku}</span>
                      )}
                    </td>
                    <td className="num">{r.shortfall}</td>
                    <td>
                      {r.risk === 'no_supply' ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>No supply</span>
                      ) : (
                        <span style={{ color: 'var(--warning, #b45309)', fontWeight: 600 }}>
                          {r.daysLate}d late
                        </span>
                      )}
                    </td>
                    <td>
                      {r.supplyReference ? (
                        <>
                          {r.supplySource === 'po' ? 'PO ' : 'Transfer '}
                          {r.supplyReference}
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                            {' '}
                            → {r.supplyDate}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
