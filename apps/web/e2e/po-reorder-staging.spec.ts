/**
 * CR 2026-08-31, root cause — the reorder panel must stop committing a
 * numbered draft on the first click.
 *
 * The property that matters: pressing "Review & order" writes NOTHING.
 * The suggestions arrive staged on the builder, editable and
 * discardable, and a purchase order exists only once the buyer saves.
 */
import { expect, request, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'ReorderStagingE2E!2026';
const EMAIL = `reorder+${Date.now()}@example.com`;
const VENDOR = `Staging Vendor ${Date.now()}`;

let businessId = '';
let variantId = '';

test.beforeAll(async () => {
  const env = { ...process.env, DATABASE_URL: DB_URL };
  execFileSync('pnpm', ['exec', 'tsx', 'src/reset.ts'], {
    cwd: dbPackageRoot,
    env,
    stdio: 'inherit',
  });
  execFileSync('pnpm', ['exec', 'tsx', 'src/migrate.ts'], {
    cwd: dbPackageRoot,
    env,
    stdio: 'inherit',
  });

  const api = await request.newContext();
  const signup = await api.post(`${API_URL}/api/auth/sign-up/email`, {
    data: { email: EMAIL, password: PASSWORD, name: 'Reorder Buyer' },
  });
  if (!signup.ok()) throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
  const captured = await api
    .get(`${API_URL}/v1/dev/email/last`, { params: { to: EMAIL } })
    .then((r) => r.json());
  const match = (captured.html as string).match(/href="([^"]+)"/);
  if (!match) throw new Error('no verify link in email');
  await api.get(match[1]!.replace(/&amp;/g, '&'), { maxRedirects: 0 });

  const seed = await api.post(`${API_URL}/v1/dev/e2e-seed`, {
    data: { ownerEmail: EMAIL, businessSlug: `reorder-${Date.now()}` },
  });
  if (!seed.ok()) throw new Error(`seed failed: ${seed.status()} ${await seed.text()}`);
  const seeded = (await seed.json()) as { businessId: string; variantId: string };
  businessId = seeded.businessId;
  variantId = seeded.variantId;
  await api.dispose();
});

async function loginAndPickBusiness(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(pos|business-picker)/);
  await page.evaluate(
    async ({ apiUrl, businessId }) => {
      await fetch(`${apiUrl}/v1/auth/active-business`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
    },
    { apiUrl: API_URL, businessId },
  );
}

/** A vendor, and a managed variant sitting below its reorder point. */
async function makeSuggestion(page: import('@playwright/test').Page): Promise<void> {
  const status = await page.evaluate(
    async ({ apiUrl, variantId, vendorName }) => {
      const send = async (method: string, path: string, body: unknown) => {
        const res = await fetch(`${apiUrl}${path}`, {
          method,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
        return res.json();
      };
      const vendor = await send('POST', '/v1/vendors', { name: vendorName });
      // The e2e seed stocks 100 units, so the point sits above it to
      // put the variant under water and produce a suggestion.
      await send('PATCH', `/v1/products/variants/${variantId}/reorder`, {
        reorderPoint: 200,
        reorderQty: 6,
        preferredVendorId: vendor.id,
      });
      return 'ok';
    },
    { apiUrl: API_URL, variantId, vendorName: VENDOR },
  );
  expect(status).toBe('ok');
}

async function poCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(async (apiUrl) => {
    const res = await fetch(`${apiUrl}/v1/purchase-orders?includeDeleted=1&limit=100`, {
      credentials: 'include',
    });
    const body = (await res.json()) as { data: unknown[] };
    return body.data.length;
  }, API_URL);
}

test.describe('Reorder suggestions stage instead of committing', () => {
  test('Review & order writes nothing until the buyer saves', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);
    await page.goto('/purchase-orders');
    await makeSuggestion(page);
    await page.reload();

    expect(await poCount(page)).toBe(0);

    const review = page.getByTestId(`review-po-${VENDOR}`);
    await expect(review).toBeVisible();
    await review.click();

    // The builder opened with the suggestion already staged: the seeded
    // "Widget" is on the lines table, at its suggested quantity.
    await page.waitForURL(/\/purchase-orders\/new\?/);
    const stagedLine = page.getByRole('row').filter({ hasText: 'Widget' });
    await expect(stagedLine).toHaveCount(1);
    await expect(page.getByTestId('save-draft')).toBeVisible();
    await expect(page.getByTestId('place-order')).toBeVisible();

    // …and still nothing has been written.
    expect(await poCount(page)).toBe(0);

    // Walking away costs nothing either.
    await page.goto('/purchase-orders');
    expect(await poCount(page)).toBe(0);

    // Save as draft is the first write.
    await page.getByTestId(`review-po-${VENDOR}`).click();
    await page.waitForURL(/\/purchase-orders\/new\?/);
    await expect(page.getByRole('row').filter({ hasText: 'Widget' })).toHaveCount(1);
    await page.getByTestId('save-draft').click();
    await page.waitForURL(/\/purchase-orders\/[0-9a-f-]{36}$/);

    expect(await poCount(page)).toBe(1);
    await expect(page.getByTestId('delete-po')).toBeVisible(); // it is a draft
  });
});
