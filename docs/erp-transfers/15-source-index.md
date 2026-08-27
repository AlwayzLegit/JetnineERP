# 15 — Source Index

Section: **STORIS → STORIS ERP → Inventory Management → Transfers**
`https://storis.zendesk.com/hc/en-us/sections/15172923725332-Transfers`

Captured 2026-08-27. All 22 section articles, plus 9 linked articles the section depends on.

## Section articles (22 / 22)

| # | Article | Where it lands in this handoff |
| --- | --- | --- |
| 1 | Add Individual Transfer | `08-manifests.md` §2 |
| 2 | Complete the Transfer Manifest Process | `08-manifests.md` §3 |
| 3 | Confirm Required Carton Quantity for Shipment | `04-transfer-entry.md` |
| 4 | Distributed Transfers | `06-distributed-transfers.md` §1 |
| 5 | Distributed-Quantity Transfers | `06-distributed-transfers.md` §2 |
| 6 | Enter a Transfer | `04-transfer-entry.md` |
| 7 | Enter a Transfer (As-Is, Floor Sample, Stock) | `05-transfer-variants.md` |
| 8 | Maintain Distribution Location Schema | `01-domain-model.md` §8, `07-multi-leg-transfers.md` |
| 9 | Maintain Transfer Schedule Period Days | `01-domain-model.md` §8, `07-multi-leg-transfers.md` |
| 10 | Maintain Transfer Security for Multiple Locations | `03-permissions.md` §1 |
| 11 | Multi-Legged Transfers Flow Chart Overview | `07-multi-leg-transfers.md` — **diagram only, no text body** |
| 12 | One-Time-Buy Processing | `06-distributed-transfers.md` §4 |
| 13 | Product Quantity in Excess of Transfer Quantity | `04-transfer-entry.md`, `12-inquiries.md` |
| 14 | Replenish Assigned Stock Levels | `10-replenishment.md` |
| 15 | Review Radio Frequency Transfer Receiving Phantom | `09-receiving.md` §4 |
| 16 | Schedule and Build a Transfer Manifest | `08-manifests.md` §1 |
| 17 | Select As-Is Pieces | `04-transfer-entry.md` |
| 18 | Special Order Inventory Assignment | `01-domain-model.md` §7 |
| 19 | Special Order Products on Transfers | `01-domain-model.md` §7 |
| 20 | Transaction Number Entry | `04-transfer-entry.md` |
| 21 | Transfer Distribution Quantity | `06-distributed-transfers.md` §3 |
| 22 | Transfers Eligible for Date Re-Scheduling | `11-scheduling.md` §3 |

## Linked articles also dissected (9)

| Article | Section it lives in | Why it was pulled in |
| --- | --- | --- |
| Multi-Legged Transfers Overview | Overviews | The narrative behind the flow-chart-only article; defines demand vs logistics, schema eligibility |
| Create a User Actions - Transfer Security | System Administration → User Settings | The transfer security table itself |
| Create a User/Group Actions - Logistics Security | System Administration → User Settings | The full permission catalog referenced throughout Transfers |
| View Inbound Transfers | Merchandising Views and Reports | Search target from transfer entry |
| View Outbound Transfers | Inventory Views and Reports | Search target; also "Open Transfer Inquiry (Out)" in manifest building |
| View a Merchandise Transfer | Inventory Views and Reports | Read-only transfer viewer |
| Initialize Radio Frequency Transfer Receiving | Inventory Management → Barcode | Step 1 of receiving |
| RF Bar Code Transfer Receiving | Inventory Management → Barcode | End-to-end receiving procedure |
| Complete Radio Frequency Transfer Process | Inventory Management → Barcode | Step 3 of receiving |

## Referenced but not dissected here

Named by the Transfers articles, likely already covered by earlier handoffs in this repo (Inventory
Management, Merchandising, System Administration, Printing, Sales Views and Reports). Check the
existing docs before re-dissecting:

Advanced Product Settings · Warehouse/Store Location Settings · Point of Sale Control Settings ·
Inventory Control Settings · Distribution Status Settings · Reason Code Settings · Special Order
Control Settings · Route Capacity Settings · Route Capacity Control Settings · Logistical Route
Settings · Third Party Logistics Settings · Bar Code Control Settings · Phantom Process Settings ·
Administer Phantom Processes · View Phantom Processes · Stock Location Schema · Logistical Scheduling ·
Print a Delivery/Pick-Up/Transfer Ticket · Print Pick List · Enter a Sales Order · Enter an Exchange ·
Enter a Stock Adjustment · Receive a Purchase Order · View Product Activity · View Detailed Activity
for a Product · Report Transfers by Location · Report on User Security · Floor Samples Overview ·
Regional Processing Overview · Transfers FAQs.

## Extraction notes

- Field descriptions in these articles are inside collapsed accordions; they were expanded before
  capture, so the field-level detail in this handoff is complete rather than label-only.
- Article 11 (Multi-Legged Transfers Flow Chart Overview) has an empty text body — it is a diagram.
  Recorded as an open decision in `14-build-plan.md`.
