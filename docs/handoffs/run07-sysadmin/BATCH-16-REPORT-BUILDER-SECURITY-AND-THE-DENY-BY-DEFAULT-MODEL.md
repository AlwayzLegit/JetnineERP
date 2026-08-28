# Run 07 — System Administration — Batch 16: Report Builder Security and the Deny-by-Default Model

Status: complete. Findings 540–561. Read-only throughout.

**This batch closes the audit's longest-standing security gap.** `File Security Groups` and
`Field Security Codes` have appeared as bare field names on the user and user-group records since
batch 7, flagged across three batches as *"a seventh kind of access control able to override the
other six"*. They are now fully documented — and the inference was **wrong in an important way**.
They do not override the other six. They are a **separate, inverted security system** that governs
one subsystem only, and its polarity is the opposite of everything else in STORIS.

The standing **user-versus-group conflict** question is **partially answered** (F547) and
**partially confirmed as genuinely undocumented** (F550, F555).

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Report Builder Security Overview** | 15202450036884 | Overviews › References | read — **the model** |
| 2 | **Establish Report Builder Security Groups** | 15242630130708 | Customer Settings | read — *File Security Groups* |
| 3 | **Establish Report Builder Security Codes** | 15242630129940 | Customer Settings | read — *Field Security Codes* |
| 4 | **Maintain Report Dictionaries** | 15202401271700 | Running Reports | read (followed link) |
| 5 | **Assign Screen Action Permission** | 15234722295188 | System Administration | read |
| 6 | **Report on User Security** | 15203028700948 | Views and Reports | read |
| 7 | **Create a User** | 15185876530068 | User Settings | read — full |
| 8 | **Create a User Group** | 15186132800788 | User Settings | read — `11.0` / `10.8` |
| 9 | **Notifications Control Settings** | 15186452992660 | System Control Settings | read |
| 10 | **Review Settings Activity** | 15234724473876 | System Administration | read |
| 11 | **Switch User Location** | 15238875799060 | Getting Started | read |
| 12 | **View Create a User Group** | 15295156484244 | User Settings | noted, not read (view-only twin) |

**Naming correction for the queue:** the audit has been searching for articles called
`File Security Groups` and `Field Security Codes`. **No such articles exist.** The routines are
titled `Establish Report Builder Security Groups` and `Establish Report Builder Security Codes`, and
they are filed under **Customer Settings**, not User Settings — which is why nine batches of
searching in the security sections did not find them.

---

## B. Wiring findings

### FINDING 540 — Report Builder Security is **deny-by-default**, inverting the whole system's polarity

- **Invariant:** every user is restricted from everything listed, and permissions are grants that *remove* restrictions.
- **Evidence** — `Report Builder Security Overview`:
  > "**Initially, all employees are restricted from the files and fields you specify in the above routines. You use the Staff file to override some or all of the restrictions for selected employees, allowing them access and restricting the other employees.**"
  `Establish Report Builder Security Groups`:
  > "**STORIS restricts employee access to the source files listed in the file security groups in this routine.** To **grant** an employee access…, edit the `File Security Groups` field on the Security tab of the employee's Staff file (that is, check the box next to the file security group name). **The check overrides the restrictions imposed by the selected file security group.**"
  `Establish Report Builder Security Codes`:
  > "**When a field security code is applied to a field via the Maintain Report Dictionaries routine, the system restricts all employees' access to the field except those with a check next to the field security code in their User file record.**"
- **Maps to:** batches 7–9 (~360 permissions, all grant-shaped) · the audit's standing note that
  `File Security Groups` "overrides the other six" — **that inference is now retired.**

> **Everything else in STORIS is allow-by-exception; this is deny-by-exception.** Across ten security
> records and roughly 360 permissions, batches 7–9 found one consistent shape: an unchecked box means
> the user cannot do the thing, and checking it grants. Here a checked box means the user is *no
> longer blocked*. Same widget, opposite meaning.
>
> **The audit's earlier inference was wrong and is corrected here rather than quietly dropped.** These
> are not a super-permission that overrides the other six mechanisms. They are a **parallel system
> with a different polarity that governs Report Builder and nothing else** (F545). The two never meet.
>
> **This is the single most important thing in this batch for the rebuild.** A migration that reads
> the STORIS permission tables uniformly — checked means allowed — will invert Report Builder
> security exactly backwards: every user who was *granted* an exception becomes the only one
> *restricted*, and everyone previously blocked gets access to the data the business chose to
> protect. Cost data, order data, customer data. The failure is silent and it fails open.

### FINDING 541 — A delivered group called `Standard Files` locks everyone out on day one

- **Invariant:** the shipped configuration restricts all users from all Report Builder data until someone grants an override.
- **Evidence** — `Establish Report Builder Security Groups`:
  > "**STORIS comes delivered with one file security group called `Standard Files`. This group contains all the source files available to the Report Builder. Initially, the presence of this file causes all users to be restricted from all Report Builder reports.**"
  > "**If you grant an employee access to the `Standard Files` group, the employee has unlimited access to all Report Builder reports.**"
  > "**In any case, to run a Report Builder report, a check must appear in at least one box at the `File Security Groups` window… Otherwise, the system restricts the employee from accessing the `Run a Report` routine.**"
  > "If you click on the Actions button…, a menu appears from which you can choose **`Clone This Group to a New Name`**. STORIS suggests you use this utility when first setting up Report Builder Security to clone the `Standard Files` group (**you cannot edit the `Standard Files` group**)."
  Fields: `File Security Group ID` · `File Group Description` · `File Name` · `Description` · Grid.
- **Maps to:** F540 · batch 14 F507 (undeletable purchase statuses) · F521 (`RFND` reserved vendor) · W-050.

> **`STD` is a third reserved, vendor-owned record** — after `RFND` and the six purchase status types
> — and the only one whose mere existence is a security control. It is uneditable by design, so the
> intended workflow is **clone it, prune the clone, grant the clone**.
>
> **A binary trap sits in the middle of this.** Granting `Standard Files` is not "a lot of access", it
> is *all* access — *"unlimited access to all Report Builder reports"*. The convenient click and the
> total bypass are the same click. In practice, at most sites, the first administrator to be told
> "I can't run reports" grants `STD` and the security model is over.
>
> **For the cutover this is a question to ask of live data, not of the vendor:** how many LA Mattress
> users have `Standard Files` checked? That number *is* the effective size of the Report Builder
> security model.

### FINDING 542 — A restricted field shows its column header and no data

- **Invariant:** field-level denial blanks the values while leaving the column visible.
- **Evidence** — `Report Builder Security Overview`:
  > "…**exclude the data from a selected field** (for example, the `Product Number` field) **from appearing on a selected report. That is, when the employee runs the report, the column header appears, but the data does not display.**"
  `Establish Report Builder Security Codes`:
  > "**If an employee runs a Report Builder report containing a field from which he has been restricted, the column header appears in the report but the column is empty.**"
- **Maps to:** F548 (the opposite choice, on menus) · batch 14 F507 (invisible suppression in Product Search) · W-050.

