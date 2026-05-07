import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';

export default function BusinessLayout({ children }: { children: ReactNode }) {
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
        <strong style={{ fontSize: 16 }}>Jetnine — Back office</strong>
        <nav style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <Link href="/dashboard" style={{ color: '#ccc' }}>
            Dashboard
          </Link>
          <Link href="/products" style={{ color: '#ccc' }}>
            Products
          </Link>
          <Link href="/categories" style={{ color: '#ccc' }}>
            Categories
          </Link>
          <Link href="/inventory" style={{ color: '#ccc' }}>
            Inventory
          </Link>
          <Link href="/settings" style={{ color: '#ccc' }}>
            Settings
          </Link>
          <Link href="/locations" style={{ color: '#ccc' }}>
            Locations
          </Link>
          <Link href="/members" style={{ color: '#ccc' }}>
            Members
          </Link>
          <Link href="/roles" style={{ color: '#ccc' }}>
            Roles
          </Link>
          <Link href="/audit" style={{ color: '#ccc' }}>
            Audit log
          </Link>
        </nav>
      </header>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>{children}</main>
    </div>
  );
}
