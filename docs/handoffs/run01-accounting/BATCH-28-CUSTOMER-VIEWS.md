# Run 01 — Accounting — Batch 28: Customer Receivables Views (the DTS family)

12 articles. Nearly all are DTS inquiries. Two carry real wiring: `View Revolving General Info Tab`
(the definitive plan-state field list) and `View a Customer's Current Balance Details` (which
reveals a **Day-Ending-scoped definition of "open"**).

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 291 | View a Customer's Account Balance | /articles/15295211963412 | EXTRACTED — DTS container |
| 292 | View a Customer's Account Summary | /articles/15295155560852 | EXTRACTED |
| 293 | **View a Customer's Current Balance Details** | /articles/15295211819028 | EXTRACTED |
| 294 | Open Item Receivables Inquiry | /articles/15294766047124 | EXTRACTED — thin |
| 295 | View a Customer's Activity for a Collector | /articles/15295155562260 | EXTRACTED — DTS container |
| 296 | View a Customer's Current Revolving Activity | /articles/15295155746964 | EXTRACTED |
| 297 | View a Customer's Revolving Plan History | /articles/15295155751444 | EXTRACTED |
| 298 | View a Customer's Revolving Promotional Terms | /articles/15295211821204 | EXTRACTED |
| 299 | **View Revolving General Info Tab** | /articles/15294751971732 | EXTRACTED |
| 300 | View a Customer's Historical A/R Items · Historical Deposits - Detail · Receivables Activity Details · Revolving Disputes · Revolving Statement | /articles/15295155746836, /15294751487636, /15294751787028, /15295211828500, /15295211819540 | LOGGED — DTS siblings |
| 301 | Open Item Receivables History Detail Inquiry | /articles/15294751625748 | LOGGED |
| 302 | View Revolving Dispute Activity · View Revolving Transaction Details | /articles/15295156878996, /15295156879252 | LOGGED |

---

## B. Wiring findings

### FINDING 309 — "Open" in AR means non-zero **or** zeroed since the last Day Ending
Producer:   `View a Customer's Current Balance Details`
Invariant:  the inquiry displays items "with a **non-zero balance (open)**" **and** "items whose
            balances became **zero after the last Day Ending** display"
Header:     Earliest Date · Latest Date · Credit Limit · Available Credit
Evidence:   View a Customer's Current Balance Details, /articles/15295211819028
Maps to:    **W-064-adjacent** — a working definition of "open item" that shifts daily

> An item paid to zero today is still "open" until Day Ending runs. That is a deliberate
> same-day-visibility choice, and it means **the open-item set is not a pure function of balance** —
> it depends on when EOD last ran. Any reconciliation between our system and STORIS taken mid-day
> will differ by exactly the items zeroed since the last EOD.

### FINDING 310 — The revolving plan state record has 30+ fields, and this is the definitive list
Producer:   `View Revolving General Info Tab` — read-only; maintenance is `Enter a Customer's
            Revolving Terms & Conditions`
Plan state: Plan · Current Due · **Standard MMP** · Total Balance · **Highest Balance** ·
            **Last Cycled** · Insurance · Last Payment · Last Charge · **Activated/Pending** ·
            **Closed** · **Reason** · Fixed Term · % of Balance · Remarks
Customer:   Store Location · Due Day · **Prepay Amount**
**Year to Date:** Finance Charge · Insurance · Late Fees · Fees
Credit:     Credit Limit · Receivables · Potential Receivables · Available Credit
Other:      Co-signer · Co-applicant (customer ID and name shown beneath the customer name) ·
            Comments · **Plan Settings** · **Payment Agreement**
Evidence:   View Revolving General Info Tab, /articles/15294751971732
Maps to:    **completes the revolving data model**

> Three fields settle earlier open questions:
> - **`Standard MMP`** appears here as a stored field — confirming SMP and MMP are the same value
>   under two names (batch 8, section H).
> - **`Highest Balance`** sits beside Total Balance, confirming it is *high credit* (asked in batches
>   8 and 15).
> - **`Last Cycled`** is stored per plan, which with `Due Day` confirms the staggered per-customer
>   cycle from batch 14.
>
> The **Year to Date** block (finance charge, insurance, late fees, fees) is a per-plan YTD
> accumulator we had not seen — and it is a calendar-year figure on a fiscal-year system, the same
> mismatch found on 1099 reporting (batch 25).

