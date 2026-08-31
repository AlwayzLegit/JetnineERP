# S01 — Findings

ID block reserved: **BA-0001 – BA-0050**. Used: BA-0001 – BA-0041.

---

## S1 — Data loss, wrong money, or a flow that cannot complete

### BA-0001 — In-progress sale is discarded, without warning, on any navigation away from New Sale

- **Session:** S01
- **Severity:** S1
- **Category:** FLOW
- **Screen:** New Sale
- **URL:** `/pos`
- **Steps:**
  1. Log in as test owner
  2. New Sale
  3. Attach customer `ZZTEST Audit S01 1`
  4. Add Product → search `queen` → `10" QUEEN MATTRESS`; set price 1299.99, qty 2
  5. Set Installation 50, Delivery 89, delivery date 09/15/2026
  6. Click **Orders** in the left nav
  7. Click **New Sale** in the left nav
- **Observed:** No confirmation prompt at step 6. At step 7 the screen is blank: no customer, no line, no fees, no date. Every value entered is gone. The server-side "Drafts:" chips are unaffected, so the app has a draft concept but does not autosave into it.
- **Expected:** Either an unsaved-changes prompt, or the in-progress sale is restored when the user returns.
- **Evidence:** Screenshot of the populated sale (Total $2,992.48) followed by the empty New Sale screen after the round trip. No network request fires between the two — nothing was persisted. Re-verified at the end of the session with a fresh sale: after Orders → New Sale, `{"hasCustomer":false,"hasLine":false,"emptyItems":true,"total":"$0.00"}`.
- **Reproduced:** 3/3
- **Impact:** A salesperson mid-quote with a customer at the desk loses the entire order by clicking one nav item. In a store this is the difference between closing the sale and re-keying it while the customer waits.
- **Proposed fix:** `proposals.md` → P-001
- **Confidence:** High

### BA-0002 — An amount typed in the payment box is silently discarded on Complete; the order posts as unpaid

- **Session:** S01
- **Severity:** S1
- **Category:** DATA
- **Screen:** New Sale — Payments
- **URL:** `/pos`
- **Steps:**
  1. Build a sale for `ZZTEST Audit S01 1`, one line, total $2,853.48
  2. Payments → set method to `Cash`
  3. Type `500` in the amount field
  4. Click **Complete**
- **Observed:** Order SO-2026-000051 created. Its detail page reads "No money taken yet." — Paid $0.00, Balance due $2,853.48. The $500 never became a payment and no warning was shown.
- **Expected:** Either Complete captures a typed-but-not-added amount, or it refuses to complete while an unapplied amount sits in the box and says so.
- **Evidence:** Order detail SO-2026-000051 — Money panel Paid $0.00 / Balance due $2,853.48; `GET /v1/orders/77d1e984-…` returns `balanceDueCents: 285348`.
- **Reproduced:** 1/1 (see BA-0003 — the same click sequence is also how the button moves under the cursor)
- **Impact:** A cashier types the cash amount, hits Complete, and the order posts unpaid while the drawer holds the money. The discrepancy surfaces at end-of-day balancing, not at the counter.
- **Proposed fix:** `proposals.md` → P-002
- **Confidence:** High

---

## S2 — Flow completes but the user is misled or blocked in a common case

### BA-0003 — The Complete button moves up 43px when the payment method changes, into the space a cursor aimed at "Add payment" occupies

- **Session:** S01
- **Severity:** S2
- **Category:** FLOW
- **Screen:** New Sale — Payments / right rail
- **URL:** `/pos`
- **Steps:**
  1. New Sale, attach a customer, add one line
  2. Note button positions with method `Credit card`
  3. Change method to `Cash`
  4. Note button positions again
- **Observed:** With `Credit card` the reference field is present: Add payment top = y 622, Complete top = y 679. With `Cash` the reference field is removed: Add payment top = y 579, Complete top = y 636. Complete's new hit area (636–672) overlaps Add payment's former hit area (622–658) by 22px. A separate error message rendering in the same rail shifts Complete a further ~27px. During this session a click intended for **Add payment** landed on **Complete** and posted an order.
- **Expected:** The primary irreversible action holds a stable position, or is separated from the payment controls, or asks for confirmation.
- **Evidence:** Measured in the live DOM — `{"creditCard":[{"t":"Add payment","y":622},{"t":"Complete $0.00","y":679}],"cash":[{"t":"Add payment","y":579},{"t":"Complete $0.00","y":636}]}`
- **Reproduced:** 2/2 (measured), 1/1 (hit accidentally)
- **Impact:** Completing an order is irreversible from this screen and takes no confirmation. A mis-click posts a sale.
- **Proposed fix:** `proposals.md` → P-003
- **Confidence:** High

### BA-0004 — Setting a line quantity to 0 or a negative number silently deletes the line

- **Session:** S01
- **Severity:** S2
- **Category:** FUNC
- **Screen:** New Sale — Items
- **URL:** `/pos`
- **Steps:**
  1. Add any product to a sale
  2. Select the QTY field, type `0`, press Tab
  3. Repeat with `-3`
- **Observed:** In both cases the line vanishes and the card returns to "No items yet — Add Product to start." No confirmation, no toast, no undo. The QTY input carries `min="0"`, so `-3` resolves to 0 and 0 removes the row.
- **Expected:** Reject the value and keep the line, or ask before removing it. Deletion should not be the silent result of a typo in a numeric field.
- **Evidence:** Screenshots before/after each entry; `input[type=number]` for QTY has `min: "0"`, no `max`.
- **Reproduced:** 2/2
- **Impact:** A fat-fingered quantity destroys a line and its price override with no way back.
- **Proposed fix:** `proposals.md` → P-004
- **Confidence:** High

