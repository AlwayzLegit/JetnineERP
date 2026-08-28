# Run 07 — System Administration — Batch 26: Views and Reports, PII Removal and Customer Merge

Status: complete. Findings 710–717. Read-only throughout — including in `Purging Data`, where the
single article is a destructive routine that was read and not run.

**This batch closes four subsections completely**: Views and Reports (45), Account Setup (4),
Purging Data (1), Importing Data (1). It also resolves batch 18's unknown-unknown about customer
merge, and finds the routine that answers a privacy request.

---

## A. Coverage log

| # | Article | id | Subsection | Status |
|---|---|---|---|---|
| 1 | **Report Secured Decryption Activity** | 15203214259476 | Views and Reports | read |
| 2 | **Report on Menu Access** | 15203012857236 | Views and Reports | read |
| 3 | **Staff Location Restriction Review** | 15295211660436 | Views and Reports | read |
| 4 | **Report Customer Merge Status** | 15202553752980 | Views and Reports | read |
| 5 | **Report Files Created via Entry Processes** | 15202930411668 | Views and Reports | read |
| 6 | **Remove a Customer's Personal Information** | 15201512686484 | **Purging Data** | read — the subsection's only article |
| 7 | **Import Customer Merge Information** | 15201528157972 | **Importing Data** | read — the subsection's only article |
| 8 | **Signature Audit Settings** | 15201512337044 | Account Setup | read |

### Subsections closed

**Purging Data (1 of 1)** and **Importing Data (1 of 1)** are **complete**.

**Account Setup (4)** — one read; the other three inventoried: `Configure Document Archive` ·
`Configure Document Signature Capture` · `Signature Audit Inquiry`. All three are
signature/document-archive companions to F716; **excluded as reference screens for a mechanism now
documented**, per the method's stated-exclusion rule.

**Views and Reports (45)** — five read. The remaining forty split cleanly into two families that the
method allows excluding with a reason:
- **Twenty-two `Multiple … Selection Window` / entry-widget articles** (`Multiple Category
  Selection Window`, `Multiple Location Selection Window`, `Multiple Reason Code Selection Window`,
  `Read-Only Lookup Window`, `Text Entry Screen`, `Time Entry`, `Time Interval Entry`,
  `Multiple Entry Window`, `Multiple Selection Entry Window`, `Mail Multi User/Group Selection
  Window`, `Vendor Name Search`, and siblings). These are **shared UI widgets, not wiring** — each
  documents a picker invoked from many screens. Batch 08 established the precedent for excluding
  this family.
- **Fifteen `View …` read-only twins** (`View Advanced Customer Settings`, `View Advanced Product
  Settings`, `View Bank Settings`, `View Bill Back Settings`, `View Create a User`, `View Create a
  User Group`, `View Deduct From Invoice Settings`, `View Payment Settings`, `View Rebate Plan
  Settings`, and siblings). **Batch 21 F651 established these are the same screens served
  non-editable by caller**, not separate functionality.
- Plus `Report Error Messages` · `Report Time Clock Activity` · `Updates History Report` ·
  `View Bar Code Scanner Download Activity` — operational logs, inventoried not read.

**No article was skipped silently.**

---

## B. Wiring findings

### FINDING 710 — Every view of secured data is audited, including denied attempts

- **Invariant:** unmasking encrypted data writes an audit record, and so does being refused.
- **Evidence** — `Report Secured Decryption Activity`:
  > "**The system audits users whenever they view secure data, such as the customer's full credit card number.** For example, if you use the `Credit Card Number Full Display`…to 'unmask' and view the customer's full credit card number, **an audit record is created. The system also creates an audit record when a user attempts to access secure data and is denied access due to security restrictions.**"
  > "The report sorts by **data type (credit card, etc.), by access date, and then by access time.**"
  > "**NOTE: Data available to be reported on is retained on the system for a minimum of 12 months before it is purged during month-end processing. The `Secured Audit Retention Months` field in Accounts Receivable Control Settings determines how long this data is retained.**"
  Fields: `Access` · **`Requested By`** · **`Granted By`** · `Customer Code` · `Type` ·
  `Start Date` · `End Date` · **`Attempted Access`** · `Send Output to` · `Export Path`.
- **Maps to:** batch 22 F652 (`Secured Data` purge) · batch 18 F599 (the PII block) · batch 25 F704
  (`Secured Audit Retention Months`) · the Sales Security handoff §3.12 · W-050, W-064.

