# 99 — Source Index

Provenance for every article in this pack. One row per source article, in the order it appears in
its section file.

- **Source:** STORIS Help Center, category _STORIS ERP_ (`360006187772`)
- **Pack root:** `docs/erp-inventory/`
- **Articles:** 196 across 4 source sections → 5 section files
- **Captured:** 2026-08-27

Article URL for any row: `https://storis.zendesk.com/hc/en-us/articles/{article_id}`
(the bare-ID URL 302s to the slugged canonical URL — verified).

---

## Section → file mapping

| Source section              | Section ID     | Articles | Pack file                                                   |
| --------------------------- | -------------- | -------: | ----------------------------------------------------------- |
| Fulfillments                | 51664106444308 |       27 | `sections/01-fulfillments.md`                               |
| Inventory                   | 15185835400852 |       44 | `sections/02-inventory.md`                                  |
| Inventory Views and Reports | 51935514726164 |      103 | `sections/03a-…` (pos 0–51) + `sections/03b-…` (pos 52–102) |
| Transfers                   | 15172923725332 |       22 | `sections/04-transfers.md`                                  |
| **Total**                   |                |  **196** |                                                             |

`Inventory Management` (`51426663632020`) is a **container section with 0 direct articles** — its
children are the sections above. Do not try to pull articles from it directly.

The `03a`/`03b` split is a file-size accommodation only, not a semantic boundary. The cut falls at
position 52, which lands between `Kardex Inquiry Notes` (51) and `Batch Selection Screen` (52) —
mid-way through the inquiry-screen cluster, so treat 03a and 03b as one logical section when
reasoning about coverage.

## Regenerating

The Zendesk Help Center API is public and unauthenticated:

```
GET https://storis.zendesk.com/api/v2/help_center/en-us/sections/{SECTION_ID}/articles.json?per_page=100&page=N&sort_by=position
GET https://storis.zendesk.com/api/v2/help_center/en-us/articles/{ARTICLE_ID}.json
```

`sort_by=position` is what produces the ordering below. Without it the API returns creation order
and the positions in this index will not line up. Bodies are HTML from the upstream authoring tool —
strip `<script>`/`<style>` and the `//<![CDATA[ … ]]>` blocks (each article carries ~2KB of webpack
noise and `TextPopupInit(...)` calls) before converting.

See `sections/build-sections.py` for the generator that produces the five section files from this index.

---

## 01-fulfillments.md — Fulfillments (27)

|   # | Article ID     | Title                                                      |
| --: | -------------- | ---------------------------------------------------------- |
|   0 | 15201529006484 | Load a Truck                                               |
|   1 | 15201529004692 | View Routing Capacity Log                                  |
|   2 | 15201513448340 | View Trailer Volume Capacity Levels                        |
|   3 | 15201528853652 | Manually Assign an Order to a Truck                        |
|   4 | 15201528851860 | Remove Items from Delivery Hold Status                     |
|   5 | 15201528850836 | Schedule Orders with CWC or ASAP Fulfillment Status        |
|   6 | 15201513286932 | Run Dispatch Track Mapping Interface                       |
|   7 | 15201513286164 | Complete the Delivery Manifest Process                     |
|   8 | 15201513285908 | Build a Delivery/Service/Transfer Manifest                 |
|   9 | 15201513284244 | Run the Mapping Interface                                  |
|  10 | 15201528690708 | Fulfillment Handling Method Settings                       |
|  11 | 15201528690580 | Complete Direct Ship Orders                                |
|  12 | 15201513100308 | Fulfillment Handling Method Assignment Settings            |
|  13 | 15201513099796 | Maintain Un-manifested Fulfillments Sent to Dispatch Track |
|  14 | 15201513095060 | Logistical Scheduling                                      |
|  15 | 15201513094932 | Complete Multiple Manifests                                |
|  16 | 15201513094292 | Maintain Driver and Delivery Associate                     |
|  17 | 15201528521364 | Stop Detail Screen                                         |
|  18 | 15201528514580 | Truck Load Stop Detail                                     |
|  19 | 15201512916628 | View Detailed Route Information                            |
|  20 | 15201512906132 | View Route Information                                     |
|  21 | 15201512905236 | Pieces Not Completed Detail                                |
|  22 | 15201512904852 | Transaction Update - Logistical Scheduling                 |
|  23 | 15201528408468 | Delivery Ticket Reprints                                   |
|  24 | 15201528408212 | Logistical Scheduling Screen Grid                          |
|  25 | 15201528408084 | Confirm All Serial Numbers                                 |
|  26 | 15201512788500 | Manifest Not Delivered Reason Screen                       |

