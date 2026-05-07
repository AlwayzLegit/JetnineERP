import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type DbClient = ReturnType<typeof drizzle>;

export interface CreateClientOptions {
  url: string;
  max?: number;
  ssl?: boolean | 'require' | 'allow' | 'prefer' | 'verify-full';
}

export function createClient(options: CreateClientOptions): {
  db: DbClient;
  sql: ReturnType<typeof postgres>;
} {
  const sql = postgres(options.url, {
    max: options.max ?? 10,
    ssl: options.ssl,
    prepare: false,
  });
  const db = drizzle(sql);
  return { db, sql };
}
