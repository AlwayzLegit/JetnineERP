# Run 01 — Accounting — Batch 5: AR Payment Entry, Tender Types, GL Distribution, Reversals

10 articles. Scoped to the tender-settlement half of `W-031`, the AR side of `W-035`
(reversal), and the fourth sighting of hand-editable GL postings.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 41 | Enter a Customer Payment | /articles/15202297408148 | EXTRACTED |
| 42 | Enter a Customer Payment - Actions Menu | /articles/15202277336468 | EXTRACTED |
| 43 | Payment Types | /articles/15202277558804 | EXTRACTED |
| 44 | Restricted Payment Type Entry | /articles/15294753601556 | EXTRACTED — misnamed; see Finding 74 |
| 45 | GL Distribution Screen | /articles/15202277334932 | EXTRACTED |
| 46 | GL Distribution - Vendor Receivables Manual Adjustment GL Postings | /articles/15202312509588 | EXTRACTED |
| 47 | Apply NSF and Correct Misapplied Payments | /articles/15202312760852 | EXTRACTED |
| 48 | Misapplied / NSF Payment Results Screen | /articles/15202309406484 | EXTRACTED — thin |
| 49 | Import Customer Payments | /articles/15202279998868 | EXTRACTED |
| 50 | Payment Information | /articles/15202309628436 | EXTRACTED |

Newly discovered, queued: `Enter a Customer Payment/Refund/Gift Certificate` *(appears in every
batch — high priority)*, `Payment Summary window`, `Check Entry Window`, `Check Payment Settings`,
`Credit Card Payment Settings`, `Credit Card Entry Window`, `Finance Receivable Entry Screen`,
`Gift Certificate Entry Screen`, `View a Gift Certificate`, `Miscellaneous Payment Settings`,
`Financing Payment Plan Settings`, `Receivable Payment Source Settings`,
`Revolving Receivables Control Settings`, `Installment Payment Plan Settings`,
`Accounts Receivable Control Settings` (General tab → Close Payment Dates),
`Overpay Charged Off Accounts`, `Create a User/Group Actions - Receivables Security`,
`Extended Security`, `System Security`, `Access Control Window`, `Bad Debt Payment Entry Screen`,
`Revolving Prepayment`, `View a Customer's Open Transactions`, `Maintain Financed Balances`,
`GL Source Settings`, `List Entry Window`, `Schedule a Process`.

---

## B. Wiring findings

### FINDING 65 — The default GL account is a sentinel that blocks the save
Trigger:    Saving the `GL Distribution Screen`
Invariant:  "you also cannot save out of this screen if the GL batch contains the **`$$$$$-NN`**
            default account number." Also: "Any changes to the GL batch must be valid or you cannot
            save out of this screen."
Evidence:   GL Distribution Screen, /articles/15202277334932
Maps to:    **W-036 — materially refines the contradiction**

> Important correction to batches 1 and 4. The fall-through hierarchy does terminate in a default,
> but that default is a **placeholder token (`$$$$$-NN`), not a real account**, and at least on this
> screen STORIS refuses to save a batch containing it. So the design is: resolve through the
> hierarchy; if nothing resolves, stamp a sentinel; block the operator until a human picks an account.
> That is much closer to `W-036`'s intent than "silently defaults to a suspense account."
> **What we still do not know is whether unattended posting paths enforce the same block** — a
> batch job has no operator to stop. That is almost certainly what fills the suspended-postings
> queue from batch 1, Finding 8. Recorded in section H as the highest-value remaining question.

### FINDING 66 — Hand-editable GL postings are a system-wide pattern, gated by one permission
Trigger:    Filing an AP bill · a manual/adjustment post in `Maintain Financed Balances` ·
            a vendor receivables manual adjustment · a reconciliation transaction (batch 2)
Producer:   `GL Distribution Screen` and `GL Distribution - Vendor Receivables Manual Adjustment GL Postings`
Consumers:  "You can re-assign postings to other accounts and enter offsetting debit or credit amounts."
Gate:       `Edit automated general ledger postings` — **named as living in `Extended Security` on one
            screen and in `System Security` on the other**
Invariant:  Proof (Total Debit − Total Credit) must be **zero** to save and exit;
            invalid accounts render the grid row **red**
Seeded rows: the Vendor Receivables variant pre-seeds row 1 = vendor receivable GL account and
            row 2 = Manual Posting GL account, both from `General Ledger Control Settings`;
            row 1 is locked except for its Remark
