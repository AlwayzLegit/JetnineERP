# 04 — Operational Inquiries

Covers articles 1, 2, 8, 9, 28–31, 98, 113–120, 125–127, 129–131, 134–137.

Salesperson performance, open-order management, product availability, carts, leads and the UP
system, and credit/financing views.

---

## Salesperson activity

### View Salesperson Activity (article 134)

Standard DTS. Header: **Salesperson** (Search → Salesperson window) → Email Address, Phone,
Selling Location from Salesperson Settings, repeated on every tab.

**General tab** (shared fragment, not stand-alone): Address 1, Address 2 (hidden when empty),
City/State/Zip, Category (hidden when empty), Commission Rate (hidden when empty), Plan (hidden
when empty).

**Totals:** counts for Orders, Layaways, Quotes, Carts; and **Written Sales Today, Written Sales
MTD, Delivered Sales Today, Delivered Sales MTD**.

`[SETTING]` `[GATE]` The four sales-dollar figures are visible only when *View Salesperson's Sales
Activity* is checked on the Advanced page of POS Control Settings. Commission and sales totals are
sensitive between colleagues — keep the gate.

**Tabs** (each its own article, all DTS pages): Open Orders, Completed Orders, Canceled Orders,
Layaways, Carts, Quotes, Leads.

### The per-salesperson list screens

All follow one shape: an optional Start/End date range, a grid, **column totals at the bottom**,
and **double-click for a read-only version** of the underlying document.

| Screen | Art. | Columns |
|---|---|---|
| **Open Orders by Salesperson** | 29 | Order, Order Type, Fulfillment Type, **Salespeople** (count of salespeople on the order), Order Date, **Fulfillment Date** (the **most recent** of the line-item fulfillment dates when they differ), Fulfillment Status, **Contact Date**, **Contact Status**, Merchandise*, Total*, Amount Paid*, Balance* (= Total − Paid), Customer Code, Customer Name |
| **Completed Orders by Salesperson** | 2 | Order, Order Type, Fulfillment Type, Salespeople, Customer Name, **Completed Date** (from the order header), Merchandise*, Total*, Amount Paid*, Balance* |
| **Open Quotes by Salesperson** | 30 | Order, Order Date, Fulfillment Date, Customer Name, Total* — also available stand-alone |
| **Open Shopping Carts by Salesperson** | 31 | Order (cart number), Order Date, Customer Name, Phone (home phone from Advanced Customer Settings), Merchandise*, Total* |
| **View Open Layaways by Salesperson** | 127 | Order, Order Date, Fulfillment Date, Customer Name, Total*, Amount Paid*, Balance* — also available stand-alone |
| **Open Leads by Salesperson** | 28 | **Contact** (lead number), Customer Name (last name first; **default sort**), Entered Date, Store Location, **Next Update**, **Action to Take**, **Merchandise of Interest** (first item when several), **Brand** (first when several), **Quote**\* (total quote dollars — `[GATE]` **once a lead is archived its quotes disappear from this screen**), **Cart**\* |

`*` = column totals at the bottom of the grid.

**Recommendation:** six near-identical grids differing only in columns. One parameterized
"salesperson's documents" panel with a document-type switch. Note the definitions worth
preserving: **Balance = Total − Amount Paid**, and **Fulfillment Date = max(line fulfillment
dates)** — both are stated and both are the kind of thing that silently diverges if
reimplemented per screen.

---

## Open-order management

The two most valuable operational screens in the section. Both are **search-then-act**, not
report-then-read.

### View and Manage Open Order Lines (article 115)

**Purpose:** find merchandise **in jeopardy of missing its delivery date**, at line level.

`[GATE]` Queries **sales orders, the sales portion of exchanges, and layaways** only. **Returns,
transfers, and quotes are excluded.** **Hard kit masters and intangible items never appear**, even
if explicitly selected.

`[SETTING]` `[PERM]` When *Sales Security Access* (Advanced page, POS Control Settings) is on,
*View All Sales Information* (Sales Security) decides whether the user sees their own data, their
login store's, or everything.
`[PERM]` Acting on results requires *View and Manage Open Orders - Maintain Exchanges* /
*- Maintain Sales Orders*.

**Search criteria are retained and re-defaulted** for the next visit by that user. The Search Panel
collapses to widen the grid.

