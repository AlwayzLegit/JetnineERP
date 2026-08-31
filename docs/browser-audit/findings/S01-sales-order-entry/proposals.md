# S01 — Fix Proposals

Ordered by severity, then by how many findings each closes.

---

### P-001 — Do not lose an in-progress sale on navigation

- **Findings:** BA-0001
- **Screen:** New Sale
- **Type:** SAFE
- **Change:** While a sale has any user-entered content — a customer, a line, a fee, a note — leaving the screen must not discard it. Either warn before navigating away, or hold the in-progress sale so returning to New Sale restores exactly what was there. The app already has a store-wide draft concept; reusing it as an autosave would satisfy this, provided a recovered sale is clearly labelled as recovered rather than silently reopened.
- **Acceptance:**
  1. Enter a customer, one line, and a delivery date; navigate to Orders and back — the sale is intact, or a prompt appeared before leaving
  2. Browser refresh mid-entry has the same outcome as nav-away
  3. A sale with nothing entered navigates away with no prompt
- **Priority:** S1
- **Effort guess:** medium — needs a decision on where the in-progress state lives

### P-002 — An entered payment amount must never be silently dropped

- **Findings:** BA-0002, BA-0027
- **Screen:** New Sale — Payments
- **Type:** SAFE
- **Change:** Completing an order while an unapplied amount sits in the payment box must not discard it. Either apply it as part of Complete, or block Complete and say a payment is pending. Separately, "Add payment" with an empty amount currently records the full balance from a placeholder — commit the default into the field so what is recorded is what is visible, or require an explicit amount.
- **Acceptance:**
  1. Type 500, click Complete — the resulting order shows Paid $500.00 and Balance due $2,353.48, or completion was blocked with an explanation
  2. Leave the amount empty and click Add payment — either the field first fills with the balance, or the click is rejected
  3. No path completes an order with money typed on screen and Paid $0.00 recorded
- **Priority:** S1
- **Effort guess:** small

### P-003 — Stabilise and guard the Complete action

- **Findings:** BA-0003
- **Screen:** New Sale — right rail
- **Type:** SAFE
- **Change:** The primary irreversible action must not move when the panel above it changes height. Reserve space for the payment reference field and the error slot so the button stays put across payment methods and error states, and separate Complete from the payment controls by more than the current gap. Given that completing is irreversible from this screen, a confirmation step showing customer, total and amount collected would be the stronger fix.
- **Acceptance:**
  1. Switch payment method between every option — the Complete button's vertical position does not change
  2. Trigger a validation error — Complete does not move
  3. Clicking Add payment can never, at any panel height, land on Complete
- **Priority:** S2
- **Effort guess:** small for the layout; medium if a confirmation step is added

### P-004 — Bound line quantities and stop treating zero as delete

- **Findings:** BA-0004, BA-0006
- **Screen:** New Sale — Items
- **Type:** SAFE
- **Change:** A quantity of zero or less must be rejected and the line kept, with removal available only through the row's explicit remove control. Quantities also need an upper bound; above it, refuse or confirm rather than accepting silently.
- **Acceptance:**
  1. Set QTY to 0 — the line remains and the field shows an error
  2. Set QTY to -3 — same
  3. Set QTY to 999999 — either rejected with a stated limit, or a confirmation appears before it is accepted
  4. The row's remove control still deletes the line in one click
- **Priority:** S2
- **Effort guess:** small

### P-005 — Reject delivery dates in the past

- **Findings:** BA-0005
- **Screen:** New Sale — Order details
- **Type:** SAFE
- **Change:** The delivery date cannot be earlier than today. The capacity line beneath the field should not report availability for a date that cannot be selected.
- **Acceptance:**
  1. Enter 01/15/2020 — rejected, with a message naming the field
  2. No capacity text renders for a rejected date
  3. Today and any future date are accepted
- **Priority:** S2
- **Effort guess:** small

### P-006 — Put form errors on their form, in plain words, and clear them

- **Findings:** BA-0007, BA-0008, BA-0022
- **Screen:** New Sale — Customer, and the shared right-rail error slot
- **Type:** SAFE
- **Change:** Each card owns its own error region — an error raised by the customer form appears in the customer card, not in the right rail. Error text is written for a salesperson and never contains internal field names. Validate the required-field case before sending the request. Errors clear when the offending input changes and always on success.
- **Acceptance:**
  1. Submit an empty customer form — the message appears inside the Customer card and reads in plain English, with no camelCase identifiers
  2. No network request is sent for the empty-form case
  3. Typing in any field clears the message
  4. After a successful create, no error text remains anywhere on the page
- **Priority:** S2
- **Effort guess:** small

### P-007 — Give every control a visible and programmatic label

