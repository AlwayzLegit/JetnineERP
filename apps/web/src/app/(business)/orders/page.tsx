'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PenLine, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import {
  PageHeader,
  Input,
  Select,
  LinkButton,
  LoadingRows,
  EmptyState,
  DisplayStatusBadge,
} from '@/components/ui';

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
  creditDueCents: number;
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

function DisplayStatus({ row }: { row: ListRow }) {
  return <DisplayStatusBadge displayStatus={row.displayStatus} poNumber={row.poNumber} />;
}

/**
 * P-013 (BA-0017): the filter speaks the same display vocabulary the
 * badges show — every option is a badge you can see, and every badge
 * is an option you can pick.
 */
const STATUS_FILTERS = [
  ['', 'All statuses'],
  ['Draft', 'Draft'],
  ['Quote', 'Quote'],
  ['Pending', 'Pending'],
  ['On PO', 'On PO'],
  ['Reserved', 'Reserved'],
  ['Scheduled', 'Scheduled'],
  ['Out for Delivery', 'Out for Delivery'],
  ['Delivered', 'Delivered'],
  ['Layaway', 'Layaway'],
  ['Awaiting Return Pickup', 'Awaiting Return Pickup'],
  ['Returned', 'Returned'],
  ['Exchanged', 'Exchanged'],
  ['Cancelled', 'Cancelled'],
] as const;

