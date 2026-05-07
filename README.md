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

## Phase 1 — Epic 1.4 status (Audit log)

Epic 1.4 is complete:

- **`AuditService.log({ action, target, before, after, metadata })`** in
  `apps/api/src/audit/audit.service.ts`. Reads actor + business + ip +
  user-agent from `AsyncLocalStorage`; runs through the request-scoped
  Drizzle transaction so the INSERT inherits the RLS context and rolls
  back together with the handler on failure.
- **`diffJson(before, after)`** computes a minimal field-level diff
  (only changed columns) and returns null when nothing changed.
- **`AuditInterceptor`** auto-logs every successful POST/PUT/PATCH/
  DELETE that doesn't already have an explicit audit row. Stacked into
  `@TenantScoped()` alongside the RLS interceptor so it always runs
  inside the same transaction. Sensitive request-body fields are
  redacted (same paths as the pino logger).
- **Viewer endpoint** `GET /v1/audit-logs` (gated by
  `@RequirePermission('audit.view')`) supports `action`, `actorUserId`,
  `since`, `until` filters; capped at 200 newest-first.
- **Web page** at `apps/web/src/app/(business)/audit/page.tsx` —
  filterable table with timestamp / actor email / action / target /
  pretty-printed JSON diff.
- **Integration tests** (`apps/api/test/audit.int.spec.ts`, 4 cases):
  PATCH variant price → audit row with exact before/after; Bookkeeper
  (audit.view) lists audits; Cashier (no audit.view) → 403; action
  filter narrows results. CI provisions a dedicated `jetnine_audit`
  database for the suite.

## Phase 1 — Epic 1.5 status (Super admin console)

Epic 1.5 is complete:

- **Businesses CRUD**: `GET /v1/admin/businesses` (joined with user +
  location counts and `last_activity_at` from audit_logs), `POST` to
  create + invite, `PATCH /:id/status` for suspend/unsuspend. All
  gated by `@SuperAdminOnly()`.
- **Owner invitations**: creating a business inserts a `verifications`
  row (`identifier="invite:<email>"`, 72h TTL) and sends an email via
  the EmailService. The invited user's account starts unverified +
  password-less; their membership is `status='invited'`.
- **`POST /v1/auth/accept-invite` (public)** validates the token,
  hashes the chosen password via `better-auth/crypto`, upserts the
  credential row, marks the user verified and membership active, and
  burns the verification.
- **Impersonation** via the `jetnine.impersonate_target` cookie. The
  AuthGuard honors it only when the underlying session belongs to a
  super admin and swaps the effective user.
  `CurrentUserPayload.impersonatorUserId` and
  `audit_logs.impersonator_user_id` carry the original super admin's
  id; the AuditService stamps it onto every row.
- **Impersonate endpoints**: `POST /v1/admin/impersonate
{ userId, businessId }` sets the cookie pair (impersonate target +
  active business) and writes an `auth.impersonate.start` audit row;
  `DELETE /v1/admin/impersonate` clears them and writes
  `auth.impersonate.stop`. Refuses to impersonate other super admins.
- **`GET /v1/admin/metrics`**: total businesses, active businesses,
  total users, sales count + gross cents in the last 30 days.
- **Web pages** under `(super-admin)` route group: `/admin` (metrics
  dashboard), `/admin/businesses` (list + create form + suspend
  toggle), `/admin/businesses/[id]` (details + impersonate).
  `(auth)/accept-invite` for invitees. Sticky red
  `<ImpersonationBanner />` displays the active impersonation and a
  one-click stop button on every super-admin page.
- **Integration tests** (`apps/api/test/admin.int.spec.ts`, 8 cases):
  super admin creates a business → invitation email captured →
  owner accepts (membership flips active) → super admin impersonates
  → impersonated PATCH writes audit row with `actor_user_id=owner`
  and `impersonator_user_id=superAdmin` and exact before/after diff
  → non-super-admin can't impersonate → suspend audit-logs the
  status change → metrics return counts. CI provisions a dedicated
  `jetnine_admin` database.

