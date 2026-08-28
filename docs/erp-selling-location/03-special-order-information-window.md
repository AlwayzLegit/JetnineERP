# 03 — Special Order Information Window

**Source:** https://storis.zendesk.com/hc/en-us/articles/15202208000404-Special-Order-Information-Window
**STORIS area:** STORIS ERP > Merchandising

---

## Access path

The source gives no menu path. It gives a **trigger** instead:

> If the product you specified (for example, at the Product field in **Purchase Order Entry**) is a special order product, this screen appears in which you can enter or view special order information for the selected piece.

So: it is a **reactive pop-up on product selection**, fired when the chosen product is flagged as a special order product. Purchase Order Entry is named as _an example_ — the phrasing implies other entry points behave the same way. Do not hard-wire it to purchasing.

**Second access path**, stated in a note:

> When creating inventory products, as well as special order products, you can enter additional order information for the product by accessing the screen on the **General page, Actions button, Special Order Info** option in **Advanced Product Settings**.

## Two modes

> This window may appear as either an **entry** or **read-only** window.

The source does not say what determines the mode. It does give one concrete mode difference, under Detail Information:

> **NOTE:** This field is inactive if accessed from Advanced Product Settings.

That is the only documented mode rule. Everything else about mode selection is unknown — see open questions.

## Fields

### Frame

Enter the frame number for this special order product.

### Color/Grade, Fabric/Finish, Misc/Grade (CFO's)

Three fields, collectively the **Customer Formulated Options (CFO)**. They collect "cosmetic" information about special order products — Color/Grade, Fabric/Finish, Misc/Grade.

**The labels are not fixed.** Verbatim:

> The labels for the three CFO prompts that display here derive from the **Special Order Control Settings**.

This is a real design constraint. Build three configurable-label option slots, not three fields named Color, Fabric, and Misc. The names above are defaults/examples; a retailer reconfigures them in Special Order Control Settings.

### Detail Information

A text box for detailed information on the special order **or inventory item**.

Inactive when the screen is reached from Advanced Product Settings.

Note the wording: the field applies to inventory items too, not just special orders — consistent with the note that this screen is also used when creating ordinary inventory products.

## Behavior rules

1. Selecting a special-order-flagged product in an order-entry context opens this window automatically.
2. The window may be entry-capable or read-only; mode is context-driven.
3. Frame accepts a frame number for the special order product.
4. Three CFO fields capture cosmetic options; their prompt labels are read from Special Order Control Settings, not hard-coded.
5. Detail Information is a free-text box.
6. When reached via Advanced Product Settings > General > Actions > Special Order Info, Detail Information is inactive.
7. Data captured here is scoped to **the selected piece** — the source says "for the selected piece", i.e. per line/piece, not per product master, when reached from order entry.

## Data model `[INFERRED]`

- A special-order-info record attached to an order/PO line piece: `frame`, `cfo_1`, `cfo_2`, `cfo_3`, `detail_information`.
- The same structure is attachable to a product master via Advanced Product Settings (with `detail_information` not editable there).
- CFO **labels** live in Special Order Control Settings as three configurable prompt strings, resolved at render time.
- Product master needs a `is_special_order` flag to fire the trigger.

## Acceptance criteria

- Choosing a special-order product at a Product field opens the window without further user action.
- Choosing a non-special-order product does not open it.
- The three CFO field labels render from Special Order Control Settings, and changing those settings changes the labels shown.
- Frame, the three CFOs, and Detail Information persist against the selected piece.
- Opening the screen from Advanced Product Settings renders Detail Information inactive.
- Re-opening the window for a piece that already has data shows the stored values.

## Open questions

- **What determines entry vs. read-only mode?** The single biggest gap. Candidates: order status, user permission, whether the piece is already committed/ordered. Source does not say.
- **Which entry points besides Purchase Order Entry trigger this?** Sales order entry almost certainly does — "for example" implies a list. Needs confirmation.
- **Are CFO values free text or validated against a value list?** The name "Customer Formulated Options" and the presence of a "Grade" concept suggest coded values with pricing impact, but the source describes them only as collecting "cosmetic" information. Needs Special Order Control Settings.
- **Do CFO values affect price?** Not stated here. In many ERPs grade/fabric selections drive a price uplift. Confirm before modelling them as plain strings.
- **Is Frame validated against anything?** Not stated.
- **Field lengths / types.** Not stated for any field.
