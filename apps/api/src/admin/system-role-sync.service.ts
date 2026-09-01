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
 * On boot, two passes:
 *
 * 1. Create any system role the catalog has gained since a business was
 *    set up. Without this a new role (Operations, 2026-08-31) would
 *    exist only for tenants created after it shipped, which is every
 *    tenant except the ones that matter. Skipped when the business
 *    already has a role of that name — a hand-built "Operations" is
 *    theirs, and silently shadowing it would be worse than doing
 *    nothing.
 * 2. For each system role, insert any catalog permissions its rows are
 *    missing.
 *
 * Both passes are insert-only (never delete), so per-business
 * customization of system roles is preserved. Custom (non-system) roles
 * are never modified.
 */
/**
 * Catalog roles that changed name. The sync renames the tenant's SYSTEM
 * role row in place — same id, so memberships never move — instead of
 * minting the new name alongside and stranding everyone on the old one.
 * A business that already has ANY role under the new name (their own
 * hand-built one included) is skipped: their name, their role.
 */
const RENAMED_SYSTEM_ROLES: Record<string, string> = {
  // Owner 2026-09-01: the clerk got a dashboard and a shorter name.
  'Inventory Clerk': 'Warehouse',
};

@Injectable()
export class SystemRoleSyncService implements OnModuleInit {
  private readonly logger = new Logger(SystemRoleSyncService.name);

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test' && process.env.SYSTEM_ROLE_SYNC !== '1') return;
    try {
      const renamed = await this.renameRoles();
      const created = await this.createMissingRoles();
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
      if (renamed > 0 || created > 0 || added > 0) {
        this.logger.log(
          `System role sync: renamed ${renamed}, created ${created} role(s), backfilled ${added} permission row(s)`,
        );
      }
    } catch (err) {
      this.logger.error(`System role sync failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** Applies RENAMED_SYSTEM_ROLES; must run before createMissingRoles,
   * or the create pass would mint the new name next to the old role. */
  private async renameRoles(): Promise<number> {
    let renamed = 0;
    for (const [oldName, newName] of Object.entries(RENAMED_SYSTEM_ROLES)) {
      const candidates = await this.db
        .select({ id: schema.roles.id, businessId: schema.roles.businessId })
        .from(schema.roles)
        .where(and(eq(schema.roles.name, oldName), eq(schema.roles.isSystem, true)));
      if (candidates.length === 0) continue;
      const taken = await this.db
        .select({ businessId: schema.roles.businessId })
        .from(schema.roles)
        .where(eq(schema.roles.name, newName));
      const takenBusinesses = new Set(taken.map((r) => r.businessId));
      const def = SYSTEM_ROLES.find((r) => r.name === newName);
      for (const role of candidates) {
        if (takenBusinesses.has(role.businessId)) continue;
        await this.db
          .update(schema.roles)
          .set({ name: newName, ...(def ? { description: def.description } : {}) })
          .where(eq(schema.roles.id, role.id));
        renamed += 1;
      }
    }
    return renamed;
  }

  /**
   * Adds catalog roles a business is missing, with their permissions.
   * Name collision — system or custom — means skip: the business
   * already has something answering to that name.
   */
  private async createMissingRoles(): Promise<number> {
    const businesses = await this.db.select({ id: schema.businesses.id }).from(schema.businesses);
    if (businesses.length === 0) return 0;
    const existing = await this.db
      .select({ businessId: schema.roles.businessId, name: schema.roles.name })
      .from(schema.roles);
    const taken = new Set(existing.map((r) => `${r.businessId}:${r.name}`));

    let created = 0;
    for (const business of businesses) {
      for (const def of SYSTEM_ROLES) {
        if (taken.has(`${business.id}:${def.name}`)) continue;
        const [role] = await this.db
          .insert(schema.roles)
          .values({
            businessId: business.id,
            name: def.name,
            description: def.description,
            isSystem: true,
          })
          .returning({ id: schema.roles.id });
        if (!role) continue;
        if (def.permissions.length > 0) {
          await this.db
            .insert(schema.rolePermissions)
            .values(def.permissions.map((permission) => ({ roleId: role.id, permission })))
            .onConflictDoNothing();
        }
        created += 1;
      }
    }
    return created;
  }
}
