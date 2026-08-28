# Run 03 — Sales Processing — Batch 4: Payments, Tender Types and Card Processing

**Status: complete.** 11 articles. Findings 34–44.

**This batch produces the audit's first fully specified GL postings from a non-Accounting section.**
See Finding 38.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Payment Summary Window** | /articles/15201405472916 | EXTRACTED — very rich |
| 2 | Credit Card Entry Window | /articles/15201404701844 | EXTRACTED |
| 3 | Credit Card (EMV) Entry Window | /articles/15201404703636 | EXTRACTED |
| 4 | Credit Card (External) Entry Window | /articles/15201404708628 | EXTRACTED |
| 5 | Credit Card Security Screen | /articles/15201404701588 | EXTRACTED |
| 6 | **Resolve Abandoned External Card Transactions** *(Credit Card Processing)* | /articles/15201512185620 | EXTRACTED — **named GL postings** |
| 7 | Authorization Display Screen *(CCP)* | /articles/15201527828244 | EXTRACTED |
| 8 | Review Customer Credit Card Transactions *(CCP)* | /articles/15201527826708 | EXTRACTED — thin |
| 9 | **Pre-Authorized Deposit** | /articles/15201390176660 | EXTRACTED |
| 10 | Check Entry Window | /articles/15201389092244 | EXTRACTED |
| 11 | Amount Tendered Window | /articles/15201388923284 | EXTRACTED — thin |
| — | Debit Card Payment Entry Window | /articles/15201404901460 | **404 — ID re-derivation needed** |

Discovered and queued: `Accounts Receivable Control Settings` · `Credit Card Payment Settings` ·
`Credit Card Validation Settings` · `Payment Card and Device Settings` · `Financing Payment Plan
Settings` · `Credit Application Control Settings` · `Maintain Customer Deposits` ·
`Enter a Customer Payment` · `Process Web Payments` · `Report External Credit Card Transactions` ·
**`Payment Type record`** · **`BANK record`** · `View All Revolving Plan Activity for a Customer` ·
`Receivables Security`.

---

## B. Wiring findings

### FINDING 34 — Seven payment types, each with its own entry window, and payment-type-level security
Types (verbatim, complete): "**Cash · Check · Credit Card · Debit Card · Gift Certificate · Financing
            Payment Plan · Revolving Receivables Payment Plans**"
Invariant:  "**If you specify a payment type of Cash, use the `Amount` field on this screen… For all
            other payment types, a separate window appears for each payment type.**"
