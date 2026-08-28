# Run 03 — Sales Processing — Batch 12: InTouch CRM, Sales Leads and Sales Analysis

**Status: complete.** 8 articles. Findings 116–124.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **InTouch CRM Overview** | /articles/15203331450516 | EXTRACTED — the CRM architecture |
| 2 | **InTouch CRM Security** | /articles/15203331432724 | EXTRACTED |
| 3 | **InTouch CRM Access Levels** | /articles/15203331433236 | EXTRACTED — **a full access matrix** |
| 4 | **Enter a Sales Lead** | /articles/15203301489556 | EXTRACTED |
| 5 | Reassign Sales Leads | /articles/15203301496468 | EXTRACTED |
| 6 | Reassign Customers | /articles/15203331438228 | EXTRACTED |
| 7 | Special Occasion Dates | /articles/15203301104148 | EXTRACTED — thin |
| 8 | **Create a Sales Analysis Report** *(SABRE Report Entry)* | /articles/15203330904852 | EXTRACTED |

Discovered and queued: `Sales Lead System Control Settings` · `Activity Reason Settings` ·
**`Closing Probability Settings`** · `District Manager Settings` · `Merchandise of Interest Settings` ·
`Marketing Code Settings` · `Method of Contact Settings` · `Referred By Settings` ·
`Sales Lead Origin Settings` · `Special Occasion Settings` · `Type of Activity Settings` ·
`Product Group Settings` · `Manage Sales Leads` · `View Historical Sales Leads` ·
`Report Detailed Sales Leads Activity` · `Report Sales Leads Activity Comparisons` ·
**`Report Salespersons Closing Performance`** · `Report Summarized Sales Leads Activity` ·
`Review a Sales Analysis Report Format` · `Run a Sales Analysis Report` ·
`Column Detail Maintenance Screen`.

---

## B. Wiring findings

### FINDING 116 — InTouch is a CRM wired into order entry, the Up System, warranties and mailing lists
Integration targets (verbatim): "you can integrate CRM data directly into: **`Enter a Sales Order`,
            `Enter a Shopping Cart`, and `Enter a Service Order`**" · and "to and from numerous other
            STORIS modules and features, including: **the STORIS Up System, product Warranties (that is,
            follow up on expiring warranties), Demographics, Mailing Lists, eSTORIS, Report Builder.**"
Tracking (verbatim): "**prospects by store, sales associate, product interest, and likelihood of
            purchase** · sales activity, including customer activity and key dates · **salesperson
            closing activity** · **advertisement effectiveness**."
Automation: "generate **automatic ticklers for missed actions and next actions** to take on specific
            dates."
Evidence:   InTouch CRM Overview, /articles/15203331450516
Maps to:    **NEW**

> **Warranty expiry as a CRM trigger** is the detail worth pulling out — the system is designed to
> generate follow-up on expiring protection, which is a real revenue motion for a furniture retailer and
> ties batch 6's warranty machinery to the sales floor.
>
> **"Advertisement effectiveness"** is the other. Combined with `Marketing Code 1` and `2` on the order
> header (batch 1), `Order Source` (batch 1), `Source` on the shopping cart (batch 7) and the mailing-
> list source codes (batch 8), STORIS carries **at least five separate attribution fields**. Nothing in
> the audit says how they relate, and any rebuild will need one attribution model rather than five.

### FINDING 117 — CRM security is a five-level model that is explicitly *not* Regional Processing
Levels (verbatim): "**Corporate** users can update any sales lead. · **District Managers** can update any
            sales lead within their district. · **Store Managers** can update any sales lead within their
            store. **If a salesperson has leads in more than one store, store managers can update a
            salesperson's leads only in their own store.** · **Salespersons** can update only their own
            sales leads. · **None** - users who have not been defined as one of the above cannot update
            any leads."
Invariant (verbatim): "**These restrictions are distinct from the security restrictions you can apply
            using the Regional Processing feature, although the two features can overlap.**"
Fallback:   "Users **without** security clearance can still access sales leads (that is, call them up on
            the user's screen), however **the system restricts them to editing comments only.**"
Notification (verbatim): "**If the user who updates a lead is not the owner, the system sends a message
            to the owner notifying them that somebody else has updated their lead.**"
