'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Location {
  id: string;
  name: string;
}
interface Level {
  variantId: string;
  locationId: string;
  productName: string;
  variantSku: string | null;
  variantName: string | null;
  variantBarcode: string | null;
  onHand: number;
  reserved: number;
  available: number;
}

const ADJUST_REASONS = ['count_correction', 'damage', 'theft', 'other'] as const;

export default function InventoryPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadLocations() {
    try {
      const rows = await api<Location[]>('/v1/business/locations');
      setLocations(rows);
      if (rows[0] && !locationId) setLocationId(rows[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function loadLevels(loc: string) {
    if (!loc) return;
    try {
      setLevels(await api<Level[]>(`/v1/inventory/levels?locationId=${loc}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void loadLocations();
  }, []);
  useEffect(() => {
    if (locationId) void loadLevels(locationId);
  }, [locationId]);

  async function adjust(level: Level) {
    const deltaStr = prompt(
      `Adjust ${level.variantSku ?? level.productName} (current ${level.onHand}). Delta:`,
      '0',
    );
    if (!deltaStr) return;
    const delta = Number(deltaStr);
    if (!Number.isInteger(delta) || delta === 0) {
      alert('delta must be a non-zero integer');
      return;
    }
    const reason = prompt(`Reason (${ADJUST_REASONS.join(', ')}):`, 'count_correction');
    if (!reason) return;
    const notes = prompt('Optional notes:', '') ?? undefined;
    try {
      await api('/v1/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: level.variantId,
          locationId: level.locationId,
          delta,
          reason,
          notes: notes || undefined,
        }),
      });
      await loadLevels(locationId);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Inventory</h1>
        <Link
          href="/inventory/receive"
          style={{
            marginLeft: 'auto',
            padding: '8px 14px',
            background: '#111',
            color: '#fff',
            borderRadius: 4,
            textDecoration: 'none',
            fontSize: 13,
          }}
        >
          Receive
        </Link>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>Location:</label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 13 }}
        >
          <option value="">— Pick —</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: '#b00' }}>{error}</p>}
      {levels && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <Th>Product</Th>
              <Th>SKU</Th>
              <Th>Barcode</Th>
              <Th>On hand</Th>
              <Th>Reserved</Th>
              <Th>Available</Th>
              <Th>&nbsp;</Th>
            </tr>
          </thead>
          <tbody>
            {levels.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 16, color: '#888' }}>
                  No stock at this location yet. Use Receive to add some.
                </td>
              </tr>
            )}
            {levels.map((l) => (
              <tr
                key={`${l.variantId}-${l.locationId}`}
                style={{ borderBottom: '1px solid #f3f3f3' }}
              >
                <Td>{l.productName}</Td>
                <Td>
                  <code>{l.variantSku ?? '—'}</code>
                </Td>
                <Td>
                  <code>{l.variantBarcode ?? '—'}</code>
                </Td>
                <Td>{l.onHand}</Td>
                <Td>{l.reserved}</Td>
                <Td>{l.available}</Td>
                <Td>
                  <button onClick={() => adjust(l)} style={linkBtn}>
                    Adjust
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const linkBtn = {
  background: 'none',
  border: 'none',
  color: '#06c',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontSize: 13,
  padding: 0,
} as const;

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '8px 6px', fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '8px 6px' }}>{children}</td>;
}
