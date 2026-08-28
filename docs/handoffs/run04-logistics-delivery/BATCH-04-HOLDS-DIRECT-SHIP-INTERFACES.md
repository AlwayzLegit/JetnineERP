# Run 04 — Inventory Management (Logistics / Delivery) — Batch 4: Holds, direct ship, interfaces, people
## — and the credit hold code catalogue, unread for four runs, now read

Status: complete. Findings 201–213. Read-only throughout. No interface run, no hold removed, no
order completed. **This batch completes the `Fulfillments` subsection: 27 of 27 read.**

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Credit Hold Codes List (AR)** | 15202309408276 | **read — the corpus's longest-standing gap, closed** |
| 2 | **Hold Code Settings** | 15242630657044 | read — *and it is not what we assumed* |
| 3 | Remove Items from Delivery Hold Status | 15201528851860 | read |
| 4 | Complete Direct Ship Orders | 15201528690580 | read |
| 5 | Run the Mapping Interface | 15201513284244 | read — **named third-party vendors** |
| 6 | Run Dispatch Track Mapping Interface | 15201513286932 | read |
| 7 | Maintain Un-manifested Fulfillments Sent to Dispatch Track | 15201513099796 | read |
| 8 | Maintain Driver and Delivery Associate | 15201513094292 | read |
| 9 | Delivery Ticket Reprints | 15201528408468 | **not re-read** — dissected in full in the earlier standalone Delivery Ticket Reprints handoff (print/reprint flag state machine, grid legend, handling methods). Cross-referenced rather than duplicated. |

**Fulfillments: 27/27.** Articles 1 and 2 sit outside the section (`Overviews → References` and
`System Administration → Customer Settings`) and were followed per the handoff's "follow the links"
rule.

---

## B. Wiring findings

### FINDING 201 — The AR credit hold catalogue: twenty-two codes in seven families, each with a named trigger and a named setting

- **Invariant:** every credit hold is applied automatically by a named setting, and the code identifies which.
- **Evidence** — `Credit Hold Codes List (AR)`:
  > "STORIS **automatically applies and/or removes** AR credit holds **based on your responses to the system settings** described below."

| Code | Trigger | Governing setting / record |
|---|---|---|
| **C1** | Customer exceeded credit limit | `Credit Limit`, Receivables tab, **Customer Settings**. *"If Extended Receivables (includes revolving and installment) are not active, all orders exceeding the credit limit can be placed on C1 hold. If Installment and Extended Receivables are active, **only orders that have been financed** can be placed on C1 hold."* |
| **C2** | At order entry, open A/R balance older than N days | `Past Due Days`, **Point of Sale Control Settings** |
| **C3** | At order entry, customer inactive longer than N days | `Last Activity`, **Point of Sale Control Settings** |
| **C4** | **Manual** hold on *all* open orders for the customer | `Place Credit Hold`, **Customer Credit and Scoring Information**. Applies to *"all their open sales orders, service orders, and debit exchanges"* |
| **C5** | Pre-authorised deposit — funds committed, not captured | `Use for Pre-Authorizations`, **Credit Card Payment Settings** |
| **C6** | Revolving plan added while an open credit request exists | `Linked Sales Orders Put on Hold for Open Request` (**Credit Application Control Settings**) **AND** `No Credit Check` unchecked (**Revolving Payment Plan Settings**) |
| **C7** | **Payment history hold** — too many past-due occurrences in a window | **Alert Code Settings** |
| **C8** | **Payment verification hold** — deposit total in a window exceeds a threshold; *"to prevent fraud"* | **Alert Code Settings** |
| **D1** | EOD places all orders for customers with an open past-due balance | `Past Due / Open Ord Hold`, **Accounts Receivable Control Settings** |
| **D2** | (1) open balance over `Maximum Balance` **or** (2) minimum deposit requirements not met | **AR Control Settings, Deposits tab**: `Maximum Balance` + `Over Maximum Balance` = `D2 Credit Hold`. *Auto-removed when the balance drops below the maximum.* |
| **E1** | Exchange held at entry | `Exchange on Hold at Entry`, **Point of Sale Control Settings**; approval gated by `Approve E1 credit hold placed on customer exchanges` in **Sales Security** |
| **F1** | Revolving amount financed exceeds the customer's credit limit | `Customer Credit Review` (**Revolving Payment Plan Settings**), `Maximum Credit per Transaction $` (**Revolving Receivables Control Settings**) |
| **F2** | Installment contract credit hold | *(no setting named)* |
| **F3** | Amount being financed, third-party financing not authorised | *(no setting named)* |
| **F4** | Provider requires approval review — **blocks invoicing** | `Approval Review Required`, **Finance Provider Settings**; removable only with `Approve F4 credit holds placed on financed orders` in **Receivables Security**, via the `Reviewed` field in **Update Financing Credit Approvals** |
| **F5** | Driver's licence verification **required** for revolving payment plans | *(no setting named)* |
| **I1** | eSTORIS web order, card not yet authorised | auto-removed on authorisation |
| **I2** | eSTORIS web order, authorised | `Credit Hold Authorized Deliveries`, **Web Control Settings** |
| **I3** | Awaiting the **fraud analysis vendor's** decision | *(vendor selection not named)* |
| **I4** | Fraud analysis vendor flagged the order or card | |
| **S1** | Mandatory signatures not obtained | **Configure Document Signature Capture** settings |
| **T1** | **Alternate tax provider returned an error and no tax amounts** | ATI add-on only |

