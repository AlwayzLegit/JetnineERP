# Run 02 — Merchandising — Batch 2: Costing, Landed Cost and Cost Exceptions

**Status: complete.** 16 articles. This batch was pulled forward out of report order because run 1
closed with an unresolved question — *does STORIS have any purchase price variance mechanism at all?*
**It does, and it is not an account. It is a work queue.**

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Report Active Costing Exceptions** | /articles/15202552070804 | EXTRACTED |
| 2 | Report Solved Costing Exceptions | /articles/15203214704532 | EXTRACTED |
| 3 | Report Purchase Orders with Changed Costs | /articles/15203128186388 | EXTRACTED — thin |
| 4 | **View Product Cost Activity** | /articles/15295154559636 | EXTRACTED |
| 5 | Layer Detail Screen | /articles/15294751621780 | EXTRACTED |
| 6 | Report Current Costs of Received Purchase Orders | /articles/15202504951188 | EXTRACTED |
| 7 | Report Historical Costs of Received Purchase Orders | /articles/15202946263060 | EXTRACTED — thin |
| 8 | Purchase Order Discount Inquiry | /articles/15294751790100 | EXTRACTED |
| 9 | **Costing Control Settings** *(linked, System Administration)* | /articles/15186501540884 | EXTRACTED |
| 10 | **Cost Exception Types** *(linked, Inventory Management)* | /articles/15185804531348 | EXTRACTED |
| 11 | **Zero-Cost Exception Handling** *(linked, System Administration)* | /articles/15186452150932 | EXTRACTED |
| 12 | **Correct a Cost Exception** *(linked, Inventory Management)* | /articles/15185837613332 | EXTRACTED |
| 13 | Cost Exception Adjustments Screen *(linked)* | /articles/15185804530708 | EXTRACTED |
| 14 | **Average Cost** *(linked, Overviews → Rules)* | /articles/15294468993940 | EXTRACTED |
| 15 | **Landed Freight and Add-On Costs Overview** *(linked, Overviews → References)* | /articles/15294522839316 | EXTRACTED |
| 16 | **Inventory Costing FAQs** *(linked, FAQ → Inventory)* | /articles/36208164333076 | EXTRACTED — all 3 answers expanded |

Discovered and queued: `Update a Product Cost (Manual Cost Adjustment)` · `Distribute Add-on Receiving
Costs` · `Report Add-on Distribution Analysis` · `Report Value of Inventory` · `Enter Multiple Vendor
Invoices` · `Advanced Product Settings` (Cost tab) · `Advanced Vendor Settings` (Shipping tab) ·
`Advanced Regional Vendor Settings` · `District and Regional Product Settings` ·
`Receive a Purchase Order with a Separate Freight Bill` · `Costed Line Item Display` ·
`Sales Margin Scratchpad` · `Physical Inventory` freeze routines · `Regional Processing`.

---

## B. Wiring findings

### FINDING 29 — STORIS has no purchase price variance account. It has a cost exception queue, and the queue is the variance
Invariant:  "Cost exceptions occur when **the price of an item changes from the price on the purchase
            order on which it was received** or **an item was received at zero-dollar cost**."
Invariant:  "The system creates cost exceptions **when unsure of the proper cost to attach to a piece
            of merchandise**. For example, if you receive a piece into your system at $0, the system
            attempts to verify that this is the true cost. Or, **you may receive a piece at one cost,
            but then approve it for payment (using the `Enter Multiple Vendor Invoices`) at a
            different cost.**"
Exception types (verbatim, complete):
            **`1` - Zero Cost on Warehouse Receipts**
            **`2` - Zero Cost on Inventory Adjustments**
            **`3` - Zero Cost on Customer Returns**
            **`4` - Inventory AP Bill Cost Exception**
Report columns: exception number · exception type · exception type description · product number ·
            **logical transaction date** · quantity · purchase order number · reference number ·
            customer return number · **receipt cost · old AP bill cost · new AP bill cost** ·
            AP bill number · **exception value**
Evidence:   Correct a Cost Exception, /articles/15185837613332;
            Inventory Costing FAQs, /articles/36208164333076;
            Cost Exception Types, /articles/15185804531348;
            Report Active Costing Exceptions, /articles/15202552070804
Maps to:    **W-041 — ADJUDICATED. The mechanism exists; it is not a GL variance account.**

> This is the answer run 1 could not find, and it is a genuinely different architecture from the one
> a typical ERP would use. When the AP bill cost differs from the receipt cost, most systems post the
> difference to a purchase price variance account and move on. **STORIS instead raises a numbered
> exception record — type 4 — carrying `receipt cost`, `old AP bill cost`, `new AP bill cost`, the
> AP bill number and an `exception value`, and puts it in a queue a human must clear.** The variance
> is real, it is quantified, it is reportable and subtotalled — but until someone works it, it sits
> outside the general ledger as an open item. Run 1's "no PPV account, the operator restates cost
> until the bill proves to zero" was correct in outcome; **this is the machinery that makes the
> operator do it.** Note also that the exception is raised at **AP approval** (`Enter Multiple Vendor
> Invoices`), which means the trigger lives in Accounting and the queue lives in Inventory.

