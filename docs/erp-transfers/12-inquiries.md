# 12 — Transfer Inquiries & Reports

All read-only. All subject to regional processing restrictions unless noted.

---

## View Inbound Transfers

Open transfers **into** a location for a given product.

**Header:** Product (search opens the product finder; supports building a product **list** with a
record counter and Previous/Next navigation) · Vendor · Brand · Vendor Model.

> Vendor Model displays only when the logged-in user has
> `search_for_vendors_view_vendor_name_and_model_numbers` in Extended Security.

**Selection:** **To Location** — defaults to the login location, overridable, list filtered by regional
processing.

**Summary figures:**

| Figure | Definition |
| --- | --- |
| Inbound Quantity | Total quantity of this product due to transfer **in** to the location |
| On Hand | Current total quantity in inventory at the location |
| Net Available | On hand less quantity committed to sales orders |
| Net PO | Units on purchase order, minus quantity on sales orders that is not yet reserved, minus layaways |

**Grid:** Transfer Number · From Location · Transfer Type (Stock, Auto Transfer) · Transfer Date
(scheduled) · Transfer Quantity · Reserved Quantity · Order Number (when linked to a sales order) ·
Scheduled Date (the order's delivery date) · Customer Name (from the linked order).

**Actions:** Search Related Collection · View Benefits.
**General Info page** (only when opened from the menu) is identical to the General Information page in
View Product Activity.

---

## View Outbound Transfers

Mirror image of the above, for open transfers **out of** a location.

- **When opened from Schedule and Build a Transfer Manifest this screen is named "Open Transfer
  Inquiry (Out)"** — same screen, different label. Keep it as one component.
- Selection field is **From Location**; the summary figure is **Outbound Quantity**; the grid shows
  **To Location** instead of From Location. Everything else matches, including Net Available and Net PO
  definitions and the Actions/General Information pages.

---

## View a Merchandise Transfer

Read-only view of a single transfer document.

- Enter **Transfer Number**; **Total Volume** displays.
- The document renders **in the same format as the Enter a Transfer screens**. Build it as the entry
  screen in a read-only mode rather than a separate layout.
- **Sales order documents cannot be viewed here** — direct the user to the sales order inquiry.
- Output is affected by regional processing: users can only inquire about customers and locations they
  have access to.

---

## Product Quantity in Excess of Transfer Quantity

Informational-only. Grid: Product · Total Quantity · Maximum Transfer Quantity.

---

## Reports referenced by this section

| Report | Use |
| --- | --- |
| **Report Transfers by Location** | Transfer activity by location. Has an option to include the transfer's Instructions text. |
| **View Detailed Activity for a Product** | Receiving activity by product; As-Is Inventory Detail page shows price changes on non-saleable items. |
| **Transfer List Report** (RF completion Actions) | Scanned received vs un-received quantities. |
| **Report on User Security** | Which security settings are enabled for a user or group. |
| Manifest exception reporting | Report-builder queries over the exceptions store, when `manifest_exception_retention` is set. |

---

## Cross-screen lookups available from transfer entry

Wire these as reusable lookup components, not screen-specific code:

- Search for a Product
- View Kit Product Details
- As-Is Inventory Inquiry
- View Special Order Product Details
- Kit Inventory/Availability Inquiry
- Warehouse Stock Inquiry
- Line Stock Availability
- Multiple Storage Location Selection Window
- Multiple Location Selection Window
- List Entry Window (distribution lists)
- Route Window
- Inventory Selection Screen
- Access Control / Security Override Window
