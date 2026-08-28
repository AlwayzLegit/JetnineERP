# Run 04 — Inventory Management (Logistics / Delivery) — Batch 3: Trucks, stops, routing, capacity

Status: complete. Findings 190–200. Read-only throughout. No truck loaded, no stop edited, no
capacity changed, no search executed.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | Load a Truck *(Truck Load)* | 15201529006484 | read — **mutually exclusive with the mapping interface** |
| 2 | Truck Load Stop Detail | 15201528514580 | read |
| 3 | Manually Assign an Order to a Truck | 15201528853652 | read |
| 4 | Stop Detail Screen | 15201528521364 | read — **hold-quantity consumption** |
| 5 | View Route Information | 15201512906132 | read — **Dynamic Escape** |
| 6 | View Detailed Route Information | 15201512916628 | read |
| 7 | View Routing Capacity Log | 15201529004692 | read — **shared capacity; sixth retention chain** |
| 8 | View Trailer Volume Capacity Levels | 15201513448340 | read |

**Fulfillments subsection is now 20 of 27 read.** Remaining seven go to batch 4.

Named but not read (queued): `Route Capacity Control Settings` · `Routing/Mapping Interface` ·
`Dynamic Escape` · `Bank Override` · `Confirm Required Carton Quantity for Shipment` ·
`Volume Calculation`.

---

## B. Wiring findings

### FINDING 190 — Piece assignment happens in one of several places, chosen by a setting, and Truck Load is available only when the mapping interface is *off*

- **Invariant:** the truck-load process and the routing/mapping interface are mutually exclusive.
- **Evidence** — `Load a Truck`:
  > "You can use this process **only if the Assign Specific Pieces At field in the Point of Sale Control Settings is set to "Truck Load Process"** and **you do not have the Routing/Mapping Interface active on your system**. This process works with an existing delivery manifest and is **responsible for the actual piece assignment**."
- **Maps to:** F175, F185 (licensed modules alter rules) — **CONFIRMED a third time**; `W-055` (reservation → assignment).

> Two things here, both structural.
>
> First, **`Assign Specific Pieces At` is an enumerated setting** and `"Truck Load Process"` is one
> of its values. So STORIS has several possible moments at which an abstract reserved quantity
> becomes *these specific physical pieces*, and the site picks one. The other values are not
> published anywhere we have read. This is a foundational modelling question for the rebuild —
> **when does a reservation become a serial number** — and STORIS's answer is "it depends on a
> setting". We need that setting's full value list before we design the reservation model.
> Section H, and it is high priority.
>
> Second, the mutual exclusion. Turning on the Routing/Mapping Interface **removes** a process
> rather than adding one. Third instance in three batches of a licensed module changing base
> behaviour (F175 Manifest Location, F185 completion scope, and now this). The pattern is now
> established firmly enough to state as a run-level finding: **in STORIS, module licensing is not
> additive.** A parity comparison against a differently-licensed STORIS install would produce
> different answers, and we should be explicit that this audit describes *the documentation*, not
> necessarily *LA Mattress's configuration*.
>
> Note also the two storage-location fields — `Truck Storage Location` and `Loading Storage
> Location`. **The truck is a storage location.** Inventory moves into it, which is consistent with
> run 02's inventory model and explains how goods in transit remain locatable.

### FINDING 191 — Loading is reversible, piece by piece

- **Invariant:** load state is a toggle on a piece, not a one-way event.
- **Evidence** — `Truck Load Stop Detail`:
  > "Use this routine to indicate whether or not pieces from a manifest have been loaded on a truck. You use this screen to indicate the specific pieces that were loaded or you can "**unload**" pieces that were previously "**loaded**"."
- **Maps to:** F190.

> A rare place where STORIS offers a clean undo. Loading is a physical fact that gets corrected, and
> the model allows for that. Worth contrasting with the manifest itself (F177), which is a one-way
> door — the system is strict about *commitment* and relaxed about *execution*, which is the right
> way round.

### FINDING 192 — Increasing a stop's quantity can consume Hold quantity, on prompt, and the hold may not even be reserved

- **Invariant:** hold quantity is a distinct pool from reserved quantity, and it can be drawn down at stop level.
- **Evidence** — `Stop Detail Screen`:
  > "When you **increase the delivery/transfer quantity and a Hold quantity exists, a message appears asking if you want to use the Hold quantity. The Hold quantity may or may not be reserved.**"
  and:
  > "for multiple delivery/transfer dates, the program allows you to **increase the delivery/transfer quantity only up to the unscheduled quantity for the line**."
