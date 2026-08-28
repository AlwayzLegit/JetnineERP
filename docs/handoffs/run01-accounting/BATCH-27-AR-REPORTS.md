# Run 01 — Accounting — Batch 27: Accounts Receivable and Vendor Receivable Reports

10 articles. The AR control pack. Two findings matter for parity: the aged trial balance's
**long-term revolving restriction**, and the fact that receivables auditing is **opt-in**.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 281 | **Report Accounts Receivables Aged Trial Balance** | /articles/15202503184020 | EXTRACTED |
| 282 | **Report Audited Receivables** | /articles/15202503183508 | EXTRACTED |
| 283 | Report Delinquent Accounts | /articles/15202742454292 | EXTRACTED |
| 284 | Report Accounts with Credit Balances | /articles/15202503961364 | EXTRACTED |
| 285 | Report Collector Efficiency | /articles/15202504443284 | EXTRACTED |
| 286 | Report Projected Fixed Term Revolving Cash Flow | /articles/15203128896660 | EXTRACTED |
| 287 | Report Vendor Receivables Trial Balance | /articles/15203235627796 | EXTRACTED |
| 288 | **Report Daily Vendor Receivables Activity** | /articles/15202676619156 | EXTRACTED |
| 289 | Report 80\20 Analysis | /articles/15202552433172 | EXTRACTED — **misfiled, inventory/sales** |
| 290 | Report Summarized Aging Receivables / Report Customer's Receivables Activity | /articles/15203234854804, /15202552430868 | LOGGED |

---

## B. Wiring findings

### FINDING 301 — The AR aged trial balance shows long-term revolving **only as of today**
Producer:   `Report Accounts Receivables Aged Trial Balance` — AR balance per account split into
            current and aged; sorts by store location, optional secondary sort by **customer class**
Report types: **Detail** (each balance by transaction type) · **Summary** (total per account) ·
            **Audit** ("component amounts of each transaction … deposit applied, payment received") ·
            **Total** (grand totals only)
Invariant:  "When you run this report on demand, the report displays **long term revolving amounts
            only if you select today's date as the As Of Date**."
Totals:     "broken out by **Open Item and Long Term Revolving**"
Schedule:   "This report runs as part of the **End-of-Month** process."
Options:    Group by Store of Activity · **Payment Agreement** · Aging · Exclude
Evidence:   Report Accounts Receivables Aged Trial Balance, /articles/15202503184020
Maps to:    **W-069 — CONTRADICTED for AR**

> **You cannot produce a historical aged trial balance that includes long-term revolving.** As-of
> dating works for open item and not for the long-term ledger. That is a hard limit on backdated
> AR reporting, and it means the End-of-Month run is the *only* reliable point-in-time record of the
> full receivable. Two consequences: keep every EOM run, and design ours so long-term balances are
> reconstructable as of any date.
> Note `Payment Agreement` as a selection axis, and the Audit version's decomposition into
> "deposit applied, payment received" — the same component model as the collections letter (batch 10).

### FINDING 302 — Receivables auditing is opt-in, and without it the audit report does not exist
Producer:   `Report Audited Receivables` — "all receivables activity that occurred **since the last
            End-of-Day**", by district and store; an EOD report also runnable on demand
Gate:       "This report is **available only if** the **`Open Item Auditing`** field is selected in
            `Accounts Receivables Control Settings`." · "In order for your system to audit open item
            and revolving activity, **and retain the data needed for this report**, the Open Item
            Auditing field … must be active."
Scope:      with Revolving Receivables active, covers **both** open item and revolving activity
Evidence:   Report Audited Receivables, /articles/15202503183508
Maps to:    **W-053 — CONTRADICTED**

> The fourth opt-in audit switch found in this run, alongside `Track Settings Activity` (batch 10),
> `Inventory-G/L Reconciliation Audit` (batch 24) and `End-of-Day Posted Transactions` (batch 24).
> **All four should be verified on the live system before cutover.** Together they determine how
> much of STORIS's history is reconstructable at all. `W-053` assumes audit rows are written as a
> matter of course; in STORIS they are written only where someone switched them on.

### FINDING 303 — Vendor receivables have their own daily audit trail with six activity sections
Producer:   `Report Daily Vendor Receivables Activity` — "an **audit trail** of all daily activity
            pertaining to vendor receivables"
Sections:   **cash receipts (sorted by bank) · adjustments · bill-back postings · volume rebate
            postings · customer service order postings · AP bill postings**
Schedule:   "If the Vendor Receivables module is active, this report will be generated
            **automatically during the Day Ending process**"; the EOD version reports everything
            since the last EOD
Options:    Report on Date Type · Include Receipts · Include Adjustments · Include Automatic Postings
Companion:  `Report Vendor Receivables Trial Balance` — Summary / Detail / Audit, current and aged,
            as of a date