Invariant:  "**Important! Depending on your extended security settings for the `Create a User/Group
            Actions - Receivables Security`, access to specific payment types may be restricted.**
            Following entry of the pay method, the warning message '**You do not have access to this
            payment type**' displays if the user is restricted."
Multi-tender: "**You can apply multiple payment types to a single transaction.**"
Take-With rule (repeated on three windows): partial payments are allowed "**provided the transaction
            type is not Take-With, for which you must enter the full amount due.**"
Evidence:   Payment Summary Window, /articles/15201405472916; Credit Card Entry Window,
            /articles/15201404701844; Check Entry Window, /articles/15201389092244
Maps to:    **NEW**

> Run 1 found six AP payment method codes (`CHK` `MAN` `CCD` `DCD` `OLB` `CSH`). **These are the seven
> customer-side types**, and they do not map one-to-one — the sales side adds gift certificates and
> two distinct financing families and has no on-line-banking equivalent.
>
> Two behaviours worth carrying. **Payment type is a permissioned object** — a user can be barred from
> taking a specific tender, which is an unusual and quite fine-grained control. And **Take-With forces
> payment in full**: the customer walking out with the goods cannot leave a balance, which is the
> single clearest business rule in the payment machinery.

### FINDING 35 — Three mutually exclusive card-processing integrations, selected per location
| Integration | Window | Behaviour |
|---|---|---|
| **Gateway Credit Card** | `Credit Card Entry Window` | STORIS captures the full card number, type, CVV, expiry |
| **EMV-Shift4** | `Credit Card (EMV) Entry Window` | "**used when processing manually entered credit/debit card payment transactions with Shift-4**"; also "two-click" tokenized refunds |
| **EMV-Tender Retail** | `Credit Card (External) Entry Window` | "**STORIS causes the payment terminal to prompt entry of the card holder sensitive data (credit card number, CVV, etc.), which is then communicated directly to the MCM server.** The MCM server forwards that information to the merchant's Merchant Services Provider. **STORIS prompts only for the amount and authorization number.**" |
Cross-reference (verbatim, both directions): "If processing with Tender Retail, the Credit Card
            (External) Entry Window displays instead." / "If processing with Shift4, the Credit Card
            (EMV) Entry Window displays instead."
Location-bound: pre-authorization appears **in inquiry mode** when "the credit card processing setup
            (**Gateway Credit Card, EMV Shift4, EMV Tender Retail, or none**) of the user's current
            login location **does not match** the credit card processing setup of the location the
            pre-authorization was obtained."
Evidence:   Credit Card (EMV) Entry Window, /articles/15201404703636; Credit Card (External) Entry
            Window, /articles/15201404708628; Pre-Authorized Deposit, /articles/15201390176660
Maps to:    **NEW — and it is a compliance-relevant architectural split**

> **Card data handling differs fundamentally between the three.** Under Tender Retail the sensitive
> data never enters STORIS — the terminal talks to the MCM server directly and STORIS only ever sees an
> amount and an authorisation number. Under the gateway path, STORIS captures and stores the card
> number itself, which is what run 1's "retrievable full PAN" compliance flag was about.
>
> **The integration is a property of the location, not the company**, and a payment taken at one
> location can become read-only at another. For a multi-store operation mid-migration that is a real
> operational constraint: a deposit taken at a Shift4 store cannot be released at a gateway store.

### FINDING 36 — Swiping a card requires re-keying the last four digits; manual entry does not
Invariant:  "This security screen appears **when swiping credit cards** in order entry, **requiring
            users to manually enter the last four digits on the credit card** before completing a
            transaction."
Invariant:  "**NOTE: This screen appears only if the `Extended Security` field is enabled in the `Credit
            Card Validation Settings`.** … **When manually entering card numbers (that is, not
            swiping), the system does not require the last four digits.**"
Evidence:   Credit Card Security Screen, /articles/15201404701588
Maps to:    **NEW — and the asymmetry is the finding**

> The control is anti-fraud: prove the physical card is in your hand by reading its face. But the
> asymmetry inverts the risk. **A swiped card — where the card is demonstrably present — is challenged;
> a hand-keyed card, where it is not, is waved through.** Whatever the original reasoning (probably
> that swiping can be done from stored track data), the effect is that the weaker channel has the
> weaker check. Worth raising with the operator rather than reproducing.

### FINDING 37 — Pre-authorised deposits convert to sales on release, with no card and no customer present
Invariant:  "**Once a pre-authorization is released, the original pre-authorization request is converted
            into a sale transaction. If applicable, a second sale transaction is created to cover the
            difference between the `Modified Pre-Auth Amount` and the original pre-authorized amount.
            A card swipe or manual card entry is not required; the customer does not need to be
            present.**"
Void:       "A pre-authorization can be **deleted (voided)** by clicking the `Delete` button… A void
            message is sent to Shift4 and the pre-authorized deposit is removed from STORIS."
Three conditions to obtain a new one: `Allow Pre-Authorized Deposits` in **`Payment Card and Device
            Settings`** · **user logged into a Shift4 processing location** · **order balance > 0**.
Web path:   "**If a pre-authorized deposit exists for the order via the web**, this option is available
            **if the pre-authorization was approved**; if declined… the pre-authorized deposit must be
            managed via `Process Web Payments`."
Evidence:   Pre-Authorized Deposit, /articles/15201390176660
Maps to:    **NEW**

> **A held authorisation can be turned into a charge — and increased — with the customer absent.** The
> second sale transaction covering the uplift is the part to note: the modified amount is not capped at
> the original authorisation, so release can charge more than was authorised, as two transactions.
> That is normal deposit practice in furniture retail, but it is a capability that needs an explicit
> control decision in a rebuild, and the only stated gate is being at a Shift4 location.
>
> This is also the mechanism behind batch 1's "Pending Deposit" message for eSTORIS orders under
> Auth/Capture.

### FINDING 38 — **Named GL postings.** Abandoned card transactions post to accounts with a two-level fall-through
Invariant (verbatim, complete):
            "**Post a debit (or credit, depending on the external transaction type) to the customer's
            Open Item Receivables balance.** · update the **Customer Comments file**. · **Update the
            General Ledger:**
            **Debit transactions** — Debit: **Credit Card GLA defined in the `Payment Type` record. If
              missing use the Credit Card GLA defined in the `BANK` record.** Credit: **Accounts
              Receivable GLA defined in the `General Ledger Assigned Account Settings`.**
            **Credit transactions** — Debit: **Accounts Receivable GLA defined in the `General Ledger
              Assigned Account Settings`.** Credit: **Credit Card GLA defined in the `Payment Type`
              record. If missing use the Credit Card GLA defined in the `BANK` record.**"
Resolution order (verbatim): "If the transaction type is a **purchase** and the card is **not a debit
            card**, the system **voids** the transaction. If the void attempt is not successful, the
            system attempts a **refund**… **Note that refunds are distinct from irefunds, and you cannot
            make irefunds using this process.** If the refund attempt is not successful, the system
            **makes the appropriate financial updates**. If the card… is a **debit card**, the system
            makes the appropriate financial updates *(immediately)*. If the transaction type is a
            **refund or an irefund**, the system makes the appropriate financial updates."
Failure:    "**If that adjustment fails, a note appears on the `Report External Credit Card
            Transactions` and resolution requires human intervention.**"
Cash balancing: "**Tender Retail - Cash drawer is retrieved via the pin pad ID of the original
            transaction.**"
Evidence:   Resolve Abandoned External Card Transactions, /articles/15201512185620
Maps to:    **W-052 / W-053 — CONFIRMED. First named GL accounts outside Accounting in the entire audit.**

> Run 2 closed with "Merchandising is almost entirely silent about what it posts." **This is the
> opposite**: a complete double-entry specification, both directions, with the account resolved through
> a **two-level fall-through — `Payment Type` record, else `BANK` record** — and the AR side coming
> from run 1's `General Ledger Assigned Account Settings`, the ~120-slot posting table.
>
> Three further points. **The customer's Open Item Receivables balance is updated alongside the GL**,
> confirming run 1's finding that the two AR ledgers and the GL move together. **A fourth-level
> fallback exists after void and refund both fail** — direct financial adjustment — and if *that*
> fails it becomes a line on a report requiring a human, which is the audit's fifth exception queue.
> And `irefund` appears for the first time, explicitly distinguished from `refund` and explicitly
> unsupported by this process. Undefined anywhere read so far.

### FINDING 39 — Overpayments and cash refunds are both capped by Receivables settings
Overpayment: "**Overpayments (i.e. payments exceeding the balance due) are permitted if the `Deposit
            Overpayment Allowed` setting in `Accounts Receivable Control Settings` is checked.**"
Cash refund cap (verbatim): "if a **`Daily Maximum Cash Refund Per Customer`** amount exists in
            `Accounts Receivable Control Settings`, the user is restricted to refunding that cash
            amount, unless provided the ability to override via the **`Override Daily Maximum Cash
            Refund Per Customer`** setting in `Create a User/Group Actions - Receivables Security`. **If
            the user does not have permission… this Payment Summary process cannot be saved and the
            user must reduce the amount to be refunded.**"
Evidence:   Payment Summary Window, /articles/15201405472916
Maps to:    **NEW — and both are anti-fraud controls**

> A **per-customer, per-day cash refund ceiling** with a named override permission is a structuring
> control — it stops a single customer being refunded cash repeatedly. It lives in Receivables settings
> but bites in Sales Processing, and the failure mode is a **hard block on save**, not a warning.
> Overpayment permission is its mirror: taking more money than owed is off by default.

### FINDING 40 — Deposits become uneditable the moment you leave the order
Invariant:  "**After you apply initial deposits to a sales order and exit the sales order, you cannot
            edit the deposits.** However, you can **add** new deposits via the `Enter a Customer
            Payment/Refund/Gift Certificate` routine or via `Enter a Customer Payment`."
Authorisation integrity (verbatim): "During the initial entry of payments to an order, **if you enter
            one or more payments that require authorization** (for example, a credit card payment),
            **once a payment is authorized the system requires you save the order to maintain integrity
            in the settlement process. To delete the order** (for example, if another payment type was
            declined), **you must save and re-access the order.**"
Available credit: a message shows the customer's available credit "**in any process where a deposit
            payment can be made**"; applying it uses **`Deposit Maintenance`** from the Actions button
            "**but to do so you must leave the `Payment Method` field blank.**"
Evidence:   Payment Summary Window, /articles/15201405472916
Maps to:    **NEW**

> **An authorised payment locks the order into being saved.** You cannot abandon an order once a card
> has been authorised — you must save it, then reopen it to delete it. That is a settlement-integrity
> rule showing through the UI, and it means "cancel" is not available at the one moment a salesperson
> most wants it (a second card declining after the first approved).
>
> And deposits are **append-only after the first exit**. Corrections go through a Receivables routine,
> not order entry — so the audit trail for deposit changes lives in a different module from the order.

### FINDING 41 — Refunding to the original card depends on five conditions, all outside the salesperson's control
Invariant:  "the `Payment Summary` screen displays payments from the original invoice **only when the
            `Validate Original Payment on Refunds` field is enabled** on the Customer page in Point of
            Sale Control Settings **or when using EMV credit card processing.**"
Non-display conditions (verbatim, complete): "**System does not have any EMV modules licensed and
            active · User is logged into a location that is not set up for EMV processing · User is
            logged into a location that is set up for EMV processing, but is not logged in with a cash
            drawer that contains a `Pin Pad Identifier` · The credit or debit card on the original order
            was not processed as an EMV transaction · The original card data records are no longer
            available on file.**"
Evidence:   Payment Summary Window, /articles/15201405472916
Maps to:    **NEW**

> Whether a refund can go back to the card the customer paid with depends on **module licensing, the
> store's configuration, which cash drawer the operator signed into, how the original transaction was
> processed, and whether the card records still exist.** Any one of five failures and the refund has to
> be issued another way.
>
> **"The original card data records are no longer available on file"** is the important one — it
> implies a retention policy on card data that nothing documents, and it means refundability **decays
> over time**. That is a customer-facing consequence of a data-retention setting, exactly like run 2's
> costing table purge.

### FINDING 42 — Financing payment types are gated on a credit application, and route to three different worksheets
Invariant:  "**If the `Require Credit Application` field in `Credit Application Control Settings` is
            checked, the system determines if a valid credit application exists for the customer. If
            not, a warning is issued and you are prevented from entering the financing payment type**
            until a credit application is entered."
Invariant:  "Once you select the payment type, you access the **`Finance Receivable Entry Screen`,
            `Revolving Worksheet (Short)`, or `Revolving Worksheet (Full)`, depending on the type of
            financing (3rd party finance or revolving) and your control settings.**"
MMP validation (verbatim): "**If the payment is less than the sum of the standard MMP of the plans, a
            validation error occurs**… The payment needs to be **the exact amount or more than the sum
            of Standard MMP** found on the `View All Revolving Plan Activity for a Customer` screen." ·
            "**If the Total Due is less than the sum of the Standard Minimum Monthly Payments (MMP),
            the Total Due is validated… and collected from the customer.**"
Evidence:   Payment Summary Window, /articles/15201405472916
Maps to:    **W-050 / run 1's revolving receivables findings — connected**

> Run 1 mapped the two consumer-credit subsystems (closed-end installment, open-end revolving) and the
> `MMP` tables. **This is where they meet the sales floor**: choosing a financing payment type routes to
> a different worksheet depending on which subsystem, and **the payment collected is validated against
> the sum of standard minimum monthly payments across the customer's plans.** So an existing revolving
> balance changes what must be collected on a new sale — a genuine cross-order coupling.
>
> Batch 1 already found this path can set credit holds `F5` and `C6`. Together: **selecting a payment
> type can validate identity, check a credit line, place the order on hold, and impose a minimum
> collection amount.** It is the most consequential field on the payment page.

### FINDING 43 — A declined authorisation is a screen, not an error, and carries the bank's own response
Fields (verbatim): `Card Type` · `Card Number` · `Expiration Date` · `Payment Amount` ·
            **`Bank Response`** · **`Response Action`**
Invariant:  "This screen appears **only if your credit card authorization service declines** your
            request… You can **attempt to re-enter the credit card payment or use another payment
            type**."
Evidence:   Authorization Display Screen, /articles/15201527828244
Maps to:    **NEW**

> **`Bank Response` and `Response Action` are surfaced verbatim to the salesperson** — the processor's
> own decline reason and its recommended action (call, retry, take another form). That is more
> transparency than most systems give the floor, and it is worth preserving: the difference between
> "insufficient funds" and "call issuer" changes what the salesperson should say next.

### FINDING 44 — Cash tender, check and change are the simplest path, and checks capture a driver's licence
Amount Tendered (verbatim): "**amount of cash applied** to the current transaction, **total amount of
            payments** applied to the transaction, and **amount of change due (if any)**" — appears "at
            the end of the payment phase of **all transactions in which cash was offered**".
Check fields: `Type` · `Amount` · **`Check Number`** · **`Driver's License Number`**
Evidence:   Amount Tendered Window, /articles/15201388923284;
            Check Entry Window, /articles/15201389092244
