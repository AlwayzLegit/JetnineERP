# PLAN — POS / Operations Modules (STORIS-modeled, owner-confirmed)

> **Locked plan doc** (same contract as `PLAN.md` / `PLAN-STORIS-CUTOVER.md`: change
> this doc first, then the code). Source: owner HANDOFF spec, 2026-08-25, plus the
> owner amendments in §0. Where this doc is silent, use the closest STORIS-style
> convention and flag it in the build summary. Do not "improve" a decision without
> asking. Extends the existing codebase — customers and products/inventory are
> already migrated; extend, don't recreate.

## 0. Owner amendments to the handoff (2026-08-25, final)

| #   | Amendment                                                                                                                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | **Batch delivery-ticket printing does NOT lock orders.** Only an individual delivery-ticket print locks (§7); the batch "Print all for date" prints without locking — the lock exists to freeze a specific order that is physically on the truck.                                                                                                   |
| A2  | **La Brea keeps its name; prefix `LB`** (the handoff's "H — Hancock Park" is superseded). Store prefixes: WH=Warehouse, SC=Studio City, WL=West LA, K=Koreatown, LB=La Brea. Imported STORIS history/stock mapped to La Brea stays attached.                                                                                                        |
| A3  | **Single-screen New Sale supersedes the checkpoint-7 three-step wizard.** All wizard fields/logic (fulfillment methods, fees, tenders, layaway, split tickets) carry into one screen with the pinned totals panel; the step chrome goes.                                                                                                            |
| A4  | **The legacy quick-sale register retires entirely**, including its offline mode (offline capability is dropped for v1; a future rebuild inside New Sale is a separate effort). Take-with flows through New Sale.                                                                                                                                    |
| A5  | **Operations is a sixth role, with its own home** (owner 2026-08-31). It watches every store's selling and every dollar and unit that moves, and signs off on what it reads — read-and-clear, never approve, consistent with §13's "approval queues (dashboard visibility instead)". It sells occasionally: no quota, no commission. Detail in §12. |

## 1. Locations & Order Numbering

Store prefixes (final, no duplicates): WH Warehouse · SC Studio City · WL West LA ·
K Koreatown · LB La Brea.

- Order numbers: `{PREFIX}-{sequence}` e.g. `SC-10234`. Sequential **per store** (each
  store has its own counter). Existing `SO-YYYY-######` numbers on already-created
  orders are preserved; new numbering applies from cutover of this feature.
- Prefixes/locations admin-manageable (add/edit stores without code changes).

## 2. Roles & Permissions

Roles: **Associate, Store Manager, Warehouse, Owner/Admin**.

- Permission system = a matrix editable by Owner/Admin: every permission a checkbox
  per role. Creating a user auto-populates permissions from role defaults; admin can
  adjust per user (per-user overrides).
- Store Managers are salespeople: they see their own sales + their store's sales
  only. Owner/Admin sees everything.
- Owner/Admin selects (settings) which roles may unlock a locked order (§7).

## 3. Order Types

- **Sales Order** (standard)
- **Sales Quote** — no deposit, no inventory reservation; convertible to Sales Order.
- **Layaway** — minimum deposit **$100 flat** to open. No fulfillment until paid in
  full, then proceeds as a normal order.
- **Exchange Order** — §10.
- **Service Order** — post-sale issues, always linked to the original sales order.

Fulfillment types (per order and per line): Delivery, Customer Pickup, Take-With,
Direct Ship, Split Ticket (mixed per-line fulfillment under one order).

## 4. New Sale Screen (the core screen)

Desktop-first. Left sidebar nav. Light mode only. Login lands directly on New Sale.
Branding neutral/white-label; per-tenant logo upload (admin setting).

Single-screen order entry — customer, products, payment all on one screen (no wizard):

- **Customer**: universal search box — name, phone, email, OR address matches
  against all stored fields, pulls the full record. Multiple matches → dropdown with
  phone + address preview. Inline "create new customer" if no match.
- **Ship To** defaults to billing with a one-click toggle for a different address.
- **Add Product**: popup search window with filters (vendor, size, more), results
  show product details, sortable/filterable by in stock / not in stock. Selecting
  adds the line. **No barcode scanning.**
- **Out-of-stock line** → warning banner with ATP date, e.g. "Available ~Sept 4 via
  PO" (computed from open POs/transfers/reservations).
- **Price override**: click the price, type a new one. Any associate, no approval,
  no cap.
- **Discounts**: per line item AND on the order subtotal.
- **Fee lines** _(amended 2026-08-30: the Recycling Fee no longer auto-adds per
  qualifying unit — the owner wants it added by hand)_: a "+ Recycling" button next
  to "+ Removal" adds one untaxed Recycling Fee line (rate = admin setting, e.g.
  $10.50/unit); each further click counts one more unit on that line; removable by
  the salesperson. Installation = order-level fee (default $0). Mattress Removal =
  selectable $0 line item. Delivery fee entered manually per order.
- **Take-with hand-over** _(amendment 2026-08-31)_: completing a sale (New Sale, or
  Complete on the order page — the per-line hand-over button is gone) splits any
  take-with lines to a `-A` sibling order; money already collected covers that piece
  first, and the piece fulfills + completes itself when every unit is reserved and
  it is paid. A short or unpaid piece stays open with a waiting banner (a user with
  inventory access adjusts the stock in) and finishes with one click on the piece.
  The invoice prints the whole split family as ONE document under the base number
  with take-with lines marked; the delivery ticket never lists take-with lines.
- **Salespeople**: multiple per order; commission split defaults to equal, editable.
- **Totals panel pinned**: merchandise, discounts, installation, delivery,
  recycling, tax, total, amount paid, balance due.
- **Tax**: rate per store location (admin setting).
- **Payments**: a list — add payment lines (method + amount) until balance = $0 (or
  partial for deposits). Methods: credit card, cash, check, PayPal, Venmo, Zelle,
  Synchrony, Acima, Store Credit. Store credit auto-surfaces at checkout. Deposits
  tracked as liabilities tied to the order.
- **No signature at point of sale** (signature is on the printed delivery ticket).
- **Drafts**: "Save as Draft", visible store-wide; anyone can resume.
- **On complete**: success state with Print / Email invoice, then fresh New Sale.
- Orders fully editable until delivered/completed (unless locked, §7). Every
  post-creation change surfaces in the Owner dashboard notifications feed (§12) and
  the order's change-history timeline.

## 5. Inventory

- Perpetual, real-time, cross-store visibility from POS.
- Auto-reserve at save; explicit Unreserve action.
- SKU-level only — no per-unit serials.
- One universal price list across stores.
- Reorder points manual per SKU. No auto-PO; PO builder pre-loads (a) items at/below
  min due to sales/reservations and (b) sold-not-in-stock items for that vendor.
- Stock adjustments require a reason code (damage, theft, correction), logged with
  user + timestamp.
- Transfers between stores: any manager; workflow create → print transfer ticket →
  deliver → sign → complete (receiving side confirms); statuses visible like orders.
- As-Is inventory = distinct stock status (used by returns). No sale restrictions.

## 6. Purchasing & Receiving

- POs manual, builder pre-loads per §5. Output: print / PDF / emailed to vendor from
  the system (existing Resend infra); replies route per admin setting.
- Every PO line bought for a customer order carries that sales order # on the PO.
- Receiving: single screen; per line Received → Inspected → Accepted.
- Partial receipts: accepted lines flip linked sales-order lines to Reserved;
  remainder stays open with "X of Y remaining"; PO auto-completes only when full.
- Vendor invoices auto-match to the PO (by PO #) for approval.
- No landed cost/freight allocation in v1.

### 6.1 Deleting a draft PO (CR 2026-08-31)

A draft had no exit. Retiring one meant placing it — recording a vendor commitment
that never existed — and then cancelling, or stripping its lines and leaving a
$0.00 shell on the list forever. The reorder panel makes drafts one click at a
time, so the shells accumulate.

- **Draft only.** Everything past Draft has told the outside world something: a
  placed PO is a commitment and **cancels**; a received one has moved stock.
- **Soft delete.** `deleted_at` + `deleted_by_user_id`; the row stays. PO numbers
  are generated from a count of existing rows, so keeping the row is also what
  stops the next PO inheriting a deleted one's number. **Gaps in the sequence are
  expected and correct.**
- **Hidden by default;** `includeDeleted=1` ("Show deleted") brings them back
  greyed, with who deleted them and when, and a Restore action.
- **Confirm against the PO number** — the dialog shows vendor, line count and
  subtotal, and arms only once the number is typed.
- **Releases what it holds.** Linked special-order lines are un-sourced
  (`po_line_allocations` → `cancelled`) so they return to the buying queue. There
  is no stock to release: a draft PO holds none — stock moves only at
  receive/unreceive. Un-sourcing and the delete share the request's RLS
  transaction, so both happen or neither does.
- **Restore does NOT re-claim those lines.** They went back on the queue and may
  have been sourced elsewhere meanwhile; re-claiming could source one line twice.
- **Refusals**, each with its own message: not a draft ("Only drafts can be
  deleted. Cancel this PO instead."); any line with received/inspected/accepted/
  rejected units; a matched or approved vendor invoice; a linked sales-order line
  already fulfilled (names the SO).
- **Permission:** `purchase_orders.delete`, separate from `purchase_orders.create`
  — the Inventory Clerk who raises POs cannot delete them. Owner and Manager hold
  it; the shared POS account must not.
- **Audit:** `purchase_order.delete` / `.restore`, surfaced in a new **Change
  history** card on the PO page (the PO had none; sales orders already did).

## 7. Delivery & Dispatch

- Dispatcher view: simple table (orders by date/route).
- Capacity: 15 stops/day soft cap; "15/15" state shown; booking beyond allowed with
  confirm + notification. During a sale, associate sees remaining capacity per day.
- Routes auto-suggested by zip/area; freely editable.
- Drivers work off printed tickets only; office closes out after the run.
- Delivery tickets: printable per order AND batch "Print all for date" for the day's
  fulfilled orders; unfulfilled orders for the day are clearly flagged (which + why).
  Ticket includes a customer signature line.
- **LOCK (amended by A1)**: an _individual_ delivery-ticket print locks the order —
  no edits while on the truck. Batch printing does NOT lock. Unlock restricted to
  owner-selected roles (§2); unlocking requires a typed reason logged to the owner
  dashboard.
- Partial deliveries split: delivered lines complete, rest stays open on its own
  schedule. Failed delivery stays open; manual reschedule.
- Customer-facing delivery tracking link per order (extend the existing feature).

## 8. Order Lifecycle & Statuses

Display statuses (exact wording): **Draft → Pending → On PO (show PO #) → Reserved →
Scheduled → Out for Delivery → Delivered**, plus Quote, Layaway, Cancelled,
Returned/Exchanged.

- Orders list columns: Order #, Customer, Status, Delivery Date, Balance Due,
  Salesperson.
- Row click opens a slide-over panel (list keeps its place) with a full-page option.
- Order detail shows a change-history timeline, every field change attributed.

## 9. Commissions

- Splits default equal across the order's salespeople; editable at entry.
- Calculated on completed orders only. Flat structure, rate configurable; no
  per-category variance in v1.
- Exchanges: return portion and new-sale portion can carry different salespeople —
  clawback on the returned portion, new commission to the exchange salesperson.

## 10. Returns, Exchanges & Service

- No restocking fee. Refunds to the original payment method (splits proportional).
- Partial refunds / price adjustments = distinct transaction type from full returns.
- Every returned item lands in As-Is and requires manager/warehouse review before
  returning to sellable stock; warranty/defect same path, with vendor disposition
  option.
- Exchange Orders: new document titled "Exchange Order", linked to the Original
  Invoice # (displayed prominently). Create exchange → deliver new → pick up old →
  old enters As-Is → review. Doc shows Total Exchange Order, payments, Credit Due.
- Service Orders link to the original sale.
- Store credit: on the customer record, never expires, auto-surfaces at checkout;
  issued from returns/refunds.
- No comfort-exchange policy enforcement in v1.

## 11. Printed / PDF Documents

Replicate the two LA Mattress sample invoices. All documents: neutral template +
tenant logo slot.

- **Invoice / Sales Order**: logo, store address block + phone, admin-editable
  header note line ("WE CALL 6-8PM NIGHT BEFORE DEL"), Sales Order # box, Scheduled
  Date / Document Date boxes; Sold To / Ship To; strip Customer Ph. | Terms |
  Salesperson (initials) | Customer # | Store; printed timestamp; fulfillment type
  row + free-text notes box; line grid Ln# | fulfillment code | Model | Brand |
  Description | Order qty | Price | Amount ($0.00 lines print); totals Merchandise,
  Installation, Tax, Total Sales Order, Amount Paid, payments listed by method +
  date + amount, Amount Due box; admin-editable footer.
- **Exchange Order**: same shell, titled "Exchange Order", + Original Invoice #;
  totals show Total Exchange Order, payments, Credit Due.
- **Delivery Ticket**: order + customer + address + phone, lines, delivery notes,
  route/date, signature line. Batch-printable per §7 (no lock on batch, A1).
- **Purchase Order**: vendor, ship-to, lines with linked sales order #s, expected
  date; print + PDF + system email.
- **Transfer Ticket**: from/to store, lines, signature line.

**Amendment (2026-08-31, S01 browser-audit batch 3, P-010/011/021):**

- Invoice strip prints the salesperson's **full name** (not initials) and drops
  the Customer # cell — there is no human-facing customer number, and a fragment
  of the internal id fails the audit's paste-into-search test (BA-0013/BA-0030).
- Sold To carries the customer's billing street address, ZIP included; Ship To
  falls back to printing the billing address instead of "Same as billing"
  (BA-0014).
- **One definition of Merchandise**: the invoice totals box shows Merchandise
  excluding the CA mattress recycling fee and breaks the fee out on its own
  "Recycling" line, matching the New Sale entry screen — CA requires the fee
  itemized on the receipt (BA-0015). Order totals are unchanged.
- Delivery ticket excludes fee lines (`lineType = custom`) from the load list,
  same rule as the pick list (BA-0028).
- Delivery ticket and pick list carry a Code 39 order-number barcode; the pick
  list adds a per-line SKU barcode (BA-0029). The §13 "barcode scanning"
  exclusion refers to POS scanning hardware, not printed barcodes.
- Documents print payment methods with the POS tender labels ("Cash", not
  "cash") (BA-0041).

## 12. Dashboards, Reporting & Close

- Owner/Admin morning dashboard tiles: yesterday's sales by store; sales by
  associate; today's deliveries (with 15-cap state); refunds/cancellations (with
  associate); modified orders (daily modification log with details).
- Notifications section: every post-creation order change, cap overrides, lock
  overrides (typed reasons), close-out exceptions.
- Store manager dashboard = same, scoped to own sales + own store.
- End-of-day close runs automatically 10:00 PM daily per store; never blocks —
  unbalanced payments / unprinted deliveries flag as exceptions to the owner
  dashboard.

### 12.1 Operations dashboard (amendment A5, owner 2026-08-31)

Every store, always — no store picker, and no goal or commission tile. The page
is exception-first: the feed leads, the numbers sit under it.

- **Needs you today** — one prioritized list across all stores, loudest first.
  Critical: negative on-hand (no threshold and no time bound — stock cannot be
  less than nothing); a take-with handed over on a **split ticket** whose order
  never completed; a suspended drawer; a security override. Warning: refunds and
  returns over the threshold, drawer variances, manual stock adjustments,
  cycle-count variances, receiving reversals, write-offs, gift-card adjustments
  and cancellations, waived restocking fees, and open exception-register rows.
  Info: every exchange entered, as-is restocks, transfers.
- **Sign-off, not approval.** Each row carries a checkbox and clears in bulk,
  stamped with who cleared it and when. Rows already in the exception register
  clear through `exception_events.acknowledged_at`; everything else is recorded
  in `ops_reviews`, one row per subject. Clearing is idempotent. The approval
  permissions (`pos.refund.approve`, `pos.cash.approve`, `orders.price_override`,
  `exchanges.approve`, `returns.override_window`) stay with the Manager, so the
  person who authorizes an exception is never the person who signs it off.
- **Money today, all stores** — in (by tender), out (refunds, returns,
  write-offs), net, and exchanges entered. Imported legacy documents excluded
  per cutover decision D8.
- **Selling** — a by-store row and a by-salesperson table (written, count,
  collected, refunded, discount %) so every store's sales and every
  salesperson's sales are on one page.
- **Flagged activity by person** — the same feed grouped by who did it. A flat
  stream hides a pattern; the roll-up makes an outlier show itself.
- **Open & close** — per store: drawer state, variance, whether the 22:00
  close-out ran and what it flagged.
- **Store activity** — recent order changes grouped by order.

Thresholds live in `businesses.ops_settings_json.opsReview` and are tri-state:
absent or null means the documented default, zero is a real setting. Defaults:
refunds ≥ $200 · discounts ≥ 20% · overrides and write-offs ≥ $100 · drawer
variance ≥ $5 · stock adjustments ≥ 5 units · take-with open 24h · 7-day
lookback.

Routing: `/dashboard` opens on this page for the **Operations** role. Owner and
Manager hold every business permission, `ops.dashboard.view` included, so gating
the home on the permission would replace theirs too — they reach the same page
at `/operations` from the nav. The permission governs access; the role governs
which home you land on.

## 13. Explicit v1 Exclusions (do not build)

Barcode scanning · bundle/kit pricing · MSRP display · coupon-code validation ·
product images/warranty docs at POS · serial tracking · auto-created POs · landed
cost · restocking fees · comfort-exchange enforcement · in-house financing · credit
holds · per-category commission rates · approval queues (dashboard visibility
instead) · automated customer email/SMS · driver mobile app · white-glove
itemization beyond the $0 Removal line · signature capture at POS · dark mode.

## 14. Build Order

1. Schema: order types/statuses, store prefixes + per-store sequences, fee settings
   (tax per store exists; recycling rate), permission matrix + per-user overrides.
2. New Sale screen (single-screen; supersedes the checkpoint-7 wizard per A3).
3. Orders list + slide-over + change history + notifications feed.
4. Documents: invoice, delivery ticket (+ individual-print lock per A1), batch print.
5. Delivery scheduling table + capacity + routes.
6. Purchasing: PO builder w/ suggestions, PDF/email, receiving, partial receipts,
   invoice matching.
7. Transfers.
8. Returns/exchanges/service + As-Is review + store credit.
9. Commissions + dashboards + 10pm auto-close job.

At each phase: match existing conventions, keep everything tenant-scoped, and stop
to confirm before schema migrations that touch the already-migrated
customers/products data.
