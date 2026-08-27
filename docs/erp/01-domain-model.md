# Domain Model

Field lists below are the *documented* STORIS surface area. Treat them as the target end-state, not
as a phase-1 migration. Where a field exists only to serve a STORIS internal (RF picking, WMS
imports, EDI 214) it is marked `[LEGACY]` — carry it only if the cutover needs it.

## Naming

Use the STORIS operator vocabulary in the UI and in domain code. The staff cutting over already
think in these words and a rename costs retraining: **fulfillment** (not shipment), **completion**
(not fulfillment-done), **written** vs **delivered/completed** sales, **tender** / **payment type**,
**deposit**, **up** (a sales opportunity), **spiff**, **ATP** (available to promise), **ATC**
(available to customer).

---

## Customer

| Field | Notes |
|---|---|
| `customer_code` | Human-facing identifier; searchable |
| `primary_name`, `alternate_name`, `relationship` | `[DOC]` combined length of all name elements ≤ **50 chars** |
| `home_phone`, `cell_phone`, `work_phone`, `extension` | |
| `primary_email` | |
| billing address: `address_1`, `address_2`, `city`, `state`, `zip` | 9-digit zips are meaningful for routing (see `03`) |
| `deliver_to` addresses | Zero or more; one may be primary |
| `marketing_code_1`, `marketing_code_2` | Each independently Off / Optional / Mandatory by config |
| `price_category` | Feeds pricing hierarchy step 2 (`04`) |
| `charge_sales_tax`, `charge_national_tax` | Defaults for new orders |
| `tax_id`, `tax_id_expiration_date` | `[DOC]` exemption applies only when expiration date is **after** the order's written date |
| `due_date_day_of_month` | Day the open balance becomes due |
| `credit_limit`, `available_credit`, `credit_hold_code` | See `02` for hold codes |
| `reward_points`, `reward_balance` | Only surfaced when the rewards program is active |
| `ssn` | `[DOC]` stored encrypted; last four displayable; full value requires an explicit permission. `[DECIDE]` whether we store it at all — see `10` |
| `membership_plan` | Removing a plan from an open order removes its discounts |

**Balance buckets** (STORIS surfaces these as one account-summary view; model them as derived
queries, not stored columns): last activity date, lifetime sales, open orders total, **deposit
liability**, open item (amount due), revolving balance, installment pending.

## Store / Location

Selling location, fulfillment location, stock location, and ship-from location are **four distinct
roles** that may point at the same physical location. Do not collapse them.

Location-level settings that change behaviour: automated vs manual order numbering, return-pickup
default storage location, "use warehouse inventory" (reorders the price hierarchy), EMV enablement,
finance-application-manager flag, WMS active.

Districts group locations. `[DOC]` District and selling-location filters are mutually exclusive in
the operational views. Regional processing restricts which districts/locations a user sees and
forces district-first sorting in reports.

---

## Order (header)

The single aggregate root for a transaction.

| Field | Notes |
|---|---|
| `order_number` | Auto-assigned or manual per location config |
| `order_type` | See `02` — the documented set is incomplete; treat as `[DECIDE]` |
| `written_date` | `[DOC]` no future dates; no closed accounting period; backdating gated by permission |
| `store_id` | Selling location |
| `salespeople[]` | Ordered; each with `commission_percent`; see `08` |
| `default_fulfillment_method` | Header-level default; lines carry their own |
| `customer_id` + snapshot of billing name/phones/email/address | Snapshot, not a live join — the order must print as it was written |
| `marketing_code_1`, `marketing_code_2`, `order_source` | Order source may be mandatory by config |
| `coupon_id`, `subtotal_discount_code`, `subtotal_discount_amount`, `discount_percent` | |
| `net_total_override` + reason | `[DOC]` mutually exclusive with discounts/coupons |
| `credit_hold_codes[]` | Multiple possible |
| `signature_required`, `signature_captured_at` | |
| `comments`: order, additional, mandatory, audit log, exception | Distinct comment streams, all append-only |
| `attachments[]`, `custom_order_information`, `trade_designer_information` | |
| `backorder_counter` | `[DOC]` max **52**; warn at 48 |
| `linked_order_id` | Return↔original, exchange chain |

