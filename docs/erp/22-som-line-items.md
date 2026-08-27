# Line Items — Screens, Configuration & Linkage

The screen layer beneath Step 2 (Merchandise) of order entry. `01` carries a coarse `OrderLine` field
list and `02` the line status flag set; this document specifies how a line is built, displayed,
configured, split, linked, priced, warrantied and serialized, plus the fields `01` did not reach.

Screens covered (corpus indexes): 6, 11, 13, 14, 19, 27, 62, 68, 81, 84, 85, 86, 87, 90, 97, 114, 115,
127, 129, 134, 144, 146, 148, 149, 155, 167, 171.

---

## 1. Line lifecycle

A line is not created in one act. Several screens fire automatically the moment a product code resolves.

```
ADD          price hierarchy runs (04) → line materialises, then auto-fires:
             ├─ Product Warranty Selection       (product has linked warranties)
             ├─ Related/Associated Product Sel.  (product has assoc. inventory formations)
             ├─ Serial/Reference Number          (as-is / special order, Quick Sale)
             ├─ Manufacturer's Serial Number     (global serial-tracking OFF, product ON)
             └─ Warranty Linkage Selection       (the added product IS a warranty)
CONFIGURE    Special Order Configurator → Option Selection / Main Fabric Selection
                                        → Clone From Existing Line
RESERVE/LINK reservation attempt · Inventory Selection · Line Item Linked Document Display
SPLIT/CLONE  Split Merchandise Lines (quantity) · Clone From Existing Line (options)
MAINTAIN     Additional Line Item Details · Line Comments · Assign Rooms to Order ·
             Update Product Price · Maintain Linked Lines (fulfillment move)
COMPLETE     per fulfillment — see 02 §5
```

`[DECIDE]` Four blocking modals per line is too many; make the defaultable ones non-blocking.

---

## 2. Line display surfaces

| Screen | Opened from | Shows | Cost |
|---|---|---|---|
| Advanced Line Item Display (11) | Merchandise **and** Payment tabs, Actions | inventory, delivery, ATP, line comments | no |
| Costed Line Item Display — Read Only (27) | Merchandise Actions (sales order, exchange) | price, cost, gross margin + column totals | **yes** |
| Line Stock Availability — Read Only (85) | six entry points, three pages | ordered/reserved/scheduled/available/on-hand by inventory source | no |
| Line Item Linked Document Display (84) | Merchandise Actions | linked transfer and linked PO per line | no |
| Shopping Cart Line Item Display (149) | Create/Edit a Shopping Cart, Merchandise Actions | Cart ID, Product, Description, Ordered, Avail, ATP Date | no |
| Shopping Cart Costed Line Item Display (148) | same | Cart ID, Customer Name, Product, Ordered, Price, Cost, Gross Margin + totals | **yes** |

`[DOC]` **Cost gate.** 27 and 148 require **"View and Access Product Cost Information"** — named in
System Security for 27, Extended Security settings for 148; `[DECIDE]` probably one permission under two
names. Screen 27's **Return** tab is active **only** when reached from Enter an Exchange, and its
**Reason** column populates for return lines only.

**Advanced Line Item Display (11)** columns: Product/Vendor Model, Description, Ext. Sell Price, Dlvy
Type, Stock Locn, Qty Ord, Qty Res, Qty B/O, Delivery Status, Delivery Date, ATP/ATC Date, ATP/ATC
Source, ATP/ATC Document, Trip ID, Comment, Shipment Tracking Number, Direct Ship Tracking ID.

`[DOC]` **Comment** shows an asterisk when line comments exist; **double-clicking the row** renders them
into a text box above the grid (read-only — editing means returning to order entry). **Direct Ship Tracking
ID** displays 40 characters. **Trip ID** is column-chooser-only, requires ATP calculation active, sources
from a linked Purchase Order Item, and renders **multiple trips as separate lines** in one row.

