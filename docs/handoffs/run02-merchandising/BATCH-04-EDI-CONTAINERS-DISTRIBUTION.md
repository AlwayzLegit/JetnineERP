# Run 02 — Merchandising — Batch 4: EDI, Containers, Distribution and Direct Ship

**Status: complete.** 12 articles. Findings 59–70.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Import Received EDI Documents** *(Dispatch Documents Received)* | /articles/15202192987668 | EXTRACTED |
| 2 | EDI Status Details | /articles/15202192520340 | EXTRACTED — thin |
| 3 | EDI Advanced Ship Notice Dates | /articles/15202192520468 | EXTRACTED |
| 4 | View Purchase Order Line Containers | /articles/15294766046868 | EXTRACTED — thin |
| 5 | Trip ID | /articles/15202192347028 | EXTRACTED |
| 6 | Maintain Tracking ID | /articles/15202193119380 | EXTRACTED |
| 7 | Exchange Rate Inquiry | /articles/15202208172820 | EXTRACTED |
| 8 | **Consolidate Purchase Orders** | /articles/15202208812692 | EXTRACTED |
| 9 | Distributed Purchase Orders | /articles/15202192105620 | EXTRACTED |
| 10 | **Convert Direct Ship Purchase Order to a Stock Purchase Order** | /articles/15202208816148 | EXTRACTED |
| 11 | **Transfer on Receipt Quantities** | /articles/15202192362644 | EXTRACTED |
| 12 | Assign Default Vendor Ship From Locations | /articles/15202193114004 | EXTRACTED |
| 13 | Vendor Alternate Address | /articles/15202208340116 | EXTRACTED — thin |

Discovered and queued: `Vendor EDI Settings` · `EDI Control Settings` · **`Report Invoice Exceptions`** ·
`Purchase Order Type Settings` *(now referenced by three batches)* · `Warehouse/Store Receiving
Settings` (Receiving Calendar) · `Multiple Location Selection` screen · `Phantom Process Log` ·
`Enhanced Laser Processing Form Designation` · `Data Warehouse`.

---

## B. Wiring findings

### FINDING 59 — Seven EDI transaction sets, and inbound invoices sit in a hold file until goods arrive
Transaction sets (verbatim, complete):
            **`810` - Invoice · `855` - Purchase Order Acknowledgements · `856` - Shipping
            Acknowledgements · `865` - Purchase Order Change Request Acknowledgement · `997` -
            Functional Acknowledgement · `315` – Status Details · `214` - Receive Purchase Orders /
            Status of Shipment Acknowledgement**
Invariant:  "**STORIS places invoices received from the vendor in a hold file until you receive the
            goods into the system.** You can run this process after you receive the goods. **The
            program checks invoices against goods received, releasing invoices for payment
            approval.**"
Invariant:  "**If the system attempts to create an AP bill for a purchase order that no longer exists,
            STORIS creates an exception** (see `Report Invoice Exceptions`.)"
Evidence:   Import Received EDI Documents, /articles/15202192987668
Maps to:    **NEW — and it closes a run-1 gap on how AP bills originate**

> This is the three-way match, and it lives in Merchandising rather than Payables. **An inbound `810`
> is parked in a hold file, not posted**, until receipt exists; the dispatch process is what releases
> it for payment approval. Two consequences. First, **a third exception queue** — `Report Invoice
> Exceptions` — joins the cost exception queue (batch 2) and the flagged-and-held GL import batches
> (run 1). STORIS's answer to almost every mismatch is a queue someone must work. Second, the trigger
> for that exception is *a purchase order that no longer exists* — which connects straight to batch
> 1's `Days to Keep Voided/Closed Purchase Orders` purge windows and to the PO delete path. **Purging
> a PO can strand an inbound vendor invoice.**

### FINDING 60 — A PO acknowledgement can arrive by EDI and change the order, and the ASN carries its own dates
Invariant:  "Use this routine to update the **Advanced Ship Notice (ASN) Shipping Date and/or ASN
            Delivery Date** for the selected line item on the current purchase order. This screen is
            available… **only when a line item is selected and EDI is active for the vendor**."
