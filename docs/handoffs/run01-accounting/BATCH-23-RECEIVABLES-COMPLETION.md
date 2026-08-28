# Run 01 — Accounting — Batch 23: Receivables Completion

10 articles. **This completes the Receivables subsection: 124/124.**

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 238 | Credit Application Entry - Co-applicant | /articles/15202310374164 | EXTRACTED |
| 239 | View Details of Payment Activity | /articles/15202311020436 | EXTRACTED |
| 240 | Enter/View Comments for a Customer's Disputed Revolving Plan | /articles/15202279420948 | EXTRACTED |
| 241 | MMP Selection - Sales Order Table | /articles/15202279658004 | EXTRACTED |
| 242 | Print an Installment Contract | /articles/15202279051156 | EXTRACTED |
| 243 | Manage Statement Message Criteria Assignment | /articles/15202279413524 | EXTRACTED |
| 244 | Installment Notes | /articles/15202278680596 | EXTRACTED — thin |
| 245 | Late Fee Forgiven | /articles/15202310832020 | EXTRACTED — thin |
| 246 | Premier Insurance File Layout | /articles/27272172924820 | LOGGED — format spec (batch 12 family) |
| 247 | View a Customer's Payment Activity | *(Accounting Views and Reports)* | DEFERRED to the AVR batches |

**Subsection status: Accounting top level 10/10 · General Ledger 10/10 · Payables 63/63 ·
Receivables 124/124 · Accounting Views and Reports ~15/100.**

---

## B. Wiring findings

### FINDING 267 — The co-applicant application is a near-clone with two extra address actions
Structure:  same five tabs (Personal, Residence, Employment, Reference, Miscellaneous), same
            Credit Application Control Settings requiredness matrix, same 99-reference limit, same
            military block, same 100-year date guard, same snapshot semantics
Differences: the Residence tab adds Actions — **`Maintain Co-applicant Name/Address`** and
            **`Update a Co-applicant Additional Address`**; the Personal tab omits Checking/Savings
Confirms:   "When a co-applicant or co-signer is removed from the credit application **all financed
            sales orders are placed on C4 credit hold**" (restated here, independently of batch 9)
Attachments: "You can **only edit** files attached to the credit application. You can **view**
            attachments linked to the primary applicant's Customer Settings **and** credit application."
Evidence:   Credit Application Entry - Co-applicant, /articles/15202310374164
Maps to:    confirms batch 9, Findings 131–132

> A co-applicant can carry an **additional address** beyond current and previous residence. That is
> a third address slot our model would not have anticipated.

### FINDING 268 — Receipt reprints deliberately blank the balances
Trigger:    `View Details of Payment Activity` → Actions → **Reprint Receipt**
Invariant:  "During reprint, the output of **account balances is replaced with 'Reprint'** as the
            balances that were available at the time the original receipt was printed are **not
            available during reprint**."
Exclusion:  "This option is **not active** for payments that have been **misapplied or NSF'd**."
Payload:    total amount, how it was applied, payment type; **check number** for checks;
            **last four digits** for credit cards
Delivery:   "print **or email** a reprint of the receipt"
Evidence:   View Details of Payment Activity, /articles/15202311020436
Maps to:    **W-054 — CONTRADICTED in fidelity**

> STORIS cannot reproduce a historical receipt faithfully because point-in-time balances are not
> retained. It handles this honestly — stamping 'Reprint' where the balances were — but it means
> **the archived document is not a true copy**. `W-054` assumes archival implies reproducibility.
> If we want faithful reprints we must store the rendered document, not regenerate it.
> Note also the third documented email delivery path, and that reprints are blocked once a payment
> has been reversed.

### FINDING 269 — Dispute comments are a separate, printable comment store with a read-only variant
Trigger:    `Update Disputes` → Actions → Enter Dispute Comments
Access rule: "If you access this screen **from Update Disputes**, you can update comments.
            Otherwise, you access a **read-only** version"
Output:     `Print Comments` sends dispute comments to the printer/spooler
Evidence:   Enter/View Comments for a Customer's Disputed Revolving Plan, /articles/15202279420948
Maps to:    **eighth comment store** (cf. batch 15, Finding 210)

> Running list of customer-side comment/log stores: Account Comments · Credit review comments ·
> Collections Comments · Customer Activity Log · Customer Credit and Scoring Activity Log ·
> Installment Activity Log · Collections Activity Log · Customer Comments file · **Dispute comments** ·
> plus **Installment Notes** (Finding 271). Ten named stores. Consolidation is a clear rebuild win.

### FINDING 270 — Per-Sales-Order plans expose a term/payment table at estimation time
Trigger:    `Revolving Payment Estimator` → Sales Order Table (visible only when Monthly Payment and
            Term Months are active **and** a **Per Sales Order** plan is selected)
Payload:    **Months · Projected MMP Amount**; double-click writes the selection back into the
            estimator's Monthly Payment and Term Months fields
Evidence:   MMP Selection - Sales Order Table, /articles/15202279658004
Maps to:    completes batch 8, Finding 117 (`MMP Amount Table` on Adjust Balance) — the same
            term/payment table surfaces in three places

