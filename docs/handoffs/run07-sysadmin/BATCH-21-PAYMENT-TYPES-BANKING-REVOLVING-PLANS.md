# Run 07 — System Administration — Batch 21: Payment Types, Banking and Revolving Plans

Status: complete. Findings 637–651. Read-only throughout.

The tender layer and the consumer-credit product layer. **Revolving Payment Plan Settings** is the
find here — a plan is a nine-dimensional eligibility rule set whose violations each raise their own
security-override prompt.

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Credit Card Payment Settings** | 15242662922388 | Customer Settings | read |
| 2 | **Debit Card Payment Settings** | 15242630128404 | Customer Settings | read |
| 3 | **Bank Settings** | 15242611081620 | Customer Settings | read — *"Updated as of 1/16/2024"* |
| 4 | **Credit Application Settings** | 15242611356948 | Customer Settings | read |
| 5 | **Finance Level/MMP Table** | 15242406416020 | Customer Settings | read |
| 6 | **Contract Classification Settings** | 15242611357204 | Customer Settings | read |
| 7 | **Revolving Payment Plan Settings** | 15242663218836 | Customer Settings | read — four tabs |
| 8 | **View Bank Settings** | 15295210638740 | Customer Settings | noted, not read (twin) |

---

## B. Wiring findings

### FINDING 637 — Each tender kind has its own settings record with GL, fees and prompts

- **Invariant:** payment types are defined per tender family, carrying accounting and capture behaviour.
- **Evidence** — `Credit Card Payment Settings`:
  > "Use this routine to create and maintain **credit card payment types** for use in order-entry and receivables programs when applying deposits and payments to orders and receivables."
  Fields: `Payment Type Code` · `Description` · `Telephone` · **`Activation Date`** ·
  **`Expiration Date`** · `Track Receivables` · `Receivables GL Account` · **`Usage Fee Percent`** ·
  **`Usage Fee GL Account`** · `Due Days` · **`External Processor Code`** · `Prompt for CID` ·
  `Card Type` · `Expiration Date Prompt` · `Authorization Prompt`.
  `Debit Card Payment Settings` carries a **narrower** set: `Payment Type Code` · `Description` ·
  `Activation Date` · `Expiration Date` · `Receivables GL Account` · `External Processor Code` ·
  `Authorization Prompt`.
- **Maps to:** run 01 (GL) · run 03 (payments) · batch 18 F588 (`REWARDS` is a hidden type) ·
  batch 20 F627 (`Payment Type for Posting` on finance providers) · W-035, W-052.

> **Sibling records rather than one payment-type table** — credit card, debit card, cash, check,
> miscellaneous and gift certificate each have their own routine. **A rebuild should use one payment
> method table with a type discriminator**, but must know that STORIS's field sets genuinely differ:
> debit has no usage fee, no `Track Receivables`, no CID prompt.
>
> **`Usage Fee Percent` with its own GL account is a surcharge mechanism** — card fees passed to the
> customer and posted separately. Regulated by state in the US, which pairs with batch 19 F616's
> finding that consumer-credit rules are jurisdiction-scoped. **Nothing here scopes usage fees by
> jurisdiction.** §H.
>
> **Activation and expiration dates on a payment type** mean tenders can be introduced and retired on
> a schedule — a small but useful feature, and it means the live extract may contain expired types
> that still appear on historical orders.

### FINDING 638 — Debit cards must be swiped, dual cards default to credit, and refunds need the PIN

- **Invariant:** debit is capture-restricted; a manually-keyed dual card becomes a credit transaction.
- **Evidence** — `Debit Card Payment Settings`:
  > "**Debit cards must be swiped. You cannot enter a debit card number manually. If you enter the number of a credit/debit card, the system treats it as a credit card.** When you swipe a credit/debit card, your pin pad device initially displays an option called `Credit`. When you begin entering the PIN number, the display switches to `Enter`."
  > "**If you must cancel an order after the initial filing, the system treats a credit to a debit card account as a refund. You must specify the debit card number and PIN before issuing the refund.** You can also refund cash for the amount of the debit transaction."
- **Maps to:** run 03 (payments, refunds) · the Sales Security handoff §3.12 (PCI) · W-035.

