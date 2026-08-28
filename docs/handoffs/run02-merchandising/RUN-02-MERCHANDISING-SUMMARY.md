# Run 02 — Merchandising — Run Summary

**129 articles · 11 batches · 145 wiring findings.**
Section: STORIS ERP → Merchandising (55 top-level + 60 Views and Reports = 115), plus 21 linked
articles followed out of the section per the handoff rule, less duplicates.

Two batch-level findings were **corrections to my own earlier readings**. Both are called out below.

---

## A. Coverage log — run level

| Batch | Subject | Articles | Findings |
|---|---|---|---|
| 1 | Purchase order core | 16 | 1–28 |
| 2 | Costing, landed cost, cost exceptions | 16 | 29–44 |
| 3 | Replenishment and demand-driven PO creation | 13 | 45–58 |
| 4 | EDI, containers, distribution, direct ship | 13 | 59–70 |
| 5 | Merchandising decisions, buying analysis | 13 | 71–82 |
| 6 | PO types, kits, special orders, Regional Processing | 10 | 83–94 |
| 7 | Purchasing reports, open orders, fill | 12 | 95–104 |
| 8 | ATP, product performance, KPI formulas | 8 | 105–116 |
| 9 | Transfers, as-is, kits, DTS inquiries | 12 | 117–126 |
| 10 | Physical inventory variance, barcode receiving, views | 12 | 127–136 |
| 11 | Open To Buy, PO recall, coverage sweep | 9 | 137–145 |

Full article inventory with URLs: `00-COVERAGE-QUEUE.md` and `01-URL-INDEX.md`.
Deliberate exclusions, with reasons, at Finding 145.

---

## B. The ten findings that matter most

### 1. Open To Buy includes landed cost. GMROI and Turns exclude it. *(F137, F110)*
> "**The report includes landed costs in all calculations.**" — Report Open To Buy Information
> "**Cost figures in the GMROI formula exclude freight, add-on 1 and add-on 2 costs.**" *(stated three
> times, for GMROI, Turns and Gross Margin)* — Report Product Performance

A buyer's **spend authority** is measured on landed dollars; that buyer's **return on the spend** is
measured on unlanded dollars. Nothing in the system reconciles them or warns anyone. For a retailer
importing bulky goods this systematically flatters the return on high-freight products — which are
exactly the imported ones the rest of the section treats as a special class. **This is the sharpest
commercial finding in the run.**

### 2. There is no purchase price variance account. There is a queue. *(F29, F30, F31)*
> "Cost exceptions occur when **the price of an item changes from the price on the purchase order on
> which it was received** or an item was received at zero-dollar cost." — Correct a Cost Exception
> "**To correct type 4 cost exceptions, you must use the manual method.**" — Costing Control Settings
> "**If active cost exceptions exist in the system, you cannot perform a physical inventory freeze.**"

Run 1 closed unable to say what happens when an AP bill cost differs from the receipt cost. The answer:
STORIS raises a numbered **type-4 cost exception** carrying receipt cost, old bill cost, new bill cost
and an exception value, and puts it in a work queue. **It cannot be auto-resolved** — every price
variance in the business is a manual touch — and **unworked exceptions block the annual physical
inventory freeze.** The variance is real, quantified and reportable, but it sits outside the ledger
until someone clears it.

### 3. A purchase order passes through five independent one-way gates, set by five different modules. *(F70)*
No article states this; it is assembled from a dozen scattered sentences.

| Gate | Blocks | Set by |
|---|---|---|
| printed / faxed / emailed | editing, comment updates, PO↔SO linkage, consolidation | Purchasing |
| EDI submitted | editing, resubmission after conversion, consolidation | EDI |
| received | delete, receiving-location change, direct-ship conversion | Receiving |
| pick-listed / manifested | un-receiving, **permanently** | Logistics |
| completed | un-receiving, tracking-ID edits | Fulfilment |
| pending AP bill | direct-ship conversion | Accounting |

Model PO status as one enum and this is lost. STORIS has **a set of latches**, several thrown from
outside purchasing.

