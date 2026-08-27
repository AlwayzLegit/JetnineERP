# Acceptance Tests

One named scenario per rule that can lose money or mis-schedule a delivery. A phase is not done until
its block passes. Write these as executable tests, not as a QA checklist.

## Phase 0 — Foundations

```
FND-01  no float appears in any money calculation path (static assertion or type-level guarantee)
FND-02  quantity is decimal and round-trips 0.125 without loss
FND-03  every permission override writes an audit comment with actor, target, and before/after
FND-04  an override never elevates the session beyond the single action
FND-05  no financial row can be deleted; reversals are new rows
FND-06  permission precedence resolves per the rule chosen in 13 #12, uniformly across areas
FND-07  data scope (regional processing) applies as a query predicate, not a UI filter —
        an out-of-scope record is unreachable by direct id as well as by search
```

`FND-01`–`FND-05` are restated in the cross-cutting block at the end of this file; they live here too
because phase 1 must not start until they hold.

## Phase 1 — Order & fulfillment core

```
ORD-01  written date in the future is rejected
ORD-02  written date in a closed period is rejected; permitted with the backdate permission
ORD-03  combined customer name elements > 50 chars is rejected
ORD-04  delivery fulfillment without a phone number cannot save (when confirm-address is on)
ORD-05  polymorphic customer lookup: numeric → code, "@" → email, 10 digits → phone, else surname
ORD-06  quote cannot use fulfillment status SCH
ORD-07  as-is product cannot be added to a layaway or a quote
ORD-08  layaway → quote conversion is rejected; quote → layaway and quote → order succeed
ORD-09  quote → order conversion re-evaluates reservation and fails when it cannot reserve
ORD-10  exactly one TAKE_WITH per order; a second is rejected
ORD-11  exactly one ASAP and one CWC per method, even alongside dated fulfillments
ORD-12  TAKE_WITH → DELIVERY is allowed for a new line and rejected for an existing line
ORD-13  a fulfillment with no lines is removed on save
ORD-14  held quantity never ships: 5 ordered / 3 held → max 2 shippable
ORD-15  line flags render as a set (A,C,H,L,P,S,T,U,W), not a single status
ORD-16  a fractional selling unit displays as 0.125, not 0 and not 1
ORD-17  backorder counter warns at 48, hard-stops at 52
ORD-18  route full → override prompt; permission denied → line added unscheduled
ORD-19  route capacity change that REDUCES an already-over capacity produces no warning
ORD-20  9-digit zip route selection falls back 9-digit → 5-digit → all
ORD-21  changing stock location deletes and rebuilds transfers not in progress
ORD-22  a line whose auto-transfer is manifested rejects quantity/location/delete changes
ORD-23  lines in RF picking status freeze delivery status, route, and date
ORD-24  a quote cannot accept a payment or carry a deposit
ORD-25  setting fulfillment status to SCH with a balance due requires the permission; denied without it
```

## Phase 2 — Pricing, discounts, tax

