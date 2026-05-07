# Jetnine ERP

Multi-tenant browser-based POS and retail operations platform. See [`PLAN.md`](./PLAN.md) for the full development plan.

## Repository layout

```
apps/
  api/        NestJS backend (TypeScript, Node 22)
  web/        Next.js 15 frontend (App Router) — super admin, business admin, POS
packages/
  config/     Shared tsconfig + eslint flat configs
  db/         Drizzle schema, migrations, seed scripts (skeleton in Phase 0)
  shared/     Shared zod schemas, permission catalog, domain types
  ui/         Shared React components beyond shadcn primitives
```

## Prerequisites

- **Node 22+** (`.nvmrc` pins the major)
- **pnpm 9+** (`corepack enable` is the easy path)
- **Docker** (for local Postgres + Redis via `docker-compose.yml`)

## First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Start Postgres + Redis
docker compose up -d

# 4. Run migrations & seed (available once Epic 1.1 lands)
pnpm db:migrate
pnpm db:seed

# 5. Start dev servers
pnpm dev
```

After `pnpm dev`:

- API: http://localhost:4000 (Hello: `/`, liveness: `/health`, readiness: `/ready`)
- Web: http://localhost:3000

## Common commands

| Command            | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Run all apps in watch mode (Turborepo)            |
| `pnpm build`       | Build everything for production                   |
| `pnpm lint`        | ESLint across the workspace                       |
| `pnpm typecheck`   | TypeScript check across the workspace             |
| `pnpm test`        | Run all unit/integration tests (Vitest)           |
| `pnpm format`      | Format all source with Prettier                   |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes  |
| `pnpm db:migrate`  | Apply pending migrations to `DATABASE_URL`        |
| `pnpm db:reset`    | Drop + recreate the `public` schema (destructive) |
| `pnpm db:seed`     | Seed dev data                                     |

## Branches & deployments

- `main` is always deployable. Trunk-based with short-lived feature branches; squash-merge.
- Pushes to `main` deploy `apps/api` to Fly.io via `.github/workflows/deploy-api.yml` (requires `FLY_API_TOKEN`).
- `apps/web` is hosted on Vercel; PRs get preview deploys.

## Local services

`docker-compose.yml` runs:

- **Postgres 16** on `localhost:5432` (user `postgres`, db `jetnine`)
- **Redis 7** on `localhost:6379`

Volumes `jetnine_pg_data` and `jetnine_redis_data` persist data between restarts. Run `docker compose down -v` to wipe.

## Phase 0 status

Phase 0 (Epics 0.1, 0.2, 0.3) is complete:

- ✅ Turborepo + pnpm workspaces, Node 22 pinned
- ✅ Apps and packages scaffolded
- ✅ Shared TS/ESLint/Prettier
- ✅ Husky + lint-staged
- ✅ docker-compose for Postgres + Redis
- ✅ `.env.example` files
- ✅ GitHub Actions CI (lint, typecheck, test, build, format-check)
- ✅ Drizzle migration drift check in CI
- ✅ Fly.io deploy workflow for the API
- ✅ Vercel config for the web app
- ✅ Pino logger with request-id middleware
- ✅ Sentry SDK in both apps
- ✅ `/health` and `/ready` endpoints

## Phase 1 — Epic 1.1 status (Database & RLS spine)

Epic 1.1 is complete:

- 19 tables modelled in Drizzle (`packages/db/src/schema/`) covering platform,
  tenancy, audit, catalog, inventory, customers, and sales.
- Row-Level Security enabled and **forced** on every table; tenant tables use
  `business_id = current_business_id() OR is_super_admin()` for both `USING`
  and `WITH CHECK` so reads and writes are isolated.
- A non-login `app_user` role is provisioned by migration; the application
  swaps to it via `SET LOCAL ROLE app_user` inside every request transaction
  (see `packages/db/src/with-context.ts`).
- `pnpm db:reset && pnpm db:migrate && pnpm db:seed` produces a working dev
  database with a super admin, demo business, all five system roles, one
  location, and three sample products with inventory.
- 12 cross-tenant isolation tests in `packages/db/test/rls.test.ts`. They
  prove that A cannot see B, INSERTs into another tenant are rejected,
  super-admin context bypasses, and an empty context sees nothing.
  Run with `TEST_DATABASE_URL=... pnpm --filter @jetnine/db test`.

### How tenant context works at runtime

```ts
import { withTenantContext } from '@jetnine/db';

await withTenantContext(sql, { businessId, userId, isSuperAdmin: false }, async (tx) => {
  // every query through `tx` runs as app_user with RLS applied
});
```
