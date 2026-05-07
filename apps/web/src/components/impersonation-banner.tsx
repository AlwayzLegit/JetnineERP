'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface MeResponse {
  user: { id: string; email: string };
  impersonating: { impersonatorUserId: string; impersonatorEmail: string | null } | null;
}

/**
 * Renders a sticky red banner whenever the current request is an
 * impersonated session. Calls /v1/auth/me to determine state.
 */
export function ImpersonationBanner() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    api<MeResponse>('/v1/auth/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  if (!me?.impersonating) return null;

  async function stop() {
    try {
      await api('/v1/admin/impersonate', { method: 'DELETE' });
      window.location.href = '/admin/businesses';
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div
      data-testid="impersonation-banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '8px 16px',
        background: '#b00020',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 13,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>
        Impersonating <strong>{me.user.email}</strong>
        {me.impersonating.impersonatorEmail ? ` (as ${me.impersonating.impersonatorEmail})` : ''}
      </span>
      <button
        onClick={stop}
        style={{
          background: '#fff',
          color: '#b00020',
          border: 'none',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Stop impersonating
      </button>
    </div>
  );
}