- **Maps to:** `W-055` / `W-056` (availability, reservation) — **CONFIRMED and materially extended**;
  F168 (`H` and `U` grid flags).

> **"The Hold quantity may or may not be reserved"** is one of the most consequential sentences in
> the section, and it is dropped in a subordinate clause. It establishes that in STORIS **hold and
> reservation are orthogonal**: a quantity can be held-and-reserved, held-and-unreserved,
> reserved-and-unheld, or neither. Our availability model has been treating hold as a *kind of*
> reservation. It is not.
>
> That reframes batch 1's F168 too: the grid's `F` (Fill Status) column reports reservation, and the
> `H` (On Hold) column reports hold, **and they are genuinely independent axes**, not two views of
> one thing.
>
> The multiple-date cap is the other half: with several delivery dates on a line, a stop can only
> grow into the **unscheduled** remainder, not into another date's allocation. That is the guard
> that keeps run 03 F27's quantity-reallocation rules from being bypassed at the stop screen — the
> same "steer them to the stricter path" pattern as F171.
>
> And note that consuming the hold is **prompted, not automatic**. Advisory again (F184).

### FINDING 193 — Route capacity is logged with before-and-after state, and three order events move it

- **Invariant:** capacity consumption is an audited, reversible ledger, not a running total.
- **Evidence** — `View Routing Capacity Log`:
  > "Use this routine to track and report changes to **route and shared route capacities**; changes include when **new or existing order lines are saved, deleted, or the fulfillment date is changed**. … Information displayed in the grid includes the **current state, previous state, and adjustments made to the actual capacities**."
- **Maps to:** run 03 F31 (capacity override), F33 (four scheduling gates); **NEW** — shared capacity.

> Three triggers — line saved, line deleted, fulfillment date changed — and each writes a
> before/after pair. This is a proper audit ledger for a scarce resource, and it is more rigorous
> than anything the sales side has for its own scarce resources.
>
> The triggers tell us capacity is consumed at **line** granularity by **order entry**, not by
> scheduling. So a salesperson saving a line in the showroom consumes delivery capacity
> immediately — which is why run 03 found capacity checks embedded in order entry (F28, F31, F33).
> The logistics team's capacity is spent by the sales team, and this log is how the logistics team
> finds out who spent it.

### FINDING 194 — Routes can share capacity through a named code

- **Invariant:** capacity is poolable across routes.
- **Evidence** — `View Routing Capacity Log` search fields: `Route Type` · `Route Code` ·
  **`Shared Capacity Code`** · `Limit Search to Over Capacity`; and the purpose sentence
  > "changes to **route and shared route capacities**".
- **Maps to:** F193; **NEW**.

> `Shared Capacity Code` is a grouping key that lets several routes draw on one pool — the natural
> use being two routes served by the same trucks or the same crew. Nothing we have read defines how
> the pool is sized or how contention between member routes is resolved.
>
> **`Limit Search to Over Capacity`** as a search checkbox is quietly revealing: **routes can go
> over capacity.** Capacity is therefore a soft constraint with an override (run 03 F31 found the
> override is separately permissioned for orders and transfers), and this log is where the
> consequences are found afterwards. For the rebuild, "capacity" is a budget with an audit trail,
> not a hard limit.

### FINDING 195 — The capacity log has its own retention setting on a named tab

- **Invariant:** sixth complete retention chain.
- **Evidence** — `View Routing Capacity Log`:
  > "This routing capacity information can be purged after a set number of days using the **Routing Capacity Log Retention Days** setting in the **Settings tab of Route Capacity Control Settings**. **STORIS recommends using this setting in order to keep the capacity log file small.**"
- **Maps to:** `W-064` — **CONFIRMED**.

> The sixth *file → setting → purge* chain (after written sales, gift certificates, completed order
> history, `DAILY.DETAIL`, `ROUTE.EXCEPTION`). The rule stated at run 03 F160 holds without
> exception so far: **every historical file in STORIS has a named retention setting in the control
> record of the module that owns the file.**
>
> The vendor recommending the setting be used is a tell: **this file grows fast.** Every line save,
> delete and date change writes a row. On a busy sales floor that is the highest-volume audit table
> in the logistics module, and we should size for it.

### FINDING 196 — Volume is a real capacity dimension with its own trailer-level view, tied to RF picking status

- **Invariant:** trucks are constrained by volume, and volume is tracked against picking progress.
- **Evidence** — `View Trailer Volume Capacity Levels`:
  > "Use this routine to view a summary of **RF picking statuses and current volume levels** for deliveries and/or transfers **on a manifest**."
  Fields: Location · Scheduled · Display · **Truck/Route** · **Trailer Capacity** ·
  Display Location Details.
