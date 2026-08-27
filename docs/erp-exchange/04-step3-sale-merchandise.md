# 04 — Step 3: Sale Merchandise

The sale leg — replacement merchandise. This is effectively full sales-order line entry, and
it is the largest surface in the routine.

---

## Entry: the even-exchange prompt

On first accessing this page:

> *"Is this an even exchange? Yes / No."*

- **Yes** → defaults product information from the **first product entered on the Return
  Merchandise page**.
- **No** → enter the replacement product code manually.

See `01` § The even exchange for why this is more than a shortcut (financed orders).

---

## `[GATE]` Auto-transfer change locks

`[SETTING]` *Prohibit changes to lines once an associated auto-transfer has been manifested*
(POS Control Settings) — blocks quantity changes, stock location changes, and line deletion.
This setting **allows updates until the auto-transfer is completed**.

`[SETTING]` *Continue to prohibit changes after auto-transfer has been completed* — extends the
lock past completion.

Both permit a **security override** to continue.

## `[GATE]` Parcel Delivery compatibility

When saving out of the exchange with **Parcel Delivery** enabled, the sale portion is evaluated
to confirm the delivery route is compatible with the merchandise. If not, a warning appears
**with the option to continue.**

---

## Product

The replacement product code. Search opens **Search for a Product**. Camera icon shows the
product image when one exists.

### Action menu

| Option | Purpose |
|---|---|
| **2020 Spaces Import** | Import products and quantities from a 2020 Spaces file; STORIS populates the line items from it |
| **Choose Substitutions** | Select substitute products for a component in a component-priced soft kit |
| **Create New Product** | Create a product on the fly |
| **Flexsteel Import** | Import a Flexsteel XML file |
| **Pro Kitchen Import** | Import product data from a Pro Kitchen spreadsheet |
| **Product Group/Collection Inquiry** | Browse groups/collections |
| **Special Order Sales** | Default special-order information for an **even exchange** from the original sale, when the original template still exists |

`[GATE]` **Special Order Sales degradation rules** — if the original template has differences
(deleted option types, renamed options), the original options **do not default** and options
plus pricing must be added manually. If **any** option or option type is no longer valid,
**none** of the special-order information is added. All-or-nothing, not partial.

The three vendor imports (2020 Spaces, Flexsteel, Pro Kitchen) are integrations, not core.
Confirm whether LA Mattress uses any before scoping them.

### `[GATE]` Product eligibility rules

| Rule | Behavior |
|---|---|
| `[SETTING]` *Allow Warranty Only Once Per Order* (Warranty Category Settings) | Only one warranty per category per open order |
| Distribution Status Settings, *Inventory Availability* = **Defective** | **Cannot be added** |
| `[SETTING]` *Prompt User in POS* (Advanced Product Settings) | Opens the Multiple Selection Lookup Window to pick **prep codes** for the line. Prep codes defaulted from Advanced Product Settings appear pre-selected and may be deselected |
| `[SETTING]` *Include Incoming PO's when Determining Availability for Dropped or Discontinued Products* (Purchasing Control Settings) | Allows dropped (`D`) or discontinued (`T`) products onto an exchange, subject to the availability rules below |

**Dropped/discontinued availability rules:**
- Quantity ordered **exceeds** quantity available → the product **cannot** be included.
- Quantity available at the stock location → product is added **and reserved**.
- A purchase order created **before** the exchange → the item may be added to the grid but
  **remains unreserved until the PO is received**.

`[SETTING]` *Use Order Date for Promotional Pricing* (POS Control Settings) — determines whether
promotional pricing uses the **order date** or the **line-added date**. On an exchange these
can differ by days or weeks; the choice is material.

---

## Pricing fields

**Description** — display-only, from product settings.

**Quantity Ordered** — the replacement quantity. Action opens the **Purchase Order
Reservations** screen `[GATE]` when active via *Sales Order Linkage Access* in Purchasing
Control Settings.
`[SETTING]` *SOFT KIT – Allow Quantity Ordered Greater Than One* (POS Control Settings) may
enable or disable the quantity prompt when adding a soft kit.

