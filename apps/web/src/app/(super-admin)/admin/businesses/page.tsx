'use client';

import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  LinkButton,
  LoadingRows,
  PageHeader,
  Stack,
  StatusBadge,
  TableEmpty,
  TableWrap,
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
      <Stack>
        <CreateBusinessForm onCreated={load} />
        {error && <Alert tone="error">{error}</Alert>}
        {!rows && !error && <LoadingRows />}
        {rows && (
          <Card
            flush
            title="All businesses"
            description={`${rows.length} ${rows.length === 1 ? 'tenant' : 'tenants'}`}
          >
            <TableWrap>
              <table data-testid="businesses-table" className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th className="num">Users</th>
                    <th className="num">Locations</th>
                    <th>Last activity</th>
                    <th className="actions" />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <TableEmpty colSpan={7}>No businesses yet. Create one above.</TableEmpty>
                  )}
                  {rows.map((b) => (
                    <BusinessRow key={b.id} business={b} onChanged={load} />
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        )}
      </Stack>
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
    <Card
      title="Create business"
      description="Provisions the tenant and emails the owner an invitation."
    >
      <form onSubmit={submit}>
        <FormGrid cols={2}>
          <Field label="Name" required>
            <Input name="name" required />
          </Field>
          <Field label="Slug" required hint="Lowercase letters, digits and dashes">
            <Input name="slug" required pattern="[a-z0-9-]+" />
          </Field>
          <Field label="Owner email" required>
            <Input name="ownerEmail" type="email" required />
          </Field>
          <Field label="Owner name (optional)">
            <Input name="ownerName" />
          </Field>
        </FormGrid>
        {error && (
          <Alert tone="error" data-testid="create-error" className="mt-3">
            {error}
          </Alert>
        )}
        {success && (
          <Alert tone="success" data-testid="create-success" className="mt-3">
            {success}
          </Alert>
        )}
        <FormActions>
          <Button type="submit" variant="primary" disabled={submitting}>
            <Building2 size={14} aria-hidden />
            {submitting ? 'Working…' : 'Create + invite owner'}
          </Button>
        </FormActions>
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
  const [pending, setPending] = useState(false);

  async function setStatus(status: 'active' | 'suspended') {
    setPending(true);
    try {
      await api(`/v1/admin/businesses/${business.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
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
      <td className="num">{business.userCount}</td>
      <td className="num">{business.locationCount}</td>
      <td>
        {business.lastActivityAt ? (
          new Date(business.lastActivityAt).toLocaleString()
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td className="actions">
        <LinkButton size="sm" variant="secondary" href={`/admin/businesses/${business.id}`}>
          Open
        </LinkButton>
        {business.status === 'suspended' ? (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus('active')}>
            Unsuspend
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setStatus('suspended')}
          >
            Suspend
          </Button>
        )}
      </td>
    </tr>
  );
}
