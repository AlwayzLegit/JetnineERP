# Vendor Settings (section `15242970677780`) — Part B (positions 48–94)

*Zendesk breadcrumb: STORIS > STORIS ERP > System Administration > **Vendor Settings***
*Enumerated 94 articles. This part covers positions **48 through 94** (47 articles), ID prefix `VEND`, numbered `VEND-048` … `VEND-094` to match enumeration position.*

## Position reconciliation (read this)

The section is **alphabetically ordered**. Part A's last article (position 47) is
`Picking By Zone Assignment Window`; my first (position 48) is `Picking Zone Assignment Window`.
**That is a sensible alphabetical continuation — no gap, no overlap, no re-numbering needed.**

**However, a scoping warning:** although the Zendesk section is *titled* "Vendor Settings", its
contents are a grab-bag of **inventory, warehouse, picking, routing, storage-location, payment-gateway
(Shift4) and EDI** settings. Only positions **83–90** are actually vendor-master settings
(`Vendor Class`, `Vendor EDI`, `Vendor Rebate`, `Vendor RemitTo`, `Vendor Settings`,
`Vendor Ship from Location Lead Days`, `Vendor Ship From Replacement Cost`, `Vendor Ship From`).
There is **no AP bill entry, no three-way-match tolerance, no payment-method/check handling, no vendor
statement, no freight-vendor, and no vendor-scorecard article in this section.** Those requested topics
are not here; see the "Requested topics NOT found" note at the end of this file.

Titles at my positions, in order:

| Pos | Article | Pos | Article |
|---|---|---|---|
| 48 | Picking Zone Assignment Window | 72 | Storage Category Settings |
| 49 | Podium Location ID | 73 | Storage Location Field |
| 50 | Prioritize Special Delivery Picking | 74 | Storage Location Sort Sequence |
| 51 | Purchase Delivery Pad Days | 75 | Third Party Logistics EDI Settings |
| 52 | Purchase Lead Days | 76 | Third Party Warehouse Management System Group Settings |
| 53 | Purchase Order Item Selection | 77 | Tracked Storage Location Settings |
| 54 | Purchase Order Shipping Type Settings | 78 | Tracked Warehouse Location Mask Settings |
| 55 | Purchase Order Type Settings | 79 | Tracked Warehouse Location Verification Settings |
| 56 | Receiving Capacity Settings | 80 | Unit of Measure Settings |
| 57 | Receiving Group Settings | 81 | Update Zip Code Settings |
| 58 | Region Settings | 82 | Velocity Settings |
| 59 | Regional Vendor Settings | 83 | Vendor Class Settings |
| 60 | Return to Vendor Tax Settings | 84 | Vendor EDI Settings |
| 61 | Route Capacity Settings | 85 | Vendor Rebate Settings |
| 62 | Select Printable Language | 86 | Vendor RemitTo Settings |
| 63 | Select Storage Locations Screen | 87 | Vendor Settings |
| 64 | Shared Route Capacity Settings | 88 | Vendor Ship from Location Lead Days |
| 65 | Shared Route Code Settings | 89 | Vendor Ship From Replacement Cost Settings |
| 66 | Shift4 Authorization | 90 | Vendor Ship From Settings |
| 67 | Shift4 eComm Authorization | 91 | Warehouse Inventory Settings |
| 68 | Shift4 Extended Receivables Authorization | 92 | Warehouse Mapping Paths Screen |
| 69 | Shift4 Extended Receivables MOTO Authorization | 93 | Warehouse/Store Location Settings |
| 70 | Shipping Port Settings | 94 | Warehouse/Store Receiving Settings |
| 71 | Stock Location Schema | | |

---

### `VEND-048` Picking Zone Assignment Window
*storis_ref: article 15243029805972*

**Purpose.** Bulk-assign (or bulk-clear) a picking zone across many storage locations at once, instead of editing each storage location individually.

**Where it lives.** `Actions` button on the **Tracked Warehouse Location Verification Settings** screen (`VEND-079`). The set of storage locations acted on is whatever was selected in the Location Verification Settings routine and is showing in that grid.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse Location` | Display-only | The warehouse location name specified in the Location Verification Settings routine. |
| `Picking Zone` | Text / code | The picking zone to apply to **all** storage locations in the grid. |

**Behavior & rules.**
- Two modes, distinguished only by whether the field is filled:
  - Enter a picking zone + `Save` → applies that zone to **every** storage location in the grid.
  - Leave `Picking Zone` **blank** + `Save` → **removes the existing picking zones (if any) from every storage location in the grid**.
- **Hard rule / destructive-reach flag: a blank-and-save is a silent mass delete of zone assignments.** There is no separate "clear" verb and no confirmation described. This is the same class of hazard as `Allow Transmitted AP Bill Deletion` (wave 1) — an ordinary-looking save that destroys data with no reversal path.

**Dependencies.** Reads the grid selection from `VEND-079` Tracked Warehouse Location Verification Settings. Writes the picking-zone attribute consumed by `VEND-073` Storage Location Field / RF picking. Related to `VEND-050` Prioritize Special Delivery Picking (zone drives pick sequencing).

**Build notes.** Implement as an explicit bulk action with a **required** mode selector (`Set zone` / `Clear zone`) rather than overloading "blank means clear". Require a typed confirmation for `Clear zone`. Emit a `RPT-AUDIT` event with the count of affected locations and the before/after zone values so a mis-click is recoverable.

---

### `VEND-049` Podium Location ID
*storis_ref: article 15243029808532*

**Purpose.** Configure what sales information STORIS pushes to **Podium**, the third-party reputation-management / review-request provider, per warehouse-store location.

**Where it lives.** `Warehouse/Store Location Settings` > **Miscellaneous** page > **Podium Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Podium Location Auth Token` | Text (token) | The location authorization token supplied by Podium. **A unique Podium location token is required for each warehouse/store location** — it is not a single company-wide credential. |
| `Send Written Sales to Podium` | Checkbox | Report written-sale information to Podium. **Fires on initial entry of the order, at save.** When reporting written sales, **all fulfillment types are included** (no exclusions apply to this feed). |
| `Send Completed Sales to Podium` | Checkbox | Report completed-fulfillment information: delivery, customer pickup, take-with, and direct ship. |
| `Exclude Take-Withs` | Checkbox | When checked, completed **take-with** fulfillments are not reported to Podium. |
| `Exclude Direct Ships` | Checkbox | When checked, completed **direct ship** fulfillments are not reported to Podium. |

**Behavior & rules.**
- The `Exclude Take-Withs` / `Exclude Direct Ships` sub-checkboxes qualify **only** `Send Completed Sales to Podium`. They do **not** suppress the written-sale feed.
- **These settings are available only for implementations of Podium Switchboard version 3 or higher.** On older Switchboard versions the granular controls do not exist.

**Dependencies.** `VEND-093` Warehouse/Store Location Settings (parent). Fulfillment-type taxonomy shared with POS/delivery (`delivery`, `customer pickup`, `take-with`, `direct ship`) — direct ship ties to `PO-060` drop-ship configuration.

**Build notes.** We need a generic **outbound review/marketing webhook** abstraction rather than a Podium-specific screen: per-location credential, event selector (`order_written`, `fulfillment_completed`), and a fulfillment-type filter list. Store the auth token encrypted; **this is a per-location secret and must be masked in the UI and excluded from any settings export**. `[DECISION NEEDED]` Does LA Mattress use Podium (or Birdeye/Podium-equivalent), and do we want take-with review requests suppressed by default?

---

### `VEND-050` Prioritize Special Delivery Picking
*storis_ref: article 15242997977364*

**Purpose.** Set the RF picking priority (pick order/pass) for four categories of "special" delivery product, so that items needing extra handling are picked earlier than ordinary stock.

**Where it lives.** `Warehouse/Store Location Settings` > **Barcode** tab > `Actions` button > **Prioritize Special Delivery Picking**. The location code and description from Warehouse/Store Location Settings display on the screen.

**Fields**

Every field on this screen uses the same picklist. Click the Arrow button and select one of exactly:

- `Normal` — pick using the standard RF delivery picking process that determines when merchandise is picked
- `First` — pick on the first pass through the picking process
- `Second` — pick on the second pass
- `Third` — pick on the third pass
- `Fourth` — pick on the fourth pass

| Field | Type | Purpose / business rule |
|---|---|---|
| `Assembly Required` | Enum (above) | Applies to products flagged by the **`Assembly Required` setting on the product**. |
| `Exchange Orders` | Enum (above) | Applies to products on **delivery exchange orders**. |
| `Fabric Coating Required` | Enum (above) | Applies to products that have **linked warranties where the warranty contains an RF picking message** directing the picker to perform an action (e.g. apply fabric coating) to the item after it is picked. **Note the indirection: the trigger is the linked warranty's RF picking message, not a flag on the product itself.** |
| `Inspection Required` | Enum (above) | Applies to products flagged by the **`Inspection Required` setting on the product**. |

**Behavior & rules.**
- Priorities are consumed by the **AWM RF Delivery Pick Special** process, which uses them to decide whether specific products should be picked before other products.
- Settings are **per warehouse/store location** — a product can be first-pass in one DC and normal in another.
- Nothing in the article describes tie-breaking when two categories apply to the same item (e.g. assembly-required *and* on an exchange order).

**Dependencies.** `VEND-093` Warehouse/Store Location Settings (parent); product-level `Assembly Required` and `Inspection Required`; warranty RF picking message; `VEND-048`/`VEND-079` picking zones.

**Build notes.** Model as a per-location ordered rule list rather than four fixed slots, so we can add categories (fragile, oversize, two-person-lift, customer-inspection) without a schema change. **Define the tie-break explicitly** — we should take the *lowest* pass number among all matching categories. `[DECISION NEEDED]` Do we want the "warranty carries a picking instruction" indirection at all, or should fabric-coating be a product/SKU attribute in our model?

---

### `VEND-051` Purchase Delivery Pad Days
*storis_ref: article 15243029806868*

**Purpose.** A cushion, in days, added to Purchase Lead Days **for selling purposes only** — it pads the delivery date shown to salespeople so they cannot promise a customer a date that the incoming PO may not actually make.

**Where it lives.** Not a standalone screen; a field that follows the **same hierarchy as Purchase Lead Days** (see `VEND-052`) and is surfaced wherever a PO delivery date is displayed or printed.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Purchase Delivery Pad Days` | Integer (days) | Days added to Purchase Lead Days **for users who are not allowed to see the true delivery date**. |
| `View the True Purchase Order Delivery Date` (Extended Security → Purchasing) | Permission | **Check the box to *exclude* purchase delivery pad days when calculating purchase lead days** — i.e. the permission grants sight of the unpadded date. |
| `Override Delivery Date Restrictions Based on Available Date` (Extended Security → Sales) | Permission | Lets a user override the `Restrict Delivery Date Based On Available Date` restriction and assign delivery dates for out-of-stock merchandise before the next available date. |
| `Restrict Delivery Date Based On Available Date` (Point of Sale Control Settings → Delivery tab) | Checkbox | Controls whether users may assign delivery/pickup dates for out-of-stock merchandise **prior to** the Next Available Incoming Purchase Order Date, or the Expected Receipt Date if no available POs exist. If checked, only users with the proper security can override. |

**Behavior & rules.**
- **Exact formula:** `Expected Receipt Date = current date + Purchase Lead Days + Purchase Delivery Pad Days (if the user has access)`. This date appears in **View Product Availability**.
- **This is a deliberately-lied-to date.** The padded date is what most users see; the permission is what reveals truth. Two users looking at the same PO see different promise dates.
- `Next Available Incoming Purchase Order Date` and `Expected Receipt Date` **include the Purchase Delivery Pad Days when appropriate** — so the POS restriction is enforced against the padded date, not the real one.
- Sales order entry and delivery scheduling "ensure that all the existing applicable (delivery/pickup) lines on the document are available by the specified date." **If the user lacks sufficient staff security, a warning message appears and a manager override is required to save the order.**
- **eSTORIS uses purchase delivery pad days in the same manner as standard STORIS** — the padding is applied to the consumer-facing web channel too.
- The conversion spreadsheet allows import of purchase delivery pad days.

**Dependencies.** `VEND-052` Purchase Lead Days (same hierarchy, additive); Point of Sale Control Settings → Delivery tab; Extended Security (Purchasing) and (Sales) — remember **Extended Security is a single global kill-switch**: every per-user permission above is inert unless it is on. View Product Availability.

**Build notes.** Implement pad days as a **presentation-layer offset** on a single stored true date, never as a second stored date — STORIS's design invites the two to drift. Expose `promise_date = true_eta + pad` and `true_eta`, and gate `true_eta` on a permission. **Log every manager override of the availability restriction to `RPT-AUDIT`** with the true date, padded date, and date promised — this is exactly the data we will want when a delivery promise is missed. `[DECISION NEEDED]` Do we pad the eCommerce channel as well (STORIS does), or show web customers the true ETA?

---

### `VEND-052` Purchase Lead Days
*storis_ref: article 15243029817876*

**Purpose.** The number of days between placing a PO on a vendor and expected ship/receipt; drives default vendor ship dates, ATP dates, JIT and automatic replenishment, and merchandising analysis.

**Where it lives.** No single screen — it is a **resolved value** collected from a defined hierarchy of settings screens.

**Behavior & rules.**

**The resolution hierarchy is the whole article. The system checks these in order and uses the FIRST one it finds with a valid response:**

1. **ATP Web Service**, if licensed and active, is checked for lead times. Otherwise the standard lead time hierarchy is used.
2. `Purchase Lead Days` in **District and Regional Product Settings**
3. `Purchase Lead Days` in **Advanced Product Settings**
4. Lead days established for the warehouse/store in **Vendor Ship from Location Lead Days** (`VEND-088`)
5. `Purchase Lead Days` in **Vendor Ship-From Settings** (`VEND-090`)
6. `Lead Time` in **Regional Vendor Settings** (`VEND-059`) — **Regional Processing must be active**
7. `Lead Days` on the **Product Group Exceptions** screen (Action button on Advanced Vendor Settings)
8. `Lead Days` on the **Product Category Exceptions** screen (Action button on Advanced Vendor Settings)
9. `Purchase Lead Days` in **Advanced Vendor Settings**
10. `Average Lead Time` in **Vendor Settings** (`VEND-087`)

- **This is a product-first, vendor-last hierarchy**: a per-product lead time beats every vendor-level setting. Note that it is *not* strictly most-specific-wins — product-group and product-category exceptions (7, 8) sit **below** the ship-from settings (4, 5).
- During **Purchase Order Entry** the system adds the resolved purchase lead days (if any) to the current date to calculate the **default vendor ship date**.
- **The system also references `Exclude Weekends in Vendor Lead Days` in the Purchasing Control Settings when calculating purchase lead days** — lead days may be business days rather than calendar days.
- **Hard gotcha:** "If Vendor Ship From information is not set up in Advanced Product Settings on a per product basis, the vendor ship from Lead Days is **not** used to calculate the ATP date." So tier 4/5 silently drop out of the ATP calculation unless the product carries a ship-from.

**Dependencies.** `VEND-051` Purchase Delivery Pad Days (added on top); `VEND-059` Regional Vendor Settings; `VEND-087` Vendor Settings; `VEND-088` Vendor Ship from Location Lead Days; `VEND-090` Vendor Ship From Settings; Advanced Vendor Settings; Advanced Product Settings; District and Regional Product Settings; Purchasing Control Settings (`Exclude Weekends in Vendor Lead Days`); ATP web service.

**Build notes.** This is a textbook case for our **settings resolver**: register `purchase_lead_days` with scopes `PRODUCT_REGION` → `PRODUCT` → `VENDOR_SHIP_FROM_LOCATION` → `VENDOR_SHIP_FROM` → `VENDOR_REGION` → `PRODUCT_GROUP` → `PRODUCT_CATEGORY` → `VENDOR_ADVANCED` → `VENDOR`. **Reproduce STORIS's exact order even where it is not most-specific-wins**, or explicitly decide to change it and document the change — silently "fixing" the order will change every ATP date on conversion. Also implement `exclude_weekends` as a calendar mode on the same setting. `[DECISION NEEDED]` Do we adopt STORIS's ordering verbatim for data-migration fidelity, or move product-group/category exceptions above ship-from where they arguably belong?

---

### `VEND-053` Purchase Order Item Selection
*storis_ref: article 15243030718484*

**Purpose.** Choose which PO lines are included in a receiving load being scheduled.

**Where it lives.** Available from the grid in **Maintain Receiving Detail**, as an extra Action.

**Fields**

Grid columns only:

| Field | Type | Purpose / business rule |
|---|---|---|
| `ID` | Display | Line identifier |
| `Product` | Display | Product code |
| `Description` | Display | Product description |
| `Special Order Details` | Display | Special-order info for the line |
| `Dock Scheduled` | Display / flag | Whether the line is already dock-scheduled |

**Behavior & rules.**
- **Hard rule: "You will only have access to the extra action when a Freight Load Number has been entered."** When using a **Trip ID** or **Container ID** instead, the PO lines associated with the trip or container are already known, so no manual selection is offered.
- This is the manual-selection escape hatch for freight-load receiving, where the carrier's load does not self-describe its contents.

**Dependencies.** Maintain Receiving Detail; `RCV-050`–`RCV-054` (separate-freight-bill / container receiving). This article **confirms the three receiving-identification modes**: Freight Load Number (contents chosen manually), Trip ID (contents implied), Container ID (contents implied) — which lines up with `COST-033` itemized container receiving being a distinct path from `COST-031` vendor-level landed-freight factors.

**Build notes.** Our receiving batch needs a `load_identifier_type` enum (`FREIGHT_LOAD` / `TRIP` / `CONTAINER`) that determines whether the line-selection UI is offered. Article is thin on validation — no mention of partial-quantity selection, so assume line-level all-or-nothing and confirm with STORIS.

---

### `VEND-054` Purchase Order Shipping Type Settings
*storis_ref: article 15243030726676*

**Purpose.** Maintain the code table of **PO shipping types** — instructions to the vendor about how a PO may ship (e.g. "ship as available", "ship as complete series"). **This information is transmitted via EDI.**

**Where it lives.** Accessed from menu.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Purchase Order Shipping Type` | Code, **max 6 characters** | Enter a new code, or use the Search button to pick an existing one from the *Purchase Order Shipping Type* lookup window. Entering a new code activates `Description` and `Active`. |
| `Description` | Text, **max 50 characters**, required | **The description — not the code — is what appears in the `PO Shipping Type` field in Enter a Purchase Order.** Only active when a *new* shipping code is entered. Has an Action button to the **Description Field - Language Translation Entry** window. |
| `Active` | Checkbox | If checked the code appears as an option in `PO Shipping Type` (Enter a Purchase Order) and in `Purchase Order Shipping Type Default` (Purchasing Control Settings); if unchecked it does not. |

**Behavior & rules.**
- **Hard rule: once a shipping code is created it cannot be deleted.** It can only be made inactive by un-checking `Active`. (This is the *right* pattern — contrast with `Allow Transmitted AP Bill Deletion`.)
- **Only active shipping types are displayed** in `PO Shipping Type` and in the `Purchase Order Shipping Type Default` setting.
- The default shown in Enter a Purchase Order is set via `Purchase Order Shipping Type Default` in **Purchasing Control Settings**; **this is not required** — there may be no default.
- Codes also apply to POs **created on-the-fly via Enter a Sales Order** (special-order/drop-ship path), not just manually-entered POs.
- **The `Description` field is only editable at create time** as written ("This field is only active if a new shipping code is entered into the Purchase Order Shipping Type field") — implying no rename of an existing code's description from this screen.

**Dependencies.** Purchasing Control Settings (`Purchase Order Shipping Type Default`); Enter a Purchase Order; Enter a Sales Order (on-the-fly PO creation, relates to `PO-060` drop-ship); `VEND-084` Vendor EDI Settings (this value is transmitted via EDI); Description Field - Language Translation Entry (`VEND-062` Select Printable Language).

**Build notes.** Straightforward code table: `code` (≤6), `description` (≤50, i18n), `active`. **Adopt soft-delete-by-inactive as our standard for all code tables.** Do *not* copy the "description only editable at create" restriction — that is a UI accident, not a business rule; allow renames but audit them (`RPT-AUDIT`), since the description is the EDI-visible/user-visible label.

---

### `VEND-055` Purchase Order Type Settings
*storis_ref: article 15243030718740*

**Purpose.** Maintain the PO **type** code table used to classify purchase orders. Type drives As-Is receiving, sales-order linkage eligibility, supply/ATP inclusion, third-party change permission, transfer-on-receipt, and container EDI cost processing.