Assignment: "You assign security levels in the **User file**."
Evidence:   InTouch CRM Security, /articles/15203331432724
Maps to:    **W-050 — a seventeenth access-control mechanism**

> **A seventeenth distinct access model**, and the documentation says outright that it is separate from
> Regional Processing while overlapping with it. Run 2 established that STORIS access derives from
> log-on context rather than user grants; this adds a **parallel, lead-scoped hierarchy** on top.
>
> Two good design elements worth keeping. **Read-plus-comment is the floor** — nobody is locked out
> entirely, they simply cannot change someone else's lead. And **the owner is notified when someone else
> updates their lead**, which is a lightweight, sensible integrity control that the rest of the audit
> has no equivalent for.
>
> The store-manager caveat is precise and worth noting: a salesperson working across two stores has
> their leads split, and each store manager sees only their half.

### FINDING 118 — The access matrix is specified per routine, per level, per lead state
Structure (verbatim): five routine/condition combinations — **`Callback (Active)`** · **`Callback
            (Inactive)`** · **`Entry (Add)`** · **`Entry Update (Active)`** · **`Entry Update
            (Inactive)`** — each specified for all four numbered levels.
Representative rules (verbatim):
            *Sales Associate (level 4), Callback Active*: "**Default Salesperson from Log On – DO NOT
              Allow Overrides; Default Location from Log On, Allow Overrides.**"
            *Sales Associate, Entry Update (Active)*: "**'Owner' can change anything. Others can add
              comments.**"
            *Sales Associate, Entry Update (Inactive)*: "**Needs Entry of a Valid Salesperson and
              Location; Must Update to become owner and log-on location gets written to contact.**"
            *District Manager (level 2), Callback*: "Default Location All, Allow Overrides **within
              their CRM district**; Default District Manager from Log On – **DO NOT Allow Overrides.**"
            *Corporate (level 1)*: "**No Restrictions; Default – All for Salesperson and Location.**"
Callback gate: "**The system restricts users with security level 5 from accessing the Callback
            screen.**"
Level-4 callback constraint (verbatim): "the `Salesperson` field has only **2 valid entries: the user's
            salesperson number** [and] **the 'unassigned' salesperson number.**"
Evidence:   InTouch CRM Access Levels, /articles/15203331433236;
            InTouch CRM Security, /articles/15203331432724
Maps to:    **W-050 — the most completely specified access model in the audit**

> **This is the only place in three runs where an access model is published as a complete matrix** —
> four levels × five routine states, each with its defaults and override rules spelled out. Every other
> permission in the audit is a scattered sentence in a feature article.
>
> The mechanic that matters: **"Must Update to become owner and log-on location gets written to
> contact."** Touching an inactive lead **claims it** — ownership transfers to the updater and the
> contact record is re-stamped with their location. So working a dormant lead is an act of acquisition,
> not just an edit. **That is the fairness rule of the CRM**, exactly as `Retain Up Order` is the
> fairness rule of the sales floor (batch 11 F107), and it belongs to whoever designs lead routing.

### FINDING 119 — One active lead per customer, and closing one requires a reason
Invariant (verbatim): "**STORIS allows only one active lead for each customer or contact.**"
Closing (verbatim): "To close a lead, select **`Delete`** in the **`Action Taken`** field then select a
            reason in the **`Reason Entry`** window that appears."
Cross-store rule (verbatim): "**Salespeople have the ability to access their own leads, even if they are
            at different stores or districts.**" · "**District Managers will not have access to sales
            leads entered by salespeople who don't normally work within their district.**"
Fields:     *CONTACT* — Customer ID · names · Email · Telephone Numbers · Address ·
            **`Preferred Method`** · **`Mailing List Export`** · **`Birthdate`** · **`Due Date`**.
            *DETAILS* — Salesperson · Location · **`Origin`** · **`Referral Code`** ·
            **`Marketing Code`** · **`Merchandise`** · `Brand` · **`Probability`**.
            *UPDATE* — **`Action Taken`** · **`Next Update`** · **`Action to Take`** · New Comment ·
            Comments.