Actions:    `Cost Center Distribution` → `List Entry Window` applies a pre-defined cost-center split
Currency:   "although maintenance of foreign currency bills is always in the foreign currency,
            GL is presented for maintenance in **domestic currency**"
Evidence:   "Use this routine to modify auto-generated GL postings." — GL Distribution Screen, /articles/15202277334932
Maps to:    **W-036 — CONTRADICTED (fourth sighting)**, **W-050 — CONTRADICTED (third security system named)**

> Three security subsystems are now on the board for one permission family: `Extended Security`,
> `System Security`, `Create a User/Group Actions - <module> Security`. The same permission name
> is documented in two of them.

### FINDING 67 — Re-opening a filed AP bill shows only the current session's GL changes
Trigger:    Re-accessing an AP bill after the initial file
Invariant:  "this screen displays only changes from the current session. To access the original GL
            batch, use the Post/Update a Journal Entry routine. **If the batch has already been
            posted and you want to adjust an incorrect posting, you must create a new journal entry.**"
Evidence:   GL Distribution Screen, /articles/15202277334932
Maps to:    **W-053 — partially CONFIRMED** (posted batches are immutable; correction is by new entry)

> This is the one place so far where STORIS enforces append-only ledger discipline. Worth copying
> as the general rule rather than the exception.

### FINDING 68 — Payment application is a nine-way destination fan-out from one screen
Trigger:    `Enter a Customer Payment` (back-office entry of cash, checks, credit cards)
Destinations (verbatim): full or partial payments to completed orders · deposits to an existing open
  order · an on-account credit receivable for future application and key-off · full or partial
  payments to charged-off bad debts · installment payments due · additional installment payments ·
  payments to revolving MMPs due · additional revolving payments · MMP prepayments to revolving
Actions menu: On Account · Deposit · Bad Debt · Revolving Prepayment · Additional Payments to
  Revolving and Installment
Action codes shown in grid: `OA` = On Account, `DP` = Deposit, etc.
Exclusion:  "You cannot post revolving deposits to open orders using this process. Instead, use the
            `Enter a Customer Payment/Refund/Gift Certificate` routine."
Invariant:  "STORIS permits only **one reference number at a time per customer** for on-account
            payments. Each payment displays as a separate detail line for that reference."
Evidence:   Enter a Customer Payment, /articles/15202297408148
Maps to:    **W-031 — CONTRADICTED (settlement is not one-to-one)**

> A single tender can land in any of nine places, chosen by the operator at entry. `W-031`'s
> "every tender lands in exactly one settlement path" describes the *bank* side correctly (batch 3)
> but not the *application* side. These are two different problems and our contract conflates them.

### FINDING 69 — Bad-debt payments auto-allocate oldest-to-newest across revolving plans
Trigger:    Bad Debt payment on an account that was charged off while holding revolving plans
Consumers:  "the payment application process applies the payment amount against the completed order
            balances for any revolving plans. **Payments are applied based upon the completed order
            date, oldest to newest.**"
Evidence:   Enter a Customer Payment, /articles/15202297408148
Maps to:    NEW — a documented allocation algorithm, one of very few in the whole run

### FINDING 70 — Five tender types, five distinct capture windows and settings files
Trigger:    Payment Method selection in the `Payment Summary` window
Consumers:
  - **Check** → `Check Entry Window`: Bank Number · Check Type (Personal, Company) · Account Number ·
    Check Number · Driver's License Number. DL mandatory or optional per `Drivers License Prompt`
    in `Check Payment Settings`
  - **Third Party** → `Finance Receivable Entry Screen`: Account Number (from finance company) ·
    Insurance (**None, Single, Joint**) · Amount to be financed · Authorization Number (from finance company)
  - **Gift Certificate** → `Gift Certificate Entry Screen`: Certificate Number · Amount;
    lookup and `View a Gift Certificate` available at the field
  - **Credit Card** → `Credit Card Entry Window`: Card Number · Amount; and, *depending on settings in
    the Payment Type record*, Valid Thru (month) / Of (year) and Authorization Number
  - **Cash** → no window
Lifecycle:  "If you must delete a payment type, be sure all items have cleared for the payment type
            and an **EOM has been run**. In the meantime, you can inactivate the payment type for new
            transactions via the **Expiration Date** field in the associated payment type settings routine."