Maps to:    **NEW — and a privacy note**

> **Checks capture a driver's licence number** as standard practice. Combined with batch 1's
> `Driver License Verification` on revolving financing (which sets credit hold `F5` on mismatch), STORIS
> stores driver's licence numbers from two independent paths. Run 1 flagged retrievable full PAN, an
> unencrypted bank account number in the check export file, SSN as a search key, and stored customer IP
> as compliance items; **driver's licence numbers on check payments belong on that list**, and it is
> worth checking what retention applies.

---

## C. Screen and field inventory

**Payment Summary Window** — `Payment Method` · **`Swipe Card`** · `Payment Amount` · `Total Paid` ·
`Balance` · **`Payment Terminal`** · **`Minimum Deposit`** · grid · Actions
*(Deposit Maintenance · Finance Credit Application · Pre-Authorized Deposit)*.

**Credit Card Entry Window** — Credit Card Number · Type · **`Verify Card Number`** ·
**`Card Present`** · Month · Year · **`CVV Number`** · Amount · Swipe Card ·
`Authorization Number` *(expiry and auth appear only if `Mandatory` in Credit Card Payment Settings)*.

**Credit Card (EMV) Entry Window** — `Payment Terminal` · Card Number · Type · Card Present · Amount ·
Swipe Card · Authorization Number. *(Shift4)*

