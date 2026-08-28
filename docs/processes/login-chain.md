---
title: Login chain
type: process
status: draft
domain: processes
source: docs/HANDOFF-users-and-security.md
environment: null
last_verified: null
---

# Login chain

What a user passes through between sitting down and seeing the STORIS main menu.

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

## Step notes

- **Server login (step 1).** The entered Login ID is matched against **both** the
  `User ID` field and the `Login ID` field in the User file; no match aborts the
  login. Whether authentication is Active Directory or STORIS-native is per-user
  (`Exempt from Active Directory Authentication`).
- **`Allow Logon Passthrough` is the highest-leverage switch.** It suppresses the
  whole User Log In Screen, so the user can never pick a location, drawer, or
  terminal at login — everything falls back to their user record. Do not enable it
  for anyone who works at more than one location or shares a register
  (ADR [D7](../decisions/d7-logon-passthrough.md)).
- **Failed logins.** Six failed attempts sets a _temporary_ lock (stamped with
  date/time), cleared automatically 30 minutes later on the next attempt, by an
  admin unchecking `User Locked Out`, or by `Reset Password`. Admins can instead
  set a _permanent_ lock which never self-clears. The same checkbox carries both
  states — read the adjacent word ("Temporarily" / "Permanently") before acting.

## Conditional field visibility on the User Log In Screen

| Field               | Appears only when                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Cash Drawer`       | `Use Cash Drawers` enabled in `POS Bar Code Control Settings` **and** a drawer exists in `Cash Drawer Settings`                           |
| `Payment Terminal`  | An EMV module, Shift4, or Tender Retail is active **and** the login location is EMV-enabled                                               |
| `Tethered Terminal` | Document Display and Signature Capture module present **plus** `Enable Signatures on Tethered/Mobile Devices` in Warehouse/Store settings |
| `Signature Capture` | Terminal server environment only                                                                                                          |

Where `Default a Login Location` actually lives (Access tab vs Output tab) is an
open contradiction in the source — see
[open question 2](../open-questions.md#2-where-default-a-login-location-lives).

## Settings that control this process

| Setting                                        | Where                             | Effect                                                          |
| ---------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| `User ID at Login`                             | General System Control Settings   | Whether the User ID participates at login                       |
| `Extended Security`                            | General System Control Settings   | Requires `User ID at Login`; enables module security downstream |
| `Complex Passwords`                            | General System Control Settings   | Password entry/reset behavior (PCI conformance)                 |
| `Password Expires After __ Days`               | General System Control Settings   | Forced password change cadence                                  |
| `Allow Logon Passthrough`                      | Create a User → Security          | Skips the User Log In Screen entirely                           |
| `Exempt from Active Directory Authentication`  | Create a User → Security          | STORIS-native vs AD authentication for this user                |
| `Use Cash Drawers`                             | POS Bar Code Control Settings     | Shows/hides `Cash Drawer` at login (with Cash Drawer Settings)  |
| `Enable Signatures on Tethered/Mobile Devices` | Warehouse/Store Location Settings | Required for `Tethered Terminal`                                |
| `Update Print Settings` (login checkbox)       | User Log In Screen                | Detours through User Print Settings before the main menu        |
