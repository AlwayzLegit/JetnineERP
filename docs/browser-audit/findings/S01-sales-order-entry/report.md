# S01 — Sales Order Entry

- **Session:** S01
- **Date:** 2026-08-31 (UTC), run 09:35–09:55 UTC
- **Target:** `https://lamattress-erp.vercel.app`
- **Login:** test owner, already authenticated; `GET /v1/auth/me → 200`
- **Viewport:** **measured CSS viewport 1534×881, devicePixelRatio 1.** The protocol asks for 1440×900 with a confirmation pass at 1280×800. The window-resize call reported success but the browser window stayed at 1920×1032 outer / 1534×881 CSS on both attempts, so neither target width was actually achieved. Every observation in this session was made at 1534×881 — wider than specified. That direction matters: the density and overflow findings (BA-0012, BA-0023) would be worse at 1440×900, not better. **The 1280×800 pass is outstanding and should be rerun on a browser where the viewport can be set.**
- **Build identifier:** none visible anywhere in the UI — no version string in the top bar, footer, or settings reachable from this module. Noted as a gap for the audit itself: findings cannot be pinned to a build.
- **Finding ID block reserved:** BA-0001 – BA-0050. Used: BA-0001 – BA-0041.
- **Perspective:** fresh eyes, per `01-SCOPE-AND-RULES.md`. No parity documents were read.

---

## Summary

41 findings: **2 S1, 19 S2, 18 S3, 2 S4**.

The arithmetic in this module is sound. Every total I checked agreed with itself — line extensions, tax on a discounted base, fees added to the total, the discount clamp that floors an over-large discount at merchandise, and the totals on the printed invoice all reconcile to the cent. That is the hardest part of an order-entry screen and it is right, which makes it worth saying before the rest.

What is not right is everything around the money. The two S1s are both about work and value disappearing without a word: an in-progress sale is discarded on any navigation away from the screen (BA-0001), and an amount typed into the payment box is dropped when the order completes, posting it as unpaid (BA-0002). Neither shows a warning. A third finding sits close behind them: the Complete button moves 43px up the rail when the payment method changes, into the space a cursor aimed at "Add payment" occupies (BA-0003) — I hit that one by accident and posted a real order with it.

The keyboard speed test — the checklist calls it the single highest-value measurement — cannot be completed at all. Product rows in the Add Product modal are plain table rows with no tabindex, no role and no control inside, so there is no way to select a line item without a mouse (BA-0010). Order entry fails at its first step.

Design-wise the module has good bones and inconsistent execution. Two lists in the same module use different row heights, different search interactions and different row-open conventions (BA-0033). The line-item grid overflows horizontally at 1440×900, so a line's description and its amount are never visible at the same time (BA-0012).

One thing the app does notably well: attaching a customer who already has an open order raises a banner — "This customer already has an open order: SO-2026-000051 (2026-09-15) — consider one truck: add to the existing order or match its delivery date." That is real domain knowledge in the interface, and it is the kind of thing the rest of the module should be measured against.

---

## Batch summaries

### Batch 1 — Order entry path (5 screens)

New Sale, inline New customer form, customer search results, Add Product modal, sale-complete confirmation.

- Screens covered: 5 of 12 mapped
- Findings raised: 2 S1 (BA-0001, BA-0002), 13 S2, 7 S3, 1 S4
- Blocked by: nothing
- Notes: this is where the session's weight sits. The customer form, the line grid and the payments rail each produced multiple independent defects. Console was clean throughout.

### Batch 2 — Lists, detail and documents (7 screens)

Orders list, order detail, order-not-found, print invoice, print delivery ticket, print pick list, Sales list.

- Screens covered: 7 of 12 mapped
- Findings raised: 6 S2, 11 S3, 1 S4
- Blocked by: nothing
- Notes: the printed documents are structurally sound — real print stylesheets, chrome correctly hidden, totals matching the screen — but several header fields map to the wrong value (BA-0013, BA-0014, BA-0030). The orders grid cannot be sorted at all (BA-0018).

---

## Flows

