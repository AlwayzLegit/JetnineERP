# RUN 05 — STORIS `Customer Service` — Run Summary

**Scope:** the `Customer Service` category — 56 articles across two subsections. **Method:** the
wiring audit defined in `BROWSER-AGENT-HANDOFF.md` and `KICKOFF-PROMPT.md`. **Output:** 2 batch
files, **findings 291–315 (25 findings)**, this summary.

**Read-only throughout.** No service order entered, no COG created, no line closed or reinstated, no
survey conducted, no route completed, no report run.

**25 of 56 articles read in full — 45%, the highest proportion of any run.** This is the smallest
section in the queue, so the plan was to read deeply rather than sample, and the coverage statement
in batch 2 §A classifies all 56 with a stated reason.

---

## A. Coverage log

| Subsection | Articles | Read in full | Batch |
|---|---|---|---|
| **Customer Service** | 31 | 15 | 1–2 |
| **Customer Service Views and Reports** | 25 | 10 | 2 |
| **Total** | **56** | **25** | |

| File | Findings |
|---|---|
| `00-COVERAGE-QUEUE.md` | scope, counts, batch plan, carried-forward questions |
| `BATCH-01-SERVICE-ORDER-CORE.md` | 291–303 |
| `BATCH-02-LIFECYCLE-REPORTS-SWEEP.md` | 304–315 |

Linked articles outside the category were followed per the handoff rule, into Service Control
Settings, Point of Sale Control Settings, General System Control Settings, Extended Security and the
Service Security record.

---

## B. Eight headline findings

### 1. `STORIS Messenger` — the internal messaging system, named at last *(F291)*

Run 04 found one clause about mailing a buyer on an over-receipt and flagged an undocumented internal
messaging system as a run-level open question. It is **STORIS Messenger**, it is separately
activatable, and **tickling does not work without it**. Turn it off and a feature in a different
module silently stops.

It still has no article of its own. **It is the highest-priority unread subsystem in the audit.**

### 2. The tickle notification matrix — the clearest "who gets told what" spec in the corpus *(F292)*

Six condition classes × three roles, each cell specifying automatic, manual or both: assignment ·
call reminders · scheduled status · service line status · service merchandise movement · deletions ·
**parts commitment (via Warehouse Receipts and an EOD batch)**.

Two details worth copying verbatim: **the user making a change is excluded from the resulting
notification**, and **technicians are notified only on manual assignment**. And one piece of
cross-module wiring the audit exists to find: **a part arriving on a receiving dock notifies three
people on a service order.**

Separately, the customer-facing half is a **nightly sweep** — Last Contact vs today vs
`Call Customer Days` — that **rebuilds the tickle list each night** rather than accumulating it.

### 3. Service method is three values, not two, and it gates whole pages *(F293)*

Run 04 inferred two methods from the scheduling grid's `H`/`S`/`B` flag. There are three:
**In-Home · In-Shop · Stock Merchandise**. Non-Merchandise service is In-Home only; COG documents are
In-Shop only; Stock Merchandise gets neither.

**Non-Merchandise service is a service order with no product on it** — the article's own example is
repairing damage to a customer's house caused during delivery. A real business case, wired to the
delivery module, that nothing in run 04 suggested.

### 4. Customer's own goods are a numbered movement document *(F294)*

Run 04 F182 found COG on the truck and outside inventory. The model: **`Move From` → `Move to`**,
where the destination is a **Customer, a Location, or a Vendor**; the destination **freezes at
creation**; it has its own number, its own route, truck and stop time, and its own
`Release For Completion`.

Two clean ownership rules: **in-shop scheduling and COG movement scheduling are linked** so the shop
cannot be booked for something that has not arrived, and **a COG cannot be shipped to a customer if
the item sits on an open sales order** — the sales order owns that shipment.

### 5. Service orders carry four payment responsibilities — this is where protection plans get consumed *(F297, F307, F308)*

