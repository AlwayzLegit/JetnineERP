# Handoff: STORIS "Selling Location" and its linked screens

**For:** Claude Code, working in the LA Mattress ERP repo.
**Produced from:** the STORIS Zendesk help center, read on 2026-08-27.
**Stack:** none prescribed. Discover the repo's existing conventions (module layout, data layer, UI component patterns, validation approach, test framework) and follow them.

---

## What this covers

The starting point was one article — **Selling Location** (STORIS ERP > Merchandising) — plus every article linked from it.

| #   | Screen                           | STORIS area                    | File                                     |
| --- | -------------------------------- | ------------------------------ | ---------------------------------------- |
| 1   | Selling Location                 | Merchandising / EDI purchasing | `01-selling-location.md`                 |
| 2   | EDI Advanced Ship Notice Dates   | Merchandising / EDI purchasing | `02-edi-asn-dates.md`                    |
| 3   | Special Order Information Window | Merchandising / product data   | `03-special-order-information-window.md` |
| 4   | Protection Plan Selection        | Sales Processing / POS         | `04-protection-plan-selection.md`        |
| 5   | Collections Activity Log         | Accounting / Collections       | `05-collections-activity-log.md`         |
| 6   | Read-Only Lookup Window          | Shared UI pattern              | `06-read-only-lookup-window.md`          |

## Read this before you start

**These five screens are not one feature.** Items 2–5 come from the "Related articles" block on the Selling Location page, which is Zendesk's automatic recommendation engine, not a STORIS functional grouping. Protection Plan Selection and Collections Activity Log have no relationship to EDI purchase orders at all.

Treat this as **four independent tracks plus one shared control**:

- **EDI purchasing** — Selling Location (01), EDI ASN Dates (02). These two genuinely belong together: both hang off a purchase order with an EDI-active vendor.
- **Product / special order data** — Special Order Information Window (03). Touches purchase order entry but is really about product attribute capture.
- **Point of sale** — Protection Plan Selection (04). Largest and most behaviorally complex screen in the set.
- **Collections** — Collections Activity Log (05). An audit-log viewer/report.
- **Shared UI** — Read-Only Lookup Window (06). Build this first; three of the other five depend on it.

## Ground rules for implementation

1. **Everything unmarked is transcribed from the STORIS docs.** Lines marked `[INFERRED]` are my reading, not the source — confirm with the user or against a live STORIS instance before you build on them.
2. **Do not invent the neighbours.** These specs reference STORIS screens that are not dissected here (`Enter a Purchase Order`, `Enter a Sales Order`, `Point of Sale Control Settings`, `Vendor EDI Settings`, `Advanced Product Settings`, and others). Where you need one, define a narrow interface, stub it, and log it in `99-open-questions.md`. Do not guess its fields.
3. **The STORIS docs are field-reference articles, not requirements.** They describe what a field does, rarely what happens on error, never what the persisted schema looks like. Schema sections here are explicitly inferred.
4. **Suggested build order:** 06 → 01 → 02 → 03 → 05 → 04. Protection Plan Selection last; it is the only one with real algorithmic content and it depends on settings screens we do not have yet.

## Conventions used in these files

- **Access path** — the STORIS navigation that reaches the screen, verbatim.
- **Fields** — one heading per field, with the source description and any derived rules.
- **Behavior rules** — numbered, testable statements. These are what your acceptance tests should assert.
- **Data model** — always `[INFERRED]`.
- **Open questions** — anything the source left undefined. Roll these up into `99-open-questions.md` as you resolve them.
