# Open Questions

Two kinds of gap. **Type A** — STORIS documents the behaviour incompletely or not at all, so nobody
can copy it. **Type B** — we understand STORIS' behaviour and should deliberately not copy it. Both
need a human answer. Nothing in this file should be resolved by a coding decision.

Ordered roughly by how much a wrong answer costs.

---

## Blocking — answer before the named phase starts

### 1. Deferred-interest / promotional financing plans — Type A, phase 7

Absent from all source material, yet "12 months no interest" is likely the highest-volume plan on a
mattress floor. Need: promo lengths offered, deferred-interest accrual and retroactive-interest
behaviour, minimum purchase thresholds, what the disclosure prints and when it must be signed, and how
a promo interacts with minimum deposit. **Phase 7 cannot start without this.**

### 2. Commission and spiff formulas — Type A, phase 9

The docs cover splitting, reporting, and date attribution, but never the calculation. Need: basis
(gross / net of discounts / margin), spiff sourcing, whether delivery and warranty revenue are
commissionable and at what rate, clawback rules on returns beyond the original-invoice-date rule, and
how protection-plan and payment-adjustment commissions are rated. This is compensation — get it in
writing from management.

### 3. Card data: tokenize or store? — Type B, phase 4

STORIS encrypts PANs with an unmask permission. Recommend processor tokenization and storing no PAN.
Consequence: the refund-lookup path changes (token lifetime replaces "card records on file"), and any
processor migration becomes harder. Needs a compliance owner's sign-off.

### 4. Minimum deposit configuration — Type A, phase 3

The calculation's _inputs_ are never documented — only that a whole-order minimum and a line-type
minimum both exist and the greater wins. Need: where percentages live (fulfillment method? product
category? both?), whether tax is included by default, and who can waive.

### 5. Tax engine or in-house? — Type B, phase 2

STORIS supports both an internal calculation and third-party engines. This decision changes the shape
of phase 2 substantially. Recommend an engine (mattress delivery crosses local jurisdictions
constantly), which shrinks our tax surface to exemptions and overrides.

### 5b. Discount type set and stacking precedence — Type A, phase 2

The source material covers _price derivation_ in full but never enumerates discount types or how they
stack with each other. Need: the discount type set, line-vs-subtotal precedence, whether discounts
compound or apply to the original price, and which combinations are prohibited. `04` calls this the
most likely place for a silent margin leak.

### 5c. Provider set and integration route — Type A, phase 7

Which financing providers LA Mattress actually uses, and whether we integrate with each directly or
through an aggregator. Everything in phase 7 — plan types, authorization payloads, settlement
transport, error handling — depends on this answer.

### 6. Order type canon — Type A, phase 1

The docs never publish the full list or its codes. Proposed set is in `02` §1. Confirm it, because
order type is on every row of every report forever.

### 7. Credit hold code canon — Type A, phase 1

Four codes are documented (`C6`, `F5`, `S1`, `F3`); the full set lives in a list we did not read.
Define ours explicitly — this drives the completion gate.

---

## Design decisions — deliberate departures to confirm

### 8. Settlement error blast radius — Type B, phase 8

Documented: one error halts settlement for a whole location. Recommend per-item isolation with
quarantine and alerting. Check whether any provider's batch protocol actually forces the
all-or-nothing behaviour before departing.

### 9. Destructive exception re-selection — Type B, phase 5

Documented: re-selecting Complete on a not-complete line destroys the exception data irreversibly.
Recommend preserving it and restoring on re-flag. Low cost, clear improvement.

### 10. The View/Maintain filter that clears the grid — Type B, phase 10

A documented bug-shaped behaviour. Just don't build it.

### 11. Cash-balancing time window — Type B, phase 8

Documented: a narrowed window silently orphans receipts onto an exceptions report. Recommend
defaulting to the full logical day and warning when a narrower window would exclude existing receipts.

### 12. Permission precedence — Type A/B, phase 0

At least one financing permission has user-level overriding group-level. Pick one global rule and
apply it uniformly. Recommend: explicit user grant or deny beats group; deny beats grant within a
level.