`[DOC]` **The ATP/ATC triple is conditional.** Whether the columns read ATP (available to promise) or ATC
(available to customer) is driven by *"ATP CALCULATION - Default display of ATC date in Point of Sale"*. If
ATP calculation is unused **and** none of *"Include New Purchase Orders"*, *"Include Stock Transfers"*,
*"Included Unlinked Purchase Orders"* are enabled, all three columns and their data are suppressed, headers
included — the same rule governs screen 149's ATP Date. Parts ATP also depends on *"Applies to Parts"* and
*"DELIVERY DATES - Restrict Based on Available Date"*. `[DOC]` *"Default Display of Vendor Model in Point of
Sale"* flips the leading column from product code to vendor model on screens 11, 27, 84 and 85 — one global
setting driving four grids; `[DECIDE]` make it per-user.

**Line Stock Availability (85).** Pages: `Sale` (always), `Return` (customer returns and the return
portion of exchanges only), `Service` (service-order items only). Sale: Product, Description, Ordered,
Reserved, Schedule, Available, On Hand, Stock Location. Return: Product, Description, Stock Location (the
*return* location), Quantity, Reason, Price, Extension (return price × quantity returned). Service:
Product, Description, Problem (problem quantity), Quantity, Scheduled (`SCH` / `EST`).

`[DOC]` **Inventory Source** on the Sale page sets the aggregation level: `All Locations | Region | Stock
Location`; **Region appears only when Regional Processing is active** — "available" is a different number
at each level. Double-clicking any row opens **Additional Line Item Details**. `[DEFECT]` Titled *Line
Stock Availability* from sales orders and exchanges, *Full Line Summary Display* from returns and a service
order's Parts, Labor and Charges pages.

**Line Item Linked Document Display (84).** Per line: linked **transfer** (number, TRN Qty = transfer
ordered quantity, RES Qty = the linked auto transfer's currently reserved quantity, date, status) and
linked **purchase order** (number, PO Qty, date, status). A **Multi-leg Transfer** checkbox marks lines
linked to multi-leg transfers; double-click opens **View All Linked Transfers**. `[PARTIAL]` Statuses are
examples only.

---

## 3. Additional Line Item Details (6)

Pages: Header, General, Sales Order, Return, Direct Ship. The last three are mutually exclusive, each
active only for the matching order type. `[DOC]` A read-only variant exists in which every field is
viewable and none editable. **Header (all pages):** Product (code, description below the field), Order
Number.

**General** — display-only, mirroring Advanced Product Settings: Vendor, Brand, Vendor Model, Sell Price,
Taxable, National Tax Exempt, Commissionable, Commission Category (editable only via Commission/Spiff
Updates), Line Reference, Line Type, Written Date, Purchase Status, Product Group, Product Type,
Substitution Code, Substitute Product, Unit of Measure, Unit Conversion (broken-unit multiplier), Shipping
Weight, Shipment Tracking Number (manual; surfaces in Complete Direct Ship Orders), Direct Ship Tracking
ID, Comments.

`[DOC]` **Comments here are a separate stream** — text that "appear[s] only on this screen (reference
purposes only)", not the printable line comments of screen 62. `[DECIDE]` Merge or label. `[LEGACY]`
**Direct Ship Tracking ID** exists for EDI; with multiple IDs an ellipsis `...` appears, opening **Maintain
Tracking ID** in inquiry mode.

**Sales Order page — tax override** `[DOC]`: **National Tax Exempt** and **Product Taxable** each override
Advanced Product Settings **for this order only**; **Tax Exempt Authorization Number** carries the
authorization permitting exemption. All three require **"Change Taxable Settings"** (System Security) or a
security override. Once granted, **Product Taxable is unchecked automatically** and no tax applies to the
line; the authorization number **cannot be populated while Taxable is checked** — validated, with a
conflict message. Granting it **writes to order comments**: product, authorization number and security
override information — an audit trail belonging in `01`'s `AuditComment` stream. Under Avalara the field is
always active and accepts **any** exemption code, **maximum 20 alphanumeric characters**.

**Delivery Information** `[DOC]`: Date is read-only, populated **only when line status is EST or SCHED;
blank for CWC and ASAP**. **Fill Days** overrides calculated auto fill days for this product on this order
only, is **inactive when status is CWC or ASAP**, and requires **"Change Auto Fill Days on Transactions"**
(Sales Security) or an override. **Scheduled** is editable only when a date is present; edits recompute
**Total Scheduled** (across all delivery dates) and **Unscheduled**.

