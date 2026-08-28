# Run 01 — Accounting — Batch 18: GL Imports, Budgets, Recurring Journals, and Credit-Hold Screens

10 articles. **This batch materially advances the run's top open question** — what happens to an
unattended posting that cannot resolve — by documenting the GL import error model and naming a
report we had not seen: the **GL Invalid Transaction Report**.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 173 | **Import Journal Postings** | /articles/15186368850452 | EXTRACTED |
| 174 | GL Batch Import Screen | /articles/15186352772500 | EXTRACTED |
| 175 | Import an Existing Account Budget | /articles/15186352924052 | EXTRACTED |
| 176 | Create an Account Budget | /articles/15186352922004 | EXTRACTED |
| 177 | Create a Recurring Journal Entry | /articles/15186368857876 | EXTRACTED |
| 178 | Credit Requests on Hold Screen | /articles/15202278095124 | EXTRACTED |
| 179 | Credit Request Review Screen - Read Only | /articles/15202278098580 | EXTRACTED |
| 180 | Enter Additional Revolving Payments *(Enter Additional Installment Payments)* | /articles/15202277353236 | EXTRACTED |
| 181 | Late Fee Forgiven | /articles/15202310832020 | LOGGED — view of Finding 216's write path |
| 182 | Installment Notes | /articles/15202278680596 | LOGGED — free-text notes on a contract |

**General Ledger subsection is now 10/10 complete.**

Newly discovered, queued: **`GL Invalid Transaction Report`** *(high priority)*, `GL.POST`,
`GL.SOURCE`, `GL.ACCOUNT`, `Company file`, `GL Source Settings`, `View Credit Request Responses`,
`View Completed Credit Requests`, `Print Status Letter`.

---

## B. Wiring findings

### FINDING 227 — GL imports have a two-tier error model, and invalid batches are flagged, not posted
Trigger:    `Import Journal Postings`
Batching:   "The program assigns to a **single batch (`GL.POST`) all transactions that share the same
            company, source and date**"
**Fatal errors** (abort the whole import, nothing posts):
  - company does not exist in the Company file
  - transaction date not formatted properly **or is for a closed period**
  - debit or credit amount is not numeric
  - source does not exist on the `GL.SOURCE` file
**Non-fatal errors** (import proceeds only if `Post if Non-Fatal Errors Found` is checked):
  - **account number does not exist in the `GL.ACCOUNT` file**
  - source does not exist in `GL.SOURCE`
  - cost center company does not match the company passed
Outcome:    "The program **flags all batches containing invalid data and does not post them**. You
            can then run the **GL Invalid Transaction Report**, fix the errors and re-submit for posting."
Limit:      "The maximum amount allowed for a journal entry is **$99,999,999.99**"; 100 million or
            more aborts the process
Evidence:   Import Journal Postings, /articles/15186368850452
Maps to:    **W-036 — materially advances it**, **W-037 — CONFIRMED** (closed period is a *fatal* import error)

> This is the closest the documentation comes to answering the question I have carried since batch 5:
> **what does an unattended path do when an account cannot resolve?** For the GL import path the
> answer is now explicit — the batch is **flagged and held unposted**, surfaced through a report,
> and re-submitted after correction. That is the same shape as the interactive `$$$$$^NN` block
> (batches 5–6) and the same shape as `Report Suspended Postings` (batch 1).
>
> Three independent mechanisms, one design intent: **STORIS does not silently post to a default
> account. It parks the work and makes a human fix it.** Our `W-036` contract was right about the
> intent and wrong about the mechanism — there *is* a fall-through hierarchy, but its terminal value
> is a sentinel that blocks, not an account that absorbs.
>
> **What remains unproven:** whether the *module* posting paths (order completion, PO receipt,
> cycling, End-of-Day) behave the same way as the *import* path. The suspended-postings queue from
> batch 1 strongly suggests yes. A sandbox test or a question to STORIS would settle it.

