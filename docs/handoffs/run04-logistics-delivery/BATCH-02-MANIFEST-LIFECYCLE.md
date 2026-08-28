# Run 04 — Inventory Management (Logistics / Delivery) — Batch 2: Manifest lifecycle

Status: complete. Findings 177–189. Read-only throughout. No manifest built, no manifest completed,
no reason code entered, no process run. Several of these articles document write screens; none was
exercised.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | Build a Delivery/Service/Transfer Manifest | 15201513285908 | read — **covers all three build routines** |
| 2 | Complete the Delivery Manifest Process | 15201513286164 | read — **the densest article in the section** |
| 3 | Complete Multiple Manifests | 15201513094932 | read |
| 4 | Manifest Not Delivered Reason Screen | 15201512788500 | read |
| 5 | Pieces Not Completed Detail | 15201512905236 | read |
| 6 | Confirm All Serial Numbers | 15201528408084 | read |

Named but not read (queued): `Print a Manifest` · `Reason Code Settings` · `View Deliveries on
Manifests` · `View AWM Activity` · `Volume Calculation` · `Schedule and Build a Transfer Manifest` ·
`Order Completion Details` · `Create an As-Is Kit` · `Transfer Distribution Quantity`.

---

## B. Wiring findings

### FINDING 177 — Putting an order on a manifest locks it out of every other process in the system

- **Invariant:** the manifest takes an exclusive, system-wide lock on the order.
- **Evidence** — `Build a Delivery/Service/Transfer Manifest`:
  > "**Once you add an order to a manifest, you cannot access the order using other processes.**"
  and:
  > "If an order on a manifest has been **released for completion**, this process **prevents you from removing it** from the manifest."
- **Maps to:** `W-050` (access control) — **CONFIRMED**; run 04 F170; run 03 F30.

> Batch 1 F170 found the manifest freezes all but two fields. This is stronger and it is stated
> without qualification: **the order becomes inaccessible to other processes entirely.** Not
> read-only — inaccessible.
>
> That is a genuine architectural commitment, and it is the reason the two-field escape hatch in
> F170 needs its own permission. It also explains a workflow shape we should expect to find in the
> business: **anything that must happen to an order has to happen before it is manifested**, because
> after that the order belongs to the warehouse. Credit corrections, price adjustments, adding a
> line — all of it has a hard cutoff at manifest build.
>
> And there is a one-way door inside the one-way door: once an order is **released for completion**,
> it cannot even be removed from the manifest. So the sequence is *schedulable → manifested (locked)
> → released (locked to this manifest)*. For the rebuild, the question to put to the business is
> whether they actually want a lock this hard, or whether they have simply organised around it for
> twenty years.

### FINDING 178 — Removing an order from an existing manifest demands a reason code, gated on two settings, and logs an exception to a named report file

- **Invariant:** manifest removal is an auditable exception; manifest *creation* is not.
- **Evidence** — `Build a Delivery/Service/Transfer Manifest`:
  > "If a previously existing manifest has one or more orders removed, the Enter Reason Code window appears if **1) the Require Reason Code if one or More Orders Removed field is checked in Point of Sale Control Settings** and **2) the Removal of Orders from a Manifest Exception reason code is set in Reason Code Settings**. An exception is logged if a reason code is required for removal of an order. **The Enter Reason Code window appears once even if more than one order is being removed. There is no prompt for a reason code if an order is removed during original creation of a manifest.** Manifest exceptions can be reported via Run a Report using **Orders Removed from Manifest (S$TE_MAINIF_RMV)**."
- **Maps to:** `W-039` (exceptions) — **CONFIRMED**; `W-050`.

> A **two-condition AND gate across two different settings records** — the switch in Point of Sale
> Control Settings does nothing unless a reason code of the right type also exists in Reason Code
> Settings. That is a configuration trap: an administrator who ticks the box and stops sees no
> prompt and assumes the feature is broken. We have now seen this shape enough times to name it as
> a rule: **in STORIS, enabling a feature routinely requires a switch *and* a code-table entry.**
>
> Two behavioural details matter for parity. The prompt fires **once per removal action, not once
> per order** — so a batch removal of nine orders is recorded under one reason. And **removal during
> original creation is exempt** — the audit trail starts only after the manifest exists. Both mean
> the exception count understates removals, and anyone measuring warehouse churn from
> `S$TE_MAINIF_RMV` needs to know it.
>
> **`S$TE_MAINIF_RMV`** is a named report token. Note the apparent typo in the vendor's own
> documentation — `MAINIF` rather than `MANIF` — which is recorded verbatim because a token is a
> token. If it is a typo in the docs and not in the product, anyone typing it from this article
> will get nothing. Section H.

