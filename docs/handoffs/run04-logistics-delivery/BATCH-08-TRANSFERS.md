# Run 04 — Inventory Management — Batch 8: Transfers

Status: complete. Findings 249–258. Read-only throughout. No transfer entered, completed or
distributed.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | Enter a Transfer | 15238491486100 | read — **the subsection's core article** |
| 2 | Distributed Transfers | 15238490939284 | read |
| 3 | Special Order Products on Transfers | 15238491212180 | read — **a genuine propagation** |
| 4 | Multi-Legged Transfers Flow Chart Overview | 15238491484820 | **opened; body is empty of text.** See the note below. |

> **`Multi-Legged Transfers Flow Chart Overview` has no readable body.** The article renders with a
> title, related links and nothing else — the content is evidently a flow-chart image with no text
> alternative. **The multi-leg transfer model is therefore not recoverable from this article by
> reading**, and this is recorded as an unreachable gap rather than papered over. The earlier
> standalone Transfers handoff covered multi-leg flow; that material is cross-referenced rather than
> reconstructed here.

**Transfers subsection inventory (22), captured in full:**

| Family | Articles |
|---|---|
| **Entry** | Enter a Transfer · Enter a Transfer (As-Is, Floor Sample, Stock) · Add Individual Transfer · Transaction Number Entry · Select As-Is Pieces |
| **Distribution** | Distributed Transfers · Distributed-Quantity Transfers · Transfer Distribution Quantity · Maintain Distribution Location Schema · Replenish Assigned Stock Levels |
| **Manifest / logistics** | Schedule and Build a Transfer Manifest · Complete the Transfer Manifest Process · Transfers Eligible for Date Re-Scheduling · Confirm Required Carton Quantity for Shipment |
| **Special order / purchasing** | Special Order Products on Transfers · Special Order Inventory Assignment · One-Time-Buy Processing · Product Quantity in Excess of Transfer Quantity |
| **Security / schedule config** | Maintain Transfer Security for Multiple Locations · Maintain Transfer Schedule Period Days |
| **RF** | Review Radio Frequency Transfer Receiving Phantom |
| **Overview** | Multi-Legged Transfers Flow Chart Overview *(no text)* |

Four read in full; the manifest family mirrors the delivery manifest machinery dissected in batch 2
(the articles share their wording), and the distribution family is represented by `Distributed
Transfers`. Remaining articles are named with their disposition; **none skipped silently**.

---

## B. Wiring findings

### FINDING 249 — Editing a transfer's quantity updates the linked purchase order — a genuine propagation, and the first one this audit has found

- **Invariant:** transfer quantity changes flow through to the special-order PO automatically.
- **Evidence** — `Special Order Products on Transfers`:
  > "**If, at a later date, you edit the Quantity To Transfer field for a special order item that is linked to a purchase order, the system updates the quantity on the purchase order.**"
- **Maps to:** `W-042` (PO↔document propagation) — **materially changes the adjudication**;
  `W-005` / `W-006`.

> This matters out of proportion to its length, because **`W-042` has been contradicted or downgraded
> in every previous run.** Run 02 found that PO line changes do *not* propagate to stock sales lines —
> the system posts a message telling a human to do it. Batch 2 F184 found manifest coupling that is
> advisory ("Continue?"). Batch 4 F209 found Dispatch Track changes that do not propagate at all
> until a stamp is cleared.
>
> Here, finally, is real propagation — and the shape of it tells us the rule. **STORIS propagates
> when the downstream document exists only to serve the upstream one.** A special-order PO exists
> because of the transfer line; it has no independent life, so it follows. A stock PO and a stock
> sales line are independent documents that merely reference the same product, so they do not.
>
> That is a clean, defensible principle and it is worth adopting explicitly:
> **derived documents propagate; associated documents notify.** Recorded as the audit's best current
> reading of `W-042` across four runs.

### FINDING 250 — Route capacity is checked on every transfer line, and the override warning is deliberately asymmetric

- **Invariant:** transfers consume delivery route capacity, and the warning fires only on increases.
- **Evidence** — `Enter a Transfer`:
  > "After adding a product to the transfer order, the line is checked to ensure the route capacity has not been exceeded. If exceeded, a warning displays "**Route X is full for MM/DD/YYYY. Do you wish to override the capacity limit?**". If **Yes** is selected, the capacity limit is overridden, **which requires permission found in Override capacities when scheduling routes that are full in Create a User/Group Actions - Logistics Security**; if **No** is selected, **the line is added to the grid as unscheduled**. **The warning appears every time merchandise is added or changed that causes an increase to route capacity. If the added or changed merchandise reduces the already exceeded route capacity, no warning appears, even if the reduction still results in over capacity.**"
