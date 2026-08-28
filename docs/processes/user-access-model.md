---
title: User access model — the eight layers
type: process
status: draft
domain: processes
source: docs/HANDOFF-users-and-security.md
environment: null
last_verified: null
---

# User access model — the eight layers

STORIS spreads access control across **eight independent layers** that do not
reference each other in the UI. A user can be correctly configured in six of them
and still be unable to do their job — or able to do far too much. Exactly one
report shows the truth (`Report on User Security`), and it does not cover every
layer (Transfer Security is missing from it — see
[open question 4](../open-questions.md#4-audit-coverage-gap)).

Layers are ordered by when they take effect during a session.

| #   | Layer                                              | Where configured                                                          | Gated by                                                                                       |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | OS / server login                                  | `STORIS Server Log In` (Login ID + password), optionally Active Directory | `Exempt from Active Directory Authentication` on the user                                      |
| 2   | STORIS user identity                               | `User ID` field, `Create a User`                                          | `User ID at Login` in `General System Control Settings`                                        |
| 3   | Password / session policy                          | `Password`, `Maximum number of concurrent sessions`, `User Locked Out`    | `Extended Security`, `Complex Passwords`, `Password Expires After __ Days` in General settings |
| 4   | Menu security                                      | `User Group` (required on every user)                                     | none — always on                                                                               |
| 5   | Extended (module) security                         | `Actions` button → ten module screens, on user _and_ group                | `Extended Security` in `General System Control Settings`                                       |
| 6   | Screen action permissions                          | `Assign Screen Action Permission` routine                                 | none                                                                                           |
| 7   | Data scope: location / region / district / company | `Access` tab on user and group                                            | `Regional Processing` (partly — see [open question 3](../open-questions.md))                   |
| 8   | Report Builder data security                       | `File Security Groups`, `Field Security Codes`                            | Report Builder licensing                                                                       |

Two scoped add-ons behave like access control but sit elsewhere, on the user's
Security tab: **CRM/InTouch lead visibility** and **UP System** access levels.

## The load-bearing sentence

> Security settings on these screens are only effective if extended security is
> active on your system via the `General System Control Settings`.

If `Extended Security` is off, every module permission configured under layer 5 is
inert. Verify that flag **first, in each environment**, and record it in
[`docs/settings/general-system-control-settings.md`](../settings/general-system-control-settings.md).

## Layer notes

- **Layer 4 (menu security)** comes only from the user's group. Delivered group
  `SYSMGR` is the only group whose members can reach the `Get Started` menu.
- **Layer 5 (module security)** is configured in ten catalogs: Import Data,
  Logistics, Payables, Personal Information, Purchasing, Receivables, Sales,
  Service, System, Transfer. Transfer exists **on users only**, not groups, and is
  not covered by `Report on User Security`.
- **Layer 6** is invisible from both the user and group screens — it is its own
  routine (`Assign Screen Action Permission`, per user group) restricting
  individual options on `Actions` button menus. Document it explicitly or it will
  be forgotten.
- **Layer 7 asymmetry:** Sales scopes by **District**; Inventory scopes by
  **Region**. They are not the same control. `Global Location List` overrides
  regional and district boundaries, does not require Regional Processing, and
  wins. STORIS's own recommendation is to pick **one** restriction mechanism and
  apply it uniformly across a user.
- **Hidden coupling into CRM:** `Salesperson Code` on the General tab grants CRM
  lead access for that salesperson, independently of the CRM fields on the
  Security tab.
- **Operational rule:** any change to the User file requires a STORIS restart
  before it takes effect. Testers who report "the permission didn't work" usually
  did not restart.

## Settings that control this process

| Setting                                       | Where                           | Effect                                                    |
| --------------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `Extended Security`                           | General System Control Settings | Master switch for layer 5; requires `User ID at Login`    |
| `User ID at Login`                            | General System Control Settings | Gates layer 2                                             |
| `Complex Passwords`                           | General System Control Settings | Layer 3 password mode (PCI)                               |
| `Password Expires After __ Days`              | General System Control Settings | Layer 3 aging                                             |
| `Regional Processing`                         | General System Control Settings | Partly gates layer 7 (see open question 3)                |
| `Order Access Limited to Selling Store`       | Point of Sale Control Settings  | Further POS-side limit on order access, on top of layer 7 |
| `Exempt from Active Directory Authentication` | Create a User → Security        | Per-user gate on layer 1                                  |
| Report Builder licensing                      | licensing                       | Gates layer 8                                             |