> **STORIS makes the opposite call in two places, deliberately.** Here, denial is **visible**: you see
> that a `Cost` column exists and that you are not allowed to see it. On Actions menus (F548), denial
> is **invisible**: the item is removed and you never learn it was there. In Product Search (batch 14
> F507), suppression is also invisible.
>
> **Visible denial is the better behaviour and worth carrying into the rebuild**, because a blank
> column is self-explaining — the user knows to ask — whereas a missing menu item generates support
> tickets that read "the button is gone". But note the consequence for **exports**: a report run by a
> restricted user produces a file with a `Cost` column full of blanks, which is easily mistaken
> downstream for *"cost is zero"* rather than *"you may not see cost"*.

### FINDING 543 — A field security code is an unbound label that does two jobs at once

- **Invariant:** the code is not tied to any field; binding happens in the report dictionary and can be moved freely.
- **Evidence** — `Establish Report Builder Security Codes`:
  > "**A field security code is not associated with any particular field except for the time when it is being applied to one or more fields in one or more source files via the `Maintain Report Dictionaries` routine. If you remove a field security code from a field, you can immediately attach it to another.**"
  > "**Field Security codes perform two functions. They identify a field in a source file whose data you want restricted, and identify the employees, via the Staff file, to be restricted from the data in the field.**"
  The binding procedure, verbatim:
  > "Create a field security code… · In `Maintain Report Dictionaries`, access the source file that contains `Product Number` · In the grid, double-click on the `Product Number` field to select it · At the **`Security Code`** field, click on the Search button and select the field security code you created… · Click Add"
  `Maintain Report Dictionaries` confirms `Security Code` as a dictionary-level field, alongside
  `File Name` · `Dictionary Name` · `Description` · `Column Heading` · `Prompt Name` · `Width` ·
  `Conversion` · `Attribute` · `On File` · `Formula` · `Justification` · `Dictionary Type` ·
  `Specific Edits`.
- **Maps to:** F540 · batch 14 F509 (immutable code behaviour) · the UniData platform findings (batch 5) · W-050.

> **This is a classic multivalue-database security idiom, and recognising it explains the design.**
> A field security code is a **tag**, and the security decision is the join: *field has tag T* ∧ *user
> lacks T* ⇒ blank. Tags are reusable, rebindable and carry no meaning of their own — which is why
> the docs go out of their way to say a code can be detached and immediately reused.
>
> **It is many-to-many in both directions**: one code can protect fields *"in one or more source
> files"*, and one user's grant covers every field that code touches. So `Cost` is not a field-level
> permission — it is a **data-classification label** applied across the schema.
>
> **The rebuild consequence is a modelling one.** This is column-level security implemented as
> classification tags, and it is genuinely good design. The natural rebuild equivalent is a column
> classification (`sensitive:cost`) checked against a user's clearances — not per-column ACLs. But
> note the coupling: the binding lives in the **report dictionary**, so if the rebuild replaces the
> dictionary layer, the security bindings vanish with it.

### FINDING 544 — `Cost` ships pre-classified as sensitive

- **Invariant:** STORIS delivers a field security code for cost and has already applied it to cost fields.
- **Evidence** — `Establish Report Builder Security Codes`:
  > "For example, the `Cost` field contains sensitive data. **STORIS comes delivered with a field security code created for `Cost` has applied the `Cost` field security code to the fields containing cost-related data. The system restricts this data from appearing in Report Builder reports except for those employees with checks next to the `Cost` field security code in the User file records.**"
- **Maps to:** F540, F543 · batch 15 F523 (`View True PO Delivery Date`) · batch 1 (Costing Control Settings) · W-050, W-061.

> **A fourth vendor-owned reserved record**, and the one with real operational teeth: **out of the
> box, nobody sees cost in Report Builder.**
>
> **This is the second cost-visibility control the audit has found**, and they are unrelated
> mechanisms guarding the same commercial secret: batch 15's `View True PO Delivery Date` pads the
> delivery date for users who lack it; this blanks cost columns for users who lack the `Cost` code.
> **Margin protection is implemented twice, in two subsystems, with two different mechanisms and two
> different polarities.** A rebuild consolidating them into one "can see cost" permission would be an
> improvement — but must find both first, and there may be a third.
>
> Note the sentence is garbled in the source (*"created for Cost has applied"*) — quoted as-is. The
> meaning is unambiguous.

### FINDING 545 — Report Builder Security does not apply to regular STORIS reports

- **Invariant:** the entire file/field security model governs one reporting subsystem only.
- **Evidence** — `Report Builder Security Overview`:
  > "**NOTE: Report Builder Security restrictions do not apply to regular STORIS reports.**"
  > "To enable Report Builder Security, **check the box on the Security tab of the General System Control Settings.**"
- **Maps to:** F540 · batch 4 (General System Control Settings) · batches 7–9 · W-050.

> **One sentence retires the audit's standing inference and replaces it with a sharper concern.**
> These are not an override of the other six mechanisms. They are **a fence around Report Builder**.
>
> **Which raises the question the docs do not answer: what protects cost on the regular reports?**
> The `Cost` classification (F544) is inert outside Report Builder. Nothing the audit has read across
> seven runs describes column-level suppression on standard reports. Either standard reports have
> their own controls the audit has not found, or **the same data is protected in one report engine and
> open in the other**. Recorded in §H as a question worth asking the vendor directly — and worth
> testing against live STORIS, since it is observable.
>
> **The whole model is behind one master switch** on General System Control Settings. Off, and every
> group, code and grant in this batch is inert data.

### FINDING 546 — Report authorship carries its own three-value access control

- **Invariant:** the report's creator sets a restriction at creation time, orthogonal to and combinable with the file/field model.
- **Evidence** — `Report Builder Security Overview`:
  > "**STORIS provides two methods of restricting access to data available via the Report Builder: the `Access` field in the `Create a Report` screen · Report Builder Security**"
  > "The first method is **determined by the creator of the report (that is, the log-on user when the report was created)**. The creator has three options at the `Access` field…:
  > · **Anyone can run the report** (no restriction)
  > · **Only users with the same staff type as the creator can run the report**
  > · **Only the creator of the report can run it**"
  > "**You can combine this simple method with the more complex Report Builder Security method.**"
- **Maps to:** F540, F547 · batches 7–9 · W-050.

> **This is discretionary access control — the report's author, not an administrator, sets the
> policy** — and it is the first instance of it in the audit. Every other mechanism across seven runs
> is administered centrally. Here an ordinary user makes a security decision as a side effect of
> saving their work.
>
> **The two systems compose as an AND**, and the middle option is the interesting one: *"the same
> staff type as the creator"* makes **staff type a security principal**, which matters because F547
> shows staff type also seeds the file and field grants. Staff type is doing more security work than
> its name suggests.
>
> **For the rebuild this is a real design fork.** Author-set report visibility is a genuinely useful
> feature, but it means report access cannot be answered from the permission model alone — you must
> also know who wrote each report. And at cutover, **every existing report carries a creator-set
> restriction that must migrate with it**, or reports quietly become more visible than intended.

### FINDING 547 — Staff type **seeds** the security grants — a copy at creation, not inheritance

