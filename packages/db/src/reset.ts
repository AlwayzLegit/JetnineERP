import { createClient } from './client';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required to reset the database.');
    process.exit(1);
  }

  const { sql } = createClient({ url, max: 1 });

  try {
    // app_user is a cluster-wide role and may own objects in other databases
    // (e.g. dev + test running side by side). We only need to drop *this*
    // database's objects + privileges; the role itself is preserved and
    // migrate.ts re-grants on the new schema.
    await sql.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
          EXECUTE 'REASSIGN OWNED BY app_user TO ' || quote_ident(current_user);
          EXECUTE 'DROP OWNED BY app_user';
        END IF;
      END
      $$;
    `);
    await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE');
    await sql.unsafe('CREATE SCHEMA public');
    await sql.unsafe('GRANT ALL ON SCHEMA public TO public');
    // Drizzle keeps its migration ledger in a separate "drizzle" schema. Wipe
    // it too so a reset is a true clean slate; otherwise drizzle thinks all
    // migrations are applied and skips them, producing missing-table errors.
    await sql.unsafe('DROP SCHEMA IF EXISTS drizzle CASCADE');
    console.error('Database reset.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