> **The tender type is decided by the capture method, not by the card.** The same physical card
> becomes credit or debit depending on how it was entered — which means **the tender mix on an order
> is partly a function of till behaviour**, and reconciliation against processor statements must
> account for it.
>
> **The refund rule is operationally significant and customer-visible:** a debit refund requires the
> card *and the PIN*, so **it cannot be processed without the customer present**. The documented
> alternative is cash. A rebuild that assumes refunds can be issued asynchronously will break this
> flow.
>
> This is the second PCI-adjacent finding after the Sales Security handoff. **The recommendation
> stands: decide the card-data model before the extract.**

### FINDING 639 — Card swipe availability depends on Signature Capture being active

- **Invariant:** the swipe control is gated by a separate feature, and its absence has three possible causes.
- **Evidence** — `Debit Card Payment Settings`:
  > "**NOTE: When the `Card Swipe` button is active in STORIS, you can swipe a credit or debit card. After a successful card swipe, the appropriate payment type displays on the screen in the `Type` field. If the Card Swipe button is not active, either your swipe device is not connected properly, `Signature Capture` is not active on your system, or both.**"
- **Maps to:** batch 16 §C (`Enable Signature Capture` on user and user group) · run 06 (terminals) ·
  batch 18 F560 (device unassignment on location switch) · W-051.

> **A coupling that would never be guessed: card capture depends on the signature-capture feature.**
> Two things a rebuild would model independently are entangled — and since `Enable Signature Capture`
> is a **per-user and per-user-group** flag (batch 16 §C), **whether a till can swipe a card may
> depend on who is logged in.**
>
> Combined with batch 18 F560 (switching location silently unassigns the payment terminal), the
> payment-capture path has **at least three independent ways to be unavailable** — device, feature
> flag, and location context — and STORIS surfaces all three as one greyed-out button. That is a
> support-load finding worth designing away.

### FINDING 640 — The bank record is the junction for receivables, payables, EFT, positive pay and virtual cards

- **Invariant:** one record carries GL accounts for both sides, check numbering, and three payment-file formats; every location names a bank.
- **Evidence** — `Bank Settings`:
  > "This file is used by the financial modules for the processing of **accounts receivable, vendor receivables, financing, and other accounting information.**"
  > "**NOTE: Each location in STORIS contains a bank number. The system references this bank number when posting cash through Accounts Receivable and Sales Order Entry.**"
  General tab: Accounts Receivable GL (`Cash` · `Credit Card`) · Accounts Payable GL (`Cash` ·
  **`Next Check #`** · `Print Check #` · **`Allow Multiple Payment Batches`**) · `Account Number` ·
  `Alternate Account Number` · `Routing Number` · `Financial Institution` · `Transit Number` ·
  `Alternate ID`.
  Third Party Processing tab: `Payer Number` · `Originator Short Name` · `Originator Long Name` ·
  `Destination Data Center` · `Next Virtual Card Payment Number` · `Virtual Card File Format` ·
  `Virtual Card GL Account` · `Virtual Card Account Code` · `Virtual Card Customer ID` ·
  `Virtual Card Code Word` · `Next EFT Payment Number` · `EFT File Format` · `EFT GL Account` ·
  `Positive Pay File Format` · `Positive Pay Bank Identifier` · `Positive Pay Short Name` ·
  `Export Checks`.
- **Maps to:** batch 12 (Warehouse/Store Location Settings auto-create GL cost centres) · run 01
  (GL, AP) · W-052.

