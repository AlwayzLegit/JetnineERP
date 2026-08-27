# 05 — Step 4: Payment and Completion

Where the two legs meet. Read-only header: **Exchange Number**, **Available Credit**,
**Customer Name**.

---

## The two-sided totals block

The page shows **Return Details** and **Sale Details** side by side, each with the same shape,
then a combined **Totals** block.

| Field | Return Details | Sale Details |
|---|---|---|
| **Merchandise Subtotal** | Total dollars of returned merchandise, before tax and discounts | Total dollars of replacement merchandise, before tax and discounts |
| **Discount** | Subtotal discount on the return merchandise | Subtotal discount on the replacement merchandise |
| **Delivery Charge Refund / Pickup Charge** | Refund = positive (increases return total); charge = negative (reduces it) | Calculated delivery charge from **Delivery Company Settings**, may be $0.00; charge or refund |
| **Installation Charge Refund / Restocking Fee** | Refund = positive; charge = negative | Installation charge added to the order total |
| **Miscellaneous Fees** | Total misc fees applied | Total misc fees applied |
| **Sales Tax** | Running calculated tax | Running calculated tax |
| **NET TOTAL** | **RETURN NET TOTAL** | **SALE NET TOTAL** |

Both net totals include discounts and additional charges (tax, delivery, installation) and
**exclude deposits and financing amounts**.

`[PERM]` *Edit Return Portion of Existing Exchange* — without it, Return Details is
**view-only** (same permission that governs Step 2).

### Restocking fee

`[SETTING]` A restocking charge is **calculated automatically** when *Restocking Fee on Returns*
(POS Control Settings) has a value.
`[PERM]` Overridable via Create a User/Group Actions - Sales Security.

Three behaviors to port exactly:
1. **A newly calculated charge overwrites any previously overridden amount.**
2. **Once manually overridden, the charge is no longer recalculated.**
3. **Overridden charges are written to the transaction's audit comments.**

Rules 1 and 2 together are order-dependent and will confuse people. Make the override state
visible on the field ("overridden — no longer auto-calculating") rather than invisible.

### Sale-side delivery charge

`[PERM]` *Override System Calculated Delivery Charges* (or a security override) to edit.
`[GATE]` Active only if the order includes delivery line items, **or** direct-ship line items
when `[SETTING]` *DELIVERY CHARGES - Apply to Direct Shipments* is active.

`[GATE]` **Split orders:** the system applies the **full** delivery charge on the initial
release for completion — calculated on the **entire order** even when only part is for
delivery. Overridable.

`[SETTING]` *DELIVERY CHARGES - Prompt for Reason Code if Overridden* — when enabled, the Enter
Reason Code window appears and a reason **must** be entered.

Recalculation on existing orders uses the **Automatic Delivery Charge Calculation** feature; see
also the **Remove Delivery Override Flag** action below.

---

## `[GATE]` Discount interaction rules on exchanges

These are exchange-specific and exist to stop discount stacking from manufacturing refunds.

**The subtotal discount amount on the sale portion will not exceed:**
- **the subtotal amount of the sale portion** — if it does, the sale discount is reduced to
  match the sale subtotal; and
- **the subtotal discount amount on the return portion** — if it does, the sale subtotal is
  recalculated.

`[GATE]` **Applies to fixed discount amounts only.** Percentage discounts and line discounts are
unaffected.

**Downgrade exchanges:** when an uneven exchange is made for merchandise of **lesser value**,
all subtotal discounts on the order become subject to the **Amount** field of *Minimum
Eligibility Required* in Sales Discount Settings. A message alerts the user, who can then decide
whether to proceed as a **Split Exchange** instead.

These caps are anti-abuse controls. Port them, and add a test for each — a discount that
survives a downgrade exchange is free money walking out the door.

---

## Payments and Refunds

### Payment Type Code
Enter the payment/refund type directly, or use the Action button to open the **Payment Summary
Window**.

`[GATE]` **Gift certificates cannot be selected as a payment type via the Payment Summary Window
when issuing an exchange.**

`[SIDE EFFECT]` **Discount/coupon revalidation on payment entry.** As soon as a payment type is
entered, the order's discount and coupon codes are revalidated. Invalid ones raise a **warning
only** — payment processing continues unless the user exits the process, and **if the warning is
ignored, payments are applied anyway**. With multiple deposits in one session, validation runs
**once**, not per deposit.

That is a warning where a block belongs. In our system, invalid discounts at payment time
should be resolved before money moves — or at minimum, the applied-anyway outcome should be
recorded in the audit log.

`[GATE]` **Credit card refunds are not credited to the customer until the customer return is
completed.** Refund timing follows physical receipt of goods, not document save.

**Signature capture:** financing placed via this field **cannot be modified**, so a customer
signature is prompted only when *Prompt for Signature* = `Create` and the document's Reason is
`Authorized Finance`. If multiple finance plans are authorized or updated in one session and the
order is printed, the customer is prompted **per plan, up to three signatures**.