### FINDING 179 — Completing a manifest silently drops orders with no reserved merchandise and writes them a comment

- **Invariant:** completion is a filter, not just a state change; unfillable orders survive it untouched.
- **Evidence** — `Complete the Delivery Manifest Process`:
  > "**Sales orders that have no reserved merchandise are removed from the manifest and are left open. An order comment is written. "Order NNNN was on Manifest for Route/Truck NNNN, Date NNNN, but was not completed because it has no merchandise."**"
- **Maps to:** `W-055` / `W-056` (reservation) — **CONFIRMED**; run 03 F3.

> The verbatim comment text is worth having because it is the *only* trace this leaves. The order
> does not go on hold, does not enter an exception queue, does not appear in a report named for this
> condition — it drops off the manifest, stays open, and gets a comment. **An order can therefore be
> scheduled, manifested, sent out on a truck-day, and come back to exactly where it started, with
> the evidence living in a free-text comment.**
>
> Combined with F177 (manifested orders are locked out of other processes), this is the shape of a
> real operational failure mode: an order whose reservation was consumed elsewhere between
> manifesting and completion vanishes from the logistics flow without anyone being told. For the
> rebuild, this is a place where we should do better than parity — but we need to know STORIS does
> it, because the business's current backlog almost certainly contains orders in this state.

### FINDING 180 — Manifest completion exceptions go to a named file whose retention is a Logistics-page setting

- **Invariant:** every manifest line can produce an exception, and the exceptions are a queryable file with a retention policy.
- **Evidence** — `Complete the Delivery Manifest Process`:
  > "**Any item on a manifest is capable of creating a manifest exception** (for example, an item not delivered or a customer return not picked up). If your system is set to track manifest completion exceptions (via the **Manifest Exception Retention field on the Logistics page of the Point of Sale Control Settings**), the system adds each exception to the **ROUTE.EXCEPTION** file, which you can use with the **Create a Report (Query Wizard Builder)** routine…"
  and:
  > "Routing exceptions can be reported via the Run a Report process using the ROUTE.EXCEPTION file."
- **Maps to:** `W-064` (retention) — **CONFIRMED**; `W-039` (exceptions).

> The **fifth complete retention chain** in the audit (*file → setting → policy*), and the first
> where the setting name **is** the retention rather than a separate switch: `Manifest Exception
> Retention` both enables tracking and bounds it. Set it to zero and the exceptions do not exist;
> the docs say "if your system is set to track" and point at the same field.
>
> **`ROUTE.EXCEPTION`** joins the named data stores: `BTA` · `PRODUCT.HISTORY` · `DAILY.DETAIL` ·
> `Customer History` · Costing Table · `BMW_ACF` · completed order history. The dotted-uppercase
> convention holds (inference I-17, batch 16 of run 03).
>
> The scope sentence is the important one: **"any item on a manifest is capable of creating a
> manifest exception."** Not just undelivered goods — an uncollected customer return counts. This is
> the delivery-side twin of the sales exception log (run 03 F130/F154), and we should check in a
> later batch whether it shares that log's append-on-access, never-retract semantics or behaves as
> a work queue. The documentation here does not say.

### FINDING 181 — Three destination-location fields activate by *document type on the manifest*, not by manifest type

- **Invariant:** a mixed manifest activates the union of its documents' requirements.
- **Evidence** — `Complete the Delivery Manifest Process`:
  > "The **Not Completed Location, Return Location, and Transfer Receiving Location** fields are active based on **the document type included in the manifest, not by manifest type**.
  > Not Completed Location is active if the manifest includes a **delivery document or In-Home Service document** and Return Location is active if a **Return/Pickup document** is included in the manifest.
  > Transfer Receiving Location is active if a **transfer document** is on the manifest."
  and:
  > "**In-Shop service documents cannot be put on a manifest** because nothing is being shipped or picked up."
