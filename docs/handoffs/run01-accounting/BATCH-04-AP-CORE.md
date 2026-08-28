# Run 01 — Accounting — Batch 4: AP Core — Bill Entry, Matching, Approval, Payment, Void

10 articles. Scoped to run-card question 5 (received-not-invoiced and how it clears) and to
the purchase-price-variance gap flagged in batch 1.

**The PPV question is answered, and the answer is that STORIS has no PPV account.**

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 31 | Enter/Update Individual Vendor Invoice | /articles/15202013217044 | EXTRACTED |
| 32 | Enter Multiple Vendor Invoices | /articles/15202028504596 | EXTRACTED |
| 33 | AP Approval Selection Screen | /articles/15202028504724 | EXTRACTED |
| 34 | Convert Pending Bills | /articles/15202028504084 | EXTRACTED |
| 35 | **Pending AP Bills Overview** *(Overviews → Rules)* | /articles/15202010751892 | EXTRACTED |
| 36 | Disburse Payable Invoice Charges | /articles/15202012242324 | EXTRACTED |
| 37 | View and Manage AP Bills | /articles/15202013507476 | EXTRACTED |
| 38 | Select and Approve Bills for Payment | /articles/15202011444756 | EXTRACTED |
| 39 | Void Check Run | /articles/15202011445012 | EXTRACTED |
| 40 | Void Payment Screen | /articles/15202012946196 | EXTRACTED |

Newly discovered, queued: `Payables Control Settings` (+ Advanced tab), `AP Bill Types`
*(Overviews → References — an enumeration we need)*, `View AP Bill` (/articles/15295156090644),
`GL Postings screen`, `Payment Register Maintenance Screen`, `Payment Selection Screen`,
`Payment Review Screen`, `AP Select Available Screen`, `AP Check Approval Bill Selection`,
`Date For New Batch Window`, `Create a User/Group Actions - Payables Security`,
`Purchasing Control Settings`, `Bank Settings` (Export Checks, Check Run File Format),
`Create Check Run File`, `Export Payable Checks`, `Print Checks`, `Protection Plan Overview`,
`Electronic Funds Transfers (EFT) Overview`, `Bill Back Settings`, `AP Bill Conversion`,
`Report Payables Activity`, `Report Merchandise on Paid Pending Bills`, `Void EFT Batch`,
`Virtual Card Processing`, `Vendor Cross Reference`, `Multiple Vendor Selection window`.

---

## B. Wiring findings

### FINDING 48 — AP bill entry posts to the GL immediately, and the postings are editable first
Trigger:    Filing an AP bill in `Enter/Update Individual Vendor Invoice`
Producer:   AP
Consumers:  General Ledger
Invariant:  "This routine posts to General Ledger immediately upon filing."
Escape:     "Summary GL hits stored in the AP bill header are available for change prior to filing
            via the GL Postings screen." Also: "When filing AP bills other than pending AP bills,
            the GL Postings screen appears."
Evidence:   Enter/Update Individual Vendor Invoice, /articles/15202013217044
Maps to:    **W-036 — CONTRADICTED again**, **W-012 — CONFIRMED on timing**

> Third contradiction of the "explicit mapping, no fall-through" contract, and the strongest one:
> the mapping does not merely fall through to defaults, an operator can **overwrite the resulting
> GL hits by hand on every non-pending bill** before filing. Combined with Finding 31 (same
> capability on reconciliation transactions), the pattern is clear: in STORIS the posting engine
> proposes and the user disposes. Any parity work that assumes STORIS postings are derivable from
> configuration will mis-reconcile against history.

### FINDING 49 — Pending bills are pay-before-receipt, and conversion is the match event
Trigger:    Converting a pending AP bill to an open AP bill
Producers:  `Enter/Update Individual Vendor Invoice` (one at a time) or `Convert Pending Bills` (batch,
            also runnable as part of **End-of-Day**)
Conversion preconditions (all four must hold):
  1. "The quantity paid on the pending bill must match the quantity received on purchase orders."
  2. "The difference between the amount received and the amount paid must be within the variance
     percentage set in the Payables Control Settings."
  3. "No zero cost exceptions can exist at the time of receiving."
  4. "All purchase orders must be open."
Consumers:  on conversion the `Recorded Not Received` account is credited to offset debits to
            Inventory Value, Freight, Tax and Miscellaneous (from batch 1, Finding 11)
