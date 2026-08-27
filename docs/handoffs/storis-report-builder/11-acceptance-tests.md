# 11 — Acceptance tests

Write these before the implementation. They encode the non-obvious rules — the ones that are cheap to
get right up front and expensive to discover in production. Use whatever test framework the repo
already uses; the phrasing below is deliberately framework-neutral.

---

## Dictionaries and joins

1. A dictionary with `type = FORMULA` and no `formula` is rejected on save.
2. A dictionary with `type = DIRECT_ATTRIBUTE` and a populated `formula` is rejected.
3. Cloning a dictionary with a 16-character target name is rejected (limit 15).
4. Formula evaluation resolves dictionary names **only** within the same source file; an unknown
   name errors rather than evaluating to null.
5. Formula evaluation rejects any construct outside the allow-listed function set.
6. `conversion` affects rendering only — the aggregated total of a 2-decimal column equals the sum of
   the underlying unrounded values, formatted once at the end.
7. File Join Assistant rejects a target name that collides with an existing dictionary on the host
   file, **before** the join screen opens.
8. Only source files sharing a common dictionary with the host are offered as join sources.
9. A joined dictionary is usable in a brand-new report on the host file, with no extra setup.

## Report definition validation

10. A report cannot be saved without a source file.
11. Changing the source file on a report with existing columns either blocks or clears children, and
    never leaves a column referencing a foreign dictionary.
12. A prompt on a dictionary whose name contains `.` is rejected.
13. `New Page` cannot be set unless `Break` is set on the same row.
14. `Break` on a dictionary absent from the Sorting tab is rejected (or auto-adds the sort with an
    explicit notice — pick one and test it).
15. `Include/Exclude` is settable only when `Prompt Type = MULTI_SELECT`.
16. A `{TOKEN}` in Title/Sub Title/Footer that does not match a prompt dictionary name is rejected.
17. Creating a report whose name uses the reserved system prefix is rejected.
18. `total_report_width` exceeding 132 produces a warning, not an error.
19. Operators outside `EQ NE LT GT LE GE TR FL` are rejected.
20. A Selection row with operator `TR`/`FL` and a populated value is rejected (or the value ignored —
    decide and test).

## Run-time behaviour

21. `Summary Only` appears **only** when the definition has a break on one dictionary and a total on
    a different one.
22. With `Summary Only` checked, output contains break-level totals and zero detail rows.
23. `Run Time Information` text is displayed on the run-time options screen verbatim.
24. A `Required` prompt left blank blocks the run.
25. `Selection` filter `EMAIL_ADDR NE ""` excludes records with an empty email and includes those
    with one.
26. `MULTI_SELECT` + `Exclude` removes the selected values from the result set.
27. A date-code prompt (`LPTD`) run on two different dates produces two different resolved windows.
28. The resolved date window and every prompt answer appear on the last page of the output.
29. Preview returns exactly one page and uses the same pipeline as a full run.
30. Cloning a report produces an independent copy; editing the clone does not alter the original.
31. A vendor/system-owned report cannot be edited but can be run and cloned.

## Output destinations

32. Excel export of a summary-only report either warns or emits computed totals — **never a silent
    row of zeros**.
33. Break/grouping is absent from Excel output and present in PDF output, for the same definition.
34. `File Name` is editable for Excel and ASCII destinations and read-only for the others.
35. `Export Path` is read-only in every destination.
36. Choosing `Report Archive` produces no immediate render and one new archive record.
37. An archived record stores structured data plus a definition snapshot, and can be re-rendered to a
    different destination later.
38. Archive `Source` is `Regular` for an on-demand run and `EOD`/`EOM` for the respective batch paths.
39. `Creator` on an archived scheduled run equals the schedule's `Run as User`; when that is blank it
    falls back to the scheduler identity.
40. Downloading multiple archived reports produces per-report files named
    `<program><archive-date><archive-time>` in the chosen format.
41. Downloading to a non-existent relative folder prompts to create it; declining cancels the
    download.
42. Deleting a selection removes exactly the selected archives and nothing else.
43. An archive past `Report Retention Days` is no longer listed.

## Interactive viewer

44. Sending a summary-only report to the viewer is blocked with an explanatory message (rather than
    rendering blank).
45. A saved personal view survives the addition of a new column to the report; the new column appears.
46. A saved personal view survives the removal of a column; the view loads without error.
47. A corporate view newer than a user's personal view takes precedence, and the user is told.
48. A corporate view older than the personal view does not take precedence.
49. With neither personal nor corporate view, the vendor default renders.
50. `Reset Default View` clears the personal view and falls back to corporate, then vendor default.
51. Saving a corporate view without `Edit Personal Report Viewer Corporate Views` is denied.
52. Group footer aggregations compute per group; total footer aggregations compute across all rows,
    both respecting active filters.
53. Clearing one column's filter leaves other columns' filters active.

## Security

54. A user with **no** file security groups granted cannot reach the runner at all.
55. A user restricted from a report's source file is denied the whole report, with an error.
56. A user restricted from a field sees the column header and empty cells — the column is present,
    row count is unchanged, and no WHERE clause was added.
57. Granting the field security code to that user makes the same run show the data, with identical
    layout.
58. `Access = Only the Owner` hides the report from the runner's picker for everyone else.
59. `Access = Within Staff Type` allows a same-staff-type user to run **and edit**, and blocks others.
60. Creating a staff member copies the staff type's file groups and field codes; a later change to
    the staff type does **not** propagate to the existing member.
61. Archived reports re-check entitlements at view time — a user whose access was revoked after
    generation cannot open the archive.
62. Cost-bearing dictionaries are masked by default for a user without the cost code.

## Scheduling

63. A report without `Add to Schedule a Process` is not offered in the scheduler.
64. A scheduled Report Builder report has Output Settings disabled and archive as its only output.
65. The scheduler grid label equals the report's `Description`.
66. Scheduling on day 31 warns that short months fire on the last day, and actually fires on the last
    day in February.
67. `Multiple Times` produces multiple runs in one day, each with its own run-time options.
68. Completion notification is sent on finish; with `Report Only If Errors` (import processes) it is
    sent only on failure.
69. With the scheduler worker stopped, missed runs are detected and surfaced rather than silently
    skipped.
70. The schedule grid re-sorts after save: days of week by time, then days of month by time.

## Menus

71. Saving an unpublished report prompts to add it to the user-defined pool; the prompt recurs until
    accepted (or explicitly dismissed for good).
72. Accepting offers an optional distinct menu label.
73. A user group can be associated with exactly one menu; a second association is rejected.
74. A vendor-standard menu cannot be edited but can be cloned.
75. `Add Sub-Menu` is disabled when a program shortcut is selected.
76. Renaming a program shortcut renames every shortcut with the same program ID across the tree,
    after an explicit confirmation.
77. Copying a menu option copies its entire subtree.
78. A menu shortcut to a report the user cannot run is either hidden or, if shown, blocked by the
    permission check on activation.
