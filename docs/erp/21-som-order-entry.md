# Order Entry — Screen-Level Specification

Companion to `03`, which describes the four-step wizard as a shape. This is the layer underneath: exact
activation conditions, verbatim operator text, the Actions-menu inventory, the comment subsystem, and the
auxiliary windows. Nothing in `03` is restated.

Source screens: Enter a Sales Order · New Fulfillment Button · Enter a Shopping Cart · Totals ·
Additional Order Detail · Order Source Entry · Print Options · Document Selection · Sales Margin
Scratchpad · Submodules · Canceled Orders by Salesperson · Access Control Window · Add Escapes to Current
Screen · Is Customer Address Required · Mandatory Order Comments · Enter Order Comments · Enter Exception
Comments · Extended Instructions Text Box · Update Order Comments.

---

## 1. The order-entry screen graph `[DOC]`

Order entry is a hub with roughly forty reachable satellites, most opened from an Actions menu rather
than a visible control.

```
Is Customer Address Required ──► Enter a Customer Name         (pre-empts step 1; §7.8)
Enter a Shopping Cart ──[cart id typed in Order Number]──► ENTER A SALES ORDER

 Step 1 Customer    Step 2 Merchandise    Step 3 Fulfillment      Step 4 Payment
 ├ Order Source     ├ Margin Scratchpad   ├ +New ─► Maintain      ├ Adjust the Net Total
 ├ Order Comments   ├ Exception Comments     Linked Lines         ├ COD Worksheet
 └ Enter Cust. Name └ Line Comments       ├ Totals (per ful.)     ├ Finance Application
                                          └ Additional Ful. Info  └ Payment Summary (`05`)
                                             └► Extended Instructions
 Additional Order Detail · Audit Comments Log ◄─ all four steps
 Access Control (§7.9) · Add Escapes (§7.10) ◄─ any screen

SAVE:  validate ──► Mandatory Order Comments (if configured) ──► Print Options ──► exit
VIEW:  View an Existing Sales Order ──► Document Selection (partial receipts, §7.2)
```

`[INFER]` The satellite count is the design problem, not the design. Expose the frequently used ones
(comments, order source, additional detail, margin scratchpad) as inline panels, not modal chains
reached by memorising a menu.

---

## 2. Header controls and conditional visibility `[DOC]`

| Control | Activation / visibility |
|---|---|
| Order Number | Manual vs auto keying per *Automated & Manual POS Numbers* (Warehouse/Store Location Settings). **Plus** assigns from *Next Transaction Number*. **Enter is honoured only while Plus is highlighted** — a focus trap; `[DECIDE]` accept Enter unconditionally. |
| Order Number → Search | Open Order by Product · Shopping Cart Selector · View Customer's Historical Purchases · View a Customer's Open Orders. Action → Route Calendar. |
| Order Number ← cart id | Typing a **shopping cart id** here converts the cart; one order line per hard kit. |
| Last Order | Hidden on first entry to the process, when entered from the main menu, when the order was completed or deleted, and in read-only. A recalled order remains subject to security. |
| Available Credit · Credit Hold | Display-only; holds released elsewhere (`02` §6). Reward Points and Balance appear only under *Activate Customer Rewards Program*. |
| Step tabs | **Step 3 unavailable until a Customer Number exists**; step 2 needs basic customer data. Direct-ship fulfillments are editable **only on step 2**. |


---

## 3. Step 1 — Customer: validation and conditional activation `[DOC]`

The polymorphic customer field's parse order is in `03`. What `03` omits:

- Phone match requires **exactly 10 digits, no spaces, no special characters** — punctuation is not
  normalised. `[DECIDE]` Normalise; today `(555) 123-4567` fails.
- Last-name match is whole-name or *starts with*, per the **Starts With** checkbox in Search for a
  Customer, **checked by default**.
- A code **merged** into another customer offers the "merged to" customer rather than failing.
- Combined name elements are capped at **50 characters**.
- Tax exemption is honoured only when the **ID Expiration Date** (Advanced Customer Settings) is after
  the written date; otherwise tax applies silently. Some RTO plans override.