## Phase 1 — Epic 1.6 status (Business admin console)

Epic 1.6 is complete:

- **Settings**: `GET /v1/business/settings` and `PATCH` for name,
  default tax rate (basis points), receipt header/footer. Currency
  is fixed to USD per PLAN §5.3 — single column, not editable yet.
  All updates audit-log a before/after diff.
- **Locations CRUD**: `GET / POST / PATCH /v1/business/locations`
  with name, timezone, optional `taxRateBps` override (null inherits
  the business default), and `isActive` toggle.
- **Members**: `GET` lists members joined with users + roles.
  `POST .../invite` invokes the new shared `InvitationService` to
  create-or-find the user, open an `invited` membership, mint a
  72-hour token, and send an invitation email — same code path the
  super admin uses to invite a new business owner. `POST
/:id/resend-invite`, `PATCH /:id` (role + status), and `POST
/:id/disable` cover the rest of the lifecycle.
- **Roles**: `GET / POST / PATCH / DELETE /v1/business/roles`. The
  five system roles seeded per business are immutable (`isSystem:
true` returns 403 on edit/delete); admins clone via `basedOnRoleId`
  and then tweak permissions on the clone. `PATCH` replaces the role
  permission set wholesale, with a before/after diff in audit_logs.
  Roles in use by any membership can't be deleted.
- **`GET /v1/permissions` (public)**: returns the full permission
  catalog so the web role editor can render a grid grouped by module.
- **Schema additions** (migration `0001_friendly_starfox.sql`):
  `businesses.currency_code`, `default_tax_rate_bps`,
  `receipt_header`, `receipt_footer`; `locations.tax_rate_bps`.
- **Web pages** under the `(business)` route group with a shared
  layout: `/settings`, `/locations`, `/members`, `/roles`,
  `/audit` (Epic 1.4). The roles page renders a checkbox grid
  grouped by permission prefix and writes back via PATCH.
- **Integration tests** (`apps/api/test/business.int.spec.ts`,
  10 cases): owner reads + updates settings (audit captures diff)
  → owner creates a location with a tax override → owner invites a
  cashier → cashier accepts via `/v1/auth/accept-invite` and signs
  in → cashier has `products.view` (200) but lacks `products.update`
  (403) and `audit.view` (403), plus super-admin endpoints reject
  → owner clones the Cashier role and edits permissions → system
  roles refuse edit/delete → disabling a member flips status to
  `disabled` with an audit row → public permission catalog returns
  the full list. CI provisions `jetnine_business`.

## Phase 1 — Epic 1.7 status (Product catalog)

Epic 1.7 is complete:

- **Schema (migration 0002)**: new `product_images` table, plus generated
  `search_tsv` tsvector columns on `products` (name + sku + description)
  and `product_variants` (name + sku + barcode) with GIN indexes. The
  generated columns rebuild automatically on UPDATE so search stays
  consistent without trigger maintenance.
- **Categories** at `/v1/categories`: tree CRUD with depth ≤ 3 enforced
  in the controller. List returns both flat + tree views; deletes refuse
  if the category has children.
- **Products** at `/v1/products`:
  • `GET ?q=...` runs `websearch_to_tsquery('simple', q) @@ search_tsv`
  against products and any matching variants — finds the parent product
  when a variant SKU or barcode hits. Ranked by `ts_rank`.
  • `POST` creates a product + variants in one shot.
  • `GET /:id`, `PATCH /:id`, `DELETE /:id` (soft via `is_active`).
- **Variants** at `/v1/products/:productId/variants` and
  `/v1/products/variants/:id`: full CRUD; the legacy
  `PATCH /variants/:id/price` route used by Epic 1.3/1.4 tests stays.
  `costCents` is redacted in `GET /:id` responses unless the user has
  `products.cost.view` (or is super-admin).
- **Images** at `/v1/products/:productId/images`:
  • `POST .../upload-url` issues a unique storage key and a signed-URL
  placeholder (real R2 presigning kicks in once `R2_ACCOUNT_ID` +
  `R2_BUCKET` are configured).
  • `POST .../images` registers the uploaded key; max 4 per product.
  • `DELETE /v1/products/images/:id` removes the row.