### 4. Hold is a nine-source convergence, and the reason is never recorded. *(F12, F52, F131)*
Seven automatic sources in batch 1, an eighth in batch 3, and `approval hold` surfacing unexplained in
batch 10. **Two of them are inverted permissions** — `Create a purchase order not on hold from POS
entry` and `Create replenishment purchase order not on hold`, where the *absence* of the grant causes
the hold. Nothing prints, is acknowledged or is received while hold is set, yet **held purchase orders
still count as supply in replenishment** while being **excluded by default from cash forecasting**
(F48, F104). The same population, opposite defaults, in two modules.

### 5. Access derives from log-on context, not from the user. *(F85, F86, F88)*
> "If **no list name was found in the `Create a User` record, then the `Warehouse` record for the
> current log-on location is checked for a list.**" — Regional Processing Rules

The same person sees different data depending on where they signed in. Four merchandising and
accounting processes — **the buyer's worksheet, open-to-buy, automatic replenishment and the
inventory-to-GL reconciliation** — ignore location restrictions entirely, and **eleven bypasses are
documented**, including "if you know the customer's code you can override it" and a session-widening
rule where opening a document adds its locations to your access for the session.

Run 1 judged `W-050` *inverted* rather than merely wrong. This run supplies the mechanism and upholds
that judgment across three independent batches. **An audit of "who can see what" done by reading user
records will be wrong.**

### 6. There are eight definitions of availability, and two of them share a name. *(F108 — a correction)*
Batch 1 recorded the Purchase Order FAQ's `NET AVAIL = QOH - RES - FLR - AI`. Batch 8 found the
reference article publishing **`NET AVAIL = QOH - COM - FLR - RSV`** — different terms, with `COM`
(committed to documents) and `RSV` (reserved for potential sales) as separate quantities the FAQ
collapses into one, and `QOH` already saleable-only so as-is is excluded at source rather than
subtracted. **Two published formulas for the same named quantity.** The reference article defines every
component; the FAQ defines none, so the reference is the better evidence — but this must be settled
against the live system.

The other six: the FAQ's unlabelled forward projection; `Units Available` in replenishment; `Net Demand`
in back-order replenishment; two thirteen-week projections on the buyer's worksheet; and ATP's
time-phased running balance. **There is no single definition of availability in STORIS**, and picking
one will change purchasing behaviour whichever we pick.

### 7. Landed cost resolves through thirteen levels, per component, independently. *(F34, F35)*
Five components — Freight and four generically-named add-on slots — each resolving through the same
thirteen-file hierarchy, first found wins. **65 possible configuration origins per received line**, and
nothing on the record says which won. The four add-on slots are **labelled by a control setting**, so
`Duty` and `Misc` in the help center are this installation's choices, not the data model. And the only
actualisation path found is an **advisory report whose stated purpose is retuning the estimates**
(F40) — if that reading holds, **landed cost on received inventory is never trued up.** Recorded as an
inference from silence, in section H, not as fact.

### 8. Purchase order type is a seven-flag behaviour bundle, and STORIS ships exactly one. *(F83)*
> "STORIS provides one purchase order type (**`STND`=Standard**), but you can create additional types."

Every other PO type at LA Mattress is local configuration, each carrying `As-Is Reason`,
`Allow Sales Order Linkage to Purchase Order`, `Include in Supply Calculation`, `Third Party Purchase
Order Changes`, `Transfer on Receipt` and `Container`. **A PO type is a small policy object**, and
replenishment supply, sales linkage and receiving behaviour all depend on it. **Extract the live type
table before anything else.**

### 9. End-of-Day is the section's real transaction boundary. *(F101)*
Nine merchandising behaviours attach to it, several the sole source of a fact: PO status becomes
`CLOSED`, the closed date is stamped, replenishment POs are generated, **merchandise is reserved and a
dated fill list is written** (retained seven days), the warehouse receipts register is produced, cost
exception reports run, and PO↔SO links are built when enabled. **Replenishment's `Units Available`
depends on what reservation has committed, and nothing documents which of the two runs first.**