### FINDING 30 — Type 4 exceptions cannot be auto-resolved. Only zero-cost ones can
Invariant:  "**To correct type 4 cost exceptions, you must use the manual method via the `Correct a
            Cost Exception` routine.**"
Invariant:  "Use the `Automatic Handling of Cost Exceptions` fields in the `Costing Control Settings`
            to specify how you want to handle cost exceptions **when a zero cost is found**."
Automatic options (verbatim, complete):
            **`Do not Handle`** = "Leave the exception as it is. If you select this option, you must
              manually solve the exception. The exception appears in the `Report Active Costing
              Exceptions` report, which runs **at End of Day or on demand**."
            **`Use Average`** = "Use the average cost of the product to solve the exception."
            **`Use Replacement Cost`** = "Use the replacement cost **for the model number** to solve
              the exception."
            **`Skip the Exception`** = "**Allow the inventory to be received at zero cost and clear
              the exception.** The accepted cost exception appears in the `Report Solved Costing
              Exceptions` routine."
Zero-cost check points (verbatim): "The system checks for zero costs during the following processes:
            **purchase order entry · inventory receiving · inventory adjustment · customer-return
            completion**."
Per-process settings: `Customer Returns Zero Cost` · `Customer Returns Non Zero Cost` ·
            `Warehouse Receipts Zero Cost` · `Positive Adjustments Zero Cost` · `Skip on Zero` ·
            **`Inventory AP Approval`** · `Next Cost Exception Number`
Evidence:   Costing Control Settings, /articles/15186501540884;
            Zero-Cost Exception Handling, /articles/15186452150932
Maps to:    **NEW — and it splits the exception population in two**

> The automatic-handling machinery is **entirely about zero cost** — types 1, 2 and 3. The AP-bill
> variance, type 4, is explicitly excluded and must be worked by hand, one exception at a time.
> That is the operationally significant fact for cutover: **every purchase price variance in this
> business is a manual touch.** Two further points. `Skip the Exception` is a configurable option to
> **capitalise inventory at zero and call it resolved** — a permanent, silent understatement of
> inventory value that shows up only in the *solved* report. And there is a per-process setting named
> `Inventory AP Approval` on the same tab, which suggests type-4 behaviour may be configurable after
> all; **the article never says what its options are.** Flagged in H.

### FINDING 31 — An open cost exception blocks physical inventory
Invariant:  "**If active cost exceptions exist in the system, you cannot perform a physical inventory
            freeze.**"
Evidence:   Correct a Cost Exception, /articles/15185837613332
Maps to:    **NEW — a hard cross-module gate**

> Merchandising/AP state blocks an Inventory Management process outright. A single unworked AP bill
> variance stops the entire physical count. This is the kind of coupling that only shows up at
> year-end, and it means the cost-exception queue is not merely hygiene — **it is on the critical
> path of the inventory close.** Combined with Finding 30 (type 4 is manual-only), the sequencing is:
> AP approves bills at variant costs → exceptions accrue → someone must clear all of them → only then
> can you freeze.

### FINDING 32 — Cost lives in a separate FIFO-layer file that is purged on a timer
Invariant:  "Each time you add a product to inventory via warehouse receiving entry programs or via
            inventory adjustments, **the system creates a new FIFO layer**. The system maintains this
            cost and quantity information in an internal file called the **Costing Table**."
Invariant:  "**The system purges the Costing Table based on the retention days specified in the
            `(Days to Hold) Costing Table Data` field in the `Costing Control Settings`.**"
Retention fields on that settings page: `Retain Days` · **`Solved Cost Exceptions`** ·
            **`Costed Auditing Data`** · **`Costing Table Data`**
Invariant:  "Average cost for products resides in an internal file called the Costing Table."
Invariant:  "**For products flagged as special-ordered, the system does not maintain average cost.**"
Evidence:   View Product Cost Activity, /articles/15295154559636;
            Average Cost, /articles/15294468993940;
            Costing Control Settings, /articles/15186501540884
Maps to:    **NEW — and it is a data-migration risk**

> Three separate retention timers govern costing history: the costing table itself, solved cost
> exceptions, and "costed auditing data". **Inventory cost history is not permanent** — it expires on
> a configured schedule, and once purged the FIFO layers behind a current average cost are gone. For
> a cutover this matters twice: what we can extract is bounded by these settings as they stand today,
> and whatever we build has to decide deliberately whether to keep layers forever. Also note
> **special-order products have no average cost at all** — a whole product class sits outside the
> costing model.

### FINDING 33 — Average cost is a receipt-weighted running average with one editable moment
Invariant (verbatim formula):
            **`(Current Quantity On-Hand * Current Average Cost) + (Quantity Being Received * Receiving Cost)`**
            **`———————————————————————————————————————`**
            **`(Current Quantity On-Hand + Quantity Being Received)`**
Invariant:  "When you create a product, you use the `Average Cost` field in the `Advanced Product
            Settings` (or the `Product Settings`) to specify the average cost… **Once you initially
            save the product, the system uses that amount in calculations and you cannot edit the
            field.** After initial creation, you must use the **`Update a Product Cost` (Manual Cost
            Adjustment)** routine to update the average cost."
Setting:    `AVERAGE COST - Include Saleable Receipts only` — "**NOTE: It is not recommended that this
            setting be checked when G/L posting is set to post with an average cost.**"
Evidence:   Average Cost, /articles/15294468993940;
            Costing Control Settings, /articles/15186501540884
Maps to:    **NEW — closes a run-1 gap on inventory valuation**

> The seed average cost is a **one-shot write at product creation**, after which the field is locked
> and only a named routine can move it. That is the only clean provenance point in the model: every
> later value is the running average plus whatever manual adjustments were made. The
> `Include Saleable Receipts only` switch carries an explicit warning that it **conflicts with GL
> posting at average cost** — meaning the system permits a configuration in which the average cost
> used for valuation and the average cost posted to the ledger are computed over different receipt
> populations. Run 1 flagged inventory/GL reconciliation as an opt-in audit; this is one concrete way
> the two can drift.

### FINDING 34 — Landed cost resolves through a thirteen-level hierarchy, per add-on, independently
Invariant:  "When determining which add-on cost to use for a product on a purchase order, **the system
            references the following files in the following order, applying the first cost found**."
Order (verbatim, 1 → 13):
            1. Regional product level ship from exception — *District and Regional Product Settings*
            2. Regional vendor ship from exception — *Advanced Regional Vendor Settings*
            3. Product vendor ship from exception — *Advanced Product Settings, Cost tab*
            4. Vendor ship from exception — *Advanced Vendor Settings, Shipping tab*
            5. Regional product level — *District and Regional Product Settings*
            6. Regional vendor **group** exception — *Advanced Regional Vendor Settings*
            7. Regional vendor **category** exception — *Advanced Regional Vendor Settings*
            8. Regional vendor level — *Advanced Regional Vendor Settings*
            9. Advanced product level — *Advanced Product Settings, Cost tab*
           10. Advanced vendor **group** exception — *Advanced Vendor Settings*
           11. Advanced vendor **category** exception — *Advanced Vendor Settings*
           12. Advanced vendor level — *Advanced Vendor Settings*
           13. **Company — Costing Control Settings**
Invariant:  "**All add-on costs follow the same hierarchy, but discretely.** That is, the system can
            apply any of the costs from any level in the hierarchy."
Invariant:  "STORIS calculates landed cost **at the time of receiving**. When determining the final
            landed cost of a product, the system adds the calculated add-on and freight costs to the
            material cost and **posts them to the GL accounts indicated in the `General Ledger
            Assigned Account Settings` for any add-on costs specified for the product**."
Estimated vs actual: "The **`Estimated Landed Cost`** field in Purchase Order Entry displays the total
            landed cost for the order at the time of entry. **Since this landed cost may change by the
            time you receive the order, STORIS labels this field as 'estimated'.**"
Recommendation: "STORIS recommends you set the freight factor at the **vendor level rather than the
            product level**, except for unusual products."
Evidence:   Landed Freight and Add-On Costs Overview, /articles/15294522839316
Maps to:    **NEW — and it is the largest single fall-through hierarchy found in the audit so far**

> Run 1's account-resolution fall-through had three levels. **This one has thirteen, and each of the
> five cost components — Freight, Add-on 1 through 4 — resolves through it independently.** So a
> single received line can draw its freight factor from the vendor's shipping tab and its duty factor
> from the product's cost tab, with nothing on the resulting record saying where either came from.
> That is 5 × 13 = 65 possible configuration origins per received line. Two consequences for the
> rebuild: **resolution must be logged** (STORIS does not appear to log it), and the migration has to
> read all thirteen files, not just the company default, or landed costs will silently change.
> Note the closing link to run 1: these add-ons **post to `General Ledger Assigned Account Settings`**
> — the same ~120-slot posting table run 1 mapped — so the landed-cost asset/liability pairs found
> there are fed by this hierarchy.

### FINDING 35 — Landed add-on slots are four unnamed generics whose labels are company-configured
Invariant:  "Each add-on cost also has a field to enter a **label** (for example, **`Duty` or
            `Misc`**). **The labels you specify appear whenever the add-on cost appears in the
            system.**"
Settings:   `Landed Add-on Cost Label` · `Landed Add-on Cost Label Drop-Down` ·
            `LANDED FREIGHT - Active` · `LANDED FREIGHT - Add-on Cost 1/2/3/4 Active`
Screen evidence: the `Layer Detail Screen` grid shows **`Duty · Misc · Add3 · Add4`** — two labelled,
            two left generic — beside `Material · COM · Total Material · Freight · Total Landed`.
Invariant:  "The values in the fields (**`DUTY`, `MISC`, etc.**) to the left of the amounts are
            specified in the `Costing Control Settings`. **The `Type` fields display `P` if the add-on
            cost amount is a percentage, or `D` if the add-on cost amount is a dollar amount.**"
Evidence:   Landed Freight and Add-On Costs Overview, /articles/15294522839316;
            Layer Detail Screen, /articles/15294751621780;
            View Product Cost Activity, /articles/15295154559636
Maps to:    **NEW — and a documented-screen-is-a-default trap, same family as run 1's DTS finding**

> There are exactly **four** add-on slots plus freight. Not five, not extensible. Their meaning is a
> label typed into a control setting, so `Duty` and `Misc` in the help center are **this
> installation's choices, not the data model**. Every report, screen and GL mapping that mentions
> "Duty" is actually referring to add-on slot 1. Run 1 found the same shape in Dynamic Tab Settings:
> **documented screens are shipped defaults, not specifications.** For the rebuild: four is a hard
> ceiling to check against LA Mattress's actual landed-cost components before assuming parity.

### FINDING 36 — A product carries six distinct cost values simultaneously
Fields (verbatim, `View Product Cost Activity` → Details → Cost):
            **`Average` · `Replacement` · `Landed Average` · `Domestic Landed Replacement` ·
            `Foreign Landed Replacement`** — plus the add-on block (`Add-On`, `Freight`,
            `Percent or Dollar`)
Costing methods (verbatim, `Costing Control Settings`): "The available costing methods are:
            **`Replacement Cost` · `Weighted Average Cost` · `Exact (Actual) Cost`**"
Purpose:    "Use this routine to specify your methods for calculating the cost of **sales,
            commissions, and returns-to-vendor**." · "You can include the **landed freight and/or
            add-on cost values** when calculating the landed cost."
Layer costs (verbatim, `Layer Detail Screen`): `Material · COM · Total Material · Duty · Misc ·
            Add3 · Add4 · Freight · **Total Landed**`
Evidence:   View Product Cost Activity, /articles/15295154559636;
            Costing Control Settings, /articles/15186501540884;
            Layer Detail Screen, /articles/15294751621780
Maps to:    **W-061 — CONFIRMED and considerably enlarged**

> Six product-level cost values, three selectable costing methods, and the method is chosen
> **separately for cost of sales, for commissions, and for returns to vendor**. So the cost used to
> compute a salesperson's commission need not be the cost used to value the sale in the ledger, and
> neither need match the cost used to credit a vendor return. Note also that **domestic and foreign
> landed replacement costs are separate fields** — the import/domestic split found in batch 1's
> addendum printing and foreign-vendor hold reasons is a real dimension of the cost model too.
> `COM` (customer's own material) is a first-class component of layer cost, tying back to batch-1
> Finding 1's COM tab.

### FINDING 37 — Foreign-vendor products get their average cost written from a purchase order screen, through the exchange rate
Invariant (verbatim chain): "**The replacement cost updates in the Product file, which in turn updates
            the average cost in the Costing Table, which in turn updates the `Average Cost` field back
            in the Product file. Note that the update calculation includes the exchange rate
            associated with the foreign vendor.**"
Conditions (all four required): the `Update Product Replacement Cost Within Purchase Entry Screens`
            field in **Extended Security**; the routine is one of **`Purchase Order Entry` ·
            `Purchase Order Acknowledgement` · `Product Performance and Purchase Recommendations`**;
            the product is a **foreign-vendor product for which quantity has never been on hand**;
            and you "**answer `Yes` to the prompt asking if you want to update the replacement cost**".
Evidence:   Average Cost, /articles/15294468993940
Maps to:    **NEW — completes batch-1 Finding 9**

> Batch 1 found that the PO screen can rewrite the product master's replacement cost. This says what
> happens next: for foreign-vendor products never yet stocked, that write **cascades into the Costing
> Table and back out into average cost, converted at the vendor's exchange rate**. Three screens can
> trigger it, one of which is `Product Performance and Purchase Recommendations` — a *merchandising
> analysis* screen with a write path into inventory valuation. The whole cascade hangs on a Yes/No
> prompt and one Extended Security flag. This is a real audit finding: **a buyer answering a prompt
> can move inventory cost**, and the only trace is whatever `Track Processing Activity` was
> configured to capture (batch 1, Finding 15).

### FINDING 38 — Product cost visibility is a single security flag with system-wide reach
Invariant:  "If you inactivate (remove the check from) the **`View and access product cost
            information`** field in the user/user group **System** security settings, the user or
            group **cannot access or view cost information. This includes restriction from cost
            information during purchase order receiving, as well as viewing cost information on
            inquiry screens.**"
Contradicting locus: `Report Current Costs of Received Purchase Orders` says the Container Receipts
            option "is available only if the **`View and access product cost information`** field is
            enabled in the **Extended Security** settings."
Evidence:   Inventory Costing FAQs, /articles/36208164333076;
            Report Current Costs of Received Purchase Orders, /articles/15202504951188
Maps to:    **W-050 — supports run 1's "inverted" judgment; and a terminology conflict**

> One flag hides cost everywhere — inquiries, receiving, reports. But the **two articles disagree on
> which security file it lives in**: "System security settings" in the FAQ, "Extended Security
> settings" in the report article. Run 1 counted twelve distinct access-control mechanisms and judged
> `W-050` inverted; this is a live example of why — the docs themselves cannot keep the security
> surfaces straight. Recorded as a conflict, not resolved.

### FINDING 39 — Freight has two mutually exclusive models, and choosing wrong double-counts
Invariant:  "**NOTE: You should only establish preset freight landed values if you are NOT using the
            `Receive a Purchase Order with a Separate Freight Bill` program.** That is, container
            receiving allows you to enter a freight amount during the receiving process for itemized
            freight allocations."
Invariant:  "The `Open Container Batches` option lists open container receipts on which some
            merchandise has been received. Container Receiving batches **remain open until you access
            the batch via the `Receive a Purchase Order with a Separate Freight Bill` program and
            select the `Close Batch` option. This report does not include freight factors, as the
            system does not calculate and distribute freight factors until the batch is closed.**"
Evidence:   Inventory Costing FAQs, /articles/36208164333076;
            Report Current Costs of Received Purchase Orders, /articles/15202504951188
Maps to:    **NEW**

> **Estimated freight factors and actual container freight are alternatives, not layers.** Use both
> and you land freight twice. And container receiving defers all freight distribution to batch close,
> so between receipt and close the inventory is on the books at material cost only — a window in
> which valuation is knowably understated and no report will show the gap.

### FINDING 40 — There is a whole estimate-vs-actual reconciliation loop for add-on costs, outside the exception queue
Invariant:  "**`Distribute Add-on Receiving Costs`** - Use this routine to enter information from
            invoices received from vendors and **create a database of the actual landed add-on costs
            on each invoice**."
Invariant:  "**`Report Add-on Distribution Analysis`** - This report displays information on
            **variances between estimated landed add-on costs and actual landed add-on costs** entered
            via the `Distribute Add-on Receiving Costs` routine."
Framing:    "If you think your estimated add-on cost settings result in inaccurate estimates, you can
            use the following routines to compare estimated add-on costs with actual add-on costs from
            selected vendor invoices. **Based on the comparison, you can decide whether to update your
            settings** for estimating add-on costs."
Evidence:   Landed Freight and Add-On Costs Overview, /articles/15294522839316
Maps to:    **NEW — a second, separate variance mechanism**

> So there are **two** variance systems and they do not meet. Material-cost variance (receipt vs AP
> bill) goes to the type-4 cost exception queue and must be cleared before a physical freeze.
> Landed add-on variance (estimated factor vs actual invoice) goes to a **separate database** and
> produces an advisory report whose only stated purpose is *to help you retune the estimates*. There
> is no statement anywhere that the add-on variance is ever posted, corrected on the layer, or
> cleared. **If that is right, landed cost on received inventory is never trued up** — it stays at
> the estimated factor forever. Recorded as quoted; the "never trued up" reading is in H as an
> inference.

### FINDING 41 — Costing Control Settings carries five GL posting switches that belong to run 1's posting map
Switches (verbatim):
            **`GENERAL LEDGER - Always Adjust Stocked Inventory at the Average Cost`**
            **`GENERAL LEDGER - Post RTV Write-off of Landed Cost Assests against Landed Liability Accounts`** *(sic — "Assests")*
            **`GENERAL LEDGER - Post RTV Valuation Difference At Completion`**
            `REDUCE CUSTOMER RETURNS - Prorate the Landed/Freight Value`
            `DEPRECIATE REPOSSESSIONS - At Landed Cost` · `DEPRECIATE REPOSSESSIONS - Use the Monthly Table`
Related fields: `General Ledger Postings` · `Salesperson Commissions` · `Return to Vendor` ·
            `Commission Add On %` · `Reduce Customer Returns %` · `Depreciate Repossessions %` ·
            `Calculate Received Landed By` · `Landed Cost Distribution`
Reconciliation switches: **`REPORT - Generate Inventory to General Ledger Reconciliation Data`** ·
            **`REPORT - Include in the Daily Reports an Inventory Reconciliation`** ·
            `REPORT - Generate a Purge Report of Solved Costing Exceptions` ·
            `REPORT - Report Value of Inventory, Use Generate Monthly Report Parameters for Costing`
Evidence:   Costing Control Settings, /articles/15186501540884
Maps to:    **NEW — and it links three run-1 threads at once**

> Run 1 found the `Inventory-G/L Reconciliation Audit` as one of four opt-in audit switches but could
> not find where it was set. **It is set here**, and there are two of them — one that *generates* the
> reconciliation data and a separate one that *includes it in the daily reports*. Turning on the
> report without the data, or vice versa, is possible. Run 1 also found repossession depreciation and
> the RTV landed-cost asset/liability account pairs and could not explain what drove them; both are
> configured on this page. **A merchandising settings file is where consumer-credit repossession
> valuation is decided.** That is exactly the kind of cross-module wiring this audit exists to find.

### FINDING 42 — The costing table is date-keyed by "logical transaction date", not entry date
Observation: `Report Active Costing Exceptions` reports a **`logical transaction date`**;
            `Report Solved Costing Exceptions` offers **`Logical Date Code` / `From Logical Date` /
            `To Logical Date` as a separate axis from `Solved Date Code` / `From Solved Date` /
            `To Solved Date`.
Evidence:   Report Active Costing Exceptions, /articles/15202552070804;
            Report Solved Costing Exceptions, /articles/15203214704532
Maps to:    **W-012 / W-061 — relevant; supports run 1's "GL posts on transaction date"**

> Two independent date axes on the same record — when the cost event logically happened, and when a
> human resolved it. Run 1 established that GL posts on **transaction date, not invoice date**;
> "logical transaction date" looks like the same concept surfacing in Inventory. The docs never
> define it. Any reconstruction of inventory value as of a date has to use the logical date and
> account for exceptions solved later — meaning **the same period can be restated after the fact**.

### FINDING 43 — Cost exception reports write a numbered worklist as a side effect of printing
Invariant:  "**The exceptions printed on the report are saved to a list you can access in the `Correct
            a Cost Exception` (Cost Exception Adjustments) program. The automatically assigned list
            number prints to the left of the report title** in the header portion of the report
            output."
Correction screen keys: `Exception Number` · **`List Number`**
Solved-report axis: **`Solution Source`** (a selection criterion; values not given)
Evidence:   Report Active Costing Exceptions, /articles/15202552070804;
            Correct a Cost Exception, /articles/15185837613332;
            Report Solved Costing Exceptions, /articles/15203214704532
Maps to:    **NEW**

> **Running a report creates persistent state.** The list number is the handle by which the
> correction screen addresses a batch of exceptions, so the report is not a read — it is the work
> assignment step. Anyone rebuilding this has to notice that "print the exceptions report" and
> "create a worklist" are the same action in STORIS. `Solution Source` presumably distinguishes
> automatic from manual resolution, which would make it the audit trail for Finding 30's `Skip the
> Exception` option; the values are not documented.

### FINDING 44 — Receiving registers run automatically at End of Day and are cost-gated
Invariant:  "The `Warehouse Receipts` option provides an **audit trail** of the merchandise received
            into inventory via the warehouse receiving entry programs and removed from inventory via
            inventory adjustments. **This register runs automatically as part of the End Of Day
            process.** In addition, you can print this report on demand at any time."
Invariant:  "If **Location Tracking** is active on your system, this report notes the storage location
            where the product was placed… If **Serial Tracking** is active for a product, the serial
            number for each piece lists along with the respective storage location."
Invariant:  "For serial-tracked products (that is, '**serial-tracked on the way in**'), this report
            displays the storage location for **all pieces** received. For non-serial-tracked
            products, this report displays the storage location for **the first piece received
            only**."
Invariant:  Container Receipts "is available only if the `View and access product cost information`
            field is enabled".
Also:       "The output of this report may be affected by **Regional Processing restrictions**."
            (repeated on `View Product Cost Activity` and `Report Historical Costs…`)
Evidence:   Report Current Costs of Received Purchase Orders, /articles/15202504951188
Maps to:    **NEW**

> The receiving audit trail is an **End-of-Day artefact**, consistent with run 1's finding that
> End-of-Day is where history is made or lost. The serial/non-serial asymmetry is a real data-quality
> limit: **for non-serial products, only the first piece's storage location is recorded on the
> register**, so you cannot reconstruct where a multi-piece receipt was put away. And
> **`Regional Processing`** appears here for the first time as a cross-cutting visibility restriction
> on costing output — it has not been read yet and is queued.

---

## C. Screen and field inventory

**View Product Cost Activity** — pages: **Details · General · Pieces**.
Product · Vendor · Brand · Vendor Model · *(Details → Cost)* **Average · Replacement · Landed Average ·
Domestic Landed Replacement · Foreign Landed Replacement** · *(Add-On block)* labelled add-on amounts ·
**Freight** · **Percent or Dollar** (`P` / `D`) · Grid.
General page "is identical to the General Information page in `View Product Activity`". Record counter
under the Brand field with Previous/Next when a product list is active.

**Layer Detail Screen** — reached by double-clicking a grid line in View Product Cost Activity;
"displays all items with the **same Layer number**". Cost block: **Material · COM · Total Material ·
Duty · Misc · Add3 · Add4 · Freight · Total Landed** · Grid.

**Costing Control Settings** — tabs **General · Exception Handling**.
*General*: General Ledger Postings · Salesperson Commissions · Return to Vendor · Retain Days
(Solved Cost Exceptions, Costed Auditing Data, Costing Table Data) · Commission Add On % ·
Reduce Customer Returns % · Depreciate Repossessions % · Calculate Received Landed By ·
**Landed Cost Distribution** · Landed Add-on Cost Label · Landed Add-on Cost Label Drop-Down ·
then the checkbox block (DEPRECIATE REPOSSESSIONS ×2, GENERAL LEDGER ×3, LANDED FREIGHT ×5,
REDUCE CUSTOMER RETURNS, REPORT ×4, AVERAGE COST ×1) · Actions.
*Exception Handling*: Automatic Handling of Cost Exceptions · Customer Returns Zero Cost ·
Customer Returns Non Zero Cost · Warehouse Receipts Zero Cost · Positive Adjustments Zero Cost ·
Skip on Zero · **Inventory AP Approval** · **Next Cost Exception Number**.

**Correct a Cost Exception** *(Cost Exception Adjustments)* — Exception Number · **List Number** · Grid.

**Cost Exception Adjustments Screen** — Transaction Date · Comment · **Layer** · Material · Quantity ·
COM · Total Material · Freight · Total Landed · **Add-On 1–4** *(active only if the cost is active and
`Landed Cost Allocation` = **`Allocate Upon Receipt`**)* · Grid.

**Report Active Costing Exceptions** — Date Code · Start/End Date · Product · **Exception Type** ·
Buyer · Inventory Type · Send Output to · Export Path.
Columns: exception number · exception type · exception type description · product number ·
logical transaction date · quantity · purchase order number · reference number · customer return
number · receipt cost · old AP bill cost · new AP bill cost · AP bill number · exception value;
subtotals and grand total of exception value.

**Report Solved Costing Exceptions** — Product · Exception Type · Logical Date Code · From/To Logical
Date · Solved Date Code · From/To Solved Date · Inventory Type · **Solution Source** · Buyer ID ·
Send Output to · Export Path. Displays date solved, **the user who solved the exception**, status,
comment.

**Report Purchase Orders with Changed Costs** — **Minimum Change Percent** · Send Output to ·
Export Path. Sorted by Vendor and PO Number; **excludes special order products**.

**Report Current Costs of Received Purchase Orders** — Date Code · Reporting Date Code · Start/End
Date · **Report Type** (Warehouse Receipts · Container Receipts · Open Container Batches) ·
Inventory Type · **With Costs** · Send Output to · Export Path.

**Report Historical Costs of Received Purchase Orders** — Reporting Date Code · Start/End Date ·
Send Output to · Export Path; selection by product, product group, product category, open-to-buy
department, collection, vendor, warehouse location; **three sort/subtotal levels**.

**Purchase Order Discount Inquiry** — reached from the **Dollar tab** of `View a Purchase Order`
(Purchase Order Inquiry). **Type** (from Deduct Type) · **Code** · Percent · Factor · Amount.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Automatic Handling of Cost Exceptions` | Costing Control Settings → Exception Handling | Do not Handle / Use Average / Use Replacement Cost / **Skip the Exception** |
| `Customer Returns Zero Cost` · `Customer Returns Non Zero Cost` · `Warehouse Receipts Zero Cost` · `Positive Adjustments Zero Cost` · `Skip on Zero` · `Inventory AP Approval` | same | Per-process exception behaviour |
| `Next Cost Exception Number` | same | Exception numbering sequence |
| `(Days to Hold) Costing Table Data` | Costing Control Settings | **Purges FIFO cost layers** |
| `Retain Days — Solved Cost Exceptions` · `Costed Auditing Data` | Costing Control Settings | **Purges costing history/audit** |
| `General Ledger Postings` · `Salesperson Commissions` · `Return to Vendor` | Costing Control Settings | Costing method (Replacement / Weighted Average / Exact) **chosen separately per purpose** |
| `Landed Cost Distribution` *(a.k.a. `Landed Cost Allocation`, value `Allocate Upon Receipt`)* | Costing Control Settings | Method for calculating/allocating add-on costs |
| `Calculate Received Landed By` | Costing Control Settings | named only |
| `Landed Add-on Cost Label` / `Label Drop-Down` | Costing Control Settings | **Names the four add-on slots system-wide** |
| `LANDED FREIGHT - Active` · `Add-on Cost 1/2/3/4 Active` | Costing Control Settings | Activates each component |
| `GENERAL LEDGER - Always Adjust Stocked Inventory at the Average Cost` | Costing Control Settings | Inventory adjustment valuation |
| `GENERAL LEDGER - Post RTV Write-off of Landed Cost Assests against Landed Liability Accounts` | Costing Control Settings | **RTV landed asset/liability pairing** |
| `GENERAL LEDGER - Post RTV Valuation Difference At Completion` | Costing Control Settings | Timing of RTV variance posting |
| `REDUCE CUSTOMER RETURNS - Prorate the Landed/Freight Value` · `Reduce Customer Returns %` | Costing Control Settings | Return credit valuation |
| `DEPRECIATE REPOSSESSIONS - At Landed Cost` · `Use the Monthly Table` · `Depreciate Repossessions %` | Costing Control Settings | **Repossession inventory valuation** (run-1 credit thread) |
| `Commission Add On %` | Costing Control Settings | Commission cost basis |
| `AVERAGE COST - Include Saleable Receipts only` | Costing Control Settings | **Warned against with average-cost GL posting** |
| `REPORT - Generate Inventory to General Ledger Reconciliation Data` | Costing Control Settings | **Where run 1's Inventory-G/L Reconciliation Audit is switched on** |
| `REPORT - Include in the Daily Reports an Inventory Reconciliation` | Costing Control Settings | Whether it reaches the daily reports |
| `REPORT - Generate a Purge Report of Solved Costing Exceptions` | Costing Control Settings | Purge evidence |
| `REPORT - Report Value of Inventory, Use Generate Monthly Report Parameters for Costing` | Costing Control Settings | Inventory valuation report basis |
| landed freight / add-on factors | **13 files** — see Finding 34 | First-found-wins per component |
| `Average Cost` field | Advanced Product Settings / Product Settings | **Writable once, at product creation only** |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `View and access product cost information` | **System security** *(FAQ)* / **Extended Security** *(report article)* — **conflicting** | All cost visibility: inquiries, PO receiving, reports, Container Receipts option |
| `Update Product Replacement Cost Within Purchase Entry Screens` | Extended Security | The replacement→average cost cascade for foreign-vendor products |
| STORIS-personnel-only fields | System Control Settings | "Some system control settings are accessible by STORIS personnel only" |
| Regional Processing restrictions | (not yet read) | Filters costing report and inquiry output |

