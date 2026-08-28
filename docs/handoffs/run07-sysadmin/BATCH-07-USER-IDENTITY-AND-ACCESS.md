# Run 07 — System Administration — Batch 7: The user record, PII masking, and reporting rules

Status: complete. Findings 414–427. Read-only throughout. No user created, no setting saved.

**This batch completes the access model.** Batch 6 gave the Regional Processing hierarchy; this gives
the user record it resolves against, the reporting rules that produced six runs of evidence, and a
**seventh kind of access control** the audit had not seen.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Create a User** | 15185876530068 | read — four tabs; **the identity and access model** |
| 2 | **Regional Processing - Reporting Rules** | 15185859800340 | read — **explains six runs of report boilerplate** |
| 3 | **Create a User/Group Actions - Personal Information Security** | 15185859628180 | read — **a masking model** |

---

## B. Wiring findings

### FINDING 414 — Location restriction is four independent lists, not one

- **Invariant:** a user's location scope is set separately for sales entry, sales reporting, inventory entry and inventory reporting.
- **Evidence** — `Create a User`, **Access** tab:
  > "**Sales** — Entry · **Location List** · View/Report · **Location List**
  > **Inventory** — Entry · **Location List** · View/Report · **Location List**"
  > "You can create a **global list of locations** via the Action button at the **`Global Location List`** field… **Or, you can restrict the user to a list of locations for specific areas of functionality.** For example, you can select the Location List option under **Sales Entry** and create a list…"
  > "you can restrict the user to a **combination of regions, districts, and log-on locations** via the **four Sales & Inventory selection prompts**. However… **STORIS recommends you assign each user to a single setting across the board.**"
- **Maps to:** run 07 F402 (the four-level hierarchy) — **materially extended**; `W-050`.

> Batch 6 F402 found that **sales scopes by district and inventory by region** and called that the
> correction. **It goes further: each of those two has separate entry and reporting scopes**, so a user
> carries **four independent location lists** plus an optional global one.
>
> That is a genuinely fine-grained model — *you may sell from these stores, report on those, take stock
> from these, and see inventory reports for those* — and it is more capable than anything the audit
> inferred from six runs of boilerplate.
>
> **The vendor recommends against using it**: *"STORIS recommends you assign each user to a single
> setting across the board."* So the capability exists, is discouraged, and is presumably used
> unevenly. **That is a question for the live configuration, not the documentation** — and it means an
> access review at LA Mattress has to read four fields per user, not one.

### FINDING 415 — Editing an order permanently widens the user's location list for that session — confirmed verbatim

- **Invariant:** locations on an edited order are added to the user's available locations.
- **Evidence** — `Create a User`, Access tab:
  > "**Locations may automatically be assigned to the order for both stock and fulfillment location lists. This means that even if the user is not assigned access to a specific location, editing an order with a location that is not normally permitted for the user adds that location to the list of available locations for both the stock and fulfillment location selection.**"
- **Maps to:** run 07 F404 — **CONFIRMED from the user record**; `W-050`.

> Batch 6 F404 found session-accumulating access from the Regional Processing article and called it a
> **sixth kind of access control**. **Here it is again, stated independently in the user record** — so
> it is not an artefact of one article's wording.
>
> Two independent statements of the same behaviour, from opposite ends of the model, is as strong as
> documentary evidence gets in this corpus. **Access in STORIS is not a property of a user; it is a
> property of a user's session, and it grows.**

### FINDING 416 — Fulfillment locations are restricted separately, by fulfillment method

- **Invariant:** delivery and customer-pickup location lists are set apart from stock access.
- **Evidence** — `Create a User`, **Fulfillment Location Restrictions**:
  > "Use these settings to assign an individual user a **list of fulfillment locations by fulfillment method, Delivery or Pick Up.**
  > **`Use Access Restrictions`** – Select this option… to use the **Inventory - Entry** radio group as the list of available fulfillment locations.
  > **`Location List`** – …build a location list of available fulfillment locations. **For Deliveries, the location list applies to sales order deliveries, exchange deliveries, and return pickups.** … The Location List field accepts a predefined list of locations (predefined via **List Type in `Process List Settings`** as '**Accessible Location List**')."
  > "When using a location list… **new fulfillments continue to default the stock and fulfilment location based on the Delivery Locations or Customer Pickup Locations settings in Warehouse/Store Location Settings for the selling store.**"