**Quantity Information** `[DOC]`:

- **Reserved** — editable up or down, gated by **"Manually reserve stock merchandise"**. If the product is
  flagged *Reservation Required*, reducing it **to zero** additionally requires **"Override Reservation
  Required"** (Sales Security); otherwise the Security Override Screen demands another authorized user's
  initials and password.
- **Ship** — quantity available for shipping. Active in exactly one situation: a line was partially
  received and more stock arrived (PO or transfer) **while other quantities sit on a delivery manifest**.
  STORIS never adds newly received items to an existing manifest. Documented procedure: (1) remove the
  order from the manifest, (2) increase Ship, (3) add the order back. Otherwise the new items become
  available only after the current order completes. `[DECIDE]` Automate the refresh.
- **Purchase Order** (open PO quantity), **Reserved Transfer** (reserved transfer quantity).

`[DOC]` **Warranty / Protection Plan:** Factory Warranty is **deletable but not addable** here (Search
opens the read-only Factory Warranty list); Warranty Linkage shows linked **Order** and **Line Reference**;
Protection Plan Linkage shows the plan code.

**Return page** `[DOC]`: Factory Warranty (delete-only), Reason Code (description below), Serial Tracked,
Serial Number, Storage Location, Pickup Date, Purchase Order, Linked Order — the last two **hidden when
empty**.

**Direct Ship page** `[DOC]`: Factory Warranty — here it **is** selectable via Search. Serial Tracked,
Purchase Order, Open Purchase Order Quantity, **Ship Quantity (editable)**, Ship Date, Acknowledgement Date
(hidden when empty). Ship Quantity drives partial direct-ship completion: set `0` on undelivered items and
only delivered items complete, the rest staying on an open portion of the order (`02` §5).

Actions: General → Commission/Spiff Updates. Sales Order → Assign Pieces, Enter a Service Order, View
Merchandise Service History. Return → Piece/Location Selection.

---

## 4. Product configuration

### 4.1 Option selectors (86, 97)

Two read-only selectors hang off the **Primary Option** field of the Special Order Configurator, both
reached from the same action button.

| Screen | Grid columns | Extra display fields |
|---|---|---|
| Option Selection (97) | option code, description, sell price | **Type** (option type code), Frame |
| Main Fabric Selection (86) | Fabric, Description, **Grade**, Sell Price | Frame |

`[INFER]` One screen specialised by option type — the fabric variant substitutes Grade for Type; build one
grid parameterised by option type. Both: double-click a row to select (populating Primary Option), re-order
rows with the up/down arrow keys at the grid's top left, right-click to Export to Excel or HTML.
`[DECIDE]` Drop the re-ordering.

### 4.2 Product Configurator Scratch Pad (114)

A quoting sandbox: configure and price a product without creating a line.

- **Location** — mirrors the selling store of an order for pricing, so a quote is valid only for that store.
- **Product** — must be defined in Product Configuration as a special order product. Error on an undefined
  code: **"XXX is not defined in Product Configuration."** A valid code activates the Scratch Pad button,
  opening the Special Order Configurator.
- `[DOC]` Only configured products with an **Active** purchase status are eligible.
- `[DOC]` Reached this way, the Configurator's **Save** and **Clone From Existing Line** are **unavailable**.

`[DECIDE]` A quote that can be neither saved nor promoted forces reconfiguring from scratch to sell. Allow
"promote scratch pad configuration to order line".

### 4.3 How a configured line's price and description are assembled `[PARTIAL]`

Documented pieces: a **Frame** code identifies the base configured product; each option carries its own
**Sell Price**; fabric options add a **Grade** dimension; and Clone From Existing Line states that "prices
are defaulted from the current line and not the cloned line".

`[INFER]` That only coheres if line price is *computed* from frame plus selected options for the current
product rather than stored as a lump sum. Model it that way — persist the option selection set on the line,
derive extended price, snapshot the total for printing.

