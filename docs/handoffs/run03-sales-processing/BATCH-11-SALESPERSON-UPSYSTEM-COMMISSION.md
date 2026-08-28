# Run 03 — Sales Processing — Batch 11: Up System, Assignments and Commission

**Status: complete.** 9 articles. Findings 106–115.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Up System Control Settings** | /articles/15203331137300 | EXTRACTED |
| 2 | **Action Codes** | /articles/15203301218196 | EXTRACTED |
| 3 | **Editing Assignments in the Up System** | /articles/15203331133588 | EXTRACTED |
| 4 | Retaining a Salesperson's Rotation Spot | /articles/15203301365396 | EXTRACTED — thin |
| 5 | Assign Salesperson Screen | /articles/15203331128212 | EXTRACTED |
| 6 | Salesperson Status Screen | /articles/15203331294356 | EXTRACTED |
| 7 | **Enter a Commission Adjustment** | /articles/15201424798484 | EXTRACTED — **very rich** |
| 8 | Multiple Salesperson Commission Screen | /articles/15201408817300 | EXTRACTED |
| 9 | Commission/Spiff Updates Screen | /articles/15201407148692 | EXTRACTED — thin |

Discovered and queued: `Salesperson Settings` · **`Commission Settings`** · **`Report Sales
Commissions`** · `Payment Commission Adjustments Screen` · `Customized Sales Analysis` ·
`Report Written Sales by Salesperson` · `Report Written Sales Dollars` · `Up Board` ·
`Original Line Up Screen` · `Unstack or Available Screen` · `Maintain Archived UPs` ·
`Type of Activity Settings` · `Reason Entry` · `Refresh Button` · `EOD Close Button`.

---

## B. Wiring findings

