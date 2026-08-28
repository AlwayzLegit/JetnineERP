# RUN 04 — STORIS `Inventory Management` (Logistics / Delivery) — Run Summary

**Scope:** the `Inventory Management` category — 280 articles across five subsections. There is no
`Logistics` section in STORIS; the run-queue entry "Logistics/Delivery" maps here, where the
physical-movement half of the ERP lives. **Method:** the wiring audit defined in
`BROWSER-AGENT-HANDOFF.md` and `KICKOFF-PROMPT.md`. **Output:** 11 batch files, **findings 165–290
(126 findings)**, this summary.

**Read-only throughout.** No form submitted, no setting saved, no process run, no report executed, no
scan performed, no inventory frozen or cleared, no manifest built or completed. This is the
write-heaviest section of the help centre — it documents manifest building, truck loading, barcode
batches, physical counts and stock adjustments — and every one of those articles was read as
documentation only. No page presented as a live application.

**One caveat governs everything below.** Six times in this run, a licensed module was found to change
base behaviour rather than add to it — removing a process (F190), changing a resolution order (F175),
changing which records a batch touches (F185), narrowing the scope of a credit control (F212), and
splitting routing into three incompatible configurations (F206, F214). **This audit describes the
documentation, not necessarily LA Mattress's installation.** Every finding is conditional on a licence
and settings set we have never seen.

---

## A. Coverage log

| Subsection | Articles | Batches | Read in full | Disposition |
|---|---|---|---|---|
| **Fulfillments** | 27 | 1–4 | **27** | complete |
| **Barcode** | 84 | 5–7 | 10 | 84 inventoried, 74 classified with stated reasons |
| **Transfers** | 22 | 8 | 4 | 22 inventoried |
| **Inventory** | 44 | 9–10 | 8 | 44 inventoried |
| **Inventory Views and Reports** | 103 | 11 | 6 | 103 inventoried, 97 classified |
| **Total** | **280** | **11** | **55** | **280 inventoried; no article skipped silently** |

Linked articles outside the category were followed per the handoff rule — into `Credit Hold Codes
List (AR)` (Overviews → References), `Hold Code Settings` (System Administration), and the Point of
Sale, Inventory Control, Warehouse/Store Location and Accounts Receivable settings records.

| File | Findings |
|---|---|
| `00-COVERAGE-QUEUE.md` | scope, counts, batch plan |
| `BATCH-01-LOGISTICAL-SCHEDULING-CORE.md` | 165–176 |
| `BATCH-02-MANIFEST-LIFECYCLE.md` | 177–189 |
| `BATCH-03-TRUCKS-STOPS-ROUTING-CAPACITY.md` | 190–200 |
| `BATCH-04-HOLDS-DIRECT-SHIP-INTERFACES.md` | 201–213 |
| `BATCH-05-BARCODE-AWM-PHYSICAL-INVENTORY.md` | 214–226 |
| `BATCH-06-PUTAWAY-PICKING-RECEIVING-EXCEPTIONS.md` | 227–236 |
| `BATCH-07-RF-PICKING-FLOATS-BARCODE-SWEEP.md` | 237–248 |
| `BATCH-08-TRANSFERS.md` | 249–258 |
| `BATCH-09-INVENTORY-ADJUSTMENTS-COST-EXCEPTIONS.md` | 259–270 |
| `BATCH-10-AS-IS-RTV-LANDED-COST-SWEEP.md` | 271–280 |
| `BATCH-11-KARDEX-EDI-VELOCITY-SWEEP.md` | 281–290 |

---

## B. Ten headline findings

### 1. The complete credit hold catalogue — 22 codes, closing the audit's longest-standing gap *(F201, F202)*

