# Run 04 — Inventory Management (Logistics / Delivery) — Batch 6: Putaway, picking, over-receipt

Status: complete. Findings 227–236. Read-only throughout. No putaway plan created, no aisle
unlocked, no receipt entered, no schedule added.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | Plan Directed Putaway Assignments | 15173667228052 | read — **two-step plan with permissioned override** |
| 2 | Over Receipt of Merchandise | 15173614995092 | read — **internal mail to the buyer** |
| 3 | Delivery/Transfer - Pick, Prep, Load | 15173667113748 | read — **the four warehouse stages named** |
| 4 | Remove Locked Aisles (Radio Frequency) | 15173670208532 | read — **aisle locking: a physical-world mutex** |

**Barcode subsection inventory captured** (84 articles across three listing pages). Page 2 surfaced
a family of processes runs 01–03 never touched: directed putaway (`Plan Directed Putaway
Assignments`, `Reassign Putaway Locations`, `Putaway Assignment Report`), picking consolidation
(`Consolidate Picking Maintenance`, `Remove Items From Picking (RF)`, `Remove Multiple Orders from
Picking`, `Remove Locked Aisles`), label and tag printing (nine `Print *` articles),
`EDI Trip Info`, `Process Type`, `Float Label Print`, `Over Receipt of Merchandise`,
`Quantity and Serial Number Review Screen`, and the physical-inventory processors.

---

## B. Wiring findings

### FINDING 227 — Directed putaway is a two-step plan: the system assigns destinations, and overriding them needs security

- **Invariant:** where received goods go is computed, then optionally overridden by a permissioned user.
- **Evidence** — `Plan Directed Putaway Assignments` *(tabs: `STEP 1`, `STEP 2`)*:
  > "Use this routine with the **directed putaway process** to automatically designate the putaway locations for either **manual putaway processing or for AWM RF Putaway processing**. In Step 1, you specify putaway merchandise… You then use the **Assign Putaway** button on this tab to **create the putaway plan**. In Step 2, you review the **system-assigned destination locations and quantities**. You can manually assign storage locations, and **if you have the necessary user security, you can update system-assigned locations and quantities**."
  > "**If a product cannot be assigned a storage location in this process, the user is alerted and then must manually assign a destination storage location to that product.**"
  Step 1 origins: `Storage Location(s)` · `Purchase Order(s)` · `Receiving Batch(es)` ·
  `Merchandise Transfer(s)` · `Transfer Manifest(s)` · **`Exclude Crossdock Transfers Linked to`
  {Other Transfers | Customer Pick Ups/Deliveries}**.
- **Maps to:** `W-050` (access control); `W-055`; **NEW** — no contract covers putaway.

> Two separate permissions are implied: **assigning a location manually** appears open, while
> **overriding a system assignment** is gated. That is a precise and sensible distinction — the
> system's answer is protected, a blank is not.
>
> The unassignable case is handled the STORIS way (batch 2 F184, batch 5 F224): **alert the human,
> require manual action, carry on.** No queue, no exception file.
>
> **`Exclude Crossdock Transfers Linked to`** is the finding inside the finding. Crossdocking exists —
> goods received and immediately re-shipped without being put away — and it comes in **two flavours
> distinguished by what the transfer is linked to**: other transfers, or customer pickups and
> deliveries. Excluding them from putaway is exactly right, since crossdocked stock never lands.
> **Crossdock has not appeared anywhere in four runs.** New concept, undocumented model. Queued:
> `Directed Putaway Processing Overview`.
>
> Five origin types on one screen — locations, POs, receiving batches, transfers, transfer manifests
> — confirm that putaway is the common downstream of every inbound path.

### FINDING 228 — Over-receiving is permissioned, deferred, comment-audited, and mails the buyer

- **Invariant:** receiving more than was ordered is a governed exception with four consequences.
- **Evidence** — `Over Receipt of Merchandise`:
  > "**If you have permission to over-receive merchandise (via the Extended Security settings)**, you can enter a scheduled quantity greater than the ordered quantity."
  > "When you answer Yes to the "**Is this an Over Receipt?**" question, the **PO comments are updated** to reflect that the scheduled quantity has been changed. (**The actual over-receiving does not occur until the merchandise is received.**) The comments show the **date, time, user ID, product code, and the old and new scheduled quantity**."
  > "**If a buyer is indicated on the PO, a mail message is sent to the buyer** with the same comments regarding the changed scheduled quantity."
  > "If you enter a scheduled quantity greater than the ordered quantity, **the ordered quantity on the PO is NOT updated until the merchandise is actually received.** Once the items are received, the PO ordered quantity and comments are updated to show the over-receiving."
