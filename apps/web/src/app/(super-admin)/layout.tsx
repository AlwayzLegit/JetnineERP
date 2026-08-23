import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';

// Same rationale as (business)/layout.tsx — these pages render
// per-user data; static prerender adds nothing and trips
// better-auth's hooks during the export phase.
export const dynamic = 'force-dynamic';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#fafafa' }}>
      <ImpersonationBanner />
      <header
        style={{
          background: '#111',
          color: '#fff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <strong style={{ fontSize: 16 }}>LA Mattress ERP — Super admin</strong>
        <nav style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link href="/admin" style={{ color: '#ccc' }}>
            Metrics
          </Link>
          <Link href="/admin/businesses" style={{ color: '#ccc' }}>
            Businesses
          </Link>
          <Link href="/admin/templates" style={{ color: '#ccc' }}>
            Templates
          </Link>
        </nav>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  );
}
