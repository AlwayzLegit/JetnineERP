# Run-06 Getting Started pack — gap reconcile vs shipped Jetnine

Authored 2026-08-28. Run 06 (findings F316–F336) closed three of the
audit's oldest gaps, and two of them adjudicate as **already-shipped
parity** in Jetnine. This is the shortest reconcile because the section's
load-bearing discoveries were either built before the audit named them or
are deliberately out of scope. No owner [DECIDE] batch — the one open
item folds into the existing config-screen-photos Ops ask.

## 1. The six headline findings, adjudicated

1. **The security override (F316)** — **shipped parity, and the close
   match is worth recording.** Jetnine's `SecurityOverrideService` is
   exactly the run's "in-line second signature, not a role
   escalation": an authorizing user's credentials presented inside the
   acting user's session, the authorizer recorded as a structured
   `security_overrides` row, reason codes attached. It gates the same
   families STORIS gates (capacity overrides, as-is restrictions,
   suspended cash-shift closes via `pos.cash.approve`, E1 approvals).
   The one STORIS case Jetnine doesn't implement — "you have permission
   but still owe a reason code" — is available by policy (require a
   reason on the endpoint) if ever wanted; not a gap today.
2. **STORIS Messenger in full (F317–F322)** — not rebuilt (run-05
   reconcile §1.1). Its three consumers map to Jetnine channels that
   already exist: buyer alerts → webhooks/email; service tickles → §4
   Q3 of the run-05 reconcile; scheduled report distribution → report
   builder + email. The `Mandatory` document-link task is a genuinely
   good primitive, noted for the platform layer, not the ERP. The
   `Mail Administrator` read-everything flag is an anti-pattern Jetnine
   will not copy.
3. **Authentication is optional in STORIS (F323)** — Jetnine
   authentication is unconditionally on (better-auth, per-user 2FA,
   session management); there is no switch that turns the password
   field off. The finding's real payload is migration-side (§2):
   STORIS "users" may be names, not identities — Jetnine users are
   invited fresh with their own credentials regardless, which is
   already the onboarding flow.
4. **`Assign Specific Pieces At` (F328)** — Jetnine has one model, not
   a three-value setting: quantity reservation at order open (B14),
   serial/piece binding at ship. The setting's live value is a
   parallel-run interpretation question, already carried in the run-04
   reconcile §3.2.
5. **Printing changes state (F329/F335)** — **deliberate
   anti-parity with the principle kept where it earns it.** In Jetnine,
   printing never *creates or locks* documents as a side effect —
   reservation is event-time, manifests are built explicitly. But where
   a print must be a business event, it is one: transfer ticket-printed
   unlocks ship (Q3 gate), delivery-ticket prints are recorded state
   (the reprints pack), and both are audited. Printing is rendering
   plus an explicit recorded event — never a hidden transaction.
6. **Reprints polluting the exception report (F330)** — the defect
   cannot occur in Jetnine: reprinting a ticket increments a print
   count on the same document; it never requires removing a transfer
   from a manifest, so no spurious removal exceptions exist. The
   run's checkable question ("how many of your manifest-removal
   exceptions are reprints?") is worth asking during the warehouse
   walkthrough — it calibrates how much STORIS exception history to
   trust.

## 2. Sweep and migration notes

- **Session hardware bindings** (location, cash drawer, terminal) —
  Jetnine binds shift↔drawer↔location at shift open; payment terminals
  are the Stripe Terminal Ops item. `Switch User Location`'s silent
  printer fallback has no equivalent (printing is client-side).
- **Concurrent licensing / licence recovery** — n/a, SaaS.
- **Purge chains (ninth, no retention setting)** — Jetnine never
  purges; nothing to reconcile.
- **Migration**: before promising migrated user accounts, check the
  four login checkboxes (`User ID at Login`, `Extended Security`,
  `Complex Passwords`, `Password Expires`) — fold into the existing
  config-screen-photos Ops item. Expect STORIS audit attribution to be
  weak if Extended Security is off: overrides may be the only reliably
  attributed events in the legacy data.
- **Thirteen undefined terms (F336)** — a vendor question, already the
  owner's channel; nothing to build against undefined terms.

With this, all six audit runs carry a reconcile:
run 01 → `run01-accounting` (GL program, shipped) · run 02 →
`run02-merchandising/GAP-RECONCILE.md` · run 03 →
`run03-sales-processing/GAP-RECONCILE.md` · run 04 →
`run04-logistics-delivery/GAP-RECONCILE.md` (+
`docs/erp-transfers/GAP-RECONCILE.md`) · run 05 →
`run05-customer-service/GAP-RECONCILE.md` · run 06 → this file. The
consolidated owner-question queue lives in the §4 batches of runs 02–05
plus the standing Ops list.
