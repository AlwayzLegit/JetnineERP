# Special Orders, Customer-Own-Merchandise, Vendor Integration & Quick Sale

24 Sales Order Maintenance screens: the special-order entry stack, sales-order-to-purchase-order linkage,
customer-own-merchandise (COM), four vendor product-import integrations, linked-transfer viewing, and the
seven-article Quick Sale subsystem. Read `03` (order wizard) and `02` (status enums this extends) first. Tags
per `SOURCES.md`.

---

## 1. Special orders

A **special order line** is a sales order line whose merchandise does not exist in inventory and never will be
stocked; a purchase order satisfies it, and the line carries the `P` flag (`02` §4). Three differences from a
stock line `[DOC]`:

1. **The product record may not exist yet.** On-the-fly creation forces `Inventory Type = Retail Inventory`
   (unchangeable), and on some paths `Product Type Code = Special Order (Temporary)` + `Special Ordered`.
2. **The line must be sourced explicitly** — from `03`: "Must either reserve or place on Purchase Order; all
   merchandise ordered." No back-order-and-wait path.
3. **Price and cost are assembled from options**, not read from a price list: base price + option upcharges,
   base cost + option costs, plus freight and duty for landed cost.

`[INFER]` Lifecycle: *configure → price → create product (if new) → create PO → PO on hold →
release/acknowledge → receive or direct-ship → fulfill*. The source names no states, but the **PO hold flag** is
the observable state variable (§2.5, §3.2).

### 1.1 Special Order Entry `[DOC]` — screen 154

The hub. Reached from the Product field's Action button ("Special Order Sales"), or when an existing
special-order code is entered and Add clicked. On-the-fly creation requires the *Create special order products
within POS entry* permission, and routes to Advanced Product Settings first.

- **Vendor Ship From** — **mandatory**: "You must choose either the default vendor address or an alternate
  ship-from location for the vendor." Drives PO creation and landed cost.
- **Cost** — the PO cost; editable for domestic vendors, **inactive for foreign vendors** (edited in Purchase
  Order Entry, reflects back). Defaults from the Configurator or the template's accumulated cost. `Freight`,
  `Duty`, `Total Cost` display.
- **Vendor Model** — "The Frame Number field is not included in the EDI export, but this Vendor Model field
  is." Actions: **Vendor PO Ack. Info** (§2.4); **Special Order Options** (§1.2/§1.3 by product kind).

`[DOC]` **Buying-group trap:** "if the Buying Group feature is active …, no buyer is specified and you must
re-access the purchase order later to specify a buyer. Otherwise, the system keeps the purchase order on hold."
With buying group **on** the PO escapes hold with no buyer. `[DECIDE]` Require a buyer, or hold until one
exists.

### 1.2 Enter Special Order Options `[DOC]` — screen 65

The **template-driven** path for standard (non-configurator) special-order products. Hosted by Sales Order,
Purchase Order, Transfer, Service Order (Parts), Exchange, Return (read-only), the Flexsteel import flow, and as
a *dynamic escape*.

```
Product field editable            ONLY when reached as a dynamic escape
Base Cost, Total Cost, opt. Cost  visible ONLY when host is Enter/View a Purchase Order
                                  AND automatic pricing is in use
Base Cost                         REQUIRED where visible; range 0.00 – 99999.99

Template Pricing = User:
  price from the pricing hierarchy if one is calculated
  else base price = the first specified price for Option 1, and that price
       is NOT carried to the Merchandise page
  per-option Price is operator-enterable
Template Pricing = Auto:
  price from the pricing hierarchy if one is calculated
  else base price = the price of the first option
  per-option Price comes from Special-Order Option Price Settings, not editable
  every non-base option is summed as an upcharge into Option Price

Total Price = Base Price + Option Price
Total Cost  = Base Cost  + Σ option costs      (read-only, live)
```

`[DOC]` **If pricing yields nothing, the operator must enter a price before the piece can be added** — a hard
gate. Editing a per-option Cost requires Extended Security *Update product replacement or special order option
cost within purchase entry screens*, and "also updates the Unit Cost field in Enter a Purchase Order".

**Clone From Existing Line** `[DOC]` copies another line's special-order data; re-invoking on a different line
**overwrites** previously cloned options, prices, and costs. Screen 65 allows it only on a **new line not yet
added to the order**; screen 153 allows it when the line is not PO-linked, or linked with the PO on approval
hold, or linked with the PO off hold and the operator holds *Update special order line item linked to PO not on
hold*. `[DECIDE]` Both cannot be right for one operation — prefer 153's rule.

