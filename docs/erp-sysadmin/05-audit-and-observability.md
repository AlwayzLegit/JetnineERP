# 05 — Audit and Observability

**The question "does STORIS have an audit log" took four agents to settle. The answer is: no general log,
five disjoint partial trails, and every one of them has a disqualifying flaw.**

That makes this file a *design* spec, not a parity spec. We are building something STORIS does not have.

---

## What STORIS actually has

| Trail | Covers | Disqualifying flaw |
|---|---|---|
| `Report Secured Decryption Activity` (`SAR-024`) | Secure-data unmasking only (types `CA`/`CC`/`FR`/`SS`) | Scope is four data types |
| `Track Settings Activity` (`USR-036`) | Settings changes, opt-in | **Turning auditing off deletes all its records.** Per-file/all-attributes, never per-attribute |
| `Review Settings Activity` (`SYS-067`) | Reading the above | **No date field** — you must already know the file *and* the record key. **Output is Screen/Printer only — not exportable** |
| `Track Processing Activity` (`CUST-135`) | Field-level before/after, opt-in | **Only nine transactional files** (Order, PO, AP Bill, Special Order). Customer master, settings, security and pricing are unaudited |
| `STORIS Log` / `Customer Activity Log` (`SYS-059`) | Assorted events | Free-text comments, not structured data |

And the killer, `SYS-085`: **`Audit Comment` is a translatable template string.** Audit entries are
localized prose, not data. You cannot reliably query them.

## Things that happen with no audit trail at all

Each of these is a real finding from the source, and each is a hole we must not reproduce:

- **`Receive a PO with a Separate Freight Bill — Override Freight Amount`**, verbatim: *"Use of this
  security override is not recorded."* An unlogged override on a money field.
- **`Override Legal Code Allow Payments Setting`** — an unlogged compliance bypass.
- **Product replacement cost rewritten** from purchase-entry and vendor-invoice screens with no exception
  and no audit (see `C9`).
- **`Reset User Members`** mass-overwrites every group member's permissions with no preview and no undo.
- **Customer PII erasure** (`PURGE-001`) records **no requester, no timestamp, no reason** — only a comment
  in the Customer Activity Log.
- **`Store Assignment`** on the customer moves cost-center and AR balances between stores — an untraceable
  inter-store revenue transfer (`CUST-063`).
- **Merge is a status field, not an event** (`CUST-004`): `Merge Details — Status / By / Merge To`, with **no
  timestamp and no before-image**.
- **`Run as User`** accepts any user ID and stamps that identity into audit comments and report `Creator`
  fields — **free impersonation that makes the log actively misleading**. Compounded by users having two
  identifiers (`Logon ID` ≠ `User ID`).
- **`SYS-047`**: a third-party routing application writes customer addresses back into the ERP over a file
  path, unaudited.

---

## `RPT-AUDIT` — what we build instead

### AUD-001 Single append-only audit stream
One structured event store covering **every** mutation: transactional data, master data, settings,
permissions, jobs, and privileged reads. Not opt-in. Not per-file. Not deletable — including by the person
who could turn it off.

Event shape: id, timestamp (UTC), business date, actor (real user, never an impersonated identity), acting-
as (when impersonation is in play — recorded *separately*, never substituted), source (UI / API / job /
integration / import), entity type, entity id, field, before value, after value, permission exercised,
override used, reason, correlation id.

### AUD-002 Structured, not prose
Values are typed data. No template strings, no localized sentences. Rendering is a presentation concern.

### AUD-003 Privileged reads are events
Borrowed from `SAR-024`, which gets this right: **unmasking a secure field is an event**, and it records
**two actors** — `Requested By` and `Granted By` (the same id when self-authorized). Extend that to every
PII read, cost view under `SEC-COST-VIEW`, and export.

### AUD-004 Denials are events
Also from `SAR-024`. A denied permission attempt is logged. Denial patterns are a loss-prevention and
insider-threat signal — and the Inventory pack's `RPT-RTN-NOORIG` monitoring depends on exactly this.

### AUD-005 Overrides always logged
Every permission override, every guard bypass, every out-of-tolerance acceptance. **There is no such thing
as an unrecorded override.** Two STORIS flags deliberately require an override even when granted, so that
approval lands in the audit trail — that intent is right; the implementation (prose comments) is not.

### AUD-006 Queryable and exportable
Filter by actor, entity, field, date range, source, permission, override. Exportable. Retained per a
declared retention policy with a floor of 12 months (`SAR-024`'s floor) — recommend **7 years** given the
AP, tax and warranty exposure documented in `06-privacy-retention-consent.md`.

### AUD-007 Impersonation is constrained
If we support acting-as at all: it requires its own permission, is time-boxed, notifies the impersonated
user, and records **both** identities on every resulting event. It never overwrites the actor field.

### AUD-008 Integrations are actors
Every EDI message, third-party write-back, and import run is an actor with an identity. The vendor EDI
write paths in `C13`'s note (quantity, delivery date, completion state) must each produce audit events
naming the external party — assuming we allow them at all, which `07-anti-patterns.md` argues against.

---

## Reports that must honor `SEC-COST-VIEW`

From `views-reports`: `SAR-033`, `SAR-036`, `SAR-039`, `SAR-041`, `SAR-042`, `SAR-043`, `SAR-044` — cost
columns **omitted, not blanked**, in UI and exports alike. `SAR-042` should deny the route entirely, since
the screen is meaningless without cost.

## Report registry overlaps to consolidate

Do not build these twice. Map to the Inventory pack's `RPT-*` registry:

`SAR-035` → `RPT-RCV-BATCH-OPEN` · `SAR-042` → `RPT-PO-OPEN` / `RPT-PO-RECVCOST` ·
`SAR-033` → `RPT-PROD-ACTIVITY-VIEW` / `RPT-AVAIL` · `SAR-024` → `RPT-PROD-ACTIVITY` user column +
`RPT-RTN-NOORIG` · `SAR-036` → `RPT-RTV-OPEN` · `SAR-039` → `RPT-PO-RECVCOST` / `RPT-COST-EXCEPTIONS` ·
`SAR-045` → `RPT-AVAIL` / `RPT-STORAGE-LOC` · `SAR-031` → `CFG-INV-VENDORMODEL`

## Two reporting defects worth knowing

- **`SAR-025` is silently wrong**: filtering the time clock by store matches the employee's *first* entry in
  Valid Logon Locations, not where the punch happened. "Run for store 88" excludes anyone who worked there
  but is homed elsewhere.
- **`USR-030` Sales Performance Report computes history from live mutable order records** — past-dated runs
  silently change their answers, and voids retroactively erase written sales. It also applies split
  percentages to dollars but **not** to units or lines, inflating attach rates on split tickets. Any report
  we build over mutable data must either snapshot or be explicitly labelled point-in-time.
