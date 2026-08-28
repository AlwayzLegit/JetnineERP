# 08 — Scheduling

Sources: the `Add to Schedule a Process` field on Create a Report, and the *Schedule a Process*
article (`System Administration → System Tools → Schedule a Process`).

Schedule a Process is a general job scheduler covering ~90 STORIS processes (purges, imports,
protection-plan transmissions, EOD/EOM generation, replenishment, and so on). Only the reporting
slice is in scope here — but note the pattern: **one scheduler, many process types**, with per-process
capability flags. Build it that way.

---

## How a Report Builder report becomes schedulable

1. Check **`Add to Schedule a Process`** on the builder's Headings tab.
2. The scheduler then offers that report as a process. **Its label in the scheduler grid comes from
   the report's `Description` field**, not its `Report Name`.

## Constraints specific to Report-Builder-created scheduled processes

Straight from the docs — these are hard rules, not defaults:

- **`Output Settings` is inactive.**
- **The only available output type is `Report Archive` (`R`).** Results land in Review Archived
  Reports (`05`); there is no printer, no PDF-to-screen, no Excel drop.
- **`Send Completion Notification To` is active** — email notification on completion is the
  delivery mechanism.

This is a sound design and worth keeping: a scheduled run has no user at a screen, so the only
sensible destination is durable storage plus a notification. The same constraint appears across many
built-in scheduled reports (AR/AP/Financing Aged Trial Balance, Value of Inventory, Outstanding Gift
Certificates, Merchandise Received But Not Invoiced, …) — all documented as *"Send Output to is
limited to R - Report Archive."*

---

## Schedule definition fields

| Field | Rules |
|---|---|
| `Description` | The process to schedule; search picks from the list. Selecting an existing entry loads it for edit. |
| `Process` | The process type. For our purposes: the Report Builder report. |
| `Type` | `Day of Week` — run on one or more weekdays · `Date of Month` — run on one or more days 1–31. |
| `Day` | Inactive until `Type` is set, then lists weekdays or month-days accordingly. Selecting 29/30/31 warns that in shorter months the run falls on **the last day of that month**. |
| `Time` | Military time `HHMM`, `0000`–`2359`. Actions offer **`Multiple Times`** (several runs in one day) and **`Specify Interval`** (repeat at an interval within a time window). Each scheduled instance carries its own run-time options. |
| `Run as User` | Any valid user ID. Determines the identity the process runs under, and is written to audit comments and message logs. **It also becomes the `Creator` column in Review Archived Reports.** Blank ⇒ the initials of the user who launched the Process Scheduler; failing that, the Schedule a Process ID. |
| `Send Output To` | Recipient **user codes** for emailed output. Only available for a couple of built-in processes (View Summary of Sales Activity, Sales Performance Report) — not for Report Builder reports. Users without an email address on file raise a warning and are skipped. |
| `Send Completion Notification To` | Email address(es) — an extra action allows multiple. |
| `Report Only If Errors` | Notify only on error. **Active only for data-import processes.** |
| Grid | Shows the scheduled day/time pairs. Double-click a line to edit. Populates in entry order, then re-sorts on save: days of week by time, then days of month by time. |
| Actions → `Enter Process Preferences` | Opens the process's own pre-screen so run-time options can be fixed for the schedule. |

### Email configuration
Email parameters live in **Notifications Control Settings → Email Configuration tab → the
"Scheduled Process Completion" row.**

### The scheduler must actually be running
Scheduled processes execute as **phantoms**, and only if the **Process Scheduler phantom has been
launched** — governed by `Start Scheduler Phantom` in General System Control Settings.

Our analogue: a worker/daemon whose health is visible. A silently-dead scheduler that leaves reports
un-run is one of the classic ERP failure modes. Surface **last-heartbeat** and **next-scheduled-run**
in an admin view, and alert when a run is missed.

---

## Date codes and scheduled runs — the key interaction

From the Prompts tab (`02`): a date-code-enabled prompt exposes `TDAY`, `YDAY`, `CPTD`, `LPTD`, and
**"the date code is calculated each time the scheduled report is run."**

That is the whole point. Store the code, resolve at execution. A scheduled weekly report using `LPTD`
reports last period every week; one with hard-coded dates reports the same frozen window forever.

Note the documented caveat on some built-in scheduled reports: the `CUS` (custom) date option is
**not available** when scheduled, and certain relative codes do not update a displayed "As Of" field
in the preferences screen even though the date **is** calculated dynamically at run time. Expect to
disable absolute-date prompt modes for scheduled runs, and to show the resolved window in the output
(see the run-time-options footer convention in `04`).

---

## Related scheduled reporting processes worth knowing

- **`Schedule Daily Reports`** — end-of-day processing as an alternative to running Generate Daily
  Reports on demand. Reports generated this way are **archived** and read through Review Archived
  Reports. **Only one instance per day** may be scheduled; a second attempt errors.
- **`Generate Monthly Reports`** — EOM processing. `Type` must be `Date of Month`, and **only one
  event may be scheduled**. Also the process that purges retention-bound data (e.g. the
  `DAILY.DETAIL` receipts data behind Report Summarized Sales Receipts — see `10`).
- Note the documented warning that a report run via the scheduler may **not match** the same report
  run via EOD/EOM, because the EOD/EOM versions are *period-specific*. If our ERP offers both paths,
  make the period basis explicit on the output.

---

## Design guidance

- Model per-process capability flags: `supports_run_as_user`, `supports_completion_notification`,
  `allowed_output_types`, `supports_preferences`, `singleton_per_day`. The docs' long list of
  per-process exceptions is what happens without them.
- Store the schedule as `(type, days[], times[])` rather than a cron string — it maps directly to the
  UI and to the "warn about day 31" rule.
- Persist a **run history** per schedule: fired-at, finished-at, status, resulting archive ID, error.
  The docs give no such view, and its absence is a real gap.
