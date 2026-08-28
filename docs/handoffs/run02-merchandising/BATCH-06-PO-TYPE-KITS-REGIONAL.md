# Run 02 — Merchandising — Batch 6: PO Types, Kits, Special Orders, Labels and Regional Processing

**Status: complete.** 11 articles. Findings 83–94.

**This batch clears the run's biggest blocker.** `Regional Processing` had been referenced without
being read in five consecutive batches. It is read now, and it changes the security picture.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Purchase Order Type Settings** *(linked, System Administration → Vendor Settings)* | /articles/15243030718740 | EXTRACTED — **resolves three batches of open questions** |
| 2 | **View a Purchase Order** | /articles/15295211513620 | EXTRACTED |
| 3 | Purchase Order Kit Master Maintenance Screen | /articles/15202192520852 | EXTRACTED |
| 4 | Special Order Information Window | /articles/15202208000404 | EXTRACTED |
| 5 | Special Order Instructions Window | /articles/15202192721556 | EXTRACTED — thin |
| 6 | Print a Purchase Order Floor Tag | /articles/15202208446612 | EXTRACTED |
| 7 | Print a Purchase Order Product Label | /articles/15202208445076 | EXTRACTED |
| 8 | **Regional Processing Overview** *(linked, Overviews)* | /articles/15185876224660 | EXTRACTED |
| 9 | **Regional Processing - Reporting Rules** *(linked)* | /articles/15185859800340 | EXTRACTED |
| 10 | **Regional Processing - Rules, Notes, and Exceptions** *(linked)* | /articles/15185875941012 | EXTRACTED — very rich |

Discovered and queued: `Purchase Status Settings` · `Review Settings Activity` ·
`Product Kit Settings` · `Enter Special Order Options` · `Quantity and Serial Number Review` ·
`Warehouse/Store Location Settings` → **Default Label Forms** ·
`Create a User/Group Actions - Logistics Security` · `General System Control Settings`
(Licensing / Advanced Settings / Miscellaneous tabs) · `District Settings` · `Region Settings` ·
`Extended Security (Sales)` → `View All Sales Information` · `Report Open To Buy Information` ·
`Report Reconciliation of Inventory to GL Values` · `Costing Table Inquiry`.

---

## B. Wiring findings

### FINDING 83 — Purchase order type is a seven-flag behaviour bundle, and STORIS ships exactly one type
Invariant:  "Use this routine to establish purchase order types that you can use to classify purchase
            orders. **STORIS provides one purchase order type (`STND`=Standard), but you can create
            additional types.** For example, you can create a '**FLOOR**' type to indicate that the
            incoming merchandise is to be used as floor samples."
Fields (verbatim, complete): `Purchase Order Type` · `Description` · **`As-Is Reason`** · `Active` ·
            **`Allow Sales Order Linkage to Purchase Order`** · **`Include in Supply Calculation`** ·
            **`Third Party Purchase Order Changes`** · **`Transfer on Receipt`** · **`Container`**
Audit:      "You can use the **`Review Settings Activity`** routine to report on changes to the
            purchase order types."
Evidence:   Purchase Order Type Settings, /articles/15243030718740
Maps to:    **NEW — and it closes open questions from batches 1, 3 and 4 at once**

> Batch 1 flagged `PO Type` as an unenumerated header field. Batch 3 found it carried
> `Include in Supply Calculation`. Batch 4 found it carried `Transfer on Receipt` and an As-Is reason
> code. Here is the whole object, and the answer to "what are the PO types" is: **there is no
> enumeration, because the customer invents them.** STORIS ships `STND` and nothing else.
>
> That is the single most important structural fact in the batch. **Every purchase order type at
> LA Mattress is local configuration**, and each one carries five independent behaviour switches:
> whether it can be linked to a sales order, whether it counts as supply for replenishment, whether
> third parties may change it, whether receipt triggers an onward transfer, and whether it is a
> container order. **A PO type is a small policy object, not a label**, and the migration must extract
> the live type table before anything else — the behaviour of replenishment, receiving and sales
> linkage all depend on it. Note `Allow Sales Order Linkage to Purchase Order` is new: **PO type can
> forbid sales-order linkage outright**, which is a precondition batch 3's linkage rules never
> mentioned. And `Third Party Purchase Order Changes` is the first sighting of externally-initiated
> PO amendment as a per-type permission — related to, but distinct from, batch 1's
> `EDI - Allow Acknowledgment to Adjust Order Quantity`.

### FINDING 84 — Regional Processing is two separate segmentations — districts for sales, regions for inventory — and it is licensed
Invariant:  "**To segregate sales information, use the `District Settings`. To segregate inventory
            information, use the `Region Settings`. You can use one or both.**"