- **Maps to:** F414; run 07 F337 (POS Delivery/Customer Pickup Locations); `W-050`; `W-055`.

> **A fifth and sixth location list**, on top of F414's four — and these are scoped by *fulfillment
> method*, an axis nothing in six runs suggested. The delivery list also governs **exchange deliveries
> and return pickups**, so it is really "outbound and inbound customer movement".
>
> Note the interaction stated at the end: **restricting the list does not change the default.** New
> fulfillments still default from Warehouse/Store Location Settings for the selling store — so a user
> can be handed a default location that is not on their own list. Whether that is then permitted is
> not stated. Section H.
>
> **`Process List Settings`** with a **`List Type`** of `Accessible Location List` is a new record — a
> general list-definition facility the audit has not seen, and presumably the same machinery behind
> run 04's distribution lists and run 04 F256's distributed transfers.

### FINDING 417 — There is field-level and file-level security beneath the module records

- **Invariant:** users carry file security groups and field security codes, separate from module permissions.
- **Evidence** — `Create a User`, **Security** tab:
  **`PC Applications` · `Report Builder` · `File Security Groups` · `Field Security Codes`**
- **Maps to:** run 07 F410 (ten module security records) · run 06 F323 (Extended Security) — **a
  seventh *kind* of access control**; `W-050`.

> The audit has identified six kinds of access control across seven runs. **This is a seventh, and it
> operates at a level below everything else: individual files and individual fields.**
>
> `Field Security Codes` means a user can be denied a *field* — which would explain behaviours the
> audit met and could not account for, such as run 04's *"For unauthorized users, line items on such
> orders are inactive"* (run 05 F303) and the several screens whose fields *"are inactive"* depending
> on settings.
>
> Neither is documented beyond its field name here. **`File Security Groups` and `Field Security
> Codes` are now the two most consequential unread mechanisms in the access model**, because they can
> silently override anything the module records grant.
>
> **`Report Builder`** on the same tab ties to run 01's Report Builder security work and confirms
> reporting has its own authorisation layer.

### FINDING 418 — PII security is a masking model across four surfaces, not an access model

- **Invariant:** three data categories can be viewed unmasked on screens, reports, printed documents and exports, each separately.
- **Evidence** — `Create a User/Group Actions - Personal Information Security`:
  > "In order to use these security settings, **extended security must be active** on your system via the General System Control Settings."
  > "For each category listed below, options are offered for **viewing, reporting, document printing, and exporting**. **If an option is checked, the user or group of users are permitted to view the information unmasked.**"
  Categories: **`Date of Birth` · `Driver License Number` · `Social Security Number`**
  Options: **`View … information on documents exported to user's workstation` ·
  `View … information on printed documents` · `View date of birth information on reports` ·
  `View date of birth information on screens`**
  Plus: **`Access employee credit applications and score reporting`**
  > "The ability to control masking on **archived documents** is via the **`Document Archive Mask PII`** checkbox in General System Control Settings."
- **Maps to:** run 07 F378 (six encryptable PII categories) — **the access half**; run 06 F323
  (Extended Security dependency) — **CONFIRMED**; `W-050`; **NEW**.

> **Batch 4 inference I-73 is confirmed**: this record governs access to the PII that General System
> Control Settings can encrypt. But the model is **masking, not blocking** — the data is shown
> obscured unless the box is checked, which is the right design and a different thing from a
> permission.
>
> **Four surfaces**, and they are separately controlled: **screens · reports · printed documents ·
> exports to the workstation.** So a user can be allowed to see a driver's licence number on screen and
> not export it — which is precisely the control a data-protection review would ask for.
>
> **The export surface is the one to notice.** *"Documents exported to user's workstation"* is the
> exfiltration path, and it has its own checkbox per category. Any rebuild needs the same distinction.
>
> **`Access employee credit applications and score reporting`** is a separate line at the top — so
> **employees' own credit data is a distinct protected class** from customers'. Nothing in seven runs
> suggested STORIS holds employee credit applications.
>
> The Extended Security dependency confirms run 06 F323's chain and sharpens it: **turn off Extended
> Security and PII masking controls stop applying**, because the whole extended-security layer is
> inactive.

