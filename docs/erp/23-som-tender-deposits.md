# Tender Entry & Deposits — Screen-Level Specification

Companion to `05-payments-deposits-cards.md`. `05` states the money model — one payment summary, the tender
rules, deposits as liabilities, auth-then-settle. This file is the screen inventory beneath it: each tender
sub-window field by field, the **four** distinct card-entry windows (`05` treats card entry as one screen;
that is now known to be wrong), the revolving and installment worksheets, and the standalone
payment/refund/gift program's tab model. Cross-references point at `05` and `02` rather than repeating them.

Screens covered: 4, 12, 15, 18, 33, 34, 35, 36, 37, 40, 46, 48, 50, 51, 52, 69, 70, 71, 75, 76, 77, 95, 96,
108, 110, 126, 130, 132, 133, 138, 158.

---

## 1. The tender screen graph

`[DOC]` All tender funnels through the **Payment Summary Window** (108), a router: the method chosen there
determines which sub-window opens. Cash is the only type with no sub-window.

```
ENTRY CONTEXTS ──► PAYMENT SUMMARY (108) ──► per-type sub-window
  order entry, Payment tab                      CASH        → inline Amount field, no window
  order completion                              CHECK       → Check Entry (18)
  Enter a Customer Payment                      CHECK/ECA   → Electronic Check Entry (46)
  Enter a Customer Payment/Refund/              CREDIT CARD → one of four windows, §5.1
    Gift Certificate (50), all four tabs        DEBIT       → Debit Card Payment Entry (40)
  Enter a Sales Order > Payment page >          GIFT CERT   → Gift Certificate Entry (75)
    Deposits – Payment Type Code (extra Action) 3RD-PARTY   → Finance Receivable Entry (70)
                                                REVOLVING   → Revolving Worksheet Full (132)
                                                               or Short (133), per one setting
                                                INSTALLMENT → never a deposit; §7.6, §8.3
```

`[DOC]` Sub-windows return to the summary on save. Adding a second tender is always "save the sub-window,
pick a new type at the summary": the **Type field is read-only in every sub-window** (18, 34, 35, 40, 46, 70,
75), so correcting a type means abandoning and restarting the payment.

`[DOC]` Screens that fire from the summary rather than from a type:

```
cash tendered anywhere in the transaction → Amount Tendered Window (12), end of payment phase
card swipe + Extended Security enabled    → Credit Card Security Screen (37)
card declined                             → Authorization Display Screen (02 §8)
auto-pay Save in program 50               → Automatic Payment Results (15)
customer has open installment contracts   → Open Installment Contracts (96)
financing headroom exists on the order    → Additional Financed Amount Screen (4)
```

---

## 2. Payment Summary Window (108) — beyond `05`

- **Payment Amount is not always enterable `[DOC]`.** Signature Capture off ⇒ active **for cash only**; every
  other type takes its amount in its own sub-window. Signature Capture on ⇒ a second path: leave Pay Method
  blank, click Swipe Card, the field opens; verify, click Add, which activates the PIN pad.
- **Two limits fire on amount entry `[DOC]`:** `Customer Daily Cash Limit` and `Payment Class Access` (Finance
  Provider Settings) are checked immediately — the per-customer cash cap is enforced here, before any
  sub-window, and is distinct from the refund cap `Daily Maximum Cash Refund Per Customer`.
- **Balance `[DOC]`:** remaining balance for order payments; **inactive and blank** for non-order payments.
  Render nothing, not zero.
- **Swipe-first `[DOC]`:** a swipe populates Payment Method *and* fills Payment Amount with the full amount. A
  swiped debit card opens window 40 with type `DEBIT`; if `DEBIT` is keyed here first, all later amount edits
  must happen in window 40. **Accord D** inverts this: the method must be keyed *before* the swipe.
- **Available customer credit `[DOC]`:** when opened to apply a deposit and the customer holds a credit
  applicable to the order, a message with the amount displays at the bottom — in any deposit-taking process,
  **not** for returns or dollar-only credit adjustments. Applying it needs Payment Method blank.
- **Financing gate `[DOC]`:** with `Require Credit Application` checked, a valid application must exist or a
  warning blocks the financing type; accepted ⇒ the operator lands on 70, 133 or 132 by plan kind.
- **Refund card selection `[DOC]`:** **double-click the card's grid row** and the card window opens
  pre-populated — only when `Validate Original Payment on Refunds` (POS Control > Customer) is on **or** EMV
  is in use. Suppression conditions: `05` §EMV/terminal.
- **Auto-pay validation on Save `[DOC]`:** only with Auto-Pay or Global Auto-Pay on. The payment must be
  **≥ the sum of Standard MMP** across the customer's plans (per *View All Revolving Plan Activity for a
  Customer*); less ⇒ error and return here. Exception: when **Total Due is less than** that sum, Total Due is
  validated and collected instead. Gift certificates are blocked at the method field on returns and exchanges
  (`05` rule 1).

**Actions menu `[DOC]`:**

| Action | Active when |
|---|---|
| COD Worksheet | Delivery/pickup order; shows anticipated COD amount |
| Credit Cards Already on File | **Both** the Shift4 module **and** `Token Sharing Active`. A "Cards On File" indicator appears beside the window when tokens exist |
| Deposit Maintenance | **Only while Payment Method is blank.** Applies an available customer credit |
| Pre-Authorized Deposit | Three-branch gate, §5.6 |
| Finance Credit Application | Bottom Actions button; opens screen 69 |

---

## 3. Cash and change

**Amount Tendered Window (12) `[DOC]`** — appears at the end of the payment phase of **every** transaction in
which cash was offered, including after save in *Adjust Dollars on a Completed Order*.

| Field | Behaviour |
|---|---|
| Amount Tendered | Cash applied; defaults from the Payment field on the Payments tab; editable. **Enter activates OK** |
| Amount Paid | Read-only. Total of **all** payments on the transaction, every type (e.g. cash + card) |
| Change Due | Read-only |

