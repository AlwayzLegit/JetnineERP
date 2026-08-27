---
title: 'D4 — Group taxonomy'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D4 — Group taxonomy

**Status:** proposed

**Decision to make:** Define the set of user groups (menu security) for LA Mattress.

**Recommended default (starting position, not an answer):** Start from the delivered `S$` user types (e.g. `S$CS`), copy via `Create a User Group` and rename; do not author groups from scratch. `SYSMGR` only for system administrators.

**Why it matters:** Delivered groups encode working menu sets. Only `SYSMGR` members can reach the `Get Started` menu. `Reset User Members` is a destructive mass overwrite — never without a `Report on User Security` export taken immediately before, never during business hours.

**Must be verified first:** The proposed role list (Sales Associate, Store Manager, Buyer, AP Clerk, AR/Collections, Warehouse/Logistics, Service, Controller, System Administrator) against the actual LA Mattress org — the role list determines everything downstream.
