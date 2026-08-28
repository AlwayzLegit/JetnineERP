# Run 04 — Inventory Management — Batch 11 (final): Kardex, EDI, velocity, and the Views and Reports sweep

Status: complete. Findings 281–290. Read-only throughout; no report run, no inquiry executed beyond
reading its documentation.

This batch closes the **Inventory Views and Reports** subsection (103 articles) and **run 04**.

---

## A. Coverage log

### Read this batch

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Kardex Inquiry Notes** | 15294751621140 | read — **closes the run-02 Kardex gap** |
| 2 | Kardex Regular Inventory Screen | 15294751622548 | read — **a DTS screen** |
| 3 | Inventory Kardex Detail View | 15294765882004 | read |
| 4 | EDI 215 Document Delivery Status Inquiry | 15295210967316 | read — **the unacknowledged-215 detector** |
| 5 | Report and Optimize Product to Storage Velocity | 15202552854548 | read — **the putaway algorithm's inputs** |
| 6 | Report AWM User Exceptions | 15202504953492 | read |

### Inventory Views and Reports — all 103 inventoried, disposition stated

| Family | Approx. | Disposition |
|---|---|---|
| **Kardex** — Kardex Inquiry Notes · Kardex Regular Inventory Screen · Kardex Direct-Ship Screen · Inventory Kardex Detail View · As-Is Additional Information Screen · View Detailed Activity for a Product · View As-Is Product Details | 7 | **Three read**, closing the run-02 gap. The Direct-Ship and As-Is screens are the sibling DTS tabs of the same inquiry (F281); their existence *is* the finding. |
| **`Multiple * Selection Window`** | 13 | **Deliberately excluded** — template instances, per run 02 batch 11 F145. Named instances: Barcode Batch · Barcode Cross Reference · Group · Inventory Formation · List · Postal Code · Product Family · Serial Number Entry · Serial/Reference + Storage Location · Storage Category · Storage Location · Truck · **Velocity**. The *enumerations* they select from are captured in §F. |
| **EDI reporting** — EDI 215 Document Delivery Status Inquiry · Report EDI 214 Manifest Exceptions · Report EDI 214 Shipment Status Exceptions · Report EDI Advance Shipping Notice Exceptions · Report EDI Functional Acknowledgement Exceptions · Report EDI Invoice Exceptions · Report EDI PO Acknowledgement Exceptions · Report EDI PO Ship Acknowledgements · Report EDI Status Details Exceptions · View EDI Processing Log | 10 | One read; **the family itself is the finding** (F284). |
| **Physical inventory reporting** — nine `Report * Physical Inventory *` / frozen-quantity / count-review / variance reports | 9 | Excluded; every one is named and placed in the operator procedure read in batch 5 (F219–F222). |
| **Barcode / AWM reporting** — Report AWM Activity · Report AWM User Exceptions · View AWM Activity · View AWM Performance · View an AWM User's Current Status · Report Bar Code * (4) · Review Radio Frequency Picking Error · Bar Code Pick Review Inquiry · Report Scanned Batch Bar Code Physical Counts by User | 13 | One read; the rest are reporting views over machinery dissected in batches 5–7. |
| **Putaway / velocity** — Report and Optimize Product to Storage Velocity · Report Putaway Exceptions by User · Detailed Put Away Activity Report | 3 | One read — **and it supplies the putaway algorithm's inputs** (F285). |
| **Stock / value / cost reporting** — Report Stock Status · Report Special Order Stock Status · Report Value of Inventory · **Report Landed Freight Asset Values** · Report Inventory Aging by Location · Report Sales to Inventory Ratio · Report Open To Buy Information · Report Zero Cost Direct Shipments · Report COM Value In Transit · Report Historical Inventory Adjustments · Report Detailed Product Activity | 11 | Excluded; the underlying mechanics were read in batches 9–10 and run 02. **`Report Landed Freight Asset Values` corroborates batch 9 F260's third GL leg** and is noted rather than read. |
| **WMS** — Report Incomplete WMS Shipments · Review Warehouse Management Interface (WMS) Errors | 2 | Excluded, but **their existence confirms batch 9 F266**: WMS integration has its own error and exception surface (F286). |
| **Inquiries / lookups** — Search for a Product · Product/Description/Vendor Model Word Search · Product Group/Collection Inquiry · View a Merchandise Transfer · View All Serial/Reference Numbers for a Product · View Deliveries on Manifests · View Daily Receiving Schedule · View Customer Ship-To Addresses · View Inventory Quantities for a Group or Collection · View Kit Product Details · Gift Certificate Lookup Screen · Batch Selection Screen · Summary Screen · Review a Bar Code Cross Reference Number · Report Transfers by Location · Report Required Delivery Quantities · Report Merchandise Directly Shipped but not Invoiced · Report Vendor Delivery Performance · Report Logistical Scheduling · Report Inventory Designated As-Is | ~35 | Excluded as read-only views over machinery already dissected, per the run 03 batch 16 precedent. |

