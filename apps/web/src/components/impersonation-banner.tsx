'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
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
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    api<MeResponse>('/v1/auth/me')
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  if (!me?.impersonating) return null;

  async function stop() {
    setStopping(true);
    try {
      await api('/v1/admin/impersonate', { method: 'DELETE' });
      window.location.href = '/admin/businesses';
    } catch (err) {
      setStopping(false);
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div
      data-testid="impersonation-banner"
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-danger px-4 py-2 text-[13px] text-white"
    >
      <span>
        Impersonating <strong>{me.user.email}</strong>
        {me.impersonating.impersonatorEmail ? ` (as ${me.impersonating.impersonatorEmail})` : ''}
      </span>
      <Button variant="secondary" size="sm" disabled={stopping} onClick={() => void stop()}>
        {stopping ? 'Stopping…' : 'Stop impersonating'}
      </Button>
    </div>
  );
}
