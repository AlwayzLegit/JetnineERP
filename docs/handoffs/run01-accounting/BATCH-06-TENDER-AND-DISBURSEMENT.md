# Run 01 — Accounting — Batch 6: The Real Tender Screen, AP Bill Types, and Check Disbursement

10 articles. Two goals: dissect `Enter a Customer Payment/Refund/Gift Certificate` — named in
every prior batch and living outside Accounting — and close out AP disbursement.

**Two findings here change earlier conclusions.** The GL posts on *transaction date, not invoice
date*; and the one-pending-payment-per-bank lock from batch 4 has a config override.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 51 | **Enter a Customer Payment/Refund/Gift Certificate** *(Sales Processing → Sales Order Maintenance)* | /articles/15201409258644 | EXTRACTED |
| 52 | **AP Bill Types** *(Overviews → References)* | /articles/15202012240916 | EXTRACTED |
| 53 | **Accounts Payable Processing Overview** *(Overviews → References)* | /articles/15202013214868 | EXTRACTED |
| 54 | **Payables Control Settings** *(System Administration)* | /articles/15186501543572 | EXTRACTED — field list only |
| 55 | View AP Bill | /articles/15295156090644 | EXTRACTED |
| 56 | Print Checks | /articles/15202012944788 | EXTRACTED |
| 57 | Quick Check Processing | /articles/15202012719892 | EXTRACTED |
| 58 | Export Payable Checks | /articles/15202012946324 | EXTRACTED |
| 59 | Enter a Recurring Vendor Invoice | /articles/15202013215636 | EXTRACTED |
| 60 | Void EFT Batch | /articles/15202011280788 | EXTRACTED |

Newly discovered, queued: `Vendor Settings` (Payables tab), `Vendor Remit-To Settings`,
`Vendor Class Settings`, `Hold Code Settings`, `Terms Settings`, `EDI Control Settings`
(Hold Code for Incoming Bills), `Point of Sale Control Settings` (Payable Approvals on Hold,
Allow deposits on order, POS Payment/Refund/Gift Certificate Receipt), `General System Control Settings`,
`Bank Settings` (Allow Multiple Payment Batches, Default Check Print Bank),
`Payment Card and Device Settings` (Allow Pre-Authorized Deposits), `Convenience Fee settings`,
`Configure Document Signature Capture`, `Configure Document Archive`, `Forms Designer`,
`Open Installment Contracts window`, `Automatic Payment Results`, `Gift Certificate Payment Settings`,
`View a Reward Gift Certificate`, `Report Customer Financing Payments`, `Create a User` routine,
`Create Check Run File`, `Accounts Payable FAQs`, `Credits and Refunds FAQs`, `Vendor Rebate Settings`.

---

## B. Wiring findings

### FINDING 79 — The GL posts on transaction date, not invoice date
Trigger:    Any AP bill posting
Invariant:  "STORIS Accounting updates the general ledger based on **transaction date and not
            invoice date**. For example, for transactions entered in January but invoiced in
            December, the bills post to January."
Evidence:   Accounts Payable Processing Overview, /articles/15202013214868
Maps to:    **W-037 — materially refines it**, **W-069 — refines it**

> This single sentence explains a whole class of reconciliation surprise. A December invoice
> entered in January is a **January** expense in STORIS. Any parity check that ages or periodises
> by invoice date will diverge from STORIS's own trial balance. It also means the period gate binds
> on entry date, which is why backdating is controlled by so many separate settings (batch 5).

### FINDING 80 — The default-account sentinel is confirmed, and its separator is configurable
Trigger:    Automatic GL distribution on an expense AP bill
Invariant:  "You cannot distribute to the GL Default Account (**`$$$$$^NN`**). If this account
            appears on your list, you must specify a different account before you can save and exit
            the screen."
Evidence:   Accounts Payable Processing Overview, /articles/15202013214868
Maps to:    **W-036 — confirms batch 5's Finding 65**