**Derived totals** (recompute, never trust stored): merchandise subtotal, protection plans,
discounts, charges & fees, sales tax, net total, payments, amount financed, balance due, order
outstanding balance.

`[DOC]` `balance_due = net_total − (deposits + financed amounts)`. `order_outstanding_balance`
covers only the partially-completed portion, which is a different number — keep both.

## Fulfillment

**The scheduling and completion unit.** Child of order, parent of lines.

| Field | Notes |
|---|---|
| `method` | `DELIVERY` / `PICKUP` / `TAKE_WITH` / `DIRECT_SHIP` |
| `status` | `SCH` / `EST` / `ASAP` / `CWC` — see `02` |
| `fulfillment_date`, `requested_date`, `time_window` | `[DOC]` requested date required when status is ASAP or CWC and config demands it |
| `earliest_available_date` | |
| `fulfillment_location_id` | Defaults from method |
| `handling_method` | Override gated by permission; domain not enumerated in docs |
| `route_code`, `stop_time` | |
| `deliver_to`: name, three phones, extension, email, address 1/2, city, state, zip | Independent of billing |
| `instructions_this_fulfillment_only`, `print_delivery_instructions` | |
| `ticket_printed_at`, `print_ticket_requested` | Gate on completion |
| `on_manifest` | `[DOC]` replaces the Complete control once manifested |
| `complete` → completion event | See `03` |
| per-fulfillment totals | merchandise subtotal, discounts, delivery charge (+ override flag + reason), installation charge, misc fees, sales tax, net total — **all calculated per fulfillment** |

`[DOC]` A fulfillment must have at least one line. Empty ones are removed on save.

## OrderLine

| Group | Fields |
|---|---|
| Identity | `line_reference` (line number), `fulfillment_id`, `written_date` |
| Product | product code, description, second description, vendor, brand, vendor model number, product group, product type, unit of measure, **unit conversion** (broken-unit multiplier), shipping weight, serial-tracked flag |
| Quantity | ordered, available, reserved, assigned, **held**, ship qty, open-PO qty, reserved-transfer qty, scheduled / total scheduled / unscheduled |
| Price | unit price, extended price, regular selling price, suggested retail, extended suggested retail |
| Discount | discount codes[] (**multiple per line**), discount amount, coupon code |
| Fulfillment | method / line type, stock location, alternate stock location resolution, PO number, ship date, acknowledgement date, tracking number, direct-ship tracking id `[LEGACY]` |
| Flags | as-is (+ reason code), special order (+ info), taxable, national tax exempt + authorization number (≤20 alnum), commissionable + commission category |
| Dates | fulfillment date, available-to-promise (ATP), available-to-customer (ATC), fill days |
| Status | status flag set — see `02` |
| Serial / storage | serial or reference number(s), storage location, pick-from, return-to |
| Linkage | warranty linkage (order + line ref), protection plan code, linked PO, linked transfer, linked service order, kit master |
| Other | room, prep codes, line comments, substitution code + substitute product, purchase status, reason code (returns), pickup date (returns) |

`[DOC]` A line's `held` quantity never ships — 5 ordered with 3 held means at most 2 can ship.

**Room** is created on the fly, scoped to one order, survives line deletion, dies with the order
unless the order partially completed.

---

## Pricing & discount objects

`PriceRule` set (see `04` for the hierarchy), `PriceSpiffCommissionTable` (price ranges × price
category, also carries spiff and commission rates), `CustomerPriceMatrix`, `MarkdownPrice`,
`DiscountCode` (line-level and subtotal-level, with minimum-purchase thresholds and a
"discountable" product gate), `Coupon` (single-redemption flag), `ProtectionPlan`,
`MiscellaneousFee`, `DeliveryChargeRule`, `InstallationChargeRule`.

