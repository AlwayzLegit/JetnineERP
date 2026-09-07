import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema, withDrizzleTenantContext } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';
import { remindOverdueTasks } from '../src/orders/collaboration';

const DB_URL =
  process.env.TEAM_WORKFLOWS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_team_workflows';
const dbRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'TeamWorkflowTest!2026';
let app: INestApplication;
let businessId = '',
  foreignBusiness = '',
  storeA = '',
  storeB = '',
  customerId = '';
const ids: Record<string, string> = {},
  cookies: Record<string, string> = {};
let sequence = 0;

async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>) {
  const sql = postgres(DB_URL, { max: 1, prepare: false });
  try {
    return await fn(drizzle(sql));
  } finally {
    await sql.end({ timeout: 5 });
  }
}
const as = (who: string, business = businessId) => ({
  get: (path: string) =>
    request(app.getHttpServer())
      .get(path)
      .set('Cookie', cookies[who]!)
      .set('x-business-id', business),
  post: (path: string) =>
    request(app.getHttpServer())
      .post(path)
      .set('Cookie', cookies[who]!)
      .set('x-business-id', business),
  patch: (path: string) =>
    request(app.getHttpServer())
      .patch(path)
      .set('Cookie', cookies[who]!)
      .set('x-business-id', business),
});
async function order(locationId = storeA) {
  return withDb(async (db) => {
    const [row] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId,
        customerId,
        number: `TEAM-${++sequence}`,
        status: 'open',
        subtotalCents: 10000,
        totalCents: 10000,
      })
      .returning();
    return row!;
  });
}
async function createTask(orderId: string, extra: Record<string, unknown> = {}) {
  const response = await as('cashier')
    .post(`/v1/orders/${orderId}/tasks`)
    .send({ title: 'Confirm delivery access', assigneeMembershipId: ids.warehouse, ...extra })
    .expect(201);
  return response.body as { id: string; version: number; status: string };
}

beforeAll(async () => {
  for (const script of ['src/reset.ts', 'src/migrate.ts'])
    execFileSync(process.execPath, [join(dbRoot, 'node_modules/tsx/dist/cli.mjs'), script], {
      cwd: dbRoot,
      env: { ...process.env, DATABASE_URL: DB_URL },
      stdio: 'inherit',
    });
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'team-test', name: 'Team Test', status: 'active' })
      .returning();
    businessId = biz!.id;
    const [other] = await db
      .insert(schema.businesses)
      .values({ slug: 'team-other', name: 'Other Team', status: 'active' })
      .returning();
    foreignBusiness = other!.id;
    const roles = new Map<string, string>();
    for (const def of SYSTEM_ROLES) {
      const [role] = await db
        .insert(schema.roles)
        .values({ businessId, name: def.name, isSystem: true })
        .returning();
      roles.set(def.name, role!.id);
      if (def.permissions.length)
        await db
          .insert(schema.rolePermissions)
          .values(def.permissions.map((permission) => ({ roleId: role!.id, permission })));
    }
    const [none] = await db
      .insert(schema.roles)
      .values({ businessId, name: 'No order access' })
      .returning();
    roles.set('None', none!.id);
    const locations = await db
      .insert(schema.locations)
      .values([
        { businessId, name: 'Store A', timezone: 'America/Los_Angeles' },
        { businessId, name: 'Store B', timezone: 'America/Los_Angeles' },
      ])
      .returning();
    storeA = locations[0]!.id;
    storeB = locations[1]!.id;
    const [customer] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Team', lastName: 'Customer' })
      .returning();
    customerId = customer!.id;
    for (const [name, role, scope, status] of [
      ['cashier', 'Cashier', '', 'active'],
      ['warehouse', 'Warehouse', '', 'active'],
      ['scoped', 'Cashier', storeB, 'active'],
      ['revoked', 'Cashier', '', 'active'],
      ['inactive', 'Warehouse', '', 'disabled'],
      ['nopermission', 'None', '', 'active'],
    ] as const) {
      const [u] = await db
        .insert(schema.users)
        .values({ email: `${name}@team-test.local`, name, emailVerified: true })
        .returning();
      await db.insert(schema.accounts).values({
        accountId: u!.id,
        providerId: 'credential',
        userId: u!.id,
        password: passwordHash,
      });
      const [m] = await db
        .insert(schema.memberships)
        .values({
          businessId,
          userId: u!.id,
          roleId: roles.get(role)!,
          status,
          dataScope: scope ? 'store' : 'all',
          acceptedAt: new Date(),
        })
        .returning();
      ids[name] = m!.id;
      if (scope)
        await db
          .insert(schema.membershipLocationScopes)
          .values({ businessId, membershipId: m!.id, locationId: scope });
      if (name === 'revoked')
        await db
          .insert(schema.membershipPermissionOverrides)
          .values({ businessId, membershipId: m!.id, permission: 'orders.view', allowed: false });
    }
  });
  process.env.DATABASE_URL = DB_URL;
  process.env.BETTER_AUTH_URL = 'http://localhost';
  process.env.BETTER_AUTH_SECRET = 'team-test-secret-team-test-secret-xx';
  process.env.AUTH_TRUSTED_ORIGINS = 'http://localhost';
  process.env.AUTH_RATE_LIMIT_DISABLED = '1';
  process.env.NODE_ENV = 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = module.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  for (const name of ['cashier', 'warehouse', 'scoped', 'revoked', 'nopermission']) {
    const result = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: `${name}@team-test.local`, password: PASSWORD })
      .expect(200);
    cookies[name] = (result.get('Set-Cookie') ?? [])
      .map((c) => c.split(';')[0]!)
      .find((c) => c.startsWith('jetnine.session_token=') && !c.endsWith('='))!;
  }
}, 180000);
afterAll(async () => {
  if (app) await app.close();
});

