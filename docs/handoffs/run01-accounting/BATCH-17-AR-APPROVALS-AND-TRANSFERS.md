# Run 01 — Accounting — Batch 17: Credit Hold Approval, Store Reassignment, and Remaining AR Screens

10 articles. **`Reassign a Customer's Store Location` is the single most valuable article in this
batch** — it is the only place in the entire run where STORIS spells out debit/credit pairs
explicitly, and it reveals two accounts the posting table (batch 1) never showed.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 163 | Update Receivables Credit Approvals | /articles/15202312987156 | EXTRACTED |
| 164 | Review Credit Requests on Hold | /articles/15202310373908 | EXTRACTED |
| 165 | **Reassign a Customer's Store Location** | /articles/15202297405716 | EXTRACTED |
| 166 | Print Credit Request Status Letters | /articles/15202278290836 | EXTRACTED |
| 167 | Vendor Receivables Payment On Account Adjustments Screen | /articles/15202312508692 | EXTRACTED — thin |
| 168 | View Deferred Payments | /articles/15202278894356 | EXTRACTED — thin |
| 169 | View Historical Contract Rebates | /articles/15202311020180 | EXTRACTED — thin |
| 170 | Waived Item Select | /articles/15202309628564 | EXTRACTED |
| 171 | ReportOutput | /articles/15202312761108 | EXTRACTED — shared boilerplate |
| 172 | Co-Applicant Name and Address Maintenance | /articles/15202310175252 | EXTRACTED — thin |

Newly discovered, queued: `Notification Control Settings`, `Print Status Letter`,
`Update Financing Credit Approvals (3rd Party Finance Approvals)`, `Pre-Authorized Deposit` action,
`sales order comment tracking screens`, `Point of Sale Control Settings` → `Initial Check` / `Final Check`.

---

## B. Wiring findings

### FINDING 220 — Store reassignment posts five explicit GL transfers and re-times the customer's cycle
Trigger:    `Reassign a Customer's Store Location`
Effect:     "transfers Accounts Receivable and Deposit Liability balances and **makes all necessary
            General Ledger postings**"; the `Store Location` field in Customer Settings updates and
            a comment posts to the Customer Activity Log
**The postings, verbatim:**
| # | Debit | Credit |
|---|---|---|
| 1 | Deposit Liability — **old** store | Deposit Liability — **new** store |
| 2 | Accounts Receivable — **new** store | Accounts Receivable — **old** store |
| 3 | Long Term Revolving — **new** store | Long Term Revolving — **old** store |
| 4 | **Unearned Interest** — new store | Unearned Interest — old store |
| 5 | **Unearned Insurance** — new store | Unearned Insurance — old store |
Basis:      "The system determines the payment types for unearned and earned interest **based on the
            memo reference for the MMP**" and "the insurance code for unearned and earned insurance
            **based upon the memo reference for the insurance portion of the MMP**."
Accrual:    "The system calculates and posts interest and insurance to their respective **'Unearned'**
            accounts when the Revolving plans cycle and the interest and insurance amounts **earned**
            when a Revolving MMP is paid."
Cycle re-timing: if the new store has a different due day, "the new store's due date **overwrites**
            the existing due date … and the customer's next cycle occurs on the first due cycle day
            that falls **at least 30 days after their last cycle date**. Note that this may cause the
            customer to have an **extended cycle period (more than 30 days)** after the transfer."
Collections: "The system evaluates the customer for Collections assignment and, if found, **reassigns
            the customer to the appropriate collector for their new location**."
Evidence:   Reassign a Customer's Store Location, /articles/15202297405716
Maps to:    **W-052 — CONFIRMED** (location genuinely propagates to GL, AR, cycle and collections),
            **answers batch 12's insurance GL gap**, **answers batch 10's collector-assignment gap**

> Three long-standing gaps close at once:
> 1. **Insurance has a GL account after all** — `Unearned Insurance`, per insurance code, parallel to
>    `Unearned Interest`. It is not on the `General Ledger Assigned Account Settings` screen because
>    it is derived per insurance code, exactly as unearned interest is derived per payment type.
> 2. **The earned/unearned mechanism is stated plainly**: unearned at cycling, earned when the MMP
>    is paid. That is the accrual model for the whole revolving book.
> 3. **Collections assignment is automatic and location-driven** — batch 10 could not find the rule;
>    here it is, at least for the reassignment path.
>
> Also note the **memo reference on the MMP is load-bearing**: it carries the payment type and the
> insurance code that drive account resolution. That is not a comment field, it is a key.

### FINDING 221 — Credit hold approval requires clearing every hold, and three codes are excluded
Trigger:    `Update Receivables Credit Approvals`
Invariant:  "To remove from credit hold an order for which **multiple credit holds exist, you must
            approve all hold codes.**"
Exclusions:
  - **F3** (unapproved financing) → use `Update Financing Credit Approvals (3rd Party Finance Approvals)`
  - **C5** (pre-authorised deposit) → cannot be approved here; go to `Enter a Sales Order` → Payment
    tab → Payment Summary Window → Actions → **Pre-Authorized Deposit**
  - **C6** → "you are redirected to `Review Pending Credit Requests`"; attempting removal gives
    *"Revolving pending credit decision credit holds cannot be maintained in this process."*
