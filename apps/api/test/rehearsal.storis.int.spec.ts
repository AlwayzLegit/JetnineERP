/**
 * STORIS import rehearsal runner (D7): drives the REAL export files
 * through the same stage → map → validate → commit → recon pipeline the
 * cutover will use, against a throwaway database, and prints a
 * reconciliation report.
 *
 * The export data itself never lives in the repo — this suite is
 * SKIPPED unless STORIS_REHEARSAL_DIR points at a directory containing
 * `storis_products.csv` and `storis_inventory.csv` (the pipeline-ready
 * files generated from the raw takeout). Run it like:
 *
 *   STORIS_REHEARSAL_DIR=/path/to/csvs \
 *   STORIS_REHEARSAL_DATABASE_URL=postgres://postgres:postgres@localhost:5432/jetnine_rehearsal \
 *   pnpm vitest run test/rehearsal.storis.int.spec.ts
 *
 * It asserts only structural invariants (no commit failures on valid
 * rows, D7 idempotency on re-run, inventory unit totals matching the
 * file); everything else — row error samples, counts per entity,
 * enrichment coverage — is reported to stdout for the recon sign-off.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { eq, isNotNull, sql as dsql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const REHEARSAL_DIR = process.env.STORIS_REHEARSAL_DIR;
const TEST_DB_URL =
  process.env.STORIS_REHEARSAL_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_rehearsal';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'RehearsalPass!26';

/** The real store list (D12): STORIS location codes already mapped. */
const LOCATIONS = ['Warehouse', 'Koreatown', 'West LA', 'La Brea', 'Studio City'];

let app: NestExpressApplication;
let businessId = '';
let ownerCookie = '';
let verifySql: ReturnType<typeof postgres>;
let verifyDb: ReturnType<typeof drizzle>;

function csvUnits(csv: string, column: string): number {
  const lines = csv.trim().split('\n');
  const idx = lines[0]!.split(',').indexOf(column);
  let total = 0;
  for (const line of lines.slice(1)) {
    const v = Number(line.split(',')[idx]);
    if (Number.isFinite(v)) total += v;
  }
  return total;
}