### FINDING 228 — A closed period is fatal on import but only "invalid" on interactive entry
Contrast:   import → "transaction date … is for a closed period" is a **fatal** error, aborting the
            entire file · interactive → suspended postings carry "invalid transactions" reasons
            (batch 1) repaired in `Post/Update a Journal Entry`
Evidence:   Import Journal Postings, /articles/15186368850452
Maps to:    **W-037 — CONFIRMED with a route-dependent failure mode**

### FINDING 229 — Recurring journals are definitions distinct from batches, with a self-deleting option
Trigger:    `Create a Recurring Journal Entry`
Payload:    Recurring Journal Number *("distinct from batch numbers")* · Company · **Posting
            Frequency** · Description · **Delete After Post** · Last Posting · Create the Posting ·
            Transaction Date · Update
Behaviour:  on update the system "either **saves the recurring journal entry** with any changes
            (including the new last posting set), **or deletes it if the `Delete After Post` flag is
            set**. Before deletion, a warning message appears with the option to abort."
Detail:     "**Duplicate GL accounts are allowed in the batch.** Therefore, in order to maintain an
            existing detail posting, you must select it from the grid."
Evidence:   Create a Recurring Journal Entry, /articles/15186368857876
Maps to:    NEW; relates to batch 6's `Enter a Recurring Vendor Invoice` (the AP analogue)

> Two recurring-transaction engines exist — recurring **journal entries** (GL) and recurring
> **vendor invoices** (AP, generated by End-of-Day). They are separate mechanisms with separate
> definitions and separate posting rules. Note also the duplicate-account allowance: a batch can
> hit the same account twice, so line identity cannot be the account.

### FINDING 230 — Budgets are per account per fiscal year, with variance-based auto-calculation
Trigger:    `Create an Account Budget`
Scope:      "create a budget for **any future fiscal year as long as a GL period table exists**"
Auto-calc:  `Base on Variance from` + `Variance Percentage` + Calculate
Import:     `Import an Existing Account Budget` — one row per account, "The first column contains the
            **complete GL account number including the company number**. The remaining columns
            contain **12 budget amounts** … for a total of **13 columns**." Decimals optional
            ("If you do not include decimals, the program assumes you are using whole amounts").
            `Overwrite Existing Budgets` flag. "The import process first **validates** the data …
            If the program finds invalid data, the import process **aborts**."
Evidence:   Create an Account Budget, /articles/15186352922004 · Import an Existing Account Budget, /articles/15186352924052
Maps to:    NEW

> Budgets are 12-period, so period 13 (batch 1) carries **no budget**. Year-end adjustments are
> therefore unbudgeted by construction — worth knowing before building variance reporting.

### FINDING 231 — All three GL imports share one STORIS-supplied workbook and a fixed header convention
Invariant:  a single **GL Import Spreadsheet** contains three worksheets — Import Journal Postings ·
            GL Batch Import · GL Budget Import — obtained from the STORIS secure site
            (Documentation → Vision → Spreadsheet Downloads)
Format rule: "**THE FIRST TWO ROWS in the spreadsheet provided by STORIS must NOT be removed!**
            The program imports data beginning with row # three (3)." Save as tab-delimited `.txt`.
Difference: `GL Batch Import Screen` imports **a single batch**; `Import Journal Postings` imports
            **multiple journal postings at one time**
Evidence:   GL Batch Import Screen, /articles/15186352772500 · Import Journal Postings, /articles/15186368850452 · Import an Existing Account Budget, /articles/15186352924052
Maps to:    NEW

> The same two-header-row convention appears in the revolving deferment and insurance imports
> (batches 12, 16). It is a house standard for STORIS-supplied import templates, and any migration
> tooling we write should expect it.

### FINDING 232 — Sensitive credit data is masked rather than hidden in the read-only review screen
Trigger:    `Credit Request Review Screen - Read Only`, via `View Credit Request Responses` or
            `View Completed Credit Requests`
