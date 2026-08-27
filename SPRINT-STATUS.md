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

## POS / Operations build (PLAN-POS-OPERATIONS.md) — phase tracker

Owner handoff spec committed as `PLAN-POS-OPERATIONS.md` with amendments A1–A4
(batch print doesn't lock; LB=La Brea keeps its name+history; single-screen New Sale
supersedes the checkpoint-7 wizard; legacy register + its offline mode retire).

- [x] **Build P1 (schema+API core):** migration `0032_pos_ops_phase1` — `locations.order_prefix`
      (validated 1–4 letters, unique per business, admin-editable via locations API),
      `order_sequences` per-store atomic counters (orders at a prefixed location number
      `{PREFIX}-{seq}` from 10001; unprefixed locations keep the legacy SO-YYYY sequence),
      `businesses.ops_settings_json` (recycling rate / doc notes / unlock roles / delivery
      cap / PO reply-to — editors ride with their consuming phases),
      `orders.original_order_id` (exchange link), `membership_permission_overrides`
      (per-user grant/revoke applied in the tenancy guard on top of role defaults). RLS
      registered; verified from empty DB (33/33). business.int.spec +2 (WL-10001/WL-10002/
      K-10001 numbering, duplicate-prefix rejection; override grant→200 / revoke→403);
      orders suite 27/27 unaffected. — _2026-08-25. Remaining P1 surface (permission-matrix
      UI, ops-settings editor, new role set, store-scoped visibility) rides with P2/P3._
- [x] **Build P2:** New Sale screen — single-screen order entry live at `/pos` (and
      `/orders/new`), login lands there. Universal customer search (name/phone/email/
      address via the widened tsvector, migration 0033) with disambiguating dropdown +
      inline create; Ship-To toggle defaulting to billing; Add Product popup
      (`/v1/pos/product-search`: text/vendor/in-stock filters, here/all availability,
      ATP date from open POs) with out-of-stock ATP banners on lines; click-to-edit
      price override + per-line & order discounts; auto Recycling Fee line per
      qualifying unit (rate from ops settings, removable) + "+ Removal ($0)" +
      installation/delivery fee fields; up to two salespeople with equal split;
      pinned totals rail (merchandise/discounts/install/delivery/recycling/tax/total/
      paid/balance); payments list over nine tenders; layaway enforces the \$100
      minimum deposit; take-with fully-paid fast lane posts a register sale;
      store-wide drafts (chips to resume; completing supersedes the draft). Wizard
      (`order-entry.tsx`), legacy register, `/pos/pending` offline tray and the
      offline e2e spec all retired per A3/A4; auth/sweep/orders e2e rewritten for the
      new flow; fresh-signup welcome bounce ported to `/pos`.
      — _2026-08-25/26. v1 conventions flagged: recycling detection is a name-keyword
      match (mattress/foundation/adjustable base/box spring) pending a category flag;
      salespeople capped at two by the split schema; store-credit tender records
      without a balance check until P8's ledger._
