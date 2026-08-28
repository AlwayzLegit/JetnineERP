# Run 03 — Sales Processing — Batch 10: Settlement, Cash Balancing and COD

**Status: complete.** 9 articles. Findings 96–105.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Transmit Financing Settlement** | /articles/15201688835860 | EXTRACTED |
| 2 | **Finalize Financing Settlement** | /articles/15201688835988 | EXTRACTED |
| 3 | **Resubmit Settlement Errors** | /articles/15201688834836 | EXTRACTED |
| 4 | **Balance a Cash Drawer** | /articles/15201704208916 | EXTRACTED |
| 5 | Blind Cash Balancing Screen | /articles/15201704118804 | EXTRACTED — thin |
| 6 | **Balance Approval by Manager** | /articles/15201704204436 | EXTRACTED |
| 7 | **Reconcile Cash Drawer** | /articles/15201704205076 | EXTRACTED |
| 8 | **COD Worksheet** | /articles/15201528412436 | EXTRACTED — rich |
| 9 | *(cross-read)* Required Deposits by Line Display | /articles/15201424461588 | *(batch 5)* |

Discovered and queued: **`Cash Balancing Control Settings`** · `Report Cash Drawer Balancing Totals` ·
**`Report Cash Balancing Exceptions`** · `Bank Reconciliation Overview` · `Purge Cash Drawer Data` ·
`Petty Cash Disbursement` · `Enter On Account Payment Type` · `Balancing Payment Type Totals` ·
`Maintain Financed Balances` *(Manual Posting Entry)* · `General System Control Settings`
*(`On-Line Financing Approvals`)*.

---

## B. Wiring findings

