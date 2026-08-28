## Transfers quick wins + Run-01 accounting pack landed (2026-08-28)

Task #25's decision-free quick wins (the GAP-RECONCILE §4 tail),
built while the owner scope answers are pending:

- **Hold / scheduled quantity (pack D18/D19)** — migration
  `0063_transfer_hold` adds `stock_transfer_lines.quantity_ordered`
  (null = no hold). Create accepts `lines[].quantityOrdered ≥
quantity`; only the scheduled quantity ever ships or leaves origin
  stock; detail exposes `quantityOrdered`/`quantityHeld`. On FULL
  receipt the held remainder rolls into a fresh draft transfer on the
  same lane ("Held quantity rolled over from ST-… (D19)"), audited as
  `stock_transfer.hold_rollover` — Jetnine idiom for "hold is cleared
  and the remainder becomes schedulable"; divergence from STORIS's
  reserve-at-origin hold is documented in the schema comment.
- **Excess inquiry (pack 12)** — `GET /v1/stock-transfers/excess`:
  variants whose total available stock exceeds their largest single
  transfer line. Informational only. (Route registered before `:id` —
  the literal-after-param 500 was caught by the new test.)
- Web: transfer detail gains a Held column; the create form gains an
  optional "Ordered (hold)" input per line.
- transfers.int.spec 29→32 (D18 validation + partial ship, D19
  rollover draft, excess incl. the 100-unit-line exclusion case).

**Run-01 Accounting pack** uploaded by owner (~00:40) and committed
verbatim: `docs/handoffs/run01-accounting/` — 30 batch returns over
307 STORIS Accounting articles (GL 10, Payables 63, Receivables 124,
Views/Reports 100) + coverage queue + run summary + assignment card.
Queued as **task #29**; kickoff will reconcile against shipped Jetnine
(no GL/AP/AR modules today; the receivables layer must be read against
the locked third-party-financing-only decision) and batch the owner
asks like the other four packs.
Gates: typecheck 0 · lint 0 · test 0 (full) · build 0 · format 0.