### 10. `W-042` is not what batch 1 read it as. *(F50 — a correction)*
Batch 1 quoted `Enter a Purchase Order` — "the system updates sales orders attached to purchase order
line items each time you change or delete the purchase order line item" — and I recorded `W-042` as
confirmed in mechanism. `Purchase Order Updates from Sales Order Entry` gives the real rule:

- **Stock products: no propagation at all.** A message tells a human to update the PO by hand.
- **Special-order and non-inventory, untransmitted: propagates.**
- **After transmission: nothing propagates**, and a quantity *increase* demands a whole new purchase
  order.

The link between a sales order and its purchase order is **a quantity link, not a synchronisation.**
Anything built assuming automatic ripple will silently diverge from how the operators actually work.

---

## C. Contract adjudication — run level

| Contract | Verdict | Where |
|---|---|---|
| **W-005** | **CONFIRMED** — special-order sale creates a PO, gated by seven settings across six files plus three permissions and an override chain | b1 F22, b3 F51, b11 F140 |
| **W-006** | **CONFIRMED** — direct-ship POs are sales-order-owned; conversion requires breaking the link and does not recalculate cost | b1 F5, b4 F63 |
| **W-012** | **CONFIRMED** — logical transaction date, fiscal-period-dependent valuation, back-dating restates open periods, OTB runs on periods | b2 F42, b8 F116, b9 F119, b11 F137 |
| **W-041** | **CONFIRMED, with a corrected shape** — the variance exists and is quantified, but as a **work queue**, not a GL account | b2 F29–F31 |
| **W-042** | **CONTRADICTED for stock products; CONFIRMED conditionally for untransmitted special orders** | **b3 F50 (correction)** |
| **W-044** | **CONFIRMED, four independent statements** — "open" means unpaid; `CLOSED` only at End-of-Day; five one-way gates; `approval hold` unexplained | b1 F4/F20, b4 F70, b7 F97, b10 F131 |
| **W-050** | **CONFIRMED INVERTED** — run 1's judgment upheld with mechanism, exceptions and eleven documented bypasses | b6 F85/F86/F88, b11 F138/F144 |
| **W-052** | **NOT DOCUMENTED IN THIS SECTION** — one transfer report offers a GL recap; no purchasing transaction does | b9 F117 |
| **W-053** | **NOT DOCUMENTED IN THIS SECTION** — same | b9 F117 |
| **W-055** | **CONFIRMED in mechanism, no single authority** — eight availability definitions; reservation is an EOD process producing a fill list | b7 F95, b8 F106/F108 |
| **W-056** | **CONFIRMED in mechanism, no single authority** — as above; kit availability is a min() over components | b8 F106, b9 F120 |
| **W-061** | **CONFIRMED and much enlarged** — six product cost values, three costing methods chosen separately per purpose, **seven cost bases across the section's reporting** | b2 F36, b5 F74, b8 F110, b9 F125, b10 F128, b11 F137 |

**NEW (beyond the contract list):** 145 findings, of which the majority describe wiring no contract
anticipated — the cost exception queue, the thirteen-level landed hierarchy, ATP and its external
vendor web service, the nine hold sources, PO types as policy objects, the five irreversibility gates,
`BMW_ACF`, and the four Kardex ledgers.

---

## D. Control settings — the count

**Roughly 130 distinct settings** across at least **21 settings files**, catalogued per batch in
section D. The files that govern merchandising behaviour, by how many batches referenced them:

| File | Batches |
|---|---|
| Purchasing Control Settings | 1, 3, 5, 8, 11 |
| Costing Control Settings | 2, 9 |
| Advanced Vendor Settings / Advanced Regional Vendor Settings | 1, 2, 3, 4 |
| Advanced Product Settings / District and Regional Product Settings | 1, 2, 3, 5, 8 |
| Inventory Control Settings | 1, 3, 7, 8 |
| Point of Sale Control Settings | 3, 8, 11 |
| Special Order Control Settings | 1, 3, 8 |
| Purchase Order Type Settings | 3, 4, 6 |
| General System Control Settings | 6 |
| Warehouse/Store Location Settings · Warehouse/Store Receiving Settings | 3, 6, 8 |
| Product Kit Settings | 3, 6 |
| Vendor EDI Settings · EDI Control Settings | 4 |
| Web Control Settings · Service Control Settings | 1, 3 |
| Ashley Interface Settings | 8 |
| Region Settings · District Settings | 3, 6 |
| Open To Buy Department Settings | 11 |
| **`BMW_ACF`** — *a file with no screen* | 8 |

