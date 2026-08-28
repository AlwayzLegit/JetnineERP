# Run 04 — Inventory Management — Batch 10: As-Is, return-to-vendor, landed cost, and the Inventory sweep

Status: complete. Findings 271–280. Read-only throughout. No return list created, no cost
distributed, no mass update performed.

This batch closes the **Inventory** subsection (44 articles).

---

## A. Coverage log

### Read this batch

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Distribute Add-on Receiving Costs** | 15185837613204 | read — **actual-vs-estimated landed cost; multi-currency** |
| 2 | Create Return-To-Vendor List | 15185872336020 | read — **RTV requires As-Is; bulk excluded** |
| 3 | Mass Inventory Update | 15185855329940 | read |
| 4 | Details of As-Is Processing | 15185837936148 | read |

### Inventory subsection — all 44 inventoried, disposition stated

| Family | Articles | Disposition |
|---|---|---|
| **Cost exceptions** | Cost Exception Types · Correct a Cost Exception · Cost Exception Adjustments Screen | Batch 9 read the first two; the adjustments screen is the child screen of the second. |
| **Costing / landed cost** | Distribute Add-on Receiving Costs · Layer Detail Window · Allocated Vendor Rebates · Enter a Vendor Rebate · CFO Fields | Add-on cost distribution and layer detail read; **`CFO Fields` remains an unread unknown** (batch 9 §H). |
| **As-Is processing** | Designate Inventory for As-Is Processing · Details of As-Is Processing · As-Is Inventory Detail · Create an As-Is Kit · Select As-Is Pieces · Bulk Storage Location Assignment | `Details of As-Is Processing` read; the family's mechanics were captured from the twelve As-Is-related tabs of `Enter a Stock Adjustment` in batch 9. **`As-Is Inventory Detail` is a Kardex page and stays on the carried-forward list.** |
| **Return to vendor** | Create Return-To-Vendor List · Print Return-To-Vendor List · Complete Return-To-Vendor | Creation read; print and complete are the downstream steps, and the AP side was covered in run 01 and run 03 batch 16 F159. |
| **Receiving schedule / detail** | Maintain Daily Receiving Schedule · Maintain Receiving Detail · Maintain Receiving Schedule By Group · Container Receiving Notes | **Excluded here**; the receiving *calendar* is a purchasing-side concern dissected in run 02, and these are its maintenance screens. Named, not read. |
| **Physical inventory** | Physical Inventory Overview · Freeze Inventory · Enter a Single Physical Count Tag · Enter Multiple Physical Count Tags | **Excluded**; the full operator procedure including freeze, update and clear was read in batch 5 (F219–F222), which calls each of these by name. |
| **Adjustments / mass update** | Enter a Stock Adjustment · Mass Inventory Update · Perform Mass Inventory Updates | Batch 9 read the twelve-tab adjustment screen; the mass update pair read here. |
| **Labels** | Inventory Label Print Screen · Label Queue | **Excluded**; the label queue mechanism was captured in batch 9 F269 and the printing machinery in the earlier standalone Printing handoff. |
| **Other** | Product Sub Filter · Distribution Status Settings *(referenced)* | Named. |

**Inventory: 44/44 inventoried.** Eight read in full across batches 9–10; the rest classified above
with a stated reason. **No article skipped silently.**

---

## B. Wiring findings

### FINDING 271 — There is a routine whose whole purpose is comparing *actual* landed costs against the ones the system estimated

- **Invariant:** estimated add-on costs are reconciled against vendor invoices, and the comparison drives settings changes.
- **Evidence** — `Distribute Add-on Receiving Costs`:
  > "Use this routine to enter information from **invoices received from vendors** and **create a database of the actual landed add-on costs on each invoice**. You can then use the data for analysis reporting, for example **to compare the actual costs with the estimated costs the system generates based on your system settings. Based on the comparison, you can decide whether to update your settings for estimating add-on costs.**"
- **Maps to:** `W-061` (cost) — **CONFIRMED and materially extended**; run 02's thirteen-level landed
  cost hierarchy; `W-041`.

