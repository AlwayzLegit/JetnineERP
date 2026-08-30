# PLAN-STORIS-GAP.md — STORIS Gap Analysis → Gap-Closure Sprint

Owner-provided gap analysis (2026-08-26) comparing the v1 build (P1–P8 of
`PLAN-POS-OPERATIONS.md`) against STORIS 9.6–9.8 behavior, adopted verbatim as the
governing spec for the gap-closure sprint. Owner directive: **"we need to add all
which is missing."**

## Amendments to previously locked decisions

This document supersedes the following earlier owner-confirmed decisions where they
conflict; per protocol the change is recorded here before the code changes:

- **A5 (supersedes part of A1):** print-lock becomes a _soft_ lock (edit warning +
  logged); the _delivery run_ becomes the hard lock. Inventory relief moves to run
  close-out. Individual print still soft-locks; batch print builds the run and the
  run locks.
- **A6 (supersedes "price overrides with no approval"):** three-tier price variance —
  small variances stay frictionless (logged only), mid-tier requires a coded reason,
  large/below-margin-floor requires a manager security override. Thresholds
  admin-editable per store.
- **A7 (supersedes P8 refund-at-entry):** returns split into Authorized → Goods
  Received → Completed; the refund fires at Goods Received. Counter drop-off (goods
  physically in hand) refunds immediately and is flagged as drop-off.
- **A8 (narrow exception to "no serials" D-decision):** as-is inventory gets
  piece-level reference ids (condition, price, reason, storage location, photos,
  age travel with the piece). Everything else stays SKU-level.
- **A9:** free-text reasons are replaced by the coded Reason Code registry
  everywhere a reason is prompted (free text remains only as a transitional
  fallback while a business has no active codes for that usage class).
