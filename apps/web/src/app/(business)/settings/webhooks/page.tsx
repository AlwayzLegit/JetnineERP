'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  LoadingRows,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
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
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <PageHeader
        title="Outbound webhooks"
        sub={
          <>
            LA Mattress ERP will POST a JSON body to your URL whenever a subscribed event fires.
            Verify the <code>X-Jetnine-Signature</code> header (Stripe-style{' '}
            <code>t=&lt;unix&gt;,v1=&lt;hmacsha256(t.body)&gt;</code>) using the secret shown once
            at create time.
          </>
        }
        actions={
          <Button
            variant={creating ? 'secondary' : 'primary'}
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? 'Cancel' : '+ New endpoint'}
          </Button>
        }
      />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {newSecret && (
        <div
          style={{
            background: 'var(--warning-soft)',
            border: '1px solid var(--warning)',
            color: 'var(--warning-soft-text)',
            padding: 12,
            borderRadius: 'var(--radius)',
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
              fontFamily: 'var(--font-mono)',
            }}
          >
            {newSecret.secret}
          </pre>
          <Button size="sm" variant="secondary" onClick={() => setNewSecret(null)}>
            Got it
          </Button>
        </div>
      )}

      {creating && (
        <Card style={{ maxWidth: 720, marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'grid', gap: 8 }}>
            <Field label="URL *">
              <Input
                name="url"
                type="url"
                placeholder="https://example.com/webhooks/la-mattress-erp"
                required
                style={{ width: '100%' }}
              />
            </Field>
            <Field label="Description (optional)">
              <Input name="description" style={{ width: '100%' }} />
            </Field>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="field-label">Subscribe to events *</legend>
              <label
                style={{
                  display: 'flex',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                  alignItems: 'center',
                }}
              >
                <input
                  type="checkbox"
                  name="events"
                  value="*"
                  style={{ accentColor: 'var(--brand)' }}
                />
                All events (wildcard, including future types)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {eventTypes.map((t) => (
                  <label
                    key={t}
                    style={{ display: 'flex', gap: 6, fontSize: 13, alignItems: 'center' }}
                  >
                    <input
                      type="checkbox"
                      name="events"
                      value={t}
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    <code>{t}</code>
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit" variant="primary" style={{ width: 'fit-content' }}>
              Create endpoint
            </Button>
          </form>
        </Card>
      )}

      <Card>
        {rows == null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState>No webhook endpoints yet.</EmptyState>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Events</th>
                  <th>Health</th>
                  <th>&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ verticalAlign: 'top' }}>
                    <td>
                      <code style={{ wordBreak: 'break-all' }}>{r.url}</code>
                      {r.description && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {r.events.map((e) => (
                        <code
                          key={e}
                          style={{
                            fontSize: 11,
                            background: 'var(--neutral-soft)',
                            padding: '1px 4px',
                            borderRadius: 3,
                            marginRight: 3,
                          }}
                        >
                          {e}
                        </code>
                      ))}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StatusBadge status={r.isActive ? 'active' : 'paused'} />
                        {r.consecutiveFailures > 0 && (
                          <span style={{ color: 'var(--danger)' }}>
                            {r.consecutiveFailures} consecutive failure(s)
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                        {r.totalDeliveries} delivered ·{' '}
                        {r.lastSuccessAt
                          ? `ok ${new Date(r.lastSuccessAt).toLocaleString()}`
                          : 'no success yet'}
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
                        <Button size="sm" variant="ghost" onClick={() => testFire(r)}>
                          Test
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => loadDeliveries(r.id)}>
                          History
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
                          {r.isActive ? 'Pause' : 'Enable'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => destroy(r)}>
                          Delete
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {openEndpointId && (
        <Card
          title="Recent deliveries"
          actions={
            <Button size="sm" variant="ghost" onClick={() => setOpenEndpointId(null)}>
              Close
            </Button>
          }
        >
          {deliveries.length === 0 ? (
            <EmptyState>No deliveries yet.</EmptyState>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => (
                    <tr key={d.id} style={{ verticalAlign: 'top' }}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <code>{d.eventType}</code>
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                        {d.responseStatus != null && (
                          <span style={{ color: 'var(--text-muted)' }}> ({d.responseStatus})</span>
                        )}
                      </td>
                      <td>
                        {d.errorMessage ? (
                          <code style={{ color: 'var(--danger)', fontSize: 11 }}>
                            {d.errorMessage}
                          </code>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
