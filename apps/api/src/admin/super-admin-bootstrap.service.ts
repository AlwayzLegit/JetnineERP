import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';

/**
 * Startup glue for the platform console: every email listed in
 * SUPER_ADMIN_EMAILS (comma-separated) gets `is_super_admin = true` on
 * boot. Managed Postgres offers no convenient psql access, and there is
 * deliberately no API that can grant super admin — so the deploy
 * environment is the root of trust. Idempotent; unknown emails are
 * logged and skipped (the user signs up first, next boot picks them up).
 */
@Injectable()
export class SuperAdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminBootstrapService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    const raw = process.env.SUPER_ADMIN_EMAILS;
    if (!raw?.trim()) return;
    const emails = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return;
    try {
      const updated = await this.db
        .update(schema.users)
        .set({ isSuperAdmin: true })
        .where(inArray(schema.users.email, emails))
        .returning({ email: schema.users.email });
      const found = new Set(updated.map((u) => (u.email ?? '').toLowerCase()));
      this.logger.log(
        `Super admin bootstrap: flagged ${updated.length}/${emails.length} account(s)`,
      );
      for (const email of emails) {
        if (!found.has(email)) {
          this.logger.warn(
            `Super admin bootstrap: no user with email ${email} yet — will retry next boot`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Super admin bootstrap failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