- **Invariant:** file and field grants are transferred from the staff type into the staff record when the user is created.
- **Evidence** — `Report Builder Security Overview`:
  > "**Each time you create a new staff member in the Staff file, you assign the staff member a staff type. When you specify the staff type for a new employee, STORIS automatically transfers the settings at the `File Security Group` and `Field Security Codes` fields in the employee's Staff Type file to their Staff file record. This can save you time when setting up the employee's Report Builder Security.**"
- **Maps to:** **the standing user-versus-group conflict question**, open since batch 7 · batch 14 F502
  (seeded stock levels) · batch 15 F526 (resolve once, store the answer) · W-050.

> **This answers the standing question — for these two fields, and only these two.** There is no
> user-versus-group *conflict* to resolve for `File Security Groups` and `Field Security Codes`,
> because there is no runtime hierarchy: the group's values are **copied into the user record once**,
> at creation, and the two are independent from then on. Change the staff type's grants afterwards and
> existing users do not move.
>
> **This is the same seeded-copy pattern as batch 14 F502's stock levels**, and it is now confirmed as
> a deliberate STORIS idiom rather than a one-off: *"transfers the settings"*, *"those settings default
> here"*. Combined with batch 15 F526 (auto-fill days fixed at order entry) and the copy-at-write rule
> for tax, commission, cost and kit price, the house rule is consistent — **STORIS resolves once and
> stores the answer.**
>
> **The security consequence is worth stating plainly:** revoking a grant at the staff-type level
> **does not revoke it from anyone**. There is no propagation. Any rebuild that implements group
> membership as live inheritance will behave differently from STORIS at exactly the moment it matters
> most — when access is being taken away.
>
> The article says **`Staff file`** and **`Staff Type file`** where the user-facing routines say
> `Create a User`; `Create a User` itself refers to the same fields on its Security tab. Same records,
> two vocabularies. Added to §J.

### FINDING 548 — Screen action permissions are **group-only**, and denial is invisible

- **Invariant:** Actions-menu items are restricted per user group; denied items disappear rather than grey out.
- **Evidence** — `Assign Screen Action Permission`:
  > "Use this routine to **restrict user access to specific functions found on Actions button menus.** Users can specify **which actions for particular programs the user group can and cannot access.** Actions buttons appear in various programs throughout STORIS, allowing you to access other relevant routines without having to exit your current routine…"
  > "**NOTE: When a user is denied access to a particular item on an Actions menu, that item is not included on the menu listing. In the event that a user is denied access to all items on a particular Actions menu, the Actions button is disabled.**"
  Fields: **`User Group`** · `Display in Grid` (`All` · `Restricted` · `Non-Restricted`) ·
  `Search for` · `Program` · `Action` · `Search` · Grid.
  `Create a User Group` cross-references it:
  > "**NOTE: Use the `Assign Screen Action Permission` routine to restrict user access to specific functions found on Actions button menus.**"
- **Maps to:** batches 7–9 (six kinds) · batch 14 F507, F519 (shapes 8 and 9) · batch 15 F523 (shape 10) · W-050.

> **This is the eleventh distinct access-control shape**, and the audit's earlier guess that it might
> be an eighth *kind* was right in spirit. Its distinguishing features:
> - **It is keyed on `User Group` only.** There is no user-level override — the one mechanism in the
>   catalogue with no individual dimension. So the user-versus-group question does not arise here
>   either, for the opposite reason to F547.
> - **It is per `(Program, Action)` pair**, so the same action is grantable in one screen and denied
>   in another.
> - **Denial removes rather than disables**, and a fully-denied menu disables its button — a *derived*
>   UI state, not a configured one.
>
> **The `Display in Grid` filter (`All` / `Restricted` / `Non-Restricted`) is a small but telling
> detail:** the routine expects the catalogue to be large enough that you cannot review it unfiltered.
> That is consistent with Actions buttons appearing *"in various programs throughout STORIS"* — so
> the true size of this permission set is probably comparable to the ~360 in batches 7–9, and **it is
> not enumerated in any article**. Recorded in §H.
>
> **Actions buttons are how STORIS does cross-module navigation** — this batch alone reached
> `Stock Location Schema`, `Vendor Ship From Settings`, the exception screens and `Clone This Group`
> through them. So this routine does not just hide menu items; **it controls which cross-module paths
> exist for a group.** For a parity audit that matters: two users can have identical module
> permissions and different reachable surfaces.

### FINDING 549 — The security model has exactly ten modules, and STORIS ships a report that dumps them

- **Invariant:** user security is partitioned into ten named records, and a built-in report renders the whole grid.
- **Evidence** — `Report on User Security`:
  > "The following **security modules** are available for this report: **`Create a User / Create a User Group` · Import Data Security · Logistics Security · Payables Security · Personal Information Security · Purchasing Security · Receivables Security · Sales Security · Service Security · System Security**"
  > "Use this report to review user or user group security settings. **This report output is always Excel and is not saved in the report archive.** The security settings are listed within the columns… and the users or user groups are listed in the rows. **'YES' or 'NO' appears in the cells**…"
  > "The report column headings **use the same text that appears on the security settings screens** in Create a User or Create a User Group. **Before the column header text is the setting's associated module code (e.g. `TE`, `AR`, etc.).** All settings for the associated module are grouped together; **modules appear alphabetically.**"
  > "**Logistics Security, Purchasing Security, Receivables Security, and Sales Security have additional entries that appear in additional columns.**"
  Fields: `User ID` · `User Group ID` · `Module` · `Report For`.
- **Maps to:** **batches 7–9** (the consolidated permission catalogue, ~360 permissions across 10
  records) — **independently corroborated** · W-050.

> **Batches 7–9 built the permission catalogue by reading ten records and counting. This report
> confirms the list is exactly ten, from a completely different article.** That is the strongest
> corroboration the audit gets, and it means the catalogue is **complete, not merely large**.
>
> **This is also the single most useful cutover tool found in seven runs.** It renders the entire
> effective permission matrix — every user and group, every setting, YES/NO — into Excel in one run.
> **For the parity audit specifically: run it, and it becomes the ground-truth artefact the rebuild's
> permission model is tested against.** It is the answer to "what does LA Mattress actually have
> configured today", which no amount of documentation reading can supply.
>
> **Two caveats a rebuild should note.** *"Not saved in the report archive"* means each run is
> ephemeral — no history, no diffing over time, so it cannot answer "what changed". And the four
> modules with *"additional entries"* have a **ragged shape**: they carry permissions that are not
> simple checkboxes, which matches batches 7–9 finding value-bearing settings inside those same four
> records.

### FINDING 550 — The user-versus-group question survives, and this report shows why

- **Invariant:** the report lists users and groups without resolving between them.
- **Evidence** — `Report on User Security`:
  > "**Users are sorted by their user ID in ascending order, regardless of their user group association.**"
  Fields `User ID` **and** `User Group ID` **and** `Report For` — three separate selectors.
  `Create a User Group`:
  > "The User Group file **works with the User file** to establish menu security. Note that **all STORIS users must be assigned a user group via the `Type` field in the User file.**"
- **Maps to:** F547 (answered for two fields) · F548 (group-only) · batches 7–9 (question raised) · W-050.

