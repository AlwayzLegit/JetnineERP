'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useDashboardFilters } from '@/lib/dashboard-filters';
import {
  CardHandle,
  EmptyRow,
  ShimmerRows,
  StatusPill,
  orderStatusMeta,
  shortDay,
  usdWhole,
} from './owner-kit';

/**
 * The owner home's orders table (design 2026-09-04): saved views, filter
 * chips with counts, a search box, column toggles, sortable headers,
 * bulk selection with CSV export, and page controls. Rows come from
 * /v1/dashboard/owner/orders for the topbar's period + store scope.
 */
export interface OwnerOrderRow {
  id: string;
  number: string;
  status: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  locationId: string;
  storeName: string | null;
  fulfillmentType: string;
  promised: string | null;
  promisedLate: boolean;
  totalCents: number;
  balanceCents: number;
  rep: string | null;
  shortUnits: number;
  ageDays: number;
  createdAt: string;
}

interface Page {
  rows: OwnerOrderRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: { all: number; open: number; pending: number; late: number };
}

type Filter = 'all' | 'open' | 'pending' | 'late';
type SortKey =
  | 'number'
  | 'customer'
  | 'store'
  | 'status'
  | 'promised'
  | 'total'
  | 'balance'
  | 'rep'
  | 'next'
  | 'age'
  | 'fulfillment';

interface ViewState {
  filter: Filter;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  hidden: Partial<Record<SortKey, boolean>>;
}
interface SavedView {
  name: string;
  desc: string;
  apply: ViewState;
}

const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'number', label: 'Order' },
  { key: 'customer', label: 'Customer' },
  { key: 'store', label: 'Store' },
  { key: 'status', label: 'Status' },
  { key: 'promised', label: 'Promised' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'balance', label: 'Balance', align: 'right' },
  { key: 'rep', label: 'Rep' },
  { key: 'next', label: 'Next action' },
  { key: 'age', label: 'Age', align: 'right' },
  { key: 'fulfillment', label: 'Fulfillment' },
];

const BUILTIN_VIEWS: SavedView[] = [
  {
    name: 'Default',
    desc: 'all, newest first',
    apply: {
      filter: 'all',
      sortKey: 'age',
      sortDir: 'asc',
      hidden: { age: true, fulfillment: true },
    },
  },
  {
    name: 'Past promise',
    desc: 'late, oldest first',
    apply: {
      filter: 'late',
      sortKey: 'promised',
      sortDir: 'asc',
      hidden: { age: true, next: true },
    },
  },
  {
    name: 'Unpaid balances',
    desc: 'biggest first',
    apply: {
      filter: 'open',
      sortKey: 'balance',
      sortDir: 'desc',
      hidden: { age: true, fulfillment: true, next: true },
    },
  },
  {
    name: 'Aging carts',
    desc: 'drafts & quotes',
    apply: {
      filter: 'pending',
      sortKey: 'age',
      sortDir: 'desc',
      hidden: { promised: true, balance: true, fulfillment: true },
    },
  },
];

const VIEWS_KEY = 'jetnine.dashboard.orderViews';

function nextAction(o: OwnerOrderRow): string {
  if (o.shortUnits > 0) return `${o.shortUnits} unit${o.shortUnits > 1 ? 's' : ''} short`;
  if (o.status === 'draft' || o.status === 'quote') return 'Confirm the sale';
  if (o.status === 'open') return o.balanceCents > 0 ? 'Collect & schedule' : 'Schedule delivery';
  return '—';
}

