import Link from 'next/link';
import type { ReactNode } from 'react';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { ActiveBusinessBadge } from '@/components/active-business-badge';
import { BusinessSettingsProvider } from '@/lib/business-settings';

// Every (business) page calls per-tenant client hooks (the
// settings provider, useSession, etc.) — none of them are useful
// to prerender, and trying to do so trips Next's static export
// when better-auth's React adapter can't get a dispatcher.
export const dynamic = 'force-dynamic';

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <BusinessSettingsProvider>
      <div
        style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#fafafa' }}
      >
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
          <strong style={{ fontSize: 16, whiteSpace: 'nowrap' }}>LA Mattress ERP</strong>
          <ActiveBusinessBadge />
          <nav style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ color: '#ccc' }}>
              Dashboard
            </Link>
            <Link href="/pos" style={{ color: '#ccc' }}>
              POS
            </Link>
            <Link href="/orders" style={{ color: '#ccc' }}>
              Orders
            </Link>
            <Link href="/sales" style={{ color: '#ccc' }}>
              Sales
            </Link>
            <Link href="/shifts" style={{ color: '#ccc' }}>
              Shifts
            </Link>
            <Link href="/reports" style={{ color: '#ccc' }}>
              Reports
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
            <Link href="/purchase-orders" style={{ color: '#ccc' }}>
              Purchasing
            </Link>
            <Link href="/transfers" style={{ color: '#ccc' }}>
              Transfers
            </Link>
            <Link href="/customers" style={{ color: '#ccc' }}>
              Customers
            </Link>
            <Link href="/gift-cards" style={{ color: '#ccc' }}>
              Gift cards
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
    </BusinessSettingsProvider>
  );
}