export default function OrdersPage() {
  const [rows, setRows] = useState<ListRow[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // BA-0024: search, filters and sort live in the URL — the view
  // survives reload and can be bookmarked or sent to someone.
  const initial =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const [q, setQ] = useState(initial.get('q') ?? '');
  const [status, setStatus] = useState(initial.get('display') ?? '');
  const [view, setView] = useState(initial.get('view') ?? '');
  const [sort, setSort] = useState(initial.get('sort') ?? '');
  const [dir, setDir] = useState(initial.get('dir') === 'desc' ? 'desc' : 'asc');
  // Deep-linkable from the dashboard's "My orders" card (?mine=1).
  const [mine, setMine] = useState(() => initial.get('mine') === '1');
  const router = useRouter();
  const pathname = usePathname();
  // The store chosen at login: a member working a store sees that
  // store's orders by default (chip is clearable — data scope permits
  // more).
  const [loginStore] = useState<{ id: string; name: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('jetnine.sellingStore');
      return raw ? (JSON.parse(raw) as { id: string; name: string }) : null;
    } catch {
      return null;
    }
  });
  const [atLoginStore, setAtLoginStore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<ListRow | null>(null);
  const searchSeq = useRef(0);

  const fetchPage = useCallback(
    async (
      query: string,
      statusFilter: string,
      viewFilter: string,
      onlyMine: boolean,
      locationFilter: string | null,
      cursor: string | null,
      sortBy: string,
      sortDir: string,
    ) => {
      const params = new URLSearchParams({ limit: '50' });
      if (query.trim()) params.set('q', query.trim());
      if (statusFilter) params.set('display', statusFilter);
      if (viewFilter) params.set('view', viewFilter);
      if (onlyMine) params.set('mine', '1');
      if (sortBy) {
        params.set('sort', sortBy);
        params.set('dir', sortDir);
      }
      if (locationFilter) params.set('locationId', locationFilter);
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
    // Mirror the view state into the URL (replace — no history spam).
    const urlParams = new URLSearchParams();
    if (q.trim()) urlParams.set('q', q.trim());
    if (status) urlParams.set('display', status);
    if (view) urlParams.set('view', view);
    if (mine) urlParams.set('mine', '1');
    if (sort) {
      urlParams.set('sort', sort);
      urlParams.set('dir', dir);
    }
    const qs = urlParams.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    const t = setTimeout(
      () => {
        fetchPage(
          q,
          status,
          view,
          mine,
          loginStore && atLoginStore ? loginStore.id : null,
          null,
          sort,
          dir,
        )
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
  }, [q, status, view, mine, atLoginStore, loginStore, sort, dir, fetchPage]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await fetchPage(
        q,
        status,
        view,
        mine,
        loginStore && atLoginStore ? loginStore.id : null,
        nextCursor,
        sort,
        dir,
      );
      setRows((prev) => [...(prev ?? []), ...page.data]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleSort(id: string) {
    if (sort === id) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(id);
      setDir(id === 'balanceDue' || id === 'deliveryDate' ? 'desc' : 'asc');
    }
    setRows(null);
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
        {loginStore && (
          <button
            className={`btn btn-sm ${atLoginStore ? 'btn-primary' : 'btn-secondary'}`}
            data-testid="login-store-chip"
            title="Orders at the store you logged into — click to see every store"
            onClick={() => setAtLoginStore((v) => !v)}
          >
            At {loginStore.name}
          </button>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {!rows && !error && <LoadingRows rows={6} />}

      {rows && rows.length === 0 && (
        <EmptyState>
          {(() => {
            const active = [
              q.trim() && `search “${q.trim()}”`,
              status && `status ${STATUS_FILTERS.find(([v]) => v === status)?.[1] ?? status}`,
              view === 'past_due' && 'past due',
              mine && 'my orders',
              loginStore && atLoginStore && `at ${loginStore.name}`,
            ].filter(Boolean);
            return active.length > 0
              ? `No orders match ${active.join(' + ')}.`
              : 'No orders yet — write the first one with New Sale.';
          })()}
          {(q.trim() || status || view || mine) && (
            <div style={{ marginTop: 8 }}>
              <button
                className="btn btn-sm btn-secondary"
                data-testid="clear-filters"
                onClick={() => {
                  setQ('');
                  setStatus('');
                  setView('');
                  setMine(false);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </EmptyState>
      )}

      {rows && rows.length > 0 && (
        <div
          className="card"
          style={{ padding: 0, overflow: 'auto', maxHeight: 'calc(100vh - 210px)' }}
        >
          <table className="table table-dense table-sticky" data-testid="orders-table">
            <thead>
              <tr>
                <SortTh id="number" label="Order #" sort={sort} dir={dir} onSort={toggleSort} />
                <SortTh id="customer" label="Customer" sort={sort} dir={dir} onSort={toggleSort} />
                <th>Status</th>
                <SortTh
                  id="deliveryDate"
                  label="Delivery Date"
                  sort={sort}
                  dir={dir}
                  onSort={toggleSort}
                />
                <SortTh
                  id="balanceDue"
                  label="Balance Due"
                  sort={sort}
                  dir={dir}
                  onSort={toggleSort}
                  align="right"
                />
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
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <DisplayStatus row={r} />
                    {r.lineSummary && r.lineSummary.units > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                        {r.lineSummary.fulfilled > 0 && `${r.lineSummary.fulfilled} delivered · `}
                        {r.lineSummary.reserved} of {r.lineSummary.units} reserved
                        {r.lineSummary.specialOrder > 0 && ` · ${r.lineSummary.specialOrder} SO`}
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.deliveryDate ?? '—'}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {r.displayStatus === 'Cancelled' ? (
                      // BA-0016: a cancelled order owes nothing — showing
                      // its old balance made it read as a receivable.
                      '—'
                    ) : r.balanceDueCents > 0 ? (
                      <Money cents={r.balanceDueCents} />
                    ) : (r.creditDueCents ?? 0) > 0 ? (
                      <span style={{ color: 'var(--danger)' }}>
                        Credit <Money cents={r.creditDueCents} />
                      </span>
                    ) : (
                      '—'
                    )}
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

/** P-014: clickable, aria-sorted column header. */
function SortTh({
  id,
  label,
  sort,
  dir,
  onSort,
  align,
}: {
  id: string;
  label: string;
  sort: string;
  dir: string;
  onSort: (id: string) => void;
  align?: 'right';
}) {
  const active = sort === id;
  return (
    <th
      aria-sort={active ? (dir === 'desc' ? 'descending' : 'ascending') : undefined}
      style={align === 'right' ? { textAlign: 'right' } : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(id)}
        data-testid={`sort-${id}`}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          font: 'inherit',
          color: 'inherit',
          textTransform: 'inherit',
          letterSpacing: 'inherit',
          padding: 0,
        }}
      >
        {label}
        {active ? (dir === 'desc' ? ' ▼' : ' ▲') : ''}
      </button>
    </th>
  );
}
