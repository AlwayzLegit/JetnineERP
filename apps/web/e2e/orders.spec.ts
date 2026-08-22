/**
 * STORIS cutover Day 2 acceptance: write an order with a deposit
 * end-to-end in the browser, and see the committed quantity in the
 * inventory view.
 *
 * Flow: order writer (/orders/new) → search, add a line, attach a
 * customer, confirm → order detail shows OPEN with the line reserved →
 * take a cash deposit → paid/balance move → /inventory shows the
 * reserved unit → the pipeline board shows the order in the Open
 * column. Then the POS variant: cart → "Save as order / take deposit"
 * → confirmed order with the deposit already posted.
 */
import { expect, request, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'OrdersE2E!2026';
const EMAIL = `orders+${Date.now()}@example.com`;

let businessId = '';
let variantSku = '';

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
    data: { email: EMAIL, password: PASSWORD, name: 'Order Writer' },
  });
  if (!signup.ok()) {
    throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);
  }
  const captured = await api
    .get(`${API_URL}/v1/dev/email/last`, { params: { to: EMAIL } })
    .then((r) => r.json());
  const match = (captured.html as string).match(/href="([^"]+)"/);
  if (!match) throw new Error('no verify link in email');
  await api.get(match[1]!.replace(/&amp;/g, '&'), { maxRedirects: 0 });

  const seed = await api.post(`${API_URL}/v1/dev/e2e-seed`, {
    data: { ownerEmail: EMAIL, businessSlug: `orders-${Date.now()}` },
  });
  if (!seed.ok()) throw new Error(`seed failed: ${seed.status()} ${await seed.text()}`);
  const seeded = (await seed.json()) as { businessId: string; variantSku: string };
  businessId = seeded.businessId;
  variantSku = seeded.variantSku;
  await api.dispose();
});

async function loginAndPickBusiness(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(dashboard|business-picker)/);
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

test.describe('Day 2 — order writer', () => {
  test('write order → deposit → committed stock visible → board', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);

    // --- Write the order ---
    await page.goto('/orders/new');
    const scan = page.getByPlaceholder('Scan barcode or type to search…');
    await scan.fill(variantSku);
    await scan.press('Enter');
    const result = page.locator('button:has(strong)').first();
    await expect(result).toBeVisible();
    await result.click();

    await page.getByRole('button', { name: 'Attach customer' }).click();
    await page.getByRole('button', { name: '+ New customer' }).click();
    await page.getByPlaceholder('First name').fill('Dana');
    await page.getByPlaceholder('Last name').fill('Buyer');
    await page.getByRole('button', { name: 'Create & attach' }).click();
    await expect(page.getByTestId('order-customer')).toContainText('Dana Buyer');

    await page.getByTestId('confirm-order').click();
    await page.waitForURL(/\/orders\/[0-9a-f-]{36}$/);

    // --- Detail: open, line reserved, no money yet ---
    await expect(page.getByTestId('order-status')).toHaveText(/open/i);
    const lineRow = page.locator('tbody tr').first();
    await expect(lineRow).toContainText('Widget'); // seeded product name
    // Columns: item, type, qty, reserved, fulfilled, total — confirming
    // committed the full quantity.
    await expect(lineRow.locator('td').nth(2)).toHaveText('1');
    await expect(lineRow.locator('td').nth(3)).toHaveText('1');
    await expect(page.getByTestId('balance-due')).toContainText('$10.00');

    // --- Take the deposit ---
    await page.getByTestId('payment-amount').fill('2.50');
    await page.getByTestId('take-payment').click();
    await expect(page.locator('tbody tr', { hasText: 'deposit' })).toContainText('$2.50');
    await expect(page.getByTestId('balance-due')).toContainText('$7.50');
    const orderUrl = page.url();

    // --- Committed stock visible in inventory ---
    await page.goto('/inventory');
    const invRow = page.locator('tr', { hasText: variantSku });
    await expect(invRow).toBeVisible();
    // Columns: product, sku, barcode, on hand, reserved, available.
    await expect(invRow.locator('td').nth(3)).toHaveText('100');
    await expect(invRow.locator('td').nth(4)).toHaveText('1');
    await expect(invRow.locator('td').nth(5)).toHaveText('99');

    // --- Pipeline board shows it under Open ---
    await page.goto('/orders');
    await expect(page.getByTestId('pipeline-count-open')).toHaveText('1');
    await page.getByTestId('order-card').first().click();
    await page.waitForURL(orderUrl);
  });

  test('POS cart saves as a confirmed order with deposit', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);

    await page.goto('/pos');
    const scan = page.getByPlaceholder('Scan barcode or type to search…');
    await scan.fill(variantSku);
    await scan.press('Enter');
    // The seeded variant has a SKU but no barcode, so the result list
    // always renders (no barcode auto-add) and must be clicked — never
    // probe it with an instantaneous isVisible(), that races the lookup.
    const result = page.locator('button:has(strong)').first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(page.getByTestId('save-as-order')).toBeEnabled();

    // No customer yet: the dialog demands one first.
    await page.getByTestId('save-as-order').click();
    await page.getByTestId('order-attach-customer').click();
    await page.getByRole('button', { name: '+ New customer' }).click();
    await page.getByPlaceholder('First name').fill('Kim');
    await page.getByPlaceholder('Last name').fill('Walkin');
    await page.getByRole('button', { name: 'Create & attach' }).click();

    // Re-open the dialog now that a customer is attached.
    await page.getByTestId('save-as-order').click();
    await expect(page.getByTestId('order-deposit')).toBeVisible();
    // Suggested deposit prefills at 25% of $10.00.
    await expect(page.getByTestId('order-deposit')).toHaveValue('2.50');
    await page.getByTestId('order-save-confirm').click();

    await page.waitForURL(/\/orders\/[0-9a-f-]{36}$/);
    await expect(page.getByTestId('order-status')).toHaveText(/open/i);
    await expect(page.locator('tbody tr', { hasText: 'deposit' })).toContainText('$2.50');
    await expect(page.getByTestId('balance-due')).toContainText('$7.50');
  });
});