**Inventory Views and Reports: 103/103 inventoried.** Six read in full; 97 classified with a stated
reason. **No article skipped silently.**

---

## B. Wiring findings

### FINDING 281 — The Kardex is a DTS inquiry with per-ledger tabs, which is why run 02 saw "four ledgers"

- **Invariant:** the Kardex is one inquiry composed of several Dynamic Tab Settings pages.
- **Evidence** — `Kardex Regular Inventory Screen`:
  > "**This is a DTS screen** you access via a **DTS inquiry** such as the **View Detailed Activity for a Product** inquiry. After you specify a product on the main screen of the DTS inquiry, **any additional tabs become available**. To access this screen via the DTS inquiry, click on the **Regular Inventory Detail** tab."
  > "**NOTE: This screen is also available as a dynamic escape.**"
  Sibling tabs present as separate articles: **Kardex Direct-Ship Screen**, **As-Is Additional
  Information Screen**, plus `View As-Is Product Details`.
- **Maps to:** run 03 F155, F156 (Dynamic Tab Settings) — **CONFIRMED**; batch 3 F199 (Dynamic
  Escape) — **CONFIRMED**; run 02's four-Kardex-ledger observation — **explained**.

> **Run 02 recorded "four Kardex ledgers" and left them unread across three runs.** They are not four
> ledgers. They are **tabs of one DTS inquiry** — Regular Inventory Detail, Direct-Ship, As-Is
> Additional Information, and the summary — and which of them a site sees depends on its DTS
> configuration.
>
> That correction matters twice over. Substantively, the inventory history is one ledger presented
> several ways, not four separate records. Methodologically, it is **the third time run 04 has
> found that a structure the audit treated as fixed is actually composed** (run 03 F155/F156;
> batch 3 F199; here). **Screen composition is not a curiosity of the reporting module — it reaches
> the core inventory inquiry.**
>
> And this screen is reachable **both** as a DTS tab and as a dynamic escape, so the two mechanisms
> compose. Our screen inventory across four runs remains a lower bound.

### FINDING 282 — Kardex recording is a per-product switch, and history retention is the seventh named chain

- **Invariant:** whether a product has any movement history at all is a flag on the product record.
- **Evidence** — `Kardex Inquiry Notes`, complete body:
  > "**If the Inventory Tracking field in the Product record is active, the Kardex System records all activity for those products. Otherwise, the system does not keep a Kardex record of each transaction for that product.**"
  > "Transactions for **Serial-Tracked products are listed individually for each piece**. Products **not serial-tracked display one line representing the entire group of pieces** involved in the transaction."
  > "The number of months to retain Kardex history is determined by the setting in the **Kardex History Months** field in the **Inventory Control Settings**."
- **Maps to:** `W-064` (retention) — **CONFIRMED, seventh chain**; batch 9 F259, F267.

