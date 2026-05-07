import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { StripeService } from '../stripe/stripe.service';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';
import { computeTotals, refundUnitCents } from './totals';

interface LookupRow {
  variantId: string;
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  variantName: string | null;
  priceCents: number;
}

interface PaymentInput {
  method?: 'cash' | 'card';
  amountCents?: number;
  /** For 'card', the (test) processor reference; optional. */
  processorRef?: string;
  /**
   * For 'card', a Stripe PaymentMethod id (`pm_xxx`) collected on the
   * client via Stripe Elements. When present and the business has a
   * connected Stripe account, the backend charges this method on the
   * merchant's account before the sale is recorded. When absent, the
   * payment is recorded as a manual capture (legacy / dev mode).
   */
  stripePaymentMethodId?: string;
}

interface CartLineInput {
  variantId?: string;
  quantity?: number;
  /** Optional override; defaults to the variant's price. */
  unitPriceCents?: number;
  lineDiscountCents?: number;
}

interface CreateSaleBody {
  locationId?: string;
  customerId?: string | null;
  notes?: string | null;
  lines?: CartLineInput[];
  orderDiscountCents?: number;
  /**
   * Optional discount code. If supplied, the backend looks up the
   * code, validates active/window/usage/min-subtotal/per-customer
   * limits, computes the cents amount, and applies it as the order
   * discount. Cannot be combined with `orderDiscountCents`.
   */
  discountCode?: string;
  payments?: PaymentInput[];
}

interface RefundLine {
  saleLineId?: string;
  quantity?: number;
}

interface RefundBody {
  reason?: string | null;
  lines?: RefundLine[];
}

interface SaleListRow {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  customerId: string | null;
  associateUserId: string | null;
  locationId: string;
  completedAt: Date | null;
  createdAt: Date;
}

interface SaleLineRow {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
  refundedQuantity: number;
}

interface PaymentRow {
  id: string;
  method: string;
  amountCents: number;
  status: string;
  processor: string | null;
  processorRef: string | null;
  createdAt: Date;
}

interface RefundRow {
  id: string;
  amountCents: number;
  reason: string | null;
  createdAt: Date;
}

interface SaleDetail extends SaleListRow {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  notes: string | null;
  lines: SaleLineRow[];
  payments: PaymentRow[];
  refunds: RefundRow[];
}