- **Order Type**: beyond `02` §1, layaway special orders require all four of *Fill Layaway Orders*,
  *(Allow) Layaways*, sufficient inventory, and the items reserved in full. Quotes may carry status `A`,
  `D`, or `T` products; obsolete special orders are barred.
- **Marketing Code 1 / 2** are active only when *First / Second Marketing Code* is **Optional** or
  **Mandatory**; the lookup is filtered by dates in Marketing Code Settings.

**Verbatim prompts on this step**

- `"Order Source must be selected before saving the order."`
- `"Ready to convert Sales Order to a new Layaway Order (or Sales Quote). Continue?"`
- `"Automatically apply membership discounts to this order?"`
- `"This customer has other open sales orders."` — bottom-of-screen bar, **new orders only**, dismissed
  with an X. `[INFER]` Non-blocking; a duplicate-order and upsell cue.

---

## 4. Step 2 — Merchandise: entry mechanics

### 4.1 Field interlocks `[DOC]`

- **Unit Price override inactivates Discount Code**, and Discount Code is inactive whenever an override
  is present. Discount Code is active only if the product is flagged Discountable **and** *DISCOUNTS –
  Apply Discount Codes to Individual Line Items* is checked.
- **As-Is** activates and then *requires* Serial/Reference Number; an as-is **kit master** needs every
  component present at the specified stock location. Prohibited on quotes and layaways.
- **Serial/Reference #** is inactive with no serial; an ellipsis marks multiple.
- **Room** is visible only under *Allow Room Entry in Enter a Sales Order*. Rooms created on the fly are
  deleted with the order **unless it was partially completed**, in which case they persist until
  completed orders are purged for that customer by the monthly report process (`22` §8 has the deeper
  read and supersedes `01` here). Not available in carts.
- **Stock Location defaults by method**: Take With → selling store · Direct Shipment → null and inactive ·
  Delivery → *Delivery Locations – Stock Location* · Customer Pickup → *Customer Pickup Locations – Stock
  Location*.

### 4.2 Special-order price variance `[DOC]`

`03` gives the general formula; special orders compute the *base* differently.

```
base = Advanced Product Settings price + option upcharges
no base price ⇒ price = sum of option upcharges (auto- or user-priced),
                else the operator must key Unit Price manually
as-is special order ⇒ price comes from the Unit Price prompt
no check when discounted == original, or original is null
limit: Special Order Variance % (POS CS or Warehouse/Store Location Settings)
       or Variance % (Advanced Product Settings); all blank ⇒ no check
```

Breach raises one of three configured responses — *Variance Exceeded Alert*, *Reason Required*, *Comment
Required* — the last opening **Enter Exception Comments** (§6.3).

### 4.3 The Actions inventory `[DOC]`

Each step carries its own Actions menu, right-click menu, and per-field Action buttons.

**Step 2 Actions** — Add Attachments · Additional Line Item Details · Additional Order Detail ·
Advanced Line Item Display · Assign Pieces · Assign Rooms to Order · Audit Comments Log · Convert Line to
Direct Ship *(from Customer Pickup/Take With/Delivery only; blocked for warranties, no-direct-ship,
intangible, obsolete, one-time-buy, as-is, PO-linked and auto-transfer-linked lines)* · Costed Line Item
Display · Customer's Own Material (COM) · Direct Ship Details · Edit Attachments · Enter a Discount on
Multiple Lines · Extended Warranty Detail · Group Pricing · Line Comments · Line Item Linked Document
Display · Line Stock Availability · Prep Codes · Price/Spiff/Commission Table · Product Benefit Inquiry ·
Purchase Order · Protection Plan Selection · Remove All Price Overrides and Discounts · Sales Margin
Scratchpad · Split Merchandise Lines *(only while the companion area is inactive)* · Start Automated
Line Discounting · Suspend Automated Line Discounting – Remove Discounts · Suspend … – Retain Discounts
*(needs the retain-discounts permission)* · Toggle Line Display · View Attachments · View Discount
Schedule Applied to this Order · View Linked Transfers · View Order Discounts · View/Edit Exception
Comments. Right-click: Add Escapes · View Kit Product Details · View Product Availability.

