# Run 04 — Inventory Management — Batch 9: Stock adjustments, cost exceptions, costing layers

Status: complete. Findings 259–270. Read-only throughout. **No adjustment entered, no cost exception
corrected, no write-off performed.** `Enter a Stock Adjustment` documents twelve tabs of immediately
destructive operations; nothing in it was exercised.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Enter a Stock Adjustment** | 15185855767060 | read — **twelve tabs; named GL postings; six permissions** |
| 2 | Cost Exception Types | 15185804531348 | read — **confirms run 02 verbatim** |
| 3 | Correct a Cost Exception *(Cost Exception Adjustments)* | 15185837613332 | read |
| 4 | Layer Detail Window | 15185804550804 | read — **costing layers are piece-level** |

**Inventory subsection inventory (44), captured in full.** Families: cost exceptions (3) · As-Is
processing (7) · returns to vendor (4) · receiving schedule and detail (5) · physical inventory
(6) · labels (3) · stock adjustment and mass update (4) · vendor rebates (3) · storage location (2) ·
other (7). The remaining articles are named in §H with their disposition.

---

## B. Wiring findings

### FINDING 259 — `Enter a Stock Adjustment` is twelve tabs behind one mandatory comment, and every entry posts immediately

- **Invariant:** all inventory correction routes through one screen, gated by a comment, with no undo.
- **Evidence** — `Enter a Stock Adjustment`, tabs verbatim:
  **Quantity · Transfer · As-Is Transfer · Bin to Bin · Move To As-Is · Move From As-Is · As-Is Status
  · Change SN · SO Info · Write Off · Vendor Chargeback · As-Is Adjustment**
  > "**To access any of the tabs in this routine, you must first enter a response at the Adjustment Comment prompt.** **All valid adjustment entries immediately increase or decrease inventory.**"
  > "**Once you enter and save an adjustment, you cannot recall it for corrections. To fix a mistake, you must make another adjustment entry.**"
- **Maps to:** `W-034` (irreversibility) — **CONFIRMED**; `W-050`; `W-061`.

> **A mandatory free-text comment as the entry gate to the whole screen** — you cannot even see the
> tabs until you have said why. That is a deliberate and rather good control: the justification is
> captured before the action, not after.
>
> It is also the **fifth "audit trail as free text"** case in run 04 (dropped orders, over-receipts,
> carrier ETAs, transfer comments, and now every stock adjustment). At this point the pattern is not
> incidental — **STORIS's reason-for-change record is prose, systematically.** Our migration cannot
> reconstruct why inventory moved without parsing comments, and we should say so plainly in the run
> summary.
>
> No undo, by design: corrections are new adjustments. That is correct for an inventory ledger and
> we should copy it — but it means **the adjustment history is the only truth**, which raises the
> stakes on the Kardex ledgers we still have not read.

### FINDING 260 — Adjusting a piece into inventory posts to three named GL accounts

- **Invariant:** an inventory adjustment is a three-legged journal entry with landed cost separated.
- **Evidence** — `Enter a Stock Adjustment`, verbatim:
  > "Adjusting a piece into inventory hits the following GL accounts:
  > **Inventory Value** - debit for the cost of the piece
  > **Inventory Adjustment** - credit for landed cost
  > **Landed Freight Asset** - debit for landed cost (if any)"
- **Maps to:** `W-052` / `W-053` (GL) — **CONFIRMED**; `W-061` (cost); run 02 (thirteen-level landed
  cost hierarchy).

> One of the very few places in four runs where the help centre states an actual journal entry. Three
> accounts, with **landed freight broken out as a separate asset** — which connects directly to run
> 02's thirteen-level landed cost hierarchy: freight is not folded into inventory value, it sits in
> its own asset account.
>
> Note the asymmetry in the wording: `Inventory Value` is debited for **the cost of the piece**,
> `Inventory Adjustment` credited for **landed cost**. Those are different amounts whenever freight
> exists, and the third leg balances it. **The entry only makes sense as a three-legged posting**, and
> anyone reproducing it two-legged will be out by the freight.
>
> Named accounts to date across the audit: Credit Card GLA · `BANK` · AR GLA ·
> `received-not-recorded` · `returned-not-recorded` · **Inventory Value** · **Inventory Adjustment** ·
> **Landed Freight Asset**.

