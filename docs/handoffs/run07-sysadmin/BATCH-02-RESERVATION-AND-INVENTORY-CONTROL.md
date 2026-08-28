# Run 07 — System Administration — Batch 2: The reservation model, Inventory Control, zero-cost handling

Status: complete. Findings 353–365. Read-only throughout. No setting saved.

**This batch closes the reservation model** — chased across runs 03, 04 and 06 and never resolved —
**and completes the cost-exception model** begun in run 02.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Stock Reservation Settings** | 15186451768852 | read — **the reservation model, with four worked cases** |
| 2 | **Inventory Control Settings** | 15186452794132 | read — four tabs |
| 3 | **Zero-Cost Exception Handling** | 15186452150932 | read — **four handling options** |

---

## B. Wiring findings

### FINDING 353 — Reservation is configured at three levels, each overriding the one above

- **Invariant:** reservation method is set system-wide, per product, and per region-product, in a strict override chain.
- **Evidence** — `Stock Reservation Settings`:
  > "Use the **Reservation Priority** and **Reservation Date** fields, available on the **Inventory Control Settings, Advanced Product Settings, and District and Regional Product Settings** screens, to specify how goods are to be reserved to line items."

| Level | Screen | Options |
|---|---|---|
| **System** | Inventory Control Settings → General | 3 |
| **Product** | Advanced Product Settings → Settings | 4 — including **`Use Inventory Control Setting`** |
| **Region-product** | District and Regional Product Settings → Regional Settings | 4 — including **`Use Product Setting`** |

  > "If you select **Use Inventory Control Setting** at Reservation Priority you must **also** select Use Inventory Control Setting at Reservation Date."
- **Maps to:** `W-055` / `W-056` — **CONFIRMED; the model chased since run 03 is now complete**;
  run 04 F190, F238; run 06 F328.

> **The seventh named fall-through hierarchy in the audit, and the most consequential.** Each lower
> level's first option is *"defer to the level above"*, so the chain is explicit rather than implied —
> and the two fields must defer **together**, which is a constraint a rebuild would not think to add.
>
> The audit has been circling this for four runs. Run 03 found reservation evaluated at four moments;
> run 04 F238 found reservation could be deferred to the pick list; run 06 F328 found piece assignment
> is a separate three-value setting. **Those are three different questions and STORIS answers each
> separately**:
>
> | Question | Setting | Values |
> |---|---|---|
> | In what order do orders claim stock? | **Reservation Priority** | Delivery Date · Ordered Date *(+ defer)* |
> | When does the claim take effect? | **Reservation Date** | Delivery Date within Auto Fill Days · Immediate *(+ defer)* |
> | When does a claim become a specific piece? | `Assign Specific Pieces Event` | Ticket Print · Creating Pick List · Truck Load Process |
>
> **Three orthogonal axes.** Our rebuild needs all three modelled separately, and the audit's earlier
> attempts to collapse them were wrong.

### FINDING 354 — Three system-level reservation methods, and one combination is forbidden

- **Invariant:** priority and date combine into three legal methods; a fourth is explicitly barred.
- **Evidence** — `Stock Reservation Settings`, global options verbatim:
  > "**Prioritize by Delivery Date & reserve by Delivery Date within Auto Fill Days (fill period)**
  > **Prioritize by Ordered Date & reserve by Delivery Date within Auto Fill Days (fill period)**
  > **Prioritize by Ordered Date & reserve Immediately** (prioritize orders by date of entry without considering auto-fill days)"
  And, in **Rules**:
  > "**You cannot select the combination of Delivery Date prioritization and a reservation date of Immediate.**"
  > "Reservation by order date… **prioritizes order lines using the order line's timestamp** instead of the order date and written time."
- **Maps to:** F353; run 03 F3; `W-055`.

> Two priorities × two dates = four combinations, **three legal**. Delivery-date priority with
> immediate reservation is barred — sensibly, since prioritising by a future date while reserving now
> is incoherent.
>
> **The timestamp detail is the one to implement carefully**: order-date priority uses the **order
> line's timestamp**, not the order's date and written time. So two lines added to the same order
> minutes apart hold different positions in the reservation queue. That is finer granularity than the
> audit assumed anywhere, and it is what makes the queue deterministic.

