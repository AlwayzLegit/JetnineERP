'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { Button, EmptyState, Input, LoadingRows, PageHeader, StatusBadge } from '@/components/ui';

interface SaleRow {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  customerId: string | null;
  customerName: string | null;
  associateUserId: string | null;
  locationId: string;
  completedAt: string | null;
  createdAt: string;
}

interface SalesPageData {
  data: SaleRow[];
  nextCursor: string | null;
}

const PAGE_LIMIT = 50;

export default function SalesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SaleRow[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback((query: string, cursor?: string | null) => {
    const params = new URLSearchParams();
    params.set('limit', String(PAGE_LIMIT));
    if (query.trim()) params.set('q', query.trim());
    if (cursor) params.set('cursor', cursor);
    return `/v1/sales?${params.toString()}`;
  }, []);

  const load = useCallback(
    async (query: string) => {
      setError(null);
      setRows(null);
      try {
        const res = await api<SalesPageData>(buildUrl(query));
        setRows(res.data);
        setNextCursor(res.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setRows([]);
      }
    },
    [buildUrl],
  );

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await api<SalesPageData>(buildUrl(q, nextCursor));
      setRows((prev) => [...(prev ?? []), ...res.data]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void load(q);
  }

  return (
    <div>
      {/* P-018: no duplicate "Open register" — the global top bar has it. */}
      <PageHeader title="Sales" />

      <form onSubmit={search} className="mb-4 flex flex-wrap gap-2">
        {/* autoFocus is scanner-friendly: a scanned receipt barcode types
            the number + Enter and finds the sale without the mouse. */}
        <Input
          autoFocus
          name="q"
          placeholder="Invoice # (scan a receipt) or customer name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[240px] flex-1"
        />
        <Button type="submit" variant="primary">
          Search
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setQ('');
            void load('');
          }}
        >
          Clear
        </Button>
      </form>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <div className="card">
          <LoadingRows rows={5} />
        </div>
      )}
      {rows && (
        <div className="card">
          {rows.length === 0 ? (
            <EmptyState>
              {q.trim()
                ? `No sales match "${q.trim()}".`
                : 'No sales yet. Ring one up at the register to see it here.'}
            </EmptyState>
          ) : (
            <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
              <table className="table table-dense table-sticky">
                <thead>
                  <tr>
                    <th>Sale</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="num">Total</th>
                    <th>Date</th>
                    <th>&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/sales/${s.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <code>{s.number}</code>
                      </td>
                      <td>
                        {s.customerName ??
                          (s.customerId ? (
                            '—'
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>
                          ))}
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="num">
                        <Money cents={s.totalCents} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(s.completedAt ?? s.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        {new Date(s.completedAt ?? s.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <Link href={`/sales/${s.id}`}>Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {nextCursor && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