> **This is a negative finding and it is recorded as one.** The audit has now read all ten security
> records, both user routines, the screen-action routine and the report that dumps every setting.
> **Nowhere does STORIS state what happens when a user's setting and their group's setting disagree.**
>
> The report's own wording is the tell: it renders users and groups as **two independent row sets**
> and sorts users *"regardless of their user group association"*. A report designed around a known
> resolution rule would show the effective value. This one shows both and leaves the reader to decide.
>
> **What the audit can now say precisely**, which is more than it could before:
> - For `File Security Groups` / `Field Security Codes`: **no conflict exists** — the group seeds the
>   user once (F547).
> - For screen action permissions: **no conflict exists** — group only (F548).
> - For **the ~360 permissions in the ten modules**: **unresolved, and confirmed undocumented across
>   thirteen articles.**
> - `Maximum number of concurrent sessions` and `Allow Logon Passthrough` appear on **both** records
>   with no stated precedence (F555).
>
> This is now a **vendor question the audit has properly earned the right to ask**, having exhausted
> the documentation. Recorded in §H as the batch's top item.

### FINDING 551 — Changing the User file requires restarting STORIS

- **Invariant:** user record changes are not picked up by running sessions.
- **Evidence** — `Create a User`:
  > "**NOTE: If you make a change to the User file, you must restart STORIS before the change can take effect.**"
- **Maps to:** batch 5 (UniData / phantoms) · F560 · W-050.

> **A permission change is not live.** Grant or revoke something and the affected user keeps their old
> rights until STORIS restarts — and the note does not say whether that means the user's session or
> the system. Either reading has consequences: **revocation is not immediate**, which matters for a
> departing employee or a compromised account.
>
> This is consistent with the UniData platform findings from batch 5 — user records are very likely
> **read into memory at logon** rather than consulted per action. It is also consistent with the
> seeded-copy idiom (F547): STORIS reads configuration once and holds the answer.
>
> **For the rebuild:** live permission evaluation is the obvious modern choice and is strictly better,
> but the parity consequence must be stated — **STORIS operators are accustomed to permission changes
> not taking effect**, and will report immediate enforcement as a bug the first time it surprises them.

### FINDING 552 — Location restriction is a five-axis model that STORIS advises against combining

- **Invariant:** users and groups can be restricted by global list, per-function list, region, district and logon location, and the vendor recommends picking one.
- **Evidence** — `Create a User`, Access tab:
  > "You can create a **global list of locations** via the Action button at the `Global Location List` field… Or, you can restrict the user to a **list of locations for specific areas of functionality**… You can also restrict the user to a **combination of regions, districts, and log-on locations** via the four Sales & Inventory selection prompts on the screen. **However, for users on whom you place restrictions, STORIS recommends you assign each user to a single setting across the board (for example, Logon Location).**"
  > "**NOTE: To restrict user access to regions and districts, Regional Processing must be active in the General System Control Settings.**"
  > "**The `Order Access Limited to Selling Store` setting in your Point of Sale Control Settings may also affect user access to orders, in addition to the user's location restrictions.**"
  Structure: `Company` · `Global Location List` · Sales (`Entry` + `Location List`, `View/Report` +
  `Location List`) · Inventory (`Entry` + `Location List`, `View/Report` + `Location List`).
  `Create a User Group` carries the same four Sales/Inventory prompts and adds:
  > "**RESTRICTIONS — These settings are active whether or not Regional Processing is active in your system.**"
- **Maps to:** batch 6 (Regional Processing) · batch 12 (locations) · batch 14 F510 (district ≠ region) · W-050.

> **When a vendor recommends against using their own feature combinatorially, that is documentation of
> a known problem.** *"STORIS recommends you assign each user to a single setting across the board"*
> is the strongest hint in seven runs that **the interaction between these axes is not well-defined**,
> and it appears in both the user and the group article.
>
> **Entry and View/Report are separately restrictable**, which is a genuinely good distinction —
> a user can be allowed to *see* every location's inventory and *enter* only at their own — and worth
> keeping.
>
> **The two articles disagree in an important way about Regional Processing.** `Create a User` says
> region and district restrictions require it active *and* that it *"must remain active for the system
> to enforce regional restrictions"* — so **turning it off silently removes those restrictions**.
> `Create a User Group` says its RESTRICTIONS block is *"active whether or not Regional Processing is
> active"*. Both can be true if they describe different field sets, but the boundary is not stated.
> Recorded in §H — and flagged as **a security control that can be switched off from an unrelated
> screen**, which belongs in the rebuild's threat model.
>
> `Order Access Limited to Selling Store` is a **sixth axis living in Point of Sale Control Settings**
> — location security partly configured outside the security records.

### FINDING 553 — Location restrictions widen themselves when an order needs it

- **Invariant:** editing an order that references a disallowed location adds that location to the user's available list.
- **Evidence** — `Create a User` and `Create a User Group`, identical text in both:
  > "**Locations may automatically be assigned to the order for both stock and fulfillment location lists. This means that even if the user is not assigned access to a specific location, editing an order with a location that is not normally permitted for the user adds that location to the list of available locations for both the stock and fulfillment location selection.**"
- **Maps to:** F552 · run 03 (order entry) · run 04 F290 (detect-and-report) · W-050.

> **A security restriction that relaxes itself on contact with data.** This is stated twice, without
> comment, as ordinary behaviour — and it is the most surprising security finding in the batch after
> F540.
>
> **The pragmatic reason is obvious**: an order already references a location, someone has to be able
> to edit it, and refusing would strand the order. But the mechanism is broader than that need. It
> does not grant a one-time exception for the referenced location — it *"adds that location to the
> list of available locations"* for both stock and fulfillment selection, which reads as making the
> location **selectable**, not merely viewable.
>
> **So a user's effective location access is a function of which orders they have touched.** Two users
> with identical configuration have different reachable location sets depending on their work history,
> and neither the security record nor `Report on User Security` would show it.
>
> **For the rebuild this needs a deliberate decision, not an inherited one.** The honest reconstruction
> is a scoped, per-order exception rather than a widening of the user's list. But it must be a
> decision, because reproducing STORIS exactly reproduces a self-widening permission.

### FINDING 554 — Fulfillment locations are restricted separately by method

- **Invariant:** delivery and customer pickup each get their own location source, chosen from two modes.
- **Evidence** — `Create a User` / `Create a User Group`, identical:
  > "Use these settings to assign an individual user a list of fulfillment locations **by fulfillment method, Delivery or Pick Up.**"
  > "**`Use Access Restrictions`** — Select this option for either Delivery or Customer Pickup to use the **Inventory - Entry radio group** on this screen as the list of available fulfillment locations."
  > "**`Location List`** — …build a location list of available fulfillment locations. **For Deliveries, the location list applies to sales order deliveries, exchange deliveries, and return pickups.** If this option is selected, a Location List must be selected. **The `Location List` field accepts a predefined list of locations (predefined via `List Type` in `Process List Settings` as 'Accessible Location List').**"
  > "**NOTE: When using a location list…, new fulfillments continue to default the stock and fulfilment location based on the `Delivery Locations` or `Customer Pickup Locations` settings in Warehouse/Store Location Settings for the selling store.**"
- **Maps to:** batch 12 (Warehouse/Store Location Settings) · run 04 (fulfillment) · W-050, W-059.

