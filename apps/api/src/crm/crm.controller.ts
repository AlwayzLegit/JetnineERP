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
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface TimelineEvent {
  at: Date | string;
  type: string;
  label: string;
  refId: string;
  amountCents?: number;
}

/**
 * CRM-lite (STORIS cutover P1): notes and tags on a customer, and the
 * timeline — a read-model merge of everything that ever happened with
 * them (sales, orders, deliveries, service, plan payments, notes). No
 * event table; the documents ARE the history.
 */
@TenantScoped()
@Controller('v1')
export class CrmController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  // --- Notes ---

  @Get('customers/:id/notes')
  @RequirePermission('customers.view')
  async listNotes(@CurrentTenant() _tenant: RequestTenantContext, @Param('id') id: string) {
    return this.db
      .select()
      .from(schema.customerNotes)
      .where(eq(schema.customerNotes.customerId, id))
      .orderBy(desc(schema.customerNotes.createdAt))
      .limit(200);
  }

  @Post('customers/:id/notes')
  @RequirePermission('customers.update')
  async addNote(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: { body?: string },
  ) {
    if (!body.body?.trim()) throw new BadRequestException('body is required');
    await this.assertCustomer(id);
    const [note] = await this.db
      .insert(schema.customerNotes)
      .values({ businessId: tenant.businessId!, customerId: id, body: body.body.trim() })
      .returning();
    return note;
  }

  @Delete('customers/:id/notes/:noteId')
  @RequirePermission('customers.update')
  async deleteNote(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    await this.db
      .delete(schema.customerNotes)
      .where(and(eq(schema.customerNotes.id, noteId), eq(schema.customerNotes.customerId, id)));
    return { ok: true };
  }

  // --- Tags ---

  @Get('customer-tags')
  @RequirePermission('customers.view')
  async listTags(@CurrentTenant() _tenant: RequestTenantContext) {
    return this.db.select().from(schema.customerTags).limit(200);
  }

  @Post('customer-tags')
  @RequirePermission('customers.update')
  async createTag(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { name?: string; color?: string },
  ) {
    if (!body.name?.trim()) throw new BadRequestException('name is required');
    const [tag] = await this.db
      .insert(schema.customerTags)
      .values({ businessId: tenant.businessId!, name: body.name.trim(), color: body.color ?? null })
      .onConflictDoNothing()
      .returning();
    if (!tag) throw new BadRequestException('A tag with that name already exists');
    return tag;
  }

  @Post('customers/:id/tags/:tagId')
  @RequirePermission('customers.update')
  async attachTag(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    await this.assertCustomer(id);
    const [tag] = await this.db
      .select({ id: schema.customerTags.id })
      .from(schema.customerTags)
      .where(eq(schema.customerTags.id, tagId))
      .limit(1);
    if (!tag) throw new NotFoundException('Tag not found');
    await this.db
      .insert(schema.customerTagLinks)
      .values({ businessId: tenant.businessId!, customerId: id, tagId })
      .onConflictDoNothing();
    return { ok: true };
  }

  @Delete('customers/:id/tags/:tagId')
  @RequirePermission('customers.update')
  async detachTag(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Param('tagId') tagId: string,
  ) {
    await this.db
      .delete(schema.customerTagLinks)
      .where(
        and(eq(schema.customerTagLinks.customerId, id), eq(schema.customerTagLinks.tagId, tagId)),
      );
    return { ok: true };
  }

  @Get('customers/:id/tags')
  @RequirePermission('customers.view')
  async customerTags(@CurrentTenant() _tenant: RequestTenantContext, @Param('id') id: string) {
    const links = await this.db
      .select({ tagId: schema.customerTagLinks.tagId })
      .from(schema.customerTagLinks)
      .where(eq(schema.customerTagLinks.customerId, id));
    if (links.length === 0) return [];
    return this.db
      .select()
      .from(schema.customerTags)
      .where(
        inArray(
          schema.customerTags.id,
          links.map((l) => l.tagId),
        ),
      );
  }

  // --- Timeline ---

  /** Everything that ever happened with this customer, newest first. */
  @Get('customers/:id/timeline')
  @RequirePermission('customers.view')
  async timeline(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<TimelineEvent[]> {
    await this.assertCustomer(id);
    const events: TimelineEvent[] = [];

    const sales = await this.db
      .select({
        id: schema.sales.id,
        number: schema.sales.number,
        totalCents: schema.sales.totalCents,
        at: schema.sales.completedAt,
        status: schema.sales.status,
      })
      .from(schema.sales)
      .where(eq(schema.sales.customerId, id))
      .limit(100);
    for (const s of sales) {
      events.push({
        at: s.at ?? new Date(0),
        type: 'sale',
        label: `Sale ${s.number} (${s.status})`,
        refId: s.id,
        amountCents: s.totalCents,
      });
    }

    const orders = await this.db
      .select({
        id: schema.orders.id,
        number: schema.orders.number,
        totalCents: schema.orders.totalCents,
        at: schema.orders.createdAt,
        status: schema.orders.status,
      })
      .from(schema.orders)
      .where(eq(schema.orders.customerId, id))
      .limit(100);
    const orderIds = orders.map((o) => o.id);
    for (const o of orders) {
      events.push({
        at: o.at,
        type: 'order',
        label: `Order ${o.number} (${o.status})`,
        refId: o.id,
        amountCents: o.totalCents,
      });
    }

    if (orderIds.length > 0) {
      const deliveries = await this.db
        .select({
          id: schema.deliveries.id,
          at: schema.deliveries.createdAt,
          status: schema.deliveries.status,
          scheduledDate: schema.deliveries.scheduledDate,
        })
        .from(schema.deliveries)
        .where(inArray(schema.deliveries.orderId, orderIds))
        .limit(100);
      for (const d of deliveries) {
        events.push({
          at: d.at,
          type: 'delivery',
          label: `Delivery ${d.scheduledDate} (${d.status})`,
          refId: d.id,
        });
      }

      const payments = await this.db
        .select({
          id: schema.payments.id,
          at: schema.payments.createdAt,
          amountCents: schema.payments.amountCents,
          kind: schema.payments.kind,
          method: schema.payments.method,
          orderId: schema.payments.orderId,
        })
        .from(schema.payments)
        .where(
          and(inArray(schema.payments.orderId, orderIds), eq(schema.payments.status, 'succeeded')),
        )
        .limit(200);
      for (const p of payments) {
        events.push({
          at: p.at,
          type: 'payment',
          label: `${p.kind} payment (${p.method})`,
          refId: p.orderId ?? p.id,
          amountCents: p.amountCents,
        });
      }
    }

    const tickets = await this.db
      .select({
        id: schema.serviceOrders.id,
        number: schema.serviceOrders.number,
        at: schema.serviceOrders.createdAt,
        status: schema.serviceOrders.status,
      })
      .from(schema.serviceOrders)
      .where(eq(schema.serviceOrders.customerId, id))
      .limit(100);
    for (const t of tickets) {
      events.push({
        at: t.at,
        type: 'service',
        label: `Service ${t.number} (${t.status})`,
        refId: t.id,
      });
    }

    const notes = await this.db
      .select()
      .from(schema.customerNotes)
      .where(eq(schema.customerNotes.customerId, id))
      .limit(100);
    for (const n of notes) {
      events.push({ at: n.createdAt, type: 'note', label: n.body, refId: n.id });
    }

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  private async assertCustomer(id: string): Promise<void> {
    const [c] = await this.db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    if (!c) throw new NotFoundException('Customer not found');
  }
}