**Three kinds of configuration are not operator-visible:** settings marked "accessible by STORIS
personnel only", the `Model Number Pattern Entry Screen` (STORIS only), and `BMW_ACF`.

---

## E. Security — the count

Merchandising adds **three new mechanisms** to run 1's twelve, taking the total to **fifteen**:
`Location Restrictions` (a data filter, not an action gate), Regional Processing's three transactional
restrictions, and **read-only routine twins** (F144) — capability granted by which routine a user is
given rather than by field permissioning.

New permissions found: nine Purchasing Security fields, one Sales Security field (inverted), one
Extended Security field, one Logistics Security field, plus the cost-visibility flag documented in
**two conflicting security files**.

---

## F. State machines — the enumerations that were and were not found

**Found and complete:** cost exception types (1–4) · automatic exception handling options (4) ·
deduct types (5) · EDI transaction sets (7 inbound, 2 outbound) · costing methods (3) · replenishment
modes (3) · model number pattern grammar (5 symbols) · location restriction levels (4) · per-piece
statuses (5) · transaction codes (00/01/03, with 02 unobserved) · ATP data points (4) · barcode
receiving methods (2) · aging buckets (4, fixed) · OTB department models (2).

**Referenced but never enumerated:** `PO Type` *(customer-defined by design)* · `Transaction Type` ·
`Purchase Order Status` · `Inventory Type` *(on eight reports, four batches)* · Trip `Status Code` ·
`Solution Source` · `Output Type` · purchase status *(partial: Dropped, Discontinued, obsolete/type 4,
plus a separate drop status field)* · `Style` · `Programmed` · `Reason Code` scope · **`CWC`**, which
appears in four batches as an order class, a delivery status and a status code on transaction-code-00
sales, and **is never expanded anywhere in the help center.**

---

## G. Sequencing — the seven rules that would break the business if missed

1. **Clear all active cost exceptions before attempting a physical inventory freeze.** Type-4
   exceptions cannot be auto-resolved.
2. **Hold blocks print, acknowledgement and receipt** — but not inclusion in replenishment supply.
3. **`CLOSED` status, the closed date, reservation, the fill list and replenishment POs exist only
   after End-of-Day.**
4. **Pick-listed, manifested or completed items can never be un-received**, so such a PO can never be
   deleted.
5. **After transmission, PO↔sales order changes are manual**, and a quantity increase requires a new PO.
6. **A fully received PO with accounting inactive first prompts to *delete*** — answer No, then close.
7. **Landed cost is computed at receipt, not at PO entry**, and container freight is not distributed
   until the batch is closed.

---

## H. Open questions and gaps — run level

### Gated or unreachable
- **The four `Kardex` screens** (Direct Ship, As-Is, Regular, Summary) — the only per-product movement
  ledger in the system, reachable from a Merchandising DTS inquiry but documented under Inventory.
  **The largest remaining gap.**
- **`BMW_ACF`** — a configuration file with no screen, deciding what counts as a floor sample and which
  ten locations the buyer's report covers. **Must be extracted directly from the system.**
- **The vendor subsidiary record** — supplies freight factor, PO lead weeks, minimum and excess stock
  weeks and collection cut dates. Referenced repeatedly; never described.
- **Whether LA Mattress is on the Cloud/SaaS product.** If so, region/district restriction is
  unavailable and a large part of batch 6 does not apply. **A question for the operator.**
- STORIS-personnel-only settings and the `Model Number Pattern Entry Screen`.
- `Inventory Control Settings`, `Point of Sale Control Settings`, `Product Kit Settings`,
  `Purchase Status Settings` — each referenced from three or more batches, none read.

### The three substantive contradictions
These are not synonyms. They must be settled against the live system before anything is built.

