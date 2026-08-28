# Run 01 — Accounting — Consolidated Return

**Section:** STORIS ERP → Accounting (General Ledger, Payables, Receivables, Accounting Views and
Reports, plus the uncategorised top level).
**Coverage:** **307 of 307 articles**, plus ~45 out-of-section articles reached by link
(System Administration control settings, Overviews & References, Sales Processing screens).
**Findings:** 328 wiring findings across 30 batches.
**Batches:** `BATCH-01` … `BATCH-30`, each a self-contained A–J return. This file is the run-level
roll-up; the batch files carry the evidence and the per-article detail.

---

## A. Coverage log

| Subsection | Articles | Covered | Batches |
|---|---|---|---|
| Accounting (top level, uncategorised) | 10 | 10 | 19 |
| General Ledger | 10 | 10 | 1, 18 |
| Payables | 63 | 63 | 2, 4, 6, 20, 21, 22 |
| Receivables | 124 | 124 | 3, 5, 7–17, 23 |
| Accounting Views and Reports | 100 | 100 | 24–30 |
| **Total** | **307** | **307** | |

Out-of-section articles pulled in by link (rule 2), the significant ones:
`General Ledger Assigned Account Settings` · `General Ledger Control Settings` ·
`Payables Control Settings` · `Accounts Receivable Control Settings` ·
`Account Statement Cycling Control Settings` · `Revolving Receivables Control Settings` ·
`Revolving Payment Plan Settings` · `Installment Receivables Control Settings` ·
`Installment Payment Plan Settings` · `Credit Application Control Settings` · `Alert Code Settings` ·
`Revolving/Installment Fees` · `Bank Reconciliation Overview` · `Reconcile Cash Drawer` ·
`Enter a Customer Payment/Refund/Gift Certificate` · `AP Bill Types` ·
`Accounts Payable Processing Overview` · `Pending AP Bills Overview` · `Credit Hold Codes List (AR)` ·
`Revolving Receivables Overview` · `Payment Agreements Overview`.

**Nothing was gated or unreachable.** Two articles in the section are misfiled and belong to other
runs: `Mapping Update Audit Report` (delivery manifests — run 4) and `Report Product with Low Stock`
/ `Report 80\20 Analysis` (inventory and merchandising — already-dissected sections).

---

## B. Wiring findings — contract adjudication

### Money and the ledger

| Contract | Verdict | Basis |
|---|---|---|
| `W-011` PO receipt increases inventory value and creates a received-not-invoiced accrual | **CONFIRMED** | `Received Not Recorded` account; receipt-keyed billing (B1 F10, B4 F53) |
| `W-012` AP voucher match clears the accrual; difference goes to a purchase price variance | **CONFIRMED on the match, CONTRADICTED on the variance** | The AP bill *reverses* the accrual; there is **no PPV account** — the operator restates cost until the bill proves to zero (B4 F50–51) |
| `W-013` Invoicing relieves inventory and posts COGS at the same cost | **CONFIRMED on timing; "same cost" NOT STATED** | `Inventory COS` debits at order completion (B1 F13) |
| `W-033` Deposits are a liability until delivery, released at invoice | **CONFIRMED on the liability, NOT DOCUMENTED on the release** | `Deposit Liability`; every documented exit is manual (B1 F12, B3 F39) |
| `W-034` Drawer close → daily receipts register → deposit → bank reconciliation | **CONFIRMED, then CONTRADICTED in shape** | The chain exists (EOD writes a Daily Deposit record per bank × location × deposit type) but there are **two independent reconciliations** that never join, and an **Unassigned Transactions** state where receipts belong to no drawer (B2 F22, B3 F33–35) |
| `W-036` Every subledger type maps to an explicit debit/credit pair; nothing falls through | **SPLITS BY MODE** — see the headline finding below | STORIS Accounting parks unresolved postings; **TPA posts them to a default account** (B1 F1, B5 F65, B18 F227, B19 F235) |
| `W-037` Every posting is gated by period/date-code state | **CONFIRMED, with two documented breaches** | Period close blocks posting and cascades; but **voids may post in a "sales overlap period"**, and the GL posts on **transaction date, not invoice date** (B1 F4, B4 F60, B6 F79) |
| `W-031` Every tender lands in exactly one settlement path | **CONTRADICTED** | Bank side and application side are two different problems; the daily register omits revolving and includes unfunded 3rd-party financing; six disbursement rails (B2 F19, B5 F68, B25 F283) |
| `W-032` Financing: application → approval → attach → authorize → capture → funding batch → reconciliation | **CONFIRMED end to end** | Closed in batch 29: deposits post to FR immediately, the financed amount at invoice, resolved within open/closed funding batches (B9 F129, B29 F316–317) |
| `W-030` Card auth at order, capture at fulfilment, incremental auth on increase | **CONFIRMED via hold code C5; CONTRADICTED on visibility** | C5 is exactly auth-at-order/capture-later; but pre-authorised deposits are invisible to the payment screen and card reversals never reach the processor (B9 F128, B5 F72, B6 F91) |
| `W-035` A return reverses every account and bucket the sale touched | **CONFIRMED for AP and AR; CONTRADICTED for financed partial fulfilment** | Voids reverse GL; NSF/misapply reinstates closed contracts; **but contract cancellation by return requires one contract to one invoice** (B4 F60, B5 F71, B7 F102) |

