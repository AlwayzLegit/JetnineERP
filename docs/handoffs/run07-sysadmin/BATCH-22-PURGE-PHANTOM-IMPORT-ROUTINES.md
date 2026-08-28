# Run 07 — System Administration — Batch 22: Purge, Phantom and Import Routines

Status: complete. Findings 652–666. **Read-only throughout — this is the most destructive area in the
help centre and nothing was run.** No Run button pressed, no purge list built, no import started, no
phantom started or stopped, no confirmation answered.

**`TPA` is resolved** (F665) — batch 21 F642 left it undefined; a purge article expands it.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Purge of Sensitive Data** | 15234723664532 | read |
| 2 | **Purge General Ledger Data** | 15234737760788 | read |
| 3 | **Purge Costing Audit Data** | 15234723643412 | read |
| 4 | **Purge Special Order and Obsolete Products** | 15234723644692 | read |
| 5 | **Phantom Process Settings** | 15234721715988 | read — `11.0`/`10.8` |
| 6 | **Administer Phantom Processes** | 15234735777428 | read |
| 7 | **Copy Live Data to Learn Account** | 15234722085140 | read |
| 8 | **Import Data** | 15234721245332 | read |
| 9 | **Remove Sales Orders Not Processed Correctly** | 15234738567700 | read |

**System Administration (nested) inventoried** — 93 articles, listing read in full. The subsection
divides into: **purge routines** (6) · **phantom/process administration** (5) · **import and
conversion** (14) · **end-of-day / end-of-month machinery** (8) · **PC path and platform
configuration** (7) · **data warehouse** (3) · **time clock** (3) · **updates and licensing** (4) ·
and assorted utilities. Named but not read: `Access ECL` · `Access Time Clock` ·
`AP and GL History Conversions` · `AP Bill Conversion` · `Assign Conversion Import Translations` ·
`Assign Daily/Monthly Reports Print Destination` · `Automated Data Import Settings` ·
`Automatic Updates Notification Screen` · `Check and Electronically Install STORIS Updates` ·
`Conversion Process Actions Button` · `Create a Catalog Spreadsheet` · `Create Document Text` ·
`Custom Plug-In Process Maintenance` · `Cycle Module Multi-Print Assignment Screen` ·
`Default Path for Micro*D Quote Documents and Images` · `Dynamic Tab Settings` ·
`End of Day Reports` · `End of Month Reports` · `End-Of-Month Active Module Inquiry Screen` ·
`End-Of-Month Module Detail Screen` · `Enter Payments Applied to a Contract` ·
`Export Protection Plan Activity` · `Export Purchase Orders` · `Generate Daily Reports` ·
`Generate Monthly Reports` · `Generate Monthly Reports after Daily Reports` ·
`Import / Export Physical Inventory Count` · `Import Cross Reference Data` · `Import External Data` ·
`Import Physical Inventory Count Review Screen` · `Install Software Updates` ·
`Installment Contract Load` · `Load Import Tariff` · `Log To Additional Account` ·
`Maintain NFS Root Paths` · `Mass Collector Reassignment` · `Modify Images/Quickbooks/Routeview/UPS
Roadnet PC Path` · `Multi-Lingual Character Sequences` · `Multi-Lingual Processing Set-Up` ·
`Override Time Clock Entry` · `Phantom Process Log` · `Physical Inventory Count Review` ·
`Purchase Orders to Export` · `Recover STORIS Licenses` · `Report Data Imported Errors and Warnings` ·
`Report on Data Warehouse Activity` · `Resync Data Warehouse` + ~20 more.

---

## B. Wiring findings

### FINDING 652 — Sensitive data purging is a six-type, per-type-retention, dual-logged, permission-gated routine

- **Invariant:** encrypted PII is purged by record type on independent retention periods, writing to two audit logs.
- **Evidence** — `Purge of Sensitive Data`:
  > "Use this routine to purge **encrypted data, for the primary customer and co-applicant, from the `Secured Data` file** in STORIS."
  > "Data record types that can be purged…are: **Credit Card · Social Security · Finance Account · Checking Account · Date of Birth · Driver's License**"
  > "When this process is run from the menu or as a scheduled process, **audit comments are generated that are stored in the `STORIS Log` and `Customer Activity Log`. The STORIS Log comments carry a snapshot of the criteria used for the purge, while the Customer Activity Log pinpoints the specific data that was purged for the customer.**"
  > "To run this purge, you must have security access via the **`Purge secured/encrypted data`** field in your **Create a User/Group Actions - System Security** settings."
  > "After you select the **time period to retain for each type** and place a check next to each type you want purged, click the Run button… **The program prompts you to verify that you want to run the purge.**"