### FINDING 419 — Region/District and Location prompts on reports are mutually exclusive, and behave five ways

- **Invariant:** a report's location prompts activate according to the user's restriction level.
- **Evidence** — `Regional Processing - Reporting Rules`:
  > "**All Region or District prompts in report routines are inactive unless Regional Processing is turned on** in the General System Control Settings."
  > "Region or District prompts are **inactive if the log-on user is restricted to a store or list of locations**."
  > "**The District/Region prompts are mutually exclusive from the Location prompt. That is, only one can be active at the same time.**"
  Five cases: unrestricted with District/Region blank → **Location accessible, all warehouses** ·
  unrestricted with Location blank → **District/Region accessible** · restricted to one region/district
  → **Region/District inactive; Location shows all locations within it** · restricted to log-on
  location → **no selection at all** · restricted to a list → **Region/District inactive; Location
  shows the list**.
- **Maps to:** `W-050` — **the mechanism behind eight upholdings, from the reporting side**;
  batch 6 F412 (flagged as priority); F402.

> **This is the article behind the audit's own evidence.** Every one of the eight `W-050` upholdings
> came from the sentence *"the output of this report may be affected by Regional Processing
> restrictions"* on dozens of report articles. **This says what that does**: it decides **which prompt
> you get**.
>
> The mutual exclusivity is the design insight. **You filter by region *or* by location, never both** —
> because the restriction level determines which question the system can meaningfully ask you. A user
> restricted to one district is not offered a district prompt; they are offered the locations inside
> it.
>
> That reframes run 05 F307's observation that `Region` appears as a *grouping* on service reports. It
> is not a grouping — **it is the filter prompt, active because that user is unrestricted.**

### FINDING 420 — Seven named reports do not follow the Regional Processing rules

- **Invariant:** specific reports override the access model, three by ignoring location lists entirely.
- **Evidence** — `Regional Processing - Reporting Rules`, **Report Exceptions**, verbatim:
  > "**Report Open Sales Order Summary** … and **Report Open Sales Order Detail** … **always follow sales restrictions (district) regardless** of whether you are selecting your Sort By to Selling location or Ship from location or Stocking location."
  > "**Report Sales Orders with Delivery Dates in Jeopardy (Broken Promises)** … When you select **regular orders**, because location type is forced to stock location, the system bases location selection on **inventory restrictions (regional)**. When you select **special orders** … **Regardless of your selection, the system follows sales restrictions (district).**"
  > "**Product Performance and Purchase Recommendations (Full Buyers Worksheet) does not honor location list restrictions.** If Regional Processing is active, **you must have regional access to run this process**."
  > "**Report Open To Buy Information** does not honor location list restrictions…"
  > "**Automatic Purchase Order Replenishment** does not honor location list restrictions…"
  > "To use the **Report Reconciliation of Inventory to GL Values** routine, **you must have access to all locations.**"
- **Maps to:** F419; batch 6 F403 (fifteen entry-side exceptions); run 02 (Open To Buy, buyers
  worksheet); `W-050`.

> **Seven more exceptions**, on top of batch 6 F403's fifteen. **The access model now has
> twenty-two documented exceptions across two articles.**
>
> Three of these — the buyers worksheet, Open To Buy, and automatic PO replenishment — **do not honour
> location lists at all** and instead demand *regional* access. That is coherent: **buying decisions
> are made regionally**, and a buyer restricted to a list of stores cannot assemble a purchase
> recommendation. Run 02 dissected all three without knowing they sat outside the access model.
>
> **`Report Reconciliation of Inventory to GL Values` requires access to all locations** — the
> strictest requirement in the audit, and rightly so: a reconciliation of a partial inventory is
> meaningless.
>
> The Jeopardy report's split behaviour is the subtlest: **regular orders scope by region, special
> orders by district**, because the location type is forced differently. Run 05 F314 noted *jeopardy*
> as a cross-module concept calculated in neither place; **this adds that it is scoped in two different
> ways within one report.**

### FINDING 421 — Changing the User file requires a STORIS restart

- **Invariant:** user record changes do not take effect until the system is restarted.
- **Evidence** — `Create a User`:
  > "**NOTE: If you make a change to the User file, you must restart STORIS before the change can take effect.**"
