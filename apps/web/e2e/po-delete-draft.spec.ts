/**
 * CR 2026-08-31 — "Let draft purchase orders be deleted".
 *
 * The journey the CR asks for, in a real browser: a draft PO exists,
 * its detail page offers Delete draft, the confirm dialog stays disarmed
 * until the PO number is typed, the draft leaves the list, "Show
 * deleted" brings it back greyed with a Restore action, and restoring
 * puts it back on the default list with its number intact.
 */
import { expect, request, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'PoDeleteE2E!2026';
const EMAIL = `podelete+${Date.now()}@example.com`;

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
    data: { email: EMAIL, password: PASSWORD, name: 'PO Buyer' },
  });
  if (!signup.ok()) throw new Error(`signup failed: ${signup.status()} ${await signup.text()}`);

  const captured = await api
    .get(`${API_URL}/v1/dev/email/last`, { params: { to: EMAIL } })
    .then((r) => r.json());
  const match = (captured.html as string).match(/href="([^"]+)"/);
  if (!match) throw new Error('no verify link in email');
  await api.get(match[1]!.replace(/&amp;/g, '&'), { maxRedirects: 0 });

  const seed = await api.post(`${API_URL}/v1/dev/e2e-seed`, {
    data: { ownerEmail: EMAIL, businessSlug: `po-del-${Date.now()}` },
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

/** A vendor and one draft PO against it, straight through the API. */
async function makeDraftPo(
  page: import('@playwright/test').Page,
): Promise<{ id: string; number: string }> {
  return page.evaluate(
    async ({ apiUrl, locationId, variantId }) => {
      const post = async (path: string, body: unknown) => {
        const res = await fetch(`${apiUrl}${path}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
        return res.json();
      };
      const vendor = await post('/v1/vendors', { name: `Draft Vendor ${Date.now()}` });
      const po = await post('/v1/purchase-orders', {
        vendorId: vendor.id,
        locationId,
        place: false,
        lines: [{ variantId, quantity: 4, unitCostCents: 12_500 }],
      });
      return { id: po.id as string, number: po.number as string };
    },
    { apiUrl: API_URL, locationId, variantId },
  );
}

test.describe('Deleting a draft purchase order', () => {
  test('delete → hidden → Show deleted → restore', async ({ page }) => {
    test.slow();
    await loginAndPickBusiness(page);
    await page.goto('/purchase-orders');
    const po = await makeDraftPo(page);

    await page.goto(`/purchase-orders/${po.id}`);
    await expect(page.getByTestId('delete-po')).toBeVisible();

    // The dialog shows what is about to go and stays disarmed until the
    // number is typed.
    await page.getByTestId('delete-po').click();
    const dialog = page.getByTestId('delete-po-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('$500.00');
    await expect(page.getByTestId('delete-po-submit')).toBeDisabled();
    await page.getByTestId('delete-po-confirm').fill('nope');
    await expect(page.getByTestId('delete-po-submit')).toBeDisabled();
    await page.getByTestId('delete-po-confirm').fill(po.number);
    await expect(page.getByTestId('delete-po-submit')).toBeEnabled();
    await page.getByTestId('delete-po-submit').click();

    // Back on the list, and gone from it.
    await page.waitForURL(/\/purchase-orders$/);
    await expect(page.getByText(po.number)).toBeHidden();

    // "Show deleted" brings it back, greyed, with who and when.
    await page.getByTestId('show-deleted-toggle').getByRole('checkbox').check();
    const deletedRow = page.getByTestId('po-row-deleted').filter({ hasText: po.number });
    await expect(deletedRow).toHaveCount(1);
    await expect(deletedRow).toContainText('deleted');
    await expect(deletedRow).toContainText(EMAIL);

    // Restore puts it back on the default list with its number intact.
    await page.getByTestId(`restore-${po.number}`).click();
    await expect(page.getByTestId('po-row-deleted')).toHaveCount(0);
    await page.getByTestId('show-deleted-toggle').getByRole('checkbox').uncheck();
    await expect(page.getByTestId('po-row').filter({ hasText: po.number })).toHaveCount(1);
  });

  test('the button is absent once the PO is placed', async ({ page }) => {
    await loginAndPickBusiness(page);
    await page.goto('/purchase-orders');
    const po = await makeDraftPo(page);

    await page.goto(`/purchase-orders/${po.id}`);
    await expect(page.getByTestId('delete-po')).toBeVisible();
    await page.getByTestId('place-po').click();
    await expect(page.getByTestId('place-po')).toHaveCount(0);
    await expect(page.getByTestId('delete-po')).toHaveCount(0);

    // And the change history records what happened to it.
    await expect(page.getByTestId('po-timeline')).toContainText('place');
  });
});
