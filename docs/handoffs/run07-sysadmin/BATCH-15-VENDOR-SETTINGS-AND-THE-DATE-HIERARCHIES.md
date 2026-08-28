# Run 07 — System Administration — Batch 15: Vendor Settings and the Date Hierarchies

Status: complete. Findings 521–539. Read-only throughout.

**This batch found the deepest resolution chain in the audit** — purchase lead days walks **ten
rungs**, topped by an external web service — and, next to it, the first field the audit has met
whose *computed value depends on who is looking at it*. It also closes a second undefined term:
**`Staging Area`**.

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Vendor Settings** | 15243032963092 | Vendor Settings | read — `11.0` / `10.8` |
| 2 | **Advanced Vendor Settings** | 15243030215572 | Vendor Settings | read |
| 3 | **Advanced Regional Vendor Settings** | 15243031913108 | Vendor Settings | read |
| 4 | **Regional Vendor Settings** | 15243032743572 | Vendor Settings | read |
| 5 | **Group Exceptions and Category Exceptions – Advanced Vendor Settings** | 15242997758740 | Vendor Settings | read |
| 6 | **Vendor Ship From Settings** | 15243031196820 | Vendor Settings | read |
| 7 | **Vendor EDI Settings** | 15243032140436 | Vendor Settings | read — `11.0` / `10.8` |
| 8 | **Third Party Logistics EDI Settings** | 15243030955412 | Vendor Settings | read |
| 9 | **Tracked Storage Location Settings** | 15243032962964 | Vendor Settings | read |
| 10 | **Purchase Lead Days** | 15243029817876 | Vendor Settings | read — **the ten-rung hierarchy** |
| 11 | **Purchase Delivery Pad Days** | 15243029806868 | Vendor Settings | read |
| 12 | **Auto-Fill Days Setup** | 15243029363092 | Overviews › Setup | read (followed link) |
| 13 | **In Transit Days Hierarchy** | 15243029582100 | Overviews › Rules | read (followed link) |
| 14 | **Advanced Vendor Settings – Read Only** | 15242997505812 | Vendor Settings | noted, not read (view-only twin) |

Vendor Settings section: **94 total, ~13 now read.**

Sibling articles sighted and **not** read, recorded so the queue is honest:
`Advanced Vendor Category and Group Exception Settings` — **Volume Rebates** (15243029154068),
**Auto-Fill Days** (15243029151636), **Purchase Lead Days** (15243029366932) and at least one more
(15243029152788, title truncated in search); `Vendor Ship From Replacement Cost Settings`
(15242998160660); `Vendor Ship from Location Lead Days` (15243029986196);
`Assign Default Vendor Ship From Locations` (15202193114004); `FOB Settings`; `Collection Settings`;
`Return to Vendor Tax Settings`; `Landed Freight and Add-On Costs Overview` (15294522839316);
`Add-on Calculation Process` (15186451011092).

---

## B. Wiring findings

### FINDING 521 — A vendor is anyone you may write a check to, and one is delivered by STORIS

- **Invariant:** the vendor file is the payee master, not the supplier master, and refunds route through a reserved vendor.
- **Evidence** — `Vendor Settings`:
  > "**STORIS defines a vendor as any person or company to whom you may write a check.** This includes **inventory vendors, delivery companies (freight), company personnel to whom you may pay expenses, subcontractors, your landlord, the telephone company, etc.**"
  > "**NOTE: For the purpose of issuing customer refunds, STORIS comes delivered with a vendor called `REFUND VENDOR` with the code `RFND`.**"
  > "**STORIS captures when users create or modify vendor records, as well as the dates and times of the edits. You can access this data via the `VENDOR` field in the Report Builder.**"
- **Maps to:** run 03 (refunds) · run 04 (delivery companies) · batch 3 (Logistical Route Settings) · W-035, W-052.

> **This single sentence explains a shape the audit has met four times without naming it.** Run 04
> found delivery companies configured as vendors; run 03 found refunds producing a payable. Both are
> consequences of one modelling decision: **STORIS has no separate payee entity**, so the vendor file
> is where AP finds everything it can pay.
>
> **For the rebuild the consequence is a data-migration decision, not a design one.** The extracted
> vendor file will contain the landlord and the phone company alongside the mattress suppliers, and
> any "vendors" count taken from it will be wrong for purchasing purposes. Vendor records need
> classifying on the way in — and nothing in this article says what field does the classifying.
> Recorded in §H.
>
> `RFND` is a **reserved code**, the second the audit has seen (after run 04's reserved handling
> codes). A rebuild must not let a site create or delete it.
>
> The Report Builder note is the **third audit-trail mechanism** found in run 07, after
> `Track Settings Activity` (batch 3) and `Review Settings Activity`. Vendor edits are captured
> without either of those being switched on.

### FINDING 522 — Purchase lead days resolves through **ten** rungs, and the first is an external service

- **Invariant:** lead time is derived by the deepest fall-through in the system; first valid response wins.
- **Evidence** — `Purchase Lead Days`, verbatim and in order:
  > "When determining purchase lead days, the system checks the following routines in the following order **for a lead days field with a valid response and uses the first one it finds.**
  > 1. **`ATP Web Service`, if licensed and active, is checked for lead times. Otherwise, the standard lead time hierarchy is used.**
  > 2. The Purchase Lead Days field in the **District and Regional Product Settings**.
  > 3. The Purchase Lead Days field in the **Advanced Product Settings**.
  > 4. The lead days established for the warehouse / store in **Vendor Ship from Location Lead Days**.
  > 5. The Purchase Lead Days field in the **Vendor Ship-From Settings**.
  > 6. The Lead Time field in the **Regional Vendor Settings** (**Regional Processing must be active**).
  > 7. The Lead Days field on the **Product Group Exceptions** screen, accessed via the Action button on the Advanced Vendor Settings.
  > 8. The Lead Days field on the **Product Category Exceptions** screen…
  > 9. The Purchase Lead Days field in the **Advanced Vendor Settings**.
  > 10. The **Average Lead Time** field in the **Vendor Settings**."
  > "**NOTE: The system also references the `Exclude Weekends in Vendor Lead Days` in the Purchasing Control Settings when calculating purchase lead days.**"
  > "**If Vendor Ship From information is not set up in Advanced Product Settings on a per product basis, the vendor ship from Lead Days is not used to calculate the ATP date.**"
- **Maps to:** batch 14 F503, F505 (three-rung hierarchies) · batch 4 (licensing) · batch 6 (Regional Processing) · W-014, W-016, W-057.

> **This is the audit's deepest hierarchy by a factor of three, and it is not the "standard product
> hierarchy" at all.** Batch 14 established a reusable three-rung resolver. This one is different in
> kind: it interleaves **product-side** rungs (2, 3) with **location-side** (4) and **vendor-side**
> (5–10), and it is ordered **most specific to least** across three different axes at once.
>
> Four things a rebuild must not get wrong:
> - **Rung 1 is a network call.** `ATP Web Service`, when licensed and active, **replaces the entire
>   hierarchy** — *"Otherwise, the standard lead time hierarchy is used."* That is a nine-rung
>   fall-through that only runs when an external service is off or unlicensed. Availability of a
>   third party changes which stored settings matter.
> - **Group beats Category** (rungs 7, 8). The audit has now seen this order twice — here and in
>   F524. It is consistent, and it is the *opposite* of the alphabetical instinct.
> - **Rung 6 disappears** when Regional Processing is off, exactly as batch 14 F505 found for
>   purchase status. **Two hierarchies of different lengths both shrink on the same switch.**
> - **`Exclude Weekends in Vendor Lead Days`** means the arithmetic is calendar-aware and configured
>   somewhere else entirely (Purchasing Control Settings). Lead days may be business days or
>   calendar days system-wide.
>
> The last sentence is a **silent dead rung**: rung 4/5 lead days are ignored for ATP unless the
> product carries its own Vendor Ship From setup. Configure the location, see no effect, no error.