- **Maps to:** run 04 F168 (the `T` transaction column); run 03 F20 (line details split by document type).

> A manifest is typed (delivery / transfer / service) but its *behaviour* is driven by what is
> actually on it. The screen is assembled from the union of the document types present. That is a
> small thing to get wrong and an annoying thing to discover late.
>
> The In-Shop exclusion is a clean piece of domain logic stated as a reason rather than a rule:
> **nothing moves, so there is nothing to manifest.** It also explains the `S` column's three values
> in F168 — in-home service rides on trucks, in-shop service does not, and an order can have both.
>
> Note that a **delivery** and an **In-Home Service** document share the same Not Completed
> Location field. Service and delivery are more alike than the separate manifest routines suggest.

### FINDING 182 — Customer's own goods ride the truck but never enter inventory

- **Invariant:** COG is tracked by location without being owned.
- **Evidence** — `Complete the Delivery Manifest Process`:
  > "Although a **customer's own good (COG)** can be put on a manifest, **pieces are not put into inventory**. Users can enter the new storage location to be used when the pieces are moved to a service location."
- **Maps to:** `W-061` (cost) — **relevant**; `W-055` (availability); **NEW**.

> A physical object in a company warehouse, occupying a named storage location, moved by company
> trucks, and **deliberately outside the inventory ledger** — because it belongs to the customer.
> That is exactly right and it is exactly the kind of thing a rebuild gets wrong by making
> everything an inventory record with an ownership flag.
>
> `New Storage Location` on the completion screen is how the COG's whereabouts are recorded. So
> STORIS tracks **location without quantity, cost, or availability** for this class of object. Our
> data model needs a place for that. Run 03 F63 and the `View an Open Customer's Own Goods Order`
> inquiry in Sales Views are the other sightings; this is the first that says what happens
> physically.

### FINDING 183 — Auto-build and auto-update are prompted, and the answer determines whether the manifest is assembled by the system or keyed by hand

- **Invariant:** manifest assembly has two modes chosen per build.
- **Evidence** — `Build a Delivery/Service/Transfer Manifest`:
  > "Once you enter the warehouse, date, and route, one of the following prompts appears, depending on whether or not a manifest already exists for the selected location, date, and route:
  > **Auto-build this Manifest Yes No** — or — **Auto-update this Manifest Yes No**
  > To manually add orders to the manifest, answer **No**, then enter the document numbers to be added at the **Document** field."
  and:
  > "This program is an **optional step** in the delivery/transfer/service process."
- **Maps to:** F177.

> The manifest key is **(location, date, route)** — that triple decides whether you are building or
> updating. Worth recording as the natural primary key.
>
> And the manifest is **optional**. Orders can be delivered without one; the manifest exists to
> produce a paper trail — the article says so:
> > "produces a report … that warehouse personnel can use to track actual pieces delivered … It also provides a paper trail for the customer signature and collected dollar amount."
> Since the manifest is also what locks the order (F177) and freezes its fields (F170), **the
> business's choice to use manifests is simultaneously a choice about how locked orders get.** Sites
> that skip manifests have a much looser system. Which mode LA Mattress runs in is a question worth
> asking before we design the lock.

### FINDING 184 — Manifested transfers and their associated sales orders warn each other, with verbatim message text

- **Invariant:** an auto transfer and the sales order it serves are coupled across manifests.
- **Evidence** — `Build a Delivery/Service/Transfer Manifest`:
  > "When an **auto transfer** is on a manifest and is associated with a sales order that is also on a manifest, a message displays when any of the following occurs:
  > - If the transfer is removed from the manifest, "**Transfer is associated with sales order NNNN which is on manifest for Date NNNN and Route/Truck NNNN. Continue?**"
  > - If there is more than one sales order on manifest that is associated with any of the transfers "**Transfers on this manifest are associated with Sales Orders which are on manifest. Continue?**""
- **Maps to:** `W-042` (cross-document propagation); **NEW** — auto transfers.

