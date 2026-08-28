# Run 03 — Sales Processing — Batch 16 (final): Coverage sweep of `Sales Views and Reports`

Status: complete. Findings 153–164. Read-only throughout; no form submitted, no setting saved,
no process run. Every report article in this subsection carries a **Run** button; it was never
pressed. Where an article says "choose Run to produce the report", that sentence is quoted from
the documentation, not performed.

This batch closes run 03. Its purpose is different from batches 1–15: `Sales Views and Reports`
is 139 articles of *inquiry and report* documentation, and inquiries do not write. The wiring
value here is not in the reports themselves but in **what a report reveals about the file it
reads, the retention setting that empties that file, and the account it exists to audit**. Ten
articles were read for wiring; the rest are inventoried and excluded with reasons in section A.

---

## A. Coverage log

### Read this batch

| # | Article | URL (id-slug) | Status |
|---|---|---|---|
| 1 | View an Existing Sales Order | 15295211514260 | read |
| 2 | View Web Transactions | 15295213233172 | read |
| 3 | Volume Rebate Status | 15203235628692 | read |
| 4 | Report Open Orders on Credit Hold | 15203012631828 | read — **new hold-code behaviour** |
| 5 | Report Sales Exceptions | 15203234860564 | read — **exception recording semantics** |
| 6 | Report Outstanding Gift Certificates | 15203012635540 | read |
| 7 | View Product Availability | 15295156878356 | read — **Dynamic Tab Settings, ATP** |
| 8 | View Customer Rewards | 16918509838484 | read — **membership rewards module** |
| 9 | Report Merchandise Received But Not Invoiced | 15203012855700 | read — **received-not-recorded audit** |
| 10 | View Customer Summary Information | 15295156487700 | read — **DTS-only screen** |
| 11 | Report Summarized Sales Receipts | 15203234860820 | read — **`DAILY.DETAIL` retention chain** |
| 12 | Report Merchandise Returned But Not Credited | 15203028984852 | read — **returned-not-recorded audit** |
| 13 | Report Deleted Orders with Authorized Financing | 15202742220564 | read |

### Subsection inventory — all 139 articles enumerated

The full list was captured across five listing pages (30 + 30 + 30 + 30 + 19 = **139**, matching
the section count in `00-COVERAGE-QUEUE.md`). It falls into six families:

| Family | Count (approx.) | Disposition |
|---|---|---|
| **Multiple *X* Selection Window** | 17 | **Deliberately excluded.** Template instances of one pattern, established in run 02 batch 11 (F145): a lookup window that returns a multi-value list into a run-time option. Named instances seen here: Customer · District Manager · Fabric Group · Finance Provider · Line Status · Marketing Code · Method of Contact · Miscellaneous Fee · Option Type · Order · Price Level · Product · Product and Quantity · Salesperson · (and others on page 1). Each is worth reading only for the *enumeration* it selects from, and every one of those enumerations was already captured in batches 1–15 from the screen that uses it. |
| **`Report …` run-time-option pages** | ~48 | Sampled. Ten read in full (above); the remainder follow one fixed shape — a one-paragraph purpose, a Regional Processing note, a flat list of run-time option field names, `Send Output to` / `Export Path`. The wiring content is the purpose sentence; where a report exposes a file, a retention setting or a GL account, that report was read. |
| **`View …` / inquiry screens** | ~55 | Sampled. Read where the inquiry exposes a mechanism (availability, rewards, customer summary); excluded where it is the read-only twin of an entry screen already dissected in batches 1–15 — `View a Customer's Open Orders`, `View Order Discounts`, `View Shopping Cart`, `View Salesperson Activity`, `View Archived UPs`, the six receivables/financing viewers (batch 14), the two protection-plan viewers (batch 06/15). |
| **Lookup / selector screens** | ~9 | Excluded. `Phone Number Lookup` · `UP System Action Code Lookup` · `Shopping Cart Selector Screen` · `Search for a Customer` · `Search for a Cart by a Specific Product` · `Transaction Detail Screen` · `Active Locations List` · `Credit Status Results` · `Callback Summary Results`. Navigation aids; the codes they look up are enumerated elsewhere. |
| **Activity logs** | 4 | Excluded. `Customer Activity Log` · `Financing Activity Log` · `Lead Activity Log` · `Customer Order Profile Inquiry`. Audit-trail viewers; the events they log were captured at the point the event is created. |
| **Rewards** | 3 | `View Customer Rewards` read; `View Reward Gift Certificates` and `View Reward Points Earned` inventoried — see F158, which flags this whole module as under-documented. |

