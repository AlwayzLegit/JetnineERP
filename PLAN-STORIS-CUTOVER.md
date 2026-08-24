# STORIS Cutover Sprint — 10-Day Plan (Phase 3)

> **Mission:** Jetnine fully replaces STORIS in 10 days. Nothing goes public — the
> goal is that **our own store(s) run entirely on Jetnine**, with **complete data
> migrated from STORIS and reconciled**, QA'd well enough that the STORIS
> subscription can be cancelled at the end of the sprint.
>
> **Audience:** Same contract as `PLAN.md` — this is the source of truth for the
> sprint. Decisions here are **locked**. Change this doc first, then the code.
>
> **Critical path is the data, not the features.** Every day that the STORIS
> export slips, the whole sprint slips. Extraction starts Day 1, while the
> subscription is still active.

---

## 1. Where we start (leverage)

Phases 0–2 are complete. Already built and working:

- Multi-tenant spine: shared schema, `business_id` on every tenant row, **Postgres RLS**
- better-auth (orgs, 2FA, invites), roles + granular permission catalog, multi-location
- Product catalog (products/variants/categories, CSV import, images), inventory
  levels + movements (`on_hand`, `reserved`), vendors + purchase orders, stock transfers
- Customers, cash-and-carry **POS** (sales, sale_lines, payments, refunds), gift
  cards/store credit, discount codes, tax classes (per product + per location), multi-currency
- Offline POS (queue + service worker + Playwright e2e), receipt printing
- Reports + cash drawer/shifts, platform billing, Stripe Connect + webhooks
- Public API (API keys, idempotency, cursor pagination, OpenAPI), audit log, outbound webhooks

## 2. Gap analysis vs STORIS

What STORIS does that Jetnine doesn't yet — all in scope for this sprint:

| # | Gap | STORIS concept |
|---|-----|----------------|
| G1 | **Sales orders** with deposits & balance due | Order entry: write order today, deliver later |
| G2 | **Delivery / fulfillment scheduling** | Delivery calendar, routes, order completion at delivery |
| G3 | **Special orders → PO link** | Sell not-in-stock, generate/link POs, arrival tracking |
| G4 | **Financing & layaway** | 3rd-party financing tenders; in-house payment plans |
| G5 | **Commissions** | Salesperson attribution, plan-based commission accrual |
| G6 | **Service orders** | Repairs/warranty intake → track → charge → complete |
| G7 | **Serialized inventory** (lean) | Serial per big-ticket unit, needed by G6 |
| G8 | **AR view & customer statements** (lean) | Open balances across orders/plans |
| G9 | **Legacy history** | Customer purchase history + reporting continuity |

GHL-inspired platform layer (also in scope, but **never allowed to block cutover**):

| # | Feature |
|---|---------|
| P1 | **Snapshots / business templates** — clone a configured business's roles, categories, tax setup, settings (optionally catalog) into new tenants |
| P2 | **Agency tier** — platform → agency → business → location; agency console over its businesses |
| P3 | **White-label** — per-business logo/colors/theming; subdomain/custom-domain resolution |
| P4 | **CRM + marketing basics** — notes, tags, customer timeline, segment email blasts (Resend), simple post-purchase automation |

## 3. Locked sprint decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | `sales` (POS cash-and-carry) stays **untouched**; order-based selling is a new `orders` aggregate. Reports union both. | Don't destabilize the working POS mid-cutover. Unification can come in Phase 4. |
| D2 | Generalize `payments`: `sale_id` becomes nullable, add nullable `order_id`, CHECK exactly-one-of. A **deposit is just a payment on an open order**. | One payments table for tenders, cash drawer, and reconciliation. |
| D3 | Stock commitment uses existing `inventory_levels.reserved` + `inventory_movements` with new reasons (`order_reserve`, `order_release`, `order_fulfill`). | Column already exists; movements stay the single audit trail. |
| D4 | Serialized inventory is **opt-in per product** (`products.serial_tracked`), lean `serial_units` table. | Full serial costing is out of scope; identity + status is enough for G6/G7. |
| D5 | Financing = **tender recording only** (`method='financing'` + provider + reference). No Synchrony/Wells API integration this sprint. | Those APIs need partner agreements; record-keeping achieves STORIS parity for daily ops. |
| D6 | All money stays integer cents; all new tables carry `business_id` + RLS policies + zod schemas in `packages/shared`, per existing conventions. | Consistency with Phases 0–2. |
| D7 | Migration is **repo code, idempotent, re-runnable**: CSV → staging tables → validation → upsert keyed by `legacy_refs(entity, legacy_id → id)`. Never a pile of one-off scripts. | We will run it at least 3 times (two rehearsals + final delta). |
| D8 | Legacy history imports as `orders`/`sales` flagged `imported_at IS NOT NULL`, **excluded** from cash-drawer, commission accrual, and webhook emission. | History without side effects. |
| D9 | Agency tier is **additive**: `businesses.agency_id` nullable; behavior with `NULL` agency is byte-for-byte today's behavior. | P2 can never break single-business tenants. |
| D10 | Deployment for go-live: API must run on an **always-on instance** (Render paid tier or equivalent). A free tier that sleeps 15 min is unacceptable for a live register. | 30s cold start at the register is a failed cutover. |
| D11 | Production go-live happens in a **fresh business (tenant)** — the current staging business, with all its QA/browser-test data, is kept as a permanent test tenant and never promoted. The real STORIS import, Shopify sync, locations, staff, and settings are (re)run into the new production business at cutover. A running ledger of QA data lives in SPRINT-STATUS under "Test-data ledger". | Multi-tenancy makes a clean cutover free: no purge script over live tables, zero risk of a test sale/campaign/customer surviving into production books. |

