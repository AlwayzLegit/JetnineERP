'use client';

import { PageHeader } from '@/components/ui';
import { NewSale } from '@/components/new-sale';

/** Orders → New is the same single-screen New Sale the POS lands on. */
export default function OrderWriterPage() {
  return (
    <div>
      <PageHeader title="New Sale" />
      <NewSale />
    </div>
  );
}
