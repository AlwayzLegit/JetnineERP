# Run 07 — System Administration — Batch 23: Vendor Credits, Buying Groups and Delivery Tables

Status: complete. Findings 667–677. Read-only throughout.

**Three distinct vendor-credit instruments** with different GL behaviour, the **buyer-assignment
hierarchy**, and a set of delivery tables — including one (**F676**) whose immutability design is the
best data-integrity work the audit has found. Batch 15 F528's field-count discrepancy is **resolved
in the opposite direction to expectation** (F672).

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Bill Back Settings** | 15243030216596 | read |
| 2 | **Cost Reduced Bill Back Settings** | 15243031910548 | read |
| 3 | **Deduct From Invoice Settings** | 15243032141204 | read |
| 4 | **Buying Group Settings** | 15243031911444 | read |
| 5 | **Broker Settings** | 15243030215700 | read |
| 6 | **EDI Status Details Settings** | 15243030412308 | read |
| 7 | **Advanced Vendor Settings - Read Only** | 15242997505812 | read — **corrects batch 15 F528** |
| 8 | **Advanced Vendor Category and Group Exception Settings - Volume Rebates** | 15243029154068 | read |
| 9 | **Delivery Charge Settings** | 15243031916948 | read |
| 10 | **Drop Off Storage Location Table** | 15243029579668 | read |
| 11 | **Delivery Survey Settings** | 15243032151316 | read — `11.0`/`10.8` |
| 12 | **Delivery Contact Status Settings** | 15243031912852 | read |

**Vendor Settings inventoried** (94 articles, listing read in full). The subsection contains **eleven
`Advanced Vendor Category and Group Exception Settings` variants** — one per exception field — which
explains why batch 15 could not reconcile the field count from the parent article alone. Named but
not read: `Account Number Entry Screen` · `Action - Volume Rebate Exceptions` · the ten remaining
exception variants (`Auto-Fill Days`, `Discount Costing`, `Excess Stock Days`, `Factory Default
Warranty`, `Landed Cost Add-Ons`, `Lead Pad Days`, `Minimum Stock Days`, `Purchase Delivery Pad
Days`, `Purchase Lead Days`) · `Bank Override` · `Birdeye Settings` · `Deliver To Settings` ·
`Delivery To Description Lookup` · `Electronic Merchant Settings` · `Enter In Transit Days by
Location` · `Enter New Ship-From ID Window` · `Enter Payables Company by Location` + ~50 more.

---

## B. Wiring findings

### FINDING 667 — Three vendor-credit instruments, distinguished by when and where the money lands

- **Invariant:** DFI reduces the bill, bill-back creates a receivable, CRD does both in sequence.
- **Evidence** — `Deduct From Invoice Settings`:
  > "Use this file to **add discounts to purchase orders** and to set up chain discounts. You can add DFI codes via the **Advanced Vendor Settings and Collection Settings**."
  `Bill Back Settings`:
  > "…codes used in Purchase Order Processing to indicate that **the vendor for a PO line item owes money that will not automatically be deducted from the bill. When you use a bill back code, the system creates a vendor receivable for the money owed from the vendor instead.**"
  `Cost Reduced Bill Back Settings` — the full posting sequence, verbatim:
  > "**CRD purchase credits are a 'hybrid' of the existing bill-backs and DFI's (deduct from invoice).**"
  > "When you apply a CRD to a purchase order line item, the system **uses the discounted cost as the receipt cost (similar to a DFI), debits the inventory general ledger account, and debits the costing table.**"
  > "When you approve the AP bill for the product, the system **creates a vendor receivable open item for the discounted amount (similar to a bill-back), debits the vendor receivables account, and credits the CRD general ledger account.**"
  All three carry `General Ledger Account` and `Include Service Parts`.
- **Maps to:** run 01 (AP, vendor receivables) · run 02 (purchase order costing) · run 03 F144 (the
  margin chain) · batch 22 F656 (costing table) · W-052, W-061.