- **Maps to:** batch 18 F599 (the PII block on the customer record) · the Sales Security handoff §3.12 ·
  batch 5 (`SYS.ENCRYPT.DECRYPT.PTM`) · W-050, W-064.

> **This is the answer to the PII question the Sales Security handoff raised, and it is a good one.**
> STORIS has a **dedicated `Secured Data` file** holding the six encrypted types, separate from the
> customer record, with its own purge routine, its own permission, and **two complementary audit
> logs** — one recording *what criteria were used*, one recording *what was removed for whom*.
>
> **That two-log split is worth copying exactly.** The criteria snapshot answers "why did this
> happen"; the per-customer log answers "what did this customer lose". Most systems keep one and
> regret it.
>
> **For the rebuild the finding is architectural:** sensitive fields are not columns on the customer,
> they are rows in a segregated encrypted store keyed by customer and co-applicant. **That makes
> retention enforceable per data type**, which is what modern privacy regimes actually require. The
> handoff's recommendation — decide the card-data model before the extract — now has a concrete
> target: `Secured Data`, six types, six retention periods.
>
> **Co-applicant is a first-class party**, which the customer master (batch 18) did not reveal.

### FINDING 653 — The credit-card purge is gated by a retention setting in another record

- **Invariant:** card purging is unavailable unless a settled-card retention value ≥ 0 exists elsewhere.
- **Evidence** — `Purge of Sensitive Data`:
  > "**To utilize this Credit Card purge, `Retain Settled Card Number for NN Days` must contain a number greater than or equal to zero in `Payment Card and Device Settings`.**"
- **Maps to:** F652 · batch 21 F637 (payment type records) · W-050, W-058.

> **A blank retention setting disables a compliance routine** — and note that **zero is explicitly
> valid** while blank is not. That is the *blank defers / zero forbids* idiom (17+ instances) used
> here to distinguish "purge immediately after settlement" from "not configured".
>
> **`Payment Card and Device Settings` is a record the audit has not read**, named only here. Given
> it holds card-retention policy, it is likely the PCI-relevant control record. §I — worth adding to
> the live-system checklist alongside `Secured Data`.

### FINDING 654 — GL purging is entirely computed and disables itself when it would do nothing

- **Invariant:** the year range is derived from a control setting, shown read-only, and the routine is inaccessible if the range is empty.
- **Evidence** — `Purge General Ledger Data`:
  > "Use this routine to purge **all GL-related files for a specified range of fiscal years**. This process references the **`Maintain History Years`** field in the **General Ledger Control Settings**… **If multi-company processing is active, this process purges files for all companies.**"
  > worked example: *"if your current fiscal year is 2008, your start year… is 2001, and '3' appears at the `Maintain History Years` field, then '2001' would appear in `Start Year`, and '2004' would appear in `End Year`… the system retains general ledger data for… (3 years, or 2005, 2006, and 2007), and purges all data from preceding fiscal years. **The fields below are display-only.**"*
  > "**NOTE: The `Start Year` must precede the `End Year`, otherwise you cannot access this routine.** That is, if the `Maintain History Years` field contains a number that causes the Start Year to exceed the End Year, then **no data would be purged by this routine and this field is inactive.**"
- **Maps to:** run 01 (GL) · batch 12 (locations create GL cost centres) · W-052.

> **The operator has no parameters at all** — the whole scope of a destructive GL purge is derived
> from one number in another record. **That is a strong safety design**: to change what gets purged
> you must change the retention policy, deliberately, in the place where retention policy lives.
>
> **Self-disabling when it would be a no-op** is a small, excellent touch — the routine refuses to
> open rather than running and reporting zero.
>
> **"Purges files for all companies"** under multi-company is the dangerous clause: a single
> retention number governs every company's GL history simultaneously. **No per-company override
> exists.**

### FINDING 655 — Costing audit purging accepts any date range, and an empty range means everything

- **Invariant:** the on-demand purge has no restrictions, and omitting dates purges all costed auditing data.
- **Evidence** — `Purge Costing Audit Data`:
  > "**You can purge the data for any date range you specify, without restrictions. If you do not specify a date range, all costed auditing data is purged.**"
  > "The data is retained for the period established by the **`Costed Auditing Data`** field in your **Costing Control Settings** and **purged automatically during month-end processing.**"
  Fields: `Start Date` · `End Date`.
