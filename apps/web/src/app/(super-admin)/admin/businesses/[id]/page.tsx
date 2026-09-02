'use client';

import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  BackLink,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Stack,
  StatusBadge,
  TableWrap,
} from '@/components/ui';
import { api } from '@/lib/api';

interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  userCount: number;
  locationCount: number;
}

interface Membership {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  roleName: string;
  status: string;
}

export default function BusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [biz, setBiz] = useState<BusinessSummary | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [members, setMembers] = useState<Membership[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      // Until Epic 1.6 ships a dedicated members endpoint we synthesize the
      // list by paging /v1/admin/businesses for the row + a small ad-hoc
      // endpoint won't exist yet. For now we just use the businesses list
      // to find this row.
      const all = await api<BusinessSummary[]>('/v1/admin/businesses');
      const found = all.find((b) => b.id === id);
      setBiz(found ?? null);
      setNotFound(!found);
      setMembers(null); // Members listing is Epic 1.6 territory.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
    // load() captures `id` via closure; we intentionally only refetch when
    // the route param changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function impersonate(userId: string) {
    try {
      await api('/v1/admin/impersonate', {
        method: 'POST',
        body: JSON.stringify({ userId, businessId: id }),
      });
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const eyebrow = <BackLink href="/admin/businesses">All businesses</BackLink>;

  if (error) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title="Business" />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (notFound) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title="Business not found" />
        <Alert tone="error">No business with id {id} exists.</Alert>
      </div>
    );
  }
  if (!biz) return <LoadingRows />;

  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={biz.name}
        meta={<StatusBadge status={biz.status} />}
        sub={
          <>
            slug <code>{biz.slug}</code> · {biz.userCount} {biz.userCount === 1 ? 'user' : 'users'}{' '}
            · {biz.locationCount} {biz.locationCount === 1 ? 'location' : 'locations'}
          </>
        }
      />
      <Stack>
        <Card title="Members">
          {members ? (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="actions" />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.membershipId}>
                      <td>{m.email}</td>
                      <td>{m.roleName}</td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="actions">
                        <Button size="sm" variant="primary" onClick={() => impersonate(m.userId)}>
                          Impersonate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <p className="muted">
              Member listing API is Epic 1.6. Use the user&rsquo;s id directly:
            </p>
          )}
          <DirectImpersonate onSubmit={impersonate} />
        </Card>
      </Stack>
    </div>
  );
}

function DirectImpersonate({ onSubmit }: { onSubmit: (userId: string) => Promise<void> }) {
  const [userId, setUserId] = useState('');
  const [pending, setPending] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!userId) return;
        setPending(true);
        try {
          await onSubmit(userId);
        } finally {
          setPending(false);
        }
      }}
    >
      <FormGrid cols={2}>
        <SectionHeading as="h3" title="Impersonate by user id" />
        <Field label="User id" hint="UUID of the user to sign in as">
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="user uuid to impersonate"
          />
        </Field>
      </FormGrid>
      <FormActions>
        <Button type="submit" variant="primary" disabled={pending || !userId}>
          Impersonate
        </Button>
      </FormActions>
    </form>
  );
}
