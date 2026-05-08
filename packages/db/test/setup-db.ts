// Reset + migrate the test database before vitest runs anything.
// Configured via TEST_DATABASE_URL (falls back to a local default).
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const dbPackageRoot = join(__dirname, '..');

const url =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_test';

export async function setup(): Promise<void> {
  const env = { ...process.env, DATABASE_URL: url };

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
}

export async function teardown(): Promise<void> {
  // Nothing to do — leave the test DB populated for inspection between runs.
}