## 02-inventory.md — Inventory (44)

|   # | Article ID     | Title                                                       |
| --: | -------------- | ----------------------------------------------------------- |
|   0 | 15294753610388 | Product Sub Filter                                          |
|   1 | 15294751621012 | As-Is Inventory Detail                                      |
|   2 | 15201528519956 | Route Mapping Import/Export Fields                          |
|   3 | 15185872466324 | Warehouse Management System (WMS) Interface Overview        |
|   4 | 15185872339348 | Complete Return-To-Vendor                                   |
|   5 | 15185872336020 | Create Return-To-Vendor List                                |
|   6 | 15185856110100 | Print Return-To-Vendor List                                 |
|   7 | 15185872216852 | Twilight Inventory Adjustments                              |
|   8 | 15185856002324 | Receive a Purchase Order                                    |
|   9 | 15185856000916 | Receive without a Purchase Order                            |
|  10 | 15185871979796 | Designate Inventory for As-Is Processing                    |
|  11 | 15185871973268 | Create an As-Is Kit                                         |
|  12 | 15185871972116 | Maintain Daily Receiving Schedule                           |
|  13 | 15185871970068 | Maintain Receiving Schedule By Group                        |
|  14 | 15185855768340 | Receive a Purchase Order with a Separate Freight Bill       |
|  15 | 15185855767060 | Enter a Stock Adjustment                                    |
|  16 | 15185855766676 | Maintain Receiving Detail                                   |
|  17 | 15185855766548 | Label Queue                                                 |
|  18 | 15185855763732 | Perform Mass Inventory Updates                              |
|  19 | 15185855582228 | Serial Number / Storage Location Entry                      |
|  20 | 15185838205716 | Storage Location Bin to Bin Transfer Screen - No Select     |
|  21 | 15185838204820 | Storage Location Bin to Bin Transfer Screen - Select Pieces |
|  22 | 15185855334420 | Purchase Order Cost Display Screen                          |
|  23 | 15185855332116 | Bulk Storage Location Assignment                            |
|  24 | 15185855330836 | Inventory Label Print Screen                                |
|  25 | 15185855329940 | Mass Inventory Update                                       |
|  26 | 15185837937940 | Container Receiving Notes                                   |
|  27 | 15185837937812 | CFO Fields                                                  |
|  28 | 15185837936148 | Details of As-Is Processing                                 |
|  29 | 15185837821588 | Enter Multiple Physical Count Tags                          |
|  30 | 15185837809428 | Physical Inventory Overview                                 |
|  31 | 15185855208340 | Update Physical Inventory Results                           |
|  32 | 15185837807636 | Enter a Single Physical Count Tag                           |
|  33 | 15185837806612 | Freeze Inventory                                            |
|  34 | 15185804785044 | Serial Number Entry Window                                  |
|  35 | 15185837613332 | Correct a Cost Exception                                    |
|  36 | 15185837613204 | Distribute Add-on Receiving Costs                           |
|  37 | 15185837609364 | Update a Product Cost                                       |
|  38 | 15185804660756 | Enter a Vendor Rebate                                       |
|  39 | 15185804550804 | Layer Detail Window                                         |
|  40 | 15185804531348 | Cost Exception Types                                        |
|  41 | 15185804530708 | Cost Exception Adjustments Screen                           |
|  42 | 15185804529556 | Split Layer Selection Window                                |
|  43 | 15185804527508 | Allocated Vendor Rebates                                    |

## 04-transfers.md — Transfers (22)

|   # | Article ID     | Title                                             |
| --: | -------------- | ------------------------------------------------- |
|   0 | 15238507436308 | Complete the Transfer Manifest Process            |
|   1 | 15238491769364 | Schedule and Build a Transfer Manifest            |
|   2 | 15238491486996 | Maintain Distribution Location Schema             |
|   3 | 15238491486100 | Enter a Transfer                                  |
|   4 | 15238491485332 | Maintain Transfer Schedule Period Days            |
|   5 | 15238491484820 | Multi-Legged Transfers Flow Chart Overview        |
|   6 | 15238491484564 | Maintain Transfer Security for Multiple Locations |
|   7 | 15238491484180 | Review Radio Frequency Transfer Receiving Phantom |
|   8 | 15238491482132 | Enter a Transfer (As-Is, Floor Sample, Stock)     |
|   9 | 15238491482004 | Replenish Assigned Stock Levels                   |
|  10 | 15238506933524 | Transaction Number Entry                          |
|  11 | 15238506928404 | Transfer Distribution Quantity                    |
|  12 | 15238491212180 | Special Order Products on Transfers               |
|  13 | 15238506659604 | Confirm Required Carton Quantity for Shipment     |
|  14 | 15238506658708 | One-Time-Buy Processing                           |
|  15 | 15238506641044 | Select As-Is Pieces                               |
|  16 | 15238490947348 | Add Individual Transfer                           |
|  17 | 15238490946836 | Special Order Inventory Assignment                |
|  18 | 15238490945940 | Distributed-Quantity Transfers                    |
|  19 | 15238490939668 | Product Quantity in Excess of Transfer Quantity   |
|  20 | 15238490939284 | Distributed Transfers                             |
|  21 | 15201512905364 | Transfers Eligible for Date Re-Scheduling         |

