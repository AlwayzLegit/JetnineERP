# Build order

Ten phases. Each phase has an exit criterion that is checkable, not a feeling. Do not start a phase until the previous one's exit criterion holds — the dependencies here are real, and the later phases silently produce wrong numbers if an earlier one is approximate.

---

## Phase 0 — Repo reconnaissance (no new code)

Read the existing LA Mattress ERP repo: language, framework, persistence layer, migration tool, test runner, module boundaries, existing product/order/location models, and whatever the Sales Processing handoff already established. Produce a short `PARITY-NOTES.md` mapping the entities in `05-cross-cutting-model.md` §1 to what already exists, what must be extended, and what is new.

**Exit:** a written mapping table, and a list of conflicts between this pack and existing models.

---

## Phase 1 — Locations, bins, products, pieces

Warehouse/store locations (with location-tracked and invisible-location-tracked flags, default storage locations, bank/accounts), storage locations with velocity + storage category, products with bulk/serialized/volume/handling-method/delivery-method, pieces with serial-or-reference identity.

**Exit:** a piece can be created at a bin; regional-processing restriction filters every location picker; bulk vs serialized behave differently at creation.

---

## Phase 2 — The movement ledger and bucket balances

Implement §3 of the cross-cutting model. Append-only movements, derived balances, reversal-by-new-movement, Kardex sign convention (`M23`, `M24`).

**Exit:** balances for all buckets are computable purely by replaying movements; a deliberately introduced correction produces two rows, never an edit. **Define `Available` here, in one function, and document the chosen formula** (Q-I1).

---

## Phase 3 — Receiving and costing layers

PO receipt, receipt without a PO, receipt with a separate freight bill (freight batches → landed cost → AP bill), receiving-error reversal, receiving schedule (daily/weekly/by group, trip/container/freight-load, confirmation numbers), serial + storage-location entry, bulk assignment (all-or-nothing), labels and the label queue.

**Exit:** a receipt writes a costing layer and a movement; on-order decrements; landed freight distributes by the configured basis (resolve Q-I2 first — the docs give two conflicting bases); valuation under Exact / Average / Replacement / Average-with-exact-add-on reproduces `M60`, with special-order always exact cost.

---

## Phase 4 — Adjustments, as-is, twilight, RTV, write-off, mass updates

The 12-tab stock adjustment (quantity, bin-to-bin, transfer, as-is transfer, as-is status, write-off, RTV, twilight …), as-is reason codes and their guards (`REP`, `NIL`→`RESEARCH`, in-service, As-Is Restricted + override), twilight add/remove, RTV list → print → complete, mass inventory updates with their exclusions (RF picking, `NIL`, floated, reserved).

**Exit:** every guarded transition in cross-cutting §4.3 is enforced and unit-tested; each adjustment writes the documented GL posting.

---

## Phase 5 — Routes, capacity, handling methods

Route master, route capacity calendar across four dimensions (stops / volume / units / dollars) with `Open`/`Full`/`Closed`, shared capacity codes, the routing capacity log with retention, handling methods with per-order-type priority and single-default enforcement, volume resolution hierarchy (R-F31).

**Exit:** scheduling onto a full day requires an override and writes a capacity-log row with previous/new/max for all four dimensions.

---

## Phase 6 — Fulfillments and scheduling

Fulfillment creation from order lines (multiple per order, combining prohibited — R-F5), the `ASAP/CWC → EST → SCH` machine, logistical scheduling and transaction update, ASAP/CWC triage, delivery-hold release, stop consolidation, delivery-charge recalculation, credit-hold gating, delivery ticket + pick-list flag rules (R-F24 … R-F30), `Restrict Scheduled Date` location-then-global evaluation with override.

**Exit:** the ticket-reprint rules pass as a table-driven test; a credit-held order cannot be scheduled; `SCH → EST` clears ticket **and** pick-list flags.

---

## Phase 7 — Manifests, loading, completion

Manifest build (auto and manual), stop detail, driver/delivery associate assignment, order lock while manifested, removal rules + reason codes + exception logging, truck load and truck-load stop detail, trailer volume, manifest completion → **Order Completion Details**, pieces-not-completed handling, COD payment application, serial confirmation, back-order creation with route reassignment, `ROUTE.EXCEPTION`, complete-multiple-manifests, direct ship.

**Exit:** a manifest completion moves stock, applies COD, creates the right back orders, writes exceptions, and is fully reproducible from the movement ledger. **Order Completion Details has no source article (Q-F11) — spec it against the live system before building.**

---

## Phase 8 — Transfers

Transfer entry (generic and As-Is / Floor Sample / Stock variants), line flags, distribution schema and distributed / distributed-quantity transfers, schedule period days, transfer security across locations, multi-leg resolution (the flow chart transcribed in `04-transfers.md`), transfer manifests, RF transfer-receiving phantom, special orders and one-time-buy on transfers, carton confirmation, excess quantity, re-scheduling eligibility.

**Exit:** the in-transit model in cross-cutting §5 holds end to end, including a downstream leg reserving goods that are still in transit; rounding for distributed quantities conserves the total (resolve Q-T2 — the docs contradict themselves).

---

## Phase 9 — Views, inquiries, Kardex

The on-screen half of the reporting surface: product search and word search, selection windows (one shared contract + per-window deviations), product/piece inquiries, as-is and special-order details, storage-location views, WMS grids, EDI logs, AWM performance and activity, Kardex (summary, regular, direct-ship, notes).

**Exit:** `M1–M28` reproduce exactly, including the distinction between `Net Available` (M1) and `Component Available` (M4) — do not conflate them.

---

## Phase 10 — Reports and physical inventory

The 47 printed reports, plus the freeze → count → update → clear physical-inventory cycle with its five exception reports (commitment, as-is, exclusions, duplicates, audit trail).

**Exit:** `M53–M83` reproduce exactly; physical inventory is a three-phase batch with its own audit trail, and a count shortage that cannot support a reservation raises a commitment exception rather than silently dropping it.

---

## Sequencing notes

- Phases 2 and 3 are the load-bearing ones. Everything downstream reads their output. Budget accordingly.
- Phases 6/7 and Phase 8 share the manifest machinery — build it once in Phase 7 and parameterise by manifest type.
- Phases 9 and 10 are the parity oracle: if a report disagrees with a screen, the ledger is wrong, not the report.
- Configuration (cross-cutting §6) is not a phase. Build the location-then-global precedence helper in Phase 1 and use it everywhere.
