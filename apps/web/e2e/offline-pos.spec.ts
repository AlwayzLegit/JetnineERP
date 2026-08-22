/**
 * Phase 2.16 acceptance: a cashier rings up a sale at /pos, the
 * browser drops offline, the next sale is queued locally, the
 * /pos/pending tray shows it, and reconnecting drains the queue
 * with idempotent replay (no double-charge).
 *
 * Mirrors the realistic outage flow: load → make sale online →
 * go offline → make sale offline → reconnect → assert one extra
 * sale row materialized server-side and the queue is empty.
 */
import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'OfflineE2E!2026';
const EMAIL = `offline+${Date.now()}@example.com`;

let businessId = '';
let locationId = '';
let variantSku = '';

test.beforeAll(async () => {
  // Reset + migrate the dedicated E2E DB so a re-run never sees stale
  // queue state in another browser profile.
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

  // Sign up + verify a user via the API. We then create a business +
  // membership directly in the DB; signup-then-verify is the only
  // user-creation path that exercises better-auth, but everything
  // tenant-scoped is straight inserts to keep the test fast.
  const api = await request.newContext();
  const signup = await api.post(`${API_URL}/api/auth/sign-up/email`, {
    data: { email: EMAIL, password: PASSWORD, name: 'Offline Cashier' },
  });
  if (!signup.ok()) {
    throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
  }

  // Pull the verification email link and follow it.
  const captured = await api
    .get(`${API_URL}/v1/dev/email/last`, { params: { to: EMAIL } })
    .then((r) => r.json());
  const html = captured.html as string;
  const match = html.match(/href="([^"]+)"/);
  if (!match) throw new Error('no verify link in email');
  await api.get(match[1]!.replace(/&amp;/g, '&'), { maxRedirects: 0 });

  // Seed business + membership + a product/variant. Done via the dev
  // shortcut endpoint to avoid pulling drizzle into the e2e bundle.
  const seed = await api.post(`${API_URL}/v1/dev/e2e-seed`, {
    data: { ownerEmail: EMAIL, businessSlug: `offline-${Date.now()}` },
  });
  if (!seed.ok()) {
    throw new Error(`seed failed: ${seed.status()} ${await seed.text()}`);
  }
  const seeded = (await seed.json()) as {
    businessId: string;
    locationId: string;
    variantSku: string;
  };
  businessId = seeded.businessId;
  locationId = seeded.locationId;
  variantSku = seeded.variantSku;

  await api.dispose();
});

async function loginAndPickBusiness(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(dashboard|business-picker)/);

  // Set the active business via the cookie endpoint. The dashboard
  // would let the user pick from a UI, but we shortcut here for
  // determinism.
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

async function countServerSales(api: APIRequestContext): Promise<number> {
  const res = await api.get(`${API_URL}/v1/sales`, {
    headers: { 'X-Business-Id': businessId },
  });
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { data: unknown[] };
  return body.data.length;
}

test.describe('Phase 2.16 — offline POS', () => {
  test('online sale → offline sale queued → reconnect drains queue', async ({ page, context }) => {
    test.slow();
    const api = await request.newContext({
      // Reuse the browser cookies — login state needs to stay attached
      // for /v1/sales reads from the test side.
      storageState: undefined,
    });

    await loginAndPickBusiness(page);
    await page.goto('/pos');
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    // Wait for the service worker to actually control this page. It is
    // registered from a useEffect and claims clients asynchronously, so for
    // the first moments after load nothing is being cached at all.
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
      timeout: 20_000,
    });

    // Now visit the pending tray once while online. The SW caches /pos*
    // pages as they are visited — there is no precache list — so a route
    // never opened online is not available offline, and the offline
    // navigation later in this test would land on the "You're offline"
    // shell. This mirrors what the app tells the user: "The register hasn't
    // loaded this page yet ... reconnect once and the page will be cached."
    await page.goto('/pos/pending');
    await expect(page.getByRole('heading', { name: /Pending sales/i })).toBeVisible();

    await page.goto('/pos');
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();

    // First (online) sale: search for the seeded variant SKU and ring it up.
    await page.getByPlaceholder(/scan|search/i).fill(variantSku);
    await page.keyboard.press('Enter');
    // The seeded variant carries a SKU but no barcode, and the register only
    // auto-adds on an exact barcode hit — so searching by SKU always renders a
    // result list that has to be clicked. The previous `isVisible()` probe
    // resolved instantly, before the lookup request had come back, so the
    // click was silently skipped and the cart stayed empty; Pay then sat
    // disabled until the 180s timeout. Wait for the row instead.
    const result = page.getByText(/Widget/i).first();
    await expect(result).toBeVisible();
    await result.click();
    // Fail here, with a clear message, rather than 3 minutes later on a
    // disabled button, if the row click ever stops filling the cart.
    const payButton = page.getByRole('button', { name: /^Pay/ });
    await expect(payButton).toBeEnabled();
    await payButton.click();
    await page.getByLabel(/Cash tendered/i).fill('10.00');
    await page.getByRole('button', { name: /Confirm payment/i }).click();
    await expect(page.getByRole('heading', { name: /Sale complete/i })).toBeVisible({
      timeout: 15_000,
    });

    // Pull the baseline server-side sale count via a sibling API context
    // that shares the cookie jar with the page (Playwright auto-syncs).
    const apiCtx = await context.request;
    const baselineCount = await countServerSales(apiCtx);
    expect(baselineCount).toBeGreaterThanOrEqual(1);

    // Start a new sale.
    await page.getByRole('button', { name: /New sale|Start new/i }).click();
    await page.getByPlaceholder(/scan|search/i).fill(variantSku);
    await page.keyboard.press('Enter');
    // Same wait as the first sale — this lookup is still online, so the row
    // has to arrive before it can be clicked.
    const result2 = page.getByText(/Widget/i).first();
    await expect(result2).toBeVisible();
    await result2.click();
    // Cart must be filled *before* going offline; otherwise the offline
    // assertions below chase a register that has nothing to sell.
    const payButton2 = page.getByRole('button', { name: /^Pay/ });
    await expect(payButton2).toBeEnabled();

    // Drop offline before paying.
    await context.setOffline(true);
    await expect(page.getByText(/Offline\./i)).toBeVisible();

    await payButton2.click();
    await page.getByLabel(/Cash tendered/i).fill('10.00');
    await page.getByRole('button', { name: /Confirm payment/i }).click();
    // Queued receipt should render.
    await expect(page.getByText(/QUEUED/i)).toBeVisible({ timeout: 10_000 });

    // Pending tray shows the queued sale.
    await page.goto('/pos/pending');
    await expect(page.getByRole('heading', { name: /Pending sales/i })).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount(1);

    // Reconnect — the auto-sync useEffect should drain the queue.
    await context.setOffline(false);

    // Wait until the queue table is empty (or the empty-state message shows).
    await expect
      .poll(
        async () => {
          await page.reload();
          const empty = await page
            .getByText(/Nothing queued/i)
            .isVisible()
            .catch(() => false);
          if (empty) return 'empty';
          const rowCount = await page.locator('table tbody tr').count();
          return rowCount;
        },
        { timeout: 20_000, message: 'queue should drain after reconnect' },
      )
      .toBe('empty');

    // One additional sale row should exist server-side.
    const finalCount = await countServerSales(apiCtx);
    expect(finalCount).toBe(baselineCount + 1);

    await api.dispose();
  });
});
