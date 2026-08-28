# Run 05 — Customer Service — Batch 1: Service order core, tickling, COG

Status: complete. Findings 291–303. Read-only throughout. No service order entered, no COG created,
no route completed.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Enter a Service Order** | 15203437572628 | read — **nine pages; the run's core article** |
| 2 | **Tickle Process** | 15203437242900 | read — **names the internal messaging system** |
| 3 | Complete the Servicing Process *(Route Completion)* | 15203457748628 | read |
| 4 | Maintain a Customer's Own Goods (COG) Order | 15203437569428 | read — **closes run 04's COG gap** |
| 5 | Service Linkage Detail | 15203437242004 | read |

---

## B. Wiring findings

### FINDING 291 — `STORIS Messenger` is the internal messaging system, and the tickle process is its largest documented consumer

- **Invariant:** service notifications require an internal messaging subsystem to be active.
- **Evidence** — `Tickle Process`:
  > "The activation of Tickle Processing is controlled by the Service Control Settings "**Tickle Processing Active**" field. **To use this process, STORIS Messenger must also be active on the system.**"
- **Maps to:** run 04 F228 (*"a mail message is sent to the buyer"*) — **the mechanism is now named**;
  **NEW** — no contract covers internal messaging.

> Run 04 batch 6 found one clause about mailing a buyer on an over-receipt and flagged an
> undocumented internal messaging system as a run-level open question. **It is called STORIS
> Messenger**, it is separately activatable, and service notification depends on it.
>
> Note the dependency chain: `Tickle Processing Active` **and** STORIS Messenger active. Turn the
> messenger off and a feature in a different module stops working — the seventh instance in two runs
> of a subsystem's availability changing another module's behaviour.
>
> `STORIS Messenger` has no article in either run-04 or run-05 scope. It is now the highest-priority
> unread subsystem carried forward.

### FINDING 292 — Tickling is a two-part system: a date-difference sweep at Day End, and an event notification matrix

- **Invariant:** customer follow-up is computed nightly; internal notifications are event-driven.
- **Evidence** — `Tickle Process`:
  > "The process works based on the difference between the **Last Contact date** on the Enter a Service Order screen and the **current system date**. **During the Day Ending Process**, the system calculates the difference … for **each open service order**. If the difference **equals or exceeds** the number in the "**Call Customer Days**" field in the **Service Control Settings**, the system **adds the service order to the assigned representative's tickle list**."
  And the event matrix, verbatim:

| Condition | Notifies |
|---|---|
| **Assignment** | Coordinator *(automatic or manual)* · Service Technician *(**manual only**)* · Labor Technician *(**manual only**)* |
| **Call Reminders** *(automatic)* | Coordinator · Service Technician |
| **Scheduled Status** | Coordinator — **header** status · Service Technician — **service line** scheduled status |
| **Service Line Status** | Service Technician — any change. *"Note that Task emails will not be assigned to the user who is making the change to the line status."* |
| **Service Merchandise Movement** *(COGs created, completed or deleted)* | Coordinator · Service Technician · Labor Technician |
| **Deletions** | Coordinator — order **and** line · Service Technician — service line · Labor Technician — labor line |
| **Parts Commitment** *(via Warehouse Receipts & **EOD batch process**)* | Coordinator · Service Technician · Labor Technician |

- **Maps to:** `W-012` (dates and batch processes) — **CONFIRMED**; F291.

> A complete, published **notification routing matrix** — six condition classes across three roles,
> with each cell specifying automatic, manual, or both. This is the most explicit specification of
> "who gets told what" anywhere in four and a half runs, and it is worth implementing as given.
>
> Three details repay attention. **Assignment notifies technicians only on manual assignment** — an
> automatic assignment is silent, presumably because the technician sees it on their schedule
> anyway. **The user making a line-status change is excluded from the resulting notification**, which
> is an obvious courtesy that systems routinely get wrong. And **parts commitment fires from
> Warehouse Receipts and an EOD batch** — so a part arriving on a receiving dock notifies three
> people on a service order, which is precisely the kind of cross-module wiring this audit exists to
> find.
>
> The customer-facing half is different in kind: a **nightly sweep over every open service order**,
> comparing Last Contact to today against `Call Customer Days`. That is a work-queue generator, not
> an event — and it means the tickle list is rebuilt each night rather than accumulated.