**Coverage statement for the run:** all 405 articles in `Sales Processing` are inventoried in
`00-COVERAGE-QUEUE.md`. 266 in the four transactional subsections were worked through batches
1–15. Of the 139 in `Sales Views and Reports`, 13 were read here and the remaining 126 are
classified above with a stated reason for exclusion. **No article was skipped silently.**

---

## B. Wiring findings

### FINDING 153 — A credit hold is not released when it is approved; End of Day releases it, and until then the order carries both the hold code and the word "Approved"

- **Invariant:** approval and hold-release are separated by a batch process.
- **Evidence** — `Report Open Orders on Credit Hold`:
  > "The credit hold code column on the report output may show "Approved" following the original hold code applied to the order (for example, "**D2 - Approved**"). This indicates that the order was approved and **EOD (Generate Daily Reports) has not yet run since the approval**. During the next EOD, the program removes the credit hold codes from approved orders and they do not appear on the output the next time you run the report."
- **Maps to:** `W-024` (holds) — **CONFIRMED and materially extended**; `W-012` (dates and periods).

> This is a genuine cutover trap and it belongs at the top of run 03's headline list. Every hold
> mechanism we have documented across three runs describes how a hold is *applied*. This is the
> only sentence in the corpus that says what clears one, and the answer is: **not the approval**.
> A supervisor approves a held order and the order stays flagged until the nightly Generate Daily
> Reports run sweeps it. Anything reading the hold field between approval and EOD — a picking
> process, a delivery scheduler, an interface, a manager looking at a screen — sees a held order.
>
> The `"D2 - Approved"` composite is not a status value; it is a display concatenation of a
> still-present hold code and an approval marker. If we rebuild this, we must decide deliberately
> whether to release at approval (what a modern system would do) or replicate the batch release
> (what every downstream STORIS behaviour is presently tuned to). We cannot leave it undecided.
>
> **`D2` is a new credit hold code** — the fifth we have sourced, joining `F5` (driver-licence
> failure), `C6` (credit decision pending), `E1` (exchange at entry) and `F3` (pre-qualify pending
> customer data). Its trigger is not documented here. `Credit Hold Codes List (AR)` is named as a
> related article and remains **unread across three runs** — see section H.

### FINDING 154 — Sales exceptions are recorded on *access*, re-recorded on *re-access*, and never retracted when the underlying condition is cured

- **Invariant:** the exception log is an append-only record of encounters, not a list of current problems.
- **Evidence** — `Report Sales Exceptions`:
  > "Note that each time you access a line with an exception, the system records the exception. Thus, if you re-access a line with an exception, the system records that exception, too."
  and:
  > "**Modifications to orders or line items that cancel their exception status do not cancel reporting of the original exception.**"
  and:
  > "The system tracks exceptions based on settings in the **Point of Sale Control Settings** file."
- **Maps to:** `W-039` (exception handling) — **CONFIRMED, with a semantics we had not assumed**.

> Two distinct facts, both consequential. First, the exception count is a count of *touches*, not
> of *conditions*: open the same bad line four times and it appears four times. Any report built
> on this to measure "how many exceptions did store 3 have" measures salesperson navigation as
> much as data quality. Second, the log is immutable — fixing the order does not retract the
> exception. That is defensible as an audit trail and indefensible as a work queue, and STORIS
> does not say which it intends it to be.
>
> Note the contrast with the **cost exception queue** from run 02 batch 2, which *is* a work queue
> and *does* clear on resolution. Two things called "exception" in this ERP behave in opposite
> ways. That naming collision has to be resolved before anyone builds either.
>
> `Point of Sale Control Settings` governs which exception types are tracked. That control record
> has been named repeatedly across runs 01 and 03 and its field list has never been published in
> any article we have read. It is the largest single unenumerated control record in the corpus.

