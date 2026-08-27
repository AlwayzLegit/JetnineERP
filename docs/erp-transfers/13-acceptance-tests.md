# 13 — Acceptance Tests

Definition of done. Written as Given/When/Then; translate into the repo's existing test framework.
Every scenario below traces to a specific rule in the source docs — do not drop one because it looks
like an edge case.

---

## A. Numbering & document lifecycle

1. **Auto numbering** — Given auto-numbering is configured, When a user creates a transfer, Then a
   number is assigned automatically and the Transaction Number Entry screen does not appear.
2. **Manual numbering** — Given the "next POS/service transaction" setting is blank, When the user
   clicks +, Then the Transaction Number Entry screen appears and the entered number is used.
3. **Duplicate manual number** is rejected.
4. **Completed transfer is immutable** — Given a completed transfer, When it is opened in entry, Then
   it is not editable and is served from history.
5. **Voided transfer cannot be printed.**
6. **Last Order button visibility** — hidden on first entry, on entry from the main menu, after
   completion or deletion, and in read-only view; visible after a save or clear.

## B. Back-order sequencing

7. Partial invoice suffixes run `A`..`Z` then `a`..`z`.
8. A warning is raised at the **48th** partial and again at the **52nd**.
9. At 52, the **Complete Transfer** checkbox is inactive.
10. Manifest build rejects a manually added document with sequence **53 or higher**.

## C. Completion gating

11. **Complete Transfer is inactive until Print Transfer Ticket is checked.**
12. Given "Assign Specific Pieces = Creating Pick List", completion is blocked until a pick list exists.
13. A user without `complete_merchandise_transfer` cannot complete; the override flow is offered.
14. With `complete_transfer_from_receiving_location_only`, completion from any other location is blocked.
15. Completion is blocked while pending transfer-receiving transactions exist for the transfer.
16. On completion of a **floor sample** transfer, the piece becomes as-is with the configured reason
    code **and** an initial non-saleable inventory activity audit row is written.
17. On completion of a **move to as-is** transfer, pieces become as-is with the entered reason code.

## D. Hold / scheduled quantity

18. Given ordered 10 and scheduled 4, When saved, Then 6 pieces are on **Hold**, flagged `H`, reserved
    to the transfer, and **excluded from the transfer ticket**.
19. On completion, the 4 unheld pieces move, the transfer **remains open**, hold is cleared, and the
    remaining 6 become schedulable.

## E. Location & product eligibility

20. Store→store is rejected when `store_to_store_transfers` is off.
21. A product with inventory availability **Defective** cannot be added to a transfer.
22. A product restricted to the selling store cannot be transferred; from a warehouse, a user with
    `override_distribution_status_only_at_selling_location_for_transfers` may proceed, others get the
    override prompt.
23. Location dropdowns are filtered by regional processing **and** the user's Inventory (Region)
    restrictions.
24. Maintain Distribution Location Schema and Maintain Transfer Schedule Period Days accept **any**
    valid location — restrictions are deliberately not enforced.

## F. Transfer security tables

25. Given the tables switch is **on** and **no rows exist**, no user can create any transfer.
26. A user without a row for (from, to) is blocked and offered the override.
27. A user with `bypass_transfer_security_settings` is never blocked and can authorize an override.
28. Bulk add of an existing (logon/from, to) pair creates **no duplicate** and raises no error.
29. Add All / Delete All reset the process to its initial state and clear the grid.

## G. Carton quantities

30. Saving a transfer below the minimum carton quantity opens the Confirm Required Carton Quantity
    screen, **only** when `logistical_carton_transfers` is on.
31. Checking **+** raises the quantity to the full carton.
32. Overriding is permitted by the flag matching the **location-type pair**: a warehouse→store transfer
    consults `override_complete_carton_requirements_warehouse_to_store_transfers` and **not** any of
    the other four.
33. Without the matching flag, the security override screen appears.

## H. Route capacity

34. Adding a line that pushes the route over capacity raises
    `Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?`.
