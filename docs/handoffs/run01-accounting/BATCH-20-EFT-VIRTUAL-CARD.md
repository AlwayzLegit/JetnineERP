# Run 01 — Accounting — Batch 20: EFT, Virtual Card, and Payment Register Maintenance

10 articles. The two non-check disbursement rails, plus the screen that splits and merges checks.

**Note on `Format EFT Data for National Bank`:** it is a full fixed-length bank record layout. As
with the insurance layouts (batch 12) I have recorded its *structure, constraints and the internal
STORIS field names it exposes* rather than reproducing the field table — the field names are the
wiring-relevant part and are a direct gift for data mapping.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 193 | **Virtual Card Processing** | /articles/15202011361300 | EXTRACTED |
| 194 | View Virtual Card Payment Status | /articles/15202012884500 | EXTRACTED — thin |
| 195 | Virtual Card Batch Number Lookup | /articles/15202011360404 | LOGGED — lookup window |
| 196 | Create Electronic Funds Transfer File | /articles/15202011281428 | EXTRACTED |
| 197 | **Format EFT Data for National Bank** | /articles/15202028505236 | EXTRACTED — format spec |
| 198 | Email Remittance Advice | /articles/15202012785940 | EXTRACTED |
| 199 | Payment Register Maintenance Screen | /articles/15202012593172 | EXTRACTED |
| 200 | Date For New Batch Window | /articles/15202011077268 | EXTRACTED |
| 201 | Add Bills to Existing Check Run | /articles/15202010925844 | EXTRACTED — thin |
| 202 | EFT Batch Lookup | /articles/15202012796564 | LOGGED — lookup window |

Newly discovered, queued: `Vendor RemitTo Settings` (Other / email fields, financial institution,
transit and account numbers), `Notifications Control Settings` → Email Configuration tab,
`Payment Summary Window`, `Validate Bank for National Bank`, `Validate Vendor Remit To for National Bank`.

---

## B. Wiring findings

### FINDING 243 — Virtual card is a four-stage state machine with a file at every stage
Trigger:    `Virtual Card Processing`; pages **Create Payment File · Import Response File ·
            Import Reconciliation File · Void Payment Batch**
**The state table, verbatim:**
| Action | Batch Status | Payment Status | Note |
|---|---|---|---|
| `Select and Approve Bills for Payment` creates batch | Pending | not created yet | |
| Create Payment File | **Transmitted** | Transmitted | |
| Import Response File | **Completed** | Transmitted or Voided | "Payment is populated with virtual card number. **GL is posted.**" |
| Import Reconciliation File | Completed | **Completed** | "Payment **cannot be voided**" |
| Void Payment Batch | Voided | Voided | |
Bank gating: banks appear only if `Virtual Card File Format` is populated in `Bank Settings`
Evidence:   Virtual Card Processing, /articles/15202011361300
Maps to:    **W-031 — CONFIRMED for this rail**, **W-034 — extends the settlement chain**

> Note **when the GL posts**: not at file creation, but on **response file import** — i.e. when the
> card numbers come back. Disbursement is recognised at issuance of the instrument, not at approval
> and not at settlement. Settlement (`Import Reconciliation File`) only stamps the post date and
> locks the payment against voiding.

### FINDING 244 — Voiding a virtual card batch is bounded by status and by external action
Rules:      only batches with status **Transmitted or Completed** may be voided; **Pending and
            Voided cannot**; and "batches containing a payment applied to an **overpaid pending
            bill** cannot be voided" *(the same blocker as check runs, batch 4)*
Granularity: "This process **cannot be used to void a single payment**. To void a single payment, use
            the `Void Payment Screen`. Once **even one payment within a batch has been completed** …
            the Void Payment Screen must be used to void each payment individually."
External:   "If using **Comdata**, the user must contact Comdata directly to void payments **PRIOR**
            to voiding a batch or payment in STORIS."
Evidence:   Virtual Card Processing, /articles/15202011361300
Maps to:    **W-035 — CONTRADICTED in autonomy** — the reversal is not self-contained

### FINDING 245 — Comdata response errors auto-void with a STORIS-specific error code
Rules (Comdata):
  - payments in the response error report "are **automatically voided**. For each bill in the
    payment, a comment is written to the **AP Bill comments** indicating that a void has been processed."
  - "The assigned error code is **`STOR`** (for STORIS); these payments **cannot be voided
    automatically**, so the user must **contact Comdata directly**"
  - exception: "when a payment exists in the payment file but is **missing from the response file**
    … the payment is automatically voided because it was not processed by Comdata"
Sensitive data: "Any sensitive data, such as the **full virtual card number**, is handled as such."
Evidence:   Virtual Card Processing, /articles/15202011361300
Maps to:    NEW

