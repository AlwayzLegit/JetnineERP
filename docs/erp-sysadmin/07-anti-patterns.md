# 07 — Anti-Patterns: STORIS Designs We Deliberately Reject

Parity is the goal for *behavior the business depends on*. It is not the goal for design defects. This file
is the explicit reject list, so that a future reader does not "fix" our system by making it match STORIS.

Each entry: what STORIS does, why it is wrong, what we do instead. Cite this file in code comments where we
deliberately diverge.

---

### AP-01 A global switch that disables all security
`Extended Security` off makes every per-user permission inert while leaving them visibly configured —
nothing looks wrong — and it gates raw database shell access (`SYS-001`).
**Instead:** permissions are always enforced. No global disable exists.

### AP-02 Permissions as a copy-down template
Group edits do nothing until `Reset User Members` is ticked, at which point they **mass-overwrite every
member's record with no preview or undo**, destroying per-user exceptions. Enforcement reads only the user
row. Group membership is single-valued and required.
**Instead:** live evaluation at decision time, most-specific scope wins, deny beats allow within a scope,
default deny, multiple group membership, and every decision explainable ("denied by X at scope Y").

### AP-03 Settings whose blank value destroys data
~80 tri-state fields; blank frequently means "purge everything" (`SET-002`).
**Instead:** explicit `null_means` in the registry, rendered as a real option with its consequence stated.
Destructive values require typed confirmation naming what will be destroyed.

### AP-04 Encryption as a checkbox
Unchecking bulk-decrypts every stored SSN, DOB and driver's licence. Passwords stored in plaintext when a
box is unchecked.
**Instead:** encryption at rest is architectural and unconditional. Passwords are hashed.

### AP-05 Unlogged overrides
`Override Freight Amount` — verbatim, *"Use of this security override is not recorded"*. Same for
`Override Legal Code Allow Payments Setting`.
**Instead:** `AUD-005` — there is no such thing as an unrecorded override.

### AP-06 Free impersonation
`Run as User` accepts any user ID and stamps that identity into audit comments and report `Creator` fields,
making the log actively misleading. Compounded by two identifiers per user (`Logon ID` ≠ `User ID`).
**Instead:** `AUD-007` — permissioned, time-boxed, notified, and **both** identities on every event.

### AP-07 Audit that deletes itself
Turning off `Track Settings Activity` **deletes all its audit records**. `Review Settings Activity` has no
date field and cannot export. Audit comments are localized template strings, not data.
**Instead:** `05-audit-and-observability.md` — one append-only structured stream, not opt-in, not deletable.

### AP-08 Silent scope widening
Editing an order at a non-permitted location **adds** that location to the user's available list
(`SAR-037`, `USR-026` documents ~14 such bypasses; entering a customer code overrides all restrictions;
Costing Table Inquiry detail is entirely unfiltered).
**Instead:** scope is a hard boundary. Access is never granted as a side effect of an action.

### AP-09 Deny-lists that fail open
Restricted payment types is a deny-list, so **every newly added tender is permitted by default**, and it
blocks *after* selection rather than filtering the picker (`USR-028`).
**Instead:** allow-lists. New capability is denied until explicitly granted, and unavailable options are
never offered.

### AP-10 Inverted and inconsistent semantics
File/Field Security Codes: presence = restricted, check = allowed. `Payment Class Access` **inverts meaning
mid-screen** — a tick at class level allows, a tick in the per-type sublist denies.
**Instead:** one polarity everywhere. Checked always means granted.

### AP-11 Vendors with write access to our data
Vendor EDI can rewrite **quantity ordered** (856 acknowledgement), **delivery date** (acknowledgement ship
date + in-transit days), and **delivery completion state including partial completions** (214 via Third
Party Logistics EDI Code). Mitigation is an after-the-fact email.
**Instead:** inbound EDI creates **proposals**, never mutations. A human or a rule accepts them, and the
acceptance is the audited event. This is not negotiable for anything touching quantity, date or money.

### AP-12 Tax that silently becomes zero
`Use STORIS calculations when offline` defaults **off**, meaning **$0.00 sales tax** during a tax-provider
outage.
**Instead:** fail closed. Block the transaction, surface the outage. Never sell at zero tax.

### AP-13 Zero-cost inventory with the exception cleared
Four documented paths accept $0.00 cost and clear the cost exception, corrupting margin for the life of the
cost layer (`C9`).
**Instead:** a zero-cost layer cannot be created without an explicit, permissioned, audited override, and
the exception is never auto-cleared.

### AP-14 Reports computed from live mutable records
`USR-030` Sales Performance recomputes history from current order records — past-dated runs silently change
their answers and voids retroactively erase written sales.
**Instead:** report from the ledger and from snapshots. Any point-in-time report is labelled as such.

### AP-15 Attribution and consent overwritten in place
Referral source, survey responses, credit source, lead stage, demographics — all overwritten. No consent
model at all.
**Instead:** append-only event streams (`PRIV-003`, `PRIV-004`); current value is a projection.

### AP-16 Documents indistinguishable when unsigned
With no signature hardware, the PDF is archived anyway and is file-level identical to a signed one.
**Instead:** signed and unsigned are structurally distinct; signatures bind to the document, not the
payment terminal.

### AP-17 Erasure that is really a field scrub
Name and billing address overwritten with the literal `"REMOVED"`, city/state/ZIP deliberately retained,
most PII untouched, duplicates ignored, no requester or timestamp recorded.
**Instead:** a real erasure routine covering the full PII inventory, resolving duplicates, fully audited,
with a declared legal basis — see `PRIV-002`, which must be settled first.

### AP-18 Purges triggered by blank fields and hidden inside EOM
`SYS-031`, verbatim: *"The Month-Ending process may purge certain files automatically… If you are unsure
about which of your files are scheduled for purging, contact your STORIS representative."*
**Instead:** `JOB-004` — purges are explicit, scoped, previewed, permissioned and audited jobs. Never a side
effect.

### AP-19 Config screens that mutate data in bulk
`Automatic Charge-Off` charges off every customer with that code; editing collector criteria re-routes all
assigned accounts; unchecking `Error Logging` deletes credit logs; a coupon's `Coupon Redeemed` is a
manually un-checkable boolean (unlimited re-use fraud).
**Instead:** settings describe policy. Applying policy to existing records is a separate, previewed,
audited operation.

### AP-20 The customer/order number namespace collision
On-the-fly customers get the sales ticket number as their customer number (`CUST-004`).
**Instead:** separate id spaces, opaque surrogate keys.

### AP-21 Duplicate rules that are backwards
Duplicates (matched on email and phones) are **rejected in maintenance but permitted at point of sale** —
*"you may create the new customer, even if it is a duplicate"*. This is the duplicate-proliferation root
cause, and it is what makes erasure only partially effective.
**Instead:** detect and resolve at the point of creation, especially at POS, where the volume is.

### AP-22 A settings layer that manual entry ignores
`VEND-041`, verbatim: *"These settings do not apply to the Enter a Purchase Order process."* The entire
category/group exception layer — lead days, pads, warranty, stock days — is ignored on manually keyed POs.
**Instead:** one resolution path. If a setting governs a value, it governs it everywhere.

### AP-23 OS-level authentication for an app feature
Update Product Images authenticates against the **server operating system**, not the ERP, and caches
per-PC account credentials (`PRD-076`, `PRD-079`).
**Instead:** one identity system.
