# Run 04 — Inventory Management — Batch 7: RF picking, floats, and the Barcode coverage sweep

Status: complete. Findings 237–248. Read-only throughout. **No scan performed, no piece damaged, no
float moved, no picking updated.** `RF Picking for Deliveries` is a step-by-step operating procedure
for a destructive process; it was read as documentation only.

This batch closes the **Barcode** subsection (84 articles).

---

## A. Coverage log

### Read this batch

| # | Article | id | Status |
|---|---|---|---|
| 1 | **RF Picking for Deliveries** | 15173667864852 | read — **the most operationally detailed article in the corpus** |
| 2 | Review Float Status | 15173694542868 | read — defines the Float feature |

### Barcode subsection — all 84 articles inventoried, disposition stated

| Family | Count | Disposition |
|---|---|---|
| **AWM** — Function Settings, Exception Type Settings, `Create an AWM Schedule`, `Create a Default AWM Schedule`, `View AWM Activity`, and the **nine `AWM Schedule - *` task screens** | 14 | Batch 5 read the two settings records and one schedule screen; the eight sibling schedule screens are **template instances** and are excluded, with the task-type enumeration captured (batch 5 §F). |
| **Batch Bar Code** — Overview, Receiving, Full Physical, Batch Maintenance, Physical Batch Creation/Maintenance, PO Line Entry, `Assign Purchase Orders to a Bar Code Receiving Batch`, `Barcode Download/Upload Status Screen`, `Upload/Download Batch Bar Code Scanner`, `Batch Bar Code Scanning Devices`, `Barcode Storage Location Selection`, `Update Bar Code Cycle Count Results`, `Create a Batch Bar Code Manifest Verification` | 15 | Batch 5 read the two full procedures (receiving, full physical) plus batch creation and pick review. The remainder are **sub-screens named inside those procedures** and are excluded — their fields appear in batch 5 §C as steps of the procedures that call them. |
| **RF Bar Code** — `RF Picking for Deliveries`, `RF Picking for Customer Pickups`, `RF Picking for Warehouse Transfers`, `RF Pick Special Deliveries`, `RF Bar Code PO Receiving`, `RF Bar Code Transfer Receiving`, `RF Bar Code Full Physical`, `RF Physical Inventory Cycle Count`, `RF Bin to Bin Transfers`, `RF Bin Lookup`, `RF Function Assignments`, `RF Scheduled Users`, `RF Remove from Picking Detail`, `RF Inventory In Transit Detail`, `View Radio Frequency Inventory In-Transit`, `Update/Review Radio Frequency Picking`, `Review Radio Frequency Preparation`, `Initialize Radio Frequency Transfer Receiving`, `Remove Items From Picking (RF)`, `Remove Locked Aisles (RF)`, `Special Delivery Picking Entry` | 21 | **`RF Picking for Deliveries` read in full** as the representative procedure; `Remove Locked Aisles` read in batch 6. The three sibling picking procedures (customer pickups, warehouse transfers, special deliveries) follow the same scanner flow with a different `Pick Type` — the **Pick Types menu enumeration** is captured in §F instead. Receiving and physical-count RF procedures mirror their Batch equivalents read in batch 5. |
| **Putaway** — `Plan Directed Putaway Assignments`, `Reassign Putaway Locations`, `Putaway Assignment Report`, `Directed Putaway Processing Overview` | 4 | Batch 6 read the plan screen; the overview remains **unread and is a named gap** (batch 6 §H). |
| **Printing / labels** — nine `Print *` routines, `Float Label Print`, `Price Change List`, `Tag Printing` | 12 | Excluded here: the label taxonomy is captured in batch 6 F233, and the printing machinery was dissected in full in the **earlier standalone Printing handoff** (28 articles: output settings/PRV, forms designer, print queue, delivery-fulfillment documents, count sheets). Cross-referenced rather than duplicated. |
| **Physical inventory processors** — `Prepare for Physical Inventory`, `Physical Inventory Batch Completion`, `Physical Inventory Update Processor`, `Create Listing of Storage Locations to Count`, `Assign a User to Physical or Cycle Count Locations` | 5 | Batch 5 read the operator procedure that drives all of them. `Physical Inventory Update Processor` and `Prepare for Physical Inventory` remain **named open questions** (batch 6 F235). |
| **Picking management** — `Consolidate Picking Maintenance`, `Remove Multiple Orders from Picking`, `Update Radio Frequency Picking` | 3 | Batch 6 F231 recorded the consolidation observation; content deferred. |
| **Other** — `As-Is Kit Selection`, `Over Receipt of Merchandise`, `Quantity and Serial Number Review Screen`, `Process Type`, `EDI Trip Info`, `Trip Info Error Messages`, `Review Float Status`, `Float Label Print`, `Select Multiple Transfer Manifests`, `Delivery/Transfer - Pick, Prep, Load` | 10 | Over-receipt and Pick/Prep/Load read in batch 6; Float Status read here. `Process Type`, `EDI Trip Info` and `As-Is Kit Selection` remain named gaps. |