### FINDING 96 — Finance receivables accumulate into an untransmitted batch throughout the day
Invariant (verbatim): "**If the `On-Line Financing Approvals` field is set to 'Active' in the `General
            System Control Settings`, throughout the day Finance Receivable transactions are posted to
            the current un-transmitted batch. Daily transmission of receivable data to the Finance
            Provider must then take place.**"
Invariant:  "**Settlement transmission may take place automatically as part of Day Ending processing, or
            can be run manually on demand**… determined by the setting of the **`Auto EOD Transmit`**
            field in the `Financing Control Settings`."
Warning:    "**NOTE: Some finance providers require that data be sent at specific times. The scheduling
            of transmissions should be approved by the Finance Provider.**"
Evidence:   Transmit Financing Settlement, /articles/15201688835860
Maps to:    **W-012 — CONFIRMED; a twelfth End-of-Day behaviour**

> **An open batch accumulates all day and must be transmitted daily.** Whether that happens in Day
> Ending or by hand is one setting, and the timing is **contractually constrained by the provider** —
> a business obligation encoded as a scheduling decision.
>
> This is the revolving half of batch 9 Finding 87's two settlement models. Combined: **installment and
> RTO settle transaction-by-transaction on completion; revolving accumulates and goes once a day.** A
> business running both has money moving on two different clocks, and only one of them is visible in
> End-of-Day.

### FINDING 97 — Some providers settle over two days, with a response file that updates history
Invariant (verbatim): "Use this process **only if the finance provider uses the 'two-step' (two day)
            settlement process** (that is, **providers who receive batch settlement files and return a
            response file the following day**)."
Four effects (verbatim): "**The responses returned are used to update the history records. The batch
            settlement record will be updated. The `Settlement Report` is then printed. The message log
            is updated with a status record for the results of the batch.**"
Evidence:   Finalize Financing Settlement, /articles/15201688835988
Maps to:    **NEW**

> **A third settlement model**: send today, learn the outcome tomorrow, then post the results. So the
> audit now has three timings — immediate (installment/RTO), same-day batch (revolving, one-step), and
> **two-day round trip** — and which applies is a property of the provider, not of STORIS.
>
> The consequence for reconciliation is significant: **for two-step providers, yesterday's settled
> figures are not final until today's finalize runs.** Any daily cash or receivables report produced
> before that step is provisional, and nothing in the article flags that on the report itself.

### FINDING 98 — A rejected settlement batch is worked item by item, and FTP providers can only resubmit
Invariant:  "Communication failures or incorrectly transmitted data can cause a finance provider to
            **reject a settlement batch**… identify **the items on a rejected settlement batch that must
            be re-submitted, as well as the items that have been successfully funded.**"
Scope split (verbatim): "You use this routine to review **entire batches**. **For a specific detail
            transaction that may have been rejected by the provider, re-submit the item via the
            `Maintain Financed Balances` (Manual Posting Entry) routine.**"
Guard (verbatim): "**As a precaution against users reviewing records that did not fail, the routine
            first scans all records to determine which records failed. If no failed records are found,
            an error message appears and the system exits the program.**"
Prompt:     "a message appears **reminding you to contact the appropriate provider to determine the
            appropriate action** to take for each item… If you have this information ready, click `Yes`."
FTP limit (verbatim): "**For providers using the FTP method for settlement, confirmation of funded items
            occurs as a second process in a different routine. Thus, `Resubmit` is the only action
            allowed for these items.**"
Permission: "**`Review and resubmit failed finance settlement batches`** in `Create a User` (Staff File)
            and `Create a User Group` (Staff Type). **The setting in the Staff File overrides the
            setting in the Staff Type File.**"
Evidence:   Resubmit Settlement Errors, /articles/15201688834836
Maps to:    **W-050 — and a sixth exception queue**

> **The audit's sixth exception queue**, and the most explicitly human of them: the routine opens by
> telling you to phone the provider first, and refuses to open at all if nothing failed. That guard is
> unusual and well-judged — it prevents browsing a screen full of funded money.
>
> **The Staff File overriding the Staff Type File** is worth recording: it is the first explicit
> statement in the audit of user-level settings beating group-level ones. Run 2 found the opposite
> pattern for Regional Processing, where group fields stayed active when user fields did not. **STORIS
> has no single rule for user-vs-group precedence**, and a rebuild must pick one.

### FINDING 99 — Cash balancing is blind by design, and grouped three possible ways
Invariant:  "a '**back office**' cash control feature operators and cashiers can use to enter their
            receipt totals into the system at the end of the business day."
Grouping (verbatim): "Use the **`Group Payments by`** field in the `Cash Balancing Control Settings` to
            run cash balancing **by drawer, cashier, or store**."
Prerequisites (verbatim): "the **`Extended Cash Balancing`** setting in Cash Balancing Control Settings
            must be checked, as well as **`Number of Tries`** or **`Post to Suspense`**."
Blind entry: "The program separates the totals **by payment type** (cash, check, credit, etc.). You run
            this routine for user-defined range of hours and for a selected day, then use the
            **`Blind Cash Balancing Screen`** to enter the totals for each payment type posted that day."
Exceptions: "**Cash balancing exceptions display on the `Report Cash Balancing Exceptions` routine that
            runs during `Generate Daily Reports`.**"
Evidence:   Balance a Cash Drawer, /articles/15201704208916;
            Blind Cash Balancing Screen, /articles/15201704118804
Maps to:    **NEW — and it is a genuine internal control**

> **Blind balancing** — the cashier enters what they counted without seeing what the system expects —
> is the correct anti-fraud design, and STORIS implements it as a dedicated screen. **`Number of Tries`**
> is the interesting setting: the cashier gets a bounded number of attempts before the difference
> stands, which stops fishing for the expected figure.
>
> **`Post to Suspense`** is the alternative disposition — unbalanced money goes to a suspense account
> rather than blocking. Run 1 found a suspended-postings queue in Accounting; this is plausibly its cash
> feeder, though nothing connects them explicitly. **A thirteenth End-of-Day behaviour**: the exceptions
> report runs in Generate Daily Reports.

### FINDING 100 — The manager approval screen shows both figures, and the docs warn about who may open it
Invariant:  "**the manager must approve all cash drawers that are out of balance.**… The manager thus
            has the opportunity to **correct, balance, and choose whether to approve** drawers that are
            out of balance, **and to post payment transactions that a cashier may have missed.**"
Columns:    Reference · Drawer/Cashier/Store · Date · **`Over/Short`** · Start/End Time · Payment Type ·
            **`System Total`** · **`Posted Total`**
Date rule (verbatim): "**Any adjustments you make via this routine post with a transaction date equal to
            the transaction date associated with the other transactions in the cash drawer.**"
Warning (verbatim): "**Important! This screen displays system-recorded totals as well as those entered
            during cash balancing. Therefore, we recommend you establish menu security to limit access
            to this routine.**"
Evidence:   Balance Approval by Manager, /articles/15201704204436
Maps to:    **W-012 — CONFIRMED; W-050 — a documented control weakness**

> **The blind control is only blind until someone opens this screen** — and the documentation says so
> outright, recommending menu security as the mitigation. That is an honest admission that the integrity
> of cash balancing rests on **menu access, not on a permission**, which is a weaker control than
> everything else in this run.
>
> The date rule confirms run 1's transaction-date model from the cash side: **an adjustment posts on the
> drawer's date, not today's.** So a correction made three days later lands in the original day's
> figures — right for reconciliation, but it means daily cash totals are mutable after the fact.

### FINDING 101 — Cash drawers are reconciled against the bank, and the design assumes one deposit slip per drawer
Invariant:  "**Reconciling cash drawer deposits to a bank statement is a required process in cash
            balancing.**… **All cash drawers that have not been reconciled and subsequently purged
            display in the grid.**"
Columns:    Reference # · Date · Drawer/Store/Operator · **`System Total`** · **`Status` (`R`=Reconciled)** ·
            **`Bank Total`** · **`Over/Short`** *(System Total − Bank Total)*
Caveat (verbatim): "**NOTE: `Bank Total` information is useful only if you submit separate deposit slips
            for each cash drawer. Reconciliation of cash drawers occurs after your bank deposit has been
            made.**"
Evidence:   Reconcile Cash Drawer, /articles/15201704205076
Maps to:    **connects to run 1's bank reconciliation findings**

> **Two over/short figures exist for the same money**: cashier-counted vs system (Finding 100) and
> system vs bank (here). A drawer can balance internally and still be short at the bank, or the reverse.
>
> The candid note is the useful part: **the whole `Bank Total` column is only meaningful if the business
> banks each drawer separately.** Most retailers consolidate, which would make this column unusable —
> so whether LA Mattress can use drawer-level bank reconciliation at all depends on a banking practice,
> not a setting. Worth asking.
>
> Note also **"not been reconciled and subsequently purged"** — reconciliation data is purgeable, via
> `Purge Cash Drawer Data`. Another retention timer, unquantified.

### FINDING 102 — The COD worksheet is a "what if" calculator that never writes
Invariant (verbatim): "**The calculations are strictly 'what if' calculations within this worksheet, and
            do not affect amounts in the system.**"
Invariant:  "**This screen is unavailable for direct ship items.**"
Inclusions (verbatim): "The C.O.D calculation includes the **- deposit hold-back percent (if any) as
            defined in the `Accounts Receivable Control Settings`** as well as **- the customer's
            previous AR balance.**"
Application order (verbatim): "**The total required for any future invoice is the amount required to pay
            for the merchandise being completed plus the minimum deposit requirements for the undelivered
            merchandise. Any money paid is first applied to the merchandise being invoiced. Any balance
            of money paid is then applied to satisfy the minimum deposit requirements on the undelivered
            merchandise.**"
Evidence:   COD Worksheet, /articles/15201528412436
Maps to:    **completes batch 5 Finding 50**

> **The amount collected at the door is the value of what is being delivered *plus* the minimum deposit
> on what is not** — and payment applies to the delivered goods first, with any surplus topping up the
> deposit on the remainder. That is the complete rule behind batch 5's `Required Deposits by Line
> Display` and, through it, run 2's `Minimum Deposit Met` PO-release criterion.
>
> Two further inputs make the figure non-obvious: **the deposit hold-back percent** (batch 1's
> undescribed `Deposit Hold Back` field, now sourced to AR Control Settings) and **the customer's
> previous AR balance** — so an unrelated old balance can increase what the driver must collect today.

### FINDING 103 — The COD worksheet projects three columns forward, and warns when holdback is short
Columns (verbatim): **`Total`** *("the current dollar amounts on the sales order, as well as the total
            Anticipated COD amount… **the totals displayed do not include previous deliveries or
            deposits applied to previous deliveries**")* · **`Next Delivery`** · **`To Be Delivered`**
            *("the projected dollar amounts **after** the proposed delivery… **assuming the Anticipated
            COD for the Next Delivery column is collected**")*
Rows (verbatim): Merchandise · Delivery · Fees/Charges · Sales Tax · **`Deposits`** *(negative =
            credits)* · **`Financing`** *(negative = credits)* · **`Previous Balance`** ·
            **`Anticipated COD`** — "the sum of the prior rows; the total amount estimated to be
            collected from the customer upon delivery."
Arithmetic: "**The `Anticipated COD` row for this column equals the total balance − deposits**, or in
            other words, **Anticipated COD from the `Total` column − Anticipated COD from the `Next
            Delivery` column.**"
Warning (verbatim): "**If using multiple concurrent fulfillments and the order does not contain the
            minimum holdback amount, STORIS recommends reviewing the calculated C.O.D.'s and to manually
            override them when appropriate.**"
Controls:   `Deliver` · `Scheduled` · **`Deliver None`** · **`Deliver All`** · editable `Status` when
            the order mixes line types.
Evidence:   COD Worksheet, /articles/15201528412436
Maps to:    **NEW**

> A **three-column forward projection of cash collection** — what is owed in total, what to collect on
> this trip, and what will remain — recomputed live as the operator toggles which pieces go. That is a
> genuinely good tool and it exists because furniture deliveries split.
>
> Two cautions. **The `Total` column excludes previous deliveries and their deposits**, so it is not the
> order's history — it is the remaining picture. And **with multiple concurrent fulfillments and
> insufficient holdback, STORIS tells the operator to override the calculation by hand**, which is an
> admission that the model does not cover that case.

### FINDING 104 — Cash balancing, settlement and COD each depend on settings clusters that gate the feature entirely
| Feature | Gating settings | Effect if unset |
|---|---|---|
| Cash balancing / approval / reconciliation | `Extended Cash Balancing` **and** (`Group Payments by` \| `Number of Tries` \| `Post to Suspense`) | Routines unusable — stated on **three** separate articles |
| Settlement transmission timing | `Auto EOD Transmit` | Manual only |
| Finance receivable batching | `On-Line Financing Approvals` = Active | No untransmitted batch accumulates |
| Two-step finalisation | provider behaviour | Routine not applicable |
| Resubmit errors | `Review and resubmit failed finance settlement batches` *(Staff File overrides Staff Type)* | No access |
| COD holdback | `deposit hold-back percent` in AR Control Settings | Excluded from the COD calculation |
Evidence:   accumulated across all nine articles
Maps to:    **NEW — stated as a finding because the pattern is now systematic**

> **The same prerequisite sentence appears verbatim on three cash-balancing articles**, which is the
> documentation's way of saying the whole subsystem is off unless a cluster of settings is on. Runs 1
> and 2 found the same shape repeatedly — unconfigured thresholds meaning no control at all (run 2 F30,
> batch 1 F13). **Here it is the reverse risk: an entire internal control that does not exist until
> someone switches it on**, with no indication anywhere that it is missing.
>
> For the cutover, the practical action is to **extract the live values of these gating settings first**
> and establish which controls are actually operating today, before designing replacements.

### FINDING 105 — Settlement, cash and COD together give the section three independent money-timing models
Consolidated across batches 4, 5, 9 and 10:

| Money path | Timing | Reconciled by |
|---|---|---|
| Cash / cheque | Collected at sale or delivery | **Blind balancing → manager approval → bank reconciliation** |
| Card | Authorised at sale; **abandoned transactions swept later** | `Resolve Abandoned External Card Transactions` *(batch 4 F38)* |
| Revolving finance | **Batched all day, transmitted at EOD or manually** | `Resubmit Settlement Errors`; two-step providers finalise next day |
| Installment / RTO | **Settled at completion, including partial** | provider-side; contract and first payment outside STORIS |
| Deposits | Append-only after leaving the order | `Maintain Customer Deposits` *(unread)* |
| COD | Calculated per delivery, collected at the door | COD Worksheet *(what-if only)* |
Maps to:    **W-012 / W-052 / W-053 — consolidated**

> **Six money paths, at least four distinct timing models, and four different reconciliation
> mechanisms.** Nothing in the section reconciles them to each other; each has its own report, its own
> exception queue and its own settings cluster.
>
> That is the honest summary of Sales Processing's cash architecture, and it is the thing a rebuild is
> most likely to over-simplify. The timings are not arbitrary — they follow the counterparty (customer,
> processor, lender) — but **the absence of a single view across them is a genuine gap**, and it is why
> run 1 found so much reconciliation machinery in Accounting.

---

## C. Screen and field inventory

**Transmit Financing Settlement** — `Finance Provider` · Run.

**Finalize Financing Settlement** — `Finance Provider` · Run. Produces the **Settlement Report** and a
message-log status record.

**Resubmit Settlement Errors** — `Finance Provider` · **`Merchant Number`** · **`Batch Number`** ·
grid · `Order Number` · **`Action`** *(Resubmit only for FTP providers)* · Save.

**Balance a Cash Drawer** — Date · **Start Time / End Time** · Cashier · Store · Drawer · Run →
Blind Cash Balancing Screen.

**Blind Cash Balancing Screen** — **`Cash Drawer Ref`** · **`Drawer Total`** · Save · grid.

**Balance Approval by Manager** *(Manager Approval)* — Reference · Drawer/Cashier/Store · Date ·
**`Over/Short`** · Start/End Time · Payment Type · **`System Total`** · **`Posted Total`** · Save.

**Reconcile Cash Drawer** — Reference · **`Reconcile`** · **`Bank Total`** · grid: Reference # · Date ·
Drawer/Store/Operator · System Total · **Status (`R`=Reconciled)** · Bank Total · **Over/Short** · Save.

**COD Worksheet** — *Header*: Order · **`Status`** *(editable when line types are mixed)* · Bill To ·
Fulfillment. *Grid*: Product Delivery · Product · Description · **`Deliver`** · `Scheduled` ·
**`Deliver None`** · **`Deliver All`**. *Delivery Totals* — columns **Total · Next Delivery ·
To Be Delivered**; rows **Merchandise · Delivery · Fees/Charges · Sales Tax · Deposits · Financing ·
Previous Balance · Anticipated COD**.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`On-Line Financing Approvals`** | **General System Control Settings** | Whether FR transactions batch during the day |
| **`Auto EOD Transmit`** | Financing Control Settings | Settlement in Day Ending vs manual |
| **`Extended Cash Balancing`** | **Cash Balancing Control Settings** | **Gates the entire cash-balancing subsystem** |
| **`Group Payments by`** | Cash Balancing Control Settings | Balance by **drawer, cashier or store** |
| **`Number of Tries`** | Cash Balancing Control Settings | Attempts a cashier gets at a blind count |
| **`Post to Suspense`** | Cash Balancing Control Settings | Where unbalanced money goes |
| deposit hold-back percent | **Accounts Receivable Control Settings** | Included in the COD calculation |
| menu security | (menu configuration) | **The only stated control on Balance Approval by Manager** |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **`Review and resubmit failed finance settlement batches`** | `Create a User` (Staff File) **and** `Create a User Group` (Staff Type) — **Staff File overrides Staff Type** | Working a rejected settlement batch |
| menu security *(recommended, not a permission)* | menu configuration | Access to Balance Approval by Manager |

---

## F. State machines and enumerations

**Settlement models (3)** — immediate *(installment/RTO, on completion, partial supported)* ·
same-day batch *(revolving; EOD or manual)* · **two-step / two-day** *(send, receive response file,
finalise)*.
**Settlement batch states** — accumulating *(untransmitted)* → transmitted → funded · **rejected** →
resubmitted → funded.
**Cash balancing grouping** — drawer · cashier · store.
**Cash drawer states** — open → balanced *(blind)* → approved *(if out of balance)* → **reconciled
(`R`)** → purged.
**Over/short figures (2)** — cashier vs system · **system vs bank**.
**COD projection columns** — Total · Next Delivery · To Be Delivered.
**COD rows** — Merchandise · Delivery · Fees/Charges · Sales Tax · Deposits · Financing ·
Previous Balance · **Anticipated COD**.
**End-of-Day behaviours added this batch** — settlement transmission *(when `Auto EOD Transmit`)* ·
`Report Cash Balancing Exceptions`.

---

## G. Sequencing rules

1. FR transactions accumulate into an untransmitted batch throughout the day.
2. Transmission runs in Day Ending or manually, at times the provider approves.
3. Two-step providers require `Finalize Financing Settlement` the following day before figures are final.
4. A rejected batch is worked item by item; single transactions go through `Maintain Financed Balances`.
5. Cash balancing: blind entry → exceptions report at End-of-Day → manager approval for out-of-balance
   drawers → bank reconciliation → purge.
6. Manager adjustments post on **the drawer's transaction date**, not the current date.
7. COD collection applies to delivered merchandise first, then to minimum deposits on the remainder.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Cash Balancing Control Settings`** — gates the whole subsystem; referenced on four articles here.
- **`Maintain Financed Balances` (Manual Posting Entry)** — the single-transaction resubmission path,
  and the manual-posting route into finance receivables. **High priority.**
