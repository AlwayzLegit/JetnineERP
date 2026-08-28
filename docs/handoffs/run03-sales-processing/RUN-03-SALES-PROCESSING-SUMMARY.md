# RUN 03 — STORIS `Sales Processing` — Run Summary

**Scope:** the `Sales Processing` category of the STORIS help centre — 405 articles across five
subsections. **Method:** the wiring audit defined in `BROWSER-AGENT-HANDOFF.md` and
`KICKOFF-PROMPT.md`. **Output:** 16 batch files, **164 findings**, this summary.

**Read-only throughout.** No form submitted, no setting saved, no process run, no report executed.
Where an article instructs "choose Run to produce the report", that instruction is quoted, never
followed. No page in this run presented as a live application.

---

## A. Coverage log

| Subsection | Articles | Batches | Disposition |
|---|---|---|---|
| Sales Order Management | 138 | 1–8 | worked in full |
| Salesperson | 47 | 11–12 | worked in full |
| Customer Financing and Receivables | 44 | 9–10, 14 | worked in full |
| Order Completion and Settlement | 37 | 10, 13 | worked in full |
| Sales Views and Reports | 139 | 13–16 | sampled; **all 139 inventoried, each exclusion reasoned** (batch 16 §A) |
| **Total** | **405** | **16** | **164 findings** |

Linked articles outside the category were followed where an in-scope article named them, per the
handoff's "follow the links" rule — principally into Inventory Control settings, Accounts
Receivable settings, and Point of Sale Control Settings.

Batch files:

| File | Findings |
|---|---|
| `BATCH-01-ORDER-ENTRY-CORE.md` | 1–14 |
| `BATCH-02-PRICING-DISCOUNTS-LINES.md` | 15–24 |
| `BATCH-03-FULFILLMENT-SCHEDULING.md` | 25–33 |
| `BATCH-04-PAYMENTS-TENDER.md` | 34–44 |
| `BATCH-05-DEPOSITS-REFUNDS-ADJUSTMENTS.md` | 45–54 |
| `BATCH-06-SPECIAL-ORDER-COM-WARRANTY.md` | 55–63 |
| `BATCH-07-RETURNS-EXCHANGES-QUICKSALE.md` | 64–75 |
| `BATCH-08-CUSTOMERS-MERGE-VERIFICATION.md` | 76–84 |
| `BATCH-09-FINANCING-APPLICATIONS.md` | 85–95 |
| `BATCH-10-SETTLEMENT-CASH-DRAWER.md` | 96–105 |
| `BATCH-11-SALESPERSON-UPSYSTEM-COMMISSION.md` | 106–115 |
| `BATCH-12-CRM-LEADS-ANALYSIS.md` | 116–124 |
| `BATCH-13-ORDER-INQUIRIES-EXCEPTIONS.md` | 125–133 |
| `BATCH-14-RECEIVABLES-FINANCING-INQUIRIES.md` | 134–142 |
| `BATCH-15-SALES-PERFORMANCE-WARRANTY.md` | 143–152 |
| `BATCH-16-SALES-VIEWS-COVERAGE-SWEEP.md` | 153–164 |

**Two findings were re-derived independently and agree.** F130 (batch 13) and F154 (batch 16) both
established the sales-exception recording semantics from different articles; F129 (batch 13) and
F156 (batch 16) both found the ATP tab swap. Recorded as corroboration, not as separate discoveries.

---

## B. Ten headline findings

### 1. A credit hold is not released by approval — End of Day releases it *(F153)*

> "…may show "Approved" following the original hold code applied to the order (for example, "D2 - Approved"). This indicates that the order was approved and **EOD (Generate Daily Reports) has not yet run since the approval**."

The only sentence in three runs that says what *clears* a hold. Approval and release are separated
by a nightly batch. Everything downstream that reads the hold field sees a held order in between.
**This is a cutover decision we must make deliberately, not inherit by accident.**

### 2. Sales tax resolves through a five-step, three-location algorithm *(F5, F6, F86, F131)*

Three candidate locations, five ordered steps, exemption at two levels, Rent-to-Own stripping tax
entirely and reporting the strip, and a reporting split depending on whether an Alternate Tax
Interface is installed. Tax is not a lookup in this system; it is a resolution procedure.

### 3. Selling price resolves through a seven-level hierarchy that a setting can reorder *(F15–F19)*

