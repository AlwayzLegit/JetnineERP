# Run 01 — Accounting — Batch 30: Accounting Views and Reports — Completion

Final batch. Sweeps the remaining AVR articles: summary report variants, the lookup/picker family,
and the last vendor and credit-request views. **This completes the Accounting section: 307/307.**

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 314 | View a Customer's Revolving Statement | /articles/15295211819540 | EXTRACTED |
| 315 | Report Summarized Aging Receivables | /articles/15203234854804 | EXTRACTED |
| 316 | Report Customer's Receivables Activity | /articles/15202552430868 | EXTRACTED |
| 317 | View a Vendor's Current Balances | /articles/15295213233044 | EXTRACTED |
| 318 | View Billed Purchase Orders By Vendor | /articles/15295156256788 | EXTRACTED |
| 319 | View Completed Credit Requests | /articles/15295212289812 | EXTRACTED |
| 320 | Multiple Tax Jurisdiction Selection Window | /articles/15294753427348 | EXTRACTED — picker family |
| 321 | Multiple GL Account / Sub-Account / Cost Center / Source / Batch Selection · Multiple Credit Review Status Code Selection · Multiple Route Selection | /articles/15294752475924, /15294766681492, /15294752482452, /15294752479124, /15294766681364, /15294752249620, /15294767140244 | LOGGED — same picker pattern |
| 322 | GL Account Description Lookup · FR Customer Selection | /articles/15294752101268, /15294752103700 | LOGGED — lookups |
| 323 | Report Analysis of Account Activity · Report Recurring Journal Entries · View an Existing Account Budget | — | LOGGED — variants of reports dissected in batches 18 and 24 |
| 324 | View a Vendor's Historical Balances · View Vendor Open Bills · View Vendor Closed Bills · View a Customer's Historical A/R Items · Historical Deposits - Detail · Receivables Activity Details · Revolving Disputes · View Revolving Dispute Activity · View Revolving Transaction Details · Open Item Receivables History Detail Inquiry | — | LOGGED — DTS leaf/history twins of screens dissected in batches 25 and 28 |

**Accounting Views and Reports now 100/100. Section total: 307/307.**

---

## B. Wiring findings

### FINDING 323 — The revolving statement view exposes the cycle's computed basis
Producer:   `View a Customer's Revolving Statement` (DTS) — statement history per plan
Payload:    Plan · **Statement Month/Year** · **Cycle** · **Start Date · End Date** ·
            **Average Daily Balance** · Current Due · **Statement Messages** · **Payment Agreement**
Evidence:   View a Customer's Revolving Statement, /articles/15295211819540
Maps to:    **completes batch 8, Finding 113**

> The stored statement carries its **cycle window (start/end date)** and the **Average Daily
> Balance** that was used — so the interest basis is retained per statement, not merely computed and
> discarded. That makes historical interest reproducible for revolving even though the *balance*
> is not (batch 27, Finding 301). It also confirms `Average Daily Balance` is a real stored figure,
> which means daily balance history must exist somewhere for the cycle window.
> Statement messages and payment agreement status are retained on the statement too — so what the
> customer was told is recoverable even though the receipt reprint is not (batch 23).

### FINDING 324 — Vendor receivable open items decompose into sub-line detail
Producer:   `View a Vendor's Current Balances` (a.k.a. **Vendor Receivables Open Item Inquiry**)
Behaviour:  summary lines show **original transaction amount** and **current amount due**; selecting
            a line reveals **sub-line items** — "any **adjustments, payments, and on account
            payments/applications**"
Header:     Vendor · **Open Balance** · **Disputed Amount** · Detail Comments
Evidence:   View a Vendor's Current Balances, /articles/15295213233044
Maps to:    completes batch 15 — V/R items carry the same original/current/applications structure
            as customer open items

> `Disputed Amount` surfaced as a header total confirms dispute is a first-class, aggregatable state
> on vendor receivables, matching customer open items (batch 28) and revolving plans (batch 8).

### FINDING 325 — Completed credit requests are retained with full decision timing and letter status
Producer:   `View Completed Credit Requests` — approved or declined requests per customer, "in
            **descending order by credit request completion date/time**"
Grid:       **Request Date · Request Time · Completion Date · Completion Time · Reviewer · Status ·
            Order Number · Letter Printed · Credit Request ID**
Drill-down: `Credit Request Review Screen - Read Only`, from which status letters can be printed
Evidence:   View Completed Credit Requests, /articles/15295212289812
Maps to:    completes batch 9 — this is where the SLA metrics
            (`Average Initial Response Time`, `Average Decision Time`) come from

> Request and completion timestamps are stored to the minute per request, with the reviewer and
> whether a letter was printed. That is a complete decision audit for a regulated process — better
> than most of STORIS's other audit surfaces, and worth matching.

### FINDING 326 — Multi-select fields share one picker pattern and one display sentinel
Producer:   the `Multiple … Selection Window` family (Tax Jurisdiction, GL Account, GL Sub-Account,
            GL Cost Center, GL Source, GL Batch, Credit Review Status Code, Route)
Behaviour:  type an item and press Enter, or Search → `Multiple Selection Lookup` window; items
            accumulate in a grid; Delete clears all, Remove clears one; OK returns and
            "**The current field displays '…' to indicate multiple items**"
