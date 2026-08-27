# 01 — Domain Model: Cash Drawers, Receipts, Balancing

Stack-agnostic. Names below are *concepts*; map them onto whatever the repo
already calls these things.

---

## 1. Entities

### CashDrawer
A physical or logical money-collection point at a location. Identified by a
drawer number/ID. May be assigned to a user for a session.

### CashReceipt
A single money-in event: payment, deposit, or on-account posting. Carries:

- amount
- payment type (cash, check, EC check, credit card, debit card, gift card,
  misc, third-party financing, …)
- the drawer it posted to (may be null — see **[RULE 1.4]**)
- operator (cashier/user)
- store / location, and therefore district
- **system date** (the date the record was created)
- **transaction date** (the effective/back-dated date)
- customer
- manager-override initials, when an override was required

### CashBalancingBatch
A grouping of receipts to be counted and reconciled. The grouping key is the
`Group Payments by` setting: cashier, store, or drawer. Carries a generated
**reference number** (see `02` → `Next Reference Number`), a status, an
operator-entered cash total, a system-computed cash total, and a variance.

### DrawerReference
The identifier of a batch as seen from the report side. The reports distinguish
**balanced drawer reference** from **unbalanced drawer reference** — they are
the same identifier space, filtered by batch status.

### SuspenseEntry
Totals written out when a batch exhausts its retry budget. Resolvable only
through manager approval.

---

## 2. Drawer / batch state machine

```
                  ┌──────────────────────────────────────────┐
                  │                                          │
   (payments post)│                                          │
        ▼         │                                          │
    ┌────────┐    │   count within tolerance                 │
    │  OPEN  │────┴──────────────────────────────► ┌──────────┐
    └────────┘                                     │ BALANCED │
        │                                          └──────────┘
        │ count outside tolerance                        │
        ▼                                                │ purge eligible
   ┌──────────────┐   save & exit, tries < N              │ after
   │ OUT_OF_      │──────────────┐                        │ Cash Receipt
   │ BALANCE      │◄─────────────┘                        │ Purge Days
   └──────────────┘                                       ▼
        │ save & exit, tries = N                     ┌─────────┐
        │ (only when Post to Suspense is on)         │ PURGED  │
        ▼                                            └─────────┘
   ┌───────────┐   manager corrects / approves
   │ SUSPENDED │──────────────────────────────► BALANCED
   └───────────┘
```

**[RULE 1.1] Tolerance.** A batch is BALANCED when
`abs(operator_cash_total − system_cash_total) <= Maximum Over/Short`.
The tolerance applies to the **CASH** payment type only, not to the batch total
across all tenders. Exceeding it raises an out-of-balance warning.

**[RULE 1.2] Retry budget.** With `Post to Suspense` on (the default), the
operator may save-and-exit an unbalanced batch up to `Number of Tries` times.
On the Nth attempt the screen exits, the batch moves to SUSPENDED, and its
totals are written to suspense. Only manager approval clears it.

**[RULE 1.3] No-suspense mode.** With `Post to Suspense` off, `Number of Tries`
is ignored entirely and the batch **cannot** be saved-and-exited while
unbalanced — the operator must balance to leave the screen. (The source flags
this configuration as not recommended.)

**[RULE 1.4] Blind count.** The counting screen is a *blind* balance: the
operator enters counted totals; the system total is not revealed beforehand.
Preserve this — do not pre-fill the operator field from the system total.

---

## 3. Posting rules

**[RULE 3.1] System date governs the drawer.** A payment posts to the cash
drawer on its **system date**, never its back-date. A payment entered 7/12 and
back-dated to 7/10 appears on the 7/12 cash-balancing report.

**[RULE 3.2] …but transaction date governs the ledgers.** That same payment
shows on **7/10** for both the customer account and the GL account.

Consequence: the two dates must both be persisted on every receipt, and every
query must be explicit about which one it filters on. `Report Daily Receipts
Register` exposes this choice to the user directly via its `Date Type` field
(System Date | Transaction Date); `Report Cash Drawer Balancing Totals` is
always system-date.

Rationale to preserve: this is what prevents writing a payment into a drawer
that has already been closed or balanced. Any design that posts to the drawer
by transaction date reintroduces that bug.

**[RULE 3.3] Credit card refunds on customer returns are not drawer events.**
They do not appear on `Report Cash Drawer Balancing Totals`, and they are not
posted to cash balancing at entry time — with one exception: **customer
drop-off** orders, which do post at entry.

For all other returns the posting is deferred until the customer return is
**completed** (merchandise physically back), so the event naturally lands on a
later day than the return's entry date.

**[RULE 3.4] EC checks are their own tender bucket.** Electronically processed
and converted check payments (EC) total **separately** from non-EC checks.
Do not merge them into a single "check" line.

**[RULE 3.5] Drawer hardware trigger.** With `Open Cash Drawer for Cash Only`
on, the physical drawer opens for cash only. With it off, it also opens for
credit card, gift card, check, and miscellaneous payments. It **never** opens
for debit cards or EC checks under either setting.

---

## 4. Purge / retention

**[RULE 4.1]** `Cash Receipt Purge Days` counts from the moment the associated
drawer is **balanced**, not from the receipt date.

**[RULE 4.2]** With `Extended Cash Balancing` **on**, cash balancing information
is not purged until *both* (a) the full balancing process has completed, and
(b) the purge-day count has elapsed. With it **off**, the day count alone
governs.

**[RULE 4.3]** Setting `Group Payments by = None` turns the whole feature off
and causes **all existing cash receipt records to purge** during End of Day.
This is destructive — gate it behind an explicit confirmation.

**[RULE 4.4]** The receipts-detail dataset behind `Report Daily Receipts
Register` has its own, separate retention: `Daily Receipts Retention Months`
in Accounts Receivable Control Settings, purged by **Generate Monthly Reports**
(not End of Day). Two datasets, two retention clocks, two purge jobs.

---

## 5. Invariants

- **I1.** Every cash receipt resolves to exactly one location, and therefore
  exactly one district. District and store filters on reports are mutually
  exclusive (see `03`, `04`).
- **I2.** A batch reference is unique and monotonically issued from
  `Next Reference Number`, incremented by one per generated batch.
- **I3.** A receipt for an excluded payment type (see `02` →
  `Excluded Payment Types`) is still stored, still posts to GL, and is still
  visible in receipt-detail reporting — it is only hidden from the *balancing*
  grids and from `Report Cash Drawer Balancing Totals`. Exclusion is a
  presentation/reconciliation rule, not a data rule.
- **I4.** Balanced and unbalanced drawer references are queryable
  **independent of posting date**, so that manager overrides performed on a
  different day remain visible against the drawer they belong to.
