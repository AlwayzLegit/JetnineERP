# Run 01 — Accounting — Batch 19: Third Party Accounting (TPA) Interface

10 articles. This completes the **Accounting top-level (uncategorised) subsection, 10/10**.
TPA is the alternate accounting mode — mutually exclusive with STORIS GL/AP — and it behaves
differently enough on the posting question to matter.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 183 | Transfer Third Party Accounting Information | /articles/15173468994068 | EXTRACTED |
| 184 | TPA Account Settings | /articles/15173492415508 | EXTRACTED — thin |
| 185 | **TPA AP Bill GL Postings Screen** | /articles/15173468669588 | EXTRACTED |
| 186 | Bad TPA Posting Selection Screen | /articles/15173468665748 | EXTRACTED — thin |
| 187 | Correct Transmission Errors *(TPA Reject Maintenance)* | /articles/15173492649492 | EXTRACTED |
| 188 | Import Vendors from Third Party Accounting | /articles/15173492553748 | EXTRACTED |
| 189 | Update Approved Customer Refunds *(Customer Refund Maintenance)* | /articles/15173468993300 | EXTRACTED |
| 190 | **Log Report Errors** | /articles/15173468669716 | EXTRACTED |
| 191 | Report Add-on Distribution Analysis | /articles/15202503993108 | EXTRACTED |
| 192 | Report Pre-Approval Credit Statistics | /articles/15203128570004 | EXTRACTED |

**Accounting (top level) subsection now 10/10 complete.**

Newly discovered, queued: `Third-Party Accounting Control Settings` (Generic tab),
`GL Cost Center Settings`, `Accounting in STORIS`, `TPA Setup Using Defaults`,
`Distribute Add-on Receiving Costs`, `Report on Third Party Accounting Transmission Errors`.

---

## B. Wiring findings

### FINDING 235 — In TPA mode, postings *can* land on the default account, and a screen exists to fix them
Trigger:    An AP bill posted under TPA whose GL account did not resolve
Producer:   `TPA AP Bill GL Postings Screen`
Invariant:  "Use this screen to fix GL postings in an AP Bill. **You can only fix postings to the
            default account.**"
Selection:  `Bad TPA Posting Selection Screen` — "select AP bills whose GL postings you want to fix"
Evidence:   TPA AP Bill GL Postings Screen, /articles/15173468669588
Maps to:    **W-036 — the decisive evidence, and it splits by mode**

> This is the clearest statement in the entire run on the fall-through question, and it resolves it
> **differently for the two accounting modes**:
>
> - **STORIS Accounting:** the hierarchy terminates in the `$$$$$^NN` sentinel, which *blocks* the
>   save interactively (batches 5–6) and causes imports to *flag and hold* the batch (batch 18).
>   Nothing posts to a real default account.
> - **TPA:** postings **do** land on a default account, a whole screen pair exists to find and repair
>   them, and the repair is *restricted* to postings that hit the default — you cannot use it to
>   re-account anything else.
>
> So `W-036` ("nothing falls through to a default account") is **CONFIRMED for STORIS Accounting**
> and **CONTRADICTED for TPA mode**. If LA Mattress has ever run TPA/QuickBooks, expect real
> transactions sitting on a default account in the history.

### FINDING 236 — TPA is a five-process batch transfer, three outbound and two inbound
Processes (verbatim):
  - **Transfer GL Accounts From TPA** *(inbound)*
  - **Transfer Vendors to TPA** *(outbound)*
  - **Post AP Transactions to TPA** *(outbound)*
  - **Post GL Transactions to TPA** *(outbound)*
  - **Post Customer Refunds to TPA** *(outbound)*
Status:     the program shows **In Progress** per process and **ERROR** beside any that failed, plus
            *"Error(s) occurred in TPA interface. Please review logs."*
QuickBooks precondition: "**open a QuickBooks® session** … Make sure that the company for which you
            want to run transfers is open. **Warning:** If QuickBooks® is open for another company …
            errors occur during the transfer process and **the transactions are not posted.**"
Evidence:   Transfer Third Party Accounting Information, /articles/15173468994068
Maps to:    NEW

> A batch financial interface whose success depends on which company a desktop application happens
> to have open. That is a fragility we should note but obviously not reproduce.

