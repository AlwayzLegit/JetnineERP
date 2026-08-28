# RUN 07 — STORIS `System Administration` — Interim summary (batches 1–10)

**Why this run exists.** It was not in the six-run queue. `AUDIT-CLOSEOUT.md` named it as recommended
next step #2, because **sixteen settings records referenced across all six runs were never read** and
every one of them lives here.

**Progress: 10 batches, findings 337–460 (124 findings), roughly 40 of 599 articles read in full.**
Read-only throughout — no setting saved, no process run, no auditing toggled, no encryption changed.

The 40 articles were not chosen for coverage. **They were chosen to close the audit's carried gaps**,
and the strike rate is the headline: **fourteen multi-run open questions closed, five prior findings
corrected, and three "we cannot know this" conclusions overturned.**

---

## A. Coverage

| Subsection | Articles | Read | Batches |
|---|---|---|---|
| System Control Settings | 87 | ~14 | 1–5 |
| User Settings | 49 | **16** | 5–9 |
| Customer Settings | 137 | 2 | 10 |
| Vendor Settings | 94 | 0 | — |
| System Administration *(nested)* | 93 | 0 | — |
| Product Settings | 88 | 0 | — |
| Views and Reports | 45 | 0 | — |
| Account Setup · Purging · Importing | 6 | 0 | — |
| **Total** | **599** | **~40** | **10** |

| File | Findings |
|---|---|
| `00-COVERAGE-QUEUE.md` | scope, counts, the sixteen carried gaps and where each lives |
| `BATCH-01-POS-AND-COSTING-CONTROL-SETTINGS.md` | 337–352 |
| `BATCH-02-RESERVATION-AND-INVENTORY-CONTROL.md` | 353–365 |
| `BATCH-03-LOGISTICS-CONTROL-SETTINGS.md` | 366–376 |
| `BATCH-04-GENERAL-SYSTEM-SERVICE-REWARDS.md` | 377–390 |
| `BATCH-05-NOTIFICATIONS-AND-SETTINGS-AUDIT.md` | 391–401 |
| `BATCH-06-REGIONAL-PROCESSING-AND-REASON-CODES.md` | 402–413 |
| `BATCH-07-USER-IDENTITY-AND-ACCESS.md` | 414–427 |
| `BATCH-08-CONSOLIDATED-PERMISSION-CATALOG.md` | 428–439 |
| `BATCH-09-PERMISSION-CATALOG-COMPLETE.md` | 440–452 |
| `BATCH-10-STATUS-CODES-AND-ALERT-CODES.md` | 453–460 |

---

## B. What closed

### Fourteen multi-run gaps

| Gap | Open since | Closed by |
|---|---|---|
| **`Point of Sale Control Settings`** — cited in all six runs, never enumerated | run 01 | F337 — nine pages, ~250 fields |
| **The reservation model** | run 03 | F353–F357 — three orthogonal axes |
| **`ASAP` / `CWC` reservation** | run 03 | F355 — two settings, ATP-constrained |
| **The customer rewards model** — *declared unreconstructable* | run 03 | F381 — five fields |
| **Module licensing** — run 04's governing caveat | run 04 | F377 — counts of **sites**, not feature toggles |
| **`Costing Control Settings`** — the last piece of run 02's cost chain | run 04 | F347, F348 |
| **The cost-exception model** | run 02 | F358 — four handling options |
| **`Assign Specific Pieces At`** — *(via run 06)* | run 04 | F340 — and it has a third name |
| **Soft route capacity vs closed routes** | run 04 | F367 — maximum closes, threshold overshoots |
| **The two inverted PO-hold permissions** | run 02 | F440 — with `Threshold Amount` |
| **Regional Processing's mechanism** — upheld eight times on boilerplate | run 01 | F402, F403, F419, F420 |
| **The consolidated permission catalogue** | run 01 | F428–F451 — ten records, ~360 permissions |
| **`Alert Code Settings`** — top unread record for three runs | run 04 | F455 — two codes, seven parameters |
| **`Closed Without Completion`** — five articles, one value ever named | run 03 | F453 — **it is a checkbox** |

Plus: the notification landscape mapped (F397) · file attachments located (F411) · `STORIS Messenger`
trigger list (F391) · multi-currency scoped (F387) · the platform named — **UniData** (F395).

### Five corrections to the audit's own record

