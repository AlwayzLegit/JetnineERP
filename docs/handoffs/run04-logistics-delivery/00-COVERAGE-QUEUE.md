# Run 04 — STORIS `Inventory Management` (Logistics / Delivery) — Coverage queue

**Scope confirmation first, per the working agreement:** *"Before you open anything, show me the
section's subsection list and article counts so I can confirm the scope."* Nothing in this run was
opened for content before this queue was produced; the listing pages were read to enumerate only.

**Read-only.** No form submitted, no setting saved, no process run. Note that this section is the
most write-heavy in the help centre — it documents manifest building, truck loading, barcode
batches and physical counts. Several articles describe screens that could plausibly be live
application pages; **the audit stays on `storis.zendesk.com/hc/` documentation URLs only** and
backs out of anything that is not.

---

## Where "Logistics / Delivery" lives

There is **no `Logistics` section** in the STORIS ERP category. The run-queue entry
"4 Logistics/Delivery" maps to **`Inventory Management`**, whose five subsections carry the
physical-movement half of the system: delivery scheduling and manifests (`Fulfillments`),
warehouse execution (`Barcode` / AWM), inter-location movement (`Transfers`), and the inventory
state those movements act on (`Inventory`, `Inventory Views and Reports`).

Category: `/hc/en-us/sections/51426663632020-Inventory-Management`

## Subsection list and article counts

| # | Subsection | URL (id-slug) | Articles | Role in this run |
|---|---|---|---|---|
| 1 | **Fulfillments** | /sections/51664106444308-Fulfillments | **27** | **The logistics/delivery core.** Scheduling, routing, manifests, trucks, stops, delivery holds. |
| 2 | **Barcode** | /sections/15172882400660-Barcode | **84** | Warehouse execution — AWM task scheduling (delivery pick/prep/load, customer pickups, cycle count, receiving), barcode batches, physical inventory. |
| 3 | **Transfers** | /sections/15172923725332-Transfers | **22** | Inter-location movement, multi-leg. |
| 4 | **Inventory** | /sections/15185835400852-Inventory | **44** | The inventory state the above acts on. |
| 5 | **Inventory Views and Reports** | /sections/51935514726164-Inventory-Views-and-Reports | **103** | Inquiries and reports over all of it. |
| | **Total** | | **280** | |

*(Pagination verified: Barcode 30+30+24; Inventory 30+14; Inventory Views and Reports 30+30+30+13;
Fulfillments and Transfers single page.)*

Linked articles outside the category will be followed where an in-scope article names them, per the
handoff's "follow the links" rule.

---

## Batch plan

| Batch | Focus | Approx. articles |
|---|---|---|
| 1 | **Logistical scheduling core** — Logistical Scheduling, Screen Grid, Transaction Update, Fulfillment Handling Method Settings + Assignment Settings, Schedule Orders with CWC or ASAP | 6 |
| 2 | **Manifest lifecycle** — Build a Manifest, Complete the Delivery Manifest Process, Complete Multiple Manifests, Manifest Not Delivered Reason, Pieces Not Completed Detail, Confirm All Serial Numbers | 6 |
| 3 | **Trucks, stops, routing, capacity** — Load a Truck, Manually Assign an Order to a Truck, Truck Load Stop Detail, Stop Detail Screen, View Route Information, View Detailed Route Information, View Routing Capacity Log, View Trailer Volume Capacity Levels | 8 |
| 4 | **Holds, direct ship, interfaces, people** — Remove Items from Delivery Hold Status, Complete Direct Ship Orders, Delivery Ticket Reprints, Run the Mapping Interface, Run Dispatch Track Mapping Interface, Maintain Un-manifested Fulfillments Sent to Dispatch Track, Maintain Driver and Delivery Associate | 7 |
| 5–8 | **Barcode / AWM** — AWM schedules (9 task types), AWM Function and Exception Type Settings, barcode batches, pick review, PO receiving, physical/cycle count, devices | 84 |
| 9–10 | **Transfers** | 22 |
| 11–13 | **Inventory** | 44 |
| 14–17 | **Inventory Views and Reports** | 103 |

