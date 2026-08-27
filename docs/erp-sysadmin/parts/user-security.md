# Part: User Settings — Security articles (`SEC-001` … `SEC-010`)

*Section:* STORIS ERP → System Administration → **User Settings** (section `15172979328660`)
*Scope:* every article in that section whose title contains "Security" — 10 found, 10 written.
*Prefix:* `SEC` · *IDs:* `SEC-001` … `SEC-010`
*Companion file:* `user-security-CATALOG.md` (consolidated permission register, supersedes file 10 of the Inventory pack)

## Global rules that apply to all ten screens

- **Extended Security must be active system-wide** via *General System Control Settings* or **none of these
  settings do anything**. Every article repeats this. This is a single global kill-switch.
- Reached from **Create a User > Security tab > Actions button > `<domain>` Security** and, for nine of the
  ten, also from **Create a User Group > General tab > Actions button > `<domain>` Security**.
  **Transfer Security is the exception — it is not on the User Group Actions menu at all.**
- Verbatim from the articles: *"Settings accessed from the Create a User Group routine apply to all users in
  that group, while settings accessed via Create a User apply to the individual user."*
- **STORIS does not evaluate group and user settings together at runtime.** The group record is a *template*.
  See `SEC-000` note below and the CATALOG preamble.
- Every screen has the same grid furniture: an **All** button (check every box) and a **None** button (clear
  every box) above the grid. Several articles carry a copy/paste error here, describing the Check control as
  *"Click the Add button to add the specified From and To Location combination to the grid"* — that text
  belongs to Transfer Security and is wrong on the other nine screens. Do not implement it.
- Reporting: *"To view which security settings are enabled and not enabled for a user or user group, use the
  **Report on User Security**."*
- **A user record change requires a STORIS restart before it takes effect** (stated in *Create a User*).
  We must not replicate this.
- Denial pattern: an unchecked box normally raises the **Access Control Window** / **Security Override
  Screen**, which accepts the **user ID and password (or initials and password) of a user who does have the
  permission**, and the action proceeds. A handful of settings explicitly allow **no override** — those are
  called out in the tables and are the closest thing STORIS has to a hard deny.

### `SEC-000` (cross-cutting) — how user-level and group-level settings actually interact

Not its own article; assembled from *Create a User*, *Create a User Group*, and the Sales Security text.

- Both scopes exist. The *same nine* extended-security screens hang off both the User record and the User
  Group record (Transfer Security: user + warehouse/store location only).
- **Assigning a User Group to a user is mandatory** (*"This is a required field"*).
- Propagation is a **copy-down, not an inheritance chain**. On the User Group record there is a
  **`Reset User Members`** checkbox (the body text also calls it *Reset Staff Members*):
  *"When checked the system applies changes made to security settings to all other users in the current user
  group (that is, the system updates those individual user records). If you leave the box blank, the system
  does not update individual user records."*
- The same field is the mass-update mechanism when a user is moved between groups: *"If you change the user
  group to, for example, MANAGER, then access the MANAGER record in the User Group file and check the Reset
  Staff Members box, the system updates the User record so the field responses match the responses at the
  associated fields in the User Group file."*
- Group settings also act as the **default at user creation**. Sales Security, *Complete Orders for Ship
  Locations Other Than Login Locations*: *"When creating a new user, this setting defaults to checked,
  **unless you assign a user group that has this setting unchecked**."*
- **Therefore: at enforcement time only the individual User record is consulted. The user-level value always
  wins; the group value is a seed/bulk-edit tool.** Editing a group does *not* change existing members'
  effective permissions unless `Reset User Members` is checked, and when it is checked it **overwrites**
  per-user customisation with no diff, no preview and no undo.
- Group-level settings that *are* genuinely group-scoped and evaluated at runtime are the **menu security**
  and **location/regional restriction** settings on the group's Access tab — a different mechanism from these
  Actions-button permission grids.
- `[DECISION NEEDED]` This copy-down model is the single biggest thing we should **not** carry over. See the
  CATALOG preamble for the proposed replacement.

---

### `SEC-001` Create a User Actions - Transfer Security
*storis_ref: article 15185859625876*

**Purpose.** Defines, as an explicit allow-list of **From-Location → To-Location pairs**, which inventory
transfers a given user (or a given logon location) is permitted to create. It is not a checkbox list like
the other nine screens; it is a routing matrix.

**Where it lives.**
- `Create a User > Security tab > Actions button > Transfer Security`
- `Warehouse/Store Location Settings > Inventory & Logistics tab > Actions button > Transfer Security`

