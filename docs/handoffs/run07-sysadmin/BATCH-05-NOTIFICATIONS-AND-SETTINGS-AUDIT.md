# Run 07 — System Administration — Batch 5: The notification system, and auditing the settings

Status: complete. Findings 391–401. Read-only throughout. No setting saved, no auditing toggled.

**This batch answers a question the audit has raised in three separate runs**: *"no article anywhere
describes how STORIS notifies people"* (run 06 §I, repeated in run 07 F388). There is one. There are
several.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **STORIS Messenger Control Settings** | 15186501104788 | read — **eight automatic message triggers** |
| 2 | **Event Notification Control** | 16918023610516 | read — **per-event, per-audience, per-method** |
| 3 | **System Notifications** | 15186452148500 | read — **names the database** |
| 4 | **Track Settings Activity** | 15185876708884 | read — *(in User Settings, not System Control Settings)* |

---

## B. Wiring findings

### FINDING 391 — STORIS Messenger has eight named automatic message triggers, and each also writes an audit comment

- **Invariant:** the messenger fires on eight business events, and each message leaves a document comment.
- **Evidence** — `STORIS Messenger Control Settings`, **Messaging** tab, verbatim:
  > **`When a Special Order Item is Received`** · **`When Back-Order is filled by Linked Purchase Order`** ·
  > **`Purchase Order Delivery Date Changes`** · **`When Received Merchandise Could Not be Reserved`** ·
  > **`To Buyer When Purchase Order Is`** · **`When a One-Time-Buy Purchase Order is Received`** ·
  > **`When Received Merchandise is Reserved`** · **`When an EOD/EOM Processing Error is Reported`**
  And:
  > "When an automatic e-mail is generated based upon any of the three following settings, **an audit comment is also written to the order document** indicating when the message was sent. The comment includes the **date, time, location, user initials, and subject** (how order has been filled) of the e-mail sent to the employee."
- **Maps to:** run 04 F228 (*"a mail message is sent to the buyer"*) — **the setting, at last** ·
  run 05 F291, F292 · run 06 F317–F322 — **all converge**; `W-042`; `W-064`.

> **Run 04 batch 6 found one clause about mailing a buyer on an over-receipt** and flagged an
> undocumented internal messaging system as a run-level open question. Run 05 named it. Run 06
> documented the application. **This is the trigger list**, and **`To Buyer When Purchase Order Is`**
> is the setting behind that original clause.
>
> Six of the eight triggers are **inventory-arrival events** — special order received, back-order
> filled by a linked PO, received merchandise reserved, received merchandise **not** reserved,
> one-time-buy received, PO delivery date changed. **The messenger is primarily a
> goods-have-arrived notifier**, which is exactly the wiring run 05 F292 found from the service side
> (*"a part arriving on a receiving dock notifies three people on a service order"*).
>
> **`When Received Merchandise Could Not be Reserved` is the important one.** Batch 2 F357 established
> a reservation queue where a line can lose out to orders ahead of it. **This is how anyone finds
> out.** Without it, run 04 F179's silently-dropped orders and batch 2's queue losses are invisible.
>
> **`When an EOD/EOM Processing Error is Reported`** makes the messenger part of operations
> monitoring — the nightly batch reports its own failures through internal mail.
>
> And once again, **the message writes an audit comment**: the eleventh sighting of free-text-as-record
> across the audit — though this one is well-structured (date, time, location, user initials, subject).
> Note the vendor's own text says *"any of the three following settings"* and then lists **four**.
> **Stale prose against the field list**, the second instance in run 07 after F338.

### FINDING 392 — Messenger retention is three separate counters, and a login-time review switch

- **Invariant:** inbound/outbound, tasks and closed messages age out independently.
- **Evidence** — `STORIS Messenger Control Settings`, **General Information** tab:
  **`Closed Retention Days` · `Inbound /Outbound Retention Days` · `Task Retention Days` ·
  `Message Review at Login`**
- **Maps to:** run 06 F326 — **corrects it**; `W-064`.

