# Run 01 — Accounting — Batch 7: Installment Receivables (closed-end in-house credit)

11 articles. First batch of the consumer-credit block. This is a whole subsystem the run card's
contract list does not cover — nearly everything here is `NEW`.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 61 | Installment Receivables Overview | /articles/15202279027988 | EXTRACTED |
| 62 | Manage and Adjust Installment Contracts | /articles/15202311165076 | EXTRACTED |
| 63 | Review Contract Details | /articles/15202279028756 | EXTRACTED |
| 64 | Update Contract Status | /articles/15202279286676 | EXTRACTED |
| 65 | Adjust Contract Balance | /articles/15202311164692 | EXTRACTED |
| 66 | Defer Installment Payments | /articles/15202311166100 | EXTRACTED |
| 67 | Installment Worksheet | /articles/15202311188500 | EXTRACTED |
| 68 | Contract Amortization Schedule | /articles/15202310834196 | EXTRACTED — thin |
| 69 | View Contract Postings | /articles/15202311019284 | EXTRACTED — thin |
| 70 | Installment Receivables Payoff As-of Date | /articles/15202278680852 | EXTRACTED |
| 71 | Installment Activity Log | /articles/15202278680468 | EXTRACTED |

Newly discovered, queued: `Installment Receivables Control Settings`, `Installment Payment Plan
Settings`, `Extended Receivables Insurance Code Settings`, `Contract Balance Adjustment Settings`,
`Contract Classification Settings`, `Reason Code Settings`, `Metro 2 Code Settings`,
`Advanced Customer Settings` (Receivables tab), `Sales Tax Settings` (Installment tab),
`Merge/Refinance Contracts`, `View All Installment Activity for a Customer`,
`Report Installment Delinquency Statistics Summary`, `Report Installment Receivables Activity`,
`View a Customer's Receivables Activity Summary`, `Create a User/Group Actions - Receivables Security`.

---

## B. Wiring findings

### FINDING 98 — Installment is closed-end: everything is computed at write time
Trigger:    Writing an installment plan on an order
Invariant:  "An Installment Contract Receivable is a 'closed ended' receivable, since the total
            amount to be paid is determined at the time of the purchase. The total interest and
            insurance charges are calculated up front. Monthly installment payments due are
            calculated when the installment plan is written, and **do not change each month**."
Inputs:     principal · insurance · term → total interest
Payload:    the monthly payment "includes the principal, interest, document fees, and insurance"
Evidence:   Installment Receivables Overview, /articles/15202279027988
Maps to:    NEW — and it defines `W-064` (order balance due) for financed orders

### FINDING 99 — Long-term receivable cycles into open-item AR monthly
Trigger:    Monthly **cycling**
Producer:   long-term receivables
Consumers:  open item accounts receivable
Invariant:  "The total installment plan amount is posted to long-term receivables. On a monthly
            basis, during cycling, the monthly payment amount is **moved from long-term receivables
            to open item accounts receivables**."
Evidence:   Installment Receivables Overview, /articles/15202279027988
Maps to:    NEW — **a second AR ledger we had not modelled**

