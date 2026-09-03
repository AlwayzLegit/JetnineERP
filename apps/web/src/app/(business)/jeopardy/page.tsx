'use client';

import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Stack,
  TableEmpty,
  TableWrap,
  Toolbar,
} from '@/components/ui';
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
  salespersonMembershipId: string | null;
  salespersonName: string | null;
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
  const [refreshing, setRefreshing] = useState(false);

  async function load(days: string = horizon) {
    setRefreshing(true);
    try {
      setReport(
        await api<JeopardyReport>(
          `/v1/reports/delivery-jeopardy?horizonDays=${encodeURIComponent(days || '30')}`,
        ),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Delivery dates in jeopardy"
        sub="Open order lines with no inbound supply, or supply that lands after the promised date — grouped by salesperson for callbacks."
      />
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            <Toolbar
              end={
                report && (
                  <span className="muted">
                    {report.rows.length} at-risk line{report.rows.length === 1 ? '' : 's'} in the
                    next {report.horizonDays} days
                  </span>
                )
              }
            >
              <Field label="Horizon (days)" className="w-28">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                />
              </Field>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="self-end"
                disabled={refreshing}
                aria-busy={refreshing}
              >
                <RefreshCw size={14} aria-hidden />
                Refresh
              </Button>
            </Toolbar>
          </form>
          {!report ? (
            <LoadingRows />
          ) : (
            <TableWrap>
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
                    <TableEmpty colSpan={8}>
                      Nothing at risk — every short line has supply arriving in time.
                    </TableEmpty>
                  )}
                  {groupBySalesperson(report.rows).map((group) => (
                    <SalespersonGroup key={group.key} group={group} />
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </Stack>
    </div>
  );
}

interface SpGroup {
  key: string;
  name: string;
  rows: JeopardyRow[];
}

/**
 * The call list is worked BY SALESPERSON (owner ask 2026-08-29): each
 * seller's at-risk orders sit together under their name so the callbacks
 * can be divided up; unassigned orders group last under "No salesperson".
 */
function groupBySalesperson(rows: JeopardyRow[]): SpGroup[] {
  const by = new Map<string, SpGroup>();
  for (const r of rows) {
    const key = r.salespersonMembershipId ?? '—';
    const cur = by.get(key) ?? {
      key,
      name: r.salespersonName ?? 'No salesperson',
      rows: [],
    };
    cur.rows.push(r);
    by.set(key, cur);
  }
  return [...by.values()].sort((a, b) => {
    if (a.key === '—') return 1;
    if (b.key === '—') return -1;
    return a.name.localeCompare(b.name);
  });
}

function SalespersonGroup({ group }: { group: SpGroup }) {
  return (
    <>
      {/* A row-group header: `th` inside tbody picks up the table's own
          uppercase muted header styling, so no inline colours are needed. */}
      <tr data-testid="jeopardy-salesperson">
        <th scope="rowgroup" colSpan={8}>
          {group.name} · {group.rows.length} at-risk line{group.rows.length === 1 ? '' : 's'}
        </th>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.lineId}>
          <td className="nowrap">{r.deliveryDate}</td>
          <td>
            <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
          </td>
          <td>{r.customerName ?? '—'}</td>
          <td>{r.locationName ?? '—'}</td>
          <td>
            {r.productName}
            {r.sku && <span className="muted"> {r.sku}</span>}
          </td>
          <td className="num">{r.shortfall}</td>
          <td>
            {r.risk === 'no_supply' ? (
              <span className="badge badge-danger">No supply</span>
            ) : (
              <span className="badge badge-warning">{r.daysLate}d late</span>
            )}
          </td>
          <td>
            {r.supplyReference ? (
              <>
                {r.supplySource === 'po' ? 'PO ' : 'Transfer '}
                {r.supplyReference}
                <span className="muted"> → {r.supplyDate}</span>
              </>
            ) : (
              '—'
            )}
          </td>
        </tr>
      ))}
    </>
  );
}