### FINDING 237 — Rejected TPA items are repaired and re-validated before resubmission
Trigger:    `Correct Transmission Errors` (*TPA Reject Maintenance*)
Scope:      "GL transfer errors, AP transfer errors (**receiving and vendor credits**), and
            **customer-refund** transfer errors"
Flow:       file changes → "the system **re-evaluates** the items. If the batch is still not valid,
            the reason appears on the screen and you can either **save the batch as-is** or abort" →
            if valid and TPA active, prompt *"Resubmit this item to TPA?"* → Yes "removes the **TPA
            error flag** and resubmits"
Fields:     Posting Type · Rejected Items Found
Evidence:   Correct Transmission Errors, /articles/15173492649492
Maps to:    **W-036 — same park-and-repair pattern as STORIS mode**

> Note "save the batch as-is" — an invalid batch can be *retained* in its invalid state. That is a
> fourth holding queue (alongside suspended postings, flagged GL import batches, and default-account
> AP bills), each with its own repair screen.

### FINDING 238 — The TPA error taxonomy is a bidirectional master-data reconciliation problem
Errors (from `Log Report Errors`, on `Report on Third Party Accounting Transmission Errors`):
| Error | Meaning | Fix |
|---|---|---|
| TPA Vendor update failed; invalid reference to QuickBooks Terms | STORIS terms code missing in QuickBooks | add the terms code manually in QuickBooks |
| Cost center missing in QuickBooks | STORIS cost center has no QuickBooks **Class** | create the Class |
| TPA AP Post failed; invalid reference to QuickBooks Vendor | vendor exists in STORIS, not QuickBooks | create the vendor |
| Cost center missing in STORIS | QuickBooks Class has no STORIS cost center | add via `GL Cost Center Settings` |
| GL account missing in STORIS | account exists in QuickBooks, not STORIS | run Transfer GL Accounts From TPA |
| Out of balance batch in QuickBooks | "rarely occurs" | log a call with STORIS Customer Service |
| Cannot open QuickBooks | wrong company open | close, open correct company, re-run |
Invariant:  "**At all times, the GL accounts that your company is using must exist in both STORIS and
            in QuickBooks.**" · "For every cost center created in STORIS, there must be a
            corresponding 'Class' in QuickBooks" (and vice versa)
Evidence:   Log Report Errors, /articles/15173468669716
Maps to:    NEW

> **Cost center ↔ QuickBooks Class** is the mapping to know: STORIS's fourth account element maps to
> a QuickBooks Class, not to an account segment. If any historical data came through TPA, cost
> centers and Classes must have been kept in lockstep by hand — and every error above represents a
> point where they could have drifted.

### FINDING 239 — TPA vendor import overwrites, generates its own keys, and keeps a hidden cross-reference
Trigger:    `Import Vendors from Third Party Accounting` *(Initial Vendor Transfer From TPA)*
Warning:    "**This process overwrites vendors in STORIS.** … run it once during initial startup only."
Selection:  in QuickBooks, create a **Vendor Type of 'STORIS'** and set each vendor's Type to it
Key generation: "a **5-character key** in the Vendor Code field … the first three characters from the
            Company Name field in QuickBooks appended by a **2-digit sequential number starting with
            '00'**. By using this method … each vendor has a **different key in STORIS and in QuickBooks**."
Cross-reference: "The Vendor file contains an internal field called **`TPA Equivalent`** … used as an
            internal cross-reference to the vendor key in QuickBooks. **This field is not accessible.**"
Terms fallback: QuickBooks terms code → if absent in STORIS, look at `TPA Equivalent` → if still no
            match, "the system assigns a terms code of **null**"
Evidence:   Import Vendors from Third Party Accounting, /articles/15173492553748
Maps to:    **W-055 — a documented key-generation algorithm**, NEW

> A three-character prefix plus a two-digit sequence gives 100 vendors per prefix before collision.
> And a **null terms code** is a silent failure mode: the vendor imports, but with no payment terms.
> Both are migration hazards if TPA-imported vendors are in the data.

