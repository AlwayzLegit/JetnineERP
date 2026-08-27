# 05 — Report: Cash Requirements

The forward-looking, payables-side counterpart to `03`/`04`. Included here
because it is linked from the root article; it belongs to the AP module, not to
cash balancing. Keep it there.

## Access path

```
Accounting > Payables > Payables Views and Reports > Cash Flow Reports > Report Cash Requirements
```

---

## Purpose

Reports **cash requirements for a fiscal period**. Criteria are selected, then
**Run** produces the report.

**[RULE 5.1] Sort and total hierarchy.** The report sorts and totals after each
**vendor**, then **bank**, then **company**.

---

## Output quirks (both are real behaviors to reproduce or deliberately reject)

**[RULE 5.2] The unmarked status column.** There is an **unmarked column between
the `Type` and `Invoice Number` columns** holding the **AP bill status code** —
e.g. an AP bill with a *Hold* status prints `H` there.

> Recommendation for the ERP: keep the column, **give it a header**. An unlabeled
> column is a documentation bug that STORIS had to write an article note about.
> Flag this in review rather than cloning it.

**[RULE 5.3] Past Due population.** The `Past Due` column is populated **only**
when the bill's **invoice date has surpassed the as-of date** on the report.
If reporting off the **Anticipated Pay Date** or **Discount Date** and that date
is prior to the report's As-Of date, the **invoice date** is used to determine
whether the bill should be paid, or is past due.

---

## Criteria fields

### `Company`
- **With Multi-Company Processing active:** specify one or more companies; the
  action affordance lists companies to choose from. **Blank = all companies.**
- **Without it:** the default company appears and the field is **inactive**.

### `Bank`
One or more banks. Arrow lists banks; action affordance opens the
**Multiple Bank Selection Window**.

### `Country`
A **payables country** — i.e. the AP bill **document currency**. Blank = all
countries.

### `Sort by Country` — boolean
Adds a **secondary sort and break on payables country**.

### `As of Date`
The as-of date for the run. Anchors RULE 5.3.

### `Aging Method` — enum
- `Invoice Due Date`
- `Discount Terms Date`
- `Anticipated Payment Date`

Default comes from **`Bill Aging Method`** in **Payables Control Settings**.

### `Aging Days` — integer
Number of days per aging bucket. Default from **`Bill Aging Days`** in
**Payables Control Settings**.

### `Pending Bills` — boolean + dependent enum
Include pending AP bills. When checked, select one of:
- `All`
- `Pay Before Receipt`
- `Don't Pay Before Receipt`

### `Hold Codes` — boolean + multi-select
Include AP bills on hold. Optionally restrict to one or more hold codes: arrow
lists hold codes; action affordance opens the **Multiple Hold Codes Selection
Window**.

### `Send Output to`
Current output destination; changed via actions → `Output Settings`. See `06`.

### `Export Path`
Read-only; populated for PRV / Excel Export / ASCII Export. Not editable here.

---

## Run-time options footer

**[RULE 5.4]** The run-time options selected for the report appear on the **last
page of the report output**. (In the help center's sample image this is shown as
an "Options Selected" box, which does not appear when the report is actually
run — that is a documentation artifact, not a behavior.)

This footer convention appears to be system-wide across STORIS reports. Consider
implementing it once, in the shared report renderer described in `06`, rather
than per report.
