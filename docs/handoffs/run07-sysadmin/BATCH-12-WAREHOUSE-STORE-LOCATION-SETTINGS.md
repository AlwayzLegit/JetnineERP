# Run 07 — System Administration — Batch 12: Warehouse/Store Location Settings

Status: complete. Findings 475–490. Read-only throughout.

**The second-most-referenced unread record in the audit.** Run 04 cited it from six batches with
ten-plus named fields across three tabs it could only infer. **It is twelve pages**, and it closes
seven carried questions.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Warehouse/Store Location Settings** | 15243033212820 | read — **twelve pages** |

Filed under **Vendor Settings** (94) — not where the audit expected it.

---

## B. Wiring findings

### FINDING 475 — Creating a location creates a GL cost centre, and the codes must not collide

- **Invariant:** every location has an auto-created cost centre, and numeric equivalence blocks creation.
- **Evidence** — `Warehouse/Store Location Settings`, **Cost Centers**:
  > "Whenever you create a location record, **the system automatically creates an associated cost center**. When you click on Save, the option appears to **add the cost center to existing GL accounts**. The system creates cost centers to **track general ledger activity by location**. **If using QuickBooks®, you must set up a matching cost center "CLASS"** in your third-party accounting software for each cost center in STORIS."
  > "The system **does not allow you to create a new location if an associated GL cost center already exists**… **This includes GL cost centers whose codes are numerically equivalent** to their associated locations. For example, if a GL cost center exists with a code of **'009'**, and you attempt to create a location with a code of **'9'**, an error message appears and the system disallows the action."
- **Maps to:** run 01 (General Ledger, cost centres) · run 07 F444 (`TPA`); `W-052` / `W-053`; **NEW**.

> **The chart of accounts and the location table are coupled at creation.** Opening a store writes a
> cost centre and offers to attach it to every existing GL account — which is the correct behaviour and
> a substantial write.
>
> **The numeric-equivalence rule is the trap.** `'009'` and `'9'` collide, so location codes cannot be
> zero-padded variants of existing cost centres. That is the kind of constraint that surfaces years
> later when a company opens its tenth store.
>
> **QuickBooks is named**, which places STORIS's third-party accounting integration concretely —
> `Third-Party Accounting Control Settings` and `TPA Transmission Phantom` (run 07 F444) now have a
> product behind them, and the requirement is manual: **a matching CLASS per cost centre, maintained
> by hand in the other system.**

### FINDING 476 — A location record auto-creates a customer record

- **Invariant:** transfers between locations require the destination to exist as a customer.
- **Evidence** — `Warehouse/Store Location Settings`, under **Warehouse/Store Code**:
  > "When you create a **merchandise transfer between locations**, the system **automatically creates a corresponding customer record using the same code as the Warehouse Location record.**"
- **Maps to:** run 04 (transfers) · run 03 (customers); `W-042`; **NEW**.

> **Locations are customers.** A transfer is modelled as a shipment to a customer whose code is the
> warehouse code, created on demand the first time you transfer there.
>
> That is an elegant reuse — it means transfers inherit the delivery, routing and manifest machinery
> documented across run 04 without a parallel model — and it has a consequence worth stating: **the
> customer master contains records that are not customers.** Any count, extract, mailing list or
> migration of customers will include warehouses unless it excludes them, and nothing in run 03's
> customer work mentioned it.

### FINDING 477 — Blank and zero mean different things in the price variance override

- **Invariant:** an empty variance field defers to the system; a zero enforces no variance at all.
- **Evidence** — `Warehouse/Store Location Settings`, **General** page, **Price Variances Rules**:
  > "The variance percent you enter here **overrides** the variance percent set on the Pricing and Commissions tab in the Point of Sale Control Settings. Thus, **if you enter "0" here, the system applies a zero variance percent. To bypass this setting and use the setting in the Point of Sale Control Settings, leave this field blank.**"
  Fields: `Variance %` · **`Special Order Variance %`** · `Variance Exceeded Alert` ·
  `Reason Required` · `Comment Required` · **`Selling Price is Below Cost`** · **`Gross Profit %`** ·
  **`Minimum Gross Profit Not Met`**.
- **Maps to:** run 07 F345 · batch 11 F468 · run 06 F316 — **the four-level variance chain, completed**;
  run 03 F13; `W-061`.