**Customer · Factory Warranty · Extended Warranty · Other Vendor**, each tracked across the same
three cost categories (parts, labour, charges). `Report Profitability by Payment Responsibility` is
what makes the protection-plan business case answerable, and it closes a loop that has been open
since run 02: **plans are sold in Sales Processing and consumed here.**

The gap: `Report Service Chargebacks to Manufacturer` **identifies** the vendor's share on closed
orders, and **no article describes how it is collected.** The money is found and there is no
documented path to an AP credit.

### 6. Service line status is event-sourced — the only such history in five runs *(F306)*

> "Each time a service line is updated, that activity is included with this report so that each change in status displays."

Everywhere else in this ERP the current status is what is stored and history is reconstructed from
comments if at all. Service retains every transition, and `Report Service Status Durations` measures
dwell time in each state, with four independently-ordered sort levels.

**Two consequences:** we should do this everywhere in the rebuild — it is cheap and it makes every
"how long does X take" question answerable. And in the migration, **the business's real service cycle
times are actually recoverable**, which is not true of most of what run 04 found.

### 7. A quality feedback loop from service to merchandising *(F311, F313, F314)*

`View a Product's Open Service Orders` · `Report Product Sales-to-Service Ratio` ·
`Report Items with High Average Service Days` · `Report Reinstated Service Orders` ·
`Report Service Problem Activity` — five instruments for finding products that keep failing, hanging
off a `Problem Code` enumeration that appears **six times and is published nowhere**.

Nothing in runs 02–04 hinted at this. **If the loop is live at LA Mattress, it is a buying input that
no requirements document will list**, and a cutover that drops it fails quietly for a year.

### 8. Three customer-contact channels, one of which records nothing *(F300, F301, F312)*

**STORIS Messenger tickles** (internal, logged as a list) · **flexEngage digital notifications**
(external, logged as two possible comments with a receipt id) · **the envelope icon** (opens the
local mail client; *"no comments are written to STORIS"*).

Plus **delivery surveys** as a fourth, filterable by truck and route — so there is a path from a bad
survey to the two people who were in the van (run 04 F211).

**The easiest channel is the invisible one.** If the service team uses the envelope icon habitually, a
large share of customer contact history simply does not exist. Worth asking them directly rather than
discovering it at migration.

---

## C. Screen and field inventory

`Enter a Service Order` is catalogued page by page in batch 1 §C — nine pages, roughly 90 fields.
Ten further screens in batch 2 §C. **First sighting of file attachments in five runs**: a paper-clip
indicator showing attachments on an order page, a customer, or a product, with no article describing
the mechanism.

## D. Control settings catalog

**`Service Control Settings`** — five named fields (`Tickle Processing Active`, `Call Customer Days`,
`Verify Labor for In-Home Service Orders`, `Verify In-Shop Service Orders`,
`Allow Service Order to be Reinstated`) and a named `General Information` tab; **record unread**.
Plus `Require Audit Text on Service Orders`, `Shipping Ticket`, `Multiple Order Copies` (Point of
Sale Control Settings) · `Digital Receipts Interface` (General System Control Settings) ·
`Digital Receipts Enabled` (Warehouse Location Settings) · `Delete/Edit information on open
transactions` (Extended Security) · `Closed Without Completion` (Status Code Settings).

## E. Security permissions catalog

**`Create a User/Group Actions - Service Security`** — new; field `Reinstate completed service
orders`. **The per-module convention is now four modules wide: Sales · Receivables · Logistics ·
Service**, which settles a question the audit framed wrongly in earlier runs as "twenty unrelated
permission systems".

Also: `Delete/Edit information on open transactions` (a **state-plus-permission** lock — deposits or
financing freeze line items), the Logistics capacity override confirmed on a **third** document type,
and **Regional Processing upheld as inverted for the seventh time**.

## F. State machines and enumerations