Invariant:  "**NOTE: This process uses the `Receiving Calendar` setting in `Vendor EDI Settings` to
            determine when, if at all, to use the receiving calendar established in
            `Warehouse/Store Receiving Settings`.**"
Related (batch 1): `Purchasing Control Settings` → `EDI - Allow Acknowledgment to Adjust Order Quantity`
Evidence:   EDI Advanced Ship Notice Dates, /articles/15202192520468
Maps to:    **NEW — extends batch 1 Finding 14**

> A purchase order line can now carry **four date pairs**: requested/delivery on the header,
> acknowledgement shipping/delivery (batch 1 Finding 13), ASN shipping/delivery here, and
> `Dock Scheduled`. Nothing read so far says which one downstream promising uses. And the ASN dates
> are **filtered through a receiving calendar** — a vendor-level setting deciding whether the
> warehouse's own working-day calendar applies at all. So a vendor's promised date may or may not be
> adjusted to a day we can actually receive, per vendor.

### FINDING 61 — Containers, trips and tracking IDs are three separate shipment identifiers with different scopes
**Container** — PO header field (batch 1); `EDI Status Details` is available "**only if a container
            number has been indicated**", and its status detail "**is returned by the EDI vendor**".
            `View Purchase Order Line Containers` shows "all containers associated with this purchase
            order… **The number of rows in the grid is determined by the total containers linked to
            all purchase order line items**" — so **containers link at line level**, not header.
**Trip ID** — "all `Trip ID`s associated with the selected **purchase order line**. The default is
            '**None Selected**'. When selected, the **`Trip Quantity`** displays the quantity shipped
            on the purchase order line for this trip, and the grid populates with the applicable
            **`Status Code`, `Description`, and `Date`**."
**Tracking ID** — "manually enter **multiple tracking ID's and the corresponding quantity** for
            **direct ship** purchase order lines." · "**Direct Ship tracking numbers cannot be changed
            once the order is completed.**" · "**NOTE: This information is available for Data
            Warehouse.**"
Evidence:   EDI Status Details, /articles/15202192520340; View Purchase Order Line Containers,
            /articles/15294766046868; Trip ID, /articles/15202192347028; Maintain Tracking ID,
            /articles/15202193119380
Maps to:    **NEW**

> Three shipment identifiers, all many-per-line, all populated differently: **containers by EDI,
> trips by carrier status feed, tracking IDs by hand for direct ship only.** Each carries its own
> quantity split, so a single PO line's quantity can be partitioned three different ways
> simultaneously with no stated reconciliation between them. The `Status Code` enumeration behind
> Trip ID is **not documented anywhere read so far**, and it is the actual inbound-visibility state
> machine. Also worth noting: `Maintain Tracking ID` is the only article in the run to mention
> **`Data Warehouse`**, implying a reporting layer outside the application.

### FINDING 62 — Consolidation is a destructive merge that silently excludes anything already sent
Invariant:  "Use this routine to **merge selected purchase order items into a new, consolidated
            purchase order**."
Invariant:  "**NOTE: Purchase order lines on printed or submitted purchase orders do not appear in
            this grid.**"
Date override: "**Assign specific dates to the consolidated purchase orders**… These date fields all
            initially default to blank. **Leave these fields blank to fall back to the default dates
            assigned to new purchase orders based on the vendor and receiving location settings. If
            dates are specified… the default dates for the newly created purchase orders are
            overridden.**" — `New PO Date` · `New Requested Date` · `New Delivery Date`
Selection axes: Vendor · Receiving Location · **Stock** · **Special Order** · **On Hold** ·
            **Not on Hold** · Creation Date Range · Date Type
Grid: Purchase Order · Line · Product · Vendor Model Number · Order Date · Delivery Date · Vendor ·
            Receiving Location · Quantity Ordered · Cost · Extended · View · Maintain ·
            **Order Number · Order Line · Special Order Details**