**Barcode: 84/84 inventoried.** Ten read in full across batches 5–7; the remaining 74 are classified
above with a stated reason. **No article skipped silently.**

---

## B. Wiring findings

### FINDING 237 — Exactly two routines submit merchandise to picking, and the docs say so

- **Invariant:** picking is entered through one of two named doors, and no other.
- **Evidence** — `RF Picking for Deliveries`:
  > "print the delivery tickets using either the **Print a Delivery/Pick-Up/Transfer Tickets (Radio Frequency)** routine or the **Print Ticket check box on the Fulfillment page of Enter a Sales Order**. **You must print the delivery tickets using one of these methods. They are the only two print delivery ticket routines that submit the items to picking.**"
  > "It is **recommended that you print the tickets from within Enter a Sales Order** so that you have the option to **change the scheduled date to match the day the merchandise is actually being picked**. You also have the ability to **add deposits to the order** when you use this method."
- **Maps to:** run 03 F8 (order completion); batch 1 F168 (`P` = on pick list, `D` = ticket printed);
  batch 6 F229.

> **Printing a ticket is what starts the physical process.** Not scheduling, not manifesting —
> printing. That explains why batch 1 F168 gives the delivery ticket its own grid column with a
> *reprint required* state: the ticket is a control document, and its print status is workflow state.
>
> The warning is unusually explicit — *"the only two"* — which tells us people try other print
> routines and then wonder why nothing reaches the scanner. **A silent no-op is the failure mode.**
>
> The recommendation is revealing about how the business actually runs: print from order entry so you
> can **change the scheduled date to the day you are really picking**. That is the sales floor
> adjusting logistics dates as a side effect of printing, and it means the delivery date on an order
> can move at pick time by a salesperson. Given batch 1 F166 — the delivery charge recalculates on a
> fulfillment date change — **this can silently reprice the order**.

### FINDING 238 — Reservation can be deferred to the pick list, and the FINAL print is what reserves

- **Invariant:** one configuration makes the pick list, not order entry, the reservation event.
- **Evidence** — `RF Picking for Deliveries`:
  > "If you have your system set to **reserve merchandise by Pick List**, use the **Print Pick List** routine to generate a **FINAL** pick list and **reserve merchandise to the order**."
- **Maps to:** `W-055` / `W-056` — **CONFIRMED and materially extended**; batch 3 F190
  (`Assign Specific Pieces At`).

> This is a second, independent axis of the same question batch 3 F190 raised. `Assign Specific
> Pieces At` decides **when a reservation becomes specific pieces**; this setting decides **when a
> sale becomes a reservation at all**. A site can defer reservation from order entry all the way to
> the printing of a final pick list.
>
> That is a very different business. In one configuration, selling reserves stock and the warehouse
> works a reserved list; in the other, **selling reserves nothing** and the first commitment happens
> when a pick list prints. Every availability number, every jeopardy report, every promise to a
> customer means something different between the two.
>
> The word **FINAL** is doing work — it implies a non-final (draft) pick list that does *not* reserve.
> `Print Pick List` is named and unread. **This is now a priority gap**, alongside the
> `Assign Specific Pieces At` value list.

### FINDING 239 — The scanner has a command vocabulary of at least nine special entries typed into scan prompts

- **Invariant:** picker exception handling is expressed as codes typed where a barcode is expected.
- **Evidence** — `RF Picking for Deliveries`, verbatim:

| Entry | Prompt | Effect |
|---|---|---|
| **`NIL`** | Scan Locn | *"the piece is not found in the expected location. **The system searches the warehouse for a replacement piece.** If found, you are prompted to scan the new piece or the new piece is placed at the end of the pick list… **If not found, the piece is placed in RESEARCH.**"* |
| **`DG`** | Scan Prod | *"the piece is damaged. The system **changes the status of the piece to As-Is**. The system searches the warehouse for a replacement…"* — same branch as `NIL` |
| **`SKIP`** *(or a Skip label)* | Scan Prod | *"The skipped piece is placed at the end of the picking list and you are prompted to scan it once you have finished"* |
| **`AS`** | Scan Locn | *"**To reverse the aisle sequence**… start at the end of the picking assignment rather than the beginning and change the aisle sequence any time during the picking process"* |
| **`PS`** | Scan Locn | *"manually reverse the picking sequence… Picking continues in the reverse direction until manually reversed or the end of the current aisle is reached and **Alternating Pick Sequence** is active"* |
| **`SP`** | Scan Locn | *"the picker is directed to the storage locations containing **skipped picks**"* |
| **`X`** | Scan Prod | *"**RF Shuffle** — transfers the user to the **Bin to Bin Transfer** screen so that you can access merchandise for picking **that was being blocked by other pieces** and move the interfering pieces to another bin **without having to exit the picking process**"* |
| **`0` / `E`** | various | finish / change drop location |