Rule:       without `Access Other Credit Applications and Score Reporting` (Extended Security),
            "**the credit score is masked** and any global extra action buttons that display
            sensitive customer information (social security number, scoring, etc.) are **inactive**"
Exclusive:  "the **Print Status Letter** extra actions option is available **only** from this
            read-only version of the screen"
Evidence:   Credit Request Review Screen - Read Only, /articles/15202278098580
Maps to:    **W-050 — refines it** — field-level masking, the most granular access control in the run

### FINDING 233 — Hold reasons on credit requests are append-only with an operator stamp
Trigger:    `Credit Requests on Hold Screen`
Payload:    Reason · Comment · **Hold Code · Date · Time · Initials**
Invariant:  "You **cannot change an existing reason**, but you can add/edit comments or **remove it
            along with the associated comment**."
Limit:      "you **cannot enter an approval status code** using this routine. To approve the credit
            request, use the `Credit Request Review` process."
Security:   `Access Other Credit Applications and Score Reporting`; otherwise the **Access Control
            Window** prompts for an authorised user's credentials
Evidence:   Credit Requests on Hold Screen, /articles/15202278095124
Maps to:    **W-051 — CONFIRMED**, **W-053 — partially CONFIRMED** (date/time/initials stamp)

> Contrast with batch 5, Finding 75: here the Access Control Window is a genuine authorisation
> step, requiring an *authorised* user's credentials. On the cashier payment screen the same-named
> window authenticates nothing. Same UI component, two different security semantics.

### FINDING 234 — Additional installment payments share the revolving `AP` prefix and preconditions
Trigger:    `Enter a Customer Payment` → Actions → Enter Additional Installment Payments
Precondition: "at least one active installment contract and **no installment payments currently due**"
Reference:  prefix **`AP`**, same as additional revolving payments (batch 16, Finding 218)
Evidence:   Enter Additional Revolving Payments, /articles/15202277353236
Maps to:    NEW — one article documents both the revolving and installment variants under a
            revolving-sounding title (another title/content mismatch, cf. batch 5, Finding 74)

---

## C. Screen and field inventory

**Import Journal Postings** — Default Company · PC Path of Spreadsheet ·
Post if Non-Fatal Errors Found · Print Error Report.

**GL Batch Import Screen** — PC Path of Spreadsheet.

**Import an Existing Account Budget** — Fiscal Year for Import · PC Path of Spreadsheet ·
Overwrite Existing Budgets.

**Create an Account Budget** — Company · Fiscal Year · Account · Base on Variance from ·
Variance Percentage · Calculate · Grid.

**Create a Recurring Journal Entry** — Recurring Journal Number.
*General:* Company · Posting Frequency · Description · Delete After Post · Last Posting ·
Create the Posting · Transaction Date · Update.
*Detail:* Account · Remark · Debit · Credit · Debit Total · Credit Total · Comment.

**Credit Requests on Hold Screen** — Customer (Code, Name, Address, City/State/Zip, Email,
Co-applicant) · Order (Number, Total, Deposit) · Reason · Comment · Hold Code · Date · Time ·
Initials · Actions.

**Credit Request Review Screen - Read Only** — same fields as the entry version; Print Status Letter
in Actions.

**Enter Additional Revolving/Installment Payments** — Customer · Plan · $.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Post if Non-Fatal Errors Found | Import Journal Postings (run-time) | Whether a file with non-fatal errors imports at all |
| Print Error Report | Import Journal Postings (run-time) | Produces the fatal/non-fatal error listing with row numbers |
| Overwrite Existing Budgets | Import an Existing Account Budget (run-time) | Replace vs preserve existing budget rows |
| Delete After Post | Create a Recurring Journal Entry | Self-destructing recurring definition |
| Posting Frequency | Create a Recurring Journal Entry | How often the definition posts |

---

## E. Security permissions catalog (additions)

*(No new named permissions. Two behaviours worth recording: field-level **masking** of the credit
score under `Access Other Credit Applications and Score Reporting`, and the `Access Control Window`
acting as a genuine second-user authorisation on the credit-hold screen.)*

