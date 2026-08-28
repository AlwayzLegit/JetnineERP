# Run 01 — Accounting — Batch 10: Collections

10 articles. The collections workflow: queue → contact → promise → letter → reassign, with a
comment-file audit trail throughout.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 93 | Collector List Review *(Collector Review Process)* | /articles/15202310011796 | EXTRACTED |
| 94 | Collector Review - Customer Update Screen | /articles/15202277944212 | EXTRACTED |
| 95 | Assign Promise-to-Pay Screen | /articles/15202309863828 | EXTRACTED |
| 96 | Assign Contact Date and Time Screen | /articles/15202277788052 | EXTRACTED — thin |
| 97 | Assign Collections Letter Screen | /articles/15202277783060 | EXTRACTED — thin |
| 98 | Reassign Collector Screen | /articles/15202309865108 | EXTRACTED |
| 99 | Assign and Print Collections Letters | /articles/15202310014484 | EXTRACTED |
| 100 | Print Collections Letters | /articles/15202310010900 | EXTRACTED |
| 101 | Collections Activity Log | /articles/15295156268820 | EXTRACTED |
| 102 | Bad Debt Payment Entry Screen | /articles/15202277345556 | EXTRACTED — thin |

Newly discovered, queued: `Collector Settings`, `Collections Settings`, `Track Settings Activity`,
`Collections Comments file`, `Collector Comments file`, `Collector statistics file`,
`Customer Collections Review Log`, `User Defined Settings` entry screen,
`Advanced Customer Settings` (Point of Sale tab — account comments),
`Report Collector Efficiency`, `View Collector Performance`, `Payment History Profile`,
`Data Warehouse Control Settings`.

---

## B. Wiring findings

### FINDING 142 — The collector queue is function-scoped and colour-coded by alert
Trigger:    `Collector List Review`
Flow:       specify a **Collector** → their assigned customers populate the grid → choose a
            **Function** → choose a customer → `Collector Review - Customer Update Screen`
Header totals: Number of Accounts · Total Amount Due · Total Past Due · **Total Promised to Pay**
Alerts:     "customers in **red or yellow** indicate an alert condition"
UI note:    "The title of this screen may vary based on your selection at the Function field."
Buttons:    Delete and Save are **inactive**; Clear refreshes; Exit "transfers control back to the
            menus while retaining all current updates"
Evidence:   Collector List Review, /articles/15202310011796
Maps to:    NEW

> Note the header aggregates a **Total Promised to Pay** — promises are tracked as a portfolio
> figure, not just per account. That is a real collections KPI our model should carry.

### FINDING 143 — Six collector actions, all of which write to the Collections Comments file
Trigger:    `Collector Review - Customer Update Screen`
Actions:    assign a **promise-to-pay** date and amount · assign a **call back** date and time ·
            request **collections letters** · update **collector comments** · **reassign** the
            customer to a different collector (or remove from Collections) · **review collector performance**
Invariant:  every one of the assign screens states that its result "appear[s] in the customer's
            **Collections Comments file**"
Pop-ups:    account comments from `Advanced Customer Settings` → Point of Sale tab display on entry;
            `User Defined Settings` displays automatically if
            `Collector Review; Automatic Display of Customer User Defined Settings` is enabled
Evidence:   Collector Review - Customer Update Screen, /articles/15202277944212
Maps to:    **W-053 — partially CONFIRMED** (comment-level, not value-level, audit)

### FINDING 144 — Promise-to-pay is tracked to fulfilment, not just recorded
Payload:    **Date · Amount · Collected · Amount Remaining**
Evidence:   Assign Promise-to-Pay Screen, /articles/15202309863828
Maps to:    NEW

> `Collected` and `Amount Remaining` mean the promise is reconciled against actual payments. That
> is the mechanism behind `Total Promised to Pay` and `Report Collector Efficiency`.

### FINDING 145 — Manual collector reassignment is gated per collector, not per user
Trigger:    `Reassign Collector Screen`
Invariant:  "This screen is active only for collectors whose **`Allow Manual Assignment`** field in
            the `Collector Settings` is enabled."
Also:       the same screen removes a customer from Collections entirely
Evidence:   Reassign Collector Screen, /articles/15202309865108
Maps to:    NEW — a permission attached to the *subject* (the collector) rather than the *actor*

> Unusual and worth noting: the gate is a property of the collector record, implying most collector
> assignment is automatic and only some collectors accept manual assignment. The automatic
> assignment rule itself is undocumented — see section H.

### FINDING 146 — Mass letter assignment is additive and never overwrites
Trigger:    `Assign and Print Collections Letters`
Selection:  District · Store Location · Collector · **Past Due Days From/To (mandatory)** ·
            Minimum/Maximum Past Due $ (optional) · Letter · Print Now
Invariant:  "For customers with letters already assigned to them, this process assigns the letters
            you specify here and **does not overwrite the existing assignments**."