---

## F. State machines and enumerations

**Cost exception types** — `1` Zero Cost on Warehouse Receipts · `2` Zero Cost on Inventory
Adjustments · `3` Zero Cost on Customer Returns · **`4` Inventory AP Bill Cost Exception**.
**Cost exception lifecycle** — raised (numbered, `Next Cost Exception Number`) → **active** → printed
onto a numbered **list** → solved (automatically for types 1–3, manually via `Correct a Cost
Exception` for type 4) → **solved, then purged** on the `Solved Cost Exceptions` retain-days timer.
**Automatic handling options** — `Do not Handle` · `Use Average` · `Use Replacement Cost` ·
`Skip the Exception`.
**Zero-cost check points** — purchase order entry · inventory receiving · inventory adjustment ·
customer-return completion.
**Costing methods** — `Replacement Cost` · `Weighted Average Cost` · `Exact (Actual) Cost`, selected
independently for **cost of sales · commissions · returns to vendor**.
**Product cost values** — Average · Replacement · Landed Average · Domestic Landed Replacement ·
Foreign Landed Replacement.
**Layer cost components** — Material · COM · Total Material · Add-on 1–4 · Freight · Total Landed.
**Add-on amount types** — `P` percentage · `D` dollar.
**Landed cost resolution** — 13-level hierarchy, first found wins, applied per component discretely.
**Receiving report types** — Warehouse Receipts · Container Receipts · Open Container Batches.
**Container batch state** — open → **Close Batch** *(freight factors calculated and distributed only
at close)*.
**Date axes on a cost exception** — logical transaction date · solved date.
**Tracking modes affecting the receiving register** — Location Tracking · Serial Tracking
("serial-tracked on the way in").