> **Run 06 F326 concluded that `Purge Messenger Activity` was the audit's only retention chain with
> *no named setting*** — *"message retention is somebody's habit, not a configuration."*
>
> **That was wrong**, and it was wrong for the same reason as run 03's rewards conclusion: the setting
> was in a section the queue had not reached. **There are three counters**, and tasks are retained
> separately from mail — which matters because run 06 F319 showed service tickles *are* tasks.
>
> **`Message Review at Login`** forces the mailbox in front of the user at sign-in — the mechanism that
> makes the messenger a work queue rather than an inbox people forget.

### FINDING 393 — Event Notification Control is a per-event, per-audience, per-method notification matrix

- **Invariant:** each business event can notify three audiences, each by a chosen method, with its own template.
- **Evidence** — `Event Notification Control`:
  > "Use this routine to view detailed information on the event selected from **Data Capture Notifications** in **Notifications Control Settings**."
  Structure, three times over — for **`Customer`**, **`Salesperson`**, and **`Other`**:
  **`Method`** → *(email)* **`ELP Form` · `Subject` · `Format` · `Body ELP Form`** ·
  *(text)* **`Verbiage`** · and for Other, **`Phone`**.
  > "While these settings are associated to Customer Email, **they are active regardless of email being the selected as the method** used to the event."
- **Maps to:** run 06 §I (*"no article anywhere describes how STORIS notifies people"*) — **answered**;
  run 07 F374 (`ELP`); run 05 F300 (flexEngage); `W-042`.

> **This is the notification system.** Six runs found six channels incidentally and the audit twice
> recorded that nothing described them as a system. `Notifications Control Settings` holds a
> **`Data Capture Notifications`** list of events, and each event gets this screen: **who is told,
> how, and with which template.**
>
> The three audiences are the right three for a retailer — **the customer, the salesperson who sold
> it, and "other"** (an internal role, presumably configured per event). Run 05 F313 found seven
> screens for viewing open service orders by six different interested parties; this is the same
> instinct applied to outbound messaging.
>
> **Three methods: email, text, phone.** SMS is a documented channel, which nothing in six runs
> suggested.
>
> **`ELP Form` and `Body ELP Form`** partially resolve run 07 F374's undefined `ELP`: it is a **form or
> template system for electronic notifications**, with separate templates for the wrapper and the body.
> The term itself is still not expanded. **Fifteenth undefined term, downgraded to partly understood.**
>
> The repeated note is a real gotcha: **the email-labelled settings are active whatever method is
> chosen.** So a site that switches an event to SMS still has live email templates, and vice versa.

### FINDING 394 — `Track Settings Activity` audits settings changes at file granularity, and turning it off destroys the history

- **Invariant:** settings auditing is per-file, all-or-nothing, retention-bounded, and destructive to disable.
- **Evidence** — `Track Settings Activity`, complete body:
  > "Use this routine to create an **audit trail of edits made to selected settings routines**. You can then use the **Review Settings Activity** routine to report on changes to the selected files."
  > "**Data conversion imports also update audit comments.**"
  > "**The system does not audit specific attributes.** That is, when auditing is on for a particular file, the system **audits all attributes** maintained in the settings routine."
  > "**If you turn off auditing for any files, STORIS deletes all audit records associated with those files.**"
  **`Log Retention _ days`** · Grid Information.
- **Maps to:** run 07 F368 (named as a promise) — **delivered**; `W-064`; `W-050`.

> Batch 3 F368 called this *"the highest-priority unread routine in run 07"* on the grounds that seven
> runs had catalogued what settings do and never asked who changes them. **It exists, it works at file
> granularity, and it has one alarming property.**
>
> **Turning auditing off for a file deletes that file's entire audit history.** Not archives —
> deletes. So the audit trail is only as good as the least-recent decision to keep auditing that file,
> and **anyone wanting to hide a settings change can erase the record by toggling a checkbox.** That
> is a genuine control weakness and it is stated plainly by the vendor.
>
> This joins run 04's four irreversible steps and run 06 F326's purge as **the fifth destructive
> operation the audit has found with no permission named on it.**
>
> **All-or-nothing per file** means enabling auditing on `Point of Sale Control Settings` captures all
> ~250 fields — which is the right default given run 07 F337's finding that the record *is* the
> business configuration.
>
> **"Data conversion imports also update audit comments"** is directly relevant to our cutover: **a
> migration that writes settings will appear in this trail**, which is useful for provenance and means
> the trail is not purely human activity.
>
> **`Review Settings Activity`** is the reporting counterpart, named and unread.
>
> Note the location: this article is in **User Settings**, not System Control Settings, which is why
> the audit did not find it while enumerating control records.

