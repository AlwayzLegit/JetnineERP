# Run 06 — Getting Started — Batch 1: STORIS Messenger, the security override, and log-in

Status: complete. Findings 316–327. Read-only throughout. No message sent, no override attempted,
no location switched.

**This batch closes two of the audit's longest-standing gaps**: the internal messaging system named
in run 05 F291 and inferred in run 04 F228, and the security override referenced in all five prior
runs and documented in none.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Security Override Screen** | 15238875826708 | read — **the mechanism, at last** |
| 2 | **Send/Review Mail Messages** | 15201790087316 | read — **the Messenger model** |
| 3 | Message Review Screen | 15201789993876 | read |
| 4 | Message Review Action Options | 15201789994388 | read |
| 5 | Messenger Group Settings | 15201790083988 | read |
| 6 | Messenger Staff Assignment | 15201789993364 | read |
| 7 | **User Log In Screen** | 15238875800468 | read — **the security posture, and PCI** |
| 8 | Switch User Location | 15238875799060 | read |

`Reply or Forward Mail Messages` is the child window of F318's Reply and Forward actions; its content
is given in `Message Review Action Options` and it is not read separately.
**STORIS Messenger: 5 of 6 read.**

---

## B. Wiring findings

### FINDING 316 — The security override is one screen with a three-case field matrix, and it records who authorised it

- **Invariant:** an override is a second user's credentials, a reason, or both, decided by what the acting user lacks.
- **Evidence** — `Security Override Screen`:
  > "This screen appears when **security restrictions have been applied to the routine, screen, or field** you are attempting to access **or when a reason code is required**. If an override is required, **a user with security access (granted via the User or User Group files) must enter their STORIS user code and password**… **The system notes the user who authorizes each security override.** The system allows you **three attempts**… If unsuccessful, the system returns you to the previous screen."
  > "**Your security settings and price variance settings determine which of the following fields appear**:
  > – **no access permission + reason code required** → User ID, Password, **and** Reason Code
  > – **access permission + no reason code required** → User ID and Password only
  > – **access permission + reason code required** → **Reason Code only**"
  Fields: User ID · Password · Reason Code · **`Security Requirement`** · **`Authorized Action`** ·
  **`Exception`**.
- **Maps to:** `W-050` (access control) — **CONFIRMED; the mechanism referenced in five runs is now
  documented**; `W-039`.

> Every prior run has said "a security override is required" and moved on. **This is the override.**
> It is a single screen, it is the same screen everywhere, and its behaviour is precisely specified.
>
> Three things matter for the rebuild.
>
> **It is a supervisor-credential prompt, not an elevation.** The person standing at the terminal does
> not gain permission; a permitted user types their own code and password into the acting user's
> session. That is why run 04 F265 called it *"manager override credentials"* — the manager walks over
> and types. **We should not implement this as a role escalation**; it is an in-line second signature.
>
> **The authorising user is recorded**, which makes every override in five runs of findings —
> scheduling past the horizon (run 04 F165), As-Is markdown past the cap (F263), route capacity
> (F250, run 05 F296), restricted reason codes (F265) — **an attributable event**. That is a genuine
> audit trail, and it is structured rather than free text, which is unusual for this ERP.
>
> **The reason code and the credential are independent axes.** A user *with* permission can still be
> compelled to give a reason; a user *without* permission may not need one. The third case — permission
> held, reason still required — is the one a naive design misses entirely.
>
> The three display fields are the useful detail: **`Security Requirement`** (what is being enforced),
> **`Authorized Action`** (what is being permitted), **`Exception`** (what is being excepted). The
> screen tells the manager what they are signing for. Values for none of the three are published.
>
> **"price variance settings"** as a named driver of which fields appear ties this directly to run 03
> F13's three-level special-order price variance fall-through. Price variance is one of the things
> this screen is most often called for.

### FINDING 317 — STORIS Messenger is a five-tab internal mail system with document links, tasks, groups and a purge

- **Invariant:** the ERP contains a complete internal messaging application with document attachment.
- **Evidence** — `Send/Review Mail Messages`, tabs: **Inbound · Outbound · Tasks · Closed · New Message**.
  > "Use this routine to create and/or review **communications between STORIS users using the STORIS Messenger**. You can send new internal email messages, review inbound, **track and review outbound**, **link documents to messages sent**, **purge messages**, and track and review **closed** messages (that is, view messages eligible for purging)."
  New Message fields: To · Subject · **`Task`** · Text · **`Linked Document Type`** ·
  **`Document Number`** · **`Mandatory`**.
