'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

interface Endpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  isActive: boolean;
  consecutiveFailures: number;
  totalDeliveries: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
}
interface Delivery {
  id: string;
  eventType: string;
  status: string;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  lastAttemptAt: string | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const [rows, setRows] = useState<Endpoint[] | null>(null);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<{ id: string; secret: string } | null>(null);
  const [openEndpointId, setOpenEndpointId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  async function load() {
    setError(null);
    try {
      const [list, types] = await Promise.all([
        api<Endpoint[]>('/v1/business/webhooks'),
        api<{ types: string[] }>('/v1/business/webhooks/event-types'),
      ]);
      setRows(list);
      setEventTypes(types.types);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const data = new FormData(e.currentTarget);
      const events = data.getAll('events').map(String);
      if (events.length === 0) throw new Error('Pick at least one event type.');
      const created = await api<Endpoint & { secret: string }>('/v1/business/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: String(data.get('url') ?? ''),
          description: String(data.get('description') ?? '') || null,
          events,
        }),
      });
      setNewSecret({ id: created.id, secret: created.secret });
      e.currentTarget.reset();
      setCreating(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function toggleActive(row: Endpoint) {
    try {
      await api(`/v1/business/webhooks/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function destroy(row: Endpoint) {
    if (!confirm(`Delete webhook for ${row.url}? Delivery history is removed too.`)) return;
    try {
      await api(`/v1/business/webhooks/${row.id}`, { method: 'DELETE' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function testFire(row: Endpoint) {
    try {
      const res = await api<{ status: string }>(`/v1/business/webhooks/${row.id}/test`, {
        method: 'POST',
      });
      alert(
        res.status === 'succeeded'
          ? 'Test event delivered (HTTP 2xx).'
          : `Test event failed: ${res.status}. Inspect deliveries below.`,
      );
      if (openEndpointId === row.id) void loadDeliveries(row.id);
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadDeliveries(id: string) {
    try {
      setDeliveries(await api<Delivery[]>(`/v1/business/webhooks/${id}/deliveries`));
      setOpenEndpointId(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Outbound webhooks</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          style={{ marginLeft: 'auto', ...primaryBtn }}
        >
          {creating ? 'Cancel' : '+ New endpoint'}
        </button>
      </div>

      <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
        LA Mattress ERP will POST a JSON body to your URL whenever a subscribed event fires. Verify
        the <code>X-Jetnine-Signature</code> header (Stripe-style{' '}
        <code>t=&lt;unix&gt;,v1=&lt;hmacsha256(t.body)&gt;</code>) using the secret shown once at
        create time.
      </p>

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {newSecret && (
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #f0a000',
            color: '#5a3500',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <strong>Save this signing secret — it won&apos;t be shown again:</strong>
          <pre
            style={{
              margin: '6px 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontSize: 12,
            }}
          >
            {newSecret.secret}
          </pre>
          <button onClick={() => setNewSecret(null)} style={{ ...linkBtn, fontSize: 12 }}>
            Got it
          </button>
        </div>
      )}

      {creating && (
        <form onSubmit={create} style={{ ...card, display: 'grid', gap: 8, maxWidth: 720 }}>
          <Field label="URL *">
            <input
              name="url"
              type="url"
              placeholder="https://example.com/webhooks/la-mattress-erp"
              required
              style={inputStyle}
            />
          </Field>
          <Field label="Description (optional)">
            <input name="description" style={inputStyle} />
          </Field>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
              Subscribe to events *
            </legend>
            <label
              style={{
                display: 'flex',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              <input type="checkbox" name="events" value="*" />
              All events (wildcard, including future types)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {eventTypes.map((t) => (
                <label key={t} style={{ display: 'flex', gap: 6, fontSize: 13 }}>
                  <input type="checkbox" name="events" value={t} />
                  <code>{t}</code>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" style={primaryBtn}>
            Create endpoint
          </button>
        </form>
      )}

      <div style={card}>
        {rows == null ? (
          <p style={{ color: '#888' }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: '#888' }}>No webhook endpoints yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <Th>URL</Th>
                <Th>Events</Th>
                <Th>Health</Th>
                <Th>&nbsp;</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <Td>
                    <code style={{ wordBreak: 'break-all' }}>{r.url}</code>
                    {r.description && (
                      <div style={{ color: '#666', fontSize: 12 }}>{r.description}</div>
                    )}
                  </Td>
                  <Td>
                    {r.events.map((e) => (
                      <code
                        key={e}
                        style={{
                          fontSize: 11,
                          background: '#f4f4f4',
                          padding: '1px 4px',
                          borderRadius: 3,
                          marginRight: 3,
                        }}
                      >
                        {e}
                      </code>
                    ))}
                  </Td>
                  <Td>
                    <div style={{ fontSize: 12 }}>
                      {r.isActive ? (
                        <span style={{ color: '#070' }}>active</span>
                      ) : (
                        <span style={{ color: '#888' }}>paused</span>
                      )}
                      {r.consecutiveFailures > 0 && (
                        <span style={{ color: '#b00', marginLeft: 6 }}>
                          {r.consecutiveFailures} consecutive failure(s)
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#666', fontSize: 11 }}>
                      {r.totalDeliveries} delivered ·{' '}
                      {r.lastSuccessAt
                        ? `ok ${new Date(r.lastSuccessAt).toLocaleString()}`
                        : 'no success yet'}
                    </div>
                  </Td>
                  <Td>
                    <button onClick={() => testFire(r)} style={linkBtn}>
                      Test
                    </button>{' '}
                    <button onClick={() => loadDeliveries(r.id)} style={linkBtn}>
                      History
                    </button>{' '}
                    <button onClick={() => toggleActive(r)} style={linkBtn}>
                      {r.isActive ? 'Pause' : 'Enable'}
                    </button>{' '}
                    <button onClick={() => destroy(r)} style={linkBtnDanger}>
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openEndpointId && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Recent deliveries</h2>
            <button
              onClick={() => setOpenEndpointId(null)}
              style={{ ...linkBtn, marginLeft: 'auto' }}
            >
              Close
            </button>
          </div>
          {deliveries.length === 0 ? (
            <p style={{ color: '#888', fontSize: 13 }}>No deliveries yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                  <Th>Time</Th>
                  <Th>Event</Th>
                  <Th>Status</Th>
                  <Th>Response</Th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                    <Td>{new Date(d.createdAt).toLocaleString()}</Td>
                    <Td>
                      <code>{d.eventType}</code>
                    </Td>
                    <Td>
                      <span
                        style={{
                          color: d.status === 'succeeded' ? '#070' : '#b00',
                          fontWeight: 600,
                        }}
                      >
                        {d.status}
                      </span>
                      {d.responseStatus != null && (
                        <span style={{ color: '#666' }}> ({d.responseStatus})</span>
                      )}
                    </Td>
                    <Td>
                      {d.errorMessage ? (
                        <code style={{ color: '#b00', fontSize: 11 }}>{d.errorMessage}</code>
                      ) : d.responseBody ? (
                        <code
                          style={{
                            fontSize: 11,
                            display: 'block',
                            maxHeight: 60,
                            overflow: 'auto',
                            wordBreak: 'break-all',
                          }}
                        >
                          {d.responseBody.slice(0, 200)}
                        </code>
                      ) : (
                        '—'
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
const inputStyle = {
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 13,
  width: '100%',
} as const;
const primaryBtn = {
  padding: '6px 12px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#444',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;
const linkBtnDanger = {
  background: 'none',
  border: 'none',
  color: '#b00',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 12,
  padding: 0,
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
      <span style={{ color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}
