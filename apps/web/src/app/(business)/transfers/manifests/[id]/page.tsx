'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Printer, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button, Card, LinkButton, LoadingRows, PageHeader, StatusBadge } from '@/components/ui';

interface ManifestTransfer {
  id: string;
  number: string;
  status: string;
  transferType: string;
  loadNumber: number | null;
  ticketPrintedAt: string | null;
  lineCount: number;
  unitCount: number;
}

interface Manifest {
  id: string;
  number: string;
  status: string;
  manifestDate: string;
  routeName: string | null;
  fromLocationName: string | null;
  toLocationName: string | null;
  notes: string | null;
  completedAt: string | null;
  transfers: ManifestTransfer[];
}

export default function ManifestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [m, setM] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setM(await api<Manifest>(`/v1/stock-manifests/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    try {
      await api(`/v1/stock-manifests/${id}${path}`, {
        method: 'POST',
        body: JSON.stringify(body ?? {}),
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (error && !m) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!m) return <LoadingRows rows={5} />;

  const isOpen = m.status === 'open';
  const unprinted = m.transfers.filter((t) => t.status === 'draft' && !t.ticketPrintedAt);

  return (
    <div>
      <p style={{ marginBottom: 12 }}>
        <Link href="/transfers/manifests">← All manifests</Link>
      </p>
      <PageHeader
        title={<code>{m.number}</code>}
        sub={
          <>
            <StatusBadge status={m.status} /> · {m.fromLocationName ?? '—'} →{' '}
            <strong>{m.toLocationName ?? '—'}</strong> · {m.manifestDate}
            {m.routeName && <> · {m.routeName}</>}
          </>
        }
        actions={
          <LinkButton href={`/print/manifests/${id}`} variant="secondary" size="sm" target="_blank">
            <Printer size={13} aria-hidden /> Manifest document
          </LinkButton>
        }
      />

      <Card title={`Transfers (${m.transfers.length})`} style={{ marginBottom: 16, padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Load</th>
              <th>Transfer</th>
              <th>Type</th>
              <th>Lines</th>
              <th>Units</th>
              <th>Ticket</th>
              <th>Status</th>
              {isOpen && <th />}
            </tr>
          </thead>
          <tbody>
            {m.transfers.map((t) => (
              <tr key={t.id}>
                <td>{t.loadNumber ?? '—'}</td>
                <td>
                  <Link href={`/transfers/${t.id}`}>
                    <code>{t.number}</code>
                  </Link>
                </td>
                <td>{t.transferType}</td>
                <td className="num">{t.lineCount}</td>
                <td className="num">{t.unitCount}</td>
                <td>
                  {t.ticketPrintedAt ? (
                    <span className="badge badge-success">printed</span>
                  ) : (
                    <span className="badge badge-neutral">not printed</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                {isOpen && (
                  <td>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        const reason = window.prompt(
                          `Remove ${t.number} from this manifest — reason (recorded in the audit register):`,
                        );
                        if (reason === null) return;
                        void act('/remove-transfer', { transferId: t.id, reason: reason || null });
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {isOpen && unprinted.length > 0 && (
        <p style={{ color: 'var(--warning)', fontSize: 13 }}>
          {unprinted.length} transfer{unprinted.length === 1 ? '' : 's'} still need a printed ticket
          before this manifest can complete (print-before-ship gate).
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {isOpen && (
          <>
            <Button variant="primary" disabled={busy} onClick={() => void act('/complete')}>
              <Truck size={14} aria-hidden />
              {busy ? 'Working…' : 'Complete manifest (ship the truck)'}
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Cancel this manifest? Transfers detach and stay drafts.')) {
                  void act('/cancel');
                }
              }}
            >
              Cancel manifest
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
