'use client';

import { toast } from 'sonner';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  BackLink,
  Button,
  Card,
  KeyValue,
  LoadingRows,
  PageHeader,
  Stack,
  StatusBadge,
} from '@/components/ui';
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

        {sub && (
          <Card
            title="Subscription"
            description="Track your subscription state. Self-serve plan changes are paused while we transition the platform billing model — your super admin will set the plan for now."
          >
            <KeyValue
              rows={[
                { label: 'Status', value: <StatusBadge status={sub.status} /> },
                { label: 'Plan', value: sub.plan },
                { label: 'Locations', value: String(sub.locationCount) },
                ...(sub.trialEndsAt
                  ? [{ label: 'Trial ends', value: new Date(sub.trialEndsAt).toLocaleString() }]
                  : []),
              ]}
            />
          </Card>
        )}
      </Stack>
    </div>
  );
}