## 4. Data model — new tables

All tables: `id uuid pk`, `business_id` FK → RLS, `created_at`; naming and index style follows `packages/db/src/schema/*`.

### 4.1 Orders & fulfillment (G1, G2)

```
orders (
  business_id, location_id, number ("SO-2026-000123", unique per business),
  status: 'quote' | 'open' | 'partially_fulfilled' | 'fulfilled' | 'completed' | 'cancelled',
  customer_id (NOT NULL — orders always have a customer, unlike POS sales),
  salesperson_membership_id, second_salesperson_membership_id, split_bps,
  subtotal_cents, order_discount_cents, discount_cents, tax_cents, total_cents,
  deposit_required_cents,            -- policy: e.g. 25% of total, editable per order
  fulfillment_type: 'delivery' | 'pickup',
  address snapshot fields (line1/line2/city/region/postal/phone),
  requested_date, notes, internal_notes,
  imported_at, legacy_number,        -- D8
  completed_at, cancelled_at, created_at
)

order_lines (
  business_id, order_id, variant_id, description, quantity,
  qty_reserved, qty_fulfilled,
  line_type: 'stock' | 'special_order',
  unit_price_cents, discount_cents, tax_cents, total_cents,
  tax_class_id, serial_unit_ids uuid[],       -- filled at fulfillment when serial-tracked
)

deliveries (
  business_id, location_id, order_id,
  scheduled_date, window_start, window_end,
  status: 'scheduled' | 'loaded' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled',
  driver_membership_id, route_position int, notes, completed_at
)

delivery_lines ( business_id, delivery_id, order_line_id, quantity )
```

Two clarifications made while building Day 1: the split is stored in **basis points**
(`split_bps`, 0–10000) rather than a percent, matching every other rate in the codebase;
and the operator's order-level discount is kept in its own `order_discount_cents`
column, with `discount_cents` remaining the line+order aggregate that
`sales.discount_cents` already means. Totals are recomputed from the lines after every
edit, and that recompute needs the operator's input back — reading the aggregate would
compound the discount on each edit.

Derived, never stored: `paid_cents` = Σ succeeded payments; `balance_due_cents` =
`total_cents − paid_cents`. Status transitions are service-enforced, movements written
per D3. Completing the last delivery/pickup fulfills the order; **completion requires
balance due = 0** (or explicit `orders.complete_with_balance` permission → AR, G8).

### 4.2 Payments generalization (D2)

```
ALTER payments: sale_id nullable, ADD order_id nullable,
  CHECK (num_nonnulls(sale_id, order_id) = 1),
  ADD kind: 'sale' | 'deposit' | 'balance' | 'installment',
  method gains: 'financing' | 'external_card' | 'check',
  ADD financing_provider, financing_ref
```

Cash-drawer/shift math (Epic 1.11) picks up order payments by location+day exactly like sale payments.

### 4.3 Special orders → PO (G3)

```
po_line_allocations (
  business_id, po_line_id, order_line_id, quantity,
  status: 'ordered' | 'received' | 'cancelled'
)
```

- "To-order queue": open `order_lines` with `line_type='special_order'` not fully allocated.
- Generate-PO-by-vendor action groups queue lines into draft POs (existing purchasing module).
- Receiving a PO line auto-updates allocations → marks order lines *arrived* → emails the
  customer ("your item is in") via Resend + surfaces the order in delivery scheduling.