**Product-field Action** (importers/configurators — `[DECIDE]` almost certainly out of scope here) —
2020 Spaces Import · Choose Substitutions · Create New Product · D-Tools Import *(inactive without the
D-Tools module)* · Flexsteel Import · PreVue Easy Order Configurator · PreVue Import · Pro Kitchen
Import · Retail Deck Product · Special Order Sales. **Unit-Price Action** — Remove Price Override and
Discounts · Trade Pricing and Discounting. **Discount-Code Action** — Coupon Code Entry · Enter Multiple
Discounts Per Line · Override Discount Amount.

**Step 1 Actions** — Add Attachments · Additional Comments · Additional Order Detail · Assign Payment
Terminal (EMV) · Audit Comments Log · Custom Order Information · Edit Attachments · Enter Customer Name ·
Miscellaneous Fees · Order Source Entry · Order Tax Information · Print Cumulative Sales Order and Print
Order *(completed only)* · Trade/Designer Information · Update a Customer Address · View Attachments ·
View Signature *(completed pickup orders, printed ticket)*. Right-click: Add Escapes · Customer Buy History Inquiry · Customer Profile · Gift Certificate
Inquiry · Kit Inventory/Availability Inquiry · Open Order by Customer Inquiry · Purchase Order Inquiry ·
Special Order Inventory Inquiry · Warehouse Stock Inquiry.

**Step 3 Actions** — Additional Order Detail · Advanced Line Item Display · Audit Comments Log · Create
New Deliver To · Line Item Linked Document Display · Toggle Display of ATP/ATC Dates · Recalculate
Delivery Charges *(hidden unless One Delivery Charge Per Order)* · Remove Delivery Override Flag ·
Remove Handling Method Override. Date-field Action: Override a Capacity Date · Select a Fulfillment
Date. Buttons: New · Delete *(no-line fulfillments only)* · Totals · Lines · Additional Information.

**Step 4 Actions** — Add/Edit/View Attachments · Additional Order Detail · Adjust the Net Total ·
Advanced Line Item Display · Audit Comments Log · COD Worksheet *(delivery orders with a debit exchange
only)* · Finance Application · Finance Payment Estimator · Minimum Deposit By Line · Miscellaneous Fees ·
Order Tax Information · Revolving Payment Estimator · Trade Designer Information. Right-click: Add
Escapes · Open Item Receivable Inquiry.

### 4.4 ATP/ATC display and reservation prompts `[DOC]`

Which date shows is driven by *Default display of ATC date in Point of Sale*; values are **written to the
audit comments log on save**. *Restrict based on available date* forces a security override to schedule a
line or order earlier than its ATP/ATC date. Unchecking all three of *Include New Purchase Orders*,
*Include Stock Transfers*, and *Include Unlinked Purchase Orders* removes **both date fields, the grid
column, and the Toggle Display action** — config that silently deletes UI.

```
"NNN Currently Available; NNN Net On Order. Do you want to create a purchase order.  Yes  No."
   ▼
"Stock available - Reserve Stock for this order?  Yes  No  Cancel."
   ▼ (neither chosen)
"Must either reserve or place on Purchase Order; all merchandise ordered."
```

Also verbatim: `"Product on this line must fully reserve and there is not enough quantity available to
reserve the line."` and `"Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?"`
(Yes needs *Override capacities when scheduling routes that are full*; No adds the line **unscheduled**).

---

## 5. Step 3 / Step 4 surfaces owned by this file

### 5.1 New Fulfillment button (+New) `[DOC]`

Distinct from **Fulfillment Selection** (covered in `03`). Creating a fulfillment here links **no** lines
— they are attached afterwards through **Lines** (Maintain Linked Lines).

| Field | Default on invoke |
|---|---|
| Date | Delivery and Customer Pickup only. Take With defaults to today, field **inactive**. |
| Status | Take With → `SCH`, inactive. Delivery → the *Delivery* field, Customer Pickup → the *Pickup* field, both in Fulfillment Details, Logistics page, POS CS. |
| Fulfillment Location | Delivery → Stock Location · Customer Pickup → Pickup-From location (both allow multiple per order) · Take With → the step-1 Store · Direct Ship → the item's Vendor, read-only. |
| Method | The step-1 Method, changeable. **Without Multiple Concurrent Fulfillments the default derives from existing methods — an already-present method is not re-defaulted.** |
| Deliver To | The Deliver To shared by all existing fulfillments, else the customer's primary. Changeable. |