### Quote → order → deposit → settled → invoiced

Run twice, end to end.

**Run 1 (SO-2026-000050 → SO-2026-000051).** Created a customer, added a line, set fees and a delivery date, saved as a draft, reopened the draft, added a cash amount, completed. The draft round-tripped perfectly: customer, quantity, price, delivery date and notes all restored, total unchanged at $2,853.48. Three things went wrong at the end. Completing the draft cancelled it and issued a new order number, leaving SO-2026-000050 behind as a cancelled order carrying a $2,853.48 balance (BA-0038, BA-0016). The $500 typed into the payment box never became a payment (BA-0002). And the click that completed the order had been aimed at "Add payment" — the button had moved under the cursor when the payment method changed (BA-0003).

**Run 2 (SO-2026-000052).** Same customer, one line at $1,000.00, plus a recycling fee, installation $50 and delivery $89. Added a cash payment properly this time, then completed. Everything reconciled: Total $1,254.50 on the entry screen, on the order detail, and on the printed invoice; payment recorded and shown on the document. The one disagreement is the subtotal label — "Merchandise" is $1,000.00 on the entry screen and $1,018.00 on the invoice, because the recycling fee is broken out in one place and folded in at the other (BA-0015).

**Values carried forward correctly** through draft save, draft reload, completion, order detail and all three printed documents — with two exceptions: the stock warning on a line disappears when a draft is reopened (BA-0021), and the ZIP code is dropped from every printed address although it is stored on the customer (BA-0014).

**Cost of the flow.** Run 2, mouse-driven, took 14 clicks and 31 keystrokes from an empty New Sale to a completed, paid order. That is not unreasonable. The problem is not the count but that none of it can be done from the keyboard.

### Order with a special-order line

Covered incidentally — every product in the catalogue is out of stock at every location, so all three orders created in this session were special-order lines. The warning behaviour is covered in BA-0021.

### Protection plan, financing tender, exchange, return, void

Not run. Protection plans have no visible entry point in this module. Financing tenders exist as payment methods (Synchrony, Acima) but exercising them risks a gateway call, which `01-SCOPE-AND-RULES.md` puts out of bounds without a confirmed test configuration — filed as **BLOCKED-BY-SAFETY**. Exchanges, returns and voids belong to S03 and S04.

---

## Keyboard speed test

**Result: cannot be completed.**

From a fresh New Sale the first six tab stops are the draft chips and their dismiss buttons; the customer field is the seventh (BA-0036). Reaching "Add Product" takes 12 stops. Enter opens the modal and focus moves correctly into the search box — then it stops. The result rows carry no tabindex, no role and no button or link, and there is no arrow-key handler, so no product can be selected (BA-0010). Tabbing past the results leaves the modal entirely; the modal has no dialog role, does not trap focus and does not close on Escape (BA-0011).

The failure is at the first line item, which means the measurement cannot even reach the interesting parts — tab order through pricing, tender and completion. Fixing P-008 would make the rest of this test possible next session.

---

## Printing

| Document                                                 | Renders                                                  | Totals match screen                                                                 | Notes                                                                                                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invoice                                                  | Yes, single page, no blank first page                    | Yes — $1,018.00 / $50.00 / $89.00 / $97.50 / $1,254.50 / paid $1,254.50 / due $0.00 | Salesperson prints as "A" (BA-0013); no ZIP (BA-0014); CUSTOMER # is a UUID fragment (BA-0030); merchandise subtotal disagrees with the entry screen (BA-0015); payment method lowercase (BA-0041) |
| Delivery ticket                                          | Yes                                                      | n/a — no money on this document                                                     | No ZIP (BA-0014); lists the recycling fee as an item to load (BA-0028); no barcode (BA-0029); warns that printing locks the order — not exercised, to avoid locking a record                       |
| Pick list                                                | Yes                                                      | n/a                                                                                 | Correctly excludes the fee line; Bin column is `—`; no barcode (BA-0029)                                                                                                                           |
| Order acknowledgment, count sheet, transfer manifest, PO | Not reachable from this module — belong to S07, S08, S15 |