### FINDING 155 — Some screens exist only as Dynamic Tab Settings pages and cannot be reached from the menu

- **Invariant:** screen composition is a configuration artefact, not a fixed application layout.
- **Evidence** — `View Customer Summary Information`:
  > "This window is **accessible through Dynamic Tab Settings and is not found on the menu**. When creating your DTS, this information is always included as a separate page on your inquiry."
- **Maps to:** **NEW** — no contract covers screen composition.

> This is an architecture-level discovery arriving in the last batch of the run, and it
> retroactively changes how we should read the whole screen and field inventory in section C of
> every batch file. We have been cataloguing screens as if they were fixed. At least some are
> assembled at configuration time from tab components, and at least one documented screen has no
> menu path at all — it exists only as a page someone added to a Dynamic Tab Settings definition.
>
> The practical consequence for the cutover: **"what screens does STORIS have" is not answerable
> from the menu**, and a field a user swears they use every day may live on a tab that our
> configuration does not include. Any user interview about screens has to ask which DTS
> definition they are looking at.

### FINDING 156 — Tabs are named, swappable components with IDs, and swapping one changes which data the screen computes

- **Invariant:** a tab ID selects a data contract, not just a layout.
- **Evidence** — `View Product Availability`:
  > "If you are not using ATP calculations, you can use **Dynamic Tab Settings** to select an alternate Locations tab that does not display ATP information. Once you select the inquiry screen in Dynamic Tab Settings, you can remove the default tab **IC.204.TAB** and replace it with **IC.207.TAB Stock Availability Inquiry** at the **Tab ID** field. This tab does not display the Available to Promise information shown above and does not include grid columns for ATP Date and ATP Quantity."
- **Maps to:** F155 (**NEW**), `W-055` / `W-056` (availability).

> `IC.204.TAB` and `IC.207.TAB` are the first tab component identifiers we have seen named. The
> naming convention — module prefix, number, `.TAB` — implies a registry of these, none of which
> is documented. This sits alongside `BMW_ACF` from run 02 (a configuration file with no screen)
> as the second piece of evidence that **STORIS has a configuration surface beneath the settings
> screens that the help centre does not describe**. Record as an unknown unknown (section I).
>
> Note also what the swap implies: a site not using ATP is expected to *remove the tab that
> computes it*. ATP is not merely hidden — turning it off is a screen-composition act.

### FINDING 157 — Available to Promise is a ninth availability definition, and the screen also publishes vendor-side stock

- **Invariant:** availability is site-configurable in both definition and presence.
- **Evidence** — `View Product Availability` publishes, under **Inventory Quantities**: `On Hand` ·
  `Net Available` · `Net PO` · `As-Is` · `As-Is Available` · `Total PO` · **`Vendor Quantity on Hand`**;
  and separately, under **Locations**: `Available to Promise` · `Desired Quantity` · `ATP Date` ·
  `ATP Quantity`.
- **Maps to:** `W-055` / `W-056` — **CONFIRMED, count revised**.

> Run 02 counted eight availability definitions. ATP is the ninth, and it is different in kind:
> the other eight are quantities, ATP is a *quantity paired with a date* — the earliest date a
> desired quantity can be promised. That is a forward-looking calculation, and the only one in
> the availability family.
>
> **`Vendor Quantity on Hand`** is separately notable: STORIS carries a vendor's stock position on
> the product availability screen. Nothing we have read says how it gets there. It is either an
> interface feed or a manually maintained field, and the difference matters enormously for
> whether we can replicate it. Section H.
>
> `Kit Component Only` displays in the header for products flagged `Kit Component` in
> `Advanced Product Settings` — a kit component is visible as such at the point of availability
> inquiry, which is consistent with run 02's finding that kit components are not independently
> sellable.

### FINDING 158 — There is a membership rewards module with points, balances, program terms and renewal dates, and it is documented in three thin articles

- **Invariant:** rewards are a customer-level liability with a term.
- **Evidence** — `View Customer Rewards` publishes: `Reward Points` · `Reward Balance` ·
  `Membership Program` · `Membership Date` · `Renewal Date` · `Start Date` · `End Date` ·
  `Rewards Earned Grid` · `Rewards Redeemed Grid`. `View Customer Summary Information` carries
  `Reward Points` in its **General** block, alongside address and `Credit Remarks`.
