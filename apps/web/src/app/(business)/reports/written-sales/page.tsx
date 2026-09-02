'use client';

import { Download, Play, Printer } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { downloadFile } from '@/lib/download';
import { rangeToSearch } from '@/lib/date-range';
import { DateRangePicker, useUrlDateRange } from '@/components/date-range-picker';
import { Money } from '@/components/money';
import { Button, Card, EmptyState, Field, LoadingRows, PageHeader } from '@/components/ui';

/**
 * Report Written Sales Dollars (STORIS TE.320, owner 2026-09-02). The
 * parameter card mirrors the STORIS screen — date range, store(s), Order
 * Type both / orders / adjustments, Report Type detail / summary, Include
 * Audit Comments / All Salespeople / Customer's Full Address — and the
 * output is the STORIS body: location → type → order → lines with merch,
 * gross profit, profit %, then charges / discount / misc fee / tax /
 * total, totalled per order, type, location and grand.
 */

type OrderTypeFilter = 'both' | 'orders' | 'adjustments';
type ReportType = 'detail' | 'summary';

interface Totals {
  merchCents: number;
  profitCents: number | null;
  profitPct: number | null;
  chargesCents: number;
  discountCents: number;
  miscFeeCents: number;
  taxCents: number;
  totalCents: number;
  documents: number;
}
interface Line {
  lineId: string;
  quantity: number;
  productNumber: string | null;
  description: string;
  merchCents: number;
  profitCents: number | null;
  profitPct: number | null;
  enteredBy: string | null;
}
interface Doc {
  documentType: 'order' | 'sale' | 'adjustment';
  documentId: string;
  number: string;
  date: string;
  time: string;
  customerCode: string | null;
  customerName: string | null;
  address: string | null;
  salespeople: string[];
  marketingCode: string | null;
  adjustmentKind: 'price_adjustment' | 'cancellation' | 'lines_added' | null;
  adjustmentReason: string | null;
  comments: string[];
  lines: Line[];
  totals: Totals;
}
interface TypeGroup {
  key: string;
  label: string;
  documents: Doc[];
  totals: Totals;
}
interface LocationGroup {
  locationId: string;
  locationName: string;
  types: TypeGroup[];
  totals: Totals;
}
interface Report {
  generatedAt: string;
  range: { start: string; end: string };
  orderType: OrderTypeFilter;
  reportType: ReportType;
  canSeeProfit: boolean;
  locations: LocationGroup[];
  totals: Totals;
}
interface Location {
  id: string;
  name: string;
  locationType?: string;
}

const ORDER_TYPES: { key: OrderTypeFilter; label: string }[] = [
  { key: 'both', label: 'Both' },
  { key: 'orders', label: 'Orders only' },
  { key: 'adjustments', label: 'Adjustments only' },
];
const REPORT_TYPES: { key: ReportType; label: string }[] = [
  { key: 'detail', label: 'Detail' },
  { key: 'summary', label: 'Summary' },
];

