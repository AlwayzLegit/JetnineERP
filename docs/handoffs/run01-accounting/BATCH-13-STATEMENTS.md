# Run 01 — Accounting — Batch 13: Customer Statements and Statement Messaging

10 articles. Statement generation is the visible face of **cycling** — the process named in every
consumer-credit batch and never defined. This batch finally pins down its outputs, even if not
its internals.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 123 | Print a Customer Statement | /articles/15202310636692 | EXTRACTED |
| 124 | Print a Customer's Revolving Statement | /articles/15202297034004 | EXTRACTED |
| 125 | Print a Customer's Installment Statement | /articles/15202279027220 | EXTRACTED |
| 126 | Print a Customer's Layaway Statement | /articles/15202278503572 | EXTRACTED |
| 127 | Print a Customer As Of Statement | /articles/15202310636436 | EXTRACTED |
| 128 | Enter Statement Messages | /articles/15202312121364 | EXTRACTED |
| 129 | Indicate Message to Print on Customer Statements | /articles/15202312119828 | EXTRACTED |
| 130 | Manage Statement Messages | /articles/15202311814804 | EXTRACTED — thin |
| 131 | Manage Statement Message Criteria Assignment | /articles/15202279413524 | LOGGED — companion to 130 |
| 132 | Print an Installment Contract | /articles/15202279051156 | LOGGED — document print, same family |

Newly discovered, queued: `Account Statement Cycling Control Settings` (a.k.a. `A/R Statement
Cycling Control Settings`) — **high priority**, `Cycle Process`, `Search for a Customer`,
`Create a User (Staff) file` / `Valid Log-on Locations`, `Statement History File`.

---

## B. Wiring findings

### FINDING 170 — Statements are created by the Cycle Process inside End-of-Day
Trigger:    **End-of-Day** → `Cycle Process`
Invariant:  "For new statements, the program uses the customer information **created in the Cycle
            Process during End-of-Day processing**."
Consumers:  `Print a Customer Statement` (open item) · `Print a Customer's Revolving Statement` ·
            `Print a Customer's Installment Statement`
Evidence:   Print a Customer Statement, /articles/15202310636692 (identical wording in the other two)
Maps to:    **finally locates `cycling`** — the process flagged as undefined in batches 7, 8 and 12

> Cycling is an End-of-Day sub-process that (per batches 7–8) moves the payment from long-term to
> open-item AR, computes revolving interest and insurance, and (per here) produces statements.
> Its configuration lives in `Account Statement Cycling Control Settings`, which is now the single
> highest-value unread article in the Accounting orbit.

### FINDING 171 — Unprinted statements are silently aged out by the next cycle
Trigger:    The next customer cycle process
Invariant:  "**before the cycle process creates statements, any existing statements not yet printed
            move to the History File**"
Retention:  `Statement History Retention` in `Account Statement Cycling Control Settings`;
            **End-of-Month purges the Statement History File**
Reprint:    `Reprint Statements` reads from the Statement History File
Evidence:   Print a Customer Statement, /articles/15202310636692
Maps to:    **W-054 — CONTRADICTED**

> A generated customer document can be superseded and eventually purged **without ever being
> produced**. `W-054` says every generated document is archived against its source record; here
> archival is time-boxed and printing is the only thing that promotes a statement out of the
> pending state. For a regulated consumer-credit statement that is a real risk — and it means
> historical statement reprints will not be available for the full life of a contract.

### FINDING 172 — Statements are classified into three types with a defined print order
Types:      **All · Regular · Hold**
Hold criteria: a statement is "hold" when the `Hold Statement` field in `Customer Settings` is
            active, **or** `Hold Credit Balance Statements` in `Account Statement Cycling Control
            Settings` is active
Order under All: hold-customer statements → hold-credit statements → regular statements,
            with "**A separator page prints at the completion of each type**"
Evidence:   Print a Customer Statement, /articles/15202310636692
Maps to:    NEW

### FINDING 173 — Four statement products, one cycling engine, three XML switches
Products:   open-item customer statement · revolving statement · installment statement ·
            **layaway statement** · plus the on-demand **As Of** statement