> The coupling is real but **advisory** — both messages end in "Continue?". STORIS warns and lets
> you proceed. So a transfer can be pulled off its manifest while the sales order that depends on
> it stays manifested for delivery, and the only defence is a human reading a dialog.
>
> This is the same shape as run 02's finding on `W-042`: STORIS detects the cross-document
> condition and **tells a person about it rather than acting**. Three runs in, that is clearly a
> deliberate house style, not an oversight — and it is the single biggest philosophical difference
> between STORIS and anything we would build today. Every one of these is a place where we must
> decide: enforce, or notify?
>
> **"Auto transfer"** is a new term — a transfer created by the system to serve a sales order.
> Queued for the Transfers batches.

### FINDING 185 — With mapping active and neither route nor truck specified, only truck-associated manifests complete

- **Invariant:** the mapping module changes which manifests a blank-criteria completion touches.
- **Evidence** — `Build a Delivery/Service/Transfer Manifest`:
  > "If **neither the Route or Truck has been specified while mapping is active**, the only manifests that are completed are those **associated with a truck**."
  and:
  > "To print the packing list for manifests associated with a route, **the Route must be specified**."
- **Maps to:** F175 (licensed modules change resolution rules) — **CONFIRMED again**.

> Second instance in two batches of a licensed module altering a default rather than adding a
> feature. Leave the filter blank with mapping on and you silently get a subset. Route-associated
> manifests are skipped, and nothing says so at the time.
>
> Route and truck are evidently **parallel, not hierarchical** — a manifest is associated with one
> or the other, and which one changes both completion scope and whether a packing list can print.
> That is worth confirming in batch 3 against `Load a Truck` and `View Route Information`.

### FINDING 186 — Not-delivered has two levels: a whole-document reason, and per-piece detail with its own disposition

- **Invariant:** failure to deliver is captured at document level and at piece level, separately.
- **Evidence** — `Manifest Not Delivered Reason Screen`:
  > "This screen appears if you use the Complete the Delivery Manifest Process to **mark all items on an order as not-delivered**. The screen appears when you click on Save to exit the screen."
  Single field: **`Reason Entire Document Was Not Delivered`**.
  And `Pieces Not Completed Detail`:
  > "Use this screen to view and update detailed information for sales, service, and transfer orders containing **pieces with a status of Not Complete**. You can use this screen for individual pieces of product or for all Not Complete pieces on the order."
  Fields: Document · Customer Name/Name · Product ID · **Return to Storage Location / Receiving
  Storage Location** · **Not Completed Comment** · **All Pieces for Line Reference** ·
  **Release Pieces Not Completed** · **Add To As-Is Reason Code**.
- **Maps to:** `W-039` (exceptions); F180.

> Two screens, two granularities: *the whole document failed, why?* and *these pieces failed, where
> do they go?* The second is the interesting one, because it carries **disposition**, not just
> explanation.
>
> **`Add To As-Is Reason Code`** is the finding inside the finding: **merchandise that came back on
> the truck can be converted to As-Is inventory right here, at the point of failed delivery, with a
> reason code.** That is a direct, documented path from a delivery failure into the As-Is inventory
> population that run 02 tracked through `As-Is`, `As-Is Available` and the As-Is kit machinery —
> and it is a *cost* event as well as an inventory one, since As-Is merchandise is repriced.
> `Create an As-Is Kit` is a related article, queued.
>
> **`Release Pieces Not Completed`** is the escape: pieces stuck in Not Complete can be released.
> The article does not say released *to what state*. Section H.

### FINDING 187 — Serial-number confirmation at delivery is gated by a Logistics-tab setting and reachable from two entirely different processes

- **Invariant:** the same confirmation screen serves single-order completion and manifest completion.
- **Evidence** — `Confirm All Serial Numbers`:
  > "This process is called when completing an individual delivery order from the **Payment tab in Enter a Sales Order** by checking the box at the **Print Delivery Ticket** field and selecting **Delivery** at the **Completion Type** field. This process is **also available in the Complete the Delivery Manifest Process when a single delivery order is selected**."
  and:
  > "In order to use this screen in the Enter a Sales Order process, the **MANIFESTS - Verify delivered merchandise** setting must be checked on the **Logistics tab in the Point of Sale Control Settings**."
- **Maps to:** `W-050`; run 03 F8 (order completion preconditions).

