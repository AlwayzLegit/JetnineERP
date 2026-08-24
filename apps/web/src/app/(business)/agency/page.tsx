'use client';

import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, EmptyState, LoadingRows, PageHeader, StatusBadge } from '@/components/ui';
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
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {rows == null ? (
        <Card>
          <LoadingRows />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState>You don&apos;t belong to any businesses yet.</EmptyState>
        </Card>
      ) : (
        <>
          {rows.length > 1 && (
            <p className="page-sub" data-testid="agency-total">
              Today across all businesses: <strong>{<Money cents={totalToday} />}</strong>
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b) => {
              const display = b.branding?.publicName ?? b.businessName;
              const accent = b.branding?.accentColor ?? 'var(--brand)';
              return (
                <div
                  key={b.businessId}
                  className="card card-hover"
                  style={{ borderTop: `3px solid ${accent}`, marginTop: 0 }}
                  data-testid={`agency-card-${b.businessSlug}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {b.branding?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tenant-supplied remote URL
                      <img
                        src={b.branding.logoUrl}
                        alt=""
                        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: accent,
                          color: '#fff',
                        }}
                      >
                        <Building2 size={16} />
                      </span>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }} className="truncate">
                        {display}
                      </div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {b.roleName}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 8,
                      margin: '12px 0',
                    }}
                  >
                    <MiniStat
                      label="Today"
                      value={b.todaySalesCents != null ? <Money cents={b.todaySalesCents} /> : '—'}
                    />
                    <MiniStat
                      label="Sales"
                      value={b.todaySaleCount != null ? String(b.todaySaleCount) : '—'}
                    />
                    <MiniStat
                      label="Open orders"
                      value={b.openOrdersCount != null ? String(b.openOrdersCount) : '—'}
                    />
                  </div>

                  {b.businessId === activeId ? (
                    <p className="muted" style={{ fontSize: 12, margin: 0 }}>
                      Currently active
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={switching}
                      onClick={() => void switchTo(b.businessId)}
                      data-testid={`switch-${b.businessSlug}`}
                    >
                      Switch to this business
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface-muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 8px',
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