Origin:     "Depending on the **`Initial Check`** and **`Final Check`** fields in the Point of Sale
            Control Settings, the system may place orders on AR credit hold."
Audit:      "credit approval and rejection information for specific orders appears in **sales order
            comment tracking screens**"
Decision:   Approve / Reject / **Skip**, with Approval Comments
Context shown: Last Invoice Date · aging (Current, 1-30, 31-60, 61-90, Over 90) · Last Payment Date ·
            Last Payment Amount · Credit Limit · Available · Merchandise Subtotal · Sales Tax ·
            Delivery/Install Charge · Order Subtotal · Deposit · **Total Amount Financed** · Balance Due
Evidence:   Update Receivables Credit Approvals, /articles/15202312987156
Maps to:    **W-020 — CONFIRMED and completed**, **W-051 — CONFIRMED**

> The all-holds-must-clear rule is the readiness gate `W-020` describes, and the three carve-outs
> are each routed to a different screen with a different permission. Note the aging buckets here are
> **Current / 1-30 / 31-60 / 61-90 / Over 90** — *five* buckets, whereas the collections letter
> (batch 10) used **1-30 / 31-60 / 61-90 / 91-120**. Two different aging presentations in one module.

### FINDING 222 — Two `Initial Check` / `Final Check` points govern when holds are evaluated
Config:     `Initial Check` and `Final Check` in `Point of Sale Control Settings`
Related:    `Re-evaluate D2 Credit Hold When Order is Saved` (batch 14)
Evidence:   Update Receivables Credit Approvals, /articles/15202312987156
Maps to:    NEW — the hold evaluation *timing* model

### FINDING 223 — Credit status letters are five typed forms with email-or-print fallback
Types (Forms Designer):
  - Credit Application status: **Approval Letter · Decline Letter · Conditionally Approved Letter**
  - Credit limit: **Credit Limit Increase Letter · Credit Limit Decrease Letter** (batch-print flagged)
Recipients: "If a co-applicant or co-signer exists for the request, **a letter is generated for them
            as well**"
Delivery:   emailed if `Notification Control Settings` allows and an email exists —
            "**all applicants … must have an email address available**", otherwise printed
Ordering:   "The system first generates letters to be **printed**, then generates letters to be **emailed**."
Confirmation: a prompt asks whether all letters emailed/printed correctly; **Yes** flags them and
            omits them from future generation; **No** ends the process and flags the requests as
            needing a letter sent
Audit:      "the system updates **credit comments**, indicating the letter type and date generated"
Evidence:   Print Credit Request Status Letters, /articles/15202278290836
Maps to:    **W-054 — CONFIRMED**, and the first documented **email** delivery path in the run

> The confirm-prompt pattern (a human attests the batch printed correctly, and that attestation is
> what marks the records) recurs across STORIS — check printing (batch 6), letter printing here.
> It is a manual acknowledgement standing in for a delivery receipt. Worth replacing with real
> delivery status in our build.

### FINDING 224 — Repossession can be extended beyond the LET, with defined exclusions and ordering
Trigger:    `Waived Item Select`, from `Original Document Select (Repossessions)` → Actions
Purpose:    "add items to your repossession list that **were not included on the LET document**"
Population: "all other items purchased by the customer, **excluding third-party financed items**,
            by **completion date and then selling price**"
Evidence:   Waived Item Select, /articles/15202309628564
Maps to:    completes batch 11 — this is the screen behind the **Waiver of Rights** form and the
            `Repossession - Access Waived (LET) Items` permission

> Third-party financed items are excluded because the finance company, not the retailer, holds the
> security interest. That is a substantive rule, stated only here.

### FINDING 225 — Rebates on closed contracts are retained and viewable
Producer:   `View Historical Contract Rebates` — "view **interest and insurance rebates on a closed
            contract**"; total line shows "all original and rebate amounts"
Evidence:   View Historical Contract Rebates, /articles/15202311020180
Maps to:    NEW — confirms rebates are stored per contract, not merely computed at payoff

### FINDING 226 — Report output has three export targets with a locked path
Producer:   shared `ReportOutput` boilerplate
Targets:    **Personal Report Viewer (PRV) · Excel Export · ASCII Export** — "this field displays the
            **pre-set** computer drive and folder location … You **cannot edit** the export path
            using this process."
Evidence:   ReportOutput, /articles/15202312761108
Maps to:    **W-056 — CONFIRMED** (export destinations are configuration, not user input)

---

## C. Screen and field inventory

**Update Receivables Credit Approvals** — Customer Code · Order Number * Hold Code ·
Hold Code Description · Customer Credit Comments · Approve/Reject/Skip · Approval Comments ·
Last Invoice Date · Current / 1-30 / 31-60 / 61-90 / Over 90 · Last Payment Date ·
Last Payment Amount · Credit Limit · Available · Merchandise Subtotal · Sales Tax ·
Delivery/Install Charge · Order Subtotal · Deposit · Total Amount Financed · Balance Due · Actions.

