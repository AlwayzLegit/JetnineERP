'use client';

import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingRows,
  PageHeader,
  Stack,
  StatGrid,
  StatTile,
  StatusBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { Money } from '@/components/money';
import { readActiveBusinessId } from '@/lib/offline';

interface AgencyBusinessRow {
  businessId: string;
  businessSlug: string;
  businessName: string;
  status: string;
  roleName: string;
  branding: { accentColor?: string; logoUrl?: string; publicName?: string } | null;
  todaySalesCents: number | null;
  todaySaleCount: number | null;
  openOrdersCount: number | null;
}

/**
 * Cross-business roll-up for multi-business operators. Money figures
 * appear only for businesses where the caller's role can see sales
 * reports; every membership still gets a card and a switch button.
 */
export default function AgencyPage() {
  const [rows, setRows] = useState<AgencyBusinessRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const activeId = typeof document !== 'undefined' ? readActiveBusinessId() : null;

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ businesses: AgencyBusinessRow[] }>('/v1/agency/overview');
        setRows(res.businesses);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, []);

  async function switchTo(businessId: string) {
    setSwitching(true);
    try {
      await api('/v1/auth/active-business', {
        method: 'POST',
        body: JSON.stringify({ businessId }),
      });
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSwitching(false);
    }
  }

  const totalToday = rows?.reduce((s, r) => s + (r.todaySalesCents ?? 0), 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="All businesses"
        sub="Every business you belong to, with today's numbers where your role can see them."
      />
      <Stack>
        {error && <Alert tone="error">{error}</Alert>}

        {rows == null ? (
          <Card>
            <LoadingRows />
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState title="No businesses yet">
            You don&apos;t belong to any businesses yet.
          </EmptyState>
        ) : (
          <>
            {rows.length > 1 && (
              <StatGrid cols={4}>
                <StatTile
                  label="Today across all businesses"
                  value={<Money cents={totalToday} />}
                  sub={`${rows.length} businesses`}
                  data-testid="agency-total"
                />
              </StatGrid>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((b) => {
                const display = b.branding?.publicName ?? b.businessName;
                const accent = b.branding?.accentColor ?? 'var(--brand)';
                return (
                  <Card
                    key={b.businessId}
                    className="card-hover"
                    style={{ borderTop: `3px solid ${accent}` }}
                    data-testid={`agency-card-${b.businessSlug}`}
                  >
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2.5">
                        {b.branding?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied remote URL
                          <img
                            src={b.branding.logoUrl}
                            alt=""
                            className="h-8 w-8 rounded-lg object-contain"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white"
                            style={{ background: accent }}
                          >
                            <Building2 size={16} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{display}</div>
                          <div className="muted text-xs">{b.roleName}</div>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      <StatGrid cols={3}>
                        <StatTile
                          label="Today"
                          value={
                            b.todaySalesCents != null ? <Money cents={b.todaySalesCents} /> : '—'
                          }
                        />
                        <StatTile
                          label="Sales"
                          value={b.todaySaleCount != null ? String(b.todaySaleCount) : '—'}
                        />
                        <StatTile
                          label="Open orders"
                          value={b.openOrdersCount != null ? String(b.openOrdersCount) : '—'}
                        />
                      </StatGrid>

                      <div>
                        {b.businessId === activeId ? (
                          <span className="muted">Currently active</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={switching}
                            onClick={() => void switchTo(b.businessId)}
                            data-testid={`switch-${b.businessSlug}`}
                          >
                            Switch to this business
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </Stack>
    </div>
  );
}
