# Cash-balancing pack — gap reconcile vs shipped shifts/closeout

Authored 2026-08-27 for task #27: map the pack's closed loop
(configure → capture → balance → report → purge) onto what Jetnine has
already shipped, and put the pack's own Q1–Q10 plus the scope calls to
the owner in one batch.

## 1. Shipped today

- **Capture**: payments post against the open cash shift at the sale's
  location; legacy-imported records are excluded (D8).
- **Balance**: `cash_shifts` — open with an opening float
  (`pos.cash.open`), close with a counted-cash entry; expected = float
  + cash taken; variance computed and stored; over/short surfaces on
  the shift record, the Z-report, and closeout.
- **Report**: the sales-views program shipped the receipts report
  (method × location across sale/order/service tenders), the Z-report
  (5 sub-queries incl. tender COALESCE), and the morning dashboard.
- **Configure/purge**: SET-007 ops-settings registry exists; there is
  no purge — Jetnine retains everything (deliberate; storage is cheap
  and financial history is never deleted per house rules).

So the pack's *loop* exists end-to-end in a lean form. What STORIS adds
on top is discipline around the count itself (blind entry, tolerance,
retries, suspension, approval), balancing at cashier grain, suspense
posting, a GL recap, and fiscal-period date codes.

## 2. Gap list (all scope-gated on §3)

- **Blind-count discipline** (`02` Extended block): counted-first
  entry, `Maximum Over/Short` tolerance compared on CASH only,
  `Number of Tries` limited retries, drawer **suspension** on
  exhaustion, manager approval to force-balance. Natural extension of
  the shipped shift close + SecurityOverrideService.
- **Balance By cashier** — shifts are per-location today; per-cashier
  drawers would need shift-per-membership.
- **Suspense posting** (`Post to Suspense`) — unbalanced amounts to a
  suspense account entity. Jetnine has no GL; today variance is a
  recorded number + exception, which may already be the right shape.
- **GL recap on the receipts register** (`04`) — needs a GL account
  mapping that Jetnine deliberately does not have; the receipts report
  covers the operational half.
- **Cash Requirements report** (`05`) — forward-looking **AP** cash
  needs. Jetnine has vendor invoices (G11 matching) but no AP payment
  scheduling; moot until AP exists.
- **Fiscal date codes** (`06` LPTD/CPTD/YPTD…) — every Jetnine report
  takes explicit from/to dates instead. Building the resolver only
  makes sense with a fiscal calendar decision (Q5).
- **Purge/retention** (`01` §4) — deliberately not built; see §1.

## 3. Owner batch — the pack's Q1–Q10, triaged, plus one scope call

Answered by shipped design (confirm only, no work unless you object):

- **Q1 (term)**: Jetnine says `cashier` for people; "operator" is not
  used anywhere. Drawer-vs-cashier grain is the real question → scope
  call below.
- **Q2 (known-number bypass)**: never built — the hole stays closed.
- **Q3 (unmarked AP column)**: moot, no AP report yet; if built it
  gets a header.
- **Q4 (vendor-locked settings)**: Jetnine already does exactly the
  proposal — admin-permissioned ops settings with audit.
- **Q6 (two affordances)**: single multi-select everywhere, already
  the house UI style.
- **Q8 (drop-off returns)**: Jetnine returns complete at entry, so the
  deferral exception is the norm — the rule collapses as the pack
  predicted.
- **Q10 (eBridge/pre-auth)**: Stripe; the WEB block is treated as a
  template, not a spec.

Genuinely yours to answer:

1. **Q5 — fiscal calendar**: 12 calendar months, 4-4-5, or 13 periods?
   (Presumed: calendar months. This unlocks period date codes across
   every report if we ever want them.)
2. **Q7 — tolerance scope**: confirm cash-only tolerance (cards/checks
   must reconcile exactly) — this is how the shipped variance already
   works.
3. **Q9 — retention**: Jetnine keeps everything forever. Fine, or does
   Accounting want receipt purge/retention windows anyway?
4. **Scope**: which §2 gaps to build? Recommended order if wanted:
   (a) blind-count + tolerance + retries + suspension + manager
   approval on shift close — the highest-value discipline gap;
   (b) balance-by-cashier drawers; (c) the rest only when a GL/AP
   exists. Say "a", "a+b", "all", or "none — current shifts suffice".

## 4. On answers

Each chosen piece ships as a vertical slice with `08-acceptance-
criteria.md`'s matching section ported first (Balancing §35–72 for the
blind-count slice), per house protocol.

## §5 Decisions received (owner, 2026-08-28)

- **Scope: (a) blind count + tolerance** — counted-first entry, cash-
  only $ tolerance, limited retries, suspension, manager approval on
  the existing per-location shifts. Per-cashier drawers not chosen.
- Q1 fiscal calendar / Q2 tolerance value / Q3 retention still open
  (tolerance $ amount needed from Accounting before build).