### `[GATE]` Builder allowance gift certificates

A product originally purchased with a **builder allowance gift certificate cannot be directly
refunded.** Instead:
1. An **in-store use only** gift certificate is issued to the customer. `[SETTING]` The payment
   type is established in **Accounts Receivable Control Settings**.
2. If the original purchase also used another payment method, credit remaining after the
   in-store certificate is issued can be **posted to the customer's open item account**, or an
   **AP check** is created when *Issue Refund Check* is selected.

### Total Payment Amount
Read-only. Populated after the Payment Type Code is specified.

### Issue Refund Check
Check to issue a refund check. On save, a confirmation prompt asks whether to create it. If
**unchecked**, the option to post an **A/R credit** is offered instead.

`[SETTING]` *Refund Check* (POS Control Settings) controls when this prompt is available.

`[GATE]` **Non-refundable gift card originals:** if the original order was paid with a
non-refundable gift card type — **Rewards Gift Card** or **In-Store Use Only Gift Card** — a
message states a refund check is not available, and a **new gift certificate of the matching
type** (Rewards or In-Store) is created instead.

`[GATE]` **Inactive when the customer is not required to provide a valid address.** (Same
condition that disables Split Exchange — see `02`. It appears to describe walk-in/anonymous
customers; confirm the exact semantics before implementing.)

---

## Financing

### Payment Type Code (Financing)

**Third-party financing:** indicate the Financing Payment Plan → the **Finance Receivable Entry**
window opens for account number (from the provider), insurance type, amount paid/credited, and
authorization number.

**Revolving:** enter the revolving payment type; Search lists valid **Revolving Receivables
Payment Plans** codes. Selecting one opens the **Revolving Worksheet (Short)** or **(Full)**
depending on control settings.

`[GATE]` *Required Percentage Paid before Add-on Allowed* (Revolving Receivables Payment Plans)
> 0 → a window shows the balance the plan must reach before add-ons are allowed.
`[PERM]` *Revolving Worksheet; Override Required Percentage Paid for Add-on* (Receivables
Security), or a security override.

`[GATE]` `[SETTING]` *Require Credit Application* (Credit Application Control Settings) — when
checked, a valid credit application must exist for the customer; otherwise a warning is issued
and financing/revolving entry is **blocked** until one is entered (via **Actions > Finance
Credit Application**).

`[SETTING]` *Credit Requests - Need to exist prior to entering an order* — when active, a valid
**approved** credit application must exist before a financing payment type can be entered. When
inactive, a finance payment type may be entered without one.

### `[SIDE EFFECT]` Revolving credit line checks and holds

Applying a revolving finance payment code triggers a customer credit-line check:

| Condition | Message | Result |
|---|---|---|
| No credit line established | *"A credit line must be established before financing can be added."* | Blocked |
| Credit line expired | *"Credit Report required"* or *"Credit application requires update"* | **Order placed on hold**; a new credit request must be made |

**C6 hold** = a credit decision is pending and must be reviewed by the credit department. The
sales order and its credit request appear in **Review Pending Credit Requests**. The hold
persists until the request is approved **and a credit limit is established**.

### Editing financing after entry

Action button at the Financing field → **Financing Entry** reopens Finance Receivable Entry or
the Revolving Worksheet.

| Financing type | Editable |
|---|---|
| Unapproved 3rd party | Account Number, Insurance, Amount; and an Authorization Number may be entered |
| 3rd party **with** an authorization number already entered | **Nothing — financing information is locked** |
| Revolving | Insurance code, Finance amount, Payment amount (where applicable) |

### Total Financed Amount
Read-only. The amount to be returned to the finance provider, shown after the financing payment
type is specified.

---

## Totals

| Field | Definition |
|---|---|
| **Merchandise Subtotal** | Combined subtotal of returned + sale merchandise (both Merchandise Subtotal fields) |
| **Discounts** | Net subtotal discount across sale and return merchandise |
| **Charges and Fees** | Net amount of charges and fees |
| **Net Sale** | Combined net of Return Net Total and Sale Net Total |
| **Payment** | Payments applied toward Balance Due |
| **Balance Due** | Total due **to** or **from** the customer after payments, refunds, and financing. Even exchange → `0.00` |

---

## Protection plan cancellation restriction

`[GATE]` On saving out of the exchange, *Cancellation Restriction Days* in **Protection Plan
Settings** is evaluated:

- **If covered products from the sale are being returned** (i.e. the plan is being **cancelled**)
  **and** the existing protection plan is **not** available for selection on new sale line items
  → the system checks that the cancellation restriction days have **not been exceeded**.
- **If the existing plan is available for new sale lines and is used** → the exchange is allowed
  **regardless of the cancellation restriction days**, because the plan is not being cancelled —
  the exchanged products are simply **added to the existing plan**.

The distinction is cancel-vs-carry-forward, and it is the right rule: a restriction window
should bind a cancellation, not a continuation. Implement the two paths explicitly.

---

## Ticket Print

