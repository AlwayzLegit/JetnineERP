# Multi-Tenant Browser POS — Development Plan

> **Audience:** This document is the source of truth for development. It is written to be handed to Claude Code (or any engineer/agent) and executed phase by phase. Decisions are **locked**, not "considered." When in doubt, follow this plan exactly. If a decision needs to change, change it here first, then in code.

---

> **Phase 3 update (2026-08):** the active plan is the 10-day STORIS cutover sprint —
> sales orders, deliveries, special orders, financing/layaway, commissions, service
> orders, the GHL-style platform layer (templates, agencies, white-label, CRM), and
> the full STORIS data migration. See [`PLAN-STORIS-CUTOVER.md`](./PLAN-STORIS-CUTOVER.md);
> it extends (and where it conflicts, supersedes) the Phase 3 section below.

---

## 1. Vision

A multi-tenant, browser-based Point of Sale and retail operations platform inspired by STORIS, but generalized for any retail vertical. Sold as SaaS to retail businesses. Each business is fully isolated, has its own admins, users, locations, products, customers, and transactions. The platform owner ("super admin") can administer all businesses from a separate console.

### In scope (eventually)
- Multi-tenant SaaS, browser only (no native mobile apps)
- Hierarchical admin: platform super admin → business admin → granular roles
- POS register, inventory, products, customers, sales, refunds, reports
- Multi-location per business
- Stripe Terminal for in-person payments
- Receipt printing via network thermal printers

### Out of scope (do not build unless explicitly requested)
- Native iOS/Android apps
- On-premise / self-hosted deployments
- Vertical-specific features (furniture-specific, jewelry-specific, etc.)
- Custom GL accounting (integrate with QuickBooks/Xero only)
- E-commerce storefront (Phase 3+: connectors only)

---

## 2. Locked architectural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tenancy model | Shared schema, `business_id` on every tenant-scoped row, **Postgres Row-Level Security** (RLS) | Cheapest to operate; RLS gives defense-in-depth |
| Tenant identifier in URL | Single domain, business chosen at login (`app.example.com`) | Faster to ship than per-tenant subdomains; revisit in Phase 3 |
| Backend framework | **NestJS** (TypeScript) | Opinionated structure keeps an AI agent consistent across modules |
| Frontend framework | **Next.js 15** (App Router, TypeScript) | One framework for all three UIs (super admin, business admin, POS) |
| Database | **PostgreSQL 16** | RLS support, mature, well-known |
| ORM | **Drizzle ORM** | TypeScript-first, easy raw SQL for RLS, lightweight migrations |
| Auth | **better-auth** (self-hosted) | Supports organizations natively, no vendor lock-in |
| Payments | **Stripe** (Payments + Terminal) | Best DX; Stripe Terminal keeps us out of PCI scope |
| UI library | **shadcn/ui** + Tailwind CSS | Owns the components; no vendor lock-in |
| Data fetching | **TanStack Query** | De-facto standard |
| Forms | **react-hook-form** + **zod** | Type-safe, shared validation with backend |
| Background jobs | **BullMQ** (Redis-backed) | Stable, simple |
| Email | **Resend** | Best DX for transactional email |
| File storage | **Cloudflare R2** (S3-compatible) | No egress fees |
| Error tracking | **Sentry** | Both apps |
| Logging | **Pino** → stdout, shipped to Better Stack | Standard for Node |
| Hosting (MVP) | **Fly.io** for API + Postgres + Redis; **Vercel** for Next.js | Lowest ops overhead |
| Monorepo tool | **Turborepo** + **pnpm workspaces** | Standard, fast |
| Testing | **Vitest** (unit/integration), **Playwright** (E2E) | Modern, fast |
| Node version | **22 LTS** | |

---

## 3. Repository structure

```
/
├── apps/
│   ├── api/              # NestJS backend
│   └── web/              # Next.js frontend (super admin, business admin, POS)
├── packages/
│   ├── db/               # Drizzle schema, migrations, seed scripts
│   ├── shared/           # Shared zod schemas, types, permission catalog, constants
│   ├── ui/               # Shared React components (beyond shadcn primitives)
│   └── config/           # Shared eslint, tsconfig, prettier
├── docker-compose.yml    # Local Postgres + Redis
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── PLAN.md               # This file
├── README.md
└── .github/workflows/    # CI: lint, typecheck, test, build
```

The Next.js app uses route groups to separate the three UIs:

