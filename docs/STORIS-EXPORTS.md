# STORIS Export Checklist

Source spec for the Day 7 import pipeline (`PLAN-STORIS-CUTOVER.md` §7). One CSV/Excel
file per entity, headers included, one row per record. **Always include STORIS's internal
record/ID numbers** — they become `legacy_refs` keys. Note the export timestamp on every
file. Never hand-edit exports; the importer's validation report drives cleanup decisions.

Extraction routes, in order: STORIS report writer/exports → ODBC/JDBC → paid extract from
STORIS support (request early — lead time, possible fees, and you want it while still a
paying customer). Take a full archive of everything on the last day regardless.

## A. Master data

| # | File | Fields |
|---|------|--------|
| 1 | `customers` | customer #, name/company, emails, phones, billing + delivery addresses, tax-exempt flag & cert #, default salesperson, notes, created date |
| 2 | `vendors` | vendor #, name, contacts, address, payment terms, account # |
| 3 | `items` | item #, description, model, vendor + vendor item #, category/group, cost, retail price, sale price, tax class, serialized flag, UPC, active/discontinued |
| 4 | `employees` | name, employee/salesperson code, role |
| 5 | `tax_rates` | jurisdiction, rate, location |

## B. Inventory snapshot (record the exact as-of moment)

| # | File | Fields |
|---|------|--------|
| 6 | `onhand` | SKU × location: on hand, committed/reserved, available, avg or last cost |
| 7 | `serials` | serial, SKU, location, status; if sold: customer + invoice # |

## C. Open documents (money-critical; re-export as Day 10 delta)

| # | File | Fields |
|---|------|--------|
| 8 | `open_orders_headers` | order #, date, customer, salesperson(s) + split %, status, promised date, delivery/pickup, ship-to, subtotal/tax/total |
| 9 | `open_orders_lines` | order #, SKU, qty ordered vs delivered, unit price, discounts, special-order flag, linked PO # |
| 10 | `open_orders_payments` | order #, date, method, amount, reference |
| 11 | `open_pos` (headers+lines) | PO #, vendor, order date, ETA, status; SKU, qty ordered vs received, cost, linked customer order # |
| 12 | `deliveries_scheduled` | order #, date, time window, notes |
| 13 | `payment_plans` | order #, customer, terms, schedule, paid-to-date, balance |
| 14 | `ar_balances` | customer, invoice/order refs, balance, aging bucket |
| 15 | `gift_cards` | card/customer #, outstanding balance |
| 16 | `commissions_accrued` | salesperson, source invoices, amounts; plus plan rules/rates |
| 17 | `service_orders_open` | ticket #, customer, item/serial, issue, status, charges (if used) |

## D. History (trailing 24+ months minimum)

| # | File | Fields |
|---|------|--------|
| 18 | `history_invoices` (headers, lines, payments) | same shape as #8–10, incl. returns/credit memos |

## E. Reconciliation targets (PDF fine — matched against, not imported)

| # | Report |
|---|--------|
| 19 | Inventory valuation (same as-of moment as #6) |
| 20 | Open order deposit report (total deposits held) |
| 21 | AR aging summary |
| 22 | Sales by month for the history period |

**Timing rule:** #6, #19, and #20 must be pulled at the same close-of-business moment, or
recon gates chase phantom differences. **Recon gates (plan §7) must match to the cent.**