### FINDING 355 — ATP and reservation method are mutually constrained, and `ASAP`/`CWC` reservation depends on it

- **Invariant:** activating ATP forbids two of the three reservation methods and gates ASAP/CWC reservation.
- **Evidence** — `Stock Reservation Settings`, **Rules**:
  > "When selecting to **prioritize by order date and reserve immediately, ATP can be active**."
  > "**Reservation must be prioritized by order date and reserved immediately when ATP is active and Reserve ASAP Sales or Reserve CWC Sales is active.**"
  > "**Reservation cannot be prioritized by Order Date and reserved by Delivery Date within Auto Fill Days unless all ATP Calculation Settings are inactive** in your Point of Sale Control Settings."
  And `Inventory Control Settings`:
  > "You **cannot activate Reserve ASAP Sales or Reserve CWC Sales while ATP is active** unless Stock Reservation Priority is set to **Order Date** and Reservation Date is set to **Immediate**. (ATP is active when one or more of the following ATP Calculation settings is active in Point of Sale Control Settings: Include New Purchase Orders, Include Stock Transfers, Include Unlinked Purchase Orders.)"
- **Maps to:** run 03 F4, F127 (`CWC`/`ASAP`) · run 04 F167 · run 07 F346 (ATP) — **all converge**;
  `W-055`.

> **This is where three runs of `ASAP`/`CWC` findings finally resolve.** Run 03 F4 defined them,
> F127 found them invisible to date-filtered searches, run 04 F167 found the routine that rescues
> them. The missing piece was whether they reserve at all — and the answer is
> **`Reserve ASAP Sales` and `Reserve CWC Sales`, two settings in Inventory Control Settings**, whose
> availability is constrained by ATP.
>
> The logic is coherent once seen: **an unscheduled order has no delivery date**, so it cannot be
> reserved by delivery date within a fill window. It can only be reserved *immediately*, prioritised by
> order date. And ATP — which computes a promise date — cannot coexist with delivery-date reservation
> either. So **turning ATP on forces the whole business onto order-date/immediate reservation**, which
> is a far bigger configuration consequence than run 07 F346's "five screens change".
>
> For the rebuild this is a genuine either/or to put to the business: **promise dates, or fill
> windows.** STORIS does not let you have both.

### FINDING 356 — Under immediate reservation, eight named events ignore the fill window

- **Invariant:** auto-fill days are bypassed for eight specific changes.
- **Evidence** — `Stock Reservation Settings`:
  > "If reservation is set to **Order Date (Reserve Immediately)**, the **auto-fill days are ignored** when:
  > – Layaway/sales quotes are **converted to sales orders**
  > – An order is **placed on or removed from credit hold**
  > – A **new line is added**
  > – **Delivery/pickup dates are changed** for the order or its lines
  > – A line's **fill days are changed via Additional Line Item Details**
  > – A line is **linked to a purchase order via Purchase Order Reservation**
  > – **Creating and maintaining a linked transfer** for a line"
  And:
  > "In logistical scheduling, **reservations are maintained** when reserving by Delivery Date or Order Date **within fill days**. **Reservations are unaffected by changes to the delivery schedule when reserving by Order Date (Reserve Immediately).**"
- **Maps to:** F354; run 04 F153 (credit hold release at EOD); `W-024`; `W-055`.

> **Credit hold is on the list.** Placing or removing a hold re-evaluates reservation — which, combined
> with run 04 F153's finding that **the hold code is not cleared until End of Day**, means a
> supervisor's approval this afternoon triggers a reservation change tonight, not now. Two batch-timed
> behaviours interacting, neither article mentioning the other.
>
> The last sentence is the operationally important one: under **Order Date (Reserve Immediately)**,
> **rescheduling a delivery does not disturb reservations at all.** Under the other two methods it
> does. So the scheduler's actions have completely different inventory consequences depending on a
> setting they cannot see — which is exactly the sort of hidden coupling this audit exists to surface.

### FINDING 357 — Incoming purchase orders can pre-empt automatic transfers, under five criteria, with four worked examples