### FINDING 523 — The purchase order delivery date is **different for different users**, by design

- **Invariant:** a padding is added to the true date for users lacking a specific permission, and it propagates everywhere the date is shown.
- **Evidence** — `Purchase Delivery Pad Days`:
  > "The Purchase Delivery Pad Days is a number of days you can add to the Purchase Lead Days **for selling purposes**. The period of days **adds a cushion to prevent salespeople from making delivery date promises to customers that can be potentially incorrect.**"
  > "The Purchase Delivery Pad Days setting holds the number of days to add to the Purchase Lead Days **for users who are not allowed to view the true delivery date via the `View True PO Delivery Date` field in the Extended Security (Purchasing) settings**. **This setting uses the same hierarchy as Purchase Lead Days.** **All processes that display or print the Purchase Order Delivery Date utilize the Purchase Delivery Pad Days (based on staff security).**"
  > "**Expected Receipt Date is calculated by adding the Purchase Lead Days to the current date plus the Purchase Delivery Pad Days if the user has access.** This date appears in the View Product Availability routine."
  > "Sales order entry and delivery scheduling processes ensure that all the existing applicable (delivery/pickup) lines on the document are available by the specified date. **If the user does not have sufficient staff security, a warning message appears and a manager override is required to save the order.**"
  > "The **`Restrict Delivery Date Based On Available Date`** field on the Delivery tab in the Point of Sale Control Settings controls whether users can assign delivery dates and pickup dates for out of stock merchandise **prior to the Next Available Incoming Purchase Order Date or Expected Receipt Date**… **If you check the box at this field, only users with the proper security can override this restriction.**"
  > "**NOTE: eSTORIS uses purchase delivery pad days in the same manner as standard STORIS.**"
  > "**The conversion spreadsheet allows for import of purchase delivery pad days.**"

  Two named permissions:
  > "**`View the True Purchase Order Delivery Date`** in the **Extended Security (Purchasing)** settings — to **exclude** purchase delivery pad days when calculating purchase lead days, check the box at this field."
  > "**`Override Delivery Date Restrictions Based on Available Date`** in the **Extended Security (Sales)** settings…"
- **Maps to:** batch 6 F323 (Extended Security is the switch that turns the password field on) · batches 7–9 (permission catalogue) · batch 1 (POS Control Settings, Delivery tab) · run 03 (order entry) · W-050, W-057.

> **This is the first field in seven runs whose computed value is a function of the viewer.** Every
> other permission the audit has catalogued gates an *action* — you may or may not do the thing.
> This one gates *arithmetic*: two users open the same purchase order and read two different delivery
> dates, both correct, neither flagged.
>
> **It is deliberate and it is a business rule, not a display convention.** The stated purpose is to
> stop salespeople over-promising. But *"All processes that display or print"* means the padded date
> reaches **printed customer paperwork**, and the eSTORIS note means it reaches **the public
> website**. A rebuild that treats this as a UI mask will print the wrong date on documents; one that
> ignores it entirely will hand salespeople dates the business has decided they should not have.
>
> **It inherits the ten-rung hierarchy wholesale** — *"This setting uses the same hierarchy as
> Purchase Lead Days"* — so the pad is itself resolved through all ten levels. The rebuild needs the
> resolver as a parameterised function, not two copies.
>
> **A third permission is implied but unnamed.** *"If the user does not have sufficient staff
> security, a warning message appears and a manager override is required to save the order"* does not
> say which permission. Recorded in §H.
>
> The conversion-spreadsheet sentence is a rare direct signal about **cutover tooling** — STORIS ships
> an import path for this field, which implies one exists for its neighbours.

### FINDING 524 — Auto-fill days uses a five-rung hierarchy whose last rung is **additive, not selective**

- **Invariant:** four rungs fall through; the regional value is then *added* to whatever was found.
- **Evidence** — `Auto-Fill Days Setup`:
  > "Auto-fill days are determined by the following hierarchy:
  > 1. **Advanced Product Settings** — Auto-Fill Days field for the selected product.
  > 2. **Advanced Vendor Settings** — the auto-fill exceptions (**first by Group, then by Category**) for the **primary vendor** of the selected product…
  > 3. **Advanced Vendor Settings** — If no auto-fill exceptions are found, the system checks the Auto-Fill Days field…
  > 4. **Point of Sale Control Settings** — If no advanced vendor record exists…, the system looks to the **global** Auto-Fill Days field…"
  > "**`Auto-Fill Days` in Advanced Regional Vendor Settings affects only product activity that occurs for the current vendor within the selected region. This value is added to the fill days calculated by the above hierarchy.**"
  And `Group Exceptions and Category Exceptions`:
  > "**Auto Fill Days** — the auto-fill days are **added to** the fill days calculated from the **Product, Group, Category, Advanced Vendor Settings, Point of Sale Control Setting hierarchy.**"
- **Maps to:** F522 · batch 1 (POS Control Settings) · batch 2 (reservation) · W-055.

> **A hierarchy with an addition on the end is a different algorithm, and the docs state it twice.**
> Every other chain in this audit terminates the moment it finds a value. This one finds a value and
> then **adds a regional adjustment on top**. A rebuild implementing "first match wins" will produce
> the right answer everywhere except in regions that configure the adjustment — which is the hardest
> class of bug to notice.
>
> **The two statements are not identical and the difference matters.** The Setup article says the
> *Advanced Regional Vendor* value is added; the Exceptions article says the *group/category
> exception* value is added to a five-element hierarchy that already contains Group and Category as
> rungs. **Read together they suggest two separate additive terms.** The audit will not resolve this
> by reasoning. Recorded in §H as *documented but ambiguous* — and flagged as a **parity test to run
> against live STORIS** rather than a question for the vendor, since it is directly observable.
>
> **`Vendor` here means the primary vendor of the product**, not the vendor on the order — an easy
> and expensive substitution to get wrong.

### FINDING 525 — Zero disables, blank defers — stated explicitly, with a documented 999 idiom

- **Invariant:** the fall-through's terminal behaviour is controlled by choosing zero versus blank, and STORIS documents the trick.
- **Evidence** — `Auto-Fill Days Setup`:
  > "**NOTE: To effectively disable the Just-In-Time Inventory feature, enter zero (0) at the global Auto Fill Days field in the Point of Sale Control Settings, and leave all other Auto Fill Days fields blank.** In this way, you can **prevent the system from ever attempting to automatically reserve inventory to line items.**"
  > "**To reserve items strictly by order date, set the `Reserve by Date Type` field in the Inventory Control Settings to `Order Date`, and the auto-fill days to 999.** In this way, you **exclude the delivery date and auto-fill date from the reservation calculation.**"