- **Maps to:** `W-024` (holds) — **CONFIRMED, and the contract can now be closed**; `W-030`
  (financing); `W-052` (GL); run 03 F139 (holds are not exclusive), F153.

> This is the most valuable single article the audit has found in four runs, and it closes the
> question the audit has carried longest. The structure is completely regular: **a letter family, a
> number within it, a trigger, and a setting that turns the trigger on.**
>
> The families, now confirmed rather than inferred *(and inference **I-22** from batch 1 is
> **partially confirmed and partially wrong** — `D` is deposits/balance, not what we guessed, and
> we had missed the `I`, `S` and `T` families entirely)*:
>
> | Family | Domain |
> |---|---|
> | **C** | Customer credit conditions — limit, ageing, inactivity, manual, pre-auth, open request, payment history, fraud threshold |
> | **D** | Deposits and balances — past-due sweep, maximum balance, minimum deposit |
> | **E** | Exchanges |
> | **F** | Financing — revolving limit, installment, third-party authorisation, provider review, licence verification |
> | **I** | Internet / eSTORIS — authorisation and fraud analysis |
> | **S** | Signatures |
> | **T** | Tax interface failure |
>
> **Corrections to the audit's own record, made explicitly:**
> - Run 03 recorded **`F5`** as *"driver-licence failure"*. It is not a failure — it is **"used when
>   driver's license verification is required for revolving payment plans"**. A requirement, not an
>   outcome. Corrected.
> - Run 03 recorded **`C6`** as *"credit decision pending"*. More precisely: a revolving plan was
>   added to an order **while an open credit request already existed**, and it requires **two**
>   settings in two records to be configured together. Sharpened.
> - Run 04 batch 1 F169 recorded **`D2`**'s trigger as undocumented. It is documented, and it has
>   **two independent triggers** — maximum balance, and unmet minimum deposit requirements.
>   Closed.
>
> **Three codes have no named setting: `F2`, `F3`, `F5`.** They appear to be unconditional
> consequences of financing state rather than configurable policies. Recorded as such, not assumed.
>
> **`T1` deserves separate attention.** A tax-service outage puts orders on credit hold. That is a
> hard external dependency wired into the credit system: if the ATI provider is down, the business
> stops shipping. Anyone designing our tax integration needs to decide deliberately what happens on
> provider failure, because STORIS's answer is "hold the order".
>
> **`C8` and `I3`/`I4` reveal a fraud-analysis subsystem** — an unnamed third-party vendor reviewing
> orders, plus deposit-velocity thresholds in Alert Code Settings. Neither appeared anywhere in
> runs 01–03. New area. `Alert Code Settings` is now a priority unread record.

### FINDING 202 — Holds are removed by two named routines, and one code is removable only by a specifically permissioned user

- **Invariant:** hold removal is a distinct, permissioned act with its own screens.
- **Evidence** — `Credit Hold Codes List (AR)`:
  > "To view a list of orders on credit hold, use the **Report Open Orders on Credit Hold** routine. To manually remove a credit hold, use the **Update Receivables Credit Approvals** routine."
  and, for `E1`: *"All E1 credit hold codes are removed via the Update Receivables Credit Approvals process."*
  and, for `F4`:
  > "F4 credit holds can be removed **only by users with a check at the Approve F4 credit holds placed on financed orders field in Create a User/Group Actions - Receivables Security settings**. Qualified users can remove the credit hold via the **Reviewed** field in the **Update Financing Credit Approvals** routine."
- **Maps to:** `W-024`; `W-050` (access control); run 03 F153, F169.

> Two removal routines, not one: **`Update Receivables Credit Approvals`** for the general case and
> **`Update Financing Credit Approvals`** for `F4`. Different screens, different permission surfaces
> (Sales Security for `E1`, Receivables Security for `F4`).
>
> This completes the picture batch 1 F153 opened. The full lifecycle of a hold is now:
> **trigger fires → code applied automatically → a permissioned human approves in one of two
> routines → the code persists until the next End-of-Day sweep removes it** (run 03 F153). Three
> distinct actors — a setting, a person, a batch — and our rebuild needs all three modelled or the
> hold will behave wrongly at one of the seams.
>
> Two codes clear themselves without a human: **`D2`** *("The system removes the credit hold when the
> customer reduces their balance")* and **`I1`** *("Once the system receives the authorization, it
> removes the I1 credit hold")*. So holds are of two kinds — **conditional** (re-evaluated, self
> clearing) and **decisional** (needing approval). The article does not label them that way; the
> distinction is visible in the descriptions and it matters enormously for implementation.
>
> `E1` carries a one-shot rule worth quoting: *"Once a user approves an exchange, the system does not
> place it E1 Hold again."* An approval that sticks — the only one in the catalogue.