**Quantity Available** — display-only; quantity ordered that is available at the stock location.

**Unit Price** — the selling price fills in when available and **can be overridden**.
`[GATE]` **Overriding the price inactivates the Discount Code field.**

**Extended Price** — display-only: Unit Price × Quantity Ordered.

**Discount Code** — the sales discount applied to the line. Arrow-select; multiple discounts
via the extra Action button.

The available discount list is filtered by:
- inventory formations associated with the product,
- discount codes available to the current selling location,
- discount codes restricted to As-Is / saleable merchandise.

`[SETTING]` Also filtered by **Customer Price Category**: discount codes whose customer price
category matches the customer's category are **excluded** from the dropdown, and the available
codes are shown once a customer number is entered. (The source states the exclusion in exactly
those terms; verify the direction against a live system before implementing — as written it
reads inverted from what you'd expect, and getting it backwards silently changes what
discounts a salesperson can reach.)

Extra Action options:
- **Coupon Code Entry** — `[GATE]` appears when *Activation – Apply to Saleable Line Item
  Amounts* and/or *Activation - Apply to As Is Line Item Amounts* is checked **and** *Only
  Available to Link to Coupons* is checked
- **Enter Multiple Discounts Per Line**
- **Override Discount Amount** — `[GATE]` appears automatically when the discount is an *Amount*
  type set to allow override; accepts, overrides, or enters an amount when no default exists.
  Reachable later via Action > Override Discount Amount

`[GATE]` Discount Code is active only when the product is flagged **Discountable** in the
product record **and** `[SETTING]` *DISCOUNTS - Apply Discount Codes to Individual Line Items*
is checked.
`[PERM]` *Access sales order line discounts* (or a security override) to edit.
`[SETTING]` *Sales Quote Starting Date* (Sales Discount Settings) governs applying a discount
to a quote before an advertised sale starts.

`[GATE]` **Ordering trap:** applying a Discount Code **before** changing the Unit Price raises a
warning and **removes the discount** — the Unit Price change stands. Price override and
discount code are mutually exclusive, and the order of operations decides which survives. Make
this explicit in our UI rather than a warning after the fact.

`[SETTING]` **Automatic line discounts:** when adding a line, if the product has a discount code
in **Advanced Product Settings** and the current date falls within the Start/End range in
**Sales Discount Settings**, that code is added automatically — **before** other automatic
discounts.

**Discount Amount** — display-only calculated or fixed discount amount.

---

## Sourcing and location fields

**Stock Location** — resolution order:
1. Stock Location settings, Inventory & Logistics page, **Warehouse/Store Location Settings**
2. `[SETTING]` If *Use POS Control Settings* is enabled for the selling location, defer to the
   General page of **Point of Sale Control Settings**

`[GATE]` Regional Processing applies. If multiple transfers are created, Stock Location displays
the associated **Multiple Locations**.

### `[SETTING]` Alternate Stock Location logic

An alternate stock location is used as the stock location when **all** of:
- *Use Alternate Stock Location* is checked in POS Control Settings
- the line has been **initially entered**
- the line **does not reserve**
- the line's Stock Location has at least one alternate stock location assigned

Selection among alternates:
- **One alternate** → used as the stock location, and a **transfer from it to the fulfillment
  location is created** `[SIDE EFFECT]`
- **Multiple alternates** → the location with the **earliest ATP date** wins
- **Tie on earliest ATP** → resolved by the locations set in **Multiple Location Selection**

`[GATE]` **Exclusion:** *Formation – Exclude from Alternate Stock Location* in Warehouse/Store
Location Settings — if the line's product belongs to the designated inventory formation, the
alternate stock location logic **is not applied**.

`[SETTING]` *Prefer Incoming Purchase Orders Before Stock Location Schema* (POS Control
Settings) — determines whether incoming POs are a better fit than the Stock Location Schema or
Alternate Stock Location logic. (See Stock Reservation Settings.)

