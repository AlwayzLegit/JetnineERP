# Handoff: STORIS Users, Roles & Security — LA Mattress Cutover

**For:** Claude Code, working in the cutover repo.
**Pairs with:** `docs/STORIS-DOCS-HANDOFF.md` (the documentation system spec). This handoff is
the first real content domain to run through that system.

**Sources read** (see Appendix B for extraction notes):
`Create a User` · `User Log In Screen` · `Create a User Group` ·
`Create a User/Group Actions - Purchasing Security` · `Report on User Security` ·
the `System Administration > User Settings` section index.

---

## 1. Why this domain first

User and security setup is the hardest thing to retrofit after go-live and the easiest to
get wrong quietly. STORIS spreads access control across **eight independent layers** that
do not reference each other in the UI. A user can be correctly configured in six of them
and still be unable to do their job — or able to do far too much. There is exactly one
report that shows the truth (`Report on User Security`), and it does not cover every layer.

Document the layers before creating a single production user.

## 2. The access-control model (eight layers)

Ordered by when they take effect during a session.

| # | Layer | Where configured | Gated by |
|---|---|---|---|
| 1 | OS / server login | `STORIS Server Log In` (Login ID + password), optionally Windows Active Directory | `Exempt from Active Directory Authentication` on the user |
| 2 | STORIS user identity | `User ID` field, `Create a User` | `User ID at Login` in `General System Control Settings` |
| 3 | Password / session policy | `Password`, `Maximum number of concurrent sessions`, `User Locked Out` | `Extended Security`, `Complex Passwords`, `Password Expires After __ Days` in `General System Control Settings` |
| 4 | Menu security | `User Group` (required on every user) | none — always on |
| 5 | Extended (module) security | `Actions` button → ten module screens, on user *and* group | `Extended Security` in `General System Control Settings` |
| 6 | Screen action permissions | `Assign Screen Action Permission` routine | none |
| 7 | Data scope: location / region / district / company | `Access` tab on user and group | `Regional Processing` in `General System Control Settings` (partly — see §7) |
| 8 | Report Builder data security | `File Security Groups`, `Field Security Codes` | Report Builder licensing |

Plus two scoped add-ons that behave like access control but sit elsewhere: **CRM/InTouch
lead visibility** (Security tab) and **UP System** access levels (Security tab).

**The single most important sentence in these docs:**

> Security settings on these screens are only effective if extended security is active on
> your system via the `General System Control Settings`.

If `Extended Security` is off, every module permission you configure is inert. Verify that
flag *first*, in each environment, and record it in the settings registry.

## 3. The login chain

```
STORIS Server Log In  (Login ID + password; may be Active Directory)
        │  system matches the entered Login ID against BOTH the User ID field
        │  and the Login ID field in the User file; no match = login aborts
        ▼
User Log In Screen    (skipped entirely if Allow Logon Passthrough is checked)
        │  fields: User ID, Password, Location, Set as Default Location,
        │          Cash Drawer, Payment Terminal, Tethered Terminal,
        │          Signature Capture, Update Print Settings
        ▼
User Print Settings   (only if Update Print Settings is checked)
        ▼
STORIS Main Menu
```

Settings in `General System Control Settings` that change what this screen even shows:
`User ID at Login`, `Extended Security` (requires `User ID at Login`), `Complex Passwords`
(PCI conformance), `Password Expires After __ Days`.

Field visibility on the login screen is conditional and worth documenting per field:
`Cash Drawer` appears only if `Use Cash Drawers` is enabled in `POS Bar Code Control
Settings` **and** a drawer exists in `Cash Drawer Settings`. `Payment Terminal` appears only
if an EMV module, Shift4, or Tender Retail is active **and** the login location is
EMV-enabled. `Tethered Terminal` requires the Document Display and Signature Capture module
plus `Enable Signatures on Tethered/Mobile Devices` in `Warehouse/Store Location Settings`.
`Signature Capture` appears only in a terminal server environment.

`Allow Logon Passthrough` is the highest-leverage switch here: it suppresses the whole
screen, which means the user can never pick a location, drawer, or terminal at login —
everything falls back to their user record. Do not turn it on for anyone who works at more
than one location or shares a register.

## 4. `Create a User` — the four tabs

Access: `System Administration > System Settings > System Permissions > Create a User`
(also reachable from `System Administration > Get Started - Enter Your Information >
Get Started Step 5 - Users > Create a User`).