> Second independent sighting of the sentinel block, on a different screen. Note the token is
> written `$$$$$^NN` here and `$$$$$-NN` in `GL Distribution Screen` — the middle character is the
> configurable `GL Account Number Separator` from batch 1. So the sentinel is literally
> "five dollar signs, separator, NN", i.e. an unresolvable root account with a placeholder cost centre.
> Two screens now block on it. **The unattended-posting question from batch 5 remains open.**

### FINDING 81 — Automatic GL distribution is restricted to expense bills and no-cost-centre accounts
Trigger:    `GL Postings` screen → Actions → `List Entry Window`
Consumers:  applies a predefined GL distribution list with percentages; "The program adjusts the GL
            hits to reflect the distribution."
Limits:     "This option is available only for **expense** AP bills, and you can distribute only to
            GL accounts whose cost center is the **No Cost Center Indicator**."
Evidence:   Accounts Payable Processing Overview, /articles/15202013214868
Maps to:    NEW — ties `GL Cost Center Distribution Screen` (batch 1) to a real consumer

### FINDING 82 — Thirteen AP bill types, with numbering gaps
Enumeration (verbatim):
| Code | Type | Description |
|---|---|---|
| MDSI | 01 | Merchandise / Invoice |
| EXPI | 02 | Expense / Invoice |
| FRTI | 03 | Freight / Invoice |
| DSI | 06 | Direct Ship / Invoice |
| COMI | 07 | Customer's Own Material / Invoice |
| SNII | 08 | Special Order Non-inventory / Invoice |
| RFND | 09 | Customer Refund |
| RTVC | 11 | Return to Vendor / Credit |
| EXPC | 12 | Expense / Credit |
| FRTC | 13 | Freight / Credit |
| VRC | 16 | Vendor Receivable / Credit |
| SWC | 18 | Service Warranty / Credit |
| AIC | 19 | Adjusted Inventory / Credit |
Evidence:   AP Bill Types, /articles/15202012240916
Maps to:    **W-044 — CONFIRMED** (`RTVC` is the RTV debit memo), NEW otherwise

> **Types 04, 05, 10, 14, 15, 17 are absent.** Either retired or undocumented. Do not assume the
> list is complete when building our enum — ask STORIS, or expect unknown codes in migrated data.
> Note the invoice block is 01–09 and the credit block is 11–19; 10 is probably the boundary.

### FINDING 83 — The real tender screen has four tabs and they are mutually exclusive per session
Trigger:    `Enter a Customer Payment/Refund/Gift Certificate`
Tabs:       Order Deposits (open orders) · Process Receivables (completed orders) ·
            Gift Cards and Certificates · FR In-Store Payments
Invariant:  "you edit this tab first (once you edit a tab in this routine, you **inactivate the
            others**). To edit another tab, click on the Clear button or the Exit button to start over"
Header lock: date and location default to today and current log-on location and "you can edit these
            fields until you specify a customer, at which time **the header fields lock**"
Session limits: "You can process only **one deposit per session**" (Order Deposits);
            "For refund payments, you can enter only **one payment type per session**"
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    NEW — explains the mixed-tender refund serialisation from batch 3, Finding 42

### FINDING 84 — Plan type determines which tab can take the payment
Trigger:    Payment against a plan
Rules:      "You cannot apply payments to **installment or RTO plans** using the Order Deposits tabs.
            In addition, you cannot use these types of plans on the Process Receivables or Gift Cards
            and Certificates tabs. **FR In-Store Payments can be entered for installment and RTO
            plans and settlement for these plans occurs at the time the payment is applied.**"
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-031 — refines it** — FR in-store payments settle *at application*, unlike every other tender

### FINDING 85 — Deposits gate line-item editing on the order
Trigger:    Adding or deleting line items on an order carrying deposits and/or financing
Gate:       `Delete/Edit line items on transactions with deposits applied` in **Extended Security**;
            "For unqualified users, line items on such orders are **inactive**"
