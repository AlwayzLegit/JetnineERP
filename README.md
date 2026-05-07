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

## Phase 1 — Epic 1.2 status (Auth)

Epic 1.2 is complete:

- **better-auth** integrated via the Drizzle adapter against our schema. The
  adapter generates UUID PKs (configured via `advanced.database.generateId:
'uuid'`) so it stays compatible with the rest of the database.
- New tables: `accounts` (credentials per provider), `verifications`
  (email-verify + reset tokens), `two_factors` (TOTP secret + backup codes).
  `sessions` gained `token`, `updated_at`. RLS is force-enabled on every new
  table; per-user policies on `accounts`/`two_factors`, super-admin-only on
  `verifications`.
- **Email/password** sign-up, sign-in, sign-out, with email verification
  required before sign-in. Passwords hashed with better-auth's scrypt
  defaults (PLAN.md §10.6 says argon2id; swap is a one-liner in
  `apps/api/src/auth/auth.config.ts`).
- **Email** sending abstracted behind `EmailService`. Resend backend when
  `RESEND_API_KEY` is set; falls back to a memory transport (logs + captures
  for tests) otherwise. Dev controller `/v1/dev/email/last?to=…` exposes
  the last captured email so Playwright can pull verification/reset URLs.
- **Password reset** end-to-end: request → email → token-bound reset form.
- **TOTP 2FA** via better-auth's two-factor plugin. Enable on
  `/2fa`, verify with an authenticator app, sign-in then prompts for the
  6-digit code on every subsequent log-in.
- **Session management**: `GET /v1/auth/sessions` lists the current user's
  sessions (with a `current: true` flag for the active one); `DELETE
/v1/auth/sessions/:id` revokes by id, scoped to self.
- **Rate limiting** on the auth endpoints (5/min on sign-in/sign-up/reset,
  10/min on TOTP verify, 100/min global). Memory by default; Redis-backed
  when `REDIS_URL` is set.
- **NestJS guard** (`AuthGuard`) validates the session cookie and exposes a
  typed `CurrentUserPayload` via `@CurrentUser()`. The request-id and
  redaction middleware from Phase 0 still apply.
- **Web auth pages** under `(auth)` route group: `/login`, `/signup`,
  `/verify`, `/reset`, `/2fa`, plus a placeholder `/dashboard` for the
  post-login destination.
- **Playwright E2E**: `apps/web/e2e/auth.spec.ts` exercises the full flow
  (signup → email verify → login → enable 2FA → sign-out → sign-in with
  TOTP → password reset → sign-in with new password + TOTP). CI installs
  Chromium and runs the suite against a dedicated `jetnine_e2e` database.

Run locally: `pnpm --filter @jetnine/web test:e2e` (requires Postgres up
on `localhost:5432` with a `jetnine_e2e` database — `createdb jetnine_e2e`).

Seeded credentials: `admin@jetnine.local` / `ChangeMe!2024` (super admin),
`owner@acme.local` / `ChangeMe!2024` (demo business owner).

## Phase 1 — Epic 1.3 status (Tenancy middleware & request context)

Epic 1.3 is complete:

- **Active-business resolution**: per-session cookie
  `jetnine.active_business_id` (set/cleared by `POST/DELETE
/v1/auth/active-business`); the `X-Business-Id` header overrides for
  tests and machine clients.
- **TenancyGuard** loads the user's membership, role, and permission set
  for the active business once per request. `412 Precondition Failed`
  when no business is selected; `403 Forbidden` when the user has no
  membership in the requested business; super admins bypass with an
  empty permission set (the per-permission check downstream lets them
  through).
- **PermissionGuard** + `@RequirePermission('products.view', ...)` —
  multiple values are AND-ed; super admins always pass.
- **`@TenantScoped()`** controller decorator stacks `TenancyGuard +
PermissionGuard + RlsContextInterceptor` so tenant-scoped resources
  opt in with one line. `AuthGuard` is global (with `@Public()`
  opt-out) so every non-public endpoint has a session.
- **RlsContextInterceptor** opens a Drizzle transaction per request,
  runs `SET LOCAL ROLE app_user` + the tenant GUCs, stashes the
  transaction handle in `AsyncLocalStorage`, and runs the handler
  inside that scope. Handlers call `getRequestDb()` (from
  `tenancy/request-context`) to issue ORM queries that automatically
  inherit the RLS context.
- **`@CurrentTenant()`** param decorator exposes
  `{ businessId, membershipId, roleId, roleName, permissions, ... }`
  alongside `@CurrentUser()`.
- **`/v1/auth/me`** returns the current user plus their memberships so
  the web app can render a business picker.
- **Sample products endpoint** (`GET /v1/products`) gated by
  `@RequirePermission('products.view')` — placeholder until Epic 1.7
  fills in real CRUD; lets us prove the guard end-to-end.
- **Integration test** at `apps/api/test/tenancy.int.spec.ts` boots the
  full Nest app, signs in two users with different roles, and asserts
  200/403/412/401 across the matrix. CI provisions a dedicated
  `jetnine_tenancy` database for it.