### 4.4 Financing & layaway (G4)

```
payment_plans (
  business_id, order_id, type: 'layaway' | 'in_house',
  status: 'active' | 'completed' | 'defaulted' | 'cancelled',
  installment_amount_cents, frequency: 'weekly' | 'biweekly' | 'monthly', start_date
)
payment_plan_installments (
  business_id, plan_id, seq, due_date, amount_cents,
  paid_payment_id, status: 'due' | 'paid' | 'overdue' | 'waived'
)
```

Nightly job (BullMQ/cron): mark overdue, send reminder emails. Overdue report in back office.

### 4.5 Commissions (G5)

```
commission_plans (
  business_id, name, basis: 'percent_of_sale' | 'percent_of_margin', rate_bps
)
memberships += commission_plan_id
commission_entries (
  business_id, membership_id, source: order_id | sale_id, basis_cents, amount_cents,
  status: 'pending' | 'approved' | 'paid', accrued_at, period fields
)
```

Accrue at order **completion** / sale completion; refunds create negative entries.
Report: by salesperson × period, with approve/mark-paid actions.

### 4.6 Service orders (G6) + serials (G7)

```
serial_units (
  business_id, variant_id, serial, location_id,
  status: 'in_stock' | 'committed' | 'sold' | 'in_service' | 'returned',
  order_line_id, customer_id            -- set when sold
)
products += serial_tracked boolean default false

service_orders (
  business_id, location_id, number ("SV-..."), customer_id,
  serial_unit_id | free-text item_description,
  issue, status: 'intake' | 'awaiting_parts' | 'in_service' | 'ready' | 'completed' | 'cancelled',
  technician_membership_id, warranty boolean,
  subtotal/tax/total cents, completed_at
)
service_order_lines ( parts + labor lines, same shape as order_lines-lite )
service_order_notes ( timestamped notes / status timeline )
```

### 4.7 CRM & platform (P1–P4)

```
customer_notes ( business_id, customer_id, author_membership_id, body )
customer_tags ( business_id, name, color ) + customer_tag_links
email_campaigns ( business_id, name, segment_json, subject, body_html,
                  status: 'draft' | 'sending' | 'sent', sent_count, sent_at )
automations ( business_id, trigger: 'order_completed' | 'sale_completed' | 'service_ready',
              delay_hours, template fields, enabled )

business_templates ( name, source_business_id, snapshot_json, created_by, scope flags:
                     roles/categories/tax/settings/products )   -- platform-level (P1)
agencies ( name, owner_user_id, branding_json )                 -- platform-level (P2)
businesses += agency_id nullable, branding_json (logo_url, colors), subdomain unique nullable (P3)
memberships: agency-scoped memberships (agency_id XOR business_id)
legacy_refs ( business_id, entity, legacy_id, jetnine_id, source, import_batch_id,
              unique(business_id, entity, legacy_id) )                        -- D7
import_batches ( business_id, entity, source, filename, status, mapping_json,
                 validation_json, row/valid/invalid/committed counts,
                 uploaded_by_user_id, validated_at, committed_at )            -- staging
import_rows ( business_id, batch_id, row_number, legacy_id, raw_json,
              normalized_json, status, errors_json, jetnine_id )              -- staging
```

The importer's staging tables live in the **public schema as ordinary tenant tables**
(`import_batches` / `import_rows`), not in a separate `staging` Postgres schema as the
sketch above originally read. They then inherit the same RLS policy, `business_id`
indexing, and migration tooling as every other table; a separate schema would need its
own grants and policy wiring for no gain. They are entity-agnostic — one batch per
uploaded CSV, one row per source line, `raw_json` kept alongside `normalized_json` so a
recon mismatch traces back to the exact source line without re-uploading.

Customer **timeline** = merged feed of sales, orders, deliveries, service orders, plans,
notes, campaigns — read-model query, no new event table.

## 5. Permission catalog additions

`orders.view/create/update/cancel`, `orders.deposit.take`, `orders.complete_with_balance`,
`deliveries.view/schedule/complete`, `special_orders.manage`,
`payment_plans.view/manage`, `commissions.view_own/view_all/manage`,
`service_orders.view/create/update/complete`, `serials.view/manage`,
`crm.notes.manage`, `crm.tags.manage`, `crm.campaigns.manage`, `crm.automations.manage`,
`import.run` (migration), and super-admin-only: `platform.templates.manage`, `platform.agencies.manage`.
Seed into system roles per Epic 1.6 conventions (Owner/Admin get all; POS role gets
orders create/deposit + deliveries view; etc.).

