# Run 01 — Accounting — Batch 24: GL Reports and Inquiries

11 articles. Per the run card, reports are read **for what each one reconciles against**. Two here
are load-bearing: `Report Posted Transactions` (the daily GL detail, with a four-way EOD switch) and
`Report Reconciliation of Inventory to GL Values` (the inventory-to-GL tie-out).

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 248 | Generate a Trial Balance (GL) | /articles/15202946031892 | EXTRACTED |
| 249 | Report Consolidated Trial Balance | /articles/15202504950420 | EXTRACTED |
| 250 | **Report Posted Transactions** | /articles/15203112898068 | EXTRACTED |
| 251 | Report End of Year GL Adjustments | /articles/15202742734228 | EXTRACTED — thin |
| 252 | **Report Reconciliation of Inventory to GL Values** | /articles/15203113110036 | EXTRACTED |
| 253 | Report Account Budgeted Variances | /articles/15202503962516 | EXTRACTED |
| 254 | View Account Activity | /articles/15295155897236 | EXTRACTED |
| 255 | View Individual Postings | /articles/15295156691732 | EXTRACTED |
| 256 | View Multiple Postings | /articles/15295212741268 | EXTRACTED |
| 257 | GL Account Lookup | /articles/15294752103444 | EXTRACTED |
| 258 | Mapping Update Audit Report | /articles/15203012634772 | EXTRACTED — **misfiled, see Finding 280** |

Newly discovered, queued: `View a Journal Entry`, `Costing Control Settings`
(`Inventory-G/L Reconciliation Audit`, `Inventory G/L Recon EOD Report`), `GL Account Security`,
`Generate Daily Reports`, `RouteView` / `Advanced Dispatch Track`.

---

## B. Wiring findings

### FINDING 275 — Daily GL detail reporting has a four-way End-of-Day switch, one of which suppresses records
Trigger:    End-of-Day, or on demand
Producer:   `Report Posted Transactions` — lists all GL transactions posted since the last EOD cycle,
            for a date range, or the detail of one or more batches
Config:     **`End-of-Day Posted Transactions`** in `General Ledger Control Settings` selects one of:
  1. generates as part of End-of-Day, reporting **all** transactions
  2. generates as part of End-of-Day, reporting **only manual** transactions
  3. **does not** generate automatically
  4. **"suppresses the report AND the generation of the GL Post Register records"**
Layout:     sorts by company and **GL source** with breaks and subtotals; each company on a new page;
            a **GL account summary** after each company total; header comment **or** line remarks,
            not both; line comments print if present
Multi-doc:  "If multiple documents are linked to a posting, the Document column displays the first
            document number and then '…'"
Evidence:   Report Posted Transactions, /articles/15203112898068
Maps to:    **W-054 — CONTRADICTED**, and it answers batch 1's undescribed control setting

> Option 4 is the finding. A single control setting can suppress **the generation of the GL Post
> Register records themselves** — not just the report. If that setting is on, the daily audit trail
> of GL postings does not exist to be reported later. **Check this on the live system before
> cutover**; it determines whether historical daily GL detail is reconstructable at all.
> Note also that a posting can link to **multiple documents**, which the reference-field model from
> batch 1 (one primary, one secondary) does not obviously accommodate.

### FINDING 276 — Inventory-to-GL reconciliation exists, is opt-in, and reports cost-change deltas
Producer:   `Report Reconciliation of Inventory to GL Values` — "research discrepancies between the
            **sales-side inventory valuation** and the **general ledger inventory value**"
Scope:      on demand for a date range, or "**since the last `Generate Daily Reports` (Day Ending/EOD)**"
Three versions:
  - **Summary** — totals by transaction classification, each increasing or decreasing inventory;
    "By looking at the bottom line you can determine if a problem exists"
  - **Detail** — per transaction: **Old Cost** (before) · **New Cost** (after) ·
    **Cost Change GL** ("the exact dollar value of the cost change to inventory value") ·
    **Cost Used** ("the amount posted to GL")
  - **Audit** — "detailed cost change information for **each piece and costing layer**"
