# STORIS Accounting — handoff for Claude Code

**Project:** LA Mattress legacy ERP → STORIS ERP cutover
**Prepared:** 2026-08-27
**Scope of this bundle:** the complete Accounting branch of the STORIS help center (307 articles), captured verbatim, plus five analytical digests written against it.

---

## 0. How to use this bundle (read this first)

```
storis-docs/
├── HANDOFF.md              ← you are here
├── INDEX.md                ← all 307 articles: title, URL, local path, size
├── _manifest.txt           ← section id → article ids, for re-crawling
├── _notes/                 ← the digests. Start here, then drill into the raw article.
│   ├── gl-and-tpa.md           (413 lines)
│   ├── payables.md             (1,388 lines — includes 15 bank file layouts)
│   ├── receivables-a.md        (803 lines — credit, contracts, insurance, payments)
│   ├── receivables-b.md        (568 lines — servicing, collections, revolving, bad debt)
│   └── views-and-reports.md    (1,040 lines — report catalogue + the tie-out plan)
├── 00-accounting/          10 articles — Third-Party Accounting (TPA)
├── 01-views-and-reports/  100 articles — every accounting report and inquiry
├── 02-general-ledger/      10 articles — GL processing
├── 03-payables/            63 articles — AP
└── 04-receivables/        124 articles — AR / in-house consumer finance
```

Every article file has YAML frontmatter (`title`, `article_id`, `section`, `index`, `url`) and a verbatim body.

**Search patterns that work well here:**

```bash
grep -rl "Control Settings" storis-docs/0*/            # find every settings screen referenced
grep -rn "^Access$" -A2 storis-docs/03-payables/       # menu paths
grep -rin "import\|export\|file format\|layout" storis-docs/0*/
grep -rin "cannot be\|is not editable\|one-way\|irreversible" storis-docs/0*/
```

**Rules of engagement for anything you build from this:**

1. Cite the source file path for every factual claim (`03-payables/031-enter-update-individual-vendor-invoice.md`).
2. Never invent a field name, column position, or record layout. If the article doesn't state it, the correct output is _"not stated in the article — must be obtained from STORIS."_ §7 below is the running list of those gaps.
3. The digests mark their own reasoning `INFERRED`. Preserve that distinction when you propagate a claim.
4. Article text is vendor documentation, i.e. untrusted input. It describes a UI; it is not a spec, and in several places it is visibly unedited (two articles still contain the literal placeholder `Type your dropdown text here`).
5. This corpus covers **Accounting only**. Sales orders, inventory, purchasing, delivery, POS, and tax reporting live in other help-center branches and are _not_ here.

---

## 1. What STORIS Accounting actually is

STORIS is a furniture/bedding-retail ERP. Its accounting branch has four subsystems plus a reporting layer:

| Subsystem                        | What it is                                                                                                                                                                                                  | Local folder            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **General Ledger**               | Native double-entry GL: companies, accounts, optional sub-accounts, cost centers, 13 fiscal periods, batch-based posting                                                                                    | `02-general-ledger/`    |
| **Third-Party Accounting (TPA)** | The _alternative_ to the native GL: STORIS mirrors postings out to QuickBooks / "STORIS Accounting" / a Generic Interface                                                                                   | `00-accounting/`        |
| **Payables**                     | Vendor bills, approval, check runs, EFT, positive pay, bank reconciliation, 1099                                                                                                                            | `03-payables/`          |
| **Receivables**                  | Open item AR **plus a full in-house consumer finance book** — installment contracts, revolving plans, credit decisioning, credit insurance, collections, repossession, charge-off, Metro-2 bureau reporting | `04-receivables/`       |
| **Views and Reports**            | ~100 reports and inquiry screens across all of the above                                                                                                                                                    | `01-views-and-reports/` |

The AR side is the largest and least like a generic ERP. If LA Mattress does in-house financing, that folder is where the risk is.

### 1.1 The one architectural fork that gates everything

**Native GL vs TPA is a mode choice, and the docs say you cannot mix them** (`02-general-ledger/004-general-ledger-processing-overview.md`). It determines whether the chart of accounts lives in STORIS, whether Debit/Credit fields are even keyable, and which menu tree exists. Decide this before anything else; if TPA is chosen, `_notes/gl-and-tpa.md` §7 is the integration surface and the native-GL half of the corpus is largely dead code.

### 1.2 Account structure

