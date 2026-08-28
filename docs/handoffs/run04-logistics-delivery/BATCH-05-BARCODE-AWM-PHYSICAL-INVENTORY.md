# Run 04 — Inventory Management (Logistics / Delivery) — Batch 5: Barcode, AWM, and physical inventory

Status: complete. Findings 214–226. Read-only throughout. **No batch created, no inventory frozen,
no scan uploaded, no physical inventory updated or cleared.** These articles are step-by-step
operating procedures for destructive processes; they were read as documentation and nothing in them
was performed.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | Barcode Overview | 15173654078484 | read — **five scanning architectures** |
| 2 | AWM Function Settings | 15173656997396 | read |
| 3 | AWM Exception Type Settings | 15173656999316 | read — **five reserved exception codes** |
| 4 | AWM Schedule - Delivery Pick | 15173615575316 | read *(template; see coverage note)* |
| 5 | Bar Code Physical Batch Creation | 15173614925716 | read |
| 6 | Bar Code Pick Review | 15173613924756 | read — **damage-at-pick substitution; `RESEARCH` location** |
| 7 | Batch Bar Code Receiving | 15173657446164 | read — **full procedure** |
| 8 | Batch Bar Code Full Physical Inventory | 15173667610772 | read — **the richest article in run 04** |

**Coverage note on the nine `AWM Schedule - *` articles.** `Delivery Pick` was read in full and is a
**template instance**: purpose sentence, then `Warehouse Location` · `RF User` · `Schedule Date` ·
`Grid Information`. The other eight — `Delivery Prep`, `Delivery Special Picking`,
`Delivery Load / Transfer Load`, `Customer Pickups`, `Cycle Count`, `Receive Product`,
`Transfer Prep`, `Transfer Receiving` — are the same screen scoped to a different task type and are
**deliberately excluded** on the pattern established in run 02 batch 11 (F145) and run 03 batch 16.
Their value is the **enumeration of AWM task types**, which is captured in section F. This is stated
rather than left silent.

---

## B. Wiring findings

### FINDING 214 — There are five distinct barcode architectures, and which ones exist is a settings-plus-licensing question

- **Invariant:** "barcode" is five different systems with different data-flow models.
- **Evidence** — `Barcode Overview`:
  > "STORIS offers several methods of barcode scanning and processing: **Batch Bar Code · Radio Frequency (RF) Bar Code · Store Bar Code · POS Scanning · Advanced Warehouse Management (AWM)**"
  and:
  > "The processes available to you depend on the settings in the **General System Control Settings** and on **any add-on modules you have purchased**."

| Architecture | Data flow | Capabilities as documented |
|---|---|---|
| **Batch Bar Code** | scan offline → **upload/download in batches** | PO receiving, transfer receiving, bin-to-bin, cycle counts, full physicals, **physical counts of pieces on manifests** |
| **RF Bar Code** | **real-time**, "without having to return to a port or station" | receiving, bin-to-bin, **picking for transfers, delivery orders and customer pickups**, full physical and cycle counts |
| **Store Bar Code** | RF scanners, **non-location-tracked locations** | physical counts by scanning POS or inventory barcodes; reconciled manually via frozen-quantity reports |
| **POS Scanning** | scan floor tags at point of sale | adds items to a sales order; also receives PO merchandise |
| **AWM** | **on top of RF** | workload scheduling and prioritisation for RF users |

- **Maps to:** F190, F206, F212 (licensing) — **CONFIRMED a sixth time**; `W-050`.

> Note the capability differences, because they are not cosmetic. **Only RF picks.** Batch cannot
> pick; it receives and counts. So a site running Batch Bar Code has no scanned picking at all, and
> the `R` (Radio Frequency) column on the scheduling grid (batch 1 F168) is permanently blank for
> them. **Store Bar Code exists specifically for non-location-tracked locations** and does not update
> inventory at all — it produces a report that a human acts on:
> > "You then **manually update inventory** based on the results of the physical inventory report."
>
> That is three different degrees of automation for the same business activity, chosen by
> configuration. "Do we scan?" is not a yes/no question in this ERP.
>
> **`General System Control Settings`** is a new named record and it gates the whole family.

### FINDING 215 — AWM is a scheduling layer that drives the scanner, not a scanning method