Evidence:   Consolidate Purchase Orders, /articles/15202208812692
Maps to:    **NEW**

> **Printed or transmitted lines are invisible to consolidation** — the fifth appearance of
> print/transmit as an irreversible state gate (batch 1: comments, edit permissions, reprints;
> batch 3: linkage; here: consolidation). The pattern is now firm enough to state as an architectural
> rule: *in STORIS, sending a purchase order freezes it against structural change.* The article does
> not say what happens to the **source** purchase orders after the merge — whether they are closed,
> deleted, or left as empty shells — and that is a material gap. Note the grid carries `Order Number`
> and `Order Line`, so **sales order linkage survives consolidation**, at least in the display.

### FINDING 63 — Direct-ship POs can be converted to stock POs, and the conversion is explicitly not a recalculation
Invariant:  "Use this routine to allow a direct ship purchase order to be converted into a standard
            purchase order. **This permits the receiving location to be changed and provides the
            ability to pay the vendor for the merchandise.**"
Invariant:  "**The purchase order number will remain the same and comments will be updated to state
            that it has been converted.**"
Blocking conditions (verbatim, complete): "The purchase order **has a pending AP bill** · is **linked
            to a sales order** · **has a quantity already received** · is a **distributed purchase
            order**."
EDI:        "If a direct ship purchase order has been submitted to EDI, the conversion **can still be
            done** but, a message is displayed asking to continue or to skip it. **Standard messages
            to resubmit the purchase order to the vendor will not received as the purchase order
            cannot be resubmitted to the vendor via EDI.**" *(sic)*
Invariant:  "**The cost and freight of the purchase order will not be recalculated once the purchase
            order has been converted. These items need to be manually adjusted.**"
Evidence:   Convert Direct Ship Purchase Order to a Stock Purchase Order, /articles/15202208816148
Maps to:    **W-006 — CONFIRMED, with the escape hatch documented**

> Batch 1 established that direct-ship POs are owned by the sales order. This is the door out of that
> ownership — and the first blocking condition is *being linked to a sales order*, which is what a
> direct-ship PO normally is. So conversion is available only after the link is broken. Two things
> matter for the rebuild. **Costs are not recalculated**: a direct-ship PO priced without freight
> becomes a stock PO still priced without freight, and someone must remember to fix it — another
> manual-restatement path alongside batch 2's cost exceptions. And **the EDI order becomes
> unresendable**: converted, it is a purchase order the vendor's system still holds in its original
> form with no channel to correct it.

### FINDING 64 — "Transfer on Receipt" moves stock onward at the moment of receipt, gated by PO type
Invariant:  "This option is available **if the assigned purchase order type on the PO contains an
            associated `As-Is Reason Code`** or **if the `Transfer on Receipt` option is checked in
            `Purchase Order Type Settings`**."
Invariant:  "**The total transfer quantity does not have to equal the total receipt quantity**, but
            the sum of the quantities for any single row **cannot be greater than the total open order
            quantity** for the purchase order line."
Invariant:  "There is a **one-to-one relationship between lines on the purchase order and rows on the
            grid**."
Invariant:  "**Because as-is transfers require a serial number for each piece, as-is transfers created
            using this feature break out the quantities so that one piece of product appears on each
            line of the transfer.**"
Read-only twin from `View a Purchase Order`.
Evidence:   Transfer on Receipt Quantities, /articles/15202192362644
Maps to:    **NEW — a third role for `Purchase Order Type Settings`**

> `Purchase Order Type Settings` has now appeared in three batches carrying three different behaviour
> flags: `Include in Supply Calculation` (batch 3), an `As-Is Reason Code` association, and
> `Transfer on Receipt`. **PO type is not a label — it is a behaviour bundle**, and it is the single
> most under-documented object in the section. Note the asymmetry with batch 1's line-item
> distribution, which *must* reconcile exactly: **transfer-on-receipt deliberately need not.** And
> as-is receipts explode to one line per piece because of the serial requirement — a quantity model
> change triggered by a reason code.