- **Maps to:** run 06 F324, F325 (session bindings); `W-050`.

> **A one-sentence operational fact with large consequences.** Granting or revoking a permission does
> not apply until a restart — so **removing a departing employee's access is not immediate**, and
> neither is fixing a user who cannot do their job.
>
> Read alongside run 06 F325's `Switch User Location` (which re-honours *location* security mid-session
> without a restart) and F415's session-accumulating access, **the picture is that STORIS caches user
> security at session start.** That is consistent and it is the sort of thing that must be stated in an
> access-control design rather than discovered.
>
> For the cutover this is a real constraint on any parallel-run access changes.

### FINDING 422 — Concurrent sessions are capped per user

- **Invariant:** each user record carries a maximum concurrent session count.
- **Evidence** — `Create a User`, Security tab: **`Maximum number of concurrent sessions`** ·
  **`User Locked Out`** · **`Reset Password`** · **`Exempt from Active Directory Authentication`** ·
  `Login ID` · `Allow Logon Passthrough` · `Password`.
- **Maps to:** run 06 F327 (system-wide licence exhaustion) · run 07 F377 (`Licensed Users`) ·
  run 07 F380 (Active Directory); `W-050`.

> **A third layer of session limiting**, after the STORIS licence's `Licensed Users` (F377) and the
> UniData licence (F395). Per-user caps sit under both.
>
> **`Exempt from Active Directory Authentication`** is a per-user escape from the AD posture found in
> batch 4 F380 — so a site on AD can still keep service or shared accounts on STORIS passwords. That
> is a realistic and slightly worrying capability worth checking in any security review.
>
> **`User Locked Out`** is an explicit flag rather than a derived state, and **`Reset Password`** is an
> action on the record — the administrative half of run 06's log-in model.

### FINDING 423 — Licence expiry warnings escalate on a documented 15/10/3-day schedule

- **Invariant:** notification of licence expiry widens from opted-in users to everyone as the date approaches.
- **Evidence** — `Create a User`, **`Notify of License Expiration`**:
  > "**15 days** from expiration – the Acknowledge Message window appears **for these users**.
  > **10 days** – …appears for these users. Additionally, **all users receive a notification at the bottom of their STORIS session** after login… This message can be dismissed.
  > **3 days** – the Acknowledge Message window appears **for all users**…"
  > "**If this setting is not checked, no users are notified** of the expiration of the STORIS Software License. **A log is written indicating the license expiration and that no users have this setting checked.**"
  > "This setting **also governs UniData licenses**… If there are **3 or fewer days** until the expiration, **everyone who logs in sees the popup which is independent of the status of the Notify of License Expiration flag.**"
  > "**This setting is not available via Create a User Group.**"
- **Maps to:** run 06 F327 · run 07 F395, F398 — **the escalation, now precise**; `W-012`.

> Batch 5 F398 warned that a blank `Send Notification To` means silence. **This is the mitigation**:
> the warning escalates to everyone at ten days and unconditionally at three, and **if nobody is opted
> in, a log records that fact.**
>
> That is careful design — the system notices that nobody will be told and writes it down. Note the
> interaction with batch 4 F385, though: **logs are retained five days**, so the "nobody is opted in"
> record itself expires inside the warning window.
>
> **Not available at group level** means this must be set user by user, which is exactly how a
> well-intentioned control ends up unset.

### FINDING 424 — InTouch CRM access is a four-way model, and undefined users can do nothing

- **Invariant:** lead access is granted by salesperson code, corporate access, district manager, or store manager locations.
- **Evidence** — `Create a User`, Security tab, **CRM - InTouch**:
  > "The system restricts access to InTouch CRM data such as sales leads… **You can also grant access at the salesperson level.** If you enter a valid response at the **`Salesperson Code`** field on the General tab, the employee can access sales leads **for that salesperson**, in addition to any access you grant via the **`Enable Corporate Access`, `District Manager`, or `Store Manager Locations`** fields."
  > "**Users who have not been defined as one of the above cannot create or update any leads.**"
  Plus **`Enable UP System`** · **`UP System Administrator`**.