**Credit Card (External) Entry Window** — `Payment Terminal` · Card Number · Type · Amount ·
Swipe Card · Authorization Number. *(Tender Retail; sensitive data goes terminal → MCM server →
Merchant Services Provider, never through STORIS)*

**Credit Card Security Screen** — `Enter Last Four Digits`. Swipe only.

**Authorization Display Screen** — Card Type · Card Number · Expiration Date · Payment Amount ·
**Bank Response** · **Response Action**.

**Pre-Authorized Deposit** — Card # · Auth # · Type · **`Original Pre-Auth Amount`** ·
**`Order Balance`** · **`Modified Pre-Auth Amount`** · Amount · `Pmt Terminal` ·
**`Release Pre-Authorized Deposits`** · Delete *(void)*; or Amount · Card Present · Swipe Card when
none exists.

**Check Entry Window** — Type · Amount · `Check Number` · **`Driver's License Number`**.

**Amount Tendered Window** — `Amount Tendered` · `Amount Paid` · **`Change Due`**.

**Resolve Abandoned External Card Transactions** — `Start Time` · **`Number of Days Prior`** ·
`Log Off When Finished`. Runs manually or scheduled; **resolves all locations regardless of where run**.

**Review Customer Credit Card Transactions** — `Customer Code` · grid. Feeds
`Reprint an External Credit Card Receipt`.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `Deposit Overpayment Allowed` | **Accounts Receivable Control Settings** | Whether payments may exceed the balance due |
| **`Daily Maximum Cash Refund Per Customer`** | Accounts Receivable Control Settings | Hard cap on cash refunds; blocks save |
| `Require Credit Application` | **Credit Application Control Settings** | Blocks financing payment types without an application |
| `Validate Original Payment on Refunds` | POS Control Settings → Customer | Shows original-invoice payments for refund selection |
| `Extended Security` | **Credit Card Validation Settings** | Last-four re-key on swipe |
| `Mandatory` (expiry, authorization number) | **Credit Card Payment Settings** | Whether those fields appear at all |
| `Allow Pre-Authorized Deposits` | **Payment Card and Device Settings** | Pre-auth capability *(Shift4 locations only)* |
| `Allow deposits on order` | POS Control Settings | Deposits while a fulfillment is manifested *(batch 1)* |
| credit card processing setup | **per location** | Gateway / EMV-Shift4 / EMV-Tender Retail / none |
| `Pin Pad Identifier` | cash drawer | Required for EMV refund display |
| **Credit Card GLA** | **`Payment Type` record, else `BANK` record** | The GL account cards post to |
| **Accounts Receivable GLA** | `General Ledger Assigned Account Settings` | The AR side of card postings |
| Auto-Pay / Global Auto-Pay | Enter a Customer Payment / …Refund/Gift Certificate | Triggers MMP validation on save |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **payment-type access** | **Receivables Security** *(extended)* | Applying payments of a specific type — "You do not have access to this payment type" |
| **`Override Daily Maximum Cash Refund Per Customer`** | Receivables Security | Exceeding the daily cash refund cap |