### FINDING 395 — The database is UniData, and its licence expiry is separately notified

- **Invariant:** STORIS runs on UniData, whose licence has its own expiry warning.
- **Evidence** — `System Notifications`:
  > "The section **UniData License Expiration Notification** also has the controls Number of Days and Send Notification To. You can set Number of Days to be between **0 and 185**, with the default value being **45**."
  > "When a user logs in, if their **UniData license** is set to expire within the Number of Days… they are presented with the message, "**The UniData license for this server is due to expire on <expiration date>. This system will not be usable after that date.**""
  > "This setting **defaults to the `System Admin ID` setting in the Security tab of General System Control Settings**."
- **Maps to:** run 06 F327 (concurrent licensing) · run 07 F377 (STORIS licensing) · run 07 F386
  (AIX, SaaS) — **the platform stack**; **NEW**.

> **UniData** — a multivalue database — is named for the first time in seven runs, and it explains a
> great deal that the audit recorded as odd.
>
> The **dotted-uppercase file names** (`BTA`, `PRODUCT.HISTORY`, `DAILY.DETAIL`, `ROUTE.EXCEPTION`,
> `SYS.ENCRYPT.DECRYPT.PTM`) are **UniData file names** — run 03 batch 16 inference **I-17** guessed
> exactly that and could not confirm it. **I-17 is now confirmed.**
>
> The **"phantom"** terminology is UniData's own word for a background process, which independently
> confirms batch 3 inference I-66 and finally retires run 04's I-43.
>
> And **multivalue data** explains the audit's recurring encounters with fields that hold lists —
> `Multiple Value Indicator` in the import tokens (run 07 F389), the multi-select windows, and
> STORIS's habit of putting several values where a relational design would use a child table.
>
> **Three licence layers now stack**: STORIS licence *(F377)* · UniData licence *(here)* · concurrent
> user count *(run 06 F327)*. Each expires or exhausts independently, and each has its own warning.
> **All three are parallel-run risks.**

### FINDING 396 — "Period overlap" means accounts become inaccessible, and it is warned about at log-in

- **Invariant:** an accounting-period condition can lock users out, with a configurable advance warning.
- **Evidence** — `System Notifications`:
  > "Use this process to set notifications for **period overlap** as well as license expiration… **This notification functionality can help anticipate prevent accounts from becoming inaccessible.**"
  > "For both **Account in Overlap** and **License Expiration**, if the current date is within the **Number of Days** before **the end of the period** or before the license is set to expire… a **SCiX notification message** is displayed to all users set in the associated **`Send Notification To`** setting."
  `Number of Days`: **0 to 999**, default **7**.
- **Maps to:** run 06 F327 — **the phrase is now explained**; run 01 (period close); `W-012`.

> Run 06 F327 found the phrase *"the account becomes inaccessible due to period overlap"* and recorded
> it as an unexplained hint. **The meaning is that an accounting period can end and leave accounts
> unusable**, and STORIS warns a named list of users in advance.
>
> That connects the audit's most infrastructural finding to its most accounting one: **run 01's period
> close is not just a reporting boundary — it can lock the system.** Combined with run 04 F221's
> finding that a physical inventory must be updated before EOM or the freeze date becomes unreachable,
> **period end has at least two hard consequences**, and both are the sort of thing a cutover schedule
> must be built around rather than into.
>
> **`SCiX`** is named as the notification surface — the client, per run 07 F386's `SCiX AU Deployment`
> path. So **a seventh notification channel**: SCiX log-in messages.

### FINDING 397 — The notification landscape is seven channels, and now partly mapped

- **Invariant:** STORIS notifies through at least seven distinct mechanisms with different governance.
- **Evidence**, assembled across runs 04–07:

| # | Channel | Governed by | Audit trail |
|---|---|---|---|
| 1 | **STORIS Messenger** *(internal mail and tasks)* | `STORIS Messenger Control Settings` — 8 triggers, 3 retentions | audit comment on the document (F391) |
| 2 | **Event Notification Control** *(customer/salesperson/other; email, text, phone)* | `Notifications Control Settings` → Data Capture Notifications | not stated (F393) |
| 3 | **flexEngage digital receipts** | `Digital Receipts Interface` + per-location enable | two possible order comments (run 05 F300) |
| 4 | **`ELP`** *(tracking notifications, and the form system behind #2)* | `EDI Control Settings` → Tracking Number Notification | not stated (F374, F393) |
| 5 | **SCiX log-in messages** | `System Notifications` | none (F396) |
| 6 | **EOD completion email** | `EOD Completion Email Address` | none (run 07 F388) |
| 7 | **The envelope icon** *(local mail client)* | nothing | **explicitly none** (run 05 F301) |

- **Maps to:** run 06 §I; run 07 F388 — **the open question is now largely closed**.

> Six runs found these one at a time and twice recorded that **no article describes how STORIS notifies
> people.** That remains true — there is still no overview — **but the landscape can now be drawn**,
> and drawing it shows the problem the audit suspected: **seven channels, five governing records, and
> wildly inconsistent auditability.**
>
> Channel 1 writes a structured comment. Channel 3 writes two possible comments. Channels 2, 4, 5 and 6
> say nothing about records. **Channel 7 explicitly writes nothing** — and it is the easiest to use.
>
> For the rebuild the instruction is straightforward and worth stating: **one notification service,
> one audit record, one place to answer "was the customer told?"** STORIS cannot answer that question
> today, and neither will we if we reproduce this.

### FINDING 398 — Notification recipients are user-ID lists that default to the system administrator

- **Invariant:** system-level warnings go to a configured list, defaulting to one account.
- **Evidence** — `System Notifications`:
  > "The **`Send Notification To`** field accepts **one or more user IDs**. If multiple users are selected, **ellipses are displayed**; otherwise, initials of the single user are displayed. **If this field is blank, no notification is sent.**"
  > "This setting **defaults to the `System Admin ID`** setting in the Security tab of General System Control Settings."
- **Maps to:** run 07 F380 (`System Admin ID`); F396; `W-050`.

> **Blank means silence.** A licence expiry or period overlap with an empty recipient list produces no
> warning at all — and the system becomes unusable on the date with no notice. That is a
> configuration trap of exactly the shape run 04 F178 found with reason codes: **a feature that
> requires two things and fails silently on one.**
>
> The default to a single `System Admin ID` is sensible and fragile: **if that person leaves and the
> account is disabled, the warnings go nowhere.**

### FINDING 399 — Auditing settings has its own retention, so the audit trail expires

- **Invariant:** settings-change history is bounded by a days counter.
- **Evidence** — `Track Settings Activity`: **`Log Retention _ days`**.
- **Maps to:** F394; `W-064`.

> A **days** counter, like `Keep Status Data for Days` (run 07 F382) and the five-day log retention
> (run 07 F385) — where most of STORIS's history counters are in **months**. **Operational and
> diagnostic history is short; business history is long**, which is a coherent policy and one worth
> knowing before promising any retrospective analysis.
>
> Combined with F394's delete-on-disable, **the settings audit trail has two independent ways to
> vanish.**

### FINDING 400 — Messenger triggers reach purchasing, receiving and the nightly batch, but not sales or delivery

- **Invariant:** the messenger's eight triggers cluster in one part of the business.
- **Evidence** — the trigger list in F391, mapped:

| Domain | Triggers |
|---|---|
| **Receiving / inventory arrival** | special order received · back-order filled by linked PO · received merchandise reserved · received merchandise **not** reserved · one-time-buy received |
| **Purchasing** | PO delivery date changes · to buyer when PO is *(condition unstated)* |
| **Operations** | EOD/EOM processing error |
| **Sales, delivery, service, AR** | **none** |

- **Maps to:** F391; run 05 F292 (the service tickle matrix); `W-042`.

> **Nothing in sales, delivery, service or receivables fires a messenger message from this record** —
> yet run 05 F292 documented a six-condition, three-role tickle matrix for service, and run 06 F319
> showed those tickles *are* messenger tasks.
>
> So **there are at least two independent trigger systems feeding the same inbox**: this record's eight
> purchasing/receiving events, and Customer Service's own tickle configuration in `Service Control
> Settings`. Delivery and sales have neither — which is consistent with run 04's finding that
> logistics exceptions surface as **reports**, not messages.
>
> That is a real architectural observation: **STORIS notifies about goods arriving and processes
> failing; it reports about goods moving and orders going wrong.** The choice of channel per domain
> looks historical rather than principled, and a rebuild should decide it deliberately.

### FINDING 401 — `Notifications Control Settings` is the parent record, and it is unread

- **Invariant:** event notifications are configured from a list held in a separate control record.
- **Evidence** — `Event Notification Control`:
  > "Use this routine to view detailed information on **the event selected from Data Capture Notifications in `Notifications Control Settings`**."
  `Notifications Control Settings` is article **15186452992660** in this subsection.
  Related: **`Membership Reward Settings`** · **`External Communications Settings`**.
- **Maps to:** F393; run 07 F343 (two loyalty programs); run 05 F300; `W-042`.

> Recorded so the gap is explicit: **F393 documents the per-event screen; the list of events lives in
> a record the audit has not yet opened.** So *what* STORIS can notify about is still unknown; only
> *how* is now clear.
>
> Two related articles are worth flagging. **`Membership Reward Settings`** is a second loyalty record
> beside `Customer Rewards Control Settings` — **consistent with run 07 F343's finding that rewards
> and membership are two programs**, and it is where the membership half presumably lives.
> **`External Communications Settings`** is named as flexEngage's home (run 07 F374) and remains
> unread.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **STORIS Messenger Control Settings** *(tabs: General Information, Messaging)* | Closed Retention Days · Inbound/Outbound Retention Days · Task Retention Days · Message Review at Login · **Send Message** *(8 triggers, F391)* |
| **Event Notification Control** | Event · **Customer**: Method · Customer Email *(ELP Form, Subject, Format, Body ELP Form)* · Customer Text *(Verbiage)* · **Salesperson**: same shape · **Other**: Method · Other Email *(ELP Form, Subject, Format, Body ELP Form)* · Other Text *(Verbiage)* · **Phone** |
| **System Notifications** | **Account in Overlap** *(Number of Days 0–999, default 7 · Send Notification To)* · **License Expiration** *(same)* · **UniData License Expiration Notification** *(Number of Days 0–185, default 45 · Send Notification To, defaulting to System Admin ID)* |
| **Track Settings Activity** | **Log Retention _ days** · Grid *(files selected for auditing)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **8 message triggers** | STORIS Messenger Control Settings → Messaging | Automatic internal mail on receiving/purchasing/EOD events (F391) |
| **Closed / Inbound-Outbound / Task Retention Days** | STORIS Messenger Control Settings | **Corrects run 06 F326** (F392) |
| **Message Review at Login** | STORIS Messenger Control Settings | Forces the mailbox at sign-in (F392) |
| **Data Capture Notifications** | **`Notifications Control Settings`** *(unread)* | The event list behind Event Notification Control (F401) |
| **Log Retention _ days** | Track Settings Activity | Settings-audit retention (F399) |
| **Number of Days / Send Notification To** ×3 | System Notifications | Period-overlap, STORIS licence, UniData licence warnings (F396, F398) |

---

## E. Security permissions catalog (additions)

No new permission names. **Two governance observations:**

- **Disabling settings auditing deletes the history** (F394) — destructive, **no permission named**.
  The fifth such operation in the audit.
- **`Send Notification To` blank = silence** (F398) — a single empty field disables system-critical
  warnings.

---

## F. State machines and enumerations (additions)

- **Messenger automatic triggers (8)** (F391).
- **Notification audiences (3):** Customer · Salesperson · Other (F393).
- **Notification methods (3):** email · text · phone (F393).
- **Notification channels across the audit (7)** (F397).
- **Licence layers (3):** STORIS · UniData · concurrent users (F395).
- **Retention granularity:** operational/diagnostic in **days**, business history in **months** (F399).

---

## G. Sequencing rules

1. Merchandise received → per the eight triggers, **a messenger message is sent and an audit comment
   written** to the order (F391).
2. EOD/EOM error → **messenger message** (F391).
3. Log-in → **`Message Review at Login`** may force the mailbox (F392); **period-overlap, STORIS
   licence and UniData licence warnings** display to their configured recipients (F396, F395).
4. Settings file edited → **audit record**, retained for `Log Retention` days; **auditing disabled →
   all records for that file deleted** (F394, F399).

---

## H. Open questions and gaps

### Resolved this batch

- **"No article describes how STORIS notifies people"** (run 06 §I, run 07 F388) — **largely closed**
  by F391, F393 and the F397 map.
- **`To Buyer When Purchase Order Is`** — run 04 F228's buyer mail, four runs later (F391).
- **Run 06 F326** — *"the first retention chain with no named setting"* — **corrected**: there are three
  (F392).
- **Run 03 batch 16 inference I-17** *(dotted-uppercase names are physical file names)* — **confirmed**
  by UniData (F395).
- **Run 04 inference I-43** *(a phantom is a placeholder record)* — **retired**; batch 3 **I-66
  confirmed** (F395).
- **"Period overlap"** (run 06 F327) — explained (F396).

### Newly opened

- **`Notifications Control Settings`** — the parent event list. **Priority read** (F401).
- **`Review Settings Activity`** — the reporting half of the settings audit (F394).
- **`Membership Reward Settings`** — the second loyalty record (F401).
- **`External Communications Settings`** — flexEngage's home, named twice now, still unread.
- **`To Buyer When Purchase Order Is`** — the trigger name is truncated in the field list; **the
  condition is not stated.**
- **`ELP`** — still not expanded, but now understood as a **form/template system** (F393).

### Inferences (recorded as inference, not fact)

- **I-70:** `ELP` is a templating system for electronic notifications, given `ELP Form` and
  `Body ELP Form` appear for every audience and method. *The acronym is never expanded.*
- **I-71:** `Notifications Control Settings`'s `Data Capture Notifications` list is what makes an
  "event" available to `Event Notification Control`. *Stated as the navigation path; the list's
  contents are unknown.*

---

## I. Unknown unknowns

- **The settings audit trail can be erased by a checkbox** (F394). Seven runs mapped what settings do;
  the one mechanism that records who changed them **destroys its own history when disabled**, with no
  permission named. For a cutover investigation that is the difference between a provenance trail and
  none.
- **Two independent trigger systems feed one inbox** (F400), and four business domains have neither.
  The choice of notify-versus-report per domain looks historical.
- **Three independent licence layers** (F395), each with its own expiry, its own warning, and its own
  recipient list that can be blank. **Any one of them can stop the system on a date nobody was told
  about.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **UniData** | The underlying multivalue database; source of dotted-uppercase file names and "phantom" |
| **SCiX** | The STORIS client; carries log-in notification messages |
| **Data Capture Notifications** | The event list in Notifications Control Settings |
| **`ELP Form` / `Body ELP Form`** | Notification templates, wrapper and body |
| **Account in Overlap** | Period-end condition that can make accounts inaccessible |
| **Track Settings Activity** | Per-file settings-change auditing; **disabling deletes the history** |
| **Review Settings Activity** | Its reporting counterpart |

---

## Contract adjudication — batch 5

| Contract | Verdict | Basis |
|---|---|---|
| **W-042** *(propagation and notification)* | **CONFIRMED — the notification landscape is now mapped** | F391, F393, F397 |
| **W-064** *(retention)* | **CONFIRMED, and run 06 F326 corrected** | Three messenger counters (F392); settings-audit retention (F399) |
| **W-012** *(dates and periods)* | **CONFIRMED** | Period overlap can make accounts inaccessible (F396) |
| **W-050** *(access control)* | **CONFIRMED, with a weakness** | Settings auditing is destructible without a named permission (F394) |
| **Internal messaging** | **NEW — trigger list complete for this record** | F391 |
| **Notification architecture** | **NEW — seven channels, five governing records, inconsistent auditability** | F397 |
| **Platform** | **NEW** | UniData, SCiX, AIX, SaaS (F395) |

---

## Next — batch 6

`Notifications Control Settings` · `External Communications Settings` · `Membership Reward Settings` ·
`Terminal Settings` · `Bar Code Control Settings` · `Purchasing Control Settings` — then a coverage
statement closing **System Control Settings** (87) and opening **User Settings** (49), where
`Track Settings Activity` was found and where the `Create a User/Group Actions - <Module> Security`
records live.