**Review Credit Requests on Hold** — Total Pending Review Requests · Total Hold Review Requests ·
Average Initial Response Time · Average Decision Time · Sort By · Refresh · Grid · Actions.

**Reassign a Customer's Store Location** — Customer · New Store.

**Print Credit Request Status Letters** — Select Status Letter to Print · Create XML Files.

**Vendor Receivables Payment On Account Adjustments Screen** — Reference · Amount to Apply ·
Memo · Comment.

**View Deferred Payments** — Deferred Payments · Grid.

**View Historical Contract Rebates** — Grid with total line.

**Waived Item Select** — Customer · grid of other purchased items.

**Co-Applicant Name and Address Maintenance** — Last/First/Middle Name · Prefix · Suffix ·
Address #1/#2 · Zip Code · City · State.

**ReportOutput** — Send Output to · Export Path · Actions (shared across most report screens).

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Initial Check / Final Check | Point of Sale Control Settings | When AR credit holds are evaluated during order entry |
| Notification Control Settings | own file | Whether credit status letters are emailed |

---

## E. Security permissions catalog (additions)

*(No new named permissions; this batch confirms the routing of F3, C5 and C6 approvals to screens
whose permissions were catalogued in batch 9.)*

---

## F. State machines and enumerations

**Credit approval decision** — Approve · Reject · **Skip**.

**Credit status letter types** — Approval · Decline · Conditionally Approved ·
Credit Limit Increase · Credit Limit Decrease.

**AR aging presentations (two, both in use)** —
credit approval screen: Current / 1-30 / 31-60 / 61-90 / **Over 90**;
collections letter (batch 10): Current / 1-30 / 31-60 / 61-90 / **91-120**.

**Export targets** — Personal Report Viewer (PRV) · Excel Export · ASCII Export.

**Earned/unearned accrual** — unearned posted at **cycling**; earned recognised when the **MMP is paid**.

---

## G. Sequencing rules (additions)

1. Every hold code on an order must be approved before the order leaves credit hold.
2. F3, C5 and C6 are approved elsewhere, not on the general approval screen.
3. Store reassignment: update store assignment → post five GL transfers → re-time the cycle
   (≥30 days after last cycle) → re-evaluate collections assignment.
4. Status letters: generate print batch first, then email batch, then confirm; confirmation is what
   flags them as sent.
5. Waived items are added to a repossession list only after the LET-derived list exists.

---

## H. Open questions and gaps

**1. Gated or unreachable** — `Review Credit Requests on Hold` has an Actions option
(`Review Credit Requests on Hold`) that "is **currently unavailable** on this screen."

**2. Documented but ambiguous**
- **`Initial Check` / `Final Check`** — named, undescribed; they determine *when* holds apply, which
  matters for order-entry UX and for reproducing historical hold timing.
- **Two aging bucket sets.** Which is canonical, and whether "Over 90" and "91-120" are the same
  bucket presented differently, is unresolved. Affects any aged trial balance we build.
- **`Unearned Insurance` account location** — inferred to be per insurance code, by analogy with
  unearned interest per payment type, but the settings screen holding it has not been read.
  Likely `Extended Receivables Insurance Code Settings`.
- **Whether an `Earned Insurance` account exists** — the article names unearned insurance explicitly
  and speaks of "amounts earned", but only `Earned Interest` appears on the plan settings (batch 14).
- **Skip** as a credit decision — what state the order is left in is not stated.
- **Extended cycle period after transfer** — the customer can go >30 days without a statement.
  Whether interest accrues across the extended period is not stated. **Consumer-credit significant.**

**3. Inferences (not quotable, kept out of section B)**
- Unearned insurance almost certainly lives in the insurance code settings, mirroring unearned
  interest on the plan; not stated.
- "Over 90" on the approval screen is probably an open-ended final bucket while the collections
  letter caps at 120 and drops older balances into charge-off territory; not stated.
- The memo reference being the key for account resolution suggests MMP rows carry a structured
  memo, not free text; not stated.

---

## I. Unknown unknowns (additions)

- **Unearned Insurance** as a GL account, per insurance code.
- **Store reassignment as a posting event** with five balanced transfers.
- **Automatic collections re-assignment on store change.**
- **Extended cycle periods** created by store transfer.
- **Credit limit increase/decrease letters** as batch-printable regulated notices.
- **Email delivery of customer credit notices**, gated by all applicants having addresses.
- **Skip** as a third credit-approval outcome.
- **Third-party financed items excluded from repossession.**
- **Sales order comment tracking screens** as the audit surface for credit decisions.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Unearned Interest / Unearned Insurance | Accounts holding interest and insurance posted at cycling, before it is earned |
| Earned (interest/insurance) | Recognised when the MMP is paid |
| Memo reference (MMP) | Structured key on an MMP row carrying payment type and insurance code for account resolution |
| Initial Check / Final Check | POS control settings governing when credit holds are evaluated |
| Skip | Credit-approval outcome that neither approves nor rejects |
| Waived items | Repossession candidates not on the LET, added under the Waiver of Rights |
| Conditionally Approved Letter | Credit status letter type between approval and decline |
| PRV — Personal Report Viewer | One of three report export targets |