`Credit Hold Codes List (AR)` had been referenced across runs 01 and 03 and never read. It gives all
22 codes in seven families — **C** customer credit · **D** deposits and balances · **E** exchanges ·
**F** financing · **I** internet/eSTORIS · **S** signatures · **T** tax-interface failure — each with
its trigger and its governing setting. Holds are removed in two named routines, one of which
(`F4`) is restricted to a specifically permissioned user. Two codes clear themselves (`D2`, `I1`);
the rest need approval, and then the code persists **until the next End-of-Day** (run 03 F153).

**`T1` deserves its own line:** if the alternate tax provider errors, orders go on credit hold. A tax
outage stops shipping.

This also corrected three things the audit had recorded wrong — `F5`, `C6`, `D2` — and disproved its
own assumption that `Hold Code Settings` was the credit-hold table (it is an **AP vendor** hold table;
F203 names **four** unrelated hold namespaces).

### 2. Order-to-piece binding is deliberately loose *(F218, F220, F239, F242)*

A picker marking damage triggers a **silent, warehouse-wide replacement search** — the order gets a
different physical unit, with no exception, comment or approval. A physical count **reassigns sales
order reservations**. Damage found in prep pushes the line **back into picking** with a new piece.

**Our instinct to bind order lines to serial numbers early would break the picking, damage-handling
and counting models simultaneously.** STORIS binds late and rebrokers freely, and it is right to.

The search itself is documented nowhere — only its three call sites and its failure location
(`RESEARCH`). **Whether it can take stock reserved to another order is the most consequential
undocumented behaviour found in this run.**

### 3. As-Is is the disposition hub of the entire inventory model *(F280)*

Seven paths in — damaged pick, damaged in prep (`PFD`), failed delivery, floor-sample transfer,
physical count, vendor chargeback, direct adjustment. Three out — sale at the As-Is price, return to
vendor, write-off. **Return-to-vendor requires As-Is first** (F274), so As-Is is not a discount
category but the quarantine and disposition layer for everything leaving inventory abnormally.

Every path is also a **cost event**, and by run 03 F144 a cost change restates written sales orders.
The chain from *a picker dropping a headboard* to *a negative-margin adjustment on last month's
sale* is fully documented across seven articles in four subsections — **and stated in none of them.**

### 4. The manifest takes an exclusive, system-wide lock *(F177, F170, F179)*

> "Once you add an order to a manifest, you cannot access the order using other processes."

Not read-only — inaccessible. After release for completion it cannot even leave the manifest. Only
`Contact Status` and `Time` remain editable, and only with a named Logistics Security clearance.

The corollary is operational: **everything that must happen to an order has to happen before it is
manifested.** And at completion, orders with no reserved merchandise are **silently dropped, left
open, and given a comment** — the only trace of a real and common failure.

### 5. Hold quantity and reserved quantity are orthogonal *(F192)*

> "The Hold quantity may or may not be reserved."

Dropped in a subordinate clause on a stop-detail screen. The audit had been modelling hold as a kind
of reservation. It is a separate pool, which is why the scheduling grid reports them in separate
columns (F168) — and that grid decomposes "can this ship" into **ten orthogonal flags**, two of which
are inverted or near-identical-but-for-intent. We would have collapsed them into one status.

### 6. Physical inventory is a hard-sequenced, partly irreversible eight-phase process *(F219–F222)*

**Active cost exceptions block the freeze** — stated three times across two articles, with the named
remedy. That closes run 02's central chain from the inventory side: *uncertain PO cost → type-4 cost
exception → blocks the annual count → when worked, restates already-written sales orders.* **One
unworked queue stops the inventory close and silently moves last quarter's margin.**

The update performs **seven named actions including GL adjustments and reservation reassignment**, it
**must precede Generate Monthly Reports** or the freeze date becomes unreachable, and the clear is
irreversible with no permission on it.

### 7. Twenty-plus access mechanisms resolve into a convention plus five *kinds* *(§E below)*

