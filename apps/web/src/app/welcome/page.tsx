'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type CurrencyCode } from '@jetnine/shared';
import { Button, Field, Input, Select, Skeleton } from '@/components/ui';
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
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

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
          slug: slugify(String(data.get('slug') ?? '') || String(data.get('name') ?? '')),
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
        <div style={{ display: 'grid', gap: 10 }}>
          <Skeleton style={{ height: 28, width: 220 }} />
          <Skeleton style={{ height: 48 }} />
          <Skeleton style={{ height: 48 }} />
        </div>
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
              style={rowBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }}
            >
              <strong>{m.businessName}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                <code>{m.businessSlug}</code> · {m.roleName}
              </div>
            </button>
          ))}
        </div>
        <p style={{ marginTop: 24, fontSize: 13 }}>
          Need a new one?{' '}
          <LinkishButton onClick={() => setMemberships([])}>Create a new business</LinkishButton>.
        </p>
      </Wrapper>
    );
  }

  // memberships is empty (or hidden) → create form.
  return (
    <Wrapper>
      <h1 style={h1}>Welcome to LA Mattress ERP</h1>
      <p style={muted}>Set up your business in under a minute. You can change everything later.</p>

      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

      <form onSubmit={createBusiness} className="card" style={{ display: 'grid', gap: 12 }}>
        <Field label="Business name *">
          <Input
            name="name"
            required
            placeholder="Acme Coffee"
            style={{ width: '100%' }}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field label="URL slug *">
          <Input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value, { keepTrailingHyphen: true }));
            }}
            onBlur={(e) => setSlug(slugify(e.target.value))}
            placeholder="acme-coffee"
            style={{ width: '100%' }}
          />
          <span style={hint}>
            Follows the name automatically — lowercase letters, numbers, hyphens.
          </span>
        </Field>
        <Field label="Currency">
          <Select name="currencyCode" defaultValue="USD" style={{ width: '100%' }}>
            {SUPPORTED_CURRENCIES.map((c: CurrencyCode) => (
              <option key={c} value={c}>
                {c} — {CURRENCY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default tax rate (%)">
          <Input
            name="taxRate"
            type="number"
            step="0.01"
            min={0}
            defaultValue="0"
            style={{ width: '100%' }}
          />
          <span style={hint}>
            You can override per-product (tax classes) or per-location later. Leave 0 if your
            jurisdiction is tax-exempt.
          </span>
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={creating}
          style={{ width: 'fit-content' }}
        >
          <Building2 size={14} aria-hidden />
          {creating ? 'Creating…' : 'Create business'}
        </Button>
      </form>

      {memberships && memberships.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <LinkishButton onClick={() => setMemberships(memberships)}>
            ← Back to picker
          </LinkishButton>
        </p>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
        Already received an invite link? <Link href="/accept-invite">Accept invite</Link>
      </p>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[520px] px-4 py-8 sm:py-16">
      {children}
      {/* Business-less users land here (dashboard redirects them), so
          this page needs its own way out of the account. */}
      <p style={{ marginTop: 24 }}>
        <SignOutButton />
      </p>
    </main>
  );
}

function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const { signOut } = await import('@/lib/auth-client');
        await signOut();
        window.location.href = '/login';
      }}
    >
      Sign out
    </Button>
  );
}

function LinkishButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'var(--brand)',
        textDecoration: 'underline',
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

const h1 = { fontSize: 24, margin: '0 0 8px' } as const;
const muted = { color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 16px' } as const;
const rowBtn = {
  padding: '12px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-sm)',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
  color: 'var(--text)',
  textAlign: 'left' as const,
  transition: 'border-color 0.12s ease',
} as const;
const hint = { color: 'var(--text-muted)', fontSize: 11, marginTop: 2, display: 'block' } as const;

/**
 * Whatever a person types becomes a valid slug instead of a 400 from the
 * API: lowercase, spaces and punctuation collapse to single hyphens, no
 * leading/trailing hyphen. `keepTrailingHyphen` leaves a trailing hyphen
 * alone mid-typing so "la-" doesn't snap back to "la" between keystrokes.
 */
function slugify(raw: string, opts?: { keepTrailingHyphen?: boolean }): string {
  let out = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '');
  if (!opts?.keepTrailingHyphen) out = out.replace(/-+$/, '');
  return out.slice(0, 64);
}