### FINDING 293 — Service method is a three-value enumeration, and the third value silently disables two pages

- **Invariant:** In-Home, In-Shop and Stock Merchandise service behave differently at the page level.
- **Evidence** — `Enter a Service Order`, page headings:
  **Customer · Merchandise · Non-Merchandise · COGs · Parts · Labor · Charges · Total · Print Options**
  > **Non-Merchandise:** "Because the system assumes non-merchandise service to be **in-home service**, this page is **active only for In-Home service orders**. … **This page is not active for Stock Merchandise service orders.**"
  > **COGs:** "**COG documents can only be created for In Shop orders.**"
- **Maps to:** run 04 F168 (`S` grid flag `H`/`S`/`B`) · run 04 F181 (in-shop cannot be manifested) —
  **both now explained**; **NEW** — Stock Merchandise service.

> Run 04 established two service methods from the scheduling grid. **There are three.**
> **Stock Merchandise service** — servicing the company's own inventory rather than a customer's
> purchase — never appeared in run 04 because it does not go on a truck to a customer.
>
> The page-level gating is a clean specification:
>
> | Page | In-Home | In-Shop | Stock Merchandise |
> |---|---|---|---|
> | Non-Merchandise | **yes** | no | **no** |
> | COGs | no | **yes** | no |
>
> Non-Merchandise service is for damage the company caused — the article's own example is *"service
> to repair damage to a customer's house that occurred during delivery."* That is a real and
> distinct business case: **a service order with no product on it**, chargeable to nobody, created
> because a delivery went wrong. It links to the delivery module in a way nothing in run 04
> suggested.

### FINDING 294 — Customer's own goods are a document type with their own number, and only In-Shop service creates them

- **Invariant:** a COG document is a movement authority for property the company does not own.
- **Evidence** — `Maintain a Customer's Own Goods (COG) Order`:
  > "You can generate COG documents **only for In Shop service orders**, and you can create new COG documents **only if you access this routine via the COG tab in the Enter a Service Order routine**."
  Fields: **COG Number** · Service Order · Customer · **Move From** · **Move to** *(Customer ·
  Location · Location Code · **New Storage Location** · Vendor · Vendor Code)* · Move Date · Type ·
  Route · Truck · Stop Time · Instructions · Print Delivery Ticket · **Release For Completion**.
  > "If accessing an **existing** COG document, the **Move To fields are not available for change**."
  And from `Enter a Service Order`: *"COG Delivery Document XXXXXXX created."* ·
  > "**To avoid scheduling conflicts, the system links service merchandise movement scheduling and in-shop scheduling.**"
  > "**If the item is on an open sales order you cannot ship COG to customer, you must use sales order to ship the item to the customer.**"
- **Maps to:** run 04 F182 (COG rides the truck, never enters inventory) — **the model, finally**;
  `W-055`.

> Run 04 batch 2 found COG at manifest completion — on the truck, outside inventory, with a
> `New Storage Location`. **This is the document behind it**, and the model is coherent:
>
> - A COG is **a movement, not a holding**: `Move From` and `Move to`, with a date, route, truck and
>   stop time. It exists to authorise and schedule a physical journey.
> - **`Move to` can be a Customer, a Location, or a Vendor** — the three destinations a customer's
>   damaged sofa can go: back to them, to a service shop, or out to the manufacturer.
> - **`Move To` freezes once the document exists.** The destination is decided at creation.
> - It has its own number and its own **`Release For Completion`**, the same one-way gate found on
>   manifests in run 04 F177.
>
> The two constraints are the interesting part. **In-shop scheduling and COG movement scheduling are
> linked** to prevent conflicts — the shop cannot be booked to work on something that is not there
> yet. And **a COG cannot be shipped to a customer if the item sits on an open sales order** — the
> sales order owns that shipment. That is a clean ownership rule between two modules.

### FINDING 295 — Parts, labor and charges must each link to a service line, and none of them can be returned

- **Invariant:** everything billable on a service order hangs off a service line, and only dollars can be adjusted.
- **Evidence** — `Enter a Service Order`:
  > **Parts:** "**All parts on a service order must be linked to a Service Line.** … to link a part to a service order **the part must have been received into inventory**. **Parts cannot be returned or exchanged, but you can perform dollars-only adjustments** on these line items."
  > **Labor:** "you **cannot return or exchange labor items**, you can only perform **dollars-only adjustments**"
  > **Charges:** same wording. Examples given: *"disposal fees or trip charges"*.
  Every one of the three pages carries a **`Linked Service Line`** field.
  And `Service Linkage Detail`: "The grid lists **all linked parts, labor, and charges lines**."
