# Open questions — resolve before coding, do not guess

Roughly 70 places where the STORIS documentation is silent, self-contradictory, or copy-pasted. Each is a spot where a plausible guess produces a silent parity break. The ID scheme is `Q-<section><n>`; full context for each lives in the referenced section file.

**Working rule for Claude Code:** implement the documented part, leave `TODO(parity: Q-nn)` at the gap, register the question in this file, and surface it — never fill it in from inference.

---

## Tier 1 — blockers (wrong answers here corrupt inventory quantities or money)

| ID        | Question                                                                                                                                                                                                                                | Where to resolve                                                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q-I1**  | **The `Available` quantity formula is never stated anywhere**, yet it gates twilight adds, mass updates and ATP. Presumed `On Hand − Reserved − As-Is − Twilight − floated − RF-picking`.                                               | Query live STORIS: compare `Available` on the product inquiry against computed candidates across ~50 products with as-is/twilight/float mixes |
| **Q-T1**  | **Costing and GL for inter-location moves are entirely absent** from all 22 transfer articles — no in-transit account, no cost-travel rule, no freight capitalisation, no revaluation between locations at different costs.             | STORIS Accounting section + live GL detail on a completed transfer                                                                            |
| **Q-I7**  | **GL accounts for receipt are never enumerated** (only adjustment postings: Inventory Value Dr / Inventory Adjustment Cr / Landed Freight Asset Dr).                                                                                    | Live GL detail on a PO receipt and a no-PO receipt                                                                                            |
| **Q-I6**  | **Freight distribution basis conflicts**: the batch screen offers Cost / Volume / Weight; Container Receiving Notes says distribution uses **weighted average cost**.                                                                   | Live freight batch with mixed-volume lines                                                                                                    |
| **Q-T2**  | **Distributed-quantity rounding contradicts itself**: rule says 1.5 → 2, worked example shows 1; only 1 conserves the 15-unit total. Implies an undocumented largest-remainder balancing step.                                          | Run a distributed-quantity transfer with a deliberately non-integral split                                                                    |
| **Q-T3**  | **In-transit is never named as a bucket.** The model in cross-cutting §5 is derived from reservation/completion/receipt semantics plus Reserved Linked Transfers. Confirm bucket identity and the exact decrement/increment timestamps. | Watch quantities at ship and at receipt on a two-location transfer                                                                            |
| **Q-F11** | **Order Completion Details** — the pivot screen every completion path lands on — **has no article**. Its field set, validation and inventory/GL postings are unspecified.                                                               | Live screen walkthrough + GL detail                                                                                                           |
| **Q-R3**  | **`Net PO` is defined two incompatible ways**: the netted formula (`units on POs − unreserved SO qty − layaways`) vs gross on-order on the Summary Screen.                                                                              | Compare both screens on the same product                                                                                                      |
| **Q-R60** | Valuation basis: on-hand × unit value under {Exact, Average, Replacement, Average-with-exact-add-on}, but **special-order is always exact cost** and GL Recap is always exact cost. Confirm which report uses which.                    | Run Value of Inventory under each basis against GL                                                                                            |

---

## Tier 2 — behavioural gaps

**Fulfillments** (detail in `sections/01-fulfillments.md` §H)

- **Q-F1** `Update Status and Stop Time for an Order on a Manifest` is documented in two different security programs — one setting, two homes.
- **Q-F3** `Include Unreserved Fulfillments` is gated on a `Type` field that is not documented on that screen.
- **Q-F6/Q-F7** Ticket-flag alphabet (`Y` vs `P`) and status alphabet (`SCH` vs `SCD`) are never reconciled.
- **Q-F8** How `Consolidate Stops` interacts with the per-fulfillment manifest rows is unstated (does consolidation collapse rows?).
- **Q-F9** No `Delivery Status` filter value exists for ASAP/CWC — unclear whether they appear in the Confirm Schedule grid at all.
- **Q-F10** Manifest deletion appears only as a security setting; no article documents the procedure or its effect on member orders.
- **Q-F12** `H` (hold) vs `U` (unscheduled) quantity comparisons are narrative only — confirm against data.
- **Q-F13** `Remove Quantity Hold` behaviour for multi-date lines is unspecified.
- **Q-F14** **Parcel fulfillment generation** is referenced repeatedly but never described — how parcel fulfillments are created, rated or completed.
- **Q-F2** Five articles publish no menu path.