**Not present on the Create a User Group Actions menu** — this is the only one of the ten with no group-level
equivalent. Scope is *user* or *logon location*, never *group*.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Logon / User` | Display only | Shows the warehouse/store code if reached from Warehouse/Store Location Settings, or the user ID if reached from Create a User. Identifies which axis the table is keyed on. |
| `From Location` | Code + lookup | Source location. Arrow button = list of locations. **Action button = Multiple Location Selection Window, from which one or more locations can be chosen** (so a row can be added for many sources at once). |
| `To Location` | Code + lookup | Destination location. Same lookup + Multiple Location Selection Window behaviour. |
| `Check` | Button (`Add`) | *"Click the Add button to add the specified From and To Location combination to the grid."* |
| `Clear` | Button (`None`) | *"To clear the check-marks from all boxes, click the None button located to the right above the grid."* |
| Grid columns | Display | `From`, `Description`, `To`, `Description`, `Remove` |
| `Remove` | Button (per row) | Deletes that row of data from the grid. |
| Actions → `Remove All` | Action | *"You can use this action to remove all the rows in the grid at one time versus removing each row individually."* |

**Behavior & rules.**
- **This screen is inert unless `TRANSFERS - Use Transfer Security Tables` is checked on the Additional
  Settings tab of Inventory Control Settings.** Two-level gate: global Extended Security is *not* what turns
  this on — this specific Inventory Control setting is.
- **Fail-closed, and dangerously so:** *"If this box is checked and no tables are created, users cannot
  create transfers."* Turning the feature on without populating tables locks out **every** user from **every**
  transfer. This is the sharpest operational trap in the whole assignment.
- Denial is overridable: *"If you do not have the security to create a transfer, you must obtain a security
  override from a user with the ability to create the transfer."*
- The matrix can be keyed **by logon location and/or by user** — the two are independent tables reached from
  two different parents, and the article does not state how a user-keyed table and a location-keyed table
  combine when both exist. **`[DECISION NEEDED]` — assume both must permit (AND), which is the safe reading.**

**Dependencies.**
- `CFG-INV-*` — `TRANSFERS - Use Transfer Security Tables` (Inventory Control Settings > Additional Settings).
- `SEC-LOG-BYPASSXFER` (Logistics Security → *Bypass Transfer Security Settings*) **completely defeats this
  screen**: *"Users that have this setting enabled are able to override security for users that are
  restricted."* Any audit of transfer rights must check that flag first.
- Warehouse/Store Location Settings (Inventory & Logistics tab).
- Consumed by transfer creation: Enter a Transfer (As-Is, Floor Sample, Stock), auto-transfers from POS.

**Build notes.**
- Model as `transfer_permission(subject_type ENUM('user','location'), subject_id, from_location, to_location)`.
  Store pairs, evaluate as a set membership test; support wildcard rows (`* → WH1`) which STORIS lacks and
  which is the main reason its tables become unmaintainable.
- **Do differently:** never fail-closed silently on an empty table. If the feature flag is on and zero rows
  exist, refuse to save the feature flag and surface *"Transfer security is enabled but no rules exist — all
  transfers would be blocked."*
- **Do differently:** make `Bypass Transfer Security Settings` a named, separately-audited break-glass role,
  not an ordinary checkbox sitting in the Logistics list.
- Group-scope this in our system even though STORIS does not — per-user transfer matrices do not scale.

---

### `SEC-002` Create a User/Group Actions - Import Data Security
*storis_ref: article 15185859622804*

**Purpose.** Grants or withholds access to each individual import routine available in the **Import Data**
process, one checkbox per import.

**Where it lives.**
- `Create a User > Security tab > Actions button > Import Data Security`
- `Create a User Group > General tab > Actions button > Import Data Security`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Grid rows | Checkbox per import | *"Items listed in the grid correspond to the import processes listed in the Import Data routine."* The row set is **dynamic** — it mirrors whatever imports the installation exposes; the article deliberately does not enumerate them and points at the *Import Data Additional Information* topic instead. |
| `Check` / `Clear` | Buttons | All / None above the grid. |

**Behavior & rules.**
- *"Check the associated box in order to grant the user/user group access to the import process. Uncheck the
  box to require the user/user group to obtain a security override in order to access the import process."*
- **All import processes are checked by default.** This is a deny-nothing default on a screen that controls
  bulk data mutation — the most permissive default in the whole pack.
- Requires global Extended Security to be active.

**Dependencies.**
- Import Data routine (row set is derived from it — this is a *reference* to another catalogue, not a fixed list).
- `CFG-SYS-EXTSEC` (General System Control Settings → extended security active).
- `SEC-AR-IMPMISAPPLY` (Receivables → *Import Customer Payments - Misapply Payments*) is a **second, finer**
  gate layered on top of the *Import Customer Payments* row here.

**Build notes.**
- Our equivalent must be a **registry-driven** permission: each importer declares a permission key at
  registration, and the admin UI renders from the registry. Never a hand-maintained list.
- **Do differently: default new importers to DENY, not ALLOW.** A newly shipped importer inheriting
  "everyone" is a straightforward path to mass data corruption.
- Imports are bulk-write operations; each grant should carry a row-count/rollback policy, not just a boolean.
- `[DECISION NEEDED]` Do we allow the security-override pattern (a manager types credentials to let a clerk
  run an import) for imports at all? Recommendation: **no** — require the permitted user to run it themselves,
  so the audit trail names the actual operator.

---

### `SEC-003` Create a User/Group Actions - Logistics Security
*storis_ref: article 15185875554452*

**Purpose.** Extended security for warehousing, stock adjustment, transfer execution, receiving, routing,
manifesting and ticket printing. 51 boolean flags plus one three-state.

**Where it lives.**
- `Create a User > Security tab > Actions button > Logistics Security`
- `Create a User Group > General tab > Actions button > Logistics Security`

**Fields** — *"Allow a User To:"* (permission wording is verbatim; catalog IDs in `user-security-CATALOG.md`)

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Adjust Stock Directly to As-Is | — | Access to the **As-Is Adjustment tab** on Enter a Stock Adjustment. |
| Adjust inventory for locations when WMS is active | — | Make stock adjustments, receive POs, or release orders for completion **at WMS locations**. |
| Adjust inventory quantities within stock adjustment entry | — | Access to the **Quantity tab** (increase/decrease QOH) and **Write-Off tab** (write off non-saleable goods) of Enter a Stock Adjustment. |
| Apply or Remove an As-Is Restricted Reason Code to Inventory | — | **Only users with this box can assign/remove reason codes flagged "As-Is Restricted" in Reason Code Settings.** Others need an override. |
| Bypass Transfer Security Settings | — | **Overrides `SEC-001` entirely** — *"Users that have this setting enabled are able to override security for users that are restricted."* |
| Change Directed Putaway Storage Location | — | Manually change putaway destination during directed putaway; otherwise the **Security Override Screen** appears. |
| Change Floor Tag Print Options | — | Change `Form Name` / `Print Method` in Print an Inventory Floor Tag, Print a Transfer Floor Tag, Print a Barcode Floor Tag, Print a Purchase Order Floor Tag. |
| Change Fulfillment Status to SCH with a Balance Due | — | Schedule delivery fulfillments for **unpaid** orders. **If `Change Fulfillment Status to SCH with a Balance Due` is enabled in Point of Sale Control Settings, all users get this and the per-user setting is not reviewed. If neither is enabled the order cannot be scheduled at all.** |
| Change auto transfer date to be greater than delivery date | — | Let auto-transfer dates surpass the linked sales order's delivery date (merchandise arrives after the customer's date). |
| Complete Merchandise Transfer | — | Complete a merchandise transfer. |
| Complete Transfer from Receiving Location Only | — | Restricts completion to users logged into the **receiving** location. |
| Create a container freight batch | — | New freight batches via Receive a Purchase Order with a Separate Freight Bill. |
| Create a manifest with both transfers and customer deliveries | — | Add merchandise transfers to a delivery manifest (Manifest Routing). |
| Delete an Entire Manifest | **checked** | Delete a whole shipping manifest; unchecked ⇒ override required. |
| Distribute transfer quantities to multiple locations in one transfer | — | Multi-destination transfer entry. |
| Enter a Stock Adjustment - Change Special Order Detail on a Specific Piece | — | Access the **SO Info tab** in Enter a Stock Adjustment; otherwise the tab is inactive. |
| Enter a Stock Adjustment - Update an as-is piece spiff table | — | Access `Spiff Amount` on the **Move to As-Is** and **As-Is Status** tabs. Does not prevent creating spiff tables via Spiff Table Settings — applying them needs this. |
| Enter vendor charge-back adjustments | — | Access the **Vendor Chargebacks tab** in Enter a Stock Adjustment. |
| Establish Route Capacity Control Settings | — | Access Route Capacity Control Settings; set default delivery route cutoff parameters. |
| Exit a partially unloaded float during picking | — | RF: exit unload before all merchandise scanned. **Unloaded pieces retain their float links; only Review Float Status clears them.** Without permission → override required. |
| Generate count sheets with inventory quantity | — | If unchecked, `Generate Blind Format` is **auto-selected and unavailable** in Print Count Sheets / Print Bar Code Physical Inventory Count Sheets — user can only print blind sheets. |
| Initiate the Freeze Physical Inventory process | — | Run Freeze Inventory (Physical Inventory Freeze). |
| Manually reserve stock merchandise | — | Force/remove reservation of stock to an order line. Applies to **Additional Line Item Details (`Reserved Quantity`)** and the **Inventory Selection Screen (`Assign Pieces`)** from Enter a Sales Order / Enter an Exchange / Enter a Service Order. **Overrides write the overriding user's ID into audit comments. NOT consulted by Reassign a Sales Reservation — use menu security for that.** |
| Override Complete Carton Requirements - Purchase Orders | — | Override complete-carton rule when creating a PO. |
| Override Complete Carton Requirements - Store to Store Transfers | — | Same, store→store. |
| Override Complete Carton Requirements - Store to Warehouse Transfers | — | Same, store→warehouse. |
| Override Complete Carton Requirements - Warehouse to Store Transfers | — | Same, warehouse→store. |
| Override Complete Carton Requirements - Warehouse to Warehouse Transfers | — | Same, warehouse→warehouse. |
| Override Distribution Status - Only at Selling Location for Transfers | — | Transfer products whose Advanced Product Settings distribution status is *"Only at Selling Store"*, **when the transfer originates from a warehouse**. Otherwise standard override prompt. |
| Override Transfer Capacity Restrictions | — | Override transfer route restrictions **including scheduling transfers on days that are over capacity**; else credential prompt. |
| Override Transfer Restriction of Exceeding Maximum Stock Levels | — | Exceed max stock level in a transfer; else override required. |
| Override capacities when scheduling Delivery routes that are closed | — | Override volume / dollar amount / stops / units capacities on **closed** routes. |
| Override capacities when scheduling Delivery routes that are full | — | Same capacities on **full** routes. |
| Override maximum delivery date postponements for stores | — | Keep postponing delivery/pickup dates after auto-release. **Active only if Auto Stock Release is active.** |
| Print a customer pickup ticket within POS entry | — | Access `Print Pickup Ticket` (Enter a Sales Order) and `Print Exchange Ticket` (Enter an Exchange). |
| Print a delivery ticket within POS entry | — | Access `Print Delivery Ticket` (Enter a Sales Order), `Print Exchange Ticket` (Enter an Exchange), Print Delivery Tickets. |
| Print a transfer ticket within Transfer Entry | — | Print pickup/delivery tickets from Enter a Transfer, incl. As-Is, Floor Sample, Move to As-Is and Stock transfers. |
| Receive a Purchase Order with a Separate Freight Bill - Allow Close Batch | **checked** | Choose the `Close Batches` option in that routine. |
| Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by Cost | — | Select `Cost` in `Freight Distribution by`. |
| Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by Volume | — | Select `Volume`. |
| Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by Weight | — | Select `Weight`. |
| Receive a Purchase Order with a Separate Freight Bill - Override Freight Amount | — | Change `Total Freight Amount` away from the Vendor Ship From Settings default. **"Use of this security override is not recorded."** See the override matrix below. |
| Recount Storage Location | — | Re-enter a count to **replace** rather than add to an existing count during cycle/physical count. **Only applicable when the warehouse/store setting `RF Physical Count – Use STORIS label as UPC` is checked.** |
| Schedule deliveries and pickups with unreserved merchandise | — | Apply SCH status to orders/exchanges with unreserved lines; **also applies to linked auto-transfers**. Sales Order/Exchange Entry check this **on save**; Logistical Scheduling checks it **on line update**. **With multiple fulfillments/dates, only the next delivery date is evaluated.** |
| Schedule deliveries and service orders for the same route | — | Mix delivery and service orders on one route. |
| Set or change As-is selling price within stock adjustment entry | — | Set/change as-is selling price in Enter a Stock Adjustment. |
| Supply Default Quantities within Receive a Purchase Order | — | Controls the `Supply Default Quantities` checkbox. **Checked ⇒ the box defaults to checked and is editable. Unchecked ⇒ the box defaults to unchecked and ticking it raises the Security Override Screen.** Applies to both *Receive Merchandise* and *Reverse a Receiving Error*. |
| Transfer merchandise within stock adjustment entry | — | Move merchandise between store/warehouse locations inside Enter a Stock Adjustment. |
| Update status and stop time for an order on a manifest | — | Edit delivery contact status and stop time via Transaction Update – Logistical Scheduling. |
| Update an Order with a linked Auto-Transfer on a Manifest | — | Update an order/exchange when a line is linked to a manifested auto-transfer. **Without it and without an override, the order opens read-only.** |
| View a route's capacity calendar within POS entry | — | Read-only Route Capacity Settings via the Action button at `Next Date` in Enter a Sales Order; else Access Control Window. |
| **Allow to Over Receive Merchandise** | *(three-state)* | `No` / `Yes` / `Override Required`. Covers (a) receiving more than the **open quantity** on a PO line in Receive a Purchase Order and (b) scheduling to over-receive via Assign Purchase Orders to a Bar Code Receiving Batch. *Open quantity = order quantity − quantity already received.* **This setting does NOT affect RF users — RF over-receiving is governed by `Allow Over Receiving` in Bar Code Control Settings.** |

**Behavior & rules.**
- Grid controls here are described correctly: *"To check all boxes in the grid at once, click the All button
  located to the left above the grid"* / None button to clear.
- **`Allow to Over Receive Merchandise` is the only genuinely three-valued permission in the entire pack**
  (`No` / `Yes` / `Override Required`). Everything else is a checkbox whose "unchecked" meaning is
  *usually but not always* "override required".
- **Override Freight Amount matrix** (verbatim conditions — when a security override is needed to change
  `Total Freight Amount`):

  | 'Vendor Ship From' option chosen | Default Amount | Override needed? |
  |---|---|---|
  | `'None Selected'` | N/A. User can enter any freight amount. | **No** |
  | Any option except `'None Selected'` | Default amount does not exist. User can enter any freight amount. | **No** |
  | Any option except `'None Selected'` | Default amount does exist. Default amount is displayed. | **Yes** |
  | User changes the prior option to a new option | Default amount exists for the new option. New option's default amount is displayed. | **Yes** |
  | User changes the prior option to a new option | Default amount does not exist for the new option. Amount displayed does not change. User can change it. | **No** |
  | User changes the prior option to `'None Selected'` | Amount displayed does not change. User can change it. | **No** |

**Dependencies.**
- `SEC-001` Transfer Security (defeated by *Bypass Transfer Security Settings*).
- `CFG-POS-*`: `Change Fulfillment Status to SCH with a Balance Due` (POS Control Settings) — an
  **OR** relationship that makes the per-user flag moot when the global is on.
- `CFG-INV-*`: Reason Code Settings ("As-Is Restricted"), Spiff Table Settings, Auto Stock Release.
- Bar Code Control Settings → `Allow Over Receiving` (governs RF, not this screen).
- Warehouse/Store Location Settings → `RF Physical Count – Use STORIS label as UPC`.
- Vendor Ship From Settings → `Freight Amount`.

**Build notes.**
- The five *Override Complete Carton Requirements* rows are one permission with a **transfer-leg parameter**
  (`PO | S2S | S2W | W2S | W2W`). Implement as one permission + scope enum, not five booleans.
- Same for the four *Freight Distribution by* rows: one permission with an allowed-methods set.
- **Do differently:** *"Use of this security override is not recorded"* on Override Freight Amount is an
  outright audit gap on a money field. **Every override in our system logs, without exception.**
- **Do differently:** global-setting-wins semantics (`Change Fulfillment Status to SCH with a Balance Due`)
  make permissions unreviewable. Our effective-permission API must return the *reason* a grant resolved the
  way it did, naming the winning rule.
- `Allow to Over Receive Merchandise` is the model we should generalise: **every** permission in our system
  should be `deny | allow | allow_with_override` rather than a bare boolean.

---

### `SEC-004` Create a User/Group Actions - Payables Security
*storis_ref: article 15185875557140*

**Purpose.** Extended security for Accounts Payable: vendor invoice entry, check printing, bank settings,
GL account maintenance and customer refund bills. 15 flags.

**Where it lives.**
- `Create a User > Security tab > Actions button > Payables Security`
- `Create a User Group > General tab > Actions button > Payables Security`

**Fields** — *"Allow a User To:"*

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Access General Ledger Account Settings | — | Grants **all five** GL settings routines: `Cost Center Settings`, `Sub-Account Settings`, `Accounts Settings`, `General Ledger Period Settings`, `General Ledger Control Settings`. Unchecked ⇒ **Access Control Window prompts for the ID and password of a permitted user.** |
| Approve refund bills | **checked** | Approve customer refund bills in Select and Approve Bills for Payment. **New batch + not enabled ⇒ `Customer Refund` defaults unchecked; invoking it prompts for override, and without one it stays blank. Existing batch that already includes refunds (or already had Customer Refund enabled) + not enabled ⇒ a security override is mandatory to continue.** |
| Change exchange rate during vendor invoice entry | — | Access `Exchange Rate` in Enter/Update Individual Vendor Invoice. |
| Change invoice payment terms during vendor invoice entry | — | Edit `Terms` on the **Check Information tab** of Enter/Update Individual Vendor Invoice. Unchecked ⇒ Access Control Window (initials + password). |
| Change product replacement cost during vendor invoice entry | — | When the user edits `Unit Cost`, offers to push the new cost into `Replacement Cost` in Advanced Product Settings. **Applies only to regular merchandise bills (Merchandise/Invoice and Direct Ship/Invoice AP bill types) and excludes special-order processing on those orders.** |
| Change reconciliation beginning balance in Bank Settings | — | Change `Beginning Balance` on the Reconciliation tab of Bank Settings. **Also, when checked, permits Purge Reconciled Transactions.** (Two capabilities on one flag.) |
| Change transaction entry date for new payable bills | — | *"In this way, you can prevent users from back-dating AP bills."* Blank ⇒ must accept the default date. |
| Create new vendors during vendor invoice entry | — | Vendors on-the-fly during invoice entry. |
| Create vendor remit-to addresses during vendor invoice entry | — | Vendor remit-to records on-the-fly; unchecked ⇒ Access Control Window. **Also restricts temporarily overriding the customer's remit-to address for the current payable bill (e.g. Update Customer Remit-To).** |
| Delete payable bills after third party accounting transmission | — | Delete transmitted AP bills **including customer refunds**. **Active only if TPA is active in General System Control Settings.** |
| Print accounts payable checks | — | Print AP checks. |
| Print refund checks | **checked** | Print customer refund checks in Select and Approve Bills for Payment and Print Checks. **If not enabled and the batch includes customer refunds, an override is required to reach Print Checks.** |
| Select alternate payment methods during vendor invoice entry | — | Alternate payment methods in vendor invoice entry. |
| Update an exported check run | — | Update an exported check run in Select and Approve Bills for Payment. **Without it the process opens in query mode — no updates or deletions.** |
| View encrypted AP account numbers | — | View `Account Number` on the General tab of Bank Settings. **Otherwise the program encrypts the field.** Field-level redaction, not screen-level. |

**Behavior & rules.**
- **Module gate:** *"These settings are available only if AP, GL or TPA is active."* On top of the global
  Extended Security gate.
- Two flags are **checked by default** (`Approve refund bills`, `Print refund checks`) — i.e. customer refund
  money movement is open to everyone out of the box.
- `View encrypted AP account numbers` is a **field-level redaction** permission, in the same family as
  `SEC-COST-VIEW`, `View encrypted finance, credit card, check account numbers` (Sales) and the whole of
  Personal Information Security.

**Dependencies.**
- `CFG-SYS-*`: General System Control Settings — AP / GL / TPA active flags, extended security active.
- Bank Settings, Vendor Settings, Advanced Product Settings (`Replacement Cost`).
- Overlaps `SEC-006` *Update product replacement or special order option cost within purchase entry screens*
  — the same `Replacement Cost` field is writable from two different domains under two different permissions.

**Build notes.**
- Split `Change reconciliation beginning balance in Bank Settings` into two permissions
  (`bank.reconciliation.edit_beginning_balance`, `bank.reconciliation.purge`). Bundling a destructive purge
  behind a balance-edit checkbox is a defect, not a feature.
- Replacement-cost write access should be **one permission owned by Inventory**, referenced by AP and
  Purchasing, rather than duplicated per module.
- **Do differently:** default `Approve refund bills` and `Print refund checks` to **unchecked**. Cash-out
  paths default closed.
- `View encrypted AP account numbers` must be enforced in the **serializer**, not the UI: masked at the API
  boundary so the full value never leaves the server for an unpermitted principal.

---

### `SEC-005` Create a User/Group Actions - Personal Information Security
*storis_ref: article 15185859628180*

**Purpose.** Controls **unmasking of PII** — date of birth, driver licence number and social security number —
independently per output channel (screen, report, printed document, export), plus access to employee credit
data. This is a redaction matrix, not an action-permission list.

**Where it lives.**
- `Create a User > Security tab > Actions button > Personal Information Security`
- `Create a User Group > General tab > Actions button > Personal Information Security`

**Fields** — *"Allow a User To:"*

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Access employee credit applications and score reporting | — | View applications and score reporting **for other employees**. **Hard prerequisite: *"In order for a user to view sensitive employee information they must first be granted access to view sensitive customer information."*** (i.e. the Receivables *Access other credit applications and score reporting* flag). |

Then, verbatim: *"**Settings Listed Below** — For each category listed below, options are offered for
viewing, reporting, document printing, and exporting. If an option is checked, the user or group of users are
permitted to view the information **unmasked**."*

**The three categories are:** `Date of Birth`, `Driver License Number`, `Social Security Number`.
**The four channels are:** screens, reports, printed documents, documents exported to the workstation.
⇒ the prose describes a **3 × 4 grid, 12 settings**.

**But the screen exposes only five labels.** Verified against the article markup: the labelled settings are
exactly the five below. Two are written generically to cover all three categories at once; two name date of
birth alone; the remaining four cells of the grid (driver licence and SSN, on reports and on screens) are
**implied by the prose but never labelled.** Treat those four as derived, not verbatim — see the
`PII` table in `user-security-CATALOG.md`, where they are marked *(derived)*.

| Permission (verbatim — these five are the actual labels) | Gate / effect |
|---|---|
| Access employee credit applications and score reporting | *(above)* |
| View (date of birth/driver license/social security) information on **documents exported to user's workstation** | *"the user can view information sent to the workstation that does not fit into the reporting category. For example, the **Insurance Premium File Creation** program fits in this category."* Blank ⇒ cannot view unmasked. **Covers all three categories.** |
| View (date of birth/driver license/social security) information on **printed documents** | *"the user can view information printed via **Enhanced Laser Printing** or **forms printing**."* Blank ⇒ cannot view unmasked. **Covers all three categories.** |
| View **date of birth** information on **reports** | Unmasked on reports. Blank ⇒ masked. **Names date of birth only.** |
| View **date of birth** information on **screens** | Unmasked on screens. **Names date of birth only. Surprising rule, verbatim: *"if the user entered the data STORIS does not immediately mask the data. When a user without this box checked accesses the customer again, the sensitive data is masked."*** — masking is applied on **re-access**, not on entry. |

**Behavior & rules.**
- **Masking is per-channel, not per-record.** A user can legitimately be allowed to see an SSN on screen and
  still get it masked on an export — the four channels are independent grants.
- **The entry-session leak is real and is stated in the docs:** the person who typed the value keeps seeing it
  unmasked for that session. Any equivalent we build must decide whether to reproduce that.
- **Archived documents are out of scope of this screen:** *"The ability to control masking on archived
  documents is via the **Document Archive Mask PII** checkbox in General System Control Settings."*
- The employee-credit flag is a **two-key** permission: employee PII requires customer PII access first.
  The same permission name also appears in Receivables Security (`SEC-007`) — it is one setting surfaced on
  two screens, not two settings.

**Dependencies.**
- `SEC-AR-ACCESS-EMPCREDIT` / `SEC-AR-ACCESS-OTHERCREDIT` (Receivables Security) — same/prerequisite flags.
- `CFG-SYS-DOCARCHIVE-MASKPII` — General System Control Settings → `Document Archive Mask PII`.
- Enhanced Laser Printing / forms printing; Insurance Premium File Creation; Report Builder field security
  codes (a separate mechanism on the user's Security tab).

**Build notes.**
- Implement as `pii_access(subject, field_class ∈ {dob, dl, ssn, …}, channel ∈ {screen, report, print, export})`.
  Make `field_class` extensible — we will need bank account, card PAN, phone, email at minimum, and STORIS's
  hard-coded three will not survive contact with our data.
- **Redaction must happen server-side at the serializer, per channel.** The unmasked value must never be sent
  to a client that is only permitted the masked form, and export/print jobs must re-check the permission of
  the **requesting** user at render time, not at queue time.
- **Do differently: no entry-session exemption.** If a user is not permitted to see a value, mask it
  immediately after save, including for the author. If we keep an exemption it must be time-boxed and logged.
- **Do differently:** archived/print artefacts must inherit the redaction of the requester automatically —
  a separate global `Document Archive Mask PII` switch that can silently be off is a compliance hole.
- Every *successful* unmask should be logged too, not only denials — PII reads are the case where the read
  itself is the auditable event.
- `[DECISION NEEDED]` LA Mattress PII scope: do we store SSN/DL at all? If we can avoid storing them, most of
  this screen collapses to "card last-4 and DOB", which is far cheaper to get right.

---

### `SEC-006` Create a User/Group Actions - Purchasing Security
*storis_ref: article 15185859411732*

**Purpose.** Extended security for purchase order creation and maintenance, replenishment, direct ship,
EDI submission, cost updates, and PO hold policy. 20 flags plus two three-state hold policies with
threshold amounts.

**Where it lives.**
- `Create a User > Security tab > Actions button > Purchasing Security`
- `Create a User Group > General tab > Actions button > Purchasing Security`

**Fields** — *"Allow a User To:"*

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Access product settings during the replenishment process | — | Advanced Product Settings via the Actions button at the bottom of the **Items for Replenishment Screen**. *"The restriction at the Actions button can be overridden by users with proper security clearance."* |
| Access the Comments tab from View a Purchase Order | — | Comments tab in View a Purchase Order. |
| Change Total Cost on a Configured Product | — | Change `Unit Cost` for a configured product during PO entry. **"This setting does not override any other rules or settings regarding purchase order costs."** |
| Change purchase order Pay Before Receipt setting | — | Change `Pay Prior to Receipt` on the Totals tab of Enter a Purchase Order. **"Document comments are generated for all security overrides."** |
| Create replenishment purchase order not on hold | — | POs from Replenish Inventory for Current Back Order Needs that do **not** default to hold. **Blank ⇒ such POs are placed on hold.** |
| Create new products within purchase order entry | — | Checked ⇒ create products on-the-fly in Enter a Purchase Order **and** get the *editable* Product file via `Review Product Settings` (Actions, Merchandise tab). Blank ⇒ cannot create on-the-fly **and** `Review Product Settings` is **read-only**. |
| Create special order purchase orders within POS entry | — | **Reuses existing Inventory-pack ID `SEC-PO-SOPOS`.** POs on-the-fly in order entry for special-order products. **`Purchase Order/Assignment Required` in Special Order Control Settings OVERRIDES this: if that box is checked, all users must create a PO or reserve inventory for special-order items regardless of this flag.** |
| Create stock product purchase orders within POS entry | — | POs on-the-fly in order entry for **stock** products. Interacts with `PO From Order Entry` in Product Settings: when that is checked and stock is zero, Sales Order Entry prompts to create a PO — **this flag suppresses that prompt.** |
| Direct Ship - Add a New Line to a Direct Ship Purchase Order | — | Add a new sales-order line item to a direct-ship PO. **"The new line added automatically links to the same sales order associated with the existing lines on the purchase order."** |
| Direct Ship - Delete a Direct Ship Purchase Order or a Direct Ship Purchase Order Line | — | Delete direct-ship sales-order line items linked to a PO, or delete an entire PO. |
| Edit EDI purchase orders that were electronically submitted | — | **Reuses existing Inventory-pack ID `SEC-PO-EDIT-EDI`.** Edit POs already electronically submitted to manufacturers/vendors. |
| Edit purchase orders that have been printed or emailed | **checked** | **Reuses existing Inventory-pack ID `SEC-PO-EDIT-SENT`.** Edit POs submitted by print or email. **Unchecked ⇒ a message is displayed and the user is not allowed to continue — no override path is described.** |
| Edit purchase orders within the Full Buyer's Worksheet | — | Access and edit an existing PO from the Purchasing tab of Product Performance and Purchase Recommendations (Full Buyer's Work Sheet). **Unchecked ⇒ Purchase Order Inquiry (read-only) only.** |
| Electronically submit (EDI) purchase orders within POS entry | — | Submit POs via EDI from Sales Order Entry. |
| Reduce Special Order quantities on Purchase Orders linked to a Sales Order | — | Remove PO lines for special-order products linked to an existing sales order, reduce the line quantity, or delete the whole PO. |
| Reduce purchase quantity below billed quantity | — | Reduce ordered quantity linked to a **paid Pending Bill** below the billed quantity. |
| Reopen a Closed Purchase Order | — | Open closed POs in Enter a Purchase Order. |
| Update product replacement or special order option cost within purchase entry screens | — | Update replacement costs from **Purchase Order Entry, Purchase Order Acknowledgement, Product Performance and Purchase Recommendations, and Enter Special Order Options.** Checked ⇒ editing `Unit Cost` prompts to update `Replacement Cost` in Advanced Product Settings; blank ⇒ no prompt. |
| View expected receipt date for a product | — | See expected receipt date in View Product Activity and View Product Availability. |
| View True PO Delivery Date | — | **Excludes purchase delivery pad days** when calculating purchase lead days, so the log-on user sees the "true" delivery date. |

**Three-state hold policies (not checkboxes):**

| Field | Values | Rule |
|---|---|---|
| `Create Manual Purchase Order On Hold` | `Always` / `Never` / `Threshold` | Applies **only when a new PO is created with `On Hold` unchecked**. `Always` ⇒ PO is forced on hold and the `On Hold` box is **inaccessible**. `Never` ⇒ user can access `On Hold`; PO not held. `Threshold` ⇒ `On Hold` accessible and unchecked by default, but **if the PO subtotal exceeds `Threshold Amount` the PO is automatically placed on hold and the user gets: *"Sub Total exceeds your threshold of xxxx, purchase order will be placed on hold."*** |
| `Threshold Amount` (for Create) | Integer ≥ 0 | **Unavailable until `Create Manual Purchase Order On Hold` = `Threshold`, at which point it becomes mandatory.** *"This amount may be any integer greater than or equal to zero."* |
| `Take Purchase Order Off Hold` | `Always` / `Never` / `Threshold` | Applies **when accessing an existing PO with `On Hold` checked**. `Always` ⇒ can uncheck. `Never` ⇒ cannot uncheck. `Threshold` ⇒ can uncheck, then the subtotal is compared to `Threshold Amount`: **below ⇒ processed; above ⇒ security override offered, and *"In the case of an override, a purchase order audit comment is recorded"*; no override ⇒ the entry is rejected.** |
| `Threshold Amount` (for Take Off Hold) | Integer ≥ 0 | Unavailable until `Take Purchase Order Off Hold` = `Threshold`, then mandatory. |

**Behavior & rules.**
- **Threshold is an integer** — no cents. Note this if we port the value.
- The `Create` and `Take Off Hold` thresholds are **two independent amounts** on the same screen.
- `Edit purchase orders that have been printed or emailed` is one of the few flags that is **checked by
  default and, when unchecked, has no override** — a genuine hard deny.
- Note the **explicit cross-reference pair**: EDI-submitted POs and print/email-submitted POs are governed by
  two different flags and the article tells you so in both directions.

**Dependencies.**
- Reuses `SEC-PO-SOPOS`, `SEC-PO-EDIT-EDI`, `SEC-PO-EDIT-SENT` from the Inventory pack.
- `CFG-INV-SPECORD-POREQ` — Special Order Control Settings → `Purchase Order/Assignment Required`
  (**overrides** `SEC-PO-SOPOS`).
- Product Settings → `PO From Order Entry`; Advanced Product Settings → `Replacement Cost`.
- `SEC-004` Payables (`Change product replacement cost during vendor invoice entry`) writes the same field.
- `SEC-008` Sales (`Create purchase order not on hold from POS entry`) is the POS-side twin of
  `Create replenishment purchase order not on hold`.

**Build notes.**
- Model hold policy as `{mode: always|never|threshold, threshold_minor_units}` — and use **minor units
  (cents)**, not STORIS's integer dollars.
- `Create new products within purchase order entry` bundles *create* and *edit-vs-read-only*. Split them.
- **Do differently:** "no override, message and stop" (print/email PO edit) should be expressed by our
  three-state `deny` value, so that the absence of an override path is *declared* rather than implied by prose.
- `View True PO Delivery Date` is a **data-transformation** permission (it changes a computed value, not
  access). Keep those in a separate class from action permissions so they are not mistaken for access grants.

---

### `SEC-007` Create a User/Group Actions - Receivables Security
*storis_ref: article 15185875555988*

**Purpose.** The largest permission surface in the pack: credit applications and scoring, customer payments
and refunds, deposits, installment contracts, revolving plans, repossession, gift cards, and payment-type
access. ~109 flags plus four non-boolean settings and one Actions sub-screen.

**Where it lives.**
- `Create a User > Security tab > Actions button > Receivables Security`
- `Create a User Group > General tab > Actions button > Receivables Security`

**Fields** — *"Allow a User To:"* (grouped for readability; wording verbatim)

**Credit applications & scoring**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Access credit applications for Third Party On-Line financing | — | Existing finance credit applications from third-party providers. **Enumerated providers: `CitiFinancial`, `Wells Fargo`, `GE Capital`, `Encompass`, `Capital One`, `TD Bank`.** |
| Access employee credit applications and score reporting | — | Existing credit applications for **employee** customers + credit scores, SSNs etc. Prerequisite for `SEC-005`'s employee flag. |
| Access other credit applications and score reporting | — | Existing credit applications via Request Credit Information for **non-employee** customers + scores/SSNs. **When UNCHECKED, Review Pending and Review Pending on Hold do not allow access *even if the user is the initiating salesperson*.** |
| Access credit applications - Request Credit Information | **unchecked** | Lets a user *without* the above update a credit application **via Request Credit Information only**. Unchecked ⇒ cannot access an existing application without an override. |
| Allow Due Day Change | **unchecked** | Governs `Due Day` in Advanced Customer Settings **when the customer has an active balance**. Permitted users may self-override by entering their initials. **If the customer has no active balance the due day changes with no override at all.** |
| Update Customer's credit score | — | Edit `Primary` / `Co-applicant Credit Score` in Customer Credit and Scoring Information. |
| Update bankruptcy score | — | Edit `Primary` / `Co-applicant Bankruptcy Score`. |
| Update Scoring classification | — | Edit `Classification`. |
| Update credit source | — | Edit `Credit Source`. |
| Update Customer lien requests | — | Edit `Request a Lien`. |
| Update Customer's Credit Limit | — | Edit `Customer Credit Limit` and `Co-signer Credit Limit`. |
| Update Manually Entered Customer Credit Holds | — | Edit `Place Credit Hold`. |
| Update Customer's Web Lock | — | Edit `Web Access Locked` on the eSTORIS tab of Advanced Customer Settings. |
| Establish unlimited credit limit for customer | — | Enter a **null** credit limit (= unlimited). **Mutually exclusive with `Set a Customer's Maximum Credit Limit to $` — you cannot set a maximum for a user who has this.** |
| Approve F4 credit holds placed on financed orders | — | Remove F4 credit holds. |
| Review Pending Credit Request - Manually approve linked sales order | — | Manually approve an order linked to a credit request after manually approving the request (e.g. limit $1000, order $1100). **Works in conjunction with the `Installment Credit Approval Limits` sub-screen.** |
| Remove Co-applicant from Credit Application | **checked** | Remove the co-applicant when the primary account has a receivable balance on file. |
| Finance Application - Override finance queue | **unchecked** | Override the FR Application Queue's automatic provider selection and pick a specific provider. |
| Review and resubmit failed finance settlement batches | — | Access `Resubmit Settlement Errors` in Finance Receivables. |