**Operational rule that will bite you:** *"If you make a change to the User file, you must
restart STORIS before the change can take effect."* Build this into the runbook — testers
will report "the permission didn't work" when they simply did not restart.

### General
`Name` · `User Group` (**required**) · `Extension` · `Email Address` · `Employee ID`
(7 chars, reporting only) · `Email Preference` (HTML / Plain Text; active only if an email
address exists) · `Salesperson Code` · `Buying Group` · `Language Code` · `Default at
Login` (`Cash Drawer`, `Payment Terminal`, `Tethered Terminal`, `Enable Signature Capture`) ·
STORIS Messenger settings.

Two non-obvious couplings:
- `Salesperson Code` **grants CRM lead access** for that salesperson, independently of the
  CRM fields on the Security tab. Setting it "just for commission reporting" silently widens
  data access.
- `Buying Group`: a user may hold several buying groups, but a buying group has exactly one
  set of buyer initials. And every product on a PO must share the same buyer — POs created
  on the fly from order entry get no buyer and are **placed on hold** until someone re-opens
  them and sets one.

### Output
`Printed Document Destination` (`Standard Printing` / `Local Printer` / `Printing Not
Allowed`) · `Printer Zone` · `Default Logical Printer` · `Default Print Form` · `Default
Hold Queue` · `Default Suppress Queue` · `Default Number Copies` (1–999) · `Include Report
Banner` · `Start Forms Printer at Logon`.

`Standard Printing` is what grants access to `Printer Admin Level` on the Security tab —
the two tabs are coupled. `Local Printer` has real consequences: EOD/EOM printing is
unavailable when Regional Processing is active, the Printer option disappears from `Output
Settings`, and EOD/EOM reports land on the workstation at
`C:\Users\<USERID>\Documents\STORIS\Reports\EOD_YYYYMMDD` (non-Live accounts get the account
name appended). Decide this per role, not per person.

### Security
`Password` · `Reset Password` · `Exempt from Active Directory Authentication` · `Login ID` ·
`Allow Logon Passthrough` · `Maximum number of concurrent sessions` · `User Locked Out` ·
`PC Applications` · `File Security Groups` · `Field Security Codes` · CRM–InTouch
(`Enable Corporate Access`, `District Manager`, `Store Manager Locations`) · `Enable UP
System` / `UP System Administrator` · `Notify of License Expiration` · `Printer Admin Level` ·
`Access Archived Reports`.

Behaviors to capture verbatim in the docs:

- **Password**: up to 50 upper-case alphanumeric. Without complex passwords, clearing the
  field sets it null and forces a change at next login. With complex passwords the field is
  set to `RESET` on creation, is not directly editable, and displays 8 asterisks once set
  regardless of true length. **You cannot change or reset a password while that user is
  logged on to any account.**
- **Active Directory**: if a user is *not* exempt, you cannot change, reset, or view their
  password at all. STORIS recommends keeping at least one administrative user exempt as a
  break-glass account. Make that an explicit, documented decision with a named owner.
- **Lockout**: six failed attempts sets a *temporary* lock, stamped with date/time, cleared
  automatically 30 minutes later on the next attempt, or by an admin unchecking the box, or
  by clicking `Reset Password`. An admin can instead set a *permanent* lock, which never
  self-clears. The same checkbox carries both states — read the adjacent word
  ("Temporarily" / "Permanently") before acting.
- **CRM cascade**: `Enable Corporate Access` de-activates the other two; `District Manager`
  de-activates `Store Manager Locations`. Users defined by none of these — and with no
  `Salesperson Code` — cannot create or update any leads at all.
- **`Access Archived Reports`** defaults to `User's Archived Reports` on new users. Anyone
  who needs to see a colleague's report output needs this changed deliberately.
- **`Notify of License Expiration`** is **not available on user groups** — it must be set
  per user. At least one admin should have it.

### Access (data scope)
`LOGIN`: `Warehouse/Store Location` (multi-select), `Default a Login Location`.
`Fulfillment Location Restrictions`: per method (Delivery, Customer Pickup), either
`Use Access Restrictions` or a `Location List`.
`RESTRICTIONS`: `Company`, `Global Location List`, then `Sales` (`Entry`, `View/Report`) and
`Inventory` (`Entry`, `View/Report`), each choosing None / Logon Location / District *or*
Region / Global Location List / Location List.

