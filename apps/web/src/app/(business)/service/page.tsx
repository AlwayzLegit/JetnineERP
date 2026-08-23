'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';

/**
 * Service board (STORIS cutover G6): every open ticket by status, plus
 * the intake form. Tickets flow intake → awaiting parts → in service →
 * ready (customer emailed) → completed.
 */

interface Ticket {
  id: string;
  number: string;
  status: string;
  customerName: string | null;
  itemDescription: string | null;
  issue: string;
  warranty: boolean;
  totalCents: number;
  balanceDueCents: number;
  createdAt: string;
}
interface LocationRow {
  id: string;
  name: string;
}
interface CustomerRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

const COLUMNS = [
  { key: 'intake', label: 'Intake' },
  { key: 'awaiting_parts', label: 'Awaiting parts' },
  { key: 'in_service', label: 'In service' },
  { key: 'ready', label: 'Ready for pickup' },
] as const;

export default function ServiceBoardPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [showIntake, setShowIntake] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [customerQ, setCustomerQ] = useState('');
  const [customerHits, setCustomerHits] = useState<CustomerRow[]>([]);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [itemDescription, setItemDescription] = useState('');
  const [issue, setIssue] = useState('');
  const [warranty, setWarranty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [rows, locs] = await Promise.all([
        api<Ticket[]>('/v1/service-orders'),
        api<LocationRow[]>('/v1/pos/locations'),
      ]);
      setTickets(rows);
      setLocations(locs);
      if (locs[0] && !locationId) setLocationId(locs[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchCustomers(q: string) {
    setCustomerQ(q);
    if (q.trim().length < 2) {
      setCustomerHits([]);
      return;
    }
    try {
      const res = await api<{ data: CustomerRow[] }>(
        `/v1/customers?q=${encodeURIComponent(q)}&limit=8`,
      );
      setCustomerHits(res.data);
    } catch {
      setCustomerHits([]);
    }
  }

  async function createTicket() {
    if (!customer || !issue.trim() || !locationId) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api<Ticket>('/v1/service-orders', {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          customerId: customer.id,
          itemDescription: itemDescription.trim() || undefined,
          issue: issue.trim(),
          warranty,
        }),
      });
      router.push(`/service/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const completed = tickets?.filter((t) => t.status === 'completed').slice(0, 10) ?? [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Service</h1>
        <button onClick={() => setShowIntake((v) => !v)} style={darkBtn} data-testid="new-ticket">
          {showIntake ? 'Close intake' : '+ New ticket'}
        </button>
      </div>
      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      {showIntake && (
        <div style={card} data-testid="intake-form">
          <strong style={{ fontSize: 14 }}>Intake</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <label style={lbl}>
              Location
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={input}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            {/* A <div>, not a <label>: label activation would forward the
                click on a result row to whatever control renders next
                (the "change" button), instantly un-picking the customer. */}
            <div style={lbl}>
              Customer
              {customer ? (
                <div style={{ ...input, display: 'flex', justifyContent: 'space-between' }}>
                  <span data-testid="intake-customer">
                    {customer.firstName} {customer.lastName}
                  </span>
                  <button
                    onClick={() => setCustomer(null)}
                    style={{ border: 'none', background: 'none', color: '#06c', cursor: 'pointer' }}
                  >
                    change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={customerQ}
                    onChange={(e) => void searchCustomers(e.target.value)}
                    placeholder="Search name / email / phone…"
                    style={input}
                    data-testid="intake-customer-search"
                  />
                  {customerHits.length > 0 && (
                    <div style={{ border: '1px solid #ddd', borderRadius: 4, marginTop: 2 }}>
                      {customerHits.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          data-testid="intake-customer-hit"
                          onClick={() => {
                            setCustomer(c);
                            setCustomerHits([]);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 10px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          {c.firstName} {c.lastName} {c.email ? `· ${c.email}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <label style={lbl}>
              Item
              <input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. Queen adjustable base"
                style={input}
                data-testid="intake-item"
              />
            </label>
            <label style={lbl}>
              Issue *
              <input
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="What's wrong?"
                style={input}
                data-testid="intake-issue"
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <label style={{ fontSize: 13, color: '#444' }}>
              <input
                type="checkbox"
                checked={warranty}
                onChange={(e) => setWarranty(e.target.checked)}
                data-testid="intake-warranty"
              />{' '}
              Warranty work (parts & labor price at $0)
            </label>
            <button
              onClick={() => void createTicket()}
              disabled={busy || !customer || !issue.trim()}
              style={darkBtn}
              data-testid="create-ticket"
            >
              Create ticket
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {COLUMNS.map((col) => {
          const rows = tickets?.filter((t) => t.status === col.key) ?? [];
          return (
            <div key={col.key} style={{ background: '#f7f7f7', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: '0 0 8px' }}>
                {col.label} ({rows.length})
              </p>
              {rows.map((t) => (
                <Link
                  key={t.id}
                  href={`/service/${t.id}`}
                  style={{
                    display: 'block',
                    background: '#fff',
                    border: '1px solid #e2e2e2',
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 8,
                    textDecoration: 'none',
                    color: '#222',
                  }}
                  data-testid={`ticket-${t.number}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <strong>{t.number}</strong>
                    {t.warranty && (
                      <span style={{ fontSize: 11, color: '#8a6d1a', fontWeight: 700 }}>
                        WARRANTY
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>{t.customerName}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {t.itemDescription ?? t.issue}
                  </div>
                  {t.balanceDueCents > 0 && (
                    <div style={{ fontSize: 12, color: '#8a2f2f', marginTop: 2 }}>
                      due {formatMoney(t.balanceDueCents)}
                    </div>
                  )}
                </Link>
              ))}
              {rows.length === 0 && <p style={{ fontSize: 12, color: '#aaa' }}>—</p>}
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#666' }}>Recently completed</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {completed.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 8px' }}>
                    <Link href={`/service/${t.id}`} style={{ color: '#06c' }}>
                      {t.number}
                    </Link>
                  </td>
                  <td style={{ padding: '6px 8px' }}>{t.customerName}</td>
                  <td style={{ padding: '6px 8px' }}>{t.itemDescription ?? t.issue}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                    {formatMoney(t.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
const lbl: React.CSSProperties = { fontSize: 12, color: '#444' };
const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  marginTop: 2,
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