```
apps/web/src/app/
├── (super-admin)/        # Platform super admin console
├── (business)/           # Business admin + back office
├── (pos)/                # POS register interface
├── (auth)/               # Login, signup, invite acceptance
└── api/                  # Next.js API routes for BFF concerns only
```

---

## 4. Environments

| Env | URL | Purpose |
|---|---|---|
| local | `http://localhost:3000` (web), `http://localhost:4000` (api) | Development |
| preview | Vercel preview deploys per PR | Review |
| staging | `staging.app.example.com` | Pre-prod QA |
| production | `app.example.com` | Live |

Secrets via Doppler or 1Password Connect. No secrets in `.env` checked in. `.env.example` files committed.

---

## 5. Data model (core)

This is the **minimum** schema for the tenancy spine + Phase 1. Add columns as needed but do not drop or rename without migration.

### 5.1 Platform tables (no `business_id`)

```sql
-- Platform-level user (a super admin or any human in the system).
-- Note: a single user record can belong to multiple businesses via memberships.
users (
  id              uuid pk,
  email           citext unique not null,
  email_verified  boolean default false,
  password_hash   text,
  name            text,
  is_super_admin  boolean default false,
  two_factor_enabled boolean default false,
  two_factor_secret_encrypted text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz
)

sessions (
  id              uuid pk,
  user_id         uuid fk -> users.id,
  expires_at      timestamptz,
  ip              inet,
  user_agent      text,
  created_at      timestamptz default now()
)

businesses (
  id              uuid pk,
  slug            text unique not null,           -- url-safe; e.g. "acme-furniture"
  name            text not null,
  status          text not null,                  -- 'active' | 'suspended' | 'trial' | 'cancelled'
  plan            text,                            -- billing plan id
  trial_ends_at   timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz
)
```

### 5.2 Per-business tables (every row has `business_id`, RLS enforced)