> **Note which bucket "return pickups" falls into: Deliveries.** A return pickup is a delivery-method
> fulfillment for permission purposes, which is not the intuitive grouping and is exactly the kind of
> classification a rebuild gets wrong by reasoning from the word "pickup".
>
> **Restriction and defaulting are separate systems, and the NOTE says so explicitly**: the user's
> list controls what is *selectable*; `Warehouse/Store Location Settings` for the selling store still
> controls what is *pre-filled*. **So a user can be defaulted into a location they are restricted
> from** — which pairs uncomfortably with F553's self-widening.
>
> `Process List Settings` with `List Type` = *'Accessible Location List'* is a **named list registry**
> the audit has not read. Added to the queue.

### FINDING 555 — Two settings exist on both the user and the group record with no stated precedence

- **Invariant:** `Maximum number of concurrent sessions` and `Allow Logon Passthrough` are configurable at both levels.
- **Evidence** — `Create a User`, Security tab: `Allow Logon Passthrough` ·
  `Maximum number of concurrent sessions` · `Password` · `Reset Password` ·
  **`Exempt from Active Directory Authentication`** · `Login ID` · `User Locked Out`.
  `Create a User Group`, General tab: `Allow Logon Passthrough` ·
  `Maximum number of concurrent sessions` · `Menu Timeout Active` · `File Security Groups` ·
  `Field Security Codes` · **`Reset User Members`** · `Language Code` · `Default at Login` ·
  `Enable Signature Capture`.
- **Maps to:** F550 · batch 6 F323 (Extended Security) · batch 7 (identity and access) · W-050.

> **These are the concrete instances of the unresolved conflict from F550**, and they are worth naming
> because they are *not* seeded like F547's security grants — both articles present them as live
> settings on both records.
>
> **`Reset User Members` on the group is the mechanism that makes this tractable in practice**, and it
> is telling: a button whose evident purpose is to **push group values down onto member users**. That
> is a manual propagation command — which is only necessary in a system where **propagation is not
> automatic**. It corroborates F547's seeded-copy model and suggests the same applies to these fields:
> the group is a template you re-apply, not a parent you inherit from.
>
> **`Exempt from Active Directory Authentication` is the first mention of AD in the audit**, and it is
> a genuinely important cutover fact: STORIS supports **external identity**, per-user exemptable. Run
> 06 F323 established `Extended Security` as the switch that turns the password field on; this says
> the password field may not be the authority at all. Added to §H — the AD integration itself is
> undocumented in anything the audit has read.

### FINDING 556 — License expiry escalates on a 15/10/3-day ladder, and at 3 days it overrides its own flag

- **Invariant:** a per-user notification flag governs warnings until three days out, when everyone is notified regardless.
- **Evidence** — `Create a User`, Security tab, `Notify of License Expiration`:
  > "Check this setting to notify the user when the STORIS Software License is close to expiring. The expiration date is the **`Licensing Expires` date on the Licensing tab of General System Control Settings.**"
  > "**15 days from expiration** — the Acknowledge Message window appears **for these users**."
  > "**10 days from expiration** — the Acknowledge Message window appears for these users. Additionally, **all users** receive a notification at the bottom of their STORIS session after login… This message **can be dismissed by the user**."
  > "**3 days from expiration** — the Acknowledge Message window appears **for all users**. Additionally, all users receive a notification…"
  > "**If this setting is not checked, no users are notified… A log is written indicating the license expiration and that no users have this setting checked.**"
  > "**NOTE: This setting is not available via Create a User Group.**"
  > "**If no expiration date exists, notifications described here are not deployed and no users are notified.**"
  > "**This setting also governs UniData licenses.** If the `Notify of License Expiration` flag is set and there are fewer than 15 days before your UniData license expires, a pop-up appears upon login… **If there are 3 or fewer days until the expiration, everyone who logs in sees the popup which is independent of the status of the `Notify of License Expiration` flag.**"
- **Maps to:** batch 4 (licensing) · batch 5 (**UniData named**) · batch 14 F508 (date-driven behaviour) · W-051.

> **A permission flag that stops applying when the situation is bad enough.** At 15 days it gates who
> is told; at 10 days it gates only the *modal*, with everyone getting a banner; at 3 days it is
> bypassed entirely. That is **escalation logic embedded in a checkbox**, and it is the only instance
> of it in the audit.
>
> **The two-layer licence model is confirmed here in one sentence**: STORIS has its own licence
> *and* an underlying **UniData** licence, and this one flag watches both. Batch 5 identified UniData
> as the platform; this is the first place it appears as a **commercial dependency with its own expiry
> that can stop the business**.
>
> **The log-if-nobody-is-watching behaviour is unusually careful design** and worth copying: STORIS
> writes a log entry recording *that no user was configured to be notified*. That is a system
> detecting its own misconfiguration.
>
> **This setting is user-only** — *"not available via Create a User Group"* — which is a third
> resolution to the user-versus-group question: some settings simply do not exist at group level.

### FINDING 557 — Consumer notifications are licensed by **monthly volume**, not by site count

- **Invariant:** email and text notification submodules carry a monthly maximum, tracked against actual usage.
- **Evidence** — `Notifications Control Settings`, Event Notifications via ERP tab:
  > "The usage displayed in the following fields is based off the terms of **licensed submodule, `Consumer Email Notifications`**." → `Actual` · `Maximum`
  > "…**licensed submodule, `Consumer Text Notifications`**." → `Actual` · `Maximum`
  > "**Warning Notifications are sent to the email address and/or phone number provided to alert individuals that the text and email maximums have been exceed or are on pace to exceed the monthly limit.** NOTE: **At least one of these warning notifications must be defined.**"
  > "**The method used to determine if the email and/or text notifications are on pace to exceed the monthly limit is an approximation. The average number of notifications sent daily, for both email and text, are determined. That amount is then multiplied by 30** to provide a count that is used to alert STORIS to send a warning message. This message tells the client how many email/text notifications are still available… **and if they would like to avoid interruptions…, contact STORIS to increase the monthly amount.**"
  Fields: `Maxmium Warning Method` *(sic)* · `Notify Email Address` · `Notify Text Telephone`.
- **Maps to:** batch 4 (**licensing enumerated as counts of sites**) · batch 5 (seven notification channels) · batch 15 F538 (a true feature toggle) · W-051.

> **Batch 4's conclusion needs its second amendment in two batches, and this one is larger.** Batch 4
> found licensing to be *counts of sites*; batch 15 F538 found one true feature toggle; this is a
> **third and different licensing shape — metered consumption with a monthly cap.**
>
> **The commercial exposure is real and belongs in the cutover planning**, not just the audit: hitting
> the cap **stops customer notifications**, and the remedy is a phone call to STORIS. LA Mattress's
> current `Actual` and `Maximum` values are a number worth pulling from live before anyone sizes the
> rebuild's notification volume.
>
> **The forecast is explicitly an approximation** — daily average × 30 — which the docs say plainly.
> It ignores weekday/weekend shape and seasonality, so it will under-warn a business whose volume
> ramps late in the month. Fine to reimplement better; worth knowing STORIS did not.
>
> The typo `Maxmium Warning Method` is quoted as it appears — **it is a field name, and a rebuild
> mapping fields by label will need the literal string.**