### Inventory and supply

| Contract | Verdict | Basis |
|---|---|---|
| `W-010` Every quantity-bucket change writes a reconstructable ledger row | **CONFIRMED with a caveat** | `Report Reconciliation of Inventory to GL Values` exists — but its data is collected **only if `Inventory-G/L Reconciliation Audit` is on** (B24 F276) |
| `W-044` RTV → inventory relief → vendor debit memo → applied against payment | **CONFIRMED end to end** | `Returned Not Recorded` → Vendor Receivable → **Convert to Payable** → `RTVC` bill type (B1 F11, B15 F202, B6 F82) |
| `W-014`–`W-017`, `W-041`, `W-042` | **NOT DOCUMENTED IN THIS SECTION** | Inventory Management, already dissected |

### Order flow

| Contract | Verdict | Basis |
|---|---|---|
| `W-020` Delivery readiness gate | **CONFIRMED and hugely extended** | **22 AR credit hold codes** with named triggers and settings; all must be approved; three route elsewhere (B9 F128, B17 F221) |
| `W-006` Direct ship posts revenue and COGS with no inventory movement | **CONFIRMED** | `Delivered Not Recorded`, `Direct-Ship Value Difference`, auto-held by a POS setting (B1 F11, B6 F97) |
| `W-005`, `W-021`–`W-026` | **NOT DOCUMENTED IN THIS SECTION** | Sales Processing / Logistics — runs 3 and 4 |

### Control plane