Plus customer price matrices and markdowns interacting by lowest-wins with two documented
exceptions; multiple discounts per line with a settings-dependent "primary"; three discount scopes,
one incompatible with ATI; and a separate trade-sales regime with a capped discount. **Price is the
most heavily wired thing in this category.** The `Adjust the Net Total` out-the-door path (F7)
destroys discount detail on the way through, which means margin analysis silently loses fidelity
on exactly the orders where a manager intervened.

### 4. Returns do not hit the general ledger until completion *(F64)*

Verbatim. Combined with F69 — returns without an original order create untracked, unpriced
inventory — the return path is where this ERP's accounting is thinnest and where our rebuild
has the most freedom and the most risk.

### 5. Negative margins are cost restatement, and the trail runs back to run 02 *(F144)*

> "Negative margins on this report involve changes in the cost of an item (for example, a PO being received, a cost exception being solved, etc.). At the time a sales order is written, STORIS uses average cost since the exact cost is not yet available. When the exact cost of an item becomes [available], the sales order updates and an 'adjustment' record is made to the Written Business and BTA files."

This closes run 02's central open question. STORIS has no purchase price variance *account*; it has
a **manual cost exception queue** (run 02) whose resolution **retroactively restates the cost of
already-written sales orders** and writes adjustment records into Written Business and `BTA`. Margin
in STORIS is provisional until the exception is worked. **The single most important cross-run
finding of the audit so far.**

### 6. Named GL postings, with fall-through *(F38, F140, F159)*

Abandoned card transactions post to accounts resolved two-level: the `Payment Type` record's
Credit Card GLA, else the `BANK` record's. AR GLA from `General Ledger Assigned Account Settings`.
Two accrual accounts — `received-not-recorded` and `returned-not-recorded` — each with a dedicated
audit report, and **both cleared by the same event: AP approval.** A third report catches
merchandise paid for but never received.

### 7. Order completion is a five-precondition release, and direct ship creates an AP bill *(F8)*

Direct-ship completion creates the AP bill and closes the purchase order in one act. The sales side
of the system reaches into purchasing and payables at the moment of completion.

### 8. Access control is nineteen mechanisms, not one *(F34, F45, F74, F115, F117, F125, F164, and across runs 01–02)*

Payment-type-level security · four separate refund permissions · exchange edit permissions by
portion · the Up System's own security tab (not the usual permission files) · InTouch's five-level
CRM model that is **explicitly not Regional Processing** · a three-way sales-data scope switch ·
and the separate read-only process as its own permission. **`W-050` is judged inverted for the
fourth time**: Regional Processing restricts *inquiry and reporting*, not only transaction entry.

### 9. Screen composition is configuration, and at least one screen has no menu path *(F155, F156)*

> "This window is accessible through Dynamic Tab Settings and is not found on the menu."

Tabs are addressable components (`IC.204.TAB`, `IC.207.TAB`). With run 02's `BMW_ACF`, this is the
second sighting of a **configuration layer beneath the settings screens that the help centre does
not describe**. Our screen inventory across three runs is therefore a lower bound, not a census.

### 10. `CWC` = Customer Will Call, and unscheduled orders are invisible to date-filtered searches *(F4, F127)*

Carried as a known-unknown across four run-02 batches, defined here. And the consequence the docs
state plainly: `ASAP` and `CWC` orders **do not appear** in date-filtered order searches. A
migration reconciliation driven by date ranges would silently drop them.

---

## C. Screen and field inventory

Consolidated in each batch file's section C. Approximately 140 screens catalogued with verbatim
field names. **Subject to the F155 caveat**: DTS-composed pages may exist that no article documents.

## D. Control settings catalog

Settings records touched this run: **Point of Sale Control Settings** (repeatedly named, **field
list never published** — the largest unenumerated control record in the corpus) · Accounts
Receivable Control Settings · Receivables Settings · Inventory Control Settings · Advanced Product
Settings · Dynamic Tab Settings · General Ledger Assigned Account Settings · Status Code Settings
(unread) · ten InTouch CRM settings files (F121) · Up System statistics switches (F112) · two POS
commission/reporting settings on a dedicated tab (F152).

## E. Security permissions catalog

Nineteen distinct access-control mechanisms across three runs; see headline 8 and each batch's
section E. Regional Processing wording is verbatim-identical across dozens of report articles.

## F. State machines and enumerations

- **Line status** — nine composite codes (F2), one of which silently suppresses shipment.
- **Credit hold codes** — five sourced: `F5` (driver-licence failure) · `C6` (credit decision
  pending) · `E1` (exchange at entry) · `F3` (pre-qualify pending customer data) · **`D2`** (trigger
  undocumented), plus "missing finance authorisation number". **Holds are not exclusive** (F139).
