'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import { api } from '@/lib/api';
import {
  formatRange,
  presetLabel,
  rangeFor,
  rangeFromSearch,
  rangeToSearch,
  type DateRange,
} from '@/lib/date-range';
import { DateRangePicker } from '@/components/date-range-picker';
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
 * Status, Delivery Date, Balance Due, Salesperson) whose rows open the
 * full order page directly (owner 2026-09-02: no slide-over — one click
 * lands on the order). Status wording comes
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
  // Created-date window (owner 2026-09-02). Rides the same URL sync as
  // the other filters (`?range=` or `?start=&end=`); "All time" writes
  // nothing and sends nothing.
  const [range, setRange] = useState<DateRange>(() => rangeFromSearch(initial, 'all'));
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
      dateRange: DateRange,
    ) => {
      const params = new URLSearchParams({ limit: '50' });
      if (query.trim()) params.set('q', query.trim());
      if (statusFilter) params.set('display', statusFilter);
      if (viewFilter) params.set('view', viewFilter);
      if (onlyMine) params.set('mine', '1');
      if (dateRange.preset !== 'all') {
        params.set('start', dateRange.start);
        params.set('end', dateRange.end);
      }
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
    if (range.preset !== 'all') rangeToSearch(range, urlParams);
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
          range,
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
  }, [q, status, view, mine, atLoginStore, loginStore, sort, dir, range, fetchPage]);

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
        range,
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
        <DateRangePicker
          allowAllTime
          align="left"
          value={range}
          onChange={(next) => {
            setRange(next);
            setRows(null);
          }}
          testid="orders-range"
        />
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
              range.preset !== 'all' &&
                (presetLabel(range.preset) === 'Custom'
                  ? formatRange(range)
                  : presetLabel(range.preset).toLowerCase()),
              loginStore && atLoginStore && `at ${loginStore.name}`,
            ].filter(Boolean);
            return active.length > 0
              ? `No orders match ${active.join(' + ')}.`
              : 'No orders yet — write the first one with New Sale.';
          })()}
          {(q.trim() || status || view || mine || range.preset !== 'all') && (
            <div style={{ marginTop: 8 }}>
              <button
                className="btn btn-sm btn-secondary"
                data-testid="clear-filters"
                onClick={() => {
                  setQ('');
                  setStatus('');
                  setView('');
                  setMine(false);
                  setRange(rangeFor('all'));
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
                  onClick={() => router.push(`/orders/${r.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    <Link
                      href={`/orders/${r.id}`}
                      data-testid="order-number-link"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {r.number}
                    </Link>
                  </td>
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
