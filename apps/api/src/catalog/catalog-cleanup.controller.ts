import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { toCsv } from '../reports/csv';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import {
  hasLowercase,
  parseListing,
  PROPOSAL_MIN_SCORE,
  rankCandidates,
  type Candidate,
  type ParsedListing,
} from './listing-match';

/**
 * Shopify listings cleanup (owner ask 2026-09-06, PLAN-POS-OPERATIONS
 * §12.14, A18): the catalog holds the STORIS import (upper-case names, group
 * codes, vendor codes) next to what the Shopify sync brought in
 * (mixed-case names, `HELIX-SLEEP-…-<hash>` SKUs). Registers picked the
 * Shopify listing on some sales. This controller
 *
 *   1. lists the Shopify-shaped products (owner's rule: a lowercase
 *      letter in the name, or a connector-only import history) with
 *      everything that still references them,
 *   2. lists every sale and order line on those listings with the STORIS
 *      listing it should have been (scored crosswalk, top 3 alternates),
 *   3. serves both as review sheets (CSV) the owner confirms and uploads
 *      back, and
 *   4. applies the confirmed changes: re-point the lines (with the stock
 *      the sale moved, when asked), then deactivate or delete the
 *      listings. Every change is audit-logged with its before/after.
 *
 * Nothing here runs on its own; a dry run returns exactly what a real
 * run would do without writing.
 */

const CONNECTOR_SOURCES = new Set(['shopify', 'woocommerce', 'wix']);
const STOCK_SALE_STATUSES = new Set(['completed', 'partially_refunded', 'refunded']);
const JSON_LINE_CAP = 2000;

interface Proposal {
  productId: string;
  variantId: string;
  sku: string | null;
  name: string;
  score: number;
  matched: string[];
}

interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
  isActive: boolean;
  createdAt: Date;
  brand: string | null;
  variantId: string | null;
  variantSku: string | null;
  variantName: string | null;
  attributes: Record<string, unknown> | null;
  priceCents: number;
  /** Distinct import batch sources that ever wrote this product. */
  sources: string[];
}

export interface CleanupProduct {
  id: string;
  sku: string | null;
  name: string;
  isActive: boolean;
  brand: string | null;
  /** 'shopify' / 'woocommerce' / 'wix' / 'storis' / 'csv' … or null when built in the app. */
  source: string | null;
  /** Why it is on the list. */
  reasons: ('lowercase_name' | 'connector_import')[];
  onHand: number;
  reserved: number;
  saleLines: number;
  orderLines: number;
  /** PO lines, transfers, as-is, write-offs, refunds, returns, serials, service lines. */
  otherRefs: number;
  proposed: Proposal | null;
  alternates: Proposal[];
  /** What the sheet pre-fills: relink the lines and deactivate, plain deactivate, or delete outright. */
  action: 'relink' | 'deactivate' | 'delete';
}

export interface CleanupLine {
  doc: 'sale' | 'order';
  lineId: string;
  docId: string;
  number: string;
  status: string;
  date: Date;
  imported: boolean;
  customer: string | null;
  locationId: string;
  quantity: number;
  unitPriceCents: number;
  description: string;
  productId: string;
  variantId: string;
  sku: string | null;
  name: string;
  proposed: Proposal | null;
  alternates: Proposal[];
  /** The sale moved stock after the last inventory import — moving it to the right SKU is suggested. */
  stockAdjustSuggested: boolean;
  qtyReserved: number;
  qtyFulfilled: number;
  serialTracked: boolean;
}

/** A STORIS listing whose price the Shopify sync wrote (shared SKU). Owner 2026-09-06: reset to $0. */
export interface ShopifyPriced {
  productId: string;
  variantId: string;
  sku: string | null;
  name: string;
  priceCents: number;
}

export interface CleanupReport {
  rule: { lowercaseName: true; connectorSources: string[]; proposalMinScore: number };
  lastInventoryImportAt: Date | null;
  products: CleanupProduct[];
  lines: CleanupLine[];
  shopifyPriced: ShopifyPriced[];
  counts: {
    products: number;
    withProposal: number;
    saleLines: number;
    orderLines: number;
    linesWithProposal: number;
    linesTruncated: boolean;
    shopifyPriced: number;
    stockOnListings: number;
  };
}

interface LineChange {
  doc: 'sale' | 'order';
  lineId: string;
  toVariantId?: string | null;
  toSku?: string | null;
  adjustStock?: boolean;
}
interface ProductChange {
  productId: string;
  action: 'deactivate' | 'delete';
}
interface ApplyBody {
  dryRun?: boolean;
  lines?: LineChange[];
  products?: ProductChange[];
  /** Reset every price the Shopify sync wrote on a STORIS listing to $0 (report.shopifyPriced). */
  resetPrices?: boolean;
}

interface ApplyResult {
  dryRun: boolean;
  lines: {
    doc: 'sale' | 'order';
    lineId: string;
    ok: boolean;
    message: string;
    from?: { variantId: string | null; sku: string | null; description: string };
    to?: { variantId: string; sku: string | null; description: string };
    stockMoved?: number;
    reservationMoved?: number;
  }[];
  products: { productId: string; action: string; ok: boolean; message: string }[];
  prices: {
    variantId: string;
    sku: string | null;
    name: string;
    fromCents: number;
    ok: boolean;
    message: string;
  }[];
  summary: {
    linesRelinked: number;
    linesFailed: number;
    productsRetired: number;
    productsFailed: number;
    pricesReset: number;
    stockCleared: number;
  };
}

function displayName(productName: string, variantName: string | null): string {
  return variantName && variantName.trim() && variantName.trim() !== productName.trim()
    ? `${productName} — ${variantName.trim()}`
    : productName;
}

function yesNo(v: boolean): string {
  return v ? 'Y' : 'N';
}

