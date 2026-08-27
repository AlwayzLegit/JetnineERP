# Cutover Plan

The build is the easy half. This file is about not losing money on the day you switch.

## Principle: cut over on a boundary, not a date

Sales Processing has three natural boundaries, and the cutover should land on all three at once: an
**accounting period close**, a **settled financing batch** (nothing in flight with a provider), and a
**reconciled and purged cash drawer set**. Anything in flight across the boundary has to be finished in
the old system, not migrated mid-flight.

## What must migrate, and in what state

| Data                                    | Migrate as                                                                                                          | Notes                                                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customers                               | Full, with balances as **derived** buckets recomputed from migrated detail — not as stored totals                   | Dedupe first; STORIS has merge tooling for a reason. Bring the merge history if it exists                                                                                         |
| Products / price setup                  | Full, including the price/spiff/commission table, district price exceptions, markdowns, and customer price matrices | Without all seven hierarchy levels, prices silently change on day one — see `04`                                                                                                  |
| Open orders                             | Full, including every fulfillment, line, deposit, tax row, hold, and comment                                        | This is the hard one. See below                                                                                                                                                   |
| Partially completed orders              | **Finish in the old system if at all possible**                                                                     | A partially completed order carries invoice linkage, a back-order chain position, and per-fulfillment charge overrides. Migrating these correctly is disproportionately expensive |
| Deposits                                | As open liabilities, reconciled to the GL deposit-liability account to the cent                                     | A deposit that does not tie is a customer walking in with a receipt you cannot honour                                                                                             |
| Completed orders / invoices             | History, read-only, for lookup, returns, warranty, and commission attribution                                       | Returns need the original written date and original payment records (`03`, `08`)                                                                                                  |
| Financing applications & authorizations | Approved-and-unused approvals must migrate or customers lose their approval                                         | Confirm with each provider whether approvals survive a system change                                                                                                              |
| Financed balances                       | Only if we service them; otherwise they stay with the provider                                                      | Depends on the `06` receivables decision                                                                                                                                          |
| Settlement history                      | Enough to answer "was this funded"                                                                                  | Do not migrate open batches — settle them out first                                                                                                                               |
| Cash drawers                            | None in flight; reconcile and purge before cutover                                                                  |                                                                                                                                                                                   |
| Leads / CRM                             | Active leads with their full comment history; historical leads as read-only                                         | Comment history is the value; a lead without it is a name                                                                                                                         |
| Up System                               | Nothing. Start the rotation fresh on day one                                                                        |                                                                                                                                                                                   |
| Commission records                      | Current unpaid period plus enough history for return attribution                                                    | Returns date to the **original** invoice's written date                                                                                                                           |
| Gift certificates                       | All outstanding balances                                                                                            | Directly redeemable money                                                                                                                                                         |
| Warranties / protection plans           | Full, with line linkage                                                                                             | Multi-year obligations; losing linkage loses claims                                                                                                                               |

## Open orders: the actual work

For each open order the extract must preserve, at minimum:

- Order header including written date, salespeople **with commission percentages**, marketing codes,
  order source, and every comment stream
- Fulfillment children with method, status, dates, requested date, deliver-to address, route code,
  ticket-printed state, and **per-fulfillment charge overrides with their reason codes**
- Lines with quantities in all their forms (ordered / reserved / assigned / held / scheduled), price
  **and the price's provenance** where derivable, discount codes, flags, ATP/ATC dates, serials,
  storage locations, and every linkage (warranty, protection plan, PO, transfer, service order)
- Tax rows per jurisdiction per fulfillment
- Payments and deposits with authorization numbers and masked references
- Holds

**Reconciliation gates — all must pass before go-live:**

```
1. Count:    open orders, open fulfillments, open lines match source exactly
2. Money:    Σ net total, Σ deposits, Σ balance due, Σ tax by jurisdiction match to the cent
3. Liability: deposit liability ties to the GL account
4. Financing: Σ authorized amounts by provider match provider statements
5. Schedule: fulfillments per date per route per location match the old system's schedule
6. Spot:     50 orders reviewed screen-by-screen by the staff who wrote them
```

Gate 6 is the one that finds real problems. Budget for it.

## Dual-run

Run both systems in parallel for at least one full week and one weekend (weekend traffic is different
in mattress retail, and delivery scheduling is where errors surface). During dual-run:

- **Old system is authoritative.** New system is shadow-written from the same paperwork.
- Compare daily: written sales dollars, deposits taken, tax by jurisdiction, commission by
  salesperson, and tomorrow's delivery schedule.
- Any discrepancy is a bug in the new system until proven otherwise.
- Do **not** dual-run card authorization or financing submission — you will double-authorize a
  customer. Point the new system at provider sandboxes.

## Go-live sequence

```
T-14d   Freeze STORIS configuration changes. Final extract dry-run + full reconciliation.
T-7d    Dual-run begins.
T-2d    Stop taking new special orders that cannot complete before cutover.
T-1d    Settle all financing batches. Reconcile and purge all cash drawers. Close the period.
T-0     Final extract, load, reconcile (gates 1-5 automated, gate 6 sampled). Go/no-go call.
        Open with STORIS read-only, new system live.
T+1d    Every order written on day one gets reviewed before its delivery date.
T+30d   Decommission STORIS write access; keep read access for one full year for returns,
        warranty claims, and audit.
```

## Rollback

Define the abort condition **before** T-0, not during it. Suggested: any of the money gates failing by
more than a defined tolerance, or card/financing authorization failing in production. Rollback means
STORIS write access is restored and the new system's day-one orders are re-keyed into STORIS — which
means **day one must be small**. `[DECIDE]` Consider a single-store pilot rather than an all-store
cutover if the store count makes that possible.

## Things that will bite

- **ASAP and CWC fulfillments have no date** and drop out of date-filtered extracts (`09`). Extract
  them separately and count them separately.
- **Back-order chains** occupy positions in a 52-slot sequence; a migrated chain must not restart at
  `A` if the old chain is at `M`.
- **Layaways** are long-lived, low-attention, and each one is a customer's money. Reconcile them
  individually, not in aggregate.
- **Rooms** are per-order throwaway records; do not build a room master from them.
- **Exchange halves** are two-sided; an extract that treats an exchange as one order will lose the
  return side and its commission.
- **Tax exemption expiry dates** compare against the _written_ date. Migrating orders whose customer's
  exemption has since expired must keep the original tax treatment, not recalculate.
