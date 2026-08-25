'use client';

import { PageHeader } from '@/components/ui';
import { OrderEntry } from '@/components/order-entry';

/**
 * The order writer is the same three-step "Enter a Sales Order" flow the
 * POS defaults to — one way to write an order, reachable from both the
 * Orders board and the register.
 */
export default function OrderWriterPage() {
  return (
    <div>
      <PageHeader title="Enter a Sales Order" />
      <OrderEntry />
    </div>
  );
}