XML gates (each on the Advanced tab of `Account Statement Cycling Control Settings`):
            `Create XML for Open Item Statements and Export To` ·
            `Create XML for Revolving Statements and Export To` ·
            `Create XML for Installment Statements and Export To`
Form gate:  revolving and installment statements require `Statement Form` = **Forms Designer**;
            the open-item statement additionally supports **Forms** (load and test-print each time)
            and **Laser** (direct)
Evidence:   Print a Customer's Revolving Statement, /articles/15202297034004 · Print a Customer's Installment Statement, /articles/15202279027220 · Print a Customer Statement, /articles/15202310636692
Maps to:    NEW

### FINDING 174 — On-demand and scheduled runs of the revolving statement behave differently
Trigger:    `Print a Customer's Revolving Statement`
On demand:  "prints a statement **or** creates an XML file. Output options is inactive … and the
            output is set to **Printer** unless you specify otherwise in Account Statement Cycling
            Control Settings. If there is a defined NFS path, Output Options is active, and Printer
            and NFS Shared Drive are the two output types available."
Scheduled:  "an XML file is created following the pathway set in Output Options"
Path:       "The XML path … is generated **automatically** for the on-demand and scheduled versions"
Evidence:   Print a Customer's Revolving Statement, /articles/15202297034004
Maps to:    NEW

### FINDING 175 — Statement messages are resolved by criteria plus per-customer overrides
Trigger:    Statement creation
Resolution: "the process selects the appropriate statement messages based on … Messages assigned to
            the customer's **revolving plan, state, and/or store** [and] Messages assigned or
            **excluded** for the specified customer"
Criteria tab: Message Code × Plan × State × Store, any combination or **All**
Customer tab: manual assignment, removal of manual assignments, or **exclusion** of criteria-assigned
            messages. Grid shows Expires · Code · Message · **Source (Manual or Criteria)** ·
            Excluded (asterisk). Remove applies to manual; Exclude applies to criteria-derived.
Evidence:   Indicate Message to Print on Customer Statements, /articles/15202312119828
Maps to:    NEW — a clean, copyable rule/override model

> Note the design: derived assignments cannot be deleted, only **excluded**, and the source of every
> assignment is retained. That is precisely the pattern our own rules engine should use — it keeps
> the rule and the exception distinguishable, which STORIS mostly fails to do elsewhere.

### FINDING 176 — Messages carry an expiry, a placement, and an optional account-terms table
Trigger:    `Enter Statement Messages`
Payload:    Message Code · **Expires** · Message · **Print within the Section of the Statement**
Special:    selecting **Changes to Account Terms** at `Print within` activates an Account Terms tab
            whose Text Header / Value Header / Text / Value rows "create a table that prints on the
            customer's revolving statement, notifying them of **changes to their account terms**"
Evidence:   Enter Statement Messages, /articles/15202312121364
Maps to:    NEW — regulated change-in-terms notification built into statement messaging

> Change-in-terms notices are a legal requirement on open-end consumer credit. STORIS implements
> them as a *statement message with a structured table*, not as a first-class account event. If we
> keep in-house revolving, this needs to be a tracked, auditable account event on our side.

### FINDING 177 — Layaway statements are a distinct product with their own terms parameters
Trigger:    `Print a Customer's Layaway Statement`
Contents:   sales order number · customer information · sale date · **"deliver by" date** ·
            original purchase amount · layaway payments (deposits) received · net balance due ·
            **layaway payment due** · payment due date
Parameters: Store · **Number of Days Until Money is Due** · **Percent of Invoice Amount Due** ·
            **Number of Days Until Cancellation** · Written Start/End Day
Evidence:   Print a Customer's Layaway Statement, /articles/15202278503572
Maps to:    NEW — **layaway is a credit product we had not identified at all**

> The run-time parameters are effectively the layaway policy: how long until money is due, what
> percentage, and when the order cancels. Whether these are policy defaults or per-run filters is
> unstated, but a layaway order clearly has its own due-date and cancellation clock.

