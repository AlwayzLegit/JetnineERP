# Run 07 — STORIS `System Administration` — Coverage queue

**Why this run exists.** It was not in the original six-run queue. `AUDIT-CLOSEOUT.md` named it as
recommended next step #2, because **sixteen settings records referenced across all six runs were
never read**, and every one of them lives here. This run is scoped to close those gaps first and then
work the section systematically.

**Scope confirmation first**, per the working agreement: *"Before you open anything, show me the
section's subsection list and article counts so I can confirm the scope."* Listing pages were read to
enumerate only.

**Read-only.** No form submitted, no setting saved, no process run. This is the most dangerous section
in the help centre to be careless in — it documents purging, importing, and every control record in
the system. Nothing will be exercised.

Category: `/hc/en-us/sections/51426760816276-System-Administration`

---

## Subsection list and article counts

| # | Subsection | id-slug | Articles |
|---|---|---|---|
| 1 | **Customer Settings** | 15233769370388-Customer-Settings | **137** |
| 2 | **Vendor Settings** | 15242970677780-Vendor-Settings | **94** |
| 3 | **System Administration** *(nested)* | 15172952559508-System-Administration | **93** |
| 4 | **Product Settings** | 15233908450836-Product-Settings | **88** |
| 5 | **System Control Settings** | 15172950973716-System-Control-Settings | **87** |
| 6 | **User Settings** | 15172979328660-User-Settings | **49** |
| 7 | **System Administration Views and Reports** | 51935643676820-System-Administration-Views-and-Reports | **45** |
| 8 | **Account Setup** | 51426789010964-Account-Setup | **4** |
| 9 | **Purging Data** | 51426864377108-Purging-Data | **1** |
| 10 | **Importing Data** | 51426805698068-Importing-Data | **1** |
| | **Total** | | **599** |

*(Pagination verified per subsection: 30-per-page with last-page counts of 17, 4, 3, 28, 27, 19, 15
respectively; Account Setup, Purging Data and Importing Data are single-page.)*

**599 articles — larger than any previous run**, and larger than runs 05 and 06 combined by an order
of magnitude. This is the section the other six kept pointing at.

---

## The sixteen carried gaps, and where each lives

The audit's whole reason for coming here. **Twelve are now located; four are still to be found.**