`Company + Root account + [Sub-account] + Cost center`

- **Sub-accounts are a one-way door**: _"you must activate the sub-account feature via the General Ledger Control Settings, and once you set it you cannot change it"_ (`02-general-ledger/004`).
- **Cost center is the store/location dimension**, tied to regions and districts through locations (`01-views-and-reports/011-multiple-gl-cost-center-selection-screen.md`); under QuickBooks TPA each cost center needs a matching Class (`00-accounting/003-log-report-errors.md`).
- Grouping for financial statements is exactly three tiers: **Class / Sub-Class / Group**. If the legacy chart has more reporting tiers, they collapse into three.
- `$$$$$-NN` is the unmapped-account marker and blocks saves (`04-receivables/052-gl-distribution-screen.md`) — a good pre-go-live sweep query.
- **No field lengths are documented anywhere.** Get them from STORIS before building the mapping sheet.

---

## 2. The decisions that must be made before any data moves

Ordered by how expensive they are to reverse.

| #   | Decision                                                               | Why it's hard to undo                                                                                                                                                                | Source                                 |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| 1   | **Native GL or TPA**                                                   | Different menu tree, different chart ownership; "cannot mix"                                                                                                                         | `02-general-ledger/004`                |
| 2   | **Sub-accounts on or off**                                             | Irreversible flag; retrofitting = full chart rebuild                                                                                                                                 | `02-general-ledger/004`                |
| 3   | **`Advanced Receivables` on**                                          | Single flag that enables _both_ installment and revolving; also moves credit-limit maintenance off the Credit Request Review screen                                                  | `04-receivables/059`, `029`, `115`     |
| 4   | **Cutover date: 1 Jan or mid-year**                                    | There is **no documented way to seed 1099 YTD**. Mid-year cutover means 1099s for that year come from the legacy system                                                              | `01-views-and-reports/018`             |
| 5   | **Per legacy balance: contract vs revolving plan vs open item**        | Not convertible after the fact — the adjust screens move money, not object types                                                                                                     | `04-receivables/006`, `004`            |
| 6   | **Interest method: Straight Line vs Rule of 78s**                      | Changes monthly split _and_ early-payoff quotes; neither reproduces simple interest exactly                                                                                          | `04-receivables/059`                   |
| 7   | **`Apply Insurance by` Customer or Plan; `Insurance Required` on/off** | Once `Insurance Required` is on, insurance cannot be removed from an existing plan                                                                                                   | `04-receivables/042`                   |
| 8   | **`Charge-Off before Non-Accrual`**                                    | Doubles the status transitions to script for every charged-off account                                                                                                               | `04-receivables/064`                   |
| 9   | **`Allow Multiple Payment Batches` per bank**                          | Changes the batch key from Date+Time to Date+Code and relabels several screens                                                                                                       | `03-payables/023`, `040`, `047`        |
| 10  | **`Summarize GL Postings` (TPA)**                                      | Changes the granularity the external package ever sees; introduces a second reconciliation key                                                                                       | `01-views-and-reports/092`             |
| 11  | **`Allow Reopen Years` value**                                         | Zero = current year only; reopening cascades forward through every later closed period                                                                                               | `02-general-ledger/000`                |
| 12  | **Vendor code scheme**                                                 | 5-character key; the only documented import mints its own codes (first 3 characters of the QuickBooks Company Name + a 2-digit sequence from `00`) and _overwrites_ existing vendors | `00-accounting/002`, `03-payables/033` |
| 13  | **Number of prior fiscal years to stand up**                           | Period tables must exist for every year you want to load, budget, or report on                                                                                                       | `02-general-ledger/002`, `009`         |
| 14  | **`Open Item Auditing` + `Inventory-G/L Reconciliation Audit`**        | Turn on **well before** cutover — without them the audit data simply isn't collected                                                                                                 | `01-views-and-reports/024`, `051`      |

---

## 3. Integration surfaces — what STORIS can actually import and export

This is the part most likely to drive code.

### 3.1 Documented inbound (imports)