### FINDING 203 — There are three separate hold namespaces, and the docs say so twice because people confuse them

- **Invariant:** AR credit holds, AP hold codes and PO holds are unrelated systems that share a word.
- **Evidence** — stated verbatim and near-identically in **both** articles.
  `Credit Hold Codes List (AR)`:
  > "**AR credit hold codes are distinct from both AP hold codes and from purchase orders placed on hold via the On Hold field in Enter a Purchase Order.**"
  `Hold Code Settings`:
  > "**AP hold codes are distinct from both AR credit hold codes and from purchase orders placed on hold via the On Hold field in Enter a Purchase Order.**"
- **Maps to:** `W-024` — **CONFIRMED**; run 02 (PO hold as a nine-source convergence).

> **`Hold Code Settings` is not what four runs of cross-references implied.** It was linked from
> `Logistical Scheduling` alongside credit-hold material, and batch 1 called it the highest-value
> unread article on the assumption that it enumerated credit holds. It does not. It is a
> **vendor-level AP hold code table**:
> > "Use this routine to define **AP hold codes for vendors**. If you assign a hold status to a vendor (via the **Hold Code field on the Payable tab of the Vendor Settings**), the system puts on hold **all newly created AP bills for that vendor**."
>
> **The audit's own expectation was wrong, and it was wrong because the ERP's vocabulary is
> genuinely ambiguous** — enough that STORIS writes the same disambiguating paragraph into two
> different articles. That is the strongest possible signal that this trips people up in practice.
>
> Three namespaces, to be kept apart in the rebuild:
> 1. **AR credit hold codes** — 22 system-applied codes on customer orders (F201).
> 2. **AP hold codes** — a site-defined table; assigning one to a vendor holds all that vendor's new
>    AP bills. Fields: `Code`, `Description`. A vendor-level payment stop.
> 3. **PO `On Hold`** — the nine-source convergence documented in run 02, on purchase orders.
>
> Run 02 found two *inverted* permissions in the PO hold convergence. None of that applies here. If
> we name a single `hold_code` column in the rebuild, we will merge three unrelated concepts.

### FINDING 204 — Delivery hold has its own routine with three actions, and it is a fourth hold namespace

- **Invariant:** delivery hold is inventory-side, not credit-side, and is worked from a dedicated screen.
- **Evidence** — `Remove Items from Delivery Hold Status`:
  > "Use this routine to search for **merchandise with a hold status**."
  Search: Order Type · Fulfillment Location · Route Code · Truck · **`On Manifest Only`** ·
  Fulfillment Dates · Date Type · Start Date · End Date.
  Actions: **`Print Ship Ticket`** · **`Send to Picking`** · **`Remove From Hold`**.
  > "Once the above information has been specified and the Search button has been invoked, **the information will default the next time this process is accessed**."
- **Maps to:** F192 (hold quantity is orthogonal to reservation) — **CONFIRMED**; F168 (`H` flag).

> **A fourth thing called "hold."** This one is on *merchandise*, it is what the grid's `H` column
> reports (batch 1 F168), and it is the pool batch 3 F192 found to be orthogonal to reservation.
> Adding it to F203's list: AR credit hold · AP hold · PO on-hold · **delivery/merchandise hold**.
>
> The three actions are the real content, because they show the hold is not merely cleared — it is
> **resolved in one of three directions**: print the ship ticket, send it to picking, or just
> release it. So `Remove From Hold` is the passive option and the other two are *hold-and-advance*
> in a single click. That is a small workflow design worth copying.
>
> The sticky-search note is a genuine usability detail: this screen remembers your criteria between
> visits. It implies the screen is used repeatedly by the same person against the same slice — a
> daily warehouse chore.

### FINDING 205 — Direct-ship completion is a bulk, tracking-number-bearing routine searched by PO

- **Invariant:** direct shipments complete from the purchasing side, in bulk, per line.
- **Evidence** — `Complete Direct Ship Orders`:
  > "Use this routine to complete **multiple open direct shipment order lines**. … Within the grid, you can then select lines to be completed, **enter tracking information, and edit the shipped quantity**. The grid also contains an action button next to each order number, providing a **read-only view** of the order containing the direct ship line."
  Search by: **`PO Number`** · Order Number · **`Vendor Code`** · Selling Store.
- **Maps to:** `W-005` / `W-006` (direct ship) — **CONFIRMED**; run 03 F8.

> Run 03 F8 established that direct-ship completion **creates an AP bill and closes the PO**. This is
> the screen where that happens, and its search fields tell you whose screen it is: **PO number and
> vendor code**. Direct ship is completed by someone thinking in purchase orders, not deliveries —
> which is why the routine lives in Fulfillments but is keyed by purchasing.
>
> Two capabilities worth noting for the rebuild: **shipped quantity is editable at completion**
> (partial direct shipments are normal), and **tracking information is captured here** — the only
> place in four runs where a carrier tracking number is entered. Where it is surfaced to the
> customer, nothing says.
>
> `Create a User/Group Actions - Sales Security` is a related article, so this is presumably
> permissioned there. Not stated in the article; not assumed.

