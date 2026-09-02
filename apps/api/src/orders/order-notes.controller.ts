import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { salesScopeCond } from '../common/sales-scope';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

export interface OrderNoteRow {
  id: string;
  body: string;
  createdAt: Date;
  authorMembershipId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  /** True when the signed-in member wrote it. */
  mine: boolean;
}

const MAX_BODY = 4000;

/**
 * Order notes (owner ask 2026-09-01): a running conversation on the
 * order that every member who can see the order can read and add to —
 * gated on `orders.view`, the one permission every selling, warehouse
 * and money role holds. Append-only: a note is a record of what was
 * said, so there is no edit or delete; the audit log carries each add.
 */
@TenantScoped()
@Controller('v1/orders/:id/notes')
export class OrderNotesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('orders.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<OrderNoteRow[]> {
    await this.requireOrder(tenant, id);
    const rows = await this.db
      .select({
        id: schema.orderNotes.id,
        body: schema.orderNotes.body,
        createdAt: schema.orderNotes.createdAt,
        authorMembershipId: schema.orderNotes.authorMembershipId,
        authorName: schema.users.name,
        authorEmail: schema.users.email,
      })
      .from(schema.orderNotes)
      .leftJoin(schema.memberships, eq(schema.memberships.id, schema.orderNotes.authorMembershipId))
      .leftJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(eq(schema.orderNotes.orderId, id))
      .orderBy(desc(schema.orderNotes.createdAt))
      .limit(500);
    return rows.map((r) => ({
      ...r,
      authorName: r.authorName ?? null,
      authorEmail: r.authorEmail ?? null,
      mine: r.authorMembershipId != null && r.authorMembershipId === tenant.membershipId,
    }));
  }

  @Post()
  @RequirePermission('orders.view')
  async add(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: { body?: string },
  ): Promise<OrderNoteRow> {
    const order = await this.requireOrder(tenant, id);
    const text = (body?.body ?? '').trim();
    if (!text) throw new BadRequestException('Write something before saving the note');
    if (text.length > MAX_BODY) {
      throw new BadRequestException(`A note can be at most ${MAX_BODY} characters`);
    }
    const [note] = await this.db
      .insert(schema.orderNotes)
      .values({
        businessId: tenant.businessId!,
        orderId: id,
        authorMembershipId: tenant.membershipId ?? null,
        body: text,
      })
      .returning();
    await this.audit.log({
      action: 'order.note.add',
      targetType: 'order',
      targetId: id,
      after: { number: order.number, noteId: note!.id, preview: text.slice(0, 120) },
    });
    const [me] = tenant.userId
      ? await this.db
          .select({ name: schema.users.name, email: schema.users.email })
          .from(schema.users)
          .where(eq(schema.users.id, tenant.userId))
          .limit(1)
      : [];
    return {
      id: note!.id,
      body: note!.body,
      createdAt: note!.createdAt,
      authorMembershipId: note!.authorMembershipId,
      authorName: me?.name ?? null,
      authorEmail: me?.email ?? null,
      mine: note!.authorMembershipId != null,
    };
  }

  /** The order must exist and be inside the member's store scope. */
  private async requireOrder(tenant: RequestTenantContext, id: string) {
    const [order] = await this.db
      .select({ id: schema.orders.id, number: schema.orders.number })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.businessId, tenant.businessId!),
          eq(schema.orders.id, id),
          salesScopeCond(tenant, schema.orders.locationId),
        ),
      )
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
