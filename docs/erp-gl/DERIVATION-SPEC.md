# GL journal-event derivation — spec (slice 2 of the in-house GL)

Authored 2026-08-28. Slice 1 (PR #72) shipped the substrate: chart with
`system_key`s, fiscal periods, balanced journal batches with typed
mandatory source refs. This spec is the contract for the derivation
job before any of it is coded, per house test-first protocol.

## Ground rules

- **One engine**: an EOD job `gl_derivation` (order 70, after every
  operational job) derives the business date's events into `derived`
  batches through `GlService` — the same balance + open-period gates as
  manual entries.
- **Idempotent / replayable**: one batch per (family, business date).
  The job skips a family whose batch already exists for the date;
  deleting nothing, ever. Re-running a corrected day = reverse with a
  manual batch, then re-derive is NOT offered — corrections are manual
  batches (append-only discipline).
- **No silent defaults (anti-F1)**: a family whose required
  `system_key`s are unmapped is SKIPPED with the reason recorded in the
  job outcome — nothing posts to a fallback account, and nothing else
  is blocked.
- **D8**: records with `imported_at` never derive.
- **Posting date = business date** (the EOD run's date), satisfying the
  run-01 trap that STORIS posts drawer by system date but ledgers by
  transaction date — Jetnine has one date and it is the event date.

## Families and their entries

| #   | Family                    | Debit                                                                                                       | Credit                                                                                           | Source rows (for the date)                                                              |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 1   | POS sales                 | tender split: cash → `cash_drawer`, card/other → `cash_bank`, gift card redemptions → `gift_card_liability` | `sales_revenue` (subtotal − discount) + `sales_tax_payable` (tax)                                | `sales` completed that day + their `payments` (succeeded)                               |
| 2   | Order money in            | tender split as above                                                                                       | `deposit_liability`                                                                              | `payments` (succeeded) attached to orders                                               |
| 3   | Order revenue recognition | `deposit_liability` (order total)                                                                           | `sales_revenue` (subtotal − discount) + `sales_tax_payable` + `delivery_revenue` + `fee_revenue` | orders reaching fully-completed that day                                                |
| 4   | COGS                      | `cogs`                                                                                                      | `inventory`                                                                                      | `cost_consumptions` referencing sales/orders/direct-ship that day (actual FIFO cents)   |
| 5   | Inventory receipts        | `inventory`                                                                                                 | `received_not_recorded`                                                                          | `cost_layers` `po_receive` created that day (layer cost × qty — freight share included) |
| 6   | Vendor bills              | `received_not_recorded`                                                                                     | `accounts_payable`                                                                               | vendor invoices approved that day                                                       |
| 7   | Cash over/short           | short: `cash_over_short` / over: reverse                                                                    | `cash_drawer`                                                                                    | `cash_shifts` closed that day with variance ≠ 0                                         |
| 8   | Inventory adjustments     | `inventory_adjustment` (or reverse)                                                                         | `inventory`                                                                                      | adjustment/write-off consumptions and layers that day                                   |

Refunds and exchanges net inside families 1–3 with signs flipped;
returns re-entering stock create layers that land in family 5's logic
via their own source type. Transfers do NOT post (location moves are
not P&L; FIFO cost rides the transfer).

## Open questions (owner / Accounting) — none block the build

1. Stripe card takings: post to `cash_bank` directly (lean, chosen) or
   a clearing account until payout? Ships lean; a `card_clearing`
   system key can be added later without schema change.
2. Partial order completions: revenue recognizes only at FULL
   completion (lean, documented). STORIS recognizes per completion —
   flag if Accounting wants per-delivery recognition.
3. Fiscal calendar still presumed calendar months (GAP Q4).
4. Retained-earnings roll (F7): ships with this slice as the period-12
   close hook — needs `retained_earnings` mapped (seeded chart has it).

## Acceptance (test-first, gl.int.spec extension)

- Fixture day with: one completed cash+card sale, one order deposit,
  one order completed, a PO receipt with freight, an approved vendor
  invoice, a shift closed $3 short, one write-off.
- Run EOD → 6-8 derived batches, each balanced, each `source_type`
  `eod_<family>` with the job-run id as `source_id`.
- Re-run same date → zero new batches (idempotent).
- Unmap `cogs` → family 4 skipped with reason in the job report; other
  families post.
- Trial balance after: debits = credits; inventory account nets
  receipt − COGS − write-off.
- Derived batch refuses PATCH (posted, append-only).