**Customer & deposit maintenance**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Advanced Customer Settings - Change customer store location | — | Change a customer's store location. **Does not affect the Reassign a Customer's Store Location routine.** |
| Advanced Customer Settings - Create new customer | — | Create customers via Customer Settings / Advanced Vendor Settings. **Does not apply to creating customers on-the-fly.** |
| Override Duplicate Social Security Number Restriction | — | Override `Allow Duplicate Social Security Numbers` (AR Control Settings). **Also applies to co-applicant SSNs.** |
| Maintain Customer Balances - Refund | — | Refund Action fields on the **Keyoffs tab** of Maintain Customer Balances. |
| Maintain Customer Balances - Charge off an Account Balance | — | **Bad Debt tab** ("Bab Debt" in the source) of Maintain Customer Balances. |
| Maintain Customer Balances - Key Off a Credit/Debit Balance | — | **Key-Offs tab**. |
| Maintain Customer Balances - Manually Adjust an Account Balance | — | **Manual Adjustments tab**. |
| Maintain Customer Deposits - Apply | — | Select `A` (Apply) at the `Action` field in Maintain Customer Deposits. |
| Maintain Customer Deposits - Check Refund | — | Select `R` (Check Refund). |
| Maintain Customer Deposits - Finance Credit | — | Select `F` (Finance Credit) — removes a financed deposit and credits finance receivables. |
| Maintain Customer Deposits - Immediate Refund | — | Select `I` (Immediate Refund) — original payment type. **The payment type must also be active at `Immediate Deposit Refund Types` in AR Control Settings.** |
| Maintain Customer Deposits - On-Account | — | Select `O` (On-Account). |
| Apply a Deposit Greater than the Balance Due | **unchecked** | **Only consulted when `Deposit Overpayment Allowed` in AR Control Settings is checked.** |
| Overpay Charged Off Accounts | **unchecked** | **Only when `Allow Overpayments on Charged Off Accounts` is enabled in AR Control Settings.** |
| Override Daily Maximum Cash Refund Per Customer | — | Override the AR Control Settings cap. Message: ***"The maximum cash amount allowed for a refund is $XXXX.XX. Continue?"*** Unchecked ⇒ manager initials + password required; exceeding message: ***"The customer has exceeded the Daily Maximum Cash Refund Per Customer amount by $XXXX.XX. Continue?"*** |
| Override Pre-Authorized Deposit Amount Increase Limit | — | Increase a pre-authorized deposit by more than `Amount Increase Limit` (EMV tab, Payment Card and Device Settings). **Requires username + password in the Access Control Window.** |