| Contract | Verdict | Basis |
|---|---|---|
| `W-050` One permission check governing every path | **INVERTED** | **Twelve** distinct access-control mechanisms named; the same permission placed in four of them; four documented "not enforced" carve-outs in GL alone; one regulated process (`Metro 2 Recovery`) with **no security at all** (B1 F18, B6 §E, B11 F157) |
| `W-051` Supervisor override captured with approver and reason | **INCONSISTENT** | Rigorous where consumer-credit regulation bites (two-person credential ceremonies); absent elsewhere (bulk hold removal, discount override, partial payment) (B7 F108, B4 F61, B20 F250) |
| `W-052` Location context propagates uniformly | **CONTRADICTED** | The GL cost centre comes from the **customer's assigned store**, not the transacting location; Regional Processing applies to AR and not to GL; the payment estimator resolves location three different ways (B1 F2, B2 F21, B8 F123) |
| `W-053` Master-data changes write before/after audit rows | **CONTRADICTED** | Value-level audit exists in **exactly one place** (credit and scoring); everywhere else it is comment-level; settings auditing is **opt-in per file**; ten separate comment/log stores (B9 F138, B10 F149, B23 F269) |
| `W-054` Every generated document is archived against its source | **CONTRADICTED** | Receipts, check registers and statements are **regenerated, not stored** — reprints blank the balances, registers drop voided checks, unprinted statements are purged. Only **signatures** are truly archived (B23 F268, B25 F286, B13 F171, B29 F320) |
| `W-055` Document numbering is per type per location and collision-free | **CONFIRMED, except under TPA** | Deposit numbers, `CP` EFT references, `AP` payment prefixes, retired check numbers — all sound; **but in TPA mode the third-party package assigns check numbers** and STORIS back-fills them (B3 F33, B20 F248, B21 F253) |
| `W-056` Configurable policy lives in control settings, not code | **CONFIRMED** | Overwhelmingly so — see the settings catalog (§D) |

### Values that must have exactly one definition

| Value | Verdict |
|---|---|
| `W-060` availability to promise (credit) | **CONFIRMED** — `Available Credit` is composed of limit, open, potential, pending installment, pending revolving and unpaid open orders (B7 F109) |
| `W-061` unit cost and COGS | **CONFIRMED, with a warning** — `Cost Change GL` and `Cost Used` are *different values* and the reconciliation report exists to find the gap (B24 F276) |
| `W-062` sales tax | **CONFIRMED** — jurisdiction-level GL account overrides the default; AP sales tax is a separate coded charge; hold code `T1` blocks the order if the tax provider fails (B1 F1, B4 F62, B9 F128) |
| `W-064` order balance due | **DEFINED but plural** — closed-end installment fixes it at write time; revolving recomputes at cycling; payoff is a **date-parameterised function**, never a stored number (B7 F98, F107) |
| `W-068` one definition of the GL account for a transaction | **CONTRADICTED** — up to **eight** resolution sources (B1 F1, B14 F189, B14 F200) |
| `W-069` one definition of period open/closed | **CONFIRMED for GL, CONTRADICTED for AR** — GL period state is single and cascading, but AR adds `Close Payment Dates`, a per-customer cycle-date floor, and an undefined **sales period** (B1 F4, B5 F73, B20 F251) |

---

## The headline finding: what actually happens to an unresolved posting

This was the run's central question and it took until batch 19 to settle. The answer **splits by
accounting mode**:

**Under STORIS Accounting**, account resolution walks a hierarchy — module settings → the module tab
in `General Ledger Assigned Account Settings` → `GL Account Number Default` — and if nothing
resolves, the system stamps a **sentinel token `$$$$$^NN`** (five dollar signs, the configured
account separator, a placeholder cost centre). That sentinel **blocks the save** on the GL
Distribution screen and on automatic GL distribution; GL imports **flag the batch and hold it
unposted** for repair via the `GL Invalid Transaction Report`; and module postings that fail land in
the **suspended postings queue**, repaired in `Post/Update a Journal Entry`. Three mechanisms, one
intent: **STORIS parks the work and makes a human fix it.**

**Under TPA**, postings **do** land on a real default account, and STORIS ships a screen pair
(`Bad TPA Posting Selection Screen` → `TPA AP Bill GL Postings Screen`) whose entire purpose is to
find and repair them — with repair *restricted* to postings that hit the default.

So `W-036` was right about the intent and wrong about the mechanism. There **is** a fall-through
hierarchy; its terminal value is a blocker, not an absorber — unless the site runs TPA, in which
case there are real transactions sitting on a default account in the history.

---

## C. Screen and field inventory

Held per batch. The consolidated highlights:

- **`General Ledger Assigned Account Settings`** — the posting table: 11 tabs, ~120 named account
  slots (B1 §C). This is the single most important screen inventory in the pack.