- `Report Cash Drawer Balancing Totals` · `Report Cash Balancing Exceptions` ·
  `Bank Reconciliation Overview` · `Purge Cash Drawer Data` · `Petty Cash Disbursement` ·
  `Enter On Account Payment Type` · `Balancing Payment Type Totals`.

**Documented but ambiguous**
- **Whether `Post to Suspense` feeds run 1's suspended-postings queue.** The names align; nothing
  connects them.
- **What `Number of Tries` does when exhausted** — does the difference stand, or does the drawer lock?
- **Whether cash balancing produces GL postings**, and to which accounts. Batch 4 named accounts for
  card transactions; nothing here names any.
- **How long reconciled drawer data survives** before `Purge Cash Drawer Data` removes it.
- **What "successfully funded" means operationally** on a rejected batch — the routine distinguishes
  funded from failed items but does not say how it knows.
- **`Merchant Number`** on the resubmit screen — the same concept as batch 7's merchant ID for returns?
- Whether the two-step response file updates the GL or only history records.
- **Whether the COD `Previous Balance` includes disputed or charged-off amounts.**

**Inferences (not in section B)**
- `Post to Suspense` is plausibly the cash feeder for run 1's suspended postings; the naming is
  suggestive but nothing states it.
- `Merchant Number` is presumably the same merchant ID batch 7's `Use Original Merchant ID for Returns`
  selects; not stated.