Reporting:  AP Aged Trial Balance **excludes** pending bills "because the liability for them has not
            yet been incurred"; Cash Requirements has an option to include them
Evidence:   Pending AP Bills Overview, /articles/15202010751892
Maps to:    **W-012 — CONFIRMED with a real tolerance**, **W-011 — CONFIRMED**

### FINDING 50 — There is no purchase price variance account; the operator forces the variance to zero
Trigger:    A vendor invoice whose amount differs from PO cost
Mechanism:  "STORIS AP users can file pending bills with a **proof amount**, for example in a situation
            where an invoice is received for an amount that differs from the purchase order costs.
            When manually converting this bill, **you must bring this difference to zero by changing
            the line costs and/or header costs on the bills.**"
Consequence: the difference lands in inventory cost, freight, tax or misc — never in a variance account
Related:    a `Proof Amount` field exists on the Invoice Detail tab of `Enter/Update Individual Vendor Invoice`
Evidence:   Pending AP Bills Overview, /articles/15202010751892
Maps to:    **W-012 — CONTRADICTED on the variance clause**

> This closes the gap I flagged in batch 1. STORIS does not book a purchase price variance.
> It requires a human to restate the cost until the bill proves to zero, which pushes the whole
> difference into **inventory valuation**. That is why `Cost Exceptions` and `Valuation Difference`
> exist and no PPV account does. Two consequences for us:
> (a) our contract `W-012`'s "the difference goes to a purchase price variance" is simply not how
> the source system behaves, and (b) migrated inventory cost carries absorbed invoice variances
> that were never visible as variance. Do not expect PO cost history to reconcile to invoice history.

### FINDING 51 — Batch conversion has a typed exception taxonomy
Trigger:    `Convert Pending Bills`
Producer:   exception report (AP bill number, invoice number, reason; one line per reason)
Definition: quantity available for approval =
            (quantity received on a PO line) − (quantity already entered on 'not pending' AP bills for that PO line)
Exception codes — **line level:**
  - `QTY NM` Quantity not matched — quantity invoiced greater than quantity available for approval
  - `COST EXC` Cost exception — product has a zero cost exception
  - `COST NF` Receiving cost not found — quantity available but no receiving cost
Exception codes — **bill level:**
  - `VENDOR NM` Vendor not matched — bill vendor ≠ PO vendor
  - `COST NM` Cost not matched — |total receipt cost − merchandise subtotal| exceeds the
    **pending bill conversion allowable cost variance percent** in `Payables Control Settings`,
    where merchandise subtotal = pending bill Total Invoice Amount − (Freight + Sales Tax + Miscellaneous)
  - `DUE DATE` — bill due within `Number of Days Prior to Due Date with No Receipt` but has no receipts
Invariant:  "the cost on the pending bill line always matches the cost on the PO line"
Evidence:   Convert Pending Bills, /articles/15202028504084
Maps to:    **W-012 — CONFIRMED (this is the three-way match)**

### FINDING 52 — Manual conversion can proceed on short quantities; batch conversion cannot
Trigger:    Manual conversion in `Enter/Update Individual Vendor Invoice`
Invariant:  "users can manually convert pending bills even though the complete quantities specified
            on those bills are not available. The system automatically adjusts the bill and users
            can manually change the total to remove the proof amount."
Contrast:   TPA users are barred from this entirely, because they cannot adjust line costs
Evidence:   Pending AP Bills Overview, /articles/15202010751892
Maps to:    NEW

> Two different match strictnesses for the same event depending on which screen you use.
> The batch route enforces the tolerance; the manual route lets a human override it.

### FINDING 53 — AP approval selects against receipt records, not against the PO
Trigger:    `Enter Multiple Vendor Invoices` step 1
Process modes (`Select Process Desired` × `Type of Document`):
  - Inventory Activity × **Vendor Invoice** → selects from **receipts records**
  - Inventory Activity × **Vendor Credit** → selects from **returns records**
  - **Miscellaneous Supplies** → Type of Document inactive
  - **COM Activity** → Type of Document inactive
Invariant:  "Purchase orders do not need to be on file for you to approve and/or maintain them in
            this routine. That is, even if you accidentally purge a PO before it has been paid, you
            can still access the pertinent information" — but a purged PO number cannot be used as
            selection criteria
