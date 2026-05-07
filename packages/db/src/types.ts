import { customType } from 'drizzle-orm/pg-core';

// Postgres `citext` (case-insensitive text). Requires the `citext` extension —
// installed by migrate.ts before any Drizzle migrations run.
export const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'citext';
  },
});

// Postgres `inet`. Stored as a string ("127.0.0.1", "::1", "10.0.0.0/8").
export const inet = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'inet';
  },
});