### FINDING 311 — Promotional terms are tracked with waived amounts and a residual balance
Producer:   `View a Customer's Revolving Promotional Terms`
Payload:    Plan · Balance · **Promotional Interest** (Percentage Rate · Expires On · Days ·
            **Balance** · **Waived**) · **No Payments** (Until · Days · Balance)
Evidence:   View a Customer's Revolving Promotional Terms, /articles/15295211821204
Maps to:    completes batch 16, Finding 211 (`Chargeback Waived Interest`)

> **`Waived`** is a stored, per-promotion amount — so waived interest is tracked as a balance, not
> merely forgone. That is exactly what makes `Chargeback Waived Interest` possible on a plan
> transfer and what `Charge Back Waived Interest on MMP Balances, Days Overdue` (batch 14) acts on.
> Each promotion also carries its **own balance**, confirming batch 16's finding that promotional
> clocks are per-transaction rather than per-plan.

### FINDING 312 — Revolving history is a closed-plan store with per-transaction detail
Producer:   `View a Customer's Revolving Plan History` — plan activity "**closed and moved to
            history**"; details include **posted date / transaction date, type of transaction,
            reference, amount, and balance**
Counterpart: `View a Customer's Current Revolving Activity` — "**current (not moved to history)**"
Evidence:   View a Customer's Revolving Plan History, /articles/15295155751444
Maps to:    confirms the active/history split seen for installment (`IR.ACTIVE`/`IR.HISTORY`, batch 11)

> Both credit subsystems use the same current/history bifurcation. Any query spanning the boundary
> must union two stores — which is presumably why several reports are scoped to one or the other and
> why the aged trial balance cannot age long-term revolving historically (batch 27, Finding 301).

