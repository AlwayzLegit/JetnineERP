import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from './client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required to run migrations.');
    process.exit(1);
  }

  const { db, sql } = createClient({ url, max: 1 });

  try {
    // 1. Extensions must exist before tables that reference them (citext).
    await sql.unsafe('CREATE EXTENSION IF NOT EXISTS citext');

    // 2. Drizzle-managed schema migrations.
    await migrate(db, { migrationsFolder: join(__dirname, '..', 'drizzle') });

    // 3. RLS / roles / policies. Idempotent; safe to re-run on every deploy.
    const rlsPath = join(__dirname, 'migrations', 'rls.sql');
    const rls = readFileSync(rlsPath, 'utf8');
    await sql.unsafe(rls);

    console.error('Migrations applied (schema + RLS).');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