### FINDING 206 — Route mapping has two integration architectures, and three third-party vendors are named

- **Invariant:** file-exchange routing and API routing are separate processes with separate screens.
- **Evidence** — `Run the Mapping Interface`:
  > "This process controls the data exchange between STORIS and your third-party routing software (route mapping interface), such as **ArcLogistics®, RouteView®, and UPS Roadnet®**. … Upon completion, the data **automatically downloads from STORIS to the mapping software**."
  > "**This screen is not used for API route mapping services such as DispatchTrack; instead, the service directly acquires the information that would be provided here.**"
  And `Run Dispatch Track Mapping Interface`:
  > "This program is **specific to Advanced Dispatch Track**. **If using any other mapping interface, including legacy Dispatch Track, use Run the Mapping Interface.**"
  > "This process is available **only when the functionality is licensed**."
- **Maps to:** F175, F185, F190 (licensed modules) — **CONFIRMED a fourth time**; F197.

> **Four named third-party vendors** — ArcLogistics, RouteView, UPS Roadnet, DispatchTrack — plus a
> fifth unnamed one (the fraud analysis vendor, F201), on top of run 03's fifteen finance providers
> and three address-verification services. **STORIS is an integration hub, and the count of external
> dependencies keeps rising.** A full inventory of them is worth building as a run-level artefact.
>
> The architectural split is clean: **push** (STORIS downloads a file, the router works it, STORIS
> uploads the result) versus **pull** (the API service fetches what it needs). And there are
> *three* Dispatch Track configurations, not two: legacy Dispatch Track uses the file screen,
> Advanced Dispatch Track uses the API screen, and the API screen requires a licence. A site saying
> "we use DispatchTrack" has not told us which process it runs.

### FINDING 207 — The mapping interface is an interruptible three-state conversation with the router

- **Invariant:** routing is a resumable transaction, not a single call.
- **Evidence** — `Run the Mapping Interface`:
  > "After the download completes, a prompt appears with the following options:
  > **Continue Routing** - begin the upload process back into STORIS.
  > **Restart** - restart the download process.
  > **End** - exit the screen. If you select "E", **when you re-enter the Route Mapping Selection screen and enter the warehouse for which you initiated routing, the "Continue Routing, Restart, or End:" prompt appears again**, from which you have the same options as above."
- **Maps to:** F206.

> STORIS **holds the routing session open across screen exits**, per warehouse. Walk away mid-route
> and the prompt is waiting when you come back. That is real state, persisted, and it means a
> warehouse can be stuck in a half-routed condition indefinitely with no visible queue — the only
> way to discover it is to re-enter the screen for that warehouse.
>
> The run-time options on the screen carry side effects that go well beyond routing:
> **`Auto Build or Re-Build Manifest`** · **`Re-Assign Scheduled Times`** · **`Print Tickets`** ·
> **`Suppress Print`**. So one interface run can rebuild manifests and **rewrite customers' promised
> delivery times**. `Re-Assign Scheduled Times` is a checkbox that changes what customers were told.
> That deserves to be surfaced to the business as a control worth governing.

### FINDING 208 — Two near-identically-named settings in two different records govern auto transfers on routes and on manifests

- **Invariant:** unreserved orders can route and manifest on the strength of a linked auto transfer, via two separate switches.
- **Evidence** — `Run the Mapping Interface`:
  > "STORIS recommends checking the **Include Fulfillments with Reserved Auto Transfers** in **Route Mapping Control Settings**. This allows **orders with no reserved merchandise but with qualified linked auto transfers** to be routed through the mapping interface. Note: The **Warehouse/Store Location Setting, Include Fulfillments with Reserved Auto Transfers on Manifest**, allows those auto transfers to be **added to a manifest before the transfer is completed**."
- **Maps to:** F179 (unreserved orders are dropped at manifest completion); F184 (auto transfers); `W-055`.

> **Two settings whose names differ by three words, in two different records, doing two different
> things** — one lets the order *route*, the other lets it *manifest before the transfer arrives*.
> The audit has recorded terminology drift repeatedly; this is the sharpest case yet, because
> getting them backwards produces a plausible-looking but broken configuration.
>
> Substantively this resolves a tension in batch 2. F179 found that orders with no reserved
> merchandise are **dropped at manifest completion**. These settings are how such an order legitimately
> reaches a manifest in the first place: **its goods are on an inbound auto transfer that has not
> landed yet.** So the intended sequence is *route it → manifest it → the transfer completes and
> reserves it → it completes*. If the transfer is late, F179's silent drop fires and the order comes
> back with a comment.
>
> **That is a complete, named failure mode**, assembled from three articles in two batches, and it
> is exactly the kind of wiring this audit exists to find. It is also the most likely source of
> "orders that mysteriously came off the truck" in the business's current operation.

