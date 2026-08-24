'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Printer } from 'lucide-react';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Button, Card, Input, LinkButton, LoadingRows, Select, StatusBadge } from '@/components/ui';

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
      <p style={{ color: 'var(--danger)' }}>
        {error} — <Link href="/service">back to the board</Link>
      </p>
    );
  }
  if (!ticket) return <LoadingRows rows={4} />;

  const live = !ticket.completedAt && ticket.status !== 'cancelled';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 4,
          flexWrap: 'wrap',
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }} data-testid="ticket-number">
          {ticket.number}
        </h1>
        <span data-testid="ticket-status" style={{ display: 'inline-flex' }}>
          <StatusBadge status={ticket.status} />
        </span>
        {ticket.warranty && <span className="badge badge-warning">WARRANTY</span>}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.print()}
          style={{ marginLeft: 'auto' }}
        >
          <Printer size={14} aria-hidden />
          Print
        </Button>
        <LinkButton href="/service" variant="ghost" size="sm">
          ← Board
        </LinkButton>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
        {ticket.customerName} · opened {new Date(ticket.createdAt).toLocaleString()}
        {ticket.serial ? ` · serial ${ticket.serial}` : ''}
      </p>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <Card title="Item & issue" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, margin: '0 0 4px' }}>
              <strong>{ticket.itemDescription ?? 'Item'}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              {ticket.issue}
            </p>
          </Card>

          <Card title="Charges" style={{ marginBottom: 16 }}>
            {ticket.lines.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <tbody>
                    {ticket.lines.map((l) => (
                      <tr key={l.id}>
                        <td>{l.description}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{l.kind}</td>
                        <td>×{l.quantity}</td>
                        <td className="num">{formatMoney(l.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {live && (
              <>
                <div style={{ marginTop: 10, position: 'relative' }}>
                  <Input
                    value={partQ}
                    onChange={(e) => void searchParts(e.target.value)}
                    placeholder="Add part from stock — search SKU or name…"
                    style={{ width: '100%' }}
                    data-testid="part-search"
                  />
                  {partHits.length > 0 && (
                    <div
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: 4,
                        background: 'var(--surface)',
                        boxShadow: 'var(--shadow-md)',
                        overflow: 'hidden',
                      }}
                    >
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
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <Input
                    value={laborDesc}
                    onChange={(e) => setLaborDesc(e.target.value)}
                    placeholder="Labor description"
                    style={{ flex: 2 }}
                    data-testid="labor-desc"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={laborPrice}
                    onChange={(e) => setLaborPrice(e.target.value)}
                    placeholder="0.00"
                    style={{ flex: 1, minWidth: 0 }}
                    data-testid="labor-price"
                  />
                  <Button
                    variant="primary"
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
                    data-testid="add-labor"
                  >
                    Add labor
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card title="Notes" style={{ marginBottom: 16 }}>
            {ticket.notes.map((n) => (
              <p key={n.id} style={{ fontSize: 13, margin: '0 0 6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </span>{' '}
                — {n.body}
              </p>
            ))}
            {live && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Input
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Add a note…"
                  style={{ flex: 1 }}
                  data-testid="note-body"
                />
                <Button
                  onClick={() => {
                    if (!noteBody.trim()) return;
                    void act('/notes', { body: noteBody.trim() }).then(() => setNoteBody(''));
                  }}
                  disabled={busy || !noteBody.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="min-w-0">
          <Card title="Money" style={{ marginBottom: 16 }}>
            <RowLine label="Total" value={ticket.totalCents} />
            <RowLine label="Paid" value={ticket.paidCents} />
            <div data-testid="ticket-balance">
              <RowLine label="Balance due" value={ticket.balanceDueCents} bold />
            </div>
            {live && ticket.balanceDueCents > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={(ticket.balanceDueCents / 100).toFixed(2)}
                  style={{ width: 90 }}
                  data-testid="ticket-pay-amount"
                />
                <Select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  style={{ width: 110 }}
                >
                  {['cash', 'card', 'external_card', 'check', 'financing'].map((m) => (
                    <option key={m} value={m}>
                      {m.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="primary"
                  onClick={() => {
                    const cents = Math.round(Number(payAmount) * 100);
                    if (!Number.isFinite(cents) || cents <= 0) return;
                    void act('/payments', { method: payMethod, amountCents: cents }).then(() =>
                      setPayAmount(''),
                    );
                  }}
                  disabled={busy}
                  data-testid="ticket-take-payment"
                >
                  Collect
                </Button>
              </div>
            )}
          </Card>

          <Card title="Actions" style={{ marginBottom: 16 }}>
            {live ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(NEXT_STATUSES[ticket.status] ?? []).map((s) => (
                  <Button
                    key={s}
                    variant={s === 'cancelled' ? 'danger' : 'secondary'}
                    onClick={() => void act('/status', { status: s })}
                    disabled={busy}
                    data-testid={`status-${s}`}
                  >
                    {s === 'cancelled' ? 'Cancel ticket' : `Mark ${s.replace('_', ' ')}`}
                  </Button>
                ))}
                {ticket.status === 'ready' && (
                  <Button
                    variant="primary"
                    onClick={() => void act('/complete')}
                    disabled={busy || ticket.balanceDueCents > 0}
                    data-testid="complete-ticket"
                    title={
                      ticket.balanceDueCents > 0 ? 'Collect the balance first' : 'Hand it back'
                    }
                  >
                    <CheckCircle2 size={14} aria-hidden />
                    Complete — picked up
                  </Button>
                )}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                {ticket.completedAt
                  ? `Completed ${new Date(ticket.completedAt).toLocaleString()}`
                  : 'Cancelled'}
              </p>
            )}
          </Card>
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
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}

const hitBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '7px 10px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: 13,
  color: 'var(--text)',
};
