'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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
interface PlanRow {
  id: 'starter' | 'pro';
  name: string;
  description: string;
  perLocationCents: number;
}

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    try {
      const [s, p] = await Promise.all([
        api<Subscription>('/v1/billing/subscription'),
        api<PlanRow[]>('/v1/billing/plans'),
      ]);
      setSub(s);
      setPlans(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function subscribe(plan: 'starter' | 'pro') {
    setBusy(true);
    try {
      await api('/v1/billing/subscribe', { method: 'POST', body: JSON.stringify({ plan }) });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  async function changePlan(plan: 'starter' | 'pro') {
    setBusy(true);
    try {
      await api('/v1/billing/subscription', {
        method: 'PATCH',
        body: JSON.stringify({ plan }),
      });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    if (!confirm('Cancel subscription? Your business will go read-only at period end.')) return;
    setBusy(true);
    try {
      await api('/v1/billing/cancel', { method: 'POST' });
      void load();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }
  async function expireTrial() {
    if (!confirm('Force the trial to expire (dev/test only)?')) return;
    setBusy(true);
    try {
      await api('/v1/billing/dev/expire-trial', { method: 'POST' });
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
          <strong>Read-only mode.</strong> Your subscription is <code>{sub.status}</code>
          {sub.trialExpired && ' (trial expired)'}. Pick a plan below to reactivate. Until then,
          sales, refunds, and inventory changes are blocked across the app.
        </div>
      )}

      {sub && (
        <div style={card}>
          <h2 style={section}>Current subscription</h2>
          <Row label="Status" value={sub.status} />
          <Row label="Plan" value={sub.plan} />
          <Row label="Locations" value={String(sub.locationCount)} />
          <Row label="Monthly price" value={`$${(sub.monthlyPriceCents / 100).toFixed(2)}`} />
          {sub.trialEndsAt && (
            <Row label="Trial ends" value={new Date(sub.trialEndsAt).toLocaleString()} />
          )}
          {sub.currentPeriodEnd && (
            <Row label="Period ends" value={new Date(sub.currentPeriodEnd).toLocaleString()} />
          )}
        </div>
      )}

      <div style={card}>
        <h2 style={section}>Plans</h2>
        <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
          Per-location pricing. New businesses start with a 14-day trial. Stripe wiring lands in
          production deployment via <code>STRIPE_SECRET_KEY</code>; in this MVP, subscribing is a
          direct state transition (no payment is collected).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {plans.map((p) => {
            const isCurrent = sub?.plan === p.id && sub.status === 'active';
            return (
              <div
                key={p.id}
                style={{
                  padding: 16,
                  border: isCurrent ? '2px solid #111' : '1px solid #ddd',
                  borderRadius: 6,
                }}
              >
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{p.description}</p>
                <p style={{ fontSize: 14, marginBottom: 12 }}>
                  <strong>${(p.perLocationCents / 100).toFixed(2)}</strong>
                  <span style={{ color: '#666' }}> /month/location</span>
                </p>
                {isCurrent ? (
                  <button disabled style={{ ...primaryBtn, opacity: 0.5 }}>
                    Current plan
                  </button>
                ) : sub?.status === 'active' ? (
                  <button onClick={() => changePlan(p.id)} disabled={busy} style={primaryBtn}>
                    Switch to {p.name}
                  </button>
                ) : (
                  <button onClick={() => subscribe(p.id)} disabled={busy} style={primaryBtn}>
                    Subscribe to {p.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={card}>
        <h2 style={section}>Actions</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sub?.status === 'active' && (
            <button onClick={cancel} disabled={busy} style={dangerBtn}>
              Cancel subscription
            </button>
          )}
          {sub?.status === 'trial' && (
            <button onClick={expireTrial} disabled={busy} style={dangerBtn}>
              Force-expire trial (dev)
            </button>
          )}
        </div>
      </div>
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