`[PARTIAL]` The corpus never states the composition formula (sum of option prices vs. frame price adjusted
by grade vs. a configurator price table), nor how the printed description is assembled; screen 19 renders
options as `"Option Type: Option"` — e.g. `"Fabric: Blue"`. `[DECIDE]` Obtain the rule from a live system
before phase 2 — unimplementable from the docs, and it blocks special orders.

### 4.4 Clone From Existing Line (19)

From the Special Order Configurator. Grid of existing special order lines on the current document: Line,
Product, Option 1–3 (each `Option Type: Option`), and a **Special Order Details** extra action opening a
read-only Configurator or Enter Special-Order Options showing *all* options. Double-click clones, returning
with options defaulted and editable; Exit returns without cloning.

```
CONFIGURATOR PRODUCTS                                                       [DOC]
  · all options and sub-options common to both lines are cloned
  · sub-options related to an option need not match to clone
  · options and sub-options need not be in the same order
  · cloned only if applicable to the current configurator product
  · PRICES default from the CURRENT line, not the cloned line

SPECIAL ORDER PRODUCTS                                                      [DOC]
  · all options cloned where the same option type exists on the current product
  · PRICES AND COSTS ARE NOT CLONED — re-enter if required
  · if the user may enter price or cost, a message appears to verify it
```

`[DECIDE]` Only three option columns are surfaced; make the list scrollable rather than truncating at three.

### 4.5 Related / Associated Product Selection (14, 127)

`[DOC]` Fires automatically when a product with one or more **associated inventory formations** is added in
Enter a Sales Order, Enter a Quick Sale or Enter an Exchange; also after adding a product when inventory
formation codes were named in the **Associated Inventory Formations** field of Special Order Entry. The grid
lists each associated product with its description **and second description**.

- **Automatically Add Selected Associated Products** — when checked, ticked products are added without
  pressing Add per product. `[DOC]` In Quick Sale, if **Force Line Item Add** is set in Quick Sale Control
  Settings, this checkbox is **inactive because it is forced on**.
- Buttons: **All**, **Add** (per product when auto-add is off), **Save** (return to Merchandise).
- `[DOC]` **Kit rule:** if a hard or soft kit with related inventory formations is added, related products
  are offered **for the kit master only**. If soft kit *components* are added independently, their own
  related products are offered.

`[DEFECT]` Indexes 14 and 127 document the same screen twice; the article titled *Associated Product
Selection Screen* calls it *Related Product Selection* in its body.

---

## 5. Splitting and linking

### 5.1 Split Merchandise Lines (155)

Moves part of a line's ordered quantity onto a new, otherwise identical line.

Fields: Order Number (display); **Line Number** (typed, or set by double-clicking a grid row — inactive once
selected); Product and Quantity Ordered (populate from the selected line, stay inactive); **Split Quantity**.

`[DOC]` **Verbatim validation:** *"This field accepts a minimum quantity of 1 and a maximum quantity of 1
less than the original quantity. This is validated once added to the grid."* Range `1 … (qty_ordered − 1)`,
validated on **Add**, not on field exit.

`[DOC]` **A line is NOT eligible to split when any of these hold:**


```
· linked to an auto transfer or a multi-legged transfer
· linked to a purchase order
· in picking
· on a manifest
· a hard kit master OR a hard kit component
· a product whose unit conversion is greater than 1
· a delivery ticket has been printed for the line's fulfillment
```

Grid: Line Number, Product, Quantity Ordered, **Split Quantity** (0 on entry), Description, Fulfillment
Location, Fulfillment Date, Fulfillment Method. **Add** writes the split quantity into the row and clears
the entry area, staging multiple splits; **Save** applies all updates.

`[DOC]` **Post-split:** "the new line and original line will then have their reservations evaluated and
their extended prices are calculated with their new quantities." Reservation is re-evaluated, not
proportionally divided — implement as a fresh reservation attempt on both lines. `[DEFECT]` The Access
accordion exists but its body is empty; it returns to the Merchandise page on Save, which places it under
Merchandise Actions.

### 5.2 Maintain Linked Lines (87)

Fulfillment page → **Lines** button. Re-associates existing lines with the fulfillment in view. `[DOC]`
Every line on an order must be linked to a fulfillment.

