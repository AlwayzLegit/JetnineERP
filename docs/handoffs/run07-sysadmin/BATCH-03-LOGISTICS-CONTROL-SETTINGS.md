# Run 07 — System Administration — Batch 3: Route capacity, route mapping, EDI, WMS

Status: complete. Findings 366–376. Read-only throughout. No setting saved, no route calendar
rebuilt.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Route Capacity Control Settings** | 15186453252372 | read — **four capacity dimensions, per weekday** |
| 2 | **Route Mapping Control Settings** | 15186502470164 | read |
| 3 | **EDI Control Settings** | 15186501753236 | read — **six named EDI document types** |
| 4 | **Warehouse Management Control Settings** | 36103270474004 | read — the WMS boundary |

---

## B. Wiring findings

### FINDING 366 — Route capacity is four dimensions set per day of the week

- **Invariant:** each weekday carries its own four-way capacity ceiling per route type.
- **Evidence** — `Route Capacity Control Settings` *(tabs: **Sun – Sat**, **Settings**)*:
  > "Use this routine to specify **global delivery-capacity cutoff points for selected days of the week**. You can set up **any combination of the following four cutoff points**: **number of stops · number of pieces · dollar value of goods being delivered · capacity units available on the trucks**"
  > "For example, you can specify a maximum of **five stops for Monday through Friday**, a maximum of **seven stops for Saturday**, and **no stops for Sunday**."
  Fields per day: **`Maximum Stops` · `Maximum Pieces/Hours` · `Maximum Dollars` · `Maximum Volume`**,
  scoped by **`Route Type`**.
- **Maps to:** run 04 F193, F194, F196 · run 04 F250 · run 05 F296 — **the configuration behind all
  three**; `W-055`.

> Run 04 F193 found capacity consumed per line by three document types and logged with before/after
> state; F196 found volume measured against `Trailer Capacity`. **This is where the ceilings are set**,
> and there are four of them, per weekday, per route type.
>
> **`Maximum Pieces/Hours`** is a single field with two units in its name — so a route's capacity can
> be expressed in pieces *or* labour hours depending on how the site thinks. That is a real modelling
> choice hiding in a slash.
>
> The Sunday example is the giveaway that this is a working-calendar tool, not just a limit: **zero
> stops on Sunday is how a site closes a day.**

### FINDING 367 — Three threshold percentages create a soft overage band above each ceiling

- **Invariant:** a route may be filled past its maximum without an override, then closes.
- **Evidence** — `Route Capacity Control Settings`, **Settings** tab:
  **`Unit Capacity Threshold %` · `Dollar Capacity Threshold %` · `Cube Capacity Threshold %`**
  > "Below is an example of how to allow users to add to the route and go over capacity but then have the route close:
  > – Determine the **minimum volume at which the route should be closed** (example **4,800**)
  > – Determine the **maximum volume that you would allow** on the route (example **5,280**)
  > – Set your **Maximum Volume** field to 4,800 and set the **Cube Capacity Threshold** field to **10%**
  > In this example, if the current volume is **4,780**, the user is **allowed to choose the route and bring the capacity to 5,280 without requiring override**. Additionally, **the route is closed as soon as 4,800 is exceeded**, preventing that route from being chosen."
  Plus **`Warning Message When Over Capacity`** and **`Consolidate Stops`**.
- **Maps to:** run 04 F194 (*"routes can go over capacity"*) — **CONFIRMED and explained**;
  run 04 F250; run 04 F198 (`Exclude Closed Routes`); `W-050`.

> **This closes two run-04 questions at once.** F194 inferred capacity was soft from a
> `Limit Search to Over Capacity` checkbox; F198 found routes could be *closed* without knowing what
> closed them. **The threshold percentage does both**: it defines a band above the maximum that may be
> filled freely, and **crossing the maximum closes the route.**
>
> The worked example makes the semantics precise and slightly counter-intuitive: the *maximum* is the
> **closing trigger**, and the *threshold* is the **overshoot allowance** for whoever is already
> booking. So a route closes at 4,800 but the order in flight may take it to 5,280.
>
> That reconciles run 04's two observations — routes exceed capacity **and** capacity is enforced —
> which looked contradictory from the logistics side. **The override permission (run 04 F250) is for
> going beyond the threshold, not beyond the maximum.**

### FINDING 368 — Changing a capacity ceiling prompts a route-calendar rebuild, and declining can leave routes over capacity

