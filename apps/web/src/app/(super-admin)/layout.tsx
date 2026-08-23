import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';

// Same rationale as (business)/layout.tsx — these pages render
// per-user data; static prerender adds nothing and trips
// better-auth's hooks during the export phase.
export const dynamic = 'force-dynamic';

const navLink = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
} as const;

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <ImpersonationBanner />
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <strong style={{ fontSize: 15 }}>
          LA Mattress ERP — <span style={{ color: 'var(--brand)' }}>Super admin</span>
        </strong>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link href="/admin" style={navLink}>
            Metrics
          </Link>
          <Link href="/admin/businesses" style={navLink}>
            Businesses
          </Link>
          <Link href="/admin/templates" style={navLink}>
            Templates
          </Link>
        </nav>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  );
}
