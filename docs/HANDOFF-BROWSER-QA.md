# Handoff: Browser QA pass — Jetnine ERP (LA Mattress)

**App:** https://lamattress-erp.vercel.app (production — real store data)
**Written:** 2026-08-30, after PRs #96–#102 deployed. API and web are both live with everything below.
**Your job:** drive the UI in the browser like a store employee and verify each scenario. You do NOT have repo access; everything here is testable through the UI alone. Report findings in the format at the bottom.

---

## 0. Ground rules (read first — this is production)

1. **Never touch real customer documents.** Do not edit, pay, return, merge, or split any order/customer you did not create in this session. In particular leave `SO-2026-000018` and `SO-2026-000018-A` alone (repaired production records).
2. **Prefix everything you create with `QA-`**: customers "QA Tester One", phone numbers in the 555 range (e.g. `(213) 555-01xx`), so it is findable and deletable afterwards.
3. **Payments:** use method **Cash** and small amounts. These are records, not card charges, but they hit real reports — at the end, cancel your test orders where the UI allows it, and list every document you created in your report so the owner can clean up.
4. **Customer merge is destructive** (deletes the duplicate record). Only ever merge two `QA-` customers you created yourself.
5. If the sidebar or a page 403s, say so and move on — note which account you were signed in as.
6. **Timezone matters:** the stores run America/Los_Angeles. "Today" on dashboards means the store's local day, not UTC.

**Sign-in:** the owner will give you credentials. Two useful setups:

- The **owner account** sees everything (all stores, standard dashboard).
- For member-scoped tests (§3, §8) the owner should point you at (or create) a **test member** with: Manager role or similar, _Store manager dashboard_ checked, _Where can they sell?_ = "Approved stores only" with ONE store checked, and a _Monthly sales goal_ set (e.g. $50,000). All of that lives at People → Members → (member) → Store access card.

---

## 1. Global search omnibox (every page)

There is a search field in the top bar of every page; **⌘K / Ctrl-K** focuses it from anywhere.

- [ ] Create customer "QA Caller" with phone `(213) 555-0177` (Customers → New, or during a sale).
- [ ] From the Dashboard, press Ctrl-K and type `2135550177` → the customer appears under **Customers**. Repeat with `555-0177` and `(213) 555` — all formats must hit the same record.
- [ ] Type a partial order number (e.g. the last 5 digits of any order you create below) → it appears under **Orders** with the customer's name.
- [ ] Arrow keys move the highlight; Enter opens the highlighted record; Escape closes.
- [ ] One character typed → no dropdown/no results (by design).
- Acceptance from the spec: phone number → customer record open in ≤ 2 interactions.

## 2. Customer dedupe — warn on create + merge

- [ ] On **New Sale** (Sell → New Sale), start "New customer", type first/last name and the SAME phone as QA Caller (`2135550177`). A warning should appear under the row: _"Looks like QA Caller already exists — use them instead?"_ with a **Use existing** button.
- [ ] Click **Use existing** → QA Caller is attached, no duplicate created.
- [ ] Now deliberately create a duplicate: "QA Caller" again with the same phone (creating anyway must still be allowed).
- [ ] Open either QA Caller's customer page → a **Possible duplicates** card lists the other record (matched by phone) with a **Merge into this record** button.
- [ ] Give the duplicate an order first (quick $10 draft), then merge it into the keeper → confirm dialog, then: duplicate gone from search, its order now listed in the keeper's Purchase history, blank fields (e.g. email) backfilled if only the duplicate had them.

## 3. Manager dashboard (sign in as the test member)

- [ ] After login, the member should get the **"Which store are you selling at today?"** picker (approved-scope members only) — pick the store.
- [ ] The Dashboard is the manager view: greeting, date **at {store}** with timezone, a store picker (only approved stores listed), New Sale button.
- [ ] KPI row: My sales today (▲/▼ vs same weekday last week once data exists), {Store} today, **My month vs goal** with a progress bar (goal you set on the member page), My commission, My open sales, Needs attention (red when non-zero).
- [ ] Charts: 14-day mine-vs-store bars with hover tooltips; associate leaderboard; open-pipeline segmented bar.
- [ ] Open sales queue with **Mine / Whole store** tabs — rows show customer name + phone, balance due, salesperson, and a **Next action** chip ("collect balance", "schedule delivery", "N short", "confirm the sale").
- [ ] Store operations grid: Deliveries today & tomorrow (driver/window/collect), Backorder watch, Aging carts, Returns in flight, Incoming stock, Drawer & tenders (cash/card bars after you take a payment), Low stock (severity-sorted), Activity grouped by order (expandable rows).
- [ ] "My day": call-backs, my deliveries, my wins, follow-up money.
- [ ] Timezone check: write a small sale, confirm it appears in "today's" numbers immediately (it must, even in the evening — the old UTC bug showed zeros).
- [ ] Sanity: every number tile/link that navigates should land on a page whose contents plausibly match the number shown.

