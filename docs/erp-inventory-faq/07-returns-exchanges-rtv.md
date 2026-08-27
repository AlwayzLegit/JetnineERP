# 07 — Returns, Exchanges, and Return to Vendor

---

## RTN — Returns

### `RTN-010` Enter a Return

_Source: I1_

Return entry must **not require an existing completed order number**. This is essential and is the same
capability that makes cutover survivable (`MIG-030`) — every pre-cutover sale is, from the new system's
point of view, a "pre-STORIS" sale.

Behavior:

- Customer may be selected or **created on the fly** from the customer number prompt.
- Any order number may be entered; the product code must be one the system tracks.
- If the referenced completed order does not exist, **prompt** and allow the user to continue.
- Continuing without an original document requires `SEC-RTN-NOORIG`
  (_"Enter return/exchange/dollar adjustment without original order"_, Sales security).
- On completion, the item is returned to stock (or to as-is per `RTN-070`).

### `RTN-011` Returns without original — controls

Because this path bypasses the original document, it must be tightly audited: log every no-original return
with user, reason, amount, and referenced order number (even a bogus one), and expose a
`RPT-RTN-NOORIG` exception report for loss prevention. Consider a value threshold above which manager
approval is required. `[DECISION NEEDED]`.

### `RTN-012` Exchanges without original order

_Source: I8_

Identical rule for **Enter an Exchange**: no completed order number required, both the returned product code
and the replacement product code must be tracked, prompt-and-continue when the order is not found, gated by
the same `SEC-RTN-NOORIG` permission.

### `RTN-020` Return fee sign convention — **exact rule**

_Source: I2_

On the return's **Payment** page, the `Delivery/Pickup` and `Installation/Restock` fields accept signed
amounts:

- **Positive** → **added to the refund**, increasing the amount due to the customer.
- **Negative** → **subtracted from the refund**, reducing the amount due to the customer.

This is counterintuitive (a "restock fee" you want to charge is entered as a **negative**), and it is a
guaranteed source of errors. Requirements: label each field with its effect inline, show a live running
refund total that updates as the amounts are keyed, and unit-test both signs on both fields.

`[DECISION NEEDED]` — strongly consider a clearer UI (a Charge/Refund toggle plus a positive amount) that
maps to the same stored signed value. Recommended, provided the stored convention stays identical for
reporting parity.

### `RTN-030` Return when the payment line was fully refunded

_Source: I3_

When the original payment line has already been fully refunded, there is no payment method left to refund
against. Documented handling:

1. Complete the return **without a payment method**, so the balance posts to the **customer's account**.
2. Then issue the money through **Enter a Customer Payment / Refund / Gift Certificate**.

Requirement: completing a return with no payment method must be a supported, non-exceptional path that
creates a customer-account credit balance. Detect the fully-refunded condition and suggest this flow rather
than erroring.

### `RTN-031` Customer account credit balances

Credits on account must be visible on the customer record, applicable to future orders, refundable via the
payment/refund routine, and aged for reporting. Escheatment/aging policy is `[DECISION NEEDED]`.

### `RTN-040` Return restrictions — days allowed

_Source: I4_

Maximum days allowed for a return or exchange, configurable at **two scopes**:

- `CFG-POS-RTNDAYS` — Point of Sale Control Settings (system default)
- `CFG-GRP-RTNDAYS` — Product **Group** Settings (`ITEM-011`)

**Group-level overrides system-level.** Where a return contains lines from multiple groups, evaluate
per line. Exceeding the window blocks the line unless overridden with `SEC-RTN-OVERRIDE`, and the override
is logged. Measure the window from the **delivery/completion date**, not the order date —
`[DECISION NEEDED]`, confirm; delivery date is the norm for furniture.

### `RTN-070` Return to As-Is flag

_Source: B1_

Both `Enter a Return` and `Enter an Exchange` carry a **Return to As-Is** field per line. When set, the
returned piece re-enters inventory as an individually-tracked as-is piece (`STK-020`) with its own reason
code and its own selling price (`ITEM-044`) rather than as saleable stock. This is one of the five as-is
entry points required by `STK-021`.

---

## RTN — Exchanges

### `RTN-050` Exchange fulfillment methods

_Source: I5_

`Fulfillment Method` on the exchange, three values with distinct behavior:

| Method              | Behavior                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Delivery**        | Store picks up the returned item and delivers the replacement. Two logistics events.                                    |
| **Customer Pickup** | Customer drops the returned item at the store and picks up the replacement at a **different location or a later date**. |
| **Take With**       | Customer drops off the return and takes the replacement **at the same time, same location**.                            |

### `RTN-051` Take-With completes immediately

_Source: I5_

A Take-With exchange **completes immediately** once the return and the take-with replacement are finalized —
no open document, no pending logistics. Inventory relief and the financial posting happen in the same
transaction.

### `RTN-052` Take-With is unavailable at WMS locations — **hard rule**

_Source: I5_

Take-With must be **disabled** when the exchange's location is a WMS location (`LOC-010` WMS flag), because
the warehouse management system owns piece release there. Enforce server-side; grey out the option with an
explanatory tooltip client-side.

### `RTN-060` Split Exchange

_Source: I6_

An exchange may be split into **two independent documents** — a customer return and a sales order — via a
**Split Exchange** action available from the exchange's Customer or Payment page. After splitting, the two
documents complete independently.

Use cases: the return and the replacement sale cannot be completed at the same time (I6); the replacement
must ship direct from the vendor (I7). Splitting must preserve linkage for reporting (both documents carry
the originating exchange id) and must correctly divide payments, fees, and tax. Splitting is only valid
while the exchange is open; define and test the behavior when one side is already partly fulfilled.

### `RTN-061` Exchange with replacement shipped direct from vendor

_Source: I7_

Documented sequence to support end to end:

1. Enter the exchange normally, save, exit.
2. Reopen the exchange, Actions → **Split Exchange**.
3. Open the resulting **sales order** for the replacement merchandise.
4. On the merchandise tab, change the **Line Type** to **direct ship** for the items to ship directly to the
   customer (`PO-060`).

Requirement: `Line Type` must be editable to direct ship on an existing open sales order line, and doing so
must generate the vendor PO with the customer as ship-to.

---

## RTV — Return to Vendor

### `RTV-010` Four supported return-to-vendor paths

_Source: H1_

All four must exist; they are used in different circumstances and are not interchangeable.

### `RTV-011` Path 1 — Un-receive against the PO

Receiving → `Type of Activity = Reverse a Receiving Error` → enter the PO → select the line → enter the
quantity to return in the **Credit** column (system applies the negative). Limited by the **Available**
column (`RCV-031`). Use when the goods are still on the original receipt and unpaid. Generates the vendor
credit (`RCV-034`).

### `RTV-012` Path 2 — As-Is → RTV list → RTV completion

For goods no longer tied to a reversible receipt:

1. `STK-010` Enter a Stock Adjustment — move the piece to **As-Is (non-saleable)**.
2. **Create Return to Vendor List** (Return List Entry) — add the as-is pieces to be returned.
3. **Complete Return to Vendor** (Return to Vendor Completion) — finalize the RTV record.

Requires: an RTV document entity with header (vendor, RMA number, ship date, carrier, expected credit) and
lines (piece/serial, product, quantity, cost, reason code), plus statuses `LIST` → `COMPLETED`. Completion
relieves inventory, posts the RTV ledger rows, and creates the expected vendor credit in AP.

### `RTV-013` Path 3 — Direct negative stock adjustment

`STK-010` Enter a Stock Adjustment: enter the product (SKU) and a **negative quantity** to adjust the pieces
out. Reason code mandatory. Use only when no vendor credit is being pursued through the RTV document —
otherwise `RTV-012`.

### `RTV-014` Path 4 — Un-receive merchandise received without a PO

`RCV-011` Receive without a Purchase Order: specify the **original reference number and vendor number**, then
enter a quantity of **−1** (i.e. a negative quantity for the amount being returned).

### `RTV-020` Returned to the wrong vendor — offsetting-bills correction

_Source: H2_

Option A (accounting-only, no inventory movement):

1. Create an **expense bill** for the wrong vendor to offset the credit bill issued to them.
2. Create a **credit bill** for the correct vendor to collect the money.

Requires AP to support both documents and to link them to the originating RTV for audit.

### `RTV-021` Returned to the wrong vendor — re-receive and redo

_Source: H2_

Option B (inventory round-trip):

1. Create a **PO to receive back** the pieces that went to the wrong vendor.
2. Run the return-to-vendor process again (`RTV-011`/`RTV-012`) against the **correct** vendor.

Both options must be documented in-product on the RTV screen, since choosing wrongly creates a reconciliation
mess in AP.
