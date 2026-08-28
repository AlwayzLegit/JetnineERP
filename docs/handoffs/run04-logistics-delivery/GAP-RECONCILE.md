# Run-04 Logistics/Delivery pack — gap reconcile vs shipped Jetnine

Authored 2026-08-28. Run 04 covered STORIS `Inventory Management` — the
physical-movement half of the ERP. A large share of its 126 findings
(F165–F290) was already consumed by builds this sprint and last: the
transfers pack reconcile (`docs/erp-transfers/GAP-RECONCILE.md`) covers
batch 8; the manifests build (Q1), delivery-ticket print pack, physical
inventory module, as-is/RTV intake, storage bins, and landed-cost lean
consumed batches 2, 5–6 (in part), 9 and 10. This reconcile adjudicates
what the run adds on top, area by area, and ends with a short owner/Ops
batch (§4). One framing note the run itself makes: **many findings are
conditional on licensed modules LA Mattress may not have** — the §4
licence question decides how much of this run even applies.

## 1. The ten headline findings, adjudicated

1. **The 22-code credit-hold catalogue (F201–F203)** — Jetnine has no
   credit-hold system to map it onto, deliberately: orders gate on
   balance/permission at the action (`orders.complete_with_balance`),
   exchanges carry the one entry hold (E1-style), financing is the
   provider's decision at tender time. The catalogue's value is
   entirely migration-side: **extract and resolve every open hold before
   cutover** (§3), because Jetnine will not represent them. `T1` (tax
   outage stops shipping) cannot occur — tax is computed in-process.
2. **Order-to-piece binding is deliberately loose (F218/F220/F239/F242)**
   — Jetnine agrees, by construction: reservations are *quantities*
   (B14, event-time at order open); serials bind at ship/fulfillment,
   not at entry; FIFO layers are cost pools, not piece bindings. A
   damaged pick is handled by picking a different unit — nothing in the
   data model prevents it, and no silent "replacement search" exists to
   document because none is needed. **Parity with the principle, minus
   the undocumented engine.**
3. **As-Is as the disposition hub (F280, F271–F279)** — **shipped
   parity**: `as_is_items` is exactly that hub — sources
   `return | warranty | defect | exchange_pickup | transfer` in,
   dispositions `restock | vendor_return | scrap` out, RTV gated on
   review, every restock priced (as-is variant layers). The STORIS
   sting in the tail — every as-is path restating written sales margins
   via cost exceptions (F144) — does not exist here: layer costs are
   immutable once written.
4. **The manifest's exclusive lock (F177/F170/F179)** — Jetnine keeps
   the useful half: manifested transfers cannot ship or cancel outside
   the manifest, removal needs a reason and is audited. It drops the
   harmful half: nothing becomes *inaccessible*, completion never
   silently drops an order (a failing transfer aborts the whole
   completion loudly), and there is no comment-only failure trace.
5. **Hold ⊥ reserved (F192, F168)** — parity by accident of good
   design: Jetnine's floor-sample/manual hold pool is a separate column
   from `reserved`, and availability is the one formula
   `onHand − reserved − floorSample`. The ten orthogonal scheduling
   flags collapse into explicit status + computed availability — the
   collapse the run warns about is safe *because* nothing else reads
   those flags.
6. **Physical inventory, eight phases, partly irreversible (F219–F222)**
   — Jetnine's physical-count module is the lean rebuild: freeze →
   blind count → variance → post. Nothing can block the freeze the way
   STORIS cost exceptions do (no cost-exception queue exists), the
   posting writes inventory movements + GL through the derivation
   family (`physical_count`), and counts are documents with statuses,
   not irreversible clears.
7. **Twenty access mechanisms = a convention plus five kinds (§E)** —
   the five *kinds* map cleanly: user permissions → the catalog;
   state-based locks → status guards (manifested transfers, placed POs,
   closed shifts); location-pair matrices → not built (transfers Q5,
   already owner-gated); value-attached restrictions → `reason_codes`
   carrying behavior (shipped: as-is-restricted-style gates); Regional
   Processing → membership location scopes, never inverted.
8. **Physical-world logic (F229/F239/F240/F244 — aisle locks, reverse
   stop time, floats, RF shuffle)** — deliberately not rebuilt. The
   owner's locked decision is **manifests-no-scanning**: Jetnine's
   warehouse interface is the printed load sheet and human process, so
   scanner vocabularies, aisle mutexes and float reconciliation have no
   software to live in. The run's real instruction survives as §4 Q2:
   these behaviors are *jobs people do*, and the cutover walkthrough
   must capture them as procedure, not software.