**Where it lives.** `Purchasing > Settings > Purchase Order Type Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Purchase Order Type` | Code, **1–6 alphanumeric** | New code, or Search to edit an existing one. **STORIS ships exactly one type: `STND` = Standard.** |
| `Description` | Text, **max 15 characters**, **mandatory** | Action button opens *Description Field - Language Translation Entry*. |
| `As-Is Reason` | Reason code | Search opens the Read-Only Lookup Window listing reason codes designated **"As-Is" via the usage code field**. **If no reason codes carry the As-Is usage code, all reason codes are included in the list.** |
| `Active` | Checkbox | Checked ⇒ type may be assigned to POs. **Newly created types default to checked.** |
| `Allow Sales Order Linkage to Purchase Order` | Checkbox, **defaults checked** | Whether this PO type is considered when linking sales orders to POs. |
| `Include in Supply Calculation` | Checkbox | Whether POs of this type count as available supply. |
| `Third Party Purchase Order Changes` | Checkbox | Whether third-party interfaces (e.g. AFI's replenishment interface) may change POs of this type. |
| `Transfer on Receipt` | Checkbox | Allows automatic creation of stock transfers through Enter a Purchase Order. |
| `Container` | Checkbox | **Designates the PO as a "container type" to trigger container-specific EDI cost processing settings in Vendor EDI Settings.** |

**Behavior & rules.**
- **`As-Is Reason` is a big one: "If you designate a reason code in this field and then assign this type to a purchase order, the PO is received directly into As-Is inventory using this reason code."** An entire PO's receipt lands in As-Is stock purely because of its type code — no per-line decision at receiving.
- **`Active` hard rule: "If you select this purchase order type as the system default via your Purchasing Control Settings, you cannot de-activate it."**
- `Allow Sales Order Linkage` governs "the linkage process (used by the order item entry process as well as **Generate Daily Reports** to assign back-ordered items to purchase order)". **NOTE: "This setting does not have any effect on linking purchase orders and sales orders through the Enter a Purchase Order process."** — the restriction is bypassable by doing the link from the PO side. **That is an enforcement hole, not a feature; do not copy it.**
- `Include in Supply Calculation` — when checked, POs of this type are considered available supply for exactly:
  - replenishment calculations — **both AFI replenishment and STORIS standard replenishment**
  - **ATP (Available to Promise) Date calculations**
  - **Net PO calculations, including the display on the View Product Availability screen**
- **ATP recalculation warning (exact behavior):** "If you have ATP set up, changing any purchase order type will require ATP dates to be recalculated. If you check or uncheck the box, a warning message displays when you save your changes. If you select yes, the ATP dates are recalculated when **End of Day processing** runs, **in the meantime ATP dates will not reflect the changes made to the setting**. Select No to cancel the update." **So there is a window of up to a day where promised dates are knowingly wrong.**
- `Third Party Purchase Order Changes`: checked ⇒ the third party is notified POs of this type **can** be changed; blank ⇒ notified they **should not** be changed. Example given: for "special buy" POs left blank, "the third party replenishment should not decrease the ordered quantity even if it detects that too many are being purchased." **This is advisory only — STORIS notifies, it does not enforce.**
- `Transfer on Receipt`: when enabled, **`Transfer on Receipt Locations` and `Transfer on Receipt Quantities` become available under the global extra actions in Enter a Purchase Order.**
- **You can use the `Review Settings Activity` routine to report on changes to the purchase order types.** (Note: this is one of the *very few* places STORIS offers change history — remember **STORIS has no general change-audit log**. Feed this into `RPT-AUDIT`.)

**Dependencies.** Purchasing Control Settings (system-default PO type); `VEND-084` Vendor EDI Settings (`Container` flag drives container EDI cost processing — this is the `COST-033` itemized-container-receiving path); As-Is reason codes / usage codes; ATP; AFI replenishment interface; Enter a Purchase Order; `Review Settings Activity`; Description Field - Language Translation Entry.

**Build notes.**
- PO type is a surprisingly load-bearing dimension. Model it as `po_type { code(≤6), description(≤15, i18n), active, as_is_reason_id, allow_so_linkage, include_in_supply, allow_third_party_changes, transfer_on_receipt, is_container }`.
- **Close the linkage hole**: our `allow_so_linkage=false` must block linking from *both* directions.
- **Do not defer ATP recalculation to a nightly job.** Recalculate affected ATP dates synchronously (or via an immediate queue) when `include_in_supply` changes; STORIS's "wrong until End of Day" behavior is a customer-promise defect.
- `Container` is our hook for `COST-033`. **Enforce mutual exclusivity there: a container-type PO must not also draw vendor-level landed-freight factors (`COST-031`).**
- `[DECISION NEEDED]` Do we want a `FLOOR` (floor sample) PO type at go-live, and should floor-sample receipts hit a separate inventory bucket rather than As-Is?

---

### `VEND-056` Receiving Capacity Settings
*storis_ref: article 15243032413844*

**Purpose.** Define, per location + date + receiving group, how many inbound loads and pieces the dock can take before the day's receiving schedule is considered full. This is the framework behind the **Receiving Daily Schedule**.

**Where it lives.** `Menu > Inventory > Settings > Receiving Capacity Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Location` | Dropdown, **required** | Existing warehouse or store. |
| `Date` | Date (calendar icon) | The date merchandise can be received at that location. |
| `Receiving Group Code` | Code, **max 5 alphanumeric**, required in grid | Must be a valid existing group; invalid ⇒ warning and re-entry. Extra action `(...)` opens **Receiving Group Settings** so a new group can be created without leaving the process; on return the new code can be selected. |
| `Description` | Display | Receiving group description. |
| `Override Loads` | Optional numeric **0–99** | Max timeslots available to receive scheduled merchandise for the day. **If a value is entered, this number is used instead of `Max Loads`.** |
| `Max Loads` | **Required** numeric **0–99** | Max loads accepted before the receiving schedule is considered full. |
| `Override Pieces` | Optional numeric **0–99999** | Max pieces for the day; **if entered, used instead of `Max Pieces`.** |
| `Max Pieces` | Optional numeric **0–99999** | Max pieces before the schedule is full. |

**Behavior & rules.**
- **Progressive activation:** initially only `Location` and `Date` are active. Once both are entered they become **inactive** (locked), the receiving schedule for that location/date is loaded into the grid, and `Receiving Group Code`, `Description`, `Override Loads`, `Max Loads`, `Override Pieces`, `Max Pieces` activate.
- **Date validation:** `Days to Receive` and `Exception Dates` from **Warehouse/Store Receiving Settings** (`VEND-094`) are checked "to ensure that capacity settings are not created for days when receiving does not occur. If the date is not valid, a warning message is displayed and a valid date must be entered."
- **If the date selected is prior to the current date, the receiving schedule is displayed in read-only mode and updates are not allowed.**
- **Default-carry-forward rule:** "If the Receiving Capacity Settings have not yet been assigned for a location/day, **the most recent prior day's settings for the location are used by default**… **However, it's important to note that the override loads and pieces will not be carried over.**" — max values carry forward, overrides deliberately do not (they are temporary by design).
- **If `Override Pieces` and `Max Pieces` are left empty, pieces are not considered at all when determining if a receiving schedule is full.** Capacity then becomes load-count-only.
- **Cross-check against location maximum:** "The maximum number of loads should not exceed the `Maximum Number of Loads` defined in the Warehouse/Store Receiving Settings. If it does, a warning message is displayed. If the `Yes` button is selected, **the entry is accepted**, otherwise the field is cleared." — **a soft limit that can be knowingly exceeded.**
- **Interval-derived cap:** loads accommodated may be limited by `Receiving Intervals` in Receiving Group Settings and may be less than the max defined. Exact message: **"Maximum loads capacity for Receiving Group <receiving group> is <maximum allowed for the group>."**
- **NOTE (explicit):** "The capacity settings form the framework for the Receiving Daily Schedule. It does not necessarily indicate that all receiving group codes in the capacity settings will be received each day. It simply serves as providing the maximum load/pieces defaults that could be scheduled."

**Dependencies.** `VEND-057` Receiving Group Settings (group codes, receiving intervals); `VEND-094` Warehouse/Store Receiving Settings (`Days to Receive`, `Exception Dates`, `Maximum Number of Loads`); Receiving Daily Schedule; `VEND-053` Purchase Order Item Selection (`RCV-050`–`RCV-054`).

**Build notes.** Model as `receiving_capacity(location, date, group)` with `max_loads`, `max_pieces`, `override_loads`, `override_pieces`. Implement carry-forward as a **computed fallback to the most recent prior configured day, not a row copy**, so a change to the template day propagates and overrides genuinely stay one-day-only. Keep the "may exceed with confirmation" soft limit but log the override to `RPT-AUDIT`. `[DECISION NEEDED]` Do we want capacity measured in pieces, cubic feet, or dock-minutes? STORIS offers loads + pieces only; mattress volumetrics may need cube.

---

### `VEND-057` Receiving Group Settings
*storis_ref: article 15243032411284*

**Purpose.** Create the user-defined receiving groups (by merchandise type) that the receiving schedule is built from, including their daily receiving window, slot length, and break times.

**Where it lives.** `Menu > Inventory > Settings > Receiving Group Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Location` | Dropdown, **at least one valid location required** | **No restriction on the type of location.** Initially the dropdown is empty with `'No Location Selected'` shown below it; once selected the location's description displays below the box. |
| `Receiving Group Code` | **Required**, max **5 alphanumeric** | **Used as part of the confirmation number assigned for a receiving load.** Lookup lists existing codes for the specified location. Must be specified before the rest of the process can be completed. |
| `Description` | **Required**, max **30 alphanumeric** | Clearer definition of the merchandise type. Extra action allows multi-lingual translations. |
| `Category` | Optional, max **6 alphanumeric** | Product category; verified against **Category Settings**, invalid ⇒ warning and re-entry. Extra action assigns **multiple** product categories to the group. |
| `Start Time` | **Required**, **military time** (e.g. `14:00` for 2:00pm) | Earliest time a load can be scheduled for receiving. |
| `End Time` | **Required**, **military time** | Latest time permitted for receiving merchandise. |
| `Receiving Interval` | Optional, up to **3 numeric** | Anticipated **minutes** needed to unload the merchandise. |
| `Break Start Time` | Optional, **military time** (e.g. `13:00`) | Start of a break. Extra action opens **Multiple Break Selection** if multiple breaks are needed. |
| `Break Interval` | Numeric **1–999** | Length of each assigned break. **Optional unless `Break Start Time` has been assigned, then it is required.** When multiple breaks are used an ellipsis is displayed to specify each. |

**Behavior & rules.**
- **Delete rule (hard): "The Receiving Group Code can only be deleted if it does not exist in any receiving schedules."** Exact message: **"Receiving Group Code XXXX cannot be deleted, it exists in receiving schedules."**
- **Category matching rule (hard):** "A product category can be assigned to one or more receiving groups. **When a product category is assigned, the purchase orders being received must contain at least one item that is part of one of the categories assigned.** If no product categories are assigned, this indicates that **any type of merchandise can be received** during the time slot."
  - Note this is an **"at least one item"** test, not an all-items test — a mixed PO qualifies for a group if a single line matches.
- **Timeslot generation formula:** "Using the `Override Loads` or `Maximum Loads` defined in the Receiving Capacity Settings, the time slots determined for a day take the `Start Time` and add these minutes to determine the next time slot. This continues until the minutes exceed the `End Time` **or** when the number of loads are met."
- **When `Receiving Interval` is not assigned for a receiving group, receiving is done on a first-come-first-served basis.**
- **"Specific times are not supplied to a carrier."** — the schedule is internal; the vendor/carrier is not told its slot time.

**Dependencies.** `VEND-056` Receiving Capacity Settings (consumes intervals and group codes); Category Settings (`PRODUCT_CATEGORY` scope); `VEND-094` Warehouse/Store Receiving Settings; receiving load confirmation numbering.

**Build notes.** Groups are per-location; store as `(location, group_code)` composite. **Implement the "does it exist in any schedule" guard as a soft-delete/inactive flag instead of a hard delete block**, matching the pattern we adopted in `VEND-054`. The category test needs to be explicit in our model — `match_mode = ANY_LINE` (STORIS behavior) vs `ALL_LINES`; expose it. `[DECISION NEEDED]` STORIS deliberately does not give the carrier a slot time. **We should**: a dock-appointment confirmation to the carrier is table stakes and would remove most of the receiving-day chaos — decide whether to build carrier-facing appointment confirmations.

---

### `VEND-058` Region Settings
*storis_ref: article 15243032741396*

**Purpose.** Define **regions** — groupings of stores and warehouses used to **segregate inventory and inventory activity** (as opposed to **districts**, which segregate **sales** activity). Regions also carry a mailing address, tax IDs, and the replenishment warehouse hierarchy.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Sales and Service System Settings > Region Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Region Code` | Code | Identifies the region; Search selects an existing one. |
| `Name` | Text | Region name. |
| `Address Line 1` | Text | First line of the region's mailing address. |
| `Address Line 2` | Text | **"Use this field only for P.O. Box, Dept., etc., not for city, state, or zip code."** |
| `Zip Code/Postal Code` | Code | **Must already exist in the Zip Code file.** |
| `City/Town` | Text | Defaults from the zip code record; may be overridden. |
| `State/Province` | Text | Defaults from the Zip Code record; may be overridden. |
| `Telephone` | Phone, **up to ten digits** | Region telephone number. |
| `Federal ID Number` | Text | If applicable. |
| `State ID Number` | Text | If applicable. |
| `Sales Tax Number` | Text | If applicable. |
| `Locations` | Multi-select | Stores and warehouses in the region. Search ⇒ **Multiple Selection Lookup** window; Actions ⇒ **Multiple Location Lookup** window. |
| `Regional Warehouse` | Location code | **"If Regional Processing is active, each region must have a single regional warehouse."** |
| `Service Warehouse` | Location code | Determines the **default service location** when entering a service order for a location in this region. |
| `Primary Warehouse` (For Stores) | Location code | **Mandatory if using Auto Stock Replenishment.** First location checked for replenishment stock for stores. **Must be set up as a warehouse-type location at the `Location Type` field on the General tab of Warehouse/Store Location Settings.** |
| `Secondary Warehouse` (For Stores) | Location code | Checked if insufficient stock at Primary. Same warehouse-type requirement. |
| `Tertiary` (For Stores) | Location code | Checked if insufficient stock at Primary and Secondary. Same warehouse-type requirement. |
| `Primary Warehouse` (For Warehouses) | Location code | **Mandatory if using Auto Stock Replenishment.** First location checked for replenishment stock for warehouses. |
| `Secondary Warehouse` (For Warehouses) | Location code | Checked if insufficient stock at Primary. |
| `Tertiary` (For Warehouses) | Location code | Checked if insufficient stock at Primary and Secondary. |

**Behavior & rules.**
- **Region vs district is the key distinction: regions segregate *inventory* activity; districts segregate *sales* activity.**
- **"To restrict report output by region, Regional Processing must be active."** Many reports expose a Region filter that does nothing without it.
- **Access to the Primary/Secondary/Tertiary entry fields depends on whether Replenishment is active for Stores and/or Warehouses**, per the **Replenishment page of Inventory Control Settings**. Store-replenishment and warehouse-replenishment hierarchies are assigned **independently**.
- **Override precedence (hard rule):** "If the Replenishment information is populated, the Primary/Secondary/Tertiary warehouse locations specified are used for replenishment of **all** products in this region, **except those products belonging to a specific group, category, or location where replenishment locations have been specified. Replenishment information at those levels override these fields in region settings.**" ⇒ resolution order is **location → category → group → region**.

**Dependencies.** Zip Code file; Warehouse/Store Location Settings (`Location Type` must be warehouse-type); Inventory Control Settings → Replenishment page; District Settings; Automatic Stock Replenishment for Locations; `VEND-059` Regional Vendor Settings and `VEND-052` (tier 6 of the lead-days hierarchy) both depend on **Regional Processing** being active.

**Build notes.** `REGION` is already a resolver scope; this article confirms `VENDOR_REGION` and adds region-level replenishment as another most-specific-wins chain (`location > category > group > region`). **Note that this replenishment chain IS most-specific-wins, unlike the lead-days chain in `VEND-052`** — do not assume STORIS is consistent. Validate that a region's replenishment targets are warehouse-type locations at save time. `[DECISION NEEDED]` LA Mattress: do we need region *and* district as separate dimensions, or is one geography hierarchy with a role flag enough?

---

### `VEND-059` Regional Vendor Settings
*storis_ref: article 15243032743572*

**Purpose.** Hold per-**vendor × region** contact, carrier, and purchase-order lead/pad-day overrides, plus regional customer-service contacts. This is tier 6 of the purchase-lead-days hierarchy.

**Where it lives.** Reachable from **17 distinct menu paths** — the article lists them all, which itself tells you how central vendor data is. Notable ones: `Customer > Settings > Purchasing Settings > Regional Vendor Settings`; `Merchandising and Distribution > … > Vendor Information > Regional Vendor Settings`; `Accounting > Vendor Receivables > Vendor Receivables Settings > Regional Vendor Settings`; `Accounting > Payables > Payables Settings > Vendor Information Settings > Regional Vendor Settings`; `Accounting > General Ledger > General Ledger Settings > Payables Settings > Regional Vendor Settings`; `Accounting > Third Party Accounting > Payables > Payables Settings > Vendor Information Settings > Regional Vendor Settings`; `System Administration > System Settings > Accounting System Settings > Payables System Settings > Regional Vendor Settings`.

**Tabs:** `General Information`, `Customer Service`.

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor` | Code | Search opens the **Vendor Cross Reference** window. |
| `Name` | Display | Name of the selected vendor. |

**Fields — General Information tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Region` | Code | Search ⇒ **Region Read-Only Lookup**. **Action button loads *all* regions into the grid.** Double-click a grid row to edit that region's data. |
| `Contact` | Text | Vendor contact for the selected region. |
| `Phone Number` | Phone | Vendor phone for the region. |
| `FAX Number` | Phone | Vendor fax for the region. |
| `Carrier` | Code | The company used to ship merchandise **to and from** the selected region. Search ⇒ **Freight Company Read-Only Lookup**. |
| `Lead Days` (Purchase Order Delivery) | Integer | "The usual number of days it takes to receive goods from this vendor after a purchase order has been generated **for the current ship-from address**." |
| `Lead Pad Days` | Integer | **"If a purchase order does not exist, this field is used in the available to promise (ATP) calculation to estimate an ATP date."** Days added to lead days to estimate a promise date. |
| `PO Pad Days` | Integer **0–999** | Purchase delivery pad days for the vendor; added to purchase lead days to establish an estimated ship date. Used as the sales-promise cushion (see `VEND-051`). |

**Fields — Customer Service tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor` / `Name` | Display | From the header selection. |
| `Region` | Code | Same lookup/Action-loads-all-regions behavior. |
| `Service Contact` | Text | Service contact for the region. |
| `Service FAX` | Phone | Service fax number for the region. |

**Behavior & rules.**
- **`Lead Pad Days` and `PO Pad Days` are two different pads and are easy to confuse.** `Lead Pad Days` is used **only when no PO exists**, to estimate an ATP date. `PO Pad Days` is the sales-facing cushion applied to real POs. Both are vendor×region.
- **ATP recalculation warning (exact behavior):** "If you have ATP set up, changing the `PO Pad Days` **when there are active open purchase orders from that vendor** will require ATP to recalculate the purchase order supply for that product. A warning message will display when you save your changes. If you select yes, ATP is recalculated when **End of Day processing** runs, **in the meantime, the new pad days value will not be reflected in the ATP date of that product.** Select No to cancel the update."
- Grid behavior (both tabs): stores data for all regions entered; double-click a line to activate the fields; then **`Save`** to save, **`Clear`** to discard changes, or **`Remove`** to remove the item from the grid. **`Remove` is an unconfirmed delete of a vendor-region record from the grid — flag as destructive-reach.**
- The `Carrier` field means the **default freight company is vendor×region scoped**, not vendor-global.

**Dependencies.** `VEND-058` Region Settings (Regional Processing must be active for the `Lead Time` tier to apply, per `VEND-052`); `VEND-052` Purchase Lead Days (tier 6); `VEND-051` Purchase Delivery Pad Days; Freight Company file; Vendor Cross Reference; ATP; End of Day processing. Reachable from Payables and Vendor Receivables menus — **this is the closest this section comes to AP configuration.**

**Build notes.** Register `purchase_lead_days`, `lead_pad_days`, `po_pad_days`, and `default_carrier` at scope `VENDOR_REGION` in the resolver. **Replace `Remove` with a confirmed soft delete** and audit it. **Recalculate ATP synchronously**, not at End of Day (same objection as `VEND-055`). `[DECISION NEEDED]` Do we need vendor×region contacts at all, or is a single vendor contact list with a region tag sufficient for a single-region operator?

---

### `VEND-060` Return to Vendor Tax Settings
*storis_ref: article 15243032741012*

**Purpose.** Control how sales tax on a return-to-vendor (RTV) flows into the **AP debit bill** and the general ledger. **This is the most AP-relevant article in the whole section and it directly extends `RTV-012`.**

**Where it lives.** No menu path given in the article. It documents two settings plus the end-to-end process flow.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Create AP Debit Bills with Tax Amount` | Setting (on/off) | The AP Debit Bill creation process uses the **previously calculated tax amounts** (from the **Create Return-To-Vendor List** routine) to populate the tax amount on the AP debit bill. |
| `Post General Ledger for Tax Impact` | Setting (on/off) | When creating an AP debit bill, posts to the **Accounts Payable sales tax account** for the **total** tax amount of the return-to-vendor list. |

**Behavior & rules.**
- **Tax is calculated at list creation, not at bill creation, and is then carried forward.** "Using the previously calculated tax amounts from the Create Return-To-Vendor List routine, the system creates AP debit bills with the tax amount populated. **This occurs for debit bills created directly through the Complete Return-To-Vendor routine as well as for debit bills created at a later time that reference the RA number of the return.**"
- **Hard rule / material limitation: "Since only one general ledger posting occurs, to allocate the tax value to multiple general ledger accounts, you must subsequently perform a manual adjustment to the AP bill."** One RTV = one tax GL line, regardless of how many jurisdictions or accounts the underlying merchandise touched.
- **Exact general process flow (quoted structure):**
  1. Create a **return-to-vendor tax table**, linking **tax jurisdictions to company state/province and vendor state/province combinations**
  2. Create a **return-to-vendor list**
  3. **Tax calculates based on previously established settings**
  4. **Complete a return to vendor**
  5. If automatically creating an AP debit bill, the program adds tax to the AP debit bill and general ledger posts accordingly.
  6. If **not** automatically creating an AP debit bill, the program **retains calculated tax until you create the AP bill**. Once you create an AP debit bill, the program imports the previously calculated tax amounts into it and posts GL accordingly.
- **The tax jurisdiction is keyed on the company state/province × vendor state/province pair** — i.e. the ship-from/ship-to states of the *return*, not the original purchase.
- **Terminology note that matters for `RTV-012`:** STORIS calls the vendor-credit document an **"AP debit bill"** (a debit memo against the payable), and it can be created **either automatically at RTV completion or manually later by referencing the RA number**. The **RA number** is the linking key.

**Dependencies.** `RTV-012` (RTV list → completion → expected vendor credit in AP) — **this article supplies the AP-side mechanics `RTV-012` was missing**. `RTV-020`/`RTV-021` wrong-vendor corrections (offsetting expense and credit bills) would each generate their own AP debit bill via this path. Create Return-To-Vendor List; Complete Return-To-Vendor; return-to-vendor tax table; AP sales tax GL account.

**Build notes.**
- Implement the vendor-credit document as a first-class **AP debit memo** with a hard link to the RTV/RA, created either eagerly at RTV completion or lazily by RA reference. **Store the tax computed at list time on the RTV lines so a later debit memo is reproducible.**
- **Fix STORIS's single-GL-line limitation**: post tax per jurisdiction/GL account from the start. Requiring a manual AP adjustment to allocate tax is a guaranteed source of misstated tax liability.
- `[DECISION NEEDED]` **Partial-credit reconciliation is still not answered here.** This article covers *creating* the debit bill; it says nothing about matching it against the credit the vendor actually issues. See the "Open gaps" section at the end of this file.

---

### `VEND-061` Route Capacity Settings
*storis_ref: article 15243030956052*

**Purpose.** Set per-route, per-day delivery-capacity cutoffs for a calendar month (stops, dollars, units, volume). Route-specific cutoffs **override** the global cutoffs in Route Capacity Control Settings.

**Where it lives.** `Logistics > Settings > Route Capacity Settings`; `System Administration > Get Started - Enter Your Information > Get Started Step 4 - Delivery > Route Capacity Settings`; `System Administration > System Settings > Purchasing and Logistic System Settings > Logistical System Settings > Route Capacity Settings`. Read-only as the **Routing Cutoff Calendar** from the Action button at the `Route` field in Enter a Sales Order / Enter a Return / Enter an Exchange, and at the `Service Date` field in Enter a Service Order.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Month` | 2-digit | Current month defaults; Arrow button lists months. |
| `Year` | 4-digit | Current year defaults. **"You cannot enter a past year into this field."** |
| `Route Type` | Enum: **`Delivery`, `Service`, `Transfer`** | Selection filters the `Route Code` list. |
| `Route Code` | Code | The route whose calendar is being modified; list constrained by `Route Type`. |
| `Day` | Day of month | The day whose cutoffs are being modified. |
| `Stops` | Numeric | Max stops for the date. **Zero prevents deliveries that day. Blank ⇒ the system does not check or monitor that day.** |
| `Dollar` | Numeric | Max dollar value of deliveries for the date. Zero prevents; blank ⇒ unmonitored. **Inactive if `Route Type` = `Transfer`.** |
| `Units` | Numeric | Max units for the date. Zero prevents; blank ⇒ unmonitored. |
| `Volume` | Numeric | Max truck capacity units for the date. Zero prevents; blank ⇒ unmonitored. |
| `Additional Comments` | Text | Entered per route+day; stored with the route calendar data and displayed in inquiry screens. |

**Behavior & rules.**
- **The blank-vs-zero distinction is a hard rule and is easy to get wrong: `0` = closed, blank = unlimited/unmonitored.** It applies to all four capacity fields.
- **Initialization rule (hard): "If you do not initialize the route code for the month, you cannot schedule orders to that route code for that month."** The grid has 31 rows; the first access to a month/year/route combination loads defaults (if any) from **Route Capacity Control Settings**; clicking `Save` initializes the route for that month.
  - Diagnostic given: **"if you access a route code in this routine and then click on Clear or Exit without making any changes, if the option to discard changes appears anyway, the route code has not been initialized for that calendar month."**
- Once a valid month/year/route code is entered the calendar appears. **Days may be unavailable because a cutoff limit has been reached, or because the date is prior to the current system date.**
- Grid displays **actual (current)**, **maximum (cutoff)**, and — per the Grid Information section — **open (actual subtracted from maximum)** for Stops, Units, Dollars and Volume.
- **"Estimated orders affect the Route Capacity calculations which may reduce delivery stop counts."**
- Volume may be expressed as precise cubic feet or as assigned "units" per item — **example given: a three-cushion sofa may equal 3 units; a two-cushion sofa may equal 2 units.** If the system cannot calculate a volume for an item, **a volume of zero (0) appears for the item** (i.e. it consumes no capacity — silently).
- Read-only version: **all fields except `Day` are inactive.**
- `Consolidate Stops` in **Route Capacity Control Settings** merges orders with similar delivery information into a single delivery stop.
- Actions: **Shared Route Capacity Settings** — updates the associated shared route pool capacities.

**Dependencies.** Route Capacity Control Settings (global defaults, `Consolidate Stops`); `VEND-064` Shared Route Capacity Settings; `VEND-065` Shared Route Code Settings; Logistical Route Settings; Volume Calculation topic; Product/Group/Route Mapping volume hierarchy (detailed in `VEND-064`).

**Build notes.** Model capacity as `(route, date) → {stops, dollars, units, volume}` with **nullable = unmonitored** and explicit `0` = closed, but **surface that distinction in the UI** ("No limit" vs "Closed") rather than relying on empty-vs-zero. **Drop the "must initialize the month or you cannot schedule" behavior** — generate capacity rows lazily from the control-settings defaults. **Do not silently treat unmeasurable items as volume 0** — flag them, since a truck full of zero-volume items will overbook.

---

### `VEND-062` Select Printable Language
*storis_ref: article 15242997980180*

**Purpose.** Pick which language(s) a sales or service document prints in. One copy is printed per selected language.

**Where it lives.** "Any routine where you print sales or service documents, such as `Print Delivery Tickets`, print copy of order in `Enter a Sales Order`, etc."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Language grid (checkboxes) | Multi-select | Displays the **active document languages**. First line is the logged-in user's default language, initially checked. |
| `All` button | Action | Select all languages listed. |
| `None` button | Action | Clear all check marks. |
| `Save` | Action | Print one copy of the document in each selected language. |

**Behavior & rules.**
- **Hard rule: "The default language is selected and cannot be unchecked."** It shows as the first language listed.
- Default language resolution:
  - **Location default** ⇒ `Document Language` field on the **Miscellaneous** tab of Warehouse/Store Location Settings.
  - **User default** ⇒ `Language Code` field on the **General** tab of Create a User / Create a User Group.
- **To cancel printing: clear all check marks and click `Save`, or click `Exit`.** (Note the contradiction with "the default cannot be unchecked" — the article states both; treat "clear all" as reachable via the `None` button.)
- **`Always Print in Default Language`** for the location ⇒ the sales order or completed order prints using the default language regardless.
- **`Multiple Order Copies`** on the **Printed Documents** tab of **Point of Sale Control Settings**, when checked ⇒ **the Select Printable Language window keeps re-prompting after printing one copy in each selected language**, so multiple copies can be printed. **"Prompting continues until you remove the check(s) from the boxes and click the Save button."**

**Dependencies.** Warehouse/Store Location Settings → Miscellaneous tab (`Document Language`, `Always Print in Default Language`); Create a User / Create a User Group → General tab (`Language Code`); Point of Sale Control Settings → Printed Documents tab (`Multiple Order Copies`); Description Field - Language Translation Entry (used by `VEND-054`, `VEND-055`, `VEND-057`, `VEND-065`); Enhanced Laser Processing Form Designation.

**Build notes.** Our print pipeline needs a `document_languages` active list, a per-location and per-user default with **user overriding location**, and a copies-per-language print job. **Do not build the re-prompt loop** — take a numeric copies count instead. Note this article is only in this section by alphabetical accident; it is a printing setting, not a vendor setting.

---

### `VEND-063` Select Storage Locations Screen
*storis_ref: article 15243029807124*

**Purpose.** Bulk-create ("build") storage locations from a location mask, and bulk-modify or remove storage locations, during initial warehouse setup.

**Where it lives.** Reached from the **Tracked Warehouse Location Verification Settings** routine (`VEND-079`) during the initial entry of a warehouse's storage locations, via the `Action` button → either **Build Storage Locations** or **Select Storage Locations**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Select` | Display | The current element (Aisle, Rack, Bin, etc.). Clicking `OK` advances to the next element. |
| `To` | Range value | **"Enter the initial value in the range of storage locations you want to use for the current element."** |
| `From` | Range value | **"Enter the final value in the range of storage locations you want to use for the current element."** |
| `Status` | Enum: **`Vacant`, `Staging`, `Active`** | Modified per selected location in the Select Storage Locations mode. |
| `Remove` | Action | Deletes unused locations from the list. |

**Behavior & rules.**
- **The `To` and `From` field labels are swapped in the source documentation** — `To` is described as the *initial* value and `From` as the *final* value. **Flagged as a likely STORIS documentation error; verify before mirroring any import/migration logic against it.**
- **Build Storage Locations**: "automatically create locations that match the mask defined in the **Warehouse Location Mask Settings**." **"Storage locations are also automatically built for existing manually created locations that are outside the mask and with product."** — off-mask locations that hold stock are absorbed into the built set.
- The system prompts for the range of **each element** (Aisle, Rack, Bin, etc.); defaults may be accepted or a range entered. When finished the locations are created and displayed in the grid.
- **Hard rule (picking floats): "If you use the picking floats feature, the system checks for existing floats that match locations you are attempting to build. If matches are found, warning messages display. You cannot build a storage location using the same ID as an existing Float ID."** — storage-location IDs and float IDs share a namespace.
- **Select Storage Locations** mode prompt, exact text: **"Select all storage locations? Choose No to pick ranges."** Yes = all locations for the warehouse; No = choose a range per element.
- Deletion is limited to **unused** locations.

**Dependencies.** `VEND-078` Tracked Warehouse Location Mask Settings; `VEND-079` Tracked Warehouse Location Verification Settings; `VEND-048` Picking Zone Assignment Window; `VEND-077` Tracked Storage Location Settings; picking floats.

**Build notes.** Provide a location-generator from a mask with per-element ranges, a **preview-before-commit** step (STORIS creates immediately), and a uniqueness check across the combined location + float ID namespace. **Fix the To/From labelling.** Status enum is exactly `Vacant | Staging | Active`.

---

### `VEND-064` Shared Route Capacity Settings
*storis_ref: article 15243030957972*

**Purpose.** Define the capacities of a **shared route capacity pool** and which route codes draw on it, so a group of routes is jointly capped as well as individually capped.

**Where it lives.** `Logistics > Settings > Shared Route Capacity Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Month` | 2-digit | Current month defaults. |
| `Year` | 4-digit | Current year defaults. **"You cannot select a past year at this field."** |
| `Route Type` | Enum: **`Delivery`, `Service`, `Transfer`** | Filters the available shared pool codes. |
| `Shared Pool` | Code | The shared route pool. **Select `Create New Record` from the list to access Shared Route Code Settings** (`VEND-065`) and create a new pool inline. |
| `Day` | Day of month | Enter or select from the grid. |
| `Stops` | Numeric | Max stops for the date. Zero prevents; blank ⇒ unmonitored. |
| `Dollar` | Numeric | Max dollar value. Zero prevents; blank ⇒ unmonitored. **Inactive if `Route Type` is `Service` OR `Transfer`.** |
| `Units` | Numeric | Max units for deliveries/transfers/service. Zero prevents; blank ⇒ unmonitored. |
| `Volume` | Numeric | **Active for `Delivery` and `Transfer` route types only.** Max truck capacity units. Zero prevents; blank ⇒ unmonitored. |

**Behavior & rules.**
- **The core rule, quoted:** "Each individual route still has its own capacities, **which might actually exceed the maximum capacity for the shared pool on a given day**. However, **once the maximum capacity for that route or for its shared pool in any one of the four categories (stops, units, dollars, volume) is met, that route is closed for the date in question.**" ⇒ **the binding constraint is `min(route cap, pool cap)` evaluated independently per category — any single category hitting its cap closes the route.**
- **Volume search hierarchy (exact, in order) for the total quantity of each item:**
  1. `Volume` field in the **Product Settings**
  2. `Capacity Units` field in the **Group Settings**
  3. `Default Weight` field in the **Route Mapping Control Settings** (**mapping must be active on your system**)
  - **"If the system cannot calculate a volume for an item based on the above hierarchy, a volume of zero (0) appears for the item."**
  - **"To specify the measurement used in calculating the delivery volume, use the `Volume` field in the Advanced Product Settings. To properly calculate maximum capacity units, this field must contain a value for the delivery scheduling program."**
- Grid shows **actual**, **maximum (cutoff)**, and **open (actual subtracted from maximum)** for Stops, Units, Dollars, Volume, across **31 rows**.
- First access to a month/year/shared-pool combination loads defaults (if any) from **Route Capacity Control Settings**; **"If you do not initialize the shared route pool for the month, you cannot schedule orders to that shared pool for that month."**
- Read-only version: `Month`, `Year`, `Route Type`, `Shared Pool` selectable; `Day`, `Stops`, `Dollar`, `Units`, `Volume` inactive.
- **Difference from `VEND-061`: `Dollar` is inactive for `Service` *and* `Transfer` here, but only for `Transfer` in the per-route screen. And `Shared Route Capacity Settings do not store comments` (per `VEND-061`).**
- Actions: **Multiple Route Selection**, **View Route Capacity Settings**.

**Dependencies.** `VEND-061` Route Capacity Settings; `VEND-065` Shared Route Code Settings; Route Capacity Control Settings; Product Settings (`Volume`), Group Settings (`Capacity Units`), Route Mapping Control Settings (`Default Weight`), Advanced Product Settings (`Volume`).

**Build notes.** Implement capacity as a set of independent counters with a **route-level and pool-level cap per counter**; the availability test is `all counters below both caps`. Register the volume hierarchy as a resolver chain `PRODUCT → PRODUCT_GROUP → SYSTEM_DEFAULT`. **Make missing volume a hard validation error at product setup, not a silent zero.**

---

### `VEND-065` Shared Route Code Settings
*storis_ref: article 15242997978516*

**Purpose.** Create and maintain the shared route **pool codes** used by the shared route capacity calendar.

**Where it lives.** `Shared Route Capacity Settings > select Create New Record at the Shared Pool field`. It is a modal window; `Save` returns to Shared Route Capacity Settings.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Shared Pool` | Code, **up to 5 characters** | Identifies the new shared route pool; Search selects an existing code to modify its description. |
| `Description` | Text, **up to 30 characters** | Describes the shared route code; editable for existing codes. Action button opens **Description Field - Language Translation Entry**. |

**Behavior & rules.**
- **"When you create a new shared route code, it is assigned the route type selected on the previous screen."** — route type is inherited, not chosen here, and is therefore **immutable after creation**.
- **Hard rule: "A shared route code cannot be created with the same code (ID) as an existing route code."** Shared pool codes and ordinary route codes share one namespace.
- **Hard rule: "A shared route code can only be deleted if no routes are assigned to it and it does not have associated shared route calendars."**

**Dependencies.** `VEND-064` Shared Route Capacity Settings (parent); route code namespace; Description Field - Language Translation Entry; Select Route Code Window.

**Build notes.** Small code table: `code(≤5, unique across routes AND pools)`, `description(≤30, i18n)`, `route_type` (set at creation, immutable). Enforce the shared namespace with a single `route_identifier` table carrying a `kind` discriminator. Prefer inactive-flag over the delete guard, consistent with `VEND-054`/`VEND-057`.

---

### `VEND-066` Shift4 Authorization
*storis_ref: article 15242997978772*

**Purpose.** Obtain and store the per-location **Shift4 Client Access Token** used to license and identify that location on every card-processing message to the Shift4 data center.

**Where it lives.** `Warehouse/Store Location Settings > Credit Card page > Actions > Shift4 Location Authorization`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Client ID` | **Display-only** | Unique ID assigned to the customer by Shift4; combined with the Shift4 Auth Token to form a unique string identifying the specific customer **and location**. |
| `Processor` | **Display-only** | The unique identifier string the STORIS interface sends to Shift4 to identify itself as a **certified application**. Shown for Shift4 diagnostic purposes. |
| `Shift-4 Serial Number` | Text | Serial number provided by Shift4; identifies the location in the Shift4 database. |
| `Shift-4 Auth Token` | Text, **editable** | Authorization token assigned to the specific location, provided by Shift4 when they license the location. |
| `Client Access Token` | Display / generated | The unique string used in **every** message sent to Shift4 from that location, for accounting and licensing. |
| `Get Access Token` | Button | Requests a client access token from the Shift4 data center **using the client GUID, Shift4 auth token, and the processor**. |

**Behavior & rules.**
- **"This process is only used in conjunction with the Legacy Shift4 UTG configuration."** — legacy path; do not build for new integrations.
- **Screen availability gate: available only when the `Processor` indicated on the EMV tab of `Payment Card and Device Settings` is `Shift4`.**
- **Token replacement is destructive and reversible only by re-issuing:** "If a token exists and the `Get Access Token` button is clicked, a message appears indicating that **this action replaces the current Access Token** and includes the option to continue or not continue." **Flagged as destructive reach — an accidental confirm silently invalidates a location's card-processing licence.**
- **Credential model: each location is licensed separately.** The Client GUID + Client Auth Token are supplied by Shift4 in two parts and exchanged for the Access Token, which is then stored in STORIS.
- **"If the location prohibits manual credit card entry, users are prompted for security override."**
- The screen doubles as a diagnostic view of the existing Access Token and Interface ID.

**Dependencies.** `VEND-093` Warehouse/Store Location Settings → Credit Card page; Payment Card and Device Settings → EMV tab (`Processor`); Extended Security (manual card entry override — remember the global Extended Security kill-switch).

**Build notes.** Not a vendor setting at all (alphabetical placement only). If we integrate a processor, store per-location credentials in a secrets store, **never editable in plain view**, and require re-authentication + `RPT-AUDIT` logging for any token re-issue with an explicit "this will break processing at <location> until devices are re-synced" warning. `[DECISION NEEDED]` LA Mattress's processor choice is out of scope for this pack, but the **per-location credential model** is a real requirement — confirm.

---

### `VEND-067` Shift4 eComm Authorization
*storis_ref: article 15243029809172*

**Purpose.** Same as `VEND-066` but produces the **eCommerce** Client Access Token — the token used for the current warehouse/store when **eCommerce** transactions are made.

**Where it lives.** `Warehouse/Store Location Settings > Credit Card page > Actions button > Shift4 eCommerce Location Authorization`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `eCommerce Client Id` | **Display-only** | Unique ID assigned to the customer by Shift4; combined with the Shift4 Auth Token to identify customer + location. |
| `Processor` | **Display-only** | Certified-application identifier string sent by STORIS; diagnostic. |
| `Shift-4 Serial Number` | Text | Serial number from Shift4 identifying the location in the Shift4 database. |
| `Shift-4 Auth Token` | Text, **editable** | Location authorization token from Shift4. |
| `eCommerce Client Access Token` | Display / generated | Unique string used in every message sent to Shift4 from that location. |
| `Get Access Token` | Button | Requests the token using the client GUID, Shift4 auth token, and processor. |

**Behavior & rules.**
- **"This process is only used in conjunction with the Legacy Shift4 UTG configuration."**
- **eCommerce transactions require a *separate* token from card-present transactions** — "Shift4 requires that STORIS provide this unique token in order to identify the credit card transactions correctly to their hosts for processing." **So a single location can hold up to four distinct Shift4 tokens** (retail, eCommerce, Extended Receivables card-present, Extended Receivables MOTO — see `VEND-066`, `VEND-068`, `VEND-069`).
- Same destructive replacement confirmation as `VEND-066`.

**Dependencies.** As `VEND-066`; plus eSTORIS / eCommerce channel.

**Build notes.** Model processor credentials as `(location, channel)` where channel ∈ `{RETAIL, ECOMMERCE, EXT_RECV_CARD_PRESENT, EXT_RECV_MOTO}` rather than four near-duplicate screens.

---

### `VEND-068` Shift4 Extended Receivables Authorization
*storis_ref: article 15243029986452*

**Purpose.** Obtain the Shift4 access token used **"when using Visa rules for restrictions on 'card present' Extended Receivables payments."**

**Where it lives.** `Warehouse/Store Location Settings > Credit Card page > Actions > Shift4 Extended Receivables Authorization`.

**Fields**

Identical field set to `VEND-066`: `Client ID` (display-only), `Processor` (display-only), `Shift-4 Serial Number`, `Shift-4 Auth Token` (editable), `Client Access Token`, `Get Access Token` button.

| Field | Type | Purpose / business rule |
|---|---|---|
| `Shift-4 Serial Number` | Text | Identifies the location in the Shift4 database. **"It is not pre-populated by STORIS."** (explicit here, absent in `VEND-066`) |

**Behavior & rules.**
- **"This process is only used in conjunction with the Legacy Shift4 UTG configuration."**
- **Available only when the `Processor` on the EMV tab of `Payment Card and Device Settings` is `Shift4`.**
- **The distinguishing rule: this token exists specifically to satisfy Visa's card-present restrictions on Extended Receivables (recurring/stored-credential) payments.** Card-present and MOTO Extended Receivables are separately tokenised.
- Same destructive token-replacement confirmation as `VEND-066`.

**Dependencies.** As `VEND-066`; Extended Receivables (in-house financing / recurring payment) module.

**Build notes.** See `VEND-067`. **The real requirement to carry forward is that stored-credential/recurring card transactions are a distinct compliance channel from ordinary card-present sales** and must be tracked separately for card-network rules.

---

### `VEND-069` Shift4 Extended Receivables MOTO Authorization
*storis_ref: article 15242998151188*

**Purpose.** Obtain the Shift4 access token used **"when using Visa rules for restrictions on MOTO (Mail Order/Telephone Order) Extended Receivables payments."**

**Where it lives.** `Warehouse/Store Location Settings > Credit Card page > Actions > Shift4 Extended Receivables MOTO Authorization`.

**Fields**

Identical field set to `VEND-068`: `Client ID` (display-only), `Processor` (display-only), `Shift-4 Serial Number` (**"It is not pre-populated by STORIS."**), `Shift-4 Auth Token` (editable), `Client Access Token`, `Get Access Token` button.

**Behavior & rules.**
- **"This process is only used in conjunction with the Legacy Shift4 UTG configuration."**
- **Available only when the `Processor` on the EMV tab of `Payment Card and Device Settings` is `Shift4`.**
- **MOTO Extended Receivables payments carry their own Visa restriction set and therefore their own token.**
- Same destructive token-replacement confirmation as `VEND-066`.

**Dependencies.** As `VEND-068`.

**Build notes.** Fourth instance of the same screen; collapse into the `(location, channel)` credential model from `VEND-067`. **Note for the coverage matrix: `VEND-066`–`VEND-069` are effectively one capability documented four times.**

---

### `VEND-070` Shipping Port Settings
*storis_ref: article 15243032742804*

**Purpose.** Maintain the shipping-port code table used to **validate and provide consistency when creating free-on-board (FOB) records** — i.e. the port dimension of import freight.

**Where it lives.** `Merchandising and Distribution > Settings > Purchasing Settings > **Import Freight Settings** > Shipping Port Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Port Name` | Code, **up to 10 alphanumeric** | Identification code of the port record. Search lists existing ports. |
| `Description` | Text, **up to 30 alphanumeric** | Port description. |
| `City` | Text, **up to 20 alphanumeric** | City in which the port is located. |
| `Region` | Text, **up to 20 alphanumeric**, **optional** | Region in which the port is located. (Free text — **not** the `Region Code` of `VEND-058`.) |
| `Country` | Code | **Must exist in the Country file.** Search lists the Country file contents. |

**Behavior & rules.**
- **Hard rule: "You cannot delete shipping port records that are in use in one or more FOB records."**
- The existence of an **`Import Freight Settings`** menu branch confirms STORIS has a dedicated import/landed-cost configuration area — the natural home of `COST-033` itemized container receiving and `RCV-050`–`RCV-054` container receiving. **`Import Freight Settings` was not enumerated in this section; recommend a follow-up fetch of that sub-branch — it is the most likely home of the freight-bill and freight-distribution-method settings this assignment was looking for.**

**Dependencies.** FOB records; Country file; Import Freight Settings; `VEND-055` (`Container` PO type); `COST-033`; `RCV-050`–`RCV-054`.

**Build notes.** Trivial code table (`code≤10`, `description≤30`, `city≤20`, `region≤20`, `country_id`). Use a proper country reference (ISO 3166) rather than a free-text country name. Keep the in-use delete guard as an inactive flag.

---

### `VEND-071` Stock Location Schema
*storis_ref: article 15243029362452*

**Purpose.** For a given store/warehouse, define an **ordered list of secondary stock locations** the system should check when there is insufficient quantity at the primary stock location to fill an order. Used with the **Multi-Legged Transfers** feature.

**Where it lives.** `Actions` button on the **Inventory and Logistics** page of **Warehouse/Store Location Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Applies To` | Enum: **`Neither`, `Deliveries Only`, `Pickups Only`, `Both`** | The order types this location group applies to. |
| `Location` | Location code | The location to add to the list; Search selects from available locations. |
| `Route Code` | Code, **optional** | Transfer route code. Search opens the Read-Only Lookup Window. |
| `Add` / `Promote` / `Demote` / `Save` | Buttons | `Add` puts the location in the grid; `Promote`/`Demote` order the list; `Save` commits. |

**Behavior & rules.**
- **Two distinct mechanisms are recognised, and the article is explicit about the difference:**
  - **`Alternate Stock Location`** — **must be a single location**; applicable to stores and warehouses.
  - **`Stock Location Schema`** — **one or more locations**, "set in the order of precedence should there be a need to select stock to fill a sales order, exchange or transfer"; applicable to both stores and warehouses.
- **Search order: "The first location is considered first when checking for merchandise, the second location is considered if none is found in the first location, etc."** If sufficient quantity is not found across the whole list, **the remaining quantity is back-ordered.**
- **Cross-region warning (soft): "If Regional Processing is active on your system and you select a location from a different region, a warning message appears but you can proceed."** — regions segregate inventory (`VEND-058`) but this schema can deliberately cross that boundary.
- **Transfer route resolution hierarchy (exact order):**
  1. **Warehouse/Store Location Settings**
  2. The route code on this screen (**Stock Location Schema**)
  3. The **standard default route code based on the location to which the merchandise is being shipped**
  - Plus: "If you indicate a route code in this field, transfers created based on this schema use this route for the transfer from this location, **unless the route the transfer takes is different due to the presence of a 'ship via' route**." **`ship via` therefore trumps all three tiers.**
  - "**Auto transfers based on the schema use the route code(s) from the schema.**"

**Dependencies.** Warehouse/Store Location Settings → Inventory and Logistics page; Multi-Legged Transfers; `VEND-058` Region Settings / Regional Processing; `VEND-061`/`VEND-064` route capacity; ship-via routes.

**Build notes.** Model as an ordered `stock_source_chain(location, seq) → {source_location, route_code}` with an `applies_to` enum. **Make the cross-region warning configurable (warn vs block)** — for a single-region operator it is noise, for a multi-region one it is a real control. Note the route hierarchy is again *not* most-specific-wins (location settings beat the schema-level override), so encode it explicitly.

---

### `VEND-072` Storage Category Settings
*storis_ref: article 15243032742932*

**Purpose.** Define the storage categories used by the **directed putaway** process, associating products and storage locations so the system knows where merchandise should be placed.

**Where it lives.** `Merchandising and Distribution > Inventory > Inventory Management > Advanced Warehouse Management > Advanced Warehouse Management Settings > Storage Category Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Storage Category` | Code, **up to 20 characters** | New or existing category; Search opens the Read-Only Lookup Window. |
| `Description` | Text, **up to 30 characters** | Action button opens **Description Field - Language Translation Entry** for a multi-lingual description. |

**Behavior & rules.**
- Gated on the **directed putaway** process being in use.
- **Hard rule: "Storage categories can only be deleted from the system if they are not associated with any products or storage locations."**
- Categories are associated **both** with products and with storage locations — the match between the two drives putaway destination.

**Dependencies.** Advanced Warehouse Management (AWM); directed putaway; `VEND-077` Tracked Storage Location Settings; product master; Description Field - Language Translation Entry.

**Build notes.** `storage_category { code(≤20), description(≤30, i18n), active }` plus join tables to product and storage location. **The putaway matching rule itself is not documented here** — we need the algorithm (exact match? capability set? capacity-aware?). `[DECISION NEEDED]` Do we need directed putaway at all at go-live, or is zone-level putaway sufficient?

---

### `VEND-073` Storage Location Field
*storis_ref: article 15243029986324*

**Purpose.** Manually add storage locations that do **not** fit the storage-location mask, and change the status of an individual storage location.

**Where it lives.** A field within **Tracked Warehouse Location Verification Settings** (`VEND-079`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Storage Location` | Code | The specific stocking location to add or modify. **Examples given for off-mask locations: `DOCK`, `PREP`, `BAY9`.** |

**Behavior & rules.**
- **Exact prompt when the entered code does not exist among the current storage locations for the warehouse: "This is not an existing Storage Location. Add it?"** — Yes adds it, No returns for re-entry.
- **This is a create-on-typo hazard**: a mistyped existing location becomes a brand-new empty location on a single `Yes`. **Flag as destructive-adjacent reach** — it does not delete data but it silently fragments the location master.
- To modify status: enter the code, select the new status, then choose **`Add`** to commit the change. (Status values are those in `VEND-063`: `Vacant`, `Staging`, `Active`.)
- Off-mask locations created here are still picked up by the **Build Storage Locations** routine if they hold product (see `VEND-063`).

**Dependencies.** `VEND-079` Tracked Warehouse Location Verification Settings (parent); `VEND-078` Tracked Warehouse Location Mask Settings (defines the mask this bypasses); `VEND-063` Select Storage Locations Screen; `VEND-048` Picking Zone Assignment Window.

**Build notes.** Keep the ability to create off-mask special locations (`DOCK`, `PREP`, staging) — it is genuinely needed — but **require an explicit "Create new location" action rather than a Yes/No on a typo**, and mark such locations with an `off_mask` flag so reporting can find them. Reusing `Add` as the verb for "update status" is a UI bug; use `Save`.

---

### `VEND-074` Storage Location Sort Sequence
*storis_ref: article 15243029999892*

**Purpose.** Define how storage locations are sorted (and locked) for the picking process in a warehouse, by isolating substrings of the Location Pattern Mask.

**Where it lives.** Fields within the warehouse location setup; the elements come from the **Location Pattern Mask**, built in **Warehouse Location Mask Settings** (Warehouse Location Mask Entry) — see `VEND-078`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Picking Sort 1` | `(NN,NN)` — start position, length | First sort element. **"This first element also creates a lock on that storage location. This way no one else can access that location while they are in it."** |
| `Picking Sort 2` | `(NN,NN)` | Second sort element. |
| `Picking Sort 3` | `(NN,NN)` | Third sort element. |
| `Picking Sort 4` | `(NN,NN)` | Fourth sort element; blank if unused. |

**Behavior & rules.**
- Format is **`start_position,length`** — both two-digit.
- **Positions are counted over the *full* mask including separator characters, but separator characters (the dash) are not part of the sort key.** Exact wording: "the system ignores the dash (-) character and sees the 5th position as the beginning of the 'LEVEL' element of the sort key."
- **`Picking Sort 1` doubles as the concurrency lock granularity** — whatever span you put in sort 1 is what gets locked against other pickers. **This is a hard and non-obvious coupling: sort order and locking granularity are the same setting.**
- **Worked example 1** — mask `ABC-123-456`, elements `AISLE` (ABC), `LEVEL` (123), `BIN` (456), positions 1–11:
  - `Picking Sort 1` = `"1,3"` (AISLE, and the lock)
  - `Picking Sort 2` = `"5,3"` (LEVEL)
  - `Picking Sort 3` = `"9,3"` (BIN)
  - `Picking Sort 4` = blank
- **Worked example 2** — four elements `ROOM`(1) `AISLE`(ABC) `RACK`(123) `LEVEL`(45), positions 1–12. **Elements can be combined into one sort field**, which also widens the lock:
  - `Picking Sort 1` = `"1,5"` — **"The `ROOM` element combined with the `AISLE` element is now the first sort element and locked."**
  - `Picking Sort 2` = `"7,3"` (RACK)
  - `Picking Sort 3` = `"11,2"` (LEVEL)
  - `Picking Sort 4` = unused, since the first and second elements were combined.
- **"Some or all of the Location Pattern Mask elements can be isolated and used to sort and lock out the locations in this warehouse to make the picking process more efficient."** — a coarse sort-1 span means a whole room/aisle is locked to one picker; a fine one allows parallel picking but more travel.

**Dependencies.** `VEND-078` Tracked Warehouse Location Mask Settings (defines the mask these offsets index into); `VEND-048` picking zones; `VEND-050` pick prioritisation; RF picking.

**Build notes.** **Do not reproduce substring-offset configuration.** Model the location as structured components (`room`, `aisle`, `rack`, `level`, `bin`) with an explicit ordered sort key and a **separately configurable lock scope**. Decoupling sort order from lock granularity is a direct throughput win: STORIS forces you to widen the lock in order to change the sort. Any migration must parse the existing `start,length` pairs against the mask, **counting separator characters in the offsets but excluding them from the key** — the off-by-one risk here is real.

---

### `VEND-075` Third Party Logistics EDI Settings
*storis_ref: article 15243030955412*

**Purpose.** Configure EDI exchange with **third-party logistics (3PL)** companies for delivery and transfer manifests: outbound **EDI 215 shipment manifest** and inbound **EDI 214 carrier status message**.

**Where it lives.** Accessed from menu.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `EDI Provider Name` | Dropdown, **mandatory** | EDI providers are defined in **External Communication Settings**. **If only one EDI provider is defined there, that provider is automatically selected and the field is inactive.** |
| `Third Party Logistics EDI Code` | Code | The identifier for the 3PL. **"This should be the code that the third party logistics company sends back in the 214 document to identify themselves."** To associate the 3PL with a delivery company, this code must be specified in the **`Third Party Logistics EDI Code`** setting in **Delivery Company Settings**. |
| `Description` | Text | Name/description of the 3PL. |
| `Account Number` | Alphanumeric, **not validated** | Your company's account number with the 3PL. |
| `SCAC` | Alphanumeric, **up to 10 characters**, **not validated** | Standard Carrier Alpha Code — "a privately controlled US code used to identify vessels operating common carriers. It is typically two to four letters long." **Sent to the 3PL in the 215 document.** |
| `Send Manifest Information on Deliveries` | Checkbox | Makes the **EDI Manifest Information** global extra action available in **Build a Delivery Manifest** when the manifest's carrier is associated with this 3PL EDI code. |
| `Send Manifest Information on Transfers` | Checkbox | Same, for transfer manifests. |
| `Receive Completion Notification` (Deliveries) | Checkbox | Allow receipt of 214 documents for **sales orders**. |
| `Accept Partial Completion Notifications` (Deliveries) | Checkbox | **Active only if `Receive Completion Notification` is checked.** |
| `Completion Status Code` (Deliveries) | Code | The status code this delivery company sends in 214 documents meaning **items delivered to the customer**. **Must be defined in EDI Status Details Settings. Active and required only if `Receive Completion Notifications` is checked.** |
| `Estimated Arrival Status Code` (Deliveries) | Code | Status code from the 214 that shows the way merchandise has been delivered; populated from the provider's 214 Line Status Code. Lookup reviews EDI status details. |
| `Receive Completion Notification` (Transfers) | Checkbox | Allow receipt of 214 documents for **transfers**. |
| `Accept Partial Completion Notifications` (Transfers) | Checkbox | Active only if the transfers `Receive Completion Notification` is checked. |
| `Completion Status Code` (Transfers) | Code | Status code meaning **items received by the third party logistics company**. Must be defined in EDI Status Details Settings; active and required only if Receive Completion Notifications is checked. |
| `Estimated Arrival Status Code` (Transfers) | Code | As above, for transfers. |

**Behavior & rules.**
- **Delete guard: "Third party logistics EDI codes cannot be deleted if it is assigned to any delivery company. If such an action is attempted, a warning message displays."**
- **215 document contents (outbound):** "sends transfer and delivery manifest information to the third party logistics companies that includes, but not limited to, **order numbers, SKU's, volume, and destination** of each sales order/transfer."
- **214 document (inbound):** "receives the status of a shipment acknowledgement for the transfer or sales order delivery documents stating whether the merchandise was received by the third party logistics company (in the case of a transfer) or delivered to the customer (in the case of a sales order delivery)."
- **Partial-completion rule (hard, and materially different in each branch):**
  - **Checked:** a 214 that does not acknowledge delivery of *all* merchandise is accepted ⇒ **partial completion of the order/transfer that back-orders any remaining merchandise not delivered.**
  - **Unchecked:** fulfillments complete **only** if the 214 acknowledges all merchandise. **"Otherwise, the 214 document is ignored and no update occurs."** — **a silent drop. Nothing tells anyone the message was discarded.** Flag this: it is an operational black hole (orders stay open, no exception queue).
- Delivery and transfer branches are configured **independently** — a 3PL can be trusted for partials on transfers but not on customer deliveries.
- **`Account Number` and `SCAC` are explicitly not validated.**

**Dependencies.** External Communication Settings (EDI provider definitions); Delivery Company Settings (`Third Party Logistics EDI Code`); **EDI Status Details Settings** (status code table); Build a Delivery Manifest; Third Party Logistics Overview; `VEND-084` Vendor EDI Settings (sibling EDI configuration, different document set).

**Build notes.**
- We need an EDI capability model: `partner { provider, code, scac, account_no }` × `document_type { 215_out, 214_in }` × per-flow flags. **Replace "ignore the 214" with a dead-letter/exception queue** — every inbound EDI document that cannot be applied must be visible and actionable.
- Validate SCAC against a maintained list; STORIS does not.
- **This article, plus `VEND-084`, is the entirety of EDI setup available in this section — there is no EDI 810 (invoice), 850 (PO), 855 (PO ack), 856 (ASN) or 820 (payment) documentation here.** See "Requested topics NOT found".

---

### `VEND-076` Third Party Warehouse Management System Group Settings
*storis_ref: article 15243030956564*

**Purpose.** Define WMS **group** codes for use with the third-party Warehouse Management System interface.

**Where it lives.** `Merchandising and Distribution > Inventory > Inventory Management > Advanced Warehouse Management > Advanced Warehouse Management Settings > Third-Party Warehouse Management System Group Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `WMS Group` | Code | The WMS group to enter or edit; Search lists existing groups. |
| `Description` | Text | Description; Action button opens **Description Field - Language Translation Entry** for an alternate-language version. |

**Behavior & rules.**
- **"This routine is active only if WMS is active on your system."** — licence/feature gated.
- (Article is thin — two fields, no validation, no length limits, no delete rule stated. Noted so the coverage matrix stays honest: **what a WMS group actually *does* is not documented in this article.**)

**Dependencies.** WMS Interface / Advanced Warehouse Management; Description Field - Language Translation Entry.

**Build notes.** Minimal code table. **Do not build until the semantics are known** — the article does not say whether a WMS group segments products, locations, or transactions. Ask STORIS or defer.

---

### `VEND-077` Tracked Storage Location Settings
*storis_ref: article 15243032962964*

**Purpose.** Mark individual storage locations as "special" (staging, priority pick, cross-dock, service parts), assign picking zone and As-Is reason, and configure the physical/dimensional constraints the **directed putaway** process uses.

**Where it lives.** `Merchandising and Distribution > Inventory > Location Settings > Tracked Storage Location Settings`; `Merchandising and Distribution > Settings > Location Settings > …`; `System Administration > Get Started … > Get Started - Designate Locations > …`.

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse Location` | Code / dropdown | **Must be set up for Location Tracking.** Available list **may be restricted by Regional Processing.** |
| `Storage Location` | Code | **Must already exist in the system.** |

**Fields — General**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Staging Area` | Checkbox | The delivery manifest process uses staging areas to hold items already picked from bin locations. **"STORIS recommends you build one or more storage locations for this process and use them only when staging items on a manifest."** |
| `Priority Location` | Checkbox | Priority picking location. **"At the time of picking delivery orders, the system searches this location first for available pieces. Typically, this location holds open-carton merchandise."** |
| `Cross Dock Location` | Checkbox, default blank | Marks a cross-dock location. **"This Cross Dock Location setting is exported to Data Warehouse."** |
| `Service Location` | Checkbox | Designates a Service (parts) storage location. |
| `Picking Zone` | Enum: **`1`, `2`, or `3`**, or blank | Multiple storage locations can share a zone. Can also be set via the Picking By Zone Assignment Window. |
| `As-Is Reason` | Reason code | Used when processing damaged inventory for a distribution center; the As-Is reason code for this **destination location**. |
| `Exclude from Cycle Count` | Checkbox | Excludes the location from **Barcode Storage Location Selection** and **Bar Code Physical Batch Maintenance**. **"If left unselected, it will be included automatically."** |

**Fields — Putaway** (used only with the directed putaway process)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Putaway Destination` | Checkbox | Makes the location available as a putaway destination. **Checking it makes `Height`, `Width`, and `Depth` mandatory.** |
| `Velocity` | Code | Putaway matches the product's velocity to the location's velocity. **Blank ⇒ the system uses the `Storage Location Velocity` in Inventory Control Settings.** |
| `Height` | Integer **1–99999**, mandatory if `Putaway Destination` | Used to calculate the volume of the storage location. |
| `Width` | Integer **1–99999**, mandatory if `Putaway Destination` | As above. |
| `Depth` | Integer **1–99999**, mandatory if `Putaway Destination` | As above. |
| `Max Weight` | Integer **1–99999**, optional | Weight restriction. **"If you leave this field blank, weight is not calculated; therefore there is no weight restriction for this location."** |
| `Max Capacity %` | Integer **1–999**, optional | Percentage used to calculate available space. **Blank ⇒ the system uses 100 percent.** (Note the range allows **up to 999%** — deliberate over-stuffing is configurable.) |
| `Unique Products` | Integer **1–99**, optional | Number of *different* products allowed in the location. **Example: "if you enter 1 in this field and then place pieces of that product in this storage location, only additional pieces of that same product can be placed here (provided other maximums have not been reached)."** **Blank ⇒ a count of 99 is used.** |
| `Putaway Product(s)` | Product code list, optional | Only products matching the listed codes can be placed here. Search ⇒ Search for a Product; Action ⇒ Multiple Product Selection Window. **Blank ⇒ no product restriction.** |
| `Storage Category` | Category list, optional | Putaway places only products associated with those categories here. Search ⇒ list; Action ⇒ Multiple Storage Category Selection window. **Blank ⇒ storage category is not a limitation.** |

**Behavior & rules.**
- **Delete rule: "To delete a storage location, it must be empty."**
- **Capacity/scale warning (repeated verbatim across `VEND-077`, `VEND-078`, `VEND-079`): "If Bar Code is active at a location, STORIS does not recommend building and using only one storage location to track all inventory at that store/warehouse. In addition, no more than 1000 pieces should exist in one storage location. Running reports and uploading scanner data can be drastically affected by the number of items in a single storage location."** **This is a real scalability ceiling, stated three times — treat 1000 pieces/location as a design constraint STORIS could not exceed and that we should not inherit.**
- **Cross-dock vs priority precedence rules, exact:**
  - "When the `Cross Dock Location` **or** `Priority Location` check box is checked, the storage location is included when calculating the available on-hand supply in order to determine how many cross dock labels to print."
  - "When pieces are assigned, locations with the `Priority Location` checked, **and the `Cross Dock Location` checked or unchecked**, take precedence over those with only the `Cross Dock Location` set."
  - "Locations with the `Priority Location` unchecked, but `Cross Dock Location` checked, take precedence over all other locations, **with the exception of Priority Pick Locations**."
  - ⇒ **Precedence: Priority (± cross-dock) > cross-dock only > everything else.** Both flags may be set simultaneously.
- **As-Is destination rule (hard): "In order for a storage location to be recognized as a 'destination storage location', a reason code must be specified here. The reason code you indicate should have the `Not Available For Sale` field checked in the reason code settings. If it does not, a warning is issued and you have the option to continue or enter a different code."** — **a soft warning guarding a rule that should be hard: an As-Is destination whose reason code leaves stock sellable will leak damaged goods into available inventory.**
- **Two Actions options that write inventory data immediately, outside the Save cycle — flag both as destructive reach:**
  - **`Remove All Pieces From Pick`** — removes the internal priority pick flag from **all** pieces currently in the selected storage location.
    - If `Priority Location` **is** checked, prompt: **'Storage Location is a "Priority Location". Continue?'** Yes ⇒ flag removed from all pieces; No/Cancel ⇒ nothing updated.
    - **If `Priority Location` is *not* checked, "the update is performed without any prompting or confirmation."**
  - **`Set All Pieces To Priority Pick`** — sets the internal priority pick flag on all pieces in the location.
    - If `Priority Location` is **not** checked, prompt: **'Storage Location is not a "Priority Location". Continue?'**
    - **If `Priority Location` is checked, "the update is performed without any prompting or confirmation."**
  - **Both, explicitly: "This update to the pieces in the storage location occurs immediately upon selection of the option… When the 'updated' message displays, the pieces have already been updated; the update does not depend on whether or not you click the Save button on this screen."** **There is no undo, and Cancel/Exit does not roll it back.**
  - Messages: **"All Pieces in Storage Location A1 updated."** / **"Location A1 contains no pieces."**
  - **"The pieces in inventory are updated independently of the `Priority Location` setting on this screen."** — the flag on the pieces and the flag on the location can legitimately disagree.
- **Regional Processing may restrict which locations are visible.**

**Dependencies.** Location Tracking; `VEND-078` mask settings; `VEND-079` verification settings; `VEND-048` Picking Zone Assignment Window; `VEND-072` Storage Category Settings; `VEND-082` Velocity Settings; Inventory Control Settings (`Storage Location Velocity`); reason-code settings (`Not Available For Sale`); Data Warehouse export; Barcode Storage Location Selection / Bar Code Physical Batch Maintenance; `VEND-058` Regional Processing.

**Build notes.**
- Model the location record with a capability flag set (`staging`, `priority_pick`, `cross_dock`, `service`) and an explicit **precedence function** rather than the prose rules above.
- **Make the As-Is reason `Not Available For Sale` check a hard block**, not a warning.
- **The two "all pieces" Actions must become confirmed, audited, reversible bulk operations** (`RPT-AUDIT`, with an undo that restores the prior per-piece flag). STORIS's "no prompt when the setting already agrees" logic is exactly backwards — the confirmation should be unconditional because the blast radius is the whole location.
- **Do not carry over the 1000-piece practical limit.** Design storage-location piece counts to be unbounded.
- `Max Capacity %` allowing 999 should be capped at 100 unless someone can justify over-allocation.

---

### `VEND-078` Tracked Warehouse Location Mask Settings
*storis_ref: article 15243032962708*

**Purpose.** Establish the **format (pattern mask)** of storage location codes within a location-tracked warehouse — element by element: prompt, type, length, range, delimiter, mandatory.

**Where it lives.** `Merchandising and Distribution > Inventory > Location Settings > Tracked Warehouse Location Mask Settings`; `Merchandising and Distribution > Settings > Location Settings > …`; `System Administration > Get Started … > Get Started - Designate Locations > …`.

**Fields — header / display**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse` | Code / dropdown | **The location selected must be Location-Tracked.** Visible list may be restricted by Regional Processing. **"If the pattern mask has already been established for this warehouse, a warning message appears. You can view the mask information previously entered… or select another warehouse."** |
| `Current Location Format` | Display | The existing pattern mask, if any. |
| `Unused Characters` | Display | **"If fewer than 10 characters were used for this mask, the number of unused characters displays here."** ⇒ **the total mask length ceiling is 10 characters.** |
| `Minimum Possible Values` | Display | Minimum value, based on the pattern and range established. |
| `Maximum Possible Values` | Display | Maximum value possible, based on the pattern and range established. |

**Fields — per element (all required to create each element)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Prompt` | Text | The prompt shown to users entering storage locations throughout the system. **Typical values: `floor`, `aisle`, `rack`, `level`, `bin`.** |
| `Type` | Enum | **`Alphabetic` — allows only one digit per element. `Numeric` — allows up to 4 digits per element. `Alphanumeric` — allows up to 1 digit per element.** |
| `Length` | Integer | Number of digits for this element. **Alphabetic: required value is 1. Numeric: up to 4. Alphanumeric: up to 1.** |
| `Pattern` | Derived code | Length + type for the element. **"For example, `1A` indicates one alpha character; `2N` indicates two numeric characters."** The system may offer a default based on previous answers. |
| `Range Low` / `Range High` | Characters | Low and high characters for the element. **"if the element represents rows and your warehouse contains rows A through N, enter A as the Low and N as the High."** |
| `Delimiter` | Checkbox | **"To append a hyphen (-) to this element, check the box."** |
| `Mandatory` | Checkbox | Makes this element mandatory for all storage locations. |

**Behavior & rules.**
- **HARD RULE, THE BIG ONE: "Once you establish a Location Mask and save the record, you cannot change it."** There is no edit path and no documented migration. **This is an irreversible one-shot configuration decision per warehouse.**
- Consequently STORIS gives explicit sizing advice: **"build the mask to account for future expansion. For example, if your warehouse is 50,000 square feet, but at present you are installing racks in only 25,000 sq. ft., the racks may allow for only 10 aisles. However, if you build the mask to allow for 99 aisles, then in the future you can build locations as you create them."**
- **The `Alphanumeric` type allows only 1 character** — so multi-character alphanumeric elements are impossible; the worked example `A-3-A1` in the article's own intro (bin = `A1`, two characters, alphanumeric) **contradicts the `Alphanumeric = up to 1 digit` rule.** **Flagged as a documentation inconsistency to verify.**
- Same **1000-pieces-per-storage-location / don't-use-a-single-location** Bar Code warning as `VEND-077`.
- Regional Processing may restrict access to locations (and, per this article, **"customers and locations"**).
- Training reference: "Setting Up New Warehouse Location course in STORIS Academy."

**Dependencies.** `VEND-074` Storage Location Sort Sequence (indexes into this mask by character offset — hence the delimiter/offset subtlety); `VEND-079` Tracked Warehouse Location Verification Settings (builds locations from the mask); `VEND-063` Select Storage Locations Screen; `VEND-073` Storage Location Field (off-mask locations); Regional Processing.

**Build notes.**
- **Do not inherit the immutability or the 10-character ceiling.** Store location structure as an ordered list of typed components with independent min/max ranges, and support **mask migration** (re-map existing location codes) as a first-class, audited operation. The inability to change a warehouse's location scheme is one of the more expensive limitations in this entire pack.
- Keep `Mandatory` per element (allows short codes like `DOCK`).
- Derive the display format (delimiters) from the component list rather than storing a delimiter flag per element.
- `[DECISION NEEDED]` Component set for LA Mattress DCs — confirm `floor/aisle/rack/level/bin` is the right decomposition and what ranges each needs at 5-year scale.

---

### `VEND-079` Tracked Warehouse Location Verification Settings
*storis_ref: article 16914630501140*

**Purpose.** Create storage locations (manually or in bulk from the mask), print storage-location labels, and assign picking zones — for location-tracked **or invisible-location-tracked** warehouses/stores.

**Where it lives.** `Inventory > Settings > Location Settings > Tracked Warehouse Location Verification Settings`; `System Administration > Get Started - Enter Your Information > Get Started Step 3 - Business Information > …`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Location` | Code | **Must be set up for Location Tracking or invisible-location tracking.** |
| `Print Method` | Enum: **`Zebra Printer`, `Form Designer`** | **`Form Designer` is the default.** `Zebra Printer` ⇒ `Form Name` inactive; `Form Designer` ⇒ `Form Name` active. |
| `Form Name` | Selection | The form to print storage location labels on. **"The forms listed here are listed in the `Form Type: Storage Location` column in Design Enhanced Laser Forms."** |
| `Storage Location` | Code | Manually add or modify a location. **For a location-tracked warehouse the Search button accesses `View Products in a Specific Storage Location`. For an invisible-location-tracked warehouse, this field is used to automatically assign merchandise to a virtual storage location associated with the product's group — enter the *product group code* here.** |
| `Picking Zone` | Enum: **`1`, `2`, or `3`** | Same zone number can apply to multiple storage locations. |
| `Status` | Enum: **`Vacant`, `Staging`, `Active`** | **`Staging` — "works with the delivery manifest process to move items already picked from the bin locations to this 'holding' area."** |
| `Used` | Display: **`Yes` / `No`** | **`Yes` — inventory currently exists in this location. `No` — no inventory is currently assigned.** |
| `Line Number` | Display | The line number of the row selected in the grid. |

**Behavior & rules.**
- **The `Storage Location` field is overloaded and means something entirely different depending on tracking mode**: a physical location code for location-tracked warehouses, a **product group code** (mapping to a virtual location) for invisible-location-tracked warehouses. **Hard gotcha.**
- **Float ID collision guard: "If using the Float Processing feature, the system prevents the creation of storage locations whose ID matches existing Float IDs."** (Consistent with `VEND-063`.)
- **Blank `Storage Location` prompt, exact text: "Select all storage locations? Choose No to pick ranges."**
- **"STORIS recommends you build storage locations only for the number of physical locations in the warehouse racking system and not necessarily for all locations within the location mask."**
- Same **1000-pieces / single-location** Bar Code warning as `VEND-077` and `VEND-078`.
- Regional Processing may restrict location access.
- **Picking zone sequencing is set elsewhere: "After you set up your picking zones, you use the Picking Zone Assignment Window to assign a picking sequence for your picking zones. That is, you tell the system where to look first, second, and third for inventory."** **Note the naming trap — this describes `Picking By Zone Assignment Window` (position 47, part A) and/or `Picking Zone Assignment Window` (`VEND-048`); the two similarly-named screens do different jobs (sequence vs bulk assignment). Verify which is which before implementing.**
- Grid: double-click a row to enter, edit, or delete it.
- **Actions menu options:** `Build Storage Locations`; `Print Barcode Labels` (**"for location-tracked stores or warehouses, print labels for a selected storage location. For invisible-location stores or warehouses, print labels for a selected product group."**); `Select Storage Locations`; **`Mass Picking Zone Assignment`**.

**Dependencies.** `VEND-078` Tracked Warehouse Location Mask Settings (mask must exist first); `VEND-063` Select Storage Locations Screen (the Build / Select action targets); `VEND-048` Picking Zone Assignment Window; `VEND-073` Storage Location Field; Float Processing; Design Enhanced Laser Forms; Regional Processing.

**Build notes.** One screen, four verbs — split them: **generate locations**, **print labels**, **assign zones**, **edit a location**. Do not overload a single field across tracking modes; make invisible-location (group→virtual location) an explicit separate mapping table. Preserve the float/location shared-namespace uniqueness check.

---

### `VEND-080` Unit of Measure Settings
*storis_ref: article 15243032963348*

**Purpose.** Maintain the unit-of-measure code table used throughout the system (each, pair, yard, …).

**Where it lives.** Eight menu paths, all leading to the same file, e.g. `System Administration > System Settings > Merchandising and Distribution System Settings > Inventory Hierarchy Settings > Product Information Settings > Unit of Measure Settings`; `Merchandising and Distribution > Inventory > Settings > Inventory Hierarchy Settings > Product Information > Unit of Measure Settings`; `Customer > Customer Service > Settings > Product Information Settings > Unit of Measure Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Unit of Measure` | Code | The code representing this unit of measure. **"For example, if products are sold in yards, `YD` may be entered here."** |
| `Description` | Text, **up to 20 alphanumeric** | Describes the code. **"if you entered `YD` in the Unit of Measure field, enter `YARD` here."** |

**Behavior & rules.**
- **Fractional-quantity rule (hard): "If your product base consists of goods that can be ordered in fractional quantities (for example, yards of material), you must create a code that describes those fractions."** ⇒ **fractional ordering is enabled by the existence of a UOM code, not by a numeric-precision setting.**
- **"Certain records in this file exist as part of the standard software and should not be deleted from the system."** — there are protected system rows, but the article does not name them and does not say the system enforces the protection. **Flag: an unnamed set of system-critical rows with no stated enforcement is a deletion hazard.**
- No length limit stated for the code itself; no `Active` flag; no in-use delete guard documented.

**Dependencies.** Product Information Settings; purchasing/receiving quantity handling; `COST-031`/`COST-032` (unit costs are per UOM).

**Build notes.** `uom { code, description(≤20), decimal_places, active }`. **Add explicit `decimal_places` rather than encoding fractional-ness in the code's meaning** — STORIS's approach makes precision a naming convention. Seed and hard-protect the system rows (`EA`, `PR`, `SET`, …) with a `is_system` flag that blocks deletion outright.

---

### `VEND-081` Update Zip Code Settings
*storis_ref: article 15243032962836*

**Purpose.** Bulk-update delivery configuration for a **range** of zip codes at once — ship-from locations, delivery/transfer/service/parcel route codes, and additional sales tax codes — with an optional per-region override layer.

**Where it lives.** `Customer > Point of Sale > Settings > Zip Code Settings > Update Zip Code Settings`; `Customer > Settings > Logistical Settings > Zip Code Settings > …`; `Merchandising and Distribution > Settings > Logistical Settings > Zip Code Settings > …`; `System Administration > Get Started … Step 4 - Delivery > Get Started - Update Zip Codes > …`; `System Administration > System Settings > Customer System Settings > Logistical System Settings > Zip Code Settings > …`.

**Tabs:** `General`, `Regional Settings`.

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Start Zip or Postal Code` | Code | US format **`NNNNN` or `NNNNN-NNNN` (hyphen must be entered)**. Non-US: per that country's format **as established in the Country record**. |
| `End Zip or Postal Code` | Code | Same format rules. |
| `Normal Ship Location` | Warehouse code | The warehouse from which goods normally ship for a delivery address in this zip range. |
| `Parcel Ship Location` | Location code | Default shipping location for parcel routes. **"If left blank, the Parcel Ship Location defaults to the entry in the Normal Ship Location field."** |
| `Delivery Route Code` | Route code(s) | **Must be a delivery route.** Action button ⇒ Multiple Route Selection Window (one or more routes). |
| `Transfer Route Code` | Route code | Defaulted when creating transfers to a zip in the range. |
| `Service Route Code` | Route code(s) | **Must be a service route.** One or more may be chosen. |
| `Parcel Route Code` | Route code | Default parcel route. **"If no code is entered, the default `Parcel Route Code` in Point of Sale Control Settings is used."** |
| `Additional Tax Code` | Tax code(s) | One or more **additional** sales tax codes used **in addition to** the tax codes included in the zip code range. |

**Fields — Regional Settings tab**

Same set (`Region`, `Normal Ship Location`, `Parcel Ship Location`, `Delivery Route Code`, `Transfer Route Code`, `Service Route Code`, `Parcel Route Code`), scoped to a `Region` code.

**Behavior & rules.**
- **Regional override rule (hard and dangerous): "The values you enter on this tab override the values entered on the General tab for the same zip or postal code. If you enter a region on this tab and leave some fields blank, *the blank field value overrides* any value entered in the similar field on the General tab."** ⇒ **a blank on the Regional tab is an active "no value", not an inherit.** This is the opposite of every other override in the system. **Highest-priority gotcha in this article.**
- **"Regional Processing does not have to be active to edit these fields."**
- **Ship-from default resolution for delivery orders:** order entry references `Default Ship Location to Sell Location` in **Point of Sale Control Settings**; **if that box is empty, order entry defaults the ship location based on the location associated with the zip code of the delivery address** — i.e. this screen's `Normal Ship Location`.
- **Delivery route defaults determine available delivery dates:** "Whenever [a] zip code in the range appears in the ship-to address for a delivery order, the route code you specify here defaults, thus determining the available delivery dates for the order. The dates display via the Calendar Icon at the `Next Date` field in the order-entry process." Overridable in order entry via the `Route` field in the **Fulfillment Information** section.
- **"Routes that have been designated as `Parcel Only` in Logistical Route Settings are prohibited. If selected, a warning message is displayed."**
- **Transfer route fallback chain:** "STORIS requires you enter a route code when completing a transfer manifest. If a default transfer route code does not exist in the **Warehouse/Store Location Settings** for the transfer location on the order, the system checks here for a default transfer route code. If a default code is not found, you must enter one manually into the transfer manifest." ⇒ **`Warehouse/Store Location Settings` → `Zip Code` → manual.**
- **Additional tax code worked example (quoted):** a New Jersey business in zip `07054` owing an extra 1% to Morris county and 1% to Parsippany creates `NJ` (state rate 6%), `MORRIS` (1%), `PARS` (1%); **"the system calculates sales tax at an 8% tax rate (6% for the state + 1% for the county + 1% for the town)."**
- **Avalara interaction:** "When processing with Avalara® Tax Interface and the `Use STORIS calculations when offline` setting is checked in **Alternate Tax Interface Control Settings**, this `Additional Tax Code` field is used by STORIS to calculate taxes offline. The `Type` code defined in Sales Tax Settings can be either **`Local`** or **`State`**."
- **"New zip codes that have been built on-the-fly list on the End-of-Day report. This allows review by the manager to ensure the normal ship location and tax codes are properly set."** — **on-the-fly zip creation is possible during order entry and is only caught by a next-day report. That is a tax-exposure control gap.**
- Single-zip maintenance is done in the **Individual Zip Codes** routine.

**Dependencies.** Individual Zip Codes; Point of Sale Control Settings (`Default Ship Location to Sell Location`, `Parcel Route Code`); Logistical Route Settings (`Parcel Only`); Warehouse/Store Location Settings (transfer route default); Sales Tax Settings (`Local`/`State` type); Alternate Tax Interface Control Settings (Avalara, `Use STORIS calculations when offline`); `VEND-058` Region Settings; Country record (postal formats); End-of-Day report.

**Build notes.**
- **Do not copy the "blank overrides" semantics.** Use explicit tri-state (`inherit` / `set to value` / `explicitly none`) on every regional override field. Migration must inspect every existing regional row and decide which blanks were intentional.
- **On-the-fly zip creation must raise an exception item, not a line on a nightly report.** Untaxed or mis-shipped orders from a bad zip are expensive.
- Keep the tax "additional codes stack additively" model but validate that rates sum to a sane total.
- `[DECISION NEEDED]` LA Mattress: Avalara (or equivalent) as the tax authority with STORIS-style offline fallback, or ERP-native rates only? The offline-fallback path is where STORIS's zip-level `Additional Tax Code` earns its keep.

---

### `VEND-082` Velocity Settings
*storis_ref: article 15243031200276*

**Purpose.** Maintain **velocity codes** (how quickly a product is expected to sell) used by the **directed putaway** process to match products to storage locations.

**Where it lives.** `Merchandising and Distribution > Inventory > Inventory Management > Advanced Warehouse Management > Advanced Warehouse Management Settings > Velocity Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Velocity Code` | Code, **up to 2 characters** | New code or existing code to edit; Action button ⇒ Read-Only Lookup Window. |
| `Description` | Text, **up to 30 characters** | Action button ⇒ **Description Field - Language Translation Entry**. |
| `Add` | Button | Updates the grid with new or edited codes. |
| `Promote` / `Demote` | Buttons | **Changes the order of precedence**, one line at a time. |

**Behavior & rules.**
- **Order in the grid IS the meaning: "Existing velocity codes are listed in order of precedence in the grid… a velocity code in the first position in the grid is assigned to fast moving products and those products are therefore stored in a lower, easier to access area of the storage location."** **The codes carry no intrinsic speed value — position does. Reordering the grid silently re-slots every product and location assigned to those codes.**
- **Delete rule: "Velocity codes can only be removed from the system if not in use in the Inventory Control Settings, and not associated with any products, storage locations, or warehouse inventory records."**
- Editing an existing code allows changing **description and position**, not the code itself.
- The putaway process "attempts to match the product's velocity with a storage location's velocity" (see `VEND-077` `Velocity`, and `Storage Location Velocity` in Inventory Control Settings as the fallback).
- Note: the article spells the control **"Premote/Demote"** — a typo in the source, the buttons are Promote/Demote.

**Dependencies.** `VEND-077` Tracked Storage Location Settings (`Velocity`); Inventory Control Settings (`Storage Location Velocity` default); directed putaway; product master; Description Field - Language Translation Entry.

**Build notes.** Store an explicit **integer rank** on the velocity code rather than relying on row order, and treat a rank change as a versioned, audited event (`RPT-AUDIT`) — it re-plans the whole warehouse. Consider deriving velocity from actual sales rates on a schedule instead of manual assignment; that is the obvious improvement over STORIS.

---

### `VEND-083` Vendor Class Settings
*storis_ref: article 15243031197972*

**Purpose.** Define vendor **classification codes**, used for reporting and — importantly — **to group vendors into payables classes for organizing payments and check runs**.

**Where it lives.** `Accounting > Payables > Payables Settings > Vendor Information Settings > Vendor Class Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Class` | Code | The vendor class to create or edit; Search lists existing classes. |
| `Description` | Text | Description of the vendor class. |

**Behavior & rules.**
- **Assignment happens elsewhere: "You create vendor classes here, then assign vendors to vendor classes via the `Class` field on the `Payables` tab in the Vendor Settings"** (`VEND-087`).
- **"Many STORIS reports reference vendor class."**
- **The payables use is the significant one: "you can use vendor classes to group your vendors into payables classes for the purpose of organizing payments. For example, the `Select and Approve Bills for Payment` routine has a vendor class field. Use that field to create check runs for one or more selected vendor classes."**
- **This is the only reference in the entire section to the AP payment run.** It confirms a routine named **`Select and Approve Bills for Payment`** exists and is filterable by vendor class. **That routine is almost certainly where `PO-102` ("fully-received POs close automatically when approved for payment") is implemented, and is very likely where `PO-080` PO hold logic lives — but it is documented in the Payables section, not here. Recommend it as the highest-value follow-up fetch.**
- No length limits, no `Active` flag, no in-use delete guard documented (article is thin — two fields).

**Dependencies.** `VEND-087` Vendor Settings → Payables tab (`Class`); `Select and Approve Bills for Payment`; vendor reporting; `PO-102`.

**Build notes.** `vendor_class { code, description, active }` plus `vendor.class_id`. **Make it the primary grouping key for payment runs** (`payment_run.filter.vendor_class in (...)`). Consider allowing a vendor to hold multiple classes (STORIS allows one) — a vendor can plausibly be both "import" and "net-60". `[DECISION NEEDED]` One class per vendor or a tag set?

---

### `VEND-084` Vendor EDI Settings
*storis_ref: article 15243032140436*

> **⚠️ THIS ARTICLE CLOSES OPEN GAP #1 (`PO-080` PO hold triggers).** See `Payable Bill Hold Days` below.
> It is also the single richest article in this section and the main source of **three-way-match / cost-exception**
> behavior (`COST-040`) available anywhere in the Vendor Settings section.

**Purpose.** Create and maintain the **EDI vendor records** used to transmit EDI data to a network service provider, and to control — per vendor — how inbound EDI acknowledgements, ASNs, status messages and invoices are allowed to change purchase orders, costs, dates, quantities and AP bills.

**Where it lives.** `Merchandising and Distribution > Purchasing > Electronic Data Interface > Vendor EDI Settings`. **EDI must be active on the system.**

**Wiring.** "Once you properly set up a vendor EDI record, you can enter it into the **`Vendor EDI Code` field on the `Shipments` tab in the Vendor Settings**. In this way, you activate EDI processing for the selected vendor."

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `EDI Vendor Code` | Code, **up to 5 alphanumeric** | The EDI vendor record; Search lists existing ones. |
| `Name of Vendor` | Text, **up to 20 alphanumeric** | Name of the EDI vendor. |
| `EDI Provider` | Dropdown, **mandatory** | Defined in **External Communication Settings**. **If only one provider is defined there it is auto-selected and the field is inactive.** |
| `Account Numbers` | List | Account numbers assigned to your company by the vendor. Action button ⇒ **Account Number Entry Screen** for one or more. |
| `Model Number Patterns` | Pattern list | **(LOCKED - STORIS access ONLY!)** Structure of the vendor model number. Action ⇒ **Model Number Pattern Entry Screen**. |
| `Payables Company` | Company code | The payables company used to generate AP Bills from **EDI 810** invoices. Action ⇒ **Enter Payables Company by Location**. |
| **`Payable Bill Hold Days`** | Integer (days) | **Prevents AP bill approvals for partially received purchase orders.** See the rules block. |
| `315 Additional In Transit Days` | Integer (days) | Extra days added to the Status Date from **EDI 315** status documents. |
| `Update Dates for Acknowledged PO` | Enum: **`Use Default`, `Never`, `Always`** | Applies date changes from **EDI-855** (PO Acknowledgement), **EDI-856** (Advance Ship Notice) and **EDI-865** (PO Change Request Acknowledgement). |
| `Update Costs for Acknowledged PO` | Enum: **`Use Default`, `Never`, `Only When Lower`, `Always`** | Cost changes on acknowledgements. |
| `Update Costs on Vendor Billing` | Enum: **`Never`, `Only When Lower`, `Always`** | Cost changes on vendor billings. **Note: no `Use Default` option on this one.** |
| `Decreases` (Update Quantity for Acknowledged PO) | Checkbox | Update PO quantities for **decreases** in acknowledged quantity. **"A decrease allows the purchase order quantity to be brought down to zero."** |
| `Increases Within the Maximum` | Checkbox | Update PO quantities for increases **≤ `Maximum Quantity Increase`**. |
| `Maximum Quantity Increase` | Integer **> 0**, **mandatory if `Increases Within the Maximum` is checked** | Max quantity a PO quantity can be increased by. |
| `Use EDI Control Settings` | Checkbox, **defaults checked** | Use the global EDI Control Settings for this vendor; uncheck to set values individually. |
| `Receive Product Automatically with 214 Purchase Order Acknowledgment` | Checkbox | **Auto-receives inventory on a shipment when an EDI 214 is processed** if the status code matches `Automatic Receipt Status Code`. |
| `Automatic Receipt Status Code` | Code | The EDI 214 status code that triggers automatic receipt. **Must already exist**; new codes via **EDI Status Details Settings**. Active only when the box above is checked. |
| `Update Costs for Acknowledged Container` | Enum: **`Use Default`, `Never`, `Only When Lower`, `Always`** | Applies to **EDI 855 and EDI 865** documents, container flavour. |
| `Update Costs on Vendor Container Billing` | Enum: **`Use Default`, `Never`, `Only When Lower`, `Always`** | Applies to **EDI 810** documents, container flavour. |
| `EDI Active` | Checkbox | Vendor is actively using EDI. **"This box is unchecked for new vendor records."** |
| `Combine Distributed PO` | Checkbox | Combine distributed PO data transmitted via EDI into **one master PO record** when sending PO information to this vendor. |
| `Special Order CFO Popup` | Checkbox | **(LOCKED - STORIS access ONLY!)** Pop-up prompting for CFO information when entering special-order sales purchase orders for this vendor. |
| `Prompt 850 Submission` | Checkbox | A prompt appears in Purchase Order Entry offering to transmit the PO for this vendor. |
| `Prompt 860 Submission` | Checkbox | A prompt appears in Purchase Order Entry offering to transmit PO **changes** for this vendor. |
| `Transmit Barcode Label ID` | Checkbox | Include the bar code ID in the transmitted flat file. **"STORIS sends 12 digits to the specified vendor and when the label is printed, the printer generates the 13th digit (the check digit)."** |
| `Transmit Service Parts PO` | Checkbox | Include service-parts POs in EDI transmission. **Blank ⇒ only standard inventory product POs are transmitted; service parts POs are excluded.** |
| `Update Replacement Cost in Product File` | Checkbox | **"Allow the user to update a product's replacement cost based on the AP bill entry."** |
| `Receiving Calendar` | Enum: **`Use Default`, `Never`, `Always`** (**`Always` is the default**) | Controls when the **EDI Advanced Ship Notice Dates** process uses the receiving calendar. `Use Default` ⇒ the `Use Receiving Calendar for Advanced Ship Notification Updates` setting in EDI Control Settings. |

**Behavior & rules.**

**★ `Payable Bill Hold Days` — this is the PO-hold mechanism (`PO-080`), quoted in full:**
> "Use this field to prevent AP bill approvals for partially received purchase orders. Enter the number of days **from the creation/transmission of the PO** for which you want to prevent AP bill approvals for purchase orders not fully received.
> **If the number of hold days specified here has not been exceeded, the system creates an AP approval only if the entire order has been received.**
> **If the number of hold days has been exceeded and the order is not fully received, the system creates a partial payment approval and an exception.** When you receive the remainder of the order, **you must create subsequent partial payment approvals manually**.
> The invoice hold days is based on **the invoice date that the vendor has passed on the 810 invoice**. We recommend you set this field to match the **average lead time** in the vendor settings."

- ⇒ **The hold rule in plain terms: an AP bill against a partially-received PO is held (no approval created) until `Payable Bill Hold Days` have elapsed from PO creation/transmission. Past that window the system stops holding, creates a *partial* payment approval, and raises an *exception*. Every later increment is manual.**
- ⇒ **Two subtle traps.** (1) **The threshold is measured from PO creation/transmission but the clock is read off the vendor's 810 invoice date** — a vendor that back-dates or late-transmits its invoice changes when the hold releases. (2) **Once the hold lapses, remaining receipts do not auto-approve** — a partially-received PO permanently drops out of automatic AP processing.
- **This is a vendor-level (`VENDOR_EDI`) setting, so hold behavior differs per vendor.** It ties directly to `PO-102` (fully-received POs closing automatically when approved for payment): the hold is what stops the "approve for payment" event happening early.

**Payables company resolution hierarchy for AP bills created from 810 invoices (exact order):**
1. **Vendor EDI / Receiving Location combination** — via the **Payables Company by Location** screen (Action button on `Payables Company`)
2. **Vendor EDI** — the `Payables Company` field on this screen
3. **EDI Control Settings** — *"determines whether to use the Receipt Warehouse Location's Payables Company or a Specific Company based on the existing setup."*

**Model number patterns:** "You can define **up to five** vendor model number patterns. Once defined, the vendor model numbers you use in **Enter a Purchase Order** or the **Product file must match the patterns** set in this field. Once in use, **we recommend you not change or delete any patterns for which model numbers with that pattern exist.**"

**EDI 315 scheduled-delivery-date formula (exact):**
> "used (along with the vendor `In Transit Days`) to update the scheduled delivery date for EDI 315 documents **when the purchase order line references more than one container**. The updates are performed **only automatically via EDI updates when 856 and 315 documents are received**… **The scheduled delivery date of the purchase order line is only updated if the calculated delivery date (`EDI Status Date + In Transit Days + Additional In Transit Days`) is *further in the future* than the currently assigned scheduled delivery date.**"
- ⇒ **Delivery dates only ever move later, never earlier, from a 315. A vendor that recovers schedule cannot pull the date in via EDI.**

**Cost-change handling — this is the origin of `COST-040` cost exceptions.** Four separate cost-acceptance switches, each with the same enum:
- `Update Costs for Acknowledged PO` — 855/865, non-container
- `Update Costs on Vendor Billing` — 810, non-container (**no `Use Default`**)
- `Update Costs for Acknowledged Container` — 855/865, container
- `Update Costs on Vendor Container Billing` — 810, container
- **`Only When Lower` is the effective three-way-match tolerance in STORIS: there is no percentage or dollar tolerance band, only a directional test.** Any cost increase is either accepted wholesale or refused wholesale. **There is no configurable tolerance threshold anywhere in this article.**
- **The `Container` PO type flag (`VEND-055`) is what routes a document to the container-flavoured pair of settings.**

**Quantity-change handling:** decreases can zero out a PO line; increases are capped by `Maximum Quantity Increase`. **A decrease to zero via EDI effectively cancels a line without a human in the loop.**

**Auto-receipt via 214:** **"This setting only applies to purchase order acknowledgements. It does not apply to shipment acknowledgements."** Inventory is received into stock automatically on a status-code match — **a vendor-controlled inventory posting. Flag as high destructive reach: a mis-mapped status code auto-receives merchandise that never arrived.**

**Delete rule:** "You can use the `Delete` button to remove unused Vendor EDI records, **provided they are not referenced by any vendor**."

**Locked fields:** `Model Number Patterns` and `Special Order CFO Popup` are marked **(LOCKED - STORIS access ONLY!)** — customer admins cannot set them. Note this alongside the general observation that STORIS reserves configuration to itself in places.

**Dependencies.** `VEND-087` Vendor Settings → `Shipments` tab (`Vendor EDI Code`), → `Payables` tab; **EDI Control Settings** (global defaults for nearly every enum here); External Communication Settings (EDI providers); **EDI Status Details Settings** (status codes, shared with `VEND-075`); Enter Payables Company by Location; `VEND-055` Purchase Order Type Settings (`Container`); vendor `In Transit Days`; `VEND-052` average lead time; Purchase Order Entry; product replacement cost; receiving calendar (`VEND-094`); `PO-080`, `PO-102`, `COST-040`, `COST-031`/`COST-033`.

**Build notes.**
- **Adopt the hold concept, fix the mechanics.** Our rule should be: an AP bill matched to a partially-received PO is held until `hold_days` from **PO transmission** (a date *we* control, not the vendor's invoice date). On lapse, raise an exception **and keep the PO in automatic processing** for later receipts — STORIS's "all subsequent approvals are manual" is the source of long-tail AP work.
- **Build a real three-way-match tolerance** (`COST-040`): per-vendor absolute and percentage tolerance on unit cost and extended cost, with `accept / accept-and-flag / reject-to-exception` outcomes. `Only When Lower` is a special case of that, not a substitute for it.
- **Every one of the four cost switches, the two quantity switches, and the date switch should emit an exception record when it *refuses* a vendor change**, not silently discard it. STORIS's documentation never says what happens to a refused change.
- Collapse the container/non-container duplication into one setting with a `document_scope` dimension.
- **`Receive Product Automatically with 214` requires an approval gate at LA Mattress**, or at minimum a per-vendor allow-list plus a variance report. `[DECISION NEEDED]`
- Model number patterns: implement, but as a customer-editable validation rule, not a STORIS-locked field. Cap at more than five.
- `[DECISION NEEDED]` `Update Replacement Cost in Product File` — do we let AP bill entry write back to the product master's replacement cost? That is a costing-integrity decision, and it interacts with `COST-031`/`COST-032`.

---

### `VEND-085` Vendor Rebate Settings
*storis_ref: article 15243031202452*

**Purpose.** Establish **volume rebate plans** offered by vendors — a refund/rebate earned by reaching a purchase level in dollars or units. Generates a **vendor receivable (VR) debit**.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Vendor Receivables Systems Settings > Vendor Rebate Settings`; `Accounting > Vendor Receivables > Vendor Receivables Settings > Vendor Rebate Settings`; `Accounting > General Ledger > General Ledger Settings > Purchase Discount Settings > Vendor Rebate Settings`; `Accounting > Settings > Vendor Receivables Settings > …`; `Accounting > Settings > General Ledger Settings > Purchase Discount Settings > …`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Plan Code` | Code, **up to 6 alphanumeric** | The rebate plan; Search lists existing plans. |
| `Plan Company` | Company code | **If using multi-company processing**, the company included in this plan. **If not using multi-company processing, the company number defaults and cannot be edited.** |
| `Description` | Text, **up to 30 alphanumeric** | Plan description. |
| `Vendor` | Vendor code | The vendor offering the rebate plan. |
| `Goal Type` | Enum: **`Total Cost of Purchases`**, **`Total Units Purchased`** | Determines whether `Goal Amount` is dollars or units. |
| `Goal Amount` | Number | `Total Cost of Purchases` ⇒ total dollar amount of purchases to accumulate. `Total Units Purchased` ⇒ number of units to purchase. |
| `Starting Date` | Date | **"Starting on the date you enter here, the system automatically offers this plan as a default on purchase orders that meet the necessary criteria. To keep the volume rebate plan open-ended, leave this field blank."** |
| `Ending Date` | Date | **"After the date you enter here, the system no longer offers this plan as a default… To keep the volume rebate plan open-ended, leave this field blank."** |
| `Plan Type` | Enum: **`Percent of Dollars Purchased`**, **`Dollars Per Unit Purchased`** | How the earned rebate is calculated; determines `Plan Amount`. |
| `Plan Amount` | Number | `Percent of Dollars Purchased` ⇒ the percentage of purchase dollars. `Dollars Per Unit Purchased` ⇒ the dollar amount per unit purchased. |
| `General Ledger Account Number` | GL account | **The account credited when a user creates a vendor receivable via `Enter a Volume Rebate` (Volume Rebate Posting Entry).** Action ⇒ **TPA GL Account Entry**. |
| `Include Service Parts` | Checkbox | Include service parts when using this rebate plan. |

**Behavior & rules.**
- **Plans are applied at the PO line: "You enter Vendor Receivable (VR) rebate plan codes on purchase order line items for products that are eligible for the refund/rebate."**
- **The vendor receivable debit, created via `Enter a Volume Rebate` (Volume Rebate Posting Entry), can be based on any of the following** (exact list):
  - **purchase orders placed**
  - **items received**
  - **items approved for payment**
  - ⇒ **the accrual basis is chosen at posting time, not on the plan.** Three different revenue-recognition points for the same plan is a control weakness — pick one per plan.
- **`Goal Type`/`Goal Amount` and `Plan Type`/`Plan Amount` are independent**: you can set a dollar goal but a per-unit payout, or a unit goal with a percentage payout. **No validation is documented between the two pairs.**
- **Blank start/end date = open-ended.** Both blank ⇒ always offered.
- **Nothing in this article describes tracking progress toward the goal, whether the rebate is accrued before the goal is reached, or what happens if the goal is missed.** **Flagged as an important documentation gap** — the accrual/reversal semantics of an unmet volume rebate are exactly where this feature gets expensive.

**Dependencies.** `Enter a Volume Rebate` / Volume Rebate Posting Entry; Vendor Receivables module; Purchase Discount Settings; GL (`TPA GL Account Entry`); `VEND-087` Vendor Settings; PO line entry; service parts.

**Build notes.**
- Model `rebate_plan { code, company, vendor, goal_basis (COST|UNITS), goal_amount, effective_from, effective_to, payout_basis (PCT_OF_COST|PER_UNIT), payout_amount, gl_account, include_service_parts }` **plus an explicit `accrual_trigger` enum (`PO_PLACED | RECEIVED | APPROVED_FOR_PAYMENT`) stored on the plan**, not chosen ad hoc at posting.
- **Build goal-progress tracking and an accrual/true-up model**: accrue as earned against the goal, reverse if the period closes short. STORIS appears to leave this entirely to the user.
- This is a **vendor receivable**, i.e. money owed *to us* by a vendor — same ledger family as the RTV expected credit in `RTV-012`. **Reconciling actual vendor payment against expected VR debits is the same missing capability in both cases.** See "Open gaps".

---

### `VEND-086` Vendor RemitTo Settings
*storis_ref: article 15243031207444*

> **This is the closest thing to "payment methods and check handling" in the section.** It covers remit-to addresses, bank details, EFT file-format requirements, check print bank, and the default payment method.

**Purpose.** Specify one or more **remit-to addresses** for a vendor, each with its own bank identification, "allowing for approval of payments to addresses different from the vendor's shipping address."

**Where it lives.** `Merchandising and Distribution > Inventory > Settings > Purchasing Settings > Vendor Information Settings > Vendor Remit To Settings`; `Merchandising and Distribution > Settings > Purchasing Settings > Vendor Information Settings > …`; `Accounting > Payables > Payables Settings > Vendor Information Settings > …`; `Accounting > Third Party Accounting > Payables > Payables Settings > Vendor Information Settings > …`. **Also from within `Vendor Settings` via the `Actions` button on the `Payables` tab.**

**Tabs:** `General`, `Bank Details`.

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor` | Vendor code | Actions ⇒ **Vendor Cross Reference** window. |
| `Remit To` | ID, **up to 5 numeric or alphanumeric** | The remittance address ID. **Plus button auto-assigns the next sequential number.** |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `TPA Vendor ID` | Code | Alternate vendor number identifying the vendor on the TPA (third-party accounting) system. **"When processing a vendor's invoice, this ID overrides the ID specified in the vendor record."** **Inactive if using QuickBooks®.** |
| `Additional Name` | Text, **up to 30 alphanumeric** | Additional name for **bank transmissions** — e.g. a **DBA** name or a **factor** name. **"prints on Forms Designer check forms (use the `payment_to_additional_name` field) but not on STORIS standard checks. The name also exports to the Chase Positive Pay file."** |
| `Remit-To Name` | Text | The remit-to name. |
| `Country` | Code | **Must exist in the Country file.** |
| `Address Line 1, 2, 3` | Text | The remittance address. |
| `Zip Code` / `City` / `State` | Text | **"The following three field labels are 'dynamic' based on the masking settings in the Country record. For example, if US is the designated country… the first field below should be labeled 'Zip Code'. Canadian vendors should display 'Postal code'."** Defaults shown are the US masks. |
| `Email Address` | Free text | An email address to associate with this remit-to. |
| `Other` | Multi-line email list | **Up to 99 email addresses of up to 50 characters each, one per line.** |

**Fields — Bank Details tab** (**"This tab is active only if using STORIS Accounting."**)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Remit-To Bank` | Text, optional | Additional remittance information. **"If present on an import purchase order, this information appears on the IPI document."** **Required for the Australian Bankers Association (ABA) EFT file.** |
| `Bank Information Line 1, 2, 3, 4` | Text, optional | As above; appear on the IPI document for import POs. |
| `Account Number` | **up to 17 alphanumeric**, **ENCRYPTED** | Remit-to bank account number. **Required for the `CPA005`, `CIBC`, `Australian Bankers Association (ABA) EFT`, and `NACHA EFT` file formats.** |
| `Account Type` | Enum: **`None Selected`, `Checking Account`, `Saving Account`** | **Required for the NACHA EFT file format**; determines the transaction code for the NACHA file. |
| `Routing Number` | **up to 9 characters** | Bank routing / ABA number. **Required for the NACHA EFT file format.** |
| `Financial Institution Number` | **up to 3 digits** | Payee bank's financial institution number. **Required for `CPA005 EFT`, `CIBC EFT`, `ABA`, and `National Bank (NATIONAL)` formats.** |
| `Transit Number` | **up to 5 numeric digits** | **Required for `CPA005 EFT`, `CIBC EFT`, and `National Bank (NATIONAL)` formats.** |
| `Check Print Bank` | Code | The check print bank for this remit-to. **"The default check print bank (if any) appears from the Vendor Settings. You can override the default."** |
| `Default Payment Method` | Enum: **`Printed Check`, `Electronic Funds Transfer`, `Virtual Card`** | **"This setting is used when selecting bills in the `Select and Approve Bills for Payment` process."** |

**Behavior & rules.**
- **Auto-created initial remit-to (hard rule, and a live-sync one): "When you create a new vendor in the Vendor file, the system automatically creates an initial remittance record for the vendor and gives it the first available ID number. The system gives the remittance address the same information as the vendor, and *continues to update the address with changes to the Vendor record until you make a separate edit to the remittance address*. You can edit the remittance address but *you cannot delete it*."**
  - ⇒ **The first remit-to silently mirrors the vendor address until the moment someone touches it, at which point the mirroring stops forever. There is no indicator of which state a given record is in.** **Flag prominently — this is a payment-misdirection risk: a vendor address change that everyone assumes propagated may not have.**
- **Accounting-backend feature matrix (hard):**
  - **QuickBooks®** — **cannot create multiple payable remit-to addresses for vendors**; `Check Print Bank` inactive; `TPA Vendor ID` inactive; **"STORIS allows only one remit-to for a vendor."**
  - **STORIS' generic TPA interface** — `Check Print Bank` inactive.
  - **STORIS Accounting** — all fields and features available; **`Bank Details` tab is active only here.**
- **`Account Number` encryption: "This is an encrypted field. To view this field, you must have access via the `View Encrypted AP Account Numbers` field in Payables Security. However, *the account number prints un-encrypted on AP checks printed via the Forms Designer*."** **Flag: the encryption control protects the screen but not the printed output.** (Related: `SAR-024` Report Secured Decryption Activity is the only decryption audit that exists.)
- **`Other` email behavior: "If more than one email exists in this field, the email generated via `Email Remittance Advice` is sent to each email address stored here."** and **"The `Import Data` process does not import more than one email address."** — **bulk import silently drops all but one remittance-advice recipient.**
- Read-only version exists; fields cannot be edited there.
- **EFT file formats explicitly supported: `NACHA`, `CPA005`, `CIBC`, `Australian Bankers Association (ABA)`, `National Bank (NATIONAL)`.** Plus **Chase Positive Pay** export and Forms Designer check printing.
- Payment method is **per remit-to**, not per vendor — so one vendor can be paid by EFT to one address and by check to another.

**Dependencies.** `VEND-087` Vendor Settings → Payables tab (parent, default `Check Print Bank`); **`Select and Approve Bills for Payment`** (consumes `Default Payment Method`); Payables Security (`View Encrypted AP Account Numbers`); Country file (address masking); Forms Designer (`payment_to_additional_name`); Chase Positive Pay; Email Remittance Advice; Import Data; IPI document / import POs; `SAR-024`.

**Build notes.**
- **`VENDOR_REMIT_TO` is already a registered resolver scope** — this article is its definition. Settings that live at this scope: `payment_method`, `check_print_bank`, bank coordinates, remittance-advice recipients.
- **Never mirror-then-detach.** Either the remit-to is explicitly linked to the vendor address (and always follows it) or it is independent from creation. Show which on screen.
- **Bank account numbers: encrypt at rest, mask in UI, and mask on printed output too** unless the check format demands it — and if it does, treat check stock as a controlled document. **Log every decrypt to `RPT-AUDIT`.**
- **Any change to bank coordinates or `Default Payment Method` must be a dual-control (maker-checker) change with notification.** Vendor bank-detail change is the single most-exploited AP fraud vector and STORIS has no approval workflow on it at all. **This is a strong recommendation, not a nice-to-have.**
- Support multiple remittance-advice emails through import (STORIS does not).
- `[DECISION NEEDED]` Which payment rails do we need at go-live — `Printed Check`, `ACH/NACHA`, `Virtual Card`? Virtual card in particular changes the reconciliation model.

---

### `VEND-087` Vendor Settings
*storis_ref: article 15243032963092*

> **⚠️ THIS ARTICLE ALSO CLOSES OPEN GAP #1 (`PO-080`), from the vendor-master side.** See **`Hold Code`** below —
> a vendor-level AP hold code that makes **every newly created AP bill for the vendor ineligible for payment
> approval until the hold status is removed**. Combined with `Payable Bill Hold Days` in `VEND-084`, the two
> hold mechanisms in this section are: **(a) vendor-level blanket hold code, (b) partial-receipt time-based hold.**

**Purpose.** The **vendor master**. "STORIS defines a vendor as **any person or company to whom you may write a check**. This includes inventory vendors, delivery companies (freight), company personnel to whom you may pay expenses, subcontractors, your landlord, the telephone company, etc."

**Where it lives.** 18 menu paths across Customer, Merchandising and Distribution, Accounting (Payables / Vendor Receivables / General Ledger / Third Party Accounting), and System Administration — e.g. `Accounting > Payables > Payables Settings > Vendor Information Settings > Vendor Settings`; `System Administration > Get Started … Step 6 - Purchasing > Vendor Settings`.

**Tabs:** `Contact`, `Miscellaneous`, `Payables`, `Additional Contacts`.

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor Code` | Code, **up to 5 alphanumeric** | **STORIS ships a delivered vendor `RFND` ("REFUND VENDOR") used for issuing customer refunds.** |

**Fields — Contact tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Name` | Text | Action ⇒ **Description Field - Language Translation Entry**. **Documented abuse: "you can use the Alternate language option to 'hide' the vendor name from customers and selected users. If you enter `N/A` in the Alternate field… and enter a language code of `4` (for Alternate) in the User file for your salespersons and cashiers, then `N/A` appears as the vendor name for all orders entered by those users."** |
| `Country` | Code, **mandatory** | Vendor's country. |
| `Currency` | Country code | The country **whose currency** is used with this vendor; determines currency printed on PO documents. |
| `Update Exchange Rate` | Checkbox | Auto-update the exchange rate on POs from `Actual Exchange Rate` in **Country Settings**. |
| `Address Line 1` / `Address Line 2` | Text | Street address; line 2 typically suite/floor. |
| `Zip Code` / `City` / `State` | Text | **Labels are driven by the `Masking` fields in Country Settings** (Canada ⇒ `Postal Code`/`City`/`Province`). `City` and `State` auto-fill from the Zip Code file. |
| `Phone Number` | Phone | **Format governed by the phone-number mask in the Country file.** |
| `Fax Number` | Phone | **"entered with an area code plus the seven-digit phone number. Do not enter dashes, parenthesis, or spaces."** |
| `Email Address` | Email | Where **inventory purchase orders** are sent. **"To use this feature, the Notifications Control Settings must contain the name of the network server."** |
| `Contact` | Text, optional | Primary contact; **reference only**. |
| `Service Fax Number` / `Service Email Address` / `Service Contact` / `Service Parts Phone` | Text | Used for ordering **service parts**; **"should only be indicated if using the STORIS Customer Service module."** |
| `Available On Web` | Checkbox | Vendor is available on the web. |
| Actions | — | `Add Attachments`, `View Attachments`, `Edit Attachments`. |

**Fields — Miscellaneous tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `In Transit Days` | Integer **0–999**, optional | Added to the shipping date in **Acknowledge a Purchase Order** to calculate the expected delivery date. **Requires `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` in Purchasing Control Settings to be checked.** Action ⇒ **Enter In Transit Days by Location** for per-destination overrides. **"the system checks for the existence of this setting using a specific hierarchy"** (hierarchy is behind a link the article does not expand — **noted as an unfetched dependency**). |
| `Ship Instruction` | Text, **up to 30 alphanumeric** | Defaults into the `Instructions` field when entering a PO for this vendor. |
| `Carrier` | Code | Default carrier on POs. **"This company must already exist as a delivery company."** |
| `EDI Vendor Code` | Code | Links to `VEND-084`. **EDI must be active.** |
| `Alternate Ship From` | Selection | All existing ship-from locations for the vendor. **Inactive if none exist.** Action menu: `Add Ship-From Address`, `Edit Ship-From Address` (**appears only when a ship-from location already exists**). |
| `VR Terms Code` | Code | Special **receivable** terms. **"Use this field with Vendor Receivables module, in which you treat vendor credits as true receivables rather than as credits against future invoices."** |
| `Charge-Back Method` | Enum (see rules) | How reimbursement of third-party-responsible parts charges is handled. |
| `TPA Vendor ID` | Code | Main/default Third-Party Accounting vendor cross-reference, aka **Alternate Vendor Code**. |
| `Maximum Trade Discount` | Percent | Max discount for a **trade/referral** sale of this vendor's products. **Used as the default during order entry if `Maximum Trade Discount` in Advanced Product Settings is blank for the product.** **"This field only applies to trade sales and works independently from other discounts."** |
| `Company Access` | Company list | Restricts the vendor to specific companies. **Blank ⇒ available to all companies.** |
| `Comments` | Free text, **up to 900 characters** | Internal comments. |
| `Product Configurator` | Enum: **`Standard`, `None`** | Activates the STORIS Standard Product Configurator for this vendor. |
| `Configured Price Calculation` | Enum | **Active only if `Product Configurator` = `Standard`.** The configured price calculation method for the vendor. |
| `Unique Vendor Models` | Checkbox | Validates vendor model numbers entered in **Advanced Product Settings, Product Settings, and Enter a Purchase Order** are unique for the product's vendor. |
| `Display in Vendor Name Search` | Checkbox, **checked by default** | Whether the vendor appears in Vendor Name Search results. |
| `Display Comments` | Checkbox, **unchecked by default** | Present the `Comments` text to the user when the vendor is entered on a new Purchase Order or expense AP bill. |
| `Direct Ship Reserved` | Checkbox, **checked by default** | Reserve the direct-ship quantity in Enter a Sales Order. |
| `Require Reservation` | Checkbox | Search for open/unreserved merchandise lines for the vendor. |
| `Update Vendor Quantities` | Checkbox, **unchecked by default** | Which vendors' inventory data is viewable. **"If selected, `VENDOR.INVENTORY` records are updated or created by RetailDeck. This must be set in order for RetailDeck to populate vendor quantity data."** |
| `All Vendor Products` | Checkbox, **unchecked by default** | **"If selected, `VENDOR.INVENTORY` is created for all RetailDeck data. If not, this is created only for products already existing in STORIS."** |
| `API Vendor Code` | Code | Vendor ID used for identification via the **STORIS API interface**. |
| `Serial Number Required` | Checkbox | **Product On-The-Fly Default** — require a serial number when on-the-fly-created special-order pieces are removed from inventory. |
| `Commission Category` | Code | **Product On-The-Fly Default** — default commission category for special-order products. **"If you do not indicate a commission category, the system will default `Z` into this field."** Applies only with the Commission Settings (Commission Matrix) feature. |
| Actions | — | `Add Attachments`, `View Attachments`, `Edit Attachments`, `Add Ship From Address`. |

**Fields — Payables tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warranty GL Account` | GL account | **"For all inventory vendors for which you service/repair products"** — the GL account used for **warranty charge-back transactions**, used "when a service order transaction includes a warranty product indicating any labor or parts fees should be billed back to the vendor." |
| `Supplies GL Account` | GL account | **"For all non-inventory vendors"** — the GL account for non-inventory transactions. |
| `AP Terms Code` | Code | Special payable terms, from the **Terms Code Settings** file. |
| `Remittance Name` | Selection | Current remittance name; Arrow lists all. Actions: `Add Remit-To Address`, `Edit Remit-To Address`. **"To edit or delete an address, select the address before you click on the Actions button."** **"You can specify multiple remittance names for a vendor except if you are using QuickBooks®."** |
| `1099 Required` | Checkbox | **If checked, `Tax ID Number` becomes mandatory. If using TPA, this field is informational only.** |
| `Tax ID Number` | Text | **Active only if `1099 Required` is checked.** |
| `Class` | Vendor class code | See `VEND-083`. |
| `Check Print Bank` | Bank code | Default check print bank for this vendor when creating AP bills. **"If you leave this field blank, the system checks the Company Settings for a default check print bank. This field is active only if STORIS Accounting is active."** |
| `Separate Check per Bill` | Checkbox | Checked ⇒ a **separate check for each individual AP bill** in a check run; blank ⇒ **combine all bills into one check** for the vendor. **Defaults into the `Separate Check` field in `Enter/Update Individual Vendor Invoice`; users can override.** Active only with STORIS Accounting. |
| **`Hold Code`** | AP hold code | **See rules — this is a `PO-080` answer.** |
| `Free Freight Minimum` | Dollar amount | Minimum PO subtotal qualifying for the vendor's free freight. |
| `Suppress Invoice Details on Checks` | Checkbox, **unchecked by default** | Invoice details do not print on checks for this vendor. **"When you print checks with this setting enabled, the message `Invoice details not required for this vendor` prints on the check stub."** |
| `Allow Payment of Pending Bills` | Checkbox | **Allow payment of pending bills for merchandise not yet received from this vendor.** |
| `Paid Pending Bill Reimbursement Method` | Enum: **`None Assigned`, `Accounts Payable`, `Vendor Receivables`** | How the vendor reimburses you for **prepaid merchandise that was not received**. **`None Assigned` ⇒ the method defined in Payables Control Settings is used.** |
| Actions | — | `Add Attachments`, `View Attachments`, `Edit Attachments`, `Add Remit-To Address`. |

**Fields — Additional Contacts tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Contact` | Text | Additional contact name. |
| `Country` | Code | **"Address fields applicable to a particular country will become available when the country is selected (e.g., in selecting Canada, the `State` field will change to `Province`)."** |
| `Address Line 1` / `Address Line 2` / `City` / `State` / `Zip Code` | Text | Contact address; `City`/`State` auto-fill from the Zip Code file. |
| `Phone Number` / `Ext` / `Cell Phone` / `Fax Number` / `Email Address` | Contact | Same masking/format rules as the Contact tab. |
| `Comments` | Text | Contact comments. |
| `Purchase Order Type` | Enum: **`None`, `Merchandise`, `Service`, `Both`** | The type of PO to send to this contact. **`None` de-activates `Submission Method`.** |
| `Submission Method` | Enum: **`None`, `Email`** | How the PO is submitted. **Active only if `Purchase Order Type` ≠ `None`.** |

Grid columns: `Contact`, `Phone number`, `Extension`, `Fax number`, `Email address`, `Usage` → **`Type` (`N`=None, `M`=Merchandise, `S`=Service, `B`=Both)** and **`Method` (`None`, `F`=Fax, `E`=Email)**. Double-click a row to edit.

**Behavior & rules.**

**★ `Hold Code` — vendor-level AP hold (`PO-080`), quoted in full:**
> "Enter the AP Hold code (if any) you want to assign to this vendor… **If you enter a hold code here, the system assigns the selected hold code to all newly created AP bills for the vendor. In addition, those AP bills are ineligible for payment approval until the hold status is removed.**"
- ⇒ **A single field on the vendor master silently holds every future AP bill for that vendor.** It is applied at bill creation (so existing bills are unaffected by adding it), and release is a manual per-bill action. **There is an `AP hold code` lookup table (not documented in this section) — recommend fetching it; it is the enumeration of *why* things are held.**
- **Combined with `PO-102`** (fully-received POs close automatically when approved for payment): **a held bill never reaches approval, so the PO never auto-closes.** That is the mechanism behind "POs stuck open".

**★ `Charge-Back Method` — exact enum and semantics:**
- **`D - Payables Credit`** — this vendor's credits handled as **debits against future payable invoices**.
- **`V - Vendor Receivable`** — this vendor's credits handled as **open receivables**.
- **`R - Report Only`** — charge-back information is **reported only on the Vendor Charge-Back Report**.
- **`None Selected` (blank)** — the program references the **`Vendor Chargeback Method`** field in the **Service Control Settings**.
- **"All options offered at this field produce a report."**
- **This is directly relevant to `RTV-012` and to open gap #2.** `D` vs `V` is precisely the choice between "net the credit off the next bill" and "track it as a receivable we expect to collect". **`V` + `VR Terms Code` is STORIS's answer to tracking expected vendor credit as a real, agable balance.**

**★ `Allow Payment of Pending Bills` + `Paid Pending Bill Reimbursement Method`** — this pair is STORIS's prepayment model: you may pay for merchandise before receipt, and if it never arrives the vendor reimburses you via AP or via Vendor Receivables. **Propagation warning, exact: "If you change this setting for an existing vendor, you need to also update the `Allow Payment of Pending Bills` field in your existing Vendor Ship-From records, if any."** — **the setting is duplicated at the ship-from level and does NOT cascade. Flag as a data-integrity trap.**

**★ `Free Freight Minimum` behavior:**
- "the system compares purchase order subtotals with this dollar amount. **If the subtotal is less than this amount, a warning message appears but you can continue.**"
- "if you click on `Save` when the free freight option is active for the vendor but the purchase order total does not meet the free-freight minimum, **an exception message posts to the Purchase Order Comments file**."
- **"When paying purchase orders, the Vendor Invoice process also determines if free freight should apply."**
- **Report Builder includes `POs Eligible for Free Freight` (`S$AP_FREE_FGHT`), which "lists AP Bill records that were eligible for free freight but had freight charges added."** — **this is a freight-overcharge recovery report and is a genuinely good idea to copy.**

**★ Foreign-currency vendor rules (hard):** if `Currency` is set to a country other than the domestic country in the Country file, then
- **all documents for this vendor display in the selected currency**,
- **all payables for the vendor calculate in that currency**, and
- **"for purchase orders created for the vendor via the `Enter a Sales Order` routine, the system initially assigns a cost of `$0.00` and later executes all costing for the purchase order via the `Enter a Purchase Order` routine."**
- **`Update Exchange Rate` gotcha: "In order to enter multiple vendor invoices for a foreign vendor this box must be checked otherwise the system only allows one purchase order to be selected per AP bill."**

**★ `Class = INV` side effect (hard and surprising):** **"If creating a new vendor and you set this field to `INV`, then when you click on `Save`, the system automatically creates a new brand and assigns it a code that matches the vendor code."** — **a magic string on a code table field creates a record in a different master file.**

**★ `Direct Ship Reserved` — `PO-060` drop-ship behavior, quoted:**
- Checked (default) ⇒ reserve the direct-ship quantity in Enter a Sales Order. Unchecked ⇒ **"the reservation on the sales order does not happen until a tracking ID is entered on the associated purchase order."**
- **"The reserved quantity remains zero until a tracking ID is received from EDI or manually entered in `Acknowledge a Purchase Order`. For an order line to be completed, the reserve quantity must be set."**
- **"If no tracking ID is present, use `Additional Line Item Details` to manually set the reserved quantity to complete each direct ship line. When the line is completed, the order comments are updated with the direct ship tracking ID, if one is present."**
- **"This setting does not apply to direct ship service parts."**

**★ `Require Reservation` rules:**
- Error message, exact: **"Not enough quantity is available to reserve all existing merchandise lines for this vendor."**
- **"When active, this setting prevents existing orders from being updated to reserve lines with products from the vendor in question. The inquiry into quantity during sales order entry includes lines that are not reserved."**
- **"Vendor Settings prevents the user from checking the box for `Required Reservation` if the vendor has special order products or products with `PO From Order Entry` enabled."**

**★ GL default warnings (both `Warranty GL Account` and `Supplies GL Account`):** **"failure to indicate a GL account here can result in GL activity being posted to the system default account, requiring manual correction prior to running the month-ending process."** — **a blank field silently misposts to a suspense account and is only caught at month end.**

**★ `AP Terms Code` and `Tax ID Number` TPA sync:** both transfer to the third-party accounting system **when the vendor is created**, and **"if you later edit this field, you must also change [it] in the third-party accounting system (for example, QuickBooks®)."** — **create-time one-way sync, no ongoing propagation. Same class of ERP↔accounting divergence as `Allow Transmitted AP Bill Deletion`.**

**★ `Company Access`:** **"User restrictions apply! If your user settings restrict you to specific companies, you must indicate at least one company in this field when creating a new vendor."** Access to an existing vendor is based on the user's company restrictions (`Create a User`). **"In processes in STORIS where you enter a vendor code, the system validates that the vendor is accessible to you."**

**★ `Update Vendor Quantities` / `All Vendor Products` save-time licence check:** **"When either of the two checkboxes are checked when `Save` is selected, the `Vendor Quantity on Hand` licensed module is validated in General System Control Settings, and save is allowed. If this does not happen, an error message is displayed and the options cannot be saved."**

**★ Audit note:** **"STORIS captures when users create or modify vendor records, as well as the dates and times of the edits. You can access this data via the `VENDOR` field in the Report Builder."** — **this is one of the very few audit trails STORIS has** (recall: no general change-audit log). **It records who/when but not what changed.** Feed the equivalent into `RPT-AUDIT` with before/after values.

**★ Zip-code on-the-fly:** on both the Contact and Additional Contacts tabs, an unknown zip prompts **"Zip Code NOT on file. Create new Zip Code?"** — same uncontrolled zip creation flagged in `VEND-081`.

**Dependencies.** `VEND-083` Vendor Class Settings (`Class`); `VEND-086` Vendor RemitTo Settings (`Remittance Name`, `Check Print Bank` default); `VEND-084` Vendor EDI Settings (`EDI Vendor Code`); `VEND-090` Vendor Ship From Settings (`Alternate Ship From`, duplicated `Allow Payment of Pending Bills`); `VEND-088` Vendor Ship from Location Lead Days; `VEND-052` (`Average Lead Time`, tier 10); Terms Code Settings (`TERMS_CODE` scope); Country Settings (masking, `Actual Exchange Rate`); Zip Code Settings; Purchasing Control Settings (`DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order`); Payables Control Settings (pending-bill reimbursement default); Service Control Settings (`Vendor Chargeback Method`); Company Settings (default check print bank); `Select and Approve Bills for Payment`; `Enter/Update Individual Vendor Invoice`; Notifications Control Settings; General System Control Settings (`Vendor Quantity on Hand` licence, and the global **Extended Security** kill-switch); RetailDeck; STORIS API; Commission Settings; Report Builder (`VENDOR` field, `S$AP_FREE_FGHT`); `PO-060`, `PO-080`, `PO-102`, `RTV-012`, `COST-031`.

**Build notes.**
- **Split the vendor master.** STORIS conflates inventory vendors, freight carriers, expense payees and the refund pseudo-vendor `RFND` into one file. We should keep one payee entity but with a **role set** (`MERCHANDISE`, `FREIGHT`, `EXPENSE`, `SERVICE_PARTS`, `SYSTEM`) driving which tabs/fields apply and which validations fire.
- **`Hold Code` is a must-build**, but as a **hold *reason* with an owner, a placed-at timestamp, and a release audit trail** — not a bare code. Support holds applied to existing bills, not only new ones, and a "release all holds for vendor X" action that is audited.
- **`Charge-Back Method` `V - Vendor Receivable` is the model we want for `RTV-012` expected credit** — treat vendor credits as agable receivables, not as memo netting. Make it the default rather than an option.
- **Kill the duplicated `Allow Payment of Pending Bills`**: one setting at vendor scope with an explicit ship-from override in the resolver, so changing the vendor value actually takes effect.
- **Make `Warranty GL Account` / `Supplies GL Account` required for the relevant vendor roles** — silent posting to a default account discovered at month end is exactly the kind of defect we are rebuilding to avoid.
- **Vendor bank/terms/tax changes need maker-checker** (see `VEND-086`), and full before/after audit into `RPT-AUDIT`. STORIS records only that an edit happened.
- **Copy `POs Eligible for Free Freight` (`S$AP_FREE_FGHT`)** as a standing exception report.
- **Do not implement the `Class = INV` auto-creates-a-brand behavior**, or the Alternate-language vendor-name-hiding trick. Both are hacks.
- **Destructive-reach flag:** the `Remittance Name` Actions menu allows **deleting** a remit-to address from the vendor screen ("To edit or delete an address, select the address before you click on the Actions button") with no stated confirmation or in-use check. A deleted remit-to that is referenced by open bills or scheduled payments is a payment failure. Require an in-use check and soft delete.
- `[DECISION NEEDED]` `Allow Payment of Pending Bills` — do we permit paying for unreceived merchandise at all? If yes, which reimbursement track (`Accounts Payable` netting vs `Vendor Receivables` ageing)?
- `[DECISION NEEDED]` Multi-currency vendors: do we need foreign-currency payables at go-live, and if so do we revalue?
- **Unfetched dependency:** the `In Transit Days` hierarchy is behind a "Click here for detail" link that this article does not expand. Recommend a follow-up fetch — it is a sibling of the `VEND-052` lead-days hierarchy and will be needed for ATP.

---

### `VEND-088` Vendor Ship from Location Lead Days
*storis_ref: article 15243029986196*

**Purpose.** Set vendor purchase lead days **per destination warehouse/store location**, overriding the ship-from's own lead days.

**Where it lives.** `Vendor Ship From Settings > extra Action button at the Lead Days field`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse/Store Location` | Location code | The destination location to associate lead days with; Search opens a lookup. **Once a location is entered, `Lead Days` becomes active.** |
| `Lead Days` | Integer | Lead days for the selected location. Click the **green `Add` button** to add the pair to the grid. |

Grid columns: `Location`, `Description` (from Warehouse/Store Location Settings), `Lead Days`, `Remove`.

**Behavior & rules.**
- **Hard precedence rule: "Lead days established in this process take precedence over the lead days in the `Lead Days` field in Vendor Ship-From Settings."** This is tier 4 of the `VEND-052` hierarchy, sitting above tier 5 (`Vendor Ship-From Settings`).
- **`Remove` deletes the lead-days row for that location; "A message confirms the deletion."** (Confirmed delete — better than several sibling screens.)

**Dependencies.** `VEND-090` Vendor Ship From Settings (parent); `VEND-052` Purchase Lead Days hierarchy (tier 4); Warehouse/Store Location Settings.

**Build notes.** This is simply `purchase_lead_days` at scope `(vendor_ship_from, destination_location)`. Register it in the resolver rather than building a bespoke grid screen; the same `(source, destination)` matrix pattern also serves `In Transit Days by Location` (`VEND-087`, `VEND-090`).

---

### `VEND-089` Vendor Ship From Replacement Cost Settings
*storis_ref: article 15242998160660*

**Purpose.** Record a product's **replacement cost per vendor ship-from location** — different origins, different costs for the same SKU.

**Where it lives.** `Advanced Products Settings > Costing page > extra Action at the Replacement field`; `Update a Product Cost > extra Action at the Replacement Cost field`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor Ship From` | Selection (arrow) | The vendor ship-from location. |
| `Replacement Cost` | Currency | The product's replacement cost for that ship-from location. |

Grid columns: `Ship From` code, `Cost` amount. `Add` updates the grid; **`Remove` deletes a line from the grid** (no confirmation stated).

**Behavior & rules.**
- **"The read-only version of this screen appears when accessed through a view-only version of the routine, such as `View Advanced Product Settings`. In this version, you may only view the currently available selection(s)."**
- Article is thin: **no validation, no currency handling, and — importantly — no statement of how this interacts with the product's base replacement cost or which wins when a PO has no ship-from.** Noted as a documentation gap.
- **Directly relevant to `COST-031`/`COST-032`:** replacement cost varies by origin, which is exactly the case where vendor-level landed-freight factors (`COST-031`) and product-level overrides (`COST-032`) diverge. A product imported from two ports has two landed costs.

**Dependencies.** `VEND-090` Vendor Ship From Settings; Advanced Product Settings → Costing page; Update a Product Cost; `VEND-084` (`Update Replacement Cost in Product File` — AP bill entry can also write replacement cost); `COST-031`, `COST-032`.

**Build notes.** Model replacement cost at scope `(product, vendor_ship_from)` with fallback to `(product)`. **Reconcile the write paths**: AP bill entry (`VEND-084`), this screen, and `Update a Product Cost` can all set replacement cost — **decide one authoritative path and make the others read-only or explicitly audited**, or costs will silently disagree. `[DECISION NEEDED]`

---

### `VEND-090` Vendor Ship From Settings
*storis_ref: article 15243031196820*

> **Contains the vendor-level default for separate-freight-bill receiving (`RCV-050`).** See `Freight Amount`.

**Purpose.** Define one or more **alternate ship-from addresses** for a vendor, used on purchase orders. Each address can reside in a foreign country, have its own payable terms, link to a specific remit-to, carry its own lead/pad/in-transit days, tie to a buying group, and carry Freight Policy and FOB codes.

**Where it lives.** `Merchandising and Distribution > Inventory > Settings > Purchasing Settings > Vendor Information Settings > Vendor Ship From Settings`; `Merchandising and Distribution > Settings > Purchasing Settings > Vendor Information Settings > …`; `Accounting > Payables > Payables Settings > Vendor Information Settings > …`; `Accounting > Third Party Accounting > Payables > Payables Settings > Vendor Information Settings > …`. **Also directly from `Vendor Settings` via the `Actions` button on the `Miscellaneous` tab.**

**Tabs:** `General`, `Import Information`, `Additional Contact`.

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Vendor ID` | Vendor code | Search ⇒ **Vendor Cross Reference Screen**. |
| `Ship-From ID` | ID number | Arrow lists the vendor's ship-from addresses. **To create a new one, press `<Enter>` at the default response `"<+>"` or select `Create New Record`; the `Enter New Ship-From ID Window` appears.** |

**Fields — General tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Description` | Text, **up to 30 alphanumeric** | Description of the ship-from address. |
| `Country` | Code | **Must exist in the Country file.** |
| `Address Line 1, 2, 3` | Text | The ship-from address. |
| `Zip Code` / `City` / `State` | Text | **Dynamic labels driven by the masking settings in the Country record** (Canada ⇒ `Postal code`). |
| `Carrier` | Code | Freight carrier used when shipping from this address. |
| `Ship Instructions` | Two lines free text, optional | **"When creating purchase orders shipping from the current address, the instructions you enter here override any ship instructions in the vendor record."** |
| `Usage` | Text, optional | Why this alternate address is used — **examples given: "Send COMs here", "service address".** |
| `Alternative ID` | Text, optional | **"If using AFI Replenishment, enter the alternative ID provided by Ashley Furniture. The ID entered in this field is used to identify the vendor code set in STORIS in order to create purchase orders."** |
| `Lead Days` | Integer | Purchase lead days for this ship-from. Extra Action ⇒ **Vendor Ship from Location Lead Days** (`VEND-088`). |
| `Lead Pad Days` | Integer | **"If a purchase order does not exist, this field is used in the available to promise (ATP) calculation to estimate an ATP date."** |
| `PO Pad Days` | Integer **0–999** | Purchase delivery pad days added to lead days (the sales-promise cushion). |
| `In Transit Days` | Integer **0–999**, optional | Added to the shipping date in **Acknowledge a Purchase Order** to calculate the expected delivery date. **Requires `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` in Purchasing Control Settings.** Action ⇒ **Enter In Transit Days by Location** for per-destination overrides. |
| `Payable Terms` | Code | Terms of payment applied when using this ship-from address. |
| `Allow Payment of Pending Bills` | Checkbox | See rules — this is the PO `Pay Prior Receipt` driver. |
| `Freight Amount` | Currency, **two decimal places, max `9,999,999.99`**, optional | **"Set the default for the `Total Freight Amount` setting in `Receive a Purchase Order with a Separate Freight Bill`."** |

**Fields — Import Information tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Remit-To ID` | Code, optional | The remit-to address used when invoicing orders **ordered and shipped from this ship-from address**. |
| `Freight Policy` | Text, optional | **"The text you enter appears on the IPI document."** |
| `Buying Group` | Code, optional | **"the text you enter here overrides any buying groups specified in the Advanced Vendor Settings record."** |
| `FOB Code` | Code, optional | Freight-on-board code. **"After you enter a valid code at the `FOB Code` field, information on the two freight-forwarder contacts appears on the screen. This information on this screen is display-only."** |

**Fields — Additional Contact tab**

Used **"only in the absence of an FOB code through which to translate the Freight Forwarder contact information."**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Contact Name` | Text | Contact name. |
| `Country` | Code | Must exist in the Country file. |
| `Dial Prefix` | Display | **"The foreign dial prefix (if any) displays from the Country file."** |
| `Phone Number` | Phone | **Dynamic formatting from the Country record masking settings.** |
| `Ext` / `Fax Number` / `Email Address` | Contact | Contact details. |
| `Usage` | Text, optional | Reason for the alternate address. |

**Behavior & rules.**
- **`Allow Payment of Pending Bills`, quoted:** "If this box is checked, **new Purchase Orders you create automatically have the `Pay Prior Receipt` field checked. AP bills created for those purchase orders can then be paid before the merchandise is received.** The default for this setting when creating a new ship-from for the vendor is determined by the same setting in Vendor Settings. **If you change this setting for a vendor ship-from, existing Purchase Orders are not automatically updated, but you can manually update them.**"
  - ⇒ **Three-level staleness: `Vendor Settings` seeds `Ship-From` at creation only (`VEND-087` warns you must update ship-froms by hand); `Ship-From` seeds the PO at creation only.** A change at the top propagates to nothing already in flight.
- **`Freight Amount` — `RCV-050` link, exact: "Note that updates are made on a go-forward basis only; existing freight batches are not updated."** This is consistent with the established rule that **freight may only be added while the receiving batch is open** — the default cannot retroactively alter a batch.
- **`Ship Instructions` at ship-from override the vendor record's `Ship Instruction`** (`VEND-087`). Note the ship-from field is **two lines free text** while the vendor field is **30 alphanumeric** — they are not the same shape.
- **`Buying Group` here overrides Advanced Vendor Settings.**
- **`Lead Days` precedence: "Lead days applied via the `Vendor Ship from Location Lead Days` process are considered before the lead days in this field."** (Matches `VEND-052` tiers 4 then 5.)
- **ATP recalculation warning on `PO Pad Days`** — identical wording to `VEND-059`: changing it with active open POs from that vendor requires ATP recalculation, which happens at **End of Day**; **"in the meantime, the pad days value will not be reflected in the ATP date of that product."**
- The `In Transit Days` hierarchy is again behind an unexpanded "Click here for detail" link. **Unfetched dependency, same as `VEND-087`.**
- **`Payable Terms` at ship-from scope means one vendor can carry different payment terms per origin** — significant for import vs domestic.

**Dependencies.** `VEND-087` Vendor Settings (parent, Miscellaneous tab Actions; seeds `Allow Payment of Pending Bills`); `VEND-088` Vendor Ship from Location Lead Days; `VEND-089` Vendor Ship From Replacement Cost Settings; `VEND-086` Vendor RemitTo Settings (`Remit-To ID`); `VEND-052` Purchase Lead Days (tier 5); `VEND-070` Shipping Port Settings / FOB records; **FOB Settings**; Country file (masking, dial prefix); Purchasing Control Settings; Advanced Vendor Settings (buying group); AFI Replenishment; **`Receive a Purchase Order with a Separate Freight Bill`** (`RCV-050`); IPI document; Enter In Transit Days by Location.

**Build notes.**
- **`VENDOR_SHIP_FROM` should be a first-class resolver scope** carrying: `purchase_lead_days`, `lead_pad_days`, `po_pad_days`, `in_transit_days`, `payable_terms`, `carrier`, `ship_instructions`, `remit_to`, `buying_group`, `fob_code`, `freight_policy`, `allow_payment_of_pending_bills`, `default_freight_amount`.
- **Eliminate copy-at-create seeding.** `Allow Payment of Pending Bills` should resolve live (`PO → ship-from → vendor`), with the PO storing only an explicit override. STORIS's three-level snapshot chain is the single most likely source of "we paid for goods we never got" incidents in this design.
- **Keep the go-forward-only rule on `Freight Amount`** — it correctly respects `RCV-050`–`RCV-054`'s "freight only while the batch is open".
- Freight-forwarder contact should come from the FOB record with an explicit per-ship-from override, not an implicit "used only in the absence of an FOB code" fallback.
- `[DECISION NEEDED]` Do we need `Buying Group` at all? It is referenced here and in Advanced Vendor Settings but never defined in this section.

---

### `VEND-091` Warehouse Inventory Settings
*storis_ref: article 15243033214228*

**Purpose.** Hold per **product × warehouse/store location** pricing and inventory control data: location selling price, purchase status, max/min/safety stock levels, putaway velocity and storage category, distribution status, and cross-dock handling.

**Where it lives.** Eight paths, e.g. `Merchandising and Distribution > Inventory > Settings > Inventory Hierarchy Settings > Product Information > Warehouse Inventory Settings`; `Customer > Customer Service > Settings > Product Information Settings > …`; `System Administration > System Settings > Merchandising and Distribution System Settings > Inventory Hierarchy Settings > Product Information Settings > …`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse/Store Location` | Arrow list, **mandatory** | The location the record applies to. |
| `Product Number` | Product code | Must be an existing product; Search ⇒ **Search for a Product** (one or more). **A counter next to the field indicates a product list is active, showing which record is being edited and the total in the list.** |
| `Showroom Merchandise` | Checkbox | Marks the product as **"programmed stock" (part of the store lineup)** at this location. Used by `Report Floor Sample Needs` when `Programmed Stock Only` is checked. **"If this product was on a distributed transfer, the field is checked."** |
| `Location Selling Price $` | Currency | Price at which to sell the product at this location. **"To determine this field's place in the pricing hierarchy, consult the Pricing Rules."** |
| `Purchasing Status` | Code | **"Purchase statuses determine your ability to re-order a product."** Action ⇒ **Schedule Purchase Status** to specify a date and the next status. **"If the open-order quantity exceeds the quantity in inventory for the selected product, the field is inactive."** |
| `Maximum` (Stock Level Quantity) | Quantity | Max quantity indicator for the product/location. |
| `Minimum` (Stock Level Quantity) | Quantity | Min quantity indicator — **"a serious situation"**. |
| `Safety` (Stock Level Quantity) | Quantity | Safety quantity indicator — **"a critical situation"**. |
| `Velocity` | Code, optional | Product velocity **at this location**, for directed putaway. |
| `Storage Category` | Code, optional | Product storage category at this location, for directed putaway. |
| `Current Status is` (Distribution Status) | Code, optional | Distribution Status code at warehouse/store level. **"The code you indicate determines the default stocking location of the product and whether or not it can be entered or reserved on a sales order, exchange or transfer."** |
| `On this Date` | Date | Date on which `Current Status is` should be updated. **"The date you select here must be greater than the system date."** |
| `Change Status to` | Code | The new distribution status to apply on that date. |
| `User Defined Warehouse Inventory Code` | Text, **up to 10 alphanumeric** | **"Use the code you enter here to select and sort reports you create in the Report Builder."** |
| `Cross Dock` | Enum: **`Use Product Settings` (default), `Include`, `Exclude`** | How cross-docking is handled for this product at this location. **"This setting is exported to Data Warehouse."** |
| `Setting` / `Response` / `Select` (User Defined Settings page) | Grid | User-defined prompts and responses. **"Entries on this screen are for information only; no processing occurs based on this information."** |

**Behavior & rules.**
- **Records auto-generate: "Warehouse inventory records generate automatically when you use inventory receiving programs such as Receive a Purchase Order."**
- **"If you don't use Location Tracking, you can use this routine to identify the storage location where you usually stock each product in each warehouse/store location."**
- **Seeding rule (one-shot, at first receipt): `Maximum Stock Quantity`, `Minimum Stock Quantity`, and `Safety Stock Quantity` from Advanced Product Settings "default into this field *during the initial receipt* of this product at a given location, but you can override the default."** **Blank otherwise. Another copy-at-create seeding, so later changes to the product-level defaults never reach existing product/location rows.**
- **`Maximum` and Automatic Store Stock Replenishment: "If available quantity exists, the system transfers the quantity you enter here minus the available quantity."** (Exact replenishment formula: `transfer_qty = Maximum − available`.)
- **`Minimum` / `Safety` and replenishment:** whichever the **`Available is Less Than Minimum Stock`** setting names (`"Minimum"` or `"Safety"`) is the trigger level Automatic Store Stock Replenishment tests. **"If the number you enter here exceeds the quantity available for any item in the product/location combination, the system transfers inventory (provided sufficient inventory is available)."**
- **Exception generation: the EOD process and the `Replenish Assigned Stock Levels at Stores` routine both raise exceptions when the level exceeds quantity available.** For `Maximum`, "the system generates an exception and the exception appears on the report."
- **Hard rule: "Special Order Products cannot be replenished based on the minimum level, an amount entered here is not evaluated in `Replenish Inventory for Current Back Order Needs`."** (Stated for both `Minimum` and `Safety`.)
- **Velocity hierarchy: "To determine a product's velocity, the system checks this field first. If it is blank, the system then checks the product's velocity setting."** (Then, per `VEND-077`, the storage-location velocity and the Inventory Control Settings default.)
- **Distribution status hierarchy (exact order): `Warehouse Inventory Settings` → `District/Regional Product Settings` → `Advanced Product Settings`.** **Usable only with products whose `Inventory Type` is `Retail Inventory`, `Retail Part`, or `Retail Labor`.**
- **Scheduled status change mechanics:** after setting `On this Date` / `Change Status to`, **"you then schedule the `Update Distribution Status` process to run using the `Schedule a Process` program. Based on the end of day date and the status change date, the update process changes the `Current Status is` field to the status in `Change Status to`. These fields are then reset to null."** **⇒ the scheduled change does nothing unless someone separately schedules the process. A silent no-op waiting to happen.**
- **Piece-assignment hierarchy (exact, and important — this is the authoritative statement of it): "The hierarchy for assigning pieces is to assign from priority pick locations, then cross dock locations, pick zones, and then all other storage locations."** Consistent with `VEND-077`.
- **`Location Selling Price` side effects:** "When a change is made to the `Location Selling Price`, the system reads the change and determines if a floor tag should be placed in the label queue for on-hand floor sample pieces." and **"Independent of whether [`Showroom Merchandise`] is enabled, the Label Queue is only updated with pieces with the `Floor Sample` reason code."**
- **Kit pricing override (hard): "When a kit's pricing is set to `Component` (`Source of Price` field in Product Kit Settings), it overrides the price in this field. The price in this field is used only if the `Source of Price` for the kit master is set to `Product`."**
- Purchase statuses can also be assigned via **District and Regional Product Settings**, **Single Product Review Screen**, and this routine; **mass-assigned by region via `Set Product Status by Region`**.
- **User Defined Settings page activation rule (verbatim, and opaque): "This page is active when more than one user defined setting record is present and at least one of those records is set up without an associated inventory formation. If there is only one user defined setting record assigned to an inventory formation, the product being updated must exist in the system in order for this page to be active."**

**Dependencies.** Advanced Product Settings (stock-level defaults, velocity, `Include in Cross Dock`, distribution status); District and Regional Product Settings; Pricing Rules; Product Kit Settings (`Source of Price`); `VEND-072` Storage Category Settings; `VEND-082` Velocity Settings; `VEND-077` Tracked Storage Location Settings (cross-dock/priority precedence); Inventory Control Settings (`Available is Less Than Minimum Stock`, `Storage Location Velocity`); Automatic Store Stock Replenishment; `Replenish Assigned Stock Levels at Stores`; `Replenish Inventory for Current Back Order Needs`; `Report Floor Sample Needs`; `Set Product Status by Region`; `Schedule a Process` / `Update Distribution Status`; Data Warehouse export; Report Builder; User Defined Settings; `Receive a Purchase Order`.

**Build notes.**
- This is `PRODUCT × LOCATION` scope in the resolver — register `selling_price`, `purchase_status`, `max_stock`, `min_stock`, `safety_stock`, `velocity`, `storage_category`, `distribution_status`, `cross_dock_mode`.
- **Replace one-shot seeding with live resolution** (`product/location` → `district/region` → `product`). The "defaults in at first receipt only" behavior means product-level stock policy changes never reach the field.
- **A scheduled status change must be self-executing.** Do not require a separate scheduled process; if a future-dated change exists, apply it.
- Adopt the piece-assignment hierarchy verbatim: `priority pick → cross dock → pick zones → all other storage locations`.
- `Cross Dock` tri-state (`Use Product Settings` / `Include` / `Exclude`) is a good pattern — **use this tri-state everywhere we have a location-level override of a product-level flag**, in preference to STORIS's inconsistent blank-means-something conventions.

---

### `VEND-092` Warehouse Mapping Paths Screen
*storis_ref: article 15243029987348*

**Purpose.** Specify the **filesystem directories** used to exchange data with the third-party routing/mapping provider configured for a warehouse.

**Where it lives.** `Action` button at the **Third-Party Interfaces/Routing** field on the **Merchandise** tab of **Warehouse/Store Location Settings**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Data From Mapping Interface` | Directory path | Where STORIS looks for data generated by the third-party routing/mapping provider. **"Enter only the path. Do not include the actual filename."** Example given: `C:\routeview\datain\` |
| `Data to Mapping Interface` | Directory path | Where STORIS stores data for use by the provider. **"Enter only the path. Do not include the actual filename."** Example given: `C:\routeview\dataout\` |

**Behavior & rules.**
- Article is thin — two path fields, no validation, no permission notes, no error handling for a missing/unwritable directory.
- **File-drop integration with a per-warehouse local Windows path. Flag as an architectural anti-pattern**: unvalidated, unmonitored, and silently failing if the path is wrong. Nothing here describes what happens when the directory does not exist or the interface has not run.

**Dependencies.** `VEND-093` Warehouse/Store Location Settings → Merchandise tab (`Third-Party Interfaces/Routing`); Route Mapping Interface / Route Mapping Control Settings (`Default Weight`, per `VEND-064`); STORIS API.

**Build notes.** **Do not build file-drop integrations.** Use an authenticated HTTP/queue interface per provider with health checks, a visible last-successful-exchange timestamp, and alerting on staleness. If a legacy file drop is unavoidable, validate the path at save time and monitor it.

---

### `VEND-093` Warehouse/Store Location Settings
*storis_ref: article 15243033212820*

> **The largest article in this section by an order of magnitude** (~110KB of unique text, 12 pages). It is the
> **location master** and is referenced by roughly half the other articles in this part. Written up in full below,
> organised by page. Purchasing- and vendor-relevant content is on the **Purchasing** and **Miscellaneous** pages.

**Purpose.** "Set up records for each store or warehouse location in which you create sales orders, receive and transfer products, and/or generate general ledger activity."

**Where it lives.** `Merchandising and Distribution > Inventory > Location Settings > Warehouse/Store Location Settings`; `Merchandising and Distribution > Settings > Location Settings > …`; `System Administration > Get Started … Step 3 - Business Information > Get Started - Designate Locations > …`; `System Administration > System Settings > General Administration System Settings > …`.

**Page Headings:** `General`, `Inventory & Logistics`, `Credit Card`, `Checks`, `Online Finance`, `Barcode`, `Purchasing`, `Miscellaneous`, `Replenishment`, `Credit Application`, `Revolving`, `User Defined Settings`.

---

#### Creation-time rules (before any page)

- **Cost centers: "Whenever you create a location record, the system automatically creates an associated cost center. When you click on `Save`, the option appears to add the cost center to existing GL accounts."** If using QuickBooks®, **"you must set up a matching cost center `CLASS` in your third-party accounting software for each cost center in STORIS."**
- **HARD RULE: "The system does not allow you to create a new location if an associated GL cost center already exists. You must delete the existing GL cost center first. This includes GL cost centers whose codes are *numerically equivalent* to their associated locations. For example, if a GL cost center exists with a code of `'009'`, and you attempt to create a location with a code of `'9'`, an error message appears and the system disallows the action."**
- **"When you create a merchandise transfer between locations, the system automatically creates a corresponding customer record using the same code as the Warehouse Location record."** — **locations are silently also customers.**
- **`Warehouse/Store Code`: maximum four numeric characters.** **"STORIS comes delivered with Warehouse Location `88` as your initial default location."**
- **"When you create or edit a new location, be sure to update the Zip Code records associated with customer ship-to locations for delivery sales orders."**

---

#### General page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Location Type` | Enum: **`Warehouse`, `Store`** | **"For existing locations, the field displays the type but is unavailable for change."** **Must be `Store` for the location to be included in the STORIS UP System or Report Floor Sample Needs.** |
| `Company` | Code | If not using Multi-Company Processing, the default company from General System Control Settings displays and cannot be changed. |
| `Region` | Code | The region in which the location resides. **"STORIS references this location when establishing regional pricing."** |
| `District` | Code | **Documented with the identical (copy-pasted, and wrong) text as `Region`** — "Enter the code of the region in which the selected location resides." **Source documentation error.** |
| `Bank Number` | Code | Default bank when posting cash and check receipts at this location. **"The system posts all cash or check deposits/payments received at this location to the cash General Ledger account associated with this bank record, unless override bank numbers have been specified."** Action ⇒ **Bank Override** window for per-payment-class overrides. |
| `Description` | Text | Full name of the location. Actions ⇒ Description Field - Language Translation Entry. |
| `Printed Document Description` | Text, **max 60 alphanumeric** | Extended description on customer-facing sales documents via Design Enhanced Laser Forms. **"The ELP tag, `printed_document_description`, must be added by you on your documents before the information entered in this field can be viewed."** |
| `Address Line 1` / `Address Line 2` | Text | **Line 2 for "P.O. Box, Dept., etc., NOT city, state, or ZIP code."** |
| `Zip/Postal Code` / `City/Town` / `State/Province` | Text | City and state auto-fill from the Zip Code record; overridable. |
| `Location` (Phone Contacts) | Phone | **10-digit, beginning with the area code.** |
| `Service` / `Delivery` / `Customer Pickup` (Phone Contacts) | Phone, **max 12 characters each** | Direct numbers for each function. |
| `Variance %` (Price Variances Rules) | Percent | Max percentage a user may vary the selling price **downward** from the Advanced Product Settings price. **"The variance percent you enter here overrides the variance percent set on the Pricing and Commissions tab in the Point of Sale Control Settings. Thus, if you enter `0` here, the system applies a zero variance percent. To bypass this setting and use the setting in the Point of Sale Control Settings, leave this field blank."** — **`0` and blank mean opposite things.** |
| `Special Order Variance %` | Numeric **0–100**, up to **two decimal places** | Max percentage a special-order product's price may differ from its Advanced Product Settings price plus special-order option upcharges. **Null ⇒ no check is performed.** Error texts: **"Entry must be less than or equal to 100."** / **"Entry must be greater than or equal to 0."** |
| `Variance Exceeded Alert` | Enum (see below) | Alert type when the price variance is exceeded. |
| `Reason Required` | Checkbox | Prompts for a reason code when the variance is exceeded — **"regardless of the user's sales security setting `Override POS exception rules` and the `Variance Exceeded Alert` level selected on this screen."** Reason codes appear on the **Variance from Retail** report from Generate Daily Reports. **"The system checks the location first and if the box at this field is blank, it uses the global Point of Sale Control Settings."** |
| `Comment Required` | Checkbox | Requires a comment on a price-variance exception; viewable via **Enter Exception Comments** (`View/Edit Exception Comments` from the Actions button on the Merchandise tab). **"The comment entered is associated with the entire order, and not with a particular line."** **"Price variance checks are performed on the line item price, modified order subtotal, and within group pricing. If you leave the `Price Variance %` field blank, this check box must also be blank."** |
| `Selling Price is Below Cost` | Enum (see below) | Alert when a line's price is set below product cost. **"All exceptions generated by the system appear on the TE Exceptions report generated during the End-of-Day process."** |
| `Gross Profit %` | Percent | Minimum gross profit percentage to maintain for repriced lines. **"STORIS uses a hierarchy to determine minimum gross profit percentage"** (hierarchy not expanded in this article). |
| `Minimum Gross Profit Not Met` | Enum (see below, **plus `Override Reason Required`**) | Check level when minimum GP is not met. |
| `Maximum Subtotal Discount %` | Numeric **0–100**, no decimals | **Blank ⇒ the `% Maximum Subtotal Discount` field in Point of Sale Control Settings is used.** |
| `Due Day` | Day **1–28** | Day of month open balances become due for customers associated with this location; defaults into `Due Day` in Customer Settings for new customers. **Blank ⇒ defaults from Account Statement Cycling Control Settings.** **"once you assign a due day to a location, this field inactivates and you cannot edit it."** |
| `Date Closed` | Date | **"This field is for informational purposes only; entering a date here does not close the location."** **"NOTE: Locations cannot be closed."** |
| `Miscellaneous Fee/Charge` | Fee code(s) | Fees applied whenever this location is the selling location; total shows at `Fees/Charges` on the Payment tab. **"the fee total can include fees associated with tax jurisdictions."** **"STORIS recommends that for each fee you associate with a location, you check the box at the `Apply Always` field in the Miscellaneous Fee Settings. The program applies the fee to all order types except direct shipments."** |
| `Web Selling Location` | eSTORIS location | Links a STORIS location to an eSTORIS location to sync shopping carts. **"only one cart is allowed per email address per location"** — activation is blocked until duplicates are converted or deleted. **Must be populated if `Use Store Locator as Selling Store` is enabled in the eSTORIS Administration Panel.** |
| `Allow Creation of New Orders in ERP from Enter a Sales Order` | Checkbox, **checked by default** | Unchecked ⇒ the store cannot create new sales orders, quotes, or layaways. **"If the `Automated and Manual POS Numbers` setting is set to manually assign order numbers, this setting cannot be unchecked."** |
| `Alternate Tax ID` | Display | Alternate Tax ID used with the Alternate Tax Interface to **Vertex®**, based on the location's address and zip. |
| `Alternate Tax Interface` | Enum (see below) | How this location's transactions interact with the alternate tax interface. Applies to sales orders, returns, exchanges, quick sales, adjust dollars on a completed order, and service orders; **"The location used is based on the selling location."** |

**Alert enums (used by `Variance Exceeded Alert`, `Selling Price is Below Cost`, `Minimum Gross Profit Not Met`):**
- `Use Point of Sale Control Settings` — defer to POS Control Settings. **"If a Price Variance % is not entered for the location, you must select this option and also leave the Reason Required check box blank. If you enter a Price Variance %, you cannot use this option."**
- `Do Not Alert` — no check, no exception.
- `List on Exception Report` — creates an exception listed on exception reports.
- `Warning Message` — warning plus an exception.
- `Security Override Required` — **"requires a security password to override the warning message. The system creates an exception and notes the user who authorized the override."**
- (`Minimum Gross Profit Not Met` only) `Override Reason Required` — a reason for the override must be indicated.

**`Alternate Tax Interface` enum:**
- `Use Alternate Tax Interface` (**default**)
- `Use STORIS Sales Tax and Report to ATI` — **"currently only available for Avalara."**
- `Use STORIS Sales Tax and don't Report to ATI` — **"The user is responsible for reporting to the ATI."** Avalara only.
- **Returns/exchange-return/credit-adjustment rule: "the original order is used to check whether or not the order exists in the Avalara database… If yes, the amount reported in the Avalara database is used; otherwise, the STORIS amount is used."**

---

#### Inventory & Logistics page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Location Tracked` | Checkbox | Track inventory at storage-location level. **"This option is available only during the initial creation of the warehouse/store."** Requires Location Tracking enabled in Inventory Control Settings. Once on, **"when you receive inventory into that warehouse/store, the system requires you specify a storage location for the received goods."** |
| `Verified` | Display-only | Checked when at least one storage location has been built via `VEND-079`. **"STORIS sets this field automatically - it is never active."** |
| `Invisible Location` | Checkbox | **(LOCKED - STORIS access ONLY!)** Auto-assigns merchandise on receipt/physical inventory to a **virtual storage location associated with the product's Group**. **"Use this field for cycle count and physical inventory purposes only."** Typically stores only. |
| `Third Party AWM Active` | Checkbox | **(LOCKED - STORIS access ONLY!)** Activates the WMS Interface. |
| `Deliveries` / `Transfers` / `Customer Pickups` (Priority Picking Active) | Checkboxes | Order types using priority picking. **Active only when `Location Tracked` and `Verified` are both checked.** **"If you mark a location for priority picking, the system excludes existing pieces in the storage location from priority picking."** |
| `Receiving` (Default Storage Locations) | Location code | Where merchandise is first stocked during receiving and transfer processing, **prior to counting and checking for damages (for example, `DOCK`)**. |
| `Return Pickup` | Location code | Default location for merchandise returned via regular pick-up customer returns, exchange deliveries, and/or exchange customer pick-ups. **Location-tracked only.** |
| `Drop Off` | Location code | Default location for **drop-off customer returns** or **'taken' exchanges**. Location-tracked only. |
| `Service/Repair` | Location code | Default service storage location. Location-tracked only. |
| `Repossessed` | Location code | Default storage location for repossessed items. **Blank ⇒ the `Drop Off` location is used.** Active only for location-tracked locations **and** if Revolving Receivables is active. |
| `Ship From Location` (Delivery Locations) | Radio: **`Use POS Control Settings`, `Selling`, `Use Zip Code Fulfillment Location`, `Specific Location`** | Default ship location for new delivery sales orders and exchanges. |
| `Delivery Stock Location` | Radio: **`Use POS Control Settings` (default), `Delivery Ship From`, `Same as Selling Store`, `Use Zip Code Delivery Stock Location`, `Specific Location`** | **"While `Use Zip Code Delivery Stock Location` is an option within the location radio groups, it is not currently available. If selected, a warning message is displayed."** |
| `Pickup Location` | Radio: **`Use POS Control Settings`, `Selling`, `Delivery Ship From`, `No Default`, `Use Zip Code Pickup Fulfillment Location`, `Specific Location`** | Default pickup location. **"If the Pickup Location is not assigned, the `Normal Fulfillment Location` within Individual Zip Codes is used."** |
| `Stock Location` (Customer Pickup) | Radio: **`Use POS Control Settings` (default), `Customer Pickup Location`, `Same as Selling Store`, `Zip Code Pickup Stock Location`, `Specific Location`** | **`Zip Code Pickup Stock Location` "is not currently available. If selected, a warning message is displayed."** |
| `Interface` (Third Party Mapping Software) | Enum: **`None`, `RouteView®`, `ArcLogistics®`, `UPS Roadnet®`, `STORIS`, `Advanced Dispatch Track`** | `STORIS` = an API route mapping service such as **DispatchTrack®** (also legacy DispatchTrack); `Advanced Dispatch Track` = the licensed version. |
| `Delivery Active` / `Customer Pickup Active` / `Transfer Active` / `Service Orders - In-Home Active` | Checkboxes | **At least one must be selected if a mapping provider is chosen.** `Customer Pickup Active` **only available if `Advanced Dispatch Track` is selected**. **"For customer pickups, no information is returned to STORIS."** |
| `Allow Parcel Routes` | Checkbox | Allow `Parcel Only` fulfillment routes to be sent to third-party mapping companies. **Delivery fulfillments only.** |
| `Dispatch Track Default Account` | Text, **up to 20 alphanumeric, no spaces or special characters** | **"When using Advanced Dispatch Track, this field is active and required."** The location entered **need not match the current location**. |
| `Dispatch Track Customer Pickup Account` | Text | Active only with Advanced Dispatch Track. |
| `Release Past Delivery Date - Times` | Integer (days) | Days past the delivery date merchandise stays reserved before **Auto Stock Release** returns it to inventory. |
| `Release Past Pickup Date - Times` | Integer (days) | As above, for pickups. |
| `Delivery Postponements - Times` | Integer (count) | Number of allowed postponements before Auto Stock Release frees the reservation. |
| `Pickup Postponements - Times` | Integer (count) | As above, for pickups. |
| `Restrict Scheduled Date` | Integer **1–999**, or null | How far into the future an order can be scheduled: **scheduled delivery date ≤ current date + this value**, overridable by security. |
| `Transfer Route` | Route code(s) | Default route when creating transfers **to** this location. **Blank ⇒ the `Transfer Route Code` in the zip code record for this location; if still not found, manual entry into the transfer manifest is required.** |
| `As-Is Transfer Reason` | Reason code | For transfers with `Type` = `Move to As-Is`: **"enter a reason code here, it defaults there *and you cannot edit it*"**; blank ⇒ none defaults and you must enter one manually. |
| `Schedule Deliveries` (Third Party Fulfillment Scheduling) | Checkbox | Allows 3PLs to call the **`Get Order Fulfillments for Scheduling`** and **`Schedule Order Fulfillment Date`** web-service APIs for this location. **"As long as the date is in the past, the date is updated."** |
| `Formation - Include as Reserved` | Inventory formation | Products in this formation are **always designated as reserved no matter the reservation status**. **Only one formation per location.** |
| `Formation - Exclude from Scheduling` | Inventory formation | Products always excluded from being sent to a third-party fulfillment API. **One formation per location.** Requires `Schedule Deliveries Using a Third Party` licensed and active. |
| `Customer Service Location` | Location code | Service location for service orders originating here. **Resolution: customer zip code file → normal shipping location → the `Customer Service Location` for that shipping location. Blank ⇒ `Service Warehouse` in Region Settings ⇒ default in Service Control Settings.** |
| `Service Order Stock Location` | Location code | Default stocking location for service parts; **only available when `Customer Service Location` is defined.** |
| `Alternate Stock Location` | Location code(s) | Fallback stock source. **"if also using a Stock Location Schema, this Alternate Stock Location must be included in the Stock Location Schema."** Multiple allowed (ellipsis shown); may be selected via Region/District/Location List. **"ATP must be enabled for this action to be active"** — specifically one or more of `Include in ATP Calculation - Include New Purchase Orders` / `- Include Stock Transfers` / `- Include Unlinked Purchase Orders` in POS Control Settings. **"If more than one alternate stock location is assigned, the one with the earliest ATP date is chosen. If more than one location has the earliest ATP date, STORIS chooses the location based on the order of the locations in the Multiple Location Selection process."** |
| `Prefer Purchase Order Over Schema _ Days` | Integer **1–99**, or null | **If a sales order line can be filled by an incoming PO scheduled within this many days, no transfers are automatically created.** "The incoming purchase order must have enough quantity remaining after all order lines ahead of the current line in the inventory reservation queue are accounted for." **Null ⇒ incoming POs are not considered. Requires `Prefer Incoming Purchase Orders Before Stock Location Schema` in Point of Sale Control Settings to be checked — "If that setting is not enabled, the functionality is not active, even if this field is populated with a value."** |
| `Formation - Exclude from Alternate Stock Location` | Inventory formation | Products in the formation are excluded when sales orders/exchanges look at Alternate Stock Locations. |
| `Include Fulfillments with Reserved Auto-Transfers on Manifest _ Days` | Integer **0–9**, or null | **"Fulfillments are only added to the delivery manifest if the linked auto transfer is on a manifest. The number entered in this field plus (+) the transfer date must be the same or earlier than the date on the sales order… regardless of merchandise being reserved or not."** **Null ⇒ the order must have a minimum of 1 item reserved to qualify.** |
| `Include Transfers with Linked Transfers on Manifest` | Integer **0–9** | Includes linked transfers on a manifest when the linked transfer's scheduled date ≤ initial transfer date + this value. **Null ⇒ the linked transfer must have merchandise reserved.** |
| `Ignore Stock Schema at Alternate Location` | Checkbox, **unchecked by default** | If the Alternate Stock Location has a stock schema, it is not used. |

**Actions (Inventory & Logistics):** `Picking By Zone Assignment Window` (**available only for locations that are both location-tracked and verified**), `Stock Location Schema` (`VEND-071`), `Transfer Security`, **`WMS Product Load`** (generates WMS postings for all eligible product records; **only for locations with Third Party AWM active**).

**Third Party AWM activation constraints (all hard):**
- Counts active WMS locations against the account maximum; **exceeding it blocks the check-box.**
- **"If you check this box, ensure that the `Flag P/O Printed` field in the EDI Control Settings is also checked."**
- **Inactive if `Location Tracked` or `Invisible Location` are checked, or if the warehouse is designated as a Store.**
- **"If the `Location Tracked` or `Invisible Location` fields have already been checked, STORIS must run a utility to reset the warehouse location and all associated files and records to Non-Location Tracked before you can activate WMS for this location."**
- **Cannot be active if `DELIVERY DATES - Allow multiple on order line` on the Logistics tab of Point of Sale Control Settings is checked.**

**`Alternate Stock Location` worked cases (verbatim from the article, store `101`, alternate `88`, schema `66` + `88`):**
1. Schema provides the product — order qty 5 FHR1, store 101 has 0, warehouse 66 has 5 ⇒ **schema used, qty 5 moved 66→101.**
2. Alternate creates demand — 101/88/66 all 0 ⇒ **stocking location changes to 88 with an auto transfer 88→101, 0 reserved, using Alternate Stock Location.**
3. Schema provides the shortfall — 101 has 2, 88 has 3 ⇒ **line 1 reserved 2 from 101; line 2 qty 3 auto transfer 88→101 with 3 reserved, using Stock Schema.**
4. Alternate provides the shortfall — 101 has 2, 88 and 66 have 0 ⇒ **line 1 reserved 2; line 2 qty 3 auto transfer 88→101 with 0 reserved, using Alternate Stock Location.**
5. Alternate used for the whole line — 101 and 88 have 0, 66 has 2 ⇒ **"Schema is reviewed, however location 66 does not have enough quantity to fill the line in full"** ⇒ stocking location changes to 88, auto transfer 88→101, 0 reserved.
- ⇒ **The schema is all-or-nothing per line: a partial-capable schema location is skipped entirely in favour of the alternate.** Hard, surprising, and worth deliberately changing.

---

#### Credit Card page

| Field | Type | Purpose / business rule |
|---|---|---|
| `EMV Enabled - NextGen` | Checkbox | Enables EMV NextGen credit card processing. **"this field is specific to CXM."** |
| `Allow Manual Entry of EMV Credit Card Number` | Checkbox, **checked by default** | Unchecked ⇒ **"each manual entry of an EMV credit card must be overridden."** **"This setting only applies to Shift4 processing."** |
| `Signature Capture` | Checkbox | Enables Signature Capture; signatures viewable in **View Customer Signatures**. **"The Signature Capture feature must first be installed and activated on your system by STORIS personnel."** |
| `Enable VISA Rules for Payment of Extended Receivables` | Checkbox | **"VISA rules prevent you from accepting an interest incurring credit card as payment on installment and revolving transactions (i.e. interest incurring debts). You can, however, use VISA debit cards for these types of payments."** **Requires Shift4 and this location EMV enabled.** |
| `Allow OBP Payments` | Checkbox, **unchecked by default** | Allows this store to be where payments to a customer's account are posted; **"The customer's account must reside at this store location."** **Unchecked ⇒ online payments are posted to the web store.** Requires `Use Customer Home Store for OBP` in eSTORIS Control Settings, a Shift4 eCommerce Location Authorization per home store, and **Token Sharing enabled at Shift4 Payment Card and Device Settings for each merchant location.** |
| `Enable Credit Card Fraud Analysis` | Checkbox, **unchecked by default** | Uses the Fraud Analysis vendor in General System Control Settings. **"This setting may only be utilized for account level locations, individual (store level) locations can not select different Fraud Analysis vendors."** |
| `EMV Provider` | Enum: **`Shift 4`, `Tender Retail`, `Credit Card Gateway`, `None`** | `None` if online credit card processing is not used. |
| `Print Merchant Receipt` | Enum: **`Always`, `Never`, `Use Payment Card and Device Setting` (default)** | **`Never` ⇒ no merchant copy if (1) an electronic signature was captured for a card-present transaction, or (2) the card was not present. "However, if the card is present and no electronic signature is captured, a merchant copy is printed."** |
| `Print Customer Receipt` | Enum: **`Always`, `Never`, `Use Payment Card and Device Setting` (default)** | **`Never` ⇒ no customer copy regardless of `Always Print Customer Receipt` in Payment Card and Device Settings.** |

- **Precedence rule for both receipt settings: "This setting takes precedence over [the] `Always Print … Receipt` setting in Payment Card and Device Settings."** With worked examples both ways.
- **"This setting does not apply when reprinting. If reprinting, both the merchant and customer copy prints."**
- **Online Bill Pay minimum-payment rules (eSTORIS 43.1+): "The minimum payment accepted for Online Bill Pay is never less than the contracted amount. If the payoff amount is less than the contracted amount, that amount must be paid in full. If there is a late charge, it is added to the minimum payment. Payment greater than the contracted amount is accepted but, any amount greater than the payoff amount is not accepted."**

**Actions (Credit Card):** `Shift4 eCommerce Location Authorization` (`VEND-067`), `Shift4 Location Authorization` (`VEND-066`), `Shift4 Extended Receivables Location Authorization` (`VEND-068`), `Shift4 Extended Receivables MOTO Authorization` (`VEND-069`).

---

#### Checks page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Electronic Check Conversion Merchant` | Merchant ID | **Active only if you have purchased the Electronic Check Authorization interface.** Conversion transactions: **"the check is electronically processed, funds are immediately debited to the customer's checking account, and the check is returned to the customer."** Must exist in **Electronic Merchant Settings**. |
| `Electronic Check Guarantee Merchant` | Merchant ID | Guarantee transactions: **"an authorization (only) is requested when electronically processing the check. No withdrawal of funds occurs and the check is retained for deposit by the retailer."** Must exist in Electronic Merchant Settings. |

---

#### Online Finance page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Transmit Application On Line` | Checkbox | Electronic transmission of finance credit applications active at this location. |
| `Finance Application Manager` | Checkbox | Checked ⇒ Finance Application Management process; blank ⇒ FR Application Queue process. **"if you need to turn off the manager for a location, all open applications (not approved/declined/closed) must be submitted or closed before you can turn off the application manager."** |
| `Preferred Finance Provider` | Code, optional | Primary default when prompted for Finance Provider at this location. |
| `Option 1, 2, 3` (Finance Payment Estimator Defaults) | Plan codes | Defaults shown in the Finance Payment Estimator. **"When one or more defaults are set here, all three financing defaults are carried into the Finance Payment Estimator. If a non-valid plan (i.e. the plan has expired) is defined here, a warning message appears."** Blank ⇒ Financing Control Settings defaults are used, including their `Allow Changes` settings. |
| `Allow Changes` | Checkboxes | Checked ⇒ the option displays as a drop-down of all available finance plans; unchecked ⇒ **a static, inactive field**. Combinable in any pattern. |
| `Provider Filter` | Code, optional | Restricts the `Merchant Number` search list to that provider's merchants. |
| `Merchant Number` | Code | **"Only one merchant number can be entered per finance provider, but the same merchant can be assigned to multiple warehouse/store locations."** Grid lists `Merchant Number`, `Description`, `Provider`; double-click + `Remove` deletes a line. |

---

#### Barcode page

**Active only if Inventory Barcode is active on the system.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Activate at this Location` (Batch Barcode) | Checkbox | Batch Bar Code at this location. |
| `RF BARCODE - Activate at this Location` | Checkbox | **(Locked field – STORIS update only!)** |
| `RF Picking - Activate at this Location` | Checkbox | **(Locked field – STORIS update only!)** |
| `Picking Method` | Enum: **`Oldest First`, `Minimize Picks`, `Reclaim Storage`** | See rules. |
| `Picking Sequence 1–4 (NN,NN)` | Start,length pairs | Same mechanism as `VEND-074` Storage Location Sort Sequence. |
| `Alternate Pick Sequence` | Checkbox | Reverses the second pick sort in alternate aisles so pickers serpentine. **"You cannot enable this setting if the `RF PHYSICAL COUNT` setting on this screen is enabled."** |
| `Customer Pickups by Order` | Checkbox | Checked ⇒ pick by order number; blank ⇒ pick by aisle (pickers prompted for a start location and pick the first order found there). |
| `Customer Deliveries by Route` | Checkbox | Pick delivery orders by assigned route/truck code. Blank ⇒ pick by aisle. **"if AWM is active and the user has multiple routes on their schedule, the process picks all items for all the routes on that picker's schedule."** |
| `Merchandise Transfers by Route` | Checkbox | **"This box must be checked in order to enable the `RF PICKING - Merchandise Transfers by Final Route` setting."** Checked alone ⇒ pickers enter the Truck/Route and pick transfers originating from locations on that route; both checked ⇒ an extra prompt for a single destination route or all "transfer-to routes". |
| `Pick Transfers by Final Order` | Checkbox | Requires `Merchandise Transfers by Route`. See rules. |
| `Pick Deliveries by Order Number` | Checkbox, **blank = default** | For locations picking deliveries by route. |
| `Drop off All into Staging` | Checkbox | Orders set to drop to staging are dropped in one group when the staging label is scanned; otherwise prompted individually. |
| `Limit One Picker to an Aisle` | Checkbox | **"all picking processes reference this field, including deliveries, customer pickups, and transfers."** Active only if RF Picking is active. **"To remove locks from aisles, use the `Remove Locked Aisles (Radio Frequency)` routine."** |
| `Transfers` / `Pickup` / `Delivery` (Interim Areas) | Free text | Text displayed on the RF scanner directing users to the recommended interim area. |
| `Drop off Transfers to Interim` / `… Customer Pickups to Interim` / `… Customer Deliveries to Interim` | Checkboxes, **default not checked** | Merchandise moves from picking to an interim location before prep/staging. |
| `Drop off All into Interim` | Checkbox | Checked ⇒ scanning an interim area label moves **all** picked pieces there regardless of the Float setting. Blank + no Floats ⇒ scan the interim label **and each piece label**. Blank + Floats ⇒ scan the interim label **and the float label**. |
| `Activate Float feature for this location` | Checkbox, **default not checked** | **"You must also check the box for at least one of the 'drop off...to interim' settings for this location."** RF user scans the float label before picking; at completion scans the destination location to move all merchandise and **maintain the link between the scanned pieces and the float**. |
| `Transfers` / `Pickup` / `Delivery` (Prep Areas) | Open text | The storage location where merchandise is dropped and "prepped". **"This is an open text field that displays on the scanner, but you must scan a valid location label that is set up within your warehouse."** |
| `Drop off Transfers to Prep` / `… Customer Pickups to Prep` / `… Customer Deliveries to Prep` | Checkboxes | Checked ⇒ dropped into `PREP`; **blank ⇒ automatically picked and dropped into the `STAGE` location.** |
| `Drop off All into Prep` | Checkbox | Group drop-off when the Prep location label is scanned. |
| `Automatically Print for Customer Deliveries` / `… Pickups` / `… Transfers` (Prep Labels) | Checkboxes | Generate prep labels automatically from the RF drop-off process. **"If you check the box at this field to automatically print prep labels, the only print output method available is the zebra printer."** |
| `Advanced Warehouse Management Active at this Location` | Checkbox | **"the system checks to ensure that the maximum number of location licenses has not been exceeded."** |
| `Activate Directed Putaways (by Volume)` | Checkbox, **default unchecked** | Requires AWM active at this location, and **"the number of directed put-away sites activated on your account cannot exceed the number of `AWM Putaway Sites` in your General System Control Settings."** Blank ⇒ manual put-away. |
| `Activate Temporary Shutdown` | Checkbox | **"shut down AWM temporarily… you can continue operating the warehouse without AWM until this setting is enabled again."** |
| `Use Logistical Carton Quantity for Directed Putaway` | Checkbox | **Exact formula: volume ÷ `Logistical Carton Quantity` (Advanced Product Settings, Settings page). "if the volume of a product is 10 X 2 X 10, the total volume used… is 200. However, if the Logistical Carton Quantity for the product is set to 4, the total volume used… is 50."** |
| `Putaway Bin Fill Options` | Enum: **`Maximize Space`, `Minimize Trips`** | `Maximize Space` ⇒ fill bins to capacity even if the product must be split across multiple destinations. `Minimize Trips` ⇒ allocate at the first location where the entire quantity fits; **"If no storage location has the capacity to fit the merchandise, a second pass allocates the merchandise using the concept of the Maximize Space option."** |
| `Active for RF Users at a Store Location` (RF Physical Count) | Checkbox | **"if a check appears at either the `Location Tracked` or `Invisible Location` fields on the Inventory & Logistics tab, the system does not allow you to enable this setting."** |
| `Use Area Prompt for Invisible Locator Locations` | Checkbox | Invisible-locator locations only; the RF Physical scanner shows an **Area** prompt first. |
| `Use STORIS label as UPC` | Checkbox | Checked ⇒ counts treat STORIS labels as UPC labels and require the total count of any product scanned in the location. Blank ⇒ scan individual product labels. **"not applicable when scanning a STORIS label for As-Is, special order, or serial tracked products."** **"If your user security settings allow you to recount storage locations, this setting must also be checked for the location where you are performing the cycle count/physical inventory."** |
| `Select All Locations for Cycle Count Locations` | Checkbox | Auto-populates the Barcode Storage Location Selection grid and Bar Code Physical Batch Maintenance with all storage locations. |
| `Segregate Cross Dock Linked Transfers` | Checkbox | RF transfer receiving separates merchandise on transfers linked to sales orders (auto-transfers) or transfers (multi-leg) from unlinked merchandise; shows the **Crossdock Transfer Receiving** screen. **"if you enable this field and have specified a drop-off location, that location is only enforced in standard transfer receiving."** |
| `Cross Dock Order Days` | Numeric **1–99**, **zero not allowed** | Orders whose delivery date is this many days away are included in the cross-dock location calculation. **Blank ⇒ orders are not included.** **Exported to Data Warehouse.** |
| `Cross Dock Transfer Days` | Numeric **1–99**, **zero not allowed** | As above, for transfers. **Exported to Data Warehouse.** |
| `Match Transfer Receiving Labels` | Checkbox, **unchecked by default** | See rules. |
| `Stock Label Form` / `Accessory Label Form` / `Multi-Carton Form` / `Cross Dock Form` / `Cross Dock Multi-Carton Form` (Default Label Forms → Product Label) | Form types, **`None` by default** | Defaults used in floor-tag print processes; **they override user preferences**. Select `None` to preserve user preferences. |
| `Hang Tag Form` / `Hang Tag As-Is Form` / `Hang Tag Kit Form` / `Hang Tag Kit As-Is Form` (Barcode, and again under Standard) | Form types, `None` by default | Two parallel sets — one under **Barcode**, one under **Standard**. |
| `Stock Lookup Location` | Location(s) | Locations whose available and as-is quantities the **RF Stock Lookup** process displays. |
| `Create Floor Sample Label Queue on Product Change` | Checkbox | Changes to a product's **description, selling price, retail price, or product benefits** are captured by the scheduled process **`Move Captured Data for Event Detection`**; matching floor-sample inventory is added to the **Label Queue** for reprint via **Print Queued Labels**. |

**Behavior & rules (Barcode page).**
- **`Picking Method` semantics, exact:**
  - **`Oldest First`** — "pick pieces based on **FIFO** so that the oldest inventory is selected first."
  - **`Minimize Picks`** — "optimize picking by minimizing the number of storage locations the picker must visit… the system attempts to locate a storage location with enough quantity to satisfy the entire requirement, or a location with the quantity closest to the total required quantity… picking begins at the storage location with the quantity closest to the total required quantity, and continues to the location with the next lower quantity."
  - **`Reclaim Storage`** — "maximize storage location utilization by giving priority to storage locations with the **least** number of pieces available… the goal is to empty partially filled storage locations, rather than minimize the number of stops."
  - **"If you use the Priority Pick and Picking Zone features, priority locations are picked first."**
- **`Pick Transfers by Final Order` rules, exact:**
  - auto-transfers/multi-leg transfers tied to a sales order ⇒ **the final order is the sales order number**; multiple auto-transfers destined for the same sales order can be picked together.
  - multi-leg transfers whose final destination is a stock transfer ⇒ **the final order is the final stock transfer number**.
  - a stock transfer with no associated transfer ⇒ the final order is the stock transfer number; only that transfer is picked.
  - **"This setting is not suggested when the warehouse is set to permit only one user per aisle. Although this conflict is not prohibited, a warning message is issued."**
- **`Match Transfer Receiving Labels` rules:** unchecked ⇒ **"the process attaches the first matching product in the receiving batch to the label scanned"** (i.e. label→piece association is arbitrary). Checked ⇒ uses the picking cross-reference to bind order item and piece ID to the scanned label; no match ⇒ error and the label is skipped; no picking cross-reference ⇒ assign to the first unscanned piece in the batch, else **"label not found"**. **Applies only to stock labels — not serial-tracked, special-order, bulk, or UPC labels.** **"Validated labels cannot be intermixed with scanned pieces in transfer receiving batches that have already been processed."** Enabling it with open transfers gives: **"To activate Match Transfer Receiving Labels, all RF transfer Receiving must be completed."**
- **Mutual exclusivity (hard): "The `RF Bar Code`, `Batch Bar Code`, and `RF Physical Count` settings are mutually exclusive. That is, when you enable one, you cannot enable the others."**
- **Floats: "If you use Floats, you must check the box for at least one of the following 'drop off...to interim' settings in order to check the box at the 'Activate Float feature' setting."**
- **Interim area definition, exact: "An interim location is defined as the storage location of a piece that has been picked but hasn't been moved to the prep or stage location."**
- **Default Label Forms validation: "The default values for these fields is `'None'` during the initial entry of a warehouse/location. During initial entry, forms are validated; if the form no longer exists, a message is displayed indicating this and the field is set to `'None'`."** Defaults apply to **Print an Inventory Floor Tag, Print a Transfer Floor Tag, Print a Barcode Floor Tag, and Print a Purchase Order Floor Tag**.
- **Batch Bar Code scanning advice (worked example): "you are performing a physical inventory at Store 11, which has a total inventory quantity of 3000 pieces, located in 10 storage locations. If you scan and upload 500 pieces at a time, rather than all 3000 at once, you minimize the amount of data that you would potentially need to re-scan in the event of communication errors."**

**Actions (Barcode):** `Prioritize Special Delivery Picking` (`VEND-050`), **`Drop Off Storage Location Table`** (pre-define drop-off storage locations).

---

#### Purchasing page

> **The vendor/purchasing-relevant page.** "Use this page to indicate an optional location prefix and to establish settings for use with the **Automatic PO Replenishment** feature… The `Replenishment` feature uses this information to determine whether to create purchase orders for stock merchandise, **based on the days of supply defined in the Advanced Vendor Settings**."

| Field | Type | Purpose / business rule |
|---|---|---|
| `Location Prefix` | Text, **up to four characters**, optional | Prefix added to the PO number for POs created for this location. |
| `PO Receiving Location` | Location code | **"This field can be used only with locations that are set as `'store'` location types."** The receiving location for which a PO should be created for deliveries and pickups. |
| `Replenishment Location` | Store code(s) | Stores this warehouse replenishes. `Add` per selection, then `Save`. |

**Behavior & rules.**
- **`Location Prefix` requires `NUMBERING - Add Location Prefix to the Purchase Order Number` in Purchasing Control Settings to be checked**, and **"You can use this prefix feature only when you auto-assign purchase order numbers. (The `Next Purchase Order Number` field in Purchasing Control Settings must contain a value.)"**
- **With manual PO entry also allowed (`Allow Manual Entry`), the prefix applies "only for new PO's that are auto-numbered and it only prefixes the purchase order based on the default location specified in the `Receive At` prompt on the PO."**
- **Hard rule: "if you use the prefix feature and also allow manual entry of PO numbers, once you auto-assign a new PO number that includes the location prefix, the PO number cannot be changed by selecting a different `Receive At` location."**
- **`PO Receiving Location` logic, exact:** "When creating a purchase order from `Enter a Sales Order` or `Enter an Exchange`, the process checks this setting to determine the line's stock location. **If the ship and stock locations are the same, and there is a location in this field, the purchase order is created for the location specified here. The stock location for the line item is changed to the location in this setting and any auto transfers that are needed are created.** If this field is left blank for a line's stock location or the stock location is different than the ship location, the purchase order is created based on the line's stock location. **If you change the stock location manually so that it is different than the ship location, this setting is not used.**"
- **The replenishment location list feeds written-quantity determination** (subject to Purchasing Control Settings) and Automatic PO Replenishment's days-of-supply logic from **Advanced Vendor Settings**.

---

#### Miscellaneous page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Cycle Report Form` | Form number | Form used when cycle (day-ending and month-ending) reports are generated at this location. |
| `Valid Printer Zones` | Printer zone(s) | Printer zones assigned to this location. |
| `Digital Receipts Enabled` | Checkbox, **unchecked by default** | **flexEngage** enabled for this logon location. **"This setting is only used for emailing sales/service documents. This setting does not pertain to Digital Direct Shipping Notification; for this, select the `'Use Digital'` option from the `Tracking Number Notification` setting in EDI Control Settings."** |
| `Language` (Document Language) | Enum: **`English` (default), `Spanish`, `French`, `Alternate`** | Language for printed documents associated with this location. |
| `Print Multi-Lingual POS Documents` | Checkbox | Whether the **Select Printable Language** window (`VEND-062`) appears. **"applies only when printing via Enhanced Laser Printing and if your STORIS account has multiple languages active."** |
| `Always Print in Default Language` | Checkbox | Always use the location's default language rather than the user's. |
| `Number` (Franchise Information) | Text, **up to 10 alphanumeric**, optional | **"If you enter a franchise number here, you indicate that this location is dealer-operated. For corporation locations, leave this field blank."** Active only if franchises exist. |
| `Changeover Date` | Date | Date the franchise number was entered/edited, or the date the location reverted to corporate. **Mandatory if `Number` is populated; updates automatically on edit; defaults to the system date.** **"If a changeover date exists but the `Number` field is blank, then the location was previously a franchise but is now a corporate location."** |
| `Locations` (User Accessibility) | Location list | Locations employees signing on here may access. **"The system references this list when a location list has not been specified in the user settings."** |
| `Lists` | Display / multi-select | Location lists that include the current location. **Ellipsis (…) if multiple; Action ⇒ Multiple List Selection.** Users with that list as their **Global Location List** or **Location List** can access this warehouse/store in Sales Entry, Sales View/Report, Inventory Entry and/or Inventory View/Report. |
| `STORIS Mail ID` | User ID | Recipient of STORIS Messenger emails — e.g. **when a special-order product is received into inventory or a back-order is filled** at this location. |
| `From Email Address` | Email | Sender address on emails generated while printing sales documents. **Blank ⇒ the "from" address in Notifications Control Settings.** |
| `Inactive Auto Distributed Transfer Calculation` | Checkbox | **"the auto-distributed transfer calculation ignores the sales history of this location and instead substitutes the average sales amount of all active locations… useful for stores with no sales in the previous 12 months such as new stores or inactive stores."** |
| `Use Warehouse Inventory Price` | Checkbox | **"alters the pricing hierarchy of the pricing rules to use the warehouse inventory price ahead of the promotional price."** |
| `Automated and Manual POS Numbers` | Checkbox | Allows both system-generated and manually entered order numbers. **Requires `Next Transaction Number` in Point of Sale Control Settings to have a value. "This setting has no affect on the numbering of auto-transfers."** If blank, entering a completed or voided order number prompts to view it read-only (applies to Enter a Sales Order, Enter an Exchange, Enter a Return, Enter a Service Order). |
| `Prohibit Customer Personal Information when not Required by Sale` | Checkbox, **unchecked by default** | **STORIS-LOCKED FIELD.** Sales orders meeting certain criteria **"automatically generate a new customer that only requires the customer's name."** |
| `Enable Document Signature Capture and Document Archive` | Checkbox, **default unchecked** | **"This must be checked for the user's logon location."** Modules live on the **Licensing tab of General System Control Settings**. |
| `Enable Signatures on Tethered/Mobile Devices` | Checkbox, **default unchecked** | Requires `Enable Document Signature Capture and Document Archive`. **Must be checked for the user's logon location.** |

**Document-language behavior (exact).** The system identifies the location at which an activity was performed and uses that location's language:
- **sales orders — the sale location**
- **purchase orders — the receiving location**
- **service orders — the `Store Location` field on the service order**
- **customer statements — the customer's location in the Customer Settings**
- **"This field affects only document data and not document headings and labels."** Forms Designer can supply translated templates; **"if not using the Forms Designer, your headings and labels will not be translated, and results can be unpredictable."**
- **"The User file does not affect the language of printed documents, with the exception of AP checks."**

**Relationship table between `Print Multi-Lingual POS Documents` and `Always Print in Default Language` (verbatim):**

| Print Multi-Lingual POS Documents | Always Print in Default Language | Behavior |
|---|---|---|
| Not checked | Not checked | Directly prints document in the **user's** default language. |
| Checked | Not checked | Displays Select Printable Language screen with the **user's** default language selected and in first row. |
| Not checked | Checked | Directly prints document in the **location's** default language. |
| Checked | Checked | Displays Select Printable Language screen with the **location's** default language selected and in first row. |

**Actions (Miscellaneous):** `Podium Settings` (`VEND-049`), `STORIS RMI Settings`.

---

#### Replenishment page

"Sets up the **Automatic Stock Replenishment for Locations** process, which generates transfers of stock products that have fallen below the user-defined stock level established in the **Warehouse Inventory Settings** file (`VEND-091`)."

| Field | Type | Purpose / business rule |
|---|---|---|
| `First` / `Second` / `Third` / `Fourth` / `Fifth` (Replenishment Warehouse) | Location codes | Checked in order for replenishment stock. **`First` is mandatory if using Auto Stock Replenishment.** **Every one must be a warehouse-type location at the `Location Type` field on the General tab.** |
| `Next Available Date` | Checkbox | Transfer dates selected by route availability rather than fixed weekdays. |
| `Sunday`–`Saturday` | Checkboxes | Days on which auto stock transfers are scheduled. |

**Behavior & rules.**
- **Requires `Replenishment Active` for Stores and/or Warehouses on the Replenishment page of Inventory Control Settings.**
- **Override precedence: "If replenishment information is populated, the Primary/Secondary warehouse locations specified are used for replenishment of all products from the warehouse/store, *except products belonging to a product group or product category that has replenishment locations specified. Replenishment information at those levels overrides settings on this page.*"** (Compare `VEND-058`, which adds the region tier below this.)
- **`Next Available Date` and the days-of-week checkboxes are mutually exclusive.**
- **Transfer-date formula, exact: "The transfer date is determined by adding the `Auto Schedule Days` (Inventory tab of Point of Sale Control Settings) to the current date, and then a check is performed for the next available day of the week based on the days checked on this screen."** The **Generate Daily Reports (EOD)** process reviews stock quantities and schedules the transfers; **`Replenish Assigned Stock Levels`** generates them on demand.
- **Five tiers here versus three (Primary/Secondary/Tertiary) in Region Settings (`VEND-058`) — inconsistent depth between the two screens.**

---

#### Credit Application page

**Active only if the Credit Application Module is active on the system.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Credit Bureau Module Active` | Checkbox | Activates the Credit Application Module for this location. |
| `Preferred Credit Bureau` | Enum: **`None`, `Equifax`, `Equifax Canada`, `Experian`, `TransUnion`, `Interconnect`** | **`None` ⇒ the `Primary Credit Bureau` in Credit Application Control Settings is used.** Active only if the add-on module is active and one or more bureaus are defined. |
| `Skip Credit Bureau Transmission` | Checkbox | **"the credit request goes directly to the Credit Request Review process following entry of the credit application and the system does not associate a credit bureau with the credit request."** **"If you experience technical difficulties communicating with a credit bureau, you can check the box at this field to avoid holding up the entire process."** |
| `Experian` / `Equifax` / `Trans Union` / `Interconnect` (Bureau Member Number) | Member numbers | Per-location member numbers. **Blank ⇒ the Member Number from Credit Bureau Settings.** `Interconnect` is the **eID Verifier Software provider**. |

---

#### Revolving page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Use Warehouse/Store Location Remit-To Address` | Checkbox | Use the address below as the remit-to on revolving statements for this location. **Checking it activates the address fields.** |
| `Address Line 1` / `Address Line 2` / `Zip/Postal Code` / `City/Town` / `State/Province` | Text | City/town and state/province default from the zip/postal code. |
| `Option 1, 2, 3` (Revolving Payment Estimator Defaults) | Plan codes | Default plans in the Revolving Payment Estimator. **"Default Option settings in Warehouse/Store Location Settings, if any, take precedence over the global control settings"** (Revolving Receivables Control Settings). |
| `Allow Changes` | Checkboxes | Checked ⇒ the defaulted plan can be changed in the estimator; blank ⇒ it defaults but cannot be changed. |

---

#### User Defined Settings page

- Displays settings whose **`Source` field is set to `Location Settings`** in User Defined Settings. **"This page is inactive if no prompts are set in User Defined Settings."**
- **`Setting`** column = the `Prompt Text`; **`Response`** column = free entry validated against `Data Format` and `Maximum Entry Length` when no `Valid Response` list exists; **`Select`** button appears when eligible responses have been specified in `Valid Response`, limiting the user to one of those or none per the `Mandatory` setting.
- **"Validation for mandatory settings is performed when the `Save` button is clicked."**

---

**Dependencies.** Effectively everything in this part. Directly: `VEND-049` (Podium), `VEND-050` (Prioritize Special Delivery Picking), `VEND-056`/`VEND-057`/`VEND-094` (receiving), `VEND-058` (Region), `VEND-062` (Select Printable Language), `VEND-063`/`VEND-073`/`VEND-077`/`VEND-078`/`VEND-079` (storage locations), `VEND-066`–`VEND-069` (Shift4), `VEND-071` (Stock Location Schema), `VEND-081` (zip codes), `VEND-091` (Warehouse Inventory Settings), `VEND-092` (Warehouse Mapping Paths). Also: General System Control Settings (licensing, **Extended Security kill-switch**), Point of Sale Control Settings, Purchasing Control Settings, Inventory Control Settings, EDI Control Settings (`Flag P/O Printed`, `Tracking Number Notification`), Payment Card and Device Settings, Electronic Merchant Settings, Credit Application Control Settings, Revolving Receivables Control Settings, Financing Control Settings, Notifications Control Settings, Service Control Settings, Account Statement Cycling Control Settings, Miscellaneous Fee Settings, Design Enhanced Laser Forms / Forms Designer, Report Builder, Data Warehouse.

**Build notes.**
- **Split this screen.** Twelve unrelated concerns on one record is the root cause of much of the coupling in this pack. Model `location` (identity, address, type, company, region, district) and attach **capability configs** — pricing controls, fulfilment defaults, warehouse/RF config, payment device config, finance config, credit-bureau config — each independently versioned and permissioned.
- **Immutable-at-creation fields (`Location Type`, `Location Tracked`) must not be immutable in our system.** STORIS requires a vendor-run utility to undo `Location Tracked`. Support migration.
- **"Locations cannot be closed" is not acceptable.** Build a real lifecycle: `active` / `closing` / `closed`, with rules about what can still post.
- **Reproduce the fulfilment-location resolution radio groups as an explicit resolver chain**, and drop the two options STORIS documents but has not implemented (`Use Zip Code Delivery Stock Location`, `Zip Code Pickup Stock Location`).
- **Fix the schema/alternate all-or-nothing behavior** (Case #5) — a partially-capable schema location should contribute its quantity.
- **The `0` vs blank inversion on `Variance %`** and the `blank = unlimited` convention on capacity fields (`VEND-061`) are the same class of defect: make every such field tri-state and label it.
- **Purchasing page:** the `Location Prefix` immutability rule ("the PO number cannot be changed by selecting a different `Receive At` location") should stay — PO numbers must be stable. The **`PO Receiving Location` auto-transfer creation** is the `PO-060`-adjacent behavior worth copying: a store-originated PO can be routed to a DC with an auto transfer generated in the same step.
- `[DECISION NEEDED]` Do we need franchise/dealer-operated locations? If not, drop the whole Franchise Information block.
- `[DECISION NEEDED]` Credit Application, Revolving, Online Finance — LA Mattress in-house financing scope. These three pages are ~25% of this screen and may be entirely out of scope.

---

### `VEND-094` Warehouse/Store Receiving Settings
*storis_ref: article 15243031440276*

**Purpose.** Maintain a **receiving calendar** per location — which days of the week PO receiving is active, plus dated exceptions — and the location's maximum load count.

**Where it lives.** `Merchandising and Distribution > Settings > Location Settings > Warehouse/Store Receiving Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warehouse/Store Code` | Location code | The location whose receiving calendar is being maintained; Arrow ⇒ Read-Only Lookup Window. |
| `Maximum Number of Loads` | Numeric, **2 digits, 1–99** | Max loads receivable at the location. **"This field should be populated if the Receiving Capacity Settings are defined."** |
| `Monday`–`Sunday` (Days to Receive) | Checkboxes | Checked ⇒ this location receives POs on that weekday. **"When you create a new warehouse location (via Warehouse/Store Location Settings), all seven of these check boxes are checked by default."** |
| `Date` (Exception Dates) | Date | The specific date being excepted. **"The date you indicate at this field cannot be a past date and cannot already be listed in the grid."** |
| `Receive` | Checkbox | **Active only when a `Date` is selected.** Checked ⇒ the location receives POs on that date; blank ⇒ it does not. Then click **`Add`** to update the grid. |

Grid columns: `Date`, `Receive`, `Remove`.

**Behavior & rules.**
- **★ THE CRITICAL CAVEAT, quoted in full: "Important! The settings on this calendar do NOT actually prevent purchase orders from being received on specific days or dates that you indicate are 'closed' to receiving. These settings are used when calculating the projected receipt date of merchandise for the purpose of providing a default scheduled delivery date on purchase orders."** — **the receiving calendar is a forecasting input, not a control. Anyone can receive on a closed day.**
- **Date-rolling rule: "If the date of receipt, regardless of whether it was determined via the ATP web service or the standard hierarchy, falls on a day in which receiving is not scheduled (based on this receiving calendar), the next day that receiving is scheduled to occur is used as the date of receipt."**
- **Exception-date semantics work both directions** — a worked example each way: close a normally-open Monday for **Memorial Day on May 26** (select the date, un-check `Receive`); open a normally-closed Wednesday for **July 6** (un-check the Wednesday box, select July 6, check `Receive`).
- **ATP recalculation warning: "If you have ATP set up, changing the receiving calendar days will require the purchase order supply to be recalculated. A warning message will display when you save your changes. If you select yes, the ATP dates are recalculated when End of Day processing runs, in the meantime ATP dates will not reflect the changes made to the setting. Select No to cancel the update."** (Fourth occurrence of this pattern — see `VEND-055`, `VEND-059`, `VEND-090`.)
- **Grid rows are immutable: "You cannot edit lines once they are added to the grid. Use the `Remove` button to delete a line."**

**Dependencies.** `VEND-056` Receiving Capacity Settings (`Days to Receive` and `Exception Dates` validate capacity dates; `Maximum Number of Loads` is the soft ceiling on `Max Loads`); `VEND-057` Receiving Group Settings; `VEND-093` Warehouse/Store Location Settings (creates the location with all seven days checked); `VEND-084` Vendor EDI Settings (`Receiving Calendar` enum controls whether the ASN date process uses this calendar); ATP web service; `VEND-052` lead-days hierarchy; End of Day processing.

**Build notes.**
- **Make the receiving calendar enforcing, not advisory** — or at minimum raise a confirmed exception when a receipt is posted on a closed day, logged to `RPT-AUDIT`. STORIS's "this doesn't actually stop anything" is a documented gap between what the screen implies and what it does.
- Keep the bidirectional exception-date model (`open on a normally-closed day`, `closed on a normally-open day`); it is the right design.
- **Allow editing of exception rows**; forcing remove-and-re-add is needless friction and loses any comment.
- **Recalculate ATP synchronously.** This is the fourth screen in this part that defers ATP correctness to End of Day; the cumulative effect is that promised dates are routinely stale.
- `[DECISION NEEDED]` Receiving calendars are per location and per weekday only — no per-receiving-group calendar, and no half-day/cutoff-time concept beyond `VEND-057`'s start/end times. Confirm that is sufficient.

---

## Open gaps — status

### ✅ GAP 1 CLOSED (partially): `PO-080` — why POs / AP bills go on hold

The Inventory pack could not determine why POs go on hold. **Two distinct hold mechanisms are documented in this part**, and together they explain the observed behavior:

1. **`Hold Code` — vendor-level blanket hold** (`VEND-087`, Vendor Settings → Payables tab).
   *"If you enter a hold code here, the system assigns the selected hold code to **all newly created AP bills for the vendor**. In addition, **those AP bills are ineligible for payment approval until the hold status is removed**."*
   - Applied at **bill creation**; existing bills are unaffected by adding the code.
   - Release is **manual, per bill**.
   - There is a separate **AP Hold code** lookup table (the enumeration of hold *reasons*) that is **not documented in this section** — **fetch it next.**

2. **`Payable Bill Hold Days` — partial-receipt time-based hold** (`VEND-084`, Vendor EDI Settings).
   *"Prevent AP bill approvals for partially received purchase orders… **If the number of hold days specified here has not been exceeded, the system creates an AP approval only if the entire order has been received. If the number of hold days has been exceeded and the order is not fully received, the system creates a partial payment approval and an exception.** When you receive the remainder of the order, **you must create subsequent partial payment approvals manually**."*
   - Threshold measured **from PO creation/transmission**, but the clock is read from **the vendor's invoice date on the EDI 810**.
   - Recommended to be set to **the vendor's average lead time**.

**Interaction with `PO-102`** (fully-received POs close automatically when approved for payment): **a held bill never reaches approval, so the PO never auto-closes.** That is the mechanism behind POs that appear stuck open. Both hold types must be modelled if `PO-102` is to behave correctly.

**Not yet closed:** the **AP Hold code table itself** (what codes exist, who may release them), and whether a hold can be applied to an *existing* bill. Both live in the Payables documentation, not here.

### ⚠️ GAP 2 PARTIALLY CLOSED: vendor credit reconciliation for RTV

Three pieces found:

- **`VEND-060` Return to Vendor Tax Settings** supplies the AP-side mechanics `RTV-012` was missing: the vendor-credit document is an **AP debit bill**, created **either automatically at `Complete Return-To-Vendor` or later by referencing the RA number**, with tax carried forward from `Create Return-To-Vendor List`. **Known limitation: one GL tax posting per RTV; multi-account allocation requires a manual AP adjustment.**
- **`VEND-087` `Charge-Back Method`** gives the accounting-treatment choice, and it is exactly the reconciliation question:
  - **`D - Payables Credit`** — credits netted as debits against future payable invoices (**no ageing, no expectation tracking**)
  - **`V - Vendor Receivable`** — credits held as **open receivables** (**this is the trackable, ageable model**), used with the **`VR Terms Code`** field and the **Vendor Receivables** module
  - **`R - Report Only`** — reported on the **Vendor Charge-Back Report** only
  - blank ⇒ falls back to `Vendor Chargeback Method` in Service Control Settings
- **`VEND-085` Vendor Rebate Settings** confirms the Vendor Receivables module creates **VR debits** from rebate plans via `Enter a Volume Rebate` — the same ledger family as an expected RTV credit.

**Still not answered:** **nothing in this section describes matching an expected vendor credit against the credit actually received**, nor any ageing/dunning of overdue vendor credits. `V - Vendor Receivable` is the hook, but the reconciliation process itself is documented in the **Vendor Receivables** section, which was not in scope here. **Recommend fetching `Accounting > Vendor Receivables` next — specifically anything named "Vendor Receivable Aging", "Apply Vendor Credit", or "Vendor Charge-Back Report".**

---

## Requested topics NOT found in this section

The assignment asked me to hunt for these. They are **not in section `15242970677780`**, second half. Where I found a pointer, it is noted:

| Requested topic | Status | Pointer found |
|---|---|---|
| **AP bill entry and approval configuration** | Not here | `Select and Approve Bills for Payment` named in `VEND-083` and `VEND-086`; `Enter/Update Individual Vendor Invoice` named in `VEND-087`; `Enter Multiple Vendor Invoices` appears as a related article on `VEND-081`. **All live in Payables.** |
| **Three-way match tolerances (PO vs receipt vs invoice)** | **Does not exist as a tolerance band** | `VEND-084` shows STORIS's actual mechanism: four `Never / Only When Lower / Always` cost-acceptance switches. **There is no percentage or dollar tolerance anywhere.** `COST-040` cost exceptions originate from these switches plus `Payable Bill Hold Days`. |
| **Payment methods and check handling** | **Partially found** | `VEND-086`: `Default Payment Method` (`Printed Check` / `Electronic Funds Transfer` / `Virtual Card`), `Check Print Bank`, EFT formats (`NACHA`, `CPA005`, `CIBC`, `ABA`, `NATIONAL`), Chase Positive Pay. `VEND-087`: `Separate Check per Bill`, `Suppress Invoice Details on Checks`. **The check-run process itself is in Payables.** |
| **Vendor statements** | Not here | No article. |
| **Freight vendors and freight bill configuration** | **Partially found** | `VEND-087` defines a vendor as anyone you write a check to, **explicitly including "delivery companies (freight)"**. `VEND-090` `Freight Amount` sets the default `Total Freight Amount` for **`Receive a Purchase Order with a Separate Freight Bill`** (`RCV-050`). `VEND-070` reveals an **`Import Freight Settings`** menu branch that was not enumerated. **`Import Freight Settings` and `FOB Settings` are the highest-value follow-up fetches for `COST-033` / `RCV-050`–`RCV-054`.** |
| **EDI setup and document types** | **Found** | `VEND-084` (vendor EDI: **810, 850, 855, 856, 860, 865, 315, 214**) and `VEND-075` (3PL EDI: **215, 214**). **No 820 (payment order/remittance) anywhere.** `EDI Control Settings` and `EDI Status Details Settings` are referenced but not in this section. |
| **Drop-ship / direct-ship vendor configuration (`PO-060`)** | **Partially found** | `VEND-087` `Direct Ship Reserved` and `Require Reservation`; `VEND-084` `Prompt 850/860 Submission`; `VEND-093` `PO Receiving Location` (store-originated PO routed to a DC with auto transfers); `VEND-049` `Exclude Direct Ships`. **No dedicated drop-ship vendor screen.** |
| **Vendor performance / scorecard settings** | **Not found — does not appear to exist** | Nothing in the vendor master, EDI settings, or ship-from settings records on-time performance, fill rate, defect rate, or chargeback history. The only vendor-performance-adjacent artefacts are the `POs Eligible for Free Freight` report (`S$AP_FREE_FGHT`) and the `Vendor Charge-Back Report`. **Treat vendor scorecarding as greenfield for LA Mattress.** |

**Scoping note repeated from the top of this file:** only positions **83–90** of this "Vendor Settings" section are genuinely vendor-master articles. The section is mis-titled; the bulk of it is inventory, warehouse, picking, routing and payment-device configuration.

---

## Destructive-reach flags

Following the wave-1 `Allow Transmitted AP Bill Deletion` finding, these are the settings/actions in my range with comparable destructive or divergence-causing reach:

| Ref | Setting / action | Reach |
|---|---|---|
| `VEND-048` | **Picking Zone Assignment Window — blank + Save** | **Mass-clears picking zones on every storage location in the grid**, with no separate verb and no stated confirmation. |
| `VEND-077` | **`Remove All Pieces From Pick` / `Set All Pieces To Priority Pick`** | Rewrites the priority-pick flag on **every piece** in a storage location. **Executes immediately, outside the Save cycle — "the update does not depend on whether or not you click the Save button." No undo.** Confirmation is *skipped* when the location setting already agrees. |
| `VEND-084` | **`Receive Product Automatically with 214`** | **A vendor's EDI message posts inventory receipts with no human in the loop**, keyed on one status code. A mis-mapped code receives goods that never arrived. |
| `VEND-084` | **`Decreases` (quantity acknowledgement)** | **"A decrease allows the purchase order quantity to be brought down to zero"** — a vendor can cancel PO lines unilaterally via 855/865. |
| `VEND-086` | **Auto-created remit-to mirroring** | The first remit-to **silently mirrors the vendor address until anyone edits it, then stops forever**, with no indicator. A vendor address change that everyone assumes propagated may not have ⇒ **payment misdirection**. |
| `VEND-086` | **`Account Number` printing** | Bank account numbers are encrypted on screen (gated by `View Encrypted AP Account Numbers`) but **print un-encrypted on AP checks via Forms Designer**. |
| `VEND-086` / `VEND-087` | **Vendor bank details, `Default Payment Method`, remit-to delete** | No approval workflow, no dual control, no in-use check on remit-to deletion. **This is the classic AP fraud vector.** |
| `VEND-087` | **`AP Terms Code` / `Tax ID Number` TPA sync** | **One-way, at vendor creation only.** Later edits must be repeated manually in QuickBooks/TPA — **the same ERP↔accounting divergence class as `Allow Transmitted AP Bill Deletion`.** |
| `VEND-087` | **`Warranty GL Account` / `Supplies GL Account` left blank** | GL activity **silently posts to the system default account**, discovered only at month end. |
| `VEND-078` | **Location Mask immutability** | **"Once you establish a Location Mask and save the record, you cannot change it."** Not destructive of data, but it permanently constrains a warehouse. |
| `VEND-093` | **`Third Party AWM Active` on an already location-tracked warehouse** | **"STORIS must run a utility to reset the warehouse location and all associated files and records to Non-Location Tracked"** — a vendor-run mass data rewrite. |
| `VEND-073` | **`This is not an existing Storage Location. Add it?`** | A typo becomes a new empty storage location on one `Yes`, silently fragmenting the location master. |
| `VEND-081` / `VEND-087` | **On-the-fly zip code creation** | New zips are only surfaced on the **End-of-Day report**; wrong ship location and wrong tax codes until a manager notices. |
| `VEND-075` | **Unchecked `Accept Partial Completion Notifications`** | A non-conforming inbound EDI 214 is **silently ignored — "no update occurs."** No dead-letter, no alert. |
| `VEND-094` | **Receiving calendar is advisory only** | **"The settings on this calendar do NOT actually prevent purchase orders from being received on… dates that you indicate are 'closed'."** The screen implies a control it does not enforce. |

---

## `[DECISION NEEDED]` — collected

1. **`VEND-049`** Does LA Mattress use Podium (or an equivalent review platform), and should take-with fulfilments be suppressed from review requests by default?
2. **`VEND-050`** Keep STORIS's "warranty carries the picking instruction" indirection for fabric coating, or make it a product/SKU attribute? Also: define the tie-break when several special-picking categories apply to one item (recommendation: lowest pass number wins).
3. **`VEND-051`** Do we pad the eCommerce channel's promise dates as STORIS does, or show web customers the true ETA?
4. **`VEND-052`** Adopt STORIS's exact lead-days hierarchy for migration fidelity, or move product-group/category exceptions above ship-from where they arguably belong? (Changing it changes every ATP date at cutover.)
5. **`VEND-055`** Do we need a `FLOOR` (floor sample) PO type at go-live, and should floor-sample receipts land in a dedicated bucket rather than As-Is?
6. **`VEND-056`** Capacity measured in loads + pieces (STORIS), or do mattress volumetrics require cube / dock-minutes?
7. **`VEND-057`** Build carrier-facing dock-appointment confirmations? STORIS deliberately does not supply slot times to carriers.
8. **`VEND-058`** Do we need region *and* district as separate dimensions, or one geography hierarchy with a role flag?
9. **`VEND-059`** Are vendor×region contacts needed at all for a largely single-region operator?
10. **`VEND-060`** *(carried into Gap 2)* How is expected vendor credit reconciled against credit actually received — and do we accrue RTV credits as ageable receivables from day one?
11. **`VEND-072`** Is directed putaway in scope at go-live, or is zone-level putaway sufficient?
12. **`VEND-078`** Confirm the storage-location component set (`floor/aisle/rack/level/bin`) and the ranges each needs at 5-year scale — and confirm we are building mask migration (STORIS cannot).
13. **`VEND-081`** Avalara (or equivalent) as tax authority with an offline fallback, or ERP-native rates only?
14. **`VEND-083`** One vendor class per vendor (STORIS) or a tag set?
15. **`VEND-084`** Does `Receive Product Automatically with 214` get built at all, and if so behind what approval gate / allow-list?
16. **`VEND-084`** Do we let AP bill entry write back to the product master's replacement cost (`Update Replacement Cost in Product File`)? Costing-integrity decision; interacts with `COST-031`/`COST-032`.
17. **`VEND-086`** Which payment rails at go-live — `Printed Check`, ACH/NACHA, `Virtual Card`? Virtual card changes the reconciliation model.
18. **`VEND-087`** Do we permit paying for unreceived merchandise (`Allow Payment of Pending Bills`) at all, and via which reimbursement track (`Accounts Payable` netting vs `Vendor Receivables` ageing)?
19. **`VEND-087`** Foreign-currency vendors — needed at go-live, and do we revalue payables?
20. **`VEND-089`** Which write path is authoritative for replacement cost: AP bill entry, `Update a Product Cost`, or the ship-from cost screen? (Three writers today.)
21. **`VEND-090`** Is `Buying Group` needed? It is referenced twice and defined nowhere in this section.
22. **`VEND-093`** Are franchise/dealer-operated locations in scope? If not, drop the Franchise Information block entirely.
23. **`VEND-093`** Scope of Credit Application / Revolving / Online Finance — roughly a quarter of the location master and possibly wholly out of scope for LA Mattress.
24. **`VEND-094`** Is a per-location, per-weekday receiving calendar sufficient, or do we need per-receiving-group calendars and cutoff times?

---

## Recommended follow-up fetches (highest value first)

1. **`Select and Approve Bills for Payment`** — the check-run and payment-approval routine. Almost certainly where `PO-102` is implemented and where hold release lives.
2. **The AP Hold code table** (`Hold Code` lookup in `VEND-087`) — the enumeration of *why* bills are held. Completes `PO-080`.
3. **`Accounting > Vendor Receivables`** — vendor credit ageing and application. Completes Gap 2.
4. **`Import Freight Settings`** branch (surfaced by `VEND-070`) and **`FOB Settings`** — the likely home of `COST-033` itemized container receiving and the freight distribution methods in `RCV-050`–`RCV-054`.
5. **`EDI Control Settings`** — every enum in `VEND-084` has a `Use Default` option pointing here.
6. **`Advanced Vendor Settings`** — referenced by `VEND-052` (three separate lead-days tiers), `VEND-090` (buying group), and `VEND-093` (days of supply for auto PO replenishment). It is a significant vendor screen that is **not in this section**.
7. **The `In Transit Days` hierarchy** — behind an unexpanded "Click here for detail" link in both `VEND-087` and `VEND-090`.
8. **`Terms Code Settings`** — the `TERMS_CODE` resolver scope.

---

## Untrusted-content note

Per the brief's ground rules: **no article text in my range addressed me, instructed me to take any action, or attempted to alter my task.** All content read as ordinary product documentation. Two items are worth flagging as *documentation defects* rather than injection attempts:

- `VEND-063` describes `To` as the *initial* value and `From` as the *final* value of a range — the labels appear swapped.
- `VEND-093` documents the `District` field with the `Region` field's text verbatim.
- `VEND-078` states `Alphanumeric` elements allow "up to 1 digit" while its own worked example uses a two-character alphanumeric bin (`A1`).
- `VEND-082` labels the reorder control **"Premote/Demote"**.