**Payment entry & refunds**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Apply payments without Autopay | — | Apply payments to open items / revolving with or without Auto Pay. **Applies only to Enter a Customer Payment/Refund/Gift Certificate — NOT to Enter a Customer Payment.** |
| Backdate Payments | — | Backdate payments within an open sales month to dates not yet closed. Unchecked ⇒ override required. |
| Enter a customer finance payment | — | Payments received from customers for financed orders. |
| Enter a negative customer finance payment after settlement | — | Negative finance receivables payments **after settlement** (accounting correction path). |
| Enter payments during cash balancing approval by manager | — | Reach Enter a Customer Payment/Refund/Gift Certificate via `Cash Post` from Balance Approval by Manager. |
| Enter payments during cash balancing by cashier | — | Enter payments via the payment programs. **Only has effect if `Balance By` in Cash Balancing Control Settings = `Cashier`.** |
| Enter a Payment/Refund/Gift Certificate - Issue Deposit Refund | — | Process deposit refunds. |
| Enter a Payment/Refund/Gift Certificate - Issue Refund by Check | — | `Issue Refund By` = check. |
| Enter a Payment/Refund/Gift Certificate - Issue Refund by Gift | — | `Issue Refund By` = gift card/certificate. |
| Enter a Payment/Refund/Gift Certificate - Issue Refund by Other | — | `Issue Refund By` = any other payment method. |
| Enter a Payment/Refund/Gift Certificate - Refund Gift Balance | — | Refund gift card/certificate balances (Gift Cards and Certificates tab). **Works with `Refund Gift Balance` in AR Control Settings, which decides whether the system issues such refunds at all.** |
| Edit a finance provider payment amount after batch selection | — | Edit `Amount` in Apply Payments From Finance Provider. |
| Receive a Default for the Payment Amount | — | Default the payment amount into the Payment Summary / payment entry window. Blank ⇒ user must type the amount. |
| Legal Settings - Override Payment Restrictions | — | Post payments to customers with legal codes set to not accept payments. Applies across **Enter a Customer Payment, Enter a Customer Payment/Refund/Gift Certificate, Enter a Sales Order, Enter an Exchange, Enter a Return, Adjust Dollars on a Completed Order, Enter a Service Order.** **NOT available for eSTORIS, eBridge, or Import Customer Payment — those simply fail with an error code.** |
| Import Customer Payments - Misapply Payments | **unchecked** | `Misapply Payments` on the Selection tab of Import Customer Payments. |
| Allow Manual External Credit Card Authorization | — | Manually authorize external credit card transactions. |
| EMV-Allow Manual EMV Credit Card Entry | **unchecked** | Manager-override capability for manual credit card entries. |
| Type in credit card numbers if using online processing | — | **"This is for Legacy credit card processing only."** |
| Type in checking account numbers if using online processing | — | Manual keying of checking account numbers. |
| Type in finance account numbers if using online processing | — | Manual keying of finance account numbers. |
| Type in authorization numbers for financed orders | — | Manual keying of authorization numbers under electronic financing. |
| Type in Gift Certificate/Card number during payment entry | — | Key rather than swipe. **If unchecked the user may still input via a POS barcode scanner — the system treats scanner input as "non-manual".** |
| Type in new gift card numbers if card swiping is required | — | Overrides `Require Swipe for Gift Certificates?` in AR Control Settings. |
| View Encrypted Gift Card PIN | **unchecked** | View a gift card's **full PIN** in View a Gift Certificate. Field-level redaction. |
| Collector Review - Automatic Display of Customer User Defined Settings | **unchecked** | Auto-open the User Defined Settings entry screen on customer select in Collector Review - Customer Update. *(A UX preference living in the permission grid.)* |

**Installment receivables**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Installment - Add Contract Grace Days | — | Manage and Adjust Installment Contracts > Adjust Payment Terms. |
| Installment - Adjust a contract balance | — | > Adjust a Contract Balance. |
| Installment - Change a contract status | — | > Update Contract Status. |
| Installment - Contract Activation/Expiration Dates | — | Override activation/expiration dates in > Installment Worksheet. |
| Installment - Exclude Contracts from Auto Pay | — | `Exclude Contracts from Auto Pay` on Adjust Payment Terms. |
| Installment - Extend Contract's Number of Months | — | > Adjust Payment Terms. |
| Installment - Forgive Late Fees on a payment due | — | > Forgive Late Fees. |
| Installment - Merge Contracts | — | > Installment Worksheet. |
| Installment - Refinance Customers | — | > Installment Worksheet. |
| Installment - Manage and Adjust - Credit Request Review | — | Extra-action button; without permission **the button is not active**. |
| Installment - Manage and Adjust - Enter a Sales Order | — | Extra-action button; inactive without permission. |
| Installment - Manage and Adjust - Request Credit Information | — | Extra-action button; inactive without permission. |
| Installment - Manage and Adjust - Take a Payment | — | Extra-action button; inactive without permission. **Which payment screen it opens is set by `Installment; Manage and Adjust Payment Method` below.** |
| Installment - Override Customer Return Automatic Cancellation Days | — | Override the auto-cancel window after a customer return in Enter a Return. **Blank ⇒ the user is restricted from entering financing on a return and the credit goes on account.** |
| Installment - Override Deferment Fee | — | > Defer Installment Payments. |
| Installment - Override Deferment Settings | — | Override how many times a payment can be deferred in a rolling 12 months. **Blank ⇒ limited by `Defer [] Payments Within a Rolling 12 Month Period` in Installment Receivables Control Settings.** |
| Installment - Override Due Day | — | Override the default due day in the Installment Worksheet. |
| Installment - Override Due Day/Change Settings | — | Change `Due Day` on Adjust Payment Terms. **Permits changing *any* customer's due day. The field is unavailable if the customer has a past due balance.** |
| Installment - Override Revoke Same as Cash Terms | **unchecked** | Override revocation of "same as cash" terms on payoff, past `Revoke Same as Cash After ___ Late Fees` in Installment Payment Plan Settings. |
| Installment - Override the Maximum Days for Back-Dating Payoffs | — | Applies in Enter a Customer Payment and Enter a Customer Payment/Refund/Gift Certificate. |

