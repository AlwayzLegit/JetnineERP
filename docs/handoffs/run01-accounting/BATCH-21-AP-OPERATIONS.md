# Run 01 — Accounting — Batch 21: Positive Pay, TPA Check Import, Purge, Currency, and AP Utilities

10 articles. Fills the remaining operational gaps in Payables, including **Positive Pay** — named
but unexplained since batch 6 — and the TPA check round trip.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 203 | **Create Bank Check File** *(Positive Pay)* | /articles/15202012945556 | EXTRACTED |
| 204 | **Import Completed Checks** | /articles/15202011444244 | EXTRACTED |
| 205 | Purge Reconciled Transactions | /articles/15202028426004 | EXTRACTED |
| 206 | Enter a Check Payment Update | /articles/15201513534228 | EXTRACTED |
| 207 | Actual Exchange Rate Lookup | /articles/15202010748436 | EXTRACTED — thin |
| 208 | Toggle Currency Action | /articles/15202012245780 | EXTRACTED |
| 209 | AP Select Available Screen | /articles/15202010759188 | EXTRACTED — thin |
| 210 | Payment Selection Screen | /articles/15202012592020 | EXTRACTED |
| 211 | Update Customer Remit-To | /articles/15202012251668 | EXTRACTED |
| 212 | Payment Review Screen | /articles/15202012593044 | LOGGED — reached from Payment Selection |

Newly discovered, queued: `Country Settings` (estimated vs actual exchange rate),
`Check Authorization Display Screen`, `TPA_IMPORT` server directory,
`Validate Bank for National Bank`, `Validate Vendor Remit To for National Bank`,
`Update Bill Comments`, `Update Comments`.

---

## B. Wiring findings

### FINDING 252 — Positive Pay is a printed-checks-only fraud file in twelve bank formats
Trigger:    `Create Bank Check File`
Purpose:    "create '**positive pay**' bank check files for use in **preventing fraud caused by
            altered checks**. You can then transmit the file to your bank using the method of your choice."
Scope:      "includes **only checks printed in a check run** and **excludes all others**, for example
            electronically transmitted checks"
Formats (twelve): Bank of America · Bank of Montreal · Bank of Montreal Enhanced ·
            Bank of Montreal Enhanced 2 · BB&T Bank · BMO Harris Bank · Chase · SunTrust Bank ·
            The Private Bank · US Bank · Wachovia · Wells-Fargo
Output:     "either an ASCII text file (.txt) or an Excel spreadsheet file (.csv) … containing basic
            information about printed checks such as the **check number, amount, and payee**"
Fields:     Bank · Date Code · Check Date · **Include Checks Already Transmitted** · Send Output to ·
            Export Path · **Test Mode**
Evidence:   Create Bank Check File, /articles/15202012945556
Maps to:    **answers batch 6's `Next Positive Pay Batch` gap**; **W-055 — CONFIRMED**

> This is what the fourteen `Bank Check File Format - …` articles in Payables document: twelve
> positive-pay layouts (plus NACHA and ABA, which belong to the EFT side). Positive Pay covers
> **printed checks only** — EFT and virtual card payments are outside the fraud control entirely.
> Note `Test Mode` and `Include Checks Already Transmitted`, both of which imply re-sends are normal.

### FINDING 253 — The TPA check round trip renames STORIS checks after the third-party package
Trigger:    `Import Completed Checks` (only available after `Export Payable Checks` has run)
Source:     "the completed check run file from the **`TPA_IMPORT` directory on the server**"
Payment types in the file: **`SYS`** (check) · **`ACH`** (Automated Clearing House) · **`WIR`**
            (wire transfer) — "**All payment types are treated as checks within STORIS.**"
Numbering:  "The **pending check number** from the export file is cross referenced to the check
            number used by the third party accounting package … **The check number assigned by the
            third party accounting package is used as the check number in STORIS.** The prefix
            **ACH** and **WIR** is added to ensure the check numbers are unique in STORIS."
Currency:   "All checks in a check run must be for the **same currency**. If you have a vendor that
            needs to be paid in a foreign currency, **a separate bank must be created**."
Errors:     `Import Completed Checks Exception Report` (available only during the process) —
            Error Type · Pending Check Reference · TPA Check Number · AP Bill ·
            STORIS Check Run Value · Import File Value · Exception
Evidence:   Import Completed Checks, /articles/15202011444244
Maps to:    **W-055 — CONTRADICTED in ownership** — the document number is assigned externally

> STORIS surrenders check numbering to the third-party package and back-fills it, prefixing `ACH`
> and `WIR` to keep uniqueness. So in TPA installations the check number is **not** a STORIS
> sequence, and ACH/wire payments masquerade as checks throughout STORIS reporting. Both are
> migration landmines: a check-number-keyed join will behave differently for TPA-era data.
> This also completes the `Exported Not Recorded` clearing account story from batch 1.

### FINDING 254 — Purging reconciled transactions moves the bank's baseline and is permission-gated
Trigger:    `Purge Reconciled Transactions`
Gate:       **`Change reconciliation beginning balance in Bank Settings`** in
            `Create a User/Group Actions - Payables Security`
