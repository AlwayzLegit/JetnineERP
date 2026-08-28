# Run 04 — Inventory Management (Logistics / Delivery) — Batch 1: Logistical scheduling core

Status: complete. Findings 165–176 *(the audit carries one continuous sequence; run 03 ended at 164)*.
Read-only throughout. No form submitted, no setting saved, no process run. Every page read was a
`storis.zendesk.com/hc/` documentation article.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | Logistical Scheduling | 15201513095060 | read |
| 2 | Logistical Scheduling Screen Grid | 15201528408212 | read — **the grid legend; twelve flag columns** |
| 3 | Schedule Orders with CWC or ASAP Fulfillment Status | 15201528850836 | read — **closes a run-02/03 open question** |
| 4 | Transaction Update - Logistical Scheduling | 15201512904852 | read — **manifest freeze + Logistics Security** |
| 5 | Fulfillment Handling Method Settings | 15201528690708 | read |
| 6 | Fulfillment Handling Method Assignment Settings | 15201513100308 | read |

Named but not yet read (queued): `View Delivery Schedules` · `Route Capacity Control Settings` ·
`Warehouse/Store Location Settings` · `Third-Party EDI Logistics Overview` · `Delivery Company
Settings` · `Hold Code Settings` · `Create a User/Group Actions - Logistics Security`.

---

## B. Wiring findings

### FINDING 165 — Scheduling horizon is checked in two settings records in a defined order, and exceeding it demands a security override

- **Invariant:** how far ahead you may schedule is a location setting with a system fallback.
- **Evidence** — `Logistical Scheduling`:
  > "This process is checked by the **Restrict Scheduled Date** setting **first in Warehouse/Store Location Settings and then in Point of Sale Control Settings**. If scheduling deliveries beyond the number of days defined in these settings, **a security override is required**."
  Confirmed independently in `Schedule Orders with CWC or ASAP Fulfillment Status`:
  > "This process is checked by the Restrict Scheduled Date setting in both Point of Sale Control Settings and Warehouse/Store Location Settings."
- **Maps to:** `W-012` (dates) — **CONFIRMED**; `W-050` (access control).

> A **named fall-through order** — location first, system second — which is the same shape as the
> Credit Card GLA fall-through in run 03 F38 (`Payment Type` record, else `BANK` record). This is
> now a recurring STORIS pattern worth stating as a design rule for the rebuild: **specific record
> first, control record as fallback**, and the fallback is not a default value but a second lookup.
>
> Note also that the override here is a *security* override, not a warning. Scheduling past the
> horizon is a permissioned act.

### FINDING 166 — Delivery charges are recalculated on exactly three changes, and only if a setting says so

- **Invariant:** the delivery charge is derived, not fixed at order entry.
- **Evidence** — `Logistical Scheduling`:
  > "If the **Recalculate Delivery Charge** field is enabled in the Point of Sale Control Settings, the system recalculates delivery charges if a user changes any of the following on an order:
  > - delivery date/Fulfillment Date
  > - delivery status/Fulfillment Status **from EST to SCH**
  > - route code"
- **Maps to:** `W-052` / `W-053` (GL — the charge is revenue) — **CONFIRMED**; run 03 F30 (route code is zip-driven).

> Three triggers, and the second is directional: **EST → SCH** recalculates; the article does not
> say SCH → EST does. A price on the order changes as a side effect of a logistics action, which
> means the delivery charge is a *scheduling* output, not a *selling* output — and if the setting
> is off, the charge quoted at order entry stands forever regardless of where the delivery ends up
> going. That is a real business-policy fork and the setting name is the whole of the decision.
>
> For the rebuild: the sales order total is not stable after order entry. Anything that snapshots it
> — a financing authorisation, a deposit calculation, a commission — has to know this.

### FINDING 167 — `CWC` and `ASAP` orders are rescued from invisibility by a dedicated routine, and it excludes service orders and exchanges

- **Invariant:** unscheduled fulfillment statuses are a distinct population with their own scheduling process.
- **Evidence** — `Schedule Orders with CWC or ASAP Fulfillment Status`:
  > "Use this routine to manually change the fulfillment method of unscheduled sales orders **from Customer Will Call or As Soon As Possible to either Estimated or Scheduled**. … The updated line is validated against the process's own requirements **and against route capacity settings**. If the line does not pass validation, an error message is presented. **Service Orders and Exchanges are not included in the search results.**"
  Search criteria: `Ship Location` · `Fulfillment Status` · `Fulfillment Method` ·
  **`Order Paid in Full`** · **`Fully Reserved Fulfillments`**.