**Criteria:** District (blank enables Selling Location), Fulfillment Location, Selling Location,
**Stock Location** (defined as *"the warehouse location of the associated auto-transfer if one
exists, otherwise the fulfillment location"*), Salesperson, Contact Status (one or all),
**Fulfillment Method** (Deliveries and/or Pickups — `[GATE]` **at least one required**),
**Fulfillment Status** (Scheduled / Estimated / ASAP / CWC — `[GATE]` **at least one required**),
Order Dates and Fulfillment Dates (each `[STD Date Code]` + start/end), **ATP Days Early(−)/Late**
(`[GATE]` hidden when ATP is inactive; blank = no ATP constraint), **Show all lines of
Fulfillment** (show every line of a fulfillment when any line matches, vs. matching lines only),
Include Intangibles, Product/Group/Category, Vendor, Inventory Formation, Fully Reserved,
Unscheduled Lines Only.

**Grid** — Order Number, Line Reference, Fulfillment Customer Name, Fulfillment Date, Fulfillment
Method, Fulfillment Status, **View** (→ View an Existing Sales Order), **Maintain** (→ Enter a
Sales Order, permission-gated), Sold At, Fulfillment Location, Stock Location, Order Date,
Salesperson, Product, Product Description, Vendor, **ATP Source** (how the line's last quantity
gets fully reserved — Reserved Stock, Assigned Pieces, Unlinked Shipped PO, Linked Shipped PO),
**ATP Document** (the source document — auto transfer, linked PO, stock transfer, stock PO),
**ATP Date**, **ATP Days Early(−)/Late**, Order Quantity, Order Type, Reserved Quantity, Back Order
Quantity, Auto Transfer Order/Reserved/Back Order Quantity, Contact Status, Contact Date, Linked
Purchase Order, Linked PO Scheduled Date, ATC, Billing Customer Name, Unscheduled Quantity.

**The ATP Days Early/Late convention — implement exactly:**
- Positive = **late** by that many days; negative = **early**. (Scheduled 09/01, ATP 09/15 → `14`.
  Scheduled 09/01, ATP 08/15 → `-15`.)
- **`999`** = no ATP availability, **or** the line is unscheduled.
- **`0`** = reserved stock or assigned pieces.

`999` as a sentinel inside a numeric column is a legacy tell — a line with no availability and a
line that is merely unscheduled are different problems and should not share a magic number. Use
explicit states.

### View and Manage Open Orders (article 116)

Order-level rather than line-level, and it covers **transfers** as well.

`[GATE]` Layaways and quotes are included; **service orders are excluded from all filters**.

**Order Type** (mandatory) — `Orders` (sales orders, returns, exchanges, quotes, layaways) or
`Transfers`. **The selection hides the inapplicable fields entirely** rather than disabling them,
and it renames the date sections: Orders → *Order Dates* / *Fulfillment Dates*; Transfers →
*Delivery Dates* / *Transfer Dates*.

Same sales-security scoping as above. `[PERM]` Maintenance is gated per document type:
*View and Manage Open Orders - Maintain Exchanges / - Maintain Returns / - Maintain Sales Orders /
- Maintain Transfers*.

**Criteria:** District ↔ Selling Location (mutually exclusive, deactivating each other), Ship From
Location, Route Code, Salesperson, and **Backorder Status** — a set of independent checkboxes:

| Option | Meaning |
|---|---|
| Back Ordered | Orders with lines carrying back-ordered quantities |
| **Fully Reserved Fulfillments** | Fulfillments with no unreserved lines — **excludes partially reserved** |
| **Fully Reserved Orders** | Orders with no unreserved lines — **excludes partially reserved** |

`[GATE]` **Non-inventory products (warranties, labor) do not count as reserved or unreserved.** A
fulfillment whose real inventory is fully reserved qualifies even if it carries warranty lines.
That rule is easy to get wrong and produces confusing results when you do.

**Runs on demand or as a scheduled process**, and the two modes differ materially:

| | On demand | Scheduled |
|---|---|---|
| Search button | Active | **Inactive** |
| Grid | Visible | **Hidden** |
| Output Settings | Unavailable | **Available** (NFS or Report Archive; **Archive is default**) |
| Date selection | Date Type + Start/End | **Past Days / Future Days** |
| Fulfillment Method / Status | Optional per search | **Required**; all options default checked |

**Scheduled date window:** run on 01/22/21 with Past Days 5 and Future Days 10 → fulfillments from
01/17/21 to 02/01/21. Both 0 or blank → **the current date only**.

`[SETTING]` Concurrency for multiple scheduled instances is bounded by *Maximum Number of
Concurrent Phantoms* (Phantom Process Settings), with the source's own warning that setting it too
high taxes the system.

**Scheduled output carries extra columns** beyond the on-demand grid: Fulfillment Location, Total
Fulfillments, Order Fully Reserved, Fulfillment Unscheduled Lines, Unscheduled with ATP date,
Fulfillment Delivery Charge, Fulfillment Total, Stock Location, Merchandise Total.

**Recommendation:** these two screens are the operational heart of the section — "what is at risk
and what do I do about it." Build them first among the inquiries, and build them as **one**
surface with a line/order granularity toggle rather than two programs with overlapping filters.
Keep the retained-search-criteria behavior; it is a small thing users notice every day.

---

## Product views

### View Product Availability (article 131)

Company-wide and per-location quantities for one product.

**Header:** Product (Search → Search for a Product, which can return a **list**; camera icon for
the image), Vendor, Brand, **Vendor Model** — `[PERM]` the vendor model shows only with *Search for
vendors, view vendor name and model numbers* (Extended Security). A **counter below Brand** shows
position within an active product list, with Previous/Next.
`[GATE]` Products flagged *Kit Component* show **"Kit Component Only"** in the header.

**Available to Promise block:**
- **Desired Quantity** (1–99, defaults 1; inactive until a valid product is entered) — ATP dates
  are recalculated as *the first date at least this quantity is available*.
- **ATP Date / ATP Quantity** — the best ATP date across locations; quantity is always ≥ desired.

`[GATE]` **Tie-break when two locations share the best ATP date** — the better source of supply
wins, in this hierarchy:
1. Current Stock
2. Stock Transfer
3. Unlinked and **acknowledged** purchase order
4. Unlinked and **unacknowledged** purchase order
5. New purchase order

Implement that hierarchy explicitly; it encodes real confidence-of-supply ranking.

**Inventory Quantities:** On Hand (saleable, all locations), Net Available, **Net PO**, As-Is,
**As-Is Available** (unreserved sellable As-Is — includes products whose reason code does **not**
have *Restrict As-Is Products From Being Sold* checked), Total PO, **Vendor Quantity on Hand**.

`[SETTING]` `[GATE]` Vendor Quantity on Hand and its per-location lookup appear only when *Vendor
Inventory Quantities – Update Quantities* is set in Vendor Settings. The source is careful to note
**the vendor quantity is not a fulfillment guarantee** — it is the last figure the vendor supplied.
Label it as such in the UI.

**Merchandising:** Selling Price, Suggested Retail Price, **Purchase Status** (short description),
Product Status.

**Grid, per location:** Location, Description, ATP Date, ATP Quantity, **On Hand** (excludes
As-Is), **Net Available** (excludes As-Is), Net PO, **As-Is** (includes reserved and assigned),
**As-Is Available**, **On Order Reserved**, **Layaway Reserved** (`[SETTING]` updated only when
*Fill Layaway Orders* is checked in POS Control Settings — **otherwise the last value is frozen and
displayed until the setting is turned on**), **As-Is Reserved**, **As-Is Non Sellable**, **Total
PO** (= quantity ordered into this location − quantity received).

The frozen Layaway Reserved column is a genuine data-integrity trap: a stale number displayed as
if current. Do not reproduce it — compute it or hide it.

**Actions:** Search Related Collection, View Benefits, View Attachments, View Kit Availability.

`[LEGACY]` Without ATP, DTS can swap tab `IC.204.TAB` for `IC.207.TAB` (Stock Availability Inquiry)
to drop the ATP columns. In our system ATP columns should simply be absent when ATP is off.

### View Product Activity (article 130)

Standard DTS, the fullest product view. Tabs: **Location Availability ATP, Purchase Orders, Open
Orders, Sales History, Inbound Transfers, Outbound Transfers, General Information, Special Order
Detail, Serial/Reference, As-Is, Spiff/Commission, Summary, As-Is Inventory Detail, Regular
Inventory Detail, Locations, Open Shopping Carts.**

Regional Processing applies. The **General Information** page is the shared fragment reused by
View Product Availability and Search for a Cart by a Specific Product.

The tab list is the specification: a product page needs availability, purchasing, demand, movement,
history, serials, As-Is detail, and commission data. **As-Is Inventory Detail** is where returned
merchandise price changes surface (see the Exchange handoff, `03`).

---

## Shopping carts

### View Shopping Cart (article 135)

Read-only twin of Enter a Shopping Cart — identical fields, nothing editable. A cart is a list of
merchandise a customer is interested in, convertible to a sales order.

**Header:** Shopping Cart ID (auto-assign via *Next Transaction Number*, or manual when *Automated
& Manual POS Numbers* is active; Search offers **Open Carts by Customer**, **Open Carts by
Product**, **Shopping Cart Selector**), **Salesperson** (`[GATE]` mandatory to save).

**Two ATP-derived dates, both display-only and both conditional:**

| Field | Shows when | Based on |
|---|---|---|
| **Available to Deliver** | ATP active **and** delivery lines exist | Merchandise availability **and delivery route capacities** (ATC logic) |
| **Available to Pickup** | ATP active **and** pickup lines exist | Merchandise availability **and Purchase Lead Days** (ATP logic) |

Both default to the current date when every line is fully reserved, otherwise the next projected
availability.

`[GATE]` **Turning ATP off removes more than a date:** if none of *Include New Purchase Orders*,
*Include Stock Transfers*, *Include Unlinked Purchase Orders* is checked in POS Control Settings,
then the ATP/ATC fields **and their labels**, the grid's ATP Date column, and the *Toggle Display
of ATP/ATC Dates* action all disappear.

**Merchandise entry area:** Product (camera icon; `[SETTING]` affected by Direct Ship settings in
Advanced Product Settings and POS Control Settings), Brand, ATP/ATC Date (**ATP when no delivery
route is set; ATC when one is** — toggleable), Quantity Ordered (defaults 1), Quantity Available
(`[GATE]` hidden when ATP inactive), **Unit Price** (`[SETTING]` editable only when *Allow Changes
to Default Price* is checked in Shopping Cart Control Settings), Extended Price, **Stock Location**
(defaults *Same as Ship Location* for the first line, then **inherits the last line's value**),
Purchase Status, **Fulfillment Method** (mandatory — None Selected / Delivery / Pickup / **Direct
Shipment**).

`[GATE]` Fulfillment Method defaults from *Fulfillment Methods - Sales Orders* in POS Control
Settings, **except** that a control setting of `Take With` or `No Default` yields *None Selected* —
which must then be changed before saving. **Direct Shipment is never a default; it must always be
chosen manually.**

Line controls (Save + Add Another, Save, Cancel, Add Item, Expand/Collapse All Rows, Edit-turns-row-
yellow, Remove-with-confirm) match order entry — see the Exchange handoff, `04`.
`[GATE]` Direct-ship lines open **Purchase Order Linkage Detail Maintenance** on save.

**Grid primary:** Product, Description, Fulfillment Method, Stock Location, Quantity Ordered,
Quantity Available, Unit Price, Extended Price. **Secondary (More):** Second Description,
ATP/ATC Date.

**Side panel — Estimated Totals** (read-only): Merchandise Subtotal, Delivery Charge, Installation
Charge, Sales Tax, Net Total.

**Customer Information:** `[GATE]` **a customer code is not required.** Name, address, phone, and
email can be typed directly, and **all of it carries into Customer Entry** if the user later
creates the customer. **No Auto Email** excludes the customer from eSTORIS mass mailings.
`[SETTING]` With *CUSTOMER SEARCH - Phone Number First*, the cursor jumps to Home Phone right after
the Cart ID and the phone lookup is available there.

**Delivery Information:** Zip Code, then **Delivery Route** — defaults from the zip when exactly
one route matches; opens the **Select Route Code Window** when several do; blank when none.
`[GATE]` **Without a route, ATC cannot be calculated and the ATP date shows instead.**

**Other Details:** Purchase Time Frame, Store (defaults from login), **Ship Location** (display-only;
ship and stock are assumed identical — **selecting a stock location updates it**), **Status of
Cart** (`Open Cart` / `Converted to Order` / `Closed by Customer` / `Closed by Salesperson`),
Created Date, Time, **Source** (`MANUAL`, `EROAM`, `ESTORIS`, `MOBILE V`).

**Actions:** Audit Comments Log, Costed Line Item Display, Finance Payment Estimator, Line Stock
Availability, **Close Cart** (`[SIDE EFFECT]` closes it and **purges it during Day-Ending**),
Toggle Display of ATP/ATC Dates.

Carts are the pre-order funnel — the source, time frame, and status fields exist to measure it.
Keep them; they are what makes "why didn't this cart convert" answerable.

---

## Sales leads and the UP system

### Manage Sales Leads (article 9)

`[GATE]` Maintains but does **not create** leads (creation is *Enter a Sales Lead*).
`[PERM]` Access via *CRM - InTouch* fields on the Security tab of Create a User.

**Criteria:** Type of Lead (Active / Inactive), Probability of Purchase, **Contact Date** (`FIRST`
/ `LAST` / `NEXT`) with Start/End working against whichever was chosen, District Manager
(`[PERM]` InTouch CRM Security), **Salesperson** (`[PERM]` blank-for-all requires Store Manager,
District Manager, or Corporate CRM-InTouch access), Location, Contact (Search for a Customer
restricted to **lead contacts only**), Brand (multi), Merchandise of Interest (multi).

`[GATE]` If the current salesperson equals the *Salesperson for Unassigned Contacts* in Sales Lead
System Control Settings, **the Location must equal the user's login store.**

**Actions:** **Today's Actions** (next activity date = today), **Missed Actions** (next activity
date < today). Two one-click daily work queues — cheap and genuinely useful.

Results open in the **Callback Summary Results** screen.

### Callback Summary Results (article 1)

Columns: Name, Phone, Salesperson, First Contact Date, Last Contact Date, Next Contact Date,
**Action To Take**.

`[GATE]` **Leads updated by someone other than the original salesperson sort to the top of the
grid** — a nice touch, surfacing hand-offs.
`[PERM]` Editing another salesperson's leads requires higher security; **any user may add
comments** (via Enter a Sales Lead).

Double-click behavior depends on lead state: **active** → Enter a Sales Lead; **inactive** → View
Historical Sales Leads.

### Lead Activity Log (article 8)
All historical comments for a lead, back to its creation, with user-defined fields at the bottom.
Reached from Callback Summary or View Historical Sales Leads. Action: Enter a Sales Lead
(`[PERM]` its own security).

### View Historical Sales Leads (article 126)
Closed leads for a contact. **Status** shows whether the customer currently has another **Active**
lead. Grid includes a **Reason** column populated from *Activity Reason Settings* (e.g. "customer
bought elsewhere", "price too high") and the **invoice number** when the lead converted.
Double-click → **More** (the sales entry screen for the associated invoice; a message appears if
none exists) or **Select** (Lead Activity Log).
Right-click: Customer Buy History Inquiry, Lead Activity Log, View Product Availability.

Lead close reasons plus conversion invoices is exactly the data needed for win/loss analysis. Keep
the reason taxonomy configurable.

### View Archived UPs (article 117) and Review Audit Details (article 118)

The UP System tracks up-rotation — which salesperson took which customer, and how it ended.

**View Archived UPs** audits *changes* to archived UP transactions: `[STD Date Code]` over the
**audit change** dates, Salesperson (multi), Location, Search.
Grid: **Audit Date**, Salesperson, Start Time, End Time, **Out Code** (why the salesperson was
assigned — "With customer in store", "With customer in design studio"), **In Code** (how it ended —
"Back in Lineup - Sale Made", "Sketch Drawn - No Sale Made"), Order Number when one resulted.

**Review Audit Details** shows, per change, the date, time, initials, and description.

**UP System Action Code Lookup** (article 99) is the read-only picker for Out/In codes; the codes
themselves are maintained by the *Edit Codes* feature inside the UP System.

Out Code / In Code is the up-system's core measurement: opportunity in, outcome out. Preserve the
code pair and keep both lists configurable.

---

## Credit and financing views

### View Credit Request Responses (article 120)
Active and historical credit requests over a date range.
`[GATE]` **A salesperson referenced on a credit review item can view that application**; anyone
else needs `[PERM]` Receivables Security permissions.
Criteria: Status (or All), Customer, **From / To** (both default to today; blank = earliest /
latest, with the source's own warning that either is slow), **Sort By** (Date / Name / Reviewer /
Salesperson / Status / Store — each then by descending date/time), Location, Salesperson.
Grid: Customer Name, Number, Status, Date, Time, **Bureau**, Store, Salesperson, Reviewer.
Double-click → Credit Request Review Screen - Read Only, from which status letters print (see the
Printing handoff, `05` § Print Status Letter).

### View Finance Credit Responses (article 125)
The **Credit Response Queue** for a store and salesperson, with re-transmit.
Grid: Customer Code, Name, Store, Date, Time, **Status**, Sales, Finance Provider.
**Actions > Refresh Queue** updates statuses.

Status values — the full third-party application lifecycle:
`Pending` · `In Transmission` · `Pending Review` · `In Review` · `On Hold` · `Conditional` ·
`Approved` · `Declined` · `Deleted` · `Initiated` (user must complete more on the provider's site) ·
`Pending Offer Made` (pre-qualified offer made) · `Pending No Offer Made`.

Double-click → **More** for system-generated comment text, or **Select** to re-transmit:
*"Retransmit Application for Account Name?"*

Model this as a real state machine with an audit trail. Twelve states across an external
integration is where money and disputes live.

### View Available Financed Credit (article 119)
Live credit inquiry **transmitted to a finance provider**, returning to the *View Available
Financed Credit Response* screen. Fields populate only as far as each provider returns data.

`[GATE]` Requires *Available Credit Inquiry* active in Finance Provider Settings.
**Finance Provider** is required and gates everything else; only providers with *CREDIT VIEW -
Activate the Online Available Credit Information Inquiry* checked appear. One such provider →
defaults; several → "None Selected".

**Lookup By** (provider-dependent): Customer Code (Search → Search for a Customer), Finance Account
Number, Order Number (Search → Open Order by Customer Inquiry; `[GATE]` **not offered when reached
from Finance Receivable Entry**), **Social Security Number** (all providers; **minimum 4 digits**;
an on-file SSN displays read-only, **last 4 only**).

`[SETTING]` With *Multiple Customers Per Finance Account* enabled, one finance account number can
belong to several customers — the **FR Customer Selection** window then lists them.
Also: with a Finance Account Number supplied, the SSN-last-4 and cell number become optional.

`[SIDE EFFECT]` Reached from a payment process, **Save** returns the finance account number to that
process. If it differs from the bill-to customer's account on file, a prompt asks whether to apply
it to the current order — **Yes** carries it into Finance Receivable Entry; **No** requires an
account number before continuing.

### Transaction Detail Screen (article 98)
From double-clicking a line in View Current Financing Activity: Reference, Customer Code, Customer
Name, Authorization Number, **Dispute status**, Due Date, Amount Due; grid of Activity Type, Date,
Amount, Memo Reference.

### Credit Status Results (article 3)

The pre-sale credit check — *can this customer place an order?*

Shows **Available** credit, **Remarks** (from Advanced Customer Settings and Update Receivable
Credit Approvals), and **Status**.

`[PERM]` **Without *View All Revolving Activity - View Credit Status Hold Codes* (Receivables
Security), the grid shows "See Cashier"** instead of the detail. The source's own rationale is
worth keeping: it lets the associate hand the customer to someone who can actually help, without
exposing hold codes at the sales floor.

**Status messages**, driven by Credit Application Control Settings: *Credit Line Must Be
Established*, *Application Date*, *Credit Report Date*, *Zero Balance Date*.

`[SETTING]` C7/C8 holds from Alert Code Settings produce: *"Account has been assigned to a
collector."* / *"Account has been closed to new activity."*

When no status check trips and no hold blocks the order, available credit decides:
- **> 0** → *"The customer's available credit is greater than zero. A sales order can be placed
  based on the customer's available credit."*
- **< 0** → *"The customer's available credit is less than zero. The customer's credit limit must
  be increased prior to creating a sales order."*

`[SETTING]` **C2/C3** holds derive from *Past Due Days* and *Last Activity Days* in POS Control
Settings; **C7/C8** from Alert Code Settings.

Collect the hold codes seen across this section and the Exchange handoff — **C2, C3, C6, C7, C8,
D2, E1** — and define them in one place. They surface in at least four different screens and
reports, each documenting a fragment.

---

## Order and discount views

### View an Existing Sales Order (article 113)
Read-only view of **sales orders, exchanges, and returns**, rendered in **the same format as the
entry screens**, with the document type determining the layout. `[GATE]` Transfers use *View a
Merchandise Transfer* instead. Regional Processing applies.

Reachable from a dozen menu paths, which is itself the argument for a single canonical document
route in our system.

### View an Open Customer's Own Goods Order (article 114)

COG = **Customer's Own Goods** — the customer's own furniture moving through service.

`[GATE]` COG documents exist only for **in-shop service orders**, and can only be **created** from
the Actions button on the Scheduling tab of Enter a Service Order — this screen views them (and,
when reached that way, creates them).

**COG Number** — Enter/Tab assigns the next number from *Next Transaction Number* in POS Control
Settings; Search → COG Lookup.
**Service Order** — the linked service order (Search → Open Service Order by Customer Inquiry). On
a new COG, entering it opens **Item Selection for COG** to choose the merchandise to move.

**Move From** — current location of the piece: the customer, or a warehouse/store.
**Move To** (`[GATE]` locked on an existing COG) — **Customer** (returning after service),
**Location** (+ Location Code and **New Storage Location**), or **Vendor** (+ Vendor Code, for
third-party repair).

**Move Date**, **Type** (`Delivery/Pickup` or `Customer Pickup/Drop-off`; locked on an existing
COG), **Route** (`[GATE]` Delivery/Pickup only), **Truck** (`[GATE]` order not on a manifest and
routing/mapping active at the COG's ship location), **Stop Time** (24-hour `HH:MM`),
**Instructions** (two printed lines), **Print Extended Instructions** (from the service order's
Scheduling tab), **Print Delivery Ticket**.

`[SIDE EFFECT]` **Release For Completion** — `[GATE]` active only once the COG has been printed and
the Move Date is not in the future. **Completing a final COG to the customer completes the linked
service lines.**

Double-clicking a grid line → Select → Enter Line Comments.

COG is a real furniture-retail concept (customer's own sofa going out for reupholstery and coming
back) and it is easy to miss when scoping a mattress ERP. Confirm whether LA Mattress needs it
before building.

### View Order Discounts (article 129)

**A ledger of how every line discount was applied to an order** — reached from the merchandise tab's
Actions menu or from Enter Discounts on Multiple Lines.

Header: Order, Date, Type, Store, **Original Selling Price** (merchandise before discounts),
**Discount Total**, **Net Selling Price** (matches the Payment tab's Subtotal).

Grid, per applied discount: Discount code, Description, Line Reference, Product (or Vendor ID when
toggled), **SRP**, **Price** (unit price *at the moment the discount applied*), Percent, Amount
(per unit), Quantity, Extended Price, **Balance** (the running order subtotal as each discount
applies).

`[GATE]` **It is a ledger: the grid cannot be sorted or column-filtered.** Order is meaning.

This is the answer to "how did this order end up at this price," and given the discount-stacking
rules in the Exchange handoff (`05`), it is the audit tool that makes those rules enforceable.
Build it.

---

## Summary inquiry

### View Summary of Sales Activity (article 136)

Up-to-the-minute revenue summary for a day, with month-to-date.

`[GATE]` **MTD figures cover the entire month, not just up to the selected date.** State that on
the screen — it is a reconciliation trap otherwise.

Criteria: Salesperson, District ↔ Store (`[STD]` rules), **Date**, then Run.

- **Summary tab** — Daily Dollar, MTD Dollar, MTD Profit, for **Written** and **Delivered**.
  `[SETTING]` MTD Profit shows as dollars, as a percentage, or **not at all**, per *Display Profit
  Dollars* in POS Control Settings.
- **Delivered tab** — gross Sales and Profit, then Returns / Profit / Adjustments, then **Net** and
  Profit after returns and adjustments.
- **Written tab** — gross Order and Profit, the effects of returns, exchanges, adjustments, and
  **cancelled orders**, then Net and Profit.

The written-vs-delivered distinction runs through this entire section and is the single most
important reporting concept in it: **written** = what was sold, **delivered** = what was recognized.
Make it a first-class dimension of the reporting model rather than a per-report option.

### View Web Transactions (article 137)
eSTORIS web transactions. Filter by **type** (All / Sales Order / Gift Certificate / Quote),
beginning/ending date (either or both, both optional), or a specific transaction number.
Double-click → **More** (read-only certificate, quote, or order) or **Select** (loads the number
into the field). `[GATE]` The Add button has no function here.
