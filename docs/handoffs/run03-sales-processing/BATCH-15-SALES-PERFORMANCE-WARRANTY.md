# Run 03 — Sales Processing — Batch 15: Sales Performance, Commissions and Warranty Reporting

**Status: complete.** 9 articles. Findings 143–152.

**This batch explains negative margins, and it traces them back to run 2's cost exception queue.**
See Finding 144.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Report Written Sales Dollars** | /articles/15203235628052 | EXTRACTED — very rich |
| 2 | **Report Completed Sales Dollars** | /articles/15202503542932 | EXTRACTED — **offers a GL recap** |
| 3 | **Report Sales Commissions** | /articles/15203214449300 | EXTRACTED — **full legend** |
| 4 | Report Missed Sales Opportunities for Protection Plans | /articles/15203235033748 | EXTRACTED |
| 5 | Report Extended Warranties About to Expire | /articles/15202676626964 | EXTRACTED |
| 6 | Report Products Sold Without Warranties | /articles/15203129110036 | EXTRACTED |
| 7 | **Report Deleted Orders** | /articles/15202742465684 | EXTRACTED |
| 8 | Report Orders Completed via a Remote Process | /articles/15203028989588 | EXTRACTED |
| 9 | Report Sales Reservation Reassignments | /articles/15203234860436 | EXTRACTED — thin |

Discovered and queued: **`EIS`** · `Commission Settings` · `Salesperson Settings` ·
`Remote Order Completion` · `Report Physical Inventory Reservation Exceptions` ·
POS Control Settings → **Pricing and Commissions tab** (`Sort Report By`, `Report Type`).

---

## B. Wiring findings

### FINDING 143 — Completed sales reporting can print a GL recap
Invariant:  "This routine produces a series of reports showing **sales-related transactions (excluding
            service orders) by location**… **An option to include a `GL recap` is also available.**"
Columns (verbatim): Merchandise Sub-Total · **`Charges`** · Customer Discount · Misc Fees · Sales Tax ·
            Total Invoice · **`Gross Profit`** · **`Profit Percentage`** · **`Operator Initials`**
