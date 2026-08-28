# 05 — Collections Activity Log

**Source:** https://storis.zendesk.com/hc/en-us/articles/15295156268820-Collections-Activity-Log
**STORIS area:** STORIS ERP > Accounting > Collections

---

## Access paths (verbatim)

> Accounting > Collections > Collections Activity Log
> via the Comments button on the **Collector Review - Customer Update Screen**.

Two entry points, and they behave differently — see the Customer Code field.

## Purpose

View and/or print the contents of the Collections Activity Log for a selected customer.

> This log is an **internal file STORIS uses to track changes to Collections records.** The file also includes comments entered by STORIS users via the **Update Comments** option on this screen.

So this is two things fused into one screen: an **immutable audit trail** of system-generated change records, and a **manual comment log** that users append to. Both render in the same output.

> The system logs all changes to Collections records, for example the following:

The source sentence ends there — the example list is absent from the published article. See open questions.

> **NOTE:** To include changes to the **Collections Settings** in this log, you must select the **Collections** file in the **Track Settings Activity** routine.

Settings-level changes are **opt-in** and controlled elsewhere. Record-level changes are always logged; settings changes are logged only if Collections is enabled in Track Settings Activity.

## Fields

### Customer Code

Enter the code of the customer whose collections activity log you want to view. Clicking the Search button opens the **Search for a Customer** screen for selection.

> Note that if you access this screen from the **Collector Review - Customer Update Screen**, the customer selected on that screen **defaults here and you cannot edit the field**.

Context-dependent: editable from the menu path, locked when entered from Collector Review.

### Date Code

> This field **defaults to Custom Dates and you cannot edit it.** Use the Starting Date and Ending Date fields to restrict the output of the routine to a range of dates.

A permanently-fixed field. It exists because STORIS reports share a common date-code control (This Month, Last Quarter, etc.); this report pins it to Custom Dates. Render it as a locked display value, not a dropdown.

### Starting Date

Enter the starting date (if any) of the date range. **If you leave the field blank, you select the earliest available date.**

### Ending Date

Enter the ending date (if any) of the date range. **If you leave the field blank, you select the latest available date.**

Blank means unbounded on that side, not "today" and not an error.

### Update Comments

> To access a text box via which you can add manual comments, check the box at this field. Otherwise, leave the box blank.

A checkbox that reveals a comment entry text box. This is the write path into the log.

### Comments

All collections comments (if any) associated with the selected customer display here.

Note: **Comments displays all comments for the customer**, with no stated date filtering — the source scopes the date range to "the output of the routine". Whether the Comments panel honours the date range is not stated.

### Send Output to

The output destination of the report data appears. To select a different destination, click the Actions button and select **Output Settings**.

### Export Path

> Because the output options for this routine are **limited to Screen and Printer**, this field is inactive.

Hard constraint: this report cannot be exported to file. Two destinations only.

## Actions button

- **Output Settings** — change the output destination.
- **Print Comments** — send the report to the output destination specified at the Send Output To field.

## Behavior rules

1. Reachable from the Collections menu and from the Comments button on Collector Review - Customer Update.
2. Entered from Collector Review, Customer Code is pre-filled and locked.
3. Entered from the menu, Customer Code is enterable and searchable via Search for a Customer.
4. Date Code is fixed at Custom Dates and is not editable.
5. Blank Starting Date = earliest available; blank Ending Date = latest available.
6. Checking Update Comments reveals a text box for manual comment entry.
7. Existing comments for the customer are displayed in the Comments area.
8. Output destinations are limited to Screen and Printer; Export Path is always inactive.
9. Print Comments sends the report to the current destination.
10. System-generated change records are always captured. Collections **Settings** changes are captured only when the Collections file is selected in Track Settings Activity.

## Data model `[INFERRED]`

- Collections activity log table: customer ref, timestamp, actor, change type, before/after values, and an entry-kind discriminator separating system change records from user comments.
- User comments carry author and timestamp; they are appended, and the source gives no indication they can be edited or deleted.
- Track Settings Activity holds a per-file opt-in flag; Collections is one selectable file.

## Acceptance criteria

- Opening from the Collections menu allows customer entry and search.
- Opening from Collector Review pre-fills the customer and disables the field.
- Date Code renders as Custom Dates and cannot be changed.
- Leaving Starting Date blank includes the oldest entries.
- Leaving Ending Date blank includes the newest entries.
- Checking Update Comments reveals the comment text box; the saved comment then appears in the log.
- Export Path is rendered inactive.
- Only Screen and Printer are offered as output destinations.
- A change to a Collections record produces a log entry without any opt-in.
- A change to Collections Settings produces a log entry only when Collections is selected in Track Settings Activity.

## Open questions

- **The list of logged change types is missing from the published article** ("for example the following:" followed by nothing). Needs a live instance or STORIS support to enumerate.
- **Does the Comments panel honour Starting/Ending Date,** or does it always show all comments for the customer? The wording differs between the two.
- **Are comments editable or deletable** once entered? Not stated. An audit log implies no.
- **Who is recorded as the author** of a manual comment, and is it shown? Not stated.
- **What is the report layout** — columns, ordering, grouping? Not stated.
- **Relationship to Collector Review workflow.** Whether adding a comment here advances any collections status is not stated.