### BA-0005 — Delivery date accepts dates in the past and reports delivery capacity for them

- **Session:** S01
- **Severity:** S2
- **Category:** FUNC
- **Screen:** New Sale — Order details
- **URL:** `/pos`
- **Steps:**
  1. Start a sale with fulfillment `Delivery`
  2. Click the Delivery date field and type `01/15/2020`
- **Observed:** Accepted without error. The helper line beneath reads **"15 of 15 stops left that day"** — the capacity check answers for a date six years past. The input has no `min` or `max` attribute.
- **Expected:** Reject a delivery date before today, or at minimum flag it.
- **Evidence:** Screenshot of `01/15/2020` with the capacity line; `input[type=date]` → `{"value":"2020-01-15","min":null,"max":null,"required":false}`
- **Reproduced:** 2/2
- **Impact:** Orders enter the delivery queue with unreachable dates and appear as permanently past due.
- **Proposed fix:** `proposals.md` → P-005
- **Confidence:** High

### BA-0006 — Line quantity has no upper bound; a single typo produces a $1.4 billion order

- **Session:** S01
- **Severity:** S2
- **Category:** FUNC
- **Screen:** New Sale — Items
- **URL:** `/pos`
- **Steps:**
  1. Add `10" QUEEN MATTRESS`, price 1299.99
  2. Set QTY to `999999`
- **Observed:** Accepted with no warning. Merchandise $1,299,988,700.01, Tax $126,748,898.25, Total **$1,426,737,598.26**, and the Complete button relabels to "Complete $1,426,737,598.26" and stays enabled. Available stock for this item is 0. Arithmetic throughout is correct — the problem is that nothing questions the input.
- **Expected:** A sane ceiling, or a confirmation above some threshold.
- **Evidence:** Screenshot of the totals panel at $1,426,737,598.26; QTY input has `min: "0"` and no `max`.
- **Reproduced:** 2/2
- **Impact:** No guard between a slipped keystroke and a completed order with an absurd value, its tax accrual, and its commission.
- **Proposed fix:** `proposals.md` → P-004
- **Confidence:** High

### BA-0007 — Validation errors from the customer form render in the right rail, roughly 500px from the field that caused them

- **Session:** S01
- **Severity:** S2
- **Category:** ERROR
- **Screen:** New Sale — Customer / right rail
- **URL:** `/pos`
- **Steps:**
  1. New Sale → "+ New customer"
  2. Leave every field empty
  3. Click **Create**
- **Observed:** The error appears in the right rail, below the Payments card and directly above the Complete button — about 500px right and 270px down from the Create button. The Customer card shows no indication anything failed, and no individual field is marked. The same rail slot is reused for the Complete-button guard ("Attach a customer first."), so one error region serves three unrelated cards.
- **Expected:** Error text below the field or at the top of the card that owns the form.
- **Evidence:** Full-page screenshot showing the empty customer form and the red text under Payments.
- **Reproduced:** 2/2
- **Impact:** The user's eye is on the Create button; the explanation is on the other side of the screen.
- **Proposed fix:** `proposals.md` → P-006
- **Confidence:** High

### BA-0008 — Validation copy exposes internal API field names

- **Session:** S01
- **Severity:** S2
- **Category:** COPY
- **Screen:** New Sale — Customer
- **URL:** `/pos`
- **Steps:** As BA-0007
- **Observed:** "At least one of firstName, lastName, email, or phone is required" — camelCase identifiers shown verbatim to a salesperson. The message is also server-supplied: an empty form round-trips to `POST /v1/customers` and comes back 400 rather than being caught client-side, even though this screen does perform client-side validation elsewhere ("Attach a customer first." fires with no network call).
- **Expected:** "Enter at least a name, phone, or email." Validated before the request.
- **Evidence:** Zoomed screenshot of the message; `POST /v1/customers → 400`.
- **Reproduced:** 2/2
- **Impact:** Reads as a system fault rather than a correctable mistake.
- **Proposed fix:** `proposals.md` → P-006
- **Confidence:** High

### BA-0009 — 15 of 28 inputs on the order-entry screen have no programmatic label

- **Session:** S01
- **Severity:** S2
- **Category:** A11Y
- **Screen:** New Sale (all cards)
- **URL:** `/pos`
- **Steps:** Open New Sale with the customer form expanded and enumerate every `input`/`select`/`textarea`.
- **Observed:** 28 form controls; 15 have no `<label for>`, no wrapping label, and no `aria-label` — they are identified by placeholder text only: customer search, First name, Last name, Phone, 2nd phone, Email, Delivery address, Apt / unit, City, State, ZIP, "How did they hear about us?", the payment-method select, the payment amount, and the reference field. Placeholders disappear on input, so the field's identity is gone the moment it is filled.
- **Expected:** Every control has a persistent visible label above it and a programmatic name.
- **Evidence:** DOM audit — `{"total":28,"unlabeledCount":15,"unlabeled":["Search name, phone, email, or address…","First name","Last name","Phone","2nd phone (optional)","Email","Delivery address","Apt / unit","City","State","ZIP","How did they hear about us?","select-one","0.00","Reference / last 4 / approval #"]}`
- **Reproduced:** 2/2
- **Impact:** Unusable with a screen reader; also the reason a filled-in form gives no clue which box is which.
- **Proposed fix:** `proposals.md` → P-007
- **Confidence:** High