- **CSV import** at `/v1/products/import/{preview,commit}`: parses
  `name,sku,price,barcode` headers; preview returns rows + per-row
  errors + SKU conflicts; commit inserts products + a default variant
  per row, skipping any SKU that already exists.
- **Web pages** under `(business)`: `/products` list with search box and
  inline CSV import; `/products/new` create form with variant rows;
  `/products/[id]` detail with inline price edit + image registration;
  `/categories` tree CRUD.
- **Integration tests** (`apps/api/test/catalog.int.spec.ts`, 10 cases):
  category create + 3-level depth enforcement → product with 3 variants
  → search by partial SKU, by barcode, by free-text name → cashier sees
  prices but `costCents` is null → 4-image cap → CSV preview parses 3
  rows + commit creates them. CI provisions `jetnine_catalog`.

## Phase 1 — Epic 1.8 status (Inventory)

Epic 1.8 is complete:

- **`GET /v1/inventory/levels?locationId=…`** joins `inventory_levels`
  with the variant + product, exposes `onHand`, `reserved`, and a
  computed `available = max(0, on_hand − reserved)`. Gated by
  `inventory.view`.
- **`GET /v1/inventory/movements`** returns the append-only ledger
  (joined with the actor email) with optional filters: `variantId`,
  `locationId`, `since`, `until`. Gated by `inventory.view`.
- **`POST /v1/inventory/adjust`** writes one `inventory_movements`
  row + upserts the matching `inventory_levels` row with
  `ON CONFLICT … SET on_hand = GREATEST(0, on_hand + delta)`. Reason
  must be one of `count_correction | damage | theft | other`. Gated
  by `inventory.adjust`. Audit-logged with reason + delta.
- **`POST /v1/inventory/receive`** takes a batch of positive lines
  for a single location and applies them inside the request's RLS
  transaction (partial failure rolls back). Returns the new `onHand`
  per line. Gated by `inventory.receive`. Audit-logged with total
  units + line count.
- **Web pages**: `/inventory` — location picker + levels table with
  inline Adjust dialog. `/inventory/receive` — search-and-add flow
  that pulls product detail, expands every variant as a line, takes
  quantities, and commits the batch. Both linked from the back-office
  nav.
- **Integration tests** (`apps/api/test/inventory.int.spec.ts`,
  9 cases): receive 10 units → `on_hand=10` + 1 movement row →
  receive 5 more stacks to 15 → adjust −3 with reason `damage`
  audit-logs the delta → invalid reason → 400 → adjust −1000 floors
  on_hand at 0 → levels endpoint returns joined product info →
  cashier can list but `inventory.adjust`/`receive` are 403 →
  movements endpoint surfaces the ledger newest-first with the
  joined actor email. CI provisions `jetnine_inventory`.

## Phase 1 — Epic 1.9 status (Customer records)

Epic 1.9 is complete:

- **Schema**: `customers.search_tsv` is a generated `tsvector` column
  (Postgres `STORED`) over `first_name + last_name + email + phone`
  with non-alphanumeric runs collapsed to spaces by `regexp_replace`,
  so partial matches against emails (`bob@example`) and phone numbers
  (`+1 555 …`) hit the same tokens. Backed by a GIN index
  (`customers_search_tsv_idx`).
- **`GET /v1/customers?q=…`** runs `websearch_to_tsquery('simple', …)`
  against the generated tsvector and orders by `ts_rank`. Without `q`,
  returns the most recent 50 sorted by last/first name. Gated by
  `customers.view`. The controller normalizes the query string the
  same way the column does to keep tokenization symmetric.
- **`GET /v1/customers/:id`** returns the full customer record plus
  the 20 most recent sales (`recentSales` placeholder until Epic 1.10
  populates `sales`).
- **`POST /v1/customers`** requires at least one of firstName,
  lastName, email, or phone. Audit-logged.