- **Invariant:** the RF device shows a prepared, prioritised task list generated in STORIS.
- **Evidence** — `Barcode Overview`:
  > "**The AWM schedule is the driving force for all activity on the RF device.** When your warehouse personnel logs in to the RF device, they can view **their prepared schedule of tasks, with priorities set for each task**."
  and:
  > "warehouse managers can … **generate and update schedules for RF functions** … **in real time**."
- **Maps to:** F214; **NEW** — no contract covers warehouse labour scheduling.

> This inverts the naive model. Without AWM, an RF user walks up and does work. **With AWM, the
> warehouse manager assigns the work and the device presents it.** The scanner becomes an
> instruction-following device rather than a data-capture device.
>
> That has a direct consequence for the rebuild: **the AWM schedule is a labour-planning artefact
> that lives in the ERP**, and if we drop it, warehouse supervisors lose their dispatch tool, not
> just a screen. The nine task-type screens are how a supervisor loads a person's day.

### FINDING 216 — AWM function codes are half vendor-reserved and half site-defined, with a per-user frequency field

- **Invariant:** the task vocabulary is partly fixed by the vendor and partly extensible by the site.
- **Evidence** — `AWM Function Settings`:
  > "This file contains **both user-defined Functions and STORIS-reserved functions**."
  > "If using this process to access a **STORIS-reserved** function code, **only the description and sort priority can be changed; STORIS reserved function codes cannot be deleted by the user**."
  Fields: `RF User Function` · `Description` · **`Sort Priority`** · **`Reserved`** · **`Times per Day`**.
- **Maps to:** F215; run 04 F172/F174 (ordered lists as business rules).

> A **`Reserved` flag on the record itself** — the table knows which of its own rows are the
> vendor's. Clean, and worth copying: it lets a site extend a controlled vocabulary without being
> able to break it.
>
> **`Sort Priority`** is the fifth instance of the STORIS idiom "an ordered list whose order is the
> business rule" (after selling price, landed cost, handling method assignment, and the hold
> resolution chains). Here it orders the task list a warehouse worker sees.
>
> **`Times per Day`** is the interesting one and it is unexplained. A frequency on a function code —
> presumably how often that task should be scheduled per day. If so, AWM has an expected-cadence
> model, which is a labour-standards concept and considerably more than a task list. Section H.

### FINDING 217 — RF exception types are a closed, vendor-supplied five-value enumeration

- **Invariant:** what can go wrong on a scanner is a fixed list.
- **Evidence** — `AWM Exception Type Settings`:
  > "The Exception Type records (**DMG, NIL, DPICK, DPREP, DSTAGE**) are **supplied by STORIS** and are used by the **Report AWM User Exceptions** pre-screen. **Users can change the Description of the Exception Type codes only. Records can not be added to or deleted from the file by users.**"
- **Maps to:** `W-039` (exceptions) — **CONFIRMED**; F216.

> Five codes, closed set, description-only editing — stricter than the AWM function codes, which at
> least allow additions. `DMG` (damage) and `NIL` are self-evident; `DPICK`, `DPREP` and `DSTAGE`
> map to the delivery pick / prep / stage stages, so **three of the five are stage-failure markers**
> rather than condition markers.
>
> `DSTAGE` is notable: **staging is a tracked stage with its own exception**, which retroactively
> gives meaning to the unexplained `Staging Area` field on the manifest build screen (batch 2). We
> now know staging is real enough to fail at. `Report AWM User Exceptions` is named and unread.

### FINDING 218 — A picker who finds damage triggers automatic substitution — or, failing that, an As-Is write-down and a move to a location called `RESEARCH`

- **Invariant:** damage discovered at pick time re-sources the order automatically when it can.
- **Evidence** — `Bar Code Pick Review`:
  > "To change an item to **As-Is or NIL**, select a product by double-clicking the line in the grid."
  > Prompt: "**Product XXX; reference NN; will be changed to NIL/As-Is. Are you sure?**"
  > "**If the piece is a stock product and additional available quantity exists, the system automatically removes that piece and adds the new one. If no additional quantity exists or the piece is a special-order product, the status changes to As-Is and the location changes to RESEARCH.**"
- **Maps to:** `W-055` / `W-056` (reservation) — **CONFIRMED and extended**; `W-061` (cost);
  batch 2 F186 (`Add To As-Is Reason Code` at failed delivery).

