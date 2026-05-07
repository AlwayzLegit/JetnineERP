import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

const MAX_DEPTH = 3;

interface CategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  position: number;
  depth: number;
  children: CategoryNode[];
}

interface CategoryFlat {
  id: string;
  parentId: string | null;
  name: string;
  position: number;
}

@TenantScoped()
@Controller('v1/categories')
export class CategoriesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('products.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
  ): Promise<{ flat: CategoryFlat[]; tree: CategoryNode[] }> {
    const rows = await this.db
      .select({
        id: schema.categories.id,
        parentId: schema.categories.parentId,
        name: schema.categories.name,
        position: schema.categories.position,
      })
      .from(schema.categories)
      .orderBy(asc(schema.categories.position), asc(schema.categories.name));
    return { flat: rows, tree: buildTree(rows) };
  }

  @Post()
  @RequirePermission('categories.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { name?: string; parentId?: string | null; position?: number },
  ): Promise<CategoryFlat> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');

    if (body.parentId) {
      const depth = await this.depthOf(body.parentId);
      if (depth + 1 >= MAX_DEPTH) {
        throw new BadRequestException(`Categories nest at most ${MAX_DEPTH} levels deep`);
      }
    }

    const [row] = await this.db
      .insert(schema.categories)
      .values({
        businessId: tenant.businessId!,
        name,
        parentId: body.parentId ?? null,
        position: body.position ?? 0,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to create category');

    await this.audit.log({
      action: 'category.create',
      targetType: 'category',
      targetId: row.id,
      after: { name: row.name, parentId: row.parentId },
    });
    return {
      id: row.id,
      parentId: row.parentId ?? null,
      name: row.name,
      position: row.position,
    };
  }

  @Patch(':id')
  @RequirePermission('categories.manage')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: { name?: string; parentId?: string | null; position?: number },
  ): Promise<CategoryFlat> {
    const [existing] = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Category not found');

    const update: Partial<typeof schema.categories.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.name !== undefined && body.name.trim() !== existing.name) {
      update.name = body.name.trim();
      before.name = existing.name;
      after.name = update.name;
    }
    if (body.parentId !== undefined && body.parentId !== existing.parentId) {
      if (body.parentId === id) throw new BadRequestException('Cannot parent a category to itself');
      if (body.parentId) {
        const depth = await this.depthOf(body.parentId);
        if (depth + 1 >= MAX_DEPTH) {
          throw new BadRequestException(`Categories nest at most ${MAX_DEPTH} levels deep`);
        }
      }
      update.parentId = body.parentId;
      before.parentId = existing.parentId;
      after.parentId = body.parentId;
    }
    if (body.position !== undefined && body.position !== existing.position) {
      update.position = body.position;
      before.position = existing.position;
      after.position = body.position;
    }

    if (Object.keys(after).length === 0) {
      return {
        id: existing.id,
        parentId: existing.parentId ?? null,
        name: existing.name,
        position: existing.position,
      };
    }

    const [updated] = await this.db
      .update(schema.categories)
      .set(update)
      .where(eq(schema.categories.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Category not found after update');

    await this.audit.log({
      action: 'category.update',
      targetType: 'category',
      targetId: updated.id,
      before,
      after,
    });
    return {
      id: updated.id,
      parentId: updated.parentId ?? null,
      name: updated.name,
      position: updated.position,
    };
    void tenant;
  }

  @Delete(':id')
  @RequirePermission('categories.manage')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Category not found');
    const children = await this.db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.parentId, id))
      .limit(1);
    if (children.length > 0) {
      throw new ConflictException('Reassign or delete child categories first');
    }
    await this.db.delete(schema.categories).where(eq(schema.categories.id, id));
    await this.audit.log({
      action: 'category.delete',
      targetType: 'category',
      targetId: id,
      before: { name: existing.name },
    });
    return { deleted: true };
  }

  private async depthOf(id: string): Promise<number> {
    let depth = 0;
    let cursor: string | null = id;
    while (cursor) {
      const rows = await this.db
        .select({ parentId: schema.categories.parentId })
        .from(schema.categories)
        .where(eq(schema.categories.id, cursor))
        .limit(1);
      const next: string | null = rows[0]?.parentId ?? null;
      if (next === null) return depth;
      depth += 1;
      if (depth > MAX_DEPTH + 2) {
        throw new BadRequestException('Category cycle detected');
      }
      cursor = next;
    }
    return depth;
  }
}

function buildTree(rows: CategoryFlat[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];
  for (const r of rows) {
    byId.set(r.id, { ...r, depth: 0, children: [] });
  }
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parentId && byId.has(r.parentId)) {
      const parent = byId.get(r.parentId)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