- **Maps to:** run 03 F20 (line item details split by document type); `W-055`; `W-061`.

> **A service order is a tree, not a list**: service lines at the top, with parts, labor and charges
> hanging off each one. `Service Linkage Detail` is the screen that shows one branch, and it also
> exists in a read-only form reachable from `View a Customer's Historical Purchases` — so the tree
> survives into history.
>
> **"Parts cannot be returned or exchanged"** is a hard constraint stated three times in three
> places. Run 03 dissected returns and exchanges in depth on sales orders; **none of that machinery
> applies here.** Only "dollars-only adjustments" — a term used three times and defined nowhere.
>
> **A part must be received into inventory before it can be linked.** So a service order cannot
> promise a part that is on order — it can have a purchase order (there is a `Purchase Order Number`
> field on all three pages) but the link waits for receipt. That is what `Parts Commitment (Via
> Warehouse Receipts & EOD batch process)` in F292's notification matrix is notifying about: **the
> part landed, the service can proceed, tell three people.**

### FINDING 296 — Service orders consume delivery route capacity, on the same terms as sales orders and transfers

- **Invariant:** one capacity pool serves three document types.
- **Evidence** — `Enter a Service Order`, COGs page, **verbatim identical** to `Enter a Transfer`
  (run 04 F250):
  > "the line is checked to ensure the route capacity has not been exceeded. If exceeded, a warning displays "**Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?**" … requires permission found in **Override capacities when scheduling routes that are full** in **Create a User/Group Actions - Logistics Security**; if No is selected, **the line is added to the grid as unscheduled**. … If the added or changed merchandise **reduces** the already exceeded route capacity, **no warning appears, even if the reduction still results in over capacity**."
- **Maps to:** run 04 F250, F193 — **CONFIRMED, third document type**; `W-050`.

> Run 04 batch 3 found route capacity consumed by sales order lines; batch 8 found transfers doing
> the same; **service COG movements make three.** Identical wording, identical permission, identical
> asymmetric warning.
>
> That is worth stating as a design fact: **route capacity is a single shared resource spent by
> three departments at line-save time**, and none of them can see the others' consumption except
> through the capacity log (run 04 F193). The `No`-answer consequence is the same too — **the line
> becomes unscheduled**, joining the population that run 04 F167 showed is invisible to date-filtered
> searches.

### FINDING 297 — Service orders track cost responsibility across four payers

- **Invariant:** the money on a service order is apportioned between the customer and three other parties.
- **Evidence** — `Enter a Service Order`, **Total** page:
  > "**Other Expenses** — If additional expenses arise from **Factory Warranty, Extended Warranty, and/or Other Vendor**, those expenses are categorized into **Parts, Labor, or Charges**. The total of these fields display in their respective Total fields."
  Alongside **Customer Expenses** *(Parts · Labor · Charges)* and **Customer Totals** *(Subtotal ·
  Taxes and Fees · Net Total · Payments · Balance Due)*.
  Corroborated by the reports subsection: **`Report Profitability by Payment Responsibility`**.
- **Maps to:** `W-061` (cost and margin) — **CONFIRMED and extended**; `W-052`; run 02 (protection
  plans), run 03 F151.

> **Four payment responsibilities**: the customer, the factory warranty, the extended warranty, and
> an "other vendor" — and the same three cost categories (parts, labor, charges) are tracked
> separately for each.
>
> This is the answer to a question the audit has carried implicitly since run 02: **protection plans
> and extended warranties are sold in Sales Processing; this is where they are consumed.** A service
> call under an extended warranty puts the parts and labour in the Extended Warranty column, and
> `Report Profitability by Payment Responsibility` is how the business learns whether the plans it
> sold are profitable.
>
> That report title is the most important one in the Views and Reports subsection and it goes
> straight into batch 3's reading list. **The whole protection-plan business case runs through it.**

### FINDING 298 — Right-click escape menus are user-customisable, and the customisation is a settings screen