### FINDING 106 — The Up System has its own end of day, separate from Generate Daily Reports
Invariant (verbatim): "**NOTE: EOD for Up System is separate from end-of-day run via `Generate Daily
            Reports`.**"
Fields:     **`Auto Archive Current Ups`** · **`System Day End Offset`** ·
            **`Reason Prior Day Activity Completed`**
Evidence:   Up System Control Settings, /articles/15203331137300
Maps to:    **NEW — and it is a genuine second clock**

> **STORIS runs two independent day boundaries.** Everything else in the audit — reservation, PO
> closure, replenishment, settlement, cash balancing, cart purging — hangs off `Generate Daily Reports`.
> **The Up System does not.** It has its own EOD with a configurable **day-end offset**, which exists
> because a showroom's trading day ends when the doors close, not at midnight or at the accounting cut.
>
> The consequence is that **traffic and close-ratio figures are measured over a different day than sales
> figures**. A sale written at 9:15pm may fall in one Up day and another accounting day. For a rebuild
> that is a deliberate design decision to reproduce or reject, not an accident.
>
> `Reason Prior Day Activity Completed` implies the system force-closes stale assignments with a stated
> reason — the salesperson who forgot to sign out.

### FINDING 107 — Action codes are a customer-defined state machine with four behavioural attributes
Fields (verbatim): **`Action Description` · `Action Type` · `Retain Up Order` · `Sale Made` ·
            `Traffic Type`**
Purpose:    "Each action code represents a type of action taken within the Up system, for example
            '**assisting a customer**' or '**gone to lunch**'."
Type constraint (verbatim): "**you can change action codes only to a code with the same action type. For
            example, if the current action out code has an action type of 'With Customer', you cannot
            change it to an action code with an action type of 'Not With Customer'.**"
Rotation:   "**To retain a salesperson's position in the Up rotation when he/she returns to `Available`
            status from `Assigned` status, use the `Retain Up Order` field on the Action Codes
            screen.**"
Permission: "to edit Up System action codes, you must have clearance via the **`Up System
            Administrator`** field on the Security tab in the User file."
Evidence:   Action Codes, /articles/15203301218196;
            Retaining a Salesperson's Rotation Spot, /articles/15203301365396
Maps to:    **NEW — the same shape as run 2's PO types**

> **Action codes are customer-defined policy objects**, exactly like run 2's purchase order types
> (run 2 F83): STORIS supplies the framework and the business supplies the codes, each carrying four
> switches. The important one is **`Retain Up Order`** — it decides whether a salesperson who steps away
> keeps their place in the queue. **That single flag is the fairness policy of the sales floor**, and it
> is set per action code, so lunch and a bathroom break can be treated differently from an assignment.
>
> **`Sale Made`** and **`Traffic Type`** make the code the source of the close-ratio statistics, and
> **`Action Type`** creates two families — "With Customer" and "Not With Customer" — between which codes
> cannot be reclassified. **The whole Up System's behaviour is local configuration**, and extracting the
> live action code table is a cutover priority on the same level as PO types.

### FINDING 108 — Assignment data is editable only on the current day, and only within its action type
Invariant (verbatim): "**You can edit assignment data only from the current day. Once you close a day,
            you cannot edit its assignment data. If you must make changes to assignment data from a
            previous day, delete the data via the `Remove` button and re-enter it.**"
Invariant:  "**you can change action codes only to a code with the same action type**"
Removal:    "**You can remove only completed assignments.**"
Grid fields: customer description · order number · date · **`start time` · `action in` · `end time` ·
            `action completed`**
Permission: "**Only Up administrators can access this screen.**… clearance via the `Up System` settings
            on the Security tab of the User file."
Evidence:   Editing Assignments in the Up System, /articles/15203331133588
Maps to:    **W-012 — relevant; and it mirrors the audit's correction pattern**

> **Delete-and-re-enter rather than edit** — the same correction pattern found in AP (run 1), receiving
> (run 2), and FR payments (batch 5). STORIS consistently refuses in-place correction of anything with
> a temporal record, and the Up System is no exception.
>
> But note the asymmetry: **the day close makes the record immutable, yet deletion and re-entry are
> still permitted.** So the control is not really immutability — it is forcing an administrator to
> destroy and recreate rather than amend, which leaves a different trace. Whether that trace is audited
> is not stated.

### FINDING 109 — Commission adjustment is a full offsetting-records engine with documented rounding
Invariant (verbatim): "The program creates **offsetting commission records using the date of the
            adjustment**. **positive adjustments for new commissions and negative adjustments to back
            out existing commissions.**"
Basis (verbatim): "**Any commission information displayed reflects the state of the commissions as of the
            order completion date, net of any prior adjustments.**"
Written vs delivered (verbatim): "**Delivered Business (BTA) always updates to reflect these
            adjustments.** Completed sales update to reflect the adjusted commissions so that any future
            refunds create the appropriate commission updates. **Written Business updates optionally
            based on your setting at the `Adjustments Update Written Business` field in the Point of Sale
            Control Settings.**"
Downstream (verbatim, when written business is included): `Report Written Sales by Salesperson` ·
            `Report Written Sales Dollars` · `Customized Sales Analysis` · **`Data Warehouse`**
Rounding (verbatim): "**The program distributes rounding errors in .01% increments. For positive
            rounding errors, the distribution begins at the beginning of the list. For negative rounding
            errors, the distribution begins at the end of the list.**"
Delivery charges: "**Any commissions on delivery charges recalculate automatically any time you change
            the commission split for a completed document.**"
Purge limit: "**You cannot make commission adjustments to documents whose original commission records
            have been purged.**"
Evidence:   Enter a Commission Adjustment, /articles/15201424798484
Maps to:    **W-012 — CONFIRMED; W-061 — relevant**

> The most carefully specified routine in this run. Three things stand out.
>
> **`BTA` reappears** — run 2 Finding 49 found it as the file behind written-business sales rates in
> replenishment. Here it is named as **Delivered Business**, which retrospectively clarifies run 2: the
> replenishment sales-rate choice between "written" and "delivered" is a choice between two files, and
> `BTA` is the delivered one. **A finding from run 2 is corrected by a sales article.**
>
> **Written business updates optionally.** So a commission correction can leave written-business reports
> — and the Data Warehouse — disagreeing with delivered business, by configuration. That is a reporting
> divergence someone chose.
>
> **The rounding rule is genuinely thoughtful**: positive errors distributed from the top of the list,
> negative from the bottom, in 0.01% steps. It means the same salesperson does not always absorb the
> rounding. Worth copying verbatim.

### FINDING 110 — Changing a salesperson on one invoice propagates forward but not backward
Invariant (verbatim): "**If a sales order is invoiced multiple times and a change is made to the
            salesperson on the original completion, that change to the salesperson is reflected on
            subsequent completions. For example, sales order is invoiced three times as `455`, `455A`,
            and `455B` and invoice `455A` has its salesperson changed, that change is reflected on `455A`
            and `455B`, but not on `455`.**"
Evidence:   Enter a Commission Adjustment, /articles/15201424798484
Maps to:    **NEW — and it uses batch 1's back-order suffixes**

> **Forward-only propagation across an invoice family**, worked through with the alphabetic suffixes
> batch 1 Finding 9 found (the 52-back-order cap). Changing the salesperson on the second invoice
> changes the third but leaves the first alone.
>
> That is defensible — you cannot rewrite a settled past — but it means **a single order can pay
> commission to two different people across its invoices**, and reconciling "who sold this order" is
> genuinely ambiguous. For a rebuild, the question is whether commission attaches to the order or to
> the invoice; STORIS answers *the invoice*, and only prospectively.

### FINDING 111 — Commission splits default to even, and can be preset per customer
Invariant (verbatim): "**If you have indicated more than one salesperson on the order and did not specify
            commission percentages via `Customer Settings`, the system automatically splits the
            commission percentages evenly.**"
Fields:     `Salesperson Code` · Name · **`Commission Percent`** · grid; salespeople and codes can be
            added on this screen.
Related:    `Commission Category` at **order level** *(batch 1)*, **line level** *(batch 2)* and via
            `Commission/Spiff Updates Screen`; `Commissionable` flag per line *(batch 2)*.
Evidence:   Multiple Salesperson Commission Screen, /articles/15201408817300;
            Commission/Spiff Updates Screen, /articles/15201407148692
Maps to:    **W-061 — CONFIRMED, extended**

> **Commission percentages can be preset on the customer record** — so a house account or a designer
> relationship can carry a standing split that overrides the even default. That is the fourth place
> commission is configured, after the order header, the line, and the `Price/Spiff/Commission Table`
> (batch 2 Finding 24).
>
> Assembled, commission on one line depends on: the customer's preset split · the order's commission
> category · the line's commission category and `Commissionable` flag · the spiff amount · the
> Price/Spiff/Commission Table · and the costing method chosen for commissions in Costing Control
> Settings (run 2 Finding 36). **Six inputs, in six different places.**

### FINDING 112 — Up System statistics are configurable, and two switches change what "traffic" means
Performance report (verbatim): "specify the product categories you want to include in the **Up System
            Sales Performance Report**. You can define **up to four product categories** — each displays
            as a column of data. **Any product categories not specified appear under the final column
            headed 'Other'.**"
Switches:   **`Include Currently Assigned`** · **`Include Non-Traffic In Close Ratio`** ·
            **`Include Non-Traffic In Customers Seen`** · **`Change Available Order`** ·
            **`Include Sale and Return Portion of an Exchange`** · **`Require Second Login`**
Status screen: Status *(available / unavailable)* · **`Time in`** · **`Length of time in Available
            list`** · **`Total Number of Customers Seen`** · **`Total Number of Sales`** ·
            **`Closing Ratio`**
Evidence:   Up System Control Settings, /articles/15203331137300;
            Salesperson Status Screen, /articles/15203331294356
Maps to:    **NEW**

> **Close ratio is a configured number, not a measured one.** Two separate switches decide whether
> non-traffic assignments count in the denominator and in "customers seen", and a third decides whether
> both halves of an exchange count. **Turn them differently and the same salesperson's close ratio
> changes** without their behaviour changing at all.
>
> That matters because close ratio is almost certainly used for scheduling, coaching and possibly pay.
> Any rebuild should make the definition explicit and versioned rather than inheriting a switch.
> **`Require Second Login`** is a control worth noting separately: it forces re-authentication into the
> Up board, presumably to stop one salesperson signing in as another.

### FINDING 113 — Assignment requires a reason and a customer description, by design
Invariant (verbatim): "The `Assign Salesperson` screen appears in which **you must specify a reason for
            assignment and a description of the customer. The description helps distinguish the customer
            from other customers and avoid confusion amongst salespersons.**"
Flow:       Available pane → Assign → **Assigned pane**.
Fields:     **`Reason for Assignment`** · **`Customer Description`**
Evidence:   Assign Salesperson Screen, /articles/15203331128212
Maps to:    **NEW**

> **The customer on the Up board is a free-text description, not a customer record** — "couple looking
> at sectionals" rather than an account number. That is correct for a showroom floor where the prospect
> has not identified themselves, and it explains why `Editing Assignments` shows "customer description"
> alongside an optional order number.
>
> It also means **the Up System's traffic data is not linkable to the customer master** unless a sale
> results. Batch 12's sales-lead machinery is presumably where that gap is closed.

### FINDING 114 — Commission adjustments ignore the restrictions that govern normal commission entry
Invariant (verbatim): "**Commission restrictions specified in the Point of Sale Control Settings do not
            affect this routine.**"
Invariant:  "**NOTE: This routine does not apply to service orders.**"
Document types adjustable (verbatim): **`Sale` · `Return` · `Exchange Sale` · `Exchange Return` ·
            `Dollar Adjustment`**
Evidence:   Enter a Commission Adjustment, /articles/15201424798484
Maps to:    **W-050 — a documented control bypass**

> **A routine that explicitly exempts itself from the system's commission restrictions.** Whatever
> limits POS Control Settings places on commission entry — splits, percentages, eligibility — they do
> not apply here. The article states it as a feature, and operationally it is one: corrections have to
> be able to reach states normal entry cannot.
>
> But it is the audit's clearest single control bypass since run 2's eleven Regional Processing
> exemptions, and **no permission is named for the routine at all**. Given it moves money owed to
> staff, that is a gap worth raising. The five adjustable document types confirm that **exchanges carry
> commission on both halves separately** — consistent with batch 7's two-salesperson exchange model.

### FINDING 115 — The Up System is administered through a security tab, not the usual permission files
Permissions (verbatim): "**To access the STORIS Up System or to perform Up System administration duties,
            you must have clearance via the `Up System` settings on the Security tab of the User
            file.**" · "**you must have clearance via the `Up System Administrator` field on the Security
            tab in the User file.**"
Evidence:   Editing Assignments in the Up System, /articles/15203331133588;
            Action Codes, /articles/15203301218196
Maps to:    **W-050 — a sixteenth access-control mechanism**

> Every other permission in this run lives in **Sales Security**, **Receivables Security**, **Logistics
> Security**, **System Security**, **Extended Security**, or the Staff File/Staff Type pair. **The Up
> System uses a `Security` tab on the User file** — a seventh location.
>
> Run 1 counted twelve access-control mechanisms; run 2 added `Location Restrictions`, Regional
> Processing's transactional restrictions, and read-only routine twins, reaching fifteen. **This is the
> sixteenth.** The pattern run 1 called *inverted* holds: there is no single place to answer "what can
> this person do".

---

## C. Screen and field inventory

**Up System Control Settings** — *End of Day*: **`Auto Archive Current Ups`** ·
**`System Day End Offset`** · **`Reason Prior Day Activity Completed`**.
*Performance Report*: **`Include Currently Assigned`** · **`Include Non-Traffic In Close Ratio`** ·
up to **four `Product Category` columns** plus "Other".
*Up Board Configuration*: **`Include Non-Traffic In Customers Seen`** · **`Change Available Order`** ·
**`Include Sale and Return Portion of an Exchange`** · **`Require Second Login`**.

**Action Codes** — `Action Description` · **`Action Type`** · **`Retain Up Order`** · **`Sale Made`** ·
**`Traffic Type`** · Add Action · Update Action · Remove Action · Refresh · grid.

**Editing Assignments in the Up System** — *Sales Staff* icon strip · *Assignments* grid: customer
description · order number · date · **start time · action in · end time · action completed** ·
Edit · Remove.

**Assign Salesperson Screen** — **`Reason for Assignment`** · **`Customer Description`**.

**Salesperson Status Screen** — Status · **`Time in`** · **`Length of time in Available list`** ·
**`Total Number of Customers Seen`** · **`Total Number of Sales`** · **`Closing Ratio`**.

**Enter a Commission Adjustment** — `Completed Document` · Customer · **`Type`** *(Sale · Return ·
Exchange Sale · Exchange Return · Dollar Adjustment)* · Date · **`Total`** *(negative for returns)* ·
Salesperson · grid.

**Multiple Salesperson Commission Screen** — `Salesperson Code` · Name · **`Commission Percent`** · grid.

**Commission/Spiff Updates Screen** — **`Commission Category`** · **`Spiff Amount`**.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`System Day End Offset`** | Up System Control Settings | **The Up System's own day boundary** |
| `Auto Archive Current Ups` · `Reason Prior Day Activity Completed` | Up System Control Settings | Day-close behaviour for stale assignments |
| **`Include Non-Traffic In Close Ratio`** · **`Include Non-Traffic In Customers Seen`** | Up System Control Settings | **What close ratio measures** |
| `Include Currently Assigned` · `Include Sale and Return Portion of an Exchange` | Up System Control Settings | Performance report composition |
| **`Require Second Login`** | Up System Control Settings | Re-authentication into the Up board |
| `Change Available Order` | Up System Control Settings | Whether the queue order can be manipulated |
| four `Product Category` columns | Up System Control Settings | Performance report breakdown; rest fall into "Other" |
| **`Retain Up Order`** | **Action Codes** | Whether stepping away costs a salesperson their queue place |
| `Sale Made` · `Traffic Type` · `Action Type` | Action Codes | Statistics classification and reclassification limits |
| **`Adjustments Update Written Business`** | POS Control Settings | Whether commission adjustments reach written-business reports and the Data Warehouse |
| commission percentages | **Customer Settings** | Preset split overriding the even default |
| commission restrictions | POS Control Settings | **Explicitly do not apply to `Enter a Commission Adjustment`** |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| **`Up System`** | **Security tab of the User file** | Accessing the Up System at all |
| **`Up System Administrator`** | **Security tab of the User file** | Editing action codes and assignments |
| *(none named)* | — | **`Enter a Commission Adjustment` names no permission** |

---

## F. State machines and enumerations

**Salesperson states** — **Available** ⇄ **Assigned**; `Retain Up Order` decides whether returning to
Available preserves queue position.
**Action types (2 families)** — **With Customer** · **Not With Customer**; codes cannot cross families.
**Adjustable document types (5)** — Sale · Return · Exchange Sale · Exchange Return · Dollar Adjustment.
**Commission record types** — positive *(new)* · negative *(backing out)*, both dated to the adjustment.
**Business measures** — **Written Business** *(optional update)* · **Delivered Business (`BTA`)**
*(always updates)*.
**Rounding distribution** — 0.01% increments; positive from the top of the list, negative from the
bottom.
**Invoice family propagation** — salesperson changes flow **forward only** (455A → 455B, not → 455).
**Day boundaries (2)** — `Generate Daily Reports` · **Up System EOD with its own offset**.
**Commission inputs (6)** — customer preset split · order commission category · line commission
category · `Commissionable` flag · spiff amount · Price/Spiff/Commission Table *(plus the costing
method from run 2)*.

---

## G. Sequencing rules

1. The Up System closes its day on its own offset, independently of Generate Daily Reports.
2. Assignment requires a reason and a customer description before the salesperson moves to Assigned.
3. Assignment data is editable only on the current day; prior days require delete-and-re-enter.
4. Action codes may only be changed to codes of the same action type.
5. Commission adjustments create offsetting positive and negative records dated to the adjustment.
6. Delivered business (`BTA`) always updates; written business updates only if the setting is on.
7. Delivery-charge commissions recalculate whenever a split changes.
8. Salesperson changes propagate to subsequent invoices in the family, never to earlier ones.
9. Adjustments are impossible once the original commission records have been purged.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Commission Settings`** and **`Report Sales Commissions`** — the definition and the output of the
  whole commission model. Neither read.