> **The bank is where cash posting resolves**, and the join is via the *location* — batch 12 found
> locations auto-create GL cost centres; this adds that they also name a bank, and that bank's GL
> accounts are where AR and order-entry cash lands. **Three-hop resolution: order → location → bank →
> GL account.**
>
> **Three separate outbound payment file formats** (EFT, positive pay, virtual card), each with its
> own next-number sequence. **Sequence numbers stored in a settings record** is a pattern the rebuild
> should replace with a proper sequence generator — concurrent check runs on a settings-held counter
> is exactly what `Allow Multiple Payment Batches` is dancing around.
>
> **Positive pay is fraud control**, and virtual cards are a payables tender. Both are bank-specific
> integrations, and **neither appears among batch 17 F562's 23 external tabs** — further evidence
> (after batch 18 F598's Avalara) that the integration inventory there is not exhaustive.

### FINDING 641 — Creating a company and its bank is circular, and STORIS documents the workaround

- **Invariant:** a company requires a bank and a bank requires a company; the fix is a temporary placeholder.
- **Evidence** — `Bank Settings`:
  > "**If creating a new company with a new bank, create the company in Company Settings and choose an existing bank from the `Bank to Print Checks` field (this choice is temporary and will be changed to the desired new bank). Save this new company then create the new bank here in Bank Settings. After creating the new bank, return to Company Settings and choose your newly created bank using the `Bank to Print Checks` field.**"
- **Maps to:** batch 12 (locations) · run 01 (company/GL) · W-052.

> **A documented circular dependency with a manual three-step dance.** It is a data-model artefact —
> `Bank Settings` has a `Company` field and `Company Settings` has a `Bank to Print Checks` field,
> mutually required — and STORIS resolves it by procedure rather than by making one side optional.
>
> **For the rebuild this is a small, cheap win:** make one side nullable at creation, or create both
> in one transaction. **For the migration it is a warning**: setup order matters, and the extract's
> foreign keys are mutually dependent.

### FINDING 642 — A third-party accounting integration deactivates two whole tabs

- **Invariant:** when TPA is active, Reconciliation and Third Party Processing are inert.
- **Evidence** — `Bank Settings`:
  > "Use this tab to set up your system for the Bank Reconciliation feature. **If TPA is active on your system, this tab is inactive.**"
  > "Use the fields on this tab to enter information required for electronic funds transfer (EFT), positive pay, and virtual cards. Note that **if TPA is active on your system, this tab is inactive.**"
- **Maps to:** batch 20 F626 (vendor-closed provider list) · batch 4 (licensing) · W-051, W-052.

> **`TPA` is not expanded anywhere in this article** — most plausibly Third Party Accounting, given it
> replaces reconciliation and payment-file generation. **Recorded as undefined**, not guessed: it
> joins the audit's term list. §H.
>
> **The pattern is a whole-subsystem handover:** with TPA on, STORIS stops doing bank reconciliation
> and payment file production entirely, presumably because an external accounting package does. **If
> LA Mattress runs TPA, two substantial areas of the parity target do not exist**, and conversely the
> rebuild may need to integrate with whatever TPA is. **A live-system question.**

### FINDING 643 — The credit application's second screen is provider-shaped

- **Invariant:** page one is provider-agnostic; page two's fields vary by finance provider.
- **Evidence** — `Credit Application Settings`:
  > "**The first screen of the process is used to gather customer information that is required on all credit applications, regardless of provider. The second application screen contains prompts for information required by the finance provider. The fields found on the second screen will vary according to the requirements of the specific finance provider.**"
  > "**The screens accessed from this process are identical to those accessed via the `Financing > Entries > Finance Credit Application` process.**"
- **Maps to:** batch 20 F626, F627 (provider records) · W-058.

> **A dynamically-composed form driven by provider metadata** — the first instance in the audit of a
> screen whose *field set* is data-driven rather than fixed. Everything else the audit has read has a
> static field list with conditional activation.
>
> **Where that metadata lives is not stated.** `Finance Provider Settings` (batch 20 F627) carries
> behaviour flags but no field definitions. So either the provider field sets are hard-coded per
> provider — consistent with F626's finding that transmitting providers are vendor-owned — or there is
> an unread definition record. §H. **Given F626, hard-coded is the likely answer**, which makes each
> provider a code artefact, not configuration.

### FINDING 644 — The MMP table is an ascending band lookup that must start at zero

- **Invariant:** minimum monthly payment is chosen by the highest finance level not exceeding the amount financed.
- **Evidence** — `Finance Level/MMP Table`:
  > "**This table must be built in ascending Financing Level order and is required if you select the `As a Fixed MMP Amount` option at the `Calculate MMP` field** in the revolving payment plans."
  > "**The first level must be entered as zero (0.00), with each subsequent setting increasing both the level and MMP Amount. The level represents the minimum that the finance amount must be in order to charge the corresponding MMP.**"
  > "**Example: The customer's finance amount is $250.00. Your table is set as follows: first level = 0.00, MMP = $10.00; second level = $200.00, MMP = $20.00; third level = $300.00, MMP = $30. Since the revolving amount ($250) is more than the 2nd level amount but less than the 3rd level, the MMP for this customer's plan is $20.00.**"
  > "To establish a plan with **one static MMP amount**, you can create only one level, with the Finance Level = 0.00…"
  Access: *"Revolving Receivables Payment Plans, Actions button, Finance Level/MMP Table"*.
- **Maps to:** batch 19 F616 (revolving terms are jurisdiction-scoped) · F645 · batch 20 F630
  (matrix tables) · W-035.

> **A worked example with real numbers is rare in this documentation and removes all ambiguity** —
> contrast batch 18 F592, where the delivery charge table's two calculation modes are
> indistinguishable in the data. **Here the semantics are pinned.**
>
> **Mandatory zero floor** means the lookup can never fail — the fifth structural instance of
> STORIS guaranteeing a resolution terminates (after `ZZZZZ`, `STD`, `RFND`, the default collections
> manager). **This one is enforced by validation rather than by a delivered row.**
>
> **A fifth menu-less routine** — Actions-button only.

### FINDING 645 — A revolving plan is a product definition spanning terms, interest, GL and signatures

- **Invariant:** the plan record defines how MMP and interest are calculated, which GL accounts post, and what paperwork is produced.
- **Evidence** — `Revolving Payment Plan Settings`, General tab:
  > `Calculate MMP` · `Fixed Term Months` · `Minimum Term Months` · `Maximum Term Months` ·
  > `Lowest MMP allowed` · `Percent of the Balance` · `Percent Rate` · **`Use Prime Interest Rate`** ·
  > `Calculate Interest on` · Signature (`Print Credit Agreement`) · Fees (`Charge Late Fees` ·
  > `Subject to Paper Statement Fee`) · GL Accounts (`Receivables` · **`Earned Interest`** ·
  > **`Unearned Interest`**) · `Exempt from Insurance Charges` · `Activate in Sales Order` ·
  > `Payment Agreement` · `Can be used to Purchase Gift Certificates/Cards` · `Allow Deferment` ·
  > `Customer Credit Review`
  > "**NOTE: The minimum MMP amount defined here can be overridden when in `Enter a Customer's Revolving Terms & Conditions` and you have permission via the `Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction` setting in Create a User/Group Actions - Receivables Security.**"
  > "The minimum/maximum term range… is used to establish the **Fixed MMP Table grid**… **The MMP amounts that are displayed in the grid are defined as including the principal, interest and insurance amounts.**"
  > "**NOTE: If you access this screen via an inquiry routine…you access a read-only version.**"
- **Maps to:** batch 19 F616 (state-scoped credit terms) · batch 20 F627 · run 01 (receivables) · W-035.

> **`Earned Interest` and `Unearned Interest` as separate GL accounts is the accounting tell**: this
> is a real lending product with interest recognised over time, not a payment-terms flag.
>
> **`Use Prime Interest Rate` means a plan's rate can float against an external benchmark** — so the
> rate is not necessarily stored on the plan, and a rebuild needs a prime-rate source and an
> effective-dating model. Where prime is maintained is not stated. §H.
>
> **The MMP grid bundles principal + interest + insurance**, which matters for disclosure: the number
> quoted to a customer is a blended figure. **A rebuild must reproduce the blend exactly** or quoted
> payments will differ from the legacy system's.

### FINDING 646 — Promotional changes reach only newly activated plans

- **Invariant:** editing a plan's promotion does not affect customers whose plan was already active.
- **Evidence** — `Revolving Payment Plan Settings`, Advanced tab:
  > "**NOTE: If you change or add a promotion via the fields on this tab for an existing payment plan, only newly activated customer plans are affected. New orders entered for customer plans that were active prior to your edits are not affected by the new/modified promotion settings.**"
  Advanced fields: Plan Transfer (`Allow Other Plans to Transfer to this Plan` ·
  `Transfer Balance to Plan` · `Days Late` · `Transfer Balance to Plan When Promotion Expires` ·
  `Post MMPs for Balances Transferred from this Plan`) · Promotional Interest (`Percentage` ·
  `Expires` · `Valid Days` · `Expires on the Cycle Date`) · No Payments (`Until` · `Number of Days`).
- **Maps to:** **resolve-once-and-store — tenth instance** (batch 16 F547, batch 19 F605/F607,
  batch 20 F632) · W-035.

> **The house rule again, and here it is legally the right behaviour**: a customer's credit terms are
> a contract, so changing the plan definition must not retroactively alter agreements already struck.
> **This is the instance where resolve-once is a feature, not an artefact** — worth noting, because a
> rebuild tempted to normalise everything to live lookups would create a compliance problem.
>
> **`Transfer Balance to Plan When Promotion Expires` is automatic plan migration** — when a
> promotional period ends, the balance moves to a named successor plan, presumably at a different
> rate. **That is the deferred-interest mechanic**, and it is configured, not coded.

### FINDING 647 — Each plan restriction violated raises its own security-override prompt

- **Invariant:** ineligibility is enumerated per restriction, and each can be overridden by permission or by another user.
- **Evidence** — `Revolving Payment Plan Settings`, Restrictions tab:
  > "When you enter a revolving plan manually in the order entry process and the system determines it is not eligible, an error message displays giving you the option to review the plan requirements. You can click yes to view the message(s) in the **`Revolving Plan Restriction Results`** window…"
  > "**When a restriction is encountered during entry of the payment plan, a security override prompt appears for each restriction. If you have permission via the Create a User/Group Actions - Receivables Security `Revolving Payment Plan Restrictions` settings or obtain a security override from another user, security is granted and the entry of the payment plan is allowed. Otherwise, the entry is not allowed.**"
- **Maps to:** run 06 F316 (the Security Override Screen) · batches 7–9 (Receivables Security) ·
  the Sales Security handoff §3.3 (the override family) · W-050.

> **Per-restriction override, not per-transaction** — so a plan failing three restrictions produces
> three prompts, each independently grantable. **That is finer-grained than anything in the Sales
> Security catalogue**, where overrides are one permission per rule.
>
> **The "or obtain a security override from another user" path is run 06 F316's Security Override
> Screen**, and this is the clearest example the audit has of it in commercial use: a salesperson
> calls a manager over, the manager authenticates, and the specific restriction is waived. **The
> override is per-restriction and presumably logged nowhere the audit has seen.** §H — and it is the
> same recommendation as the Sales Security handoff: **log override exercises.**

### FINDING 648 — Cycle-processing transfers bypass the restriction set entirely

- **Invariant:** an automatic balance transfer into a plan ignores that plan's eligibility rules.
- **Evidence** — `Revolving Payment Plan Settings`:
  > "**If this plan is set to allow transfers from other plans, the transfer feature in cycle processing overrides the restrictions on this tab.**"
- **Maps to:** F646, F647 · batch 5 (the batch calendar) · W-035, W-041.

> **A machine path with no eligibility check, sitting beside a human path with nine of them.** The
> logic is defensible — a balance being migrated at promotion expiry has nowhere else to go — but it
> means **the restriction set is not an invariant of the plan; it is a gate on manual entry only.**
>
> **A rebuild must not implement restrictions as a database constraint** or cycle processing will
> fail. They belong in the order-entry service, not the data layer. **This is exactly the kind of
> asymmetry that a clean reimplementation gets wrong by being too strict.**
>
> **Seventh batch-calendar responsibility**: cycle processing joins EOD, EOM and `Generate Monthly
> Reports` as a carrier of business logic.

### FINDING 649 — Plan eligibility spans nine dimensions

- **Invariant:** a plan can be restricted by credit score band, deposit, classification, dates, franchise, store, state, financed amount and past-due days.
- **Evidence** — `Revolving Payment Plan Settings`, Restrictions tab:
  > "Use this tab to define a period during which the plan is valid and to define plan restrictions by **corporate or franchise store (if franchising is active), individual store location, state and/or minimum credit score.**"
  > Credit Score (`Minimum Credit Score` · `Maximum Credit Score`) · Deposit
  > (`Minimum Deposit Amount` · `Minimum Deposit Percentage`) · Classification (`Classification` ·
  > **`Exclude from General Use`**) · Plan Dates (`Valid From, Through`) · Location Restrictions
  > (`Restrict Use to` · **`Franchise`** · `Store` · `State`) · `Minimum Financed Amount` ·
  > `Allow Multiple Pending Plans` · `eSTORIS Discount Restrictions Apply` ·
  > `Required Percentage Paid before Add-on Allowed` · `Past Due Days`
  eSTORIS tab: `Plan Name` · `Display Order` · `Plan Availability`.
- **Maps to:** batch 19 F616 (state-scoped credit terms) · batch 16 F552 (location restriction axes) ·
  F647 · W-035, W-051.

> **`State` as a restriction dimension is the operational face of batch 19 F616** — consumer credit
> is state-regulated, so a plan legal in California may not be offered in Nevada. **A rebuild must
> treat state eligibility as a hard compliance rule, not a marketing preference**, even though it sits
> among marketing-shaped fields like `Display Order`.
>
> **`Franchise` is the audit's first sighting of franchising as a modelled concept** — *"if
> franchising is active"* implies a licensed module. §I.
>
> **A separate plan name and display order for eSTORIS** means the customer-facing catalogue of credit
> offers is curated independently of the internal one.

### FINDING 650 — Contract classifications carry a level, and at least one must exist

- **Invariant:** installment plans require a classification code, and classifications are ranked.
- **Evidence** — `Contract Classification Settings`:
  > "Use this routine to create and maintain **installment contract classification codes. At least one classification must be set up.** Once established, you then assign these contract classifications to installment plans at the `Classification` field on the General tab of **Installment Payment Plan Settings**."
  Fields: `Classification Code` · `Description` · **`Level`**.
- **Maps to:** F649 (`Classification` on revolving plans too) · run 01 (installment receivables) ·
  W-035.

> **`Level` implies a hierarchy or ranking of contract classes** with no stated meaning — most likely
> risk tiering, but **the docs do not say and the audit will not infer it as fact.** §H.
>
> **"At least one must be set up" is a bootstrap requirement**, the second in this batch after F644's
> mandatory zero MMP level and F641's company/bank dance. **Three setup-order dependencies in one
> batch** — worth collecting into a cutover checklist, since a rebuild's seed data must satisfy them
> in order.
>
> Classification appears on **both** revolving (F649) and installment plans, so it is a cross-product
> categorisation.

### FINDING 651 — Inquiry routines open the same screens read-only

- **Invariant:** reaching a settings screen from an inquiry gives an identical, non-editable version.
- **Evidence** — `Revolving Payment Plan Settings`:
  > "**NOTE: If you access this screen via an inquiry routine, such as `View a Customer's Revolving Statement`, you access a read-only version of this screen. The fields are the same, but you cannot edit the information using the read-only version.**"
- **Maps to:** **batch 14 F508** (*"The read-only version of this screen appears when accessed through
  a view-only version of the routine"*) — **now confirmed as a general rule** · batch 16 · W-050.

> **Batch 14 met this behaviour once and recorded it as a generalisable UI rule rather than a
> purchase-status fact. Here it is again, in an unrelated module, stated the same way.** Two
> independent sightings make it a house pattern: **STORIS substitutes read-only twins based on the
> caller, not on the user's permissions.**
>
> That explains the ~200 `View …` articles the audit has been treating as duplicates — they are not
> separate screens, they are **the same screens reached through a read-only entry point**. It
> validates batch 08's decision to exclude them, and it means the rebuild needs **one screen with a
> mode parameter**, not two implementations.

---

## C. Screen and field inventory (additions)

Inline above. `Bank Settings` tabs: **General · Reconciliation · Third Party Processing**, with
*"Support Files: Company, Vendor, Warehouse Location."*
Reconciliation tab: `Reconcile Transactions` · `Automated Bank Download` · `Beginning Balance` ·
`As Of` · `Deposit Type Code`.
`Revolving Payment Plan Settings` tabs: **General · Advanced · Restrictions · eSTORIS**.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Calculate MMP` = `As a Fixed MMP Amount` | Revolving Payment Plan Settings | Requires the Finance Level/MMP Table (F644) |
| `Use Prime Interest Rate` | Revolving Payment Plan Settings | Floats the plan rate against an external benchmark (F645) |
| TPA active | *(system-level; record not identified)* | Deactivates bank reconciliation and third-party processing (F642) |

---

## E. Security permissions catalog (additions)

| Permission | Record | Effect |
|---|---|---|
| `Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction` | **Receivables Security** | Permits an MMP below the plan minimum (F645) |
| `Revolving Payment Plan Restrictions` *(settings, plural)* | **Receivables Security** | Per-restriction override at plan entry (F647) |

> `Revolving Payment Plan Restrictions` is described as *"settings"* — likely one permission per
> restriction dimension, mirroring F649's nine. **That would make Receivables Security ragged in the
> same way `Report on User Security` says it is** (batch 16 F549). §H.

---

## F. State machines and enumerations (additions)

**MMP calculation** — `As a Fixed MMP Amount` (table-driven) · `Percent of the Balance` · fixed term.
Full enumeration not published (F644, F645).

**Tender records** — credit card · debit card · cash · check · miscellaneous · gift certificate,
each its own settings routine, plus the hidden `REWARDS` type (batch 18 F588).

**Outbound bank file formats** — EFT · positive pay · virtual card, each with its own next-number
(F640).

---

## G. Sequencing rules (additions)

**Ascending band lookup with a mandatory zero floor** (F644) — a guaranteed-terminating table, the
fifth structural fallback pattern.

**Resolve once, store the answer — tenth instance**: promotional plan changes reach only newly
activated plans (F646). **Here the behaviour is legally correct rather than incidental.**

**Machine paths bypass human-path restrictions** (F648) — new shape, and a warning against
implementing eligibility as a data constraint.

**Read-only twins are caller-derived, not permission-derived** (F651) — confirms batch 14 F508.

---

## H. Open questions and gaps

1. **What is `TPA`?** (F642). Deactivates two whole subsystems. **Live-system question — if LA
   Mattress runs it, the parity target shrinks materially.**
2. **Where do provider-specific credit application fields come from?** (F643). No definition record
   found; F626 suggests hard-coded per provider.
3. **Where is the prime rate maintained?** (F645).
4. **What does `Level` mean on a contract classification?** (F650).
5. **Are card `Usage Fee Percent` surcharges jurisdiction-scoped?** (F637). Nothing here scopes them,
   and surcharging is state-regulated.
6. **Is `Revolving Payment Plan Restrictions` one permission or nine?** (F647, §E).
7. **Are per-restriction overrides logged?** (F647). Same recommendation as the Sales Security
   handoff.

**Setup-order dependencies collected** (for a cutover checklist)

- Company ↔ Bank is circular; use a temporary bank (F641).
- At least one contract classification must exist before installment plans (F650).
- A fixed-MMP plan requires an MMP table whose first level is 0.00 (F644).
- Commission calculation method must change before commission matrices (batch 20 F631).

**Inferences**

- **I-104** — `TPA` = Third Party Accounting, from what it replaces. **Not adopted.**
- **I-105** — `Level` on contract classification is risk tiering. **No support in the text.**

---

## I. Unknown unknowns

- **Franchising is a modelled concept** (F649, *"if franchising is active"*). An entire operating
  model the audit has never seen described.
- **Positive pay and virtual cards** (F640) — two bank-integrated payables mechanisms, neither in the
  23-tab integration inventory.
- **`Revolving Plan Restriction Results` window** (F647) — a dedicated diagnostic surface for
  eligibility failures.
- **`Installment Payment Plan Settings`** (F650) — the installment twin of the revolving plan record,
  unread.
- **`Deposit Type Code` / `Reconciliation Deposit Type Settings`** (F640) — a reconciliation
  classification scheme, unread.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **MMP** | Minimum Monthly Payment; may be table-driven, percent-of-balance, or fixed |
| **Finance Level** | The lower bound of an MMP band; the table must start at 0.00 |
| **`TPA`** | An external accounting integration that disables STORIS reconciliation and payment files (**unexpanded**) |
| **Positive pay** | Bank fraud control comparing issued cheques against presented ones |
| **Virtual card** | A payables tender with its own file format and GL account |
| **Usage fee** | A card surcharge with its own percent and GL account |
| **Read-only twin** | The same screen served non-editable because of the calling routine |

---

## Contract adjudication — batch 21

| Contract | Verdict | Basis |
|---|---|---|
| **W-035** *(receivables / credit products)* | **CONFIRMED — plans are nine-dimensional products** | F644–F650 |
| **W-052** *(GL / banking)* | **CONFIRMED** | Location → bank → GL posting chain (F640); dual-sided accounts, three file formats |
| **W-050** *(access control)* | **CONFIRMED — finest granularity yet** | Per-restriction override prompts (F647) |
| **W-051** *(licensing / modules)* | **CONFIRMED** | TPA disables two tabs (F642); franchising gates a restriction (F649) |
| **W-058** *(external interfaces)* | **CONFIRMED — inventory again incomplete** | EFT, positive pay, virtual card absent from batch 17 F562's 23 (F640) |
| **W-041** *(batch calendar)* | **CONFIRMED — seventh responsibility** | Cycle processing transfers balances and bypasses restrictions (F648) |
| **W-034** *(deletion)* | **NOT DOCUMENTED IN THIS SECTION** | — |
| **Machine paths bypass human restrictions** | **NEW** | F648 |
| **Caller-derived read-only screens** | **CONFIRMED as a house rule** | F651 + batch 14 F508 |

---

## Next — batch 22

**System Administration (nested)** — the purge, import and mass-update routines. The most destructive
area in the product and the one the rebuild most needs understood before cutover. Read-only
discipline is critical: nothing will be run.
