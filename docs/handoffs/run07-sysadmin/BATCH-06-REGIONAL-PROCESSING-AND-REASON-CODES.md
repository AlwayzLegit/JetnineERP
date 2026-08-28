# Run 07 — System Administration — Batch 6: Regional Processing, and the reason-code model

Status: complete. Findings 402–413. Read-only throughout. No setting saved.

**This batch resolves the audit's longest-running judgment.** `W-050` was judged *inverted* in run 01
and upheld eight times across six runs on the strength of boilerplate on report articles. **The
actual model is here** — a four-level hierarchy with fifteen documented exceptions. It also gives the
reason-code model that run 04 F265 said *"deserves its own design attention"*.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Regional Processing - Rules, Notes, and Exceptions** | 15185875941012 | read — **the complete access model** |
| 2 | **Reason Code Settings** | 15185860705300 | read — **reason codes carry GL accounts** |

**User Settings subsection enumerated (49).** It holds **ten `Create a User/Group Actions - <Module>
Security` records** — the consolidated permission catalogue the audit has been assembling piecemeal —
plus `Create a User`, `Create a User Group`, `User Group Clone Process`, both Regional Processing
articles, `Reason Code Settings`, `Track Settings Activity`, and the three **file attachment**
articles that run 05 §C flagged as an entirely undocumented mechanism.

---

## B. Wiring findings

### FINDING 402 — Regional Processing is a four-level hierarchy with a two-step fallback

- **Invariant:** a user's location scope resolves through four cases, the last of which falls back to the warehouse record.
- **Evidence** — `Regional Processing - Rules, Notes, and Exceptions`, verbatim:
  > "1. **Create A User file indicates no restrictions** – no further checking is performed and no restrictions are enforced.
  > 2. **Create a User file indicates store restriction** – location-sensitive functions are permitted **for the current log-on location only**.
  > 3. **Create A User file indicates regional/district restriction and the Regional Processing flag is set** – location-sensitive functions are permitted only when associated with the **current log-on region/district**.
  > 4. **Create a User file indicates user is associated with a list of locations**
  > a. If a list is specified in the Create a User record, functions are permitted only for **locations on the list**.
  > b. **If no list name was found in the Create a User record, then the Warehouse record for the current log-on location is checked for a list.** If found, functions are permitted only for locations on that list."
  > "You can apply **location restrictions using the location restriction option in the User file even if regional processing is not active.**"
  > "**Regional Processing… works the same for most entries and inquiries in both sales (district) and inventory (region) functions.**"
- **Maps to:** `W-050` — **the mechanism behind eight upholdings**; run 07 F379 (the four restriction
  switches); **the thirteenth fall-through hierarchy in the audit**.

> Eight runs of *"you can inquire only about customers and locations to which you have access"* and
> **this is what that sentence means.**
>
> Three things the audit had wrong or missing:
>
> **District and region are different axes.** Sales functions scope by **district**; inventory
> functions scope by **region**. The audit has been treating "Regional Processing" as one dimension for
> six runs. It is two, applied to different halves of the system — which is why run 05 F307's service
> profitability reports carry a `Region` grouping while run 03's sales reports carry `District`.
>
> **Location lists fall back to the warehouse record.** A user with no list inherits the list attached
> to wherever they logged in — so **the same user's scope changes when they switch location**
> (run 06 F325). That is a genuine and easily-missed interaction between two mechanisms the audit found
> separately.
>
> **Location restriction works without Regional Processing.** Case 2's store restriction and case 4's
> lists operate independently of the master flag. So a site with Regional Processing off is not
> unrestricted — which explains why run 07 F379's SaaS carve-out could remove region/district
> restriction and still claim security.

### FINDING 403 — Fifteen documented exceptions, and two of them are wide open