> **This is the best wiring finding in the batch.** A warehouse worker marking one piece damaged
> sets off a documented three-way branch:
>
> 1. **Stock product with available quantity** → the system **silently swaps the piece**. The order
>    is unaffected; a different physical unit is assigned.
> 2. **Stock product, nothing available** → status becomes **As-Is**, location becomes **`RESEARCH`**.
> 3. **Special-order product** → same as (2), **regardless of availability** — because the
>    replacement would not be the customer's item.
>
> Branch 1 is the one to notice: **STORIS re-sources an order from the warehouse floor without
> telling anybody.** No exception, no comment, no approval — the piece is exchanged. That is
> genuinely good design for a stock business and it is the sort of thing a rebuild omits and then
> discovers when pickers start phoning the sales floor.
>
> **`RESEARCH` is a named magic storage location** — a quarantine bin for stock whose disposition is
> unknown. It joins the truck and the dock as system-meaningful locations (batch 3 F190). Nothing we
> have read defines who works the `RESEARCH` location or how stock leaves it. Section H.
>
> Branch 2 and 3 are **cost events**: As-Is merchandise is repriced, which reaches run 02's As-Is
> machinery and run 03 F144's margin restatement. **A damaged pick is a margin event**, and the
> chain from scanner to income statement is: pick review → As-Is → repricing → the sale's cost
> restated → negative-margin adjustment to Written Business and `BTA`.
>
> Note also that `NIL` and `As-Is` are offered as **two dispositions of the same action** — `NIL`
> presumably meaning the piece is not there at all, `As-Is` that it is there but damaged. Both are
> in the AWM exception enumeration (F217), which ties the two subsystems together.

### FINDING 219 — Active cost exceptions block an inventory freeze, and the block is enforced twice

- **Invariant:** you cannot take a physical inventory while any cost is unresolved.
- **Evidence** — `Batch Bar Code Full Physical Inventory`, in *Prepare to Freeze Inventory*:
  > "**Resolve all cost exceptions. If active cost exceptions exist in the system, you cannot perform a physical inventory freeze.**"
  and again at the freeze step:
  > "If cost exceptions were not resolved …, a message displays **the number of cost exceptions and a warning that you cannot freeze inventory until the cost exceptions are resolved (via Correct a Cost Exception.)** Click OK, exit the screen and resolve the exceptions. **Once exceptions are resolved, start again with the Freeze Inventory step.**"
- **Maps to:** `W-041` (cost) — **CONFIRMED**; run 02's central finding — **now closed from the
  inventory side**.

> Run 02 found this as a claim; here is the operational text, twice, with the named remedy routine
> (`Correct a Cost Exception`) and the consequence (start the freeze over).
>
> The chain across three runs is now complete and it is one of the most important things this audit
> has assembled:
>
> **PO received at an uncertain cost → type-4 cost exception raised (run 02, manual-only) →
> exception blocks the physical inventory freeze (here) → when worked, the exact cost restates
> already-written sales orders → negative-margin adjustments to Written Business and `BTA`
> (run 03 F144).**
>
> One unworked queue can stop the annual count *and* silently move last quarter's margin. For the
> rebuild, the cost exception queue is not a back-office chore — **it is on the critical path of both
> the inventory close and the margin figures**, and it should be surfaced accordingly.
>
> A **cycle count in progress also blocks the freeze**, with its own remedy:
> > "a message displays warning that you cannot freeze the inventory until the cycle count has been deleted. (The cycle count must be deleted via **Create Listing of Storage Locations to Count**.)"

### FINDING 220 — The physical inventory update performs seven named actions, including general ledger adjustments and reservation reassignment

- **Invariant:** the count update is a multi-subsystem transaction, not a quantity correction.
- **Evidence** — `Batch Bar Code Full Physical Inventory`, *Update Physical Inventory*:
  > "The update process performs the following functions:
  > - **Adjust quantities-on-hand.**
  > - **Add pieces to As-Is inventory.**
  > - **Remove pieces from As-Is inventory.**
  > - **Perform G/L adjustments (i.e. reduce saleable inventory, costing for As-Is inventory).**
  > - **Transfer merchandise between storage locations.**
  > - **Adjust serial numbers.**
  > - **Reassign Sales Order reservations.**"
  Inputs: warehouse location, **a unique As-Is Reason Code created for the physical inventory**
  (recommended example: `PHY`), and an `As Of Date`.