- **Invariant:** each page's contextual navigation is configurable per screen.
- **Evidence** — `Enter a Service Order`, stated twice:
  > "The following **standard escapes** appear if you right-click your mouse anywhere on this page (except over a grid). To view a right-click menu, **you must first make a valid entry in the key field**. **You can customize your escape menu options by selecting Add Escapes to Current Screen to access Dynamic Escape Settings.**"
  Customer page escapes: `Customer Buy History Inquiry` · `Open Order By Customer Inquiry` ·
  `Open Service Order by Product Inquiry` · `View an Existing Sales Order`.
  Parts page escapes: `Sales Discount Settings` *(read-only version)* ·
  `View Purchase Orders for a Specific Product` · `Warehouse Stock Inquiry (View Product Availability)`.
- **Maps to:** run 04 F199 (Dynamic Escape) · run 03 F155/F156 (Dynamic Tab Settings) — **both
  extended**; run 04 F281.

> Run 04 batch 3 found `Dynamic Escape` as a way to *reach* a screen. This is the other half:
> **`Dynamic Escape Settings` is a screen where a user adds escapes to the page they are on.**
> Navigation is not merely configurable by an administrator — it is customisable in place.
>
> That completes a picture the audit has been assembling for two runs. **Three independent
> composition mechanisms**: Dynamic Tab Settings composes pages, Dynamic Escapes compose navigation,
> and licensed modules add and remove both. Run 04 §I said our screen inventory is a lower bound;
> **the navigation graph is not recoverable at all** — it is per-site and partly per-user.
>
> Note the escapes themselves are good wiring evidence regardless: from a service order you can
> reach the customer's buy history, their open orders, open service orders by product, the sales
> order, purchase orders for a part, and stock availability. **That is the set of questions a
> service coordinator actually asks**, and it tells us what the screen needs to be next to.

### FINDING 299 — Service orders can require audit text, enforced with a loop

- **Invariant:** a setting can make a comment mandatory before a service order saves.
- **Evidence** — `Enter a Service Order`:
  > "When saving a new service order, and **Require Audit Text on Service Orders** within **Point of Sale Control Settings** is enabled, the user is prompted to enter audit comments in the **Text Entry** window. **If no comment(s) is entered, the following message is displayed, "Audit comments must be entered before saving the order." and the Text Entry window reappears.**"
- **Maps to:** run 03 F14 (order changes audited only when a setting forces a comment) — **CONFIRMED,
  service-side**; run 04 F259 (mandatory adjustment comment).

> Third instance across three runs of **mandatory-comment-as-audit-control**, and the enforcement here
> is a genuine loop: the window reappears until something is typed.
>
> This is the seventh sighting of free-text as the audit trail. The pattern is now unambiguous:
> **STORIS's answer to "why did this happen" is a comment somebody was compelled to type.** For the
> rebuild that means structured reason capture where we can, and for the migration it means the
> history we inherit is prose.
>
> A **`Require Audit Text on Service Orders`** field in *Point of Sale* Control Settings is also one
> more field in the record that has now been referenced across all five runs and never enumerated.

### FINDING 300 — Digital service-order notifications go out through a named third-party service, gated by two settings

- **Invariant:** customer-facing digital documents depend on an external provider and two switches.
- **Evidence** — `Enter a Service Order`, **Print Options**:
  > "If the **Digital Receipts Interface** module is set to active in the **General System Control Settings** process **and** the **Digital Receipts Enabled** checkbox is checked for your login location in the **Warehouse Location Settings** process, a **Digital** print option checkbox appears… Selecting this sends a digital Service Order Notification to the customer **via flexEngage processing**."
  Failure is handled and commented, verbatim:
  > "**An error occurred. The digital notification service is unavailable.**"
  > "A digital copy of the receipt for Service Order nnnnn has been sent. Receipt Id – nnnnn"
  > "There was an error emailing a digital copy of the Service Order nnnnn. Receipt Id – nnnnn"
- **Maps to:** run 04 F206 (external dependencies) — **extended**; run 03 F53 (archived signed
  documents); `W-064`.

> **flexEngage** is the eighth named external dependency in two runs — after four routing vendors, a
> fraud-analysis vendor, 3PL/EDI, the alternate tax provider and a third-party WMS. The
> external-dependency inventory flagged since run 04 batch 4 keeps growing, and this one is
> customer-facing: **if flexEngage is down, the customer gets no notification** and the system falls
> back to printing.
>
> The **two-setting gate** — module active system-wide **and** enabled for the login location — is
> the same shape as run 04 F178's two-condition reason-code gate. Third instance of "a switch plus a
> second thing" in the audit.
>
> **Both success and failure are written as service order comments with a Receipt Id.** So the
> notification audit trail is, once again, prose on the document (F299).

