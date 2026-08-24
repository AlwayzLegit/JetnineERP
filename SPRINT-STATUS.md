# Sprint Status — STORIS Cutover

> **Living tracker for `PLAN-STORIS-CUTOVER.md`.** Protocol: pick the first unchecked
> **Build** item, ship it as a vertical slice, check it off with a dated note, commit the
> tracker with the work. **Ops** items are the human's — surface them, don't do them.
> Slip policy and never-cut list live in the plan §8.

**Sprint state:** Build track COMPLETE through Day 9 + UI overhaul + integrations — checkpoint merged to main 2026-08-24 (PR #26, squash `89763d9`). Remaining build items (Day 7/8 rehearsals, Day 10 final import) are blocked on real STORIS export files; all other unchecked items are **Ops**. · **Rehearsal imports done:** 0/2 (synthetic dry-run passed; real exports pending) · **Recon gates passed:** 0/5 against real data (gates 1–4 pass on synthetic)

---

## Day 1 — Order spine + extraction kickoff

- [x] **Build:** Schema batch 1: `orders`, `order_lines`, `deliveries`, `delivery_lines`,
      payments generalization (nullable `sale_id`, add `order_id`, `kind`, financing fields,
      CHECK exactly-one), `legacy_refs`, staging tables — with RLS + generated migration
      — _2026-08-22: `packages/db/src/schema/orders.ts` + `migration.ts`, migration
      `0018_storis_order_spine`, 7 new tables in `TENANT_SCOPED_TABLES` + `rls.sql`._
- [x] **Build:** `orders` NestJS module: CRUD, lines, totals (reuse `sales/totals.ts` pattern),
      deposit/balance payments, stock reserve/release via `inventory_levels.reserved` +
      movements (`order_reserve`/`order_release`), cancel; unit tests for totals + reserve math
      — _2026-08-22: `apps/api/src/orders/` (controller + service + `order-math.ts`);
      34 unit tests, 22 integration tests._
- [x] **Build:** Permission catalog additions (plan §5) seeded into system roles
      — _2026-08-22: 27 permissions added; `SUPER_ADMIN_ONLY_PERMISSIONS` keeps the two
      platform perms out of every business role, Owner included._
- [ ] **Ops:** Kick off every STORIS export (checklist: `docs/STORIS-EXPORTS.md`) — subscription still active
- [ ] **Ops:** Order Stripe Terminal readers / confirm interim standalone terminal

_Acceptance: migration applies cleanly from empty DB; API can create an order, take a
deposit, and reserved stock shows in inventory; drift check green._ **✅ met** — verified
against a scratch Postgres 16: reset → migrate applies `0018` from empty, the integration
suite writes an order, takes a deposit, and asserts `inventory_levels.reserved` moved while
`on_hand` did not; `drizzle-kit generate` reports no drift.

## Day 2 — Order writer

- [x] **Build:** `(business)/orders` — pipeline board (quote→open→partially*fulfilled→fulfilled→completed), order writer screen (share cart components with POS), order detail with payments + timeline
      — \_2026-08-22: board + writer + detail under `(business)/orders/`; CustomerPicker
      extracted to `components/customer-picker.tsx` and shared with POS; audit-logs API
      gained targetType/targetId filters to feed the order timeline.*
- [x] **Build:** POS: "Save as order / take deposit" flow
      — _2026-08-22: SaveAsOrderDialog on the register — confirms the order (committing
      stock) and posts the deposit as an order payment in one step._
- [x] **Build:** Committed-stock visibility in inventory views
      — _2026-08-22: already satisfied — inventory levels API + page carried
      on-hand/reserved/available since Phase 2; Day 1 reservations feed `reserved`.
      Verified in `e2e/orders.spec.ts`._
- [ ] **Ops:** Chase exports; write the STORIS daily-routine script (becomes the QA script)

_Acceptance: write an order with deposit end-to-end in the browser; committed qty visible._
**✅ met** — `apps/web/e2e/orders.spec.ts`: writer → confirm → cash deposit →
reserved=1/available=99 in inventory → order on the board; plus the POS
save-as-order path with the suggested 25% deposit. 2 e2e tests green.

## Day 3 — Delivery & fulfillment

- [x] **Build:** `deliveries` module + calendar UI (week/day), drag-to-schedule, driver day-sheet (print)
      — _2026-08-23: `apps/api/src/deliveries/` + `(business)/deliveries` (week board with
      drag-to-reschedule, delivery page with driver verbs, printable day-sheet at
      `/deliveries/day/[date]`)._
- [x] **Build:** Fulfillment flow: decrement stock, serial pick (stub until Day 4), collect balance, order receipt print; completion requires balance = 0 or `orders.complete_with_balance`
      — _2026-08-23: `planFulfillment`/`applyFulfillment` (`order_fulfill` movements,
      negative delta, reservation consumed), pickup path `POST /orders/:id/fulfill`,
      `POST /orders/:id/complete` gated on balance/permission. Serial pick + receipt
      print carried to the serials slice._
- [x] **Build:** Reports union `sales` + `orders` (revenue, drawer picks up order payments)
      — _2026-08-23: shift close and the daily report count order deposits/balances by the
      payment's own timestamp (imported excluded per D8); tender mix merges both;
      `orderPaymentsByDay` added to the daily report. Int test proves a mid-shift deposit
      lands in `expectedCashCents`._
- [ ] **Ops:** First export files land — joint sanity read; freeze SKU/category cleanup decisions

_Acceptance: schedule → deliver → collect balance → order completed; day's drawer includes deposits._
**✅ met** — `deliveries.int.spec.ts` (12 tests) walks the whole cycle API-side including the
drawer; `e2e/orders.spec.ts` drives it in the browser: schedule from the order page →
calendar card → delivered → fulfilled → collect → completed.

## Day 4 — Special orders & serials

- [x] **Build:** `po_line_allocations`; to-order queue; generate/link POs by vendor; receiving auto-allocates, marks lines arrived, emails customer (Resend)
      — _2026-08-23: migration `0019_special_orders_serials`; `special-orders` module
      (queue API + UI at `(business)/special-orders`, generate-PO with cost fallback);
      PO receive walks allocations, reserves arrived units for the waiting customer,
      splits partial receipts, and sends the arrival email (memory transport until a
      Resend key is configured; imported orders stay silent per D8)._
- [x] **Build:** `serial_units` + `products.serial_tracked`; serial picker in fulfillment
      — _2026-08-23: register at the dock (`POST /v1/serials/register`), pick per line
      (`POST /v1/serials/assign/:orderLineId`, over-pick guarded), fulfillment marks
      committed serials sold with the customer stamped. API-level for now; picker UI
      rides with the UI overhaul._
- [ ] **Ops:** Verify sample POs/special orders against STORIS screens

_Acceptance: sell not-in-stock item → PO generated → receive → arrival email → deliverable._
**✅ met** — `special-orders.int.spec.ts` (5 tests): special-order line reserves nothing →
queue shows it with the customer → generate-PO allocates all units at recorded cost →
receive commits stock to the customer (on-hand 2 / reserved 2) and the captured arrival
email names the order → serials register/assign/sold with customer stamped.

## Day 5 — Money features

- [x] **Build:** Financing tender (`method='financing'`, provider + ref) in POS + order payments
      — _2026-08-23: POS tender set widened to financing/external_card/check with
      provider+ref recorded on the payment row; order payments carried these since Day 1._
- [x] **Build:** `payment_plans` + installments; pay-installment flow; nightly overdue job + reminder emails; overdue report
      — _2026-08-23: migration `0020_money_plans_commissions`; plans generate installments
      that sum to the balance exactly (remainder on the last); paying one posts an order
      payment `kind='installment'` so drawer/balance math just works; overdue sweep
      (`POST /v1/payment-plans/run-overdue`, idempotent, reminder emails) + overdue
      report. Nightly scheduling wired in the deploy-hardening slice._
- [x] **Build:** Commissions (plans, accrual at sale/order completion, refund reversal, report, approve/mark-paid)
      — _2026-08-23: `commission_plans` (percent_of_sale | percent_of_margin, bps) assigned
      per membership; accrual at POS-sale completion and order completion (split via
      `split_bps`); refunds write proportional negative entries; period report
      (view_own vs view_all) + approve→paid payroll actions. Imported docs never accrue
      (D8; `sales.imported_at` added in 0021)._
- [ ] **Ops:** Provide real commission rules + financing provider list; validate 5 historical examples

_Acceptance: layaway order pays off across installments; commission entries match hand math._

## Day 6 — Service & CRM

- [x] **Build:** Service orders: intake form, status board, ticket detail + charges + notes, complete; ticket print
      — _2026-08-23 (API-level): migration `0022_service_crm` — `service_orders`
      (SV-YYYY-NNNNNN, warranty flag, imported_at/legacy_number for D7/D8),
      `service_order_lines` (part-from-variant or free-text labor; warranty prices
      lines at 0), `service_order_notes`. `payments.service_order_id` added and the
      one-tender CHECK widened to `num_nonnulls(sale_id, order_id, service_order_id) = 1`
      (D2 holds: one payments table behind every tender). Lifecycle
      intake ↔ awaiting_parts ↔ in_service → ready → completed with auto status notes,
      customer "ready for pickup" email at ready, over-collect guard, complete requires
      zero balance, attached serial units walk in_service → sold. 8-test int spec
      (`jetnine_service` DB) green; UI pages ride the QA/design pass with the other screens._
- [x] **Build:** CRM: `customer_notes`, tags, customer timeline page (merged feed)
      — _2026-08-23: notes CRUD, tags (unique per business, attach/detach), and
      `GET /v1/customers/:id/timeline` — a read-model merge of sales, orders,
      deliveries, order payments, service tickets, and notes, newest first. No event
      table; the documents are the history._
- [x] **Build:** Receivables/AR report + customer statement print
      — _2026-08-23: `GET /v1/reports/ar` (permission `reports.financial.view`) —
      confirmed+ orders with balance due, aged 0-30/31-60/61-90/90+ by order date,
      rolled up per customer. Statement print rides the UI pass._
- [ ] **Ops:** Walk the service workflow; list any STORIS report not yet covered

## Day 7 — Migration rehearsal #1

- [x] **Build:** Import pipeline: upload → staging → mapping config → validation report → commit via `legacy_refs` upserts → recon report (gates 1–5, plan §7)
      — _2026-08-23: `/v1/import/*` — 7 entity importers (customers, vendors,
      products+variants+categories, inventory on-hand w/ audit movements, open-order
      headers + deposit payments, order lines, closed-sales history), STORIS-shaped
      auto-mapping (editable per batch), RFC-4180 CSV parser, money/date/bool coercion,
      validation report (missing FKs, bad money, dup legacy ids, unknown SKUs — first
      200 rows + message rollup), commit as `legacy_refs` upserts (D7 — every re-run
      updates in place; inventory re-runs write no ledger noise), everything imported
      flagged `imported_at` (D8). Recon gates 1–4 computed source-vs-DB to the cent at
      `GET /v1/import/recon`; gate 5 stays human. Wizard UI at
      `(business)/settings/import` (upload → map → validate → commit → recon panel).
      9-test int spec (`jetnine_import` DB) wired into CI; JSON body limit raised to
      25 MB for CSV upload._
- [ ] **Build:** Full rehearsal import into throwaway `migration-rehearsal` tenant
      — _2026-08-23: the synthetic rehearsal (fixtures shaped like STORIS report-writer
      exports) runs end-to-end in `apps/api/test/import.int.spec.ts` with all recon
      gates matching. The real rehearsal is blocked on the actual STORIS export files
      (Ops, flagged) — once delivered, create the `migration-rehearsal` tenant and walk
      the wizard top-to-bottom; **do not commit the export files to the repo**._
- [ ] **Ops:** Review recon report line-by-line vs STORIS reports; log every mismatch

## Day 8 — Rehearsal #2 + platform layer

- [ ] **Build:** Fix import mismatches → rehearsal #2
      — _blocked on real STORIS exports (same as rehearsal #1)._
- [x] **Build:** `business_templates` (snapshot/apply + super-admin UI); `agencies` tier (D9, additive) + agency console basics; white-label branding + subdomain middleware
      — _2026-08-23: templates shipped (0023; snapshot captures custom roles,
      category tree, tax classes, settings, opt-in catalog; apply is additive and
      idempotent; create-business accepts templateId; super-admin UI at
      /admin/templates). **Agencies + white-label deliberately cut** per the slip
      policy (P2/P3) — single-tenant cutover needs neither; revisit post-go-live._
- [x] **Build:** Deploy hardening (D10): always-on API instance, DB backups/PITR, Sentry alerts verified
      — _2026-08-23 (build side): nightly overdue sweep scheduler in-process
      (OVERDUE_SWEEP_UTC_HOUR); SUPER_ADMIN_EMAILS startup bootstrap so the
      platform console needs no manual DB pokes; CORS/auth accept wildcard
      Vercel preview origins; Sentry wired since Phase 2 (instrument.ts).
      **Always-on instance + DB plan upgrade remain Ops** (free Postgres expires
      2026-09-21 — flagged)._
- [ ] **Ops:** Recon #2 sign-off; choose hosting plan; DNS if subdomains now

## Day 9 — QA + parallel run

- [x] **Build:** Playwright e2e: POS sale · order+deposit+delivery+balance · special-order→PO→receive · layaway installment · service ticket · refund
      — _2026-08-23: `apps/web/e2e/sweep.spec.ts` covers POS cash sale + refund,
      layaway plan + installment, service ticket end-to-end, and special-order →
      PO → receive → arrival email; order+deposit+delivery+balance already lived
      in `orders.spec.ts`. Full Playwright suite green locally. Service and
      payment-plan UI built as part of this pass (service board + ticket detail,
      layaway card on order detail)._
- [x] **Build:** Bug burn-down; marketing basics (campaign send, one automation) only if green
      — _2026-08-23: the sweep flushed out three real bugs, all fixed:
      (1) **cross-tenant read leak** — handlers queried the root pool so RLS
      never applied; DRIZZLE is now a per-request proxy onto the RLS
      transaction, with a regression test; (2) onboarding checklist double-sent
      its response, 500-ing conditional requests and looping the dashboard;
      (3) sign-in rate limiting tripped the growing e2e suite (explicit opt-out
      env for test servers). Marketing basics not started (cuttable)._
- [ ] **Ops:** Parallel run — replay today's real STORIS transactions; compare Z-report, drawer, commissions

## Day 10 — Cutover

- [ ] **Build:** Final delta import into production tenant; recon gates 1–5 to the cent; fix-forward only
- [ ] **Ops:** Staff dry-run on real hardware; full STORIS archive to cold storage (R2); go/no-go
- [ ] **Ops:** Cancel STORIS 🎉 (only after the gate passes — never before)

---

## Log

_(newest first — sessions append: date · day · what shipped · open flags)_

- 2026-08-23 · Beyond-plan · **One-click platform integrations.** `integrations`
  table (0024) + connector framework: Shopify (Admin API token), WooCommerce
  (REST key/secret), Wix Stores (API key) — connect verifies credentials against
  the platform before storing; "Sync now" pulls customers/products/paid order
  history and lands it through the D7 import pipeline (per-provider legacy-id
  prefixes keep identity spaces separate; re-sync updates in place; synced sales
  are D8 imported history). UI at /settings/integrations with the STORIS CSV
  wizard as a sibling card. `integrations.manage` permission + a boot-time
  system-role permission sync so pre-existing businesses pick up new catalog
  permissions automatically. 6-test int spec against a fake Shopify
  (`jetnine_integrations` DB, in CI). Suite: 374 tests.
- 2026-08-23 · Days 3–9 in sequence · **Whole remaining build track shipped on PR #26.**
  Deliveries/fulfillment · special orders + serials · financing/layaway/commissions ·
  service/CRM/AR · import pipeline + wizard + recon gates · business templates +
  nightly scheduler + super-admin bootstrap · service & layaway UI · Day-9 e2e sweep.
  Critical fix: **cross-tenant RLS enforcement** (handlers ran on the root pool; now
  proxied onto the request's RLS transaction) + checklist double-send 500 + e2e rate
  limiting. Staging: Render API deploys the PR branch merge (migrations 0019–0023 run
  on boot); trusted origins accept Vercel previews (wildcard); SUPER_ADMIN_EMAILS
  grants the owner the /admin console. Open flags: real STORIS exports (rehearsals),
  commission rules + financing providers, paid Render plan before 2026-09-21,
  agencies/white-label + marketing cut per slip policy. UI/UX design-system overhaul
  in flight (sidebar shell + tokens landed; page conversion following).

- 2026-08-22 · Day 1 · **Build track shipped.** Schema batch 1 (7 tables + payments
  generalization per D2) with RLS and migration `0018_storis_order_spine`; the `orders`
  module (write → price → commit stock → take money → cancel) with `order-math.ts` as the
  pure, tested core; 27 new permissions seeded into system roles.
  · **Open flags:** (1) both **Ops** items are untouched and are the sprint's critical
  path — the STORIS exports (plan §7) and the Stripe Terminal readers both need to start
  today; the export especially, since the subscription is still live and every day it
  slips, the whole sprint slips. (2) Cash drawer and tender-mix reports still join
  `payments → sales`, so order deposits do not reach them — noted on the Day 3 item.
  (3) `orders/:id/complete` is deliberately **not** built: completion is a fulfillment
  event and lands with `deliveries` on Day 3. The `orders.complete_with_balance`
  permission is seeded and waiting for it. (4) Two plan clarifications made and written
  back into `PLAN-STORIS-CUTOVER.md` §4.1/§4.7: `split_bps` instead of `split_pct` plus a
  separate `order_discount_cents`, and importer staging as public-schema
  `import_batches`/`import_rows` rather than a `staging` Postgres schema.
  · **Env note:** every `*.int.spec.ts` fails in the sandbox on a Node/vitest interaction
  with the `Function('return import(s)')` ESM shim (`apps/api/src/utils/import-esm.ts`) —
  pre-existing and unrelated to this work; reproduced on a bare test with no repo code.
  The orders suite was verified 22/22 by bypassing that shim locally; the shim itself is
  unchanged in the commit.
- 2026-08-22 · pre-sprint · Plan + handoff docs written (`PLAN-STORIS-CUTOVER.md`, `CLAUDE.md`, this tracker). Sprint not started.