- **Maps to:** batch 3 F193, F194 (capacity log, soft capacity) — **CONFIRMED**; run 03 F31;
  `W-050`.

> Three things, all useful.
>
> First, **a third named field in `Logistics Security`**: `Override capacities when scheduling routes
> that are full`, joining `Update Status and Stop Time for an Order on a Manifest` (batch 1 F170) and
> `Delete an Entire Manifest` (batch 4 F189).
>
> Second, **declining the override does not block the line — it makes it unscheduled.** So a "No"
> answer quietly produces exactly the population that batch 1 F167 showed is invisible to
> date-filtered searches. **Refusing to overbook a route creates an order line nobody will find.**
> That connection spans three batches and is one of the more consequential pieces of wiring in the
> run.
>
> Third, the asymmetry is stated explicitly and is correct: warn on increase, stay silent on
> decrease, **even when the result is still over capacity.** Someone thought about this. Copying it
> would spare our users a warning they can do nothing about.
>
> This also confirms batch 3 F193 from the entry side: capacity is consumed **per line, at save**, by
> transfers as well as by sales orders. The warehouse's route capacity is spent by two different
> departments.

### FINDING 251 — Transfer creation is gated by three independent security mechanisms, one of which is a table

- **Invariant:** who may transfer what, between which locations, is decided in three places.
- **Evidence** — `Enter a Transfer`:
  > "The ability to create a transfer may be affected by your settings, including the following:
  > - **TRANSFERS - Use Transfer Security Tables** setting on the **Additional Settings tab in Inventory Control Settings**.
  > - **User Transfer Security**
  > - **User Logistics Security**"
  Plus:
  > "If the **Store to Store Transfers** field in the Point of Sale Control Settings is enabled, you can create transfers to and from store locations. **If that option is not enabled, the system prevents you from entering store locations in both the To and From locations on transfers.**"
- **Maps to:** `W-050` — **CONFIRMED**; the `Maintain Transfer Security for Multiple Locations` article.

> **A security *table*, not just a permission** — `Use Transfer Security Tables` switches on a
> location-pair matrix, maintained in `Maintain Transfer Security for Multiple Locations`. That is a
> different mechanism from everything the audit has counted so far: not "may this user do X" but
> "may stock move from A to B".
>
> With `User Transfer Security` and `User Logistics Security` alongside it, **transfers are gated by
> three layers** plus the store-to-store switch. The store-to-store rule is a fourth constraint of yet
> another kind — a *shape* rule, forbidding store→store movement entirely so that everything routes
> through a warehouse.
>
> That last one is a real business-model statement hiding in a checkbox. Turning it off makes the
> warehouse a mandatory hub, which is presumably why multi-leg transfers exist.

### FINDING 252 — Distribution status can forbid a product from ever being transferred

- **Invariant:** a product-level availability status can pin stock to its selling store.
- **Evidence** — `Enter a Transfer`:
  > "A product **cannot be transferred** if its distribution status includes an **inventory availability status that is restricted to the selling store**. This is set via the **Inventory Availability field in Distribution Status Settings**."
- **Maps to:** `W-055` / `W-056` (availability) — **CONFIRMED and extended**; batch 5 F214.

> The tenth availability-related concept in the audit, and a new *kind*: not a quantity, not a date,
> but a **transferability constraint attached to a product's distribution status.**
>
> Run 03 batch 16 counted nine availability definitions. This is not a tenth definition — it is a
> **rule about what availability means at other locations**: stock that exists, is on hand, is
> unreserved, and is nonetheless unavailable to any other store. Our availability model needs a
> location-scope dimension, not just a quantity per location.
>
> `Distribution Status Settings` is a new record. Queued.

### FINDING 253 — Transfers carry the same 52-back-order cap as sales orders, with the same alphabetic suffixing

- **Invariant:** the back-order suffix scheme is shared across document types.
- **Evidence** — `Enter a Transfer`:
  > "The maximum amount of back orders permitted within Enter a Transfer is **fifty-two (52)**. Each partial back order includes a letter, **'A' through 'Z' and 'a' through 'z'** which will be attached to the root invoice. A warning message is displayed once the back order counter reaches the **48th and 52nd** invoice. **Any invoice entered after the 52nd must deleted and reentered.**"