### 13. Override mechanism — Type B, phase 0

Manager password at the terminal (what staff know) vs approval from the manager's own device (more
auditable, no shared credentials). Affects phase-0 UX.

### 14. SSN and driver's licence retention — Type B, phase 3/7

Recommend: never persist SSN (pass through to provider, keep a provider reference); store a licence
verification result and last four rather than the number. Needs the same compliance owner as #3.

### 15. Quick Sale as a separate path — Type B, phase 1

STORIS' quick sale bypasses much of the fulfillment model. Decide whether we need it or whether a fast
mode on the main order suffices. A separate path is a second code path through money.

### 16. Sales analysis report builder — Type B, phase 10

Two options in `09`: derive the field catalogue from the cutover extract (recommended, preserves
store-manager self-service) or skip the builder and connect BI to a read replica.

### 17. Pilot store vs full cutover — Type B, phase 11

A single-store pilot makes rollback survivable. Depends on store count and whether inventory is shared.

---

## Undocumented mechanics — specify before the relevant phase

### 18. Cash drawer opening — Type A, phase 8

All three source articles cover closing. Opening a till, the starting bank, mid-day drops and pickups,
and the purge routine are all absent. Without an open event, "system total" has no start boundary.

### 19. Finance queue and tier waterfall — Type A, phase 7

A tier column, a `QUEUE` provider value, and a queue-recap program exist; the cascade logic does not.
Need: does a decline auto-submit to the next tier, in what order, with what customer-visible
messaging, and what stops the cascade.

### 20. Up System stack / unstack / retain-spot — Type A, phase 9

Not in the settings material but relied on daily by floor managers. Need the exact semantics of
stacking two salespeople on one up and of holding a rotation position.

### 21. Closing-ratio convention — Type A, phase 9

The documented formula reads `(Traffic + Non-Traffic) ÷ # Sold`, which is inverted from convention.
Confirm which number management reads before building the report — salespeople are measured on it.

### 22. Aging, statements, dunning, interest — Type A, phase 7+

Entirely absent from the source material. Only relevant if we service receivables in-house rather than
selling them to providers. If we do, it is a whole additional module, not a phase-7 detail.

### 23. Charge-off lifecycle — Type A, phase 7

Implied by an "overpay charged-off accounts" setting; otherwise undocumented.

### 24. Completion Date Entry field rules — Type A, phase 5

Referenced in passing with no field list or validation. Specifically: may the completion date be
back-dated or future-dated, and against what boundary?

### 25. Remote order completion — Type A, phase 5

Asserted as supported ("orders completed via a remote process" even has its own report) with no
definition or entry point. If we need drivers completing on a device, this is a whole feature.

### 26. Small enum domains — Type A, phase 1-2

Never enumerated: contact status, handling method, substitution code, product type, commission
category, reason-code usage types, and line-level purchase status (`[INFER]` shares the product A/D/T
domain). (The completion "notes" classification _is_ fully enumerated — see `02` §5; the open question
about it is #27, not this one.)

### 27. Line type vs notes classification — Type A, phase 1

"Line type" is documented as equal to the fulfillment method, yet the completion grid shows Service,
Kit Master, Labor, Charges, Released. There is a line-classification dimension that is never modeled.
Decide whether we model it explicitly.

### 28. Pending-deposit / auth-capture for web orders — Type A, phase 4

A "pending deposit" state for e-commerce orders is mentioned as a screen message with no lifecycle.

---

## Research notes worth keeping

- **The source articles are gated.** They redirect anonymous requests to sign-in, so they were read
  through an authenticated browser session, not fetched. Any repeat research needs the same access.
- **Field definitions hide in collapsed accordions.** Plain text extraction returns field _labels_
  only; the accordions must be expanded first. This silently produced empty field lists on the first
  pass.
- **One source article is broken on STORIS' side** — the sales analysis field table failed to migrate
  and its in-body links have empty hrefs. That gap is #16 above, and no amount of re-reading fixes it.
- **Two article ids resolve only with their URL slug appended**; bare-id URLs land on unrelated
  articles. Verify you are reading what you think you are reading.