@TenantScoped()
@Controller('v1/products/cleanup')
export class CatalogCleanupController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  // ---------------------------------------------------------------- report

  @Get('shopify')
  @RequirePermission('products.view')
  async report(@CurrentTenant() tenant: RequestTenantContext): Promise<CleanupReport> {
    const full = await this.build(tenant.businessId!);
    const lines = full.lines.slice(0, JSON_LINE_CAP);
    return {
      ...full,
      lines,
      counts: { ...full.counts, linesTruncated: full.lines.length > lines.length },
    };
  }

  /**
   * The review sheets. `sheet=products` is one row per listing with the
   * proposed action; `sheet=lines` is one row per sale / order line with
   * the proposed STORIS listing, a `confirm` column and an
   * `override_sku` column. Filled in and uploaded back on the cleanup
   * page, they drive `apply`.
   */
  @Get('shopify.csv')
  @RequirePermission('products.view')
  async sheet(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('sheet') sheet: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const which = sheet === 'products' ? 'products' : 'lines';
    const report = await this.build(tenant.businessId!);
    const stamp = new Date().toISOString().slice(0, 10);
    let csv: string;
    if (which === 'products') {
      csv = toCsv(
        [
          'product_id',
          'sku',
          'name',
          'source',
          'active',
          'on_hand',
          'reserved',
          'sale_lines',
          'order_lines',
          'other_refs',
          'proposed_sku',
          'proposed_name',
          'confidence',
          'action',
          'confirm',
        ],
        report.products.map((p) => [
          p.id,
          p.sku,
          p.name,
          p.source ?? (p.reasons.includes('lowercase_name') ? 'app' : ''),
          yesNo(p.isActive),
          p.onHand,
          p.reserved,
          p.saleLines,
          p.orderLines,
          p.otherRefs,
          p.proposed?.sku ?? '',
          p.proposed?.name ?? '',
          p.proposed ? Math.round(p.proposed.score * 100) : '',
          p.action,
          '',
        ]),
      );
    } else {
      csv = toCsv(
        [
          'line_id',
          'doc',
          'number',
          'date',
          'status',
          'imported',
          'customer',
          'qty',
          'unit_price',
          'current_sku',
          'current_name',
          'proposed_sku',
          'proposed_name',
          'confidence',
          'alternates',
          'adjust_stock',
          'confirm',
          'override_sku',
        ],
        report.lines.map((l) => [
          l.lineId,
          l.doc,
          l.number,
          l.date.toISOString().slice(0, 10),
          l.status,
          yesNo(l.imported),
          l.customer,
          l.quantity,
          (l.unitPriceCents / 100).toFixed(2),
          l.sku,
          l.name,
          l.proposed?.sku ?? '',
          l.proposed?.name ?? '',
          l.proposed ? Math.round(l.proposed.score * 100) : '',
          l.alternates
            .filter((a) => a.variantId !== l.proposed?.variantId)
            .map((a) => `${a.sku ?? a.name} (${Math.round(a.score * 100)}%)`)
            .join(' | '),
          yesNo(l.stockAdjustSuggested),
          '',
          '',
        ]),
      );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shopify-cleanup-${which}-${stamp}.csv"`,
    );
    res.send(csv);
  }

  private async build(businessId: string): Promise<CleanupReport> {
    // Every product once, with its selling variant (the one whose SKU
    // equals the product SKU, else the first active one), brand, and the
    // import batch sources that ever wrote it (import_rows history; the
    // legacy_refs row is last-writer and lies for shared SKUs).
    const rows = await this.db.execute<{
      id: string;
      sku: string | null;
      name: string;
      is_active: boolean;
      created_at: Date;
      brand: string | null;
      variant_id: string | null;
      variant_sku: string | null;
      variant_name: string | null;
      attributes: Record<string, unknown> | null;
      price_cents: number | null;
      sources: string[] | null;
    }>(sql`
      SELECT p.id, p.sku, p.name, p.is_active, p.created_at, b.name AS brand,
        v.id AS variant_id, v.sku AS variant_sku, v.name AS variant_name, v.attributes_json AS attributes,
        v.price_cents,
        (
          SELECT array_agg(DISTINCT src) FROM (
            SELECT ib.source AS src FROM import_rows ir JOIN import_batches ib ON ib.id = ir.batch_id
             WHERE ir.jetnine_id = p.id AND ir.business_id = p.business_id AND ib.entity = 'product'
            UNION
            SELECT coalesce(ib2.source, lr.source) FROM legacy_refs lr LEFT JOIN import_batches ib2 ON ib2.id = lr.import_batch_id
             WHERE lr.entity = 'product' AND lr.jetnine_id = p.id AND lr.business_id = p.business_id
          ) s
        ) AS sources
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN LATERAL (
        SELECT pv.id, pv.sku, pv.name, pv.attributes_json, pv.price_cents FROM product_variants pv
         WHERE pv.product_id = p.id
         ORDER BY (pv.sku = p.sku) DESC NULLS LAST, pv.is_active DESC, pv.created_at ASC
         LIMIT 1
      ) v ON true
      WHERE p.business_id = ${businessId}
      ORDER BY p.name, p.id
    `);
    const products: ProductRow[] = rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      isActive: r.is_active,
      createdAt: r.created_at,
      brand: r.brand,
      variantId: r.variant_id,
      variantSku: r.variant_sku,
      variantName: r.variant_name,
      attributes: r.attributes,
      priceCents: r.price_cents ?? 0,
      sources: (r.sources ?? []).filter((s): s is string => typeof s === 'string'),
    }));

    const reasonsFor = (p: ProductRow): CleanupProduct['reasons'] => {
      const reasons: CleanupProduct['reasons'] = [];
      if (hasLowercase(p.name)) reasons.push('lowercase_name');
      if (p.sources.length > 0 && p.sources.every((s) => CONNECTOR_SOURCES.has(s.toLowerCase()))) {
        reasons.push('connector_import');
      }
      return reasons;
    };
    const candidates = products.filter((p) => reasonsFor(p).length > 0);
    const keepers = products.filter((p) => p.isActive && p.variantId && reasonsFor(p).length === 0);

    // Crosswalk pool: STORIS / app listings, bucketed by size so each
    // Shopify listing only scores against its own size (plus the ones
    // that state no size at all).
    type Keeper = { p: ProductRow; parsed: ParsedListing };
    const pool: Candidate<Keeper>[] = keepers.map((p) => {
      const parsed = parseListing({
        name: p.name,
        variantName: p.variantName,
        attributes: p.attributes,
        brand: p.brand,
        sku: p.variantSku ?? p.sku,
      });
      return { item: { p, parsed }, parsed, sku: p.variantSku ?? p.sku };
    });
    const bySize = new Map<string, Candidate<Keeper>[]>();
    const noSize: Candidate<Keeper>[] = [];
    for (const c of pool) {
      if (!c.parsed.size) {
        noSize.push(c);
        continue;
      }
      const list = bySize.get(c.parsed.size) ?? [];
      list.push(c);
      bySize.set(c.parsed.size, list);
    }
    const toProposal = (r: {
      item: Keeper;
      detail: { score: number; matchedTokens: string[] };
    }): Proposal => ({
      productId: r.item.p.id,
      variantId: r.item.p.variantId!,
      sku: r.item.p.variantSku ?? r.item.p.sku,
      name: r.item.p.name,
      score: r.detail.score,
      matched: r.detail.matchedTokens,
    });
    const proposalsFor = (p: ProductRow): { proposed: Proposal | null; alternates: Proposal[] } => {
      const parsed = parseListing({
        name: p.name,
        variantName: p.variantName,
        attributes: p.attributes,
        brand: p.brand,
        sku: null,
      });
      const scope = parsed.size ? [...(bySize.get(parsed.size) ?? []), ...noSize] : pool;
      const ranked = rankCandidates(parsed, p.variantSku ?? p.sku, scope, 3).map(toProposal);
      const top = ranked[0];
      return { proposed: top && top.score >= PROPOSAL_MIN_SCORE ? top : null, alternates: ranked };
    };

    // References and stock per candidate product.
    const candidateIds = candidates.map((p) => p.id);
    const refRows = candidateIds.length
      ? await this.db.execute<{
          id: string;
          on_hand: number;
          reserved: number;
          sale_lines: number;
          order_lines: number;
          other_refs: number;
        }>(sql`
          SELECT p.id,
            coalesce((SELECT sum(il.on_hand) FROM inventory_levels il JOIN product_variants pv ON pv.id = il.variant_id WHERE pv.product_id = p.id), 0)::int AS on_hand,
            coalesce((SELECT sum(il.reserved) FROM inventory_levels il JOIN product_variants pv ON pv.id = il.variant_id WHERE pv.product_id = p.id), 0)::int AS reserved,
            (SELECT count(*) FROM sale_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)::int AS sale_lines,
            (SELECT count(*) FROM order_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)::int AS order_lines,
            (
              (SELECT count(*) FROM purchase_order_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM stock_transfer_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM as_is_items x JOIN product_variants pv ON pv.id = x.variant_id OR pv.id = x.restocked_variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM write_offs x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM refund_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM order_return_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM serial_units x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
              + (SELECT count(*) FROM service_order_lines x JOIN product_variants pv ON pv.id = x.variant_id WHERE pv.product_id = p.id)
            )::int AS other_refs
          FROM products p
          WHERE p.business_id = ${businessId} AND p.id = ANY(${sql`ARRAY[${sql.join(
            candidateIds.map((id) => sql`${id}::uuid`),
            sql`, `,
          )}]`})
        `)
      : [];
    const refs = new Map(refRows.map((r) => [r.id, r]));

    const proposalsByProduct = new Map<
      string,
      { proposed: Proposal | null; alternates: Proposal[] }
    >();
    const outProducts: CleanupProduct[] = candidates.map((p) => {
      const r = refs.get(p.id);
      const pr = proposalsFor(p);
      proposalsByProduct.set(p.id, pr);
      const saleLines = r?.sale_lines ?? 0;
      const orderLines = r?.order_lines ?? 0;
      const otherRefs = r?.other_refs ?? 0;
      const onHand = r?.on_hand ?? 0;
      const reserved = r?.reserved ?? 0;
      // Stock on a Shopify listing is never kept (owner 2026-09-06): it is
      // cleared when the listing retires, so only documents block a delete.
      const referenced = saleLines + orderLines + otherRefs > 0;
      const source =
        p.sources.find((s) => CONNECTOR_SOURCES.has(s.toLowerCase())) ?? p.sources[0] ?? null;
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        isActive: p.isActive,
        brand: p.brand,
        source,
        reasons: reasonsFor(p),
        onHand,
        reserved,
        saleLines,
        orderLines,
        otherRefs,
        proposed: pr.proposed,
        alternates: pr.alternates,
        action: !referenced
          ? 'delete'
          : saleLines + orderLines > 0 && pr.proposed
            ? 'relink'
            : 'deactivate',
      };
    });

    // Every sale / order line on a candidate listing.
    const [invBatch] = await this.db
      .select({ at: sql<Date | null>`max(${schema.importBatches.committedAt})` })
      .from(schema.importBatches)
      .where(
        and(
          eq(schema.importBatches.businessId, businessId),
          eq(schema.importBatches.entity, 'inventory'),
          eq(schema.importBatches.status, 'committed'),
        ),
      );
    const lastInventoryImportAt = invBatch?.at ? new Date(invBatch.at) : null;

    const lines: CleanupLine[] = [];
    if (candidateIds.length) {
      const idList = sql`ARRAY[${sql.join(
        candidateIds.map((id) => sql`${id}::uuid`),
        sql`, `,
      )}]`;
      const saleRows = await this.db.execute<{
        line_id: string;
        doc_id: string;
        number: string;
        status: string;
        date: Date;
        imported: boolean;
        customer: string | null;
        location_id: string;
        quantity: number;
        unit_price_cents: number;
        description: string;
        product_id: string;
        variant_id: string;
        sku: string | null;
        name: string;
        serial_tracked: boolean;
      }>(sql`
        SELECT sl.id AS line_id, s.id AS doc_id, s.number, s.status, coalesce(s.completed_at, s.created_at) AS date,
          (s.imported_at IS NOT NULL) AS imported,
          nullif(btrim(concat_ws(' ', c.first_name, c.last_name)), '') AS customer,
          s.location_id, sl.quantity, sl.unit_price_cents, sl.description,
          p.id AS product_id, v.id AS variant_id, v.sku, p.name, p.serial_tracked
        FROM sale_lines sl
        JOIN sales s ON s.id = sl.sale_id
        JOIN product_variants v ON v.id = sl.variant_id
        JOIN products p ON p.id = v.product_id
        LEFT JOIN customers c ON c.id = s.customer_id
        WHERE sl.business_id = ${businessId} AND p.id = ANY(${idList})
        ORDER BY (s.imported_at IS NOT NULL) ASC, coalesce(s.completed_at, s.created_at) DESC
      `);
      for (const r of saleRows) {
        const pr = proposalsByProduct.get(r.product_id)!;
        const date = new Date(r.date);
        lines.push({
          doc: 'sale',
          lineId: r.line_id,
          docId: r.doc_id,
          number: r.number,
          status: r.status,
          date,
          imported: r.imported,
          customer: r.customer,
          locationId: r.location_id,
          quantity: r.quantity,
          unitPriceCents: r.unit_price_cents,
          description: r.description,
          productId: r.product_id,
          variantId: r.variant_id,
          sku: r.sku,
          name: r.name,
          proposed: pr.proposed,
          alternates: pr.alternates,
          stockAdjustSuggested:
            !r.imported &&
            STOCK_SALE_STATUSES.has(r.status) &&
            (lastInventoryImportAt == null || date > lastInventoryImportAt),
          qtyReserved: 0,
          qtyFulfilled: STOCK_SALE_STATUSES.has(r.status) ? r.quantity : 0,
          serialTracked: r.serial_tracked,
        });
      }
      const orderRows = await this.db.execute<{
        line_id: string;
        doc_id: string;
        number: string;
        status: string;
        date: Date;
        imported: boolean;
        customer: string | null;
        location_id: string;
        quantity: number;
        qty_reserved: number;
        qty_fulfilled: number;
        unit_price_cents: number;
        description: string;
        product_id: string;
        variant_id: string;
        sku: string | null;
        name: string;
        serial_tracked: boolean;
        has_serials: boolean;
      }>(sql`
        SELECT ol.id AS line_id, o.id AS doc_id, o.number, o.status, coalesce(o.completed_at, o.created_at) AS date,
          (o.imported_at IS NOT NULL) AS imported,
          nullif(btrim(concat_ws(' ', c.first_name, c.last_name)), '') AS customer,
          coalesce(ol.source_location_id, o.stock_location_id, o.location_id) AS location_id,
          ol.quantity, ol.qty_reserved, ol.qty_fulfilled, ol.unit_price_cents, ol.description,
          p.id AS product_id, v.id AS variant_id, v.sku, p.name, p.serial_tracked,
          (ol.serial_unit_ids IS NOT NULL AND cardinality(ol.serial_unit_ids) > 0) AS has_serials
        FROM order_lines ol
        JOIN orders o ON o.id = ol.order_id
        JOIN product_variants v ON v.id = ol.variant_id
        JOIN products p ON p.id = v.product_id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE ol.business_id = ${businessId} AND p.id = ANY(${idList})
        ORDER BY (o.imported_at IS NOT NULL) ASC, coalesce(o.completed_at, o.created_at) DESC
      `);
      for (const r of orderRows) {
        const pr = proposalsByProduct.get(r.product_id)!;
        const date = new Date(r.date);
        lines.push({
          doc: 'order',
          lineId: r.line_id,
          docId: r.doc_id,
          number: r.number,
          status: r.status,
          date,
          imported: r.imported,
          customer: r.customer,
          locationId: r.location_id,
          quantity: r.quantity,
          unitPriceCents: r.unit_price_cents,
          description: r.description,
          productId: r.product_id,
          variantId: r.variant_id,
          sku: r.sku,
          name: r.name,
          proposed: pr.proposed,
          alternates: pr.alternates,
          stockAdjustSuggested:
            !r.imported &&
            r.qty_fulfilled > 0 &&
            (lastInventoryImportAt == null || date > lastInventoryImportAt),
          qtyReserved: r.qty_reserved,
          qtyFulfilled: r.qty_fulfilled,
          serialTracked: r.serial_tracked || r.has_serials,
        });
      }
    }
    lines.sort(
      (a, b) => Number(a.imported) - Number(b.imported) || b.date.getTime() - a.date.getTime(),
    );

    // STORIS listings a connector batch also wrote: the sync overwrote
    // their price with Shopify's (STORIS carries no retail price, D12).
    const shopifyPriced: ShopifyPriced[] = keepers
      .filter(
        (p) =>
          p.priceCents > 0 &&
          p.sources.some((x) => CONNECTOR_SOURCES.has(x.toLowerCase())) &&
          p.sources.some((x) => !CONNECTOR_SOURCES.has(x.toLowerCase())),
      )
      .map((p) => ({
        productId: p.id,
        variantId: p.variantId!,
        sku: p.variantSku ?? p.sku,
        name: p.name,
        priceCents: p.priceCents,
      }));

    return {
      rule: {
        lowercaseName: true,
        connectorSources: [...CONNECTOR_SOURCES],
        proposalMinScore: PROPOSAL_MIN_SCORE,
      },
      lastInventoryImportAt,
      products: outProducts,
      lines,
      shopifyPriced,
      counts: {
        products: outProducts.length,
        withProposal: outProducts.filter((p) => p.proposed).length,
        saleLines: lines.filter((l) => l.doc === 'sale').length,
        orderLines: lines.filter((l) => l.doc === 'order').length,
        linesWithProposal: lines.filter((l) => l.proposed).length,
        linesTruncated: false,
        shopifyPriced: shopifyPriced.length,
        stockOnListings: outProducts.reduce((n, p) => n + p.onHand, 0),
      },
    };
  }

  // ----------------------------------------------------------------- apply

  /**
   * Apply confirmed changes. Lines first (so the listings they leave can
   * be retired in the same call), then products. Each item succeeds or
   * fails on its own and says why; `dryRun` validates and reports without
   * writing anything.
   */
  @Post('shopify/apply')
  @RequirePermission('products.merge')
  async apply(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: ApplyBody,
  ): Promise<ApplyResult> {
    const businessId = tenant.businessId!;
    const dryRun = body?.dryRun === true;
    const lineChanges = Array.isArray(body?.lines) ? body.lines : [];
    const productChanges = Array.isArray(body?.products) ? body.products : [];
    const resetPrices = body?.resetPrices === true;
    if (lineChanges.length === 0 && productChanges.length === 0 && !resetPrices) {
      throw new BadRequestException(
        'Nothing to apply: give lines[], products[] and/or resetPrices',
      );
    }
    if (lineChanges.length + productChanges.length > 5000) {
      throw new BadRequestException('At most 5000 changes per call');
    }
    for (const c of lineChanges) {
      if (c?.doc !== 'sale' && c?.doc !== 'order') {
        throw new BadRequestException('lines[].doc must be "sale" or "order"');
      }
      if (typeof c.lineId !== 'string' || !c.lineId) {
        throw new BadRequestException('lines[].lineId is required');
      }
      if (!c.toVariantId && !c.toSku) {
        throw new BadRequestException(`lines[] ${c.lineId}: toVariantId or toSku is required`);
      }
    }
    for (const c of productChanges) {
      if (typeof c?.productId !== 'string' || !c.productId) {
        throw new BadRequestException('products[].productId is required');
      }
      if (c.action !== 'deactivate' && c.action !== 'delete') {
        throw new BadRequestException('products[].action must be "deactivate" or "delete"');
      }
    }

    const result: ApplyResult = {
      dryRun,
      lines: [],
      products: [],
      prices: [],
      summary: {
        linesRelinked: 0,
        linesFailed: 0,
        productsRetired: 0,
        productsFailed: 0,
        pricesReset: 0,
        stockCleared: 0,
      },
    };

    for (const c of lineChanges) {
      try {
        const r =
          c.doc === 'sale'
            ? await this.relinkSaleLine(businessId, tenant.userId, c, dryRun)
            : await this.relinkOrderLine(businessId, tenant.userId, c, dryRun);
        result.lines.push(r);
        result.summary.linesRelinked += 1;
      } catch (err) {
        result.lines.push({
          doc: c.doc,
          lineId: c.lineId,
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        });
        result.summary.linesFailed += 1;
      }
    }
    for (const c of productChanges) {
      try {
        const { message, stockCleared } = await this.retireProduct(
          businessId,
          tenant.userId,
          c,
          dryRun,
        );
        result.products.push({ productId: c.productId, action: c.action, ok: true, message });
        result.summary.productsRetired += 1;
        result.summary.stockCleared += stockCleared;
      } catch (err) {
        result.products.push({
          productId: c.productId,
          action: c.action,
          ok: false,
          message: err instanceof Error ? err.message : String(err),
        });
        result.summary.productsFailed += 1;
      }
    }
    if (resetPrices) {
      const { shopifyPriced } = await this.build(businessId);
      for (const p of shopifyPriced) {
        if (!dryRun) {
          await this.db
            .update(schema.productVariants)
            .set({ priceCents: 0 })
            .where(eq(schema.productVariants.id, p.variantId));
          await this.audit.log({
            action: 'product_variant.price.reset',
            targetType: 'product_variant',
            targetId: p.variantId,
            before: { priceCents: p.priceCents },
            after: { priceCents: 0 },
            metadata: { sku: p.sku, reason: 'price written by the Shopify sync (cleanup)' },
          });
        }
        result.prices.push({
          variantId: p.variantId,
          sku: p.sku,
          name: p.name,
          fromCents: p.priceCents,
          ok: true,
          message: dryRun ? 'would reset to $0' : 'reset to $0',
        });
        result.summary.pricesReset += 1;
      }
    }
    return result;
  }

  /** The STORIS listing to move a line onto: by variant id, or by SKU (case-insensitive, must be unique). */
  private async resolveTarget(
    businessId: string,
    c: LineChange,
  ): Promise<{ variantId: string; sku: string | null; productId: string; description: string }> {
    const cols = {
      variantId: schema.productVariants.id,
      sku: schema.productVariants.sku,
      variantName: schema.productVariants.name,
      variantActive: schema.productVariants.isActive,
      productId: schema.products.id,
      productName: schema.products.name,
      productActive: schema.products.isActive,
    };
    let rows;
    if (c.toVariantId) {
      rows = await this.db
        .select(cols)
        .from(schema.productVariants)
        .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
        .where(
          and(
            eq(schema.productVariants.businessId, businessId),
            eq(schema.productVariants.id, c.toVariantId),
          ),
        );
      if (rows.length === 0) throw new Error(`Target variant ${c.toVariantId} not found`);
    } else {
      const wanted = c.toSku!.trim();
      rows = await this.db
        .select(cols)
        .from(schema.productVariants)
        .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
        .where(
          and(
            eq(schema.productVariants.businessId, businessId),
            sql`lower(${schema.productVariants.sku}) = lower(${wanted})`,
          ),
        )
        .orderBy(
          desc(schema.productVariants.isActive),
          desc(schema.products.isActive),
          asc(schema.productVariants.createdAt),
        );
      // Prefer the active STORIS-shaped one; refuse a genuinely ambiguous SKU.
      const live = rows.filter(
        (r) => r.variantActive && r.productActive && !hasLowercase(r.productName),
      );
      if (live.length > 1)
        throw new Error(`SKU "${wanted}" matches ${live.length} active listings — use toVariantId`);
      if (live.length === 1) rows = live;
      if (rows.length === 0) throw new Error(`No listing with SKU "${wanted}"`);
    }
    const t = rows[0]!;
    if (!t.variantActive || !t.productActive) {
      throw new Error(`Target ${t.sku ?? t.variantId} is inactive — relink onto an active listing`);
    }
    if (hasLowercase(t.productName)) {
      throw new Error(
        `Target ${t.sku ?? t.variantId} ("${t.productName}") is itself a Shopify-shaped listing`,
      );
    }
    return {
      variantId: t.variantId,
      sku: t.sku,
      productId: t.productId,
      description: displayName(t.productName, t.variantName),
    };
  }

  private async relinkSaleLine(
    businessId: string,
    actorUserId: string | null,
    c: LineChange,
    dryRun: boolean,
  ): Promise<ApplyResult['lines'][number]> {
    const [line] = await this.db
      .select({
        id: schema.saleLines.id,
        saleId: schema.saleLines.saleId,
        variantId: schema.saleLines.variantId,
        description: schema.saleLines.description,
        quantity: schema.saleLines.quantity,
        saleNumber: schema.sales.number,
        saleStatus: schema.sales.status,
        locationId: schema.sales.locationId,
        importedAt: schema.sales.importedAt,
        fromSku: schema.productVariants.sku,
      })
      .from(schema.saleLines)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.saleLines.saleId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.saleLines.variantId))
      .where(and(eq(schema.saleLines.businessId, businessId), eq(schema.saleLines.id, c.lineId)))
      .limit(1);
    if (!line) throw new Error('Sale line not found');
    const target = await this.resolveTarget(businessId, c);
    if (line.variantId === target.variantId) throw new Error('Line is already on that listing');

    const [refunded] = await this.db
      .select({ qty: sql<number>`coalesce(sum(${schema.refundLines.quantity}), 0)::int` })
      .from(schema.refundLines)
      .where(eq(schema.refundLines.saleLineId, line.id));
    const stockQty =
      c.adjustStock &&
      !line.importedAt &&
      STOCK_SALE_STATUSES.has(line.saleStatus) &&
      line.variantId
        ? Math.max(0, line.quantity - (refunded?.qty ?? 0))
        : 0;

    const out: ApplyResult['lines'][number] = {
      doc: 'sale',
      lineId: line.id,
      ok: true,
      message: dryRun ? 'would relink' : 'relinked',
      from: { variantId: line.variantId, sku: line.fromSku, description: line.description },
      to: { variantId: target.variantId, sku: target.sku, description: target.description },
      stockMoved: stockQty,
      reservationMoved: 0,
    };
    if (dryRun) return out;

    await this.db
      .update(schema.saleLines)
      .set({ variantId: target.variantId, description: target.description })
      .where(eq(schema.saleLines.id, line.id));
    if (line.variantId) {
      await this.db
        .update(schema.refundLines)
        .set({ variantId: target.variantId })
        .where(
          and(
            eq(schema.refundLines.saleLineId, line.id),
            eq(schema.refundLines.variantId, line.variantId),
          ),
        );
    }
    if (stockQty > 0 && line.variantId) {
      await this.moveStock(businessId, actorUserId, {
        toVariantId: target.variantId,
        locationId: line.locationId,
        quantity: stockQty,
        referenceId: line.id,
        note: `listing relink on ${line.saleNumber}: ${line.fromSku ?? line.variantId} → ${target.sku ?? target.variantId}`,
      });
    }
    await this.audit.log({
      action: 'sale_line.relink',
      targetType: 'sale',
      targetId: line.saleId,
      before: {
        lineId: line.id,
        variantId: line.variantId,
        sku: line.fromSku,
        description: line.description,
      },
      after: {
        lineId: line.id,
        variantId: target.variantId,
        sku: target.sku,
        description: target.description,
        stockMoved: stockQty,
      },
      metadata: { saleNumber: line.saleNumber, reason: 'shopify listing cleanup' },
    });
    return out;
  }

  private async relinkOrderLine(
    businessId: string,
    actorUserId: string | null,
    c: LineChange,
    dryRun: boolean,
  ): Promise<ApplyResult['lines'][number]> {
    const [line] = await this.db
      .select({
        id: schema.orderLines.id,
        orderId: schema.orderLines.orderId,
        variantId: schema.orderLines.variantId,
        description: schema.orderLines.description,
        quantity: schema.orderLines.quantity,
        qtyReserved: schema.orderLines.qtyReserved,
        qtyFulfilled: schema.orderLines.qtyFulfilled,
        qtyReturned: schema.orderLines.qtyReturned,
        sourceLocationId: schema.orderLines.sourceLocationId,
        serialUnitIds: schema.orderLines.serialUnitIds,
        orderNumber: schema.orders.number,
        orderStatus: schema.orders.status,
        locationId: schema.orders.locationId,
        stockLocationId: schema.orders.stockLocationId,
        importedAt: schema.orders.importedAt,
        fromSku: schema.productVariants.sku,
      })
      .from(schema.orderLines)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderLines.orderId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.orderLines.variantId))
      .where(and(eq(schema.orderLines.businessId, businessId), eq(schema.orderLines.id, c.lineId)))
      .limit(1);
    if (!line) throw new Error('Order line not found');
    if (line.serialUnitIds && line.serialUnitIds.length > 0) {
      throw new Error('Line has serial units picked — release them first, then relink');
    }
    const target = await this.resolveTarget(businessId, c);
    if (line.variantId === target.variantId) throw new Error('Line is already on that listing');

    const stockLocationId = line.sourceLocationId ?? line.stockLocationId ?? line.locationId;
    const reservation = line.variantId ? line.qtyReserved : 0;
    const stockQty =
      c.adjustStock && !line.importedAt && line.variantId
        ? Math.max(0, line.qtyFulfilled - line.qtyReturned)
        : 0;

    const out: ApplyResult['lines'][number] = {
      doc: 'order',
      lineId: line.id,
      ok: true,
      message: dryRun ? 'would relink' : 'relinked',
      from: { variantId: line.variantId, sku: line.fromSku, description: line.description },
      to: { variantId: target.variantId, sku: target.sku, description: target.description },
      stockMoved: stockQty,
      reservationMoved: reservation,
    };
    if (dryRun) return out;

    await this.db
      .update(schema.orderLines)
      .set({ variantId: target.variantId, description: target.description })
      .where(eq(schema.orderLines.id, line.id));
    if (line.variantId) {
      await this.db
        .update(schema.orderReturnLines)
        .set({ variantId: target.variantId })
        .where(
          and(
            eq(schema.orderReturnLines.orderLineId, line.id),
            eq(schema.orderReturnLines.variantId, line.variantId),
          ),
        );
    }
    if (reservation > 0 && line.variantId) {
      // The commitment follows the line: release on the old listing,
      // reserve on the new one (delta-0 movements, as the order flow does).
      await this.db
        .update(schema.inventoryLevels)
        .set({
          reserved: sql`GREATEST(0, ${schema.inventoryLevels.reserved} - ${reservation})`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.inventoryLevels.variantId, line.variantId),
            eq(schema.inventoryLevels.locationId, stockLocationId),
          ),
        );
      await this.db
        .insert(schema.inventoryLevels)
        .values({
          businessId,
          variantId: target.variantId,
          locationId: stockLocationId,
          onHand: 0,
          reserved: reservation,
        })
        .onConflictDoUpdate({
          target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
          set: {
            reserved: sql`${schema.inventoryLevels.reserved} + ${reservation}`,
            updatedAt: new Date(),
          },
        });
      await this.db.insert(schema.inventoryMovements).values([
        {
          businessId,
          variantId: line.variantId,
          locationId: stockLocationId,
          delta: 0,
          reason: 'order_release',
          referenceType: 'order',
          referenceId: line.orderId,
          actorUserId,
          notes: `released ${reservation} — listing relink to ${target.sku ?? target.variantId}`,
        },
        {
          businessId,
          variantId: target.variantId,
          locationId: stockLocationId,
          delta: 0,
          reason: 'order_reserve',
          referenceType: 'order',
          referenceId: line.orderId,
          actorUserId,
          notes: `reserved ${reservation} — listing relink from ${line.fromSku ?? line.variantId}`,
        },
      ]);
    }
    if (stockQty > 0 && line.variantId) {
      await this.moveStock(businessId, actorUserId, {
        toVariantId: target.variantId,
        locationId: stockLocationId,
        quantity: stockQty,
        referenceId: line.id,
        note: `listing relink on ${line.orderNumber}: ${line.fromSku ?? line.variantId} → ${target.sku ?? target.variantId}`,
      });
    }
    await this.audit.log({
      action: 'order_line.relink',
      targetType: 'order',
      targetId: line.orderId,
      before: {
        lineId: line.id,
        variantId: line.variantId,
        sku: line.fromSku,
        description: line.description,
      },
      after: {
        lineId: line.id,
        variantId: target.variantId,
        sku: target.sku,
        description: target.description,
        stockMoved: stockQty,
        reservationMoved: reservation,
      },
      metadata: { orderNumber: line.orderNumber, reason: 'shopify listing cleanup' },
    });
    return out;
  }

  /**
   * Apply the stock effect of the sale to the right listing: −qty off the
   * STORIS variant as an `adjustment` movement that points at the line so
   * the ledger explains itself, floored at zero like the register does.
   * Nothing goes back onto the Shopify variant — stock on those listings
   * is never kept (owner 2026-09-06); it is cleared when they retire.
   */
  private async moveStock(
    businessId: string,
    actorUserId: string | null,
    args: {
      toVariantId: string;
      locationId: string;
      quantity: number;
      referenceId: string;
      note: string;
    },
  ): Promise<void> {
    await this.db
      .insert(schema.inventoryLevels)
      .values({
        businessId,
        variantId: args.toVariantId,
        locationId: args.locationId,
        onHand: 0,
      })
      .onConflictDoUpdate({
        target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
        set: {
          onHand: sql`GREATEST(0, ${schema.inventoryLevels.onHand} - ${args.quantity})`,
          updatedAt: new Date(),
        },
      });
    await this.db.insert(schema.inventoryMovements).values({
      businessId,
      variantId: args.toVariantId,
      locationId: args.locationId,
      delta: -args.quantity,
      reason: 'adjustment',
      referenceType: 'listing_relink',
      referenceId: args.referenceId,
      actorUserId,
      notes: args.note,
    });
  }

  /**
   * Retire a listing. Either way its stock is cleared first (owner
   * 2026-09-06: stock on a Shopify listing is never kept) as `adjustment`
   * movements pointing at the product. Deactivate then hides it from
   * selling and keeps every document; delete is refused while anything
   * still points at it (the full reference list, not the shorter one the
   * generic DELETE checks), and takes its legacy_refs with it so a later
   * import cannot resurrect it.
   */
  private async retireProduct(
    businessId: string,
    actorUserId: string | null,
    c: ProductChange,
    dryRun: boolean,
  ): Promise<{ message: string; stockCleared: number }> {
    const [product] = await this.db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        sku: schema.products.sku,
        isActive: schema.products.isActive,
      })
      .from(schema.products)
      .where(and(eq(schema.products.businessId, businessId), eq(schema.products.id, c.productId)))
      .limit(1);
    if (!product) throw new Error('Product not found');
    const label = product.sku ?? product.name;

    const variantRows = await this.db
      .select({ id: schema.productVariants.id })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, product.id));
    const variantIds = variantRows.map((v) => v.id);
    const levels = variantIds.length
      ? await this.db
          .select({
            variantId: schema.inventoryLevels.variantId,
            locationId: schema.inventoryLevels.locationId,
            onHand: schema.inventoryLevels.onHand,
            reserved: schema.inventoryLevels.reserved,
          })
          .from(schema.inventoryLevels)
          .where(inArray(schema.inventoryLevels.variantId, variantIds))
      : [];
    const stocked = levels.filter((l) => l.onHand !== 0 || l.reserved !== 0);
    const stockCleared = stocked.reduce((n, l) => n + l.onHand, 0);
    const clearNote = stocked.length
      ? ` (clears ${stockCleared} on hand${stocked.some((l) => l.reserved) ? ' + reservations' : ''})`
      : '';

    if (c.action === 'delete') {
      if (variantIds.length > 0) {
        const refTables = [
          ['sale lines', schema.saleLines.variantId, schema.saleLines],
          ['order lines', schema.orderLines.variantId, schema.orderLines],
          ['refund lines', schema.refundLines.variantId, schema.refundLines],
          ['return lines', schema.orderReturnLines.variantId, schema.orderReturnLines],
          ['PO lines', schema.purchaseOrderLines.variantId, schema.purchaseOrderLines],
          ['transfer lines', schema.stockTransferLines.variantId, schema.stockTransferLines],
          ['as-is pieces', schema.asIsItems.variantId, schema.asIsItems],
          ['as-is restocks', schema.asIsItems.restockedVariantId, schema.asIsItems],
          ['write-offs', schema.writeOffs.variantId, schema.writeOffs],
          ['serial units', schema.serialUnits.variantId, schema.serialUnits],
          ['service lines', schema.serviceOrderLines.variantId, schema.serviceOrderLines],
          ['count lines', schema.physicalCountLines.variantId, schema.physicalCountLines],
        ] as const;
        const blockers: string[] = [];
        for (const [name, column, table] of refTables) {
          const [row] = await this.db
            .select({ n: sql<number>`count(*)::int` })
            .from(table)
            .where(inArray(column, variantIds));
          if ((row?.n ?? 0) > 0) blockers.push(`${row!.n} ${name}`);
        }
        if (blockers.length > 0) {
          throw new Error(
            `Cannot delete ${label}: still on ${blockers.join(', ')} — relink those first or deactivate`,
          );
        }
      }
    } else if (!product.isActive && stocked.length === 0) {
      return { message: `${label} was already inactive`, stockCleared: 0 };
    }
    if (dryRun) {
      return {
        message: `would ${c.action} ${label}${clearNote}`,
        stockCleared,
      };
    }

    for (const l of stocked) {
      await this.db
        .update(schema.inventoryLevels)
        .set({ onHand: 0, reserved: 0, updatedAt: new Date() })
        .where(
          and(
            eq(schema.inventoryLevels.variantId, l.variantId),
            eq(schema.inventoryLevels.locationId, l.locationId),
          ),
        );
      await this.db.insert(schema.inventoryMovements).values({
        businessId,
        variantId: l.variantId,
        locationId: l.locationId,
        delta: -l.onHand,
        reason: 'adjustment',
        referenceType: 'listing_retire',
        referenceId: product.id,
        actorUserId,
        notes:
          `${label} retired — stock on a Shopify listing is not kept` +
          (l.reserved ? ` (released ${l.reserved} reserved)` : ''),
      });
    }

    if (c.action === 'deactivate') {
      if (product.isActive) {
        await this.db
          .update(schema.products)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(schema.products.id, product.id));
      }
      await this.audit.log({
        action: 'product.deactivate',
        targetType: 'product',
        targetId: product.id,
        before: { isActive: product.isActive },
        after: { isActive: false, reason: 'shopify listing cleanup', stockCleared },
      });
      return { message: `deactivated ${label}${clearNote}`, stockCleared };
    }

    await this.db.delete(schema.products).where(eq(schema.products.id, product.id));
    await this.db
      .delete(schema.legacyRefs)
      .where(
        and(
          eq(schema.legacyRefs.businessId, businessId),
          eq(schema.legacyRefs.entity, 'product'),
          eq(schema.legacyRefs.jetnineId, product.id),
        ),
      );
    await this.audit.log({
      action: 'product.delete',
      targetType: 'product',
      targetId: product.id,
      before: { name: product.name, sku: product.sku, variantCount: variantIds.length },
      after: null,
      metadata: { reason: 'shopify listing cleanup', stockCleared },
    });
    return { message: `deleted ${label}${clearNote}`, stockCleared };
  }
}
