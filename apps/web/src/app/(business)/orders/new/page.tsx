'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { NewSale } from '@/components/new-sale';

/**
 * Orders → New is the same single-screen New Sale the POS lands on.
 * `?exchangeOf=<orderId>` switches it into Exchange Order mode (§10):
 * the customer pins to the original order's and the completed document
 * prints as an Exchange Order against the original invoice #.
 */
function OrderWriterInner() {
  const search = useSearchParams();
  const exchangeOf = search?.get('exchangeOf') ?? undefined;
  return (
    <div>
      <PageHeader title={exchangeOf ? 'Exchange Order' : 'New Sale'} />
      <NewSale exchangeOf={exchangeOf} />
    </div>
  );
}

export default function OrderWriterPage() {
  return (
    <Suspense fallback={null}>
      <OrderWriterInner />
    </Suspense>
  );
}