- **Availability** — **nine** definitions, of which ATP alone is date-bearing (F157).
- **Fulfillment statuses** — including `ASAP` and `CWC`, both unscheduled by construction.
- **Up System action codes** — a *customer-defined* state machine with four behavioural attributes (F107).
- **Commission report legend** — A/R/S/J and C/D/E/O/M/P/X (F146).
- **Gift certificate transactions** — purchase · refund · redemption · registry contribution (F162).
- **Unenumerated but named:** `Certificate Type` · `Gift Registry Type` · `Plan Status` ·
  `Rebate Mode` · `Exception Report` types · transaction code `02`.

## G. Sequencing rules

1. Credit approval → **EOD** → hold released (F153).
2. Sales order written at **average cost** → exact cost arrives → order restated → adjustment to
   Written Business and `BTA` (F144).
3. PO receipt → received-not-recorded opens → **AP approval** → closes (F159).
4. Return flagged via Return List Entry → returned-not-recorded opens → **AP bill** → closes (F159).
5. Return → **no GL effect until completion** (F64).
6. Direct ship completion → AP bill created **and** PO closed (F8).
7. Receipts → `DAILY.DETAIL` → **Generate Monthly Reports** purges per `Daily Receipts Retention Months` (F160).
8. Written sales → **End-of-Month** purge (F145); commission dates to the original order unless purged.
9. Finance receivables accumulate to an **untransmitted batch** all day; some providers settle over two days with a response file (F96, F97).
10. The **Up System has its own end of day**, separate from Generate Daily Reports (F106).

## H. Open questions and gaps

**Gated or unreachable**

- `Credit Hold Codes List (AR)` — referenced across runs 01 and 03, **never read**. The
  authoritative hold-code enumeration. **Highest-value unread article in the corpus.** Carry to run 05.
- `Point of Sale Control Settings` — field list never published anywhere reached.
- `Status Code Settings`, `Transaction Codes` — unread; transaction code `02` still missing.
- Four Kardex ledgers (run 02) — still unread.
- Article IDs that 404'd: `Debit Card Payment Entry Window` (15201404901460),
  `Report Improperly Processed Orders` (15203030606100). IDs need re-derivation; **not guessed at.**

**Documented but ambiguous**

- **Membership rewards** — earning rate, redemption mechanism, tender treatment, expiry at
  `Renewal Date`, governing control record: **all undocumented** (F158). Largest functional area in
  Sales Processing we cannot reconstruct. Candidate for a direct vendor question.
- **`Vendor Quantity on Hand`** — source unstated (interface? import? keyed?).
- **Gift registry** — a subsystem inferred from three field names and one lookup screen.
- Gift certificate purge — process and retention setting unnamed.
- Whether `"D2 - Approved"` is stored or rendered.