### FINDING 301 — There is a plain-email escape hatch that writes nothing back to STORIS

- **Invariant:** the envelope icon opens the local mail client and the resulting email is invisible to the ERP.
- **Evidence** — `Enter a Service Order`:
  > "Click the **envelope icon** to open a new email message window. The email window is via **your default email client on the PC**. … Since the email window is opened via a **separate Windows® process, not STORIS**, the email's functionality (e.g. sending, saving as a draft, etc.) is controlled through the email client. Additionally, **no comments are written to STORIS.**"
- **Maps to:** F300, F299; **NEW**.

> A documented gap in the audit trail, stated by the vendor. **A coordinator emailing a customer from
> the service order leaves no record.** Contrast with F300, where the digital notification writes two
> possible comments with a receipt id.
>
> So there are **three customer-contact channels with three different audit properties**: STORIS
> Messenger tickles (internal, logged as a list), flexEngage digital notifications (external, logged
> as comments), and the envelope icon (external, **not logged at all**). If the business's service
> team uses the envelope icon habitually — and it is the easiest of the three — a large share of
> customer contact history simply does not exist.
>
> Worth raising with them directly rather than discovering it during migration.

### FINDING 302 — Service route completion is the delivery manifest process wearing a different name

- **Invariant:** service and delivery share one completion routine and one exception model.
- **Evidence** — `Complete the Servicing Process` *(subtitled **Route Completion**)* reproduces
  `Complete the Delivery Manifest Process` (run 04 F181, F182) **near-verbatim**: the same
  `Not Completed Location` / `Return Location` / `Transfer Receiving Location` activation rule by
  document type, the same in-shop exclusion, the same COG clause, the same `Bank` / `COD` /
  `Collected` fields, the same Apply Payments path — plus a **`Technician`** field.
  > "This program is the **last step in the service manifest process**."
  > "Service lines with a **Closed Without Completion** status as designated in **Status Code Settings** are recognized as closed lines."
- **Maps to:** run 04 F181, F182 — **CONFIRMED from the service side**; `W-039`.

> Two articles, one routine, two names. **Service manifests and delivery manifests are the same
> machinery**, which is why run 04's grid had a `T` (transaction) value of `S` for service orders
> and why the location fields activate by document type rather than manifest type.
>
> The one addition is **`Technician`** on completion — service manifests carry who did the work,
> where delivery manifests carry driver and delivery associate (run 04 F211). Three crew roles across
> the two, all three unmaintained by any article the audit has found.
>
> **The manifest-exception paragraph here is garbled** in the source: *"If your system is tracking
> manifest completion exceptions via the exception data (for example, delivery manifest items not
> delivered to customers) before purging."* — a sentence with no main clause, evidently a bad edit of
> the version in `Complete the Delivery Manifest Process` (run 04 F180). It does add one fact the
> delivery article did not state: **"If you enter zero here, the system does not retain route
> exception data."** So `Manifest Exception Retention` = 0 disables retention entirely, confirming
> run 04 F180's reading of that field as both switch and bound.

### FINDING 303 — Line items on deposited or financed service orders are locked without a named permission

- **Invariant:** money on the order freezes its line items for most users.
- **Evidence** — `Enter a Service Order`:
  > "To add or delete line items on orders to which **deposits and/or financing have been applied**, users must have access via the **Delete/Edit information on open transactions** field in the **Extended Security settings**. **For unauthorized users, line items on such orders are inactive.**"
- **Maps to:** `W-050` — **CONFIRMED**; run 04 F228 (Extended Security is cross-module) — **confirmed
  again**; run 03 F40 (deposits become uneditable on leaving the order).

