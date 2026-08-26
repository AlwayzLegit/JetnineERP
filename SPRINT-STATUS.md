# Sprint Status — STORIS Cutover

> **Living tracker for `PLAN-STORIS-CUTOVER.md`.** Protocol: pick the first unchecked
> **Build** item, ship it as a vertical slice, check it off with a dated note, commit the
> tracker with the work. **Ops** items are the human's — surface them, don't do them.
> Slip policy and never-cut list live in the plan §8.

**Sprint state:** Build track COMPLETE through Day 9 + UI overhaul + integrations + five post-checkpoint batches — checkpoint 5 merged to main 2026-08-25 (PR #29, squash `138ba82`) and live on staging (`596b8d4`). Remaining build items (rehearsal #2 = sales history + customers from the STORIS invoice register, Day 10 final import) are blocked on that export; all other unchecked items are **Ops**. Old stores 06/08/09 are out of migration scope (final). · **Rehearsal imports done:** 1/2 (products + inventory, real data, PASS) · **Recon gates passed:** gates 1–2 on the real product/inventory export; 3–5 need the invoice/customer export

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
- [x] **Build:** Full rehearsal import into throwaway `migration-rehearsal` tenant
      — _2026-08-23: the synthetic rehearsal (fixtures shaped like STORIS report-writer
      exports) runs end-to-end in `apps/api/test/import.int.spec.ts` with all recon
      gates matching. **2026-08-25: done on real data** —
      `apps/api/test/rehearsal.storis.int.spec.ts` drove the real inventory export
      (products 6,909 · inventory 1,505 · 3,738 units) through the full pipeline on a
      throwaway DB, all gates + idempotent re-run PASS (see Log); the owner then ran the
      same two CSVs through the staging wizard (server-side verification pending the
      Render connector). Scope so far: products + inventory; customers/invoices ride
      rehearsal #2. **Export files stay out of the repo.**_
- [ ] **Ops:** Review recon report line-by-line vs STORIS reports; log every mismatch

## Day 8 — Rehearsal #2 + platform layer

- [ ] **Build:** Fix import mismatches → rehearsal #2
      — _2026-08-25: rehearsal #1 surfaced no mismatches to fix. #2's scope is the
      remaining entities: sales history + customers derived from the STORIS invoice
      register (blocked on the export — CSV/Excel preferred, oversized PDF still
      undelivered). Location question CLOSED: owner ruled codes 06/08/09 are old
      stores — their stock (135 rows / 308 units, all at code 8; 06/09 held nothing)
      is dropped from the migration, holdout file discarded. Side effect: ~25 `-AS`
      clearance products whose as-is units existed only at code 8 are now stockless
      in the catalog — harmless, they simply never get counts._
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

- **2026-08-24 — Post-checkpoint slice 1 (reports parity):** `/v1/reports/z` (daily
  close-out: gross/refunds/net, tender mix across sale+order+service money, drawer
  variances; D8-excluded), `/v1/reports/sales/by-category`, `/v1/reports/inventory/valuation`
  (financial-gated, cost+retail), `/v1/reports/tax/summary` (net-sales caveat documented) —
  all with CSV export; reports hub UI gained Z-report, category, tax, valuation cards.
  reports.int.spec.ts 9→14 tests incl. refund-day Z math.
- **2026-08-24 — Post-checkpoint slice 2 (printing):** dependency-free Code 128B SVG
  encoder (`apps/web/src/lib/code128.ts`, 5 unit tests incl. checksum math); barcode
  label sheets at `(business)/products/labels` (Avery 5160 30-up + 2.25×1.25" roll,
  copy counts, print-only CSS grid); receipts now print a scannable document-number
  barcode for returns.
- **2026-08-24 — Post-checkpoint slice 3 (white-label + agency):** `businesses.branding_json`
  (migration `0025_business_branding`: accentColor/logoUrl/publicName, merge-PATCH with
  validation) re-themes the whole app per tenant (`--brand` override + shell logo/name +
  receipt display name); `GET /v1/agency/overview` (auth/me pattern, membership-scoped,
  money nulled where the caller's role lacks reports.sales.view) + `(business)/agency`
  roll-up cards; topbar badge became a one-click business switcher. business.int.spec.ts
  14→20 tests.
- **2026-08-24 — Post-checkpoint slice 4 (marketing):** `customer_segments` + `campaigns`
  (migration `0026_marketing`, RLS'd); `/v1/marketing/*` behind existing
  `crm.campaigns.manage` — segments are stored filters over CRM tags resolved at
  preview/send (email-holders only; imported customers included — D8 covers money flows,
  not outreach), campaigns are one-shot (marked sent before the send loop so a crash
  can't double-blast), `campaign.sent` webhook event; Marketing page in the People nav.
  marketing.int.spec.ts (8 tests) + MARKETING_TEST_DATABASE_URL in CI.
- **2026-08-24 — Post-checkpoint slice 5 (dashboard analytics):** `/dashboard` moved into
  the (business) shell (same URL) and rebuilt as the analytics home — today's KPI row
  from the Z-report, 30-day revenue trend (inline SVG line, crosshair tooltip, sr-only
  table; palette validated), receivables + open orders + low-stock cards, each hiding
  itself when the role lacks the report permission. Also fixed the auth.spec CI flake:
  a business-less user's /dashboard → /welcome redirect detached the Sign out button
  mid-click; /welcome now carries its own Sign out and the test waits for the redirect.
  Full local e2e 9/9 green.
- **2026-08-24 — Post-checkpoint slice 6 (reorder automation):** `product_variants` gained
  `reorder_point`/`reorder_qty`/`preferred_vendor_id` (migration `0027_reorder_points`);
  `GET /v1/purchase-orders/reorder-suggestions` groups shortfalls (available ≤ point,
  all-location sum) by preferred vendor with suggested qty (explicit qty, else top-up to
  2× point); one-click "Draft PO" per vendor group on the Purchasing page; per-variant
  Reorder automation card on product detail. purchasing.int.spec.ts 11→16 tests.
- **2026-08-24 — Post-checkpoint slice 7 (customer status link):** `orders.public_token`
  (migration `0028_order_public_token`, unique); `POST /v1/orders/:id/share` (idempotent,
  audited) + public no-auth `GET /v1/public/orders/:token` serving a narrow projection
  (journey status, lines, paid/balance, branding accent — no address/notes/ids); branded
  customer page at `/track/[token]` with a 4-stage journey rail; "Share status link"
  button on order detail copies the URL. orders.int.spec.ts 22→25 tests.
- **2026-08-24 — Post-checkpoint slice 8 (commission statements):** `GET
/v1/commissions/statement?period&membershipId` (own by default; others behind
  `commissions.view_all`; entries carry source document numbers; totals split
  accruals/reversals and pending/approved/paid) + the first Commissions page
  (Insights nav): monthly by-associate summary, printable per-associate statement,
  approve/mark-paid payroll actions. money.int.spec.ts 9→12 tests.
- **2026-08-24 — Post-checkpoint review fixes (self code-review of PR #27, 10 findings):**
  campaign sent-flip moved to the root pool so it commits before the mail loop (the RLS
  tx would have rolled it back on a crash → double-blast); Z-report tender mix now joins
  service_orders (location filter dropped every service payment; D8 exclusion now applies);
  public tracking shows only the next ACTIVE delivery; share-token write is race-guarded
  (WHERE public_token IS NULL); statement totals aggregate in SQL over all entries (not a
  truncated page) + entriesTruncated flag; segment tag filter is a subquery (no 65k-param
  blowup) and sinceDays capped at 3650; valuation rows/CSV/UI carry the location; dashboard
  reuses readActiveBusinessId; agency dead code removed.
- **2026-08-24 — Browser-agent QA triage (14-flow staging run: 12 pass / 1 fail / 1 skip):**
  fixes pushed to PR #27 for every finding. CSV exports no longer use `<a href>`
  navigations (they 503'd through the proxy and failed silently) — all six report
  export buttons download via in-page fetch → blob (`lib/download.ts`) with busy state
  and an error toast. Vendors page existed but was unreachable: added Vendors to the
  Catalog nav plus create-vendor links from the New PO empty dropdown and the reorder
  "no preferred vendor" hint. POS now surfaces cash change: the payment forms pass
  `changeDueCents` up, the Sale complete screen shows a "Change due" banner + totals
  row, and the printed receipt gets a Change line (server still stores applied cash
  only — change exists client-side by design). Campaign send confirm is an inline
  arm/confirm step instead of a native `confirm()`. Public tracking advances to
  "Ready / scheduled" as soon as a delivery/pickup date is booked. Z-report tenders
  table shows a negative "refunds (all tenders)" row + reconciliation note — refunds
  carry no tender method column, so per-method attribution is deferred (design
  decision if drawer-level attribution is ever needed). Delivery calendar chips show
  the customer's city. Logged-out shell flash fixed earlier the same day (AuthGate,
  fail-open for offline POS). Earlier: Shopify/Woo/Wix connect dialog defaults its
  landing location to a Warehouse-named location and explains the choice. Remaining
  from the run: flow 14 (permissions) untested — needs a second non-owner login.
- **2026-08-24 — Vendor SKU mapping (post-QA batch 2):** `product_variants.vendor_sku`
  (migration `0029_variant_vendor_sku`) holds the vendor's part number when it differs
  from our selling SKU (the exact discrepancy Shopify-synced catalogs create). PATCH
  `variants/:id/reorder` accepts/validates/audits it; reorder suggestions and PO detail
  lines return it; purchasing UIs print the vendor SKU with an "ours: …" hint when the
  two differ; Reorder automation card gains a Vendor SKU field. Shopify sync keeps
  filling the selling SKU only — vendor part numbers stay merchant-entered.
  purchasing.int.spec.ts 16→17 tests. Also verified in Render logs: the first real
  Shopify sync succeeded server-side (201 in ~7.3 min) — the browser toast errors
  because proxies cut the response at ~100s. Follow-up queued: make provider sync a
  background job with progress polling.
- **2026-08-24 — Real STORIS inventory export received + import-pipeline enrichment:**
  first real export analyzed (14,247 rows / 6,357 SKUs / 12 locations, clean — no dupes
  or cost conflicts; file kept OUT of the repo). Product import now understands the
  STORIS columns directly: `REPLACE_COST` as cost, `VENDOR_MODEL_NUMBER` → variant
  vendor_sku, `VENDOR` → find-or-create vendor + preferred vendor, `MIN_STOCK` →
  reorder point (all only-when-present, so re-imports never wipe merchant edits).
  import.int.spec.ts 9→10 tests. Pipeline-ready CSVs staged outside the repo.
  **Blocked on (Ops):** (1) a retail-price export (SKU → selling price) — the inventory
  report has cost only and product import requires price; (2) the location code → store
  name mapping (codes 1–12 and 88); (3) decision on 1,180 as-is units (import as
  on-hand, separate as-is SKUs, or skip).

- **2026-08-25 — Browser QA pass 3 (checkpoint 5): triage + fixes.** Agent ran 7 flows on the
  Vercel **branch preview** (not the canonical host — note for next pass) against the staging
  tenant. Flows 1–2 (CSV upload + mapping guard) PASS; flow 6 (background Shopify sync) PASS
  end-to-end (~8 min, 12,042 customers / 1,805 products / 2,652 sales, live progress line,
  no false timeout — the checkpoint-4 fix holding). **Headline finding: the owner's staging
  INVENTORY import evidently never committed.** The tenant's locations are
  "Glendale Store / Koreatown Store ×4 / La Brea Store / Studio City Store / West LA Store" —
  no `Warehouse`, and none matching the CSV's STORIS names — so inventory validation fails
  `unknown location` (QA reproduced it: 0 valid / 1 invalid on a Warehouse row; substituting
  an existing location name → 1 valid, committed, stock visible). STORIS products DID land
  (SAM-18002 family, 254 reorder rows across 14 vendor groups) but stock is zero at every
  location. The owner-reported "1,505/1,505 · 3,738 units" recon is therefore **contradicted**
  for inventory — likely staged-row counts read as committed. Flow 5 (vendor PO print)
  reclassified from "API not live" to **data gap**: checkpoint-4 API was live before the test
  (18:12Z), and the template renders vendor contact / ship-to / `ref` sub-line conditionally —
  all 50 auto-created vendors have no contact data, the PO has no location, and that line's
  variant has no vendorSku. Toast-never-dismisses finding is most likely a harness artifact
  (sonner pauses its dismiss timer while the page is hidden/unfocused, which CDP-driven
  browsers often are) — re-verify by hand.
- **2026-08-25 — QA pass-3 fixes shipped:** (1) Commit now disabled when validation yields
  0 valid rows (CsvImport + wizard), with a hint that commit imports valid rows only —
  closes the missing-guard finding; (2) inactive locations filtered out of the Inventory and
  Receive pickers (`/v1/pos/locations` consumers were already active-only); (3) location
  timezone is validated as a real IANA name on create/update (the literal `\` timezone can
  no longer be saved) and defaults are now `America/Los_Angeles` (form + seed);
  business.int.spec 21/22 → +1 test; (4) contrast sweep: `--text-muted` #9ca3af → #6b7280
  (AA on white/#f9fafb/green tint — fixes table headers, KPI labels, helper text, empty
  states, checklist), placeholders split to `--text-faint`, sidebar section headers
  white/35 → white/60, disabled buttons opacity 0.5 → 0.6 (exempt but kinder), sonner
  success-toast vars overridden to AA, PO print sub-line #777/10px → #555/10.5px. Lint,
  typecheck, web unit, business int green.
- **Ops (from QA pass 3, in order):** (1) **Fix staging locations, then re-run the
  inventory import** — rename/create so the five STORIS names exist exactly
  (`Warehouse`, `Koreatown`, `West LA`, `La Brea`, `Studio City`), deactivate the three
  dead Koreatown duplicates (after the fix they disappear from pickers), fix the `\`
  timezone via edit (now validated), then re-run the same inventory CSV through the wizard
  (idempotent, D7) and read the recon report — that closes the 3,738-unit verification for
  real. (2) Decide whether Shopify's "Glendale Store" mapping and STORIS's location set
  should be reconciled into one list before cutover (D11 makes production a fresh start
  either way). (3) Point the next QA pass at the canonical web host, not the branch
  preview. (4) Vendor contact/email/phone are empty for all 50 auto-created vendors —
  fill in the ones that receive POs so the printable PO's vendor block populates.

- **2026-08-25 — Staging location fix EXECUTED + inventory import LANDED + recon VERIFIED
  server-side (owner-authorized API session).** With the owner's credentials (supplied for
  this run), the fix ran against staging over HTTPS: active `* Store` locations renamed to
  the STORIS names (`Koreatown`, `West LA`, `La Brea`, `Studio City`), `Warehouse` created,
  every timezone set to `America/Los_Angeles` (including the literal `\` one), the three
  duplicate Koreatown records left inactive, `Glendale Store` untouched (Shopify's
  location). The batch list confirmed the diagnosis exactly: `storis_inventory.csv` sat
  `validated` at **0 valid / 1,505 invalid / 0 committed** (products were committed
  6,909/6,909). Re-validate of the same staged batch after the fix: **1,505 valid /
  0 invalid**; commit: **1,505/1,505** (32s). `GET /v1/import/recon`: gate 1 all entities
  match (product 8,684 = STORIS ∪ Shopify ∪ QA, inventory 1,506 = 1,505 + QA row); gate 2
  units **3,743/3,743** (= 3,738 STORIS + 5 QA test units) and valuation
  **$577,513.12 to the cent**; gates 3–4 trivially 0/0 (no order/AR imports yet). Per-store
  spot check ties the file exactly: Warehouse 2,074 · West LA 527 · La Brea 448 ·
  Koreatown 387 · Studio City 302 = 3,738. **The "owner-reported, not independently
  confirmed" caveat above is closed — rehearsal-scope recon gates 1–2 now pass
  server-side on staging with real data.** Ops: rotate the owner password shared for this
  session; vendor contact fill-in and canonical-host QA remain from the pass-3 list.

- **2026-08-25 — Location hard-delete for mistake records (owner request).** There was no
  delete button because there was no DELETE endpoint — deactivate-only by design. Now:
  `DELETE /v1/business/locations/:id` (permission `locations.delete`, already in every
  Owner/Manager role) with two guards — the location must already be inactive, and an
  explicit reference probe across all 12 location-FK tables must come back empty (explicit
  rather than FK-error-driven because inventory levels/movements, tax rates and staff
  scopes cascade — a bare DELETE would silently take that data along). 409 names what
  references it; deletes are audit-logged. Locations page shows a Delete button on
  inactive rows with a confirm. business.int.spec 22→23 (active→400, referenced→409 with
  cascade rows surviving, clean inactive→deleted). The three duplicate "Koreatown Store"
  records qualify (inactive, referenced by nothing) — deletable in the UI once this
  checkpoint deploys.

## Checkpoint 6 merged + deployed (2026-08-25)

PR #30 squash-merged to main as `28b1248` (QA pass-3 fixes, location hard-delete,
migration-naming boot log, Cowork invoice-register runbook, server-verified recon).
Deploy branch merged (`ff654aa`) and deployed to Render via API trigger
(`dep-da6va4s9v7es739km770`, live 20:05Z): `/health` + `/ready` 200 on the fresh
instance, and the boot log now prints the instrumented line —
`Schema migrations: 31/31 applied, head=0030_integration_sync_state; this run applied
none (already up to date).` (no schema changes in this batch, no pending warning).
Vercel production READY on main `28b1248`; canonical host confirmed
`lamattress-erp.vercel.app`. Sprint branch restarted from main. Browser-QA pass 4
brief handed to the owner (regression on the pass-3 fixes, Koreatown-dupe deletion as
live cleanup, STORIS stock spot checks per store, toast recheck with a focused tab).

- **2026-08-25 — Production-domain login fixed (owner-reported, root-caused, verified).**
  `lamattress-erp.vercel.app` couldn't sign in: `CORS_ORIGIN`/`AUTH_TRUSTED_ORIGINS` on the
  Render service allowed localhost + the `*-alwayzlegits-projects.vercel.app` preview
  wildcard but not the production domain, and better-auth validates the proxied `Origin`
  header against that list before checking credentials. Added the domain to both vars
  (merge update via Render API, `dep-da6vjk8ae00c7385a95g`); verified live — preflight
  from the prod origin now 204 with the domain echoed, and a dummy-cred POST through the
  prod proxy returns 401 INVALID_EMAIL_OR_PASSWORD (credential layer reached).
  Ops still open: repoint the Render dashboard repo URL to LA-Mattress-ERP (deploys
  remain manual-trigger until then), rotate the owner password shared for the location
  fix, vendor contact fill-in.

## Rehearsal #2 executed on staging (2026-08-25) — customers + sales history

The invoice-register PDF became moot: the owner produced real exports
(`CUSTOMERBASE_*.xlsx`, 51,298 rows; `ALL_CUSTOMER_PRODUCTS_SALES_*.xlsx`, 220,278
line rows). Both processed in-session (data never touched the repo) and imported
through the D7 pipeline via owner-authorized API session.

- **Customers: 51,117/51,117 committed, 0 invalid.** Cleaning: 168 blank-account rows
  and 13 store/house accounts (ids 01–12, 88 — exactly the STORIS store codes) dropped;
  0 dupes after that; 43,273 placeholder emails blanked (`no@gmail.com` family + any
  address shared by 50+ accounts — would have poisoned campaign sends), 7,799 real
  emails kept; single-field names split (54 business names kept whole); combined
  City/State/Zip split. Addresses land in `customers.addresses_json` (verified live) —
  the customer detail UI does not render them yet (UI backlog).
- **Sales: 71,246/71,246 committed, 0 invalid** — header-level invoices derived by
  grouping the line rows per ticket `Number` (proven single-date single-customer;
  48,211 tickets double as the customer's account# with 2000/2000 phone agreement on
  sample — STORIS mints account# from first ticket). Customer linkage: 48,211 by
  account + 20,366 by phone + 2,669 walk-ins (blank). **Store ruling (owner, final):**
  ticket prefix = store code; 01→Koreatown, 02→West LA, 03→La Brea, 04→Studio City;
  ALL other codes (05/06/08/09/10/11/12, Glendale-as-closed) → `Warehouse` so no
  history is dropped. Grand total **$61,552,851.98** across 2015-12-14 → 2026-08-23,
  444 refund invoices with negative totals preserved. Commits ride out the proxy's
  300s cap via poll-after-disconnect (server finishes on its own; one re-fire needed
  after a container restart — D7 idempotency made that safe).
- **Recon after both:** gate 1 all entities match (customer 63,159 = 12,042 Shopify +
  51,117 STORIS; sale 73,899 = 2,652 Shopify + 71,246 STORIS + 1 QA; inventory 1,507);
  gate 2 units 3,748/3,748 match; gate 2 valuation off by exactly $50.00
  (5,769,563.12 vs 5,769,... — source 57,751,312¢ vs db 57,756,312¢): the QA pass-4
  `warehouse-test.csv` imported 5 TEST-CSVUI-1 units with no UNIT_COST column, so the
  source side carries no cost for them while the db side prices them at the variant's
  $10 cost — a test-data artifact, not a pipeline defect. Gates 3–4 0/0 (no order/AR
  imports). **Rehearsal imports: 2/2 done on real data.**
- **QA pass 4 (canonical host): flows 1/2/4/5 PASS** — per-store stock ties to the
  unit; commit guard verified incl. exact hint copy; contrast 5/5 (pass-3's sidebar
  "1.16" was the agent's oklab()-parsing artifact — corrected tool measures 6.36);
  toast auto-dismiss 4.25s with a visible tab (pass-3 finding was the hidden-tab
  timer pause). Flow 3: timezone guard PASS; the three inactive "Koreatown Store"
  dupes deleted server-side by the build agent (agent declines hard deletes) — 6
  locations remain. Flow 6 "print template binding bug": **disproven server-side** —
  the served production chunk renders the vendor block conditionally with correct
  field names and cannot emit the bare `<br>`s reported; suspected stale
  service-worker bundle or void-element `textContent` serializer artifact; agent to
  re-check with SW unregistered + `innerText`. QA extra findings adopted into the UI
  backlog below.
- **UI/UX backlog (owner + QA pass 4, next build slices):** (1) list-page controls —
  pagination/search/sort/filters on Customers, Sales, Products, Inventory first (51k
  customers + 74k sales make naked tables a P0); (2) vendor edit UI (PATCH endpoint
  already exists); (3) render + edit customer addresses on the detail page; (4)
  replace every image-URL field with real file upload (storage decision needed:
  S3-compatible or Vercel Blob — Render disk is ephemeral); (5) UI/UX audit pass 5
  dispatched (dedicated brief) to inventory the rest.
- **Email/invites: currently STUB.** Invite/arrival/reminder/campaign emails go to the
  in-memory transport — Resend account has no domain and zero sends ever. To go live:
  verify a sending domain, create an API key, set `RESEND_API_KEY` +
  `RESEND_FROM_EMAIL` on the Render service (offer standing; needs owner's domain
  choice + DNS access). **Ops:** rotate the shared owner password; repoint the Render
  repo URL (auto-deploy still broken).

## "Enter a Sales Order" — POS replaced by the STORIS 3-step flow (2026-08-25)

Owner decision (D1 amended in the plan doc): order entry becomes the STORIS-style
three-step program and is the default POS surface.

- **Schema (0031_order_entry_storis_parity):** orders gain `order_kind`
  (sales_order|layaway), fulfillment widened to take_with/direct_ship,
  `delivery_status` (scheduled|estimated|asap|will_call), `delivery_instructions`,
  `pickup_location_id`, `billing_address_json`, `marketing_code`, and three Step-3 fee
  buckets (delivery/install/other + label) folded into `total_cents` after tax;
  order_lines gain per-line `fulfillment_method` + `delivery_date` (split tickets).
- **API:** create/update validate the new enums + fees; detail echoes everything;
  `recomputeTotals` includes fees. orders.int.spec 25→27 (fee math asserted to the cent,
  bad enums rejected).
- **UI:** new `components/order-entry.tsx` — Step 1 Customer (order type, selling
  location, salesperson + split % from members, fulfillment, dates/status/instructions,
  pickup location, customer picker with create-on-the-fly, shipping + optional separate
  billing address), Step 2 Merchandise (scan/search, qty, register-side price entry per
  D12, line discounts, special-order lines, per-line fulfillment/date), Step 3 Payment
  (order discount, fees, marketing code, deposit with suggested 25%, tender incl.
  financing provider/ref). Submit routing: Quote → unconfirmed order; Sales order /
  Layaway → confirm + deposit payment (layaway CTA points at the payment-plan flow);
  **take-with fast lane** — all-stock cart, fully tendered → posts a plain `/v1/sales`
  register sale (drawer/Z/commissions intact per amended D1). `/pos` now defaults to
  this flow with the legacy register one tab away (retires after its offline queue +
  drawer flows are ported); `/orders/new` renders the same component. e2e specs updated
  to drive the stepper and the register tab. Deferred by owner: warranty/prep codes,
  configurator, manual numbers, backdating, Multi-Ship Master.
- Web typecheck/lint/unit green; api 27/27 orders int tests green. Full e2e runs in CI.

## Checkpoint 7 merged + deployed (2026-08-25)

PR #31 squash-merged to main as `2d3f799` (CI 4/4 green first try, incl. Playwright on
the new stepper choreography). Deploy branch rolled (`3e34867`), Render deploy
`dep-da72lkqjnfac73aifv6g` **live 23:54Z** — boot log:
`Schema migrations: 32/32 applied, head=0031_order_entry_storis_parity; this run
applied 0031_order_entry_storis_parity.` `/health` + `/ready` 200 on the fresh
instance. Vercel production READY on main `2d3f799`. Sprint branch restarted from
main. **"Enter a Sales Order" is live on `lamattress-erp.vercel.app` → POS.**
Ops unchanged: repoint Render repo URL (deploys still manual-trigger), rotate the
shared owner password, Resend domain when ready.

## Test-data ledger (D11 — what lives in the QA tenant and never reaches production)

Production cutover creates a **fresh business**; everything below stays behind in the
current staging business. Keep this list current whenever a test session creates data.

- Browser-agent run 1 (2026-08-24): product "Cloud Comfort Mattress — Queen" ($899.99);
  sale INV-2026-000001 + full refund; customer "Maria Testerson" (fake email + "gate
  code" note); order SO-2026-000001 with $200 cash deposit + public share token +
  delivery scheduled 8/25; segment "Test VIPs"; campaign "Browser test" (sent to 2 test
  recipients via the memory outbox); branding round-trip (reverted); reorder settings
  (cleared).
- Browser-agent run 2 (2026-08-24, retest): more of the same shapes — additional POS
  sale(s) + refund, an order + track link + delivery, a vendor + draft PO, a campaign,
  vendor-SKU entries; whatever its report lists.
- Shopify sync (2026-08-24, ~19:59Z): the REAL store catalog/customers/orders landed in
  the QA tenant mapped to location "Glendale". This is real data but in the test tenant —
  the sync will be re-run into the production business at cutover (with the proper
  location mapping), not migrated.
- STORIS staging imports (2026-08-25, run by the owner via the wizard): the real product
  catalog (6,909 rows incl. 552 `-AS`) and inventory counts (1,505 rows / 3,738 units)
  now live in the QA tenant too. Same treatment as the Shopify sync — re-imported fresh
  into the production business at cutover (D7 makes that a clean final run), never
  migrated across.
- At cutover into the fresh production business: recreate locations (real store list),
  staff invitations + roles, business settings (tax, receipts, branding), re-run the
  Shopify connector, then run the final STORIS import (D7 pipeline). The QA tenant keeps
  serving as the safe playground for future testing and demos.
- Browser-agent run 3 (2026-08-25, checkpoint-5 QA): products `TEST-CSVUI-1` ("QA CSV
  Upload Widget A", $10 cost) and `TEST-CSVUI-2` ("QA CSV Upload Widget B", $20 cost);
  vendor `QA VENDOR` (auto-created by the products import); inventory level 5 on hand of
  `TEST-CSVUI-1` at "Glendale Store" (Warehouse substitution); one full Shopify re-sync
  (12,042 customers / 1,805 products / 2,652 sales). No `TEST-CSVUI-3` (mapping-guard file
  never committed); no stock at "Warehouse" (location absent).
- **2026-08-24 — D12 (no retail-price import) + QA run-2 triage:** priceCents is now
  optional on product import — absent means new variants land at $0 and existing
  variants keep their price (Shopify prices survive the STORIS import); POS cart lines
  gained a register-side unit-price input (negotiated pricing) plus live type-to-search
  (350ms debounce; scanner Enter flow unchanged); vendor-create form no longer throws
  on success (React currentTarget-after-await bug); Shopify sync falls back to the
  email local part when a customer has no name. import.int.spec.ts 10→11. STORIS CSVs
  regenerated with real location names (88=Warehouse, 1=Koreatown, 2=West LA,
  3=La Brea, 4=Studio City) and 552 as-is companion SKUs (`-AS`, 1,180 units);
  location code 8 (186+122 units) held out pending its store name. QA run-2 "vendor
  SKU FAIL" was a deploy lag — the live API is still 80ad9bd and the 18:23 auto
  redeploy from the instance upgrade FAILED; Ops: Manual Deploy latest on jetnine-api.
- **2026-08-24 — QA run-2 final: 10 PASS / 1 FAIL (vendor SKU = the deploy gap, since
  closed by the 20:43Z manual deploy of 1bbd354; migrations incl. 0029 applied clean).**
  Z-report refunds row verified live (−$968.99 ties out), Avery 5160 geometry confirmed
  from print DOM, dashboard KPIs agree with the Z. Adopted the agent's hardening
  suggestion: the reorder card now asserts the PATCH response echoes vendorSku before
  showing success — a stale backend now produces an explicit error instead of a false
  "saved". Flow-8 incognito caveat closed by server-side evidence: /v1/public/orders/:token
  is @Public and answers unauthenticated (verified by curl on staging). Test-data ledger
  additions from run 2: INV-2026-000002 ($1,949 Aviada, change $151), INV-2026-000003
  ($69 protector + refund), vendor "Bedrock Bedding Supply", PO-2026-000001 (draft),
  campaign send to 4,575 recipients (memory outbox), order + delivery + track link.
- **2026-08-24 — Sidebar blue-on-navy fix (user-reported):** the Tailwind v4 pass left
  `a { color: var(--brand) }` UNLAYERED in globals.css; unlayered CSS outranks every
  layered utility, so `text-[var(--sidebar-text)]`/`text-white` on nav links lost and
  the whole sidebar rendered brand-blue on navy. The anchor default now lives in
  `@layer base`, restoring utility overrides (bare content links keep the brand color).
  Watch for the same pattern if other element defaults ever fight a utility. e2e 9/9.
- **2026-08-25 — STORIS import REHEARSAL #1 (real data): PASS, all gates.** New committed
  runner `apps/api/test/rehearsal.storis.int.spec.ts` (self-skips unless
  STORIS_REHEARSAL_DIR points at the local CSVs — no data in the repo) drove the real
  export through stage→map→validate→commit→recon on a throwaway DB seeded with the five
  mapped stores. Results: products 6,909/6,909 committed with 0 invalid rows (incl. 552
  as-is companions); inventory 1,505/1,505 → 3,738 units on hand, tying the file to the
  unit; 48 vendors auto-created; 4,255 vendor SKUs and 252 reorder points landed; all
  variants at $0 per D12. Full re-run of both batches: zero duplicates, counts identical
  (D7). End-to-end runtime ~105s. One harness finding: the default 100kb json body limit
  413s a real catalog CSV — main.ts already runs 25mb, the test harness now matches.
  Remaining rehearsal scope: location-8 inventory (pending store name), customers /
  invoices / open-orders entities (pending exports).
- **2026-08-25 — Background provider sync (post-QA batch):** POST
  `/v1/integrations/:provider/sync` now runs detached — job state on the integrations
  row (`sync_status`/`sync_progress_json`/`sync_started_at`, migration
  `0030_integration_sync_state`), page-by-page progress notes from the connectors,
  stale-job takeover after 30 min, 409 while running, `?wait=1` preserves the
  synchronous contract for tests/scripts. Page cap raised 20→400 (100k rows/resource,
  matching MAX_ROWS) — the old cap truncated the real store at exactly 5,000 customers
  and cascaded into 1,829 skipped sales. UI polls every 2s with a live progress line
  and disables the button while running; no more false timeout toasts on 7-minute
  pulls. Detached runs write state via ROOT_DRIZZLE and audit with explicit tenant.
  integrations.int.spec.ts 6→7 tests (adds detached-mode completion + idempotency).

## Checkpoint 3 merged (2026-08-25)

PR #27 squash-merged to main as 5b0f522 (eight post-cutover slices, three browser-QA
rounds, D11/D12, vendor SKU mapping, STORIS import enrichment + rehearsal #1, background
provider sync; migrations 0025–0030). Branch restarted from main for the next batch.
Empty invoices-takeout-storis.pdf removed from main (0a4c619). Blocked on Ops: Render
instance type (still spinning down), Manual Deploy of the merged head, customers +
invoices exports, location-8 store name, pass-3 QA report.

- **2026-08-25 — Printable vendor purchase order (batch 4 slice 1):** PO detail gained a
  "Print for vendor" document — clean one-pager (business header, vendor + attn/email/
  phone, ship-to location, line items led by the VENDOR's part number with our SKU as
  "ref", subtotal, notes, PO-reference footer) using the receipt print mechanics
  (hidden on screen, sole visible element in print). API PO detail now returns
  locationName + vendor contact fields (leftJoin locations). purchasing.int.spec 17/17.
  Ops note: Render service confirmed still on plan "free" (instance upgrade reverted
  after its failed deploy) and live deploy still 1bbd354 — deploy of 847f310 queued
  behind the Render connector reconnect (auto-retry armed); repoint the Render repo URL
  to LA-Mattress-ERP to restore auto-deploy permanently.
- **2026-08-25 — File-upload CSV import everywhere (batch 5 slice 1):** the Phase-1
  paste-box importer on Products is gone; a reusable `CsvImport` component (file picker
  → staged batch → editable column mapping → validate with per-row error preview →
  commit, all over the D7 wizard endpoints) now lives on Products (product entity) and
  Inventory (inventory entity, new — with a products-first hint). Settings → Import
  remains the full multi-entity wizard on the same pipeline. e2e 9/9.
- **2026-08-25 — Owner ran the staging imports; Render instance fixed:** the owner
  pushed the two prepared STORIS CSVs through the staging wizard themselves (products
  then inventory — the first real end-user run of the D7 pipeline). Verification
  criteria on record: products 6,909/6,909 · inventory 1,505/1,505 · recon product
  6,909 / inventory 1,505 / units 3,738; server-side confirmation queued behind the
  Render connector reconnect. Render instance re-upgraded and CONFIRMED on Starter
  (no more spin-downs); API deploy of the merged head still queued (auto-retry armed);
  Ops: repoint the Render repo URL to LA-Mattress-ERP for auto-deploy. PR #29
  (batch 5) opened, CI fully green, awaiting merge word.

## Checkpoint 5 merged (2026-08-25)

PR #28 (printable vendor PO) squash-merged to main as `e860ec2`; PR #29 (file-upload CSV
import on Products + Inventory) squash-merged as `138ba82` — the "awaiting merge word" note
above is settled. Deploy branch `claude/fix-latent-int-spec-failures` carries `596b8d4`
(merge of checkpoint 5 into the deploy branch).

- **2026-08-25 — Staging deploy of checkpoint 5 is LIVE and verified.** Manual deploy
  triggered on `srv-da4tua3m8hqs73apsflg` (jetnine-api) via the Render API →
  `dep-da6u86jl550s73fepsn0`, commit `596b8d4`, build 18:51Z → **live 18:52:49Z**, no
  build or update failures. Post-deploy checks against `https://jetnine-api.onrender.com`:
  `GET /health` → `200 {"status":"ok"}` on a fresh instance (uptime 44s), `GET /ready` →
  `200 {"status":"ok"}`. Boot log shows `pnpm --filter @jetnine/db migrate` completing with
  only idempotent NOTICEs (citext / drizzle schema / `__drizzle_migrations` already exist)
  then `Migrations applied (schema + RLS).`, followed by a clean Nest boot (all modules
  initialized, routes mapped, Stripe in STUB mode as expected on staging). **Caveat on the
  0029/0030 check:** the old migrate script never named the migrations it applied, so the
  boot log proves "schema is at journal head, nothing pending" rather than naming
  `0029_variant_vendor_sku` / `0030_integration_sync_state` — both of which were in fact
  already applied by the 18:10Z deploy of `fe34e0a` (checkpoint 4) and are no-ops now.
  Fixed for every future deploy by the next item.
- **2026-08-25 — Deploy-log migration visibility (ops tooling):** `packages/db/src/migrate.ts`
  now counts `drizzle.__drizzle_migrations` rows before and after `migrate()` and maps the
  count into `drizzle/meta/_journal.json` tags, so each boot prints
  `Schema migrations: 31/31 applied, head=0030_integration_sync_state; this run applied
none (already up to date).` — or the explicit list of tags on a run that applies work —
  plus a `WARNING: N migration(s) still pending: …` line if the folder is ever ahead of the
  database. Verified against a throwaway Postgres 16 both ways (empty DB → all 31 named;
  re-run → "already up to date"); `packages/db` lint + typecheck + 14 RLS tests green.
- **2026-08-25 — Render service posture confirmed:** plan `starter` (`buildPlan: starter`,
  `numInstances: 1`, region oregon) — the spin-down problem stays fixed; `autoDeploy: yes`
  on branch `claude/fix-latent-int-spec-failures`. **Ops (unchanged, now the only reason
  deploys need a manual trigger):** the dashboard repo URL is still
  `https://github.com/AlwayzLegit/JetnineERP` — clones still resolve through GitHub's
  rename redirect (this deploy proves it), but the push webhook does not, so auto-deploy
  is dead until the URL is repointed to `AlwayzLegit/LA-Mattress-ERP` in
  Settings → Build & Deploy → Repository.
- **2026-08-25 — Old-store scope decision carried into the plan doc.** The Day 8 note above
  (codes 06/08/09 are closed stores; their 135 rows / 308 units are dropped, holdout file
  discarded) was tracker-only; D12 in `PLAN-STORIS-CUTOVER.md` still read "code 8 pending".
  D12 now records the exclusion as final, including that dropped-store rows are filtered
  during CSV prep and anything that slips through fails validation as `unknown location`
  rather than landing on a placeholder location.
- **2026-08-25 — Rehearsal #2 unblocking: Cowork runbook for the invoice register.** The
  sales-history export turns out to be a ~4 GB print-to-PDF invoice register. Since the
  wizard's `sale` entity is header-level (one row per invoice — no line items), the PDF is
  parseable locally: `docs/COWORK-INVOICE-REGISTER.md` is a complete runbook for a Cowork
  session with folder access to the PDF — text-layer probe, streamed `pdftotext` extraction,
  deterministic parser → `customers.csv` + `sales.csv` (exact wizard headers, store-code →
  name mapping, 06/08/09 dropped and counted), and five pass/fail verification gates anchored
  on the register's own printed grand totals. Data never leaves the local folder (D11/D8
  restated in the doc). **Ops:** put the PDF in a folder, point Cowork at it + this runbook.
- **Ops / blocked — server-side verification of the owner's two staging imports is NOT
  done, and the blocker is now root-caused.** The Render MCP connector itself is fine;
  `query_render_postgres` executes from the Claude remote session's sandbox, whose egress
  policy allows HTTPS:443 through the agent proxy only — raw-TCP database connections are
  explicitly unsupported (proxy docs: "Not supported through the proxy … raw-TCP
  databases"). Hence the signature: the TLS attempt's handshake is killed (`unexpected
EOF`) and the plaintext fallback reaches Postgres and is refused (`FATAL: SSL/TLS
required`). A raw-TCP probe to `dpg-da4ttsm417fc73di57eg-a.oregon-postgres.render.com:5432`
  from the sandbox confirms the block. The API-login fallback (seeded staging admin +
  `GET /v1/import/recon` over HTTPS) was denied by the session's permission classifier, so
  it needs an explicit user go-ahead. The recon numbers on record (product 6,909 ·
  inventory 1,505 · units 3,738) remain **owner-reported, not independently confirmed**.
  Fastest paths: (a) run `query_render_postgres` from a local Claude session (raw TCP
  works there), (b) paste the recon report JSON from Settings → Import during the QA
  pass, or (c) approve the staging-login curl in this session.
