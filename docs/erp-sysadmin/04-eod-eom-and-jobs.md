# 04 — End of Day, End of Month, and Scheduled Jobs

`EOD-001` in the Inventory pack was an assumption. This is what it actually is.

---

## JOB-001 — EOD is an update job, not a reporting job

Verbatim from `SYS-019`:

> *"Checking this box suppresses the printing of the report only. Updates performed during the Generate
> Daily Reports process… continue whether or not this box is checked."*

**Generate Daily Reports performs 48 steps, of which reporting is a side effect.** Steps cannot be disabled
by suppressing their report. Any design that treats our nightly batch as "reports" will lose data.

Known steps and facts captured:

- **Step 30 of 48**: `Replenish Stock Inventory Based on Sales Rate` (program `PO.400.PRE`) — confirms
  `REPL-040`.
- **PO close**, but only for orders **completely AP approved**, and only when Third-Party Accounting is
  active (`PO-104`, corrected — see `C7`).
- **Sales order sweep** in the sales order module.
- **Data Warehouse export**, honoring `N`/`F` resync flags.
- **Optional system backup.**
- **Quote/layaway auto-archive** — which, with `Delete Quotes When Lead is Closed` on, silently deletes
  customer quotes *and layaways* (`SCS-068`).
- **End of month adds:** costing-audit purge, messenger purge, and file purges the operator may not know
  about — `SYS-031`, verbatim: *"The Month-Ending process may purge certain files automatically… If you are
  unsure about which of your files are scheduled for purging, contact your STORIS representative."*

**That sentence is the whole argument for building this differently.** A nightly job whose destructive steps
are unknowable to the operator is not acceptable.

## JOB-002 — Requirements for our batch runner

- **Declared step list.** Every step is a registered job with an id, a declared order, declared inputs and
  outputs, and a declared destructive/non-destructive classification. The operator can see the list.
- **Reporting is decoupled from processing.** Suppressing a report never changes what the job does. They
  are separate steps with separate flags.
- **No purge runs implicitly inside EOD/EOM.** Retention purges are their own scheduled jobs, individually
  enabled, individually logged, with a dry-run mode and a preview count. Nothing is deleted because a
  retention field happened to be blank.
- **Idempotent and individually re-runnable.** A failed step is retried without re-running the whole batch.
- **Ordering is explicit and asserted**, not implied by a list. `REPL-041` requires replenishment to run
  after receipts, sales, transfers and PO closings settle — encode that as a dependency, and test it.
- **Business date is explicit.** STORIS posts using the operator's `As-of Date`, and **a catch-up run
  collapses several missed days onto one date** — which corrupts any day-over-day reporting. Ours must
  either refuse to catch up silently or run one pass per missed business date.
- **Observable.** Duration per step, records affected, and failures. STORIS tracks `Average End of
  Day/Month Length` over the last seven runs — a good idea worth keeping, because EOD, EOM, backup and
  software updates all contend for one nightly window.
- **Run report** to the operator every morning: what ran, what changed, what was skipped and why.

## JOB-003 — Operational landmines to design out

Documented STORIS behaviors that must not survive into our system:

- **Never start EOD at midnight** (date-boundary corruption).
- **Any keypress aborts the run.**
- `Local Printer` combined with Regional Processing **blocks EOD/EOM entirely** on non-Cloud installs.
- `Even if Daily Backup Fails` permits an **irreversible period close with no backup**.
- Period close: two open periods maximum, and overlap from the 20th **blocks transaction entry**. Closed
  months make **cost exceptions permanently unresolvable** — which directly defeats `COST-041`. Our period
  close must force the cost-exception queue to zero before it will run.
- **EOD workload varies by how much the GL Posting Phantom drained during the day** — i.e. the nightly
  window is unpredictable by design. Ours should stream posting continuously, not accumulate it.

## JOB-004 — Purge and retention jobs

Purge utilities found across this section: sensitive data, general ledger, costing audit, cash drawer,
special order and obsolete products, completed order attachments, messenger, plus the retention-driven
purges embedded in EOM.

Documented defects to avoid:

- **GL purge hits all companies with no selector.**
- **Costing purge with both dates blank purges everything**, with no restrictions.
- **Only the sensitive-data purge is audited** — and its `Social Security` type is **non-functional**.
- `Purge Completed Order Attachments` combined with any shared physical file causes **cross-record data
  loss** (attachments are keyed by record but the physical filename scheme is not record-unique).

Our requirements: every purge is scoped, previewed with a count, audited with actor and reason, restricted
by permission, and **never triggered as a side effect of a retention field being blank**.

## JOB-005 — Data conversion and import

`SYS-035` is the main importer. Facts that matter for `MIG-*`:

- **Per-entity Live authorization is STORIS-locked**, and `Quantity on Hand`, `Invoice History`, and
  `Service Order History` are **blocked by default** — exactly the three things our cutover most needs.
- **Conversion is not idempotent.** `Run Conversion` refuses a repeat, and `Clear File Conversion`
  **cascades into undocumented related files**. Only `SYS-079` is documented safe to re-run.
- **Sample runs actually write** (`SYS-014`, `SYS-035`). There is no true dry run.
- `SYS-034` **silently skips half-blank mapping rows.**
- `SYS-005` duplicates AP bills with **no dedupe key**.
- Import files are **positional by column letter** with no idempotency key (`USR-024`).

**Action for `12-cutover-plan.md`:** `MIG-001`'s "every loader is idempotent" is *our* requirement and is
explicitly not satisfied by the STORIS side. Budget for **restore-and-retry rehearsals** rather than
re-running conversions, and build our own importers rather than depending on theirs.
