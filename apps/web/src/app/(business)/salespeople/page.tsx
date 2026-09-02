'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, LinkButton, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';

interface SummaryRow {
  key: string;
  label: string;
  documentCount: number;
  merchandiseCents: number;
  totalCents: number;
}

interface SalesSummary {
  rows: SummaryRow[];
  totals: { documentCount: number; totalCents: number };
}

interface OrderRow {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  createdAt: string;
}

interface SaleRow {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  createdAt: string;
}

interface MemberRow {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
}

/**
 * Salesperson activity (Sales Views Phase 4): one grid of written
 * activity per salesperson over the window, with a drill-in listing the
 * person's orders and POS sales. Store data scope applies server-side.
 */
export default function SalespeoplePage() {
  // Window lives in the URL (`?range=last30` / `?start&end`) so the view can
  // be bookmarked; the report and the drill-in share it.
  const [range, setRange, ready] = useUrlDateRange('last30');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [picked, setPicked] = useState<SummaryRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [sales, setSales] = useState<SaleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<MemberRow[]>('/v1/business/members')
      .then(setMembers)
      .catch(() => setMembers([]));
  }, []);

  // Refetch whenever the window changes (once the URL has been read). A
  // drill-in from the previous window would no longer match the table, so
  // it closes here and the user re-opens it against the new window.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setPicked(null);
    setOrders(null);
    setSales(null);
    api<SalesSummary>(
      `/v1/reports/sales/summary?basis=written&groupBy=salesperson&start=${range.start}&end=${range.end}`,
    )
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [ready, range.start, range.end]);

  async function drill(row: SummaryRow) {
    setPicked(row);
    setOrders(null);
    setSales(null);
    // The summary keys salespeople by user id; orders filter by
    // membership id — resolve through the member list.
    const member = members.find((m) => m.userId === row.key);
    // Same window as the table so the documents listed add up to the row.
    const windowQs = `start=${range.start}&end=${range.end}`;
    try {
      const [o, sl] = await Promise.all([
        member
          ? api<{ data: OrderRow[] }>(
              `/v1/orders?limit=100&salespersonMembershipId=${member.membershipId}&${windowQs}`,
            )
          : Promise.resolve({ data: [] as OrderRow[] }),
        row.key
          ? api<{ data: SaleRow[] }>(`/v1/sales?limit=100&associateUserId=${row.key}&${windowQs}`)
          : Promise.resolve({ data: [] as SaleRow[] }),
      ]);
      setOrders(o.data);
      setSales(sl.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Salespeople"
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} testid="salespeople-range" />
            <LinkButton href="/salespeople/activity" data-testid="salespeople-activity-link">
              View salesperson activity
            </LinkButton>
          </>
        }
      />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card>
        {!summary ? (
          <LoadingRows />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" data-testid="salespeople-table">
              <thead>
                <tr>
                  <th>Salesperson</th>
                  <th className="num">Documents</th>
                  <th className="num">Merchandise</th>
                  <th className="num">Total written</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {summary.rows.length === 0 && <Empty colSpan={5} />}
                {summary.rows.map((r) => (
                  <tr key={r.key || '(none)'}>
                    <td>{r.label}</td>
                    <td className="num">{r.documentCount}</td>
                    <td className="num">
                      <Money cents={r.merchandiseCents} />
                    </td>
                    <td className="num">
                      <Money cents={r.totalCents} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Button size="sm" variant="ghost" onClick={() => void drill(r)}>
                        Documents
                      </Button>
                      {(() => {
                        const member = members.find((m) => m.userId === r.key);
                        return member ? (
                          <Link
                            href={`/salespeople/${member.membershipId}/activity`}
                            style={{ marginLeft: 8, fontSize: 13 }}
                            data-testid="salesperson-activity"
                          >
                            View activity
                          </Link>
                        ) : null;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {picked && (
        <Card title={`Documents — ${picked.label}`} style={{ marginTop: 16 }}>
          {!orders || !sales ? (
            <LoadingRows />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>Orders</h3>
                <table className="table">
                  <tbody>
                    {orders.length === 0 && <Empty colSpan={3} />}
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link href={`/orders/${o.id}`}>{o.number}</Link>
                        </td>
                        <td>{o.status}</td>
                        <td className="num">
                          <Money cents={o.totalCents} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 style={{ fontSize: 13, margin: '0 0 6px' }}>POS sales</h3>
                <table className="table">
                  <tbody>
                    {sales.length === 0 && <Empty colSpan={3} />}
                    {sales.map((sl) => (
                      <tr key={sl.id}>
                        <td>{sl.number}</td>
                        <td>{sl.status}</td>
                        <td className="num">
                          <Money cents={sl.totalCents} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Empty({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState>Nothing in this window.</EmptyState>
      </td>
    </tr>
  );
}