function docHref(d: Doc): string {
  return d.documentType === 'sale' ? `/sales/${d.documentId}` : `/orders/${d.documentId}`;
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${m}/${d}/${y.slice(2)}` : iso;
}

function Pct({ value }: { value: number | null }) {
  return <>{value == null ? '—' : `${value.toFixed(1)}`}</>;
}

function Stat({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        background: 'var(--surface)',
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: strong ? 700 : 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

const COLS = 11;

function TotalsRow({
  label,
  t,
  profit,
  strong,
  testid,
}: {
  label: string;
  t: Totals;
  profit: boolean;
  strong?: boolean;
  testid?: string;
}) {
  const cls = strong ? 'num font-bold' : 'num font-semibold';
  return (
    <tr data-testid={testid} className={strong ? 'bg-surface-muted' : undefined}>
      <td colSpan={3} className={strong ? 'text-right font-bold' : 'text-right font-semibold'}>
        {label}
      </td>
      <td className={cls}>
        <Money cents={t.merchCents} />
      </td>
      <td className={cls}>
        {profit && t.profitCents != null ? <Money cents={t.profitCents} /> : '—'}
      </td>
      <td className={cls}>{profit ? <Pct value={t.profitPct} /> : '—'}</td>
      <td className={cls}>
        <Money cents={t.chargesCents} />
      </td>
      <td className={cls}>
        <Money cents={t.discountCents} />
      </td>
      <td className={cls}>
        <Money cents={t.miscFeeCents} />
      </td>
      <td className={cls}>
        <Money cents={t.taxCents} />
      </td>
      <td className={cls}>
        <Money cents={t.totalCents} />
      </td>
    </tr>
  );
}

export default function WrittenSalesPage() {
  const [range, setRange, rangeReady] = useUrlDateRange('today');
  const [orderType, setOrderType] = useState<OrderTypeFilter>('both');
  const [reportType, setReportType] = useState<ReportType>('detail');
  const [includeAuditComments, setIncludeAuditComments] = useState(false);
  const [includeAllSalespeople, setIncludeAllSalespeople] = useState(true);
  const [includeAddress, setIncludeAddress] = useState(true);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [paramsReady, setParamsReady] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ot = p.get('orderType');
    if (ot === 'orders' || ot === 'adjustments' || ot === 'both') setOrderType(ot);
    if (p.get('reportType') === 'summary') setReportType('summary');
    if (p.get('audit') === '1') setIncludeAuditComments(true);
    if (p.get('allSalespeople') === '0') setIncludeAllSalespeople(false);
    if (p.get('address') === '0') setIncludeAddress(false);
    const locs = p.get('locationId');
    if (locs) setLocationIds(locs.split(',').filter(Boolean));
    setParamsReady(true);
  }, []);

  useEffect(() => {
    api<Location[]>('/v1/business/locations')
      .then((l) => setLocations(l.filter((x) => (x.locationType ?? 'store') !== 'warehouse')))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const query = useCallback((): string => {
    const p = new URLSearchParams();
    p.set('start', range.start);
    p.set('end', range.end);
    p.set('orderType', orderType);
    p.set('reportType', reportType);
    p.set('includeAuditComments', String(includeAuditComments));
    p.set('includeAllSalespeople', String(includeAllSalespeople));
    p.set('includeAddress', String(includeAddress));
    if (locationIds.length) p.set('locationId', locationIds.join(','));
    return p.toString();
  }, [
    range,
    orderType,
    reportType,
    includeAuditComments,
    includeAllSalespeople,
    includeAddress,
    locationIds,
  ]);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setReport(await api<Report>(`/v1/reports/written-sales?${query()}`));
      const url = new URL(window.location.href);
      const p = url.searchParams;
      rangeToSearch(range, p);
      for (const [k, v] of [
        ['orderType', orderType === 'both' ? '' : orderType],
        ['reportType', reportType === 'detail' ? '' : reportType],
        ['audit', includeAuditComments ? '1' : ''],
        ['allSalespeople', includeAllSalespeople ? '' : '0'],
        ['address', includeAddress ? '' : '0'],
        ['locationId', locationIds.join(',')],
      ] as const) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      window.history.replaceState(null, '', url.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [
    query,
    range,
    orderType,
    reportType,
    includeAuditComments,
    includeAllSalespeople,
    includeAddress,
    locationIds,
  ]);

  useEffect(() => {
    if (rangeReady && paramsReady) void run();
    // First run once the URL parameters are known; later runs are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeReady, paramsReady]);

  async function exportCsv() {
    setExporting(true);
    try {
      await downloadFile(
        `/v1/reports/written-sales?${query()}&format=csv`,
        `written-sales-${range.start}-to-${range.end}.csv`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  }

  const profit = report?.canSeeProfit ?? false;

  return (
    <div data-testid="written-sales">
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/reports">← Reports</Link>
      </p>
      <PageHeader
        title="Report Written Sales Dollars"
        sub="What was written in the window, per location and transaction type, with merchandise, gross profit, charges, discounts, tax and order totals."
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()} disabled={!report}>
              <Printer size={14} />
              Print
            </Button>
            <Button variant="secondary" onClick={() => void exportCsv()} disabled={exporting}>
              <Download size={14} />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <Card title="Parameters" data-testid="ws-params">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run();
            }}
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Date range">
                <DateRangePicker value={range} onChange={setRange} compact testid="ws-range" />
              </Field>
              <Field label="Store">
                <select
                  multiple
                  className="input"
                  style={{ minHeight: 92 }}
                  value={locationIds}
                  onChange={(e) =>
                    setLocationIds([...e.target.selectedOptions].map((o) => o.value))
                  }
                  data-testid="ws-stores"
                  aria-label="Store (multiple)"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted">
                  {locationIds.length === 0
                    ? 'All locations'
                    : `${locationIds.length} selected — ctrl/cmd-click to change`}
                </span>
              </Field>
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-1 text-xs text-muted">Order type</legend>
                <div className="grid gap-1 text-sm">
                  {ORDER_TYPES.map((o) => (
                    <label key={o.key} className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="orderType"
                        value={o.key}
                        checked={orderType === o.key}
                        onChange={() => setOrderType(o.key)}
                        data-testid={`ws-order-type-${o.key}`}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-3">
                <fieldset className="m-0 border-0 p-0">
                  <legend className="mb-1 text-xs text-muted">Report type</legend>
                  <div className="flex gap-3 text-sm">
                    {REPORT_TYPES.map((r) => (
                      <label key={r.key} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="reportType"
                          value={r.key}
                          checked={reportType === r.key}
                          onChange={() => setReportType(r.key)}
                          data-testid={`ws-report-type-${r.key}`}
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-1 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={includeAuditComments}
                      onChange={(e) => setIncludeAuditComments(e.target.checked)}
                      data-testid="ws-audit"
                    />
                    Include audit comments
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={includeAllSalespeople}
                      onChange={(e) => setIncludeAllSalespeople(e.target.checked)}
                    />
                    Include all salespeople
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={includeAddress}
                      onChange={(e) => setIncludeAddress(e.target.checked)}
                      data-testid="ws-address"
                    />
                    Include customer&apos;s full address
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="primary" disabled={busy} data-testid="ws-run">
                <Play size={14} />
                {busy ? 'Running…' : 'Run'}
              </Button>
            </div>
          </form>
        </Card>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 13 }} role="alert">
            {error}
          </p>
        )}

        {!report && !error && (
          <Card>
            <LoadingRows rows={4} />
          </Card>
        )}

        {report && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Documents" value={String(report.totals.documents)} />
              <Stat label="Merch" value={<Money cents={report.totals.merchCents} />} />
              <Stat
                label="Gross profit"
                value={
                  profit && report.totals.profitCents != null ? (
                    <Money cents={report.totals.profitCents} />
                  ) : (
                    '—'
                  )
                }
              />
              <Stat
                label="Profit %"
                value={profit ? <Pct value={report.totals.profitPct} /> : '—'}
              />
              <Stat label="Sales tax" value={<Money cents={report.totals.taxCents} />} />
              <Stat label="Total" value={<Money cents={report.totals.totalCents} />} strong />
            </div>

            {report.locations.length === 0 ? (
              <Card>
                <EmptyState>Nothing written in this window.</EmptyState>
              </Card>
            ) : (
              report.locations.map((loc) => (
                <Card key={loc.locationId} title={`Location · ${loc.locationName}`}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" data-testid="ws-location">
                      <thead>
                        <tr>
                          <th className="num">Qty</th>
                          <th>Product number</th>
                          <th>Product description</th>
                          <th className="num">Merch amount</th>
                          <th className="num">Gross profit</th>
                          <th className="num">Profit pct</th>
                          <th className="num">Charges</th>
                          <th className="num">Customer discount</th>
                          <th className="num">Misc fee charge</th>
                          <th className="num">Sales tax</th>
                          <th className="num">Total order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loc.types.map((t) => (
                          <Fragment key={t.key}>
                            <tr className="bg-surface-muted">
                              <td colSpan={COLS} className="font-semibold">
                                Type {t.label}
                              </td>
                            </tr>
                            {t.documents.map((d) => (
                              <Fragment
                                key={`${d.documentId}:${d.adjustmentKind ?? 'doc'}:${d.time}`}
                              >
                                <tr data-testid="ws-document">
                                  <td colSpan={COLS}>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                      <span>
                                        <span className="text-muted">Order number </span>
                                        <Link href={docHref(d)} className="font-semibold">
                                          {d.number}
                                        </Link>
                                      </span>
                                      <span>
                                        <span className="text-muted">Order date </span>
                                        {fmtDate(d.date)}
                                      </span>
                                      <span>
                                        <span className="text-muted">Time created </span>
                                        {d.time}
                                      </span>
                                      <span>
                                        <span className="text-muted">Customer code </span>
                                        <code>{d.customerCode ?? '—'}</code>
                                      </span>
                                      <span>
                                        <span className="text-muted">Customer name </span>
                                        {d.customerName ?? '—'}
                                      </span>
                                      <span>
                                        <span className="text-muted">Salespeople </span>
                                        {d.salespeople.length ? d.salespeople.join(',') : '—'}
                                      </span>
                                      {d.marketingCode ? (
                                        <span>
                                          <span className="text-muted">Marketing code </span>
                                          {d.marketingCode}
                                        </span>
                                      ) : null}
                                      {d.adjustmentKind ? (
                                        <span className="text-muted">
                                          {d.adjustmentKind === 'price_adjustment'
                                            ? 'Price adjustment'
                                            : d.adjustmentKind === 'cancellation'
                                              ? 'Cancellation'
                                              : 'Lines added after write'}
                                          {d.adjustmentReason ? ` — ${d.adjustmentReason}` : ''}
                                        </span>
                                      ) : null}
                                    </div>
                                    {d.address ? (
                                      <div
                                        className="text-xs text-muted"
                                        data-testid="ws-address-line"
                                      >
                                        {d.address}
                                      </div>
                                    ) : null}
                                    {d.comments.length > 0 ? (
                                      <ul
                                        className="mt-1 text-xs text-muted"
                                        data-testid="ws-comments"
                                      >
                                        {d.comments.map((c, i) => (
                                          <li key={i}>{c}</li>
                                        ))}
                                      </ul>
                                    ) : null}
                                  </td>
                                </tr>
                                {d.lines.map((l) => (
                                  <tr key={l.lineId} data-testid="ws-line">
                                    <td className="num">{l.quantity || ''}</td>
                                    <td>{l.productNumber ?? '—'}</td>
                                    <td>{l.description}</td>
                                    <td className="num">
                                      <Money cents={l.merchCents} />
                                    </td>
                                    <td className="num">
                                      {profit && l.profitCents != null ? (
                                        <Money cents={l.profitCents} />
                                      ) : (
                                        '—'
                                      )}
                                    </td>
                                    <td className="num">
                                      {profit ? <Pct value={l.profitPct} /> : '—'}
                                    </td>
                                    <td colSpan={4} />
                                    <td className="num text-muted">{l.enteredBy ?? ''}</td>
                                  </tr>
                                ))}
                                <TotalsRow
                                  label={`Total for order ${d.number}:`}
                                  t={d.totals}
                                  profit={profit}
                                  testid="ws-order-total"
                                />
                              </Fragment>
                            ))}
                            <TotalsRow
                              label={`Total for type ${t.label}:`}
                              t={t.totals}
                              profit={profit}
                              testid="ws-type-total"
                            />
                          </Fragment>
                        ))}
                        <TotalsRow
                          label={`Total for location ${loc.locationName}:`}
                          t={loc.totals}
                          profit={profit}
                          strong
                          testid="ws-location-total"
                        />
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))
            )}

            <Card title="Grand total" data-testid="ws-grand">
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th colSpan={3} />
                      <th className="num">Merch amount</th>
                      <th className="num">Gross profit</th>
                      <th className="num">Profit pct</th>
                      <th className="num">Charges</th>
                      <th className="num">Customer discount</th>
                      <th className="num">Misc fee charge</th>
                      <th className="num">Sales tax</th>
                      <th className="num">Total order</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TotalsRow label="Grand total:" t={report.totals} profit={profit} strong />
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted">
                {fmtDate(report.range.start)}
                {report.range.end !== report.range.start ? ` – ${fmtDate(report.range.end)}` : ''} ·
                order type {report.orderType} · {report.reportType} · generated{' '}
                {new Date(report.generatedAt).toLocaleString()}
                {!profit ? ' · gross profit hidden (needs financial reports permission)' : ''}
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