Config:     **`Inventory-G/L Reconciliation Audit`** in `Costing Control Settings` must be checked
            "Otherwise, the system **does not collect all the data** pertinent to the report";
            `Inventory G/L Recon EOD Report` adds it to the Day-Ending run
Evidence:   Report Reconciliation of Inventory to GL Values, /articles/15203113110036
Maps to:    **W-010 — CONFIRMED with a caveat**, **W-061 — CONFIRMED**

> Two columns matter: **`Cost Change GL`** (what inventory value actually moved) versus
> **`Cost Used`** (what was posted to the GL). The report exists precisely because these can differ.
> That is direct evidence for batch 4's conclusion that variances are absorbed into inventory cost
> rather than booked — and this is the report that finds them.
>
> The caveat is severe: the audit data is **only collected if a control setting is on**. If it has
> been off, historical inventory-to-GL differences cannot be explained retrospectively. Add it to
> the pre-cutover checklist alongside `End-of-Day Posted Transactions` and `Track Settings Activity`.
> Note "**each piece and costing layer**" — STORIS costs at piece level with layers, confirming the
> piece-level identity found in the LET documents (batch 11).

### FINDING 277 — The GL account inquiry is a six-level drill-down over one account
Producer:   `View Account Activity` — tabs Summary and Detail
Drill-down levels (in order): **sub-account → cost center → period → source → week (if on a weekly
            calendar) → day**
Navigation: Next / Previous move one level; the Level field allows jumping directly to any level,
            higher or lower, and selecting a grid row narrows the next level to that selection
Detail:     the Detail tab shows batch postings for whatever the Summary tab currently shows;
            selecting a line opens **`View a Journal Entry`** with **document drill-down**
Evidence:   View Account Activity, /articles/15295155897236
Maps to:    NEW — the reference implementation for GL drill-down

> This is the best-designed inquiry found in the run and worth copying wholesale: one account, six
> orthogonal aggregation levels, free navigation between them, and a drill-through to the source
> document. Note the **weekly calendar** option — a fiscal calendar variant not mentioned in the
> period model (batch 1).

### FINDING 278 — Posting inquiries are permission-scoped at the account level, two different ways
`View Individual Postings` — read-only twin of `Post/Update a Journal Entry`;
            "To view postings, you must have **inquiry permissions** to view the account(s)
            established in `General Ledger User Permissions`"
`View Multiple Postings` — searches posted GL batch **history** by company, source, account,
            sub-account, cost center, remark, amount, document, date range, summary batch;
            "The GL account fields below may be affected by **GL Account Security**"
Evidence:   View Individual Postings, /articles/15295156691732 · View Multiple Postings, /articles/15295212741268
Maps to:    **W-050 — refines it** — a **twelfth** access-control mechanism name

> `GL Account Security` here, `GL Account Staff Security` in batch 1, `General Ledger User
> Permissions` throughout. Three names for what is probably one thing, applied inconsistently
> (entry vs inquiry vs report parameters). This is now the clearest example of why `W-050` is
> inverted: the *capability* exists everywhere, the *naming and coverage* is ad hoc.

### FINDING 279 — Trial balances consolidate by account element, and one of them is not a GL report
`Generate a Trial Balance (GL)` — reports open **or closed** fiscal periods;
            **Element Consolidation** (root account / sub-account) and **Summary Level**
            (e.g. period summary); at root+period it "sorts and subtotals by **account class,
            account sub-class, account group, and account**", consolidating all sub-accounts and
            cost centers into the root
`Report Consolidated Trial Balance` — **not a GL report**: "a summary version of the **Aged Trial
            Balance by customer** … The summary version does not include customer information; it
            only includes information by **store location**." Subject to Regional Processing.
Evidence:   Generate a Trial Balance (GL), /articles/15202946031892 · Report Consolidated Trial Balance, /articles/15202504950420
Maps to:    NEW — plus a naming trap