Evidence:   Enter a Sales Lead, /articles/15203301489556
Maps to:    **NEW**

> **One active lead per customer** is a hard uniqueness constraint, and closing is done by *deleting the
> action* with a mandatory reason — so the lead does not vanish, its closure is coded. That produces the
> loss-reason data behind `Report Salespersons Closing Performance`.
>
> The **`Next Update` / `Action to Take` pair** is the tickler mechanism from Finding 116: every update
> schedules the next one. And **`Probability`** (from `Closing Probability Settings`) makes the lead a
> weighted pipeline entry — the closest thing STORIS has to a forecast.
>
> The salesperson/district asymmetry is neat: **a salesperson follows their leads across stores, but a
> district manager's reach is defined by where the salesperson normally works**, not where the lead is.

### FINDING 120 — Reassigning leads and reassigning customers are two different operations
**Reassign Sales Leads** (verbatim): "If you enter **only the salesperson number**, the program
            reassigns **all lead records** for that salesperson… If you enter more detailed information,
            then **only that subset**." · "**The program creates a lead activity record… for each lead
            record you reassign along with an entry into the `Customer Comments` file.**" ·
            "**Reassigning sales leads… moves the contact, the quote, and the customer to the new
            salesperson while updating the appropriate fields in the `Customer Settings`**… **The system
            reassigns only customers with open leads.**"
            Filters: Current Salesperson Location · **`Merchandise Interest`** · **`Product Brand
            Interest`** · **`'From'/'To' Customer Name Cutoff`** · **`Reassignment Activity Type`**.
**Reassign Customers** (verbatim): "**customers must have existing contact records to be eligible**…
            This routine **changes the salesperson number in the customer file that in turn switches the
            `Contact` and `Lead` records** to reference this new salesperson."
Evidence:   Reassign Sales Leads, /articles/15203301496468;
            Reassign Customers, /articles/15203331438228
Maps to:    **NEW**

> **Two routines, opposite directions through the same three records.** Reassigning *leads* moves
> contact, quote and customer and writes back to Customer Settings — but **only for customers with open
> leads**. Reassigning *customers* changes the customer file and lets the change flow down to contact
> and lead.
>
> So a departing salesperson's book requires **both routines** to be moved completely: leads-first
> leaves customers without open leads behind; customers-first is broader but the article does not say it
> reassigns quotes. **Nothing documents the correct order**, and getting it wrong silently strands part
> of a book. That is a real operational risk when someone leaves.
>
> The audit trail is good, though: **a lead activity record and a Customer Comments entry per lead.**

### FINDING 121 — Ten settings files define the CRM's vocabulary
Named (verbatim): **`Activity Reason Settings` · `Closing Probability Settings` · `District Manager
            Settings` · `Merchandise of Interest Settings` · `Marketing Code Settings` · `Method of
            Contact Settings` · `Referred By Settings` · `Sales Lead Origin Settings` · `Special
            Occasion Settings` · `Type of Activity Settings`** — plus `Sales Lead System Control
            Settings` and `Product Group Settings`.
Evidence:   InTouch CRM Overview, /articles/15203331450516
Maps to:    **NEW**

> **Every classification a lead carries is a customer-defined list**: why it closed, how likely it is,
> what they want, where they came from, how to contact them, who referred them, what occasion applies,
> what activity happened. Twelve settings files for one feature.
>
> This is now the third instance of the pattern — run 2's purchase order types, batch 11's action codes,
> and now the entire CRM vocabulary. **STORIS ships frameworks and the customer supplies the meaning.**
> For the cutover that means the CRM's *content* — not just its data — has to be extracted, or the
> reason codes on ten years of closed leads become meaningless strings.

### FINDING 122 — Special occasion dates are recurring month/day events, unbound to a year
Fields (verbatim): **`Month`, `Day`** · **`Event`** · Add · grid
Related:    `Birthdate` on the contact; `Special Occasion Settings` defines the event types.
Evidence:   Special Occasion Dates, /articles/15203301104148;
            Enter a Sales Lead, /articles/15203301489556
Maps to:    **NEW — small but well-designed**