- **Maps to:** run 03 F9 — **CONFIRMED, identical**.

> Run 03 F9 found exactly this on sales orders. The cap is 52 because there are 52 letters, and the
> suffix is **case-sensitive** — `A`–`Z` then `a`–`z`. **Our document numbering must be
> case-sensitive or we lose half the range**, which is the kind of thing that surfaces as a
> mysterious ceiling eighteen months after go-live.
>
> The two warnings at 48 and 52, and the hard failure after ("must be deleted and reentered", the
> vendor's own grammar), confirm this is a hard structural limit rather than a policy.
>
> That it is identical across sales orders and transfers means **the back-order suffix is a shared
> document-numbering mechanism**, not a sales feature.

### FINDING 254 — EDI 214 shipment-status messages from a 3PL are written into the transfer as audit comments

- **Invariant:** carrier status updates arrive as EDI and land as document comments.
- **Evidence** — `Enter a Transfer`:
  > "Audit comments appear here if there is a **214 transaction** with a **Line Status Code that matches the Estimated Arrival Status Code for a third-party logistics provider in Third Party Logistics Settings**. The information for these comments is taken from the **Estimated Arrival Date, Estimated Start Arrival Time, Estimated End Arrival Time, and Estimated Arrival Description** that has been supplied by the provider."
- **Maps to:** batch 1 F172 (EDI 215) — **extended**; batch 6 F234 (`EDI Trip Info`); `W-042`.

> **EDI 214 (Transportation Carrier Shipment Status Message)** joins EDI 215 from batch 1. STORIS
> both sends pickup manifests and receives shipment status.
>
> The wiring is precise and configurable: the provider's `Line Status Code` must **match** an
> `Estimated Arrival Status Code` configured per provider in **`Third Party Logistics Settings`**.
> Only matching messages produce comments. So **the site decides which carrier status events are
> worth recording**, by configuring one code per provider.
>
> And once again — **the audit trail is a comment.** Third time in run 04 (batch 2 F179's dropped
> order, batch 6 F228's over-receipt, and now inbound EDI). A carrier's ETA, with a date and a time
> window, is stored as free text on the transfer rather than as fields. **Anything we build that
> wants to show a customer an ETA cannot read it from structured data in STORIS.**
>
> `Third Party Logistics Settings` is a new record and the third 3PL touchpoint. Queued.

### FINDING 255 — Completing a transfer is irreversible and removes it from the entry program entirely

- **Invariant:** completion moves the transfer to history and closes the door.
- **Evidence** — `Enter a Transfer`:
  > "If you need to make corrections or quantity adjustments to this transfer, **make them BEFORE selecting the Complete Transfer option. Once the transfer completes, the system closes the transfer, moves it to history, and you can no longer access it using this process.**"
- **Maps to:** batch 2 F177 (manifest lock) — **same pattern**; `W-034`; `W-064`.

> The same shape as the manifest: **a one-way door after which the document leaves the working
> system.** Batch 2 F177 locked a manifested order out of *other* processes; this locks a completed
> transfer out of *its own* process.
>
> Note the capitalised "BEFORE" — the vendor shouting. Together with batch 5 F222 (physical inventory
> clear) and batch 6 F225 (batch deletion), that is **four irreversible steps in run 04, all
> documented with emphasis and none with a permission.**
>
> "Moves it to history" implies a transfer history file with its own retention. Not named. Section H.

### FINDING 256 — Distributed transfers fan one entry into many, and the first destination keeps the original document

- **Invariant:** a distribution list explodes into N transfers, quantities copied, not divided.
- **Evidence** — `Distributed Transfers`:
  > "Use this feature to create and maintain **lists of locations** … These lists can contain **any number and combination of stores and warehouses**. … When you click on Save, the system creates **a new transfer for each store on the transfer list (except for the first store on the list, which retains the original transfer order), assigning the same transfer quantity to each** as was specified on the original transfer order. **To edit the quantities, you must open the individual transfer orders.**"
- **Maps to:** `W-042`; the sibling `Distributed-Quantity Transfers` article.

> **Same quantity to each**, not the quantity split — so `Distributed Transfers` is "send ten to each
> of these six stores", and the separate `Distributed-Quantity Transfers` routine presumably does the
> dividing. Two distinct distribution semantics with confusingly similar names, which is now a
> familiar hazard in this ERP (batch 4 F208's two auto-transfer settings).
>
> The **first store on the list keeps the original transfer number** — an implementation detail
> leaking into behaviour. It means the six transfers are not peers: one has the original document
> number and five are new. Anyone reconciling by document number will find an asymmetry with no
> business meaning.
>
> After the fan-out, **the transfers are independent** — quantities are edited one at a time. There is
> no distribution object holding them together, only `View Outbound Transfers Inquiry` to list them
> by product. **The distribution is an act, not an entity.** That is worth deciding deliberately in
> the rebuild, because holding them together would make the whole thing revisable.

### FINDING 257 — Special-order products can be created on the fly from inside a transfer, and POs are created automatically or on prompt

- **Invariant:** the transfer screen is a purchasing entry point.
- **Evidence** — `Special Order Products on Transfers`:
  > "If your **User/User Group settings (Create special order products within POS entry field)** allow you to create special order products on-the-fly, the **Special Order Entry** screen displays when you click the Action button at the Product field on the Merchandise tab of Enter a Transfer. **Even if your User/User Group settings do not allow creation of special order products on-the-fly, you can add existing special order products to the transfer.**"
  > "If the **Automatic PO Creation** field is active on the **Special Order Control Settings**, the system **automatically creates a purchase order for each non-reserved special order item on a sales order**. If … not active, the system **gives you the option** to create a purchase order for each non-reserved special order item, **or specify another product**."
- **Maps to:** run 03 F55–F63 (special order); `W-005` / `W-006`; F249.

> A transfer clerk can create a product, create a purchase order, and commit the company to buying
> something — from the transfer screen. The permission is named at **user *or* user-group** level,
> which is the first time the audit has seen that distinction stated.
>
> The `Automatic PO Creation` fall-back is nicely designed: without it you are offered the PO **or**
> the chance to **specify another product** — i.e. "don't buy it, use this instead". That second
> branch is a substitution decision at the moment of shortfall, and it is the human counterpart of
> the automatic replacement search found in batch 7 F239.
>
> Note the article says "on a **sales order**" while describing the transfer screen. Either the
> setting's behaviour is described from its primary context, or transfers borrow the sales-order
> logic wholesale. **The article does not say**, and the distinction matters. Section H.

### FINDING 258 — Floor-sample transfers move stock into As-Is, and the docs warn about label reprinting for cycle counts

- **Invariant:** transferring a floor sample is a status change from regular to As-Is inventory.
- **Evidence** — `Enter a Transfer`:
  > "Use this program to transfer **regular, as-is, and floor sample** inventory between stores and/or warehouses."
  > "If creating an **as-is transfer**, you must select a **specific as-is piece** to transfer. The piece you select must **already exist in as-is inventory**. If creating a **floor sample transfer**, select the product you want to **move from regular inventory to As-Is floor sample status**. Note that **for cycle count purposes, we recommend you re-print labels for items moved to or from As-Is inventory.**"
- **Maps to:** `W-061` (cost); batch 5 F218, batch 7 F242 (As-Is); batch 5 F223 (labels are the unit of scanning).

> **Three transfer flavours**: regular (by product), as-is (**by specific piece**), floor sample
> (**converts regular → As-Is on transfer**). The third is a status change disguised as a movement,
> and since As-Is merchandise is repriced, **putting something on a showroom floor is a cost event.**
>
> The labelling advice is the operational sting and it follows directly from batch 5 F223: **a scan
> is a label event.** Move a piece to As-Is without reprinting its label and the label still says
> what it used to be — so the next cycle count reads it wrongly. **The physical label carries state
> that the database has already changed**, and nothing enforces the reprint; it is a recommendation
> in a note.
>
> `Select As-Is Pieces` is the named piece-picker for as-is transfers. Queued.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Enter a Transfer** *(tabs: General, Merchandise)* | Transfer Number · Last Order · **Total Volume** · **General:** Date · Type · **Reason Code** · Complete Transfer · Print Transfer Ticket · From · To · **Distribute Quantities** · Delivery Information · Route · Date · **Instructions for this Fulfillment Only** · **Ship Direct** · Right Click Menus · Actions · **Merchandise:** Product · Brand · Serial/Reference Number · Quantity to Transfer · Available · Scheduled Quantity · Location · **Line Type** · Purchase Order Number · Grid · Actions |
| **Actions menu** | **Sales Order Audit Text** → `Update Sales Order Comments` screen; **Additional Comments** → `User Text Entry` window |
| **Distributed Transfers** | list of locations *(stores and warehouses, any combination)*; `List Entry Window` from the Action button at the `To` field |

> **`Total Volume` on the transfer header** confirms batch 3 F196's finding that volume is a
> first-class capacity dimension — transfers are measured in it too.
>
> **Transfers reuse the sales-order comment screens** (`Sales Order Audit Text` → `Update Sales Order
> Comments`) — the comment subsystem is shared across document types, which is consistent with the
> back-order suffix scheme being shared (F253).
>
> **`Ship Direct` on a transfer** is unexplained and interesting: a transfer that ships direct
> presumably bypasses the receiving leg. Possibly the crossdock mechanism from batch 6 F232 seen from
> the transfer side. Recorded as a question, not a conclusion.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **TRANSFERS - Use Transfer Security Tables** | **Inventory Control Settings → Additional Settings tab** | Enables the location-pair security matrix (F251) |
| **Store to Store Transfers** | Point of Sale Control Settings | When off, **store locations are forbidden in both To and From** (F251) |
| **Inventory Availability** | **Distribution Status Settings** | Can restrict a product to its selling store, blocking transfer (F252) |
| **Estimated Arrival Status Code** | **Third Party Logistics Settings** *(per provider)* | Selects which EDI 214 statuses generate audit comments (F254) |
| **Automatic PO Creation** | Special Order Control Settings | Auto-creates POs for non-reserved special-order items (F257) |
| **Create special order products within POS entry** | **User / User Group settings** | On-the-fly special-order product creation (F257) |

---

## E. Security permissions catalog (additions)

- **`Override capacities when scheduling routes that are full`** — **`Create a User/Group Actions -
  Logistics Security`**. Third named field in that record (F250).
- **`User Transfer Security`** and **`User Logistics Security`** — two of the three transfer gates (F251).
- **Transfer Security Tables** — a **location-pair matrix**, a genuinely new *kind* of access control:
  it governs movements, not users' verbs. Maintained in `Maintain Transfer Security for Multiple
  Locations`.
- **User *or* User Group** granularity stated explicitly for the first time (F257).
- `Regional Processing Overview` appears as a related article on `Enter a Transfer`.

---

## F. State machines and enumerations (additions)

- **Transfer inventory flavours (3):** regular · as-is *(specific piece)* · floor sample
  *(regular → As-Is on transfer)*.
- **Back-order suffixes:** `A`–`Z`, `a`–`z`; **cap 52**; warnings at 48 and 52; **case-sensitive**.
- **EDI documents in use (2):** **215** *(pickup manifest, outbound — batch 1)* · **214**
  *(shipment status, inbound — F254)*.
- **Transfer security layers (4):** Transfer Security Tables · User Transfer Security ·
  User Logistics Security · the `Store to Store Transfers` shape rule.
- **Distribution semantics (2):** `Distributed Transfers` *(same quantity to each)* ·
  `Distributed-Quantity Transfers` *(separate routine, presumably splitting)*.
- **Hard kits** display master **and** components in the transfer grid.

---

## G. Sequencing rules

1. Add a transfer line → **route capacity checked** → override *(permissioned)* or the line becomes
   **unscheduled** (F250).
2. Warning fires on every capacity **increase**; never on a decrease, even if still over (F250).
3. Special-order line quantity edited → **linked PO quantity updated** (F249).
4. Non-reserved special-order item → PO created automatically, or offered, or another product
   substituted (F257).
5. Distribution list saved → **N transfers created**, first destination keeps the original number,
   quantities copied; edits are per-transfer thereafter (F256).
6. Corrections **before** `Complete Transfer`; after completion the transfer is closed, moved to
   history, and unreachable from the entry program (F255).
7. Matching EDI 214 received → audit comment written to the transfer with the provider's ETA window
   (F254).

---

## H. Open questions and gaps

### Gated or unreachable

- **`Multi-Legged Transfers Flow Chart Overview` has no text** (see §A). The multi-leg model cannot be
  read from it. **Recorded as unreachable, not inferred.**
- `Third Party Logistics Settings` · `Distribution Status Settings` ·
  `Maintain Transfer Security for Multiple Locations` · `Maintain Transfer Schedule Period Days` ·
  `Maintain Distribution Location Schema` · `Select As-Is Pieces` · `Distributed-Quantity Transfers` ·
  `One-Time-Buy Processing` · `Replenish Assigned Stock Levels` ·
  `Review Radio Frequency Transfer Receiving Phantom` — named, unread.
- Carried and still open: **`Warehouse/Store Location Settings`** · **`Alert Code Settings`** ·
  **`Print Pick List`** · **`Assign Specific Pieces At` values**.

### Documented but ambiguous

- **`Ship Direct` on a transfer** — bypasses the receiving leg? Related to crossdock (batch 6 F232)?
  Unexplained.
- **`Line Type`** on the transfer merchandise grid — an enumeration, values not given.
- **`Reason Code` on a transfer** — a fourth reason-code family; values not given.
- **`Instructions for this Fulfillment Only`** — free text, scope stated but purpose not.
- **Whether `Automatic PO Creation`'s "on a sales order" wording applies verbatim to transfers** (F257).
- **The transfer history file** implied by F255 — not named, retention unknown.
- **`Review Radio Frequency Transfer Receiving Phantom`** — "phantom" is a new and undefined term.
- **What `Distributed-Quantity Transfers` does differently** from `Distributed Transfers`.

### Inferences (recorded as inference, not fact)

- **I-41:** `Distributed-Quantity Transfers` probably splits a quantity across the list, as against
  copying it. *Purely from the name contrast.*
- **I-42:** `Ship Direct` on a transfer is probably the transfer-side expression of crossdocking.
  *No article connects them.*
- **I-43:** A transfer "phantom" is probably a placeholder record for goods in transit between legs.
  *The term appears once, undefined.*

---

## I. Unknown unknowns

- **A location-pair security matrix** (F251). Every access-control mechanism the audit has counted so
  far governs *users*. This one governs *movements*. If STORIS has one matrix-style control, it may
  have others, and our count of twenty-plus mechanisms has been categorising the wrong dimension.
- **Physical labels carry state the database has already changed** (F258). The reprint is a
  *recommendation*. That is a class of integrity problem — the physical world holding stale data —
  that no schema review would surface.
- **A fourth "audit trail as free text" case** (F254). Dropped orders, over-receipts, carrier ETAs, and
  transfer comments all live in comment fields. **Any migration that needs history will have to parse
  prose**, and we should budget for that explicitly rather than discover it.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Distributed transfer** | One entry fanned into N transfers, same quantity to each |
| **Floor sample transfer** | Moves stock from regular into As-Is floor-sample status |
| **Transfer Security Tables** | Location-pair matrix governing permitted movements |
| **EDI 214** | Carrier shipment status message; lands as audit comments |
| **Third Party Logistics Settings** | Per-provider config, including which 214 statuses to record |
| **Distribution Status Settings** | Product-level statuses; can pin stock to its selling store |
| **`Ship Direct`** *(on a transfer)* | Undefined; possibly crossdock |
| **Phantom** *(RF transfer receiving)* | Undefined |
| **Complete Transfer** | Irreversible; closes the transfer and moves it to history |

---

## Contract adjudication — batch 8

| Contract | Verdict | Basis |
|---|---|---|
| **W-042** *(propagation)* | **CONFIRMED — and the rule is now readable across four runs** | Transfer quantity propagates to the linked special-order PO (F249). Reading: **derived documents propagate; associated documents notify.** |
| **W-050** *(access control)* | **CONFIRMED — new *kind* found** | Three user-level gates plus a **location-pair matrix** (F251); third Logistics Security field (F250) |
| **W-055 / W-056** *(availability)* | **CONFIRMED and extended** | Distribution status can forbid transfer entirely (F252) |
| **W-005 / W-006** *(special order, direct ship)* | **CONFIRMED** | Special-order creation and automatic PO creation from the transfer screen (F257) |
| **W-061** *(cost)* | **CONFIRMED** | Floor-sample transfer converts regular stock to As-Is (F258) |
| **W-034** *(deletion / irreversibility)* | **CONFIRMED** | Completion closes the transfer and moves it to history (F255) |
| **W-012** *(dates)* | **consistent** | Capacity checked per date; `Transfers Eligible for Date Re-Scheduling` exists |
| **Third-party logistics / EDI** | **NEW, extended to inbound** | EDI 214 (F254) |
| **Location-pair security** | **NEW — no contract covers it** | F251 |

---

## Next — batch 9: Inventory (44 articles)

Third subsection complete; opening the fourth. Priorities: the **four Kardex ledgers** (carried
unread since run 02), `Correct a Cost Exception`, the **storage location model**
(`Tracked Storage Location Settings`), `Distribution Status Settings`, and `Inventory Formations
Overview` (named as a related article here and never seen before).
