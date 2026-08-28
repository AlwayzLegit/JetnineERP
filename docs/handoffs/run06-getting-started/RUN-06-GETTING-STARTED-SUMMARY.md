# RUN 06 — STORIS `Getting Started` — Run Summary

**Scope:** the `Getting Started` category — 56 articles across three subsections. **Method:** the
wiring audit defined in `BROWSER-AGENT-HANDOFF.md` and `KICKOFF-PROMPT.md`. **Output:** 2 batch
files, **findings 316–336 (21 findings)**, this summary.

**Read-only throughout.** No message sent, no override attempted, no location switched, no form
printed, no report run.

This looks like an infrastructure section and is not. **Three of the audit's longest-standing gaps
close here**, and two of them are foundational.

---

## A. Coverage log

| Subsection | Articles | Read in full | Disposition |
|---|---|---|---|
| **Getting Started** *(top level)* | 22 | 5 | 17 classified — navigation mechanics, personalisation, help reference |
| **STORIS Messenger** | 6 | **5** | complete but for one child window |
| **Printing** | 28 | 2 | **26 dissected in the earlier standalone Printing handoff**, cross-referenced |
| **Total** | **56** | **13** | **56 inventoried; no article skipped silently** |

| File | Findings |
|---|---|
| `00-COVERAGE-QUEUE.md` | scope, counts, carried-forward questions |
| `BATCH-01-MESSENGER-SECURITY-OVERRIDE-LOGIN.md` | 316–327 |
| `BATCH-02-PRINTING-NAVIGATION-SWEEP.md` | 328–336 |

---

## B. Six headline findings

### 1. The security override, documented at last *(F316)*

Referenced in every prior run — scheduling past the horizon, As-Is markdowns past the cap, route
capacity, restricted reason codes — and documented in none. It is **one screen**, used everywhere,
with a precise three-case field matrix:

| Acting user has | Reason code required | Prompts for |
|---|---|---|
| no permission | yes | User ID, Password, **and** Reason Code |
| permission | no | User ID and Password |
| permission | **yes** | **Reason Code only** |

Three attempts, then back to the previous screen. **The authorising user is recorded**, which makes
every override across five runs of findings an attributable, structured event — unusual in an ERP
whose audit trail is otherwise prose.

For the rebuild: **this is an in-line second signature, not a role escalation.** A permitted user
types their own credentials into the acting user's session.

### 2. STORIS Messenger, in full *(F317–F322)*

The subsystem inferred in run 04 from one clause about mailing a buyer, and named in run 05 as the
prerequisite for service tickling. It is **a five-tab internal mail application**: Inbound, Outbound,
Tasks, Closed, New Message — with sent-items read tracking, nested groups, separate send and receive
rights, a deleted-items folder with an undo (`Move Back`), and a purge routine.

**Its defining feature is the document link.** A message carries a `Linked Document Type` and
`Document Number`; the recipient jumps to the order, invoice or PO — through the Entry *or* Inquiry
process depending on their permissions. And **`Mandatory`** makes it a workflow primitive: a task with
a mandatory link **cannot be deleted until the linked document is opened.**

Three consumers now identified: **over-receipt buyer notifications** (run 04 F228),
**service tickles** — which are literally Messenger tasks, auto-created and assigned to the
coordinator (F319) — and **scheduled report distribution** by region, district or location (F322).

One governance note: **`Mail Administrator` is a single unscoped user flag granting read access to
every mailbox.**

### 3. Authentication is optional *(F323)*

`Extended Security` — the record the audit has cited across two runs as a cross-module permission
surface (over-receiving, WMS adjustments, vendor chargebacks, product cost visibility) — is at root
**the setting that activates the password field.** Uncheck it and the password field is inactive.

Four log-in settings in `General System Control Settings` — `User ID at Login`, `Extended Security`,
`Complex Passwords` (**PCI**, the first compliance reference in six runs), `Password Expires After __
Days` — plus a per-user `Allow Logon Passthrough` that skips the screen entirely.

**Every Extended Security permission catalogued in runs 04–05 sits on top of a layer that can be
switched off.** Which of these four are on at LA Mattress determines whether STORIS user accounts are
migratable identities or merely names.

### 4. `Assign Specific Pieces At` has three values *(F328)*

Run 04 batch 3 flagged this as the setting that "determines the reservation→piece model" and
re-flagged it in four later batches and the run summary. **It was run 04's highest-priority unknown.**

| Value | Pieces assigned at | Consequence |
|---|---|---|
| `Ticket Print` | delivery ticket print | pick list optional |
| `Creating Pick List` | pick list print | **pick list required** |
| `Truck Load Process` | truck loading | enables `Load a Truck`; **incompatible with the mapping interface** |

The whole warehouse workflow shape follows from this one field, and **which value LA Mattress uses is
now a concrete question to ask.**

### 5. Printing changes state *(F329, F335, and run 04 F237)*

`Print Pick List` **reserves inventory** to the line items. It can also **auto-generate or update
manifests** — creating the document that locks orders out of every other process (run 04 F177).
Printing a delivery ticket is one of exactly two routines that submit items to picking (run 04 F237).

**In STORIS, printing is a transactional interface.** A rebuild that treats printing as rendering
loses three business events, and a user who "just reprints something" is transacting.

### 6. Reprinting a pick list pollutes the manifest-exception report *(F330)*

> "To reprint pick lists for orders on manifest, first remove the orders from the manifest, then reprint the pick lists and put the orders back on manifest."

