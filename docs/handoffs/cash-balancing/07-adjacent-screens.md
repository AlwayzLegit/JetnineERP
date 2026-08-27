# 07 — Adjacent Screens

Three screens linked from the root article's *Related articles* strip. Only
**Switch User Location** genuinely touches cash balancing; the other two are
receivables screens that happened to be surfaced. They are specced here because
they were in scope for this pass — file them into their own modules, not into
cash balancing.

---

## A. Switch User Location  *(relevant to cash balancing)*

**Surface:** the `Current Location` drop-down menu.

Lets a user switch between locations **without logging out and back in**. The
list shows all locations the user has access to. On selection, all security
associated with the chosen location is honored, and the internal processing
required to enable the new location is performed.

### Side effects on switch — all four matter

**[RULE 7.1] Cash drawer is unassigned.** If the user was assigned a cash
drawer, that drawer is **unassigned** on login to the new location. If a cash
drawer is *required* at the new location, the user must instead use the
**Switch User** procedure.

> This is the cash-balancing-relevant one. A location switch silently drops
> drawer assignment; anything that assumes a stable drawer across a session is
> wrong. Surface it in the UI — a silent unassign is a support ticket.

**[RULE 7.2] EMV terminal is unassigned if invalid.** If the user holds a
payment Terminal ID that is not valid for the new location, it is unassigned.
If a payment Terminal ID is required, the user must use **Switch User**, or may
select a Terminal ID at the point of taking a payment.

**[RULE 7.3] Printer falls back to screen.** If the assigned system printer is
not valid for the new location, the printer is unassigned and the **output
designation changes to screen output**. If a system printer is required, the
user must use **Switch User** or the appropriate menu option.

> Note the interaction with `06` §4: a location switch can silently change where
> a report goes. The `Send Output to` field must re-read state after a switch.

**[RULE 7.4] Input Processing notified.** Input Processing routines are
background processes that update the system for the new location. On a location
change, a message is dispatched to them to make the appropriate adjustments.
Model this as an event, not an inline call.

### Design implication
There are two distinct operations with different guarantees:

| | `Switch User Location` | `Switch User` |
|---|---|---|
| Re-authenticates | no | yes |
| Preserves drawer assignment | **no** | yes |
| Preserves terminal / printer | only if valid at new location | yes |

Do not collapse them into one action.

---

## B. Credit Review Comments Entry/Inquiry Screen  *(receivables)*

**Access:** via the **Audit Request Activity** button in `Credit Request Review`.

View, print, or update credit-review comments for a specific customer and
credit-request item.

**[RULE 7.5] Auto-generated comment records.** The system creates a
credit-review-comments record to hold auto-generated comments in each of these
situations:

- application entered
- application changed
- application reviewed
- credit report reviewed
- credit report **printed**

This is an audit trail. It is append-driven by system events, not by user
entry — the user-entered comments live alongside them.

### Fields
| Field | Behavior |
|---|---|
| `Customer Code` | defaults in |
| `Credit Request` | the credit request number, defaults in |
| `Update Comments` | checkbox; checking it opens the **Text Entry Screen**. Leave blank otherwise |
| `Comments` | displays any existing comments |
| `Send Output to` | output destination; changed via actions → `Output Settings` |
| `Export Path` | **inactive in this routine** |

### Actions
- `Output Settings`
- `Print Comments` — prints the contents of the `Comments` box, per the output
  selection made on the Output Comments screen.

---

## C. Change Details  *(receivables — revolving plans)*

**Access:** `Adjust Revolving Plans` → **Change Details** global action button.

Make adjustments to **order details** for a selected revolving plan **without
impacting the long- or short-term balance of the plan**.

**[RULE 7.6] The zero-sum invariant.** When adjustments are entered on this
screen, *the sum of the remaining balances for all transactions must equal the
plan balance.* Increasing one transaction's `Remaining $` **requires** a
corresponding decrease on one or more others, for a **zero net effect** on the
plan balance. Enforce this at save, and show the running delta while editing.

### Header fields (all display-only)
| Field | Contents |
|---|---|
| `Customer` | customer code, name, and address |
| `Plan` | code of the revolving plan being adjusted, carried from the previous screen |
| `Activated` | date the plan was activated for this customer |
| `Balance` | the customer's plan balance |
| `Current Due $` | amount currently due from the customer for this plan |

### Transaction fields
| Field | Behavior |
|---|---|
| `Transaction` | double-click a grid line to select the transaction being adjusted |
| `Posted` | posting date of the selected transaction (display) |
| `Amount $` | original amount of the selected transaction (display) |
| `Remaining $` | remaining open amount; defaults from the transaction, **editable** — subject to RULE 7.6 |
| `Interest Waived $` | if interest was not assessed during an **override period** for this plan, the waived amount for the transaction defaults here and is **editable** |
| `MMP $` | active for **Per Sales Order** plans. Defaults from the grid, editable. **Changing it re-calculates the MMP for the plan.** |
| `Promotion Expires` | optional. Active **only when there is an amount in `Interest Waived`**. Date the waived-interest promotion for this transaction expires |
| `No Payments Until` | optional. Date the "no-payments-until" promotion for this transaction expires. **Once expired, the transaction's MMP amount is included in the new MMP when the account is cycled** |

### Grid
Columns: transaction reference, posted date, original amount, remaining amount,
waived interest amount, waived interest expiration date, no-payments promotion
expiration date, MMP amount.

Interaction: **double-click** a line to load it into the fields; after entering
changed detail, **Add** updates the grid. (Edit-then-commit, not inline edit.)

### Save
**[RULE 7.7]** Clicking **Save** displays the **GL Distribution Screen** —
*provided the user has access to that information*. That screen is used to view
the proposed G/L postings and make any necessary adjustments **before** the
adjustment is committed.

So: save is a two-phase commit with an optional, permission-gated review step.
Users without GL access commit directly. Both paths must produce identical
postings.
