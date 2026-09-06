'use client';

import { toast } from 'sonner';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  BackLink,
  Button,
  Card,
  Field,
  FormActions,
  FormGrid,
  KeyValue,
  LoadingRows,
  PageHeader,
  Select,
  Stack,
  StatusBadge,
} from '@/components/ui';
import { formatMoney } from '@jetnine/shared';
import { api } from '@/lib/api';

interface StripeStatus {
  connected: boolean;
  stripeAccountId: string | null;
  accountEmail: string | null;
  livemode: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  publishableKey: string | null;
  stubMode: boolean;
}

interface Subscription {
  id: string;
  accountKind: 'agency' | 'saas';
  plan: 'starter' | 'pro';
  status: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt: string | null;
  trialExpired: boolean;
  currentPeriodEnd: string | null;
  paidLocationCount: number;
  locationCount: number;
  monthlyPriceCents: number;
  cancelAtPeriodEnd: string | null;
  readOnly: boolean;
  stripeBilling: {
    configured: boolean;
    stubMode: boolean;
    customerId: string | null;
    subscriptionId: string | null;
  };
}

export default function BillingPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <BillingPageInner />
    </Suspense>
  );
}

function BillingPageInner() {
  const params = useSearchParams();
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const checkout = params?.get('checkout');
    if (checkout === 'success') {
      setBanner({
        kind: 'ok',
        message:
          'Payment received. Your plan activates as soon as Stripe confirms it — usually within a few seconds. Refresh if the status has not changed yet.',
      });
    } else if (checkout === 'cancelled') {
      setBanner({ kind: 'error', message: 'Checkout was cancelled; nothing was charged.' });
    }
    const flag = params?.get('stripe');
    if (flag === 'connected') {
      setBanner({ kind: 'ok', message: 'Stripe connected successfully.' });
    } else if (flag === 'error') {
      setBanner({
        kind: 'error',
        message: `Stripe connection failed: ${params?.get('message') ?? 'unknown error'}`,
      });
    }
  }, [params]);

  async function load() {
    setError(null);
    try {
      const [s, sb] = await Promise.all([
        api<StripeStatus>('/v1/business/stripe'),
        api<Subscription>('/v1/billing/subscription'),
      ]);
      setStripe(s);
      setSub(sb);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const res = await api<{ url: string }>('/v1/business/stripe/connect-url');
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function disconnect() {
    if (
      !confirm(
        'Disconnect Stripe? Card payments at the POS will fall back to manual capture until you reconnect.',
      )
    )
      return;
    setBusy(true);
    try {
      await api('/v1/business/stripe/disconnect', { method: 'POST' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={<BackLink href="/settings">Settings</BackLink>}
        title="Billing"
        sub="Card processing through your own Stripe account, and the plan this business is on."
      />

      <Stack>
        {banner && (
          <Alert tone={banner.kind === 'ok' ? 'success' : 'error'}>{banner.message}</Alert>
        )}

        {error && <Alert tone="error">{error}</Alert>}

        {sub?.readOnly && (
          <Alert tone="warning" title="Read-only mode.">
            Subscription is <code>{sub.status}</code>
            {sub.trialExpired && ' (trial expired)'}. Sales, refunds, and inventory writes are
            blocked until reactivated.
          </Alert>
        )}

        <Card
          title="Stripe"
          description="Connect your Stripe account so card payments at the POS go straight to your bank. Money never touches LA Mattress ERP — we only orchestrate the charge on your behalf."
          actions={
            stripe?.connected ? (
              <Button size="sm" variant="danger" onClick={disconnect} disabled={busy}>
                Disconnect Stripe
              </Button>
            ) : undefined
          }
        >
          {stripe?.stubMode && (
            <Alert tone="warning" title="Stub mode:">
              the API has no <code>STRIPE_SECRET_KEY</code> set, so connecting + charging use
              deterministic fakes. Useful for local dev. Set the env vars in production to flip to
              real Stripe.
            </Alert>
          )}

          {stripe == null ? (
            <LoadingRows rows={2} />
          ) : stripe.connected ? (
            <KeyValue
              rows={[
                { label: 'Connected as', value: stripe.accountEmail ?? '(no email on file)' },
                {
                  label: 'Account',
                  value: `${stripe.stripeAccountId} (${stripe.livemode ? 'live' : 'test'})`,
                },
                { label: 'Charges enabled', value: stripe.chargesEnabled ? 'yes' : 'no' },
                { label: 'Payouts enabled', value: stripe.payoutsEnabled ? 'yes' : 'no' },
              ]}
            />
          ) : (
            <Button variant="primary" onClick={connect} disabled={busy}>
              {busy ? 'Redirecting…' : 'Connect Stripe'}
            </Button>
          )}
        </Card>

        {sub && <SubscriptionCard sub={sub} onChanged={load} />}
      </Stack>
    </div>
  );
}

function SubscriptionCard({
  sub,
  onChanged,
}: {
  sub: Subscription;
  onChanged: () => Promise<void> | void;
}) {
  const [plan, setPlan] = useState<'starter' | 'pro'>(sub.plan);
  const [busy, setBusy] = useState(false);
  const isAgency = sub.accountKind === 'agency';
  const billing = sub.stripeBilling;
  const hasStripeSub = Boolean(billing.subscriptionId);

  async function checkout() {
    setBusy(true);
    try {
      const res = await api<{ url: string; stub: boolean }>('/v1/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function portal() {
    setBusy(true);
    try {
      const res = await api<{ url: string }>('/v1/billing/portal', { method: 'POST' });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const description = isAgency
    ? 'This is the owner’s own operation: it is never billed and never goes read-only.'
    : billing.configured
      ? 'Your plan is billed monthly per location through Stripe. Start or change it here; cards, invoices and cancellation live in the Stripe billing portal.'
      : 'Self-serve plan changes are paused while we transition the platform billing model — your super admin will set the plan for now.';

  return (
    <Card
      title="Subscription"
      description={description}
      actions={
        !isAgency && billing.configured && billing.customerId ? (
          <Button size="sm" variant="secondary" onClick={portal} disabled={busy}>
            {busy ? 'Redirecting…' : 'Manage billing'}
          </Button>
        ) : undefined
      }
    >
      {billing.stubMode && !isAgency && (
        <Alert tone="warning" title="Stub mode:">
          no <code>STRIPE_SECRET_KEY</code>, so checkout and the portal loop straight back here and
          the webhook accepts unsigned events. Set the Stripe Billing env vars in production.
        </Alert>
      )}
      <KeyValue
        rows={[
          { label: 'Status', value: <StatusBadge status={sub.status} /> },
          { label: 'Plan', value: isAgency ? 'house (not billed)' : sub.plan },
          { label: 'Locations', value: String(sub.locationCount) },
          ...(isAgency
            ? []
            : [{ label: 'Monthly', value: `${formatMoney(sub.monthlyPriceCents)} / month` }]),
          ...(sub.trialEndsAt
            ? [{ label: 'Trial ends', value: new Date(sub.trialEndsAt).toLocaleString() }]
            : []),
          ...(sub.currentPeriodEnd
            ? [
                {
                  label: 'Current period ends',
                  value: new Date(sub.currentPeriodEnd).toLocaleString(),
                },
              ]
            : []),
          ...(sub.cancelAtPeriodEnd
            ? [{ label: 'Cancels at', value: new Date(sub.cancelAtPeriodEnd).toLocaleString() }]
            : []),
        ]}
      />
      {!isAgency && billing.configured && (!hasStripeSub || sub.status !== 'active') && (
        <>
          <FormGrid cols={2}>
            <Field label="Plan" hint="Billed per location, monthly">
              <Select value={plan} onChange={(e) => setPlan(e.target.value as 'starter' | 'pro')}>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </Select>
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="button" variant="primary" onClick={checkout} disabled={busy}>
              {busy
                ? 'Redirecting…'
                : hasStripeSub
                  ? 'Reactivate with Stripe'
                  : 'Subscribe with Stripe'}
            </Button>
          </FormActions>
        </>
      )}
    </Card>
  );
}