`[INFER]` Change Due = Amount Tendered − the cash portion of the total; the formula is never given and
negative change never discussed. `[DECIDE]` Nothing says tendered and change are **persisted** — persist both
on the payment event.

**Open Cash Drawer (95) `[DOC]`** — one menu action opening the drawer attached to the workstation; **Cash
Drawer Settings** separately configures automatic opening. `[DECIDE]` A manual drawer-open is a shrink event
and STORIS logs nothing. Require a permission and an audit row (user, workstation, drawer, time, reason).

---

## 4. Check and electronic check

**Check Entry Window (18) `[DOC]`**

| Field | Rule |
|---|---|
| Type | From the summary; read-only |
| Amount | Full outstanding defaults **only if** `Receive a Default for the Payment Amount` is set on the user/group receivables security; else mandatory manual entry |
| Check Number | Free entry |
| Driver's License Number | Mandatory **or** optional per `Drivers License Prompt` on the Payment Type (Check) record |

Multiple checks per transaction; partial payment allowed **except on Take-With**, where the full amount due is
required. (Restated identically in 18, 34, 36, 46, 75; `05` rule 10.)

**Electronic Check Entry Window (46) `[DOC]`** — the ECA (electronic check authorization) variant: window 18
plus a bank record and a device path.

| Field | Rule |
|---|---|
| Check Number | Auto-filled by an electronic check reader; otherwise typed |
| Check Type | `Personal` \| `Company` |
| Bank Number | Routing number; read by the reader, typed if none |
| Account Number | Checking account number; filled by the reader. **On re-access after save, all but the last four digits are encrypted** |
| Driver's License Number | Mandatory or optional per `Drivers License Prompt` (Check Payment Settings) |
| State | Licence-issuing state. Search opens a Read-Only Lookup containing **only jurisdictions classified State/Province in Sales Tax Settings** — Local and National excluded |
| Authorization Number | Returned by the ECA service; **not editable** |

**The device decides the transaction class `[DOC]`:**

```
typed by hand (no reader)   → Electronic Guarantee (EG) only     — authorization only
scanned with a check reader → EG and Electronic Conversion (EC)  — per settings
```

`[INFER]` EC converts the paper check to an ACH debit; EG only guarantees it. Different funds-movement paths,
so this is a persisted attribute of the payment, not a UI mode. Unmasking: Actions > Account Number Full
Display → Access Control Window, gated as in §5.5. `[DOC]` **Content defect:** article 46 documents **Check
Type twice**, verbatim — implement one field. `[DECIDE]` The licence-state lookup reads the **sales-tax
jurisdiction table**, which will lack states with no nexus; use a real state/province list.

---

## 5. Cards — four entry windows, one security screen

### 5.1 The four windows compared `[DOC]`

| | **36 Credit Card Entry** (standard/gateway) | **33 Credit Card (EMV) Entry** (Shift4) | **34 Credit Card (External) Entry** (Tender Retail) | **35 Credit Card Entry – Read Only** |
|---|---|---|---|---|
| Chosen when | No EMV module; gateway/legacy | EMV module = **Shift4** | EMV module = **Tender Retail** | Viewing an existing card payment |
| PAN captured | **In STORIS**, typed or swiped into the window | Not in STORIS; masked number shown only on a "double-click" refund | **On the terminal**; masked value echoed back | Nowhere; display only |
| Card Number field | Enterable, no spaces, leading `X` rejected | **Display-only, masked, hidden when unpopulated** | Masked echo; **inactive for debit** | Masked, all but last four encrypted |
| Payment Terminal | Absent | Present (EMV Terminal Settings) | Present (EMV Terminal Settings) | Absent |
| Verify Card Number | Present; active only on manual entry **and** `Validate Manual Entry` on | Absent | Absent | Absent |
| Card Present | Checkbox, **defaults blank**, manual entry only, **not stored** | Checkbox, **defaults CHECKED**; ignored when Swipe Card is used; **inactive and unchecked on a two-click refund** | Not documented | Absent |
| Month / Year | Present if flagged Mandatory | Absent | Present if flagged Mandatory | Present if flagged Mandatory |
| CVV | Present; only if `Prompt for CID` on for that card type; **not stored** | Absent (pin pad) | Absent (pin pad) | Absent |
| Authorization Number | Present | Present, and **Swipe Card stays inactive until it is entered** | Present if flagged Mandatory | Present if flagged Mandatory |
| Swipe Card | Active if device connected and Signature Capture on; a swiped entry cannot be edited | Starts a pin-pad transaction | Active if device connected and Signature Capture on | Absent |
| Unmask action | Yes | Not documented | Yes | Yes |
| Editable | Yes | Amount, auth, card-present | Amount, auth, expiry | **Nothing** |

**Purpose differences `[DOC]`:**

- **33 (Shift4)** is triple-duty: manual entry, *viewing* an approved transaction, and initiating a
  **two-click tokenized refund**. Three refund modes are named — **two-click** (tied to a prior sale),
  **independent** (not tied to one), **double-click** (an exchange/return with refund due that included card
  payments; this is what populates the masked Card Number).
- **34 (Tender Retail)** exists so cardholder data never enters STORIS: the terminal prompts for PAN and CVV
  and talks **directly to the MCM server**, which forwards to the Merchant Services Provider. STORIS prompts
  only for amount and authorization number.
- **35 (Read Only)** **re-applies encryption as soon as the window is exited** — the unmask is scoped to the
  window instance, not the session.

`[DECIDE]` **Window 33's Swipe Card is inactive until an Authorization Number is entered**, yet for a normal
sale the auth number is a *result* of the swipe. Either this is exclusively a voice-auth / force-capture path
or the doc is wrong; confirm before shipping a UI that demands an auth code before a swipe.

`[DECIDE]` **Card Present defaults CHECKED in 33 and blank in 36.** It drives interchange and liability
shift, and in 33 a checked box on a manual sale or independent refund makes the **pin pad prompt for the
cardholder's signature** on approval — behavioural, not cosmetic. Default it unchecked, or derive it from the
entry channel and never let it be typed; a default asserting presence is a chargeback-liability defect.

