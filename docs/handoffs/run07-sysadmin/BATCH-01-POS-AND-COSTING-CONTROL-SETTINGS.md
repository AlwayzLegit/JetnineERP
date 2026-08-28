# Run 07 — System Administration — Batch 1: Point of Sale and Costing Control Settings

Status: complete. Findings 337–352. Read-only throughout. No setting saved.

**These are the two most-cited unread records in the audit.** `Point of Sale Control Settings` was
referenced in all six prior runs and never enumerated; `Costing Control Settings` was named in run 04
as the last piece of run 02's cost-exception chain.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Point of Sale Control Settings** | 15186502233620 | read — **nine pages, ~250 fields** |
| 2 | **Costing Control Settings** | 15186501540884 | read — two tabs |

`Point of Sale Control Settings` carries a comment dated **"Updated as of 2/15/2024"**, so the field
list is at least that current.

---

## B. Wiring findings

### FINDING 337 — Point of Sale Control Settings is nine pages, and the audit has been citing about 6% of it

- **Invariant:** one record governs order processing across nine functional areas.
- **Evidence** — page headings verbatim:
  **General · Customer · Logistics · Inventory · Commissions · Profit and Costs · Printed Documents ·
  Advanced · Pricing**
  > "Use this routine to specify your preferences for options available for order processing, for example **Sales Order Entry or Shopping Cart Entry**."
- **Maps to:** every contract; six runs of citations.

> Roughly **250 named fields**. Across runs 01–06 the audit cited about **fifteen** of them by name.
> The record is not a settings screen; it is **the configuration of the selling business**, and its
> nine pages map almost exactly onto the audit's six runs — which is why every run kept pointing here.
>
> Run 04 batch 1 was the first to learn it even *had* pages, from one article that mentioned a
> "Logistics page". **All nine are now named**, and the Logistics page alone turns out to hold about
> sixty fields where the audit had found six.
>
> The practical consequence for the rebuild is a change of shape. We have been treating settings as
> footnotes to behaviour. **This record is the behaviour**, and a configuration audit of the live
> system — reading the actual values, not the field list — is now the single highest-value next step
> after this run.

### FINDING 338 — Delivery charge recalculation has five triggers, not three — extending run 04 F166

- **Invariant:** the delivery charge re-derives on any of five documented changes, each separately switchable.
- **Evidence** — Logistics page, **Delivery Charge Recalculation**:
  > "Specify the methods by which to apply the **Automatic Delivery Charge Re-Calculation** feature by checking the check boxes below. You can check **one, both, or neither** box. **If you leave a box blank, delivery charges are not re-calculated.**"
  Fields: **`If Delivery Date Changes` · `If Route and/or Delivery Company Changes` ·
  `If Status Changes` · `If Merchandise Changes` · `If Partially Completed` · `Recalculation Date`**
- **Maps to:** run 04 F166 — **CONFIRMED and materially extended**; `W-052`.

> Run 04 F166 read `Logistical Scheduling` and found three triggers: fulfillment date, status EST→SCH,
> and route code. **There are five**, each with its own checkbox, plus a `Recalculation Date` field.
> The two the scheduling article never mentioned are **`If Merchandise Changes`** — adding a sofa
> reprices the delivery — and **`If Partially Completed`**.
>
> Note the article's own text says *"one, both, or neither"* while listing five checkboxes. **The
> prose is stale relative to the field list.** Recorded as observed; not reconciled by guessing.
>
> Run 04 F166's warning stands and gets stronger: **the sales order total is not stable after entry**,
> and now there are five ways it moves. Anything that snapshots it — a financing authorisation, a
> minimum-deposit calculation, a commission — has to know which five.
>
> **`Delivery Company`** appears here as a recalculation trigger and is new: run 04 found `Carrier` on
> the manifest and `Delivery Company Settings` as an unread linked article. Delivery company is a
> priced dimension.

### FINDING 339 — There are three manifest reason-code settings, one per document type — extending run 04 F178

- **Invariant:** requiring a reason for manifest removal is configured separately for delivery, service and transfer.
- **Evidence** — Logistics page, **Manifests**:
  > **`Delivery, Require Reason Code if One or More Orders Removed`**
  > **`Service, Require Reason Code if One or More Orders Removed`**
  > **`Transfer, Require Reason Code if One or More Order Removed`**
  Alongside: `Allow deposits on order` · `Allow Changes to Un-manifested Fulfillments` ·
  **`Prohibit changes to lines once an associated auto-transfer has been manifested`** ·
  **`Continue to prohibit changes after auto-transfer has been completed`** ·
  **`Remove Truck Number/Stop Time when Orders are Removed`** ·
  **`Allow Updates To Manifest From`**: Delivery Pick List Print · Delivery Ticket Print ·
  Transfer Pick List Print · Transfer Ticket Print.
- **Maps to:** run 04 F178 — **CONFIRMED, split three ways**; run 06 F330, F335; run 05 F302.