Formula (verbatim): "**Profit Percentage - Calculated as `Gross Profit / Net Merchandise (after
            discount) * 100`, rounded to the nearest decimal.**"
Protection plan (verbatim, stated on both sales reports): "**If this report is printed or a PDF is
            created, the amount for the protection plan is included in this [`Charges`] column. When
            output to Excel or Personal Report Viewer, the protection plan charges can be reviewed in a
            separate column.**"
Period scope: "**This report can show information for both open and closed sales periods.**"
Evidence:   Report Completed Sales Dollars, /articles/15202503542932
Maps to:    **W-052 / W-053 — the second GL recap in the audit**

> Run 2 found exactly one report offering a GL recap — merchandise transfers (run 2 F117). **This is the
> second, and it is the sales one**, which is the more important of the two: it is the bridge between
> what the floor sold and what the ledger recorded.
>
> The protection-plan behaviour is a real trap: **the same report shows a different breakdown depending
> on output format.** Printed, protection plans hide inside `Charges`; exported, they get their own
> column. Two people reconciling the same day's sales from the same report can disagree on the
> merchandise/charges split. Batch 13 Finding 128 found the same asymmetry on VAMOO — **output format
> changing available detail is now a section-wide pattern.**

### FINDING 144 — Negative margins are explained, and the explanation runs back to the cost exception queue
Invariant (verbatim): "**Negative margins on this report involve changes in the cost of an item (for
            example, a PO being received, a cost exception being solved, etc.). At the time a sales
            order is written, STORIS uses average cost since the exact cost is not yet available. When
            the exact cost of an item becomes [available], the sales order updates and an 'adjustment'
            record is made to the Written Business and BTA files. Because only [the] cost changes and
            not the selling price, the end result is a negative adjustment to the margin.**"
Evidence:   Report Written Sales Dollars, /articles/15203235628052
Maps to:    **W-061 — CONFIRMED; and it closes a run-2 loop**

> **This is the sentence that ties three runs together.** Run 2 established the cost exception queue as
> STORIS's purchase price variance mechanism (run 2 F29) and found that solving a type-4 exception
> adjusts the cost layer — but could not say what happened downstream. **Here is the downstream: the
> sales order's cost is restated, an adjustment record is written to Written Business and `BTA`, and the
> margin on an already-written sale moves.**
>
> Three consequences worth stating plainly. **Margin on a written sale is provisional** — it is average
> cost until the true cost arrives. **Selling price never moves to compensate**, so cost increases
> always show as negative margin adjustments. And **the trigger is a purchasing event** (a receipt, a
> cleared cost exception) landing on a sales report days or weeks later.
>
> That answers a question run 2 flagged as its most important open item, and it does so from a sales
> report's footnote.

### FINDING 145 — Written sales data can be purged by End-of-Month, and the report says so
Invariant (verbatim): "**This report can include data from closed periods for which the End-of-Month
            process has been run because the End-of-Month process can purge data from closed periods.
            If preferred, you can use `EIS` or create customized sales analysis reports to display
            written sales data from previous periods.**"
Adjustment scope (verbatim): "Item added or removed from a sales order already filed/saved. Item price
            increased or decreased… **NOTE: Adjustments made to a sales order via A/R (for example,
            key-offs, payments, and refunds, etc.) do not log to the report as adjustments.**"
Sort:       "completed orders, by order date followed by order number, then… open orders, by order date
            followed by order number."
Evidence:   Report Written Sales Dollars, /articles/15203235628052
Maps to:    **W-012 — CONFIRMED; and a fourth retention risk**

> **End-of-Month can purge written sales data from closed periods**, and the article's own remedy is to
> use a different tool. Run 2 found three retention timers on costing data and one on purchasing
> history; this is the sales-side equivalent, and it is the most consequential yet because **written
> business is the primary measure of what the sales floor produced.**
>
> **`EIS`** appears for the first time in the audit — a third reporting layer after Report Builder and
> Sales Analysis (SABRE), plus the Data Warehouse. And the AR exclusion matters: **key-offs, payments
> and refunds do not appear as adjustments**, so the written-sales adjustment trail covers merchandise
> and price changes only.

### FINDING 146 — The commission report has a published error legend, and it admits five failure modes
Type legend (verbatim, complete): **`(A)` Adjustment · `(R)` Return · `(S)` Split · `(J)` Commission
            Adjustment**
Error legend (verbatim, complete): **`(C)` No Cost Found · `(D)` Salesperson Not on Original
            Transaction · `(E)` Commission Setup Error · `(O)` Original Transaction Not Found ·
            `(M)` Margin Calculation Error · `(P)` No Price Found · `(X)` Subroutine Error**
Combination (verbatim): "**A type code and error code, or multiple error codes, may appear on a single
            line. For instance, a Type of `RE` would indicate that there was a commission setup error on
            a return.**"
Evidence:   Report Sales Commissions, /articles/15203214449300
Maps to:    **NEW — and it is unusually candid**

> **Seven named error conditions printed on a commission report**, including `Subroutine Error` — an
> internal failure surfaced to the user as a code on a payroll-adjacent document.
>
> Two of them connect to earlier findings. **`(C)` No Cost Found** and **`(P)` No Price Found** are what
> happens when the seven-level pricing hierarchy (batch 2 F15) or the costing table returns nothing —
> batch 2 established "no price defaults" is a valid outcome, and this is where it lands. **`(O)`
> Original Transaction Not Found** is the return-side consequence of purge windows.
>
> For a rebuild, this legend is a gift: **it is a list of every way commission calculation can fail**,
> written by the people who built it.

### FINDING 147 — Commission settings changes do not propagate to existing orders
Invariant (verbatim): "**If you modify any commission settings, the changes do not automatically affect
            existing sales orders and thus do not affect the results of this report. For the changes to
            affect existing sales orders and appear on this report, you must update the individual
            orders either by - editing the settings via the `Commission/Spiff Updates Screen` or -
            re-entering the individual line items.**"
Return dating (verbatim): "For customer returns, and dollars-only debit/credit adjustments, the program
            creates commission records **based on the written date of the original invoice. If the
            original invoice is no longer on file, the program bases the date on the written date of the
            return/exchange/adjustment.**"
Evidence:   Report Sales Commissions, /articles/15203214449300
Maps to:    **W-012 — CONFIRMED; W-061**

> **Commission is snapshotted onto the order at entry.** Changing the commission plan tomorrow does not
> restate today's orders — you must touch each one. That is defensible (you cannot retroactively change
> what someone earned) but it means **the commission configuration and the commission actually payable
> diverge permanently**, and reconciling them requires re-entering lines.
>
> The return-dating fallback is the audit's clearest instance of purge-driven behaviour change:
> **a return dates to the original sale, unless the original has been purged, in which case it dates to
> itself.** So the same return produces different commission periods depending on how old it is.

### FINDING 148 — Payment type can carry a commission adjustment, reported as a pseudo-product
Invariant:  "This report includes commission lines for **payment types defined with commission
            adjustment rates**."
Presentation (verbatim): "**Product Number prints as '`Pmt Adj xxxxx`', where the 'xxxxx' displays as
            the payment type code. Brand is always null**… **Unit Price and Total Price are the payment
            type amount.**… **`Comm Pcnt` is the commission adjustment percent. `Comm Dollars` is the
            calculated commission adjustment amount.**"
Warning (verbatim): "**the totals for each salesperson and the total at the bottom of the report include
            the payment type adjustment amounts. Thus, these totals do not correspond to other reports
            that display invoice (completed) numbers.**"
Protection plans: "**Protection Plan commissions will report the '`P-Plan {Protection Plan Code}`' and
            is limited to 20 characters.**"
Add-ons:    "**If you use commission add-on percentages (by product via the Pricing tab in the `Advanced
            Product Settings` or globally via the `Costing Control Settings`), they reflect in this
            report.**"
Evidence:   Report Sales Commissions, /articles/15203214449300
Maps to:    **W-061 — CONFIRMED, and the commission input count reaches eight**

> **Commission can be adjusted by how the customer paid.** A salesperson steering a customer to a
> particular tender changes their own commission — which is a real and quite pointed incentive design,
> and it is implemented by faking a product line called `Pmt Adj <code>`.
>
> The candid warning is the useful part: **this report's totals deliberately do not tie to any
> invoice-based report.** Anyone reconciling commission to sales must know that, and it is stated only
> here.
>
> Adding payment adjustments and protection plans to batch 11's six inputs, **commission on one order
> now depends on eight things across seven files** — including run 2's Costing Control Settings, which
> supplies both the commission costing method and the global add-on percentage.

### FINDING 149 — Voided orders are reported once, and flagged as reported
Invariant (verbatim): "When run during end of day, orders are selected for the report based on the
            following: **Voided orders with a written time · Voided orders that have not been reported
            by end of day. (Voided orders are flagged as reported once they appear on the end of day
            report.) · Voided orders that have been deleted on or after the date of the last end of day
            but no later than the date of the current end of day.**"
Evidence:   Report Deleted Orders, /articles/15202742465684
Maps to:    **W-012 — CONFIRMED; a fourteenth End-of-Day behaviour**

> **A once-only report with a reported flag** — the same shape as run 2's cost exception worklists and
> batch 14's multiple-customers exception (which End-of-Day deletes after printing). STORIS repeatedly
> builds "print it or lose it" reporting.
>
> Here the record survives but the *notification* does not: a voided order appears on exactly one
> End-of-Day report and never again. Since voiding is one of the few destructive acts available at point
> of sale, **the daily deleted-orders report is the primary control over it**, and missing a day means
> missing that day's voids permanently unless someone runs the on-demand version with the right dates.

### FINDING 150 — Remote order completion has its own report, and its own failure modes
Invariant (verbatim): "list orders processed by the **`Remote Order Completion`** feature. The report
            lists **orders completed remotely via a mobile device** and orders processed by the feature
            **that remain on the manifest** such as orders that **- failed the validation test or -
            were not delivered.**"
Recommendation: "**If using the Remote Order Completion feature, we recommend you run this report
            daily.**"
Fields:     Location · Completion Date · Route · Truck · **`Exceptions Only`**
Evidence:   Report Orders Completed via a Remote Process, /articles/15203028989588
Maps to:    **completes batch 1 Finding 8**

> Batch 1's `Order Completion Process` ended with the bare line "**STORIS supports Remote Order
> Completion**". This is the operational half: **completion happens on a driver's mobile device, against
> the four preconditions batch 1 documented**, and orders **failing validation stay on the manifest**.
>
> So the eighth exception surface in the run is a delivery-side one, and the docs recommend a daily
> review. Combined with batch 3's finding that a refused capacity override silently unschedules lines,
> **the delivery half of Sales Processing has two silent-failure paths and one recommended daily report
> covering only one of them.**

### FINDING 151 — Protection plan and warranty reporting is built for outbound sales motions
**Missed opportunities** (verbatim): "compares the quantity and dollar value of protection plans **sold
            by a salesperson** with the quantity and dollar value of the protection plans **the
            salesperson could have sold**. The difference is expressed in **absolute numbers,
            percentages, and averages**." · "**It will not include product or product category fields as
            protection plans apply to the whole order.**"
**Expiring warranties** (verbatim): "along with the **Names, Home Phone, and Work Phone of the customers
            who can then be contacted about renewals**… **up to 120 days in the future**." · coverage
            filter **Parts / Labor / both**.
**Sold without warranties** (verbatim): "a useful follow-up sales tool that quickly pinpoints a potential
            source of warranty business — **customers who did not purchase a warranty at the time they
            bought the product but may be willing to reconsider.**"
Evidence:   all three articles
Maps to:    **NEW — and it connects to batch 12's CRM**

> **Three reports whose explicit purpose is generating outbound contact lists**, each producing customer
> names and phone numbers. Batch 12 Finding 116 found warranty expiry named as a CRM trigger; these are
> the report-side equivalents, and they exist alongside the CRM rather than inside it.
>
> The missed-opportunities report is the sharpest: **it measures a salesperson against what they could
> have sold**, computed from the protection-plan qualification rules batch 1 Finding 12 documented. That
> makes plan attach rate a managed, reported metric — and it means **the auto-attach optimisation and
> the missed-opportunity measure are computed from the same qualification logic**, so changing the plan
> settings changes both the offer and the scorecard.
>
> Note the limitation stated outright: **protection plans apply to the whole order**, so the report
> cannot break down by product or category.

### FINDING 152 — Commission and sales reporting are shaped by two POS settings on a dedicated tab
Invariant:  "The data that appears on this report is affected by your selection at the **`Sort Report
            By`** field on the **Pricing and Commissions tab** in the Point of Sale Control Settings."
Invariant:  "If the **`Report Type`** field in the Point of Sale Control Settings is set to **`Profit
            Margin`**, the following columns print: **Total Cost is the adjustment factor. Total Margin
            and Marg Pcnt are null.** If… set to **`Customer Name`**, the `Customer Name` prints in the
            same manner as the detail lines."
Output restrictions (verbatim): Written Sales — "**If you select `Summary`… the program restricts your
            output option to `Screen`**"; seven columns "**available only when output settings are set to
            Personal Report Viewer, Excel, or ASCII Export**"; three Detail options where "**the Excel
            output option is not available.**" Completed Sales — Summary "**restricts your output options
            to Printer or Screen.**"
Evidence:   Report Sales Commissions, /articles/15203214449300;
            Report Written Sales Dollars, /articles/15203235628052;
            Report Completed Sales Dollars, /articles/15202503542932
Maps to:    **NEW**

> **A `Report Type` of `Profit Margin` versus `Customer Name` changes what the commission report is** —
> the same routine either shows margin columns or customer names, decided by a control setting, not a
> run-time option. So two installations' commission reports are not comparable documents.
>
> And the **output-format restrictions are extensive and contradictory across reports**: Summary forces
> Screen on one report and Screen-or-Printer on another; three Detail options disable Excel; seven
> columns exist only outside the printed form. Combined with Finding 143's protection-plan split,
> **choosing an output format materially changes what the report contains** — five separate instances of
> that in this batch alone.

---

## C. Screen and field inventory

**Report Written Sales Dollars** — Date Code · Start/End Date · District · Store · **`Order Type`** ·
**`Report Type`** *(Summary / Detail / Both)* · *(Detail only)* **`Include Audit Comments`** ·
**`Include All Salespeople`** · **`Include Customer's Full address`** · Send Output to · Export Path.
Columns available only outside print: **ID · Second Description · Vendor · Category · Marketing Code 1 ·
Marketing Code 2 · PO**.