Only one Take With fulfillment may exist per open order; a second cannot be created — **except** to be
changed to Delivery or Customer Pick Up. `[INFER]` Allow creation but treat it as invalid until
re-methoded. New fulfillments append in creation order, then **re-sort on save and refresh**; `[DECIDE]`
the unstable ordering is a defect.

**Deliver To options**: *Billing* (default when no primary exists) · each Deliver To Settings description ·
*Other* (current fulfillment only; two "Other" addresses consolidate only when Name, Address 1, Address 2,
City, State **and** Zip match exactly).

### 5.2 Totals (per fulfillment) `[DOC]`

Step 3's **Totals** button. Scope is one fulfillment, never the order.

| Field | Editable | Note |
|---|---|---|
| Merchandise Subtotal | no | Includes linked lines such as warranties. |
| Discounts | no | Global discounts allocated to this fulfillment. |
| Delivery Charge | conditionally | **Delivery and Direct Ship** fulfillments, when *Apply to Direct Shipments* is checked in POS Control Settings. |
| Installation Charge | conditionally | Delivery only; sum of linked-line installation charges. Edits affect this fulfillment only. |
| Miscellaneous Fees · Sales Tax | no | Each computed separately per fulfillment. |
| Net Total | no | — |

Beyond `03`: installation charges may also derive from the **Product Group**, and moving a line **moves
its installation charge with it** — except, verbatim: *"If a line is moved from a fulfillment where the
installation charge was overridden to a fulfillment that is not, the installation charge on the new
fulfillment increases based on that line. The installation charge on the old fulfillment remains the same
as it was overridden prior to the move."* `[DECIDE]` This leaks money — the source keeps charging for a
line it no longer has.

### 5.3 Step-4 items not in `03` `[DOC]`

- **Merchandise Subtotal is editable** only when *DISCOUNTS – Apply to Sales Order by Adjusting Subtotal
  Amount* is on **and** *Maximum Subtotal Discount %* is zero or null. Subtotal Discount Code needs *Apply
  Discount Codes to Subtotal*; the aggregate may not exceed that maximum.
- `Balance Due = total order amount − (deposits + financing)`. *Minimum Delivery Purchase* (Delivery
  Company Settings) is verified **on Save**.
- **Financing Payment Type Code is inactive when a pre-authorised deposit exists, and a pre-authorised
  deposit is blocked once financing exists** — mutually exclusive.
- The **Signature** checkbox appears only when program/document *Sales Order* is set for manual signatures
  in Configure Document Signature. Check + save + capture clears the `S1` credit hold. Maximum **three
  finance signatures per session**.
- RTO installation charges need *Allow installation charge on RTO orders by state/province* (Finance
  Provider Settings) **and** *Allow Installation Charges on Orders with RTO Plans* (Sales Tax Settings).
- Estimated-status save warning (*Confirm Delivery Status on Save*): **OK** returns to the order to set
  Scheduled; **Ignore** saves unchanged. `[DECIDE]` Inverted labelling.

---

## 6. The comment subsystem

STORIS has **six** comment mechanisms with different scopes, triggers, and persistence. Model them as
one subsystem with a discriminated scope and origin, not six features. `[INFER]`

```
COMMENT
  scope  : ORDER | LINE | FULFILLMENT | ADDRESS
  origin : MANUAL | SYSTEM | FIELD_CHANGE | MANDATORY_CODE | EXCEPTION
  code   : nullable (mandatory-comment codes only)
  body   : free text
  actor  : operator initials (+ authorising user for security overrides)
  at     : date + time
```

### 6.1 Order comments — Enter Order Comments `[DOC]`

Actions button ("Additional Comments" on step 1). Free text, order-scoped, no line selection. Prints on
order forms for most order types; if absent it must be added via **Forms Designer**. Editability depends on
*how the transaction was opened*: the Entry version allows editing; a title bar reading "Read-Only" or
"View" does not, nor does arriving via a report or inquiry. Via COM Order Entry/Maintenance these comments
also populate the **Instructions** field on the associated purchase order.

### 6.2 Mandatory order comments `[DOC]`

