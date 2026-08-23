'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Special orders to buy</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
          >
            {vendors.length === 0 && <option value="">No vendors yet</option>}
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => void generate()}
            disabled={busy || !vendorId || selected.length === 0}
            style={{
              padding: '8px 14px',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
            data-testid="generate-po"
          >
            Generate PO ({selected.length})
          </button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>
        Receiving the PO later commits the arrived units to these customers automatically and emails
        them that their item is in.
      </p>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}
      {message && <p style={{ color: '#2c7a4b', fontSize: 13 }}>{message}</p>}

      {rows && rows.length === 0 && (
        <p style={{ color: '#888', fontSize: 13 }}>
          Queue is clear — every special order is on a PO or fulfilled.
        </p>
      )}
      {rows && rows.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={th}>
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
              <th style={th}>Order</th>
              <th style={th}>Customer</th>
              <th style={th}>Item</th>
              <th style={th}>SKU</th>
              <th style={th}>Qty</th>
              <th style={th}>On PO</th>
              <th style={th}>To order</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.orderLineId} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <td style={td}>
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
                <td style={td}>
                  <Link href={`/orders/${r.orderId}`} style={{ color: '#06c' }}>
                    {r.orderNumber}
                  </Link>
                </td>
                <td style={td}>{r.customerName ?? '—'}</td>
                <td style={td}>{r.description}</td>
                <td style={td}>
                  <code>{r.sku ?? '—'}</code>
                </td>
                <td style={td}>{r.quantity}</td>
                <td style={td}>{r.allocated}</td>
                <td style={{ ...td, fontWeight: 700 }}>{r.toOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = { padding: '8px 6px', fontWeight: 600 } as const;
const td = { padding: '8px 6px' } as const;