- **Maps to:** run 03 F117 (*"CRM security is a five-level model that is explicitly not Regional
  Processing"*) — **CONFIRMED and located**; run 03 F115 (the Up System's own security tab); `W-050`.

> Run 03 F117 found InTouch's security to be a five-level model **explicitly separate from Regional
> Processing**, and run 03 F115 found the Up System administered *"through a security tab, not the
> usual permission files."* **Both live on the user record**, and this is what they look like.
>
> The four grants are **additive** — salesperson code plus any of corporate, district manager, or store
> manager locations — and the default is **nothing**: an undefined user cannot create or update leads
> at all. That is a deny-by-default model, unusual in this system and worth noting as the exception.
>
> **`Enable UP System` and `UP System Administrator`** are the two fields behind run 03's finding, and
> they confirm the Up System has exactly two levels rather than a security record of its own.

### FINDING 425 — Messenger access is four per-user settings, including a default form

- **Invariant:** a user's messenger participation, review behaviour, administration rights and template are set on the user record.
- **Evidence** — `Create a User`, General tab, **STORIS Messenger Settings**:
  **`Enable Messenger Access` · `Review Messages at Logon` · `Messenger Administrator` ·
  `Default Messenger Form`**
- **Maps to:** run 06 F320 (`Mail Administrator`) · run 06 F321, F322 (Messenger-enabled prerequisite)
  · batch 5 F392 (`Message Review at Login`) — **all confirmed at the user level**; `W-050`.

> Run 06 F320 found `Mail Administrator` as *"a single unscoped user flag granting read access to
> every mailbox"* and flagged it as the bluntest permission in the audit. **Confirmed** — it is here,
> called `Messenger Administrator`, with no scoping fields beside it. **Eleventh terminology drift.**
>
> **`Enable Messenger Access`** is the flag that runs 06 F321 and F322 found gating group membership
> and report assignment. **`Review Messages at Logon`** is the per-user counterpart of batch 5 F392's
> system-level `Message Review at Login` — so it is set in two places, and which wins is not stated.
>
> **`Default Messenger Form`** implies messages have templates, connecting to batch 5 F393's `ELP Form`
> machinery.

### FINDING 426 — Output settings are eight per-user fields including two queue defaults

- **Invariant:** every user carries a complete printing profile.
- **Evidence** — `Create a User`, **Output** tab:
  **`Printed Document Destination` · `Printer Zone` · `Default Logical Printer` ·
  `Default Print Form` · `Default Hold Queue` · `Default Suppress Queue` · `Default Number Copies` ·
  `Include Report Banner` · `Start Forms Printer at Logon`**
  Plus, Security tab: **`Printer Admin Level`** and **`Access Archived Reports`**.
- **Maps to:** run 06 F325 (printer unassigned on location switch, output falling back to screen) —
  **the profile that gets unassigned**; run 06's Printing subsection; `W-050`.

> Run 06 F325 found that switching location silently unassigns an invalid printer and **falls back to
> screen output**. **This is the profile that happens to.**
>
> **`Default Hold Queue` and `Default Suppress Queue`** are two named print queues per user — so output
> can be held or suppressed by default, which is a real behaviour behind run 06's `Review Print Jobs`.
>
> **`Printer Admin Level`** is a graded rather than boolean permission — the first the audit has seen —
> and **`Access Archived Reports`** ties to batch 5 F322's Messenger-notified report distribution.

### FINDING 427 — `Report on User Security` is the permission-audit tool

- **Invariant:** enabled and disabled security settings are reportable per user or group.
- **Evidence** — stated identically in `Create a User` and
  `Create a User/Group Actions - Personal Information Security`:
  > "To view **which security settings are enabled and not enabled** for a user or user group, use **`Report on User Security`**."
- **Maps to:** F410 (ten module records) · F417 (file and field security) · batch 3 F368
  (`Track Settings Activity`); `W-050`.

> **The consolidated permission catalogue the audit has been assembling by hand is a report.**
>
> With ten module security records, four location lists, two fulfillment lists, file security groups,
> field security codes, CRM grants and Up System flags, **no human can read a user's effective access
> off the screens** — and STORIS knows it. `Report on User Security` reports both enabled *and*
> disabled settings, which is the right output for a review.
>
> Paired with `Track Settings Activity` and `Review Settings Activity` (batch 3 F368, batch 5 F394),
> **STORIS has three purpose-built audit tools** — for permissions, for settings changes, and for
> reporting on them. The audit found none of them in six runs because all three live here.
>
> **For the cutover, running `Report on User Security` across all users is the single most useful
> extract available**, and it is a better answer to "who can do what today" than anything this audit
> can reconstruct.

---

## C. Screen and field inventory

| Screen | Structure |
|---|---|
| **Create a User** *(tabs: General, Output, Security, Access)* | **General:** User ID · Name · **User Group** · Extension · Email Address · Employee ID · Email Preference · **Salesperson Code** · Buying Group · Language Code · **Default at Login** *(Cash Drawer · Payment Terminal · Tethered Terminal · Enable Signature Capture)* · **STORIS Messenger Settings** *(4)*. **Output:** 9 fields *(F426)*. **Security:** Password · Reset Password · **Exempt from Active Directory Authentication** · Login ID · Allow Logon Passthrough · **Maximum number of concurrent sessions** · **User Locked Out** · PC Applications · Report Builder · **File Security Groups** · **Field Security Codes** · **CRM - InTouch** *(Enable Corporate Access · District Manager · Store Manager Locations)* · Enable UP System · UP System Administrator · **Notify of License Expiration** · Printer Admin Level · Access Archived Reports. **Access:** LOGIN *(Warehouse/Store Location · Default a Login Location)* · **Fulfillment Location Restrictions** *(Delivery, Pick Up — Use Access Restrictions or Location List)* · RESTRICTIONS *(Company · **Global Location List** · **Sales: Entry + Location List, View/Report + Location List** · **Inventory: Entry + Location List, View/Report + Location List**)* |
| **Personal Information Security** | Grid · Check · Clear · `Access employee credit applications and score reporting` · per category *(DOB, Driver Licence, SSN)* × surface *(screens, reports, printed documents, exports)* |
| **Regional Processing - Reporting Rules** | *(reference article — prompt behaviour and seven report exceptions)* |

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Order Access Limited to Selling Store** | Point of Sale Control Settings | *"may also affect user access to orders, in addition to location restrictions"* |
| **`List Type` = `Accessible Location List`** | **`Process List Settings`** | Defines the lists used for fulfillment restrictions (F416) |
| **Document Archive Mask PII** | General System Control Settings | Masking on archived documents (F418) |

---

## E. Security permissions catalog — the model, consolidated

**Seven kinds of access control**, now complete:

| # | Kind | Mechanism |
|---|---|---|
| 1 | User/group permissions | **Ten** `Create a User/Group Actions - <Module> Security` records (F410) |
| 2 | Location scoping | Regional Processing four-level hierarchy (F402) + **four location lists** + **two fulfillment lists** (F414, F416); **22 documented exceptions** (F403, F420) |
| 3 | State-based locks | Manifest membership, aisle locks, order-level picking exclusivity |
| 4 | Location-pair matrices | Transfer security tables |
| 5 | Value-attached restrictions | `Restrict As-Is Products from being Sold` on reason codes (F408) |
| 6 | **Session-accumulated scope** | Opening a document adds its locations (F404, **F415**) |
| 7 | **File and field security** | `File Security Groups` · `Field Security Codes` (F417) — **unread** |

Beneath all of it: **Extended Security** must be active (run 06 F323, F418).
Above it: **PII masking across four surfaces** (F418).
Auditing it: **`Report on User Security`** (F427).

---

## F. State machines and enumerations (additions)

- **Location lists per user (7):** global · sales entry · sales view/report · inventory entry ·
  inventory view/report · delivery fulfillment · pickup fulfillment.
- **Report prompt behaviour (5 cases)** (F419).
- **Report exceptions (7)**, three ignoring location lists entirely (F420).
- **PII categories (3) × surfaces (4)** (F418).
- **CRM access grants (4, additive, deny-by-default)** (F424).
- **Licence warning escalation:** 15 / 10 / 3 days (F423).
- **Session limits (3 layers):** STORIS `Licensed Users` · UniData licence · **per-user concurrent
  sessions** (F422).

---

## G. Sequencing rules

1. User record changed → **STORIS must be restarted** before it takes effect (F421).
2. Log-in → session security cached; location switch re-honours location security (run 06 F325) but
   not other changes.
3. Order edited containing an unpermitted location → **that location is added to the session's lists**
   (F415).
4. Report run → Region/District **or** Location prompt active, per the five cases (F419) — unless the
   report is one of the seven exceptions (F420).
5. Licence approaching expiry → **15 days** opted-in users · **10 days** all users get a dismissible
   banner · **3 days** all users get the modal (F423).

---

## H. Open questions and gaps

### Resolved this batch

- **The reporting side of Regional Processing** — batch 6 F412's priority (F419, F420).
- **Batch 4 inference I-73** *(Personal Information Security governs the encryptable PII)* —
  **confirmed** (F418).
- **Run 03 F115 and F117** *(Up System and InTouch security)* — located on the user record (F424).
- **Run 06 F320's `Mail Administrator`** — confirmed as `Messenger Administrator` (F425).
- **The consolidated permission catalogue** — it is a report, `Report on User Security` (F427).

### Newly opened — priority

- **`File Security Groups`** and **`Field Security Codes`** (F417) — a seventh kind of access control,
  able to override everything else, documented only as two field names. **Highest priority.**
- `Report on User Security` · `Review Settings Activity` · `Process List Settings` ·
  `Create a User Group` · `Managing Users` — named, unread.
- The **nine remaining module security records** — the catalogue is now an enumerated, tractable task.

### Still open

- **Whether a defaulted fulfillment location outside a user's list is permitted** (F416).
- **Whether `Review Messages at Logon` (user) or `Message Review at Login` (system) wins** (F425).
- `Twilight`, `ELP`, `Account Status`, `This Reason is Used for` values.

### Inferences

- **I-74:** `Field Security Codes` is what makes fields *inactive* rather than absent on several
  screens the audit met (run 05 F303, run 06 F323). *Consistent with the observed behaviour; not
  stated.*
- **I-75:** STORIS caches user security at session start, which is why a restart is needed (F421) but a
  location switch is not (run 06 F325). *An explanation, not a documented mechanism.*

---

## I. Unknown unknowns

- **Access is a session property that grows** — now stated twice, independently (F404, F415). Any
  access review that reads the user record is reading a starting position, not an effective one.
- **A seventh access mechanism can override the other six** (F417), and it is two field names.
- **STORIS ships three audit tools** — `Report on User Security`, `Track Settings Activity`,
  `Review Settings Activity` — and six runs found none of them, because all three live in the section
  the queue omitted. **The right first move at LA Mattress is to run all three**, not to reconstruct
  their output by reading.
- **Employee credit applications exist** (F418). STORIS holds credit data about staff, not just
  customers, and it has its own permission line.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Global Location List** | The user's overall location scope, above the four functional lists |
| **File Security Groups / Field Security Codes** | File- and field-level access, beneath the module records |
| **Report on User Security** | Reports enabled *and* disabled settings per user or group |
| **Process List Settings** | Defines named lists, including `Accessible Location List` |
| **Messenger Administrator** | Read access to every mailbox *(= run 06's `Mail Administrator`)* |
| **Printer Admin Level** | A graded printing permission |
| **Acknowledge Message** | The modal used for licence-expiry warnings |

---

## Contract adjudication — batch 7

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — the model is complete, and it is seven kinds deep** | Four location lists plus two fulfillment lists (F414, F416); session accumulation confirmed twice (F415); **file and field security** (F417); 22 total exceptions (F403, F420); PII masking across four surfaces (F418); ten module records (F410); the audit tool (F427) |
| **W-012** *(dates)* | **CONFIRMED** | Licence warning escalation at 15/10/3 days (F423) |
| **W-064** *(retention)* | **relevant** | The "nobody is notified" log expires inside the warning window (F423 + F385) |
| **Data protection** | **NEW — a masking model** | F418 |
| **Session-accumulated access** | **NEW — confirmed independently** | F415 |
| **File and field security** | **NEW — a seventh kind** | F417 |

---

## Next — batch 8

The remaining nine module security records, building the consolidated permission catalogue; then
`Create a User Group`, `User Group Clone Process`, and a coverage statement closing **User Settings**
(49) before opening **Customer Settings** (137), where `Alert Code Settings` and `Status Code
Settings` live.
