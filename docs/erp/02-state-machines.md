# State Machines, Statuses & Code Domains

Every enum below is either fully documented `[DOC]`, partially documented `[PARTIAL]` (the docs show
some values and imply others — do **not** treat as complete), or ours to define `[DECIDE]`.

---

## 1. Order type & conversions `[PARTIAL]`

Order entry offers three types at creation:

```
SALES_ORDER   LAYAWAY   QUOTE
```

Returns, exchanges, quick sales, and shopping carts are handled by sibling programs and behave as
additional types. The docs never publish a canonical list or code values — one report describes
order type as "either regular sale or exchange". `[DECIDE]` Define the full set explicitly before
phase 1:

```
SALES_ORDER | LAYAWAY | QUOTE | RETURN | EXCHANGE | QUICK_SALE | CART
```

**Documented conversions:**

```
QUOTE ──► LAYAWAY
QUOTE ──► SALES_ORDER
SALES_ORDER ──► LAYAWAY
SALES_ORDER ──► QUOTE
LAYAWAY ──X► QUOTE        (prohibited)
CART ──► SALES_ORDER
```

Conversion prompts for confirmation and may require a reason code. `[DOC]` Conversion re-evaluates
reservation: a non-reserving quote becoming a sales order, or a quote becoming a layaway with
layaway-filling enabled, triggers a reservation attempt that can fail the conversion.

**Type-specific restrictions `[DOC]`**

| Rule | QUOTE | LAYAWAY |
|---|---|---|
| As-is products | prohibited | prohibited |
| Kits | prohibited | prohibited |
| Obsolete special-order items | prohibited | — |
| Reserve merchandise | cannot | must reserve in full to carry special orders, and requires **both** the layaway-filling and special-order-layaway settings |
| Accept payments | cannot | can |
| Fulfillment status `SCH` | cannot use | — |

---

## 2. Fulfillment method `[DOC]`

```
DELIVERY   PICKUP   TAKE_WITH   DIRECT_SHIP
```

Cycling order in the UI is fixed: Delivery → Customer Pickup → Direct Ship → Take With.

**Method transitions, existing lines vs new lines `[DOC]`**

```
DELIVERY ◄──► PICKUP                any line
DELIVERY ──► TAKE_WITH              any line
PICKUP   ──► TAKE_WITH              any line
TAKE_WITH ──► DELIVERY | PICKUP     NEW LINES ONLY
```

**Cardinality per open order `[DOC]`**

- Multiple fulfillments per method: allowed (gated by a permission)
- Multiple on the same date, same method, same deliver-to: allowed
- Exactly **one** `CWC` and **one** `ASAP` per method — even alongside dated `SCH`/`EST` ones
- Exactly **one** `TAKE_WITH` per open order
- `DIRECT_SHIP` fulfillments cannot be created directly; they are derived from direct-ship lines and
  keyed by vendor + PO delivery date + deliver-to address

## 3. Fulfillment status `[DOC]`

```
SCH   Scheduled            — a firm date
EST   Estimated            — a date, not committed
ASAP  As Soon As Possible  — no date
CWC   Customer Will Call   — no date
```

- `TAKE_WITH` is always `SCH`
- `DIRECT_SHIP` is always ASAP-equivalent; status is not applicable or editable
- `QUOTE` cannot use `SCH`
- Changing status to `SCH` while a balance is due requires a permission
- `ASAP` and `CWC` fulfillments have **no fulfillment date** (unless direct ship), so they drop out
  of any view filtered by a fulfillment-date range — this is a real operational trap; see `09`

**Status after partial completion `[DOC]`**

```
single fulfillment date, no reschedule    → keep date, status becomes EST
single date, rescheduled                  → new date, status stays SCH
multiple dates, no reschedule             → remainder becomes unscheduled
ATP active, no reschedule date given      → use the furthest ATP date across lines
pickups                                   → use the pickup initial-default-status setting,
                                            except if that is SCH, in which case EST
```

## 4. Line status flags `[DOC]`

Not a state machine — a **set**. Any combination may be present.

```
A  As-is
C  Linked to a customer-own-merchandise order
H  Line on hold (held qty never ships)
L  Line-item comments exist
P  Linked to a purchase order
S  Linked to an open service order
T  Linked to a transfer
U  Unscheduled
W  Linked warranty
```

## 5. Completion `[DOC]`

Per fulfillment, not per order.

```
                    ┌──────────────────────────────────────────┐
OPEN ──[gate]──► RELEASABLE ──[complete+save]──► TENDERED ──► DATED ──► DETAILED ──► INVOICED
                                                                            │
                                                                    per-line exceptions
                                                                            ▼
                                                        COMPLETE / NOT_COMPLETE per line
```