function csvOf(rows: OwnerOrderRow[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = [
    'Order',
    'Customer',
    'Phone',
    'Store',
    'Status',
    'Promised',
    'Total',
    'Balance',
    'Salesperson',
    'Fulfillment',
    'Age (days)',
  ];
  const body = rows.map((o) =>
    [
      o.number,
      o.customerName,
      o.customerPhone,
      o.storeName,
      o.status,
      o.promised,
      (o.totalCents / 100).toFixed(2),
      (o.balanceCents / 100).toFixed(2),
      o.rep,
      o.fulfillmentType,
      o.ageDays,
    ]
      .map(esc)
      .join(','),
  );
  return [head.map(esc).join(','), ...body].join('\n');
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function OrdersTable({
  onOpen,
  handle,
  onNewSale,
}: {
  onOpen: (id: string) => void;
  handle?: React.ReactNode;
  onNewSale: () => void;
}) {
  const f = useDashboardFilters();
  const [view, setView] = useState<ViewState>(BUILTIN_VIEWS[0]!.apply);
  const [viewName, setViewName] = useState('Default');
  const [saved, setSaved] = useState<SavedView[]>([]);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [checked, setChecked] = useState<Record<string, OwnerOrderRow>>({});
  const [viewsOpen, setViewsOpen] = useState(false);
  const [colsOpen, setColsOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const reqId = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEWS_KEY);
      if (raw) setSaved(JSON.parse(raw) as SavedView[]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const h = window.setTimeout(() => setDebouncedQ(q.trim()), 200);
    return () => window.clearTimeout(h);
  }, [q]);

  const load = useCallback(() => {
    if (!f.rangeReady) return;
    const id = ++reqId.current;
    setLoading(true);
    const params = new URLSearchParams(f.query);
    params.set('filter', view.filter);
    params.set('sort', view.sortKey === 'next' ? 'status' : view.sortKey);
    params.set('dir', view.sortDir);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (debouncedQ) params.set('q', debouncedQ);
    void api<Page>(`/v1/dashboard/owner/orders?${params.toString()}`)
      .then((p) => {
        if (id !== reqId.current) return;
        setData(p);
        setFailed(false);
        if (p.page !== page) setPage(p.page);
      })
      .catch(() => {
        if (id !== reqId.current) return;
        setFailed(true);
        setData(null);
      })
      .finally(() => id === reqId.current && setLoading(false));
  }, [f.query, f.rangeReady, view, page, pageSize, debouncedQ]);

  useEffect(() => {
    load();
  }, [load]);

  // [ and ] page the table (the design's shortcut).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '[') setPage((p) => Math.max(1, p - 1));
      else if (e.key === ']') setPage((p) => (data && p * pageSize < data.total ? p + 1 : p));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [data, pageSize]);

  const applyView = (v: SavedView) => {
    setView(v.apply);
    setViewName(v.name);
    setViewsOpen(false);
    setPage(1);
  };
  const setFilter = (filter: Filter) => {
    setView((v) => ({ ...v, filter }));
    setViewName('Custom');
    setPage(1);
  };
  const sortBy = (key: SortKey) => {
    setView((v) => ({
      ...v,
      sortKey: key,
      sortDir: v.sortKey === key && v.sortDir === 'asc' ? 'desc' : 'asc',
    }));
    setPage(1);
  };
  const visible = COLS.filter((c) => !view.hidden[c.key]);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const checkedList = Object.values(checked);
  const allChecked = rows.length > 0 && rows.every((r) => checked[r.id]);
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const pageNumbers = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, i) => i + 1).filter(
        (n) => totalPages <= 7 || Math.abs(n - page) <= 2 || n === 1 || n === totalPages,
      ),
    [totalPages, page],
  );
  const counts = data?.counts ?? { all: 0, open: 0, pending: 0, late: 0 };
  const chips: { key: Filter; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: counts.all },
    { key: 'open', label: 'Open', n: counts.open },
    { key: 'pending', label: 'Drafts & quotes', n: counts.pending },
    { key: 'late', label: 'Past promise', n: counts.late },
  ];
  const views = [...BUILTIN_VIEWS, ...saved];
  const sortLabel = `${COLS.find((c) => c.key === view.sortKey)?.label.toLowerCase() ?? 'age'} ${view.sortDir === 'asc' ? '↑' : '↓'}`;

  const cell = (o: OwnerOrderRow, key: SortKey) => {
    switch (key) {
      case 'number':
        return (
          <td key={key} className="mono first" style={{ fontWeight: 500 }}>
            {o.number}
          </td>
        );
      case 'customer':
        return (
          <td key={key}>
            <div style={{ fontWeight: 500 }}>{o.customerName ?? '—'}</div>
            {o.customerPhone && <div className="sub">{o.customerPhone}</div>}
          </td>
        );
      case 'store':
        return (
          <td key={key} style={{ color: 'var(--text2)' }}>
            {o.storeName ?? '—'}
          </td>
        );
      case 'status': {
        const m = orderStatusMeta(o.status);
        return (
          <td key={key}>
            <StatusPill tone={m.tone}>{m.label}</StatusPill>
          </td>
        );
      }
      case 'promised':
        return (
          <td
            key={key}
            className="mono"
            style={{ color: o.promisedLate ? 'var(--danger)' : 'var(--text2)' }}
          >
            {o.promised ? shortDay(o.promised) : '—'}
          </td>
        );
      case 'total':
        return (
          <td key={key} className="num">
            {usdWhole(o.totalCents)}
          </td>
        );
      case 'balance':
        return (
          <td
            key={key}
            className="num"
            style={{
              color: o.balanceCents > 0 ? 'var(--text)' : 'var(--faint)',
              fontWeight: o.balanceCents > 0 ? 600 : 400,
            }}
          >
            {o.balanceCents > 0 ? usdWhole(o.balanceCents) : '—'}
          </td>
        );
      case 'rep':
        return (
          <td key={key} style={{ color: 'var(--text2)' }}>
            {o.rep ?? '—'}
          </td>
        );
      case 'next':
        return (
          <td key={key} style={{ color: 'var(--muted)' }}>
            {nextAction(o)}
          </td>
        );
      case 'age':
        return (
          <td key={key} className="num" style={{ color: 'var(--muted)' }}>
            {o.ageDays}d
          </td>
        );
      case 'fulfillment':
        return (
          <td key={key} style={{ color: 'var(--text2)' }}>
            {o.fulfillmentType.replace(/_/g, ' ')}
          </td>
        );
    }
  };

  const colSpan = visible.length + 1;

  return (
    <section className="panel" style={{ overflow: 'visible' }} data-testid="owner-orders">
      {checkedList.length === 0 ? (
        <div className="panel-head" style={{ padding: '10px var(--pad)' }}>
          <h2>Orders</h2>
          <span className="count-chip">{total}</span>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="topbar-btn"
              style={{ padding: '4px 9px', fontSize: 12 }}
              onClick={() => setViewsOpen((v) => !v)}
            >
              {viewName}
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>▾</span>
            </button>
            {viewsOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setViewsOpen(false)} />
                <div className="menu menu-left" style={{ width: 250, top: 32 }}>
                  <div style={{ padding: 6 }}>
                    {views.map((v) => (
                      <button
                        key={v.name}
                        type="button"
                        className="menu-item"
                        style={{ background: v.name === viewName ? 'var(--surface2)' : undefined }}
                        onClick={() => applyView(v)}
                      >
                        <span style={{ flex: 1, fontWeight: v.name === viewName ? 600 : 400 }}>
                          {v.name}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{v.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="panel-foot" style={{ borderRadius: 0, gap: 6 }}>
                    <input
                      className="input input-sm"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      placeholder="Name this view…"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const name = newViewName.trim() || `View ${saved.length + 1}`;
                        const next = [...saved, { name, desc: 'saved', apply: view }];
                        setSaved(next);
                        try {
                          localStorage.setItem(VIEWS_KEY, JSON.stringify(next));
                        } catch {
                          // ignore
                        }
                        setViewName(name);
                        setNewViewName('');
                        setViewsOpen(false);
                        toast.success(`Saved view “${name}”`);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="seg">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`seg-btn${view.filter === c.key ? ' is-active' : ''}`}
                onClick={() => setFilter(c.key)}
              >
                {c.label}{' '}
                <span className="mono" style={{ color: 'var(--muted)', fontSize: 11 }}>
                  {c.n}
                </span>
              </button>
            ))}
          </div>
          <input
            className="input"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by order, customer, rep…"
            style={{ marginLeft: 'auto', width: 220, padding: '5px 10px', fontSize: 12.5 }}
            data-testid="orders-filter"
          />
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="topbar-btn"
              style={{ padding: '5px 9px', fontSize: 12 }}
              onClick={() => setColsOpen((v) => !v)}
            >
              Columns{' '}
              <span className="mono" style={{ color: 'var(--muted)' }}>
                {visible.length}
              </span>
            </button>
            {colsOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setColsOpen(false)} />
                <div className="menu" style={{ width: 200, top: 32, padding: 6 }}>
                  {COLS.map((c) => (
                    <label
                      key={c.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '5px 8px',
                        borderRadius: 5,
                        fontSize: 12.5,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!view.hidden[c.key]}
                        onChange={() => {
                          setView((v) => ({
                            ...v,
                            hidden: { ...v.hidden, [c.key]: !v.hidden[c.key] },
                          }));
                          setViewName('Custom');
                        }}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className="topbar-btn"
            style={{ padding: '5px 9px', fontSize: 12 }}
            onClick={() => {
              download(`orders-${f.range.start}-to-${f.range.end}.csv`, csvOf(rows));
              toast.success(`Exported ${rows.length} orders to CSV`);
            }}
          >
            Export CSV
          </button>
          {handle}
        </div>
      ) : (
        <div
          className="panel-head"
          style={{
            padding: '9px var(--pad)',
            background: 'var(--accent-soft)',
            borderRadius: '9px 9px 0 0',
            animation: 'fadeIn .12s ease',
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{checkedList.length} selected</span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {usdWhole(checkedList.reduce((s, o) => s + o.totalCents, 0))}
          </span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                download(`orders-selected.csv`, csvOf(checkedList));
                toast.success(`Exported ${checkedList.length} orders to CSV`);
              }}
            >
              Export selected
            </button>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setChecked({})}
          >
            Clear selection
          </button>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="dt">
          <thead>
            <tr>
              <th className="first" style={{ width: 34 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  aria-label="Select all on this page"
                  onChange={(e) => {
                    const next = { ...checked };
                    for (const r of rows) {
                      if (e.target.checked) next[r.id] = r;
                      else delete next[r.id];
                    }
                    setChecked(next);
                  }}
                  style={{ accentColor: 'var(--accent)' }}
                />
              </th>
              {visible.map((c) => (
                <th
                  key={c.key}
                  className={`is-sortable${view.sortKey === c.key ? ' is-sorted' : ''}`}
                  style={{ textAlign: c.align ?? 'left' }}
                  onClick={() => sortBy(c.key)}
                >
                  {c.label}{' '}
                  <span style={{ fontSize: 9, color: 'var(--accent-ink)' }}>
                    {view.sortKey === c.key ? (view.sortDir === 'asc' ? '▲' : '▼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !data && <ShimmerRows rows={8} colSpan={colSpan} />}
            {failed && (
              <EmptyRow colSpan={colSpan}>Orders could not be loaded for this window.</EmptyRow>
            )}
            {!loading && !failed && rows.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  style={{ padding: '36px var(--pad)', textAlign: 'center', whiteSpace: 'normal' }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {counts.all === 0 ? 'No orders yet' : 'No orders match'}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 3 }}>
                    {counts.all === 0
                      ? 'Orders written at the selected stores in this period will appear here.'
                      : 'Try clearing the filters or widening the store scope.'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setQ('');
                        applyView(BUILTIN_VIEWS[0]!);
                        f.setStoreIds(null);
                      }}
                    >
                      Clear filters
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={onNewSale}>
                      New sale
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((o) => (
              <tr
                key={o.id}
                className={`is-clickable${checked[o.id] ? ' is-checked' : ''}`}
                onClick={() => onOpen(o.id)}
                data-testid="owner-order-row"
              >
                <td className="first" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={!!checked[o.id]}
                    aria-label={`Select ${o.number}`}
                    onChange={() => {
                      const next = { ...checked };
                      if (next[o.id]) delete next[o.id];
                      else next[o.id] = o;
                      setChecked(next);
                    }}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </td>
                {visible.map((c) => cell(o, c.key))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-foot" data-noprint="true">
        <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
          {total ? `${start}–${end} of ${total}` : loading ? 'Loading…' : 'No matching orders'}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>· sorted by {sortLabel}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <select
            className="select select-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{ marginRight: 8 }}
            aria-label="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
          <button
            type="button"
            className="icon-btn"
            disabled={page <= 1}
            style={{ opacity: page <= 1 ? 0.4 : 1 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            ‹
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className="icon-btn mono"
              style={{
                minWidth: 28,
                width: 'auto',
                padding: '0 6px',
                fontSize: 12,
                background: n === page ? 'var(--text)' : 'var(--surface)',
                color: n === page ? 'var(--bg)' : 'var(--text2)',
                borderColor: n === page ? 'var(--text)' : 'var(--border)',
              }}
              onClick={() => setPage(n)}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="icon-btn"
            disabled={page >= totalPages}
            style={{ opacity: page >= totalPages ? 0.4 : 1 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            ›
          </button>
          <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 8 }}>
            [ ]
          </span>
        </div>
      </div>
    </section>
  );
}