---

## F. State machines and enumerations

**GL import error classes** — Fatal (abort all) · Non-fatal (proceed only if permitted).

**Fatal conditions** — unknown company · malformed or closed-period transaction date ·
non-numeric amount · unknown source.

**Non-fatal conditions** — unknown account · unknown source · cost-center/company mismatch.

**Named GL files** — `GL.POST` (batch) · `GL.SOURCE` · `GL.ACCOUNT` · Company file.

**Import batching key** — company + source + date → one `GL.POST` batch.

**Journal entry ceiling** — $99,999,999.99.

**Budget shape** — 13 columns: full GL account (incl. company) + 12 period amounts.

**Reference prefixes** — `AP` covers both additional revolving and additional installment payments.

---

## G. Sequencing rules (additions)

1. GL import: validate → fatal errors abort everything → non-fatal errors gated by a flag →
   invalid batches flagged and held → `GL Invalid Transaction Report` → fix → re-submit.
2. Budget import validates first and aborts entirely on invalid data (no partial load).
3. Recurring journal: create definition → post → update sets Last Posting, or deletes the
   definition if `Delete After Post`.
4. Budgets require an existing GL period table for the target fiscal year.
5. Credit request hold reasons cannot be edited, only removed with their comment.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **`GL Invalid Transaction Report`** is named here and appears nowhere in the Accounting Views and
  Reports listing (which has `Report Suspended Postings` instead). Either they are the same report
  under two names, or there is an unlisted report. **Chase this — it is the observability surface
  for held postings.**
- **Tension inside the import model:** an unknown account is *non-fatal*, yet "batches containing
  invalid data" are flagged and not posted. So either a non-fatal error still blocks the batch
  (making the "post if non-fatal" flag nearly meaningless), or unknown accounts post somewhere.
  **Directly relevant to the fall-through question — worth a sandbox test.**
- **`Posting Frequency`** values are not enumerated.
- **`Base on Variance from`** — the comparison basis for budget auto-calculation is not stated.
- **No budget for period 13** — implied by the 12-column import, never stated.
- **`Late Fee Forgiven` and `Installment Notes`** were logged rather than dissected; both are
  single-purpose views with no wiring content beyond what batch 16 established.

**3. Inferences (not quotable, kept out of section B)**
- `GL Invalid Transaction Report` and `Report Suspended Postings` are very likely the same thing —
  batch 1 said suspended postings sort by "invalid" and "hold" reasons. Not stated.
- The `GL.POST` batching key (company + source + date) is probably why `GL Source Settings` exists
  and why the suspended-postings report breaks on source. Not stated.
- Since module postings also write `GL.POST`, the flag-and-hold behaviour probably applies to them
  too; this is the inference the whole `W-036` question turns on, and it is still an inference.

---

## I. Unknown unknowns (additions)

- **GL Invalid Transaction Report** as a distinct observability surface.
- **Recurring journal definitions** separate from batches, with self-deletion.
- **Duplicate GL accounts permitted within one batch.**
- **A $99,999,999.99 journal ceiling.**
- **Variance-based budget auto-calculation.**
- **A single STORIS-supplied workbook** serving three GL import processes.
- **Field-level masking** of credit scores.
- **Append-only hold reasons** with operator stamps.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| GL.POST | The GL batch file; one batch per company+source+date on import |
| GL.SOURCE | The GL source code file; a required key on every posting |
| GL.ACCOUNT | The chart of accounts file |
| GL Invalid Transaction Report | Report listing batches flagged with invalid data and held unposted |
| Fatal / non-fatal error | Import error classes; fatal aborts the file, non-fatal is gated by a flag |
| Recurring journal number | Identifier of a recurring definition, distinct from a batch number |
| Delete After Post | Flag making a recurring journal definition self-destruct after posting |
| Access Control Window | Credential prompt — genuine authorisation here, identification-only elsewhere |