**The gate — all must pass before a fulfillment is releasable:**

1. A scheduled delivery/pickup date exists on the fulfillment
2. Merchandise is reserved to the order
3. No credit holds exist on the order
4. A delivery/pickup ticket has been printed, **or** a pick list printed and a pack list processed

Additional gates on the Complete control itself: the "allow completion after print ticket" setting
active; at least one completion type available; for delivery, the assign-specific-pieces event set
to ticket-print; permission for the order type. The control is **inactive** for WMS ship-from
locations and once the back-order counter hits 52.

**Blockers `[DOC]`**

- A direct-ship fulfillment containing a linked PO on hold cannot complete. On split-ticket orders,
  **no** direct-ship item can complete if any one of them has a PO on hold.
- Partial direct-ship completion requires zeroing the ship quantity on undelivered lines first.
- Completing the direct-ship portion creates an AP bill for the PO and closes it.

**Effects `[DOC]`**

- An invoice is created for the completed fulfillment, containing only that fulfillment's data
- Completed lines stay reserved; all other lines are unreserved
- Every other fulfillment **moves with** the invoice so the order's detail stays together
- Fully completed fulfillments leave the open order; partial completions leave undelivered lines
  linked in the open order
- Back orders suffix the root invoice number `A`–`Z` then `a`–`z`; warn at the 48th, hard stop at
  the 52nd — past that the order must be deleted and re-entered

**Exception line status `[DOC]`** `COMPLETE` / `NOT_COMPLETE`, plus a notes classification whose
values are: Service, Kit Master, Released, Labor, Charges, As-Is, **Confirm** (serial-tracked
outbound), **Required** (serial-tracked inbound with no serial number), As-Is Reason Code.

`[DOC]` **Destructive re-selection.** Re-selecting Complete on a previously not-complete line
destroys return-to-storage-location, not-completed comment, add-to-as-is reason code, and
release-piece-not-completed — and re-selecting Not Complete does **not** restore them. Reproduce
this only with an explicit confirmation prompt; `[DECIDE]` we should probably preserve the data
instead, which is a deliberate improvement.

## 6. Credit hold codes `[PARTIAL]`

```
C6  Decision pending — must be reviewed by the credit department. Persists until the credit
    request is approved and a credit limit is established.
F5  Driver-license verification failed
S1  Signature required — cleared by capturing the signature and saving
F3  Financing pre-qualify — provider needs more customer data, collected outside the system
```

The full code set is defined in a separate STORIS list not covered here. `[DECIDE]` Define ours
explicitly; do not assume these four are exhaustive.

## 7. Finance application `[DOC]`

```
DRAFT ──[submit]──► XMIT ──► APPROVED ──► (order authorization)
  │                   │
  │                   ├──► DECLINED
  │                   └──► PRE_QUALIFY ──[external web service]──► APPROVED
  └──[close]──► DELETED
```

Filter/grid statuses exposed to operators: `All` / `Open` / `Complete`. `Submit` sets `XMIT`;
`Close` sets `Deleted`.

**Authorization response class `[DOC]`**: approved (returns an authorization number) / declined /
`pre-qualify` (order goes on `F3` hold).

**Re-authorization triggers `[DOC]`** — monetary changes to merchandise, discounts, sales tax,
delivery, installation, or fees on an approved installment/RTO order:

```
no partial completions   → new authorization request
partial completions      → authorization adjustment request (delta of original vs updated)
```

## 8. Card authorization response action `[DOC]`

The authorization display screen appears **only on decline**.

```
A  Approve payment
D  Decline payment
M  Manual authorization
R  Retry authorization
```

Two exceptions: a failed **debit void** shows only Retry or Decline, and **Retry must be chosen** —
Decline traps the operator in the process. `M` is unavailable when declining a **swiped
pre-authorization**.

`[DOC]` CVV bypass codes: `BPD` deliberately bypassed, `ILL` illegible on card, `NAV` cardholder
states data not available.

## 9. Settlement `[DOC]`

```
POSTED (open batch) ──► TRANSMITTED ──► SETTLED (moved to history)
                             │
                             └──► ERROR ──► ACCEPTED   (provider took it, will fund)
                                       └──► RESUBMIT   (goes into the next batch)
```

Transport `TCP_MANUAL` (merchant number required) / `FTP` (merchant number inactive, **Resubmit is
the only allowed action**). Settlement method one-step (immediate response, marked settled, report
prints) / two-step (batch transmitted, provider processes overnight, response file retrieved next
day).

`[DOC]` **Blast radius rule:** one settlement error stops all other orders **at that location**
from settling until the error flag clears. Reproducing this faithfully is probably wrong;
`[DECIDE]` we should isolate per-item failures. Flag before phase 8.

