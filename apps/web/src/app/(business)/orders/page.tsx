'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PenLine, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { PageHeader, Input, Select, LinkButton, LoadingRows, EmptyState } from '@/components/ui';

/**
 * Orders list per PLAN-POS-OPERATIONS §8: a table (Order #, Customer,
 * Status, Delivery Date, Balance Due, Salesperson) whose rows open a
 * slide-over panel — the list keeps its scroll position — with a
 * full-page link for the complete order detail. Status wording comes
 * from the server's derived display status (Draft → Pending → On PO →
 * Reserved → Scheduled → Out for Delivery → Delivered, plus
 * Quote/Layaway/Cancelled), not the raw lifecycle status.
 */

interface ListRow {
  id: string;
  number: string;
  customerName: string;
  displayStatus: string;
  poNumber: string | null;
  deliveryDate: string | null;
  balanceDueCents: number;
  salespersonName: string | null;
  totalCents: number;
  createdAt: string;
  lineSummary: {
    units: number;
    reserved: number;
    fulfilled: number;
    specialOrder: number;
  } | null;
}

interface OrderDetail {
  id: string;
  number: string;
  status: string;
  fulfillmentType: string;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  paidCents: number;
  balanceDueCents: number;
  requestedDate: string | null;
  notes: string | null;
  createdAt: string;
  lines: {
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }[];
  payments: { id: string; amountCents: number; method: string; status: string }[];
}

const DISPLAY_TONES: Record<string, string> = {
  Draft: 'neutral',
  Pending: 'neutral',
  'On PO': 'info',
  Reserved: 'brand',
  Scheduled: 'info',
  'Out for Delivery': 'brand',
  Delivered: 'success',
  Quote: 'warning',
  Layaway: 'warning',
  Cancelled: 'danger',
};

function DisplayStatus({ row }: { row: ListRow }) {
  const tone = DISPLAY_TONES[row.displayStatus] ?? 'neutral';
  return (
    <span className={`badge badge-${tone}`}>
      {row.displayStatus}
      {row.poNumber ? ` (${row.poNumber})` : ''}
    </span>
  );
}