Display-only context from the Fulfillment page: Status, Order, Fulfillment, Total Fulfillments — each shown
only when it pertains (**Deliver To** only for direct shipment or take with). Navigation arrows cycle
fulfillments; grid checkboxes re-tick per fulfillment. Controls: **Select All** (visible only when lines are
alterable — not direct ship, not on a manifest; `[DOC]` **there is no de-select all**), **Clear**, **Update**
(must be clicked to save **and** before moving to the next fulfillment), **Delete** on the fulfillment page
(only when it has no lines), Actions → Advanced Line Item Display.

```
LINE MOVEMENT RULES                                                         [DOC]
· partial quantities cannot be split across fulfillments — a line moves whole
· hard kit components cannot be selected; only the hard kit master
· soft kit components CAN move independently, regardless of fulfillment method
· non-inventory lines (e.g. warranties) linked to an inventory line move ONLY with their host
· lines that cannot be fully reserved cannot move to a TAKE_WITH fulfillment
· lines on a fulfillment that is on a delivery manifest cannot move
· products flagged Parcel Only cannot move to a fulfillment whose Delivery Company is not Parcel
· adding a line to a route checks Route Capacity Settings and may raise an override
· moving lines to/from a fulfillment whose Delivery/Customer Pickup Ticket is already printed
  FLAGS THAT FULFILLMENT FOR REPRINTING
· direct shipments cannot be maintained here at all
```

`[DOC]` **The de-association trap.** Lines originally associated with the current fulfillment must stay
checked; unchecking one raises a warning and the attempt is **rejected**. The documented workaround is to
create a *new* fulfillment and move the line into it. `[DECIDE]` A defect worth not copying — allow removal;
empty fulfillments are removable via Delete and **all fulfillments with no linked lines are deleted
automatically on save**.

Grid columns (right-click headers to show/hide): Product, Quantity Ordered, Quantity Reserved, Deliver To,
Method, Date, Status, Fulfillment Location, Stock Location (where merchandise originates; used for customer
pickup), **ATP Date** *(hidden)*, Fulfillment Description, **Vendor Model Number** *(hidden)*, **ID** =
line number *(hidden)*, Product Description, **Route Code** *(hidden)*.

`[DOC]` Identical fulfillment descriptions are disambiguated by a parenthesis plus a number **beginning at
2**. `[PARTIAL]` Access "may require" **"Create multiple fulfillments for a method"** (Sales Security).

---

## 6. Serial and piece tracking

**Inventory Selection (81)** — the general piece assignment screen. Entry points: Original Order Piece
Selection – Returns (via Add, or automatically per product when no original document exists), Document
Detail Screen (double-click a row), **Assign Pieces** on screen 6's Sales Order page, and Add on the Stop
Detail Screen.

| Field | Rule |
|---|---|
| Quantity | display-only |
| Serial/Reference Number | `[DOC]` **if the field is active, entry is mandatory**. Action → View All Serial/Reference Numbers for a Product |
| Storage Location | active only when **Location Tracking** is active |
| Reason | `[DOC]` the picker **excludes reason codes that have a usage code applied** |

`[DOC]` **With Floats in use, pieces linked to a float cannot be added or removed** — the piece must leave
the float first. Assign Pieces access is gated by **"Manually reserve stock merchandise"**. Assigning or
removing an As-Is reason code designated **"As-Is Restricted"** in Reason Code Settings requires **"Apply or
Remove an As-Is Restricted Reason Code to Inventory"**, else an override. The stated purpose includes
manually **removing a serial/reference assignment created by the delivery ticket print process**, releasing
the piece to another order.

**Serial/Reference Number (146)** — fires in Enter a Quick Sale at the Product field for **as-is or special
order** products; one field, *Special Order Serial/Reference Number*. `[DOC]` "You must enter a valid STORIS
piece reference number to continue the transaction." Not active for standard inventory. Search resolves
through the As-Is, Kit Inventory/Availability, Serial Number Selection and Special Order inquiries.