**Ship Location** — defaults to the ship-from location; editable per line.
For pickup and take-with orders it defaults from the **Pickup Location** on the Customer page,
and **editing it updates Pickup Location** (bidirectional).
With zip-based defaults, from *Pickup Fulfillment Location* or *Normal Fulfillment Location* in
Individual Zip Codes.
`[SIDE EFFECT]` **If Ship Location differs from Stock Location and `[SETTING]` *Auto Schedule
Days* is set in POS Control Settings, the system creates an automatic transfer for the line
item.** (This is the auto-transfer the change locks at the top of this document protect.)

**Purchase Order Number** — display-only; shows the PO number if one has been created for the
product.

**Special Order** — indicates whether the product is a special order.

**Room** — associate merchandise with a room. Options: `None Selected`, **Create/edit Room**
(creates a room on the fly via Room Settings, **available only on the current order**), rooms
created on the fly for this order, and rooms previously created via Room Settings from the main
menu.
`[GATE]` Visible only when `[SETTING]` *Allow Room Entry in Enter a Sales Order* is checked.
On-the-fly rooms are deleted when the order is deleted **and has no partial completions**; if
partially completed they persist until the invoice is purged. They remain available for the
order even if lines are deleted. **Not available in Enter a Shopping Cart.**

---

## Scheduling fields

**Fulfillment Date** — when this line is delivered. `[GATE]` **Only dates with available route
capacity are selectable.**

Action options:
- **Override Route Capacity Date** — select a date outside available dates for a full route.
  `[PERM]` *Override capacities when scheduling routes that are full* (Logistics Security);
  otherwise a credentials prompt appears.
- **Select a Delivery Date** — pick one of the dates already on the order.
- **Update Line Item Delivery Dates** — `[GATE]` active when `[SETTING]` *DELIVERY DATES - Allow
  multiple on order line* is checked **or** the line already has multiple delivery dates. Sets
  multiple delivery dates for one line item.

`[GATE]` **When initially adding a product, Fulfillment Date is inactive.** All line items
should be added **before** scheduling individual lines — otherwise the first delivery date
entered becomes the default for every subsequent line added.

That is a workflow landmine (add, schedule, add again → the new line silently inherits a date).
Our implementation should either allow scheduling at any time or state the constraint in the
UI, not in a help article.

**Available to Promise (ATP) Date** — display-only calculated availability.
`[SETTING]` Shown by default when *ATP CALCULATION - Default display of ATC date in Point of
Sale* is **not** checked.
Reserved in full → current date. Not reserved in full → next projected availability per the ATP
calculation.

**Available to Customer (ATC) Date** — display-only, shown by default when that setting **is**
checked. Based on **both merchandise availability and delivery route capacity**. The system
takes either the first open date on the order's route, or the delivery date on the line if the
order is scheduled. Same reserved/not-reserved rule as ATP.

Toggle between them via **Actions > Toggle Display of ATP/ATC Dates**.

`[GATE]` `[SETTING]` *DELIVERY DATES - Restrict based on available date* — when checked, a
security override is required to:
- schedule a line earlier than **that line's** ATP/ATC date, or
- schedule the **order** earlier than the ATP/ATC date of **any** of its lines.

**Serial/Reference Number** — serial or reference number for the line, when one exists. Multiple
numbers display as an ellipsis; the Action button opens the **read-only** View Serial/Reference
process. `[GATE]` Inactive when the line has no serial or reference number.

---

## Line entry controls

**Save + Add Another**, **Save**, **Cancel**, **Add Item**, **Expand/Collapse All Rows** — as on
Step 2 (see `03`).

`[GATE]` **Direct Ship exception:** on Save + Add Another for a direct-ship order (Fulfillment
Method = Direct Shipment), the **Purchase Order Linkage Detail Maintenance** screen appears to
edit Scheduled Delivery Date, Vendor, and PO linking.

**The same route-capacity warning applies here**, with identical semantics to Step 2 — including
the "No → line added as unscheduled" branch. See `03`.

---

## Line Item Display

Rows not directly editable; **Edit** loads the row into the entry fields and turns the row
yellow. **Remove** deletes after confirmation.

Columns: Product, Description, Fulfillment Method, **Status**, Quantity Ordered, Quantity
Reserved, Discount Code, Discount Amount, Unit Price, Extended Price.