Three things to write down loudly:

1. **Sales scopes by District; Inventory scopes by Region.** Not symmetrical. Easy to
   misread as the same control.
2. **`Global Location List` overrides regional and district boundaries and does not require
   Regional Processing.** It is the blunt instrument, and it wins.
3. STORIS's own recommendation: pick **one** restriction mechanism and apply it consistently
   across the user (their example: `Logon Location` everywhere). Mixing mechanisms per
   functional area is how you get access bugs nobody can reproduce.

Also note `Order Access Limited to Selling Store` in `Point of Sale Control Settings` — a
POS-side control that further limits order access on top of everything above.

## 5. Groups vs users

`User Group ID` is up to 6 characters; `Description` up to 20. Every user must belong to a
group. The group is what provides **menu** security.

Delivered content you should not fight:
- **`SYSMGR`** — assign only to system administrators. **Only `SYSMGR` members can reach the
  `Get Started` menu.**
- **`S$` user types** (e.g. `S$CS` for customer service) — delivered, not editable, but
  copyable via `Create a User Group`. Start from these rather than from blank.

**`Reset User Members` is the dangerous one.** Checking it pushes the group's settings down
onto every member's individual user record — a mass overwrite of per-user configuration. It
is also the documented way to re-baseline a user who has moved to a new group. Treat it as a
destructive operation: never in production without a `Report on User Security` export taken
immediately before, and never during business hours.

**Asymmetries between user and group** worth recording, because they determine what can be
managed centrally:

| Setting | On user | On group |
|---|---|---|
| Transfer Security | yes | **no** |
| `Notify of License Expiration` | yes | **no** |
| `Menu Timeout Active` | no | yes |
| `Clone Info For New User Group` | no | yes |

`Assign Screen Action Permission` is the separate routine that restricts individual options
on `Actions` button menus, per user group. It is layer 6 and is invisible from both the user
and group screens — document it explicitly or it will be forgotten.

## 6. The extended-security modules

Ten permission catalogs, reached from `Actions` on the user's Security tab / the group's
General tab:

`Import Data` · `Logistics` · `Payables` · `Personal Information` · `Purchasing` ·
`Receivables` · `Sales` · `Service` · `System` · `Transfer` *(user only)*

The same field labels and descriptions appear whether you arrive from the user or the group;
group settings apply to all members, user settings apply to the individual.

### Permission shapes

From `Purchasing Security`, three distinct shapes — expect all three in every module:

1. **Boolean capability**, phrased as a sentence under an `Allow a User To:` heading and
   alphabetized: *"Create new products within purchase order entry"*, *"Reopen a Closed
   Purchase Order"*.
2. **Boolean that is checked by default** — e.g. `Edit purchase orders that have been printed
   or emailed`. Defaults matter: a permission you never touched may already be granted.
   Record the delivered default alongside our value.
3. **Tri-state with a money threshold** — `Always` / `Never` / `Threshold` plus a mandatory
   `Threshold Amount`. Used for `Create Manual Purchase Order On Hold` and `Take Purchase
   Order Off Hold`. Under `Threshold`, exceeding the amount triggers a warning or requires a
   **security override by another user**, and the override writes a **purchase order audit
   comment**.

That third shape is delegated authority with an audit trail — it is the closest thing STORIS
has to an approval workflow, and it is where LA Mattress's real spend controls will live.
Every threshold is a business decision, not an IT setting: it needs a named approver, a
number, and a decision record.

Note also that permissions are frequently **paired with a setting elsewhere that overrides
them**. Example: `Create special order purchase orders within POS entry` is overridden by
`Purchase Order/Assignment Required` in `Special Order Control Settings`. Every permission
entry must name its overrides, or the docs will mislead.

## 7. Contradictions and gaps found in the source (test these)

These are real inconsistencies in STORIS's own documentation. Do **not** resolve them by
picking the more plausible one — test each in the Learn/test account and record the observed
behavior with `environment` and `last_verified`.

1. **User ID length.** `Create a User` says up to **five** alphanumeric characters;
   `User Log In Screen` says a maximum of **four**; the `Login ID` field description refers
   to "the 4-character maximum allowed by the User ID field"; and RF / Store Barcode users
   may use **six**. Determine the real limit before choosing a company-wide ID convention —
   this is the one decision that is genuinely painful to reverse.