- **Maps to:** **NEW**.

> A points-and-membership loyalty programme with an expiring term, a redeemable balance, and its
> own gift-certificate type (`View Reward Gift Certificates`) — and the entire documented surface
> is three inquiry screens. **Nothing we have read in three runs says how points are earned, at
> what rate, what redeems them, whether redemption is a tender type, or what happens to a balance
> at renewal.** No control-settings record for it has been named.
>
> The article IDs (`169185…`, `169186…`) are an order of magnitude higher than the rest of the
> corpus (`152…`, `1529…`), which places this module as a recent addition. That is consistent
> with thin documentation but does not excuse it for our purposes. **This is the single largest
> functional area in Sales Processing that we cannot reconstruct.** Section H, and it is a
> candidate for a targeted vendor question rather than more reading.

### FINDING 159 — Two named accrual accounts each have a dedicated audit report, and each report defines exactly what clears the accrual

- **Invariant:** the accrual is cleared by AP approval, not by receipt or return.
- **Evidence** — `Report Merchandise Received But Not Invoiced` (subtitled *Received Not Recorded Report*):
  > "Use this report to display all purchase orders **received but not yet approved for payment**. You can use this report to **audit the general ledger account set up for received-not-recorded transactions**."
  and `Report Merchandise Returned But Not Credited`:
  > "This report prints vendor returns that have been flagged as returned on the system via the **Create Return-to-Vendor List (Return List Entry)**, but for which **AP approvals have not been entered**. You can use this report to **audit the general ledger account set up for returned-not-recorded transactions**. **Once an AP bill has been created for the return, the returned merchandise no longer appears on this report.**"
- **Maps to:** `W-052` / `W-053` (GL consequences) — **CONFIRMED**; `W-041` (cost).

> Batch 14 named `received-not-recorded` and `returned-not-recorded` as accounts. These two
> reports close the loop by defining the *clearing event* for each, and it is the same event on
> both sides: **AP approval**. Receipt opens the received-not-recorded accrual; AP approval closes
> it. Flagging a vendor return opens returned-not-recorded; creating the AP bill closes it.
>
> The mirror is clean and it gives us the two-sided accrual model without ambiguity. Note the
> asymmetry in the trigger *names* though: the return side names its originating process
> (`Create Return-to-Vendor List (Return List Entry)`) and the receipt side does not — receipt is
> assumed. Also note that the receipt side reports the **earliest** receiving date when a PO is
> received in multiple parts:
> > "If there are multiple receiving's done to the purchase order, the earliest receiving date is reported."
> — so ageing an accrual by this report ages it from first receipt, which will overstate the age
> of the later parts. Anyone using this to accrue at period end needs to know that.
>
> Both reports carry `As Of Date` **and** `Exclude AP Approvals After As Of Date` as separate
> options — a back-dated reconstruction of the accrual balance is explicitly supported.

### FINDING 160 — `DAILY.DETAIL` is a named receipts file with a retention setting in Accounts Receivable Control Settings and a monthly purge

- **Invariant:** receipt-level detail has a finite life governed by an AR setting.
- **Evidence** — `Report Summarized Sales Receipts`:
  > "This report utilizes data in the **DAILY.DETAIL** file. The retention period of this data is controlled via the **Daily Receipts Retention Months** setting in **Accounts Receivable Control Settings**. It is then purged by **Generate Monthly Reports**."
- **Maps to:** `W-012` (dates and periods) — **CONFIRMED**; `W-064` (data retention).

> The fourth complete retention chain we have documented (*file → setting → purging process*),
> after written sales, gift certificates and completed order history. The pattern is now firm
> enough to state as a rule for the rebuild: **in STORIS, every historical file has a named
> retention setting in a control record and a named batch process that enforces it, and the
> setting lives in the module that owns the file rather than the module that reads it.** Note that
> here the file is receipts, the report is a *sales* report, and the setting is in *Accounts
> Receivable* — a sales manager who wants a longer history has to ask the AR owner.
>
> `DAILY.DETAIL` joins `BTA`, `PRODUCT.HISTORY`, `Product History File`, `Customer History`, the
> completed order history file, the Costing Table and `BMW_ACF` in the named-data-store list.
> The dotted uppercase form (`DAILY.DETAIL`, `PRODUCT.HISTORY`) is the underlying file name
> leaking through; the title-case forms are prose. They are probably the same naming space.