- **Maps to:** `W-005` (receiving) — **CONFIRMED**; `W-050`; `W-042` (propagation); `W-061` (cost).

> **STORIS rewrites the purchase order to match reality.** Receive twelve against an order for ten
> and the PO's *ordered* quantity becomes twelve — retroactively, at receipt. That is a significant
> semantic choice: the PO is treated as a record of what happened rather than a record of what was
> agreed. Anyone reconciling POs to vendor confirmations after the fact will not find the original
> ordered quantity anywhere except in the comment trail.
>
> **The comment is the audit trail** — date, time, user ID, product, old and new quantity — which is
> the same pattern as batch 2 F179's dropped-order comment. Twice now, **STORIS's audit record for a
> consequential event is free text on the document.** For the rebuild that should be a structured
> event, and we should expect the migration to have to parse comments to reconstruct history.
>
> **There is an internal mail system.** "a mail message is sent to the buyer" is the first sighting in
> four runs of ERP-internal messaging as a wiring mechanism. It means STORIS has a notification
> channel we have not inventoried, and F227's "the user is alerted" may use it too. **New mechanism;
> queued as a priority.**
>
> The two-phase behaviour — scheduled quantity now, ordered quantity at receipt — means an
> over-receipt is **visible but not yet real** in between. A report run in that window sees the old
> ordered quantity and the new scheduled quantity, which is exactly the sort of transient
> inconsistency that produces "the numbers don't tie" during a parallel run.

### FINDING 229 — Aisle locking is a real mutex: acquired by scanning, held against all other pickers, released by scanning elsewhere or leaving the menu

- **Invariant:** concurrency in the warehouse is controlled by exclusive locks on storage locations.
- **Evidence** — `Remove Locked Aisles (Radio Frequency)`:
  > "Once an RF scanner user scans a location on this list, the system sets the **Locked** field in the grid to **Y**… **Once locked, no other user can pick from this location until the user either scans a different storage location or exits from the picking menu option on the scanner.**"
  > "STORIS locks storage locations based on the **Storage Location Sort Sequence** setup on the **Bar Code tab of the Warehouse/Store Location Settings**."
  > "The system locks aisles **only if the Limit One Picker to an Aisle field is checked** in the Warehouse/Store Location Settings."
  > "This process is available only if the **RF Bar Code module** is active."
  > "This routine **may be affected by Regional Processing restrictions**."
- **Maps to:** `W-050` — **CONFIRMED**; F214 (RF only); **NEW** — no contract covers warehouse concurrency.