> Run 02 established a **thirteen-level landed cost hierarchy resolved per component**, and the audit
> has treated it since as a costing algorithm. This article reveals the other half: **the hierarchy
> produces estimates, and there is a formal reconciliation loop back to actuals.**
>
> The loop is: settings estimate add-on costs at receipt → vendor invoices arrive → this routine
> records the actuals and distributes them across the receipts they belong to → reporting compares →
> **a human decides whether to retune the estimating settings.**
>
> That is a genuinely sophisticated design and it is **not automatic** — the retuning is a judgement
> call made by a person looking at a variance report. The same house style as everywhere else in this
> ERP: compute, compare, tell a human (batch 2 F184, batch 6 F227).
>
> For the rebuild, this changes the shape of the landed-cost work. It is not "implement the thirteen
> levels"; it is "implement the thirteen levels **and the feedback loop that keeps them honest**."
> Without the loop the estimates drift and nobody notices.

### FINDING 272 — Add-on cost distribution carries an exchange rate, and it is remembered per invoice

- **Invariant:** landed costs can be foreign-currency, with the rate held against the vendor-invoice-costtype key.
- **Evidence** — `Distribute Add-on Receiving Costs`:
  Fields: Vendor · Invoice Number · **Cost Add-On** · Date · **Distribution Method** ·
  Total Distribution $ · **Exchange Rate** · Comment.
  > "Once the information for a particular **vendor, invoice number, and cost-add on** has been entered and saved, **the exchange rate is retained** for the next time that same vendor, invoice number, and cost-add on combination is entered."
- **Maps to:** F271; `W-061`; **NEW** — no contract covers multi-currency.

> **The first sighting of foreign currency in four runs.** Freight and duty on imported furniture are
> invoiced in the shipper's currency, and STORIS handles it here — at the landed-cost layer only, so
> far as we have seen. Nothing in runs 01–03 mentioned currency at all.
>
> The composite key **(vendor, invoice number, cost add-on)** is the natural identity of a
> distribution, and the retained exchange rate means **re-opening a distribution does not silently
> re-rate it** at today's rate. That is the correct behaviour and easy to get wrong.
>
> Whether currency appears anywhere else — vendor records, purchase orders, AP bills — is unknown.
> **Worth asking the business whether LA Mattress imports directly**, because if so this is a whole
> dimension the audit has not seen.

### FINDING 273 — Distribution is a proof-to-zero exercise with a soft warning

- **Invariant:** an invoice's total must be fully allocated before it can be saved, but empty rows only warn.
- **Evidence** — `Distribute Add-on Receiving Costs`:
  > "When all the invoice information is complete and **the total amount distributed (that is, the proof amount is zero)**, you can save the data for reporting purposes. **If any grid rows are selected but have no distributed cost, a warning message appears but you can continue.**"
  > "If you change the **distribution method**, the **Distributed $ column in the grid clears**. A prompt appears before this occurs… If you change the total distribution amount or the exchange rate, the **Amount to Distribute** display field updates with the new **proof amount** (that is, the difference between the total distribution amount and the amount that has already been distributed)."
  > "For **credit Warehouse receipts**, the program **adjusts receipt quantities accordingly**."
- **Maps to:** F271, F272.

> A **proof amount** — accounting discipline applied to a warehouse cost allocation. The invoice
> cannot be saved half-allocated, which is right, but a *selected row with zero allocated* only warns,
> which is also right: sometimes a receipt genuinely bears none of the freight.
>
> **Changing the distribution method wipes the allocations**, with a prompt first. So `Distribution
> Method` is an algorithm selector — by value, by quantity, by weight — and its values are **not
> published**. Given run 02's thirteen-level hierarchy this is likely to be a small but important
> enumeration. Section H.
>
> The credit-receipt clause is a quiet but real behaviour: **negative receipts change quantities, not
> just amounts.**

### FINDING 274 — Return-to-vendor requires the goods to be in As-Is first, and bulk products cannot be returned at all

- **Invariant:** RTV is an As-Is-only path, with a documented workaround for bulk.
- **Evidence** — `Create Return-To-Vendor List`:
  > "Use this routine to create a list of purchased items you want to return to the original vendor. **The items you return must exist in as-is inventory.**"
  > "**For bulk products, since you cannot assign an as-is status, you cannot perform a return-to-vendor.** As a work-around, STORIS suggests you **perform an inventory adjustment and then create an AP credit bill** for the amount you want to reduce or return."
- **Maps to:** run 03 batch 16 F159 (`returned-not-recorded` cleared by the AP bill) — **the front end
  of that chain**; `W-061`; batch 5 F223 (bulk breaks piece handling).

