# Handoff: Cash Balancing & Cash-Position Reporting

**Target repo:** LA-Mattress-ERP
**Source:** STORIS help center (`storis.zendesk.com`), the article
*Report Cash Drawer Balancing Totals* and every article it links to.
**Captured:** 2026-08-27

This is a reference-and-spec handoff, not an implementation plan. It is
deliberately **stack-agnostic**: no framework, ORM, table, or file names are
assumed. Discover the repo's existing conventions (module layout, naming,
persistence layer, report/output abstraction, permission model, test harness)
and express everything below in those conventions.

---

## What this covers

STORIS treats "cash balancing" as a closed loop:

1. **Configure** the loop — `Cash Balancing Control Settings` decides whether
   balancing exists at all, what it groups by, what tolerance it allows, and
   what happens when a drawer will not balance.
2. **Capture** money — payments post to a *cash drawer* keyed on **system
   date**, not transaction date.
3. **Balance** the drawer — blind count, tolerance check, limited retries,
   suspension, manager approval.
4. **Report** on it — three distinct reports at three different altitudes
   (drawer totals, receipt detail + GL recap, forward-looking AP cash needs).
5. **Purge** — End of Day / Generate Monthly Reports, gated on balancing state.

The linked articles fall into three groups, and the file layout follows them:

| Group | Files |
|---|---|
| Core loop | `01`, `02`, `03` |
| Sibling reports reachable from the same screens | `04`, `05` |
| Cross-cutting primitives every report screen reuses | `06` |
| Adjacent screens surfaced as "related" | `07` |
| Verification | `08`, `09` |

---

## File index

| File | Contents |
|---|---|
| `01-domain-model.md` | Entities, drawer state machine, invariants, posting rules |
| `02-control-settings.md` | `Cash Balancing Control Settings` — full field reference and dependency graph |
| `03-report-cash-drawer-balancing-totals.md` | The primary report: criteria, activation rules, exclusions |
| `04-report-daily-receipts-register.md` | Receipt detail + GL recap report |
| `05-report-cash-requirements.md` | AP cash-requirements / aging report |
| `06-shared-report-primitives.md` | Date codes, calendar picker, multi-select pickers, output settings, export path, regional processing |
| `07-adjacent-screens.md` | Credit Review Comments, Change Details, Switch User Location |
| `08-acceptance-criteria.md` | Executable acceptance criteria (Given/When/Then) |
| `09-open-questions.md` | Decisions LA Mattress must make + gaps in the source capture |

---

## Source article map

Everything below was read in full. Fifteen articles were reachable from the
page; nine were captured verbatim this pass, six could not be re-fetched (see
`09-open-questions.md` — all six are generic UI primitives already dissected in
earlier handoffs, and `06` cross-references those).

| Article | ID | Status |
|---|---|---|
| Report Cash Drawer Balancing Totals *(root)* | 15202504439828 | captured |
| Cash Balancing Control Settings | 15186452327700 | captured |
| Report Daily Receipts Register | 15202676866452 | captured |
| Report Cash Requirements | 15202553293460 | captured |
| Credit Review Comments Entry/Inquiry Screen | 15202310175124 | captured |
| Change Details | 15202279413396 | captured |
| Switch User Location | 15238875799060 | captured |
| Regional Processing Overview | 15185876224660 | captured |
| Date Codes | 15185859659540 | captured |
| Calendar Icon | 15238859217684 | see `09` |
| Multiple Staff Selection Window | 15294752953492 | see `09` |
| Multiple Location Selection Window | 15294766862100 | see `09` |
| Multiple District Selection Window | 15294752249876 | see `09` |
| Output Settings | 15202105620756 | see `09` |
| Personal Report Viewer (PRV) | 15202090257172 | see `09` |

The page's "Recently viewed" strip (Enter a Sales Order, Selling Location, the
two RF transfer articles) is browsing history, not related content, and is
already covered by earlier handoffs. It is out of scope here.

---

## How to work this handoff

1. Read `01` first. The drawer state machine and the **system-date posting
   rule** are the two things most likely to be got wrong, and both are load-bearing.
2. Treat `02` as the source of truth for behavior. Almost every rule in `03`
   is conditional on a control setting; wire the settings before the report.
3. Build `06` primitives once and share them. All three reports and most other
   report screens in the ERP consume the same date-code resolver, multi-select
   pickers, and output/export plumbing.
4. `07` screens are only loosely related to cash balancing. Do not couple them
   to it — they are here because the source page linked them, and they carry
   their own specs worth capturing while they are in view.
5. `08` is the definition of done. Every rule marked **[RULE]** in `01`–`07`
   has a matching criterion in `08`.

**Fidelity rule:** where this handoff states a STORIS behavior, reproduce the
behavior, not the STORIS UI. Terms like "click the Arrow button" describe an
affordance (open a lookup list), not a widget to clone.
