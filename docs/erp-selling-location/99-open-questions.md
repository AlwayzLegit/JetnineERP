# 99 — Consolidated open questions

Everything the STORIS source left undefined, rolled up. Resolve against a live STORIS instance, STORIS support, or the not-yet-dissected articles named below. Delete lines as they are answered.

## Blockers (do not build past these)

| #   | Question                                                                                           | Screen | Resolve via                                                 |
| --- | -------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- |
| B1  | What is an **Inventory Formation**? Plan qualification depends entirely on it.                     | 04     | `Inventory Formations` article                              |
| B2  | How is a protection plan's **Suggested Price** calculated from "potentially linkable merchandise"? | 04     | `Protection Plans Overview`, Protection Plan Settings       |
| B3  | What does the **receiving calendar** actually do to entered ASN dates — block, snap, or warn?      | 02     | `Vendor EDI Settings`, `Warehouse/Store Receiving Settings` |
| B4  | What defines **"linked selling store locations"**?                                                 | 01     | Location/store settings docs                                |

## Articles to dissect next

These are referenced by the specs and are not covered here:

- `Enter a Purchase Order` — parent of 01, 02, 03
- `Vendor EDI Settings` — Receiving Calendar setting, EDI-active flag, Buyer Store mapping
- `Warehouse/Store Receiving Settings` — the receiving calendar itself
- `Special Order Control Settings` — the three CFO prompt labels
- `Advanced Product Settings` — second entry point for 03
- `Point of Sale Control Settings` — Automatically Add to Order, Prompt to Add to Order
- `Protection Plan Settings` and `Protection Plans Overview` — qualification and pricing
- `Protection Plan Product Selection` — step 3 of the protection plan flow
- `Inventory Formations` — qualification basis
- `Enter a Sales Order`, `Enter an Exchange`, `Enter a Return`, `Adjust Dollars on a Completed Order` — the five access paths for 04
- `Collector Review - Customer Update Screen` — second entry point for 05
- `Track Settings Activity` — settings-change logging opt-in
- `Search for a Customer` — customer picker used by 05
- `Output Settings` — shared report output control

## Per-screen questions

### 01 Selling Location

- Can the screen be cancelled, and is Selling Location mandatory before EDI transmission?
- What populates Buyer Store if Selling Location is empty at EDI generation time?
- Is Selling Location editable after PO creation?
- Is Buyer Store the raw location code, or a mapped EDI store identifier?

### 02 EDI ASN Dates

- Possible values of `Vendor EDI Settings > Receiving Calendar`.
- Are ASN dates ever set automatically from an inbound EDI 856?
- Any validation against the PO's own expected/due dates?
- What happens to the dates when a line is split or deleted?

### 03 Special Order Information Window

- What determines **entry vs. read-only** mode? (largest gap on this screen)
- Which entry points besides Purchase Order Entry trigger it?
- Are CFO values free text or coded values from a list?
- Do CFO selections affect price?
- Field lengths and types for all five fields.

### 04 Protection Plan Selection

- **`Deselect All` is undocumented** — the source article ends at the label.
- Is per-plan "Partially Completed" the same concept as an order being partially completed?
- Where is a plan's selling price actually overridden?
- **Return / exchange semantics are entirely absent** — cancellation, proration, refund of plans on a return.
- Is a plan strictly order-scoped?

### 05 Collections Activity Log

- **The list of logged change types is missing from the published article.**
- Does the Comments panel honour the date range, or always show all comments?
- Are comments editable or deletable after entry?
- Is the comment author recorded and displayed?
- Report layout: columns, ordering, grouping.

### 06 Read-Only Lookup Window

- Is the list filterable/searchable in-window?
- Which columns display per lookup binding?
- Does it respect per-file user permissions?
- Sort order?

## Cross-cutting

- **Output Settings** is referenced by 05 and is a shared STORIS control (Screen, Printer, and other destinations depending on routine). Worth dissecting once and reusing.
- **Actions button** is a recurring STORIS pattern — a per-screen contextual menu. Model it as a first-class UI concept rather than ad-hoc buttons.
- Several screens are **context-sensitive** (field locked or inactive depending on entry point: 01, 03, 05). Whatever screen abstraction the repo uses should support an entry-context parameter.
