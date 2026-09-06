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
        className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <strong style={{ fontSize: 15 }}>
          LA Mattress ERP — <span style={{ color: 'var(--brand)' }}>Super admin</span>
        </strong>
        <nav className="flex flex-wrap gap-4">
          <Link href="/admin" style={navLink}>
            Metrics
          </Link>
          <Link href="/admin/businesses" style={navLink}>
            Accounts
          </Link>
          <Link href="/admin/templates" style={navLink}>
            Templates
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