> Two doors into one screen, and **the setting only gates one of them** — the sales-order door needs
> `MANIFESTS - Verify delivered merchandise`; the manifest door apparently does not. So a site with
> that setting off still confirms serials when completing from a manifest, and does not when
> completing from the order. **The same business rule applies or does not depending on which screen
> the clerk started in.** That is a parity detail we would never guess.
>
> The trigger condition on the sales-order side is a conjunction: `Print Delivery Ticket` checked
> **and** `Completion Type` = Delivery. Run 03 batch 4 catalogued the Payment tab; this adds the
> completion-type coupling.

### FINDING 188 — Manifests can be completed in bulk, one type at a time

- **Invariant:** bulk completion is scoped to a single manifest type per run.
- **Evidence** — `Complete Multiple Manifests`:
  > "Use this routine to search for and complete multiple delivery, transfer, or service manifest documents. … **You can search for only one type (delivery, transfer, or service) at a time.**"
  Criteria: Location · Manifest Type · Truck · Route · Date Code · Start Date · End Date.
- **Maps to:** F181.

> The single-type restriction is consistent with F181's point that behaviour follows document type —
> a bulk completion cannot present the union of three types' location fields, so it does not try.
>
> Note what bulk completion **does not offer**: no COD entry, no bank, no not-delivered reason. The
> single-manifest process has all of those. So the bulk path is for the clean case only, and any
> manifest with an exception has to be worked individually. Worth confirming, because the article
> does not say what happens when a bulk-selected manifest turns out to need a reason code.

### FINDING 189 — Deleting an entire manifest is its own extended security setting

- **Invariant:** manifest deletion is separately permissioned from manifest editing.
- **Evidence** — `Build a Delivery/Service/Transfer Manifest`:
  > "In order to delete a manifest the **Delete an Entire Manifest extended security settings in Logistics Security** must be selected."
- **Maps to:** `W-050` — **CONFIRMED**; F170.

> Second named field in `Logistics Security`, after `Update Status and Stop Time for an Order on a
> Manifest` (F170). The term **"extended security settings"** appears here for the first time and
> suggests `Logistics Security` has a base layer and an extended layer. That structure is not
> documented. Queued: `Create a User/Group Actions - Logistics Security`.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Build a Delivery/Service/Transfer Manifest** *(three routines: Delivery / Transfer / Service)* | Warehouse · Route · Truck · **Carrier** · **Technician** · **Staging Area** · Date · Type · Stops · Units · Order · Fulfillment · Grid Information · Actions · Document *(manual add)* · prompts `Auto-build this Manifest Yes/No`, `Auto-update this Manifest Yes/No` |
| **Complete the Delivery Manifest Process** | Warehouse · Date · Route · Truck · Carrier · **Bank** · Type · **COD** · **Collected** · **New Storage Location** · **Not Completed Location** · **Return Location** · **Transfer Receiving Location** · Document · Action · Grid Information · **Apply Payments** · Actions |
| **Complete Multiple Manifests** | Location · Manifest Type · Truck · Route · Date Code · Start Date · End Date · Search · Grid Information |
| **Manifest Not Delivered Reason Screen** | `Reason Entire Document Was Not Delivered` *(single field)* |
| **Pieces Not Completed Detail** | Document · Customer Name/Name · Product ID · Return to Storage Location / Receiving Storage Location *(listed twice in the source)* · Not Completed Comment · All Pieces for Line Reference · Release Pieces Not Completed · Add To As-Is Reason Code |
| **Confirm All Serial Numbers** | Grid Information *(serial/reference numbers, editable)* |

**UI note, verbatim:** on Complete the Delivery Manifest Process — "To view more detail on the grid,
click and drag up to utilize the **screen split design**." A resizable split-pane grid.

**Sequencing note:** "Once Save is selected, you are brought to **Order Completion Details** process."
Manifest completion hands off to a further screen we have not read.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Require Reason Code if one or More Orders Removed** | Point of Sale Control Settings | Half of the removal-reason gate (F178) |
| **Removal of Orders from a Manifest Exception** | **Reason Code Settings** | The other half — a reason code must exist (F178) |
| **Manifest Exception Retention** | Point of Sale Control Settings → **Logistics page** | Enables and bounds `ROUTE.EXCEPTION` (F180) |
| **MANIFESTS - Verify delivered merchandise** | Point of Sale Control Settings → **Logistics tab** | Gates serial confirmation from Enter a Sales Order only (F187) |
| **Delete an Entire Manifest** | **Logistics Security** *(extended security settings)* | Permits manifest deletion (F189) |
| *(Closed Without Completion)* | Status Code Settings | Service lines with this status count as closed *(repeated from batch 1)* |

