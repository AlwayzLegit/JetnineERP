'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  Landmark,
  BadgeDollarSign,
  AlertTriangle,
  ArrowLeftRight,
  BadgePercent,
  Boxes,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Factory,
  Gift,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Menu,
  Monitor,
  Package,
  PackageSearch,
  Receipt,
  ScrollText,
  TriangleAlert,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Wrench,
  Recycle,
  Repeat,
  MoonStar,
  type LucideIcon,
  Undo2,
} from 'lucide-react';
import { ActiveBusinessBadge } from '@/components/active-business-badge';
import { useBusinessBranding, useBusinessName } from '@/lib/business-settings';

/**
 * The (business) application shell: grouped sidebar + slim topbar.
 * Sidebar highlights the active section from the pathname; below the
 * `md` breakpoint it slides over the content behind a hamburger, with
 * a backdrop to dismiss.
 */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: 'Sell',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/pos', label: 'New Sale', icon: Monitor },
      { href: '/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/deliveries', label: 'Deliveries', icon: Truck },
      { href: '/jeopardy', label: 'At risk', icon: AlertTriangle },
      { href: '/service', label: 'Service', icon: Wrench },
      { href: '/special-orders', label: 'Special orders', icon: PackageSearch },
      { href: '/sales', label: 'Sales', icon: Receipt },
      { href: '/returns', label: 'Returns', icon: Undo2 },
      { href: '/exchanges', label: 'Exchanges', icon: Repeat },
      { href: '/shifts', label: 'Shifts', icon: CreditCard },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products', label: 'Products', icon: Package },
      { href: '/categories', label: 'Categories', icon: Tags },
      { href: '/inventory', label: 'Inventory', icon: Boxes },
      { href: '/purchase-orders', label: 'Purchasing', icon: ClipboardList },
      { href: '/vendors', label: 'Vendors', icon: Factory },
      { href: '/replenishment', label: 'Replenishment', icon: PackageSearch },
      { href: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
      { href: '/as-is', label: 'As-Is review', icon: Recycle },
      { href: '/gift-cards', label: 'Gift cards', icon: Gift },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/salespeople', label: 'Salespeople', icon: BadgeDollarSign },
      { href: '/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/members', label: 'Members', icon: UserCog },
      { href: '/roles', label: 'Roles', icon: ShieldCheck },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports', label: 'Reports', icon: BadgePercent },
      { href: '/reports/builder', label: 'Report builder', icon: ScrollText },
      { href: '/gl', label: 'General ledger', icon: Landmark },
      { href: '/commissions', label: 'Commissions', icon: CreditCard },
      { href: '/exceptions', label: 'Exceptions', icon: TriangleAlert },
      { href: '/jobs', label: 'Nightly jobs', icon: MoonStar },
      { href: '/audit', label: 'Audit log', icon: ScrollText },
    ],
  },
  {
    label: 'Configure',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/locations', label: 'Locations', icon: MapPin },
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
    <div className="min-h-screen">
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width)] overflow-y-auto bg-[var(--sidebar-bg)] px-3 pb-6 pt-4 transition-transform duration-150 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <BrandHeader />
        {NAV.map((group) => (
          <div key={group.label} className="mb-3.5">
            <p className="mb-1 px-2.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/60">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`mb-px flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] no-underline transition-colors ${
                    active
                      ? 'bg-white/10 font-semibold text-white'
                      : 'font-normal text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </aside>

      <div className="app-main md:ml-[var(--sidebar-width)]">
        <header className="app-topbar sticky top-0 z-20 flex h-[var(--topbar-height)] items-center gap-3 border-b border-border bg-surface px-4 md:px-6">
          <button
            type="button"
            className="btn btn-ghost btn-sm md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu size={18} aria-hidden />
          </button>
          <ActiveBusinessBadge />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/pos" className="btn btn-primary btn-sm no-underline">
              <Monitor size={14} aria-hidden />
              <span className="hidden sm:inline">Open register</span>
              <span className="sm:hidden">POS</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 pb-12 pt-5 md:px-6 md:pt-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Sidebar brand block. White-label aware: a business with branding
 * shows its own logo/name; otherwise the platform default. The
 * two-letter monogram falls back to the first letters of the name.
 */
function BrandHeader() {
  const branding = useBusinessBranding();
  const name = useBusinessName() ?? 'Mattress ERP';
  const monogram = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <Link
      href="/dashboard"
      className="mb-2 flex items-center gap-2 px-2.5 pb-3 text-[15px] font-bold tracking-tight text-white no-underline"
    >
      {branding?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied remote URL; next/image needs domain allow-listing per tenant
        <img
          src={branding.logoUrl}
          alt=""
          className="h-[26px] w-[26px] rounded-[7px] object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-brand text-[13px]"
        >
          {monogram || 'ERP'}
        </span>
      )}
      <span className="truncate">{name}</span>
    </Link>
  );
}
