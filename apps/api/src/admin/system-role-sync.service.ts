import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { DRIZZLE } from '../database/database.module';

/**
 * Keeps every business's SYSTEM roles aligned with the permission
 * catalog. Roles get their permission rows at business creation, so a
 * permission added to the catalog later (e.g. `integrations.manage`)
 * would be missing from businesses created before it shipped — the
 * Owner of an early tenant would 403 on a brand-new feature.
 *
 * On boot: for each system role name, insert any catalog permissions
 * its rows are missing. Insert-only (never deletes), so per-business
 * customization of system roles is preserved. Custom (non-system)
 * roles are never touched.
 */
@Injectable()
export class SystemRoleSyncService implements OnModuleInit {
  private readonly logger = new Logger(SystemRoleSyncService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test' && process.env.SYSTEM_ROLE_SYNC !== '1') return;
    try {
      let added = 0;
      for (const def of SYSTEM_ROLES) {
        if (def.permissions.length === 0) continue;
        const systemRoles = await this.db
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(and(eq(schema.roles.name, def.name), eq(schema.roles.isSystem, true)));
        if (systemRoles.length === 0) continue;
        const values = systemRoles.flatMap((r) =>
          def.permissions.map((permission) => ({ roleId: r.id, permission })),
        );
        for (let i = 0; i < values.length; i += 1000) {
          const result = await this.db
            .insert(schema.rolePermissions)
            .values(values.slice(i, i + 1000))
            .onConflictDoNothing()
            .returning({ roleId: schema.rolePermissions.roleId });
          added += result.length;
        }
      }
      if (added > 0) {
        this.logger.log(`System role sync: backfilled ${added} permission row(s)`);
      }
    } catch (err) {
      this.logger.error(`System role sync failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