- **A10 (2026-08-30, supersedes A6):** the discount-approval prompt is removed for
  every user — any associate may discount to any depth with no reason and no
  manager override (owner: "Its a distraction and all users can approve discounts
  without a reason"). This restores the original PLAN-POS-OPERATIONS decision
  ("price override: any associate, no approval, no cap"). The G6 three-tier math
  survives only to grade the exception-register entry (tier 2 = info, tier 3 =
  warning, below cost = critical), so deep discounts stay visible in reports
  without ever blocking the sale.

## Ranked build order (the sprint tracker — mirrors SPRINT-STATUS.md)

| #   | Item                                                                   | Section  |
| --- | ---------------------------------------------------------------------- | -------- |
| G1  | Security Override primitive + permission registry                      | §0.1     |
| G2  | Reason Code registry with usage classes                                | §0.2     |
| G3  | Refund gated on physical receipt (Authorized → Received → Completed)   | §8       |
| G4  | Scrap / write-off: permission + valuation + register                   | §8       |
| G5  | Exception register + weekly per-associate ranked digest                | §0.3, §2 |
| G6  | Price variance thresholds (3-tier)                                     | §5       |
| G7  | Delivery run object + close-out reconciliation                         | §4       |
| G8  | Transfer in-transit state + variance investigation                     | §7       |
| G9  | Ticket print preconditions (reserved / date / balance cap)             | §3       |
| G10 | As-is piece-level reference id                                         | §8       |
| G11 | Blind receiving + SoD on invoice approval + vendor remit-to alert      | §6       |
| G12 | Multi-dimensional capacity + zip→route mapping                         | §4       |
| G13 | Line-level status roll-up + Past Due view + Auto Stock Release         | §1       |
| G14 | Duplicate-order / consolidate-delivery prompt + ATP-vs-promise warning | §5       |
| G15 | Pick list separate from delivery ticket (no prices)                    | §3       |

Plus §2's audit-event coverage table and §1/§2/§5 guardrail lists, which ride with
their nearest ranked item.

---

# The gap analysis (verbatim)

Section-by-section comparison of the v1 build against how STORIS actually operates,
based on the STORIS 9.6–9.8 web help (routine names cited for lookup).

For each section: How STORIS does it → What's missing → Guardrails
(accuracy / ease / theft) → UX/UI.

## 0. Three primitives you don't have that fix ~60% of the gaps below

Almost every individual gap downstream is a symptom of one of these missing.

### 0.1 Security Override (second-person authorization at the point of action)

STORIS gates nearly every risky field with a named permission (Create a User/Group
Actions — Sales Security, — Logistics Security, — Receivables Security, — Payables
Security, — System Security). When a user without the permission attempts the
action, the Security Override Screen appears mid-transaction. It shows:

- what action requires the override,
- a description of the exception that triggered it,
- a User ID + password field for a different, authorized user,
- and (if configured) a reason code dropdown restricted to Exception Reporting codes.

The override is stamped on the transaction with both user identities.

We have: a role permission matrix, and one typed-reason unlock for print-locked
orders. We don't have: any second-person authorization anywhere in the system.
This is the single largest theft exposure in the build.

Build: one reusable `<SecurityOverride>` component + `requireOverride(permission,
context)` server guard that returns 403 `OVERRIDE_REQUIRED` with the action
description, and an overrides table (actor_user_id, authorizing_user_id,
permission, entity_type, entity_id, reason_code_id, before, after, created_at).
Everything below reuses it.

### 0.2 Reason Code registry with usage classes

STORIS has a Reason Code Settings table where every code carries a usage code that
declares where it is legal: Exceptions, As-Is, As-Is Restricted, Obsolete, Not
Required, plus specific ones for installment adjustments, plan closures,
manifest-order-removal, etc. The system refuses a reason code of the wrong class.
Codes flagged As-Is Restricted cannot be assigned or removed without Logistics
Security or a manager override.

We have: free-text reasons. Free text is unenforceable and unreportable. Every
reason prompt should draw from a coded, admin-managed list.

Build: `reason_codes` (code, description, usage_class, is_restricted, active) +
usage_class enum (exception, as_is, return, adjustment, delivery_failure,
manifest_removal, inventory_adjustment, transfer_variance, write_off). Every
reason prompt takes a usage_class filter.

### 0.3 Exception register (not a notifications feed)

STORIS writes exceptions to dedicated, reportable files with retention settings —
ROUTE.EXCEPTION for manifest completion exceptions, S$TE_MAINIF_RMV for orders
removed from a manifest, and POS exception reporting for overrides. Queryable, not
a feed.

An exception register has: severity, type, actor, store, unread/acknowledged
state, assignee, filters, and a daily digest. Also missing: thresholds — notify
when a configured Price Variance Percent is exceeded, not on every price edit.

### 0.4 The underlying principle to copy

**In STORIS, the financial event is gated on the physical event.**

- Returns do not hit the GL until the merchandise is physically back and the
  return is completed.
- Inventory is not relieved and orders are not closed until the delivery manifest
  is completed — not when the ticket prints.
- Vendor invoices don't clear for payment without a matching receiving record.

v1 moves money and inventory earlier than the physical event in several places
(§3, §8). That's the deepest fix on this list.

## 1. Orders list (/orders)

**How STORIS does it.** An order is not one status. It carries three orthogonal
layers: document type (Sales Order, Layaway, Sales Quote, Return, Exchange,
Multi-Ship-To master, Service Order), delivery status (SCH Scheduled, EST
Estimated, CWC Customer Will Call, ASAP), and per-line item status (Reserved,
Assigned, Back Order, H On Hold, C Linked to COM, U Unscheduled). Plus orthogonal
flags: credit hold, on-manifest, on-hold PO linkage. The line grid shows status
per line, always visible. Line status can be manually reallocated (Re-assign a
Sales Reservation). Automatic Stock Release runs in End of Day: reservations on
orders past their delivery date by N days, or postponed more than N times, are
released and re-committed.

**What's missing**

- Line-level status collapsed into one order-level word → roll up visibly:
  "3 of 5 reserved · 1 On PO · 1 BO".
- No per-line Hold (ship part of an order while holding a line).
- No Estimated vs Scheduled distinction — EST dates must not consume route
  capacity, SCH dates should.
- No credit hold (layaway, Synchrony/Acima).
- "Pending" conflates back-ordered-no-PO, never-allocated, and special-order
  awaiting PO — split them.
- No Past Due filter (undelivered past promised date — the most useful list in
  the building).
- No Auto Stock Release → ATP becomes fiction within months.
- Missing statuses: Quote, Cancelled, Voided, Partially Delivered, Awaiting
  Return Pickup, In Transit, Direct Ship.

**Guardrails.** Accuracy: nightly reconciliation SUM(reserved) == on_hand.reserved
per SKU/location, alert on drift; capacity/status computations exclude cancelled +
estimated. Ease: search extended to phone, email, address, SKU, PO #, delivery
date, card last-4; saved views (My Orders · Past Due · Unallocated · On Hold ·
Delivered With Balance · Awaiting PO) persisted per user; bulk actions; visible
total count. Theft: standing alert on Delivered + balance due > $0; flag
salesperson-matches-customer; flag same customer across stores in short window.

**UX/UI.** Keep slide-over. Add sticky summary row (order count, total balance
due, undelivered value). One documented status color semantic + legend. Balance
due red when delivered.

## 2. Order detail — history + notifications

**How STORIS does it.** Changes go to the Order Comments file and exception
files; the audit trail is the backstop, the control is the pre-authorization gate
(§0.1) that fires before the change lands — logging actor, authorizer, reason
code, exception description.

**Missing audit events (all needed):** line added/removed/qty changed · discount
applied/overridden · delivery date changed with a postponement counter ·
salesperson changed (lock after completion/commission run) · customer swapped on
an order · tax exempt toggled · recycling fee removed · individual tender voided ·
deposit transferred to another order (own permission + log entry; STORIS Maintain
Customer Deposits) · route/date changed after ticket print.

**Also missing:** append-only enforcement at the DB level (no UPDATE/DELETE grant
for the app role on audit_logs); IP/device/terminal + acting_as context;
correlation ids linking timeline rows to the inventory/ledger movements they
caused.

**Guardrails.** Accuracy: timeline entries and inventory/GL movements in the same
transaction. Ease: filter/collapse by event type; group same-actor edits within a
minute. Theft — highest-ROI item in the document: **weekly per-associate
exception digest, ranked** (discount $ given · orders modified after print ·
unlocks · returns · cash refunds · deposits moved · price adjustments · fee
removals).

**UX/UI.** Notifications need severity, unread, acknowledge-with-timestamp,
assignment, filters, daily digest email. Notify on threshold breach, not every
edit.

## 3. Documents + print lock

**How STORIS does it.** A delivery ticket will not print unless: a scheduled
delivery/pickup date exists; merchandise is reserved; no credit hold; open
balance ≤ Maximum Balance (AR Control Settings); pickups within Delivery Lead
Days. Printing does not lock the order — **manifest membership** locks it;
removal from a manifest requires a reason code and logs an exception. Inventory
relief and order completion happen at manifest completion. STORIS separates four
documents: pick list (warehouse, no prices), pack list (loader), delivery ticket
(customer), manifest (driver/office).

**What's missing**

- No print preconditions at all → implement the STORIS list incl. a
  `maxBalanceForTicketPrint` ops setting with an override path.
- Print is the wrong lock event → keep print-lock as a _soft_ lock (warning +
  logged); the delivery run is the hard lock; relieve inventory at run close-out.
- No pick list (warehouse currently pulls from a priced customer document).
- No reprint tracking (copy number + reprint count, logged).
- No document id + revision on the invoice.
- Unlock under-controlled → coded reason + second-user authorization + expiring
  unlock window (15 min auto-relock) + escalation (3rd unlock on same order
  notifies owner).
- Locked-state allowlist too narrow → also allow delivery instructions, phone,
  notes.

**Guardrails.** Preconditions enforced server-side; blocked print shows the
pass/fail checklist; reprint counter; unlock expiry + escalation; balance cap.

**UX/UI.** Locked banner states who/when/what-you-can-still-do. Itemize the CA
mattress recycling fee as its own named line. Delivery ticket: signature block ·
pieces-delivered tally · damage/refusal checkbox · not-home outcome box. Batch
print builds the run; the run locks.

## 4. Dispatch + capacity

**How STORIS does it.** Capacity is multi-dimensional (dollar value, piece count,
stops, cubic volume, labor hours) — global Route Capacity Control Settings +
per-route overrides; Product Group Settings carry Capacity Units / Weight /
Unload Time. Routes are geographic and pre-declared; Individual Zip Codes maps
zip → default route + location, defaulting into the order at entry. Scheduling is
at stop times; manifests print in stop-time order; Consolidate Stops merges
same-customer+address. The run is a real object: Build → Print → Complete the
Delivery Manifest Process, recording COD due vs collected, the bank, per-piece
delivered/not-delivered, reschedules, and a New Storage Location for returns.
Exceptions write to ROUTE.EXCEPTION.

**What's missing:** single-number capacity (add piece count + cube/labor per
product group) · no zip→route mapping · no stop times/windows · no stop
consolidation · no truck/driver entity (per-truck-per-day caps) · **no
manifest/run object** (no COD totals, no out-vs-back reconciliation, no per-piece
outcomes, no auto-reschedule, no storage location for returns, no inventory
relief tied to physical completion) · no failed-delivery outcome codes ·
no postponement counter · cap is global (needs per-store/route/day-of-week) ·
no service or transfer runs.