Errors:     an invalid entry raises an error and must be re-entered or looked up
Evidence:   Multiple Tax Jurisdiction Selection Window, /articles/15294753427348
Maps to:    **W-055-adjacent** — confirms `…` as the universal multi-value display sentinel

> Eight identical picker windows documented separately. The `…` sentinel is the same one used for
> multiple AP header charge codes (batch 4), multiple documents on a GL posting (batch 24) and
> multiple AR memo references (batch 5). One control, one convention, eight articles — and in a
> rebuild, one component.

### FINDING 327 — Billed-PO selection carries an estimated exchange rate at the PO level
Producer:   `View Billed Purchase Orders By Vendor`, from the Purchase Order field on
            `View a Vendor's Payable Activity`
Payload:    Vendor · **Bill Status** · Country · **Estimated Exchange Rate** · grid with All / None
Evidence:   View Billed Purchase Orders By Vendor, /articles/15295156256788
Maps to:    completes batch 21, Finding 256 — the **estimated** rate is carried per PO,
            the **actual** rate lives in Country Settings

### FINDING 328 — Summarised AR aging is location-first with a past-due percentage
Producer:   `Report Summarized Aging Receivables` — total A/R balance by location or by customer,
            aged in **30-day increments**; summary = by location only, detail adds customers;
            "also displays the **percentage of the customer's past due total balance**"
Companion:  `Report Customer's Receivables Activity` — per customer: **all open orders and open item
            activity plus receivable history** as of a date, with customer name, code, work and home
            phone, store location, **current balance due, total balance due, total deposit liability**
Evidence:   Report Summarized Aging Receivables, /articles/15203234854804 · Report Customer's Receivables Activity, /articles/15202552430868
Maps to:    NEW — and a **fifth** aging presentation (30-day increments, unbounded)

> `Report Customer's Receivables Activity` is the single-customer counterpart of the aged trial
> balance and, notably, spans **open orders** as well as receivables — the only accounting report
> that reaches into the order book. Its three totals (current balance due, total balance due, total
> deposit liability) restate the four-ledger model from batch 28.

---

## C. Screen and field inventory

**View a Customer's Revolving Statement** (DTS) — Customer (+ read-only phones/email) · Plan ·
Statement Month/Year · Cycle · Start Date · End Date · Average Daily Balance · Current Due ·
Statement Messages · Payment Agreement · Grid · General Revolving.

**View a Vendor's Current Balances** — Vendor · Open Balance · Disputed Amount · Detail Comments ·
summary/sub-line grid.

**View Billed Purchase Orders By Vendor** — Vendor · Bill Status · Country ·
Estimated Exchange Rate · grid with All / None.

**View Completed Credit Requests** — Customer · grid (Request Date/Time, Completion Date/Time,
Reviewer, Status, Order Number, Letter Printed, Credit Request ID).

**Report Summarized Aging Receivables** — Send Output to · Export Path (summary/detail versions).

**Report Customer's Receivables Activity** — Date Code · Activity Since Date · Send Output to ·
Export Path.

**Multiple … Selection Window** (eight instances) — entry field · Search → Multiple Selection
Lookup · grid · Delete / Remove / OK / Exit.

---

## D. Control settings catalog (additions)

*(None new.)*

---

## E. Security permissions catalog (additions)

*(None new. Regional Processing applies to the customer-scoped reports and DTS inquiries.)*

---

## F. State machines and enumerations

**Aging presentations across the section (five, all different)** —
collections letters 1-30/31-60/61-90/91-120 · credit approval Current/1-30/31-60/61-90/Over 90 ·
vendor bills Current/1-30/31-60/61-90/120+ · delinquency report caller-defined increments ·
summarised aging unbounded 30-day increments.

**Multi-value display sentinel** — `…`, used for charge codes, documents, references and picker fields.

**Credit request completion record** — request date/time · completion date/time · reviewer ·
status · order number · letter printed · credit request ID.

---

## G. Sequencing rules (additions)

1. Statement records retain the cycle window and the Average Daily Balance used to compute interest.
2. Completed credit requests retain full decision timing and letter-printed state.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none across the whole section. Nothing was blocked by entitlement at
any point in this run.

**2. Documented but ambiguous** — carried forward to the run-level summary. The material ones are:
- the `Cost Used` vs `Cost Change GL` distinction (batch 24)
- whether module posting paths park unresolved accounts the way imports do (batches 18–19)
- why long-term revolving cannot be aged historically (batch 27)
- what `Cashed` means on a financing transaction (batch 29)
- the four opt-in audit switches and their live state (batches 10, 24, 27)
- five incompatible aging presentations
- `Advanced` vs `Extended Receivables` module gating (batches 7, 8, 14)

**3. Inferences** — carried forward; none new in this batch.

---

## I. Unknown unknowns (additions)

- **Average Daily Balance stored per statement**, implying retained daily balance history.
- **Statement messages retained on the statement record.**
- **Vendor receivable sub-line decomposition.**
- **Estimated exchange rate carried per purchase order.**
- **A single accounting report spanning open orders and receivables.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Vendor Receivables Open Item Inquiry | Alias of `View a Vendor's Current Balances` |
| Multiple Selection Lookup | The shared search window behind every multi-select field |
| `…` (field display) | Sentinel indicating multiple values selected |
| Cycle (statement) | The statement's window, stored with its start and end dates |
| Letter Printed | Retained flag on a completed credit request |