> **This is the clearest GL posting narrative in the entire audit** — a full double-entry sequence
> across two events, stated in the documentation rather than inferred. It is worth treating as the
> reference example of how STORIS describes accounting when it chooses to.
>
> **The three instruments differ on two axes**: whether the *receipt cost* is reduced, and whether a
> *receivable* is raised.
>
> | | Reduces receipt cost | Creates vendor receivable |
> |---|---|---|
> | **DFI** | yes | no |
> | **Bill back** | no | yes |
> | **CRD** | **yes** | **yes** (at AP approval) |
>
> **CRD's two-phase posting is the important detail for the rebuild:** inventory and the costing table
> are debited at *receipt*, but the receivable and the CRD account only move at *AP approval*. So
> between those two events the books carry a reduced cost with no corresponding claim recorded.
> **That window is exactly where batch 22 F665's TPA behaviour extends the gap**, since under
> Third-Party Accounting AP approval is deferred to a later End of Day.
>
> **All three write to the costing table**, which run 03 F144 established is the substrate of
> provisional margin. **Vendor credits are therefore a fourth input to the margin restatement chain**,
> alongside PO receipt, cost exceptions and As-Is disposition.

### FINDING 668 — Chain discounts compound on the already-reduced cost

- **Invariant:** successive DFI discounts apply to the running discounted amount, not the original.
- **Evidence** — `Deduct From Invoice Settings` **and** `Bill Back Settings`, identical text:
  > "**Use this feature if you want to include multiple DFI discounts on a single line item. After applying the first DFI, the system applies the subsequent DFI discounts to the reduced cost, rather than the 'before discount' amount. That is, the system applies the DFI discount to the previously discounted amount.**"
  Fields: `Percent or Dollar` · `Rate or Amount` · **`Chain Discount`** · `Include Service Parts`.
- **Maps to:** F667 · batch 19 F609 (matrix formulas) · W-061.

> **Compounding, not summing** — 10% then 10% is 19%, not 20%. **Stated twice, in two articles, in
> identical words**, which is STORIS pre-empting the obvious wrong implementation.
>
> **Order therefore matters**, and nothing in the field list says what determines it. The `Chain
> Discount` flag marks a code as participating; the sequence in which participating codes apply is
> unstated. **§H** — and it is materially different money, so it is worth a parity test rather than an
> assumption.
>
> **`Include Service Parts` appears on all three credit records** — a consistent scope flag deciding
> whether the instrument reaches service-parts lines. A rebuild should model it once.

### FINDING 669 — A purchase order must have exactly one buyer, found through a three-rung search

- **Invariant:** with buying groups active, every product on a PO must resolve to the same single buyer.
- **Evidence** — `Buying Group Settings`:
  > "Use this routine to **assign purchasing responsibilities to users based on vendor, vendor ship-from, and individual product.**"
  > "To activate…check the box at the **`GENERAL - Activate Buying Group`** field in the **Purchasing Control Settings**. **If you activate this feature, all products added to a purchase order must contain a buyer and they must all contain the same (single) buyer.** The system uses the following hierarchy to search for a buyer:
  > 1. Search the Advanced Product Settings for a buying group. If none is found,
  > 2. Search the Advanced Product Settings for a **Vendor Ship-From address**. If found, check the **Vendor Ship-From record** for a buying group. If none is found,
  > 3. Search the Advanced Product Settings for a buying group."
  > "Once a buying group is established, **the system pulls the buyer's initials from the Buying Group record.**"
  Tabs: Vendor · Vendor Ship-From · Product. Fields: `Buying Group` · `Vendor` · `Description` ·
  **`Buyer Initials`** · per-tab grids.
- **Maps to:** batch 15 F539 (ship-from as a commercial identity) · batch 15 F522 (ship-from in the
  lead-days hierarchy) · batch 11 (Advanced Product Settings) · W-016.

> **The published hierarchy is self-contradictory: rungs 1 and 3 are the same instruction.** *"Search
> the Advanced Product Settings for a buying group"* appears twice, with the ship-from lookup between
> them. **This is the same defect class as batch 15 F511's duplicated reservation bullet** and batch
> 15 F528's field-count mismatch. Recorded, **not repaired by guessing** — though the likely intent is
> product → ship-from → vendor, since the Buying Group record has exactly those three tabs. **§H.**
>
> **The single-buyer constraint is the substantive finding.** With the feature on, a PO cannot mix
> products belonging to different buyers — which means **buyer assignment silently constrains PO
> composition**. A buyer with a product no one else stocks forces a separate PO. That is a real
> operational consequence of a settings choice, and it is easy to miss when the feature is switched on
> after go-live.
>
> **Ship-from appears in a third hierarchy** (after lead days and in-transit days), confirming batch 15
> F539's conclusion that it is a first-class dimension rather than an address.