- **`Credit Hold Codes List (AR)`** — 22 codes with triggers and governing settings (B9 F128).
- **`AP Bill Types`** — 13 codes, with numbering gaps at 04, 05, 10, 14, 15, 17 (B6 F82).
- **`View Revolving General Info Tab`** — the definitive revolving plan record, 30+ fields (B28 F310).
- **Collections letter payload** — 40 fields, and the most precise statement of AR aging (B10 F147).
- **`Credit Application Entry`** — 3 applicant roles × 5 tabs, requiredness driven by a settings matrix (B9 F131).

---

## D. Control settings catalog

~180 settings catalogued across 25 settings files. The ones that change whether history is
reconstructable at all — **verify every one of these on the live system before cutover**:

| Setting | File | Why it matters |
|---|---|---|
| **`End-of-Day Posted Transactions`** | General Ledger Control Settings | One of its four values **suppresses the GL Post Register records themselves** (B24 F275) |
| **`Inventory-G/L Reconciliation Audit`** | Costing Control Settings | If off, inventory-to-GL differences were **never collected** (B24 F276) |
| **`Open Item Auditing`** | Accounts Receivable Control Settings | If off, `Report Audited Receivables` does not exist and the data was never retained (B27 F302) |
| **`Track Settings Activity`** | own routine | Settings-change auditing is **opt-in per file** (B10 F149) |
| **`Extend Cash Balancing`** | Cash Balancing Control Settings | If off, **unassigned cash transactions are never reported** (B2 F22) |
| `Multiple Customers Per Finance Account` | Financing Control Settings | If on, finance account number is **not** a unique customer key (B29 F318) |
| `Allow Duplicate Social Security Numbers` | AR Control Settings | Affects any customer-merge work (B14) |
| `Advanced` vs `Extended Receivables` | General System Control Settings | Which consumer-credit modules are licensed — **the docs disagree** (B7/B8/B14) |

---

## E. Security permissions catalog

**Twelve distinct access-control mechanisms** are named across the section:
`General Ledger User Permissions` (itself sectioned) · `GL Account Staff Security` ·
`GL Account Security` · `Extended Security` · `Extended Security (Receivables)` · `System Security` ·
`User/User Group Receivables Security` · `Create a User/Group Actions - <module> Security` ·
`Create a User/Group Receivables Security` · `Receivables Staff Security` · `Create a User` ·
the `User file`.

Plus two non-permission access mechanisms: **Regional Processing** (applies to AR, explicitly *not*
to GL) and the **`Corporate Access Log-on`** sentinel location (B13 F178).

Roughly 40 named permissions are catalogued in the batch files. The pattern to carry forward:
the *capability* for fine-grained control exists everywhere; the *naming and coverage* is ad hoc.

---

## F. State machines and enumerations

The complete, reusable enumerations extracted:

- **22 AR credit hold codes** (C1–C8, D1, D2, E1, F1–F5, I1–I4, S1, T1) with triggers, settings and
  removal semantics — B9
- **13 AP bill types** (`MDSI`…`AIC`) — B6
- **6 AP payment method codes** (`CHK` `MAN` `CCD` `DCD` `OLB` `CSH`) — B25
- **7 payment classes** for bank reconciliation — B3
- **9 credit history / payment history profile codes** (`C`, `0`–`6`) with the `0` triple-overload — B16, B29
- **7 installment contract statuses**; **2 interest methods** (Straight Line, Rule of 78s) — B7
- **Check status** (Printed/Reconciled/Voided); **bank rec `Clr`** (blank/P/R) — B2
- **Virtual card batch/payment lifecycle**; **9 EFT formats**; **12 positive-pay formats** — B20, B21
- **6 conversion exception codes** (`QTY NM`…`DUE DATE`) — B4
- **GL account structure** (company · root · sub-account · cost centre; ≤21 chars) and the
  **Class/Sub-Class/Group** hierarchy — B1