---

## G. Sequencing rules

1. Zero cost is checked at **PO entry, receiving, adjustment and customer-return completion**; each has
   its own automatic-handling setting.
2. **Type 4 (AP bill variance) exceptions cannot be auto-resolved** — manual only.
3. **Active cost exceptions block a physical inventory freeze.**
4. `Report Active Costing Exceptions` runs **at End of Day or on demand**, and running it **creates a
   numbered worklist** consumed by `Correct a Cost Exception`.
5. Landed cost is calculated **at receiving**, not at PO entry; the PO shows `Estimated Landed Cost`.
6. Container receiving **defers freight distribution to batch close** — no freight factors before then.
7. Preset freight factors and separate-freight-bill container receiving are **mutually exclusive**.
8. Average cost is seeded once at product creation, then movable only via `Update a Product Cost`.
9. For foreign-vendor products never stocked, editing Unit Cost in PO entry/acknowledgement/product
   recommendations and answering Yes cascades **replacement cost → Costing Table → average cost**,
   at the vendor's exchange rate.
10. Landed add-on costs post to the accounts named in `General Ledger Assigned Account Settings`.
11. The warehouse receipts register runs automatically as part of **End of Day**.
12. Costing Table data, solved exceptions and costed auditing data are **purged on separate timers**.
13. Add-on estimate-vs-actual variance is captured only if `Distribute Add-on Receiving Costs` is
    actually run against vendor invoices.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Inventory AP Approval`** on the Exception Handling tab — a per-process setting that appears to
  govern type-4 behaviour, listed with **no description and no option list**, immediately above the
  note saying type 4 must be corrected manually. These two statements may contradict each other.
- **"Some system control settings are accessible by STORIS personnel only"** — repeated from batch 1;
  the costing configuration surface is knowably incomplete from the operator seat.
- **`Regional Processing`** — named three times as a restriction on costing output; article not read.
- `Update a Product Cost (Manual Cost Adjustment)` — the only sanctioned way to move average cost, and
  named as the way to work exceptions "daily or weekly". Not yet read. **High priority.**
- `Distribute Add-on Receiving Costs` and `Report Add-on Distribution Analysis` — the entire add-on
  actualisation loop. Not yet read.

**Documented but ambiguous**
- **`Landed Cost Distribution` vs `Landed Cost Allocation`.** Costing Control Settings names the field
  `Landed Cost Distribution`; the Cost Exception Adjustments Screen refers to "the `Landed Cost
  Allocation` field on the Costing Control Settings" with value **`Allocate Upon Receipt`**. Same field
  under two names, and only the second article gives a value. **Terminology drift of the kind run 1's
  card warned about.**
- **`View and access product cost information` lives in two different security files** depending on
  which article you read (Finding 38).
- **`Solution Source`** — a reporting axis on solved exceptions; values not given. Probably
  automatic-vs-manual, which would make it the only audit distinction between a genuine resolution and
  a `Skip the Exception`.
- **`Exception value`** — the money column on the active report, subtotalled and grand-totalled. Never
  defined. Presumably quantity × (new AP bill cost − receipt cost), but the docs do not say.
- **`Calculate Received Landed By`** — named only; it is plausibly the choice between weight, value and
  piece count for distributing freight, and that choice materially changes unit costs.
- **`Inventory Type`** — a selection criterion on three costing reports; enumeration never given.
- **`With Costs`** on the receiving report — presumably a suppression toggle tied to the cost security
  flag; not stated.
- **Whether the type-4 exception blocks anything besides the physical freeze.** Nothing says it stops
  the AP bill, the PO close, or period end.
- **What "solving" a type-4 exception does to the ledger.** `Correct a Cost Exception` says you "enter
  cost exception adjustments for selected cost layers" — so it adjusts the layer. **No article read so
  far says what GL entry, if any, results.** This is the single most important open question in the run.
- **`Costed Auditing Data`** — a third retention bucket, never explained.
- **`Skip on Zero`** — a setting name distinct from the `Skip the Exception` option; relationship
  unstated.
- Whether `Report Purchase Orders with Changed Costs` and the type-4 exception queue see the same
  events. The report has a `Minimum Change Percent` and excludes special orders; the queue has neither
  stated. `Daily Exceptions Cost Change Percent` (batch 1, Purchasing Control Settings) is a third
  threshold with a similar name.

**Inferences (not in section B)**
- **Landed add-on costs are probably never trued up to actual.** The only actualisation path found is
  an advisory report whose stated purpose is to retune estimates (Finding 40). Nothing says the
  variance posts or corrects the layer. If confirmed, estimated landed cost is permanent — but this is
  an inference from silence, not a documented statement.
- `Exception value` is presumably the money amount of the variance; not stated.
- `Landed Cost Distribution` and `Landed Cost Allocation` are presumably the same field; not stated.
- The `Skip the Exception` option presumably leaves inventory permanently valued at zero for those
  pieces; the article says it "allows the inventory to be received at zero cost" but not what happens
  to that value afterwards.
- Run 1's `Inventory-G/L Reconciliation Audit` switch is presumably
  `REPORT - Generate Inventory to General Ledger Reconciliation Data`; the names differ.

---

## I. Unknown unknowns

- **The cost exception queue as the purchase price variance mechanism** — a work queue standing in for
  a GL account.
- **Type 4 exceptions being manual-only**, so every AP price variance is a human touch.
- **Active cost exceptions blocking a physical inventory freeze.**
- **`Skip the Exception`** — a supported setting that capitalises inventory at zero and marks it solved.
- **A thirteen-level landed cost hierarchy**, resolved independently per component.
- **Exactly four add-on slots**, whose names are company-typed labels rather than model elements.
- **Costing method chosen separately for cost of sales, commissions and returns to vendor.**
- **Separate domestic and foreign landed replacement costs.**
- **Special-order products having no average cost at all.**
- **The Costing Table being purged on a retention timer** — cost history expires.
- **Three separate retention timers** (costing table, solved exceptions, costed auditing data).
- **A merchandising settings file configuring repossession depreciation** (a consumer-credit concern).
- **The replacement→average cost cascade triggered from a merchandising recommendations screen**,
  through a foreign vendor's exchange rate.
- **Preset freight factors and container freight being mutually exclusive.**
- **Freight factors not existing until a container batch is closed.**
- **Running a report creating a persistent numbered worklist.**
- **The receiving register recording storage location for only the first piece** of a non-serial
  multi-piece receipt.
- **A second, unconnected variance system** for landed add-on estimates.
- **"Logical transaction date" vs solved date** as two independent axes, allowing period restatement.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Cost exception | Numbered record raised when the system cannot determine a piece's cost; four types |
| Type 4 / Inventory AP Bill Cost Exception | Receipt cost ≠ AP bill cost. **The purchase price variance, as a queue item** |
| Exception value | Money column on the exceptions report; subtotalled; never defined |
| List Number | Handle for a batch of exceptions, created as a side effect of running the report |
| Solution Source | Reporting axis distinguishing how an exception was solved; values undocumented |
| Skip the Exception | Setting that receives inventory at zero cost and marks the exception solved |
| Costing Table | Internal FIFO-layer file holding cost and quantity; purged on a retention timer |
| Layer | One FIFO receipt/adjustment cost record; the unit a cost correction is applied to |
| Landed cost | Material cost plus freight and up to four add-on components, computed at receiving |
| Estimated Landed Cost | PO-entry figure; explicitly not the final value |
| Landed Cost Distribution / Allocation | The add-on calculation method; `Allocate Upon Receipt` is one value |
| Add-on 1–4 | The four landed cost slots; labels (e.g. DUTY, MISC) are company settings |
| P / D | Add-on amount type: percentage or dollar |
| Landed Average / Domestic Landed Replacement / Foreign Landed Replacement | Three of a product's six cost values |
| COM | Customer's own material, a first-class layer cost component |
| Weighted Average Cost | `((QOH × avg) + (qty received × receipt cost)) ÷ (QOH + qty received)` |
| Logical transaction date | The date a cost event belongs to, distinct from when it was entered or solved |
| Container receiving | Receiving multiple POs on one freight bill; freight distributed only at Close Batch |
| Distribute Add-on Receiving Costs | Routine capturing actual add-on costs from vendor invoices |
| Regional Processing | Undocumented restriction filtering costing report and inquiry output |

---

## Contract adjudication — batch 2

| Contract | Verdict | Basis |
|---|---|---|
| **W-041** | **CONFIRMED — with a correction to the expected shape** | The receipt/bill cost variance is captured, quantified and reportable, but as a **cost exception queue**, not a GL variance account (F29, F30). Run 1's "no PPV account" stands |
| **W-061** | **CONFIRMED and enlarged** | Six product cost values, three costing methods chosen per purpose, five landed components (F36) |
| **W-012** | **relevant** | Logical transaction date as the cost event's own date axis (F42); consistent with run 1's transaction-date posting |
| **W-050** | **supports "inverted"** | One cost-visibility flag documented in two different security files (F38) |
| **W-052 / W-053** | **not documented in this section** | No statement of what GL entry results from solving an exception |

---

## Next — batch 3: replenishment and demand-driven PO creation

`Automatic Purchase Order Replenishment` · `Replenish Inventory for Current Back Order Needs` ·
`Replenish Stock Inventory Based on Sales Rate` · `Replenish Stock Inventory Based on Sales Rate
Routine Calculation Information` · `Items for Replenishment Screen` · `Items for Replenishment Actions
Menu` · `Assign Products to Purchase Orders` · `Purchase Order Creation from Order Entry` ·
`Purchase Order Updates from Sales Order Entry` · `Sales Order Linkage Screen`.

Open targets carried in: **which sales order fields update on a PO line change** (`W-042`, batch 1
Finding 11), and the **`NET AVAIL` formula's unlabelled second half** (batch 1 Finding 17) — the
replenishment calculation article is the likeliest place both are settled.

Also carried: `Update a Product Cost` and the add-on distribution loop, which belong to costing but
are Inventory Management articles; they will be picked up when the run reaches linked-article sweeps.