Config:     `RECEIVING – Supply Purchase Orders must be Received` in `Purchasing Control Settings`
            makes supply bills default to quantity received
TPA rule:   "(TPA only) If the purchase order for supplies was created in STORIS, you must complete
            this AP approval process in order to close the purchase order."
Evidence:   Enter Multiple Vendor Invoices, /articles/15202028504596
Maps to:    **W-011 — CONFIRMED (the accrual is receipt-keyed, not PO-keyed)**

> The billing anchor is the **receipt**, and the PO is an attribute of it. That is the right shape
> and matches our `W-011`. Note the deliberate survival of billing after PO purge.

### FINDING 54 — Protection plans are billed through the same AP approval path as merchandise
Trigger:    Selecting Protection Plan in step 1 of `Enter Multiple Vendor Invoices`
Payload:    the AP Approval Selection grid then shows `Plan` (Protection Plan code) and `Order`
            (the original order number to which the plan was applied)
Evidence:   AP Approval Selection Screen, /articles/15202028504724
Maps to:    NEW — ties to `Intangible Asset - Protection Plans` / `Protection Plans Not Recorded` (batch 1)

### FINDING 55 — One pending payment per bank, and payment types are mutually exclusive per bank
Trigger:    `Select and Approve Bills for Payment`
Invariant:  "Only one pending payment can exist for a bank at a time. That is, for each bank, you
            must complete the current check run or EFT (if any) before starting another."
Stronger:   "Another payment batch cannot be created for the same bank until the current batch has
            been imported and the status is completed — this applies to any payment type
            (check, EFT, virtual card). A virtual card batch must have had its payment file created,
            response file imported, and a status of completed before any other payment type for that
            bank can be processed."
Evidence:   Select and Approve Bills for Payment, /articles/15202011444756
Maps to:    NEW — a hard global lock

> This is a serialisation constraint with real operational teeth: one stuck virtual card batch
> blocks **all** disbursement from that bank. Worth reproducing as an explicit lock with a visible
> owner and a documented break-glass, rather than as an emergent property.

### FINDING 56 — Check-run channel is chosen by a setting, and the two review tabs are mutually exclusive
Trigger:    Creating a payment batch
Config:     `Process Using Electronic Funds Transfer` on the `Date For New Batch Window` —
            disabled → Check Review tab active, EFT Review inactive; enabled → the reverse
            `Export Checks` in `Bank Settings` — inactive → `Print Checks` routine;
            active → `Export Payable Checks` routine
            `Check Run File Format` via `Select Bank Check Run File Format` in `Bank Settings` —
            absent → the `Create Check Run File` button is inactive
Evidence:   Select and Approve Bills for Payment, /articles/15202011444756
Maps to:    **W-056 — CONFIRMED** (policy genuinely lives in control settings here)

### FINDING 57 — Payments consolidate by vendor + remit-to, with one carve-out
Trigger:    Check Review / EFT Review generation
Invariant:  "The program consolidates AP bills with the same vendor and vendor remit-to into single
            checks (**except Customer Refund AP Bills, which are never consolidated**)."
Override:   `Payment Register Maintenance Screen` creates separate checks
Sort:       by vendor remit-to, vendor, payment register key; stub detail sequence from
            `Sort Detail Lines on Stub by` (Payables Control Settings → Advanced)
Evidence:   Select and Approve Bills for Payment, /articles/15202011444756
Maps to:    **W-055 — CONFIRMED** (payment register key is the document number)

### FINDING 58 — Negative net payments hard-block the run
Trigger:    An approved bill set that nets negative for any vendor remit-to
Invariant:  "the grid highlights the payment and the Print Checks button inactivates. To proceed,
            you must first address all negative payments." Same for Create EFT File.
Related:    `Exclude Credits Resulting in Negative Checks` option on the Bill Selection tab
Evidence:   Select and Approve Bills for Payment, /articles/15202011444756
Maps to:    NEW

### FINDING 59 — Editing a bill inside an approval batch re-qualifies it against the selection criteria
Trigger:    Editing a bill from the Bill Approval tab
Consumers:  "the program re-qualifies the bill using the current selection criteria... If for any
            reason the bill has changed so that it no longer matches the selection criteria, a
            warning message appears. If you say Yes, the program includes the bill... If you say No,
            the program removes the bill from the payment batch."
Side effect: "Changes to remit-to information can result in new payments and/or the consolidation of
            existing payments. For example, if you change the check print bank for an AP bill, the
            program removes the AP bill from the process."
