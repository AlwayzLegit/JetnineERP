import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface CreateInvoiceBody {
  vendorId?: string;
  /** The vendor's own invoice number. */
  number?: string;
  invoiceDate?: string;
  totalCents?: number;
  /** Our PO number to match against; omitted → auto-match is attempted anyway. */
  poNumber?: string;
  notes?: string | null;
}

interface InvoiceRow {
  id: string;
  vendorId: string;
  vendorName: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  poSubtotalCents: number | null;
  /** invoice total − PO subtotal; null while unmatched. */
  varianceCents: number | null;
  number: string;
  invoiceDate: string | null;
  totalCents: number;
  status: string;
  notes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
}

/**
 * Vendor-invoice matching (PLAN-POS-OPERATIONS §6): record the vendor's
 * bill, auto-match it to our PO by PO number, surface the variance, and
 * approve. No landed-cost allocation in v1 — the variance is shown, not
 * spread across lines. There is no approval queue (§13): approval is a
 * one-click action from the PO page.
 */
@TenantScoped()
@Controller('v1/vendor-invoices')
export class VendorInvoicesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('purchase_orders.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('status') status?: string,
    @Query('purchaseOrderId') purchaseOrderId?: string,
  ): Promise<InvoiceRow[]> {
    const filters = [];
    if (status) filters.push(eq(schema.vendorInvoices.status, status));
    if (purchaseOrderId) {
      filters.push(eq(schema.vendorInvoices.purchaseOrderId, purchaseOrderId));
    }
    const rows = await this.db
      .select(this.rowSelect())
      .from(schema.vendorInvoices)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.vendorInvoices.vendorId))
      .leftJoin(
        schema.purchaseOrders,
        eq(schema.purchaseOrders.id, schema.vendorInvoices.purchaseOrderId),
      )
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(schema.vendorInvoices.createdAt))
      .limit(200);
    return rows.map(toRow);
  }

  /**
   * Record a vendor invoice. Matching is automatic: an explicit
   * `poNumber` is looked up directly; otherwise the newest open PO for
   * the vendor whose subtotal equals the invoice total is taken. A
   * match sets status 'matched'; no match leaves it 'unmatched' for a
   * human to resolve (re-record with the right PO number).
   */
  @Post()
  @RequirePermission('vendor_invoices.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateInvoiceBody,
  ): Promise<InvoiceRow> {
    if (!body.vendorId) throw new BadRequestException('vendorId is required');
    if (!body.number?.trim()) throw new BadRequestException('number is required');
    if (!Number.isInteger(body.totalCents) || (body.totalCents ?? -1) < 0) {
      throw new BadRequestException('totalCents must be a non-negative integer');
    }
    const [vendor] = await this.db
      .select({ id: schema.vendors.id })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, body.vendorId))
      .limit(1);
    if (!vendor) throw new NotFoundException('Vendor not found');

    let matchedPoId: string | null = null;
    if (body.poNumber?.trim()) {
      const [po] = await this.db
        .select({ id: schema.purchaseOrders.id, vendorId: schema.purchaseOrders.vendorId })
        .from(schema.purchaseOrders)
        .where(eq(schema.purchaseOrders.number, body.poNumber.trim()))
        .limit(1);
      if (!po) throw new NotFoundException(`No purchase order numbered ${body.poNumber.trim()}`);
      if (po.vendorId !== body.vendorId) {
        throw new BadRequestException('That purchase order belongs to a different vendor');
      }
      matchedPoId = po.id;
    } else {
      const [candidate] = await this.db
        .select({ id: schema.purchaseOrders.id })
        .from(schema.purchaseOrders)
        .where(
          and(
            eq(schema.purchaseOrders.vendorId, body.vendorId),
            eq(schema.purchaseOrders.subtotalCents, body.totalCents!),
          ),
        )
        .orderBy(desc(schema.purchaseOrders.createdAt))
        .limit(1);
      matchedPoId = candidate?.id ?? null;
    }

    const invoiceDate =
      body.invoiceDate && !Number.isNaN(new Date(body.invoiceDate).getTime())
        ? body.invoiceDate
        : null;

    let inserted: typeof schema.vendorInvoices.$inferSelect | undefined;
    try {
      [inserted] = await this.db
        .insert(schema.vendorInvoices)
        .values({
          businessId: tenant.businessId!,
          vendorId: body.vendorId,
          purchaseOrderId: matchedPoId,
          number: body.number.trim(),
          invoiceDate,
          totalCents: body.totalCents!,
          status: matchedPoId ? 'matched' : 'unmatched',
          matchedAt: matchedPoId ? new Date() : null,
          notes: body.notes ?? null,
        })
        .returning();
    } catch (err) {
      // The unique-violation may be wrapped (drizzle → postgres.js), so
      // walk the cause chain for the constraint name or SQLSTATE 23505.
      let cursor: unknown = err;
      for (let depth = 0; cursor && depth < 5; depth++) {
        const e = cursor as { message?: string; code?: string; cause?: unknown };
        if (
          e.code === '23505' ||
          (typeof e.message === 'string' &&
            e.message.includes('vendor_invoices_vendor_number_unique'))
        ) {
          throw new ConflictException(
            `Invoice ${body.number.trim()} is already recorded for this vendor`,
          );
        }
        cursor = e.cause;
      }
      throw err;
    }
    if (!inserted) throw new BadRequestException('failed to record invoice');

    await this.audit.log({
      action: 'vendor_invoice.create',
      targetType: 'vendor_invoice',
      targetId: inserted.id,
      after: {
        number: inserted.number,
        vendorId: inserted.vendorId,
        totalCents: inserted.totalCents,
        status: inserted.status,
        purchaseOrderId: matchedPoId,
      },
    });
    return this.load(inserted.id);
  }

  /** Approve a matched invoice — the §6 sign-off that the bill is payable. */
  @Post(':id/approve')
  @RequirePermission('vendor_invoices.manage')
  async approve(
    @CurrentTenant() _tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<InvoiceRow> {
    const invoice = await this.load(id);
    if (invoice.status === 'approved') {
      throw new BadRequestException('Invoice is already approved');
    }
    if (invoice.status !== 'matched') {
      throw new BadRequestException('Match the invoice to a purchase order before approving');
    }
    await this.db
      .update(schema.vendorInvoices)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedByUserId: actor.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.vendorInvoices.id, id));

    await this.audit.log({
      action: 'vendor_invoice.approve',
      targetType: 'vendor_invoice',
      targetId: id,
      after: {
        number: invoice.number,
        totalCents: invoice.totalCents,
        varianceCents: invoice.varianceCents,
      },
    });
    return this.load(id);
  }

  private rowSelect() {
    return {
      id: schema.vendorInvoices.id,
      vendorId: schema.vendorInvoices.vendorId,
      vendorName: schema.vendors.name,
      purchaseOrderId: schema.vendorInvoices.purchaseOrderId,
      poNumber: schema.purchaseOrders.number,
      poSubtotalCents: schema.purchaseOrders.subtotalCents,
      number: schema.vendorInvoices.number,
      invoiceDate: schema.vendorInvoices.invoiceDate,
      totalCents: schema.vendorInvoices.totalCents,
      status: schema.vendorInvoices.status,
      notes: schema.vendorInvoices.notes,
      approvedAt: schema.vendorInvoices.approvedAt,
      createdAt: schema.vendorInvoices.createdAt,
    };
  }

  private async load(id: string): Promise<InvoiceRow> {
    const [row] = await this.db
      .select(this.rowSelect())
      .from(schema.vendorInvoices)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.vendorInvoices.vendorId))
      .leftJoin(
        schema.purchaseOrders,
        eq(schema.purchaseOrders.id, schema.vendorInvoices.purchaseOrderId),
      )
      .where(eq(schema.vendorInvoices.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Vendor invoice not found');
    return toRow(row);
  }
}

function toRow(r: {
  id: string;
  vendorId: string;
  vendorName: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  poSubtotalCents: number | null;
  number: string;
  invoiceDate: string | null;
  totalCents: number;
  status: string;
  notes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
}): InvoiceRow {
  return {
    ...r,
    varianceCents: r.poSubtotalCents == null ? null : r.totalCents - r.poSubtotalCents,
  };
}
