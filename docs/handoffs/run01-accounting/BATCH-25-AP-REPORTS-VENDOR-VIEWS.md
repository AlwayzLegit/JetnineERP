# Run 01 — Accounting — Batch 25: AP Reports and Vendor Views

11 articles. Read for what each reconciles against. Two structural findings: the **DTS**
(Dynamic Tab Settings) inquiry framework, and a **payment method code set** that finally enumerates
STORIS's disbursement rails.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 259 | Report Payables Aged Trial Balance | /articles/15203112476052 | EXTRACTED |
| 260 | Report Payables Activity | /articles/15203128570388 | EXTRACTED |
| 261 | Report Payables Disbursement | /articles/15203112881940 | EXTRACTED |
| 262 | **Report Cash Disbursements** | /articles/15202504435348 | EXTRACTED |
| 263 | Report 1099 and Payables History | /articles/15202503976468 | EXTRACTED |
| 264 | Report Payable Approvals On Hold | /articles/15203128186260 | EXTRACTED — thin |
| 265 | Report Check Exceptions | /articles/15202504422804 | EXTRACTED — thin |
| 266 | Report Check Transactions | /articles/15202553297684 | EXTRACTED |
| 267 | **View a Vendor's Payable Activity** | /articles/15295211964692 | EXTRACTED |
| 268 | View Vendor Activity | /articles/15295157054612 | EXTRACTED |
| 269 | View Vendor Bills | /articles/15295157046420 | EXTRACTED |
| 270 | View Vendor Open Bills / View Vendor Closed Bills | /articles/15295157047444, /15295213072788 | LOGGED — DTS sub-tabs |

Newly discovered, queued: **`Dynamic Tab Settings (DTS Setup)`** — a user-configurable inquiry
framework, referenced by several views; `Buyer` as an AP reporting dimension; `Merchant` as a check
transaction dimension.

---

## B. Wiring findings

### FINDING 283 — Six payment method codes enumerate STORIS's disbursement rails
Producer:   `Report Cash Disbursements` — Payment Method column values:
            **`CHK`** Checks · **`MAN`** Manual Checks · **`CCD`** Credit Cards ·
            **`DCD`** Debit Cards · **`OLB`** Online Banking · **`CSH`** Cash
Also:       "The **Type** column displays a **4-character description of the AP bill type**"
            (the `MDSI`/`EXPI`/… codes from batch 6) · "The **Reference** column displays the check
            number or the reference associated with the **manual payment**" — the control accepts up
            to 25 characters but **only 15 print** · "If the letter **'P'** appears in the column next
            to the Type column, it is an indicator that the AP bill is a **Pending Bill that has been
            paid**"
Scope:      by check date **or fiscal period**; `Print GL Recap` available
Evidence:   Report Cash Disbursements, /articles/15202504435348
Maps to:    **W-031 — CONFIRMED for disbursement**

> This closes the disbursement side of `W-031`. Note `OLB` (Online Banking) is a seventh rail we had
> not seen — distinct from EFT and virtual card — and `MAN` (manual checks) is the alternate payment
> method from batch 4. Also note **paid pending bills** are flagged `P`, which is the reporting
> counterpart of `Recorded Not Received` (batch 1) and `Allow Payment of Pending Bills` (batch 14).

### FINDING 284 — AP aging is a configurable method with several selection axes
Producer:   `Report Payables Aged Trial Balance` — balances **as of a specified date**
Axes:       Company · Date Code · As Of Date · **Aging Type** · Past Due Only · Summary Only ·
            Vendor · **Vendor Class** · **Aging Days** · **Buyer** · Country · Sort by Country ·
            Sort by Invoice · **Debit Balances Only** · Hold Code
Related:    `Bill Aging Days` / `Method` in `Payables Control Settings` → Advanced (batch 6);
            pending bills excluded because "the liability … has not yet been incurred" (batch 4)
Evidence:   Report Payables Aged Trial Balance, /articles/15203112476052
Maps to:    NEW

> `Buyer` appears as an AP reporting dimension for the first time — a merchandising role attached to
> bills or vendors. `Debit Balances Only` surfaces vendors we owe negative amounts, i.e. the
> negative-payment condition that blocks check runs (batch 4, Finding 58).

