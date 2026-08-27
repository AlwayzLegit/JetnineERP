# 09 — Open Questions & Capture Gaps

Two lists. The first is decisions LA Mattress owns; the second is where this
capture is incomplete. Neither should block starting on `01`–`03`.

---

## A. Decisions to make

**Q1 — cashier vs. operator.** The source uses both. `Balance By` documents its
values as *drawer / cashier / store*, while the `Operator` field says it is
active when "Operator" is selected at `Balance By`, and `Group Payments by`
offers *Cashier*. These are one concept. **Pick one term** and use it across
schema, UI, and reports. Recommendation: `cashier` for the person, `operator`
never — it reads as a machine role.

**Q2 — keep the known-number override?** *(RULE 6.8)* STORIS lets a user bypass
regional customer restrictions if they know the customer number. That is a real
access-control hole. Keep it (with audit logging), or drop it? Dropping it
changes behavior for anyone migrating habits from STORIS.

**Q3 — the unmarked AP status column.** *(RULE 5.2)* Reproduce the unlabeled
column for output parity, or give it a header? Recommendation: give it a header;
note the divergence in the migration guide.

**Q4 — vendor-locked settings.** `Prompt For`, `Group Payments by`, and
`Post to Suspense` are STORIS-personnel-only. In an in-house ERP there is no
vendor. Proposal: system-administrator role + audited change log, and a warning
on `Post to Suspense = off` since the source calls it not recommended. Confirm.

**Q5 — fiscal calendar.** *(RULE 6.3)* `LPTD`, `CPTD`, `YPTD`, `LPTO`, `YPTO`
are fiscal-period relative. What is LA Mattress's fiscal calendar — 12 calendar
months, 4-4-5, 13 periods? The date-code resolver cannot be written without
this, and it is shared by every report in the ERP.

**Q6 — two affordances or one?** *(RULE 6.4)* STORIS gives most restriction
fields both a lookup list and a separate multi-select window. Collapse to a
single modern multi-select, or preserve the split? Decide once, globally.

**Q7 — tolerance scope.** The source is explicit that `Maximum Over/Short`
compares operator-entered **CASH** to system-entered **CASH**. Confirm LA
Mattress wants cash-only tolerance and no tolerance on card/check totals (which
should reconcile exactly).

**Q8 — drop-off returns.** *(RULE 3.6)* The customer-drop-off exception exists
because drop-off returns complete immediately. Confirm LA Mattress's returns
process has the same shape; if returns always complete at entry, the whole
deferral rule collapses and the exception becomes the norm.

**Q9 — retention values.** `Cash Receipt Purge Days` and
`Daily Receipts Retention Months` need actual numbers, and they interact with
whatever retention policy the business has. Get both from Accounting before
End of Day is built.

**Q10 — eBridge / Pre-Authorization.** Is auth/capture pre-authorization in
scope for the LA Mattress build, or is the payment gateway integration
different? If different, `02`'s WEB block becomes a template for the equivalent
gateway settings rather than a spec to implement literally.

---

## B. Capture gaps

The browser link to the STORIS help center dropped partway through this pass.
Six linked articles were identified but not re-read:

| Article | ID | Why it is low-risk |
|---|---|---|
| Calendar Icon | 15238859217684 | Generic date-picker affordance; behavior fully implied by RULE 6.2 |
| Multiple Staff Selection Window | 15294752953492 | Covered by the Sales Views and Reports handoff (18 multi-select pickers) |
| Multiple Location Selection Window | 15294766862100 | Same |
| Multiple District Selection Window | 15294752249876 | Same |
| Output Settings | 15202105620756 | Covered in full by the Getting Started → Printing handoff (28 articles) |
| Personal Report Viewer (PRV) | 15202090257172 | Same |

All six are cross-cutting primitives with existing coverage in the repo, and
`06` records exactly how the three reports in this handoff consume them. Re-read
them only if the existing specs turn out to be thinner than assumed.

### Referenced but not dissected here
These are named by the captured articles and will need their own passes. They
are **not** gaps in this handoff — they are the next articles to pull:

- `Balance a Cash Drawer` / **Blind Cash Balancing Screen** — the actual
  counting UI. This is the most important missing piece; `01`'s state machine
  was reconstructed from control-settings prose, not from the screen's own
  article.
- `Balance Approval by Manager` — suspense resolution.
- `Accounts Receivable Control Settings` — owns `Daily Receipts Retention
  Months` and `Daily Maximum Cash Refund Per Customer`.
- `Payables Control Settings` — owns `Bill Aging Method`, `Bill Aging Days`.
- `Web Control Settings` — owns `Use Auth/Capture for Credit Cards`.
- `General System Control Settings` (Licensing / Advanced / Miscellaneous tabs)
  — owns the Regional Processing switches.
- `District Settings`, `Region Settings`, `District and Regional Product
  Settings`.
- `Create a User` / `Create a User Group` → Location Restrictions and Access
  tabs; `Extended Security (Sales)` → `View All Sales Information`.
- `End of Day`, `Generate Daily Reports`, `Generate Monthly Reports` — the three
  batch jobs this handoff depends on.
- `Enter a Customer Payment`, `Access Control Window`, `Text Entry Screen`,
  `GL Distribution Screen`, `Credit Request Review`, `Adjust Revolving Plans`.

**Suggested next pull:** `Balance a Cash Drawer` + `Balance Approval by Manager`
together. They are the missing half of the loop, and `01` should be revised
against them rather than shipped as-is.