> **The full return-to-vendor chain is now assembled across three runs:**
>
> damaged/defective goods → **moved to As-Is** (batch 9 F265, or automatically via `PFD`, batch 7
> F242) → **Create Return-To-Vendor List** → `Print Return To Vendor List` → the
> **`returned-not-recorded` accrual opens** → **AP bill created** → accrual closes (run 03 batch 16
> F159).
>
> The As-Is precondition is the piece we were missing, and it explains why the As-Is machinery is so
> elaborate: **As-Is is not just a discount status, it is the staging area for everything that leaves
> inventory abnormally** — returns to vendor, write-offs, floor samples, damaged picks.
>
> **Bulk products are excluded entirely**, and the vendor documents a manual workaround rather than
> fixing it. That workaround — adjust inventory, raise an AP credit bill by hand — **bypasses the
> accrual account completely**, so bulk vendor returns never appear on `Report Merchandise Returned
> But Not Credited`. Anyone reconciling that account needs to know bulk is invisible to it.

### FINDING 275 — The return list captures freight and sales tax separately, and authorisation numbers at two levels

- **Invariant:** an RTV is a costed document with header and line authorisation.
- **Evidence** — `Create Return-To-Vendor List`, verbatim sections:
  **LOCATION DETAILS** — Warehouse · Storage · **Reason Code** · Limit by Vendor · **Locate Pieces**
  **SHIPPING DETAILS** — Vendor · Return Date · **Authorization #** · Total Pieces · **Merchandise ·
  Freight · Sales Tax · TOTAL**
  **MERCHANDISE DETAILS** — Product · Serial/Reference # · Comments · **Return Cost $** ·
  Vendor Model · **Freight $** · **Original PO #** · **Authorization #**
- **Maps to:** F274; `W-061`; run 02 (return-to-vendor).

> **Authorization # appears at both header and line level** — one RMA for the shipment, and
> potentially a different one per piece. That is how vendors actually issue RMAs, and a single-field
> model would fail.
>
> **Freight appears at both levels too**, and separately from merchandise value, which is consistent
> with batch 9 F260's `Landed Freight Asset` being its own GL leg: **freight is tracked distinctly
> all the way through, in and out.**
>
> `Original PO #` on the line closes the loop back to purchasing — a returned piece knows which
> purchase order brought it in, which is the same linkage `Report Merchandise Received But Not
> Invoiced` relies on (run 03 batch 16 F159).
>
> **Sales tax on a vendor return** is worth a note: the return credits tax that was paid on the
> inbound purchase, which means RTV touches the tax accounts, not just inventory and AP.

### FINDING 276 — Mass inventory update does four things at once, and one of them removes As-Is status in bulk

- **Invariant:** the four most common As-Is and location corrections are available as a bulk operation.
- **Evidence** — `Mass Inventory Update`:
  > "Use this routine to perform mass updates to the lines selected on the **Perform Mass Inventory Updates** screen. Using this screen, you can **transfer pieces to another warehouse, transfer pieces to another storage location (bin to bin transfer), change the As-Is reason code for multiple pieces, or remove pieces from As-Is status.**"
  Fields: Adjustment Date · **Comment** · New Location · New Storage Location · New Reason Code ·
  RA / PO # · **Remove As-Is Status** · Save.
- **Maps to:** batch 9 F259 (single-piece adjustments), F265 (As-Is Restricted reason codes); `W-050`.

> A two-screen pattern — **select on one screen, act on another** — which is how STORIS does bulk
> throughout (`Complete Multiple Manifests`, batch 2 F188; `Complete Direct Ship Orders`, batch 4
> F205).
>
> The consequential question is **whether the As-Is Restricted permission from batch 9 F265 is
> enforced here.** That rule was stated on four tabs of `Enter a Stock Adjustment`; this screen
> changes reason codes and removes As-Is status for many pieces at once and **says nothing about it**.
> Either the check is applied silently or bulk is a gap. **The documentation does not say, and we do
> not guess.** Section H — and it is a real control question, not a curiosity.
>
> Note the `Comment` field again: the fifth-and-sixth instance of free-text-as-audit-trail in run 04.

### FINDING 277 — Moving stock to As-Is opens a piece-detail screen whenever identity matters

- **Invariant:** special-order, serial-tracked, or already-As-Is stock forces piece-level selection.
- **Evidence** — `Details of As-Is Processing`:
  > "Use this routine to enter detail information for **special order, serial tracked, and As-Is pieces** that you are manually moving. This screen appears **automatically** when you enter a number in the **Quantity To Move** field on the **Designate Inventory for As-Is Processing** screen, **provided the product is special order, serial tracked, or there are As-Is pieces in the associated storage location.**"