## 03a-views-reports-part1.md — Inventory Views and Reports, positions 0–51

|   # | Article ID     | Title                                                                  |
| --: | -------------- | ---------------------------------------------------------------------- |
|   0 | 15295213235092 | View Weekly Receiving Schedule                                         |
|   1 | 15295213234196 | View AWM Performance                                                   |
|   2 | 15295213074964 | View Special Order Product Details                                     |
|   3 | 15295213074196 | View Warehouse Management System (WMS) Details                         |
|   4 | 15295157046036 | View Vendor Location Quantities                                        |
|   5 | 15295156891540 | View Route Capacity Settings                                           |
|   6 | 15295156876948 | View Outbound Transfers                                                |
|   7 | 15295212729876 | View Open Freight Batches                                              |
|   8 | 15295156485524 | View Daily Receiving Schedule                                          |
|   9 | 15295156485012 | View Detailed Activity for a Product                                   |
|  10 | 15295156477588 | View Customer Ship-To Addresses                                        |
|  11 | 15295156258324 | View As-Is Product Details                                             |
|  12 | 15295156089876 | View All Serial/Reference Numbers for a Product                        |
|  13 | 15295211965844 | View a Merchandise Transfer                                            |
|  14 | 15295211664404 | View Products in a Specific Storage Location                           |
|  15 | 15295211516692 | View AWM Activity                                                      |
|  16 | 15295155417748 | Review Warehouse Management Interface (WMS) Errors                     |
|  17 | 15295155414420 | View an AWM User's Current Status                                      |
|  18 | 15295211354772 | Product Group/Collection Inquiry                                       |
|  19 | 15295211352340 | Review Radio Frequency Picking Error                                   |
|  20 | 15295155215892 | View Product Quantity by Count Sheet Tag                               |
|  21 | 15295155215252 | View Open Transfer Lists                                               |
|  22 | 15295211167764 | View Kit Product Details                                               |
|  23 | 15295155056916 | View Inventory Quantities for a Group or Collection                    |
|  24 | 15295210969620 | View EDI Processing Log                                                |
|  25 | 15295210967316 | EDI 215 Document Delivery Status Inquiry                               |
|  26 | 15295210965268 | View Deliveries on Manifests                                           |
|  27 | 15295210650644 | Review a Bar Code Cross Reference Number                               |
|  28 | 15294767787540 | Search for a Product                                                   |
|  29 | 15294753601684 | Product/Description/Vendor Model Word Search                           |
|  30 | 15294753439380 | Multiple Storage Location Selection Window                             |
|  31 | 15294767617940 | Multiple Truck Selection Window                                        |
|  32 | 15294753425940 | Multiple Velocity Selection Window                                     |
|  33 | 15294767143188 | Multiple Serial Number Entry Window                                    |
|  34 | 15294752945172 | Multiple Storage Category Selection                                    |
|  35 | 15294752943892 | Multiple Serial/Reference Number and Storage Location Selection Window |
|  36 | 15294752810772 | Multiple Product Family Selection                                      |
|  37 | 15294752810644 | Multiple Postal Code Selection Window                                  |
|  38 | 15294752643092 | Multiple List Selection Window                                         |
|  39 | 15294752482964 | Multiple Inventory Formation Selection                                 |
|  40 | 15294752479636 | Multiple Group Selection Window                                        |
|  41 | 15294766345236 | Multiple Barcode Cross Reference Selection Window                      |
|  42 | 15294766343956 | Multiple Barcode Batch Selection Window                                |
|  43 | 15294766224020 | WMS Purchase Orders                                                    |
|  44 | 15294766223252 | WMS Sales Orders, Transfers, & Manifests                               |
|  45 | 15294766223124 | WMS Transactions                                                       |
|  46 | 15294751971092 | WMS Piece Inventory Details                                            |
|  47 | 15294765882004 | Inventory Kardex Detail View                                           |
|  48 | 15294765881748 | Summary Screen                                                         |
|  49 | 15294751623060 | Kardex Direct-Ship Screen                                              |
|  50 | 15294751622548 | Kardex Regular Inventory Screen                                        |
|  51 | 15294751621140 | Kardex Inquiry Notes                                                   |