Print stylesheets are real and correct: `@media print` hides the sidebar, top bar and the print toolbar, and strips card shadows. **No UI chrome bleeds into print output.** Multi-page pagination and repeated headers could not be tested — no order in this module has enough lines. Worth revisiting in S15 with a long order.

PDFs were not saved into `shots/`: this session ran against a hosted browser with no writable local path, so print output is captured as page text and screenshots in-session rather than as files.

---

## Permissions

Session ran as the test owner only.

- No permission-gated control was visibly disabled or hidden anywhere in this module — every action on every screen was available.
- The left nav exposes `Roles`, `Members`, `Audit log`, `Nightly jobs` and `Settings` with no indication they are restricted, so there was nothing the nav suggested was off-limits to then attempt by URL. The URL-reachability check has nothing to bite on until a non-owner role exists.
- **Needs a second pass once non-owner roles are available:** New Sale (price override on a line, order discount, salesperson reassignment, second salesperson split), order detail (Cancel order, Release reserved stock, Start layaway plan), and the printed documents.

---

## Errors collected

Console: **clean.** No errors, warnings or exceptions were captured on any screen across the session, including during order completion and document rendering. That is worth stating plainly — it is unusual.

Network:

| Time (UTC)  | Screen   | Action                      | Result                                                                                                    |
| ----------- | -------- | --------------------------- | --------------------------------------------------------------------------------------------------------- |
| 09:38       | New Sale | Create customer, empty form | `POST /v1/customers → 400` — expected, but reached the server for a case the client could catch (BA-0008) |
| 09:37–09:55 | All      | Page load                   | 5–6 × `503` per page view, always on `_rsc` link prefetches and `HEAD` requests (BA-0032)                 |
| 09:35       | Orders   | Page load                   | `GET /.well-known/vercel/jwe → 503`                                                                       |
| throughout  | All      | All `/v1/…` data calls      | `200`/`201` without exception                                                                             |

---

## Records Created — cleanup manifest

| Type        | Identifier                                                    | Current state                                   | Notes                                                                     |
| ----------- | ------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| Customer    | `ZZTEST Audit S01 1` — `9d058b82-4a7a-41fc-aaee-f51d7df40f99` | Active                                          | 555-0100 · audit+S01@example.invalid · 1 Audit Way, Testville, CA 90000   |
| Sales order | `SO-2026-000050`                                              | **Cancelled**, balance due $2,853.48            | Created as a draft, auto-cancelled when the draft was completed (BA-0038) |
| Sales order | `SO-2026-000051`                                              | **Open / Pending**, $2,853.48, unpaid           | Created by an accidental click on Complete (BA-0003)                      |
| Sales order | `SO-2026-000052`                                              | **Open / Pending**, $1,254.50, **paid in full** | Carries a recorded **cash payment of $1,254.50**                          |

Four records, well under the 25-record stop condition.

**Two things need the owner's attention before this is tidied up.**

First, SO-2026-000052 carries a recorded cash payment of $1,254.50 that never physically existed. Whatever this environment feeds — cash drawer, daily balancing, GL — has that $1,254.50 in it. It was the minimum needed to test that tender flows through to the invoice, and the invoice was where two real findings came from, but it should be reversed rather than left.

Second, SO-2026-000050 is a cancelled order showing $2,853.48 due. Two pre-existing cancelled orders behave the same way (BA-0016), so this is not an artefact of the audit — but the test record adds to it.

Cleanup was not attempted: voiding or reversing these touches the settlement paths that belong to S03, and doing it blind would destroy the evidence behind BA-0002, BA-0016 and BA-0038 before anyone has read them.

---

## Coverage

- **Screens mapped:** 12
- **Screens tested:** 12
- **Screens skipped:** 4, each with a stated reason in `screens.md` — register/shift session (S12), exchanges (S04), delivery scheduling (S05, and the app states it is unbuilt), layaway plan (S03, avoids a second money-bearing artefact)
- **Checklist areas not covered:** export (the orders grid has no export control to test); multi-page print pagination (no order long enough); role-based permissions (owner role only); protection plans and financing tender (no entry point / blocked by safety); **the 1280×800 layout pass, and strictly the 1440×900 pass too — the viewport could not be set (see header)**

