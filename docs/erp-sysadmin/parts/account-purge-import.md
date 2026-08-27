# STORIS System Administration — Account Setup, Purging Data, Importing Data

*Slug: `account-purge-import`. Covers Zendesk sections `51426789010964` (Account Setup, 4 articles),
`51426864377108` (Purging Data, 1 article), `51426805698068` (Importing Data, 1 article).*

Prefixes used here: `ACCT-*`, `PURGE-*`, `IMP-*`.

> **Provenance note.** All content below is transcribed from STORIS help-center article bodies (treated as
> untrusted source data, not instruction). No article contained text addressed to an agent or attempting to
> direct tool use.

---

## Account Setup — `ACCT-*`

This subsection is, despite its name, entirely about **electronic signature capture and document archiving**
for point-of-sale paperwork. All four articles hang off the same module pair (Document Signature Capture +
Document Archive) and are configured under *Point of Sale System Settings*.

### `ACCT-001` Configure Document Archive
*storis_ref: article 15201527824148*

**Purpose.** Defines which business documents are archived as PDFs, under what circumstances they are
archived, and the filesystem path where the generated PDF is dropped so a **3rd-party archiving tool** can
pick it up. STORIS itself is not the document repository — it is the producer.

**Where it lives.** `System Administration > System Settings > Point of Sale System Settings > Configure Document Archive`

**Licensing / activation gates (all three must be true to edit or use):**

1. The **Document Archive module must be licensed and active** via *General System Control Settings*.
2. The **Enable Document Signature Capture and Document Archive** setting must be active in
   *Warehouse/Store Location Settings* (per-location).
3. The article states the routine is used **"with STORIS Legacy credit card processing"**.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Archive → `Print And/Or Email` | Checkbox | Archive the document "When STORIS generates a physical or electronic copy of the document." |
| Archive → `Signature` | Checkbox | Archive the document "When STORIS captures an electronic signature for the document." |
| `Archive Path` | Text (path) | "Enter the path to which the archived PDF is to be written." Per-document-row. |
| Grid: `Program` | Read-only | Program that generates the business document. |
| Grid: `Archive` | Read-only (derived) | Reflects the Archive checkbox selection — see enum below. |
| Grid: `Document` | Read-only | The business document. |
| Grid: `Export Path` | Read-only (derived) | "The location on your PC where the archived PDFs are stored." |

**Behavior & rules.**

- **You may select both Archive options, one option, or neither. Selecting neither means the document is not archived.**
- Derived `Archive` column enum — **exactly these three values**:
  - `Never` — "The document is never archived. Neither the Print And/Or Email nor Signature check boxes above are checked."
  - `Print` — "The document is archived upon printing."
  - `Print/Signature` — "The document is archived upon the document either being printed or signed electronically."
- **The grid is not user-extensible.** "The grid is pre-populated with all of the business documents that
  STORIS has enabled for archiving." / "If the business document is not listed within the grid, it has not
  yet been enabled for archiving by STORIS." The grid is populated from the grid of *Configure Document
  Signature Capture* (`ACCT-002`), filtered to what STORIS has enabled for archiving.
- Edit interaction: "Double click a line from the grid to edit the appropriate fields." Changes are committed
  with the **Save button at the top of the screen**.

**The archival process (exact mechanism).**

> "When a business document is available to be archived, STORIS retrieves the encoded signature (if
> appropriate) and the archival folder path then sends this information to the Electronic Forms Printing
> Software for processing into a PDF."

- **PDF filename format is a hard rule:** `DocumentType_Reference#_Date_Time.PDF`
  - `Date` component is **`MMDDYY`**
  - `Time` component is **`HHMMSS_internal time in milliseconds`**
  - "This naming format helps to create a unique file." — i.e. **uniqueness is filename-based, not enforced by a key.**