| Record | Located in | id | Cited in runs |
|---|---|---|---|
| **Point of Sale Control Settings** | System Control Settings | **15186502233620** | **all six** — never enumerated |
| **Costing Control Settings** | System Control Settings | **15186501540884** | 04 *(the last piece of run 02's cost-exception chain)* |
| **Inventory Control Settings** | System Control Settings | 15186452794132 | 02, 04, 08–10 |
| **General System Control Settings** | System Control Settings | 15186501982740 | 04, 05, 06 |
| **Service Control Settings** | System Control Settings | 15186453256980 | 05 *(five named fields)* |
| **Route Capacity Control Settings** | System Control Settings | 15186453252372 | 04 |
| **Route Mapping Control Settings** | System Control Settings | 15186502470164 | 04 |
| **Bar Code Control Settings** | System Control Settings | 15186501558292 | 04, 06 |
| **EDI Control Settings** | System Control Settings | 15186501753236 | 04 |
| **Stock Reservation Settings** | System Control Settings | 15186451768852 | 04 |
| **Zero-Cost Exception Handling** | System Control Settings | 15186452150932 | 04 *(named beside Cost Exception Types)* |
| **Terminal Settings** | System Control Settings | 15186452531860 | 06 |
| `Warehouse/Store Location Settings` | *(to locate — likely System Administration nested)* | — | 04 *(six batches, three named tabs)* |
| `Status Code Settings` | *(to locate)* | — | 03, 04, 05 *(five articles; one value ever named)* |
| `Alert Code Settings` | Customer Settings *(per search)* | — | 04 *(hold codes `C7`/`C8`; a fraud engine)* |
| `Warranty Settings` | *(to locate — likely Product Settings)* | — | 05 |
| `Distribution Status Settings` | *(to locate — likely Product Settings)* | — | 04 |
| `Third Party Logistics Settings` | *(to locate)* | — | 04 |
| `Tracked Storage Location Settings` | *(to locate)* | — | 04 |

**Bonus finds already visible in the System Control Settings inventory**, each closing a named gap
from an earlier run:

- **`Customer Rewards Control Settings`** (15186452549524) — run 03 batch 16 F158 called membership
  rewards *"the single largest functional area in Sales Processing that we cannot reconstruct"* and
  recommended a vendor question rather than more reading. **There is a control record.**
- **`STORIS Messenger Control Settings`** (15186501104788) — run 06 F317–F322 documented the
  application; this is its configuration.
- **`Warehouse Management Control Settings`** (36103270474004) — run 04 F266 found a third-party WMS
  can own a location and flagged it as an unknown unknown.
- **`Sales Order Reservations`** (15186501107604) and `Stock Reservation Settings` — run 04 F190/F238
  and run 06 F328 established that reservation timing and piece-assignment timing are two separate
  settings; these are where the rest of that model lives.
- **`Report Archive Retention Days`** (15186502232724) — a tenth retention chain.
- **`System Notifications`** (15186452148500) and **`Event Notification Control`** (16918023610516) —
  run 06 F327 found a fourth notification channel in one sentence and noted *"no article anywhere
  describes how STORIS notifies people."*

---

## Batch plan

Priority order is set by the audit's own gaps, not by the section's ordering.

| Batch | Focus |
|---|---|
| **1** | **`Point of Sale Control Settings`** and **`Costing Control Settings`** — the two most-cited unread records in the audit |
| 2 | `Inventory Control Settings` · `General System Control Settings` · `Stock Reservation Settings` · `Sales Order Reservations` · `Zero-Cost Exception Handling` |
| 3 | Logistics cluster: `Route Capacity` · `Route Mapping` · `Bar Code` · `EDI` · `Warehouse Management` · `Terminal Settings` |
| 4 | `Service Control Settings` · `Customer Rewards Control Settings` · `STORIS Messenger Control Settings` · `System Notifications` · `Event Notification Control` |
| 5 | Remainder of System Control Settings (87) with a coverage statement |
| 6–7 | **User Settings** (49) — the `Create a User/Group Actions - <Module> Security` records, and the consolidated permission catalogue |
| 8–10 | **Customer Settings** (137) — including `Alert Code Settings` and `Status Code Settings` |
| 11–12 | **Product Settings** (88) — including `Warranty Settings`, `Distribution Status Settings` |
| 13–15 | **Vendor Settings** (94) — including `Third Party Logistics Settings` |
| 16–18 | **System Administration** nested (93) — including `Warehouse/Store Location Settings`, `Tracked Storage Location Settings` |
| 19–20 | **Views and Reports** (45), `Account Setup` (4), `Purging Data` (1), `Importing Data` (1) |

Findings continue the single sequence: **run 07 starts at finding 337.**

---

## Contracts expected this run

This is where the *settings* behind every contract live, so all of them are in play — but the
adjudication here is different in kind. Previous runs asked *"what happens?"*; this run asks
**"what governs it, and what are the values?"** Expect a high rate of **enumeration closure**:
the audit is carrying roughly forty named-but-unpublished enumerations, and their value lists should
be here.

Particular targets:
`W-024` *(hold codes — `Alert Code Settings` behind `C7`/`C8`)* ·
`W-041` / `W-061` *(`Costing Control Settings`, `Zero-Cost Exception Handling`)* ·
`W-050` *(the User Settings security records — a consolidated permission catalogue is the natural
deliverable)* · `W-055` / `W-056` *(`Stock Reservation Settings`, `Sales Order Reservations`)* ·
`W-064` *(retention settings across every record)*.

## Open questions carried in

**All thirteen undefined terms** from `AUDIT-CLOSEOUT.md` — fly-by fulfillment · Staging Area ·
Float Label · phantom · `Ship Direct` · `CFO Fields` · `Repossession Maximum $` ·
Inventory Formation · Product Family · `Bypass Interim` · `Times per Day` · dollars-only adjustment ·
**`Closed Without Completion`**. Several are settings-adjacent and may be defined by the records that
use them. **`Status Code Settings` is the single likeliest source** and it is in this section.

**The warehouse-wide replacement search** (run 04, three call sites, no description) — if it is
governed by a setting, that setting is here.

**`Switch User`** (run 06 F325) and **`Purge Messenger Activity`** (run 06 F326) — named routines
never read; `Purging Data` and `User Settings` are their likely homes.