Override:   entering zero in the Approved column "effectively deletes the bill from the grid"
Append rule: appending newly-selected bills **overwrites** the batch's existing selection criteria,
            "This allows AP bills to have different terms or discounts and exist on the same payment batch"
Evidence:   Select and Approve Bills for Payment, /articles/15202011444756
Maps to:    NEW

> The batch's selection criteria are mutable and retroactively authoritative. A bill validated
> under criteria A can end up in a batch whose criteria are now B. Do not copy this.

### FINDING 60 — Void reverses GL, and has four hard blockers
Trigger:    `Void Check Run` (whole run) or `Void Payment Screen` (individual payment)
Consumers:  "'backs out' the payments for selected AP Bills and **reverses the GL postings
            associated with the payment**"
Blockers (check run): status Pending cannot be voided · contains a **reconciled** check ·
            contains a check **applied to an overpaid pending bill** ·
            already-voided checks are tolerated but produce no updates
Exception:  "This program allows you to void a payment in a **sales overlap period**."
Evidence:   Void Check Run, /articles/15202011445012 · Void Payment Screen, /articles/15202012946196
Maps to:    **W-035 — CONFIRMED for AP**, **W-037 — CONTRADICTED (period gate has an exception)**

> The sales-overlap-period exception is a documented hole in the period gate from batch 1.
> `W-037` said every posting is gated by period state. Voids are not.

### FINDING 61 — Hold is a bulk-clearable flag with a code, cleared without reason capture
Trigger:    `View and Manage AP Bills` → check bills → `Remove Hold`
Consumers:  "removes the hold status and hold code of these bills"; message "Hold status has been
            removed from ~AP bills"; if none were on hold, "No bills updated. Double check that
            selected bills are on hold." and nothing changes
Evidence:   View and Manage AP Bills, /articles/15202013507476
Maps to:    **W-051 — CONTRADICTED** (no approver or reason is captured on the record)

### FINDING 62 — Invoice charges are a coded, multi-valued header structure
Trigger:    AP bill entry
Producer:   `Disburse Payable Invoice Charges`
Payload:    Freight / Sales Tax / Miscellaneous each accept **one or multiple** invoice charge codes
            with amounts; the header field shows either a single charge or an ellipsis for multiple
Defaults:   in Approval Mode or on an unlinked expense bill the standard codes default —
            `FREIGHT`, `TAX`, `MISCELLANEOUS`
Config:     `Default Invoice Charges to Inactive` in `Payables Control Settings` deactivates all
            three; re-enable per bill via Actions → `Activate Invoice Charges`.
            `Freight in Terms Amount` — if not enabled, freight bills default the **pay date**
            instead of the terms date
TPA limit:  multiple AP header charge codes are unavailable when TPA is active
Evidence:   Enter/Update Individual Vendor Invoice, /articles/15202013217044
Maps to:    **W-062 — adjacent** (AP-side sales tax is a coded charge, distinct from the
            Sales Tax Payable account on the Sales tab)

### FINDING 63 — Alternate payment methods bypass the check run and are permission-gated
Trigger:    AP bill entry with an alternate payment method
Gate:       `Select alternate payment methods during vendor invoice entry` in
            `Create a User/Group Actions - Payables Security`
Fields:     Method → then Reference, Date, Amount
Limits:     "The alternate payment method is not available for vendor credit bills."
            "**Credit card and cash payments cannot be included in the Bank Reconciliation.**"
Evidence:   Enter/Update Individual Vendor Invoice, /articles/15202013217044
Maps to:    **resolves (probably) the batch-3 contradiction**

> That final sentence is the same sentence that appears in `Bank Reconciliation Overview` and made
> batch 3's contradiction. Seeing it here, in the context of **AP disbursement by card or cash**,
> strongly suggests it is a note about *paying vendors* by cash/card — not about customer cash
> receipts. That reading makes `Bank Reconciliation Overview` internally consistent: customer cash
> and card receipts **do** reconcile; vendor payments made by cash or card do not.
> I am recording this as a **probable resolution, not a confirmed one** — the sentence is
> unqualified in both articles and should still be verified with STORIS. See section H.

### FINDING 64 — Bill and credit types are a closed enumeration used for payment selection
Trigger:    Bill Selection tab
Bill types: Merchandise · Pending · Expense · Freight · Direct Ship · Customer's Own Material ·
            Special order Non-inventory · **Customer Refund** (inactive for virtual card)