### BA-0010 — Product rows cannot be reached or activated by keyboard; a two-line order cannot be entered without a mouse

- **Session:** S01
- **Severity:** S2
- **Category:** A11Y
- **Screen:** Add Product modal
- **URL:** `/pos`
- **Steps:**
  1. From a fresh New Sale, press Tab until **Add Product** has focus (12 stops), press Enter
  2. Type `queen`
  3. Press Tab repeatedly and attempt to select a result with Enter or the arrow keys
- **Observed:** Focus moves correctly into the search box when the modal opens. The result rows are plain `<tr>` elements with no `tabindex`, no `role`, and no button or link inside — `[{"tab":null,"role":null,"hasBtn":false}, …]`. There is no way to put focus on a product, and no arrow-key handler. Tabbing past the results leaves the modal entirely.
- **Expected:** Arrow keys move through results, Enter adds the highlighted product.
- **Evidence:** DOM inspection above; tab traversal ends on `BODY`.
- **Reproduced:** 2/2
- **Impact:** **This is the answer to the keyboard speed test: order entry is impossible without a mouse, and it fails at the first line item.** For someone who lives in this screen eight hours a day, every line costs a reach for the mouse.
- **Proposed fix:** `proposals.md` → P-008
- **Confidence:** High

### BA-0011 — Add Product modal has no dialog role, does not trap focus, and does not close on Escape

- **Session:** S01
- **Severity:** S2
- **Category:** A11Y
- **Screen:** Add Product modal
- **URL:** `/pos`
- **Steps:**
  1. Open Add Product
  2. Press Tab about seven times
  3. Press Escape
- **Observed:** No element carries `role="dialog"`. After ~7 tabs focus is on `BODY` and continues into the page behind the overlay. Escape leaves the modal open; it can only be dismissed with the ✕ or by clicking outside.
- **Expected:** `role="dialog"` with `aria-modal`, focus cycling inside the modal, Escape closes and returns focus to Add Product.
- **Evidence:** `{"dialogRole":false}`; focused element after tabbing = `BODY`; screenshot showing the modal still open after Escape.
- **Reproduced:** 2/2
- **Impact:** Keyboard and screen-reader users end up interacting with content they cannot see.
- **Proposed fix:** `proposals.md` → P-008
- **Confidence:** High

### BA-0012 — The line-item grid overflows horizontally at 1440×900; the item name and its line total cannot be seen at the same time

- **Session:** S01
- **Severity:** S2
- **Category:** DESIGN
- **Screen:** New Sale — Items; Order detail — Lines
- **URL:** `/pos`, `/orders/<id>`
- **Steps:**
  1. Add a line to a sale (measured viewport 1534×881)
  2. Look for the AMOUNT column and the row's remove control
  3. Scroll the grid right
- **Observed:** The grid has its own horizontal scrollbar. In the default position AMOUNT is clipped at the card edge (header reads "AM…") and the remove ✕ is not visible. Scrolling right reveals AMOUNT and ✕ but pushes ITEM out of view, so the row reads "…MATTRESS". The same grid and the same clipping appear on the order detail page. Measured at a CSS viewport of 1534×881 — wider than the 1440×900 the protocol specifies, so the clipping is at least this bad at the target width. The 1280×800 confirmation could not be run (see report header).
- **Expected:** Item and amount both visible; if columns must be dropped, drop FULFILLMENT or INVENTORY FROM into an expander rather than the line total.
- **Evidence:** Paired screenshots at both scroll positions on `/pos` and on `/orders/764d6a8d-…`.
- **Reproduced:** 3/3
- **Impact:** The salesperson cannot verify a line's price against its description in one glance, on the screen where that check matters most.
- **Proposed fix:** `proposals.md` → P-009
- **Confidence:** High

### BA-0013 — The printed invoice shows the salesperson as a single letter

- **Session:** S01
- **Severity:** S2
- **Category:** PRINT
- **Screen:** Print — Invoice
- **URL:** `/print/orders/<id>/invoice`
- **Steps:** Complete an order with salesperson "Me (signed in)" (resolves to Arman) → Order detail → Invoice
- **Observed:** The SALESPERSON cell reads `A`. The orders list and the order record both carry `salespersonName: "Arman"`.
- **Expected:** The salesperson's name, or a deliberate and documented initial/code.
- **Evidence:** Invoice text for SO-2026-000051 and SO-2026-000052: `555-0100 | Balance due | A | 9D058B82 | Glendale Store`; API `"salespersonName": "Arman"`.
- **Reproduced:** 2/2
- **Impact:** The customer-facing document cannot identify who sold the order — the first thing anyone looks for on a commission dispute or a follow-up call.
- **Proposed fix:** `proposals.md` → P-010
- **Confidence:** High

### BA-0014 — The ZIP code is stored on the customer but omitted from every printed address

- **Session:** S01
- **Severity:** S2
- **Category:** PRINT
- **Screen:** Print — Invoice; Print — Delivery ticket
- **URL:** `/print/orders/<id>/invoice`, `/print/orders/<id>/delivery-ticket`
- **Steps:**
  1. Create a customer with address `1 Audit Way, Testville, CA 90000`
  2. Complete an order and open the Invoice, then the Delivery ticket
