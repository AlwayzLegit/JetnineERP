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
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { ImportService } from '../import/import.service';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { CONNECTORS, INTEGRATION_FETCH, type FetchImpl } from './connectors';

/**
 * One-click platform integrations (Shopify, WooCommerce, Wix): connect
 * with the provider's credentials once, then "Sync now" pulls
 * customers, products, and completed orders and lands them through the
 * import pipeline — idempotent via `legacy_refs` (D7), so re-syncing
 * updates records instead of duplicating, and imported history stays
 * out of drawers/commissions (D8). STORIS itself remains the CSV
 * wizard at /settings/import (no public API to pull from).
 */
@TenantScoped()
@Controller('v1/integrations')
export class IntegrationsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ImportService) private readonly importService: ImportService,
    @Inject(INTEGRATION_FETCH) private readonly fetchImpl: FetchImpl,
  ) {}

  /** Provider catalog + this business's connection state, for the UI. */
  @Get()
  @RequirePermission('integrations.manage')
  async list(@CurrentTenant() _tenant: RequestTenantContext) {
    const connected = await this.db.select().from(schema.integrations);
    const byProvider = new Map(connected.map((c) => [c.provider, c]));
    return Object.values(CONNECTORS).map((c) => {
      const row = byProvider.get(c.provider);
      return {
        provider: c.provider,
        label: c.label,
        credentialFields: c.credentialFields,
        connected: row?.status === 'connected',
        status: row?.status ?? null,
        lastSyncAt: row?.lastSyncAt ?? null,
        lastResult: row?.lastResultJson ?? null,
        config: row?.configJson ?? null,
      };
    });
  }

  @Post(':provider/connect')
  @RequirePermission('integrations.manage')
  async connect(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('provider') provider: string,
    @Body() body: { credentials?: Record<string, string>; locationName?: string },
  ) {
    const connector = CONNECTORS[provider];
    if (!connector) throw new NotFoundException(`Unknown provider "${provider}"`);
    const credentials = body.credentials ?? {};
    for (const field of connector.credentialFields) {
      if (!credentials[field.name]?.trim()) {
        throw new BadRequestException(`${field.label} is required`);
      }
    }
    const config = { locationName: body.locationName?.trim() || undefined };

    // Prove the credentials before storing them.
    let detail: string;
    try {
      const result = await connector.test({ credentials, config, fetchImpl: this.fetchImpl });
      detail = result.detail;
    } catch (e) {
      throw new BadRequestException(
        `Could not connect: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    await this.db
      .insert(schema.integrations)
      .values({
        businessId: tenant.businessId!,
        provider,
        status: 'connected',
        credentialsJson: credentials,
        configJson: config,
        lastResultJson: { detail },
      })
      .onConflictDoUpdate({
        target: [schema.integrations.businessId, schema.integrations.provider],
        set: {
          status: 'connected',
          credentialsJson: credentials,
          configJson: config,
          lastResultJson: { detail },
          updatedAt: new Date(),
        },
      });
    await this.audit.log({
      action: 'integration.connect',
      targetType: 'integration',
      metadata: { provider, detail },
    });
    return { ok: true, detail };
  }

  /**
   * Pull everything from the provider and land it through the import
   * pipeline. Returns per-entity batch outcomes so the UI can show
   * "synced 214 customers, 87 products, 1,032 orders (3 skipped)".
   */
  @Post(':provider/sync')
  @RequirePermission('integrations.manage')
  async sync(@CurrentTenant() tenant: RequestTenantContext, @Param('provider') provider: string) {
    const connector = CONNECTORS[provider];
    if (!connector) throw new NotFoundException(`Unknown provider "${provider}"`);
    const [row] = await this.db
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.provider, provider))
      .limit(1);
    if (!row || row.status === 'disconnected') {
      throw new BadRequestException(`${connector.label} is not connected`);
    }

    const ctx = {
      credentials: row.credentialsJson as Record<string, string>,
      config: (row.configJson ?? {}) as { locationName?: string },
      fetchImpl: this.fetchImpl,
    };
    let pulls;
    try {
      pulls = await connector.pull(ctx);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      await this.db
        .update(schema.integrations)
        .set({ status: 'error', lastResultJson: { error: detail }, updatedAt: new Date() })
        .where(eq(schema.integrations.id, row.id));
      throw new BadRequestException(`Sync failed: ${detail}`);
    }

    const results: {
      entity: string;
      pulled: number;
      committed: number;
      skipped: number;
    }[] = [];
    for (const pull of pulls) {
      if (pull.rows.length === 0) {
        results.push({ entity: pull.entity, pulled: 0, committed: 0, skipped: 0 });
        continue;
      }
      const batch = await this.importService.stageStructured(
        tenant.businessId!,
        tenant.userId ?? undefined,
        {
          entity: pull.entity,
          source: provider,
          filename: `${provider} sync`,
          rows: pull.rows,
        },
      );
      await this.importService.validate(tenant.businessId!, batch.id);
      const commit = await this.importService.commit(tenant.businessId!, batch.id);
      results.push({
        entity: pull.entity,
        pulled: pull.rows.length,
        committed: commit.committed,
        skipped: pull.rows.length - commit.committed,
      });
    }

    const summary = { syncedAt: new Date().toISOString(), results };
    await this.db
      .update(schema.integrations)
      .set({
        status: 'connected',
        lastSyncAt: new Date(),
        lastResultJson: summary,
        updatedAt: new Date(),
      })
      .where(eq(schema.integrations.id, row.id));
    await this.audit.log({
      action: 'integration.sync',
      targetType: 'integration',
      metadata: { provider, results },
    });
    return summary;
  }

  @Delete(':provider')
  @RequirePermission('integrations.manage')
  async disconnect(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('provider') provider: string,
  ) {
    const [row] = await this.db
      .update(schema.integrations)
      .set({
        status: 'disconnected',
        credentialsJson: {},
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.integrations.businessId, tenant.businessId!),
          eq(schema.integrations.provider, provider),
        ),
      )
      .returning({ id: schema.integrations.id });
    if (!row) throw new NotFoundException('Not connected');
    await this.audit.log({
      action: 'integration.disconnect',
      targetType: 'integration',
      metadata: { provider },
    });
    return { ok: true };
  }
}