> This is structurally important. Financed customers have money in two places at once: a long-term
> balance and an open-item balance, joined by a monthly cycle event. Batch 3's `Maintain Customer
> Balances` key-off codes `L` (Long Term Revolving) and `I` (Long Term Installment) are the manual
> bridge between them. Any AR aging we build must know which ledger it is aging.

### FINDING 100 — Two interest methods, and they behave differently on early payoff
Trigger:    Contract write / payoff
Methods:
  - **Straight Line** — interest, insurance and principal identical each month.
    STORIS's worked example: $420 contract, $300 principal, 6 months, $70/month →
    $50 principal + $10 insurance + $10 interest each month.
    **Early payoff: "the customer pays only the remaining principal amount."**
  - **Rule of Seventy-Eights / Declining Balance** — "insurance and interest amounts are
    'front loaded'", recomputed each month from the payment amount over the **term remaining**.
    Worked example, same contract: month 1 = $34 principal, $18 interest, $18 insurance;
    month 2 (balance $350, principal $266, 5 months left) = $40 principal, $15 interest, $15 insurance.
    **Early payoff: "the customer pays the principal amount remaining, plus the insurance and
    interest amounts."**
Evidence:   Installment Receivables Overview, /articles/15202279027988
Maps to:    NEW — this is a `W-06x`-class "exactly one definition" value we did not list

> Two different payoff formulas living behind one screen. Rule-of-78s payoff is materially worse
> for the customer and is a regulated calculation in many states. If LA Mattress ever wrote
> Rule-of-78s contracts, migrated payoff quotes must reproduce it exactly, not approximate it.

### FINDING 101 — Contracts move backwards from history to active by three routes
Trigger:    Any of —
  1. **Manual reinstatement** via `Update Contract Status`
  2. **Customer merchandise return / contract cancellation** — automatic, via `Update Contract Status`
  3. **Misapplied/NSF** — automatic, via `Apply NSF and Correct Misapplied Payments`, "for misapplied
     or NSF payment that closed the contract"
Evidence:   Installment Receivables Overview, /articles/15202279027988
Maps to:    **W-035 — CONFIRMED (extends batch 5, Finding 71)**

> Confirms from the installment side what batch 5 found from the payments side: a closed contract
> is not terminal. Our contract state machine needs a documented resurrection path, or we will
> lose the ability to reproduce STORIS history.

### FINDING 102 — Contract cancellation by return requires strict one-to-one, with a documented workaround
Trigger:    Cancelling a financed contract via customer return
Invariant:  "A contract cancellation via customer return can only be completed on a **one to one
            basis**. That means that there can be **no partial shipments** for a completed order
            linked to a contract. There needs to be **one contract, one invoice**."
Partial case: "If a contract is linked to several partially completed orders, each credit is keyed
            off by the system to the contract when the return is released. If the return is applied
            to the contract in error, you can enter a **reverse key-off** to move the return amount
            in open item."
Workaround: "If you need to cancel the contract and there are multiple returns required due to
            partial completion, process the returns **on account for the total**. Then key-off the
            full on-account amount to pay off the contract via `Maintain Customer Balances`."
Evidence:   Installment Receivables Overview, /articles/15202279027988
Maps to:    **W-035 — CONTRADICTED** (a return does *not* cleanly reverse everything the sale touched
            when the order was partially fulfilled), **W-005/W-020 — adjacent**

> This is a genuine structural limitation, not a policy. Financing binds to an **invoice**, and
> partial fulfilment breaks the binding. For a mattress retailer with split deliveries this is a
> live operational issue and something we should design out rather than reproduce.

### FINDING 103 — Contract status is a seven-value machine
Enumeration: **Pending · Pending – Deleted · Active · Cancelled · Closed – Rewritten ·
            Closed – Paid · Closed**
Transitions documented: cancel active · delete pending · reinstate (all via `Update Contract Status`,
            which captures **Status, Reason, Comments**)
Evidence:   Review Contract Details, /articles/15202279028756 · Update Contract Status, /articles/15202279286676
Maps to:    NEW

> Note `Closed – Rewritten` — the terminal state of a merged or refinanced contract. Refinancing is
> a first-class operation here (`Merge/Refinance Contracts`), not an ad-hoc adjustment.

### FINDING 104 — Cancelling a contract can drive the credit bureau file, manually or automatically
Trigger:    Contract cancellation
Consumers:  the **Metro 2** file
Manual:     "access the `Metro 2 Code Settings` via the Action button on the Receivables tab in the
            `Advanced Customer Settings` and assign an account status to the customer"
Automatic:  "go to `Reason Code Settings` and create reasons with an **associated Account Status**"
Evidence:   Installment Receivables Overview, /articles/15202279027988
Maps to:    NEW — **a reason code that carries regulatory meaning**

> A reason code here is not a note; it drives what gets reported to credit bureaus. Reason-code
> design in our system must distinguish "operational reason" from "reportable account status".

### FINDING 105 — Contract balance adjustments are allocated across named buckets, floored by the un-cycled portion
Trigger:    `Adjust Contract Balance`
Allocations: **Principal · Interest · Insurance**, plus any active custom types from
            `Contract Balance Adjustment Settings`
Invariant:  `$ Long Term` column shows "the unpaid portion of non-filing fees and the portions of
            Principal, Interest, and Insurance that have **not yet cycled**" — and
            "**A negative adjustment amount cannot exceed the value of this column.**"
Consumers:  `View Contract Postings`
GL:         Actions → `G/L Account Maintenance` → `GL Distribution Screen`
Evidence:   Adjust Contract Balance, /articles/15202311164692
Maps to:    **W-036 — CONTRADICTED (fifth sighting of hand-edited GL)**

> The floor rule is the interesting part: you can only claw back what has not yet cycled into
> open-item AR. That is a real invariant tying the two ledgers together.

### FINDING 106 — Deferment recalculates the aging buckets live and charges a fee
Trigger:    `Defer Installment Payments`
Consumers:  "This program will calculate and post the **deferment fees** and extend **all** payments
            due, including current payments and future payments due."
Behaviour:  "As rows in the grid are checked/unchecked, the Deferred Payment and Deferment Fee will
            calculate and display. The **aging buckets in the Past Due section of the screen will
            recalculate**"
Options:    `Apply to Contract` (capitalise the fee) · Comments · G/L Account Maintenance
Accounts:   `Installment Deferment Fees` (batch 1, AR tab)
Evidence:   Defer Installment Payments, /articles/15202311166100
Maps to:    NEW

### FINDING 107 — Payoff quoting is date-effective and can be forward-dated by setting
Trigger:    Selecting Cancel on `Update Contract Status`
Producer:   `Installment Receivables Payoff As-of Date`
Config:     `PAYOFF/CANCELLATION DATE - Allow Future Dates` in `Installment Receivables Control Settings`
Payload:    As-of Date · Auto-Pay Override Contract · Contract · **Payoff Amount** ·
            **Number of Late Fees Accessed**
Evidence:   Installment Receivables Payoff As-of Date, /articles/15202278680852
Maps to:    NEW — `W-064` for financed balances is **date-parameterised**, not a stored number

### FINDING 108 — Same-as-cash revocation is enforced with a credential challenge at payoff
Trigger:    Payoff where `Revoke Same as Cash After ___ Late Fees` (Installment Payment Plan Settings)
            is enabled and the late-fee count is exceeded
Consumers:  "a warning message is displayed and **valid credentials must be entered to continue**"
Gate:       `Override Revoke Same as Cash Terms` in `Create a User/Group Actions - Receivables Security`;
            "If it is not enabled, **managers credentials are needed** to continue"
Evidence:   Installment Receivables Payoff As-of Date, /articles/15202278680852
Maps to:    **W-051 — CONFIRMED** — a real supervisor-override ceremony with a captured trigger

> Contrast with batch 5, Finding 75 (the cashier prompt that authenticates nothing) and batch 4,
> Finding 61 (bulk hold removal with no capture). STORIS's override discipline is inconsistent:
> rigorous where consumer-credit regulation bites, absent elsewhere.

### FINDING 109 — The contract management screen is a permission-gated action hub with mutual exclusions
Trigger:    `Manage and Adjust Installment Contracts`
Header exposes a live credit position: Credit Limit $ · Open Receivables $ ·
  **Potential Receivables $** · Available Credit $ · Installment (pending) $ ·
  Revolving (pending) + $ · Unpaid Open Orders + $
Action buttons: Review Contract Details · Update Contract Status · Installment Worksheet ·
  Adjust Payment Terms · Defer Installment Payments · Adjust Contract Balance · Forgive Late Fees ·
  Enter a Sales Order · Enter a Customer Payment(/Refund/Gift Certificate) ·
  Request Credit Information · Credit Request Review
Gates (all in `Create a User/Group Actions - Receivables Security`):
  `Installment - Manage and Adjust - Enter a Sales Order` · `… - Take a Payment` ·
  `… - Request Credit Information` · `… - Credit Request Review`
Mutual exclusions: `Request Credit Information` and `Credit Request Review` are never both active;
  `Credit Request Review` requires an open credit request on file
Cash-drawer rule: the payment button "is not active if your system is set up to balance by cash
  drawer via `Cash Balancing Control Settings` and you did not log in with a cash drawer"
Closed account: "This is the **only active button** if the customer's account is closed
  (charged off, for example)" — i.e. take-a-payment survives charge-off
Evidence:   Manage and Adjust Installment Contracts, /articles/15202311165076
Maps to:    **W-050 — refines it** (fine-grained here), **W-060 — adjacent** (available credit is a
            derived value with a documented composition)

> `Available Credit $` is computed from at least six components including *pending* installment,
> *pending* revolving and *unpaid open orders*. That is an availability-to-promise for credit, and
> it is exactly the kind of value `W-060` says must have one definition. Ours will need the same
> composition or our credit decisions will differ from history.

### FINDING 110 — The installment worksheet is where financing is attached to an order
Trigger:    Setting up installment financing on an order
Payload:    Customer · Credit Remarks · Order · **Merge Contracts** · Notes ·
            CONTRACT: Installment Plan · Written · **Fixed Activation** · Principal ·
            **Previous Payoff** · Miscellaneous · Interest · Insurance · TOTAL · Due Day ·
            Term Months · PAYMENT · **APR**
Evidence:   Installment Worksheet, /articles/15202311188500
Maps to:    NEW — `Previous Payoff` on the worksheet is the refinance mechanism in situ

### FINDING 111 — Contract changes are logged to a dedicated activity file with manual comments
Trigger:    Changes to customer installment records
Producer:   `Installment Activity Log` — "an internal file you can use to track changes to customer
            installment records. The file also includes comments you entered manually via the
            Update Comments option on this screen."
Evidence:   Installment Activity Log, /articles/15202278680468
Maps to:    **W-053 — partially CONFIRMED** (an audit log exists for this master data; before/after
            values are not stated)

---

## C. Screen and field inventory

**Manage and Adjust Installment Contracts** — Customer · Home/Cell/Work/Ext · Email · Store ·
Credit Limit $ · Open Receivables $ · Potential Receivables $ · Available Credit $ ·
Installment (pending) $ · Revolving (pending) + $ · Unpaid Open Orders + $ · Grid · Actions ·
eleven action buttons (see Finding 109).

**Review Contract Details** — Contract · Customer · Co-applicant · **Co-signer** · Status ·
Written · Activated · Notes · Terms · Months · **Months No Interest** · Payments of $ ·
Final Payment is · Principal · Interest · Total Contract · Remaining Balance · Postings ( ) ·
Current Due · Total Due · Next Due · **Payoff Valid** · **Same as Cash** · Previous and Next · Actions.

**Update Contract Status** — Contract · Status · Reason · Comments · Actions (G/L Account Maintenance).

**Adjust Contract Balance** — Contract · Comments · Current Balance · Adjustment of · New Balance ·
grid columns: Allocations · $ Long Term · Adjustment · Actions (G/L Account Maintenance).

**Defer Installment Payments** — Current Due · Past Due (aging buckets) · grid ($ Open Due) ·
Deferred Payments · Deferment Fee · Apply to Contract · Comments · Actions.

**Installment Worksheet** — Customer · Credit Remarks · Order · Merge Contracts · Notes ·
Installment Plan · Written · Fixed Activation · Principal · Previous Payoff · Miscellaneous ·
Interest · Insurance · TOTAL · Due Day · Term Months · PAYMENT · APR · Actions.

**Installment Receivables Payoff As-of Date** — As-of Date · Auto-Pay Override Contract · Contract ·
Payoff Amount · Number of Late Fees Accessed.

**Installment Activity Log** — Customer Code · Date Code · Starting Date · Ending Date ·
Update Comments · Comments · Send Output to · Export Path · Actions (Output Settings, Print Comments).

**Contract Amortization Schedule** — one row per monthly payment for the full term, each with a
detailed breakdown.

**View Contract Postings** — grid with a grand-total line.

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Advanced Receivables add-on module | General System Control Settings | **Activates both Installment and Revolving Receivables** |
| Installment Receivables Control Settings | own file | System-wide installment preferences |
| PAYOFF/CANCELLATION DATE - Allow Future Dates | Installment Receivables Control Settings | Permits forward-dated payoff quotes |
| Installment Payment Plan Settings | own file | The plans offered; holds `Revoke Same as Cash After ___ Late Fees` |
| Sales Tax Settings → Installment tab | Sales Tax Settings | Fee, late charge and interest settings **by jurisdiction** |
| Reason Code Settings | own file | Reason usage codes; reasons may carry a Metro 2 **Account Status** |
| Extended Receivables Insurance Code Settings | own file | Insurance plans |
| Contract Balance Adjustment Settings | own file | Custom adjustment allocation types beyond Principal/Interest/Insurance |
| Contract Classification Settings | own file | Contract classification codes |
| Metro 2 Code Settings | via Advanced Customer Settings → Receivables tab | Per-customer credit-bureau account status |

---

## E. Security permissions catalog (additions)

| Permission | System | Gates |
|---|---|---|
| Installment - Manage and Adjust - Enter a Sales Order | Create a User/Group Actions - Receivables Security | Sales order button with no contract selected |
| Installment - Manage and Adjust - Take a Payment | same | Payment button with no contract selected |
| Installment - Manage and Adjust - Request Credit Information | same | Credit application maintenance |
| Installment - Manage and Adjust - Credit Request Review | same | Credit request review |
| Override Revoke Same as Cash Terms | same | Proceeding past a revoked same-as-cash payoff; else manager credentials |

---

## F. State machines and enumerations

**Contract status** — Pending · Pending – Deleted · Active · Cancelled · Closed – Rewritten ·
Closed – Paid · Closed. Reverse transitions (history → active) via manual reinstatement,
return/cancellation, or misapplied/NSF reversal.

**Interest calculation methods** — Straight Line · Rule of Seventy-Eights / Declining Balance.

**Adjustment allocations** — Principal · Interest · Insurance · [custom types].

**Ledgers** — long-term receivables ⇄ open-item accounts receivable, joined by monthly **cycling**;
manual bridges are key-off codes `L` (Long Term Revolving) and `I` (Long Term Installment).

**Monthly payment composition** — principal + interest + document fees + insurance.

---

## G. Sequencing rules (additions)

1. `Advanced Receivables` module must be active before any installment or revolving processing.
2. Contract is written → activated (`Fixed Activation` available) → cycles monthly → closed.
3. Cycling moves one month's payment from long-term to open-item AR.
4. Negative balance adjustments cannot exceed the un-cycled (`$ Long Term`) portion.
5. Contract cancellation by return requires exactly one contract to one invoice; otherwise process
   returns on account and key off the total.
6. Payoff at cancellation is quoted as of a date; future dates require a control setting.
7. Same-as-cash revocation requires an explicit permission or manager credentials to bypass.
8. Metro 2 account status is set either per-customer manually or via reason codes automatically.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **`Merge/Refinance Contracts`** is referenced from three screens and **has no article of its own**
  that I have found. It produces the `Closed – Rewritten` status and is the mechanism behind
  `Previous Payoff` on the worksheet. Material gap — refinancing changes the interest basis.
- **`Adjust Payment Terms`** — an action button on two screens; article exists in the section
  (page 1) and is queued, but its interaction with a closed-end contract is not obvious.
- **Cycling** is named repeatedly and never defined as a process. What triggers it, whether it is
  per-customer or global, and what it posts to the GL are all unstated. **High priority.**
- **`Document fees`** appear in the payment composition and **`non-filing fees`** in the long-term
  column; neither is defined anywhere in this batch.
- **`Months No Interest`, `Payoff Valid`, `Fixed Activation`, `Auto-Pay Override Contract`** —
  named, undescribed.
- **`Potential Receivables $`** vs `Open Receivables $` vs `Available Credit $` — the arithmetic
  between the seven header values is not given, only the field names.
- **APR** is a field on the worksheet; whether it is entered or derived from the plan is unstated.
- **Contract Amortization Schedule** and **View Contract Postings** articles are one line each —
  the grid columns are undocumented.
- **Co-signer** appears on the contract but the co-applicant/co-signer distinction is undefined.

**3. Inferences (not quotable, kept out of section B)**
- Cycling is almost certainly a month-end or statement-cycle batch tied to the customer's
  `last cycle date` from batch 5, Finding 73 — the backdating floor. The two articles never connect.
- `Closed – Rewritten` is presumably what a merge/refinance leaves behind on the source contracts.
- Because interest is computed up front, a Straight Line early payoff forgives unearned interest
  and insurance automatically; the docs state the outcome but not the accounting entry.

---

## I. Unknown unknowns (additions)

- **Rule of 78s** as a supported, regulated interest method.
- **Long-term vs open-item as two coexisting AR ledgers** with a monthly cycle between them.
- **Merge / refinance** of consumer contracts as a first-class operation.
- **Co-signer** as a distinct party from co-applicant.
- **Document fees** and **non-filing fees** as contract components.
- **Contract classification codes** as a master file.
- **Custom balance-adjustment allocation types** beyond principal/interest/insurance.
- **Deferment** with a computed fee that can be capitalised onto the contract.
- **Jurisdictional fee/late-charge/interest settings** on the Sales Tax file's Installment tab.
- **Metro 2 account status driven by reason codes.**
- **Credit position header** (limit, open, potential, available, pending installment, pending
  revolving, unpaid open orders) surfaced at the point of service.
- **Cash-drawer login as a precondition** for taking a payment.
- **Take-a-payment surviving account charge-off** as the sole permitted action.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Installment contract | Closed-end consumer credit; all interest and insurance computed at write time |
| Cycling | The monthly event moving one payment from long-term receivables into open-item AR |
| Long-term receivables | The un-cycled portion of a financed balance |
| Rule of Seventy-Eights | Front-loaded interest/insurance method; early payoff still owes interest and insurance |
| Straight Line | Level allocation method; early payoff owes remaining principal only |
| Closed – Rewritten | Terminal status of a contract consumed by a merge or refinance |
| Pending – Deleted | Terminal status of a pending contract that was deleted rather than activated |
| $ Long Term (column) | Un-cycled portion of an allocation; the floor on negative adjustments |
| Deferment fee | Charge for extending payments due; optionally capitalised to the contract |
| Same as Cash | Promotional no-interest term, revocable by late-fee count with a credential challenge |
| Payoff As-of Date | The date parameterising a payoff quote |
| Potential Receivables | Credit-position component including pending contracts and unpaid open orders |
| Non-filing fee | Undefined contract fee appearing in the long-term balance |
| Metro 2 | Credit bureau reporting format; account status set per customer or via reason code |
| Reverse key-off | Undoing a system key-off to move a return amount back into open item |
