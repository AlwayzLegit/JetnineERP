import { describe, expect, it } from 'vitest';
import { orderNextSteps, type NextStepOrder } from './order-next-steps';

const line = {
  lineType: 'stock',
  quantity: 1,
  qtyFulfilled: 0,
  qtyReserved: 1,
  qtyReturned: 0,
  fulfillmentMethod: null,
  po: null,
};
const order = (overrides: Partial<NextStepOrder> = {}): NextStepOrder => ({
  status: 'open',
  completedAt: null,
  cancelledAt: null,
  fulfillmentType: 'delivery',
  balanceDueCents: 0,
  lines: [line],
  ...overrides,
});
const text = (value: NextStepOrder) =>
  orderNextSteps(value, [])
    .map((step) => step.text)
    .join(' ');

describe('order next actions', () => {
  it('never requests collection on the returned order even when its historical balance is nonzero', () => {
    expect(
      text(order({ status: 'fulfilled', displayStatus: 'Returned', balanceDueCents: 80000 })),
    ).toBe('All items returned — review the return settlement and any replacement order.');
  });
  it('recognizes all returned physical goods even when custom fee quantities were not returned', () => {
    expect(
      text(
        order({
          lines: [
            { ...line, qtyFulfilled: 1, qtyReturned: 1 },
            { ...line, lineType: 'custom' },
          ],
        }),
      ),
    ).toContain('All items returned');
  });
  it('does not suppress remaining work on a partially returned order', () => {
    expect(
      text(order({ lines: [{ ...line, quantity: 2, qtyFulfilled: 1, qtyReturned: 1 }] })),
    ).toContain('Schedule the delivery');
  });
  it('drafts and quotes do not report stock shortages before confirmation', () => {
    for (const status of ['draft', 'quote'])
      expect(
        orderNextSteps(order({ status, lines: [{ ...line, qtyReserved: 0 }] }), []),
      ).toHaveLength(1);
  });
  it('pickup guidance never claims a delivery was scheduled', () => {
    expect(text(order({ fulfillmentType: 'pickup' }))).toContain('confirm collection');
    expect(text(order({ fulfillmentType: 'pickup' }))).not.toContain('delivery');
  });
  it('direct shipments need vendor confirmation, not warehouse stock', () => {
    const result = text(
      order({ fulfillmentType: 'direct_ship', lines: [{ ...line, qtyReserved: 0 }] }),
    );
    expect(result).toContain('vendor shipment');
    expect(result).not.toContain('not reserved');
  });
  it('custom charges are never physical shortages', () => {
    expect(text(order({ lines: [{ ...line, lineType: 'custom', qtyReserved: 0 }] }))).not.toContain(
      'not reserved',
    );
  });
  it('does not claim completed fulfillment is a delivery for pickup orders', () => {
    expect(
      text(
        order({
          status: 'fulfilled',
          fulfillmentType: 'pickup',
          lines: [{ ...line, qtyFulfilled: 1 }],
        }),
      ),
    ).toBe('Fulfilled and paid — ready to complete.');
  });
  it('failed deliveries do not count as a live booking', () => {
    expect(orderNextSteps(order(), [{ status: 'failed' }])[0]?.text).toBe('Schedule the delivery.');
  });
  it('closed orders have no next action', () => {
    for (const status of ['completed', 'cancelled'])
      expect(orderNextSteps(order({ status }), [])).toEqual([]);
  });
});