- **Maps to:** the audit's **fall-through idiom**, now 17+ instances (*blank defers, zero forbids*) · batch 2 (reservation) · batch 14 F511 · W-055.

> **The audit inferred this rule from sixteen screens; here STORIS states it as an operating
> procedure.** That converts a well-supported pattern into documented fact.
>
> **The 999 idiom is the more useful half.** Setting a window so wide it always contains the delivery
> date is how STORIS turns off *delivery-date-based* reservation and falls back to order date. It is
> a **configuration idiom, not a feature** — nothing in the data model says 999 is special — and
> **live LA Mattress settings may well contain it**. A rebuild reading 999 as a literal 999-day
> window would behave identically by accident here, but the intent would be lost the first time
> anyone tried to reason about the number.
>
> Both of these are the kind of thing that produces a settings value nobody can explain three years
> later. Worth capturing in the rebuild's configuration documentation explicitly.

### FINDING 526 — Auto-fill days is snapshotted at order entry, and rescheduling **un-reserves** stock

- **Invariant:** the fill window is fixed when the order is written; moving the delivery date out of the window releases reserved merchandise.
- **Evidence** — `Auto-Fill Days Setup`:
  > "**The system sets the auto-fill days at the time of order entry. Changes to any auto-fill days settings described above affect orders on a go-forward basis only.**"
  > "Once an order falls within the auto-fill period and the system reserves merchandise to the order, **you can 'un-reserve' the merchandise by changing the delivery date on the order to a date outside the auto-fill period.** …assume that 15 days after placing the order, the customer decides to postpone delivery for 30 days. When you reschedule…, **the order falls out of the auto-fill period and the system un-reserves any merchandise reserved to that order.**"
  > "To override the calculated auto fill days for a selected product on an order, use the **`Fill Days` field on the Sales Order tab of the Product Full Display Screen.**"
  > "The system references the **`Reservation Priority`** field in the **Inventory Control Settings** and, based on available stock, reserves goods to qualified line items."
- **Maps to:** batch 2 F353–F365 · batch 14 F511, F514 (copy-at-transaction-time) · run 03 (order maintenance) · W-055.

> **Rescheduling a delivery is a stock-releasing event.** That is a genuine cross-module consequence
> and the docs state it as a *convenience* — "you can un-reserve the merchandise by…" — which
> understates it. Move a customer's date out and their goods go back in the pool, available to
> anyone. Move it back in and the reservation is re-competed against whatever has happened since.
>
> **For the rebuild this belongs in the order-maintenance design, not the inventory design.** A date
> change on a sales order must trigger reservation re-evaluation in both directions.
>
> The snapshot rule is **the same copy-at-transaction-time pattern** as batch 14's kit prices. The
> audit has now seen it for tax, commission, cost, kit price and fill days. It is a house rule:
> **STORIS resolves hierarchies once, at write time, and stores the answer.** A rebuild that resolves
> live will diverge from history on every settings change.
>
> `Fill Days` on the Product Full Display Screen is a **per-line manual override** of a five-rung
> calculation — an eleventh input, effectively, and one no hierarchy article mentions.

### FINDING 527 — In-transit days is a four-rung hierarchy that only applies to EDI vendors

- **Invariant:** in-transit days affect the delivery date only for EDI vendors, and only when a Purchasing Control Setting is checked.
- **Evidence** — `In Transit Days Hierarchy`:
  > "If you have established In Transit Days via Vendor Settings and/or Vendor Ship-From Settings, the number of in-transit days is added to the Shipping Date to calculate the Delivery Date **only when using EDI vendors**. To enable in-transit days for Acknowledge a Purchase Order, the **`DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order`** setting in **Purchasing Control Settings** is checked."
  > "…the system checks for the existence of this setting using the following hierarchy. **If a value is not established at the preceding level, the next successive level is checked for a value.** This hierarchy assumes the appropriate settings have been checked.
  > 1. **Vendor Ship-From Settings & `Enter In Transit Days by Location`**…
  > 2. **In Transit Days field on General tab of Vendor Ship-From Settings**
  > 3. **Vendor Settings & `Enter In Transit Days by Location`**…
  > 4. **In Transit Days field on Miscellaneous tab of Vendor Settings**
  > 5. **No additional in-transit days** (In Transit Days fields are blank and no days set by location)"
- **Maps to:** F522 (a third, different date hierarchy) · batch 3 (EDI) · W-057, W-058.

> **Three date hierarchies, three different lengths, three different shapes.** Lead days: ten rungs,
> first-match. Auto-fill days: four rungs plus an addition. In-transit days: four rungs with an
> **explicit named terminal state**. The last is the only one in the audit that *documents its own
> floor* — rung 5 is "no additional days", written down rather than implied.
>
> **The pattern within it is a clean two-by-two**: {Ship-From, Vendor} × {by-location, default},
> ordered specific-to-general on both axes. That is the same structure as the group/category
> exception idiom (F528) and worth implementing once.
>
> **The EDI gate is the important boundary.** A non-EDI vendor's in-transit days are stored and
> inert. Combined with F522's ten rungs, **the effective delivery-date calculation depends on whether
> the vendor is EDI-enabled** — so the same settings produce different dates for two vendors
> configured identically except for that flag.

### FINDING 528 — Five vendor date fields each spawn a category/group exception sub-hierarchy

- **Invariant:** seven Advanced Vendor Settings fields open exception screens whose values override the vendor default, group before category.
- **Evidence** — `Advanced Vendor Settings`:
  > "**NOTE: If you click on the Action button at any of the following five fields, the option appears to establish settings for these fields at the product category and/or product group level for a specific vendor.**"
  followed by: `Auto-Fill Days` · `Lead Days` · `Lead Pad Days` · `PO Pad Days` · `Excess Stock Days` ·
  `Minimum Stock Days` · `Factory Default Warranty`.
  `Group Exceptions and Category Exceptions` lists **seven** fields for the same mechanism —
  Auto Fill Days, Lead Days, Lead Pad Days, Purchase Order Pad Days, Excess Stock Days, Minimum Stock
  Days, Factory Default Warranty — and adds:
  > "The Vendor field and the Default Days field (for Factory Default Warranty Exceptions, this is the Default Warranty field) **populate automatically and cannot be edited.**"
  > "**Category Code or Group Code** — For the selected Category or Group Code, **the exception days entered below overrides the default days for this vendor.**"
  > "**NOTE: These settings do not apply to the Enter a Purchase Order process. The delivery date on the Purchase Order Entry is determined when the vendor is entered.**"
- **Maps to:** F522 rungs 7–8 · F524 rung 2 · batch 14 F510 · W-014, W-057.

> **The article's own text contradicts its count: "the following five fields" is followed by seven.**
> The companion article lists seven. **Seven is almost certainly right and five is a stale sentence**
> — but the audit records the discrepancy rather than silently correcting it, because a rebuild
> deriving the field list from the wrong article will miss two.
>
> **This is a hierarchy nested inside a hierarchy.** Rungs 7 and 8 of the ten-rung lead-days chain are
> not two settings screens — they are two levels of a *sub*-resolver hanging off one field of one
> screen. The real depth of lead-day resolution is therefore greater than ten rungs of *screens*; it
> is ten rungs, two of which are themselves a two-level walk.
>
> **The read-only Vendor and Default Days fields are a good design detail to copy**: the exception
> screen shows you what you are overriding and will not let you edit it there.
>
> The PO-entry exclusion is another **silent dead rung** (cf. F522): none of this applies in
> `Enter a Purchase Order`, where the date is fixed *"when the vendor is entered"*. So the elaborate
> per-category lead times govern forecasting and JIT, **not the PO you are typing**.

