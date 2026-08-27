---
title: 'D3 — Complex Passwords on or off'
type: decision
status: proposed
source: docs/HANDOFF-users-and-security.md
---

# D3 — Complex Passwords on or off

**Status:** proposed

**Decision to make:** Enable `Complex Passwords` in General System Control Settings, or not.

**Recommended default (starting position, not an answer):** On (required for PCI conformance).

**Why it matters:** Changes how passwords are set forever after: creation sets `RESET`, field not directly editable, 8-asterisk display. Turning it on later changes admin workflow.

**Must be verified first:** Current value of the flag in each environment; interaction with D2 (AD users' passwords are not STORIS-managed at all).