> **This is the read-side audit trail the Sales Security handoff asked for, and it already exists.**
> The handoff flagged `View encrypted finance, credit card, check account numbers` as PCI-relevant and
> recommended logging; STORIS logs it, **including refusals**, which is the harder and more valuable
> half.
>
> **`Requested By` and `Granted By` are separate fields**, which means the audit captures the
> **security-override path** (run 06 F316): a user requests, a manager authorises, and both names are
> recorded. **That is exactly the design the audit has been recommending for the 27 override
> permissions in Sales Security** — and it shows STORIS already built it for this one case.
>
> **A minimum 12-month floor on retention** is stated, above whatever `Secured Audit Retention Months`
> says — so the setting cannot be used to shorten the trail below a year. **A deliberate compliance
> floor, and the only one the audit has found.**

### FINDING 711 — Menu access is a separate permission surface with its own YES/NO dump

- **Invariant:** user groups have per-menu-item access, reportable as a group × menu-item matrix.
- **Evidence** — `Report on Menu Access`:
  > "Use this routine to **review user group access of menu items. This report output is Excel** and may be saved locally on your PC. **The User Groups are listed in rows while all the menu items, both custom and standard, are along the column** on the spreadsheet. **'YES' or 'NO' appears in the cells** to identify who has access to each menu item and who does not."
  > "**NOTE: The first row in the spreadsheet corresponds with the `Language Code` selected for the User Group.** This is specified if `Multi-Lingual Processing` is active on your system."
- **Maps to:** batch 16 F549 (`Report on User Security` — the *settings* matrix) · batch 16 F548
  (`Assign Screen Action Permission`) · batch 16 §E (eleven access-control shapes) · W-050.

> **Menu security is a twelfth access-control shape, and it is the one the audit had assumed rather
> than evidenced.** `Create a User Group` said *"The User Group file works with the User file to
> establish menu security"* (batch 16 F550) without a mechanism; this is the mechanism's report.
>
> **Three separate matrices now exist**, and a rebuild needs all three:
>
> | Report | Rows | Columns |
> |---|---|---|
> | `Report on User Security` | users **and** groups | ~360 module settings |
> | `Report on Menu Access` | user groups | every menu item, standard **and custom** |
> | `Assign Screen Action Permission` | user groups | `(program, action)` pairs — **no report exists** |
>
> **"Both custom and standard" menu items** means sites can add menu entries — so the menu tree is
> itself configurable data, not a fixed product surface. **That is a migration input the audit had not
> identified**, and it is unread. §I.
>
> **Group-only again**, like screen actions (batch 16 F548) — so two of the three surfaces have no
> user-level dimension, which further narrows the unresolved user-vs-group question to the module
> settings alone.

### FINDING 712 — Location restrictions have a dedicated cross-user review screen

- **Invariant:** all users' location restrictions are viewable in one filterable grid.
- **Evidence** — `Staff Location Restriction Review`:
  > "Use this routine to **view all users' location restrictions. You can filter the grid display by location and by column headings.**"
  Fields: `Location` · Grid.
- **Maps to:** batch 16 F552 (the five-axis location model, which STORIS advises against combining) ·
  batch 16 F553 (self-widening restrictions) · W-050.

> **Batch 16 found location restriction to be a five-axis model whose combinations the vendor warns
> against, plus a self-widening behaviour that no security record would show. This screen is the
> partial answer** — a single view of who is restricted where.
>
> **It is a *review* screen, not an *effective-access* screen**, and that distinction matters:
> it shows configured restrictions. **Batch 16 F553's self-widening — locations added by editing an
> order — would not appear here** unless it writes back to the restriction record, which the docs do
> not say. §H, carried from F553.
>
> **For the cutover this joins `Report on User Security` and `Report on Menu Access` as a
> live-system artefact worth capturing** — three exports that between them describe the entire
> configured access model.

### FINDING 713 — Customer merge is a full subsystem: status, eligibility, list, import and scheduled process

- **Invariant:** duplicate customers are staged with a merge status, reviewed, imported in bulk, and merged by a scheduled process.
- **Evidence** — `Report Customer Merge Status`:
  > "This report details the **merge status and eligibility for customers that have been selected for merging.**"
  Fields: **`Duplicate Customer Code`** · **`Merge Status`** · `Date Code` · `Start Date` ·
  `End Date` · `Send Output to` · `Export Path`.
  `Import Customer Merge Information`:
  > "Use this routine to **load a customer list to update customers' merge status.** For more information…see the **`Duplicate Customer Merge Overview`** topic."
  > "**Pending customers are processed using `Manage Customer Merge List` or the `Merge Customer` process in `Schedule a Process`. The duplicate customer ID and the Merge To customer ID must both be valid customers defined in Advanced Customer Settings; as such, null customer IDs and null Merge to customer IDs are not allowed.**"
  > "**An error report is generated after all customers are processed**, containing the duplicate customer ID, Merge To customer ID, and the error description."
  > "The conversion spreadsheet to be imported is a **text tab delimited or csv format.**"