Evidence:   Payment Types, /articles/15202277558804
Maps to:    **W-031 — CONFIRMED at the capture layer**, **W-032 — partially CONFIRMED**
            (application → approval is upstream; this is the *attach* step: account number +
            authorization number are keyed from the finance company)

> Note credit card expiry and authorization capture are **configurable per payment type**, not
> universal. And insurance (None/Single/Joint) is captured on the third-party finance tender itself.

### FINDING 71 — NSF and misapplied payments are one reversal engine with a manual fallback
Trigger:    `Apply NSF and Correct Misapplied Payments`
Two modes:  NSF returned check — "reverse the payment as well as charge a bank fee to the customer";
            reversals "are based on the information recorded in the initial cash transaction";
            **if the transaction cannot be found, a manual Misapplied/NSF adjustment may be entered**
            · Misapplied payment — reverses on the wrong account; the *correct* account is then
            fixed in `Enter a Customer Payment`
Consumers:  `NSF Check Charge` account (batch 1, AR tab) · bank rec record (batch 3, Finding 35 item 3)
Cascade:    "If an installment contract or revolving plan was **paid off** as a result of a misapplied
            payment, that installment contract or revolving plan is **reinstated** after the
            misapplied payment is adjusted using this process."
Fields:     Customer Code · Reference · Payment Date · Received by Store · Payment Type ·
            Payment Amount · Transaction Date · **Reason** · NSF Check Charge
Evidence:   Apply NSF and Correct Misapplied Payments, /articles/15202312760852
Maps to:    **W-035 — CONFIRMED for AR** (the reversal cascades to contract state, not just to money)

### FINDING 72 — Online card reversals do not refund the card
Trigger:    Misapplying an online credit/debit card payment
Definition: "A credit card is considered online if the **Credit Card Gateway, EMV Shift-4, or Tender
            Retail** are active on your system, regardless of if they are turned on at your specific
            store location."
Consumers:  "The payment being misapplied is reopened by posting a misapplied adjustment credit to
            the closed payment. **Because there is no interaction with external credit/debit
            processing, the credit/debit card is not refunded.** A manual post is created for the
            misapplied online credit/debit payment that can then be applied to the proper payment
            due or adjusted off the account."
Blocked:    ECA (electronic check authorization) check payments cannot use this process at all
Never misapplicable: builder allowance · in-store-use-only gift certificates · customer reward gift
            certificates — "to remove these deposits delete the sales order or replenish the gift
            certificate using `Enter a Customer Payment/Refund/Gift Certificate` with a negative value"
Evidence:   Apply NSF and Correct Misapplied Payments, /articles/15202312760852
Maps to:    **W-030 — CONTRADICTED in spirit**, NEW

> The ledger and the processor diverge here by design. A misapplied card payment is reversed in
> STORIS while the money stays captured at the gateway. Whoever reconciles the merchant statement
> has to know that. Our design should either refund through the gateway or record an explicit
> "processor divergence" obligation, not leave it implicit.

### FINDING 73 — Imported payment posting dates are validated against five independent gates
Trigger:    `Import Customer Payments` (on demand, in `Generate Daily Reports`, or via `Schedule a Process`)
Invariant:  the posting date "cannot be: null, in the future, prior to the last EOD date,
            **in a closed period**, or **closed to payments** (based on the `Close Payment Dates`
            setting on the Actions button on the General tab of the `Accounts Receivable Control Settings`)"
Second gate: "Payments can be backdated as long as the customer's **last cycle date** is beyond the
            payment post date, as certain insurance, interest, and late fees cannot be recalculated
            because of a late payment." Error: *"Cannot post money prior to the last cycle date."*
Config:     `File Path Location` in `Receivable Payment Source Settings` (local PC or NFS) ·
            `Include Imported Payments on Cash Balancing Report` in `Accounts Receivable Control
            Settings` decides whether imported payments reach `Balance a Cash Drawer` ·
            `Allow Payment Agreements` in `Revolving Receivables Control Settings` required even for
            non-revolving imports when payment agreements are in use
Restriction: with `Misapply Payments` checked the routine is **On Demand only** and cannot run in
            `Generate Daily Reports`
Evidence:   Import Customer Payments, /articles/15202279998868
Maps to:    **W-037 — CONFIRMED, and extended by two AR-specific gates**

> This is the most complete period-gate statement in the run so far, and it adds two gates our
> contract didn't anticipate: a *payments-specific* date closure independent of the GL period,
> and a *per-customer* cycle-date floor driven by interest and fee recalculation.
> Also note Finding 22's danger repeats here: imported payments reach cash balancing only if a
> control setting says so.