> **The `Logistics` page of Point of Sale Control Settings now has six named fields** across two
> batches: `Allow Order Entry Access in Logistical Scheduling`, `Recalculate Delivery Charge`,
> `Restrict Scheduled Date`, `Require Reason Code if one or More Orders Removed`,
> `Manifest Exception Retention`, `MANIFESTS - Verify delivered merchandise`. This is the most
> progress the audit has made on that record in four runs. **Note the drift: one article calls it
> the Logistics *page*, another the Logistics *tab*.**

---

## E. Security permissions catalog (additions)

- **`Logistics Security`** — second named field: `Delete an Entire Manifest`, described as an
  **"extended security settings"**, implying a two-layer structure (F189).
- **Security override** for `Restrict Scheduled Date` applies to manifest completion as well as
  scheduling — the same paragraph appears verbatim on `Complete the Delivery Manifest Process`.
- **Manifest as an access-control mechanism in itself** (F177): membership of a manifest removes the
  order from every other process. This is access control by document state rather than by
  permission — arguably a twenty-first mechanism, and a different *kind*.

---

## F. State machines and enumerations (additions)

- **Piece status:** `Not Complete` — with dispositions: return to storage location · release ·
  **add to As-Is** (F186).
- **Manifest type:** delivery · transfer · service. **Document types on a manifest:** delivery ·
  In-Home Service · Return/Pickup · transfer · COG. **In-Shop service is excluded by construction.**
- **Manifest key:** (location, date, route) — build vs update is decided by its existence (F183).
- **Order lifecycle through logistics:** schedulable → **manifested** *(locked out of other
  processes)* → **released for completion** *(cannot be removed from manifest)* → completed →
  Order Completion Details.
- **Named files:** `ROUTE.EXCEPTION`. **Named report token:** `S$TE_MAINIF_RMV`
  (*Orders Removed from Manifest*).

---

## G. Sequencing rules

1. Enter warehouse + date + route → **auto-build** (new) or **auto-update** (existing) prompt; answer
   No to key documents manually (F183).
2. Add order to manifest → **order inaccessible to other processes** (F177).
3. Release for completion → **order cannot be removed from the manifest** (F177).
4. Remove from an *existing* manifest → reason code prompt *(if both settings configured)* →
   exception logged to the removal report (F178). **Removal during creation: no prompt.**
5. Complete manifest → orders with **no reserved merchandise are dropped, left open, and commented**
   (F179); every remaining item may raise a `ROUTE.EXCEPTION` (F180).
6. Complete manifest → Save → **Order Completion Details**.
7. All items not delivered → **Manifest Not Delivered Reason Screen** on Save (F186).
8. Pieces Not Complete → return to storage / release / **convert to As-Is with a reason code** (F186).
9. Single delivery order selected during manifest completion, **or** Enter a Sales Order with
   `Print Delivery Ticket` + `Completion Type` = Delivery → **Confirm All Serial Numbers** (F187).

---

## H. Open questions and gaps

### Gated or unreachable

- `Print a Manifest` · `Order Completion Details` · `Reason Code Settings` ·
  `Create a User/Group Actions - Logistics Security` · `View Deliveries on Manifests` ·
  `View AWM Activity` · `Volume Calculation` · `Schedule and Build a Transfer Manifest` ·
  `Create an As-Is Kit` — all named this batch, none read. Queued.
- **`Hold Code Settings`** — still the highest-value unread article. Batch 4.

### Documented but ambiguous

- **`S$TE_MAINIF_RMV`** — the token contains `MAINIF`, which reads as a typo for `MANIF`. Recorded
  verbatim; **we do not know whether the typo is in the documentation or in the product.**
- **`Release Pieces Not Completed`** — releases pieces *to what state*? Not stated.
- **Bulk completion of a manifest that needs a reason code or COD** — `Complete Multiple Manifests`
  offers neither field. What happens is not documented.
- **Whether `ROUTE.EXCEPTION` retracts** when a failed delivery is later completed — i.e. whether it
  is a work queue or an append-only log like the sales exception file (run 03 F154). Unstated.