### FINDING 209 — Fulfillments sent to Dispatch Track are stamped, and the stamp is what blocks re-sending

- **Invariant:** the export is idempotent by a date/time indicator that must be cleared to re-send.
- **Evidence** — `Maintain Un-manifested Fulfillments Sent to Dispatch Track`:
  > "Use this routine to identify fulfillments sent to Dispatch Track **that do not qualify to be added to a manifest**. Once sent to Dispatch Track, fulfillments are given a **date/time indicator**. **This indicator can be removed in this routine in order to re-send any changes made to the fulfillment.** … If a fulfillment is on a manifest, it is not included in this grid."
  > "The **Include in Maintain Un-manifested Fulfillments Sent to Dispatch Track** check box in **Additional Fulfillment Information** can also be used to clear the date/time stamp."
- **Maps to:** F206; `W-042` (propagation).

> A sent-stamp as a de-duplication guard, with a manual clear. The consequence is the important
> part: **change a fulfillment after it has been sent and the change does not reach Dispatch Track
> until somebody clears the stamp.** Nothing detects the divergence. The routing system and STORIS
> can silently disagree about a delivery.
>
> Two ways to clear it — this routine, or a checkbox on `Additional Fulfillment Information` — and
> the checkbox's name is the routine's name, which is a confusing but useful clue that the two are
> the same mechanism.
>
> Note the scope: this screen shows only fulfillments that **do not qualify for a manifest**.
> Fulfillments already manifested are excluded. So it is specifically the *stuck* population.

### FINDING 210 — Dispatch Track batching resolves an `Account` through a three-level fall-through, with a special case for fly-by fulfillments

- **Invariant:** the export batch key is resolved, not stored.
- **Evidence** — `Run Dispatch Track Mapping Interface`:
  > "For a multiple order API, Dispatch Track expects to receive **all eligible fulfillments for an Account and a single Date in a single batch**; if a date range is specified, multiple batches are sent, one batch for each date. Batches are built by first selecting all fulfillments for the specified Date, and then examining **those fulfillments' routes for an Account** that matches the specified Account for transmission. **If the route has no Account, the fulfillment location's Account is used** to compare the chosen Account."
  > "For **fly-by fulfillments**, the route is checked first for an Account. **If no Account is associated, the manifest location is used.**"
  Eligibility: *"Only fulfillments with a status of **Scheduled** are eligible"*; the fulfillment must
  have a route **and** a date; and if a Manifest Location is specified it must match the routing
  location, otherwise the fulfillment location must match.
- **Maps to:** F175 (Manifest Location precedence) — **CONFIRMED**; F165, F174 (fall-through hierarchies).

> The **fourth named fall-through hierarchy** in four runs — after the selling-price hierarchy, the
> landed-cost hierarchy, the Credit Card GLA fall-through, and the `Restrict Scheduled Date`
> location→system order. The pattern is now beyond doubt as a STORIS design idiom: **resolve by
> walking a chain of records until one answers.**
>
> Here the chain is *route's Account → location's Account*, with **fly-by fulfillments** substituting
> *manifest location* for *fulfillment location*. **"Fly-by fulfillment" is a new term and it is
> defined nowhere** in anything we have read. It is the second undefined term in this subsection
> after `Staging Area`. Section H.
>
> The eligibility list also confirms F175 from the export side: **Manifest Location, when present,
> is the location that must match** — the same precedence, now enforced in a filter rather than
> displayed in a column.

### FINDING 211 — Drivers and delivery associates are assigned to the manifest, from either end of its life

- **Invariant:** crew assignment is a manifest attribute settable at build or at completion.
- **Evidence** — `Maintain Driver and Delivery Associate`:
  > "Use this routine to assign **drivers and/or delivery associates** to a shipping manifest **from the Build a Delivery Manifest or Complete a Delivery Manifest process**."
  Fields: `Driver` · `Delivery Associate` · Grid Information.
- **Maps to:** F177 (manifest freeze).

> Crew is one of the few things settable at *both* ends of the manifest — planned at build, corrected
> at completion. That is a sensible exception to F177's freeze and it reflects reality: the person
> who actually drove is known only afterwards.
>
> **Two roles, not one** — driver and delivery associate are distinct, and the article's "and/or"
> means a manifest can have either or both. `Technician` appeared as a third role on the manifest
> build screen (batch 2). Three crew roles, no article describing how any of them is set up.

### FINDING 212 — `C1`'s behaviour inverts depending on which receivables modules are active

- **Invariant:** a licensed module narrows the scope of an existing hold.
- **Evidence** — `Credit Hold Codes List (AR)`, on `C1`:
  > "**If Extended Receivables (includes revolving and installment) are not active, all orders exceeding the credit limit can be placed on C1 hold. If Installment and Extended Receivables are active, only orders that have been financed can be placed on C1 hold.**"
