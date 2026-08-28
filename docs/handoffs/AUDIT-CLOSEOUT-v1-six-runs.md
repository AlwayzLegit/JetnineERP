# STORIS Parity Audit — Closeout

**Six runs. 1,177 articles inventoried. 336 findings. Read-only throughout.**

The audit set out to answer one question, taken verbatim from `BROWSER-AGENT-HANDOFF.md`:

> "What has to happen, automatically, when a business event occurs — and what would break if it didn't?"

This document is the cross-run roll-up. Each run has its own summary and batch files; nothing here
replaces them. What follows is what only becomes visible across all six.

---

## Coverage

| Run | Section | Articles | Batches | Findings |
|---|---|---|---|---|
| 01 | Accounting | 307 | 30 | 1–328 *(run-local numbering)* |
| 02 | Merchandising | 129 | 11 | 145 *(run-local)* |
| 03 | Sales Processing | 405 | 16 | 1–164 |
| 04 | Inventory Management *(Logistics/Delivery)* | 280 | 11 | 165–290 |
| 05 | Customer Service | 56 | 2 | 291–315 |
| 06 | Getting Started | 56 | 2 | 316–336 |
| | **Total** | **1,233 article-slots / 1,177 distinct** | **72** | |

Runs 03–06 share a single continuous finding sequence (1–336). Runs 01 and 02 were numbered
run-locally before that convention was adopted; their findings are referenced by run and number.

**Every article in every section was inventoried.** Where an article was not read in full, the batch
file states which family it belongs to and why it was excluded. **No article was skipped silently.**

**Read-only discipline held for all six runs.** No form submitted, no setting saved, no process run,
no report executed, no scan performed, no inventory frozen or cleared, no manifest built or
completed, no override attempted. Runs 04 and 05 documented step-by-step operating procedures for
destructive processes; all were read as documentation only. No page presented as a live application.

---

## The ten things that matter most

### 1. Margin is provisional until somebody works a queue

Sales orders are written at **average** cost. When the exact cost arrives — a PO received, a **cost
exception** resolved — the order is restated and an adjustment is written to Written Business and
`BTA` *(run 03 F144, verbatim)*. Cost exceptions come in four types, of which **type 4 is manual-only**
*(run 02; confirmed at source in run 04 F261)*, and **active cost exceptions block the physical
inventory freeze** *(run 04 F219, stated three times in two articles)*.

**One unworked queue stops the inventory close and silently moves last quarter's margin.** This is
the single most consequential chain in the audit and it spans three runs and four modules.

### 2. Order-to-piece binding is deliberately loose

A picker marking damage triggers a **silent, warehouse-wide replacement search** — the customer's
order gets a different physical unit, with no exception, comment or approval. A physical count
**reassigns sales order reservations**. Damage found in prep pushes the line **back into picking**.
*(run 04 F218, F220, F239, F242.)*

**Our instinct to bind order lines to serial numbers early would break picking, damage handling and
counting simultaneously.** The replacement engine itself is documented nowhere — only its three call
sites and its failure location, a magic bin called `RESEARCH`.

### 3. As-Is is the disposition hub of the inventory model

Seven documented paths in — damaged pick, damaged in prep (`PFD`), failed delivery, floor-sample
transfer, physical count, vendor chargeback, direct adjustment. Three out — sale at the As-Is price,
return to vendor, write-off. **Return-to-vendor requires As-Is first.** *(run 04 F280, assembled
across six batches and stated in no single article.)*

Every path is a **cost** event, so every path reaches §1's margin restatement. The chain from *a
picker dropping a headboard* to *a negative-margin adjustment on last month's sale* is fully
documented and nowhere described.

### 4. Twenty-two credit hold codes, seven families, and the release is a batch

`Credit Hold Codes List (AR)` — referenced across runs 01 and 03, read in run 04 F201 — gives all 22
with their triggers and governing settings: **C** customer credit · **D** deposits and balances ·
**E** exchanges · **F** financing · **I** internet/eSTORIS · **S** signatures · **T** tax-interface
failure.

**Approval does not release a hold. End of Day does** *(run 04 F153)*. Two codes clear themselves;
the rest need a permissioned approval and then wait for the nightly sweep. And **`T1` means a tax
provider outage stops shipping.**

There are **four unrelated hold namespaces** — AR credit, AP vendor, PO on-hold, delivery/merchandise
— and STORIS writes the same disambiguating paragraph into two articles because people confuse them.

### 5. Access control is one convention plus five *kinds*

`Create a User/Group Actions - <Module> Security` is a **naming convention** instantiated per module —
Sales, Receivables, Logistics, Service *(run 05 F304)* — not the twenty unrelated systems earlier runs
described. Around it sit five genuinely distinct kinds:

1. user/group permissions
2. **Regional Processing** — location scoping, judged *inverted* in run 01 and **upheld eight times**,
   including on warehouse-floor RF routines