- **Maps to:** run 04 F228 · run 05 F291 — **both closed**; **NEW** — no contract covers internal
  messaging.

> The subsystem the audit has been chasing since run 04 batch 6. It is not a notification queue — it
> is **a mail application inside the ERP**, with sent-items tracking, a task type, group addressing,
> and a deleted-items folder that feeds a purge routine.
>
> **The document link is the wiring.** A message carries a `Linked Document Type` and `Document
> Number`, and the recipient can jump straight to the order, invoice or purchase order from the
> message. That is how run 04 F228's buyer learns about an over-receipt: a message with the PO
> attached.
>
> **Outbound is tracked with a read/unread status**, so a sender can see whether the recipient opened
> it. In an internal ERP context that is a meaningful control — "I told the buyer" becomes provable.

### FINDING 318 — A task message with a mandatory link cannot be deleted until the linked document is opened

- **Invariant:** the message system can compel a human to look at a document.
- **Evidence** — `Send/Review Mail Messages`:
  > "When you select an item from the grid, you have the option to **execute the attached link via the Link option at the Action field**… The link accesses a STORIS document via **either the Entry or Inquiry process** for that document. For example, for customer service documents, the link is to the **Service Order**."
  > "**To delete a task with a linked document, if the Mandatory option on the New Message tab is enabled for the task, you must first access the linked document before you can delete the task.**"
  And `Message Review Action Options` — the six actions: **None · Reply · Forward · Link · Print ·
  Move Back** *(returns a message from Closed to its original tab)*.
- **Maps to:** F317; run 05 F292 (the tickle matrix); `W-050`.