- **Invariant:** capacity maxima are copied into route calendars, and the copies do not update automatically.
- **Evidence** — `Route Capacity Control Settings`:
  > "**Adjustment to any of the below fields results in a message with the option to rebuild the route calendar.** If you choose to rebuild, the new maximum level(s) for **all route calendars for all route types for all days** are adjusted, **including maximum levels that have been manually adjusted**. If you do not choose to rebuild, the changes to the maximum level(s) are saved **but maximum levels for existing routes are not changed**. Only route calendars **created after this adjustment** are affected. **This may cause routes to go over capacity.**"
  > "The values you enter here **default into the Route Capacity Settings whenever you create a new route code**, but you can use that routine to specify cutoff points for **individual routes. Cutoff points for individual routes override any global cutoff points.**"
  > "You can **audit changes to the above fields via the Track Settings Activity routine.**"
- **Maps to:** F366; run 04 F194; **the tenth fall-through hierarchy**; `W-064`.

> **A copy-on-create hierarchy, not a live lookup.** Global values seed a route's own capacity
> settings at creation; thereafter the route's values win. So the "global" settings are a **template**,
> and changing them does nothing to existing routes unless you accept the rebuild — **which then
> overwrites every manual adjustment anyone has made.**
>
> That is a genuinely awkward pair of choices, and the vendor states the consequence of each plainly,
> including *"this may cause routes to go over capacity."* It is the eleventh instance of the
> detect-and-warn house style, now applied to the administrator.
>
> **`Track Settings Activity`** is the find. **A routine that audits changes to settings** — the audit
> has spent seven runs cataloguing what settings do and has never seen anything that records who
> changed them. It is named here and is unread. **Queued as a priority**: if it covers all control
> records, it is the answer to "what changed and when" for the entire configuration.

### FINDING 369 — Route mapping carries four physical defaults that feed the capacity model

- **Invariant:** stop time, unload time, volume and weight have system defaults used when product data is absent.
- **Evidence** — `Route Mapping Control Settings`:
  **`Base Stop Time` · `Default Unload Time` · `Default Volume` · `Default Weight` ·
  `Service Base Stop Time` · `Days to Hold Mapping Exceptions`**
  > "Use this routine to define default information for use with **third-party routing/mapping interfaces**. Note that the **Third-Party Mapping Interface is active only for locations enabled via the `Route Map Interface` field on the Inventory & Logistics tab in the Warehouse/Store Location Settings.**"
  Sourced from: **`Advanced Product Settings`** and **`Category Settings`**, then these defaults.
- **Maps to:** run 04 F196 (volume as a capacity dimension) · run 04 F175, F185, F206 (mapping as a
  licensed module) — **all extended**; F366.

> **Volume and weight resolve product → category → system default** — an **eleventh fall-through
> hierarchy**, and the one that makes run 04 F196's `Trailer Capacity` computable. If a product has no
> cube, the category's is used; if the category has none, the system default is.
>
> **That means every capacity number in the system is partly estimated**, and a product with no
> measured cube silently contributes the default. For a mattress retailer, where cube is the binding
> constraint, **the quality of the volume data is the quality of the capacity model** — a good
> question for the business.
>
> **`Base Stop Time` and `Default Unload Time`** are the labour side, and `Service Base Stop Time` is
> separate — service calls take longer than drops. This is what `Maximum Pieces/Hours` (F366) measures
> against when a site uses hours.
>
> **Mapping is enabled per location**, via `Route Map Interface` in Warehouse/Store Location Settings —
> so run 04's seven findings about mapping changing base behaviour apply **per warehouse**, not
> system-wide. That materially narrows F331's silent no-truck-no-pick condition.

### FINDING 370 — Orders on credit hold can be routed, by setting

- **Invariant:** held orders are includable in the mapping export.
- **Evidence** — `Route Mapping Control Settings`, **STORIS and Advanced Dispatch Track Interface**:
  **`Include Orders on Credit Hold`** · `Include Non-Inventory Lines` ·
  `Suppress Non-Inventory Price and Quantity` · `Include Vendor Model Number` ·
  `Use Order Quantity instead of Delivery Quantity - STORIS ONLY` ·
  **`Include Unreserved Fulfillments - Advanced Dispatch Track Only`** ·
  `Automatically Complete Unlinked Non-Inventory Lines` · `Include Fulfillments with Reserved Transfers`
  · `Pick by Route When Mapping Active` · `Load Address Corrections` · `Include Non-Inventory Dollars`.
