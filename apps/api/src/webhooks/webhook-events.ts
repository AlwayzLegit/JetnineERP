/**
 * The complete catalog of outbound webhook event types Jetnine emits.
 * Adding a new event:
 *   1. Add it to this enum.
 *   2. Call WebhookDispatcher.fire() from the controller that produces it.
 *   3. Document the payload shape on this file alongside the constant.
 *
 * Endpoints subscribe to event types by name; the literal `*` in an
 * endpoint's `events` array matches every type, including future ones.
 */
export const WEBHOOK_EVENT_TYPES = [
  'sale.created',
  'sale.refunded',
  'order.created',
  'order.payment_received',
  'order.cancelled',
  'order.completed',
  'delivery.scheduled',
  'delivery.delivered',
  'customer.created',
  'inventory.adjusted',
  'purchase_order.received',
  'stock_transfer.received',
  // Payload: { campaignId, name, segmentId, recipientCount }
  'campaign.sent',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const ALL_EVENTS_WILDCARD = '*';

export function endpointMatchesEvent(
  subscribed: string[] | null | undefined,
  type: string,
): boolean {
  if (!subscribed || subscribed.length === 0) return false;
  if (subscribed.includes(ALL_EVENTS_WILDCARD)) return true;
  return subscribed.includes(type);
}