```
PRC-01  hierarchy stops at the first price found — assert provenance on every level 1-7
PRC-02  twilight as-is price beats other as-is pricing
PRC-03  price category match beats highest-in-table; no match → highest, unless a lower promo exists
PRC-04  "use warehouse inventory" reorders levels 4 and 5
PRC-05  kit source-of-price=Component overrides the location selling price
PRC-06  customer matrix wins when lower — EXCEPT over the price/spiff/commission table (level 2)
PRC-07  no hierarchy price and no matrix → NO price defaults (not zero)
PRC-08  markdown loses to a lower default selling price
PRC-09  overriding unit price inactivates the discount code field
PRC-10  applying a discount then changing unit price warns and REMOVES the discount code
PRC-11  net-total adjustment clears discounts and coupons and resets the coupon redemption flag
PRC-12  net-total adjustment is unavailable with >1 fulfillment for any method
PRC-13  price variance: limits cascade product → location → POS control; all blank = no check
PRC-14  variance breach triggers alert / reason / comment per configuration
PRC-15  dropping below a discount minimum requires the override permission
TAX-01  tax is calculated per fulfillment, not per order
TAX-02  taxable subtotal includes taxable charges, not merchandise only
TAX-03  applied tax rows sort national → state → local
TAX-04  exemption applies only when the customer's ID expiration is AFTER the written date
TAX-05  unchecking a defaulted-taxable value needs the override — unless the customer is exempt
TAX-06  checking a defaulted-non-taxable value clears tax id and expiration for that order
TAX-07  line tax-exempt authorization number is rejected while taxable is checked
TAX-08  granting a line exemption writes product + auth number + override to order comments
TAX-09  toggling either charge flag recalculates all tax rows
TAX-10  amount and jurisdiction are read-only except from the completed-order adjustment path
CHG-01  installation charge applies to delivery fulfillments only
CHG-02  partial completion charges installation on completed lines only; remainder stays open
CHG-03  charge overrides do NOT transfer when a line moves fulfillment
CHG-04  one-charge-per-order relocation sorts SCH before EST, then earliest time, ASAP/CWC last
CHG-05  charge relocation carries the override flag and reason code, and writes an order comment
CHG-06  minimum delivery purchase failure requires the override permission
```

## Phase 3 — Tender & deposits

```
PAY-01  gift certificate tender is rejected on a return and on an exchange
PAY-02  overpayment rejected unless the overpayment setting is on
PAY-03  cash refund above the daily maximum BLOCKS THE SAVE without the override permission
PAY-04  a payment type the user lacks access to yields the access error and no row
PAY-05  authorized payment forces a save before any other action; delete requires save-then-reaccess
PAY-06  autopay validates payment >= sum of standard MMPs, else returns to payment summary
PAY-07  only one refund payment type per session
PAY-08  negative FR payment without a matching authorization is rejected unless the setting allows
PAY-09  partial card payment rejected on a take-with transaction
PAY-10  payment against an installment/RTO plan is rejected on the deposit, receivables and
        gift-card paths, and accepted only on the in-store finance path
DEP-01  a deposit is a liability row, not a reduction of the receivable
DEP-02  deposits become read-only once the order is exited
DEP-03  additional deposit with a fulfillment on a manifest requires the setting
DEP-04  pre-auth deposit inactivates the financing payment type (documented direction only)
DEP-05  financed deposit with no authorization number puts the order on credit hold
DEP-06  financed deposit is capped at the payment type's max deposit percent of the correct base
DEP-07  installment and RTO cannot be used as a deposit at all
DEP-08  finance deposit refund blocked when any unapproved deposit exists on the order
MIN-01  total minimum = GREATER of whole-order minimum and line-type minimum
MIN-02  amount required = total required − (paid + financed); floors at zero
MIN-03  quantity shown is ALL quantity, ignoring dates and back-order state
MIN-04  include-estimated-tax folds tax into extension and payment required
MIN-05  delivery and installation appear as separate grid lines
MIN-06  exchange: delivery-line requirement reduced by return lines PRO RATA to delivery share
MIN-07  completed lines drop off the display
MIN-08  called from the COD worksheet, only the back-ordered remainder shows
```

## Phase 4 — Card processing

```
CRD-01  card number with a leading "X" is rejected
CRD-02  only the last four are retained/displayable
CRD-03  CVV and card-present are never persisted to the order
CRD-04  verify-card-number mismatch blocks entry
CRD-05  CVV accepts BPD / ILL / NAV as valid entries
CRD-06  a swiped entry cannot be edited in place
CRD-07  terminal is mandatory for card tenders when an EMV module is active
CRD-08  decline surfaces the authorization display with actions A/D/M/R
CRD-09  failed debit void offers only Retry and Decline, and Decline does not exit the process
CRD-10  declined swiped pre-authorization does not offer Manual authorization
CRD-11  unmasking requires the permission AND a second-user credential, and expires
CRD-12  auth and capture are separate persisted events with processor references
CRD-13  an abandoned authorization is discoverable and resolvable
CRD-14  original payments display for refund only when validate-original-payment-on-refunds or EMV
        is in use, and under none of the five documented suppression conditions
```