- **Maps to:** F654 (the opposite design) · batch 1 (Costing Control Settings) · run 03 F144 (the
  margin chain) · W-061, W-064.

> **Two purge routines, two opposite philosophies, in the same subsection.** GL purging is fully
> derived and unparameterised (F654); costing-audit purging is fully parameterised, unrestricted, and
> **defaults to total deletion when left blank**.
>
> **That default is the most dangerous single behaviour the audit has found.** An operator who opens
> the routine, presses Run without entering dates, and confirms, deletes the entire costed audit
> trail. There is no derived range, no minimum retention check, and — unlike F652 — **no documented
> audit log of the purge itself.**
>
> **This matters because of what the data is** (F656): the evidence trail behind the audit's most
> consequential chain, run 03 F144's provisional-margin restatement. **A rebuild must not reproduce
> the blank-means-all default.** Flagged in §H as the batch's top item.

### FINDING 656 — Every inventory movement writes costed auditing data

- **Invariant:** creation, cost change, receipt, adjustment, sale and transfer all generate cost audit records.
- **Evidence** — `Purge Costing Audit Data`:
  > "**All inventory updates, creating a product, changing its cost, receiving a PO, adjusting in quantity, selling a piece, transferring a piece, etc., create costed auditing data on the system.**"
- **Maps to:** **run 03 F144** (orders written at average cost, restated when exact cost arrives) ·
  run 04 F219 (cost exceptions block the inventory freeze) · run 04 F280 (As-Is paths are all cost
  events) · batch 19 F609, batch 20 F633 (cost-based pricing and commission) · W-061.

> **This names the substrate under the audit's single most consequential chain.** Run 03 established
> that margin is provisional and restated; run 04 established that every As-Is disposition path is a
> cost event; batches 19 and 20 established that both *price* and *commission* can be derived from
> cost. **All of it leaves a trail in one place, and F655 can delete that place in one keystroke.**
>
> **For the rebuild:** this is the immutable cost ledger. Treat it as append-only, retain it longer
> than the operational data it explains, and **never make total deletion the default of any control.**

### FINDING 657 — Phantom tuning is vendor-set and explicitly not to be changed

- **Invariant:** STORIS sets phantom parameters at install; both too many and too few phantoms degrade the system.
- **Evidence** — `Phantom Process Settings`:
  > "**Each phantom runs a STORIS program in the background, processing transactions and updating pertinent files as you enter the data into the system.** For example, many phantoms such as the **GL Posting Phantom** process a file in the background while you work during the day **in order to reduce the amount of data End-of-Day must process.**"
  > "**STORIS personnel provide the default values in this routine during the installation of your system. You should NOT change any of these fields without first consulting a STORIS representative.**"
  > "**In relation to the amount of data ready for processing at any given time, running too many phantoms can slow down your computing operations, and too few phantoms can result in a backlog of data for another process, for example the End-of-Day process.**"
  > "STORIS comes delivered with multiple phantom processes available for activation… **However, not all STORIS processes have supporting phantoms.**"
  Fields: `Process` · `Description` · `Type` · `Sleep Interval` · `Status Interval` ·
  `Auto Start Queue File` · `Auto Start Queue Count` · `Auto Start Max Processes` ·
  `Extra Information Display Subroutine Name` · `Maximum Number of Concurrent Phantoms` ·
  `Extra Cleanup Subroutine Name`.
- **Maps to:** batch 5 (phantoms = UniData daemons) · batch 18 F582 (the Process Scheduler phantom) ·
  batch 17 F558 (the Consumer Event Notification phantom) · W-041.

> **This explains the architecture the audit has been circling since batch 5.** Phantoms are not
> background *jobs*; they are **continuously-running consumers draining work queues during the
> business day**, explicitly to shrink the End-of-Day batch. So the batch calendar and the phantom
> pool are two halves of one design: **whatever the phantoms do not consume during the day, End of
> Day must.**
>
> **`Extra Information Display Subroutine Name` and `Extra Cleanup Subroutine Name` are field-held
> code entry points** — a settings record naming subroutines to call. That is the second instance of
> vendor-written logic selected by configuration, after batch 19 F614's alternate tax calculations.
> **The pattern is real and a rebuild cannot inherit it from documentation.**
>
> **The do-not-change warning marks this as an eighth region of vendor-owned settings** (cf. batch 15
> F531, batch 20 F628). It is advisory, not enforced.

