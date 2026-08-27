'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingRows,
  PageHeader,
  Select,
} from '@/components/ui';

interface Location {
  id: string;
  name: string;
  isActive: boolean;
}

interface CountRow {
  id: string;
  locationId: string;
  locationName: string;
  status: string;
  countDate: string;
  frozenAt: string;
  postedAt: string | null;
  lineCount: number;
  countedCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  counting: 'Counting',
  posted: 'Posted',
  cancelled: 'Cancelled',
};

export default function PhysicalCountsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [counts, setCounts] = useState<CountRow[] | null>(null);
  const [newLocationId, setNewLocationId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [locs, rows] = await Promise.all([
        api<Location[]>('/v1/business/locations'),
        api<CountRow[]>('/v1/inventory/counts'),
      ]);
      const active = locs.filter((l) => l.isActive);
      setLocations(active);
      setCounts(rows);
      if (active[0] && !newLocationId) setNewLocationId(active[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function startCount() {
    if (!newLocationId || creating) return;
    setCreating(true);
    try {
      const res = await api<{ id: string; lineCount: number }>('/v1/inventory/counts', {
        method: 'POST',
        body: JSON.stringify({ locationId: newLocationId }),
      });
      toast.success(`Count started — ${res.lineCount} line(s) frozen`);
      router.push(`/inventory/counts/${res.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Physical counts"
        actions={
          <LinkButton href="/inventory" variant="ghost">
            Back to inventory
          </LinkButton>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <ClipboardList size={16} />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Start a count — freezes a snapshot of stock at:
          </span>
          <Select value={newLocationId} onChange={(e) => setNewLocationId(e.target.value)}>
            <option value="">— Pick a location —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="primary"
            disabled={!newLocationId || creating}
            onClick={() => void startCount()}
          >
            {creating ? 'Freezing…' : 'Start count'}
          </Button>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            The store keeps selling during the count — mid-count sales are netted out at post time.
          </span>
        </div>
      </Card>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <Card style={{ padding: 0 }}>
        {counts == null ? (
          <div style={{ padding: 16 }}>
            <LoadingRows />
          </div>
        ) : counts.length === 0 ? (
          <EmptyState>No physical counts yet. Start one above.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="num">Progress</th>
                  <th>Posted</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((c) => (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/inventory/counts/${c.id}`)}
                  >
                    <td>{new Date(`${c.countDate}T00:00:00`).toLocaleDateString()}</td>
                    <td>{c.locationName}</td>
                    <td>{STATUS_LABEL[c.status] ?? c.status}</td>
                    <td className="num">
                      {c.countedCount}/{c.lineCount} counted
                    </td>
                    <td>{c.postedAt ? new Date(c.postedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