1. **Delivery charge recalculation has five triggers, not three** (F338 vs run 04 F166).
2. **Three manifest reason-code settings, not one** (F339 vs run 04 F178).
3. **Customer Rewards and Customer Membership are two programs** (F343 vs run 03 F158).
4. **Messenger retention has three settings** — run 06 F326 called it *"the only retention chain with
   no named setting"* (F392).
5. **`Alert Code Settings` is not an engine** — run 04 F213 over-read two code-table rows into a
   subsystem (F455).

### Four inferences resolved

- **I-17** *(dotted-uppercase names are physical files)* — **confirmed** by UniData (F395).
- **I-32** *(`NIL` = not in location)* — **confirmed twice** (F359, F409).
- **I-43** *(a phantom is a placeholder record)* — **retired**; **I-66** *(a daemon)* **confirmed** (F395).
- **I-55** *(`Closed Without Completion` is an abandonment status)* — **retired and re-scoped** (F453).

### Three "we cannot know this" conclusions overturned

Run 03 declared rewards unreconstructable and recommended a vendor question. Run 06 declared messenger
retention unconfigured. The closeout said thirteen undefined terms were *"a vendor question, not a
reading problem"* and that no further reading in the six sections would resolve them.

**All three were scope-bounded conclusions stated as absolute ones.** Rewards took five fields.
Retention took three. Three of the thirteen terms have fallen, two to two-paragraph articles.

**The lesson, carried forward: label scope-bounded conclusions as such.** The remaining ten undefined
terms should be re-tested against Customer, Product and Vendor Settings before anyone puts them to
STORIS.

---

## C. Six things worth knowing

### 1. The permission model is ~360 flat booleans across ten records

Sales ~120 · Receivables ~110 · Logistics ~55 · Purchasing 22 · System 16 · Payables 15 · Service 10 ·
Personal Information ~9 · Transfer *(a location-pair matrix)* · Import Data *(per import process,
**default open**)*.

**Two-thirds is Sales and Receivables** — the counter and the credit desk. **Four entries carry
values** rather than being booleans; everything else is a checkbox, so approval hierarchies the
business has are enforced socially, not systemically. **The user-versus-group conflict rule is
documented nowhere in ten records.**

### 2. Access is seven kinds deep, has 22 documented exceptions, and grows during a session

Regional Processing is a four-level hierarchy with **two axes** (district for sales, region for
inventory), **seven location lists per user**, and 22 named exceptions — two of which are open holes:
**COG documents have no access control at all**, and **knowing a customer code overrides region,
district and location restrictions.**

**Opening a document adds its locations to your session** (stated independently in two articles). And
beneath everything sits **`File Security Groups` and `Field Security Codes`**, documented as two field
names, able to override the rest.

### 3. Three purpose-built audit tools exist, and six runs found none of them

**`Report on User Security`** (enabled *and* disabled settings per user) · **`Track Settings
Activity`** (per-file settings-change auditing) · **`Review Settings Activity`**.

All three live in the section the queue omitted. **Running them at LA Mattress is a better answer to
"who can do what today" than anything this audit can reconstruct** — and `Track Settings Activity`
answers "what changed and when" for the entire configuration.

One caution: **disabling settings auditing deletes that file's history**, with no permission named.

### 4. `Access ECL command line mode` is one checkbox

ECL is UniData's command language. **This permission grants a database command line inside the ERP**,
listed alphabetically beside `Export Grid Data`. Everything the audit has documented about controls,
holds, costing and access is application logic that this bypasses. **First field to read in any
security review.**

### 5. Licensing is counts of sites

`Licensed Users` · `AWM Sites` · `AWM Putaway Sites` · `WMS Sites` · `Barcode Sites`.

Run 04 found licensed modules changing base behaviour seven times and could never enumerate them.
**The answer is a small table on one screen** — and it means run 04's warehouse findings apply
**per warehouse**, up to a purchased count, not system-wide.

### 6. The notification landscape is seven channels with inconsistent auditability

STORIS Messenger *(8 triggers, writes a structured comment)* · Event Notification Control
*(per-event, three audiences, three methods)* · flexEngage · `ELP` · SCiX log-in messages · EOD
completion email · **the envelope icon, which writes nothing**.

Six runs found these one at a time; the map is in F397. **STORIS cannot today answer "was the customer
told?"** and neither will we if we reproduce this.

---

## D. What remains

### Highest priority

1. **`File Security Groups`** and **`Field Security Codes`** — a seventh access mechanism able to
   override the other six, documented as two field names (F417).
