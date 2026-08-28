# Run 01 — Accounting — Batch 22: Bank File Formats, EFT Validators, and Payables Completion

20 articles logged (14 bank format specs + 6 operational screens). **This completes the Payables
subsection: 63/63.**

**Note on the fourteen `Bank Check File Format - …` articles:** each is a per-bank fixed-position
or column record layout. Consistent with the policy used for the insurance (batch 12) and National
Bank EFT (batch 20) layouts, I record their *shape and source fields* rather than reproducing the
tables. Two were read in full to characterise the family; the rest are logged with their URLs.

---

## A. Coverage log (this batch)

**Bank check file formats** — all in Payables, all `EXTRACTED (format spec)` or `LOGGED`:

| Format | Article ID | Purpose |
|---|---|---|
| Bank of America | 15202012591252 | positive pay — **read in full** |
| Bank of Montreal | 15202010925332 | positive pay |
| Bank of Montreal Enhanced | 15202010926356 | positive pay |
| Bank of Montreal Enhanced 2 | 15202012415764 | positive pay |
| BB&T Bank | 15202012411412 | positive pay |
| BMO Harris Bank | 15202012411668 | positive pay |
| Chase | 15202012592404 | positive pay |
| SunTrust Bank | 15202012411924 | positive pay |
| The Private Bank | 15202011077908 | positive pay |
| US Bank | 15202011074964 | positive pay |
| Wachovia | 15202012591124 | positive pay |
| Wells-Fargo | 15202012590996 | positive pay — **read in full** |
| **Standard NACHA Format** | 22935273569172 | **EFT**, not positive pay |
| **Australian Bankers Association (ABA)** | 23766349200148 | **EFT**, not positive pay |

**Operational screens:**

| # | Article | URL | Status |
|---|---|---|---|
| 227 | Validate Bank for National Bank | /articles/15202028508052 | EXTRACTED |
| 228 | Validate Vendor Remit To for National Bank | /articles/15202028505108 | EXTRACTED |
| 229 | AP Check Approval Bill Selection | /articles/15202012412692 | EXTRACTED |
| 230 | Update Bill Comments | /articles/15202028504852 | EXTRACTED |
| 231 | Reconciliation Detail Display - Read Only | /articles/15202011555092 | EXTRACTED |
| 232 | View Payments Screen | /articles/15202012719636 | EXTRACTED |
| 233 | Update Comments | /articles/15202010745876 | LOGGED |
| 234 | View Payment Screen | /articles/15202011445396 | LOGGED |
| 235 | Payment Review Screen | /articles/15202012593044 | LOGGED |
| 236 | Review Reconciled Batch - Read Only | /articles/15202013040916 | LOGGED |
| 237 | EFT Batch Lookup / Virtual Card Batch Number Lookup | /articles/15202012796564, /15202011360404 | LOGGED — lookup windows |

**Payables subsection now 63/63 complete.**

---

## B. Wiring findings