## 6. Backend & frontend surfaces

New NestJS modules mirror existing patterns (controller/service, zod DTOs from
`packages/shared`, tenancy context, audit log writes, outbound webhook events):

| Module | Endpoints (v1) | Web UI (App Router) |
|--------|----------------|---------------------|
| `orders` | CRUD, `:id/lines`, `:id/payments` (deposit/balance), `:id/reserve`, `:id/cancel`, `:id/complete` | `(business)/orders` — pipeline board (quote→open→…), **order writer** screen (shared components with POS cart), order detail w/ payments & timeline; POS gets "Save as order / take deposit" |
| `deliveries` | CRUD, calendar query, `:id/status`, route reorder | `(business)/deliveries` — week/day calendar, drag to schedule, driver day-sheet (print), complete-with-balance-collection flow |
| `special-orders` | queue, `generate-pos`, allocations | `(business)/purchase-orders` gains To-Order queue tab + arrival board |
| `payment-plans` | CRUD, `:id/installments/:seq/pay` | order detail tab + `(business)/reports/receivables` |
| `commissions` | plans CRUD, entries query, approve/pay | `(business)/commissions` report + settings |
| `service` | CRUD, notes, status, lines, complete | `(business)/service` — intake form, board by status, ticket detail/print |
| `serials` | per-variant units CRUD, lookup by serial | inventory detail tab; serial picker in fulfillment/service |
| `crm` | notes/tags CRUD, timeline, campaigns (+send), automations | customer detail becomes timeline page; `(business)/marketing` |
| `templates` (platform) | snapshot create/apply | `(super-admin)` — save-as-template, create-business-from-template |
| `agencies` (platform) | CRUD, membership, business list | `(agency)` route group: dashboard, businesses, cross-business sales rollup |
| `import` | staged upload, validate, commit, recon report | `(business)/settings/import` wizard (upload → map → validate → commit → recon) |

White-label (P3): middleware resolves subdomain → business, injects branding
(CSS vars + logo) into `(business)` and `(pos)` layouts; login page skinned per business.

## 7. STORIS data migration (the critical path)

STORIS runs on Rocket UniData/UniVerse. Extraction routes, in order of preference:
**(a)** STORIS report writer / built-in exports to CSV/Excel, **(b)** ODBC/JDBC pull,
**(c)** paid data extract from STORIS support. **Start Day 1 while the subscription is live**,
and take a final **archive of everything** before cancelling regardless.

**Entities to extract** (target CSV per entity): customers; vendors; products/SKUs
(cost, price, vendor, category, tax class, serial flag); on-hand by location (+serials);
**open sales orders** (headers, lines, deposits held, promised dates); open POs & special-order
links; open layaway/financing balances; AR balances; closed sales/order **history**
(as deep as extractable — minimum 24 months, else summarized totals per invoice); commission
plan assignments.

**Pipeline (D7):** upload CSV → `staging.*` raw rows → mapping config per entity
(column → field, value transforms) → **validation report** (missing FKs, bad money,
duplicate legacy ids, unknown SKUs — human-readable, fix-and-rerun) → **commit** as upserts
through `legacy_refs` → **reconciliation report**.

**Reconciliation gates (must match STORIS reports to the cent before go-live):**

1. Row counts per entity (customers, SKUs, open orders, open POs)
2. Inventory: units on hand per location + inventory valuation at cost
3. Σ deposits held on open orders
4. Σ open layaway/AR balances
5. Spot-check 20 random customers' history side-by-side

**Rehearsals:** full import into a throwaway `migration-rehearsal` tenant on Day 7 and
Day 8; **final delta** (records changed since last export) into the production tenant on Day 10.

## 8. Day-by-day schedule

Two tracks each day: **Build** (Claude Code) and **Ops** (you — exports, hardware, verification).
Feature branches per epic, squash-merge to `main`, CI green before merge, per `PLAN.md` §10.5.