### FINDING 65 — Distributed POs cannot contain kits or special orders, and the location list is a savable object with a prompt
Invariant:  "**NOTE: You cannot enter kits into distributed purchase orders. Special Order Products
            cannot be on a distributed purchase order.**"
Invariant:  "You can distribute purchase orders directly to various locations using the **`Store List
            Entry`** option, available from the Action button at the **`Receiving Location`** field."
            · "If system cannot find the list name you entered, the program prompts **Is this a new
            record?**" · "To add or remove warehouse locations, select **`Maintain List`** from the
            Actions menu." · "Use the **`Save Changes After Use`** prompt to indicate whether or not
            to save changes made to the list during this entry session **after the list is used for
            distribution of this purchase order**."
Evidence:   Distributed Purchase Orders, /articles/15202192105620
Maps to:    **NEW — and a terminology conflict with batch 1**

> Batch 1's `Purchase Order FAQs` called this **`Program List Creation`** reached from the
> **`Receiving At`** field; this article calls it **`Store List Entry`** at the **`Receiving
> Location`** field; and the Merchandising section contains a separate article literally titled
> `Program List Creation`. **Three names for what is probably one mechanism.** The `Save Changes After
> Use` prompt is the interesting part: an operator can edit a shared distribution list for one
> purchase order and choose whether the edit persists for everyone else — a per-use fork of shared
> configuration. Two product classes are excluded outright, which matters because batch 1 Finding 5
> said direct-ship POs are sales-order-owned and Finding 63 says distributed POs cannot be converted:
> **distributed, direct-ship, kit and special-order are four mutually constraining PO shapes.**

### FINDING 66 — Ship-from assignment falls through product settings first, and only unassigned merchandise reaches the picker
Invariant:  "This screen appears automatically when **1)** the **`Create Purchase Order Per Sales
            Order`** field is checked in `Replenish Inventory for Current Back Order Needs`, and
            **2)** the selected vendors have multiple ship-from locations."
Invariant:  "**If the `Create Purchase Orders by Default Vendor Ship From` option is checked**… the
            vendor **appears only if merchandise for that vendor does not have an assigned ship-from
            location in `Advanced Product Settings` (`Vendor Ship-From` field)**. Additionally, when
            creating purchase orders for a vendor that requires purchases from multiple ship-from
            locations, **only the merchandise with no assigned ship-from location defaults to the
            ship-from locations chosen in this screen.**"
Invariant:  "**Once you click Save, the purchase orders are generated.**"
Evidence:   Assign Default Vendor Ship From Locations, /articles/15202193114004
Maps to:    **NEW — resolves the batch-1 Finding 25 inference**

> Batch 1 inferred that this article would suppress the per-PO ship-from prompt. It does not — it is a
> **different mechanism for a different moment**: this is bulk assignment during replenishment, while
> the prompt is interactive PO entry. The precedence is **product-level `Vendor Ship-From` wins**, and
> only unassigned merchandise falls through to the operator's choice. That correctly closes the
> inference. Note that ship-from is also level 1–4 of batch 2's thirteen-level landed cost hierarchy,
> so **choosing a ship-from here silently selects a freight factor.**

### FINDING 67 — Foreign vendors bring a currency dimension that is visible but barely documented
Fields:     `Vendor` · `Currency` · **`Total Foreign Amount`** · **`Total Domestic Amount`** ·
            **`Exchange Rate`**
Invariant:  "To access this option, **the vendor must be from a country foreign to the USA.**"
Related:    PO header carries `Payment Currency` (batch 1 Finding 1); the average-cost cascade
            "**includes the exchange rate associated with the foreign vendor**" (batch 2 Finding 37);
            foreign vendors force an automatic PO hold (batch 1 Finding 12); import addendums print
            separately (batch 1 Finding 26); `Foreign Landed Replacement` is a distinct product cost
            (batch 2 Finding 36).
Evidence:   Exchange Rate Inquiry, /articles/15202208172820
Maps to:    **NEW — pulls five threads into one**

> Foreign sourcing is a first-class dimension running through the whole section: hold behaviour,
> print behaviour, cost fields, average-cost calculation, and now currency conversion on the order
> itself. But **the rate's provenance is never stated** — no article read so far says where the
> exchange rate comes from, when it is captured, or whether it is re-read at receipt. Given batch 2
> Finding 37 has the rate feeding inventory valuation, that is a significant gap.

### FINDING 68 — Vendor alternate addresses are a silent capability that disappears when unconfigured
Invariant:  "When you select this option, **if alternate addresses exist** for the current vendor, this
            screen displays available addresses… **If no alternate addresses exists for the current
            vendor, this action is unavailable.**"
Evidence:   Vendor Alternate Address, /articles/15202208340116
Maps to:    **NEW — minor, but a UI pattern worth recording**

> A menu option that vanishes rather than explaining itself. Combined with batch 1's ship-from prompt
> that *appears* only when alternates exist, **the purchase order entry screen changes shape based on
> vendor configuration**, which makes "what does PO entry look like" an unanswerable question in the
> abstract — the same lesson as run 1's Dynamic Tab Settings and batch 2's configurable add-on labels.

### FINDING 69 — Direct-ship tracking is frozen at order completion and is the only documented Data Warehouse feed
Invariant:  "**Direct Ship tracking numbers cannot be changed once the order is completed.**"
Invariant:  "**NOTE: This information is available for Data Warehouse.**"
Evidence:   Maintain Tracking ID, /articles/15202193119380
Maps to:    **NEW**

> "Completed" is a state that has now blocked three different things across the run: un-receiving
> (batch 1 Finding 18, where completed items are excluded from `Available`), and now tracking-ID
> edits. It is doing a lot of work and **has never been defined in any article read so far**. The
> `Data Warehouse` mention is the only pointer in the entire run to a reporting store outside the
> application, and it is attached to a minor screen — worth chasing for the extraction phase.

### FINDING 70 — The batch's cross-cutting rule: transmission and completion are the two irreversibility gates
Consolidated from evidence across this batch and batches 1 and 3:

| Gate | What it blocks | Evidence |
|---|---|---|
| printed / faxed / emailed | editing without a permission; comment updates from order entry; PO↔SO linkage; **consolidation** | b1 F8/F21, b3 F57, b4 F62 |
| EDI submitted | editing without a permission; resubmission after direct-ship conversion; **consolidation** | b1 F21, b4 F62/F63 |
| received (any quantity) | PO delete; receiving-location change; **direct-ship conversion** | b1 F18/F21, b4 F63 |
| pick-listed / manifested | un-receiving, permanently | b1 F18 |
| **completed** | un-receiving; **tracking ID edits** | b1 F18, b4 F69 |
| pending AP bill exists | **direct-ship conversion** | b4 F63 |
| linked to a sales order | **direct-ship conversion** | b4 F63 |
| distributed PO | **direct-ship conversion**; kits and special orders excluded | b4 F63/F65 |
Maps to:    **NEW — stated as a finding because no single article says it**

> No article in the section states this, but it is the section's actual architecture: **a purchase
> order passes through a sequence of one-way gates, and each gate is enforced by a different subsystem
> — printing, EDI, receiving, logistics, accounting, and sales.** Any rebuild that models PO status as
> a single enum will lose this; what STORIS actually has is a **set of independent latches**, several
> of which are set by modules outside purchasing. This is the highest-value structural observation of
> the run so far and it is assembled from a dozen scattered sentences, none of which say it.

---

## C. Screen and field inventory

**Import Received EDI Documents** *(Dispatch Documents Received)* — `Import Received EDI Documents` ·
**`EDI Provider`**.

**EDI Status Details** — `Container Number` · Grid. Reached from an Actions menu; available only when
a container number is present.

**EDI Advanced Ship Notice Dates** — **`ASN Shipping Date`** · **`ASN Delivery Date`**. Reached from
the extra Actions button on the Merchandise tab of `Enter a Purchase Order`, line selected, EDI active.

**View Purchase Order Line Containers** — `Purchase Order Number` · Grid (one row per container linked
to any line).

**Trip ID** — `Trip ID` *(default `None Selected`)* · **`Trip Quantity`** · grid of **`Status Code` ·
`Description` · `Date`**.

**Maintain Tracking ID** — `Tracking ID` · `Quantity` · Grid. Direct-ship lines only.

**Exchange Rate Inquiry** — `Vendor` · `Currency` · `Total Foreign Amount` · `Total Domestic Amount` ·
`Exchange Rate`. Foreign vendors only.

**Consolidate Purchase Orders** — *Search panel*: Vendor · Receiving Location · Stock · Special Order ·
On Hold · Not on Hold · Creation Date Range · Date Type. *Grid*: checkbox · Purchase Order · Line ·
Product · Vendor Model Number · Order Date · Delivery Date · Vendor · Receiving Location ·
Quantity Ordered · Cost · Extended · View · Maintain · Order Number · Order Line · Special Order
Details. *Date overrides*: New PO Date · New Requested Date · New Delivery Date.
Action: `Condolidate Purchase Orders` *(sic — button label as printed)*.

**Distributed Purchase Orders** — `Store List Entry` at the Receiving Location field; `Purchase Order
List` name · `Description` · `Maintain List` (Actions) · **`Save Changes After Use`** prompt.

**Convert Direct Ship Purchase Order to a Stock Purchase Order** — single action:
`Convert Direct Ship Purchase Order to an Inventory Purchase Order`.

**Transfer on Receipt Quantities** — grid with **locations as columns, PO lines as rows**; quantities
edited per cell. Read-only twin from `View a Purchase Order`. Locations chosen on the
**`Multiple Location Selection`** screen.

**Assign Default Vendor Ship From Locations** — `Vendor` · **`Assign Ship From`** (button →
`Ship From Locations` window) · `Name` · `Ship From Address` · `City / Country`. Save generates the POs.

**Vendor Alternate Address** — list of alternate addresses; double-click to select. Unavailable when
none exist.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Receiving Calendar` | **Vendor EDI Settings** | Whether `Warehouse/Store Receiving Settings`' calendar applies to ASN dates |
| `Include in Supply Calculation` | **Purchase Order Type Settings** | Whether the PO counts as incoming supply (batch 3) |
| **`Transfer on Receipt`** | Purchase Order Type Settings | Enables the transfer-on-receipt grid |
| **`As-Is Reason Code`** association | Purchase Order Type Settings | Also enables transfer-on-receipt; forces one-piece-per-line for serials |
| `Create Purchase Order Per Sales Order` | Replenish Inventory for Current Back Order Needs | Triggers the ship-from assignment screen |
| `Create Purchase Orders by Default Vendor Ship From` | Replenish Inventory for Current Back Order Needs | Restricts the screen to unassigned merchandise |
| `Vendor Ship-From` | **Advanced Product Settings** | **Product-level ship-from wins over the picker** |
| `EDI - Allow Acknowledgment to Adjust Order Quantity` | Purchasing Control Settings | Vendor may change our ordered quantity (batch 1) |
| `Save Changes After Use` | (prompt, Distributed Purchase Orders) | Whether a shared distribution list edit persists |
| `EDI Provider` | Import Received EDI Documents | Which provider's documents to dispatch |