Credit types: Merchandise · Expense · Freight · Vendor Receivable · Service Warranty · Adjusted Inventory
Rule:       "For customer refund payments, if no invoice number exists for an AP bill on the payment,
            the program includes the customer number instead."
Gates:      `Approve refund bills` and `Print refund checks` in
            `Create a User/Group Actions - Payables Security`
Evidence:   Select and Approve Bills for Payment, /articles/15202011444756
Maps to:    NEW — and confirms Finding 40's AR→AP crossing from the AP side

---

## C. Screen and field inventory

**Enter/Update Individual Vendor Invoice** — tabs: General, Invoice Detail, Check Information.
Header: Bill · TPA# · Status/Mode · Open Amount $. Paper-clip attachment indicator per tab.
- *General:* Company · Date · Type · Vendor · Status · Hold Code · Invoice · Invoice/Credit Number ·
  Invoice/Credit Date · Terms · Pay Prior to Receipt · Exchange Rate · Amount · Freight · Freight $ ·
  Sales Tax · Sales Tax $ · Miscellaneous · Miscellaneous $ · Total Invoice/Credit Detail $ ·
  Invoice/Credit Total $ · Actions
- *Invoice Detail:* Proof Amount · Available for Approval (Vendor, PO or RA Number, Receipt Date,
  Quantity, Unit Cost $, Extension $) · Approved Total · Approved for Payment · Reference/Product ·
  Vendor Model · Description · Quantity · Unit Cost · Extension · Taxable · Grid Information · Actions
- *Check Information:* Remittance · Pay · Comment · Payment · Bank · Pay Date · Amount ·
  Quick Check Active · Separate Check · Terms · Payment Schedule grid (Due Date, Amount, Date Paid) ·
  Invoice Date · Due Date · Terms Date · Discount · Alternate Payment Method (Method, Reference,
  Date, Amount) · Actions

**Enter Multiple Vendor Invoices** — step 1: Select Process Desired · Purchase Order Number ·
Auto Select · Vendor Code · Container ID · Trip ID · Location · Reference Number · Order Number ·
Type of Document. Step 2 → AP Approval Selection Screen (skipped if Auto Select). Step 3 →
Enter/Update Individual Vendor Invoice.

**AP Approval Selection Screen** — Model · Plan · Order · PO or Reference Number · Vendor Name ·
Available · Date · Type · Special Order Detail Information. All / None buttons.

**Convert Pending Bills** — Vendor · Action · Number of Days Prior to Due Date with No Receipt ·
Send Output to · Export Path · Actions.

**Disburse Payable Invoice Charges** — Freight, Sales Tax, Miscellaneous · Total · Type · Charge · $ · Grid.

**View and Manage AP Bills** — Date Code · Start Bill Date · End Bill Date · Company · Invoice Number ·
Vendor · Bank · On Hold Only · Hold Code · From EDI and Not From EDI · Invoice Types · Credit Types ·
Grid. Buttons: Search · Clear · Remove Hold · View · Maintain.

**Select and Approve Bills for Payment** — tabs: Bill Selection, Bill Approval, Check Review,
EFT Review, Virtual Card Review. Header: Bank · Date · Time/Code · New · Type · Status · Total Approved.
- *Bill Selection:* Vendor · Vendor Class · Include AP Bills regardless of Default Payment Method ·
  Include Payments · bill-type checkboxes · credit-type checkboxes ·
  Exclude Credits Resulting in Negative Checks · Payment Date · Select with Date Type as ·
  Start · Cutoff · Bills With Terms Only · Always Take Terms · Select Bills
- *Bill Approval grid:* Bill · Invoice · Remit-To · Bill Type · Due/Pay Date · Terms Date ·
  Amount Due · Discount · Approved · Edit · Remove · Add Bill
- *Check Review grid:* Reference · Remit-To · Vendor · Amount · Status · Check
- *EFT Review grid:* Reference · Remit-To · Vendor · Amount · Status · EFT
- *Virtual Card Review grid:* Reference · Remit-To · Vendor · Amount · Status · Virtual Card Payment Number