- **Maps to:** `W-052` / `W-053` (GL) — **CONFIRMED**; `W-055` / `W-056`; `W-061`; `W-012`.

> Seven subsystems touched by one Run button. **"Reassign Sales Order reservations"** is the one
> that should worry anyone planning a cutover: a physical count **re-points customers' reserved
> stock**. Combined with F218's silent substitution, STORIS treats the link between an order and a
> specific physical piece as **fluid by design** — the order is entitled to *a* piece, not *that*
> piece, and the system re-brokers freely.
>
> That is a first-class modelling decision and we should make it deliberately rather than inherit it.
> Our instinct would be to bind order lines to serial numbers early. **STORIS binds late and rebinds
> often**, and its picking, damage handling and counting all depend on that.
>
> The **As-Is Reason Code discipline** — create a dedicated code for the count so its adjustments are
> separable afterwards — is a practice worth carrying over regardless of the system.
>
> Two clean-up reports are named and both describe real conditions:
> - `Report As-Is Exceptions` — *"remove and write off those products that were **reserved but not counted**"*;
> - `Report Commitment Exceptions` — *"lists all regular stock products that **could not be reserved to sales orders or transfers but were reserved prior to the update due to count shortages**."*
>
> The second is the reservation-loss report: orders that had stock before the count and do not after.

### FINDING 221 — Physical inventory must be updated before Generate Monthly Reports, or the freeze date becomes unreachable

- **Invariant:** the count and the period close have a mandatory order.
- **Evidence** — `Batch Bar Code Full Physical Inventory`:
  > "**Important!** It is strongly recommended that you **complete the physical inventory update PRIOR to running the month ending process (Generate Monthly Reports)**. If you do not complete the update first, **the system does not allow you to back-date your EOM processing to the date you ran the Freeze Inventory** and **you are prevented from adding more products to the physical inventory count**."
- **Maps to:** `W-012` (dates and periods) — **CONFIRMED**; `W-052`.

> A hard sequencing rule between the warehouse and the accounting close, with two named consequences
> for getting it wrong — and **both are irreversible within the period**. Note that the article
> phrases it as a recommendation ("strongly recommended") and then describes it as an enforcement
> ("does not allow", "are prevented"). It is an enforcement.
>
> This joins the run's growing list of **batch-process orderings that are load-bearing**: EOD releases
> credit holds (run 03 F153), EOM purges written sales (F145) and `DAILY.DETAIL` (F160), and now EOM
> closes the door on a physical inventory. **The batch calendar is business logic in this ERP**, and
> the rebuild will be tempted to make everything real-time — which would silently delete a set of
> sequencing guarantees the business relies on.

### FINDING 222 — Clearing a physical inventory is permanent and unrecoverable, and the docs say so twice

- **Invariant:** the count workspace is destroyed on clear, with no recovery.
- **Evidence** — `Batch Bar Code Full Physical Inventory`:
  > "**Important!** It is recommended not to clear the physical inventory until you are satisfied with the results and have all the needed reports. **Once the physical inventory is cleared, this information cannot be accessed or recovered.**"
  and at the clear step:
  > "you clear **all data associated with the inventory count** for the designated warehouse. **Once cleared, physical inventory reports cannot return data for this warehouse.**"
  Mechanism: the same `Freeze Inventory` screen with **`Perform Clear Only`** checked.
- **Maps to:** `W-034` (deletion); `W-064` (retention).

> Notable as a **design anti-pattern we should not copy**: the destructive clear lives on the same
> screen as the constructive freeze, distinguished by one checkbox. Every other step in this
> procedure says "leave `Perform Clear Only` unchecked", which tells you how often it is mis-clicked.
>
> No permission is named for it. Given that `Delete an Entire Manifest` has its own extended security
> setting (batch 4 F189), the absence here is conspicuous — though absence in the documentation is
> not absence in the product.

### FINDING 223 — Bulk products break the scan-count model, and the documentation explains the arithmetic twice

