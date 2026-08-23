'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';

/**
 * Service ticket detail (G6): the working view of one repair — charges
 * (parts from stock, free-text labor), the running note narrative,
 * status verbs, collecting the money, completion, and a printable view
 * (the page prints clean via the browser's print dialog).
 */

interface TicketLine {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  kind: string;
}
interface TicketNote {
  id: string;
  body: string;
  createdAt: string;
}
interface Ticket {
  id: string;
  number: string;
  status: string;
  customerId: string;
  customerName: string | null;
  itemDescription: string | null;
  issue: string;
  warranty: boolean;
  serial: string | null;
  subtotalCents: number;
  totalCents: number;
  paidCents: number;
  balanceDueCents: number;
  completedAt: string | null;
  createdAt: string;
  lines: TicketLine[];
  notes: TicketNote[];
}
interface LookupRow {
  variantId: string;
  name: string;
  sku: string | null;
  priceCents: number;
}

const NEXT_STATUSES: Record<string, string[]> = {
  intake: ['awaiting_parts', 'in_service', 'cancelled'],
  awaiting_parts: ['in_service', 'intake', 'cancelled'],
  in_service: ['ready', 'awaiting_parts', 'cancelled'],
  ready: ['in_service'],
};

const STATUS_COLORS: Record<string, string> = {
  intake: '#8a6d1a',
  awaiting_parts: '#8a4b1a',
  in_service: '#1a5f8a',
  ready: '#2c7a4b',
  completed: '#2c7a4b',
  cancelled: '#8c2f2f',
};

