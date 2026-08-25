'use client';

import Link from 'next/link';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { readActiveBusinessId } from '@/lib/offline';
import { useBusinessName } from '@/lib/business-settings';

interface MembershipSummary {
  businessId: string;
  businessName: string;
  roleName: string;
  status: string;
}

/**
 * Shows which business the back office is operating on, right in the
 * header — and for people who belong to several businesses, switches
 * between them in one click instead of a round-trip through /welcome.
 * Memberships load lazily on first open so single-business users never
 * pay for the fetch.
 */
export function ActiveBusinessBadge() {
  const name = useBusinessName();
  const [open, setOpen] = useState(false);
  const [memberships, setMemberships] = useState<MembershipSummary[] | null>(null);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeId = useRef<string | null>(null);
  if (activeId.current === null && typeof document !== 'undefined') {
    activeId.current = readActiveBusinessId();
  }

  useEffect(() => {
    if (!open || memberships != null) return;
    void (async () => {
      try {
        const me = await api<{ memberships: MembershipSummary[] }>('/v1/auth/me');
        setMemberships(me.memberships.filter((m) => m.status === 'active'));
      } catch {
        setMemberships([]);
      }
    })();
  }, [open, memberships]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  async function switchTo(businessId: string) {
    if (businessId === activeId.current) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      await api('/v1/auth/active-business', {
        method: 'POST',
        body: JSON.stringify({ businessId }),
      });
      // Full reload: every provider, cache, and offline queue partition
      // keys off the active business — a soft navigation would leave
      // stale tenant state mounted.
      window.location.href = '/dashboard';
    } catch {
      setSwitching(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="active-business"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          background: 'var(--neutral-soft)',
          border: '1px solid var(--border)',
          borderRadius: 999,
          padding: '3px 12px',
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
        }}
      >
        {name ?? 'No business selected'}
        <ChevronDown size={13} aria-hidden />
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 50,
            minWidth: 240,
            padding: 6,
            boxShadow: 'var(--shadow-lg)',
          }}
          data-testid="business-switcher"
        >
          {memberships == null && (
            <p className="muted" style={{ fontSize: 12, padding: '6px 8px', margin: 0 }}>
              Loading…
            </p>
          )}
          {memberships?.map((m) => (
            <button
              key={m.businessId}
              type="button"
              disabled={switching}
              onClick={() => void switchTo(m.businessId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '7px 8px',
                fontSize: 13,
                cursor: 'pointer',
                color: 'var(--text)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--brand-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ flex: 1 }}>
                {m.businessName}
                <span className="muted" style={{ fontSize: 11, display: 'block' }}>
                  {m.roleName}
                </span>
              </span>
              {m.businessId === activeId.current && (
                <Check size={14} style={{ color: 'var(--success)' }} aria-hidden />
              )}
            </button>
          ))}
          {(memberships?.length ?? 0) > 1 && (
            <Link
              href="/agency"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 8px',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--brand)',
                textDecoration: 'none',
                borderTop: '1px solid var(--border)',
                marginTop: 4,
              }}
            >
              <Building2 size={14} aria-hidden /> All businesses overview
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