- **Invariant:** if a PO will arrive in time, no transfer is created — decided by a five-part test.
- **Evidence** — `Stock Reservation Settings`, **Prefer Purchase Orders over Schema Days**:
  Setup: `Prefer Incoming Purchase Orders Before Stock Location` *(Point of Sale Control Settings —
  "**enables the functionality regardless of how the other settings are configured**")* +
  **`Prefer Purchase Order Over Schema __ Days`** *(Warehouse/Store Location Settings)*.
  Criteria — incoming PO lines that:
  > "are for the **same product** · are to be **received at the line's current stock location** · have a **scheduled date before or within** the Prefer Purchase Order Over Schema Days · are **not on hold** · have **enough quantity purchased to fill the quantity ordered** on the order line **after considering other orders that may have priority in the reservation queue**."
  > "If a purchase order line meets these criteria and is found to be preferable to the automatic creation of transfers through the **Stock Location Schema or Alternate Stock Location** functionality, a schema is **not** applied and those transfers are **not** automatically created. **An audit comment is written.**"
  Applied on: adding a line to a sales order or exchange · changing the stock location · changing the
  fulfillment location · adding a date to an unscheduled fulfillment · moving a date from outside to
  inside the fill window · **changing a fulfillment status from `CWC` or `ASAP` to Estimated or
  Scheduled**.
- **Maps to:** run 07 F351 (three-level multi-leg sourcing) — **the mechanism**; run 04 F184 (auto
  transfers); `W-042`; `W-055`.

> **Four fully worked numbered use cases** with dates, quantities and outcomes — the only worked
> examples of this depth the audit has found in seven runs. They are worth reading in the source
> article verbatim before implementing anything here.
>
> The fifth criterion is the sophisticated one: **enough quantity "after considering other orders that
> may have priority in the reservation queue."** The test does not ask "is there a PO", it asks "is
> there a PO with quantity left for *me*, given who is ahead of me". Use Case 3 shows it failing for
> exactly that reason and creating the transfer instead.
>
> **The trigger list closes another loop**: changing a fulfillment from `CWC`/`ASAP` to Estimated or
> Scheduled re-runs this test — so run 04 F167's rescue routine can, as a side effect, either create
> an auto transfer or suppress one.
>
> And once again **the evidence is an audit comment** — the tenth sighting of free-text-as-record.
> The system's decision not to create a transfer is documented nowhere but in prose on the order.

### FINDING 358 — Zero-cost exceptions have four handling options, two of which are auto-solves

- **Invariant:** an unresolved cost can be left, filled from average, filled from replacement, or accepted.
- **Evidence** — `Zero-Cost Exception Handling`, complete body:
  > "**Do not Handle** = Leave the exception as it is. **You must manually solve** the exception. The exception appears in the **Report Active Costing Exceptions** report, which runs **at End of Day or on demand**.
  > **Use Average** = Use the **average cost of the product** to solve the exception.
  > **Use Replacement Cost** = Use the **replacement cost for the model number** to solve the exception.
  > **Skip the Exception** = **Allow the inventory to be received at zero cost and clear the exception.** The accepted cost exception appears in the **Report Solved Costing Exceptions** routine."
- **Maps to:** `W-041` — **CONFIRMED; the cost-exception model is now complete**; run 02; run 04 F219,
  F261; run 07 F348.

> **The cost exception chain is finished.** Across five runs it has been assembled as: run 02 found the
> four types and that type 4 is manual-only; run 04 F219 found active exceptions block the physical
> inventory freeze; run 04 F261 confirmed the types at source; run 07 F348 found the per-type
> automatic-handling fields; **this gives the four values those fields take.**
>
> **`Skip the Exception` is the one to flag.** It does not solve the cost — it **accepts a zero cost
> into inventory and clears the flag**. A site configured this way carries genuinely zero-cost stock,
> and by run 03 F144's restatement machinery, sells it at 100% margin until somebody notices. The
> exception is *reported* as solved.
>
> Note the two grades of "replacement cost": `Use Replacement Cost` here resolves **by model number**,
> not by product — a different key, and the first time the audit has seen model number used as a
> costing key.
>
> **`Report Active Costing Exceptions`** and **`Report Solved Costing Exceptions`** run *"at End of Day
> or on demand"* — a tenth EOD behaviour, and the mechanism by which the queue that blocks the
> inventory freeze gets in front of a human daily.