export default function ServiceTicketPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [partQ, setPartQ] = useState('');
  const [partHits, setPartHits] = useState<LookupRow[]>([]);
  const [laborDesc, setLaborDesc] = useState('');
  const [laborPrice, setLaborPrice] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  async function load() {
    try {
      setTicket(await api<Ticket>(`/v1/service-orders/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      await api(`/v1/service-orders/${id}${path}`, {
        method: 'POST',
        body: body === undefined ? '{}' : JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function searchParts(q: string) {
    setPartQ(q);
    if (q.trim().length < 2) {
      setPartHits([]);
      return;
    }
    try {
      setPartHits(await api<LookupRow[]>(`/v1/pos/lookup?q=${encodeURIComponent(q)}`));
    } catch {
      setPartHits([]);
    }
  }

  if (error && !ticket) {
    return (
      <p style={{ color: '#b00' }}>
        {error} — <Link href="/service">back to the board</Link>
      </p>
    );
  }
  if (!ticket) return <p style={{ color: '#888', fontSize: 13 }}>Loading…</p>;

  const live = !ticket.completedAt && ticket.status !== 'cancelled';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }} data-testid="ticket-number">
          {ticket.number}
        </h1>
        <span
          data-testid="ticket-status"
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#fff',
            background: STATUS_COLORS[ticket.status] ?? '#666',
            borderRadius: 999,
            padding: '2px 10px',
          }}
        >
          {ticket.status.replace('_', ' ')}
        </span>
        {ticket.warranty && (
          <span style={{ fontSize: 12, color: '#8a6d1a', fontWeight: 700 }}>WARRANTY</span>
        )}
        <button onClick={() => window.print()} style={{ ...ghostBtn, marginLeft: 'auto' }}>
          Print
        </button>
        <Link href="/service" style={{ fontSize: 13, color: '#06c' }}>
          ← Board
        </Link>
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
        {ticket.customerName} · opened {new Date(ticket.createdAt).toLocaleString()}
        {ticket.serial ? ` · serial ${ticket.serial}` : ''}
      </p>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div>
          <div style={card}>
            <h3 style={section}>Item & issue</h3>
            <p style={{ fontSize: 13, margin: '0 0 4px' }}>
              <strong>{ticket.itemDescription ?? 'Item'}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#444', margin: 0 }}>{ticket.issue}</p>
          </div>

          <div style={card}>
            <h3 style={section}>Charges</h3>
            {ticket.lines.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {ticket.lines.map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                      <td style={{ padding: '6px 4px' }}>{l.description}</td>
                      <td style={{ padding: '6px 4px', color: '#888' }}>{l.kind}</td>
                      <td style={{ padding: '6px 4px' }}>×{l.quantity}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                        {formatMoney(l.totalCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {live && (
              <>
                <div style={{ marginTop: 10, position: 'relative' }}>
                  <input
                    value={partQ}
                    onChange={(e) => void searchParts(e.target.value)}
                    placeholder="Add part from stock — search SKU or name…"
                    style={input}
                    data-testid="part-search"
                  />
                  {partHits.length > 0 && (
                    <div style={{ border: '1px solid #ddd', borderRadius: 4, marginTop: 2 }}>
                      {partHits.slice(0, 6).map((p) => (
                        <button
                          key={p.variantId}
                          onClick={() => {
                            setPartQ('');
                            setPartHits([]);
                            void act('/lines', { variantId: p.variantId, kind: 'part' });
                          }}
                          style={hitBtn}
                        >
                          {p.name} {p.sku ? `(${p.sku})` : ''} — {formatMoney(p.priceCents)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    value={laborDesc}
                    onChange={(e) => setLaborDesc(e.target.value)}
                    placeholder="Labor description"
                    style={{ ...input, flex: 2 }}
                    data-testid="labor-desc"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={laborPrice}
                    onChange={(e) => setLaborPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ ...input, flex: 1 }}
                    data-testid="labor-price"
                  />
                  <button
                    onClick={() => {
                      const cents = Math.round(Number(laborPrice || '0') * 100);
                      if (!laborDesc.trim()) return;
                      void act('/lines', {
                        description: laborDesc.trim(),
                        unitPriceCents: cents,
                      }).then(() => {
                        setLaborDesc('');
                        setLaborPrice('');
                      });
                    }}
                    disabled={busy || !laborDesc.trim()}
                    style={darkBtn}
                    data-testid="add-labor"
                  >
                    Add labor
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={card}>
            <h3 style={section}>Notes</h3>
            {ticket.notes.map((n) => (
              <p key={n.id} style={{ fontSize: 13, margin: '0 0 6px' }}>
                <span style={{ color: '#888', fontSize: 12 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>{' '}
                — {n.body}
              </p>
            ))}
            {live && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Add a note…"
                  style={{ ...input, flex: 1 }}
                  data-testid="note-body"
                />
                <button
                  onClick={() => {
                    if (!noteBody.trim()) return;
                    void act('/notes', { body: noteBody.trim() }).then(() => setNoteBody(''));
                  }}
                  disabled={busy || !noteBody.trim()}
                  style={ghostBtn}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={card}>
            <h3 style={section}>Money</h3>
            <RowLine label="Total" value={ticket.totalCents} />
            <RowLine label="Paid" value={ticket.paidCents} />
            <div data-testid="ticket-balance">
              <RowLine label="Balance due" value={ticket.balanceDueCents} bold />
            </div>
            {live && ticket.balanceDueCents > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={(ticket.balanceDueCents / 100).toFixed(2)}
                  style={{ ...input, width: 90 }}
                  data-testid="ticket-pay-amount"
                />
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  style={{ ...input, width: 110 }}
                >
                  {['cash', 'card', 'external_card', 'check', 'financing'].map((m) => (
                    <option key={m} value={m}>
                      {m.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const cents = Math.round(Number(payAmount) * 100);
                    if (!Number.isFinite(cents) || cents <= 0) return;
                    void act('/payments', { method: payMethod, amountCents: cents }).then(() =>
                      setPayAmount(''),
                    );
                  }}
                  disabled={busy}
                  style={darkBtn}
                  data-testid="ticket-take-payment"
                >
                  Collect
                </button>
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={section}>Actions</h3>
            {live ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(NEXT_STATUSES[ticket.status] ?? []).map((s) => (
                  <button
                    key={s}
                    onClick={() => void act('/status', { status: s })}
                    disabled={busy}
                    style={s === 'cancelled' ? dangerBtn : ghostBtn}
                    data-testid={`status-${s}`}
                  >
                    {s === 'cancelled' ? 'Cancel ticket' : `Mark ${s.replace('_', ' ')}`}
                  </button>
                ))}
                {ticket.status === 'ready' && (
                  <button
                    onClick={() => void act('/complete')}
                    disabled={busy || ticket.balanceDueCents > 0}
                    style={darkBtn}
                    data-testid="complete-ticket"
                    title={
                      ticket.balanceDueCents > 0 ? 'Collect the balance first' : 'Hand it back'
                    }
                  >
                    Complete — picked up
                  </button>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
                {ticket.completedAt
                  ? `Completed ${new Date(ticket.completedAt).toLocaleString()}`
                  : 'Cancelled'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowLine({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
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
      <span>{formatMoney(value)}</span>
    </div>
  );
}

const card: React.CSSProperties = {
  border: '1px solid #e2e2e2',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  background: '#fff',
};
const section: React.CSSProperties = { fontSize: 14, marginBottom: 8, marginTop: 0 };
const input: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  boxSizing: 'border-box',
};
const darkBtn: React.CSSProperties = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#444',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
};
const dangerBtn: React.CSSProperties = {
  ...ghostBtn,
  color: '#8c2f2f',
};
const hitBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '6px 10px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: 13,
};