Evidence:   Report Daily Vendor Receivables Activity, /articles/15202676619156
Maps to:    completes batch 15 — **V/R is a fully-fledged subledger with its own daily pack and TB**

> The six sections name the V/R sources: **bill-backs, volume rebates, customer service orders** and
> **AP bills** in addition to cash and adjustments. *Customer service order postings* is new —
> service work generates vendor receivables (warranty reimbursement), which ties to the
> `Receivables from Vendor` account on the Service tab (batch 1) and `Service Warranty/Credit` (`SWC`,
> batch 6). That is a complete warranty-recovery loop we can now describe end to end.

### FINDING 304 — Delinquency reporting uses a caller-defined aging increment
Producer:   `Report Delinquent Accounts` — accounts with a receivables balance within a min/max past
            due amount, based on days delinquent
Rule (worked example, verbatim intent): "If **30 days delinquent** is entered with an **aging period
            of 7**, the report will show accounts past due in **30-36 days, 37-43 days, and 44 or
            more days** increments."
Evidence:   Report Delinquent Accounts, /articles/15202742454292
Maps to:    NEW — a **fourth** aging presentation, and the only parameterised one

> Four aging models now recorded: collections letters (30-day buckets to 120), credit approval
> (Over 90), vendor bills (120+), and this — an arbitrary increment from an arbitrary start.
> Ours should have **one** aging definition with presentation options, not four schemes.

### FINDING 305 — Collector performance is quota-based
Producer:   `Report Collector Efficiency` — receivables collected **today, yesterday, month-to-date
            and year-to-date** per collector, their **quotas**, and the difference; whole dollars
Schedule:   also runnable as part of **End-of-Month**
Evidence:   Report Collector Efficiency, /articles/15202504443284
Maps to:    completes batch 10 — collectors carry **quotas**, held presumably in `Collector Settings`

### FINDING 306 — Fixed-term revolving produces a projected cash-flow curve
Producer:   `Report Projected Fixed Term Revolving Cash Flow` — projected receipts over
            **30, 60, 90, 180, 270, 360 days** and **after 1 year**; summary only; by district/store
Evidence:   Report Projected Fixed Term Revolving Cash Flow, /articles/15203128896660
Maps to:    NEW

> Only **fixed term** revolving is projectable — open-ended revolving has no determinate schedule,
> consistent with batch 8. This is the treasury view of the in-house credit book and the only
> forward-looking report in the whole Accounting section.

### FINDING 307 — Credit-balance accounts are reported with contact details for outreach
Producer:   `Report Accounts with Credit Balances` — sorts by store, prints store totals and, with
            Regional Processing active, **district totals**
Columns:    Customer Number · Account Name · **Work Phone · Home Phone** · Total Balance ·
            Store (Number and Description) · Store Total
Evidence:   Report Accounts with Credit Balances, /articles/15202503961364
Maps to:    NEW — relates to escheatment/refund obligations

> Phone numbers on a credit-balance report means this is an outreach worklist, not just a control
> report. Unclaimed customer credits are an escheatment exposure; nothing in Accounting describes an
> escheatment process, which is worth flagging as a genuine gap rather than a documentation gap.

### FINDING 308 — `Report 80\20 Analysis` is a merchandising report filed under Accounting
Content:    top sales-generating products — "the products that account for approximately **80% of
            total sales**", by sales dollars or units
Sort rule:  "sorts by either SKU number or vendor model number depending on your setting at
            **`Report Sort By` in the `Inventory Control Settings`**. If you sort by vendor model
            number and **none exists**, the product lists by SKU number **prefixed by an asterisk (*)**."
Evidence:   Report 80\20 Analysis, /articles/15202552433172
Maps to:    **out of scope for Accounting** — third misfiled AVR article

> Third misfiling (after `Mapping Update Audit Report` and `Report Product with Low Stock`). The
> transferable detail is the **asterisk-prefix convention** for a missing vendor model — the same
> family of display sentinels as `D*` for deleted orders (batch 3) and `$$$$$^NN` for unresolved
> accounts (batch 5). STORIS signals missing/derived data with typographic prefixes throughout.

---

## C. Screen and field inventory

**Report Accounts Receivables Aged Trial Balance** — Date · As Of · District · Store ·
Group by Store of Activity · Customer · Customer Class · Secondary Sort · Payment Agreement ·
Report (Detail/Summary/Audit/Total) · Aging · Exclude · Send Output to · Export Path.

**Report Audited Receivables** — Region · Store · Send Output to · Export Path.

**Report Delinquent Accounts** — days delinquent · aging period · min/max past due amount ·
Send Output to · Export Path.

**Report Accounts with Credit Balances** — District · Location · Report Type · Send Output to ·
Export Path. Columns: Customer Number · Account Name · Work Phone · Home Phone · Total Balance ·
Store · Store Total.

**Report Collector Efficiency** — Report Period · Collector · Send Output to · Export Path.

