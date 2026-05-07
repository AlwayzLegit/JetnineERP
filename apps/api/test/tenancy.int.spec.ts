/**
 * Epic 1.3 acceptance: a handler decorated with @RequirePermission returns
 * 403 when the user's role lacks the permission, and 200 when it has it.
 *
 * Boots the full NestJS app against a dedicated test database, seeds two
 * users with different roles via the same paths the seed script uses, signs
 * each user in via better-auth's HTTP flow, and exercises /v1/products.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.TENANCY_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_tenancy';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

const PASSWORD = 'TestPassword!2026';

interface TestUser {
  id: string;
  email: string;
  cookie: string;
}

let app: INestApplication;
let businessId: string;
let owner: TestUser;
let bookkeeper: TestUser;

async function resetTestDb() {
  const env = { ...process.env, DATABASE_URL: TEST_DB_URL };
  execFileSync('pnpm', ['exec', 'tsx', 'src/reset.ts'], {
    cwd: dbPackageRoot,
    env,
    stdio: 'inherit',
  });
  execFileSync('pnpm', ['exec', 'tsx', 'src/migrate.ts'], {
    cwd: dbPackageRoot,
    env,
    stdio: 'inherit',
  });
}

async function seedFixtures() {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const passwordHash = await hashPassword(PASSWORD);

    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'tenancy-test', name: 'Tenancy Test Co', status: 'active' })
      .returning();
    if (!biz) throw new Error('biz insert failed');
    businessId = biz.id;

    // Seed all 5 system roles for this business so we can attach the right
    // role to each user.
    const roleIds = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({
          businessId: biz.id,
          name: role.name,
          description: role.description,
          isSystem: true,
        })
        .returning();
      if (!r) throw new Error(`role insert failed: ${role.name}`);
      roleIds.set(role.name, r.id);
      if (role.permissions.length > 0) {
        await db
          .insert(schema.rolePermissions)
          .values(role.permissions.map((permission) => ({ roleId: r.id, permission })));
      }
    }

    async function makeUser(email: string, name: string, roleName: string): Promise<TestUser> {
      const [u] = await db
        .insert(schema.users)
        .values({ email, emailVerified: true, name })
        .returning();
      if (!u) throw new Error(`user insert failed: ${email}`);
      await db.insert(schema.accounts).values({
        accountId: u.id,
        providerId: 'credential',
        userId: u.id,
        password: passwordHash,
      });
      const roleId = roleIds.get(roleName);
      if (!roleId) throw new Error(`unknown role: ${roleName}`);
      await db.insert(schema.memberships).values({
        businessId: biz.id,
        userId: u.id,
        roleId,
        status: 'active',
        acceptedAt: new Date(),
      });
      return { id: u.id, email, cookie: '' };
    }

    owner = await makeUser('owner@tenancy-test.local', 'Owner', 'Owner');
    bookkeeper = await makeUser('bookkeeper@tenancy-test.local', 'Bookkeeper', 'Bookkeeper');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function captureCookie(user: TestUser): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email: user.email, password: PASSWORD })
    .expect(200);
  const cookies = res.get('Set-Cookie') ?? [];
  const sessionCookie = cookies
    .map((c) => c.split(';')[0])
    .filter((c): c is string => Boolean(c?.startsWith('jetnine.session_token=')))
    .find((c) => !c.endsWith('='));
  if (!sessionCookie) throw new Error(`no session cookie returned for ${user.email}`);
  return sessionCookie;
}

beforeAll(async () => {
  await resetTestDb();
  await seedFixtures();

  // Stamp env before AppModule boots so AuthModule picks up our config.
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'tenancy-test-secret-tenancy-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  owner.cookie = await captureCookie(owner);
  bookkeeper.cookie = await captureCookie(bookkeeper);
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.3 — @RequirePermission gating', () => {
  it('Owner has products.view → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Bookkeeper lacks products.view → 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Cookie', bookkeeper.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/products\.view/);
  });

  it('No active business → 412 PreconditionFailed', async () => {
    const res = await request(app.getHttpServer()).get('/v1/products').set('Cookie', owner.cookie);
    expect(res.status).toBe(412);
  });

  it('No session → 401 Unauthorized', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products')
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(401);
  });

  it('Wrong tenant (user has no membership) → 403', async () => {
    const fakeBusinessId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Cookie', bookkeeper.cookie)
      .set('X-Business-Id', fakeBusinessId);
    expect(res.status).toBe(403);
  });
});
