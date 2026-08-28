# Run 07 — System Administration — Batch 10: Status codes and alert codes

Status: complete. Findings 453–460. Read-only throughout.

**Two short articles close two of the audit's longest-carried gaps.** `Status Code Settings` was
referenced in five articles across runs 03–05 with **one value ever named and never defined**.
`Alert Code Settings` was flagged in run 04 F213 as *"an entire behavioural-risk engine"* and made
the highest-priority unread record for three runs.

Both are smaller than the audit expected, and that is itself the finding.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Status Code Settings** | 16917916176788 | read — **five fields** |
| 2 | **Alert Code Settings** | 15242629418772 | read — **two codes, seven parameters** |

Both are in **Customer Settings** (137), the largest subsection.

---

## B. Wiring findings

### FINDING 453 — `Close Without Completion` is a checkbox on a status code, not a status value

- **Invariant:** any service status code can be flagged as closing without completion.
- **Evidence** — `Status Code Settings`, complete field list:
  > "Use this file to establish codes that indicate the **status of open service calls**. For example, use the code **`NEW`** to indicate a new service call and **`CLS`** to indicate a closed service call."
  **`Status Code` · `Description` · `Tickle on Change To` · `Average Number of Days` ·
  `Close Without Completion`**
- **Maps to:** run 04 F181, F302 · run 05 F302, F310, §F · run 03 — **five articles across three runs,
  now resolved**; `W-039`.