Related:    "This program restricts finance deposit refunds on orders containing unapproved deposits,
            even if the order contains approved financed deposits as well."
Config:     `Allow deposits on order` in `Point of Sale Control Settings` "permits additional deposit
            amounts to be applied to an order when any individual fulfillment is on a manifest"
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-024 — adjacent** (money applied constrains order mutability), NEW

### FINDING 86 — Signature capture and document archiving are wired into payment and refund
Trigger:    Completing a payment or refund on Order Deposits or Process Receivables
Consumers:  `Configure Document Signature Capture` and `Configure Document Archive` — "the signature
            capture ceremony is launched and this signed business document is archived"
Form selection: `Use Extended Payment Receipt` in `Accounts Receivable Control Settings` —
            enabled → **Cash Application** form for both payments and refunds;
            disabled → **Sales Order** form (Order Deposits) or **Payment Receipt** form (Process Receivables)
Deposit case: "If entering a deposit for an existing order, the program prints the **sales order**
            instead of a receipt and includes the new deposit as part of the total deposits for the order."
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-054 — CONFIRMED** (generated documents are archived against their source record)

### FINDING 87 — Convenience fees are jurisdiction- and processor-conditional
Trigger:    Credit card payment on Process Receivables
Conditions: "Convenience Fee settings must be established for the **state and store location** where
            the payment is taken"; "Convenience Fees are only applicable when credit card processing
            is being performed through **Gateway** credit card processing"
Flow:       "When Auto Pay is selected or Reference is specified, first the Payment Summary screen,
            then Credit Card Entry are displayed."
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    NEW — a per-jurisdiction fee rule we have no equivalent for

### FINDING 88 — Refund issuance is three separately-permissioned channels
Trigger:    Selecting a credit item on Process Receivables
Channels:   `Issue Refund By` → **Check** · **Gift** · **Other**, each gated by its own setting in
            `User/User Group Receivables Security`:
            `Enter a Payment/Refund/Gift Certificate - Issue Refund by Check`, `… by Gift`, `… by Other`
Deposit refunds: separate permission — `Enter a Payment/Refund/Gift Certificate - Issue Deposit Refund`
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-050 — refines it** (permission granularity is high here, unlike GL)

### FINDING 89 — Gift certificate handling is a mutually-exclusive three-action tab
Trigger:    Gift Cards and Certificates tab
Gate:       tab is inactive unless `Purchase Gift` is checked in `Accounts Receivable Control Settings`
Actions:    Purchase Gift · Add Funds · Refund Gift Balance — "**only one of the three options can be
            selected on this screen at one time.** The other options become inactive."
Numbering:  "If set to auto-assign gift card/certificate numbers via `Accounts Receivable Control
            Settings`, the system displays a message with the assigned gift card/certificate number."
Receipt:    extended gift certificate receipt when `Use Extended Payment Receipt` is checked;
            "if payment to a gift certificate is made with multiple payment types, **one receipt with
            all payment types** is printed"
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-055 — CONFIRMED** (gift certificate numbering is system-assigned and configurable)

### FINDING 90 — FR in-store payments correct by offsetting pairs, not by edit
Trigger:    Correcting an in-store finance payment
Method:     "to correct a situation in which a customer paid $50.00 in cash but the payment was
            entered as $500.00, re-access the customer and enter payments of **-$500.00 and $50.00**"
Guard:      "The system rejects negative payments that do not match an existing **FR Authorization
            record** unless the `Allow Negative FR Payments for Different Day's Activity` in the
            **User file** is checked for the user."
Preconditions (all must hold): FR module active · the selected provider has a payment type defined in
            the In-Store Payments section of `Finance Provider Settings` · online or offline
            processing established · a contract with the provider to accept (and, if online, transmit)
            customer payments
Gate:       `Enter FR Payments` in the `Create a User` routine
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-032 — CONFIRMED in part** (FR Authorization record is the anchor), **W-035 — CONFIRMED**