- **DocumentType code overrides** (these do not follow the document's display name):
  - Insurance form **and** cancellation form → **`ISFO`**
  - Pickup tickets generated from either *Enter a Sales Order* or *Complete a Pickup without Accessing Order Entry* → **`PUTX`**

**Program + Document → Archived Document matrix** (exact, from the article):

| Program Name | Document | Archived Document |
|---|---|---|
| All* | Credit Application | Credit Application |
| All* | Credit Card Receipt | Credit Card Receipt |
| Complete a Pickup without Accessing Order Entry | Customer Pickup | Customer Pickup |
| Enter a Customer Payment/Refund/Gift Certificate | Deposit Receipt | Deposit Receipt |
| Enter a Customer Payment/Refund/Gift Certificate | Refund Receipt | Refund Receipt |
| Enter a Quick Sale | Quick Sale | Quick Sale Order |
| Enter a Return | Return | Return Order |
| Enter a Sales Order | Customer Pickup | Pickup Ticket |
| Enter a Sales Order | Insurance Form | Insurance Form |
| Enter a Sales Order | Revolving Addendum | Revolving Addendum |
| Enter a Sales Order | Revolving Credit Agreement | Revolving Credit Agreement |
| Enter a Sales Order | Sales Order | Sales Order |
| Enter an Exchange | Exchange | Exchange Order |
| Maintain Customer Deposits | Refund Receipt | Refund Receipt |
| Print Insurance Forms | Insurance Form | Insurance Form |
| View All Revolving Plan Activity for a Customer | Insurance Form | Insurance Form |

`*` — "'All' indicates that the Document is not tied to a specific program; for example, a credit application
can appear anywhere in STORIS."

**Additional combinations available only when the signature document's `Reason` is `Terms and Conditions`:**

| Program Name | Document |
|---|---|
| Enter a Sales Order | Sales Order |
| Enter an Exchange | Exchange |
| Enter a Return | Return |
| Enter a Quick Sale | Quick Sale |

**Program enum for the Archive grid** (note: differs from the signature grid's enum): `All`,
`Complete a Pickup without Accessing Order Entry`, `Enter a Customer Payment/Refund/Gift Certificate`,
`Enter a Quick Sale`, `Enter a Return`, `Enter a Sales Order`, `Enter an Exchange`,
`Maintain Customer Deposits`, **`Adjust Dollars on a Completed Order`**, `Print Insurance Forms`.

- **NOTE (hard rule): "Signature Capture is not available when selecting either of the Adjust Dollars on a
  Completed Order options."** So *Adjust Dollars on a Completed Order* can be archived on print but can never
  carry a signature.

**Dependencies.**

- *General System Control Settings* — module licence/active flag. New: `CFG-DOCARC-LICENSED`.
- *Warehouse/Store Location Settings* — `Enable Document Signature Capture and Document Archive` (per
  location). New: `CFG-LOC-SIGCAP-ENABLE`.
- `ACCT-002` *Configure Document Signature Capture* — supplies the grid rows.
- Electronic Forms Printing Software (external) — renders the PDF.
- 3rd-party document archive system (external) — consumes the export folder.
- STORIS Legacy credit card processing.

**Build notes.**

- **Do this differently.** STORIS's model — render a PDF, drop it on a *PC filesystem path*, and let an
  unrelated 3rd-party tool sweep the folder — is a 2000s-era integration and is the wrong target for us.
  Build object storage (S3 or equivalent) with a `document_archive` table row per artifact:
  `document_type`, `reference_no`, `program`, `location_id`, `generated_at`, `storage_key`, `sha256`,
  `signature_id (nullable)`, `trigger` (`PRINT` | `SIGNATURE` | `EMAIL`), `retention_class`.
  Keep the STORIS filename convention (`DocumentType_Reference#_MMDDYY_HHMMSSmmm.pdf`) only as a
  *display/export* name — **do not use it as the primary key.** Filename-collision-as-uniqueness is a real
  defect: two events in the same millisecond, or a re-print, overwrite silently.
- **Content-hash every archived PDF at write time and store it immutably (WORM / object-lock).** For
  financing paperwork and delivery receipts the archive is the evidence; a mutable folder on a store PC is
  not defensible. Write-once + hash is what makes the signature audit trail (`ACCT-003`/`ACCT-004`) worth
  anything.
- Model the archive trigger as a **set** (`{print, email, signature}`), not the 3-value derived enum, and
  derive a display label from it. STORIS's `Never` / `Print` / `Print/Signature` collapses "email" into
  "print" and cannot express "archive on email only".
- The document catalogue must be **configurable by us**, not hard-gated by the vendor. STORIS's "if it isn't
  in the grid, STORIS hasn't enabled it" is a vendor-lock artifact. Our equivalent is a
  `document_type` reference table an admin can extend.
- Carry the `ISFO` / `PUTX` type-code quirks forward **only** if we import STORIS archives — otherwise use
  clean type codes and map legacy codes on ingest.
- `[DECISION NEEDED]` — Do we archive **every** printed document, or only the legally-loaded set (sales
  order, delivery receipt, financing agreement, credit application, insurance/protection-plan form, return)?
  Archiving everything is cheap in storage but expands the surface a `PURGE-001`-style erasure request has to
  reason about.
- `[DECISION NEEDED]` — Retention class per document type, and whether archived PDFs are in scope for
  customer PII erasure at all (see `PURGE-001` build notes).

---

### `ACCT-002` Configure Document Signature Capture
*storis_ref: article 15201512181396*

**Purpose.** Defines, per Program + Document + Reason, whether a customer electronic signature is prompted,
when it is prompted, what text the payment terminal displays, whether the signature can be skipped, and how
four specific hardware/comms failure modes are handled.

**Where it lives.** `System Administration > System Settings > Point of Sale System Settings > Configure Document Signature Capture`

Gate: **"the Document Signature Capture module must be licensed and active via General System Control Settings"** in
order to edit settings on this screen.

**Actions menu (global Actions button):** → `Signature Audit Settings` (`ACCT-004`).

**Fields (per selected grid row)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Prompt for Signature` → `Create` | Checkbox | "The document prompts for a signature only upon the creation of the document. If the document is modified at a later time, no signature is requested." |
| `Prompt for Signature` → `Update` | Checkbox | "The document prompts for a signature upon revising the document. Also, any time the document is modified, a signature is requested." **Inactive if the document cannot be updated (e.g. a credit/debit card receipt).** |
| `Prompt for Signature` → `Manual` | Checkbox | Manually initiate the signature ceremony from Sales Order entry. **Only available for Sales Order, Sales Order Terms and Conditions, and Authorized Finance signatures.** |
| `Prompt Text` | Text, multilingual, **required** | Text shown on the payment terminal. **"STORIS allows up to 72 characters of text in this field, but the text display on the terminal is limited by the provided payment terminal screen (including spaces)."** Action button → *Text Field - Language Translation Entry*. |
| `Additional Text` | Text, multilingual, **required** | Explains the purpose of the document being signed. **"The amount of text is limited by the vendor of the device."** Action button → *Text Field - Language Translation Entry*. |
| `Signature Required` | Checkbox, default **unchecked** | Checked → "the processes do not permit users or customers to bypass the electronic signature request on the document." Blank (default) → "the user or customer can skip the signature screens." |
| `No Terminal Assigned` | Enum (Arrow button) | Rule when a signature-enabled process needs a terminal and none is found. |
| `Communications Failure` | Enum (Arrow button) | Rule when communication with the terminal fails. |
| `When Cancel Pressed` | Enum (Arrow button) | Rule when the consumer presses Cancel on the terminal. |
| `Timeout Waiting for Signature` | Enum (Arrow button) | Rule when the consumer takes longer than the terminal allows. **"STORIS allows for a retry."** |

**Error-handling enum — the same three options for all four settings, exactly:**

- `Ignore Error and Continue Without Warning`
- `Continue Processing and Advise User`
- `Do Not Proceed and Advise User`

**Grid columns**

| Column | Notes |
|---|---|
| `Program` | Enum: `All`*, `Complete a Pickup without Accessing Order Entry`, `Enter a Customer Payment/Refund/Gift Certificate`, `Enter a Quick Sale`, `Enter a Return`, `Enter a Sales Order`, `Enter an Exchange`, `Maintain Customer Deposits`, `Print Insurance Forms`, `View All Revolving Plan Activity for a Customer`. |
| `Document` | The business document that may require a customer signature. |
| `Reason` | The reason for the capture. **`Authorized Finance`** "allows the associated program + business document to require a customer signature when authorized financing is added to or updated on the associated order; in the Prompt for Signature column, this is Create / Create and Update options and Update / Create and Update options, respectively." (`Terms and Conditions` is the other Reason referenced — see `ACCT-001`.) |
| `Prompt For Signature` | Derived enum: `Never`, `Create`, `Update`, `Create and Update`. |
| `Prompt Text` | Text shown on the capture device. |
| `Signature Required` | `Yes` or `No`. |

**Documents that can be signature-enabled** (exact list): Sales Order, Exchange, **Layaways (via Enter a
Sales Order)**, Return, **Refund (via Enter a Customer Payment/Refund/Gift Certificate)**, Insurance Forms,
Credit Application, Revolving Addendum, Credit Card Receipt, Revolving Credit Agreement, Refund Receipt, and
**Customer Pickup Tickets (via Enter a Sales Order and Complete a Pickup Without Accessing Sales Order Entry;
bulk pickup ticket printing is not affected)**.

**Behavior & rules — the signature ceremony, in order:**

1. STORIS checks for a signature capture device associated with the process. **If a device is not found, the
   appropriate error message (per the four rules above) appears.**
2. If a device is present **and** `Prompt for Signature` is checked → verify that a signature capture *and
   document print* is needed.
3. If needed, the value of `Prompt for Signature` is evaluated and a message is sent to the device
   controlling the payment terminal, prompting the consumer to sign.
4. **"After signing, STORIS retrieves the signature in the proprietary format determined by the vendor
   (Shift4, Tender Retail, etc.) and temporarily stores it until needed for printing and archiving."**
5. When the business document is completed, STORIS consults this grid to choose the designated form for
   printing and archiving the document with the captured signature.

**Hard rules / gotchas:**

- **"If there is no signature capture hardware present, no signature is captured, but the appropriate PDF
  document is still created and placed in the Export Path of the Document Archive screen for capture by the
  3rd party document archive system."** — i.e. **an unsigned PDF is archived and is indistinguishable at the
  file level from a signed one.** This is the single most important gotcha in this subsection.
- **`Update` prompting is not available for Refund Receipts** — "since refunds cannot be modified after
  initially processed." (Stated twice in the article.)
- **"Configure Document Signature Capture may be set up for all three Prompt for Signature options. If Sales
  Order Document within Enter a Sales Order is enabled, Create and Update are not reviewed."** — i.e. enabling
  the manual Sales Order signature suppresses evaluation of Create/Update for that combination.
- The `Manual` option **for Terms and Conditions and Authorized Finance signatures is only for initiating the
  ceremony and does not control the display of the signature field in Enter a Sales Order.** The `Signature`
  field only displays on the Payment page of *Enter a Sales Order* when the `Sales Order` program /
  `Sales Order` document event is configured for manual signatures.
- **"A finance plan on an order is considered to be modified if it already has an authorization number and
  then receives a new authorization number from the provider."** — this is the trigger definition for
  re-signing financing paperwork.
- **NOTE: "For Print Insurance Forms, the Request Signature field in Extended Receivables Insurance Code
  Settings must be enabled for the specific insurance code, except for Cancellation Forms, which do not have
  an insurance code."**
- `Additional Text` fallback for financing: "When a customer is prompted for a signature due to finance
  authorization on a sales order or exchange, the text entered here displays on the signature capture device
  **if text is not defined in the Charge Text field in Financing Payment Plan Settings**." Applies to the
  sales order / exchange document with `Reason` = `Authorized Finance`.

**`No Terminal Assigned` — conditional cascade (exact):**

- If no payment terminal is assigned, STORIS checks the **Credit Card module type** being used at the selling location.
  - If the credit card module type is **EMV Tender Retail** → "STORIS allows the process to continue expecting that a payment terminal will be assigned later."
  - If the credit card module type is **EMV Shift4** → STORIS checks the account for use of a **Local UTG**.
    - **Local UTG** in place → apply the `No Terminal Assigned` rule.
    - **Network UTG** in place → allow the process to continue, expecting a terminal to be assigned later.

**`Communications Failure` — conditional cascade (exact):**

- At the point where STORIS begins the signature process with the payment terminal, it **re-checks** for a
  terminal associated with the session. **"At this point one is required."**
  - No terminal associated with the session → apply the `Communications Failure` rule.
  - Terminal found → attempt to communicate. If communications fail → apply the `Communications Failure` rule.

**Dependencies.**

- *General System Control Settings* — `CFG-DOCSIG-LICENSED` (module licence/active).
- *Warehouse/Store Location Settings* — `CFG-LOC-SIGCAP-ENABLE`.
- `ACCT-001` Configure Document Archive (Export Path, archived form selection).
- `ACCT-004` Signature Audit Settings (via global Actions).
- *Extended Receivables Insurance Code Settings* → `Request Signature` per insurance code.
- *Financing Payment Plan Settings* → `Charge Text`.
- *Text Field - Language Translation Entry* (multilingual `Prompt Text` / `Additional Text`).
- Payment terminal vendors: **Shift4**, **Tender Retail** (proprietary signature formats); UTG topology
  (Local vs Network) for Shift4.

**Build notes.**

- **The unsigned-PDF-still-archived behavior must not be reproduced as-is.** In our ERP the archived artifact
  must record `signature_status` in the *document record and on the rendered PDF face*:
  `SIGNED` | `UNSIGNED_NO_HARDWARE` | `UNSIGNED_SKIPPED` | `UNSIGNED_CANCELLED` | `UNSIGNED_TIMEOUT`.
  A delivery receipt with no signature must be visually and queryably distinct from a signed one, or the
  archive is useless in a chargeback or a delivery dispute.
- **Store signatures in an open format, not a vendor blob.** STORIS keeps the vendor's proprietary encoding
  (Shift4/Tender Retail). Capture and normalise to a stroke vector (timestamped point array) plus a rendered
  PNG, and keep the raw vendor payload alongside for provenance. If we ever swap terminal vendors, a folder
  of proprietary blobs is unreadable evidence.
- **Bind the signature to the document cryptographically, not by filename.** Our `signature` record should
  carry `document_id`, `document_content_hash` (the hash of the exact PDF bytes the customer saw),
  `captured_at`, `device_id`, `user_id`, `location_id`, `terminal_serial`, `reason`. Then "did the customer
  sign *this* version of the agreement" is answerable. STORIS's "temporarily stores it until needed for
  printing" model cannot answer that.
- Keep the four failure-mode rules, keep the exact three-option enum — it is a good model — but **default
  `Signature Required` to ON for financing paperwork and delivery receipts**, opposite to STORIS's default of
  blank/skippable.
- Keep the `Reason` dimension (`Authorized Finance`, `Terms and Conditions`) — it is what lets one document
  need multiple distinct signatures. Model as `document_signature_requirement (program, document_type,
  reason)` with a unique key on the triple.
- Implement the **re-authorization trigger** verbatim: a finance plan that already has an authorization
  number and receives a **new** authorization number counts as modified and must re-prompt. This is the rule
  that keeps the signed agreement matching the actual financed amount.
- 72-character `Prompt Text` cap is a terminal constraint, not a business one — store the full text and
  truncate at render, with a preview showing the target device's real width.
- `[DECISION NEEDED]` — Which of our documents are `Signature Required = Yes` (no skip)? Recommended
  starting set: delivery receipt / proof of delivery, financing agreement, credit application, protection-plan
  (insurance) form, return authorization. `[DECISION NEEDED]` — do we allow a manager override to skip, and
  is that override itself audited?
- `[DECISION NEEDED]` — Signature capture hardware direction: STORIS binds signatures to the **payment
  terminal**. For delivery receipts LA Mattress signs on a **driver's tablet**, off the payment path
  entirely. Our model must treat "signature device" as a first-class concept independent of the payment
  terminal, or delivery-receipt signing will not work.

---

### `ACCT-003` Signature Audit Inquiry
*storis_ref: article 15201527971732*

**Purpose.** Query screen over the signature-audit log: shows every occasion on which a signature capture
opportunity was *presented* (or should have been presented) for a document, and what happened. **This is the
"we offered, they declined / the terminal died" evidence trail** — its value is explicitly legal.

**Where it lives.** The article's Access block gives no textual menu path (a menu graphic only). Help-center
breadcrumb: `System Administration > Account Setup > Signature Audit Inquiry`. Data only exists if enabled in
*Signature Audit Settings* (`ACCT-004`).

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Reference` | Free text | Reference identifier of the transaction. **Leave null to retrieve all references. Partial match is a "contains", not a prefix:** "entering '348' retrieves 348567, 273486, 654348". |
| `Document Type` | Select | Restricts results to one transaction type. **`None Selected` includes all document types.** |
| `Location` | Multi-select | Warehouse/store location. One, multiple, or all. **"To select all locations, choose 'No Locations Selected'."** Action button → *Multiple Location Selection Window*. |
| `Start Date` | Date (calendar picker) | **Default is 30 days prior to today's date.** |
| `End Date` | Date (calendar picker) | Default paired with Start Date. |
| `Search` | Button | Populates the grid with results. |

**Behavior & rules.**

- **If both date fields are null, a confirmation prompt appears with exact text: `'No dates have been
  selected so this report will take time to run. Continue?'` — the user must select either `Yes` or `No` to
  continue.**
- Null `Reference` = all references; **partial reference is a substring match anywhere in the identifier**
  (a real gotcha — it will over-return).

**Grid columns**

| Column | Notes |
|---|---|
| `Reference` | Matching reference identifiers. |
| `Date` | Date the signature capture opportunity occurred. |
| `Time` | **"The time in milliseconds (i.e. HH:MM:SS.mmm) that the transaction occurred."** |
| `Location` | Where the opportunity was presented to the customer. |
| `Document Type` | Full name of the transaction type that offered the opportunity. |
| `Result` | See enum below. |

**`Result` enum — exactly these six values and their exact meanings:**

| Value | Meaning (verbatim) |
|---|---|
| `Signature Captured` | "Signature capture presented to customer and successfully captured." |
| `Cancelled` | "Signature capture presented to the customer but cancelled by customer." |
| `Communications Error` | "Signature capture not presented to customer due to hardware issue." |
| `Not Enabled at Location` | "Signature capture not presented to customer because signature capture is not set up." |
| `Timed Out Waiting for Signature` | "Signature capture presented to customer but timed out." |
| `Miscellaneous Error` | "An error occurred that falls outside of the other result options." |

**Dependencies.**

- `ACCT-004` Signature Audit Settings — **no data exists unless `Enable Signature Audit` is checked.**
- `ACCT-002` Configure Document Signature Capture — determines when an opportunity arises at all.
- *Multiple Location Selection Window*.
- STORIS Data Warehouse — the same data feeds DW audit-trail reports.

**Build notes.**

- Reproduce this as an **append-only `signature_audit_event` table**: `id`, `reference_no`, `document_type`,
  `location_id`, `occurred_at` (timestamp with **millisecond precision** — STORIS explicitly stores ms and we
  need it to order retries within one ceremony), `result` (the six-value enum, kept verbatim), plus fields
  STORIS lacks and we want: `user_id`, `device_id`, `terminal_serial`, `attempt_no`, `error_detail`,
  `document_content_hash`.
- **Add `user_id` and `attempt_no`.** STORIS's grid cannot answer "which associate was at the terminal" or
  "was this the third retry" — both are the first questions asked in a delivery or financing dispute.
- The `Not Enabled at Location` result is worth a **standing exception report**: it means a store is silently
  producing unsigned paperwork because of a config gap. Alert on it rather than waiting for someone to run
  an inquiry.
- Make `Reference` search **prefix + exact by default with an explicit "contains" toggle**. STORIS's implicit
  substring match on a high-volume table is both slow and confusing.
- Enforce a date range: keep the 30-day default, but **replace the "this will take time, continue?" prompt
  with a hard maximum window** (say 400 days) plus an async export for anything larger.
- `[DECISION NEEDED]` — Is this inquiry customer-scoped as well as reference-scoped? A right-to-erasure
  request (`PURGE-001`) will ask "show me everything you hold about me"; a reference-only audit log is hard
  to answer that with. Recommend also storing `customer_id` — and then deciding whether that field is
  scrubbed on erasure (see `PURGE-001`).

---

### `ACCT-004` Signature Audit Settings
*storis_ref: article 15201512337044*

**Purpose.** Two global switches controlling whether signature-ceremony audit data is written at all, and how
long it is kept before a scheduled purge removes it.

**Where it lives.** `Configure Document Signature Capture > global Actions button > Signature Audit Settings`

**These settings are global — "not specific to any Program + Document combination."**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Enable Signature Audit` | Checkbox | "Check this box to allow signature capture ceremony data to be retained in STORIS. Retained data can be inquired upon via the Signature Audit Inquiry." |
| `Audit Data Retention Days` | Numeric **0–999**, or null. **Default: null.** | Days the data is retained on the STORIS server before being purged as a scheduled process via **the "Purge of Signature Audit file" process in *Schedule a Process***. **"If null, data is not purged and will remain in the STORIS database."** |

**Behavior & rules.**

- **Enabling this writes a row to the STORIS database every time a signature capture ceremony *has the
  potential to be presented* to the customer** — not only when one is actually captured. That is the point:
  "The capture of this data includes scenarios where the signature capture ceremony was cancelled or
  otherwise interrupted, **which may prove useful for legal purposes**."
- The data is the basis for both `ACCT-003` and **STORIS Data Warehouse reports** demonstrating the audit
  trail of available signature ceremonies and what occurred during them.
- **Purging is not automatic on save — it happens only when the *Purge of Signature Audit file* process is
  actually scheduled and runs.** Setting a retention day count with no scheduled process purges nothing.
- **Default of null means unlimited retention.** Safe for evidence, unsafe for a data-minimisation posture.

**Dependencies.**

- `ACCT-002` (parent screen, reached via its global Actions button).
- `ACCT-003` (consumer of the data).
- *Schedule a Process* → `Purge of Signature Audit file`.
- STORIS Data Warehouse.

**Build notes.**

- Keep the audit-on-opportunity semantics exactly: **log the opportunity, not just the capture.** The absence
  of a signature with a logged reason is far more defensible than an absent row.
- **Do not make retention a single global number.** Retention must be per document class, because a
  delivery-receipt signature and a financing-agreement signature have different legal lives. Model
  `retention_policy(document_class, retain_days, legal_hold_flag)`.
- **Never allow null-means-forever as the default.** Default to an explicit, documented retention period and
  require a named approver to set "indefinite". Conversely, **never allow a retention purge to delete audit
  rows attached to an open dispute or legal hold** — add a `legal_hold` flag checked by the purge job.
- Retention purge must itself be audited: what was purged, how many rows, by which job run, under which
  policy version.
- `[DECISION NEEDED]` — Retention window for signature audit data. It interacts directly with `MIG-030`
  (10+ year mattress warranty lookback) and with `PURGE-001`. If a customer returns a mattress under warranty
  in year 9, do we still need the year-1 delivery-receipt signature? Probably yes.
- `[DECISION NEEDED]` — Does the signature audit log survive a PII erasure request? See the conflict block in
  `PURGE-001`.

---

## Purging Data — `PURGE-*`

### `PURGE-001` Remove a Customer's Personal Information
*storis_ref: article 15201512686484*

**Purpose.** The right-to-erasure routine. Removes a customer's personally identifiable information (PII)
from their STORIS customer record on request. **It does not delete the customer account, and it does not touch
transactional history.**

**Where it lives.** The article's Access block shows a menu graphic with no textual path. Help-center
breadcrumb: `System Administration > Purging Data > Remove a Customer's Personal Information`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Customer Number or Last Name or Email or Phone Number` | Text / search | Enter the customer code if known, or last name / email / phone. **If last name, email or phone number are entered, the *Search for a Customer* process opens** to select the proper customer code. A search icon gives direct access to *Search for a Customer*. **"NOTE: A new customer cannot be created using this process."** |
| `Primary Name` | Read-only | Billing-address information, populated once a customer code is entered. |
| `Primary Email` | Read-only | " |
| `Home Phone` | Read-only | " |
| `Cell Phone` | Read-only | " |
| `Work Phone, Extension` | Read-only | " |
| `Address 1` | Read-only | " |
| `Address 2` | Read-only | " |
| `City, State, Zip` | Read-only | " |
| `Removal Prohibited Reasons` | Read-only, multi-value | "This field populates reasons why a customer's PII cannot be removed. **If a reason exists, the Save button is inactive.**" |

The read-only block exists so staff can **compare the customer's physical ID against the STORIS record**
before erasing. **"It is up to the retailer to verify the customer's identity to ensure the removal request
is valid. Additionally, it is up to the retailer to decide if information should be removed."** — STORIS
takes no position on lawfulness; the retailer owns the decision.

**Actions menu** (read-only review of the customer before erasing):

- `Advanced Customer Settings` — **inquiry mode only**
- `View a Customer's Activity`
- `View All Installment Activity for a Customer`
- `View All Revolving Plan Activity for a Customer`

### What it removes — exact, and only this

On **Save**, the customer's information is removed and:

| Element | What happens |
|---|---|
| Customer **first and last name** | **changed to the literal string `"REMOVED"`** |
| **Billing address line 1** | **changed to `"REMOVED"`** |
| **Billing address line 2** | **cleared** |
| **Billing city, state, zip** | **NOT changed — "not changed for reporting purposes"** |
| **Phone numbers** (home, cell, work + extension) | **cleared** |
| **Email addresses** | **cleared** |
| Contact permission | "The customer is updated to prohibit further contact." |
| `Okay to Solicit` in *Advanced Customer Settings* | **automatically unchecked** |
| Customer Activity Log | **comments are added indicating PII was removed** |

### What it retains

- **The customer account itself. "Note that this does not delete the customer account from STORIS."**
- **City, state and ZIP — deliberately retained "for reporting purposes."** *(Worth flagging: a retained
  city/state/ZIP plus retained full order history is, in many privacy regimes, still indirectly identifying.
  STORIS is choosing analytics continuity over full anonymisation.)*
- **All transactional history** — orders, deposits, installment activity, revolving plan activity, activity
  log. Nothing in the article says any transaction, document, or archived PDF is touched.
- **Referential integrity is preserved by design:** the customer code is unchanged, so every foreign key from
  sales orders, deposits, contracts, and the activity log still resolves. **This is a field-level scrub of the
  customer master record, not a delete and not a cascade.**

### Reversibility and audit trail

- **The article describes no undo.** The routine overwrites name and address line 1 in place with `"REMOVED"`
  and clears phones/emails. **Treat as irreversible.**
- **Audit trail = comments appended to the Customer Activity Log** stating that PII was removed. That is the
  only stated record. **It does not state that the removed values are retained anywhere, nor that the
  requesting user, timestamp, or the reason for removal is recorded** — a real gap for proving compliance
  later.

### Scope: one customer code only

**"If multiple customer accounts exist for the customer, this process addresses only the specific customer
code entered here. Other accounts associated with the customer are not modified."**

**"Consider merging customer accounts prior to removing personal information."** — this is the direct link to
`IMP-001` / the duplicate-customer-merge family. **A right-to-erasure request against a customer with
duplicate accounts will silently under-deliver unless the duplicates are merged first.**

### Removal Prohibited Reasons — the exact blocking list

If any of these is true, `Save` is inactive and PII is not removed:

1. Customer has an **open-item balance**.
2. Customer has a **revolving finance account(s)**.
3. Customer has an **installment contract(s)**.
4. Customer has a **deposit(s) on open order(s)**.
5. Customer has an **open order(s)**.
6. Customer has an **open shopping cart(s) that has their associated customer code**.
7. Customer has been **charged off**.
8. Customer has **unpaid 3rd party finance items**.
9. Customer has an **AP Bill for refund**.

**Every one of these is a live financial relationship.** The design principle is explicit: *erasure is blocked
while money is in flight in either direction.*

**Dependencies.**

- *Advanced Customer Settings* → `Okay to Solicit` flag (also the customer master this routine writes to).
- *Search for a Customer*.
- *Customer Activity Log* / *View a Customer's Activity*.
- *View All Installment Activity for a Customer*, *View All Revolving Plan Activity for a Customer*.
- **Personally Identifiable Information (PII) Overview** (article `15201512686228`) — the governing topic;
  **not fetched by this agent, see follow-ups.**
- *Solicitation of Customer Information* (article `15297965125140`).
- Duplicate Customer Merge family — `IMP-001`, *Manage Customer Merge List*, *Duplicate Customer Merge Overview*.
- Open-order / AR / shopping-cart subsystems (the nine blocking checks).

**Build notes.**

Our ERP needs an erasure routine, and the STORIS shape is broadly right, but it is under-specified in three
places that matter to us: identity, documents, and evidence.

**1. Keep the architecture: scrub, don't delete.**
Erasure must be a **field-level redaction of the customer master with the customer key preserved.** Do **not**
cascade-delete and do **not** re-key. Sales history, warranty entitlement, accounting postings, commission
records, and inventory movement all hang off `customer_id`; breaking that key is how you corrupt the general
ledger. Implement as an `UPDATE customer SET ...` inside one transaction plus an audit write, never a `DELETE`.

**2. Redact tokens must be typed, not the bare string `"REMOVED"`.**
STORIS writes the literal `"REMOVED"` into `first_name` / `last_name` / `address_1`. That collides with real
data, breaks name search, and is indistinguishable from a data-entry error. Use a nullable
`pii_redacted_at` timestamp + `pii_redaction_id` on the customer row and render a display name of
`[Redacted customer 000123]` at the presentation layer. Keep the underlying columns **NULL**, not sentinel text.

**3. Decide the document question STORIS ducks entirely.**
The article says nothing about archived PDFs (`ACCT-001`), captured signatures (`ACCT-002`), or the signature
audit log (`ACCT-003`/`ACCT-004`). **Those artifacts contain the customer's name, address, and a biometric-
adjacent signature image, and they sit in a 3rd-party archive folder outside the database.** A scrub of the
customer master leaves every one of them intact. For us:
   - The `document_archive` table must carry `customer_id` so erasure can *enumerate* affected documents.
   - Define a `retention_class` per document type. Documents under a statutory retention duty (financing
     agreements, tax-relevant receipts, signed delivery receipts within the warranty window) are
     **suppressed from customer-facing access and flagged, not destroyed**. Documents with no such duty are
     destroyed.
   - Record the outcome per document, so we can tell the customer precisely what was removed and what was
     lawfully retained and why.

**4. What accounting and history must survive, explicitly.**
Erasure must never touch: order headers/lines, prices, taxes, payments, GL postings, AR aging, commission
records, inventory transactions, delivery events, or serial/warranty registration keys. Only the
*person-identifying attributes on the customer master and its contacts* are in scope. Warranty lookback must
continue to work off `customer_id` + product + purchase date, **not** off name matching — otherwise erasure
silently destroys warranty entitlement.

**5. Delivery addresses, not just billing.**
STORIS scrubs the **billing** address only. We hold ship-to addresses on orders and on delivery manifests.
Those are PII too. **Decide explicitly** whether historical ship-to addresses on completed orders are scrubbed
(breaks "where did we deliver this mattress" for warranty service) or retained.

**6. Real audit trail, better than an activity-log comment.**
Write an immutable `pii_erasure_request` record: `request_id`, `customer_id`, `requested_at`,
`identity_verified_by` (user), `verification_method`, `approved_by`, `executed_at`, `fields_scrubbed[]`,
`documents_suppressed[]`, `documents_retained_with_reason[]`, `blocking_reasons_at_request[]`, `policy_version`.
**Do not store the erased values in it.** This record is what proves compliance; a free-text comment is not.

**7. Keep the nine blocking reasons, extend them.**
Adopt all nine verbatim as a starting rule set. Add for LA Mattress: **open warranty claim**, **open delivery
or service ticket**, **open return/RTV**, **active protection plan**, and **legal hold**. Show all blocking
reasons at once (STORIS does) rather than one at a time.

**8. Multi-account: do not repeat STORIS's silent partial erasure.**
STORIS erases exactly one customer code and says "consider merging first." That is a compliance hazard — the
retailer believes the request is satisfied while duplicate records still hold the customer's name, phone, and
email. **Our routine must run duplicate detection (phone/email/name+address) at request time and either
require the merge first or fan the erasure across all matched accounts, with the matched set recorded in the
audit record.**

---

#### `[DECISION NEEDED]` — Erasure vs. `MIG-030` 10-year warranty history retention

**This is a genuine conflict between two of our own requirements and it does not resolve itself.**

- **`MIG-030` (Inventory pack, cutover plan) requires** that we migrate and keep completed sales history —
  customer, order number, date, product codes, quantities, prices, delivery date, warranty terms — **for a
  lookback window covering the longest return/warranty obligation, and mattress warranties run 10+ years.**
  The stated reason: a customer walks in with a mattress bought years ago and expects a warranty exchange.
  `MIG-030` explicitly requires **both** migrated history **and** `RTN-010`/`RTN-012` no-original-document
  returns gated by `SEC-RTN-NOORIG`.
- **`PURGE-001` requires** that on a valid request we erase the customer's name, address, phone, and email.

The collision is concrete, not theoretical:

1. **Warranty lookback is customer-identified.** A 10-year mattress warranty claim is proven by matching a
   person to a purchase. If we erase name, address, phone and email, **the customer who exercised erasure in
   year 3 cannot be found by name in year 9** — and `SEC-RTN-NOORIG` (return with no original document)
   becomes the only path, which is exactly the loss-prevention hole `RTN-011` exists to monitor.
2. **STORIS's own compromise is telling but insufficient** — it retains city/state/ZIP "for reporting
   purposes" and never touches order history at all. So STORIS effectively resolves the tension by
   *retaining almost everything*. That is a defensible legal posture only if it is a **deliberate,
   documented** one. Ours must be deliberate too.
3. **`ACCT-004`'s null-default retention (keep signature audit forever) points the other way** from a
   data-minimisation posture, and nothing currently reconciles the two.

**The decision LA Mattress must make, explicitly:**

- **(a)** Does a warranty obligation count as a **legitimate basis to retain** identifying data past an
  erasure request — i.e. does "open/latent warranty entitlement" join the nine `Removal Prohibited Reasons`
  as a **tenth blocker**, or as a **retain-with-reason exception** that scrubs marketing contactability
  (phone, email, solicitation) while preserving name + purchase linkage for warranty service?
- **(b)** If we go with the exception, **what is the minimum retained set**? Recommendation to evaluate:
  retain `customer_id`, surname, ZIP, and the order/product/date/warranty-term record; erase email, phone,
  street address, marketing profile, and all solicitation flags. This keeps warranty lookback workable while
  removing every contactability channel.
- **(c)** What happens at **warranty expiry** — does the retained residue auto-purge when the last covered
  product's warranty lapses (requires a scheduled re-evaluation job keyed off `warranty_end_date`)?
- **(d)** Do **archived signed delivery receipts** (`ACCT-001`) fall under the same warranty-retention
  exception? They are the strongest proof of delivery date, which is what a warranty clock runs from.
- **(e)** Who signs this off — this is a legal determination, not an engineering one. **The build should not
  proceed on either erasure or the `MIG-030` retention window until counsel has ruled.**

**Engineering consequence either way:** the erasure routine must be built with a **policy layer**
(`retention_policy` + `retain_with_reason` outcomes per data element) rather than a hard-coded field list, so
that whichever way (a)–(e) land, we change configuration and not code.

---

## Importing Data — `IMP-*`

### `IMP-001` Import Customer Merge Information
*storis_ref: article 15201528157972*

**Purpose.** Bulk-loads a list of duplicate-customer → merge-target pairs from a file, setting those customers
to *pending merge* status. It does **not** perform the merge; it only populates the merge queue.

**Where it lives.** The article's Access block gives no textual menu path (menu graphic only). Help-center
breadcrumb: `System Administration > Importing Data > Import Customer Merge Information`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Filename` | Text (path) + Actions button | "Enter the path on your PC from where your customer information is to be imported; the extra Actions button opens the file explorer from which a file can be selected." |

**File format (hard rules).**

- **"The conversion spreadsheet to be imported is a text tab delimited or csv format."**
- **"A duplicate customer ID and Merge To customer ID must be in each row."**
- **"The duplicate customer ID and the Merge To customer ID must both be valid customers defined in
  Advanced Customer Settings; as such, null customer IDs and null Merge to customer IDs are not allowed."**

**Behavior & rules.**

- The import sets customers to **pending** merge status. **Pending customers are then processed using
  *Manage Customer Merge List* or the *Merge Customer* process in *Schedule a Process*.** The import alone
  merges nothing.
- **"An error report is generated after all customers are processed, containing the duplicate customer ID,
  Merge To customer ID, and the error description."** — i.e. **processing continues past errors; it is not
  all-or-nothing.** Valid rows are staged, invalid rows are reported.

**Dependencies.**

- *Advanced Customer Settings* — validation source for both customer IDs.
- *Manage Customer Merge List* (article `15201512538772`) — where pending merges are worked.
- *Merge Customer* process in *Schedule a Process*.
- *Duplicate Customer Merge Overview* (article `15201528158996`) — the governing topic.
- *Import Data* / *Import Data Overview* (listed as related articles).
- **`PURGE-001`** — the PII removal routine explicitly advises merging accounts **before** erasure.

**Build notes.**

- Model this as a **staging + review pipeline**, which is what STORIS effectively does: `merge_candidate`
  rows with `status` in (`PENDING`, `APPROVED`, `MERGED`, `REJECTED`, `ERROR`), never a direct-apply import.
  Customer merges are destructive and near-impossible to unwind; a queue with human review is the correct
  shape and we should keep it.
- **Validate on ingest and report per row** — same as STORIS: process all rows, produce an error report with
  `duplicate_customer_id`, `merge_to_customer_id`, `error_description`. Add `row_number` and the raw line, so
  a 5,000-row file is actually fixable.
- Additional validations STORIS does not mention but we need: **self-merge** (`duplicate == merge_to`),
  **cycles** (A→B and B→A), **chains** (A→B, B→C — resolve to the terminal target or reject), **duplicate
  rows**, and **merge target already pending as a duplicate elsewhere**.
- **Blockers must mirror `PURGE-001`.** A customer with an open order, deposit, installment contract,
  revolving account, or charge-off should not be silently merged away. Reuse the same blocking-reason
  evaluator for both routines.
- **The merge itself needs its own reversibility story**, which neither article provides. Snapshot both
  customer records and the full list of re-pointed foreign keys into an `merge_audit` record before applying,
  so an erroneous merge can be unwound. **STORIS gives no undo — we should.**
- Replace "path on your PC" with a proper upload. A per-workstation file path is a non-starter for a
  browser-based ERP and is a data-handling risk (customer lists sitting on store PCs).
- Accept CSV and tab-delimited as STORIS does; require a header row and validate column names rather than
  relying on positional columns.
- `[DECISION NEEDED]` — Is merge available to store staff or head-office only? Recommend head-office /
  data-steward role with a dedicated permission (`SEC-CUST-MERGE`), given the blast radius and its
  interaction with erasure requests.
- `[DECISION NEEDED]` — When two merged customers have conflicting PII-erasure states (one erased, one not),
  which wins? Recommend: **erased state is sticky and propagates to the surviving record.**

---

## Cross-cutting summary of new requirement IDs proposed

| ID | Meaning |
|---|---|
| `CFG-DOCARC-LICENSED` | Document Archive module licensed + active (General System Control Settings) |
| `CFG-DOCSIG-LICENSED` | Document Signature Capture module licensed + active (General System Control Settings) |
| `CFG-LOC-SIGCAP-ENABLE` | Per-location `Enable Document Signature Capture and Document Archive` (Warehouse/Store Location Settings) |
| `CFG-SIGAUDIT-ENABLE` | `Enable Signature Audit` global switch (`ACCT-004`) |
| `CFG-SIGAUDIT-RETAINDAYS` | `Audit Data Retention Days`, 0–999 or null (`ACCT-004`) |
| `SEC-CUST-PII-REMOVE` | Permission to execute `PURGE-001` (proposed — STORIS article does not name one) |
| `SEC-CUST-MERGE` | Permission to import/approve customer merges (proposed) |