- **Invariant:** a scan is a label event; a bulk label carries a keyed quantity.
- **Evidence** — identical passages in `Batch Bar Code Receiving` and `Batch Bar Code Full Physical Inventory`:
  > "When you scan a bulk product label, the **Enter Bulk Quantity** screen appears … **The Quantity defaults to 1.** … your Scan Count shows 4. You then scan the bulk product label and enter a bulk quantity of 10 for that product. **The Scan Count still only increments by 1 because you scanned one product label.** So your Scan Count now shows 5."
  Re-scanning the same bulk label offers **`Add` · `Upd` · `Cancel`**.
- **Maps to:** run 02 (bulk vs serialised inventory types); F218.

> **Scan Count counts labels, not pieces.** The vendor writes the same worked example into two
> different articles, which is as strong a signal as documentation gives that people get this wrong.
>
> The three-button re-scan — add to, replace, or abandon the previously keyed quantity — is a real
> piece of interaction design that our scanner UI will need, and it exists because bulk counting is
> inherently a correction-prone activity.
>
> Duplicate handling differs by context and the difference is exact: **within one storage location**
> a duplicate label prompts *"Duplicate Label Scan. That label has already been scanned. Would you
> like to remove it?"*; **across bins**, no message at all —
> > "If there are instances of a label ID being scanned in **multiple bins, no message displays**. However, after the data is sent back from the scanner, you can run **Report Duplicated Physical Inventory Scans** to trouble-shoot duplicate label issues."
> One physical label counted in two bins is caught only afterwards, by a report. That is a real
> counting-accuracy gap and it is documented as such.

### FINDING 224 — Scanning a kit master silently skips it and updates only its components

- **Invariant:** kits are not countable objects; their components are.
- **Evidence** — `Batch Bar Code Full Physical Inventory`:
  > "The **Report Error Messages** routine includes scanning errors that occur when a **kit master label** is scanned. **When you scan a label for a kit master product, the update for that label is skipped and updates are performed only on the scanned kit components.**"
- **Maps to:** run 02 (kit components are not independently sellable); run 03 batch 16 F157
  (`Kit Component Only` header marker).

> The kit master is a selling construct with no independent physical existence, so counting it is
> meaningless — and STORIS handles that by **skipping it and logging an error rather than refusing
> the scan**. Consistent with the house style found throughout run 04: detect, record, carry on.
>
> Note the asymmetry with run 02's finding that kit components are not independently *sellable*.
> They are independently *countable*. **Sellability and countability attach to different levels of
> the kit**, which is exactly right and easy to get wrong.

### FINDING 225 — Batch receiving has a four-answer completion dialogue whose branches determine both PO update and report availability

- **Invariant:** how you answer the closing prompts decides whether quantities post and whether the batch survives for reporting.
- **Evidence** — `Batch Bar Code Receiving`:
  > Incomplete batch: "**This Barcode Receipt is INCOMPLETE! Process receiving batch. Yes No.** If you answer **Yes**, the received quantities on the purchase order(s) **are updated, but the batch remains open** for further receiving. … If you answer **No**, the purchase order received quantities are **not updated** and the batch remains open."
  > Complete batch: "**Transaction ready for processing! Processing receiving batch? Yes No**" → then "**All lines in this batch have been processed. Delete Batch? Yes No.**"
  > "Click **No** in order to **retain this batch information for reporting purposes**. If you answer No, the information is available for the **Report Barcode Receivings**. If you click **Yes** to delete the batch, … **the information is not available** when you run the Report Barcode Receivings."
- **Maps to:** `W-034` (deletion); `W-064` (retention); `W-005`.

> **Partial receiving is a first-class outcome**: answer Yes on an incomplete batch and the PO is
> updated while the batch stays open for the rest. That is the right model for split deliveries and
> it matches run 03 batch 16 F159's note that a PO can have multiple receivings.
>
> The deletion prompt is the trap. **The default-looking answer destroys the audit trail.** A worker
> tidying up at the end of the day by clicking Yes removes the batch from `Report Barcode Receivings`
> permanently. There is no permission on it and no warning beyond the prompt text. Pair this with
> F222 (physical inventory clear) and there is a pattern: **in the barcode module, destructive
> cleanup is offered as the closing step of a normal workflow.**
>
> The scanner login uses the STORIS user and password from `Create a User` settings — so warehouse
> device access is the same identity system as the ERP, not a separate one. Worth knowing.

