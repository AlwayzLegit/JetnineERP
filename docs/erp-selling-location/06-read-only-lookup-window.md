# 06 — Read-Only Lookup Window (shared UI pattern)

**Source:** https://storis.zendesk.com/hc/en-us/articles/15294753602068-Read-Only-Lookup-Window
**STORIS area:** STORIS ERP > System Administration > System Administration Views and Reports
**Build first.** Referenced by `01`, and by hundreds of STORIS screens beyond this handoff.

> Note on provenance: the Selling Location article links to this window, but the link in the published page has an empty href. The article was located by search. If you re-verify, use the URL above rather than clicking through.

---

## What it is

A generic pop-up picker. Read-Only lookup windows display the records contained in the **file maintenance routine associated with the current lookup window**, and allow you to choose one from the list as a response to the current prompt.

The source's own example:

> if the current field is named **Salesperson**, and you click on the Search button next to the field, a pop-up window named **Salesperson - Read Only** would appear listing all of the salespersons in your Salesperson file.

Two conventions fall straight out of that:

- **Naming:** the window title is `<Field Name> - Read Only`.
- **Binding:** each lookup is bound to the file maintenance routine that owns the underlying list. The lookup does not own its data.

## The read-only contract

> You can choose an item from the read-only list, but **you cannot create and enter a new response.** To edit the list of records in a read-only window, access the file maintenance routine associated with the current lookup. For example, if the name of the lookup is Terms Code, you can edit the list via the **Terms Code File** routine.

This is the defining constraint. No inline create, no inline edit, no "add new" affordance. Maintenance is a separate routine, always.

Free typing into the field itself is still allowed — the source frames the lookup as the alternative:

> While you can enter your response directly into the field, sometimes it is quicker and more accurate to choose from the lists provided by Read-Only lookup windows.

## Interaction

> You can use the **up and down arrows** to navigate the list in the grid. If more records exist than can fit in the grid, you can use the **scroll bar** on the right side of the grid to view additional records. When you locate the desired record, **highlight it and press Enter**. You can also **double-click** on the record to select it.

## Behavior rules

1. Opened by the Search button adjacent to a field.
2. Titled `<Field Name> - Read Only`.
3. Lists all records from the file maintenance routine bound to that field.
4. Selection only — no create, no edit, no delete.
5. Keyboard: up/down arrows navigate, Enter selects the highlighted row.
6. Mouse: double-click selects.
7. Overflow is handled by a scroll bar on the right of the grid.
8. The bound field remains directly typeable; the lookup is an alternative input method, not a replacement.

## Implementation note `[INFERRED]`

Build this once as a parameterised component: `(sourceRoutine, titleField, columns, onSelect)`. Given how many STORIS screens invoke it, a per-screen reimplementation will not scale. Selling Location (`01`) is its first consumer in this handoff; the STORIS docs show it used for banks, GL accounts, locations, terms codes, salespeople, tax jurisdictions, and much more.

## Acceptance criteria

- Clicking Search next to a bound field opens a window titled `<Field Name> - Read Only`.
- The window lists every record from the bound maintenance file.
- No create/edit/delete affordance is present.
- Arrow keys move the highlight; Enter selects and closes.
- Double-click selects and closes.
- The list scrolls when records exceed the visible grid.
- The value selected populates the originating field.
- Typing a valid value directly into the field, without opening the lookup, is still accepted.

## Open questions

- **Is the list filterable or searchable** within the window? Not mentioned — for large files (customers, products) an unfiltered list is impractical, so STORIS likely has a separate search screen for those (`Search for a Customer` appears in `05`). Confirm which fields use a lookup vs. a search screen.
- **Which columns display** per lookup? Presumably defined per binding. Not stated.
- **Does it respect user permissions** on the underlying file? Not stated.
- **Sort order?** Not stated.
