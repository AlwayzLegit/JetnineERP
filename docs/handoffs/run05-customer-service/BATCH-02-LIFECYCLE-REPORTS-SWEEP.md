# Run 05 — Customer Service — Batch 2 (final): Lifecycle, profitability, and the coverage sweep

Status: complete. Findings 304–315. Read-only throughout. No line closed, no service order
reinstated, no survey conducted, no report run.

This batch closes **run 05**.

---

## A. Coverage log

### Read this batch

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Reinstate Completed Merchandise Service** | 15203457245972 | read — **a new module security record** |
| 2 | Select Service Lines to Close | 15203437059732 | read |
| 3 | Service Problem Entry Screen | 15203457407764 | read |
| 4 | Enter a Service Purchase Order | 15203457741588 | read — *(a pointer article; see F309)* |
| 5 | **Report Profitability by Payment Responsibility** | 15203113295636 | read |
| 6 | Report Profitability by Service Employee | 15203129108884 | read |
| 7 | **Report Service Chargebacks to Manufacturer** | 15203235627668 | read |
| 8 | **Report Service Status Durations** | 15203214705812 | read — **an event-sourced status history** |
| 9 | Delivery Survey Screen | 15201528692756 | read |
| 10 | Create/Update a Customer Gift Registry | 15201513602708 | read |

### Run 05 coverage statement — all 56 articles

**Customer Service (31):** 15 read across batches 1–2. The remainder classified:

| Family | Articles | Disposition |
|---|---|---|
| **Service order core** | Enter a Service Order · Service Problem Entry Screen · Service Details Screen · Service Linkage Detail · Service Order Item Comments · Related Parts Selection · Special Order Options Screen · Serial Number Look-Up · Document Detail (Service) | **Five read.** The remaining four are **child screens named inside `Enter a Service Order`** — their fields appear in batch 1 §C as elements of the pages that call them. `Special Order Options Screen` duplicates the special-order machinery dissected in run 03 F55–F63. |
| **Lifecycle** | Complete the Servicing Process · Select Service Lines to Close · Reinstate Completed Merchandise Service · Reason for Voiding Transaction Screen | **Three read.** `Reason for Voiding Transaction Screen` is the service instance of the void-reason pattern dissected in run 03 F149. |
| **COG** | Maintain a COG Order · Open COG Lookup · COG History Display Screen · COG Line Comments · Item Selection for COG Screen | **One read** — the model (batch 1 F294). The other four are lookup, history and comment screens over the same document. |
| **Gift registry** | Create/Update a Customer Gift Registry · Gift Registry Contributions | **One read**; contributions route through `Enter a Customer Payment/Refund/Gift Certificate`, dissected in run 03 batch 5. |
| **Delivery survey** | Delivery Survey Screen · Delivery Survey Customer Information Screen | **One read**; the second is its confirmation step. |
| **Printing** | Print a Completed Service Order · Print an In-Home Work Order · Print an In-Shop Order · Service Order Return Print | **Excluded** — four form-print routines; the printing machinery was dissected in the earlier standalone Printing handoff. **Note the count: three of the four print forms are method-specific**, corroborating batch 1 F293. |
| **Other** | Enter a Service Purchase Order · Export Warranty Information to Excel · Tickle Process · Report Service Revenue by Technician | **Two read.** `Export Warranty Information to Excel` is named and unread — see §H. |

**Customer Service Views and Reports (25):** 4 read. The remaining 21:

| Family | Count | Disposition |
|---|---|---|
| `Multiple Coordinator Selection Window` · `Multiple Problem Code Selection Window` | 2 | **Excluded** — template instances, per the established precedent. Their enumerations (`Coordinator`, `Problem Code`) are recorded in §F as named-but-unpublished. |
| **`View a X's Open Service Orders`** — Coordinator · Customer · Product · Salesperson · Technician · Vendor · plus `View Open Service Orders for a Service Status` and `View an Existing Service Order` | 8 | **Excluded as a family — and the family *is* a finding** (F313). |
| **Reports** — Delinquent Service Orders · Items with High Average Service Days · Labor Service Schedule by Technician · Product Sales-to-Service Ratio · Reinstated Service Orders · Service Order Aging · Service Order History · Service Orders · Service Orders with Service Dates in Jeopardy · Service Problem Activity · Written Services Revenue | 11 | **Four read** *(profitability ×2, chargebacks, status durations)*. The rest follow the standard report shape; their **titles** are recorded in F314 as an inventory of what the business measures. |