### FINDING 161 — Deleted orders retain their finance authorisation numbers, and there is a report whose only purpose is to find them

- **Invariant:** deleting an order does not release the credit authorisation it obtained.
- **Evidence** — `Report Deleted Orders with Authorized Financing`:
  > "This report provides a complete listing of all **deleted orders containing an approval (authorization) number**."
  Run-time options include `Finance Provider`, `Report Type` and **`Include Financed Deposits`**.
- **Maps to:** `W-030` (financing) — **CONFIRMED**; `W-034` (deletion).

> A report exists because a leak exists. An order is deleted; the authorisation it pulled from the
> finance provider is still live at the provider; nothing in STORIS reverses it. The remedy is a
> report someone is expected to run and act on manually — the same shape as the type-4 cost
> exception queue in run 02.
>
> `Include Financed Deposits` as a separate toggle tells us financed deposits are tracked apart
> from financed orders and can outlive the order too. Batch 09 found fifteen named finance
> providers; each one is a place an orphaned authorisation can sit.
>
> This pairs with the plain `Report Deleted Orders` (15202742465684, not read) — deletion is
> evidently reportable in general, which implies deleted orders are retained, not erased. That
> matters for our data migration: **we may be inheriting a population of deleted-but-present
> orders.**

### FINDING 162 — Gift certificates carry four transaction kinds including gift-registry contributions, and expiry is optional per certificate

- **Invariant:** a gift certificate is a multi-transaction balance instrument, not a one-shot voucher.
- **Evidence** — `Report Outstanding Gift Certificates`:
  > "This report lists **purchases, refunds, redemptions, and contributions (to gift registries)** for all outstanding gift certificates/cards. It also prints the **remaining balance and expiration date (if any)** for each gift certificate/card."
  Options: `Sort by Selling Store` · `Certificate Type` · `Gift Registry ID` · `Gift Registry Type`.
- **Maps to:** `W-028` (gift certificates) — **CONFIRMED, extended**.

> Four transaction kinds against one balance, partial redemption implied by "remaining balance",
> optional expiry per instrument ("if any"), a `Certificate Type` enumeration we have never seen
> listed, and a link into a **gift registry** subsystem — `Gift Registry ID` and
> `Gift Registry Type` are run-time options, and `Gift Registry Name Lookup` appeared in the
> Sales Order Management inventory. A third party contributing money to a registry becomes a
> gift-certificate transaction. Neither the registry model nor `Certificate Type` is documented
> in anything we have read. Section H.
>
> `Report Purged Gift Certificates/Cards` exists as a sibling, which means certificates are
> purged — a fifth retention chain whose setting we have not found.

### FINDING 163 — Volume rebates have a status model with a posted/pending distinction and a `Rebate Mode`

- **Invariant:** rebate accrual is tracked per plan and settles separately from posting.
- **Evidence** — `Volume Rebate Status` publishes `Plan Status` · `Plan Code` · `Vendor` ·
  **`Rebate Mode`**, with Detail or Summary output, distinguishing posted from pending amounts.
- **Maps to:** `W-046` (vendor rebates) — **CONFIRMED**; ties to run 02's
  `Vendor Rebate Chargeback Method` in Purchasing Control Settings.

> Run 02 found `Vendor Rebate Chargeback Method` as a setting in Purchasing Control Settings and
> left its values unenumerated. `Rebate Mode` here is very likely the per-plan expression of the
> same choice, but **the two names are different and no article connects them** — so this is
> recorded as a probable correspondence, not a fact, and it goes in section H as an inference.
>
> The posted-versus-pending split is the substantive part: a rebate is earned before it is
> posted, which means there is a rebate receivable sitting between the two, and we have not found
> the account it sits in.

### FINDING 164 — The read-only order viewer is field-identical to order entry, which makes it the cheapest complete field inventory in the system

