---
title: Open questions — users & security domain
type: open-questions
status: draft
source: docs/HANDOFF-users-and-security.md
---

# Open questions — users & security domain

Real inconsistencies in STORIS's own documentation. Do **not** resolve them by
picking the more plausible reading — run the stated test and record the observed
behavior with `environment` and `last_verified` in the affected article. Run all
five **before Phase 2 of this domain**: every article written on top of an
unresolved contradiction has to be rewritten.

## 1. User ID length

- **Contradiction:** `Create a User` says up to **five** alphanumeric characters;
  `User Log In Screen` says a maximum of **four**; the `Login ID` field
  description refers to "the 4-character maximum allowed by the User ID field";
  RF / Store Barcode users may use **six**.
- **Test:** In the Learn/test account, attempt to create users with 4-, 5-, and
  6-character User IDs (non-RF), and a 6-character RF / Store Barcode user.
  Record which lengths the field accepts and which log in successfully.
- **Environment:** Learn/test account.
- **Blocks:** ADR [D1](decisions/d1-user-id-convention.md) — genuinely painful to
  reverse.

## 2. Where `Default a Login Location` lives

- **Contradiction:** `Create a User` puts it on the **Access** tab; `User Log In
Screen` twice refers to `Default a Location` / `Valid Locations` on the
  **Output** tab. Likely stale text in the login article.
- **Test:** Open `Create a User` in the Learn/test account and record which tab
  actually carries the field (and its exact on-screen label).
- **Environment:** Learn/test account.

## 3. Whether the group Access tab needs Regional Processing

- **Contradiction:** `Create a User Group` says _"To access this tab, Regional
  Processing must be active"_ and, a few lines later, _"These settings are active
  whether or not Regional Processing is active in your system."_ Both cannot be
  true.
- **Test:** With Regional Processing **off**, open `Create a User Group` and
  record whether the Access tab is reachable, and whether settings made there
  take effect for a member user.
- **Environment:** Learn/test account with Regional Processing off.

## 4. Audit coverage gap

- **Gap:** `Report on User Security` lists the modules it covers — **Transfer
  Security is not among them**, and Transfer Security is not available on groups.
  Transfer permissions are therefore per-user and invisible to the only audit
  report.
- **Test:** Run `Report on User Security` in the Learn/test account for a user
  with Transfer permissions set; confirm the export contains no `Transfer`
  columns.
- **Environment:** Learn/test account.
- **Consequence:** Plan a manual review step for transfer permissions in the
  quarterly access review, or exclude transfer permissions from the design.

## 5. `Type` vs `User Group`

- **Contradiction:** `Create a User Group` says users are assigned via _"the
  `Type` field in the User file"_; `Create a User` calls that field `User Group`.
  Same field, two names — legacy drift.
- **Test:** Confirm the on-screen label in the Learn/test account's `Create a
User` screen; record the alias in the glossary.
- **Environment:** Learn/test account.