- **Maps to:** batch 9 F267 (three tracking switches); batch 3 F190 (`Assign Specific Pieces At`).

> A **three-way trigger condition**, and the third one is the interesting one: the piece-detail screen
> appears if there are **already As-Is pieces in that storage location** — even for an untracked stock
> product. Because if As-Is and regular stock of the same product share a bin, "move two to As-Is"
> is ambiguous about *which* two, and the pieces have different prices.
>
> That is careful thinking about a real ambiguity, and it confirms batch 9 F267's point from another
> angle: **STORIS always has piece identity; it asks the user to disambiguate only when the answer
> matters.**

### FINDING 278 — `Locate Pieces` and `Limit by Vendor` make the RTV list a search-and-gather operation

- **Invariant:** building a return list starts from a warehouse search, not from a document.
- **Evidence** — `Create Return-To-Vendor List`, **LOCATION DETAILS**: Warehouse · Storage ·
  Reason Code · **`Limit by Vendor`** · **`Locate Pieces`**.
- **Maps to:** F274; batch 9 F265 (reason codes).

> The workflow is: **pick a warehouse and storage area, optionally filter to one vendor, filter by
> As-Is reason code, and find the pieces.** So RTV is driven from the *reason a piece is As-Is* —
> vendor-defective pieces are gathered by their reason code and shipped back together.
>
> That makes the As-Is reason code the organising key of the whole returns process, which raises its
> importance again after batch 9 F265 showed reason codes carry permissions and behaviour. **The
> reason-code model now touches: manifest removal, physical inventory, damaged picks, As-Is status,
> write-off eligibility, and vendor returns.** It deserves to be designed first in the rebuild, not
> last.

### FINDING 279 — Bulk products are excluded from a growing list of operations

- **Invariant:** bulk is a second-class inventory type with several capabilities missing.
- **Evidence**, assembled across run 04:
  - `Create Return-To-Vendor List`: *"For bulk products, since you cannot assign an as-is status, you cannot perform a return-to-vendor."* (F274)
  - `Enter a Stock Adjustment`, As-Is Adjustment tab: *"this tab is active if the product in not a bulk product."* (batch 9 F268)
  - `Batch Bar Code Receiving` / `Full Physical`: bulk labels carry a keyed quantity and **break the scan count model** (batch 5 F223)
  - `Pieces Not Completed Detail`: *"Not all product types (bulk, non-inventory for example) are applicable for all information on this screen."* (batch 2)
- **Maps to:** `W-055`; `W-061`; batch 5 F223.

> Four independent exclusions in one run. **Bulk products cannot be As-Is, cannot be returned to
> vendor, cannot be adjusted directly to As-Is, and count differently.** The root cause is stated
> once, in F274: *"since you cannot assign an as-is status"* — **bulk has no piece identity**, and
> everything As-Is-related is piece-based.
>
> That is a coherent model, but it means **inventory type is a fundamental branch in the design**,
> not an attribute. Anything the business handles in bulk (fill, components, accessories by the case)
> loses an entire class of operations, and the workarounds are manual.
>
> `non-inventory` appears alongside bulk as another product type with restrictions. The full product
> type enumeration has never been published in anything the audit has read across four runs.

### FINDING 280 — The Inventory subsection's coverage confirms As-Is as the hub of abnormal inventory movement

- **Invariant:** every non-sale exit from inventory routes through As-Is.
- **Evidence**, assembled: return-to-vendor requires As-Is (F274) · write-off operates on As-Is
  (batch 9, Write-Off tab) · damaged picks become As-Is (batch 7 F242, batch 5 F218) · failed
  deliveries can be added to As-Is (batch 2 F186) · floor samples become As-Is (batch 8 F258) ·
  physical inventory counts add and remove As-Is pieces (batch 5 F220) · vendor chargebacks move
  pieces to As-Is (batch 9 F270).
- **Maps to:** `W-061`; `W-055`; `W-052`.