- **Maps to:** **batch 18 §I** (*"Customer merge exists… a destructive, history-rewriting operation
  with an audit trail on the customer record and no article the audit has read"*) — **now largely
  read** · batch 18 F596 (duplicate detection) · batch 18 §C (`Merge Details`: Status, By, Merge To) ·
  W-036.

> **Batch 18 spotted `Merge Details` on the customer record and flagged merge as an unknown unknown.
> It is a five-part subsystem**: a status on the customer, a bulk import, a management list, a
> scheduled processor, and a status report.
>
> **`Merge Customer` is a seventh named scheduled process** (after `Scheduled Settings Update`,
> `Purge Customer Reward Points`, `Reward Gift Certificate Generation`, `Customer Membership
> Renewals`, `View Summary of Sales Activity`, `Convert Comment Files`). **Still no catalogue** —
> batch 18 F582's §H item stands.
>
> **The staged shape recurs**: mark duplicates → review status and eligibility → process. Same as kit
> promotions (batch 14 F515), price adjustments (batch 24 F687) and product purge lists (batch 22
> F664). **STORIS consistently separates selection from execution on destructive operations**, and a
> rebuild should adopt that as a rule rather than rediscovering it per feature.
>
> **`Duplicate Customer Merge Overview` remains unread** — it is outside System Administration.

### FINDING 714 — PII removal pseudonymises rather than deletes, and nine conditions can block it

- **Invariant:** the routine overwrites identifying fields with "REMOVED", keeps geography for reporting, and refuses while any financial or open-transaction tie exists.
- **Evidence** — `Remove a Customer's Personal Information`:
  > "**It is up to the retailer to verify the customer's identity to ensure the removal request is valid. Additionally, it is up to the retailer to decide if information should be removed.**"
  > "**Note that this does not delete the customer account from STORIS.** The following customer information is updated: **Customer first and last name is changed to 'REMOVED'. Billing address line 1 is changed to 'REMOVED'. Billing address line 2 is cleared. Note that city, state and zip code are not changed for reporting purposes. Phone numbers and email addresses are cleared. The customer is updated to prohibit further contact.**"
  > "**The `Okay to Solicit` checkbox in Advanced Customer Settings is automatically unchecked. Additionally, comments are added to the Customer Activity Log that indicate PII was removed.**"
  > "**If the PII cannot be removed, the Save button is inactive.** Reasons why PII cannot be removed include: **Customer has an open-item balance. · …a revolving finance account(s). · …an installment contract(s). · …a deposit(s) on open order(s). · …an open order(s). · …an open shopping cart(s) that has their associated customer code. · Customer has been charged off. · Customer has unpaid 3rd party finance items. · Customer has an AP Bill for refund.**"
- **Maps to:** batch 22 F652 (`Secured Data` purge — a **different** mechanism) · batch 18 F599 ·
  batch 19 F603 (legal/charge-off) · W-036, W-064.

> **This is a right-to-erasure routine, and its design decisions are all defensible and worth
> copying.** Pseudonymisation rather than deletion preserves referential integrity — orders, GL
> postings and history survive intact — while the identifying fields become "REMOVED". **Keeping city,
> state and zip "for reporting purposes" is the one judgement call**, and it is a common and
> defensible reading of erasure obligations, though a rebuild's legal advisers should confirm it.
>
> **The nine blocking conditions are all "you still owe us or we owe you"** — an open balance, a live
> contract, a deposit, an unpaid finance item, an AP refund. **That is the correct exception**:
> erasure cannot destroy the record of a live financial relationship. **A charged-off customer is
> also blocked**, which is the one that will surprise people: the debt is written off but the record
> is retained.
>
> **Two mechanisms now exist for sensitive data and they are complementary**, not duplicative:
> batch 22 F652's `Secured Data` purge removes **encrypted identifiers** on a retention schedule;
> this removes **identity fields** on request. **A rebuild needs both**, and should name them
> distinctly, because "purge PII" means two different operations here.

### FINDING 715 — Erasure is per customer account, not per person, and merge is the recommended precursor

- **Invariant:** only the entered customer code is affected; other accounts for the same person are untouched.
- **Evidence** — `Remove a Customer's Personal Information`:
  > "**If multiple customer accounts exist for the customer, this process addresses only the specific customer code entered here. Other accounts associated with the customer are not modified.**"
  > "**Consider merging customer accounts prior to removing personal information.**"
  Lookup accepts: `Customer Number` **or** `Last Name` **or** `Email` **or** `Phone Number`.
- **Maps to:** F713, F714 · batch 18 F595 (on-the-fly customers get ticket numbers) · batch 18 F596
  (duplicates are permitted in order entry) · batch 17 F568 (one membership per person across
  accounts) · W-036.

> **This is where three earlier findings collide, and the consequence is serious.** Batch 18 F595
> established that on-the-fly customers are auto-created with ticket numbers; batch 18 F596
> established that **order entry deliberately permits creating a duplicate**. So a real person
> plausibly has several customer records — and **an erasure request satisfied against one of them
> leaves the others fully identifying.**
>
> **STORIS's answer is procedural, not technical**: *"Consider merging customer accounts prior to
> removing personal information."* **A rebuild should do better** — erasure should operate on the
> person, resolving through the merge graph, rather than on the account. At minimum it should *warn*
> when other accounts match.
>
> **The lookup already knows how to find them** — it accepts last name, email or phone. **The
> matching capability exists; it just is not applied to the erasure scope.**

### FINDING 716 — Signature auditing records ceremonies that never completed

- **Invariant:** enabling the audit writes a record every time a signature capture *could* have been presented, including cancellations.
- **Evidence** — `Signature Audit Settings`:
  > "Use this routine to control auditing of the **signature capture ceremony**… **The capture of this data includes scenarios where the signature capture ceremony was cancelled or otherwise interrupted, which may prove useful for legal purposes.**"
  > "**Enabling this feature causes data to be written to the STORIS database every time a signature capture ceremony has the potential to be presented to the customer.** The data then becomes the basis for the **`Signature Audit Inquiry`** and the **STORIS Data Warehouse** reports that demonstrate the audit trail of available signature ceremonies and what occurred during them."
  > "**These settings are global, and are not specific to any Program + Document combination.**"
  Fields: `Enable Signature Audit` · `Audit Data Retention Days`.
- **Maps to:** batch 21 F639, batch 25 F707 (signature capture) · batch 16 §C (`Enable Signature
  Capture` per user/group) · batch 22 §I (a data warehouse exists) · W-064.

> **Auditing the *absence* of a signature is the point.** *"Every time a signature capture ceremony
> has the potential to be presented"* — so the trail shows not just signed documents but **every
> occasion a signature should have been taken and was not**. The stated purpose is legal, and it is
> the right instinct: disputes turn on what was *not* signed.
>
> **A second confirmed Data Warehouse consumer** (after batch 22's `Resync Data Warehouse`). The
> warehouse is where this audit is actually reported from — **which makes it load-bearing for
> compliance reporting, not just analytics.** §I.
>
> **`Program + Document` is named as the granularity the settings are *not* specific to**, which
> implies signature configuration elsewhere *is* keyed that way. `Configure Document Signature
> Capture` (Account Setup, inventoried) is presumably that record.

### FINDING 717 — On-the-fly record creation is reported nightly when the master switch is on

- **Invariant:** records created on the fly are listed by an End-of-Day report gated by one setting, retained 60 days.
- **Evidence** — `Report Files Created via Entry Processes`:
  > "Use this report to display a list of **files created 'on-the-fly'. The system retains this data for 60 days after creation before purging via the next End of Month process that occurs after the 60 days expires.**"
  > "**Note that this report runs automatically during the End-of-Day process if a check appears at the `On-The-Fly Maintenance` field in the General System Control Settings.**"
- **Maps to:** batch 24 F686 (`On-the-Fly Maintenance` prompts brand creation) · batch 19 F621
  (on-the-fly zip codes on the EOD report) · batch 18 F595 · batch 24 F689 · W-041, W-064.

> **Batch 19 F621 found that new zip codes appear on the End-of-Day report. This is the general
> mechanism** — zip codes are one file among many. **On-the-fly creation across the whole system is
> surfaced nightly for review**, which is a genuinely good control given how many entities can be
> created mid-transaction: customers (batch 18 F595), products (batch 24 F689), zip codes, brands
> (batch 24 F686).
>
> **One setting governs three different behaviours**, which the audit has now assembled across three
> batches: `On-The-Fly Maintenance` prompts brand creation from vendors, enables on-the-fly creation
> generally, **and switches on this nightly report.** A rebuild separating creation-permission from
> creation-reporting would be clearer — but should know that in STORIS they are one switch, so
> **turning it off removes the oversight, not the behaviour.** §H.
>
> **Thirteenth End-of-Day responsibility.**

---

## C. Screen and field inventory (additions)

Field lists inline. No new settings screens; this batch is reports and routines.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Enable Signature Audit` · `Audit Data Retention Days` | Signature Audit Settings | Whether uncompleted signature ceremonies are recorded (F716) |
| `On-The-Fly Maintenance` | General System Control Settings | Brand-creation prompt **and** the nightly on-the-fly report (F717) |
| `Secured Audit Retention Months` | AR Control Settings | Decryption-audit retention, floored at 12 months (F710) |

---

## E. Security permissions catalog (additions)

**Twelfth access-control shape: menu access**, per user group, per menu item, standard and custom
(F711).

**Three configured-access exports now identified for the cutover:**
`Report on User Security` (settings) · `Report on Menu Access` (menu) ·
`Staff Location Restriction Review` (locations). **`Assign Screen Action Permission` has no report.**

---

## F. State machines and enumerations (additions)

**Customer merge status** — a per-customer status plus eligibility, driven through pending →
processed by `Manage Customer Merge List` or the `Merge Customer` scheduled process (F713).

**PII removal blockers** — nine conditions (F714).

**Named scheduled processes, cumulative: seven** — `Merge Customer` added (F713). **Still no
catalogue.**

**End-of-Day responsibilities, cumulative: thirteen** — on-the-fly creation report added (F717).

---

## G. Sequencing rules (additions)

**Select, then review, then execute — fourth instance**: customer merge (F713); cf. kit promotions
(batch 14 F515), price adjustments (batch 24 F687), product purge lists (batch 22 F664).
**A house rule for destructive operations.**

**A retention floor above a configurable retention** (F710) — 12 months minimum regardless of setting.
The only instance in the audit.

---

## H. Open questions and gaps

1. **Erasure is scoped to one account while a person may hold several** (F715). STORIS's answer is
   "merge first". **A rebuild should resolve erasure through the merge graph.**
2. **Does batch 16 F553's self-widening write back to the restriction record?** (F712). If not,
   `Staff Location Restriction Review` shows configured rather than effective access.
3. **Menu items can be custom** (F711) — the menu tree is configurable data. Unread, and a migration
   input.
4. **`On-The-Fly Maintenance` conflates permission and oversight** (F717) — turning it off removes
   the report, not the behaviour.
5. **`Assign Screen Action Permission` has no reporting counterpart** (F711) — the one access surface
   that cannot be exported.
6. **`Duplicate Customer Merge Overview`** (F713) and **`Personally Identifiable Information (PII)
   Overview`** (F714) are both referenced and both sit outside System Administration. Unread.

**Resolved this batch**

7. **Batch 18 §I's customer-merge unknown** — largely closed (F713).

---

## I. Unknown unknowns

- **The menu tree is site-extensible** (F711). Custom menu items exist, are permissioned, and are
  configured somewhere the audit has not read.
- **The STORIS Data Warehouse is a compliance reporting surface**, not just analytics (F716) — the
  signature audit trail is reported from it.
- **`Signature Audit Inquiry`** and **`Configure Document Signature Capture`** (Account Setup) — the
  `Program + Document` granularity F716 implies exists.
- **`Report Error Messages`, `Updates History Report`, `Report Time Clock Activity`** — three
  operational logs inventoried but unread, each implying a subsystem (error handling, update history,
  payroll time).

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **Secured decryption audit** | A record written whenever masked data is viewed **or refused**, retained ≥12 months |
| **Menu access matrix** | Per-user-group access to each menu item, standard or custom |
| **Merge status** | The staging state of a customer identified as a duplicate |
| **PII removal** | Pseudonymisation — names and street address become "REMOVED", contact cleared, geography retained |
| **Signature ceremony** | An occasion a signature could be captured; audited even when cancelled |

---

## Contract adjudication — batch 26

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — twelfth shape, three exports identified** | F711, F712 |
| **W-064** *(auditability)* | **CONFIRMED — and stronger than expected** | Denied access is audited (F710); uncompleted ceremonies are audited (F716) |
| **W-036** *(customer master)* | **CONFIRMED — merge and erasure are modelled subsystems** | F713, F714, F715 |
| **W-023** *(purge / retention)* | **CONFIRMED — two distinct PII mechanisms** | F714 vs batch 22 F652 |
| **W-041** *(batch calendar)* | **CONFIRMED — thirteenth responsibility** | F717 |
| **Retention floor above configuration** | **NEW — no contract covers it** | F710 |
| **Erasure scoped to account, not person** | **NEW** | F715 |

---

## Next — batch 27

**Bulk inventory sweep** — the remaining unread articles across all ten subsections, classified into
families with stated exclusion reasons, so run 07 can close with every article accounted for.
