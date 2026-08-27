---
title: 'D10 — Concurrent session limit'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D10 — Concurrent session limit

**Status:** proposed

**Decision to make:** Set `Maximum number of concurrent sessions` per role.

**Recommended default (starting position, not an answer):** 1 for register/POS roles; blank for back office.

**Why it matters:** License consumption and register hygiene.

**Must be verified first:** The semantics of a blank value (unlimited?) — unverified, needs test in Learn.