- **Maps to:** run 03 F4, F127 — **the open question carried since run 02 is now closed**.

> This is the answer to a question the audit has carried since run 02 batch 3. `CWC` and `ASAP`
> orders are invisible to date-filtered searches (run 03 F127) because they have no date — and
> **this routine is the only documented way they get one.** It is a manual, grid-based sweep, and
> it is where the work actually happens.
>
> Three things matter for the rebuild. First, **exchanges and service orders are excluded** — an
> exchange sitting in CWC has no documented path back onto a schedule through this routine, and
> nothing we have read says what the path is. Second, the two named search criteria —
> `Order Paid in Full` and `Fully Reserved Fulfillments` — tell us the intended workflow: sweep for
> the orders that are *ready*, and schedule those. Third, **route capacity is enforced here**, so
> the CWC backlog competes for the same capacity as everything else. A large CWC backlog is a
> latent capacity claim that no capacity report will show, because those orders have no date.
>
> The status vocabulary is now four values: **`CWC`** (Customer Will Call) · **`ASAP`** (As Soon As
> Possible) · **Estimated** · **Scheduled**.

### FINDING 168 — The scheduling grid is twelve single-letter flag columns, each a small enumeration, and it is the densest state summary in the ERP

- **Invariant:** an order's readiness to ship is decomposed into orthogonal flags, not a single status.
- **Evidence** — `Logistical Scheduling Screen Grid`, verbatim:

| Col | Meaning | Values |
|---|---|---|
| **Status** | scheduling state | `SCD` scheduled · `EST` estimated · **or the AR credit hold code** |
| **T** | Transaction | `D` Delivery · `X` Exchange · `P` Pickup Customer Return · `T` Transfer · `S` Service Order |
| **D** | Delivery Ticket | `Y` printed · `R` **reprint required** · blank not printed |
| **P** | Pick List | `Y` on pick list · blank |
| **F** | Fill Status | `C` all scheduled quantities reserved · `P` partially reserved · `N` none reserved |
| **M** | Manifest | `Y` on manifest · blank |
| **A** | Available to Ship | `Y` **a portion is *not* available** · blank all available |
| **H** | On Hold | `Y` one or more lines have Hold status · blank |
| **S** | Service | `H` in-home · `S` in-shop · `B` both · blank |
| **U** | Unscheduled | `Y` one or more lines unscheduled *by the user* · blank |
| **R** | Radio Frequency | `Y` submitted for RF picking · blank |
| **OO** | Other Orders | count of the customer's **other** open orders, excluding this row |

- **Maps to:** `W-055` / `W-056` (availability, reservation) — **CONFIRMED**; run 03 F2 (nine line status codes).

> This single article is worth more than most of the section. It is a complete, published,
> value-by-value decomposition of "can this go on a truck", and it decomposes into **ten
> independent booleans and small enums** rather than one status field. Our rebuild will be tempted
> to collapse these into one `fulfillment_status`. **We should not.** Each column answers a
> different person's question — the picker's, the scheduler's, the credit manager's, the service
> coordinator's — and STORIS's operators read them as a row.
>
> Two of them are inverted, and the audit should say so loudly:
> - **`A` (Available to Ship) is `Y` when part of the line is *not* available.** The column name
>   says "available"; the flag means "problem". Anyone reading this column by its name gets it
>   exactly backwards.
> - **`H` and `U` are near-identical conditions distinguished only by intent.** Both mean the
>   scheduled quantity is less than another quantity on the line. `H` (Hold) is when it happens
>   **because reserved > scheduled and the user did not ask for it**; `U` (Unscheduled) is when it
>   happens **because the user specifically unscheduled it**. The system distinguishes *deliberate*
>   from *incidental* shortfall and shows them in separate columns. That is a genuine modelling
>   insight — we would almost certainly have built one flag.
>
> **`D = R` (Ticket Reprint Required)** is a state, not an action — the system tracks that a
> printed ticket has been invalidated. This corroborates the Delivery Ticket Reprints work in the
> earlier standalone handoff.