- **Observed:** Both documents render the address as `1 Audit Way / Testville, CA` — no ZIP. The record has it: `"addressesJson":[{"city":"Testville","line1":"1 Audit Way","region":"CA","postalCode":"90000"}]`.
- **Expected:** City, state and ZIP on one line.
- **Evidence:** Invoice and delivery-ticket text for SO-2026-000052; customer API payload above.
- **Reproduced:** 3/3 (invoice ×2, delivery ticket ×1)
- **Impact:** A delivery ticket handed to a driver has no postal code. Anything routed, mailed, or geocoded from these documents is missing the field that makes it routable.
- **Proposed fix:** `proposals.md` → P-010
- **Confidence:** High

### BA-0015 — "Merchandise" means one number on the entry screen and a different number on the invoice

- **Session:** S01
- **Severity:** S2
- **Category:** DATA
- **Screen:** New Sale — Totals vs Print — Invoice
- **URL:** `/pos`, `/print/orders/<id>/invoice`
- **Steps:**
  1. Sale for `ZZTEST Audit S01 1`: one line at $1,000.00, plus "+ Recycling ($18.00)"
  2. Installation 50, Delivery 89
  3. Read the Totals panel, then complete and open the invoice
- **Observed:** Entry screen — Merchandise **$1,000.00**, Recycling $18.00, Installation $50.00, Delivery $89.00, Tax $97.50, Total $1,254.50. Invoice — Merchandise **$1,018.00**, Installation $50.00, Delivery $89.00, Tax $97.50, Total $1,254.50. The recycling fee is a separate labelled line on screen and is folded into Merchandise on the document, with no Recycling line to explain the change. Both totals are correct and agree; only the subtotal labelled "Merchandise" disagrees with itself.
- **Expected:** One definition of Merchandise across screen, document and report, with the recycling fee broken out in both places or neither.
- **Evidence:** Totals panel screenshot vs invoice text for SO-2026-000052.
- **Reproduced:** 1/1
- **Impact:** A customer comparing the quoted breakdown to the invoice sees the merchandise subtotal change by $18 with nothing to account for it.
- **Proposed fix:** `proposals.md` → P-011
- **Confidence:** High

### BA-0016 — Cancelled orders keep a non-zero Balance Due

- **Session:** S01
- **Severity:** S2
- **Category:** DATA
- **Screen:** Orders list
- **URL:** `/orders`
- **Steps:**
  1. Orders → status filter → `Cancelled`
- **Observed:** All three cancelled orders show money owed: SO-2026-000050 **$2,853.48**, SO-2026-000038 **$10.98**, SO-2026-000037 **$10.98**. Two of these pre-date this session, so the behaviour is not specific to records created here. API confirms `displayStatus: "Cancelled"` with `balanceDueCents: 285348`.
- **Expected:** A cancelled order carries no balance, or the column reads `—` for cancelled rows.
- **Evidence:** Filtered orders-list screenshot; `/v1/orders/list-view` payload for SO-2026-000050.
- **Reproduced:** 2/2
- **Impact:** Cancelled orders look like receivables. Anything that sums Balance Due — aging, collections, a salesperson's own list — is overstated.
- **Proposed fix:** `proposals.md` → P-012
- **Confidence:** High — the numbers are visible on screen. What "correct" looks like in the ledger is a product decision.

### BA-0017 — The same order has three different status words depending on where you look

- **Session:** S01
- **Severity:** S2
- **Category:** COPY
- **Screen:** Orders list, Order detail, status filter
- **URL:** `/orders`, `/orders/<id>`
- **Steps:**
  1. Complete an order
  2. Read its badge in the orders list, then open it and read the badge beside the order number, then open the status filter
- **Observed:** SO-2026-000052 — list badge **Pending**, detail badge **Open**. The status filter offers _Drafts, Quotes, Open, Partially fulfilled, Fulfilled, Completed, Cancelled_; the badges in use across the list are _Pending, Scheduled, Delivered, Reserved, Draft, Returned, Cancelled, On PO_. Only "Draft" and "Cancelled" appear in both vocabularies.
- **Expected:** One status vocabulary across list, detail and filter.
- **Evidence:** Detail page main text — `SO-2026-000052 || Open || …`; list API — `"displayStatus": "Pending"`; filter option list.
- **Reproduced:** 2/2
- **Impact:** A user cannot work out which filter returns the rows they are looking at.
- **Proposed fix:** `proposals.md` → P-013
- **Confidence:** High

### BA-0018 — The orders grid cannot be sorted on any column

- **Session:** S01
- **Severity:** S2
- **Category:** FUNC
- **Screen:** Orders list
- **URL:** `/orders`
- **Steps:** Click each of the six column headers in turn.
- **Observed:** Nothing responds. No header contains a button, carries a button role, or shows a pointer cursor: every header returns `{"clickable": false}`. Row order is fixed to newest-first. There is no column chooser either.
- **Expected:** Sort on order #, customer, delivery date and balance due, with dates and money sorting as values.
- **Evidence:** DOM audit of `thead th`.
- **Reproduced:** 2/2
- **Impact:** "Which orders are delivering soonest" and "who owes the most" cannot be answered from the primary work list.
- **Proposed fix:** `proposals.md` → P-014
- **Confidence:** High

### BA-0019 — Every product in the picker shows a price of $0.00