---

## E. Security permissions catalog

*No new permissions surfaced in this batch.* `Edit EDI purchase orders that were electronically
submitted` and `Edit purchase orders that have been printed, faxed or emailed` (batch 1) remain the
governing pair for transmitted orders.

---

## F. State machines and enumerations

**EDI transaction sets** — `810` Invoice · `855` PO Acknowledgement · `856` Shipping Acknowledgement ·
`865` PO Change Request Acknowledgement · `997` Functional Acknowledgement · `315` Status Details ·
`214` Receive POs / Status of Shipment Acknowledgement.
**Inbound invoice states** — received → **hold file** → matched against goods received → released for
payment approval; or → **invoice exception** (PO no longer exists).
**Shipment identifiers** — Container *(EDI-populated, line-level, many per PO)* · Trip ID
*(carrier status codes, line-level, quantity per trip)* · Tracking ID *(manual, direct ship only,
frozen at completion)*.
**Trip status codes** — enumeration **not documented**.
**PO date fields now known** — Order Date · Requested Date · Delivery Date · Acknowledgement Shipping/
Delivery Date · ASN Shipping/Delivery Date · Dock Scheduled · Scheduled Delivery Date · New PO/
Requested/Delivery Date (consolidation overrides).
**Mutually constraining PO shapes** — direct ship · distributed · kit · special order · stock ·
supply · service.
**Direct-ship conversion blockers** — pending AP bill · linked to a sales order · quantity received ·
distributed PO.
**Irreversibility gates** — printed/faxed/emailed · EDI submitted · received · pick-listed/manifested ·
completed (see Finding 70).