- **Typographic sentinels**: `*` · `D*` · `$$$$$^NN` · `…` · `P` · `ON ACCNT` — B27, B30

**Five mutually incompatible AR aging presentations** exist in one section (B30 F328). Build one.

---

## G. Sequencing rules

The load-bearing ones:

1. **Sales period must close before its GL period.** Sales-period state also gates payment batch
   dates and permits voids in a "sales overlap period" — and is **never defined in Accounting**.
2. **GL posts on transaction date, not invoice date.**
3. **Cycling is per-customer**, driven by due day (max 28, four buckets, location-overridable,
   frozen at customer creation) and a cycle schedule. It moves the payment long-term → open-item,
   computes revolving interest and insurance, stamps the credit history code, and creates statements.
   **Deferment is its exact inverse.**
4. **End-of-Day** writes Daily Deposit records, generates recurring AP bills, converts pending bills,
   runs the daily control pack, and drains the TPA error log.
5. **End-of-Month** purges statement history, LET documents and daily receipts; runs the AR aged
   trial balance and collector efficiency.
6. **Period 13** must be closed manually to close the year; the twelfth close rolls P&L to retained earnings.
7. Plan and control-settings edits are **not retroactive** — contracts, promotions and due days keep
   the values in force when they were created.

---

## H. Open questions and gaps

**Gated or unreachable:** none. Some System Administration fields are noted as
"accessible by STORIS personnel only", so the operator may not be able to change them.

**The seven questions worth putting to STORIS or testing in a sandbox**, in priority order:

1. **Do module posting paths park unresolved accounts the way imports do?** The evidence is strong
   but circumstantial. It decides whether the ledger can contain silently-defaulted postings.
2. **`Cost Used` vs `Cost Change GL`** — which is authoritative, and where does the difference go?
   This is the absorbed purchase-price variance and the crux of inventory-to-GL parity.
3. **Why can't long-term revolving be aged historically?** If it is because long-term balances carry
   no dated history, that is a fundamental data-model fact with wide consequences.
4. **What does `Cashed` mean on a financing transaction** — provider funded, or customer instrument
   cleared? It determines revenue and cash recognition timing.
5. **Which add-on module gates installment** — `Advanced` or `Extended Receivables`? Three articles,
   two answers.
6. **"Credit card and cash payments cannot be included in the Bank Reconciliation"** — the sentence
   appears in both `Bank Reconciliation Overview` and AP alternate payment methods. The AP reading
   makes everything consistent, but it is unqualified in both places.
7. **What is a "sales period"?** Referenced three times as a gate; defined nowhere in Accounting.

**The four opt-in audit switches** (§D) are not questions but **pre-cutover checks**. Their live
state determines how much of STORIS's history is reconstructable.

**Compliance items surfaced** — flag to whoever owns data protection:
retrievable full PAN behind an Actions menu (B3) · bank account number **unencrypted in the check
export file** (B6) · SSN used as a search key and a step-up verification token (B9) · customer IP
address stored on web credit applications (B19).

---

## I. Unknown unknowns

Roughly 150 capabilities were found that the run card's contract list did not anticipate. The ones
that would change scope, not just design:

- **Two complete in-house consumer credit subsystems** — closed-end installment (with Rule-of-78s,
  balloon payments, negative amortisation) and open-end revolving (with promotions, plan transfer,
  deferment) — running on **two coexisting AR ledgers** joined by a monthly cycle.
- **Metro 2 credit bureau reporting** with repair, crash recovery, FCRA compliance fields and an
  editable per-cycle delinquency history.
- **LET (Legally Entitled To) documents and repossession**, with an expiring legal instrument, a
  documented item-selection algorithm and piece-level identity.
- **Credit insurance** as a product line with three underwriter file integrations.
- **Payment agreements** with external payers (payroll, SSA, VA, insurers) altering cycling.
- **Vendor Receivables** — a full parallel subledger for bill-backs, volume rebates and warranty
  recovery, with `Convert to Payable`.
