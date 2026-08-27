# 09 — Transfer Receiving (RF / Barcode) & the Pending Queue

Receiving is a three-part system:

1. **Initialize** the receiving batch (snapshot of what is expected).
2. **Scan** pieces on the handheld.
3. **Complete** the receipt — automatically if everything was scanned, manually otherwise.

Behind it sits an asynchronous worker (**RF Transfer Receiving Phantom**) that turns scans into
inventory updates, plus a review screen for whatever the worker could not process.

**Precondition throughout: transfers to be received must be on a manifest.**

---

## 1. Initialize Radio Frequency Transfer Receiving

Records the list of items scheduled to be received that day and creates the receiving update batch.

| Field | Rules |
| --- | --- |
| **From Location** | Location the transfer originated from. Subject to regional processing. |
| **Route Code** | The transfer must have a valid route code **and be on a transfer manifest** to proceed. |
| **Truck** | Active **only** when mapping is enabled for Transfers at the From location. When active, **mandatory**. |
| **Scheduled Date** | Scheduled date of the transfer. |

On Save: create the batch, confirm with `Transfer Initialization is complete!`.

---

## 2. Scanning flow (handheld)

```
Login → Main Menu → 3 Receipts → 2 Transfer
  From Whse:  scan location label or type the transfer-from location
  Route:      transfer route
  Date:       scheduled date
  Locn:       scan the storage location label (where merchandise is being received)
  Prod:       scan the inventory label for each piece  → model number displays
```

- When a scanned piece is linked to a sales order or a multi-leg transfer, display: product,
  description, **fulfillment status**, date, additional order comments, assigned route/truck from the
  manifest, truck from fulfillment, route from fulfillment, and `No Linked Document` when applicable.
  Fulfillment status applies only to sales-order links — for a transfer link it displays **blank**.
  Comments are header comments first, then line comments, **truncated to the first 20 characters of
  the combined string**.
- Entering `0` at the `Prod:` prompt exits early; the receipt must then be closed with the Complete
  RF Transfer Process screen.
- **When every scheduled piece has been scanned, the system automatically completes the manifest.**
- After the last piece, the scanner returns to the Receipts menu.

---

## 3. Complete Radio Frequency Transfer Process

Review, complete, and print labels for a receiving batch. Requires initialization to have run.
**Completion is prohibited while any pending transfer-receiving transactions remain unprocessed.**

| Field | Rules |
| --- | --- |
| **Transfer From** / **Transfer To** | Location dropdowns, regional-processing filtered. |
| **Route** | Mandatory. |
| **Transfer Date** | Scheduled date. |
| **Transfer COMPLETED?** | Checking it prompts `This will COMPLETE the transfer and perform all updates!`. Required to close the transfer properly. |
| **Print Method** | `Zebra Printer` (thermal label) or `Forms Designer` (activates Form Name). |
| **Form Name** | Enhanced laser print form; only with Forms Designer. |
| **Cross Dock Form** | Only with Forms Designer **and** when the location has Cross Dock Transfer Days or Cross Dock Order Days set. On run, the system compares demand (open orders/transfers inside the cross-dock day window) against supply (what is already in cross-dock locations), prints exactly the number of cross-dock labels required, and prints the normal inventory label for the remaining pieces. The chosen form is remembered as the default next time. |

**Filters**

- **Status**: `All` / `Received` / `Unreceived` / `Partially Received` (multi-quantity lines with only
  some quantities scanned).
- **Document**: restrict to one transfer document.
- **Product**: restrict to one product, or build a product list, regardless of transfer number.

**Grid**: Product · Received status · Document number · Line number · storage Location · Serial
(reference) Number. Double-click a row → **Transfer Receipt Information** window showing detail for
the scanned piece **including the scanned label number**.

**Actions**

- **Transfer List Report** — scanned received quantities and un-received quantities.
- **Print Unreceived Qty Labels** — labels for pieces not yet received.
- **Print Total Qty Labels** — labels for every product on the transfer list.

---

## 4. Review Radio Frequency Transfer Receiving Phantom

The pending-queue console. Lets an operator start the worker manually and inspect what is stuck.

A receiving transaction stays pending for one of three reasons:

1. There is a problem with the transfer — the reason is shown in the **Pending Reason** column.
2. The worker's status is Inactive or Suspended.
3. The worker is active but has not reached the transaction yet.

The worker is registered in Phantom Process Settings, administered in Administer Phantom Processes,
and its general status is visible in View Phantom Processes.

### Phantom Information

| Field | Behavior |
| --- | --- |
| **Total Pending Transactions** | Read-only count across **all** warehouses. |
| **Phantom Status** | Read-only: `Active` (running) · `Inactive` (not running) · `Suspended` (manually suspended — **will not auto-start when merchandise is scanned**; must be restarted through Administer Phantom Processes). |
| **Start Phantom** | Attempts to process all pending transactions for all warehouses. Only enabled when the worker is neither running nor suspended. |

### Transfer Selection

- **From Location** / **To Location** — single-select dropdown or multi-select window; default **All
  Locations**. The grid opens populated for all locations.
- **Refresh** — clears and repopulates the grid for the selected criteria. Always available.

### Grid

Transfer · Line Ref · Quantity (received) · **Details** *(read-only View an Existing Sales Order)* ·
**Remove** *(drops the pending transaction from the transfer)* · Scanned *(24-hour time — 07:55,
13:15)* · From · To · **Pending Reason** *(should always be populated unless the worker is Inactive or
Suspended)* · Scheduled Date *(from the manifest)* · Truck/Route *(from the manifest)* · Linked
Document · Last Attempt.

---

## Implementation notes for LA-Mattress-ERP

- Model the pending queue as a real table plus a job, not an in-memory queue. The console needs
  per-row inspection, manual removal, a persistent failure reason, and a last-attempt timestamp.
- The three-state worker (`active` / `inactive` / `suspended`) is meaningful: **suspended must
  suppress auto-start on scan**. A plain enabled/disabled flag loses that.
- The "all pieces scanned ⇒ auto-complete the manifest" rule and the "pending transactions block
  completion" rule must be evaluated against the same source of truth, or receipts will deadlock.
- RF users' over-receiving is governed by `allow_over_receiving` in Bar Code Control Settings, **not**
  by the per-user `allow_to_over_receive_merchandise` Logistics Security setting.

## Verification after receiving

- **View Detailed Activity for a Product** — receiving activity by product.
- **Report Transfers by Location** — transfer activity by location.
