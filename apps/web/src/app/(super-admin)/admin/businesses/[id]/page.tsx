'use client';

import { toast } from 'sonner';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { formatMoney } from '@jetnine/shared';
import {
  Alert,
  BackLink,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  Input,
  KeyValue,
  LoadingRows,
  PageHeader,
  SectionHeading,
  Select,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
  TableEmpty,
  TableWrap,
} from '@/components/ui';
import { api } from '@/lib/api';

type AccountKind = 'agency' | 'saas';
type PlanId = 'starter' | 'pro';
type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

interface AccountDetail {
  id: string;
  slug: string;
  name: string;
  accountKind: AccountKind;
  status: string;
  plan: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  readOnly: boolean;
  mrrCents: number;
  userCount: number;
  locationCount: number;
  lastActivityAt: string | null;
  lastPaidAt: string | null;
  createdAt: string;
  subscription: {
    plan: string;
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: string | null;
    paidLocationCount: number;
    perLocationCents: number | null;
  };
  usage: {
    locations: number;
    members: number;
    products: number;
    customers: number;
    ordersLast30d: number;
    salesLast30d: { count: number; grossCents: number };
    lastActivityAt: string | null;
  };
  payments: { count: number; totalPaidCents: number; lastPaidAt: string | null };
}

interface Member {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  roleName: string;
  status: string;
  isSuperAdmin: boolean;
  joinedAt: string;
}

interface Payment {
  id: string;
  amountCents: number;
  currencyCode: string;
  status: string;
  method: string;
  periodStart: string | null;
  periodEnd: string | null;
  reference: string | null;
  note: string | null;
  paidAt: string;
}

const KIND_LABEL: Record<AccountKind, string> = { agency: 'Agency', saas: 'SaaS' };

function when(value: string | null | undefined, fallback = '—'): string {
  return value ? new Date(value).toLocaleString() : fallback;
}

export default function BusinessDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [detail, m, p] = await Promise.all([
        api<AccountDetail>(`/v1/admin/accounts/${id}`),
        api<Member[]>(`/v1/admin/accounts/${id}/members`),
        api<Payment[]>(`/v1/admin/accounts/${id}/payments`),
      ]);
      setAccount(detail);
      setMembers(m);
      setPayments(p);
      setNotFound(false);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404) setNotFound(true);
      else setError(err instanceof Error ? err.message : String(err));
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

  const eyebrow = <BackLink href="/admin/businesses">All accounts</BackLink>;

  if (error) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title="Account" />
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }
  if (notFound) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title="Account not found" />
        <Alert tone="error">No business with id {id} exists.</Alert>
      </div>
    );
  }
  if (!account) return <LoadingRows />;

  const isAgency = account.accountKind === 'agency';

  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={account.name}
        meta={
          <>
            <span className={`badge ${isAgency ? 'badge-brand' : 'badge-neutral'}`}>
              {KIND_LABEL[account.accountKind]}
            </span>{' '}
            <StatusBadge status={account.subscriptionStatus} />
            {account.readOnly && (
              <span className="badge badge-danger" style={{ marginLeft: 6 }}>
                read-only
              </span>
            )}
          </>
        }
        sub={
          <>
            slug <code>{account.slug}</code> · created {when(account.createdAt)} · last activity{' '}
            {when(account.lastActivityAt, 'never')}
          </>
        }
      />
      <Stack>
        {account.readOnly && (
          <Alert tone="error">
            Writes are blocked for this account: members see &ldquo;Subscription required&rdquo; on
            every save. Activate a plan or record a payment below to restore them.
          </Alert>
        )}

        <AccountKindCard account={account} onChanged={load} />

        <Card
          title="Resources"
          description="What this account is using. Counted, not enforced — plan limits are a follow-up."
        >
          <StatGrid cols={4}>
            <StatTile label="Locations" value={account.usage.locations} />
            <StatTile label="Users" value={account.usage.members} />
            <StatTile label="Products" value={account.usage.products} />
            <StatTile label="Customers" value={account.usage.customers} />
            <StatTile label="Orders (30d)" value={account.usage.ordersLast30d} />
            <StatTile
              label="POS sales (30d)"
              value={formatMoney(account.usage.salesLast30d.grossCents)}
              sub={`${account.usage.salesLast30d.count} sales`}
            />
            <StatTile
              label={isAgency ? 'Billing' : 'MRR'}
              value={isAgency ? 'house' : formatMoney(account.mrrCents)}
              sub={
                isAgency
                  ? 'never billed'
                  : account.subscription.perLocationCents != null
                    ? `${formatMoney(account.subscription.perLocationCents)}/location`
                    : 'no plan'
              }
            />
            <StatTile
              label="Paid to date"
              value={formatMoney(account.payments.totalPaidCents)}
              sub={`${account.payments.count} payments`}
            />
          </StatGrid>
        </Card>

        <SubscriptionCard account={account} onChanged={load} />

        <Card
          title="Users"
          description="Everyone who can sign in to this account. Impersonate to see the app exactly as they do."
        >
          {members ? (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="actions" />
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 && <TableEmpty colSpan={6}>No members yet.</TableEmpty>}
                  {members.map((m) => (
                    <tr key={m.membershipId}>
                      <td>
                        {m.email}
                        {m.isSuperAdmin && (
                          <span className="badge badge-brand" style={{ marginLeft: 6 }}>
                            super admin
                          </span>
                        )}
                      </td>
                      <td>{m.name ?? <span className="muted">—</span>}</td>
                      <td>{m.roleName}</td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td>{when(m.joinedAt)}</td>
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
            <LoadingRows />
          )}
          <DirectImpersonate onSubmit={impersonate} />
        </Card>

        <PaymentsCard account={account} payments={payments} onChanged={load} />
      </Stack>
    </div>
  );
}