**Revolving receivables**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Change or remove insurance on a customer's revolving plan | — | **Does not apply to initial entry of an insurance code, only to subsequent edits. If `Insurance Required` is enabled in Revolving Receivables Control Settings you cannot remove insurance from an existing plan at all.** |
| Finance Receivables - Allow Adjustments After Partial Completion | — | Controls use of `Contracts - Allow Adjustments after Partial Completion` in Finance Provider Settings. |
| Finance Receivables - Override Plan Eligibility Restrictions | — | Apply a promotional finance plan whose eligibility restrictions are unmet. **Answering Yes puts the order on `F4` credit hold and saves it** (clear via Update Financing Credit Approvals). Without permission: obtain an override or choose a different plan code. |
| Revolving Payment Plan Restrictions - Override Classification Code Restriction | — | Approve a plan when the customer's Revolving Classification Code does not match the plan's. |
| Revolving Payment Plan Restrictions - Override Location Restrictions | **unchecked** | Manually enter a location-restricted plan at `Financing Payment Type Code`. |
| Revolving Payment Plan Restrictions - Override Maximum Credit Score | **unchecked** | Same, max-credit-score-restricted plan. |
| Revolving Payment Plan Restrictions - Override Minimum Credit Score | **unchecked** | Same, min-credit-score-restricted plan. |
| Revolving Payment Plan Restrictions - Override Minimum Deposit Amount | **unchecked** | Same, minimum deposit amount/percentage. **Not re-evaluated on the open part of a partially invoiced order unless a material change is made.** |
| Revolving Payment Plan Restrictions - Override Minimum Financed Amount | **unchecked** | Same, minimum financed amount. **Same non-re-evaluation exception. "When credentials are supplied in a security override, an audit comment is logged."** |
| Revolving Payment Plan Restrictions - Override Past Due Days | **unchecked** | Same, past-due-days restriction. |
| Revolving Payment Plan Restrictions - Override Plan Active Dates | **unchecked** | Same, plan active dates. |
| Revolving Terms and Conditions - Add a New Plan | — | Add a new plan in Enter a Customer's Revolving Terms & Conditions. **Blank ⇒ may edit existing plans but not add.** |
| Revolving Terms and Conditions - Apply Insurance to All Plans | — | **Only meaningful for users who already have `Change or remove insurance on a customer's revolving plan`.** Propagates an insurance change to **all** the customer's revolving plans on Save, with a warning and a prompt to print insurance letters per plan. Without it, only the edited plan changes. |
| Revolving Terms and Conditions - Close a Plan | — | Access `Closed` (date) to close an active plan to new activity; otherwise the field is inactive. |
| Revolving Terms and Conditions - Increase MMP Amount | — | Increase `MMP $` / `MMP % of Balance`. |
| Revolving Terms and Conditions - Maintain Payment Agreements | — | `Payment Agreement` global extra action. **Only if Payment Agreements are active in Revolving Receivables Control Settings and in the Revolving Payment Plan.** |
| Revolving Terms and Conditions - Maintain Promotional Plans | — | Add/change promotional plans (no interest / no payments). |
| Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction | **unchecked** | Set the plan MMP below the minimum in Revolving Payment Plan Settings. |
| Revolving Worksheet - Override Required Percentage Paid for Add-On | — | Override `Required Percentage Paid before Add-on Allowed`. |
| Revolving Worksheet - Reduce MMP Amount on Fixed MMP Plans | — | Reset MMP lower during worksheet entry. **Only for plans calculating MMP `As a Fixed MMP Amount`.** |
| View All Revolving Activity - Add Insurance | — | `Add Insurance` extra action in View All Revolving Plan Activity for a Customer. **Only offered when none of the customer's active or pending plans have insurance; adds to all *active* plans at once, not pending.** |
| View All Revolving Activity - Adjust Revolving Plans | — | Access and adjust plans from that screen. |
| View All Revolving Activity - Credit Request Review | — | **Requires additionally one or both of `Access employee credit applications and score reporting` / `Access other credit applications and score reporting`.** |
| View All Revolving Activity - Enter a Sales Order | — | Extra-action button; inactive without permission. |
| View All Revolving Activity - Request Credit Information | — | Extra-action button; inactive without permission. |
| View All Revolving Activity - Take a Payment | — | Opens Enter a Customer Payment/Refund/Gift Certificate. |
| View All Revolving Activity - View Credit Status Hold Codes | **checked** | **If unchecked the user sees the literal message `"See Cashier"` in the Credit Status Results process.** |

**Repossession**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Repossession - Access Waived (LET) Items | **checked** | Access the Waived Item Select screen. **Unchecked ⇒ cannot include the "Items Purchased Since Last Zero Balance Date" section on Request Legally Entitled To (LET) Documents, cannot add waived items via Process Repossessed Items, and the `Add Waived Items` extra action in Original Document Select (Repossessions) is inactive.** |
| Repossession - Override Legal Setting for Allowing Repossessions | — | Post repossessions when the legal setting `Allow Repossession` is **not** checked. |

**Non-boolean settings**

| Field | Type | Rule |
|---|---|---|
| `Set a Customer's Maximum Credit Limit to $` | Amount | Ceiling on what this user/group may set as a customer credit limit. **Requires `Update Customer's Credit Limit`. Mutually exclusive with `Establish unlimited credit limit for customer` — *"if the user has [that] enabled, you cannot also set a maximum amount in this field."*** |
| `Installment; Manage and Adjust Payment Method` | Enum | `Enter a Customer Payment` **or** `Enter a Customer Payment/Refund/Gift Certificate`. Chooses which screen `Installment - Manage and Adjust - Take a Payment` opens. |
| `Payment Class Access` | 9 checkboxes + per-type deny list | Classes: **`Cash`, `Checks`, `Credit Cards`, `Financing`, `Miscellaneous`, `Gift Cards`, `Debit Cards`, `Revolving`, `Installment`.** **All checked by default.** Unchecking a class denies every payment type in it. **Within a permitted class, the Action button opens a list where you tick the payment types the user is NOT permitted to use — an inverted, deny-list semantic inside an allow-list checkbox.** Example given: allow the Credit Cards class but tick `VISA` to deny it. |
| `Credit Hold Queue Codes` | Multi-select | Restricts which hold codes appear on the **Credit Hold Queue** screen. Multiple Selection Lookup Window; one code shows its description under the label; multiple shows a "multiple selected" description. **If no codes are selected the description reads `"No Credit Hold Codes"` and the user cannot access the Credit Hold Queue at all.** **These codes affect the Credit Hold Queue ONLY — they do not restrict Update Receivables Credit Approvals or Update Financing Credit Approvals.** |
| Actions → `Installment Credit Approval Limits` | Sub-screen | Separate limits screen reached from the Actions button; interacts with `Review Pending Credit Request - Manually approve linked sales order`. *(Not documented in this article — treat as a separate requirement.)* |

**Behavior & rules.**
- **The `Payment Class Access` inversion is the single most error-prone construct here.** A ticked box at
  class level = allow; a ticked box in the per-type sub-list = **deny**. Two opposite meanings for a tick on
  the same screen.
- The credit-application family is a lattice, not a flat list: employee access requires customer access
  (`SEC-005`), `Credit Request Review` requires one of the two access flags, and `Request Credit Information`
  is a narrow carve-out for users who have neither.
- A documented back door, verbatim: *"if you do not have access to general credit request processing … you
  may still be able to re-access a credit application that you created … the credit application must be open
  (no decision has been applied) and the salesperson code on the credit request must match the logged in user
  … Once the request item is declined or approved, all restrictions are in affect."*
