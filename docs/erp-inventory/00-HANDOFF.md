# HANDOFF — STORIS Inventory Management parity pack

**For:** Claude Code, working in the LA Mattress ERP repo
**Scope:** STORIS ERP → _Inventory Management_, four sub-sections, **196 of 196 articles dissected**
**Purpose:** implement the same operational process in LA Mattress ERP, and be able to prove it matches

---

## 1. What is in this pack

| File                                  | Contents                                                                                                                                                                                                                                                        | Lines |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `sections/01-fulfillments.md`         | 27 articles — scheduling, routing, mapping interfaces, manifests, truck load, completion, direct ship. Ends with a section synthesis: lifecycle, entities, state machine, rules **R-F1…R-F48**, config surface, integrations.                                   | 1,855 |
| `sections/02-inventory.md`            | 44 articles — receiving, costing layers, serial/piece identification, put-away, labels, stock adjustments (12 tabs), as-is, twilight, RTV, write-off, mass updates, physical inventory. Synthesis: quantity buckets, piece state machine, rules **R-I1…R-I68**. | 2,562 |
| `sections/03a-views-reports-part1.md` | Articles 0–51 — on-screen views, inquiries, selection windows, WMS grids, Kardex. Synthesis: catalog, derived metrics **M1–M28**, reporting data model.                                                                                                         | 2,566 |
| `sections/03b-views-reports-part2.md` | Articles 52–102 — 47 printed reports + 4 screens. Synthesis: catalog, derived metrics **M53–M83**.                                                                                                                                                              | 1,978 |
| `sections/04-transfers.md`            | 22 articles — transfer entry, distribution, multi-leg, scheduling, transfer manifests, RF receiving phantom, as-is/floor-sample/stock transfers. Synthesis: lifecycle, state machine, in-transit model, rules **R-T1…**.                                        | 2,140 |
| `05-cross-cutting-model.md`           | The unified domain model across all four sections: canonical entities, the quantity-bucket ledger, the combined state machines, the configuration surface, and the integration surface. **Read this first.**                                                    | —     |
| `06-build-order.md`                   | Phased implementation plan with exit criteria per phase.                                                                                                                                                                                                        | —     |
| `07-parity-checklist.md`              | Executable parity tests keyed to rule IDs. This is the definition of done.                                                                                                                                                                                      | —     |
| `08-open-questions.md`                | 60+ documented ambiguities. Each one is a place where STORIS behaviour must be confirmed against the live system **before** code is written, not guessed at.                                                                                                    | —     |
| `99-source-index.md`                  | Every source article with its URL, so any claim can be traced back.                                                                                                                                                                                             | —     |

Every rule, field and metric carries a stable ID (`R-F*`, `R-I*`, `R-T*`, `M*`). Use those IDs in code comments, commit messages and test names so parity is traceable both ways.

---

## 2. How to work with this pack

1. **Read `05-cross-cutting-model.md` before touching code.** The four sections describe one system from four angles; implementing them independently will produce four incompatible inventory models.
2. **Discover the repo's own conventions first** — language, framework, migration tool, test runner, module layout, naming. This pack is deliberately stack-agnostic. Follow what the repo already does; do not introduce a new pattern because a doc example suggested one.
3. **Do not invent behaviour.** Where STORIS documentation is silent or contradictory, `08-open-questions.md` says so. Implement the documented part, leave a `TODO(parity: Q-nn)` at the gap, and surface it — do not fill it with a plausible guess. A wrong guess in inventory quantities is expensive and silent.
4. **Keep STORIS names in the domain layer.** `Fulfillment Status`, `Quantity Reserved`, `Not Completed Location`, `ROUTE.EXCEPTION`. Staff already speak this vocabulary and will be reconciling the two systems side by side during cutover. Rename at the UI boundary if desired, never in the model.
5. **Every stock movement is an event, not an update.** See §3 of the cross-cutting model. STORIS's Kardex, physical-inventory audit trail and adjustment history all assume an append-only movement ledger. Retro-fitting one later is a rewrite.
6. **Write the parity test with the feature**, not after. `07-parity-checklist.md` gives the cases.

---

## 3. The one-paragraph summary of the domain

Stock exists as **pieces** (serial or system-assigned reference) or as **bulk quantity**, held at a **warehouse/store location** and, where the location is location-tracked, in a **storage location (bin)**. Quantity is partitioned into named buckets — on hand, reserved, on P/O, as-is, twilight, in transit, frozen, counted — and _every_ process in this pack is ultimately a rule about moving quantity between those buckets. Demand arrives as **order lines**, which are grouped into **fulfillments** (one order may have several). A fulfillment carries a method, a status, a date and a route; scheduling moves it `ASAP/CWC → EST → SCH`; only `SCH` fulfillments may be routed and manifested. A **manifest** is a day's work for a route or truck; completing it is the event that actually relieves inventory, applies COD payments, creates back orders for what was not delivered, and writes exceptions. **Transfers** move stock between locations through the same manifest machinery, with an in-transit period during which downstream legs may already reserve the goods. Everything else in the pack — views, reports, Kardex, physical inventory — reads that same ledger.

---

## 4. Non-negotiables

- **Available quantity must be defined explicitly and in one place.** STORIS never states its formula (see `08-open-questions.md` Q-I1) yet gates twilight adds, mass updates and ATP on it. Pick a definition, write it down, put it behind a single function, and reconcile it against STORIS output before go-live.
- **Costing layers are created at receipt and consumed at relief.** Receipt writes a costing layer with cost + PO reference + AP-bill link; valuation reports offer Exact / Average / Replacement / Average-with-exact-add-on, and special-order stock is _always_ exact cost (`M60`). Model the layer, not just an average cost field.
- **Reserved ≠ available ≠ on hand.** Three separate numbers, three separate movement rules. Most parity bugs in an inventory cutover live here.
- **Physical inventory freeze/count/update is a three-phase batch with its own exception reports** — commitment exceptions, as-is exceptions, exclusions, audit trail. It is not a bulk edit.
- **Nothing that touches quantity may be a soft delete or an in-place mutation.** Reversals are new movements.