### FINDING 359 — Six reason-code families are named, and `Not in Location` resolves `NIL`

- **Invariant:** reason codes are organised into six named families with defaults per family.
- **Evidence** — `Inventory Control Settings`, **Additional Settings → Reason Codes**:
  **`Floor Sample` · `Not in Location` · `In Service` · `Twilight` · `Repossession` ·
  `Vendor Chargebacks`**
- **Maps to:** run 04 F239 (`NIL` at the scan prompt) · run 04 F265 (`In Service` blocks write-off) ·
  run 04 F258 (floor sample transfers) · run 04 F270 (vendor chargebacks) — **all converge**;
  **inference I-32 resolved**.

> **Run 04 inference I-32** guessed that `NIL` meant *"the piece was not found in the location"*, as
> against `As-Is` meaning *found but damaged*. **`Not in Location` confirms it.** The inference is
> promoted to fact.
>
> Run 04 F265 found that reason codes carry behaviour — `As-Is Restricted` gates four tabs, and an
> *"in service"* code blocks write-off — and the audit concluded the reason-code model was richer than
> it had been recording. **This is the taxonomy**: six families, each with a configured default code.
>
> **`Twilight` is new** and unexplained. There is a `Twilight Discount Pricing Settings` article in
> this same subsection, so twilight is a pricing concept with an inventory reason code attached —
> presumably end-of-life or clearance merchandise. Section H.

### FINDING 360 — There are four independent ways to lose Kardex history, not two

- **Invariant:** what the inventory ledger records is governed by one product flag and three global switches.
- **Evidence** — `Inventory Control Settings`, General tab:
  > "The following **3 fields are global settings** you use to **include or exclude certain data from the Kardex reporting system**. To turn Kardex reporting **on or off for selected products**, use the **Inventory Tracking** field in the Product Settings."
  **`Track Bin to Bin Transfers` · `Track As-Is Activity` · `Track As-Is Reason Code`**
  Plus **`Kardex History Months`**, **`Warehouse Management History Months`**,
  **`Receiving Schedule Retention Days`**.
- **Maps to:** run 04 F282 — **CONFIRMED and extended from two to four**; `W-064`.

> Run 04 F282 found **two** ways for a product's movement history to be silently incomplete —
> `Inventory Tracking` off, and `Track Bin to Bin Transfers` off — and warned that *"any migration
> that reads the Kardex as ground truth is reading an optional, lossy record."*
>
> **There are four.** As-Is activity and As-Is reason codes are separately excludable, which matters
> enormously given run 04 F280's finding that **As-Is is the disposition hub of the entire inventory
> model**. A site with `Track As-Is Activity` off has no ledger record of seven documented paths in and
> three out.
>
> **`Warehouse Management History Months`** is an eleventh retention chain and confirms run 04 F266's
> WMS boundary has its own history.

### FINDING 361 — Automatic stock replenishment checks five warehouses in order, twice over

- **Invariant:** replenishment sources are an ordered list of five, configured separately for stores and warehouses.
- **Evidence** — `Inventory Control Settings`, **Replenishment** tab:
  > "This tab contains the settings used with the optional **Automatic Stock Replenishment** feature… to keep store inventory levels constant. **This feature does not include** the following product types: **special-order product · non-inventory product · kit masters**."
  **For Stores:** `Replenishment Active` · **First / Second / Third / Fourth / Fifth Warehouse**
  **For Warehouses:** `Replenishment Active` · **First / Second / Third / Fourth / Fifth Warehouse**
  General: `Stock Level` · `Stock Level Target` · `Available is Less Than Minimum Stock` ·
  `Auto Store Stock Replenishment Transfer Days` · `Include Incoming Purchase Order Scheduled Date Days`
  As-Is: **`As-Is Merchandise in Availability`** · `Reason Code`
  > "You can set replenishment locations in several settings screens. See the **Automatic Stock Replenishment for Locations** topic for… the **hierarchy in which locations are checked** for available stock."
- **Maps to:** run 02 (the sales-rate PO replenishment routine, dissected separately); `W-055`;
  **the eighth fall-through hierarchy**.