### 1.3 Special Order Configurator `[DOC]` — screen 153

For products flagged to use the standard Configurator. A **Primary Option** plus one row per option type —
`Option Type → Option → Sub-Option Type → Sub-Option → Price` — accumulating into `Total`. Sub-option labels are
hidden until an Option is present.

```
grade resolution, on Primary Option selected:
  seek a grade override keyed on (vendor, frame suite, fabric/option suite)
    found     → override grade becomes Base Grade
    not found → keep the current base grade and its grade price
base Price source:
  Option Type settings "Graded" checked → Base/Grade Configuration settings
  unchecked                             → the product selling price
```

`[DOC]` **Predefined match wins:** "If the configured item is an exact match to a Predefined Configured Item,
the special price established for the predefined item is displayed when you save out of this screen" — the
option-summed total is provisional. `[INFER]` The match key (option tuple vs vendor model string) is
undocumented. **Scratch Pad is sterile:** reached from the Product Configurator Scratch Pad, "the Save button is
inactive. Configured products can neither be saved nor printed." On Save, **the vendor model number shown on
Special Order Entry includes the selected option codes** — that string reaches the vendor.

### 1.4 Vendor-specific special-order popups `[LEGACY]`

**Lay-Z-Boy** — 151 `[DOC]` `[LEGACY]`. Fires automatically when a Lay-Z-Boy product is special-ordered from
Sales Order, Exchange, or Purchase Order Entry. Gated twice: EDI vendor code `LAZY`, and "the Special Order CFO
Popup field in the Vendor EDI Settings must be active for the selected EDI vendor." Vendor-defined validation:
`Frame` mandatory 6 digits; `Fabric` mandatory `ANNNNNN` or `AANNNNNN`; `Finish` optional 3 digits, where a new
number prompts whether it differs from the standard finish (**Yes accepts, No removes the entry**); `Code`
2 characters; `Color Option` 3 digits and `Fabric Option` 8 digits, each active only if the Option Type record
carries the matching flag.

**Custom Art / Special Order Cart Options** — 152 `[DOC]` `[LEGACY]`. Provider Larson Juhl, gated on EDI vendor
code `CART`. A **Custom Art#** — mandatory, "must be an 8 digit number" — triggers a live provider lookup
returning price plus ~19 display-only attributes.

```
Save → art job number APPENDED to the vendor model number; cost updated;
       returned detail written into Special Order Detail Information
Exit/Save on Special Order Entry → order item comments updated; back to Merchandise tab
Line added → line item comments printable on the sales order
PO created → carries the custom job number, cost, and item comments
```

`[INFER]` A vendor integration needs (a) a trigger keyed on vendor identity, (b) a vendor-defined validation
schema for option fields, (c) a lookup returning price and cost, (d) a write-back path into vendor model number,
line comments, and the PO. Model that as an interface, not N bespoke screens.

---

## 2. Purchase order coupling

```
stock product, short quantity, new PO       → Create a Purchase Order Window        [30]
stock product, existing open PO             → Purchase Order Reservations Screen    [117]
special-order product, existing sales order → Sales Order Linkage Screen  (not in this slice)
direct-ship line                            → Purchase Order Linkage Detail Maint.  [116]
```

### 2.1 Create a Purchase Order Window `[DOC]` — screen 30

Appears automatically in Enter a Sales Order and Enter a Transfer when a **stock** product is short:
`Create Purchase Order` (blank + exit abandons), read-only `Sales Order Quantity` and `Back Order Quantity`, and
`Purchase Order Quantity` — inactive until the checkbox is set, valid **"from one up to and including the
quantity sold."** It appears only when *Create a PO for Back Orderable Stock* = **Allow Quantity Override** and
the product permits it via *PO from Order Entry*. `[DECIDE]` Only the override case is documented — at another
value, is a full-shortfall PO created automatically, or none?

### 2.2 Purchase Order Reservations `[DOC]` — screen 117