### FINDING 670 — Customs brokers are a modelled entity used by import purchase orders

- **Invariant:** broker records are referenced during import PO entry and printing.
- **Evidence** — `Broker Settings`:
  > "Use this routine to create and maintain information on the **customs brokerages you use when importing merchandise. The system references the Broker Settings when entering import purchase orders and printing import purchase order documents via `Design Enhanced Laser Forms`.**"
  > "Brokers **prepare documents and/or electronic submissions, calculate (and often pay) taxes, duties and excises on behalf of the client**, and facilitate communication…"
  > "**NOTE: The names of the following three fields are derived from the user-defined settings in the Country file.** The prompt names below derive from the default country United States. However, **the prompt names you see on your STORIS screen may differ depending on the country specified in the `Country` field** above and the settings for that country in the Country file."
  Fields: `Broker ID` · `Description` · `Country` · `Address Line` · `City` · `State` · `Zip Code` ·
  `Contact Name` · `Dial Prefix` · `Telephone Number` · `Ext` · `Fax Number`.
- **Maps to:** batch 15 F539 (`FOB Code`, `Freight Policy`, freight forwarders) · batch 15 F530
  (landed cost add-ons: *"duties, tariffs… broker's fees"*) · batch 18 F537 (country-driven labels) ·
  W-061, W-062.

> **The import chain is now assembled across three batches**: `Vendor Ship From Settings` carries the
> `FOB Code` that surfaces freight-forwarder contacts (batch 15 F539); landed-cost add-ons carry
> duties, tariffs and broker's fees (batch 15 F530); and this is the broker entity itself.
> **`Load Import Tariff` in the batch-22 listing is the fourth piece**, unread.
>
> **Country-driven field labels confirmed outside the vendor/customer records** (batch 18 F537). It is
> a general UI mechanism, not a customer-master feature — **so the rebuild needs country-parameterised
> address rendering everywhere, not in two screens.**
>
> **`Design Enhanced Laser Forms` again** (batch 20 F636) — now the third consumer, after collection
> letters and print forms. **Strengthens I-103** (`ELP` = Enhanced Laser Print/Forms) without proving
> it.

### FINDING 671 — Five delivered EDI shipment-milestone codes, site-extensible

- **Invariant:** STORIS ships a starter set of status detail codes and permits additions.
- **Evidence** — `EDI Status Details Settings`:
  > "Use this routine to establish **EDI status detail codes that are used in the tracking of shipment milestones** in STORIS when using EDI processing. These codes are referenced in the **EDI Status Details screen**, available from purchasing entry and view routines."
  > "**The Status Details Codes shown below are supplied by STORIS. You can create additional codes as needed** using this process."

| Code | Description |
|---|---|
| `AE` | Loaded on Vessel |
| `AR` | Arrived by Rail at Destination |
| `CT` | Customs Released |
| `VA` | Arrival of First Port |
| `X1` | Arrived at delivery location |

- **Maps to:** batch 15 F533 (215/214 documents) · batch 15 F527 (in-transit days, EDI-only) ·
  F670 (customs) · W-058.

> **The delivered codes describe ocean freight**: vessel loading, first port arrival, customs release,
> rail movement, final delivery. **That is an import supply chain**, and it corroborates F670 — STORIS
> expects furniture to arrive by container.
>
> **These are ANSI X12 status codes** (from the 214 transaction set), which makes this the second
> externally-standardised code table after the Metro 2 exhibits (batch 20 F622). **Unlike Metro 2,
> this one is extensible** — the site may add codes the standard does not define, which would break
> interoperability if transmitted. The docs do not warn about that. §H.

### FINDING 672 — The read-only twin documents **five** exception fields where the entry version documents seven

- **Invariant:** the two versions of Advanced Vendor Settings disagree on which fields open exception screens.
- **Evidence** — `Advanced Vendor Settings - Read Only`:
  > "**NOTE: If you click on the Action button at any of the following five fields**, the option appears to establish settings for these fields at the product category and/or product group level for a specific vendor."
  followed by exactly five: **`Auto-Fill Days` · `Purchase Lead Days` · `Excess Stock Days` ·
  `Minimum Stock Days` · `Factory Default Warranty`**.
  The entry version (batch 15 F528) says *"the following five fields"* and lists **seven**:
  `Auto-Fill Days` · `Lead Days` · `Lead Pad Days` · `PO Pad Days` · `Excess Stock Days` ·
  `Minimum Stock Days` · `Factory Default Warranty`.
  The Vendor Settings subsection listing contains **eleven** exception-screen articles, including
  `Discount Costing`, `Landed Cost Add-Ons`, `Purchase Delivery Pad Days` and `Volume Rebates` —
  **none of which appears in either list**.
