---
title: 'D5 — Location restriction mechanism'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D5 — Location restriction mechanism

**Status:** proposed

**Decision to make:** Pick the single data-scope mechanism applied uniformly per user (Access tab).

**Recommended default (starting position, not an answer):** `Logon Location` for store staff; `Global Location List` for multi-store roles — one mechanism per user, applied uniformly.

**Why it matters:** Vendor's own recommendation; mixing mechanisms per functional area causes irreproducible access bugs. Sales scopes by District, Inventory by Region — not symmetrical. `Global Location List` overrides both and needs no Regional Processing.

**Must be verified first:** Whether Regional Processing is active in our environment, and open question 3 (does the group Access tab require it).