> **Blank defers, zero forbids.** That is the cleanest statement of a fall-through convention the audit
> has found, and it resolves an ambiguity that runs through every hierarchy documented in seven runs:
> **how does a level opt out?**
>
> Batch 11 F468 counted four levels for price variance — product, location, system, and the per-user
> `Maximum Price Variance` permission. **This says how the location level abstains**, and by
> implication how the others do.
>
> **`Special Order Variance %` is a separate percentage** at location level, which closes run 03 F13's
> *"three-level percentage fall-through"* for special-order price variance — the third level is here.
>
> And three further fields extend the control beyond variance into **margin**: `Selling Price is Below
> Cost`, `Gross Profit %`, `Minimum Gross Profit Not Met`. So a store can enforce a minimum gross
> profit independently of a price-variance ceiling.

### FINDING 478 — The `Accessible Locations List` is the warehouse-record fallback, confirmed at source

- **Invariant:** a location holds a list used when the user record has none.
- **Evidence** — `Warehouse/Store Location Settings`:
  > "Use the **`Accessible Locations List`** field on the **Miscellaneous** page to specify a list of locations (if any) to which you want to grant employees access. **The list affects all employees who sign on to the selected location. The system references this list when a location list has not been specified in user settings.**"
  Miscellaneous page, **User Accessibility**: `Locations` · `Lists`.
- **Maps to:** batch 6 F402 case 4b — **CONFIRMED at source**; batch 7 F414, F416; `W-050`.

> Batch 6 F402 read the four-level Regional Processing hierarchy and found that **a user with no
> location list inherits the list attached to wherever they logged in.** **Confirmed from the location
> record**, and it restates the consequence plainly: *"affects all employees who sign on to the
> selected location."*
>
> So an employee's scope is a function of **where they are standing**, which combines with run 06
> F325's `Switch User Location` and batch 7 F415's session accumulation to make access genuinely
> dynamic. **Three independent mechanisms move a user's location scope during a working day.**

### FINDING 479 — Floats require an interim area, closing run 04's float model

- **Invariant:** the float feature cannot be activated without at least one drop-to-interim setting.
- **Evidence** — `Warehouse/Store Location Settings`, **Barcode** page, **Interim Areas**:
  > "An **interim location** is defined as the storage location of a piece that **has been picked but hasn't been moved to the prep or stage location**. After merchandise is picked, it is dropped at an interim location **waiting for another user to move it** to the next location and status."
  > "**If you use Floats, you must check the box for at least one of the following "drop off…to interim" settings in order to check the box at the "Activate Float feature" setting.**"
  Fields: `Drop off Transfers to Interim` · `Drop off Customer Pickups to Interim` ·
  `Drop off Customer Deliveries to Interim` · `Drop off All into Interim` ·
  **`Activate Float feature for this location`**
- **Maps to:** run 04 F240, F241, F243 — **CONFIRMED and completed**; `W-055`.

> Run 04 F241 found the five-stage pipeline with a *"configurable interim hop"* and F240 found floats
> as tagged containers, noting that *"two optional features that, combined, force a third"* — the
> mandatory Move From Interim step.
>
> **This is the dependency stated at source, and it runs the other way too**: you cannot switch floats
> on without an interim area. **Floats and interim are a package.**
>
> The interim definition is also sharper than run 04 could infer: *"picked but hasn't been moved to
> the prep or stage location… **waiting for another user** to move it."* **Interim exists to hand work
> between people**, which is why floats matter there — you leave a loaded cart for someone else.

### FINDING 480 — The three barcode architectures are mutually exclusive per location

- **Invariant:** RF Bar Code, Batch Bar Code and RF Physical Count cannot coexist at a location.
- **Evidence** — `Warehouse/Store Location Settings`, **Barcode** page:
  > "**NOTE: The RF Bar Code, Batch Bar Code, and RF Physical Count settings are mutually exclusive. That is, when you enable one, you cannot enable the others.**"
  Fields: `Batch Barcode - Activate at this Location` · `Barcode Warehouse Management` ·
  `RF BARCODE - Activate at this Location` · `RF Physical Count - Active for RF Users at a Store
  Location`.
- **Maps to:** run 04 F214 (*"five distinct barcode architectures"*) — **CONFIRMED and constrained**;
  run 07 F377 (`Barcode Sites` licensing); `W-050`.