### FINDING 261 — The four cost exception types are confirmed verbatim, and automatic handling is a settings record

- **Invariant:** cost exceptions are a closed four-type enumeration with configurable auto-resolution.
- **Evidence** — `Cost Exception Types`, complete article body:
  > "**1 - Zero Cost on Warehouse Receipts · 2 - Zero Cost on Inventory Adjustments · 3 - Zero Cost on Customer Returns · 4 - Inventory AP Bill Cost Exception**"
  And `Correct a Cost Exception`:
  > "Cost exceptions occur when **the price of an item changes from the price on the purchase order on which it was received** or **an item was received at zero-dollar cost**."
  > "**If active cost exceptions exist in the system, you cannot perform a physical inventory freeze.**"
  > "To set up **automatic handling** of cost exceptions, use the **Costing Control Settings**."
- **Maps to:** `W-041` (cost) — **CONFIRMED**; run 02's central finding — **verified at source**.

> Run 02 derived these four types and the type-4/manual-only distinction. **This is the source article
> and it matches exactly**, which is a useful validation of the audit's method three runs later.
>
> Two things are newly precise here. First, the **cause statement covers both branches in one
> sentence**: a *price change from the PO price* (type 4) or a *zero cost* (types 1–3). Types 1–3 are
> named by where the zero cost arose — receipt, adjustment, customer return — which means **the
> stock adjustment screen in F259 is itself a cost-exception source** (type 2). The two articles in
> this batch are wired to each other.
>
> Second, **`Costing Control Settings` configures automatic handling** — run 02's observation that
> types 1–3 are auto-resolvable and type 4 is manual-only is a *configuration*, not a hard rule. The
> record is named and unread. Queued, high priority.
>
> The freeze block is restated a third time (batch 5 F219 found it twice in the physical inventory
> procedure). Three statements in three articles: **STORIS really means it.**

### FINDING 262 — Costing layers are tracked to the individual piece, with an out date

- **Invariant:** cost layers decompose into pieces, each with a location, status and exit date.
- **Evidence** — `Layer Detail Window`:
  > "This window appears when you double-click on a grid item in the **Update a Product Cost** window and select **More**… This window provides detailed information on **each piece from the selected layer** in the grid. The **Out Date** indicates the date the item was removed from inventory."
  Fields: **piece · status · inventory location · sales location · out date**.
- **Maps to:** `W-061` (cost) — **CONFIRMED and extended**; run 02 (Costing Table).

> **Cost layers exist, and they are piece-resolved.** That is a significant confirmation: STORIS is
> not purely average-cost. Run 03 F144 said sales are written at *average* cost and restated when the
> exact cost arrives; this shows the exact cost lives in a **layer**, and the layer knows its
> individual pieces.
>
> **`sales location` alongside `inventory location`** on a costing record is notable — the layer
> tracks where a piece was *sold from* as well as where it *sat*. That is the data an inter-location
> margin analysis needs, and it is held at piece level.
>
> **`Update a Product Cost`** is the parent screen and is unread. Together with `Average Cost`
> (a related article on `Cost Exception Types`) and the four Kardex ledgers, the costing model is the
> largest coherent unread area left in run 04. Queued.

### FINDING 263 — As-Is price reductions are capped by a percentage with a security override and two verbatim messages

- **Invariant:** how far a damaged item can be marked down is a governed limit with a documented bypass.
- **Evidence** — `Enter a Stock Adjustment`:
  > "If the field **Maximum Percentage Reduction in Inventory Control Settings** does not have a value, you can adjust the selling price of a piece of as-is inventory here **by any amount**. The tabs **As-Is Adjustment, As-Is Status, and Move to As-Is** follow this logic."
  > "If a maximum percentage is supplied and **you do not have a security override**, you cannot reduce the as-is price beyond what is set there… "**You may not reduce the selling price by more than NN% of the original price.**""
  > "If … **you have obtained a security override**… "**Selling Price is below the Maximum Percentage Reduction. Continue?**" If you click "Yes", the adjustment is accepted."
