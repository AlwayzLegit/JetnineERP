---
title: 'D2 — Active Directory or STORIS-native passwords'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D2 — Active Directory or STORIS-native passwords

**Status:** proposed

**Decision to make:** Choose the authentication source for STORIS users.

**Recommended default (starting position, not an answer):** Active Directory, with **one documented exempt break-glass admin** (named owner recorded in this ADR when accepted).

**Why it matters:** Vendor-recommended; without an exempt account, an AD outage locks everyone out. Non-exempt users' passwords cannot be changed, reset, or viewed by admins.

**Must be verified first:** That AD authentication is available and configured in our environment; who owns the break-glass account.
