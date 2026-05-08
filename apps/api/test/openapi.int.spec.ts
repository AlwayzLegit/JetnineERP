/**
 * Phase 2.11 acceptance: the public OpenAPI spec is reachable
 * without auth, parses as valid JSON, and the documented surface
 * matches the controllers that actually exist.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.OPENAPI_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_openapi';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');

let app: INestApplication;

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

beforeAll(async () => {
  await resetTestDb();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'openapi-test-secret-openapi-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.11 — OpenAPI', () => {
  it('GET /v1/openapi.json is public and returns OpenAPI 3.1', async () => {
    const res = await request(app.getHttpServer()).get('/v1/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\.1\./);
    expect(res.body.info.title).toContain('Jetnine');
    expect(typeof res.body.paths).toBe('object');
  });

  it('spec declares the bearer security scheme', async () => {
    const res = await request(app.getHttpServer()).get('/v1/openapi.json');
    expect(res.body.components.securitySchemes.bearerAuth).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: expect.any(String),
      description: expect.any(String),
    });
    expect(res.body.security).toEqual([{ bearerAuth: [] }]);
  });

  it('documents the public surface we expect', async () => {
    const res = await request(app.getHttpServer()).get('/v1/openapi.json');
    const paths = Object.keys(res.body.paths).sort();
    expect(paths).toEqual([
      '/v1/customers',
      '/v1/customers/{id}',
      '/v1/inventory/levels',
      '/v1/inventory/movements',
      '/v1/products',
      '/v1/products/{id}',
      '/v1/sales',
      '/v1/sales/{id}',
      '/v1/sales/{id}/refund',
    ]);
  });

  it('list endpoints document the page envelope', async () => {
    const res = await request(app.getHttpServer()).get('/v1/openapi.json');
    const sales200 = res.body.paths['/v1/sales'].get.responses['200'];
    expect(sales200.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/SaleListPage',
    );
    const envelope = res.body.components.schemas.SaleListPage;
    expect(envelope.properties.data).toBeDefined();
    expect(envelope.properties.nextCursor).toBeDefined();
  });

  it('mutating endpoints document the Idempotency-Key header', async () => {
    const res = await request(app.getHttpServer()).get('/v1/openapi.json');
    const post = res.body.paths['/v1/sales'].post;
    const headers = post.parameters.filter((p: { in: string }) => p.in === 'header');
    expect(headers.some((h: { name: string }) => h.name === 'Idempotency-Key')).toBe(true);
  });

  it('GET /v1/docs serves the Swagger UI page (no auth required)', async () => {
    const res = await request(app.getHttpServer()).get('/v1/docs');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('SwaggerUIBundle');
    expect(res.text).toContain('/v1/openapi.json');
  });
});