- **Service Method (3):** In-Home · In-Shop · Stock Merchandise, with page-level gating.
- **Payment responsibility (4)** × **cost categories (3)**.
- **Service crew roles (3):** Coordinator · Service Technician · Labor Technician.
- **COG `Move to` destinations (3):** Customer · Location · Vendor.
- **Open-service-order view dimensions (6)** plus Service Status.
- **Gift registry ledger (3):** Contributed · Used · Remaining.
- **Named but unpublished:** `Problem Code` *(6 sightings)* · `Service Status` / `Line Status Code` ·
  **`Closed Without Completion`** *(4 sightings across two runs, never defined)* · `Next COG Status` ·
  COG `Type` · `Contact Status` · `Responsibility Type` · `Reimbursement Method` · `Employee Type` ·
  `Include Line Types` · `Type of Event` · `How Enrolled`.

## G. Sequencing rules

1. Service order entered → **audit text required** if the setting is on.
2. Parts must be **received into inventory** before linking; the receipt notifies three roles via
   Warehouse Receipts and an EOD batch.
3. COG created *(In-Shop only)* → `Move To` freezes → scheduled against **shared route capacity** →
   released for completion.
4. **Day Ending** rebuilds the tickle list from Last Contact vs `Call Customer Days`.
5. Every service line update writes a **status-duration record**.
6. Lines closed → order closed → **only then** reinstatable, onto a **new** order, carrying the
   problem code and text and nothing else, with audit comments on **both** documents.
7. Order closed → manufacturer chargeback report assembles the vendor's share.
8. Delivery completed → survey queue until `Previously Surveyed`.
9. Registry created here → funded via `Add Funds` in the **sales** payment routine.

## H. Open questions and gaps

**Unread and carried forward, in priority order:** `STORIS Messenger` · `Service Control Settings` ·
**`Status Code Settings`** *(referenced in five articles across runs 03–05; one value ever named,
never defined)* · `Create a User/Group Actions - Service Security` · `Survey Questions Screen`
*(named by the screen that administers it, **no article**)* · `Warranty Settings` *(never read in five
runs, despite protection plans running through runs 02, 03 and 05)* ·
`Export Warranty Information to Excel` · plus the four records carried from run 04
(`Costing Control Settings`, `Warehouse/Store Location Settings`, `Point of Sale Control Settings`,
`Alert Code Settings`).

**Documented but ambiguous:** "eligible" open lines · **"dollars-only adjustments"** *(the only
correction mechanism on parts, labour and charges — used three times, defined nowhere)* · whether
service chargebacks ever become AP credits · **four rebate/chargeback method names across three
modules with nothing connecting them** *(inference I-16 downgraded twice)* · **jeopardy**, the same
concept in merchandising and service, calculated in neither · file attachments · `Warehouse Location
Settings` vs `Warehouse/Store Location Settings`.

**Inferences I-50 to I-55**, recorded per batch and flagged as inference.

## I. Unknown unknowns

- **A warranty settings record has never been read in five runs**, despite protection plans being
  sold, consumed and reported on across three of them. It surfaced only as a related-article link.
- **The survey questions do not exist in the documentation** — a whole customer-feedback instrument
  with no article, referenced by the screen that administers it.
- **Service orders are financial documents.** `Available Credit` sits on the header, credit hold `C4`
  covers them (run 04 F201), deposits and financing lock their line items. The audit had been
  treating service as operational.
- **File attachments** on orders, customers and products — five runs, one sentence about an icon, and
  a document store nobody has mentioned.

## J. Glossary

STORIS Messenger · tickling · Call Customer Days · Service Method · COG document · Coordinator ·
payment responsibility · dollars-only adjustment · flexEngage · Dynamic Escape Settings ·
reinstatement · Service Security · status duration · Reimbursement Method · jeopardy ·
Previously Surveyed · gift registry · Add Funds.

---

## Contract adjudication — run 05