- The bank-total caveat implies most users cannot use drawer-level reconciliation; the article states
  the condition, not its prevalence.

---

## I. Unknown unknowns

- **An untransmitted batch accumulating all day**, with transmission timing set by contract.
- **A third settlement model** — send today, response file tomorrow, finalise then.
- **A rejected-batch routine that refuses to open when nothing failed.**
- **FTP providers permitting only resubmission**, with funding confirmed elsewhere.
- **Staff File overriding Staff Type** — the first explicit user-beats-group precedence in the audit.
- **Blind cash balancing with a bounded number of attempts.**
- **`Post to Suspense`** as the disposition for unbalanced money.
- **A manager screen showing both counted and system totals**, controlled only by menu security.
- **Adjustments posting on the drawer's date, not today's.**
- **Two independent over/short figures** for the same cash.
- **Bank reconciliation that only works with one deposit slip per drawer.**
- **A COD figure including the customer's previous AR balance** and a deposit hold-back percent.
- **Payment at the door applied to delivered goods first, then to deposits on the remainder.**
- **STORIS advising manual COD override** when multiple fulfillments lack holdback.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Untransmitted batch | Accumulating finance receivable transactions awaiting daily transmission |
| Two-step settlement | Provider model returning a response file the next day; requires Finalize |
| Blind Cash Balancing | Cashier enters counted totals without seeing system expectations |
| Number of Tries | Bounded attempts at a blind count |
| Post to Suspense | Disposition for unbalanced cash |
| Over/Short | Cashier-vs-system, and separately system-vs-bank |
| Anticipated COD | Amount to collect at the door: delivered value plus deposits on the remainder |
| Deposit hold-back percent | AR Control Settings value feeding the COD calculation |
| Deliver None / Deliver All | COD worksheet controls for what-if delivery scenarios |

---

## Contract adjudication — batch 10

| Contract | Verdict | Basis |
|---|---|---|
| **W-012** | **CONFIRMED** | Three settlement timings; manager adjustments post on the drawer's date (F96, F97, F100) |
| **W-050** | **CONFIRMED, with a documented weakness** | Manager approval controlled by menu security only; Staff File overrides Staff Type (F98, F100) |
| **W-052 / W-053** | **relevant, no accounts named** | Cash balancing and settlement produce no stated GL postings |
| **W-055 / W-056** | **relevant** | COD collection depends on minimum deposits for undelivered merchandise (F102) |

---

## Next — batch 11: salesperson, Up System, assignments and commissions