### FINDING 169 — A credit hold replaces the scheduling status and blanks the delivery date

- **Invariant:** credit hold is displayed *in place of* scheduling state, not alongside it.
- **Evidence** — `Logistical Scheduling Screen Grid`:
  > "The Status column displays SCD for scheduled orders or EST if the delivery/transfer/service date is estimated. **If the order is on AR credit hold, this column displays the appropriate credit hold code (C1, C2, D1, etc.).**"
  and, of the Date column:
  > "**If the order is on credit hold, no date displays in this column.**"
- **Maps to:** `W-024` (holds) — **CONFIRMED and extended**; run 03 F153.

> The status field is overloaded: it carries either a scheduling state or a hold code, never both.
> A held order therefore has **no visible scheduling state at all** on the scheduler's primary
> screen, and no visible date — even if it is in fact scheduled. Combined with run 03 F153 (the
> hold is not released until EOD), an order approved this afternoon shows as held, dateless and
> statusless to the scheduler until tomorrow's batch.
>
> **Three new credit hold codes appear here: `C1`, `C2`, `D1`** — and the "etc." tells us the list
> is longer than the article shows. The audit's sourced set is now eight: `C1` · `C2` · `C6` ·
> `D1` · `D2` · `E1` · `F3` · `F5`. The `C`/`D`/`E`/`F` families are clearly meaningful and we have
> never seen the key. **`Hold Code Settings` is named as a related article on `Logistical
> Scheduling` and is the closest we have come to the enumeration in four runs** — it is queued for
> batch 4 and is now the single highest-value unread article in the corpus, displacing
> `Credit Hold Codes List (AR)` only because it is directly linked from a section we are in.

### FINDING 170 — Putting an order on a manifest freezes every field except two, and editing those two is separately permissioned

- **Invariant:** the manifest is the commitment point; after it, logistics data is read-only by default.
- **Evidence** — `Transaction Update - Logistical Scheduling`:
  > "if the item is on a manifest, **you can edit only the Contact Status and Time fields**, and to edit these fields you must have clearance via the **Update Status and Stop Time for an Order on a Manifest** field in the **Create a User/Group Actions - Logistics Security** settings. If you don't have clearance, a message appears with the option to view the transaction in the **View an Existing Sales Order** routine."
- **Maps to:** `W-050` (access control) — **CONFIRMED, twentieth mechanism**; run 03 F30 (route freezes at manifest), F164.

> Run 03 F30 found that the route freezes at manifest. This is the general rule behind it: **the
> manifest freezes the whole fulfillment**, and the two escape hatches — who the driver calls, and
> when the truck arrives — are exactly the two things that legitimately change after a truck is
> planned. That is a well-chosen boundary and we should copy it.
>
> **`Create a User/Group Actions - Logistics Security`** is a *named permission surface specific to
> logistics*, distinct from the Up System's security tab (run 03 F115) and from InTouch's five-level
> CRM model (F117). This is the **twentieth access-control mechanism** counted in the audit. The
> pattern across four runs is now unmistakable and should be stated plainly: **STORIS does not have
> a permission system. It has about twenty of them, one per functional area, each with its own
> vocabulary.** Any rebuild that unifies them will be more coherent than STORIS and will not map
> one-to-one to how the business currently grants access — that is a migration problem, not a
> design problem, and it needs owning early.
>
> The graceful degradation is worth noting too: without clearance you are *offered the read-only
> viewer*, not just refused.

### FINDING 171 — Logistical Scheduling refuses to combine fulfillments, and sends you to the sales order to do it

- **Invariant:** fulfillment merging is an order-entry act, not a scheduling act.
- **Evidence** — `Transaction Update - Logistical Scheduling`:
  > "The Logistical Scheduling process **prohibits combining fulfillments**, so if using multiple concurrent fulfillments, **rescheduling a fulfillment to the same date as another fulfillment on the same order results in a warning message**. To make the desired change, go into the sales order to reschedule the fulfillment."
- **Maps to:** run 03 F21 (eight rules for moving lines between fulfillments), F27, F29.

