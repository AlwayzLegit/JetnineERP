'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { formatMoney, parseMoneyToCents } from '@jetnine/shared';
import { Button, Card, EmptyState, Input, LoadingRows, PageHeader } from '@/components/ui';

interface PricingRow {
  id: string;
  sku: string | null;
  name: string | null;
  productId: string;
  productName: string;
  priceCents: number;
  costCents: number | null;
  vendorSku: string | null;
}

interface PricingPage {
  data: PricingRow[];
  nextCursor: string | null;
  unpricedCount: number;
}

const PAGE_LIMIT = 100;
const MAX_BATCH = 200;

export default function PricingPage() {
  const [rows, setRows] = useState<PricingRow[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unpricedCount, setUnpricedCount] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [unpricedOnly, setUnpricedOnly] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildQuery = useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_LIMIT));
      if (unpricedOnly) params.set('unpricedOnly', '1');
      if (q.trim()) params.set('q', q.trim());
      if (cursor) params.set('cursor', cursor);
      return `/v1/products/variants/pricing?${params.toString()}`;
    },
    [q, unpricedOnly],
  );

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    try {
      const res = await api<PricingPage>(buildQuery());
      setRows(res.data);
      setNextCursor(res.nextCursor);
      setUnpricedCount(res.unpricedCount);
      setDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    }
  }, [buildQuery]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unpricedOnly]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await api<PricingPage>(buildQuery(nextCursor));
      setRows((prev) => [...(prev ?? []), ...res.data]);
      setNextCursor(res.nextCursor);
      setUnpricedCount(res.unpricedCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void load();
  }

  // A row is dirty when its draft parses to a valid amount different from
  // the stored price. Invalid drafts (typos) are tracked separately so the
  // save button can refuse instead of silently skipping them.
  const { dirty, invalid } = useMemo(() => {
    const dirtyList: { id: string; priceCents: number }[] = [];
    const invalidIds: string[] = [];
    for (const row of rows ?? []) {
      const draft = drafts[row.id];
      if (draft === undefined || draft.trim() === '') continue;
      const cents = parseMoneyToCents(draft);
      if (cents === null || cents < 0) {
        invalidIds.push(row.id);
      } else if (cents !== row.priceCents) {
        dirtyList.push({ id: row.id, priceCents: cents });
      }
    }
    return { dirty: dirtyList, invalid: invalidIds };
  }, [rows, drafts]);

  async function save() {
    if (dirty.length === 0) return;
    if (invalid.length > 0) {
      toast.error(`${invalid.length} price(s) are not valid amounts — fix them first`);
      return;
    }
    setSaving(true);
    try {
      let saved = 0;
      for (let i = 0; i < dirty.length; i += MAX_BATCH) {
        const batch = dirty.slice(i, i + MAX_BATCH);
        const res = await api<{ updated: number; unchanged: number }>(
          '/v1/products/variants/bulk-price',
          { method: 'POST', body: JSON.stringify({ updates: batch }) },
        );
        saved += res.updated;
      }
      toast.success(`Saved ${saved} price${saved === 1 ? '' : 's'}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  const showCost = (rows ?? []).some((r) => r.costCents !== null);

  return (
    <div>
      <PageHeader
        title="Price entry"
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => void save()}
            disabled={saving || dirty.length === 0}
          >
            {saving
              ? 'Saving…'
              : `Save ${dirty.length > 0 ? dirty.length : ''} price${dirty.length === 1 ? '' : 's'}`}
          </Button>
        }
      />

      <p style={{ marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>
        {unpricedCount === null
          ? 'Loading…'
          : unpricedCount === 0
            ? 'Every active variant has a price.'
            : `${unpricedCount.toLocaleString()} active variant${unpricedCount === 1 ? '' : 's'} still without a price.`}{' '}
        Type prices in the column and save — only changed rows are written.
      </p>

      <form onSubmit={search} className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          placeholder="Search by name, SKU, or barcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={unpricedOnly}
            onChange={(e) => setUnpricedOnly(e.target.checked)}
          />
          Unpriced only
        </label>
      </form>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card style={{ padding: 0 }}>
        {rows == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>
            {unpricedOnly
              ? 'No unpriced variants match. Uncheck "Unpriced only" to edit existing prices.'
              : 'No variants match.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  {showCost && <th style={{ textAlign: 'right' }}>Cost</th>}
                  <th style={{ textAlign: 'right' }}>Current price</th>
                  <th style={{ width: 140 }}>New price ($)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const draft = drafts[row.id] ?? '';
                  const cents = draft.trim() === '' ? null : parseMoneyToCents(draft);
                  const isInvalid = draft.trim() !== '' && (cents === null || cents < 0);
                  return (
                    <tr key={row.id}>
                      <td>
                        <code>{row.sku ?? '—'}</code>
                      </td>
                      <td>
                        <Link href={`/products/${row.productId}`}>
                          <strong>{row.productName}</strong>
                        </Link>
                        {row.name ? (
                          <span style={{ color: 'var(--text-muted)' }}> · {row.name}</span>
                        ) : null}
                      </td>
                      {showCost && (
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {row.costCents === null ? '—' : formatMoney(row.costCents)}
                        </td>
                      )}
                      <td style={{ textAlign: 'right' }}>
                        {row.priceCents === 0 ? (
                          <span className="badge badge-warning">$0.00</span>
                        ) : (
                          formatMoney(row.priceCents)
                        )}
                      </td>
                      <td>
                        <Input
                          value={draft}
                          inputMode="decimal"
                          placeholder="0.00"
                          aria-label={`New price for ${row.sku ?? row.productName}`}
                          aria-invalid={isInvalid || undefined}
                          style={isInvalid ? { borderColor: 'var(--danger)' } : undefined}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
