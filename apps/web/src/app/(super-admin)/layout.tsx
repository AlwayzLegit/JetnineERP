import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';

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
        <strong style={{ fontSize: 16 }}>Jetnine — Super admin</strong>
        <nav style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link href="/admin" style={{ color: '#ccc' }}>
            Metrics
          </Link>
          <Link href="/admin/businesses" style={{ color: '#ccc' }}>
            Businesses
          </Link>
        </nav>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  );
}