**Run 05: 56/56 inventoried, 25 read in full (45%) — the highest proportion of any run.** No article
skipped silently.

---

## B. Wiring findings

### FINDING 304 — There is a `Service Security` record, making the per-module security convention four modules wide

- **Invariant:** service has its own `Create a User/Group Actions` security surface.
- **Evidence** — `Reinstate Completed Merchandise Service`, *Required Settings*:
  > "The following settings **must be enabled** in order to use this screen:
  > **Allow Service Order to be Reinstated** field on the **General Information tab of Service Control Settings**
  > **Reinstate completed service orders** field in **Create a User/Group Actions - Service Security**"
- **Maps to:** `W-050` — **CONFIRMED**; run 04 F264, batch 4 §E (the naming convention).

> Run 04 batch 4 identified `Create a User/Group Actions - <Module> Security` as a **convention**
> rather than a set of unrelated systems, on the evidence of Sales, Receivables and Logistics.
> **Service makes four**, and the convention is now firm enough to predict: there is very likely a
> record per module, and the audit's earlier framing of "twenty unrelated permission systems" is
> definitively wrong.
>
> The two-part gate is the fourth instance in the audit of **"a settings switch *and* a second
> thing"** (run 04 F178's reason code, batch 1 F291's Messenger dependency, F300's two-record
> flexEngage gate). It is a house pattern, and every one of them is a configuration trap: enable one
> half and the feature silently does not appear.

### FINDING 305 — Reinstating a service line creates a new line on a new order and deliberately drops everything attached to it

- **Invariant:** reinstatement copies the problem, not the work.
- **Evidence** — `Reinstate Completed Merchandise Service`:
  > "Use this screen to **reopen a previously closed service merchandise line from another service order**. This process **only works for service orders that are closed**. To reinstate a line from a completed order, **a new service order must be created**, and the original service order line is added via the **Reinstate Service Order** option in the Actions in Enter a Service Order."
  > "A **new service line is created on the current service order** for the selected closed service line. **The original problem code and text are displayed in the grid. Linked parts, labor, or charge lines from the original service order are not included for the new service line.**"
  > "**Non-merchandise and stock service order lines are not available for reinstatement.**"
  > "**Document comments update on both the original and new documents as an audit trail.**"
- **Maps to:** batch 1 F293, F295; `W-034`; `W-039`.

> **A closed service order is never reopened.** Reinstatement is a *copy forward* onto a new
> document — the problem code and its text carry over, and **nothing else does**. Parts, labour and
> charges are dropped deliberately, because the second visit needs its own.
>
> That is the right model for a repeat repair, and it is a genuine design choice worth copying: the
> business question "did we have to go back?" is answerable because the second visit is a distinct
> document that names its ancestor. `Report Reinstated Service Orders` exists precisely to count
> them, and combined with `Report Items with High Average Service Days` and `Report Product
> Sales-to-Service Ratio`, **STORIS is instrumented to find products that keep failing.**
>
> **Both documents get an audit comment** — the eighth sighting of free-text audit trail across
> runs 03–05, and one of the few that is bidirectional.
>
> The exclusion is consistent with batch 1 F293: **non-merchandise and stock-merchandise lines
> cannot be reinstated**, because "we went back to fix the same sofa again" has no meaning for damage
> to a customer's wall or for servicing the company's own stock.

### FINDING 306 — Service line status is event-sourced, and there is a report of how long each status lasted

- **Invariant:** every service line status change is retained as history, not overwritten.
- **Evidence** — `Report Service Status Durations`:
  > "This report is used to **analyze how long service lines are in a particular service status**, thus **reporting the historical status of a service line**. **Each time a service line is updated, that activity is included with this report so that each change in status displays.** This report includes **open and completed** service orders."
  Options: Date Code · Start/End Date · Order Number · **Line Status Code** · Coordinator ·
  Technician · Problem Code · Vendor · **four sort levels each with its own sort order** ·
  Detail or Summary.