## 4. New Sale — sourcing defaults (the newest changes)

- [ ] Sell → New Sale, click **Add product**. The product-search dialog's location should default to the **Warehouse** (not the selling store). Note which location it shows.
- [ ] With fulfillment = **Delivery** (default), add a product → in the lines table, the line's **From** column shows the warehouse.
- [ ] Switch fulfillment to **Take-with** → every stock line's **From** flips to the store you're logged into. Add another product → it also defaults to the store.
- [ ] The per-line **From** dropdown still lets you pick any location, warehouses marked "(WH)".
- [ ] Switch back to Delivery → lines re-default to the warehouse.
- [ ] Mattress/foundation items should still auto-add the **CA Mattress Recycling Fee** line, and the tax shown must apply to merchandise only (fee untaxed).

## 5. Existing order — add an item at a price and take payment on it

- [ ] Create a small delivery order for QA Caller (one item, confirm it, no payment yet). Note the balance.
- [ ] On the order page, **Add product** → search dialog (should default to the warehouse) → pick an item → a small **price step** appears: unit price pre-filled with list, quantity 1. Change the price (e.g. up $20) and Add.
- [ ] Expected: toast says the payment form is pre-filled; the **Take payment** amount box now holds exactly what the new item added (price + tax); one click on the pay button with tender Cash settles just that charge; balance returns to what it was before the add.
- [ ] Also check: lowering the price far below list on a confirmed order must go through with NO approval popup and no reason prompt (owner decision 2026-08-30 — deep discounts are logged to the exception register, never blocked).

## 6. Returns & exchanges — no coded reason dropdown

- [ ] On a QA order that has a delivered/fulfilled line (use take-with so it's immediately fulfilled), open the return flow on the order page: there must be **no "Return reason" dropdown** — just the free-text Reason field. Type "QA test — customer changed mind" and process → it must succeed.
- [ ] Exchanges → New: same — no reason dropdown, one "Return reason" text input; the rest of the exchange writer (per-line price, inventory-from, return-to, collect balance now) unchanged.

## 7. Split money integrity (careful — QA orders only)

- [ ] New Sale, delivery, TWO items with **different delivery dates** on the lines, complete with full Cash payment → the confirmation screen lists a sibling order `…-A` and the payment must cover the family: open both orders — **each shows paid in full, $0 balance**.
- [ ] On a fully-paid single-date QA order with 2+ lines, use **Split order…** → move one line to a new date → both pieces show $0 balance (money followed the goods), each with its own sensible deposit-required.
- [ ] Overpay display: on a paid QA order, remove a line → the Money card shows **"Overpaid — credit $X"** in red and (if a split sibling owes) a **Move credit to …** button; the orders list shows a Credit chip instead of a dash.
- [ ] Inventory page: click a number in the **Reserved** column → dialog lists the holding orders with a Release button.

## 8. Deliveries calendar

- [ ] Deliveries: **five week-rows (35 days) visible at once**, today highlighted, buttons read "← Prev week / Today / Next week →".
- [ ] Schedule a delivery on a QA order, then **drag its card** to a day 2–3 weeks out → it sticks after reload. Drag it back.
- [ ] A day heading click opens the printable day-sheet.

## 9. Login-store attribution (test member)

- [ ] As the test member (logged into their store), write a small sale → Orders page defaults to an "At {store}" chip and the new order is listed under it; the manager dashboard's store numbers include it.
- [ ] Try to change New Sale's _selling_ location to a non-approved store → it must not be offered (source locations for inventory, by contrast, show every location).

---

## Reporting format

For each section: **PASS / FAIL / BLOCKED** plus notes. For failures give:
severity (High/Med/Low), the page URL, exact steps, what you expected, what happened, and a screenshot. Also list **every document you created** (order numbers, customer names) for cleanup, and anything that felt slow, confusing, or inconsistent even if technically working — UX notes are wanted.

Known quirks (don't report as bugs): deposit-required is stored at creation and recomputed on split, not on ordinary edits; the store Activity card only shows orders that have post-creation changes; the warehouse is matched by location type or by a name containing "warehouse"/"WH"; a one-character search intentionally returns nothing; the manager dashboard 403s for members without the toggle — that's the gate working.