**Void Check Run** — Bank · Date · Time/Code · Amount · Grid.
**Void Payment Screen** — Bank · Method · Reference · Grid.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| pending bill conversion allowable cost variance percent | Payables Control Settings | Tolerance for `COST NM`; the only numeric match tolerance in the system |
| Auto-Conversion Valuation Percentage | Payables Control Settings | Same family; unavailable to TPA users |
| Default Invoice Charges to Inactive | Payables Control Settings | Deactivates FREIGHT/TAX/MISCELLANEOUS by default |
| Freight in Terms Amount | Payables Control Settings | If disabled, freight bills default pay date instead of terms date |
| Display (vendor model vs product code) | Payables Control Settings | Model column content on AP Approval Selection |
| Sort Detail Lines on Stub by | Payables Control Settings → Advanced | Check stub detail sequence and Check Review grid order |
| Number of Days Prior to Due Date with No Receipt | Convert Pending Bills run-time | Drives the `DUE DATE` exception |
| RECEIVING – Supply Purchase Orders must be Received | Purchasing Control Settings | Supply bills default to quantity received |
| Process Using Electronic Funds Transfer | Date For New Batch Window | Selects Check Review vs EFT Review |
| Export Checks | Bank Settings | Print Checks vs Export Payable Checks |
| Check Run File Format | Bank Settings → Select Bank Check Run File Format | Enables Create Check Run File |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Select alternate payment methods during vendor invoice entry | Create a User/Group Actions - Payables Security | Alternate Payment Method fields on bill entry |
| Approve refund bills | Create a User/Group Actions - Payables Security | Including Customer Refund bills in a payment |
| Print refund checks | Create a User/Group Actions - Payables Security | Printing refund checks |

---

## F. State machines and enumerations

**AP bill status** — Pending → Open → (paid) → Closed. Plus a **Hold** flag with a **Hold Code**.
Status codes appear unlabelled on `Report Cash Requirements` (batch 2), e.g. `H` = Hold.
Full list lives in `AP Bill Types` (Overviews → References) — **not yet read, queued**.

**Payment status** — Pending (in process, not yet printed) · Printed · Reconciled · Voided.

**Virtual card batch status** — Pending → Transmitted (on a payment file, not redeemed) →
Completed (redeemed by vendor) · Voided.

**Bill types** — Merchandise · Pending · Expense · Freight · Direct Ship · Customer's Own Material ·
Special order Non-inventory · Customer Refund.
**Credit types** — Merchandise · Expense · Freight · Vendor Receivable · Service Warranty · Adjusted Inventory.

**Conversion exception codes** — line: `QTY NM` · `COST EXC` · `COST NF`.
bill: `VENDOR NM` · `COST NM` · `DUE DATE`.

**AP approval process modes** — Inventory Activity (× Vendor Invoice | Vendor Credit) ·
Miscellaneous Supplies · COM Activity · Protection Plan.

**Standard invoice charge codes** — `FREIGHT` · `TAX` · `MISCELLANEOUS`.

**Reserved vendor code** — `RFND` (the refund vendor; excluded from virtual card batches).

---

## G. Sequencing rules (additions)

1. Receipt → pending or open AP bill → approval → payment batch → print/export → reconcile → purge.
2. Pending bill conversion requires: quantity match, cost variance within tolerance, no zero cost
   exceptions at receiving, all POs open.
3. `Convert Pending Bills` can run inside End-of-Day.
4. Only **one** pending payment per bank at a time, across check, EFT and virtual card.
5. A virtual card batch must reach Completed (file created **and** response imported) before any
   other payment type can run for that bank.
6. All negative payments must be resolved before Print Checks / Create EFT File activates.
7. AP bills on a pending check run **cannot be edited**.
8. Voiding requires a printed run; reconciled checks and checks applied to overpaid pending bills
   block the void.
9. (TPA) supply POs created in STORIS must complete AP approval to close the PO.
10. `All Checks Printed Successfully` in `Print Checks` is what writes the bank rec record (batch 3).

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **"Credit card and cash payments cannot be included in the Bank Reconciliation."** Finding 63
  gives a probable reading — it concerns *AP alternate payment methods*, not customer receipts —
  which would make `Bank Reconciliation Overview` self-consistent. But the sentence is unqualified
  in both articles. **Still the number one question to put to STORIS.** Downgraded from
  "self-contradictory" to "probably scoped to disbursement", not resolved.
- **Deposit release to revenue** — still not found after four batches. Almost certainly in
  Sales Processing order completion, not Accounting. `W-033` half-open.