```sql
locations (
  id              uuid pk,
  business_id     uuid fk -> businesses.id,
  name            text not null,
  timezone        text not null,
  address_json    jsonb,
  is_active       boolean default true,
  created_at      timestamptz default now()
)

memberships (
  -- Joins users to businesses with a role.
  id              uuid pk,
  business_id     uuid fk -> businesses.id,
  user_id         uuid fk -> users.id,
  role_id         uuid fk -> roles.id,
  status          text not null,                   -- 'active' | 'invited' | 'disabled'
  invited_by      uuid fk -> users.id,
  invited_at      timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz default now(),
  unique (business_id, user_id)
)

roles (
  id              uuid pk,
  business_id     uuid fk -> businesses.id,
  name            text not null,
  description     text,
  is_system       boolean default false,           -- system roles cannot be edited
  created_at      timestamptz default now(),
  unique (business_id, name)
)

role_permissions (
  role_id         uuid fk -> roles.id,
  permission      text not null,                   -- e.g. 'pos.transaction.create'
  primary key (role_id, permission)
)

membership_location_scopes (
  -- Optional: restricts a user to specific locations within a business.
  -- If no rows for a membership, the user has access to all locations.
  membership_id   uuid fk -> memberships.id,
  location_id     uuid fk -> locations.id,
  primary key (membership_id, location_id)
)

audit_logs (
  id              uuid pk,
  business_id     uuid,                            -- nullable for platform-level events
  actor_user_id   uuid,
  actor_type      text,                            -- 'user' | 'super_admin' | 'system'
  impersonator_user_id uuid,                       -- set if a super admin was impersonating
  action          text not null,                   -- e.g. 'product.update', 'auth.login'
  target_type     text,                            -- e.g. 'product'
  target_id       text,
  changes_json    jsonb,                           -- before/after diff
  ip              inet,
  user_agent      text,
  created_at      timestamptz default now()
)

-- Catalog
products (
  id              uuid pk,
  business_id     uuid fk -> businesses.id,
  sku             text,
  name            text not null,
  description     text,
  category_id     uuid,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (business_id, sku)
)

product_variants (
  id              uuid pk,
  business_id     uuid fk -> businesses.id,        -- denormalized for RLS
  product_id      uuid fk -> products.id,
  sku             text,
  name            text,
  attributes_json jsonb,                            -- {size: 'L', color: 'red'}
  price_cents     integer not null,
  cost_cents      integer,
  barcode         text,
  is_active       boolean default true,
  created_at      timestamptz default now()
)

categories (
  id              uuid pk,
  business_id     uuid fk,
  parent_id       uuid,
  name            text not null,
  position        integer default 0
)

-- Inventory
inventory_levels (
  id              uuid pk,
  business_id     uuid fk,
  variant_id      uuid fk -> product_variants.id,
  location_id     uuid fk -> locations.id,
  on_hand         integer not null default 0,
  reserved        integer not null default 0,      -- committed to open orders
  updated_at      timestamptz default now(),
  unique (variant_id, location_id)
)

inventory_movements (
  -- Append-only ledger. on_hand is derived from these.
  id              uuid pk,
  business_id     uuid fk,
  variant_id      uuid fk,
  location_id     uuid fk,
  delta           integer not null,                -- positive or negative
  reason          text not null,                   -- 'sale' | 'return' | 'adjustment' | 'receive' | 'transfer'
  reference_type  text,                            -- e.g. 'sale', 'po'
  reference_id    uuid,
  actor_user_id   uuid,
  notes           text,
  created_at      timestamptz default now()
)

-- Customers
customers (
  id              uuid pk,
  business_id     uuid fk,
  email           citext,
  phone           text,
  first_name      text,
  last_name       text,
  addresses_json  jsonb,
  notes           text,
  created_at      timestamptz default now()
)

-- Sales
sales (
  id              uuid pk,
  business_id     uuid fk,
  location_id     uuid fk,
  number          text not null,                    -- human-friendly: "INV-2026-000123"
  status          text not null,                    -- 'draft' | 'completed' | 'voided' | 'refunded' | 'partially_refunded'
  customer_id     uuid,
  associate_user_id uuid,                           -- selling cashier/associate
  subtotal_cents  integer not null,
  discount_cents  integer not null default 0,
  tax_cents       integer not null default 0,
  total_cents     integer not null,
  notes           text,
  completed_at    timestamptz,
  created_at      timestamptz default now(),
  unique (business_id, number)
)

sale_lines (
  id              uuid pk,
  business_id     uuid fk,
  sale_id         uuid fk -> sales.id,
  variant_id      uuid fk,
  description     text not null,                    -- snapshot of variant name at time of sale
  quantity        integer not null,
  unit_price_cents integer not null,
  discount_cents  integer not null default 0,
  tax_cents       integer not null default 0,
  total_cents     integer not null
)

payments (
  id              uuid pk,
  business_id     uuid fk,
  sale_id         uuid fk,
  method          text not null,                    -- 'cash' | 'card' | 'store_credit' | 'gift_card'
  amount_cents    integer not null,
  processor       text,                             -- 'stripe' if card
  processor_ref   text,                             -- Stripe PaymentIntent id
  status          text not null,                    -- 'pending' | 'succeeded' | 'failed' | 'refunded'
  created_at      timestamptz default now()
)

refunds (
  id              uuid pk,
  business_id     uuid fk,
  sale_id         uuid fk,
  reason          text,
  amount_cents    integer not null,
  approved_by_user_id uuid,
  created_at      timestamptz default now()
)
```

### 5.3 Money

All money is stored as **integer cents** in a single supported currency for MVP (USD). Add a `currency_code` column to `businesses` and `sales` in Phase 2 when multi-currency is needed.

### 5.4 Row-Level Security

Every per-business table has RLS enabled with this policy template:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON products
  USING (business_id = current_setting('app.current_business_id')::uuid);

CREATE POLICY super_admin_bypass ON products
  USING (current_setting('app.is_super_admin', true)::boolean = true);