**Print Delivery/Pickup Ticket** — `[GATE]` active only when **all** of:

1. `[SETTING]` *Prompt Ticket Print in Order Entry* (POS Control Settings) is set to
   `Deliveries Only`, `Pickups Only`, or `Deliveries and Pickups`
2. The delivery/pickup status is **Scheduled**
3. For delivery exchanges, the delivery date is within `[SETTING]` **Delivery Lead Days**
4. **At least one item on the order is reserved**
5. **The order is not on credit hold**

`[PERM]` *Print a delivery ticket within POS entry* and *Print a customer pickup ticket within
POS entry* (Create a User/Group Actions - Logistics Security).

Printing a delivery ticket is a state transition, not just output — see the Printing handoff,
`06-fulfillment-documents.md`.

---

## Completion

**Complete Exchange** — check to complete the exchange and **invoice the transaction**.

`[GATE]` **If this field is inactive, the order is incomplete** — e.g. an item is back-ordered,
or a delivery/pickup ticket has not been printed.

### Save — the full prompt sequence

Clicking **Save** on the Payment screen processes the exchange, in this order:

1. **Amount due from customer** → *"Amount Due is NNN.NN. Continue?"*
   Yes → processes and posts the **debit** to the customer's account. No → returns to Payment.
2. **Refund due, no refund check** → *"Upon document completion, an A/R credit of NNN.NN will be
   posted."* Yes → posts the **A/R credit**. No → returns to Payment.
3. **Issue Refund Check selected** → *"NNN.NN Credit. Will create refund check."*
   OK → creates the refund check. Cancel → returns to Payment.
   **The Issue Refund Check check-mark is then automatically cleared.**
4. **Cash payments applied** → the **Amount Tendered Window** appears.
5. *"Would you like a printed copy of this exchange?"* → Yes prints/views the document.
6. **Pickup exchange with Complete Exchange checked** → the **Completion Date Entry** window
   prompts for the Completion Date.
7. **Customer Pickup exchanges** → *"Would you like to generate the Pickup Ticket?"*
   Yes prints now; No defers — the ticket can still be printed later via **Print an
   Order/Delivery Ticket**.

**Recommendation:** this is a seven-step modal chain that mixes confirmations, financial
postings, and print offers. Restructure it as: one review-and-confirm screen showing the
settlement (debit or credit, method, amount), then a single commit, then document offers. The
current design makes it possible to click through an A/R posting without reading it.

### Other save-time gates

`[SETTING]` *Prohibit Unscheduled Lines* (Logistics/Other page, POS Control Settings) — may
require **manager credentials** to save orders with unscheduled line items. (Note the
interaction with the route-capacity "No" branch in `03` and `04`, which *creates* unscheduled
lines.)

`[SETTING]` *Change Fulfillment Status to SCH with a Balance Due* (Logistics page, POS Control
Settings + Create a User/Group - Logistics Security) — may permit scheduling delivery
fulfillments on orders with a balance due.

`[SETTING]` *Restrict Scheduled Date* (Warehouse/Store Location Settings and POS Control
Settings) — Delivery and Customer Pickup fulfillments may be restricted to a defined scheduling
window; a **security override** may be required to schedule outside it. Enacted by changes to
the Date and Status fields.

`[SETTING]` *Require Audit Text on Exchanges* — hard block; see `01` § Auditability.

`[SETTING]` *Confirm Address on Orders and Exchanges* — phone number required to save; see `02`.

**Parcel Delivery route compatibility** — warning with an option to continue; see `04`.

---

## Step 4 Actions

- Audit Comments Log
- **COD Worksheet** — `[GATE]` delivery orders that include a **debit** exchange only
- Finance Application
- Finance Payment Estimator
- Minimum Deposit By Line
- Miscellaneous Fees
- **Remove Delivery Override Flag** — recalculates delivery/pickup charges per the Automatic
  Delivery Charge Calculation parameters. `[GATE]` Activates when the order is partially
  completed or a user manually overrode the Delivery Charge or Pickup Charge.
  `[PERM]` *Override System-Calculated Delivery Charges*
- **Split Exchange**
- Trade/Designer Information

---

## Split Exchange — the escape hatch

Available from the **Actions** button on the **Customer** or **Payment** page.

**Purpose:** divide an exchange into two separate documents — one **customer return**, one
**sales order** — so each can be completed independently. The stated use case is completing the
return while leaving the replacement sale open (backordered replacement, special order, customer
changes their mind on the replacement).

Also used to allow corrections to existing exchanges: **STORIS restricts certain edits to
existing exchanges but permits some of those edits once the exchange is split.**

`[GATE]` Not available if the customer is not required to provide a valid address.

Referenced sub-process: **Splitting Exchanges** (out of scope here).

**This is the feature that determines the data model.** See `01` § The design decision — if the
return and the sale are separate documents joined by a container from the start, Split Exchange
is a container dissolve rather than a document surgery, and the "edits you can only make after
splitting" restriction disappears entirely.