`[DECIDE]` Windows 34 and 35 read Mandatory flags from **"Credit Card Payment Settings"** and **"Payment Type
(Credit Card) System Settings"** — almost certainly one record under two names. Model one.

### 5.2 Credit Card Security Screen (37) `[DOC]`

Fires automatically **when a card is swiped in order entry**, and only when `Extended Security` is enabled in
Credit Card Validation Settings. One field, **Enter Last Four Digits**, mandatory to complete the transaction:
keying the last four printed digits defeats a swipe of a re-encoded card whose face does not match its stripe.
**It does not apply to manually keyed cards.** `[INFER]` The comparison is against the last four decoded from
track data. `[DECIDE]` Failure behaviour is undocumented — define it (three attempts, then void the
authorization and require a manager override).

### 5.3 Debit Card Payment Entry Window (40) `[DOC]`

Type (display, from the summary); Amount (defaults per `Receive a Default for the Payment Amount`, else
mandatory); Card Number — **up to 19 characters**, manual validation impossible, the card **must be swiped**.

- **Signature Capture must be active for debit to exist as a payment type at all.**
- Selecting an existing debit payment from the grid to view or edit **inactivates the Card Swipe button**
  until that payment is finished — a modal lock, not merely a disabled control.

### 5.4 EMV Terminal Selection (48) `[DOC]`

Order entry (sales order, exchange, return, …) > Actions > **Assign Payment Terminal**; also from the Order
Deposits tab of program 50.

```
Grid: Terminal ID        alphanumeric, assigned in the Shift4 UTG
      Description        from EMV Terminal Settings
      Signature Capture  Yes | No — can this terminal capture signatures digitally
```

- Grid **filtered by the operator's logon location**; double-click selects and **replaces** the prior choice.
- **The assignment persists until another terminal is chosen or the operator logs off** — session state keyed
  to the login, not to the order.

`[INFER]` Since Payment Terminal is mandatory for card tenders (`05`), an operator with none assigned cannot
take a card. Prompt at login in EMV locations rather than failing at the payment.

### 5.5 Unmasking `[DOC]`

Two permission names appear for what looks like one gate: `View Encrypted Finance, Credit Card, Check Account
Numbers` and `View Masked Account Numbers`. Procedure (article 35, the only full statement): Actions >
*Credit Card Number Full Display* → **Access Control Window** → enter STORIS code and password → the screen
redisplays un-encrypted.

`[DECIDE]` `05` says a **second** authorized user must authenticate; article 35 says "your STORIS code and
password". Take the stricter reading: re-authentication by a permission-holder, logged, scoped to the window
instance. Per `05` §Tokenization none of this should be built as written — with processor tokenization there
is no stored PAN to unmask and the permission collapses to "may view last four + brand".

### 5.6 Pre-Authorized Deposit (110) `[DOC]`

Shift4 only. Summary > Actions > Pre-Authorized Deposit, where the summary came from Enter a Sales Order >
Payment page > extra-Action at *Deposits – Payment Type Code*.

```
AVAILABILITY
1. The summary must have been opened from Enter a Sales Order.
2. A web pre-auth exists → available only if it was APPROVED.
                           Declined → unavailable; manage via Process Web Payments.
3. No pre-auth and no web pending deposit → requires ALL of:
     `Allow Pre-Authorized Deposits` (Payment Card and Device Settings) enabled
     operator logged into a Shift4 processing location
     current order balance > 0

INQUIRY (read-only) MODE when:
   a web-obtained pre-auth's processing setup ≠ the login location's setup, OR
   an in-store pre-auth exists and the login location is not a Shift4 location
```

**Fields.** Card #, Auth #, Type, Original Pre-Auth Amount (display, only when a pre-auth exists); Order
Balance; Modified Pre-Auth Amount (display, only after a change); **Amount** (enterable, may default to a
calculated value); **Pmt Terminal** (active **only** when obtaining a *new* pre-auth — releasing needs none,
and Swipe Card or Save with none selected raises a message); **Card Present** (relayed to the processor).

**Amount changes `[DOC]`:** a new amount plus Save **sends no new pre-authorization request**. Decreasing
returns the difference to the customer's credit limit. Increasing is allowed while the increase is
**≤ `Amount Increase Limit`** (Payment Card and Device Settings > EMV tab); above it, an override by a holder
of `Override Pre-Authorized Deposit Amount Increase Limit`. With no pre-auth on file, entering an amount
**activates Swipe Card**.

**Release `[DOC]`:** *Release Pre-Authorized Deposits* converts the original pre-auth **into a sale
transaction**, and if the amount was modified upward **creates a second sale transaction for the difference**.
No swipe or card entry is needed; the customer need not be present.

```
approved            → return to summary; row appears in the grid as an approved deposit
declined            → the pre-authorized deposit is REMOVED from STORIS
declined (referral) → Authorization Display Screen; "M - Manual Authorization" IS available
communication error → the pre-authorization REMAINS in STORIS
```

**New pre-auth by swipe `[DOC]`:** approved ⇒ approval message, return to summary; declined ⇒ Authorization
Display Screen with bank data in Bank Response and **`M - Manual Authorization` INACTIVE** (the
swiped-pre-auth exception in `02` §8). **Delete** (command bar) voids the pre-auth: a void goes to Shift4 and
the record is removed.

### 5.7 Receipt Lookup by Credit Card (126) `[DOC]`

Point of Sale > Electronic Interfaces > Credit Card > Receipt Lookup by Credit Card. **Shift4 only** — not
STORIS Legacy, not Tender Retail.

- **Start Date** defaults to **30 days prior**, changeable but **never more than 60 days prior**; the range
  always includes today and filters on Order Date. **Card Type** and **Last 4 of Card #** are the
  card-not-present path; Card Swipe searches with none of the three filled.
- Save runs the search; grid returns **Reference Number, Name, Amount, Order Date**; selecting a row generates
  a Shift4 receipt to review, print or email.
- **Eligible:** all **sales and pre-authorizations**. **Excluded:** returns, voids, declines, any other
  transaction type, **installments, financed receivables, revolving receivables**.