> Run 04 F178 found one reason-code setting. **There are three**, and a site can require a reason for
> transfer removals while not requiring one for deliveries. That directly affects run 06 F330's
> finding — **pick-list reprints on manifested orders pollute the exception report** — because the
> pollution only happens where the corresponding reason-code setting is on. **The question to the
> warehouse is now sharper**: which of the three are enabled?
>
> **`Allow Updates To Manifest From`** names the four print routines that may auto-update a manifest,
> which is the configuration behind run 06 F335's `Update Manifest` option. So manifest auto-update is
> permitted per print routine — four switches.
>
> The two auto-transfer prohibition settings are new and consequential: once an auto-transfer is
> manifested, **line changes on the sales order it serves can be prohibited** — and optionally stay
> prohibited after the transfer completes. That is a stricter coupling than run 04 F184's advisory
> "Continue?" warnings, and it is **the first hard cross-document lock the audit has found**.

### FINDING 340 — `Assign Specific Pieces Event` — the same setting under a third name

- **Invariant:** the piece-assignment setting is called three different things across three articles.
- **Evidence** — Inventory page: **`Assign Specific Pieces Event`**.
  Against run 04 F190 (`Load a Truck`): *"the **Assign Specific Pieces At** field in the Point of Sale
  Control Settings is set to "Truck Load Process""* and run 06 F328 (`Print Pick List`): *"If the
  **Assign Specific Pieces At** field in the Point of Sale Control Settings is set to **Creating Pick
  List**"*.
- **Maps to:** run 04 F190 · run 06 F328 — **the record's own name for the field differs from both
  consumers**; `W-055`.

> Two consuming articles call it **`Assign Specific Pieces At`**; the owning record calls it
> **`Assign Specific Pieces Event`**. Same setting — the position in the Inventory page beside
> `Return Pieces to As-Is`, `Create a PO for Back Orderable Stock` and `Unassign Piece Not Completed`
> leaves little doubt — but **three articles, two names.**
>
> This is the sharpest terminology-drift case in seven runs, and it matters more than the usual ones
> because run 06 F328 called this *"the setting the whole warehouse workflow shape follows from."*
> Anyone searching the live system for "Assign Specific Pieces At" will not find it.
>
> Recorded as observed drift. **The values remain the three from run 06 F328** — `Ticket Print`,
> `Creating Pick List`, `Truck Load Process` — none of which is repeated here.

### FINDING 341 — Seven retention periods sit on one page, including one for file attachments

- **Invariant:** POS retention is seven independent month-or-day counters in a single block.
- **Evidence** — General page, **Retention Periods**:
  **`Voided Orders` · `Sales Tax` · `Sales Quotes` · `Customer Activity Log` · `Completed Orders` ·
  `Completed Transfers` · `Completed Order Attachments`**
  Plus, elsewhere in the record: `Manifest Exception Retention __ Months` *(Logistics)* ·
  `Customer Retention Period __ Months` and `Purge Customers` *(Customer)* ·
  `Retention Period __ Days` *(Commissions)* · `Promotional Pricing Retention Period __ Months`
  *(Advanced)*.
- **Maps to:** `W-064` — **CONFIRMED; the audit's nine chains become at least twenty**; run 05 §C
  (file attachments).

> The audit closed with **nine** documented *file → setting → purge* chains and a rule that held
> across four runs. **This one record contains eleven more.** The rule holds — every one is a named
> counter in the owning module's control record — but the count was an order of magnitude low, because
> the audit was finding retention settings one at a time from the articles that mentioned them.
>
> **`Completed Order Attachments` is the find.** Run 05 §C recorded the first sighting of file
> attachments in five runs — a paper-clip icon on orders, customers and products — and flagged the
> mechanism, storage and retention as entirely unknown. **The retention, at least, is here**, and its
> existence confirms attachments are real stored objects with a lifecycle, not links.
>
> `Manifest Exception Retention __ Months` confirms run 04 F180 exactly, including run 05 F302's note
> that zero disables retention.

### FINDING 342 — Protection plan auto-attachment is a four-case truth table, stated verbatim

- **Invariant:** two checkboxes produce four documented behaviours across new and existing orders.
- **Evidence** — General page, **Protection Plans**:
  > "**Protection Plans need to be added manually to partially completed orders** that already exist within STORIS. For new orders and existing orders that have not been partially completed, the addition of protection plans is based on the above settings:
  > – If **neither** `Prompt to Add to Order` nor `Automatically Add to New Order` are enabled, protection plans are **manually added to any order**.
  > – If **both** are enabled, protection plans are **automatically added to new orders**. For **existing orders, users are prompted**.
  > – If **`Prompt to Add to Order` only**, you are asked whether to add a plan to **either the new or existing order**.
  > – If **`Automatically Add to New Order` only**, plans must be **manually added to existing orders** while **automatically added to new orders**."
  Plus: `Require Security to Override` · `Automatic Add Merchandise Overlap` ·
  **`Exchanges Use Existing Plan`** · `Print Plan Declinations`.
- **Maps to:** run 03 F12 (auto-attachment by a three-step selection) — **the governing settings**;
  run 05 F297; `W-028`.