- **Maps to:** F168 (`R` = RF picking flag); batch 1's `Volume` total on Confirm Schedule.

> Batch 1 noted `Volume` as an unexplained total on the scheduling screen. It is a capacity
> dimension in its own right, measured against **`Trailer Capacity`**, and the natural constraint for
> a furniture and mattress business — you run out of cubic feet long before you run out of pieces
> or dollars. `Volume Calculation` is a named related article and is queued; the unit is still not
> stated.
>
> The pairing with **RF picking status** on one screen is the operationally interesting part: the
> question this screen answers is *"is this truck full, and is what's meant to be on it actually
> picked?"* Two different systems' state, joined at the trailer. Note the field is **`Truck/Route`**
> as a single label — more evidence that truck and route are alternative associations for the same
> slot (F185).

### FINDING 197 — Last-minute truck reassignment exists specifically to avoid re-running the download

- **Invariant:** the mapping interface has a batch download, and manual reassignment bypasses it.
- **Evidence** — `Manually Assign an Order to a Truck`:
  > "This program **works with the Route Mapping Interface**. Use this program to make **last-minute changes to delivery truck assignments without having to perform the download process**."
  Criteria: Ship Location · Type · Truck · Delivery Date. Grid: Document · Truck · **Stop Time**.
- **Maps to:** F190 (mutual exclusion), F185.

> The complement of F190: `Load a Truck` requires the mapping interface **off**, and this routine
> requires it **on**. **Two different piece/truck workflows for two configurations**, and a site
> uses one or the other. Anyone documenting "how we assign trucks" for the rebuild must first
> establish which configuration LA Mattress runs.
>
> The existence of a "download process" tells us the mapping interface is **batch-oriented** — routes
> are computed and pushed, and this screen is the manual patch applied after the push. That means
> STORIS's truck assignment is not continuously optimised; it is optimised once and then hand-edited.
> `Run the Mapping Interface` and `Run Dispatch Track Mapping Interface` are queued for batch 4.

### FINDING 198 — Routes are typed, closeable, and searched by postcode

- **Invariant:** a route is a zip-keyed, typed, lifecycle-bearing object.
- **Evidence** — `View Route Information` search fields:
  **`Zip or Postal Code`** · `Route Code` · Starting Date · Ending Date ·
  **`Exclude Closed Routes`** · **`Exclude Delivery Routes`** · **`Exclude Transfer Routes`** ·
  **`Exclude Service Routes`**.
- **Maps to:** run 03 F30 (route code resolution is zip-driven) — **CONFIRMED**; F181.

> Run 03 F30 said route resolution is zip-driven; this confirms it from the routing side — you find
> a route by asking which one serves a postcode. And **routes have the same three types as
> manifests** (delivery / transfer / service), which makes route type the organising spine of the
> whole logistics module.
>
> **`Exclude Closed Routes`** establishes that routes close. Nothing says what closes them, whether
> closure is per-date or permanent, or what happens to orders assigned to a route that closes.
> Section H.
>
> The four exclusion checkboxes are **negative filters** — the screen's default is everything, and
> you subtract. Small UI convention, but it is the third inverted control we have found (`A`
> available-to-ship, the two inverted PO-hold permissions in run 02), and it is worth noting that
> **STORIS routinely expresses filters as exclusions.** Reading these screens by the field name
> gives the wrong answer more often than not.

### FINDING 199 — `Dynamic Escape` is a second screen-composition mechanism

- **Invariant:** screens can be reached by configured escape as well as by menu.
- **Evidence** — `View Route Information`:
  > "This screen can be accessed from the Main Menu or **can be set up as a Dynamic Escape**."
- **Maps to:** run 03 F155, F156 (Dynamic Tab Settings) — **NEW mechanism, same family**.

> A second "Dynamic" configuration mechanism, alongside Dynamic Tab Settings. Run 03 F155 found
> screens that exist **only** as DTS pages with no menu path; this is the converse — a screen with a
> menu path that can *additionally* be wired as an escape from somewhere else.
>
> Together they mean **navigation in STORIS is configuration**, not structure. The reachability of a
> screen is site-specific in at least two independent ways. This strengthens the run 03 §I warning:
> our screen inventory is a lower bound, and "where do you get to this from" has no documented
> answer. `Dynamic Escape` is queued.

### FINDING 200 — Large searches warn before loading, with verbatim text