### FINDING 91 — Pre-authorized deposits are invisible to the payment screen
Trigger:    A deposit taken under `Allow Pre-Authorized Deposits` in `Payment Card and Device Settings`
Invariant:  "Pre-authorized payments ... are **not displayed and are not available for maintenance**
            in this routine."
Evidence:   Enter a Customer Payment/Refund/Gift Certificate, /articles/15201409258644
Maps to:    **W-030 — CONTRADICTED in visibility**

> There is a class of card money that exists on the order and cannot be seen or maintained from the
> main payment screen. Combined with batch 5's finding that card reversals don't reach the
> processor, the auth-to-capture lifecycle is only partly represented in the AR screens.

### FINDING 92 — The one-pending-check-run-per-bank lock has a config override
Trigger:    `Quick Check Processing` from `Enter/Update Individual Vendor Invoice`
Config:     **`Allow Multiple Payment Batches` in `Bank Settings`**
Behaviour:  not allowed → prompt to activate Quick Check for the bank/pay date; Bank, Pay Date and
            **Alternate Payment Method** fields all inactivate
            allowed → prompt for a **Batch Payment Code**; system validates that a check run for that
            Bank/Date/Code does not already exist
Invariant:  "A bill cannot be added that already exists on a pending check run."
Exit paths: Yes → proceed to Print Checks · No → stay in the routine ·
            **Cancel → "deletes all current AP Bills" and returns to the menu**
Gate:       `Print accounts payable checks` in the **Extended Security** routine
Evidence:   Quick Check Processing, /articles/15202012719892
Maps to:    **corrects batch 4, Finding 55**

> Batch 4 recorded the one-pending-payment-per-bank rule as an absolute. It is not — `Allow Multiple
> Payment Batches` relaxes it, keyed by a Batch Payment Code. Also note the **Cancel** branch
> deletes AP bills, not just the check run. That is a destructive option on an exit prompt.

### FINDING 93 — Check printing is a stateful reprint loop that cannot be suspended
Trigger:    `Print Checks`
State:      after Print, `Starting Check Number` and the Print buttons inactivate and
            `Checks Printed Successfully` activates
Reprint arithmetic: leaving `Last Successful Check` and `Next Available Check` empty reprints all
            checks from `Next Check to Print` up to `Next Available Check`; entering values
            **voids** checks strictly between them and **clears for reprint** all checks
            ≥ `Next Available Check` and < `Next Check to Print`
Invariant:  "If you void a check, the system stores the check with a status of void and **you cannot
            use that check number again.**" Damaged-check advice: clear rather than void.
Terminal:   the loop continues "until you check the `All Checks Printed Successfully` field and click Save"
            — which is also what writes the bank rec record (batch 3, Finding 35)
No resume:  "You cannot start a check run print, save it, and resume it at a later time. When you
            click Exit, a warning appears that you are about to **void all checks**. However, the
            system retains the Pending status for the check run."
Override:   if `Print refund checks` is not enabled and the batch includes customer refunds,
            "users must provide a **security override** to complete this process"
Evidence:   Print Checks, /articles/15202012944788
Maps to:    **W-051 — CONFIRMED** (a real override path), **W-055 — CONFIRMED** (check numbers are never reused)

### FINDING 94 — The check export file leaks the bank account number
Trigger:    `Export Payable Checks`
Invariant:  "**Important: The bank account number is encrypted in the STORIS database; it is not
            encrypted in the check export file.**"
Other:      the export carries a *pending* check number indicating which AP bills map to which check;
            for refund checks the Vendor Remit To Number "is always the Refund Vendor", with customer
            name/address in the Vendor Remit To Name and Address fields and the CUSTOMER file key in
            the Customer Number field
Failure mode: "If a check export file is created but not processed by the third party accounting
            package, **the check run needs to be deleted in STORIS**."
