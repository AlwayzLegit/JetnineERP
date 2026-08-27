# Settlement & Cash Drawer

## Settlement `[DOC]`

With online financing approvals active, finance-receivable transactions post **throughout the day to
the current un-transmitted batch**, and daily transmission is mandatory.

**Transmit** takes a single field — finance provider (one, several, or all) — and runs either
automatically in day-ending or manually, per an auto-EOD-transmit setting. It sends **deposit and
completed-order** transaction information. Some providers mandate specific transmission windows, and
scheduling is expected to be agreed with the provider.

### Two settlement methods `[DOC]`

**One-step** (most providers): transmit the day's detailed transactions → immediate response → items
marked `settled` and moved to history → a settlement report prints.

**Two-step** (documented for Citi): step 1 creates and transmits a batch record; the provider
processes overnight; step 2 retrieves the response file the next day through a settlement-completion
program. Nothing completes on our side until the response arrives.

### Timing by plan type `[DOC]`

```
revolving              → end of day, or manual
installment, RTO       → on transaction completion; partial completion sends a partial settlement
in-store FR payments   → at the moment the payment is applied
```

### The blast-radius rule `[DOC]` / `[DECIDE]`

> If an error occurs for one order it stops **all other orders at that location** from settling until
> the settlement error flag is cleared.

Documented, and almost certainly not what we want: one malformed order halts a store's funding.
`[DECIDE]` Isolate failures per item, quarantine the bad item, settle the rest, and alert. Confirm
this departure before phase 8 — there may be a provider protocol reason (batch-level checksums) that
forces the STORIS behaviour for some transports.

### Error handling — batch level `[DOC]`

A resubmit-settlement-errors program, gated by a permission where **the user-level setting overrides
the user-group setting** (note the direction). It warns you to contact the provider first, pre-scans
for failed records, and exits if none exist.

Fields: finance provider; **merchant number** — required for `TCP_MANUAL`, **inactive for `FTP`**,
auto-defaulted and locked when only one merchant has errors; **batch number** — inactive until
provider and merchant are chosen, listed ascending, auto-defaulted when only one.

Grid (read-only membership — you cannot add or remove items): order number, customer name, finance
plan, finance account number, amount being settled, approval number, action.

```
Action:  NO_ACTION (default) | ACCEPTED (provider took the detail record and will fund it) | RESUBMIT
```

**For `FTP` providers, `RESUBMIT` is the only allowed action** — funded-item confirmation happens as a
separate later process. Bulk actions (accept all / resubmit all) require the order-number filter to be
empty. Save makes resubmitted items eligible for the next batch.

### Error handling — transaction level

See `06`, financed balances.

---

## Cash drawer `[DOC]`

Positioned explicitly as a **back-office** control: operators and cashiers enter receipt totals at
end of business day, separated by payment type.

**Grouping** is one system-wide choice: by **drawer**, by **cashier**, or by **store**. The single
identifier field's meaning follows that choice — a user id, a location code, or a drawer number.

**Prerequisites:** extended cash balancing enabled, plus either a number-of-tries limit or a
post-to-suspense fallback. `[INFER]` These are a retry limit on blind entry and a suspense account for
unresolved differences; neither is defined in the docs.

### Blind balancing `[DOC]`

```
Date (defaults today) + Start Time (00:00) + End Time (23:59)
```

> **Transactions falling outside the start/end window are not included on batches**, appear on a
> cash-balancing exceptions report at end of day, and for accurate reconciliation all transactions
> must be on a batch.

That is a real footgun: a shortened window silently orphans receipts. `[DECIDE]` We should default to
the full logical day and warn loudly when a narrower window would exclude existing receipts.

The blind screen auto-assigns a drawer reference from a next-reference-number counter, shows a running
drawer total of operator-entered amounts, and a grid of: **payment type** (either all types on the
system or only those with receipts today, per config), **total** (operator entry), **balanced**
(Yes if the operator total matches the system total, No if not). The operator never sees the system
total. Save performs the comparison.

**Petty cash** is handled inside the same grid: select the petty-cash type, enter the amount, Add,
then open the petty-cash disbursement window.

### Manager approval `[DOC]`

**The manager must approve every out-of-balance drawer.** An exceptions report lists them. The manager
can correct, balance, approve, and **post payment transactions the cashier missed** — and any
adjustment posts with a transaction date equal to the transaction date of the other transactions in
that drawer, not today's date.

Fields: reference (search lists **suspended** drawer references), the drawer/cashier/store identifier,
date, over/short, start/end time, payment type, **system total** (visible here — the docs explicitly
recommend restricting access to this screen for that reason), **posted total** (operator total,
editable). Actions: cash-post (opens payment entry to post missed receipts, updating system totals)
and petty-cash disbursement.

On save, if the cash difference exceeds the configured tolerance, the routine prompts **"Post
Overage/Shortage?"** — Yes posts the difference automatically.

### Reconciliation `[DOC]`

Performed **after the bank deposit has been made**. The grid shows all drawers not yet reconciled and
purged: reference, date, drawer/store/operator, system total, status (`R` = reconciled), bank total,
over/short (= system total − bank total). Bank total "is useful only if you submit separate deposit
slips for each cash drawer." Enter bank total, Add, Save. Purge is the terminal state.

Reports: cash drawer balancing totals, cash balancing exceptions (runs during daily report
generation).

### Not documented `[DECIDE]`

**Drawer opening is entirely absent** from the source material — all three cash articles cover
closing. Specify: opening a till, assigning a starting bank, mid-day drops and pickups, and the purge
routine itself. Without an open event, "system total" has no defined start boundary.