- **Invariant:** result-set size is a user-facing gate.
- **Evidence** — `View Routing Capacity Log`:
  > "If the search results yield a significant number of results, a message appears before loading the results, "**XXXX records have been selected - this could take a while. Continue?**" If you continue, the search results load in the grid. If you do not continue, the results do not load and you can narrow your search criteria and run the search again."
- **Maps to:** F195 (this file grows fast).

> Minor as a rule, useful as a signal: the vendor expects this table to be big enough that an
> unbounded query is a hazard. Recorded chiefly as corroboration for F195's sizing warning — and
> because the threshold ("significant") is not defined anywhere.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Load a Truck** *(Truck Load)* | Warehouse · Delivery Date · Route · **Truck Storage Location** · **Loading Storage Location** · Document · Grid Information · Save |
| **Truck Load Stop Detail** | Product · Quantity · Grid Information · OK *(returns to Load a Truck)* |
| **Manually Assign an Order to a Truck** | Ship Location · Type · Truck · Delivery Date · Save *(runs the search)* → grid: Document · Truck · Stop Time |
| **Stop Detail Screen** | Stop Time · Product · Quantity · Actions *(header items partly editable)* |
| **View Route Information** | Zip or Postal Code · Route Code · Starting Date · Ending Date · Exclude Closed Routes · Exclude Delivery Routes · Exclude Transfer Routes · Exclude Service Routes · Search |
| **View Detailed Route Information** | Date · Route Code · **Additional Comments** · Grid Information · Search |
| **View Routing Capacity Log** | Entry Start Date · Entry End Date · **Calendar Date** · Route Type · Route Code · **Shared Capacity Code** · **Limit Search to Over Capacity** · Search · Grid Information *(read-only; current state, previous state, adjustments)* |
| **View Trailer Volume Capacity Levels** | Location · Scheduled · Display · Truck/Route · **Trailer Capacity** · Display Location Details · Grid Information · Actions *(print)* |

> **`Entry Start/End Date` and `Calendar Date` are separate fields on the capacity log** — the date
> the change was *entered* versus the date it was *for*. A clean two-clock model, and the same
> distinction our rebuild will need everywhere in logistics.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Assign Specific Pieces At** | Point of Sale Control Settings | Enumerated; `"Truck Load Process"` is one value. **Decides when a reservation becomes specific pieces** (F190) |
| **Routing/Mapping Interface** *(active/inactive)* | system-level | Its presence **removes** Load a Truck and **enables** Manually Assign an Order to a Truck (F190, F197) |
| **Routing Capacity Log Retention Days** | **Route Capacity Control Settings → Settings tab** | Purges the capacity log; vendor recommends using it (F195) |
| **Consolidate Stops** | Route Capacity Control Settings | *(batch 1, F176)* |

---

## E. Security permissions catalog (additions)

No new permission names this batch. Note the absence: **none of these eight articles mentions
Regional Processing or a security override**, in contrast to the scheduling and manifest articles
which mention them repeatedly. Recorded as an observation, not a conclusion — absence in the
documentation is not absence in the product.

---

## F. State machines and enumerations (additions)

- **Route type:** delivery · transfer · service *(matching manifest types, F181)*.
- **Route lifecycle:** open · **closed** *(from `Exclude Closed Routes`; nothing else known)*.
- **Piece load state:** loaded ⇄ unloaded *(reversible, F191)*.
- **`Assign Specific Pieces At`** — enumerated; only `"Truck Load Process"` published.
- **Quantity pools on a line, now four and orthogonal:** ordered · scheduled · reserved · **hold**
  — with hold explicitly independent of reserved (F192), plus derived *unscheduled*.
- **Capacity dimensions:** stops · units · dollars · **volume** *(against `Trailer Capacity`)*.
- **Capacity is soft** — `Limit Search to Over Capacity` proves routes exceed it (F194).

---

## G. Sequencing rules

1. `Assign Specific Pieces At` = `"Truck Load Process"` **and** mapping interface off → `Load a
   Truck` is available; it works against an **existing manifest** (F190).
2. Mapping interface on → `Load a Truck` unavailable; `Manually Assign an Order to a Truck` patches
   assignments **without re-running the download** (F197).
3. Load a Truck → Truck Load Stop Detail → OK returns to Load a Truck (F191).
4. Build manifest → select a document → **Stop Detail Screen** to edit that stop (F192).
5. Increase stop quantity → if hold quantity exists, **prompt** to consume it; with multiple dates,
   capped at the line's unscheduled quantity (F192).
6. Order line saved / deleted / fulfillment date changed → **route capacity adjusted and logged**
   with before and after (F193).
7. Capacity log rows purge after `Routing Capacity Log Retention Days` (F195).