- **Findings:** BA-0009
- **Screen:** New Sale (all cards)
- **Type:** SAFE
- **Change:** All 28 controls on the order-entry screen get a persistent visible label above the field and an associated programmatic name. Placeholders may stay as hints but must not be the only identification. Mark required fields once, consistently.
- **Acceptance:**
  1. Every input, select and textarea on `/pos` returns a non-empty accessible name
  2. Each field's label remains visible after the field is filled
  3. A screen reader announces each field in the customer form by name
- **Priority:** S2
- **Effort guess:** medium — touches every field on the screen

### P-008 — Make order entry completable from the keyboard

- **Findings:** BA-0010, BA-0011, BA-0036
- **Screen:** Add Product modal; New Sale tab order
- **Type:** SAFE
- **Change:** Product results must be keyboard-operable: arrow keys move a highlight through the rows, Enter adds the highlighted product, and the highlight is visible. The modal needs dialog semantics, a focus trap, Escape-to-close, and focus returned to the control that opened it. Tab order on the entry screen should start at the customer field, with the drafts strip after the entry path, and each draft's dismiss button named for the draft it discards.
- **Acceptance:**
  1. From a fresh New Sale, a two-line order can be entered and completed using only the keyboard
  2. Arrow keys move through product results and Enter adds one
  3. Escape closes the Add Product modal and focus returns to the Add Product button
  4. Tab from the top of the page reaches the customer search field first
  5. Focus cannot leave the modal while it is open
- **Priority:** S2
- **Effort guess:** medium — this is the highest-value fix in the module

### P-009 — Fit the line grid, and its numeric inputs, in the space available

- **Findings:** BA-0012, BA-0037
- **Screen:** New Sale — Items; Order detail — Lines
- **Type:** SAFE
- **Change:** At 1440×900 and 1280×800 the item description and its line amount must be visible together without horizontal scrolling. If columns must give way, move FULFILLMENT and INVENTORY FROM into a per-row expander and keep item, qty, price, discount, amount and remove always visible. Numeric inputs need to be wide enough to display their full plausible value.
- **Acceptance:**
  1. At 1440×900 a line shows its description and its amount at once, with no horizontal scrollbar on the grid
  2. Same at 1280×800 (not yet measured in S01 — the viewport could not be set)
  3. The row remove control is reachable without scrolling
  4. A quantity of 999999 and an amount over $1,000,000 are fully legible in their fields
- **Priority:** S2
- **Effort guess:** medium

### P-010 — Fix the printed document header fields

- **Findings:** BA-0013, BA-0014, BA-0030
- **Screen:** Print — Invoice; Print — Delivery ticket
- **Type:** SAFE
- **Change:** Print the salesperson's full name rather than a single character. Include the postal code in every printed address, on the invoice and the delivery ticket alike. Stop deriving CUSTOMER # from the internal record id — print a real customer number or drop the field. The SOLD TO block should carry the billing street address, as SHIP TO does.
- **Acceptance:**
  1. An order sold by Arman prints SALESPERSON "Arman"
  2. Invoice and delivery ticket both print `Testville, CA 90000`
  3. The value in CUSTOMER # can be pasted into customer search and finds the customer, or the field is gone
  4. SOLD TO shows the street address
- **Priority:** S2
- **Effort guess:** small — all four are field mapping in the document templates

### P-011 — One definition of "Merchandise"

- **Findings:** BA-0015
- **Screen:** New Sale — Totals; Print — Invoice
- **Type:** NEEDS-DECISION
- **Change:** The entry screen excludes the recycling fee from Merchandise and shows it on its own line; the invoice includes it in Merchandise and shows no recycling line. Pick one and apply it to both. **Decision needed:** should statutory fees such as mattress recycling sit inside the merchandise subtotal or below it? That answer also governs the reports built on these figures.
- **Acceptance:**
  1. For an order of one $1,000.00 item plus an $18.00 recycling fee, the merchandise subtotal is the same number on the entry screen and the invoice
  2. If the fee is excluded from merchandise, the invoice carries its own Recycling line
  3. The order total is unchanged at $1,254.50 either way
- **Priority:** S2
- **Effort guess:** small once the decision is made

### P-012 — Cancelled orders should not look like receivables, and quote-to-order should not create one

- **Findings:** BA-0016, BA-0038
- **Screen:** Orders list; New Sale draft completion
- **Type:** NEEDS-DECISION
- **Change:** Two linked problems. Cancelled orders currently carry their full balance due, so anything that sums that column overstates what is owed — a cancelled order should show no balance, or the column should read `—` for cancelled rows. Separately, completing a saved draft cancels the draft and issues a new order number, which is what creates these records in the first place; promoting the draft in place would remove the cause. **Decision needed:** should a converted draft keep its own number, and what should a cancelled order's balance read?
- **Acceptance:**
  1. Filter the orders list by Cancelled — no row shows a positive Balance Due
  2. Save a sale as a draft and complete it — the completed order carries the draft's number and no cancelled twin exists
  3. If the current behaviour is kept deliberately, the toast says a new order will be created and the draft cancelled