- **Maps to:** **batch 15 F528** — **the discrepancy is worse than recorded, not better** ·
  batch 15 F522 (lead-days rungs 7–8) · W-014.

> **Batch 15 concluded that "seven is almost certainly right and five is a stale sentence". That
> conclusion is now unsafe.** The read-only twin says five *and lists five consistently* — so the
> "five" is not a stale count attached to a longer list; it is a **different, internally coherent
> list**. And the section listing shows **eleven** exception screens exist.
>
> **Three sources, three answers: 5, 7, 11.** The audit will not pick one. What can be said with
> confidence is that **the eleven articles are the ground truth for which exception screens exist**,
> since each is a documented screen; the prose counts in the parent articles are unreliable.
> **Recorded as a correction to batch 15 F528, downgrading its conclusion.** §H.
>
> **For the rebuild this matters** because rungs 7–8 of the ten-rung lead-days hierarchy (batch 15
> F522) are group/category exceptions — **so the exception mechanism is broader than the lead-days
> chain suggested**, reaching discount costing, landed cost add-ons and volume rebates too.
>
> **Independently: the read-only twin's field list also drops `Days for Replenishment` and
> `Minimum Sales Rate`** from the Auto PO Replen tab, and its NOTE reads *"These settings to NOT
> apply"* (sic). **The twin is not a faithful copy of the entry version's documentation.**

### FINDING 673 — Volume rebates take group and category exceptions, with defaults shown alongside

- **Invariant:** the exception screen displays the vendor's default rebate beside the overriding entry.
- **Evidence** — `Advanced Vendor Category and Group Exception Settings - Volume Rebates`:
  > "Use this window to specify **one or more exceptions to the volume Rebate specified in the Advanced Vendor Settings.** You can specify auto-fill exceptions for the selected vendor by **either Group or Category.**"
  > "This screen appears when you click on the Action button at the `Code` field in the **Volume Rebate section** of the Advanced Vendor Settings."
  Fields: Vendor · `Code` · `Type` · `Amount/Percent` · **`Default Settings`** (`Start Date` ·
  `End Date`) · `Category/Group Code` · `Description` · `Code` · `Start Date` · `End Date` · `Type` ·
  `Amount/Percent`.
