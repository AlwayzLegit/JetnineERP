'use client';

import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, EmptyState, Field, Input, LoadingRows, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

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

function defaultRange(): { start: string; end: string } {
  const end = new Date().toISOString().slice(0, 10);
  const s = new Date();
  s.setUTCDate(s.getUTCDate() - 29);
  return { start: s.toISOString().slice(0, 10), end };
}

/**
 * Salesperson activity (Sales Views Phase 4): one grid of written
 * activity per salesperson over the window, with a drill-in listing the
 * person's orders and POS sales. Store data scope applies server-side.
 */
export default function SalespeoplePage() {
  const [{ start: s0, end: e0 }] = useState(defaultRange);
  const [start, setStart] = useState(s0);
  const [end, setEnd] = useState(e0);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [picked, setPicked] = useState<SummaryRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [sales, setSales] = useState<SaleRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setSummary(
        await api<SalesSummary>(
          `/v1/reports/sales/summary?basis=written&groupBy=salesperson&start=${start}&end=${end}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    api<MemberRow[]>('/v1/business/members')
      .then(setMembers)
      .catch(() => setMembers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function drill(row: SummaryRow) {
    setPicked(row);
    setOrders(null);
    setSales(null);
    // The summary keys salespeople by user id; orders filter by
    // membership id — resolve through the member list.
    const member = members.find((m) => m.userId === row.key);
    try {
      const [o, sl] = await Promise.all([
        member
          ? api<{ data: OrderRow[] }>(
              `/v1/orders?limit=100&salespersonMembershipId=${member.membershipId}`,
            )
          : Promise.resolve({ data: [] as OrderRow[] }),
        row.key
          ? api<{ data: SaleRow[] }>(`/v1/sales?limit=100&associateUserId=${row.key}`)
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
      <PageHeader title="Salespeople" />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Field label="Start">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="End">
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Button variant="secondary" onClick={() => void load()}>
            <RefreshCw size={14} aria-hidden />
            Run
          </Button>
        </div>
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
                    <td>
                      <Button size="sm" variant="ghost" onClick={() => void drill(r)}>
                        Documents
                      </Button>
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