### FINDING 658 — The phantom pool self-manages: dead registrations are reaped and counts auto-adjust

- **Invariant:** a supervisor loop deregisters dead phantoms and launches or stops processes to match a computed target.
- **Evidence** — `Phantom Process Settings`:
  > "**All registered phantoms are checked. If any are found to be inactive (dead), their registration is removed from the phantom's record.**"
  > "**The defined auto-start queue is checked and the correct number of phantom process is calculated using the auto start count. If an insufficient number of phantoms are running, then new phantoms are automatically launched. If too many phantoms are running, the system stops some of the phantoms and deletes their registrations** from the phantoms record."
  > "The automatic update/refresh mode may be exited at any time by pressing any key."
  `Administer Phantom Processes` exposes the manual controls: `Process` · `Type` · `Status` ·
  Auto Start/Stop Information (`Update Interval` · `Queue Count` · `Queue Name` · `Status` ·
  **`Process ID`** · `Action`).
- **Maps to:** F657 · batch 18 F582 · W-041.

> **This is an autoscaler, written in the 1990s, for a multivalue database.** Queue depth in, process
> count out, with liveness reaping. It is a genuinely sophisticated mechanism and it explains why
> `Auto Start Queue File` and `Auto Start Queue Count` exist as settings.
>
> **For the rebuild the lesson is not the mechanism but the requirement it encodes:** the work is
> queue-shaped and the consumer count must track backlog. Any modern queue runtime satisfies this —
> but the rebuild must recognise that **these queues are business-visible**, since a backlog shows up
> as End-of-Day duration.
>
> **`Process ID` on the admin screen means phantoms are OS-level processes**, consistent with the
> UniData/AIX platform.

### FINDING 659 — Order completion is itself a phantom queue with retries and lock handling

- **Invariant:** completing an order is queued work with a time limit, an attempt limit, and a resubmission interval for lock conflicts.
- **Evidence** — `Phantom Process Settings`, Order Completion Queue block:
  > "**`Order Completion Queue` · `Maximum Completion Time` · `Maximum Completion Attempts` · `Resubmission Interval for Locked Errors` · `Notify of Completion Errors`**"
  Related article named: `Order Completion Exceptions`.
