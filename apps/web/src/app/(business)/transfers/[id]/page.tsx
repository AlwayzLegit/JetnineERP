'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface TransferLine {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantityShipped: number;
  quantityReceived: number;
}
interface Transfer {
  id: string;
  number: string;
  status: string;
  fromLocationName: string | null;
  toLocationName: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  canceledAt: string | null;
  notes: string | null;
  createdAt: string;
  lines: TransferLine[];
}

export default function TransferDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [t, setT] = useState<Transfer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recvQty, setRecvQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setT(await api<Transfer>(`/v1/stock-transfers/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function ship() {
    setBusy(true);
    try {
      await api(`/v1/stock-transfers/${id}/ship`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitReceive() {
    if (!t) return;
    const lines = Object.entries(recvQty)
      .filter(([, q]) => q > 0)
      .map(([lineId, quantity]) => ({ lineId, quantity }));
    if (lines.length === 0) {
      alert('Enter a quantity on at least one line.');
      return;
    }
    setBusy(true);
    try {
      await api(`/v1/stock-transfers/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify({ lines }),
      });
      setRecvQty({});
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm('Cancel this transfer? Only allowed before shipping.')) return;
    setBusy(true);
    try {
      await api(`/v1/stock-transfers/${id}/cancel`, { method: 'POST' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !t) return <p style={{ color: '#b00' }}>{error}</p>;
  if (!t) return <p>Loading…</p>;

  const isDraft = t.status === 'draft';
  const isInTransit = t.status === 'in_transit';

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/transfers">← All transfers</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        <code>{t.number}</code>
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        {t.status} · <strong>{t.fromLocationName ?? '—'}</strong> →{' '}
        <strong>{t.toLocationName ?? '—'}</strong> · {new Date(t.createdAt).toLocaleString()}
      </p>

      <div style={card}>
        <h2 style={section}>Lines</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Item</Th>
              <Th>Shipped</Th>
              <Th>Received</Th>
              {isInTransit && <Th>Receive qty</Th>}
            </tr>
          </thead>
          <tbody>
            {t.lines.map((l) => {
              const remaining = l.quantityShipped - l.quantityReceived;
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
                  <Td>{l.quantityShipped}</Td>
                  <Td>{l.quantityReceived}</Td>
                  {isInTransit && (
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

      {t.notes && (
        <div style={card}>
          <strong style={{ fontSize: 13 }}>Notes:</strong>
          <p style={{ fontSize: 13, color: '#444' }}>{t.notes}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {isDraft && (
          <>
            <button onClick={ship} disabled={busy} style={primaryBtn}>
              {busy ? 'Shipping…' : 'Ship transfer'}
            </button>
            <button onClick={cancel} disabled={busy} style={dangerBtn}>
              Cancel
            </button>
          </>
        )}
        {isInTransit && (
          <button onClick={submitReceive} disabled={busy} style={primaryBtn}>
            {busy ? 'Receiving…' : 'Record receipt'}
          </button>
        )}
      </div>
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
