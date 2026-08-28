# 14 — Build Plan & Open Decisions

## Before writing code

Run a discovery pass on LA-Mattress-ERP and write down the answers — the rest of this plan assumes it:

- What already exists for **Location**, **Product**, **Inventory piece / serial**, **Storage
  Location**, **Route**, **Manifest**, **Sales Order**, **Purchase Order**? Transfers should attach to
  those, not duplicate them.
- What is the existing **permission** mechanism? The capability catalog in `03-permissions.md` must
  slot into it.
- What is the existing **background job / worker** mechanism? Needed for the receiving worker, EOD
  replenishment, and EOM group-sales rebuild.
- What is the existing **document numbering** mechanism, and does it already handle partial-invoice
  suffixes?
- What is the existing **audit log** mechanism?
- Is there already a **security override** flow anywhere in the app?

---

## Phase 1 — Foundations (no UI)

- Transfer + TransferLine schema, enums, line status flag set.
- Transfer lifecycle state machine with the completion gates from `01-domain-model.md` §5.
- Back-order sequence + suffix encoder (52 max, warn at 48 and 52).
- Reference tables: distribution location schema, transfer schedule period days, transfer security
  (both keyings).
- Capability catalog + security override flow + override audit write.
- Settings surface for everything in `02-settings.md`.

Tests: sections **A, B, C (11–15), F, U** of `13-acceptance-tests.md`.

## Phase 2 — Transfer entry

- One entry screen with a `lockedType` parameter serving all five variants.
- General + Merchandise tabs, all fields and activation rules.
- Hold/scheduled-quantity behavior.
- Product eligibility, location eligibility, store↔store rule.
- Carton quantity confirmation modal with the five-way permission mapping.
- Route capacity warning with the increase-only rule.
- Build From Storage Location + Select As-Is Pieces.
- Hard-kit master/component expansion.
- Comments and audit log wiring.

Tests: **C, D, E, G, H, R, S**.

## Phase 3 — Distribution & multi-leg

- Distribution lists / List Entry.
- Even fan-out distributed transfers.
- Group Sales aggregate + EOM rebuild job.
- Distributed-quantity allocation (settle the rounding decision first).
- Transfer Distribution Quantity screen, both source modes.
- One-time-buy PO product-class lock + receipt notification.
- Distribution location schema evaluation, leg creation, `T`/`X` linking.
- Transit-day resolution order.

Tests: **I, J, K, L**.

## Phase 4 — Manifesting

- Schedule and Build a Transfer Manifest: search panel, grid, load numbers, append semantics.
- Add Individual Transfer with its four named validation failures.
- Complete the Transfer Manifest Process incl. Order Completion Details, exceptions store, the two
  system-written order comments.

Tests: **M, N**.

## Phase 5 — Receiving

- Initialize / scan / complete flow.
- Pending transaction table + worker with the three-state status.
- Review console with per-row inspection and removal.
- Label printing incl. cross-dock counting.

Tests: **O**.

## Phase 6 — Scheduling, replenishment, inquiries

- Transfers Eligible for Date Re-Scheduling with in-transaction re-validation.
- Replenish Assigned Stock Levels + EOD hook, sharing one engine.
- View Inbound / View Outbound (aliased as Open Transfer Inquiry (Out)) / View a Merchandise Transfer.
- Product Quantity in Excess of Transfer Quantity.
- Report Transfers by Location, Transfer List Report, Report on User Security.

Tests: **P, Q**, plus inquiry coverage.

---

## Open decisions — get answers before the phase that needs them

| # | Decision | Needed by |
| --- | --- | --- |
| 1 | **Distributed-quantity rounding reconciliation.** The published example rounds half-up but the stated totals only balance if the total is reconciled back to the available quantity. Confirm the exact rule and lock it with the A/B/C = 1/8/6 fixture. | Phase 3 |
| 2 | **Stock-level model for replenishment** (min/max vs assigned level, source-location selection). Reuse whatever the existing PO-replenishment work in this repo already defines. | Phase 6 |
| 3 | **Multi-leg flow chart.** The source page is a diagram with no text; confirm the visual decision order against the eligibility rules in `07-multi-leg-transfers.md`. | Phase 3 |
| 4 | **Override audit uniformity.** STORIS records most overrides but explicitly not all. Recommend recording every override; confirm. | Phase 1 |
| 5 | **Do we need the type-locked menu variants at all**, or is a single Enter a Transfer screen with an editable Type sufficient for LA Mattress? The variants exist mainly to constrain warehouse staff. | Phase 2 |
| 6 | **Mapping / truck integration.** Several behaviors (Truck field activation and mandatory-ness, Route→Truck relabeling) hinge on third-party mapping being active per location. Confirm whether LA Mattress uses mapping at all — if not, a large slice of conditional UI drops out. | Phase 2 |
| 7 | **Distribution lists** — are named reusable lists needed, or is ad-hoc multi-select enough? | Phase 3 |
| 8 | **RF hardware.** Is there actual handheld scanning, or is receiving done on a tablet/desktop? The pending-transaction worker is worth building either way; the scanner keypad flow may not be. | Phase 5 |
| 9 | **Cross-docking** — in scope? | Phase 5 |
| 10 | **EDI 214 / third-party logistics** — in scope? | Phase 2 |

---

## Deliberate simplifications worth proposing

These are places where the STORIS behavior is legacy-shaped and LA-Mattress-ERP could do better. Raise
them rather than reproducing them blindly:

- **Print Transfer Ticket gating completion.** Requiring a ticket print before completion is a
  paper-era constraint. Consider making it configurable.
- **The 52 back-order cap** is a data-format artifact (single-letter suffix, A–Z + a–z). A modern
  schema does not need the cap; keep the warning thresholds, drop the hard ceiling.
- **Four separate carton-override permissions by location-type pair** is fine-grained to the point of
  being unusable. Consider one permission plus an optional per-pair restriction.
- **Load number non-sequentiality** is a documented wart. Make load numbers stable and derived.
- **"Same process, different location scope"** for replenishment should be literally one code path.