- **Invariant:** inquiry and entry share a screen definition.
- **Evidence** — `View an Existing Sales Order`:
  > "The information shown in this inquiry is identical to the original order entry screens. However, **you cannot modify orders using this process**."
  Covers sales orders, exchanges and returns in one viewer.
- **Maps to:** `W-050` (access control) — **CONFIRMED**; F155 (screen composition).

> Useful methodologically rather than substantively: read-only access to order data is a separate
> menu process with its own permission, not a mode of the entry screen. That is the nineteenth
> access-control mechanism we have counted across three runs, and it is the cleanest example of
> STORIS's general approach — **separate process, separate permission, same data**, rather than
> one screen with a read-only flag.
>
> `View Web Transactions` is the eSTORIS analogue: `Transaction Type Filter`, beginning/ending
> date, transaction number. Web transactions are viewable but held apart from the order viewer,
> which is consistent with batch 01's finding that eSTORIS orders enter through their own path.

---

## C. Screen and field inventory (additions)

| Screen | Fields / elements captured verbatim |
|---|---|
| View Product Availability | Product · Vendor · Brand · Vendor Model · **Locations** tab: Available to Promise, Desired Quantity, ATP Date, ATP Quantity · **Inventory Quantities**: On Hand, Net Available, Net PO, As-Is, As-Is Available, Total PO, Vendor Quantity on Hand · **Merchandising**: Selling Price, Suggested Retail Price, Purchase Status, Product Status · header marker `Kit Component Only` |
| View Customer Rewards | Customer Code · Cell/Home/Work Phone, Ext · Email Address · Reward Points · Reward Balance · Membership Program · Membership Date · Renewal Date · Start Date · End Date · Rewards Earned Grid · Rewards Redeemed Grid |
| View Customer Summary Information | *(DTS-only)* Header (Customer Code, Cell/Home/Work Phone + Ext, Email) · **General**: Address 1, Address 2, City, State, Zip Code, Ship From Location, Reward Points, Credit Remarks · **Totals**: sales, returns, service orders × current year / last year / lifetime, dollars and counts |
| Report Open Orders on Credit Hold | As Of Date · District · Store · Report Type · Send Output to · Export Path. Output: order date, estimated delivery date, order number, customer code, customer name, home and work phone, credit hold code + description |
| Report Sales Exceptions | Report Type · **Exception Report** *(the exception-type selector)* · District · Store · Send Output to · Export Path |
| Report Merchandise Received But Not Invoiced | Purchase Order Number · Reference Number · As Of Date · **Exclude AP Approvals After As Of Date** · Warehouse Location · Product · Group · Category · Vendor · Sort By · Inventory Type · Send Output to · Export Path |
| Report Merchandise Returned But Not Credited | Warehouse Location · As Of Date · Exclude AP Approvals After As Of Date · **Return Authorization** · Product · Group · Category · Vendor · Inventory Type · Send Output to · Export Path |
| Report Summarized Sales Receipts | Date Code · Start Date · End Date · District · Store · Payment Type · Send Output to · Export Path |
| Report Outstanding Gift Certificates | District · Store *(mutually exclusive)* · Sort by Selling Store · Certificate Type · Gift Registry ID · Gift Registry Type · Send Output to · Export Path |
| Report Deleted Orders with Authorized Financing | Finance Provider · District · Store · Date Code · Start Date · End Date · As Of Date · Report Type · **Include Financed Deposits** · Send Output to · Export Path |
| Volume Rebate Status | Plan Status · Plan Code · Vendor · Rebate Mode · Detail/Summary |
| View Web Transactions | Transaction Type Filter · Beginning Date · Ending Date · Transaction Number |