### FINDING 226 — Physical inventory batches are built from storage locations, with two settings deciding what is in scope

- **Invariant:** the count's scope is a location set assembled from settings plus manual selection.
- **Evidence** — `Bar Code Physical Batch Creation` *(tabs: `Entered`, `Available`)*:
  > "If **Select all Locations for Cycle Count** is checked in **Warehouse/Store Location Settings** all storage locations are automatically loaded into the grid. If a location is excluded through the **Exclude From Cycle Count** check box in **Tracked Storage Location Settings** then **it will not be included in the grid, but can still be added through the Select locations global action**."
- **Maps to:** F219; `W-050`.

> A two-setting scope rule with an **override that defeats the exclusion**: a location marked
> `Exclude From Cycle Count` is kept out of the automatic load but can still be added by hand.
> So the exclusion is a default, not a guarantee — the same soft-constraint pattern as route capacity
> (batch 3 F194).
>
> **`Tracked Storage Location Settings`** is a new record, and its existence confirms that storage
> locations are configured objects with their own settings, not just labels. Combined with `RESEARCH`
> (F218), the truck and loading locations (batch 3 F190), and `DOCK` (used as the worked example in
> both procedures), **the location table is a significant model in its own right** and we have never
> read its definition. Queued.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **AWM Function Settings** | RF User Function · Description · Sort Priority · Reserved · Times per Day |
| **AWM Exception Type Settings** | Exception Type · Description *(description editable only)* |
| **AWM Schedule - Delivery Pick** *(and 8 siblings)* | Warehouse Location · RF User · Schedule Date · Grid Information |
| **Bar Code Physical Batch Creation** *(tabs: Entered, Available)* | Batch Number · Move Locations to Available · **Assign Batch** · Move Location to Entered · Storage Locations · Grid Information · Actions → Select Locations |
| **Bar Code Pick Review** | Store/Route · Order Type · Order Number · Serial/Reference · Quantity · **Action** *(As-Is / NIL)* · Grid Information |
| **Freeze Inventory** | Location · **Perform Clear Only** · **Include Manifested Deliveries** · **Default Count Quantities** · product/group/category scope · Save |
| **Update Physical Inventory Results** | warehouse location · **As-Is Reason Code** · **As Of Date** · Run |
| **Scanner (Batch Barcode)** | Login: Warehouse ID · User ID · Password *(from `Create a User`)* → Main Menu → Communication (`Get Data` / `Send Data`) · Batch Menu → Warehouse Receipts / Physical Inventory. Count screens: storage location · label · **Scan Count** · Enter Bulk Quantity (`Add`/`Upd`/`Cancel`) |
| **Assign Purchase Orders to a Bar Code Receiving Batch** | location · print method · New Batch · Assign Batch · Purchase Order *(searchable by vendor)* → **Bar Code PO Line Entry** *(scheduled quantity, print labels)* → **Barcode Download/Upload Status Screen** *(`Assign Batch To`)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| *(barcode method availability)* | **General System Control Settings** + add-on modules | Which of the five architectures exist (F214) |
| **Select all Locations for Cycle Count** | Warehouse/Store Location Settings | Auto-loads all storage locations into a count batch (F226) |
| **Exclude From Cycle Count** | **Tracked Storage Location Settings** | Keeps a location out of the auto-load; **overridable manually** (F226) |
| **Include Manifested Deliveries** | Freeze Inventory run-time | STORIS **recommends checking** — includes manifested stock in the freeze |
| **Perform Clear Only** | Freeze Inventory run-time | **Destroys all count data for the warehouse** (F222) |
| **Default Count Quantities** | Freeze Inventory run-time | Documented only as "leave unchecked" |
| **Sort Priority**, **Times per Day** | AWM Function Settings | Task ordering and cadence (F216) |

---

## E. Security permissions catalog (additions)

- **Scanner identity is ERP identity:** the RF/batch device login uses the STORIS user and password
  "established in STORIS **Create a User** settings" (F225). No separate device credential.
- **`Assign a User to Physical or Cycle Count Locations`** — count work is assigned per user, and a
  user can hold a batch for only one warehouse at a time:
  > "There are Transactions waiting for USER at a **different Warehouse**."