### Status flags

| Flag | Meaning |
|---|---|
| `A` | As Is |
| `C` | Linked to a COM (Customer's Own Material) |
| `H` | **Line on Hold** |
| `L` | Line-item comments exist |
| `P` | Linked to a PO |
| `S` | Linked to an open service order |
| `T` | Linked to a transfer |
| `U` | Unscheduled |
| `W` | Linked warranty |

`[GATE]` **Hold semantics:** items on hold are **not shipped regardless of reservation or
assignment**. The source's example — 5 items on an order with 3 on hold → **no more than 2**
ship (order quantity minus hold quantity).

Status is a **multi-valued flag set**, not an enum. A line can be As-Is, unscheduled, and
PO-linked simultaneously. Model it as a set.

**More** expander — all display-only, sourced as noted: Second Description (product record),
Vendor Model Number (product record), Special Order Information (Special Order Entry), Fulfillment
Date, ATP/ATC Date, Brand, **Quantity Assigned** (available on-hand pieces applied to the
order), Purchase Order Number, Regular Selling Price (Product Settings), Suggested Retail Price
(Product Settings), Extended Suggested Retail Price (current suggested retail, or for a
configured product the calculated price **excluding current promotional pricing**), Room.

---

## Right-click menu `[LEGACY]`

User-definable via **Dynamic Escape Settings**. Delivered options: Add Escapes to Current
Screen, Kit Inventory/Availability Inquiry, Warehouse Stock Inquiry.

A user-configurable context menu framework is a lot of machinery for shortcuts. Ship the two
inquiries as ordinary actions; skip the framework unless someone asks for it.

---

## Step 3 Actions

- Additional Line Item Details
- Advanced Line Item Display
- **Assign Pieces**
- Assign Rooms to Order
- Audit Comments Log
- Costed Line Item Display
- Customer's Own Material (COM)
- **Enter a Discount on Multiple Lines** — applies a discount to all eligible lines
- Extended Warranty Detail
- Group Pricing
- Line Comments
- Line Item Display
- Line Item Linked Document Display
- Prep Codes
- Price/Spiff/Commission Table
- Product Benefits Inquiry
- **Purchase Order** — see below
- Select Fulfillment Date
- **Toggle Display of Product** — switch the grid between Product and Vendor Model
- **View Order Discounts** — a ledger of how line discounts were applied to the order
- View All Linked Transfers
- View/Edit Exception Comments

### The Purchase Order action — a hard requirement, not a convenience

`[GATE]` Available when a **special order line item** is selected.

Prompt: *"NNN Currently Available; NNN Net On Order. Do you want to create a purchase order?
Yes / No"* — showing on-hand and on-order quantities for the special order product.

- **Yes** → creates a new PO; the assigned PO number is displayed.
- **No**, with quantity available → *"Stock available - Reserve Stock for this order? Yes / No /
  Cancel"*
- **No** to both → warning: *"Must either reserve or place on Purchase Order; all merchandise
  ordered."*

`[GATE]` **A special order line cannot be added unless a PO is created or merchandise is
reserved.** There is no third option.

`[SETTING]` *Set Purchase Order to Hold* (Purchasing Control Settings) — when active, **all**
special-order POs created via sales order entry are placed on hold automatically and must be
released via Purchase Order Entry before processing.

`[GATE]` **POs created on the fly cannot mix inventory and non-inventory items** — non-inventory
items require their own purchase order.

### `[SETTING]` Purchase Order Reservations behavior

*Manually Link Purchase Orders on Sales Orders and Exchanges* (Create a User/Group Actions -
Sales Security):

| State | On saving a stock product | On choosing Quantity Ordered for a stock product |
|---|---|---|
| **Enabled** | **Purchase Order Reservations** appears, governed by *Sales Order Linkage* in Purchasing Control Settings (`Manually`, `Automatically`, …) | Purchase Order Reservations appears, depending on *Sales Order Linkage Access* |
| **Not enabled** | Purchase Order Reservations does **not** appear | The user gets the **standard Security Override** |