> Seven independent paths into As-Is, found across six batches. **As-Is is not a discount category —
> it is the quarantine and disposition layer of the whole inventory model**, and the audit only sees
> this by assembling it.
>
> Every one of those paths is also a **cost event**, because As-Is merchandise is repriced, and by
> run 03 F144 a cost change restates written sales orders. So the chain from *a picker dropping a
> headboard* to *a negative margin adjustment on last month's sale* is fully documented, in seven
> articles across four subsections, and stated nowhere.
>
> **This is the single most valuable synthesis in run 04** and it belongs at the top of the run
> summary. Our rebuild needs an As-Is-equivalent concept with: piece identity, a reason code carrying
> permissions, its own price, its own spiff, a label, and a documented exit to every downstream
> disposition.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Distribute Add-on Receiving Costs** | Vendor · Invoice Number · Cost Add-On · Date · **Distribution Method** · Total Distribution $ · **Exchange Rate** · Comment · **Receipt Details:** PO Number · Reference Number · Vendor · Start Date · End Date · Receiving Location · Model Number · Select · **Distribute Rows** · **Amount To Distribute** *(proof)* · Rows Selected Quantity |
| **Create Return-To-Vendor List** | **LOCATION DETAILS:** Warehouse · Storage · Reason Code · Limit by Vendor · Locate Pieces · **SHIPPING DETAILS:** Vendor · Return Date · Authorization # · Total Pieces · Merchandise · Freight · Sales Tax · TOTAL · **MERCHANDISE DETAILS:** Product · Serial/Reference # · Comments · Return Cost $ · Vendor Model · Freight $ · Original PO # · Authorization # |
| **Mass Inventory Update** | Adjustment Date · Comment · New Location · New Storage Location · New Reason Code · RA / PO # · Remove As-Is Status · Save |
| **Details of As-Is Processing** | Storage Location · Product · Quantities · Grid Information |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| *(estimated add-on costs)* | system settings *(unnamed here)* | Generate the estimates that F271's routine reconciles against |
| **Distribution Method** | run-time on Distribute Add-on Receiving Costs | Allocation algorithm; **values not published** (F273) |

> The settings that *estimate* add-on costs are referred to only as "your system settings" and "your
> settings for estimating add-on costs". Run 02's thirteen-level hierarchy is presumably where they
> live. **Not named in this article**, and recorded as such.

---

## E. Security permissions catalog (additions)

No new permission names. **One open control question**: whether the As-Is Restricted reason-code
check (batch 9 F265) applies to `Mass Inventory Update`, which changes reason codes in bulk and does
not mention it (F276).

---

## F. State machines and enumerations (additions)

- **Paths into As-Is (7):** damaged pick · damaged in prep (`PFD`) · failed delivery · floor sample
  transfer · physical inventory update · vendor chargeback · direct adjustment (F280).
- **Paths out of As-Is (3):** sale at the As-Is price · **return to vendor** · **write-off** —
  plus `Move From As-Is` back to saleable.
- **Product types with documented restrictions:** **bulk** *(no As-Is, no RTV, no direct-to-As-Is
  adjustment, keyed scan quantity)* · **non-inventory** (F279).
- **RTV document structure:** location details · shipping details *(header authorisation, freight,
  sales tax)* · merchandise details *(line authorisation, line freight, original PO)*.
- **Mass update operations (4):** warehouse transfer · bin-to-bin · change As-Is reason code ·
  remove As-Is status.
- **Add-on cost distribution key:** (vendor, invoice number, cost add-on) — **exchange rate retained
  against it**.

---

## G. Sequencing rules

1. Goods become As-Is by one of seven paths (F280) → gathered by warehouse, storage and **reason
   code** → `Create Return-To-Vendor List` → `Print Return To Vendor List` → **`returned-not-recorded`
   accrual opens** → AP bill → accrual closes *(run 03 batch 16 F159)* (F274, F278).
2. **Bulk**: no As-Is, so no RTV — manual inventory adjustment plus an AP credit bill instead, **which
   bypasses the accrual** (F274).
3. Receipt → **estimated** add-on costs applied from settings → vendor invoice arrives → actuals
   recorded and distributed to receipts until the **proof amount is zero** → variance reported →
   **a human retunes the estimating settings** (F271, F273).
4. Changing the distribution method **clears all allocations**, after a prompt (F273).
5. `Designate Inventory for As-Is Processing` → quantity entered → **`Details of As-Is Processing`
   opens automatically** if the product is special order, serial-tracked, or As-Is pieces already sit
   in that location (F277).

---

## H. Open questions and gaps

### Carried forward into the final subsection — priority order

1. **`Costing Control Settings`** (batch 9) — the last piece of run 02's cost-exception chain.
2. **The four Kardex ledgers** / `View Detailed Activity for a Product`, including its
   **`As-Is Inventory Detail`** page — unread since run 02, and by batch 9 F259 the only record of
   adjustment history.