> **A state-based lock with a permission escape** — the combination the audit has seen separately
> (run 04 F177's state lock, and ordinary permissions) but rarely together. Taking a deposit changes
> who may edit the order, and the check is on the *money*, not on the order's status.
>
> Note the degradation: unauthorised users see **inactive** line items rather than an error. Same
> graceful pattern as run 04 F170's offer of the read-only viewer.
>
> `Delete/Edit information on open transactions` is a **cross-module Extended Security field** — it
> is phrased generally ("open transactions"), not for service, so it presumably governs sales orders
> too. Run 03 dissected the sales-side deposit rules without naming it.

---

## C. Screen and field inventory

**`Enter a Service Order`** — pages: Customer · Merchandise · Non-Merchandise · COGs · Parts · Labor ·
Charges · Total · Print Options.

| Page | Fields verbatim |
|---|---|
| **Header** | Service Order Number · Last Order · **Available Credit** |
| **Customer → Basic Information** | **Service Method** · **Original Order** · Date · Store · Salesperson · **Coordinator** |
| **Customer Information** | Customer Number · Billing Information *(Primary Name, Home/Cell/Work Phone, Extension, **Alternate Name**, **Relationship**, Primary Email)* · Mail *(Address 1/2, City, State, Zip)* · Shipping Information *(same + Email)*. **"The length of all name elements combined is limited to 50 characters."** |
| **Service Information** | Service Date · Service Time · Status · Service Location · Service Route · **Requested Date** · Instructions for this Fulfillment Only · Print Delivery Instructions for this Address |
| **Contact Information** | Status · Date · **Business Contact** |
| **Tickle Processing** | **Last Date** · **Next Date** |
| **Merchandise** | Product · Description · Serial/Reference Number · **Problem Code** · Technician · **Service Status** · Scheduled · **Current Merchandise Location** · Location Code · Storage Location · Group · Vendor · Purchase Date · **Next COG Status** |
| **Non-Merchandise** *(In-Home only)* | Product · Problem Code · Technician · Service Status · Scheduled |
| **Parts** | **Linked Service Line** · Part Product · Service Method · Brand · Service Location · Stock Location · Purchase Order Number · **As Is** *(mutually exclusive with **Direct Ship**)* · Special Order · Serial/Reference Number · Quantity Ordered · Quantity Available · Direct Ship · Unit Price · Extended Price · Discount Code · Discount Amount |
| **Labor** | Linked Service Line · Labor Product · Service Method · **Labor Vendor** · Service Location · Purchase Order Number · Technician · Special Order · **Labor Time** · **Labor Rate** · Extended Price · Discount Code · Discount Amount |
| **Charges** | Linked Service Line · Charge Product · Service Method · Service Location · Brand · Purchase Order Number · Technician · Special Order · Quantity Ordered · Unit Price · Extended Price · Discount Code · Discount Amount |
| **Total** | Taxes and Fees *(Miscellaneous Fees, Sales Tax)* · **Customer Expenses** *(Parts, Labor, Charges)* · Payments *(Deposits: Payment Type Code, Total Deposit Amount; Financing: Payment Type Code, Total Financed Amount)* · **Other Expenses** *(Factory Warranty, Extended Warranty, Other Vendor → Parts/Labor/Charges)* · Customer Totals *(Subtotal, Taxes and Fees, Net Total, Payments, Balance Due)* · **Receivables** *(Order Outstanding Balance, Customer Current Balance — **label hidden when both are zero**)* · Print Service Order · **Complete Service Order** |

| Other screen | Fields |
|---|---|
| **Maintain a COG Order** | COG Number · Service Order · Customer · Move From · Move to *(Customer / Location / Location Code / New Storage Location / Vendor / Vendor Code)* · Move Date · Type · Route · Truck · Stop Time · Instructions · Print Extended Instructions · Print Delivery Ticket · **Release For Completion** |
| **Service Linkage Detail** | grid of linked parts, labor and charges · **Purchase Order#** · **Acknowledgement#** · **Vendor Invoice#** |
| **Complete the Servicing Process** | Warehouse · Date · Route · Truck · **Technician** · Bank · Type · COD · Collected · New Storage Location · Not Completed Location · Return Location · Transfer Receiving Location · Document · Action |

> **File attachments exist.** *"a paper clip icon appears… If this icon is active, it indicates a
> **file attachment** exists for the selected page or for an item in the order (for example, a
> customer or product)."* **First sighting of document attachment in five runs** — attachments can
> hang off an order page, a customer, or a product. No article describes the mechanism.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Tickle Processing Active** | **Service Control Settings** | Enables tickling; **also requires STORIS Messenger** (F291) |
| **Call Customer Days** | Service Control Settings | Days since Last Contact that put an order on the tickle list (F292) |
| **Verify Labor for In-Home Service Orders** / **Verify In-Shop Service Orders** | Service Control Settings | Warn on saving a scheduled service order with no labor |
| **Require Audit Text on Service Orders** | Point of Sale Control Settings | Mandatory comment, enforced in a loop (F299) |
| **Shipping Ticket** | Point of Sale Control Settings | Print forms for COG delivery and pickup tickets |
| **Digital Receipts Interface** | **General System Control Settings** | Module switch for flexEngage (F300) |
| **Digital Receipts Enabled** | **Warehouse Location Settings** *(per login location)* | Second half of the flexEngage gate (F300) |
| **Multiple Order Copies** | Point of Sale Control Settings | Re-shows Print Options until exited |
| *(Closed Without Completion)* | Status Code Settings | Service lines with it count as closed — **stated in 4 articles across runs 04–05** |
| **Delete/Edit information on open transactions** | **Extended Security settings** | Line-item editing on deposited/financed orders (F303) |

---

## E. Security permissions catalog (additions)

- **`Delete/Edit information on open transactions`** — Extended Security; cross-module (F303).
- **`Override capacities when scheduling routes that are full`** — Logistics Security; **now
  confirmed on a third document type** (F296).
- **Regional Processing** on both `Enter a Service Order` and `Maintain a COG Order` — **seventh
  upholding** of the inverted `W-050` judgment.

---

## F. State machines and enumerations (additions)

- **Service Method (3):** In-Home · In-Shop · **Stock Merchandise** (F293).
- **Page availability by method** — table in F293.
- **Payment responsibility (4):** Customer · Factory Warranty · Extended Warranty · Other Vendor (F297).
- **Cost categories (3):** Parts · Labor · Charges — tracked per payer.
- **Tickle notification matrix:** six condition classes × three roles (F292).
- **COG `Move to` destinations (3):** Customer · Location · Vendor (F294).
- **Named but unenumerated:** `Problem Code` · `Service Status` · `Next COG Status` · COG `Type` ·
  `Coordinator` · `Contact Status` · `Closed Without Completion`.
- **Service crew roles (3):** Coordinator · Service Technician · Labor Technician — plus
  Salesperson on the header.

---

## G. Sequencing rules

1. Service call received → service order entered → **audit text required** if the setting is on (F299).
2. Original sales order exists → **Original Order Piece Selection** lists its products; otherwise the
   product is keyed by hand.
3. Parts must be **received into inventory** before they can link to a service line; the receipt
   notifies three roles **via Warehouse Receipts and an EOD batch** (F295, F292).
4. Saving a scheduled service order **with no labor** warns, if either Verify setting is on.
5. COG created *(In-Shop only)* → `COG Delivery Document XXXXXXX created.` → **`Move To` freezes** →
   scheduled against route capacity → `Release For Completion` (F294, F296).
6. **Day Ending Process** → Last Contact vs today vs `Call Customer Days` → **tickle list rebuilt**
   (F292).
7. Service manifest → `Complete the Servicing Process` → COD payments via Apply Payments → order
   completed (F302).
8. Saving out → **Print Options** → optional flexEngage digital notification → success or failure
   written as a service order comment (F300).

---

## H. Open questions and gaps

### Gated or unreachable

- **`STORIS Messenger`** — named as a prerequisite, no article found. **Highest-priority unread
  subsystem**, and it is the mechanism behind run 04 F228 too.
- **`Service Control Settings`** — three fields named here, record never read. High priority.
- `Status Code Settings` — referenced in four articles across runs 04–05; **`Closed Without
  Completion` is still the only value ever named.** Unread since run 03.
- `Dynamic Escape Settings` · `Original Order Piece Selection` · `Customer Service COG Entry` ·
  `Advanced Customer Settings` · `Alternate Tax Interface Overview` · `Warehouse Location Settings`
  *(distinct from `Warehouse/Store Location Settings`? see below)* — named, unread.
- Carried from run 04: `Costing Control Settings` · `Warehouse/Store Location Settings` ·
  `Point of Sale Control Settings` · `Alert Code Settings`.

### Documented but ambiguous

- **"Dollars-only adjustments"** — used three times for parts, labor and charges; defined nowhere.
  It is the *only* correction mechanism on a service order, so this matters.
- **`Warehouse Location Settings` vs `Warehouse/Store Location Settings`** — the flexEngage article
  uses the shorter name. Same record or two? Not resolved.
- **`Next COG Status`** on the Merchandise page — implies a COG status machine; values unpublished.
- **`As Is` and `Direct Ship` are mutually exclusive** on a part line; the reason is not stated.
- **File attachments** — the paper clip is described, the mechanism is not. What can be attached,
  where it is stored, and its retention are all unknown.
- **The garbled manifest-exception paragraph** in `Complete the Servicing Process` (F302) — recorded
  as it appears, not reconstructed.
- **`Available Credit` on a service order header** — service orders evidently participate in the
  customer credit model; run 04 F201's `C4` confirms they can be credit-held.
- **`Business Contact`** and **`Relationship`** (on the alternate name) — unexplained fields.

### Inferences (recorded as inference, not fact)

- **I-50:** "Dollars-only adjustment" probably means the extended price can be changed but the
  quantity cannot. *Never defined; this is a reading of the phrase.*
- **I-51:** `Warehouse Location Settings` and `Warehouse/Store Location Settings` are probably the
  same record under two names. *Consistent with STORIS's naming drift elsewhere; not stated.*
- **I-52:** `Stock Merchandise` service is probably servicing the company's own inventory before
  sale. *Implied by the name and by its exclusion from Non-Merchandise; never described.*

---

## I. Unknown unknowns

- **Three customer-contact channels with three audit properties** (F301), one of which records
  nothing. The easiest channel is the invisible one.
- **File attachments** exist on orders, customers and products, described in one sentence about an
  icon. **Five runs and this is the first sighting.** Any migration has to account for a document
  store nobody has mentioned.
- **`Available Credit` on a service order** — the service module participates in receivables and
  credit holds, which run 03 dissected purely from the sales side. **Service orders are financial
  documents**, and the audit has been treating them as operational ones.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **STORIS Messenger** | The internal messaging subsystem; prerequisite for tickling |
| **Tickling** | Nightly follow-up sweep plus an event notification matrix |
| **Call Customer Days** | Days since last contact that put an order on the tickle list |
| **Service Method** | In-Home · In-Shop · Stock Merchandise |
| **COG document** | A numbered movement authority for a customer's own goods; In-Shop only |
| **Coordinator** | The service order's owning role, distinct from technicians |
| **Payment responsibility** | Customer · Factory Warranty · Extended Warranty · Other Vendor |
| **Dollars-only adjustment** | The only correction available on parts, labor and charges; undefined |
| **flexEngage** | Third-party service delivering digital receipts and notifications |
| **Dynamic Escape Settings** | User-facing screen for customising right-click navigation |

---

## Contract adjudication — batch 1

| Contract | Verdict | Basis |
|---|---|---|
| **W-012** *(dates and batch processes)* | **CONFIRMED** | Day Ending rebuilds the tickle list; parts commitment fires from an EOD batch (F292) |
| **W-050** *(access control)* | **CONFIRMED — seventh upholding as inverted** | Regional Processing on service entry and COG; state-plus-permission lock on deposited orders (F303); capacity override (F296) |
| **W-052 / W-053** *(GL)* | **CONFIRMED, indirectly** | Four payment responsibilities feed profitability reporting (F297) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED** | Parts must be received before linking; `Quantity Available` on the part line (F295) |
| **W-061** *(cost and margin)* | **CONFIRMED and extended** | Cost split three ways across four payers (F297) |
| **W-039** *(exceptions)* | **CONFIRMED** | Service route completion shares the manifest exception model (F302) |
| **W-005 / W-006** *(special order, direct ship)* | **CONFIRMED** | `Special Order` and `Direct Ship` on parts, labor and charges lines |
| **W-064** *(retention)* | **CONFIRMED** | `Manifest Exception Retention` = 0 disables retention entirely (F302) |
| **Internal messaging** | **NEW — named at last** | STORIS Messenger (F291) |
| **Customer's own goods** | **NEW — model now documented** | F294 |
| **File attachments** | **NEW — first sighting in five runs** | §C |

---

## Next — batch 2

Service lifecycle: `Select Service Lines to Close` · `Reinstate Completed Merchandise Service` ·
`Reason for Voiding Transaction Screen` · `Enter a Service Purchase Order` ·
`Service Problem Entry Screen` · `Service Details Screen` — then the COG, gift registry and delivery
survey family, and the Views and Reports sweep led by **`Report Profitability by Payment
Responsibility`**.