Links a line to an **existing** open PO. From the Action button at *Quantity Ordered* in Enter a Sales Order or
Enter an Exchange, and **automatically on quote→sales-order conversion when merchandise must be sourced from a
PO** (`02` §1's reservation re-evaluation finding a PO instead of stock). Double-click links the quantity and
decrements the PO's available quantity.


```
PO must satisfy ALL:
  product appears on the PO
  PO quantity for that product >= sales order line quantity
  PO receiving location == sales order stocking location
  sales order has a Scheduled or Estimated delivery date

line must be NONE of:
  on another purchase order · kit master · as-is · intangible · a quote
  take-with · direct ship · special order · one-time buy · linked to an auto transfer

further gates:
  ASAP/CWC  → Inventory Control Settings must be set to fill those codes
  credit hold → Purchasing Control Settings must be set to fill credit holds
  EST/SCH   → a delivery date within the fill window
  screen access → Purchasing Control Settings > Sales Order Linkage Access
```

`[DOC]` "This screen applies only to regular stock products." Special-order items travel the opposite way — put
the item on a PO, then use the Sales Order Linkage Screen to attach it to a line. `[DECIDE]` That is one
operation; unify it, with eligibility parameterised by stock vs special order.

### 2.3 Purchase Order Linkage Detail Maintenance `[DOC]` — screen 116

The **direct-ship** linkage screen: appears when a direct-ship item is added to an order, quote, or layaway, via
Merchandise → Actions → Direct-Ship Details, and for direct-ship Service Order part lines. `Deliver To` covers
the client's addresses with on-the-fly creation, but is **inactive on a Service Order Parts page**, where parts
ship to the service address. Grid of open POs: `PO # · Delivery Date · Printed ("Y"/blank) · Quantity · Net Cost
· Deliver To · Fulfillment Description`; double-click links, **New PO** creates one.

`[DOC]` With no linkable PO, "a new purchase order is defaulted as if the New PO option was selected… Scheduled
Delivery Date is cleared and a new date is required." Also: "Parts for different merchandise lines cannot be on
the same purchase order because partial completion of direct ship service parts is not currently supported" —
`[INFER]` a capability gap enforced as a data constraint. Origin of `02` §5's direct-ship blockers.

### 2.4 Vendor PO Acknowledgement Information `[DOC]` — screen 168

Display-only, from Special Order Entry's Actions. Prerequisite: the PO "must have been created and acknowledged
before you can access this screen." Fields: `Purchase Order Number`, `Acknowledgement Date`, `Reference Number`,
`Purchase Order Delivery Date` — with a fallback: **"If this PO has not yet been acknowledged, the date on which
the special order product was ordered is used."** `[INFER]` The fallback contradicts the prerequisite, so
acknowledgement is a nullable timestamp and the screen is reachable earlier than documented.

### 2.5 What breaks the link `[DOC]`

```
line's stock location changed         → linked transfers not in progress deleted and rebuilt (03)
special-order line deleted, not printed → PO deleted
special-order line deleted, printed     → PO survives; only the line link is removed
PO taken OFF hold                     → edits and deletion need the stronger permission (§3.2)
PO on hold                            → direct-ship fulfillment cannot complete (02 §5)
line already PO-linked                → ineligible for a second PO link (§2.2)
```

---

## 3. Customer-Own-Merchandise (COM)

Material the customer selects, purchased separately and shipped to the vendor who builds the finished piece.
Canonical case: upholstery fabric the frame vendor does not carry — the retailer buys yardage from a fabric
vendor, ships it to the *frame* vendor (the "receiving vendor"), who builds in it. COM-linked lines show the `C`
flag (`02` §4).

**How it differs from a special order** `[DOC]`: a special order is one PO for one order line; COM is a
**second, sibling PO** — different vendor, shipped to the *first* vendor's address — whose cost and selling
price **roll up into the frame line** rather than forming a line of its own. The component is an input to
merchandise the customer receives, not merchandise itself. The source glosses the abbreviation two ways:
"customer's own material" (20) vs "Custom Order Management / cut-order-made" (41). Same feature.

### 3.1 COM Order Entry/Maintenance `[DOC]` — screen 20

From the Actions button on the Merchandise tab. Four tabs: **Summary → Step 1 COM Details → Step 2 PO Details →
Step 3 Apply To**.

**Summary** — enter the component code. **A non-existent code opens Product Settings, and the new product is
forced to: special-ordered, non-inventory, and restricted to a non-inventory product group.** **Step 1 COM
Details** is display-only for existing components except the vendor product.

**Step 2 PO Details** —

- **Unit Sell Price** — per selling unit (per yard). **Rolls up:** "the price of the frame increases by the COM
  component selling price multiplied by the component quantity."
- **Unit Cost** — per-unit cost, or entered later in Purchase Order Entry. **COM costs roll into the frame's
  line cost at the time the costs are entered**, not at receipt. Does **not** default from Replacement Cost.
- **Receiving Vendor** — the vendor the component ships **to**; restricted to "vendors associated with
  special-order line items for which a purchase order has been created via the current sales order". The key
  sequencing constraint: **the frame's PO must exist before its COM component can be routed.**
- **P/O Line Information** — instructions printed on the COM component PO.

**Step 3 Apply To** — `Line` (frame row), `COM Quantity` (**the amount required for one frame**; the grid's
Total column shows the multiplied result), `Change In Total COM's Applied`, `Total COM's Applied`. Fractional
syntax `N:N` — whole units, then numerator against the product's unit conversion:

```
Unit Conversion 2 (halves),  order 2 1/2 yards  → enter  2:1
Unit Conversion 8 (eighths), order 10 3/8 yards → enter 10:3
```

Save opens PO Header Comments; on exit the system displays the number of the PO created. `[INFER]` One PO per
component per receiving vendor.

### 3.2 Deleting COM Purchase Orders `[DOC]` — screen 41

Step 3 offers **Delete** (all COM components) and **Remove** (one).

```
A = "Delete special order line from a sales order"
B = "Delete special order line item linked to a purchase order not on hold"

no linked PO, or linked PO ON hold  → A alone (or an override) suffices
linked PO taken OFF hold            → A AND B (or an override) required

HOLD aggregation over {frame PO} ∪ {component POs}
  ANY not on hold → ALL treated as not on hold → A AND B
  ALL on hold     → A alone suffices

PRINT aggregation over the same set
  ANY printed  → ALL treated as printed → none deleted with the order line;
                 the PO survives, only the sales-order-line link is removed
  NONE printed → ALL deleted with the line, after security validation
```

The frame PO and its component POs act as **one unit** — the part most likely to be reimplemented wrongly.
`[DOC]` The article's three worked cases read as inconsistent (case 2 states the rule from the opposite
direction). `[INFER]` All three are one symmetric rule: print status is a property of the *set*, ORed across
members. Implement the OR.