> **`Mandatory` is the most interesting field in the subsystem.** It converts a message into an
> enforced action: the recipient cannot dismiss it without opening the thing it is about. That is a
> workflow primitive — a soft assignment with a completion check — and it is the only one the audit
> has found anywhere in STORIS.
>
> Note the link resolves to *"either the Entry or Inquiry process"* — so the recipient's permissions
> decide whether they can edit or only look. **The link is permission-aware**, which is why the
> mandatory check is "access the document" rather than "act on it".
>
> **`Move Back`** — undeleting a message from Closed to its original tab — is a small mercy the
> deletion mechanisms in run 04 conspicuously lacked (F222's irreversible physical-inventory clear,
> F225's batch deletion). Messaging is the one place STORIS offers an undo.

### FINDING 319 — Service tickles are Messenger tasks, auto-created and auto-assigned to the coordinator

- **Invariant:** the tickle list is implemented as task messages in the mail system.
- **Evidence** — `Send/Review Mail Messages`, **Tasks** tab:
  > "**If using Customer Service, the system automatically creates task messages for any situation that requires a service employee to be "tickled", and assigns the task to the coordinator.**"
- **Maps to:** run 05 F291, F292 — **the implementation, now visible**; F318.

> Run 05 established *that* tickling needs Messenger. **This says how**: a tickle is a task message,
> generated automatically, addressed to the coordinator, appearing on their Tasks tab with a link to
> the service order.
>
> Combine with F318 and the design is complete and rather good: **a tickle is a task the coordinator
> cannot clear without opening the service order** — provided the generator sets `Mandatory`. The
> documentation does not say whether it does. Section H, and it is the difference between a reminder
> and an obligation.
>
> Run 05 F292's note that *"Task emails will not be assigned to the user who is making the change to
> the line status"* now reads correctly: **"Task emails" are literally Messenger tasks.** The
> terminology in the service article was not loose; it was precise, and the audit could not tell
> until now.

### FINDING 320 — Mail administrators can read other users' mailboxes

- **Invariant:** a user flag grants access to any mailbox.
- **Evidence** — `Send/Review Mail Messages`:
  > "To access **another user's mailbox**, click the Clear button… and enter the ID of the new user into the **`Viewing Mail For`** field. Note that the **Clear button is active only for mail administrators (that is, users with a check at the `Mail Administrator` field in the User file).**"
  Header: `Viewing Mail for` · `Unread Mail` · `Open Tasks`.
- **Maps to:** `W-050` — **CONFIRMED**; F317.

> A **single boolean on the user record** that grants read access to every mailbox in the system —
> including, presumably, the task queues that carry customer and service detail. It is the bluntest
> permission the audit has found in six runs: not scoped by location, not by module, not by
> Regional Processing.
>
> Operationally it is defensible — somebody has to work a departed employee's queue — but it is worth
> raising as a governance question, because **`Mail Administrator` is a flag that a rebuild would
> naturally grant to more people than STORIS's model assumes.**
>
> `Unread Mail` and `Open Tasks` counts in the header make the mailbox a workload indicator, which is
> presumably why an administrator wants to see other people's.

### FINDING 321 — Messenger groups nest, and sending rights are separate from receiving rights

- **Invariant:** a mail group specifies its members and, separately, who may send to it.
- **Evidence** — `Messenger Group Settings`:
  > "For each mail group you create, you can specify **the users and/or mail groups who receive messages sent to the group**, and can **send messages to the mail group**."
  > "**Messenger groups accept only valid STORIS Messenger users as members.**"
  Fields: Group ID · Description · **`Owner`** · **`Type`** · Group Users · Group List.
- **Maps to:** F317; `W-050`.

> Two structural facts. **Groups can contain groups** — *"users and/or mail groups"* — so the address
> book is a tree, not a flat list. And **send rights are a separate list from membership**: you can be
> a member of a group you may not post to. That is a real access-control dimension on a mailing list
> and most systems get it wrong.
>
> `Owner` and `Type` on the group record are unexplained; `Type` is one more unpublished enumeration.
>
> The membership constraint — **only valid Messenger users** — is the third place the audit has found
> a per-user Messenger enablement flag (with F320's `Mail Administrator` and F322's explicit check).
> **Being a STORIS user and being a Messenger user are different things.**

### FINDING 322 — Report distribution runs through Messenger, and assignment fails loudly for users without it

- **Invariant:** report-availability notifications are Messenger messages, gated per user.
- **Evidence** — `Messenger Staff Assignment`:
  > "Use this routine to **assign a user or users to receive a notification that a report is available**. The report(s) can then be viewed via **Review Archived Reports**."
  > "the **Staff** field becomes active, where you can assign one or more staff ID's to associate with the **selected region/district or location**. The default for the Staff field is **All Users**."
  > "**Assignments can be made only if the selected user(s) have STORIS messenger enabled.** Otherwise, a message appears… "**N selected staff IDs do not have Messenger enabled.**""
  Returns to the **`Cycle Module Multi-Print Assignment Screen`**.
- **Maps to:** F317, F321; run 03 (report archive, PRV); `W-050`.

> **A third consumer of Messenger**, after the over-receipt buyer mail (run 04 F228) and service
> tickles (F319): **scheduled report distribution.** Reports are produced by a cycle process, archived,
> and their availability is announced by Messenger to staff assigned per **region, district or
> location**.
>
> That closes a loop from run 01 and run 03, both of which found the report-archive and Personal
> Report Viewer machinery without saying how anyone learns a report is ready. **They are told by
> internal mail.**
>
> The failure message is the useful detail: **assignment is refused, with a count**, for users without
> Messenger. So Messenger enablement is a hard prerequisite for receiving reports — **turn it off for
> a user and they silently stop being told about their reports.** With F321's membership constraint,
> that is now two features that fail for a non-Messenger user.
>
> **`Cycle Module Multi-Print Assignment Screen`** is a new, unread screen — the parent that invokes
> this one. Queued.

### FINDING 323 — Log-in security is four independent settings in one record, with a stated PCI dependency

- **Invariant:** authentication strength is assembled from four General System Control Settings fields.
- **Evidence** — `User Log In Screen`:
  > "**User ID at Login** — if checked you must enter your User ID… **If no check appears, you must still provide a valid ID**… A default response appears."
  > "**Extended Security** — if checked, the **Password field is active** and you must enter a password… If no check appears, **the Password field is inactive**. Note that to activate Extended Security, **a check must appear at the User ID at Login field.**"
  > "**Complex Passwords** — the password you enter must **conform to PCI requirements**."
  > "**Password Expires After __ Days** — the system issues a warning… to users whose password is about to expire or has already expired."
  > "**Passwords are case-sensitive. The password field accepts a maximum of 50 characters.**"
  Plus: *"this screen does not appear during logon if the **Allow Logon Passthrough** field is enabled in the User settings."*
- **Maps to:** `W-050` — **CONFIRMED**; run 04 F228 (Extended Security).

> **`Extended Security` — the record the audit has been citing since run 04 as a cross-module
> permission surface — is, at root, the switch that turns on passwords.** Uncheck it and the password
> field is inactive: STORIS can be run with user identification and no authentication at all.
>
> That reframes every "Extended Security settings" citation in runs 04–05 (over-receiving, WMS
> adjustments, vendor chargebacks, product cost visibility, `Delete/Edit information on open
> transactions`). **Those permissions live in a security layer that is itself optional**, and its
> dependency chain is explicit: Extended Security requires User ID at Login.
>
> **`Allow Logon Passthrough`** bypasses this screen entirely for a given user — a fourth way the
> authentication posture varies per site and per user.
>
> **PCI is named**, which is the first compliance-standard reference in six runs, and it sits next to
> the credit-card handling dissected in run 03 batch 4. Complex Passwords is presumably mandatory
> wherever cards are taken.
>
> For the cutover this is a question to put to the business plainly: **which of these four are on
> today?** The answer determines whether STORIS user accounts are migratable identities or merely
> names.

### FINDING 324 — Log-in binds the user to a location and to four pieces of hardware

- **Invariant:** a session carries a location, a cash drawer, two terminals and a signature device.
- **Evidence** — `User Log In Screen`, fields:
  User ID · Password · **Location** · **`Set as Default Location`** · **Cash Drawer** ·
  **Payment Terminal** · **Tethered Terminal** · **Signature Capture** · **Update Print Settings**.
  > "When you change your default location on this screen, **your log on location is updated in your user settings**."
- **Maps to:** run 03 F99–F101 (cash drawers), F34–F36 (EMV terminals), F53 (signature capture);
  `W-050`.

> **The session is a hardware binding, not just an identity.** Everything run 03 found about cash
> drawer reconciliation, EMV terminal selection and signature ceremonies depends on what was chosen
> at this screen.
>
> Two terminal types — **Payment Terminal** and **Tethered Terminal** — are distinguished here and
> nowhere else the audit has read; `Terminal Settings` is named as the reference and is unread.
>
> `Set as Default Location` writing back to the user record is a small thing with a real consequence:
> **a user's default location drifts as they log in elsewhere**, which matters because Regional
> Processing (upheld as inverted seven times) scopes what they can see.

### FINDING 325 — Switching location mid-session unassigns hardware and pushes a message to background processes

- **Invariant:** a location switch is a partial re-login with documented side effects on four subsystems.
- **Evidence** — `Switch User Location`:
  > "The **Current Location** drop down menu allows the user to switch between different locations **without having to log out**… **all security associated with the chosen location is honored** and internal processing required to allow the user to use the new location is performed."
  > **Cash Drawer Settings** — *"If assigned a cash drawer, the cash drawer is **unassigned** from the user upon login to the new location. If a cash drawer is required, the user is required to use the **Switch User** procedure."*
  > **EMV Terminal Settings** — *"If assigned a payment Terminal ID and the Terminal ID is **not valid for the new location**, the Terminal ID is unassigned"*
  > **Printer Settings** — *"If the assigned a system printer is not valid for the new location, the printer is unassigned and **the output designation changes to use the screen output methodology**"*
  > **Input Processing** — *"Input Processing routines are **background processes**… Once the user's location is changed, **a message is sent to the Input Processing routines** to make the appropriate adjustments for the new location."*
- **Maps to:** F324; run 03 F99–F104; `W-050`.

> **A location switch silently strips your hardware.** The cash drawer goes unconditionally; the
> terminal and printer go if they are not valid at the new location; and the printer failure mode is
> the interesting one — **output falls back to screen**, so a user who switches location and prints
> gets nothing on paper and no error.
>
> The remedy in two of three cases is **`Switch User`** — a distinct procedure from `Switch User
> Location`, named here and **not in the audit's inventory anywhere**. Two similarly-named operations
> with different consequences. Section H.
>
> **`Input Processing` background routines receiving a message** is a second sighting of internal
> messaging, this time machine-to-machine. Whether it uses Messenger or a separate channel is not
> stated — but it confirms that STORIS has asynchronous background processing that must be told about
> session changes, which is a real distributed-state concern for anything we build alongside it.

### FINDING 326 — Deleted messages go to Closed and are purged by a named routine

- **Invariant:** message deletion is a move, and permanent removal is a separate program.
- **Evidence** — `Message Review Screen`:
  > "To delete a message, click the Delete button… **The system moves deleted messages to the Closed folder**, where you can **manually remove them** from the system **or purge them using the `Purge Messenger Activity` program**."
  And `Send/Review Mail Messages`, Closed tab: *"Deleted mail messages are **eligible for purging**"*,
  with `Date` and `Time` **of deletion** recorded.
- **Maps to:** `W-064` (retention) — **CONFIRMED, ninth chain**; F318 (`Move Back`).

> The **ninth** *file → process → purge* chain in the audit — though notably the **first without a
> named retention *setting***. Every other chain (written sales, gift certificates, completed orders,
> `DAILY.DETAIL`, `ROUTE.EXCEPTION`, routing capacity log, Kardex, EDI 215 logs) has a months-or-days
> field in a control record. **`Purge Messenger Activity` appears to be run on demand**, with no
> stated policy field.
>
> That is a real difference: message retention is somebody's habit rather than a configuration. Worth
> confirming, because messages carry linked documents and task history.

### FINDING 327 — License availability is checked at log-in, and running out is a recoverable condition

- **Invariant:** concurrent licences are a scarce resource with a documented recovery path.
- **Evidence** — `User Log In Screen`:
  > "If you have permission to access **Recover STORIS Licenses** and **no licenses are available** when logging in, a message appears with the option to **free up a license** via the Recover STORIS Licenses process. **Otherwise, you are logged out.**"
  > "If the **Notify of License Expiration** setting on the **Security tab of Create a User** is enabled and the STORIS License is set to expire, the **Acknowledge Message** window appears after login."
  > "Use the **System Notification** window to send alerts to specified users **before the license expires and/or the account becomes inaccessible due to period overlap**."
- **Maps to:** F317 *(a fourth notification channel)*; `W-050`; **NEW**.

> **Concurrent-user licensing is enforced at log-in**, and the failure is blunt: no licence, no
> session — unless you hold the permission to reclaim one, in which case you may **evict another
> session**. That is a permission worth knowing about, and it is not in any security record the audit
> has enumerated.
>
> `System Notification` is a **fourth notification mechanism**, distinct from Messenger, flexEngage and
> the envelope icon (run 05 F300, F301). Its stated purpose — warning before *"the account becomes
> inaccessible due to period overlap"* — hints at a licensing/period interaction the documentation
> does not explain.
>
> For the cutover this is a practical constraint: **during a parallel run, two systems' worth of
> users may exceed the STORIS licence count.** Worth checking before the first parallel day, not on it.

---

## C. Screen and field inventory

| Screen | Fields verbatim |
|---|---|
| **Security Override Screen** | User ID · Password · Reason Code · **Security Requirement** · **Authorized Action** · **Exception** *(field set varies by the three-case matrix in F316)* |
| **Send/Review Mail Messages** *(tabs: Inbound, Outbound, Tasks, Closed, New Message)* | Header: **Viewing Mail for** · Unread Mail · Open Tasks. Inbound/Outbound grids: Status · From/Sent To · Subject · Received/Sent · Time. Tasks grid: Status *(open/closed)* · From · Subject · Received · Time. Closed grid: Status · From · To · Subject · **Date and Time of deletion**. New Message: To · Subject · **Task** · Text · **Linked Document Type** · **Document Number** · **Mandatory** |
| **Message Review Screen** | From · To · Subject · Sent · **Type** · Text · **Action** · Delete |
| **Message Review actions (6)** | None · Reply · Forward · **Link** · Print · **Move Back** |
| **Messenger Group Settings** | Group ID · Description · **Owner** · **Type** · Group Users · Group List |
| **Messenger Staff Assignment** | grid *(region/district or location — columns vary by caller)* · **Staff** *(default **All Users**)* · Add · Save → returns to **Cycle Module Multi-Print Assignment Screen** |
| **User Log In Screen** | User ID · Password · Location · **Set as Default Location** · Cash Drawer · **Payment Terminal** · **Tethered Terminal** · **Signature Capture** · Update Print Settings · Log In · Clear · Exit |
| **Switch User Location** | **Current Location** drop-down |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **User ID at Login** | **General System Control Settings** | Requires the User ID; **prerequisite for Extended Security** (F323) |
| **Extended Security** | General System Control Settings | **Activates the Password field** — i.e. turns authentication on (F323) |
| **Complex Passwords** | General System Control Settings | Enforces **PCI** password requirements (F323) |
| **Password Expires After __ Days** | General System Control Settings | Expiry warnings (F323) |
| **Allow Logon Passthrough** | User settings | Skips the User Log In screen entirely (F323) |
| **Notify of License Expiration** | **Create a User → Security tab** | Acknowledge Message after login (F327) |
| **Mail Administrator** | User file | **Read any mailbox** (F320) |
| *(Messenger enabled)* | User file | Prerequisite for group membership and report assignment (F321, F322) |
| **O/S Logon** | Create a User settings | Server-level identity, referenced for Server IDs |

---

## E. Security permissions catalog (additions)

- **The security override mechanism itself** (F316) — a supervisor-credential prompt with three
  attempts, a three-case field matrix, and **attribution of the authorising user**. This is the
  mechanism behind every "security override required" in five runs.
- **`Mail Administrator`** — a single unscoped user flag granting read access to all mailboxes (F320).
- **Group send rights** are separate from group membership (F321).
- **`Recover STORIS Licenses`** — a permission allowing a user to free a licence, i.e. to evict a
  session (F327). Not in any security record the audit has enumerated.
- **Extended Security is optional at the system level** (F323), which conditions every Extended
  Security permission cited in runs 04–05.

---

## F. State machines and enumerations (additions)

- **Override field matrix (3 cases):** no permission + reason → ID, password, reason ·
  permission + no reason → ID, password · permission + reason → **reason only** (F316).
- **Messenger tabs (5):** Inbound · Outbound · Tasks · Closed · New Message.
- **Message actions (6):** None · Reply · Forward · Link · Print · Move Back.
- **Message status:** read/unread *(mail)* · open/closed *(tasks)*.
- **Named but unpublished:** `Security Requirement` · `Authorized Action` · `Exception` ·
  message `Type` · group `Type` · `Linked Document Type`.
- **Session bindings (5):** Location · Cash Drawer · Payment Terminal · Tethered Terminal ·
  Signature Capture.
- **Notification channels — now four across the audit:** STORIS Messenger · flexEngage ·
  the envelope icon *(unlogged)* · **System Notification** (F327).

---

## G. Sequencing rules

1. **STORIS Server Log In** → **User Log In Screen** *(skipped if `Allow Logon Passthrough`)* →
   licence check → Main Menu (F323, F327).
2. Restricted routine, screen or field, **or** a required reason code → **Security Override Screen** →
   three attempts → the authorising user is recorded (F316).
3. Service condition requiring a tickle → **task message auto-created, assigned to the coordinator**
   (F319).
4. Task with a **`Mandatory`** link → the linked document must be opened **before the task can be
   deleted** (F318).
5. Cycle report produced → archived → **Messenger notifies assigned staff by region/district or
   location** → viewed in `Review Archived Reports` (F322).
6. Message deleted → **moved to Closed** *(reversible via `Move Back`)* → removed manually or by
   **`Purge Messenger Activity`** (F326, F318).
7. Location switched mid-session → **cash drawer unassigned unconditionally**; terminal and printer
   unassigned if invalid; **printer output falls back to screen**; background Input Processing
   routines are messaged (F325).

---

## H. Open questions and gaps

### Gated or unreachable

- **`Purge Messenger Activity`** — named, unread; and **no retention *setting* is named**, unlike the
  other eight retention chains (F326).
- **`Switch User`** — a distinct procedure from `Switch User Location`, named as the remedy in two of
  three side-effect cases (F325), and **absent from the audit's inventory entirely**.
- **`Cycle Module Multi-Print Assignment Screen`** — the parent of Messenger Staff Assignment (F322).
- **`Recover STORIS Licenses`** · **`System Notification`** · **`Terminal Settings`** ·
  **`Complex Passwords`** · `Create a User` · `Acknowledge Message` — all named, none read.
- Carried and now unlikely to close: `Costing Control Settings` · `Warehouse/Store Location Settings`
  · `Point of Sale Control Settings` · `Alert Code Settings` · `Status Code Settings` ·
  `Service Control Settings` · `Warranty Settings`. **All are System Administration records**, which
  is outside the six-run queue.

### Documented but ambiguous

- **Whether auto-generated service tickles set `Mandatory`** (F319). The difference between a
  reminder and an obligation, and unstated.
- **Whether `Input Processing` messaging uses Messenger** or a separate internal channel (F325).
- **`Security Requirement`, `Authorized Action`, `Exception`** — three display fields on the override
  screen, values unpublished (F316).
- **What "period overlap" means** in the licence-expiry warning (F327).
- **Whether `Mail Administrator` is scoped** by Regional Processing. Nothing suggests it is.
- **Group `Type` and `Owner`** — unexplained (F321).

### Inferences (recorded as inference, not fact)

- **I-56:** Service tickle tasks probably set `Mandatory`, since the point is to force contact.
  *Nothing states it, and the opposite is equally plausible.*
- **I-57:** `Switch User` is probably a full re-authentication that preserves the session, as against
  `Switch User Location`'s partial switch. *Named twice as the remedy; never described.*
- **I-58:** `Complex Passwords` is probably mandatory in practice wherever cards are taken, given the
  PCI reference and run 03's card handling. *A compliance inference, not a documented rule.*

---

## I. Unknown unknowns

- **Authentication is optional.** `Extended Security` — the record cited across two runs as a
  permission surface — is fundamentally the switch that activates the password field. **A STORIS
  installation can run with identification and no authentication**, and every Extended Security
  permission the audit catalogued sits on top of that. This should be verified at LA Mattress before
  any statement is made about migrating user accounts.
- **Concurrent licensing is a hard operational limit** with an eviction permission (F327). It is a
  parallel-run risk nobody would think to check.
- **A fourth notification channel** (`System Notification`) surfaced in one sentence. The audit has
  now found four, three of them in the last two runs, each discovered incidentally. **There is no
  article anywhere that describes how STORIS notifies people**, and we have assembled it from
  fragments.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Security Override Screen** | The supervisor-credential and/or reason-code prompt behind every override in the audit |
| **STORIS Messenger** | Internal mail application: five tabs, document links, tasks, groups, purge |
| **Task** *(Messenger)* | A message with open/closed status; tickles are auto-created tasks |
| **`Mandatory`** | Flag forcing the linked document to be opened before a task can be deleted |
| **`Move Back`** | Restores a deleted message from Closed to its original tab |
| **Mail Administrator** | User flag granting read access to any mailbox |
| **Extended Security** | The setting that activates the password field — i.e. authentication |
| **Allow Logon Passthrough** | Per-user bypass of the User Log In screen |
| **Switch User Location** | Mid-session location change; strips hardware bindings |
| **Switch User** | A distinct, undocumented procedure named as the remedy for hardware loss |
| **Recover STORIS Licenses** | Permission to free a concurrent licence by evicting a session |
| **System Notification** | A fourth notification channel, for licence and period warnings |

---

## Contract adjudication — batch 1

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — the override mechanism referenced in five runs is now documented** | F316; plus `Mail Administrator` (F320), group send rights (F321), licence recovery (F327), and the finding that **Extended Security is itself optional** (F323) |
| **W-064** *(retention)* | **CONFIRMED — ninth chain, and the first with no retention setting** | F326 |
| **W-039** *(exceptions)* | **CONFIRMED** | Reason codes are an independent axis of the override (F316) |
| **W-012** *(dates)* | **NOT DOCUMENTED IN THIS SECTION** | *(expected for an infrastructure section)* |
| **Internal messaging** | **NEW — the subsystem is now fully documented** | F317–F322 |
| **Concurrent licensing** | **NEW — no contract covers it** | F327 |
| **Session hardware binding** | **NEW** | F324, F325 |

---

## Next — batch 2

Navigation and personalisation (`Main Menu Screen`, `Navigational Tools`, `Quick Launch Icons`,
`Grid Navigation`, `Calendar Icon`, `Screen Colors`, `Touch-Screen & Scaling`, `Upload Company
Images`, `Create System Greeting Message`), `Change User Passwords`, `Glossary Terms A-Z`,
`STORIS Locations`, `Relationship Marketing`, and the **Printing** coverage sweep — led by
`Print Pick List` (run 04 F238's priority gap) and `Print a Manifest` (run 04 F183).
