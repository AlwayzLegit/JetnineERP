## Report builder — slice 1 SHIPPED · Run-02 pack landed (2026-08-28)

**Owner decision (~01:00): "self-service builder"** — option (b) of the
report-builder GAP-RECONCILE. The pack's 20 `12-open-questions`
recommendations are adopted as written, per that doc's own terms.

Task #28 slice 1 (pack build order 1–3 + runner + security), tests
ported first (`11-acceptance-tests` #1–31 pure/stack subset + 54–58,
62 — 34 tests green):

- Migration `0064_report_builder`: `report_dictionaries` (user formula
  - joined dictionaries) and `report_definitions` (jsonb doc), both
    tenant tables (RLS lists updated).
- `report-sources.ts` — the code-owned source catalog (orders, sales,
  customers, products, purchase_orders) with system dictionaries,
  per-source permission gates (pack 07 layer 2 mapped to Jetnine
  permissions), relation graph, pk tiebreakers, and the shipped Cost
  masking code (`reports.cost.view`) on cost-bearing dictionaries.
- `formula.ts` — closed-set expression language (arith, comparison,
  CONCAT/IF/ROUND/ABS/UPPER/LOWER), parse-time rejection of anything
  else, unknown-ref hard errors; evaluated in-process, never SQL.
- `definition.ts` — the pack-02 validation checklist (break⇒sort,
  newPage⇒break, period-prompt ban, token↔prompt match, reserved S$
  prefix at creation, width-132 warning, TR/FL valueless, derived
  Summary Only).
- Controller: sources catalog, dictionary create/delete (join
  assistant honours the relation graph; deletion reports affected
  definitions), definition CRUD + clone (system-owned runnable/
  cloneable, never editable), and the runner — AND-only filters with
  the `""` blank idiom, prompts (simple/range/multi include-exclude),
  date codes TDAY/YDAY/CPTD/LPTD resolved at execution, break/total
  groups + Summary Only, field masking as a render rule (header stays,
  cells empty, no WHERE), 5000-row announced cap, provenance in every
  output, CSV with house injection guards.
- Permissions: `reports.builder.run` / `reports.builder.author` /
  `reports.cost.view` (Owner/Manager inherit; Bookkeeper granted).
- Web `/reports/builder` (nav under Insights): list/clone/run +
  editor (headings, columns with break/total, filters, prompts,
  sorts) + runner with prompt answers, Summary Only, grid with group
  and grand totals.

Deferred to later slices (flagged): PDF/archive destinations, viewer
saved views, scheduling via the jobs runner, USER-DEFINED menus,
WorkingDataSet sources. CPTD/LPTD use calendar months pending the
fiscal-calendar answer (cash pack Q1).

**Run-02 Merchandising pack** uploaded (~01:15) and committed verbatim:
`docs/handoffs/run02-merchandising/` — 11 batches, 129 articles, 145
findings over the purchasing/inventory domain. Queued as **task #30**
(reconcile vs the already-shipped PO/costing/replenishment/transfers/
physical-inventory stack).
Gates: typecheck 0 · lint 0 · test 0 (694) · build 0 · format 0.