> "Depending on your transaction retention days setting, the entire period you selected to be searched may
> not be available."

`[DECIDE]` Emailing a receipt found by card digits is a data-egress path: gate it and log recipient and
operator.

### 5.8 Automatic Payment Results (15) `[DOC]`

Fires on Save from the Process Receivables tab of program 50 when Auto Pay was used. **Proceed with Update** —
checkbox, **checked by default**; clearing it cancels the update. **Text Entry Window** — displays the amount,
the payment type, and **how the payment will be applied** (`on account`, `add-pay to revolving`, …;
`[PARTIAL]` the domain is not closed). `[DECIDE]` A confirmation defaulting to "post it" is a weak control
over automatic allocation across a customer's plans. Default it unchecked or use an explicit Post button.

---

## 6. Gift certificates

**Gift Certificate Entry Screen (75) — redemption `[DOC]`**

| Field | Rule |
|---|---|
| Type | From the summary; display only |
| Payment Terminal | Active **only at Shift4 locations**; when active it is **required**. Swiping with none assigned raises a warning |
| Certificate Number | Search opens *View a Gift Certificate*. Swipe permitted when active. **All but the last four digits are encrypted** |
| Verify | Active only when `Validate Manual Entry` (AR Control) is checked **and** the number was typed. Must match |
| Amount | Defaults per `Receive a Default for the Payment Amount`; else mandatory |

- Multiple gift cards per transaction; partial payment allowed **except Take-With**.
- **Card Swipe is active on Shift4 and inactive on Tender Retail.**
- **Bar-coded pre-purchased cards may be scanned even when the operator lacks the permission to key gift
  numbers manually** (`Type in Gift Certificate/Card number during payment entry`). Bar codes must be
  **`3OF9` or `CODE128`** and the card prefix must match `Card Number Prefix` (AR Control).
- **A builder-allowance gift certificate applied as a deposit has no effect on the contractor's credit limit —
  no credit checking runs at that time.**

`[DECIDE]` The scanner bypass is a real hole: a scanner is a keyboard. Put the control on the verified entry
channel, not on the widget.

**Gift Certificate Number Entry Window (77) — numbering a purchase `[DOC]`** — program 50 > Gift Cards and
Certificates > check **Purchase New Certificate** > pick a gift payment type. One field, **Gift Certificate
Number**.

- **The window does not appear at all when a number exists at `Next Number` (AR Control)** — auto-numbering
  suppresses it entirely. With **`Require Swipe for Purchase`** checked the operator **cannot key a number**.
  Save → the Payment Summary.
- **Without Signature Capture a "wedge" device can still assign a number** by swiping while the window is
  open: the Swipe button stays inactive but a connected wedge works. `[INFER]` The wedge injects keystrokes;
  the button is only the API path.

**Gift Certificate Manual Authorization Entry Screen (76) `[DOC]`** — appears when creating a gift certificate
for a customer (e.g. *Issue Customer Rewards*) **and** automatic numbering is disabled. Same single field; the
next available number pre-fills when `Next Number` is active, else manual entry or swipe. `[DECIDE]` 76 and 77
are the same one-field window with different callers; build one component.

---

## 7. Financing tender surface

### 7.1 Finance Credit Application Selection (69) `[DOC]`

Enter a Sales Order > Customer or Payment tab > Actions > Finance Credit Application.

```
Credit Application Type: REVOLVING → Request Credit Information
                         FINANCING → Request For Finance Provider Application
```

### 7.2 Finance Receivable Entry Screen (70) — third-party financing `[DOC]`

| Field | Rule |
|---|---|
| Type | From the summary; not editable |
| Account Number / Lease Number | Provider-assigned account number (revolving) or **Lease ID** (Rent-to-Own). Search → *View Available Financed Credit*. `Allow for a Finance Plan to be Applied to an Order Prior To Account Number Assignment` (Finance Provider Settings > Online Transmit) decides whether the plan may attach before an account number exists |
| Insurance | Visible and active only with `Prompt for Insurance` (Financing Payment Plan Settings). **Reporting only — never referenced when obtaining authorizations.** None / Single / Joint |
| Amount | Defaults per `Receive a Default for the Payment Amount`; **may be capped by `Maximum Deposit Percent`** |
| Authorization Number | Manual for **non-transmitting** providers. **An inactive field means the provider transmits and the request goes electronically** |
| Finance Comments | Free text needed by the provider (e.g. ID validation); **appended to the audit comments**. Mandatory to save when `Finance Comments Required` is set |

- **Deposit ceiling `[DOC]`:** `Allow Deposits on Stock Mdse` (Financing Control) checked ⇒ `Maximum Deposit
  Percent` × **all** merchandise; unchecked ⇒ the percent applies to the **special-order total only**.
- **Credit hold `[DOC]`:** no authorization number ⇒ AR credit hold with **code `F3`**. `05` states the hold
  without a code and separately records `F5` for driver-licence verification failure — two distinct codes.
- `[DOC]` **Content defect:** article 70 contains its whole body twice; the copies disagree on the field label
  ("Account Number/Lease Number" vs "Account Number") and the duplicate drops the Lease ID / RTO wording.

### 7.3 Additional Financed Amount Screen (4) `[DOC]`

Appears **automatically** during payment in order entry when (a) a balance is due **and** (b) the customer's
maximum approved financing for the order exceeds the amount currently financed.

```
Available Amount  (read-only) = maximum approval amount − amount currently financed
Additional Amount (entry)     = the increase; MUST NOT exceed Available Amount
```

Documented example: approved for $2,000 across three items, the customer declines one worth $500 before
completion; $500 remains, and adding another item raises this screen with $500 available. The purpose is to
**consume the existing authorization rather than request a new one**. Related: `Maximum Finance Approval` on
Additional Order Detail.

### 7.4 Revolving Worksheet Full (132) and Short (133) `[DOC]`

Both are reached identically — Enter a Sales Order > Payment tab > a Revolving Receivables Payment Plans code
at the Payment **or** Financing field — and both also from debit exchanges and service orders. **One setting
picks which appears:**