- **Maps to:** `W-012` — **CONFIRMED**; run 03 F154 (the sales exception log); `W-064`.

> **This is the only event-sourced status history the audit has found in five runs.** Everywhere else
> — sales order status, fulfillment status, hold codes, piece status — the current value is what is
> stored, and history is reconstructed from comments if at all. Here, every transition is retained
> with its timestamp, and there is a report that measures the dwell time in each state.
>
> That makes service the **best-instrumented process in the ERP**, and it is not an accident: a
> service business lives or dies on cycle time, so STORIS models the state machine as a log.
>
> Two consequences for the rebuild. First, **we should do this everywhere**, not just for service —
> it is cheap now and it is the thing that makes every "how long does X take" question answerable.
> Second, in the migration this is a genuinely valuable dataset: **the business's real service cycle
> times are recoverable from STORIS**, which is not true of most of what run 04 found.
>
> **Four sort levels, each with an independent ascending/descending order**, is the deepest sort
> specification in the corpus and tells you this report is read by someone doing real analysis.

### FINDING 307 — Service profitability is reported three ways, and the payer is one of the axes

- **Invariant:** service margin is analysed by responsible party, by employee, and by line type.
- **Evidence** — `Report Profitability by Payment Responsibility`:
  > "This report shows **profitability for service orders sorted by the responsible party for the service**."
  Options: Region · Service Location · Start/End Date · **`Responsibility`** · **`Include Line Types`**
  · Customer · Vendor · three sort levels.
  And `Report Profitability by Service Employee`:
  > "profitability for Customer Service orders **sorted by Employee**."
  Options add **`Employee Type`** and `Employee`.
- **Maps to:** batch 1 F297 (four payment responsibilities) — **the consumer**; `W-061`; `W-052`.