### FINDING 558 — Over-limit events are captured, held for 30 days, and archived by a phantom

- **Invariant:** exceeding the cap suppresses sending but not capture; a background daemon moves the backlog to archive.
- **Evidence** — `Notifications Control Settings`:
  > "**If notifications have exceeded the maximum amount and are no longer sent, the events are still captured and stored in the `Event Repository` for a 30 day grace period. The `Consumer Event Notification` phantom moves them directly to the `Event Archive`. If you contact STORIS to increase your monthly maximum, STORIS will provide a means to send customer notifications based on the archived events.**"
- **Maps to:** batch 5 (phantoms = UniData background daemons; seven notification channels) · batch 15 F529 (batch jobs) · W-041, W-051.

> **This is well-designed degradation and worth recording as such.** The system does not drop the
> events it cannot send — it keeps them, and keeps them recoverable, so a site that discovers the cap
> after the fact can still reach the customers it missed. Most systems in this position simply fail.
>
> **Three named artefacts, all new to the audit**: `Event Repository`, `Event Archive`, and the
> **`Consumer Event Notification` phantom**. Batch 5 established phantoms as UniData background
> daemons and named several; this is another, and it is doing **data-lifecycle work, not
> notification work** — it moves records between two stores.
>
> **The recovery path is manual and vendor-mediated** — *"STORIS will provide a means"* — so it is not
> a feature the site can operate. For the rebuild, the design to copy is capture-always/send-conditionally
> with a durable backlog; the part not to copy is needing the vendor to drain it.

### FINDING 559 — Notification settings are a prerequisite for scheduling any process

- **Invariant:** `Schedule a Process` requires this record configured, and cloud tenancy restricts which processes are available.
- **Evidence** — `Notifications Control Settings`:
  > "**NOTE: Settings on this screen are required in order to `Schedule a Process`. Not all processes are available to multi-tenancy Cloud users. For detail, see individual process selections in `Schedule a Process`.**"
  > "In addition to the STORIS document server, you have the option to set up an **OAuth 2.0 email provider such as Google (Gmail) or Microsoft (Outlook)**. **Microsoft and Google are decommissioning their SMTP support. OAuth 2.0 can be used in place of SMTP.**"
  > "Use the grid on this tab to select an **ELP form** and `Email Method` for the event types listed. **The Event rows in the grid are populated by STORIS; you cannot add your own events.**"
  > "**NOTE: A `Web Service URI` and 'From' Email Address must be defined when `Direct Ship Shipping Notification` is chosen in `Event Email ELP Selection`.**"
- **Maps to:** batch 5 (notification channels; `ELP` partly understood) · batch 4 (Cloud/SaaS vs AIX) · batch 15 F529 (EOD) · W-041, W-051.

> **An email configuration screen gates the entire job scheduler.** That is a real dependency chain a
> rebuild would never invent — you cannot schedule a nightly process until outbound email is
> configured — and it means at cutover, **email setup is a blocker for batch processing**, not a
> nice-to-have.
>
> **The event list is vendor-owned**: *"populated by STORIS; you cannot add your own events."* This is
> the vendor-owned-code-table idiom again (batch 14 F512, batch 15 F530), applied to the event
> catalogue. **A site can choose the form and the method for each event but cannot define an event** —
> which caps what the notification system can ever do without a STORIS release. Worth knowing before
> the rebuild promises event extensibility.
>
> **`ELP` gains definition here.** Batch 5 recorded it as *"partly understood as a notification
> template system"*; it is now confirmed as **a form/template selected per event type** —
> `Event Email ELP Selection`, `ELP form`. Still not expanded as an acronym. §H.
>
> The multi-tenancy sentence is a **direct platform-shape finding**: STORIS Cloud is a *restricted*
> environment, not merely a hosted one. If LA Mattress is on Cloud, some processes are unavailable and
> the parity target is smaller than the documentation implies. Worth confirming which deployment they
> run.

### FINDING 560 — Switching location silently unassigns cash drawer, payment terminal and printer

- **Invariant:** the in-session location switch drops location-bound device assignments, and a separate `Switch User` procedure exists for when they are required.
- **Evidence** — `Switch User Location`:
  > "The **`Current Location` drop down menu** allows the user to switch between different locations **without having to log out completely**… The list displays **all locations to which the user has access**. Once a new location is selected, **the user all security associated with the chosen location is honored** *(sic)* and internal processing required to allow the user to use the new location is performed."
  > "**Cash Drawer Settings** — If assigned a cash drawer, **the cash drawer is unassigned from the user upon login to the new location. If a cash drawer is required, the user is required to use the `Switch User` procedure.**"
  > "**EMV Terminal Settings** — If assigned a payment `Terminal ID` and the Terminal ID is **not valid for the new location**, the Terminal ID is unassigned… **or may select a Terminal ID when taking a payment.**"
  > "**Printer Settings** — If the assigned a system printer is not valid for the new location, **the printer is unassigned from the user and the output designation changes to use the screen output methodology.**"
  > "**Input Processing** — Input Processing routines are **background processes** that update STORIS with the appropriate information for the new location. **Once the user's location is changed, a message is sent to the Input Processing routines** to make the appropriate adjustments…"
- **Maps to:** run 06 (login, printing, navigation) · run 03 (cash drawers, payments) · batch 5 (phantoms) · F552 · W-050.

> **Queue correction: `Switch User` and `Switch User Location` are two different things**, and the
> audit has been carrying `Switch User` on the queue as a single item. This article documents the
> *location* switch and repeatedly points at `Switch User` as the heavier alternative — the one to use
> *"if a cash drawer is required"*. `Switch User` itself remains unread. §A of the next batch.
>
> **Three device assignments silently drop on a location change**, with three different consequences:
> the drawer goes unconditionally; the terminal and printer go only if invalid at the new location;
> and the printer's loss **silently redirects output to screen**. A cashier who switches location
> mid-shift loses their drawer and may not notice until they try to take cash.
>
> *"All security associated with the chosen location is honored"* confirms **location security is
> evaluated per session-location, not per login** — which is the right model, and sits oddly beside
> F551's requirement to restart STORIS for User file changes. **Location context is live; permission
> content is not.**
>
> `Input Processing` is another **named background process** receiving a message on the switch —
> the fifth periodic/background mechanism in run 07 after EOD, EOM, `Generate Monthly Reports`,
> `Scheduled Settings Update` and the phantoms.

### FINDING 561 — Settings auditing is opt-in per routine, and reporting on it is a separate step

- **Invariant:** `Track Settings Activity` selects what is audited; `Review Settings Activity` reports on it.
- **Evidence** — `Review Settings Activity`:
  > "Use this routine to **report on changes (if any) made to the routines specified in the `Track Settings Activity` routine.**"
  Fields: `File Name` · `Record Key` · `Comment` · `Send Output to` · `Export Path` · Actions.
- **Maps to:** batch 3 (`Track Settings Activity` found) · F521 (vendor edits captured without it) · W-050.

