export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

/**
 * Returns true when the business should be treated as read-only across
 * the API and UI: trial expired without payment, payment failed, or
 * cancelled. Read-only is not the same as locked-out — billing routes
 * remain open so the user can fix the situation.
 */
export function isReadOnly(status: SubscriptionStatus, trialEndsAt: Date | null): boolean {
  if (status === 'past_due' || status === 'canceled') return true;
  if (status === 'trial' && trialEndsAt && trialEndsAt.getTime() < Date.now()) return true;
  return false;
}