## Phase 5 — Completion

```
CMP-01  gate: no scheduled date → not releasable
CMP-02  gate: merchandise not reserved → not releasable
CMP-03  gate: any credit hold → not releasable
CMP-04  gate: no ticket printed and no pick/pack path → not releasable
CMP-05  Complete is checked-and-inactive for TAKE_WITH
CMP-06  Complete is hidden and replaced by On-Manifest for a manifested fulfillment
CMP-07a Complete is inactive once the backorder counter reaches 52
CMP-07b at a WMS ship-from location Complete is inactive without the WMS-inventory
        permission and active with it  (see 29 §1 — supersedes the earlier "always inactive")
CMP-08  direct ship with a linked PO on hold cannot complete; on split tickets, none can
CMP-09  partial direct-ship completion requires ship quantity zeroed on undelivered lines
CMP-10  completing the direct-ship portion creates an AP bill and closes the PO
CMP-11  invoice contains only the completed fulfillment's data
CMP-12  all other fulfillments move with the invoice, unreserved
CMP-13  partial completion leaves undelivered lines linked in the open order
CMP-14  back-order suffix sequence A-Z then a-z, 52 max
CMP-15  single date + no reschedule → keep date, status EST
CMP-16  single date + reschedule → new date, status SCH
CMP-17  multiple dates + no reschedule → remainder unscheduled
CMP-18  ATP active + no reschedule date → furthest ATP date across lines
CMP-19  pickup partial completion uses the pickup default status, EST if that default is SCH
CMP-20  whole-order Not Complete flips every line and defaults return-to-storage for all
CMP-21  per-piece Not Complete defaults return-to-storage from the manifest setting
CMP-22  re-selecting Complete on a not-complete line warns before discarding exception data
CMP-23  exchange: marking the line not complete completes the SALE portion only
CMP-24  transfer merchandise not received via WMS import cannot complete; back order created
```

## Phase 6 — Returns & exchanges

```
RET-01  return links to the original order and carries a reason code and pickup date per line
RET-02  exchange creates both halves and the return half is addressable with the "e" suffix
RET-03  commission on a return dates to the ORIGINAL invoice's written date
RET-04  commission dates to the transaction's own written date when the original is off file
RET-05  installment/RTO exchange requires the original to have been so financed
RET-06  split exchange is unavailable for installment/RTO
```

## Phase 7 — Financing

```
FIN-01  salesperson is mandatory on an application and follows the documented default cascade
FIN-02  an existing application for the provider overwrites an entered salesperson code
FIN-03  kiosk mode exposes only Enter and Exit, and Exit requires a staff override
FIN-04  provider decides the qualifying finance type; an order cannot use another type
FIN-05  pre-qualify response puts the order on F3 hold
FIN-06  Provider Info opens only when the provider returned a URL
FIN-07  total approved amount sums credit limits across approved applications
FIN-08  monetary change on an authorized order with no partials → new authorization request
FIN-09  monetary change with partials → adjustment request carrying the delta
FIN-10  an authorized order whose total changed cannot save without re-auth or explicit override
FIN-11  RTO forces non-taxable and strips all tax
FIN-12  RTO requires the full order amount financed
FIN-13  RTO is rejected when any deposit exists
FIN-14  additional revolving payment requires an active plan with a balance and no MMP due
FIN-15  additional installment payment requires an active contract with no payment due
FIN-16  financed-balance adjustment date rejects future dates and closed months
FIN-17  a multi-transaction adjustment session accepts only one payment type
FIN-18  only open batches are adjustable
```

## Phase 8 — Settlement & cash