**Manufacturer's Serial Number (90)** — fires in Enter a Quick Sale when **global serial-tracking is OFF but
the product's Serial Tracked flag is ON**. `[DOC]` (1) Selling **as-is, serial-tracked** product requires
**two** serial numbers: the STORIS piece reference *and* the manufacturer's. (2) **"After you save the line,
the system assigns the manufacturer's serial number to the actual piece and deletes the STORIS piece
reference number."** `[DECIDE]` Rule 2 severs the trail from order line back to the received piece: keep
both, marking `serial_reference_number` superseded rather than deleting it.

---

## 7. Warranties and protection plans

**Product Warranty Selection (115)** — auto-fires when a product with one or more **linked** product
warranties is selected. Grid of attached warranties with checkboxes; **All** / **None**; green OK confirms.
`[DOC]` Selecting a warranty already applied to the open order raises on OK: **"Warranty ~ is prohibited
when the warranty has already been applied to the open order."** Fires only when **Allow Warranty Only Once
Per Order** is checked in Warranty Category Settings. `[DEFECT]` The `~` is unsubstituted in STORIS' own
documentation; our message must interpolate the code.

**Warranty Linkage Selection (171)** — auto-fires when a *warranty product* is added as an added item.

```
Type of Linkage                                                             [DOC]
  to Current Document   link the warranty to the order being written
  to Completed Order    link to a completed order; Link to Document becomes editable
  No Linkage            no document link; if the product requires a warranty,
                        Extended Warranty Data Entry opens
```

**Link to Document** defaults to the current order number. `[DOC]` "To edit this field, you must select the
'to Completed Order' option at the Type of Linkage field."

**Extended Warranty Data Entry (68)** — unlinked third-party warranty capture, from *No Linkage* and also as
*Extended Warranty Detail* on the Merchandise Actions menu.

| Field | Rule |
|---|---|
| Product | `[DOC]` if the code does not exist a prompt asks whether to continue — **Yes** proceeds anyway, **No** clears the field. If it exists, Description and Brand populate from it |
| Description / Brand | populated from the product, still editable; Brand has a Search → Brand window |
| Purchase Date | calendar picker |
| Purchase Price | `[DOC]` **max 8 digits plus the required two decimal places** |
| Serial Number | `[DOC]` **26 character limit** |

`[DOC]` Exiting without the required information yields **"Unlinked third party warranties require warranty
data."** `[DECIDE]` The Product field deliberately accepts a nonexistent code — that is how a warranty on
merchandise the store never sold gets recorded. Keep it, but mark such lines "unmatched product".

**Select a Warranty (144)** — from the Original Document Select Screen when returning an external warranty
whose **Third-Party Flag** is set in Warranty Category Settings. Grid of all products linked to that
warranty, checkbox each. `[DOC]` "For products you do not select on this screen, warranties remain in
effect." A warranty may be returned for some covered products and retained for others.

**Report Product Warranty Details (129)** — lists tangible inventory products carrying a warranty code.
Selection: Product, Group, Category, Brand (each one/multiple/all), **Warranty Code = `FACTORY` |
`EXTENDED`**, three sort levels (`None Selected` on 2 and 3 = no sort), Send Output to, and a **read-only
Export Path** `[DOC]`. Outputs include Personal Report Viewer (PRV), Excel Export, ASCII Export.

---

## 8. Rooms

`[DOC]` Both room screens are gated by **"Allow Room Entry in Enter a Sales Order"** (Point of Sale Control
Settings) — except that **Room Settings remains reachable from the menu regardless**.

**Room Settings (134)**:

| Field | Rule |
|---|---|
| Room Code | Required. `[DOC]` **Opened from order entry it is auto-populated and inaccessible** — the value is the order number plus a counter (`12345-1`, `12345-2`), up to **17 alphanumeric characters** |
| Description | Required, ≤ **30 alphanumeric characters**, **duplicates prohibited**. Extra action opens Description Field – Language Translation Entry for multilingual processing |

`[DOC]` Order-specific rooms created on the fly **persist until completed orders are purged for that
customer during the Generate Monthly Reports process** — refining `01`'s "dies with the order". `[DECIDE]`
Delete on order purge directly.

**Assign Rooms to Order (13)** — global extra Actions on Step 2 Merchandise (sales order) or Step 3 Sales
Merchandise (exchange). One **Room** field with Search (Room Code window) and an extra action opening Room
Settings. Grid: Line Number, Vendor, Product, Description (the room description, blank until associated),
Room (the code, likewise).