> **Two independent five-deep source lists** — one for replenishing stores, one for replenishing
> warehouses — and a further hierarchy across settings screens that this article points at rather than
> states.
>
> **`As-Is Merchandise in Availability`** is the notable one: a switch deciding whether damaged stock
> counts toward the availability that drives replenishment. Turn it on and the system stops shipping
> good stock to a store that has three scratched ones. That is a real merchandising policy in a
> checkbox.
>
> The three excluded product types — special order, non-inventory, kit masters — are consistent with
> run 04 F279's finding that **inventory type is a fundamental branch, not an attribute.**

### FINDING 362 — Product IDs can be auto-generated from a composable dynamic identifier

- **Invariant:** product codes are either sequential or assembled from configured components.
- **Evidence** — `Inventory Control Settings`, **Product Identifier** tab:
  > "Use this tab to establish **global format preferences for auto-generation of product ID's**. To establish these settings **at the group level**, use the Product Identifier tab of **Group Settings**."
  `Format` · `Next Product Number` · **`Dynamic Identifier`**:
  > "If you select **Dynamic Identifier** at the Format field, use this section to **define the format and components** of the auto-generated product code."
  `Sequential Counter` · `Maximum Length` · `Fixed Length` · **`Components`** ·
  `Current Combined Component Length` · `Maximum Identifier Length` · **`Promote/Demote`** ·
  **`Add Product Attribute`** · **`Add Text`**.
- **Maps to:** **NEW** — no contract covers product identification.

> **Product codes can be meaningful strings assembled from product attributes**, with a
> promote/demote ordering control and a running length budget. `Add Product Attribute` and `Add Text`
> are separate articles in this subsection, which the audit had inventoried without knowing their
> purpose.
>
> This is a migration consideration nobody would anticipate: **if LA Mattress uses dynamic
> identifiers, their product codes encode attributes**, and any rebuild that treats them as opaque
> keys loses information the business reads at a glance — while any rebuild that reproduces the
> scheme inherits a length ceiling.
>
> The group-level override is a **ninth fall-through hierarchy** (global → group).

### FINDING 363 — Vendor chargeback defaults live here, and the chargeback-method naming problem gets a fifth entry

- **Invariant:** the Enter a Stock Adjustment chargeback tab is pre-populated from Inventory Control Settings.
- **Evidence** — `Inventory Control Settings`, Additional Settings → **Vendor Chargebacks**:
  > "The defaults you set here appear on the **Vendor Chargeback tab in the Enter a Stock Adjustment routine**."
  **`Recalculate Sell Price %`** · **`Chargeback Method`**
- **Maps to:** run 04 F270 · run 05 F308 · run 03 batch 16 F163 · run 02 — **a fifth name**;
  `W-046`.

> The audit's rebate/chargeback naming problem now has **five entries across four modules**:
>
> | Name | Where | Run |
> |---|---|---|
> | `Vendor Rebate Chargeback Method` | Purchasing Control Settings | 02 |
> | `Rebate Mode` | Volume Rebate Status | 03 |
> | `Vendor Chargeback Method` | Enter a Stock Adjustment | 04 |
> | `Reimbursement Method` | Report Service Chargebacks to Manufacturer | 05 |
> | **`Chargeback Method`** | **Inventory Control Settings** | **07** |
>
> **This one is at least connected**: it is explicitly the default for run 04 F270's field. So two of
> the five are now linked. The other three remain unrelated by any article.
>
> **Inference I-16** — that these are all one concept — has been downgraded twice and is now
> **partially resolved**: `Chargeback Method` → `Vendor Chargeback Method` is a documented
> settings-to-screen default. The rebate side (`Vendor Rebate Chargeback Method`, `Rebate Mode`) and
> the service side (`Reimbursement Method`) are still unconnected to it and to each other.

### FINDING 364 — Seven activation switches on one grid govern receiving, transfers, picking and search

