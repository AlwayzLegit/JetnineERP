import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createClient } from './client.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required to run migrations.');
  process.exit(1);
}

const { db, sql } = createClient({ url, max: 1 });

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.error('Migrations applied.');
} finally {
  await sql.end({ timeout: 5 });
}