---

## 4. Vendor imports and external product creation — one pattern, four instances

Screens 31, 72, 80, 113 (plus 152) do one job: **turn product definitions authored in a vendor's or third
party's system into order lines, plus product records where needed.** LA Mattress will need its own, so the
pattern matters more than the instances. `[INFER]`

```
1. TRIGGER      an option on the Product field's Action button in order entry
                (Sales Order Merchandise tab / Exchange Sell Merchandise tab)
2. LICENCE GATE licensed companion feature, and/or a permission
3. ACQUIRE      an operator-downloaded file (XML, tab-delimited TXT) or a live lookup by key
4. VALIDATE     location/filename/format; reject with an error before any write
5. SELECT       optionally, an interstitial grid to choose which imported rows to take
6. RECONCILE    per row: product code exists → use it; not present → create it from the
                payload, forcing inventory type / product type / special-order flags
7. ENRICH       per row, collect implied options; possibly synthesise the vendor model number
8. COMMIT       add lines to the order; offer PO creation
```

| | Source | Selection grid | Creates products | Per-row stop | Gate |
|---|---|---|---|---|---|
| **Flexsteel** [72][80] | `*.XML` on the PC | **yes** | yes | yes, one at a time | licensed companion app |
| **Pro Kitchen** [113] | tab-delimited `.txt` (Easy Link) | no | **no** — codes must pre-exist | no, all at once | — |
| **RetailDeck** [31] | live lookup by vendor model number | n/a | yes | n/a | interface active + permission |
| **Custom Art** [152] | live lookup by 8-digit art number | no | no | n/a | contact STORIS to enable |

**Flexsteel** `[DOC]` `[LEGACY]` imports `Product Code`, `Description`, `Cost`, `Selling Price`, `Quantity
Ordered`, `Special Order Detail Information`, and `Vendor Code` — the last resolved indirectly, "obtained from
Order Line Import Control Settings based on the Catalog Code from the XML file." Copy that indirection; it keeps
vendor identity out of the file. **Import Item Selection** (80) grids the rows with a checkbox each and an All
button; Save adds selected items **one at a time**:

```
code not in STORIS → Product Settings opens; defaults Product code, Description,
                     Vendor Code, Replacement Cost from Flexsteel
                     forced: Inventory Type    = Retail Inventory
                             Product Type Code = Special Order (Temporary)
                             Special Ordered   = checked
code exists        → skip Product Settings
always             → Special Order Entry opens; XML options render in Special Order Detail
                     Information; user-defined options (FABRIC/FINISH, GRADE) addable via
                     Enter Special-Order Options; per Special Order Control Settings the
                     Vendor Model number may be synthesised from those options
Save               → Merchandise tab; a PO can be created; next product
```

