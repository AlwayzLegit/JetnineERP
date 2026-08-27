# 01 — Domain Model, Invariants, and State

## What an exchange is

One document, two legs:

```
                    ExchangeDocument
                    ├─ exchange_number        (auto or manual)
                    ├─ original_order         (required — even when it doesn't exist)
                    ├─ customer               (may differ from the original sale's customer)
                    ├─ date                   (no future dates, no closed periods)
                    ├─ store
                    ├─ fulfillment_method     Delivery | Customer Pickup | Take With
                    │
                    ├─ RETURN LEG ────────────────────────────────
                    │   ├─ return_salesperson(s)      ← separate from the sale's
                    │   ├─ lines[]  (product, qty returned, unit price, reason, to As-Is)
                    │   ├─ merchandise_subtotal, discount, charges/refunds, tax
                    │   └─ RETURN NET TOTAL
                    │
                    ├─ SALE LEG ──────────────────────────────────
                    │   ├─ salesperson(s)             ← separate from the return's
                    │   ├─ lines[]  (product, qty, price, discount, stock/ship loc, dates)
                    │   ├─ merchandise_subtotal, discount, charges, tax
                    │   └─ SALE NET TOTAL
                    │
                    └─ SETTLEMENT
                        ├─ payments / refunds
                        ├─ financing
                        └─ BALANCE DUE  (to customer, from customer, or 0.00 = even)
```

### The design decision

Two legs that carry their own salespeople, their own totals, their own discount stacks, their
own charge lines — and that can be **split into two independent documents** — are two
transactions, not one.

**Recommendation:** model `Exchange` as a container linking one `CustomerReturn` and one
`SalesOrder`, each a first-class document in its own right. Split Exchange then becomes
trivial (drop the container, promote the children) rather than the surgical sub-process it is
in STORIS. Netting, the shared fulfillment, and the single settlement live on the container.

The tempting alternative — a sales order with negative lines — fails immediately on separate
salespeople, separate discount subtotals, the As-Is inventory routing on returns only, and
the restocking-fee/refund sign conventions. Do not take it.

---

## Fulfillment methods — three genuinely different flows

Chosen at the **Fulfillment Method** field, accessible at **any point** in the process.

| Method | Physical flow | Notes |
|---|---|---|
| **Delivery** | Store picks up the returned item and delivers the new merchandise | Full delivery scheduling: date, status, route, ship-from |
| **Customer Pickup** | Customer drops the return at the store, picks up the replacement at a different location or a later date | Pickup date is always status `Scheduled` |
| **Take With** | Customer drops off the return and takes the replacement immediately, same location | **Completes immediately** once return and take-with replacement are finalized. `[GATE]` **Not available at WMS locations** |

`[SETTING]` The default (or no default) comes from *Exchanges* on the General page of Point of
Sale Control Settings.

---

## The even exchange

A first-class concept, not merely "balance happens to be zero."

- On first entering **Step 3 — Sale Merchandise**, the system prompts:
  *"Is this an even exchange? Yes / No."* **Yes** defaults the replacement product
  information from the *first* product entered on the Return Merchandise page. **No** lets you
  enter a different replacement product.
- Even exchanges **can be completed against orders paid by installment or Rent-To-Own (RTO)
  financing**. On entry a message indicates that only original orders paid with a third-party
  installment or RTO plan qualify; if the order does not qualify, a warning is displayed.
- `[GATE]` **If "Even Exchange" is not offered, a separate return and sale must be created
  instead.** This is the escape hatch for financed orders that cannot be exchanged in place.
- Even/uneven affects protection plan pricing on transfer (see `03`).

**Why this matters:** financed orders can only be exchanged like-for-like, because the
finance contract cannot be re-struck at the register. This is a real accounting constraint,
not a UI convenience. Port it.

---

## Balance direction and settlement

`Balance Due` is signed and drives three different completion paths:

| Balance | On save | Settlement |
|---|---|---|
| **Due from customer** | Prompt: *"Amount Due is NNN.NN. Continue?"* | Yes posts the debit to the customer's account |
| **Due to customer, no refund check** | Prompt: *"Upon document completion, an A/R credit of NNN.NN will be posted."* | Yes posts an A/R credit |
| **Due to customer, refund check requested** | Prompt: *"NNN.NN Credit. Will create refund check."* | OK creates a refund check; **the Issue Refund Check checkbox is then automatically cleared** |
| **Even (0.00)** | — | Displays the even-exchange 0.00 amount |

---

## Sign conventions on charge lines — get these right

On **both** legs, the charge/fee fields are bidirectional and the sign convention is stated
explicitly for the return leg:

| Field | Positive amount | Negative amount |
|---|---|---|
| Delivery Charge Refund / Pickup Charge | **Refund** — increases the return total | **Charge** — reduces the return total |
| Installation Charge Refund / Restocking Fee | **Refund** — increases the return total | **Charge** — reduces the return total |

A restocking fee is therefore a *negative* entry in a field whose name leads with "refund."
This is confusing enough that it deserves distinct, explicitly-labeled fields in our
implementation (`refund_amount` and `fee_amount`, or a signed amount with an unambiguous
label) rather than one signed box.

---

## Holds and approval