- **Maps to:** `W-061`; `W-050`; run 02 (As-Is repricing).

> A clean three-state control: **unset = unlimited · set without override = hard stop · set with
> override = warn and proceed.** Both messages are given verbatim, and the difference between them is
> the difference between a wall and a speed bump.
>
> Note that the cap is expressed *"of the original price"* — so the reference is the item's original
> selling price, not its cost. **Markdown authority is a retail control, not a margin control**, and
> it says nothing about whether the reduced price still covers cost. Given run 03 F144's
> negative-margin machinery, a fully-authorised As-Is markdown can produce a below-cost sale with no
> margin check anywhere in the path.
>
> The three tabs it applies to are named explicitly, which is a good sign the vendor knew people
> would look for the gap.

### FINDING 264 — Six named permissions gate this one screen, and two live in a different security record

- **Invariant:** the adjustment screen's tabs are individually permissioned across two security surfaces.
- **Evidence** — `Enter a Stock Adjustment`, verbatim field names:

| Permission | Record | Gates |
|---|---|---|
| `Adjust inventory quantities within stock adjustment entry` | **Create a User/Group Actions - Logistics Security** | Quantity tab, Write-Off tab |
| `Transfer merchandise within stock adjustment entry` | Logistics Security | Transfer tab |
| `Transfer merchandise within stock adjustment entry` | **Extended Security settings → Logistics tab** | **As-Is Transfer tab** |
| `Enter a Stock Adjustment - Change Special Order Detail on a Specific Piece` | Create a User/Group Logistics Security | SO Info tab |
| `Adjust Stock Directly to As-Is` | Create a User/Group Actions - Logistics Security | As-Is Adjustment tab |
| `View and Access Product Cost Information` **and** `Enter Vendor Chargeback Adjustments` | **Extended Security settings** | Vendor Chargeback tab |
| `Adjust Inventory for Locations When WMS is Active` | Extended Security Settings | Any adjustment at a WMS location |

- **Maps to:** `W-050` — **CONFIRMED**; batch 6 F228 (Extended Security is cross-module).

> **The same field name — `Transfer merchandise within stock adjustment entry` — is cited from two
> different security records** for two different tabs. Either it exists in both, or the documentation
> is inconsistent. Recorded as stated; **we do not resolve it by guessing.** Section H.
>
> `Logistics Security` now has **seven named fields** across run 04, and this batch adds the
> observation that it is referred to under three spellings: `Create a User/Group Actions - Logistics
> Security`, `Create a User/Group Logistics Security`, and `Extended Security settings → Logistics
> tab`. **Terminology drift inside the security model itself**, which is the worst place for it.
>
> The `Vendor Chargeback` tab needing **two** permissions — one to see cost at all, one to enter
> chargebacks — is a nice example of layered authority: you cannot enter a cost adjustment without
> being allowed to see costs.

### FINDING 265 — Reason codes can be flagged "As-Is Restricted", and that flag gates four tabs

- **Invariant:** certain As-Is reason codes may only be applied or removed by authorised users.
- **Evidence** — `Enter a Stock Adjustment`, repeated verbatim on **Move To As-Is**, **Move From
  As-Is**, **As-Is Status** and **Write-Off**:
  > "**Any action affecting inventory that results in the assignment or removal of a reason code designated as "As-Is Restricted" is prohibited unless the user has the adequate security (via Create a User/Group Logistics Security) or acquires manager override credentials.**"
  And separately:
  > "You **cannot write off a piece that was assigned an "in service" reason code**, as indicated in the Inventory Control Settings. You must change the reason code to a non-service code before you can write off the piece."
- **Maps to:** `W-050`; `W-039`; batch 7 F242 (`PFD`).

