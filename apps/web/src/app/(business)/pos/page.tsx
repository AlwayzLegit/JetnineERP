'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui';
import { OrderEntry } from '@/components/order-entry';
import { RegisterView } from './register-view';

/**
 * POS home. The default surface is the STORIS-style three-step
 * "Enter a Sales Order" flow; the legacy quick-sale register stays one
 * tab away until its offline queue and drawer flows are fully ported
 * into the step flow, then it retires.
 */
export default function PosPage() {
  const [tab, setTab] = useState<'order' | 'register'>('order');

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          className="btn"
          onClick={() => setTab('order')}
          style={tab === 'order' ? activeTab : inactiveTab}
          data-testid="pos-tab-order-entry"
        >
          Enter a Sales Order
        </button>
        <button
          className="btn"
          onClick={() => setTab('register')}
          style={tab === 'register' ? activeTab : inactiveTab}
          data-testid="pos-tab-register"
        >
          Register (quick sale)
        </button>
      </div>
      {tab === 'order' ? (
        <>
          <PageHeader title="Enter a Sales Order" />
          <OrderEntry />
        </>
      ) : (
        <RegisterView />
      )}
    </div>
  );
}

const activeTab = {
  background: 'var(--brand)',
  color: '#fff',
  border: '1px solid var(--brand)',
  fontWeight: 600,
} as const;
const inactiveTab = {
  background: 'var(--surface)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-strong)',
} as const;