Fires automatically when **an existing order is changed and saved**, if *Require Comments When a Sales
Order is Changed* (POS CS) is on. Presents the codes and descriptions from Mandatory Order Comments
Settings; **at least one must be selected before save can proceed**, plus free text if that settings record
has **Manual Required** checked. Results go to the **Audit Comments Log**. Not invoked when converting to
or from layaways and quotes — `[DECIDE]` an exemption that defeats the control, since conversions are
exactly the change worth auditing.

### 6.3 Exception comments — Enter Exception Comments `[DOC]`

Appears when **Comment Required** is set **and** a discount or price override exceeds the variance
percentage from Advanced Product Settings › Pricing, Warehouse/Store Location Settings › General, or POS
CS › Pricing and Commissions. Reachable manually as *View/Edit Exception Comments* from Sales Order and
Quick Sale › Merchandise, Exchange › Sell Merchandise, and Service Order › Parts, Labor and Charges.

Two traps: **the comment attaches to the entire order, not to the line that triggered it** — a second
override overwrites the first justification — and **exiting without entering a comment silently voids
the discount or price override**. `[DECIDE]` Scope the comment to the line, and make the discard
explicit (`"No comment entered — the price override will be removed. Continue?"`).

### 6.4 Line comments `[DOC]`

*Line Comments* on the step-2 Actions menu. Any line comment raises line-status flag `L` (`02` §4).
Order comments cannot substitute; the docs direct the operator explicitly to line scope.

### 6.5 Extended instructions `[DOC]`

Address-scoped delivery text, not an order comment. Reached from the extra Action button at the **Print
Delivery Instructions for this Address** field — Sales Order via step 3's Additional Fulfillment
Information, Return/Exchange via the Customer page. Defaults from Advanced Customer Settings › *Delivery
Instructions for Billing Address* or Deliver To Settings › *Delivery Instructions for this Address*.
Prints on the delivery ticket **only when that box is checked**, under the heading `Extended
Instructions`. For a single fulfillment the separate *Instructions for this Fulfillment Only* field is
used instead.

### 6.6 The audit log — Update Order Comments / Audit Comments Log `[DOC]`

The system of record; entries display in date-and-time sequence. Each carries:

```
date + time · operator initials
system text        e.g. "order created", "order deleted"
field-change text  field name · value before · value after
                   (tracked fields configured in Track Processing Activity)
manual text
```

Reachable from three maintenance paths plus the read-only POS Views › **View Transaction Comments**.
Fields: **Customer Code** — skippable, verbatim *"If the customer number is not known, you can skip this
field and enter the order number at the Sales Order field."* · **Order** · **Update Comments** checkbox,
which activates the entry box and is inactive in any View version · **Comments** display · **Send Output
to** and **Export Path**, changed only through Actions › Output Settings. Actions: Output Settings ·
**Alternate Sale/Return Comments** (exchange documents only — toggles the sale and return halves) · Print
Comments.

Documented limitation: *"If you delete or change orders during the session in which they were initially
entered and have not saved your entries, that activity is not tracked."*

Writers into this log: order create/delete, mandatory comments, ATP/ATC on save, delivery-charge auto-move,
requested-date and tax-exempt overrides, and the address-required disclosures (§7.8).

---

## 7. Auxiliary windows

### 7.1 Additional Order Detail `[DOC]`

Step 1 of Sales Order; Customer or Payment page of Return/Exchange.

- **Customer's PO** — up to **20 alphanumeric characters**, memo only. Also written when *Designer's
  P/O Number* in Trade Designer Information is populated.
- **Builder's Allowance** — active **only** from Enter a Sales Order, editable until invoicing, capped at
  *total invoice less payments and deposits already applied*. Permission-gated.
- **Delivery Information** (Truck, Ship Via, Delivery To, Time) — present **only** from Enter an Exchange
  or Return. **Delivery To** is inactive with no additional deliver-to address. **Time** resolves:
  Logistical Scheduling › Time → Individual Zip Codes › Delivery Stop Time → blank.
- **Postponement counters**, all read-only: delivery and pickup postponements, each as a lifetime total
  and a "while reserved" count that resets at each Automatic Stock Release. `[INFER]` Raw material for a
  chronic-reschedule report; carry them.
