'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';
import { Button, Card, Field, Input, LoadingRows, PageHeader, Select } from '@/components/ui';

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
      <PageHeader
        title="Service"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowIntake((v) => !v)}
            data-testid="new-ticket"
          >
            {showIntake ? 'Close intake' : '+ New ticket'}
          </Button>
        }
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      {showIntake && (
        <Card title="Intake" style={{ marginBottom: 16 }} data-testid="intake-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Location">
              <Select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                style={{ width: '100%' }}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </Field>
            {/* A <div>, not a <label>: label activation would forward the
                click on a result row to whatever control renders next
                (the "change" button), instantly un-picking the customer. */}
            <div>
              <span className="field-label">Customer</span>
              {customer ? (
                <div
                  className="input"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <span data-testid="intake-customer">
                    {customer.firstName} {customer.lastName}
                  </span>
                  <button
                    onClick={() => setCustomer(null)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--brand)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 0,
                    }}
                  >
                    change
                  </button>
                </div>
              ) : (
                <>
                  <Input
                    value={customerQ}
                    onChange={(e) => void searchCustomers(e.target.value)}
                    placeholder="Search name / email / phone…"
                    style={{ width: '100%' }}
                    data-testid="intake-customer-search"
                  />
                  {customerHits.length > 0 && (
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
                      {customerHits.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          data-testid="intake-customer-hit"
                          onClick={() => {
                            setCustomer(c);
                            setCustomerHits([]);
                          }}
                          style={hitBtn}
                        >
                          {c.firstName} {c.lastName} {c.email ? `· ${c.email}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <Field label="Item">
              <Input
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. Queen adjustable base"
                style={{ width: '100%' }}
                data-testid="intake-item"
              />
            </Field>
            <Field label="Issue *">
              <Input
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="What's wrong?"
                style={{ width: '100%' }}
                data-testid="intake-issue"
              />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={warranty}
                onChange={(e) => setWarranty(e.target.checked)}
                data-testid="intake-warranty"
              />{' '}
              Warranty work (parts & labor price at $0)
            </label>
            <Button
              variant="primary"
              onClick={() => void createTicket()}
              disabled={busy || !customer || !issue.trim()}
              data-testid="create-ticket"
            >
              Create ticket
            </Button>
          </div>
        </Card>
      )}

      {!tickets && !error && <LoadingRows rows={4} />}

      {tickets && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {COLUMNS.map((col) => {
            const rows = tickets.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                style={{
                  background: 'var(--neutral-soft)',
                  borderRadius: 'var(--radius)',
                  padding: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    margin: '0 0 8px',
                    padding: '2px 4px',
                  }}
                >
                  {col.label} ({rows.length})
                </p>
                {rows.map((t) => (
                  <Link
                    key={t.id}
                    href={`/service/${t.id}`}
                    className="card"
                    style={{
                      display: 'block',
                      padding: 10,
                      margin: '0 0 8px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                    data-testid={`ticket-${t.number}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <strong>{t.number}</strong>
                      {t.warranty && <span className="badge badge-warning">WARRANTY</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {t.customerName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {t.itemDescription ?? t.issue}
                    </div>
                    {t.balanceDueCents > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 2 }}>
                        due {formatMoney(t.balanceDueCents)}
                      </div>
                    )}
                  </Link>
                ))}
                {rows.length === 0 && (
                  <p className="muted" style={{ fontSize: 12, padding: '2px 4px', margin: 0 }}>
                    —
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <Card title="Recently completed" style={{ marginTop: 20 }}>
          <table className="table">
            <tbody>
              {completed.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/service/${t.id}`}>{t.number}</Link>
                  </td>
                  <td>{t.customerName}</td>
                  <td>{t.itemDescription ?? t.issue}</td>
                  <td className="num">{formatMoney(t.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
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