### FINDING 178 — Statement location access is governed by a corporate log-on location
Trigger:    Running layaway statements
Rule:       if `Corporate Access Log-on` in `Account Statement Cycling Control Settings` holds a
            value, users with that location in their `Valid Log-on Locations` (Create a User Staff
            file) get "unlimited access to information pertaining to all stores and warehouses";
            users without it "can print statements only for the store to which they log on";
            if the field is null "this level of security is **not active**"
Evidence:   Print a Customer's Layaway Statement, /articles/15202278503572
Maps to:    **W-052 — CONTRADICTED again**, **W-050 — CONTRADICTED**

> A twelfth access-control mechanism: a *magic location value* that confers global scope. It is
> neither a permission nor Regional Processing — it is a sentinel location. And it can be switched
> off entirely by clearing one field.

### FINDING 179 — The As-Of statement overrides the zero-balance suppression for single customers
Trigger:    `Print a Customer As Of Statement`
Rule:       without `Generate Zero Balance Statements` in `Account Statement Cycling Control
            Settings`, "the system restricts zero-balance statements regardless of activity.
            However, if you use this routine to print for a **single customer**, the system
            **overrides** that field"
Scope:      store location · district · customer code
Evidence:   Print a Customer As Of Statement, /articles/15202310636436
Maps to:    NEW

---

## C. Screen and field inventory

**Print a Customer Statement** — Reprint Statements · Statement Type (All/Regular/Hold) ·
Customer · Statement Month · Statement Day · Statement Year · Send Output to · Export Path · Actions.

**Print a Customer's Revolving Statement** — Reprint Statements · Statement Type · Customer Code ·
Statement Month/Day/Year · Send Output to · Export Path.

**Print a Customer's Installment Statement** — as above plus **Contract Number**.

**Print a Customer's Layaway Statement** — Store · Number of Days Until Money is Due ·
Percent of Invoice Amount Due · Number of Days Until Cancellation · Written Start Day · Written End Day.

**Print a Customer As Of Statement** — Location · District · Customer Code.

**Enter Statement Messages** — tabs Message, Account Terms.
*Message:* Message Code · Expires · Message · Print within the Section of the Statement.
*Account Terms:* Text Header · Value Header · Text · Value · Grid.

**Indicate Message to Print on Customer Statements** — tabs Criteria, Customer.
*Criteria:* Message Code · Plan · State · Store · Manage Message · Manage Criteria.
*Customer:* Customer · Message Code · Exclude · Grid (Expires, Code, Message, Source, Excluded).

**Manage Statement Messages** — Message Code · Sort by · Grid with All / None buttons.

---

## D. Control settings catalog (additions)

All of the following live in **`Account Statement Cycling Control Settings`** (also referred to as
`A/R Statement Cycling Control Settings`) — the single most referenced unread settings file in the run:

| Setting | What it changes |
|---|---|
| Statement Form | Forms Designer / Forms / Laser — gates which statement routines can run at all |
| Statement History Retention | How long printed statements stay reprintable before End-of-Month purge |
| Hold Credit Balance Statements | Classifies credit-balance statements as "hold" |
| Generate Zero Balance Statements | Suppresses zero-balance statements (overridable for a single customer) |
| Create XML for Open Item / Revolving / Installment Statements and Export To | Three independent XML switches (Advanced tab) |
| XML path / NFS path | Output destination; auto-generated for on-demand and scheduled runs |
| Corporate Access Log-on | Sentinel location conferring all-store statement access |
| default output destination | Printer unless overridden |

Elsewhere: `Hold Statement` in `Customer Settings`; `Valid Log-on Locations` in the Create a User
(Staff) file.

---

## E. Security permissions catalog (additions)

| Mechanism | System | Gates |
|---|---|---|
| Corporate Access Log-on + Valid Log-on Locations | Account Statement Cycling Control Settings + Create a User (Staff) file | All-store vs own-store statement printing; **inactive if the control field is null** |

---

## F. State machines and enumerations

**Statement type** — All · Regular · Hold. Hold sub-types: hold-customer, hold-credit.
Print order under All: hold-customer → hold-credit → regular, separator page between each.

**Statement lifecycle** — created by Cycle Process → pending → (printed → history) **or**
(unprinted → moved to history by the next cycle) → purged at End-of-Month per retention.

