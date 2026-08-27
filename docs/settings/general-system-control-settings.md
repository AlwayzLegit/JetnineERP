---
title: General System Control Settings
type: settings
status: draft
domain: settings
source: docs/HANDOFF-users-and-security.md
environment: null
last_verified: null
---

# General System Control Settings

> **Scope note.** This article covers only the security-relevant fields named in
> §2 and §3 of `docs/HANDOFF-users-and-security.md`. The full settings screen has
> more fields; they will be documented when their domains are captured.
>
> **Every value below is TBD — unverified.** Do not treat any "our value" as a
> decision. Values are recorded only after being read from the actual environment,
> with `environment` and `last_verified` stamped.

## Fields

### Extended Security

- **What it does:** Master switch for layer 5 (module/extended security). When off,
  every permission configured on the ten module security screens (user _and_ group)
  is inert — the source docs state: _"Security settings on these screens are only
  effective if extended security is active on your system via the General System
  Control Settings."_
- **Requires:** `User ID at Login` must be active.
- **Our value:** TBD — unverified.
- **Verify first, per environment:** this flag must be read and recorded before any
  module permission work is trusted.

### User ID at Login

- **What it does:** Gates layer 2 (STORIS user identity) — controls whether the
  `User ID` field participates at login. Prerequisite for `Extended Security`.
- **Our value:** TBD — unverified.

### Complex Passwords

- **What it does:** PCI-conformance password mode. Changes password administration
  permanently: on user creation the password field is set to `RESET`, is not
  directly editable, and displays 8 asterisks once set regardless of true length.
  Without it, passwords are up to 50 upper-case alphanumeric characters and
  clearing the field sets it null, forcing a change at next login.
- **Our value:** TBD — unverified. See ADR
  [D3](../decisions/d3-complex-passwords.md) (recommended: on).

### Password Expires After \_\_ Days

- **What it does:** Session/password aging policy (layer 3).
- **Our value:** TBD — unverified.

### Regional Processing

- **What it does:** Partly gates layer 7 (data scope by location / region /
  district / company) on user and group Access tabs. Note the open contradiction:
  the group Access tab is described both as requiring Regional Processing and as
  active without it — see
  [open question 3](../open-questions.md#3-whether-the-group-access-tab-needs-regional-processing).
  `Global Location List` explicitly does **not** require Regional Processing and
  overrides regional and district boundaries.
- **Also coupled to:** `Local Printer` output mode — EOD/EOM printing is
  unavailable under Regional Processing for `Local Printer` users.
- **Our value:** TBD — unverified.

### Menu Timeout Active

- **What it does:** Session timeout control. Listed in the source section index as
  security-relevant; behavior detail not captured in the handoff.
  Unverified — needs test in Learn. Note: configurable on user **groups** only,
  not on individual users.
- **Our value:** TBD — unverified.

## Settings elsewhere that interact with these

| Setting                                        | Lives in                          | Interaction                                                       |
| ---------------------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| `Use Cash Drawers`                             | POS Bar Code Control Settings     | Controls whether `Cash Drawer` appears on the User Log In Screen  |
| `Enable Signatures on Tethered/Mobile Devices` | Warehouse/Store Location Settings | Required for `Tethered Terminal` at login                         |
| `Order Access Limited to Selling Store`        | Point of Sale Control Settings    | Further limits order access on top of the Access-tab scopes       |
| `Purchase Order/Assignment Required`           | Special Order Control Settings    | Overrides `Create special order purchase orders within POS entry` |
| `Exempt from Active Directory Authentication`  | Create a User (Security tab)      | Per-user gate on layer 1 (OS / AD login)                          |