- **`Salesperson Settings`** — referenced from batch 7 and here; the salesperson master.
- `Payment Commission Adjustments Screen` — a second commission adjustment path, on payments.
- The **Up Board** itself · `Original Line Up Screen` · `Unstack or Available Screen` ·
  `Maintain Archived UPs` · `Type of Activity Settings`.
- `Customized Sales Analysis` — a reporting layer named alongside the Data Warehouse.

**Documented but ambiguous**
- **What permission governs `Enter a Commission Adjustment`.** None is named, and the routine bypasses
  commission restrictions and moves staff pay.
- **When commission records are purged**, and by what. The routine's hard limit depends on it.
- **`Traffic Type`** — an action code attribute driving statistics; values not given.
- **`Change Available Order`** — permits manipulating the queue, but by whom and how is unstated.
- **Whether delete-and-re-enter of assignment data is audited.**
- **What `Reason Prior Day Activity Completed` actually records** — presumably a forced close-out reason.
- **How the Up System's day offset interacts with the sale's written date** for close-ratio attribution.
- **`Unstack`** — a named screen whose concept appears nowhere else.
- Whether the customer description on an Up assignment is ever reconciled to a customer record.

**Inferences (not in section B)**
- `BTA` is presumably "Business To Actual" or similar; run 2 and this batch both name it without
  expanding it. What is now established is that **`BTA` = delivered business**.