> Run 04 F214 found five barcode architectures and noted their capabilities differ — **only RF picks**.
> It could not say whether a site could run several.
>
> **Three of the five are mutually exclusive at a location.** So a warehouse is *either* batch *or* RF
> *or* RF-physical-count, and run 04's conclusion that *"a site running Batch Bar Code has no scanned
> picking at all"* is confirmed as a per-location fact.
>
> Combined with run 07 F377's `Barcode Sites` and `AWM Sites` licence counts, **the warehouse
> capability map is a table of locations × one architecture each**, bounded by purchased counts. That
> is a concrete, short artefact somebody at LA Mattress can produce.

### FINDING 481 — Picking has four sequences, a method, and a zone assignment window

- **Invariant:** pick path is configured as up to four ordered sequences with an alternate.
- **Evidence** — `Warehouse/Store Location Settings`, **Barcode** page, **Picking**:
  `RF Picking - Activate at this Location` · **`Picking Method`** ·
  **`Picking Sequence 1 (NN,NN)` · `2` · `3` · `4`** · **`Alternate Pick Sequence`** ·
  `Customer Pickups by Order` · `Customer Deliveries by Route` · `Merchandise Transfers by Route` ·
  `Pick Transfers by Final Order` · `Pick Deliveries by Order Number` · `Drop off All into Staging` ·
  **`Limit One Picker to an Aisle`**
  And, on Inventory & Logistics: **`Priority Picking Active`** with a
  **`Picking By Zone Assignment Window`**:
  > "Use that window to assign **picking sequences for the Picking Zone feature**. Note that [it] is available only for locations that are **both location-tracked and verified**."
  > "If you mark a location for **priority picking**, the system **excludes existing pieces in the storage location** from priority picking."
- **Maps to:** run 04 F229 (`Storage Location Sort Sequence`, `Limit One Picker to an Aisle`) ·
  run 04 F239 (`AS` and `PS` scanner codes) · run 04 F244 (pick dispatch) — **all confirmed and
  extended**; `W-055`.

> Run 04 F229 found aisle locking keyed on `Storage Location Sort Sequence` and observed that **"the
> aisle is defined by a sort order, not a location attribute."** **Four sequences in `(NN,NN)` format**
> — position pairs — plus an alternate, confirm that and give the shape.
>
> **`Alternate Pick Sequence`** is what run 04 F239's `AS` scanner code toggles, and
> **`Picking Method`** governs the boustrophedon behaviour F239 recorded.
>
> **Five by-order/by-route switches** confirm run 04 F244's dispatch model — pickups by order,
> deliveries by route, transfers by route, transfers by final order, deliveries by order number —
> so *how work is handed out* is five checkboxes.
>
> **Picking Zones** are new and require a location to be **location-tracked *and* verified**.
> **`Verified`** is a location flag the audit has not met, gating several features.

### FINDING 482 — Crossdock has four settings and its own label forms

- **Invariant:** crossdock is configured with day windows, segregation, and dedicated label forms.
- **Evidence** — `Warehouse/Store Location Settings`, **Barcode** page, **RF Receiving**:
  **`Segregate Cross Dock Linked Transfers`** · **`Cross Dock Order Days`** ·
  **`Cross Dock Transfer Days`**
  > "The next two cross dock settings are **exported to Data Warehouse**."
  And **Default Label Forms**: **`Cross Dock Form`** · **`Cross Dock Multi-Carton Form`**.
  Plus, batch 11 F463: `Include in Cross Dock` on the product.
- **Maps to:** run 04 F232 (*"a whole inbound pattern with no descriptive article"*) — **substantially
  closed**; batch 11 F463; run 03 (Data Warehouse); `W-055`.

> Run 04 F232 found crossdock as a single filter checkbox on the putaway plan and recorded it in §I as
> an unknown unknown: *"if crossdock exists, the assumption that all receipts land somewhere is
> wrong."*
>
> **It exists, it is configured per location, and it has two day-windows** — `Cross Dock Order Days`
> and `Cross Dock Transfer Days` — which are presumably how far ahead a receipt may be matched to a
> waiting order or onward transfer. With batch 11 F463's product-level `Include in Cross Dock`, the
> opt-in is two-sided.
>
> **Dedicated label forms** mean crossdocked goods are physically marked differently, which is exactly
> what you need when stock must not be put away.
>
> **The two day-settings are exported to Data Warehouse** — the first time the audit has seen a setting
> flagged as feeding the reporting warehouse run 03 identified as one of five reporting layers.