- **Session:** S01
- **Severity:** S2
- **Category:** DATA
- **Screen:** Add Product modal
- **URL:** `/pos`
- **Steps:**
  1. Open Add Product with no search term, then search `queen`
  2. Read the PRICE column
- **Observed:** Every row in both result sets shows `$0.00`, and lines add to the order at 0.00 so the price must be typed by hand each time. The API agrees — `/v1/pos/product-search` returns `"priceCents": 0` for every variant. Existing orders in the system carry real prices ($2,518.00, $2,407.01), so prices exist somewhere.
- **Expected:** Unclear — this may be seed data with no price list loaded, or the search may not be joining price. Needs a product decision before a fix.
- **Evidence:** Picker screenshots; API response `[{"productName":"10\" QUEEN MATTRESS","sku":"Q-MOS10","priceCents":0}, …]`
- **Reproduced:** 3/3
- **Impact:** If this reflects production, every line is priced from memory, which is where pricing errors come from.
- **Proposed fix:** `proposals.md` → P-015 (`NEEDS-DECISION`)
- **Confidence:** Medium — the observation is certain; whether it is a defect or an unseeded environment is not visible from the browser.

### BA-0020 — The salesperson dropdown contains a blank, selectable option

- **Session:** S01
- **Severity:** S2
- **Category:** DATA
- **Screen:** New Sale — Order details
- **URL:** `/pos`
- **Steps:** Open the Salesperson or 2nd salesperson dropdown and read the options.
- **Observed:** Between "Brandon" and "Elyse" there is an option with empty text and a real member id — `{"i":7,"text":"\"\"","value":"…"}`. It is selectable, so an order can be assigned to a salesperson with no name. The same blank appears in the 2nd salesperson list. The list also contains an obvious junk record, "Armaaaaaa", which owns eight existing orders.
- **Expected:** Members without a display name are excluded, or rendered with a fallback label.
- **Evidence:** Option dump of both selects.
- **Reproduced:** 2/2
- **Impact:** Orders and their commission can be attributed to a nameless record; the invoice's salesperson field would print blank.
- **Proposed fix:** `proposals.md` → P-016
- **Confidence:** High

### BA-0021 — The special-order warning shown during entry disappears when the draft is reopened

- **Session:** S01
- **Severity:** S2
- **Category:** FUNC
- **Screen:** New Sale — Items
- **URL:** `/pos`
- **Steps:**
  1. Add an out-of-stock product — an amber row appears: "Not in stock at the selected source location. No open PO — will special-order."
  2. Save as Draft
  3. Reopen the draft from its chip
- **Observed:** The line, quantity, price and date all restore correctly, but the amber warning is gone. Stock has not changed (`availableHere: 0`, `availableTotal: 0`). On the completed order the warning returns in a third wording: "2 not reserved — not in stock at the selected source location."
- **Expected:** The same stock condition produces the same warning wherever the line is shown.
- **Evidence:** Screenshots of the line at entry, after draft reload, and on the order detail page.
- **Reproduced:** 1/1
- **Impact:** A salesperson resuming a draft is not told the item is a special order, which is the single fact that changes the delivery promise.
- **Proposed fix:** `proposals.md` → P-017
- **Confidence:** High

---

## S3 — Friction, inconsistency, missing state

### BA-0022 — Validation errors never clear

- **Session:** S01
- **Severity:** S3
- **Category:** ERROR
- **Screen:** New Sale — right rail
- **URL:** `/pos`
- **Steps:**
  1. Click **Create** on an empty customer form to raise the error
  2. Fill in every field
  3. Click **Create** — the customer is created successfully
- **Observed:** The red message persists through step 2 and through step 3. It is still on screen, unchanged, after `POST /v1/customers → 201` and after the Customer card has collapsed into its saved summary.
- **Expected:** The error clears on input, and certainly on success.
- **Evidence:** Screenshot of the saved customer summary with the stale error below Payments; `POST /v1/customers → 201`.
- **Reproduced:** 2/2
- **Impact:** The user cannot tell whether the last action worked.
- **Proposed fix:** `proposals.md` → P-006
- **Confidence:** High

### BA-0023 — Orders grid: 59px rows and no sticky header — 11 rows visible at 1440×900

- **Session:** S01
- **Severity:** S3
- **Category:** DESIGN
- **Screen:** Orders list
- **URL:** `/orders`
- **Steps:** Load `/orders` and count rows above the fold; scroll. Measured CSS viewport 1534×881.
- **Observed:** Row height 59px, 50 rows loaded, about 11 visible at a 1534×881 viewport — and fewer at the 1440×900 the protocol specifies. `thead` and `th` both compute to `position: static`, so the header scrolls away and the remaining 39 rows are read without column labels. The Sales list in the same module uses 41px rows with the same 13px text, so the extra height is not a type-size constraint.
- **Expected:** Per the rubric's deliberate deviation — dense enough to scan 25+ rows at 1440×900, with a sticky header.
- **Evidence:** `{"rowCount":50,"rowHeight":59,"theadPos":"static"}` on `/orders` vs `{"salesRowHeight":41,"cellFontSize":"13px"}` on `/sales`.
- **Reproduced:** 2/2
- **Impact:** Roughly half the scanning throughput on the screen a salesperson opens most often.
- **Proposed fix:** `proposals.md` → P-018
- **Confidence:** High

### BA-0024 — Filters and search live only in component state: not in the URL, lost on reload