`Create a User/Group Actions - <Module> Security` is a **naming convention** instantiated per module
(Sales, Receivables, Logistics), not a set of unrelated systems — which corrects the emphasis of
earlier runs. Around it sit **five distinct kinds** of control: user permissions · Regional Processing
· **state-based locks** (manifest membership, aisle locks, order exclusivity) · **location-pair
matrices** (transfer security tables) · **value-attached restrictions** (As-Is Restricted reason
codes). Only the first is what a rebuild would naturally build.

### 8. Physical-world logic that no data model would produce *(F229, F239, F240, F244)*

**Aisle locking** is a real mutex — acquired by scanning, exclusive, released two ways, with a
supervisor screen that exists because locks get stranded. **Pick dispatch is by reverse stop time**,
because a truck is a stack. **Floats** are tagged physical carts with a link table and a
reconciliation screen. **`X` (RF Shuffle)** does an inline bin-to-bin transfer to clear stock blocking
a pick.

The nine-code scanner vocabulary (`NIL` `DG` `SKIP` `AS` `PS` `SP` `X` `0` `E`) is the real user
interface of the warehouse, and **none of it would survive a rebuild designed from the schema.**

### 9. EDI is an integration layer, not a logistics feature *(F284, F287, F254, F172)*

At least eight document types — 215 pickup manifest, 214 shipment status, advance ship notice,
functional acknowledgement, invoice, PO acknowledgement, PO ship acknowledgement, status details —
each with its own exception report, spanning purchasing, logistics and the warehouse. Handling method
codes are **externally constrained** by the 3PL's 215 codes. A dedicated filter finds pickup manifests
the carrier never acknowledged.

With four named routing vendors, a WMS boundary, an unnamed fraud-analysis vendor and an alternate tax
provider whose failure holds orders, **a consolidated external-dependency inventory is now a required
deliverable.**

### 10. STORIS's answer to "what if the automatic thing gets it wrong" is a report *(F290)*

Eight independent instances: putaway velocity drift · landed-cost estimate variance · unacknowledged
215s · WMS errors · RF picking errors · manifest exceptions · physical-inventory As-Is and commitment
exceptions · route over-capacity. **The system computes, records, detects divergence, and hands it to a
person.** That is why there are 103 articles of inquiries and reports for 177 of doing.

A modern system would enforce, retry or auto-correct most of these. **Each one we automate away is a
workflow somebody currently owns**, and that belongs in the cutover plan rather than the backlog.

---

## C. Screen and field inventory

Approximately 45 screens catalogued with verbatim field names across the eleven batch files. Two
caveats now apply to the whole inventory: **screen composition is configurable** (Dynamic Tab
Settings, dynamic escapes) and reaches the core — **the Kardex itself is a DTS inquiry** (F281) — and
**licensed modules remove screens**. The inventory is a lower bound.

## D. Control settings catalog

Records touched: **Point of Sale Control Settings** *(a `Logistics` page, six named fields; still
unenumerated after four runs)* · **Warehouse/Store Location Settings** *(ten-plus fields across
`Bar Code`, scheduling and manifest tabs; referenced from six batches, never read)* · **Inventory
Control Settings** *(Additional Settings tab; `Maximum Percentage Reduction`, `Serial Number
Tracking`, `Track Bin to Bin Transfers`, `Kardex History Months`)* · Route Capacity Control Settings ·
Route Mapping Control Settings · Costing Control Settings · Reason Code Settings · Status Code
Settings · General System Control Settings · Tracked Storage Location Settings · Distribution Status
Settings · Third Party Logistics Settings · EDI Control Settings · AWM Function and Exception Type
Settings · Alert Code Settings · Credit Card Payment Settings · Credit Application Control Settings ·
Revolving Payment Plan and Receivables Control Settings · Finance Provider Settings · Web Control
Settings · Special Order Control Settings · Customer Settings · Vendor Settings.

## E. Security permissions catalog