**Inferences** *(recorded as inference, never as fact — 19 across the run; batch-level detail in each file's §H)*

- **I-16:** `Rebate Mode` ≈ run 02's `Vendor Rebate Chargeback Method`. *No article connects them.*
- **I-17:** dotted-uppercase names (`DAILY.DETAIL`, `PRODUCT.HISTORY`) are physical file names; the
  title-case forms are prose for the same objects. *Not stated.*
- **I-18:** `IC.` on tab IDs is a module prefix implying a per-module tab registry. *Not stated.*
- **I-19:** because `Report Deleted Orders` exists, deleted orders are probably retained. *The
  articles say the report lists them, not that the orders persist.*

## I. Unknown unknowns

1. **A configuration layer beneath the settings screens.** `BMW_ACF` and `IC.*.TAB` are two
   sightings. We cannot enumerate it by reading, and it is the audit's largest standing risk.
2. **Screens with no menu path.** At least one exists; we cannot count them.
3. **Recently added, thinly documented modules.** Rewards is one. Article-ID magnitude is a usable
   heuristic — apply it in runs 04–06.
4. **What actually clears each hold type.** F153 gave us one. The other four hold codes' release
   conditions are undocumented.

## J. Glossary

Consolidated across batch files. Key additions this run: `CWC` (Customer Will Call) · `ASAP` ·
`BTA` (delivered business) · `DAILY.DETAIL` · Received/Returned Not Recorded · Dynamic Tab
Settings · Tab ID · ATP · `VAMOO`/`VAMOOL` · Written Business · GL Recap · Reward Balance ·
Rebate Mode · Pmt Adj xxxxx · P-Plan {code}.

---

## Contract adjudication — run 03

| Contract | Verdict |
|---|---|
| `W-005` / `W-006` *(special order, direct ship)* | **CONFIRMED** — sales side; direct ship creates AP bill and closes PO (F8, F55–F63) |
| `W-012` *(dates and periods)* | **CONFIRMED** — EOD and EOM both change state, not just print (F153, F145, F160) |
| `W-024` *(holds)* | **CONFIRMED and materially extended** (F153, F139) |
| `W-028` *(gift certificates)* | **CONFIRMED, extended** (F51, F162) |
| `W-030` *(financing)* | **CONFIRMED** — authorisations survive order deletion (F85–F95, F161) |
| `W-034` *(deletion)* | **CONFIRMED** (F59, F161) |
| `W-039` *(exceptions)* | **CONFIRMED, with semantics we had not assumed** (F130, F154) |
| `W-041` *(cost)* | **CONFIRMED** — cost exception resolution surfaces as negative margin (F144) |
| `W-042` *(PO↔SO propagation)* | **run 02's contradiction stands.** Nothing in Sales Processing reverses it; the sales side is the *recipient*, and for stock products the system posts a message for a human rather than propagating |
| `W-046` *(vendor rebates)* | **CONFIRMED** (F163) |
| `W-050` *(access control)* | **inverted — upheld a fourth time** |
| `W-052` / `W-053` *(GL consequences)* | **CONFIRMED** — the sales side is where the postings finally appear (F38, F64, F140, F143, F159) |
| `W-055` / `W-056` *(availability, reservation)* | **CONFIRMED; availability count revised to nine** (F3, F157) |
| `W-061` *(cost and margin)* | **CONFIRMED — and it closes run 02's central open question** (F144) |
| `W-064` *(retention)* | **CONFIRMED** — fourth complete file→setting→purge chain (F160) |
| **NEW — no contract covers these** | screen composition / Dynamic Tab Settings (F155, F156) · membership rewards (F158) · the Up System's separate end of day (F106) · customer merge as a subsystem (F77–F79) · address verification via licensed third parties (F80) |

---

## If we rebuilt Sales Processing from only what we read, what would we get wrong?

We would get the shape right and the timing wrong.

The screens, the fields, the enumerations, the discount hierarchy, the tax algorithm — those are
documented well enough to rebuild from. What the documentation consistently under-describes is
**when things become true**. We would build a system that releases a credit hold at the moment a
manager approves it, because that is obviously correct, and we would be quietly incompatible with
every downstream process that STORIS tuned around a hold surviving until the nightly run. We would
book margin at the moment of sale, because that is obviously correct, and we would lose the entire
cost-restatement mechanism that makes STORIS margins provisional until somebody works the cost
exception queue. We would post returns to the ledger when the return is entered, because that is
obviously correct, and STORIS does not post them until completion. Three times, the obviously
correct choice is the one that breaks parity.

We would also underestimate how much of this system is *configuration rather than code*. We now
have two independent sightings — `BMW_ACF` and the `IC.*.TAB` components — of a layer beneath the
settings screens that the help centre never describes, and one documented screen that exists only
as a Dynamic Tab Settings page with no menu path at all. Our screen and field inventory is a lower
bound. Any requirements conversation that starts "show me the screens you use" will surface fields
we have no record of, and we should expect that rather than treat it as a discovery failure.

We would get the exception model backwards. Two things in this ERP are called "exception" and they
behave in opposite ways: the **cost** exception queue is a work queue that clears when you resolve
it, and the **sales** exception log is an append-only record of encounters that re-records on every
re-access and never retracts when the condition is cured. Build either one with the other's
semantics and the resulting numbers are meaningless — one becomes an unclearable backlog, the other
a work queue that forgets what happened.

We would miss the unscheduled orders. `ASAP` and `CWC` are invisible to date-filtered searches, and
the documentation says so plainly. Any migration reconciliation, any parallel-run comparison, any
"did we move everything" query built on date ranges drops them silently — and they are, by
construction, the orders a customer is waiting on right now.

And we would build a loyalty programme by guessing. Membership rewards has points, balances,
programme terms, renewal dates and its own gift-certificate type, and three inquiry screens'
worth of documentation. Nothing tells us how a point is earned, what redeems it, whether redemption
is a tender, or what a renewal does to a balance. **This is the one area of Sales Processing where
more reading will not help.** It needs a direct question to STORIS, or an extract from the live
data, before anyone designs against it.

The honest summary: the documentation is a good specification of *state* and a poor specification
of *transitions*. Where it names a batch process, it is usually because that process changes
something — and those are the sentences we should treat as load-bearing.

---

*Run 03 complete. Next: run 04 — Logistics / Delivery.*
