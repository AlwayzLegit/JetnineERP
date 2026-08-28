# Run-05 Customer Service pack — gap reconcile vs shipped Jetnine

Authored 2026-08-28. Run 05 (findings F291–F315) audited the smallest
STORIS section at the deepest read rate. Jetnine's shipped counterpart is
the service-orders module (G6): SV-numbered tickets with a status machine
(`intake → awaiting_parts → in_service → ready → completed/cancelled`),
technician assignment, warranty flag, parts+labor lines, a notes
narrative that records status changes, and money through the one
`payments` table. The run's verdict — service is a financial document, a
warranty settlement instrument, and a merchandising signal at once —
adjudicates as: **financial document already true in Jetnine; the other
two are the real gaps**, and they are the owner batch (§4).

## 1. The eight headline findings, adjudicated

1. **STORIS Messenger prerequisite (F291)** — Jetnine has no internal
   mail subsystem and does not want one: notifications are email
   (Resend), webhooks, and the platform layer. The finding's warning
   (turn Messenger off and tickling silently dies) is a coupling shape
   Jetnine avoids — nothing in the ERP silently depends on a separately
   activatable channel.
2. **The tickle notification matrix (F292)** — not rebuilt. If §4 Q3
   says the service team lives by call reminders, the lean equivalent
   is an EOD job (the registry already runs six) producing a daily
   call-back list from last-contact vs a `callCustomerDays` ops
   setting — the STORIS nightly-rebuild semantics, which are the right
   ones (a list recomputed from state, not an accumulating queue). Two
   verbatim-copyable details if built: the actor is excluded from
   their own notification; technicians only on manual assignment.
3. **Three service methods gating pages (F293)** — Jetnine has no
   in-home/in-shop/stock-merchandise axis; a ticket is a ticket.
   Whether LA Mattress does in-home service at all is §4 Q2 — if yes,
   the lean version is a method field + scheduling against the same
   delivery capacity, not page gating.
4. **Customer's own goods as a movement document (F294)** — not built.
   Mattress warranty flows here are vendor inspections and
   replacements, which the as-is queue + RTV already models
   (`source: 'warranty'`). A full COG document (own number, route,
   frozen destination) only earns its place if §4 Q2 says the shop
   takes customer property in — same question.
5. **Four payment responsibilities (F297/F307/F308)** — **the run's
   best catch and a real gap.** Jetnine has a boolean `warranty` flag
   where STORIS has a payer axis (customer · factory warranty ·
   extended warranty · other vendor) across parts/labor/charges — which
   is what makes "is selling protection plans profitable?" answerable.
   Lean build (§4 Q1, recommended): replace/augment the flag with a
   `payerType` on the service order (or line), reportable; no
   settlement machinery. STORIS itself has no documented path from
   chargeback report to AP credit, so we lose nothing by keeping
   collection manual.
6. **Event-sourced service line status (F306)** — the run says "copy
   this everywhere." Jetnine already does, globally: every status
   transition writes `audit_logs` (before/after JSON) and service
   tickets additionally keep the notes narrative — so dwell-time
   ("status durations") reporting is computable today from audit rows.
   Parity, achieved by the general mechanism instead of a
   service-specific one.
7. **The service→merchandising quality loop (F311/F313/F314)** — the
   five STORIS instruments hang off an unpublished `Problem Code`
   enumeration. Jetnine has the substrate (`reason_codes` carry
   behavior elsewhere) but service orders record the issue as free
   text. Lean build (§4 Q1, recommended together with the payer axis):
   an optional problem reason code on service orders + a
   sales-to-service view in the report builder. Without it the
   which-products-keep-failing signal dies at cutover exactly as the
   run predicts.
8. **Three contact channels, one invisible (F300/F301/F312)** — in
   Jetnine, customer contact lands in `customer_notes` or the platform
   layer; there is no channel that writes nothing. The finding survives
   as a migration caution (§3): STORIS contact history is *known
   incomplete* if the team habitually used the envelope icon — ask
   them, per §4 Q3.

## 2. Sweep — the rest

- **Reinstatement onto a new document (F305)** — parity by convention:
  completed Jetnine tickets are terminal; a repeat visit is a new
  ticket referencing the old (notes/legacyNumber). "Did we go back?"
  stays answerable. No reopen endpoint exists, matching STORIS's rule.
- **Parts received before linking (F295)** — parity: parts lines pull
  from stock (`variantId` + inventory consumption); you cannot consume
  stock that is not there. The three-role dock notification is
  Messenger territory (§1.1).
- **Service orders are financial documents (F303, unknown-unknowns)** —
  already true: payments land through the shared `payments` table,
  totals are integer cents, refunds flow the one refund path, and GL
  derivation picks service tenders up with everything else.
- **Deposits/financing freezing line edits (F303)** — Jetnine guards by
  status, not by a payment-presence lock. Accepted difference; audit
  log records edits either way.
- **Surveys (F312) and gift registry (F315)** — platform-layer /
  not-built respectively. Registry funding-through-sales closes run
  03's W-028 note; Jetnine gift cards cover the actual LA Mattress use.
- **`Available Credit` on the header / hold `C4`** — no credit-hold
  system (run-04 reconcile §1.1); service tickets gate on payment at
  completion like everything else.
- **Views & reports (F304–F315)** — report builder + audit rows cover;
  status-duration and payer-profitability reports become trivial once
  §4 Q1 lands.

## 3. Migration-time cautions adopted

1. **Contact history is incomplete by construction** if the envelope
   icon was habitual — establish this with the service team before
   promising migrated contact history.
2. **Service cycle times are recoverable** from STORIS (the one
   event-sourced history in the system) — extract status-duration data
   if anyone wants historical baselines, because most other STORIS
   history is snapshot-only.
3. **Problem codes**: extract the live `Problem Code` list (unpublished
   in the docs) with the config-screen photos; it seeds Jetnine reason
   codes if §4 Q1 says yes.
4. **Open service orders** migrate as tickets with `importedAt` set
   (D8: no accrual/derivation side effects), payer split defaulting to
   the warranty flag until the axis exists.

## 4. Owner batch — three questions

1. **Payer axis + problem codes (recommended: yes, lean)** — add
   `payerType` (customer / factory warranty / extended warranty /
   other vendor) and an optional problem reason code to service
   orders, plus the two reports (profitability by payer,
   sales-to-service by product). This is what keeps the
   protection-plan P&L and the product-quality signal alive. Say
   yes/no.
2. **In-home service and customer's own goods** — does LA Mattress do
   in-home service calls, and does the shop ever take customer
   property in for repair? yes/yes → lean method field + COG-style
   intake; no/no → current model stands.
3. **Call reminders (Ops + decide)** — ask the service team: do they
   work off STORIS tickles/call lists today, and did they use the
   envelope icon (unlogged email)? If tickles matter → EOD call-back
   list job as in §1.2.

No code changes follow until §4 lands.