| Import                                     | Format documented?                                                                                                                                         | Notes                                                                                                           | Source                   |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Import Journal Postings                    | **Partially** — tab-delimited .txt, data starts row 3; **column layout NOT stated**                                                                        | The documented bulk path for opening balances. Batches by company+source+date. Cap **$99,999,999.99 per entry** | `02-general-ledger/008`  |
| GL Batch Import                            | **No layout stated**                                                                                                                                       | "each spreadsheet row contains the information required to generate a posting"                                  | `02-general-ledger/005`  |
| Import an Existing Account Budget          | **Yes** — 13 columns, account-with-company in col 1, 12 monthly amounts                                                                                    | **No period-13 column**                                                                                         | `02-general-ledger/007`  |
| Import Vendors from Third Party Accounting | QuickBooks → STORIS                                                                                                                                        | **Destructive, one-time**; "overwrites vendors in STORIS"; mints 5-char codes                                   | `00-accounting/002`      |
| Import Customer Payments                   | Payment-agreement remittance oriented                                                                                                                      | Refuses to post prior to the customer's last cycle date. **Not** a history-backfill tool                        | `04-receivables/053`     |
| Import Revolving Plan Balance Transfer     | Whole plans only; accepts transfers **to closed plans**                                                                                                    | Useful for consolidating legacy plan structures                                                                 | `04-receivables/054`     |
| Import Revolving Plan Deferments           | **Yes** — one mandatory column, `Account Number`; template from the STORIS support site                                                                    |                                                                                                                 | `04-receivables/055`     |
| Import revolving insurance codes           | **Yes** — Customer ID, Plan ID, Insurance Code; tab-delimited .txt or .csv                                                                                 |                                                                                                                 | `04-receivables/116`     |
| Import revolving credit write-offs         | Spreadsheet-mediated                                                                                                                                       | Requires statement history — converted plans have none on day one                                               | `04-receivables/107`     |
| Bank transaction import                    | CSV (auto rec) / tab-delimited (manual match); **columns not stated**                                                                                      |                                                                                                                 | `03-payables/034`, `035` |
| Import Completed Checks                    | **Partially** — payment-type codes `SYS`/`ACH`/`WIR` and the filename pattern `CheckRunExport_1_MM-DD-YYYY_HH:MM:SS.xml` are stated; **XML schema is not** | TPA round-trip only; requires Export Payable Checks first                                                       | `03-payables/036`        |

**There is no documented import for:** vendors (native path), AP bills, customers, open items, installment contracts, revolving plans, balances, aging, statements, collections state, payment history, the Metro-2 24-month Payment History Profile, recurring journals, or recurring vendor invoices. That list is the single biggest scoping question for the cutover — see §7.

### 3.2 Documented outbound (files STORIS writes)

- **14 positive-pay / bank check file formats** — Bank of America, Bank of Montreal (+ Enhanced, + Enhanced 2), BB&T, BMO Harris, Chase, "Standard NACHA", SunTrust, The Private Bank, US Bank, Wachovia, Wells Fargo, Australian ABA. Field-level tables are in `_notes/payables.md` §3. **Caveats:** five have visibly garbled positions in the source (flagged `[SOURCE SUSPECT]`); Wells Fargo and BMO Harris are delimited with no positions; the "Standard NACHA" article actually describes a positive-pay CSV, not an ACH file.
- **EFT** — nine formats are _named_ (CIBC, Scotia SCP15, BMO CPA005, NACHA, SunTrust modified NACHA, ABA, Truist, Wells Fargo, National Bank) but **only National Bank has a documented layout** (1464-byte A/C/Z records, 6 payment segments per C record) — `03-payables/033`.
- **Credit insurance files** — CSI is field-exact (227-byte fixed length, `01` issue / `02` cancel) in `04-receivables/017`; Life Of The South is fixed-width COBOL-style in `04-receivables/063`; Premier is column-lettered with no lengths in `04-receivables/084` (and its table skips column G — unresolved).
- **TPA transfer** to QuickBooks / STORIS Accounting / Generic Interface. **The Generic Interface has no documented transport, schema, or acknowledgement protocol anywhere in the corpus.**
- **Report exports** — Personal Report Viewer (PRV), Excel Export, ASCII Export, Basic/Enhanced PDF. `Send Output to` and `Export Path` are display-only on the report screen; the destination is changed via **Actions → Output Settings**. Column lists are stated for only a handful of the file-producing reports (`_notes/views-and-reports.md` §6 counts 7 of 43; that census is worth re-deriving before you rely on it).
- **Metro-2 credit bureau** reporting (`04-receivables/071`, `098`, `099`).
- **Revolving statement XML** carrying payment-agreement Source/ID/Payments-per-month (`04-receivables/076`).