- **`Carrier`, `Technician`, `Staging Area`** — fields on the manifest build screen, never explained.
  `Carrier` suggests third-party delivery; `Staging Area` suggests warehouse zoning.
- **`Bank` on manifest completion** — presumably where COD cash is deposited; not stated. Ties to
  run 03 F38's `BANK` record.
- **Route vs truck** — evidently parallel associations with different consequences (F185). The model
  is not stated.
- **Logistics page vs Logistics tab** — the same settings surface named two ways.

### Inferences (recorded as inference, not fact)

- **I-23:** `Bank` on manifest completion is probably the deposit destination for `Collected` COD
  amounts, linking to run 03 F38's `BANK` record. *No article says so.*
- **I-24:** `ROUTE.EXCEPTION` is probably append-only like the sales exception file, given both are
  called exceptions and both feed reporting rather than a work screen. *Explicitly an inference —
  run 03 F154 showed two "exception" mechanisms in this ERP behave oppositely, so this could be
  wrong.*
- **I-25:** `Staging Area` is probably a warehouse sub-location used to marshal a truck's load.
  *Purely from the field name.*

---

## I. Unknown unknowns

- **Access control by document state.** F177 is not a permission — it is a lock created by putting a
  row in a table. Our twenty-mechanism count only covers *permissions*. There may be a whole second
  family of state-based locks we have been reading past for four runs. This is worth a deliberate
  re-read of earlier batches once the run is done.
- **Advisory-only cross-document coupling.** F184's warnings end in "Continue?". If STORIS's house
  style is to notify rather than enforce, then **the business's data almost certainly contains the
  results of people clicking Continue.** Migration will surface those.
- **The optional manifest.** F183 says the whole manifest step is optional. How much of this
  section's machinery LA Mattress actually uses is unknown, and the lock semantics in F177 make it a
  consequential question.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Manifest** | The truck-day document, keyed (location, date, route); locks its orders out of other processes |
| **Auto-build / Auto-update** | System assembly of a new / existing manifest, prompted |
| **Released for completion** | Point after which an order cannot leave its manifest |
| **`ROUTE.EXCEPTION`** | File of manifest completion exceptions; retention on the Logistics page |
| **`S$TE_MAINIF_RMV`** | Report token — Orders Removed from Manifest *(spelling verbatim)* |
| **COG** | Customer's own goods — on the truck, never in inventory |
| **Not Complete** | Piece status after a failed delivery; can be returned, released, or made As-Is |
| **Auto transfer** | A transfer created to serve a sales order; coupled to it across manifests |
| **Staging Area / Carrier / Technician** | Manifest build fields, unexplained |
| **Extended security settings** | A second layer within Logistics Security |

---

## Contract adjudication — batch 2

| Contract | Verdict | Basis |
|---|---|---|
| **W-039** *(exceptions)* | **CONFIRMED** | Removal exceptions and `ROUTE.EXCEPTION` (F178, F180) |
| **W-042** *(cross-document propagation)* | **CONFIRMED as advisory** | Transfer↔sales-order manifest warnings end in "Continue?" (F184) — consistent with run 02's contradiction: STORIS notifies, it does not propagate |
| **W-050** *(access control)* | **CONFIRMED, plus a new *kind*** | `Delete an Entire Manifest` (F189); manifest membership as a state lock (F177) |
| **W-055 / W-056** *(reservation)* | **CONFIRMED** | Unreserved orders are dropped at completion (F179) |
| **W-061** *(cost)* | **relevant** | Failed deliveries can be converted to As-Is, a repricing event (F186) |
| **W-064** *(retention)* | **CONFIRMED** | Fifth chain: `ROUTE.EXCEPTION` / `Manifest Exception Retention` (F180) |
| **W-012** *(dates)* | **CONFIRMED** | `Restrict Scheduled Date` gates completion too |
| **Third-party logistics** | **NEW, extended** | `Carrier` on the manifest (F172, batch 1) |
| **Customer's own goods** | **NEW — no contract covers it** | F182 |

---

## Next — batch 3: trucks, stops, routing, capacity

Load a Truck · Manually Assign an Order to a Truck · Truck Load Stop Detail · Stop Detail Screen ·
View Route Information · View Detailed Route Information · View Routing Capacity Log · View Trailer
Volume Capacity Levels.