- [x] **Build P3:** Orders list + slide-over + change-history timeline + notifications feed.
      `/v1/orders/list-view` returns the spec table page (Order #, Customer, derived
      display Status w/ PO #, Delivery Date, Balance Due, Salesperson) — display status
      computed per row from real state (draft/quote/cancelled/completed → Draft/Quote/
      Cancelled/Delivered; layaway w/ balance → Layaway; undelivered trip → Scheduled/
      Out for Delivery; open PO allocation w/ unreceived qty → On PO (#); under-reserved
      stock line → Pending; else Reserved), never stored. `/orders` page rebuilt as that
      table (search over order #/customer, raw-status filter, cursor "Load more"); row
      click opens a read-only slide-over (lines/totals/payments/balance) with an
      "Open full page" link, Esc/backdrop closes. Order-detail Timeline card upgraded to
      the spec change history: actor email per entry + field-level before → after values
      from the audit diff (cents fields rendered as dollars). `/v1/notifications`
      (audit.view-gated) derives the owner feed from audit rows (order.update/line.add/
      line.remove/cancel/payment.take — order.create excluded as not post-creation),
      joined to actor + live order number; dashboard gained a "Notifications — order
      changes" card that hides on 403. orders.int.spec +3 (display statuses + balance,
      q filter, feed contents/attribution/gating) → 33/33; orders e2e board assertions
      → table + slide-over. — _2026-08-26. Cap/lock overrides and close-out exceptions
      join the same feed when P5/P9 land (they'll be audit actions too)._
- [x] **Build P4:** Documents — invoice, delivery ticket + individual-print lock, batch
      print. `GET /v1/orders/:id/document` bundles everything §11 needs (business name/
      logo + admin header/footer notes from ops settings, store block from the location,
      Sold To/Ship To, salesperson names, scheduled date from the earliest undelivered
      trip, per-line Model = variant SKU / Brand = preferred vendor). Print views live in
      a chrome-free `(print)` route group: `/print/orders/:id/invoice` (§11 layout: header
      note box, SO#/date boxes, info strip w/ salesperson initials, Ln#/F-code/Model/Brand
      line grid printing $0 lines, payments-by-method table, Merchandise→Amount Due totals
      rail, footer), `/print/orders/:id/delivery-ticket` (signature + date lines, collect-
      on-delivery amount), and `/print/deliveries?date=` batch — one ticket per undelivered
      trip, page-broken, not-ready trips printed WITH a bold flag (failed attempt / stock
      not fully reserved) per §7. **A1 lock**: `orders.locked_at` (migration 0034);
      individual print posts `/delivery-ticket-print` → locks; PATCH/line-add/line-remove/
      cancel all 409 while locked; batch never locks. `POST :id/unlock` requires the new
      `orders.unlock` permission (Owner+Manager via catalog, backfilled by the boot-time
      system-role sync; owner narrows via the §2 matrix/per-user overrides) + a typed
      reason → audit `order.unlock` → notifications feed. Order detail: locked banner w/
      unlock prompt + Print invoice/ticket buttons; day-sheet gained "All tickets (no
      lock)". Settings page gained the Store operations card (recycling fee $, delivery
      cap, invoice header/footer notes, PO reply-to). orders.int.spec +2 → 35/35.
      — _2026-08-26. Conventions flagged: Brand column = preferred vendor (catalog has no
      brand field); Terms prints "Balance due"/"Paid in full"; ops.unlockRoleIds is
      superseded by the `orders.unlock` permission and ignored; payments on the order
      stay allowed while locked (the office collects at delivery close-out)._
- [x] **Build P5:** Delivery dispatch table + 15-stop capacity + zip routes.
      `deliveries.route` (migration 0035) auto-suggested from the ship-to zip at
      scheduling ("91205" → "912xx"), free-text editable via PATCH. `GET
/v1/deliveries/capacity?from&to` returns per-day booked/remaining against
      ops.deliveryDailyCap (default 15; counted business-wide — one fleet, flagged as v1
      convention). Booking a full day now 409s unless `confirmOverCapacity: true`; the
      override writes audit `delivery.cap_override` (targeting the order) → owner
      notifications feed ("Delivery booked over capacity"). Web: `/deliveries/dispatch` —
      the §7 dispatcher table for a date (stop # + route inline-editable, order link,
      customer, address+phone, window, items, collect amount, status) with the "12/15
      stops" chip (amber near cap, red at cap) and All-tickets/Calendar links; calendar
      header gained Dispatch. Order detail's schedule box shows the day's booked/cap and
      turns the 409 into a confirm that retries with the override flag; New Sale shows
      "N of 15 stops left that day" under the delivery date (red "Full — booking will
      need a capacity override" at cap). deliveries.int.spec +2 → 14/14; orders 35/35.
      — _2026-08-26. Conventions flagged: cap counts stops business-wide, not per store;
      route suggestion is zip-prefix ("912xx") pending real route areas._
- [x] **Build P6:** Purchasing — builder pre-load, PO email, staged receiving, invoice
      matching. **Receiving** (migration 0036): purchase*order_lines gained
      quantity_inspected/quantity_accepted; new `POST :id/receiving` takes per-line stage
      increments with the invariant ordered ≥ received ≥ inspected ≥ accepted — stock and
      the special-order allocation flip (customer line → Reserved + arrival email) happen
      at ACCEPT, not dock receipt; PO auto-completes only when every unit is accepted;
      legacy `POST :id/receive` is now the "receive+inspect+accept in one" fast path over
      the same core, so nothing downstream changed. PO detail rebuilt as the single
      receiving screen (Ordered/Rcvd/Insp/Acc columns, three increment inputs per line,
      "X of Y accepted — N remaining", linked-SO chips, "Receive & accept all remaining").
      **Builder pre-load (§5/§6)**: /purchase-orders/new shows "Suggested for this vendor"
      — (a) at/below reorder point (existing endpoint, filtered to vendor) and (b)
      sold-not-in-stock queue rows (queue now exposes preferredVendorId + cost); queue
      adds carry `orderLineId`, which PO create now accepts to write the po_line_allocation
      so the SO # rides the PO (printed doc + emailed doc + detail chips all show it).
      **Email**: `POST :id/email` sends the PO to the vendor via the existing Resend/memory
      transport with Reply-To = ops.poReplyTo (SendEmailInput grew replyTo). **Invoices**
      (vendor_invoices table, RLS'd, unique per vendor+number): `POST /v1/vendor-invoices`
      auto-matches by PO # (or vendor+amount fallback), surfaces varianceCents vs the PO
      subtotal, `POST :id/approve` one-click (no queue per §13); new `vendor_invoices.manage`
      permission (Owner/Manager + Bookkeeper via role sync); PO page gained the invoice
      card (record & match, variance badge, approve). purchasing.int.spec +7 → 24/24,
      special-orders +1 → 6/6, orders 35/35; sweep e2e receiving flow updated.
      — \_2026-08-26. Conventions flagged: no-PO-number auto-match falls back to newest
      same-vendor PO with an equal subtotal; inspection is bookkeeping only (no damaged/
      reject disposition until P8's As-Is flow).*
- [x] **Build P7:** Transfers with ticket + sign + receive-confirm workflow. The spine
      already existed (draft → ship deducts origin → partial receives increment the
      destination → received; drafts cancellable); P7 added the §11 **Transfer Ticket**:
      `/print/transfers/:id` in the chrome-free print group — from/to store blocks with
      addresses, letterhead, lines with a blank hand-tally "Received" column, driver +
      received-by signature lines and a "confirm in the system to complete" footer;
      detail hydrate now carries fromLocationAddressJson/toLocationAddressJson/
      businessName; transfer detail page gained the Transfer ticket print button.
      Printing never changes state — the §5 workflow is create → print → deliver → sign
      on paper → receiving side confirms via the existing receive endpoint (actor
      recorded in the audit trail). transfers.int.spec +1 → 13/13.
      — _2026-08-26. Convention: signatures live on paper only (drivers work off printed
      tickets, §7); the system records who confirmed receipt, not a captured signature._
- [x] **Build P8:** Returns/exchanges, As-Is review flow, store credit. Migration 0037:
      `as_is_items` (review queue), `store_credit_entries` (ledger; balance = SUM, never
      stored), `order_lines.qty_returned`. **As-Is (§10/§5)**: every refunded/returned
      unit now lands in the pending-review queue instead of sellable stock (sales refund
      flow rerouted; existing tests updated to the new rule); `/v1/as-is` + `:id/review`
      (restock — optionally into the `-AS` variant via targetVariantId — / vendor*return /
      scrap; only restock touches inventory, one-shot, inventory.adjust-gated); web page
      `/as-is` in the Catalog nav with per-row Restock/Vendor/Scrap. **Store credit**:
      issue on refunds (`refundMethod: 'store_credit'` on sale refunds and order returns),
      redeem on order `store_credit` tenders with a hard balance check inside the request
      transaction; `GET /v1/customers/:id/store-credit`; New Sale shows the "Store credit
      available" chip when a customer is picked; customer page gained the ledger card.
      **Order returns**: `POST /v1/orders/:id/return` — per-line qty capped at delivered−
      returned, refund = line total + tax share per unit, reversed as negative payment
      rows (kind 'refund') walking original tenders newest-first, goods → As-Is; no
      restocking fee. `POST :id/price-adjustment` = the §10 distinct money-only type
      (kind 'adjustment', reason required). Both feed the owner notifications.
      **Exchanges**: `POST :id/exchange` writes an orderKind 'exchange' order linked via
      original_order_id; invoice doc prints "Exchange Order" + Original Invoice # box +
      Credit Due row; New Sale takes `?exchangeOf=` (banner, pinned customer, no take-with
      fast lane); order detail gained the Returns & exchange card (return qtys, refund
      method, adjustment, Write exchange order). List-view display statuses gained
      **Returned** (all delivered units returned) and **Exchanged** (a live exchange
      references the original). orders.int.spec +4 → 39/39; sales 11/11 + reports 14/14
      re-baselined to the As-Is rule; business 24/24.
      — \_2026-08-26. Conventions flagged: order-return tender reversal is newest-tender-
      first rather than strictly proportional (matches the sales-refund allocation);
      no Stripe reversal on order returns in v1 (office terminal); selling As-Is at a
      discount = restock then adjust onto the `-AS` SKU; service orders already link to
      sales (existing G6 module).*
- [x] **Build P9:** Commissions (equal-split default, exchange clawback), owner +
      manager dashboards, 22:00 auto-close job — _shipped in checkpoint 9 (PR #33,
      `5930f90`); box was left unchecked at the time._
- [ ] **Ops:** Provide the two sample invoices into `docs/` for the document templates
      (P4); confirm PO reply-to address; pick unlock-capable roles in settings once P1 ships

## Checkpoint 8 merged + deployed (2026-08-26)

PR #32 (P3–P8: orders list-view + notifications, print/lock/unlock + documents,
dispatch + capacity, staged receiving + PO email + vendor invoices, transfer tickets,
returns/As-Is/store credit/exchanges) squash-merged to main as `db89ef8`. CI needed one
fix first: the Playwright run — the FIRST ever CI pass over the P2 New Sale e2e (the web
build OOM'd locally back then) — failed 4 tests at the create-customer click; trace
forensics showed the Create button shoved under the sticky totals rail (grid/flex
`min-width: auto` overflow), a latent P2 layout bug, not a P3–P8 regression. Fixed with
`min-width: 0` on the form cells (`62d15e8`), all 4 verified green locally, then CI 4/4
green. Deploy branch rolled (`5bafced`), Render deploy `dep-da79h515efls73cj0g4g`
**live 07:43Z** — boot log: `Schema migrations: 38/38 applied,
head=0037_returns_as_is_store_credit; this run applied 0032_pos_ops_phase1,
0033_customer_search_addresses, 0034_order_print_lock, 0035_delivery_routes,
0036_receiving_stages_vendor_invoices, 0037_returns_as_is_store_credit.` `/health` 200.
Vercel production READY on main `db89ef8`; new endpoints (`/v1/orders/list-view`,
`/v1/as-is`) answer 401 through the prod proxy — routed and auth-gated. New permissions
`orders.unlock` + `vendor_invoices.manage` backfilled into system roles by the boot-time
role sync. Sprint branch restarted from main. **The whole POS-operations surface P1–P8
is live on `lamattress-erp.vercel.app`.** P9 (commissions, dashboards, auto-close)
remains. Ops unchanged: repoint Render repo URL (deploys still manual-trigger), rotate
the shared owner password, Resend domain when ready, sample invoices into `docs/`.

## Checkpoint 11 merged + deployed — invite link fallback (2026-08-26)

PR #35 squash-merged to main as `41577bd`; CI 4/4 green first try. Render deploy
`dep-da7ja5bm6pss73fudmr0` **live 18:50:37Z** — boot log `Schema migrations: 49/49
applied, head=0048_sale_line_order_discount_share; this run applied none (already up to
date).` Vercel production READY on main `41577bd`.

**Ops done this checkpoint:** `WEB_BASE_URL` on Render corrected from the stale
deploy-branch preview alias to `https://lamattress-erp.vercel.app` (deploy
`dep-da7ivn5g1s2s7381pql0`, live 18:28:13Z). Sending domain `mail.a-prompt.ai` created in
Resend (`fbebebe1-3a0a-4e91-a82a-b333cd6769b3`, us-east-1, `not_started`) — the root
`a-prompt.ai` was refused, 403 "domain has been registered already", i.e. claimed in a
different Resend account. Owner is adding the three DKIM/SPF records at GoDaddy; verify +
sending-scoped key + env vars follow. **Do not set `RESEND_API_KEY` before the domain
verifies** — a key with an unverified domain makes `ResendTransport` throw instead of
falling back, breaking the copy-link path.

`HANDOFF.md` added at the repo root and wired in as step 0 of the CLAUDE.md read order,
so a fresh session starts from current state rather than reconstructing it. The stale P9
checkbox (shipped in checkpoint 9) was corrected.

## Invite email — root-caused and unblocked (2026-08-26)

The owner reported an invite that never arrived. Two independent faults, both visible in
one Render log line for `POST /v1/business/members/:id/resend-invite` at 17:53:21Z:

1. **Nothing was ever sent.** `RESEND_API_KEY` is unset on the Render service, so
   `createEmailTransport` fell back to `MemoryTransport` (`"email captured (no Resend key
configured)"`) while the endpoint still returned 201 and the UI said "Invitation
   re-sent." Confirmed at the source: the Resend account has **no API keys and no
   verified domains** — production email has never worked.
2. **The link pointed at a stale preview.** `WEB_BASE_URL` was the deploy-branch Vercel
   preview alias, so even with working mail every invite would land on the wrong build.

**Fixed (bde4d23) — the dead end, not just the symptom.** `EmailTransport` now declares
`delivers`. When it is false, `POST /members/invite` and `/resend-invite` return
`inviteLink`, and the members page renders it with a Copy button instead of claiming the
mail was sent. The caller already holds `users.invite`, so handing them the link they
were about to email grants nothing extra; when a real transport is configured the field
is omitted entirely. `business.int` asserts the returned link carries the same token the
email does. 24/24 + admin 11/11 green, all gates verified by exit code.

**Ops done:** `WEB_BASE_URL` set to `https://lamattress-erp.vercel.app` on
`srv-da4tua3m8hqs73apsflg`; deploy `dep-da7ivn5g1s2s7381pql0` live 18:28:13Z.

**Ops still open — Resend sending domain.** Owner is deciding; `lamattress-erp.vercel.app`
is _not_ a candidate (Vercel owns that zone, so the DKIM/SPF records can't be added).
Domains the owner controls, from DNS: `lamattress.com` (GoDaddy DNS, Zoho Mail),
`lamattressstores.com` (GoDaddy, GoDaddy mail), `jetnine.com` (Cloudflare, Google
Workspace). A dedicated subdomain is the safe shape — it keeps Resend's SPF/DKIM off the
zone that already carries live mail. Until then, account creation runs on the copy-link
path above.

## QA steps 6 + 3 completed against the deployed build (2026-08-26)

Driven through the staging API (browser tools were unavailable), so these exercise the
same deployed code the browser QA was hitting.

**Step 6 — delivery runs, on run `2c0da72d` (2026-08-26, 2 stops, COD due $1,810.50):**

- D5 verified live: `GET /v1/orders/:id` now returns
  `onOpenRun {runId, runDate}`, and `PATCH` on a run member is refused 409 ("Remove it
  from the run (with a reason) before editing"). Previously enforced but invisible.
- Pull-off-run: refused 400 without a reason, accepted with one; registered
  `manifest_removal` (warning) attributed to the actor; the pulled order's `onOpenRun`
  went null and it became editable again. No `manifest_removal` codes exist in the tenant
  yet, so free text is the A9 fallback — **add codes for that class** to make it coded.
- Close-out refusals both hold: an unaccounted stop → 400 naming the stop id; a `failed`
  outcome with no reason → 400 "A reason is required".
- Close-out with one stop delivered and a COD mismatch → run `completed`, and
  `cod_variance` registered: _"Run 2026-08-26: COD due $800.00, collected $1700.00"_ with
  `{codDueCents, codCollectedCents, receivedBy}` in metadata. Note COD due had recomputed
  from $1,810.50 to $800.00 when the second stop was pulled — correct, and worth knowing
  when reading the variance.

**Step 3 — return split (SO-2026-000005 pickup, SO-2026-000010 drop-off):**

- Coded return reason enforced (tenant has CHGMIND), and the original-tender cap fires:
  a $1,000 return against $200 collected → 400 "use store credit for the difference".
- **Pickup**: authorization moved nothing — `paidCents` unchanged, `qtyReturned` 0, no
  As-Is row, RMA `RMA-SO-2026-000005-1` `authorized`, list view "Awaiting Return Pickup".
  On `POST /order-returns/:id/receive`: store credit $0 → $1,000, `qtyReturned` 1, one
  As-Is piece `pending_review`, RMA `completed`, status "Returned". A7 holds end to end.
- **Drop-off**: one request → `completed`, refund row `cash -100000`, `paidCents` 0,
  goods to As-Is. Immediate, as specified.

**D1 verified on the live system.** Rebuilt the exact case: register sale INV-2026-000006,
$1,000 list less a 30% cart discount, $700 collected. Refund paid out **$700.00** (it
would have paid $1,000 before the fix). D2 also confirmed live — the same sale was first
refused `REASON_REQUIRED` with no reason, which is the hole that let the original
INV-2026-000005 through.

**D9 resolved — not a defect.** `GET /v1/products/9786c836…` returns Q-MOS10 with
`priceCents: 0` and `costCents: 125500`. Both the API and the variants table map the
columns correctly; the $1,255.00 on screen _is_ the Cost column, and the Price cell is an
editable input reading `0.00`. **But the underlying observation is real and is a cutover
blocker:** the STORIS catalog imported with no retail prices (D12, by design), so every
imported variant is $0.00 and lands on an order at zero. Spot-checked across the catalog —
`pos/product-search` returns `price=0` for every imported SKU. A price source is needed
before go-live: import a price file, or set prices in-app.

**Test-data ledger additions (D11):** INV-2026-000006 ($700 discounted register sale, fully
refunded); SO-2026-000010 (paid, fulfilled, drop-off returned); a $1,000 store-credit
balance on customer ELICIA JOHN (4364a598) from RMA-SO-2026-000005-1; two As-Is pieces
pending review; run 2c0da72d closed with a COD variance; SO-2026-000008 pulled off that run.

## Checkpoint 10 merged + deployed — QA pass fixes (2026-08-26)

First browser QA pass over the deployed gap-closure surface produced 15 findings.
PR #34 squash-merged to main as `f72a3db`, CI 4/4 green first try. Render deploy
`dep-da7i1u7avr4c73fub8o0` **live 17:24Z** — boot log: `Schema migrations: 49/49 applied,
head=0048_sale_line_order_discount_share; this run applied
0048_sale_line_order_discount_share.` `/health` + `/ready` 200; Vercel production READY on
main `f72a3db`; `/v1/audit-logs` answers 401 through the prod proxy (the D8 proof).

**D1 — refunds overpaid by the whole discount (real money).** `sale_lines.discount_cents`
holds only a line's _own_ discount; a cart-level discount lives on the sale header and the
refund never consulted it, so a $1,000 line sold for $700 under a 30% cart discount
refunded $1,000 — true of **every** refund against a discounted sale, not one invoice.
Fix: the line's share of the sale discount is computed at sale time and **persisted**
(`order_discount_share_cents`, migration 0048) rather than re-derived — the pro-rata
rounding residue cannot be reconstructed afterwards because line order was never stored,
and pennies of ambiguity do not belong in a refund. Legacy rows fall back to
`reconstructOrderDiscountShares` (exact in total). Second half of the same bug: sale
refunds returned **pre-tax** amounts while the order-return path returned tax; both now
return what was collected.

**D2 — the register bypassed the price-variance gate.** `POST /v1/sales` never called it,
and New Sale's fully-paid take-with fast lane posts a register sale, so the hole was
reachable from the order screen too — that is how the D1 invoice was written. The gate
moved out of `OrdersController` into a shared `PriceVarianceService` both doors call.
**Discount codes are exempt**: a coupon is a pre-authorized instrument created by someone
holding `discounts.manage`; demanding a reason per redemption would only teach staff to
type junk. (Exempting them also fixed the 3 discount-code specs the gate first broke.)

**D4** all five `window.prompt` calls (pull-off-run, cancel-return, as-is price, vendor
R/A, vendor credit) replaced with the in-app dialog, which gained typed `fields` — a
native prompt can carry neither a coded reason nor a manager challenge, and it froze the
QA browser. **D6** the over-capacity confirm matched the substring `'at capacity'`; the
G12 multi-dimension rewrite changed the message and silently disabled the documented
override — now a structured `OVER_CAPACITY` code. **D7** commission plans had API support
since G5 but no UI, so nobody was ever on a plan, `planFor()` returned null for everyone
and nothing accrued; added a Plans card. **D8** `/audit` hand-rolled `fetch` against its
own `NEXT_PUBLIC_API_URL` default and so called `http://localhost:4000` in production;
switched to the shared `api()` helper.

**Three QA findings corrected rather than fixed:** (a) _D5 — the run lock does work_;
`assertNotOnOpenRun` was already enforced on every edit path. What was missing is that the
order detail never reported run membership, so the page showed no banner and left controls
live — enforced but invisible. Detail now returns `onOpenRun`. (I first "fixed" this by
duplicating the existing guard, then reverted.) (b) _Tier 3 collapsing to "needs a reason"
is by design_ — the QA tested as owner, who holds `orders.price_override`, so no second
signature is demanded; the below-cost CRITICAL never appeared only because the exception
records _after_ a reason is supplied. (c) _D10 two-`/pos`-screens is deployment skew, not
code_ — no `order-entry` file, no "Enter a Sales Order" string, one `/pos` route, sidebar
label hardcoded to "New Sale"; a stale cached build was being served.

**Not fixed:** D9 (variants Price/Cost) is not reproducible from code — both the API
projection and the table map the fields correctly, and the two symptoms conflict ($1,255
under Price cannot land on an order at $0.00). Needs the raw `GET /v1/products/<id>`
payload for Q-MOS10; suspect the STORIS import wrote cost into `price_cents`. A real
adjacent ambiguity was confirmed: the Cost column renders "hidden" both when the viewer
lacks `products.cost.view` and when cost is genuinely null.

API suite 489→**500 passing** (+11 covering the D1 numbers and all three D2 tiers); e2e
8/8 run locally before the push and green in CI. Ops unchanged, plus: **the cashier and
manager accounts still need creating** (Settings → Users → Invite) — the QA agent cannot
type passwords, and step 2's override flow needs a second, non-owner identity.

## Checkpoint 9 merged + deployed (2026-08-26)

PR #33 (the whole STORIS gap closure G1–G15 + §2 append-only audit + P9) squash-merged to
main as `5930f90`. CI took three passes, each a real defect in the sprint's own work, none
a flake:

1. `next lint` rejected a bare apostrophe in the new morning-brief heading
   (`react/no-unescaped-entities`). **Root cause of the miss:** the local verification
   grepped for lowercase `"error "`, and `next lint` prints `Error:` — so a red lint read
   as green. Every gate is now verified on its **exit code**, not on grepped output.
2. Both new suites died on `FATAL: database "jetnine_controls"/"jetnine_closeout" does not
exist` — CI provisions each spec's database explicitly and the two new ones were never
   added. Fixed by diffing every `jetnine_*` name the specs reference against the
   `createdb` list (only `jetnine_rehearsal` is legitimately absent — that spec self-skips
   without `STORIS_REHEARSAL_DIR`); added the two `createdb` lines plus their
   `*_TEST_DATABASE_URL` env vars.
3. Green 4/4 — and Playwright ran for the first time on this PR (it had been `skipped`
   both prior rounds because it `needs: verify`). Before the third push the e2e suite was
   also run **locally** (8/8) against a fresh `jetnine_e2e` using the temp
   `playwright.local.config.ts` recipe pointing at `/opt/pw-browsers/chromium` — deleted
   before committing, never committed.

Deploy branch rolled (`8126b48`), Render deploy `dep-da7cpuu1egvs73e7vk50` **live 11:26Z** —
boot log: `Schema migrations: 48/48 applied, head=0047_daily_closeouts; this run applied
0038_reason_codes_security_overrides, 0039_order_returns, 0040_write_offs_exceptions,
0041_delivery_runs, 0042_transfer_variance, 0043_print_preconditions, 0044_as_is_pieces,
0045_purchasing_controls, 0046_capacity_units, 0047_daily_closeouts.` — all ten applied in
one run, clean. `/health` ok + `/ready` 200 on the fresh instance; `CloseoutService` logged
`Daily close-out scheduled at 22:00 store-local time`; the overdue sweep still arms at
09:00 UTC. Every new endpoint (`/v1/exceptions`, `/v1/closeouts`, `/v1/dashboard/morning`,
`/v1/write-offs`, `/v1/reason-codes`, `/v1/order-returns`, `/v1/delivery-runs`) answers 401
on staging **and** through the prod proxy — routed and auth-gated. Vercel production READY
on main `5930f90`; `lamattress-erp.vercel.app` serving 200. New permissions
(`reason_codes.manage`, `security_overrides.view`, `inventory.write_off`, and the rest)
backfilled into system roles by the boot-time role sync. Sprint branch restarted from main.

**The 9-phase POS-operations build and the 15-item gap closure are both complete and live.**
Ops unchanged: repoint the Render repo URL (deploys still manual-trigger), rotate the shared
owner password, Resend domain when ready, sample invoices into `docs/`.

## STORIS gap-closure build (PLAN-STORIS-GAP.md) — ranked tracker

Owner delivered a full STORIS gap analysis 2026-08-26 ("we need to add all which is
missing"); committed verbatim as `PLAN-STORIS-GAP.md` with amendments A5–A9 (soft print
lock / run hard-lock, 3-tier price variance, refund gated on goods receipt, as-is piece
ids, coded reasons everywhere). Build in the doc's ranked order; each item is a vertical
slice. P9 (commissions/dashboards/auto-close) stays queued and will absorb the gap doc's
commission-clawback + digest requirements.

- [x] **G1 — Security Override primitive:** migration `0038_reason_codes_security_overrides`;
      `SecurityOverrideService.require()` gates at the point of action — actor with the
      permission passes, actor without gets 403 `code:OVERRIDE_REQUIRED` (names the action +
      permission), retry with a _different_ authorized user's email+password verifies the
      credential (root connection — the accounts owner-only RLS policy rightly blocks the
      request tx), checks the authorizer's effective permissions (role + per-user overrides),
      refuses self-authorization, and stamps `security_overrides` with both identities +
      before/after. `GET /v1/security-overrides` register (new `security_overrides.view`
      perm; Owner/Manager/Bookkeeper). Reusable `<SecurityOverrideDialog>` (reason select →
      manager-credentials section appears on 403; used by order unlock). Pilot consumer:
      order unlock — `orders.unlock` holders proceed as before, others via override; the
      `ApiError` class now carries structured bodies so the client can react to codes.
      controls.int.spec 13/13; orders 39/39, business 24/24, RLS 14/14 unaffected.
      — _2026-08-26._
- [x] **G2 — Reason Code registry:** `reason_codes` (usage classes from shared
      `REASON_USAGE_CLASSES`, restricted flag, active flag; unique per business+class+code;
      deactivate-not-delete). CRUD API (`reason_codes.manage`; listing open to any member —
      every prompt reads it), Settings → "Reason codes" card. Consumers wired: unlock
      (class `exception`) + price adjustment (class `adjustment`) — once a class has active
      codes, free text is refused and the resolved code lands in audit metadata; while a
      class is empty, free text is the transitional fallback (amendment A9). — _2026-08-26.
      Conventions flagged: restricted-code enforcement (manager auth to *use* a restricted
      code) lands with its first consumer (as-is flows, G4/G10); return-line coded reasons
      ride with G3._
- [x] **G3 — Return lifecycle:** migration `0039_order_returns` — `order_returns`
      (RMA `RMA-{order#}-{n}`, status authorized/completed/cancelled, fulfillment
      drop*off/pickup, refund method + amount captured at authorization) +
      `order_return_lines` (per-line qty, per-unit cents, coded reason class `return`).
      `POST /orders/:id/return` now *authorizes* (no money, no inventory; open
      authorizations count against returnable qty; list-view shows "Awaiting Return
      Pickup"); `POST /order-returns/:id/receive` (inventory.receive — warehouse-side)
      fires the whole physical+financial event: qtyReturned, As-Is intake, tender
      reversal / store credit, status completed; drop-off (default — goods in hand)
      authorizes + receives in one request, flagged. `:id/cancel` voids an authorization
      (reason; override-gated on pos.refund.create). UI: fulfillment select, coded
      return-reason select, per-order returns table w/ "Goods received"/Cancel.
      Notifications feed += return_authorized / cancel / security.override labels.
      orders.int.spec 39→42. — \_2026-08-26. Conventions flagged: one reason code applies
      to all lines of a return (per-line selects when a real need shows); As-Is rows
      keep referencing the order (P8 contract); original-tender cap re-checked at
      receipt — a shortfall blocks with "re-authorize as store credit"; SoD: writer
      needs pos.refund.create, receiver needs inventory.receive.*
- [x] **G4 — Scrap/write-off control:** migration `0040_write_offs_exceptions`. Scrap in
      As-Is review is now a write-off: gated on new `inventory.write_off` (Owner/Manager;
      a clerk goes through the manager-override dialog), coded reason (class `write_off`),
      valued at variant cost onto the `write_offs` register (`GET /v1/write-offs` w/
      rolling total, reports.inventory.view). Vendor returns REQUIRE an R/A number and
      open a credit to chase (`vendorCreditStatus` open → received / written-off via
      `POST /v1/as-is/:id/vendor-credit`, vendor*invoices.manage; giving up on a credit is
      itself an exception). — \_2026-08-26.*
- [x] **G5 — Exception register + ranked digest:** `exception_events` (type, severity,
      actor, ack state) + `ExceptionsService.record()` wired into the control points:
      security overrides, order unlocks, over-capacity bookings, write-offs, vendor-credit
      write-offs. `GET /v1/exceptions` (filters: open/severity/type/actor, audit.view),
      `POST :id/ack` (one-shot, stamps who), `GET /v1/exceptions/digest?days=` — the §2
      per-associate ranked digest. New `/exceptions` page (register table + ack + 7-day
      ranked digest card) in the Insights nav. controls.int.spec 13→19; orders 42/42,
      deliveries 14/14, RLS 14/14. — _2026-08-26. Convention flagged: the override stamp
      accepts the action's own reason code (any class) — class enforcement stays with the
      consuming prompt, so the dialog never asks for two reasons; G6 adds the threshold
      writers (price variance) to the same register._
- [x] **G6 — Price variance 3-tier + §5 gates:** server-side variance gate on order
      create / draft-confirm / discount raise / line add, against catalog list prices
      (line overrides + line discounts + order discount): tier 1 (≤5% OR ≤$50) logged
      only; tier 2 (≤15%) → 400 `code:REASON_REQUIRED`, coded reason (class exception) + exception-register entry; tier 3 (>15% or below variant cost) → manager
      security override on new `orders.price_override`, below-cost registers as
      **critical**. Thresholds per business in ops settings `priceVariance` (editable
      in Settings → Store operations). New Sale catches REASON*REQUIRED/
      OVERRIDE_REQUIRED and runs the approval dialog, then retries. Also: layaway $100
      minimum deposit enforced at save (override on orders.complete_with_balance +
      registered), and qualifying orders written without a recycling-fee line register
      a `recycling_fee_removed` exception automatically (server-side keyword check —
      can't be bypassed by the UI). orders.int.spec 42→48. — \_2026-08-26. Conventions
      flagged: margin floor = variant cost (no separate floor setting yet); drafts skip
      the gate but re-run it at completion; exchange passes control fields through;
      tax-exempt gate deferred — no tax-exempt field exists on orders yet; daily cash
      refund cap deferred to the §8 refund-controls slice.*
- [x] **G7 — Delivery run object + close-out reconciliation:** migration
      `0041_delivery_runs` — `delivery_runs` (date/route/truck label/driver, COD due vs
      collected + received-by, status open→out→completed) + `deliveries.run_id` +
      `deliveries.failure_reason_code_id`. Build a run from a day's scheduled stops
      (`POST /v1/delivery-runs`); **run membership is the A5 hard lock** — orders on an
      open/out run refuse edits AND unlock with 409 until pulled off the run (coded
      `manifest_removal` reason, exception registered — STORIS S$TE*MAINIF_RMV). Depart
      flips stops out-for-delivery. **Close-out is mandatory reconciliation**: every open
      stop needs an outcome — delivered (existing completion path: stock leaves,
      reservations consume, order advances) or failed (coded `delivery_failure` reason →
      exception + optional auto-reschedule cloning the stop's lines to a new date); COD
      due (delivered stops' balances) vs collected compared, variance → `cod_variance`
      exception with who received the cash. Manifest print page
      (`/print/delivery-runs/:id`): stops in order, per-stop collect + signature +
      outcome checkboxes, driver + office-received signature lines. Dispatch page: run
      cards (Depart / Pull-off / Close-out form / Print manifest) + "Build run" from
      unassigned stops. deliveries.int.spec 14→16; orders 48/48, RLS 14/14. — \_2026-08-26.
      Conventions flagged: A5 applied as print-lock stays hard (per A1, now
      override-able) with the run lock layered stronger on top; truck is a free label
      until a truck entity exists; COD due counts delivered stops only; postponement
      counter rides with G13's auto stock release.*
- [x] **G8 — Transfer variance + aging + types:** migration `0042_transfer_variance`.
      (In-transit was already a real bucket — ship deducts origin, receive credits
      destination, so road goods are sellable nowhere; kept.) New: **`POST
/v1/stock-transfers/:id/close-short`** — a short transfer can't be dismissed, only
      resolved: needs `inventory.write_off` (clerk → manager-override dialog), a coded
      reason (class `transfer_variance`), values the missing units at cost onto the
      write-off register (attributed to origin), registers a `transfer_variance`
      exception, status → `closed_short`. `GET /v1/stock-transfers/aging?days=3` — the
      in-transit-too-long standing alert, surfaced as a red banner on the transfers page.
      Transfer types (`replenishment`/`floor_sample`/`customer`/`as_is`) on create + a
      type select in the UI. transfers.int.spec 13→15. — _2026-08-26. Conventions
      flagged: floor-sample type is recorded but doesn't yet gate sellability at the
      destination; the request workflow (store asks → warehouse approves) and a
      coded creation reason are deferred; receiving identity already captured in
      movements/audit._
- [x] **G9 — Print preconditions + reprint counter + unlock window** + **G15 pick
      list:** migration `0043_print_preconditions` (`orders.ticket_print_count`,
      `orders.relock_at`). Delivery-ticket print now checks server-side and answers a
      pass/fail checklist (409 `code:PRINT_BLOCKED`): stock lines reserved; a scheduled
      trip (delivery orders) / promised date (pickups); balance ≤ new ops setting
      `maxBalanceForTicketPrintCents` — the balance cap alone is override-able
      (orders.complete*with_balance, manager dialog). Every print bumps the copy
      counter; copy 2+ registers a `ticket_reprint` exception and the print page shows
      "REPRINT — copy #n". **Unlock is a 15-minute window** (relock re-engages lazily,
      no cron; fresh unlock re-opens it) and the **3rd unlock on one order escalates to
      a critical exception**. Locked-state allowlist per §3: delivery instructions /
      notes / address fixes pass through the lock so unlocking never becomes routine.
      **G15**: `/print/orders/:id/pick-list` — warehouse pull sheet with qty, item,
      model/SKU, pulled checkbox, pulled-by/checked-by lines and **no prices**; button
      on the order page; never locks. orders.int.spec 48→52 (P4 suite adapted: pickup
      fixture satisfies preconditions; notes edits now pass the lock by design). —
      \_2026-08-26. Conventions flagged: reserved/date failures are hard blocks (fix the
      data), only the balance cap has an override path; credit-hold check waits for a
      credit-hold field to exist; document id/revision on invoices deferred.*
- [x] **G10 — As-is piece identity:** migration `0044_as_is_pieces` — `as_is_items` +=
      piece*number, condition, as_is_price_cents, storage_location, reason_code_id.
      Intakes and return receipts now explode into **one row per unit** with a piece
      reference (`AS-XXXXXXXX`, id-derived — no sequence race); legacy qty>1 rows stay
      valid. Coded intake reason (class `as_is`) mandatory once codes exist; a
      **restricted** code (STORIS "As-Is Restricted") needs `inventory.write_off` or a
      manager override. `PATCH /v1/as-is/:id` — condition + storage location free,
      as-is price gated on new `as_is.price.set` (Owner/Manager; override dialog for
      others). `GET /v1/as-is/aging?days=60` — pieces stuck in review. UI: piece #,
      condition, storage, as-is price shown per row + "price…" action. controls.int.spec
      19→22; orders/sales/reports 77/77 unaffected. — \_2026-08-26. Conventions flagged:
      photos deferred (needs the storage decision already on the backlog); max discount
      off original not enforced yet (price is manager-gated instead).*
- [x] **G11 — Purchasing controls:** migration `0045_purchasing_controls`
      (`purchase_order_lines.quantity_rejected`, `vendor_invoices.created_by_user_id`,
      `vendors.remit_to`). **Third bucket**: staged receiving takes `rejected` —
      invariant ordered ≥ received ≥ inspected ≥ accepted+rejected; rejects become
      As-Is pieces (never silently sellable, reviewer disposes → vendor return w/ R/A
      or valued scrap), register a `po_reject` exception, and count as dispositioned so
      the PO still completes (no pressure to accept damage). **SoD on invoice
      approval**: the recorder cannot self-approve — a _different_ holder of
      vendor*invoices.manage signs (override dialog; `force` mode added to the
      override primitive). **Tolerance auto-clear**: matched invoices within ops
      `invoiceVarianceToleranceCents` approve themselves — reviewers only see
      exceptions. **Remit-to alert**: `vendors.remit_to` changes register a CRITICAL
      `vendor_remit_change` exception (vendor-master fraud). **Blind receiving**: ops
      toggle hides Ordered/expected/cost columns on the receiving grid (PO detail
      carries the flag). Settings knobs for tolerance + blind mode. purchasing.int.spec
      24→27 (P6 approve updated: manager signs per SoD). — \_2026-08-26. Conventions
      flagged: PO hold/release deferred (POs here are buyer-created, not auto-created
      from order entry — the hold's driver); landed cost, receiving-error reversal as a
      distinct transaction, R/A field on POs, email-PO ack capture deferred; remit-to
      is API-level until the vendor edit UI lands (existing backlog item).*
- [x] **G12 — Multi-dimensional capacity + zip→route mapping:** migration
      `0046_capacity_units` (`product_variants.capacity_units`, default 1 — a king set
      is not a twin). Capacity is now stops + optional per-day piece budget
      (`deliveryDailyPieceCap`) + optional capacity-unit budget
      (`deliveryDailyCapacityUnits`); scheduling refuses 409 **naming the over
      dimension** ("over capacity on capacity units (4 + 3 > 4)"), override still
      deliberate+registered; `/deliveries/capacity` reports pieces + units per day.
      `ops.zipRoutes` ("912" → "Glendale AM") wins route suggestion by longest prefix,
      falling back to the zip-prefix label. Settings knobs for both budgets.
      deliveries.int.spec 16→17. — _2026-08-26. Conventions: zipRoutes edited via API/
      settings JSON for now (no dedicated editor); stop times/windows already exist on
      deliveries; truck lanes wait for a truck entity (G7 note)._
- [x] **G13 — Line roll-up + Past Due + Auto Stock Release + drift:** list-view rows
      carry `lineSummary` (units/reserved/fulfilled/special-order, rendered "2 of 3
      reserved · 1 SO" under the status chip) and `?view=past_due` — undelivered orders
      past their promised date, one chip on /orders. `POST /v1/orders/auto-stock-release`
      (inventory.adjust; {days, dryRun}) frees reservations on open orders promised >N
      days ago with nothing on a truck and no lock — each release audited + registered
      (`auto_stock_release`); P9's nightly job will call it. `GET
/v1/orders/reservation-drift` (reports.inventory.view): SUM(line reserved) vs
      level reserved per variant+location, drift rows only. orders.int.spec 52→56. —
      _2026-08-26. Conventions: past-due keyed on requestedDate (scheduled-trip lateness
      shows via Scheduled status + date already); per-line Hold, credit hold, EST-vs-SCH
      date distinction, and manual reservation re-assignment still open (rolled into the
      backlog); postponement counter still deferred to P9._
- [x] **G14 — Duplicate-order prompt + ATP-vs-promise warning:** `GET
/v1/customers/:id/open-orders` (open orders w/ promised + next-trip dates); New
      Sale shows a warning banner when the picked customer already has open orders
      ("consider one truck"), and completing with a promised date EARLIER than any
      line's ATP date demands an explicit confirm naming the late lines. —
      _2026-08-26. Conventions: the consolidate prompt is advisory (banner), not a
      blocking dialog; credit-application gate for Synchrony/Acima still open (needs a
      credit-app entity)._
- [x] **§2 audit coverage:** `audit_logs`, `security_overrides`, and `write_offs` are
      now **append-only at the DB level** (UPDATE/DELETE revoked from app*user in
      rls.sql; exception_events keeps UPDATE for acknowledge). Field-level coverage
      audit: line add/remove/qty ✓ (endpoint audits), price + discount changes ✓ (G6
      exceptions + order.update diffs), delivery date changes ✓ (order.update /
      delivery PATCH diffs), salesperson change ✓ (order.update diff), recycling-fee
      removal ✓ (G6 exception), route/date-after-print ✓ (G7 run lock + audits),
      customer-swap N/A (no endpoint can change an order's customer), tax-exempt /
      tender-void / deposit-transfer N/A (those routines don't exist yet — each gets
      its control when built). — \_2026-08-26.*
- [x] **Build P9:** commissions clawback + morning dashboards + 22:00 auto-close.
      Migration `0047_daily_closeouts`. **Commissions:** accrual at completion (split per
      split*bps) already existed; `reverseForOrderReturn` now claws back the returned
      fraction as negative entries when a return's goods are received (rides the A7
      lifecycle — an exchange nets out: clawback on the return, fresh accrual on the
      exchange order's own completion). **Morning dashboard:** `GET /v1/dashboard/morning`
      (reports.sales.view; `?date=` + `?locationId=` for the store-manager scope) —
      yesterday by store (orders written + register sales), by associate (order totals
      split-weighted + sale totals), today's deliveries vs the cap, refunds/cancellations
      with the actor, the daily modification log, and the open-exception count; rendered
      as the dashboard "Morning brief" card (hides on 403). **22:00 auto-close:**
      `CloseoutService` in-process scheduler (OverdueScheduler pattern: 10-min tick, fires
      once per store-local day after CLOSEOUT_LOCAL_HOUR=22, store timezone-aware,
      NODE_ENV=test/CLOSEOUT_ENABLED=false guards) — never blocks, flags: open cash
      drawers, today's undelivered trips, delivery runs never closed (critical),
      delivered-with-balance orders (critical, the §1 standing alert); findings land on
      the exception register; the nightly G13 Auto Stock Release rides along once per
      business. Idempotent via unique (location, close_date) `daily_closeouts` row;
      `POST /v1/closeouts/run` manual trigger + `GET /v1/closeouts` history.
      closeout.int.spec 4/4; full API suite 39 files / 489 tests green. — \_2026-08-26.
      Conventions flagged: dashboard day boundaries are UTC calendar dates (matches the
      Z-report); commission clawback fires on returns only (price adjustments do not
      recalc commission in v1); close-out balance/deliveries scoped per location, stock
      release per business; close hour env-configurable, not per-store yet.*

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

## Cutover session — Resend chain + bulk price entry (2026-08-26)

Two owner decisions taken this session (AskUserQuestion, on record):

1. **Resend sending domain is now the ROOT `a-prompt.ai`** — the owner deleted the
   `mail.a-prompt.ai` subdomain from HANDOFF §4a and created the root domain instead
   (id `e3b4a9d3-170d-4cc2-b082-6e7505b08ead`, us-east-1; the earlier "claimed in
   another account" 403 evidently resolved). Owner confirmed the root-name records
   (`resend._domainkey` TXT / `send` MX prio 10 / `send` SPF TXT — no `.mail` suffix)
   were saved at GoDaddy. Verification triggered and the domain reached **verified**
   (all three records) within ~20 min. Then, in order: sending-scoped API key
   `jetnine-api-render-sending` created restricted to that domain; `RESEND_API_KEY` +
   `RESEND_FROM_EMAIL` (`LA Mattress ERP <notifications@a-prompt.ai>`) set on
   `srv-da4tua3m8hqs73apsflg` (env update auto-triggered deploy
   `dep-da7kc6fqj5pc73835nvg`). The key was set **only after** the domain verified,
   per the HANDOFF §4a trap. Proof-of-delivery invite: see the note below once sent.

2. **Catalog prices will be set in-app** (not imported) — D12 register-side pricing
   stands; the owner chose manual entry over a retail-price file. To make 6,909
   zero-price variants feasible, this session shipped a **bulk price entry** slice:
   - API: `GET /v1/products/variants/pricing` (`products.view`; flat variant
     work-list joined to products, cursor-paginated by SKU, `unpricedOnly=1` filter,
     tsvector search, `unpricedCount` remaining-work counter, cost gated on
     `products.cost.view`) and `POST /v1/products/variants/bulk-price`
     (`products.update`; ≤200 `{id, priceCents}` per request, non-negative-integer
     validation, unknown-id 404, per-variant `product.variant.price.update` audit
     rows identical to the single-price PATCH, unchanged rows skipped, all on the
     request's RLS transaction).
   - Web: `/products/pricing` — "Unpriced only" on by default, search, inline
     new-price column with invalid-amount highlighting, batched save, remaining
     counter, Load more; "Set prices" button added to the Products page header.
   - Tests: catalog.int.spec.ts 10→16 (work-list shape + count, cashier cost
     redaction, permission gate, malformed/unknown rejects, bulk write + audit row +
     count drop). Gates by exit code: typecheck 0 · lint 0 · catalog spec 16/16 ·
     prettier 0.

## Owner-scoped build from the STORIS sysadmin handoff (2026-08-27)

The owner supplied a STORIS System Administration corpus digest (599-article index).
Direction confirmed by owner: **still migrating OFF STORIS** (the doc's conversion
machinery is inverted for us — treated as a feature inventory only); **no STORIS API
licensing** (§8 dropped). Build mandate picked by owner: **Brand/Collection and
warehouse bin locations only** (protection plans/warranty, credit hold stay backlog).
Both shipped as vertical slices:

- **Brands + Collections (migration `0049_brands_collections`):** `brands` and
  `collections` tables (RLS'd, unique name per business, deactivate-not-delete;
  collections optionally reference a vendor), `products.brand_id`/`collection_id`
  (set-null FKs). `/v1/brands` + `/v1/collections` CRUD in the catalog module —
  convention: list under `products.view`, mutations under `products.update` (no new
  permission; STORIS files these under Product Settings). Products create/PATCH/detail
  carry both ids. **P4 invoice Brand column now prints the real brand**, falling back
  to the variant's preferred vendor (the old v1 convention) for unbranded rows.
  Product detail page gained a Brand & collection card (selects + create-on-the-fly).
  catalog.int.spec 16→20.
- **Storage bins (migration `0050_storage_bins`):** `storage_bins` per location
  (unique code per location, uppercased, deactivate-not-delete) +
  `inventory_levels.storage_bin_id`. `/v1/inventory/bins` list/create/patch and
  `/v1/inventory/levels/assign-bin` (level must exist; bin must be an active bin of
  the same location) — mutations under `inventory.adjust`, all audited. Levels API +
  Inventory page carry the bin (per-row select + a bins management section);
  **the G15 pick list prints a Bin column** (stock location at the order's own store).
  inventory.int.spec 9→13; RLS suite green with both tables registered.

Gates by exit code: typecheck 0 · lint 0 (one `react/no-unescaped-entities` caught and
fixed pre-push — the checkpoint-9 lesson holding) · catalog+inventory+orders+RLS suites
all pass · prettier 0.

**Also received, pending owner direction:** a STORIS-style documentation-system handoff
(P0 scaffold prompt) — owner dismissed the kickoff question, holding until instructed;
and a reverse-engineered **Sales Processing behavioral spec** (docs/erp 00–13 +
SOURCES) whose fulfillment-centric order model diverges from the shipped order/delivery
model — flagged as a [DECIDE] for the owner before any rework. More handoffs incoming
per owner.

## Spec packs committed + Phase-0 parity mapping (2026-08-27)

Owner delivered two reverse-engineered STORIS behavioral spec packs (more announced):
**Sales Processing** (docs/erp/00–13 + SOURCES, from two identical zips) and
**Inventory Management** (docs/erp-inventory/00 + 05–08; its five big `sections/`
files and 99-source-index are still outstanding — the parity checklist is keyed to
their rule IDs and is blocked until they arrive). Both committed verbatim into the
repo as directed. Per both packs' own Phase-0 rule, `docs/erp/PARITY-NOTES.md` now
maps every pack entity to the shipped system and lists the conflicts as owner
decisions (C1 fulfillment-centric money · C2 costing layers · C3 bucket ledger ·
C4 piece identity · C5 physical inventory · C6 fractional qty · C7 vocabulary),
notes the pack questions the shipped system already answers, and recommends treating
the packs as post-cutover hardening backlog rather than a pre-cutover rebuild.
No code changed for this. The STORIS-docs documentation-system handoff remains on
hold (owner dismissed the kickoff question).

## Email is LIVE — invite delivered end to end (2026-08-27)

The HANDOFF §4a thread is closed. Chain executed in order: root `a-prompt.ai`
verified in Resend (owner's GoDaddy records, all three green) → sending-scoped API
key `jetnine-api-render-sending` (domain-restricted; token lives only in the Render
env) → `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (`LA Mattress ERP
<notifications@a-prompt.ai>`) set on `srv-da4tua3m8hqs73apsflg` → deploy
`dep-da7kc6fqj5pc73835nvg` live 20:03Z, boot log `Schema migrations: 49/49 applied…
this run applied none`. **Proof:** owner clicked Resend invite for
`me.lamattress@gmail.com` at 04:51:29Z — Render logged the POST 201 (595ms, real
API call, no inviteLink fallback in the response), Resend shows the message
**delivered** via SES on the verified domain. The key was set only after
verification, so the copy-link path was never broken. Production email works for
the first time. Ops next: accept that invite to create the manager/second account
(expires 2026-08-29 17:53Z), which unblocks browser-QA step 2.

## Accounting corpus received + invite-in-spam note (2026-08-27)

The full STORIS Accounting bundle landed and verified complete against its own
manifest — 307 verbatim articles (00-accounting 10 · views-and-reports 100 · GL 10 ·
payables 63 · receivables 124) + 5 digests + INDEX + manifest — committed at
`docs/erp-accounting/storis-docs/` and exempted from prettier so the verbatim
captures stay byte-faithful. Its HANDOFF is direction-agnostic enough to be useful
both ways; its §2 decision list and §6 risk register mostly concern loading INTO
STORIS and are moot for us, but the AR/in-house-financing articles (04-receivables)
are the reference if financing parity is ever scoped. Still missing from the
inventory pack: the five `sections/` files + `99-source-index.md`.

**Email deliverability:** the delivered invite landed in Gmail's SPAM folder —
expected for a domain with zero sending history. Owner should mark it "Not spam"
(trains Gmail for future invites); adding a DMARC record at GoDaddy
(`_dmarc.a-prompt.ai` TXT `v=DMARC1; p=none;`) would further help reputation — Ops,
optional.

## Improvement slice 1 — invoice lookup + daily-ops search (2026-08-27)

The owner green-lit ERP improvement work; slice 1 closes the top three findings
from the daily-ops audit (the "no way to find one sale among 73,899" hole):

- **Invoice lookup:** `GET /v1/sales` gains `q` — case-insensitive substring on
  the document number (a scanned receipt barcode types the full number and hits
  exactly, closing the print-only half of the G-era barcode feature) OR customer
  tsvector match — composing with the existing timestamp cursor. Rows now carry
  `customerName` (left-joined). Sales page rebuilt: autofocused scanner-friendly
  search box, Customer column (named / — / Walk-in), Load more.
- **Inventory search:** `levels` gains `q` over the variant+product tsvectors
  (name/SKU/barcode); Inventory page gains the search form.
- **Customers pagination:** the page finally uses the `nextCursor` the API always
  returned — Load more past the first 50 of 63k customers.

Tests: sales.int.spec +5 (full-number/scan path, fragment + customerName,
customer-name search, empty non-match), inventory.int.spec +1. Gates by exit
code: typecheck 0 · lint 0 · sales+inventory suites pass · prettier 0.

## Checkpoint 12 merged + deployed (2026-08-27)

PR #37 (bulk price entry · brands/collections · storage bins · invoice lookup +
inventory search + customers pagination · full spec-pack corpus + PARITY-NOTES)
squash-merged to main as `5422d99`, **CI 4/4 green first try**. Deploy branch
rolled (`66d3a95`), Render deploy `dep-da7t5llg1s2s73fassf0` **live 06:03Z** —
boot log: `Schema migrations: 51/51 applied, head=0050_storage_bins; this run
applied 0049_brands_collections, 0050_storage_bins.` + clean Nest start. Vercel
**production READY** on main `5422d99` (canonical host). Sprint branch restarted
from main.

**Live for staff now on `lamattress-erp.vercel.app`:** /products/pricing bulk
price entry (the 6,909-SKU pricing job can start), scan-to-find invoice lookup
on /sales, inventory search, brands/collections, warehouse bins on Inventory +
pick lists. Ops unchanged: repoint the Render repo URL (deploys still manual),
rotate the shared owner password, accept the manager invite (expires
2026-08-29 17:53Z), optional DMARC record.

## B14 shipped + FAQ-audit decisions recorded (2026-08-27)

Owner ruled on the three audit decisions: **B3 district pricing — skip entirely**
(D12 + G6 are the pricing model, final); **I2 restocking fee — none, P8 stands**;
**B14 — build the delivery-date reservation basis.** B14 shipped as a slice, and it
fixes the real hole behind the FAQ row: stock only ever reserved at order confirm,
so a "Pending" line stayed pending forever even when stock arrived.

- `ops_settings_json.reserveBasis` (`delivery_date` owner-default | `order_date`),
  validated in settings PATCH, editable in Settings → Store operations.
- `OrdersService.allocatePending`: fills under-reserved stock lines of open,
  unlocked orders from FREE stock only (never steals an existing reservation —
  flagged convention), priority = earliest `coalesce(line.delivery_date,
order.requested_date)` nulls-last under delivery_date, `created_at` under
  order_date; level rows locked FOR UPDATE; 500-line cap per run.
- `POST /v1/orders/allocate-pending` (`inventory.adjust`, dryRun supported,
  audited per order as `order.allocate_pending`).
- **Auto-run after PO receiving** (both fast and staged paths) for the variants
  just accepted — special-order allocations still take their linked units first.
  Transfer-receive/as-is-restock triggers + a nightly ride are follow-ups.
- Tests: orders.int.spec 56→61 (pending confirm, dry-run ranking, delivery-date
  fill, order_date flip via settings, PO-receive auto-backfill); business 24/24 +
  purchasing 27/27 re-run green. Gates by exit code: typecheck 0 · lint 0 ·
  prettier 0. Coverage matrix updated (B3/I2 intentionally-not-implemented, B14
  DONE).

## Checkpoint 13 — B14 merged + deployed; physical inventory shipped (2026-08-27)

PR #38 (B14) squash-merged on green CI (4/4), deploy branch rolled
(644e546), manual Render deploy triggered (dep-da7tpm9srm7s73dhr3h0) — no new
migration in B14, boot log verified below. Sprint branch restarted from main.

**Physical inventory (FAQ pack C1/B16, backlog #1) — built as a full slice.**
Soft-freeze counting: the store keeps selling during the count; posting nets the
post-freeze ledger delta out of every variance so a mid-count sale is neither
shrink nor double-deducted.

- Schema `0051_physical_inventory`: `physical_counts` (open→counting→
  posted/cancelled, one live count per location) + `physical_count_lines`
  (frozen snapshot, bin, counted qty, reason code, posted variance); RLS in
  both registries.
- API `/v1/inventory/counts`: list · create+freeze (snapshots non-empty levels
  with their bins; 409 on a concurrent count) · detail (variance = counted −
  (frozen + post-freeze delta), bin-ordered) · batch count entry ≤500 (found
  stock gets a zero-frozen line) · post (uncounted lines block unless
  `skipUncounted`; A9 coded-reason enforcement via new `physical_variance`
  class; writes `physical_count` movements + level upserts; a shortage that
  undercuts reservations records a **critical `physical_commitment` exception
  and never touches the reservation**; warning summary exception per posting)
  · cancel. Audits create/post/cancel.
- Web: `/inventory/counts` list + start-count, `/inventory/counts/[id]` entry
  grid with live variance, reason select, skip-uncounted post, cancel; "Count
  stock" from Inventory; blind bin-ordered count sheet at `/print/counts/[id]`
  with found-stock lines and signature blocks.
- Tests: inventory.int.spec 15→21 (permissions, freeze/409/empty-location,
  mid-count sale netting, A9 reason enforcement, found stock + skip, commitment
  exception with reservations intact, cancel). Gates by exit code: typecheck 0 ·
  lint 0 · test 0 · build 0 · prettier 0.

Ops unchanged: repoint the Render repo URL, rotate the shared owner password,
accept the manager invite (expires 2026-08-29 17:53Z), optional DMARC record.
Next backlog item: PO lifecycle corrections (no PO edit after order, no
un-receive) per the coverage-matrix ranking.

## PO lifecycle corrections shipped (2026-08-27)

Backlog #2 from the FAQ coverage audit: a draft PO was a dead end (no place
endpoint — could only be canceled), nothing on a PO could be edited after
creation, and a mis-keyed receipt was permanent.

- `POST /v1/purchase-orders/:id/place` — draft → ordered (403 otherwise),
  audited `purchase_order.place`.
- `PATCH /v1/purchase-orders/:id` (`purchase_orders.create`) — edit expected
  date, notes, line qty/cost; remove untouched, unlinked lines; add lines.
  Guards: immutable once received/canceled; qty never below received or below
  sales-order-committed units; removal blocked for received/linked lines; at
  least one line must remain; subtotal recomputed. Audited with before/after.
- `POST /v1/purchase-orders/:id/unreceive` (`purchase_orders.receive`) —
  backs N accepted units per line out of stock: `unreceive_po` ledger
  movement (never a silent edit), level decrement, received/inspected/
  accepted rolled back together, PO reopens (received → partially_received →
  ordered as counters allow, closedAt cleared). Refuses to cut into units
  committed to sales orders or reserved stock (free-stock-only, same
  convention as physical counts). Info exception `po_unreceive` + audit.
- Web (PO detail): Place order button on drafts; Edit order card (qty/cost
  inline, remove with guard disables, add item via POS lookup, expected date,
  notes); Correct-a-receipt card with per-line undo and notes.
- Tests: purchasing.int.spec 27→34 (draft dead-end fixed, place-once, edit +
  subtotal recompute, cashier 403, shrink-below-received / remove-received
  guards, immutability after receive, un-receive stock + ledger + reopen,
  over-accepted and reserved-stock guards). Gates by exit code: typecheck 0 ·
  lint 0 · test 0 · build 0 · prettier 0. No migration.

Next backlog item: return windows + no-original-invoice controls.

## Return windows + no-original returns shipped (2026-08-27)

Backlog #3 (FAQ I4 P0-MISSING, I1/I8 P0-PARTIAL).

- **Return window (I4, RTN-040):** `ops.returnWindowDays` (blank = no limit),
  Settings → Store operations. A return whose order is older (completedAt,
  else createdAt) hits the G11 security-override primitive on the new
  `returns.override_window` permission: Owner/Manager pass untouched, anyone
  else retries the same request under a manager's credentials and the
  override lands in the register. Web refund card catches OVERRIDE_REQUIRED
  and opens the standard override dialog.
- **No-original return (I1/I8, RTN-010/011, SEC-RTN-NOORIG):**
  `POST /v1/order-returns/no-original`, gated at point of action on the new
  `returns.no_original` permission (Owner/Manager; boot-time role sync
  backfills existing tenants). Controls, since it bypasses the original
  document: store-credit refund ONLY, goods staged in As-Is review (G10 —
  never silently sellable), the customer's claimed order number recorded
  verbatim, warning exception `no_original_return` per event + full audit.
  Numbered RMA-NOORIG-n, written completed in one step.
- Migration `0052_no_original_returns`: order_returns.order_id nullable +
  customer_id + referenced_order_number; order_return_lines.order_line_id
  nullable + variant_id + description. Null-guards added to the RMA receive
  path (no-original docs never sit authorized).
- Web: new **Returns** page (nav → Sell) — return-document register + the
  no-original entry form (customer pick-or-create, POS lookup line entry,
  live credit total, override dialog). Points staff at Sales invoice lookup
  first: all 71,246 imported STORIS invoices are refundable normally.
- Tests: orders.int.spec 61→65 (settings validation, in-window cashier pass,
  out-of-window OVERRIDE_REQUIRED → manager-credential retry → register row,
  owner silent pass, no-original gate + credit/as-is/exception/stock-
  untouched + register listing + validation); business 24/24 re-run. Gates
  by exit code: typecheck 0 · lint 0 · test 0 · build 0 · prettier 0.

Next backlog item: automatic replenishment transfers (FAQ J4/J5).

## Auto replenishment transfers shipped (2026-08-27)

Backlog #4 (FAQ J4/J5 — XFR-051/052/053, both P0-MISSING).

- **Trigger (XFR-051):** confirming a sales order (or re-running Reserve)
  whose stock lines are short at the order's own location now writes a
  **draft** transfer (`transferType='auto'`) from the sister location with
  the most free stock, linked to the order and capped at what's actually
  free. Generation is automatic, release stays manual — a person reviews
  and ships it, exactly the STORIS behavior. Dedupes against open auto
  transfers for the same order, so re-confirming never doubles up.
- **Gate (XFR-052):** `ops.autoScheduleDays` — blank = feature off, 0 is
  valid (= next day). Settings → Store operations.
- **Schedule (XFR-053):** `transfer_date = autoScheduleDays + today + 1`,
  rolled to the destination's next allowed weekday from the new
  per-location **replenishment days** (Locations page, clickable weekday
  badges; null = every day). An explicitly empty day set skips generation
  with a warning exception (`auto_transfer_skipped`) instead of looping.
  The STORIS worked example (created 4/6, days=2, Tuesdays-only → Tue
  4/14) is a verbatim unit test in `auto-schedule.spec.ts`.
- Migration `0053_auto_transfers`: `locations.replenishment_days_json`,
  `stock_transfers.scheduled_for` + `order_id` FK. Transfers list/detail
  carry type/scheduled/order; the Transfers page shows the auto badge,
  schedule date, and a link to the generating order (XFR-054 lean queue).
- Tests: auto-schedule.spec 4 unit tests (worked example verbatim, zero
  vs blank, no-roll case, empty-set null); transfers.int.spec 15→19
  (generation + schedule date + dedupe, blank-disables, empty-days skip +
  exception); orders 65/65 + business 24/24 re-run. Gates by exit code:
  typecheck 0 · lint 0 · test 0 · build 0 · prettier 0.

Next backlog item: costing program (PARITY-NOTES C2) — last of the ranked
five; needs an owner decision on costing method before build.

## Checkpoint 14 — ranked backlog complete through #4 (2026-08-27)

PR #42 (auto transfers) squash-merged on green CI, deploy branch rolled
(f628c04), Render deploy dep-da7vgsdg1s2s73fi5620 live — boot log verified
`54/54 applied, head=0053_auto_transfers; this run applied 0053`. Earlier
today: PR #38 (B14), PR #39 (physical inventory, 0051), PR #40 (PO
corrections), PR #41 (returns, 0052) all merged + deployed + boot-verified
the same way. Sprint branch restarted from main after each merge.

The FAQ-audit ranked backlog now stands: 1 physical inventory ✓ · 2 PO
lifecycle corrections ✓ · 3 return windows + no-original returns ✓ ·
4 auto transfers ✓ · 5 costing program — **blocked on an owner decision**
(FIFO cost layers for STORIS parity vs. weighted-average; asked 2026-08-27).

Ops unchanged: accept the manager invite (expires 2026-08-29 17:53Z),
repoint the Render dashboard repo URL, rotate the shared owner password,
optional DMARC record, missing inventory-pack sections/ files, docs-system
handoff still on hold.

## Sysadmin spec pack committed (2026-08-27)

`docs/erp-sysadmin/` — STORIS System Administration handoff, all 599 articles
(131 settings screens, 355 permission flags, the 48-step EOD batch), 44 files
verbatim (added to .prettierignore). The three loose uploads were byte-identical
to the zip. Corrections banner added to docs/erp-inventory-faq/README.md: this
pack **corrects the FAQ pack in 13 places** (C1–C13), six touching P0 rows.

Reconciliation against what's already built/decided:

- **C2/D6 price resolution order** — moot for us unless the owner wants STORIS
  pricing parity: owner locked D12+G6 as THE pricing model and ruled B3 (skip
  district pricing) on 2026-08-27. Our simpler model is a deliberate divergence,
  not an oversight. Confirming with owner.
- **C10/D13 reservation** — pack recommends Order Date + Immediate; owner
  explicitly chose delivery_date basis (B14, shipped). Owner ruling stands.
- **C13 permissions** — pack's live-evaluation/most-specific-wins model: our
  catalog + per-user overrides + security-override primitive already work that
  way (SEC-\* row was DONE ✓ in the FAQ audit); the 355-flag granularity is
  reference, not a rebuild mandate.
- **D14 auth** — better-auth already in place (their recommendation satisfied).
- **D3 multi-company** — the platform is multi-tenant by design; LA Mattress is
  one business. No COMPANY scope needed.
- **D5** — service module, delivery routing (G12 zipRoutes), shifts already
  exist in-app.
- **D8/D9 privacy/consent** — flagged to owner as needs-counsel (TCPA, erasure
  vs warranty retention). Ops item, not buildable by us.
- **Open with owner:** D1 (in-house credit vs third-party only — biggest
  descope), D10 costing method (already pending), D2 multi-currency,
  D4 region/district adoption.

Per the pack's own protocol, no code is being written against it until the
Tier 1/2 decisions are answered.

## FIFO costing program shipped (2026-08-27)

Backlog #5, unblocked by four owner decisions today: **third-party financing
only** (D1 — the pack's biggest descope), **FIFO costing** (D10), **keep our
pricing model** (C2/D6 moot — recorded as deliberate divergence), **no
multi-currency, no region/district scopes** (D2/D4).

- Migration `0054_fifo_costing`: `cost_layers` (variant+location, source,
  unit cost, received/remaining with check constraints) + `cost_consumptions`
  (one row per outflow×layer — the COGS audit trail); RLS in both registries;
  `stock_transfer_lines.unit_cost_cents` carries cost across transfers.
- `CostingService` (new costing module): `addLayer` (C9 — a $0 layer is never
  silent, every one records a `zero_cost_layer` exception), `consume` (FIFO
  oldest-first, `preferReferenceId` so a PO un-receive backs out its own
  receipt), `valuation`. **Pre-costing stock needs no backfill**: when
  consumption outruns the layers, the shortfall synthesizes a fully-consumed
  `opening` layer at the variant's catalog cost — correct going forward.
- Hooks at every stock boundary: PO accept (layer at PO line cost) ·
  PO un-receive (same-PO layers first) · order fulfillment (COGS) · POS
  walk-out sale · manual receive/adjust (catalog cost / FIFO by sign) ·
  physical-count overage/shrink · transfer ship (consumes origin, stamps
  weighted cost on the line) / receive (layers destination at that cost) ·
  as-is restock. Catalog `cost_cents` remains the replacement-cost fallback.
- Inventory valuation report is now FIFO: layered stock at actual layer
  costs, pre-costing remainder at catalog cost.
- Tests: purchasing 34→36 (receipt layer, un-receive backs out own layer +
  consumption row), orders 65→68 (opening-layer synthesis at catalog cost,
  FIFO before synthesis, C9 zero-cost exception); transfers 19, inventory 21,
  sales 21, reports 14 re-run green. Gates by exit code: typecheck 0 ·
  lint 0 · test 0 · build 0 · prettier 0.

**The five-item ranked backlog from the FAQ audit is now complete.**

## Checkpoint 15 — FIFO costing live; ranked backlog COMPLETE (2026-08-27)

PR #43 squash-merged on green CI, deploy branch rolled (c4d2f8f), Render
deploy dep-da806bhsrm7s73dnroug live — boot log verified `55/55 applied,
head=0054_fifo_costing; this run applied 0054`. Sprint branch restarted
from main.

All five FAQ-audit backlog items are now shipped, deployed, and
boot-verified in one day: physical inventory (0051) · PO lifecycle
corrections · return windows + no-original returns (0052) · auto
replenishment transfers (0053) · FIFO costing (0054). Owner decisions
D1/D2/D4/D10 + pricing-parity divergence recorded above.

Open threads: sysadmin-pack follow-ups beyond the descopes (settings
registry, audit-stream and batch-runner substrate designs in
docs/erp-sysadmin/03–05 — unscheduled, awaiting owner priorities); the two
needs-counsel items (TCPA consent, erasure vs warranty retention); standing
ops items (manager invite expires 2026-08-29 17:53Z, Render repo URL,
owner password rotation, DMARC). To make costing accurate on day one:
keep variant catalog costs current — they price the opening layers.

## EOD batch runner shipped (2026-08-27)

EOD-001 (P0 cross-cutting rollup) built to the sysadmin pack's JOB-002 spec —
deliberately the opposite of STORIS's Generate Daily Reports:

- **Declared step registry** the operator can see (`GET /v1/jobs`), each step
  with explicit order, dependencies, and a destructive flag (none are).
- **`job_runs` log (migration 0055):** one row per (business, job, business
  date) — status, duration, records affected, detail, error. The unique key
  IS the idempotency: re-running a date never repeats a succeeded step.
- **Explicit business dates:** the hourly scheduler fires after 2am
  business-local (JOB-003: never at the date boundary), and catch-up runs
  ONE PASS PER MISSED DATE (7-day window) — days are never collapsed.
- **First registered jobs:** `po_overdue_sweep` (open POs past expected date
  → warning exceptions, deduped) · `auto_replenishment` (REPL-040: drafts one
  PO per preferred vendor for variants at/below reorder point, netting out
  quantities already on open POs; gated on new `ops.autoReplenishmentEnabled`,
  off by default; drafts only — a buyer reviews and places, same convention
  as auto transfers) · `transfer_aging` (in-transit > 3 days → exceptions).
- Shared `computeReorderSuggestions` extracted from the PO controller so the
  interactive endpoint and the nightly job can't drift.
- Web: **Nightly jobs** page (nav → Insights) — the registry, the morning run
  report, and a safe "Run now" for any business date. Settings gains the
  auto-replenishment checkbox.
- Tests: purchasing.int.spec 36→39 (registry shape, run drafts the netted
  replenishment PO + flags the overdue PO + writes the run report, per-date
  idempotency with no duplicate drafts, gate-off no-op). Gates by exit code:
  typecheck 0 · lint 0 · test 0 · build 0 · prettier 0.

## Floor samples + serial transfer pieces shipped (2026-08-27)

FAQ J2 (P1-PARTIAL) and J3 (P1-MISSING), the last flagged transfer gaps.

- **J2 (XFR-030/STK-020):** `inventory_levels.floor_sample` (migration 0056)
  — units physically on hand but never sellable as new. Receiving a
  `floor_sample`-type transfer nails the received units down automatically;
  a manual hold (`POST /v1/inventory/levels/floor-sample`, clamped to
  on-hand, audited) covers the walk-up case. **Available stock is now
  `on_hand − reserved − floor_sample` in all eight places that compute
  it**: reservation planning (stockLevels nets it once for planReservations
  - allocatePending), POS lookup, levels endpoint, stock report, auto
    transfers, reorder suggestions/auto-replenishment, and PO un-receive's
    free-stock guard. Inventory page shows a Floor column with click-to-set.
- **J3 (XFR-040):** `stock_transfer_lines.serial_ids_json` — named pieces
  ride the transfer. Create validates each piece (real, in stock at the
  origin, right variant, no repeats, ≤ quantity); ship flags them
  `in_transit`; receive re-homes them at the destination in listed order up
  to the received quantity — as `floor_sample` when the transfer is one.
  Serial status vocabulary gains `in_transit` + `floor_sample`.
- Tests: transfers.int.spec 19→24 (ride-along lifecycle, wrong-location and
  duplicate-pick refusals, floor-sample nailing with availability math
  asserted through the levels endpoint, manual-hold clamp + reversal);
  inventory 21, orders 68, sales 21, purchasing 39 re-run green. Gates by
  exit code: typecheck 0 · lint 0 · test 0 · build 0 · prettier 0.
  Follow-up noted: serial picker UI on the transfer form (API-complete).

## Checkpoint 16 — J2/J3 live; ALL TRACKED TASKS COMPLETE (2026-08-27)

PR #45 squash-merged on green CI (one e2e fix along the way: the new Floor
column shifted the inventory table's column indexes — orders.spec.ts
updated), deploy branch rolled (cdf3023), Render deploy
dep-da815b1srm7s73dqassg live — boot log verified `57/57 applied,
head=0056_floor_samples_serials; this run applied 0056`. The serial-piece
picker UI shipped in the same PR, so J3 is API- and UI-complete.

Today's full run, every one merged + deployed + boot-verified: B14 (#38) ·
physical inventory (#39, 0051) · PO corrections (#40) · returns (#41, 0052)
· auto transfers (#42, 0053) · FIFO costing (#43, 0054) · nightly batch
runner (#44, 0055) · floor samples + serial transfers (#45, 0056).

Remaining candidate work is genuinely optional and needs owner priorities:
H2 wrong-vendor RTV guidance (P2) · I7 direct-ship vendor PO with customer
ship-to (P2) · as_is-type transfer receiving into As-Is review · sysadmin
substrate designs (settings registry, RPT-AUDIT stream, report builder) ·
needs-counsel privacy items (TCPA consent, erasure policy). Ops items
unchanged — the manager invite expires 2026-08-29 17:53Z.

## As-Is transfer intake + H2 RTV unwind (2026-08-27)

- **as_is consolidation transfers now stage in review, not stock** (§10
  invariant: damage never silently becomes sellable). Receiving an
  `as_is`-type transfer writes no `transfer_in` movement, no level bump,
  and no cost layer; instead each unit becomes an As-Is review piece
  (`source: 'transfer'`, `referenceType: 'stock_transfer'`, piece number
  `AS-XXXXXXXX`) at the destination, waiting in the pending_review queue.
  Named serial pieces land as `returned`. Stock and valuation re-enter
  only through a review disposition (restock / vendor return / scrap) —
  the restock path already carries its own movement + FIFO layer. No
  migration: `source`/`referenceType` are doc-typed text columns.
- **H2 (RTV-020/021): wrong-vendor RTV unwind** — `POST
/v1/as-is/:id/reopen` (inventory.adjust) flips a `vendor_return` piece
  back to `pending_review`, voids the R/A + credit chase, clears the
  reviewer stamp, audits (`as_is.reopen`), and records an `rtv_reopened`
  info exception. Guarded: only a vendor_return piece reopens, and a
  credit already `received` blocks the unwind (reverse it with the vendor
  first — money is involved).
- Tests: transfers.int.spec 24→29 (as_is receive stages pieces + leaves
  sellable stock and the movement ledger untouched, staged piece restocks
  through normal review, RTV unwind round-trip + both refusal guards).
  Gates by exit code: typecheck 0 · lint 0 · test 0 · build 0 · prettier 0.

## I7 / PO-060 — direct-ship vendor POs (2026-08-27)

- **Migration 0057_direct_ship**: `purchase_orders.direct_ship` boolean +
  `ship_to_json` (customer ship-to snapshot). `order_lines.line_type`
  gains `direct_ship` (doc-typed text — no constraint change).
- **Order side**: direct_ship lines never reserve (order-math skips them
  like special_order); the manual fulfill endpoint and delivery
  scheduling exclude them (they ride the vendor's truck). New
  `PATCH /v1/orders/:id/lines/:lineId {lineType}` flips a line between
  stock / special_order / direct_ship on a live order — releasing or
  re-reserving stock — refused once fulfilled or carried by a PO.
- **Queue → PO**: the to-order queue includes direct_ship lines (flagged);
  generate-PO refuses to mix them with stock-bound lines or span two
  orders, and stamps the PO `directShip` with a ship-to snapshot (name,
  phone, address from the customer file + our SO number). The printed
  vendor document's Ship-to block becomes the customer's address.
- **Receipt = fulfillment**: receiving a direct-ship PO writes NO
  movement/level; a cost layer at PO cost is consumed on the spot
  (`direct_ship` consumption → COGS posted, valuation net zero); the
  allocation flips received, the order line's qty_fulfilled rises, order
  status recomputes via deriveFulfillmentStatus, and the customer gets
  "your order is on its way". Dock rejects and un-receive are refused on
  direct-ship POs (problems are customer returns).
- Tests: special-orders.int.spec 7→13 (flip releases reservation; queue +
  ship-to snapshot; mixing refusal; zero-stock receipt with COGS
  assertion on layers/consumptions; unreceive + reject + relock guards;
  fulfilled-line guard); orders 68, purchasing 39, deliveries 17 re-run
  green. Gates by exit code: typecheck 0 · lint 0 · test 0 · build 0 ·
  prettier 0.

## Checkpoint 17 — direct ship live; UPLOADED-PACK BACKLOG COMPLETE (2026-08-27)

PR #46 (as-is transfer intake + H2 RTV unwind) and PR #47 (PO-060/I7
direct-ship vendor POs, migration 0057) both squash-merged on green CI,
deploy branch rolled (02d681f), Render deploys dep-da81tapsrm7s73ds6k20 and
dep-da827j8ae00c73agve80 live — final boot log verified `58/58 applied,
head=0057_direct_ship; this run applied 0057_direct_ship`.

**Every buildable item from the uploaded packs (55-row inventory FAQ +
599-article sysadmin pack) is now built, merged, deployed, and verified.**
Tracked tasks #1–#16 all complete.

Not buildable / owner-gated leftovers:

- Optional substrate extras the sysadmin pack marks nice-to-have (settings
  registry admin UI, report builder) — build on owner request.
- Needs-counsel privacy items (TCPA consent wording, erasure/retention
  policy) — owner + lawyer, not code.

## Enter an Exchange — container over two documents (2026-08-27)

Owner uploaded the STORIS "Enter an Exchange" pack (committed verbatim at
`docs/erp-exchange/`, 8 files). Built per its build plan, as a composition
over the existing returns + order machinery (the pack's own instruction):

- **Model (migration 0058_exchanges)**: `exchanges` container — number
  EX-YYYY-NNNNNN, returnId + saleOrderId (both unique), originalOrderId /
  referencedOrderNumber, status on_hold|open|completed|split|cancelled,
  evenExchange, restocking fee (+sticky overridden flag), per-leg return
  salesperson, approval stamps. Split Exchange = container dissolve; the
  legs are already first-class documents. RLS + tenant registration.
- **Settlement rides the store-credit ledger**: receiving the exchange's
  return issues the credit (minus restocking fee) and immediately redeems
  it against the replacement order's balance — every cent reconciles
  through existing ledgers; excess stays as visible store credit. The
  plain-refund path in OrderReturnsService diverts only while a live
  container exists; split/cancel restores it. Commission clawback and
  As-Is staging unchanged (shared path).
- **API**: POST /v1/exchanges (bind; validates same-customer, financed-
  original ⇒ even-exchange-only per D1, like-for-like check, fee compute/
  override, E1 hold via ops.exchangeHoldAtEntry) · :id/approve ·
  :id/split · :id/cancel · list/detail with settlement math. New
  permissions exchanges.create / exchanges.approve /
  exchanges.restocking_fee.override (Owner+Manager via catalog).
- **Ops settings**: restockingFeePercent, exchangeHoldAtEntry (+ Settings
  page inputs). Orders list gains ?number= exact recall.
- **Web**: /exchanges list, /exchanges/new writer (find original → pick
  return pieces → replacement w/ even-exchange copy → settle-now toggle),
  /exchanges/[id] detail (settlement block, approve/split/cancel/receive),
  nav entry, order-detail "Write exchange" now routes here.
- **Deliberate divergences from STORIS** (recorded per pack conventions):
  exchange refund excess settles as store credit (not cash-back); both
  legs must bill the same customer; no-original exchanges carry no
  restocking fee (already loss-prevention flagged + store-credit-only);
  protection-plan transfer rules N/A (no plan object — plans are ordinary
  product lines here); revolving financing/C6 holds not built (owner D1:
  third-party only); vendor imports (2020 Spaces/Flexsteel/Pro Kitchen)
  skipped — furniture-configurator integrations.
- Tests: NEW exchanges.int.spec (8) — uneven happy path with ledger-net
  assertions, restocking fee + sticky override + audit, E1 hold blocks
  settlement until approve, financed-original even-only + like-for-like,
  split restores plain refund, cancel voids both, no-original banked
  credit at bind, same-customer guard. orders 68 · business 24 · sales 21
  re-run green. Gates by exit code: typecheck 0 · lint 0 · test 0 ·
  build 0 · prettier 0.

## Sysadmin substrate — RPT-AUDIT + settings registry (2026-08-27)

The "after" half of the owner's instruction (exchange pack, then sysadmin
pack). Built the buildable substrate items from docs/erp-sysadmin:

- **AUD-004 — denials are events**: PermissionGuard now writes every 403
  to the audit stream (`permission.denied`, route + missing permissions,
  explicit businessId through the root handle since guards run before the
  RLS request context). Denial patterns are the pack's loss-prevention
  signal.
- **AUD-006 + AUD-003 — queryable, exportable, and reads leave traces**:
  `GET /v1/audit-logs/export.csv` (same filters as the list, 10k cap,
  newest-first) and the export itself is audited (`audit.export`). Export
  button on the Audit page.
- **SET-007 + SET-002 — registry as data**: `GET /v1/business/settings/
registry` serves the declared registry (key, label, type, explicit
  `nullMeans` for every setting — no implicit tri-state — class tags,
  read-by). The Settings page renders a reference table from it.
- Deliberate scale-down (recorded): no multi-scope resolver (SET-001) —
  our settings model is deliberately flat per the owner-approved triage;
  SET-004 already holds (no kill-switch exists); settings writes were
  already audited (SET-006).
- Tests: audit.int.spec 4→7 (denial event, CSV export + its audit trace,
  registry completeness incl. TRISTATE tags); business 24, tenancy 8
  re-run green. Gates by exit code: typecheck 0 · lint 0 · test 0 ·
  build 0 · prettier 0.

## Checkpoint 18 — Enter an Exchange + sysadmin substrate LIVE (2026-08-27)

PR #48 squash-merged on green CI (one CI-infra fix along the way: the
workflow never provisioned the new jetnine_exchanges test database — env
var + createdb added; 576/589 tests had passed around it). Deploy branch
rolled (65319a5), Render deploy dep-da83425g1s2s73fs1qtg live — boot log
verified `59/59 applied, head=0058_exchanges; this run applied
0058_exchanges`.

The owner's exchange pack (docs/erp-exchange, 8 files) is fully built:
container model, ledger settlement, restocking fee, E1 hold,
financed-original even-exchange rule, split, cancel, no-original path,
writer/detail/list UI. The sysadmin pack's buildable substrate is done:
AUD-004 denial events, AUD-006 CSV export (AUD-003 audited), SET-007
registry endpoint + reference UI. Tasks #17 and #18 complete — the
uploaded-pack backlog is again at zero.

Remaining non-build items (unchanged): needs-counsel privacy items (TCPA
consent wording, erasure/retention policy) — owner + lawyer; a full
report-builder surface remains deliberately unbuilt (the pack's own
recommendation is the RPT-\* registry consolidation we already follow).

## Hardening — self code-review of PR #48, 10 findings fixed (2026-08-27)

Ran a high-effort code review over the exchange + audit-substrate merge;
all 10 findings fixed and regression-locked:

1. **Money (P0): exchange credit capped at collected.** The settlement
   branch bypassed the plain path's refund-exceeds-collected guard — a
   delivered-but-half-paid original minted full-face credit. Now
   `min(returnAmount, paidCents(original))`, with an
   `exchange.credit_capped` audit row when the cap bites. Exchange legs
   authorize as store_credit (writer + tests), so a later split falls
   back to credit, never cash out.
2. **Re-bind after mistake (migration 0059)**: the unique return/order
   indexes became partial (`status NOT IN ('split','cancelled')`) and the
   taken-check is status-aware — a cancelled or split container releases
   its legs for a corrected exchange.
3. **E1-hold UX**: the writer skips settle-now on an on_hold exchange and
   always lands on the exchange page; a receive hiccup no longer strands
   the cashier on the form.
4. **No duplicate documents**: the writer remembers the created
   replacement + RMA and reuses them when a failed bind is retried.
5. **CSV formula injection**: audit export prefixes leading =+-@/tab/CR
   with an apostrophe.
6. **AUD-004 attribution**: API-key denials record actorType 'api_key' +
   the key id; impersonator carried.
7. **Number race**: exchange insert retries with a fresh number on
   23505; random fallback zero-padded.
8. **Webhooks (CLAUDE.md convention)**: five new catalogued events —
   exchange.created/approved/settled/split/cancelled — fired from bind,
   approve, split, cancel, and both settlement paths.
9. **Status freshness**: lazy-completion runs on the list too, and
   hydrate no longer double-fetches (notes/salesperson folded into the
   base select).
10. **Credit preview accuracy**: the writer previews per-unit credit as
    (line total + tax)/qty — the server's exact formula — instead of the
    list price.

Tests: exchanges.int.spec 8→10 (credit-cap with audit assertion; cancel →
re-bind same order), audit.int.spec 7→8 (CSV injection guard). orders 68 ·
webhooks 13 re-run green. Gates by exit code: typecheck 0 · lint 0 ·
test 0 · build 0 · prettier 0.

## Checkpoint 19 — hardening live; queue empty (2026-08-27)

PR #49 squash-merged on green CI, deploy branch rolled (06033c6), Render
deploy dep-da86n8id0e5s739r1ieg live — boot log verified `60/60 applied,
head=0059_exchange_partial_unique`. Vercel production picked up main.
All 19 tracked tasks complete: both uploaded packs built, the sysadmin
substrate live, and the post-merge self-review's 10 findings (incl. the
exchange credit-cap money bug) fixed and regression-locked in production.

Nothing buildable remains queued. Owner-side only: needs-counsel privacy
items (TCPA consent wording, erasure/retention policy).

## Pagination sweep — owner report → 2 workflows → system-wide fix (2026-08-27)

Owner reported Products showing only one page. Ran a 10-agent audit
workflow over every list surface (81 findings: 15 high / 19 medium / 47
confirmed fine), then a 10-agent fix workflow, gated centrally:

- **Shared client primitives**: `useCursorList` hook (generation-guarded
  against stale responses) + `LoadMore` control; the house pattern from
  the customers page, now reusable everywhere.
- **Pages that dropped the cursor, fixed**: Products, Gift cards, Audit
  log, inventory-receive picker.
- **Eight capped-array endpoints converted to the PageResponse cursor
  contract** (+ their pages wired with Load more, + every test/consumer
  updated): /v1/as-is (was 200) · /v1/exchanges (200) · /v1/order-returns
  (200) · /v1/cash-shifts (50) · /v1/purchase-orders (50) ·
  /v1/stock-transfers (50) · /v1/service-orders (300) · /v1/exceptions
  (200) · /v1/inventory/counts (100).
- **Picker caps de-silenced**: POS Add-Product browse 30→100 with a
  refine hint; label/transfer/exchange/return lookups request limit=200
  with truncation cues; customer typeaheads 8→20 with "keep typing";
  draft chips 10→30; webhook delivery history 50→200.
- Confirmed fine (deliberate): reports fetch complete data; bounded sets
  (locations, roles, tax classes, categories, bins) stay unpaginated.
  Deferred with notes: /v1/inventory/levels full-location fetch,
  deliveries week view (500), commissions report caps (period-filtered),
  admin templates (100), marketing tags ordering.
- One straggler the agents missed (an /v1/exceptions read in orders spec)
  caught by the central gate run and fixed.
- Tests: exchanges 10 · orders 68 · transfers 29 · purchasing 39 ·
  sales 21 · controls 22 · closeout 4 · service-crm 8 · inventory 21 all
  green. Gates by exit code: typecheck 0 · lint 0 · test 0 · build 0 ·
  prettier 0.

## Checkpoint 20 — pagination sweep LIVE; all 20 tasks complete (2026-08-27)

PR #50 squash-merged on green CI (main 84eb3af), deploy branch rolled
(3361981), Render deploy dep-da87ke2jnfac73d27fng live — boot log
verified `Schema migrations: 60/60 applied,
head=0059_exchange_partial_unique; this run applied none` (correct: no
migration in this PR). Vercel production READY on main 84eb3af
(dpl_8bD1fdMSqnWHafhydxAwRuTEzyW9), so the web side (Products,
Inventory, and every converted list page) is serving the Load-more UI.

All 20 tracked tasks complete. Queue holds nothing buildable. Remaining
items are owner-side only:

- Policy values awaiting owner: restocking fee %, E1 hold-at-entry,
  return window, delivery auto-schedule days, auto-replenishment.
- Needs-counsel privacy items: TCPA consent wording, retention/erasure.
- Deferred pagination mediums (noted in the sweep section above):
  /v1/inventory/levels full-location fetch, deliveries week view,
  commissions report caps, admin templates, marketing tag ordering.