---

## H. Open questions and gaps

### Gated or unreachable

- **`Assign Specific Pieces At` — the full value list.** `"Truck Load Process"` is one value; the
  others are not published in any article read in four runs. **This is now the highest-priority
  unknown in run 04**, above `Hold Code Settings`, because it determines the reservation→piece model.
- `Route Capacity Control Settings` — named three times across two batches, never read. Queued.
- `Dynamic Escape` · `Volume Calculation` · `Routing/Mapping Interface` · `Bank Override` ·
  `Confirm Required Carton Quantity for Shipment` — named, unread.
- **`Hold Code Settings`** — still unread. Batch 4.

### Documented but ambiguous

- **What closes a route**, whether closure is dated or permanent, and what becomes of orders on a
  route that closes (F198).
- **How a shared capacity pool is sized**, and how contention between its member routes resolves (F194).
- **The unit of volume** and how `Trailer Capacity` is established (F196).
- **The relationship between truck and route.** `Truck/Route` appears as one label; a manifest is
  associated with one or the other (F185); the model is never stated.
- **What "significant number of results" means** for the large-search warning (F200).
- **`Additional Comments` on View Detailed Route Information** — whose comments, entered where.
- **`Display` and `Scheduled`** on the trailer volume screen — unexplained field names.

### Inferences (recorded as inference, not fact)

- **I-26:** `Shared Capacity Code` most likely exists to model several routes sharing one truck fleet
  or crew. *Purely from the name; no article gives a use case.*
- **I-27:** Because `Load a Truck` requires the mapping interface off and `Manually Assign an Order
  to a Truck` requires it on, the two are probably alternative implementations of the same step
  rather than complements. *The articles do not say they are alternatives.*
- **I-28:** Volume is probably cubic measure per piece rolled up to the trailer. *`Volume
  Calculation` exists and is unread; do not rely on this.*

---

## I. Unknown unknowns

- **Module licensing is subtractive.** Three instances now (F175, F185, F190). We cannot know from
  the documentation which processes exist in *LA Mattress's* STORIS, only which exist in *some*
  STORIS. Any parity claim in this run carries that caveat.
- **Hold and reservation are orthogonal** (F192), discovered in a subordinate clause. If a
  distinction that fundamental can hide in a dependent clause on a stop-detail screen, others can
  too — and the availability model is the most likely place for them.
- **Navigation is configuration** (F199, with run 03 F155/F156). Two independent mechanisms so far.
  We should expect more, and should stop treating the menu as the map.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Truck Load Process** | One value of `Assign Specific Pieces At`; the screen that assigns physical pieces |
| **Truck Storage Location / Loading Storage Location** | The truck and the dock as inventory locations |
| **Hold quantity** | A pool independent of reserved quantity; may or may not be reserved |
| **Shared Capacity Code** | Grouping key letting several routes draw on one capacity pool |
| **Routing Capacity Log** | Before/after ledger of capacity changes; retention-bounded |
| **Trailer Capacity** | The volume ceiling a truck is measured against |
| **Route Mapping Interface** | Batch route/truck computation with a download step |
| **Dynamic Escape** | Configured navigation path to a screen, alongside the menu |
| **Closed route** | A route excluded from selection; cause undocumented |

---

## Contract adjudication — batch 3

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED and materially extended** | Hold and reservation are **orthogonal** (F192); assignment timing is a setting (F190) |
| **W-064** *(retention)* | **CONFIRMED** | Sixth chain — capacity log (F195) |
| **W-012** *(dates)* | **CONFIRMED** | Entry date vs calendar date kept separate on the capacity log |
| **W-050** *(access control)* | **NOT DOCUMENTED IN THIS BATCH** | No permission or Regional Processing note on any of the eight articles |
| **W-042** *(cross-document)* | **consistent — advisory** | Hold consumption is prompted, not automatic (F192) |
| **Licensed modules altering base behaviour** | **NEW — confirmed a third time** | F190 |
| **Shared route capacity** | **NEW — no contract covers it** | F194 |
| **Screen reachability as configuration** | **NEW, extended** | Dynamic Escape (F199) |

---

## Next — batch 4: holds, direct ship, interfaces, people *(completes the Fulfillments subsection)*

Remove Items from Delivery Hold Status · Complete Direct Ship Orders · Delivery Ticket Reprints ·
Run the Mapping Interface · Run Dispatch Track Mapping Interface · Maintain Un-manifested
Fulfillments Sent to Dispatch Track · Maintain Driver and Delivery Associate — plus the linked
`Hold Code Settings` and `Route Capacity Control Settings`.