---

## G. Sequencing rules

1. Inbound EDI `810` invoices are held until goods are received; `Import Received EDI Documents`
   performs the match and releases them for payment approval.
2. An `810` for a purchase order that no longer exists becomes an **invoice exception**.
3. ASN dates may or may not be adjusted by the warehouse receiving calendar, per `Vendor EDI Settings`.
4. `EDI Status Details` requires a container number.
5. Consolidation sees only **unprinted, untransmitted** purchase order lines.
6. Consolidation dates default from vendor and receiving-location settings unless overridden.
7. Direct-ship conversion requires: no pending AP bill, no sales order link, nothing received, not
   distributed. Cost and freight are **not** recalculated afterwards.
8. A converted direct-ship PO cannot be resubmitted by EDI.
9. Transfer-on-receipt requires a PO type with `Transfer on Receipt` or an As-Is Reason Code; transfer
   quantity need not equal receipt quantity but may not exceed the open order quantity per line.
10. As-is transfers break out to one piece per line because each requires a serial number.
11. Distributed POs may not contain kits or special-order products.
12. Product-level `Vendor Ship-From` is applied before the operator's ship-from choice.
13. Direct-ship tracking IDs freeze at order completion.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Purchase Order Type Settings`** — now carrying at least three behaviour flags across three
  batches. **The highest-priority unread article in the run.**
- **`Report Invoice Exceptions`** — the third exception queue; unread.
- `Vendor EDI Settings` and `EDI Control Settings` — the EDI configuration surface, entirely unread.
- `Warehouse/Store Receiving Settings` — holds the receiving calendar.
- `Multiple Location Selection` screen · `Phantom Process Log` · `Data Warehouse`.

**Documented but ambiguous**
- **What happens to source purchase orders after consolidation** — closed, deleted, or emptied? Not
  stated, and it determines whether history survives.
- **Trip `Status Code` enumeration** — the actual inbound-visibility state machine, undocumented.
- **Which date drives promising** — a PO line can carry at least four date pairs (Finding 60).
- **Where the exchange rate comes from**, when it is captured, and whether it is re-read at receipt —
  material because it feeds average cost (batch 2 Finding 37).
- **"Completed"** — blocks un-receiving and tracking edits; never defined.
- **`Program List Creation` vs `Store List Entry` vs `Receiving At` vs `Receiving Location`** — three
  names for what appears to be one distribution-list mechanism, across three articles.
- **`Date Type`** on the consolidation search — undefined.
- Whether consolidation preserves the sales-order linkage it displays (`Order Number` / `Order Line`)
  or merely shows it for selection.
- Whether an `865` PO Change Request Acknowledgement can alter our order the way the `855` can under
  `EDI - Allow Acknowledgment to Adjust Order Quantity`. Not stated.
- `EDI Status Details` grid contents — "Grid Information" only.

**Inferences (not in section B)**
- Purging a closed or voided PO within its retention window plausibly strands any later inbound `810`
  as an invoice exception (Finding 59). The two facts are documented separately; the connection is mine.
- Consolidation probably closes the source POs, since their lines are merged into a new order; not
  stated anywhere.
- The three distribution-list names are probably one object; not stated.
- `865` is presumably how a vendor proposes a change and `855` how they confirm; the articles list the
  transaction sets without describing their handling.

---

## I. Unknown unknowns

- **Inbound vendor invoices parked in a hold file** until receipt, with dispatch as the release step.
- **A third exception queue** (`Report Invoice Exceptions`) for invoices whose PO has vanished.
- **Seven EDI transaction sets** including `315` status details and `214` shipment status.
- **A vendor-level receiving calendar switch** deciding whether warehouse working days apply to ASNs.
- **Three independent shipment identifiers** each partitioning the same line quantity.
- **Trip status codes** as an undocumented state machine fed by carriers.
- **Consolidation silently excluding transmitted lines.**
- **Direct-ship → stock conversion** that keeps the PO number, appends a comment, and **does not
  recalculate cost or freight**.
- **A converted EDI order becoming unresendable.**
- **Transfer-on-receipt** as a PO-type behaviour that moves stock onward at receipt.
- **As-is receipts exploding to one line per piece** because of serial numbers.
- **Distribution lists that can be edited for one PO with an optional persist prompt.**
- **Kits and special orders barred from distributed POs.**
- **Product-level ship-from silently selecting a landed freight factor.**
- **`Data Warehouse`** as an external reporting target.
- **The five-gate irreversibility model** (Finding 70), enforced by five different modules.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| 810 / 855 / 856 / 865 / 997 / 315 / 214 | EDI transaction sets: invoice, PO ack, ship ack, change-request ack, functional ack, status details, shipment status |
| Hold file | Where inbound EDI invoices wait until goods are received |
| Invoice exception | Raised when an inbound invoice's purchase order no longer exists |
| ASN | Advanced Ship Notice; carries its own shipping and delivery dates per line |
| Receiving Calendar | Vendor EDI setting deciding whether warehouse working days adjust ASN dates |
| Container | EDI-populated shipment grouping, linked at PO line level |
| Trip ID | Carrier movement identifier per PO line, carrying status codes and a trip quantity |
| Tracking ID | Manually entered direct-ship shipment identifier; frozen at completion |
| Consolidate Purchase Orders | Merges untransmitted PO lines into a new purchase order |
| Transfer on Receipt | PO-type behaviour distributing received stock onward at receipt |
| As-Is Reason Code | PO-type association that enables transfer-on-receipt and forces serial-per-line |
| Store List Entry / Program List Creation | Named, reusable multi-location distribution list |
| Save Changes After Use | Prompt deciding whether a shared distribution list edit persists |
| Vendor Ship-From | Product-level override that pre-empts operator ship-from choice; also a landed cost hierarchy level |
| Data Warehouse | External reporting store; mentioned once, for direct-ship tracking data |

---

## Contract adjudication — batch 4

| Contract | Verdict | Basis |
|---|---|---|
| **W-006** | **CONFIRMED, with escape hatch** | Direct-ship POs are sales-order-owned; conversion requires breaking that link and does not recalculate cost (F63) |
| **W-044** | **extended** | Five independent irreversibility gates, not one status (F70) |
| **W-041** | **supported** | Direct-ship conversion is another manual cost-restatement path (F63) |
| **W-012** | **relevant** | Inbound invoices held against receipt, not posted on arrival (F59) |
| **W-052 / W-053** | **not documented in this section** | — |

---

## Next — batch 5: merchandising decisions, product performance and buying