```
STL-01  transactions post to the current un-transmitted batch throughout the day
STL-02  one-step: transmit → response → settled → moved to history → report
STL-03  two-step: batch transmitted, nothing settles until the response file is retrieved
STL-04  installment/RTO settle on completion; partial completion sends a partial settlement
STL-05  FTP provider permits only RESUBMIT as an error action
STL-06  TCP/manual requires a merchant number; FTP inactivates it
STL-07  bulk accept/resubmit refuses to run with an order-number filter present
STL-08  [DECIDE #8 — do not implement until answered] per-item settlement error isolation
STL-09  documented behaviour until #8 is answered: one item error blocks other items at that location
CSH-01  transactions outside the start/end window are excluded and reported as exceptions
CSH-02  blind balancing never exposes the system total to the counting operator
CSH-03  balanced flag is per payment type, not per drawer
CSH-04  an out-of-balance drawer cannot close without manager approval
CSH-05  manager adjustments post with the drawer's transaction date, not today's
CSH-06  cash difference over tolerance prompts before auto-posting overage/shortage
CSH-07  reconciliation requires a bank total and sets status R
CSH-08  a reconciled-and-purged drawer no longer appears for reconciliation
```

## Phase 9 — Salesperson, Up, CRM, commission

```
UPS-01  the Available pane is an ordered queue; reorder is blocked when the setting is off
UPS-02  day-end offset assigns 11pm/3am correctly to the prior logical day
UPS-03  auto cleanup fires on first AVAILABLE→ASSIGNED and on first check-in, with prior activity
UPS-04  auto cleanup does NOT fire on ASSIGNED→AVAILABLE or AVAILABLE→LEFT_FOR_DAY
UPS-05  cleanup stamps the configured code, prior date, and 23:59 + offset
UPS-06  auto-cleanup timestamps are not editable
UPS-07  at most four product categories; the remainder aggregates to "Other"
UPS-08  exchange counting honours the include-both-portions setting, including the "e" suffix path
CRM-01  one active lead per contact; a second is rejected
CRM-02  every action requires a comment
CRM-03  action-taken lookup is filtered by lead status (A/O/N new; F/D/M/N existing)
CRM-04  next update is >= today and <= today + configured maximum
CRM-05  a salesperson can open an existing lead only if they are the lead's salesperson
CRM-06  blanking salesperson for "all" requires manager or corporate access
CRM-07  closing a lead requires DELETE plus a reason
CRM-08  district manager cannot see leads from salespeople outside their district
COM-01  multiple salespeople with no configured percentages split evenly
COM-02  total commission percent must equal 100% exactly; 99% and 101% both rejected
COM-03  screen edits to a split apply to that order only
COM-04  a commission rate change does not alter existing orders until they are updated
COM-05  the commission/spiff update screen re-applies current settings to an existing order
COM-06  payment adjustment pseudo-lines subtotal separately from merchandise commission
```

## Phase 10 — Views

```
VW-01  district and selling location filters are mutually exclusive
VW-02  at least one fulfillment method and one status are required
VW-03  service orders never appear
VW-04  entering a fulfillment-date start EXCLUDES ASAP/CWC  [DOC]
VW-04b the UI surfaces an exclusion banner when it does  [DECIDE]
VW-05  a multi-date order matches only on its next delivery date
VW-06  ATP days early/late shows the MAXIMUM SIGNED value across lines (-15 & -3 -> -3; -3 & 5 -> 5)
VW-07  ATP back-order quantity is zero when ATP date <= delivery date
VW-08  999 = no ATP or unscheduled; 0 = reserved stock or assigned pieces
VW-09  the lines view queries only orders, exchange sale halves, and layaways
VW-10  hard kit masters and intangibles are excluded even when explicitly selected
VW-11  totalled columns total only the filtered rows
VW-12  scheduled mode: past-days/future-days offsets resolve to the documented window
```

## Cross-cutting, every phase

```
X-01  no float appears in any money calculation path (static assertion or type-level guarantee)
X-02  every permission override writes an audit comment with actor, target, and before/after
X-03  an override never elevates the session beyond the single action
X-04  no financial row is ever deleted; reversals are new rows
X-05  concurrent edits to one order cannot produce two authorizations for one tender
X-06  every [INFER] rule carries a SPEC:INFER comment linking to its spec section
```
