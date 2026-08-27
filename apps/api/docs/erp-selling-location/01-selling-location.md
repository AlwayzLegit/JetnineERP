# 01 — Selling Location (EDI purchase order)

**Source:** https://storis.zendesk.com/hc/en-us/articles/15202192346772-Selling-Location
**STORIS area:** STORIS ERP > Merchandising
**Depends on:** `06-read-only-lookup-window.md`

---

## Access path (verbatim from source)

> EDI purchase order creation (from menu or via sales order entry) > Yes to EDI transmission prompt > window displays if no selling location already exists

Three things are encoded in that path and all three matter:

1. An EDI purchase order can originate **from the purchasing menu** _or_ **from inside sales order entry**. Both entry points reach this screen.
2. The screen is gated behind a **Yes answer to an EDI transmission prompt**. If the user declines EDI transmission, this screen never appears.
3. The screen is **conditional, not mandatory** — it displays only _if no selling location already exists_ on the purchase order. It is a fill-the-gap prompt, not a step in a wizard.

## Purpose

Indicate the selling location for an EDI purchase order.

**The one hard downstream rule:** when generating **EDI 850** (purchase order) and **EDI 860** (purchase order change) documents from a purchase order, the EDI **Buyer Store** field is set to the purchase order's **Selling Location**.

That is the entire reason this screen exists. Selling Location is not a merchandising or reporting attribute here — it is the source value for one specific segment of two outbound EDI documents.

## Fields

### Selling Location

Enter the selling location code, or click the Search button to select a location from the Read-Only Lookup Window (see `06`).

**Any location can be assigned to the purchase order.** The source states this explicitly. There is no restriction to the ordering location, the user's home location, or the locations linked to the order — do not add one.

### Name

Once you indicate the selling location, the location name displays here.

Read-only, derived. Populates on selection of a valid location code.

### Grid Information

If there are **multiple linked selling store locations**, they are displayed in this grid. You can **double-click to select a line from the grid** and assign the selling location to the purchase order.

This is a convenience shortcut alongside the free-entry field, not a separate mechanism. The grid holds the _linked_ locations; the entry field and lookup can reach _any_ location.

## Behavior rules

1. The screen is invoked during EDI purchase order creation, after the user answers Yes to the EDI transmission prompt.
2. If the purchase order already has a selling location, the screen does **not** display.
3. The user may type a selling location code directly.
4. The user may click Search to open a read-only location lookup and pick from it.
5. The user may double-click a row in the Grid Information grid to assign that location.
6. Any location is a valid choice — validation is "does this location code exist", not "is this location related to the order".
7. On selection, the location's name is displayed in the Name field.
8. The chosen value is stored on the purchase order and is later read into the **Buyer Store** field of generated EDI 850 and EDI 860 documents.

## Data model `[INFERRED]`

- Purchase order gains a nullable `selling_location` reference to the location/store entity.
- The grid is populated from whatever "linked selling store locations" means in the location model — most likely a location-to-location link table. **This relationship is not defined in the source.** See open questions.
- EDI 850/860 generation reads `purchase_order.selling_location` → `BuyerStore`. Generation must handle the case where the field is null (see open questions).

## Acceptance criteria

- Creating an EDI purchase order with no selling location, and answering Yes to EDI transmission, opens the Selling Location screen.
- Creating an EDI purchase order that already carries a selling location does not open the screen.
- Both entry points (purchasing menu, sales order entry) reach the same screen with the same behavior.
- Entering a valid location code populates the Name field with that location's name.
- The Search button opens a read-only lookup listing all locations; selecting one fills the field.
- Double-clicking a grid row assigns that location.
- A location unrelated to the order is accepted without warning.
- A generated EDI 850 for that purchase order carries the selected location in Buyer Store.
- A generated EDI 860 for that purchase order carries the selected location in Buyer Store.

## Open questions

- **What defines "linked selling store locations"?** The source names the concept but never defines the link. Needs the STORIS location/store settings docs or a live instance.
- **Can the screen be cancelled?** The source does not say whether a selling location is mandatory before the EDI PO can be transmitted, or what happens on cancel.
- **What is Buyer Store populated with if Selling Location is empty** on a PO that reaches EDI generation by some other route? Undefined in source.
- **Is Selling Location editable after creation** — via PO maintenance, or only at this prompt? Undefined in source.
- **Format of the value written to Buyer Store** — the location code, or some EDI-specific store identifier configured elsewhere? The source says the field "is set to the purchase order's Selling Location", implying the code itself, but EDI partner setups often map this. Confirm against `Vendor EDI Settings`.
