# Order Entry, Fulfillment & Completion

## The four-step wizard `[DOC]`

STORIS' order entry is one program that creates, edits, views, and deletes sales orders, layaways,
and quotes, and converts carts. Its literal step headings:

```
Step 1 — Customer      Step 2 — Merchandise      Step 3 — Fulfillment      Step 4 — Payment
```

Copy the four-step structure. It maps cleanly to the aggregate: header → lines → scheduling →
money, and each step's validation is self-contained.

**Persistent header on all four steps:** order number (auto or manual), a "last order" recall
(hidden on first access, after completion/deletion, and in read-only view), available credit, credit
hold (display-only; released elsewhere), reward points and balance (only when rewards are active).

### Step 1 — Customer

Basic: order type, written date, salesperson(s), default fulfillment method, store.

**Customer lookup is one polymorphic field** `[DOC]` — "Customer Number or Last Name or Email or
Phone Number", resolved by shape:

```
all numeric                              → customer code
contains "@"                             → email
10 digits, no spaces or specials         → phone
anything else                            → last name, "starts with" (configurable)
```

Implement this. It is the single highest-leverage UX detail in the whole program — the counter staff
type one thing.

Then billing information, marketing codes, and an Actions menu (attachments, comments, additional
order detail, terminal assignment, audit log, custom info, misc fees, order source, tax info, trade/
designer info, address update, signature view, print).

### Step 2 — Merchandise

Entry fields: product, qty ordered, qty available, unit price, extended price, discount code,
discount amount, fulfillment method, brand, stock location, PO number, as-is, special order,
serial/reference, room, available-to-customer date, available-to-promise date. Buttons: Add Item,
**Save + Add Another**, Save, Cancel.

Two display modes — list and grid — toggled by the operator, with a configured default. Build both;
the grid is what high-volume writers use.

### Step 3 — Fulfillment

Lines grouped by fulfillment. See `02` for the status/method/cardinality rules. Per fulfillment:
date, earliest available, status, location, method, requested date, time, handling method,
instructions, print-delivery-instructions flag, print ticket, complete; a deliver-to block; and its
own totals. A read-only total-fulfillments counter.

**Fulfillment Selection** `[DOC]` fires when a new line is saved and multiple fulfillments of that
method already exist. It shows a grid of fulfillment description (identical ones disambiguated with
`(2)`, `(3)`…), date, location, status, ticket-printed, route capacity available, new-product ATP
date, ATP days early/late, route code. Double-click adopts an existing fulfillment. **New
Fulfillment** leaves the date unpopulated — deliberately, so route-capacity and available-date
checks defer until a date is entered — and defaults deliver-to from billing or the customer's
primary deliver-to, and location from the method. This window performs **no** route-capacity check.

### Step 4 — Payment

Discounts (coupon, discount code, amount), additional discounts (percent, amount), charges and fees
(delivery, installation, misc, sales tax), protection plans, deposits (payment type, total),
financing (payment type, total financed), signature, totals block, receivables block (order
outstanding balance, customer current balance — the label hides when both are zero).

Actions here: adjust the net total, COD worksheet (delivery orders with a debit exchange only),
finance application, finance payment estimator, minimum deposit by line, misc fees, tax info,
revolving payment estimator, trade/designer info.

---

## Order-level business rules `[DOC]`

Implement each with a named test (see `12`).

**Dates & periods**

- Written date cannot be in the future or in a closed accounting period
- Backdating from an overlap month requires the backdate permission

**Identity**

- Combined customer name elements ≤ 50 characters
- A phone number is required to save an order with a delivery fulfillment, or any exchange, when
  address confirmation is enabled

**Back orders**

- Maximum 52 per order; warn at the 48th, hard stop at the 52nd; beyond that, delete and re-enter

**Reservation**

- Products flagged require-reservation (at product level, else vendor level) must reserve; if
  insufficient quantity exists the product cannot be added at all
- Failure on update: "Product on this line must fully reserve and there is not enough quantity
  available to reserve the line."
- Reservation is re-evaluated on line save, on quote→order conversion, and on quote→layaway when
  layaway filling is on
- Dropped (`D`) and discontinued (`T`) products are addable only when incoming POs count toward
  availability; qty ordered > qty available blocks the add

**Pricing interactions** (full hierarchy in `04`)

- Overriding unit price **inactivates** the discount code field
- Applying a discount code and _then_ changing unit price warns and **removes the discount code**,
  keeping the new price
- Adjusting the net total and applying discounts/coupons are **mutually exclusive**; adjusting the
  net total clears discount codes and coupons and resets a redeemed coupon's flag
- Net-total adjustment is unavailable when more than one fulfillment exists for any method

**Price variance check** — hierarchy of variance-percent limits: product advanced settings →
location special-order variance → POS control special-order variance. All blank = no check.

```
variance% = (original_selling_price − discounted_price) / original_selling_price
```

Exceeding it triggers one of: alert, reason required, or comment required. No check runs without an
original selling price, or when the discounted price equals it.

**Charges**

- Delivery, installation, misc fees and tax are calculated **per fulfillment**
- Installation charges are delivery-only; on partial completion, installation is charged on
  completed lines only and the remainder stays on the open fulfillment
- Charge overrides are per-fulfillment and are **not** transferred when a line moves
- "One delivery charge per order" / "auto-move to first planned fulfillment": on save, charges are
  re-evaluated and fulfillments sorted by date — scheduled beats estimated, earliest time breaks
  ties, ASAP/CWC-only orders evaluate last by creation timestamp. The override flag and reason code
  move with the charge. Delivery charge and tax may recalculate, possibly producing a balance due or
  a refund due. **A comment is written to the order.**
