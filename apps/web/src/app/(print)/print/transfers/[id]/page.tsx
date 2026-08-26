'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PrintToolbar } from '../../print-toolbar';

/**
 * Transfer Ticket (PLAN-POS-OPERATIONS §11): from/to store blocks,
 * lines, and signature lines for the §5 workflow — create → print
 * ticket → deliver → sign → complete (receiving side confirms in the
 * system). The paper carries the signatures; the system records who
 * confirmed receipt. Printing never changes state.
 */

interface TransferLine {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantityShipped: number;
  quantityReceived: number;
}

interface TransferDetail {
  id: string;
  number: string;
  status: string;
  fromLocationName: string | null;
  fromLocationAddressJson: unknown;
  toLocationName: string | null;
  toLocationAddressJson: unknown;
  businessName: string | null;
  shippedAt: string | null;
  notes: string | null;
  createdAt: string;
  lines: TransferLine[];
}

const box: React.CSSProperties = { border: '1px solid #000', padding: '6px 10px' };
const label: React.CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#333',
};
const cell: React.CSSProperties = {
  border: '1px solid #000',
  padding: '4px 8px',
  fontSize: 12,
  verticalAlign: 'top',
};

function AddressBlock({ addressJson }: { addressJson: unknown }) {
  if (!addressJson || typeof addressJson !== 'object') return null;
  const a = addressJson as Record<string, unknown>;
  const s = (k: string) => (typeof a[k] === 'string' && a[k] ? (a[k] as string) : null);
  const cityLine = [s('city'), s('region') ?? s('state'), s('postalCode') ?? s('zip')]
    .filter(Boolean)
    .join(', ');
  return (
    <div style={{ fontSize: 11, color: '#111' }}>
      {s('line1') && <div>{s('line1')}</div>}
      {cityLine && <div>{cityLine}</div>}
      {s('phone') && <div>Ph. {s('phone')}</div>}
    </div>
  );
}

export default function TransferTicketPrintPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [t, setT] = useState<TransferDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api<TransferDetail>(`/v1/stock-transfers/${id}`)
      .then(setT)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <PrintToolbar
        backHref={`/transfers/${id}`}
        onPrint={() => window.print()}
        label="Print transfer ticket"
      />
      {error && <p style={{ color: '#b00', padding: 16 }}>{error}</p>}
      {t && (
        <div
          style={{
            background: '#fff',
            color: '#000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 12,
            maxWidth: 780,
            margin: '0 auto',
            padding: 24,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Transfer Ticket</div>
              <div style={{ fontSize: 11 }}>{t.businessName}</div>
            </div>
            <div style={{ ...box, textAlign: 'center', width: 200 }}>
              <div style={label}>Transfer #</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{t.number}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>
                {t.shippedAt
                  ? `Shipped ${new Date(t.shippedAt).toLocaleDateString()}`
                  : `Created ${new Date(t.createdAt).toLocaleDateString()}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <div style={{ ...box, flex: 1, minHeight: 70 }}>
              <div style={label}>From store</div>
              <div style={{ fontWeight: 700 }}>{t.fromLocationName ?? '—'}</div>
              <AddressBlock addressJson={t.fromLocationAddressJson} />
            </div>
            <div style={{ ...box, flex: 1, minHeight: 70 }}>
              <div style={label}>To store</div>
              <div style={{ fontWeight: 700 }}>{t.toLocationName ?? '—'}</div>
              <AddressBlock addressJson={t.toLocationAddressJson} />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr>
                {['Qty', 'SKU', 'Item', 'Received'].map((h) => (
                  <th key={h} style={{ ...cell, ...label, textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.lines.map((l) => (
                <tr key={l.id}>
                  <td style={{ ...cell, width: 48, textAlign: 'right' }}>{l.quantityShipped}</td>
                  <td style={{ ...cell, width: 140 }}>
                    <code>{l.sku ?? '—'}</code>
                  </td>
                  <td style={cell}>
                    {l.productName}
                    {l.variantName ? ` — ${l.variantName}` : ''}
                  </td>
                  {/* Blank tally box the receiving store fills by hand. */}
                  <td style={{ ...cell, width: 70 }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {t.notes && (
            <div style={{ ...box, marginTop: 10, minHeight: 30 }}>
              <div style={label}>Notes</div>
              {t.notes}
            </div>
          )}

          <div style={{ marginTop: 56, display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>
                Driver signature
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>
                Received by (signature)
              </div>
            </div>
            <div style={{ width: 120 }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>Date</div>
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#333', marginTop: 16 }}>
            Receiving store: count against this ticket, sign, then confirm the received quantities
            in the system to complete transfer {t.number}.
          </p>
        </div>
      )}
    </div>
  );
}