**Report Completed Sales Dollars** — Date Code · Start/End Date · **`Detail, Summary, or Both`** ·
**`Print GL Recap`** · Send Output to · Export Path.
Columns: Merchandise Sub-Total · Charges · Customer Discount · Misc Fees · Sales Tax · Total Invoice ·
Gross Profit · **Profit Percentage** · **Operator Initials**.

**Report Sales Commissions** — Date Code · Start/End Date · **`Report Type`** · Salesperson ·
Store Location · Sort By · **`Exclude Zero Spiff Amount`** · Detail or Summary · Send Output to ·
Export Path. Type legend `A`/`R`/`S`/`J`; error legend `C`/`D`/`E`/`O`/`M`/`P`/`X`.
Payment adjustment lines print as **`Pmt Adj xxxxx`**; protection plans as **`P-Plan {code}`** (20 chars).

**Report Missed Sales Opportunities for Protection Plans** — Protection Plan · Date Code ·
Starting/Ending Date · District · Selling Location · Salesperson · **`Include Summary`** ·
**`Open Orders`** · **`Completed Orders`** · **`Sort Salespeople By`** · Send Output to · Export Path.

**Report Extended Warranties About to Expire** — District · Warehouse Location · **`Report Type`**
*(Parts / Labor / both)* · **`Days Before Expiration`** *(up to 120 days forward)* · Salesperson ·
Send Output to · Export Path. Outputs customer **Names, Home Phone, Work Phone**.