**Statement products** — open item · revolving · installment · layaway · as-of (on demand only).

**Message assignment source** — Manual · Criteria. Manual assignments are removable;
criteria assignments are excludable only.

**Message placement** — `Print within the Section of the Statement`, one value of which is
**Changes to Account Terms** (activates the structured terms table).

---

## G. Sequencing rules (additions)

1. End-of-Day → Cycle Process → statements created.
2. Unprinted statements are moved to history by the **next** cycle, before new ones are created.
3. End-of-Month purges the Statement History File per retention.
4. Revolving and installment statement printing requires `Statement Form` = Forms Designer.
5. Message resolution at statement creation: criteria (plan/state/store) then per-customer
   assignment and exclusion.
6. Statement messages stop applying at their `Expires` date.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none this batch.

**2. Documented but ambiguous**
- **`Account Statement Cycling Control Settings` has not been read.** It holds at least eight
  behaviours named across this batch plus the cycle configuration itself. **This is now the top
  unread article for the Accounting domain.**
- **What the Cycle Process actually does** — still only known by its effects (moves payment
  long-term→open-item, computes interest and insurance, creates statements, stamps the customer's
  last cycle date). No article describes the process itself. It may be documented under
  System Administration or Getting Started rather than Accounting.
- **Per-customer cycle dates.** Batch 5 found a per-customer `last cycle date` floor on backdating,
  and batch 8 said interest is computed "at the time of cycling". Whether cycling is staggered
  per customer (cycle codes) or global is never stated. **This determines whether our statement
  and interest engines are one nightly job or N.**
- **Layaway.** An entire order/credit type surfaced only by its statement. No layaway policy,
  entry, or cancellation article has been read; the statement's run-time parameters hint at a
  deposit-percentage and cancellation clock we know nothing about.
- **`Print within the Section of the Statement`** — only one value (`Changes to Account Terms`)
  is named; the section list is undocumented.
- **`Manage Criteria`** vs **`Manage Message`** — two extra-action buttons; only the message-side
  routine was documented in depth.
- **Whether statements are ever emailed** — everything here is print or XML-to-NFS. Given batch 6
  found emailed EFT remittance advice, the absence is notable.

**3. Inferences (not quotable, kept out of section B)**
- Cycling is almost certainly staggered by a customer cycle code, because statements carry a
  Statement Month/Day/Year and the "next customer cycle process" is spoken of per customer. Not stated.
- The XML-to-NFS pattern across statements, LET documents (batch 11) and insurance files (batch 12)
  suggests a single house convention for outbound document integration. Not stated as such.
- Layaway is probably an order type rather than a receivable plan, since its statement keys on sales
  order number and deposits rather than a plan or contract.

---

## I. Unknown unknowns (additions)

- **Layaway** as a credit/order product with its own statement, due-date and cancellation clock.
- **Changes-to-Account-Terms notices** implemented as structured statement messages.
- **Statement message expiry** as a first-class field.
- **Hold statements** (customer-flagged and credit-balance) as a suppression mechanism.
- **Separator pages** between statement classes in a print run.
- **Corporate Access Log-on** as a sentinel location conferring global scope.
- **District** as a statement selection dimension (also seen in collections).
- **As-of statements** as a distinct on-demand product from cycled statements.
- **Statement history as a purgeable store** rather than a permanent archive.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Cycle Process | The End-of-Day sub-process that cycles balances, computes interest/insurance, and creates statements |
| Statement History File | Where printed (and unprinted, superseded) statements go; purged at End-of-Month |
| Hold statement | A statement suppressed from the regular run, by customer flag or credit balance |
| Regular statement | A statement in the normal print run |
| As Of statement | On-demand statement of buying and payment history as of today |
| Layaway statement | Statement for orders on layaway, with deposit and cancellation timing |
| Statement message | Text linked to statements by plan/state/store criteria, with per-customer override |
| Changes to Account Terms | Statement section carrying a structured table of revised terms |
| Corporate Access Log-on | A location value that, if held by a user, grants all-store statement access |
| Statement Form | Control choosing Forms Designer, Forms, or Laser output |