- **Maps to:** F672 · batch 15 F528 (*"The Vendor field and the Default Days field…populate
  automatically and cannot be edited"*) · W-061.

> **Same design as batch 15 F528's date exceptions: the default is shown, read-only, beside the
> override.** That is good UI — you can see what you are overriding — and it is now confirmed across
> two of the eleven exception variants, so it is the pattern rather than a one-off.
>
> **Volume rebates are dated** (`Start Date` / `End Date` on both default and exception), so a vendor's
> rebate programme is time-boxed and can differ by product group within the same period. **Rebate
> accrual is therefore a four-dimensional lookup**: vendor × group-or-category × date × type.
>
> The article's own text says *"you can specify **auto-fill** exceptions"* on a **volume rebate**
> screen — **copy-paste residue from the auto-fill variant.** Another instance of the documentation's
> reliability limit in this family.

### FINDING 674 — Default delivery charges resolve product → group → category → zip

- **Invariant:** a four-rung hierarchy defaults the sales-order delivery charge, first match wins.
- **Evidence** — `Delivery Charge Settings`:
  > "Use this routine to specify **default delivery charge amounts** to appear on sales orders for selected products being delivered to selected zip codes."
  > "**Order-entry searches for a delivery charge using the following hierarchy and defaults the first one found: Product · Product Group · Product Category · Zip Code**"
  > "You can specify products by any of the following 'file types': **individual product · product group · product category**"
  > "**Note: Changes made here to an existing delivery charge will not apply to open orders unless the fulfillment method or deliver-to address are changed.**"
  > "If the `Delivery Charge` field contains an amount that has already been specified for another zip code…, **a prompt appears with the option to edit the delivery charge for all found to share the same delivery charge.** If you say Yes, **'…' appears in the Zip Code/Postal Code field, indicating multiple codes are selected for editing.**"
  Fields: `Level` · `Zip Code/Postal Code` · `Product` · `Group` · `Category` · `Delivery Charge`.
- **Maps to:** batch 18 F591–F594 (delivery charge tables — a **different** mechanism) · batch 19 F619
  (zip codes) · W-059.

> **This is a second, independent delivery-charge system**, and the audit had not distinguished it.
> Batch 18 read `Delivery Charge Table Settings` — banded pricing by weight/cube attached to a
> *delivery company*. **This is a flat per-product-per-zip default attached to nothing.** Two
> mechanisms, two records, no stated interaction. **§H — a material gap**, because delivery revenue is
> customer-visible and the two could disagree.
>
> **Zip is the *last* rung, not the first**, which is counter-intuitive: a product-specific charge
> beats a geography-specific one. So a bulky item costs the same to deliver everywhere unless someone
> configures otherwise.
>
> **The bulk-edit prompt is a mass-update triggered from a single-record screen** — the same shape as
> batch 14 F514's kit-price cascade, and the same recommendation: **show the count before acting.**
>
> **The non-propagation clause has a conditional escape**: changes reach open orders *only* if
> fulfilment method or deliver-to address changes. So it is **resolve-once-and-store with a
> recalculation trigger** — the eleventh instance of the idiom and the first with a documented
> invalidation condition.

### FINDING 675 — A route-to-bin table lets RF receivers skip scanning the drop-off location

- **Invariant:** if the inbound truck's route is in the table, the scanned piece is auto-assigned to the mapped storage location.
- **Evidence** — `Drop Off Storage Location Table`:
  > "Use this routine to pre-define drop off storage locations. **This table allows the RF gun user to not scan the drop off location when a transfer truck arrives at a warehouse.**"
  > "**During the transfer receiving process, if the linked document's truck or route is included in this table for the receiving warehouse, the scanned piece is dropped in the corresponding storage location; this location is displayed on the scanner. If the linked document's truck or route is not found in this table, or the linked document is a customer pick up, the piece is dropped in the initially entered storage location.**"
  Fields: `Route Code/Truck` · `Storage Location`.
- **Maps to:** batch 15 F534 (`Staging Area` and the seven location flags) · batch 15 F535 (directed
  putaway) · run 04 (RF transfer receiving) · W-056, W-059.

> **A labour-saving shortcut with a silent fallback.** Two conditions send the piece to the manually
> entered location instead: route not in the table, **or the document is a customer pickup**. Neither
> raises anything — the operator simply gets the behaviour they would have had anyway.
>
> **This is a third putaway-destination mechanism**, after `Putaway Destination` on the storage
> location (batch 15 F535) and the velocity/category match. **No article states the precedence among
> them.** §H — and it is now the third time the audit has met an unresolved putaway tie-break, which
> reinforces batch 15's conclusion that this is a genuine vendor question.
>
> **Route is doing double duty**: batch 15 F518 found `Route Code` on the Stock Location Schema
> carrying a delivery route with a sourcing choice; here route determines a *bin*. **Route is a
> first-class key across logistics, not just a delivery attribute.**

### FINDING 676 — Survey questions are deliberately immutable, with two different refusal behaviours

- **Invariant:** questions cannot be deleted; editing the text warns, editing the response or order type is refused outright.
- **Evidence** — `Delivery Survey Settings`:
  > "You create the questions in advance, and **you cannot edit individual questions once you create them. In this way, you establish continuity in your surveys.**"
  > "**Because removing an existing question invalidates any existing results for that question, the program prevents you from deleting questions. Thus, the Remove button for the grid and the Delete button are never active in this routine.**"
  > "**if you edit the text of the question, a message appears warning that changing the context of the question may invalidate previous results for the question. You can continue or cancel.**"
  > "**if you edit the `Response Type` or `Order Type` fields, an error message appears stating that changing these fields may invalidate existing answers in the survey results file. The program cancels the Add, and prevents you from saving the changes.**"
  > "**NOTE: The system purges survey responses (but not the questions) via the End-of-Month process.**"
  Fields: `Survey ID` · `Question` · `Response Type` · `Order Type` · `Active Question`.
- **Maps to:** batch 14 F509 (immutable `Inventory Availability`) · batch 17 F577 (history-based
  deletion) · batch 22 F666 (destructive-routine safety) · W-034, W-064.

> **This is the most carefully-reasoned data-integrity design in the audit**, and it is on a delivery
> survey — not on money, not on inventory. STORIS distinguishes **three levels of change risk** on one
> screen:
>
> | Change | Consequence | Behaviour |
> |---|---|---|
> | Delete a question | Existing results become orphaned | **Impossible — buttons never active** |
> | Edit question text | Results remain valid but mean something else | **Warn, allow with confirmation** |
> | Edit response/order type | Existing answers become uninterpretable | **Refused outright** |
>
> **That is exactly the right taxonomy** — semantic drift is a judgement call, structural
> incompatibility is not — and it is a pattern the rebuild should adopt wherever historical results
> reference a definition. **It is also the ninth deletion behaviour** in the audit's catalogue:
> *never deletable because history depends on it*, distinct from batch 17 F577's history-based
> *blocking* (which lifts if there is no history).
>
> **`Active Question` is how questions are retired instead** — soft deactivation replacing deletion.
> **And responses are purged monthly while questions are not**, so the question set is permanent and
> the answers are ephemeral. **A rebuild retaining survey analytics must extract before EOM.**

### FINDING 677 — Delivery contact status is a bare code table feeding a permissioned field

- **Invariant:** a two-field code table supplies the values a permission controls changing.
- **Evidence** — `Delivery Contact Status Settings`:
  > "Use this routine to create and maintain **delivery contact status codes.**"
  Fields: `Code` · `Description`.
  Paired, from the Sales Security dissection earlier this session: the permission
  **`Change delivery contact status`**, and the non-boolean setting
  **`Delivery Contact Status Codes`** (a per-user code *set*).
- **Maps to:** **the Sales Security handoff §4** (`Delivery Contact Status Codes` as a per-user
  code_set) · run 04 (delivery contact) · W-050, W-059.

> **This is the definition behind one of the three non-boolean entries the Sales Security handoff
> flagged.** The handoff established that `Delivery Contact Status Codes` is a **per-user set** rather
> than a permission; this is where the set's members are defined.
>
> **That closes the loop on the handoff's schema recommendation.** The `code_set` value type is not
> hypothetical — it exists to hold subsets of *this* table, so a user can be allowed to move a
> delivery to some contact statuses and not others. **The rebuild's permission model needs the union
> type**, and now has a concrete first consumer.
>
> The table itself is site-owned and unconstrained — no delivered codes, no delete rule stated.

---

## C. Screen and field inventory (additions)

Inline above. `Buying Group Settings` tabs: **Vendor · Vendor Ship-From · Product**.
`Advanced Vendor Settings - Read Only` tabs mirror the entry version: General · Shipping ·
PO Cutting Date · Auto PO Replen — **with a materially different field list** (F672).

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `GENERAL - Activate Buying Group` | **Purchasing Control Settings** | Turns on the single-buyer PO constraint (F669) |
| `Chain Discount` | DFI / Bill Back Settings | Marks a code as participating in compounding (F668) |
| `Include Service Parts` | DFI / Bill Back / CRD Settings | Whether the credit reaches service-parts lines (F667) |

---

## E. Security permissions catalog (additions)

| Permission | Record | Effect |
|---|---|---|
| `Change delivery contact status` | Sales Security | Gates the field whose values F677 defines |
| `Delivery Contact Status Codes` *(code set, not boolean)* | Sales Security | The subset of F677's codes a user may assign |

---

## F. State machines and enumerations (additions)

**Vendor credit instruments** — DFI · bill back · CRD, distinguished by receipt-cost reduction and
receivable creation (F667).

**EDI status detail codes** — five delivered (`AE` · `AR` · `CT` · `VA` · `X1`), site-extensible
(F671).

**Advanced Vendor exception fields** — **5, 7 or 11 depending on the source** (F672). The eleven
documented exception-screen articles are the most reliable evidence.

---

## G. Sequencing rules (additions)

**Chain discounts compound on the running amount** (F668) — not additive, order-sensitive, order
undefined.

**Buyer resolution** — a three-rung search whose published rungs 1 and 3 are identical (F669).

**Default delivery charge** — product → group → category → **zip last** (F674).

**Resolve once, store the answer — eleventh instance, first with a documented invalidation trigger**:
delivery charge changes reach open orders only if fulfilment method or deliver-to address changes
(F674).

**Immutability graded by change risk** (F676) — delete impossible, semantic edit warned, structural
edit refused.

---

## H. Open questions and gaps

1. **Two independent delivery-charge systems** (F674 vs batch 18 F591–F594). Flat per-product-per-zip
   defaults and delivery-company banded tables, with **no stated interaction**. Delivery revenue is
   customer-visible; this needs resolving.
2. **Chain discount application order is undefined** (F668). Compounding makes order material.
3. **Batch 15 F528's conclusion is downgraded** (F672). Three sources give 5, 7 and 11 exception
   fields. The eleven articles are the best evidence; the prose counts are unreliable.
4. **Buyer hierarchy rungs 1 and 3 are identical as published** (F669). Likely intent is
   product → ship-from → vendor; **not adopted.**
5. **Third putaway-destination mechanism with no stated precedence** (F675). Third sighting of this
   gap — reinforces it as a vendor question.
6. **Site-added EDI status codes could break interoperability** (F671) — the docs permit additions to
   an X12-derived set without warning.
7. **The CRD posting window** (F667) — reduced cost is booked at receipt, the receivable only at AP
   approval, and TPA defers approval further (batch 22 F665).

**Inferences**

- **I-107** — the eleven exception-screen articles are the true field list, and both prose counts are
  stale. **Consistent with the evidence but not stated anywhere.**
- **I-108** — `AE`/`AR`/`CT`/`VA`/`X1` are ANSI X12 214 status codes. **Format not named in the
  article.**

---

## I. Unknown unknowns

- **`Collection Settings`** (F667, *"You can add DFI codes via the Advanced Vendor Settings and
  Collection Settings"*) — a vendor-side record sharing DFI codes. Unread, and its name collides with
  the customer-side collections of batch 20.
- **`Load Import Tariff`** (batch 22 listing) — the fourth piece of the import chain.
- **`Per Piece Delivery Charge Settings`** (related-articles link on F674) — a **third** delivery
  charge mechanism.
- **`Birdeye Settings`** in Vendor Settings — a third reputation-management vendor, absent from batch
  17 F562's 23 integration tabs. **Further evidence that inventory is incomplete.**
- **`Bank Override`** and **`Enter Payables Company by Location`** — per-location payables routing.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **DFI** | Deduct From Invoice — a discount reducing the vendor bill |
| **Bill back** | A vendor debt raised as a vendor receivable rather than deducted |
| **CRD** | Cost Reduced Discount — reduces receipt cost *and* raises a receivable at AP approval |
| **Chain discount** | Successive DFIs compounding on the already-reduced cost |
| **Buying group** | A buyer plus the vendors, ship-froms and products they are responsible for |
| **Broker** | A customs brokerage referenced by import purchase orders |
| **EDI status detail** | A shipment milestone code (`AE`, `CT`, …) tracked against a PO |
| **Drop off storage location** | A route-to-bin mapping letting RF receivers skip a scan |

---

## Contract adjudication — batch 23

| Contract | Verdict | Basis |
|---|---|---|
| **W-052 / W-061** *(GL and cost)* | **CONFIRMED — full posting sequence documented** | CRD's two-phase entries (F667) |
| **W-062** *(vendor credits / rebates)* | **CONFIRMED — three instruments, not one** | F667, F668, F673 |
| **W-016** *(purchasing)* | **CONFIRMED — with a composition constraint** | Single-buyer PO rule (F669) |
| **W-058** *(EDI)* | **CONFIRMED** | Five delivered milestone codes, extensible (F671) |
| **W-059** *(delivery)* | **CONTRADICTED in part** | Two unreconciled delivery-charge systems (F674) |
| **W-056** *(putaway)* | **CONFIRMED — third mechanism, precedence still unstated** | F675 |
| **W-034** *(deletion)* | **CONFIRMED — ninth behaviour** | Never-deletable because history depends on it (F676) |
| **W-050** *(access control)* | **CONFIRMED** | The code set behind a per-user permission subset (F677) |
| **W-014** *(hierarchy documentation reliability)* | **CONTRADICTED** | Three sources, three field counts (F672) |
| **Immutability graded by change risk** | **NEW — no contract covers it** | F676 |

---

## Next — batch 24

**Product Settings tail** (~74 unread) — categories, groups, brands, collections, `Price Adjustment
Settings`, `Product Type Codes`, `Substitute Product Selection`, `Web Item Add-On Settings`.