```

The API sets `app.current_business_id` and `app.is_super_admin` at the start of every request via `SET LOCAL` inside a transaction. **Never bypass RLS by using a connection that runs as the table owner.** Use a dedicated `app_user` role.

---

## 6. Permission catalog

Permissions are **dotted strings**. Roles are bundles of permissions. Frontend gates UI; backend enforces every call. Both share the same catalog from `packages/shared`.

```ts
// packages/shared/src/permissions.ts
export const PERMISSIONS = {
  // Business settings
  'business.settings.view': 'View business settings',
  'business.settings.update': 'Update business settings',
  'business.billing.view': 'View billing',
  'business.billing.update': 'Update billing',

  // Users & roles
  'users.view': 'View users in business',
  'users.invite': 'Invite new users',
  'users.update': 'Update user details',
  'users.disable': 'Disable users',
  'roles.view': 'View roles',
  'roles.create': 'Create custom roles',
  'roles.update': 'Update roles',
  'roles.delete': 'Delete roles',

  // Locations
  'locations.view': 'View locations',
  'locations.create': 'Create locations',
  'locations.update': 'Update locations',
  'locations.delete': 'Delete locations',

  // Catalog
  'products.view': 'View products',
  'products.create': 'Create products',
  'products.update': 'Update products',
  'products.delete': 'Delete products',
  'products.cost.view': 'View product cost',
  'categories.manage': 'Manage categories',

  // Inventory
  'inventory.view': 'View inventory levels',
  'inventory.adjust': 'Adjust inventory',
  'inventory.receive': 'Receive inventory',
  'inventory.transfer': 'Transfer between locations',

  // Customers
  'customers.view': 'View customers',
  'customers.create': 'Create customers',
  'customers.update': 'Update customers',
  'customers.delete': 'Delete customers',

  // POS
  'pos.access': 'Access the POS register',
  'pos.transaction.create': 'Create sales',
  'pos.transaction.discount': 'Apply line/order discounts',
  'pos.transaction.void': 'Void open transactions',
  'pos.refund.create': 'Process refunds',
  'pos.refund.approve': 'Approve refunds above limit',
  'pos.cash.open': 'Open cash drawer',
  'pos.cash.reconcile': 'Reconcile cash drawer',

  // Reports
  'reports.sales.view': 'View sales reports',
  'reports.inventory.view': 'View inventory reports',
  'reports.financial.view': 'View financial reports (incl. cost/margin)',
  'reports.export': 'Export reports',

  // Audit
  'audit.view': 'View audit log',
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

### 6.1 System roles (seeded into every new business)

| Role | Permissions |
|---|---|
| **Owner** | All permissions in business |
| **Manager** | All except `business.billing.*`, `roles.delete`, `users.disable` |
| **Cashier** | `pos.access`, `pos.transaction.create`, `pos.transaction.discount` (with limit), `customers.view`, `customers.create`, `products.view`, `inventory.view` |
| **Inventory Clerk** | `products.view`, `inventory.*` |
| **Bookkeeper** | `reports.*` (read-only), `audit.view` |

System roles are not editable; admins clone them to create custom roles.

### 6.2 Permission modifiers

Some permissions need numeric limits (e.g. discount %, refund $ amount). Store as JSON on `role_permissions`:

```sql
ALTER TABLE role_permissions ADD COLUMN constraints_json jsonb;
-- example: {"max_discount_percent": 10, "max_refund_cents": 50000}
```

---

## 7. Phased roadmap

Each phase is a **shippable** milestone. Don't move to the next phase until acceptance criteria pass.

### Phase 0 — Foundation (week 1)
Bootstrap, conventions, CI, local dev environment. **Deliverable:** anyone can clone, `pnpm install`, `pnpm dev`, see Hello World on web and API.

### Phase 1 — MVP (months 1–5)
A single-business retailer can run their store on it end-to-end. **Deliverable:** below.

### Phase 2 — Operations (months 5–10)
Multi-location, purchase orders, delivery scheduling, financing connectors, customer portal.

### Phase 3 — Platform (months 10–18)
Open API, webhooks, e-commerce sync, advanced BI, accounting connectors, SOC 2.

---

## 8. Phase 0 — Foundation

### Epic 0.1 — Repo bootstrap
- [ ] Initialize Turborepo with pnpm workspaces, Node 22
- [ ] Create `apps/api`, `apps/web`, `packages/db`, `packages/shared`, `packages/ui`, `packages/config`
- [ ] Shared `tsconfig.base.json`, ESLint flat config, Prettier
- [ ] Husky + lint-staged for pre-commit
- [ ] `docker-compose.yml`: Postgres 16, Redis 7
- [ ] `.env.example` files for all apps
- [ ] `README.md` with setup steps

**Acceptance:** Fresh clone → `pnpm install && docker compose up -d && pnpm dev` runs both apps.

### Epic 0.2 — CI/CD
- [ ] GitHub Actions: lint, typecheck, unit tests, build on every PR
- [ ] Drizzle migration check (no untracked schema changes)
- [ ] Vercel preview deploys for `apps/web`
- [ ] Fly.io deploy script for `apps/api`

### Epic 0.3 — Observability baseline
- [ ] Pino logger configured in API with request id middleware
- [ ] Sentry SDK in both apps
- [ ] `/health` and `/ready` endpoints on API

---

## 9. Phase 1 — MVP epics

Each epic below is a ticket Claude Code can work on independently in the listed order. Each story includes acceptance criteria.

### Epic 1.1 — Database & RLS spine
1. Drizzle schema for §5.1 and §5.2 tables
2. RLS policies for every per-business table
3. Migration system with up/down, generated from Drizzle
4. Seed script that creates: a super admin user, one demo business, system roles, one location, sample products
5. Integration test that verifies cross-tenant isolation: a query as Business A cannot see Business B rows

**Acceptance:** `pnpm db:reset && pnpm db:seed` produces a working dev database. RLS isolation test passes.

### Epic 1.2 — Auth (better-auth integration)
1. Email + password sign-up (super admin only initially; business sign-up by invite in MVP)
2. Email + password login
3. Email verification via Resend
4. Password reset flow
5. TOTP 2FA (optional per user, required for super admins)
6. Session management: list active sessions, revoke
7. Rate limiting on auth endpoints (Redis-backed)

**Acceptance:** A super admin can sign up, verify email, enable 2FA, log in, log out, reset password. All flows have E2E tests.

### Epic 1.3 — Tenancy middleware & request context
1. NestJS guard that resolves the active business from the user's session (a user picks a business after login if they belong to multiple)
2. Postgres connection wrapper that sets `SET LOCAL app.current_business_id` and `app.is_super_admin` per request inside a transaction
3. Permission decorator: `@RequirePermission('products.create')`
4. `current-user` decorator that injects user + active business + permissions into handlers

**Acceptance:** A handler decorated with `@RequirePermission('products.view')` returns 403 if the user's role lacks it.

### Epic 1.4 — Audit log
1. NestJS interceptor that logs every state-changing call (POST/PUT/PATCH/DELETE) to `audit_logs`
2. Diff helper that records before/after for entity updates
3. Audit log viewer UI for business admins (filter by user, action, date)

**Acceptance:** Updating a product price creates an `audit_logs` row with the old and new prices. Viewable in admin UI.

### Epic 1.5 — Super admin console
Routes under `(super-admin)` group, gated by `users.is_super_admin`.

1. List businesses (status, plan, location count, user count, last activity)
2. Create business (form: name, slug, owner email → invite email sent)
3. Suspend / unsuspend business (sets `businesses.status`)
4. Impersonate business user (sets a session flag; banner shows in UI; audit-logged on every action)
5. Platform metrics dashboard (basic counts: businesses, users, sales last 30d)

**Acceptance:** Super admin can create a new business, invite an owner, see the invite email, and impersonate after the owner accepts.

### Epic 1.6 — Business admin console
Routes under `(business)` group.

1. **Settings:** business name, default tax rate, currency (USD only for MVP), receipt header/footer
2. **Locations:** CRUD with timezone and address
3. **Users:** invite by email + role; list members; resend invite; disable
4. **Roles:** view system roles; clone to custom; permission editor (checkbox grid by module); delete custom roles
5. **Tax rates:** simple flat per location for MVP (no jurisdictional complexity yet)

**Acceptance:** A business owner can invite a cashier, the cashier accepts and lands logged in with cashier permissions only.

### Epic 1.7 — Product catalog
1. Categories CRUD (tree, max 3 levels deep for MVP)
2. Products CRUD with multiple variants
3. Variant fields: SKU, barcode, name, price, cost (cost requires `products.cost.view`), attributes (free-form JSON)
4. Image upload to R2 (signed URL flow); 4 images per product max
5. Search: full-text on name, SKU, barcode (Postgres tsvector)
6. CSV import (upload, preview, commit) — at least: name, sku, price, barcode

**Acceptance:** A user can create a product with 3 variants, upload images, and find it by partial SKU and barcode.

### Epic 1.8 — Inventory
1. Inventory level view per location (table: variant, on-hand, reserved, available)
2. Manual adjustment with reason ("count correction", "damage", "theft", "other")
3. Receive inventory: pick a location, scan/search variants, enter quantities, commit (writes `inventory_movements` rows)
4. All adjustments audit-logged with actor and reason

**Acceptance:** Receiving 10 units of variant X at location Y increases `on_hand` by 10 and creates one `inventory_movements` row.

### Epic 1.9 — Customer records
1. CRUD: name, email, phone, addresses, notes
2. Search (name, email, phone)
3. Customer detail page with purchase history (lists sales once Epic 1.10 ships)

**Acceptance:** A cashier can create a customer mid-sale (modal) and the customer is attached to the sale.

### Epic 1.10 — POS register (the big one)
Routes under `(pos)` group, gated by `pos.access`. Optimized for keyboard + barcode scanner.

1. **Register layout:** large product search/scan input, cart on left, totals on right, customer attach button
2. **Add to cart:** by SKU/barcode scan (auto-add qty 1) or by search-and-click
3. **Cart operations:** change quantity, remove line, line discount (% or $), order discount
4. **Tax calculation:** apply location's tax rate to taxable subtotal
5. **Checkout flow:**
   - Click "Pay" → payment screen
   - Tender types: cash, card, split tender (multiple payments per sale)
   - Cash: enter amount tendered, calculate change
   - Card: create Stripe PaymentIntent → push to Stripe Terminal reader → poll until succeeded/failed
6. **Complete sale:** atomic transaction:
   - Insert `sales`, `sale_lines`, `payments`
   - Insert `inventory_movements` with `reason='sale'`
   - Update `inventory_levels.on_hand`
   - Generate sale number
   - Audit log
7. **Receipt:** render HTML receipt; print via `window.print()` for MVP (network printer integration in Phase 2); email receipt option
8. **Void:** before completion only; permission `pos.transaction.void`
9. **Refund:** open completed sale, pick lines and quantities to refund, choose tender; reverses inventory; permission `pos.refund.create`; over-limit requires approval (`pos.refund.approve`) via PIN re-auth modal
10. **Offline guard for MVP:** if the user goes offline mid-sale, block payment and show clear message. Real offline mode is Phase 2.

**Acceptance:** A cashier can complete a sale paid 50% cash, 50% card, see inventory decrement, view in sales list, refund a single line, and have the inventory restored.

### Epic 1.11 — Reports (basic)
1. **Daily sales:** date range picker, totals by day, by associate, by payment method
2. **Sales by product:** quantity, revenue, margin (margin requires `reports.financial.view`)
3. **Inventory on hand:** snapshot per location, low-stock filter
4. **Cash drawer reconciliation:** open shift, end shift, expected vs counted
5. **Export:** CSV download for all reports

**Acceptance:** End-of-day close: a cashier reconciles cash, an owner views the day's totals, exports to CSV.

### Epic 1.12 — Billing (platform → businesses)
1. Stripe Billing integration; one product, two plans (Starter, Pro), per-location pricing
2. Trial period (14 days) on business creation
3. Subscription enforced: API returns 402 + read-only mode if subscription lapses
4. Self-serve plan change in business admin

**Acceptance:** A business in trial, when trial ends without payment, becomes read-only across all UIs except billing settings.

---

## 10. Development conventions

### 10.1 API
- REST, JSON. URL pattern: `/v1/{resource}` for business-scoped, `/v1/admin/{resource}` for super admin.
- Every list endpoint paginates (`?limit=50&cursor=...`). Cursor-based, never offset.
- Every response that creates/updates returns the full entity.
- Errors: `{ error: { code, message, details } }`. Use HTTP status codes correctly.
- Validation: zod schemas in `packages/shared`, used by both client and server.
- Idempotency: write endpoints accept `Idempotency-Key` header; cached for 24h in Redis.

### 10.2 Database
- Migrations are **append-only**. Never edit a committed migration; write a new one.
- Every migration must run on prod data without locking tables for more than 1 second. Use `CONCURRENTLY` for indexes.
- Foreign keys must have indexes.
- Soft delete only `users` and `businesses`. Everything else is hard-deleted with CASCADE-protected references.

### 10.3 Frontend
- Server Components by default; mark interactive trees with `"use client"`.
- All forms: react-hook-form + zod. No raw `<form>` state.
- All data fetching: TanStack Query for client; server actions or RSC fetch for server.
- All money displayed via a `<Money cents={...} />` component that handles formatting.
- Permission gates: `<Can permission="products.create">...</Can>` component reads from auth context.

### 10.4 Testing
- Every API module has integration tests against a real Postgres (testcontainers) covering happy path, permission denial, and tenant isolation.
- Unit tests for pure functions (tax calc, discount calc, change calc) — these are bug magnets.
- Playwright E2E covers: signup → create business → invite user → cashier completes a sale → refund.
- Coverage gate: 70% for `apps/api`, 50% for `apps/web` to start.

### 10.5 Git
- Trunk-based, short-lived feature branches.
- Conventional Commits.
- Squash merge to `main`.
- `main` always deployable.

### 10.6 Security baseline
- Never log secrets, tokens, or PII.
- Hash passwords with argon2id (better-auth default).
- All cookies: `Secure`, `HttpOnly`, `SameSite=Lax` (or `Strict` for auth).
- CSP headers on web; CORS locked to known origins on API.
- Rate limit: 100 req/min/user globally, 5/min on auth endpoints.
- Dependabot + npm audit in CI.

---

## 11. Bootstrap order for Claude Code

When starting fresh, work top to bottom:

1. **Phase 0 in full** (Epics 0.1, 0.2, 0.3) — do not skip. The whole rest of the plan depends on it.
2. **Epic 1.1** (DB & RLS) — **must** be solid before anything else. Write the cross-tenant isolation test first.
3. **Epic 1.2** (Auth) — gate everything else.
4. **Epic 1.3** (Tenancy middleware) — every other endpoint depends on it.
5. **Epic 1.4** (Audit log) — wire it before there's anything to audit, so it's free to add as features land.
6. **Epic 1.5 + 1.6** (admin consoles) — needed to create test data through real UI flows.
7. **Epics 1.7 → 1.11** can interleave but the order listed minimizes blocking.
8. **Epic 1.12** (Billing) is last in MVP — don't let it block earlier work.

---

## 12. Open questions to resolve before each phase

These are deliberately left for the human owner to decide as we approach each phase. Do not invent answers; ask.

**Phase 1:**
- Stripe account setup: who owns it? Production keys management?
- Domain name and email sender domain for Resend.
- Logo and basic branding for the receipt and login screens.

**Phase 2:**
- Subdomain-per-tenant migration? (Currently single-domain.)
- Which financing partners to integrate first?
- Network thermal printer model to officially support.

**Phase 3:**
- SOC 2 readiness partner (Vanta, Drata, Secureframe).
- Public API rate limits and pricing tiers.
- E-commerce platform priority order.

---

## 13. Definition of Done (MVP)

The MVP is done when **every** statement below is true:

- [ ] A super admin can sign up, create a business, invite an owner, and the owner can log in.
- [ ] The owner can create a location, invite a cashier, define a custom role, and the cashier sees only what their role permits.
- [ ] The owner can import 100 products from CSV with images, set tax, set up Stripe.
- [ ] A cashier can complete a sale with split tender (cash + card), print a receipt, and the inventory decrements correctly.
- [ ] A cashier can refund part of a completed sale, requiring approval if over the limit, and inventory increments correctly.
- [ ] An owner can run a daily sales report, an inventory on-hand report, export both to CSV, and reconcile the cash drawer.
- [ ] A bookkeeper-role user can view reports but cannot create products, voids, or refunds.
- [ ] Every state change appears in the audit log with actor, before, and after.
- [ ] Cross-tenant isolation tests pass; RLS prevents data leakage even when application code is buggy.
- [ ] The platform is deployed to production with monitoring, error tracking, and backups.
- [ ] A retailer not affiliated with the team can be onboarded in under 30 minutes with no engineering help.

---

## 14. What this plan deliberately leaves to the implementer

These are details that should be decided at implementation time, not pre-specified:

- Component-level UI/UX details beyond "shadcn/ui + sensible Tailwind"
- Specific table/index tuning beyond foreign-key indexes
- Exact wording of error messages and emails
- Visual design system (colors, typography) — pick sensible defaults, refine later
- Internal directory layout within each app/package beyond top-level conventions

When in doubt: choose the simpler option and leave a `// TODO` with a link to a tracking issue.


---

## 15. Amendment — Account model: agency vs SaaS sub-accounts (2026-09-06)

Owner decision. The platform serves two kinds of business, and the console
the platform owner uses must treat them differently.

### 15.1 Account kinds

| Kind | Who | Billing | Read-only mode |
|------|-----|---------|----------------|
| `agency` | The owner's own operation — LA Mattress stores today | Never billed. No trial, no plan enforcement. | Never. `SubscriptionGuard` passes agency accounts through unconditionally. |
| `saas` | Any other business onboarded onto the platform | Trial (14 days) → plan (Starter / Pro, per-location pricing, §Epic 1.12) | When the trial lapses or the subscription is `past_due` / `canceled` (unchanged). |

`businesses.account_kind text not null default 'saas'`. A super admin flips
the kind from the account page; marking a business `agency` also clears any
trial / lapse so it can never be blocked. Converting back to `saas` leaves the
subscription row alone — activate a plan from the Subscription card.

### 15.2 Platform-billing ledger

`subscription_payments` (tenant-scoped, RLS) records every payment made toward a
SaaS account's subscription: amount (integer cents), `status`
(`paid` / `failed` / `refunded`), `method` (`manual` / `stripe` / `comp`), the
period it covers, a reference, a note, who recorded it. A `paid` row marks the
subscription `active`, clears the trial, and stamps the covered period on the
subscription. Today rows are recorded by the super admin from the console;
the Stripe Billing webhook writes `method = 'stripe'` rows once wired. Agency
accounts never get rows (409).

### 15.3 Owner console (super admin)

`/v1/admin/accounts` is the read / manage surface over every sub-account;
`/v1/admin/businesses` stays the provisioning surface (create, suspend,
activate plan).

- `GET /v1/admin/accounts[?kind=]` — every account with kind, plan,
  subscription state, `readOnly`, MRR (0 for agency), users, locations, last
  activity, last payment.
- `GET /v1/admin/accounts/:id` — the above plus subscription detail, resource
  usage (locations, members, products, customers, orders and sales in the last
  30 days) and a payments summary.
- `PATCH /v1/admin/accounts/:id/kind` — `{ accountKind }`.
- `GET /v1/admin/accounts/:id/members` — who can sign in, with role.
- `GET | POST /v1/admin/accounts/:id/payments` — ledger + record a payment.
- `GET /v1/admin/metrics` now reports account counts by kind, subscription
  state counts, MRR, and trials ending within 7 days.

Console pages: **Accounts** list (kind filter, plan, subscription badge with a
read-only flag, MRR) and the account page (Account kind, Subscription,
Resources, Users with impersonate, Payments with a record form).

Every mutation is audited: `business.account_kind.update`,
`business.subscription.activate`, `billing.payment.recorded`.

### 15.4 Not in this amendment (follow-ups)

- ~~Stripe Billing: checkout, invoices, webhook → `subscription_payments`.~~ Built — §15.5.
- Plan limits (max locations / users) enforced from the plan catalog.
- Self-serve plan changes on the tenant Billing page (paused, per Epic 1.12 §4).
- Per-account resource quotas (storage, API calls) — counted, not enforced.

### 15.5 Stripe Billing (2026-09-06)

SaaS accounts pay through Stripe Billing on the **platform's** Stripe account (the
same `STRIPE_SECRET_KEY` as Connect, without the `Stripe-Account` header). One
product, two monthly per-location Prices (`STRIPE_PRICE_STARTER_PER_LOCATION`,
`STRIPE_PRICE_PRO_PER_LOCATION`), and a dedicated endpoint secret
(`STRIPE_BILLING_WEBHOOK_SECRET`) for `POST /v1/billing/stripe/webhook`.