## 03b-views-reports-part2.md — Inventory Views and Reports, positions 52–102

|   # | Article ID     | Title                                                 |
| --: | -------------- | ----------------------------------------------------- |
|  52 | 15294765757076 | Batch Selection Screen                                |
|  53 | 15294765744788 | As-Is Additional Information Screen                   |
|  54 | 15294751490452 | Bar Code Pick Review Inquiry                          |
|  55 | 15294751488660 | Gift Certificate Lookup Screen                        |
|  56 | 15203235637140 | Report Vendor Delivery Performance                    |
|  57 | 15203235453204 | Report Special Order Stock Status                     |
|  58 | 15203214706836 | Report Stock Status                                   |
|  59 | 15203214450580 | Report Zero Cost Direct Shipments                     |
|  60 | 15203214447636 | Report Sales to Inventory Ratio                       |
|  61 | 15203235034900 | Report Scanned Batch Bar Code Physical Counts by User |
|  62 | 15203214119188 | Report Summarized Frozen Quantities                   |
|  63 | 15203214100116 | Report Value of Inventory                             |
|  64 | 15203234862612 | Report Transfers by Location                          |
|  65 | 15203113294228 | Report Required Delivery Quantities                   |
|  66 | 15203113109524 | Report Putaway Exceptions by User                     |
|  67 | 15203112885012 | Report Physical Inventory Count Review                |
|  68 | 15203112878868 | Report Product Quantity by Count Sheet Tag            |
|  69 | 15203112877972 | Report Physical Inventory Reservation Exceptions      |
|  70 | 15203112877588 | Report Physical Inventory As-Is Exceptions            |
|  71 | 15203128358036 | Report Physical Inventory Transactions                |
|  72 | 15203128357140 | Report Physical Inventory Exclusions                  |
|  73 | 15203112680212 | Report Physical Inventory Update Audit Trail          |
|  74 | 15203112677268 | Report Product in a Storage Location                  |
|  75 | 15203112478228 | Report Purchase Order Delivery Information            |
|  76 | 15203028690324 | Report Landed Freight Asset Values                    |
|  77 | 15203012857876 | Report Logistical Scheduling                          |
|  78 | 15203012643732 | Report Merchandise Directly Shipped but not Invoiced  |
|  79 | 15203012632980 | Report Open To Buy Information                        |
|  80 | 15202946246292 | Report Inventory Designated As-Is                     |
|  81 | 15202946245908 | Report Incomplete WMS Shipments                       |
|  82 | 15202946052244 | Report Historical Inventory Adjustments               |
|  83 | 15202930410900 | Report Inventory Aging by Location                    |
|  84 | 15202742728212 | Report EDI Status Details Exceptions                  |
|  85 | 15202742726292 | Report EDI 214 Shipment Status Exceptions             |
|  86 | 15202677170836 | Report EDI Advance Shipping Notice Exceptions         |
|  87 | 15202677166100 | Report Duplicated Physical Inventory Scans            |
|  88 | 15202677165588 | Report EDI 214 Manifest Exceptions                    |
|  89 | 15202742458772 | Report EDI Functional Acknowledgement Exceptions      |
|  90 | 15202742455444 | Report EDI PO Ship Acknowledgements                   |
|  91 | 15202742454420 | Report Detailed Product Activity                      |
|  92 | 15202676863380 | Report EDI PO Acknowledgement Exceptions              |
|  93 | 15202676625812 | Report EDI Invoice Exceptions                         |
|  94 | 15202676625044 | Detailed Put Away Activity Report                     |
|  95 | 15202504953492 | Report AWM User Exceptions                            |
|  96 | 15202504952724 | Report AWM Activity                                   |
|  97 | 15202504427284 | Report Bar Code Manifest Verification                 |
|  98 | 15202552860436 | Report Bar Code Physical Inventory Adjustments        |
|  99 | 15202552854548 | Report and Optimize Product to Storage Velocity       |
| 100 | 15202552854292 | Report Bar Code Physical Inventory Progress           |
| 101 | 15202503178900 | Report Bar Code Bin to Bin Transfer Activity          |
| 102 | 15202503176596 | Report COM Value In Transit                           |

---

## Integrity

- 196 article IDs, all distinct — verify with:
  `grep -oE '\| 1[0-9]{13} \|' 99-source-index.md | sort | uniq -d` (should return nothing)
- Counts per file: 27 / 44 / 52 / 51 / 22 = 196
- `sort_by=position` ordering; re-pull and diff this index before assuming the pack is current.