2. **Where `Default a Login Location` lives.** `Create a User` puts it on the **Access** tab;
   `User Log In Screen` twice refers to `Default a Location` / `Valid Locations` on the
   **Output** tab. Likely stale text in the login article; confirm in the actual UI.
3. **Whether the group Access tab needs Regional Processing.** `Create a User Group` says
   *"To access this tab, Regional Processing must be active"* and, a few lines later, *"These
   settings are active whether or not Regional Processing is active in your system."* Both
   cannot be true. Test with Regional Processing off.
4. **Audit coverage gap.** `Report on User Security` lists the modules it covers — and
   **Transfer Security is not among them**, nor is it available on groups. Transfer
   permissions are therefore per-user and invisible to the only audit report. Plan a manual
   review step, or exclude transfer permissions from the design.
5. **`Type` vs `User Group`.** `Create a User Group` says users are assigned via *"the `Type`
   field in the User file"*; `Create a User` calls that field `User Group`. Same field,
   two names, legacy drift. Use the on-screen label, note the alias in the glossary.

## 8. Decisions LA Mattress has to make

Each becomes an ADR in `docs/decisions/`. Recommended defaults are starting positions, not
answers — confirm each with the process owner.

| # | Decision | Recommended default | Why it matters |
|---|---|---|---|
| D1 | User ID convention | Confirm the true length limit first, then a deterministic scheme (e.g. first initial + surname, truncated, collision suffix) | Effectively permanent; appears in every audit record |
| D2 | Active Directory or STORIS-native passwords | AD, with **one documented exempt break-glass admin** | Vendor-recommended; without an exempt account an AD outage locks everyone out |
| D3 | `Complex Passwords` on or off | On (required for PCI) | Changes how passwords are set forever after; turning it on later changes admin workflow |
| D4 | Group taxonomy | Start from `S$` types, copy and rename; do not author groups from scratch | Delivered groups encode working menu sets |
| D5 | Location restriction mechanism | Pick one — `Logon Location` for store staff, `Global Location List` for multi-store roles — and apply it uniformly | Vendor's own recommendation; mixing causes irreproducible access bugs |
| D6 | PO hold thresholds by role | `Threshold` for buyers and store managers with explicit amounts; `Never` for everyone else | This is the spend control; needs Finance sign-off |
| D7 | `Allow Logon Passthrough` | Off for anyone working across locations or sharing a register | Removes location/drawer selection at login |
| D8 | `Access Archived Reports` | `User's Archived Reports` except named supervisor roles | Defaults to the restrictive option already |
| D9 | Printing model per role | `Standard Printing` for back office; decide `Local Printer` deliberately given the EOD/EOM limitations | Coupled to Regional Processing |
| D10 | Concurrent session limit | 1 for register/POS roles, blank for back office | License consumption and register hygiene |