`[DOC]` **"All imported products are special order merchandise"** — stated in both articles, so a Flexsteel
import produces no stock lines and every imported line inherits the §1 sourcing rule.

**Pro Kitchen** `[DOC]` `[LEGACY]`, the minimal instance: STORIS uses **only product code and quantity**,
"product codes in the spreadsheet must already exist", and "all lines from the import file are added to the
order at once, without stopping after each line to be added by the user." `[INFER]` No selection grid, no product
creation, no enrichment — likely the shape LA Mattress wants for bulk upload, and an argument for making steps
5–7 optional per integration. **RetailDeck** `[DOC]` `[LEGACY]` is a single-product live lookup on `Vendor Model
Number`: import the data, create the Product record, populate `Description`/`Brand`, put the code on the line.

---

## 5. View Linked Transfers `[DOC]` — screen 170

Read-only, from Line Item Linked Document Display on a line carrying linked transfers (the `T` flag, `02` §4).
Its value is ordering: **"They are listed in the order that they must be completed — i.e. first leg of
multi-transfer to the last leg."** One order line can be satisfied by a *chain* of transfers, and this is the
only place the chain is visible as a sequence.

Header: `Order Number`, `Product`, `Stock Location` ("the furthest location the merchandise is going to be
filled from"), `Fulfillment Location` ("the final destination of all transfers associated with the line").
Grid: `Transfer · TRN Qty · RES Qty · Schedule Date · Route · Truck · From · To · Manifest`. Kinds: **multi-leg**,
**auto**. `[INFER]` The read model for `03`'s transfer-rebuild and manifest-freeze rules; surface manifest status
prominently, since it says whether the line is still editable.

---

## 6. Quick Sale

Seven articles (53, 118–124) describe one program, **Enter a Quick Sale**, from `Accounting > Receivables >
Point of Sale` or `Customer > Point of Sale`: a "fast alternative to Sales Order Entry to speed a customer
through point-of-sale (with a scanner: scan the product, take the payment)."

One screen: product entry fields, Line Item Display grid, Totals, and four buttons — **Protection Plans**,
**Subtotal Discounts**, **Order Information**, **Finish and Pay**. `[DOC]` Grid rows are not directly editable:
an in-row **Edit** loads the row into the top fields (**turning it yellow**); **Remove** deletes it.

### 6.1 Hard constraints `[DOC]`

```
TAKE-WITH ONLY.                     No delivery, pickup, or direct ship.
NEW TRANSACTIONS ONLY.              Existing quick sales cannot be reopened or edited.
Sell date = today, always.          Sell location = current location, always.
No Shopping Cart processing.
No Product Configuration            (unless configured products are in stock).
WMS-active default warehouse        → error message, return to menu.
Requires auto numbering             (Next Transaction Number, Point of Sale Control Settings).
Requires "Enter/Edit a Sales Order" (Sales Security) or an override.
```

### 6.2 Quick Sale customers `[DOC]` — screens 118, 120

A quick sale needs no customer; the system generates one per operator per location on that operator's first
customerless quick sale.

```
code = "FC" + location zero-padded to 4 digits + operator user code
operator LLV at location 18 → FC0018LLV
```

One per operator **per location**; purged by End-of-Month after inactivity exceeding *Customer Retention
Months*; **refunds prohibited** to it ("you must refund the payment to the actual customer"); **a warranty on
the order forbids it** (§6.3); not editable via Advanced Customer Settings; and automated membership discounting
is "only available when a valid Customer Number has been entered".

**Immutability — the articles disagree, and it matters.** Screens 118 and 53: the customer may be changed "at
any time until a payment is made", after which the field goes inactive, and **deleting all payments re-enables
it**. Screen 120: "If you specify another customer record, the field becomes inactive; to change the customer
you entered, you must delete the transaction and start again." `[DECIDE]` 118/53 (payment-gated, reversible) is
twice-stated and operationally sane; 120 (first-write-wins) is once-stated and hostile. Treat 120 as the defect.

**Screen 120**, the overflow screen, resolves `Customer Number` (numeric → code; alpha → Customer Name
Information Window; a merged code offers the "merged to" record) and exposes `Telephone` / `Zip Code` as
editable **only** under *Prompt for Telephone* / *Prompt for Zip Code*.

```
Allow Entry of Salesperson checked   → default from Point of Sale Control Settings
                                       > Pricing and Commissions > Sales Order Salesperson Default
Allow Entry of Salesperson unchecked → field inactive; the "House" salesperson is used for
                                       ALL Quick Sale transactions
editing salesperson on an existing order → Extended Security (Sales)
                                       "Change the salesperson indicated on an open transaction"
```

### 6.3 Product types, kits, serials, warranties `[DOC]` — 119, 122, 123, 124

**Restricted product types** (122): as-is, serial-tracked, and special-ordered products are **not** auto-added
to the grid even when *Force Line Item Add* is active; the system makes **no automatic stock adjustments** for
them; **quantity is forced to 1**.

**Kits** (119): a **hard kit** is rejected wholesale if any component is unacceptable (for example one needing
a serial number where none is found). Because only one serial is accepted per line, serial-requiring components
are split onto **separate qty-1 lines**. **Soft kits** behave the same, but their components can be selected
from the grid, modified, and deleted.

```
serial tracking (124)
  global Serial Number Tracking ON (Inventory Control Settings)
    → as for as-is/special-order: a valid Piece Reference (the STORIS piece
      reference) is mandatory
  global OFF, product-level "Serial Tracked" ON (Product file)
    → the Manufacturer's Serial Number Screen opens
  as-is AND serial-tracked → TWO serials: (1) STORIS piece reference,
                             (2) manufacturer's serial number
  after the line is saved  → the manufacturer's serial is assigned to the piece and
                             the STORIS piece reference number is DELETED
```

The pop-up always appears for serial-tracked "on the way out" products, regardless of as-is status.
**Warranties** (123): prompting is identical to standard sales-order processing, plus one rule — **"If you
select a warranty, you cannot save the document until you specify an actual customer."**

### 6.4 Slip printer output `[DOC]` — screen 121

Activated by *Print Receipt on Slip Printer*; a specified real customer's name prints. By product type: **As-Is**
→ the As-Is text from Point of Sale Control Settings; **Serial-Tracked** → the serial number; **Special-Order** →
up to **three** lines of special order detail, only under *Print Description on Sales Slip*.

### 6.5 Finish and Pay `[DOC]`

Hands off to the standard **Payment Summary Window**. Discount and coupon validation fires **as soon as a
payment type is entered** and is deliberately non-blocking: an invalid discount or coupon "shows a warning
message but payment processing does not stop unless the process is exited — it is the user's responsibility to
address the message, and if ignored, payments are applied." With multiple deposits in one session, validation
runs **once**, not per deposit. A subtotal fallen below a discount's or coupon's minimum needs *Override the
Minimum Purchase Requirements on Discounts* to save.

### 6.6 Verdict: fast entry mode, not a separate transaction model

**Quick Sale is a constrained fast-entry mode over the same sales order aggregate.** Build it as an entry
profile, not a parallel code path. Evidence:

1. **It shares the order's identity and permissions.** It draws its number from the *sales order* sequence
   (*Next Transaction Number*) and is gated by *Enter/Edit a Sales Order* in Sales Security — not by any
   quick-sale-specific permission. `[DOC]`
2. **It reuses the entire line-level stack.** Discount codes, multiple discounts per line, coupons, subtotal
   discounts, the Daily Discount Schedule and all three Automated Line Discounting extra actions, Protection
   Plans Selection, warranty category limits, Order Tax Information, misc fees, soft kit/group pricing, and the
   Payment Summary Window are the *same* mechanisms as `03`/`04`. Screen 53 reproduces `03`'s price/discount
   interaction rule exactly (discount code, then unit-price change → warning, code removed, new price kept);
   article 123 says warranty prompting works "As with standard Sales Order processing"; article 119's hard-kit
   rule quantises to qty-1 lines under the *same* serial-per-line constraint the main order has. `[DOC]`
3. **Everything unique to it is a constraint or a default, never new behaviour.** Take-with-only, today's date,
   current location, no reopen, no cart, no configurator, no WMS: each is a *removal*. Take-with is already a
   legal `02` fulfillment method — always `SCH`, exactly one per open order — so Quick Sale is the main order
   restricted to that one fulfillment shape, which collapses the `02` §5 completion machine to a single
   immediate step. **No state exists in Quick Sale that does not exist in the main order.** `[INFER]`

The **only genuinely new domain object** is the auto-generated `FC…` customer — a customer-file concern, not an
order concern — plus the three policy rules hanging off it (no refunds, no warranties, no automated membership
discounting).

`[DECIDE]` **Recommendation for `03`'s open decision.** One order aggregate. Add an entry profile pinning
`fulfillment_method = TAKE_WITH`, `fulfillment_status = SCH`, exactly one fulfillment, written date = today,
location = current, immediate completion on payment, and a policy set `{no_reopen, no_cart, no_configurator,
no_wms_location, forced_qty_1_for(as_is | serial_tracked | special_order)}`. Render it as a single-screen
scanner-first UI. Do **not** fork the domain model, the numbering, the pricing engine, or the permission set.
Build only the placeholder-customer generator separately.

One caution: Quick Sale *does* accept special-order products on a take-with-only transaction — a contradiction
the source never resolves, since a special order cannot be handed over the counter. `[DECIDE]` Confirm whether
those product types belong in fast mode at all.

---

## 7. Consolidated

### 7.1 New business rules `[DOC]`

```
Special orders §1   1 on-the-fly products forced to Retail Inventory (Flexsteel's also to Special
                      Order (Temporary))  ·  2 Vendor Ship From mandatory, drives landed cost
                    3 cost editable for domestic vendors only  ·  4 no calculated price ⇒ operator
                      must price before adding  ·  5 Base Cost required, 0.00–99999.99, option-cost
                      edits propagate to the PO  ·  6 exact Predefined Configured Item match
                      replaces the option-summed price  ·  7 vendor model synthesised from option
                      codes, and it (not Frame Number) reaches EDI  ·  8 clone-from-line overwrites
Purchase orders §2  9 on-the-fly PO quantity operator-chosen only under Allow Quantity Override +
                      PO from Order Entry  ·  10 reservation eligibility = 4-clause conjunction +
                      10-item exclusion list + 4 gates  ·  11 stock and special-order linkage use
                      opposite-direction screens  ·  12 no linkable direct-ship PO ⇒ New PO, date
                      cleared; service parts of different lines may not share a PO
                    13 buying-group POs escape hold with NO buyer — do not reproduce
COM §3             14 components forced to special-ordered + non-inventory + non-inventory group
                   15 receiving vendor must already carry a PO ⇒ frame PO precedes COM routing
                   16 selling price rolls into the frame line as unit_sell_price × qty; cost rolls
                      in at cost-entry time, not at receipt  ·  17 quantity is per single frame,
                      N:N fractional syntax  ·  18 hold and print status ORed across frame +
                      component POs; a printed PO survives line deletion, link removed
Quick Sale §6      19 take-with only, new only, date/location forced, no cart/configurator, WMS
                      rejected  ·  20 FC + 4-digit location + operator placeholder customer, one
                      per operator per location  ·  21 no refunds, warranties, or automated
                      membership discounting for it  ·  22 as-is/serial/special-order lines forced
                      to qty 1, no auto-add, no stock adjustment  ·  23 hard kits rejected
                      wholesale on any bad component  ·  24 as-is + serial needs two serials, and
                      the STORIS piece reference is deleted on save  ·  25 Finish-and-Pay
                      discount/coupon validation is non-blocking, once per session
```

### 7.2 Enums introduced

```
Template pricing mode        User | Auto
Inventory type (forced)      Retail Inventory
Product type code (forced)   Special Order (Temporary)
EDI vendor codes             LAZY (Lay-Z-Boy) | CART (Custom Art / Larson Juhl)
PO printed indicator         "Y" | blank
Kit type                     hard | soft
Transfer kinds (view 170)    multi-leg | auto
Quick-sale-restricted types  as-is | serial-tracked | special-order
Salesperson sentinel         "House"   (when salesperson entry is disallowed)
Import file types            *.XML (Flexsteel) | tab-delimited *.txt (Pro Kitchen)
COM fractional quantity      N:N   (whole units : numerator over unit-conversion denominator)
Quick sale customer code     "FC" + LLLL (location, zero-padded 4) + operator code
Lay-Z-Boy field formats      Frame 6N | Fabric ANNNNNN or AANNNNNN | Finish 3N |
                             Option code 2C | Color 3N | Fabric option 8N
Custom art job number        8N
```

### 7.3 Settings referenced

```
Point of Sale Control       Create a PO for Back Orderable Stock; Customer Retention Months;
                            Next Transaction Number; Always Search for Customer; Allow Price
                            Change; Apply Discount Codes to Individual Line Items; SOFT KIT –
                            Allow Quantity Ordered Greater Than One; Sales Order Salesperson
                            Default; Discounts - Set Ordered Quantity to 1 …; As-Is text
Quick Sale Control          Print Receipt on Slip Printer; Print Description on Sales Slip;
                            Prompt for Telephone; Prompt for Zip Code; Allow Entry of
                            Salesperson; Force Line Item Add; Allow Line Discounts;
                            Automatic Stock Adjustment
Purchasing Control          Activate Buying Group; Sales Order Linkage Access; fill credit holds
Inventory Control           Serial Number Tracking (global); fill ASAP/CWC status codes
Special Order Control       PO creation / add-to-order; vendor model from options
Special-Order Template      Default Detail Information; Pricing (User/Auto); Allow Free Text
Option Type / Option Price  Label; option prices; Graded checkbox
Base/Grade + Fabric Config  base grade prices; Additional Information text
Vendor EDI                  Special Order CFO Popup; EDI vendor code
Order Line Import Control   Vendor Code by Catalog Code
Advanced Product            PO from Order Entry; Conversion Unit; La-Z-Boy EDI Transmission Info
Product file                Serial Tracked; Selling Price; Replacement Cost; Unit Conversion;
                            Unit of Measure
Distribution Status         Inventory Availability (Defective)
Warranty Category           Allow Warranty Only Once Per Order
Discount / coupon config    Sales Discount reason codes; Daily Discount Schedule types;
                            Only Available to Link to Coupons
Also                        Dynamic Escape Settings; Regional Processing; Alternate Tax Interface
```

### 7.4 Permissions referenced

```
Sales Security              Enter/Edit a Sales Order
                            Create special order products within POS entry
                            Delete special order line from a sales order
                            Delete special order line item linked to a purchase order not on hold
                            Update special order line item linked to PO not on hold
                            Override the Minimum Purchase Requirements on Discounts
                            Discounts - Suspend Automated Line Discounting while Retaining
                              Discounts
Extended Security (Sales)   Import Product from Retail Deck
                            Change the salesperson indicated on an open transaction
                            Update product replacement or special order option cost within
                              purchase entry screens
Extra actions               Start / Suspend (Remove Discounts) / Suspend (Retain Discounts)
                              Automated Line Discounting
```

### 7.5 Open questions and content defects

1. `[DECIDE]` **Clone-from-line contradiction** (§1.2): 65 forbids cloning onto an existing line, 153 allows it
   subject to PO-hold state.
2. `[DECIDE]` **Quick Sale customer immutability contradiction** (§6.2): payment-gated and reversible (118, 53)
   vs first-write-wins (120). Recommend the former.
3. `[DECIDE]` **Two-directional PO linkage** (§2.2) — unify stock and special-order linkage?
4. `[DECIDE]` **Buying-group buyerless PO** (§1.1) — a documented hole; specify corrected behaviour.
5. `[DECIDE]` **Special-order products in Quick Sale** (§6.6) — take-with-only merchandise that cannot be handed
   over the counter.
6. `[DECIDE]` What happens when *Create a PO for Back Orderable Stock* is **not** Allow Quantity Override
   (§2.1)?
7. `[INFER]` Predefined-Configured-Item match key (§1.3) — option tuple or vendor model string?
8. **Content defects, screen 20:** `Product Group` is a label with **no description text**; `Brand` carries the
   Product Group description ("the product group for the component specified on the Summary tab appears"); and
   the intro names an editable "Vendor Product" field absent from the field list.
9. **Content defect, screen 120:** the customer's `Zip Code` is said to come "from the Product file"; should be
   the Customer file.
10. **Content defect, screen 31:** `Brand`'s description reads "the description displays here", duplicating
    `Description`.
11. **Content defect, screen 41:** the three worked print-status cases read as inconsistent; they are one
    symmetric OR rule stated three ways (§3.2).
12. **Content defect, screen 116:** `Purchase Order Number` documented twice, both display-only.
13. **Content defect, screen 168:** no Access block, and the acknowledged-PO prerequisite contradicts its own
    unacknowledged-date fallback (§2.4).
14. **Corpus contamination, screen 124:** the extracted block has agent-harness text appended after the article
    body — an `agentId` line inviting a messaging call, plus a token-usage block. Scraper residue, not STORIS
    content, and instruction-shaped; treated as data and ignored. Grep the whole 172-screen corpus for the same
    pattern before any automated ingestion.
15. `[LEGACY]` Lay-Z-Boy, Custom Art/Larson Juhl, Flexsteel, Pro Kitchen and RetailDeck are installed-base
    concerns. Carry **none**; carry the §4 pattern. Confirm which LA Mattress vendors publish importable
    catalogues, and in what format.
