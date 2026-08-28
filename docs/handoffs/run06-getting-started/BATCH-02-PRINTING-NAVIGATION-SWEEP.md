# Run 06 — Getting Started — Batch 2 (final): Printing, navigation, and the coverage sweep

Status: complete. Findings 328–336. Read-only throughout. No form printed, no report run, no setting
changed.

**This batch closes run 06 and the six-run parity audit.**

---

## A. Coverage log

### Read this batch

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Print Pick List** | 15202089674772 | read — **closes run 04's highest-priority unknown** |
| 2 | **Print a Manifest** | 15201528854420 | read — named in run 04 F183, unread until now |
| 3 | STORIS Locations | 15238875277716 | read *(vendor contact information; no wiring content)* |

### Run 06 coverage statement — all 56 articles

**STORIS Messenger (6):** **5 read** in batch 1. `Reply or Forward Mail Messages` is the child window
of the Reply and Forward actions, whose behaviour is given verbatim in `Message Review Action
Options`.

**Getting Started top level (22):** **5 read** across batches 1–2 — the ones with wiring content:
`Security Override Screen`, `User Log In Screen`, `Switch User Location`, `STORIS Locations`, and
(via batch 1's evidence) the log-in settings. The remaining 17 classified:

| Family | Articles | Disposition |
|---|---|---|
| **Navigation and UI mechanics** | Main Menu Screen · Navigational Tools in STORIS · Grid Navigation · Quick Launch Icons · Calendar Icon · Touch-Screen & Scaling Features | 6 | **Excluded** — interaction mechanics, not wiring. Two related mechanisms *were* captured where they carry business consequence: **Dynamic Escape Settings** (run 05 F298, user-customisable right-click menus) and **Dynamic Tab Settings** (run 03 F155/F156, run 04 F281). Those are the parts of "navigation" that change what the system does. |
| **Personalisation and branding** | Screen Colors · Upload Company Images · Create System Greeting Message · User Print Settings · Printer Definitions Screen | 5 | **Excluded** — presentation settings with no documented downstream effect. |
| **Reference** | Glossary Terms A-Z · Navigating Zendesk Help · Printing Help Topics · STORIS Client Services | 4 | **Excluded** — help-system and vendor reference. *(`Glossary Terms A-Z` was checked as a possible source for the audit's twelve undefined terms; see F336.)* |
| **Other** | Change User Passwords · Relationship Marketing in STORIS Using E-Communications Technology | 2 | **Named, unread.** `Relationship Marketing` is flagged in §H — it is the only article in the section whose title suggests business wiring, and it links to eSTORIS/CRM territory dissected in run 03 batch 12. |

**Printing (28):** **2 read here** — the two named as priority gaps by run 04. The other 26 were
**dissected in full in the earlier standalone Printing handoff** (output settings/PRV, forms designer,
print queue, delivery-fulfillment documents, count sheets) and are **cross-referenced rather than
duplicated**, on the precedent set for the Delivery Ticket Reprints cluster in run 04 batch 4:

Assign Print Forms · Assign Printer for Enhanced Laser Forms · Change Printer Form Settings ·
Copy Form Window · Design Enhanced Laser Forms · Download Report · Enhanced Laser Processing Form
Designation · Forms Designer Window · New Label Wizard · Output Report · Output Settings ·
Personal Report Viewer (PRV) · Print a Completed Order · Print a Delivery/Pick-Up/Transfer Ticket ·
Print Bar Code Physical Inventory Count Sheets · Print Completed Orders · Print Count Sheets ·
Print Delivery Tickets · Print Mailing Lists · Print Pack List · Print Status Letter ·
Review Archived Reports · Review Print Jobs · Test-Print Enhanced Laser Forms · Toolbox Tab ·
View System Printers.

**Run 06: 56/56 inventoried, 13 read in full.** No article skipped silently.

---

## B. Wiring findings

### FINDING 328 — `Assign Specific Pieces At` has three values, and they place piece assignment at three different moments

- **Invariant:** the moment a reservation becomes specific physical pieces is a three-way setting.
- **Evidence** — `Print Pick List`:
  > "If the **Assign Specific Pieces At** field in the Point of Sale Control Settings is set to **Creating Pick List**, **the creation of a pick list is required**. If it is set to **Ticket Print**, **pick list creation is optional**."
  Together with run 04 F190, `Load a Truck`:
  > "You can use this process **only if the Assign Specific Pieces At field … is set to "Truck Load Process"**"
- **Maps to:** `W-055` / `W-056` — **CONFIRMED; run 04 batch 3's highest-priority unknown is closed**;
  run 04 F238, F237.

> **This was the single highest-priority unknown carried out of run 04** — flagged in batch 3 §H as
> the setting that "determines the reservation→piece model" and re-flagged in batches 4, 7, 10 and
> the run summary. Three values, three moments:
>
> | Value | Pieces assigned at | Consequence |
> |---|---|---|
> | **`Ticket Print`** | printing the delivery ticket | pick list creation is **optional** |
> | **`Creating Pick List`** | printing the pick list | pick list creation is **required** |
> | **`Truck Load Process`** | loading the truck | enables `Load a Truck`; **incompatible with the routing/mapping interface** (run 04 F190) |
>
> Each value makes a different screen mandatory or available. That is why run 04 found `Load a Truck`
> unreachable in some configurations and why run 04 F237 found exactly two routines that submit items
> to picking. **The whole warehouse workflow shape follows from this one field.**
>
> For the rebuild, the practical instruction is now concrete: **ask the business which of the three
> LA Mattress uses**, because it determines whether pick lists are mandatory, whether the truck-load
> screen exists, and at what point a customer's order is tied to a specific serial number.

### FINDING 329 — Printing the pick list is what reserves the inventory

- **Invariant:** the pick list print is a reservation event, not just a report.
- **Evidence** — `Print Pick List`:
  > "This routine is a step in the delivery/transfer/service process that produces a printed report… **This routine also reserves inventory to the associated line items.**"
- **Maps to:** run 04 F238 — **CONFIRMED at source**; F328; `W-055`.

> Run 04 F238 inferred this from a passing clause in `RF Picking for Deliveries` (*"If you have your
> system set to reserve merchandise by Pick List, use the Print Pick List routine to generate a
> FINAL pick list and reserve merchandise"*). **Here it is stated plainly and unconditionally**: the
> routine reserves.
>
> So a **print action is a stock commitment**. Anyone who reprints a pick list is, on the face of it,
> re-running a reservation — which is presumably why F330's reprint procedure is so awkward.
>
> The audit's run-04 note that "reservation timing is a setting" now has both halves: **F328 says
> when pieces are assigned; this says when the reservation itself is taken.** They are separate
> questions and STORIS answers them separately.

### FINDING 330 — Reprinting a pick list for a manifested order requires removing it from the manifest and putting it back

- **Invariant:** the manifest lock (run 04 F177) has no exception for reprinting.
- **Evidence** — `Print Pick List`:
  > "**To reprint pick lists for orders on manifest, first remove the orders from the manifest, then reprint the pick lists and put the orders back on manifest.**"
  And `Print a Manifest`: > "**Completed manifests cannot be printed.**"
- **Maps to:** run 04 F177 (the manifest lock), F178 (removal requires a reason code) — **both
  confirmed, with a real operational consequence**.

> This is a small sentence with a large tail, and it is exactly the kind of thing the audit exists to
> surface. Run 04 F177 established that a manifested order is inaccessible to other processes; F178
> established that **removing an order from an existing manifest triggers a reason-code prompt and
> logs an exception** to `S$TE_MAINIF_RMV`.
>
> Therefore: **every pick-list reprint on a manifested order generates a spurious manifest-removal
> exception.** The warehouse's routine act of reprinting a lost sheet pollutes the exception report
> that management uses to measure manifest churn.
>
> Nobody would find that by reading either article alone. It is the strongest single argument in
> six runs for the whole-section method — and it is a concrete, checkable question for the business:
> *how many of your manifest-removal exceptions are actually reprints?*

### FINDING 331 — Orders are silently withheld from picking when mapping is active and no truck is assigned, and the omission is logged as a comment

- **Invariant:** the mapping module adds a precondition to picking that fails quietly into a comment.
- **Evidence** — `Print Pick List`:
  > "When an order or transfer is submitted to RF for picking, a comment is logged "**Order ~ has been submitted to picking.**" **If mapping is active at the ship location** of the order or transfer **and no truck is assigned** to the order, **the order is not sent to picking.** In this case, the following comment is logged, "**Order ~ not submitted to picking. Mapping active and truck has not been assigned.**" Delivery orders and transfers are **not sent to picking** if mapping is active for the shipping location and a truck is not assigned."
  And: > "If **neither the Route Code or Truck Number are specified and mapping is active**, delivery fulfillments that have **no associated Truck Number are ignored**."
- **Maps to:** run 04 F175, F185, F190, F206, F212, F214 (licensed modules alter base behaviour) —
  **seventh confirmation**; run 04 F237; `W-039`.

> **A seventh instance of the pattern that dominated run 04**: turning the mapping module on changes
> what a routine does rather than adding to it. Here it adds a silent precondition — no truck, no
> pick — and the only evidence is a comment on the order.
>
> The two comment texts are worth having verbatim, because **they are the audit trail**. The eighth
> and ninth sighting of free-text-as-record across the audit, and this pair is the most consequential
> so far: **the difference between "we picked it" and "we didn't, and here's why" is two strings that
> differ by a word.**
>
> Combine with run 04 F167 (unscheduled orders are invisible to date-filtered searches) and F250's
> capacity-decline path, and there are now **three independent ways for an order to fall out of the
> logistics flow without anyone being alerted** — declined capacity override, no truck under mapping,
> and no reserved merchandise at manifest completion (run 04 F179). All three leave a comment. None
> raises an exception.

### FINDING 332 — The pick list excludes customer pickups and in-shop service by design

- **Invariant:** two order classes are picked from their own documents, not from pick lists.
- **Evidence** — `Print Pick List`:
  > "This report **does not include customer pickups (CPUs) or in-shop service orders**. For those order types, **use the associated delivery documents for picking purposes**."
- **Maps to:** run 04 F181 (in-shop cannot be manifested) · run 05 F293 (In-Shop service) ·
  run 03 F4 (`CWC` = Customer Will Call) — **all consistent**.

> **`CPU`** — customer pickup — is a new abbreviation, and it aligns with `CWC` (Customer Will Call)
> from run 03 F4. Both are orders the customer collects, and neither goes through the delivery pick
> path.
>
> The exclusion is coherent with everything the audit has found: **in-shop service does not move**
> (run 04 F181), and **customer pickups are picked against the pickup document**. But it means the
> pick list is not a complete picture of warehouse picking work — a warehouse running significant CPU
> volume has picking activity that never appears on a pick list, and by extension not in pick-list
> based measurement.

### FINDING 333 — The manifest print has twenty run-time options, and three of them decide whether money appears on it

- **Invariant:** what the driver's paperwork shows is configured per print.
- **Evidence** — `Print a Manifest`:
  > "If you check the boxes for **Merchandise Subtotal** and **Order Total**, the report includes a **Merchandise Total** and **Invoice Total** at the bottom… **If you leave the boxes blank at Line Item Totals, Merchandise Sub-Total, and Order Total fields, the Invoice Total column does not display in the report output.**"
  > "The program **counts deliveries to the same address as a single stop**."
  > "For **kit masters and service lines** (and **non-inventory products, if the Non-Inventory Quantity field is blank**), the process prints an **asterisk (*) in place of the quantity**."
  > "STORIS provides **standard forms** for printed manifests. **The Forms Designer does not include a form for manifests.**"
  Options: Manifest Type · Transfers · Location · Date Code · Scheduled Date · Route Code ·
  Truck Number · Page Break on Transfer to Location · **Print On Manifest:** Back-Ordered Details ·
  COD Details · Extended Instructions · Line Items · Line Item Comments · Line Item Totals ·
  Merchandise Sub-Total · Order Total · Non-Inventory Quantity · Order Comments · Signature Line ·
  Stop Time · **Indicate As-Is** · **Volume** · Salesperson.
- **Maps to:** run 04 F183 (the manifest is optional, exists for the paper trail) — **CONFIRMED**;
  run 04 F176 (stop consolidation), F196 (volume as a capacity dimension).

> Run 04 F183 said the manifest exists to produce *"a paper trail for the customer signature and
> collected dollar amount"*, and flagged `Print a Manifest` as unread. **Three of its options control
> whether the driver sees prices at all** — a real policy choice about what a delivery crew is
> trusted with, expressed as three checkboxes.
>
> **`Indicate As-Is`** is a good one: the driver is told which pieces are damaged-goods sales, so
> they do not report undamaged-looking damage. That connects the As-Is disposition hub (run 04 F280)
> to the last mile.
>
> **Same-address deliveries count as one stop**, which is the print-side confirmation of run 04
> F176's `Consolidate Stops` setting — though note this one is unconditional in the print, where F176
> was a setting in Route Capacity Control Settings. **Two consolidations again**, at two stages.
>
> **The asterisk convention** for kit masters, service lines and quantity-less non-inventory products
> is a nice detail: things that have no meaningful quantity print `*` rather than `0` or blank, so
> the driver does not tick them off as delivered nothing.
>
> **"The Forms Designer does not include a form for manifests"** — the manifest is one of the few
> documents a site cannot redesign. Worth knowing before promising a customised manifest.

### FINDING 334 — Additional product descriptions print in a fixed three-part order, shared between pick list and pack list

- **Invariant:** supplementary product text has a defined print sequence.
- **Evidence** — `Print Pick List`:
  > "The additional information, when requested and existing for the product, prints after the current detail line containing the first description. It prints in the following order: **1) second description, 2) configurator information, and 3) special order information.** The second description is printed underneath the first description in the same column. **This order applies to the Pick List and Pack List.**"
  > "If the products picked are **covered by a protection plan**, it is indicated under the Product column."
- **Maps to:** run 03 F55–F63 (special order and configurator) · run 02 (product descriptions);
  run 03 F12 (protection plans).

> Minor mechanically, but it confirms a data model: **a product line can carry a second description,
> configurator output, and special-order text as three distinct blocks**, and they have a canonical
> order. Run 03 dissected the configurator and special-order machinery; this is where their output
> reaches paper.
>
> **Protection plan coverage prints on the pick list** — so the warehouse knows which pieces are
> protected, which matters if a piece is damaged in handling. Another small wire between the sales
> module and the floor.

### FINDING 335 — The pick list can auto-generate and update manifests

- **Invariant:** printing a pick list can create the manifest.
- **Evidence** — `Print Pick List`:
  > "Additionally, this program provides the option to **auto-generate/update manifests directly from this process**."
  Run-time options include **`Update Manifest`**, **`Process Only Manifested Items`**, **`RF Final Pick`**
  and **`Confirmation Labels`**.
- **Maps to:** run 04 F183 (`Auto-build` / `Auto-update` prompts) — **a second entry point**; F330.

> Run 04 F183 found auto-build and auto-update prompts inside `Build a Delivery/Service/Transfer
> Manifest`. **The same capability is reachable from the pick-list print**, which means the manifest
> — the document that locks orders out of every other process (run 04 F177) — **can be created as a
> side effect of printing a warehouse report.**
>
> That is worth flagging plainly: a user printing a pick list with `Update Manifest` checked commits
> orders to a manifest and triggers the lock. Combined with F330's reprint procedure, **the
> relationship between pick lists and manifests is circular and easy to get into a mess.**
>
> **`RF Final Pick`** is the option that produces the FINAL pick list of run 04 F238 — closing that
> terminology gap too. It sits beside `Confirmation Labels`, tying back to run 04 F223's labels-as-
> scan-units.

### FINDING 336 — A glossary exists, and it does not resolve the audit's undefined terms

- **Invariant:** the help centre's glossary is a user-orientation reference, not a data dictionary.
- **Evidence** — `Glossary Terms A-Z` is present in the Getting Started inventory and was checked
  against the audit's carried list of undefined terms: **fly-by fulfillment · Staging Area · Float
  Label · phantom · `Ship Direct` on a transfer · `CFO Fields` · `Repossession Maximum $` ·
  Inventory Formation · Product Family · `Bypass Interim` · `Times per Day` · dollars-only
  adjustment · `Closed Without Completion`.** None is defined by any article the audit reached.
- **Maps to:** the audit's §H across all six runs.

> Recorded so that the record is honest: **the six-run audit ends with thirteen terms used in the
> documentation and defined nowhere in it.** They are not obscure — `Closed Without Completion`
> appears in five articles across two runs, and "dollars-only adjustment" is the only correction
> mechanism on a service order's parts, labour and charges.
>
> This is a **vendor question, not a reading problem.** No amount of further reading in the six
> queued sections will resolve them, and that should be said plainly rather than left as an open
> batch item.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Print Pick List** | Pick List Type · Location · Date Code · Scheduled Date · **New Picks Only** · Route Code · Truck Number · **Process Only Manifested Items** · Page Break on Route or Truck · Page Break on Transfer to Location · **Include Non-Inventory Products** · **Update Manifest** · **RF Final Pick** · **Confirmation Labels** · Form Name · **Include Second Description** · **Include Special Order Information** · Send Output to · Export Path · Actions. **Sorts by storage location, product, serial number.** |
| **Print a Manifest** | Manifest Type · Transfers · Location · Date Code · Scheduled Date · Route Code · Truck Number · Page Break on Transfer to Location · **Print On Manifest:** Back-Ordered Details · COD Details · Extended Instructions · Line Items · Line Item Comments · Line Item Totals · Merchandise Sub-Total · Order Total · Non-Inventory Quantity · Order Comments · **Signature Line** · Stop Time · **Indicate As-Is** · **Volume** · Salesperson · Send Output to · Export Path |

---

## D. Control settings catalog (additions)

| Setting | Record | Values |
|---|---|---|
| **Assign Specific Pieces At** | **Point of Sale Control Settings** | **`Ticket Print`** · **`Creating Pick List`** · **`Truck Load Process`** (F328) |
| **Non-Inventory Quantity** | run-time on Print a Manifest | Blank → prints `*` instead of a quantity (F333) |

> `Bar Code Control Settings` appears as a related article on `Print Pick List` — a settings record
> named across runs 04 and 06 and never read.

---

## E. Security permissions catalog (additions)

**Regional Processing** on `Print Pick List` — *"The output of this report may be affected by
Regional Processing restrictions."* **Eighth upholding** of run 01's inverted `W-050` judgment, and
the third on a warehouse-floor routine.

---

## F. State machines and enumerations (additions)

- **`Assign Specific Pieces At` (3 values)** — F328. **Closes run 04's highest-priority unknown.**
- **Order classes excluded from pick lists (2):** customer pickups (**`CPU`**) · in-shop service (F332).
- **Additional-description print order (3):** second description → configurator information →
  special order information (F334).
- **Manifest quantity convention:** `*` for kit masters, service lines, and non-inventory products
  with a blank quantity (F333).
- **Pick-list sorts (3):** storage location · product · serial number.
- **Named but unpublished:** `Pick List Type` · `Manifest Type` · `Form Name`.

---

## G. Sequencing rules

1. `Assign Specific Pieces At` = `Creating Pick List` → **a pick list is required**; = `Ticket Print`
   → optional; = `Truck Load Process` → `Load a Truck` is available and the mapping interface must be
   off (F328, run 04 F190).
2. **Print Pick List → inventory is reserved** to the line items (F329).
3. Mapping active + no truck assigned → **order not sent to picking**, logged as a comment (F331).
4. Pick list → *(optionally)* **auto-generate or update the manifest** (F335) → pack list → load →
   complete.
5. Reprint a pick list for a manifested order → **remove from manifest → reprint → re-add**, which
   fires the manifest-removal reason-code prompt and logs an exception (F330, run 04 F178).
6. **Completed manifests cannot be printed** (F333).

---

## H. Open questions and gaps — carried out of the audit

### Closed by run 06

- **`STORIS Messenger`** — batch 1 F317–F322. *(Open since run 04.)*
- **The security override mechanism** — batch 1 F316. *(Open since run 01.)*
- **`Assign Specific Pieces At` values** — F328. *(Run 04's highest-priority unknown.)*
- **`Print Pick List` FINAL/draft semantics** — F329, F335 (`RF Final Pick`). *(Open since run 04.)*
- **`Print a Manifest`** — F333. *(Named in run 04 F183.)*

### Still open at the end of the audit

**Settings records, all in System Administration — outside the six-run queue:**
`Costing Control Settings` · `Warehouse/Store Location Settings` · `Point of Sale Control Settings` ·
`Alert Code Settings` · `Status Code Settings` · `Service Control Settings` · `Warranty Settings` ·
`Bar Code Control Settings` · `General System Control Settings` · `Inventory Control Settings` ·
`Distribution Status Settings` · `Third Party Logistics Settings` · `EDI Control Settings` ·
`Tracked Storage Location Settings` · `Route Capacity Control Settings` ·
`Route Mapping Control Settings`.

**Named routines never read:** `Purge Messenger Activity` · `Switch User` ·
`Cycle Module Multi-Print Assignment Screen` · `Recover STORIS Licenses` · `System Notification` ·
`Terminal Settings` · `Survey Questions Screen` · `Directed Putaway Processing Overview` ·
`Update a Product Cost` · `Average Cost` · `Correct a Cost Exception` *(read)* ·
`Relationship Marketing in STORIS Using E-Communications Technology`.

**Thirteen terms used and defined nowhere** — F336.

**One article unreachable:** `Multi-Legged Transfers Flow Chart Overview` has no readable text
(run 04 batch 8 §A).

**Two article IDs that 404'd:** `Debit Card Payment Entry Window` (15201404901460) ·
`Report Improperly Processed Orders` (15203030606100). **IDs need re-derivation; not guessed at.**

### Inferences (recorded as inference, not fact)

- **I-59:** `CPU` (customer pickup) and `CWC` (Customer Will Call) are probably the same population
  under two abbreviations. *Both denote customer-collected orders; no article connects them.*
- **I-60:** `RF Final Pick` is probably the option that produces run 04 F238's "FINAL" pick list.
  *Strongly implied; the two articles never reference each other.*

---

## I. Unknown unknowns

- **Printing is a transactional interface, not an output channel.** `Print Pick List` reserves
  inventory and can create manifests; `Print a Delivery Ticket` submits items to picking (run 04
  F237). **In STORIS, printing changes state.** Any rebuild that treats printing as a rendering
  concern will lose three business events, and any user who "just reprints something" is transacting.
- **Three silent drop-out paths** now documented (F331, run 04 F179, run 04 F250 declining capacity),
  all evidenced only by comments. **Orders leave the logistics flow quietly and routinely**, and the
  business almost certainly has a population of them right now.
- **The reprint-pollutes-the-exception-report loop** (F330) is a measurement problem hiding in a
  procedure note. There may be others of the same shape: an operational workaround that corrupts a
  management report. Worth asking the warehouse directly.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **`Assign Specific Pieces At`** | Three-value setting placing piece assignment at ticket print, pick list creation, or truck load |
| **`CPU`** | Customer pickup; excluded from pick lists |
| **`RF Final Pick`** | Pick-list option producing the FINAL (reserving) pick list |
| **`Indicate As-Is`** | Manifest option flagging damaged-goods pieces to the delivery crew |
| **`Update Manifest`** | Pick-list option that creates or updates the manifest |
| **Asterisk convention** | `*` printed for kit masters, service lines and quantity-less non-inventory products |

---

## Contract adjudication — batch 2

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED — run 04's highest-priority unknown closed** | `Assign Specific Pieces At` has three values (F328); the pick-list print reserves (F329) |
| **W-050** *(access control)* | **CONFIRMED — inverted, eighth upholding** | Regional Processing on `Print Pick List` |
| **W-039** *(exceptions)* | **CONFIRMED, with a defect surfaced** | Pick-list reprints on manifested orders generate spurious manifest-removal exceptions (F330); orders silently withheld from picking are logged only as comments (F331) |
| **W-012** *(dates)* | **consistent** | Pick list and manifest are both keyed by scheduled date |
| **W-005 / W-006** *(special order)* | **CONFIRMED** | Configurator and special-order text print in a fixed order (F334) |
| **W-061** *(cost)* | **relevant** | `Indicate As-Is` carries the As-Is flag to the delivery crew (F333) |
| **Licensed modules altering base behaviour** | **NEW — seventh confirmation** | Mapping active adds a silent picking precondition (F331) |
| **Printing as a transactional interface** | **NEW — no contract covers it** | F329, F335, and run 04 F237 |

---

## Next

**Run 06 complete: 56 articles, 2 batches, findings 316–336.**
See `RUN-06-GETTING-STARTED-SUMMARY.md` — and, for the whole audit,
`AUDIT-CLOSEOUT.md`.
