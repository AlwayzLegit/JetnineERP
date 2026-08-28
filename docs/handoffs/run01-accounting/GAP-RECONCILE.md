# Run-01 Accounting pack — gap reconcile vs shipped Jetnine

Authored 2026-08-28 for task #29. The pack dissects all 307 STORIS
Accounting articles (GL 10 · Payables 63 · Receivables 124 ·
Views/Reports 100). This maps it onto Jetnine's deliberate shape and
puts the structural decisions to the owner before any accounting code
is written.

## 1. The structural facts

**Jetnine has no general ledger by design.** Money is integer cents on
operational records; derived money is computed, never stored; there is
no double-entry posting engine, no chart of accounts, no fiscal
periods. That was the right call for POS/operations — and it means the
GL half of this pack is a *strategy* question, not a gap list.

**The receivables half is mostly retired by a locked decision.** The
owner locked **third-party financing only**. STORIS's two in-house
consumer-credit subsystems (closed-end installment with Rule-of-78s,
open-end revolving with cycling), plus collections, Metro 2 bureau
reporting, LET/repossession, credit insurance, credit applications,
payment agreements, statements and the five AR agings — batches 7–17,
23, and most of 27–29, ~124 articles — are **reference material for
reading migrated STORIS history, not build targets.** Reversing that
would be a program larger than everything shipped so far (see §4 Q3).

## 2. What Jetnine already covers

- **AP substrate**: vendor invoices with G11 three-way matching,
  variance tolerance auto-clear, reject buckets, remit-to fraud
  alerts, `Convert-to-Payable`-shaped RTV credits (H2), AP-ish
  exception surfacing. No check runs, EFT, or positive pay.
- **Cash chain**: shifts (float → counted close → variance), closeout,
  Z-report, receipts register by method × location, D8 import
  exclusions. (Bank rec + blind-count discipline are already
  scope-gated in the cash-balancing reconcile.)
- **Inventory ↔ money**: FIFO cost layers on receipts/transfers,
  COGS-at-completion computable, physical-inventory variances,
  write-off register with coded reasons.
- **Deposits & liabilities**: order deposits and balances (computed),
  gift-card liability report — the pack's `Deposit Liability` account
  is derivable today.
- **Card settlement**: Stripe per-payment; no funding batches, no PAN
  anywhere (three of the pack's compliance findings cannot exist here).
- **Period discipline**: none — no fiscal periods, no posting dates
  distinct from event timestamps. The pack's headline trap (GL posts
  on *transaction* date) matters for **reading STORIS history**, not
  for Jetnine's own records.

## 3. What the pack teaches regardless of scope (adopted as written)

- The **six things a rebuild would get wrong** (summary §Closing) are
  recorded as migration guidance — especially: periodise migrated
  STORIS data by transaction date, expect hand-absorbed variances, and
  expect four receivable pools where Jetnine has one.
- The **glossary** (`Received Not Recorded`, `$$$$$^NN`, cycling,
  long/short term …) is the vocabulary for any STORIS data reading.
- The six patterns the run says are worth lifting intact (bank-rec
  proof-and-batch, GL drill-down, credit-hold table, statement
  criteria+exception, plan restriction rules, append-only batches)
  inform future designs; Jetnine's exceptions/audit stores already
  follow the append-only discipline.

## 4. Owner batch — five questions + one Ops action

1. **GL strategy** — pick one:
   (a) **Accounting export to QuickBooks/Xero** *(recommended)*: Jetnine
   stays the operational source of truth and emits a daily journal
   summary (sales, tax, tender by type, deposits taken/applied, COGS,
   inventory receipts, vendor bills, cash over/short) with an
   account-mapping settings screen — the pack's own TPA pattern, minus
   its silent-default-account flaw (unmapped = blocked, like
   `$$$$$^NN`).
   (b) In-house double-entry GL with chart of accounts and fiscal
   periods — a multi-month program; only worth it if you refuse to run
   an external books system.
   (c) Nothing yet — reports stay operational; your accountant works
   from exports/CSV as today.
2. **AP scope**: keep bill capture + matching in Jetnine and pay out
   of the books system (fits 1a), or build payment operations —
   check runs, EFT files, positive pay, void/reissue (batches 20–22)?
3. **AR scope**: confirm third-party-financing-only stands, retiring
   the in-house credit half to reference (§1). Say the word only if
   LA Mattress genuinely intends to carry its own paper.
4. **Fiscal calendar** — same question as the cash pack (calendar
   months presumed); needed the moment 1a or 1b is chosen.
5. **Layaway statements**: layaway exists in Jetnine (orderKind).
   Do customers get a periodic layaway statement (the one receivables
   artifact that survives Q3), or is the order/track page enough?

**Ops action (this week, before any migration work — summary §H):**
in live STORIS, check and record the state of the four opt-in audit
switches — `End-of-Day Posted Transactions` (GL control),
`Inventory-G/L Reconciliation Audit` (costing control), `Open Item
Auditing` (AR control), `Track Settings Activity` — plus `Extend Cash
Balancing`. Their values decide how much STORIS history exists to
migrate at all. Also flag to whoever owns data protection: STORIS
exposes retrievable full PAN, writes **unencrypted bank account
numbers into check export files**, and uses SSN as a search key —
handle those extracts accordingly during cutover.

## 5. Build order on answers

1a chosen → slices: journal-event derivation from existing records
(append-only, replayable) → account-mapping settings (SET-007 rows,
unmapped blocks) → daily summary + export file → QuickBooks/Xero
format. Each with tests first; batches 1, 18, 24 supply the acceptance
detail. 2-if-built follows batches 20–22; everything else stays
reference.