- **Invariant:** a checkbox grid in Inventory Control Settings gates seven cross-module behaviours.
- **Evidence** — `Inventory Control Settings`, Additional Settings, verbatim:
  > **`PICK LIST - Print Line Order Comments`**
  > **`PRODUCT SEARCH - Exclude Obsolete Merchandise`**
  > **`RECEIVING - Allow a User to Close a Partially Received PO`**
  > **`RECEIVING - Allow Without a PO`**
  > **`RECEIVING - Generate End of Day Costed Receipts Report`**
  > **`TRANSFERS - Restrict Transfers that Exceed Maximum Stock`**
  > **`TRANSFERS - Use Transfer Security Tables`**
  Plus **Payables**: `Auto-Create Freight Bill` · **`Payables Hold Code`**
  and **Control and Distribution Management**: `Retain Adjustments for Days` ·
  `Retain Completed As-Is Lists Days` · **`Storage Location Velocity`** ·
  As-Is Pricing Adjustment → **`Maximum Percentage Reduction`**.
- **Maps to:** run 04 F251 (`Use Transfer Security Tables`) · run 04 F263 (`Maximum Percentage
  Reduction`) · run 04 F285 (velocity) · run 04 F203 (AP hold codes) — **all confirmed at source**.

> **`RECEIVING - Allow Without a PO`** is the one that matters and the audit has never seen it.
> Receiving without a purchase order means stock enters with no PO cost to reference — which, by
> run 07 F348's four check moments, is exactly a zero-cost exception generator. **A site with this on
> and `Skip the Exception` configured is receiving free inventory by policy.**
>
> **`Payables Hold Code`** here is the default for run 04 F203's vendor-level AP hold codes,
> connecting the AP hold namespace to inventory configuration.
>
> **`Storage Location Velocity`** is where run 04 F285's directed-putaway velocity is switched on, and
> `Maximum Percentage Reduction` confirms run 04 F263's As-Is markdown cap at source — including that
> the cap lives in *Inventory* Control Settings while the markdown happens in a stock adjustment.
>
> Two more retention counters — `Retain Adjustments for Days`, `Retain Completed As-Is Lists Days` —
> bringing the batch's total to five and the run's to sixteen.

### FINDING 365 — Serial and location tracking are global switches with a pickup-confirmation option

- **Invariant:** the tracking modes run 04 found per-product are switched on globally here.
- **Evidence** — `Inventory Control Settings`, General tab:
  **`Serial Number Tracking`** · **`Confirm During Pickup Completion`** · **`Main Warehouse`** ·
  **`Location Tracking`** · `Layaway in Net Purchase Order` · `Add Vendor Model to Reports`.
- **Maps to:** run 04 F267 (three independent tracking switches) — **CONFIRMED at source**;
  run 04 F187 (`MANIFESTS - Verify delivered merchandise`); run 03 batch 16 F159 (`Add Vendor Model
  to Reports`).

> Run 04 F267 deduced three independent tracking switches — system serial tracking, product serial
> tracking, location tracking — from behavioural notes on the stock adjustment screen. **All three are
> confirmed**, and the system-level pair is here.
>
> **`Confirm During Pickup Completion`** is a fourth serial-confirmation point, alongside run 04
> F187's two doors into `Confirm All Serial Numbers` (sales order completion and manifest completion).
> So serials are confirmed at delivery *and* at customer pickup, under separate settings.
>
> **`Main Warehouse`** is a single named default warehouse for the whole system — a small field with
> large implications for any multi-site rebuild, and one nothing in six runs mentioned.

---

## C. Screen and field inventory