### FINDING 313 — Every receivables DTS carries a shared General tab, and the containers compose the same leaf views
Shared tab: "**This tab is included in every receivables DTS screen**" — `General Revolving` on
            revolving screens; `General` (View a Customer's General Information) on open-item screens
Container 1 — **View a Customer's Account Balance**: Open Items Summary · Accounts Receivable ·
            Deposits · Deposits History · A/R History
Container 2 — **View a Customer's Activity for a Collector**: General Info · Deposits ·
            Deposits History · **Customer History** (purchases) · Open Items · Accounts Receivable ·
            A/R History · **Open Orders** · **Purchases** · **Service** (open service orders)
Common header: on revolving DTSs, selecting the customer populates read-only Cell Phone, Home Phone,
            Work Phone, Ext and Email Address
Evidence:   View a Customer's Account Balance, /articles/15295211963412 · View a Customer's Activity for a Collector, /articles/15295155562260
Maps to:    NEW — the composition model behind the whole inquiry family

> The DTS framework is **composition over leaf inquiries**: a handful of real screens
> (deposits, deposit history, open items, A/R history, purchases, open orders, service) assembled
> into role-specific containers. That is a good pattern and directly reusable — build the leaves once,
> compose per role. Note the collector's container reaches into **orders and service**, i.e. outside
> Accounting entirely.

### FINDING 314 — The account summary splits the balance three ways and names a fourth ledger
Producer:   `View a Customer's Account Summary`
Payload:    Credit Limit · **Credit History** · Collector · Amount Due (Current · 1-30 · 31-60 ·
            61-90 · **120+**) · Total Due · **Account Balances: Revolving · Installment** ·
            **Total Due** ("Complete sum of all current due open item receivables") ·
            **Total AR** ("The **long term and short term** AR displays here") ·
            **Liability: Deposits**
Evidence:   View a Customer's Account Summary, /articles/15295155560852
Maps to:    **confirms the four-ledger model**

> This single screen shows all four customer money positions at once — **open item, revolving,
> installment, deposit liability** — and states plainly that Total AR spans long term and short term.
> It is the best one-screen statement of the receivables data model in the documentation, and it
> uses the same `120+` bucket as vendor bills (batch 25) rather than the collections letter's `91-120`.

### FINDING 315 — Open-item drill-down exposes dispute state conditionally
Producer:   `Open Item Receivables Inquiry`, from `View a Customer's Current Balance Details`
Header:     Reference · Due Date · **Dispute — "displays only if transaction is in dispute"** · Amount
Evidence:   Open Item Receivables Inquiry, /articles/15294766047124
Maps to:    confirms dispute state exists on open items as well as on revolving plans (batch 8) and
            vendor receivables (batch 15)

> Dispute is now confirmed as a cross-cutting state on **three** subledgers: customer open items,
> revolving plans, and vendor receivables. Worth modelling once as a shared concept rather than
> three times.

---

## C. Screen and field inventory

**View a Customer's Account Balance** (DTS container) — Customer Code; tabs Open Items Summary ·
Accounts Receivable · Deposits · Deposits History · A/R History.

**View a Customer's Account Summary** — Credit Limit · Credit History · Collector ·
Amount Due (Current, 1-30, 31-60, 61-90, 120+) · Total Due · Account Balances (Revolving,
Installment) · Total Due · Total AR · Liability (Deposits) · General page.

**View a Customer's Current Balance Details** — Customer Code · Earliest Date · Latest Date ·
Credit Limit · Available Credit · Grid · General page.

**Open Item Receivables Inquiry** — Reference · Due Date · Dispute (conditional) · Amount · Grid.

**View a Customer's Activity for a Collector** (DTS container) — Customer Code; ten tabs
(see Finding 313).

**View a Customer's Current Revolving Activity** (DTS) — Customer (+ read-only phones/email) ·
Plan · Grid · General Revolving.

**View a Customer's Revolving Plan History** (DTS) — Customer · Plan · Grid · General Revolving.
Grid: posted/transaction date · transaction type · reference · amount · balance.

**View a Customer's Revolving Promotional Terms** (DTS) — Customer · Plan · Balance ·
Promotional Interest (Percentage Rate, Expires On, Days, Balance, Waived) ·
No Payments (Until, Days, Balance) · Grid · General Revolving.

**View Revolving General Info Tab** — full field list at Finding 310.

---

## D. Control settings catalog (additions)

*(None new. `Dynamic Tab Settings (DTS Setup)` governs every screen in this batch.)*

---

## E. Security permissions catalog (additions)

*(None new. Regional Processing applies to every inquiry in this batch.)*

---

## F. State machines and enumerations

**Customer money positions (four)** — open item · revolving · installment · deposit liability.

**Revolving plan lifecycle fields** — Activated/Pending · Closed · Reason · Last Cycled.

**Promotional term components** — Percentage Rate · Expires On · Days · Balance · **Waived**;
and No Payments (Until · Days · Balance).

**Per-plan YTD accumulators** — Finance Charge · Insurance · Late Fees · Fees.

**"Open" open-item definition** — non-zero balance, **or** zeroed since the last Day Ending.

**Current/history bifurcation** — revolving and installment both split active from history.

---

## G. Sequencing rules (additions)

1. An item paid to zero remains visible as open until the next Day Ending.
2. Closed revolving plans move to history and leave the current activity view.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none.

**2. Documented but ambiguous**
- **`Credit History`** on the account summary — a field name shared with `Credit History Codes`
  (an unread AVR article); relationship unstated.
- **`Prepay Amount`** on the revolving plan — presumably accumulated prepayments awaiting
  application; not stated.
- **`Plan Settings`** as a field on the general info tab — likely a link to the plan definition.
- **Year-to-date basis** — calendar or fiscal is not stated, though 1099's calendar-year precedent
  suggests calendar.
- **DTS caveat applies to all of these**: the documented tab sets are shipped defaults.
- **`Credit History Codes`**, **`FR Cross Reference Inquiry`**, **`FR Customer Selection`** and the
  multi-select picker windows remain unread; they are lookup/picker utilities.

**3. Inferences (not quotable, kept out of section B)**
- `Standard MMP` on the plan record and `SMP` in the revolving overview are the same field; the
  documentation simply uses two names.
- `Highest Balance` is high credit — the highest balance ever carried — a standard consumer-credit
  field and a Metro 2 reportable; not stated.
- The 120+ vs 91-120 bucket discrepancy across screens is presentation, not storage; unverified.

---

## I. Unknown unknowns (additions)

- **Per-plan year-to-date accumulators** for finance charge, insurance, late fees and fees.
- **Waived promotional interest tracked as a balance.**
- **Per-promotion balances** within one plan.
- **`Prepay Amount`** on a revolving plan.
- **Day-Ending-scoped definition of an open item.**
- **DTS containers reaching into orders and service** from an accounting inquiry.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Standard MMP | The stored per-plan payment amount (= SMP in the overview) |
| Highest Balance | High credit — the peak balance carried on a plan |
| Last Cycled | Per-plan date of the most recent cycle |
| Prepay Amount | Accumulated prepayment held against a revolving plan |
| Waived (promotional) | Interest forgone under a promotion, retained as a chargeable-back amount |
| General Revolving tab | The shared tab present on every receivables DTS screen |
| Open item (working definition) | Non-zero balance, or zeroed since the last Day Ending |