- **Collections** as a staffed function with collectors, quotas, promise-to-pay tracking and letters.
- **Third Party Accounting** as an alternate accounting mode with different posting semantics.
- **Layaway** — surfaced only through its statement; an entire order/credit type.
- **Multi-currency, multi-company and franchise** dimensions throughout.
- **DTS (Dynamic Tab Settings)** — a configurable inquiry framework, meaning documented screens are
  shipped defaults, not specifications.
- **Every money-moving integration ends at a file on someone's PC.** STORIS has no outbound banking
  transport anywhere in Accounting — checks, EFT, positive pay, virtual card, insurance, Metro 2 and
  statements all produce files a human must move.

---

## J. Glossary

~200 terms across the batch files. The ones that must enter our vocabulary unchanged, because
STORIS's data cannot be read without them:

`Received Not Recorded` · `Recorded Not Received` · `Delivered Not Recorded` ·
`Exported Not Recorded` · `Returned Not Recorded` · `COM Value` · `Cost Exceptions` ·
`Valuation Difference` · `$$$$$^NN` · `GL Post Register` · `Cycling` · `Long term / short term` ·
`MMP` / `SMP` · `Same as Cash` · `Non-Filing Charge` · `LET` · `Metro 2` · `Payment History Profile` ·
`Deposit Type Code` · `BAI Code` · `Daily Deposit record` · `Payment Register` · `RFND` ·
`Convert to Payable` · `Sales overlap period` · `DTS` · `Regional Processing` ·
`Corporate Access Log-on`.

---

## Closing: if we rebuilt Accounting from only what I read, what would we get wrong?

**Six things, in the order they would hurt.**

**1. We would periodise by invoice date and never tie to their ledger.** STORIS posts on
*transaction date* — a December invoice entered in January is a January expense. Every aging,
every trial balance, every reconciliation against migrated history would drift, and the cause would
not be obvious for weeks.

**2. We would build a strict posting engine and be unable to explain a single historical bill.**
Their variances were hand-absorbed into inventory cost by whoever converted the pending bill; their
GL hits may have been edited by hand at filing on any of five screens; and if the site ever ran TPA,
real transactions are sitting on a default account. A parity engine that refuses to post what STORIS
posted cannot reconcile to STORIS.

**3. We would model one receivable where there are four, and one aging where there are five.**
Open item, revolving long-term, installment long-term and deposit liability are four ledgers with
different lifecycles, joined by a monthly cycle we would not have built. Migrated balances would land
in the wrong pool and become movable in ways the originals never allowed — and our aged trial balance
would match none of theirs.

**4. We would assume history is there.** Four separate audit switches control whether STORIS
*collected* the data in the first place: GL post register, inventory-to-GL, open-item auditing and
settings-change tracking. If any has been off, that history does not exist and no amount of migration
effort will produce it. This is the one finding that should change what we do **this week**, before
anyone writes code — check the four settings.

**5. We would treat their documents as archives.** Receipts, check registers and statements are
regenerated from live data, not stored. Reprints blank the balances; registers drop voided checks;
unprinted statements are purged at month end. For a business with in-house consumer credit, that is a
regulatory exposure as much as a data one — and it is the easiest thing to do better.

**6. We would inherit twelve permission systems and call it security.** The capability for
account-level, field-level, two-person control exists in STORIS — and is applied inconsistently
enough that a regulated credit-bureau rewrite runs with no permission at all while a payment screen
prompts for a password that authenticates nothing. Copying the surface would copy the holes.

**What I would not change:** the bank reconciliation proof-and-batch model, the GL account activity
drill-down, the credit hold code table, the statement-message criteria-plus-exception pattern, the
plan restriction rule engine, the append-only posted-batch discipline, and the signature archive.
Those six are better than most of what they sit next to, and they are worth lifting more or less
intact.
