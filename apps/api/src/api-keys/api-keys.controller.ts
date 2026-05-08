import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { ALL_PERMISSIONS } from '@jetnine/shared';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface KeyView {
  id: string;
  name: string;
  keyPrefix: string;
  livemode: 'live' | 'test';
  scopes: string[];
  notes: string | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

interface CreateBody {
  name?: string;
  scopes?: string[];
  livemode?: 'live' | 'test';
  notes?: string | null;
}

@TenantScoped()
@Controller('v1/business/api-keys')
export class ApiKeysController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('api_keys.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext): Promise<KeyView[]> {
    const rows = await this.db
      .select({
        id: schema.apiKeys.id,
        name: schema.apiKeys.name,
        keyPrefix: schema.apiKeys.keyPrefix,
        livemode: schema.apiKeys.livemode,
        scopes: schema.apiKeys.scopes,
        notes: schema.apiKeys.notes,
        lastUsedAt: schema.apiKeys.lastUsedAt,
        revokedAt: schema.apiKeys.revokedAt,
        createdAt: schema.apiKeys.createdAt,
      })
      .from(schema.apiKeys)
      .orderBy(desc(schema.apiKeys.createdAt));
    return rows.map((r) => ({
      ...r,
      livemode: r.livemode as 'live' | 'test',
      scopes: r.scopes ?? [],
    }));
  }

  @Get('scopes')
  @RequirePermission('api_keys.view')
  scopes(): { all: string[] } {
    return { all: [...ALL_PERMISSIONS] as string[] };
  }

  @Post()
  @RequirePermission('api_keys.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload | null,
    @Body() body: CreateBody,
  ): Promise<KeyView & { key: string }> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
      throw new BadRequestException('scopes must be a non-empty array');
    }
    const allowed = new Set<string>(ALL_PERMISSIONS as readonly string[]);
    for (const s of body.scopes) {
      if (!allowed.has(s)) throw new BadRequestException(`Unknown scope: ${s}`);
    }
    const livemode = body.livemode === 'live' ? 'live' : 'test';

    // Generate the full key. Format: jet_<env>_<48 hex chars>. The `jet_`
    // prefix is so logs / 2-grep are clearly Jetnine credentials; the
    // env tag lets us distinguish test from live keys at a glance.
    const random = randomBytes(24).toString('hex');
    const fullKey = `jet_${livemode}_${random}`;
    const keyPrefix = fullKey.slice(0, 16); // "jet_test_xxxxxxx"
    const keyHash = createHash('sha256').update(fullKey).digest('hex');

    const [row] = await this.db
      .insert(schema.apiKeys)
      .values({
        businessId: tenant.businessId!,
        name,
        keyPrefix,
        keyHash,
        scopes: body.scopes,
        livemode,
        notes: body.notes?.trim() || null,
        createdByUserId: actor?.id ?? null,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to create api key');

    await this.audit.log({
      action: 'api_key.create',
      targetType: 'api_key',
      targetId: row.id,
      after: { name, scopes: body.scopes, livemode },
    });
    return {
      ...rowToView(row),
      key: fullKey,
    };
  }

  @Delete(':id')
  @RequirePermission('api_keys.manage')
  async revoke(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ revoked: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('API key not found');
    if (existing.revokedAt) throw new BadRequestException('API key is already revoked');

    await this.db
      .update(schema.apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(schema.apiKeys.id, id));

    await this.audit.log({
      action: 'api_key.revoke',
      targetType: 'api_key',
      targetId: id,
      before: { name: existing.name, scopes: existing.scopes },
    });
    return { revoked: true };
  }
}

function rowToView(r: typeof schema.apiKeys.$inferSelect): KeyView {
  return {
    id: r.id,
    name: r.name,
    keyPrefix: r.keyPrefix,
    livemode: r.livemode as 'live' | 'test',
    scopes: r.scopes ?? [],
    notes: r.notes,
    lastUsedAt: r.lastUsedAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
  };
}