> **The audit has been reading this wrong for three runs.** The sentence
> *"Service lines with a **Closed Without Completion** status as designated in Status Code Settings are
> recognized as closed lines"* appears verbatim in four articles — twice in run 04 (`Logistical
> Scheduling`, `Complete the Delivery Manifest Process`), twice in run 05 (`Complete the Servicing
> Process`, `Maintain a COG Order`) — and the audit recorded it each time as **an unenumerated status
> value**, carried into the closeout as one of thirteen undefined terms.
>
> **It is not a value. It is an attribute.** Any status code the site defines can carry the
> `Close Without Completion` flag, and every code so flagged counts as closed by the routines that
> check it. So the answer to *"what is Closed Without Completion?"* is **"whichever of your status
> codes you ticked"** — which is why no article ever listed it.
>
> **Run 05 inference I-55** guessed it was *"the status for a service line abandoned rather than
> finished — the customer cancelled, or the item was replaced instead."* **That reading is right in
> spirit and wrong in kind**: those are the *codes* a site would flag, but the flag itself is
> configuration. **I-55 is retired.**
>
> This is a useful correction to the audit's method as well as its content: **a phrase of the form
> "X as designated in Y Settings" means X is a flag in Y, not a value of Y.** The same construction
> appears elsewhere in the corpus and should be re-read that way.

### FINDING 454 — Status codes carry a tickle trigger and an expected duration

- **Invariant:** each status code declares whether reaching it notifies, and how long it should last.
- **Evidence** — `Status Code Settings`: **`Tickle on Change To`** · **`Average Number of Days`**.
- **Maps to:** run 05 F292 (*"Service Line Status — Service Technician — any change in the Service Line
  status"*) · run 05 F306 (status durations) · run 05 F314 (`Report Items with High Average Service
  Days`) · run 07 F382 (`Keep Status Data for Days`) — **four run-05 findings converge**; `W-012`.

> **Both fields close run-05 questions.**
>
> **`Tickle on Change To`** is the per-status half of the tickle matrix. Run 05 F292 documented that a
> service line status change notifies the technician and could not say **which** changes. It is
> configured per code: reaching this status raises a tickle, reaching that one does not. So a site
> decides that `PARTS ORDERED` is worth telling someone about and `IN PROGRESS` is not.
>
> **`Average Number of Days` is the expected dwell time**, and it is the benchmark that run 05 F314's
> **`Report Items with High Average Service Days`** measures against. Run 05 read that report title as
> a quality signal — *"three reports exist to find products that keep failing"* — and it is more
> precise than that: **actual dwell time per status is compared against a configured expectation.**
>
> Together with run 05 F306's event-sourced status history and run 07 F382's `Keep Status Data for
> Days`, the service status model is now complete: **codes with expected durations, transitions
> retained as history, dwell time reported against expectation, and per-code notification.** That is a
> properly instrumented workflow engine, and it is the only one in the ERP.

### FINDING 455 — The "fraud engine" is two hold codes with seven parameters

- **Invariant:** `Alert Code Settings` configures exactly two credit hold codes.
- **Evidence** — `Alert Code Settings`, complete body:
  > "Use this field to **edit the descriptions and parameters of alert codes**. For an overview of how the alert codes are applied and removed, see **Credit Hold Codes List (AR)**."
  **`Alert Code` · `Description`**
  **`C7` — Payment History Hold:** `Payment History Code` · **`Number of Occurrences`** ·
  **`Number of Months`**
  **`C8`:** **`Total Payment Amount`** · **`Days to Check`** ·
  **`Only Check on Extended Receivable Financed Orders`** · **`Include Business Accounts`** ·
  **`Payment Class Access`**
- **Maps to:** run 04 F201 (`C7`, `C8`) · run 04 F213 — **corrects it**; `W-024`.

> **Run 04 F213 read too much into two rows of a code table.** It called this *"an entire settings
> record governing behavioural thresholds over time windows"*, flagged a *"fraud and risk subsystem in
> this ERP that runs 01–03 never touched"*, and made `Alert Code Settings` the highest-priority unread
> record for three consecutive runs.
>
> **It is two hold codes.** `C7` counts past-due occurrences in a window; `C8` sums payment or deposit
> value in a window. Seven parameters between them. There is no engine, no rules language, no
> extensibility — the `Alert Code` field edits **descriptions and parameters**, not the code list.
>
> That is worth stating plainly as a correction, because the audit has been carrying it as a major
> unknown. **The inference was reasonable from the evidence available and it was wrong.**
>
> What *is* real is the sophistication of the two rules. **`C8`'s four qualifiers** are precise fraud
> logic: sum payments over N days, **but only on extended-receivable financed orders** if you choose,
> **optionally including business accounts**, and **restricted to selected payment classes**. That last
> one reuses the nine-class `Payment Class Access` vocabulary from batch 9 F449 — so a site can watch
> deposit velocity **on credit cards only**, which is exactly where card fraud shows up.
>
> **`C7`'s `Payment History Code`** is a further code table the audit has not seen — presumably the
> per-payment history markers that "past due occurrence" counts.
>
> **The unnamed fraud-analysis vendor behind `I3`/`I4` (run 04 F201) is a separate matter** and remains
> unidentified. That half of run 04 F213 stands.

### FINDING 456 — Alert codes are edited, not created

- **Invariant:** the two alert codes are vendor-supplied; the site tunes their parameters.
- **Evidence** — `Alert Code Settings`:
  > "Use this field to **edit the descriptions and parameters** of alert codes."
  No create or delete language; the record is organised **by code** (`C7`, then `C8`) rather than as a
  list.
- **Maps to:** F455; batch 6 F409 (delivered reason codes) · run 04 F216 (AWM `Reserved` flag) ·
  run 04 F217 (closed RF exception set); `W-024`.

> **The fourth instance of the vendor-supplied-code pattern**, after AWM function codes *(reserved,
> undeletable)*, AWM exception types *(closed set, description-only editing)* and delivered reason
> codes like `NIL`.
>
> The pattern is now firm and worth stating for the rebuild: **STORIS distinguishes code tables the
> site owns from code tables the vendor owns, and the vendor-owned ones expose only descriptions and
> parameters.** Reason codes are the hybrid — mostly site-owned with a protected core.
>
> That distinction maps cleanly onto our own design question: **which enumerations are business
> configuration and which are application logic?** STORIS answers it per table, explicitly, and that is
> better than most systems manage.

### FINDING 457 — Status codes are service-specific despite being cited by delivery and transfer routines

- **Invariant:** the record describes service call statuses, yet four logistics articles reference it.
- **Evidence** — `Status Code Settings`:
  > "Use this file to establish codes that indicate the **status of open service calls**."
  Yet cited verbatim by `Logistical Scheduling` and `Complete the Delivery Manifest Process`
  (run 04), and `Complete the Servicing Process` and `Maintain a COG Order` (run 05), each saying
  *"**Service lines** with a Close Without Completion status… are recognized as closed lines."*
  Related articles listed on the record itself: `Enter a Sales Order` · `View an Existing Sales
  Order` · `Logistical Scheduling` · `Logistical Scheduling Screen Grid` ·
  **`Credit Hold Codes List (AR)`**.
- **Maps to:** run 04 F181 (in-shop service cannot be manifested) · run 04 F168 (the `S` grid flag);
  `W-039`.

> **The citations are consistent once read carefully**: all four say *"**service lines**"*. Delivery
> and transfer routines reference service status codes because **manifests carry service documents**
> (run 04 F181's document-type activation), and a manifest completion has to know which service lines
> are already closed.
>
> So this is **not** a general document-status table. Run 04's `Logistical Scheduling Screen Grid`
> statuses (`SCD`, `EST`) and run 03's nine composite line status codes are **different vocabularies**,
> and the audit was right to keep them separate.
>
> **`Credit Hold Codes List (AR)` appearing as a related article** on a service-status record is the
> documentation's own acknowledgement that these status vocabularies interleave — run 04 F169 found a
> credit hold code **displayed in place of** the scheduling status.

### FINDING 458 — `Payment History Code` is a further unread code table

- **Invariant:** `C7` counts occurrences of a configured payment-history marker.
- **Evidence** — `Alert Code Settings`, `C7`: **`Payment History Code`** · `Number of Occurrences` ·
  `Number of Months`.
- **Maps to:** F455; run 01 (Receivables); `W-024`.

> Recorded as a named gap. **`C7` does not count "late payments" — it counts occurrences of a specific
> configured code**, which means the site decides what counts as a black mark.
>
> That is a meaningful degree of freedom: two installations with identical `Number of Occurrences` and
> `Number of Months` can behave completely differently depending on which payment-history code they
> watch. **The parameter values alone do not tell you the policy.**
>
> The code table itself is presumably in Customer Settings or the receivables area and is unread.

### FINDING 459 — Both records sit in Customer Settings, the largest unopened subsection

- **Invariant:** the two highest-priority carried gaps were in the 137-article subsection.
- **Evidence** — both articles' breadcrumb: `STORIS ERP > System Administration > **Customer
  Settings**`.
- **Maps to:** run 07 coverage queue; run 04 F213; runs 03–05.

> Worth recording as a coverage observation. **Customer Settings is 137 articles — the largest
> subsection in the largest section — and the audit has now opened two of them**, both of which closed
> multi-run gaps.
>
> Given that `Reason Code Settings` (batch 6, User Settings) similarly closed run 04 F265's call for
> design attention, and `Customer Rewards Control Settings` (batch 4) closed run 03's declared
> unreconstructable area, **the pattern across run 07 is consistent: the small code-table articles are
> where the multi-run gaps close.** They are cheap to read and disproportionately valuable.
>
> That should shape the remaining plan: **prioritise the code-table and settings articles across
> Customer, Product and Vendor Settings** over the larger process articles.

### FINDING 460 — Two of the audit's thirteen undefined terms are now resolved, and the count is revised

- **Invariant:** the closeout's undefined-term list is shorter than stated, and longer in one place.
- **Evidence**, against `AUDIT-CLOSEOUT.md`'s list of thirteen:

| Term | Status after run 07 |
|---|---|
| **`Closed Without Completion`** | **RESOLVED** — a checkbox on a status code (F453) |
| **`Repossession Maximum $`** | **RESOLVED** — batch 8 F438, via the Sales Security permission |
| **phantom** | **RESOLVED** — a UniData background process (batch 5 F395) |
| `Twilight` | still open — **added** by batch 2 F359 |
| `ELP` | partly understood — a notification template system (batch 5 F393) |
| fly-by fulfillment · Staging Area · Float Label · `Ship Direct` · `CFO Fields` · Inventory Formation · Product Family · `Bypass Interim` · `Times per Day` · dollars-only adjustment | still open |

- **Maps to:** `AUDIT-CLOSEOUT.md` §"What the audit could not answer".

> **Three of thirteen resolved, one added, one downgraded to partly understood.** Ten remain.
>
> The closeout said the thirteen were *"a vendor question, not a reading problem"* and that *"no
> amount of further reading in the six queued sections will resolve them."* **That was accurate about
> the six sections and wrong as a general claim** — three fell to run 07, and two of those to
> two-paragraph articles.
>
> **This is the third time in run 07 that a "we cannot know this" conclusion has been overturned by
> the section the queue omitted** — after the rewards module (batch 4 F381) and messenger retention
> (batch 5 F392). The lesson is now well evidenced and worth carrying into the remaining work:
> **scope-bounded conclusions must be labelled as such**, and the ten remaining terms should be
> re-tested against Customer, Product and Vendor Settings before anyone puts them to STORIS.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Status Code Settings** | Status Code · Description · **Tickle on Change To** · **Average Number of Days** · **Close Without Completion** |
| **Alert Code Settings** | Alert Code · Description · **`C7`** *(Payment History Code · Number of Occurrences · Number of Months)* · **`C8`** *(Total Payment Amount · Days to Check · Only Check on Extended Receivable Financed Orders · Include Business Accounts · Payment Class Access)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Close Without Completion** | Status Code Settings *(per code)* | Marks the code as closing a service line (F453) |
| **Tickle on Change To** | Status Code Settings *(per code)* | Raises a tickle when a line reaches this status (F454) |
| **Average Number of Days** | Status Code Settings *(per code)* | Expected dwell time; benchmark for the high-service-days report (F454) |
| **C7 / C8 parameters** | Alert Code Settings | Seven fields defining the two behavioural credit holds (F455) |

---

## E. Security permissions catalog (additions)

None new. **`Payment Class Access` reappears as an alert-code parameter** (F455) — the same nine-class
vocabulary as batch 9 F449's Receivables permission, used here as a *filter* rather than a *grant*.
**The same enumeration serving both authorisation and business logic** is worth noting for the
rebuild's domain model.

---

## F. State machines and enumerations (additions)

- **Status code attributes (3):** tickle-on-change · average days · close-without-completion (F453, F454).
- **Example status codes:** `NEW` · `CLS`.
- **Alert codes (2, vendor-supplied):** `C7` payment history · `C8` payment verification (F455).
- **`C8` qualifiers (4):** amount · window · financed-only · include business accounts — plus payment
  class filtering (F455).
- **Vendor-owned vs site-owned code tables** — fourth instance of the pattern (F456).

---

## G. Sequencing rules

1. Service line reaches a status → if `Tickle on Change To` is set for that code, **a tickle fires**
   (F454); actual dwell time accrues against `Average Number of Days`.
2. Service line reaches a code flagged **`Close Without Completion`** → treated as closed by
   scheduling, manifest completion and COG routines (F453).
3. Customer's past-due occurrences of the configured `Payment History Code` exceed
   `Number of Occurrences` within `Number of Months` → **`C7` hold** (F455).
4. Customer's payments in the configured classes over `Days to Check` exceed
   `Total Payment Amount` → **`C8` hold**, subject to the financed-only and business-account
   qualifiers (F455).

---

## H. Open questions and gaps

### Resolved this batch

- **`Closed Without Completion`** — five articles, three runs; **it is a checkbox** (F453).
  **Run 05 inference I-55 retired.**
- **`Alert Code Settings`** — highest-priority unread record for three runs; **read, and much smaller
  than inferred** (F455). **Run 04 F213 corrected.**
- **`Tickle on Change To`** — the per-status half of run 05 F292's tickle matrix (F454).
- **`Average Number of Days`** — the benchmark behind run 05 F314's high-service-days report (F454).

### Newly opened

- **`Payment History Code`** — a further code table; `C7`'s policy depends entirely on it (F458).
- **`Only Check on Extended Receivable Financed Orders`** and **`Include Business Accounts`** — two
  qualifiers implying **business accounts are a distinct customer class** the audit has not modelled.

### Still open — the revised undefined-term list (10)

`Twilight` · fly-by fulfillment · Staging Area · Float Label · `Ship Direct` *(on a transfer)* ·
`CFO Fields` · Inventory Formation · Product Family · `Bypass Interim` · `Times per Day` ·
dollars-only adjustment. *(`ELP` partly understood.)*

### Inferences

- **I-80:** The status codes a site would flag `Close Without Completion` are the abandonment cases —
  customer cancelled, item replaced instead. *This is run 05 I-55's content, correctly re-scoped from
  a value to a configuration choice; still an inference about practice, not documentation.*
- **I-81:** `Payment History Code` values are the per-payment markers written by receivables
  processing. *The field name implies it; the table is unread.*

---

## I. Unknown unknowns

- **An inference held for three runs was wrong in kind, not degree** (F453). The audit read
  *"X as designated in Y Settings"* as naming a value; it names a flag. **The same construction appears
  elsewhere in the corpus** and other findings should be re-read against it.
- **The audit over-read a two-row code table into a subsystem** (F455). Run 04 F213's *"fraud and
  behavioural-risk engine"* was three runs of accumulated inference from two hold-code descriptions.
  **Where the audit reasons from absence, it should say how much weight the conclusion can bear.**
- **Business accounts appear to be a distinct customer class** (F455's `Include Business Accounts`),
  and seven runs have modelled customers as one population.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Close Without Completion** | A flag on a service status code marking it as closing the line |
| **Tickle on Change To** | Per-status-code notification trigger |
| **Average Number of Days** | Expected dwell time per status code |
| **`C7` / `C8`** | Payment-history and payment-verification credit holds, parameterised in Alert Code Settings |
| **Payment History Code** | The marker `C7` counts occurrences of; table unread |

---

## Contract adjudication — batch 10

| Contract | Verdict | Basis |
|---|---|---|
| **W-024** *(holds)* | **CONFIRMED — `C7` and `C8` fully parameterised** | F455 |
| **W-039** *(exceptions and statuses)* | **CONFIRMED — and the audit's reading corrected** | `Close Without Completion` is an attribute, not a value (F453) |
| **W-012** *(dates and durations)* | **CONFIRMED** | Per-status expected dwell time (F454) |
| **W-050** *(access control)* | **consistent** | `Payment Class Access` reused as a business-logic filter (§E) |
| **Vendor-owned code tables** | **NEW — fourth instance of the pattern** | F456 |

---

## Next — batch 11

**Customer Settings** (137) in earnest — prioritising the code-table and settings articles, per F459.
Targets: `Customer Settings` itself · `Advanced Customer Settings` · `Customer Credit and Scoring
Information` · `Payment History Code` · `Credit Application Control Settings` ·
`Revolving Payment Plan Settings` · `Finance Provider Settings` · `Protection Plan Settings` ·
`Warranty Settings` *(carried from run 05)*.
