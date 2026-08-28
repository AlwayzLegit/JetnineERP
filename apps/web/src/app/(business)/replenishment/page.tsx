'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';

interface Vendor {
  id: string;
  name: string;
}
interface Location {
  id: string;
  name: string;
  locationType: string;
}
interface VendorSettings {
  generateAutomaticPos: boolean;
  automaticallyHoldPos: boolean;
  weeklySalesRateWeeks: number;
  includeAllBackOrders: boolean;
  daysForReplenishment: number | null;
  minimumStockDays: number;
  leadDays: number;
  variancePercent: number;
  minimumSalesRate: number;
  buildDays: number[];
  defaultRequestedDate?: 'vendor_lead_days' | 'today';
}
interface GridRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  vendorSku: string | null;
  costCents: number | null;
  required: number;
  additional: number;
  available: number;
  netPo: number;
  orderQty: number;
  salesRate: number;
  volume: number;
  asIsQty: number;
  lastSaleDate: string | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ReplenishmentPage() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Criteria (§4.1)
  const [variance, setVariance] = useState('');
  const [daysForRepl, setDaysForRepl] = useState('');
  const [salesWindow, setSalesWindow] = useState<'this_year_prior' | 'last_year_subsequent'>(
    'this_year_prior',
  );
  const [includeOverstocks, setIncludeOverstocks] = useState(false);

  // Results (§4.2). Overrides are session-only — Rebuild List drops them.
  const [rows, setRows] = useState<GridRow[] | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [running, setRunning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [v, l] = await Promise.all([
          api<Vendor[]>('/v1/vendors'),
          api<Location[]>('/v1/business/locations'),
        ]);
        setVendors(v);
        setLocations(l);
        if (l.length === 1) setLocationId(l[0]!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  useEffect(() => {
    setSettings(null);
    setSettingsLoaded(false);
    setRows(null);
    setOverrides({});
    if (!vendorId) return;
    void (async () => {
      try {
        const res = await api<{ settings: VendorSettings | null }>(
          `/v1/purchasing/replenishment/vendors/${vendorId}/settings`,
        );
        setSettings(res.settings);
        setSettingsLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [vendorId]);

  function criteriaBody() {
    return {
      vendorId,
      locationId,
      variancePercent: variance === '' ? null : Number(variance),
      daysForReplenishment: daysForRepl === '' ? null : Number(daysForRepl),
      salesWindow,
      includeOverstocks,
    };
  }

  async function run(rebuild = false) {
    if (!vendorId || !locationId) {
      toast.error('Pick a vendor and a warehouse location first');
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const res = await api<{ rows: GridRow[] }>('/v1/purchasing/replenishment/run', {
        method: 'POST',
        body: JSON.stringify(criteriaBody()),
      });
      setRows(res.rows);
      setOverrides({}); // Rebuild List semantics: overrides never survive a run
      if (rebuild) toast.success('List rebuilt — overrides discarded');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function createPo() {
    setCreating(true);
    setError(null);
    try {
      const body = {
        ...criteriaBody(),
        overrides: Object.entries(overrides).map(([variantId, orderQty]) => ({
          variantId,
          orderQty,
        })),
      };
      const res = await api<{ poId: string; number: string; status: string; lineCount: number }>(
        '/v1/purchasing/replenishment/purchase-order',
        { method: 'POST', body: JSON.stringify(body) },
      );
      toast.success(
        `${res.number} created (${res.lineCount} line${res.lineCount === 1 ? '' : 's'}${
          res.status === 'draft' ? ', held for review' : ', placed'
        })`,
      );
      void run();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  async function saveSettings(patch: Partial<VendorSettings>) {
    try {
      const res = await api<{ settings: VendorSettings | null }>(
        `/v1/purchasing/replenishment/vendors/${vendorId}/settings`,
        { method: 'PATCH', body: JSON.stringify(patch) },
      );
      setSettings(res.settings);
      toast.success('Vendor replenishment settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const effectiveRows = useMemo(
    () =>
      (rows ?? []).map((r) => ({
        ...r,
        effectiveQty: overrides[r.variantId] ?? r.orderQty,
      })),
    [rows, overrides],
  );
  const orderable = effectiveRows.filter((r) => r.effectiveQty > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales-rate replenishment"
        sub="One engine, three run modes — what this screen shows is exactly what the nightly build orders"
      />
      {error ? (
        <Card>
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      ) : null}

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Vendor (required)">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">Select a vendor…</option>
              {(vendors ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Warehouse location">
            <Select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">Select a location…</option>
              {/* Q2: warehouses first — they are the replenishment target. */}
              {[...(locations ?? [])]
                .sort((a, b) =>
                  a.locationType === b.locationType
                    ? a.name.localeCompare(b.name)
                    : a.locationType === 'warehouse'
                      ? -1
                      : 1,
                )
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.locationType === 'warehouse' ? ' (warehouse)' : ''}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Variance % (blank = 100)">
            <Input
              type="number"
              min={0}
              max={999}
              value={variance}
              onChange={(e) => setVariance(e.target.value)}
              placeholder="100"
            />
          </Field>
          <Field label="Days for replenishment">
            <Input
              type="number"
              min={0}
              max={999}
              value={daysForRepl}
              onChange={(e) => setDaysForRepl(e.target.value)}
              placeholder="Vendor default"
              disabled={settings?.includeAllBackOrders === true}
            />
          </Field>
          <Field label="Sales to use">
            <Select
              value={salesWindow}
              onChange={(e) =>
                setSalesWindow(
                  e.target.value === 'last_year_subsequent'
                    ? 'last_year_subsequent'
                    : 'this_year_prior',
                )
              }
            >
              <option value="this_year_prior">This year&apos;s prior weeks</option>
              <option value="last_year_subsequent">Last year&apos;s subsequent weeks</option>
            </Select>
          </Field>
          <Field label="Include overstocks">
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeOverstocks}
                onChange={(e) => setIncludeOverstocks(e.target.checked)}
              />
              Show rows with nothing to order
            </label>
          </Field>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button
              variant="primary"
              onClick={() => void run()}
              disabled={running || !vendorId || !locationId}
            >
              {running ? 'Running…' : 'Run'}
            </Button>
            {rows ? (
              <Button onClick={() => void run(true)} disabled={running}>
                Rebuild list
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      {vendorId && settingsLoaded ? (
        <Card title="Vendor replenishment settings">
          {settings ? null : (
            <p className="mb-3 text-sm text-neutral-500">
              Not configured — this vendor is skipped by every run mode until enabled.
            </p>
          )}
          <VendorSettingsForm settings={settings} onSave={(p) => void saveSettings(p)} />
        </Card>
      ) : null}

      {rows === null ? (
        vendorId && running ? (
          <Card>
            <LoadingRows rows={4} />
          </Card>
        ) : null
      ) : rows.length === 0 ? (
        <EmptyState>
          Nothing to replenish — no product cleared the sales-rate floor with a quantity to order
          under these criteria.
        </EmptyState>
      ) : (
        <Card title="Items for replenishment">
          <p className="mb-3 text-xs text-neutral-500">
            {rows.length} row(s) · {orderable.length} with quantity to order — Order Qty edits are
            session-only; Rebuild List resets them.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-neutral-500">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Vendor product</th>
                  <th className="py-2 pr-3 text-right">Rate/wk</th>
                  <th className="py-2 pr-3 text-right">Required</th>
                  <th className="py-2 pr-3 text-right">Additional</th>
                  <th className="py-2 pr-3 text-right">Available</th>
                  <th className="py-2 pr-3 text-right">Net PO</th>
                  <th className="py-2 pr-3 text-right">Volume</th>
                  <th className="py-2 pr-3 text-right">As-is</th>
                  <th className="py-2 pr-3">Last sale</th>
                  <th className="py-2 pr-3 text-right">Order qty</th>
                </tr>
              </thead>
              <tbody>
                {effectiveRows.map((r) => (
                  <tr key={r.variantId} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      {r.productName}
                      {r.variantName ? ` — ${r.variantName}` : ''}
                      {r.sku ? (
                        <span className="ml-1 text-xs text-neutral-500">{r.sku}</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">{r.vendorSku ?? r.sku ?? '—'}</td>
                    <td className="py-2 pr-3 text-right">{r.salesRate.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right">{r.required}</td>
                    <td className="py-2 pr-3 text-right">{r.additional}</td>
                    <td className="py-2 pr-3 text-right">{r.available}</td>
                    <td className="py-2 pr-3 text-right">{r.netPo}</td>
                    <td className="py-2 pr-3 text-right">{r.volume}</td>
                    <td className="py-2 pr-3 text-right">{r.asIsQty}</td>
                    <td className="py-2 pr-3">{r.lastSaleDate ?? '—'}</td>
                    <td className="py-2 pr-3 text-right">
                      <Input
                        type="number"
                        className="w-20 text-right"
                        value={String(r.effectiveQty)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setOverrides((o) => ({
                            ...o,
                            [r.variantId]: Number.isInteger(n) ? n : 0,
                          }));
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Only lines with a positive order quantity are written to the purchase order.
            </p>
            <Button
              variant="primary"
              onClick={() => void createPo()}
              disabled={creating || orderable.length === 0}
            >
              {creating
                ? 'Creating…'
                : `Create purchase order (${orderable.length} line${orderable.length === 1 ? '' : 's'})`}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function VendorSettingsForm({
  settings,
  onSave,
}: {
  settings: VendorSettings | null;
  onSave: (patch: Partial<VendorSettings>) => void;
}) {
  const [form, setForm] = useState<VendorSettings>(
    settings ?? {
      generateAutomaticPos: false,
      automaticallyHoldPos: true,
      weeklySalesRateWeeks: 8,
      includeAllBackOrders: false,
      daysForReplenishment: null,
      minimumStockDays: 14,
      leadDays: 21,
      variancePercent: 100,
      minimumSalesRate: 0,
      buildDays: [],
      defaultRequestedDate: 'vendor_lead_days',
    },
  );
  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  function num(field: keyof VendorSettings, label: string, min = 0, max = 999) {
    return (
      <Field label={label}>
        <Input
          type="number"
          min={min}
          max={max}
          value={String(form[field] ?? '')}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [field]: e.target.value === '' ? null : Number(e.target.value),
            }))
          }
        />
      </Field>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {num('weeklySalesRateWeeks', 'Sales-rate window (weeks)', 1, 156)}
        {num('minimumStockDays', 'Minimum stock days')}
        {num('leadDays', 'Lead days')}
        {num('variancePercent', 'Variance %')}
        {num('minimumSalesRate', 'Minimum sales rate (units/wk)')}
        {num('daysForReplenishment', 'Days for replenishment')}
        <Field label="Requested date on POs">
          <Select
            value={form.defaultRequestedDate ?? 'vendor_lead_days'}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                defaultRequestedDate: e.target.value === 'today' ? 'today' : 'vendor_lead_days',
              }))
            }
          >
            <option value="vendor_lead_days">Vendor lead days</option>
            <option value="today">Today&apos;s date</option>
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.generateAutomaticPos}
            onChange={(e) => setForm((f) => ({ ...f, generateAutomaticPos: e.target.checked }))}
          />
          Generate automatic POs (nightly)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.automaticallyHoldPos}
            onChange={(e) => setForm((f) => ({ ...f, automaticallyHoldPos: e.target.checked }))}
          />
          Automatically hold POs (draft for buyer review)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.includeAllBackOrders}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                includeAllBackOrders: e.target.checked,
                daysForReplenishment: e.target.checked ? null : f.daysForReplenishment,
              }))
            }
          />
          Include all back orders
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs uppercase text-neutral-500">Build POs on</span>
        {WEEKDAYS.map((d, i) => (
          <label key={d} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.buildDays.includes(i)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  buildDays: e.target.checked
                    ? [...f.buildDays, i].sort()
                    : f.buildDays.filter((x) => x !== i),
                }))
              }
            />
            {d}
          </label>
        ))}
      </div>
      <Button variant="primary" onClick={() => onSave(form)}>
        Save vendor settings
      </Button>
    </div>
  );
}
