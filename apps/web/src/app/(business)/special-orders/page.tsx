'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Button, Card, EmptyState, LoadingRows, PageHeader, Select } from '@/components/ui';

/**
 * The to-order queue (STORIS cutover G3): everything customers have
 * bought that the store still has to buy. Tick lines, pick the vendor,
 * generate the PO — receiving it later commits the units to the waiting
 * customers automatically and emails them.
 */

interface QueueRow {
  orderLineId: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  sku: string | null;
  description: string;
  quantity: number;
  allocated: number;
  toOrder: number;
}
interface VendorRow {
  id: string;
  name: string;
}

export default function SpecialOrdersPage() {
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [vendorId, setVendorId] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [queue, vend] = await Promise.all([
        api<QueueRow[]>('/v1/special-orders/queue'),
        api<{ data: VendorRow[] } | VendorRow[]>('/v1/vendors').catch(() => []),
      ]);
      setRows(queue);
      const vlist = Array.isArray(vend) ? vend : (vend.data ?? []);
      setVendors(vlist);
      if (vlist[0] && !vendorId) setVendorId(vlist[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => rows?.filter((r) => checked.has(r.orderLineId)) ?? [],
    [rows, checked],
  );

  async function generate() {
    if (!vendorId || selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ number: string; lineCount: number }>(
        '/v1/special-orders/generate-po',
        {
          method: 'POST',
          body: JSON.stringify({
            vendorId,
            lines: selected.map((r) => ({ orderLineId: r.orderLineId, quantity: r.toOrder })),
          }),
        },
      );
      setMessage(`Created ${res.number} with ${res.lineCount} line(s).`);
      setChecked(new Set());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Special orders to buy"
        sub="Receiving the PO later commits the arrived units to these customers automatically and emails them that their item is in."
        actions={
          <>
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              {vendors.length === 0 && <option value="">No vendors yet</option>}
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
            <Button
              variant="primary"
              onClick={() => void generate()}
              disabled={busy || !vendorId || selected.length === 0}
              data-testid="generate-po"
            >
              Generate PO ({selected.length})
            </Button>
          </>
        }
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
      {message && <p style={{ color: 'var(--success)', fontSize: 13 }}>{message}</p>}

      {!rows && !error && <LoadingRows rows={4} />}
      {rows && rows.length === 0 && (
        <EmptyState>Queue is clear — every special order is on a PO or fulfilled.</EmptyState>
      )}
      {rows && rows.length > 0 && (
        <Card style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={checked.size === rows.length}
                      onChange={(e) =>
                        setChecked(
                          e.target.checked ? new Set(rows.map((r) => r.orderLineId)) : new Set(),
                        )
                      }
                    />
                  </th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>SKU</th>
                  <th className="num">Qty</th>
                  <th className="num">On PO</th>
                  <th className="num">To order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.orderLineId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={checked.has(r.orderLineId)}
                        onChange={(e) => {
                          const next = new Set(checked);
                          if (e.target.checked) next.add(r.orderLineId);
                          else next.delete(r.orderLineId);
                          setChecked(next);
                        }}
                      />
                    </td>
                    <td>
                      <Link href={`/orders/${r.orderId}`}>{r.orderNumber}</Link>
                    </td>
                    <td>{r.customerName ?? '—'}</td>
                    <td>{r.description}</td>
                    <td>
                      <code>{r.sku ?? '—'}</code>
                    </td>
                    <td className="num">{r.quantity}</td>
                    <td className="num">{r.allocated}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {r.toOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