Evidence:   Export Payable Checks, /articles/15202012946324
Maps to:    NEW — compliance-relevant, second such finding after batch 3's full-PAN reveal

### FINDING 95 — Recurring AP bills are generated by End-of-Day and post on creation date
Trigger:    End-of-Day
Producer:   `Enter a Recurring Vendor Invoice` template file
Consumers:  "The End-of-Day (EOD) process examines the records in this file and generates AP bills accordingly."
Invariant:  "**GL hits for recurring AP bills occur on the day EOD creates the bill, and GL hits for
            adjustments occur on the day of the adjustment.**"
Payload:    Last Bill Created · Next Bill to Create · Reference · Description · Bill Line Text ·
            Vendor · Remit To · Remit Comment · Bank · Terms · **GL Account** · Hold Code · Type ·
            Payment Amount · Total Amount · Starting Date · End Date · Due Day · Balance
Evidence:   Enter a Recurring Vendor Invoice, /articles/15202013215636
Maps to:    NEW, consistent with Finding 79

> Note the template carries its own `GL Account` — a **sixth** account-resolution source.

### FINDING 96 — EFT batch void mirrors check-run void, including the period escape
Trigger:    `Void EFT Batch`
Consumers:  "'backs out' the payments for selected AP Bills and reverses the GL postings associated
            with the payment"
Exception:  "This program allows you to void a payment in a **sales overlap period**."
Evidence:   Void EFT Batch, /articles/15202011280788
Maps to:    **W-035 — CONFIRMED**, **W-037 — CONTRADICTED (third sighting of the overlap escape)**

### FINDING 97 — Direct-ship AP bills can be auto-held by a POS setting
Trigger:    Automatic AP bill generation for a direct-ship sale
Config:     `Payable Approvals on Hold` in `Point of Sale Control Settings` — "indicate whether to
            put on Hold AP bills automatically generated for direct-ship sales"
Related:    `Hold Code for Incoming Bills` in `EDI Control Settings`
Evidence:   Accounts Payable Processing Overview, /articles/15202013214868
Maps to:    **W-006 — partially CONFIRMED** (direct ship generates an AP bill automatically)

---

## C. Screen and field inventory

**Enter a Customer Payment/Refund/Gift Certificate** — tabs: Order Deposits, Process Receivables,
Gift Cards and Certificates, FR In-Store Payments.
*Header (all tabs):* Date · Location · Customer Code · Billing Information (Home, Work).
*Order Deposits:* Order · Order Type · Order Date · Order Total · Previous Deposits · Amount Financed ·
Previous Balance Due · Payment Amount · New Balance Due · Escapes · Actions.
*Process Receivables:* Auto Pay · Payment on Account · Reference · Current Balance · Payment Amount ·
Refund Amount · New Balance · Issue Refund By (Check / Amount, Gift / Amount, Other) ·
Gift (Type, Number) · Actions.
*Gift Cards and Certificates:* Select an Action · Purchase Gift · Gift Certificate Type · Add Funds ·
Refund Gift Balance · Gift Certificate # · Gift Certificate Amount · Payment Amount · Refund Check ·
Refund Amount · Escapes · Actions.
*FR In-Store Payments:* Finance Provider · Finance Account Number · Payment Information ·
Payment Type · Payment Amount.

**View AP Bill** *(read-only twin of Enter/Update Individual Vendor Invoice)* — tabs: General,
Invoice Detail, Check Information. Header: Bill · TPA# · Status/Mode.
*General:* Company · Date · Status · Hold Code · Type · Vendor · Invoice Number · Invoice Date ·
Terms Code · Freight Amount · Sales Tax Amount · Miscellaneous Amount · Total Invoice Amount ·
Exchange Rate; Terms Amount and Open Amount display at the bottom.