> **A product can have no history.** `Inventory Tracking` off means no Kardex records are written at
> all — not summarised, not sampled: none. Combined with batch 6/9's `Track Bin to Bin Transfers`
> (which decides whether bin moves reach the Kardex), **there are at least two independent ways for a
> product's movement history to be silently incomplete**, and neither is visible when reading the
> history.
>
> That is the sharpest possible warning for our migration. Batch 9 F259 established that stock
> adjustments cannot be recalled, so **the Kardex is the only record of why inventory moved** — and
> it is optional per product and lossy per transaction type.
>
> **`Kardex History Months`** is the **seventh** *file → setting → purge* chain in the audit, after
> written sales, gift certificates, completed order history, `DAILY.DETAIL`, `ROUTE.EXCEPTION` and
> the routing capacity log. The rule from run 03 F160 has now held without exception across four
> runs.
>
> The serial/non-serial display rule confirms batch 9 F267 from the reporting side: **piece identity
> exists internally always, but is only surfaced when the product is serial-tracked.**

### FINDING 283 — Every Kardex line carries a running balance, the user, and both a memo and comments

- **Invariant:** the movement record is attributed and self-reconciling.
- **Evidence** — `Inventory Kardex Detail View`, fields verbatim:
  Product · Location · Quantity · **Balance** · Serial/Reference · Reference · **Activity Date** ·
  **Activity Time** · **User** · **Memo** · **Comments** · Order.
- **Maps to:** F282; batch 9 F259 (the mandatory adjustment comment); `W-052`.

> **`Balance` on every line** makes the Kardex self-reconciling — you can prove quantity-on-hand from
> the ledger rather than trusting a stored total. That is the right design for an inventory ledger and
> we should copy it.
>
> **`User` plus `Activity Date` and `Activity Time`** gives full attribution to the second.
> **`Memo` and `Comments` as separate fields** is the sixth instance of free-text audit trail in run
> 04 — and here it is where batch 9 F259's mandatory `Adjustment Comment` lands. So the comment a
> user must type before touching the adjustment screen ends up on the Kardex line, attributed and
> timestamped.
>
> That is better than the earlier free-text findings suggested: **the adjustment audit trail is
> structured after all — attributed, timed, balanced — with prose in two of its fields.** It softens,
> without removing, the migration concern raised in batches 2, 6, 8 and 9.

### FINDING 284 — EDI is a nine-report exception surface spanning purchasing, shipping and invoicing

- **Invariant:** every EDI document type has its own exception report.
- **Evidence** — subsection inventory, verbatim titles:
  `Report EDI 214 Manifest Exceptions` · `Report EDI 214 Shipment Status Exceptions` ·
  `Report EDI Advance Shipping Notice Exceptions` · `Report EDI Functional Acknowledgement
  Exceptions` · `Report EDI Invoice Exceptions` · `Report EDI PO Acknowledgement Exceptions` ·
  `Report EDI PO Ship Acknowledgements` · `Report EDI Status Details Exceptions` ·
  `View EDI Processing Log` — plus the **EDI 215 Document Delivery Status Inquiry** read here.
- **Maps to:** batch 1 F172 (EDI 215) · batch 8 F254 (EDI 214) · batch 6 F234 (`EDI Trip Info`) —
  **all extended**; `W-042`.

> The audit found EDI 215 in batch 1 and EDI 214 in batch 8 and treated each as a logistics detail.
> **It is a whole integration layer.** Nine exception reports plus a processing log means STORIS
> exchanges at least: pickup manifests (215), shipment status (214), advance ship notices, functional
> acknowledgements, invoices, PO acknowledgements and PO ship acknowledgements.
>
> **Functional acknowledgements (EDI 997) having their own exception report is the tell**: STORIS
> tracks whether its trading partners acknowledged receipt of each document. That is a
> transport-level guarantee, and it means the integration is expected to be unreliable enough to
> need one.
>
> This spans purchasing (PO ack, ASN, invoice), logistics (215, 214) and the warehouse (`EDI Trip
> Info`, batch 6). **The external-dependency inventory flagged since batch 4 §I must include an EDI
> document map**, and it is a bigger cutover item than any single screen in run 04.

### FINDING 285 — Directed putaway matches product **velocity** and **storage category** against the location's, and there is a report for mismatches

