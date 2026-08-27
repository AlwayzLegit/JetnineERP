# Transfers — Claude Code Handoff (LA-Mattress-ERP)

Dissection of the STORIS help center **Inventory Management → Transfers** section (all 22 articles)
plus the linked articles that the section depends on. Target: rebuild equivalent capability in
**LA-Mattress-ERP**.

## How to use this handoff

1. Read `01-domain-model.md` first. Everything else hangs off those entities.
2. Before writing code, **discover the repo's own conventions** — ORM/model layout, migration tool,
   service/command layer, permission checks, background jobs, test framework, naming. This handoff is
   deliberately stack-agnostic. Do not introduce a new pattern where one already exists.
3. Implement in the phase order in `14-build-plan.md`. Each phase is independently shippable.
4. `13-acceptance-tests.md` is the definition of done. Every scenario there must have a real test.
5. Anything marked **[DECISION]** needs a human answer before that piece is built. Collect them and
   ask in one batch rather than guessing.

## Scope covered

| Area | File |
| --- | --- |
| Entities, enums, state machines | `01-domain-model.md` |
| Configuration / control settings | `02-settings.md` |
| Permissions & security tables | `03-permissions.md` |
| Transfer entry screen | `04-transfer-entry.md` |
| Transfer type variants (As-Is, Floor Sample, Move to As-Is, Stock, Auto) | `05-transfer-variants.md` |
| Distributed & distributed-quantity transfers, one-time-buy | `06-distributed-transfers.md` |
| Multi-leg transfers (demand + logistics) | `07-multi-leg-transfers.md` |
| Manifests: schedule, build, complete | `08-manifests.md` |
| Receiving (RF/barcode + phantom worker) | `09-receiving.md` |
| Auto stock replenishment | `10-replenishment.md` |
| Rescheduling & route capacity | `11-scheduling.md` |
| Inquiries & reports | `12-inquiries.md` |
| Acceptance tests | `13-acceptance-tests.md` |
| Phased build plan & open decisions | `14-build-plan.md` |
| Source article index | `15-source-index.md` |

## Vocabulary note

STORIS terms are kept verbatim in this handoff so it can be checked against the source docs. When
implementing, map them to whatever LA-Mattress-ERP already calls these things (e.g. if the repo says
`Location` rather than `Warehouse/Store`, use `Location`). Keep a single glossary file in the repo and
do the renaming once, at the boundary — do not half-translate.

Key terms:

- **Transfer** — a document moving inventory pieces between two locations.
- **Leg** — one transfer in a chain of transfers that together move a piece to its final destination.
- **Manifest** — a truck/route load: a set of transfer documents scheduled to physically move together.
- **Reserved** — a specific piece committed to a document. Transfers move reserved pieces.
- **Fulfillment** — the customer-facing delivery/pickup a transfer ultimately serves.
- **Phantom** — a background worker process (STORIS term). Map to the repo's job/queue system.