> `Report Consolidated Trial Balance` sounds like multi-company GL consolidation and is actually a
> **customer AR aging summary by store**. Third title/content mismatch in the run (after
> `Restricted Payment Type Entry`, batch 5, and `Enter Additional Revolving Payments`, batch 18).

### FINDING 280 — `Mapping Update Audit Report` is a delivery report filed under Accounting
Content:    "report on orders that were **not added to the manifest**" — appears only when a
            third-party mapping interface (**RouteView**, **Advanced Dispatch Track**) is active;
            routing happens in the third-party system and is transferred back to STORIS to build a
            manifest, and orders can fail to be added
Parameters: Location (one only) · Scheduled Date (delivery date) · Download Date ·
            Report (**All** or **New** — updates since last run)
Evidence:   Mapping Update Audit Report, /articles/15203012634772
Maps to:    **out of scope for Accounting; belongs to run 4 (Logistics/Delivery)**

> Recorded here because it is in the Accounting section's article list and would otherwise appear as
> an unexplained gap in the coverage log. It has no accounting content. Worth flagging to whoever
> builds the run 4 pack — a delivery-manifest failure report they would not find by section browsing.

### FINDING 281 — Budget variance reporting is gated by a named permission section
Gate:       "the user must have permission via the **`Inquiry/Report Restrictions` section** in
            `General Ledger User Permissions`"
Comparison: budgeted vs actual **on a period basis**, by company / fiscal year / period / account /
            sub-account / cost center, with Sort/Page Break
Evidence:   Report Account Budgeted Variances, /articles/15202503962516
Maps to:    **W-050 — refines it** — `General Ledger User Permissions` has internal sections