- **Maps to:** run 04 F169 (a credit hold blanks the delivery date and replaces the status) ·
  run 04 F201 · run 04 F208; `W-024`.

> Run 04 F169 found that a credit hold **replaces the scheduling status and blanks the date** on the
> scheduler's grid. **This setting lets those same orders be sent to the routing system anyway** —
> planned into a truck's day while the scheduler sees them as held and dateless.
>
> That is defensible (plan optimistically, release later) and it is a real inconsistency between two
> views of the same order. **Worth asking whether it is on**, because it changes what a route's
> capacity numbers mean: a route can be full of orders that cannot ship.
>
> **`Include Unreserved Fulfillments - Advanced Dispatch Track Only`** is the API-side counterpart of
> run 04 F208's two auto-transfer settings — **run 04 inference I-30 guessed exactly this** and flagged
> that the differing names might mean they are not equivalent. They are still not stated as
> equivalent, but the audit now has all three in one place. I-30 remains an inference.

### FINDING 371 — Six EDI document types are named, and inbound EDI is processed at End of Day

- **Invariant:** STORIS exchanges six numbered EDI transaction sets, with inbound processing on the nightly cycle.
- **Evidence** — `EDI Control Settings`:
  > "Use the EDI feature to **electronically transmit and receive purchase orders, invoices, and other documents**."
  Named in the field list: **810** *(invoice)* · **855** and **865** *(PO acknowledgement and change)* ·
  **856** *(advance ship notice)* · **997** *(functional acknowledgement)* · **215** *(pickup manifest)*.
  > "**Process Inbound EDI During End of Day**"
  > "To use the EDI module, a STORIS representative must set **EDI Processing to "Active" on the Active Add-Ons tab of the General System Control Settings**."
  Retention: **`Days to Archive` · `997 Late Days` · `Unreceived 997 Purge Days` ·
  `Purge Days for EDI 215 Transaction Logs`**. Plus `Live Account Directory Path` ·
  `I/O Data Directory Path - Live` · `I/O Data Directory Path - Learn` · `Last Control Number Used`.
- **Maps to:** run 04 F284 (an eight-report EDI exception surface) · run 06 F287 · run 04 F254, F172 —
  **all confirmed and numbered**; `W-064`.

> Run 04 F284 inferred *"at least eight document types"* from report titles and could number only two
> (214, 215). **Six transaction sets are now named by number**, and with 214 from run 04 F254 that is
> **seven**: 214 · 215 · 810 · 855 · 856 · 865 · 997.
>
> **`997 Late Days` and `Unreceived 997 Purge Days`** confirm run 04 F284's reading that functional
> acknowledgements are tracked as a transport-level guarantee — there is a lateness threshold and a
> purge for ones that never arrive.
>
> **An `I/O Data Directory Path - Learn` alongside `- Live`** means there is a **training or test
> environment** with its own EDI paths. First sighting of a non-production environment in seven runs.
>
> **`Last Control Number Used`** is the EDI interchange control number — a system-wide sequence that
> **must not collide** across environments. That is a concrete cutover hazard: running a parallel
> system that also sends EDI would break the sequence with the trading partner.

### FINDING 372 — Incoming vendor invoices are held on any of six variance conditions, and a hold code is mandatory

- **Invariant:** EDI-imported AP bills are gated by six independently switchable conditions.
- **Evidence** — `EDI Control Settings`:
  > "The following check boxes control the processing behavior for exceptions encountered during the import of EDI invoices during the **Import Received EDI Documents** process."
  > "**If any of the following check boxes are checked and hold code has not been entered, the user receives an error message and is unable to save the record.** The error message is "**A Hold Code must be entered if incoming Bills will be placed on hold.**""
  **`Hold Incoming Bills with no Variances` · `Incoming Bill Price Greater` ·
  `Incoming Bill Quantity Greater` · `Incoming Bill Quantity Lower` · `Incoming Bill with Tax` ·
  `Incoming Bill with Miscellaneous Charges` · `Incoming Bill with Freight Charges`**
  With **`Hold Code for Incoming Bills`**.
- **Maps to:** run 04 F203 (AP hold codes are a distinct namespace) — **the automated consumer**;
  run 01 (payables); `W-024`; `W-042`.

