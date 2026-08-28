# Decision queue — everything waiting on the owner, in one sheet

Compiled 2026-08-28. The un-gated build queue is empty: every reconcile
is written (runs 01–06 + transfers, cash, report builder), the GL
program is live, and production is at migration head 0070. What remains
is gated on the answers and Ops items below. Answer any subset, in any
order — each one unlocks work the same day. Recommended defaults are
marked; silence keeps the default.

## A. Critical path (these gate the cutover schedule itself)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                             | Why it gates                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Kick off the STORIS exports** (checklist: `docs/STORIS-EXPORTS.md`)                                                                                                                                                                                                                                                                                                                                                            | Import rehearsal #1, recon, parallel run, go-live all sit behind the first files landing. Nothing I can do substitutes for this.                                                        |
| A2  | **Photograph the live STORIS config screens** + get the licence list (AWM, RF/WMS, EDI/3PL, routing vendor, alternate tax interface)                                                                                                                                                                                                                                                                                             | Six audit findings show licences change base behavior; the docs alone can't tell us what your installation actually does. Also answers run-06's four login checkboxes and run-04 §4 Q1. |
| A3  | **Payment gateway identity** — Shift4 legacy vs the new gateway; are stored card tokens portable?                                                                                                                                                                                                                                                                                                                                | Decides whether recurring/stored-card customers survive cutover or must re-key cards.                                                                                                   |
| A4  | **Order Stripe Terminal readers** (or confirm the interim standalone terminal)                                                                                                                                                                                                                                                                                                                                                   | Counter hardware lead time.                                                                                                                                                             |
| A5  | **Commission rules + financing provider list** (+ 5 historical examples to validate)                                                                                                                                                                                                                                                                                                                                             | Commission accrual and financing tender are built; they need your real plan values.                                                                                                     |
| A6  | **Two sample invoices into `docs/`**                                                                                                                                                                                                                                                                                                                                                                                             | Unblocks the document templates.                                                                                                                                                        |
| A7  | **Is Third-Party Accounting (TPA) active in your STORIS?** (run-07 F665)                                                                                                                                                                                                                                                                                                                                                         | TPA changes the PO lifecycle (receipt no longer closes a PO) and disables bank reconciliation + payment files — it decides what the legacy data even means.                             |
| A8  | **Run the closeout's four captures** (AUDIT-CLOSEOUT §next-steps 1–4): the three access reports (`Report on User Security`, `Report on Menu Access`, `Staff Location Restriction Review`), the **STORIS data dictionary** Excel from the customer site, the two audit opt-in lists, and the six config answers (gateway · platform Windows/AIX/SCO/HP · UniData version · TPA · `Standard Files` count · EOD-error notification) | Cheap, self-service, and together they are the entire configured access model + the schema behind every extract. The audit calls the data dictionary its highest-value artefact.        |
| A9  | **Alternate tax calculation codes** — read the three dropdowns on every Sales Tax record (run-07 F614); note the live **Twilight reason code** (F681) and card platform (Shift4 / Tender Retail / legacy, F708) while in there                                                                                                                                                                                                   | Alternate tax codes are STORIS-written custom logic that cannot be recovered from documentation — if any are set, we must get the logic from STORIS or derive it from behavior.         |

## B. Quick enables (feature is deployed; a value or yes/no turns it on)

| #   | Question                                                                                                  | Default if silent                            |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| B1  | **Cash tolerance $ and retry count** (from Accounting) — blind count ships live the moment values are set | Discipline stays **off** (legacy free close) |
| B2  | **Fiscal calendar** — GL presumes calendar months, period 13 = year-end                                   | Calendar months stand                        |
| B3  | **Crew load sheet** — should delivery crews see prices? Today: no                                         | No prices                                    |

## C. Build decisions — sales (run-03 §4)

| #   | Question                                                                                 | Recommendation                                                    |
| --- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| C1  | Trade/customer pricing tiers (contractors, hotels, staff)?                               | Default: list price + discount codes                              |
| C2  | POS "set the final total" out-the-door entry (recorded as a discount, detail preserved)? | Your call                                                         |
| C3  | Tax-exempt / resale-certificate customers?                                               | Default: not built                                                |
| C4  | **Customer merge tool** before cutover dedupe                                            | **Recommended: yes**                                              |
| C5  | Membership rewards: run in Jetnine / convert balances to store credit / drop             | Need an answer either way — even "drop" needs the balance extract |

## D. Build decisions — service (run-05 §4)

| #   | Question                                                                                                | Recommendation                                                                     |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| D1  | **Payer axis** (customer/factory/extended/other) + **problem codes** on service orders                  | **Recommended: yes, lean** — keeps protection-plan P&L and product-failure signals |
| D2  | In-home service calls? Customer property taken into the shop (COG)?                                     | If no/no, current model stands                                                     |
| D3  | Ask the service team: do they work off tickles/call lists, and did they use the unlogged envelope icon? | Decides an EOD call-back-list job; calibrates migrated contact history             |

## E. Build decisions — remaining odds and ends

| #   | Question                                                                              | Default if silent                       |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| E1  | Transfer security tables (restrict moves per location pair)?                          | Role-based `transfers.manage` is enough |
| E2  | PO types as policy bundles (run-02 Q2)?                                               | Direct-ship flag is enough              |
| E3  | Open To Buy budgets (run-02 Q3)?                                                      | Skip                                    |
| E4  | AP payment operations (check runs, EFT, positive pay — run-01 Q2)?                    | Manual payment recording stands         |
| E5  | Layaway statements (run-01 Q5)?                                                       | Not built                               |
| E6  | Multi-leg transfer flow chart — the STORIS page is an image; needs a human to view it | Skip multi-leg                          |
| E7  | UniData version (for export tooling)                                                  | —                                       |

## F. Ops sessions to schedule (people, not code)

- **Warehouse SOP walkthrough** (run-04 §4 Q2) — picking, damage,
  staging, truck loading as they actually happen; no-scanning cutover
  keeps these as procedure. While there: ask how many STORIS
  manifest-removal exceptions were really pick-list reprints (run-06
  F330) to calibrate legacy exception history.
- **Service workflow walk** with the team (covers D2/D3).
- **STORIS daily-routine script** — becomes the parallel-run QA script.

When answers arrive, record them in the owning reconcile's "Decisions
received" section (doc-first, per house rule) and the build resumes as
vertical slices.