> The scheduler can move a date but cannot merge two fulfillments onto it — even though moving a
> date to match another fulfillment's date is exactly what merging looks like from the outside. The
> reason is presumably that merging has the eight-rule machinery documented in run 03 F21, three
> rules of which reach other modules, and the scheduling screen does not run it.
>
> So the same business intent has two paths with different validation, and the system steers you to
> the stricter one. **For the rebuild: the guard is not "don't allow same-date fulfillments", it is
> "don't allow the merge machinery to be bypassed."** If we implement the merge rules in one place
> and call them from both screens, the restriction disappears — which is an improvement, but it
> changes a workflow operators know.

### FINDING 172 — Handling methods are two-character codes that must match a third-party logistics EDI standard

- **Invariant:** an internal code table is externally constrained.
- **Evidence** — `Fulfillment Handling Method Settings`:
  > "enter a **two digit alphanumeric code** into the Handling Method field … up to 50 alphanumeric can be entered to create a description"
  and:
  > "**These handling methods should correlate with codes required by the third party logistics company sent in the 215 document.**"
  Handling methods "can be assigned to products, used in fulfillments or used in delivery charge tables."
- **Maps to:** **NEW** — no contract covers third-party logistics; `W-064`.

> The **EDI 215 (Motor Carrier Pick-Up Manifest)** is named. This is the first hard evidence in four
> runs that STORIS exchanges logistics documents with outside carriers on a standard, and it means
> the handling-method table is **not ours to design** — its values are dictated by whichever 3PL the
> business uses. `Third-Party EDI Logistics Overview` and `Delivery Company Settings` are named as
> related articles and are queued.
>
> Note the reach: one two-character code is referenced from **products** (Advanced Product
> Settings), **fulfillments**, and **delivery charge tables**. It is a small table with three
> consumers, one of which prices the delivery.

### FINDING 173 — Deleting a handling method is guarded by a three-part check across three subsystems

- **Invariant:** code-table deletion is referentially checked, including against historical documents.
- **Evidence** — `Fulfillment Handling Method Settings`:
  > "this process first ensures that
  > - the handling method is not currently used on any **order fulfillments, voided orders or completed orders**;
  > - **no products exist** that contain the handling method in Advanced Product Settings; and
  > - that the handling method **does not exist in the Fulfillment Handling Method Assignment Settings** for any order type."
- **Maps to:** `W-034` (deletion) — **CONFIRMED**.

> The interesting clause is **"voided orders or completed orders"**. The check reaches into history,
> not just live data — you cannot delete a code that a completed order used three years ago. That is
> a deliberate choice to keep historical documents interpretable, and it is the opposite of the
> approach most systems take (soft-delete the code, keep the label). It also means **the handling
> method table only ever grows**, which the business should know before we migrate it.

### FINDING 174 — Handling methods are prioritised per order type, and the priority order *is* the default rule

- **Invariant:** one ordered list serves both as a menu and as a defaulting algorithm.
- **Evidence** — `Fulfillment Handling Method Assignment Settings`:
  > "If multiple fulfillment handling methods are available for an order type (e.g. **delivery, transfer, return or exchange return**), this process also allows the user to **prioritize the handling methods in the hierarchy for each order type**. **This prioritization is also how a handling method is defaulted into the Handling Method field in order entry** when the **Default Handling Methods on Fulfillments** setting in Point of Sale Control Settings is enabled."
- **Maps to:** F172; run 03 F15 (the seven-level price hierarchy a setting can reorder).

> Third instance of a STORIS pattern the audit should now name explicitly: **an ordered list whose
> order is itself the business rule.** We saw it in the seven-level selling-price hierarchy that a
> setting reorders (run 03 F15) and in the thirteen-level landed cost hierarchy (run 02). Here the
> priority list is simultaneously "which methods may this order type use" and "which one appears by
> default" — one artefact, two jobs.
>
> **Order Type is enumerated in the example: delivery · transfer · return · exchange return.** That
> is a fulfillment-level order-type vocabulary distinct from the sales-order type vocabulary in
> run 03. Worth flagging: STORIS has several overlapping notions of "type" and this is a new one.

### FINDING 175 — Advanced Dispatch Track introduces a Manifest Location that outranks the fulfillment's own location

- **Invariant:** with the advanced dispatch module on, the manifest can relocate the fulfillment.
- **Evidence** — `Logistical Scheduling Screen Grid`, on **Deliver From Location**:
  > "If using **Advanced Dispatch Track**, the **Manifest Location, if any, takes precedence over this location**."
  and on **Manifest Location**:
  > "The manifest location is **only available if using Advanced Dispatch Track**; otherwise, this column appears as null (empty)."