35. Declining adds the line with status **U**.
36. Accepting requires `override_capacities_when_scheduling_routes_that_are_full`.
37. **No warning** is raised when a change reduces usage on an already-over-capacity route.
38. Blank route defaults from the Warehouse Location table, then the ZIP Code table.

## I. Distributed transfers

39. A distribution list of 4 locations produces 4 transfers: the **first location keeps the original
    document**, three new ones are created, all with the original quantity.
40. Creating one requires `distribute_transfer_quantities_to_multiple_locations`.
41. **Distribute Quantities** is inactive unless multiple To locations are selected and **all are stores**.
42. The generated transfers are returned by the View Outbound Transfers inquiry.

## J. Distributed-quantity allocation

43. **Fixture from the source docs**: stores A/B/C with 12-month product-group sales 10/50/40,
    distributing 15 units of Product Z, yields **A=1, B=8, C=6** and the allocations **sum to 15**.
44. Stores not on the distribution list are excluded from the percentage denominator entirely.
45. Empty Group Sales file (EOM never run) ⇒ even split.
46. All stores at 0.0 sales ⇒ even split.
47. A single store at $0.00 over 12 months receives **nothing**.
48. With `inactive_auto_distributed_transfer_calculation` on, that zero-sales store instead receives the
    average of the active locations.
49. A distributed-quantity transfer is rejected if any transfer-to location is a warehouse, or if any
    product is not a one-time-buy product.

## K. One-time-buy

50. A one-time-buy PO that already has a non-one-time-buy line rejects further one-time-buy products.
51. Receiving a one-time-buy PO sends the configured notification email.
52. One-time-buy processing ignores regional processing restrictions.
53. "Received on Purchase Order" distribution rejects a PO that is not one-time-buy or has no receipts.

## L. Multi-leg

54. `ship_direct = false` with a matching distribution location schema creates the intermediate legs
    automatically.
55. `ship_direct = true` creates no legs.
56. A schema row is rejected when a Via equals the From or To location, when a Via is duplicated, or
    when no Via is supplied.
57. A schema with Via2 filled but Via1 empty is rejected.
58. The consuming line carries `T`; the supplying transfer carries `X`.
59. Transit days resolve from the per-pair table first; then Auto Schedule Period Days for
    order-linked auto-transfers; then Multi-Legged Schedule Period Days.
60. Saving a schedule-period-days row prompts to mirror the inverse pair; **Yes** creates it, **No**
    does not.
61. An auto-transfer is created only when stock location ≠ fulfillment location **and** Auto Schedule
    Period Days > 0.
62. Demand-based legs are created only when the product is reserved; logistics legs do not require
    reservation.

## M. Manifests

63. Building against an existing (To Location, Route/Truck, Date) **appends** rather than creating a
    second manifest.
64. Transfers already submitted to picking are absent from search results and can only be added via
    Add Individual Transfer.
65. Add Individual Transfer rejects, with the specific reason, a transfer whose From location mismatches,
    whose To location mismatches, that has no reservations, or that is already on a manifest.
66. **Send to Picking defaults to checked** when RF Barcode is active at the selected location.
67. Load numbers are assigned only by this process; a transfer added later by another process reuses
    the last load number on that manifest.
68. Removing an auto-transfer from a manifest whose linked sales order is also on a manifest warns, and
    on continue writes the "deleted from the manifest" comment to the order.
69. In-shop service documents cannot be added to a manifest.
70. A COG on a manifest does **not** add pieces to inventory.
71. Deleting an entire manifest without `delete_an_entire_manifest` requires an override.

## N. Manifest completion

72. Completion is blocked while the manifest has pending transfer-receiving transactions.
73. **Truck** is unavailable during transfer manifest completion; **COD/Collected/Bank** are not applicable.
74. **Transfer Receiving Location** is hidden when the manifest has multiple 'transfer to' warehouses.
75. Not Completed / Return / Transfer Receiving fields activate based on the **document types on the
    manifest**, not the manifest type.
