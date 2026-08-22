# Sprint Status — STORIS Cutover

> **Living tracker for `PLAN-STORIS-CUTOVER.md`.** Protocol: pick the first unchecked
> **Build** item, ship it as a vertical slice, check it off with a dated note, commit the
> tracker with the work. **Ops** items are the human's — surface them, don't do them.
> Slip policy and never-cut list live in the plan §8.

**Sprint state:** not started · **Current day:** 1 · **Rehearsal imports done:** 0/2 · **Recon gates passed:** 0/5

---

## Day 1 — Order spine + extraction kickoff

- [ ] **Build:** Schema batch 1: `orders`, `order_lines`, `deliveries`, `delivery_lines`,
      payments generalization (nullable `sale_id`, add `order_id`, `kind`, financing fields,
      CHECK exactly-one), `legacy_refs`, staging tables — with RLS + generated migration
- [ ] **Build:** `orders` NestJS module: CRUD, lines, totals (reuse `sales/totals.ts` pattern),
      deposit/balance payments, stock reserve/release via `inventory_levels.reserved` +
      movements (`order_reserve`/`order_release`), cancel; unit tests for totals + reserve math
- [ ] **Build:** Permission catalog additions (plan §5) seeded into system roles
- [ ] **Ops:** Kick off every STORIS export (plan §7 entity list) — subscription still active
- [ ] **Ops:** Order Stripe Terminal readers / confirm interim standalone terminal

_Acceptance: migration applies cleanly from empty DB; API can create an order, take a
deposit, and reserved stock shows in inventory; drift check green._

## Day 2 — Order writer

- [ ] **Build:** `(business)/orders` — pipeline board (quote→open→partially_fulfilled→fulfilled→completed), order writer screen (share cart components with POS), order detail with payments + timeline
- [ ] **Build:** POS: "Save as order / take deposit" flow
- [ ] **Build:** Committed-stock visibility in inventory views
- [ ] **Ops:** Chase exports; write the STORIS daily-routine script (becomes the QA script)

_Acceptance: write an order with deposit end-to-end in the browser; committed qty visible._

## Day 3 — Delivery & fulfillment

- [ ] **Build:** `deliveries` module + calendar UI (week/day), drag-to-schedule, driver day-sheet (print)
- [ ] **Build:** Fulfillment flow: decrement stock, serial pick (stub until Day 4), collect balance, order receipt print; completion requires balance = 0 or `orders.complete_with_balance`
- [ ] **Build:** Reports union `sales` + `orders` (revenue, drawer picks up order payments)
- [ ] **Ops:** First export files land — joint sanity read; freeze SKU/category cleanup decisions

_Acceptance: schedule → deliver → collect balance → order completed; day's drawer includes deposits._

## Day 4 — Special orders & serials

- [ ] **Build:** `po_line_allocations`; to-order queue; generate/link POs by vendor; receiving auto-allocates, marks lines arrived, emails customer (Resend)
- [ ] **Build:** `serial_units` + `products.serial_tracked`; serial picker in fulfillment
- [ ] **Ops:** Verify sample POs/special orders against STORIS screens

_Acceptance: sell not-in-stock item → PO generated → receive → arrival email → deliverable._

## Day 5 — Money features

- [ ] **Build:** Financing tender (`method='financing'`, provider + ref) in POS + order payments
- [ ] **Build:** `payment_plans` + installments; pay-installment flow; nightly overdue job + reminder emails; overdue report
- [ ] **Build:** Commissions: plans, membership assignment, accrual at completion, refund reversal, report with approve/mark-paid
- [ ] **Ops:** Provide real commission rules + financing provider list; validate 5 historical examples

_Acceptance: layaway order pays off across installments; commission entries match hand math._

## Day 6 — Service & CRM

- [ ] **Build:** Service orders: intake form, status board, ticket detail + charges + notes, complete; ticket print
- [ ] **Build:** CRM: `customer_notes`, tags, customer timeline page (merged feed)
- [ ] **Build:** Receivables/AR report + customer statement print
- [ ] **Ops:** Walk the service workflow; list any STORIS report not yet covered

## Day 7 — Migration rehearsal #1

- [ ] **Build:** Import pipeline: upload → staging → mapping config → validation report → commit via `legacy_refs` upserts → recon report (gates 1–5, plan §7)
- [ ] **Build:** Full rehearsal import into throwaway `migration-rehearsal` tenant
- [ ] **Ops:** Review recon report line-by-line vs STORIS reports; log every mismatch

## Day 8 — Rehearsal #2 + platform layer

- [ ] **Build:** Fix import mismatches → rehearsal #2
- [ ] **Build:** `business_templates` (snapshot/apply + super-admin UI); `agencies` tier (D9, additive) + agency console basics; white-label branding + subdomain middleware
- [ ] **Build:** Deploy hardening (D10): always-on API instance, DB backups/PITR, Sentry alerts verified
- [ ] **Ops:** Recon #2 sign-off; choose hosting plan; DNS if subdomains now

## Day 9 — QA + parallel run

- [ ] **Build:** Playwright e2e: POS sale · order+deposit+delivery+balance · special-order→PO→receive · layaway installment · service ticket · refund
- [ ] **Build:** Bug burn-down; marketing basics (campaign send, one automation) only if green
- [ ] **Ops:** Parallel run — replay today's real STORIS transactions; compare Z-report, drawer, commissions

## Day 10 — Cutover

- [ ] **Build:** Final delta import into production tenant; recon gates 1–5 to the cent; fix-forward only
- [ ] **Ops:** Staff dry-run on real hardware; full STORIS archive to cold storage (R2); go/no-go
- [ ] **Ops:** Cancel STORIS 🎉 (only after the gate passes — never before)

---

## Log

_(newest first — sessions append: date · day · what shipped · open flags)_

- 2026-08-22 · pre-sprint · Plan + handoff docs written (`PLAN-STORIS-CUTOVER.md`, `CLAUDE.md`, this tracker). Sprint not started.