- **Priority:** S2
- **Effort guess:** medium

### P-013 — One status vocabulary

- **Findings:** BA-0017
- **Screen:** Orders list, Order detail, status filter
- **Type:** NEEDS-DECISION
- **Change:** The list badges, the detail badge and the filter options use three overlapping vocabularies for the same states — the same order reads "Pending" in the list and "Open" on its detail page, and only two of the filter's seven options appear as badges anywhere. Agree one set of status names and use it in all three places. **Decision needed:** the canonical list of order statuses and what each means.
- **Acceptance:**
  1. An order's badge reads identically in the list and on its detail page
  2. Every filter option corresponds to a badge a user can see in the list
  3. Every badge in the list can be selected in the filter
- **Priority:** S2
- **Effort guess:** small once the vocabulary is agreed

### P-014 — Make the orders grid sortable and its state addressable

- **Findings:** BA-0018, BA-0024
- **Screen:** Orders list
- **Type:** SAFE
- **Change:** Order #, Customer, Delivery Date and Balance Due become sortable, with dates and money sorting as values rather than strings. Sort, filter and search state belong in the URL so the view survives a reload, can be bookmarked, and can be sent to someone else.
- **Acceptance:**
  1. Clicking Delivery Date sorts chronologically, not lexically, and reverses on a second click
  2. Clicking Balance Due sorts numerically with blanks grouped consistently
  3. Applying a status filter changes the URL; reloading that URL restores the same view
  4. Navigating away and back preserves the sort and filter
- **Priority:** S2
- **Effort guess:** medium

### P-015 — Establish why every product prices at zero

- **Findings:** BA-0019
- **Screen:** Add Product modal
- **Type:** NEEDS-DECISION
- **Change:** Every product in the picker shows $0.00 and lines add at 0.00, while existing orders carry real prices. From the browser it is not possible to tell whether the price list is unseeded in this environment or the product search is not returning price. **Decision needed:** confirm which, then either seed prices or return them. If products can legitimately have no price, the picker should say "no price set" rather than "$0.00", which is a price.
- **Acceptance:**
  1. Searching the picker shows a non-zero price for products that have one
  2. Adding a product carries its price onto the line without retyping
  3. A product with no price is labelled as such, not shown as $0.00
- **Priority:** S2
- **Effort guess:** unknown until the cause is established

### P-016 — Exclude unnamed salespeople from the assignment dropdowns

- **Findings:** BA-0020
- **Screen:** New Sale — Order details
- **Type:** SAFE
- **Change:** Members without a display name should not appear as selectable options in the Salesperson or 2nd salesperson lists. If such records must remain assignable, render a fallback label.
- **Acceptance:**
  1. Neither dropdown contains a blank option
  2. Every option has visible text
  3. Orders already assigned to a nameless member still render something readable on screen and on the invoice
- **Priority:** S2
- **Effort guess:** small

### P-017 — Stock warnings must follow the line everywhere

- **Findings:** BA-0021
- **Screen:** New Sale — Items; draft reload; Order detail
- **Type:** SAFE
- **Change:** A line whose stock condition would trigger the special-order warning shows that warning consistently — at entry, on a reloaded draft, and on the order detail page — in one wording.
- **Acceptance:**
  1. Add an out-of-stock item, save as draft, reopen — the special-order warning is present
  2. The wording matches the warning shown at entry
  3. The order detail page shows the same message for the same condition
- **Priority:** S2
- **Effort guess:** small

### P-018 — One table pattern across the module

- **Findings:** BA-0023, BA-0033, BA-0034
- **Screen:** Orders list, Sales list
- **Type:** SAFE
- **Change:** Adopt a single dense table: row height in the region of the Sales list's 41px rather than the Orders list's 59px, sticky header, one row-open convention, one search interaction, numeric columns right-aligned with tabular figures and consistent decimals, dates in one format without seconds. Remove the duplicate "Open register" button from the Sales page header, since the global top bar already carries it.
- **Acceptance:**
  1. At 1440×900 the orders list shows at least 20 rows above the fold
  2. The column header stays visible while scrolling on both lists
  3. Both lists open a row the same way
  4. Both lists search the same way
  5. Dates render identically on both lists
  6. "Open register" appears once per screen
- **Priority:** S3
- **Effort guess:** medium — this is the change that most raises perceived quality

### P-019 — Real empty and error states