- **Session:** S01
- **Severity:** S3
- **Category:** FUNC
- **Screen:** Orders list
- **URL:** `/orders`
- **Steps:**
  1. Set status to `Cancelled` and type a search term
  2. Note the address bar
  3. Reload
- **Observed:** The URL stays `/orders` throughout. After reload the status is back to "All statuses" and the search box is empty — `{"statusAfterReload":"(all)","searchAfterReload":""}`. The filtered view cannot be linked, bookmarked, or restored, and navigating away and back loses it too.
- **Expected:** Filter and search state in query parameters.
- **Evidence:** `location.href` before reload; DOM state after.
- **Reproduced:** 2/2
- **Impact:** Every return to the list restarts the filtering, and a filtered view cannot be sent to a colleague.
- **Proposed fix:** `proposals.md` → P-014
- **Confidence:** High

### BA-0025 — The no-results state is one sentence with no way out

- **Session:** S01
- **Severity:** S3
- **Category:** DESIGN
- **Screen:** Orders list
- **URL:** `/orders`
- **Steps:** Set status `Cancelled`, search `zzzznotfound`.
- **Observed:** A dashed box containing "No orders match." — no mention that a status filter is also narrowing the result, no "clear filters" action, no suggestion of what to do next.
- **Expected:** State what is being filtered, and offer to clear it.
- **Evidence:** Screenshot.
- **Reproduced:** 1/1
- **Impact:** A user who forgot the status filter concludes the order does not exist.
- **Proposed fix:** `proposals.md` → P-019
- **Confidence:** High

### BA-0026 — An over-large order discount is silently clamped

- **Session:** S01
- **Severity:** S3
- **Category:** FUNC
- **Screen:** New Sale — Totals
- **URL:** `/pos`
- **Steps:** On a $2,599.98 merchandise sale, enter `99999` in Order discount $.
- **Observed:** The Discounts line reads `-$2,599.98` and the total floors at $139.00 (the fees) — the total never goes negative, which is right. But the input keeps showing `99999` with no message, so the field and the applied amount disagree with nothing to explain the gap.
- **Expected:** Correct the field to the applied value, or say the discount was capped at merchandise.
- **Evidence:** Zoomed totals panel showing `99999` in the field and `-$2,599.98` applied.
- **Reproduced:** 1/1
- **Impact:** Minor, but it is a money field showing a number that is not in effect.
- **Proposed fix:** `proposals.md` → P-020
- **Confidence:** High

### BA-0027 — "Add payment" with an empty amount takes the full balance, with no confirmation

- **Session:** S01
- **Severity:** S3
- **Category:** FUNC
- **Screen:** New Sale — Payments
- **URL:** `/pos`
- **Steps:**
  1. Build a $1,254.50 sale, method `Cash`
  2. Leave the amount box empty (it shows `1254.50` as grey placeholder)
  3. Click **Add payment**
- **Observed:** A cash payment of $1,254.50 is recorded and Balance due drops to $0.00 — no confirmation. Reading it as a default is reasonable; combined with BA-0003 it means a single stray click can record a full-balance cash payment.
- **Expected:** Either the placeholder value is committed into the field so it reads as a real amount, or an empty amount is rejected.
- **Evidence:** Screenshots before and after the click; invoice shows `cash | 8/31/2026 | $1,254.50`.
- **Reproduced:** 1/1
- **Impact:** Money is recorded from an empty field.
- **Proposed fix:** `proposals.md` → P-002
- **Confidence:** High

### BA-0028 — The delivery ticket lists the recycling fee as something to load on the truck

- **Session:** S01
- **Severity:** S3
- **Category:** PRINT
- **Screen:** Print — Delivery ticket
- **URL:** `/print/orders/<id>/delivery-ticket`
- **Steps:** Complete an order containing "+ Recycling ($18.00)" and open the Delivery ticket.
- **Observed:** Under QTY / MODEL / DESCRIPTION: `1 | Q-MOS10 | 10" QUEEN MATTRESS` and `1 | — | Recycling Fee`. The pick list for the same order correctly lists only the mattress — the two warehouse documents disagree about what a fee is.
- **Expected:** Fee lines excluded from both, or shown as a note rather than a numbered item.
- **Evidence:** Delivery-ticket and pick-list text for SO-2026-000052.
- **Reproduced:** 1/1
- **Impact:** A driver counting two items against a one-item load.
- **Proposed fix:** `proposals.md` → P-021
- **Confidence:** High

### BA-0029 — No barcode on the pick list or the delivery ticket

- **Session:** S01
- **Severity:** S3
- **Category:** PRINT
- **Screen:** Print — Pick list; Print — Delivery ticket
- **URL:** `/print/orders/<id>/pick-list`, `/print/orders/<id>/delivery-ticket`
- **Steps:** Open each document and look for a scannable code.
- **Observed:** No barcode anywhere on either document — the order number and SKU appear as text only. The Bin column on the pick list is `—`. The Sales screen's own search field invites a scan ("Invoice # (scan a receipt) or customer name"), so scanning is expected somewhere in the workflow.
- **Expected:** Order number, and ideally SKU, as a scannable code at a usable size.
- **Evidence:** Full screenshots of both documents.
- **Reproduced:** 1/1
- **Impact:** Warehouse steps are keyed by hand.
- **Proposed fix:** `proposals.md` → P-021
- **Confidence:** High

### BA-0030 — The invoice prints a fragment of the internal record id as the customer number