> The internal void and the processor-side void are decoupled, exactly as with card refunds in
> batch 5. This is the third instance of STORIS reversing its own ledger while the money position at
> the processor is someone's manual follow-up. It is a consistent architectural choice and a
> consistent source of reconciliation breaks.

### FINDING 246 — The reconciliation file is many-to-many with payment files by settlement date
Invariant:  "All records in the reconciliation file belong to the **same account code** because they
            are issued at the account code level. The file may contain records from **multiple
            payment files**, which contain data based on the **posting date** (i.e. when the merchant
            settles the transaction). Since merchants process payments on different days and have
            different schedules for settlements, **usually one payment file will not have all the
            data in the same reconciliation file**."
Error report: virtual card payment number · virtual credit card number (**masked**) ·
            vendor remit-to code · vendor remit-to name · error message
Evidence:   Virtual Card Processing, /articles/15202011361300
Maps to:    NEW

> Payment files and reconciliation files do not correspond one-to-one. Any settlement matching we
> build must be set-based on account code and post date, not file-based.

### FINDING 247 — Nine EFT file formats are supported, and STORIS never transmits
Formats (verbatim): **CIBC · Scotia Bank (SCP15) · Bank of Montreal (CPA005) · NACHA ·
            SunTrust (modified NACHA) · National Bank (NATIONAL) · Australian Bankers Association ·
            Truist · Wells Fargo**
Invariant:  "You can use this process to create the EFT file and write it to your PC, but **STORIS
            does not transmit anything to the bank. Your organization is responsible for
            transmitting the EFT file to the bank.**"
Fields:     Bank · Date · Time/Code · Action · EFT Batch Number · File Name · **Complete Payments** ·
            **Email Remittance Advice** · Send Output to · Export Path
Context:    when reached from `Select and Approve Bills for Payment`, Bank / Date / Time-Code /
            EFT Batch Number default and are inactive
Evidence:   Create Electronic Funds Transfer File, /articles/15202011281428
Maps to:    NEW

> The same "generate a file, a human moves it" pattern as check export (batch 6) and the insurance
> and Metro 2 files (batches 11–12). **STORIS has no outbound banking transport anywhere in
> Accounting.** Every money-moving integration ends at a file on someone's PC. That is the single
> most consistent architectural fact of the whole run, and the clearest place a rebuild adds value.

### FINDING 248 — The National Bank layout exposes STORIS's internal field naming for banking data
Structure:  three record types — **`A`** header (identifies the user), **`C`** detail (transactions),
            **`Z`** trailer (counts and totals). Every record is exactly **1464 characters**.
            A `C` record carries **six payment segments** of 240 bytes each; short records are blank
            filled; "A segment containing data **may not follow a blank segment** within the same record."
Currency:   CAD or USD; "**All payments in this file must use the same currency.** This currency code
            will be set from the **first payment**."
Internal field names revealed (directly useful for data mapping):
  - *Bank Settings:* `BA.PAYER.NBR` (payer/user number) · `BA.DEST.DATA.CTR` (destination data
    centre) · `BA.FINANCIAL.NBR` · `BA.PAYER.TRANSIT` · `BA.ACCT.NBR` ·
    `BA.ORIGIN.SHORT.NAME` · `BA.ORIGIN.LONG.NAME`
  - *Vendor Remit To Settings:* `VTO.FINANCIAL.NBR` · `VTO.TRANSIT.NBR` · `VTO.ACCNT.NBR` · `VTO.NAME`
  - *EFT run:* `ACR.EFT.NATIONAL.SEQ.NBR` (file creation number, +1 per file) ·
    `ACR.EFT.FILE.CR.DATE` (Julian) · `ACR.APRVD.APR.KEY` (cross reference)
Cross-reference composition: **Vendor ID (5 chars) + File Number (`CP` prefix + 6 digits, `APR.PAY.REF`)
            + payment date `YYMMDD`** = 19 characters
Operation code: `460` for Accounts Payable
Evidence:   Format EFT Data for National Bank, /articles/15202028505236
Maps to:    **W-055 — CONFIRMED** (`CP`-prefixed six-digit payment reference, "similar to a check number")

> Three things worth extracting: (a) the **`CP` payment reference** is the EFT analogue of a check
> number and is part of the bank cross-reference; (b) **vendor bank details live on Vendor Remit-To,
> not Vendor** — remit-to is the banking entity; (c) the file-creation sequence number is a
> per-format counter that must survive migration or the bank will reject duplicates.

### FINDING 249 — Remittance advice email is per remit-to, with content drawn from three settings
Trigger:    `Email Remittance Advice`, or the option on `Create Electronic Funds Transfer File`
Precondition: only for **completed EFT batches** (file created); and
            `STORIS Server Can Send Emails` on the Email Configuration tab of
            `Notifications Control Settings` must be enabled