2. **`Assign Screen Action Permission`** — a named article and a System Security permission; possibly
   an eighth kind (F431).
3. **User-versus-group conflict resolution** — undocumented across ten records (F450).
4. **`Warranty Settings`** — never read in seven runs, despite protection plans running through runs
   02, 03 and 05.
5. **`Notifications Control Settings`** — the event list behind Event Notification Control (F401).

### By subsection

- **Customer Settings (137, 2 read)** — `Advanced Customer Settings` · `Customer Credit and Scoring
  Information` · `Payment History Code` · `Credit Application Control Settings` · `Revolving Payment
  Plan Settings` · `Finance Provider Settings` · `Protection Plan Settings`.
- **Product Settings (88, 0 read)** — **`Warranty Settings`** · `Advanced Product Settings`
  *(cited in a dozen findings)* · `Distribution Status Settings` · `District and Regional Product
  Settings`.
- **Vendor Settings (94, 0 read)** — `Third Party Logistics Settings` · `Vendor EDI Settings` ·
  `Advanced Vendor Settings`.
- **System Administration nested (93, 0 read)** — **`Warehouse/Store Location Settings`**
  *(ten-plus named fields across three tabs, referenced from six batches of run 04)* ·
  `Tracked Storage Location Settings` · `Route Capacity Settings` · `Shared Route Capacity Settings`.
- **Views and Reports (45, 0 read)** · **Purging Data (1)** · **Importing Data (1)** ·
  **Account Setup (4)**.

### The ten remaining undefined terms

`Twilight` · fly-by fulfillment · Staging Area · Float Label · `Ship Direct` *(on a transfer)* ·
`CFO Fields` · Inventory Formation · Product Family · `Bypass Interim` · `Times per Day` ·
dollars-only adjustment. *(`ELP` partly understood.)*

**Method note from F459:** across run 07 the multi-run gaps have closed in the **short code-table and
settings articles**, not the long process ones. The remaining plan should prioritise accordingly.

---

## E. Contract adjudication — run 07 so far

| Contract | Verdict |
|---|---|
| **W-024** *(holds)* | **CONFIRMED** — `C7`/`C8` parameterised (F455); the inverted PO-hold pair located (F440) |
| **W-041** *(cost exceptions)* | **CONFIRMED — the model is complete** (F348, F358) |
| **W-042** *(propagation, notification)* | **CONFIRMED** — the notification landscape mapped (F397); vendor EDI rewrites POs (F373) |
| **W-046** *(chargebacks)* | **I-16 upgraded to probable** — a sixth and seventh instance, two now linked (F363, F383, F432) |
| **W-050** *(access control)* | **CONFIRMED — the model is documented end to end**: hierarchy, exceptions, ten records, seven kinds (F402–F451) |
| **W-052 / W-053** *(GL)* | **CONFIRMED and extended** — **reason codes carry two GL accounts** (F407); RTV landed-cost switches (F350) |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED — the model is complete after four runs** (F353–F357) |
| **W-061** *(cost)* | **CONFIRMED** — three costing methods, four labelled add-on slots (F347) |
| **W-064** *(retention)* | **CONFIRMED** — the audit's nine chains become **at least twenty-five** |
| **NEW** | licensing · PII encryption and masking · deployment model · settings auditing · product identification · session-accumulated access · file/field security · the UniData platform |

---

## F. The standing caveat, revised

Run 04's summary opened with a caveat that governed everything after it: *"every finding is
conditional on a licence and settings set we have never seen."*

**That caveat now has a shape.** The licence set is seven display-only fields on one screen (F377).
The settings set is roughly 250 fields in `Point of Sale Control Settings` alone, of which six runs
cited fifteen. And **`Track Settings Activity` can tell you when each was last changed** (F394).

So the recommendation the closeout made as step #3 — *"establish LA Mattress's actual configuration
before treating any finding as fact"* — is now a **specific, short list of screens to photograph**:
General System Control Settings *(all four tabs)* · Point of Sale Control Settings *(nine pages)* ·
Inventory Control Settings · Costing Control Settings · plus `Report on User Security` and
`Review Settings Activity` extracts.

**That is a morning's work and it is worth more than another 500 articles of reading.**

---

*Run 07 in progress. Batches 1–10 complete; the audit's carried gaps are closed. Remaining work is
coverage of five subsections, prioritised toward the code-table and settings articles.*
