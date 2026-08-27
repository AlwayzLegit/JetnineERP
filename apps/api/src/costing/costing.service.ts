import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { ExceptionsService } from '../controls/exceptions.service';

export interface ConsumeResult {
  /** Actual FIFO cost of the units consumed, in integer cents. */
  costCents: number;
  quantity: number;
}

/**
 * FIFO costing core (owner decision 2026-08-27, PARITY-NOTES C2).
 *
 * Inflows call `addLayer`; outflows call `consume`, which walks layers
 * oldest-first and records one consumption row per (outflow, layer)
 * pair. Stock that predates layering — the STORIS import, or anything
 * received before this shipped — is covered lazily: when consumption
 * outruns the layers, the shortfall gets a synthesized, fully-consumed
 * `opening` layer at the variant's catalog cost. Correct going forward,
 * no backfill migration, and the ledger still shows exactly what
 * happened.
 *
 * C9 (sysadmin pack): a zero-cost layer is never created silently —
 * every one records a `zero_cost_layer` exception, because a $0 layer
 * corrupts margin for its whole life.
 */
@Injectable()
export class CostingService {
  constructor(@Inject(ExceptionsService) private readonly exceptions: ExceptionsService) {}

  async addLayer(
    db: PostgresJsDatabase,
    args: {
      businessId: string;
      variantId: string;
      locationId: string;
      sourceType: string;
      referenceId?: string | null;
      quantity: number;
      unitCostCents: number | null;
    },
  ): Promise<void> {
    if (args.quantity <= 0) return;
    const unitCostCents = args.unitCostCents ?? 0;
    await db.insert(schema.costLayers).values({
      businessId: args.businessId,
      variantId: args.variantId,
      locationId: args.locationId,
      sourceType: args.sourceType,
      referenceId: args.referenceId ?? null,
      unitCostCents,
      quantityReceived: args.quantity,
      quantityRemaining: args.quantity,
    });
    if (unitCostCents <= 0) {
      await this.exceptions.record({
        type: 'zero_cost_layer',
        severity: 'warning',
        entityType: 'product_variant',
        entityId: args.variantId,
        summary: `${args.quantity} unit(s) layered at $0.00 cost (${args.sourceType}) — margin on these units will read as 100% until corrected`,
        metadata: { sourceType: args.sourceType, referenceId: args.referenceId ?? null },
      });
    }
  }

  /**
   * Consume `quantity` units FIFO. `preferReferenceId` consumes layers
   * created by that document first (a PO un-receive backs out its own
   * receipt, not older stock).
   */
  async consume(
    db: PostgresJsDatabase,
    args: {
      businessId: string;
      variantId: string;
      locationId: string;
      quantity: number;
      referenceType: string;
      referenceId?: string | null;
      preferReferenceId?: string | null;
    },
  ): Promise<ConsumeResult> {
    let remaining = args.quantity;
    let costCents = 0;
    if (remaining <= 0) return { costCents: 0, quantity: 0 };

    const passes: (typeof schema.costLayers.$inferSelect)[][] = [];
    if (args.preferReferenceId) {
      passes.push(
        await db
          .select()
          .from(schema.costLayers)
          .where(
            and(
              eq(schema.costLayers.variantId, args.variantId),
              eq(schema.costLayers.locationId, args.locationId),
              eq(schema.costLayers.referenceId, args.preferReferenceId),
              gt(schema.costLayers.quantityRemaining, 0),
            ),
          )
          .orderBy(asc(schema.costLayers.receivedAt), asc(schema.costLayers.id)),
      );
    }
    passes.push(
      await db
        .select()
        .from(schema.costLayers)
        .where(
          and(
            eq(schema.costLayers.variantId, args.variantId),
            eq(schema.costLayers.locationId, args.locationId),
            gt(schema.costLayers.quantityRemaining, 0),
          ),
        )
        .orderBy(asc(schema.costLayers.receivedAt), asc(schema.costLayers.id)),
    );

    const touched = new Set<string>();
    for (const pass of passes) {
      for (const layer of pass) {
        if (remaining <= 0) break;
        if (touched.has(layer.id)) continue;
        touched.add(layer.id);
        const take = Math.min(layer.quantityRemaining, remaining);
        await db
          .update(schema.costLayers)
          .set({ quantityRemaining: sql`${schema.costLayers.quantityRemaining} - ${take}` })
          .where(eq(schema.costLayers.id, layer.id));
        await db.insert(schema.costConsumptions).values({
          businessId: args.businessId,
          layerId: layer.id,
          quantity: take,
          unitCostCents: layer.unitCostCents,
          referenceType: args.referenceType,
          referenceId: args.referenceId ?? null,
        });
        costCents += take * layer.unitCostCents;
        remaining -= take;
      }
    }

    if (remaining > 0) {
      // Pre-layering stock: synthesize a fully-consumed opening layer at
      // the variant's catalog cost so history stays priced.
      const [variant] = await db
        .select({ costCents: schema.productVariants.costCents })
        .from(schema.productVariants)
        .where(eq(schema.productVariants.id, args.variantId))
        .limit(1);
      const unitCostCents = variant?.costCents ?? 0;
      const [opening] = await db
        .insert(schema.costLayers)
        .values({
          businessId: args.businessId,
          variantId: args.variantId,
          locationId: args.locationId,
          sourceType: 'opening',
          referenceId: null,
          unitCostCents,
          quantityReceived: remaining,
          quantityRemaining: 0,
        })
        .returning({ id: schema.costLayers.id });
      if (opening) {
        await db.insert(schema.costConsumptions).values({
          businessId: args.businessId,
          layerId: opening.id,
          quantity: remaining,
          unitCostCents,
          referenceType: args.referenceType,
          referenceId: args.referenceId ?? null,
        });
      }
      costCents += remaining * unitCostCents;
      if (unitCostCents <= 0) {
        await this.exceptions.record({
          type: 'zero_cost_layer',
          severity: 'warning',
          entityType: 'product_variant',
          entityId: args.variantId,
          summary: `${remaining} pre-costing unit(s) consumed at $0.00 — set the variant's cost so opening layers price correctly`,
          metadata: { referenceType: args.referenceType },
        });
      }
      remaining = 0;
    }

    return { costCents, quantity: args.quantity };
  }

  /**
   * FIFO on-hand valuation, keyed `${variantId}:${locationId}`. Stock
   * with no layers (pre-costing) is absent — callers value that
   * remainder at the catalog cost fallback.
   */
  async valuation(
    db: PostgresJsDatabase,
    args: { businessId: string; locationId?: string },
  ): Promise<Map<string, { quantity: number; costCents: number }>> {
    const rows = await db
      .select({
        variantId: schema.costLayers.variantId,
        locationId: schema.costLayers.locationId,
        quantity: sql<number>`sum(${schema.costLayers.quantityRemaining})::int`,
        costCents: sql<number>`sum(${schema.costLayers.quantityRemaining} * ${schema.costLayers.unitCostCents})::bigint`,
      })
      .from(schema.costLayers)
      .where(
        and(
          gt(schema.costLayers.quantityRemaining, 0),
          args.locationId ? eq(schema.costLayers.locationId, args.locationId) : undefined,
        ),
      )
      .groupBy(schema.costLayers.variantId, schema.costLayers.locationId);
    return new Map(
      rows.map((r) => [
        `${r.variantId}:${r.locationId}`,
        { quantity: r.quantity, costCents: Number(r.costCents) },
      ]),
    );
  }
}