**Payables Control Settings** — tabs: General, Advanced.
*General:* Vendor Invoicing with Entry of AP Bills · Next Number · Default Terms Code ·
Default Invoice Charges to Inactive · Default Vendor Remit To · Prompt for Company · Company To Use ·
Days to Keep Invoice History · Automatic Creation of AP Bills · Direct Shipments · Bill To Company ·
Refund Bill To Company · Return to Vendor - Use Return Location Company · Pending Bill Conversion ·
**Allowable Cost Variance** · End of Day Action · Allow Payment of Pending Bills ·
Paid Pending Bill Reimbursement Method · Display · Purge History After.
*Advanced (STORIS Accounting only; checks via Enhanced Laser Forms):* Checks · Print Bank ·
Detail Lines on Stub · **Next Positive Pay Batch** · Sort Detail Lines on Stub by ·
Print Checks by Descending Amount · Print Refund Checks at End of Check Run · Bill Aging Days ·
Method · Freight in Terms Amount · Copy Emailed EFT Remittance Advice To ·
Email Header Message / Sent By / Subject for Remittance Advice.

**Print Checks** — Bank · Date · Time · Status · Starting Check Number · Next Check to Print ·
Sort Checks by Bill Number · Limit Detail to One Check · Print Checks · Checks Printed Successfully ·
Last Successful Check · Next Available Check · Update Checks.

**Export Payable Checks** — Bank · Date · Time/Code · File Name · Run.

**Enter a Recurring Vendor Invoice** — Last Bill Created · Next Bill to Create · Reference ·
Description · Bill Line Text · Vendor · Remit To · Remit Comment · Bank · Terms · GL Account ·
Hold Code · Type · Payment Amount · Total Amount · Starting Date · End Date · Due Day · Balance.

**Void EFT Batch** — Bank · Date · Time/Code · EFT Batch Number · Amount · Grid.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Allow Multiple Payment Batches | Bank Settings | **Relaxes the one-pending-check-run-per-bank lock**; adds a Batch Payment Code |
| Allowable Cost Variance | Payables Control Settings → Pending Bill Conversion | The `COST NM` tolerance (batch 4) |
| End of Day Action | Payables Control Settings | Whether/how pending-bill conversion runs at EOD |
| Allow Payment of Pending Bills | Payables Control Settings | Permits paying before receipt |
| Paid Pending Bill Reimbursement Method | Payables Control Settings | Undescribed |
| Automatic Creation of AP Bills | Payables Control Settings | Auto-generates bills (direct ship, EDI) |
| Next Positive Pay Batch | Payables Control Settings → Advanced | **Positive Pay** bank fraud control — new capability |
| Print Checks by Descending Amount | Payables Control Settings → Advanced | Check print order |
| Print Refund Checks at End of Check Run | Payables Control Settings → Advanced | Segregates refund checks |
| Bill Aging Days / Method | Payables Control Settings → Advanced | Drives `View Vendor Bills` aging |
| Payable Approvals on Hold | Point of Sale Control Settings | Auto-holds direct-ship AP bills |
| Hold Code for Incoming Bills | EDI Control Settings | Auto-holds EDI-originated bills |
| Purchase Gift | Accounts Receivable Control Settings | Enables the Gift Cards and Certificates tab |
| auto-assign gift card/certificate numbers | Accounts Receivable Control Settings | System-assigned gift numbering |
| Use Extended Payment Receipt | Accounts Receivable Control Settings | Cash Application form vs Sales Order / Payment Receipt form |
| Allow deposits on order | Point of Sale Control Settings | Additional deposits when a fulfillment is on a manifest |
| POS Payment, Refund, Gift Certificate Receipt | Point of Sale Control Settings | Receipt-print option |
| Allow Pre-Authorized Deposits | Payment Card and Device Settings | Creates deposits invisible to the payment screen |
| Convenience Fee settings | per state and store location | Card convenience fee; Gateway processing only |
| Allow Negative FR Payments for Different Day's Activity | **User file** | Permits negative FR payments without a matching authorization |
| Configure Document Signature Capture / Document Archive | own routines | Signature ceremony and archiving on payment documents |