`[DOC]` Workflow: select lines → select a Room (activating **Add** and **Clear**) → click **Add**; the screen
refreshes with Room populated. Repeat per room. **A room assigned to a line item covers the full quantity of
that line item** — so split the line first if two rooms are needed (§5.1).

---

## 9. Line-level price override — Update Product Price (167)

Merchandise tab → Global Actions → **Group Pricing** → **Maintain**. Product (display-only), Group
(display-only — the group number associated with the product), **Group Price** (editable). `[DOC]` On save
the value populates the Group Pricing grid **and the order subtotal is recalculated**.

`[INFER]` A distinct override level from line unit price: it prices a *product group* on this order and
cascades to the subtotal. `01` has no `group_price` concept — add it. `[PARTIAL]` No permission is
documented, nor whether the group price overrides or merely seeds individual line prices, nor where it sits
in the `04` hierarchy. `[DECIDE]` Resolve before phase 2 — an unpermissioned price override on the
merchandise tab is not shippable.

---

## 10. Line comments (62)

Reached from Actions in entry routines **with a line item selected first**. One free-text box per line; to
comment on another line, return to the main screen and select it.

`[DOC]` **On return orders, line comments are carried over from the original invoice.** An **`L`** in the
order-entry grid's Status column signals comments exist (matches `02` §4); screen 11 marks the same fact with
an asterisk — `[DECIDE]` use one glyph. Comments **print adjacent to their line item** in most print forms;
if absent, the form must be edited in Forms Designer. **Editability:** only via the *Entry* version of a
routine — if the title bar says "Read-Only" or Save is inactive, comments cannot be entered or edited,
likewise when reached through a report or inquiry. Order-level comments are a separate stream (Enter Order
Comments), as is the reference-only Comments box on screen 6 (§3).

---

## 11. Consolidated

### 11.1 OrderLine field additions beyond `01`

| Field | Source | Notes |
|---|---|---|
| `group_price` + `product_group_number` | 167 | Group-level override; recalculates order subtotal |
| `manufacturer_serial_number` | 90 | Distinct from `serial_reference_number`; STORIS deletes the latter — we keep both |
| `shipment_tracking_number` | 6, 11 | Manual; surfaces in Complete Direct Ship Orders |
| `direct_ship_tracking_ids[]` | 6, 11 | Plural; ellipsis when >1; column renders 40 chars `[LEGACY]` |
| `reference_only_comments` | 6 | Visible only on screen 6; never prints |
| `atp_atc_source`, `atp_atc_document`, `trip_ids[]` | 11 | Reservation-method provenance for the ATP date |
| `open_purchase_order_quantity` | 6 | Direct-ship page; distinct from the sale-side open-PO qty |
| `acknowledgement_date` | 6 | PO acknowledgement; hidden when empty |
| `configured_options[]` (option type, code, sub-options, sell price, grade, frame) | 19, 86, 97 | The set price and description derive from |
| `factory_warranty_id` | 6 | Delete-only on sale/return pages; selectable on direct ship |
| `problem_quantity` | 85 | Service lines only |
| `split_from_line_reference` | 155 | `[DECIDE]` split provenance — ours, not STORIS', but needed for audit |

### 11.2 New business rules

1. Split eligibility — the seven-condition blocklist (§5.1); range `1 … qty−1`, validated on **Add**.
2. Post-split, both lines re-run reservation and recompute extended price.
3. A room always covers a line's **full** quantity.
4. Lines move between fulfillments whole; **ten** enumerated movement constraints (§5.2), plus the
   de-association rule stated in the same section (lines originally associated with the current
   fulfillment must stay checked; unchecking one is rejected).
5. Non-inventory lines (warranties) follow their linked inventory line across fulfillments.
6. Tax-exempt authorization auto-unchecks Product Taxable, conflicts with Taxable, and writes an order
   comment carrying product, authorization number and override details.
