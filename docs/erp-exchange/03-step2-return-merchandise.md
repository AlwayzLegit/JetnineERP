# 03 — Step 2: Return Merchandise

The return leg. What comes back, at what credit, and into which inventory bucket.

---

## Entry: Original Order Piece Selection

`[GATE]` **If the original sales document exists on the system**, the **Original Order Piece
Selection** screen appears automatically, listing the products purchased on that order. The
user records which items are being returned; selected items are then **automatically populated
as rows** on the Merchandise page. The screen displays Customer Name, Current Document, and
Original Document.

If no original document exists, products are entered manually (see Product below).

This is the correct default and worth copying: returns should be *selected from what was
bought*, not typed from scratch. Free-text product entry is the exception path, not the norm.

---

## Gating permissions

| Condition | Effect |
|---|---|
| `[PERM]` *Edit Return Portion of Existing Exchange* absent | The return portion is **inquiry-only** |
| `[PERM]` *Able to Delete or Add Lines When Deposit Applied* absent (User or User Group file) | On orders with deposits and/or financing applied, **line items are inactive** — no adds, no deletes |
| `[SETTING]` *Allowed Number of Days on Return* (POS Control Settings) exceeded | `[PERM]` *Override Allowed Number of Days on Returns* required to return past the window |

The deposit/financing lock is the one to notice: once money has been taken against an order,
its line composition freezes for ordinary users. That's a sound control — port it.

---

## Line fields

### Product
The code of the product being returned. Search opens **Search for a Product**. A camera icon
shows the product image when one exists (inactive when none does).

`[SIDE EFFECT]` **Protection plan transfer.** When an exchange with a protection plan is
written against a completed order, the protection plan is **automatically moved to the
return** based on the selected merchandise line. **The plans remain linked**, but the plan
price may change depending on:
- whether the original plan is **tiered**, and
- whether this is an **even exchange**.

See also the cancellation-restriction rule in `05` — protection plans are the most
rule-dense object in the whole exchange flow, and they behave differently depending on whether
the plan is being *cancelled* or *carried forward*.

### Brand
Display-only, from product settings, once a product is selected.

### Quantity Returned
The quantity being returned. Defaults to the quantity purchased on the original order when
available; editable.

### Original Purchase Price
**Read-only.** The original selling price minus any adjustments.

### Unit Price
**Editable.** Starts at the original selling price minus adjustments. Two reduction mechanisms
can lower it, each with its own override permission:

| Mechanism | Behavior | Override |
|---|---|---|
| `[SETTING]` *Prorate Returned Warranties* (POS Control Settings) | For a returned **linked warranty**, a prorated price is populated | `[PERM]` *Change reduced warranty price; not exceeding original price* — allows increasing it, capped at the original price |
| `[SETTING]` Reduced return percentage (Costing Control Settings or Group Settings) | The reduced refund price displays | `[PERM]` *Change reduced return price; not exceeding original price* — allows increasing it, capped at the original selling price minus adjustments |

`[GATE]` **In both cases the cap is the original price.** A return can never credit more than
was paid.

`[GATE]` Editing the reduced return price **does not change the cost reduction** — the
inventory cost effect and the customer credit are decoupled. Model these as two separate
values; conflating them corrupts margin reporting on returns.

### Extended Price
Display-only: Unit Price × Quantity Returned.

### Reason Return Code
Why the item is coming back. Arrow-select from available reason codes.

`[PERM]` **Restricted As-Is reason codes** — assigning a reason code whose *This Reason is Used
For* field is set to **As-Is Restricted** (Reason Code Settings) requires permission via
Create a User/Group Logistics Security, or a manager override.

### Return to As-Is
`[SIDE EFFECT]` **Determines which inventory bucket receives the returned goods.**
Checked → As-Is inventory. Unchecked → regular saleable inventory.
`[SETTING]` *Return Pieces to As-Is* (POS Control Settings) defaults the box checked;
overridable.

This single checkbox is the most financially consequential field on the page — it decides
whether returned merchandise re-enters stock at full value or as discounted As-Is inventory.
It deserves prominence in the UI and a reporting hook, not a quiet checkbox.

**Related:** when the price of non-saleable inventory items is changed, that shows up on
**View Detailed Activity for a Product**, on the As-Is Inventory Detail page.

`[GATE]` As noted in `01`: **returns and exchanges without an original order get no selling
price and no inventory activity record.** As-Is routing on a no-original return therefore
lands stock with no traceable valuation history.

---

## Line entry controls

| Control | Behavior |
|---|---|
| **Save + Add Another** | Adds the item and resets the entry fields to null |
| **Save** | Adds the item |
| **Cancel** | Clears the entry fields, returns to the Line Item Display |
| **Add Item** | Opens the product entry fields at the top of the screen for a new line |
| **Expand All Rows / Collapse All Rows** | Show or hide full line detail for all rows |

### `[GATE]` Route capacity check on every add or change

After adding an item, the line is checked against route capacity. If exceeded:

> *"Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?"*

- **Yes** → overrides the capacity limit. `[PERM]` *Override capacities when scheduling routes
  that are full* (Create a User/Group Actions - Logistics Security).
- **No** → **the line is added to the grid as unscheduled.**

The warning fires **every time** merchandise is added or changed in a way that *increases*
route capacity usage. It does **not** fire when a change *reduces* usage — even if the result
is still over capacity.

Note the "No" branch: declining the override doesn't cancel the line, it silently
de-schedules it. Combined with `[SETTING]` *Prohibit Unscheduled Lines* (see `05`), that
creates a save-time trap. Make the unscheduled outcome visible on the line, not just implied.

---

## Line Item Display

Rows are **not directly editable**. Clicking **Edit** loads the row into the entry fields at
the top; **the row being edited turns yellow**. **Remove** deletes the row from the order after
a confirmation (Yes proceeds, Cancel keeps the line).

Columns:

- Product
- Description
- Status
- Return to As Is
- Quantity Ordered
- Unit Price
- Extended Price

**More** expander adds: Second Description, Vendor Model Number, Regular Selling Price, Brand.

---

## Inventory Selection

After return-product information is added to the Line Item Display, the **Inventory Selection**
screen may appear to capture:

- Quantity of the returned product
- Reference Number (if applicable)
- Storage Location (if tracked)
- Reason Code (reason for return)

This is where a returned piece is physically placed. For location-tracked or serialized
inventory it is mandatory, and it is the join point between the return document and the
warehouse.

---

## Step 2 Actions

- **Additional Line Item Details** — `[GATE]` requires a selected line
- Audit Comments Log
- Line Comments
- **Original Invoice**
- **Update the Reason Code**
- **View Adjusted Pieces** — reopens the Original Order Piece Selection window