- **Maps to:** F190, F206 (licensed modules alter base behaviour) — **CONFIRMED a fifth time**;
  `W-024`; `W-030`.

> **Fifth instance, and the most consequential**, because this one changes a *credit control*, not a
> screen. Activate Extended Receivables and a cash-paying customer over their credit limit stops
> being held. The credit limit quietly becomes a financing-only control.
>
> Nobody would expect that from the setting names, and it is the kind of thing that surfaces during
> a cutover as "why did we suddenly start shipping to people over their limit". It should go in the
> run summary's headline list.
>
> The rule for the rebuild is now firm enough to state once and for all: **in STORIS, licensing a
> module can add features, remove processes (F190), change a resolution order (F175), change which
> records a batch touches (F185), and narrow the scope of a business control (F212).** We cannot
> reason about STORIS behaviour without knowing the licence set, and the audit should say so at
> the top of every run summary.

### FINDING 213 — Alert Code Settings is a fraud and payment-behaviour engine, discovered only through two hold codes

- **Invariant:** thresholds on customer payment behaviour raise credit holds.
- **Evidence** — `Credit Hold Codes List (AR)`:
  `C7` — > "a payment history hold … applied when a customer's payment history **exceeds the number of past due occurrences within a designated time frame** established in **Alert Code Settings**."
  `C8` — > "a payment verification hold … applied **to prevent fraud** when a customer's **payment/deposit total in a given time frame exceeds the total** established in **Alert Code Settings** for that period."
- **Maps to:** **NEW** — no contract covers fraud or behavioural alerting.

> An entire settings record governing **behavioural thresholds over time windows** — past-due
> occurrence counts and deposit-velocity ceilings — surfaced in four runs only as two lines in a
> hold-code table. `Alert Code Settings` appeared in the search results alongside `Hold Code
> Settings` and is now a **priority unread record**.
>
> Combined with `I3`/`I4`'s external fraud analysis vendor, there is a **fraud and risk subsystem**
> in this ERP that runs 01–03 never touched. It is a genuine unknown unknown surfacing late, and it
> is exactly the sort of thing a rebuild silently omits and then rediscovers after the first
> incident.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Hold Code Settings** | Code · Description *(AP hold codes for vendors)* |
| **Remove Items from Delivery Hold Status** | Order Type · Fulfillment Location · Route Code · Truck · On Manifest Only · Fulfillment Dates · Date Type · Start Date · End Date · Grid Information · **Print Ship Ticket** · **Send to Picking** · **Remove From Hold** |
| **Complete Direct Ship Orders** | PO Number · Order Number · Vendor Code · Selling Store · Search · Update · Grid Information *(select lines, tracking information, shipped quantity, per-row read-only order view)* |
| **Run the Mapping Interface** | Location · Type · Scheduled Date · Route · **Auto Build or Re-Build Manifest** · **Re-Assign Scheduled Times** · Print Tickets · Suppress Print · Save → prompt `Continue Routing / Restart / End` |
| **Run Dispatch Track Mapping Interface** | **Account** · Date Code · Start Date · End Date · **Include Unreserved Fulfillments** · Save |
| **Maintain Un-manifested Fulfillments Sent to Dispatch Track** | Location · Type · Date Code · Start Date · End Date · Route · Truck · Grid Information |
| **Maintain Driver and Delivery Associate** | Driver · Delivery Associate · Grid Information |

---

## D. Control settings catalog (additions)

Settings named in the hold catalogue, all previously unseen or unenumerated:

| Setting | Record |
|---|---|
| `Credit Limit` | Customer Settings → Receivables tab |
| `Past Due Days`, `Last Activity`, `Exchange on Hold at Entry` | Point of Sale Control Settings |
| `Place Credit Hold` | Customer Credit and Scoring Information |
| `Use for Pre-Authorizations` | Credit Card Payment Settings |
| `Linked Sales Orders Put on Hold for Open Request` | Credit Application Control Settings |
| `No Credit Check`, `Customer Credit Review` | Revolving Payment Plan Settings |
| `Maximum Credit per Transaction $` | Revolving Receivables Control Settings |
| *(past-due occurrence count; deposit total per period)* | **Alert Code Settings** |
| `Past Due / Open Ord Hold` | Accounts Receivable Control Settings |
| `Maximum Balance`, `Over Maximum Balance` = `D2 Credit Hold` | AR Control Settings → **Deposits tab** |
| `Approval Review Required` | Finance Provider Settings |
| `Credit Hold Authorized Deliveries` | Web Control Settings |
| *(mandatory signatures)* | Configure Document Signature Capture |
| `Hold Code` | **Vendor Settings → Payable tab** *(AP)* |
| `Include Fulfillments with Reserved Auto Transfers` | **Route Mapping Control Settings** |
| `Include Fulfillments with Reserved Auto Transfers on Manifest` | **Warehouse/Store Location Settings** |
| `Include in Maintain Un-manifested Fulfillments Sent to Dispatch Track` | Additional Fulfillment Information |

---

## E. Security permissions catalog (additions)