`Create a User/Group Actions - Logistics Security` — **seven named fields**, including
`Update Status and Stop Time for an Order on a Manifest` · `Delete an Entire Manifest` ·
`Override capacities when scheduling routes that are full` · `Adjust inventory quantities within
stock adjustment entry` · `Transfer merchandise within stock adjustment entry` · `Adjust Stock
Directly to As-Is` · `Enter a Stock Adjustment - Change Special Order Detail on a Specific Piece`.
Plus **Extended Security settings** (cross-module: over-receiving, WMS adjustment, vendor
chargeback, product cost visibility), Sales Security (`Approve E1…`), Receivables Security
(`Approve F4…`), and `manager override credentials` as an undocumented in-the-moment alternative.

**Regional Processing** upheld as *inverted* six times, twice on warehouse-floor routines.

## F. State machines and enumerations

- **AR credit hold codes (22)** in seven families — F201.
- **Hold namespaces (4):** AR credit · AP vendor · PO `On Hold` · delivery/merchandise hold.
- **Scheduling grid flags (10)** plus Status, OO — F168.
- **Fulfillment statuses:** `CWC` · `ASAP` · Estimated · Scheduled *(`SCD`/`SCH` drift unresolved)*.
- **Warehouse pipeline (5 stages):** Pick → *(Interim)* → Prep → Stage → Load; **four schedulable**.
- **Scanner command vocabulary (9)** — F239.
- **AWM task types (9)**; **RF exception types (5, closed):** `DMG` `NIL` `DPICK` `DPREP` `DSTAGE`.
- **Barcode architectures (5):** Batch · RF · Store · POS Scanning · AWM. **Only RF picks.**
- **Cost exception types (4, closed)** — confirmed verbatim at source, F261.
- **Named GL accounts (3 new):** Inventory Value · Inventory Adjustment · Landed Freight Asset.
- **Named files (3 new):** `ROUTE.EXCEPTION` · `Picking file` · Kardex.
- **Retention chains (7th and 8th):** `Kardex History Months` · `Purge Days for EDI 215 Transaction
  Logs`. **The run 03 F160 rule has now held without exception across four runs.**
- **Magic locations:** `RESEARCH` · `DOCK` · `DPREP` · `DLVINT` · truck · loading · staging.
- **Reason codes carry behaviour:** As-Is Restricted · "in service" — they are gates, not labels.

## G. Sequencing rules

1. Setting fires → hold applied → permissioned approval → **removed at the next EOD**.
2. Print a delivery ticket *(one of exactly two routines)* → items enter picking.
3. *(Optional)* **FINAL pick list print reserves merchandise** — reservation timing is a setting.
4. Pick → drop *(interim/prep/stage per four settings)* → prep → stage → load.
5. Manifest built → **order locked out of all other processes** → released → completed.
6. Completion drops unreserved orders silently, with a comment.
7. Receipt → **directed putaway** by velocity and storage category → drift reported later.
8. Over-receipt → PO comments and buyer mail now → **PO ordered quantity rewritten at receipt**.
9. Cost exception raised → blocks the physical inventory freeze → corrected → restates written sales.
10. Freeze → count → **update before Generate Monthly Reports** → clear *(irreversible)*.
11. As-Is → return-to-vendor list → `returned-not-recorded` opens → AP bill → closes.
12. 215 sent → 214 returned → reconciled; unacknowledged found by a dedicated filter.

## H. Open questions and gaps

**Unread after four runs, in priority order:** `Costing Control Settings` · `Warehouse/Store Location
Settings` · `Point of Sale Control Settings` · `Alert Code Settings` · `Assign Specific Pieces At`
values and `Print Pick List` semantics *(jointly, the reservation-to-piece model)* ·
`Update a Product Cost` / `Average Cost` · `Directed Putaway Processing Overview` · `EDI Control
Settings` · `Tracked Storage Location Settings` · `Inventory Formations Overview`.

**Unreachable:** `Multi-Legged Transfers Flow Chart Overview` has **no readable text** — the model is
a flow-chart image. Recorded as unreachable, not inferred.

