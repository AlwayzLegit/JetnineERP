---
title: 'D9 — Printing model per role'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D9 — Printing model per role

**Status:** proposed

**Decision to make:** Choose `Printed Document Destination` per role.

**Recommended default (starting position, not an answer):** `Standard Printing` for back office; decide `Local Printer` deliberately given the EOD/EOM limitations.

**Why it matters:** Coupled to Regional Processing: `Local Printer` users lose EOD/EOM printing under Regional Processing, lose the Printer option in Output Settings, and get EOD/EOM reports dropped on the workstation. `Standard Printing` is also what grants access to `Printer Admin Level`.

**Must be verified first:** Whether Regional Processing will be active; the printer topology per store.
