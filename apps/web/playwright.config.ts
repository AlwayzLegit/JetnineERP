import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 3001);
const API_PORT = Number(process.env.PLAYWRIGHT_API_PORT ?? 4001);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // API: built once via `pnpm build` before E2E (CI does this); dev server
      // is fine for local interactive runs. We use the built version so a
      // single test run doesn't depend on watch mode.
      command: `node ../../apps/api/dist/main.js`,
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development',
        PORT: String(API_PORT),
        BETTER_AUTH_URL: `http://localhost:${API_PORT}`,
        BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-12',
        AUTH_TRUSTED_ORIGINS: baseURL,
        CORS_ORIGIN: baseURL,
        DATABASE_URL:
          process.env.E2E_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_e2e',
        // No RESEND_API_KEY → memory transport. Tests pull captured emails
        // via /v1/dev/email/last.
        LOG_LEVEL: 'info',
      },
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 30_000,
    },
    {
      // Use `next dev` so NEXT_PUBLIC_* env vars are read at runtime — the
      // production build bakes them in, which forces a rebuild for any
      // port change. Dev mode is plenty fast for our E2E suite.
      command: `next dev --port ${PORT}`,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
      },
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 90_000,
    },
  ],
});