> Run 03 F12 found protection plans auto-attached by a documented three-step selection with a
> best-plan tiebreak. **This is the switchboard above it**, and the vendor spells out all four
> combinations rather than leaving them to be inferred — unusual and welcome.
>
> **The partial-completion carve-out is the operational trap**: a partially completed order never gets
> an automatic plan, whatever the settings say. Combined with run 03's finding that plans drive the
> service module's Extended Warranty payer column (run 05 F297), **a partially completed order is
> quietly a plan-less order** unless someone adds one by hand.
>
> **`Exchanges Use Existing Plan`** carries a verbatim note that the original plan version and
> **`Protection Plan Register Code`** remain available *"permitting the 3rd Party Provider to consider
> new merchandise and returned merchandise as adjustments to the Protection Plan."* So plans are
> administered by an external provider and exchanges are sent as **adjustments** rather than
> cancel-and-rewrite. That is a third-party integration the audit had not identified.

### FINDING 343 — Customer Rewards and Customer Membership are two separate programs

- **Invariant:** loyalty is two independently activatable programs, not one.
- **Evidence** — Customer page, **Other**: **`Activate Customer Rewards Program`** and, separately,
  **`Activate Customer Membership Program`**.
  Plus `Customer Rewards Control Settings` exists as its own article (15186452549524).
  And Pricing page: **`Automatically Apply Discounts Using Membership Discount Schedule`**.
- **Maps to:** run 03 batch 16 F158 — **corrects the audit's reading**; `W-028`.

> Run 03 F158 found `View Customer Rewards` publishing `Reward Points`, `Reward Balance`,
> `Membership Program`, `Membership Date` and `Renewal Date` on one screen, and treated it as **one
> module**. It called this *"the single largest functional area in Sales Processing that we cannot
> reconstruct"* and recommended a direct vendor question rather than more reading.
>
> **Both halves are wrong in a useful way.** They are **two programs with two activation switches**,
> and there is a dedicated control record for rewards — so the vendor question was unnecessary; the
> documentation was simply in a section the queue had not reached.
>
> The membership half has a **discount schedule** that can apply automatically at order entry, which
> ties it into run 03's seven-level pricing hierarchy. So membership is a *pricing* construct and
> rewards is a *points* construct, and the inquiry screen that showed both is a join, not a module.
>
> `Customer Rewards Control Settings` is queued for batch 4.

### FINDING 344 — Point of Sale User Verification re-authenticates per transaction type, and logs who

- **Invariant:** entering or editing an order can require the user's credentials again, by transaction type.
- **Evidence** — Advanced page, **Point of Sale User Verification**:
  > "Use these settings to **require users provide their user ID and password before creating or editing an order**. For each transaction type you select… the **Transaction Entry - User Log In Screen** appears after a user specifies the order number… **The Order Comments Log records the user who makes the changes.** Note that this feature applies to **Entry routines only**, and not to View routines."
  > "**If your system is set for cash balancing by cashier, this field is inactive.** This field also appears in the **Quick Sale Control Settings** and the **Service Control Settings**."
  Transaction types: **Sales Order · Exchange · Customer Return · Sales Dollar Adjustment**.
- **Maps to:** run 06 F316 (the security override) — **a distinct mechanism**; run 03 F99 (cash
  balancing); `W-050`.

