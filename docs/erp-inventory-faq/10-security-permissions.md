# 10 — Security & Permissions Registry

Every permission named in this pack. Requirements for the permission system:

- Assignable to **both users and user groups** (STORIS does both; so must we). User-level grants override
  group-level; model an explicit three-state (grant / deny / inherit).
- Enforced **server-side** in the service layer. UI hiding is presentation only, never the control.
- Every denied action logs an attempt (actor, permission, target) — permission-denied patterns are a loss
  prevention signal.
- Permission changes are audited like settings changes.

---

## Purchasing security

| ID                   | Permission                                                    | Gates                                                       |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `SEC-PO-SOPOS`       | Create special order purchase orders within POS entry         | `PO-040` — without it, sales order entry cannot create a PO |
| `SEC-PO-EDIT-EDI`    | Edit EDI purchase orders that were electronically submitted   | `PO-022` and any edit of an EDI-transmitted PO              |
| `SEC-PO-EDIT-SENT`   | Edit purchase orders that have been printed, faxed or emailed | `PO-022` and any edit of a sent PO                          |
| `SEC-PO-HOLDRELEASE` | Release a purchase order from hold                            | `PO-081`                                                    |
| `SEC-PO-DELETE`      | Delete a purchase order                                       | `PO-090`, `PO-091`                                          |
| `SEC-PO-APPROVE`     | Approve a PO for payment (closes fully-received POs)          | `PO-102`                                                    |

## Inventory / costing security

| ID                      | Permission                                      | Gates                                                                                                                                   |
| ----------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `SEC-COST-VIEW`         | View and access product cost information        | `COST` visibility everywhere: receiving screens, inquiries, reports, exports, **and API responses**. Field-level server-side redaction. |
| `SEC-STK-ADJUST`        | Enter stock adjustments                         | `STK-010`                                                                                                                               |
| `SEC-STK-MASSUPDATE`    | Perform mass inventory updates                  | `STK-090`                                                                                                                               |
| `SEC-STK-QTYOVERRIDE`   | Override the quantity error level               | `STK-100` — if we implement soft-override                                                                                               |
| `SEC-ITEM-FORCECONVERT` | Force-convert special order → regular inventory | `ITEM-030` `[DECISION NEEDED]`                                                                                                          |

## Physical inventory security

| ID                      | Permission                                   | Gates                  |
| ----------------------- | -------------------------------------------- | ---------------------- |
| `SEC-PHYS-FREEZE`       | Freeze / clear an inventory freeze           | `PHYS-030`, `PHYS-080` |
| `SEC-PHYS-APPROVE`      | Approve variances above threshold            | `PHYS-060`             |
| `SEC-PHYS-POST`         | Post a physical inventory                    | `PHYS-070`             |
| `SEC-PHYS-BULKOVERRIDE` | Override the bulk-count reconciliation check | `PHYS-041`             |

## Sales security

| ID                 | Permission                                                     | Gates                                                                                              |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `SEC-RTN-NOORIG`   | Enter return/exchange/dollar adjustment without original order | `RTN-010`, `RTN-012` — **also the permission that makes cutover-era returns possible (`MIG-030`)** |
| `SEC-RTN-OVERRIDE` | Override the return days window                                | `RTN-040`                                                                                          |
| `SEC-RTN-SPLIT`    | Split an exchange                                              | `RTN-060`                                                                                          |

## Transfer security

| ID                 | Permission                     | Gates                |
| ------------------ | ------------------------------ | -------------------- |
| `SEC-XFR-CREATE`   | Create transfers               | `XFR-012`            |
| `SEC-XFR-COMPLETE` | Complete transfers / manifests | `XFR-012`, `XFR-020` |
| `SEC-XFR-RELEASE`  | Release auto transfers         | `XFR-051`, `XFR-054` |

## RTV security

| ID                 | Permission         | Gates     |
| ------------------ | ------------------ | --------- |
| `SEC-RTV-CREATE`   | Create an RTV list | `RTV-012` |
| `SEC-RTV-COMPLETE` | Complete an RTV    | `RTV-012` |

## Receiving security

| ID                | Permission                  | Gates                |
| ----------------- | --------------------------- | -------------------- |
| `SEC-RCV-RECEIVE` | Receive merchandise         | `RCV-010`, `RCV-011` |
| `SEC-RCV-REVERSE` | Reverse a receiving error   | `RCV-030`            |
| `SEC-RCV-FREIGHT` | Enter/close freight batches | `RCV-050`–`RCV-053`  |
