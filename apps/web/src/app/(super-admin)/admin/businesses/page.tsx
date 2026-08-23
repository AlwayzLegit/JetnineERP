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

interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  createdAt: string;
  userCount: number;
  locationCount: number;
  lastActivityAt: string | null;
}

export default function BusinessesPage() {
  const [rows, setRows] = useState<BusinessSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setRows(await api<BusinessSummary[]>('/v1/admin/businesses'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Businesses" />
      <CreateBusinessForm onCreated={load} />
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {!rows && !error && (
        <div style={{ marginTop: 24 }}>
          <LoadingRows />
        </div>
      )}
      {rows && (
        <Card style={{ padding: 0, marginTop: 24, overflowX: 'auto' }}>
          <table data-testid="businesses-table" className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Users</th>
                <th>Locations</th>
                <th>Last activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState>No businesses yet. Create one above.</EmptyState>
                  </td>
                </tr>
              )}
              {rows.map((b) => (
                <BusinessRow key={b.id} business={b} onChanged={load} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function CreateBusinessForm({ onCreated }: { onCreated: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = new FormData(e.currentTarget);
      const result = await api<{ businessId: string }>('/v1/admin/businesses', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          slug: String(data.get('slug') ?? ''),
          ownerEmail: String(data.get('ownerEmail') ?? ''),
          ownerName: String(data.get('ownerName') ?? ''),
        }),
      });
      setSuccess(`Created ${result.businessId}. Invitation sent.`);
      e.currentTarget.reset();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Create business">
      <form onSubmit={submit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <Field label="Name">
            <Input name="name" required style={{ width: '100%' }} />
          </Field>
          <Field label="Slug">
            <Input name="slug" required pattern="[a-z0-9-]+" style={{ width: '100%' }} />
          </Field>
          <Field label="Owner email">
            <Input name="ownerEmail" type="email" required style={{ width: '100%' }} />
          </Field>
          <Field label="Owner name (optional)">
            <Input name="ownerName" style={{ width: '100%' }} />
          </Field>
        </div>
        {error && (
          <p
            data-testid="create-error"
            style={{ color: 'var(--danger)', marginTop: 8, marginBottom: 0, fontSize: 13 }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            data-testid="create-success"
            style={{ color: 'var(--success)', marginTop: 8, marginBottom: 0, fontSize: 13 }}
          >
            {success}
          </p>
        )}
        <div style={{ marginTop: 12 }}>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Working…' : 'Create + invite owner'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BusinessRow({
  business,
  onChanged,
}: {
  business: BusinessSummary;
  onChanged: () => void;
}) {
  async function setStatus(status: 'active' | 'suspended') {
    try {
      await api(`/v1/admin/businesses/${business.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <tr>
      <td>
        <strong>{business.name}</strong>
      </td>
      <td>
        <code>{business.slug}</code>
      </td>
      <td>
        <StatusBadge status={business.status} />
      </td>
      <td>{business.userCount}</td>
      <td>{business.locationCount}</td>
      <td>
        {business.lastActivityAt ? (
          new Date(business.lastActivityAt).toLocaleString()
        ) : (
          <em style={{ color: 'var(--text-muted)' }}>—</em>
        )}
      </td>
      <td>
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <Link href={`/admin/businesses/${business.id}`}>Open</Link>
          {business.status === 'suspended' ? (
            <Button size="sm" variant="ghost" onClick={() => setStatus('active')}>
              Unsuspend
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setStatus('suspended')}>
              Suspend
            </Button>
          )}
        </span>
      </td>
    </tr>
  );
}