### FINDING 285 — Payables activity is the AP-side daily/period tie-out and runs at End-of-Day
Producer:   `Report Payables Activity` — two modes: **since the last End-of-Day cycle** (including
            bills created and/or adjusted since), or a **date range** (which "shows **ALL** activity,
            bills whether open or closed")
Options:    Bill Activity · Type · **EDI Only** · Status to Include · Pending Bills · Hold Code ·
            Report By · Subtotal · Vendor · Remit To · **Payments** · **Print GL Detail** ·
            **Print GL Recap**
Layout:     primary sort Company, each on a new page; GL recap prints after all companies
Invariant:  "This report also runs as part of the **End-of-Day** process."
Cross-ref:  batch 4 named it as the way to view converted pending bills ("Activity Since Last End of Day")
Evidence:   Report Payables Activity, /articles/15203128570388
Maps to:    **W-011 / W-012 — the reconciliation surface**

> This is the AP analogue of `Report Daily Receipts Register` (batch 2): a daily, incremental,
> GL-recapped activity report generated at End-of-Day. Together they are the two sides of the daily
> control pack, and both are incremental-since-last-EOD — so both are unrepeatable after the fact.

### FINDING 286 — The check register is a report, and it has two mutually exclusive shapes
Producer:   `Report Payables Disbursement` — "report on vendor payments and **print or re-print a
            check register**"; also reports **pending check runs**; runs at End-of-Day and on demand
`Report by Check Run` **checked**: each check with its AP bills broken out; breaks only on check
            totals; "where multiple purchase orders exist for a single AP bill, the purchase order
            numbers keys list **separately on subsequent lines**"; multiple batches print
            consecutively with a grand total
`Report by Check Run` **unchecked**: multiple payment methods selectable; **excludes voided checks**;
            sorts and breaks on payment method; multiple banks; the End-of-Day version lists all
            banks, page-breaking and totalling per bank
Sorting:    single run → ascending check number; multiple runs → bank, vendor, payment method.
            Collation depends on `Sort Detail Lines on Stub by`, `Print Checks by Descending Amount`
            and `Print Refunds at the End of Check Run` in `Payables Control Settings`
Refunds:    "For refunds, the report prints the **remit-to name (that is, the customer name)** instead
            of the vendor name"
Evidence:   Report Payables Disbursement, /articles/15203112881940
Maps to:    **W-054 — the check register is regenerated, not archived**

> Same pattern as receipt reprints (batch 23): the register is **re-printed** from live data, and the
> unchecked version **excludes voided checks** — so a re-printed register will not match the original
> if anything was voided since. Another place where "archived" means "regenerable", not "preserved".

### FINDING 287 — DTS: several vendor and customer inquiries are user-configurable, undeleteable templates
Invariant (stated on two articles): "This routine is a **STORIS standard DTS inquiry**. You can modify
            its contents via the **`Dynamic Tab Settings (DTS Setup)`** routine, but **you cannot
            delete it**. Since DTSs are **user-defined and changeable**, the descriptions in this
            topic **may not match** the DTS inquiry you see on your screen."
Instances:  `View a Vendor's Payable Activity` (tabs Summary, Open Bills, Closed Bills) ·
            `View Vendor Activity` (Header, Summary, Open, Closed — which embeds `View Vendor Bills`,
            `View Vendor Open Bills`, `View Vendor Closed Bills`)
Evidence:   View a Vendor's Payable Activity, /articles/15295211964692 · View Vendor Activity, /articles/15295157054612
Maps to:    NEW — **a documentation-reliability finding as much as a wiring one**

> Any DTS inquiry's documented field list is **the shipped default, not the deployed reality**.
> For parity work this means: do not treat DTS screens as specifications, and expect LA Mattress's
> actual screens to differ. It also means there is a whole configurable-inquiry framework
> (`DTS Setup`) that a rebuild either reproduces or deliberately replaces with saved views.
> Worth asking what DTS customisations exist before assuming any inquiry parity.

### FINDING 288 — The special `RFND` vendor changes inquiry behaviour
Invariant:  "If you select the special **`RFND`** vendor, **some fields are inactive and some columns
            in the grid function differently**."
Evidence:   View a Vendor's Payable Activity, /articles/15295211964692
Maps to:    completes batch 6, Finding 82 (`RFND` = AP bill type 09, Customer Refund) and batch 20's
            exclusion of `RFND` from virtual card batches

> `RFND` is a reserved pseudo-vendor carrying all customer refunds, and it is special-cased in
> reporting, in payment selection, and in virtual card processing. Our model should make customer
> refunds a first-class payee type rather than a magic vendor code.

### FINDING 289 — Vendor aging uses a different final bucket from customer aging
`View Vendor Bills` aging: **Current · 1-30 · 31-60 · 61-90 · 120+**
Also shown: Total on Hold · Total Pending · Total Open · **Aging Method** ·
            Total Dollars **Current YTD** · **Previous Year** · Exchange Rate · Currency Type
Evidence:   View Vendor Bills, /articles/15295157046420
Maps to:    **W-069-adjacent** — a third aging bucket set

> Three aging presentations now recorded: collections letters **1-30/31-60/61-90/91-120** (batch 10),
> credit approval **Current/1-30/31-60/61-90/Over 90** (batch 17), and vendor bills
> **Current/1-30/31-60/61-90/120+** — note the gap between 91 and 119 in the last one, which is
> almost certainly a documentation slip but would be a real defect if reproduced literally.

### FINDING 290 — Check transaction reporting is merchant-scoped, not just location-scoped
Producer:   `Report Check Transactions` — **Report By Location or Merchant** ·
            Transactions to Use · Store Location · **Merchant** · **Include Invalid Transactions** ·
            **Check Transaction Type** · Report Type · four sort levels
Scope:      subject to Regional Processing
Evidence:   Report Check Transactions, /articles/15202553297684
Maps to:    NEW — relates to the ECA check rail (batch 21)

> **Merchant** as a reporting dimension implies check authorisation is done per merchant account,
> parallel to card processing. `Include Invalid Transactions` implies failed authorisations are
> retained. Neither concept appears elsewhere in Accounting.

### FINDING 291 — 1099 reporting is vendor-class-driven and calendar-year scoped
Producer:   `Report 1099 and Payables History` — "report **calendar year** payables totals to vendors.
            The report sorts, breaks, and totals by **vendor class**."
Options:    Vendor · Vendor Class · **1099 Vendors Only** · Payables Year · Print Remit-To
Evidence:   Report 1099 and Payables History, /articles/15202503976468
Maps to:    NEW — **calendar year, not fiscal year**

> A 1099 flag exists on vendors (implied by `1099 Vendors Only`), and totals are **calendar-year**
> while everything else in Accounting is fiscal-year. That is a second time basis in the same module.

---

## C. Screen and field inventory

**Report Payables Aged Trial Balance** — Company · Date Code · As Of Date · Aging Type ·
Past Due Only · Summary Only · Vendor · Vendor Class · Aging Days · Buyer · Country ·
Sort by Country · Sort by Invoice · Debit Balances Only · Hold Code · Send Output to · Export Path.

**Report Payables Activity** — Date of Activity · Since Last End of Day · Code · Start · End ·
Bill Activity · Type · EDI Only · Status to Include · Pending Bills · Hold Code · Company ·
Report By · Subtotal · Vendor · Remit To · Payments · Print GL Detail · Print GL Recap ·
Send Report to · Send Output to · Export Path.

**Report Payables Disbursement** — Report by Check Run · Print in Foreign Currency ·
Manual Payments; then either {Bank, Date Code, Start/End Date, Vendor, Vendors,
Payment Methods to Include, Check Run} or {Bank, Date Code,
Detail for Checks Requiring Multiple Stubs, Check Date, Reference} · Send Output to · Export Path.

**Report Cash Disbursements** — Company · Payment Date · Fiscal Year · Fiscal Period ·
Payment Methods to Include · Sort By · Print GL Recap · Send Output to · Export Path.

**Report 1099 and Payables History** — Vendor · Vendor Class · 1099 Vendors Only · Payables Year ·
Print Remit-To · Send Output to · Export Path.

**Report Payable Approvals On Hold** — Date Code · Start/End Invoice Date · Invoice Number ·
Vendor · Primary/Secondary/Tertiary Sort · Include Bill Types · Send Output to · Export Path.

**Report Check Exceptions** — Date Code · Start/End Date · Send Output to · Export Path.

**Report Check Transactions** — Report By Location or Merchant · Transactions to Use · Date Code ·
Start/End Date · Store Location · Merchant · Include Invalid Transactions · Check Transaction Type ·
Report Type · Sort and Subtotal By · four sort levels · Send Output to · Export Path.

**View a Vendor's Payable Activity** (DTS) — Vendor; *Summary:* Aging Method · Age · Amount ·
Total on Hold · Total Pending · Calendar YTD Dollars · Previous Year Dollars · Exchange Rate;
*Open Bills:* Status to Include · Hold Code · Company · Bill Type · Remit To · Purchase Order ·
Invoice/Customer · Filter; *Closed Bills:* Company · Bill Type · Remit To · Invoice/Customer ·
Purchase Order · Starting/Ending Date · Filter.

**View Vendor Activity** (DTS) — Header (Vendor, Exchange Rate, Currency Type) ·
Summary / Open / Closed embedding the three View Vendor … Bills screens.

**View Vendor Bills** — Vendor · Exchange Rate · Currency Type · Aging (Current, 1-30, 31-60,
61-90, 120+) · Total on Hold · Total Pending · Total Open · Aging Method ·
Total Dollars Current YTD · Previous Year · Actions.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Dynamic Tab Settings (DTS Setup) | own routine | Contents of DTS inquiries; shipped defaults are modifiable but undeleteable |
| Aging Type / Aging Days | report run-time + `Bill Aging Days`/`Method` in Payables Control Settings | AP aging basis |

---

## E. Security permissions catalog (additions)

*(None new. Regional Processing applies to `Report Check Transactions` and `View Vendor Activity`.)*

---

## F. State machines and enumerations

**Payment method codes** — `CHK` Checks · `MAN` Manual Checks · `CCD` Credit Cards ·
`DCD` Debit Cards · `OLB` Online Banking · `CSH` Cash.

**Paid pending bill indicator** — `P` beside the Type column.

**Vendor aging buckets** — Current · 1-30 · 31-60 · 61-90 · 120+.

**Time bases in Accounting** — fiscal year/period (most reporting) · **calendar year** (1099) ·
weekly calendar (GL drill-down, batch 24).

**Reserved vendor** — `RFND`, special-cased in inquiries, payment selection and virtual card batches.

---

## G. Sequencing rules (additions)

1. `Report Payables Activity` and `Report Payables Disbursement` both run at End-of-Day.
2. Since-last-EOD modes are incremental and cannot be reproduced later.
3. The check register excludes voided checks in its payment-method version.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none.

**2. Documented but ambiguous**
- **DTS inquiries are not specifications.** Their documented contents are shipped defaults.
  **Before any inquiry parity work, get the actual DTS configuration from the live system.**
- **`OLB` (Online Banking)** — a payment method with no routine documented anywhere in Payables.
- **`Buyer`** on the AP aged trial balance — a dimension not defined in Accounting.
- **`Merchant`** and **`Check Transaction Type`** on check transaction reporting — undefined.
- **Vendor aging `120+`** with no `91-119` bucket — probably a doc slip; verify.
- **`Aging Type` vs `Aging Method`** — two names, possibly two things.
- **1099 vendor flag** — implied, never located.
- **`Detail for Checks Requiring Multiple Stubs`** — undescribed.

**3. Inferences (not quotable, kept out of section B)**
- `OLB` is probably the "On-Line payments" method seen on the payment register (batch 20); not stated.
- The vendor aging `120+` is almost certainly meant to be `91-120` or `120+` following a `91-120`;
  the doc lists four buckets where five are implied.
- `Buyer` is presumably the merchandising buyer on the PO, carried onto the bill; not stated.

---

## I. Unknown unknowns (additions)

- **DTS — Dynamic Tab Settings** — a user-configurable inquiry framework.
- **`OLB` Online Banking** as a disbursement rail.
- **Merchant-scoped check transaction reporting** with invalid-transaction retention.
- **Buyer** as an AP reporting dimension.
- **1099 vendor flagging** on a calendar-year basis.
- **Multiple purchase orders per AP bill** (surfaced in the check register layout).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| DTS — Dynamic Tab Settings | Configurable inquiry framework; shipped screens are editable but undeleteable |
| `CHK` / `MAN` / `CCD` / `DCD` / `OLB` / `CSH` | The six AP payment method codes |
| `RFND` vendor | Reserved pseudo-vendor carrying customer refunds |
| Paid pending bill (`P`) | A pending bill that has been paid before receipt |
| Check register | Regenerated report of a check run, excluding voids in one of its two forms |
| Buyer | Undefined AP/merchandising dimension on the aged trial balance |
| Merchant | Check-authorisation account dimension |