### FINDING 271 — Installment notes are free-text and editable, unlike every other comment store
Trigger:    `Review Contract Details` → Search by Notes
Behaviour:  "enter, edit, or read notes … Previously entered notes, if any, display. **You can edit
            these notes**, and/or enter new text."
Evidence:   Installment Notes, /articles/15202278680596
Maps to:    contrast with AP bill comments (append-only, batch 22) and credit hold reasons
            (immutable, batch 18)

> Three comment stores, three different mutability rules, no stated principle. For a regulated
> consumer-credit file, freely editable notes are the weakest of the three.

### FINDING 272 — Forgiven late fees are retained and viewable per contract
Producer:   `Late Fee Forgiven`, from `Review Contract Details`
Content:    "view **all of the late fees forgiven** on the selected contract"
Evidence:   Late Fee Forgiven, /articles/15202310832020
Maps to:    the read side of batch 16, Finding 216

### FINDING 273 — Installment contracts print from any lifecycle state
Trigger:    `Print an Installment Contract`
Scope:      "One, multiple, or all contracts for a customer can be printed. You can choose to print
            contracts that are **Pending, Active, or in History**."
Fields:     Customer · Select File · Contract Number · Run
Evidence:   Print an Installment Contract, /articles/15202279051156
Maps to:    NEW — `Select File` is presumably the Pending/Active/History store selector, confirming
            the `IR.ACTIVE` / `IR.HISTORY` split from batch 11

### FINDING 274 — Statement message criteria can be managed from either direction
Two entry points into the same assignment matrix:
  - **Message-first** — enter a Message Code → `Manage Message Assignment` → `Manage Statement
    Messages` (batch 13): which criteria does this message apply to?
  - **Criteria-first** — leave Message Code blank → `Manage Criteria Assignment` →
    `Manage Statement Message Criteria Assignment`: choose Plan, State, Store → Select → which
    messages apply to this criteria combination?
Evidence:   Manage Statement Message Criteria Assignment, /articles/15202279413524
Maps to:    completes batch 13, Finding 175

> A clean bidirectional maintenance model over a many-to-many mapping. Worth copying — most of
> STORIS's other rule/exception structures are one-directional.

---

## C. Screen and field inventory

**Credit Application Entry - Co-applicant** — as the primary application (batch 9) minus
Checking/Savings, plus Residence Actions: Maintain Co-applicant Name/Address ·
Update a Co-applicant Additional Address.

**View Details of Payment Activity** — Send Output To · Export Path ·
Actions (Output Settings, Print Comments, **Reprint Receipt**).

**Enter/View Comments for a Customer's Disputed Revolving Plan** — Customer · Plan ·
Update Comments · Send Output to · Export Path · Actions (Output Settings, Print Comments).

**MMP Selection - Sales Order Table** — Months · Projected MMP Amount.

**Print an Installment Contract** — Customer · Select File · Contract Number · Run.

**Manage Statement Message Criteria Assignment** — Plan · State · Store · Select · Grid.

**Installment Notes** — free-text entry window.

**Late Fee Forgiven** — grid.

---

## D. Control settings catalog (additions)

*(None new.)*

---

## E. Security permissions catalog (additions)

*(None new. Access to dispute comment editing is by entry path, not by permission.)*

---

## F. State machines and enumerations

**Installment contract print scope** — Pending · Active · History.

**Comment store mutability (three observed rules)** — immutable reason + editable comment
(credit holds) · append-only (AP bill comments) · fully editable (installment notes).

**Receipt reprint** — permitted for normal payments; **blocked** for misapplied or NSF'd payments;
balances replaced with 'Reprint'.

---

## G. Sequencing rules (additions)

1. Removing a co-applicant or co-signer immediately places all financed orders on C4.
2. Dispute comments are editable only when reached from `Update Disputes`.
3. Receipt reprint is unavailable once a payment has been misapplied or NSF'd.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none.

**2. Documented but ambiguous**
- **`Select File`** on `Print an Installment Contract` — almost certainly the Pending/Active/History
  selector, but not stated.
- **`Update a Co-applicant Additional Address`** — a third address type with no description.
- **`Service Comp`** (co-applicant) vs **`Service Comp Date`** (primary) — same field, two names.
- **Whether emailed receipts follow the same `Notifications Control Settings` gate** as credit
  letters and remittance advice — not stated.

**3. Inferences (not quotable, kept out of section B)**
- The co-applicant article is a near-copy of the primary one, so field-level differences may be
  editorial rather than real. Where they matter (Checking/Savings, additional address), verify.
- Because reprints blank the balances, any historical dispute about what a customer was told will
  turn on the collections or credit comment stores rather than on documents. Not stated.

---

## I. Unknown unknowns (additions)

- **Co-applicant additional address** as a third address slot.
- **Receipt reprint with blanked balances** — archived documents are regenerated, not stored.
- **Reprint blocked after reversal.**
- **Bidirectional statement-message criteria maintenance.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| Reprint Receipt | Regenerated receipt with point-in-time balances replaced by 'Reprint' |
| Dispute comments | Per-plan comment store, editable only from `Update Disputes` |
| Installment Notes | Freely editable free-text notes on a contract |
| Sales Order Table | Term/payment grid for Per Sales Order revolving plans |
| Manage Criteria Assignment | Criteria-first view of the statement-message mapping |