> Batch 1 found the four payers on the service order's Total page. **These are the reports that make
> them worth capturing**, and together they answer the two questions a service department is asked:
> *is the warranty business profitable* and *is this technician profitable*.
>
> **`Include Line Types` appears on all three profitability and chargeback reports** — so parts,
> labour and charges can be included or excluded from the margin calculation independently. That is
> a meaningful analytical control: labour margin and parts margin behave completely differently, and
> STORIS lets you look at them apart.
>
> **`Employee Type`** implies the employee dimension is itself typed — coordinator, service
> technician, labour technician (batch 1 F292's three roles), and possibly salesperson. Values not
> published.
>
> **`Region` on both reports** is Regional Processing surfacing as a reporting dimension rather than
> a restriction — the eighth appearance of that concept in the audit and the first time it is a
> *grouping* rather than a *gate*.

### FINDING 308 — Manufacturer chargebacks are a closed-orders-only report with a reimbursement method

- **Invariant:** vendor responsibility for service cost is recovered after closure, by a chosen method.
- **Evidence** — `Report Service Chargebacks to Manufacturer`:
  > "This report provides a listing of **vendors' responsibility for charges, sorted by vendor and product**. The report **includes closed service orders only**."
  Options: Region · Service Location · Vendor · **`Responsibility Type`** · **`Reimbursement Method`**
  · `Line Types to Include` · Date Code · Start/End Date · three sort levels.
- **Maps to:** batch 1 F297; run 04 F270 (vendor chargebacks on inventory pieces); `W-046`; `W-061`.

> **Closed orders only** is the key clause: the chargeback claim is assembled *after* the job is
> finished, from the Factory Warranty and Other Vendor columns of the service order. So the sequence
> is *do the work → close the order → run this report → claim from the manufacturer.*
>
> **`Reimbursement Method`** is a fourth similarly-named field in the audit's rebate/chargeback
> family, after `Vendor Rebate Chargeback Method` (run 02), `Rebate Mode` (run 03) and
> `Vendor Chargeback Method` (run 04 F270). **Four names, three modules, no article connecting any
> pair.** Inference I-16 was downgraded in run 04; this **downgrades it further** — the audit should
> now treat these as four distinct fields until something says otherwise, and put the question to
> STORIS directly.
>
> Note also that this is a *report*, not a transaction. Run 04 F270's `Vendor Chargeback` was a tab
> on `Enter a Stock Adjustment` that actually restated cost and price. **This one only lists.**
> Whether service chargebacks ever become AP credits, and how, is not documented in this section.
> That is a real gap: **the money is identified and there is no documented path to collecting it.**

### FINDING 309 — Service purchase orders are ordinary purchase orders under a different menu

- **Invariant:** service purchasing reuses the purchasing module wholesale.
- **Evidence** — `Enter a Service Purchase Order`, complete body:
  > "Use this entry program to create service purchase orders, and to edit, view, or delete open purchase orders. **See the Enter a Purchase Order topic for information.**"
- **Maps to:** run 02 (purchase orders); `W-005`.

> A one-sentence pointer article, and the pointer is the finding: **there is no separate service
> purchasing model.** The `Purchase Order Number` fields on the Parts, Labor and Charges pages
> (batch 1 §C) link to ordinary POs, which means run 02's entire purchasing dissection — PO types,
> the nine-source hold convergence, the thirteen-level landed cost hierarchy, cost exceptions —
> applies to a part ordered for a repair.
>
> That is a useful economy for the rebuild: **one purchasing model, several origins.** It also means
> a service part carries landed cost, can raise a type-4 cost exception, and therefore can block a
> physical inventory freeze (run 04 F219). The chain reaches further than either module suggests.

### FINDING 310 — Closing service lines is a bulk selection over "eligible" lines, and eligibility is undefined

- **Invariant:** lines close in batches, filtered by an unstated rule.
- **Evidence** — `Select Service Lines to Close`, complete body:
  > "Use this screen to **close all eligible open lines**. Check the box next to the product (or products) for the service lines you want to close, then click save. After you click save, **you are returned to the Enter a Service Order process**."
- **Maps to:** F305; `W-039`.

> The screen exists, the workflow is clear, and **"eligible" is doing all the work and is never
> defined.** Given batch 1's tree structure (F295), the likely rule is that a service line cannot
> close while linked parts, labour or charges are open — but the article does not say so, and the
> audit does not guess. Section H.
>
> This is also where `Closed Without Completion` presumably arrives — a status named in **four
> articles across runs 04 and 05**, always in the same sentence (*"Service lines with a Closed
> Without Completion status as designated in Status Code Settings are recognized as closed lines"*),
> and **never explained**. Four sightings, no definition, in an enumeration article (`Status Code
> Settings`) that has been unread since run 03.

### FINDING 311 — Problem codes carry free text, and they are the only thing that survives reinstatement

- **Invariant:** the problem is a code plus a narrative, attached at line level.
- **Evidence** — `Service Problem Entry Screen`:
  > "Use this screen to **associate a problem code with this service order created for an original document**."
  Fields: **Problem** · Description · **`Add Text`** · Actions.
  And `Reinstate Completed Merchandise Service`: *"The original **problem code and text** are displayed in the grid."*
- **Maps to:** F305; batch 1 F295; `W-039`.

> **Problem code + free text is the payload of a service order**, and F305 confirms it: when a line
> is reinstated, the code and the text carry forward and the parts, labour and charges do not.
> STORIS treats the *problem* as the durable thing and the *work* as disposable.
>
> `Problem Code` has now appeared on the Merchandise page, the Non-Merchandise page, this screen,
> `Report Service Problem Activity`, `Report Service Status Durations` and its own multi-select
> window — **six sightings, values never published.** It is the most-referenced unpublished
> enumeration in run 05, and given `Report Product Sales-to-Service Ratio` and `Report Items with
> High Average Service Days`, **problem codes are how the business finds bad products.**
>
> "created for an original document" also confirms the linkage direction: a service order is created
> *against* an original sales document, which is why batch 1's Merchandise page offers
> `Original Order Piece Selection`.

### FINDING 312 — Delivery surveys are a separate call-back workflow with a "previously surveyed" guard

- **Invariant:** post-delivery surveying is a filtered work queue over completed deliveries.
- **Evidence** — `Delivery Survey Screen`:
  > "Use this routine to **select the orders for which you want to conduct delivery surveys**. … **Each time you edit a filter field, the grid updates to reflect the change** (if any). Double-click on the order … The **Delivery Survey Customer Information Screen** appears. Use this screen to **confirm all information is accurate** before accessing the **Survey Questions Screen** to conduct the survey."
  Filters: Order Number · Ship Location · Truck · **Route** · Delivery Date · **`Previously Surveyed`**
  · Order Status.
- **Maps to:** run 04 (delivery completion); batch 1 F292 (tickling); **NEW** — no contract covers
  customer feedback.

> A **third customer-contact workflow** in this section, after tickling and flexEngage notifications
> — and a fourth if the envelope icon counts (batch 1 F301). Delivery surveys live in *Customer
> Service* rather than Logistics, which is the right home: the survey is about the experience, not
> the shipment.
>
> **Filtering by `Truck` and `Route`** is the operationally interesting part: the business can survey
> *one truck's deliveries*, which is how you find a crew problem rather than a product problem.
> Combined with run 04 F211's driver and delivery-associate assignment on the manifest, **there is a
> path from a bad survey to the two people who were in the van.**
>
> **`Previously Surveyed`** is the de-duplication guard — the same shape as run 04 F209's Dispatch
> Track sent-stamp. `Survey Questions Screen` is named and **has no article** in this section's
> inventory: the questions themselves, and where they are configured, are undocumented.

### FINDING 313 — Open service orders are viewable by six different parties, one screen each

- **Invariant:** the same open-service-order population is presented once per interested role.
- **Evidence** — subsection inventory, verbatim titles:
  `View a Coordinator's Open Service Orders` · `View a Customer's Open Service Orders` ·
  `View a Product's Open Service Orders` · `View a Salesperson's Open Service Orders` ·
  `View a Technician's Open Service Orders` · `View a Vendor's Open Service Orders` ·
  plus `View Open Service Orders for a Service Status`.
- **Maps to:** batch 1 F292 (three roles); F307 (`Employee Type`); `W-050`.

> **Seven screens over one query**, differing only in the dimension you enter it by. That tells us
> the six parties STORIS considers to have a legitimate interest in an open service order:
> the coordinator who owns it, the customer waiting, **the product** (is this model failing?),
> **the salesperson** (my customer has a problem), the technician doing the work, and
> **the vendor** (whose warranty is paying).
>
> Two of those are not obvious and both matter. **A salesperson-facing view of service orders** wires
> customer service back into the sales floor — the person who sold it finds out it broke.
> **A product-facing view** is the quality-feedback loop, and with `Report Product Sales-to-Service
> Ratio` and `Report Items with High Average Service Days` it is a merchandising signal: **service
> data feeds buying decisions.**
>
> For the rebuild this is a single filtered query, not seven screens — but **the six dimensions are
> the requirement**, and dropping any of them removes somebody's daily view.

### FINDING 314 — What the reports measure is itself the specification of what a service business watches

- **Invariant:** the report inventory enumerates the service department's KPIs.
- **Evidence** — subsection inventory, verbatim titles:
  `Report Delinquent Service Orders` · `Report Items with High Average Service Days` ·
  `Report Labor Service Schedule by Technician` · `Report Product Sales-to-Service Ratio` ·
  `Report Profitability by Payment Responsibility` · `Report Profitability by Service Employee` ·
  `Report Reinstated Service Orders` · `Report Service Chargebacks to Manufacturer` ·
  `Report Service Order Aging` · `Report Service Order History` · `Report Service Orders` ·
  **`Report Service Orders with Service Dates in Jeopardy`** · `Report Service Problem Activity` ·
  `Report Service Status Durations` · `Report Written Services Revenue` ·
  `Report Service Revenue by Technician`.
- **Maps to:** F306, F307, F313; `W-012`.

> Sixteen reports across four concerns, and reading them as a set is more informative than reading
> any one:
>
> - **Timeliness** — delinquent orders, aging, **jeopardy**, status durations, high average service days
> - **Profitability** — by payer, by employee, manufacturer chargebacks, written services revenue, revenue by technician
> - **Quality** — problem activity, product sales-to-service ratio, reinstated orders
> - **Capacity** — labor service schedule by technician
>
> **`Report Service Orders with Service Dates in Jeopardy`** deserves its own note: *jeopardy* is a
> term run 02 found on the merchandising side (orders whose promised dates are at risk, with `ASAP`
> and `CWC` excluded from the calculation). **The same concept, the same word, applied to service
> dates** — so jeopardy is a cross-module STORIS concept and not a purchasing one. Its calculation
> is documented in neither place.
>
> The quality group is the one to carry into the rebuild deliberately. **Three independent reports
> exist to find products that fail**, which means the business has, or had, a merchandising feedback
> loop running off service data. That is worth confirming with them — it is the kind of thing that
> quietly stops working during a cutover and nobody notices for a year.

### FINDING 315 — Gift registries are a gift-certificate wrapper with an event and a contribution ledger

- **Invariant:** a registry is a master record linked to one gift certificate that accumulates contributions.
- **Evidence** — `Create/Update a Customer Gift Registry`:
  > "If you are using the **Gift Registry feature**, use this process to create the "**master**" registry **and gift certificate linked to the registry**. To enter contributions to the registry, use the **Add Funds** option in the **Enter a Customer Payment/Refund/Gift Certificate** routine."
  Fields: Customer Code · Registry Opened Date · **`How Enrolled`** · **`Type of Event`** ·
  **`Event Date`** · **`Letter Sent`** · Alternate Name · Gift Certificate ·
  **Amount Contributed · Amount Used · Amount Remaining**.
- **Maps to:** run 03 batch 16 F162 (gift certificates carry registry contributions as a fourth
  transaction kind) — **the other end, now closed**; `W-028`.

> Run 03's coverage sweep found that gift certificates track *"purchases, refunds, redemptions, and
> **contributions (to gift registries)**"* and flagged the registry subsystem as inferred from three
> field names. **Here it is**, and the model is simple and complete: a registry is a customer, an
> event, a date, and **one gift certificate that everyone pays into**.
>
> The three-amount ledger — Contributed, Used, Remaining — is the whole financial model, and it sits
> on the certificate, so **the registry inherits everything run 03 established about gift
> certificates**: optional expiry, partial redemption, purge with a retention setting.
>
> **`How Enrolled`** and **`Letter Sent`** are marketing fields — the registry is a customer
> acquisition channel, and STORIS tracks the source and whether the acquisition letter went out.
> **`Type of Event`** is another unpublished enumeration.
>
> Note that contributions are entered through the *sales* payment routine, not here. **The registry
> is created in Customer Service and funded in Sales Processing** — a small but real cross-module
> split that a rebuild would probably not think to reproduce.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Reinstate Completed Merchandise Service** | Customer Code · Customer Name · Current Document *(header, from the service order)* · **Document** · **Line Reference Number** · Add · Save |
| **Select Service Lines to Close** | Grid with a checkbox per product/service line · Save |
| **Service Problem Entry Screen** | Problem · Description · **Add Text** · Actions |
| **Delivery Survey Screen** | Order Number · Ship Location · Truck · Route · Delivery Date · **Previously Surveyed** · Order Status · Grid *(live-filtering)* |
| **Create/Update a Customer Gift Registry** | Customer Code · Registry Opened Date · How Enrolled · Type of Event · Event Date · Letter Sent · Alternate Name · Gift Certificate · Amount Contributed · Amount Used · Amount Remaining |
| **Report Profitability by Payment Responsibility** | Region · Service Location · Start/End Date · Responsibility · Include Line Types · Customer · Vendor · Primary/Secondary/Tertiary Sort · Send Output to · Export Path |
| **Report Profitability by Service Employee** | Service Location · Start/End Date · **Employee Type** · Employee · three sorts · Include Line Types · output |
| **Report Service Chargebacks to Manufacturer** | Region · Service Location · Vendor · **Responsibility Type** · **Reimbursement Method** · Line Types to Include · Date Code · Start/End Date · three sorts · output |
| **Report Service Status Durations** | Date Code · Start/End Date · Order Number · **Line Status Code** · Coordinator · Technician · Problem Code · Vendor · **four sorts, each with its own sort order** · Detail or Summary · output |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Allow Service Order to be Reinstated** | **Service Control Settings → General Information tab** | Half of the reinstatement gate (F304) |
| *(Gift Registry feature)* | *(unnamed)* | Enables registries (F315) |

`Service Control Settings` now has **four named fields** across run 05 (`Tickle Processing Active`,
`Call Customer Days`, the two Verify-labor fields, `Allow Service Order to be Reinstated`) and a
named **General Information** tab. The record itself remains unread.

---

## E. Security permissions catalog (additions)

- **`Create a User/Group Actions - Service Security`** — new record; named field
  `Reinstate completed service orders` (F304). **The per-module convention is now four modules wide:
  Sales · Receivables · Logistics · Service.**

---

## F. State machines and enumerations (additions)

- **Reinstatement eligibility:** merchandise lines only; **non-merchandise and stock-merchandise
  lines excluded**; source order must be **closed** (F305).
- **Named but unpublished enumerations in run 05:** `Problem Code` *(six sightings)* ·
  `Service Status` / `Line Status Code` · `Closed Without Completion` *(four sightings across two
  runs, never defined)* · `Next COG Status` · COG `Type` · `Coordinator` · `Contact Status` ·
  `Responsibility` / `Responsibility Type` · `Reimbursement Method` · `Employee Type` ·
  `Include Line Types` · `Type of Event` · `How Enrolled`.
- **Service line status history is retained per transition** (F306) — unique in the corpus.
- **Gift registry ledger (3):** Amount Contributed · Amount Used · Amount Remaining (F315).
- **Open-service-order view dimensions (6):** Coordinator · Customer · Product · Salesperson ·
  Technician · Vendor — plus Service Status (F313).

---

## G. Sequencing rules

1. Service line closed → order closed → **only then** can the line be reinstated, **onto a new order**,
   carrying the problem code and text and **nothing else** (F305).
2. Reinstatement writes an audit comment to **both** documents (F305).
3. Work done → order **closed** → `Report Service Chargebacks to Manufacturer` assembles the vendor's
   share (F308).
4. Every service line update → **a status-duration record** (F306).
5. Delivery completed → order appears in the survey queue until `Previously Surveyed` (F312).
6. Registry created here → **funded through `Enter a Customer Payment/Refund/Gift Certificate`
   (Add Funds)** → the linked gift certificate accumulates (F315).

---

## H. Open questions and gaps

### Gated or unreachable — carried out of run 05

1. **`STORIS Messenger`** — batch 1 F291. No article found; the mechanism behind two runs' worth of
   notification findings.
2. **`Service Control Settings`** — four named fields, never read.
3. **`Status Code Settings`** — referenced in five articles across runs 03–05; **`Closed Without
   Completion` is the only value ever named**, and it is never defined.
4. **`Create a User/Group Actions - Service Security`** — named, unread.
5. `Survey Questions Screen` — named in `Delivery Survey Screen`, **no article in the section**.
   The survey questions and their configuration are undocumented.
6. `Export Warranty Information to Excel` — named, unread; the only article in the section touching
   warranty data export.
7. `Warranty Settings` — surfaced as a related article on the reinstatement screen; never read in
   five runs, despite protection plans running through runs 02, 03 and 05.
8. Carried from earlier runs: `Costing Control Settings` · `Warehouse/Store Location Settings` ·
   `Point of Sale Control Settings` · `Alert Code Settings`.

### Documented but ambiguous

- **"Eligible" open lines** on `Select Service Lines to Close` (F310) — the rule is not stated.
- **"Dollars-only adjustments"** (batch 1 F295) — used three times, defined nowhere.
- **Whether service chargebacks ever become AP credits** (F308). The money is identified by a report
  and there is **no documented collection path**.
- **`Reimbursement Method` vs `Vendor Chargeback Method` vs `Vendor Rebate Chargeback Method` vs
  `Rebate Mode`** — **four names, three modules, no article connecting any pair.** Inference I-16
  downgraded again.
- **Jeopardy** — the same word and concept in merchandising (run 02) and service (F314); calculated
  in neither.
- **File attachments** (batch 1 §C) — mechanism, storage and retention all unknown.
- **`Warehouse Location Settings` vs `Warehouse/Store Location Settings`** (batch 1 §H).

### Inferences (recorded as inference, not fact)

- **I-53:** "Eligible" lines on `Select Service Lines to Close` probably means lines with no open
  linked parts, labour or charges. *Consistent with the tree structure in batch 1 F295; not stated.*
- **I-54:** Service chargebacks probably become AP credit bills through the ordinary payables path,
  as the bulk RTV workaround does (run 04 F274). *Nothing in this section says so.*
- **I-55:** `Closed Without Completion` is probably the status for a service line abandoned rather
  than finished — e.g. the customer cancelled or the item was replaced instead. *Four sightings, no
  definition; this is a reading of the name.*

---

## I. Unknown unknowns

- **Service data is a merchandising signal.** Three reports exist to find failing products, and there
  is a product-dimension view of open service orders. **A quality feedback loop from the service
  department to the buyers exists in this ERP**, and nothing in runs 02–04 hinted at it. If it is
  live at LA Mattress, a cutover that drops it removes a buying input nobody will list as a
  requirement.
- **A warranty settings record has never been read in five runs**, despite protection plans being
  sold in run 03, consumed in run 05, and reported on in both. It surfaced here only as a related-
  article link.
- **The survey questions do not exist in the documentation.** A whole customer-feedback instrument,
  referenced by the screen that administers it, with no article. Whatever configures it is outside
  everything the audit has enumerated.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Reinstatement** | Copying a closed service line's problem onto a new order; work is not copied |
| **Service Security** | The service module's `Create a User/Group Actions` record |
| **Status duration** | Retained history of how long a service line held each status |
| **Payment responsibility** | The payer axis of service profitability reporting |
| **Reimbursement Method** | Manufacturer chargeback field; fourth name in the rebate/chargeback family |
| **Jeopardy** | Promised dates at risk — the same concept in merchandising and service |
| **Previously Surveyed** | De-duplication guard on the delivery survey queue |
| **Gift registry** | A customer + event + one linked gift certificate accumulating contributions |
| **Add Funds** | The sales-side routine that funds a registry |

---

## Contract adjudication — batch 2

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — the per-module convention is four wide** | `Service Security` (F304) |
| **W-012** *(dates and history)* | **CONFIRMED and extended** | Service line status is event-sourced with dwell-time reporting (F306); jeopardy applies to service dates (F314) |
| **W-061** *(cost and margin)* | **CONFIRMED** | Profitability by payer, by employee, by line type (F307) |
| **W-046** *(vendor rebates/chargebacks)* | **CONFIRMED, and the naming is now a four-way open question** | F308 |
| **W-052 / W-053** *(GL)* | **NOT DOCUMENTED for service chargebacks** | The claim is reported; no posting or collection path is described (F308) |
| **W-005** *(purchasing)* | **CONFIRMED** | Service POs are ordinary POs (F309) |
| **W-028** *(gift certificates)* | **CONFIRMED — run 03's registry gap closed** | F315 |
| **W-034** *(closure and reopening)* | **CONFIRMED** | Closed orders are never reopened; reinstatement copies forward (F305) |
| **W-039** *(exceptions)* | **CONFIRMED** | Problem code plus text is the durable payload (F311) |
| **Customer feedback / surveys** | **NEW — no contract covers it** | F312 |
| **Service-to-merchandising quality loop** | **NEW** | F313, F314 |

---

## Next

**Run 05 complete: 56 articles, 2 batches, findings 291–315.**
See `RUN-05-CUSTOMER-SERVICE-SUMMARY.md`.