Effect:     "deletes all transactions that were reconciled **before** the date specified … also
            updates the bank's **beginning balance and as-of date** in the bank record, **using the
            date you specify here as the new 'as-of date'**"
Evidence:   Purge Reconciled Transactions, /articles/15202028426004
Maps to:    completes batch 2, Finding 38 — and names the permission

> The permission name is the tell: purging is understood by STORIS as *changing the beginning
> balance*, not as deleting history. It is a one-way accounting act, not a housekeeping job.

### FINDING 255 — Electronic check authorization adjusts the customer's bank account without posting
Trigger:    `Enter a Check Payment Update`
Invariant:  "This routine adjusts customers' **checking accounts only**. It does **not post directly
            to orders or deposits.**"
Payload:    Customer Code · Bank Route Number · Checking Account Number · Check Number · Check Type ·
            Transaction Amount · Order Reference Number · Store Location
Result:     `Check Authorization Display Screen` — check number, payment amount, and "a **bank
            response message** indicating success or failure"
Evidence:   Enter a Check Payment Update, /articles/15201513534228
Maps to:    NEW — this is the **ECA** rail referenced in batch 5 (excluded from NSF/misapply handling)

> A money movement that deliberately does not touch the order or the deposit. Combined with batch 5
> (ECA payments cannot be NSF-reversed) this is a fourth place where STORIS's ledger and the real
> money position are decoupled by design.

### FINDING 256 — Foreign-currency AP has an estimated and an actual exchange rate
Producers:  `Actual Exchange Rate Lookup` — "display the **actual** exchange rate (as opposed to the
            **estimated** exchange rate) from the **`Country Settings`** for the selected vendor and currency"
Display:    `Toggle Currency Action` — available on vendors, AP bills and vendor activity; switching
            to domestic currency puts the screen in **read-only mode** and shows "Domestic" in the
            upper right; toggling back restores edit
Constraints (from Finding 253): one currency per check run; a separate **bank** per foreign currency
Related:    `Exchange Rate` fields on the AP bill header (batch 4) and on the payment register (batch 20);
            GL maintenance is always in **domestic** currency (batch 5)
Evidence:   Actual Exchange Rate Lookup, /articles/15202010748436 · Toggle Currency Action, /articles/15202012245780
Maps to:    NEW — a coherent multi-currency model assembled from five articles

> The full picture: bills are **entered and maintained in the vendor's currency**, GL is **posted and
> maintained in domestic currency**, an estimated rate lives on the bill and an actual rate lives in
> Country Settings, and any screen showing domestic amounts goes read-only. If LA Mattress imports,
> this is a live concern; if not, it is dead weight we should not build.

### FINDING 257 — Voiding a non-check payment with multiple bills requires an explicit selection
Trigger:    `Void Payment Screen` for a non-check payment where multiple AP bills share the bank and reference
Producer:   `Payment Selection Screen` — Date · Vendor · Remit To · Method · Status · Amount;
            double-click gives **More** (→ `Payment Review Screen`) or **Select** (returns to the void screen)
Evidence:   Payment Selection Screen, /articles/15202012592020
Maps to:    completes batch 4, Finding 60

### FINDING 258 — Customer refund remit-to can be overridden per payment without touching the master
Trigger:    `Update Customer Remit-To`
Invariant:  "override the customer's remit-to address **temporarily** and send this customer refund
            to an alternate address. Note that any changes you make here **do not update the
            Customer Settings**."
Gate:       read-only unless **`Create vendor remit-to addresses during vendor invoice entry`** in
            `Create a User/Group Actions - Payables Security` is checked
Evidence:   Update Customer Remit-To, /articles/15202012251668
Maps to:    NEW

> A refund can be directed to an address that exists nowhere in the customer master. That is a
> fraud-relevant capability gated by a permission whose *name* is about vendor remit-tos, not
> customer refunds — an easy permission to grant without realising what it also unlocks.

### FINDING 259 — Item selection on AP bills is type-scoped and unavailable under TPA
Trigger:    `AP Select Available Screen`, from the Product field on `Enter/Update Individual Vendor Invoice`
Scope:      "for **type 1 bills only**" (i.e. `MDSI` Merchandise/Invoice, batch 6)
Behaviour:  "displays automatically whenever you specify a **model number for which multiple items
            exist**"; "**not available if using TPA**"
Also:       "You can use this process to select **refund bills for deletion**."
Evidence:   AP Select Available Screen, /articles/15202010759188
Maps to:    NEW — first explicit use of the numeric AP bill type codes in a behavioural rule

---

## C. Screen and field inventory

**Create Bank Check File** — Bank · Date Code · Check Date · Include Checks Already Transmitted ·
Send Output to · Export Path · Test Mode · Actions.

**Import Completed Checks** — Bank · Date · Time/Code · Action · File Name · Send Output To ·
Export Path · Run · Actions. Exception report columns: Error Type · Pending Check Reference ·
TPA Check Number · AP Bill · STORIS Check Run Value · Import File Value · Exception.