- `Approve E1 credit hold placed on customer exchanges` — **Create a User/Group Actions - Sales Security**
- `Approve F4 credit holds placed on financed orders` — **Create a User/Group Actions - Receivables Security**

> With `Create a User/Group Actions - Logistics Security` (F170, F189), the **`Create a User/Group
> Actions - <Module> Security`** naming convention is now confirmed across three modules. The
> audit's count of twenty access-control mechanisms is better understood as **one convention
> instantiated per module, plus a set of genuine one-offs** (the Up System's security tab, InTouch's
> five-level model, payment-type-level security, Regional Processing, and manifest-membership state
> locking). That is a materially better summary than "twenty unrelated systems" and corrects the
> emphasis of earlier batches.

---

## F. State machines and enumerations (additions)

- **AR credit hold codes — complete published catalogue (22):** `C1` `C2` `C3` `C4` `C5` `C6` `C7`
  `C8` · `D1` `D2` · `E1` · `F1` `F2` `F3` `F4` `F5` · `I1` `I2` `I3` `I4` · `S1` · `T1`.
- **Hold namespaces (4):** AR credit hold · AP hold *(vendor-level, site-defined)* · PO `On Hold` ·
  delivery/merchandise hold.
- **Hold clearing modes (2):** *conditional* — re-evaluated and self-clearing (`D2`, `I1`);
  *decisional* — needing approval in `Update Receivables Credit Approvals` or
  `Update Financing Credit Approvals`, then removed at EOD.
- **Delivery hold dispositions (3):** Print Ship Ticket · Send to Picking · Remove From Hold.
- **Mapping architectures (2):** file download/upload · API pull. **Dispatch Track configurations (3):**
  legacy (file screen) · Advanced (API screen) · unlicensed (neither).
- **Mapping session states (3):** Continue Routing · Restart · End *(persisted per warehouse)*.
- **Crew roles (3):** Driver · Delivery Associate · Technician.

---

## G. Sequencing rules

1. Setting condition met → **hold code applied automatically** → *(conditional codes)* condition
   clears → hold removed automatically; *(decisional codes)* permissioned approval in a credit
   approvals routine → **hold code removed at the next EOD** (run 03 F153).
2. Vendor assigned a `Hold Code` → **all newly created AP bills for that vendor are held** (F203).
3. Order with no reserved merchandise **but** a qualified linked auto transfer → routes *(setting 1)*
   → manifests before the transfer completes *(setting 2)* → if the transfer lands, completes; **if
   not, dropped from the manifest and left open with a comment** (F208 + F179).
4. Fulfillment sent to Dispatch Track → **date/time stamp applied** → changes do not re-export until
   the stamp is cleared, in this routine or via the checkbox (F209).
5. Mapping interface: download → *Continue Routing* uploads back, *Restart* re-downloads, *End*
   suspends the session **per warehouse** until re-entered (F207).
6. Direct ship: search by PO/vendor → select lines → enter tracking, edit shipped quantity →
   complete → *(run 03 F8)* AP bill created, PO closed.

---

## H. Open questions and gaps

### Gated or unreachable — priority order revised

1. **`Alert Code Settings`** — governs `C7` and `C8`; an entire behavioural-risk engine (F213).
   **New highest-priority unread record.**
2. **`Assign Specific Pieces At` value list** — still unpublished; determines the reservation→piece
   model (batch 3 F190).
3. `Update Receivables Credit Approvals` · `Update Financing Credit Approvals` — the two hold-removal
   screens, named but unread.
4. `Route Capacity Control Settings` · `Route Mapping Control Settings` ·
   `Warehouse/Store Location Settings` · `Additional Fulfillment Information` · `Customer Credit and
   Scoring Information` · `Configure Document Signature Capture` · `Alert Code Settings` —
   all named, none read.
5. `Point of Sale Control Settings` — six Logistics-page fields plus `Past Due Days`,
   `Last Activity`, `Exchange on Hold at Entry`; the record itself is still unenumerated.

### Documented but ambiguous

- **`F2`, `F3`, `F5`** — hold codes with **no named governing setting**. Unconditional, or
  undocumented?
- **The fraud analysis vendor** (`I3`, `I4`) is never named, and how it is selected is not stated.
- **"Fly-by fulfillment"** (F210) — used, never defined. As with `Staging Area` (batch 2).
- **Whether `T1` releases automatically** when the tax provider recovers. Not stated, and it matters.
- **Whether delivery hold and credit hold can coexist** on one order — run 03 F139 established credit
  holds are not exclusive of each other; nothing addresses cross-namespace coexistence.
- **`Include Unreserved Fulfillments`** on the Dispatch Track export — presumably the API-side
  equivalent of the two auto-transfer settings (F208), but a third name for a similar idea.
- **How Driver, Delivery Associate and Technician records are created.** Three roles, no maintenance
  article found.

### Inferences (recorded as inference, not fact)

- **I-29:** `T1` probably clears automatically once tax amounts are received, by analogy with `I1`.
  *Not stated; `T1` is described only as applied.*