- **Session:** S01
- **Severity:** S3
- **Category:** PRINT
- **Screen:** Print — Invoice
- **URL:** `/print/orders/<id>/invoice`
- **Steps:** Open the invoice and read CUSTOMER #.
- **Observed:** `9D058B82` — the first eight hex characters of the customer's internal id `9d058b82-4a7a-41fc-aaee-f51d7df40f99`, uppercased. Truncated to eight characters it is not guaranteed unique and cannot be searched: entering it in the customer search returns nothing.
- **Expected:** A real customer number, or omit the field.
- **Evidence:** Invoice text for SO-2026-000051 and SO-2026-000052; customer API payload.
- **Reproduced:** 2/2
- **Impact:** A number printed for the customer to quote back that no one can look up.
- **Proposed fix:** `proposals.md` → P-010
- **Confidence:** High

### BA-0031 — Development roadmap copy is shown to end users

- **Session:** S01
- **Severity:** S3
- **Category:** COPY
- **Screen:** Sale complete confirmation; Order detail
- **URL:** `/pos`, `/orders/<id>`
- **Steps:** Complete any order; read the confirmation card, then the order detail right rail.
- **Observed:** Confirmation card — "Print / Email invoice arrive with the documents phase; the order page has the receipt for now." Order detail right rail — "Delivery scheduling and fulfillment arrive with the Day 3 build." Both reference internal build phases.
- **Expected:** User-facing copy, or nothing.
- **Evidence:** Screenshots of both screens.
- **Reproduced:** 2/2
- **Impact:** Reads as unfinished software to anyone standing behind the salesperson.
- **Proposed fix:** `proposals.md` → P-022
- **Confidence:** High

### BA-0032 — Around one in seven requests per page view returns 503; all are link prefetches

- **Session:** S01
- **Severity:** S3
- **Category:** PERF
- **Screen:** All
- **URL:** All
- **Steps:** Load any page with the network log cleared and count requests and statuses.
- **Observed:** Opening one order-detail page produced 43 requests, of which 6 returned 503: `/jeopardy`, `/vendors`, `/transfers`, `/as-is`, `/customers/<id>` (all with an `_rsc` query parameter), plus `HEAD /orders/<id>` and `/.well-known/vercel/jwe`. A page load of `/orders` produced the same pattern on a different subset. Every failing request is a prefetch of a nav link, so nothing is visible to the user — but ~30 speculative requests are issued per page view and a portion fail. All the actual data calls (`/v1/…`) returned 200 throughout the session.
- **Expected:** Prefetching that does not generate failing requests at this rate.
- **Evidence:** Two full network dumps, 43 and 29 requests, listed with statuses.
- **Reproduced:** 3/3
- **Impact:** A nav click that lands on a failed prefetch pays a full round trip. I cannot say why they fail — that needs someone who can see the deployment.
- **Proposed fix:** `proposals.md` → P-023
- **Confidence:** Medium — the observation is solid, the cause is not visible from the browser.

### BA-0033 — Orders and Sales are two lists in one module with three different conventions

- **Session:** S01
- **Severity:** S3
- **Category:** DESIGN
- **Screen:** Orders list, Sales list
- **URL:** `/orders`, `/sales`
- **Steps:** Open each and compare.
- **Observed:** Row height 59px vs 41px. Row opening: Orders uses a whole-row click with no affordance; Sales adds an explicit blue "Open" link column. Search: Orders filters as you type with no button; Sales requires clicking **Search** and offers **Clear**. Page header: Sales carries a primary "Open register" button that duplicates the identical button in the global top bar, so the same action appears twice on one screen.
- **Expected:** One table pattern, one search pattern, one row-open convention across the module.
- **Evidence:** Screenshots of both lists; measured row heights.
- **Reproduced:** 1/1
- **Impact:** Muscle memory built on one list is wrong on the other.
- **Proposed fix:** `proposals.md` → P-018
- **Confidence:** High

### BA-0034 — The Sales list shows raw locale timestamps and three different identifier formats

- **Session:** S01
- **Severity:** S3
- **Category:** DESIGN
- **Screen:** Sales list
- **URL:** `/sales`
- **Steps:** Read the SALE and DATE columns.
- **Observed:** DATE renders as `8/30/2026, 2:33:53 PM` — seconds included, left-aligned, variable width, so the column does not scan. SALE mixes `INV-2026-000007`, `shp-4098`, `02108428` and `03108418`: three id schemes and inconsistent case in one column. Several rows show a $0.00 completed sale.
- **Expected:** One date format without seconds, right-aligned; identifier formats reconciled or the source labelled.
- **Evidence:** Screenshot of `/sales`.
- **Reproduced:** 1/1
- **Impact:** The register is hard to scan and the ids give no clue what kind of record each row is.
- **Proposed fix:** `proposals.md` → P-018
- **Confidence:** High

### BA-0035 — The order detail header carries five equal-weight actions and no primary

- **Session:** S01
- **Severity:** S3
- **Category:** DESIGN
- **Screen:** Order detail
- **URL:** `/orders/<id>`
- **Steps:** Open any order and read the header.
- **Observed:** Top right holds **Invoice**, **Delivery ticket**, **Pick list**, **Share status link** and **← All orders** — four identically styled outline buttons plus a text link. Nothing indicates which is the common action, and the back link sits inside the action group. There is no breadcrumb.
- **Expected:** One primary action; the rest grouped behind a menu. Back belongs in a breadcrumb, not the action row.
- **Evidence:** Order detail screenshot.
- **Reproduced:** 2/2
- **Impact:** The most-used action has to be found by reading every button.
- **Proposed fix:** `proposals.md` → P-024
- **Confidence:** High