- **Maps to:** `W-050`; **NEW** — a licensed module changes a resolution rule.

> A licensed add-on does not merely add a screen; it **inserts a level into a resolution hierarchy**
> that the base product does not have. Turning Advanced Dispatch Track on changes the answer to
> "where does this ship from". Both columns are **hidden by default**, so the field that overrides
> the ship-from location is invisible unless somebody unhides it.
>
> This belongs with run 03 F155/F156 (Dynamic Tab Settings) as evidence that **what STORIS does
> depends on configuration we cannot enumerate from the documentation** — here, on which modules
> are licensed. `Run Dispatch Track Mapping Interface` and `Maintain Un-manifested Fulfillments Sent
> to Dispatch Track` are queued for batch 4.

### FINDING 176 — Stop consolidation is a setting, and it keys on customer *and* Deliver To address

- **Invariant:** two fulfillments become one stop only if both customer and address match, and only if enabled.
- **Evidence** — `Logistical Scheduling`:
  > "To consolidate all orders with the same customer and Deliver To address into a single delivery stop, check the box at the **Consolidate Stops** field in the **Route Capacity Control Settings**."
- **Maps to:** run 03 F29 (consolidating delivery dates reaches across orders, seven eligibility rules).

> Run 03 F29 found date consolidation with seven eligibility rules. This is a *different*
> consolidation — **stop** consolidation, at routing time, with a two-part key and a single on/off
> switch. Two consolidation mechanisms, different keys, different settings records, different
> stages. They are easy to confuse and we should not model them as one thing.
>
> `Route Capacity Control Settings` is a settings record we have not seen before; it is queued.

---

## C. Screen and field inventory

| Screen | Fields / elements verbatim |
|---|---|
| **Logistical Scheduling** — tabs: `Search for Schedules`, `Confirm Schedule` | Search tab: Schedule · Deliver From · Route · Truck · Transfer To · Past Dates · Starting Date · Ending Date. Confirm tab: Delivery Status · Contact Status · Total Stops · Units · Dollars · Volume · Grid Information · Actions |
| **Logistical Scheduling grid** | Order/Transfer number · Deliver-To Name · Status · Deliver From Location *(hidden)* · Manifest Location *(hidden)* · Fulfillment Description *(hidden)* · Date · Route · Truck · Time · T · D · P · F · M · A *(hidden)* · H · S · U · R · City · Account · Zip Code · State · Contact · OO |
| **Schedule Orders with CWC or ASAP Fulfillment Status** | Ship Location · Fulfillment Status · Fulfillment Method · Order Paid in Full · Fully Reserved Fulfillments · Grid Information · Select Orders button · Update button |
| **Transaction Update - Logistical Scheduling** | Transaction · **Credit Hold** · Customer Name and Phone · Contact Status · Date · Delivery Status · Date · Time · Route · Truck · **Remove Quantity Hold** · Other Orders · Orders To Be Scheduled · Actions |
| **Fulfillment Handling Method Settings** | Handling Method *(2 alphanumeric)* · Description *(50 alphanumeric)* · Save · Clear · Delete · translation Action |
| **Fulfillment Handling Method Assignment Settings** | Order Type · Handling Method · Default · Grid Information *(double-click to edit)* |

**Grid sorting behaviour**, documented verbatim and worth copying: default sort is customer name
ascending; one click sorts ascending by that column, a second descending, **a third returns to the
default order**.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Restrict Scheduled Date** | **Warehouse/Store Location Settings**, then **Point of Sale Control Settings** | Scheduling horizon; beyond it needs a security override (F165) |
| **Recalculate Delivery Charge** | Point of Sale Control Settings | Enables recalculation on three named changes (F166) |
| **Allow Order Entry Access in Logistical Scheduling** | Point of Sale Control Settings → **Logistics page** | Lets the scheduler open the order from Confirm Schedule |
| **Default Handling Methods on Fulfillments** | Point of Sale Control Settings | Makes the assignment priority list act as a default (F174) |
| **Consolidate Stops** | **Route Capacity Control Settings** | Merges same-customer, same-Deliver-To stops (F176) |
| *(Closed Without Completion)* | **Status Code Settings** | Service lines with this status are recognised as closed |
| **Update Status and Stop Time for an Order on a Manifest** | **Create a User/Group Actions - Logistics Security** | The only post-manifest edit clearance (F170) |
| *(handling method)* | **Advanced Product Settings** | Products carry a handling method (F172) |