```
Revolving Receivables Control Settings > "Access Worksheet within Sales Order Entry"
   enabled  → FULL (132)  — salesperson SEES the customer's credit information
   disabled → SHORT (133) — salesperson does NOT
```

`[DECIDE]` That setting is system-wide, so credit-information visibility cannot vary by role. Make it a
permission.

**Short worksheet:** Plan (display); Insurance; Finance (defaults to the order's open amount, may be lower,
never higher); Payment (active **only** for Per Sales Order plans); New MMP (active for **all types except**
Per Sales Order, calculated once plan, insurance and finance amount are set). Actions > View Term/MMP Table
opens screen 158.

**Full worksheet** adds four blocks.

*Customer* (all display-only): Customer, Name, **Co-applicant / Co-signer** (label switches to match, name
from the credit application), **Comments** (one line inline, several render an ellipsis requiring Actions >
View Customer Credit Comments), Plan, **Balance $** = long-term + short-term due (`0.00` for new plans),
**Due Day** (1–28), **Current Due $** = short-term due, **% of Balance**, **Activated** = the date the plan
opened or the literal `Pending`, Remarks. *Percentage Rate:* Plan %, Promotional %, **State Maximum %** (Sales
Tax Settings), Prime Interest Rate %.

*MMP Plan Information:*

```
Current $    current MMP for this plan
Pending $    estimated MMP for pending "fixed term" and "per sales order" plans;
             = 0 for "fixed MMP table" and "fixed MMP amount" plans, because those
               pending amounts are already inside This Order $
This Order $ estimated MMP for the new plan on this order
Other        combined MMP of the customer's other revolving plans,
             EXCLUDING the master plan's MMP if a master plan exists
TOTAL        = Current + This Order + Other      (Pending is NOT in the sum)
```

`[DECIDE]` TOTAL excluding Pending is stated explicitly and is either a deliberate double-count guard or a
documentation error. Verify against live data.

*Sales Order Table* (Per Sales Order and Per Sales Order Using a Fixed Term only): Term ascending, MMP
descending. *Payment Agreement* (plans allowing one): Source; **Per Month** = 1, 2 or 4; **Total of Payments**
= term months × payments per month (example: 6 months × 2/month = 12); **Payment $** = MMP ÷ payments per
month. Actions > Payment Agreement opens *Enter Payment Agreement*, active **only** for new/pending plans or
existing plans without an agreement.

**Field rules worth carrying `[DOC]`:**

- **Finance $ is mandatory**, defaults to the order's open amount, never exceeds it.
- **MMP $** is enterable only for Per Sales Order and As a Fixed Amount plans. Per Sales Order: calculated
  from the chosen Term, overridable within [lowest MMP allowed by plan settings, financed amount for this
  order]. For an **existing** As a Fixed Amount plan the Fixed MMP Table projects on **new financed amount +
  pending financed amounts on the same plan + long-term amount due on the existing plan** — not on the order
  amount alone.
- **Term Months** is operator-entered only for Per Sales Order; other term-based types fill it from plan
  settings, uneditable here.
- **Insurance** is editable only before activation; afterwards it goes through *Enter a Customer's Revolving
  Terms & Conditions* with `Change or remove insurance on a customer's revolving plan`. The list is filtered
  by **state and cutoff age**. `Apply Insurance by Plan Setting` = **Customer** ⇒ the customer's code
  defaults, uneditable (dropdown inactive under `Exempt from Insurance Charges`); = **Plan** ⇒ selectable
  unless exempt. **Insurance affects the MMP for Fixed Term plans only.**
- **Deposit Hold Back override:** the plan's minimum deposit percentage **overwrites** `Deposit Hold Back` on
  Additional Order Detail when greater — a financing choice mutating an order-level field. Model it as a
  derived value with provenance.
- **Missing insurance:** with `Insurance Required` or `Prompt for Insurance if Not Added to Revolving
  Worksheet` on, two prompts appear — "Insurance Selection is Required", and a reminder asking whether to add
  it now. Insurance letters print per `Single Prompt for Insurance Change`; the operator **may not decline**
  to print the insurance and/or cancellation letter, and a signature is required under `Signature Required`.
- **MMP reduction on Save** (both worksheets and 158): for fixed-MMP-amount plans, when current amount due
  plus pending financed amount warrant a lower MMP, a prompt offers the new MMP with accept/reject — **only
  if the operator holds the (unnamed) MMP-reduction security setting**.

### 7.5 Fixed MMP Table (71) and Term MMP Table – Read Only (158) `[DOC]`

**71** — from *Enter a Customer's Revolving Terms & Conditions* or the Full worksheet's Fixed MMP Table
button. Header shows **Pending**, **Active**, **Finance Amount**. Grid: Months × Projected MMP Amount, bounded
by the plan's minimum and maximum term months; **projections include principal, interest and insurance**.
Double-click populates the entry screen's MMP, or use the grid as a guideline. Applies **only** to plans
calculating MMP *As a Fixed Amount* (min term 6 / max 24 ⇒ rows 6 through 24).

**158** — from the Short worksheet's Actions > View Term/MMP Table. Term ascending, MMP descending, for **Per
Sales Order** plans only. `[DOC]` **Content defect:** it is titled *Read Only* yet documents a **Save**
carrying the full MMP-reduction prompt. `[DECIDE]` Treat it as read-only; the reduction belongs on the
worksheet's Save, where it is also documented.

### 7.6 Additional-payment plan selection (51, 52) and Open Installment Contracts (96) `[DOC]`

Both selectors come from program 50 > Process Receivables > Actions.

```
Enter a Customer's Revolving Plan (51)
  Customer (display) + Plan (mandatory dropdown)
  ONLY for customers with ≥1 active revolving plan with a balance AND no MMPs currently due
  Save → Payment Summary

Enter a Customer's Installment Contract (52)
  Customer (display) + Contract (mandatory dropdown)
  ONLY for customers with ≥1 active installment contract with no payments currently due
  Save → Installment Receivables Payoff As-of Date → (Save again) → Payment Summary
```

