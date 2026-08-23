'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ActiveBusinessBadge } from '@/components/active-business-badge';

/**
 * The (business) application shell: grouped sidebar + slim topbar.
 * Sidebar highlights the active section from the pathname; on narrow
 * screens it collapses behind a hamburger.
 */

interface NavItem {
  href: string;
  label: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: 'Sell',
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/pos', label: 'POS' },
      { href: '/orders', label: 'Orders' },
      { href: '/deliveries', label: 'Deliveries' },
      { href: '/service', label: 'Service' },
      { href: '/special-orders', label: 'Special orders' },
      { href: '/sales', label: 'Sales' },
      { href: '/shifts', label: 'Shifts' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products', label: 'Products' },
      { href: '/categories', label: 'Categories' },
      { href: '/inventory', label: 'Inventory' },
      { href: '/purchase-orders', label: 'Purchasing' },
      { href: '/transfers', label: 'Transfers' },
      { href: '/gift-cards', label: 'Gift cards' },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/customers', label: 'Customers' },
      { href: '/members', label: 'Members' },
      { href: '/roles', label: 'Roles' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports', label: 'Reports' },
      { href: '/audit', label: 'Audit log' },
    ],
  },
  {
    label: 'Configure',
    items: [
      { href: '/settings', label: 'Settings' },
      { href: '/locations', label: 'Locations' },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div style={{ minHeight: '100vh' }}>
      <aside
        className="app-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: 'var(--sidebar-width)',
          background: 'var(--sidebar-bg)',
          overflowY: 'auto',
          padding: '16px 12px 24px',
          zIndex: 40,
          transition: 'transform 0.15s ease',
          transform: open ? 'translateX(0)' : undefined,
        }}
        data-open={open || undefined}
      >
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#fff',
            textDecoration: 'none',
            padding: '4px 10px 14px',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '-0.01em',
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 7,
              background: 'var(--brand)',
              fontSize: 13,
            }}
          >
            LA
          </span>
          Mattress ERP
        </Link>
        {NAV.map((group) => (
          <div key={group.label} style={{ marginBottom: 14 }}>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgb(255 255 255 / 0.35)',
                margin: '0 0 4px',
                padding: '0 10px',
              }}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                    textDecoration: 'none',
                    marginBottom: 1,
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <div className="app-main" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <header
          className="app-topbar"
          style={{
            height: 'var(--topbar-height)',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm sidebar-toggle"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
            style={{ display: 'none' }}
          >
            ☰
          </button>
          <ActiveBusinessBadge />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/pos" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              Open register
            </Link>
          </div>
        </header>
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