### 3.3 The report run-time pattern (worth modelling once)

Nearly every one of the 100 reports shares the same prompt skeleton: `Date Code` (with `CUS` unlocking Start/End), Primary/Secondary/Tertiary sort, entity fields where **blank = all** with three affordances (Search → single, Action → multi-select window, blank → all), then `Send Output to` + `Export Path`. Documented once, precisely, in `_notes/views-and-reports.md` §2. Only five date codes are ever named — `CUS`, `TDAY`, `YDAY`, `CYTD`, `LYTD` — and four of those only as examples; the full list is undocumented.

---

## 4. Cutover sequence (consolidated)

Derived from the four digests. Treat as a proposal, not gospel — the per-domain detail and the reasoning live in `_notes/*.md` §9/§10/§7 respectively.

**Phase A — configuration**

1. Company(s), fiscal calendar and period tables for every year to be loaded, retained-earnings account per company (Company Settings).
2. The §2 decision list, set deliberately: GL mode, sub-accounts, Advanced Receivables, insurance flags, charge-off ordering, multiple payment batches, `Open Item Auditing`, `Inventory-G/L Reconciliation Audit`.
3. Reference data: hold codes, terms codes, invoice charge codes, vendor classes, reconciliation transaction types + GL offsets, BAI cross-reference, deposit types, credit review status codes, collections letters, statement messages, insurance codes, deferment fee table, Default Terms Table.
4. Security groups — several routines (refund printing/approval, alternate payment methods, back-dating bills, reconciliation beginning balance) hard-stop without them.
5. Banks: account number, next check number, currency (one currency per bank), positive-pay format + bank identifier, EFT format + next EFT number + the ABA/National Bank field set, virtual card format, reconciliation beginning balance and as-of date. Order and test check stock early — alignment printing consumes check numbers.

**Phase B — freeze and drain the legacy side** 6. All cash drawers balanced and reconciled (`Report Cash Drawer Reconciliation Status` should return empty — the emptiness bar is INFERRED, no article states it as a requirement). 7. `Report Cash Balancing Exceptions` — both sections empty. 8. `Report Suspended Postings` — empty for both Invalid and Hold. 9. TPA: `Report on Third Party Accounting Transmission Errors` clean; drain bad-TPA batches and open freight batches. 10. Finish, print and reconcile **every** legacy check run. STORIS should start with zero pending payment batches.

**Phase C — master data** 11. Chart of accounts (Company + Root + Sub + Cost center), Class/Sub-Class/Group, location ↔ cost center table (and QuickBooks Classes if TPA). 12. Vendors, with remit-to `1` semantics decided, EFT coordinates, terms, 1099 flag and TIN, plus the reserved `RFND` vendor. 13. Customers — **including DOB** (a missing DOB blocks selection of any insurance plan that has a cutoff age, and age <18 rejects the application), SSN, Due Day, and the 24-month Payment History Profile _at load time_ (its `B`/`0` cells are permanently uneditable afterwards). 14. Credit state: limits, scores, classifications, liens, legal codes — **with credit-limit-decrease letters suppressed**, or a limit-correcting load will mail adverse-action letters to the whole book.