- **Invariant:** both products and storage locations carry velocity and storage category, and putaway matches them.
- **Evidence** — `Report and Optimize Product to Storage Velocity`:
  > "Use this routine **with the directed putaway feature** to identify products **whose velocity or storage category does not match the velocity or storage category of the storage location where they are currently placed**. Using this report, warehouse personnel can **move merchandise from one storage location to another in an attempt to optimize storage space**. They can use the report to ensure that products are in storage locations that **match their velocity or storage category settings**."
  Run-time options: Location · Storage Location · Product · Group · Category · **Exception Type** ·
  **Storage Category** · **Velocity** · Selection Type.
  Corroborated by `Multiple Velocity Selection Window` and `Multiple Storage Category Selection` in
  the subsection inventory.
- **Maps to:** batch 6 F227 (directed putaway) — **the algorithm's inputs, finally**; batch 7 F239.

> Batch 6 F227 found that directed putaway "automatically designates" destinations and could not say
> how. **This is how: velocity and storage category, matched between product and location.**
>
> Fast-moving product goes in fast-pick locations; heavy or bulky product goes in matching storage
> categories. Both are **enumerations with their own multi-select windows**, so both are configured
> vocabularies — and their values are not published anywhere the audit has read.
>
> The report exists because the match **decays**: velocity changes as products age, and stock ends up
> in the wrong place. So the putaway algorithm is paired with a **drift report** — the same
> estimate/reconcile shape as batch 10 F271's landed cost loop. **That is now two confirmed
> instances of "compute, then report the drift, then let a human fix it"**, and batch 10 §I predicted
> we would find more. We did, immediately.

### FINDING 286 — WMS has its own error and incomplete-shipment reporting

- **Invariant:** the third-party WMS boundary produces its own exception surface.
- **Evidence** — subsection inventory: `Report Incomplete WMS Shipments` ·
  `Review Warehouse Management Interface (WMS) Errors`.
- **Maps to:** batch 9 F266 — **CONFIRMED**; F284.

> Batch 9 found WMS locations partially outside STORIS. These two reports confirm the boundary is a
> real, monitored integration — with **incomplete shipments** as a named failure mode, meaning
> shipments can be left half-processed across the boundary.
>
> Recorded from the inventory. Whether LA Mattress runs any WMS location remains the open question
> from batch 9 §I, and it now has a concrete consequence: **if they do, there is a daily error queue
> somebody works.**

### FINDING 287 — The 215 inquiry has a filter whose whole purpose is finding documents the carrier never acknowledged

- **Invariant:** unacknowledged outbound EDI is a first-class searchable condition.
- **Evidence** — `EDI 215 Document Delivery Status Inquiry`, search fields:
  Order Type · Location · Route Code · Customer Number · Truck · Delivery Date ·
  **`Date 215 was Sent`** · **`Date 214 Returned`** · **`No 214 Acknowledgement Received`**.
  > "Use this routine to provide the status of **all order fulfillments that have been sent to the Third Party Logistics Company via the 215 EDI document**."
- **Maps to:** F284; batch 8 F254; batch 1 F172.

> **The 215/214 pair is a request/response protocol**, and this screen is its reconciliation: we sent
> a pickup manifest, did the carrier ever send a status back? The `No 214 Acknowledgement Received`
> checkbox is the whole failure mode in one field.
>
> That is the third "detect the gap and show a human" mechanism in this batch alone (velocity drift,
> WMS errors, unacknowledged 215s), and the **eighth retention chain** rides along with it:
> > "This inquiry provides historical information **up until the number of purge days specified by each client via the Purge Days for EDI 215 Transaction Logs setting in EDI Control Settings**."
>
> `EDI Control Settings` is a new record. Note the phrase **"specified by each client"** — retention
> is expected to be set per installation, which is consistent with every other retention chain found.

### FINDING 288 — AWM exception reporting counts pieces per exception type, per RF user

- **Invariant:** warehouse exceptions are measured by person.
- **Evidence** — `Report AWM User Exceptions`:
  > "This routine provides a report, **by warehouse and by RF User**, of product exceptions. The report also prints **the total number of pieces in each exception type and the total number of exceptions**."
  > "This routine **may be affected by Regional Processing restrictions**."
  Options: Warehouse Location · **Exception Type** · Start/End Date · **Primary Sort** ·
  **Secondary Sort**.