- Minimum delivery purchase is checked on save against the merchandise subtotal; failure needs the
  override-calculated-delivery-charges permission

**Warranties & protection plans**

- One warranty per warranty category per open order, when configured
- Protection plans cannot be added to a completed order; only plans based on assigned inventory
  formations qualify; overlap resolves by most-eligible-lines-covered, then max quantity / min-max
  subtotal, then the automatic-add-overlap setting
- Removing a membership plan from an open order removes all its discounts; already-completed
  portions are unaffected; replacing a membership swaps discounts and removing the replacement
  restores the prior plan's discounts if automated line discounting is active

**Tax**

- Exemption requires the customer's ID expiration date to be **after** the written date
- A line's tax-exempt authorization number cannot be set while taxable is checked; granting it
  unchecks product-taxable and writes product, authorization number, and the security override to
  order comments
- Some RTO plans are exempt regardless and override customer settings

**Stock location & transfers**

- Alternate stock location applies only when: the setting is on, the line was initially entered, the
  line does not reserve, and the stock location has at least one alternate. Multiple alternates →
  earliest ATP wins, ties broken by an operator selection window. Excluded inventory formations
  bypass it. A transfer from alternate to fulfillment location is created.
- Changing a line's stock location deletes all linked transfers not in progress and rebuilds them
- Once an associated auto-transfer is manifested, quantity/stock-location/deletion changes are
  blocked (with an optional companion setting extending this after completion), subject to override

**Purchase orders**

- Non-inventory items need their own PO when POs are created on the fly
- Special-order lines must either reserve or be placed on a PO: "Must either reserve or place on
  Purchase Order; all merchandise ordered."
- POs created from order entry can be auto-held by setting

**Freeze after picking `[DOC]`**

- Once items enter RF picking status, delivery/pickup status, route/truck code, and delivery/pickup
  date are frozen until removed from picking

**Ticket printing**

- Blocked when the order is on credit hold, or its open balance exceeds the configured maximum

**Route capacity `[DOC]`**

- On adding a line to a full or closed route: "Route X is full for MM/DD/YYYY. Do you wish to
  override the capacity limit?" Yes requires the override permission; No adds the line unscheduled
- **No warning appears if the change reduces an already-exceeded capacity, even if still over** —
  reproduce this; it prevents alarm fatigue on corrective edits
- Route code selection for 9-digit zips is a three-tier fallback: 9-digit default route(s) → the
  parent 5-digit zip's default routes → all route codes

---

## Completion

The gate, the effects, and the exception rules are in `02` §5. What belongs here is the operator
sequence:

```
1. Check Complete on the fulfillment            (inactive+checked for TAKE_WITH;
                                                 hidden and replaced by "On Manifest" if manifested)
2. Save
3. Payment summary opens if an amount is due
4. Completion Date Entry                        (field list undocumented — see 13)
5. Order Completion Details                     (Amount Tendered window precedes it for cash)
6. Optional: Inventory Selection per line        (only when serial and/or location tracking is on)
7. Exit → "document has been completed" → back to order entry
```

**Rescheduling during completion `[DOC]`.** The completion detail screen offers _Reschedule for_
(pick an existing delivery date on the document, or None) and _Rescheduled Date_ (a single new date;
once specified both controls inactivate). Route-capacity override is reachable from there. Resulting
statuses are in `02` §3.

**Exception handling `[DOC]`.** All lines default to Complete.

- _Whole-order refusal_: click Not Complete at "Status for ALL Lines" — every line flips, and
  return-to-storage-location defaults for all lines (from the location's return-pickup setting, else
  the location the piece was picked from). A detail screen then shows product id as `...` meaning
  "applies to all pieces".
- _Per-piece_: click the in-grid Not Complete per line (return-to-storage-location defaults from the
  manifest process's not-completed-location), then the in-grid Details for that piece, saving per
  piece.
- _Exchanges_: marking the line not complete completes the **sale** portion; the return portion is
  marked separately via the exchange pickup/delivery action.
- _Transfers_: only merchandise received via WMS import can be completed; Not Complete is greyed if
  any transfer merchandise arrived that way, and a back order is created for unreceived merchandise.
- Manifest exceptions are written to a route-exception log when enabled, and are reportable.

---

## Returns & exchanges `[DOC]`

- A return carries a reason code and a pickup date per line, and links to the original order
  (a chained order)
- An exchange has a **sale half and a return half**. Tax display offers Sale / Return / Net.
  Commissions can be counted per half — the return half is addressed by suffixing the exchange order
  number with `e`
- **Minimum-deposit pro-rata rule**: for exchanges, delivery-line required amounts are reduced by
  return-line amounts **pro rata to each delivery line's share of the total delivery amount**
- Gift certificate tender **cannot** be used on returns or exchanges
- Exchanges against installment/RTO financing require the original order to have been financed with
  that plan type, and split-exchange is unavailable
- For commission purposes, returns and dollars-only adjustments date to the **written date of the
  original invoice**; if that invoice is off file, the transaction's own written date is used

## Quick Sale `[DOC]`

A separate lightweight program with its own customer handling, kits, product types, printing on slip
printers, serial-tracked handling, and warranty entry. `[DECIDE]` Whether LA Mattress needs a
distinct quick-sale path or whether a "fast mode" on the main order is enough — this is a real
decision, not a formality, because quick sale in STORIS bypasses much of the fulfillment model.
