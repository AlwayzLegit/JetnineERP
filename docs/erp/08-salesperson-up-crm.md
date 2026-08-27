# Salesperson, Up System, CRM & Commissions

## The Up System (floor rotation) `[DOC]`

A queue of salespeople waiting for the next customer. Statuses and the auto-cleanup machine are in
`02` §11. What matters for implementation:

**The Available pane is an ordered queue** and its order is editable by drag-and-drop when the
change-available-order setting is on (default on); turning it off locks the rotation to strict FIFO.

**The Up day is not the accounting day.** A day-end offset in hours defines the roll (offset 4: 11pm
on the 13th → the 13th; 3am on the 14th → the 13th; 9am on the 14th → the 14th). Every up timestamp,
report boundary, and cleanup stamp uses the offset-adjusted day. Get this wrong and every closing
ratio is wrong for late-night and early-morning traffic.

**Auto archive** (off by default) governs whether the automatic day-end also moves current activity
into history. Two qualifications must both hold: there are active transactions still open and/or
associates who never checked out, *and* a new opportunity is entered on a later date. Off: the day-end
closes activities and marks everyone gone but leaves the data in the current file. On: it also
archives.

**Auto cleanup** stamps a configured action code — and the lookup for it only offers action codes with
an action **type** of "Available", with the docs recommending a code created specifically for this
purpose. Cleanup-stamped dates and times are not editable; all manual correction must precede day-end.

### Reporting settings that change the numbers `[DOC]`

- **Include currently assigned** (default on) — includes active, assigned, and historical activity in
  the performance report before day-end close; off = historical only
- **Include non-traffic in close ratio** — on: `(Traffic + Non-Traffic) ÷ # Sold`; off:
  `Traffic ÷ # Sold`. `[INFER]` As documented this is inverted from a conventional closing ratio
  (sold ÷ traffic); the text is reproduced verbatim because it is what the incumbent reports compute.
  **Confirm which convention LA Mattress management reads before building the report**, because
  salespeople are paid attention on this number
- **Include non-traffic in customers seen** (default on) — whether the board's "total customers today"
  sums traffic plus non-traffic
- **Include sale and return portion of an exchange** (default on) — on: an exchange counts as both a
  sale and a return and both portions count toward sales today. Off: the operator chooses by what they
  enter — the exchange order number counts the sale portion; the exchange order number **suffixed
  `e`** counts the return portion. Even exchange: on → the proof report shows zero dollars; off →
  shows the total dollar amount. Uneven exchange: on → shows the difference; off → shows the new whole
  amount
- **Require second login** (off by default) — for users whose single accessible location matches their
  salesperson location; requires the salesperson's own password in addition to the system login

**Up board configuration** allows up to **four** product categories as report columns; everything else
falls into a final "Other" column.

`[DECIDE]` **Stack / unstack and "retain a rotation spot" are not documented** in the settings
material — they appear as separate programs. Both are behaviours floor managers rely on daily (a
salesperson steps away without losing their place; two salespeople stacked on one up). Specify them
explicitly.

---

## CRM & leads `[DOC]`

The CRM is a centralized centre for prospects and existing customers that integrates into order entry,
cart entry, service order entry, and the Up System, and connects to warranties (expiring-warranty
follow-up), demographics, mailing lists, the web store, and the report builder. It tracks prospects by
store, associate, product interest, and likelihood of purchase; sales activity and key dates;
salesperson closing activity; and advertisement effectiveness. It generates **automatic ticklers** for
missed actions and for next actions due on a date.

### Lead model

**Contact block:** customer id (if an existing customer), first/last name, email, phones, address
(**all name elements combined ≤ 50 chars**), **preferred contact method** (mandatory, defaults from
config), mailing-list-export flag, birthdate, due date.

