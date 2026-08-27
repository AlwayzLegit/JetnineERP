---
title: 'D6 — PO hold thresholds by role'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D6 — PO hold thresholds by role

**Status:** proposed

**Decision to make:** Set `Create Manual Purchase Order On Hold` / `Take Purchase Order Off Hold` tri-states and threshold amounts per role.

**Recommended default (starting position, not an answer):** `Threshold` for buyers and store managers with explicit amounts; `Never` for everyone else.

**Why it matters:** This is the spend control. Exceeding a threshold requires a security override by another user, and the override writes a purchase order audit comment — delegated authority with an audit trail. Needs Finance sign-off: each threshold needs a named approver, a number, and a decision record.

**Must be verified first:** The threshold amounts and named approvers, from Finance.