- **No permission is named** for clearing a physical inventory (F222) or deleting a receiving batch
  (F225) — both destructive. Recorded as an observed absence in the documentation.

---

## F. State machines and enumerations (additions)

- **Barcode architectures (5):** Batch · RF · Store · POS Scanning · AWM *(AWM layered on RF)*.
- **AWM task types (9):** Delivery Pick · Delivery Prep · Delivery Special Picking ·
  Delivery Load / Transfer Load · Customer Pickups · Cycle Count · Receive Product · Transfer Prep ·
  Transfer Receiving.
- **AWM exception types (5, closed, vendor-supplied):** `DMG` · `NIL` · `DPICK` · `DPREP` · `DSTAGE`.
- **AWM function codes:** user-defined **or** `Reserved` *(vendor; undeletable)*.
- **Pick review dispositions (2):** `As-Is` · `NIL` — with a three-way outcome branch (F218).
- **Named magic storage locations:** **`RESEARCH`** *(damaged/unresolved stock)* · `DOCK`
  *(receiving, used as the worked example)* · Truck Storage Location · Loading Storage Location.
- **Physical inventory phases (8):** Prepare to Freeze → Freeze → Assign User → Scan → Send Data →
  View Progress → **Update** → **Clear** *(irreversible)*.
- **Freeze blockers (2):** active cost exceptions · a cycle count in progress.

---

## G. Sequencing rules

1. Set delivery / receipt / transfer cut-offs → complete all orders, outbound transfers and vendor
   returns → **resolve all cost exceptions** → **delete any in-progress cycle count** → freeze (F219).
2. Freeze → auto-runs `Report Detail Frozen Quantities`; compare against `Report Summarized Frozen
   Quantities` to validate the freeze.
3. Scan → send → **`Report Frozen to Counted Variances` (Variance Only)** → resolve → **Update**.
4. Update → seven subsystem actions including GL and reservation reassignment (F220) →
   `Report Physical Inventory Update Audit Trail` *(special orders first, then stock)* →
   `Report As-Is Exceptions` → `Report Commitment Exceptions`.
5. **Update must precede `Generate Monthly Reports`**, or the freeze date cannot be back-dated and no
   further products can be added to the count (F221).
6. **Clear only after all reconciliation** — irreversible (F222).
7. Receiving: assign POs to a batch → print labels → scan → send → verify → process
   *(complete or incomplete)* → **choose whether to delete the batch**, which decides whether
   `Report Barcode Receivings` can ever show it (F225).
8. Pick review: mark `As-Is`/`NIL` → **auto-substitute** *(stock, available)* **or** As-Is +
   `RESEARCH` *(no stock, or special order)* (F218).

---

## H. Open questions and gaps

### Gated or unreachable

- `Correct a Cost Exception` — the remedy routine for the freeze blocker. Named across two runs,
  never read. **High priority.**
- `Tracked Storage Location Settings` · `General System Control Settings` ·
  `Warehouse/Store Location Settings` — three records gating this whole subsection, none read.
- `Create Listing of Storage Locations to Count` · `Report AWM User Exceptions` ·
  `Report Barcode Receivings` · `Report Duplicated Physical Inventory Scans` ·
  `Report As-Is Exceptions` · `Report Commitment Exceptions` ·
  `Report Physical Inventory Update Audit Trail` · `Report Frozen to Counted Variances` ·
  `Report Detail/Summarized Frozen Quantities` · `Enter a Single Physical Count Tag` ·
  `Enter Multiple Physical Count Tags` — named, unread. Several are queued for the Inventory
  Views and Reports batches.
- **`Alert Code Settings`** and **`Assign Specific Pieces At` values** — still the two highest-priority
  unknowns from batch 4 and batch 3.
- **Four Kardex ledgers** — `View Detailed Activity for a Product (Kardex Inquiry)` is named here as
  the post-update research tool. Carried unread since run 02. Queued for the Inventory batches.

### Documented but ambiguous

