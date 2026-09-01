/**
 * Warehouse dashboard acceptance (owner 2026-09-01, §12.2): the page
 * renders its day — an overdue inbound PO leads the inbound card and
 * the KPI strip shows it — in a real browser, via the /warehouse door
 * (the Owner holds the permission but keeps their own /dashboard home).
 */
import { expect, request, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'WarehouseE2E!2026';
const EMAIL = `warehouse+${Date.now()}@example.com`;

let businessId = '';
let locationId = '';
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
    data: { email: EMAIL, password: PASSWORD, name: 'Dock Boss' },
  });
  if (!signup.ok()) throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
  const captured = await api
    .get(`${API_URL}/v1/dev/email/last`, { params: { to: EMAIL } })
    .then((r) => r.json());
  const match = (captured.html as string).match(/href="([^"]+)"/);
  if (!match) throw new Error('no verify link in email');
  await api.get(match[1]!.replace(/&amp;/g, '&'), { maxRedirects: 0 });

  const seed = await api.post(`${API_URL}/v1/dev/e2e-seed`, {
    data: { ownerEmail: EMAIL, businessSlug: `wh-${Date.now()}` },
  });
  if (!seed.ok()) throw new Error(`seed failed: ${seed.status()} ${await seed.text()}`);
  const seeded = (await seed.json()) as {
    businessId: string;
    locationId: string;
    variantId: string;
  };
  businessId = seeded.businessId;
  locationId = seeded.locationId;
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

test.describe('Warehouse dashboard', () => {
  test('an overdue inbound PO reaches the page', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);
    await page.goto('/dashboard');

    // A placed PO expected yesterday — the call-the-vendor row.
    const status = await page.evaluate(
      async ({ apiUrl, variantId, locationId }) => {
        const vendorRes = await fetch(`${apiUrl}/v1/vendors`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `Dock Vendor ${Date.now()}` }),
        });
        const vendor = await vendorRes.json();
        const res = await fetch(`${apiUrl}/v1/purchase-orders`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendor.id,
            locationId,
            place: true,
            expectedAt: new Date(Date.now() - 86_400_000).toISOString().slice(0, 10),
            lines: [{ variantId, quantity: 5, unitCostCents: 10_000 }],
          }),
        });
        return res.status;
      },
      { apiUrl: API_URL, variantId, locationId },
    );
    expect(status).toBe(201);

    await page.goto('/warehouse');
    await expect(page.getByTestId('warehouse-dashboard')).toBeVisible();

    // KPI strip knows about it, and the inbound card shows it overdue.
    await expect(page.getByTestId('wh-kpi-inbound')).toContainText('1 overdue');
    const inbound = page.getByTestId('wh-inbound');
    await expect(inbound).toContainText('0/5 units');
    await expect(inbound).toContainText('overdue');

    // The rest of the day renders empty rather than erroring.
    await expect(page.getByTestId('wh-loadout')).toContainText('No deliveries');
    await expect(page.getByTestId('wh-picklist')).toContainText('Nothing scheduled');
    await expect(page.getByTestId('wh-counts')).toContainText('No negative on-hand');
  });
});