76. Default storage locations fall back correctly: service → Service/Repair then Receiving; return →
    Return Pickup then Receiving.
77. With `include_fulfillments_with_reserved_auto_transfers_on_manifest` on, completing a transfer
    linked to an on-manifest order line updates **both** the manifest unit calculation and the order.
78. Undelivered merchandise with a linked on-manifest sales order warns and, on continue, writes the
    "was not received" comment.
79. With `manifest_exception_retention` set, each exception is persisted and reportable.
80. The **Complete** column shows `All` / `Part` / `None` correctly.
81. **Load** is populated only for manifests built through Schedule and Build a Transfer Manifest.

## O. Receiving

82. Initialization is rejected when the transfer is not on a manifest or has no valid route code.
83. **Truck is mandatory** at initialization when mapping is enabled for transfers at the From location.
84. Scanning every scheduled piece **auto-completes the manifest**.
85. Exiting the scan early (entering `0`) leaves the receipt open; it can be closed via Complete RF
    Transfer Process.
86. A scanned piece linked to a transfer (not an order) shows a **blank** fulfillment status.
87. Combined header+line comments are truncated to **20 characters**.
88. The Status filter correctly partitions All / Received / Unreceived / Partially Received.
89. Cross-dock label counts equal `min(demand within cross-dock days, pieces received)`; remaining
    pieces get the standard inventory label.
90. **Suspended** worker does not auto-start when merchandise is scanned; **Start Phantom** is disabled
    while it is running or suspended.
91. Every pending row has a Pending Reason unless the worker is Inactive or Suspended.
92. Removing a pending row drops that transaction from the transfer.
93. Scanned times render in 24-hour format.
94. RF over-receiving follows the barcode control setting, **not** the per-user Logistics Security flag.

## P. Rescheduling

95. Transfers on a manifest, or with a **final** pick list printed, are absent from the eligible list.
96. A transfer with a non-final pick list printed is eligible and the routine offers re-pick.
97. **Race condition**: a transfer that becomes ineligible between grid load and save is skipped with a
    message explaining why; the rest still process.
98. Successfully rescheduled transfers are removed from the grid.
99. **Assign Truck** is active only when mapping is enabled for transfers at the From location.

## Q. Replenishment

100. EOD replenishment covers all locations; the on-demand screen covers only the selected ones — same
     engine, same results for the same location set.
101. With `include_incoming_po_scheduled_date_days = N`, POs delivering after `run_date + N` are
     excluded from quantity available.
102. With `N = 0`, only POs delivering on or before the run date count.

## R. Build From Storage Location

103. Available once per transfer, then disabled; also disabled once a transfer line exists.
104. Available only for location-tracked locations with no distribution list in use.
105. On an as-is transfer, it opens **Select As-Is Pieces** instead of populating lines directly.
106. Transfer comments record each product code and quantity added.
107. Like products are grouped by storage location; special-order products group only on matching
     special-order detail.
108. A line whose piece cannot be assigned has its order quantity **reduced**; a product with no
     assignable piece is **not added**.

## S. Select As-Is Pieces

109. As-is pieces already assigned to sales orders are excluded from the list.
110. Saleable shows **No** when the reason code has "restrict as-is products from being sold" enabled,
     and the piece can still be added to the transfer.
111. Checked pieces move from the storage location onto the transfer on Save.

## T. Special orders

112. Editing quantity on a PO-linked special-order transfer line **updates the PO quantity**.
113. With Automatic PO Creation on, a PO is created for every non-reserved special-order item; with it
     off, the user is prompted per item.
114. Special Order Inventory Assignment offers only `Unassigned` pieces and assigns one at a time.
115. Without `create_special_order_products_within_pos_entry`, the on-the-fly creation entry point is
     unavailable but existing special-order products can still be added.

## U. Audit

116. Every security override records the authorizing user's ID in the audit comment log.
117. An inbound EDI 214 whose line status matches the configured estimated-arrival status writes an
     audit comment carrying the estimated arrival date, start/end time, and description.