- **Findings:** BA-0025, BA-0039
- **Screen:** Orders list; Order not found
- **Type:** SAFE
- **Change:** The no-results state should say what is being filtered, and offer to clear it. The order-not-found page should render inside the normal page frame with a title and an explanation.
- **Acceptance:**
  1. Search with a status filter active and no matches — the message names the active filters and offers a clear action
  2. Clearing from that state returns the unfiltered list
  3. A non-existent order URL renders the standard page frame with a titled empty state and a link back
- **Priority:** S3
- **Effort guess:** small

### P-020 — Say when a discount is capped

- **Findings:** BA-0026
- **Screen:** New Sale — Totals
- **Type:** SAFE
- **Change:** When an order discount exceeds merchandise it is silently clamped while the input keeps the larger number. Correct the field to the applied amount, or show a note that the discount was capped.
- **Acceptance:**
  1. Enter 99999 against $2,599.98 of merchandise — either the field corrects to 2599.98 or a message explains the cap
  2. The applied discount never exceeds merchandise
  3. The order total never goes negative
- **Priority:** S3
- **Effort guess:** small

### P-021 — Make the warehouse documents usable

- **Findings:** BA-0028, BA-0029
- **Screen:** Print — Delivery ticket; Print — Pick list
- **Type:** SAFE
- **Change:** Fee lines should not appear as items to load — the pick list already excludes them, the delivery ticket should match. Add a scannable barcode for the order number to both documents, sized to scan, and a SKU barcode per line on the pick list.
- **Acceptance:**
  1. An order with a recycling fee produces a delivery ticket listing only physical goods
  2. Pick list and delivery ticket list the same physical items
  3. Both documents carry a scannable order-number barcode
- **Priority:** S3
- **Effort guess:** small for the fee line; medium for barcodes

### P-022 — Copy and toast cleanup

- **Findings:** BA-0031, BA-0040, BA-0041
- **Screen:** Sale complete confirmation; Order detail; New Sale; Print — Invoice
- **Type:** SAFE
- **Change:** Remove internal build references from user-facing copy ("arrive with the documents phase", "arrive with the Day 3 build"). Move toasts clear of the persistent top-bar controls. Print payment methods with the same labels the UI uses.
- **Acceptance:**
  1. No user-facing string mentions a build, phase or day
  2. A toast never covers the "Open register" button
  3. The invoice prints "Cash", matching the UI
- **Priority:** S3/S4
- **Effort guess:** small

### P-023 — Investigate the failing link prefetches

- **Findings:** BA-0032
- **Screen:** All
- **Type:** NEEDS-DECISION
- **Change:** Each page view issues roughly thirty speculative navigation prefetches, of which about six return 503. Nothing is visible to the user, and every data call succeeds. From the browser it is not possible to tell whether this is deployment configuration, rate limiting, or something else. Someone with access to the deployment should look, and the prefetch volume itself is worth revisiting.
- **Acceptance:**
  1. A single page view produces no 5xx responses
  2. Data requests continue to return 200
- **Priority:** S3
- **Effort guess:** unknown — investigation first

### P-024 — One primary action in the order detail header

- **Findings:** BA-0035
- **Screen:** Order detail
- **Type:** SAFE
- **Change:** Promote the single most-used action and group the document actions behind one control. Move "← All orders" out of the action row into a breadcrumb.
- **Acceptance:**
  1. The header shows one visually primary action
  2. Invoice, delivery ticket and pick list are reachable in at most two clicks
  3. A breadcrumb, not a button, returns to the orders list
- **Priority:** S3
- **Effort guess:** small

---

## Do first

1. **P-002** — an entered payment amount must never be silently dropped. Small, display- and submit-layer, and it closes the gap between money in the drawer and money on the order.
2. **P-004** — bound line quantities and stop treating zero as delete. Small, and it removes two ways a keystroke destroys or distorts a line.
3. **P-008** — make order entry completable from the keyboard. Medium, but it is the measurement the checklist calls the highest-value one in the audit, and today it fails at the first line item.

P-001 is the most serious finding in the session and belongs immediately after these three; it sits below them only because it needs a decision about where in-progress state lives, which the other three do not.

## Needs a decision

- **P-011** — should statutory fees such as mattress recycling sit inside the merchandise subtotal or below it? The entry screen and the invoice currently answer differently.
- **P-012** — should completing a saved draft keep the draft's order number, and what should a cancelled order's Balance Due read?
- **P-013** — what is the canonical list of order statuses, and what does each mean?
- **P-015** — is the product catalogue genuinely unpriced in this environment, or is the product search not returning price?
- **P-023** — who can look at the deployment to explain the 503s on link prefetches?
- Delivery and installation fees are currently excluded from the tax base while merchandise and discounts are included. The arithmetic is self-consistent and this may well be correct for California, but no one in this session can confirm it. Worth putting to whoever owns tax configuration.

## Re-verify next session

Nothing yet — no proposals from this session have been implemented.