`[INFER]` The "nothing currently due" gate is what makes these the *additional* / pre-payment paths: when a
payment is due, money must flow through Auto Pay so it lands on the due item first.

**Open Installment Contracts (96)** opens **automatically** on the Process Receivables tab when the customer
has open installment contracts, to prevent overpayments that would need refunding. All read-only: **Contract
Number**, **Regular Monthly Payment**, **Payment Due Today** (all short-term amounts due), **Contract Payoff
Amount**. **It opens regardless of whether Auto Pay is enabled**, can be closed at any time, and **requires no
payment or refund action**.

---

## 8. Deposits

**Sales Order Deposits (138) `[DOC]`** — a concept article confirming the type→window routing during order
creation: Check → 18, third-party → 70, Gift Certificate → 75, Credit Card → 36. Its substantive rules
(deposits uneditable once the order is exited; new deposits only via the summary in order entry, program 50,
or Enter a Customer Payment; the `Allow Deposits on Stock Mdse` ceiling; credit hold with no authorization
number) are in `05` §Deposits and §7.2 above.

**Required Deposits by Line Display (130) `[DOC]`** — `05` §Minimum deposit carries the formulas, grid and
exchange pro-rata rule. Two additions: the grid's `Fulfillment Method` labels are **Take-With | Pickup |
Delivery | Direct-Ship** (the `02` §2 domain relabelled); and **called from the COD Worksheet**, quantities in
the worksheet's **Deliver** column for the displayed fulfillment are excluded from both grid and calculation —
only quantities that would be **back-ordered**, given how the worksheet was set when the extra action was
invoked, are included. `[DECIDE]` This screen's output therefore depends on **unsaved** worksheet state.

### 8.3 Enter a Customer Payment/Refund/Gift Certificate (50)

`[DOC]` Reached from seven menu paths across Point of Sale, Customer Service and Accounting > Receivables, and
from *Maintain Order Credits* (landing on Process Receivables to refund a credit or debit card).

```
HEADER (every tab; must be complete before any tab opens; LOCKS once the customer is set)
   Date · Location · Customer Code · Billing / Home / Work (display)

TABS: Order Deposits │ Process Receivables │ Gift Cards and Certificates │ FR In-Store Payments

RULE: editing ONE tab INACTIVATES the other three. Clear or Exit is the only way to start over.
```

This is `05` rule 7 stated precisely: **a session is one tab.** Model it as a single-purpose session whose
kind is fixed on first edit.

**Header `[DOC]`:** Date defaults to today and must fall **between today and the first day of the current
accounting period** — no future dates; backdating inside that window needs **Backdate Payments** or a security
override. Location defaults from the login and is **inactive when `Balance By` (Cash Balancing Control) =
`Drawer`**; Regional Processing may narrow the list. Customer Code is mandatory: numeric = customer code
(invalid ⇒ error), alpha opens the Customer Name Information Window, Search opens *Search for a Customer*, the
Action button creates a customer on the fly, and `Always Search for Customer` forces the search first.