9. **EDI is an integration layer (F284/F287/F254/F172)** — not rebuilt;
   LA Mattress's external-dependency inventory is the run-07 batch-17
   integration registry (23 systems), which is exactly the
   "consolidated external-dependency inventory" this run demands. Any
   3PL/EDI reality lands there → §4 Q1.
10. **"The answer is a report a person works" (F290)** — Jetnine's
    posture is the opposite where it can be (gates and refusals:
    over-capacity blocks, invoice variance auto-clears in tolerance,
    unmapped GL keys refuse) and the same where a human should decide
    (exception_events, as-is review queue, matching reject bucket). The
    run's caution — each automated-away report is somebody's current
    job — goes to the cutover conversation, not the backlog.

## 2. Cluster sweep — the rest

- **Scheduling core (F165–F176)** — Jetnine deliveries: zip-driven
  route resolution, per-day stop/piece capacity caps with a
  permissioned override (the same one capacity-override permission the
  run finds on three document types). No two-record horizon, no
  ten-flag grid. Print-before-ship gates shipped for transfers (Q3) and
  delivery tickets.
- **Trucks/stops/routing vendors (F190–F200)** — routing-vendor
  integrations and shared trailer capacity not built; delivery runs
  carry the day's stops in order. Accepted lean for a single-market
  retailer.
- **Direct ship & interfaces (F204–F213)** — direct-ship POs shipped;
  bulk completion by vendor not built (accepted lean); fraud/alert-code
  subsystem n/a.
- **Barcode/AWM/RF/WMS (F214–F248)** — out of scope by locked decision
  (no scanning). If §4 Q1 reveals a licensed WMS/AWM at LA Mattress,
  that changes the cutover plan (whose process replaces it), not the
  build.
- **Receiving (F225–F228)** — partial receiving is first-class;
  over-receipt does **not** rewrite the PO (variance surfaces in
  invoice matching instead — deliberate anti-parity, the PO stays what
  was ordered); buyer notification via Messenger has no equivalent
  (webhooks/email are the channel if ever needed).
- **Adjustments & cost exceptions (F259–F270)** — stock adjustments
  shipped with reason codes and audit; the four-type cost-exception
  machine has no equivalent because costs never need restating. The
  Kardex ≈ `inventory_movements` (run-02 verdict stands; and ours is
  never partial — there is no setting that turns history off).
- **Landed cost (F271–F272)** — lean version shipped (PO freight →
  layer cost). Estimate/actual reconciliation loop and multi-currency
  not built; freight variance lands in invoice matching. Accepted lean.
- **Velocity/putaway (F229, F281–F290)** — storage bins shipped;
  directed putaway by velocity not built. Accepted lean for one
  warehouse.

## 3. Migration-time cautions adopted

1. **Resolve every open credit hold in STORIS before the order
   extract** (F201) — Jetnine has no hold field to carry them; an
   unresolved hold must become either a cancelled order or a released
   one, decided by a person.
2. **Ask which `Assign Specific Pieces At` value is live** (run-06
   F328) — it decides what STORIS's "reserved" numbers mean during the
   parallel run; Jetnine reserves at order open, so the comparison
   needs the offset understood, not fixed.
3. **The warehouse walkthrough must capture physical procedure** —
   aisle habits, floats/carts, staging, damage handling — as SOPs,
   since none of it will be enforced by software (§1.8).
4. **Licensed-module inventory** (§4 Q1) before trusting any STORIS
   behavior read from documentation — six findings showed licences
   *change* base behavior.
5. **Unacknowledged-215 / EDI cleanup** only if Q1 says EDI is live.

## 4. Owner/Ops batch — three questions

1. **Licences & third parties**: which of these are actually licensed/
   live at LA Mattress — AWM, RF/barcode, a third-party WMS, EDI with a
   3PL, a routing vendor (four named), the alternate tax interface?
   (Photographing the config screens — already an Ops item — answers
   most of this; a licence list from STORIS support answers the rest.)
2. **Warehouse SOP walkthrough (Ops)**: one session on the floor
   documenting how picking, damage, staging and truck loading actually
   run today, so the no-scanning cutover keeps the physical process.
3. **Delivery-crew paperwork**: STORIS's manifest print has twenty
   options, three deciding whether crews see prices. Jetnine's load
   sheet shows no prices today — confirm that is right, or say what the
   crew sheet must show.

Everything else is shipped, covered by the transfers reconcile, out of
scope by locked decision, or cutover reference. No code changes follow
until §4 lands.
