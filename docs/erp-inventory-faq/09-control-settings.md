# 09 — Control Settings Registry

Every setting named anywhere in this pack. Build these as a **typed, versioned, audited settings service** —
not scattered constants or ad-hoc rows. Requirements for the service itself:

- Typed values with validation; no stringly-typed settings.
- **Scope resolution:** `SYSTEM` → `DISTRICT` → `LOCATION` → `GROUP` → `PRODUCT`, most specific wins.
  Not every setting supports every scope — the registry below declares the supported scopes.
- **Change audit:** who, when, old value, new value, reason. Settings changes cause inventory and money to
  move; they must be as auditable as transactions.
- **Guarded changes:** some settings cannot be changed while certain state exists (noted below).
- Settings are readable by a single resolver used everywhere. No caching that can go stale silently.

---

## Inventory Control Settings

| ID                    | Setting                                                 | Scopes            | Type                                 | Used by     | Notes                                                                                             |
| --------------------- | ------------------------------------------------------- | ----------------- | ------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------- |
| `CFG-INV-LOCTRACK`    | Location Tracking                                       | SYSTEM + LOCATION | bool (two-step)                      | `LOC-021`   | Global switch **and** per-location opt-in. Turning off with located inventory present is guarded. |
| `CFG-INV-VENDORMODEL` | Add Vendor Model to Reports                             | SYSTEM            | bool                                 | `RPT-*`, B9 | On → print vendor model, falling back to SKU when absent. Off → always SKU.                       |
| `CFG-INV-RESERVEBY`   | Stock Reservations / Reserve by Date Type (General tab) | SYSTEM            | enum `ORDER_DATE` \| `DELIVERY_DATE` | `STK-060`   | Changing triggers a re-allocation batch.                                                          |
| `CFG-INV-RCVCLOSE`    | Allow Receiving to Close Purchase Order                 | SYSTEM            | bool                                 | `PO-101`    | On → receiving prompts to close a partially received PO.                                          |

## Point of Sale Control Settings

| ID                  | Setting                            | Scopes | Type              | Used by              | Notes                                                                                         |
| ------------------- | ---------------------------------- | ------ | ----------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `CFG-POS-QTYERR`    | Quantity Error Level               | SYSTEM | int               | `STK-100`            | STORIS default 25. Set LA Mattress's default deliberately. Error message must name the limit. |
| `CFG-POS-RTNDAYS`   | Days allowed for returns/exchanges | SYSTEM | int               | `RTN-040`            | Overridden by `CFG-GRP-RTNDAYS`.                                                              |
| `CFG-POS-AUTOSCHED` | Auto Schedule Days (Inventory tab) | SYSTEM | int, **nullable** | `XFR-052`, `XFR-053` | **Blank disables auto transfers entirely.** Blank ≠ 0.                                        |

## Product Group Settings

| ID                | Setting                            | Scopes | Type | Used by   | Notes                                         |
| ----------------- | ---------------------------------- | ------ | ---- | --------- | --------------------------------------------- |
| `CFG-GRP-RTNDAYS` | Days allowed for returns/exchanges | GROUP  | int  | `RTN-040` | Overrides system default. Evaluated per line. |

## Warehouse / Store Location Settings

| ID                   | Setting                      | Scopes   | Type            | Used by    | Notes                                                                                 |
| -------------------- | ---------------------------- | -------- | --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `CFG-LOC-REPLDAYS`   | Automatic Replenishment Days | LOCATION | set of weekdays | `XFR-053`  | Days the location accepts auto stock transfers. Empty set must fail loudly, not loop. |
| `CFG-LOC-REPLSOURCE` | Replenishment locations      | LOCATION | ref             | `REPL-020` | Required prerequisite for sales-rate replenishment.                                   |
| `CFG-LOC-WMS`        | WMS location flag            | LOCATION | bool            | `RTN-052`  | Disables Take-With exchanges.                                                         |

## Warehouse Inventory Settings (product × location)

| ID                   | Setting                | Scopes           | Type  | Used by           | Notes                                  |
| -------------------- | ---------------------- | ---------------- | ----- | ----------------- | -------------------------------------- |
| `CFG-WHINV-MINSTOCK` | Minimum stock level    | PRODUCT×LOCATION | int   | `REPL-010`        | Drives back-order-needs replenishment. |
| `CFG-WHINV-MAXSTOCK` | Maximum stock level    | PRODUCT×LOCATION | int   | `REPL-020`        |                                        |
| `CFG-WHINV-PRICE`    | Location selling price | PRODUCT×LOCATION | money | `ITEM-040` step 5 |                                        |