Side effects: "the system updates the **Collector statistics file** and posts comments to the
            **Collector Comments file**"
Output:     Excel export (one row per customer) for mail-merge, **or** XML for Enhanced Laser Printing
Evidence:   Assign and Print Collections Letters, /articles/15202310014484
Maps to:    NEW

### FINDING 147 — The collections letter payload is a 40-field customer credit snapshot
Fields passed to the export file or Forms Designer (verbatim, both letter routines):
Customer Name · Address Line 1 · Address Line 2 · City · State · Zip Code · Home Telephone Number ·
Work Telephone Number · Cell Phone · Email Address · Credit Limit · Occupation · Employer ·
Employer Address 1 · Employer Address 2 · Co-Applicant Name · Co-Applicant Employer · Cosigner ·
Cosigner Address 1 · Cosigner Address 2 · Cosigner Occupation · Cosigner Employer ·
**Long Term Revolving Balance · Open Item Balance · Total Account Balance · Current Due ·
Past Due 1 to 30 · Past Due 31 to 60 · Past Due 61 to 90 · Past Due 91 to 120 ·
Past Due Finance Fees · Past Due Insurance · Past Due Interest · Past Due Late Fees ·
Past Due Principal** · Last Payment Amount · Last Payment Date · Last Purchase Amount ·
Last Purchase Date · Promise to Pay Date · Promise to Pay Amount
Evidence:   Assign and Print Collections Letters, /articles/15202310014484 · Print Collections Letters, /articles/15202310010900
Maps to:    **W-054 — adjacent**, and it **defines the aging model**

> This list is the most precise statement of STORIS's AR aging anywhere in the run:
> **four 30-day buckets (1–30, 31–60, 61–90, 91–120)** and a **five-way past-due composition**
> (principal, interest, insurance, late fees, finance fees). It also confirms the two-ledger split
> from batches 7 and 8 by exposing `Long Term Revolving Balance` and `Open Item Balance` separately
> alongside `Total Account Balance`. Build our aging to match these buckets exactly or migrated
> collections queues will not reproduce.

### FINDING 148 — Two letter routines share one payload but differ in selection
Trigger:    `Assign and Print Collections Letters` vs `Print Collections Letters`
Difference: the assign routine selects by past-due days/amount and **assigns** a letter;
            the print routine selects by District · Store Location · Collector · Letter and only prints
Shared:     identical 40-field payload; identical Excel/XML output modes
Path examples given: `C:\Folder1\Folder2` and `\\servername\folder1\folder2`
Evidence:   Print Collections Letters, /articles/15202310010900
Maps to:    NEW

### FINDING 149 — Collections changes are logged, but settings changes only if opted in
Trigger:    Any change to Collections records
Producer:   `Collections Activity Log` — "an internal file STORIS uses to track changes to
            Collections records", plus manual comments
Invariant:  "To include changes to the **Collections Settings** in this log, you must select the
            Collections file in the **`Track Settings Activity`** routine."
Evidence:   Collections Activity Log, /articles/15295156268820
Maps to:    **W-053 — CONTRADICTED**

> Settings-change auditing is **opt-in per file**. `W-053` says master-data changes write audit
> rows; in STORIS that is true for records by default and for *configuration* only if someone
> switched it on. Configuration drift is the hardest thing to reconstruct in a migration, so this
> is worth checking on the live system before cutover: is `Track Settings Activity` on for the
> files we care about?

### FINDING 150 — Charged-off accounts still accept payments through a dedicated screen
Trigger:    `Enter a Customer Payment` → Actions → Bad Debt
Producer:   `Bad Debt Payment Entry Screen` — "apply the money being received as a payment to an
            account that has been **charged off**"
Related:    batch 5, Finding 69 (oldest-to-newest allocation across revolving plans);
            batch 7, Finding 109 (take-a-payment is the only active button on a closed account)
Evidence:   Bad Debt Payment Entry Screen, /articles/15202277345556
Maps to:    NEW (consistent)

---

## C. Screen and field inventory

**Collector List Review** — Collector · Function · Number of Accounts · Total Amount Due ·
Total Past Due · Total Promised to Pay · Grid · Actions. Buttons: Delete (inactive) ·
Save (inactive) · Clear · Exit.

**Collector Review - Customer Update Screen** — Customer · Due · Credit · Last Contact · Collector ·
Payment · Monthly Statement Performance · Action · Actions.
Buttons: Reassign · Promise · Letter · Comments (→ Customer Collections Review Log) · Contact.

**Assign Promise-to-Pay Screen** — Date · Amount · Collected · Amount Remaining.

**Assign Contact Date and Time Screen** — Date · Time.

**Assign Collections Letter Screen** — Collections Letter · Print Now.

**Reassign Collector Screen** — Current Collector · New Collector · Remove.

**Assign and Print Collections Letters** — District · Store Location · Collector ·
Past Due Days From/To · Minimum Past Due $ · Maximum Past Due $ · Letter · Print Now ·
Name of File · Path to File.