> **This is the AP hold namespace being driven by machine input.** Run 04 F203 found `Hold Code
> Settings` defines vendor-level AP hold codes and that the namespace is distinct from credit holds.
> Here those codes are applied automatically to **electronically received invoices** on seven
> conditions — six variance types plus, notably, **`Hold Incoming Bills with no Variances`**, which
> holds everything.
>
> **The mandatory-hold-code validation is the interesting bit**: STORIS refuses to save a
> configuration that would hold bills with nowhere to put them. That is **the first hard configuration
> validation the audit has found** — everywhere else (run 07 F350's average-cost warning, F368's route
> rebuild) the system advises and lets you proceed. Here it blocks.
>
> Three of the six conditions concern **things being on the invoice at all** — tax, miscellaneous
> charges, freight — rather than mismatches. So a site can hold every invoice that carries freight,
> which is a sensible control for a business where freight is a landed-cost component (run 07 F347).

### FINDING 373 — Vendor-transmitted quantity changes can rewrite the purchase order, within a ceiling

- **Invariant:** 855/865 acknowledgements update PO quantities per two switches and a maximum.
- **Evidence** — `EDI Control Settings`, **Update Quantity for Acknowledged PO**:
  > "The following settings indicate how **quantity changes transmitted by a vendor on an 855 or 865 transaction are handled on the purchase order**. **If you do not enable these settings, purchase orders are not updated with quantity changes.** You have the option to set this **globally or by vendor in the Vendor EDI Settings**."
  **`Decreases` · `Increases Within the Maximum` · `Maximum Quantity Increase` ·
  `Suppress Date Change on Acknowledgement`**
  Plus **`Update Costs for Acknowledged PO`** and **`Update Costs on Vendor Billing`**.
