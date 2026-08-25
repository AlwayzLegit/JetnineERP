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
  Post,
  Query,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE, ROOT_DRIZZLE } from '../database/database.module';
import { ImportService } from '../import/import.service';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import { tryGetRequestContext, type RequestTenantContext } from '../tenancy/request-context';
import { CONNECTORS, INTEGRATION_FETCH, type Connector, type FetchImpl } from './connectors';

/** A 'running' sync older than this is presumed dead (restart mid-job). */
const SYNC_STALE_MS = 30 * 60 * 1000;

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
    @Inject(ROOT_DRIZZLE) private readonly rootDb: PostgresJsDatabase,
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
        syncStatus: row?.syncStatus ?? 'idle',
        syncProgress: row?.syncProgressJson ?? null,
        syncStartedAt: row?.syncStartedAt ?? null,
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
   * pipeline. A real store pull takes minutes — far past the proxies'
   * response timeouts — so by default this kicks off a DETACHED job
   * (state on the integrations row: sync_status/sync_progress_json,
   * polled via GET /v1/integrations) and returns immediately.
   * `?wait=1` keeps the old synchronous contract for tests and scripts.
   */
  @Post(':provider/sync')
  @RequirePermission('integrations.manage')
  async sync(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('provider') provider: string,
    @Query('wait') wait?: string,
  ) {
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
    const staleAt = Date.now() - SYNC_STALE_MS;
    if (row.syncStatus === 'running' && (row.syncStartedAt?.getTime() ?? 0) > staleAt) {
      throw new ConflictException('A sync is already running for this provider');
    }

    // Flip to running on the ROOT connection so the state commits now —
    // the tenant transaction only commits when this handler returns.
    await this.rootDb
      .update(schema.integrations)
      .set({
        syncStatus: 'running',
        syncStartedAt: new Date(),
        syncProgressJson: { note: 'starting…' },
        updatedAt: new Date(),
      })
      .where(eq(schema.integrations.id, row.id));

    const businessId = tenant.businessId!;
    const userId = tenant.userId ?? undefined;

    if (wait) {
      return this.runSyncJob(row.id, businessId, userId, provider, connector, false);
    }
    // Detached: the DRIZZLE proxy falls through to the root connection
    // once this request's context closes, so ImportService keeps working
    // (every query it makes carries an explicit business_id).
    void this.runSyncJob(row.id, businessId, userId, provider, connector, true).catch(() => {
      /* terminal state is persisted inside the job */
    });
    return { started: true, syncStatus: 'running' as const };
  }

  /** The sync job body; state transitions always go through rootDb. */
  private async runSyncJob(
    rowId: string,
    businessId: string,
    userId: string | undefined,
    provider: string,
    connector: Connector,
    detached: boolean,
  ) {
    if (detached) {
      // Wait for the originating request's RLS transaction to close so
      // the DRIZZLE proxy routes onto the root connection, not a
      // committed (dead) transaction.
      for (let i = 0; i < 400; i++) {
        const ctx = tryGetRequestContext();
        if (!ctx || ctx.closed) break;
        await new Promise((r) => setTimeout(r, 25));
      }
    }

    const setProgress = (() => {
      let last = 0;
      return (note: string, force = false) => {
        const now = Date.now();
        if (!force && now - last < 750) return;
        last = now;
        void this.rootDb
          .update(schema.integrations)
          .set({ syncProgressJson: { note, at: new Date().toISOString() } })
          .where(eq(schema.integrations.id, rowId))
          .catch(() => {});
      };
    })();

    try {
      const [row] = await this.rootDb
        .select()
        .from(schema.integrations)
        .where(eq(schema.integrations.id, rowId))
        .limit(1);
      if (!row) throw new Error('integration row vanished');

      const pulls = await connector.pull({
        credentials: row.credentialsJson as Record<string, string>,
        config: (row.configJson ?? {}) as { locationName?: string },
        fetchImpl: this.fetchImpl,
        onProgress: (note) => setProgress(note),
      });

      const results: { entity: string; pulled: number; committed: number; skipped: number }[] = [];
      for (const pull of pulls) {
        if (pull.rows.length === 0) {
          results.push({ entity: pull.entity, pulled: 0, committed: 0, skipped: 0 });
          continue;
        }
        setProgress(`importing ${pull.rows.length} ${pull.entity} rows…`, true);
        const batch = await this.importService.stageStructured(businessId, userId, {
          entity: pull.entity,
          source: provider,
          filename: `${provider} sync`,
          rows: pull.rows,
        });
        await this.importService.validate(businessId, batch.id);
        const commit = await this.importService.commit(businessId, batch.id);
        results.push({
          entity: pull.entity,
          pulled: pull.rows.length,
          committed: commit.committed,
          skipped: pull.rows.length - commit.committed,
        });
      }

      const summary = { syncedAt: new Date().toISOString(), results };
      await this.rootDb
        .update(schema.integrations)
        .set({
          status: 'connected',
          syncStatus: 'idle',
          syncProgressJson: null,
          lastSyncAt: new Date(),
          lastResultJson: summary,
          updatedAt: new Date(),
        })
        .where(eq(schema.integrations.id, rowId));
      await this.audit.log({
        action: 'integration.sync',
        targetType: 'integration',
        metadata: { provider, results },
        // Detached runs have a closed request context; the audit row
        // then takes its tenant/actor from the input.
        businessId,
        actorUserId: userId ?? null,
      });
      return summary;
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      await this.rootDb
        .update(schema.integrations)
        .set({
          status: 'error',
          syncStatus: 'error',
          syncProgressJson: null,
          lastResultJson: { error: detail },
          updatedAt: new Date(),
        })
        .where(eq(schema.integrations.id, rowId));
      if (!detached) throw new BadRequestException(`Sync failed: ${detail}`);
      return undefined;
    }
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
