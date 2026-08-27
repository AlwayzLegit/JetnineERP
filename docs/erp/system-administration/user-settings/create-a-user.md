---
title: Create a User
type: program
status: draft
domain: erp/system-administration/user-settings
source: docs/HANDOFF-users-and-security.md
environment: null
last_verified: null
---

# Create a User

**Breadcrumb:** `System Administration > System Settings > System Permissions > Create a User`
(also reachable from `System Administration > Get Started - Enter Your Information >
Get Started Step 5 - Users > Create a User` — `Get Started` is reachable only by
members of the delivered `SYSMGR` group).

> **Operational rule:** _"If you make a change to the User file, you must restart
> STORIS before the change can take effect."_ Build this into every runbook —
> testers will report "the permission didn't work" when they simply did not
> restart.

Field status legend — **Documented**: behavior stated in the source handoff.
**Unverified — needs test in Learn**: named in the source but behavior not stated;
observe in the Learn/test account before relying on it.

## Header

### User ID

- **What it does:** The STORIS identity (access-model layer 2). Matched at server
  login against the entered Login ID, alongside the `Login ID` field.
- **Constraints:** Length limit is **contradictory in the source** — five vs four
  characters (six for RF / Store Barcode users). Do not choose a company-wide ID
  convention until resolved. See
  [open question 1](../../../open-questions.md#1-user-id-length) and ADR
  [D1](../../../decisions/d1-user-id-convention.md).
- **Status:** Documented (with open contradiction).

## General tab

### Name

- **What it does:** Display name for the user.
- **Status:** Unverified — needs test in Learn (constraints not stated in source).

### User Group

- **What it does:** **Required.** Provides menu security (layer 4). Also called
  the `Type` field in older articles — same field, two names; use the on-screen
  label. Group-level module security applies to all members.
- **Overridden / interacted by:** `Reset User Members` on the group pushes group
  settings down over this user's individual record (destructive — see
  `create-a-user-group.md`, to be authored).
- **Status:** Documented.

### Extension

- **What it does:** Phone extension.
- **Status:** Unverified — needs test in Learn.

### Email Address

- **What it does:** User's email; activates `Email Preference`.
- **Status:** Documented (activation coupling only).

### Employee ID

- **What it does:** 7 characters, **reporting only** — carries no access
  semantics.
- **Status:** Documented.

### Email Preference

- **What it does:** `HTML` / `Plain Text`; active only if an email address exists.
- **Status:** Documented.

### Salesperson Code

- **What it does:** Links the user to a salesperson. **Silently widens data
  access:** grants CRM lead access for that salesperson, independently of the CRM
  fields on the Security tab. Setting it "just for commission reporting" is an
  access grant.
- **Status:** Documented.

### Buying Group

- **What it does:** Assigns buying group(s). A user may hold several, but a buying
  group has exactly one set of buyer initials, and every product on a PO must
  share the same buyer. POs created on the fly from order entry get **no buyer
  and are placed on hold** until someone re-opens them and sets one.
- **Status:** Documented.

### Language Code

- **What it does:** UI language for the user.
- **Status:** Unverified — needs test in Learn.

### Default at Login — Cash Drawer

- **What it does:** Default drawer offered at login. Only meaningful when the
  login screen shows `Cash Drawer` (requires `Use Cash Drawers` in `POS Bar Code
Control Settings` and a drawer in `Cash Drawer Settings`). Under
  `Allow Logon Passthrough` this default is the only drawer the user can get.
- **Status:** Documented.

### Default at Login — Payment Terminal

- **What it does:** Default EMV terminal at login (requires an EMV module,
  Shift4, or Tender Retail and an EMV-enabled login location).
- **Status:** Documented.

### Default at Login — Tethered Terminal

- **What it does:** Default tethered signature device (requires the Document
  Display and Signature Capture module plus `Enable Signatures on Tethered/Mobile
Devices` in `Warehouse/Store Location Settings`).
- **Status:** Documented.

### Default at Login — Enable Signature Capture

- **What it does:** Default for signature capture (login-screen counterpart
  appears only in a terminal server environment).
- **Status:** Documented (visibility rule only).

### STORIS Messenger settings

- **What it does:** Internal messaging configuration; fields not enumerated in the
  source.