- **Maps to:** run 04 F228 (over-receipt rewrites the PO's ordered quantity) — **a second rewriting
  path**; `W-042`; `W-005`; `W-061`.

> **A second mechanism by which the purchase order stops being a record of what we ordered.** Run 04
> F228 found receiving more than ordered **rewrites the PO's ordered quantity at receipt**; this lets
> **the vendor** rewrite it by EDI message, asymmetrically — decreases freely, increases only up to a
> configured maximum.
>
> **`Update Costs for Acknowledged PO`** is the one to flag for the cost chain: a vendor
> acknowledgement can change the PO cost, and by run 07 F348's four check moments, **PO entry is a
> zero-cost check point**. An acknowledgement arriving with a cost is a cost event.
>
> The **global-or-by-vendor** option is the **twelfth fall-through hierarchy** in the audit, and
> `Vendor EDI Settings` is a record the audit has not seen.

### FINDING 374 — Direct-ship tracking notifications go out by one of two channels, distinct from digital receipts

- **Invariant:** ASN-derived customer notifications have their own channel choice.
- **Evidence** — `EDI Control Settings`, **Tracking Number Notification**:
  > "Choose how the **Direct Shipping Notification information (ASN 856)** is to be communicated to the customer. For integration with flexEngage, see the flexEngage section of **External Communications Settings**. **These settings pertain only to Direct Shipping Notification information, while the `Digital Receipts Enabled` setting in Warehouse/Control Settings pertains only to sales and service documents.**"
  **`Use ELP` · `Use Digital`**
- **Maps to:** run 05 F300 (flexEngage digital receipts) · run 04 F205 (direct-ship tracking capture);
  **a fifth notification channel**; `W-005`.

> Run 04 F205 found tracking numbers captured at direct-ship completion and noted *"where it is
> surfaced to the customer, nothing says."* **Here it says**: the ASN 856 drives a customer
> notification, through **`ELP`** or **`Digital`** (flexEngage).
>
> **`ELP` is a new, unexplained acronym** — a fifteenth undefined term for the audit's list.
>
> The explicit boundary statement matters: **direct-ship notifications and digital receipts are
> configured separately and can differ.** A site can send digital receipts and not tracking
> notifications, or vice versa. Run 05 F301 counted three customer-contact channels with three audit
> properties; **this is a fifth channel** after `System Notification` (run 06 F327), and again nothing
> describes the notification landscape as a whole.
>
> **`External Communications Settings`** is named as flexEngage's home and is unread.

### FINDING 375 — The WMS boundary is eight settings, including a named third-party provider field

- **Invariant:** WMS integration is a provider, a delimiter, a user, and five content switches.
- **Evidence** — `Warehouse Management Control Settings`, complete field list:
  > "Use this process to establish settings for **STORIS to communicate with third-party warehouse management systems (WMS)**."
  **`Send Product Data` · `Auto Start WMS Phantom` · `WMS Third Party Provider` ·
  `WMS Delimiter for Import/Export` · `WMS User` · `Increment routing number on partial completion` ·
  `Include Intangible Products` · `Include Replacement Cost in Product Export`**
- **Maps to:** run 04 F266 (a WMS can own a location) · run 04 F286 (WMS error reporting) ·
  run 04 §I — **the unknown unknown is now bounded**; `W-050`.

> Run 04 F266 found a third-party WMS can own a location and STORIS steps back from warehouse
> operations there, and flagged it in the run summary as an unknown unknown: *"everything in batches
> 5–7 presumably does not apply at such a location."* **The integration surface turns out to be
> small** — eight settings, a delimiter-separated file exchange, and a provider name.
>
> **`Auto Start WMS Phantom`** — "phantom" again, the term run 04 batch 8 met in
> `Review Radio Frequency Transfer Receiving Phantom` and could not define. **Two sightings, two
> contexts**, both suggesting a background process rather than a placeholder record. **Run 04 inference
> I-43** (a phantom is a placeholder for goods in transit) now looks **wrong**; the better reading is a
> daemon. Recorded as a correction to an inference, not as a fact.
>
> **`Include Replacement Cost in Product Export`** means the WMS can receive cost data — which,
> with run 07 F347's three costing methods, is a specific choice about what an outside system sees.
>
> The file-based, delimiter-configured exchange places WMS in the same integration family as the
> file-based route mapping interface (run 04 F206) rather than the API family.

### FINDING 376 — `Consolidate Stops` and the capacity log retention live on the same tab

- **Invariant:** stop consolidation and capacity-log retention are Route Capacity settings.
- **Evidence** — `Route Capacity Control Settings`, **Settings** tab:
  **`Consolidate Stops`** · **`Route Capacity Log Retention Days`**
  Related articles name **`Route Capacity Settings`**, **`Logistical Route Settings`** and
  **`Shared Route Capacity Settings`**.
- **Maps to:** run 04 F176 (`Consolidate Stops`) · run 04 F195 (`Routing Capacity Log Retention
  Days`) · run 04 F194 (`Shared Capacity Code`) — **all confirmed at source**.

> Three run-04 findings confirmed in one tab. Note the retention field is named
> **`Route Capacity Log Retention Days`** here and **`Routing Capacity Log Retention Days`** in run 04
> F195's source article — **an eighth terminology drift**, same field.
>
> **`Shared Route Capacity Settings`** is named as a separate article and is where run 04 F194's
> `Shared Capacity Code` is configured. Run 04 §H asked *"how a shared capacity pool is sized, and how
> contention between member routes resolves."* **The article exists.** Queued.
>
> `Route Capacity Settings` (per-route) and `Logistical Route Settings` are the two records that
> override the global values per F368. Both unread.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Route Capacity Control Settings** *(tabs: Sun–Sat, Settings)* | Route Type · per day: Maximum Stops · Maximum Pieces/Hours · Maximum Dollars · Maximum Volume. **Settings:** Warning Message When Over Capacity · Consolidate Stops · Route Capacity Log Retention Days · Unit Capacity Threshold % · Dollar Capacity Threshold % · Cube Capacity Threshold % |
| **Route Mapping Control Settings** | Base Stop Time · Default Unload Time · Default Volume · Default Weight · Days to Hold Mapping Exceptions · Service Base Stop Time · Load Address Corrections · Include Non-Inventory Dollars · Include Fulfillments with Reserved Transfers · Pick by Route When Mapping Active · **STORIS and Advanced Dispatch Track Interface:** Use Order Quantity instead of Delivery Quantity *(STORIS only)* · Include Vendor Model Number · Include Orders on Credit Hold · Include Non-Inventory Lines · Suppress Non-Inventory Price and Quantity · Include Unreserved Fulfillments *(Advanced Dispatch Track only)* · Automatically Complete Unlinked Non-Inventory Lines |
| **EDI Control Settings** | Live Account Directory Path · I/O Data Directory Path – Live · I/O Data Directory Path – **Learn** · Process Inbound EDI During End of Day · Last Control Number Used · Prompt for Outbound Creation · Set Selling Location · Flag P/O Printed · Days to Archive · 997 Late Days · Unreceived 997 Purge Days · Purge Days for EDI 215 Transaction Logs · Update Costs for Acknowledged PO · Update Costs on Vendor Billing · Inbound 810 Invoice Company · Use Receipt Warehouse Location's Company · Use Specific Company To Pay For Invoices · Hold Code for Incoming Bills · *(6 hold-condition checkboxes)* · Update Quantity for Acknowledged PO *(Decreases · Increases Within the Maximum · Maximum Quantity Increase)* · Suppress Date Change on Acknowledgement · Use Receiving Calendar for Advanced Ship Notification Updates · Tracking Number Notification *(Use ELP · Use Digital)* |
| **Warehouse Management Control Settings** | Send Product Data · Auto Start WMS Phantom · WMS Third Party Provider · WMS Delimiter for Import/Export · WMS User · Increment routing number on partial completion · Include Intangible Products · Include Replacement Cost in Product Export |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Unit / Dollar / Cube Capacity Threshold %** | Route Capacity Control Settings | Soft overage band above each maximum; **the maximum closes the route** (F367) |
| **Route Map Interface** | **Warehouse/Store Location Settings → Inventory & Logistics tab** | Enables third-party mapping **per location** (F369) |
| **EDI Processing** | **General System Control Settings → Active Add-Ons tab** | Module switch; **STORIS personnel only** (F371) |
| **Hold Code for Incoming Bills** + 6 conditions | EDI Control Settings | Automatic AP holds on imported invoices; **hold code mandatory** (F372) |
| **Update Quantity for Acknowledged PO** | EDI Control Settings, or **Vendor EDI Settings** per vendor | Vendor can rewrite PO quantities within a ceiling (F373) |
| **WMS Third Party Provider** | Warehouse Management Control Settings | Names the external WMS (F375) |

> **`General System Control Settings` has an `Active Add-Ons` tab**, and it is where module licensing
> lives — the thing run 04 established changes base behaviour seven times over and could never
> enumerate. **Priority read for batch 4.**

---

## E. Security permissions catalog (additions)

`Override capacities when scheduling routes that are full` is cited here as being on the
**Logistics tab of the Extended Security settings** — where run 04 F250 cited it as
`Create a User/Group Actions - Logistics Security`. **Ninth terminology drift**, and it reinforces
run 06 F323's finding that Extended Security is the layer those permissions sit on.

---

## F. State machines and enumerations (additions)

- **Route capacity dimensions (4):** stops · pieces/hours · dollars · volume — **per weekday, per route
  type** (F366).
- **Capacity threshold percentages (3):** unit · dollar · cube (F367).
- **EDI transaction sets (7 across the audit):** 214 · 215 · 810 · 855 · 856 · 865 · 997.
- **Incoming-bill hold conditions (6)** plus hold-everything (F372).
- **PO quantity update rules (2 + ceiling):** decreases · increases within maximum (F373).
- **Tracking notification channels (2):** `ELP` · `Digital` (F374).
- **Volume/weight resolution (3 levels):** product → category → system default (F369).

---

## G. Sequencing rules

1. Capacity maximum changed → **prompt to rebuild the route calendar**; declining leaves existing
   routes on old maxima and **may leave them over capacity** (F368).
2. Route fills past its **maximum** → route **closes**; the order in flight may still fill to
   **maximum + threshold %** without an override (F367).
3. **End of Day** → **inbound EDI processed** (F371).
4. EDI invoice imported → held on any of six variance conditions, using the configured hold code
   (F372).
5. Vendor sends **855/865** → PO quantity updated per the two switches and the ceiling; costs updated
   if enabled (F373).
6. Direct ship completed → **ASN 856** → customer notified by `ELP` or `Digital` (F374).

---

## H. Open questions and gaps

### Newly opened — priority

- **`Track Settings Activity`** — a routine that **audits changes to settings** (F368). Seven runs
  have catalogued what settings do and never found who changes them. **Highest-priority unread
  routine in run 07.**
- **`General System Control Settings → Active Add-Ons tab`** — where module licensing lives (F371).
  Run 04 found licensing changes business behaviour seven times and could never enumerate the modules.
  **Priority read.**
- `Shared Route Capacity Settings` · `Route Capacity Settings` · `Logistical Route Settings` ·
  `Vendor EDI Settings` · `External Communications Settings` · `Import Received EDI Documents` —
  named, unread.

### Newly opened — terms

- **`ELP`** — a notification channel acronym, unexplained. **Fifteenth undefined term.**
- **`Maximum Pieces/Hours`** — one field, two units; which applies is not stated.
- **`Include Intangible Products`** — "intangible" is a new product classification (F375).

### Corrections to the audit's own record

- **Run 04 inference I-43** (a "phantom" is a placeholder record for goods in transit between legs) —
  **now looks wrong.** `Auto Start WMS Phantom` (F375) reads as a background process, and that fits
  `TPA Transmission Phantom` in this same subsection. **Revised inference: a phantom is a daemon.**
  Recorded as a correction, still an inference.
- **Field-name drift:** `Route Capacity Log Retention Days` (here) vs `Routing Capacity Log Retention
  Days` (run 04 F195). Same field, two spellings.

### Inferences (recorded as inference, not fact)

- **I-66:** A "phantom" in STORIS is a background/daemon process, not a placeholder record.
  *Two sightings — `Auto Start WMS Phantom`, `TPA Transmission Phantom` — plus run 04's RF transfer
  receiving one; no article defines it.*
- **I-67:** `ELP` is probably an electronic-notification provider distinct from flexEngage. *Purely
  from its position beside `Use Digital`.*

---

## I. Unknown unknowns

- **Settings changes are auditable** (F368's `Track Settings Activity`) — and the audit never looked
  for that. If it covers all control records, **"what changed and when" is answerable for the entire
  configuration**, which would be the single most useful artefact for a cutover investigation.
- **A `Learn` environment exists** (F371's `I/O Data Directory Path - Learn`). First sighting of
  non-production in seven runs. **What else is environment-scoped is unknown**, and
  `Last Control Number Used` shows at least one system-wide sequence that cannot safely be shared.
- **Capacity numbers are partly estimated** (F369). Volume and weight fall back to category and then
  system defaults, so a route's cube utilisation is only as good as the product measurements behind
  it. For a business whose binding constraint is cube, that is worth measuring.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Capacity Threshold %** | Overage band above a route maximum, fillable without override |
| **Route calendar** | Per-route, per-day capacity records seeded from the global maxima |
| **Track Settings Activity** | Routine auditing changes to settings |
| **Active Add-Ons** | The General System Control Settings tab holding module licensing |
| **810 / 855 / 856 / 865 / 997** | EDI invoice · PO ack · ASN · PO change · functional acknowledgement |
| **`ELP`** | A tracking-notification channel; undefined |
| **Phantom** | Background process *(revised reading)* |
| **Learn** | A non-production environment with its own EDI paths |

---

## Contract adjudication — batch 3

| Contract | Verdict | Basis |
|---|---|---|
| **W-055 / W-056** *(availability, capacity)* | **CONFIRMED — run 04's soft-capacity and closed-route questions both answered** | F366, F367 |
| **W-024** *(holds)* | **CONFIRMED, extended to AP** | Six automatic incoming-bill hold conditions with a mandatory code (F372); held orders routable (F370) |
| **W-042** *(propagation)* | **CONFIRMED — a second PO-rewriting path** | Vendor 855/865 quantity updates (F373) |
| **W-005** *(receiving, purchasing)* | **CONFIRMED** | Acknowledgement-driven PO and cost updates (F373) |
| **W-064** *(retention)* | **CONFIRMED** | Four EDI retention counters; capacity log retention (F371, F376) |
| **W-012** *(dates and batch processes)* | **CONFIRMED — an eleventh EOD behaviour** | Inbound EDI processed at End of Day (F371) |
| **W-050** *(access control)* | **CONFIRMED** | Capacity override cited on the **Extended Security Logistics tab** (§E) |
| **Third-party logistics / EDI** | **NEW — seven transaction sets now numbered** | F371 |
| **Third-party WMS** | **NEW — the boundary is bounded** | F375 |
| **Settings auditing** | **NEW — no contract covers it** | F368 |

---

## Next — batch 4

`General System Control Settings` *(and its **Active Add-Ons** tab)* · `Service Control Settings` ·
`Customer Rewards Control Settings` · `STORIS Messenger Control Settings` · `System Notifications` ·
`Event Notification Control` · `Track Settings Activity`.