Invariant:  "**License Regional Processing on the `Licensing` tab of the `General System Control
            Settings`**… The Regional Processing module **can only be set to `Active` if it has been
            `Licensed`**. In addition, in order to activate Regional Processing, **all warehouse
            locations must have Districts and Regions set up (non-null)**. If they are not all set up
            an error message '**All Warehouse Locations must have Districts and Regions set up to
            activate Regional Processing**' displays."
Invariant:  "**Each region is geographically associated with a zip code.**"
Invariant:  "**Regional Processing restriction by district or region is not available to Cloud users.**
            However, Cloud users can use the **location restriction** feature to apply security
            restrictions, and **regional/district pricing is available as well**."
Invariant:  "**You can apply location restrictions even if Regional Processing is not active.**"
Evidence:   Regional Processing Overview, /articles/15185876224660;
            Regional Processing - Rules, Notes, and Exceptions, /articles/15185875941012
Maps to:    **NEW — and it explains five batches of "may be affected by Regional Processing"**

> Two orthogonal geographies over the same locations: **districts slice sales, regions slice
> inventory**, and a location has both. That is why batch 5's merchandising screens and batch 2's
> costing screens carry the same warning — they touch both halves. Two facts matter operationally.
> **It is a licensed module with an all-or-nothing activation gate**: every warehouse must be assigned
> before it can be switched on, so this is not something you enable incrementally. And **Cloud/SaaS
> customers cannot use the region/district restriction at all** — only the flat location-list
> restriction — while still getting regional pricing and landed costs. If LA Mattress is on the cloud
> product, half of what the documentation describes is unavailable, and that materially changes what
> "parity" means here. **Worth confirming with the operator before we build to it.**

### FINDING 85 — Access resolves through a four-level hierarchy that falls back to the warehouse record
Invariant (verbatim, complete): "In general, the Regional Processing hierarchy functions as follows…
            **1.** `Create A User` file indicates **no restrictions** – no further checking is
            performed…
            **2.** `Create a User` file indicates **store restriction** – location-sensitive functions
            are permitted for the **current log-on location only**.
            **3.** `Create A User` file indicates **regional/district restriction** and the Regional
            Processing flag is set - permitted only when associated with the **current log-on
            region/district**.
            **4.** `Create a User` file indicates user is **associated with a list of locations**
            **a.** If a list is specified in the `Create a User` record… permitted only when associated
            with the locations on the list.
            **b. If no list name was found in the `Create a User` record, then the `Warehouse` record
            for the current log-on location is checked for a list.** If found, permitted only when
            associated with the locations on the list."
Also:       "When Regional Processing is active, the location restriction fields in the **`Access` tab**
            of `Create a User` and `Create a User Group` are active. **When Regional Processing is not
            active, these fields in `Create a User` are inactive, while the fields in `Create a User
            Group` are active.**"
Evidence:   Regional Processing - Rules, Notes, and Exceptions, /articles/15185875941012
Maps to:    **W-050 — CONTRADICTED as stated; run 1's "inverted" judgment now has its mechanism**

> A user's data scope is **not a property of the user**. Level 4b is the finding: if the user record
> names no list, **the warehouse record of wherever they logged in supplies one**. So the same person
> sees different data depending on which store they signed in at, and the governing configuration
> lives on a *location* record. Add the Cloud caveat and the user/group asymmetry — user-level fields
> go inactive when Regional Processing is off while group-level fields stay active — and the effective
> permission for one person is a function of four objects: their user record, their group record,
> their log-on location's warehouse record, and a system-wide licence flag.
>
> Run 1 judged `W-050` *inverted* rather than merely wrong. **This is why.** Access in STORIS is not
> granted to a subject; it is derived from context at log-on. Any rebuild that models permissions as
> user→resource grants will not reproduce this, and — more importantly — **any migration audit of "who
> can see what" done by reading user records will be wrong.**

### FINDING 86 — Four merchandising processes ignore location restrictions entirely
Invariant (verbatim): "**The `Product Performance and Purchase Recommendations` routine (Full Buyers
            Worksheet) does not honor location list restrictions. If Regional Processing is active, you
            must have regional access to run this process.**"
            "**The `Report Open To Buy Information` routine does not honor location list restrictions.**
            If Regional Processing is active, you must have regional access to run this process."
            "**The `Automatic Purchase Order Replenishment` process does not honor location list
            restrictions.** If Regional Processing is active, you must have regional access to run
            this process."
            "**To use the `Report Reconciliation of Inventory to GL Values` routine, you must have
            access to all locations.**"
            "**Physical Inventory routines are not affected by Regional Processing restrictions.**"
Costing table (verbatim): "**Because of the nature and construction of the data in the costing table,
            it is not possible for the `Costing Table Inquiry` program to 'slice and dice' based on
            regional and/or access list settings.** The header information, which includes freight and
            landed add-ons, is based on standard regional rules… but **the detail information in the
            grid is completely unfiltered as far as location is concerned. STORIS assumes the
            individual who would typically be reviewing this information would not be restricted.**"
Evidence:   Regional Processing - Reporting Rules, /articles/15185859800340;
            Regional Processing - Rules, Notes, and Exceptions, /articles/15185875941012
Maps to:    **W-050 — CONFIRMED inverted, with named exceptions**

> The exceptions are not edge cases — they are **the buyer's main worksheet, the open-to-buy report,
> the automatic replenishment engine, the inventory-to-GL reconciliation, physical inventory, and the
> costing table inquiry.** Every one of them is a process where a restricted user either sees
> everything or is refused entirely. The costing table admission is the most candid line in the entire
> help center: the grid is unfiltered **because filtering it was impractical**, and the mitigation is
> an assumption about who would be looking. That is a documented, deliberate access-control gap, and
> it exposes unit costs across all locations to anyone who can open the inquiry — subject only to
> batch 2's single `View and access product cost information` flag.
>
> Batch 5 Finding 81 read `Location Restrictions` as a thirteenth access mechanism that filters data.
> That stands, but it needs this qualifier: **it filters data except where it doesn't, and the
> exceptions are exactly the high-value merchandising screens.**

### FINDING 87 — Regional Processing has three optional restrictions that change transactional behaviour, not just visibility
Invariant:  "**`Restrict Customer Lookup`** – … the system restricts the look-up process at `Customer`
            fields **along district lines**."
Invariant:  "**`Restrict Inter-Region Transfers`** – … the system **prevents you from creating automatic
            or manual merchandise transfers that cross regional boundaries**. **NOTE: This setting
            overrides all inter-regional transfers - even if the user has full and unrestricted
            access.** This setting also overrides situations where the user has list access to
            locations in multiple regions."
Invariant:  "**`Restrict Product Use/Lookup By Region`** – … the system restricts product use by regions
            specified at the **`Limit Use By Region`** field in the `Advanced Product Settings`. **To
            access a product that has been restricted by region, a user's log-on region must match one
            of the regions specified.**"
Consequence: "if the stock and ship locations are in different regions and the `Restrict Inter-Regional
            Transfers` flag is set, **you cannot save the item**."
Evidence:   Regional Processing Overview, /articles/15185876224660;
            Regional Processing - Rules, Notes, and Exceptions, /articles/15185875941012
Maps to:    **NEW**

> `Restrict Inter-Region Transfers` is not a permission — it is a **business rule that overrides
> permissions**, explicitly including unrestricted users. And its reach goes past transfers: a sales
> order whose stock and ship locations fall in different regions **cannot be saved**. So a system
> setting configured for inventory governance silently blocks order entry. `Limit Use By Region` on
> the product master is the mirror image: **a product can be made invisible to a region**, which
> interacts with everything in batches 3 and 5 — replenishment, merchandising decisions, the buyer's
> worksheet — none of which mention it.

### FINDING 88 — Access restrictions are routinely and deliberately bypassed, and the bypasses are documented
Documented overrides (verbatim):
- "**If you know the customer's code and you enter it at the `Customer` field, you can override
  region/district and location restrictions.**"
- "The system derives default ship and stock location information from the **zip code record**… **If
  this location is not found on the current user's list of available locations, the system adds it
  temporarily.**"
- "When accessing existing sales, memos and service orders, **the system adds all locations (that is,
  selling, stock, and ship/service) from that document to the list of valid locations for that
  session** regardless of the user's access to those locations."
- "**The system does not enforce access restrictions for `COG` (customer's own goods) documents.** You
  can create COG documents from/to any location regardless of regional or other access restrictions."
- "The `Customer Buy History` report, when accessed via the Customer Return or Exchange processes,
  **shows completed orders regardless of Regional Processing restrictions.**"
- "**You cannot place location restrictions on the `Warehouse/Store Location Settings` process.**"
- "If an inquiry based on customer data contains inaccessible locations, **those locations display
  anyway**… **all information is reported ignoring any restrictions**" *(finance receivables batch
  given as the example)*
- Service location hierarchy is applied "**regardless of user access restrictions**" — five levels:
  customer zip → regional service location by customer zip → writing store's service location →
  regional by writing store → `Service Control Settings` default.
- Transfers: "you must have access to the **transfer-from** location. **You can use any transfer-to
  location regardless of access restrictions**" (except inter-region restriction).
- Container receiving: completing another user's batch validates on **the logged-on user's** access.
Evidence:   Regional Processing - Rules, Notes, and Exceptions, /articles/15185875941012
Maps to:    **W-050 — the strongest evidence yet that it is inverted**

> Eleven documented ways the restriction does not apply, including **"if you know the customer number
> you can override it"** and **a session-scoped widening that permanently loosens your access for as
> long as you have a document open.** COG documents have no restriction at all. Finance receivables
> batches report everything.
>
> Read together with Finding 86, the honest statement of STORIS's access model is: **restrictions are
> a default view, not a boundary.** They shape what you are shown when you browse; they do not stop
> you reaching data you can name, and several whole processes ignore them by design. For LA Mattress
> this is a compliance-relevant finding and belongs beside run 1's four flagged items. It is also a
> design decision the rebuild has to make consciously rather than inherit.

### FINDING 89 — Hard kit masters have their own PO maintenance screen, gated by three conditions and frozen by a transmit flag
Invariant:  "This option is active on the Actions button **only if** the following is true: the
            purchase order **includes a hard kit master**, the hard kit master has a check at either
            the **`Kit number when Printed/e-Transmitted`** or **`Kit number on e-Acknowledgements`**
            fields in the **`Product Kit Settings`**, and **no line items are active in the `Product`
            field**."
Invariant:  "**For hard kit masters with the `Transmit` field active in the `Product Kit Settings`, you
            cannot edit kit components except on partially received orders.** In these cases, you can
            use the Purchase Order Entry screen to edit the quantities of the partially received
            components or delete the line items altogether."
Read-only twin: Actions button on the **Quantity tab** of `View a Purchase Order`.
Evidence:   Purchase Order Kit Master Maintenance Screen, /articles/15202192520852
Maps to:    **NEW**

> Kits are a fourth PO shape (after direct-ship, distributed and special order), with their own edit
> surface and their own freeze rule. The freeze is unusual and worth stating plainly: **a transmitted
> kit's components become editable only once the order is partially received** — the opposite of the
> pattern everywhere else in this section, where receipt *removes* options. Batch 4 Finding 65 also
> established kits cannot go on distributed POs. Combined, kit purchasing is a narrow, special-cased
> path that a rebuild will not get right by generalising from stock POs.

### FINDING 90 — Special order data splits across three windows and originates on the product master
Invariant:  "If the product you specified… is a special order product, this screen appears in which you
            can enter or view special order information **for the selected piece**."
Fields:     **`Frame` · `Color/Grade, Fabric/Finish, Misc/Grade (CFO's)` · `Detail Information`**
Invariant:  "**When creating inventory products, as well as special order products, you can enter
            additional order information for the product** by accessing the screen on the **General
            page, Actions button, `Special Order Info` option in `Advanced Product Settings`**."
Instructions window: "attach special-order instructions to the current item on this purchase order
            **for the benefit of the vendor**. To enter or edit instructions, **the `Product` field must
            contain the product code** of the item whose instructions you want to enter or edit."
Evidence:   Special Order Information Window, /articles/15202208000404;
            Special Order Instructions Window, /articles/15202192721556
Maps to:    **NEW — and it names the fields behind three earlier findings**

> **`CFO`** — Color/Fabric/Options, evidently — is the actual data structure behind everything the run
> has said about "special order details": the mismatch warning on linkage (batch 3 Finding 57), the
> propagation rule (batch 3 Finding 50), the PO→SO push (batch 1 Finding 23). It is **per piece**, not
> per line, which explains why quantity changes on special orders behave differently from stock. And
> the defaults come from the **product master**, so a special order's options are a product-level
> template overlaid per piece — matching batch 3's note that stock products can carry an options
> template too.

### FINDING 91 — Label printing has its own security, its own form hierarchy, and a deliberate refusal to print serials early
Invariant (floor tags): "**NOTE: If you select `POS Inventory Hang Tag` at the `Label Type` field and
            the purchase order has not been received, the print quantity defaults to zero and you
            cannot edit it. This is because, for special order and serial-tracked products, the
            serial/reference number that prints on the label via this process could be different from
            the number that prints when the actual item received into inventory.**"
Permission: "**To allow users to change the `Form Name` or `Print Method` options, enable the `Change
            Floor Tag Print Options` in `Create a User/Group Actions-Logistics Security`.**"
Form hierarchy (verbatim): the four form fields "are available when '**Forms Designer**' is selected in
            the `Print Method` field. **Preferences set here are overridden by those set in the
            `Default Label Forms` section of `Warehouse/Store Location Settings`; if those in
            `Warehouse/Store Location Settings` are set to 'None', preferences set below are
            honored.**"
Forms:      `Stock Label Form` · `Accessory Label Form` · **`Multi-Carton Form`** · **`Cross Dock Form`**
Invariant:  "**This process cannot be used to print labels for purchase orders already received.**"
As-Is:      "you can also use this process to **print As-Is inventory labels** when processing a
            purchase order with a purchase order type that **has an associated reason code**."
Evidence:   Print a Purchase Order Floor Tag, /articles/15202208446612;
            Print a Purchase Order Product Label, /articles/15202208445076
Maps to:    **NEW**

> The hang-tag refusal is a good piece of engineering honesty: **the system will not print a
> serial-bearing tag before receipt because the number would be wrong**, and it enforces that by
> zeroing an uneditable quantity rather than warning. Note the two label programs have **opposite
> receipt gates** — floor tags refuse *unreceived* hang tags, product labels refuse *received* POs
> entirely. `Multi-Carton` and `Cross Dock` forms are the first sighting of either concept in the run,
> both pointing at Logistics. And the form-precedence rule inverts the usual pattern: **the location
> setting wins unless it is explicitly `None`**, in which case the screen wins — a documented
> sentinel, in the same family as `$$$^NN` (run 1) and `"..."` (batch 1).

### FINDING 92 — `View a Purchase Order` exposes a `Billed` quantity, closing the receipt-to-payment loop
Header (verbatim): `Purchase Order` · `Order Date` · **`Status`** · **`Transaction Type`** ·
            **`Purchase Order Type`** · `Buyer ID` · `Container` · `Volume` · **`Transmitted`** ·
            `Weight` · **`EDI Flag`** · `Number of Pieces`
Quantity tab (verbatim): `Product Code` · `Description` · **`Links`** · **`Ordered` · `Received` ·
            `Due` · `Billed`** — "To view additional information **including line items linked to
            sales orders**, double-click on an item."
Billing tab: Vendor · Receiving Location · Merchandise · Freight, Miscellaneous, Tax · TOTAL ·
            **`Freight/Add-on`** · **`Payable Terms`** · **`Estimated Exchange Rate`**
Direct ship: "**If you select a direct-ship purchase order, the customer ship-to address displays in
            place of the receiving warehouse location address.**"
Evidence:   View a Purchase Order, /articles/15295211513620
Maps to:    **W-041 / W-044 — supporting evidence**

> **`Billed` is the fourth quantity on a PO line** — Ordered, Received, Due, Billed — and it is the
> one that ties to batch 2's type-4 cost exception and batch 1's rule that payment approval closes the
> PO. A line can be received and unbilled, or billed at a different cost from the receipt; this column
> is where that gap is visible. **`Estimated Exchange Rate`** is also new and confirms batch 4
> Finding 67's suspicion: the rate on the order is explicitly an estimate, so the rate that ultimately
> feeds inventory cost must be captured elsewhere — still undocumented. `Transaction Type` alongside
> `Purchase Order Type` is a further unenumerated classification.

### FINDING 93 — The Cost tab is called the Dollar tab, and the section's terminology drift is now systematic
Observed conflicts across the run:
| Concept | Name A | Name B | Name C |
|---|---|---|---|
| PO inquiry cost page | **`Cost`** *(tab list)* | **`Dollar tab`** *(body text, and batch 2's discount inquiry)* | — |
| Add-on calculation method | `Landed Cost Distribution` | `Landed Cost Allocation` | — |
| Multi-location list | `Program List Creation` | `Store List Entry` | `Receiving At` / `Receiving Location` |
| Replenishment mode | `Allocated Stock` | `Allocated Order` | — |
| Store-stock availability | `Include Store Stock In Availability` | `Include Store Stock Availability in Calculations` | — |
| Cost visibility permission | "**System** security settings" | "**Extended Security** settings" | — |
| Auto-hold behaviour | creates POs then holds | creates no PO, prints a placeholder | — |
| `Addl Required` formula | `Lead Days / Days Per Week` | `Lead days/7 … + (.05)` | — |
| Minimum quantity | `Minimum Stock Quantity` *(Settings page)* | `Minimum Order Quantity` *(Costing page)* | — |
Evidence:   accumulated across batches 1–6
Maps to:    **NEW — recorded as a finding because it is a migration risk in its own right**

> Run 1's card warned about terminology drift. In Merchandising it is not occasional — **nine distinct
> cases, three of them substantive contradictions rather than synonyms** (the `Addl Required` formula,
> the auto-hold behaviour, the security file). The practical consequence: **we cannot treat the help
> center as a specification for this section.** Every formula and every settings location in this run
> that matters commercially needs confirming against the live system, and the three contradictions
> need settling before anything is built. Recorded here so it does not stay scattered across six H
> sections.

### FINDING 94 — Zip codes silently determine locations, and can widen a user's access as a side effect
Invariant:  "The system derives **default ship and stock location information from the zip code record
            associated with the customer's ship-to zip code settings**. **If this location is not found
            on the current user's list of available locations, the system adds it temporarily.**"
Invariant:  "If the `Sales Order System Control Settings` is not set to default the customer pickup
            location as the store location, **and the customer's default delivery location is outside
            the selling store's region, the customer's shipping location will default as the stock and
            ship location.**"
Invariant:  "On a `Customer Return Drop-Off` transaction, **if the return location determined by the
            system for a given customer is not available to the current user, the return location
            defaults to the selling store.**"
Invariant:  "**Each region is geographically associated with a zip code.**"
Evidence:   Regional Processing - Rules, Notes, and Exceptions, /articles/15185875941012;
            Regional Processing Overview, /articles/15185876224660
Maps to:    **NEW**

> **Zip code is a routing key, not just an address field.** It selects the stock location, the ship
> location, the service location and the region — and when the location it selects is outside a user's
> access, **the system widens the access rather than refusing the transaction.** Two different
> fallbacks apply when that is not possible (customer's shipping location for cross-region delivery;
> selling store for returns), so the same customer can be routed three ways depending on the
> transaction. For a rebuild this is the hidden geography layer under everything, and it lives in a
> zip code table nobody has documented.

---

## C. Screen and field inventory

**Purchase Order Type Settings** — Purchase Order Type · Description · As-Is Reason · Active ·
Allow Sales Order Linkage to Purchase Order · Include in Supply Calculation ·
Third Party Purchase Order Changes · Transfer on Receipt · Container. Shipped type: **`STND`**.

**View a Purchase Order** — tabs **Logistics · Billing · Cost *(called the "Dollar tab" in the body)* ·
Quantity**.
*Header (all pages)*: Purchase Order · Order Date · Status · Transaction Type · Purchase Order Type ·
Buyer ID · Container · Volume · Transmitted · Weight · EDI Flag · Number of Pieces.
*Logistics*: Vendor · Receiving Location · Requested Date · Delivery Date · Dock Scheduled · On Hold ·
Acknowledgement Date, Number · Shipping Instructions · Ship To Location · Carrier.
*Billing*: Vendor · Receiving Location · Merchandise · Freight, Miscellaneous, Tax · TOTAL ·
Freight/Add-on · Payable Terms · **Estimated Exchange Rate**.
*Cost/Dollar*: Product · Description · **Invoice · Net Invoice · Extension** *(double-click for
discounts)*.
*Quantity*: Product Code · Description · **Links · Ordered · Received · Due · Billed** *(double-click
for sales order links)*.

**Purchase Order Kit Master Maintenance Screen** — Purchase Order · Vendor · Grid *(editable Quantity
column)*. Read-only twin on the Quantity tab of `View a Purchase Order`.

**Special Order Information Window** — **Frame** · **Color/Grade, Fabric/Finish, Misc/Grade (CFO's)** ·
**Detail Information**. Entry or read-only.

**Special Order Instructions Window** — free text, per product line, vendor-facing.

**Print a Purchase Order Floor Tag** *(Purchase Order Floor Tag)* — Purchase Order · **Label Type** ·
**Print Method** · **Form Name** · Product · **Print Quantity** · Grid · Run. Direct access to
**`Quantity and Serial Number Review`**.

**Print a Purchase Order Product Label** *(Purchase Order Label Print)* — Purchase Order Number ·
Print Method · **Stock Label Form · Accessory Label Form · Multi-Carton Form · Cross Dock Form** ·
Product · Order Quantity · Print Quantity · Grid · Run.

**Regional Processing configuration** — `General System Control Settings`:
*Licensing tab* — Regional Processing **Active** / **Licensed**.
*Miscellaneous / Advanced Settings tab* — Regional Processing · **Restrict Customer Lookup** ·
**Restrict Inter-Region Transfers** · **Restrict Product Use/Lookup By Region**.
`Create a User` / `Create a User Group` — **Access tab** and **Location Restrictions tab**, covering
**Sales Entry Routines · Sales Inquiries and Reports** *(district)* and **Inventory Entry Routines ·
Inventory Inquiries and Reports** *(region)*, each set to **No Restrictions · Logon Location ·
District · Location List**.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| `As-Is Reason` · `Allow Sales Order Linkage to Purchase Order` · `Include in Supply Calculation` · `Third Party Purchase Order Changes` · `Transfer on Receipt` · `Container` · `Active` | **Purchase Order Type Settings** | **Seven per-type behaviour flags; only `STND` ships** |
| Regional Processing `Licensed` / `Active` | General System Control Settings → Licensing | Enables the whole module; requires all warehouses assigned |
| `Restrict Customer Lookup` | General System Control Settings | Customer lookup filtered by district |
| **`Restrict Inter-Region Transfers`** | General System Control Settings | **Blocks cross-region transfers and cross-region order saves, overriding all user access** |
| `Restrict Product Use/Lookup By Region` | General System Control Settings | Activates `Limit Use By Region` on products |
| `Limit Use By Region` | Advanced Product Settings | Makes a product invisible outside named regions |
| `View All Sales Information` | **Extended Security (Sales)** | Separate sales-data restriction alongside regional |
| `Accessible Locations List` | User file **or** log-on Warehouse Location record | **Fallback list when the user record names none** |
| `Kit number when Printed/e-Transmitted` · `Kit number on e-Acknowledgements` · `Transmit` | **Product Kit Settings** | Whether the kit master screen is reachable; whether components are editable |
| `Change Floor Tag Print Options` | **Logistics Security** | Whether a user may change floor-tag form or print method |
| `Default Label Forms` | Warehouse/Store Location Settings | **Overrides the label screen's form choices unless set to `None`** |
| `Special Order Info` | Advanced Product Settings → General → Actions | Default CFO options for a product |
| Sales Order System Control Settings — pickup-location default | (unread) | Whether cross-region delivery reroutes stock/ship location |
| `Service Control Settings` service location | (unread) | Last resort in the five-level service location hierarchy |
| `Review Settings Activity` | (unread) | **Reports changes to purchase order types** |

---

## E. Security permissions catalog

| Permission / mechanism | System | Gates |
|---|---|---|
| `Location Restrictions` (4-level hierarchy, warehouse fallback) | `Create a User` / `Create a User Group` | Data scope for sales (district) and inventory (region) separately |
| `View All Sales Information` | Extended Security (Sales) | Sales data visibility, independent of regional |
| `Change Floor Tag Print Options` | Logistics Security | Floor tag form/print method |
| Regional Processing licence | General System Control Settings | Whether region/district restriction exists at all |
| **Documented bypasses** | — | Customer number entry · open-document session widening · zip-code temporary location add · COG documents · Customer Buy History in returns/exchanges · finance receivables batches · `Warehouse/Store Location Settings` · transfer-to locations · Physical Inventory · Costing Table Inquiry detail grid |
| **Processes that ignore location lists** | — | Product Performance and Purchase Recommendations · Report Open To Buy Information · Automatic Purchase Order Replenishment · Report Reconciliation of Inventory to GL Values *(all locations required)* |

---

## F. State machines and enumerations

**Purchase order types** — **`STND` (Standard) shipped; all others are customer-defined**, each
carrying seven flags.
**PO line quantities** — **Ordered · Received · Due · Billed** *(plus Available and In-Transit from
earlier batches)*.
**Location restriction levels** — No Restrictions · Logon Location · District · Location List
*(user record, else log-on warehouse record)*.
**Restriction domains** — Sales Entry · Sales Inquiries and Reports *(district)* · Inventory Entry ·
Inventory Inquiries and Reports *(region)*.
**Service location hierarchy (5)** — customer zip → regional by customer zip → writing store →
regional by writing store → Service Control Settings default.
**Special order options** — `Frame` · `Color/Grade` · `Fabric/Finish` · `Misc/Grade` — collectively
**`CFO`s**, held **per piece**.
**Label types** — includes **`POS Inventory Hang Tag`**; forms: Stock · Accessory · Multi-Carton ·
Cross Dock.
**Kit edit states** — transmit-active kits: components locked until **partially received**.
**Sentinels found so far** — `$$$^NN` *(run 1, blocks save)* · `"..."` *(multi-location)* ·
`None` *(label forms, yields precedence back to the screen)*.

---

## G. Sequencing rules

1. Regional Processing cannot be activated until **every** warehouse location has a district and a
   region.
2. Access resolves user record → store → region/district → user list → **log-on warehouse's list**.
3. Four named merchandising/accounting processes bypass location lists; one requires all locations.
4. `Restrict Inter-Region Transfers` overrides all user access and blocks cross-region order saves.
5. A product restricted by `Limit Use By Region` requires a matching log-on region.
6. Opening an existing sales, memo or service order **adds its locations to the session's valid list**.
7. The kit master screen is reachable only with a hard kit master present, the right Product Kit
   Settings flag, and no active line item.
8. Transmit-active kit components are editable **only** on partially received orders.
9. `POS Inventory Hang Tag` cannot be printed before receipt.
10. Product labels cannot be printed for already-received purchase orders.
11. `Default Label Forms` in Warehouse/Store Location Settings wins unless set to `None`.
12. `Review Settings Activity` is the audit trail for purchase order type changes.

---

## H. Open questions and gaps

**Gated or unreachable**
- **Whether LA Mattress is on the Cloud/SaaS product.** If so, region/district restriction is
  unavailable and a large part of this batch does not apply. **This is a question for the operator,
  not the documentation, and it should be settled before the security model is designed.**
- `Purchase Status Settings` — the purchase status enumeration is still not fully known
  (`Dropped`, `Discontinued` and "obsolete" are all we have).
- `Product Kit Settings` — three flags referenced, none read.
- `General System Control Settings` (Licensing / Advanced / Miscellaneous tabs).
- `District Settings` · `Region Settings` · the **zip code record** that drives location routing.
- `Review Settings Activity` — a sixth audit switch/routine? Unknown whether it is opt-in like the
  five found so far.
- `Costing Table Inquiry` — named here; may be the same as `View Product Cost Activity` (batch 2) under
  another name.

**Documented but ambiguous**
- **`Transaction Type`** on the PO header — a second classification beside `Purchase Order Type`,
  never enumerated.
- **`Links`** column on the Quantity tab — a count, a flag, or a drill-down?
- **`Estimated Exchange Rate`** — confirms the PO rate is an estimate; **where the final rate comes
  from is still undocumented**, and it feeds inventory cost.
- **`Invoice` / `Net Invoice` / `Extension`** on the Cost tab — a different vocabulary from
  `Unit Cost` / `Discounted Cost` / `Extended Cost` in PO entry. Same values under different names?
- **`Third Party Purchase Order Changes`** — who is the third party, and what may they change?
- **`Container`** as a PO type flag — is a container PO a distinct shape, like direct-ship?
- **`CFO`** is never expanded; Color/Fabric/Options is the obvious reading but is not stated.
- **`Multi-Carton` and `Cross Dock` forms** — both concepts appear only here.
- Whether `Review Settings Activity` covers all settings files or only some.
- Whether the session-widening rule (opening a document adds its locations) persists past that
  document or for the whole session — the text says "for that session".

**Inferences (not in section B)**
- `CFO` almost certainly stands for Color/Fabric/Options given the field labels; not stated.
- `Costing Table Inquiry` is presumably `View Product Cost Activity`; the two descriptions match.
- `Invoice` / `Net Invoice` on the Cost tab are presumably `Unit Cost` / `Discounted Cost` renamed for
  the inquiry; not stated.
- A `Container` PO type presumably pairs with the separate-freight-bill receiving path (batch 2
  Finding 39); not stated.

---

## I. Unknown unknowns

- **Only one purchase order type ships.** Every other type is customer configuration carrying five
  behaviour switches.
- **PO type can forbid sales-order linkage** — a precondition none of the linkage articles mention.
- **`Third Party Purchase Order Changes`** as a per-type permission.
- **Two orthogonal geographies** — districts for sales, regions for inventory — over the same locations.
- **Regional Processing is licensed, all-or-nothing, and unavailable to Cloud customers.**
- **Access falls back to the log-on warehouse's location list** when the user record names none.
- **User-level restriction fields go inactive when the module is off, while group-level fields stay
  active.**
- **The buyer's worksheet, open-to-buy, and automatic replenishment all ignore location lists.**
- **The costing table inquiry grid is unfiltered by design**, with a documented assumption about who
  would look.
- **Eleven documented ways to bypass access restrictions**, including entering a customer number.
- **Opening a document permanently widens session access.**
- **COG documents have no access restrictions at all.**
- **`Restrict Inter-Region Transfers` overriding unrestricted users** and blocking order saves.
- **`Limit Use By Region` hiding products from regions**, interacting silently with replenishment.
- **Zip codes as the routing key** for stock, ship, service and region — with three different fallbacks.
- **Kit components locked until partial receipt** — the reverse of every other freeze in the section.
- **Refusing to print hang tags before receipt** because the serial would be wrong.
- **`None` as a precedence-yielding sentinel** in label form settings.
- **`Billed` as a fourth PO line quantity.**
- **`Estimated Exchange Rate`** — the PO rate is explicitly not the final one.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| STND | The only purchase order type STORIS ships; everything else is local configuration |
| Include in Supply Calculation | PO type flag: does this order offset replenishment demand |
| Allow Sales Order Linkage to Purchase Order | PO type flag: may this order be linked to sales orders |
| Third Party Purchase Order Changes | PO type flag permitting externally-initiated amendment |
| District | Sales segmentation of locations |
| Region | Inventory segmentation of locations; associated with zip codes |
| Location Restrictions | Per-user data scope; falls back to the log-on warehouse's list |
| Restrict Inter-Region Transfers | System rule blocking cross-region movement, overriding user access |
| Limit Use By Region | Product-level regional visibility restriction |
| COG | Customer's own goods; documents exempt from all access restrictions |
| CFO | Color/Fabric/Options — the special-order option fields, held per piece |
| Hard kit master | Kit whose components appear on the purchase order; own maintenance screen |
| POS Inventory Hang Tag | Label type that cannot print before receipt |
| Multi-Carton / Cross Dock form | Label forms; first appearance of both concepts |
| Billed | Fourth PO line quantity, beside Ordered, Received and Due |
| Estimated Exchange Rate | The PO's currency rate, explicitly provisional |
| Transaction Type | Second, unenumerated PO header classification |
| Review Settings Activity | Routine reporting changes to purchase order types |

---

## Contract adjudication — batch 6

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** | **CONFIRMED INVERTED** — run 1's judgment upheld with mechanism | Access derives from log-on context, not user grants (F85); four merchandising processes ignore restrictions (F86); eleven documented bypasses (F88) |
| **W-044** | **extended** | `Billed` quantity and `Status` make the PO lifecycle four-dimensional (F92) |
| **W-005 / W-006** | **qualified** | PO type can forbid sales-order linkage entirely (F83) |
| **W-041** | **supporting** | `Billed` vs `Received` is where the type-4 cost exception becomes visible (F92) |
| **W-052 / W-053** | **not documented in this section** | — |

---

## Next — batch 7: purchasing reports and inquiries (first half)