- **`PATCH /v1/customers/:id`** computes a per-field diff and only
  audit-logs the keys that actually changed.
- **`DELETE /v1/customers/:id`** removes the customer record; sales
  reference customers via `ON DELETE SET NULL`, so historical sales
  remain after the customer is removed.
- **Web pages**: `/customers` (list + search box), `/customers/new`
  (create form with at-least-one-identity validation), and
  `/customers/[id]` (edit form + recent purchases section).
- **Integration tests** (`apps/api/test/customers.int.spec.ts`, 10
  cases): create + list → 400 when no identity given → search by
  partial first name → search by partial email (`bob@example`) →
  search by partial phone (`+15559999999`) → recentSales placeholder
  is empty → edit emits an audit diff → cashier `customers.delete`
  denied (403) → bookkeeper `customers.view` denied (403) → owner
  delete succeeds. CI provisions `jetnine_customers`.

## Phase 1 — Epic 1.10 status (POS register)

Epic 1.10 is complete:

- **Schema**: added `refund_lines` (refund header + per-line breakdown so
  each refunded unit can be tied back to its sale line and propagate to
  inventory). Added to `TENANT_SCOPED_TABLES` + `rls.sql` so RLS forces
  on the new table. Generated as migration `0004_white_mystique.sql`.
- **Pure totals helper** (`apps/api/src/sales/totals.ts`): subtotal,
  line + order discounts (clamped), tax at sale level via
  `taxRateBps`. Unit-tested with 9 cases. Used both by the API and
  the web cart preview keeps the math identical.
- **`GET /v1/pos/lookup?q=…`**: barcode-exact match first (so a scan
  resolves to a single row) with ILIKE fallback on product name/SKU.
  Returns active variants only. Gated by `pos.access`.
- **`GET /v1/pos/locations`**: cashier-friendly location list (no
  `locations.view` required) so the register can fetch tax rates.
- **`POST /v1/sales`**: completes a sale in one shot inside the
  request's RLS transaction — sale header, lines, payments, one
  `inventory_movements` per line with `reason='sale'`, decrements
  `inventory_levels.on_hand`, generates an `INV-YYYY-NNNNNN` number
  with retry-on-conflict, and audit-logs `sale.complete`. Validates
  payments-sum-equals-total and accepts split tender (cash + card).
  Card payments record `processor='manual'` for MVP — Stripe Terminal
  lands in Phase 2.
- **`GET /v1/sales` / `GET /v1/sales/:id`**: list + detail with
  joined lines, payments, refunds, and per-line `refundedQuantity`.
- **`POST /v1/sales/:id/refund`**: per-line refund with quantity, restores
  inventory via positive `inventory_movements` rows + level upsert,
  enforces "cannot refund more than remaining", flips sale status to
  `partially_refunded` or `refunded`, audit-logged. Gated by
  `pos.refund.create`.
- **Permissions**: added `sales.view` to the catalog (Cashier and
  Bookkeeper get it; Owner/Manager already have it via the `*`
  catalog).
- **Web**: `/pos` is the register — barcode/search input that
  auto-adds on exact match, cart with quantity / line discount,
  customer attach modal that can also create a customer mid-sale,
  totals panel, payment screen with split tender + change calc, and
  receipt with `window.print()`. `/sales` lists completed sales;
  `/sales/[id]` shows lines + payments + refunds with an inline
  refund form. Customer detail's "Recent purchases" now populates
  from real sale rows.
- **Integration tests** (`apps/api/test/sales.int.spec.ts`, 11
  cases): barcode + name lookup, role-gated lookup, full 50/50
  cash+card sale with tax + audit + inventory decrement, list +
  detail render, payment-sum mismatch (400), cashier denied refund,
  owner refund of one line restores inventory and flips status to
  `partially_refunded`, over-refund (400), final refund flips status
  to `refunded`, sequential sale numbers within a year. Plus the
  pure totals helper's 9 unit tests. CI provisions `jetnine_sales`.
- **Acceptance:** A cashier can complete a sale paid 50% cash / 50%
  card, see inventory decrement, view it in the sales list, refund
  a single line, and the inventory is restored — exactly what the
  integration suite walks through end-to-end.