> **A permission attached to a data value, not to a screen.** The reason code carries a restriction
> flag, and the flag follows it into every routine that assigns or removes it. That is a fifth
> distinct *kind* of access control in this audit, after user permissions, Regional Processing,
> state-based locks (batch 2 F177), and the location-pair matrix (batch 8 F251).
>
> The "in service" rule is a second value-driven constraint: a piece out at repair cannot be written
> off until its reason code is changed. **Reason codes are a state machine, not labels** — they carry
> behaviour, gate transitions, and can be restricted. Given that run 04 has now found reason-code
> families for manifest removal, physical inventory, `PFD`, transfers, adjustments and As-Is, the
> reason-code model deserves its own design attention in the rebuild.
>
> `manager override credentials` appears as an alternative to holding the permission — an in-the-moment
> credential prompt. That mechanism has appeared throughout the audit as "security override" and is
> still never documented in its own right.

### FINDING 266 — WMS locations are partially outside STORIS, and the system blocks transfers into them

- **Invariant:** a third-party warehouse management system takes over some functions at its locations.
- **Evidence** — `Enter a Stock Adjustment`:
  > "For **WMS locations**, users must be authorized via the **Adjust Inventory for Locations When WMS is Active** field in the **Extended Security Settings**, and **the system restricts inter-warehouse transfers if the receiving location is a WMS location. Not all functions are available for WMS locations. Instead, use your third-party WMS for those procedures.**"
  Also: **`WMS Tag ID`** appears as a field on the As-Is Status and SO Info tabs.
- **Maps to:** batch 4 F206 (external dependencies) — **extended**; `W-050`; **NEW**.

> **A third-party WMS can own a location**, and STORIS then refuses to be the system of record for
> some operations there. The transfer restriction is directional — blocked when the WMS location is
> **receiving** — which makes sense: the WMS must be told about inbound stock through its own channel.
>
> **`WMS Tag ID`** on the piece record is the join key. So a piece can carry two identities: STORIS's
> serial/reference number and the WMS's tag.
>
> This is the **seventh named class of external dependency** in run 04 — after four routing vendors,
> a fraud analysis vendor, 3PL/EDI, and the alternate tax provider. The external-dependency inventory
> flagged in batch 4 §I is now clearly a required deliverable, and **WMS is the one that most changes
> the architecture**, because it removes STORIS from the middle of warehouse operations entirely.
> Which locations, if any, LA Mattress runs under a WMS is a question worth asking early.

### FINDING 267 — Serial and location tracking are independent switches, and between them they choose which of two follow-on screens appears

- **Invariant:** the post-save screen is selected by a two-factor condition on tracking modes.
- **Evidence** — `Enter a Stock Adjustment`:
  > **Quantity tab:** "If this adjustment is for a location for which **Location Tracking** is active **and/or** the product is **serial-tracked**, the **Serial Number/Storage Location Entry** screen appears… **If the product being adjusted is not serial-tracked, this additional screen does not appear. However, the system still assigns an internal reference ID number to each piece.**"
  > **Transfer tab:** `Storage Location Bin to Bin Transfer Screen - Select Pieces` appears if serial
  > tracking is active on the system **and** the product is serial-tracked **and** the location is
  > location-tracked; otherwise `… - No Select` appears.
  > **Bin-to-Bin tab:** "This process is available for **location-tracked warehouses only**." Tracked
  > in Kardex "**if the Track Bin to Bin Transfers field in the Inventory Control Settings is enabled**".
- **Maps to:** batch 3 F190 (`Assign Specific Pieces At`); batch 7 F238; `W-055`.

> **Every piece gets an internal reference ID even when it is not serial-tracked.** That single
> sentence resolves a question the audit has circled since run 02: STORIS always has piece identity
> internally; serial tracking is about whether *humans* supply the identifier. Our data model should
> do the same — **piece-level identity always, user-visible serials optionally.**
>
> Three independent switches now govern piece handling: **system-level serial tracking**,
> **product-level serial tracking**, and **location-level location tracking** — plus
> `Track Bin to Bin Transfers` deciding whether intra-warehouse moves even reach the Kardex.
>
> That last one is a real data-completeness fork: **with it off, the Kardex does not show bin moves**,
> so a product's movement history has gaps that are invisible unless you know the setting.

### FINDING 268 — The As-Is Adjustment tab performs a two-step posting so that reports see stock in, then moved

