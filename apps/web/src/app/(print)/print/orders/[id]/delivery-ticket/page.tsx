'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { DeliveryTicketDoc, type OrderDocumentPayload } from '@/components/order-documents';
import { PrintToolbar } from '../../../print-toolbar';

/**
 * Individual delivery-ticket print. Per amendment A1 the Print button
 * first records the print server-side — which LOCKS the order against
 * edits — then opens the browser print dialog. Batch printing (from
 * /print/deliveries) never locks.
 */
export default function DeliveryTicketPrintPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [doc, setDoc] = useState<OrderDocumentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<OrderDocumentPayload>(`/v1/orders/${id}/document`)
      .then((d) => {
        setDoc(d);
        setLocked(Boolean(d.order.lockedAt));
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  async function printAndLock() {
    try {
      const res = await api<{ lockedAt: string | null }>(`/v1/orders/${id}/delivery-ticket-print`, {
        method: 'POST',
      });
      setLocked(Boolean(res.lockedAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return;
    }
    window.print();
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <PrintToolbar
        backHref={`/orders/${id}`}
        onPrint={printAndLock}
        label="Print ticket"
        note={
          locked
            ? 'Order is locked (ticket printed).'
            : 'Printing locks the order against edits until it is unlocked.'
        }
      />
      {error && <p style={{ color: '#b00', padding: 16 }}>{error}</p>}
      {doc && <DeliveryTicketDoc doc={doc} />}
    </div>
  );
}