- **Status:** Unverified — needs test in Learn.

## Output tab

### Printed Document Destination

- **What it does:** `Standard Printing` / `Local Printer` / `Printing Not
Allowed`. **Couples to the Security tab:** `Standard Printing` is what grants
  access to `Printer Admin Level`. `Local Printer` has real consequences: EOD/EOM
  printing is unavailable when Regional Processing is active, the Printer option
  disappears from `Output Settings`, and EOD/EOM reports land on the workstation
  at `C:\Users\<USERID>\Documents\STORIS\Reports\EOD_YYYYMMDD` (non-Live accounts
  get the account name appended). Decide per role, not per person — ADR
  [D9](../../../decisions/d9-printing-model.md).
- **Status:** Documented.

### Printer Zone

- **What it does:** Printer zone assignment.
- **Status:** Unverified — needs test in Learn.

### Default Logical Printer

- **What it does:** Default printer target.
- **Status:** Unverified — needs test in Learn.

### Default Print Form

- **What it does:** Default form.
- **Status:** Unverified — needs test in Learn.

### Default Hold Queue

- **What it does:** Default hold queue for output.
- **Status:** Unverified — needs test in Learn.

### Default Suppress Queue

- **What it does:** Default suppress queue for output.
- **Status:** Unverified — needs test in Learn.

### Default Number Copies

- **What it does:** 1–999 copies default.
- **Status:** Documented (range only).

### Include Report Banner

- **What it does:** Banner page on report output.
- **Status:** Unverified — needs test in Learn.

### Start Forms Printer at Logon

- **What it does:** Auto-start the forms printer at logon.
- **Status:** Unverified — needs test in Learn.

## Security tab

### Password

- **What it does:** STORIS-native password. Up to 50 upper-case alphanumeric.
  Without `Complex Passwords`, clearing the field sets it null and forces a
  change at next login. With `Complex Passwords`, the field is set to `RESET` on
  creation, is not directly editable, and displays 8 asterisks once set
  regardless of true length. **You cannot change or reset a password while that
  user is logged on to any account.** For non-AD-exempt users the password cannot
  be changed, reset, or viewed at all.
- **Status:** Documented.

### Reset Password

- **What it does:** Forces a password reset; also one of the three ways a
  temporary lockout clears.
- **Status:** Documented.

### Exempt from Active Directory Authentication

- **What it does:** Per-user opt-out of AD (layer 1 gate). If a user is _not_
  exempt, admins cannot change, reset, or view their password. STORIS recommends
  keeping **at least one administrative user exempt as a break-glass account** —
  make that an explicit, documented decision with a named owner — ADR
  [D2](../../../decisions/d2-active-directory-vs-native-passwords.md).
- **Status:** Documented.

### Login ID

