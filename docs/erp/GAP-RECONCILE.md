# SOM pack — gap reconcile vs the shipped Jetnine sales stack

Authored 2026-08-27 per `00-HANDOFF.md`'s rules of engagement ("stop and
ask before implementing a [DECIDE]") and task #26's charter: reconcile
the 172-screen spec against what LA-Mattress-ERP has already shipped,
and batch the open-question register (#1–#58) to the owner. `29` wins
over `01`–`13` where they disagree; this file records where **shipped
Jetnine code** already answers, supersedes, or diverges from both.

## 1. The headline schema decision — quantity `decimal(12,4)`

The pack mandates decimal quantities because STORIS sells fractional
yards. Jetnine uses **integer quantities everywhere** (order lines,
sale lines, inventory, transfers, POs), and LA Mattress sells
mattresses, bases, and accessories — no fractional units.
**Recommendation: keep integers.** Converting every quantity column,
every money computation, and every test to `decimal(12,4)` buys nothing
for this catalog and adds rounding surface to money math. → Owner
question Q1 below; until answered, no schema change.

## 2. Shipped-stack map (module layer 01–13 → Jetnine)

| Pack phase/area | Jetnine state |
| --- | --- |
| Order entry (03, 21) | Shipped — POS sales + order writer (quote→open→…), address snapshot at write, marketing code, split salespeople (bps), fees, internal/customer notes |
| Line items (22) | Shipped — lineType (stock/special_order/custom/direct_ship), per-line fulfillment method + delivery date, serials (G7), kit-less catalog; **rooms, warranties-as-lines, COM: not modeled** |
| Pricing/discounts/tax (04, 24) | Shipped simpler by design — line + order discounts, bulk price editing, G6 three-tier price-variance exceptions, tax classes + per-location bps frozen per line. **The ten-stage coded-discount pipeline (29 §1) is deliberately not built** |
| Payments/deposits/cards (05, 23) | Shipped — Stripe tokenized (no PAN ever stored → `13` #3 and `31` #32 resolved), deposits with business-default percentage (`depositRequiredCents`), gift cards, split tender, refunds |
| Financing (06) | **Owner-locked: third-party only.** No in-house receivables → #1, #19, #22, #23 moot; #5c (provider set) remains |
| Settlement/cash (07) | Shipped — cash shifts with opening float (`13` #18 answered), closeout, over/short; Stripe settles per-payment so #8's blast radius is per-item by construction. Cash-balancing pack reconcile = task #27 |
| Salesperson/Up/CRM (08) | Commission plans shipped (rateBps × total/margin basis, split bps, D8 import exclusion). **Up system, traffic, closing ratio, loyalty: deferred** (owner's sales-views Phase 0 deferred leads/CRM) |
| Views/reporting (09) | Shipped — the task #22 report catalog + record pages; report builder = task #28 |
| Security (10) | Shipped — permission catalog, per-membership overrides (explicit beats role → `13` #12 as recommended), manager-credential security override (+audit) → #13 answered |
| Cutover (11) | Shipped — STORIS import + rehearsal suite, D8 imported-record exclusions; **customer merge tooling: not built** (#30/#31) |

Documented bypasses `31` #35–#44: **none exist in Jetnine** — they were
never built, which is the recommended "close it" outcome for all ten.
`31` #33 (settings explosion) is answered by process: the shipped
SET-007 registry is the required per-area decision record. `31` #45:
Jetnine delivery capacity already counts stops, pieces, and capacity
units explicitly — strictly better than the undocumented STORIS unit.

## 3. Open-question register triage (#1–#58)

**Already answered by shipped code or locked owner decisions (no ask):**
#3, #5 (in-house tax, engine optional later), #8, #9, #10, #12, #13,
#14, #15 (fast mode = POS sales), #18, #20/#21 (deferred with CRM),
#22, #23, #24 (Jetnine completes at event time), #25 (driver flow),
#26 (Jetnine enums are the canon), #32, #33, #34 (snapshot at write),
#35–#44 (never built), #45, #49, #50–#52 (Jetnine customer model has
none of these constructs), #53 (I1/I8 returns shipped with permission),
#55 (simpler adjustment model), #56 (**one** window shipped:
`returnWindowDays` + override), #57 (no customer price categories),
#58 (G6 tiers with defaults — blank never terminates a check).

**Moot under locked decisions:** #1, #19, #22, #23 (third-party
financing); #8 (Stripe); #16 → task #28; #11 → task #27.

**Genuinely for the owner — the batch (§4):** #2/#54, #4, #5b(+#46–48),
#5c, #6/#7, #17, #27, #28, #29, #30/#31, plus Q1 (quantities) and the
COM/rooms/loyalty scope call.

## 4. Owner batch — twelve questions

1. **Quantities**: confirm integer quantities stay (no `decimal(12,4)`)
   — see §1. Say "fractional" only if you truly sell fractional units.
2. **Commission values** (#2, #54): the engine is built (rate bps ×
   total or margin, splits, D8 exclusions). Need from management in
   writing: the actual plan rates per role/person, whether delivery
   fees and protection plans are commissionable, clawback timing on
   returns, and which date attributes a sale to a period (write date
   vs completion date — the two sources conflict, #54).
3. **Deposit policy** (#4): today one business-wide default deposit
   percentage seeds `depositRequiredCents`. Do you want per-fulfillment
   or per-category percentages, tax-inclusive or not, and who may
   waive below the minimum?
4. **Discount model parity** (#5b, #46–#48): Jetnine ships manual line
   + order discounts with variance exceptions instead of STORIS'
   ten-stage coded pipeline. Keep the simple model, or build coded
   discount types (named codes with rules/stacking)? If coded: we
   design the stacking order ourselves — STORIS never published it.
5. **Financing providers** (#5c, #19): which third-party providers
   (Synchrony? Acima? Progressive?), integrated how (direct API,
   aggregator, or record-only "paid by financing" tender), and is
   there a decline cascade worth modeling?
6. **Order-type & hold canon** (#6, #7): Jetnine's canon is
   quote/open/…/completed × sales_order/layaway × fulfillment types,
   with balance-based completion gates and manager overrides — no
   credit-hold codes. Confirm, or name the hold codes you want.
7. **Cutover shape** (#17): single-store pilot or all-stores cutover?
   (Inventory is shared through the warehouse — a pilot still needs
   shared stock truth.)
8. **Completion notes classification** (#27): model the nine-value
   completion classification (Service, Kit Master, Labor, …) on lines,
   or skip — Jetnine's lineType + service module covers the flows we
   ship today.
9. **Web-order pending deposits** (#28): do e-commerce orders
   (Shopify) need an auth-then-capture "pending deposit" state, or is
   paid-at-checkout the only web flow?
10. **Configured/special-order pricing** (#29): for special orders, is
    base price + manual price entry enough (today's flow), or do you
    need option-driven price/description composition (configurator)?
11. **Customer merge** (#30, #31): cutover dedupe currently happens at
    import. Build in-app merge tooling (with the pack's seven
    safeguards: snapshot, merge event, aliases, dry-run…) or keep
    dedupe an import-time concern?
12. **COM / rooms / loyalty scope**: customer-own-merchandise lines,
    room grouping on orders, and a loyalty program are the three
    remaining SOM constructs with no Jetnine equivalent. Build any?
    Default: skip until asked for.

## 5. Build order once §4 lands

1. Anything the answers unlock that is money-adjacent first
   (commission values #2 are config, not code; discount codes #4 and
   deposit policy #3 are real slices with `30`'s tests ported first).
2. Customer merge tooling (#11) before the next real-data dedupe run
   if chosen.
3. Scope adds (#8–#12) as separate vertical slices.

Screen-by-screen parity for the remaining 172-screen surface is **not**
a goal: Jetnine replaces screens, not reproduces them (`PARITY-NOTES.md`
already records this stance). `30`'s 131 tests are adopted selectively —
each shipped slice ports the section that governs it, as house protocol.