describe('team tasks and personal inbox', () => {
  it('enforces database tenant isolation on both new tables without application filters', async () => {
    const o = await order();
    await createTask(o.id);
    await withDb(async (db) => {
      await withDrizzleTenantContext(db, { businessId: foreignBusiness }, async (tx) => {
        expect(await tx.select().from(schema.orderTasks)).toEqual([]);
        expect(await tx.select().from(schema.memberNotifications)).toEqual([]);
      });
      await expect(
        withDrizzleTenantContext(db, { businessId: foreignBusiness }, (tx) =>
          tx
            .insert(schema.orderTasks)
            .values({ businessId, orderId: o.id, title: 'Tenant escape' })
            .then(() => undefined),
        ),
      ).rejects.toMatchObject({ cause: { code: '42501' } });
    });
  });

  it('starts with a personal empty inbox, and checks order permission', async () => {
    const inbox = await as('cashier').get('/v1/inbox').expect(200);
    expect(inbox.body).toMatchObject({
      data: [],
      unread: 0,
      membershipId: ids.cashier,
      businessId,
    });
    await as('nopermission').get('/v1/tasks').expect(403);
    await as('revoked').get('/v1/inbox').expect(403);
  });

  it('offers only active recipients with effective permission and order-store access', async () => {
    const o = await order();
    const team = await as('cashier').get(`/v1/orders/${o.id}/team`).expect(200);
    expect(team.body.map((m: { id: string }) => m.id).sort()).toEqual(
      [ids.cashier, ids.warehouse].sort(),
    );
    for (const assigneeMembershipId of [ids.scoped, ids.inactive, ids.revoked, ids.nopermission]) {
      await as('cashier')
        .post(`/v1/orders/${o.id}/tasks`)
        .send({ title: 'Wrong recipient', assigneeMembershipId })
        .expect(400);
    }
    await as('cashier').post(`/v1/orders/${o.id}/tasks`).send({ title: '   ' }).expect(400);
    await as('cashier')
      .post(`/v1/orders/${o.id}/tasks`)
      .send({ title: 'Bad date', dueAt: 'tomorrow' })
      .expect(400);
  });

  it('assigns an order task, includes it in My tasks, and notifies the owner only', async () => {
    const o = await order();
    const task = await createTask(o.id, { priority: 'high', dueAt: '2030-01-01T12:00:00Z' });
    const mine = await as('warehouse').get(`/v1/tasks?queue=mine&orderId=${o.id}`).expect(200);
    expect(mine.body.data).toMatchObject([
      { id: task.id, orderNumber: o.number, priority: 'high', status: 'open' },
    ]);
    const inbox = await as('warehouse').get('/v1/inbox').expect(200);
    expect(inbox.body.data.find((n: { taskId: string }) => n.taskId === task.id)).toMatchObject({
      kind: 'task_assigned',
      readAt: null,
    });
    const creator = await as('cashier').get('/v1/inbox').expect(200);
    expect(creator.body.data.some((n: { taskId: string }) => n.taskId === task.id)).toBe(false);
    const started = await as('warehouse')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 1, status: 'in_progress' })
      .expect(200);
    expect(started.body).toMatchObject({
      assigneeMembershipId: ids.warehouse,
      priority: 'high',
      dueAt: '2030-01-01T12:00:00.000Z',
    });
    const unchanged = await as('warehouse')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 2, status: 'in_progress', dueAt: '2030-01-01T12:00:00Z' })
      .expect(200);
    expect(unchanged.body.version).toBe(2);
  });

  it('persists read state per recipient and ignores another member’s read request', async () => {
    const o = await order();
    const task = await createTask(o.id);
    const inbox = await as('warehouse').get('/v1/inbox').expect(200);
    const item = inbox.body.data.find((n: { taskId: string }) => n.taskId === task.id);
    const wrong = await as('cashier')
      .post('/v1/inbox/read')
      .send({ ids: [item.id] })
      .expect(201);
    expect(wrong.body.updated).toBe(0);
    await as('warehouse')
      .post('/v1/inbox/read')
      .send({ ids: [item.id] })
      .expect(201);
    const reread = await as('warehouse').get('/v1/inbox').expect(200);
    expect(reread.body.data.find((n: { id: string }) => n.id === item.id).readAt).toBeTruthy();
    const again = await as('warehouse')
      .post('/v1/inbox/read')
      .send({ ids: [item.id] })
      .expect(201);
    expect(again.body.updated).toBe(0);
  });

  it('deduplicates selected note recipients and task collaborators', async () => {
    const o = await order();
    await createTask(o.id);
    const note = await as('cashier')
      .post(`/v1/orders/${o.id}/notes`)
      .send({
        body: 'Use the rear entrance.',
        mentionedMembershipIds: [ids.warehouse, ids.warehouse],
      })
      .expect(201);
    expect(note.body.mentionedMembershipIds).toEqual([ids.warehouse]);
    const inbox = await as('warehouse').get('/v1/inbox').expect(200);
    expect(
      inbox.body.data.filter((n: { noteId: string }) => n.noteId === note.body.id),
    ).toHaveLength(1);
    await as('cashier')
      .post(`/v1/orders/${o.id}/notes`)
      .send({ body: 'Scope test', mentionedMembershipIds: [ids.scoped] })
      .expect(400);
    await as('cashier')
      .post(`/v1/orders/${o.id}/notes`)
      .send({ body: { unexpected: true } })
      .expect(400);
  });

  it('records task changes and rejects a stale concurrent update', async () => {
    const o = await order();
    const task = await createTask(o.id);
    const results = await Promise.all([
      as('warehouse')
        .patch(`/v1/tasks/${task.id}`)
        .send({ version: task.version, status: 'blocked' }),
      as('cashier')
        .patch(`/v1/tasks/${task.id}`)
        .send({ version: task.version, status: 'in_progress' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const logs = await withDb((db) =>
      db
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.targetId, o.id),
            eq(schema.auditLogs.action, 'order.task.update'),
          ),
        ),
    );
    expect(logs).toHaveLength(1);
  });

  it('notifies the creator when work is blocked or completed, and supports reassignment', async () => {
    const o = await order();
    const task = await createTask(o.id);
    await as('warehouse')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 1, status: 'blocked', description: 'Waiting for customer confirmation' })
      .expect(200);
    const inbox = await as('cashier').get('/v1/inbox').expect(200);
    expect(inbox.body.data.find((n: { taskId: string }) => n.taskId === task.id).title).toBe(
      'Task blocked',
    );
    const reassigned = await as('cashier')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 2, assigneeMembershipId: ids.cashier, status: 'in_progress' })
      .expect(200);
    expect(reassigned.body.assigneeMembershipId).toBe(ids.cashier);
    const done = await as('cashier')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 3, status: 'done' })
      .expect(200);
    expect(done.body.completedAt).toBeTruthy();
    const list = await as('cashier').get(`/v1/tasks?queue=done&orderId=${o.id}`).expect(200);
    expect(list.body.data).toHaveLength(1);
    const reopened = await as('cashier')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 4, status: 'open' })
      .expect(200);
    expect(reopened.body.completedAt).toBeNull();
  });

  it('keeps orders, tasks, search and inbox updates inside store and business scopes', async () => {
    const o = await order();
    const task = await createTask(o.id);
    await as('scoped').get(`/v1/orders/${o.id}/team`).expect(404);
    await as('scoped').get(`/v1/tasks?orderId=${o.id}`).expect(404);
    await as('scoped')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 1, status: 'done' })
      .expect(404);
    const search = await as('scoped').get(`/v1/task-orders?q=${o.number}`).expect(200);
    expect(search.body).toEqual([]);
    const global = await as('scoped').get('/v1/tasks?queue=team').expect(200);
    expect(global.body.data).toEqual([]);
    await as('cashier', foreignBusiness).get('/v1/tasks?queue=team').expect(403);
    const b = await order(storeB);
    await as('scoped')
      .post(`/v1/orders/${b.id}/tasks`)
      .send({ title: 'My store task', assigneeMembershipId: ids.scoped })
      .expect(201);
  });

  it('hides an old inbox update after store access changes', async () => {
    const o = await order(storeB);
    const task = await createTask(o.id, { assigneeMembershipId: ids.scoped });
    const before = await as('scoped').get('/v1/inbox').expect(200);
    expect(before.body.data.some((n: { taskId: string }) => n.taskId === task.id)).toBe(true);
    await withDb((db) =>
      db
        .delete(schema.membershipLocationScopes)
        .where(eq(schema.membershipLocationScopes.membershipId, ids.scoped!)),
    );
    const after = await as('scoped').get('/v1/inbox').expect(200);
    expect(after.body).toMatchObject({ data: [], unread: 0 });
  });

  it('sends relevant order edits to open task collaborators without financial data', async () => {
    const o = await order();
    await createTask(o.id);
    await as('cashier')
      .patch(`/v1/orders/${o.id}`)
      .send({ internalNotes: 'Call before arrival' })
      .expect(200);
    const inbox = await as('warehouse').get('/v1/inbox').expect(200);
    const event = inbox.body.data.find(
      (n: { orderId: string; kind: string }) => n.orderId === o.id && n.kind === 'order_update',
    );
    expect(event).toMatchObject({ title: 'Order updated' });
    expect(event.message).not.toContain('10000');
  });

  it('sends one overdue reminder per deadline and recipient, skipping completed work', async () => {
    const o = await order();
    const task = await createTask(o.id, { dueAt: '2020-01-01T12:00:00Z' });
    const run = () =>
      withDb((db) => remindOverdueTasks(db, businessId, new Date('2021-01-01T00:00:00Z')));
    expect(await run()).toBe(2);
    expect(await run()).toBe(0);
    await as('cashier')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 1, dueAt: '2020-02-01T12:00:00Z' })
      .expect(200);
    expect(await run()).toBe(2);
    await as('cashier')
      .patch(`/v1/tasks/${task.id}`)
      .send({ version: 2, status: 'done' })
      .expect(200);
    expect(await run()).toBe(0);
  });

  it('reports queue totals and pages without silently truncating tasks', async () => {
    const o = await order();
    for (let i = 0; i < 3; i++)
      await createTask(o.id, { assigneeMembershipId: null, title: `Unassigned ${i}` });
    const first = await as('cashier')
      .get(`/v1/tasks?queue=unassigned&orderId=${o.id}&limit=2`)
      .expect(200);
    const second = await as('cashier')
      .get(`/v1/tasks?queue=unassigned&orderId=${o.id}&limit=2&offset=2`)
      .expect(200);
    expect(first.body).toMatchObject({ total: 3, counts: { unassigned: 3 } });
    expect(first.body.data).toHaveLength(2);
    expect(second.body.data).toHaveLength(1);
    expect(first.body.data.some((t: { id: string }) => t.id === second.body.data[0].id)).toBe(
      false,
    );
  });
});
