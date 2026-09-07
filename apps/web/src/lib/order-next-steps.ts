export interface NextStepOrder {
  status: string;
  displayStatus?: string;
  completedAt: string | null;
  cancelledAt: string | null;
  fulfillmentType: string;
  balanceDueCents: number;
  lines: {
    lineType: string;
    quantity: number;
    qtyFulfilled: number;
    qtyReserved: number;
    qtyReturned: number;
    fulfillmentMethod: string | null;
    po: { ordered: number; poNumber: string } | null;
  }[];
}

export interface OrderNextStep {
  text: string;
  tone: 'error' | 'warning' | 'success' | 'info';
}

/** Guidance never replaces the server's fulfillment or payment permissions. */
export function orderNextSteps(
  order: NextStepOrder,
  deliveries: readonly { status: string }[],
): OrderNextStep[] {
  const goods = order.lines.filter((line) => line.lineType !== 'custom');
  const fullyReturned =
    order.displayStatus?.toLowerCase() === 'returned' ||
    (goods.length > 0 && goods.every((line) => line.qtyReturned >= line.quantity));
  if (fullyReturned) {
    return [
      {
        text: 'All items returned — review the return settlement and any replacement order.',
        tone: 'info',
      },
    ];
  }
  if (order.completedAt || order.cancelledAt || ['completed', 'cancelled'].includes(order.status))
    return [];
  if (order.status === 'draft')
    return [{ text: 'Confirm the order to make it a live sale.', tone: 'info' }];
  if (order.status === 'quote')
    return [{ text: 'Confirm the quote to commit stock.', tone: 'info' }];

  const steps: OrderNextStep[] = [];
  const remaining = goods.filter((line) => line.quantity > line.qtyFulfilled);
  const method = (line: NextStepOrder['lines'][number]) =>
    line.lineType === 'direct_ship'
      ? 'direct_ship'
      : (line.fulfillmentMethod ?? order.fulfillmentType);
  const short = remaining.filter(
    (line) =>
      line.lineType === 'stock' &&
      method(line) !== 'direct_ship' &&
      !line.po &&
      line.quantity > line.qtyFulfilled + line.qtyReserved,
  );
  if (short.length)
    steps.push({
      text: `${short.length} line${short.length === 1 ? '' : 's'} not reserved — check stock at the source.`,
      tone: 'error',
    });
  const onPo = remaining.filter((line) => line.po && line.po.ordered > 0);
  if (onPo.length)
    steps.push({
      text: `Waiting on ${[...new Set(onPo.map((line) => line.po!.poNumber))].join(', ')} for ${onPo.length} line${onPo.length === 1 ? '' : 's'}.`,
      tone: 'warning',
    });
  const scheduled = deliveries.some((delivery) =>
    ['scheduled', 'loaded', 'out_for_delivery'].includes(delivery.status),
  );
  const truck = remaining.some((line) => method(line) === 'delivery');
  if (truck && !scheduled) steps.push({ text: 'Schedule the delivery.', tone: 'warning' });
  if (order.balanceDueCents > 0)
    steps.push({
      text: 'Review the balance due and the payment arrangements before completing the order.',
      tone: 'warning',
    });
  if (remaining.some((line) => method(line) === 'pickup'))
    steps.push({
      text: short.length
        ? 'Resolve stock shortages before confirming pickup readiness.'
        : 'Stage the pickup items and confirm collection with the customer.',
      tone: 'info',
    });
  if (remaining.some((line) => method(line) === 'take_with'))
    steps.push({
      text: 'Complete the take-with piece once its stock and payment requirements are met.',
      tone: 'info',
    });
  if (remaining.some((line) => method(line) === 'direct_ship'))
    steps.push({
      text: 'Confirm the vendor shipment and record direct-ship fulfillment.',
      tone: 'info',
    });
  if (order.status === 'fulfilled' && order.balanceDueCents === 0)
    steps.push({
      text: 'Fulfilled and paid — ready to complete.',
      tone: 'success',
    });
  if (!steps.length && truck && scheduled)
    steps.push({
      text: 'Delivery is scheduled — review item readiness before dispatch.',
      tone: 'info',
    });
  if (!steps.length)
    steps.push({
      text: 'Review fulfillment and complete the order when all requirements are met.',
      tone: 'info',
    });
  return steps;
}