**Report Products Sold Without Warranties** — District · Warehouse Location · **`Warranty Category`** ·
**`Open or Completed Orders`** · **`Report on Parts, Labor, Both`** · Date Code · Starting/Ending Date ·
Send Output to · Export Path.

**Report Deleted Orders** — District · Store · Start Date · End Date. Runs on demand or at End of Day.

**Report Orders Completed via a Remote Process** — Location · Completion Date · Route · Truck ·
**`Exceptions Only`** · Send Output to · Export Path.

**Report Sales Reservation Reassignments** — District · Store · **`Number of Days Committed`** ·
**`Exclude Items Less Than Auto-Fill Days`** · Send Output to · Export Path.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Sort Report By`** | POS Control Settings → **Pricing and Commissions** | Data appearing on the commission report |
| **`Report Type`** (`Profit Margin` / `Customer Name`) | POS Control Settings | **Which columns the commission report prints at all** |
| commission add-on percentages | **Advanced Product Settings → Pricing** *(by product)* and **Costing Control Settings** *(global)* | Reflected in commission calculations |
| payment-type commission adjustment rates | Payment type definitions | Commission varies by tender |
| End-of-Month purge | (period processing) | **Can remove written sales data from closed periods** |

---

## E. Security permissions catalog

*No new permissions.* Every report in this batch carries the Regional Processing caveat; the commission
report additionally sorts by district first when Regional Processing is active.

---

## F. State machines and enumerations

**Commission line types** — `A` Adjustment · `R` Return · `S` Split · `J` Commission Adjustment.
**Commission error codes (7)** — `C` No Cost Found · `D` Salesperson Not on Original Transaction ·
`E` Commission Setup Error · `O` Original Transaction Not Found · `M` Margin Calculation Error ·
`P` No Price Found · `X` Subroutine Error. **Codes combine** (e.g. `RE`).
**Commission inputs (8)** — customer preset split · order commission category · line commission
category · `Commissionable` flag · spiff · Price/Spiff/Commission Table · **payment-type adjustment
rate** · **product/global add-on percentage** *(plus the costing method from run 2)*.
**Written-sales adjustment causes** — line added/removed · price changed · **cost restated (PO receipt,
cost exception solved)**; **AR activity excluded**.
**Margin timing** — written at **average cost**, restated when exact cost arrives, **selling price never
adjusted** ⇒ negative margin adjustments.
**Reporting layers in the audit (5)** — Report Builder · Sales Analysis (SABRE) · **EIS** ·
Data Warehouse · Customized Sales Analysis.
**End-of-Day behaviours added** — `Report Deleted Orders` *(once-only, with a reported flag)*.

---

## G. Sequencing rules

1. Written sales record margin at average cost; exact cost later restates it via an adjustment record.
2. Cost restatement writes to both **Written Business** and **`BTA`**.
3. AR activity (key-offs, payments, refunds) does not produce written-sales adjustments.
4. Commission settings changes require touching each order to take effect.
5. Return commissions date to the original invoice — unless it has been purged.
6. Voided orders appear on exactly one End-of-Day report and are flagged as reported.
7. Remote-completion failures remain on the manifest and appear on the exceptions report.
8. End-of-Month may purge written sales data from closed periods.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`EIS`** — a reporting layer named as the remedy for purged written sales data. Unexpanded and
  undocumented anywhere in the audit.
- `Commission Settings` and `Salesperson Settings` — still unread after two batches referencing them.
- `Remote Order Completion` — the feature itself; likely run 4 territory.
- POS Control Settings → **Pricing and Commissions tab**.

**Documented but ambiguous**
- **What the GL recap on `Report Completed Sales Dollars` actually contains** — accounts are not named,
  unlike batch 4's card postings.
- **What End-of-Month purges from written sales**, and on what retention setting.
- **Whether the negative-margin adjustment also restates the GL**, or only the sales reports.
- **`Number of Days Committed`** and **`Exclude Items Less Than Auto-Fill Days`** on the reservation
  reassignment report — the delivery-commitment metric is not defined.
- **What the "validation test" is** for remote order completion.
- **How "could have sold" is computed** on the missed-opportunities report — presumably the
  qualification rules of batch 1 Finding 12, but not stated.
- **Whether `Report Type` on the commission report is the same field** as the run-time `Report Type`.
- **`Order Type`** on written sales — the enumeration is not given.

**Inferences (not in section B)**
- The missed-opportunities denominator is presumably protection-plan qualification per batch 1 F12; the
  article says only "could have sold".
- `EIS` is plausibly an executive information system reporting layer; never expanded.
- The negative-margin adjustment presumably does not restate the GL, since the GL posts cost of sales at
  completion — but **nothing states this**, and it is the natural next question.

---

## I. Unknown unknowns

- **A GL recap available on the completed sales report.**
- **Negative margins caused by cost restatement**, tracing back to run 2's cost exception queue.
- **Margin on a written sale being provisional** until exact cost arrives.
- **End-of-Month purging written sales data**, with a different tool recommended as the remedy.
- **A seven-code error legend** on the commission report, including `Subroutine Error`.
- **Commission settings changes not propagating** to existing orders.
- **Return commissions dating to the original invoice unless it has been purged.**
- **Commission adjusted by payment type**, printed as a pseudo-product `Pmt Adj xxxxx`.
- **Commission report totals that deliberately do not tie** to invoice-based reports.
- **Voided orders reported exactly once**, with a reported flag.
- **Remote completion failures remaining on the manifest.**
- **Three outbound-contact reports** producing customer phone lists.
- **A missed-opportunity measure** scoring salespeople against computed eligibility.
- **Output format changing report content** — five instances in one batch.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Written Business / BTA | Sales as written · delivered business; both receive cost-restatement adjustments |
| Negative margin adjustment | Result of exact cost replacing average cost after a sale is written |
| Pmt Adj xxxxx | Pseudo-product line carrying a payment-type commission adjustment |
| P-Plan {code} | Protection plan commission line, 20-character limit |
| Type / Error legend | Commission report codes: A/R/S/J and C/D/E/O/M/P/X |
| GL Recap | Optional ledger summary on the completed sales report |
| EIS | Reporting layer recommended for purged written sales data; never expanded |
| Remote Order Completion | Mobile-device delivery completion; failures stay on the manifest |
| Missed Sales Opportunities | Protection plans sold vs plans the salesperson could have sold |

---

## Contract adjudication — batch 15

| Contract | Verdict | Basis |
|---|---|---|
| **W-061** | **CONFIRMED — and it closes run 2's biggest open question** | Margin is written at average cost and restated when exact cost arrives, via Written Business and BTA adjustments (F144) |
| **W-052 / W-053** | **CONFIRMED, extended** | A GL recap is available on completed sales reporting (F143) |
| **W-012** | **CONFIRMED** | End-of-Month purges written sales; return commissions date to the original unless purged (F145, F147) |
| **W-050** | **consistent** | Regional Processing applies; commission report sorts by district when active |
| **W-041** | **relevant** | Cost exception resolution surfaces on sales reports as negative margin (F144) |

---

## Next — batch 16 (final): coverage sweep of Sales Views and Reports