**Print Collections Letters** — District · Store Location · Collector · Letter ·
Name of File · Path to File.

**Collections Activity Log** — Customer Code · Date Code · Starting Date · Ending Date ·
Update Comments · Comments · Send Output to · Export Path · Actions.

**Bad Debt Payment Entry Screen** — Amount.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Allow Manual Assignment | Collector Settings | Whether a collector's customers can be manually reassigned |
| Collections Settings | own file | Collections configuration (contents undocumented here) |
| Track Settings Activity | own routine | **Opt-in** auditing of settings-file changes, per file |
| Collector Review; Automatic Display of Customer User Defined Settings | user/user group receivables settings | Auto-opens the User Defined Settings screen |
| account comments | Advanced Customer Settings → Point of Sale tab | Pop-up shown when a collector opens the customer |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Collector Review; Automatic Display of Customer User Defined Settings | user/user group receivables settings | Auto-display behaviour (a preference expressed as a security setting) |

---

## F. State machines and enumerations

**AR aging buckets** — Current Due · 1–30 · 31–60 · 61–90 · 91–120 days past due.

**Past-due composition** — Principal · Interest · Insurance · Late Fees · Finance Fees.

**Balance decomposition on a collections letter** — Long Term Revolving Balance ·
Open Item Balance · Total Account Balance.

**Collections alert display** — red / yellow row highlighting on the collector queue.

**Letter output modes** — Excel export (mail-merge) · XML for Enhanced Laser Printing.

**Comment files named** — Collections Comments file · Collector Comments file ·
Customer Collections Review Log · Collector statistics file. (Whether these are four files or four
names for fewer files is not stated.)

---

## G. Sequencing rules (additions)

1. Collector → Function → Customer → Customer Update Screen. Function selection retitles the screen.
2. Letters can be assigned individually (Letter button) or in bulk (`Assign and Print Collections
   Letters`); bulk assignment never overwrites existing assignments.
3. Bulk letter generation updates collector statistics and posts collector comments.
4. Reassignment requires the *collector* to permit manual assignment.
5. Settings-change auditing requires prior opt-in via `Track Settings Activity`.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **How customers enter Collections in the first place.** Every article describes working the queue;
  none describes the assignment rule that puts a customer on a collector's list. `Allow Manual
  Assignment` implies an automatic assigner exists. **Material gap** — this is the trigger for the
  whole workflow.
- **The `Function` field enumeration.** It retitles the screen and drives the red/yellow alert
  semantics ("For details, see the documentation for the Function field") — and that documentation
  is not in the article. **The alert conditions are therefore undocumented.**
- **`Monthly Statement Performance`** and **`Payment`** on the customer update screen — named, undescribed.
- **Four comment/statistics file names** with no statement of how they relate.
- **`Collections Settings`** — referenced only via the audit opt-in; contents unknown.
- **Letter definition** — where collections letters are authored (Forms Designer?) is not stated,
  only how data is passed to them.
- **Aging basis** — the buckets are named but not the date they age from (invoice, due, terms).
  Given batch 6's transaction-date rule this matters.

**3. Inferences (not quotable, kept out of section B)**
- The red/yellow alerts most likely reflect broken promises-to-pay and missed contact dates, given
  those are the two dated commitments on the screen. Not stated.
- `Collections Comments file` and `Customer Collections Review Log` are probably the same store
  under two names; the Comments button opens the latter and every assign screen writes the former.
- Automatic collector assignment is probably driven by `Collections Settings` thresholds analogous
  to the letter routine's past-due day ranges. Not stated.

---

## I. Unknown unknowns (additions)

- **Collector as a first-class entity** with its own settings file and performance reporting.
- **Promise-to-pay reconciliation** (Collected / Amount Remaining) as a tracked commitment.
- **Collector statistics file** feeding efficiency reporting.
- **User Defined Settings** on customers, auto-displayed to collectors.
- **District** as a collections selection dimension.
- **Opt-in settings-change auditing** (`Track Settings Activity`).
- **Enhanced Laser Printing XML** as a document generation path parallel to Excel export.
- **Data Warehouse Control Settings** (surfaced as a related article).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Collector Review Process | The collections work queue (a.k.a. Collector List Review) |
| Function (collections) | Selector that retitles the queue screen and drives alert colouring |
| Promise-to-Pay (PTP) | Dated commitment with amount, tracked against actual collections |
| Collections Comments file | The audit trail every collector action writes to |
| Collector statistics file | Store behind collector efficiency reporting |
| Allow Manual Assignment | Collector-level flag permitting manual reassignment of their customers |
| Track Settings Activity | Routine that opts a settings file into change auditing |
| Past Due 1 to 30 … 91 to 120 | STORIS's four AR aging buckets |
| Long Term Revolving Balance | The un-cycled revolving balance, reported separately from open item |