Run 04 F178 established that removing an order from an existing manifest triggers a reason-code
prompt and **logs an exception** to `S$TE_MAINIF_RMV`. Therefore **every pick-list reprint on a
manifested order generates a spurious manifest-removal exception**, polluting the report management
uses to measure manifest churn.

Neither article says this. It is visible only by holding both. **It is the strongest single argument
in six runs for the whole-section method** — and it is a concrete, checkable question: *how many of
your manifest-removal exceptions are actually reprints?*

---

## C–G. Inventory, settings, permissions, enumerations, sequencing

Catalogued in the two batch files. Highlights: the override screen's three display fields
(`Security Requirement`, `Authorized Action`, `Exception`); Messenger's five tabs and six message
actions; the log-in screen's five session bindings (Location, Cash Drawer, Payment Terminal,
Tethered Terminal, Signature Capture); `Switch User Location`'s documented side effects on four
subsystems, including **printer output silently falling back to screen**; and the twenty run-time
options on `Print a Manifest`, three of which decide whether the delivery crew sees prices.

**Retention:** `Purge Messenger Activity` is the **ninth** purge chain in the audit and the **first
with no named retention setting** — message retention is somebody's habit, not a configuration.

**Regional Processing** upheld as inverted for the **eighth** time.

## H. Open questions carried out of the audit

**Closed by this run:** STORIS Messenger · the security override mechanism ·
`Assign Specific Pieces At` values · the FINAL pick list · `Print a Manifest`.

**Still open, and now permanently so within the six-run queue:** sixteen settings records, all in
**System Administration** — which was never in the queue. Twelve named routines never read. **Thirteen
terms used in the documentation and defined nowhere in it** (F336), including `Closed Without
Completion` (five articles, two runs) and "dollars-only adjustment" (the only correction mechanism on
a service order's parts, labour and charges). **Those thirteen are a vendor question, not a reading
problem.**

## I. Unknown unknowns

- **Printing is a transactional interface** (F329, F335) — the single most surprising structural fact
  in this run.
- **Three silent drop-out paths** from the logistics flow are now documented (F331; run 04 F179;
  run 04 F250's declined capacity override), all evidenced only by comments on the order. **Orders
  leave the flow quietly and routinely.**
- **An operational workaround that corrupts a management report** (F330). There are likely others of
  the same shape, and only the warehouse can tell us.
- **A fourth notification channel** (`System Notification`, F327) surfaced in one sentence. The audit
  has found four, three in the last two runs, each incidentally. **No article anywhere describes how
  STORIS notifies people**; it was assembled from fragments.

---

## Contract adjudication — run 06

| Contract | Verdict |
|---|---|
| **W-050** *(access control)* | **CONFIRMED — the override mechanism referenced in five runs is documented** (F316); `Mail Administrator` (F320); group send rights (F321); licence recovery (F327); **Extended Security is itself optional** (F323); Regional Processing upheld inverted an eighth time |
| **W-055 / W-056** *(availability, reservation)* | **CONFIRMED — run 04's highest-priority unknown closed** (F328, F329) |
| **W-039** *(exceptions)* | **CONFIRMED, with a defect surfaced** — reprints generate spurious manifest-removal exceptions (F330); silent picking omissions logged only as comments (F331) |
| **W-064** *(retention)* | **CONFIRMED — ninth chain, first without a retention setting** (F326) |
| **W-005 / W-006** *(special order)* | **CONFIRMED** — configurator and special-order text print in a fixed order (F334) |
| **W-012** *(dates)* | **consistent** — pick list and manifest keyed by scheduled date |
| **W-061** *(cost)* | **relevant** — `Indicate As-Is` carries the flag to the delivery crew (F333) |
| **NEW — no contract covers these** | internal messaging · concurrent licensing · session hardware binding · **printing as a transactional interface** |

---

## If we rebuilt Getting Started from only what we read, what would we get wrong?

We would treat it as chrome and lose three load-bearing things.

**We would build printing as an output concern.** In STORIS it is a transactional interface: printing
a pick list reserves inventory, can create a manifest, and thereby locks orders out of every other
process; printing a delivery ticket is one of exactly two routines that submit items to picking. Move
printing to a rendering service and three business events disappear — and nobody would notice until
the warehouse stopped receiving work.

**We would build the security override as role escalation.** It is not. It is a second person's
credentials typed into the first person's session, with the authoriser recorded, three attempts, and
a reason code on an axis independent of permission. Every "a security override is required" across
five runs resolves to this one screen, and the third case — you have permission and still owe a
reason — is the one a natural design omits.

**We would assume authentication.** `Extended Security` is the switch that turns the password field
on, and every permission the audit catalogued under that name sits above it. Before we say anything
about migrating STORIS users, somebody has to look at four checkboxes.

And we would build notifications as an afterthought. STORIS has an internal mail application with
document links, group addressing, tasks, and a `Mandatory` flag that forces a recipient to open the
thing before dismissing the message. Service tickles *are* Messenger tasks; report distribution *is*
Messenger; the over-receipt buyer alert *is* Messenger. Replace it with a toast notification and
three modules quietly stop working.

The section that looks like login screens and printer settings turns out to hold the mechanism behind
every override, every internal notification, and three of the audit's state-changing events. **It was
last in the queue and it should not have been.**

---

*Run 06 complete. The six-run parity audit is finished — see `AUDIT-CLOSEOUT.md`.*