### FINDING 260 — Positive pay files draw from two records: BANK and AP PAYMENT REGISTER
Structure:  a **Header Record** identifying the payer bank and a **Detail Record** per check
Bank of America header fields: **Bank ID** (Bank Identifier from the `BANK` record — *"If the Bank
            Identifier is null the **Bank Code** will be used"*, left justified zero filled) ·
            **Account Number** (from the BANK record) · Process Year / Month / Day (check date)
Bank of America detail: Check Number (right justified, zero filled) · Check Amount · …
Wells-Fargo (column-based rather than fixed-position): **BID** = Payer Number from Bank Settings ·
            **RID** = Account Number from Bank Settings · Routing transit number (from BANK record,
            **exactly 9 digits numeric**) · Account number (BANK record, ≤10 chars numeric, no
            punctuation) · **Serial number** (from the **AP PAYMENT REGISTER** record, ≤10 numeric) ·
            **Issue date** (AP PAYMENT REGISTER, `MM-DD-YYYY`) ·
            **Amount** ("Sum of the values from the AP PAYMENT REGISTER record", `99999.99`)
Evidence:   Bank Check File Format - Bank of America, /articles/15202012591252 ·
            Bank Check File Format - Wells-Fargo, /articles/15202012590996
Maps to:    **W-055 — CONFIRMED** — the payment register key *is* the check serial number

> Two structural facts worth carrying: (a) the **AP Payment Register** is the record of truth for
> check serial, issue date and amount — the same record the payment register maintenance screen
> edits (batch 20); (b) there is a **Bank Identifier → Bank Code fallback**, another quiet
> fall-through of exactly the kind this run keeps finding.

### FINDING 261 — Two of the fourteen "bank check file format" articles are EFT formats, not positive pay
Observation: `Standard NACHA Format` and `Australian Bankers Association (ABA)` appear in the same
            naming family but are listed among the **EFT** formats in `Create Electronic Funds
            Transfer File` (batch 20), and neither appears in the twelve-bank positive-pay list in
            `Create Bank Check File` (batch 21)
Evidence:   Create Bank Check File, /articles/15202012945556 · Create Electronic Funds Transfer File, /articles/15202011281428
Maps to:    documentation-structure finding

> A naming collision in the docs, not in the product. Anyone building an integration inventory from
> article titles alone would mis-classify two formats. Worth noting in our own docs plan: name
> artefacts by *purpose*, not by *filename family*.

### FINDING 262 — EFT has pre-flight validators that silently remove bills from the batch
**Bank-side** (`Validate Bank for National Bank`, called from `Select and Approve Bills for Payment`):
            required fields — Financial Institution · Transit Number · Account Number · Payer Number ·
            Destination Data Center · Originator Short Name · Originator Long Name ·
            **Next EFT Payment Number** · EFT File Format.
            Failure message: *"Required field 'XXX' is null in Bank X"* per missing field.
**Vendor-side** (`Validate Vendor Remit To for National Bank`, called when **Select Bills** is clicked):
            required — Financial Institution · Transit Number · Account Number.
            Failure: *"The settings required for Electronic Funds Transfer are not populated in the
            following Vendor Remit To(s): XXXX. **All bills for these Vendor Remit To(s) have been
            removed from this batch.**"*
Evidence:   Validate Bank for National Bank, /articles/15202028508052 · Validate Vendor Remit To for National Bank, /articles/15202028505108
Maps to:    NEW — **a silent-exclusion failure mode**

> The vendor-side validator **removes bills from the batch** and tells you once, in a message naming
> remit-tos rather than bills. A vendor with incomplete banking details simply stops being paid, and
> the only evidence is a dialog nobody keeps. That is a real accounts-payable failure mode and
> exactly the sort of thing to replace with a persistent exception queue in our build.
> Note also **`Next EFT Payment Number`** on the bank record — the `CP`-sequence source from batch 20.

### FINDING 263 — Adding bills to a check run can breach the run's own selection criteria
Trigger:    `Add Bills to Existing Check Run` → Action at `Select Bill(s)` → `AP Check Approval Bill Selection`
Behaviour:  "The grid displays options based on the current selection criteria specified on the Bill
            Selection tab … The grid contains **all entries for the selected bank**. If you select a
            bill that **doesn't meet the criteria** … a warning message appears but **you can proceed**."
Evidence:   AP Check Approval Bill Selection, /articles/15202012412692
Maps to:    completes batch 4, Finding 59 — the batch's criteria are advisory, not enforcing

### FINDING 264 — AP bill comments are append-only
Invariant:  "Use this routine to enter comments on AP bills. **You cannot edit existing comments.**"
            A read-only variant exists.
Fields:     Vendor Code · AP Bill · Display Comments
Evidence:   Update Bill Comments, /articles/15202028504852
Maps to:    **W-053 — partially CONFIRMED** — append-only comment discipline on AP bills

> Contrast with the credit-request hold reasons (batch 18): reason immutable, comments editable.
> Here comments are immutable too. STORIS's comment mutability rules differ per module with no
> stated principle.

### FINDING 265 — The bank reconciliation detail record carries eight typed attributes
Payload (read-only): **Record ID · Date · Document · BAI Code · Transaction Type ·
            Deposit Type Code · Transfer Bank · Status · Amount · Detail / Reference Information**
Evidence:   Reconciliation Detail Display - Read Only, /articles/15202011555092
Maps to:    completes the bank rec record shape from batches 2 and 3

> This is the definitive field list for a bank reconciliation record, and it confirms the three
> classification dimensions found separately across earlier batches: **BAI Code** (bank side),
> **Transaction Type** (STORIS side), and **Deposit Type Code** (the End-of-Day deposit grain).

### FINDING 266 — Payment views branch on how many payments a bill has
Rule:       from `Enter/Update Individual Vendor Invoice` or `View AP Bill` → Check Information tab →
            Actions → View Payments: **multiple payments** → `View Payments Screen` (a selector);
            **one payment** → `Payment Review Screen` directly; **none** → the option is **inactive**
Evidence:   View Payments Screen, /articles/15202012719636
Maps to:    NEW — a small but clean UI contract worth mirroring

---

## C. Screen and field inventory

**Validate Bank for National Bank** — validation only; nine required Bank-record fields.

**Validate Vendor Remit To for National Bank** — validation only; three required Remit-To fields.

**AP Check Approval Bill Selection** — grid of bills for the selected bank.

**Update Bill Comments** — Vendor Code · AP Bill · Display Comments (append-only; read-only variant).

**Reconciliation Detail Display - Read Only** — Record ID · Date · Document · BAI Code ·
Transaction Type · Deposit Type Code · Transfer Bank · Status · Amount · Detail / Reference Information.

**View Payments Screen** — grid selector.

**Positive pay file (generic shape)** — Header: bank identifier / payer number, account number,
process date. Detail: check number, check amount, payee, issue date (field names and positions vary
by bank; see the per-bank articles).

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Bank Identifier (with Bank Code fallback) | BANK record | Header identifier on positive-pay files |
| Next EFT Payment Number | Bank Settings | Source of the `CP` EFT payment sequence |
| EFT File Format | Bank Settings | Required before EFT validation passes |
| Destination Data Center, Originator Short/Long Name, Payer Number | Bank Settings | Required for National Bank EFT |
| Financial Institution / Transit Number / Account Number | Bank Settings **and** Vendor Remit To Settings | Required on both sides for EFT |

---

## E. Security permissions catalog (additions)

*(None new.)*

---

## F. State machines and enumerations

**Bank file families** — positive pay (12 banks) · EFT (9 formats, of which NACHA and ABA are filed
under the bank-check naming family).

**Bank rec record attributes** — Record ID · Date · Document · BAI Code · Transaction Type ·
Deposit Type Code · Transfer Bank · Status · Amount.

**Payment view branching** — 0 payments (inactive) · 1 payment (direct) · many (selector).

---

## G. Sequencing rules (additions)

1. `Validate Bank for National Bank` runs when the bank is chosen; `Validate Vendor Remit To for
   National Bank` runs when **Select Bills** is clicked — bills failing the latter are removed.
2. Positive pay runs after checks are printed and covers only printed checks.
3. Bills added to an existing run may bypass that run's selection criteria on a warning.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none.

**2. Documented but ambiguous**
- **Validators are documented only for the National Bank format.** Whether NACHA, Truist, CIBC etc.
  have equivalent pre-flight checks is unstated. If they do not, incomplete vendor banking data
  fails later and less visibly.
- **`Bank Identifier` vs `Bank Code`** — a fallback with no stated precedence rule beyond null-checking.
- **Where positive-pay transmission status is stored** — `Include Checks Already Transmitted` implies
  a per-check transmitted flag; no article describes it.
- **`Update Comments` (payment-level) vs `Update Bill Comments`** — logged, not dissected; the
  mutability rule for the former is unknown.
- **No article defines the `AP PAYMENT REGISTER` record** even though three screens and two file
  formats read from it.

**3. Inferences (not quotable, kept out of section B)**
- The per-bank positive-pay articles are almost certainly generated from one internal format table;
  the field vocabulary is identical across them. Not stated.
- `Serial number` in the Wells-Fargo layout is the payment register key seen as `Reference` on the
  Check Review grid (batch 4). Not stated.
- Because ACH/WIR payments imported from TPA become "checks" (batch 21), they would presumably also
  appear in positive-pay extracts — which would be wrong, since the bank never issued a check for
  them. The docs do not address this interaction. **Worth testing if TPA is in scope.**

---

## I. Unknown unknowns (additions)

- **Bank Identifier → Bank Code fallback** on the BANK record.
- **AP Payment Register** as the system of record for check serial, issue date and amount.
- **Silent removal of bills** from an EFT batch on vendor validation failure.
- **Per-check transmitted flag** for positive pay.
- **Format-specific pre-flight validators** (documented only for National Bank).

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| AP Payment Register | The payment record holding check serial, issue date and amount |
| Bank Identifier / Bank Code | Payer identity on positive-pay headers, with a documented fallback |
| Next EFT Payment Number | Bank-record sequence producing the `CP` payment reference |
| Serial number (positive pay) | The payment register key, used as the check serial |
| BID / RID | Wells-Fargo positive-pay payer and account identifiers |