**Cross-cutting:** every report in this subsection ends with `Send Output to` and `Export Path`;
output options are stated as **Screen, Printer, Excel® Export, or ASCII Export**. Run-time
options selected are printed on the last page of the report output.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Daily Receipts Retention Months** | Accounts Receivable Control Settings | Retention of `DAILY.DETAIL`; purged by Generate Monthly Reports (F160) |
| *(exception tracking settings, unnamed)* | **Point of Sale Control Settings** | Determines which sales/service order exceptions are tracked (F154) |
| **Tab ID** | **Dynamic Tab Settings** | Selects the tab component on an inquiry screen; `IC.204.TAB` default vs `IC.207.TAB Stock Availability Inquiry` (F156) |
| Add Vendor Model to Reports | Inventory Control Settings | *Overridden* on Report Merchandise Received But Not Invoiced, which prints both regardless |
| Kit Component | Advanced Product Settings → Settings tab | Drives `Kit Component Only` header marker on availability inquiry |

---

## E. Security permissions catalog (additions)

Every article in this subsection opens with an **Access** heading naming its menu path — the
nineteenth access-control mechanism counted in this audit is **the separate read-only process**
(F164). **Regional Processing** restrictions are stated on the majority of reports read here in
identical wording:

> "The output of this report may be affected by Regional Processing restrictions. That is, you can inquire only about customers and locations to which you have access."

This is now confirmed as applying to *inquiry and reporting*, not only to transaction entry —
consistent with run 01's `W-050` "inverted" judgment, which this batch upholds for the fourth time.

---

## F. State machines and enumerations (additions)

- **Credit hold codes** — now five sourced: `F5` · `C6` · `E1` · `F3` · **`D2`** (new, trigger
  undocumented), plus "missing finance authorisation number". Display composite `"{code} - Approved"`
  is a transient state between approval and the next EOD (F153).
- **Availability definitions** — now nine: the eight from run 02 plus **Available to Promise**,
  which is uniquely date-bearing. Plus `Vendor Quantity on Hand` as a non-availability quantity.
- **Certificate Type** — enumeration exists, values not published.
- **Gift Registry Type** — enumeration exists, values not published.
- **Plan Status / Rebate Mode** — enumerations exist, values not published.
- **Exception Report** — the selector on `Report Sales Exceptions` offers "many different exception
  types"; **none is named in the article**.
- **Gift certificate transaction kinds** — four: purchase · refund · redemption · contribution.

---

## G. Sequencing rules (additions)

1. Credit approval → **Generate Daily Reports (EOD)** → hold code removed. The gap is up to one day (F153).
2. PO receipt → received-not-recorded accrual opens → **AP approval** → accrual closes (F159).
3. Return-to-vendor flagged via Return List Entry → returned-not-recorded accrual opens → **AP bill created** → accrual closes (F159).
4. Receipts written to `DAILY.DETAIL` → **Generate Monthly Reports** purges beyond `Daily Receipts Retention Months` (F160).
5. Order line touched with an exception → exception recorded (repeatably, on every access); curing the condition does **not** unwind the record (F154).

---

## H. Open questions and gaps

### Gated or unreachable

- `Credit Hold Codes List (AR)` — named as a related article on the credit hold report and
  referenced across runs 01 and 03. **Never read.** It is the authoritative enumeration of hold
  codes and is the single highest-value unread article in the corpus. Carry to run 05.
- `Point of Sale Control Settings` — named repeatedly, field list never published in any article
  reached in three runs. Largest unenumerated control record.
- `Status Code Settings` and `Transaction Codes` — named as related articles on
  `View an Existing Sales Order`; still unread. Transaction code `02` remains the gap in the
  `00`/`01`/`03` enumeration carried since run 02.

### Documented but ambiguous

- **`Vendor Quantity on Hand`** — published on the availability screen; the article never says
  whether it is interfaced from the vendor, imported, or keyed. Replicability unknown.
- **Membership rewards** — earning rate, redemption mechanism, tender treatment, expiry behaviour
  at `Renewal Date`, and the governing control record are all undocumented (F158).
- **`Certificate Type`, `Gift Registry Type`, `Plan Status`, `Rebate Mode`, `Exception Report`** —
  five enumerations named without values.
- **Gift registry** — a subsystem inferred from three field names and one lookup screen. No article
  describes it.
- **Gift certificate purge** — `Report Purged Gift Certificates/Cards` implies a retention setting
  and purge process neither of which is named.
- **`D2`** — a credit hold code appearing only in an example. Its trigger is not stated.
- Whether the `"D2 - Approved"` display composite is stored or rendered.

### Inferences (recorded as inference, not fact)