> **Month and day without a year** — anniversaries, birthdays, "we replace their mattress every
> spring". That is the correct model for recurring outreach and it is deliberately different from the
> contact's `Birthdate`, which is a full date.
>
> Combined with the tickler mechanism (Finding 119), this is a **recurring-contact engine**: the CRM can
> surface a customer every year on a date that matters to them. For a business whose repurchase cycle is
> measured in years, that is arguably the most commercially useful thing in the Salesperson subsection.

### FINDING 123 — Sales Analysis is a five-tab report builder with one detail field and scaled columns
Tabs (verbatim): **`Heading` · `Sorting` · `Details` · `Selection` · `Columns`**
*Sorting*: `Sort Field` · `Sort Order` · `Alignment` · **`Break`** · **`Page`** — "determine the
            **highest** levels of organization".
*Details* (verbatim): "determine the **lowest** level of organization… **You can define only one detail
            field.**" — `Detail Field` · Column · Key · Description · Type · Sort Order · Alignment.
*Selection*: `Select Field` · `Type` — "You specify either a **list or range**."
*Columns*: `Column ID` · **`Column Header 1` / `Column Header 2`** · `Print on Report` ·
            `Column Width` · **`Scaling Code`** → **`Column Detail Maintenance`** screen.
Also:       `Report Name` · **`Report Width`** · two heading lines.
Companion routines: `Review a Sales Analysis Report Format` · `Run a Sales Analysis Report`.
Alias:      **`SABRE Report Entry`**
Evidence:   Create a Sales Analysis Report, /articles/15203330904852
Maps to:    **NEW**

> A **second report builder**, distinct from the `Report Builder` run 2 kept finding, aliased `SABRE`.
> The constraint that matters is **exactly one detail field** — so a sales analysis report is
> fundamentally "one dimension broken down by sorted groups, with defined columns", not a free-form
> cross-tab.
>
> **`Scaling Code`** is unusual: numeric columns can be scaled (thousands, millions), which is a
> presentation decision stored in the report definition. And **`Break` / `Page`** on sorts means
> subtotalling and pagination are part of the sort spec — the same shape as the three-level sorts run 2
> found across the merchandising reports.
>
> Since batch 11 established that **commission adjustments optionally update the files `Customized
> Sales Analysis` reads**, reports built here can disagree with delivered business by configuration.

### FINDING 124 — The CRM writes to the customer master, and the mailing-list flag lives on the lead
Write-backs found:
- Reassigning leads "**updat[es] the appropriate fields in the `Customer Settings` such as the
  `Salesperson` field**" *(F120)*
- Reassigning customers "**changes the salesperson number in the customer file**" *(F120)*
- Updating an inactive lead "**log-on location gets written to contact**" *(F118)*
- Lead reassignment writes "**an entry into the `Customer Comments` file**" *(F120)*
- The lead carries **`Mailing List Export`** and **`Preferred Method`** *(F119)*
Evidence:   accumulated across this batch
Maps to:    **NEW — and it closes a batch-8 question**

> Batch 8 found a separate **`Customer History` file** holding a duplicate customer header for mailings,
> and asked whether the two synchronise. **This is a third writer into the customer picture**: the CRM
> writes salesperson, location and comments back to `Customer Settings`, and holds `Mailing List Export`
> and `Preferred Method` on the *lead*.
>
> So contact preferences are split across at least three places — the customer master, `Customer
> History`, and the lead — and **which one a mailing list actually reads is not stated anywhere.** Given
> batch 8 already flagged consent being stored as a free-form demographic answer, **communication
> preference in STORIS has no single source of truth.** That is the most consequential data-model gap
> this batch found, and it is a live compliance concern rather than a migration inconvenience.

---

## C. Screen and field inventory

**Enter a Sales Lead** — `Contact` · `Created on`.
*CONTACT*: Customer ID · First Name · Last Name · Email · Telephone Numbers · Address ·
**`Preferred Method`** · **`Mailing List Export`** · **`Birthdate`** · **`Due Date`**.
*DETAILS*: Salesperson · Location · **`Origin`** · **`Referral Code`** · **`Marketing Code`** ·
**`Merchandise`** · `Brand` · **`Probability`**.
*UPDATE*: **`Action Taken`** *(`Delete` closes the lead)* · **`Next Update`** · **`Action to Take`** ·
`New Comment` · `Comments` · Actions · right-click menus.