**Guardrails.** Accuracy: capacity counts scheduled only; recompute server-side
on every mutation. Ease: drag-to-reorder, map view, auto-sequence, unassigned
tray, optimistic UI + conflict resolution. Theft: **run close-out reconciliation
mandatory** — every piece ends delivered (signed) / returned-to-stock (with
location) / exception (coded); COD due vs collected per run with named hand-off;
over-capacity override needs a named authorizer.

**UX/UI.** Week view + truck lanes; capacity bar by utilization naming the
over-dimension; show next available day on the over-capacity warning.

## 5. New Sale extras

**How STORIS does it.** Price Variance Percent (POS Control Settings) raises an
exception requiring a reason code and/or security override. Line discounts
permissioned. Cost visibility separately permissioned. Payment types individually
permissioned. Daily Maximum Cash Refund Per Customer with named override.
Financing blocked without a valid credit application (Require Credit
Application). Duplicate-order detection prompts to consolidate delivery dates.
Special orders can't be orphaned ("Must either reserve or place on Purchase
Order"). Tax exempt permissioned (Change Taxable Settings).

**What's missing**

- Three-tier price override control (≤5% or ≤$50 logged only · 5–15% coded
  reason · >15% or below margin floor manager override), thresholds per store.
- Margin floor + cost-visibility permission (managers see a margin indicator).
- Layaway $100 minimum enforced at save with override path.
- ATP-date vs promised-date hard warning.
- Duplicate-order / consolidate-delivery prompt.
- Credit application gate for Synchrony/Acima tenders.
- Tax-exempt permission.
- Recycling-fee removal: coded reason + exception digest (compliance).
- Store credit hardening: apply permission, block cross-customer application,
  monthly liability-by-age report.

