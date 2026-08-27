# 06 — Purchase Order Replenishment

_Source: F1, F2 (and the duplicate section inside the Purchase Order FAQs article)_

Two operator-run routines plus one automatic process. They differ in what drives the quantity, and the
FAQ answers disagree with each other on one point — see `REPL-030`, which must be resolved before build.

---

### `REPL-010` Replenish Inventory for Current Back Order Needs

_Source: F1_

Purpose: create POs for the quantities needed to **fill open sales orders** — replenishment on an
"as-sold" basis.

Drivers:

- Open sales order demand not covered by on-hand or on-order stock
- **Minimum stock levels** established per product per location in **Warehouse Inventory Settings**

Output: proposed POs grouped by vendor and receiving location, presented for review/edit before creation.
Never auto-create without a review step in this routine.

Options: include/exclude backordered-only, filter by vendor, category, group, location; **comprehensive
option** (see `REPL-030`).

### `REPL-020` Replenish Stock Inventory Based on Sales Rate

_Source: F1_

Purpose: create POs based on **sales rates** and user-defined criteria, covering both projected additional
need and open order need.

**Hard prerequisite:** replenishment locations must be configured in **Warehouse/Store Location Settings**.
The routine must refuse to run and name the unconfigured locations rather than silently returning nothing.

Parameters to expose: sales-rate lookback window, seasonality/weighting, weeks-of-supply target, lead time
by vendor and by product, safety stock, min/max, order multiples and vendor minimums (pack quantity, minimum
order value), exclusion of discontinued items.

Output: same review-and-edit proposal flow as `REPL-010`.

### `REPL-030` Unlinked purchase orders — **contradiction in the source, resolve before building**

The two source articles conflict:

- **Purchase Order FAQs** (D-section) says the back-order-needs routine _"also takes into account unlinked
  purchase orders when replenishing using the comprehensive option."_
- **Purchase Order Replenishment FAQs** says _"Neither of the replenishment processes described above
  consider unlinked purchase orders when determining whether replenishment is needed."_

The most likely reading is that the second article is the older/simpler statement and the **comprehensive
option** is the feature that adds unlinked-PO awareness to the back-order routine.

**Requirement:** implement a `comprehensive` flag on `REPL-010`. When on, open PO quantity **not linked to a
sales order** counts as incoming supply and reduces the replenishment need; when off, it is ignored (the
conservative behavior, which over-orders). Default off. Label it clearly in the UI with a one-line
explanation of the consequence, because this flag is the difference between over-buying and under-buying.

`[DECISION NEEDED]` — confirm the intended default with the buyer before go-live.

### `REPL-040` Automatic Purchase Order Replenishment

_Source: F2_

Runs unattended as part of the **end-of-day** batch (`EOD-001`, "Generate Daily Reports"), generating POs
automatically from user-defined criteria.

Requirements beyond the STORIS behavior — an unattended process that creates real purchase orders needs
guardrails:

- **Criteria profiles**: named, versioned rule sets (scope by vendor/category/group/location, plus the
  `REPL-020` parameters). Enable/disable per profile.
- **Dry-run mode** producing the proposal report without creating POs. Required for the first two weeks
  after go-live.
- **Caps**: maximum PO value, maximum units per SKU, maximum POs per run. Breaching a cap creates the PO in
  `ON_HOLD` (`PO-080`) with reason `AUTO_REPL_CAP` rather than skipping it silently.
- **Created POs are stamped** `origin = AUTO_REPLENISHMENT` (`PO-045`) and are individually traceable to the
  profile and run that made them.
- **Run report** emailed/queued to the buyer every morning: what was created, what was suppressed and why.

### `REPL-041` End-of-day ordering

Within `EOD-001`, automatic replenishment must run **after** the day's receipts, sales, transfers, and PO
closings have posted, so it reads settled quantities. Document the EOD step order in the job definition.

### `REPL-050` Choosing between the routines — in-product guidance

_Source: F1_

The FAQ exists because users cannot tell the routines apart. Put the answer in the product: a short
selector on the replenishment menu — _"filling open orders and holding minimums" → back-order needs;
"buying to sales velocity" → sales rate; "hands-off nightly" → automatic._ Cheap, and it removes a
recurring support question.