- **I-30:** `Include Unreserved Fulfillments` on the Dispatch Track screen is probably the API-side
  counterpart of `Include Fulfillments with Reserved Auto Transfers`. *The articles do not connect
  them, and the names differ in a way that suggests they may not be equivalent.*
- **I-31:** The `Create a User/Group Actions - <Module> Security` convention probably exists for
  every module, not only Sales, Receivables and Logistics. *Three instances observed; no article
  lists the set.*

### Corrections to the audit's own prior record

- **`F5`** — run 03 recorded "driver-licence failure"; correct reading is "driver's license
  verification **is required** for revolving payment plans". **Corrected.**
- **`C6`** — run 03's "credit decision pending" sharpened to the two-setting condition in F201.
- **`D2`** — batch 1 F169 called the trigger undocumented; it has two documented triggers. **Closed.**
- **`Hold Code Settings`** — batch 1 named it the highest-value unread article on the assumption it
  enumerated credit holds. **It does not; it is an AP vendor hold table.** The assumption was wrong
  and is recorded as wrong (F203).
- **Inference I-22** (hold-code letter families) — **partially confirmed, partially wrong.** `E` and
  `F` were right; `D` is deposits/balances, not as guessed; the `I`, `S` and `T` families were
  missed entirely.

---

## I. Unknown unknowns

- **A fraud and behavioural-risk subsystem** (F213, F201 `C7`/`C8`/`I3`/`I4`) that four runs never
  touched, found through two rows of a code table. **What else is reachable only through a code
  table's descriptions?** The audit should treat enumeration articles as high-yield, not as reference
  material.
- **External dependencies keep multiplying.** Four routing vendors, an unnamed fraud vendor, an
  alternate tax provider whose failure holds orders, fifteen finance providers, three
  address-verification services, a 3PL EDI standard. **A consolidated external-dependency inventory
  is now a required run-level artefact**, and each entry is a cutover risk in its own right.
- **Licensing changes business controls, not just features** (F212). This is the strongest form of
  the pattern and it means the audit's findings are conditional on a licence set we have never seen.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **AR credit hold code** | One of 22 system-applied holds on a customer order |
| **AP hold code** | Site-defined vendor-level code; holds all new AP bills for that vendor |
| **Delivery hold** | Merchandise-level hold worked from Remove Items from Delivery Hold Status |
| **Update Receivables Credit Approvals** | The general hold-removal routine |
| **Update Financing Credit Approvals** | The `F4`-specific hold-removal routine, via a `Reviewed` field |
| **Alert Code Settings** | Behavioural thresholds — past-due occurrences, deposit velocity — raising `C7`/`C8` |
| **Extended Receivables** | Revolving + installment; activating it narrows `C1` to financed orders |
| **Auto transfer** | System-created inbound transfer; two settings let its order route and manifest early |
| **Fly-by fulfillment** | Used in Dispatch Track batching; **undefined** |
| **Account** (Dispatch Track) | Export batching key, resolved route → location |
| **Delivery Associate** | Crew role distinct from Driver |

---

## Contract adjudication — batch 4

| Contract | Verdict | Basis |
|---|---|---|
| **W-024** *(holds)* | **CONFIRMED — the contract can now be closed** | Complete 22-code catalogue with triggers and settings (F201); removal routines and permissions (F202); four distinct namespaces (F203, F204) |
| **W-005 / W-006** *(direct ship)* | **CONFIRMED** | Bulk completion keyed by PO and vendor, with tracking and partial quantity (F205) |
| **W-030** *(financing)* | **CONFIRMED, extended** | `F1`–`F5` triggers; `F4` blocks invoicing (F201) |
| **W-050** *(access control)* | **CONFIRMED — convention identified** | `Create a User/Group Actions - <Module> Security` across Sales, Receivables, Logistics (§E) |
| **W-042** *(cross-document propagation)* | **CONFIRMED as advisory/stamped** | Dispatch Track changes do not propagate until the stamp is cleared (F209) |
| **W-055 / W-056** *(reservation)* | **CONFIRMED** | Unreserved orders route and manifest only via two named settings (F208) |
| **W-052 / W-053** *(GL)* | **consistent** | `F4` prevents invoicing; AP hold codes stop bills (F201, F203) |
| **Fraud / behavioural risk** | **NEW — no contract covers it** | F213 |
| **Third-party routing integration** | **NEW** | F206, F207, F210 |
| **Licensing altering business controls** | **NEW — fifth confirmation** | F212 |

---

## Next — batch 5: Barcode / AWM

`Fulfillments` is complete (27/27). Batch 5 opens the **Barcode** subsection (84 articles), starting
with `Barcode Overview`, `AWM Function Settings`, `AWM Exception Type Settings`, and the nine
`AWM Schedule - *` task types (Delivery Pick, Delivery Prep, Delivery Special Picking, Delivery Load
/ Transfer Load, Customer Pickups, Cycle Count, Receive Product, Transfer Prep, Transfer Receiving).
