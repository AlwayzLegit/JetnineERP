/**
 * Epic 1.2 acceptance: a super admin (or any user) can sign up, verify email,
 * sign in, enable 2FA, sign out, and reset their password.
 *
 * The test runs against a real API instance with the in-memory email
 * transport, and pulls verification + reset URLs out of /v1/dev/email/last.
 */
import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import { authenticator } from 'otplib';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_URL =
  process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

test.beforeAll(async () => {
  // Reset + migrate the dedicated E2E DB. The seed isn't required (we sign up
  // a fresh user inside the test) but reset is, so retries don't see stale
  // rows from a previous failed run.
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
});

async function getLastEmail(api: APIRequestContext, to: string) {
  const res = await api.get(`${API_URL}/v1/dev/email/last`, {
    params: { to },
  });
  expect(res.ok(), `last email for ${to} not captured: ${res.status()} ${await res.text()}`).toBe(
    true,
  );
  return res.json();
}

function extractUrl(html: string): string {
  const m = html.match(/href="([^"]+)"/);
  if (!m) throw new Error(`No href in email body: ${html.slice(0, 200)}`);
  return m[1]!.replace(/&amp;/g, '&');
}

test.describe('auth golden path', () => {
  const email = `e2e+${Date.now()}@example.com`;
  const password1 = 'OriginalPass1!2026';
  const password2 = 'NewPasswordX!2026';
  let totpSecret = '';

  test('signup → verify → login → 2FA → logout → password reset', async ({ page }) => {
    const api = await request.newContext();

    await test.step('sign up via the web form', async () => {
      await page.goto('/signup');
      await page.getByLabel('Full name').fill('E2E Tester');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password (min 12 chars)').fill(password1);
      await page.getByRole('button', { name: 'Sign up' }).click();
      await expect(page.getByTestId('auth-success')).toContainText('verification link');
    });

    await test.step('follow the verification link from the captured email', async () => {
      const captured = await getLastEmail(api, email);
      expect(captured.subject).toContain('Verify');
      const verifyUrl = extractUrl(captured.html as string);
      const res = await api.get(verifyUrl, { maxRedirects: 0 });
      // better-auth typically returns a redirect; we only assert success or
      // redirect (302/303) here — the next sign-in step proves the email is
      // actually marked verified.
      expect([200, 302, 303]).toContain(res.status());
    });

    await test.step('sign in with verified credentials', async () => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password1);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/pos'); // login lands on New Sale now
      await page.goto('/dashboard');
      await expect(page.getByTestId('dashboard-email')).toContainText(email);
    });

    await test.step('enable 2FA, capture the secret, verify the first code', async () => {
      await page.goto('/2fa');
      await page.getByLabel('Confirm your password').fill(password1);
      await page.getByRole('button', { name: 'Generate code' }).click();
      const totpURI = await page.getByTestId('totp-uri').textContent();
      const match = totpURI?.match(/secret=([A-Z0-9]+)/);
      expect(match, 'totp secret extracted').toBeTruthy();
      totpSecret = match![1]!;
      const code = authenticator.generate(totpSecret);
      await page.getByLabel('6-digit code').fill(code);
      await page.getByRole('button', { name: 'Verify and turn on' }).click();
      await expect(page.getByTestId('auth-success')).toContainText('2FA is now enabled');
    });

    await test.step('sign out from the app', async () => {
      // This user has no business, so /dashboard always redirects to
      // /welcome once the checklist fetch resolves. Clicking Sign out
      // on /dashboard raced that redirect — the button detached with
      // the page mid-click (this exact race failed in CI). Wait for
      // the redirect to finish and sign out from /welcome, which now
      // renders its own Sign out button.
      await page.goto('/dashboard');
      await page.waitForURL('**/welcome');
      await page.getByRole('button', { name: 'Sign out' }).click();
      await page.waitForURL('**/login');
    });

    await test.step('subsequent sign-in requires the TOTP code', async () => {
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password1);
      await page.getByRole('button', { name: 'Sign in' }).click();
      // Two-factor challenge UI mounts in place; we now type a fresh code.
      const code = authenticator.generate(totpSecret);
      await page.getByLabel('6-digit code').fill(code);
      await page.getByRole('button', { name: 'Verify' }).click();
      // A business-less account gets bounced from /dashboard to /welcome by
      // the onboarding checklist, so asserting dashboard content here races
      // that redirect. Landing on either page proves the TOTP sign-in
      // worked; the session endpoint proves who signed in.
      await page.waitForURL(/\/(pos|welcome)/);
      const sessionEmail = await page.evaluate(async (apiUrl) => {
        const res = await fetch(`${apiUrl}/api/auth/get-session`, { credentials: 'include' });
        const data = (await res.json()) as { user?: { email?: string } } | null;
        return data?.user?.email ?? null;
      }, API_URL);
      expect(sessionEmail).toBe(email);
      // Sign out again before the password-reset step — through the auth
      // API from the page context, since /welcome has no sign-out button.
      await page.evaluate(async (apiUrl) => {
        await fetch(`${apiUrl}/api/auth/sign-out`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
      }, API_URL);
      await page.goto('/login');
    });

    await test.step('request a password reset and follow the email link', async () => {
      await page.goto('/reset');
      await page.getByLabel('Email').fill(email);
      await page.getByRole('button', { name: 'Send reset email' }).click();
      await expect(page.getByTestId('auth-success')).toContainText('reset link');

      const captured = await getLastEmail(api, email);
      expect(captured.subject).toContain('Reset');
      const resetUrl = extractUrl(captured.html as string);
      // The reset URL points at the API which then redirects to the web
      // /reset?token=… page. Follow the redirect manually so Playwright lands
      // on the form.
      const res = await api.get(resetUrl, { maxRedirects: 0 });
      expect([302, 303]).toContain(res.status());
      const location = res.headers()['location'];
      expect(location, 'reset redirect target').toBeTruthy();
      await page.goto(location!);
      await page.getByLabel('New password (min 12 chars)').fill(password2);
      await page.getByLabel('Confirm new password').fill(password2);
      await page.getByRole('button', { name: 'Set password' }).click();
      await expect(page.getByTestId('auth-success')).toContainText('Password updated');
    });

    await test.step('sign in with the new password (still requires 2FA)', async () => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password2);
      await page.getByRole('button', { name: 'Sign in' }).click();
      const code = authenticator.generate(totpSecret);
      await page.getByLabel('6-digit code').fill(code);
      await page.getByRole('button', { name: 'Verify' }).click();
      await page.waitForURL('**/pos');
    });

    await api.dispose();
  });
});

// Helper for pages: not currently used but reserved for future tests.
export type _PageRef = Page;
