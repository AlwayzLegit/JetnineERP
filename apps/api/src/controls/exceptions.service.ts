import { Inject, Injectable } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { tryGetRequestContext } from '../tenancy/request-context';

export interface RecordExceptionInput {
  type: string;
  severity?: 'info' | 'warning' | 'critical';
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  /** Defaults to the request actor. */
  actorUserId?: string | null;
  businessId?: string;
}

/**
 * Writes to the exception register (PLAN-STORIS-GAP §0.3). Callers are
 * the control points themselves — overrides, unlocks, cap overrides,
 * write-offs — so the register holds only events worth a manager's
 * attention, not a feed of every edit.
 */
@Injectable()
export class ExceptionsService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  async record(input: RecordExceptionInput): Promise<void> {
    const ctx = tryGetRequestContext();
    const businessId = input.businessId ?? ctx?.businessId;
    if (!businessId) return; // no tenant to attribute — nothing to register
    await this.db.insert(schema.exceptionEvents).values({
      businessId,
      type: input.type,
      severity: input.severity ?? 'warning',
      actorUserId: input.actorUserId !== undefined ? input.actorUserId : (ctx?.userId ?? null),
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadataJson: input.metadata ?? null,
    });
  }
}
