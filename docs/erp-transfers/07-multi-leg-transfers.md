# 07 — Multi-Leg Transfers

Moving a product through intermediate locations to reach its final destination. Each leg is a transfer
linked to the next; together they fill the requesting document.

Two flavors, independently switchable:

| Flavor | Switch | Requires stock to exist? | Idea |
| --- | --- | --- | --- |
| **Demand** | `use_stock_location_schema` | **Yes** — legs are created only when a piece is available | Find stock somewhere, then route it here |
| **Logistics** | `use_distribution_location_schema` | **No** | Move the product along a defined path regardless of current availability |

Both flavors use the **Distribution Location Schema** for the pass-through path.

---

## Transfer creation taxonomy

| Kind | Created when |
| --- | --- |
| **Auto-Transfer** | A line is saved in Enter a Sales Order or Enter an Exchange where the line's **stock location ≠ fulfillment location** and the **Auto Schedule Period Days** setting is **> 0**. |
| **Alternate Stock Location** | The default stocking location has no stock; a configured alternate becomes the stock location. Produces an auto-transfer and shifts demand/ordering to the alternate. |
| **Demand Transfer** | System-created to fill demand at a stock location, using a predefined location list. **Products must be reserved** for demand transfers to be created. |
| **Logistical Transfer** | System-created where merchandise must pass through a predefined set of locations. **Products do not have to be reserved.** |

---

## Two schema concepts — keep them distinct

**Distribution Location Schema** — the locations merchandise must pass *through* to get from one
location to another. Used by **both** demand and logistics flavors.

- Maintained in *Maintain Distribution Location Schema*.
- Shape: `From → Via1 → [Via2] → [Via3] → [Via4] → To`.
- Constraints in `01-domain-model.md` §8.
- Worked example from the source: warehouse 88 has a stock schema (demand) from warehouse 66, but no
  direct truck runs 66→88; 66 only runs to 77. So define schema **From 66 → Via 77 → To 88**.
- Only needed when an intermediary is required.

**Stock Location Schema** — an ordered hierarchy of one or more locations searched to find a product
to fill an order. Set per location; applies to stores and warehouses. Can be scoped to **Customer
Pickups Only**, **Deliveries Only**, or both.

---

## Eligibility

### Via Stock Location Schema (demand)

All must be true:

1. The product has a **Distribution Code** in Distribution Status Settings.
2. The product's distribution status is **Available from Multiple Locations**.
3. The order/transfer's scheduled date falls **within the fill window** *(demand flavor only)*.
4. Merchandise is **not available at the original stock location**.
5. The order/transfer's stock location has a **Stock Location Schema** configured in the location settings.

### Via Alternate Stock Location

- Does **not** require a distribution status or product availability.
- Requires the original default **stock location and ship location to be the same**.
- Available for both stores and warehouses.
- `ignore_stock_schema_at_alternate_location` bypasses schema evaluation there.

---

## Where legs get created

- **Enter a Sales Order** / **Enter an Exchange** — use the distribution location schema to create the
  transfers needed to move merchandise from the stock location to the fulfillment location; use the
  alternate stock location when the store's stocking location has nothing available. The demand
  version (combined with distribution locations) searches for available product and creates the legs;
  this depends on the product being available from multiple locations. The logistics version may use
  the distribution location schema to create legs to the order's fulfillment location.
- **Enter a Transfer** (and all transfer-entry variants) — uses **both** the logistic and demand
  versions.
- **Ship Direct unchecked** on a transfer ⇒ on save, look for a distribution location schema between
  From and To and auto-create the additional legs.

## Sales-order / exchange location defaulting

The processes that decide whether to default the fulfillment location to the selling location check
the **selling store's location settings first**, then the Point of Sale Control Settings. When stock
is found at one of those locations, that location becomes the default stock location; otherwise the
ship location is used.

Line entry checks the product's **distribution status**, which determines whether the product can be
entered on the order, whether it can be reserved, and which source locations are valid.

---

## Leg linking

- The consuming line carries status **`T`** — "to be filled by multi-leg transfer".
- The supplying transfer carries status **`X`** — "multi-leg transfer to fill another transfer".
- Manifest search exposes **Reserved Linked Transfers** — transfers linked to another transfer that is
  on a manifest. Searching by this option is only allowed when the Transfer From Location is set to
  include transfers *in anticipation of receipt of another transfer*.
- Manifest grid **Primary Order Number / Status / Date / Route / Truck / Location** show the linked
  sales order for auto-transfers, or the **originating transfer** for multi-leg transfers. Note the
  documented caveat: the primary order's route/truck is **not necessarily** the route/truck of the
  originating transfer.

## Transit dates

Resolution order in `01-domain-model.md` §8. The per-pair table beats the global settings.

## Background maintenance

**Manage Transfer of Merchandise** (scheduled process): reviews the stock location schema of all open
orders and the efficiency of product assignment; manages DC→DC and DC→store transfers. **Does not
apply to alternate stock locations.**

## Missing source material

The **Multi-Legged Transfers Flow Chart Overview** article in the Transfers section has no text body —
it is a diagram-only page and the diagram did not extract. The narrative Overview article (linked
from it) is fully captured above.

**[DECISION]** Someone should open the flow chart page in a browser and confirm the visual decision
order matches the eligibility rules above before the routing engine is finalized.