function api() {
  return {
    post: (url: string) =>
      request(app.getHttpServer())
        .post(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
    get: (url: string) =>
      request(app.getHttpServer())
        .get(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
  };
}

interface BatchOutcome {
  batchId: string;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  committed: number;
  failed: number;
  errorSamples: unknown[];
}

/** stage → validate → commit, reporting rather than asserting counts. */
async function runBatch(entity: string, csv: string): Promise<BatchOutcome> {
  const staged = await api()
    .post('/v1/import/batches')
    .send({ entity, filename: `${entity}.csv`, csv });
  expect(staged.status).toBe(201);
  expect(staged.body.unmappedRequired).toEqual([]);
  const batchId = staged.body.id as string;

  const validated = await api().post(`/v1/import/batches/${batchId}/validate`).send({});
  expect(validated.status).toBe(201);

  const committed = await api().post(`/v1/import/batches/${batchId}/commit`).send({});
  expect(committed.status).toBe(201);

  return {
    batchId,
    rowCount: staged.body.rowCount as number,
    validRowCount: validated.body.validRowCount as number,
    invalidRowCount: validated.body.invalidRowCount as number,
    committed: committed.body.committed as number,
    failed: committed.body.failed as number,
    errorSamples: (validated.body.errors ?? []).slice(0, 10),
  };
}

describe.skipIf(!REHEARSAL_DIR)('STORIS cutover rehearsal (real export files)', () => {
  let productsCsv = '';
  let inventoryCsv = '';

  beforeAll(async () => {
    productsCsv = readFileSync(join(REHEARSAL_DIR!, 'storis_products.csv'), 'utf8');
    inventoryCsv = readFileSync(join(REHEARSAL_DIR!, 'storis_inventory.csv'), 'utf8');

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

    const seedSql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const seedDb = drizzle(seedSql);
    try {
      const passwordHash = await hashPassword(PASSWORD);
      const [biz] = await seedDb
        .insert(schema.businesses)
        .values({ slug: 'storis-rehearsal', name: 'LA Mattress Rehearsal', status: 'active' })
        .returning();
      businessId = biz!.id;
      const roles = new Map<string, string>();
      for (const role of SYSTEM_ROLES) {
        const [r] = await seedDb
          .insert(schema.roles)
          .values({ businessId, name: role.name, description: role.description, isSystem: true })
          .returning();
        roles.set(role.name, r!.id);
        if (role.permissions.length > 0) {
          await seedDb
            .insert(schema.rolePermissions)
            .values(role.permissions.map((permission) => ({ roleId: r!.id, permission })));
        }
      }
      const [u] = await seedDb
        .insert(schema.users)
        .values({ email: 'owner@rehearsal.local', emailVerified: true, name: 'Rehearsal Owner' })
        .returning();
      await seedDb.insert(schema.accounts).values({
        accountId: u!.id,
        providerId: 'credential',
        userId: u!.id,
        password: passwordHash,
      });
      await seedDb.insert(schema.memberships).values({
        businessId,
        userId: u!.id,
        roleId: roles.get('Owner')!,
        status: 'active',
        acceptedAt: new Date(),
      });
      await seedDb.insert(schema.locations).values(
        LOCATIONS.map((name) => ({
          businessId,
          name,
          timezone: 'America/Los_Angeles',
          taxRateBps: 0,
        })),
      );
    } finally {
      await seedSql.end({ timeout: 5 });
    }

    process.env.DATABASE_URL = TEST_DB_URL;
    process.env.BETTER_AUTH_URL ??= 'http://localhost';
    process.env.BETTER_AUTH_SECRET ??= 'rehearsal-secret-rehearsal-secret-!!!!';
    process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
    process.env.NODE_ENV ??= 'test';
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.RESEND_API_KEY;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({
      bufferLogs: true,
      rawBody: true,
    });
    // Match main.ts — a real catalog CSV is several MB and the default
    // 100kb json limit 413s it (rehearsal finding #1: harness-only).
    app.useBodyParser('json', { limit: '25mb' });
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'owner@rehearsal.local', password: PASSWORD })
      .expect(200);
    const cookies = res.get('Set-Cookie') ?? [];
    ownerCookie = cookies
      .map((c) => c.split(';')[0])
      .filter((c): c is string => Boolean(c?.startsWith('jetnine.session_token=')))
      .find((c) => !c.endsWith('='))!;

    verifySql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    verifyDb = drizzle(verifySql);
  }, 300_000);

  afterAll(async () => {
    if (verifySql) await verifySql.end({ timeout: 5 });
    if (app) await app.close();
  });

  let productsRun1: BatchOutcome;
  let inventoryRun1: BatchOutcome;

  it('products: stage → validate → commit the full catalog', async () => {
    productsRun1 = await runBatch('product', productsCsv);
    console.log('\n=== REHEARSAL: products run 1 ===');
    console.log(JSON.stringify(productsRun1, null, 2));
    expect(productsRun1.failed).toBe(0);
    expect(productsRun1.committed).toBe(productsRun1.validRowCount);
  }, 600_000);

  it('inventory: stage → validate → commit on-hand for the five mapped stores', async () => {
    inventoryRun1 = await runBatch('inventory', inventoryCsv);
    console.log('\n=== REHEARSAL: inventory run 1 ===');
    console.log(JSON.stringify(inventoryRun1, null, 2));
    expect(inventoryRun1.failed).toBe(0);
    expect(inventoryRun1.committed).toBe(inventoryRun1.validRowCount);
  }, 600_000);

  it('committed state matches the files: variants, units, vendors, enrichment', async () => {
    const [variantCount] = await verifyDb
      .select({ n: dsql<number>`COUNT(*)::int` })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.businessId, businessId));
    const [withVendorSku] = await verifyDb
      .select({ n: dsql<number>`COUNT(*)::int` })
      .from(schema.productVariants)
      .where(isNotNull(schema.productVariants.vendorSku));
    const [withReorder] = await verifyDb
      .select({ n: dsql<number>`COUNT(*)::int` })
      .from(schema.productVariants)
      .where(isNotNull(schema.productVariants.reorderPoint));
    const [vendorCount] = await verifyDb
      .select({ n: dsql<number>`COUNT(*)::int` })
      .from(schema.vendors)
      .where(eq(schema.vendors.businessId, businessId));
    const [unitTotal] = await verifyDb
      .select({ n: dsql<number>`COALESCE(SUM(${schema.inventoryLevels.onHand}), 0)::int` })
      .from(schema.inventoryLevels)
      .where(eq(schema.inventoryLevels.businessId, businessId));
    const [pricedAtZero] = await verifyDb
      .select({ n: dsql<number>`COUNT(*)::int` })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.priceCents, 0));

    const summary = {
      variants: variantCount!.n,
      variantsWithVendorSku: withVendorSku!.n,
      variantsWithReorderPoint: withReorder!.n,
      vendorsCreated: vendorCount!.n,
      unitsOnHand: unitTotal!.n,
      variantsAtZeroPrice: pricedAtZero!.n,
    };
    console.log('\n=== REHEARSAL: committed state ===');
    console.log(JSON.stringify(summary, null, 2));

    // The one hard money/units gate: every unit in the file landed.
    expect(unitTotal!.n).toBe(csvUnits(inventoryCsv, 'ON_HAND'));
    // Every committed product row produced exactly one variant.
    expect(variantCount!.n).toBe(productsRun1.committed);
  });

  it('D7 idempotency: re-running both batches changes nothing', async () => {
    const productsRun2 = await runBatch('product', productsCsv);
    const inventoryRun2 = await runBatch('inventory', inventoryCsv);
    console.log('\n=== REHEARSAL: idempotent re-run ===');
    console.log(
      JSON.stringify(
        { products: productsRun2.committed, inventory: inventoryRun2.committed },
        null,
        2,
      ),
    );
    expect(productsRun2.failed).toBe(0);
    expect(inventoryRun2.failed).toBe(0);

    const [variantCount] = await verifyDb
      .select({ n: dsql<number>`COUNT(*)::int` })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.businessId, businessId));
    expect(variantCount!.n).toBe(productsRun1.committed);
    const [unitTotal] = await verifyDb
      .select({ n: dsql<number>`COALESCE(SUM(${schema.inventoryLevels.onHand}), 0)::int` })
      .from(schema.inventoryLevels)
      .where(eq(schema.inventoryLevels.businessId, businessId));
    expect(unitTotal!.n).toBe(csvUnits(inventoryCsv, 'ON_HAND'));
  }, 900_000);

  it('recon endpoint reflects the rehearsal batches', async () => {
    const recon = await api().get('/v1/import/recon');
    expect(recon.status).toBe(200);
    console.log('\n=== REHEARSAL: recon ===');
    console.log(JSON.stringify(recon.body, null, 2));
  });
});

// Make the file a valid suite even when skipped.
describe('rehearsal runner guard', () => {
  it('skips unless STORIS_REHEARSAL_DIR is set', () => {
    if (!REHEARSAL_DIR) {
      expect(existsSync(join(__dirname, 'rehearsal.storis.int.spec.ts'))).toBe(true);
    }
  });
});
