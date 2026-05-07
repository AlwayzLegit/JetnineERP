import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { ALL_PERMISSIONS, type Permission, PERMISSIONS } from '@jetnine/shared';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { Public, RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
}

interface CreateRoleBody {
  name?: string;
  description?: string;
  basedOnRoleId?: string;
  permissions?: Permission[];
}

interface UpdateRoleBody {
  name?: string;
  description?: string;
  permissions?: Permission[];
}

@TenantScoped()
@Controller('v1/business/roles')
export class RolesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('roles.view')
  async list(@CurrentTenant() tenant: RequestTenantContext): Promise<RoleRow[]> {
    const roles = await this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.businessId, tenant.businessId!))
      .orderBy(asc(schema.roles.name));
    if (roles.length === 0) return [];

    // RLS scopes role_permissions to roles in this business via the
    // tenant_isolation policy (role_permissions has no business_id of its
    // own; the policy joins through roles).
    const allPerms = await this.db.select().from(schema.rolePermissions);
    const byRole = new Map<string, Permission[]>();
    for (const r of roles) byRole.set(r.id, []);
    for (const row of allPerms) {
      const list = byRole.get(row.roleId);
      if (list) list.push(row.permission as Permission);
    }
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      isSystem: r.isSystem,
      permissions: byRole.get(r.id) ?? [],
    }));
  }

  @Post()
  @RequirePermission('roles.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateRoleBody,
  ): Promise<RoleRow> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');

    let perms: Permission[] = [];
    if (body.basedOnRoleId) {
      const based = await this.db
        .select()
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.roleId, body.basedOnRoleId));
      perms = based.map((p) => p.permission as Permission);
    } else if (body.permissions) {
      perms = filterValidPermissions(body.permissions);
    }

    const [r] = await this.db
      .insert(schema.roles)
      .values({
        businessId: tenant.businessId!,
        name,
        description: body.description?.trim() ?? null,
        isSystem: false,
      })
      .returning()
      .catch((err) => {
        const m = err instanceof Error ? err.message : String(err);
        if (m.includes('roles_business_name_uniq')) {
          throw new ConflictException(`Role "${name}" already exists in this business`);
        }
        throw err;
      });
    if (!r) throw new BadRequestException('failed to create role');
    if (perms.length > 0) {
      await this.db
        .insert(schema.rolePermissions)
        .values(perms.map((permission) => ({ roleId: r.id, permission })));
    }
    await this.audit.log({
      action: 'role.create',
      targetType: 'role',
      targetId: r.id,
      after: { name: r.name, permissions: perms },
    });
    return {
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      isSystem: false,
      permissions: perms,
    };
  }

  @Patch(':id')
  @RequirePermission('roles.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateRoleBody,
  ): Promise<RoleRow> {
    const [existing] = await this.db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.id, id), eq(schema.roles.businessId, tenant.businessId!)))
      .limit(1);
    if (!existing) throw new NotFoundException('Role not found');
    if (existing.isSystem) {
      throw new ForbiddenException(
        'System roles cannot be edited. Clone via POST then edit the clone.',
      );
    }

    const update: Partial<typeof schema.roles.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.name && body.name.trim() !== existing.name) {
      update.name = body.name.trim();
      before.name = existing.name;
      after.name = update.name;
    }
    if (body.description !== undefined && body.description !== existing.description) {
      update.description = body.description;
      before.description = existing.description;
      after.description = body.description;
    }

    if (Object.keys(update).length > 0) {
      await this.db.update(schema.roles).set(update).where(eq(schema.roles.id, id));
    }

    if (body.permissions) {
      const want = new Set(filterValidPermissions(body.permissions));
      const current = await this.db
        .select({ permission: schema.rolePermissions.permission })
        .from(schema.rolePermissions)
        .where(eq(schema.rolePermissions.roleId, id));
      const have = new Set(current.map((c) => c.permission));
      const toAdd = [...want].filter((p) => !have.has(p));
      const toRemove = [...have].filter((p) => !want.has(p as Permission));

      if (toRemove.length > 0) {
        for (const p of toRemove) {
          await this.db
            .delete(schema.rolePermissions)
            .where(
              and(eq(schema.rolePermissions.roleId, id), eq(schema.rolePermissions.permission, p)),
            );
        }
      }
      if (toAdd.length > 0) {
        await this.db
          .insert(schema.rolePermissions)
          .values(toAdd.map((permission) => ({ roleId: id, permission })));
      }

      if (toAdd.length > 0 || toRemove.length > 0) {
        before.permissions = [...have].sort();
        after.permissions = [...want].sort();
      }
    }

    await this.audit.log({
      action: 'role.update',
      targetType: 'role',
      targetId: id,
      before,
      after,
    });

    const fresh = await this.list(tenant);
    return (
      fresh.find((r) => r.id === id) ?? {
        id,
        name: update.name ?? existing.name,
        description: existing.description ?? null,
        isSystem: false,
        permissions: [],
      }
    );
  }

  @Delete(':id')
  @RequirePermission('roles.delete')
  async delete(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.id, id), eq(schema.roles.businessId, tenant.businessId!)))
      .limit(1);
    if (!existing) throw new NotFoundException('Role not found');
    if (existing.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    const inUse = await this.db
      .select({ id: schema.memberships.id })
      .from(schema.memberships)
      .where(eq(schema.memberships.roleId, id))
      .limit(1);
    if (inUse.length > 0) {
      throw new ConflictException(
        'Role is in use by at least one membership. Reassign those members first.',
      );
    }
    await this.db.delete(schema.roles).where(eq(schema.roles.id, id));
    await this.audit.log({
      action: 'role.delete',
      targetType: 'role',
      targetId: id,
      before: { name: existing.name },
    });
    return { deleted: true };
  }
}

@Public()
@Controller('v1/permissions')
export class PermissionsCatalogController {
  // The permission catalog is static (it ships with the code) and not
  // sensitive on its own — no @TenantScoped() so it's reachable without a
  // session, but @Public() bypasses AuthGuard cleanly.
  @Get()
  list(): { key: Permission; description: string }[] {
    return ALL_PERMISSIONS.map((key) => ({ key, description: PERMISSIONS[key] }));
  }
}

function filterValidPermissions(input: Permission[]): Permission[] {
  const valid = new Set(ALL_PERMISSIONS);
  return input.filter((p) => valid.has(p));
}