**UX/UI.** Keep single-screen + pinned totals. Tender-by-tender rows with
per-tender void (logged) pre-completion. Persistent inline chip on overridden
lines. Show next open delivery day alongside "N of 15 booked".

## 6. Purchasing

**How STORIS does it.** PO hold status (special-order/direct-ship/foreign/EDI
POs held until a buyer releases). Purchase status governs orderability (Active,
Dropped, Discontinued, Markdown, One-Time-Buy, Purge). Receiving is a distinct
routine with Receipt Date + activity type (Receive vs Reverse a Receiving
Error), no mixing normal and credit receiving in one session. Vendor Model vs
SKU display toggle. Default-quantities toggle. Three-way match with configurable
tolerances (auto-clear within tolerance; route exceptions with variance
highlighted). Vendor chargebacks (Enter a Stock Adjustment → Vendor Chargeback):
markdown by $ or %, New Cost/New Selling Price, Vendor Reference, dual
permissions.

Note: our receive → inspect → accept staging with allocation at ACCEPT is
stronger than STORIS's default and right for mattresses. Keep it; gaps are
around it.

**What's missing:** third bucket out of the staged flow (accepted 8 of 10 — the 2
go to as-is w/ reason, vendor chargeback, or vendor return against an R/A #) ·
R/A number field · landed cost (freight/tax/misc in cost basis) ·
receiving-error reversal as a distinct permissioned transaction · PO hold
status · blind receiving option · over-receipt tolerance · missing-receipt and
partial-delivery match exceptions · variance tolerance setting (auto-clear
within) · segregation of duties on invoice approval (enterer ≠ approver or $
threshold) · PO close/cancel with reason + partial-cancel · email-PO audit trail
(sent log, PDF snapshot, vendor ack).

**Guardrails.** Theft: SoD on approval; separate PO.create and PO.release;
vendor remit-to/bank changes separately permissioned + owner-alerted (highest-
dollar fraud in small multi-store retail).

**UX/UI.** SO⇄PO chips bidirectional (+ /track shows "on order, ETA"). Suggested
pre-load gets a "why" column.

## 7. Transfers

**How STORIS does it.** Two paths: Stock Adjustment → Transfer tab (posts
immediately, corrections) vs Enter a Transfer (create → print → acknowledge/
receive → complete; inventory posts at completion; paper trail). Transfer
manifests include New Storage Location for undelivered; changes blocked while
pending receiving transactions are unprocessed. Floor Sample is a first-class
type. Goods on a transfer are not sellable at either end. As-is moves via a
separate As-Is Transfer tab; reason + price travel with the piece.