- **Maps to:** batch 5 F217 (the five closed exception types) — **the consumer of that enumeration**;
  batch 6 F236 (Regional Processing on the warehouse floor) — **CONFIRMED again**.

> Batch 5 found `DMG`/`NIL`/`DPICK`/`DPREP`/`DSTAGE` and noted they are *"used by the Report AWM User
> Exceptions pre-screen"*. This is that report, and its shape says what the codes are for: **measuring
> individual warehouse workers.**
>
> That is a performance-management use of an exception log, and it sits uneasily beside run 03 F154's
> finding that the *sales* exception log records touches rather than conditions. **Here the counting
> is deliberate and by design** — pieces per exception type per user — and the business presumably
> uses it. Worth knowing before we redesign it, because "we removed the report the warehouse manager
> runs every Monday" is a bad discovery.
>
> Regional Processing on a warehouse-performance report is the **sixth** upholding of run 01's
> inverted `W-050` judgment.

### FINDING 289 — `Report Landed Freight Asset Values` confirms the third GL leg is separately reportable

- **Invariant:** landed freight held as an asset is a reportable balance.
- **Evidence** — subsection inventory: **`Report Landed Freight Asset Values`**.
- **Maps to:** batch 9 F260 (`Landed Freight Asset` debit leg) — **CONFIRMED**; batch 10 F271, F272.

> Recorded from the inventory as corroboration. Batch 9 gave the account name from a journal entry;
> its having a dedicated valuation report confirms it is a real balance sheet item that somebody
> reconciles — not an internal bucket.
>
> Together with batch 10's add-on cost distribution (F271) and its exchange rate (F272), **landed
> freight has an estimating mechanism, a reconciliation routine, a GL account and a valuation
> report.** For a business importing furniture that is a complete subsystem, and it is one the
> rebuild must not treat as "add freight to cost".

### FINDING 290 — The reporting subsection's shape confirms the run's central pattern: STORIS detects drift and shows it to a person

- **Invariant:** for each computed or integrated behaviour, there is a report of where it went wrong.
- **Evidence**, assembled across run 04:
  putaway → `Report and Optimize Product to Storage Velocity` (F285) ·
  landed cost estimates → `Distribute Add-on Receiving Costs` variance reporting (batch 10 F271) ·
  outbound EDI → `No 214 Acknowledgement Received` (F287) and nine EDI exception reports (F284) ·
  WMS → `Review Warehouse Management Interface (WMS) Errors` (F286) ·
  RF picking → `Review Radio Frequency Picking Error` (batch 7 F248) ·
  manifests → `ROUTE.EXCEPTION` (batch 2 F180) ·
  physical inventory → As-Is and commitment exception reports (batch 5 F220) ·
  route capacity → `View Routing Capacity Log` with `Limit Search to Over Capacity` (batch 3 F194).
- **Maps to:** every contract; **the run's organising observation**.

> Eight independent instances. **STORIS's consistent answer to "what if the automatic thing gets it
> wrong" is a report, not a correction and not a block.** The system computes, records what it did,
> detects divergence, and hands it to a human.
>
> This is the same house style the audit noticed in batch 2 F184 (advisory "Continue?" warnings) and
> batch 6 F227 ("the user is alerted"), now visible at the level of the whole module's reporting.
> It explains why there are 103 articles of inquiries and reports for 177 articles of doing.
>
> **The implication for the rebuild is a real decision, not a detail.** A modern system would enforce,
> retry, or auto-correct most of these. If we do that, we remove the reports — and with them the jobs
> and habits built around running them. **Every one of the eight above is a workflow somebody
> currently owns.** That belongs in the cutover plan, not the backlog.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Kardex Regular Inventory Screen** *(DTS tab: `Regular Inventory Detail`; also a dynamic escape)* | Product · Vendor · Brand · Vendor Model · Location · Start Date · End Date · Grid · Actions |
| **Inventory Kardex Detail View** | Product · Location · Quantity · **Balance** · Serial/Reference · Reference · Activity Date · Activity Time · **User** · Memo · Comments · Order |
| **EDI 215 Document Delivery Status Inquiry** | Order Type · Location · Route Code · Customer Number · Truck · Delivery Date · Date 215 was Sent · Date 214 Returned · **No 214 Acknowledgement Received** · Grid *(collapsible search panel)* |
| **Report and Optimize Product to Storage Velocity** | Location · Storage Location · Product · Group · Category · Exception Type · **Storage Category** · **Velocity** · Selection Type · Send Output to · Export Path |
| **Report AWM User Exceptions** | Warehouse Location · Exception Type · Start Date · End Date · Primary Sort · Secondary Sort · Send Output to · Export Path |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Inventory Tracking** | **Product record** | Off → **no Kardex records at all** for that product (F282) |
| **Kardex History Months** | Inventory Control Settings | Kardex retention — **seventh chain** (F282) |
| **Purge Days for EDI 215 Transaction Logs** | **EDI Control Settings** | 215 log retention — **eighth chain** (F287) |
| **Velocity**, **Storage Category** | product record and storage location record | Matched by directed putaway (F285) |