- **`Times per Day`** on AWM function codes — a cadence? a labour standard? Unexplained (F216).
- **`RESEARCH`** — who works this location, and how does stock leave it? (F218).
- **`NIL` vs `As-Is`** — the two dispositions are offered together and never distinguished in text.
- **`Default Count Quantities`** — documented only as "leave this field unchecked".
- **`DPICK` / `DPREP` / `DSTAGE`** — stage names, never defined as stages anywhere.
- **Whether the automatic substitution in F218 notifies anyone.** Nothing suggests it does.
- **What `Store Bar Code` does about non-location-tracked locations** in the wider inventory model —
  it exists because such locations are counted differently, and we have not read what they are.

### Inferences (recorded as inference, not fact)

- **I-32:** `NIL` most likely means the piece was not found in the location, as against `As-Is`
  meaning found but damaged. *Both codes appear in the AWM exception list; neither is defined.*
- **I-33:** `Times per Day` probably sets how often an AWM function should be scheduled per day.
  *Purely from the field name.*
- **I-34:** `DSTAGE` probably relates to the `Staging Area` field on manifest build (batch 2).
  *The two articles never reference each other.*

---

## I. Unknown unknowns

- **Order-to-piece binding is deliberately loose.** Silent substitution at pick (F218) and reservation
  reassignment at count (F220) mean STORIS rebrokers physical units freely. **Our instinct to bind
  order lines to serial numbers early would break both.** This is the most important design
  implication found in run 04 so far.
- **Destructive cleanup is offered as a normal workflow step**, unpermissioned, twice (F222, F225).
  There may be more of these; the audit has been reading for wiring, not for footguns, and should
  flag them deliberately from here.
- **The storage location model is substantial and unread.** Magic locations, tracked-location
  settings, cycle-count exclusions, truck and dock as locations. It underpins everything in this
  subsection and we have never opened its definition.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Batch Bar Code** | Offline scanning with upload/download; no picking |
| **RF Bar Code** | Real-time scanning; the only architecture that picks |
| **Store Bar Code** | Counting at non-location-tracked locations; manual inventory update |
| **AWM** | Advanced Warehouse Management — the schedule that drives the RF device |
| **RF User Function** | An AWM task code; vendor-`Reserved` or site-defined |
| **`DMG` `NIL` `DPICK` `DPREP` `DSTAGE`** | The five closed RF exception types |
| **`RESEARCH`** | Magic storage location for damaged or unresolved stock |
| **Scan Count** | A count of labels scanned, **not** of pieces |
| **Kit master** | Selling construct; skipped when scanned, components counted instead |
| **Freeze / Clear** | Start and irreversible end of a physical inventory workspace |
| **As-Is Reason Code** | The tag that makes a count's adjustments separable afterwards |

---

## Contract adjudication — batch 5

| Contract | Verdict | Basis |
|---|---|---|
| **W-041** *(cost)* | **CONFIRMED — run 02's chain now closed from the inventory side** | Cost exceptions block the freeze, twice, with the named remedy (F219) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | The count update performs GL adjustments explicitly (F220) |
| **W-055 / W-056** *(reservation)* | **CONFIRMED and materially extended** | Silent substitution at pick (F218); reservation reassignment at count (F220) |
| **W-012** *(dates and periods)* | **CONFIRMED** | Count update must precede EOM or the freeze date is unreachable (F221) |
| **W-034** *(deletion)* | **CONFIRMED** | Clear is irreversible (F222); batch deletion destroys the receiving report (F225) |
| **W-039** *(exceptions)* | **CONFIRMED** | Closed five-value RF exception set (F217) |
| **W-064** *(retention)* | **CONFIRMED** | Batch retention decided by a workflow prompt (F225) |
| **W-005** *(receiving)* | **CONFIRMED** | Partial receiving is a first-class outcome (F225) |
| **W-050** *(access control)* | **partially NOT DOCUMENTED** | Scanner identity = ERP identity; **no permission named for two destructive actions** |
| **Licensing altering available processes** | **NEW — sixth confirmation** | F214 |
| **Warehouse labour scheduling** | **NEW — no contract covers it** | F215, F216 |

---

## Next — batch 6

Remainder of `Barcode` (84 articles): the RF family (`RF Bar Code PO Receiving`, RF picking,
bin-to-bin), `Bar Code Batch Maintenance`, `Barcode Storage Location Selection`,
`Batch Bar Code Scanning Devices`, `As-Is Kit Selection`, `Assign a User to Physical or Cycle Count
Locations`, and the tag/label printing family — plus the three unread settings records that gate
this subsection.