**Documented but ambiguous:** the warehouse-wide replacement search *(three call sites, no
description)* · `Velocity` and `Storage Category` values · `Distribution Method` values · whether
As-Is Restricted is enforced in `Mass Inventory Update` · the internal mail system · crossdocking ·
multi-currency scope · `S$TE_MAINIF_RMV`'s apparent typo · `SCH` vs `SCD`.

**Undefined terms carried out:** fly-by fulfillment · Staging Area · Float Label · phantom ·
`Ship Direct` on a transfer · `CFO Fields` · `Repossession Maximum $` · Inventory Formation ·
Product Family · `Bypass Interim` · `Times per Day`.

**Inferences I-20 to I-49**, recorded per batch. **Confirmed in-run:** I-34. **Corrected in-run:**
I-22, I-37. **Downgraded in-run:** I-16. Two batch-level readings were also corrected: batch 3's
Regional Processing absence (by F236) and batch 4's reading of Extended Security as
logistics-specific (by F228).

## I. Unknown unknowns

- **Composition reaches the core.** The Kardex is a DTS inquiry. Screen reachability is configuration
  in at least two independent ways. Our four-run screen inventory is a lower bound at the centre, not
  just the edges.
- **Two independent ways for a product to have no movement history** (`Inventory Tracking` off;
  `Track Bin to Bin Transfers` off), both invisible from inside the history — and by F259 the Kardex
  is the *only* record of why inventory moved.
- **A third-party WMS can own a location**, in which case most of batches 5–7 does not apply there.
  We have never asked whether LA Mattress runs one.
- **An internal messaging system**, sighted once, in one clause about mailing a buyer.
- **Foreign currency**, sighted once, on a landed-cost screen.
- **A fraud and behavioural-risk subsystem** (`Alert Code Settings`, an unnamed fraud vendor),
  surfaced only through two rows of a hold-code table.
- **Step-by-step operating procedures are the highest-yield source in this corpus** — higher than
  settings articles. `RF Picking for Deliveries` alone produced twelve findings. The audit should
  weight them accordingly in runs 05 and 06.

## J. Glossary

Consolidated across the batch files. Key additions: Manifest · Float · Interim/Prep/Stage/Load ·
AWM · RF Shuffle · reverse stop time · aisle lock · `RESEARCH` · `PFD` · directed putaway · crossdock ·
velocity / storage category · Kardex · As-Is Restricted · WMS Tag ID · EDI 214/215/997 ·
Shared Capacity Code · Trailer Capacity · Dynamic Escape · Handling Method · Extended Security.

---

## Contract adjudication — run 04

| Contract | Verdict |
|---|---|
| **W-005 / W-006** *(receiving, direct ship)* | **CONFIRMED** — bulk direct-ship completion by PO and vendor (F205); over-receipt rewrites the PO (F228); partial receiving is first-class (F225) |
| **W-012** *(dates and periods)* | **CONFIRMED** — two-record scheduling horizon (F165); count update must precede EOM (F221); EOD releases holds |
| **W-024** *(holds)* | **CONFIRMED — the contract can be closed.** Complete 22-code catalogue with triggers, settings, removal routines and permissions (F201–F203) |
| **W-034** *(deletion, irreversibility)* | **CONFIRMED** — four irreversible steps, three unpermissioned (F222, F225, F255, F259) |
| **W-039** *(exceptions)* | **CONFIRMED and broadened** — nine EDI, plus WMS, putaway, RF, manifest, capacity and count exception surfaces (F290) |
| **W-041** *(cost exceptions)* | **CONFIRMED at source** — four types verbatim; freeze block stated three times (F219, F261) |
| **W-042** *(propagation)* | **CONFIRMED, and the rule is now readable across four runs: derived documents propagate; associated documents notify** (F249, with F184, F209, F228) |
| **W-046** *(vendor rebates / chargebacks)* | **CONFIRMED, but the naming is a three-way open question** (F270) |
| **W-050** *(access control)* | **inverted — upheld six times.** A per-module naming convention plus five distinct *kinds* of control (§E) |
| **W-052 / W-053** *(GL)* | **CONFIRMED — an actual journal entry** (F260); Kardex running balance (F283); count update posts to GL (F220) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED and materially extended, repeatedly** — hold ⊥ reserved (F192); reservation timing is a setting (F238); automatic re-sourcing at three stages; ATP as a ninth definition; distribution status can forbid transfer (F252) |
| **W-061** *(cost and margin)* | **CONFIRMED and extended** — piece-level cost layers (F262); estimate/actual landed-cost reconciliation loop (F271); multi-currency (F272) |
| **W-064** *(retention)* | **CONFIRMED — seventh and eighth chains** (F282, F287) |
| **NEW — no contract covers these** | third-party logistics and EDI · licensed modules altering base behaviour · warehouse labour scheduling (AWM) · warehouse concurrency control · directed putaway · crossdocking · containers (floats) · customer's own goods · third-party WMS · location-pair security · value-attached restrictions · multi-currency · shared route capacity · estimate/actual reconciliation loops · synthesised intermediate transactions · screen composition confirmed at the core |