- **Receivables** — Terms (from Customer Settings) and **Due Day**, documented as *"the default tax IT
  number, if any"*. `[DECIDE]` Label and description do not match.
- **Other** — Commission Category · **Deposit Hold Back**, the percentage of deposit money withheld when
  orders are **partially shipped**, defaulting from AR Control Settings, permission-gated · Classification ·
  **Price Category**, permission-gated · Maximum Finance Approval (read-only).

### 7.2 Document Selection Screen `[DOC]`

A disambiguation grid shown when one logical document produced several physical ones. From **View an
Existing Sales Order** on a *partially received* order it lets the operator pick the **OPEN** or the
**COMPLETED** portion. `[INFER]` It exists only because partial completion splits an order across
documents (`02` §5); a model keeping the order as one aggregate does not need it.

### 7.3 Print Options Window `[DOC]`

Appears at sales-document print time when *STORIS Server Can Send Emails* (Notifications Control Settings)
is on, whenever printing receipts, and as the terminal step of a successful cart save.

- **Print / Email / Digital** checkboxes; any may default checked from POS CS › Printed Documents.
  **Digital** is visible and active only when the Digital Receipts Interface module is active **and**
  *Digital Receipts Enabled* is checked for the login location.
- **Sort Items By** — default from *Sales Order Print Sort By*; **inactive for payment receipts**.

```
Line Number    order as shown on the entry screen (default); Total Rooms inactive
Room           group by room, secondary sort line number; unavailable if no merchandise
               on the order has a room; activates Total Rooms
Group Pricing  group by group pricing
Fulfillment    group by fulfillment method — POPULATES THE FIRST LINE ONLY, rest blank
               [DECIDE] defect, do not copy
```

- **Total Rooms** is active only when Sort Items By = Room, and is **hidden** otherwise or when *Allow
  Room Entry in Enter a Sales Order* is unchecked.
- **Recipient** comes from the order. **E-Mail Address** — one per document; a new address **is saved back
  to the customer record**, and under *Customer Entry – Warn if Primary Email exists for other Customers*
  it is checked against other customers' primary emails, raising a **dismissible** warning on collision.
  Without the Extended Payment Receipt form (AR CS) the email prompts are hidden.
- **Save** prints if Print is checked and emails if Email is checked *and both fields are populated*.
  Archiving follows Configure Document Archive: *Print And/Or Email* archives on output, *Signature*
  waits on signature capture.
- **The Forms Designer sort overrides whatever is chosen at Sort Items By.** `[DECIDE]` A control that
  silently does nothing; honour it or hide it when a form sort exists.

### 7.4 Sales Margin Scratchpad `[DOC]`

Step 2 Actions, permission-gated. **Informational only** — nothing here touches the order, product
settings, or financing, including adding or removing financing. Order products populate the grid;
double-click loads one into the entry fields. Further products may be keyed or searched but **cannot be
added to the order from here**. Quantity defaults to the ordered quantity, or 1 when added manually.

```
Margin $ = price − cost                    Margin % = margin $ ÷ price
Fee $    = finance amount × fee %          Total Margin - Fee = grid total margin $ − fee $
Adjusted Margin % = (total margin $ − fee $) ÷ totals-line price
```

Price, Margin $, and Margin % are bidirectional — entering any one recomputes the other two. **Cost** is
landed cost raised by any commission add-on percentage, which lowers margin. **Special-order products are
costed at zero**, making special-order margins meaningless; `[DECIDE]` use a real or estimated cost. The
**Add** button must be pressed to commit grid changes — forgetting it silently discards the edit. Finance
Amount may exceed the merchandise total (it can include tax and fees) but not fall below 0.00. *Sales
Margin Scratchpad Cost* (POS CS › Profit and Costs) selects the costing method.

### 7.5 Order Source Entry `[DOC]`

Step 1 Actions on Sales Order / Return / Exchange / Adjust Dollars on a Completed Order. One field with
an Arrow picker listing **only** sources **not** flagged *Exclude During Order Entry* in Order Source
Settings. The source may be changed at any time. **A shopping cart carries no order source; it is
assigned at conversion.** Pairs with the save-time validation
`"Order Source must be selected before saving the order."` (gated by *Order Source Required in Enter a
Sales Order*).