**Proposed role list to confirm** (not verified against LA Mattress's org): Sales Associate,
Store Manager, Buyer, AP Clerk, AR / Collections, Warehouse / Logistics, Service, Controller,
System Administrator. Confirm before building the matrix — the role list determines
everything downstream.

## 9. What to build in the repo

Following the structure in `docs/STORIS-DOCS-HANDOFF.md`.

```
docs/
  settings/
    general-system-control-settings.md      # Extended Security, User ID at Login,
                                            # Complex Passwords, Password Expires,
                                            # Menu Timeout, Regional Processing, Licensing
    point-of-sale-control-settings.md       # Order Access Limited to Selling Store
    pos-bar-code-control-settings.md        # Use Cash Drawers
    warehouse-store-location-settings.md    # Enable Signatures on Tethered/Mobile Devices
  erp/system-administration/user-settings/
    create-a-user.md                        # type: program, 4 tabs, field-per-entry
    create-a-user-group.md                  # type: program
    user-log-in-screen.md                   # type: screen
    report-on-user-security.md              # type: report
    security-import-data.md   … security-transfer.md     # ten catalogs, type: settings
    assign-screen-action-permission.md      # type: program  (layer 6 — do not skip)
  processes/
    user-access-model.md                    # type: process — the eight layers, §2 above
    login-chain.md                          # type: process — §3 above
  decisions/
    d1-user-id-convention.md … d10-concurrent-sessions.md
  runbooks/
    provision-a-user.md
    deprovision-a-user.md
    quarterly-access-review.md
  mapping/
    legacy-users-to-storis.md               # legacy user -> STORIS user + group + scope
  role-matrix.md                            # roles x permissions, generated (see below)
```

**The role matrix is the deliverable everyone will actually use.** Model it as data, not
prose: a YAML file of roles × settings, with a script that renders it to markdown and — more
importantly — a script that **diffs it against a `Report on User Security` Excel export**.
That report is always Excel, is never archived, has users/groups as rows and settings as
columns prefixed by module code (`TE`, `AR`, …) with `YES`/`NO` cells. It is a near-perfect
machine-readable audit surface. Build the comparison and the quarterly access review becomes
a script run instead of a two-day spreadsheet exercise.

Suggested scripts, alongside the six in the docs handoff:

- `import-user-security-report.mjs` — parse the Excel export into normalized JSON
- `diff-role-matrix.mjs` — intended (`role-matrix.yaml`) vs actual (the export); exit non-zero
  on drift, print per-user/per-setting differences
- `check-permission-overrides.mjs` — every permission entry naming an overriding setting must
  link to that setting's file

## 10. Kickoff prompt for Claude Code

```
Read docs/HANDOFF-users-and-security.md end to end, and docs/STORIS-DOCS-HANDOFF.md for the
authoring rules. Assume Phase P0 (scaffold) is complete.

Do this, and only this:

1. Create docs/settings/general-system-control-settings.md covering the security-relevant
   fields named in Section 2 and 3 of the handoff. Every value is TBD - unverified with
   status: draft. Do not guess our configuration.
2. Create docs/processes/user-access-model.md from Section 2 (the eight layers) and
   docs/processes/login-chain.md from Section 3. Both must end with the
   "Settings that control this process" section required by the authoring rules.
3. Create docs/erp/system-administration/user-settings/create-a-user.md with one entry per
   field across all four tabs, in screen order, following the field-entry rules. Use the
   handoff as the source for behavior; mark anything not stated there as
   "Unverified - needs test in Learn".
4. Create docs/decisions/ with one ADR stub per row of the Section 8 table, status: proposed,
   each stating the decision, the recommended default, and what must be verified first.
5. Create docs/open-questions.md listing the five contradictions in Section 7, each with the
   exact test to run and the environment to run it in.

Then stop. Show me the tree, create-a-user.md in full, and the validator output.
Do not create the remaining screen articles or the role matrix yet.
```

Run the Section 7 tests before Phase 2 of this domain. Every article written on top of an
unresolved contradiction has to be rewritten.

---

## Appendix A — Source articles

| Article | Breadcrumb | Used for |
|---|---|---|
| Create a User | STORIS ERP > System Administration > User Settings | §4, §5, §7 |
| Create a User Group | same | §5, §7 |
| User Log In Screen | STORIS ERP > Getting Started | §3, §7 |
| Create a User/Group Actions - Purchasing Security | STORIS ERP > System Administration > User Settings | §6 |
| Report on User Security | STORIS ERP > System Administration > System Administration Views and Reports | §6, §9 |
| User Settings (section index) | — | module list, sibling articles |

## Appendix B — Extraction notes (for the next capture run)

The help center blocks automated fetching via robots.txt; use a browser session. Two
different collapse mechanisms are in use and each needs a different unhide, so a single
script must handle both:

```js
// mechanism 1 — native disclosure (Merchandising articles)
document.querySelectorAll('details').forEach(d => d.open = true);
// mechanism 2 — CSS class (User Settings articles)
document.querySelectorAll('.frameless-hide').forEach(e => e.classList.remove('frameless-hide'));
// belt and braces — some articles use span.expandtext with inline styles
const s = document.createElement('style');
s.textContent = 'article *{display:revert!important;visibility:visible!important;' +
                'max-height:none!important;overflow:visible!important}';
document.head.appendChild(s);
```

Caveats: articles carrying version tabs (`11.0` / `10.8`) render **both versions** once
unhidden, so extracted text is duplicated — take the first copy. Field labels appear twice
(once as the trigger, once as the panel heading) — de-duplicate on capture.

Cross-references inside article bodies are **plain text, not hyperlinks** — STORIS names
things by exact label and relies on that label being unique. This is why the "exact label
plus container" convention in the docs handoff is load-bearing rather than stylistic; our
version should make those references real links and validate them.