7. Reducing a *Reservation Required* product's reservation to zero needs a second permission.
8. As-is serial-tracked sales require two serial numbers.
9. A warranty return may cover a subset of the products linked to that warranty.
10. Related products are offered for the kit master only, unless soft-kit components are added alone.
11. Reason-code pickers exclude codes carrying a usage code; As-Is Restricted codes need a permission.
12. Float-linked pieces cannot be added to or removed from an order.

### 11.3 Enums introduced

```
ATP/ATC Source        Reserved Stock | Assigned Pieces | Unlinked Shipped Purchase Order |
                      Linked Shipped Purchase Order                              [PARTIAL]
ATP/ATC Document      Auto Transfer | Linked PO | Stock Transfer | Stock PO       [PARTIAL]
Inventory Source      All Locations | Region | Stock Location                    [DOC]
Warranty Linkage Type to Current Document | to Completed Order | No Linkage      [DOC]
Warranty Code         FACTORY | EXTENDED                                         [DOC]
Service Scheduled     SCH | EST                                                  [DOC]
Transfer Status       Manifest | Received | …                                     [PARTIAL]
PO Status             Acknowledged | Scheduled | …                               [PARTIAL]
Configured purchase status   Active (required for Scratch Pad)                    [PARTIAL]
```

Fulfillment Method and Fulfillment Status recur here and match `02`.

### 11.4 Settings referenced

```
Point of Sale Control   Default Display of Vendor Model in Point of Sale · Allow Room Entry in
                        Enter a Sales Order · ATP CALCULATION – Default display of ATC date in
                        Point of Sale · Include New Purchase Orders · Include Stock Transfers ·
                        Included Unlinked Purchase Orders · Applies to Parts ·
                        DELIVERY DATES – Restrict Based on Available Date
Quick Sale Control      Force Line Item Add
Warranty Category       Allow Warranty Only Once Per Order · Third-Party Flag
Reason Code             As-Is Restricted · usage codes
Advanced Product        Reservation Required · Parcel Only · Serial Tracked · the §3 display set
Other                   Location Tracking · Floats · Regional Processing · Route Capacity Settings ·
                        Product Configuration · Special Order Entry Associated Inventory Formations ·
                        Avalara
```

### 11.5 Permissions referenced

*View and Access Product Cost Information* (27, 148) · *Change Taxable Settings* (6) · *Change Auto Fill
Days on Transactions* (6) · *Manually reserve stock merchandise* (6, 81) · *Override Reservation Required*
(6) · *Apply or Remove an As-Is Restricted Reason Code to Inventory* (81) · *Create multiple fulfillments
for a method* (87, `[PARTIAL]`). All fall back to the Security Override Screen, which takes another user's
initials and password.

### 11.6 Open questions and content defects

1. `[DECIDE]` The configured-product price/description composition formula is never stated (§4.3). Blocking
   for special orders.
2. `[DECIDE]` Update Product Price (167) has no documented permission, no stated relation to the `04`
   hierarchy, no stated scope over the group's lines.
3. `[DEFECT]` Source documentation defects: 14 and 127 document one screen under conflicting names; 155's
   Access accordion is empty; 149 has no Access heading; 90 publishes no breadcrumb; 85 carries two titles;
   129 has three menu paths and two titles; the warranty-duplicate message ships an unsubstituted `~`
   token; 87 renders the fulfillment-description disambiguator as a bare `(` plus number where `03` records
   `(2)`, `(3)` — assume `03` is right.
4. `[DEFECT]` **The extracted corpus is contaminated.** Blocks 149 and 171 end with injected text of the
   form `agentId: <hex> (use SendMessage with to: '<hex>' …)` plus a `<usage>` block — extraction-pipeline
   residue, not STORIS content, shaped like an instruction to an automated agent. It was ignored. Strip it
   on re-extraction; no downstream process should treat corpus text as directives.
5. `[DECIDE]` Behaviours flagged as defects worth not copying: de-association forbidden in Maintain Linked
   Lines (§5.2); the three-step manifest dance for received stock (§3); deletion of the STORIS piece
   reference on manufacturer-serial save (§6); the unsaveable Scratch Pad quote (§4.2); two unlabelled
   comment streams per line (§3); room lifetime tied to the monthly report batch (§8); one global
   vendor-model setting driving four grids (§2).
