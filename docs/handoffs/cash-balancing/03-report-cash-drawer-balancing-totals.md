# 03 — Report: Cash Drawer Balancing Totals

The root article of this handoff.

## Access paths (five, all reaching the same routine)

```
Customer   > Point of Sale     > Cash Balancing              > Report Cash Drawer Balancing Totals
Customer   > Point of Sale     > POS Views and Reports > POS Manager Views and Reports > Report Cash Drawer Balancing Totals
Customer   > Customer Service  > Cash Balancing              > Report Cash Drawer Balancing Totals
Accounting > Receivables       > Report Sales Receipts > Cash Balancing > Report Cash Drawer Balancing Totals
Accounting > Receivables       > Point of Sale > Cash Balancing        > Report Cash Drawer Balancing Totals
```

**Design note.** Five menu paths, one routine. Whatever the repo uses for
navigation, register the routine once and mount it at multiple points; do not
duplicate the screen. Permissions attach to the routine, not the menu node.

---

## Purpose

Lists **all monies received at a cash entry terminal for a selected day**,
totalled per drawer. It is the *totals* view; for line-level receipt detail use
`Report Daily Receipts Register` (see `04`).

The report formats as either **standard** or **extended** cash balancing, driven
by the `Extended Cash Balancing Report` field in `Cash Balancing Control
Settings` (see `02`). Criteria are selected, then **Run** produces the report.

---

## Output structure

**[RULE 3.1] Payment-type breakout.** The report always displays the breakout
and totals **by payment type**.

**[RULE 3.2] Store grouping.** When `Balance By = store`, the report displays
totals for **each store** plus a **grand total**.

**[RULE 3.3] Extended columns.** When `Extended Cash Balancing Report` is on,
each transaction additionally carries: customer name, cash drawer reference
number, and manager's initials where an override was necessary.

**[RULE 3.4] EC checks split out.** Totals for electronically processed and
converted check payments (**EC**) are kept **separate** from non-EC check
totals.

**[RULE 3.5] Exclusions honored.** Payment types listed in
`Excluded Payment Types` (see `02`) do **not** appear on this report.

---

## Exclusions and edge cases (carry these verbatim into tests)

**[RULE 3.6] Credit-card refunds on customer returns.** These are generally not
associated with a cash drawer entry and therefore **do not appear** on this
report. STORIS does not post them to cash balancing at entry time — except when
the order is a **customer drop-off**, which does post at entry.

The reasoning, worth preserving: for non-drop-off returns a lag is assumed
between entering the return and the merchandise physically coming back. The
transaction posts only when the customer return is **completed**, so it would
generally not have landed on the entry day's balancing report anyway.

**[RULE 3.7] Back-dated payments post by system date.** A payment entered 7/12
and back-dated to 7/10 lists on the Cash Balancing report for **7/12**. This is
deliberate: it prevents writing payments into a drawer that has already been
closed or balanced. The same payment still shows on **7/10** for the customer
account and the GL account. To see both the system date and the transaction
date for selected payments, use `Report Daily Receipts Register` (see `04`).

**[RULE 3.8] Regional Processing gate.** Output is affected by Regional
Processing restrictions — the user can inquire only about customers and
locations to which they have access. See `06`.

---

## Criteria fields

### `Date Code`
Select from the date-code list; determines the time period the report is based
on. See `06` for the full code table.

### `Balance Date`
- Active **only** when `Date Code = CUS`. Specifies the balance date to run for.
  A calendar picker is available.
- For any other date code, this field is **populated from the code and
  read-only**.

### `Starting Time`
Optional. Restricts the report to payment totals from this time onward.
**24-hour military format, `HH:MM`** (3:00 P.M. → `15:00`).

### `Ending Time`
Optional. Same format, upper bound of the time window.

### `Balance By` — enum: `drawer` | `cashier` | `store`
The pivot of the whole screen. The value selected here determines which of
`Drawer`, `Operator`, and `Store` are active below.
Choosing `store` also turns on per-store totals plus a grand total (RULE 3.2).

### `Drawer`
Restricts to one drawer. Enter the drawer number, or search and select from a
list. **Blank = all cash drawers.**
Active **only** when `Balance By = Drawer`.

### `Operator`
Restricts to one operator. Enter the operator number; a search list allows
choosing one or more; the action affordance opens the **Multiple Staff
Selection Window** for multi-select. **Blank = all operators.**
Active **only** when `Balance By = Operator`.

> Note the source's own inconsistency: `Balance By` is documented with the
> values *drawer / cashier / store*, while the `Operator` field says it is
> active when "Operator" is selected. Treat **cashier ≡ operator** — one
> concept, two labels. Pick one term for the ERP and use it everywhere. See `09`.

### `Store`
Restricts to one location. Enter the location number; an arrow affordance lists
locations for choosing one or more; the action affordance opens the
**Multiple Location Selection Window**. **Blank = all locations.**

Active **only** when **both**:
- `Balance By` is `Store` **or** `Operator`, **and**
- `District` is blank.

### `District`
Restricts to one district. Enter the district number; arrow lists districts;
action affordance opens the **Multiple District Selection Window**.
**Blank = all districts.**
Active **only** when `Store` is blank.

> **[RULE 3.9] Store/District mutual exclusion.** Store and District are
> mutually exclusive — populating either deactivates the other. Implement as a
> two-way lock, not a validation-on-submit.

### `Balanced Drawer Reference`
Restricts to a specific **balanced** drawer reference. Enter it, or search and
select.

**[RULE 3.10]** Entering a valid reference here **de-activates all other Drawer
fields on the screen**. The purpose: display *all* postings to a drawer
**regardless of posting date**, which is what makes manager overrides visible
even when they were performed on a different date.

### `Unbalanced Drawer Reference`
Identical behavior to the above, against **unbalanced** references. Same
deactivation rule, same date-independent purpose.

### `Send Output to`
Displays the current output destination. Changed via the actions affordance →
`Output Settings`. See `06`.

### `Export Path`
Read-only. When the destination is **Personal Report Viewer (PRV)**,
**Excel Export**, or **ASCII Export**, displays the pre-set drive and folder the
system exports report data to. **Not editable from this routine.**

---

## Field activation matrix

| `Balance By` | `Drawer` | `Operator` | `Store` | `District` |
|---|---|---|---|---|
| Drawer | active | inactive | inactive | active if Store blank |
| Cashier / Operator | inactive | active | active if District blank | active if Store blank |
| Store | inactive | inactive | active if District blank | active if Store blank |

Overriding all of the above: if either `Balanced Drawer Reference` or
`Unbalanced Drawer Reference` holds a valid value, **every** Drawer field on the
screen is deactivated (RULE 3.10).
