'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Money } from '@/components/money';

interface SaleLine {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
  refundedQuantity: number;
}
interface Payment {
  id: string;
  method: string;
  amountCents: number;
  status: string;
}
interface Refund {
  id: string;
  amountCents: number;
  reason: string | null;
  createdAt: string;
}
interface Sale {
  id: string;
  number: string;
  status: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  customerId: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  lines: SaleLine[];
  payments: Payment[];
  refunds: Refund[];
}

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refundQty, setRefundQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setSale(await api<Sale>(`/v1/sales/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitRefund() {
    if (!sale) return;
    const lines = Object.entries(refundQty)
      .filter(([, q]) => q > 0)
      .map(([saleLineId, quantity]) => ({ saleLineId, quantity }));
    if (lines.length === 0) {
      alert('Select at least one line and a quantity to refund.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/sales/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || null, lines }),
      });
      setRefundQty({});
      setReason('');
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!sale) return <p>Loading…</p>;

  const refundable = sale.status === 'completed' || sale.status === 'partially_refunded';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/sales">← All sales</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        <code>{sale.number}</code>
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        {sale.status} · {new Date(sale.completedAt ?? sale.createdAt).toLocaleString()}
      </p>

      <div style={card}>
        <h2 style={section}>Lines</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Item</Th>
              <Th>Sold</Th>
              <Th>Refunded</Th>
              <Th>Unit</Th>
              <Th>Total</Th>
              {refundable && <Th>Refund qty</Th>}
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((l) => {
              const remaining = l.quantity - l.refundedQuantity;
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>{l.description}</Td>
                  <Td>{l.quantity}</Td>
                  <Td>{l.refundedQuantity}</Td>
                  <Td>
                    <Money cents={l.unitPriceCents} />
                  </Td>
                  <Td>
                    <Money cents={l.totalCents} />
                  </Td>
                  {refundable && (
                    <Td>
                      {remaining > 0 ? (
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={refundQty[l.id] ?? 0}
                          onChange={(e) =>
                            setRefundQty((prev) => ({
                              ...prev,
                              [l.id]: Math.max(0, Math.min(remaining, Number(e.target.value) || 0)),
                            }))
                          }
                          style={{
                            width: 60,
                            padding: '4px 6px',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            fontSize: 13,
                          }}
                        />
                      ) : (
                        <span style={{ color: '#888', fontSize: 12 }}>fully refunded</span>
                      )}
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h2 style={section}>Totals</h2>
        <Row label="Subtotal" cents={sale.subtotalCents} />
        {sale.discountCents > 0 && <Row label="Discount" cents={-sale.discountCents} />}
        <Row label="Tax" cents={sale.taxCents} />
        <Row label="Total" cents={sale.totalCents} bold />
      </div>

      <div style={card}>
        <h2 style={section}>Payments</h2>
        {sale.payments.map((p) => (
          <Row key={p.id} label={`${p.method.toUpperCase()} (${p.status})`} cents={p.amountCents} />
        ))}
      </div>

      {sale.refunds.length > 0 && (
        <div style={card}>
          <h2 style={section}>Refunds</h2>
          {sale.refunds.map((r) => (
            <div
              key={r.id}
              style={{
                fontSize: 13,
                paddingBottom: 6,
                marginBottom: 6,
                borderBottom: '1px solid #f3f3f3',
              }}
            >
              {new Date(r.createdAt).toLocaleString()} —{' '}
              <strong>
                <Money cents={r.amountCents} />
              </strong>
              {r.reason && <span style={{ color: '#666' }}> · {r.reason}</span>}
            </div>
          ))}
        </div>
      )}

      {refundable && (
        <div style={card}>
          <h2 style={section}>New refund</h2>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
            Set a quantity in the table above for the lines you want to refund. Inventory is
            restored automatically.
          </p>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#555' }}>Reason (optional)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 13,
                marginTop: 4,
              }}
            />
          </label>
          <button onClick={submitRefund} disabled={busy} style={primaryBtn}>
            {busy ? 'Processing…' : 'Process refund'}
          </button>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
function Row({ label, cents, bold }: { label: string; cents: number; bold?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        fontWeight: bold ? 700 : 400,
        marginBottom: 4,
      }}
    >
      <span>{label}</span>
      <span>
        <Money cents={cents} />
      </span>
    </div>
  );
}

const card = {
  background: '#fff',
  padding: 16,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  marginBottom: 16,
};
const section = { fontSize: 16, marginBottom: 12, marginTop: 0 } as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
