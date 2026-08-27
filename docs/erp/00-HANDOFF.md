# LA Mattress ERP — Sales Processing Handoff

**Purpose.** This directory is the specification Claude Code works from when building the Sales
Processing half of the LA Mattress ERP as a replacement for STORIS. It is a _reverse-engineered
behavioural spec_: every rule here was extracted from STORIS' own operator documentation
(see `SOURCES.md`), so it describes how the incumbent system actually behaves, not how we wish
it behaved.

**Read order for a fresh Claude Code session**

1. `00-HANDOFF.md` (this file) — rules of engagement, phase plan
2. `01-domain-model.md` — entities and fields
3. `02-state-machines.md` — every lifecycle and status transition
4. Then the module file for whatever phase you are on (`03`–`09`)
5. `10-security-permissions.md` and `12-acceptance-tests.md` before writing any code that touches money
6. `13-open-questions.md` — do not invent answers to these; ask

## Rules of engagement for Claude Code

- **Discover conventions before writing.** This spec is deliberately stack-agnostic. On first run,
  read the existing repo: package manifest, migration/schema directory, existing router or
  controller layout, test framework, lint config. Match what is already there. Do not introduce a
  new ORM, validation library, or test runner without asking.
- **`[DOC]` vs `[INFER]` vs `[DECIDE]`.** Every non-obvious statement in these files is tagged.
  `[DOC]` = documented STORIS behaviour, implement as written. `[INFER]` = our reading of behaviour
  that the docs imply but never state; implement but leave a `// SPEC:INFER` comment. `[DECIDE]` =
  a deliberate LA Mattress departure from STORIS or a gap STORIS never documented; **stop and ask
  before implementing.**
- **Money is integer minor units.** No floats anywhere in pricing, tax, tender, commission, or
  settlement. Quantities are decimal — STORIS sells fractional units (an eighth-yard product
  displays as `0.125`), so quantity is `decimal(12,4)`, not an integer.
- **Never delete financial history.** Voids, reversals, and adjustments are new rows. The one hard
  STORIS lesson encoded throughout: once a tender is authorized, the order must be persisted before
  anything else happens, or the authorization is orphaned.
- **Every rule gets a test.** `12-acceptance-tests.md` lists the scenarios that must pass. A rule
  implemented without its test is not done.
- **Ask rather than guess on enum domains.** STORIS' docs enumerate some code sets fully and others
  not at all. Where a domain is incomplete it is flagged; a guessed enum value that reaches
  production data is expensive to remove.

## Why this shape

STORIS' Sales Processing area is ~400 documented screens across five subsections. Its two
structural decisions are the ones worth copying, and they are the ones most home-grown retail ERPs
get wrong:

1. **The fulfillment is the unit of work, not the order.** An order is a container. Scheduling,
   delivery/installation charges, tax, ticket printing, completion, and invoicing all happen at the
   _fulfillment_ level. One order can carry many fulfillments with different methods, dates,
   destinations, and statuses; each completes independently and each carries its own totals.
2. **Completion is a gated event, not a status flip.** A fulfillment can only complete when a
   checklist of preconditions passes (scheduled date, merchandise reserved, no credit holds, ticket
   printed). Completing splits the order: the completed fulfillment becomes an invoice, the rest
   stays open, and the linkage between them survives.

Everything else — deposits, financing, commissions, the Up System — hangs off those two.

## Phase plan

Each phase is independently shippable and leaves the system usable. Do not start a phase before its
predecessor's acceptance tests pass.

| #   | Phase                       | Delivers                                                                                                                    | Spec files       |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 0   | Foundations                 | Customer, product read-model, store/location, user & permission scaffold, money/quantity primitives, audit log              | `01`, `10`       |
| 1   | Order + fulfillment core    | Create/edit/view an order; lines; multiple fulfillments; the cardinality and transition rules; no money yet beyond subtotal | `01`, `02`, `03` |
| 2   | Pricing, discounts, tax     | Price hierarchy, discount codes, coupons, per-fulfillment charges, tax by jurisdiction                                      | `04`             |
| 3   | Tender + deposits           | Payment summary, cash/check/gift, deposit liability, minimum-deposit calculation, refund limits                             | `05`             |
| 4   | Card processing             | Auth/decline handling, terminal assignment, masking/encryption, pre-auth deposits, receipt reprint, abandoned-auth recovery | `05`             |
| 5   | Completion + invoicing      | Precondition gate, completion detail, exceptions, back-order chain, partial completion, rescheduling                        | `03`, `02`       |
| 6   | Returns & exchanges         | Return, exchange (sale + return halves), pro-rata delivery reduction, linked/chained orders                                 | `03`             |
| 7   | Financing                   | Applications, provider routing, plan types, authorization and re-authorization, financed balances                           | `06`             |
| 8   | Settlement + cash drawer    | Batching, transmit, one-step/two-step, error resubmit, blind balancing, manager approval, reconciliation                    | `07`             |
| 9   | Salesperson, Up System, CRM | Rotation queue, day-end, leads, activities, commission splits and calculation                                               | `08`             |
| 10  | Views & reporting           | Open-orders and open-lines operational grids, ATP columns, sales analysis report builder                                    | `09`             |
| 11  | Cutover                     | Extraction, mapping, reconciliation, dual-run, go-live                                                                      | `11`             |

**Sequencing note.** Phases 3–5 are where a partial build hurts most: an order that can take money
but cannot complete leaves real customer deposits in an unresolvable state. Do not ship phase 3 to
users without phase 5 behind it, even if the tests pass in isolation. `[DECIDE]` if you want to
sequence differently.

## What is deliberately out of scope here

Inventory/warehouse internals (reservation engine, ATP calculation, transfers, purchase orders,
WMS), merchandising (product setup, kits, configured products, COM), delivery routing and
manifesting, service orders, and general ledger. Sales Processing _calls into_ all of these and the
integration points are named where they occur, but their internals are separate specs.