@TenantScoped()
@Controller('v1')
export class SalesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(StripeService) private readonly stripe: StripeService,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
  ) {}

  /**
   * Variant lookup for the POS register. Matches an exact barcode first
   * (so a scan auto-resolves), then falls back to product name / SKU
   * substring search. Returns active variants only.
   */
  @Get('pos/lookup')
  @RequirePermission('pos.access')
  async lookup(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('q') q?: string,
    @Query('limit') limitStr?: string,
  ): Promise<LookupRow[]> {
    const query = (q ?? '').trim();
    if (!query) return [];
    const limit = clampLimit(limitStr, 25);

    // Exact barcode hit first — when the cashier scans, this is the
    // expected single-row result.
    const barcodeRows = await this.db
      .select({
        variantId: schema.productVariants.id,
        productId: schema.products.id,
        productName: schema.products.name,
        sku: schema.productVariants.sku,
        barcode: schema.productVariants.barcode,
        variantName: schema.productVariants.name,
        priceCents: schema.productVariants.priceCents,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.productVariants.barcode, query),
          eq(schema.productVariants.isActive, true),
          eq(schema.products.isActive, true),
        ),
      )
      .limit(limit);
    if (barcodeRows.length > 0) return barcodeRows;

    // Otherwise, ILIKE on name + SKU. We don't use the products
    // tsvector here because POS lookups are partial-prefix patterns
    // ("coke") and tsvector lemmatization could miss exact substrings.
    const pattern = `%${query.replace(/[%_]/g, '\\$&')}%`;
    return this.db
      .select({
        variantId: schema.productVariants.id,
        productId: schema.products.id,
        productName: schema.products.name,
        sku: schema.productVariants.sku,
        barcode: schema.productVariants.barcode,
        variantName: schema.productVariants.name,
        priceCents: schema.productVariants.priceCents,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.productVariants.isActive, true),
          eq(schema.products.isActive, true),
          sql`(${schema.products.name} ILIKE ${pattern} OR ${schema.productVariants.sku} ILIKE ${pattern})`,
        ),
      )
      .limit(limit);
  }

  /**
   * Lightweight location list for the POS register. Anyone with
   * `pos.access` can see active locations + their tax rates without
   * needing `locations.view` (which is reserved for the back-office
   * locations admin page).
   */
  @Get('pos/locations')
  @RequirePermission('pos.access')
  async posLocations(
    @CurrentTenant() _tenant: RequestTenantContext,
  ): Promise<{ id: string; name: string; taxRateBps: number | null }[]> {
    return this.db
      .select({
        id: schema.locations.id,
        name: schema.locations.name,
        taxRateBps: schema.locations.taxRateBps,
      })
      .from(schema.locations)
      .where(eq(schema.locations.isActive, true))
      .orderBy(schema.locations.name);
  }

  @Get('sales')
  @RequirePermission('sales.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('limit') limitStr?: string,
  ): Promise<SaleListRow[]> {
    const limit = clampLimit(limitStr, 50);
    return this.db
      .select({
        id: schema.sales.id,
        number: schema.sales.number,
        status: schema.sales.status,
        totalCents: schema.sales.totalCents,
        customerId: schema.sales.customerId,
        associateUserId: schema.sales.associateUserId,
        locationId: schema.sales.locationId,
        completedAt: schema.sales.completedAt,
        createdAt: schema.sales.createdAt,
      })
      .from(schema.sales)
      .orderBy(desc(schema.sales.createdAt))
      .limit(limit);
  }

  @Get('sales/:id')
  @RequirePermission('sales.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<SaleDetail> {
    const [sale] = await this.db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.id, id))
      .limit(1);
    if (!sale) throw new NotFoundException('Sale not found');

    const lines = await this.db
      .select()
      .from(schema.saleLines)
      .where(eq(schema.saleLines.saleId, id));

    const refundedByLine = await this.db
      .select({
        saleLineId: schema.refundLines.saleLineId,
        quantity: sql<number>`COALESCE(SUM(${schema.refundLines.quantity}), 0)::int`,
      })
      .from(schema.refundLines)
      .innerJoin(schema.refunds, eq(schema.refunds.id, schema.refundLines.refundId))
      .where(eq(schema.refunds.saleId, id))
      .groupBy(schema.refundLines.saleLineId);
    const refundedMap = new Map(refundedByLine.map((r) => [r.saleLineId, r.quantity]));

    const payments = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.saleId, id))
      .orderBy(schema.payments.createdAt);

    const refunds = await this.db
      .select()
      .from(schema.refunds)
      .where(eq(schema.refunds.saleId, id))
      .orderBy(desc(schema.refunds.createdAt));

    return {
      id: sale.id,
      number: sale.number,
      status: sale.status,
      totalCents: sale.totalCents,
      subtotalCents: sale.subtotalCents,
      discountCents: sale.discountCents,
      taxCents: sale.taxCents,
      customerId: sale.customerId,
      associateUserId: sale.associateUserId,
      locationId: sale.locationId,
      notes: sale.notes,
      completedAt: sale.completedAt,
      createdAt: sale.createdAt,
      lines: lines.map((l) => ({
        id: l.id,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        discountCents: l.discountCents,
        totalCents: l.totalCents,
        refundedQuantity: refundedMap.get(l.id) ?? 0,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        method: p.method,
        amountCents: p.amountCents,
        status: p.status,
        processor: p.processor,
        processorRef: p.processorRef,
        createdAt: p.createdAt,
      })),
      refunds: refunds.map((r) => ({
        id: r.id,
        amountCents: r.amountCents,
        reason: r.reason,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Complete a sale in one shot. The whole thing runs inside the
   * request's RLS transaction, so a failure mid-way (e.g. a payment
   * row insert failing) rolls everything back including the inventory
   * decrement.
   */
  @Post('sales')
  @RequirePermission('pos.transaction.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: CreateSaleBody,
  ): Promise<SaleDetail> {
    if (!body.locationId) throw new BadRequestException('locationId is required');
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    if (!body.payments || body.payments.length === 0) {
      throw new BadRequestException('payments must contain at least one entry');
    }

    // Resolve location + tax rate.
    const [location] = await this.db
      .select({
        id: schema.locations.id,
        taxRateBps: schema.locations.taxRateBps,
      })
      .from(schema.locations)
      .where(eq(schema.locations.id, body.locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    let taxRateBps = location.taxRateBps;
    if (taxRateBps == null) {
      const [biz] = await this.db
        .select({ defaultTaxRateBps: schema.businesses.defaultTaxRateBps })
        .from(schema.businesses)
        .where(eq(schema.businesses.id, tenant.businessId!))
        .limit(1);
      taxRateBps = biz?.defaultTaxRateBps ?? 0;
    }

    // Resolve every variant in one go.
    const variantIds = body.lines.map((l) => {
      if (!l.variantId) throw new BadRequestException('lines[].variantId is required');
      return l.variantId;
    });
    const variants = await this.db
      .select({
        id: schema.productVariants.id,
        productId: schema.productVariants.productId,
        sku: schema.productVariants.sku,
        priceCents: schema.productVariants.priceCents,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        // Per-product tax class override; null means "use the
        // location/business default rate".
        taxClassRateBps: schema.taxClasses.rateBps,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.taxClasses, eq(schema.taxClasses.id, schema.products.taxClassId))
      .where(inArray(schema.productVariants.id, variantIds));
    const byId = new Map(variants.map((v) => [v.id, v]));
    for (const id of variantIds) {
      if (!byId.has(id)) throw new NotFoundException(`Variant not found: ${id}`);
    }

    // Resolve a discount code if one was supplied. We compute the
    // cents amount up-front and pass it to computeTotals as the
    // order discount; the redemption row + usage increment land
    // after the sale is durable so a failed insert never burns a
    // code's remaining usage.
    let resolvedOrderDiscount = body.orderDiscountCents;
    let appliedDiscount: { id: string; amountCents: number } | null = null;
    if (body.discountCode) {
      if (body.orderDiscountCents) {
        throw new BadRequestException('cannot supply both discountCode and orderDiscountCents');
      }
      const codeText = body.discountCode.trim();
      if (!codeText) throw new BadRequestException('discountCode cannot be empty');

      const [code] = await this.db
        .select()
        .from(schema.discountCodes)
        .where(eq(schema.discountCodes.code, codeText))
        .limit(1);
      if (!code) throw new NotFoundException(`Discount code "${codeText}" not found`);
      if (!code.isActive) throw new BadRequestException('Discount code is inactive');
      const now = new Date();
      if (code.startsAt && code.startsAt.getTime() > now.getTime()) {
        throw new BadRequestException('Discount code is not yet valid');
      }
      if (code.endsAt && code.endsAt.getTime() < now.getTime()) {
        throw new BadRequestException('Discount code has expired');
      }
      if (code.usageLimit != null && code.usageCount >= code.usageLimit) {
        throw new BadRequestException('Discount code has reached its usage limit');
      }

      // Compute post-line-discount subtotal locally — it's what the
      // discount applies against. Mirrors the math in computeTotals.
      let postLineNet = 0;
      for (const l of body.lines) {
        const v = byId.get(l.variantId!)!;
        const unit = l.unitPriceCents ?? v.priceCents;
        const gross = l.quantity! * unit;
        const lineDisc = Math.min(l.lineDiscountCents ?? 0, gross);
        postLineNet += gross - lineDisc;
      }

      if (code.minSubtotalCents != null && postLineNet < code.minSubtotalCents) {
        throw new BadRequestException(
          `Discount code requires a subtotal of at least $${(code.minSubtotalCents / 100).toFixed(
            2,
          )}`,
        );
      }
      if (code.perCustomerLimit != null) {
        if (!body.customerId) {
          throw new BadRequestException(
            'Discount code requires an attached customer to enforce its per-customer limit',
          );
        }
        const prior = await this.db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(schema.discountRedemptions)
          .where(
            and(
              eq(schema.discountRedemptions.discountCodeId, code.id),
              eq(schema.discountRedemptions.customerId, body.customerId),
            ),
          );
        const used = prior[0]?.count ?? 0;
        if (used >= code.perCustomerLimit) {
          throw new BadRequestException(
            'Customer has reached the per-customer limit for this discount code',
          );
        }
      }

      const computedCents =
        code.kind === 'percent' ? Math.floor((postLineNet * code.value) / 10000) : code.value;
      resolvedOrderDiscount = Math.min(computedCents, postLineNet);
      appliedDiscount = { id: code.id, amountCents: resolvedOrderDiscount };
    }

    // Compute totals via the pure helper. Throws BadRequest on bad shape.
    const totals = (() => {
      try {
        return computeTotals({
          taxRateBps: taxRateBps!,
          orderDiscountCents: resolvedOrderDiscount,
          lines: body.lines.map((l) => {
            const v = byId.get(l.variantId!)!;
            const desc = [v.productName, v.variantName].filter(Boolean).join(' — ');
            return {
              variantId: v.id,
              description: desc,
              quantity: l.quantity!,
              unitPriceCents: l.unitPriceCents ?? v.priceCents,
              lineDiscountCents: l.lineDiscountCents,
              // Tax-class override; falls through to the sale-level
              // taxRateBps inside computeTotals when this is null.
              taxRateBps: v.taxClassRateBps ?? undefined,
            };
          }),
        });
      } catch (e) {
        throw new BadRequestException(e instanceof Error ? e.message : String(e));
      }
    })();

    // Validate payments cover the total exactly.
    const paymentSum = body.payments.reduce((s, p) => s + (p.amountCents ?? 0), 0);
    if (paymentSum !== totals.totalCents) {
      throw new BadRequestException(
        `payments sum (${paymentSum}) must equal total (${totals.totalCents})`,
      );
    }
    for (const p of body.payments) {
      if (p.method !== 'cash' && p.method !== 'card') {
        throw new BadRequestException("payments[].method must be 'cash' or 'card'");
      }
      if (
        typeof p.amountCents !== 'number' ||
        !Number.isInteger(p.amountCents) ||
        p.amountCents <= 0
      ) {
        throw new BadRequestException('payments[].amountCents must be a positive integer');
      }
    }

    // For card payments that supply a Stripe PaymentMethod id, charge
    // the merchant's connected Stripe account BEFORE writing the sale.
    // If any charge fails, no sale row is written. If a card line has
    // no `stripePaymentMethodId`, fall back to the manual capture path
    // (used in dev/test or by businesses that haven't connected
    // Stripe).
    const cardPayments = body.payments.filter((p) => p.method === 'card');
    const stripeCardPayments = cardPayments.filter((p) => Boolean(p.stripePaymentMethodId));
    let merchantStripeAccountId: string | null = null;
    if (stripeCardPayments.length > 0) {
      const [merchant] = await this.db
        .select({
          stripeAccountId: schema.merchantStripeAccounts.stripeAccountId,
          chargesEnabled: schema.merchantStripeAccounts.chargesEnabled,
          disconnectedAt: schema.merchantStripeAccounts.disconnectedAt,
        })
        .from(schema.merchantStripeAccounts)
        .where(eq(schema.merchantStripeAccounts.businessId, tenant.businessId!))
        .limit(1);
      if (!merchant || merchant.disconnectedAt) {
        throw new BadRequestException(
          'Stripe is not connected for this business. Connect via Settings → Billing.',
        );
      }
      if (!merchant.chargesEnabled) {
        throw new BadRequestException(
          'Connected Stripe account cannot accept charges yet. Finish onboarding in Stripe.',
        );
      }
      merchantStripeAccountId = merchant.stripeAccountId;
    }

    const chargeResults: Map<number, { paymentIntentId: string }> = new Map();
    if (merchantStripeAccountId) {
      for (let i = 0; i < body.payments.length; i++) {
        const p = body.payments[i]!;
        if (p.method !== 'card' || !p.stripePaymentMethodId) continue;
        const charge = await this.stripe.chargeCard({
          stripeAccountId: merchantStripeAccountId,
          amountCents: p.amountCents!,
          currency: 'usd',
          paymentMethodId: p.stripePaymentMethodId,
          description: `Sale at ${tenant.businessId!.slice(0, 8)}`,
          metadata: { businessId: tenant.businessId!, locationId: body.locationId },
        });
        if (charge.status !== 'succeeded') {
          throw new BadRequestException(
            `Card payment ${i} failed: status ${charge.status}. The sale was not recorded.`,
          );
        }
        chargeResults.set(i, { paymentIntentId: charge.paymentIntentId });
      }
    }

    // Generate a sale number with retry on uniqueness conflicts.
    const number = await this.generateSaleNumber(tenant.businessId!);

    // Insert the sale row.
    const [sale] = await this.db
      .insert(schema.sales)
      .values({
        businessId: tenant.businessId!,
        locationId: body.locationId,
        number,
        status: 'completed',
        customerId: body.customerId ?? null,
        associateUserId: actor.id,
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        notes: body.notes ?? null,
        completedAt: new Date(),
      })
      .returning();
    if (!sale) throw new BadRequestException('failed to create sale');

    // Sale lines.
    const insertedLines = await this.db
      .insert(schema.saleLines)
      .values(
        totals.lines.map((l) => ({
          businessId: tenant.businessId!,
          saleId: sale.id,
          variantId: l.variantId,
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          discountCents: l.discountCents,
          taxCents: l.taxCents,
          totalCents: l.totalCents,
        })),
      )
      .returning();

    // Payments. Card payments charged via Stripe carry the
    // PaymentIntent id in `processor_ref`; legacy/manual cards keep
    // their processor='manual' identity for backwards compatibility.
    const insertedPayments = await this.db
      .insert(schema.payments)
      .values(
        body.payments.map((p, i) => {
          const charge = chargeResults.get(i);
          return {
            businessId: tenant.businessId!,
            saleId: sale.id,
            method: p.method!,
            amountCents: p.amountCents!,
            processor: p.method === 'card' ? (charge ? 'stripe' : 'manual') : null,
            processorRef: charge?.paymentIntentId ?? p.processorRef ?? null,
            status: 'succeeded',
          };
        }),
      )
      .returning();

    // Inventory: one movement per line + level decrement.
    for (const l of totals.lines) {
      await this.db.insert(schema.inventoryMovements).values({
        businessId: tenant.businessId!,
        variantId: l.variantId,
        locationId: body.locationId,
        delta: -l.quantity,
        reason: 'sale',
        referenceType: 'sale',
        referenceId: sale.id,
        actorUserId: actor.id,
        notes: null,
      });
      await this.db
        .insert(schema.inventoryLevels)
        .values({
          businessId: tenant.businessId!,
          variantId: l.variantId,
          locationId: body.locationId,
          onHand: 0,
        })
        .onConflictDoUpdate({
          target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
          set: {
            onHand: sql`GREATEST(0, ${schema.inventoryLevels.onHand} - ${l.quantity})`,
            updatedAt: new Date(),
          },
        });
    }

    // If a discount code was applied, log the redemption + bump
    // usage_count. Done after the sale is durable so a failed sale
    // never burns a redemption.
    if (appliedDiscount) {
      await this.db.insert(schema.discountRedemptions).values({
        businessId: tenant.businessId!,
        discountCodeId: appliedDiscount.id,
        saleId: sale.id,
        customerId: sale.customerId,
        amountCents: appliedDiscount.amountCents,
      });
      await this.db
        .update(schema.discountCodes)
        .set({
          usageCount: sql`${schema.discountCodes.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.discountCodes.id, appliedDiscount.id));
    }

    await this.audit.log({
      action: 'sale.complete',
      targetType: 'sale',
      targetId: sale.id,
      after: {
        number: sale.number,
        totalCents: sale.totalCents,
        lineCount: totals.lines.length,
        customerId: sale.customerId,
        discountCodeId: appliedDiscount?.id ?? null,
        discountAmountCents: appliedDiscount?.amountCents ?? 0,
      },
    });

    // Fire-and-forget outbound webhook. We capture the businessId
    // up-front because the request-scoped tenant context will be
    // gone by the time the dispatcher runs.
    void this.webhooks.fire({
      businessId: tenant.businessId!,
      eventType: 'sale.created',
      payload: {
        saleId: sale.id,
        number: sale.number,
        totalCents: sale.totalCents,
        subtotalCents: sale.subtotalCents,
        discountCents: sale.discountCents,
        taxCents: sale.taxCents,
        customerId: sale.customerId,
        locationId: sale.locationId,
        completedAt: sale.completedAt,
      },
    });

    return {
      id: sale.id,
      number: sale.number,
      status: sale.status,
      totalCents: sale.totalCents,
      subtotalCents: sale.subtotalCents,
      discountCents: sale.discountCents,
      taxCents: sale.taxCents,
      customerId: sale.customerId,
      associateUserId: sale.associateUserId,
      locationId: sale.locationId,
      notes: sale.notes,
      completedAt: sale.completedAt,
      createdAt: sale.createdAt,
      lines: insertedLines.map((l) => ({
        id: l.id,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        unitPriceCents: l.unitPriceCents,
        discountCents: l.discountCents,
        totalCents: l.totalCents,
        refundedQuantity: 0,
      })),
      payments: insertedPayments.map((p) => ({
        id: p.id,
        method: p.method,
        amountCents: p.amountCents,
        status: p.status,
        processor: p.processor,
        processorRef: p.processorRef,
        createdAt: p.createdAt,
      })),
      refunds: [],
    };
  }

  @Post('sales/:id/refund')
  @RequirePermission('pos.refund.create')
  async refund(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: RefundBody,
  ): Promise<{ refundId: string; amountCents: number; saleStatus: string }> {
    const [sale] = await this.db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.id, id))
      .limit(1);
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== 'completed' && sale.status !== 'partially_refunded') {
      throw new ForbiddenException(`cannot refund a sale in status ${sale.status}`);
    }
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }

    const saleLines = await this.db
      .select()
      .from(schema.saleLines)
      .where(eq(schema.saleLines.saleId, id));
    const lineById = new Map(saleLines.map((l) => [l.id, l]));

    // Tally previously-refunded quantities per line so we can enforce
    // that we never refund more units than were sold.
    const priorRefunded = await this.db
      .select({
        saleLineId: schema.refundLines.saleLineId,
        quantity: sql<number>`COALESCE(SUM(${schema.refundLines.quantity}), 0)::int`,
      })
      .from(schema.refundLines)
      .innerJoin(schema.refunds, eq(schema.refunds.id, schema.refundLines.refundId))
      .where(eq(schema.refunds.saleId, id))
      .groupBy(schema.refundLines.saleLineId);
    const priorMap = new Map(priorRefunded.map((r) => [r.saleLineId, r.quantity]));

    let amountCents = 0;
    const validated: { line: (typeof saleLines)[number]; quantity: number; perUnit: number }[] = [];
    for (const r of body.lines) {
      if (!r.saleLineId) throw new BadRequestException('lines[].saleLineId is required');
      const line = lineById.get(r.saleLineId);
      if (!line) throw new NotFoundException(`sale line not found: ${r.saleLineId}`);
      if (typeof r.quantity !== 'number' || !Number.isInteger(r.quantity) || r.quantity <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      const already = priorMap.get(line.id) ?? 0;
      if (already + r.quantity > line.quantity) {
        throw new BadRequestException(
          `cannot refund ${r.quantity} units of line ${line.id}: only ${line.quantity - already} remaining`,
        );
      }
      const perUnit = refundUnitCents(line);
      validated.push({ line, quantity: r.quantity, perUnit });
      amountCents += perUnit * r.quantity;
    }

    // If the sale was paid (in part) on a Stripe-charged card, reverse
    // the matching PaymentIntent on the merchant's connected account
    // before we record any refund rows. Allocate the refund amount to
    // Stripe-backed payments first; if the original tender was cash or
    // legacy/manual card, the refund is bookkeeping-only (cashier
    // hands cash back from the drawer).
    const allPayments = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.saleId, id))
      .orderBy(schema.payments.createdAt);

    const stripePayments = allPayments.filter((p) => p.processor === 'stripe' && p.processorRef);
    if (stripePayments.length > 0) {
      const [merchant] = await this.db
        .select({ stripeAccountId: schema.merchantStripeAccounts.stripeAccountId })
        .from(schema.merchantStripeAccounts)
        .where(eq(schema.merchantStripeAccounts.businessId, tenant.businessId!))
        .limit(1);
      if (!merchant) {
        throw new BadRequestException(
          'Sale was paid via Stripe but merchant account is no longer connected; reconnect Stripe before issuing the refund.',
        );
      }
      let remaining = amountCents;
      for (const p of stripePayments) {
        if (remaining <= 0) break;
        const refundable = Math.min(remaining, p.amountCents);
        await this.stripe.refundCharge({
          stripeAccountId: merchant.stripeAccountId,
          paymentIntentId: p.processorRef!,
          amountCents: refundable,
          reason: body.reason ?? undefined,
          metadata: { saleId: id, businessId: tenant.businessId! },
        });
        remaining -= refundable;
      }
    }

    // Insert the refund header.
    const [refund] = await this.db
      .insert(schema.refunds)
      .values({
        businessId: tenant.businessId!,
        saleId: id,
        reason: body.reason ?? null,
        amountCents,
        approvedByUserId: actor.id,
      })
      .returning();
    if (!refund) throw new BadRequestException('failed to create refund');

    // Insert refund lines + restore inventory.
    for (const v of validated) {
      await this.db.insert(schema.refundLines).values({
        businessId: tenant.businessId!,
        refundId: refund.id,
        saleLineId: v.line.id,
        variantId: v.line.variantId,
        quantity: v.quantity,
        amountCents: v.perUnit * v.quantity,
      });

      if (v.line.variantId) {
        await this.db.insert(schema.inventoryMovements).values({
          businessId: tenant.businessId!,
          variantId: v.line.variantId,
          locationId: sale.locationId,
          delta: v.quantity,
          reason: 'refund',
          referenceType: 'refund',
          referenceId: refund.id,
          actorUserId: actor.id,
          notes: null,
        });
        await this.db
          .insert(schema.inventoryLevels)
          .values({
            businessId: tenant.businessId!,
            variantId: v.line.variantId,
            locationId: sale.locationId,
            onHand: v.quantity,
          })
          .onConflictDoUpdate({
            target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
            set: {
              onHand: sql`${schema.inventoryLevels.onHand} + ${v.quantity}`,
              updatedAt: new Date(),
            },
          });
      }
    }

    // Compute new sale status: all lines fully refunded → 'refunded';
    // otherwise 'partially_refunded'.
    const totalSoldUnits = saleLines.reduce((s, l) => s + l.quantity, 0);
    const totalRefundedUnits =
      [...priorMap.values()].reduce((s, q) => s + q, 0) +
      validated.reduce((s, v) => s + v.quantity, 0);
    const nextStatus = totalRefundedUnits >= totalSoldUnits ? 'refunded' : 'partially_refunded';
    await this.db.update(schema.sales).set({ status: nextStatus }).where(eq(schema.sales.id, id));

    await this.audit.log({
      action: 'sale.refund',
      targetType: 'sale',
      targetId: id,
      after: {
        refundId: refund.id,
        amountCents,
        lineCount: validated.length,
        reason: body.reason ?? null,
      },
    });

    void this.webhooks.fire({
      businessId: tenant.businessId!,
      eventType: 'sale.refunded',
      payload: {
        saleId: id,
        refundId: refund.id,
        amountCents,
        saleStatus: nextStatus,
        reason: body.reason ?? null,
      },
    });

    return { refundId: refund.id, amountCents, saleStatus: nextStatus };
  }

  /**
   * Generate a per-business, per-year sequential sale number. Counts
   * the sales already written this year and increments. Retries up to
   * 5 times if a concurrent insert wins the race for the same number.
   */
  private async generateSaleNumber(businessId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this.db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(schema.sales)
        .where(
          and(
            eq(schema.sales.businessId, businessId),
            sql`${schema.sales.number} LIKE ${`INV-${year}-%`}`,
          ),
        );
      const count = rows[0]?.count ?? 0;
      const seq = count + 1 + attempt;
      const candidate = `INV-${year}-${String(seq).padStart(6, '0')}`;
      const [existing] = await this.db
        .select({ id: schema.sales.id })
        .from(schema.sales)
        .where(and(eq(schema.sales.businessId, businessId), eq(schema.sales.number, candidate)))
        .limit(1);
      if (!existing) return candidate;
    }
    // Fall back to a randomized suffix if 5 sequential candidates all
    // collided (extremely unlikely outside a hot test loop).
    return `INV-${year}-${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }
}

function clampLimit(raw: string | undefined, def: number): number {
  const n = Number(raw ?? String(def));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}