> **This is not the security override.** Run 06 F316's override is a *supervisor's* credentials
> authorising something the acting user cannot do. This is **the acting user re-proving they are
> themselves** before touching an order — a shared-terminal control, in a business where a sales floor
> PC is logged in all day.
>
> That makes **three distinct credential mechanisms** in the audit: log-in *(run 06 F323)*, security
> override *(F316)*, and per-transaction verification *(here)*.
>
> Two details matter. **It is inactive when cash balancing is by cashier** — because that already
> establishes who is at the terminal (run 03 F99's blind-by-design cash balancing). And **the same
> setting exists in three records** — POS, Quick Sale, and Service Control Settings — so it is
> configured per entry family, not once.
>
> **`Transaction Entry - User Log In Screen`** is its own article in this subsection (15186452147092),
> which the audit had inventoried without knowing what it was for.

### FINDING 345 — Price variance rules are five fields, and a location setting overrides them

- **Invariant:** how far a price may be reduced is a percentage plus four behavioural switches, overridable per location.
- **Evidence** — Pricing page, **Price Variance Rules**:
  > "enter the **maximum percentage of the selling price** you want to allow users to vary from the selling price established in the **Advanced Product Settings**. If the modified price is less than the selling price by a percentage greater than the percentage you enter here, the system **may generate an alert record**, depending on the setting at the **Price Exceeds Variance Alert** field."
  > "**You can also specify price variance percentages by location via the Settings tab in the Warehouse/Store Location Settings. If a price variance percent has been specified for the selling location on an order, that setting overrides the setting entered here.**"
  Fields: **`Variance __ %` · `Variance Exceeded Alert` · `Allow Price Change` · `Reason Required` ·
  `Comment Required`**.
- **Maps to:** run 06 F316 — **explains it**; run 03 F13; run 04 F263; `W-050`; `W-061`.

> Run 06 F316 said the override screen's fields are determined by *"your security settings **and price
> variance settings**"* and could not say what the latter were. **These are them** — and the two
> independent switches `Reason Required` and `Comment Required` are exactly why the override screen
> has a three-case field matrix.
>
> **`Variance Exceeded Alert` generates an alert record**, which connects price variance to the
> alerting subsystem behind hold codes `C7`/`C8` (run 04 F213). `Alert Code Settings` is now doubly
> important and is queued.
>
> And the **location-overrides-system** fall-through appears again — the same shape as
> `Restrict Scheduled Date` (run 04 F165), the Credit Card GLA fall-through (run 03 F38) and the
> Dispatch Track Account resolution (run 04 F210). **Fifth instance. It is the house pattern.**

### FINDING 346 — ATP is not merely hidden when off — five screens change

- **Invariant:** three unchecked settings suppress the entire Available-to-Promise calculation and its UI.
- **Evidence** — Logistics page, **ATP Calculation**:
  > "**To skip the calculation of the ATP date, do NOT check any of the following**: `Include New Purchase Orders`, `Include Stock Transfers`, `Include Unlinked Purchase Orders`. If you are not set up to calculate the ATP date… the following is **not shown** on the Merchandise page of Enter a Sales Order or Enter a Shopping Cart: the **Available to Promise Date and Available to Customer Date** fields — **neither the labels nor data**; the **ATP Date** grid column; and the **Toggle Display of ATP/ATC Dates** action. The following screens are **also affected**: **View Kit Product Details, Advanced Line Item Display, Shopping Cart Line Item Display, and Reassign a Sales Reservation.**"
  Plus `Include Retail and Service Parts` and `Default display of ATC in Point of Sale`.
- **Maps to:** run 03 batch 16 F157 (ATP as a ninth availability definition) · run 04 F156 (the
  `IC.204`/`IC.207` tab swap) — **both extended**; `W-055`.

> Run 04 F156 found that turning ATP off is a **screen-composition act** — you swap `IC.204.TAB` for
> `IC.207.TAB`. This says the reach is wider: **five named screens change**, and the fields vanish
> label-and-all.
>
> **`Available to Customer` (ATC)** is a second date the audit has not seen — distinct from ATP, with
> its own default-display setting. ATP is when the warehouse can promise it; ATC is presumably when the
> customer can have it. **The difference is the delivery lead time**, and nothing states it.
>
> This is the eighth instance of the run-04 pattern **"configuration changes what exists, not just
> what is shown."**

### FINDING 347 — Costing offers three methods, and four independent landed add-on cost slots

- **Invariant:** cost basis is a three-way choice; landed cost has freight plus four add-on components.
- **Evidence** — `Costing Control Settings`:
  > "The available costing methods are: **Replacement Cost · Weighted Average Cost · Exact (Actual) Cost**"
  > "You can include the **landed freight and/or add-on cost values** when calculating the landed cost."
  Activation checkboxes: **`LANDED FREIGHT - Active`** · **`Add-on Cost 1 Active`** ·
  **`Add-on Cost 2 Active`** · **`Add-on Cost 3 Active`** · **`Add-on Cost 4 Active`**.
  Plus `Calculate Received Landed By` · `Landed Cost Distribution` · `Landed Add-on Cost Label` ·
  `Landed Add-on Cost Label Drop-Down`.
- **Maps to:** run 02 (thirteen-level landed cost hierarchy; **GMROI/Turns exclude freight and add-ons
  1 and 2**) — **CONFIRMED and explained**; run 04 F260, F271; `W-061`.

> Run 02 found that Open To Buy includes landed cost while **GMROI and Turns exclude freight and
> add-ons 1 and 2** — a formula detail that made no sense without knowing what add-ons 1 and 2 *were*.
> **There are four add-on slots, each separately activatable, each with a site-defined label.** They
> are generic cost buckets — duty, brokerage, insurance, whatever the business imports — and the
> GMROI formula excludes the first two by convention.
>
> **`Landed Add-on Cost Label` and its drop-down mean the four slots are named by the site**, so
> "add-on cost 1" means something different at every installation. Any statement about add-on 1 in the
> rebuild has to be resolved against LA Mattress's actual labels.
>
> `Landed Cost Distribution` is the setting behind run 04 F273's unpublished `Distribution Method`
> values — **still not enumerated here**, but now located. `Landed Freight and Add-On Costs Overview`
> is a related article and is queued.
>
> **Three costing methods** is the headline. Run 03 F144 established sales are written at *average*
> cost and restated to *exact* cost; this shows average-versus-exact is a **configured choice**, with
> replacement cost as a third option the audit has never seen mentioned.

### FINDING 348 — Zero-cost exceptions are checked at four named moments, and handling is configured per type

- **Invariant:** each cost exception type has its own automatic-handling setting.
- **Evidence** — `Costing Control Settings`, **Exception Handling** tab:
  > "Use this tab to specify how you want to handle cost exceptions when a zero cost is found (**Automatic Handling of Cost Exceptions**). **The system checks for zero costs during the following processes: purchase order entry · inventory receiving · inventory adjustment · customer-return completion**"
  Fields: **`Customer Returns Zero Cost` · `Customer Returns Non Zero Cost` ·
  `Warehouse Receipts Zero Cost` · `Positive Adjustments Zero Cost` · `Skip on Zero` ·
  `Inventory AP Approval` · `Next Cost Exception Number`**
  > "**To correct type 4 cost exceptions, you must use the manual method via the Correct a Cost Exception routine.**"
- **Maps to:** run 02 (type 4 manual-only) · run 04 F219, F261 — **CONFIRMED at the settings level**;
  `W-041`.

> **Run 02's central finding is now confirmed from the third direction.** Run 02 inferred type-4
> manual-only from the merchandising side; run 04 F261 confirmed it from the inventory side; **the
> control record itself says it.** Three independent confirmations across three runs.
>
> The field names map onto the four exception types almost exactly — `Warehouse Receipts Zero Cost`
> (type 1), `Positive Adjustments Zero Cost` (type 2), `Customer Returns Zero Cost` (type 3), and
> **`Inventory AP Approval`** (type 4, the one that cannot be automated). So **each type's automatic
> handling is its own setting**, which is why types 1–3 are auto-resolvable *as configured* rather
> than by nature.
>
> **`Customer Returns Non Zero Cost` is the surprise** — a fifth setting for returns whose cost is
> *not* zero. Nothing in three runs suggested non-zero returns raise exceptions at all. Section H.
>
> **The four check moments** are the complete list of where cost enters the system: PO entry,
> receiving, adjustment, return completion. That is a usefully small surface to defend in the rebuild.

### FINDING 349 — Costing carries three of its own retention counters and a purge report

- **Invariant:** solved exceptions, costed audit data and the costing table each age out separately.
- **Evidence** — `Costing Control Settings`, General page, **Retain Days**:
  **`Solved Cost Exceptions` · `Costed Auditing Data` · `Costing Table Data`**
  Plus **`REPORT - Generate a Purge Report of Solved Costing Exceptions`**.
- **Maps to:** `W-064` — **CONFIRMED**; run 02 (Costing Table as a named data store); F341.

> Three more retention chains, and **`Costing Table Data`** is the retention for the Costing Table —
> a named data store the audit has carried since run 02 without knowing its lifecycle.
>
> The purge-report switch is a good pattern: **the system will tell you what it is about to forget.**
> None of the other eight chains found in runs 01–06 offered that.

### FINDING 350 — Costing writes GL postings under five named switches, including two for return-to-vendor

- **Invariant:** how costing hits the ledger is configured, including RTV landed-cost write-offs.
- **Evidence** — `Costing Control Settings`, checkbox list verbatim:
  > **`GENERAL LEDGER - Always Adjust Stocked Inventory at the Average Cost`**
  > **`GENERAL LEDGER - Post RTV Write-off of Landed Cost Assests against Landed Liability Accounts`** *(spelling verbatim)*
  > **`GENERAL LEDGER - Post RTV Valuation Difference At Completion`**
  > **`AVERAGE COST - Include Saleable Receipts only`** — with: *"**It is not recommended that this setting be checked when G/L posting is set to post with an average cost.**"*
  > **`REDUCE CUSTOMER RETURNS - Prorate the Landed/Freight Value`**
- **Maps to:** run 04 F260 (`Inventory Value` / `Inventory Adjustment` / `Landed Freight Asset`) ·
  run 04 F274 (RTV requires As-Is) · run 03 batch 16 F159 (`returned-not-recorded`) — **all extended**;
  `W-052` / `W-053`; `W-061`.

> Run 04 F260 gave the three-legged journal entry for adjusting a piece *in*, with `Landed Freight
> Asset` as its own leg. **These settings govern the other side**: when goods go back to a vendor, the
> landed-cost asset is written off **against named Landed Liability Accounts**, and the valuation
> difference can be posted at completion.
>
> So the landed-cost subsystem now has: an estimating hierarchy (run 02), a reconciliation routine
> (run 04 F271), four labelled add-on slots (F347), an asset account and a **liability** account, a
> valuation report (run 04 F289), and its own GL switches. **For an importing furniture business this
> is a complete subsystem, and the rebuild must not treat it as "add freight to cost."**
>
> The vendor's own warning — *"not recommended… when G/L posting is set to post with an average
> cost"* — is a **documented setting conflict**. STORIS does not prevent it; it advises against it.
> Consistent with the detect-and-report house style, now applied to configuration itself.

### FINDING 351 — Multi-legged transfers are driven by two schemas with a documented precedence

- **Invariant:** where stock is sourced from is a choice between a demand schema and a logistics schema.
- **Evidence** — Inventory page, **Multi-Legged Transfers**:
  > **`Use Stock Location Schema (Demand)`** · **`Prefer Incoming Purchase Orders Before Stock Location Schema`** · **`Use Distribution Location Schema (Logistics)`** · `Schedule Period Days`
  Plus, Transfers block: `Allow Store to Store` · `Auto Transfers` · `Restrict Manifested Routes` ·
  `Auto Schedule Period __ Days` · **`Use Alternate Stock Location`**.
- **Maps to:** run 04 batch 8 §A — **the article with no readable text**; run 04 F251 (`Store to
  Store Transfers`); `W-055`.

> **Run 04 could not read `Multi-Legged Transfers Flow Chart Overview` at all** — the content is a
> flow-chart image with no text alternative, recorded as the audit's only unreachable article. **Here
> is the model, from its settings.**
>
> Two named schemas: **Stock Location Schema (Demand)** and **Distribution Location Schema
> (Logistics)** — `Maintain Distribution Location Schema` was in run 04's Transfers inventory, unread.
> They answer different questions: *where should this come from to satisfy demand* versus *how should
> it physically travel*. And **`Prefer Incoming Purchase Orders Before Stock Location Schema`** inserts
> a third source ahead of both.
>
> That is a **three-level sourcing precedence** — incoming POs, then demand schema, then logistics
> schema — and it is the sixth named fall-through hierarchy in the audit.
>
> `Allow Store to Store` here is the same switch run 04 F251 found as `Store to Store Transfers`.
> **Seventh terminology drift**, same record.

### FINDING 352 — End of Day reschedules past-dated transfers, in four directions, under four switches

- **Invariant:** stale reserved transfers are automatically moved forward by a nightly process.
- **Evidence** — Inventory page, **Past Dates Rescheduling**:
  > "You can use the following four settings to **activate the auto transfer rescheduling process that runs during EOD** for **all types of transfers (auto, stock, as-is, floor samples, move to as-is, and multi-leg)** with **merchandise reserved and dates in the past**. The transfers are **rescheduled for the next available transfer delivery date and route**. These transfers **must have merchandise reserved, must be open (not completed), and cannot be on a transfer manifest** in order to be rescheduled."
  Directions: **`Store to Warehouse` · `Store to Store` · `Warehouse to Store` · `Warehouse to Warehouse`**
- **Maps to:** run 04 F153, F160, F221 (the batch calendar as business logic) — **CONFIRMED, a new
  instance**; `W-012`; `W-055`.

> A **ninth EOD/EOM behaviour** in the audit, and one nobody would guess: **the nightly process moves
> transfer dates.** Not a report, not a flag — it reschedules the document.
>
> The three preconditions are precise (reserved, open, not manifested) and they interlock with run 04
> F177's manifest lock: **a manifested transfer is excluded**, so a stale transfer that has been
> manifested stays stale forever and needs a human.
>
> **Six transfer types are named** — auto, stock, as-is, floor samples, move to as-is, multi-leg —
> which is a fuller enumeration than run 04 batch 8 F258's three flavours. And rescheduling is
> configured **per direction**, so a site can auto-reschedule warehouse-to-store movements while
> leaving store-to-store alone.
>
> Run 04's summary said *"the batch calendar is business logic in this ERP"* and warned that making
> everything real-time would silently delete sequencing guarantees. **This is the strongest example
> yet**, because the guarantee here is that reserved stock does not sit on a dead date.

---

## C. Screen and field inventory

**`Point of Sale Control Settings`** — nine pages. Full field capture in the source article; the
blocks are:

| Page | Blocks |
|---|---|
| **General** | Transaction Numbers · Point of Sale Defaults · Order Source · **Fulfillment Methods** *(Sales Orders, Exchanges, Returns)* · Delivery Locations · Customer Pickup Locations · **Direct Shipments** *(Allow on Sales Orders / Layaways / Quotes, Access PO Delivery Date, Payable Approvals On Hold)* · **Retention Periods** *(7)* · **Protection Plans** *(8)* · Other *(≈22 fields)* |
| **Customer** | Minimum Deposit Rules · **Credit Check Rules** *(`Last Activity __ Days`, `Past Due __ Days`, Initial/Final Credit Check)* · Customer Entry *(≈10)* · Customer Search *(5)* · Other *(≈12, incl. both loyalty activations)* |
| **Logistics** | In-Process Delivery Restriction · Delivery Charges *(6)* · **Delivery Charge Settings** *(Use Delivery Settings / Use Per Piece Settings / One Delivery Charge Per Order / Automatically Move Delivery Charges)* · **Delivery Charge Recalculation** *(6)* · Delivery Dates *(4)* · Consolidate Orders *(3)* · **Route Capacities** *(9)* · Route Closing Period *(2)* · **Manifests** *(11)* · **ATP Calculation** *(6)* · **Fulfillment Details** *(Initial Entry Status Defaults, Partial Completion Status Defaults, **Maximum Number of Fulfillments**)* · Other *(≈20)* |
| **Inventory** | Return Pieces to As-Is · **Assign Specific Pieces Event** · Create a PO for Back Orderable Stock · Unassign Piece Not Completed · Auto Adjust Stock on Take With · **Inventory Reservations** *(6)* · **Transfers** *(5)* · **Multi-Legged Transfers** *(4)* · **Past Dates Rescheduling** *(4)* · Exception Rules *(3)* · Other *(5)* |
| **Commissions** | Sales Order Salesperson Default · 3 rules · Commissions *(Calculation Method, Maximum Split Commissions, Split Commission Evenly, Report Type, Retention Period)* · Deliveries *(4)* · Protection Plans *(2)* |
| **Profit and Costs** | Minimum Gross Profit % · Sales Margin Scratchpad Cost · Display of Sales Summary · **Exception Rules** *(Minimum Gross Profit Not Met · Zero Cost on Direct Shipment · Selling Price is Below Cost · Zero Cost Non-Inventory Item)* |
| **Printed Documents** | Point of Sale Behavior *(5)* · **Document Print Method** *("Sales orders, completed orders, shipping tickets, and COG documents print via **Enhanced Laser Forms**")* · Delivery and Pickup Tickets *(3)* · Other *(7)* |
| **Advanced** | Sales Security Access *(3)* · **Point of Sale User Verification** *(4 transaction types)* · **Backdating Rules** *(Entry Date, Completion Date)* · Sales Tax *(2)* · Marketing Code Rules *(3)* · Customer Email Address *(5)* · Other *(6)* |
| **Pricing** | **Price Variance Rules** *(5)* · **Discounts** *(13)* · Soft Kits *(3)* · As-Is / Floor Sample Pricing *(2)* · Other *(1)* |

**`Costing Control Settings`** — tabs **General** and **Exception Handling**; fields as quoted in
F347–F350.

---

## D. Control settings catalog

This batch **is** the catalog. Roughly 250 POS fields and 30 costing fields are captured above and in
the source articles. Newly confirmed cross-references to prior runs:

| Prior finding | Setting confirmed |
|---|---|
| run 04 F165 | `Restrict Scheduled Date` *(Logistics)* |
| run 04 F166 | `Delivery Charge Recalculation` — **five triggers, not three** (F338) |
| run 04 F178 | **three** manifest reason-code settings (F339) |
| run 04 F180 / run 05 F302 | `Manifest Exception Retention __ Months` |
| run 04 F190 / run 06 F328 | `Assign Specific Pieces Event` — **third name** (F340) |
| run 04 F219 / F261 | Exception Handling tab; type 4 manual-only (F348) |
| run 04 F251 | `Allow Store to Store` (F351) |
| run 04 F274 | RTV GL write-off switches (F350) |
| run 03 F12 | Protection plan auto-attach truth table (F342) |
| run 03 F13 / run 06 F316 | Price Variance Rules (F345) |
| run 03 F158 | **two** loyalty programs (F343) |
| run 05 §C | `Completed Order Attachments` retention (F341) |
| run 05 F299 | `Require Audit Text on Service Orders` — **and on Returns and Exchanges** |

---

## E. Security permissions catalog (additions)

- **`Override Maximum Number of Fulfillments`** — `Create a User/User Group - Sales Security` *(named
  verbatim in the Fulfillment Details block)*.
- **Point of Sale User Verification** — a third credential mechanism (F344).
- `Require Security to Override` on protection plans; `Sales Security Access` block on the Advanced
  page; and a verbatim pointer: *"the ability for users to access discount fields… is affected by user
  security settings. See **Create a User/Group Actions - Sales Security**."*

---

## F. State machines and enumerations (additions)

- **Costing methods (3):** Replacement Cost · Weighted Average Cost · Exact (Actual) Cost (F347).
- **Landed cost components (5):** freight + **four labelled add-on slots** (F347).
- **Zero-cost check moments (4):** PO entry · receiving · adjustment · customer-return completion (F348).
- **Delivery charge recalculation triggers (5)** (F338).
- **Transfer types (6):** auto · stock · as-is · floor samples · move to as-is · multi-leg (F352).
- **Transfer rescheduling directions (4)** (F352).
- **POS User Verification transaction types (4)** (F344).
- **Profit exception rules (4):** Minimum Gross Profit Not Met · Zero Cost on Direct Shipment ·
  Selling Price is Below Cost · Zero Cost Non-Inventory Item.
- **Inventory exception rules (3):** Zero / Minimum / Safety Quantity Stock Level.
- **ATP inputs (4)** and a second date, **ATC** (F346).
- **Loyalty programs (2)** (F343).

---

## G. Sequencing rules

1. Zero cost found at PO entry, receiving, adjustment or return completion → **cost exception raised**
   → auto-handled per the Exception Handling tab, **except type 4** (F348).
2. RTV completed → landed-cost asset written off **against Landed Liability Accounts**; valuation
   difference posted at completion, if enabled (F350).
3. Delivery date / route / delivery company / status / merchandise change, or partial completion →
   **delivery charge recalculated**, per five switches (F338).
4. Auto-transfer manifested → **line changes on the served order can be prohibited**, optionally even
   after completion (F339).
5. **EOD** → past-dated transfers that are reserved, open and un-manifested are **rescheduled to the
   next available date and route**, per direction (F352).
6. Order entry or edit → **Transaction Entry - User Log In Screen** if the transaction type is
   selected; the user is recorded in the Order Comments Log (F344).

---

## H. Open questions and gaps

### Newly opened

- **`Customer Returns Non Zero Cost`** — a fifth exception-handling setting for returns whose cost is
  not zero. Nothing in three runs suggested these raise exceptions (F348).
- **`Available to Customer` (ATC)** — a second promise date, never seen before, with its own display
  setting. Its relationship to ATP is unstated (F346).
- **`Landed Add-on Cost Label`** — the four add-on slots are **site-labelled**, so run 02's "add-ons 1
  and 2" means something different per installation (F347).
- **`Protection Plan Register Code`** and the third-party plan provider (F342).
- **`Parcel Route Code` / `Generate Parcel Delivery Fulfillments`** — parcel shipping, never seen.
- **`Twilight Discount Pricing Settings`**, **`Hi/Lo Gross Profit Option`**, **`Requested Date
  Calculation`**, **`Ashley Custom Cost Formula`** — articles in this subsection whose names imply
  pricing and costing mechanics the audit has not touched.

### Still unresolved

- **`Landed Cost Distribution`** is located but its **values are still not published** — run 04 F273's
  `Distribution Method` enumeration remains open.
- **`Assign Specific Pieces Event` values** are not repeated in the owning record; they stand from
  run 06 F328.
- The audit's thirteen undefined terms: **none resolved by these two records.**

### Inferences (recorded as inference, not fact)

- **I-61:** `Assign Specific Pieces Event` and `Assign Specific Pieces At` are the same field under two
  names. *The Inventory-page context makes it near-certain, but no article states the equivalence.*
- **I-62:** The five Exception Handling fields map to cost exception types 1–4 as
  `Warehouse Receipts Zero Cost` → 1, `Positive Adjustments Zero Cost` → 2,
  `Customer Returns Zero Cost` → 3, `Inventory AP Approval` → 4. *Strongly implied by the names and by
  the type list in run 04 F261; not stated.*
- **I-63:** ATC is ATP plus delivery lead time. *Purely from the names.*

---

## I. Unknown unknowns

- **The audit has been reading the shadow of this record for six runs.** ~250 fields, of which about
  fifteen were cited. Every "a setting governs this" in runs 01–06 was a glimpse of one page of one
  record. **A configuration audit of the live values is now the highest-value next step** — the field
  list tells us what is decidable; only the values tell us what LA Mattress decided.
- **Settings can conflict, and STORIS advises rather than prevents** (F350's average-cost warning).
  The detect-and-report house style extends to configuration itself, which means **the live
  configuration may contain vendor-discouraged combinations** and nothing flags them.
- **Two loyalty programs, not one** (F343) — and run 03 spent a batch concluding the area was
  unreconstructable and recommending a vendor question. **The answer was in a section the queue had
  not reached.** Worth remembering before declaring anything else unreconstructable.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Replacement / Weighted Average / Exact (Actual) Cost** | The three configurable costing methods |
| **Add-on Cost 1–4** | Four site-labelled landed-cost components beside freight |
| **Landed Liability Accounts** | Where RTV landed-cost write-offs are posted |
| **`Assign Specific Pieces Event`** | The owning record's name for `Assign Specific Pieces At` |
| **ATC — Available to Customer** | A second promise date alongside ATP |
| **Stock Location Schema (Demand)** | Multi-leg sourcing schema |
| **Distribution Location Schema (Logistics)** | Multi-leg routing schema |
| **Past Dates Rescheduling** | EOD process moving stale reserved transfers forward |
| **Point of Sale User Verification** | Per-transaction re-authentication at order entry |
| **Protection Plan Register Code** | The third-party provider's plan identifier, reused on exchanges |

---

## Contract adjudication — batch 1

| Contract | Verdict | Basis |
|---|---|---|
| **W-041** *(cost exceptions)* | **CONFIRMED at the settings level — third independent confirmation** | Exception Handling tab; type 4 manual-only (F348) |
| **W-061** *(cost and margin)* | **CONFIRMED and materially extended** | Three costing methods; four labelled add-on slots (F347); RTV GL switches (F350) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | Five named GL switches including Landed Liability Accounts (F350) |
| **W-012** *(dates and batch processes)* | **CONFIRMED — a ninth EOD behaviour** | Past Dates Rescheduling (F352); Backdating Rules |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED and extended** | ATP suppression reaches five screens (F346); three-level multi-leg sourcing precedence (F351) |
| **W-050** *(access control)* | **CONFIRMED — a third credential mechanism** | POS User Verification (F344); price variance rules explain run 06 F316 (F345) |
| **W-064** *(retention)* | **CONFIRMED — the nine chains become at least twenty** | F341, F349 |
| **W-024** *(holds)* | **CONFIRMED** | `Exchanges on Hold at Entry` (`E1`), `Last Activity __ Days` (`C3`), `Past Due __ Days` (`C2`) all located |
| **W-028** *(protection plans)* | **CONFIRMED, extended** | Four-case truth table; third-party register code (F342); **two** loyalty programs (F343) |
| **W-042** *(propagation)* | **CONFIRMED — the first hard cross-document lock** | Auto-transfer manifest prohibitions (F339) |
| **Configuration conflict advisories** | **NEW** | F350 |

---

## Next — batch 2

`Inventory Control Settings` · `General System Control Settings` · `Stock Reservation Settings` ·
`Sales Order Reservations` · `Zero-Cost Exception Handling`.