### 7.6 Submodules Window `[LEGACY]`

General System Control Settings › Licensing › Submodule. Read-only grid: Submodule Name · Licensed
(`Yes`/`No`, inherited wholesale from the parent) · Number. Verbatim: *"The active status of a sub-module
cannot be changed."* Licensing plumbing — carry only if a module-licensing model is retained.

### 7.7 Canceled Orders by Salesperson `[DOC]`

A Dynamic Tab Settings page inside View Salesperson Activity. Columns: Order · Order Type · Fulfillment
Type · **Salespeople** (count on the order) · Order Date · **Cancellation Date** · Customer Name ·
**Reason** (void reason code) · **Total** (merchandise subtotal, with a column total at the grid foot) ·
Finance Plan. Double-click opens a read-only order. `[INFER]` The reporting consumer of the void reason
code — those codes must be preserved and queryable by salesperson and date.

### 7.8 Is Customer Address Required `[DOC]`

A privacy-compliance gate running **before** the customer field becomes usable, including on quote or
layaway conversion. All four must hold: *Prohibit Customer Personal Information when not Required by Sale*
(Warehouse/Store Location Settings) is checked; order type ∈ {sales, exchange, return, quote/layaway}; the
order's store is subject to that setting; and fulfillment method ∈ {Customer Pickup, Take With}.

Checkboxes (all that apply): *Order will include Warranties* · *A Payment other than Credit Card will be
Applied* · *Customer will be using a Resale License for this Purchase* · *Customer will not be taking all
Merchandise with them today* · *Customer Membership will be associated with this order* · *None of the
Above*.

On **Save**: anything other than "None of the Above" writes an **order comment naming each option chosen**
and unlocks the Customer field. "None of the Above" routes to **Enter a Customer Name** (name only, no
address). The window is **bypassed** when *Sales Order*, *Exchanges*, and/or *Returns* in POS CS ›
Fulfillment Methods are set to Customer Pick Up or Take With.

**Same-day pickup conflict.** Selecting "…not taking all merchandise with them today" and saving with a
pickup date equal to the order date resolves four ways: (1) the operator holds *Override Same Day Pickup
Restrictions* and acknowledges the invalid-date warning; (2) a user who holds it grants an override; (3)
the pickup date moves later; or (4) **the operator deletes the order and re-keys it without that checkbox
and without asking for customer information**. `[DECIDE]` Path 4 is documented advice for defeating a
compliance control. Do not carry it — decide with legal which rule wins and make the loser non-blocking.

### 7.9 Access Control Window `[DOC]`

The universal security-override prompt, appearing automatically wherever a restricted routine, screen, or
field is touched. Fields: **Security Requirement** and **Authorized Action** (both read-only, describing
the exception raised) · **User ID** and **Password** (both mandatory). Clearance comes from the User or
User Group files. **The authorising user is recorded** — every override is auditable. **Three attempts**
are permitted; on the third failure the operator returns to the previous screen. Named callers include
Adjust the Net Total and Additional Line Item Details. The article labels the third field "User ID" but
its next definition calls it "Initials" — content defect.

### 7.10 Add Escapes to Current Screen `[DOC]`

A right-click item shown only to users holding *Add programs to a Dynamic Escape screen listing* (System
Security). It opens Dynamic Escape Settings maintenance in place, letting a power user extend the
right-click menu of the screen they are on. `[DECIDE]` Likely replaced by a command palette.

### 7.11 Enter a Shopping Cart — the upstream capture surface `[DOC]`

A sibling program that feeds order entry and therefore constrains it. **A customer is not required — the
salesperson is.** Identity fields (names, email, three phones, address) are capturable with **no customer
record**, under the same 50-character combined-name cap.

- **Fulfillment Method is mandatory**: `None Selected | Delivery | Pickup | Direct Shipment`. Default from
  *Fulfillment Methods – Sales Orders* — **except** that Take With or No Default yields `None Selected`,
  and **Direct Shipment must always be chosen manually**.
- **Unit Price is editable only when** *Allow Changes to Default Price* (Shopping Cart Control Settings) is
  checked. **Stock Location** defaults to `Same as Ship Location` while empty, then follows the last line
  added; at conversion it resolves to the order's *Ship From Location*.
