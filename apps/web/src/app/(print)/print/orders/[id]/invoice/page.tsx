'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { InvoiceDoc, type OrderDocumentPayload } from '@/components/order-documents';
import { PrintToolbar } from '../../../print-toolbar';

/** Printable invoice / sales order (§11). Printing an invoice never locks. */
export default function InvoicePrintPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id ?? '') as string;
  const [doc, setDoc] = useState<OrderDocumentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printedAt] = useState(() => new Date());

  useEffect(() => {
    if (!id) return;
    api<OrderDocumentPayload>(`/v1/orders/${id}/document`)
      .then(setDoc)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [id]);

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <PrintToolbar
        backHref={`/orders/${id}`}
        onPrint={() => window.print()}
        label="Print invoice"
      />
      {error && <p style={{ color: '#b00', padding: 16 }}>{error}</p>}
      {doc && <InvoiceDoc doc={doc} printedAt={printedAt} />}
    </div>
  );
}