**Inventory** (detail in `sections/02-inventory.md` §S9)

- **Q-I2** Three differently-named WMS adjustment permissions that may be one flag.
- **Q-I3/Q-I4** Field-length contradictions: `WMS Tag ID` 13 vs 30; `As-Is Comment` 40 vs 50.
- **Q-I5** `Landed Cost Allocation` vs `Landed Cost Distribution` — same setting or two?
- **Q-I8** RTV: whether pieces are locked between list creation and completion; whether an AP bill can be created after answering No.
- **Q-I9** Whether deleting a freight batch reverses already-applied freight.
- **Q-I10** The exhaustive "exception condition" set that makes a piece Not Qualified, and the full piece `Status` domain.
- **Q-I11** As-is kits: whether `Assigned (Order Key)` reverts on cancellation; component commitment; cost roll-up.
- **Q-I12** Twilight: GL posting, revaluation, exclusion from Available, and behaviour when no available quantity exists.
- **Q-I13** Whether `Distribute Add-on Receiving Costs` writes to costing layers/GL or is reporting-only.
- **Q-I15** Whether exceeding Maximum/Override Loads or Pieces on the receiving schedule blocks or merely warns.
- **Q-I17** GL treatment of the warehouse-to-warehouse leg of a mass inventory update.

**Transfers** (detail in `sections/04-transfers.md` §S8)

- **Q-T4** The multi-leg flow chart is internally inconsistent — two terminals on the "no Alternate Stock Location" branch still reference it.
- **Q-T5** `Transfer Receiving Location` is described with copy-pasted Return-Location wording.
- **Q-T6** `Saleable Flag` polarity in _Select As-Is Pieces_ is inverted (`No` = setting enabled) — confirm before trusting.
- **Q-T7** _Product Quantity in Excess of Transfer Quantity_ is effectively empty: trigger, source of `Maximum Transfer Quantity`, and disposition of excess all undocumented.
- **Q-T8** Multi-leg mechanics beyond location resolution: leg sequencing, status propagation, partial receipt mid-chain, `T`/`X` pairing on leg failure.
- **Q-T11** Replenishment: where assigned stock levels live, the quantity formula, source-location selection, and the transfer type generated.
- **Q-T14** Transaction-number validation (uniqueness, format, collision with the auto sequence).
- **Q-T16** RF `Pending Reason` values are not enumerated; no retry cadence beyond `Last Attempt`.

**Views and reports** (detail in `sections/03a-…` §E and `sections/03b-…` §E)

- **Q-R4** Kit `Available`: whether component availability is divided by component quantity before taking the minimum.
- **Q-R5** `Sales Margin Cost` defers to the POS Sales Margin Scratchpad formula, which is not given here.
- **Q-R10** `Inventory Age` is a column with **no definition anywhere** (also appears on transfers article 18).
- **Q-R83** The aging-bucket anchor date is never stated.
- **Q-R79** The Open-To-Buy dollar formula is never stated.
- **Q-R78** `As of Date` defaults to today while selecting "ordered on or after", which would return nothing — confirm intended behaviour.
- **Q-Rcols** Output columns are undocumented for roughly **25 of the 47 printed reports**.
- **Q-Rpaths** Menu paths missing for six reports and wrong for one; several field descriptions are copy-paste errors (`Ship Whse` described as "model number"; `Vendor` described as Brand).
- **Q-R74** Slotting reports **invert the blank-filter convention** (blank = only records _missing_ the attribute), opposite to every other report — verify before implementing a shared filter helper.

---

## How to resolve these efficiently

Most Tier 1 questions are answerable in a single afternoon against the live STORIS instance with a scratch product and a scratch transfer, watching the inquiry screens and the GL detail before and after each step. Do that pass before Phase 2 of the build order — the ledger design depends on Q-I1, Q-T1, Q-T3 and Q-I7.