| Day | Build track | Ops track |
|-----|-------------|-----------|
| **1** | Schema batch 1 (orders, order_lines, deliveries, payments generalization, legacy_refs, staging) + migrations + RLS; `orders` service/API with totals, deposits, reserve logic + unit tests | **Kick off every STORIS export** (§7 list). Inventory of current card processor; order Stripe Terminal readers **today** (shipping lead time) or confirm interim standalone terminal |
| **2** | Order writer UI + pipeline board + order detail; POS "save as order / take deposit"; committed-stock views; delivery schema wired | Chase exports; document current STORIS daily routine (open/close, reports staff rely on) as QA script |
| **3** | Delivery calendar + day-sheet + fulfillment flow (stock decrement, serial pick, balance collection, order receipts); reports union sales+orders | First export files land → sanity-read together; freeze SKU/category cleanup decisions |
| **4** | Special-orders queue → generate/link POs → receiving allocations + arrival emails; serial_units (lean) + product flag | Verify sample POs/special orders against STORIS screens |
| **5** | Financing tender + layaway `payment_plans` + overdue job/report; commissions (plans, accrual, report, refund reversal) | Provide real commission rules + financing providers list; validate math on 5 historical examples |
| **6** | Service orders module (intake→board→ticket→charges); CRM: notes, tags, timeline; AR/receivables report + customer statement print | Walk through service workflow; list any STORIS report not yet covered |
| **7** | **Import pipeline** (§7) end-to-end; rehearsal import #1 into throwaway tenant; recon report v1 | Review recon report #1 line by line vs STORIS reports; log every mismatch |
| **8** | Fix import mismatches → rehearsal #2; platform layer: snapshots/templates, agency tier (D9), white-label branding + subdomain middleware; **deploy hardening (D10): always-on API instance, backups, Sentry alerts** | Recon #2 sign-off target; choose hosting plan; DNS for subdomain if wanted now |
| **9** | QA day: Playwright e2e for order→deposit→delivery→balance, special-order→PO→arrival, layaway, service, commissions; bug burn-down; marketing basics (campaign send, 1 automation) if green | **Parallel run:** replay today's real STORIS transactions into Jetnine; compare end-of-day Z-report, drawer, commissions to STORIS |
| **10** | Final **delta import** into production tenant; recon gates 1–5 to the cent; fix-forward only | Staff dry-run on real hardware (registers, receipt printers, terminal); full STORIS archive export; **go/no-go** → cancel STORIS |

**Slip policy (pre-agreed):** if any day slips, cut in this order — P4 marketing automations →
P3 custom domains (keep basic branding) → P2 agency console UI (keep schema) →
G6 service-order polish (keep intake/track/complete). **Never cut:** G1–G3, migration,
recon gates, QA days 9–10.

## 9. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| STORIS export access is slow/gated | **High** | Start Day 1; escalate to STORIS support immediately; ODBC fallback; worst case, sprint pauses at Day 7 gate — features still land |
| Card processing cutover (terminal hardware, merchant account) | High | Readers ordered Day 1; interim = standalone terminal + `external_card` tender (works day one, reconciles in drawer) |
| History too deep to extract fully | Medium | D8: summarized invoices for old history; full detail for trailing 24 months + all open documents |
| Free-tier API sleeping at the register | Certain if unaddressed | D10 — always-on instance before Day 9 parallel run |
| Financing partners require their own portal | Certain | D5 — record tender in Jetnine, approve in provider portal (same as many STORIS shops do anyway) |
| 10 days is aggressive for G1–G9 + P1–P4 | High | Slip policy above; platform layer explicitly non-blocking; every epic lands vertically (schema→API→UI→test) so partial days still ship usable slices |
| Solo QA misses workflow edge cases | Medium | Day 2 ops task: write the real daily-routine script; Day 9 parallel run against live STORIS output |

## 10. Cutover checklist (Day 10 gate)

- [ ] Recon gates 1–5 pass to the cent (§7)
- [ ] Parallel-run day matched STORIS Z-report, drawer, and commission totals
- [ ] Playwright e2e green on: POS sale, order+deposit+delivery+balance, special-order→PO→receive, layaway installment, service ticket, refund
- [ ] Registers, receipt printers, payment terminal tested at the counter
- [ ] Always-on hosting + DB backups (PITR) + Sentry alerts verified
- [ ] Staff dry-run completed; cheat-sheet printed for register + order writer
- [ ] Full STORIS archive export saved to cold storage (R2)
- [ ] Rollback plan acknowledged: STORIS remains paid until go/no-go passes — cancel **after**, not before
- [ ] Cancel STORIS 🎉

## 11. Definition of done (sprint)

A store associate can: write a sales order with a deposit for an out-of-stock sofa,
have the PO generated and the arrival email fire on receiving, schedule the delivery,
collect the balance at fulfillment, and see their commission accrue — while the back
office sees yesterday's STORIS history in the same customer's timeline, the drawer
balances, and the platform owner can snapshot the business as a template, put it under
an agency, and brand it — without a single STORIS login.