**Details block:** **salesperson** (mandatory, defaults from the login user's salesperson code),
**location** (defaults from login location; editability and the dropdown contents are driven by **CRM
security, not standard regional processing**), origin, referral code, marketing code (restricted by
activation/expiration dates), **merchandise of interest** (mandatory, one or more), brands, **closing
probability** (mandatory, defaults from config).

**Update block:** **action taken** (mandatory; the lookup is filtered by lead status — activity
classes `A`/`O`/`N` for new leads, `F`/`D`/`M`/`N` for existing), **next update** (mandatory; ≥ today
and ≤ today + a configured maximum), action to take, and **a mandatory new comment on every action**.
Prior comments become a display-only history: date, time, initials, text, most recent first.

**Hard rules:** one active lead per customer/contact; closing a lead means selecting `DELETE` at action
taken and then entering a reason.

**Actions from a lead:** add service order (requires the service module and a setting), add quote, add
order, edit existing order, customer maintenance, alternate contact info, special-occasion dates, and
user-defined settings. A configurable right-click menu offers inquiries (buy history, lead history,
open orders by customer, warehouse stock).

### Access levels `[DOC]`

```
Salesperson       own leads only, across stores/districts; can open an existing lead ONLY if they
                  are the salesperson stored in the contact's record
Store Manager     all leads for their store
District Manager  all leads for stores in their district, but NOT leads entered by salespeople who
                  do not normally work in that district
Corporate         all
```

District and store managers may create or edit leads for existing contacts in accessible locations and
**assign another salesperson** to a lead. CRM restrictions are distinct from regional processing though
the two overlap.

### Lead management grid `[DOC]`

Filters: type of lead (active/inactive), probability, **contact date** with a mode of `FIRST` / `LAST`
/ `NEXT` plus a start/end range, district manager, salesperson (blanking it for "all" requires manager
or corporate access), location, contact (searching lead contacts only), brand, merchandise of interest.
Two shortcut actions: **Today's Actions** (next activity = today) and **Missed Actions** (next activity
< today). Rule: if the current salesperson equals the configured salesperson-for-unassigned-contacts,
the location must equal the user's login store.

The grid maintains but **cannot create** leads — creation is a separate program. Also build: reassign
customers, reassign sales leads, export customer lead activity, export quote activity, view historical
leads.

---

## Commissions `[DOC]`

### Splits

Reached from the salesperson field on a sales order, return, exchange, or completed-order adjustment —
and on an exchange, also from the **return salesperson** field.

```
more than one salesperson AND no percentages from customer settings
   → the system splits percentages EVENLY

total across all salespeople must EQUAL, and not exceed, 100%
```

Defaults come from customer settings and are editable **for this order only**. A salesperson list can
be applied to populate the grid in bulk, then edited individually.

### Calculation & reporting

Commission is calculated per salesperson per product, with totals per salesperson and, when sorted by
location, per location. Commission add-on percentages come from the product's pricing settings or
globally from costing settings. Protection-plan commissions report like delivery commissions and
payment adjustments.

> **Commission setting changes are NOT retroactive.** Existing orders are unaffected until each order
> is updated — either through a commission/spiff update screen or by re-entering the line items.

Build that update screen. Without it, a rate change means re-keying orders.

**Returns and dollars-only adjustments** create commission records dated to the **written date of the
original invoice**; if that invoice is off file, the transaction's own written date is used.

**Payment-type commission adjustments** (for payment types configured with a commission adjustment
rate) appear as pseudo-lines: product number prints as `Pmt Adj xxxxx` where `xxxxx` is the payment
type code, brand null, unit price and total price equal to the payment type amount, commission percent
= the adjustment percent. Protection plans appear as `P-Plan {code}`, truncated to 20 characters.

> **Caution, documented:** salesperson totals and the report total include payment-type adjustment
> amounts, so they **do not tie** to reports that display invoice numbers.

That is a reconciliation trap worth designing out: keep adjustment pseudo-lines in a separate subtotal.

**Report parameters:** date code (custom enables start/end), report type (both / commission only /
spiff only), salesperson (multi), store location (multi), sort by salesperson or location,
exclude-zero-spiff, detail or summary, output destination.

Type and error flag domains — and the fact that they **combine** (e.g. `RE` = a setup error on a
return) — are in `02` §13.

`[DECIDE]` **Spiff computation is never defined**, and neither is the commission basis: a
profit-margin-vs-customer-name report-type setting implies margin-based commission exists, but no
formula appears. Specify: commission on gross, net after discounts, or margin; spiff sourcing from the
price/spiff/commission table; treatment of delivery and warranty revenue; and clawback on returns
beyond the date-attribution rule above. This is compensation — get it in writing from management
before implementing.
