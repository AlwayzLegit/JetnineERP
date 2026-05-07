import { createClient } from './client.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required to reset the database.');
  process.exit(1);
}

const { sql } = createClient({ url, max: 1 });

try {
  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO public`;
  console.error('Database reset.');
} finally {
  await sql.end({ timeout: 5 });
}