Recipients: "sent to **each email stored in the `Other` field in `Vendor RemitTo Settings`**"
            (and, per the detail section, to the remit-to's Email Address)
Content:    subject includes the bank used or the bank's company name; a line above the table gives
            EFT Payment Number, Remit To Name and payment date; the table lists **AP Bill Number,
            Invoice Number, Invoice Date, Payment Amount, Discount Amount, Net Amount and Remittance
            Comment** per bill
Format:     "HTML or plain text, **depending on the server's operating system**"
Config:     `Email Header Message / Sent By / Subject for Remittance Advice` in `Payables Control Settings`
Evidence:   Email Remittance Advice, /articles/15202012785940
Maps to:    **W-054 — CONFIRMED**; second documented email path (after credit status letters, batch 17)

### FINDING 250 — The payment register is where checks are split, merged and discount-overridden
Trigger:    double-click a Check Review grid row (pending check runs only)
Capabilities:
  - **AP Bills** — "The system creates a **new, separate check** for any AP bills removed … Any AP
    bills **added** to the check being maintained are **removed from any other check on the same
    check run**." Removing several bills in one session "combines all bills removed in the session
    into a **single separate check**."
  - **Discount Amount** — `Take Override` applies or rejects the discount "**regardless of the
    specified terms date**"
  - **Approval Amount** — may be decreased to any amount above the discount and greater than zero,
    or increased up to amount due less discount; "If this amount results in a **partial payment**, a
    warning message appears but you can proceed."
Payment types on this screen: **Check · Debit Card · Cash · Credit Card · On-Line payments**
Fields:     header Reference · Vendor; General (Bank, Method, Date, Amount, Status, Status Date,
            Remit-to, **Exchange Rate**); Detail grid (Bill, Type, Open Amount, Discount, Terms Date,
            Take Discount, Approved, Discount, Balance Due)
Evidence:   Payment Register Maintenance Screen, /articles/15202012593172
Maps to:    **W-051 — partially CONTRADICTED** (discount override and partial payment need no approval)

> Discounts can be taken outside their terms date with no permission and no reason capture, and
> partial payments proceed on a warning. Two more places where STORIS warns rather than controls.

### FINDING 251 — A new payment batch is stamped with date, method and code, and the date is period-gated
Trigger:    `Date For New Batch Window` — appears when selecting a bank with no pending check run
Payload:    **Batch Payment Date · Batch Payment Method · Batch Payment Code**
Invariant:  "The date **cannot be from a closed sales period**."
Evidence:   Date For New Batch Window, /articles/15202011077268
Maps to:    **W-037 — CONFIRMED**, and completes batch 6's `Allow Multiple Payment Batches` /
            Batch Payment Code story

> Note it is the **sales** period, not the GL period, that gates the batch date — consistent with
> batch 1 (a GL period cannot close until its sales period has) and with the "sales overlap period"
> void exception (batches 4 and 6). Sales-period state is a first-class gate we had not modelled.

---

## C. Screen and field inventory

**Virtual Card Processing** — four pages.
*Create Payment File:* Bank · Date · Time/Code · Action · Virtual Card Batch Number · File Name ·
Send Output To · Export Path · Submit.
*Import Response File:* Bank · PC Path of Response File · Date · Time/Code ·
Virtual Card Batch Number · Import.
*Import Reconciliation File:* Bank · PC Path of Reconciliation File · Import.
*Void Payment Batch:* Bank · Virtual Card Batch Number · Date · Time/Code · Amount ·
Void Payment Batch · Grid.

**View Virtual Card Payment Status** — Bank · Date Code · Starting/Ending Date ·
Starting/Ending Payment Number · Payment Statuses to Include · Grid.

**Create Electronic Funds Transfer File** — Bank · Date · Time/Code · Action · EFT Batch Number ·
File Name · Complete Payments · Email Remittance Advice · Send Output to · Export Path · Actions · Run.

**Email Remittance Advice** — Bank · Date · Time · EFT Batch Number · Grid · Run.

**Payment Register Maintenance Screen** — tabs General, Detail (fields listed in Finding 250).

**Date For New Batch Window** — Batch Payment Date · Batch Payment Method · Batch Payment Code.

**Add Bills to Existing Check Run** — Bill Number(s).

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Virtual Card File Format | Bank Settings | Whether a bank appears in virtual card processing |
| EFT status / EFT format | Bank Settings | Which EFT layout is produced; drives field availability |
| Payer Number, Destination Data Center, Financial Institution, Transit, Account Number, Originator Short/Long Name | Bank Settings | The banking identity written into EFT files |
| Financial Institution, Transit Number, Account Number, Remit To Name, Other (emails) | Vendor Remit To Settings | The payee banking identity and remittance recipients |
| STORIS Server Can Send Emails | Notifications Control Settings → Email Configuration | Enables all outbound email |

---

## E. Security permissions catalog (additions)

*(None named. Notable by absence: discount override outside terms date, and partial payment
approval, are ungated.)*

---

## F. State machines and enumerations

**Virtual card batch status** — Pending → Transmitted → Completed · Voided.
**Virtual card payment status** — (none) → Transmitted → Completed · Voided.
GL posts at **response file import**; settlement locks the payment against voiding.

**EFT formats** — CIBC · Scotia Bank (SCP15) · Bank of Montreal (CPA005) · NACHA ·
SunTrust (modified NACHA) · National Bank (NATIONAL) · Australian Bankers Association ·
Truist · Wells Fargo.

**National Bank record types** — `A` header · `C` detail (6 segments) · `Z` trailer; 1464 bytes each.

**Payment methods on the payment register** — Check · Debit Card · Cash · Credit Card · On-Line.

**Reference prefixes (running list)** — `CP` (EFT payment reference) · `AP` (additional payment) ·
`D*` (deleted order) · `RSVD/VCHR#` (converted V/R) · `STOR` (Comdata error code) ·
`LET_` (repossession export).

---

## G. Sequencing rules (additions)

1. Virtual card: approve bills → create payment file → import response (GL posts) →
   import reconciliation (locks) — or void while Transmitted/Completed.
2. Comdata voids must be done at Comdata **before** voiding in STORIS.
3. Once any payment in a virtual card batch is Completed, voiding is per payment only.
4. EFT: approve → create file → **organisation transmits** → optionally email remittance advice.
5. Remittance advice requires a completed EFT batch and server email enabled.
6. A new payment batch's date cannot fall in a closed **sales** period.
7. Removing bills from a check in the payment register creates one new check per session.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **`Complete Payments`** on the EFT file screen — named, undescribed; presumably marks payments
  complete without waiting for a reconciliation step. Materially affects when EFT disbursement is
  recognised.
- **`Action`** on both the EFT and virtual card file screens — only one value is named
  (`Create a New Virtual Card Payment File`); the rest are unknown.
- **`Batch Payment Method`** values — not enumerated, though the payment register lists five payment
  types that are probably the same set.
- **Sales period** as a gate — referenced three times across the run (period close prerequisite,
  sales overlap void exception, batch payment date) and **never defined**. Where sales periods are
  maintained is not in Accounting. **Worth chasing in run 3.**
- **When EFT disbursement posts to the GL** — the virtual card article says explicitly; the EFT
  article does not. Batch 3 established EFT creates one bank rec record per batch, and batch 2 that
  reconciliation transactions post two GL batches for EFT, but the disbursement posting moment is
  unstated.
- **`Validate Bank for National Bank` / `Validate Vendor Remit To for National Bank`** — two unread
  validators implying the National Bank format has pre-flight checks.

**3. Inferences (not quotable, kept out of section B)**
- The five payment methods on the payment register are almost certainly the `Batch Payment Method`
  enumeration; not stated.
- `Complete Payments` probably closes the AP bills at file creation rather than at bank
  confirmation, which would make EFT recognition earlier than virtual card recognition; unverified.
- The per-format EFT sequence number (`ACR.EFT.NATIONAL.SEQ.NBR`) is probably one counter per bank
  per format; not stated, and it matters for cutover.

---

## I. Unknown unknowns (additions)

- **Comdata** as a named virtual card processor with its own void protocol and error code.
- **Nine EFT bank formats** including three Canadian and one Australian.
- **1464-byte fixed record layouts** with six-payment segmentation.
- **Julian date formats** in bank files.
- **Per-format file creation sequence numbers.**
- **Vendor banking identity on Remit-To**, not on Vendor.
- **`Other` field on Vendor Remit-To** holding multiple remittance emails.
- **HTML-or-plain-text email chosen by server OS.**
- **On-Line payments** as a payment method on the payment register.
- **Discount override regardless of terms date**, ungated.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Virtual card | Single-use card disbursement rail; Pending → Transmitted → Completed |
| Response file | Processor file returning virtual card numbers; **triggers the GL posting** |
| Reconciliation file | Processor file stamping settlement post dates; locks payments against void |
| Comdata | Named virtual card processor requiring external void action |
| `STOR` | Error code assigned by STORIS to Comdata response errors |
| EFT batch | Grouped electronic payments; one bank rec record per batch |
| `CP` reference | Six-digit EFT payment reference, the EFT analogue of a check number |
| Remittance advice | Emailed statement of which bills an EFT payment covers |
| Payment register | The maintenance screen splitting and merging checks within a run |
| Take Override | Control forcing or rejecting a discount irrespective of terms date |
| Batch Payment Code | Discriminator permitting multiple concurrent payment batches per bank |
| Sales period | An undefined period concept gating payment batch dates and GL period close |