Findings emitted per batch, not held to the end. Findings numbered continuing from run 03's 164 →
**run 04 starts at finding 165**, so the audit carries one continuous finding sequence.

---

## Fulfillments — full article inventory (27)

| # | Article | id |
|---|---|---|
| 1 | Build a Delivery/Service/Transfer Manifest | 15201513285908 |
| 2 | Complete Direct Ship Orders | 15201528690580 |
| 3 | Complete Multiple Manifests | 15201513094932 |
| 4 | Complete the Delivery Manifest Process | 15201513286164 |
| 5 | Confirm All Serial Numbers | 15201528408084 |
| 6 | Delivery Ticket Reprints | 15201528408468 |
| 7 | Fulfillment Handling Method Assignment Settings | 15201513100308 |
| 8 | Fulfillment Handling Method Settings | 15201528690708 |
| 9 | Load a Truck | 15201529006484 |
| 10 | Logistical Scheduling | 15201513095060 |
| 11 | Logistical Scheduling Screen Grid | 15201528408212 |
| 12 | Maintain Driver and Delivery Associate | 15201513094292 |
| 13 | Maintain Un-manifested Fulfillments Sent to Dispatch Track | 15201513099796 |
| 14 | Manifest Not Delivered Reason Screen | 15201512788500 |
| 15 | Manually Assign an Order to a Truck | 15201528853652 |
| 16 | Pieces Not Completed Detail | 15201512905236 |
| 17 | Remove Items from Delivery Hold Status | 15201528851860 |
| 18 | Run Dispatch Track Mapping Interface | 15201513286932 |
| 19 | Run the Mapping Interface | 15201513284244 |
| 20 | Schedule Orders with CWC or ASAP Fulfillment Status | 15201528850836 |
| 21 | Stop Detail Screen | 15201528521364 |
| 22 | Transaction Update - Logistical Scheduling | 15201512904852 |
| 23 | Truck Load Stop Detail | 15201528514580 |
| 24 | View Detailed Route Information | 15201512916628 |
| 25 | View Route Information | 15201512906132 |
| 26 | View Routing Capacity Log | 15201529004692 |
| 27 | View Trailer Volume Capacity Levels | 15201513448340 |

Remaining subsections are enumerated as their batches are reached, as in run 03.

---

## Contracts expected this run

`W-005` / `W-006` *(direct ship — the completion side lives here)* · `W-012` *(dates and periods)* ·
`W-024` *(holds — **delivery hold** is a distinct hold family we have not yet seen)* ·
`W-050` *(access control)* · `W-052` / `W-053` *(GL — delivery completion is a posting event)* ·
`W-055` / `W-056` *(availability and reservation — picking consumes reservations)* ·
`W-061` *(cost)* · `W-064` *(retention)*.

## Open questions carried into run 04

From run 03:
- **`CWC` and `ASAP` scheduling.** `Schedule Orders with CWC or ASAP Fulfillment Status` is in this
  section, and it is the article that should explain how unscheduled orders re-enter the schedule.
  Run 03 F127 established they are invisible to date-filtered searches. **High priority.**
- **`Credit Hold Codes List (AR)`** — still unread after three runs. Watch for it as a linked article.
- **What releases a delivery hold**, and whether it behaves like the credit hold in F153
  (batch-released rather than released on approval).
- **Route code resolution and manifest freeze** — run 03 F30 found the route freezes at manifest.
  This section is where the manifest is built.
- **Remote order completion failure modes** — run 03 F150; failures stay on the manifest.

From run 02:
- **Four Kardex ledgers** — still unread; likely reachable from `Inventory`.
- **Cost exceptions block a physical inventory freeze** — the freeze mechanism is in `Barcode`.
- **`BMW_ACF`** — a configuration file with no screen.

From run 03 F155/F156 (screen composition):
- Watch for further **Dynamic Tab Settings** and `*.TAB` component references. The `IC.` prefix
  suggests Inventory Control owns a tab registry, and this is the section where it would surface.