> So `General Ledger User Permissions` is structured: at least an entry/inquiry account-restriction
> part and an **Inquiry/Report Restrictions** part. That makes the batch-1 finding ("not enforced in
> control or settings routines") more precise: it is a multi-section permission file with uneven
> application, not a single flag.

### FINDING 282 — Account lookup searches on classification, element or description
Producer:   `GL Account Lookup` — Account Group · Account Subclass · Account Class · Account ·
            Sub-Account · Description · Search; an empty search returns **all** accounts
            ("this may take a minute or two")
Companion:  `GL Account Description Lookup` (logged, same family)
Evidence:   GL Account Lookup, /articles/15294752103444
Maps to:    confirms the Class / Sub-Class / Group hierarchy from batch 1 is a live search dimension

---

## C. Screen and field inventory

**Generate a Trial Balance (GL)** — Company · Fiscal Year · Period · Account · Sub-Account ·
Cost Center · Account Group · Account Sub-Class · Account Class · **Element Consolidation** ·
**Summary Level** · Primary/Secondary/Tertiary Sort · Send Output to · Export Path.

**Report Consolidated Trial Balance** — Date Code · As Of Date · Send Output to · Export Path.

**Report Posted Transactions** — Posted Since Last End-of-Day · Batch · Date Code · Start Date ·
End Date · Source · Company · Account · Sub-Account · Cost Center · Summary Only ·
Send Output to · Export Path.

**Report End of Year GL Adjustments** — Company · Fiscal Year · Summary Only ·
Primary/Secondary/Tertiary Sort · Send Output to · Export Path.

**Report Reconciliation of Inventory to GL Values** — Location · Category · Group ·
System/Transaction Date · Date Code · Start/End Date · **Report Type** (Summary/Detail/Audit) ·
Primary/Secondary/Tertiary Sort · Send Output to · Export Path.
Detail columns: Old Cost · New Cost · Cost Change GL · Cost Used.

**Report Account Budgeted Variances** — Company · Fiscal Year · Period · Account · Sub-Account ·
Cost Center · Sort/Page Break · Send Output to · Export Path.

**View Account Activity** — Fiscal Year · Company · Account · Balance · Level · Previous · Next ·
tabs Summary and Detail.

**View Individual Postings** — read-only twin of `Post/Update a Journal Entry` (fields as batch 1).

**View Multiple Postings** — Company · Source · Account · Sub-Account · Cost Center · Remark ·
Amount · Document · Start Date · End Date · Summary Batch · Grid.

**GL Account Lookup** — Account Group · Account Subclass · Account Class · Account · Sub-Account ·
Description · Search.

**Mapping Update Audit Report** — Location · Scheduled Date · Download Date · Report (All/New).

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| End-of-Day Posted Transactions | General Ledger Control Settings | Four-way: all / manual only / not automatic / **suppress report and GL Post Register records** |
| Inventory-G/L Reconciliation Audit | Costing Control Settings | **Collects** the data the inventory-to-GL report needs |
| Inventory G/L Recon EOD Report | Costing Control Settings | Adds the reconciliation to the Day-Ending run |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Inquiry/Report Restrictions (section) | General Ledger User Permissions | `Report Account Budgeted Variances` and presumably other GL reports |
| inquiry permissions on account(s) | General Ledger User Permissions | `View Individual Postings` |
| GL Account Security | *(a twelfth name)* | GL account fields on `View Multiple Postings` |

---

## F. State machines and enumerations

**Trial balance element consolidation** — root account · sub-account.

**Inventory-to-GL report types** — Summary · Detail · Audit.

**GL account activity drill-down levels** — sub-account · cost center · period · source · week · day.

**GL Post Register** — the daily posting record, suppressible by control setting.

**Fiscal calendar variants** — period-based, and a **weekly calendar** option.

---

## G. Sequencing rules (additions)

1. `Inventory-G/L Reconciliation Audit` must be on **before** the transactions occur, or the data is
   never collected.
2. `Report Posted Transactions` "since last EOD" is incremental and depends on the EOD switch.
3. Trial balances may be run for closed periods as well as open.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none.

**2. Documented but ambiguous**
- **`GL Post Register`** — named only here, as something a setting can suppress. What it is, where it
  lives, and what else reads it are unstated. **Given it may be the daily GL audit trail, chase it.**
- **Weekly calendar** — the drill-down offers a week level "if you are set to a weekly calendar".
  No article describes a weekly fiscal calendar; batch 1's period model is period-based only.
- **`Summary Batch`** on `View Multiple Postings` — named, undescribed.
- **`Cost Used` vs `Cost Change GL`** — the report distinguishes them but never says why they differ
  or which is authoritative. This is the crux of inventory-to-GL variance and deserves a direct
  question to STORIS.
- **Costing layers** — "each piece and costing layer" implies layered costing (FIFO/LIFO/specific);
  the costing method itself is in Inventory Management, already dissected.

**3. Inferences (not quotable, kept out of section B)**
- `GL Post Register` is very likely the per-posting audit rows that feed both this report and
  `Report Distribution to General Ledger`; not stated.
- `Cost Used` differing from `Cost Change GL` is presumably where PO-to-invoice variance lands
  (batch 4); not stated.
- `GL Account Security` and `GL Account Staff Security` are probably the same mechanism named
  loosely; not stated.

---

## I. Unknown unknowns (additions)

- **GL Post Register records**, suppressible by configuration.
- **Weekly fiscal calendar** as an alternative to periods.
- **Costing layers** at piece level.
- **`Cost Used` vs `Cost Change GL`** as distinct values.
- **Multi-document postings** ("first document number and then …").
- **RouteView / Advanced Dispatch Track** third-party routing interfaces.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| GL Post Register | Daily record of GL postings; can be suppressed with the report |
| Element Consolidation | Trial-balance option rolling sub-accounts/cost centers into the root |
| Cost Change GL | The exact dollar change to inventory value from a transaction |
| Cost Used | The amount actually posted to the GL for that change |
| Costing layer | A cost stratum on a piece of inventory |
| Inquiry/Report Restrictions | A named section within General Ledger User Permissions |
| GL Account Security | A twelfth access-control name, applied to inquiry account fields |
| View a Journal Entry | The drill-through target from account activity detail |
