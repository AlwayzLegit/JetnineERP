import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';

export type AcquireOutcome =
  | { kind: 'fresh' }
  | { kind: 'replay'; status: number; body: unknown }
  | { kind: 'conflict'; reason: string };

interface IdempotencyRow {
  status: string;
  requestFingerprint: string;
  responseStatus: number | null;
  responseBody: unknown;
  lockedAt: Date;
}

/**
 * Stripe-style idempotency. Lookups + locks happen on the *root* db
 * connection (postgres role), bypassing RLS — the row carries
 * `business_id` and we filter on it manually. Storing this state outside
 * the request's RLS transaction means the lock survives a handler
 * rollback (so the second retry sees the original 5xx instead of
 * silently re-running the side effect).
 *
 * A pending row older than `STALE_LOCK_MS` is considered abandoned (the
 * original request crashed before completing) and is allowed to be
 * overwritten by a new attempt.
 */
@Injectable()
export class IdempotencyService {
  private readonly log = new Logger(IdempotencyService.name);
  private readonly STALE_LOCK_MS = 60_000;

  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  fingerprint(method: string, path: string, body: unknown): string {
    const canonical = `${method.toUpperCase()} ${path}\n${stableStringify(body ?? null)}`;
    return createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Look the key up; if a completed row exists with a matching
   * fingerprint, return its cached response. If a completed row exists
   * with a *different* fingerprint, the client is reusing the key for a
   * different operation — that's a 409. Otherwise reserve a pending
   * row and return `{ kind: 'fresh' }`.
   */
  async acquire(args: {
    businessId: string;
    key: string;
    fingerprint: string;
  }): Promise<AcquireOutcome> {
    const { businessId, key, fingerprint } = args;

    const existing = await this.lookup(businessId, key);
    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        return {
          kind: 'conflict',
          reason: 'Idempotency-Key was used previously with a different request body.',
        };
      }
      if (existing.status === 'completed') {
        return {
          kind: 'replay',
          status: existing.responseStatus ?? 200,
          body: existing.responseBody,
        };
      }
      // status === 'pending'
      const ageMs = Date.now() - existing.lockedAt.getTime();
      if (ageMs < this.STALE_LOCK_MS) {
        return {
          kind: 'conflict',
          reason: 'A request with this Idempotency-Key is already in flight.',
        };
      }
      // Stale lock — fall through and try to take it over. The DELETE+
      // INSERT path is racy under concurrent retries, but the unique
      // constraint catches the loser and translates it to a 409.
      await this.db
        .delete(schema.idempotencyKeys)
        .where(
          and(
            eq(schema.idempotencyKeys.businessId, businessId),
            eq(schema.idempotencyKeys.key, key),
          ),
        );
    }

    try {
      await this.db.insert(schema.idempotencyKeys).values({
        businessId,
        key,
        requestFingerprint: fingerprint,
        status: 'pending',
        lockedAt: new Date(),
      });
    } catch (err) {
      // Either a race against another concurrent first-attempt, or the
      // stale-lock takeover lost. Either way the caller should retry.
      this.log.debug({ err: String(err) }, 'idempotency insert raced');
      return {
        kind: 'conflict',
        reason: 'A concurrent request claimed this Idempotency-Key first; retry.',
      };
    }
    return { kind: 'fresh' };
  }

  /** Persist the handler's response so future retries replay it. */
  async complete(args: {
    businessId: string;
    key: string;
    status: number;
    body: unknown;
  }): Promise<void> {
    const { businessId, key, status, body } = args;
    await this.db
      .update(schema.idempotencyKeys)
      .set({
        status: 'completed',
        responseStatus: status,
        responseBody: body as never,
        completedAt: new Date(),
      })
      .where(
        and(eq(schema.idempotencyKeys.businessId, businessId), eq(schema.idempotencyKeys.key, key)),
      );
  }

  /**
   * Drop the lock so the client can retry from scratch. Called when the
   * handler throws — we deliberately do NOT cache failures, because
   * application errors might be transient (DB blip, downstream timeout)
   * and the caller deserves a fresh attempt.
   */
  async release(args: { businessId: string; key: string }): Promise<void> {
    await this.db
      .delete(schema.idempotencyKeys)
      .where(
        and(
          eq(schema.idempotencyKeys.businessId, args.businessId),
          eq(schema.idempotencyKeys.key, args.key),
        ),
      );
  }

  /** Sweep rows older than 24h. Intended for an offline cron. */
  async sweepOlderThan24h(): Promise<number> {
    const result = await this.db
      .delete(schema.idempotencyKeys)
      .where(sql`${schema.idempotencyKeys.createdAt} < now() - interval '24 hours'`);
    return result.count ?? 0;
  }

  private async lookup(businessId: string, key: string): Promise<IdempotencyRow | null> {
    const rows = await this.db
      .select({
        status: schema.idempotencyKeys.status,
        requestFingerprint: schema.idempotencyKeys.requestFingerprint,
        responseStatus: schema.idempotencyKeys.responseStatus,
        responseBody: schema.idempotencyKeys.responseBody,
        lockedAt: schema.idempotencyKeys.lockedAt,
      })
      .from(schema.idempotencyKeys)
      .where(
        and(eq(schema.idempotencyKeys.businessId, businessId), eq(schema.idempotencyKeys.key, key)),
      )
      .limit(1);
    return rows[0] ?? null;
  }
}

/**
 * Order-stable JSON stringify so two equivalent bodies (same keys, same
 * values, different declaration order) hash to the same fingerprint.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