## Phase 1 — Epic 1.11 status (Reports & cash drawer)

Epic 1.11 is complete:

- **Schema**: added `cash_shifts` (one row per shift, with opening
  float, opened/closed timestamps + actor user, expected/counted
  cash and computed variance). Tenant-scoped + RLS-forced.
  Migration `0005_glossy_vision.sql`.
- **Permissions**: added `sales.view` already in 1.10; here Cashier
  picks up `pos.cash.open` + `pos.cash.reconcile` so the role can
  open and close drawers (acceptance criterion calls for "a cashier
  reconciles cash").
- **`GET /v1/reports/sales/daily?start=&end=&format=`**: three
  slices in one response — by-day totals (subtotal/discount/tax/
  total), by-associate (count + revenue), by-payment-method (cash
  vs card). Defaults to the last 7 days. `format=csv` streams a
  text/csv attachment of the by-day table; download requires
  `reports.export`.
- **`GET /v1/reports/sales/by-product?start=&end=&format=`**:
  per-variant totals ordered by revenue. `costCents` and
  `marginCents` are only returned when the caller has
  `reports.financial.view` (Owner, Manager, Bookkeeper); otherwise
  they're null.
- **`GET /v1/reports/inventory/on-hand?locationId=&lowStock=&format=`**:
  on-hand snapshot with optional location filter and low-stock
  threshold (returns rows where `available <= N`). CSV export
  available.
- **`POST /v1/cash-shifts`**: opens a shift at a location with an
  opening float; refuses (409) if a shift is still open at that
  location.
- **`POST /v1/cash-shifts/:id/close`**: computes
  `expected = opening_float + sum(succeeded cash payments at this
location during the shift window)` and persists
  `variance = counted − expected` (signed, so $-2 means short).
  Audit-logged.
- **`GET /v1/cash-shifts` / `:id`**: list + detail with joined
  location and opener/closer emails.
- **Pure CSV writer** (`apps/api/src/reports/csv.ts`) with 4 unit
  tests covering quoting and Date/null handling.
- **Web**: `/reports` is a single page with three sections —
  daily sales (with date pickers + per-section CSV download), sales
  by product, inventory on hand (with low-stock threshold).
  `/shifts` lists shifts with an inline open form;
  `/shifts/[id]` shows totals and a close form for open shifts or a
  signed variance for closed ones. Both linked from the back-office
  nav.
- **Integration tests** (`apps/api/test/reports.int.spec.ts`, 9
  cases): cashier opens a shift → second open at same location 409s
  → cashier rings $20 cash + $5 card → close with $118 counted
  produces $-2 variance over $120 expected → daily report shows the
  sales bucketed by day, by associate, by payment method →
  by-product is ordered by revenue, hides margin from cashier (also
  403'd for `reports.sales.view`), shows margin to bookkeeper →
  low-stock filter returns only the gadget → CSV export sets
  `Content-Type: text/csv` + the right header row. Plus the 4 CSV
  unit tests. CI provisions `jetnine_reports`.
- **Acceptance:** end-of-day close — a cashier reconciles cash
  (open shift → ring sales → close with counted), an owner views
  the day's totals, and exports to CSV. The integration test walks
  through every step.

## Phase 1 — Epic 1.12 status (Billing & read-only mode)

Epic 1.12 is complete:

- **Schema**: `subscriptions` table (one row per business) holds plan
  (`starter` | `pro`), status (`trial` | `active` | `past_due` |
  `canceled`), trial end, period start/end, and the Stripe
  customer/subscription IDs that the production webhook integration
  will populate. Tenant-scoped + RLS-forced. Migration
  `0006_sleepy_ultimo.sql`.
- **Pure pricing helper** (`apps/api/src/billing/pricing.ts`):
  Starter $50/location/month, Pro $100/location/month. 4 unit tests.
- **`GET /v1/billing/plans`** lists the catalog;
  **`GET /v1/billing/subscription`** returns the current state with
  computed `monthlyPriceCents` (plan price × current location count)
  and a `readOnly` boolean the UI uses to render the lapse banner.
- **`POST /v1/billing/subscribe`** transitions trial/cancelled →
  active and resets the period. In production this is where we'd
  redirect to Stripe Checkout; the body of the change-of-state
  fires here so the rest of the system can exercise the
  post-payment flow without real charges. Add `STRIPE_SECRET_KEY`
  to swap in the real integration.
- **`PATCH /v1/billing/subscription`** changes plan in-place;
  **`POST /v1/billing/cancel`** flips status to `canceled` and
  re-engages read-only mode.
- **`POST /v1/billing/dev/expire-trial`** is a non-prod helper that
  fast-forwards `trialEndsAt` and flips status to `past_due` —
  used by the integration test to drive the lapse path. Refuses to
  fire when `NODE_ENV=production` (Stripe webhooks are the
  production equivalent).
- **`SubscriptionGuard`**: runs alongside `TenancyGuard` via
  `@TenantScoped()`. Lets through GET/HEAD, `/v1/billing/*`,
  `/v1/business/settings`, and `/api/auth/*` so a lapsed business
  can still log in, see their data, and pay. Everything else
  returns **HTTP 402 Payment Required** when the subscription is in
  `past_due` / `canceled` or in `trial` past `trialEndsAt`.
- **Trial seeding**: `POST /v1/admin/businesses` now sets a
  14-day trial and inserts a matching subscription row, so a brand
  new business can use the app immediately without payment.
- **Web**: `/settings/billing` renders the current plan, locations,
  monthly price, and a banner when read-only is active. Plan picker
  shows both tiers (highlighting the current one); cancel + dev
  expire-trial are exposed where appropriate. Settings page links to
  it.
- **Integration tests** (`apps/api/test/billing.int.spec.ts`, 10
  cases): trial state visible → in-trial sale succeeds → plan
  catalog → expire-trial flips to `past_due` and `readOnly:true` →
  next sale returns 402 → list (GET) still 200 → billing endpoints
  still 200 → subscribe to Pro flips back to active and writes
  resume → PATCH plan switch → cancel re-engages 402. Plus the 4
  pricing unit tests. CI provisions `jetnine_billing`.
- **Acceptance:** a business in trial, when the trial ends without
  payment, becomes read-only across all UIs except billing settings —
  exactly what the integration suite asserts end-to-end.

## Phase 2.1 status (Stripe Connect for merchants)

Phase 2.1 is complete. The platform billing model from Epic 1.12
flips: instead of Jetnine charging merchants for using the platform,
each merchant connects their own Stripe account so card payments at
the POS go straight to their bank. Funds never touch a Jetnine
account.

- **Schema**: `merchant_stripe_accounts` (one row per business with
  `stripe_account_id`, scope, livemode, charges/payouts enabled,
  `disconnected_at` for soft-disconnect) + `stripe_oauth_states`
  (single-use CSRF tokens for the OAuth handshake). Both tenant-
  scoped + RLS-forced. Migration `0007_dashing_random.sql`.
- **`StripeService`** wraps the official `stripe` SDK and exposes
  `authorizeUrl`, `exchangeOauthCode`, `fetchAccount`, `disconnect`,
  `chargeCard`, `refundCharge`. When `STRIPE_SECRET_KEY` is missing
  it switches to STUB mode that returns deterministic fake ids and
  always-succeed charges so dev / tests don't need real keys.
- **`GET /v1/business/stripe/connect-url`** mints a state token and
  returns the Stripe authorize URL. **`GET /v1/stripe/oauth/callback`**
  is `@Public()`, validates the single-use state, exchanges the auth
  code for a `stripe_user_id`, persists the merchant row, and
  redirects back to `/settings/billing?stripe=connected`.
- **`GET /v1/business/stripe`** returns connection status + the
  publishable key the web app needs to mount Stripe Elements scoped
  to that merchant. **`POST /v1/business/stripe/disconnect`**
  revokes via Stripe + soft-marks the row.
- **Card payments at the POS** now flow through Stripe when the
  payment line carries a `stripePaymentMethodId` and the business
  has a connected account. The backend creates + confirms a
  PaymentIntent on the merchant's account in one call and rolls the
  whole sale back if the charge isn't `succeeded`. Cards without a
  PaymentMethod id (or businesses without Stripe) fall through to
  the legacy manual-capture path so the existing test fixtures keep
  passing.
- **Refunds through Stripe**: when the original payment was
  `processor='stripe'`, `POST /v1/sales/:id/refund` issues a
  `refunds.create` against the merchant's account (allocated
  Stripe-first, falling back to bookkeeping-only for cash tenders)
  before recording the refund rows.
- **Web /settings/billing** now leads with "Connect Stripe" + status
  panel (account email, account id, livemode, charges/payouts
  enabled, disconnect button). The self-serve plan picker is paused
  while we settle the platform billing model.
- **Web /pos payment screen** swaps in **Stripe Elements** when the
  business has a connected account. The cashier types cash, the
  card portion is computed automatically, and `<CardElement />` is
  used to tokenize the card client-side. The resulting
  PaymentMethod id is sent to `POST /v1/sales`. Stub mode bypasses
  the live tokenization with `pm_card_stub` so the form is usable
  without keys.
- **Required env** (production): `STRIPE_SECRET_KEY`,
  `STRIPE_PUBLISHABLE_KEY`, `STRIPE_CONNECT_CLIENT_ID`,
  `STRIPE_OAUTH_REDIRECT_URI`, `STRIPE_WEBHOOK_SECRET`. Without
  them the API logs a warning + falls back to stub mode (safe for
  dev; never deploy that way).
- **Integration tests** (`apps/api/test/stripe.int.spec.ts`, 11
  cases): initial unconnected state → connect-url issues a state →
  OAuth callback persists the row + redirects → state is
  single-use → Stripe-charged sale records `processor='stripe'` +
  `pi_stub_*` ref → refund flips status and reverses the
  PaymentIntent → mixed cash + Stripe sale routes the card portion
  only → bare `method:'card'` without payment method falls back to
  manual capture → disconnect sets `disconnected_at` → post-
  disconnect Stripe sale is rejected. Runs entirely against the
  stub. CI provisions `jetnine_stripe`.
- **What still needs you** before live charges work in production:
  the four Stripe env vars above (a free Connect Standard
  application; no platform Stripe payments are ever processed)
  plus the OAuth redirect URI configured in your Stripe Connect
  settings. The webhook handler is in place; just point a Stripe
  webhook endpoint at `https://<api-host>/v1/stripe/webhook` and
  set `STRIPE_WEBHOOK_SECRET`.

## Phase 2.2 status (Stripe webhooks)

Phase 2.2 is complete. The webhook handler is the bridge that keeps
our merchant state in sync with whatever happens on Stripe's side
(merchants editing their account, disputes, payouts disabled, etc.).

- **`stripe_webhook_events`** table (RLS-forced, super-admin only)
  records every event we accept by `event_id` so retries are
  idempotent. Failure messages are stashed alongside the row for
  debugging without re-firing the handler. Migration
  `0008_clever_wallop.sql`.
- **`POST /v1/stripe/webhook`** is `@Public()`, signature-verified
  via `StripeService.verifyWebhook(rawBody, signature)`. The Nest
  app boots with `rawBody: true` so Express keeps the unparsed
  bytes for signature checking. In stub mode (no
  `STRIPE_WEBHOOK_SECRET` set) the handler accepts a parsed JSON
  payload directly so dev / tests work without signed events.
- **Idempotency**: the handler `INSERT … ON CONFLICT DO NOTHING`s
  the event id; replays return `200 { received: true, deduped: true }`
  without re-running side effects.
- **Always responds 200 once the event is durably recorded**, even
  if a downstream handler throws — Stripe would otherwise retry
  forever for a code bug. Errors are written to the event row.
- **Handlers wired:**
  - `account.updated` → syncs `charges_enabled` / `payouts_enabled`
    / email / default currency on the merchant row.
  - `account.application.deauthorized` → soft-disconnects the
    merchant (set `disconnected_at`, force charges/payouts off).
  - `charge.dispute.created` → writes a `sale.dispute` audit row
    with the dispute id, amount, and reason against the originating
    sale.
  - Unknown event types are accepted and logged but no-op (so
    Stripe stops retrying — we'll wire more handlers as needs
    come up).
- **Setup:** in your Stripe dashboard → Developers → Webhooks →
  add endpoint `https://<api-host>/v1/stripe/webhook`. Subscribe
  to at least `account.updated`, `account.application.deauthorized`,
  `charge.dispute.created`. Copy the signing secret into
  `STRIPE_WEBHOOK_SECRET`.
- **Integration tests** added 7 cases on top of the existing
  Stripe spec: account.updated syncs merchant fields, replay is
  deduped, dispute writes the audit row, deauthorized
  soft-disconnects, unknown types pass, malformed payload returns 400. Total Stripe spec: 18/18; repo: 122 tests, all green.

## Phase 2.3 status (Vendors & Purchase Orders)

Phase 2.3 is complete. Merchants can now manage suppliers, write
purchase orders against them, receive stock against the PO, and have
the inventory ledger automatically reflect every receipt.

- **Schema**: `vendors`, `purchase_orders`, `purchase_order_lines`.
  POs reference vendors with `ON DELETE RESTRICT` so a vendor can't
  be hard-deleted while a PO points at them. Tenant-scoped + RLS
  forced on all three. Migration `0009_cold_multiple_man.sql`.
- **Permissions**: `vendors.view` / `.manage`,
  `purchase_orders.view` / `.create` / `.receive` / `.cancel`. The
  Inventory Clerk role gets all six (since this is their job);
  Owner / Manager already have the platform-wide `*` set.
- **`/v1/vendors`** full CRUD with audit trail. Duplicate-name
  inserts return 400 (unique on `business_id + name`); deletes are
  refused while POs still reference the vendor (suggest deactivate
  via `isActive=false` instead).
- **`/v1/purchase-orders`** list (with status filter), get,
  create. PO numbers are `PO-YYYY-NNNNNN`, generated per-business
  per-year with retry-on-conflict. Create validates every variant
  - vendor + location, computes the subtotal, supports
    `place: false` to leave the PO in `draft` for later edits;
    default is to mark `ordered` immediately.
- **`POST /v1/purchase-orders/:id/receive`** is the meaningful
  operation: validates each line up-front so the whole receipt is
  all-or-nothing, then for every line writes one
  `inventory_movements` row (`reason='receive_po'`,
  `reference_type='purchase_order'`) and increments
  `inventory_levels.on_hand`. After all lines are processed, the
  PO transitions automatically: `ordered` →
  `partially_received` →
  `received` once every line's `quantity_received` catches up to
  `quantity_ordered`. Audit-logged with the unit count and new
  status.
- **`POST /v1/purchase-orders/:id/cancel`** flips the PO to
  `canceled` (allowed from `draft`, `ordered`,
  `partially_received` only).
- **Web**: `/vendors` is the supplier list with an inline create
  form and delete; `/purchase-orders` is the list (status badge,
  vendor, subtotal, date); `/purchase-orders/new` is a search-and-
  add form that auto-computes the line subtotal as you type;
  `/purchase-orders/[id]` shows the lines with received-vs-ordered
  counters and an inline "Record receipt" form for partial or full
  receipts. All linked from the back-office nav under "Purchasing".
- **Integration tests** (`apps/api/test/purchasing.int.spec.ts`,
  11 cases): vendor create + duplicate refusal → cashier denied
  PO create → clerk creates a 2-line PO → 6/10 widgets received
  → over-receive 400 → finish receipt flips to `received` →
  ledger has 3 movements with `reason=receive_po` →
  re-receive against `received` PO 403s → cancel a draft PO →
  vendor delete is refused while POs reference it. CI provisions
  `jetnine_purchasing`. Repo: 133 tests, all green.