**Report Projected Fixed Term Revolving Cash Flow** — District · Store · Send Output to ·
Export Path · Actions.

**Report Vendor Receivables Trial Balance** — Vendor · Date Code · As Of Date · Report Type ·
Send Output to · Export Path.

**Report Daily Vendor Receivables Activity** — Date Code · Start/End Date · As Of Date ·
Report on Date Type · Include Receipts · Include Adjustments · Include Automatic Postings ·
Send Output to · Export Path.

**Report 80\20 Analysis** — Primary · Secondary · Group · Category · Brand · Vendor ·
Purchase Status · Sort By · Location · Exclude Items Received After · Periods Ago to Report on ·
Report Based on · Summary Only · Send Output to · Export Path.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Open Item Auditing | Accounts Receivable Control Settings | **Collects and retains** open-item and revolving audit data; gates `Report Audited Receivables` entirely |
| Report Sort By | Inventory Control Settings | SKU vs vendor model on the 80/20 report |
| collector quotas | Collector Settings *(implied)* | Basis for collector efficiency |

---

## E. Security permissions catalog (additions)

*(None new. Regional Processing applies to the aged trial balance, audited receivables, delinquent
accounts and credit balances reports.)*

---

## F. State machines and enumerations

**AR trial balance report types** — Detail · Summary · Audit · Total.
**V/R trial balance report types** — Summary · Detail · Audit.

**Vendor receivable activity sources** — cash receipts · adjustments · bill-backs · volume rebates ·
**customer service order postings** · AP bill postings.

**Cash flow projection horizons** — 30 · 60 · 90 · 180 · 270 · 360 days · beyond 1 year.

**Collector efficiency periods** — today · yesterday · month-to-date · year-to-date.

**Missing-data typographic sentinels (running list)** — `*` (no vendor model) · `D*` (deleted order) ·
`$$$$$^NN` (unresolved GL account) · `…` (multiple documents/references) · `P` (paid pending bill).

---

## G. Sequencing rules (additions)

1. The AR aged trial balance runs at **End-of-Month**; long-term revolving appears only for today.
2. `Report Audited Receivables` and `Report Daily Vendor Receivables Activity` both run at
   **Day-Ending** and both are since-last-EOD.
3. `Report Collector Efficiency` also runs at End-of-Month.
4. Open Item Auditing must be on **before** activity occurs for the data to exist.

---

## H. Open questions and gaps

**1. Gated or unreachable** — `Report Audited Receivables` is unavailable unless `Open Item Auditing`
is on; effectively gated by configuration rather than permission.

**2. Documented but ambiguous**
- **Why long-term revolving is today-only** on the aged trial balance. If it is because long-term
  balances are not snapshotted, that is a fundamental data-model fact with wide consequences.
  **Worth a direct question to STORIS.**
- **`Group by Store of Activity`** vs the customer's assigned store (batch 1, Finding 2) — two
  different store attributions on one report, unexplained.
- **`Payment Agreement`** as an aged-trial-balance axis — presumably include/exclude/only; values
  not given.
- **Collector quotas** — reported but never described as a maintained field.
- **Escheatment** — credit balances are reported but no process for unclaimed funds exists anywhere
  in the Accounting section. A real gap, not a documentation gap.
- **`Report Summarized Aging Receivables`** and **`Report Customer's Receivables Activity`** logged,
  not dissected; both appear to be summary variants of reports already covered.

**3. Inferences (not quotable, kept out of section B)**
- Long-term revolving is probably held as a current balance without dated history, which would also
  explain why `Change Details` (batch 16) must conserve the plan balance rather than post a movement.
  Not stated.
- Collector quotas most likely live in `Collector Settings` alongside `Allow Manual Assignment`;
  not stated.
- The six V/R activity sections are probably the complete set of V/R origins, which would make the
  subledger fully enumerable; not stated as exhaustive.

---

## I. Unknown unknowns (additions)

- **Long-term revolving cannot be aged historically.**
- **Customer service order postings** generating vendor receivables (warranty recovery).
- **Collector quotas.**
- **Fixed-term revolving cash-flow projection** as the only forward-looking accounting report.
- **Credit-balance outreach lists** with customer phone numbers.
- **Asterisk prefix** for products lacking a vendor model number.
- **`Group by Store of Activity`** as an alternative store attribution.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Open Item Auditing | AR control setting that collects and retains receivables audit data |
| Audited Receivables | Since-last-EOD receivables activity report, gated by that setting |
| Group by Store of Activity | Store attribution by where activity happened rather than customer assignment |
| Aging period (delinquency) | Caller-defined increment size for delinquency buckets |
| Collector quota | Target against which collector efficiency is measured |
| Fixed term revolving | The projectable subset of revolving plans |
| Bill-back posting | A vendor receivable arising from a chargeback to a vendor |