---

## If we rebuilt Logistics and Delivery from only what we read, what would we get wrong?

We would build a system that is correct about data and wrong about matter.

The clearest example is the piece. Our instinct — everyone's instinct — is to bind an order line to a
specific physical unit as early as possible, because that is what makes inventory trustworthy. STORIS
does the opposite, deliberately, and three separate mechanisms depend on it: a picker marks a piece
damaged and the system silently swaps in another one; a physical count re-points reservations
wholesale; damage found in prep pushes the line back into picking with a different unit. **The order
is entitled to *a* piece, not *that* piece.** Bind early and picking, damage handling and counting all
break at once — and the replacement engine that makes it work is documented nowhere, only called from
three places.

We would also underestimate how much of this module is about physical constraint rather than data
integrity. Aisles are locked because two people cannot share an aisle with pallet jacks, and there is a
supervisor screen because pickers walk off and strand the lock. Picks are dispatched in reverse stop
time because a truck is a stack. Floats exist because you need something to put things on, and there is
a screen to remove pieces from a float because float contents drift from reality. A picker types `X`
to do an inline bin-to-bin transfer because stock is physically in front of other stock. **None of that
emerges from a schema, and all of it is load-bearing.** It has to come from procedures like
`RF Picking for Deliveries` or from talking to people — which is the strongest argument for reading the
step-by-step articles rather than the settings screens.

We would get As-Is badly wrong. It reads like a discount category and it is actually the quarantine and
disposition layer for everything leaving inventory abnormally — seven documented paths in, three out,
return-to-vendor gated on it, and every path a cost event that reaches back into already-written sales
margins. Model it as a price flag and there is no place for damaged goods, no vendor return, no
write-off, and no explanation for last quarter's negative margins.

We would automate away the reports. Eight times in this run, STORIS's answer to a computation going
wrong is a report that a person works: velocity drift, landed-cost variance, unacknowledged carrier
acknowledgements, WMS errors, RF picking errors, manifest exceptions, count exceptions, route
over-capacity. A modern system enforces or retries most of those. **Each one we remove is a job
somebody currently does**, and the right response is a cutover conversation, not a design decision made
quietly.

And we would collapse things that STORIS keeps apart for good reasons. Hold quantity is not a kind of
reservation. The scheduling grid's ten flags are not one status. The four things called "hold" are four
namespaces. The two things called "exception" behave in opposite ways. Three things are called
consolidation, at three stages, with three keys. Every one of those distinctions is stated once, often
in a subordinate clause, and every one of them is real.

The honest summary of run 04: **the documentation is a good specification of screens and a poor
specification of matter.** The most important structures — As-Is as a hub, the replacement engine, the
cost-exception chain from receiving dock to income statement — are not described in any single article.
They exist only as the shape left behind when you read all of them.

---

*Run 04 complete. Next: run 05 — Customer Service.*