**Reassign Sales Leads** — Current Salesperson · New Salesperson · Current Salesperson Location ·
**Merchandise Interest** · **Product Brand Interest** · **'From'/'To' Customer Name Cutoff** ·
**Reassignment Activity Type**.

**Reassign Customers** — Current Salesperson · New Salesperson.

**Special Occasion Dates** — **Month** · **Day** · **Event** · Add · grid.

**Create a Sales Analysis Report** *(SABRE Report Entry)* — tabs **Heading · Sorting · Details ·
Selection · Columns**. `Report Name` · **`Report Width`** · Heading Line 1 / 2 ·
*(Sorting)* Sort Field · Sort Order · Alignment · **Break** · **Page** ·
*(Details)* Detail Field · Column · Key · Description · Type · Sort Order · Alignment ·
*(Selection)* Select Field · Type · *(Columns)* Column ID · Column Header 1 / 2 · Print on Report ·
Column Width · **Scaling Code** → Column Detail Maintenance.

---

## D. Control settings catalog

| Setting file | What it defines |
|---|---|
| `Sales Lead System Control Settings` | Basic lead parameters; **access rights on the lead being edited** |
| **`Closing Probability Settings`** | The `Probability` values on a lead |
| `Activity Reason Settings` · `Type of Activity Settings` | Action taken / to take vocabulary |
| `Sales Lead Origin Settings` · `Referred By Settings` · `Marketing Code Settings` | **Three separate attribution vocabularies** |
| `Method of Contact Settings` | `Preferred Method` values |
| `Merchandise of Interest Settings` · `Product Group Settings` | Product interest tracking |
| `Special Occasion Settings` | Event types for recurring dates |
| `District Manager Settings` | CRM district definition *(distinct from Regional Processing districts)* |
| CRM security level | **User file** | Corporate / District Manager / Store Manager / Salesperson / None |

---

## E. Security permissions catalog

| Mechanism | System | Gates |
|---|---|---|
| **CRM access level (1–5)** | **User file** | Which leads a user may update; five levels |
| `Create a User CRM InTouch security settings` | Create a User | District/store manager lead creation and reassignment |
| ownership | (per lead) | **"Owner can change anything. Others can add comments."** |
| level 5 exclusion | (CRM) | **No access to the Callback screen** |
| owner notification | (automatic) | Owner is messaged when someone else updates their lead |

---

## F. State machines and enumerations

**CRM access levels (5)** — `1` Corporate · `2` District Manager · `3` Store Manager ·
`4` Sales Associate · `5` None *(comment-only; no Callback access)*.
**Routine/condition combinations in the access matrix (5)** — Callback (Active) · Callback (Inactive) ·
Entry (Add) · Entry Update (Active) · Entry Update (Inactive).
**Lead states** — **active** *(one per customer)* · **inactive** *(updating claims ownership)* ·
closed *(via `Action Taken` = `Delete` plus a reason)*.
**Attribution fields across the run (5+)** — `Order Source` · `Marketing Code 1` / `2` ·
cart `Source` · lead `Origin` · `Referral Code` · mailing `Source Code`.
**Contact-preference locations (3)** — customer master · `Customer History` · lead
(`Preferred Method`, `Mailing List Export`).
**Sales Analysis structure** — many sort levels *(with Break and Page)* · **exactly one detail field** ·
list-or-range selections · defined columns with scaling.
**Report builders in the audit (2)** — `Report Builder` · **`Sales Analysis` (SABRE)**.

---

## G. Sequencing rules