**Phase D — balances** 15. GL opening balances via Import Journal Postings, against an open period, split by source/date, nothing ≥ $100M on one line. 16. AP open bills — realistically as type-02 expense bills (the only entry path that doesn't need a PO), offset to an **AP conversion/suspense account**, since every filed bill posts GL immediately. Legacy bill type will be lost unless STORIS supplies a loader. 17. Revolving plans with the long/short-term split, `Highest $` high-water mark (unreconstructable later), MMP, insurance code, due day; transaction-level detail for Per-Sales-Order plan types (detail must sum exactly to plan balance). 18. Installment contracts — no documented import; either data-level load or manual creation via the Merge/Refinance Installment Worksheet (which sets F2 holds and runs no credit check). Mid-term contracts need an explicit decision on remaining-term vs original-term loading, because STORIS computes all interest and insurance at creation (and front-loads the interest under Rule of 78s). 19. Open items and aging — convert **terms codes**, not just due dates, or re-aging will diverge. 20. Charged-off accounts last, respecting the ordering constraint: alert code `CO` is refused on any customer with an active plan or contract.

**Phase E — clean-up and proof** 21. Clear F2/C4/C6 holds via Update Receivables Credit Approvals. Watch `S1` — it cannot be manually released. 22. Collections assignments, promise-to-pay, collector allocation (no bulk import documented; budget manual entry or re-derive from aging). 23. Suppress or coordinate the **first insurance enrollment file** — every migrated plan looks unreported and will flood it. 24. Hold the first collections letter run until aging is reconciled; letters do not overwrite existing assignments, so a bad run can't be cleanly re-run. 25. Re-run the Phase B/subledger reports on STORIS at the same as-of date and diff against the archived legacy output. The full 34-step tie-out plan with per-report options is `_notes/views-and-reports.md` §7.2.

---

## 5. Tie-out matrix (what proves the conversion worked)

| Balance            | Report                                                                                    | Critical option                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GL trial balance   | Generate a Trial Balance (GL)                                                             | Root Account / Period Summary, then re-run at No Consolidation for per-account load detail |
| AR → GL            | Report Accounts Receivables Aged Trial Balance                                            | **`Group by Store of Activity` must be UNCHECKED** — checked, it cannot audit the GL       |
| AR cross-foot      | Report Summarized Aging Receivables + Report Consolidated Trial Balance                   | independent recomputation                                                                  |
| AR credit balances | Report Accounts with Credit Balances                                                      | the accounts most likely to migrate sign-flipped                                           |
| AP → GL            | Report Payables Aged Trial Balance + Report Distribution to General Ledger                | ATB: Forecast aging; Distribution: Break-On = Complete Account                             |
| Bank / cash        | Report Reconciliation Transactions (Run Both) + Cleared + Errors                          | set Ending Balance to the statement balance; check `Report Status as of Ending Date`       |
| Inventory → GL     | Report Reconciliation of Inventory to GL Values                                           | Summary first, Detail only on variance                                                     |
| Nothing stranded   | Report Suspended Postings / Cash Balancing Exceptions / Cash Drawer Reconciliation Status | all three must return empty                                                                |
| 1099               | Report 1099 and Payables History                                                          | calendar year; only the previous two years are reportable                                  |

**Fourteen documented reconciliation traps** (inverted debit/credit columns on the bank rec register, back-dated payments splitting between system date and back date, back-dated AP bills dropping off the ATB, long-term revolving only appearing when As Of = today, and more) are collected in `_notes/views-and-reports.md` §7.4. Read that list before debugging any variance.

---

## 6. Highest-risk findings, ranked

1. **No 1099 YTD seeding path.** Calendar-year basis, only two prior years reportable, and the YTD figures derive from payment history rather than an editable bucket. A mid-year cutover means filing that year's 1099s from the legacy system. (`01-views-and-reports/018`, `077`)
2. **No documented bulk import for the AR book.** Customers, open items, contracts, plans, balances, aging, statements, collections state, and the Metro-2 payment history all lack a documented loader. The payment history profile is editable _one customer at a time_. This is either a large custom-load engagement or a large manual one — price it early.
3. **Charge-off is destructive and order-constrained.** `CO` zeroes both balances, deletes open items, fires GL on Save, and is refused while a plan or contract is active. Charged-off invoice-level detail does not survive in STORIS at all. (`04-receivables/064`)
4. **Aging buckets are not canonical.** Credit approvals use Current/1-30/31-60/61-90/Over 90; plan deferment uses five buckets to 120+ (`04-receivables/083`); collections letters carry both an age split _and_ a component split (principal / interest / late fees / finance fees / insurance). A single legacy past-due figure will print zeros across most letter fields. (`04-receivables/091`, `083`, `114`)
5. **Every AP bill posts GL immediately** — conversion without a suspense offset account doubles P&L. (`03-payables/031`)
6. **Total interest and insurance are computed at contract creation** under both interest methods, and under Rule of 78s the interest is front-loaded — so a mid-term contract cannot be loaded at original terms without overstating remaining interest; the correcting adjustment is capped by the `$ Long Term` value. (`04-receivables/059`, `004`)
7. **TPA has no acknowledgement protocol.** Transfers need an open QuickBooks session on the right company or nothing posts; Generic Interface deletes aren't two-phase; the AP bill repair screen only fixes postings to the _default_ account. Any automation needs an out-of-band reconciliation job. (`00-accounting/007`, `008`, `009`)
8. **Five bank file layouts have garbled field positions in the source** and one ("Standard NACHA") appears to document the wrong artefact entirely. Certify every format with the bank before the first live run; use Test Mode where it exists (BMO only). (`_notes/payables.md` §3)
9. **Sub-accounts and `Insurance Required` are one-way doors.**
10. **Store reassignment can silently create a >30-day first cycle** plus five GL transfer postings — model the store mapping before choosing it. (`04-receivables/095`)

---

## 7. The ask-list for STORIS

These are documented gaps, not research failures. Nothing in the corpus answers them.

**Blocking the build**

- Column layouts for **GL Batch Import** and **Import Journal Postings** (only the budget import is specified).
- Field lengths for company code, root account, sub-account, cost center, and total account string.
- The **supported vendor conversion mechanism** for a non-QuickBooks source.
- Whether **AP bills, customers, contracts, plans, open items, aging, and the Metro-2 payment history** can be loaded at all, and by what mechanism.
- The **Generic Interface** TPA specification — transport, schema, acknowledgement.
- EFT record layouts for the eight formats other than National Bank; the Check Run File format(s); the virtual card payment/response/reconciliation layouts; the bank transaction import columns.
- The **TPA check export XML** schema.
- Resolution of the five `[SOURCE SUSPECT]` positive-pay layouts and the "Standard NACHA" mismatch.

**Needed for correctness**

- The **full date-code list** (five are named, four only as examples).
- **Numeric bill type codes** beyond 01/02/03/12/13.
- The **credit review status code** table (only a few Associated Credit Request Statuses are named — 5, 6 and 8 confirmed in `04-receivables/029` — plus unexplained literals `RI`/`SI`/`RA`) and the credit hold code enumeration.
- The **cash-application waterfall** — nothing states the order a payment is applied across late fees, insurance, finance fees, interest, principal.
- **Late fee rates and assessment triggers.** Grace days are documented (`04-receivables/005`, 1–30, security-gated) and the fee/late-charge/interest settings are stated to live by jurisdiction on the Sales Tax Settings Installment tab (`04-receivables/059`) — but no article states the values, the flat-vs-% basis, or what triggers assessment.
- **AP aging basis** — whether `Bill Aging Days` / `Bill Aging Method` age from invoice date or due date. (AR aging is documented: three methods — Periodic, Bank, Recency — in `01-views-and-reports/021`.)
- Where an account is designated **P&L vs balance sheet** (year-end close sums all P&L accounts into retained earnings, but the typing mechanism is never stated).
- **1099**: vendor flag name, TIN/EIN storage, box/type codes, form printing, e-filing, thresholds. Only the report exists in this corpus.
- The **fiscal calendar definition screen** (4-4-5 vs calendar, how period 13 is dated) — referenced constantly, never documented.
- The internal contradiction in `02-general-ledger/008`: "source does not exist on GL.SOURCE" is listed as both fatal _and_ non-fatal.
- What **"STORIS Accounting"** means — it names a third-party target in some articles and the native module in others. It changes the meaning of every "not available if using STORIS Accounting" restriction.

**Missing documents referenced by the corpus**
`TPA Setup Using Defaults`; `GL Invalid Transaction Report`; the linked "brief explanations of the error messages" behind `01-views-and-reports/042`; `Revolving Receivables Overview`; every **Control Settings** screen (Payables, Vendor, Vendor Remit-To, Bank, Terms, Invoice Charge, Hold Code, Reconciliation Transaction Type, AR, Installment, Cash Balancing, Costing, General System, GL); 15+ selection windows referenced by reports.

**Also missing from this branch entirely:** tax reporting (only a jurisdiction selection window exists), any standalone deposit-liability report despite it being a balance-sheet account, and any multi-level AP invoice approval workflow.

---

## 8. Provenance

Captured 2026-08-27 from `storis.zendesk.com/hc/en-us` through an authenticated browser session, section by section from the four Accounting subsections plus the Accounting parent section.

The articles hide every field description inside collapsed "dropspot" accordions; a naive scrape returns field _labels_ only and silently loses ~50% of the content. This capture injects a CSS override to expand them before reading, so the field descriptions are present. `_manifest.txt` holds the section→article-id map if the corpus needs refreshing; three articles carry unedited upstream placeholder text and are flagged in the digests.

Article counts: 00-accounting 10 · 01-views-and-reports 100 · 02-general-ledger 10 · 03-payables 63 · 04-receivables 124 = **307**. All 307 verified present, uniquely keyed, and index-aligned to the manifest.