| Screen | Structure |
|---|---|
| **Inventory Control Settings** *(tabs: General, Additional Settings, Replenishment, Product Identifier)* | **General:** Serial Number Tracking · Confirm During Pickup Completion · Main Warehouse · Location Tracking · Layaway in Net Purchase Order · Add Vendor Model to Reports · Kardex History Months · Track Bin to Bin Transfers · Track As-Is Activity · Track As-Is Reason Code · Warehouse Management History Months · Receiving Schedule Retention Days · **Stock Reservations** *(Reservation Priority, Reservation Date, Online Receipts Reservations, Reserve ASAP Sales, Reserve CWC Sales)* · Report Sort By · Display Images *(Screen, Forms and Labels)*. **Additional Settings:** Reason Codes *(6 families)* · 7-switch grid · Payables *(2)* · Vendor Chargebacks *(2)* · Control and Distribution Management *(4)*. **Replenishment:** For Stores *(6)* · For Warehouses *(6)* · General *(5)* · As-Is *(2)*. **Product Identifier:** Format · Next Product Number · Dynamic Identifier *(6 + Promote/Demote, Add Product Attribute, Add Text)* |
| **Stock Reservation Settings** | *(reference article — no fields of its own; documents the Reservation Priority / Reservation Date matrix across three screens, five rules, the eight fill-window bypasses, and the Prefer-PO logic with four use cases)* |
| **Zero-Cost Exception Handling** | *(reference article — the four values of the Costing Control Settings automatic-handling fields)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Reservation Priority** / **Reservation Date** | Inventory Control Settings · Advanced Product Settings · District and Regional Product Settings | The three-level reservation model (F353, F354) |
| **Reserve ASAP Sales** / **Reserve CWC Sales** | Inventory Control Settings | Whether unscheduled orders reserve; ATP-constrained (F355) |
| **Prefer Purchase Order Over Schema __ Days** | **Warehouse/Store Location Settings** | The PO-vs-transfer window (F357) |
| **Track As-Is Activity** / **Track As-Is Reason Code** | Inventory Control Settings | Two further ways to lose Kardex history (F360) |
| **`RECEIVING - Allow Without a PO`** | Inventory Control Settings | Receipt with no PO cost reference (F364) |
| **`As-Is Merchandise in Availability`** | Inventory Control Settings → Replenishment | Whether damaged stock suppresses replenishment (F361) |
| **`Storage Location Velocity`** | Inventory Control Settings | Enables directed-putaway velocity matching (F364) |
| **`Main Warehouse`** | Inventory Control Settings | System default warehouse (F365) |

---

## E. Security permissions catalog (additions)

`TRANSFERS - Use Transfer Security Tables` confirmed at source — the switch behind run 04 F251's
**location-pair security matrix**, the audit's fourth *kind* of access control.

---

## F. State machines and enumerations (additions)

- **Reservation methods (3 legal of 4 combinations)** — F354. **One combination explicitly barred.**
- **Reservation configuration levels (3)** with explicit defer-upward options — F353.
- **Zero-cost handling options (4):** Do not Handle · Use Average · Use Replacement Cost ·
  **Skip the Exception** — F358.
- **Reason code families (6):** Floor Sample · **Not in Location** · In Service · **Twilight** ·
  Repossession · Vendor Chargebacks — F359.
- **Kardex exclusion switches (4)** — F360.
- **Replenishment source depth:** five warehouses, twice — F361.
- **Product ID formats (2):** sequential · **Dynamic Identifier** *(composable)* — F362.
- **Prefer-PO criteria (5)** and **trigger events (6)** — F357.
- **Fill-window bypass events (8)** — F356.

---

## G. Sequencing rules

1. Reservation method resolves **region-product → product → system**, both fields deferring together
   (F353).
2. Order line created → enters the **reservation queue** ordered by delivery date or by the line's
   **timestamp** (F354).
3. ATP active → reservation **must** be order-date/immediate if `Reserve ASAP Sales` or
   `Reserve CWC Sales` is on; order-date/fill-window is **barred entirely** (F355).
4. Under order-date/immediate, **eight named events ignore auto-fill days**; delivery rescheduling
   does **not** disturb reservations (F356).
5. Stock Location Schema or Alternate Stock Location about to apply → **incoming POs tested on five
   criteria** → if preferable, **no transfer is created** and an audit comment is written (F357).
6. Zero cost found → handled per the four options; `Do not Handle` surfaces on
   **Report Active Costing Exceptions** at EOD or on demand; `Skip the Exception` surfaces on
   **Report Solved Costing Exceptions** (F358).

---

## H. Open questions and gaps

### Newly opened

- **`Twilight`** — a reason-code family and a pricing settings record (`Twilight Discount Pricing
  Settings`), never seen in seven runs (F359).
- **`Online Receipts Reservations`** — a reservation setting with no explanation.
- **`Layaway in Net Purchase Order`** — unexplained.
- **`Automatic Stock Replenishment for Locations`** — named as holding the location hierarchy this
  article only points at (F361).