**Order Deposits `[DOC]`** — **one deposit per session.** Order is mandatory and must reference an existing
sales order (Search → *View a Customer's Open Orders*; double-click opens the summary). Display: Order Type
(`regular sale` | `exchange`), Order Date, **Order Total** (before deposits/payments/adjustments, including
merchandise, tax, delivery, installation), Previous Deposits, **Amount Financed** (inactive without the
Finance Receivables module), Previous Balance Due (= total − previous deposits − financing), Payment Amount,
New Balance Due. Actions: Enter Payments, Change Customer Address, **Assign Payment Terminal** (48).

**Process Receivables `[DOC]`:**

- **Auto Pay** — applies payment to open-item balance, installment payments due, or revolving balance due;
  **enabling it deactivates the other payment options**. When any of those are due and the operator lacks
  `Apply payments without Autopay`, **Auto Pay is the only option**. Application sequence:
  `oldest → newest due date`, then `oldest → newest transaction date`, then `lowest → highest APR`.
- **Payment on Account** — posts without an invoice; **blocks the Completed Order Number field**. Negative
  on-account postings allowed **only if on-account monies already exist**.
- **Reference** — a completed order (payment) or an on-account/credit item (refund); Search → *View a
  Customer's Current Balance Details*. Debit balance → summary; **credit balance → an Issue Refund By type
  must be chosen.**
- **Current Balance** — with Payment on Account checked, the **entire account balance excluding deposit
  liability**; unchecked, the balance or credit on the referenced order.
- **Issue Refund By**, active only on a credit item, each option with its own permission:

```
CHECK  creates an AP bill for a refund check. Amount defaults to the open credit,
       editable, never above it. To take a check OUT of the drawer and hand it back
       to the customer, use OTHER — not CHECK.
GIFT   refund onto a gift card/certificate. INACTIVE unless `Refund Gift Balance`
       (AR Control). Same cap. Activates Gift Type and Gift Number.
OTHER  another form, e.g. cash → opens the Payment Summary. A check payment type may
       be chosen here only when NOT issuing an AP check.
```

**Gift Cards and Certificates `[DOC]`** — the tab is inactive without `Purchase Gift` (AR Control). Three
mutually exclusive actions, each with its own setting: **Purchase Gift**; **Add Funds** (`Add Funds to
Existing`; also covers gift-registry contributions); **Refund Gift Balance** (`Refund Gift Balance` **and**
the permission *Enter a Payment/Refund/Gift Certificate - Refund Gift Balance*; any amount up to the remaining
balance). After a Gift Certificate Type is chosen for a purchase, screen 77 appears unless numbers
auto-assign, then the summary. The Gift Certificate # dropdown carries the special value **`GR Contribute to
gift registry`**, which opens **Gift Registry Name Lookup** (search on all or part of the registry
owner/customer or alternate name) first. **With Refund Check selected the Payment Summary does not display at
all.** Refund Amount is enterable only when **both** Refund Gift Balance and Refund Check are selected; else
it mirrors the summary read-only. **Only purchased certificates are accepted — customer-rewards cards are
not.** **Builder-allowance and in-store-use-only certificates cannot be purchased, receive added funds, or be
refunded**, and are excluded from the dropdown; they come only from *Builder Allowance Gift Certificate
Import*.

**FR In-Store Payments `[DOC]`** — Finance Provider (defaults and locks when only one active provider exists);
Finance Account Number (defaults from Customer Settings under `Default Account`, or created on the fly under
`Account Numbers On-the-Fly`; a valid number opens the summary); Payment Type (display; cash, checks and
cards — **cards require `Allow Credit Cards for In-Store Payments`**); Payment Amount (display; **negatives
accepted for corrections**, transmitted as reversals only by providers permitting `Payment Reversal`).
Prerequisites, all required: `Enter FR Payments` on the user record; FR module active; the provider has a
payment type in the In-Store Payments section of Finance Provider Settings; STORIS online or offline
processing in use; a contract with the provider to accept (and if online, transmit) payments; **and this tab
edited first**. Corrections are entered as ordinary payments — to fix $500.00 keyed for a $50.00 cash
payment, re-access the customer and enter `-500.00` and `50.00`. Negatives not matching an existing FR
Authorization record are rejected unless `Allow Negative FR Payments for Different Day's Activity` is set
(`05` rule 8).

**Cross-tab `[DOC]`:** line items on orders with deposits or financing applied are inactive without
`Delete/Edit line items on transactions with deposits applied`. Payments **cannot** reach installment or RTO
plans from Order Deposits, Process Receivables or Gift Cards — only FR In-Store Payments, where settlement
happens as the payment is applied. Overpayments may be applied to charged-off balances if settings allow.
Pre-authorized deposits are neither displayed nor maintainable here; for deposit manipulation STORIS directs
the operator to *Maintain Customer Deposits*. Convenience fees require settings for **both** the state and
the store location, apply **only with Gateway processing**, and when Auto Pay is selected or a Reference
specified the **summary appears first, then Credit Card Entry**.

**Receipts `[DOC]`:** printing is governed by `POS Payment, Refund, Gift Certificate Receipt`. `Use Extended
Payment Receipt` selects the **Cash Application** form over the **Sales Order** form (Order Deposits) or the
**Payment Receipt** form (Process Receivables). **A deposit against an existing order prints the sales order,
not a receipt**, with the new deposit folded into total deposits. Multiple payment types against one gift
certificate print a single receipt listing all of them. Right-click escapes (Dynamic Escape Settings): Order
Deposits → *Deposit Inquiry*; Gift Cards → *View a Gift Certificate*.

---

## 9. Consolidated

### 9.1 New business rules not in `05`

1. Payment Amount on the summary is enterable for **cash only** when Signature Capture is off; a
   blank-method + Swipe Card path unlocks it when it is on. `[DOC]`
2. `Customer Daily Cash Limit` and `Payment Class Access` are evaluated on the summary the moment an amount
   is entered — before any sub-window. `[DOC]`
3. Deposit Maintenance is reachable **only while Payment Method is blank**, so an available customer credit
   cannot be applied after a tender is selected. `[DOC]`
4. Card entry is **four screens**, selected by processor configuration and by read vs write (§5.1). `[DOC]`
5. The Credit Card Security Screen re-keys the last four **on swipe only**, gated by `Extended Security`. `[DOC]`
6. Debit requires Signature Capture to exist at all, cannot be keyed (19-char, swipe-only), and selecting an
   existing debit row locks the Swipe button. `[DOC]`
7. Terminal assignment is **session state that survives orders and dies at logoff**, filtered by logon
   location. `[DOC]`
8. Releasing a pre-authorized deposit converts the pre-auth into a sale and creates a **second sale
   transaction** for any upward modification; a decline deletes the record, a comms error leaves it. `[DOC]`
9. Third-party financing with no authorization number sets credit hold code **`F3`** — distinct from the `F5`
   licence-verification hold in `05`. `[DOC]`
10. The revolving plan's minimum deposit percentage **overwrites** the order's `Deposit Hold Back` when
    greater — a financing choice mutating an order-level field. `[DOC]`

Also new: auto-pay's three-key allocation order (due date, transaction date, APR); the payment-date window
(today back to the first day of the current accounting period, with a Backdate permission); insurance
affecting MMP for Fixed Term plans only; gift bar codes restricted to `3OF9`/`CODE128` with a prefix match;
builder-allowance redemption bypassing contractor credit checks; ECA transaction class decided by whether a
reader was used.

### 9.2 Enums introduced

```
CREDIT_APPLICATION_TYPE    REVOLVING | FINANCING
CHECK_TYPE                 PERSONAL | COMPANY
ECA_TRANSACTION_TYPE       EG (Electronic Guarantee) | EC (Electronic Conversion)
CARD_PROCESSING_SETUP      GATEWAY_CREDIT_CARD | EMV_SHIFT4 | EMV_TENDER_RETAIL | NONE
CARD_REFUND_MODE           TWO_CLICK (tied to a prior sale) | INDEPENDENT
                           | DOUBLE_CLICK (exchange/return with refund due)
CREDIT_HOLD_CODE           F3 = no authorization number on third-party financing  [PARTIAL; F5 in 05]
FINANCE_INSURANCE          NONE | SINGLE | JOINT               (reporting only)
MMP_CALCULATION_TYPE       AS_A_FIXED_TERM | AS_A_FIXED_AMOUNT | PER_SALES_ORDER
                           | PER_SALES_ORDER_USING_A_FIXED_TERM | FIXED_MMP_TABLE
                           | PERCENTAGE_OF_BALANCE
REVOLVING_TERM_MONTHS      2 | 3 | 6 | 12 | 18 | 24 | 36 | 48 | 60
DUE_DAY                    1..28
PAYMENTS_PER_MONTH         1 | 2 | 4
PLAN_ACTIVATION            <date> | PENDING
APPLY_INSURANCE_BY         CUSTOMER | PLAN
ISSUE_REFUND_BY            CHECK | GIFT | OTHER
GIFT_TAB_ACTION            PURCHASE_GIFT | ADD_FUNDS | REFUND_GIFT_BALANCE
GIFT_CERT_SPECIAL_VALUE    "GR Contribute to gift registry"
GIFT_BARCODE_SYMBOLOGY     3OF9 | CODE128
TERMINAL_SIGNATURE_CAPTURE YES | NO
PAYMENT_APPLICATION        ON_ACCOUNT | ADD_PAY_TO_REVOLVING    [PARTIAL]
CASH_BALANCING_BALANCE_BY  DRAWER | ...                         [PARTIAL — only DRAWER named here]
```

### 9.3 Settings referenced

- **AR Control:** `Deposit Overpayment Allowed`, `Daily Maximum Cash Refund Per Customer`, `Include Estimated
  Tax`, `Validate Manual Entry`, `Card Number Prefix`, `Next Number`, `Require Swipe for Purchase`,
  `Purchase Gift`, `Add Funds to Existing`, `Refund Gift Balance`, `Use Extended Payment Receipt`.
- **Cards:** Payment Card and Device (`Validate Manual Entry`, `Token Sharing Active`, `Allow Pre-Authorized
  Deposits`, EMV `Amount Increase Limit`); Credit Card Validation (`Prompt for CID`, `Extended Security`);
  Credit Card Payment Settings / Payment Type (Credit Card) Mandatory flags; EMV Terminal Settings; Shift4
  UTG; Signature Capture. **Checks:** Payment Type (Check) / Check Payment Settings `Drivers License Prompt`.
- **Financing:** Financing Control (`Allow Deposits on Stock Mdse`, `Allow Credit Cards for In-Store
  Payments`); Financing Payment Plan (`Prompt for Insurance`, `Maximum Deposit Percent`); Finance Provider
  (`Allow for a Finance Plan to be Applied to an Order Prior To Account Number Assignment`, `Finance Comments
  Required`, `Customer Daily Cash Limit`, `Payment Class Access`, `Default Account`, `Account Numbers
  On-the-Fly`, `Payment Reversal`, In-Store Payments section); Credit Application Control (`Require Credit
  Application`).
- **Revolving:** Revolving Receivables Control (`Access Worksheet within Sales Order Entry`, `Insurance
  Required`, `Prompt for Insurance if Not Added to Revolving Worksheet`, `Apply Insurance by Plan Setting`,
  `Exempt from Insurance Charges`, prime rate); Revolving Receivables Payment Plans; Payment Agreement Source
  Settings; `Single Prompt for Insurance Change`.
- **Other:** POS Control (`Validate Original Payment on Refunds`, `Always Search for Customer`, `POS Payment,
  Refund, Gift Certificate Receipt`); Cash Balancing Control `Balance By`; Cash Drawer Settings; Sales Tax
  Settings (State Maximum %, State/Province classification); Configure Document Signature Capture
  (`Signature Required`); Configure Document Archive; Dynamic Escape Settings; Convenience Fee settings
  (state + location); Regional Processing; transaction retention days.

### 9.4 Permissions referenced

**Receivables Security:** `Receive a Default for the Payment Amount`; `Override Daily Maximum Cash Refund Per
Customer`; per-payment-type access (extended settings); `Override Pre-Authorized Deposit Amount Increase
Limit`; `Type in Gift Certificate/Card number during payment entry`; `Apply payments without Autopay`;
`Backdate Payments`; `Enter a Payment/Refund/Gift Certificate -` `Issue Deposit Refund` / `Issue Refund by
Check` / `Issue Refund by Gift` / `Issue Refund by Other` / `Refund Gift Balance`.
**User File / Sales Security:** `View Encrypted Finance, Credit Card, Check Account Numbers`; `View Masked
Account Numbers`; `Enter FR Payments`; `Allow Negative FR Payments for Different Day's Activity`.
**Extended Security:** `Delete/Edit line items on transactions with deposits applied`.
**User/User Group:** `Change or remove insurance on a customer's revolving plan`; an **unnamed** setting
permitting MMP reduction.

### 9.5 Open questions and content defects

| # | Issue | Tag |
|---|---|---|
| 1 | Window 33's Swipe Card inactive until an Authorization Number is entered — inverted for a normal sale | `[DECIDE]` |
| 2 | Card Present defaults CHECKED in 33, blank in 36, and drives a real pin-pad signature prompt | `[DECIDE]` |
| 3 | Unmask needs a **second** authorized user per `05` but "your STORIS code and password" per article 35 | `[DECIDE]` |
| 4 | Article 46 documents Check Type **twice**, verbatim — migration artifact | `[DOC]` defect |
| 5 | Article 70 duplicates its whole body; copies disagree on the account-number label, drop Lease ID/RTO | `[DOC]` defect |
| 6 | Screen 158 titled "Read Only" yet documents a Save with an MMP-reduction prompt | `[DOC]` defect |
| 7 | Full worksheet TOTAL = Current + This Order + Other, excluding Pending — verify against live data | `[DECIDE]` |
| 8 | The MMP-reduction permission is never named | `[DECIDE]` |
| 9 | "Credit Card Payment Settings" vs "Payment Type (Credit Card) System Settings" — one record, two names? | `[DECIDE]` |
| 10 | Amount Tendered / Change Due persistence and negative-change behaviour undocumented | `[DECIDE]` |
| 11 | Credit Card Security Screen failure handling (retries, lockout) undocumented | `[DECIDE]` |
| 12 | Open Cash Drawer has no permission and no audit trail | `[DECIDE]` |
| 13 | POS-scanner gift entry bypasses the manual-entry permission | `[DECIDE]` |
| 14 | Automatic Payment Results defaults "Proceed with Update" to checked | `[DECIDE]` |
| 15 | Screens 76 and 77 are the same one-field window with different callers | `[DECIDE]` |
| 16 | Required Deposits by Line, called from the COD Worksheet, depends on **unsaved** worksheet state | `[DECIDE]` |
| 17 | Accord D's manual-method-then-swipe exception — confirm it is in scope | `[DECIDE]` |
| 18 | Full vs Short worksheet is a system-wide setting, so credit visibility cannot vary by role | `[DECIDE]` |