## Special Order Control Settings

| ID                  | Setting                               | Scopes | Type                               | Used by  | Notes                                                     |
| ------------------- | ------------------------------------- | ------ | ---------------------------------- | -------- | --------------------------------------------------------- |
| `CFG-SO-AUTOCREATE` | Purchase Order — Automatically Create | SYSTEM | enum `PROMPT` \| `AUTO` \| `NEVER` | `PO-040` |                                                           |
| `CFG-SO-ASSIGNREQ`  | Assignment Required                   | SYSTEM | bool                               | `PO-040` | On → created PO line must be reserved to the sales order. |

## Costing Control Settings

| ID                         | Setting                             | Scopes | Type                                                                          | Used by                | Notes                                                                                    |
| -------------------------- | ----------------------------------- | ------ | ----------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- |
| `CFG-COSTING-AUTORESOLVE`  | Auto-resolve cost exceptions        | SYSTEM | bool                                                                          | `COST-042`             | Never fires on a $0.00 receipt cost.                                                     |
| `CFG-COSTING-WINNER`       | Auto-resolution winner              | SYSTEM | enum `RECEIPT_COST` \| `AP_INVOICE_COST` \| `PRODUCT_AVG_COST` \| `LAST_COST` | `COST-042`             |                                                                                          |
| `CFG-COSTING-TOLERANCE`    | Variance tolerance                  | SYSTEM | percent + amount                                                              | `COST-040`, `COST-042` | Both, either may be null.                                                                |
| `CFG-COSTING-METHOD`       | Costing method                      | SYSTEM | enum                                                                          | `COST-010`             | `[DECISION NEEDED]`                                                                      |
| `CFG-COSTING-FREIGHTMODE`  | `freight_costing_mode`              | SYSTEM | enum `PRESET_FACTORS` \| `ITEMIZED_CONTAINER`                                 | `COST-033`             | **Mutually exclusive modes.** Guarded: cannot change while open receiving batches exist. |
| `CFG-COSTING-FREIGHTALLOC` | Default freight distribution method | SYSTEM | enum `EXT_COST` \| `QUANTITY` \| `WEIGHT` \| `CUBE` \| `MANUAL`               | `RCV-053`              |                                                                                          |

## Vendor-level settings

| ID                       | Setting                              | Scopes | Type                         | Used by            |
| ------------------------ | ------------------------------------ | ------ | ---------------------------- | ------------------ |
| `CFG-VEND-FREIGHTFACTOR` | Landed freight factor (Shipping tab) | VENDOR | percent or amount            | `COST-031`         |
| `CFG-VEND-ADDONFACTORS`  | Landed cost add-on factors           | VENDOR | named list of percent/amount | `COST-031`         |
| `CFG-VEND-SHIPFROM`      | Ship From addresses                  | VENDOR | list                         | `PO-020`, `PO-021` |

## Product-level settings

| ID                       | Setting                          | Scopes  | Type                    | Used by                       |
| ------------------------ | -------------------------------- | ------- | ----------------------- | ----------------------------- |
| `CFG-PROD-FREIGHTFACTOR` | Landed freight factor (Cost tab) | PRODUCT | percent or amount       | `COST-032` — overrides vendor |
| `CFG-PROD-ADDONFACTORS`  | Landed cost add-on factors       | PRODUCT | named list              | `COST-032` — overrides vendor |
| `CFG-PROD-POLINETEXT`    | Maintain PO Line Text            | PRODUCT | text                    | `ITEM-060`, `PO-044`          |
| `CFG-PROD-IMAGEMODE`     | Display Images                   | PRODUCT | enum `MANAGED` \| `URL` | `ITEM-070`, `ITEM-071`        |

## Batch / job settings

| ID                  | Setting                                   | Type           | Used by                          | Notes                                                         |
| ------------------- | ----------------------------------------- | -------------- | -------------------------------- | ------------------------------------------------------------- |
| `EOD-001`           | End-of-day job ("Generate Daily Reports") | job definition | `PO-104`, `REPL-040`, `REPL-041` | Ordered steps; each step individually re-runnable and logged. |
| `CFG-REPL-PROFILES` | Automatic replenishment criteria profiles | list           | `REPL-040`                       | Named, versioned, enable/disable, dry-run, caps.              |