1. Only one active lead may exist per customer or contact.
2. Closing a lead requires selecting `Delete` at `Action Taken` and supplying a reason.
3. Updating an **inactive** lead transfers ownership and stamps the log-on location onto the contact.
4. A non-owner updating a lead triggers a notification to the owner.
5. Users without clearance may open leads but edit comments only.
6. Reassigning leads moves contact, quote and customer — **only for customers with open leads**.
7. Reassigning customers changes the customer file, which flows to contact and lead records.
8. Every lead reassignment writes a lead activity record and a Customer Comments entry.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Sales Lead System Control Settings`** — determines "the access rights the current user has on the
  lead being edited", so it modifies the published matrix. Unread.
- **`Manage Sales Leads`** — the callback/worklist screen the access matrix is largely about.
- `Report Salespersons Closing Performance` · `Report Detailed / Summarized Sales Leads Activity` ·
  `Report Sales Leads Activity Comparisons` · `View Historical Sales Leads`.
- The other nine CRM settings files.
- `Run a Sales Analysis Report` · `Review a Sales Analysis Report Format` ·
  `Column Detail Maintenance Screen`.

**Documented but ambiguous**
- **Which store of contact preference a mailing list actually reads** — customer master, `Customer
  History`, or the lead. **The most important open question in this batch.**
- **How the five attribution fields relate** — order source, two marketing codes, cart source, lead
  origin, referral code, mailing source code.
- **The correct order of `Reassign Sales Leads` and `Reassign Customers`** when a salesperson leaves.
  Each covers a different population and neither article mentions the other.
- **What a CRM district is** — `District Manager Settings` is separate from Regional Processing's
  districts, and the two "can overlap".
- **`Due Date`** on the contact — distinct from `Next Update`; undefined.
- **`Reassignment Activity Type`** — presumably the activity record written; values not given.
- **Whether closing reasons are reportable** as loss reasons; implied by the closing-performance report.
- **`Scaling Code`** values on sales analysis columns.
- **What "quote" means** in "moves the contact, the quote, and the customer" — the order-type quote from
  batch 1, presumably, but the linkage is unstated.

**Inferences (not in section B)**
- The mailing list most likely reads `Customer History`, since batch 8's article says that file is used
  "in mailings and reporting" — but the lead carries `Mailing List Export`, and **nothing reconciles
  them**. Recorded as an inference, not a fact.
- `Due Date` is plausibly a follow-up deadline distinct from the scheduled next update; not stated.
- The two reassignment routines are presumably run leads-first then customers; no article says so.

---

## I. Unknown unknowns

- **A CRM with its own five-level security model**, explicitly separate from Regional Processing.
- **A published access matrix** — four levels × five routine states — the only one in three runs.
- **Updating an inactive lead claiming ownership** and re-stamping the contact's location.
- **Owner notification when someone else edits a lead.**
- **Comment-only access as the floor**, rather than exclusion.
- **One active lead per customer**, closed by a coded reason.
- **Warranty expiry as a CRM follow-up trigger.**
- **Twelve settings files defining one feature's vocabulary.**
- **Recurring month/day special occasions** without a year.
- **Two reassignment routines covering different populations**, with no stated ordering.
- **A second report builder (SABRE)** limited to one detail field, with column scaling.
- **Contact preference split across three stores** with no stated source of truth.
- **Salespeople following their leads across stores** while district managers are bounded by where the
  salesperson normally works.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| InTouch | STORIS's CRM; leads, contacts, ticklers and closing performance |
| CRM access levels 1–5 | Corporate · District Manager · Store Manager · Sales Associate · None |
| Owner | The salesperson on a lead; only the owner may change it |
| Callback | The lead worklist screen; inaccessible at level 5 |
| Active / inactive lead | One active lead per customer; updating an inactive one claims ownership |
| Probability | Closing likelihood from Closing Probability Settings |
| Next Update / Action to Take | The tickler pair scheduling the next contact |
| Mailing List Export | Lead-level flag; relationship to the customer master and Customer History unstated |
| Special Occasion | Recurring month/day event for outreach |
| SABRE | Alias for the Sales Analysis report builder |
| Scaling Code | Column presentation scale in a sales analysis report |

---

## Contract adjudication — batch 12

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** | **CONFIRMED inverted, seventeenth mechanism** | A five-level CRM security model, distinct from Regional Processing, published as a full matrix (F117, F118) |
| **W-012** | **relevant** | Ticklers, next-update scheduling and recurring occasion dates (F119, F122) |
| **W-061** | **relevant** | Sales analysis reports can diverge from delivered business by setting (F123, with batch 11 F109) |
| **W-052 / W-053** | **not documented in this batch** | — |

---

## Next — batches 13+: Sales Views and Reports (139 articles)