---

## E. Security permissions catalog (additions)

**Regional Processing** on `Report AWM User Exceptions` (F288) — sixth upholding of the inverted
`W-050` judgment, and the second time it has been found on a warehouse-floor routine (after batch 6
F236).

---

## F. State machines and enumerations (additions)

- **Kardex DTS tabs (≥4):** Regular Inventory Detail · Direct-Ship · As-Is Additional Information ·
  Summary — **not four separate ledgers** (F281).
- **Kardex line granularity:** per piece for serial-tracked products; **one line per transaction
  group** otherwise (F282).
- **EDI document types with exception reporting (≥8):** 215 · 214 · Advance Ship Notice ·
  Functional Acknowledgement · Invoice · PO Acknowledgement · PO Ship Acknowledgement ·
  Status Details (F284).
- **Velocity** and **Storage Category** — configured enumerations on both products and storage
  locations; values unpublished (F285).
- **Enumerations implied by the multi-select windows:** Barcode Batch · Barcode Cross Reference ·
  Group · **Inventory Formation** · List · Postal Code · **Product Family** · Serial Number ·
  Storage Category · Storage Location · Truck · Velocity.

> **`Inventory Formation`** and **`Product Family`** are two product-classification dimensions the
> audit has never seen named. `Inventory Formations Overview` was also a related article on
> `Multi-Legged Transfers` (batch 8). Recorded as newly-surfaced gaps.

---

## G. Sequencing rules

1. Product's `Inventory Tracking` on → **every inventory transaction writes a Kardex line** with
   quantity, balance, user, time and comments → purged after `Kardex History Months` (F282, F283).
2. Fulfillment sent to a 3PL → **215 dispatched** → carrier returns **214** → the pair is reconciled
   on the 215 inquiry; unacknowledged documents are found by a dedicated filter (F287).
3. Goods put away → velocity or storage category drifts → **mismatch report** → warehouse staff move
   stock (F285).
4. RF work performed → exceptions logged by type → **counted per user, per warehouse** (F288).

---

## H. Open questions and gaps — carried out of run 04

### Still unread after four runs

1. **`Costing Control Settings`** — the last piece of run 02's cost-exception chain (batch 9).
2. **`Warehouse/Store Location Settings`** — ten-plus named fields across three tabs, referenced from
   six batches.
3. **`Point of Sale Control Settings`** — six Logistics-page fields plus others; still unenumerated
   after four runs.
4. **`Alert Code Settings`** — the fraud and payment-behaviour engine behind hold codes `C7`/`C8`
   (batch 4 F213).
5. **`Assign Specific Pieces At` values** (batch 3) and **`Print Pick List`** FINAL/draft semantics
   (batch 7) — jointly, the reservation-to-piece model.
6. `Update a Product Cost` · `Average Cost` · `Zero-Cost Exception Handling` — the costing model.
7. `EDI Control Settings` · `Third Party Logistics Settings` · `Distribution Status Settings` ·
   `Tracked Storage Location Settings` · `Inventory Formations Overview`.

### Documented but ambiguous — carried out

- **The warehouse-wide replacement search** (batch 7 §H) — three call sites, no description, and it
  may take stock reserved to another order. **The most consequential undocumented behaviour in run
  04.**
