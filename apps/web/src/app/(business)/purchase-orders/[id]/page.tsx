'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface PoLine {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostCents: number;
  lineTotalCents: number;
}
interface Po {
  id: string;
  number: string;
  status: string;
  vendorId: string;
  vendorName: string | null;
  locationId: string;
  expectedAt: string | null;
  placedAt: string | null;
  closedAt: string | null;
  subtotalCents: number;
  notes: string | null;
  createdAt: string;
  lines: PoLine[];
}

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const [po, setPo] = useState<Po | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recvQty, setRecvQty] = useState<Record<string, number>>({});
  const [recvNotes, setRecvNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setPo(await api<Po>(`/v1/purchase-orders/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitReceive() {
    if (!po) return;
    const lines = Object.entries(recvQty)
      .filter(([, q]) => q > 0)
      .map(([lineId, quantity]) => ({ lineId, quantity }));
    if (lines.length === 0) {
      alert('Enter a quantity on at least one line.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ notes: recvNotes || null, lines }),
      });
      setRecvQty({});
      setRecvNotes('');
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel this purchase order?')) return;
    setBusy(true);
    try {
      await api(`/v1/purchase-orders/${id}/cancel`, { method: 'POST' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !po) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!po) return <p>Loading…</p>;

  const receivable = po.status === 'ordered' || po.status === 'partially_received';
  const cancellable =
    po.status === 'draft' || po.status === 'ordered' || po.status === 'partially_received';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/purchase-orders">← All purchase orders</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        <code>{po.number}</code>
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        {po.status} · {po.vendorName ?? '(unknown vendor)'} ·{' '}
        {new Date(po.createdAt).toLocaleString()}
      </p>

      <div style={card}>
        <h2 style={section}>Lines</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Item</Th>
              <Th>Ordered</Th>
              <Th>Received</Th>
              <Th>Unit cost</Th>
              <Th>Line total</Th>
              {receivable && <Th>Receive qty</Th>}
            </tr>
          </thead>
          <tbody>
            {po.lines.map((l) => {
              const remaining = l.quantityOrdered - l.quantityReceived;
              return (
                <tr key={l.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>
                    {l.productName}
                    {l.variantName && <span style={{ color: '#666' }}> — {l.variantName}</span>}
                    {l.sku && (
                      <span style={{ color: '#888', fontSize: 11, marginLeft: 6 }}>
                        <code>{l.sku}</code>
                      </span>
                    )}
                  </Td>
                  <Td>{l.quantityOrdered}</Td>
                  <Td>{l.quantityReceived}</Td>
                  <Td>${(l.unitCostCents / 100).toFixed(2)}</Td>
                  <Td>${(l.lineTotalCents / 100).toFixed(2)}</Td>
                  {receivable && (
                    <Td>
                      {remaining > 0 ? (
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={recvQty[l.id] ?? 0}
                          onChange={(e) =>
                            setRecvQty((prev) => ({
                              ...prev,
                              [l.id]: Math.max(0, Math.min(remaining, Number(e.target.value) || 0)),
                            }))
                          }
                          style={{ ...inputStyle, width: 70 }}
                        />
                      ) : (
                        <span style={{ color: '#888', fontSize: 12 }}>complete</span>
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
        <Row label="Subtotal" cents={po.subtotalCents} bold />
        {po.expectedAt && (
          <Row label="Expected" text={new Date(po.expectedAt).toLocaleDateString()} />
        )}
        {po.placedAt && <Row label="Placed" text={new Date(po.placedAt).toLocaleString()} />}
        {po.closedAt && <Row label="Closed" text={new Date(po.closedAt).toLocaleString()} />}
        {po.notes && <Row label="Notes" text={po.notes} />}
      </div>

      {receivable && (
        <div style={card}>
          <h2 style={section}>Record receipt</h2>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
            Set a quantity above for each line that arrived. Inventory is incremented automatically.
          </p>
          <Field label="Notes (optional)">
            <input
              value={recvNotes}
              onChange={(e) => setRecvNotes(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={submitReceive} disabled={busy} style={primaryBtn}>
              {busy ? 'Receiving…' : 'Record receipt'}
            </button>
            {cancellable && (
              <button onClick={cancel} disabled={busy} style={dangerBtn}>
                Cancel PO
              </button>
            )}
          </div>
        </div>
      )}
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
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
} as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const dangerBtn = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#b00',
  border: '1px solid #b00',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
function Row({
  label,
  cents,
  text,
  bold,
}: {
  label: string;
  cents?: number;
  text?: string;
  bold?: boolean;
}) {
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
      <span>{cents != null ? `$${(cents / 100).toFixed(2)}` : (text ?? '—')}</span>
    </div>
  );
}
