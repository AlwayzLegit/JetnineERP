'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from '@jetnine/shared';
import { api } from '@/lib/api';

interface MembershipSummary {
  businessId: string;
  businessSlug: string;
  businessName: string;
  roleName: string;
  status: string;
}

/**
 * Landing for a freshly-signed-up user. Three branches:
 *
 *   1. They already have memberships → render a picker; selecting
 *      one sets the active-business cookie and bounces to /dashboard.
 *   2. They have zero memberships → render the create-your-business
 *      form. Submitting calls POST /v1/onboarding/business and lands
 *      them in their new business as Owner.
 *   3. Loading or signed-out → tiny placeholders.
 */
export default function WelcomePage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<MembershipSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const me = await api<{ memberships: MembershipSummary[] }>('/v1/auth/me');
        setMemberships(me.memberships.filter((m) => m.status === 'active'));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  async function pick(businessId: string) {
    try {
      await api('/v1/auth/active-business', {
        method: 'POST',
        body: JSON.stringify({ businessId }),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function createBusiness(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const data = new FormData(e.currentTarget);
      const created = await api<{ businessId: string }>('/v1/onboarding/business', {
        method: 'POST',
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          slug: String(data.get('slug') ?? ''),
          currencyCode: String(data.get('currencyCode') ?? 'USD'),
          defaultTaxRateBps: Math.round(Number(data.get('taxRate') ?? 0) * 100),
        }),
      });
      // Set the new business as active so the dashboard's first
      // render lands inside it.
      await api('/v1/auth/active-business', {
        method: 'POST',
        body: JSON.stringify({ businessId: created.businessId }),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCreating(false);
    }
  }

  if (memberships == null && !error) {
    return (
      <Wrapper>
        <p>Loading…</p>
      </Wrapper>
    );
  }

  if (memberships && memberships.length > 0) {
    return (
      <Wrapper>
        <h1 style={h1}>Pick a business</h1>
        <p style={muted}>You belong to {memberships.length} businesses. Pick one to continue.</p>
        <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
          {memberships.map((m) => (
            <button
              key={m.businessId}
              onClick={() => void pick(m.businessId)}
              style={{
                ...rowBtn,
                textAlign: 'left',
              }}
            >
              <strong>{m.businessName}</strong>
              <div style={{ color: '#666', fontSize: 12 }}>
                <code>{m.businessSlug}</code> · {m.roleName}
              </div>
            </button>
          ))}
        </div>
        <p style={{ marginTop: 24, fontSize: 13 }}>
          Need a new one?{' '}
          <button
            onClick={() => setMemberships([])}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#0050b3',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Create a new business
          </button>
          .
        </p>
      </Wrapper>
    );
  }

  // memberships is empty (or hidden) → create form.
  return (
    <Wrapper>
      <h1 style={h1}>Welcome to LA Mattress ERP</h1>
      <p style={muted}>Set up your business in under a minute. You can change everything later.</p>

      {error && <p style={{ color: '#b00', fontSize: 13 }}>{error}</p>}

      <form onSubmit={createBusiness} style={card}>
        <Field label="Business name *">
          <input name="name" required placeholder="Acme Coffee" style={input} />
        </Field>
        <Field label="URL slug *">
          <input
            name="slug"
            required
            pattern="[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
            placeholder="acme-coffee"
            style={input}
          />
          <span style={hint}>Lowercase letters, numbers, hyphens. Used as a stable id.</span>
        </Field>
        <Field label="Currency">
          <select name="currencyCode" defaultValue="USD" style={input}>
            {SUPPORTED_CURRENCIES.map((c: CurrencyCode) => (
              <option key={c} value={c}>
                {c} — {CURRENCY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Default tax rate (%)">
          <input name="taxRate" type="number" step="0.01" min={0} defaultValue="0" style={input} />
          <span style={hint}>
            You can override per-product (tax classes) or per-location later. Leave 0 if your
            jurisdiction is tax-exempt.
          </span>
        </Field>
        <button type="submit" disabled={creating} style={primaryBtn}>
          {creating ? 'Creating…' : 'Create business'}
        </button>
      </form>

      {memberships && memberships.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <button
            onClick={() => setMemberships(memberships)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#0050b3',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ← Back to picker
          </button>
        </p>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: '#888' }}>
        Already received an invite link?{' '}
        <Link href="/accept-invite" style={{ color: '#0050b3' }}>
          Accept invite
        </Link>
      </p>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 520,
        margin: '64px auto',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {children}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
      <span style={{ color: '#444' }}>{label}</span>
      {children}
    </label>
  );
}

const h1 = { fontSize: 24, marginBottom: 8 } as const;
const muted = { color: '#666', fontSize: 14, marginBottom: 16 } as const;
const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  display: 'grid',
  gap: 12,
} as const;
const input = {
  padding: '8px 10px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box' as const,
} as const;
const primaryBtn = {
  padding: '10px 16px',
  background: '#111',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14,
  width: 'fit-content',
} as const;
const rowBtn = {
  padding: '12px 16px',
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 14,
} as const;
const hint = { color: '#888', fontSize: 11, marginTop: 2 } as const;