/** Raw lifecycle filters offered alongside free-text search. */
const STATUS_FILTERS = [
  ['', 'All statuses'],
  ['draft', 'Drafts'],
  ['quote', 'Quotes'],
  ['open', 'Open'],
  ['partially_fulfilled', 'Partially fulfilled'],
  ['fulfilled', 'Fulfilled'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
] as const;

export default function OrdersPage() {
  const [rows, setRows] = useState<ListRow[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [view, setView] = useState('');
  // Deep-linkable from the dashboard's "My orders" card (?mine=1).
  const [mine, setMine] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mine') === '1',
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<ListRow | null>(null);
  const searchSeq = useRef(0);

  const fetchPage = useCallback(
    async (
      query: string,
      statusFilter: string,
      viewFilter: string,
      onlyMine: boolean,
      cursor: string | null,
    ) => {
      const params = new URLSearchParams({ limit: '50' });
      if (query.trim()) params.set('q', query.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (viewFilter) params.set('view', viewFilter);
      if (onlyMine) params.set('mine', '1');
      if (cursor) params.set('cursor', cursor);
      return api<{ data: ListRow[]; nextCursor: string | null }>(
        `/v1/orders/list-view?${params.toString()}`,
      );
    },
    [],
  );

  // Debounced reload on search/filter change; a sequence counter drops
  // stale responses that resolve after a newer query's.
  useEffect(() => {
    const seq = ++searchSeq.current;
    const t = setTimeout(
      () => {
        fetchPage(q, status, view, mine, null)
          .then((page) => {
            if (searchSeq.current !== seq) return;
            setRows(page.data);
            setNextCursor(page.nextCursor);
            setError(null);
          })
          .catch((err) => {
            if (searchSeq.current !== seq) return;
            setError(err instanceof Error ? err.message : String(err));
          });
      },
      rows === null ? 0 : 250,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, view, mine, fetchPage]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(q, status, view, mine, nextCursor);
      setRows((prev) => [...(prev ?? []), ...page.data]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        actions={
          <LinkButton href="/orders/new" variant="primary">
            <PenLine size={14} aria-hidden />
            New Sale
          </LinkButton>
        }
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Input
          data-testid="orders-search"
          placeholder="Search order # or customer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <Select
          data-testid="orders-status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          {STATUS_FILTERS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <button
          className={`btn btn-sm ${view === 'past_due' ? 'btn-danger' : 'btn-secondary'}`}
          data-testid="past-due-chip"
          onClick={() => setView((v) => (v === 'past_due' ? '' : 'past_due'))}
        >
          Past due
        </button>
        <button
          className={`btn btn-sm ${mine ? 'btn-primary' : 'btn-secondary'}`}
          data-testid="mine-chip"
          onClick={() => setMine((v) => !v)}
        >
          My orders
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {!rows && !error && <LoadingRows rows={6} />}

      {rows && rows.length === 0 && <EmptyState>No orders match.</EmptyState>}

      {rows && rows.length > 0 && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" data-testid="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Delivery Date</th>
                <th style={{ textAlign: 'right' }}>Balance Due</th>
                <th>Salesperson</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  data-testid="order-row"
                  onClick={() => setSelected(r)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.number}</td>
                  <td>{r.customerName}</td>
                  <td>
                    <DisplayStatus row={r} />
                    {r.lineSummary && r.lineSummary.units > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {r.lineSummary.fulfilled > 0 && `${r.lineSummary.fulfilled} delivered · `}
                        {r.lineSummary.reserved} of {r.lineSummary.units} reserved
                        {r.lineSummary.specialOrder > 0 && ` · ${r.lineSummary.specialOrder} SO`}
                      </div>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.deliveryDate ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.balanceDueCents > 0 ? <Money cents={r.balanceDueCents} /> : '—'}
                  </td>
                  <td>{r.salespersonName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            className="btn"
            data-testid="orders-load-more"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {selected && <OrderSlideOver row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/**
 * Slide-over order summary (spec §8: "row click opens a slide-over panel
 * (list keeps its place) with a full-page option"). Read-only — edits
 * happen on the full page.
 */
function OrderSlideOver({ row, onClose }: { row: ListRow; onClose: () => void }) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    setDetail(null);
    setError(null);
    api<OrderDetail>(`/v1/orders/${row.id}`)
      .then((d) => {
        if (!stale) setDetail(d);
      })
      .catch((err) => {
        if (!stale) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      stale = true;
    };
  }, [row.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${row.number}`}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }}
      />
      <div
        data-testid="order-slide-over"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 92vw)',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{row.number}</h2>
          <DisplayStatus row={row} />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="btn"
            style={{ marginLeft: 'auto', padding: '4px 8px' }}
          >
            <X size={14} aria-hidden />
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          {row.customerName}
          {row.salespersonName ? ` · ${row.salespersonName}` : ''}
          {row.deliveryDate ? ` · delivers ${row.deliveryDate}` : ''}
        </p>

        <LinkButton
          href={`/orders/${row.id}`}
          variant="primary"
          data-testid="slide-over-full-page"
          style={{ marginBottom: 16 }}
        >
          Open full page
        </LinkButton>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        {!detail && !error && <LoadingRows rows={3} />}

        {detail && (
          <>
            <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lines
            </h3>
            <table className="table" style={{ fontSize: 13 }}>
              <tbody>
                {detail.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.description}
                      {l.quantity !== 1 && (
                        <span style={{ color: 'var(--text-muted)' }}> ×{l.quantity}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Money cents={l.totalCents} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ fontSize: 13, marginTop: 12 }}>
              <SummaryRow label="Subtotal" cents={detail.subtotalCents} />
              {detail.discountCents > 0 && (
                <SummaryRow label="Discount" cents={-detail.discountCents} />
              )}
              <SummaryRow label="Tax" cents={detail.taxCents} />
              <SummaryRow label="Total" cents={detail.totalCents} bold />
              <SummaryRow label="Paid" cents={detail.paidCents} />
              <SummaryRow label="Balance due" cents={detail.balanceDueCents} bold />
            </div>

            {detail.payments.length > 0 && (
              <>
                <h3
                  style={{
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginTop: 16,
                  }}
                >
                  Payments
                </h3>
                <ul style={{ fontSize: 13, paddingLeft: 16, margin: 0 }}>
                  {detail.payments.map((p) => (
                    <li key={p.id}>
                      <Money cents={p.amountCents} /> — {p.method.replace(/_/g, ' ')} ({p.status})
                    </li>
                  ))}
                </ul>
              </>
            )}

            {detail.notes && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
                {detail.notes}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, cents, bold }: { label: string; cents: number; bold?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: bold ? 700 : 400,
        padding: '2px 0',
      }}
    >
      <span>{label}</span>
      <Money cents={cents} />
    </div>
  );
}