| Contract | Verdict |
|---|---|
| **W-005 / W-006** *(purchasing, special order, direct ship)* | **CONFIRMED** — service POs are ordinary POs (F309); `Special Order` and `Direct Ship` on parts, labour and charges lines |
| **W-012** *(dates and batch processes)* | **CONFIRMED and extended** — Day Ending rebuilds the tickle list; parts commitment fires from an EOD batch; **service line status is event-sourced** (F306); jeopardy applies to service dates |
| **W-028** *(gift certificates)* | **CONFIRMED — run 03's gift-registry gap closed** (F315) |
| **W-034** *(closure, irreversibility)* | **CONFIRMED** — closed service orders are never reopened; reinstatement copies forward onto a new document (F305) |
| **W-039** *(exceptions)* | **CONFIRMED** — problem code plus text is the durable payload (F311); service route completion shares the manifest exception model (F302) |
| **W-046** *(vendor rebates / chargebacks)* | **CONFIRMED, and now a four-way naming problem** (F308) |
| **W-050** *(access control)* | **inverted — upheld a seventh time.** The per-module convention is four modules wide (F304); state-plus-permission lock on deposited orders (F303) |
| **W-052 / W-053** *(GL)* | **CONFIRMED indirectly** via four-payer profitability (F297, F307); **NOT DOCUMENTED** for service chargeback collection (F308) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED** — parts must be received before linking; `Quantity Available` on the part line (F295) |
| **W-061** *(cost and margin)* | **CONFIRMED and extended** — cost split three ways across four payers, reportable by payer, employee and line type (F297, F307) |
| **W-064** *(retention)* | **CONFIRMED** — `Manifest Exception Retention` = 0 disables retention entirely (F302) |
| **NEW — no contract covers these** | internal messaging (STORIS Messenger) · customer's own goods · customer feedback and surveys · the service-to-merchandising quality loop · file attachments |

---

## If we rebuilt Customer Service from only what we read, what would we get wrong?

We would build a work-order system and miss that it is three other things at once.

It is a **financial document**. `Available Credit` sits on the header; deposits and financing lock its
line items behind a permission; credit hold `C4` sweeps a customer's service orders alongside their
sales orders. We had been reading service as an operational module and it participates in
receivables throughout.

It is a **warranty settlement instrument**. Four payers — customer, factory warranty, extended
warranty, other vendor — each apportioned across parts, labour and charges. This is where the
protection plans sold in run 03 are actually consumed, and `Report Profitability by Payment
Responsibility` is how the business learns whether selling them was a good idea. Build service
without the payer axis and the protection-plan P&L becomes unanswerable.

And it is a **merchandising signal**. Five separate instruments exist to find products that keep
failing, hanging off a problem-code vocabulary that the documentation never publishes. That loop is
invisible from every other section, nobody will list it as a requirement, and it is exactly the kind
of thing that stops working at cutover and is not noticed for a year.

We would also get the lifecycle backwards in two specific ways. **Closed service orders are never
reopened** — a repeat visit is a *new* document carrying the old problem code and text and none of the
old work — which is what makes "did we have to go back?" answerable. And **service line status is
event-sourced**: every transition retained, with a report measuring dwell time in each state. That is
the only such history in five runs, and our instinct would be to store the current status and lose it.

The gaps we would inherit rather than create are worth naming too. There is an **envelope icon that
opens the local mail client and writes nothing back**, sitting beside two channels that do log — so
some unknown share of customer contact history does not exist. **Service chargebacks to
manufacturers are identified by a report with no documented path to collecting them.** And
**"dollars-only adjustment" is the only correction available on parts, labour and charges, and is
defined nowhere** — the single most-used mechanism in the section is the one we cannot specify.

The pattern from run 04 holds here too, though more mildly: the documentation specifies screens well
and *matter* poorly. But service is the best-instrumented process in this ERP, and the one place
where STORIS kept the history rather than the snapshot. **That is worth copying, and worth copying
everywhere else too.**

---

*Run 05 complete. Next: run 06 — Getting Started.*