- Commission record purging presumably follows a retention setting like the others found; none is named.
- `Unstack` presumably returns a stacked (multiply-assigned) salesperson to the queue; not stated.

---

## I. Unknown unknowns

- **A second, independent end of day** with its own configurable offset.
- **Action codes as customer-defined policy objects** with four behavioural switches.
- **`Retain Up Order`** — the sales floor's fairness policy, set per action code.
- **Close ratio being a configured measure**, changed by two switches.
- **`Require Second Login`** into the Up board.
- **Assignment data immutable after day close, but still deletable.**
- **Offsetting commission records with a documented 0.01% rounding distribution rule**, directional by
  sign.
- **Written business updating optionally** while delivered business always does.
- **`BTA` identified as delivered business** — retrospectively clarifying a run-2 finding.
- **Salesperson changes propagating forward through an invoice family only.**
- **Commission splits presettable on the customer record.**
- **A commission routine that explicitly ignores the system's commission restrictions and names no
  permission.**
- **Up System permissions living on a `Security` tab of the User file** — a sixteenth access mechanism.
- **The Up board's customer being free text**, unlinked to the customer master.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Up System | Showroom traffic rotation and assignment system, with its own end of day |
| Action code | Customer-defined Up System state carrying Action Type, Retain Up Order, Sale Made, Traffic Type |
| Retain Up Order | Whether returning to Available preserves the salesperson's queue position |
| With Customer / Not With Customer | The two action type families; codes cannot cross between them |
| Close Ratio | Sales ÷ customers seen; **what counts is configurable** |
| BTA | Delivered Business file; always updated by commission adjustments |
| Written Business | Sales as written; updated by adjustments only if the setting is on |
| Commission Category | Classification at order and line level feeding the commission calculation |
| Spiff | Per-line incentive amount; for as-is pieces fixed at completion |
| Up System Administrator | Permission on the User file's Security tab |

---

## Contract adjudication — batch 11

| Contract | Verdict | Basis |
|---|---|---|
| **W-012** | **CONFIRMED, extended** | A second day boundary; adjustments dated to the adjustment, not the sale (F106, F109) |
| **W-050** | **CONFIRMED inverted, sixteenth mechanism** | Up System permissions on the User file Security tab; commission adjustment names no permission (F114, F115) |
| **W-061** | **CONFIRMED, extended** | Six commission inputs across six locations; written vs delivered divergence by setting (F109, F111) |
| **W-052 / W-053** | **not documented in this batch** | Commission records are described without GL effects |

---

## Next — batch 12: InTouch CRM, sales leads and sales analysis reporting
