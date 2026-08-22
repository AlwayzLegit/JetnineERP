'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
    <Suspense fallback={<p>Loading…</p>}>
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
      alert(err instanceof Error ? err.message : String(err));
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
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/settings">← Settings</Link>
      </p>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Billing</h1>

      {banner && (
        <div
          style={{
            background: banner.kind === 'ok' ? '#e6f5e9' : '#fdecea',
            border: `1px solid ${banner.kind === 'ok' ? '#3a8a4d' : '#b00'}`,
            color: banner.kind === 'ok' ? '#1f5c2e' : '#7a0c0c',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {banner.message}
        </div>
      )}

      {error && <p style={{ color: '#b00' }}>{error}</p>}

      {sub?.readOnly && (
        <div
          style={{
            background: '#fff3e0',
            border: '1px solid #f0a000',
            color: '#7a4a00',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <strong>Read-only mode.</strong> Subscription is <code>{sub.status}</code>
          {sub.trialExpired && ' (trial expired)'}. Sales, refunds, and inventory writes are blocked
          until reactivated.
        </div>
      )}

      <div style={card}>
        <h2 style={section}>Stripe</h2>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          Connect your Stripe account so card payments at the POS go straight to your bank. Money
          never touches LA Mattress ERP — we only orchestrate the charge on your behalf.
        </p>

        {stripe?.stubMode && (
          <p
            style={{
              color: '#7a4a00',
              fontSize: 12,
              background: '#fff8e1',
              padding: 8,
              borderRadius: 4,
              marginBottom: 12,
            }}
          >
            <strong>Stub mode:</strong> the API has no <code>STRIPE_SECRET_KEY</code> set, so
            connecting + charging use deterministic fakes. Useful for local dev. Set the env vars in
            production to flip to real Stripe.
          </p>
        )}

        {stripe?.connected ? (
          <>
            <Row label="Connected as" value={stripe.accountEmail ?? '(no email on file)'} />
            <Row
              label="Account"
              value={`${stripe.stripeAccountId} (${stripe.livemode ? 'live' : 'test'})`}
            />
            <Row label="Charges enabled" value={stripe.chargesEnabled ? 'yes' : 'no'} />
            <Row label="Payouts enabled" value={stripe.payoutsEnabled ? 'yes' : 'no'} />
            <div style={{ marginTop: 12 }}>
              <button onClick={disconnect} disabled={busy} style={dangerBtn}>
                Disconnect Stripe
              </button>
            </div>
          </>
        ) : (
          <button onClick={connect} disabled={busy} style={primaryBtn}>
            {busy ? 'Redirecting…' : 'Connect Stripe'}
          </button>
        )}
      </div>

      {sub && (
        <div style={card}>
          <h2 style={section}>Subscription</h2>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
            Track your subscription state. Self-serve plan changes are paused while we transition
            the platform billing model — your super admin will set the plan for now.
          </p>
          <Row label="Status" value={sub.status} />
          <Row label="Plan" value={sub.plan} />
          <Row label="Locations" value={String(sub.locationCount)} />
          {sub.trialEndsAt && (
            <Row label="Trial ends" value={new Date(sub.trialEndsAt).toLocaleString()} />
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
const section = { fontSize: 16, marginBottom: 12, marginTop: 0 } as const;
const primaryBtn = {
  padding: '8px 14px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;
const dangerBtn = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#b00',
  border: '1px solid #b00',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 13,
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        marginBottom: 4,
      }}
    >
      <span style={{ color: '#666' }}>{label}</span>
      <span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}
