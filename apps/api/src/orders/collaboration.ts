import { and, eq, inArray, lt, ne, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import type { OrderTeamMember } from '@jetnine/shared';

/** Match the same effective permission and fail-closed store scope as TenancyGuard. */
export async function orderTeam(
  db: PostgresJsDatabase,
  businessId: string,
  locationId: string,
): Promise<OrderTeamMember[]> {
  const m = schema.memberships;
  return db
    .select({
      id: m.id,
      name: sql<string>`coalesce(nullif(${schema.users.name}, ''), ${schema.users.email})`,
      roleName: schema.roles.name,
    })
    .from(m)
    .innerJoin(schema.users, eq(schema.users.id, m.userId))
    .innerJoin(schema.roles, eq(schema.roles.id, m.roleId))
    .where(
      and(
        eq(m.businessId, businessId),
        eq(m.status, 'active'),
        sql`coalesce((select mpo.allowed from membership_permission_overrides mpo
        where mpo.business_id = ${businessId} and mpo.membership_id = ${m.id} and mpo.permission = 'orders.view'),
        exists(select 1 from role_permissions rp where rp.role_id = ${m.roleId} and rp.permission = 'orders.view'))`,
        sql`(${m.dataScope} = 'all' or (${m.dataScope} = 'store' and exists(
        select 1 from membership_location_scopes mls where mls.business_id = ${businessId}
        and mls.membership_id = ${m.id} and mls.location_id = ${locationId})))`,
      ),
    )
    .orderBy(schema.users.name);
}

export async function notifyMembers(
  db: PostgresJsDatabase,
  input: {
    businessId: string;
    orderId: string;
    locationId: string;
    recipients: (string | null)[];
    actorMembershipId?: string | null;
    eventKey: string;
    kind: string;
    title: string;
    message?: string;
    taskId?: string;
    noteId?: string;
  },
) {
  const ids = new Set(
    input.recipients.filter((id): id is string => !!id && id !== input.actorMembershipId),
  );
  if (!ids.size) return 0;
  const team = await orderTeam(db, input.businessId, input.locationId);
  const recipients = team.filter((m) => ids.has(m.id));
  if (!recipients.length) return 0;
  const inserted = await db
    .insert(schema.memberNotifications)
    .values(
      recipients.map((m) => ({
        businessId: input.businessId,
        recipientMembershipId: m.id,
        actorMembershipId: input.actorMembershipId ?? null,
        orderId: input.orderId,
        taskId: input.taskId ?? null,
        noteId: input.noteId ?? null,
        eventKey: input.eventKey,
        kind: input.kind,
        title: input.title,
        message: input.message ?? '',
      })),
    )
    .onConflictDoNothing()
    .returning({ id: schema.memberNotifications.id });
  return inserted.length;
}

export async function taskCollaborators(
  db: PostgresJsDatabase,
  businessId: string,
  orderId: string,
) {
  const tasks = await db
    .select({
      assigned: schema.orderTasks.assigneeMembershipId,
      created: schema.orderTasks.createdByMembershipId,
    })
    .from(schema.orderTasks)
    .where(
      and(
        eq(schema.orderTasks.businessId, businessId),
        eq(schema.orderTasks.orderId, orderId),
        ne(schema.orderTasks.status, 'done'),
      ),
    );
  return tasks.flatMap((t) => [t.assigned, t.created]);
}

const ORDER_UPDATES: Record<string, string> = {
  'order.update': 'Order updated',
  'order.cancel': 'Order cancelled',
  'order.line.add': 'Order item added',
  'order.line.remove': 'Order item removed',
  'order.payment.take': 'Order payment updated',
  'order.return': 'Order returned',
  'order.return_authorized': 'Order return authorized',
  'order.fulfill': 'Order fulfillment updated',
  'order.complete': 'Order completed',
  'delivery.schedule': 'Delivery scheduled',
  'delivery.update': 'Delivery updated',
  'delivery.status': 'Delivery status changed',
  'delivery.failed': 'Delivery needs attention',
  'delivery.delivered': 'Delivery completed',
  'delivery.cancel': 'Delivery cancelled',
};

/** Called in the same transaction as the audit event; never exposes financial details. */
export async function notifyOrderUpdate(
  db: PostgresJsDatabase,
  input: {
    businessId: string;
    actorMembershipId: string | null;
    action: string;
    targetType?: string;
    targetId?: string;
    eventId: string;
  },
) {
  const title = ORDER_UPDATES[input.action];
  if (
    !title ||
    !input.targetId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.targetId)
  )
    return;
  let orderId = input.targetType === 'order' ? input.targetId : null;
  if (input.targetType === 'delivery') {
    const [delivery] = await db
      .select({ orderId: schema.deliveries.orderId })
      .from(schema.deliveries)
      .where(
        and(
          eq(schema.deliveries.businessId, input.businessId),
          eq(schema.deliveries.id, input.targetId),
        ),
      );
    orderId = delivery?.orderId ?? null;
  }
  if (!orderId) return;
  const recipients = await taskCollaborators(db, input.businessId, orderId);
  if (!recipients.length) return;
  const [order] = await db
    .select({ locationId: schema.orders.locationId })
    .from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), eq(schema.orders.businessId, input.businessId)));
  if (!order) return;
  await notifyMembers(db, {
    ...input,
    orderId,
    locationId: order.locationId,
    recipients,
    eventKey: `order:${input.eventId}`,
    kind: 'order_update',
    title,
    message: 'An order linked to your open task changed. Review its latest details.',
  });
}

/** Catch-up runs share the deadline key, so a late task does not flood the inbox. */
export async function remindOverdueTasks(
  db: PostgresJsDatabase,
  businessId: string,
  now = new Date(),
) {
  const tasks = await db
    .select({ task: schema.orderTasks, locationId: schema.orders.locationId })
    .from(schema.orderTasks)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderTasks.orderId))
    .where(
      and(
        eq(schema.orderTasks.businessId, businessId),
        lt(schema.orderTasks.dueAt, now),
        inArray(schema.orderTasks.status, ['open', 'in_progress', 'blocked']),
      ),
    );
  let sent = 0;
  for (const { task, locationId } of tasks) {
    sent += await notifyMembers(db, {
      businessId,
      orderId: task.orderId,
      locationId,
      recipients: [task.assigneeMembershipId, task.createdByMembershipId],
      taskId: task.id,
      eventKey: `overdue:${task.id}:${task.dueAt!.toISOString()}`,
      kind: 'task_overdue',
      title: 'Task overdue',
      message: task.title,
    });
  }
  return sent;
}