**Settlement timing by plan type `[DOC]`**: revolving settles at end of day or manually;
installment and RTO settle **on transaction completion**, and partial completion sends partial
settlements; in-store finance payments settle at the moment the payment is applied.

## 10. Cash drawer `[DOC]`

```
OPEN* ──► BALANCED ───────────────────────────► RECONCILED ──► PURGED
  └────► SUSPENDED (out of balance)
            └──[manager approval]──► BALANCED
```

`*` The `OPEN` state is `[DECIDE]`, not `[DOC]` — drawer opening is absent from the source material
(see `13` #18). Everything from `BALANCED` onward is documented.

Grouping is by **drawer**, **cashier**, or **store** (one config choice, system-wide). Blind
balancing: the operator enters totals per payment type without seeing system totals; each line is
flagged Balanced yes/no. Out-of-balance drawers require manager approval; if the cash difference
exceeds the configured tolerance the system prompts to post the overage/shortage. Reconciliation is
against the bank statement, after deposit, and sets status `R`. Purge is terminal.

## 11. Up System (salesperson rotation) `[DOC]`

```
AVAILABLE (ordered queue) ──[takes an up]──► ASSIGNED ──[closes activity]──► AVAILABLE
        └──────────────────────────────────► LEFT_FOR_DAY
```

Day-end is **separate** from the accounting day-end. A configurable **day-end offset** in hours
defines when the logical day rolls (offset 4: 11pm on the 13th and 3am on the 14th both belong to
the 13th).

**Auto cleanup `[DOC]`** fires when, on a new day, a salesperson first moves AVAILABLE→ASSIGNED or
the first salesperson checks in *and* open activities exist from a prior day. It closes all assigned
activities with a configured action code, the prior day's date, and a close time of 11:59pm + offset;
and sets everyone in Available to LEFT_FOR_DAY. It does **not** fire on ASSIGNED→AVAILABLE or
AVAILABLE→LEFT_FOR_DAY. Auto-cleanup dates and times are not editable, and all manual edits must
happen before day-end.

## 12. Lead `[DOC]`

```
ACTIVE ──[action taken = DELETE + reason]──► INACTIVE
```

One active lead per customer/contact, hard rule. Every action requires a comment. Activity classes
valid for **new** leads: `A`, `O`, `N`; for **existing** leads: `F`, `D`, `M`, `N`. Next-update date
must be ≥ today and ≤ today + a configured maximum.

## 12b. Payment type `[DOC]`

```
CASH | CHECK | CREDIT_CARD | DEBIT | GIFT_CERT | REVOLVING | INSTALLMENT | RTO | PETTY_CASH
```

`PETTY_CASH` exists only inside cash balancing. `[DECIDE]` The docs also speak of a "financing payment
plan" payment type; resolve whether that is a distinct value or the umbrella label for
`REVOLVING` / `INSTALLMENT` / `RTO`. Each concrete type carries its own sub-form (see `05`).

## 13. Small domains `[DOC]`

| Domain | Values |
|---|---|
| Product purchase status | `A` Active, `D` Dropped, `T` Discontinued (plus a Defective availability status that cannot be ordered) |
| Tax type | National, State, Local (applied in that sort order) |
| Exchange display | Sale, Return, Net |
| Insurance on a financed deposit | None, Single, Joint |
| Finance type | Revolving, Installment, RTO |
| Date codes | `CUS` custom, `TDAY`, `YDAY`, `CPTD`, `LPTD`, `CYTD`, `LYTD` |
| ATP source | Reserved Stock, Assigned Pieces, Unlinked Shipped PO, Linked Shipped PO |
| ATP days early/late sentinel | negative = early, positive = late; the order-level value is the max signed value across lines; `999` = no ATP / unscheduled, `0` = reserved stock or assigned pieces |
| Transfer type | Stock, As-Is, Floor Sample, Move to As-Is, Auto |
| Commission type flags | `A` adjustment, `R` return, `S` split, `J` commission adjustment — **combinable** |
| Commission error flags | `C` no cost found, `D` salesperson not on original, `E` setup error, `O` original transaction not found, `M` margin calc error, `P` no price found, `X` subroutine error |
| Filter selection (financed balances) | `0` none, `1` customer code, `2` name, `3` reference, `4` account number |
| Exchange return-portion suffix | `e` appended to the exchange order number |

**Not enumerated anywhere in the source docs** — all `[DECIDE]`: contact status, handling method, substitution code,
product type, commission category, reason-code usage types beyond layaway/quote conversion, and the
line-level "purchase status" domain (`[INFER]` same A/D/T domain as product purchase status).
