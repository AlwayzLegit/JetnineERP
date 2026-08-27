# LA Mattress ERP — STORIS Inventory & Purchasing Parity Handoff

**Audience:** Claude Code, working in the LA Mattress ERP repo.
**Source of truth for this pack:** STORIS Help Center → _Frequently Asked Questions → Inventory_ section
(10 FAQ articles, captured 2026-08-27). Every requirement below traces to a specific FAQ answer.

## What this pack is

The STORIS Inventory FAQ section is not a feature list — it is a list of the things real furniture/mattress
retailers actually hit in production and had to ask about. That makes it an unusually good parity checklist:
if our ERP can answer all 55 of these questions with a real screen or routine, we can run the business off it.

This pack converts every FAQ answer into implementable requirements with stable IDs, and gives you a
coverage matrix to audit the existing codebase against.

## How to work this pack

1. **Read `00-coverage-matrix.md` first.** It lists all 55 source FAQs and their requirement IDs.
2. **Audit before you build.** For each requirement, search the repo for an existing implementation.
   Record the verdict in the matrix as `DONE` / `PARTIAL` / `MISSING` with a file path. Do not assume
   MISSING — this codebase already has substantial ERP surface area.
3. **Then build**, domain file by domain file (`01`–`08`), in the order given. The order is dependency-driven:
   settings and the item/costing model come before the routines that read them.
4. **`09`–`11` are cross-cutting.** Every control setting, security flag, and report named anywhere in this
   pack is registered there. Implement them as you hit them, not as a separate phase.
5. **`12` is the cutover plan**, `13` is the acceptance test suite. Nothing ships without its acceptance tests.

## Rules for this work

- **Stack-agnostic by design.** This pack names no framework, ORM, or language. Discover the repo's existing
  conventions (routing, service layer, migrations, test runner, naming) and follow them exactly. If the repo
  has a documented architecture doc or CLAUDE.md, that overrides any structural suggestion here.
- **Parity, not cloning.** We match STORIS _behavior and business rules_, not its screen names or its 1980s
  MultiValue data model. Where this pack says "Enter a Stock Adjustment", that is the STORIS routine name,
  given so you can trace back to the source doc. Name our version whatever fits our conventions — but
  **keep a `storis_ref` note in the code doc comment** so parity is auditable later.
- **Every inventory-moving operation writes an immutable ledger row.** No exceptions. See `01`.
- **Every requirement gets a test.** See `13`.
- **Ask before inventing business rules.** Where this pack says `[DECISION NEEDED]`, stop and surface it —
  do not pick a default silently.

## Requirement ID scheme

| Prefix  | Domain                                                      |
| ------- | ----------------------------------------------------------- |
| `ITEM-` | Item master, hierarchy, attributes, images                  |
| `COST-` | Costing, landed freight, cost exceptions                    |
| `LOC-`  | Locations, warehouses, storage locations, location tracking |
| `STK-`  | Stock adjustments, statuses, availability                   |
| `PHYS-` | Physical inventory                                          |
| `PO-`   | Purchase orders                                             |
| `RCV-`  | Receiving                                                   |
| `REPL-` | Replenishment                                               |
| `RTN-`  | Returns and exchanges                                       |
| `RTV-`  | Return to vendor                                            |
| `XFR-`  | Transfers                                                   |
| `CFG-`  | Control settings                                            |
| `SEC-`  | Security / permissions                                      |
| `RPT-`  | Reports and views                                           |
| `MIG-`  | Cutover / migration                                         |

## File map

| File                           | Contents                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `00-coverage-matrix.md`        | All 41 source FAQs → requirement IDs → audit column                                    |
| `01-item-model-and-costing.md` | Product hierarchy, pricing resolution, costing, landed freight, cost exceptions        |
| `02-inventory-management.md`   | Locations, statuses, availability math, stock adjustments, special orders, consignment |
| `03-physical-inventory.md`     | Freeze → count → reconcile → clear lifecycle                                           |
| `04-purchase-orders.md`        | PO entry, special order POs, multi-location distribution, hold, close, delete          |
| `05-receiving.md`              | Receiving, reversal, over-receipt, separate freight bill / container receiving         |
| `06-replenishment.md`          | Back-order-needs, sales-rate, and automatic replenishment                              |
| `07-returns-exchanges-rtv.md`  | Returns, exchanges, split exchange, return to vendor                                   |
| `08-transfers.md`              | Manual, paperless, multi-leg, floor sample, auto transfers                             |
| `09-control-settings.md`       | Registry of every control setting named in the pack                                    |
| `10-security-permissions.md`   | Registry of every permission flag named in the pack                                    |
| `11-reports-and-views.md`      | Registry of every report/inquiry named in the pack                                     |
| `12-cutover-plan.md`           | STORIS → LA Mattress ERP data migration and go-live sequence                           |
| `13-acceptance-tests.md`       | Test cases, one or more per requirement                                                |

## Source articles

All under `https://storis.zendesk.com/hc/en-us/sections/36207383903508-Inventory`:
Inventory Costing · Inventory Management · Physical Inventory · Purchase Order ·
Purchase Order Receiving · Purchase Order Replenishment · Purchase Order Reports ·
Return to Vendor · Returns and Exchanges · Transfers