- **Delivery Route** is optional, but **ATC cannot be calculated without it**, so a blank route falls back
  to ATP.
- Carts are **deleted after conversion**; those older than *PDA Shopping Cart Retention Days* are deleted
  by Generate Daily Reports; **Close Cart** purges at Day-Ending. **Defective** products cannot be added.
  Conversion requires *Enter/Edit a Sales Order* or an override.

---

## 8. Consolidated

### 8.1 New business rules (not in `03`)

Thirteen rules originate in this file and appear nowhere in `03`: the phone/name parse limits (§3) ·
builder's allowance ceiling and deposit hold-back on partial shipment (§7.1) · order-scoped exception
comments that void the override when abandoned (§6.3) · mandatory comments on any change to a saved order,
except conversions (§6.2) · installation-charge overrides that do not follow a moved line (§5.2) · one Take
With fulfillment per order with a transient re-method exception, and the silent re-sort (§5.1) · order
source assigned at cart conversion (§7.5) · the Forms Designer print-sort override (§7.3) · zero-cost
special orders in the scratchpad (§7.4) · three-attempt override lockout with authoriser recorded (§7.9) ·
and ATP settings that delete their own UI (§4.4).

### 8.2 Enums introduced

```
Print Options › Sort Items By  Line Number | Room | Group Pricing | Fulfillment
Print Options › Output         Print | Email | Digital
Cart status                    Open Cart | Converted to Order | Closed by Customer
                               | Closed by Salesperson
Cart source                    MANUAL | EROAM | ESTORIS | MOBILE V
Cart fulfillment method        None Selected | Delivery | Pickup | Direct Shipment
Deliver To selection           Billing | <Deliver To Settings description> | Other
Submodule licensed             Yes | No
Address-required disclosure    Warranties | NonCardPayment | ResaleLicense
                               | NotTakingAllToday | Membership | NoneOfTheAbove
Comment origin  [INFER]        MANUAL | SYSTEM | FIELD_CHANGE | MANDATORY_CODE | EXCEPTION
```

### 8.3 Configuration and permissions referenced

Settings and permissions are named inline at the rule each governs rather than catalogued twice. Six
permissions appear here for the first time and must be added to `10`:
*Edit the builder allowance amount within POS entry* · *Override Deposit Hold Back on an Order* · *Change
customer price category within POS entry* · *Access the sales margin scratchpad within POS entry* ·
*Override Same Day Pickup Restrictions* · *Add programs to a Dynamic Escape screen listing*.

### 8.4 Open questions and content defects

| # | Item | Tag |
|---|---|---|
| 1 | **Due Day** described as "the default tax IT number" — label and description disagree (§7.1). | `[DECIDE]` |
| 2 | Access Control calls one field both "User ID" and "Initials" (§7.9). | defect |
| 3 | Print Options **Sort by Fulfillment** fills only the first line (§7.3). | `[DECIDE]` |
| 4 | Forms Designer sort silently overrides the operator's print-sort choice (§7.3). | `[DECIDE]` |
| 5 | Order-scoped exception comments: a second override overwrites the first (§6.3). | `[DECIDE]` |
| 6 | Abandoning Enter Exception Comments voids the override, unconfirmed (§6.3). | `[DECIDE]` |
| 7 | Mandatory comments skipped on layaway/quote conversion (§6.2). | `[DECIDE]` |
| 8 | Installation-charge override stranded on the source fulfillment (§5.2). | `[DECIDE]` |
| 9 | Documented advice to re-key an order to defeat the same-day control (§7.8). | `[DECIDE]` |
| 10 | Zero special-order cost makes scratchpad margins meaningless (§7.4). | `[DECIDE]` |
| 11 | Fulfillments re-sort on save; the sort key is never stated (§5.1). | `[PARTIAL]` |
| 12 | Is a transient second Take With fulfillment persisted before re-methoding (§5.1)? | `[PARTIAL]` |
| 13 | Estimated-status warning labels "go back" **OK** and "save anyway" **Ignore** (§5.3). | `[DECIDE]` |
| 14 | Order Number honours Enter only while Plus is highlighted (§2). | `[DECIDE]` |
| 15 | Does the replacement model need Document Selection at all (§7.2)? | `[DECIDE]` |