> **`Point of Sale Control Settings` has a `Logistics` page.** This is the first time in four runs
> that any article has named a *page* of that record. The record has been referenced constantly and
> never enumerated; we now know it is at least paginated by functional area, and we have four of its
> fields by name. Recorded in section H as partial progress on the corpus's largest gap.

---

## E. Security permissions catalog (additions)

- **`Create a User/Group Actions - Logistics Security`** — a logistics-specific permission surface.
  Named field: `Update Status and Stop Time for an Order on a Manifest`. **Twentieth access-control
  mechanism in the audit** (F170).
- **Security override** required to schedule beyond `Restrict Scheduled Date` (F165).
- **Read-only twin:** `View Delivery Schedules` is the non-editing version of Logistical Scheduling —
  > "In that routine, you can view but not edit data, for example orders already on a manifest."
  Same separate-process-separate-permission pattern as run 03 F164.
- **Regional Processing** is *not* mentioned on any article in this batch. Noted, not concluded.

---

## F. State machines and enumerations (additions)

- **Fulfillment status:** `CWC` (Customer Will Call) · `ASAP` (As Soon As Possible) · Estimated · Scheduled.
- **Grid Status column:** `SCD` · `EST` · *or a credit hold code*.
- **Transaction type (T):** `D` · `X` · `P` · `T` · `S`.
- **Delivery ticket (D):** `Y` · `R` · blank.
- **Fill status (F):** `C` · `P` · `N`.
- **Service (S):** `H` · `S` · `B` · blank.
- **Booleans:** `P` pick list · `M` manifest · `A` available-to-ship *(inverted)* · `H` hold ·
  `U` unscheduled · `R` RF picking.
- **Credit hold codes** — now eight sourced: `C1` · `C2` · `C6` · `D1` · `D2` · `E1` · `F3` · `F5`,
  and the docs say "etc.".
- **Fulfillment order types:** delivery · transfer · return · exchange return.

> **Terminology drift — record it.** The scheduling article says the status moves **"from EST to
> SCH"**; the grid legend says the Status column displays **`SCD`** for scheduled. `SCH` and `SCD`
> appear in two articles about the same field. One of them is wrong, or they are different fields
> with confusingly similar values, and **the documentation does not say which**. Section H.

---

## G. Sequencing rules

1. Search for Schedules → **must supply schedule type, deliver-from location, and a date range or
   `Past Dates`** before the Confirm Schedule tab activates. Save and Actions are inactive until then.
2. Once Confirm Schedule is entered, the search tab is **visible but frozen**; changing criteria
   requires `Clear` and re-entry.
3. `CWC`/`ASAP` → (this routine) → `EST` or `SCH`, validated against route capacity. On success the
   order **disappears from the grid**.
4. Fulfillment → **manifest** → all fields frozen except Contact Status and Time, and those need
   Logistics Security clearance (F170).
5. Handling method must exist in `Fulfillment Handling Method Settings` **before** it can be assigned
   in `Fulfillment Handling Method Assignment Settings`; deletion is blocked until all three
   references are gone (F173).
6. Delivery-charge recalculation fires **after** a date, EST→SCH, or route-code change, if enabled.

---

## H. Open questions and gaps

### Gated or unreachable

- **`Hold Code Settings`** — linked from `Logistical Scheduling`. **Now the highest-value unread
  article in the corpus.** Queued for batch 4.
- `Route Capacity Control Settings` · `Warehouse/Store Location Settings` ·
  `Third-Party EDI Logistics Overview` · `Delivery Company Settings` ·
  `Create a User/Group Actions - Logistics Security` — all named, none read. Queued.
- `Point of Sale Control Settings` — still not enumerated, but we now know it has a **Logistics
  page** and four of its field names.
- `View Delivery Schedules` — the read-only twin; not in the Fulfillments article list. Location unknown.

### Documented but ambiguous

- **`SCH` vs `SCD`** — the same scheduled state named two ways in two articles (F168, F166).
- **Credit hold code families.** `C`, `D`, `E`, `F` prefixes are clearly structured; the key is
  undocumented, and "etc." concedes the published list is incomplete.