- **`Velocity` and `Storage Category` values** — configured enumerations, unpublished (F285).
- **`Distribution Method` values** for add-on cost allocation (batch 10 F273).
- **Whether As-Is Restricted is enforced in `Mass Inventory Update`** (batch 10 F276).
- **The internal mail system** (batch 6 F228) — no article found.
- **Crossdocking** (batch 6 F232) — a filter checkbox and no model.
- **Undefined terms:** fly-by fulfillment · Staging Area · Float Label · phantom · `Ship Direct` on a
  transfer · `CFO Fields` · `Repossession Maximum $` · Inventory Formation · Product Family.
- **Multi-currency scope** beyond landed cost (batch 10 F272).

### Inferences carried out

I-20 through I-49, batch by batch. **Confirmed during the run:** I-34 (batch 5, by batch 7 F241).
**Corrected during the run:** I-22 (hold-code families, by batch 4 F201 — partly right, partly wrong);
I-37 (batch 6, refined by F241). **Downgraded during the run:** I-16 (rebate/chargeback method
identity, by batch 9 F270, which found a *third* similarly-named field).

---

## I. Unknown unknowns

- **Composition reaches the core.** The Kardex — the inventory ledger itself — is a DTS inquiry
  (F281). Not a reporting nicety: **the most fundamental inquiry in the system is assembled from
  configurable parts.** Our screen and field inventory across four runs is a lower bound, and now
  demonstrably so at the centre, not the edges.
- **Two independent ways to have no inventory history** (F282, plus `Track Bin to Bin Transfers`).
  Both invisible from inside the history. Any migration that reads the Kardex as ground truth is
  reading an optional, lossy record.
- **EDI is a layer, not a feature** (F284). Nine document types across three modules, discovered by
  reading report titles. **What else is only visible from the reporting subsection?** This is the
  second run in which a coverage sweep of the reports produced structural findings (run 03 batch 16
  found Dynamic Tab Settings the same way).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Kardex** | The inventory movement ledger; a DTS inquiry with per-type tabs |
| **Inventory Tracking** | Product-record switch; off means no Kardex records exist |
| **Kardex History Months** | Kardex retention setting |
| **Velocity / Storage Category** | Matched attributes on products and locations driving directed putaway |
| **EDI 997 / Functional Acknowledgement** | Trading-partner receipt confirmation, with its own exception report |
| **`No 214 Acknowledgement Received`** | Filter finding pickup manifests the carrier never answered |
| **Inventory Formation / Product Family** | Product classification dimensions; undocumented |
| **Landed Freight Asset** | GL account for freight held as an asset; separately reportable |

---

## Contract adjudication — batch 11

| Contract | Verdict | Basis |
|---|---|---|
| **W-064** *(retention)* | **CONFIRMED — seventh and eighth chains** | `Kardex History Months` (F282); `Purge Days for EDI 215 Transaction Logs` (F287) |
| **W-061** *(cost)* | **CONFIRMED** | Landed Freight Asset separately reportable (F289) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | Kardex carries a running balance per line (F283) |
| **W-050** *(access control)* | **CONFIRMED — inverted, sixth upholding** | Regional Processing on AWM exception reporting (F288) |
| **W-039** *(exceptions)* | **CONFIRMED and broadened** | Nine EDI exception reports plus WMS, putaway, RF and manifest exception surfaces (F284, F286, F290) |
| **W-042** *(propagation / integration)* | **CONFIRMED** | 215/214 request-response reconciliation (F287) |
| **W-055 / W-056** *(piece identity)* | **CONFIRMED** | Kardex granularity follows serial tracking (F282) |
| **Screen composition** | **NEW — confirmed at the core** | The Kardex is a DTS inquiry (F281) |
| **EDI as an integration layer** | **NEW** | F284 |
| **Detect-and-report as house style** | **NEW — the run's organising finding** | F290 |

---

## Next

**Run 04 complete: 280 articles, 11 batches, findings 165–290.**
See `RUN-04-LOGISTICS-DELIVERY-SUMMARY.md`.