3. **state-based locks** — manifest membership *(run 04 F177: "you cannot access the order using
   other processes")*, aisle locks, order-level picking exclusivity
4. **location-pair matrices** — transfer security tables *(run 04 F251)*: they govern movements, not
   users
5. **value-attached restrictions** — "As-Is Restricted" reason codes *(run 04 F265)*

And the mechanism behind every "a security override is required" across five runs is **one screen**
with a three-case field matrix that records the authorising user *(run 06 F316)*.

### 6. Licensing changes business behaviour, not just features

Seven confirmed instances. A licensed module **removes a process** *(run 04 F190)*, **changes a
resolution order** *(F175)*, **changes which records a batch touches** *(F185)*, **narrows the scope
of a credit control** — activate Extended Receivables and a cash customer over their limit stops being
held *(F212)* — **splits routing into three incompatible configurations** *(F206, F214)*, and **adds a
silent precondition to picking** *(run 06 F331)*.

**Every finding in this audit is conditional on a licence and settings set we have never seen.**

### 7. Printing is a transactional interface

`Print Pick List` **reserves inventory** and can **create manifests** *(run 06 F329, F335)*. Printing a
delivery ticket is one of exactly two routines that **submit items to picking** *(run 04 F237)*.

And the two facts together produce a defect nobody could see from one article: **reprinting a pick
list for a manifested order requires removing it from the manifest and putting it back, which fires
the reason-code prompt and logs a manifest-removal exception** *(run 06 F330 + run 04 F178)*. The
warehouse's routine reprint pollutes the report management uses to measure manifest churn.

### 8. Detect and report, don't enforce

STORIS's consistent answer to "what if the automatic thing gets it wrong" is **a report a person
works**: putaway velocity drift · landed-cost estimate variance · unacknowledged carrier
acknowledgements · WMS errors · RF picking errors · manifest exceptions · physical-inventory As-Is and
commitment exceptions · route over-capacity *(run 04 F290, eight instances)*. Cross-document warnings
end in **"Continue?"** *(run 04 F184)*. The rule for propagation, readable across four runs:
**derived documents propagate; associated documents notify** *(run 04 F249)*.

A modern system would enforce, retry, or auto-correct most of these. **Each one we automate away is a
job somebody currently does**, and that belongs in the cutover plan, not the backlog.

### 9. Composition reaches the core, so our inventory is a lower bound

**Dynamic Tab Settings** composes screens from tab components with IDs *(run 03 F155/F156)* — and at
least one documented screen has **no menu path at all**. **Dynamic Escapes** compose navigation, and
users can add their own *(run 04 F199; run 05 F298)*. **The Kardex itself — the inventory ledger — is a
DTS inquiry**, which is why run 02 saw "four ledgers" *(run 04 F281)*.

With `BMW_ACF` *(run 02, a configuration file with no screen)*, this is a configuration layer beneath
the settings screens that the help centre does not describe. **"What screens does STORIS have" is not
answerable from the menu**, and any user interview about screens has to ask which DTS definition
they are looking at.

### 10. The audit trail is prose

Nine sightings across four runs: dropped manifest orders, over-receipts, carrier ETAs, transfer
comments, stock adjustments, service order audit text, reinstatement, digital-receipt outcomes, and
orders withheld from picking. **STORIS's record of "why did this happen" is a comment somebody was
compelled to type.**

It is better than it first appeared — the Kardex line carries quantity, **running balance**, user,
date, time, memo *and* comments *(run 04 F283)* — but the reason is still text. **Any migration that
needs history will have to parse prose**, and that should be budgeted, not discovered.

---

## What we would get wrong, in one paragraph

We would build a system that is correct about data and wrong about timing and matter. We would
release credit holds at approval, book margin at the sale, and post returns when entered — three
obviously-correct choices, three breaks with parity. We would bind orders to serial numbers early and
break picking, damage handling and counting at once. We would treat As-Is as a discount flag and have
nowhere to put damaged goods, vendor returns or write-offs. We would move printing to a rendering
service and lose three business events. We would unify twenty permission surfaces into one coherent
model that maps to nothing the business currently grants. And we would automate away eight reports
that are eight people's jobs. **The documentation is a good specification of screens and a poor
specification of matter; the structures that matter most — As-Is as a hub, the replacement engine, the
cost-exception chain — are described in no single article and exist only as the shape left behind when
you read all of them.**

---

## Contract adjudication — final

| Contract | Final verdict |
|---|---|
| **W-005 / W-006** *(receiving, special order, direct ship)* | **CONFIRMED** across runs 02–05 |
| **W-012** *(dates and periods)* | **CONFIRMED** — the batch calendar is business logic: EOD releases holds, EOM purges and closes doors, Day End rebuilds the tickle list |
| **W-024** *(holds)* | **CONFIRMED and closable** — full 22-code catalogue, four namespaces, batch release |
| **W-028** *(gift certificates)* | **CONFIRMED** — four transaction kinds; registry model closed in run 05 |
| **W-030** *(financing)* | **CONFIRMED** — fifteen providers; authorisations survive order deletion |
| **W-034** *(deletion, irreversibility)* | **CONFIRMED** — and four irreversible steps in run 04 alone, three unpermissioned |
| **W-039** *(exceptions)* | **CONFIRMED and broadened** — and **two things called "exception" behave in opposite ways** |
| **W-041** *(cost exceptions)* | **CONFIRMED at source** |
| **W-042** *(propagation)* | **CONFIRMED, with the rule stated: derived documents propagate; associated documents notify** |
| **W-046** *(vendor rebates / chargebacks)* | **CONFIRMED, but a four-way naming problem** across three modules that no article connects |
| **W-050** *(access control)* | **inverted — upheld eight times.** One convention, five kinds |
| **W-052 / W-053** *(GL)* | **CONFIRMED** — named accounts and, in run 04 F260, an actual three-legged journal entry |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED and repeatedly extended** — nine availability definitions; hold ⊥ reserved; reservation timing and piece-assignment timing are two separate settings |
| **W-061** *(cost and margin)* | **CONFIRMED and extended** — piece-level cost layers, an estimate/actual reconciliation loop, multi-currency |
| **W-064** *(retention)* | **CONFIRMED — nine chains.** The rule *(file → setting → purge, the setting living in the owning module)* held without exception |
| **NEW — beyond the contract list** | third-party logistics and EDI *(8+ document types)* · licensed modules altering base behaviour · warehouse labour scheduling · warehouse concurrency control · directed putaway · crossdocking · containers/floats · customer's own goods · third-party WMS · location-pair security · value-attached restrictions · multi-currency · shared route capacity · estimate/actual reconciliation loops · synthesised intermediate transactions · screen and navigation composition · internal messaging · fraud and behavioural risk · customer feedback · the service-to-merchandising quality loop · file attachments · concurrent licensing · session hardware binding · **printing as a transactional interface** |

---

## What the audit could not answer

Stated plainly, so nothing is left implied.

**Sixteen settings records were never read** — all in **System Administration**, which was never in the
six-run queue. The most-referenced are `Point of Sale Control Settings` *(cited in all six runs, never
enumerated)*, `Warehouse/Store Location Settings` *(six batches of run 04, three named tabs)*,
`Costing Control Settings`, `Status Code Settings`, `Alert Code Settings`, `Service Control Settings`
and `Warranty Settings` — the last never read despite protection plans running through runs 02, 03 and
05.

**Thirteen terms are used in the documentation and defined nowhere in it**: fly-by fulfillment ·
Staging Area · Float Label · phantom · `Ship Direct` on a transfer · `CFO Fields` ·
`Repossession Maximum $` · Inventory Formation · Product Family · `Bypass Interim` · `Times per Day` ·
**dollars-only adjustment** *(the only correction mechanism on a service order's parts, labour and
charges)* · **`Closed Without Completion`** *(five articles, two runs)*. **These are a vendor question,
not a reading problem.**

**The warehouse-wide replacement search** has three documented call sites and no description. Whether
it can take stock reserved to another order is the most consequential undocumented behaviour found.

**One article is unreachable:** `Multi-Legged Transfers Flow Chart Overview` has no readable text — the
content is a flow-chart image.

**Two article IDs 404'd** and are recorded for re-derivation rather than guessed at:
`Debit Card Payment Entry Window` (15201404901460) · `Report Improperly Processed Orders`
(15203030606100).

**Sixty inferences (I-1 … I-60)** are recorded in the batch files, tagged as inference and segregated
into section H per the method. Four were confirmed by later reading, three corrected, and **I-16
downgraded twice** as the rebate/chargeback naming problem grew from two names to four.

---

## Recommended next steps

1. **Ask STORIS the thirteen terms.** No further reading in these six sections resolves them.
2. **Read System Administration** — sixteen settings records, and it is where the audit's remaining
   gaps live. It is roughly 599 articles.
3. **Establish LA Mattress's actual configuration** before treating any finding as fact: the licence
   set, `Assign Specific Pieces At`, whether a WMS owns any location, whether Extended Receivables is
   active, and which of the four log-in security settings are on.
4. **Put three checkable questions to the warehouse**: how many manifest-removal exceptions are
   actually pick-list reprints; whether they use the envelope icon for customer contact; and how many
   orders are sitting unscheduled from declined capacity overrides.
5. **Build a consolidated external-dependency inventory** — four routing vendors, a WMS, a fraud
   analysis vendor, an alternate tax provider, flexEngage, fifteen finance providers, three
   address-verification services, and 8+ EDI document types. Each is a cutover risk.

---

*Six runs complete. Method per `BROWSER-AGENT-HANDOFF.md` and `KICKOFF-PROMPT.md`; read-only
throughout; every finding carries a verbatim quote, and everything that does not is recorded as an
inference.*