- **Maps to:** run 03 (order completion) · run 04 F177 (the manifest's exclusive system-wide lock) ·
  batch 19 F615 (completion is the revenue-recognition event) · W-041.

> **Order completion — the event batch 19 F615 identified as the moment revenue is earned and tax is
> owed — is asynchronous, retried, and can fail.** That is a substantial finding about the
> transaction model, and it arrives incidentally in a phantom settings field list.
>
> **`Resubmission Interval for Locked Errors` names the failure mode**: record locks, which is exactly
> what run 04 F177's system-wide manifest lock would cause. **So manifesting can delay order
> completion**, and completion retries until `Maximum Completion Attempts` is exhausted.
>
> **`Order Completion Exceptions` is the queue of failures** and the audit has not read it. **For a
> rebuild: completion must be idempotent and retry-safe**, and there must be somewhere for permanent
> failures to land. §I.

### FINDING 660 — Phantoms must be stopped before the server is shut down

- **Invariant:** shutting down with phantoms running requires intervention; the warning appears in both phantom articles.
- **Evidence** — `Phantom Process Settings` and `Administer Phantom Processes`, identical text:
  > "**NOTE: If you must shut down your server, STOP ALL PHANTOM PROCESSES RUNNING ON THE SYSTEM BEFORE SHUTTING DOWN. If you are unable to do so, contact your system administrator or STORIS representative for assistance before shutting down the server.**"
- **Maps to:** F657, F658 · batch 5 (UniData) · W-041.

> **Capitalised, repeated in two articles, with an escalation path if you cannot comply.** That is the
> strongest operational warning in seven runs, and it implies phantoms hold **uncommitted work or
> open locks** that an abrupt stop would strand.
>
> **This is a real constraint on the cutover plan**, not just on daily operations: any migration
> window involving a STORIS shutdown must sequence phantom stops first. Worth putting in the cutover
> runbook rather than discovering it on the night.

### FINDING 661 — Copying live data to the training account is STORIS-only and Windows-only

- **Invariant:** the routine overwrites the Learn account entirely, is restricted to STORIS personnel, and does not exist on Unix platforms.
- **Evidence** — `Copy Live Data to Learn Account`:
  > "**This routine is accessible by STORIS personnel only.** This routine updates your STORIS Learn account by copying the data in your Live account over the existing data in your Learn account. **This routine overwrites the data in your Learn account.**"
  > "**Important! This is a powerful routine capable of overwriting an entire data system.**"
  > "**This routine is available only to systems running on a Windows®-based platform. For systems running on AIX, SCO, or HP platforms, contact STORIS for assistance.**"
  > "STORIS recommends **all users log off the system** before running this process."
  > "If you have a provider to whom you transmit data, and that provider requires that you transmit data in a **test environment**, please contact STORIS."
  Field: `Enter "Yes" if you are ready to proceed`.
- **Maps to:** batch 4 (AIX vs Cloud/SaaS) · batch 20 F626 (vendor-gated capability) · W-051.

> **A `Learn` account exists as a first-class parallel environment** — the audit has met account
> switching (`Log To Additional Account` in the listing) but not what the accounts are for. **Live and
> Learn are separate data systems on the same installation.**
>
> **Three platforms are named — Windows, AIX, SCO, HP** — which widens batch 4's finding beyond
> AIX/Cloud. **Which platform LA Mattress runs determines whether this routine exists at all**, and
> more importantly whether refreshing a test environment is self-service or a support ticket.
> **Live-system question**, and it bears directly on how the rebuild's parallel-run testing gets data.
>
> **Test transmissions require coordinating with the provider *and* STORIS** — so integration testing
> is not something LA Mattress can arrange alone today.

### FINDING 662 — Data import is file-by-file, security-gated, and carries an explicit live authorisation

- **Invariant:** conversion runs one file at a time into the current account, with a security override path and a live-run flag.
- **Evidence** — `Import Data`:
  > "Use this routine to convert your data to the STORIS format when you first begin using STORIS. **You convert data file-by-file (for example, Vendor file, then Product file).** Your current account name appears at the top of the screen. **You can convert data only into the account you are currently running.**"
  > "**The ability to utilize any of these import processes depends on your security settings in Create a User/Group Actions - Import Data Security. If you do not have security clearance for any import processes, you are presented with a security override screen.**"
  > "**Important! Consult with your STORIS representative before running this routine. Running this routine improperly can damage your data files.**"
  > "**If you are already LIVE on the STORIS system, check with STORIS before running any data conversions in your LIVE account.**"
  Fields: `Conversion File` · `Data File Name` · paired header/detail names for **PO, RR, INV, SO and
  Order** · `NFS File Path` · **`Sample Amount`** · **`Authorized to Run Live`** · Grid · Actions.
- **Maps to:** batches 7–9 (Import Data Security is one of the ten modules) · batch 16 F549 ·
  batch 18 F583 · W-050.

> **`Import Data Security` finally has a subject.** Batches 7–9 catalogued it as one of the ten
> permission modules without knowing what it gated. **It gates this**, per conversion type.
>
> **`Sample Amount` is a dry-run control** — import a sample before committing — and
> **`Authorized to Run Live` is a second, explicit gate.** Two independent safeties on a destructive
> operation, which is more care than most of this subsection shows.
>
> **The header/detail file pairs enumerate the convertible transaction types**: purchase orders,
> receivings, inventory, sales orders, and a generic Order pair. **That is a direct statement of what
> STORIS considers convertible**, and it is relevant in reverse: these are the entities LA Mattress's
> data will need to leave STORIS as.
>
> **Denied users get the Security Override Screen** (run 06 F316) rather than a refusal — so an import
> can be authorised by a manager standing behind the operator.

### FINDING 663 — End of Day voids orders that did not process correctly

- **Invariant:** a routine that voids incorrectly-processed orders runs automatically every night.
- **Evidence** — `Remove Sales Orders Not Processed Correctly`:
  > "Use this routine to **remove all the orders from the system that were not processed correctly.**"
  > confirmation text, verbatim: *"**This process will void all orders not processed correctly. Continue?**"*
  > "If you click yes, **an information screen appears with the number of documents that have been removed.**"
  > "**NOTE: In addition to the ability to run this routine on demand, this process runs automatically during the end-of-day process in the sales order module.**"
- **Maps to:** batch 5 (the batch calendar) · run 03 F153 (EOD releases credit holds) · F659 (order
  completion can fail) · W-041.

> **Eighth End-of-Day responsibility, and the first that is destructive.** EOD releases credit holds,
> drives notifications, reserves hard kits, raises purchase orders, expires reward points, reports
> new zip codes, closes AP-approved POs — **and voids broken orders.**
>
> **What "not processed correctly" means is nowhere defined**, and that is the finding. Given F659,
> the likely population is orders whose completion exhausted its retry budget — but **the docs do not
> say**, and the audit will not infer it. §H.
>
> **A nightly job that deletes transaction documents with no stated criteria is exactly the kind of
> behaviour a rebuild inherits by accident.** Reproduce it only after establishing what the criteria
> actually are; the safer design is to quarantine rather than void.

### FINDING 664 — Product purging requires ten clear conditions and excludes two data classes

- **Invariant:** a product qualifies for purge only with no quantity, no document references, no cost exceptions and no history.
- **Evidence** — `Purge Special Order and Obsolete Products`:
  > "…the program includes **only special-order or obsolete products with no activity**, meaning products with no quantity **on hand, reserved, on sales or service orders** (if the order is closed, it must purge from the system before you can purge the product)**, on layaway, on transfers, in as-is status, on back-order, on open purchase orders*, with cost exceptions**, and having a last-sold date that falls outside the number of days specified at the **`Days With No Activity`** field."
  > "In addition, the program **excludes products with any invoice history or associated costing data.** The system purges that data based on the settings in the **Point of Sale Control Settings (`Customer Retention Months` field)** and the **Costing Control Settings**, respectively."
  > "**Products flagged for purging do not appear in the sales-related version of the `Search for a Product` window.**"
  > "…before you can purge products, you must first **build a purge list**… create a list · print or display the list · clear the list without purging · purge the products on the list."
  Fields: `Product Type To Purge` · `Action Type` · `Product Categories` · `Days With No Activity` ·
  `Date List Was Created` · `List Created By` · `Number Of Items In List` ·
  **`Exclude Kits with Active Components`** · `Send Output to` · `Export Path`.
- **Maps to:** batch 14 F506 (D/T/P are the purge input set) · run 04 F280 (As-Is) · run 04 F219 (cost
  exceptions) · batch 14 F513 (kits) · W-023, W-034.

> **A cascading retention chain three levels deep.** A product cannot go until its costing data and
> invoice history have gone; those go on *their* retention settings; and closed orders must purge
> before the product can. **So product purging is gated on two other purge policies in two other
> control records.** A rebuild's data-retention design must model this dependency graph, not a flat
> per-entity retention.
>
> **Cost exceptions block purging** — the third place in the audit where an unresolved cost exception
> blocks something, after run 04 F219 (the inventory freeze) and run 03 F144 (margin restatement).
> **The cost-exception queue now blocks three separate operations.**
>
> **The build-list-then-act pattern is the safest destructive design in the subsection**: four
> actions, of which only one destroys, and the list is reviewable and printable first. **Contrast
> F655's blank-means-everything.** Worth copying.
>
> **Purge-flagged products vanish from the *sales* search but not others** — a soft-delete visible in
> one context only, which is how a purchased product can still be found by a buyer while being
> invisible to a salesperson.

### FINDING 665 — `TPA` is Third-Party Accounting, and it changes when purchase orders close

- **Invariant:** with TPA active, received POs stay open until AP-approved and are closed by a subsequent End of Day.
- **Evidence** — `Purge Special Order and Obsolete Products`:
  > "**NOTE: *If `Third-Party Accounting` is active, received purchase orders remain open until they have been AP approved via `Enter Multiple Vendor Invoices` (AP Approval) and closed during the subsequent End-of-Day processing. The End-of-Day process closes purchase orders provided the orders have been completely AP approved.**"
- **Maps to:** **batch 21 F642** (*"if TPA is active on your system, this tab is inactive"* — TPA left
  undefined; **inference I-104 now confirmed**) · run 02 / run 04 (purchase orders) · W-041, W-052.

> **Batch 21 recorded `TPA` as an undefined term and I-104 as an unadopted guess. It is confirmed
> here: Third-Party Accounting.** The term is struck from the undefined list.
>
> **Its reach is now three documented behaviours**: it inactivates bank reconciliation, it inactivates
> EFT/positive-pay/virtual-card processing (batch 21 F642), and **it changes the purchase-order
> lifecycle** — receipt no longer closes a PO; AP approval plus the next End of Day does.
>
> **That third one is a state-machine change, not a feature toggle**, and it is the most significant:
> under TPA the PO has an extra state between received and closed. **A rebuild must know whether LA
> Mattress runs TPA before modelling PO closure at all.** Promoted in §H to a top live-system
> question.
>
> **Ninth End-of-Day responsibility**: closing fully-approved purchase orders.

### FINDING 666 — Every destructive routine in this subsection confirms before acting, and one logs

- **Invariant:** each purge or overwrite prompts; only the sensitive-data purge is documented as writing an audit trail.
- **Evidence** — collected verbatim:
  > `Purge of Sensitive Data`: *"The program prompts you to verify that you want to run the purge"* — **and** *"audit comments are generated that are stored in the STORIS Log and Customer Activity Log."*
  > `Remove Sales Orders Not Processed Correctly`: *"This process will void all orders not processed correctly. Continue?"*
  > `Copy Live Data to Learn Account`: *"Enter 'Yes' if you are ready to proceed."*
  > `Purge Special Order and Obsolete Products`: build a list, then *"choose Run to perform the Action Type selected."*
  > `Import Data`: `Authorized to Run Live` + `Sample Amount`.
  > `Purge General Ledger Data`: no parameters; range derived and display-only.
  > `Purge Costing Audit Data`: **no confirmation and no audit log documented.**
- **Maps to:** F652, F655 · batch 16 F561 (`Track`/`Review Settings Activity`) · W-064.

> **Confirmation is near-universal; auditing is not.** Of seven destructive routines, **one documents
> an audit trail** — the sensitive-data purge, which needs one for privacy compliance. The GL purge,
> the costing-audit purge and the nightly order void are documented with **no record of what they
> removed**.
>
> **That is the gap to close in the rebuild, and it is cheap:** every destructive operation should
> write what it deleted, on whose authority, under what criteria — the exact pattern F652 already
> demonstrates. STORIS built the right mechanism and applied it once.
>
> **The safety-design spectrum across this subsection, worth carrying as a rebuild reference:**
>
> | Routine | Scope control | Confirm | Audit |
> |---|---|---|---|
> | Purge of Sensitive Data | per-type retention + permission | yes | **both logs** |
> | Purge GL Data | derived, display-only, self-disabling | — | not documented |
> | Purge Special Order/Obsolete | build-list, review, then act | yes | not documented |
> | Import Data | sample + `Authorized to Run Live` + security | yes | not documented |
> | Copy Live to Learn | STORIS personnel only | yes | not documented |
> | Remove Sales Orders Not Processed | none — **also runs nightly** | yes (on demand) | count only |
> | **Purge Costing Audit Data** | **none; blank = everything** | not documented | not documented |

---

## C. Screen and field inventory (additions)

Field lists inline above.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Maintain History Years` | General Ledger Control Settings | The entire scope of the GL purge (F654) |
| `Costed Auditing Data` | Costing Control Settings | Cost-audit retention; auto-purged at month end (F655) |
| `Retain Settled Card Number for NN Days` | **Payment Card and Device Settings** | Enables the credit-card purge (F653) |
| `Customer Retention Months` | POS Control Settings | Invoice-history retention, gating product purge (F664) |
| `Days With No Activity` | Purge Special Order and Obsolete Products | Last-sold cutoff for purge eligibility (F664) |

---

## E. Security permissions catalog (additions)

| Permission | Record | Effect |
|---|---|---|
| **`Purge secured/encrypted data`** | **System Security** | Required to run the sensitive-data purge (F652) |
| *(per-import-process settings)* | **Import Data Security** | Gate each conversion; denial routes to the Security Override Screen (F662) |

---

## F. State machines and enumerations (additions)

**Purgeable sensitive data types** — six: Credit Card · Social Security · Finance Account ·
Checking Account · Date of Birth · Driver's License (F652).

**Convertible file pairs** — PO · RR (receivings) · INV · SO · Order, each header + detail (F662).

**Purchase order closure** — **differs under TPA**: normally closed on receipt; under Third-Party
Accounting, received → AP-approved → closed by End of Day (F665).

**End-of-Day responsibilities, cumulative: nine** — release credit holds · drive notifications ·
reserve hard kits · raise replenishment POs · expire reward points · report new zip codes ·
void incorrectly-processed orders · close AP-approved POs · reduce phantom backlog.

---

## G. Sequencing rules (additions)

**Retention chains, three deep** (F664): product purge ← invoice history retention (POS Control
Settings) + costing data retention (Costing Control Settings) ← closed-order purge.

**Build-list-then-act** (F664) — the safest destructive pattern in the product.

**Derived-scope destructive routines** (F654) — the operator cannot widen the blast radius.

**Phantoms drain during the day so End of Day has less to do** (F657) — the batch calendar and the
phantom pool are one design.

---

## H. Open questions and gaps

1. **`Purge Costing Audit Data` deletes everything when run with no dates** (F655), with no
   documented confirmation and no audit log — destroying the substrate of the audit's most
   consequential chain (F656). **The batch's top item. Do not reproduce this default.**
2. **Does LA Mattress run Third-Party Accounting?** (F665). It changes the PO state machine and
   disables two banking subsystems. **Must be answered before modelling PO closure.**
3. **What does "not processed correctly" mean?** (F663). A nightly job voids documents on undefined
   criteria.
4. **Which platform?** (F661) — Windows / AIX / SCO / HP. Determines whether test-environment refresh
   is self-service.
5. **`Payment Card and Device Settings`** (F653) — likely the PCI control record; unread.
6. **`Order Completion Exceptions`** (F659) — where permanently-failed completions land; unread.
7. **Are GL, costing-audit and order-void purges logged anywhere?** (F666). Not documented.

**Resolved this batch**

8. **`TPA` = Third-Party Accounting** (F665). Batch 21 F642's §H item closed; **I-104 confirmed and
   promoted to fact.**

**Inferences**

- **I-106** — "orders not processed correctly" (F663) are probably those whose completion exhausted
  `Maximum Completion Attempts` (F659). **Two adjacent facts; no article connects them.**

---

## I. Unknown unknowns

- **A `Learn` account exists** as a parallel data system (F661), with `Log To Additional Account` in
  the listing. Environment topology the audit has not mapped.
- **`Secured Data` is a separate encrypted file** with co-applicant as a first-class party (F652).
  The customer master articles never mention it.
- **Settings fields naming subroutines** (F657) — `Extra Information Display Subroutine Name`,
  `Extra Cleanup Subroutine Name`. Second instance of vendor code selected by configuration.
- **A data warehouse exists** — `Resync Data Warehouse`, `Report on Data Warehouse Activity` in the
  listing, unread. Potentially the cleanest extract path for the rebuild.
- **A time clock module exists** — `Access Time Clock`, `Override Time Clock Entry`. Payroll-adjacent,
  never mentioned in seven runs.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **`Secured Data`** | The segregated encrypted store for six PII types, per customer and co-applicant |
| **Costed auditing data** | The audit trail written by every inventory and cost event |
| **Phantom** | A continuously-running background consumer draining a work queue during the day |
| **Auto Start/Stop** | The supervisor that sizes the phantom pool from queue depth and reaps dead registrations |
| **`TPA` / Third-Party Accounting** | External accounting integration; disables bank reconciliation and payment files, and defers PO closure to AP approval + EOD |
| **Learn account** | A parallel data system used for training and testing |

---

## Contract adjudication — batch 22

| Contract | Verdict | Basis |
|---|---|---|
| **W-023** *(purge / retention)* | **CONFIRMED — and it is a dependency graph, not a policy** | F654, F655, F664 |
| **W-041** *(batch calendar)* | **CONFIRMED — nine EOD responsibilities; phantoms are the day-shift half** | F657, F663, F665 |
| **W-050** *(access control)* | **CONFIRMED** | `Purge secured/encrypted data`; Import Data Security with override (F652, F662) |
| **W-052** *(GL)* | **CONFIRMED** | Derived-scope GL purge across all companies (F654) |
| **W-061** *(cost)* | **CONFIRMED — the substrate named** | Every inventory event writes costed auditing data (F656) |
| **W-064** *(auditability)* | **CONTRADICTED in part** | Only one of seven destructive routines documents an audit trail (F666) |
| **W-051** *(platform / licensing)* | **CONFIRMED** | Four platforms named; TPA changes the PO state machine (F661, F665) |
| **Asynchronous order completion** | **NEW — no contract covers it** | F659 |
| **Vendor code named in settings fields** | **CONFIRMED as a pattern** | F657 + batch 19 F614 |

---

## Next — batch 23

**Vendor Settings tail** (~77 unread) — FOB, collection, buying groups, volume rebates, return-to-vendor
tax, `Vendor Ship From Replacement Cost Settings`, the four `Advanced Vendor Category and Group
Exception Settings` variants.