- **Maps to:** batch 5 F218 (pick review's As-Is/NIL); batch 6 F229 (aisle locks); `W-039`.

> **This is the real user interface of the warehouse**, and none of it would survive a rebuild that
> designed the picking app from the data model. Each code is a physical contingency: the thing isn't
> there, the thing is broken, I'll come back to it, I want to walk the aisle the other way, something
> is in front of it.
>
> **`X` (RF Shuffle) is the standout.** A picker blocked by other stock can do a bin-to-bin transfer
> *inline* and return to the pick. That is an inventory movement transaction initiated mid-pick to
> resolve a physical obstruction — and it means **bin-to-bin transfers occur constantly as a
> side-effect of picking**, not as a planned activity.
>
> `NIL` and `DG` share one branch, which confirms and extends batch 5 F218: **the warehouse-wide
> replacement search is automatic**, and its outcome depends on where the replacement is — either you
> are sent to it now, or it is appended to your pick list. Failing that, `RESEARCH`.
>
> **`AS` and `PS` let the picker rewrite their own route.** With `Alternating Pick Sequence` active
> the system boustrophedons through the aisles. This is genuine warehouse-optimisation logic, and
> `Alternating Pick Sequence` is a setting we have not seen elsewhere.

### FINDING 240 — Floats are physical carts with scannable tags, and pieces are linked to them

- **Invariant:** a float is an addressable container that merchandise is associated with in transit.
- **Evidence** — `Review Float Status`:
  > "If you use the **Float feature**, you use this routine to view **all products currently linked to a float** at the selected location. You can use this screen to **remove the association of specific pieces from the selected float**."
  And in `RF Picking for Deliveries`: *"If floats are active at this location, the scanner displays
  Delivery Picking RFQ2 and prompts **Float: Scan the float tag**"*; the float is *"the float that is
  currently **in transit**"*; unloading prompts **`Unload Float`** per product; `Float Label Print`
  and `Float Count` appear throughout.
- **Maps to:** batch 3 F190 (the truck as a storage location); **NEW** — no contract covers containers.

> **A third kind of location-like object**, after storage locations and trucks: a *moving container*
> with its own tag, its own count, and an explicit link table to pieces. The picker fills a float,
> the float moves between areas, the float is unloaded piece by piece at the destination.
>
> Crucially, **`Review Float Status` exists to break the association** — *"remove pieces from the
> float (pieces you do not physically have, for example)"*. So float contents drift from reality and
> there is a screen to reconcile it. Same shape as the stranded aisle lock (batch 6 F229): **a
> physical-world mechanism plus an admin screen for when the physical world disagrees.**
>
> Floats are optional per location, and they make one pipeline step **mandatory**: *"This step is
> mandatory if using float processing and the RF PICKING - Drop off Customer Deliveries to Interim
> setting is active."* Two optional features that, combined, force a third.

### FINDING 241 — The warehouse pipeline is five stages with a configurable interim, and each hop is a scan

- **Invariant:** merchandise moves Pick → (Interim) → Prep → Stage → Load, each hop scanned into a named location.
- **Evidence** — `RF Picking for Deliveries`, step list:
  > "Print Delivery Ticket, Review RF Picking (optional), **Scan Delivery Merchandise**, **Move From Interim**, Review Screens (optional), Update RF Picking (optional), **Damage a Piece in Prep** (optional), **Move to Staging**, **Move to Load**"
  Example locations, verbatim: **`DOCK`** · **`DPREP`** (delivery prep) · **`DLVINT`** (delivery
  interim) · **`DOOR1`**, **`STAGE1`** (staging) · load location.
  > "If the … **RF PICKING - Drop off Customer Deliveries to Prep** field is **not** checked, items are dropped off **directly to a Stage location rather than a Prep location**."
- **Maps to:** batch 6 F230 (four schedulable stages); batch 5 F217 (`DPICK`/`DPREP`/`DSTAGE`).

> This resolves batch 6's open question about `DSTAGE` and **confirms inference I-34 while correcting
> I-37**: staging *is* a stage, it simply is not one of the four *schedulable* functions. The
> physical pipeline has five steps; the labour scheduler exposes four.
>
> **Interim is a configurable extra hop** between picking and prep, and it exists for float
> processing — you drop the whole float at interim, then move floats to prep as a separate task. So
> the pipeline length is site-specific: **three hops, four, or five**, depending on two settings.
>
> The location codes are conventions, not constants (`DPREP`, `DLVINT`, `DOOR1` are given as
> examples) — but they show the shape: **each stage is a physical area addressed by a scannable
> location label**, so the whole pipeline is expressed in the storage-location table. That again
> raises the priority of the unread location model (batch 5 §I).

### FINDING 242 — Damaging a piece in prep assigns a distinct reason code and re-commits the replacement to the order

- **Invariant:** damage found after picking has its own code and its own automatic recovery.
- **Evidence** — `RF Picking for Deliveries`, *Damage a Piece in Prep*:
  > "At the **Piece Damaged? (Y/N):** prompt, enter Y… **The piece is assigned a reason code of PFD (Pick Found Damaged). The system attempts to replace the piece with another piece in inventory. If a replacement is found, the piece is re-committed to the order and placed back in picking. If the piece was not replaced, it is placed in RESEARCH.**"
- **Maps to:** batch 5 F218; F239; `W-061` (cost); `W-055`.

> **`PFD` (Pick Found Damaged)** is a named As-Is reason code — the third reason-code family in the
> run, after manifest-removal reasons (batch 2 F178) and the physical-inventory code (batch 5 F220).
>
> The recovery is stronger than at pick time: the replacement is **"re-committed to the order and
> placed back in picking"** — the order goes *backwards* one stage automatically. So the pipeline is
> not one-directional; damage discovered at prep pushes the line back to pick.
>
> Combined with F239's `NIL`/`DG` branch and batch 5 F218's pick-review branch, **there are now three
> separate entry points to the same warehouse-wide replacement search**, at three stages. The search
> itself is never described. **What it searches, in what order, and whether it respects reservations
> held by other orders, is undocumented** — and given batch 5 F220 (a physical count reassigns
> reservations), it is entirely plausible that it takes stock from another order. Section H, and it
> is a serious question.

### FINDING 243 — Where pieces are dropped, and whether they must be re-scanned, is governed by four settings on one tab

- **Invariant:** the drop-off behaviour of every pick is configured, not fixed.
- **Evidence** — `RF Picking for Deliveries`, all on the **Barcode tab of `Warehouse/Store Location Settings`**:
  - `RF PICKING - Drop off Customer Deliveries to Interim` — routes drops to the interim area
  - `RF PICKING - Drop off Customer Deliveries to Prep` — when unchecked, *"items are dropped off directly to a Stage location rather than a Prep location"*
  - `RF PICKING - Drop off All into Prep` / `RF PICKING - Drop off All into Staging` — *"all items in picking are dropped in Prep/Stage **at once; labels do not need to be re-scanned**. If the field is not checked, the items need to be scanned into the Prep/Stage location."*
  - `PREP LABELS - Automatically Print for Customer Deliveries`
- **Maps to:** F241; batch 6 F229.

> Four settings on one tab that between them determine **how many times a piece is scanned between
> the rack and the truck** — which is the single biggest driver of warehouse labour cost in this
> whole module. `Drop off All into Prep` trades traceability for speed: one bulk drop instead of a
> scan per piece.
>
> **`Warehouse/Store Location Settings` is now referenced from five of seven batches** with at least
> ten named fields across three tabs (`Bar Code`, plus the scheduling and manifest fields from
> batches 1, 4 and 5). It is the most consequential unread record in run 04 and arguably in the audit.

### FINDING 244 — Pick assignment has two modes, and one hands out orders by reverse stop time

- **Invariant:** who picks which order is either chosen or dispatched, with a documented ordering rule.
- **Evidence** — `RF Picking for Deliveries`:
  > "If the location is set to **Pick Deliveries by Order**, the scanner prompts for Order Number: Enter **any order that has picking on that route and date and is not being picked by another user**. Only a single order number can be entered. Alternately, you can **press the Return key to assign the next available order**. **The next available order is determined by reverse stop time** if one was entered; otherwise it is assigned in the same manner as when an RF user requests the next customer pickup order."
- **Maps to:** batch 6 F229 (concurrency); batch 1 F168 (stop times organise the manifest).

> **Reverse stop time** is a genuinely clever dispatch rule and it is worth understanding before we
> replace it: the *last* stop is picked *first*, because it is loaded onto the truck first and comes
> off last. **The pick order is the reverse of the delivery order because a truck is a stack.**
>
> That is a physical-world constraint expressed as a sort, and it is exactly the kind of thing a
> rebuild silently drops — producing a truck that has to be unloaded and reloaded at every stop.
>
> Note the concurrency guard again: *"not being picked by another user"* — order-level exclusivity on
> top of batch 6 F229's aisle-level locking. **Two levels of locking in the warehouse**, and only the
> aisle one has an admin unlock screen.

### FINDING 245 — AWM users are directed to a specific drop location; non-AWM users may choose

- **Invariant:** the AWM schedule constrains where a picker may put things down.
- **Evidence** — `RF Picking for Deliveries`:
  > "**For non-AWM users, scan any valid storage location. For AWM users, the scanner displays the assigned drop location and you must scan that location.** … When in the drop-off mode, the scanner defaults the assigned drop-off location and the RFuser **must** drop off the products into the specified drop location **from their AWM schedule**."
  > "For non-AWM, there is one list; you can change the drop location by scanning a different storage location label"
- **Maps to:** batch 5 F215 (AWM drives the device); F241.

> A precise statement of what AWM actually changes: **it converts a choice into an instruction.**
> Non-AWM picking is a capable worker using judgement; AWM picking is a directed task. Same physical
> work, entirely different system role.
>
> For the rebuild this is the decision point: are warehouse staff *operators* or *executors*? STORIS
> supports both, as a licensing and configuration choice, and the business will have an opinion it
> has probably never had to articulate.

### FINDING 246 — A locked aisle produces a specific scanner message and a documented supervisor remedy

- **Invariant:** the picker is told when concurrency blocks them, and the block is human-resolvable.
- **Evidence** — `RF Picking for Deliveries`:
  > "If the system **skips a piece due to a locked aisle**, the scanner displays the message "**No aisle free**". **Provided another user is not currently picking an order in that aisle**, you can use the **Remove Locked Aisles (Radio Frequency)** routine to unlock the aisle."
- **Maps to:** batch 6 F229 — **CONFIRMED from the picker's side**.

> Batch 6 inferred the stranded-lock problem from the existence of an unlock routine; here is the
> other half, in the picker's own words. **The system skips the piece rather than blocking the
> picker** — good design: the pick continues, the contested piece is deferred.
>
> The caveat *"provided another user is not currently picking an order in that aisle"* is the
> supervisor's whole job on that screen: distinguish a live lock from a dead one, with no help from
> the system in telling them apart.

### FINDING 247 — Picking options after a skip are a documented three-way resume

- **Invariant:** a picker with skipped pieces chooses how to re-enter the pick.
- **Evidence** — `RF Picking for Deliveries`, *Picking Options*:
  > "**Pick Skipped Pcs** - directs picker to the first storage location containing a skipped pick.
  > **Restart Picking** - directs picker to the first storage location containing a piece to be picked, **whether skipped or added**.
  > **Continue Picking** - directs picker to the next storage location after the last one picked."
- **Maps to:** F239 (`SKIP`, `SP`).

> Small, and worth copying verbatim. Note **"whether skipped or added"** — the pick list grows during
> picking, because replacement pieces found by the `NIL`/`DG` search are appended (F239). A pick is
> not a fixed list; it is a working queue that mutates as the picker discovers reality.
>
> That single clause invalidates the obvious implementation — a pick list as an immutable snapshot —
> and it is the kind of detail only a step-by-step operating procedure ever records.

### FINDING 248 — Three monitoring screens exist for pieces in flight, one per failure class

- **Invariant:** in-flight warehouse state is observable from STORIS, split by concern.
- **Evidence** — `RF Picking for Deliveries`, *Review Screens*:
  > "To see the **current picking status** of the items on the order(s), select **Review Radio Frequency Picking (Update Radio Frequency Picking)**.
  > To view detailed information for items that are **in Prep**, select the **Review Radio Frequency Preparation** routine.
  > To monitor pieces that were **damaged or missing** during the RF picking process, access the **Review Radio Frequency Picking Error** routine.
  > Use the **Review Float Status** routine … to view products linked to a float and to remove pieces from the float"
- **Maps to:** F240, F242; `W-039`.

> Four inquiries, cleanly separated by concern: **in picking · in prep · errored · on a float.**
> `Review Radio Frequency Picking Error` is a screen we have not otherwise seen and it is the
> warehouse's exception monitor — the RF-side counterpart of `ROUTE.EXCEPTION` (batch 2 F180).
>
> Note that `Review Radio Frequency Picking` and `Update Radio Frequency Picking` are given as **the
> same routine under two names** — one more terminology drift, and one that matters because the
> "Review" name suggests read-only while the routine can change a piece to As-Is or NIL (batch 5
> F218).

---

## C. Screen and field inventory (additions)

| Screen | Elements verbatim |
|---|---|
| **Review Float Status** | Location · Float · Grid Information *(products linked to the float; association removable)* |
| **Scanner — Picking** | Main Menu → `#2 Picking` → `#1 Pick Types` → `#2 Deliveries` · Date · `Truck/Route or <enter> For Any` *(with mapping: `88-TRK1` form)* · Order Number *(if Pick Deliveries by Order)* · Float · Scan Locn · Scan Prod · Scan Label Id |
| **Scanner — display fields** | Location · Product · Description · Route · Serial Number *(if needed)* · Quantity · Float Count · `** NN To Do **` |
| **Scanner — Delivery Prep menu** | `#3 Delivery Prep` → `#3 Prep Lookup` · `Change Status? (Y/N)` · `Piece Damaged? (Y/N)` · `#2 Prep Label Print`; `#5 Delivery Prep` → `#1 Move to Staging` |
| **Scanner — Load menu** | `#4 Load Menu` → `#1 Load Merchandise` · Route/Truck · Delivery Date *(no slashes)* · From Location · To Location · Scan Label Id |
| **Update / Review Radio Frequency Picking** | Location · Date Code · Scheduled Date · **Phase** *(All)* · **Type** *(Deliveries)* · grid → double-click → Bar Code Pick Review; right-click → **More Details** *(read-only order)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **RF PICKING - Drop off Customer Deliveries to Interim** | Warehouse/Store Location Settings → **Barcode tab** | Adds the interim hop; makes *Move From Interim* mandatory with floats (F241) |
| **RF PICKING - Drop off Customer Deliveries to Prep** | same | Unchecked → drops go **straight to Stage** (F243) |
| **RF PICKING - Drop off All into Prep** / **into Staging** | same | Bulk drop without per-piece re-scan (F243) |
| **PREP LABELS - Automatically Print for Customer Deliveries** | same | Auto-prints prep labels (F241) |
| **Pick Deliveries by Order** | location-level | Order-at-a-time picking; else next-available by **reverse stop time** (F244) |
| **Alternating Pick Sequence** | *(record unnamed)* | Reverses direction at the end of an aisle (F239) |
| *(reserve merchandise by Pick List)* | *(record unnamed)* | **Moves the reservation event to the FINAL pick list print** (F238) |
| **Float feature** | per location | Enables float tags and float-based movement (F240) |

---

## E. Security permissions catalog (additions)

No new permission names. Two concurrency controls act as de-facto access control:
**order-level exclusivity** (*"not being picked by another user"*, F244) and **aisle-level locking**
(batch 6 F229). Neither is a permission; both restrict who can act on what, at a given moment.
Recorded alongside batch 2 F177 (manifest membership as a state lock) as the **state-based access
family** flagged in batch 2 §I.

---

## F. State machines and enumerations (additions)

- **Warehouse pipeline (5 stages):** Pick → *(Interim)* → Prep → Stage → Load.
- **Pick Types menu:** Deliveries · Customer Pickups · Warehouse Transfers · Special Deliveries.
- **Scanner command vocabulary (9):** `NIL` · `DG` · `SKIP` · `AS` · `PS` · `SP` · `X` *(RF Shuffle)* ·
  `0` · `E`.
- **Picking Options (3):** Pick Skipped Pcs · Restart Picking · Continue Picking.
- **As-Is reason codes named to date:** `PFD` *(Pick Found Damaged)* · a site-created physical-inventory
  code *(e.g. `PHY`)*.
- **Example location codes:** `DOCK` · `DPREP` · `DLVINT` · `DOOR1` · `STAGE1` · `RESEARCH`.
- **Replacement-search outcomes (3):** scan the new piece now · new piece appended to the pick list ·
  **`RESEARCH`**.
- **Container objects:** **Float** *(tagged, countable, unloadable, association removable)*.
- **Pick dispatch orders (2):** by order number · **next available by reverse stop time**.

---

## G. Sequencing rules

1. **Print a delivery ticket** via one of exactly two routines → items enter picking (F237).
2. *(Optional configuration)* **FINAL pick list print reserves merchandise** (F238).
3. Scan location → scan product, with nine escape codes available; `NIL`/`DG` trigger a
   warehouse-wide replacement search whose failure ends in `RESEARCH` (F239).
4. Aisle locked → piece skipped, `"No aisle free"` shown; supervisor may unlock (F246).
5. Drop off → interim / prep / stage per four settings; AWM users **must** use the assigned drop
   location (F243, F245).
6. *(Floats + interim)* **Move From Interim is mandatory** (F240, F241).
7. Damage in prep → reason code `PFD` → replacement **re-committed and pushed back into picking**;
   else `RESEARCH` (F242).
8. Move to Staging → Move to Load *(From Location → To Location)*.

---

## H. Open questions and gaps

### Gated or unreachable — priority order for the rest of run 04

1. **`Warehouse/Store Location Settings`** — ten-plus named fields across three tabs, five batches.
   **Highest priority.**
2. **`Print Pick List`** — the FINAL/draft distinction and the reservation event (F238). **New,
   high.**
3. **`Alert Code Settings`** (batch 4) and **`Assign Specific Pieces At` values** (batch 3).
4. `Directed Putaway Processing Overview` · `Review Radio Frequency Picking Error` ·
   `Print a Delivery/Pick-Up/Transfer Tickets (Radio Frequency)` · `Process Type` · `EDI Trip Info` ·
   `As-Is Kit Selection` · `Physical Inventory Update Processor` · `Prepare for Physical Inventory`.
5. **The storage location model** — `Tracked Storage Location Settings` and whatever defines
   `RESEARCH`, aisles, and the stage areas.

### Documented but ambiguous

- **The warehouse-wide replacement search** (F239, F242, batch 5 F218) — three entry points, no
  description. **Does it take stock reserved to another order?** Given batch 5 F220, plausible.
  **This is the most consequential undocumented behaviour found in run 04.**
- **`Alternating Pick Sequence`** — named in a subordinate clause; its settings record is not given.
- **Whether a draft (non-FINAL) pick list exists**, and what it does if reservation is deferred (F238).
- **`Review Radio Frequency Picking` vs `Update Radio Frequency Picking`** — one routine, two names,
  one of which misdescribes it (F248).
- **`Process Type`, `EDI Trip Info`, `Float Label Print`, `As-Is Kit Selection`** — named, unread.
- **How a float is created**, and whether float tags are pre-printed stock or generated.

### Inferences (recorded as inference, not fact)

- **I-38:** The `NIL`/`DG` replacement search probably only considers unreserved stock, since taking
  another order's reservation would be visible elsewhere. *Nothing states this, and batch 5 F220
  shows STORIS is willing to reassign reservations.*
- **I-39:** A float is probably a cart or dolly. *The documentation never says what one physically is.*
- **I-40:** `Review Radio Frequency Picking Error` is probably the RF counterpart of
  `ROUTE.EXCEPTION`. *No article connects them.*

### Corrections to the audit's own prior record

- **Inference I-34** (batch 5: `DSTAGE` relates to the `Staging Area`) — **confirmed** by F241's
  five-stage pipeline.
- **Inference I-37** (batch 6: `DSTAGE` sits between prep and load because it is not schedulable) —
  **the placement is right, the reasoning is corrected**: staging is a full pipeline stage; it simply
  is not exposed by the four-function labour scheduler.

---

## I. Unknown unknowns

- **An undocumented automatic re-sourcing engine.** Three stages can trigger a warehouse-wide search
  that silently re-assigns a different physical piece to a customer's order. It is central to how the
  warehouse works and **it is described nowhere** — only its call sites and its failure location
  (`RESEARCH`) are documented.
- **The pick list mutates during picking** (F247). Any design treating it as a snapshot is wrong, and
  this is known only from one clause in one operating procedure. **Step-by-step procedure articles
  are the highest-yield source in this corpus** — higher than settings articles — and the audit
  should weight them accordingly for the remainder.
- **Physical-world logic keeps appearing**: reverse stop time because a truck is a stack (F244); aisle
  locks because two people can't share an aisle (batch 6 F229); floats because you need something to
  put things on; RF Shuffle because stock gets in front of other stock. **None of it would emerge
  from a data model.** It has to be gathered from people or from procedures like this one.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Float** | Tagged physical container; pieces are linked to it and unloaded from it by scan |
| **Interim** | Optional staging hop between picking and prep, used with floats |
| **Prep / Stage / Load** | The last three pipeline stages, each a scannable location |
| **`PFD`** | Pick Found Damaged — As-Is reason code for damage discovered in prep |
| **`NIL` / `DG` / `SKIP` / `AS` / `PS` / `SP` / `X`** | Scanner escape codes typed at scan prompts |
| **RF Shuffle** | Inline bin-to-bin transfer to clear blocking stock mid-pick |
| **Reverse stop time** | Pick order = reverse of delivery order, because a truck is a stack |
| **FINAL pick list** | The print that reserves merchandise, where reservation is deferred |
| **Alternating Pick Sequence** | Boustrophedon aisle traversal |
| **`No aisle free`** | Scanner message when a locked aisle causes a piece to be skipped |

---

## Contract adjudication — batch 7

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED and materially extended — twice** | Reservation can be deferred to the FINAL pick list (F238); automatic re-sourcing at three stages (F239, F242) |
| **W-039** *(exceptions)* | **CONFIRMED** | Nine scanner escape codes; a dedicated RF picking error monitor (F239, F248) |
| **W-050** *(access control)* | **CONFIRMED as state-based** | Order-level exclusivity and aisle locks act as access control without being permissions (F244, F246) |
| **W-061** *(cost)* | **CONFIRMED** | `PFD` writes damaged pieces to As-Is, a repricing event (F242) |
| **W-012** *(dates)* | **relevant** | Printing from order entry can move the scheduled date — and so reprice delivery (F237 + batch 1 F166) |
| **W-042** *(propagation)* | **CONFIRMED** | Damage in prep pushes the line back into picking automatically (F242) |
| **Container / float model** | **NEW — no contract covers it** | F240 |
| **Warehouse labour direction** | **NEW, extended** | AWM converts choice into instruction (F245) |

---

## Next — batch 8: Transfers (22 articles)

Opening the third subsection. Priorities carried in: **auto transfers** (batch 2 F184, batch 4 F208),
**crossdock** (batch 6 F232), **multi-leg transfers**, `Distributed-Quantity Transfers`,
`Transfer Distribution Quantity`, `Maintain Transfer Security for Multiple Locations`, and
`View Outbound Transfers` — all named across earlier batches and unread.