`[SETTING]` **Exchanges on Hold at Entry** (Point of Sale Control Settings): when active, every
exchange order is placed on **E1 Hold** status pending approval.

`[PERM]` Release requires *Approve E1 credit holds placed on customer exchanges* in the User
or User Group file.

Separately, revolving financing can trigger a **C6 hold** (credit decision pending, reviewable
in *Review Pending Credit Requests*), which persists until the credit request is approved and
a credit limit established. See `05`.

**Recommendation:** model holds as a set of named, independently-clearable hold reasons on the
document, each with its own release permission — not a single status field. STORIS already
has at least two hold codes reaching this routine from different subsystems.

---

## Core invariants

**Original Order is required — even when it doesn't exist.**
The field must be filled in. If the number isn't in the system:
- `[PERM]` *Enter return/exchange/dollar adjustment without original order* is required.
- Without it, the user **cannot proceed** until a valid order number is entered.
- With it, a prompt appears noting the order doesn't exist, with the option to continue.

This supports exchanging pre-STORIS (pre-migration) sales, which for us means **pre-cutover
sales**. That is a live requirement for the LA Mattress migration, not a legacy curiosity —
customers will return goods sold on the old system. Make sure the permission and the
no-original path exist from day one.

`[GATE]` Consequence, stated in the source: **returns and exchanges without an original order
are not assigned a selling price and produce no inventory activity record.** Plan for that gap
in reporting.

**The customer may differ from the original sale's customer.**
The customer code defaults from the sales document when available, but can be changed — the
person being billed for the exchange need not be the original purchaser.

**Salespeople are per-leg.**
Two separate fields — *Salesperson* (the sale portion) and *Return Salesperson* (the return
portion) — each supporting multiple salespeople with commission splits via the Multiple
Salesperson Commission Screen. `[GATE]` **Both are inactive until an Original Order is
specified.**

Note the source's own caution: the Salesperson selection "modifies the salespeople on the new
sale, not the return portion."

**Tax status is inherited from the original invoice.**
When entering a new exchange **with** an original invoice, the customer's tax status comes
from **that invoice**. Without an original invoice, it comes from the tax fields in Advanced
Customer Settings. Exemption validity is checked by comparing *Tax Id Expiration Date* against
the **sale's written date**.

This is correct behavior and easy to get wrong: a return must be credited at the tax treatment
under which it was sold, not today's.

**Date cannot be in the future or in a closed period.**
`[PERM]` Backdating from an overlap month into the previous (current) month requires
*Backdate Transactions*.

---

## Read-only and inquiry modes

The routine has several distinct non-editable modes, each gated separately:

| Mode | Trigger |
|---|---|
| View existing exchange | `[PERM]` *Enter a New Exchange* absent → user can only view existing exchanges |
| Return portion inquiry-only | `[PERM]` *Edit Return Portion of Existing Exchange* absent → return leg and Return Details are view-only |
| Original order inquiry | `[SETTING]` *Automated & Manual POS Numbers* blank in Warehouse/Store Location Settings **and** a completed or voided order number entered at Exchange Number → prompt offers a read-only view of that order |

`[SETTING]` **Point of Sale User Verification** (Advanced page, POS Control Settings) may
require the user to re-enter their user ID and password after entering an order number at
Exchange Number, for both new and existing orders.

---

## Auditability

`[SETTING]` **Require Audit Text on Exchanges** (POS Control Settings): when enabled, saving a
new exchange prompts for audit comments in the Text Entry window. If none are entered:
*"Audit comments must be entered before saving the order."* and the window reappears — a hard
block, not a warning.

Several overrides write to the audit log automatically:
- Requested Date security override → logged in sales order Audit Comments
- Overridden restocking charges → written to the transaction's audit comments

An **Audit Comments Log** action is available on Steps 1, 2, 3, and 4.

**Recommendation:** make the audit log append-only and structured (actor, timestamp, field,
old value, new value, override permission used) rather than free text with occasional system
entries. Exchanges are the highest-shrinkage transaction type in furniture retail; the audit
trail is the control.

---

## Entry points

- Accounting > Receivables > Point of Sale > Returns and Refunds > Enter an Exchange
- Merchandising and Distribution > Logistics > Delivery Processing > Point of Sale > Enter an Exchange
- Customer > Point of Sale > Returns and Refunds > Enter an Exchange
- Customer > Customer Service > Returns and Refunds > Enter an Exchange
- Customer > Coordination and Logistics > Delivery Processing > Point of Sale > Enter an Exchange

## Header fields

**Exchange Number** — the transaction number. `[SETTING]` With auto-assign active in POS
Control Settings, Enter or the Plus button assigns the next sequential number.
`[SETTING]` With *Automated & Manual POS Numbers* active in Warehouse/Store Location Settings,
the user may instead assign a number manually.
Search offers three lookups over open, completed, and voided exchanges: **Open Order by
Product**, **View a Customer's Historical Purchases**, **View a Customer's Open Orders**.

**Last Order** — recalls the last saved exchange. Appears for an open order after it has been
saved or cleared. Hidden when: first accessing the routine; accessing it from the main menu;
the order has been completed or deleted; the order is being viewed read-only.
`[GATE]` Orders recalled this way are **still subject to security permissions**.