- **Checkout.** `POST /v1/billing/checkout { plan }` (`business.billing.update`)
  creates a subscription-mode Checkout Session: quantity = locations (min 1),
  customer reused from `subscriptions.stripe_customer_id` or created by Stripe,
  `client_reference_id` + metadata carry the business id and plan. Agency accounts
  → 409. Activation is **not** done here; the webhook does it.
- **Portal.** `POST /v1/billing/portal` opens the Stripe Customer Portal for cards,
  invoices, quantity and cancellation. Needs a customer id (409 otherwise).
- **Webhook** (Public, raw body, signature-verified, idempotent via
  `stripe_webhook_events`, always 200 once recorded):
  `checkout.session.completed` → active + ids; `customer.subscription.created|updated`
  → status map (`active|trialing→active`, `past_due|unpaid|incomplete|paused→past_due`,
  `canceled|incomplete_expired→canceled`), period, quantity → `paid_location_count`,
  plan from the Price id; `customer.subscription.deleted` → canceled;
  `invoice.paid|payment_succeeded` → one `subscription_payments` row per invoice
  (`method='stripe'`, `reference` = invoice id, period from the first line) and active;
  `invoice.payment_failed` → a `failed` ledger row and past_due. Every projection
  mirrors `businesses.status/plan`, clears `trial_ends_at`, and writes an audit row
  `billing.stripe.sync`. Agency accounts are never driven by Stripe state.
- **Guard rails.** With real Stripe Billing live (key + prices), the inline
  `POST /v1/billing/subscribe` refuses (409): a subscription only becomes active through
  a paid Checkout. Stub mode (no key) keeps every path usable locally: checkout / portal
  return same-origin URLs and the webhook accepts unsigned JSON.
- **Tenant UI.** The Billing page's Subscription card shows the plan picker and
  "Subscribe with Stripe" while not on an active Stripe subscription, "Manage billing"
  once a customer exists, and the `?checkout=success|cancelled` outcome. Agency accounts
  see "house (not billed)".
- **Ops.** Create the product + two Prices in the Stripe dashboard, add the three env
  vars on Render, register the webhook endpoint for the six event types above.