- **Exchanges and service orders in `CWC`** — excluded from the CWC/ASAP scheduling routine (F167).
  How they get scheduled is not stated anywhere we have read.
- **Whether SCH → EST recalculates the delivery charge.** Only EST → SCH is named (F166).
- **`Remove Quantity Hold`** — a field on Transaction Update, unexplained. Presumably clears the
  `H` flag; the article does not say, and `Remove Items from Delivery Hold Status` is a separate
  routine queued for batch 4.
- **`Contact Status`** — a field and a grid column across three screens, never enumerated.
- **`Volume`** — a total on the Confirm Schedule tab; `View Trailer Volume Capacity Levels` exists,
  so volume is a capacity dimension. Its unit is not stated.

### Inferences (recorded as inference, not fact)

- **I-20:** `Remove Quantity Hold` on Transaction Update probably clears the grid's `H` flag.
  *No article connects them.*
- **I-21:** `SCD` and `SCH` are probably the same state under two spellings rather than two states.
  *Not stated; the alternative — that they are different fields — is not excluded.*
- **I-22:** The credit hold letter prefixes probably encode a hold *family* (`C` credit, `D` ?,
  `E` exchange, `F` finance) given `E1` = exchange-at-entry and `F3`/`F5` = finance/licence.
  *This is pattern-matching across four runs, not documentation.*

---

## I. Unknown unknowns

- **Licensed modules change resolution rules, not just feature availability.** Advanced Dispatch
  Track inserts Manifest Location above Deliver From Location (F175). We do not know how many other
  rules change with licensing, and the documentation gives no list of licensable modules.
- **Hidden-by-default columns.** Three of the grid's columns are hidden by default, including the
  one that overrides ship-from location. **A field being documented does not mean an operator has
  ever seen it** — which undermines using "what do you look at" interviews to build the inventory.
- **Twenty permission surfaces and counting.** Each new functional area has produced a new one. We
  should stop expecting a unified permission model to appear.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Logistical Scheduling** | The scheduler's main screen: search for fulfillments, confirm them onto dates |
| **Fulfillment** | The shippable unit; one order can carry several concurrently |
| **`SCD` / `SCH`** | Scheduled (two spellings across two articles) |
| **`EST`** | Estimated delivery date, not committed |
| **Manifest** | The truck-day document; committing to it freezes the fulfillment |
| **Advanced Dispatch Track** | Licensed module adding Manifest Location and mapping |
| **Handling Method** | 2-char code matching a 3PL's EDI 215 codes; on products, fulfillments and charge tables |
| **EDI 215** | Motor Carrier Pick-Up Manifest — the external standard constraining handling methods |
| **Route Capacity Control Settings** | Settings record governing stop consolidation and capacity |
| **Logistics Security** | The logistics-specific permission surface |
| **`OO`** | Other Orders — the customer's other open orders, excluding this row |
| **Fill Status** | Reservation completeness: all / partial / none |

---

## Contract adjudication — batch 1

| Contract | Verdict | Basis |
|---|---|---|
| **W-012** *(dates and periods)* | **CONFIRMED** | Scheduling horizon enforced from two records in order (F165) |
| **W-024** *(holds)* | **CONFIRMED and extended** | Hold replaces status and blanks the date; three new codes (F169) |
| **W-034** *(deletion)* | **CONFIRMED** | Three-part referential guard reaching into history (F173) |
| **W-050** *(access control)* | **CONFIRMED — twentieth mechanism** | Logistics Security; read-only twin (F170) |
| **W-052 / W-053** *(GL)* | **CONFIRMED, indirectly** | Delivery charge — revenue — recalculates on logistics events (F166) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED** | Fill Status, Available to Ship, Hold and Unscheduled flags (F168) |
| **W-064** *(retention)* | **consistent** | Handling methods cannot be deleted while historical documents reference them (F173) |
| **Third-party logistics / EDI** | **NEW — no contract covers it** | F172 |
| **Licensed modules altering resolution** | **NEW** | F175 |

---

## Next — batch 2: manifest lifecycle

Build a Delivery/Service/Transfer Manifest · Complete the Delivery Manifest Process · Complete
Multiple Manifests · Manifest Not Delivered Reason Screen · Pieces Not Completed Detail · Confirm
All Serial Numbers.