> This is a **lock manager implemented in an ERP**, and it has every property a lock manager has:
> acquisition (scan), scope (the aisle, per `Storage Location Sort Sequence`), exclusivity ("no other
> user can pick"), two release conditions (scan elsewhere, exit picking), an on/off switch
> (`Limit One Picker to an Aisle`), and — **crucially — a manual unlock routine, which exists because
> locks get stranded.**
>
> The whole reason this article exists is that a picker whose scanner dies, or who walks off, leaves
> an aisle locked and nobody else can pick from it. **The remedy is a supervisor screen.** That is
> worth stating plainly to the business, because it is a daily operational reality that no
> requirements document would ever mention.
>
> Note the physical premise: the constraint is not data integrity, it is **two people with pallet
> jacks in the same aisle**. The lock granularity comes from `Storage Location Sort Sequence`, which
> means **the aisle is defined by a sort order, not by a location attribute** — a subtle and
> slightly alarming coupling between how locations are ordered for picking and how they are grouped
> for locking. Change the sort sequence and you change what counts as an aisle.
>
> **The `Picking file`** is named as the source ("If un-picked items exist in the Picking file"). A
> new named data store, joining `ROUTE.EXCEPTION`, `DAILY.DETAIL` and the rest.

### FINDING 230 — The four warehouse stages are named, and they are schedulable with priority and a bypass

- **Invariant:** delivery preparation is a four-stage pipeline that can be short-circuited.
- **Evidence** — `Delivery/Transfer - Pick, Prep, Load`:
  > "Use this screen to add **picking, pick special, prep, or load** functions for the selected user(s) to the **default schedule**. The title of this screen reflects the function selected. For example, if you click the **Delivery Status PICK** button, the screen title is **Delivery Pick Entry**."
  Fields: `Route / Truck` · **`Days in Advance`** · `Starting Location` · `Ending Location` ·
  **`Drop-off Location`** · **`Priority`** · **`Bypass Interim`** · Add to Grid.
- **Maps to:** F215, F217 (`DPICK`/`DPREP`/`DSTAGE`); batch 2 F181.

> The pipeline is **pick → pick special → prep → load**, which lines up with the AWM exception codes
> `DPICK` and `DPREP` from batch 5 and gives them their stage meanings. `DSTAGE` still has no matching
> stage here, which suggests staging sits between prep and load and is simply not schedulable — or
> that inference I-34 is wrong. Recorded as still open.
>
> **`Bypass Interim`** is the interesting field: a documented way to **skip an intermediate stage**.
> Which stage, and under what circumstances, is not stated. It is the kind of switch that exists
> because the full pipeline is too slow for some orders — a fast path — and it is exactly the sort of
> thing that gets forgotten in a rebuild and then desperately re-added.
>
> **`Days in Advance`** confirms warehouse work is scheduled forward of the delivery date — the
> warehouse works ahead of the truck by a configurable lead time. **`Priority`** is the value that
> AWM's `Sort Priority` (batch 5 F216) orders the worker's list by.
>
> `Starting Location` / `Ending Location` define a **location range** for the task — the picker is
> given a sweep of the warehouse, not a list of products. That is pick-path optimisation, and it ties
> back to `Storage Location Sort Sequence` (F229).

### FINDING 231 — Picking consolidation exists as a maintained artefact

- **Invariant:** picks for multiple documents can be combined and the combination is maintained.
- **Evidence** — inventory: `Consolidate Picking Maintenance` (15201513095572),
  `Remove Items From Picking (Radio Frequency)` (15173670198676), `Remove Multiple Orders from
  Picking` (named as a related article on `Remove Locked Aisles`).
- **Maps to:** F229; batch 1 F176 (stop consolidation), run 03 F29 (date consolidation).

> **A third consolidation mechanism.** Run 03 F29 found delivery-date consolidation (seven eligibility
> rules); batch 1 F176 found stop consolidation (two-part key, one switch); this is pick
> consolidation. Three different things called consolidation, at three stages, with three keys.
>
> Recorded now on the strength of the article titles alone, with content deferred — this is an
> **inventory-level observation, not a documented finding**, and it is flagged as such. The three
> `Remove * from Picking` routines together imply the Picking file is a working set that accumulates
> and needs manual pruning, consistent with F229's stranded-lock problem.

### FINDING 232 — Crossdock transfers are a distinct inbound class, excluded from putaway

- **Invariant:** goods that never land are handled outside the putaway plan.
- **Evidence** — `Plan Directed Putaway Assignments`, Step 1:
  > "**Exclude Crossdock Transfers Linked to** — Other Transfers · Customer Pick Ups/Deliveries"
- **Maps to:** F227; `W-055`; **NEW**.

> Split out from F227 because it deserves its own line in the contract table. **Crossdocking appears
> nowhere in runs 01–03**, and it materially changes the inventory model: stock that is received and
> re-shipped without a storage location, linked either onward to another transfer or directly to a
> customer's pickup or delivery.
>
> The two link targets tell us the two crossdock patterns STORIS supports: **hub-and-spoke**
> (received, immediately transferred on) and **direct-to-customer** (received against a waiting
> order). The second is essentially the auto-transfer flow found in batch 4 F208, seen from the
> receiving dock.
>
> We have no article describing crossdock itself. Section H.

### FINDING 233 — Label and tag printing is a nine-routine subsystem with distinct label types

- **Invariant:** physical labels are typed, and each type has its own print routine.
- **Evidence** — Barcode subsection inventory: `Print a Bar Code Floor Tag` ·
  `Print an Inventory Floor Tag` · `Print a Transfer Floor Tag` · `Print a Single Product Label` ·
  `Print Multiple Product Labels` · `Print a Product Delivery Prep Label` ·
  `Print Existing Storage Location Labels` · `Print Return Labels from Manifest` ·
  `Float Label Print`.
- **Maps to:** batch 5 F223 (labels are the unit of scanning); the earlier standalone Printing handoff.

> At least **seven distinct label types**: bar code floor tag, inventory floor tag, transfer floor
> tag, product label, delivery prep label, storage location label, manifest return label — plus
> `Float Label Print`, whose name is undefined.
>
> This matters more than a printing detail, because **batch 5 F223 established that a scan is a label
> event.** The label taxonomy *is* the scanning taxonomy: what you can scan is what you have printed.
> A missing label type is a missing capability. Recorded from the inventory; content deferred to the
> tag-printing reading, and cross-referenced to the earlier standalone Printing handoff rather than
> duplicated.
>
> **`Print Return Labels from Manifest`** is the one that reaches back into batch 2 — customer returns
> collected on the truck are labelled from the manifest, which is how a `P` (Pickup Customer Return)
> transaction (batch 1 F168) becomes scannable stock.

### FINDING 234 — `EDI Trip Info` places EDI inside the warehouse module

- **Invariant:** trip-level EDI data is captured alongside barcode operations.
- **Evidence** — Barcode subsection inventory: `EDI Trip Info` (15173614112788).
- **Maps to:** batch 1 F172 (EDI 215, handling methods); batch 4 F206 (routing vendors).

> Recorded as an inventory observation. Batch 1 found handling methods constrained by the **EDI 215
> Motor Carrier Pick-Up Manifest**; a `Trip` is the carrier-side unit that a 215 describes. Its
> presence in the *Barcode* subsection rather than Fulfillments suggests trip data is captured at the
> dock, by scanner, rather than by the scheduler.
>
> **Third-party logistics therefore reaches into three subsections** — Fulfillments (handling methods,
> carrier field), Barcode (trip info), and the routing interfaces. The external-dependency inventory
> flagged in batch 4 §I should treat 3PL as a cross-cutting concern, not a feature.

### FINDING 235 — Physical inventory has dedicated processor and completion routines beyond the operator procedure

- **Invariant:** the count has back-end processing steps separate from the operator workflow.
- **Evidence** — inventory: `Physical Inventory Batch Completion` (15173655109396) ·
  `Physical Inventory Update Processor` (15173614998036) · `Prepare for Physical Inventory`
  (51286027717268) · `Create Listing of Storage Locations to Count` (15173670198164).
- **Maps to:** batch 5 F219–F222.

> Recorded as an inventory observation with content deferred. Two points are already usable.
>
> First, **`Physical Inventory Update Processor` is a separate routine from `Update Physical Inventory
> Results`** as named in batch 5's procedure. Either the operator procedure and the processor are two
> faces of one thing, or the seven-action update (batch 5 F220) is dispatched to a background
> processor. **Which one matters for cutover planning**, because it determines whether the count
> update is synchronous.
>
> Second, **`Prepare for Physical Inventory` carries a 2026-range article ID (`51286…`)** while its
> siblings are `15173…`. Applying the article-ID heuristic proposed in run 03's §I, this is a
> **recently added or rewritten article** — worth reading in preference to the older ones, since it
> may supersede parts of the procedure captured in batch 5.

### FINDING 236 — Regional Processing reaches the warehouse floor

- **Invariant:** location-based access control applies to RF operations, not only to office screens.
- **Evidence** — `Remove Locked Aisles (Radio Frequency)`:
  > "This routine **may be affected by Regional Processing restrictions**. That is, **you may not have access to all customers and locations**."
- **Maps to:** `W-050` — **CONFIRMED, upheld as inverted a fifth time**.

> The first appearance of Regional Processing in the Barcode subsection, and it is the strongest
> statement yet of run 01's inverted `W-050` judgment: the same location-scoping that gates
> accounting reports and sales inquiries also gates **a warehouse supervisor unlocking an aisle**.
>
> Note the wording is "customers **and** locations" on a screen that has nothing to do with
> customers — boilerplate, evidently, but boilerplate that is applied to RF routines. Batch 3
> observed that none of its eight routing articles mentioned Regional Processing; this shows the
> omission there was documentation inconsistency rather than a real boundary. **Corrects the
> inference batch 3 §E left open.**

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Plan Directed Putaway Assignments** *(tabs: STEP 1, STEP 2)* | Location · Date · **STEP 1:** Storage Location(s) · Purchase Order(s) · Receiving Batch(es) · Merchandise Transfer(s) · Transfer Manifest(s) · Exclude Crossdock Transfers Linked to {Other Transfers, Customer Pick Ups/Deliveries} · Grid · Refresh · **Reassign** · **Assign Putaway** · **STEP 2:** Grid · Actions *(active only when a plan exists for the date)* |
| **Delivery/Transfer - Pick, Prep, Load** | Route / Truck · Days in Advance · Starting Location · Ending Location · Drop-off Location · Priority · **Bypass Interim** · Add to Grid · Grid Information. *Screen title varies with the function selected (e.g. `Delivery Pick Entry`).* |
| **Remove Locked Aisles (Radio Frequency)** | Location · Grid Information *(with a **`Locked`** column, `Y` when held)* |
| **Over Receipt of Merchandise** | prompt `Is this an Over Receipt?` *(Yes/No)*; scheduled quantity entry; PO comments; buyer mail |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Limit One Picker to an Aisle** | Warehouse/Store Location Settings | Enables aisle locking (F229) |
| **Storage Location Sort Sequence** | Warehouse/Store Location Settings → **Bar Code tab** | Defines the lock granularity **and** the pick path (F229) |
| *(over-receive permission)* | **Extended Security settings** | Allows scheduled quantity > ordered quantity (F228) |
| *(putaway override permission)* | user security *(unnamed)* | Allows updating system-assigned putaway locations and quantities (F227) |

> **`Warehouse/Store Location Settings` now has a `Bar Code` tab**, alongside the fields already found
> in batches 1, 4 and 5 (`Restrict Scheduled Date`, `Include Fulfillments with Reserved Auto Transfers
> on Manifest`, `Select all Locations for Cycle Count`, `Limit One Picker to an Aisle`). It is the
> second-most-referenced unread record in the audit after Point of Sale Control Settings.

---

## E. Security permissions catalog (additions)

- **Extended Security settings** — over-receiving (F228). The term "Extended Security" now appears in
  two unrelated places (`Delete an Entire Manifest`, batch 4 F189; here). It is evidently a
  cross-module layer, not a logistics-specific one. **Revises batch 4's reading.**
- **Unnamed user security** gating putaway override (F227) — the *manual* assignment appears ungated;
  only overriding a **system** assignment is protected.
- **Regional Processing applies to RF routines** (F236).

---

## F. State machines and enumerations (additions)

- **Warehouse stages (4):** pick · pick special · prep · load — schedulable, with `Priority`,
  `Days in Advance`, a location range, and **`Bypass Interim`**.
- **Putaway origins (5):** storage locations · purchase orders · receiving batches · merchandise
  transfers · transfer manifests.
- **Crossdock link types (2):** other transfers · customer pickups/deliveries.
- **Label types (≥7):** bar code floor tag · inventory floor tag · transfer floor tag · product label
  · delivery prep label · storage location label · manifest return label *(+ `Float Label`)*.
- **Aisle lock state:** `Locked = Y` / blank; released by scanning elsewhere or exiting picking.
- **Named files:** **`Picking file`** *(new)*.
- **Over-receipt two-phase state:** scheduled quantity raised → *(PO ordered quantity unchanged)* →
  merchandise received → PO ordered quantity and comments updated.

---

## G. Sequencing rules

1. Receive → **directed putaway plan** *(Assign Putaway)* → review/override destinations → manual
   putaway or **AWM RF Putaway**. Unassignable products alert the user for manual assignment (F227).
2. **Crossdock transfers are excluded** from step 1 by an explicit filter (F232).
3. Over-receipt: permission → answer `Yes` → **scheduled** quantity raised, PO comment written, buyer
   mailed → **at actual receipt**, PO **ordered** quantity updated (F228).
4. Scheduled warehouse work: `Days in Advance` before the delivery date, ordered by `Priority`,
   scoped by a location range, optionally with `Bypass Interim` (F230).
5. Picking: scan a location → **aisle locked** → other pickers excluded → released by scanning
   elsewhere or exiting the picking menu → **stranded locks cleared by a supervisor** (F229).

---

## H. Open questions and gaps

### Gated or unreachable — priority order

1. **`Warehouse/Store Location Settings`** — now referenced from four batches with at least five
   fields and a `Bar Code` tab. **Promoted to joint-highest priority** with `Alert Code Settings`.
2. **`Alert Code Settings`** (batch 4 F213) and **`Assign Specific Pieces At` values** (batch 3 F190).
3. `Directed Putaway Processing Overview` — the model behind F227 and the only likely source on
   **crossdock**.
4. **The internal mail system** (F228) — no article found; mechanism entirely unknown.
5. `Consolidate Picking Maintenance` · `Remove Multiple Orders from Picking` ·
   `Remove Items From Picking (RF)` · `Process Type` · `EDI Trip Info` · `Float Label Print` ·
   `Quantity and Serial Number Review Screen` · `Physical Inventory Update Processor` ·
   `Prepare for Physical Inventory` — named, unread.

### Documented but ambiguous

- **`Bypass Interim`** — which stage is bypassed, and when is it legitimate? (F230).
- **`Drop-off Location`** on the stage-scheduling screen — a staging destination? Unexplained.
- **How an "aisle" is derived** from `Storage Location Sort Sequence` (F229).
- **What clears a stranded lock besides the supervisor screen** — does it time out? Nothing says.
- **Whether `Physical Inventory Update Processor` is the same thing** as `Update Physical Inventory
  Results` (F235). Consequential: synchronous or background?
- **`Float Label`** — undefined term, joining `fly-by fulfillment` and `Staging Area`.
- **Crossdock** — a whole inbound pattern with no descriptive article found.

### Inferences (recorded as inference, not fact)

- **I-35:** `Bypass Interim` probably skips the prep or staging stage for goods going straight from
  pick to load. *Purely from the pipeline shape; the article says nothing.*
- **I-36:** The buyer mail in F228 probably uses the same internal channel as F227's "the user is
  alerted". *No article connects them, and "alerted" may simply mean an on-screen message.*
- **I-37:** `DSTAGE` (batch 5) probably sits between prep and load, since it is not among the four
  schedulable stages. *This weakens rather than confirms inference I-34.*

### Corrections to the audit's own prior record

- **Batch 3 §E** noted that none of its eight routing articles mentioned Regional Processing and left
  it as an open observation. F236 shows Regional Processing does reach RF and warehouse routines, so
  **the batch 3 absence was a documentation inconsistency, not a boundary.** Corrected.
- **Batch 4 §E** treated "extended security settings" as a structure within *Logistics* Security.
  F228 shows **Extended Security is cross-module.** Corrected.

---

## I. Unknown unknowns

- **An internal messaging system** (F228). Four runs, and the first sighting is one clause about
  mailing a buyer. Notifications are a whole category of wiring — who gets told what, when — and we
  have no map of it. **Promoted to a run-level open question.**
- **Crossdocking** (F232). An inbound pattern that bypasses the storage model entirely, surfaced only
  as a filter checkbox. If crossdock exists, the assumption that all receipts land somewhere is
  wrong, and that assumption is load-bearing in any inventory design.
- **Physical-world concurrency control** (F229). We would never have designed an aisle lock. It exists
  because warehouses are physical, and its failure mode — the stranded lock — needs an admin screen.
  There may be other physical-world constraints modelled in this ERP that no data model would
  suggest.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Directed putaway** | System-computed destination locations for received goods, overridable with security |
| **Crossdock transfer** | Received goods re-shipped without being put away; linked to another transfer or to a customer delivery |
| **Over receipt** | Receiving more than ordered; rewrites the PO's ordered quantity at receipt |
| **Aisle lock** | Exclusive hold on a storage location taken by scanning it |
| **`Limit One Picker to an Aisle`** | The switch that enables aisle locking |
| **Storage Location Sort Sequence** | Defines both the pick path and the lock granularity |
| **Pick / pick special / prep / load** | The four schedulable warehouse stages |
| **`Bypass Interim`** | Documented short-circuit of a stage; scope undefined |
| **Picking file** | The working set of un-picked items |
| **Float Label** | Undefined label type |

---

## Contract adjudication — batch 6

| Contract | Verdict | Basis |
|---|---|---|
| **W-005** *(receiving)* | **CONFIRMED and extended** | Over-receipt rewrites the PO's ordered quantity (F228) |
| **W-042** *(cross-document propagation)* | **CONFIRMED — and here it *does* propagate** | The receipt updates the PO itself (F228), unlike the advisory-only cases in run 02 and batch 2 |
| **W-050** *(access control)* | **CONFIRMED — inverted, fifth upholding** | Regional Processing reaches RF routines (F236); Extended Security is cross-module (F228) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED** | Putaway destinations computed; crossdock excluded (F227, F232) |
| **W-061** *(cost)* | **relevant** | Over-receipt changes received quantity against PO cost |
| **W-039** *(exceptions)* | **consistent** | Unassignable putaway alerts a human rather than queueing (F227) |
| **Directed putaway** | **NEW — no contract covers it** | F227 |
| **Crossdocking** | **NEW** | F232 |
| **Warehouse concurrency control** | **NEW** | F229 |
| **Internal messaging** | **NEW — mechanism unknown** | F228 |

---

## Next — batch 7

Close out `Barcode` (RF receiving and picking family, `Bar Code Batch Maintenance`,
`Barcode Storage Location Selection`, `As-Is Kit Selection`, `Process Type`, the tag-printing
family) with a coverage statement in the run 03 batch 16 style, then open **Transfers** (22).