---

## E. Security permissions catalog (additions)

| Permission | System named | Gates |
|---|---|---|
| Enter a Payment/Refund/Gift Certificate - Issue Deposit Refund | User/User Group Receivables Security | Deposit refunds on Order Deposits |
| Enter a Payment/Refund/Gift Certificate - Issue Refund by Check | User/User Group Receivables Security | Check refunds |
| Enter a Payment/Refund/Gift Certificate - Issue Refund by Gift | User/User Group Receivables Security | Gift refunds |
| Enter a Payment/Refund/Gift Certificate - Issue Refund by Other | User/User Group Receivables Security | Other refunds |
| Delete/Edit line items on transactions with deposits applied | Extended Security | Editing lines on deposited/financed orders |
| Print accounts payable checks | **Extended Security** | Quick Check printing |
| Print refund checks | Create a User/Group Actions - Payables Security | Refund checks (override possible) |
| Select alternate payment methods during vendor invoice entry | **Extended Security section of the User file** *(per View AP Bill)* | Alternate payment method — **fourth placement of this permission family** |
| Enter FR Payments | **Create a User routine** | FR In-Store Payments tab |

> Running count of distinct security subsystems named across the run: `General Ledger User Permissions`,
> `GL Account Staff Security`, `Extended Security`, `Extended Security (Receivables)`, `System Security`,
> `User/User Group Receivables Security`, `Create a User/Group Actions - <module> Security`,
> `Create a User`, and the `User file`. **`W-050` is not merely contradicted; it is inverted.**

---

## F. State machines and enumerations

**AP bill types** — see Finding 82. Invoice block 01–09, credit block 11–19, six numbers unaccounted for.

**Check number states** — available → printed → (void | reconciled). A voided number is permanently
retired; a *cleared* number returns to available.

**Check run** — Pending → printed → (voided). Exit from mid-print voids the checks but keeps the run Pending.

**Gift actions** — Purchase Gift | Add Funds | Refund Gift Balance (mutually exclusive per session).

**Refund channels** — Check | Gift | Other (one payment type per session).

**Linked bill supporting-document classes** — Inventory Received · Inventory Returned ·
Direct-Ship Inventory · Special Order Non-Inventory · COM's · Supplies · Pending Inventory.

**Accounting method** — STORIS AP/GL **xor** TPA, set via `General System Control Settings`.

---

## G. Sequencing rules (additions)

1. GL posting date = **transaction date**, never invoice date.
2. Recurring bills: EOD creates the bill and posts GL on the creation day; adjustments post on their own day.
3. Expense bill entry: quantity × unit cost must equal the General-tab total before you can proceed;
   `GL Postings` screen then appears for account editing.
4. Quick Check requires no existing pending check run for the bank, unless `Allow Multiple Payment
   Batches` is on and a unique Batch Payment Code is supplied.
5. Quick Check status, once activated, "remains active for the remainder of the AP bill approval process".
6. Check printing cannot be suspended and resumed; exiting voids the printed checks.
7. `All Checks Printed Successfully` + Save terminates the print loop **and** writes the bank rec record.
8. If a check export file is created but not processed by the TPA package, delete the check run in STORIS.
9. Only one tab of `Enter a Customer Payment/Refund/Gift Certificate` may be used per session.
10. FR in-store corrections are entered as offsetting negative + positive payments, not edits.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **Unattended posting and the `$$$$$^NN` sentinel** — still open, now with two confirmed
  interactive blocks and no statement about batch paths. **Highest-value remaining question.**
- **Missing AP bill types 04, 05, 10, 14, 15, 17.** Retired, reserved, or simply undocumented.
- **`Payables Control Settings` has no field descriptions.** The article is a bare field list.
  `Paid Pending Bill Reimbursement Method`, `End of Day Action`, `Automatic Creation of AP Bills`,
  `Return to Vendor - Use Return Location Company`, `Vendor Invoicing with Entry of AP Bills` are
  all named with zero explanation. Several are behaviourally significant.
