# 04 — Report: Daily Receipts Register

The line-level companion to `03`. Where Cash Drawer Balancing Totals gives
per-drawer totals, this gives receipt detail plus a general-ledger recap.

## Access paths

```
Accounting    > Receivables    > Receivables Reports                      > Report Daily Receipts Register
Point of Sale > Cash Balancing > Store Manager Balancing Function         > Report Daily Receipts Register
```

---

## Scope of data

**[RULE 4.1] Tender scope.** Based on receipts for **tender types that affect
G/L**: cash, checks, and bank cards.

**[RULE 4.2] Third-party financing is included** even though the funds have not
actually been "received".

**[RULE 4.3] Revolving deposits and revolving financing do NOT appear** on this
report.

**[RULE 4.4] Regional Processing gate.** Output may be restricted — the user can
inquire only about customers and locations they have access to. See `06`.

---

## What it shows

Details of the sales receipts, plus a recap of general ledger postings. Per
transaction:

- **type** of transaction — payment / deposit / on-account
- **class** of transaction — cash, charge, guaranteed check, electronic check,
  manual check
- **amount**

---

## Date behavior

Runs for a **specific date** or a **date range**.

**[RULE 4.5] Daily-reports mode.** This register also runs as part of the
**Generate Daily Reports** process. When invoked that way, it bases the report
on transactions that occurred **since the last daily-reports process** — not on
a calendar date range. Two invocation modes, two windowing strategies; build
both.

**[RULE 4.6] Dual-date exposure.** This is the report that exposes both dates
from `01` RULE 3.1/3.2 to the user, via `Date Type` (System Date | Transaction
Date). It is the documented answer to "why is this payment on a different day
in the drawer than in the GL".

---

## Data source & retention

**[RULE 4.7]** The report reads a daily-detail dataset (STORIS: `DAILY.DETAIL`).
Its retention is controlled by **`Daily Receipts Retention Months`** in
**Accounts Receivable Control Settings**, and it is purged by
**Generate Monthly Reports**.

This is a *different* clock and a *different* job from the cash-receipt purge in
`02` (`Cash Receipt Purge Days`, purged by End of Day). Keep them separate.

---

## Output structure

**[RULE 4.8] Basic PDF splits into four items.** With output method
**Basic PDF**, the following generate as **separate items**:

1. the detail report
2. receivables recap **by store**
3. recap **by bank**
4. **G/L recap**

Only the **detail** report prints a legend at the end.

---

## Criteria fields

### `Date Code`, `Start Date`, `End Date`
- `Date Code`: select from the date-code list. See `06`.
- `Start Date` / `End Date`: active **only** when `Date Code = CUS`; define the
  custom range. Calendar picker available.
- Any other date code populates both dates and makes them **read-only**.

### `Report Type` — enum
- `Detail`
- `Summary`

### `Date Type` — enum
- `System Date`
- `Transaction Date`

### `District`
Enter a district code; arrow lists available districts (choose one or more);
action affordance opens the **Multiple District Selection Window**.

> **Entering a district de-activates the `Store` field.**

### `Store`
Enter a store code; arrow lists available stores (choose one or more); action
affordance opens the **Multiple Location Selection Window**.

> **Entering a store de-activates the `District` field.**

**[RULE 4.9]** Same two-way mutual exclusion as `03` RULE 3.9. Share the
implementation between the two screens.

### `Print General Ledger Recap` — boolean
Include a GL recap in the report.

### `Send Output to`
Current output destination; changed via actions → `Output Settings`. See `06`.

### `Export Path`
Read-only; populated for PRV / Excel Export / ASCII Export destinations. Not
editable from this routine.