> **The pair completes a mechanism batch 3 found only half of**, and the shape is: **auditing is off
> unless someone turned it on, per routine.** The `File Name` / `Record Key` fields confirm the audit
> log is keyed by **UniData file and record**, not by business entity — consistent with the platform.
>
> **The important consequence for the cutover is historical, not architectural.** Whatever LA Mattress
> did *not* list in `Track Settings Activity` has **no change history at all**, and that gap cannot be
> filled retroactively. Before the rebuild relies on "who changed this setting and when" for any
> migrated configuration, someone should read the `Track Settings Activity` list and find out how much
> of the settings estate was ever being watched.
>
> Note that **vendor record edits are captured regardless** (batch 15 F521, via the Report Builder
> `VENDOR` field) — so at least one entity has always-on auditing outside this mechanism. There may be
> others; there is no list.

---

## C. Screen and field inventory (additions)

**`Create a User`** — Tabs: General · Output · Security · Access.
*General:* `User ID` · `Name` · `User Group` · `Extension` · `Email Address` · `Employee ID` ·
`Email Preference` · `Salesperson Code` · `Buying Group` · `Language Code` · `Default at Login` ·
`Cash Drawer` · `Payment Terminal` · `Tethered Terminal` · `Enable Signature Capture`;
STORIS Messenger Settings — `Enable Messenger Access` · `Review Messages at Logon` ·
`Messenger Administrator` · `Default Messenger Form`.
*Output:* `Printed Document Destination` · `Printer Zone` · `Default Logical Printer` ·
`Default Print Form` · `Default Hold Queue` · `Default Suppress Queue` · `Default Number Copies` ·
`Include Report Banner` · `Start Forms Printer at Logon`.
*Security:* `Password` · `Reset Password` · `Exempt from Active Directory Authentication` ·
`Login ID` · `Allow Logon Passthrough` · `Maximum number of concurrent sessions` ·
`User Locked Out` · PC Applications · Report Builder (`File Security Groups` ·
`Field Security Codes`) · CRM-InTouch (`Enable Corporate Access` · `District Manager` ·
`Store Manager Locations`) · `Enable UP System` · `UP System Administrator` ·
`Notify of License Expiration` · `Printer Admin Level` · `Access Archived Reports`.
*Access:* as F552–F554.

**`Create a User Group`** — Tabs: General · Access. Fields as F555, F552–F554.

**`Notifications Control Settings`** — Tabs: Configuration · Application Event Emails ·
Event Notifications via ERP.
*Configuration › General:* `STORIS Server Can Send Emails` · `Update Customer Email Address` ·
**`Capture Data Events`** · `Notification Register Retention Days` · `"From" Email Address` ·
`"From" Email Name` · `Send Test Email from STORIS Host Server`.
*OAuth2:* `Authentication Service` · `Client ID` · `Client Secret` · `Tenant Identifier` ·
`Authenticate with OAuth2 Authorization Server`.
*Email Server:* `IP Address` · `Port` · `User Name` · `User Password` · `Enable SSL` ·
`Send Test Email from Workstation to Email Server`.
*Notifications Server:* `Web Service URI` · `Wait For Server Response` ·
`Milliseconds To Wait For Response` · `Test Notifications Server Connections` ·
`Send Test Email from Notifications Server`.

**`Maintain Report Dictionaries`** *(a.k.a. Query Wizard Dictionary Maintenance)* — fields listed in
F543. Also:
> "To add a dictionary from a different source file, use the **`File Join Assistant`** available from the Actions button."
> "STORIS provides a **Microsoft® Excel spreadsheet containing a list of the source files and their associated dictionaries** available to you via Report Builder routines."

> That spreadsheet is **the STORIS data dictionary**, downloadable from the customer web site. For a
> parity audit it is the single highest-value artefact named in seven runs — it enumerates the
> **source files and fields** the audit has been recovering one screen at a time. It sits behind a
> customer login. Recorded in §I.

---

## D. Control settings catalog (additions)

| Setting | Record | What it decides |
|---|---|---|
| Report Builder Security master switch | General System Control Settings › **Security** tab | Enables the entire file/field model (F545) |
| `Licensing Expires` | General System Control Settings › **Licensing** tab | The date the expiry ladder counts back from (F556) |
| `Order Access Limited to Selling Store` | POS Control Settings | A sixth location-access axis (F552) |
| `Consumer Email Notifications` / `Consumer Text Notifications` | licensed submodules | Monthly notification caps (F557) |
| `Capture Data Events` | Notifications Control Settings | Gates event capture (F558) |
| `Notification Register Retention Days` | Notifications Control Settings | Retention of the notification register |

---

## E. Security permissions catalog — consolidated

**Eleven distinct access-control shapes**, complete as far as the audit can establish:

| # | Shape | Polarity | Keyed on | Source |
|---|---|---|---|---|
| 1–6 | The ten module records, ~360 permissions | **Allow** | User **and** group (unresolved) | batches 7–9 |
| 7 | `File Security Groups` — source-file access | **Deny** | User (seeded from staff type) | F540, F541, F547 |
| 8 | `Field Security Codes` — column data | **Deny** | User (seeded from staff type) | F540, F542–F544 |
| 9 | Purchase status `Suppress from Product Search` | **Deny** | User **or** group, per code row | batch 14 F507 |
| 10 | Transfer security | Allow | `(logon/from, to)` **pair** | batch 15 F519 |
| 11 | `Purchase Delivery Pad Days` | **Value-altering** | Permission on the viewer | batch 15 F523 |
| 12 | `Assign Screen Action Permission` | **Deny** | **Group only**, per `(program, action)` | F548 |
| 13 | Report `Access` field | Allow | **Report creator's choice** | F546 |
| 14 | Location restrictions | Allow | User and group, five axes, self-widening | F552, F553 |

> Counting distinct *mechanisms* rather than records, that is **eight non-module mechanisms** on top
> of the ten module records. The audit's earlier running count (nine, then ten) was low because
> Report Builder's two are separate mechanisms, not one, and the report `Access` field had not been
> found.

---

## F. State machines and enumerations (additions)

**The ten security modules** (F549): Create a User/Group · Import Data · Logistics · Payables ·
Personal Information · Purchasing · Receivables · Sales · Service · System. **Confirmed exhaustive.**

**Report `Access`** — three values: anyone · same staff type as creator · creator only (F546).

**License expiry ladder** — 15 days (flagged users, modal) → 10 days (flagged users modal + all users
banner) → 3 days (**all users** modal + banner, flag ignored) (F556).

**Over-cap notification lifecycle** — captured → `Event Repository` (30-day grace) → `Event Archive`
(moved by the `Consumer Event Notification` phantom) → recoverable only via STORIS (F558).

---

## G. Sequencing rules (additions)

**Seeded copy, confirmed as a house idiom** (F547). Group → user for security grants; product →
location for stock levels (batch 14 F502); settings → order for fill days (batch 15 F526); settings →
line for kit price, tax, cost, commission. **STORIS resolves once and stores the answer**, and
`Reset User Members` (F555) is the manual re-propagation command that this design requires.

**Deny-by-default, in exactly one subsystem** (F540). Report Builder inverts the polarity used
everywhere else.

**Configuration is read at logon, not per action** (F551) — a User file change needs a restart, while
location context switches live (F560).

---

## H. Open questions and gaps

**Top item — the standing question, now properly earned**