- **Invariant:** direct-to-As-Is adjustments are recorded as if they were two separate movements.
- **Evidence** — `Enter a Stock Adjustment`, **As-Is Adjustment** tab:
  > "After saving out of this process and the Serial Number / Storage Location Entry window, **the new pieces are first automatically adjusted into saleable stock, then those pieces are moved to As-Is and assigned reason codes. These pieces are then available to reports and inquiries as adjusted in to stock inventory then moved to As-Is.**"
  > "this tab is active **if the product in not a bulk product**."
- **Maps to:** F260 (GL postings); `W-061`; `W-052`.

> **STORIS synthesises an intermediate state that never physically existed**, purely so that the
> reporting and GL trail is consistent. A piece adjusted straight into As-Is is recorded as
> *received into stock* and then *moved to As-Is* — two Kardex events, two sets of postings.
>
> That is exactly right, and it is the kind of thing a rebuild gets wrong by taking the shortcut. If
> you post directly to As-Is you break the reconciliation between inventory receipts and inventory
> value, and every As-Is analysis loses its "where did this come from" leg.
>
> Bulk products are excluded, consistent with batch 5 F223's finding that bulk breaks piece-level
> handling generally.

### FINDING 269 — Price changes on As-Is pieces feed a Label Queue, and only for location-tracked locations

- **Invariant:** repricing generates label work, queued rather than printed.
- **Evidence** — `Enter a Stock Adjustment`:
  > "If the price of a product has been changed via **Move to As-Is, As-Is Status, or As-Is Adjustment**, the inventory piece **can be added to the Label Queue**. The process produces labels **for locations that are location-tracked**. These labels can be **printed manually, or else added to the Label Queue**."
  Header fields include **`Queue Labels`** and **`Label Queue`**.
  > "For cycle count purposes, we recommend you **re-print labels** for any items you move to or from as-is inventory."
- **Maps to:** batch 8 F258 (the same recommendation on transfers); batch 5 F223 (a scan is a label event).

> **The label queue is the mechanism batch 8 F258 was missing.** There, re-labelling after an As-Is
> move was only a recommendation; here there is an actual queue that repricing feeds. It is still
> optional (*"can be added"*), and still only for location-tracked locations.
>
> So the integrity risk stands but is narrower than batch 8 suggested: **STORIS offers a queue, does
> not compel its use, and does not cover non-location-tracked locations at all.** A stale physical
> label remains possible, and at untracked locations it is the only outcome.
>
> `Label Queue` and `Inventory Label Print Screen` are both articles in this subsection, unread.

### FINDING 270 — Vendor chargebacks are entered against a piece with a method, freight flag, and both cost and price restated

- **Invariant:** a chargeback is a piece-level cost and price adjustment carrying its own method.
- **Evidence** — `Enter a Stock Adjustment`, **Vendor Chargeback** tab:
  > "Use this tab when you **receive defective or otherwise unsatisfactory merchandise from a vendor and you want to request a price adjustment (that is, a chargeback)** for the pieces involved."
  Fields: Serial Number · Reason Code · **Vendor Reference** · Current Storage Location · Move To ·
  Current Selling Price · As-Is Comment · **`Vendor Chargeback Method`** · **Original Cost** ·
  **Markdown $** · **Markdown %** · **New Cost** · **New Selling Price** · **`Include Freight`**.
- **Maps to:** run 02 (`Vendor Rebate Chargeback Method` in Purchasing Control Settings); run 03
  batch 16 F163 (`Rebate Mode`); `W-046`; `W-061`.