### FINDING 483 — Postponements are counted, capped, and exempt `CWC` conversions

- **Invariant:** delivery and pickup date changes are counted as postponements, with a per-location limit.
- **Evidence** — `Warehouse/Store Location Settings`, **Inventory & Logistics** page, **Fulfillment**:
  > "The following four fields are active only if the **Auto Stock Release** feature is active…"
  **`Release Past Delivery Date - Times` · `Release Past Pickup Date - Times` ·
  `Delivery Postponements - Times` · `Pickup Postponements - Times`**
  > "**A delivery/pickup date is NOT counted as a postponement if you are changing a delivery/pickup date from Customer Will Call to an Estimated or Scheduled date.**"
  Plus **`Restrict Scheduled Date`**.
- **Maps to:** run 07 F337 (*"These entries must be set to 1 if this location has Delivery
  Postponements Times or Pickup Postponements Times set to 0"*) — **the other half**; run 04 F167
  (`CWC` scheduling) · run 04 F165; `W-012`; `W-055`.

> Batch 1 F337 quoted the POS Control Settings note that **maximum fulfillments must be 1 when
> postponement limits are zero.** **These are the postponement fields**, and there are four: two
> counting how often a date may move, two governing auto-release past the date.
>
> **The `CWC` exemption is the operationally important part.** Run 04 F167 found the routine that
> converts `CWC`/`ASAP` orders to Estimated or Scheduled. **That conversion does not burn a
> postponement** — which is right, since the customer never had a date to postpone, and it means the
> unscheduled backlog can be scheduled without penalty.
>
> **`Auto Stock Release`** is a named feature the audit has not met, gating all four fields.

### FINDING 484 — Inventory Formations appear as three scheduling and reservation exclusions

- **Invariant:** formations can be included as reserved, excluded from scheduling, or excluded from alternate stock.
- **Evidence** — `Warehouse/Store Location Settings`, **Inventory & Logistics** page:
  **`Formation - Include as Reserved`** · **`Formation - Exclude from Scheduling`** ·
  **`Formation - Exclude from Alternate Stock Location`**
- **Maps to:** batch 11 F471 (five sightings, undefined) · run 04 batch 11 §F
  (`Multiple Inventory Formation Selection`) — **a sixth, seventh and eighth sighting**; `W-055`.

> **Eight sightings across three runs and still no definition** — but the context has narrowed
> considerably. A formation can be **treated as reserved**, **kept out of scheduling**, and **kept out
> of alternate-stock sourcing**. Those are inventory-availability behaviours, applied to a *group*.
>
> Together with batch 11 F471's `Related Inventory Formations`, `Merge History From` and
> `Web Related Inventory Formations`, a formation looks like **a named set of products that behaves as
> a unit for availability, merchandising and history** — a collection or a kit-like construct.
>
> **`Inventory Formations Overview` remains unread and is now the single highest-value article
> outstanding**, because these three exclusions materially affect what is sellable and schedulable.

### FINDING 485 — Locations can be invisible, and invisibility has its own RF prompt

- **Invariant:** a location can exist without being visible, with a special scanner behaviour.
- **Evidence** — `Warehouse/Store Location Settings`, Inventory & Logistics:
  **`Inventory Piece Tracking` · `Location Tracked` · `Verified` · `Invisible Location` ·
  `Third Party AWM Active` · `Priority Picking Active`**
  And Barcode → RF Physical Count: **`Use Area Prompt for Invisible Locator Locations`** ·
  `Use STORIS label as UPC`.
- **Maps to:** run 04 (storage locations) · batch 6; `W-055`; **NEW**.

> **`Invisible Location` is a new concept** and it pairs with `Use Area Prompt for Invisible Locator
> Locations` on the RF count page — so an invisible location is one the scanner prompts for by *area*
> rather than by exact bin.
>
> The likely purpose is a location that holds stock without being a pickable bin — a showroom floor, a
> staging area, a truck. Run 04 found the truck and dock as storage locations (F190) and `RESEARCH` as
> a quarantine bin (F218); **invisibility may be how those are kept out of the pick path.**
>
> **`Verified`** gates the delivery/transfer/pickup tracking fields and the picking-zone window (F481),
> so it is a prerequisite flag for location-tracked features. Its verification routine is named as a
> related article: `Tracked Warehouse Location Verification Settings`.

### FINDING 486 — Franchises exist

- **Invariant:** locations can be franchises with a number and a changeover date.
- **Evidence** — `Warehouse/Store Location Settings`, **Miscellaneous** page:
  > "**Franchise Information** — The following fields are active only if **franchises exist in your system**."
  **`Number`** · **`Changeover Date`**
- **Maps to:** run 07 F379 (`Multi-Company Processing`); **NEW**.

> **First sighting of franchising in seven runs.** Two fields, conditional on franchises existing, with
> a **changeover date** — the date a location becomes, or ceases to be, a franchise.
>
> With `Multi-Company Processing` (batch 4 F379) and `Company` on this page and on the user record,
> **STORIS supports multi-entity operation at three levels: company, franchise, location.** Seven runs
> modelled a single business.

### FINDING 487 — Multi-lingual printing is a four-case truth table

- **Invariant:** two checkboxes decide whether documents print in the user's or the location's language, and whether a prompt appears.
- **Evidence** — `Warehouse/Store Location Settings`, **Miscellaneous** page, verbatim table:

| `Print Multi-Lingual POS Documents` | `Always Print in Default Language` | Behaviour |
|---|---|---|
| Not checked | Not checked | "Directly prints document in the **user's** default language." |
| **Checked** | Not checked | "Displays **Select Printable Language** screen with the **user's** default language selected and in first row." |
| Not checked | **Checked** | "Directly prints document in the **location's** default language." |
| **Checked** | **Checked** | "Displays Select Printable Language screen with the **location's** default language selected and in first row." |

  Plus `Document Language` · `Language`, and `Language Code` on the user record (batch 7 §C).
- **Maps to:** run 06 (Printing) · batch 7 F426; **NEW**.

> **Language is a first-class dimension** — on the user, on the location, and on the document — and the
> vendor publishes the full truth table rather than leaving it to be worked out.
>
> That is the second four-case truth table the audit has found in run 07 after batch 1 F342's
> protection-plan attachment. **Where STORIS documents combinations exhaustively, it is worth copying
> the table verbatim**; those are the places the vendor knew people would get it wrong.
>
> `Description Field - Language Translation Entry` in User Settings (batch 9 F452) is where the
> translations live.

### FINDING 488 — Four credit bureaus are named, with a preferred-bureau setting

- **Invariant:** credit bureau integration is per location with a named provider list.
- **Evidence** — `Warehouse/Store Location Settings`, **Credit Application** page:
  > "This page is active only if the **Credit Application Module** is active on your system."
  `Credit Bureau Module Active` · **`Preferred Credit Bureau`** · `Skip Credit Bureau Transmission` ·
  `Bureau Member Number` · **`Experian` · `Equifax` · `Trans Union` · `Interconnect`**
- **Maps to:** run 03 F90–F94 (credit applications) · run 04 F201 (`C6`, `F3`) · batch 4 F378
  (encryptable credit scores); `W-030`; **NEW**.

> Run 03 dissected the credit application in depth — *"a very large set of personal and financial
> data"* — without ever identifying who it goes to. **Three named bureaus plus Interconnect**, each
> with a member number, selected per location.
>
> **`Skip Credit Bureau Transmission`** is a per-location bypass, which matters for compliance: a
> location can be configured to collect the application and not pull a report.
>
> These are the **eleventh through fourteenth named external dependencies** in the audit. With
> flexEngage, four routing vendors, a WMS, an alternate tax provider, fifteen finance providers, three
> address-verification services, QuickBooks, three furniture manufacturers and 8+ EDI document types,
> **the external-dependency inventory the audit has been recommending since run 04 is now a
> substantial document in its own right.**

### FINDING 489 — Card and check processing are configured per location, with fraud analysis

- **Invariant:** payment device and merchant settings are location-level.
- **Evidence** — **Credit Card** page: `EMV Enabled - NextGen` ·
  `Allow Manual Entry of EMV Credit Card Number` · `Signature Capture` ·
  **`Enable VISA Rules for Payment of Extended Receivables`** · `Allow OBP Payments` ·
  **`Enable Credit Card Fraud Analysis`** · **`EMV Provider`** · `Print Merchant Receipt` ·
  `Print Customer Receipt`
  **Checks** page: **`Electronic Check Conversion Merchant`** ·
  **`Electronic Check Guarantee Merchant`**
  **Online Finance** page: `Transmit Application On Line` · `Finance Application Manager` ·
  **`Preferred Finance Provider`** · Finance Payment Estimator Defaults *(Options 1–3, Allow Changes,
  falling back to Financing Control Settings)* · **Active Merchants** *(Provider Filter · Merchant
  Number)*
- **Maps to:** run 03 F34–F44, F85–F95 · run 04 F201 (`I3`/`I4` fraud analysis) — **the fraud vendor's
  switch, found**; `W-030`; `W-050`.

> Run 04 F201 found hold codes `I3` and `I4` driven by *"the selected fraud analysis vendor"* and the
> audit recorded the vendor as unnamed across three runs. **`Enable Credit Card Fraud Analysis` is the
> switch**, per location — though the vendor is still not named here either.
>
> **`Enable VISA Rules for Payment of Extended Receivables`** is a card-scheme-specific compliance
> rule, and the second scheme-level requirement after PCI (run 06 F323, run 07 F386).
>
> **The Finance Payment Estimator falls back from location to `Financing Control Settings`** — a
> **sixteenth fall-through hierarchy**, and the same shape as the Revolving Payment Estimator on the
> Revolving page.

### FINDING 490 — Twelve pages, and the record spans every module the audit covered

- **Invariant:** location configuration reaches accounting, sales, logistics, warehouse, payments, financing and printing.
- **Evidence** — page headings verbatim:
  > **General · Inventory & Logistics · Credit Card · Checks · Online Finance · Barcode · Purchasing · Miscellaneous · Replenishment · Credit Application · Revolving · User Defined Settings**
- **Maps to:** all seven runs.

> Run 04 cited this record from six batches and named three tabs — `Bar Code`, plus scheduling and
> manifest fields. **There are twelve pages**, and the audit had located roughly ten fields of what
> looks like two hundred.
>
> **It is the location-level twin of `Point of Sale Control Settings`** (batch 1 F337): the same
> breadth, the same span across modules, and the same relationship to the audit's findings — cited
> constantly, enumerated never.
>
> Together the two records are the **configuration of the business**, and batch 1's recommendation now
> extends: **a configuration audit needs both, and this one needs it per location.**

---

## C. Screen and field inventory

**`Warehouse/Store Location Settings`** — twelve pages:

| Page | Blocks |
|---|---|
| **General** | Location Type · Company · **Region** · **District** · Bank Number · Address Information *(7)* · Phone Contacts *(Location · Service · Delivery · Customer Pickup)* · **Price Variances Rules** *(8)* · Other *(Maximum Subtotal Discount % · Due Day · Date Closed · Miscellaneous Fee/Charge · Web Selling Location · Allow Creation of New Orders in ERP · **Alternate Tax ID** · **Alternate Tax Interface**)* |
| **Inventory & Logistics** | Inventory Piece Tracking *(6, incl. **Invisible Location**, **Verified**, **Third Party AWM Active**, **Priority Picking Active**)* · **Default Storage Locations** *(Receiving · Return Pickup · Drop Off · Service/Repair · **Repossessed**)* · Delivery Locations *(2)* · Customer Pickup Locations *(2)* · **Third Party Mapping Software** *(Interface · Delivery/Transfer/Service Active · **Allow Parcel Routes** · **Dispatch Track Default Account** · **Dispatch Track Customer Pickup Account**)* · **Fulfillment** *(4 postponement fields · Restrict Scheduled Date)* · Transfers *(Transfer Route · As-Is Transfer Reason)* · Third Party Fulfillment Scheduling · **3 Formation settings** · Other *(Customer Service Location · Service Order Stock Location · **Alternate Stock Location** · **Prefer Purchase Order Over Schema _ Days** · Include Fulfillments with Reserved Auto-Transfers on Manifest _ Days · Include Transfers with Linked Transfers on Manifest · **Ignore Stock Schema at Alternate Location**)* |
| **Credit Card** | 9 fields *(F489)* |
| **Checks** | 2 merchant fields |
| **Online Finance** | 3 + Estimator Defaults + Active Merchants grid |
| **Barcode** | Batch/RF/RF-Count activation *(mutually exclusive)* · **Picking** *(12)* · **Interim Areas** *(5)* · **Prep Areas** *(7)* · **Prep Labels** *(3)* · **Advanced Warehouse Management** *(5, incl. **Activate Temporary Shutdown**, **Putaway Bin Fill Options**)* · RF Physical Count *(3)* · RF Cycle Count *(1)* · **RF Receiving** *(4 crossdock)* · **Default Label Forms** *(11)* · Standard *(4)* · Other *(Stock Lookup Location · **Create Floor Sample Label Queue on Product Change**)* |
| **Purchasing** | Location Prefix · PO Receiving Location · PO Replenishment · Replenishment Location |
| **Miscellaneous** | Printing *(Cycle Report Form · Valid Printer Zones · **Digital Receipts Enabled**)* · Document Language *(4 + truth table)* · **Franchise Information** *(2)* · **User Accessibility** *(Locations · Lists)* · Other *(**STORIS Mail ID** · From Email Address · Inactive Auto Distributed Transfer Calculation · Use Warehouse Inventory Price · Automated and Manual POS Numbers · **Prohibit Customer Personal Information when not Required by Sale** · **Enable Document Signature Capture and Document Archive** · Enable Signatures on Tethered/Mobile Devices)* |
| **Replenishment** | Replenishment Warehouse *(First–Fifth)* · **Automatically Replenish On** *(Next Available Date **or** days of the week, mutually exclusive)* |
| **Credit Application** | 4 + three bureaus + Interconnect |
| **Revolving** | Remit-To Address *(6)* · Revolving Payment Estimator Defaults *(falls back to Revolving Receivables Control Settings)* |
| **User Defined Settings** | Setting · Response · Select *(from `User Defined Settings` with Source = Location Settings)* |

---

## D. Control settings catalog (additions)

| Setting | Effect |
|---|---|
| **`Accessible Locations List`** *(Miscellaneous)* | The warehouse-record fallback in Regional Processing (F478) |
| **`Variance %` blank vs `0`** *(General)* | **Blank defers to POS; zero forbids variance** (F477) |
| **`Activate Float feature for this location`** *(Barcode)* | Requires at least one drop-to-interim setting (F479) |
| **`Cross Dock Order Days` / `Cross Dock Transfer Days`** | Crossdock windows; **exported to Data Warehouse** (F482) |
| **`Delivery/Pickup Postponements - Times`** | Date-change caps; **`CWC` conversion exempt** (F483) |
| **3 `Formation -` settings** | Formation-level reservation and scheduling exclusions (F484) |
| **`Prefer Purchase Order Over Schema _ Days`** | Confirms batch 2 F357 at source |
| **`Enable Credit Card Fraud Analysis`** | The switch behind hold codes `I3`/`I4` (F489) |
| **`Prohibit Customer Personal Information when not Required by Sale`** | Confirms run 07 F337 |

---

## F. State machines and enumerations (additions)

- **Barcode architectures per location:** exactly one of RF · Batch · RF Physical Count (F480).
- **Picking sequences (4 + alternate)**, five by-order/by-route switches (F481).
- **Default storage locations (5):** Receiving · Return Pickup · Drop Off · Service/Repair ·
  **Repossessed**.
- **Label forms (11 defaults + 4 standard)**, including two crossdock forms (F482).
- **Credit bureaus (4):** Experian · Equifax · Trans Union · Interconnect (F488).
- **Multi-lingual printing (4 cases)** (F487).
- **Replenishment scheduling:** Next Available Date **or** days of the week, mutually exclusive.
- **Entity levels (3):** company · **franchise** · location (F486).

---

## G. Sequencing rules

1. Location created → **GL cost centre auto-created**, offered against existing accounts; blocked if a
   numerically equivalent cost centre exists (F475).
2. First transfer to a location → **a customer record is auto-created** with the warehouse code (F476).
3. Price variance resolves **product → location → system**, where **blank defers and zero forbids**
   (F477, batch 11 F468).
4. User signs on → if their record has no location list, **the location's `Accessible Locations List`
   applies** (F478).
5. Pick → **interim** *(if configured)* → prep → stage → load; **floats require interim** (F479).

---

## H. Open questions and gaps

### Resolved this batch

- **`Warehouse/Store Location Settings`** — the audit's second-most-referenced unread record (F490).
- **The float/interim dependency** — run 04 F240, F241 (F479).
- **Barcode architecture exclusivity** — run 04 F214 (F480).
- **Crossdock configuration** — run 04 F232's unknown unknown, substantially closed (F482).
- **The warehouse-record location-list fallback** — batch 6 F402 case 4b (F478).
- **How a level abstains from a fall-through** — blank vs zero (F477).
- **The credit-card fraud analysis switch** — run 04 F201's `I3`/`I4` (F489).

### Newly opened

- **`Invisible Location`** and **`Verified`** — two location flags gating several features (F485).
- **Franchises** (F486) and the three-level entity model.
- **`Auto Stock Release`** — a named feature gating four postponement fields (F483).
- **`Activate Temporary Shutdown`**, **`Putaway Bin Fill Options`**, **`Ignore Stock Schema at
  Alternate Location`**, **`Automated and Manual POS Numbers`**, **`Use Warehouse Inventory Price`**,
  **`Inactive Auto Distributed Transfer Calculation`** — named, unexplained.
- **`STORIS Mail ID` per location** — a location-level messenger identity (F490 §C).

### Still open

- **`Inventory Formation`** — now **eight sightings**, still undefined. `Inventory Formations Overview`
  is the highest-value unread article in the audit (F484).
- `Stock Location Schema` · `Picking In STORIS Overview` · `Tracked Warehouse Location Verification
  Settings` · `Warehouse Inventory Settings` — named as related, unread.

### Inferences

- **I-84:** An `Invisible Location` holds stock without being a pickable bin — showrooms, staging,
  trucks, `RESEARCH`. *From the field pairing with the RF area prompt; not stated.*
- **I-85:** `Cross Dock Order Days` and `Cross Dock Transfer Days` are the forward windows within which
  an incoming receipt may be matched to a waiting order or onward transfer. *By analogy with
  `Prefer Purchase Order Over Schema Days`; not stated.*

---

## I. Unknown unknowns

- **Locations are customers** (F476). The customer master contains warehouse records, and no run-03
  finding mentioned it. Any customer count, extract or migration is affected.
- **Creating a store writes to the chart of accounts** (F475), with a code-collision rule that will
  eventually bite.
- **Franchises and multi-company** (F486, batch 4 F379) — seven runs modelled one business.
- **This record is the location-level twin of Point of Sale Control Settings** (F490), and the audit
  had ten of roughly two hundred fields. **Configuration is where the system actually lives**, and the
  audit has now demonstrated that twice.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Cost centre** | Auto-created per location; tracks GL activity by location; needs a QuickBooks CLASS |
| **Interim area** | Where picked stock waits for another user to move it to prep or stage |
| **Invisible Location** | A location prompted by area rather than bin |
| **Verified** | Location flag gating tracked-location features |
| **Picking Zone** | Assigned pick sequences; requires location-tracked and verified |
| **Cross Dock Order/Transfer Days** | Crossdock matching windows, exported to Data Warehouse |
| **Postponement** | A counted delivery or pickup date change; `CWC` conversions exempt |
| **Franchise** | A location attribute with a changeover date |

---

## Contract adjudication — batch 12

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED at source** | `Accessible Locations List` is the warehouse fallback (F478) |
| **W-052 / W-053** *(GL)* | **CONFIRMED and extended** | Locations auto-create cost centres and attach to GL accounts (F475) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED** | Formation exclusions (F484); crossdock windows (F482); postponement caps (F483) |
| **W-061** *(cost and margin)* | **CONFIRMED** | Location-level margin controls; blank-vs-zero deferral (F477) |
| **W-030** *(financing)* | **CONFIRMED and extended** | Four credit bureaus; fraud analysis switch (F488, F489) |
| **W-012** *(dates)* | **CONFIRMED** | Postponement counting with the `CWC` exemption (F483) |
| **W-042** *(propagation)* | **CONFIRMED** | Location creation propagates to GL and to the customer master (F475, F476) |
| **Franchising / multi-entity** | **NEW** | F486 |
| **Language** | **NEW — a first-class dimension** | F487 |

---

## Next — batch 13

`Inventory Formations Overview` *(the highest-value unread article in the audit)* ·
`Stock Location Schema` · `Warehouse Inventory Settings` · `Protection Plan Settings` ·
`District and Regional Product Settings` — then coverage statements closing **Product Settings** (88)
and **Vendor Settings** (94).
