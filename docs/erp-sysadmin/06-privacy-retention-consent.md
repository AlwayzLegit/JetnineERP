# 06 — Privacy, Retention, and Consent

Three findings here rise to the level of legal exposure, and one of them is a direct conflict with a
requirement already in the Inventory handoff pack. **None of this should be built without counsel review.**

---

## PRIV-001 — The PII inventory is much wider than the erasure routine covers

PII-bearing fields found across Customer Settings: **SSN, SSN last-4, date of birth, driver's licence, all
phone numbers, all email addresses, tax IDs, finance account numbers, eSTORIS password, card tokens, credit
and fraud scores, and customer attachments.**

What `PURGE-001` ("Remove a Customer's Personal Information") actually does:

- Overwrites **name** and **billing address line 1** with the literal string `"REMOVED"`.
- Clears address line 2, phones, emails.
- **Deliberately retains city, state and ZIP** — *"for reporting purposes"*.
- Leaves the account and **all transactional history untouched**; the customer code is preserved so foreign
  keys still resolve.
- **No undo.** Audit trail is a single Customer Activity Log comment — **no requester, no timestamp, no
  reason.**
- **Only touches the one customer code entered.** Duplicates are untouched — the article's own advice is
  "consider merging first". That is **silent partial compliance** with an erasure request.
- Nine hard `Removal Prohibited Reasons`, all live-money conditions: open balance, revolving, installment,
  deposit on open order, open order, open cart, charged off, unpaid third-party finance, AP bill for refund.

**It is a field-level scrub, not a deletion, and it misses most of the PII inventory above.**

Related findings: **PII masking applies only on re-access** — the person who typed the SSN keeps seeing it.
**`CUST-041` silently transmits a stored SSN last-4 to Synchrony when the field is left blank.**
`CUST-042` and `CUST-043` **contradict each other** on whether debit PANs are stored.

## PRIV-002 — **Erasure conflicts with `MIG-030`. This needs a decision before either is built.**

The Inventory pack requires retaining sales history for a lookback window covering the longest warranty
obligation — mattress warranties run 10+ years — so that a customer can walk in years later and get a
warranty exchange (`RTN-010`, `RTN-012`, `MIG-030`).

Warranty entitlement is **customer-identified**. Erasing name, address, phone and email in year 3 makes the
year-9 claim findable only through the no-original-document path — which is precisely the loss-prevention
hole `RTN-011` exists to monitor.

**`[DECISION NEEDED]`** — the options, laid out for counsel:

1. Add **warranty entitlement as a tenth blocking reason**, refusing erasure while an active warranty exists.
2. A **retain-with-reason exception**: erase contact data, retain a minimal identity tuple under a documented
   legitimate-interest basis, with its own retention clock.
3. **Auto-purge at warranty expiry** — erasure scheduled rather than refused.
4. Define the **minimum retained set** that still supports a warranty claim.

Sub-questions that also need answering: do signed delivery receipts fall under erasure? Are historical
ship-to addresses scrubbed? What is the merge permission scope, and which state wins when an erased record
is merged with a live one?

## PRIV-003 — **Consent capture does not exist. Anywhere.**

Confirmed across **all 137** Customer Settings articles: there is **no consent capture** — no channel, no
state, no timestamp, no source. `CUST-089` `Method of Contact` and `CUST-086` `Marketing Code` are
*attribution*, not consent. `CUST-124` is the inverse — a prohibition on soliciting PII — and it
**deletes its own compliance stamp on re-edit**.

Meanwhile the system actively drives outbound contact: birthday campaigns (`CUST-127`), `CUST-112`,
`CUST-118`, and `CUST-131`'s "tickle to call the customer" — all ungated.

**TCPA exposure is $500–$1,500 per text, and the burden of proving consent is on us.**

**Requirement `PRIV-010`:** an append-only `consent_event` model — channel (voice / SMS / email / mail),
state (granted / revoked), timestamp, source (where and how it was captured), capturing user or system,
and the exact disclosure text version presented. Never overwritten. Every outbound campaign resolves
current consent from the event stream at send time, and records which consent event authorized each send.

## PRIV-004 — Attribution is overwritten, destroying history

`Referred By`, user-defined survey responses, `Credit Source`, lead stage, legal codes, and demographic
answers are all **overwritten per customer**. Marketing attribution history simply does not exist.

**Requirement:** append-only throughout. Current value is a projection of the latest event.

## PRIV-005 — Addresses have no versioning

Billing plus one primary delivery plus a ship-to list, **no history**. Combined with magic strings
(`"No Address Required"`, `"REMOVED"`) that will poison geocoding, and `USR-035`'s behavior where **changing
a customer's ZIP silently clears their phone numbers** if the masks don't overlap.

For a business with a 10-year warranty tail, "where did we deliver this in 2019" is a question we will be
asked. Version addresses.

## PRIV-006 — Encryption is not a setting

`SCS-038` / `SCS-086`: unchecking an encryption checkbox **bulk-decrypts every stored SSN, DOB and driver's
licence** via a background phantom. `Encrypt Customer Password` unchecked stores eSTORIS passwords **in
plaintext**. `SCS-086` also instructs users to enter **fake tax IDs** (`999999`).

Ours: encryption at rest is architectural and always on. There is no checkbox. Passwords are hashed, never
encrypted, never recoverable.

## PRIV-007 — Password policy: do not port it

STORIS: **uppercase alphanumerics only**, max length **10** per one article and **50** per another (the
articles contradict each other), 6 failed logins → 30-minute auto-clearing lock, permanent lock manual only.

Ours: recommend **IdP / SSO** (see `08-open-decisions.md`), or failing that, modern password rules —
full character set, generous length, breach-list screening, no composition rules, rate limiting.

## PRIV-008 — Retention policy is currently emergent, not chosen

Retention today is the accidental sum of ~20 scattered `Number of Days` fields, several of which destroy
data when left blank (`SET-002`). That is not a policy.

**Requirement:** one declared retention policy per data class — transactional, financial, PII, audit,
attachments, signatures — with a stated legal basis and a documented retention period, implemented as
scheduled scoped jobs (`JOB-004`), never as a side effect of a blank field. Recommend a **7-year** floor for
financial and audit data and a **warranty-life** floor for sales history, pending `PRIV-002`.

## PRIV-009 — Document archive and signatures

From `ACCT-001`–`ACCT-004`:

- **Unsigned PDFs are archived anyway.** With no signature hardware present, STORIS still generates and
  files the PDF — **file-level indistinguishable from a signed one.** This is the single worst defect found
  in the whole section: it makes the archive useless as evidence.
- Archive uniqueness is **filename-based only** (`DocumentType_Reference#_MMDDYY_HHMMSS_ms.PDF`) — no key,
  silent collisions and overwrites.
- STORIS is **not the repository**: it renders a PDF to a PC folder path for a third-party sweeper.
- Signatures are stored in the **payment vendor's proprietary format** (Shift4 / Tender Retail) and only
  "temporarily", until print or archive.
- **Signatures are bound to the payment terminal** — which **breaks delivery receipts**, where the signature
  is captured on a tablet in the customer's home.
- `Signature Required` defaults to **blank = skippable**. `Audit Data Retention Days` defaults to **null =
  never purged**, and only purges if the job is actually scheduled.

**Requirements:** signed and unsigned documents must be **structurally distinguishable**; documents get real
content-addressed identifiers, not filenames; signatures are bound to the **document**, not the terminal,
and stored in an open format; the archive is a first-class store we own; retention is per document class.