- **I-16:** `Rebate Mode` (Volume Rebate Status) and `Vendor Rebate Chargeback Method` (Purchasing
  Control Settings, run 02) are probably the same concept at plan and system level. *No article
  connects them.*
- **I-17:** `DAILY.DETAIL` and `PRODUCT.HISTORY` share a dotted-uppercase convention that is
  probably the underlying physical file naming; the title-case names elsewhere are probably prose
  for the same objects. *Not stated anywhere.*
- **I-18:** The `IC.` prefix on tab IDs is probably an Inventory Control module prefix, implying a
  per-module tab registry. *Not stated.*
- **I-19:** Because `Report Deleted Orders` exists, deleted orders are probably retained rather
  than removed. *The articles say the report lists them; they do not say the orders persist as
  records.*

---

## I. Unknown unknowns

- **A configuration layer beneath the settings screens.** `BMW_ACF` (run 02, a configuration file
  with no screen) and now `IC.204.TAB` / `IC.207.TAB` (tab components addressed by ID) are two
  sightings of the same thing: STORIS behaviour is shaped by named artefacts that the help centre
  mentions only in passing. **We do not know how large this layer is.** It is the most important
  open risk in the audit, because it is the part we cannot enumerate by reading.
- **Screens with no menu path.** F155 establishes that at least one exists. We have no way to
  count them from the documentation, and our screen inventory across three runs is therefore a
  lower bound, not a census.
- **A recently added module with thin documentation** (rewards). If one module was added without
  full documentation, others may have been. Article ID magnitude is a usable heuristic for
  spotting them — worth applying in runs 04–06.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Dynamic Tab Settings (DTS)** | Configuration that composes inquiry screens from named tab components; can add pages with no menu path |
| **Tab ID** | Identifier of a tab component, e.g. `IC.204.TAB`, `IC.207.TAB` |
| **Available to Promise (ATP)** | Date-bearing availability: the date a desired quantity can be promised |
| **`DAILY.DETAIL`** | Receipts detail file; retention set in AR Control Settings, purged monthly |
| **Received Not Recorded** | GL accrual: PO received, AP not yet approved |
| **Returned Not Recorded** | GL accrual: vendor return flagged, AP bill not yet created |
| **`D2`** | A credit hold code (trigger undocumented) |
| **`"{code} - Approved"`** | Transient hold display between approval and the next EOD |
| **Rebate Mode** | Per-plan volume rebate setting; values not published |
| **Reward Balance / Membership Program** | Customer loyalty balance and its programme term |
| **Exception Report** | The exception-type selector on Report Sales Exceptions |

---

## Contract adjudication — batch 16

| Contract | Verdict | Basis |
|---|---|---|
| **W-024** *(holds)* | **CONFIRMED and materially extended** | Approval does not release a hold; EOD does (F153) |
| **W-039** *(exceptions)* | **CONFIRMED, with unexpected semantics** | Recorded per access, never retracted (F154) |
| **W-052 / W-053** *(GL)* | **CONFIRMED** | Both accruals cleared by AP approval (F159) |
| **W-012** *(dates/periods)* | **CONFIRMED** | EOD and Generate Monthly Reports both act on state, not just print (F153, F160) |
| **W-055 / W-056** *(availability)* | **CONFIRMED, count revised to nine** | ATP added (F157) |
| **W-030** *(financing)* | **CONFIRMED** | Authorisations survive order deletion (F161) |
| **W-028** *(gift certificates)* | **CONFIRMED, extended** | Four transaction kinds, optional expiry, registry link (F162) |
| **W-046** *(vendor rebates)* | **CONFIRMED** | Posted vs pending, per-plan mode (F163) |
| **W-050** *(access control)* | **consistent — upheld a fourth time as inverted** | Regional Processing gates inquiry and reporting too |
| **W-064** *(retention)* | **CONFIRMED** | Fourth complete file → setting → purge chain (F160) |
| **Screen composition** | **NEW — no contract covers it** | F155, F156 |
| **Membership rewards** | **NEW — no contract covers it** | F158 |

---

## Next

Run 03 complete. See `RUN-03-SALES-PROCESSING-SUMMARY.md`.
