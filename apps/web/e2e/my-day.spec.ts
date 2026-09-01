/**
 * Cashier "My Day" acceptance (owner 2026-09-01, §12.3): the page renders
 * the seller's day in a real browser via the /my-day door — an order
 * written today shows up in the written tile and its unpaid balance in
 * the balance card — and a ZIP typed into New Sale's customer block
 * fills the city and state.
 */
import { expect, request, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'MyDayE2E!2026';
const EMAIL = `myday+${Date.now()}@example.com`;

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
    data: { email: EMAIL, password: PASSWORD, name: 'Reg Seller' },
  });
  if (!signup.ok()) throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
  const captured = await api
    .get(`${API_URL}/v1/dev/email/last`, { params: { to: EMAIL } })
    .then((r) => r.json());
  const match = (captured.html as string).match(/href="([^"]+)"/);
  if (!match) throw new Error('no verify link in email');
  await api.get(match[1]!.replace(/&amp;/g, '&'), { maxRedirects: 0 });

  const seed = await api.post(`${API_URL}/v1/dev/e2e-seed`, {
    data: { ownerEmail: EMAIL, businessSlug: `myday-${Date.now()}` },
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

test.describe('My Day', () => {
  test('an order written today reaches the page', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);
    await page.goto('/dashboard');

    // A customer and a confirmed order credited to me (the default
    // salesperson is the signed-in member), nothing paid.
    const result = await page.evaluate(
      async ({ apiUrl, variantId, locationId }) => {
        const custRes = await fetch(`${apiUrl}/v1/customers`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: 'Zip', lastName: 'Buyer', phone: '3105550199' }),
        });
        const cust = await custRes.json();
        const res = await fetch(`${apiUrl}/v1/orders`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: cust.id,
            locationId,
            fulfillmentType: 'pickup',
            lines: [{ variantId, quantity: 1 }],
            confirm: true,
          }),
        });
        return { status: res.status, body: await res.json() };
      },
      { apiUrl: API_URL, variantId, locationId },
    );
    expect(result.status, JSON.stringify(result.body)).toBe(201);
    const orderNumber = result.body.number as string;

    await page.goto('/my-day');
    await expect(page.getByTestId('my-day-dashboard')).toBeVisible();
    await expect(page.getByTestId('my-day-new-sale')).toBeVisible();

    // Written today counts it; balance due lists it in full; the pickup
    // card sees it at this store and knows it is mine.
    await expect(page.getByTestId('md-kpi-written')).toContainText('1 ticket');
    await expect(page.getByTestId('md-balance')).toContainText(orderNumber);
    const pickups = page.getByTestId('md-pickups');
    await expect(pickups).toContainText(orderNumber);
    await expect(pickups).toContainText('mine');

    // The rest of the day renders empty rather than erroring.
    await expect(page.getByTestId('md-callbacks')).toContainText('No open quotes');
    await expect(page.getByTestId('md-deliveries')).toContainText('None of your customers');
    await expect(page.getByTestId('md-returns')).toContainText('Nothing you started');
    await expect(page.getByTestId('md-kpi-drawer')).toContainText('no shift open');
  });

  test('a ZIP typed on New Sale fills the city and state', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);
    await page.goto('/pos');

    await page.getByRole('button', { name: /new customer/i }).click();
    const zip = page.getByLabel('ZIP').first();
    await zip.fill('90036');
    await expect(page.getByLabel('City').first()).toHaveValue('Los Angeles');
    await expect(page.getByLabel('State').first()).toHaveValue('CA');

    // A hand-typed city survives a ZIP change; an autofilled one follows it.
    await page.getByLabel('City').first().fill('Hancock Park');
    await zip.fill('94103');
    await expect(page.getByLabel('State').first()).toHaveValue('CA');
    await expect(page.getByLabel('City').first()).toHaveValue('Hancock Park');
  });
});
