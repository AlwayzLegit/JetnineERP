# Phase 0 triage — Sales Views & Reports (Jetnine)

_Authored by us (not part of the verbatim STORIS pack). Proposed answers to the
seven Phase 0 decisions in `07-build-plan.md`, grounded in what Jetnine already
has. Items marked **OWNER** need confirmation before Phase 5; everything else is
proposed as decided by existing architecture or prior locked decisions._

> **Owner confirmations (2026-08-27) — all five OWNER items answered; this
> triage is now locked:**
>
> 1. Keep/drop table → **confirmed as proposed.**
> 2. Data scoping → **yes: salespeople see their store's numbers** (a
>    store-level `data_scope`; owners/managers keep all-location visibility).
> 3. Marketing attribution → **yes, wanted** — capture a marketing code on
>    orders and build the attribution report (never summed across codes).
> 4. Lightweight AP (vendor bill/credit) → **no.** Received-Not-Invoiced and
>    Returned-Not-Credited queues are **dropped**.
> 5. ATP → **confirmed partial**: risk screens use reservation state +
>    linked-PO expected dates; full ATP projection is a future epic.

## The seven decisions

1. **One surface or two? → One surface (decided by architecture).** Jetnine list
   pages already are filterable views with export as an action (audit log CSV is
   the precedent). Views/reports split is not ported. Export and schedule become
   actions on views.

2. **"Regional Processing - Reporting Rules" document → not retrieved, not
   ported.** Jetnine has no Regional Processing; scoping is RLS per business plus
   the permission catalog. **OWNER:** do we need per-user _location_ scoping
   (a salesperson seeing only their store's numbers)? Today every business user
   with a report permission sees all locations. If yes, that is a new
   substrate feature (maps to the `data_scope` self/store/all axis in `06`) and
   should be decided before Phase 1, not per report.

3. **Composition model → fixed layouts now.** No panel-registry framework in v1.
   Customer/product/salesperson pages ship with fixed panel sets; panels are
   built as self-contained components so a registry can be retrofitted.

4. **Which reports LA Mattress runs → triage table below. OWNER confirms.**

5. **Batch window → we have one (EOD runner), but reports stay pure reads.**
   Jetnine's EOD batch does state transitions (auto-replenishment, closeout) as
   explicit audited operations. No report will mutate state; no report exists
   only as EOD output. The D2-style "approved but not yet cleared by EOD"
   artifact does not occur — holds clear at approval time.

6. **The three source contradictions → mostly moot for us.** (a) Completed Sales
   Dollars output restrictions — moot: every view exports to every format.
   (b) "61 and Over Dollars" formula — moot if installment receivables stay
   dropped (see triage). (c) Customer-search OR'd filters — we will **not** copy
   OR semantics; filters AND, as our existing search surfaces already do.

7. **ATP scope → partial, deliberate. OWNER confirms.** Jetnine has the
   delivery-date reservation basis (B14) but no full availability-to-promise
   projection (PO ETA + transfer inclusion + the 5-level source tie-break).
   Proposal: open-order risk screens use what we have (reservation state,
   linked-PO expected dates); a full ATP projection is its own future epic.
   The `999` sentinel is not ported under any outcome.

## Report catalog triage (63 reports)

Grounded in prior locked decisions: **third-party financing only** (no in-house
installment/revolving), **no protection-plan objects**, no leads/CRM/UP system,
no gift registries, no e-commerce carts, no COG, no AP module (yet).

### Keep (build in Phase 5, mostly configuration over the Phase 1 engine)

| STORIS report(s)                                                                      | Jetnine surface                                                                                              |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Written Sales Dollars · Written Sales Summary · Completed Sales Dollars · Completed Monthly Sales Dollars | **One sales report** with written/delivered as a dimension, detail/summary, GL-style recap later |
| Average Value of Sales Orders                                                          | Config over the sales report; count orders, never order-salesperson pairs                                     |
| Sales Commissions                                                                      | Extend the existing commissions report (type/error legend where applicable)                                   |
| Sales Tax                                                                              | Tax liability by jurisdiction over completed orders                                                           |
| Summarized Sales Receipts                                                              | Receipts by payment type / by store, over our payments data (nothing purges here)                             |
| Open Sales Order Summary/Detail · Open Non-Allocated Order Detail                      | The **open-orders surface** (Phase 3 queue), filters not separate reports                                     |
| **Sales Orders with Delivery Dates in Jeopardy**                                       | Priority queue — the call list; pack's own top pick                                                           |
| Sales Reservation Reassignments                                                        | Delivery-date-change view over existing audit data                                                            |
| Outstanding Gift Certificates                                                          | Gift-card liability report (purchases/redemptions/remaining/expiry) — we have gift cards                      |
| Merchandising Activity                                                                 | Buyer's report over inventory + FIFO costs + POs + sales velocity                                             |
| Current Inventory Adjustments                                                          | Adjustment audit view (data exists in inventory audit trail)                                                  |
| Merchandise Received But Not Invoiced · Returned But Not Credited                      | **Queues** over PO receipts / RTV — but see AP note below                                                     |
| Customers' Historical Purchases                                                        | Export over customer purchase history (customer page already shows it)                                        |

### Covered already (no new build)

- **Sales Exceptions** → the existing exceptions module already is the
  recommended design: once-per-occurrence, resolution state, open vs resolved.
- **Count Sheet Tag Details** → physical inventory module.
- **Deleted Orders / Improperly Processed Orders** → orders cannot lose their
  written time by construction; void audit trail exists. The integrity gap these
  two reports patch does not exist here.

### Drop (feature not in Jetnine, per locked decisions)

- **All of section E in-house financing**: Installment Credit Statistics,
  Installment Receivables Activity, Installment Delinquency, Revolving
  Receivables Activity, Expected Revolving Statement Cycling, Financing Aged
  Trial Balance, Financing Settlement Status, Daily Financing
  Activity/Adjustments/Payments, Customer Financing Payments, Credit
  Expirations, Financed Credit Holds, Financed Accounts With Multiple
  Customers, Deleted Orders with Authorized Financing, Monthly Credit
  Applications. (Third-party financing only; we hold no receivables.)
- **Section C leads/traffic**: Detailed/Summarized Sales Leads Activity, Leads
  Comparisons, InTouch Analysis, InTouch Traffic Analysis. (No leads/UP/CRM.)
- **Section D warranties/protection plans**: all four. (No protection-plan
  objects — locked divergence.)
- Open Orders on Credit Hold (no credit holds; exchange E1 hold lives on the
  exchanges list), Orders Completed via Remote Process, Sales Tax Exceptions
  (no alternate tax interface), Electronic Check Pre-Settlement, External
  Credit Card Transactions (revisit if/when a card-processor reconciliation is
  wanted), Purged Gift Certificates (nothing purges), Volume Rebate Status,
  Salespersons Closing Performance (needs leads + goals), Miscellaneous Fees
  (no misc-fee objects), Sales History by Initial/Adjusted Marketing Code —
  **OWNER:** wanted? Requires order-level marketing attribution we don't
  capture today.

### AP note (**OWNER**)

Received-Not-Invoiced / Returned-Not-Credited audit an accounts-payable
approval flow. Jetnine has no AP module; the useful Jetnine versions are
"received but not yet billed" and "RTV'd but no vendor credit recorded", which
need a lightweight vendor-bill/credit record. Confirm whether that record is in
scope before these two are built; without it they are dropped.

## Retention

None of the STORIS purge behaviors exist in Jetnine (nothing deletes
`DAILY.DETAIL`-style data; carts/leads don't exist). The `06` rule still
adopted: any query bounded by a data boundary says so in its output.