- **Overrides here do log** (`Revolving … Override Minimum Financed Amount`: *"When credentials are supplied
  in a security override, an audit comment is logged"*) — inconsistent with Logistics, where one override is
  explicitly **not** recorded.

**Dependencies.**
- `SEC-005` Personal Information Security (employee/customer credit access prerequisite chain).
- `CFG-AR-*` (Accounts Receivable Control Settings): `Deposit Overpayment Allowed`, `Allow Overpayments on
  Charged Off Accounts`, `Daily Maximum Cash Refund Per Customer`, `Allow Duplicate Social Security Numbers`,
  `Immediate Deposit Refund Types`, `Refund Gift Balance`, `Require Swipe for Gift Certificates?`,
  `Minimum Deposit Percent for Take With Lines`.
- Installment Receivables Control Settings, Installment Payment Plan Settings, Revolving Receivables Control
  Settings, Revolving Payment Plan Settings, Finance Provider Settings, Payment Card and Device Settings (EMV
  tab), Cash Balancing Control Settings (`Balance By`), Legal Settings.
- `SEC-002` Import Data Security (the *Import Customer Payments* row).

**Build notes.**
- **Do differently: make `Payment Class Access` a pure allow-list at the payment-type level.** One table
  `permitted_payment_types(subject, payment_type_id)`, with a class-level convenience toggle in the UI only.
  Never ship two opposite meanings of "checked" on one screen.
- The `Installment - *` and `Revolving Terms and Conditions - *` families are natural **roles**. We should
  ship composite roles (`installment_admin`, `revolving_admin`, `collections`) that expand to flags, so
  nobody hand-ticks 20 boxes.
- `Collector Review - Automatic Display of Customer User Defined Settings` is a **UI preference, not a
  permission**. Move it out of the security model.
- Mutual exclusion (`unlimited credit limit` × `maximum credit limit`) must be a **validated constraint** at
  save time with a clear error, not a documentation note.
- The "salesperson who created it can re-access an open application" carve-out must be an **explicit
  ownership rule** in our policy engine (`resource.owner_id == principal.id AND resource.state == 'open'`),
  not an implicit special case buried in a screen.
- `[DECISION NEEDED]` LA Mattress does not run installment or revolving in-house receivables today. Confirm
  whether the ~50 `Installment - *` / `Revolving *` flags are in scope at all, or whether we implement only
  the third-party-finance and deposit/refund subsets now and stub the rest.

---

### `SEC-008` Create a User/Group Actions - Sales Security
*storis_ref: article 15185859408660*

**Purpose.** Extended security for point of sale: order/quote/layaway/exchange/return entry, discounting,
pricing, fulfillment and scheduling, commission and spiff, deletion policy, and sales-data visibility.
~120 flags plus six non-boolean settings.

**Where it lives.**
- `Create a User > Security tab > Actions button > Sales Security`
- `Create a User Group > General tab > Actions button > Sales Security`

**Source note.** This article renders as **two tabs**. Their content is byte-identical apart from one phrase
in *View encrypted finance, credit card, check account numbers* ("bank account numbers" vs "credit card or
bank account numbers") and the closing NOTE, which is present in tab 1 only. **Tab 1 is authoritative here**
because it carries the extra NOTE. No permission exists in one tab and not the other.

**Fields** — *"Allow a User To:"*

**Discounting & pricing**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Access Subtotal field on sales orders | — | Discount an order by adjusting the subtotal amount on the **Payment tab**. |
| Access global discounts on dollar only adjustments | — | Apply/remove global discounts at `Discount Code(s)` on the Payment tab of Adjust Dollars on a Completed Order. |
| Access global discounts on returns | — | Global discounts on the Payment tab of return entry. |
| Access sales order line discounts | — | Enter/edit line-item discounts on the **Merchandise tab** (sales orders) and **Sell Merchandise tab** (exchanges). **Unchecked ⇒ the only line-discount option available is the auto-apply feature. Does NOT apply to Payment-tab discounts.** |
| Apply Subtotal Discount%, Discount Amount or Discount Codes | — | Subtotal discounts on the Payment tab, via codes or an additional amount/percent. |
| Discount POS Dollar Adjustments | — | Discount point-of-sale dollar adjustments. |
| Discounts - Apply Automated Line Discounting | — | `Start Automated Line Discounting` and `Suspend Automated Line Discounting - Remove Discounts` actions. Blank ⇒ manager approval required. |
| Discounts - Apply Manager Only Discounts | — | Apply discounts flagged manager-only. |
| Discounts - Override Sales Discount Restrictions | — | **Discounts are constantly re-evaluated as orders change; only users with this box may retain an ineligible discount.** |
| Discounts - Suspend Automated Line Discounting while Retaining Discounts | — | Suspend auto-apply **while keeping** applied discounts, so the order can be modified without losing them. |
| Override the Minimum Purchase Requirements on Discounts | — | Apply a coupon/discount code when the subtotal is below `Minimum Subtotal Required`. |
| Override the Restrictions on Combining Line and Subtotal Discounts | — | Combine a line discount with a coupon/subtotal discount code on the same order. |
| Override Sales Quote Conversion Discount Restriction | — | Convert a quote containing a discount code **before the advertised sale's start date**. |
| Adjustments Modify Coupons and Subtotal Discounts on Returns and Adjustments | — | Add/remove/adjust the coupon or subtotal discount in Enter a Return / Adjust Dollars on a Completed Order, including updating auto-calculated amounts. |
| Change maximum trade discount for a sales line item | — | **Trade/designer sales feature only.** Change the max available trade discount % via the extra Action on the Trade Pricing and Discounting window. |
| Change the Net Total on Sales Orders | — | Adjust the Net Total ("Out The Door" total) via the Adjust the Net Total screen. Unchecked ⇒ Security Override Screen at the Action button on `Net Total`. |
| Change reduced return price; not exceeding original price | — | **Applies only if `Reduce Customer Returns by ___ %` (Costing Control Settings, General tab) or `Reduce Customer Returns %` (product Group Settings) has a value.** Permits increasing the refunded price **up to but not exceeding the original selling price minus adjustments**. **The cost reduction does not change when the reduced price is edited.** |
| Change reduced warranty price; not exceeding original price | — | **Applies only if `Prorate Returned Warranties` is checked (POS Control Settings, Inventory tab).** Increase the prorated warranty price up to but not exceeding the original. |
| Override Maximum Percentage for As-Is Selling Price Adjustment | — | Decrease an as-is selling price by more than `Maximum Percentage Reduction` (Inventory Control Settings). |
| Increase Sell price above Max Sell price for Repossessions | — | Exceed the Repossession Maximum on the As-Is Status tab of Enter a Stock Adjustment. |
| Override Calculated Protection Plan Price | — | Override calculated Protection Plan prices in Protection Plan Product Selection. **"Once the price has been changed, a security override is required."** |
| Override system calculated delivery charges | — | Manually override calculated delivery/pickup charges; **also unlocks `Remove Delivery Override Flag` on the Payment tab Actions menu. Also examined when a user continues with an order that does not meet the minimum delivery purchase.** |
| Override system calculated restocking fee | **checked** | Override the calculated restocking fee in Enter a Return / Enter an Exchange. |
| Enter Installation/Restocking Charges | — | Controls access to `Allow Installation/Restocking Charges` in POS Control Settings. |
| Edit the builder allowance amount within POS entry | — | Add/edit a builder's allowance on an order fulfillment sub-document. |
| Access the sales margin scratchpad within POS entry | — | Sales Margin Scratchpad (Actions, Merchandise tab of Enter a Sales Order). |

**Order / document entry & lifecycle**

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Enter/Edit Sales Orders | — | Enter/edit sales orders **and convert shopping carts to sales orders**. |
| Enter/Edit Sales Quotes | — | Enter/edit quotes. **Converting a sales order to a quote evaluates this setting; inadequate security ⇒ manager override credentials required to continue the conversion.** |
| Enter/Edit Layaway Orders | — | Enter/edit layaways. **Same conversion rule as quotes.** |
| Enter/Edit Multi Ship Masters | — | Enter/edit multi ship masters. |
| Enter a New Exchange | **checked** | Create a new exchange. Unchecked ⇒ view existing exchanges only. **"This setting has no effect on the user['s ability] to delete lines from the sale portion of the exchange."** |
| Enter Return Portion of Existing Exchange | **checked** | Edit the **return** portion of an exchange. Unchecked ⇒ sale portion only. Same no-effect-on-deletion note. |
| Enter return/exchange/dollar adjustment without original order | — | **Reuses existing Inventory-pack ID `SEC-RTN-NOORIG`.** Enter returns/exchanges/dollar adjustments with no original document on file. |
| Complete sales orders | — | Complete via Enter a Sales Order; else Access Control Window at `Completion Type`. |
| Complete customer exchanges | — | Complete via Enter an Exchange; else Access Control Window at `Complete Exchange`. |
| Complete customer returns | — | Complete via Enter a Return; else Access Control Window at `Complete Customer Return`. |
| Complete Orders for Ship Locations Other Than Login Locations | **checked for new users, unless the assigned group has it unchecked** | Complete orders/exchanges when login location ≠ shipping location of the lines being completed. Applies to Enter a Sales Order and Enter an Exchange only. Standard override offered. |
| Complete Returns for Return Locations Other Than Login Locations | **checked** | Complete a return regardless of location; unchecked ⇒ return location must equal login location, else override. |
| Delete/Edit information on open transactions | — | Access existing sales, service and transfer orders and change or delete information. |
| Delete/Edit line items on transactions with deposits applied | — | Edit/delete lines on orders with deposits applied. |
| Delete quotes | — | Delete sales quotes. |
| Delete shopping carts | — | Delete shopping carts. |
| Delete special order line from a sales order | — | Delete a special-order line from a sales order or the sale portion of an exchange **at any time**, whether the line is linked to a PO or reserved from stock. **Also governs removal of COM component special-order lines and their linked POs.** |
| Delete special order line item linked to a purchase order not on hold | — | `Remove` button works for special-order lines linked to POs **not on hold**; unchecked ⇒ the button is clickable but requires an override. **Also governs COM components.** |
| Delete a Stock Merchandise Line Item Linked to a Purchase Order not on Hold | — | Delete stock order lines designated for a PO that is not on hold. |
| Delete direct ship line items on an order | — | Delete direct-ship lines linked to a PO. **Without it, deletion is still possible when: the direct-ship line is not linked to a PO; the line is on a quote or layaway (PO not yet created); or the order has not been saved since the line was added.** |
| Direct Ship - Delete a Direct Ship Order Line Item when the Linked Purchase Order is not On Hold | — | Delete lines that are both direct-ship-fulfilled **and** linked to a not-on-hold direct-ship PO. |
| Delete the fulfillment with the delivery charge | — | Delete the delivery fulfillment holding the order's delivery charge, via the `Delete` button on the Fulfillment page **or** via automatic empty-fulfillment deletion on save. **Only consulted when `One Delivery Charge Per Order` is enabled in POS Control Settings. Does not apply to Direct Ship fulfillments even when they hold a delivery charge.** |
| Update special order line item linked to PO not on hold | — | **Regardless of this setting, if the PO is on hold all users may update the special-order line.** Checked ⇒ may update order quantity on a not-on-hold-linked line. Unchecked ⇒ quantity locked, `Remove` inactive, and the special-order entry screen opens **read-only**. |
| Update a delivery order with a scheduled status | — | Update a delivery-scheduled sales order/exchange; unchecked ⇒ override prompt, and without it the document is **view-mode only**. |
| Backdate Transactions | — | Backdate new orders in an overlap month back to the previous month. **"the system does not allow security overrides to this setting" — a hard deny.** Window length comes from `Days To Allow Backdating` in POS Control Settings. |
| Change a transaction's completion date | — | Edit order completion dates via the Completion Date Entry Screen; else Access Control Window. **Also constrained by `Days to Allow Completion Backdating` in POS Control Settings.** |
| Bypass verify user ID during entry | — | Skip typing initials + password during Sales Order, Quick Sale, Service Order, Exchange, Return and Sales Adjustment, as configured by `Verify User ID During Entry` (POS Control Settings, Advanced tab). |
| Change Marketing Code | — | Change marketing codes **on existing sales orders for which no part has been completed**. |
| Change the salesperson indicated on an open transaction | — | View and edit `Salesperson` on an existing open order (sales, exchanges, returns). |
| Change Salesperson at Entry of Return/Exchange | — | Change the return salesperson ID **during initial entry**; inactive ⇒ override credentials demanded. **Does not restrict entry/modification of Salesperson ID on returns/exchanges written against invoices not on file.** |
| Change the calculated spiff amount within POS entry | — | Edit `Spiff Amount` on the Commission/Spiff Updates Screen. |
| Change the commission category within POS entry | — | Edit `Commission Category` on the Commission/Spiff Updates Screen. |
| Override Commission Rules | — | Override the commission rules on the Pricing and Commissions tab of POS Control Settings. **Applies to: sales orders, quick sales, layaways, quotes, and the "sale" portion of an exchange. Does NOT apply to: returns, dollar adjustments, or the "return" portion of an exchange** (where original salespeople may apply). |
| Change customer price category within POS entry | — | Edit `Price Category Code` (Point of Sale page, Advanced Customer Settings) and `Price Category` (Other section, Additional Order Detail). Blank ⇒ security override window. |
| Change the COD amount due within POS entry | — | Override `COD Amount Due` via Additional Order Detail. |
| Edit the calculated sales tax amount on open transactions | — | Change sales tax information in Enter a Sales Order. |
| Override Charge Sales Tax Settings | — | Override `Charge Sales Tax` in Order Tax Information. **If overridden the entire transaction becomes tax exempt.** **`Change Taxable Settings` (System Security) OVERRIDES this — that flag must be checked for this one to be usable.** Documented flow: Order Tax Information → `Change Taxable Settings` consulted → if permitted, the customer's `Tax ID`/`Expiration Date` are checked → present ⇒ order made non-taxable; absent ⇒ user prompted to override, and on Yes this Sales flag is consulted. |
| Change Delivery Status | — | **Delivery status only — not pickup status and not service order status.** Change delivery status on a sales order/exchange; else override. |
| Change Pickup Status | — | **Pickup details only, not delivery.** |
| Change delivery contact status | — | Change the delivery contact status on sales orders. |
| Change Requested Date in Enter a Sales Order or Enter an Exchange | — | Edit `Requested Date` on a fulfillment; else override. |
| Change Auto Fill Days on Transactions | — | Override `Fill Days` in the Product Full Display Screen. |
| Change pickup quantity during quick pickup order completion | — | Edit `Quantity Picked Up` in Complete a Pickup without Accessing Order Entry. |
| Allow user to change stock location on Sales Orders and Exchanges | **checked** | Change merchandise stock location. **Does not affect the ability to modify stock location for as-is pieces.** |
| Change Order when a Fulfillment is Scheduled and Printed | — | **Blank ⇒ users are restricted from changing inventory tied to the first delivery date when: the order is SCH, the delivery ticket has been printed, and the current date is inside `In-Process Delivery Restriction Days` (POS Control Settings, Logistics tab).** The restriction blocks: deleting the order; deleting the line item; changing the ship-to zip; changing the first delivery date; changing the route; changing status from SCH to anything else; changing a delivery-type line to another line type; changing shipping location on a line; changing stocking location on a line; changing as-is status of inventory; status of a line item; decreasing ordered quantity below the quantity scheduled for that date (if not reserved); decreasing the quantity scheduled for that date (if not reserved); decreasing inventory assigned/reserved below the quantity scheduled; exchanging assigned inventory for different pieces; changing the first date on a line to a later date; changing auto-fill days so scheduled inventory falls outside the fill days. |
| Change Order Fulfillments with a Status of Scheduled | **checked** | Permits, on a Scheduled fulfillment: add a line; delete a line; move a line out of / into the scheduled fulfillment; change the Deliver-to address; change the date; change the Route Code or Truck; change the Fulfillment Location; change Ordered/Reserved/Scheduled quantities; delete an order with a scheduled delivery fulfillment. Unchecked ⇒ security override. |
| Create Multiple Fulfillments for a Method | — | Unchecked ⇒ **one fulfillment per method per order**, and on an existing multi-fulfillment order the user cannot add another of an existing method (a new *method* is still allowed). **Checked ⇒ lines still cannot be assigned to multiple same-method fulfillments without the appropriate override.** Requires `Maximum Number of Fulfillments` (POS Control Settings) to permit it at all. |
| Override Maximum Number of Fulfillments | — | Exceed `Maximum Number of Fulfillments`. **Re-accessing an order that already had this override does not require another, as long as the fulfillment count has not increased.** |
| Override Handling Method on a Fulfillment | — | Change the default handling method on a fulfillment in sales/exchange/return entry. **No security check occurs at all when `Default Handling Methods on Fulfillments` (POS Control Settings) is disabled, even if this flag is checked.** |
| Override Parcel Route Requirement | — | Save a sales order with incompatible parcel route settings. **Enter a Sales Order only.** |
| Override Route on Sales and Service Transactions | **existing users/groups: checked; new users/groups: unchecked** | Manually change the route code on the Customer page of Enter a Sales Order (`Route`), Enter a Return (`Route`), Enter an Exchange (`Route`), Enter a Service Order (`Service Route`). |
| Override delivery date restrictions based on available date | — | When `Restrict Delivery Date Based On Available Date` (POS Control Settings) is active, assign delivery dates for out-of-stock merchandise before the next available date, **including the Purchase Delivery Pad Days when security allows**. |
| Override future scheduling restriction | **unchecked** | Security-override a scheduled date beyond `Restrict Scheduled Date` in Warehouse/Store Location Settings or POS Control Settings. |
| Override Same Day Pickup Restrictions | — | Override same-day pickup restrictions. **Evaluated for orders created for a location with `Prohibit Customer Personal Information when not Required by Sale` checked (Miscellaneous page, Warehouse/Store Location Settings).** |
| Override Minimum Deposit on Take With Orders | — | Override `Minimum Deposit Percent for Take With Lines` (AR Control Settings). **Applies only to Enter a Sales Order and Enter an Exchange.** |
| Override Deposit Hold Back on an Order | — | Modify `Deposit Hold Back` on the Other page of Additional Order Detail. *(This row appears twice, identically, in the source article.)* |
| Override soft kit restrictions | — | Override `Adjust Soft Kit in Order Entry` (POS Control Settings). |
| Override restriction of line updates once a linked auto transfer has been manifested | — | Override the POS Control Settings restriction `Prohibit changes to lines once an associated auto-transfer has been manifested`. |
| Override Allowed Number of Days on Returns | **unchecked** | Enter/approve a return beyond `Allowed Number of Days on Returns` (POS Control Settings). **"A security override is required once the number of established days has passed EVEN IF this setting is checked. This ensures that the approval of the return is written in the audit comments."** |
| Override Group Return Restriction Days | **unchecked** | Same, against `Return Restriction Days` in Group Settings. **Same "override still required even when checked" rule.** |
| Override Protection Plan Cancellation Restriction Days | — | Override the cancellation restriction days in Protection Plan Settings. |
| Override Protection Plan Limitations | — | Override Protection Plan minimum/maximum/quantity limitations. |
| Protection Plans - Allow Removal of Auto Added Plans | **checked** | Save new sales orders where qualified lines are **not** covered by a protection plan. **Only applies when `Require Security to Override` is checked in POS Control Settings.** |
| Protection Plans - Allow Sale of Manager Only Plans | **unchecked** | Provide the required security to override the sale of selected manager-only plans. |
| Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers | **unchecked** | Override `Must be Redeemed By Customer Who Was Issued Gift Certificate` (Membership Reward Settings). |
| Override Restricting Membership Products on Return | **unchecked** | Allow a membership product onto a return once the override is completed. **"it is the retailer's responsibility to manually adjust any existing orders if member only discounts, free/reduced delivery, and/or reward gift certificates need to be removed."** |
| Approve E1 credit holds placed on customer exchanges | — | Approve exchanges on E1 credit hold. **Relevant when `Exchanges on Hold at Entry` is active in POS Control Settings.** |
| Finance Receivables - Allow Adjustments After Partial Completion | — | Controls `CONTRACTS - Allow Adjustments after Partial Completion` in Finance Provider Settings. **When checked, override credentials are required EVERY time a finance adjustment order is changed; order comments are updated with the security access information.** |
| Back Order Multi-Leg Transfer | — | Reserve or back-order a line on a multi-leg stock transfer in Enter a Transfer (As-Is, Floor Sample, Stock), including `Reserved Quantity` via Additional Line Item Details. |
| Manually Link Purchase Orders on Sales Orders and Exchanges | — | Link a PO for a **stock** product in Enter a Sales Order / Enter an Exchange. **When enabled, Purchase Order Reservations is displayed per `Sales Order Linkage Access` in Purchasing Control Settings; when disabled that setting is not displayed at all.** |
| Create purchase order not on hold from POS entry | — | Unchecked ⇒ **all on-the-fly POs created from Enter a Sales Order / Enter an Exchange are placed on hold regardless of other on-hold settings.** Checked ⇒ normal business rules apply. |
| Create special order products within POS entry | — | Special-order products on-the-fly; activates the `Special Order Entry` option on the Action button at `Product`. |
| Create stock product within POS entry | — | Stock products on-the-fly; unlocks `Create New Product` on the Action button at `Product`. Blank ⇒ security override needed. |
| Create Customers when another exists with the same Email Address | — | Overrides `Prohibit New Customers with Duplicate Email Addresses` (POS Control Settings). **Required in order to update a customer's email address that already exists on another customer record via Update Customer Address.** |
| Update a Customer Address-Modify Customer Name | **checked** | Governs `Prefix, First, Middle, Last Name, Suffix` and the Alternate Name `First, Middle, Last Name` fields in Update a Customer Address. Unchecked ⇒ override prompt. |
| Maintain customer deposits immediately after order deletion | — | Reach Maintain Customer Deposits from inside Enter a Sales Order after deleting an order with a deposit, to: **apply the deposit to another order, refund it, put it on-account, or issue a finance credit.** |
| Allow Creation of New Orders in ERP from Enter a Sales Order | — | Create new sales orders in the ERP **regardless of the location's `Allow Creation of New Orders in ERP from Enter a Sales Order` setting in Warehouse/Store Location Settings**. If the location already allows it, the user can create orders regardless of this flag. |
| Create order from eRoam | — | `Create Order` button in eRoam (convert an eRoam cart to an order). |
| Import Products from Retail Deck | — | Import products from the RetailDeck database. **"the system does not permit a manager override of the security restrictions imposed by this field" — hard deny.** |
| Sell designated floor sample merchandise | — | Add floor-sample as-is items whose reason code matches `Floor Sample` in Inventory Control Settings. **Unauthorized attempt ⇒ warning + block; an authorized override permits the sale and *"the audit file updates indicating the user who authorized the sale."*** |
| Sell kit component products separately from their assigned kit | — | Enter "kit only" component products on sales orders in any quantity. **This overrides a checked `Kit Component` box in Advanced Product Settings.** |
| Access all Delivery Route Codes | — | **Unchecked ⇒ route code lookup is restricted to routes associated with the specified zip code.** Checked ⇒ all delivery route codes via lookup in Enter a Return, Enter an Exchange, or Additional Fulfillment Information in Enter a Sales Order. |
| Search for vendors, view vendor name and model numbers | — | Vendor information via Vendor Name Search, Search for a Product, View Product Availability. **Blank ⇒ Vendor Name Lookup is blocked (codes may still be typed directly) and the `Vendor Model`, `Vendor` and `Display` fields in Advanced Product Lookup are inactivated.** |
| Dynamic Tab View-Maintain a Sales Order | — | Enter a Sales Order in **entry** mode from: View Customer Activity, View a Coordinator's Open Service Orders, View a Technician's Open Service Orders, View a Customer's Open Service Orders, View a Product's Open Service Orders, View Open Service Orders for a Salesperson, View Open Service Orders for a Service Status. **Unchecked ⇒ read-only.** |
| Dynamic Tab View - Maintain a Service Order | — | Same pattern for Enter a Service Order; unchecked ⇒ read-only. |
| Maintain a Sales Order from View Customer Activity | — | Entry mode vs read-only for Enter a Sales Order from View Customer Activity. |
| Maintain a Return from View Customer Activity | — | Entry mode vs read-only for Enter a Return. |
| Maintain an Exchange from View Customer Activity | — | Entry mode vs read-only for Enter an Exchange. |
| Maintain a Customer's Own Goods Order from View Customer Activity | — | Entry mode vs read-only for Maintain a Customer's Own Goods (COG) Order. |
| View and Manage Open Orders - Maintain Sales Orders | **unchecked** | Manage sales orders via View and Manage Open Orders; unchecked ⇒ Security Override Screen. **Does not affect the ability to view orders read-only.** |
| View and Manage Open Orders - Maintain Exchanges | **unchecked** | Same for exchanges. |
| View and Manage Open Orders - Maintain Returns | **unchecked** | Same for returns. |
| View and Manage Open Orders - Maintain Transfers | **unchecked** | Same for transfers. |
| View encrypted finance, credit card, check account numbers | — | **STORIS masks all but the last four digits of account numbers entered during order entry; masking takes effect once saved and the order is re-accessed.** This flag permits viewing them unmasked on re-access. The payment entry screen (e.g. Credit Card Entry Window) exposes `Account Number Full Display` on the Actions button, which raises the Access Control Window — **a user with this flag can enter their own ID and password there to temporarily unmask.** **NOTE: "STORIS no longer stores full credit card numbers, credit card numbers cannot be decrypted."** |

**Non-boolean settings**

| Field | Type | Rule |
|---|---|---|
| **Deletion of Existing Sales Documents** → `Orders` | `All` / `None` / `Without Money` | `All` = delete all sales orders, with or without money applied. `None` = delete none. `Without Money` = only those with no money applied. **Regular sales orders only** — quotes, carts and layaways have their own controls. |
| **Deletion of Existing Sales Documents** → `Exchanges` | `All` / `None` / `Without Money` | Same semantics for exchanges. |
| **Deletion of Existing Sales Documents** → `Returns` | `All` / `None` / `Without Money` | Same semantics for returns. |
| **Deletion of Existing Sales Documents** → `Layaways` | `All` / `None` / `Without Money` | Same semantics for layaways. |
| `View All Sales Information` | `No` / `Yes` / `Store` | `No` ⇒ own sales only; **the Salesperson fields in reports and inquiries become inactive and the user's own ID defaults in.** `Yes` ⇒ sales info for all locations the user can access; **the `Store` field becomes active.** `Store` ⇒ current store only. **Gate: "To access this field, a check must appear in the `Sales Security Access` field on the Advanced page in the Point of Sale Control Settings."** |
| `Delivery Contract Status Codes` | Multi-select | Which Delivery Contact Status codes the user/group may pick for an order, return or exchange. **Defaults to blank = access to ALL codes.** Extra action opens a multi-select with `Select All` / `Deselect All`; several selected shows an ellipsis. **NOTE: "You must grant a staff member access to Delivery Status codes in Create a User or Create a User Group for them to be able to use these codes."** |
| `Maximum Price Variance` | Null or `0`–`100` | *"the maximum percentage a price override can [deviate] from its calculated price. This setting only applies to the price variance check."* **Null ⇒ no override limits, letting a user with `Override Transactions Entry Exceptions` override the variance up to 100%. `0` ⇒ the override is allowed to change the price up to the current price set in the Current Price Variance Rules. `100` ⇒ the user can discount up to 100%.** |

**Behavior & rules.**
- **Two hard denies with no override path: `Backdate Transactions` and `Import Products from Retail Deck`.**
- **Two flags where an override is required even when the flag is granted** — `Override Allowed Number of
  Days on Returns` and `Override Group Return Restriction Days` — *specifically so the approval lands in the
  audit comments.* This is the one place STORIS treats audit as the reason for the prompt, and it is the
  pattern we should generalise.
- **Cross-domain precedence:** `Change Taxable Settings` (System Security) **overrides** `Override Charge
  Sales Tax Settings` (Sales Security). A tax-exemption audit must read both screens.
- Blank-means-all appears twice with opposite risk profiles: `Delivery Contract Status Codes` blank = all
  codes allowed (permissive), whereas `Credit Hold Queue Codes` (Receivables) blank = no access (restrictive).
- Several settings are inert unless a corresponding POS Control Setting is on (`Override Handling Method on a
  Fulfillment`, `Protection Plans - Allow Removal of Auto Added Plans`, `Delete the fulfillment with the
  delivery charge`). A checked box therefore does **not** imply the capability is live.

**Dependencies.**
- Reuses `SEC-RTN-NOORIG` from the Inventory pack.
- `SEC-010` System Security → `Change Taxable Settings` (precedence over tax exemption here).
- `CFG-POS-*` (Point of Sale Control Settings): `Days To Allow Backdating`, `Days to Allow Completion
  Backdating`, `Verify User ID During Entry`, `In-Process Delivery Restriction Days`, `Maximum Number of
  Fulfillments`, `One Delivery Charge Per Order`, `Default Handling Methods on Fulfillments`,
  `Restrict Delivery Date Based On Available Date`, `Restrict Scheduled Date`, `Allowed Number of Days on
  Returns`, `Adjust Soft Kit in Order Entry`, `Prohibit changes to lines once an associated auto-transfer has
  been manifested`, `Prorate Returned Warranties`, `Exchanges on Hold at Entry`, `Allow Installation/
  Restocking Charges`, `Prohibit New Customers with Duplicate Email Addresses`, `Require Security to
  Override`, `Sales Security Access`, Pricing and Commissions tab.
- `CFG-INV-*`: `Maximum Percentage Reduction`, `Floor Sample` reason code, Costing Control Settings
  `Reduce Customer Returns by ___ %`, Group Settings `Reduce Customer Returns %` / `Return Restriction Days`.
- Warehouse/Store Location Settings: `Allow Creation of New Orders in ERP from Enter a Sales Order`,
  `Restrict Scheduled Date`, `Prohibit Customer Personal Information when not Required by Sale`.
- Membership Reward Settings, Protection Plan Settings, Purchasing Control Settings (`Sales Order Linkage
  Access`), Finance Provider Settings, AR Control Settings (`Minimum Deposit Percent for Take With Lines`).
- `SEC-003` Logistics (`Schedule deliveries and pickups with unreserved merchandise` is checked on **save**
  from these same entry screens).

**Build notes.**
- The `All / None / Without Money` deletion controls are the right shape and we should keep them — but
  extend to `Without Money OR Own Document`, which is the rule stores actually want.
- The many *"from screen X, entry mode vs read-only"* flags (`Dynamic Tab View-*`, `Maintain * from View
  Customer Activity`, `View and Manage Open Orders - *`) are **not** separate permissions in a sane model.
  They are one `sales_order.edit` permission plus a *navigation context*. Collapse them; do not port 12
  near-duplicates.
- **Do differently:** never let a permission be silently inert because a config flag is off. Our
  effective-permission API returns `granted | denied | inert(reason: config X is off)`.
- `Maximum Price Variance` semantics for `0` are ambiguous in the source (*"the override can is allowed to
  change the price up to the current price set in the Current Price Variance Rules"* — sic).
  **`[DECISION NEEDED]`: define `0` unambiguously for us. Recommendation: `0` = no deviation permitted.**
- Generalise the "override required even when permitted" pattern into a per-permission
  `require_second_signature: bool`, decoupled from whether the permission is granted.

---

### `SEC-009` Create a User/Group Actions - Service Security
*storis_ref: article 15185875555220*

**Purpose.** Extended security for the service-order lifecycle: creation, status, warranty terms, vendor
charge-back, completion, reinstatement, and service cost visibility. 10 flags.

**Where it lives.**
- `Create a User > Security tab > Actions button > Service Security`
- `Create a User Group > General tab > Actions button > Service Security`

**Fields** — *"Allow a User To:"*

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Complete service orders | — | Complete via Enter a Service Order; **blank ⇒ the Access Control Window appears when the user attempts to complete an order.** |
| Create a Service Order from Other Processes | **unchecked** | Create a service order from the `Create a Service Order` **extra action** available in other processes — i.e. anywhere other than the menu option. |
| Create Service for Merchandise Covered by an Extended Warranty | **checked** | Create service orders for merchandise covered by an extended warranty. |
| Create Service for Merchandise not Covered by an Extended Warranty | **checked** | Create service orders for merchandise **not** covered by an extended warranty. |
| Delete open service orders | — | Delete open service orders. |
| Enter service orders with scheduled/estimated/pending status | — | Enter complete service orders with status `estimated`, `scheduled` or `pending`. **Blank ⇒ the user can create ONLY pending service orders, on which they may enter customer and delivery information, create customers on-the-fly, and access audit comments.** |
| Modify warranty terms in service order entry | — | Change warranty terms for **parts and labor** coverage. |
| Override preset vendor charge-back method within service entry | — | Override the charge-back method preset in Vendor Settings or Service Control Settings. **Checked ⇒ the user may change how reimbursement of parts charges that are a third party's responsibility is handled.** |
| Reinstate completed service orders | — | Reinstate previously **closed** service merchandise lines during service order entry. |
| View and Access Costs Associated with Service | **unchecked** | View the cost of **parts, labor and charges** associated with a service line. **"This setting is unchecked by default to match the default setting of View and Access Product Cost Information. For existing clients, the conversion process will define this setting based on what the user defined in View and Access Product Cost Information."** |

**Behavior & rules.**
- The two extended-warranty flags are **independent and both default checked** — so out of the box a user may
  raise service on anything; the intended tightening is to uncheck the *not covered* one.
- `View and Access Costs Associated with Service` is a **field-level redaction** permission and is explicitly
  a sibling of `SEC-COST-VIEW` (`View and access product cost information`, System Security). STORIS split
  them in a later release and seeded the new one from the old.

**Dependencies.**
- `SEC-COST-VIEW` (System Security, `SEC-010`) — sibling/seed relationship, documented.
- Vendor Settings, Service Control Settings (preset vendor charge-back method).
- Enter a Service Order; `SEC-008` `Dynamic Tab View - Maintain a Service Order` controls entry-vs-read-only
  access to the same screen from inquiry screens.

**Build notes.**
- Model service cost visibility and product cost visibility as **one permission with a scope set**
  (`cost.view: {product, service_parts, service_labor, service_charges}`), rather than two flags that must be
  kept in sync by a conversion script.
- Status entry (`estimated | scheduled | pending`) is a **state-transition permission**, not an action flag.
  Express it as an allowed-target-status set so we can add statuses without adding permissions.
- **Do differently:** default `Create Service for Merchandise not Covered by an Extended Warranty` to
  unchecked. Free service on uncovered goods is a margin leak that should be a deliberate grant.

---

### `SEC-010` Create a User/Group Actions - System Security
*storis_ref: article 15185875776532*

**Purpose.** Extended security for system-administration-level capabilities: command-line access, encryption
settings, data purges, EOD/EOM runs, GL posting corrections, licence recovery, and the master cost-visibility
flag. 15 flags. **This is the smallest screen and by far the most dangerous.**

**Where it lives.**
- `Create a User > Security tab > Actions button > System Security`
- `Create a User Group > General tab > Actions button > System Security`

**Fields** — *"Allow a User To:"*

| Permission (verbatim) | Default | Gate / effect |
|---|---|---|
| Access ECL command line mode | — | Run the Access ECL routine to reach the **ECL command line prompt**. **Checked ⇒ clicking `Access ECL` prompts for a user password; on a valid password the ECL prompt opens.** Unchecked ⇒ no access. **This is direct database/OS-adjacent access — effectively root over the ERP.** |
| Add programs to a Dynamic Escape screen listing | — | Right-clicking a screen with dynamic escape capability exposes `Dynamic Escape Settings` on the Right-Click menu, letting the user edit right-click menus in place. **Blank ⇒ users can access but not edit right-click menus.** |
| Assign Screen Action Permissions | — | Ability to restrict other users' access to specific functions on Actions button menus, via the **Assign Screen Actions Permissions** routine. **This is a meta-permission: it grants authority over other people's permissions.** |
| Change Taxable Settings | — | Change the taxable status for a specific order via the Order Tax Information screen. **Blank ⇒ a security override by an authorized user is required. "This setting takes precedence over the Override Charge Sales Tax Settings" (`SEC-008`).** |
| Edit Personal Report Viewer Corporate Views | — | Create and modify the **Corporate View** in the Personal Report Viewer and use `Save Corporate View`. **The corporate view is uploaded to the server so that other users use the same view — a one-user change with system-wide effect.** |
| Edit automated general ledger postings | — | Access the **Accounts Receivable Manual Adjustment GL Postings** and **Vendor Receivable Manual Adjustment GL Postings** routines. |
| Export Grid Data | **checked** (*"leave this setting checked"*) | Option to export grid data. **A bulk data-egress control that ships enabled.** |
| Logout of STORIS on Switch User | — | Checked ⇒ `Switch User` on the main menu **logs the user out of STORIS**. Blank ⇒ `Switch User` shows the login screen so another user can log in. *(A session-behaviour setting living in the permission grid.)* |
| Merge Duplicate Customer Accounts | — | Merge duplicate customers. **Without it, users can only *recommend* merges via Review Status and Merge Individual Customer, not perform them.** |
| Modify General System Control Settings data encryption | — | Change the **Database Encryption Settings** on the Security tab of General System Control Settings. Without it, a security override is required. |
| Purge secured/encrypted data | — | Run **Purge Encrypted Data** to purge sensitive customer data that has been encrypted — *"social security numbers, credit card numbers, checking account numbers, etc."* **Irreversible destruction of regulated data.** |
| Recover STORIS Licenses | — | Access the **Recover STORIS Licenses** routine. **"If this setting is not checked, the screen cannot be accessed and NO SECURITY OVERRIDE OPTION IS AVAILABLE." — hard deny.** |
| Run the Daily Reports (EOD) process | — | Initiate Generate Daily Reports (Day Ending / EOD). *"Typically this setting should be reserved for the system manager."* |
| Run the Monthly Reports (EOM) process | — | Initiate Generate Monthly Reports (Month Ending / EOM). *"Typically this setting should be reserved for the system manager."* |
| View and access product cost information | — | **Reuses existing Inventory-pack ID `SEC-COST-VIEW`.** Access specific cost information during inventory and sales entry processing. **NOTE (verbatim): "If you add costing information to any Forms Designer print forms (for example, a label print form), this field restricts access to that data. That is, if a user without access to costing information attempts to print a document with costing information included, the costing information does not appear on the printed document."** — redaction reaches into the print pipeline, not just the screen. |

**Behavior & rules.**
- **`Recover STORIS Licenses` is a hard deny with no override.** So is nothing else on this screen — every
  other dangerous capability here (ECL, encryption settings, PII purge) is overridable by a colleague's
  password, which is precisely backwards.
- `Assign Screen Action Permissions` is **privilege escalation by design**: a user with it can grant and
  revoke Actions-menu permissions for others.
- `Change Taxable Settings` is the **top of the tax-exemption precedence chain** and outranks the Sales
  Security flag.
- `SEC-COST-VIEW` is the pack's clearest example of **field-level redaction that must be enforced at render
  time in every channel** — screen, report and printed form.

**Dependencies.**
- Reuses `SEC-COST-VIEW` from the Inventory pack; `SEC-009` `View and Access Costs Associated with Service`
  is its sibling and was seeded from it.
- `SEC-008` `Override Charge Sales Tax Settings` (subordinate to `Change Taxable Settings`).
- General System Control Settings (Security tab → Database Encryption Settings; extended security active).
- Assign Screen Action Permission routine; Forms Designer; Personal Report Viewer; Review Status and Merge
  Individual Customer; Purge Encrypted Data; Recover STORIS Licenses.

**Build notes.**
- **ECL / command-line equivalence does not exist in our ERP and must never be added.** If an escape hatch is
  needed it belongs in infrastructure with its own identity, MFA and session recording — not a checkbox on a
  user record.
- `Purge secured/encrypted data`, `Modify General System Control Settings data encryption` and
  `Assign Screen Action Permissions` should be **break-glass permissions**: time-boxed, dual-control
  (two distinct approvers), and alerting, not ordinary checkboxes.
- `Export Grid Data` defaulting to on is a data-exfiltration default. **Default it off**, and log every export
  with row count and filter criteria.
- `Logout of STORIS on Switch User` is a session preference, not a permission. Move it out of the model.
- `Edit Personal Report Viewer Corporate Views` writes shared state from a per-user permission — treat as a
  publish action with review, not a toggle.

---

## Coverage

10 of 10 "Security" articles in section `15172979328660` read in full and written up. No article was a stub;
no article was unreadable. Nothing in any article addressed the reader as an agent or attempted to issue
instructions — the content is ordinary product documentation.