| Conflict | Version A | Version B |
|---|---|---|
| **`NET AVAIL`** | `QOH - RES - FLR - AI` *(Purchase Order FAQs)* | **`QOH - COM - FLR - RSV`** *(Report Product Performance — defines every term)* |
| **`Additional Units Required`** | `Lead Days / Days Per Week × Sales Rate` *(calculation article)* | `Lead days/7 × Sales Rate + (.05)` *(replenishment report; the `+0.05` exists only to force a round-up)* |
| **`Automatically Hold POs`** | creates POs and holds them *(Automatic PO Replenishment)* | creates **no PO**; prints `Purchase Order Number: On Hold` *(Report Automatic PO Replenishments)* |

Plus a fourth, narrower: **`Net PO`** subtracts layaway in replenishment and *adds it back* on the
buyer's report (F111).

### Terminology drift — fourteen cases
Catalogued at batch 6 Finding 93 and extended since: Cost tab / Dollar tab · Landed Cost Distribution /
Allocation *(resolved, F118)* · Program List Creation / Store List Entry / Receiving At / Receiving
Location *(resolved, F80)* · Allocated Stock / Allocated Order · two `Include Store Stock` names ·
cost-visibility permission in two security files · `Minimum Stock Quantity` vs `Minimum Order Quantity`
*(resolved as two real fields, F52)* · Report Product Comparison / Report Comparative Kits *(the same
report, F134)* · View Monthly Sales Performance / View Sales History · Costing Table Inquiry / View
Product Cost Activity · null-vs-zero KPI conventions on two screens · `type 4` meaning obsolete in
Merchandising and AP-bill-variance in costing.

**Seven verbatim copy-paste and typographical errors** were found in reference articles (F133), two of
them substantive. **The help center is a good guide to what exists and an unreliable guide to how it
behaves.** Field names, enumerations and screen inventories from this run are trustworthy; **formulas
and precedence rules are not.**

### Inferences — recorded, not asserted
The largest is at F40: **landed add-on costs appear never to be trued up to actual.** The only
actualisation path found is an advisory report whose stated purpose is retuning estimates; nothing says
the variance posts or corrects the layer. This is an inference from silence and should be tested first
in any costing work. Others: `CWC` as customer-will-call; `BMW` as Buyer's Management Worksheet;
consolidation closing its source POs; `approval hold` being the payment-approval state; the `+0.05`
constant existing to force a round-up.

---

## I. Unknown unknowns — the eight worth carrying into every later run

1. **Configuration with no screen** — `BMW_ACF`, STORIS-only settings, the vendor subsidiary record.
   Expect more of these; expect them to change what numbers mean.
2. **Behaviour gated by settings in unrelated modules** — ATP blocked by reservation policy, PO close
   prompted by an Inventory setting, eSTORIS auto-PO gated on a numbering setting, repossession
   depreciation configured in a costing file.
3. **Work queues in place of accounts** — cost exceptions, invoice exceptions, suspended postings.
   STORIS's answer to a mismatch is almost always a queue someone must clear.
4. **State encoded as display strings** — `$$$^NN`, `"..."`, `None`, `Direct Ship`, `Hold`, `**`, `*`.
   A field containing one of these is a UI marker, not data.
5. **Consequential writes attached to navigation** — running a report creates a worklist; exiting a
   screen creates purchase orders; `Exit` abandons a queue with no record.
6. **The same numeral or word meaning different things in different modules** — `type 4`, "open",
   "committed", "reserved", `Net PO`, `NET AVAIL`.
7. **Whole product classes outside the normal machinery** — special orders have no average cost, no
   landed distribution, no replenishment, no distributed POs; kits are derived and unmanaged;
   as-is and floor samples are on hand but never available.
8. **The fastest-promise order classes are the least supported** — `ASAP` and `CWC` are excluded from
   automatic allocation, from jeopardy reporting and from the weekly projection.

---

## J. Glossary — run level

Consolidated per batch in each file's section J. The terms most worth carrying forward:

| Term | Plain description |
|---|---|
| Cost exception (type 4) | The purchase price variance, as a manual queue item; blocks physical inventory |
| Costing Table | FIFO layer file holding cost and quantity; **purged on a retention timer** |
| Landed cost | Material plus freight and four add-on slots; resolved through 13 levels, per component |
| Estimated Landed Cost | The PO figure; explicitly not final |
| STND | The only PO type STORIS ships; all others are local policy objects |
| Hold | PO admission gate with nine sources; the reason is not recorded |
| Fill list | Dated record of what End-of-Day reserved; retained seven days |
| ATP / ATC | Promise date and customer-facing availability date; ATP records date, source, document, quantity |
| NET AVAIL | `QOH - COM - FLR - RSV` *(best evidence)*; a second formula is published |
| Net Demand | `(True Demand + Min/Safety Stock) - QOH - Qty Incoming` |
| BMW_ACF | Screenless control file defining floor samples and reported locations |
| Kardex | Per-product movement ledger, four views; **unread** |
| Open To Buy | Buying budget by department over fiscal periods; **the only landed-cost KPI** |
| CWC | Order class, delivery status and status code; never expanded in the documentation |
| COM | Customer's own material; a cost component, an outbound PO type, and a PO tab |
| DTS | Dynamic Tab Settings — documented inquiry screens are shipped defaults, not specifications |
| Regional Processing | Two geographies (district for sales, region for inventory); licensed; not on Cloud |

---

## If we rebuilt Merchandising from only what we read, what would we get wrong?

**We would build one availability number, and it would be the wrong one.** STORIS has eight, they
disagree, two of them share a name, and the FAQ publishes a formula the reference article contradicts.
Whatever we built, some part of the business — replenishment, promising, the buyer's worksheet,
scheduling — would quietly stop matching what STORIS told them for years.

**We would model purchase order status as a status.** It is five independent latches thrown by five
different modules, plus a hold with nine sources whose reason is never recorded. We would let someone
delete a PO whose stock was already on a manifest, and we would let a transmitted order be consolidated
away.

**We would post purchase price variances to an account.** STORIS does not. It raises a numbered
exception a human must clear, and until they do, the annual physical inventory cannot start. We would
build a ledger entry where the business has a work queue and a habit — and the operators' actual daily
job, working that queue, would have no home in the new system.

**We would treat a purchase order type as a label.** It is a policy object with seven behaviour flags
deciding whether the order counts as supply, can link to a sales order, transfers on receipt, or can be
changed by a third party. STORIS ships one type; every other one at LA Mattress is local configuration
we have not seen.

**We would compute landed cost once, and we would compute the KPIs consistently.** Landed cost resolves
through thirteen files per component, first found wins, with no record of which won — and the estimate
appears never to be trued up to actual. Meanwhile the buying budget counts landed dollars and the
performance KPIs exclude them. Making that consistent is almost certainly right, but doing it silently
would move every buyer's numbers on the day of cutover, in both directions, with no explanation.

**We would assume sales orders and purchase orders stay in sync.** For stock products they never do —
the system posts a message telling a person to go and fix it. That manual reconciliation is a real,
staffed part of how this business runs, and it is invisible in any data model.

**We would grant permissions to users.** STORIS derives them from log-on context, falls back to the
warehouse record when the user record is silent, widens access when you open a document, and exempts
the buyer's worksheet, open-to-buy, replenishment and the inventory-to-GL reconciliation entirely. Any
migration audit of "who can see what" done by reading user records would be wrong before it started.

**And we would lose the things with no screen.** `BMW_ACF` decides what counts as a floor sample. The
vendor subsidiary record supplies freight factors and lead weeks. Model number patterns are editable
only by STORIS. None of these appear in any user interface, and all of them change what the numbers
mean. If they are not extracted deliberately, they will be discovered by the first buyer whose report
comes out wrong.

---

## Recommended before run 3

Three things to settle with the operator, not the documentation:

1. **Are we on the Cloud/SaaS product?** It determines whether region/district restriction exists at
   all, and therefore whether a third of batch 6 applies.
2. **Extract `BMW_ACF`, the purchase order type table, and the vendor subsidiary record.** All three
   change the meaning of numbers this audit has recorded, and none is visible in the documented UI.
3. **Settle the three contradictions** — `NET AVAIL`, `Additional Units Required`, and
   `Automatically Hold POs` — against the live system. Each changes behaviour the business relies on
   daily.
