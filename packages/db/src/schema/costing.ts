import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { businesses } from './platform';
import { locations } from './tenancy';
import { productVariants } from './catalog';

/**
 * FIFO costing (owner decision 2026-08-27; PARITY-NOTES C2, FAQ COST-010).
 *
 * Every stock inflow creates a **cost layer** — the units and the unit
 * cost they arrived at. Every outflow consumes layers oldest-first and
 * records **consumptions**, so COGS is the actual cost of the actual
 * units, not the current catalog cost. `product_variants.cost_cents`
 * remains the replacement-cost fallback: stock that predates layering
 * (the STORIS import) gets a synthesized fully-consumed `opening` layer
 * at that cost the first time it is consumed — correct going forward,
 * no backfill required.
 *
 * C9 (sysadmin pack): a zero-cost layer is never created silently — it
 * records a `zero_cost_layer` exception for the owner console.
 */
export const costLayers = pgTable(
  'cost_layers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    /** 'po_receive' | 'receive' | 'adjustment' | 'physical_count' |
     *  'transfer_in' | 'as_is_restock' | 'opening' */
    sourceType: text('source_type').notNull(),
    referenceId: uuid('reference_id'),
    unitCostCents: integer('unit_cost_cents').notNull(),
    quantityReceived: integer('quantity_received').notNull(),
    quantityRemaining: integer('quantity_remaining').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('cost_layers_business_id_idx').on(t.businessId),
    fifoIdx: index('cost_layers_fifo_idx').on(t.variantId, t.locationId, t.receivedAt),
    quantityPositive: check('cost_layers_quantity_positive', sql`${t.quantityReceived} > 0`),
    remainingBounds: check(
      'cost_layers_remaining_bounds',
      sql`${t.quantityRemaining} >= 0 AND ${t.quantityRemaining} <= ${t.quantityReceived}`,
    ),
  }),
);

/** One row per (outflow, layer) pair — the COGS audit trail. */
export const costConsumptions = pgTable(
  'cost_consumptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    layerId: uuid('layer_id')
      .notNull()
      .references(() => costLayers.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    /** Copied from the layer at consumption time — survives layer edits. */
    unitCostCents: integer('unit_cost_cents').notNull(),
    /** 'order_fulfill' | 'sale' | 'po_unreceive' | 'transfer_out' |
     *  'physical_count' | 'inventory_adjust' */
    referenceType: text('reference_type').notNull(),
    referenceId: uuid('reference_id'),
    consumedAt: timestamp('consumed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('cost_consumptions_business_id_idx').on(t.businessId),
    layerIdx: index('cost_consumptions_layer_id_idx').on(t.layerId),
    referenceIdx: index('cost_consumptions_reference_idx').on(
      t.businessId,
      t.referenceType,
      t.referenceId,
    ),
    quantityPositive: check('cost_consumptions_quantity_positive', sql`${t.quantity} > 0`),
  }),
);