- **`AP Bill Types`** — the enumeration exists as an article and we have not read it. Needed for
  our own bill-type enum. Queued.
- **`Pay Prior to Receipt`** field — named, undescribed; presumably what creates a pending bill.
- **`Proof Amount` vs `Approved Total` vs `Available for Approval`** — three related numbers on
  the Invoice Detail tab with no stated arithmetic between them.
- **`Quick Check Active` / `Separate Check`** — named, undescribed (`Quick Check Processing` queued).
- **`Vendor Class`** — a selection dimension and a sort key; never defined.
- **`Include AP Bills regardless of Default Payment Method`** — implies vendors carry a default
  payment method; where it is set is not stated.
- **`Always Take Terms`** — discount policy switch, undescribed.
- **Scheduled Payment terms type** — the Payment Schedule grid is active only for it; the terms
  type itself is undocumented here.
- **What "sales overlap period" means.** It appears twice as a void exception and is the only
  documented breach of the period gate. Its definition is not in the Accounting section.
- **Exchange Rate on the bill header** — multi-currency AP is real but unexplained.
- **EDI provenance** — `From EDI and Not From EDI` filter, `Container ID`, `Trip ID` validated
  against the advance ship notice record. The ASN→AP link is implied, never described.

**3. Inferences (not quotable, kept out of section B)**
- Because conversion forces proof to zero by restating cost, `Cost Exceptions` and
  `Valuation Difference` are probably the accounts that absorb what other ERPs call PPV — but no
  article says a conversion writes to them.
- `Pay Prior to Receipt` is very likely the flag that makes a bill pending and drives
  `Recorded Not Received`; the docs never join those two.
- The one-pending-payment-per-bank lock is probably why `Add Bills to Existing Check Run` and
  `AP Check Approval Bill Selection` exist; not stated.

---

## I. Unknown unknowns (additions)

- **Virtual card payments as a third disbursement rail** with its own three-state lifecycle,
  currency uniformity rule, and a reserved refund vendor `RFND`.
- **Vendor Class** as a first-class grouping driving selection and sort.
- **Scheduled Payment terms** producing a payment schedule grid on the bill.
- **Container ID / Trip ID / EDI advance ship notice** as AP selection dimensions.
- **COM (Customer's Own Material) activity** as its own AP approval mode and bill type.
- **Service Warranty credits** and **Adjusted Inventory credits** as credit types.
- **Bill Back Settings** (vendor bill-backs) — a whole settings area surfaced in search.
- **AP Bill Conversion** — a spreadsheet-driven data-load tool including a
  "AP Bills - Customer Refunds" worksheet.
- **File attachments on AP bills** (paper-clip indicator, per tab, including product/customer images).
- **Sales overlap period** — an undefined period concept that permits voids outside normal gating.
- **Negative-check suppression** as an explicit selection option.
- **`Report Merchandise on Paid Pending Bills`** — merchandise paid for but not yet received.
- **Multi-currency AP** — Exchange Rate on the bill, `Toggle Currency Action`, virtual card
  same-currency rule.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Pending AP bill | A bill entered before receipt; no liability recognised; excluded from the AP aged trial balance |
| Convert (a pending bill) | The match event that turns a pending bill into an open, liability-bearing AP bill |
| Proof Amount | The unreconciled difference on a bill; must be driven to zero by restating costs |
| Quantity available for approval | Received quantity minus quantity already billed on non-pending bills |
| QTY NM / COST NM / COST EXC / COST NF / VENDOR NM / DUE DATE | Conversion exception codes |
| Payment register key | The identifier of a check/EFT/virtual card payment; the AP document number |
| Remit-To | Vendor payment address; the consolidation key for checks alongside vendor |
| Check run | A batch of AP payments for one bank; only one pending at a time |
| Virtual card | Single-use card payment rail; Pending → Transmitted → Completed |
| RFND | Reserved refund vendor code |
| Alternate payment method | Paying a bill outside the check run, at entry time; permission-gated |
| Invoice charge code | Coded header charge (FREIGHT, TAX, MISCELLANEOUS, or user-defined) |
| Sales overlap period | Undefined period concept that permits voiding a payment outside normal period gating |
| Vendor Class | Vendor grouping used for payment selection and sorting |
| Hold Code | Reason marker accompanying an AP bill hold; cleared in bulk without capture |
