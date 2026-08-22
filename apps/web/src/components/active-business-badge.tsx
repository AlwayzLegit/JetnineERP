'use client';

import Link from 'next/link';
import { useBusinessName } from '@/lib/business-settings';

/**
 * Shows which business the back office is operating on, right in the
 * header. Born from live QA: after onboarding, nothing on screen said
 * the new business was active, so people bounced back to /welcome to
 * re-pick it "just in case". The switch link goes to the same picker.
 */
export function ActiveBusinessBadge() {
  const name = useBusinessName();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        background: '#2a2a2a',
        borderRadius: 999,
        padding: '3px 12px',
        color: '#ddd',
        whiteSpace: 'nowrap',
      }}
      data-testid="active-business"
    >
      {name ?? 'No business selected'}
      <Link href="/welcome" style={{ color: '#8ab4d8', textDecoration: 'none' }}>
        switch
      </Link>
    </span>
  );
}