1. **User-versus-group precedence for the ~360 module permissions** (F550). Thirteen articles read
   across four batches, including both user routines and the report that dumps every setting.
   **Undocumented.** Three sub-cases *are* now resolved: seeded-copy for the Report Builder fields
   (F547), group-only for screen actions (F548), user-only for license notification (F556). The
   module permissions are not. **A vendor question.**

**Material gaps**

2. **What protects cost on regular STORIS reports?** (F545). The `Cost` classification is inert
   outside Report Builder. Either a control exists that the audit has not found, or the data is open
   there. **Observable — flagged as a parity test.**
3. **`Assign Screen Action Permission` is not enumerated anywhere** (F548). Potentially a permission
   set comparable in size to the ~360, with no catalogue article. Only enumerable from the live
   system.
4. **Active Directory integration is undocumented** (F555). `Exempt from Active Directory
   Authentication` is the only mention in seven runs. How AD is configured, and what STORIS does with
   it, is unread.
5. **Regional Processing's effect on group restrictions** (F552). `Create a User` says regional
   restrictions require it and stop being enforced without it; `Create a User Group` says its
   RESTRICTIONS block is active either way. Boundary unstated. **A security control switchable from
   an unrelated screen.**
6. **Does "restart STORIS" mean the session or the system?** (F551). Determines how long a revoked
   permission stays live.

**Documented but ambiguous**

7. **`Staff file` / `Staff Type file` versus `Create a User` / user group** (F547) — two vocabularies
   for what appear to be the same records. The Report Builder articles use one, the user routines the
   other. Not assumed identical; recorded.
8. **F553's self-widening scope** — whether the added location persists beyond the editing session is
   not stated.
9. **`ELP` still not expanded** (F559), though now confirmed as a per-event form/template selection.

**Terms — status**

10. **`ELP` — upgraded** from "partly understood" to *a form selected per event type in
    `Event Email ELP Selection`*. Acronym still unexpanded.
11. Seven undefined terms remain: `Twilight` · fly-by fulfillment · `Float Label` · `Ship Direct`
    (on a transfer) · `CFO Fields` · `Bypass Interim` · `Times per Day` · dollars-only adjustment ·
    `Velocity`.

**Corrections to earlier runs**

12. **The `File Security Groups` inference is retired** (F540, F545). It was recorded across batches
    7–9 as *"a seventh kind of access control able to override the other six"*. It overrides nothing;
    it is a separate, inverted system scoped to Report Builder. **Recorded as a correction rather than
    silently updated.**
13. **Batch 4's licensing model needs a second amendment** (F557). *Counts of sites* (batch 4), plus
    *true feature toggles* (batch 15 F538), plus *metered monthly consumption* (F557). Three shapes.
14. **Queue correction:** `Switch User` ≠ `Switch User Location` (F560). The former is still unread.
15. **Queue correction:** the two security routines are titled `Establish Report Builder Security
    Groups` / `Codes` and filed under **Customer Settings** (§A).

**Inferences (recorded as inference, not finding)**

- **I-93** — F551's restart requirement plus F547's seeded copies plus F555's `Reset User Members`
  together suggest STORIS holds user security in memory from logon. **Consistent with three
  independent statements but never stated.** Not adopted as fact.
- **I-94** — `PC Applications` and `Printer Admin Level` on the Security tab look like further
  permission groupings. **No article describes them.**

---

## I. Unknown unknowns

- **A downloadable Excel data dictionary exists** (§C, `Maintain Report Dictionaries`) listing every
  Report Builder source file and dictionary. **This is the highest-value artefact named in the entire
  audit** — it is the schema the audit has been reconstructing screen by screen. It sits behind the
  STORIS customer web-site login. **Getting it should be a named next step**, and it would change what
  the remaining runs need to read.
- **Two security systems with opposite polarity in one product** (F540). If STORIS built one
  deny-by-default subsystem, there may be others the audit has read *as if* they were allow-based.
  Nothing in batches 7–9 stated its polarity explicitly; it was inferred from the grant language. That
  inference should be spot-checked against live data.
- **`Enable UP System` / `UP System Administrator`** (§C) — an entire named subsystem appearing only
  as two checkboxes. `UP` is unexpanded and undocumented.
- **`CRM - InTouch`** — a named CRM subsystem with its own three-field access model
  (`Enable Corporate Access`, `District Manager`, `Store Manager Locations`) and a documented default
  of *"Users who have not been defined as one of the above cannot create or update any leads"* —
  **another deny-by-default pocket.** Sales leads are a module the audit's six-run queue never
  touched.
- **STORIS Cloud is a restricted environment** (F559), not merely hosted. Which deployment LA Mattress
  runs changes the parity target.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **File Security Group** | A named set of source files that all users are **restricted from**; a check in the user record lifts the restriction |
| **`Standard Files` (`STD`)** | Delivered, uneditable group containing every Report Builder source file; granting it grants everything |
| **Field Security Code** | A reusable classification tag bound to fields via the report dictionary; restricted users see the column header and no data |
| **Staff file / Staff Type file** | The user record and the user-group record, in Report Builder documentation's vocabulary |
| **Report `Access`** | Creator-set report visibility: anyone · same staff type · creator only |
| **Screen Action Permission** | Group-level control over Actions-button menu items, per `(program, action)` |
| **`Event Repository` / `Event Archive`** | Two stores for captured notification events; the `Consumer Event Notification` phantom moves records between them |
| **`ELP` form** | The template selected per event type for outbound notification email |
| **`Switch User Location`** | In-session location change; drops cash drawer, and printer/terminal if invalid |
| **`Reset User Members`** | Group-level command that re-pushes group values onto member users |
| **`Track` / `Review Settings Activity`** | Opt-in per-routine settings auditing, and its report |

---

## Contract adjudication — batch 16

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — and materially revised** | Eleven mechanisms; one is deny-by-default (F540); the "seventh kind overrides the other six" inference is **retired** (F545) |
| **W-051** *(licensing)* | **CONFIRMED — third shape found** | Metered monthly consumption (F557); UniData licence governed too (F556) |
| **W-041** *(batch calendar / background)* | **CONFIRMED** | `Consumer Event Notification` phantom (F558); `Input Processing` (F560); notification config gates `Schedule a Process` (F559) |
| **W-034** *(deletion)* | **NOT DOCUMENTED IN THIS SECTION** | No deletion semantics stated for security records |
| **W-064** *(auditability)* | **CONFIRMED, with a hole** | Opt-in per routine (F561); vendor edits always captured (batch 15 F521); everything unlisted has no history |
| **Deny-by-default security** | **NEW — no contract covers it** | F540, F541 |
| **Discretionary (author-set) access control** | **NEW** | F546 |
| **Seeded security grants, no propagation** | **NEW** | F547, F555 |
| **Self-widening location access** | **NEW** | F553 |
| **Permission changes require a restart** | **NEW** | F551 |

---

## Next — batch 17

`Switch User` (distinct from `Switch User Location`, F560) · `Process List Settings` (F554) ·
`Purge Messenger Activity` · `Membership Reward Settings` · `External Communications Settings` ·
`Payment History Code` — then **Customer Settings** (137, 135 unread), the run's largest unread
subsection, which also holds the two Report Builder security routines found in this batch.