- **Positive Pay** — `Next Positive Pay Batch` is the only mention anywhere. A whole bank-fraud
  control feature with no documented process.
- **Terminology drift:** `View AP Bill` says to edit bills use "**Enter/Update Individual Expense
  Invoice**"; every other article calls it "Enter/Update Individual **Vendor** Invoice". Same screen,
  two names in the official docs.
- **`Escapes`** — a field on two tabs of the payment screen, never explained.
- **`Auto Pay` / `Payment on Account`** on Process Receivables, and `Global Auto-Pay` from batch 5 —
  three auto-allocation controls, none with a documented algorithm.
- **`Order Type`** on Order Deposits — enumeration not given (RTO appears elsewhere).
- **RTO (rent-to-own) plans** — referenced as a plan class with distinct payment routing; no article found yet.
- **Pre-authorized deposits** — where they *are* maintainable is not stated.
- **What a "sales overlap period" is** — third sighting, still undefined.

**3. Inferences (not quotable, kept out of section B)**
- The `$$$$$` root with a `NN` cost centre is almost certainly literal placeholder text rather than
  a configurable value, given it appears with two different separators; not stated.
- `Positive Pay` batches are presumably exported to the bank alongside the check file; nothing says so.
- Because the export file carries a *pending* check number, a failed TPA import probably leaves
  STORIS and the bank disagreeing about which bills were paid — hence the "delete the check run"
  instruction. The docs do not spell out the risk.

---

## I. Unknown unknowns (additions)

- **Positive Pay** bank fraud control.
- **RTO (rent-to-own)** as a plan class alongside installment and revolving.
- **Convenience fees** configured per state and store location.
- **Pre-authorized deposits** as a hidden money class.
- **Gift registry** (surfaced in search: `Create/Update a Customer Gift Registry`,
  `Gift Registry Contributions`) — gift certificates linked to a registry.
- **Customer rewards** issuing gift certificates (`Issue Customer Rewards`, `View a Reward Gift Certificate`).
- **Signature capture ceremony** and **document archive** as configurable subsystems.
- **Enhanced Laser Forms / Forms Designer** as the check layout engine.
- **Emailed EFT remittance advice** with configurable header, sender and subject.
- **Vendor Class Settings**, **Hold Code Settings**, **Terms Settings** as separate master files.
- **`Default Check Print Bank`** resolution across Vendor Remit-To → Vendor → Company settings.
- **Intuit Integrated Financials** as a named pre-loaded configuration with "do not change" defaults.
- **`Open Installment Contracts` window** that opens defensively "to help prevent over payments".
- **Offline FR processing** as an alternative to online transmission.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| `$$$$$^NN` / `$$$$$-NN` | The GL Default Account sentinel; middle character is the configured account separator |
| Transaction date | The date STORIS posts to the GL — entry date, not invoice date |
| MDSI / EXPI / FRTI / DSI / COMI / SNII / RFND / RTVC / EXPC / FRTC / VRC / SWC / AIC | The thirteen documented AP bill type codes |
| Quick Check | Printing a check directly from bill entry, bypassing the normal check run |
| Batch Payment Code | Discriminator allowing multiple concurrent check runs for one bank |
| Positive Pay | Bank fraud-control batch; only referenced, never described |
| Cleared (check number) | Returned to available for reprint, as opposed to voided |
| Escapes | Undocumented control on the payment/refund screen |
| FR Authorization record | The anchor a negative FR payment must match |
| RTO | Rent-to-own plan class |
| Convenience Fee | Card surcharge configured per state and store, Gateway processing only |
| Pre-authorized deposit | Card deposit invisible to the main payment screen |
| Cash Application form | The unified payment/refund document when Use Extended Payment Receipt is on |
| Enhanced Laser Forms | Check printing engine driven by Forms Designer |
