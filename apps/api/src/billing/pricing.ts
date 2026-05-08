/**
 * Pure pricing math. Per-location pricing in cents/month for each plan.
 * The Stripe products that mirror these in production are configured by
 * the `STRIPE_PRICE_STARTER_PER_LOCATION` / `STRIPE_PRICE_PRO_PER_LOCATION`
 * env vars; the constants here are the source of truth for the
 * product catalog page and for in-process previews when Stripe isn't
 * wired up.
 */
export type PlanId = 'starter' | 'pro';

export const PLANS: Record<
  PlanId,
  { name: string; perLocationCents: number; description: string }
> = {
  starter: {
    name: 'Starter',
    perLocationCents: 5000, // $50/month/location
    description: 'POS, inventory, customers, and basic reports.',
  },
  pro: {
    name: 'Pro',
    perLocationCents: 10000, // $100/month/location
    description: 'Everything in Starter plus financial reports + CSV export.',
  },
};

export function monthlyPriceCents(plan: PlanId, locationCount: number): number {
  if (locationCount < 0 || !Number.isInteger(locationCount)) {
    throw new Error('locationCount must be a non-negative integer');
  }
  return PLANS[plan].perLocationCents * locationCount;
}