### FINDING 74 — `Restricted Payment Type Entry` is misnamed; it is a statement-message plan picker
Trigger:    Building a list of revolving payment plans
Consumers:  the list "is used to select the plans to which you are linking specific statement messages
            via `Indicate Message to Print on Customer Statements`"
Evidence:   Restricted Payment Type Entry, /articles/15294753601556
Maps to:    NOT a settlement-path control

> Included for the coverage log and as a warning: the title implies tender restriction and the
> content is statement messaging. Do not seed our glossary from STORIS titles alone.

### FINDING 75 — Cashier identification on payment entry is explicitly not a security check
Trigger:    `Enter a Customer Payment` when `Cash Balancing Control Settings` is set to Balance By Cashier
Consumers:  `Access Control Window` prompts for user Initials and Password
Invariant:  "This is to identify the user entering the payment only; **no security check is performed**
            and the **Reason for Override prompt is not active**."
Evidence:   Enter a Customer Payment, /articles/15202297408148
Maps to:    **W-050 — CONTRADICTED**, **W-051 — CONTRADICTED**

> A password prompt that authenticates nothing. It attributes the payment to a cashier for
> balancing purposes and performs no authorisation. Anyone reading the audit trail would reasonably
> assume otherwise. If we carry the attribution forward we should also carry a real check.

### FINDING 76 — Late-fee history can revoke same-as-cash, with a proceed-anyway warning
Trigger:    Customer payment where `Revoke Same as Cash After ___ Late Fees` in
            `Installment Payment Plan Settings` is enabled and the threshold is passed
Consumers:  "a warning message is displayed to continue"
Evidence:   Enter a Customer Payment, /articles/15202297408148
Maps to:    NEW — a promotional-terms state machine driven by fee count