- **Invariant:** the access model has an explicit exception list, including places where it does not apply at all.
- **Evidence** — `Regional Processing - Rules, Notes, and Exceptions`, verbatim highlights:
  > "**If you know the customer's code and you enter it at the Customer field, you can override region/district and location restrictions.**"
  > "**The system does not enforce access restrictions for COG (customer's own goods) documents. You can create COG documents from/to any location regardless of regional or other access restrictions.**"
  > "**Physical Inventory routines are not affected by Regional Processing restrictions.**"
  > "The **Customer Buy History** report, **when accessed via the Customer Return or Exchange processes, shows completed orders regardless of Regional Processing restrictions**… **This is not true if accessing… from anywhere else.**"
  > "the **Costing Table Inquiry**… the detail information in the grid is **completely unfiltered** as far as location is concerned. **STORIS assumes the individual who would typically be reviewing this information would not be restricted.**"
  > "If an inquiry based on customer data contains inaccessible locations, **those locations display anyway**… all information is reported **ignoring any restrictions**."
  > "**You cannot place location restrictions on the Warehouse/Store Location Settings process.**"
- **Maps to:** F402; run 04 F182, F294 (COG); run 04 F219 (physical inventory); `W-050`.

> **The exception list is longer and more permissive than six runs of boilerplate suggested**, and two
> entries are effectively holes.
>
> **Knowing a customer code defeats the model entirely.** Type the code at the Customer field and
> region, district and location restrictions are all overridden. That is presumably deliberate — a
> customer who walks into any store must be servable — but it means **location scoping is advisory for
> anyone who knows a customer number.**
>
> **COG documents have no access control at all**, stated flatly. Run 04 F182 found COG rides the truck
> outside inventory; run 05 F294 found it is a numbered movement document with three destination types.
> **Any user can move a customer's goods between any two locations.** For a rebuild, that is a
> deliberate decision to make rather than inherit.
>
> **The costing table exception is the most candid sentence in the corpus**: *"STORIS assumes the
> individual who would typically be reviewing this information would not be restricted."* The security
> model has a documented gap justified by an assumption about who looks. **Run 04's Costing Table
> findings should be read with this in mind** — cost detail is visible to anyone who can open the
> inquiry.
>
> **Physical inventory ignoring restrictions** is operationally sensible and worth knowing: run 04's
> eight-phase count procedure (F219–F222) is unscoped.

### FINDING 404 — Opening a document widens your access for the session

- **Invariant:** every location on a document is temporarily added to the user's valid-location list.
- **Evidence** — `Regional Processing - Rules, Notes, and Exceptions`:
  > "The system allows you to **view and/or edit any existing sales order provided you have access to one of the locations** associated with that order (**written location, stocking location, ship from location and/or pick-up location**). **Valid locations based on both regional and district access are combined for the check.**"
  > "**When accessing existing sales, memos and service orders, the system adds all locations (selling, stock, and ship/service) from that document to the list of valid locations for that session regardless of the user's access to those locations.**"
  > "The system derives default ship and stock location information from the **zip code record**… **If this location is not found on the current users list of available locations, the system adds it temporarily.**"
- **Maps to:** F402, F403; run 06 F325 (session state); `W-050`.