- **What it does:** Alternate login identifier, matched at server login alongside
  `User ID`. Its description refers to "the 4-character maximum allowed by the
  User ID field" — part of the length contradiction
  ([open question 1](../../../open-questions.md#1-user-id-length)).
- **Status:** Documented (with open contradiction).

### Allow Logon Passthrough

- **What it does:** Skips the User Log In Screen entirely: the user can never pick
  a location, drawer, or terminal at login — everything falls back to this user
  record. Do not enable for anyone who works at more than one location or shares
  a register — ADR [D7](../../../decisions/d7-logon-passthrough.md).
- **Status:** Documented.

### Maximum number of concurrent sessions

- **What it does:** Session cap (layer 3). Affects license consumption and
  register hygiene — ADR [D10](../../../decisions/d10-concurrent-sessions.md).
- **Status:** Documented (purpose only; blank-value semantics unverified — needs
  test in Learn).

### User Locked Out

- **What it does:** One checkbox carrying **two states**: a _temporary_ lock (set
  automatically after six failed attempts, date/time-stamped, self-clears after
  30 minutes on the next attempt, or cleared by an admin unchecking it or by
  `Reset Password`) and a _permanent_ admin-set lock that never self-clears. Read
  the adjacent word ("Temporarily" / "Permanently") before acting.
- **Status:** Documented.

### PC Applications

- **What it does:** Access to PC application integration; detail not stated in
  source.
- **Status:** Unverified — needs test in Learn.

### File Security Groups

- **What it does:** Report Builder data security (layer 8), file level. Gated by
  Report Builder licensing.
- **Status:** Documented (placement only).

### Field Security Codes

- **What it does:** Report Builder data security (layer 8), field level. Gated by
  Report Builder licensing.
- **Status:** Documented (placement only).

### CRM–InTouch — Enable Corporate Access

- **What it does:** Corporate-wide lead visibility. **Cascade:** checking it
  de-activates `District Manager` and `Store Manager Locations`.
- **Status:** Documented.

### CRM–InTouch — District Manager

- **What it does:** District-scope lead visibility. **Cascade:** de-activates
  `Store Manager Locations`.
- **Status:** Documented.

### CRM–InTouch — Store Manager Locations

- **What it does:** Store-scope lead visibility for listed locations. A user with
  none of the three CRM fields **and** no `Salesperson Code` cannot create or
  update any leads at all.
- **Status:** Documented.

### Enable UP System

- **What it does:** Grants UP System access (scoped add-on).
- **Status:** Documented (placement only).

### UP System Administrator

- **What it does:** UP System admin level.
- **Status:** Documented (placement only).

### Notify of License Expiration

- **What it does:** License-expiry notification. **Not available on user
  groups** — must be set per user. At least one admin should have it.
- **Status:** Documented.

### Printer Admin Level

- **What it does:** Printer administration level. Only accessible when the Output
  tab's `Printed Document Destination` is `Standard Printing`.
- **Status:** Documented (gate only).

### Access Archived Reports

- **What it does:** Which archived report output the user can see. Defaults to
  `User's Archived Reports` (the restrictive option) on new users; anyone who
  needs a colleague's output needs this changed deliberately — ADR
  [D8](../../../decisions/d8-archived-reports-access.md).
- **Status:** Documented.

### Actions button → extended security modules

- **What it does:** Opens the ten module permission catalogs (layer 5): Import
  Data, Logistics, Payables, Personal Information, Purchasing, Receivables,
  Sales, Service, System, Transfer (**Transfer is user-only** — it does not exist
  on groups and is not covered by `Report on User Security`). All of it is inert
  unless `Extended Security` is on in `General System Control Settings`.
- **Status:** Documented.

## Access tab

### LOGIN — Warehouse/Store Location

- **What it does:** Multi-select of locations the user may log in to.
- **Status:** Documented (placement only).

### LOGIN — Default a Login Location

- **What it does:** Pre-selects the login location. **Source contradiction on
  where this field lives** (Access tab here vs Output tab in the login article) —
  see [open question 2](../../../open-questions.md#2-where-default-a-login-location-lives).
- **Status:** Documented (with open contradiction).

### Fulfillment Location Restrictions — Delivery

- **What it does:** Per-method restriction: either `Use Access Restrictions` or an
  explicit `Location List`.
- **Status:** Documented (shape only).

### Fulfillment Location Restrictions — Customer Pickup

- **What it does:** Same shape as Delivery.
- **Status:** Documented (shape only).

### RESTRICTIONS — Company

- **What it does:** Company-level data scope.
- **Status:** Unverified — needs test in Learn.

### RESTRICTIONS — Global Location List

- **What it does:** The blunt instrument: **overrides regional and district
  boundaries and does not require Regional Processing.** It wins.
- **Status:** Documented.

### RESTRICTIONS — Sales (Entry, View/Report)

- **What it does:** Sales data scope, chosen per sub-area from None / Logon
  Location / **District** / Global Location List / Location List. Note: Sales
  scopes by **District** while Inventory scopes by Region — not symmetrical.
- **Status:** Documented.

### RESTRICTIONS — Inventory (Entry, View/Report)

- **What it does:** Inventory data scope, chosen per sub-area from None / Logon
  Location / **Region** / Global Location List / Location List.
- **Status:** Documented.

> **Vendor recommendation (record loudly):** pick **one** restriction mechanism
> and apply it consistently across the user (their example: `Logon Location`
> everywhere). Mixing mechanisms per functional area produces access bugs nobody
> can reproduce — ADR
> [D5](../../../decisions/d5-location-restriction-mechanism.md). Also note
> `Order Access Limited to Selling Store` in `Point of Sale Control Settings`
> further limits order access on top of everything here.