function AccountKindCard({
  account,
  onChanged,
}: {
  account: AccountDetail;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const isAgency = account.accountKind === 'agency';

  async function setKind(accountKind: AccountKind) {
    const message = isAgency
      ? 'Convert to a SaaS account? It goes back on the trial / plan lifecycle and can be blocked when its subscription lapses.'
      : 'Mark as an agency (house) account? It will never be billed and never go read-only.';
    if (!window.confirm(message)) return;
    setPending(true);
    try {
      await api(`/v1/admin/accounts/${account.id}/kind`, {
        method: 'PATCH',
        body: JSON.stringify({ accountKind }),
      });
      toast.success(`Now a ${KIND_LABEL[accountKind]} account`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card
      title="Account kind"
      description="Agency = your own operation (LA Mattress): never billed, never blocked. SaaS = a paying tenant on the trial → plan lifecycle."
      actions={
        <Button
          size="sm"
          variant={isAgency ? 'secondary' : 'primary'}
          disabled={pending}
          onClick={() => setKind(isAgency ? 'saas' : 'agency')}
        >
          {pending ? 'Working…' : isAgency ? 'Convert to SaaS' : 'Mark as agency'}
        </Button>
      }
    >
      <KeyValue
        rows={[
          { label: 'Kind', value: KIND_LABEL[account.accountKind] },
          { label: 'Business status', value: <StatusBadge status={account.status} /> },
          { label: 'Plan', value: isAgency ? 'house (not billed)' : (account.plan ?? 'none') },
        ]}
      />
    </Card>
  );
}

function SubscriptionCard({
  account,
  onChanged,
}: {
  account: AccountDetail;
  onChanged: () => Promise<void>;
}) {
  const [plan, setPlan] = useState<PlanId>('starter');
  const [pending, setPending] = useState(false);
  const isAgency = account.accountKind === 'agency';
  const sub = account.subscription;

  useEffect(() => {
    if (sub.plan === 'starter' || sub.plan === 'pro') setPlan(sub.plan);
  }, [sub.plan]);

  async function activate() {
    setPending(true);
    try {
      await api(`/v1/admin/businesses/${account.id}/subscription`, {
        method: 'PATCH',
        body: JSON.stringify({ plan }),
      });
      toast.success(`Subscription active on ${plan} — no end date`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card
      title="Subscription"
      description={
        isAgency
          ? 'Agency accounts are never billed. Nothing to manage here unless you convert it to SaaS.'
          : 'Self-serve billing is paused, so plans are set here. Activating puts the account on the chosen plan with no trial or period end.'
      }
    >
      <KeyValue
        rows={[
          { label: 'Status', value: <StatusBadge status={sub.status} /> },
          { label: 'Plan', value: isAgency ? 'house' : sub.plan },
          { label: 'Trial ends', value: when(sub.trialEndsAt, 'n/a') },
          {
            label: 'Period',
            value: `${when(sub.currentPeriodStart, '—')} → ${when(sub.currentPeriodEnd, 'never')}`,
          },
          ...(sub.cancelAtPeriodEnd
            ? [{ label: 'Cancels at', value: when(sub.cancelAtPeriodEnd) }]
            : []),
          {
            label: 'Billed locations',
            value: `${sub.paidLocationCount} on last renewal · ${account.locationCount} now`,
          },
        ]}
      />
      {!isAgency && (
        <>
          <FormGrid cols={2}>
            <Field label="Plan">
              <Select value={plan} onChange={(e) => setPlan(e.target.value as PlanId)}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </Select>
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="button" variant="primary" disabled={pending} onClick={activate}>
              {pending ? 'Activating…' : 'Activate plan (no end date)'}
            </Button>
          </FormActions>
        </>
      )}
    </Card>
  );
}

function PaymentsCard({
  account,
  payments,
  onChanged,
}: {
  account: AccountDetail;
  payments: Payment[] | null;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const isAgency = account.accountKind === 'agency';

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const dollars = Number(String(data.get('amount') ?? '0'));
    if (!Number.isFinite(dollars) || dollars < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setPending(true);
    try {
      await api(`/v1/admin/accounts/${account.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amountCents: Math.round(dollars * 100),
          method: String(data.get('method') ?? 'manual'),
          status: String(data.get('status') ?? 'paid'),
          periodStart: String(data.get('periodStart') ?? '') || null,
          periodEnd: String(data.get('periodEnd') ?? '') || null,
          reference: String(data.get('reference') ?? '') || null,
          note: String(data.get('note') ?? '') || null,
        }),
      });
      toast.success('Payment recorded');
      form.reset();
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card
      title="Payments"
      description={
        isAgency
          ? 'Agency accounts are not billed, so there is no payment ledger.'
          : 'Everything this account has paid toward its subscription. A paid entry marks the subscription active and stamps the period it covers.'
      }
    >
      {payments ? (
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>Paid</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Covers</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <TableEmpty colSpan={6}>
                  {isAgency ? 'Never billed.' : 'No payments recorded yet.'}
                </TableEmpty>
              )}
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{when(p.paidAt)}</td>
                  <td className="num">{formatMoney(p.amountCents)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{p.method}</td>
                  <td>
                    {p.periodStart || p.periodEnd
                      ? `${when(p.periodStart, '…')} → ${when(p.periodEnd, '…')}`
                      : '—'}
                  </td>
                  <td>
                    {p.reference ?? <span className="muted">—</span>}
                    {p.note && <div className="muted">{p.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <LoadingRows />
      )}
      {!isAgency && (
        <form onSubmit={submit}>
          <FormGrid cols={3}>
            <SectionHeading as="h3" title="Record a payment" />
            <Field label="Amount ($)" required>
              <Input name="amount" type="number" min={0} step="0.01" required />
            </Field>
            <Field label="Method">
              <Select name="method" defaultValue="manual">
                <option value="manual">Manual (check / bank / card on file)</option>
                <option value="comp">Comped</option>
                <option value="stripe">Stripe</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue="paid">
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </Select>
            </Field>
            <Field label="Period start">
              <Input name="periodStart" type="date" />
            </Field>
            <Field label="Period end" hint="Stamped on the subscription for a paid entry">
              <Input name="periodEnd" type="date" />
            </Field>
            <Field label="Reference" hint="Check #, invoice id, bank ref">
              <Input name="reference" />
            </Field>
            <Field label="Note">
              <Input name="note" />
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? 'Saving…' : 'Record payment'}
            </Button>
          </FormActions>
        </form>
      )}
    </Card>
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
        <Field label="User id" hint="UUID of a user who is not listed above">
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