**Purge Reconciled Transactions** — Bank · Purge all transactions earlier than.

**Enter a Check Payment Update** — Customer Code · Bank Route Number · Checking Account Number ·
Check Number · Check Type · Transaction Amount · Order Reference Number · Store Location.

**Actual Exchange Rate Lookup** — Vendor · Currency · Actual Exchange Rate.

**Payment Selection Screen** — Date · Vendor · Remit To · Method · Status · Amount.

**Update Customer Remit-To** — address override fields (read-only variant exists).

**AP Select Available Screen** — grid of available items.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Bank check file format | Bank Settings (per bank) | Which of twelve positive-pay layouts is produced |
| estimated vs actual exchange rate | Country Settings | The rate applied to foreign-currency vendors |
| Test Mode | Create Bank Check File (run-time) | Produces a positive-pay file without committing |
| Include Checks Already Transmitted | Create Bank Check File (run-time) | Re-sends previously transmitted checks |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Change reconciliation beginning balance in Bank Settings | Create a User/Group Actions - Payables Security | `Purge Reconciled Transactions` |
| Create vendor remit-to addresses during vendor invoice entry | Create a User/Group Actions - Payables Security | Editing `Update Customer Remit-To` — **including customer refund redirection** |

---

## F. State machines and enumerations

**Positive pay bank formats (12)** — Bank of America · Bank of Montreal (+ Enhanced, Enhanced 2) ·
BB&T · BMO Harris · Chase · SunTrust · The Private Bank · US Bank · Wachovia · Wells-Fargo.

**TPA completed-check payment types** — `SYS` check · `ACH` · `WIR`; all treated as checks in STORIS,
with `ACH`/`WIR` prefixes added to the imported check number.

**Currency display mode** — foreign (editable) ⇄ Domestic (read-only).

**AP bill type scoping** — `AP Select Available Screen` is type 1 (`MDSI`) only.

---

## G. Sequencing rules (additions)

1. `Export Payable Checks` **must** run before `Import Completed Checks`.
2. Positive pay covers printed checks only, after a check run.
3. Purge sets the new as-of date and beginning balance — run it last and once per period.
4. One currency per check run; a foreign-currency vendor needs its own bank record.
5. Toggling to domestic currency forces read-only.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **How the positive pay file reaches the bank** — "transmit the file to your bank using the method
  of your choice." Same file-on-a-PC pattern as everything else (batch 20, Finding 247).
- **Which bank check file format maps to which article** — the fourteen `Bank Check File Format - …`
  articles are per-bank record layouts; twelve are positive pay, and **NACHA** and
  **Australian Bankers Association (ABA)** are EFT formats filed in the same list. The section
  listing mixes two different purposes under one naming convention.
- **`Action`** on `Import Completed Checks` — validate vs update is implied ("can be used to validate
  the file and report exceptions **as well as** perform the updates") but the values are not given.
- **`Check Type`** on `Enter a Check Payment Update` — not enumerated (Personal/Company elsewhere).
- **Whether ECA authorisations ever post** — the article says they do not post to orders or deposits;
  what, if anything, they do post is unstated.
- **`Update Bill Comments` vs `Update Comments`** — two separate articles, unread, presumably
  bill-level and payment-level comment editors.

**3. Inferences (not quotable, kept out of section B)**
- The twelve positive-pay formats and the two EFT formats together explain all fourteen
  `Bank Check File Format` articles; not stated anywhere.
- `Test Mode` presumably suppresses the "already transmitted" flag; not stated.
- Because ACH and WIR arrive through the check import and are "treated as checks", the check
  reconciliation screens (batch 2) will show them as checks — so a bank statement ACH line matches a
  STORIS "check". Not stated, and a real reconciliation gotcha.

---

## I. Unknown unknowns (additions)

- **Positive Pay** as a twelve-format fraud-prevention file.
- **`TPA_IMPORT` server directory** as an integration drop point.
- **External assignment of check numbers** in TPA installations.
- **ACH and wire payments represented as checks** throughout STORIS.
- **Electronic check authorization** as a non-posting money movement.
- **Estimated vs actual exchange rates** held in Country Settings.
- **Per-currency bank records** as the multi-currency strategy.
- **Temporary customer refund remit-to override** that bypasses the customer master.
- **Test Mode** on a banking file generator.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Positive Pay | Bank fraud-prevention file listing printed checks by number, amount and payee |
| TPA_IMPORT | Server directory where the third-party package drops completed check files |
| `SYS` / `ACH` / `WIR` | TPA completed-check payment types; all become "checks" in STORIS |
| Pending check number | STORIS's placeholder number, replaced by the TPA-assigned number on import |
| ECA | Electronic check authorization; adjusts the customer's bank account only |
| Actual vs estimated exchange rate | Country Settings rates for foreign-currency vendors |
| Toggle Currency | Action switching a screen to domestic currency and read-only |
| Type 1 bill | `MDSI` Merchandise/Invoice — the only type with item-level selection |