## Tax

`TaxJurisdiction` (code, type `NATIONAL` / `STATE` / `LOCAL`), `OrderTaxLine`
(jurisdiction × fulfillment, percent, amount). `[DOC]` Applied taxes sort national → state → local.
Taxable subtotal = merchandise subtotal + taxable charges. Amount and jurisdiction are editable only
from the completed-order adjustment path.

## Tender & deposits

`Payment` — `payment_type` (see `02` §12b for the authoritative enum), amount, date, description, reference number
(masked/encrypted), authorization number, terminal id, `is_new_this_session`, entered_by,
`requires_authorization`, `authorized_at`.

`Deposit` — a **liability** linked to the order, not a reduction of an amount owed. It survives
into completion, can be moved to another open order, put on account, or refunded through AP.

`GiftCertificate` — number, balance, purged flag.

`CardData` — `[DOC]` all but last four encrypted; CVV and card-present flag are **never persisted to
the order record**; leading-`X` entries rejected; full display requires a permission plus a
re-authentication prompt. `[DECIDE]` We should tokenize via the processor rather than store PANs at
all — STORIS' encryption-at-rest model predates modern tokenization and copying it inherits PCI
scope we do not want. Flag this before phase 4.

## Financing

`FinanceProvider` (transport `TCP_MANUAL` / `FTP`, settlement method one-step / two-step, merchant
numbers, supported finance types, requires-account-number flag, returned service URL).
`FinanceApplication` (store, customer, salesperson — mandatory, provider or `QUEUE`, tier, status,
requested amount, approved amount, create date/time, last submission).
`FinancePlan` (`REVOLVING` / `INSTALLMENT` / `RTO`; plan code or contract number, MMP, max-deposit
percent, max-percent-as-deposit).
`FinanceAuthorization` (order, plan, amount, authorization number, response class).
`FinancedBalance` / `FinanceReceivable` (adjustments, account number, authorization number, dispute
status, batch).

## Settlement & cash

`SettlementBatch` (provider, merchant, batch number, status `POSTED` / `TRANSMITTED` / `SETTLED` /
`ERROR` — see `02` §9),
`SettlementItem` (order, plan, account number, amount, approval number, action
`NO_ACTION`/`ACCEPTED`/`RESUBMIT`).
`CashDrawerSession` (reference number, group-by drawer/cashier/store, date, start/end time,
drawer total, status), `CashBalanceLine` (payment type, operator total, system total, balanced
yes/no), `CashDrawerReconciliation` (bank total, over/short, reconciled flag).
`PettyCashDisbursement`.

## Completion output

`Invoice` (the completed order) — carries the completed fulfillment's data only, but the *whole*
order's remaining fulfillments move with it so detail stays together. Back-order chain suffixes the
root invoice number `A`–`Z` then `a`–`z`, **52 max**.

## Salesperson, Up System, CRM

`Salesperson` (code, location, district, login password for second-login mode),
`UpSession` (day, offset-adjusted), `UpAssignment` (salesperson, status
`AVAILABLE`/`ASSIGNED`/`LEFT_FOR_DAY`, queue position, action code, opened/closed timestamps),
`UpArchive`.
`Lead` / `Contact` (customer id or contact id, name, email, phones, address, preferred contact
method, mailing-list flag, birthdate, due date; salesperson, location, origin, referral code,
marketing code, merchandise of interest[], brands[], closing probability),
`LeadActivity` (action taken, action to take, next update date, comment — mandatory per action,
timestamped with initials).
`CommissionRecord` (salesperson, order, line, product, unit/total price, commission percent,
commission dollars, type flags, error flags — see `08`).

## Cross-cutting

`AuditComment` — append-only, per order, written automatically by rules that move money
(delivery-charge relocation, tax-exempt override, price-variance override).
`Attachment`, `PrintJob` (tickets, receipts, documents), `ScheduledProcess` (the operational views
run on demand *or* scheduled — see `09`), `Permission` / `PermissionOverride` (see `10`).