### BA-0036 — Draft chips take the first six tab stops on the order-entry screen

- **Session:** S01
- **Severity:** S3
- **Category:** A11Y
- **Screen:** New Sale
- **URL:** `/pos`
- **Steps:** From the top of `/pos`, Tab and record the order of focus.
- **Observed:** The first six stops inside the page are the three draft chips and their three ✕ dismiss buttons; the customer search field is the seventh. Reaching **Add Product** takes 12 stops. Each dismiss button's only accessible name is the glyph "✕", which does not say which draft it discards — and discarding a draft is destructive.
- **Expected:** The customer field first; the drafts strip reachable but after the entry path. Dismiss buttons named for their draft.
- **Evidence:** Focus-order dump of the 29 focusable elements inside `main`.
- **Reproduced:** 2/2
- **Impact:** Every keyboard-started sale pays six stops, past three destructive buttons, to reach the first field.
- **Proposed fix:** `proposals.md` → P-008
- **Confidence:** High

### BA-0037 — Numeric inputs are too narrow to display their own values

- **Session:** S01
- **Severity:** S3
- **Category:** DESIGN
- **Screen:** New Sale — Items, Payments
- **URL:** `/pos`
- **Steps:** Enter `999999` in QTY; enter a payment amount over $1,000,000.
- **Observed:** The QTY field renders `999!` — the value clipped mid-digit by the spinner control. The payment amount field showed `14267375` clipped from `1426737598.26`. The value cannot be read back to check it.
- **Expected:** Fields sized for their plausible range, or values that scroll into view on focus.
- **Evidence:** Screenshot of the line at qty 999999.
- **Reproduced:** 1/1
- **Impact:** A mistyped quantity or amount cannot be spotted by looking at it.
- **Proposed fix:** `proposals.md` → P-009
- **Confidence:** High

### BA-0038 — Completing a draft cancels it and issues a new order number

- **Session:** S01
- **Severity:** S3
- **Category:** FLOW
- **Screen:** New Sale
- **URL:** `/pos`
- **Steps:**
  1. Save a sale as draft — SO-2026-000050, toast "Draft SO-2026-000050 saved — visible store-wide"
  2. Reopen it from its chip — toast "Draft loaded — completing it will replace the draft"
  3. Complete it
- **Observed:** The completed order is **SO-2026-000051**. SO-2026-000050 still exists with `displayStatus: "Cancelled"` and, per BA-0016, a balance due of $2,853.48. So the routine act of saving a quote and later converting it leaves a cancelled order in the customer's history, consumes a number in the sequence, and adds a phantom receivable. The toast's wording — "replace the draft" — does not describe this.
- **Expected:** The draft is promoted in place, keeping its number; or the toast says a new order will be created and the draft cancelled.
- **Evidence:** `/v1/orders/list-view` showing both records for `ZZTEST Audit S01 1`, `000050` Cancelled and `000051` Pending, both $2,853.48, created 56 seconds apart.
- **Reproduced:** 1/1
- **Impact:** Quote-to-order is the most common path in the module; every use of it leaves a cancelled twin behind.
- **Proposed fix:** `proposals.md` → P-012
- **Confidence:** High

### BA-0039 — The order-not-found page has no page chrome

- **Session:** S01
- **Severity:** S3
- **Category:** ERROR
- **Screen:** Order not found
- **URL:** `/orders/00000000-0000-0000-0000-000000000000`
- **Steps:** Enter an order URL with a valid-shaped id that does not exist.
- **Observed:** A single line of red text, "Order not found — back to orders", at the top left of an otherwise empty page. No page title, no card, no header. The link works.
- **Expected:** The standard page frame with a titled empty state.
- **Evidence:** Screenshot.
- **Reproduced:** 1/1
- **Impact:** Reads like a crash rather than a handled case.
- **Proposed fix:** `proposals.md` → P-019
- **Confidence:** High

---

## S4 — Polish

### BA-0040 — The success toast covers the global "Open register" button

- **Session:** S01
- **Severity:** S4
- **Category:** DESIGN
- **Screen:** New Sale
- **URL:** `/pos`
- **Steps:** Save a sale as draft and look at the top right.
- **Observed:** The toast anchors top-right and sits over the "Open register" button in the top bar, which is unclickable until it clears.
- **Expected:** Toasts placed clear of persistent controls.
- **Evidence:** Screenshot immediately after "Draft SO-2026-000050 saved".
- **Reproduced:** 2/2
- **Proposed fix:** `proposals.md` → P-022
- **Confidence:** High

### BA-0041 — The invoice prints the payment method in lowercase

- **Session:** S01
- **Severity:** S4
- **Category:** COPY
- **Screen:** Print — Invoice
- **URL:** `/print/orders/<id>/invoice`
- **Steps:** Take a cash payment and open the invoice.
- **Observed:** The PAYMENT column reads `cash`; the UI everywhere else reads `Cash`. The stored value is printed raw.
- **Expected:** The same label the UI uses.
- **Evidence:** Invoice text for SO-2026-000052 — `cash | 8/31/2026 | $1,254.50`.
- **Reproduced:** 1/1
- **Proposed fix:** `proposals.md` → P-022
- **Confidence:** High