## Verification pass

Every S1 and S2 finding was re-run before the session closed. Reproduction counts in `findings.md` are literal.

- **BA-0001** re-run from a fresh sale at the end of the session — 3/3.
- **BA-0006** re-run by keyboard entry — 2/2.
- **BA-0002** remains **1/1** and is recorded as such. Re-running it would mean completing a fourth order and recording a fourth phantom payment; the evidence already on file (order detail reading "No money taken yet.", and `balanceDueCents: 285348` from the API) is strong enough that a second money-bearing artefact was not worth creating. Worth confirming in S03, where settlement is in scope anyway.
- **BA-0015, BA-0021, BA-0026, BA-0027, BA-0028, BA-0029, BA-0037, BA-0038** are each 1/1, all marked as such. None is flaky — each was a single deterministic observation that would have required creating another order to repeat.
- Nothing observed in this session failed to reproduce on a second attempt.

**One near-miss worth recording.** During verification I set a line's quantity and price by writing directly to the DOM rather than typing. The inputs displayed 999999 and 1299.99 while the totals panel stayed at $0.00 — which looks exactly like a serious calculation bug. It is not: the app never received the events a real keystroke produces. Retyping the same values by keyboard produced the correct $1,426,737,598.26. **No finding was filed from it.** Recording it here because a future session running the same shortcut will see the same thing and could file it in good faith.

---

## Design Direction

Three changes that would most raise the perceived quality of this module.

**1. Density and table consistency.** Worst example: the orders list at 1440×900 — 59px rows, no sticky header, about 11 rows above the fold, header labels gone by row 12. The Sales list in the same module gets 41px rows out of the same 13px type, so the height is a choice rather than a constraint. The rubric's one deliberate deviation from Shopify is exactly this: adopt the structure, not the row height. Bringing Orders to the Sales list's density, making the header sticky, and settling on one search interaction and one row-open convention across both lists is the single highest-leverage visual change here. (P-018)

**2. A stable, legible right rail.** Worst example: the Payments panel, where the Complete button sits at y 679 with a credit card selected, y 636 with cash, and moves again when an error appears — and where an error belonging to the customer form 500px away renders directly above it. The rail currently mixes a totals readout, two editable fee inputs, a discount input, a payment composer, a shared error slot and the irreversible primary action, all in one column that reflows. Reserving space so nothing moves, giving each card its own error region, and separating Complete from the payment controls would fix a genuine money-handling risk and make the rail readable at the same time. (P-003, P-006)

**3. A line grid that fits.** Worst example: the Items grid on New Sale, where the AMOUNT column and the row's remove control are clipped off the right edge, and scrolling to reach them pushes the item description out of view — so a salesperson can never see what a line is and what it costs at the same time, on the screen where that check matters most. The same grid, with the same clipping, is on the order detail page. Moving FULFILLMENT and INVENTORY FROM into a per-row expander would leave room for everything that has to be visible at once. (P-009)

---

## Impressions

No evidence attached to these — they belong here rather than in `findings.md`.

- The one-truck banner is the best thing in the module. It suggests someone who understands the business wrote it. More of that, and less of "arrive with the Day 3 build".
- The three-numbered-step layout on New Sale reads well and the "Drafts:" strip is a good idea, but the strip's placement above the customer card gives prime screen real estate and the first six tab stops to something used occasionally.
- "Order type" offers Sales order / Layaway / Sales quote while the left nav has a separate Sales section and the status filter offers "Quotes" — there seem to be at least two mental models of what a quote is. Worth untangling in S17.
- The catalogue is full of records that look like test data — a salesperson named "Armaaaaaa" owning eight orders, customers called "QA Caller", "Maria Testerson", "john jonh". If this environment is meant to stand in for production, that noise makes it harder to judge which oddities are defects.