- **`Auto-Create Freight Bill`** — a payables automation not seen in run 01.
- **`Report Active Costing Exceptions`** / **`Report Solved Costing Exceptions`** — named, unread.

### Resolved this batch

- **Run 04 inference I-32** (`NIL` = not in location) — **promoted to fact** by the `Not in Location`
  reason-code family (F359).
- **The reservation model** — chased across runs 03, 04 and 06; complete (F353–F356).
- **The cost-exception model** — begun in run 02; complete (F358).
- **`ASAP`/`CWC` reservation** — open since run 03 (F355).

### Still unresolved

- **`Landed Cost Distribution` values** — carried from run 07 F347.
- The audit's thirteen undefined terms: **none resolved this batch**; `Twilight` **adds a fourteenth**.

### Inferences (recorded as inference, not fact)

- **I-64:** `Twilight` is probably a clearance or end-of-life merchandise state, given a reason-code
  family and a discount-pricing settings record share the name. *Neither article read; purely from
  the pairing.*
- **I-65:** `Skip the Exception` combined with `RECEIVING - Allow Without a PO` would let stock enter
  at zero cost routinely and silently. *Both settings are documented; **the combination's effect is
  not**, and this is an inference about their interaction.*

---

## I. Unknown unknowns

- **Three orthogonal reservation axes** (F353), where the audit had been trying to model one. Priority,
  effective date, and piece assignment are separate settings with separate values, and **two of them
  are constrained by ATP**. Any availability design that does not separate them will be wrong in a way
  that only shows up under load.
- **ATP and fill-window reservation are mutually exclusive** (F355). That is an either/or the business
  has already answered, probably years ago, and nobody will think to mention it.
- **Four ways to lose Kardex history** (F360), two of them specific to As-Is — the disposition hub of
  the whole inventory model. **The ledger's completeness is a configuration question**, and we cannot
  tell from inside the data.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Reservation Priority** | The order in which lines claim stock: delivery date or order-line timestamp |
| **Reservation Date** | When the claim takes effect: within auto-fill days, or immediately |
| **Auto Fill Days / fill window** | The forward window inside which delivery-dated reservation operates |
| **Reserve ASAP / CWC Sales** | Whether unscheduled orders reserve at all |
| **Prefer Purchase Order Over Schema Days** | Window in which an incoming PO suppresses an auto transfer |
| **Do not Handle / Use Average / Use Replacement Cost / Skip the Exception** | The four zero-cost outcomes |
| **`Not in Location`** | The reason-code family behind the scanner's `NIL` |
| **`Twilight`** | A reason-code family and a pricing regime; undefined |
| **Dynamic Identifier** | Product codes assembled from configured attribute components |
| **Main Warehouse** | The system-wide default warehouse |

---

## Contract adjudication — batch 2

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED — the model is complete after four runs of pursuit** | Three levels, three legal methods, one barred combination, ATP constraints, eight bypass events, PO pre-emption (F353–F357) |
| **W-041** *(cost exceptions)* | **CONFIRMED — the model is complete** | Four handling options (F358) |
| **W-061** *(cost)* | **CONFIRMED** | Replacement cost resolves **by model number** (F358); chargeback defaults (F363) |
| **W-064** *(retention)* | **CONFIRMED** | Five more counters; **four** Kardex exclusion switches (F360) |
| **W-042** *(propagation)* | **CONFIRMED** | PO pre-emption suppresses automatic transfers, evidenced by an audit comment (F357) |
| **W-024** *(holds)* | **CONFIRMED** | Placing or removing a credit hold re-evaluates reservation (F356) |
| **W-046** *(chargebacks)* | **partially resolved — two of five names now linked** | F363 |
| **W-050** *(access control)* | **CONFIRMED at source** | `TRANSFERS - Use Transfer Security Tables` |
| **W-005** *(receiving)* | **CONFIRMED, with a new risk** | `RECEIVING - Allow Without a PO` (F364) |
| **Product identification** | **NEW — no contract covers it** | F362 |

---

## Next — batch 3

Logistics cluster: `Route Capacity Control Settings` · `Route Mapping Control Settings` ·
`Bar Code Control Settings` · `EDI Control Settings` · `Warehouse Management Control Settings` ·
`Terminal Settings`.