### FINDING 240 — Deleting a transmitted refund behaves differently per TPA package
Trigger:    Deleting a Refund AP bill in `Update Approved Customer Refunds`
Untransmitted: deleted on the STORIS side
Transmitted, by package:
  - **STORIS Accounting** — deleted on both sides
  - **QuickBooks** — "A message appears indicating that the refund **still exists in QuickBooks**."
    Delete it there, then run `Transfer Third-Party Accounting Information`; STORIS then deletes it
  - **Generic Interface** — "STORIS deletes the refund on the STORIS side but **relies on you** to
    delete the refund on the Generic Interface side. **Important:** If you do not manually delete
    the refund … the two sides may become **out-of-sync** and cause significant problems."
Guards:     `Third-Party Accounting Control Settings` → Generic tab; and
            `Delete payable bills after third party accounting transmission` in
            `Create a User/Group Actions - Payables Security`
Editability: "you can edit **only invalid records**. You can view, but not edit, open or closed records."
Evidence:   Update Approved Customer Refunds, /articles/15173468993300
Maps to:    NEW — **three TPA package variants**, not one

> A third package type appears here: **Generic Interface**, alongside STORIS Accounting and
> QuickBooks. Its delete semantics are explicitly unsafe by design and guarded only by a permission.

### FINDING 241 — Landed add-on cost variance is reported, not posted
Producer:   `Report Add-on Distribution Analysis` — "variances between **estimated** landed add-on
            costs and **actual** landed add-on costs"
Scope:      "all records that fit the selection criteria appear … **regardless of whether the
            `Distribute Add-on Receiving Costs` process was used**"
Columns:    Add-On Cost · Tot Add-On · Invoice Percent · Total Percent · **Type** (`D` set dollar
            amount, `P` percentage) · Current Add-On · Variance Percent
Note:       "For credit Warehouse receivings, the program adjusts receipt quantities accordingly."
Evidence:   Report Add-on Distribution Analysis, /articles/15202503993108
Maps to:    **W-012 / W-061 — refines them**

> Consistent with batch 4's finding that STORIS has no purchase price variance account: landed
> add-on variance is a **reporting** artefact, not a posting. The variance is visible but never
> booked — it has already been absorbed into inventory cost.

### FINDING 242 — Credit application submission channel is captured and reportable
Producer:   `Report Pre-Approval Credit Statistics` — pre-approvals with "no established credit and
            no link to financed orders", by reviewer, salesperson, store location and review status
Counts:     declined · pending · approved; includes **auto approvals from the credit bureau**, and
            can be run for auto approvals only
**Source column** (present only under PRV / Excel / ASCII output):
  - *empty* → submitted **in-store (via STORIS)**
  - `Kiosk` → submitted via an **in-store kiosk**
  - *[IP Address]* → submitted **via the web**, showing the customer's PC IP address
Evidence:   Report Pre-Approval Credit Statistics, /articles/15203128570004
Maps to:    NEW

> Two things: **auto-approval by the credit bureau** is a real path we had not seen (batch 9
> documented only manual decisioning), and the application **channel** — including a kiosk — is
> captured per request. Storing the submitting IP address is worth flagging to whoever owns
> data-retention policy.

---

## C. Screen and field inventory

**Transfer Third Party Accounting Information** — five process checkboxes; Run; per-process status.

**TPA Account Settings** — Account Number · Description.

**TPA AP Bill GL Postings Screen** — Bill · Model · Account.

**Bad TPA Posting Selection Screen** — AP bill selection grid.

**Correct Transmission Errors** — Posting Type · Rejected Items Found.

**Import Vendors from Third Party Accounting** — QuickBooks address-line mapping for
Address Line 1 / Address Line 2.

**Update Approved Customer Refunds** — Mode/Status · Refund Number · Transaction Type · Customer ·
Document Reference · Warehouse Location · Amount · Account · Message · Actions.

**Report Add-on Distribution Analysis** — Report Type · Start/End Date · Model Number ·
Group Number · Category · Vendor · Country.

**Report Pre-Approval Credit Statistics** — Date Code · Starting/Ending Date · Reviewer ·
Salesperson · District · Store · Review Status · Reason Code · Auto Approvals Only · Summary Only ·
Primary/Secondary/Tertiary Sort · Send Output to · Export Path.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Third-Party Accounting Interface active | (system) | Enables TPA mode; mutually exclusive with STORIS GL/AP |
| Third-Party Accounting Control Settings → Generic tab | own file | Guards deletion of transmitted AP bills |
| Delete payable bills after third party accounting transmission | Create a User/Group Actions - Payables Security | Same guard, user side |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Delete payable bills after third party accounting transmission | Create a User/Group Actions - Payables Security | Deleting AP bills (incl. customer refunds) already sent to TPA |