> **`Vendor Chargeback Method` here is almost certainly the per-transaction expression of run 02's
> `Vendor Rebate Chargeback Method`** — and run 03 batch 16's inference I-16 guessed that `Rebate
> Mode` filled that role. **We now have three similarly-named things** (`Vendor Rebate Chargeback
> Method`, `Rebate Mode`, `Vendor Chargeback Method`) across three runs, and **no article connects
> any two of them.** Recorded as a three-way open question rather than resolved; I-16 is
> **downgraded**, not confirmed.
>
> Substantively: a chargeback restates **both cost and selling price**, with the markdown expressed
> in dollars *and* percent, and **`Include Freight` decides whether landed freight is in scope** —
> which ties directly to F260's `Landed Freight Asset` leg. Chargebacks are therefore a cost-side
> event that feeds the same restatement machinery as cost exceptions, and by run 03 F144, the same
> negative-margin adjustments.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Enter a Stock Adjustment — header (all tabs)** | Location · Product · Vendor Model · Adjustment Date · **Adjustment Comment** *(mandatory gate)* · Queue Labels · Label Queue · Brand · Unit of Measure · Quantity On Hand · Quantity Reserved · Quantity On P/O · Quantity As-Is |
| **Quantity tab** | Adjustment Quantity · Cost Per Unit · Existing Bulk Location · Adjustment Reason |
| **Transfer / As-Is Transfer** | Transfer or Adjustment Quantity · Receiving Location |
| **Bin-to-Bin** | Adjustment Quantity · Select Pieces |
| **Move To As-Is** | Serial/Reference Number · Reason Code · **R/A or P/O Number** · As-Is Selling Price · **Spiff Amount** · Current Storage Location · Move To · As-Is Comment |
| **Move From As-Is** | Serial/Reference Number · Current Storage Location · Move To |
| **As-Is Status** | Serial/Reference Number · Storage Location · **WMS Tag ID** · Move To · Reason · Comment · RA / PO # · Sell Price $ · **Repossession Maximum $** · Spiff Amount |
| **Change SN** | Current Serial Number · New Serial Number |
| **SO Info** | Serial/Reference Number · WMS Tag ID |
| **Write-Off** | Serial/Reference Number · As-Is Reason · Adjustment Reason |
| **Vendor Chargeback** | Serial Number · Reason Code · Vendor Reference · Current Storage Location · Move To · Current Selling Price · As-Is Comment · Vendor Chargeback Method · Original Cost · Markdown $ · Markdown % · New Cost · New Selling Price · Include Freight |
| **As-Is Adjustment** | Adjustment Quantity · Adjustment Reason · Cost Per Unit · As-Is Selling Price · As-Is Reason Code · As-Is Comment |
| **Layer Detail Window** | piece · status · inventory location · sales location · **out date** |
| **Correct a Cost Exception** | Exception Number · List Number · Grid → **Cost Exception Adjustments Screen** |

**Follow-on screens named:** `Serial Number/Storage Location Entry` ·
`Storage Location Bin to Bin Transfer Screen - Select Pieces` · `… - No Select` ·
`Inventory Label Print` · `Update a Product Cost`.

> **`Repossession Maximum $`** on the As-Is Status tab is unexplained and unexpected — a repossession
> ceiling on an inventory piece. It ties to run 03 batch 14 F135 (charged-off revolving plans net of
> repossessions). Recorded as a question.
>
> **`Spiff Amount` on an inventory piece** confirms run 03 F24: as-is spiff is fixed at completion,
> and here is where the amount is set — on the piece, at the moment it becomes As-Is.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Maximum Percentage Reduction** | Inventory Control Settings | Caps As-Is markdown; unset = unlimited; override warns and proceeds (F263) |
| **Serial Number Tracking** | Inventory Control Settings | System-level switch; product-level flag is separate (F267) |
| **Track Bin to Bin Transfers** | Inventory Control Settings | Whether bin moves reach the Kardex at all (F267) |
| *("in service" reason codes)* | Inventory Control Settings | Pieces with one cannot be written off (F265) |
| *(automatic cost exception handling)* | **Costing Control Settings** | How types 1–4 are resolved (F261) |
| *(As-Is Restricted flag)* | reason code record | Gates assignment/removal across four tabs (F265) |

---

## E. Security permissions catalog (additions)

Seven permissions named on one screen (F264), across **`Create a User/Group Actions - Logistics
Security`** and **`Extended Security settings`** — plus `manager override credentials` as an
in-the-moment alternative. `Logistics Security` now has **seven named fields** in run 04.

**A fifth *kind* of access control** joins the list: **permission attached to a data value**
(As-Is Restricted reason codes, F265). The full set the audit has now identified:
user/group permissions · Regional Processing · state-based locks (manifest membership, aisle locks,
order exclusivity) · location-pair matrices (transfer security tables) · **value-attached
restrictions**.

---

## F. State machines and enumerations (additions)

- **Cost exception types (4, closed):** 1 Zero Cost on Warehouse Receipts · 2 Zero Cost on Inventory
  Adjustments · 3 Zero Cost on Customer Returns · 4 Inventory AP Bill Cost Exception.
- **Stock adjustment operations (12 tabs):** listed in F259.
- **Named GL accounts (3 new):** Inventory Value · Inventory Adjustment · Landed Freight Asset.
- **Tracking switches (3 independent):** system serial tracking · product serial tracking · location
  tracking — plus `Track Bin to Bin Transfers`.
- **Piece identity:** an **internal reference ID is always assigned**, serial-tracked or not (F267).
- **Reason code attributes:** As-Is Restricted · "in service" · plus the As-Is reason families.
- **Markdown control states (3):** unset / capped / capped-with-override (F263).

---

## G. Sequencing rules

1. Enter an `Adjustment Comment` → tabs become accessible → save → **inventory changes immediately;
   no recall** (F259).
2. Adjust a piece **in** → three-legged GL posting (F260).
3. As-Is Adjustment tab → pieces posted **into stock, then moved to As-Is**, as two reported events
   (F268).
4. Price changed via Move to As-Is / As-Is Status / As-Is Adjustment → piece may be added to the
   **Label Queue** *(location-tracked locations only)* (F269).
5. Zero cost or a PO price change → **cost exception raised** → auto-handled per Costing Control
   Settings, or corrected manually → **only then can inventory be frozen** (F261).
6. Write-off blocked while an "in service" reason code is attached; change the code first (F265).
7. WMS receiving location → **inter-warehouse transfer refused**; use the third-party WMS (F266).

---

## H. Open questions and gaps

### Gated or unreachable — priority order

1. **`Costing Control Settings`** — governs automatic cost-exception handling; the last piece of run
   02's central chain. **New highest priority.**
2. **The four Kardex ledgers** / `View Detailed Activity for a Product` — carried unread since run 02;
   now the only record of adjustment history (F259). **`As-Is Inventory Detail`** is named as one of
   its pages.
3. `Update a Product Cost` · `Average Cost` · `Zero-Cost Exception Handling` — the costing model.
4. **`Warehouse/Store Location Settings`** · **`Alert Code Settings`** · **`Print Pick List`** ·
   **`Assign Specific Pieces At` values** — carried from batches 3, 4 and 7.
5. Named this batch, unread: `Cost Exception Adjustments Screen` · `Label Queue` ·
   `Inventory Label Print Screen` · `Details of As-Is Processing` ·
   `Designate Inventory for As-Is Processing` · `Create an As-Is Kit` · `Mass Inventory Update` ·
   `Perform Mass Inventory Updates` · `Distribute Add-on Receiving Costs` · `CFO Fields` ·
   `Container Receiving Notes` · `Maintain Daily Receiving Schedule` · `Maintain Receiving Detail` ·
   `Maintain Receiving Schedule By Group` · `Bulk Storage Location Assignment` ·
   the four Return-To-Vendor articles · the three vendor rebate articles ·
   `Physical Inventory Overview` · `Freeze Inventory` · the two physical count tag screens ·
   `Product Sub Filter`.

### Documented but ambiguous

- **`Transfer merchandise within stock adjustment entry` is cited from two different security
  records** for two different tabs (F264). Unresolved; not guessed at.
- **Three similarly-named chargeback/rebate method fields** across three runs, none connected (F270).
  **Inference I-16 is downgraded.**
- **`Repossession Maximum $`** on an inventory piece — unexplained (§C).
- **`CFO Fields`** — an article title that suggests finance-specific product fields; entirely unknown.
- **`manager override credentials`** — referenced throughout the audit as a mechanism, never
  documented.
- **Whether `Costing Control Settings` can auto-handle type 4**, or whether manual-only is hard-coded.
- **What `Existing Bulk Location` does** on the Quantity tab.
- **`A NIL piece cannot be moved to a NIL location`** — stated on Move From As-Is; the rule is clear,
  the concept of a "NIL location" is not.

### Inferences (recorded as inference, not fact)

- **I-44:** `Vendor Chargeback Method` (here), `Vendor Rebate Chargeback Method` (run 02) and
  `Rebate Mode` (run 03) are probably two or three views of one concept. *Three names, no article
  links any pair. **Weaker than I-16 was, not stronger.***
- **I-45:** The internal reference ID assigned to untracked pieces (F267) is probably the same
  identifier the grid calls `Serial/Reference Number`. *Consistent with usage; never stated.*
- **I-46:** `CFO Fields` probably holds product attributes used in financial reporting. *From the
  title alone.*

---

## I. Unknown unknowns

- **A third-party WMS can own a location** (F266) and STORIS steps back from warehouse operations
  there. Everything in batches 5–7 — AWM, RF picking, aisle locks, floats — presumably does not apply
  at such a location. **The whole warehouse-operations picture in run 04 is conditional on WMS not
  being in play**, and we have never asked whether it is.
- **Reason codes carry behaviour** (F265). We have been cataloguing them as enumerations. At least two
  attributes — As-Is Restricted, "in service" — turn a code into a gate. **The reason-code model is
  richer than the audit has been recording**, and earlier batches' reason-code findings should be
  re-read with that in mind.
- **STORIS synthesises transactions that never happened** (F268) to keep the ledger coherent. If it
  does that in one place, it may in others, and a naive event-by-event migration would produce a
  different history than STORIS reports.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Cost exception types 1–4** | Zero cost on receipts / adjustments / customer returns; AP bill cost variance |
| **Costing Control Settings** | Configures automatic cost-exception handling |
| **Cost layer** | Piece-resolved cost cohort, with status, locations and out date |
| **Inventory Value / Inventory Adjustment / Landed Freight Asset** | The three GL accounts hit by adjusting a piece in |
| **Maximum Percentage Reduction** | Cap on As-Is markdown, overridable |
| **As-Is Restricted** | A reason-code flag that gates assignment and removal |
| **"In service" reason code** | Blocks write-off until changed |
| **Label Queue** | Queue of labels generated by As-Is repricing, location-tracked locations only |
| **WMS location** | A location owned by a third-party warehouse management system |
| **WMS Tag ID** | The WMS's identifier for a piece, held alongside STORIS's |
| **Vendor chargeback** | Piece-level cost and price restatement against a vendor |

---

## Contract adjudication — batch 9

| Contract | Verdict | Basis |
|---|---|---|
| **W-041** *(cost)* | **CONFIRMED at source** | The four cost exception types verbatim; freeze block restated; `Costing Control Settings` named (F261) |
| **W-052 / W-053** *(GL)* | **CONFIRMED — an actual journal entry** | Three named accounts with debit/credit and landed freight separated (F260) |
| **W-061** *(cost and margin)* | **CONFIRMED and extended** | Piece-level cost layers (F262); chargebacks restate cost and price (F270) |
| **W-050** *(access control)* | **CONFIRMED — fifth *kind* found** | Seven permissions on one screen (F264); **value-attached restrictions** (F265) |
| **W-034** *(irreversibility)* | **CONFIRMED** | Adjustments post immediately and cannot be recalled (F259) |
| **W-055 / W-056** *(availability, piece identity)* | **CONFIRMED and clarified** | Internal reference IDs always assigned; three tracking switches (F267) |
| **W-046** *(vendor rebates/chargebacks)* | **CONFIRMED, but the naming is now a three-way open question** | F270 |
| **W-064** *(retention)* | **consistent** | Cost layers carry an out date |
| **Third-party WMS** | **NEW — no contract covers it** | F266 |
| **Synthesised intermediate transactions** | **NEW** | F268 |

---

## Next — batch 10

Close `Inventory` (44): the As-Is processing family, Return-To-Vendor, the receiving schedule family,
vendor rebates, mass updates, and the **costing model** (`Update a Product Cost`, `Average Cost`,
`Costing Control Settings`, the Kardex ledgers) — then open **Inventory Views and Reports** (103).