3. **`Update a Product Cost`** · `Average Cost` · `Zero-Cost Exception Handling` — the costing model.
4. **`Warehouse/Store Location Settings`** · **`Alert Code Settings`** · **`Print Pick List`** ·
   **`Assign Specific Pieces At` values** — carried from batches 3, 4 and 7.
5. `Distribution Status Settings` · `Third Party Logistics Settings` (batch 8) ·
   `Tracked Storage Location Settings` (batch 5).

### Documented but ambiguous

- **`Distribution Method` values** — the allocation algorithm's options are not published (F273).
- **Whether As-Is Restricted is enforced in `Mass Inventory Update`** (F276). A real control gap or a
  documentation omission; unresolved.
- **Where the add-on cost *estimating* settings live** — referred to only as "your system settings"
  (F271, §D).
- **Whether multi-currency appears anywhere but landed cost** (F272).
- **The full product type enumeration** — bulk and non-inventory are named; the set is not (F279).
- **`Repossession Maximum $`** and **`CFO Fields`** — carried from batch 9, still unexplained.
- **Whether the bulk RTV workaround's AP credit bill** is recognisable as a vendor return in
  reporting, given it bypasses `returned-not-recorded` (F274).

### Inferences (recorded as inference, not fact)

- **I-47:** `Distribution Method` probably offers allocation by value, by quantity, and possibly by
  weight or volume. *Purely conventional; no values are published.*
- **I-48:** The add-on cost estimating settings are probably run 02's thirteen-level landed cost
  hierarchy. *Strongly implied by subject matter; never stated in either article.*
- **I-49:** As-Is Restricted probably *is* enforced in Mass Inventory Update, since the rule is
  described as applying to "any action affecting inventory". *The phrase supports it; the article's
  silence does not confirm it.*

---

## I. Unknown unknowns

- **Foreign currency** (F272). Four runs with no sighting, then an exchange rate field on a
  landed-cost screen. If the business imports directly, currency may touch vendors, POs and AP in
  ways the audit has entirely missed.
- **The estimate-reconcile-retune loop** (F271). We had the costing hierarchy and assumed it was the
  whole story. It is half. **Wherever this ERP computes an estimate, there may be a matching
  reconciliation routine we have not looked for** — and the audit should check for that pattern
  around delivery charges, ATP dates and capacity in the remaining reading.
- **As-Is as the disposition hub** (F280). Assembled from seven articles across four subsections and
  stated in none of them. **The most important structures in this ERP are the ones no single article
  describes**, which is the strongest possible argument for the whole-section method the user chose.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Add-on cost** | Landed cost component (freight, duty) estimated at receipt, reconciled to vendor invoices |
| **Proof amount** | Undistributed remainder of an invoice; must be zero to save |
| **Distribution Method** | Algorithm allocating an invoice across receipts; values unpublished |
| **Return-To-Vendor List** | The RTV document; requires As-Is pieces; carries freight and tax |
| **Locate Pieces** | The As-Is search that populates an RTV list |
| **Mass Inventory Update** | Bulk warehouse transfer, bin-to-bin, reason-code change, or As-Is removal |
| **Bulk product** | No piece identity: no As-Is, no RTV, keyed scan quantities |

---

## Contract adjudication — batch 10

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** *(cost and margin)* | **CONFIRMED and materially extended** | Estimated landed costs are formally reconciled to vendor invoices, with a human retuning loop (F271); multi-currency (F272) |
| **W-041** *(cost exceptions)* | **consistent** | Add-on distribution is the estimate side of the same machinery |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | RTV carries freight and sales tax; the accrual chain completes (F274, F275) |
| **W-055 / W-056** *(availability, piece identity)* | **CONFIRMED** | Piece disambiguation forced only where identity matters (F277); bulk has none (F279) |
| **W-046** *(vendor rebates/chargebacks)* | **consistent** | `Allocated Vendor Rebates` and `Enter a Vendor Rebate` inventoried |
| **W-050** *(access control)* | **NOT DOCUMENTED for bulk update** | The As-Is Restricted check is not mentioned on Mass Inventory Update (F276) |
| **Multi-currency** | **NEW — no contract covers it** | F272 |
| **Estimate/actual reconciliation loop** | **NEW** | F271 |
| **As-Is as the disposition hub** | **NEW — synthesis across six batches** | F280 |

---

## Next — batches 11–12: Inventory Views and Reports (103 articles)

The final subsection, and where the carried-forward priorities live: the **four Kardex ledgers**,
`Update a Product Cost`, `Average Cost`, and the frozen-quantity and variance reports named
throughout batches 5–10.