### FINDING 529 — Automatic PO replenishment is an End-of-Day feature with an explicit non-application

- **Invariant:** the Auto PO Replen settings drive one named feature and are documented as *not* applying to a similarly-named routine.
- **Evidence** — `Advanced Vendor Settings`, Auto PO Replen tab:
  > "**NOTE: These settings do NOT apply to the `Replenish Inventory for Current Back Order Needs` routine. They are used only for the automatic PO replenishment feature, which is run during EOD or on demand via `Replenish Stock Inventory Based on Sales Rate`.**"
  Fields: `Generate Automatic POs` · **`Automatically Hold POs`** · `Weekly Sales Rate Calculation` ·
  `Include All Backorders` · `Days for Replenishment` · `First Average Units Period` ·
  `Second Average Units Period` · `Variance Starting Date` · `Variance Ending Date` ·
  `Variance Percentage` · `Minimum Sales Rate` · `Sort Criteria` · `Build POs`.
  `Advanced Regional Vendor Settings` repeats most of them and adds **`Default Buyer ID`**.
- **Maps to:** batch 5 (the batch calendar) · batch 14 F508, F520 (End of Day's growing job list) · run 04 (back orders) · W-041, W-016.

> **A fourth End-of-Day responsibility.** End of Day now: releases credit holds (run 03 F153), drives
> notifications (batch 5), reserves hard kits (batch 14 F520), and **raises purchase orders**. The
> audit's standing conclusion — *the batch calendar is business logic* — is now supported by four
> independent, materially different jobs.
>
> **The "does NOT apply" note is the valuable half of this finding.** Two routines with nearly
> identical names — `Replenish Inventory for Current Back Order Needs` and `Replenish Stock Inventory
> Based on Sales Rate` — read from **different settings**. This is exactly the trap that produces a
> rebuild where back-order replenishment silently starts obeying sales-rate parameters.
>
> **`Automatically Hold POs` means machine-generated POs can be born held**, waiting for a human. That
> is the second auto-hold mechanism the audit has met (after run 04's credit holds) and the first
> where the *system* is the originator. Two Variance date fields plus a percentage and a minimum
> sales rate say the generator is **statistical**, comparing two averaging periods — the actual
> formula is not published. Recorded in §H.

### FINDING 530 — Landed add-on costs are configurable at four levels, and container receiving skips one

- **Invariant:** add-on cost rows are labelled centrally and valued at vendor, vendor×region, region×product and product; one receiving path updates only some.
- **Evidence** — `Advanced Vendor Settings`, Shipping tab:
  > "Use this tab to **activate add-on costs for the selected vendor**. For each add-on cost you activate, use the associated `Type` field to specify **the method by which to calculate the add-on cost**, and use the `Cost` field to enter the amount or percentage… **To edit an add-on cost on this screen, the cost must be active via the Costing Control Settings.** For each of the add-on costs on this screen, **the label (if any) specified in the Costing Control Settings appears to the left of 'Landed Cost Active'.**"
  Fields: `Landed Freight Active` · `ADDON 1–4 - Landed Cost Active`, each with `Cost` and `Type`.
  `Advanced Regional Vendor Settings` carries the same five rows **per region**, and adds:
  > "**NOTE: `Receive a Purchase Order with a Separate Freight Bill` (Container Receiving) updates landed cost via the `Landed Freight Cost` field in the Product file. However, container receiving does not update regional product landed freight cost.**"
- **Maps to:** batch 1 (Costing Control Settings) · batch 14 F512 (regional product amounts) · W-061, W-062.

> **Four places hold add-on cost values**, and batch 14 found a fifth consumer:
>
> | Level | Screen |
> |---|---|
> | Vendor | Advanced Vendor Settings (Shipping) |
> | Vendor × Region | Advanced Regional Vendor Settings (Shipping) |
> | Region × Product | District and Regional Product Settings (Costing) — batch 14 F512 |
> | Product | Product file `Landed Freight Cost` |
>
> **No article states the precedence between them.** The audit has now read all four screens and the
> control settings that label them, and the resolution order is nowhere written down. This is a
> **material gap for the rebuild** — landed cost feeds margin — and it is recorded in §H as the
> batch's most important vendor question.
>
> **The container-receiving asymmetry is a documented data-consistency hole**, stated by STORIS
> without comment: container receiving writes the product-level landed freight cost and leaves the
> regional value stale. Whether that is a bug or a deliberate scoping choice is not said. Either way
> a rebuild must decide, and should decide *consciously*.
>
> The activation rule is the **vendor-owned-label / site-owned-value idiom** again: a row cannot even
> be edited here unless Costing Control Settings has switched it on.

### FINDING 531 — Some Vendor EDI fields are maintained by STORIS, not by the site

- **Invariant:** a customer-facing settings screen contains fields the vendor reserves to itself.
- **Evidence** — `Vendor EDI Settings`:
  > "Use this screen to create and maintain the EDI vendor records you use to transmit EDI data to a **network service provider**. **To use this feature, EDI must be active on your system.**"
  > "**Certain fields on this screen must be maintained by STORIS, for example the codes supplied by the service provider.** Once you properly set up a vendor EDI record, you can enter it into the **`Vendor EDI Code` field on the Shipments tab in the Vendor Settings**. In this way, **you activate EDI processing for the selected vendor.**"
  > "**You can use the Delete button to remove unused Vendor EDI records, provided they are not referenced by any vendor.**"
- **Maps to:** batch 4 (licensing) · batch 14 §G (deletion policies) · W-050, W-058.

> **The screen does not say which fields are STORIS-maintained.** That is a real operational
> constraint for the cutover: some of the EDI configuration in live STORIS **cannot be changed by LA
> Mattress**, and the extract will not distinguish those fields from the editable ones. This needs a
> vendor answer before anyone assumes the EDI config is fully portable. Recorded in §H.
>
> **The activation path is two-step and easy to half-complete**: build the EDI record here, *then*
> reference it from `Vendor Settings` → Shipments tab. An EDI record that exists but is referenced by
> nobody does nothing — and is, by the delete rule, the only kind you are allowed to delete.
>
> **Deletion policy #1 (blocked) confirmed again.** Batch 14 catalogued four; this is the referential
> block, matching run 04's handling methods.
>
> `Special Order CFO Popup` appears in this field list. **`CFO Fields` is one of the audit's
> remaining undefined terms** and this is its fourth sighting without a definition. Still undefined
> — recorded in §H, not guessed at.

### FINDING 532 — EDI quantity changes are handled per-vendor, with an explicit opt-out to the global setting

- **Invariant:** each vendor decides how 855/865 quantity changes hit the PO, or delegates to EDI Control Settings via a named checkbox.
- **Evidence** — `Vendor EDI Settings`:
  > "The following settings indicate **how quantity changes transmitted by a specific vendor on an `855` or `865` transaction are handled on the purchase order.** **You have the option to set these settings globally via the EDI Control Settings.**"
  Fields: `Decreases` · `Increases Within the Maximum` · `Maximum Quantity Increase` ·
  **`Use EDI Control Settings`**.
  Related auto-update switches on the same screen: `Update Dates for Acknowledged PO` ·
  `Update Costs for Acknowledged PO` · `Update Costs on Vendor Billing` ·
  `Update Quantity for Acknowledged PO` · `Update Costs for Acknowledged Container` ·
  `Update Costs on Vendor Container Billing` · `Update Replacement Cost in Product File` ·
  `Receive Product Automatically with 214 Purchase Order Acknowledgment` ·
  `Automatic Receipt Status Code` · `315 Additional In Transit Days` · `Payable Bill Hold Days` ·
  `Combine Distributed PO` · `Prompt 850 Submission` · `Prompt 860 Submission` ·
  `Transmit Barcode Label ID` · `Transmit Service Parts PO` · `Receiving Calendar` · `EDI Active`.
- **Maps to:** batch 3 (EDI Control Settings) · W-058, W-062.

> **`Use EDI Control Settings` is an explicit delegation flag, and that is architecturally different
> from a fall-through.** Everywhere else in STORIS, deferring to the global level means *leaving a
> field blank*. Here it is a checkbox. **Explicit delegation beats blank-means-defer** — it is
> self-documenting and it distinguishes "not configured" from "deliberately global". Worth copying in
> the rebuild, and worth noting that STORIS itself only reached for it once.
>
> **`Receive Product Automatically with 214 Purchase Order Acknowledgment` is inventory created by an
> inbound message.** Stock appears because a trading partner sent a document — with
> `Automatic Receipt Status Code` deciding what status it lands in. That is a **write path into
> inventory with no user in it**, and it belongs in the rebuild's audit and reconciliation design.
>
> **A maximum on automatic increases is a real control**: `Increases Within the Maximum` +
> `Maximum Quantity Increase` means a vendor can inflate a PO up to a ceiling without a human. The
> ceiling is the only thing between the site and an unbounded vendor-initiated commitment.

### FINDING 533 — Third-party logistics is a two-document EDI conversation, switchable per direction

- **Invariant:** 215 manifests go out and 214 statuses come back, with independent switches and status codes for deliveries and transfers.
- **Evidence** — `Third Party Logistics EDI Settings`:
  > "Use this routine to create and maintain settings for **3rd party logistics companies that communicate EDI transactions for delivery and/or transfer manifest information.**"
  > "**The `215` shipment manifest document sends transfer and delivery manifest information to the third party logistics companies that includes, but not limited to, order numbers, SKU's, volume, and destination of each sales order/transfer.**"
  > "**The `214` carrier status message document receives the status of a shipment acknowledgement** for the transfer or sales order delivery documents **stating whether the merchandise was received by the third party logistics company (in the case of a transfer) or delivered to the customer (in the case of a sales order delivery).**"
  > "**NOTE: Third party logistics EDI codes cannot be deleted if it is assigned to any delivery company.** If such an action is attempted, a warning message displays."
  Fields: `EDI Provider Name` · `Third Party Logistics EDI Code` · `Description` · `Account Number` ·
  **`SCAC`**; 215: `Send Manifest Information on Deliveries` · `Send Manifest Information on Transfers`;
  214, **duplicated for Deliveries and for Transfers**: `Receive Completion Notification` ·
  `Accept Partial Completion Notifications` · `Completion Status Code` · `Estimated Arrival Status Code`.
- **Maps to:** run 04 F177 (the manifest lock) · run 04 (delivery completion) · F521 (delivery companies are vendors) · batch 10 (status codes) · W-058, W-059.

> **A third party can close a delivery.** `Receive Completion Notification` + `Completion Status Code`
> means an inbound 214 moves an order to a configured status without any STORIS user acting. Run 04
> built the delivery-completion model around manifests and user action; **this is a second, external
> path to the same state transition**, and the status it writes is site-configurable.
>
> **`Accept Partial Completion Notifications` is the interesting flag**, because run 04 established
> that the order-to-piece binding is deliberately loose (F218/F220/F239/F242). A partial completion
> from a carrier has to land on *something*, and how it selects pieces is not documented here.
> Recorded in §H.
>
> **The delivery/transfer symmetry is complete and independent** — four fields, twice, plus two send
> switches. A site can send transfer manifests without delivery manifests, accept partial completions
> on deliveries but not transfers, and use different status codes for each. That is sixteen
> combinations a rebuild must support or consciously simplify.
>
> **`SCAC`** (Standard Carrier Alpha Code) is the first industry-standard identifier the audit has met
> in a STORIS settings record. Added to §J.
>
> Deletion policy: **blocked when assigned to a delivery company** — the fifth confirmation of the
> referential-block policy, and consistent with F531.

### FINDING 534 — `Staging Area` defined: it is a flag on a storage location, one of seven

- **Invariant:** special-purpose storage locations are ordinary locations carrying boolean designations.
- **Evidence** — `Tracked Storage Location Settings`:
  > "**If using the `Location Tracking` feature, use this routine to identify selected storage locations as 'special', for example staging areas or priority-pick locations.**"
  General fields: **`Staging Area`** · **`Priority Location`** · **`Cross Dock Location`** ·
  **`Service Location`** · **`Picking Zone`** · **`As-Is Reason`** · **`Exclude from Cycle Count`**.
  > "**NOTE: This routine may be affected by Regional Processing restrictions. That is, you may not have access to all locations.**"
  > "**To delete a storage location, it must be empty.**"
- **Maps to:** run 04 (picking, staging) · batch 14 F501 (`Cross Dock` at the product×location level) · run 04 F280 (As-Is) · batch 6 (Regional Processing) · `AUDIT-CLOSEOUT.md` §"undefined terms".

> **Second undefined term closed in two batches** (after batch 13's `Inventory Formation`). The
> closeout listed `Staging Area` among thirteen terms it called *"a vendor question, not a reading
> problem."* It is not a vendor question: **a staging area is a storage location with a checkbox.**
>
> **The design insight is that STORIS has no special-location entity.** All seven designations are
> flags on the same record, so a location can be *simultaneously* a staging area, a picking zone and
> a cross-dock location. The rebuild should model these as **non-exclusive attributes**, not as a
> location type enum — the obvious wrong choice.
>
> **`Cross Dock` now appears at two levels** — here on the location (batch 14 F501 found it on the
> product×location row). Two cross-dock flags with no stated relationship. Recorded in §H.
>
> **`As-Is Reason` on a storage location** is a genuinely surprising cross-link: run 04 F280
> established As-Is as the disposition hub for damaged and floor-sample goods, and here a *bin* can
> carry an As-Is reason — so **putting stock in a particular location may classify its condition.**
> That connects physical layout to financial disposition, and no article the audit has read explains
> the mechanism. Recorded in §H.
>
> **`Exclude from Cycle Count`** is a control with an obvious audit consequence: stock that is never
> counted. A rebuild should surface it in reporting rather than bury it in location setup.

### FINDING 535 — Directed putaway's location half: velocity, category, volume, weight and mix constraints

- **Invariant:** the location carries the matching attributes and the physical capacity limits putaway must respect.
- **Evidence** — `Tracked Storage Location Settings`, Putaway section:
  > "**The following fields are used only with the directed putaway process.**"
  Fields: `Putaway Destination` · **`Velocity`** · **`Storage Category`** ·
  Space Capacity — *"The `Height`, `Width`, and `Depth` fields below are used to **calculate the total volume of the storage location**"* — `Height` · `Width` · `Depth` · **`Max Weight`** ·
  **`Max Capacity %`** · **`Unique Products`** · `Putaway Product(s)`.
- **Maps to:** batch 14 **F504** (the product half) — **chain now complete** · batch 12 (locations) · run 04 (WMS) · W-056.

> **Batch 14 found the product side of the putaway match and flagged the tie-break as unstated. The
> location side is now read, and the tie-break is *still* unstated** — so this is confirmed as a
> genuine vendor question rather than an unread article. `Velocity` and `Storage Category` sit on both
> records with matching names; nothing says which dominates or what happens on no match.
>
> **What the location adds is the physical constraint set**, which the product side did not hint at:
> volume (derived from three dimensions), `Max Weight`, `Max Capacity %`, and `Unique Products` — a
> **limit on how many distinct SKUs may share a bin**, which is a mixing rule, not a capacity rule.
> Putaway is therefore a **constraint-satisfaction problem**, not a lookup: match velocity and/or
> category, then fit within volume, weight, fill percentage and SKU-mix limits.
>
> **`Velocity` remains undefined** at both ends (inference I-88 stands, unadopted). It is now the
> audit's clearest example of a term used identically on two screens and defined on neither.

### FINDING 536 — A sixth deletion policy: state-based

- **Invariant:** a storage location may be deleted only when empty — deletion gated by runtime state, not by references.
- **Evidence** — `Tracked Storage Location Settings`:
  > "**To delete a storage location, it must be empty.**"
- **Maps to:** batch 14 §G (four policies) · F531, F533 (referential blocks) · run 04 F173 · batch 13 F494 · W-034.

> **The complete catalogue is now five distinct policies** (batch 14 listed four):
>
> | Policy | Gate | Example |
> |---|---|---|
> | **Blocked — referential** | Something points at it | Handling method (run 04 F173); Vendor EDI record (F531); 3PL code (F533) |
> | **Blocked — stateful** | It currently holds something | Storage location (F536) |
> | **Silent cascade** | — | Inventory formation (batch 13 F494) |
> | **Warned cascade** | Shows affected count, then proceeds | Substitution list (batch 14 F516) |
> | **Self-healing** | Consumers clean themselves up | User/group in purchase statuses (batch 14 F507) |
> | **Forbidden outright** | Never deletable | Purchase statuses (batch 14 F507) |
>
> That is six, counting "never". **Six deletion semantics in one ERP** — and the difference between
> referential and stateful blocking matters for the rebuild, because the second cannot be checked with
> a foreign key.

### FINDING 537 — Address field *labels* are data-driven from the country record

- **Invariant:** three address prompts and the phone field re-label themselves per country via masking settings.
- **Evidence** — `Vendor Settings`:
  > "**NOTE: The `Masking` fields in the Country Settings control the three address prompts shown below.** For example, if USA is entered in the Country field for this Vendor, this routine prompts for entry of **Zip Code, City, and State**. If the Country code represents Canada, the prompts may be different, for example **Postal Code, City, and Province.**"
  `Vendor Ship From Settings` says the same and adds the phone field:
  > "**NOTE: The following three fields are 'dynamic'. The system formats them based on the masking settings in the Country record for the current country.**"
  > "**NOTE: The phone number field is 'dynamic'.**"
  Also on `Vendor Settings`: `Country` · **`Currency`** · **`Update Exchange Rate`**.
- **Maps to:** batch 6 (Regional Processing) · batch 12 (locations) · W-018.

> **This is a UI-metadata mechanism the audit has not seen before**, and it is worth recording because
> a rebuild will otherwise hard-code "Zip / City / State". The label, the format mask and the phone
> formatting all come from a **Country Settings record** — so internationalisation in STORIS is a code
> table, not a code path.
>
> `Currency` and `Update Exchange Rate` on the vendor confirm **multi-currency payables**. Neither the
> rate source nor the update trigger is documented here. Recorded in §H.
>
> The word "dynamic" is used as a **term of art** in this documentation — *"search for 'dynamic' in
> the documentation"* — which is a useful index term for any remaining unread articles.

### FINDING 538 — A licensed module is validated at save time, and the save is refused

- **Invariant:** ticking two vendor-inventory checkboxes triggers a licence check against General System Control Settings.
- **Evidence** — `Vendor Settings`, Miscellaneous tab:
  > "**NOTE: When either of the two checkboxes are checked when Save is selected, the `Vendor Quantity on Hand` licensed module is validated in General System Control Settings, and save is allowed. If this does not happen, an error is message displayed and the options cannot be saved.**"
  The two checkboxes: `Update Vendor Quantities` · `All Vendor Products`, under
  `Vendor Inventory Quantities`. Nearby: `Direct Ship Reserved` · `Require Reservation` ·
  `API Vendor Code` · `Product Configurator` · `Configured Price Calculation` · `Unique Vendor Models`.
- **Maps to:** batch 4 (licensing enumerated — *counts of sites, not feature toggles*) · W-051.

> **This refines batch 4's conclusion rather than contradicting it.** Batch 4 established that STORIS
> licensing is mostly **counts of sites**, not feature switches. `Vendor Quantity on Hand` behaves as
> a **true feature toggle**, enforced at save on an unrelated screen. So the licensing model has both
> shapes, and batch 4's finding should be read as "mostly counts" rather than "only counts".
>
> **Enforcement at save rather than at render is a deliberate and slightly hostile choice**: the
> checkbox is visible and tickable, and the failure arrives after the user has done the work. A
> rebuild can do better by hiding or disabling it, but should know that **the STORIS data may contain
> vendors whose flags were set while the module was licensed and are now inert**.
>
> `Direct Ship Reserved` and `Require Reservation` on the vendor are **two more inputs to the
> reservation model** batch 2 closed and batch 14 F511 extended. The model has now grown at three
> separate points across three batches; §H carries the running note.

### FINDING 539 — A vendor ship-from is an alternate commercial identity, not an alternate address

- **Invariant:** each ship-from carries its own terms, remit-to, lead days, buying group and freight policy.
- **Evidence** — `Vendor Ship From Settings`:
  > "Use this routine to specify **one or more alternate ship-from addresses** for selected vendors. You use the alternate addresses in purchase orders. **Each address can reside in a foreign country, have specific payable terms, link to a specific vendor remit-to address, be updated with different purchase lead days, tie to an existing buying group, be indicated with user-defined `Freight Policy` codes, and have an `FOB` code identified.**"
  > "After you enter a valid code at the `FOB Code` field, **information on the two freight-forwarder contacts appears on the screen. This information on this screen is display-only.**"
  > "Use this tab to enter additional contact information (if any) for the selected ship-from address. **The system uses the information you enter on this tab only in the absence of an FOB code through which to translate the Freight Forwarder contact information.**"
  Fields include: `Ship-From ID` · `Carrier` · `Ship Instructions` · `Usage` · `Alternative ID` ·
  Purchase Order Delivery (`Lead Days` · `Lead Pad Days` · `PO Pad Days` · `In Transit Days`) ·
  `Payable Terms` · `Allow Payment of Pending Bills` · `Freight Amount` · `Remit-To ID` ·
  `Freight Policy` · `Buying Group` · `FOB Code`.
- **Maps to:** F522 rungs 4–5 · F527 rungs 1–2 · F530 · W-057, W-061, W-062.

> **"Alternate ship-from address" undersells it by a wide margin.** A ship-from record can change
> **who you pay** (`Remit-To ID`, `Payable Terms`), **when it arrives** (four date fields), **what it
> costs** (`Freight Amount`, `Freight Policy`, `FOB Code`), **who carries it** (`Carrier`) and **which
> buying group the volume counts toward**. It is a second commercial relationship wearing the same
> vendor code.
>
> **This is why the lead-days hierarchy has ten rungs.** Four of them (4, 5, and the two that
> in-transit days adds) exist because ship-from is a first-class dimension. A rebuild that models
> ship-from as an address on the vendor will collapse four resolution rungs and get lead times,
> payables terms and landed cost wrong together.
>
> **The FOB fallback is a neat conditional-data rule:** additional contacts are used *only* when no
> FOB code supplies freight-forwarder contacts. Data that is live or dead depending on whether a code
> is present.

---

## C. Screen and field inventory (additions)

Field lists for all nine settings screens are given inline above (F521, F528–F535, F539) rather than
repeated here. Structural summary:

| Screen | Tabs |
|---|---|
| `Vendor Settings` | Contact · Miscellaneous · Payables · Additional Contacts |
| `Advanced Vendor Settings` | General · Shipping · PO Cutting Date · Auto PO Replen |
| `Advanced Regional Vendor Settings` | Shipping · PO Replenishment |
| `Regional Vendor Settings` | General Information · Customer Service |
| `Vendor Ship From Settings` | General · Import Information · Additional Contact |
| `Tracked Storage Location Settings` | General · Putaway · Space Capacity |

**`Advanced Vendor Settings` › General** also carries `Buying Group` ·
`Volume Limit on Replenishment POs | Use Case` · `Lead Days Calculation` · `Default Requested Date` ·
Discount Costing (`Code` · `Type` · `Stock` · `Special` · `Amount` · `Start Date` · `End Date`) ·
Volume Rebates (`Code` · `Type` · `Amount` · `Start Date, End Date`).

**`Advanced Vendor Settings` › PO Cutting Date**:
> "**A cut date is the date on which the collection is no longer available from the vendor. Cutting dates appear on the Product Performance and Purchase Recommendations report.**"
Fields: `Collection Exceptions` · `Collection Code` · `Description` · `PO Cutting Date`.

**`Vendor Settings` › Payables**: `Warranty GL Account` · `Supplies GL Account` · `AP Terms Code` ·
`Remittance Name` · `1099 Required` · `Tax ID Number` · `Class` · `Check Print Bank` ·
`Separate Check per Bill` · `Hold Code` · `Free Freight Minimum` ·
`Suppress Invoice Details on Checks` · `Allow Payment of Pending Bills` ·
`Paid Pending Bill Reimbursement Method`.

**`Vendor Settings` › Additional Contacts** — per contact, `Purchase Order Type` and
`Submission Method`:
> "For each additional contact, you can designate **whether or not they receive a copy of each purchase order and the method by which you transmit the PO.**"

---

## D. Control settings catalog (additions)

| Setting | Record | What it decides |
|---|---|---|
| `Exclude Weekends in Vendor Lead Days` | Purchasing Control Settings | Whether lead days are business or calendar days (F522) |
| `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` | Purchasing Control Settings | Enables in-transit days on PO acknowledgement (F527) |
| `Restrict Delivery Date Based On Available Date` | POS Control Settings › Delivery | Blocks promising dates before stock is available (F523) |
| global `Auto Fill Days` | POS Control Settings | Terminal rung of the auto-fill hierarchy; **0 disables JIT** (F524, F525) |
| `Reserve by Date Type` | Inventory Control Settings | `Order Date` + 999 fill days = order-date-only reservation (F525) |
| `Reservation Priority` | Inventory Control Settings | Consulted by JIT when reserving (F526) |
| add-on cost activation + labels | Costing Control Settings | Gates editing of vendor add-on rows (F530) |
| EDI quantity-change defaults | EDI Control Settings | Global fall-back, opted into per vendor (F532) |
| `Vendor Quantity on Hand` | General System Control Settings | Licensed module validated at vendor save (F538) |
| Country `Masking` fields | Country Settings | Address and phone labels and formats (F537) |

---

## E. Security permissions catalog (additions)

| Permission | Record | Effect |
|---|---|---|
| **`View the True Purchase Order Delivery Date`** | Extended Security (**Purchasing**) | Excludes the pad from every displayed and printed PO date (F523) |
| **`Override Delivery Date Restrictions Based on Available Date`** | Extended Security (**Sales**) | Allows promising dates before availability (F523) |
| *unnamed* — "sufficient staff security" for order save | not stated | Manager override required to save (F523; §H) |

> `Purchase Delivery Pad Days` is the audit's first **value-altering** permission: it changes a
> computed number rather than gating an action. That is a **tenth access-control shape**
> (cf. batch 14 §E, nine).

---

## F. State machines and enumerations (additions)

**The three date hierarchies** — different lengths, different algorithms:

| Value | Rungs | Algorithm |
|---|---|---|
| Purchase lead days | **10** | External service short-circuit, then first-match |
| Purchase delivery pad days | **10** (inherited) | Same chain, applied conditionally on permission |
| Auto-fill days | **4 + 1** | First-match, then **regional value added** |
| In-transit days | **4 + explicit floor** | First-match, EDI vendors only |

**EDI documents named:** `215` (outbound manifest) · `214` (inbound carrier status) · `850` · `855` ·
`860` · `865` · `315`.

**Deletion policies:** six (F536).

**`Velocity`** — used on both product×location and storage-location records; **values undefined at
both ends** (F535).

---

## G. Sequencing rules (additions)

**Group before Category.** Stated twice — F522 rungs 7–8 (*"first by Group, then by Category"* in
F524's wording) — and implemented as a two-level sub-resolver hanging off single fields (F528).

**Resolve once, store the answer.** Auto-fill days are set at order entry and later settings changes
*"affect orders on a go-forward basis only"* (F526). With batch 14's kit prices and the audit's
earlier findings on tax, commission and cost, this is now confirmed as a **house rule** across six
values.

**A regional rung can be additive rather than selective** (F524) — the exception to first-match.

**A licensed external service can replace a whole hierarchy** (F522 rung 1).

**Two switches shorten chains:** Regional Processing removes a rung from purchase status (batch 14
F505) and from lead days (F522 rung 6); EDI activation is what makes in-transit days apply at all
(F527).

---

## H. Open questions and gaps

**Material gaps for the rebuild**

1. **Landed add-on cost precedence is nowhere stated** (F530). Four levels hold values — vendor,
   vendor×region, region×product, product — and no article gives the resolution order. **This feeds
   margin.** The batch's most important vendor question.
2. **Which Vendor EDI fields are STORIS-maintained** (F531). Unstated, and it determines how much of
   the EDI configuration LA Mattress can actually port.
3. **The auto-fill additive term may be single or double** (F524). The Setup article and the
   Exceptions article describe the addition differently. **Resolvable by parity test against live
   STORIS** — flagged as a test, not a vendor question.
4. **How vendor records are classified** (F521). The vendor file mixes suppliers, carriers, landlords
   and the refund vendor; no classifying field is named.
5. **The auto-PO generation formula** (F529). Two averaging periods, a variance window, a variance
   percentage and a minimum sales rate are named; the arithmetic is not published.

**Documented but ambiguous**

6. **"the following five fields" is followed by seven** (F528). Seven is corroborated by the companion
   article. Recorded, not silently corrected.
7. **Two `Cross Dock` flags** (F534) — one on the product×location row (batch 14 F501), one on the
   storage location. Relationship unstated.
8. **`As-Is Reason` on a storage location** (F534). Implies bin placement can classify stock
   condition. Mechanism undocumented.
9. **Putaway tie-break still unstated** (F535) — now confirmed from *both* ends, so this is a genuine
   vendor question, not an unread article.
10. **Partial completion piece selection** (F533). An inbound 214 partial completion must bind to
    specific pieces; run 04 established that binding is deliberately loose. Not documented.
11. **Multi-currency mechanics** (F537). `Currency` and `Update Exchange Rate` exist on the vendor;
    rate source and update trigger unstated.
12. **The unnamed order-save security** (F523).

**Undefined terms — status**

13. **`Staging Area` — CLOSED** (F534). A flag on a storage location.
14. **`CFO Fields`** — fourth sighting (`Special Order CFO Popup`, F531), still undefined.
15. **`Velocity`** — used identically on two records, defined on neither (F535).

> Running count of undefined terms: **seven remain** — `Twilight` · fly-by fulfillment ·
> `Float Label` · `Ship Direct` (on a transfer) · `CFO Fields` · `Bypass Interim` · `Times per Day` ·
> dollars-only adjustment. `Staging Area` is struck. `Velocity` is added as a *new* one.

**Running note — the reservation model has grown three times**

Batch 2 closed it; batch 14 F511 added the regional rung and the four methods; this batch adds
`Direct Ship Reserved` and `Require Reservation` at the vendor level (F538) and the fill-window
mechanics (F524–F526). **The model should be re-consolidated in the run-07 summary** rather than left
across four batches.

**Inferences (recorded as inference, not finding)**

- **I-91** — `Lead Days Calculation` on Advanced Vendor Settings probably selects between calendar
  and business days, pairing with `Exclude Weekends in Vendor Lead Days`. **The docs say nothing.**
- **I-92** — `Volume Limit on Replenishment POs | Use Case` reads like a cap on auto-generated PO
  value, but the pipe-delimited label is unexplained and may be two fields. **Not adopted.**

---

## I. Unknown unknowns

- **A settings screen can hold fields the customer may not edit** (F531). If `Vendor EDI Settings`
  does this, other screens may too, and **nothing marks them**. The audit has read ~40 settings
  records in run 07 assuming every field is site-editable. That assumption is now known to be false
  somewhere and unverifiable everywhere.
- **`ATP Web Service`** (F522) — a licensed external service that **replaces a nine-rung hierarchy**.
  The audit has met licensed *modules*; this is the first licensed *external dependency* that changes
  resolution logic. What else does it override?
- **Inventory can be created by an inbound EDI message** (F532), and **an order can be completed by
  one** (F533). Two write paths into core state with no user. The audit has no inventory of such
  paths.
- **Padded dates reach printed documents and the public website** (F523). A permission that changes
  printed output is a category the audit had not considered; **are there others?**
- **The conversion spreadsheet** (F523) — STORIS ships import tooling for at least one of these
  fields. Its scope is unknown and it is directly relevant to the cutover. Worth asking about
  explicitly.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Vendor** | Any payee — suppliers, carriers, landlords, staff expenses |
| **`RFND` / REFUND VENDOR** | Delivered reserved vendor through which customer refunds are issued |
| **Purchase lead days** | Vendor ship-time, resolved through ten rungs |
| **Purchase delivery pad days** | Cushion added to the lead time **for users lacking `View True PO Delivery Date`** |
| **Auto-fill days** | Days before delivery at which JIT starts trying to reserve; snapshotted at order entry |
| **In-transit days** | Days added to ship date for EDI vendors only |
| **Ship-from** | An alternate commercial identity for a vendor — own terms, remit-to, lead days, buying group |
| **PO cutting date** | Date a collection is no longer available from the vendor |
| **`SCAC`** | Standard Carrier Alpha Code — carrier identifier on 3PL EDI records |
| **`215` / `214`** | Outbound shipment manifest / inbound carrier status message |
| **Staging Area** | A storage location flagged as such — one of seven non-exclusive designations |
| **`Unique Products`** | Limit on how many distinct SKUs may occupy one storage location |
| **Dynamic field** | A prompt whose label and mask come from the Country Settings record |

---

## Contract adjudication — batch 15

| Contract | Verdict | Basis |
|---|---|---|
| **W-014** *(master-data resolution)* | **CONFIRMED — and the audit's assumption revised** | Ten rungs for lead days (F522); not one reusable resolver but several of different shapes |
| **W-016** *(replenishment)* | **CONFIRMED** | Auto PO Replen at EOD, with an explicit non-application (F529) |
| **W-018** *(localisation)* | **NEW — not previously evidenced** | Country masking drives labels and formats (F537) |
| **W-034** *(deletion)* | **CONFIRMED — sixth policy** | State-based: a location must be empty (F536) |
| **W-035** *(payables)* | **CONFIRMED** | Vendor = payee; GL accounts, terms, 1099, check bank (F521, §C) |
| **W-041** *(batch calendar)* | **CONFIRMED — fourth EOD job** | Automatic PO replenishment (F529) |
| **W-050** *(access control)* | **CONFIRMED — tenth shape** | A permission that alters a computed date (F523) |
| **W-051** *(licensing)* | **CONFIRMED, and batch 4 refined** | `Vendor Quantity on Hand` is a true feature toggle, validated at save (F538) |
| **W-055** *(reservation)* | **CONFIRMED — model extended a third time** | Fill window, snapshot, un-reserve on reschedule (F524–F526) |
| **W-056** *(putaway)* | **CONFIRMED — both ends read** | Location-side attributes and physical constraints (F535) |
| **W-057** *(lead time / dates)* | **CONFIRMED — far deeper than the contract assumed** | Three distinct date hierarchies (F522, F524, F527) |
| **W-058** *(EDI)* | **CONFIRMED** | Per-vendor quantity handling with explicit global delegation (F532); 215/214 (F533) |
| **W-059** *(logistics)* | **CONFIRMED** | 3PL can close a delivery via inbound 214 (F533) |
| **W-061 / W-062** *(landed cost)* | **CONTRADICTED in part** | Four configuration levels with **no documented precedence** (F530) — the contract assumed a single vendor-level cost |
| **Viewer-dependent computed values** | **NEW — no contract covers it** | F523 |
| **Additive hierarchy rung** | **NEW** | F524 |

---

## Next — batch 16

The two highest-priority unread security records: **`File Security Groups`** and
**`Field Security Codes`** — the seventh access-control kind, still documented only as two field
names — plus **`Assign Screen Action Permission`** and the standing
**user-versus-group conflict resolution** question, undocumented across all ten security records.
Then `Notifications Control Settings` · `Report on User Security` · `Review Settings Activity` ·
`Switch User`.