### FINDING 77 — Overpayment of charged-off accounts is a setting plus a permission
Trigger:    Payment exceeding a charged-off balance
Config:     `Allow Overpayments on Charged Off Accounts` in `Accounts Receivable Control Settings`
Gate:       security access via `Create a User/Group Actions - Receivables Security`
Also in:    `Import Customer Payments` ("If your settings allow, you can also apply overpayments to
            charged off balances")
Evidence:   Enter a Customer Payment, /articles/15202297408148
Maps to:    **W-056 — CONFIRMED**

### FINDING 78 — Credit balances are decomposable to their contributing tenders
Trigger:    `Payment Information`, from the Payment Type cell in `Maintain Order Credits`
Consumers:  shows payment type, date, amount applied to the original order; "both the credit and
            debit amounts that make up the credit balance. Credits display as a positive number and
            debits display as a negative number."
Rule:       "For payments made on account and manual credit memos, the **AR memo reference** displays
            in the Payment Type Code column. If multiple references were used, then '…' appears"
Evidence:   Payment Information, /articles/15202309628436
Maps to:    NEW — this is the data behind Finding 40's refund-method rule
            (one contributing tender → immediate; multiple → check refund)

---

## C. Screen and field inventory

**Enter a Customer Payment** — Date · Customer Code · Location · Bank · Payments · Global Auto-Pay ·
Reference · Amount · A/R · Terms · Adjustment · Proof · Grid (Reference, Action, Amount, Terms,
Adjustment) · Actions (On Account, Deposit, Bad Debt, Revolving Prepayment, Additional Payments to
Revolving and Installment). Open-item display columns: Reference, Deposit, Due Date, Amount,
Transaction Type.

**Payment Summary window** → tender-specific entry windows:
- *Check Entry Window:* Bank Number · Check Type · Account Number · Check Number · Driver's License Number
- *Finance Receivable Entry Screen:* Account Number · Insurance · Amount · Authorization Number
- *Gift Certificate Entry Screen:* Certificate Number · Amount
- *Credit Card Entry Window:* Card Number · Amount · [Valid Thru / Of] · [Authorization Number]

**GL Distribution Screen** — Customer · Type · Account · Remark · Debit · Credit · Grid · Actions.
Read-only variant exists.

**GL Distribution - Vendor Receivables Manual Adjustment GL Postings** — Vendor · Type · Account ·
Remark · Debit · Credit · Totals · **Proof** · Grid · Actions (Cost Center Distribution).

**Apply NSF and Correct Misapplied Payments** — Customer Code · Reference · Payment Date ·
Received by Store · Payment Type · Payment Amount · Transaction Date · Reason · NSF Check Charge.

**Misapplied / NSF Payment Results Screen** — Proceed With Update (plus transaction comments).

**Import Customer Payments** — tabs: Selection, Details.
*Selection:* Source · Location · Date · Misapply Payments · Send Output to · Export Path · Actions · Save.
*Details:* Source · Customer/Source ID · Plan · Agreed Amount · Amount Paid · Grid · Save · Actions.

**Restricted Payment Type Entry** — Pay Type · Description · Grid.

**Payment Information** — read-only; Payment Type Code column, Amount column totalled.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Close Payment Dates | Accounts Receivable Control Settings → General → Actions | Closes specific dates to payment posting, independent of GL period state |
| Allow Overpayments on Charged Off Accounts | Accounts Receivable Control Settings | Permits payment beyond a charged-off balance |
| Include Imported Payments on Cash Balancing Report | Accounts Receivable Control Settings | Whether imported payments reach `Balance a Cash Drawer` |
| Drivers License Prompt | Check Payment Settings | Makes DL capture mandatory or optional on check tender |
| Expiration Date | payment type settings routines | Inactivates a payment type for new transactions |
| Revoke Same as Cash After ___ Late Fees | Installment Payment Plan Settings | Warns and revokes promotional terms after N late fees |
| Allow Payment Agreements | Revolving Receivables Control Settings | Prerequisite for payment import when agreements are used |
| File Path Location | Receivable Payment Source Settings | Local PC vs NFS for payment import |
| Balance By = Cashier | Cash Balancing Control Settings | Triggers the (non-authenticating) Access Control Window on payment entry |
| Credit Card Gateway / EMV Shift-4 / Tender Retail | (system) | Define a card as "online" for reversal purposes |
| ECA (electronic check authorization) | (system) | Blocks NSF/misapply processing for e-checks |
| card expiry / authorization prompts | Payment Type record | Per-tender capture requirements |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Edit automated general ledger postings | **Extended Security** (per GL Distribution Screen) | Editing auto-generated GL postings |
| Edit automated general ledger postings | **System Security** (per Vendor Receivables variant) | Same capability, different system named |
| (unnamed) overpayment access | Create a User/Group Actions - Receivables Security | Overpaying charged-off accounts |
| Access Control Window | — | **Identification only; performs no security check** |

---

## F. State machines and enumerations

**Payment action codes** — `OA` On Account · `DP` Deposit · (others implied, list not given).

**Tender types at capture** — Cash · Check · Third Party (finance) · Gift Certificate · Credit Card.
Check Type: Personal · Company. Finance Insurance: None · Single · Joint.

**Sentinel account** — `$$$$$-NN`, the unresolved-account placeholder; blocks save on GL Distribution.

**GL Distribution row states** — valid (normal colour) · invalid (red). Proof = Total Debit − Total Credit
must be zero to save.

**Reversal outcomes** — NSF (reverse + fee) · Misapplied (reverse only) · manual Misapplied/NSF
(when the original transaction cannot be found). Paid-off contracts/plans are **reinstated** on reversal.

**Non-misapplicable instruments** — builder allowance · in-store-use-only gift certificates ·
customer reward gift certificates.

**Import date validity** — not null · not future · not prior to last EOD · not in a closed period ·
not on a date closed to payments · not prior to the customer's last cycle date.

---

## G. Sequencing rules (additions)

1. Payment type deletion requires all items cleared **and** an EOM run; use `Expiration Date` meanwhile.
2. NSF/misapply reversal is keyed off the original cash transaction; manual entry only if it cannot be found.
3. Reversing a misapplied payment **reinstates** any contract or plan that the payment had paid off.
4. Correcting a misapplied payment: reverse on the wrong account here, then post correctly in
   `Enter a Customer Payment`.
5. `Import Customer Payments` with `Misapply Payments` checked cannot run inside `Generate Daily Reports`.
6. A posted GL batch cannot be edited; corrections require a new journal entry.
7. Proof must be zero before a GL distribution screen will save and release its parent routine.
8. Revolving deposits on open orders must go through `Enter a Customer Payment/Refund/Gift Certificate`.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Does the `$$$$$-NN` block apply to unattended posting?** Finding 65 shows an interactive save
  blocked by the sentinel. Batch jobs, End-of-Day, and imports have no operator to intervene. If
  they stamp the sentinel and continue, that is almost certainly the *invalid transactions* class
  of suspended postings from batch 1. **This is now the single highest-value unresolved question
  in the run** — it decides whether STORIS's ledger can contain silently-defaulted postings.
- **`Enter a Customer Payment/Refund/Gift Certificate`** has now been referenced by name in every
  batch (deposits, refunds, revolving deposits, gift certificate replenishment, charged-off
  payments, receipts) and is not in the Accounting section. It is the real payment screen; the one
  documented here is the back-office subset. **Must locate and dissect.**
- **Full action-code enumeration** — "`OA` = On Account, `DP` = Deposit, **etc.**" The etc. hides
  the rest of the list.
- **`Global Auto-Pay`** — a field on the payment screen, entirely undescribed. Sounds like an
  auto-allocation algorithm, which is exactly the sort of thing we need defined.
- **`A/R`, `Terms`, `Adjustment`, `Proof`** on the payment header — named, arithmetic not stated.
- **`Received by Store`** on the NSF screen — implies the receiving store differs from the
  owning store; relates to the cost-center rule in batch 1, Finding 2.
- **`Type`** column on both GL Distribution screens — undescribed.
- **Manual Posting GL account** is seeded from `General Ledger Control Settings` per this article,
  but batch 1 found `Manual Posting` on the **Accounts Receivable tab of GL Assigned Account
  Settings**. One of the two articles names the wrong settings file.
- **What "cleared" means for payment type deletion** — settlement, reconciliation, or both.
- **Insurance (None/Single/Joint)** captured at finance tender — the downstream effect is not stated.

**3. Inferences (not quotable, kept out of section B)**
- `Global Auto-Pay` is probably the oldest-first allocator that Finding 69 describes for bad debt,
  generalised to open items; not stated.
- The `$$$$$-NN` sentinel is very likely what `Report Suspended Postings` reports as an invalid
  reason; the two articles never reference each other.
- Because card expiry/authorization prompts are per-payment-type, two card tenders can carry
  different data completeness — a migration hazard. Not stated.

---

## I. Unknown unknowns (additions)

- **`Maintain Financed Balances`** — a financed-balance maintenance routine with its own GL
  adjustment path, not in the Accounting section.
- **Credit insurance elected at tender** (None / Single / Joint) on third-party finance.
- **Customer reward gift certificates** as a third gift-certificate species.
- **ECA — electronic check authorization** as a distinct check rail that bypasses NSF handling.
- **Three named card platforms** — Credit Card Gateway, EMV Shift-4, Tender Retail — with
  system-level rather than store-level activation semantics.
- **Payment agreements** as a prerequisite subsystem for payment import.
- **`Receivable Payment Source Settings`** — multiple named external payment sources with their
  own schedules (On Demand / End-of-Day / both).
- **Customer cycle date** as a hard floor on backdating, driven by insurance/interest/fee recalculation.
- **`Same as Cash`** promotional terms revocable by late-fee count.
- **AR memo reference** as an identifier distinct from payment type.
- **Pre-defined cost centre distribution lists** reachable from GL adjustment screens.
- **Foreign-currency bills maintained in foreign currency but posted in domestic currency.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| `$$$$$-NN` | Sentinel account number stamped when the GL hierarchy resolves nothing; blocks interactive save |
| GL Distribution Screen | The screen on which auto-generated postings are hand-edited before filing |
| Proof (GL distribution) | Total Debit − Total Credit; must be zero to save |
| Payment Summary window | The tender-capture container that dispatches to per-tender entry windows |
| Misapplied payment | A payment posted to the wrong account; reversed without touching the processor |
| NSF adjustment | Reversal of a returned check plus a customer fee |
| Online card | A card processed through Credit Card Gateway, EMV Shift-4, or Tender Retail |
| ECA | Electronic check authorization; excluded from NSF/misapply handling |
| MMP | Minimum Monthly Payment due on a revolving plan |
| Revolving Prepayment | Payment against a revolving plan when no MMP is currently due |
| Same as Cash | Promotional term revocable after a configured number of late fees |
| Last cycle date | Per-customer floor below which payments cannot be backdated |
| Close Payment Dates | AR-specific date closure independent of the GL fiscal period |
| Global Auto-Pay | Undescribed auto-allocation control on customer payment entry |
| Access Control Window | Initials/password prompt that identifies but does not authorise |
| AR memo reference | Reference shown in place of a payment type for on-account and manual credit memos |