---

## F. State machines and enumerations

**Customer payment types (7)** — Cash · Check · Credit Card · Debit Card · Gift Certificate ·
Financing Payment Plan · Revolving Receivables Payment Plans.
**Card processing integrations (4 states)** — Gateway Credit Card · EMV-Shift4 · EMV-Tender Retail ·
**none** — a property of the **location**.
**Card transaction types** — purchase · void · refund · **`irefund`** *(distinguished from refund;
undefined)*.
**Abandoned-transaction resolution order** — void → refund → financial update → **report line requiring
human intervention**; debit cards and refunds/irefunds go straight to financial update.
**Financing worksheets** — `Finance Receivable Entry Screen` *(3rd party)* ·
`Revolving Worksheet (Short)` · `Revolving Worksheet (Full)`.
**Take-With rule** — full payment required; no partial tender.
**Exception queues in the audit (5)** — cost exceptions · landed add-on distribution · special-order
price variance · trade discount exceptions · **external card transaction resolution failures**.

---

## G. Sequencing rules

1. Cash is entered inline; every other type opens its own window.
2. Take-With transactions must be paid in full.
3. Financing payment types require a valid credit application when `Require Credit Application` is on.
4. Applying a revolving payment code triggers driver-licence verification on first use; failure ⇒ `F5`.
5. Payment must be at least the sum of standard MMPs across the customer's plans, when Auto-Pay is on.
6. Once a payment is authorised, **the order must be saved** — deletion requires save-then-reopen.
7. Deposits are uneditable after leaving the order; further deposits go through Receivables routines.
8. Pre-auth release converts the authorisation to a sale, plus a second sale for any uplift.
9. Abandoned card transactions: void → refund → financial update → report.
10. A cash refund above the daily per-customer maximum blocks the save unless overridden.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Debit Card Payment Entry Window`** — the article ID in the section index returns 404. Needs
  re-derivation; debit is one of the seven payment types and the only one without a read window.
- `Accounts Receivable Control Settings` · `Credit Card Payment Settings` · `Credit Card Validation
  Settings` · `Payment Card and Device Settings` — four settings files governing tender behaviour.
- **`Payment Type` record** and **`BANK` record** — the two objects holding the Credit Card GLA. Run 1
  mapped `General Ledger Assigned Account Settings`; these are its payment-side companions.
- `Process Web Payments` · `Report External Credit Card Transactions` ·
  `View All Revolving Plan Activity for a Customer`.

**Documented but ambiguous**
- **`irefund`** — explicitly distinguished from a refund and explicitly unsupported by the abandoned-
  transaction process. Never defined.
- **How long card data records are retained** — refundability depends on them still existing, and no
  article states a policy.
- **`Minimum Deposit`** on the Payment Summary — a displayed value with no stated source. Run 2 found
  `Minimum Deposit Met`/`Not Met` as a PO hold-release criterion; presumably the same concept.
- **`Verify Card Number`** vs `Credit Card Number` — a re-key confirmation, or something else?
- **`Card Present`** — captured as a flag; nothing says what it changes.
- **Whether the pre-auth `Modified Pre-Auth Amount` is capped** at anything.
- **What "financial updates" means** for debit cards specifically — the article names GL postings for
  the general case but does not say whether debits differ.
- Whether `Deposit Maintenance` (blank Payment Method) is the only route to apply available credit.

**Inferences (not in section B)**
- `irefund` is plausibly an "instant refund" or interchange-optimised refund; the articles give only its
  name and that it is distinct.
- `Minimum Deposit` on the payment window is presumably the same value as run 2's PO release criterion;
  not stated.
- Card data retention is presumably a configurable purge like the costing table; inferred from the
  phrase "no longer available on file", not stated.

---

## I. Unknown unknowns

- **Payment type as a permissioned object** — a user can be barred from taking cash, or cards.
- **Take-With forcing payment in full.**
- **Three card integrations with fundamentally different data-handling**, selected per location.
- **A pre-authorisation taken at one location becoming read-only at another.**
- **Swiped cards challenged for the last four digits while hand-keyed cards are not.**
- **Pre-auth release charging more than authorised**, as a second sale transaction, customer absent.
- **A complete double-entry GL specification** with a `Payment Type` → `BANK` account fall-through.
- **A per-customer daily cash refund ceiling** that blocks the save.
- **An authorised payment locking the order into being saved** before it can be deleted.
- **Deposits becoming append-only on leaving the order.**
- **Refundability to the original card decaying** as card data records age out.
- **Payment validated against the sum of standard MMPs** across the customer's other revolving plans.
- **The bank's decline reason and recommended action shown verbatim** to the salesperson.
- **Driver's licence numbers captured on check payments.**
- **`irefund`** — a transaction type that exists and is excluded.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Payment Summary Window | Multi-tender entry point; one window per non-cash type |
| Gateway / EMV-Shift4 / EMV-Tender Retail | The three card integrations; a per-location property |
| MCM server | Tender Retail's intermediary; receives card data directly from the terminal |
| Pre-Authorized Deposit | Held authorisation; release converts it to a sale, plus an uplift sale |
| irefund | Card transaction type distinct from a refund; undefined |
| Credit Card GLA | GL account for card postings — from the Payment Type record, else the BANK record |
| Standard MMP | Minimum monthly payment; payments are validated against the sum across plans |
| Daily Maximum Cash Refund Per Customer | Anti-structuring cap on cash refunds |
| Pin Pad Identifier | Cash drawer attribute required for EMV refund display |
| Bank Response / Response Action | The processor's decline reason and recommendation, shown verbatim |

---

## Contract adjudication — batch 4

| Contract | Verdict | Basis |
|---|---|---|
| **W-052** | **CONFIRMED** | Named debit/credit accounts with a `Payment Type` → `BANK` fall-through, plus the AR side from `General Ledger Assigned Account Settings` (F38) |
| **W-053** | **CONFIRMED** | Both transaction directions specified; customer Open Item Receivables updated alongside the GL (F38) |
| **W-050** | **CONFIRMED, extended** | Payment type itself is permissioned; cash refund cap has a named override (F34, F39) |
| **W-012** | **relevant** | Refundability decays with card data retention; abandoned transactions resolved N days prior (F41, F38) |
| **W-061** | **not relevant to this batch** | — |

---

## Next — batch 5: deposits, refunds, gift certificates and adjustments to completed orders
