# 12 — Open questions and deliberate divergences

The STORIS docs are field-level reference material. They describe *what a screen contains*, rarely
*what the system does under load or at the edges*. These are the gaps. Decide each one explicitly —
an undecided default here becomes a data-integrity bug later.

---

## Unanswered by the documentation

### Query semantics

1. **Selection-tab combinator.** Multiple filter rows: AND or OR? (STORIS behaviour is AND.) Is there
   any grouping/parenthesisation? Recommendation: AND-only, and add an explicit expression builder
   later if authors ask for it — do not invent an implicit precedence.
2. **Prompt vs. filter interaction.** A prompt and a Selection filter on the same dictionary — do
   they AND, or does one win? Recommendation: AND, and warn at authoring time.
3. **Join cardinality.** A joined dictionary on a one-to-many relation silently fans out rows.
   Not addressed anywhere. Decide: first-match (LEFT JOIN + pick-one) vs. row multiplication, make it
   a per-join setting, and show the author which they are getting.
4. **Null vs. blank.** `NE ""` is documented for the empty string. What about actual nulls? Define
   the three-way semantics (null / empty / value) and document it in the operator help text.
5. **Sort stability and ties.** Undefined. Pick a deterministic tiebreaker (primary key) so paginated
   and re-run output is reproducible.
6. **Multi-level breaks.** Multiple `Break` columns are clearly allowed. Nesting order — Output-tab
   order, or Sorting-tab order? Recommendation: sort order defines nesting; state it in the UI.

### Scale and lifecycle

7. **Row limits.** No documented ceiling. What happens at 5 million rows to Excel? Define a limit per
   destination and a graceful path (archive + notify) past it.
8. **Long-running runs.** Synchronous or queued? Recommendation: queue anything past a threshold and
   fall back to the archive-plus-notification pattern the scheduler already uses.
9. **Definition versioning.** Editing a report changes it for everyone immediately, including
   schedules. No version history exists. Recommendation: version definitions and have each archive
   record pin the version that produced it.
10. **Deleting a report.** Not documented at all. What happens to its schedules, its menu shortcuts,
    its archived output? Recommendation: soft-delete; keep archives; disable schedules and tell the
    schedule owner.
11. **Deleting or renaming a dictionary in use.** Silent breakage today. Recommendation: block, or
    require a confirmed impact review listing affected reports.
12. **`WorkingDataSet` retention** (the `BMW.WORK.DATA` pattern, `03`). Per-user generated source
    files with no documented lifetime. Set a retention policy and a size cap from day one.

### Security edges

13. **Field masking and aggregation.** If a user is masked from `Cost` but the report totals a
    cost-derived column, is the total also masked? The docs only say the *column* is empty.
    Recommendation: mask any aggregate whose inputs are masked — otherwise masking is trivially
    defeated. This is a real leak; treat it as a requirement, not a nicety.
14. **Field masking and formula dictionaries.** A formula dictionary computed from a restricted
    attribute is a laundering path. Recommendation: a formula inherits the union of its inputs'
    security codes.
15. **Field masking and export.** Does an Excel/ASCII export carry masked (blank) columns? It must.
    Test it explicitly (`11`).
16. **Sorting or filtering on a masked column.** Leaks ordering information. Recommendation: disallow
    at run time for masked users.
17. **Archive re-check timing.** Confirmed as a requirement in `07`, but the docs are silent — flag
    it as our own rule.

### Operations

18. **Scheduler run history.** No such view is documented. Build one (`08`).
19. **Missed-run policy.** Worker down over a scheduled window: catch up, or skip and alert?
    Recommendation: skip and alert; a catch-up storm of stale reports is worse.
20. **Report Builder audit trail.** Who edited which definition, when. Not documented. Needed.

---

## Deliberate divergences from STORIS (decide, then record in the repo)

| # | STORIS behaviour | Proposed divergence | Why |
|---|---|---|---|
| D1 | Footer tokens documented as rendering "in the header area" | Render footer tokens in the footer | Reads as a doc error; the stated behaviour is not useful |
| D2 | Excel + summary ⇒ a totals row of zeros, with a manual workaround | Warn, or emit computed values for summary exports | The current behaviour silently produces wrong-looking numbers |
| D3 | Column heading editable only via the dictionary | Allow a per-report heading override | Same dictionary, different report, different label is a routine need |
| D4 | Views and export paths are per-workstation (`C:\Users\...`) | Per user, server-side | Browser client; drive letters do not exist |
| D5 | A newer corporate view silently replaces the personal view | Same precedence, but notify the user | Silent layout swaps read as bugs |
| D6 | `Specific Edits` marked "STORIS use only" | Admin/superuser capability inside our system | We are the vendor; someone has to maintain the lists |
| D7 | Report Builder Security does not apply to standard reports | Apply one security model to all reports | The split is a legacy artifact and a leak |
| D8 | Menu re-prompt on every save until answered Yes | Same, plus "don't ask again for this report" | Keeps discoverability without nagging |
| D9 | No definition versioning | Version definitions, pin versions to archives | Reproducibility of historical output |
| D10 | Breaks silently absent from Excel output | Warn at authoring time | Authors discover this only after the fact |

---

## Questions for the business (LA Mattress specifically)

1. **What is the inventory hierarchy?** (`10.3`) Brand / comfort / size / collection / construction /
   price band — which dimensions do buying and inventory decisions actually turn on? This decides the
   break levels, grouping, and roll-ups of every inventory and margin report, and it is the most
   expensive thing on this list to change later.
2. **Which cost basis is canonical** for margin reporting — replacement or average, landed or not?
   (`10.4`) Reports must state their basis; the default should match how the business already talks
   about margin.
3. **Who may see cost and margin data?** The `Cost` field security code is delivered pre-applied in
   STORIS. Confirm the equivalent roster before go-live rather than after.
4. **Which STORIS reports are actually used today?** The builder is only worth as much as the
   definitions migrated into it. A usage inventory taken *before* cutover is far cheaper than
   reconstructing report intent afterwards.
5. **Fiscal calendar.** `CPTD` / `LPTD` / "last period total" all presume a period definition.
   Confirm the fiscal calendar and where it is configured.
6. **Districts and regions.** Regional Processing splits location scope into districts (sales) and
   regions (inventory). Confirm both structures exist and how stores map into them.