**What's missing:** in-transit state (explicit bucket, not sellable either
end) · discrepancy handling (per-line received qty, computed variance, mandatory
investigation state with coded reason — transfer shrink is the most common
internal theft channel in multi-store retail) · transfer aging report (>3 days
standing alert) · transfer types (replenishment, floor sample, customer-driven,
as-is consolidation) · as-is transfer path carrying reason + price · reason code
on creation · request workflow (store requests → warehouse approves → picks →
ships) · authenticated receiving identity captured alongside the paper
signature.

**Guardrails.** Variance investigation cannot be dismissed, only resolved with a
coded reason and (above $ threshold) a manager override. Mirror the PO receiving
three-state UI.

## 8. Returns / As-Is / store credit / exchange

**How STORIS does it.** Core rule: returns do not hit the GL until completion —
no refund until the merchandise is received back and the return completed.
Fulfillment method distinguishes C Customer Drop Off (goods in hand) from truck
pickup (refund waits; pickup ticket rides a manifest). Reason Return Code
mandatory per line. Return-to-As-Is is a per-line checkbox at entry. Restricted
as-is codes need Logistics Security or override. Restocking fee is a permissioned
control setting (zero is a setting, not a hardcode). Return without original
order is a named permission. Restrict-to-original-tender is a setting. Daily
Maximum Cash Refund Per Customer with override. Adjust Dollars on a Completed
Order is a separate permissioned document type. Exchanges are one document or
Split Exchange into two; separate salespeople per portion. As-is is tracked by
piece with a reference number, mandatory reason, optional R/A or PO#, permission-
gated as-is selling price, storage location, required comment; write-off is a
separate permissioned action. Card refunds on returns don't post to cash
balancing at entry (except drop-offs).

**What's missing**

- **Refund timing is inverted** → Authorized → Goods Received → Completed;
  refund at Goods Received; drop-off refunds immediately, flagged. The single
  most important change in this document.
- Return reason codes per line (mandatory, coded; "defect" subset routes to
  vendor chargeback).
- RMA number + return policy enforcement (days since delivery, law tag,
  protector purchased).
- Restocking fee as a setting defaulting to 0.
- Refund controls: force-original-tender setting · daily cash cap per customer ·
  refund ≤ paid per tender.
- Return-without-original path + permission.
- **As-is piece-level identity** (reference id for as-is only): condition,
  price (permission-gated), reason (restricted subset), storage location,
  photos, age report (>60 days), max discount off original.
- **Scrap is a write-off**: permissioned, reason-coded, valued at cost, on a
  shrink/write-off register the owner reads weekly. Vendor return needs an R/A
  number, chargeback amount, open-vendor-credit balance to chase.
- Store credit limits: issuance permission · max without approval ·
  non-transferable · no cash-out (or permissioned) · same-session-customer
  block · liability-by-age report.
- Price adjustment: dollar cap, permission, period-close block, commission
  recalculation decision.
- Commission clawback on returns.
- Exchange: separate salespeople on portions, split-exchange, net settlement for
  downgrades/upgrades.

**Standing alerts:** returns by the same associate who sold · same-day-as-sale
returns · returns with no delivery record · per-associate return rate ranked.

## STORIS routines referenced

Enter a Sales Order · Enter a Return · Enter an Exchange · Adjust Dollars on a
Completed Order · Enter a Stock Adjustment (Quantity, Transfer, As-Is Transfer,
Bin to Bin, Move To As-Is, Move From As-Is, As-Is Status, Write Off, Vendor
Chargeback tabs) · Enter a Transfer · Re-assign a Sales Reservation · Logistical
Scheduling · Logistical Route Settings · Route Capacity Control Settings · Route
Capacity Settings · Individual Zip Codes · Build a Delivery/Service/Transfer
Manifest · Complete the Delivery Manifest Process · Complete the Transfer
Manifest Process · Receive a Purchase Order · Purchase Order Creation from Order
Entry · Purchase Statuses · Reason Code Settings · Security Override Screen ·
Create a User/Group Actions — Sales / Logistics / Receivables / Payables /
System Security · Point of Sale Control Settings · Accounts Receivable Control
Settings · Inventory Control Settings · Automatic Stock Release Overview ·
Balance a Cash Drawer · Balance Approval by Manager · Maintain Customer Deposits
(support.storis.com/helpRevisions/StorisWebHelp98/)