> **Access is not static within a session — it accumulates.** Open one order you are entitled to see,
> and every location on it becomes valid for the rest of your session. Look up a customer whose zip
> code maps to a location you cannot normally reach, and that location is added too.
>
> That is a pragmatic design — you cannot work an order whose stock location you cannot see — and it
> is a **privilege-escalation path by ordinary use.** A user who opens enough documents accumulates
> broad location access without any permission changing.
>
> **Access is checked as the union of regional and district lists** (*"you can have district access to
> the shipping location **or** regional access to the writing store location"*), which reinforces F402:
> the two axes are combined for the test, not intersected.
>
> For our rebuild this is the kind of thing to implement deliberately or not at all. **Silently
> accumulating session scope is very hard to reason about afterwards**, and it makes any access audit
> a function of what someone happened to open.

### FINDING 405 — The service location falls through five levels, ignoring access restrictions

- **Invariant:** where a service call is booked resolves through a five-step chain that overrides scoping.
- **Evidence** — `Regional Processing - Rules, Notes, and Exceptions`:
  > "if **no service location is associated with that zip code**, the following hierarchy is used to determine the service location, **regardless of user access restrictions**:
  > 1. The service location associated with the **customer's zip code**
  > 2. If Regional Processing is active, the **Regional service location** based on the customer's zip code
  > 3. The service location associated with the **writing store**
  > 4. If Regional Processing is active, the **Regional service location based on the writing store**
  > 5. The service location defined in the **Service Control Settings**."
  Plus: > "the system performs **no validation against the staff file** to verify that the location being used on the service document is the same as the service location in that user's staff record. **This location is used only by the Tickle process for auto-assigning service orders.**"
- **Maps to:** run 05 F293, F294 · run 07 F382 (`Default Service Location`) — **the bottom of the
  chain**; **the fourteenth fall-through hierarchy**; `W-050`.

> **A five-level fall-through that explicitly ignores access control**, ending at the
> `Default Service Location` found in batch 4 F382. Zip code first, then region, then the writing
> store, then that store's region, then the system default.
>
> **The staff-file note explains a run-05 gap.** Run 05 F292 documented the tickle matrix assigning
> service orders to a coordinator and could not say how the assignment was decided. **The service
> location on the document drives auto-assignment**, and STORIS does not check it against the user's
> own service location — so a mis-derived location silently routes the tickle to the wrong person.

### FINDING 406 — Transfers are gated on the *from* location only, unless inter-region transfers are restricted

- **Invariant:** you need access to transfer *from* a location, not *to* it.
- **Evidence** — `Regional Processing - Rules, Notes, and Exceptions`:
  > "**To create inventory transfers, you must have access to the transfer-from location. You can use any transfer-to location regardless of access restrictions, except if the `Restrict Inter-Region Transfers` field is enabled in the General System Control Settings.**"
  > "You can **update any existing transfer** provided you have access to **one of the locations** on the transfer."
  > "if the **stock and ship locations are in different regions and the `Restrict Inter-Regional Transfers` flag is set, you cannot save the item.**"
- **Maps to:** run 04 F251 (three transfer security layers + the store-to-store shape rule) ·
  run 07 F379 (`Inter-Region Stock Transfers`, `Inter-Region Auto-Transfers`) — **all converge**;
  `W-050`.

> Run 04 F251 found three security layers on transfers — `Use Transfer Security Tables`,
> `User Transfer Security`, `User Logistics Security` — plus the store-to-store shape rule, and called
> the location-pair matrix a new *kind* of access control. **This adds the base rule underneath them
> all: from-location access is required; to-location access is not.**
>
> That is asymmetric on purpose — **you may push stock anywhere, but only pull it from where you
> belong** — and it is a clean rule worth copying.
>
> The inter-region flag is the exception, and note that it **blocks saving a sales order line** too
> when stock and ship locations straddle regions. So a purely-configuration setting can make an order
> unsaveable, which is the kind of thing that surfaces at a store as "the system won't let me."

### FINDING 407 — Reason codes are typed, and each carries two general ledger accounts

- **Invariant:** a reason code declares what it is for and where its adjustments post.
- **Evidence** — `Reason Code Settings`, fields verbatim:
  **`Reason Code` · `Description` · `This Reason is Used for` · `Status Letter Template` ·
  `Commission Category` · `Account Status` · `Description` ·
  **`Inventory Adjustments General Ledger Account`** · **`Revolving Balance Adjustments General
  Ledger Account`** · `Restrict As-Is Products from being Sold` ·
  `Allow Warranties to be Sold on As-Is Products` · `Include in the Saleable Quantity for Transfer
  Limits` · `Check As-Is Label Number`**
- **Maps to:** run 04 F265 (*"reason codes carry behaviour… the reason-code model deserves its own
  design attention"*) — **CONFIRMED and specified**; `W-052` / `W-053`; `W-061`.

> Run 04 F265 found reason codes gating four tabs of the stock adjustment screen and blocking
> write-off, and concluded the model was *"richer than the audit has been recording."* **It is much
> richer than that.**
>
> **Two GL accounts on a reason code** is the headline. The reason a piece was adjusted **decides
> which account the adjustment posts to** — so "damaged in transit" and "customer did not like it"
> can hit different accounts. That is a genuinely good design and it explains something run 04 F260
> could not: the three-legged adjustment journal names `Inventory Adjustment` as an account, and
> **which** inventory adjustment account is a function of the reason code.
>
> The **`Revolving Balance Adjustments`** account means reason codes also govern receivables postings
> — so the same code table spans inventory and AR.
>
> **`This Reason is Used for`** confirms reason codes are **typed**, which is what run 04 F359's six
> families (Floor Sample, Not in Location, In Service, Twilight, Repossession, Vendor Chargebacks) are
> selecting from.
>
> **`Status Letter Template`** ties a reason code to customer correspondence — `Print Status Letter`
> was in run 06's Printing inventory, unread. So marking an item with a reason can drive a letter.
>
> **`Commission Category`** means the reason can affect commission treatment, connecting to run 03's
> commission machinery.

### FINDING 408 — `Restrict As-Is Products from being Sold` is the "As-Is Restricted" flag, and there are three more behavioural switches

- **Invariant:** four checkboxes on a reason code govern sellability, warranties, transfer limits and label checking.
- **Evidence** — `Reason Code Settings`:
  **`Restrict As-Is Products from being Sold`** ·
  **`Allow Warranties to be Sold on As-Is Products`** ·
  **`Include in the Saleable Quantity for Transfer Limits`** ·
  **`Check As-Is Label Number`**
- **Maps to:** run 04 F265 (*"a reason code designated as **As-Is Restricted**"*) — **the field
  identified**; run 04 F258 (label reprinting); run 07 F364 (`TRANSFERS - Restrict Transfers that
  Exceed Maximum Stock`); `W-055`; `W-028`.

> **This is the field behind run 04 F265's repeated warning**, which appeared verbatim on four tabs of
> `Enter a Stock Adjustment`: *"any action… that results in the assignment or removal of a reason code
> designated as "As-Is Restricted" is prohibited unless the user has adequate security."* The
> designation is **`Restrict As-Is Products from being Sold`**.
>
> The other three are new and each is consequential:
>
> **`Allow Warranties to be Sold on As-Is Products`** — a per-reason decision about whether a protection
> plan can attach to damaged goods. Run 03 F12 and run 07 F342 documented plan auto-attachment without
> this constraint; **a reason code can veto it.**
>
> **`Include in the Saleable Quantity for Transfer Limits`** — whether pieces with this reason count
> toward the stock a transfer limit is measured against. Run 07 F361's `As-Is Merchandise in
> Availability` did the same for replenishment. **Two different availability questions, two different
> switches, both keyed on the reason code.**
>
> **`Check As-Is Label Number`** connects to run 04 F258's finding that As-Is moves require a label
> reprint and nothing enforces it — **this enforces it, per reason code.** Run 04 recorded that stale
> physical labels were an unaddressed integrity risk; the control exists.

### FINDING 409 — Some reason codes ship with STORIS and cannot be deleted, and defaults are protected

- **Invariant:** vendor-supplied codes are undeletable, and any code used as a default is protected.
- **Evidence** — `Reason Code Settings`:
  > "**Some reason codes come delivered with STORIS, for example `NIL` (not in location). You cannot delete these codes.** If a reason code is **used as a default elsewhere** in the system (for example, the Inventory Control Settings), **this program prevents you from deleting it.**"
  Worked examples given: **`CRK`** *(cracked)* · **`CDL`** *("customer did not like")* · **`PHY`**
  *(physical inventory updates)*.
- **Maps to:** batch 2 F359 · run 04 F239, F218 (`NIL` at the scan prompt) · run 04 F220 (`PHY`) —
  **all confirmed**; run 04 F216 (AWM's `Reserved` flag); `W-034`.

> **`NIL` is confirmed as a delivered, undeletable code meaning *not in location*** — closing run 04
> inference I-32 for the second time, now from the code table itself.
>
> The **same reserved-plus-user-defined pattern** as AWM function codes (run 04 F216): the vendor
> supplies a protected core, the site extends it. Third instance of that shape after AWM functions and
> AWM exception types.
>
> **Referential protection for defaults** matches the handling-method deletion guard in run 04 F173 —
> a code in use anywhere cannot be removed. Consistent policy across code tables.
>
> **`CDL` — "customer did not like"** is worth noting as a business fact: **STORIS's own example of a
> reason code is a no-fault return.** For a mattress retailer that is a real category, and it will have
> its own GL account by F407.

### FINDING 410 — Ten `Create a User/Group Actions - <Module> Security` records exist

- **Invariant:** the per-module security convention spans ten modules.
- **Evidence** — User Settings subsection inventory, verbatim titles:
  `Create a User Actions - **Transfer** Security` · `Create a User/Group Actions - **Import Data**
  Security` · `- **Logistics** Security` · `- **Payables** Security` · `- **Personal Information**
  Security` · `- **Purchasing** Security` · `- **Receivables** Security` · `- **Sales** Security` ·
  `- **Service** Security` · `- **System** Security`
  Plus `Create a User` · `Create a User Group` · **`User Group Clone Process`**.
- **Maps to:** run 04 batch 4 §E · run 05 F304 — **the convention is now enumerated**; `W-050`.

> Run 04 batch 4 identified the convention from three instances and corrected the audit's earlier
> framing of *"twenty unrelated permission systems"*; run 05 F304 made it four. **There are ten**, and
> the audit had found five of them by name (Logistics, Sales, Receivables, Service, and — via run 04
> F251 — Transfer).
>
> **Five are new**: Import Data, Payables, **Personal Information**, Purchasing, and **System**.
>
> **`Personal Information Security`** is the notable one. Run 07 F378 found six categories of
> encryptable PII and a dedicated permission to change the encryption settings; **this is presumably
> where access to the data itself is governed** — and it is a module-level security record devoted
> entirely to personal data. Nothing in six runs suggested it existed.
>
> **`Create a User Actions - Transfer Security` lacks the `/Group`** in its title where the other nine
> have it. **Tenth terminology drift** — or a real difference, if transfer security is user-only.
> Recorded as observed.
>
> **`User Group Clone Process`** means groups are copyable, which is how a ten-record permission model
> stays administrable.

### FINDING 411 — File attachments have three articles, closing run 05's "first sighting" gap

- **Invariant:** attachments are a maintained subsystem with view, edit and description screens.
- **Evidence** — User Settings subsection inventory: **`Attachment Description Entry Screen`**
  (15185875552660) · **`Edit File Attachments`** (15185859629972) · **`View File Attachments`**
  (15185875552276).
  With run 07 F341's **`Completed Order Attachments`** retention period.
- **Maps to:** run 05 §C (*"first sighting of file attachments in five runs… no article describes the
  mechanism"*) — **the articles exist**; run 07 F378 (`Document Archive Mask PII`); `W-064`.

> Run 05 §C found a paper-clip indicator showing attachments on an order page, a customer, or a
> product, and recorded the mechanism, storage and retention as **entirely unknown**, flagging it in
> §I as *"a document store nobody has mentioned."*
>
> **Three articles describe it**, batch 1 F341 found its retention setting, and batch 4 F378 found that
> archived documents can have PII masked. **The subsystem is real, governed and bounded** — the audit
> simply had not reached the section.
>
> Recorded from the inventory; the three articles are queued rather than read, since the mechanism's
> existence and governance were the open questions and both are now answered.

### FINDING 412 — Regional Processing has a separate reporting-rules article

- **Invariant:** how restrictions apply to reports is documented apart from how they apply to entry.
- **Evidence** — User Settings inventory: **`Regional Processing - Reporting Rules`**
  (15185859800340), a sibling of the rules article read here.
- **Maps to:** F402, F403; six runs of report boilerplate; `W-050`.

> Recorded as a named gap with a specific reason to care. **Every one of the eight `W-050` upholdings
> across six runs came from boilerplate on a report article** — *"the output of this report may be
> affected by Regional Processing restrictions."*
>
> **This is the article that says what that actually does to a report**, and it is unread. Batch 6
> read the entry-side rules; **the reporting side is where the audit's own evidence came from.**
> Queued as a priority.

### FINDING 413 — `Restrict Product Use/Lookup by Region` is enforced per product

- **Invariant:** individual products can be limited to named regions.
- **Evidence** — `Regional Processing - Rules, Notes, and Exceptions`:
  > "You can **restrict access to specific products by region**. To activate this feature, check the box at the **`Restrict Product Use/Lookup by Region`** field in the **General System Control Settings**. Then, for each product… enter the regions in the **`Limit Use by Region`** field in the **Advanced Product Settings**. To access a product that has been restricted by region, **a user's log-on region must match one of the regions specified**."
- **Maps to:** run 07 F379 (`Product Use/Lookup` as one of four restriction switches) — **the
  mechanism**; run 04 F252 (`Inventory Availability` can pin stock to its selling store); `W-055`.

> Batch 4 F379 listed `Product Use/Lookup` as one of Regional Processing's four restriction categories.
> **This is how it works**: a global switch plus a per-product region list.
>
> It sits beside run 04 F252's `Inventory Availability` restriction — *"a product cannot be transferred
> if its distribution status includes an inventory availability status restricted to the selling
> store"* — as a **second product-level location constraint**, on a different axis. F252 restricts
> *movement*; this restricts *visibility and use*.
>
> Two mechanisms, two records, both keyed on the product, neither referencing the other. **For a
> rebuild these are one concept — "where may this product exist and be sold" — and STORIS splits it.**

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Reason Code Settings** | Reason Code · Description · **This Reason is Used for** · **Status Letter Template** · **Commission Category** · Account Status · Description · **Inventory Adjustments General Ledger Account** · **Revolving Balance Adjustments General Ledger Account** · **Restrict As-Is Products from being Sold** · **Allow Warranties to be Sold on As-Is Products** · **Include in the Saleable Quantity for Transfer Limits** · **Check As-Is Label Number** · Actions |
| **Regional Processing** *(reference article)* | *(no fields; documents the four-level hierarchy, fifteen exceptions, and the service-location fall-through)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Restrict Product Use/Lookup by Region** | General System Control Settings | Enables per-product region limits (F413) |
| **Limit Use by Region** | **Advanced Product Settings** | The per-product region list (F413) |
| **Restrict Inter-Region Transfers** | General System Control Settings | Blocks cross-region transfers **and** cross-region sales order lines (F406) |
| **Two GL accounts + four behaviour switches** | **Reason Code Settings** | Per-reason posting and sellability (F407, F408) |

---

## E. Security permissions catalog — consolidated

**The ten module security records** (F410):

| Record | First seen |
|---|---|
| `Create a User/Group Actions - Sales Security` | run 03 |
| `- Receivables Security` | run 04 F202 |
| `- Logistics Security` | run 04 F170 *(7 named fields)* |
| `Create a User Actions - Transfer Security` | run 04 F251 |
| `- Service Security` | run 05 F304 |
| **`- Personal Information Security`** | **run 07 — new** |
| **`- Purchasing Security`** | **run 07 — new** |
| **`- Payables Security`** | **run 07 — new** |
| **`- Import Data Security`** | **run 07 — new** |
| **`- System Security`** | **run 07 — new** |

Plus `Create a User`, `Create a User Group`, `User Group Clone Process`, and **Extended Security**
(run 06 F323) as the layer beneath.

**The five *kinds* of access control** identified in run 04 stand, with the mechanism for the second
now documented:
1. user/group permissions — **ten module records**
2. **Regional Processing** — four-level hierarchy, fifteen exceptions (F402, F403)
3. state-based locks — manifest membership, aisle locks, order exclusivity
4. location-pair matrices — transfer security tables
5. value-attached restrictions — **`Restrict As-Is Products from being Sold`** (F408)

**And a sixth is now visible:** **session-accumulated scope** (F404) — access that widens as documents
are opened.

---

## F. State machines and enumerations (additions)

- **Regional Processing hierarchy (4 levels + warehouse fallback)** — F402.
- **Access axes (2):** district *(sales)* · region *(inventory)* — F402.
- **Documented exceptions (15)**, including **no restriction at all** for COG and physical inventory —
  F403.
- **Service location fall-through (5 levels)** — F405.
- **Module security records (10)** — F410.
- **Reason code attributes:** type · status letter template · commission category · account status ·
  **two GL accounts** · four behaviour switches — F407, F408.
- **Delivered reason codes:** `NIL` *(undeletable)*; examples `CRK`, `CDL`, `PHY` — F409.

---

## G. Sequencing rules

1. Access check → **no restriction / store / region-district / location list → warehouse-record list**
   (F402).
2. Document opened → **its locations join the session's valid list** (F404).
3. Customer zip code has no service location → **five-level fall-through, ignoring access** (F405).
4. Transfer created → **from-location access required, to-location not**, unless inter-region is
   restricted (F406).
5. Adjustment made → **the reason code selects the GL account** (F407).
6. Reason code assigned or removed → if `Restrict As-Is Products from being Sold`, **security or a
   manager override is required** (F408, run 04 F265).

---

## H. Open questions and gaps

### Resolved this batch

- **The Regional Processing mechanism** — eight upholdings, now specified (F402, F403).
- **The `As-Is Restricted` field** — run 04 F265's repeated phrase identified (F408).
- **The reason-code model** — run 04 F265 called for design attention; it is typed, GL-bearing and
  behaviour-carrying (F407).
- **File attachments** — run 05 §I's *"document store nobody has mentioned"*: three articles plus a
  retention setting and PII masking (F411).
- **The module security convention** — ten records enumerated (F410).
- **`NIL`** — confirmed twice now (F409).

### Newly opened — priority

- **`Regional Processing - Reporting Rules`** (F412). **Every `W-050` upholding in six runs came from
  report boilerplate; this is the article that explains it.** Highest priority.
- **`Create a User/Group Actions - Personal Information Security`** — a security record devoted to
  personal data, unseen in six runs (F410).
- `Create a User` · `Create a User Group` · `User Group Clone Process` — the identity model.
- `Regional Processing - Reporting Rules` · the nine unread module security records — **the
  consolidated permission catalogue is now a tractable, enumerated task.**

### Still open

- **`Twilight`** and **`ELP`** remain undefined.
- **`Account Status`** on a reason code — unexplained.
- **`This Reason is Used for`** — the type enumeration's values are not published.

### Inferences (recorded as inference, not fact)

- **I-72:** `Create a User Actions - Transfer Security` omits `/Group` because transfer security is
  user-level only. *The title differs consistently from the other nine; no article states why.*
- **I-73:** `Personal Information Security` governs access to the six PII categories that
  General System Control Settings can encrypt. *The pairing is suggestive; the record is unread.*

---

## I. Unknown unknowns

- **Access widens by ordinary use** (F404). Six runs treated location scope as a static property of a
  user. It is a session-accumulating set, and **any access audit is therefore a function of what
  someone happened to open.** That is very hard to reason about after the fact and should not be
  reproduced without a deliberate decision.
- **A customer code defeats location scoping** (F403). The most-cited access control in the audit has
  a documented bypass available to anyone who knows a number.
- **The security model has a gap justified by an assumption about who looks** (F403's costing table).
  Stated plainly by the vendor. There may be others of the same shape, and they will not be labelled.
- **Reason codes post to the general ledger** (F407). The audit spent four runs treating them as
  labels, then as gates. **They are also an accounting dimension**, which means the reason-code table
  is part of the chart of accounts design and not a lookup list.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **District / Region** | The two access axes — sales scopes by district, inventory by region |
| **Location list** | A named set of locations on the user or warehouse record |
| **`Restrict As-Is Products from being Sold`** | The "As-Is Restricted" designation on a reason code |
| **`Limit Use by Region`** | Per-product region restriction in Advanced Product Settings |
| **`CRK` / `CDL` / `PHY` / `NIL`** | Example and delivered reason codes; `NIL` is undeletable |
| **Personal Information Security** | A module security record devoted to personal data |
| **User Group Clone Process** | Copies a permission group |

---

## Contract adjudication — batch 6

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — the model behind eight upholdings is now documented, and a sixth *kind* found** | Four-level hierarchy (F402); fifteen exceptions including two open holes (F403); **session-accumulated scope** (F404); ten module records (F410) |
| **W-052 / W-053** *(GL)* | **CONFIRMED and materially extended** | **Reason codes carry two GL accounts** (F407) |
| **W-055 / W-056** *(availability)* | **CONFIRMED** | Per-product region limits (F413); reason-code transfer-limit inclusion (F408) |
| **W-061** *(cost)* | **relevant** | Reason code selects the inventory adjustment account (F407) |
| **W-028** *(protection plans)* | **CONFIRMED, with a new constraint** | A reason code can veto warranty sale on As-Is goods (F408) |
| **W-034** *(deletion)* | **CONFIRMED** | Delivered codes undeletable; defaults referentially protected (F409) |
| **W-064** *(retention)* | **consistent** | File attachments have a retention (F411, F341) |
| **Session-accumulated access** | **NEW — no contract covers it** | F404 |

---

## Next — batch 7

**`Regional Processing - Reporting Rules`** *(highest priority — it explains six runs of evidence)* ·
`Create a User` · `Create a User Group` · **`Create a User/Group Actions - Personal Information
Security`** · `- System Security` · `- Purchasing Security` · `- Payables Security` — building
toward the **consolidated permission catalogue** across all ten module records.