---

## F. State machines and enumerations

**TPA packages** — STORIS Accounting · QuickBooks · **Generic Interface**.

**TPA transfer processes** — Transfer GL Accounts From TPA · Transfer Vendors to TPA ·
Post AP Transactions to TPA · Post GL Transactions to TPA · Post Customer Refunds to TPA.

**TPA item states** — valid · rejected (carries a **TPA error flag**) · repaired · resubmitted ·
"saved as-is" while still invalid.

**TPA error taxonomy** — seven documented messages (Finding 238).

**Add-on cost calculation type** — `D` dollar amount · `P` percentage.

**Credit application source** — empty (in-store) · `Kiosk` · IP address (web).

**Vendor key format (TPA import)** — 3 chars of company name + 2-digit sequence from `00`.

---

## G. Sequencing rules (additions)

1. Open the correct QuickBooks company **before** running any TPA transfer.
2. TPA vendor import runs **once**, at initial startup, and overwrites.
3. Rejected items: fix → re-evaluate → resubmit (or save as-is, still invalid).
4. Deleting a transmitted refund: delete in the TPA package first (QuickBooks), then re-run transfer.
5. GL accounts and cost centers must be kept in lockstep across both systems at all times.
6. Default-account AP postings in TPA mode are found via `Bad TPA Posting Selection Screen` and
   repaired in `TPA AP Bill GL Postings Screen`.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Which default account TPA postings land on.** "You can only fix postings to the default account"
  never names it. Presumably `GL Account Number Default` from batch 1, but if TPA has its own
  default (via `TPA Account Settings`) that changes the migration picture.
- **`Generic Interface`** — a third TPA target with almost no documentation and explicitly unsafe
  delete semantics. If LA Mattress used anything other than STORIS Accounting or QuickBooks, this is
  where to look.
- **`Accounting in STORIS`** — a related article that sounds like a domain overview; not yet read.
- **Auto-approval from the credit bureau** — named in a report; the decisioning rule behind it is
  documented nowhere in Accounting.
- **Kiosk** as a credit application channel — no article.
- **What "invalid records" means** on `Update Approved Customer Refunds` (the only editable class).
- **`Distribute Add-on Receiving Costs`** — the process the variance report analyses; in Merchandising.

**3. Inferences (not quotable, kept out of section B)**
- The TPA default account is most likely the same `$$$$$^NN`-resolving default as STORIS mode, with
  the difference being that TPA *posts* it rather than blocking; not stated.
- Because TPA can post to the default, TPA-era history is where any "wrong account" balances would
  live; batch 1's warning about unreconcilable history applies specifically to TPA periods.
- The `TPA Equivalent` inaccessible cross-reference field is presumably how re-transmission finds
  the QuickBooks vendor; not stated.

---

## I. Unknown unknowns (additions)

- **Generic Interface** as a third accounting-package target.
- **QuickBooks Class ↔ STORIS cost center** as the required mapping.
- **`TPA Equivalent`** — an inaccessible internal cross-reference field on the Vendor file.
- **Vendor key auto-generation** with a documented collision-prone format.
- **Null terms code** as a silent import outcome.
- **In-store kiosk** credit application channel.
- **Web application IP address capture.**
- **Auto-approval by the credit bureau.**
- **Landed add-on variance reporting** with dollar/percentage calculation types.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| TPA | Third Party Accounting — the alternate accounting mode (QuickBooks or Generic Interface) |
| TPA error flag | Marker on a rejected TPA item, cleared on successful resubmission |
| TPA Reject Maintenance | Alternate name for `Correct Transmission Errors` |
| TPA Equivalent | Inaccessible Vendor-file field cross-referencing the TPA vendor key |
| Class (QuickBooks) | The QuickBooks object a STORIS cost center maps to |
| Generic Interface | Third TPA target with manual, unguarded delete semantics |
| Bad TPA posting | An AP bill GL posting that landed on the default account |
| Add-on cost Type D / P | Dollar-amount vs percentage landed add-on calculation |
| Source (credit statistics) | Application channel: in-store, Kiosk, or web (IP address) |
