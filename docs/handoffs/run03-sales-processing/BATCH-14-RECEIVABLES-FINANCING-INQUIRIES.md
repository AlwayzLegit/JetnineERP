# Run 03 — Sales Processing — Batch 14: Receivables, Financing Inquiries and Accrual Audit Reports

**Status: complete.** 9 articles. Findings 134–142.

**This batch names two GL accrual accounts.** See Finding 140.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **View a Customer's Receivables Activity Summary** | /articles/15295211963796 | EXTRACTED |
| 2 | View a Customer's Charge Off Details | /articles/15295155746196 | EXTRACTED |
| 3 | **View Available Financed Credit** | /articles/15295210640788 | EXTRACTED — rich |
| 4 | **Report Financing Aged Trial Balance** | /articles/15202930409236 | EXTRACTED |
| 5 | **Report Financed Accounts With Multiple Customers** | /articles/15202930410644 | EXTRACTED |
| 6 | Report Financed Credit Holds | /articles/15202946046740 | EXTRACTED — thin |
| 7 | **Report Merchandise Received But Not Invoiced** *(Received Not Recorded)* | /articles/15203012855700 | EXTRACTED |
| 8 | **Report Merchandise Returned But Not Credited** | /articles/15203028984852 | EXTRACTED |
| 9 | Report Merchandise Paid but Never Received | /articles/15203028692756 | EXTRACTED |

Discovered and queued: `View Available Financed Credit Response` · `FR Customer Selection` window ·
`View a Customer's Revolving Disputes` · `View General Revolving` page ·
`Create Return-to-Vendor List` *(Return List Entry)* · `Financing Control Settings` → Receivables tab ·
`Number of Aging Days` · `Auto-Pay Post Bank` · `Add Vendor Model to Reports`.

---

## B. Wiring findings

### FINDING 134 — One inquiry shows all three receivables ledgers with a grand total
Invariant:  "view accounts receivable activity, including **open item, installment and revolving
            activity**. The header portion… displays summary information, with **one line each for open
            item, revolving, installment, and a grand total line**. The summary grid displays
            information **for each installment contract, revolving plan, and open item receivables**."
Columns:    **`Past Due` · `Current Due` · `Total Due` · `Total Balance`**
Evidence:   View a Customer's Receivables Activity Summary, /articles/15295211963796
Maps to:    **confirms run 1's ledger architecture from the sales side; W-012**

> Run 1 mapped two coexisting AR ledgers joined by cycling, plus installment and revolving as separate
> credit subsystems. Batch 8 found the three balances displayed side by side on the merge screens.
> **This is the working inquiry**, and it adds the aging split: `Past Due` and `Current Due` are
> separate from `Total Due`, per contract and per plan.
>
> So a single customer can hold **an open-item balance, several installment contracts and several
> revolving plans simultaneously**, each with its own due position. Any rebuild that models customer
> balance as one number loses the entire consumer-credit business.

### FINDING 135 — Charged-off revolving plans keep order-level detail, net of payments and repossessions
Invariant (verbatim): "**This page is active only for customers with revolving plans that were charged
            off. The grid displays completed order details related to the charged off plan(s). The
            remaining balance for each order is the net of any payments received and any repossessions
            performed.**"
Structure:  "**This tab is included in every receivables DTS screen**" *(the `General Revolving` page)*.
Evidence:   View a Customer's Charge Off Details, /articles/15295155746196
Maps to:    **connects to run 1's LET and repossession findings**

> **Charge-off does not erase the detail.** The order-level breakdown survives, and the remaining
> balance nets both payments *and* repossessions — which is exactly the LET (Legally Entitled To) and
> repossession machinery run 1 mapped, seen from the customer's account.
>
> The structural note matters too: **`General Revolving` is a shared tab on every receivables DTS
> screen**, so the receivables inquiries are a family built on a common panel — the same pattern run 2
> found for the product inquiries sharing a General Information page.

### FINDING 136 — A live credit inquiry calls the finance provider, and can rewrite the account on the order
Invariant:  "retrieve basic credit information about a customer **from a finance provider**… **The
            request for credit information is then transmitted to the provider** and the returned data is
            displayed on the `View Available Financed Credit Response` screen. **Not all fields… display
            information for all providers; they populate as a result of what is returned by each finance
            provider.**"
Write-back (verbatim): "If this screen is accessed via a payment entry process and the `Save` button is
            clicked, **the finance account number is returned to the payment entry process. If that
            finance account number is different from the one that exists on file for the bill-to
            customer, a message displays asking to apply the finance account number to the current
            order.** If Yes, the account number displays in the `Finance Receivable Entry Screen`… **If
            No, entry of an account number is required in order to continue.**"
Gate:       "the **`Available Credit Inquiry`** field must be active in the `Finance Provider Settings`
            for the selected finance provider."
Lookup:     `Finance Provider` · `Lookup By` · Account Number · **`Social Security Number`** · Name ·
            Address · City/State/Zip. "**the last four digits of the Social Security Number and Cell
            Phone Number are optional if a Finance Account Number is provided.**"
Evidence:   View Available Financed Credit, /articles/15295210640788
Maps to:    **W-050 relevant; compliance — SSN as a lookup key again**

> **A real-time credit-availability call to an external lender, from the payment screen**, whose result
> can change the finance account number on the order. That is the fourth live external integration in
> the run (ATP, address verification, card processors, finance providers).
>
> **SSN appears as a lookup key for the third time** in this audit — run 1's search key, batch 8's
> duplicate search, and now a provider inquiry. The "last four digits… optional if a Finance Account
> Number is provided" phrasing implies **partial SSN is the fallback identifier** when the account
> number is unknown. That belongs on the compliance list.

### FINDING 137 — One finance account can belong to several customers, by setting
Invariant (verbatim): "**A duplicate finance account number may exist and [be] assigned to different
            customers if the `Multiple Customers Per Finance Account` setting on the Receivables tab of
            `Financing Control Settings` is enabled.**"
Consequence: "**If multiple customers are assigned to the same finance account number, the `FR Customer
            Selection` window opens to display the Customer Codes and Customer Names associated with the
            finance account number.**"
Reporting (verbatim): "This report lists customers who **share a finance account number with another
            customer**. The report places **an asterisk prior to the customer account number that was
            updated as a result of the exception record.**" · "**If processing during End of Day, once
            the exception record details print, the system deletes the exception records.**" ·
            "This screen is active **only if** the `Multiple Customers per Finance Account` field is
            checked."
Evidence:   View Available Financed Credit, /articles/15295210640788;
            Report Financed Accounts With Multiple Customers, /articles/15202930410644
Maps to:    **NEW — and it breaks a key assumption**

> **The customer↔finance account relationship is many-to-many when one setting is on.** Batch 9 found
> account numbers may not exist at all for some providers; this adds that when they do exist, they may
> not be unique to a customer.
>
> Two consequences. **A payment entry against an account number can require choosing which customer it
> belongs to** (the FR Customer Selection window). And the exception report is **destructive: End-of-Day
> prints the exception details and then deletes the records**, so the report is the only surviving
> evidence of the collision. Print it or lose it — a pattern run 2 saw with the cost-exception worklists
> but here with no queue behind it.

### FINDING 138 — Financing aged trial balance has configurable buckets and one silent exclusion
Aging (verbatim): "The range of days in each aging column (for example, **1-7, 8-14, over 14, or 1-30,
            31-60, over 60**) is determined by the setting in the **`Number of Aging Days`** field in the
            `Financing Control Settings` file."
Report types (verbatim): **`Detail` · `Summary` · `Audit`**
Exclusion (verbatim): "**NOTE: This report does not include finance transactions from finance providers
            for the which the `Auto-Pay Post Bank` option is enabled in the `Finance Provider
            Settings`.**"
Evidence:   Report Financing Aged Trial Balance, /articles/15202930409236
Maps to:    **W-012 — CONFIRMED; and a reconciliation trap**

> **Aging buckets are configurable** — unlike run 2's fixed 30/60/90/90+ inventory aging — with the
> examples showing both weekly and monthly schemes. So the same report can mean quite different things
> at two installations.
>
> The exclusion is the finding: **providers with `Auto-Pay Post Bank` enabled are silently absent from
> the aged trial balance.** A finance receivables ATB that omits a whole provider is a reconciliation
> trap of exactly the kind run 1 spent thirty batches untangling in Accounting. **Anyone reconciling FR
> balances to the GL must know which providers are excluded.**
>
> An **`Audit`** report type sits alongside Detail and Summary — worth reading when Accounting work
> resumes.

### FINDING 139 — Financed orders can carry several credit holds at once
Invariant:  "report on **financed orders with one or more credit holds attached**."
Filters:    District · Store · Salesperson · Customer Code.
Cross-ref:  four hold triggers now sourced — **`F5`** driver-licence, **`C6`** credit pending,
            **`E1`** exchange at entry, **`F3`** pre-qualify; plus a missing finance authorisation
            number *(batch 5 F49)*.
Evidence:   Report Financed Credit Holds, /articles/15202946046740
Maps to:    **run 1's 22 credit hold codes — multiplicity confirmed**

> **"One or more credit holds"** settles a question the audit has carried since run 1: **holds are not
> exclusive.** An order can be simultaneously held for a failed driver-licence check, a pending credit
> decision and a missing authorisation number, and clearing one does not release it.
>
> Since batch 1 established that **any** credit hold blocks order completion, and batch 3 that it blocks
> consolidation, **a multiply-held order needs every hold cleared independently** — and this report is
> the only tool found for seeing them together.

### FINDING 140 — Two GL accrual accounts are named, and two reports exist to audit them
**Received not recorded** (verbatim): "display all purchase orders **received but not yet approved for
            payment**. You can use this report to **audit the general ledger account set up for
            received-not-recorded transactions.**"
**Returned not recorded** (verbatim): "prints vendor returns that have been flagged as returned… **but
            for which AP approvals have not been entered.** You can use this report to **audit the
            general ledger account set up for returned-not-recorded transactions.** Once an AP bill has
            been created for the return, the returned merchandise no longer appears on this report."
Multi-receipt rule (verbatim): "**If there are multiple receiving's done to the purchase order, the
            earliest receiving date is reported.**"
Cut-off:    both reports offer **`As Of Date`** and **`Exclude AP Approvals After As Of Date`**.
Evidence:   Report Merchandise Received But Not Invoiced, /articles/15203012855700;
            Report Merchandise Returned But Not Credited, /articles/15203028984852
Maps to:    **W-052 / W-053 — CONFIRMED, two named accrual accounts**

> **Two GL accrual accounts named at last**: `received-not-recorded` and `returned-not-recorded`. These
> are the goods-in-transit accruals that sit between physical movement and AP recognition, and each has
> a purpose-built audit report.
>
> This substantially completes the picture run 2 could not: run 2 found Merchandising almost silent on
> postings; batch 4 named the card and AR accounts; batch 7 established returns post at completion.
> **Now the accrual side is named too.** Together they say: *goods received create a liability accrual
> before the bill exists, and vendor returns create a receivable accrual before the credit exists.*
>
> The **`Exclude AP Approvals After As Of Date`** option is a genuine point-in-time reconstruction
> control — it lets you reproduce the accrual as it stood on a past date, which is exactly what a
> month-end review needs and which run 2 found missing elsewhere.

### FINDING 141 — A third accrual report catches merchandise paid for but never received
Invariant (verbatim): "report on merchandise where **the bill has been paid but the merchandise was
            never received. Merchandise is considered not received when the fully paid Pending Bill is
            closed.**"
Fields:     Date Code · Start · End · **`Vendor(s)`**
Evidence:   Report Merchandise Paid but Never Received, /articles/15203028692756
Maps to:    **W-041 relevant; W-052 / W-053**

> The mirror image of received-not-recorded, and the definition is precise: **the trigger is a fully
> paid Pending Bill being closed with no receipt against it.** Run 2 found `Pay Prior to Receipt` as a
> PO flag creating a pending bill (run 2 F1); this is what catches those that never resolve.
>
> Three accrual reports now form a set — **received not invoiced · returned not credited · paid not
> received** — and together they are the reconciliation surface between purchasing, receiving and
> payables. Notably **all three live in the Sales Processing section's report list**, which is where
> nobody would look for them.

### FINDING 142 — Report placement in this section is unreliable
Observed:   Three purchasing/AP accrual reports (Findings 140–141) and `Report Open To Buy Information`
            *(run 2 F86, filed under Inventory Management)* sit in subsections unrelated to their
            subject. `Report Sales Tax` is referenced from Financing (batch 9) but lives here.
            `Report Merchandising Activity` and `Report Current Inventory Adjustments` also appear in
            this Sales list.
Evidence:   Sales Views and Reports section index; accumulated
Maps to:    **NEW — a coverage warning, recorded because it affects the audit method**

> **The section a report is filed under does not reliably indicate what it reports on.** Three
> accounts-payable accrual reports are in Sales Views and Reports; an open-to-buy report is in Inventory
> Management; merchandising activity reports are here.
>
> For the parity work this has a concrete consequence: **run 1's Accounting coverage and run 2's
> Merchandising coverage were complete *for their sections*, not for their subject matter.** Anything
> that looked missing from those runs may simply live somewhere else. The full-run summary should say
> so, and the cross-run index at the end of run 6 should be organised by subject, not by section.

---

## C. Screen and field inventory

**View a Customer's Receivables Activity Summary** — Customer · Home · Cell ·
header lines for **Open Item · Revolving · Installment · Grand Total**, each with **`Past Due` ·
`Current Due` · `Total Due` · `Total Balance`** · summary grid *(one row per installment contract,
revolving plan and open item)* · Select · Actions.

**View a Customer's Charge Off Details** — pages **Charge Off Details · General Revolving**.
Customer *(Cell/Home/Work Phone, Ext, Email populate read-only)* · **`Plan`** · grid of completed order
details, **net of payments and repossessions**.

**View Available Financed Credit** — `Finance Provider` · **`Lookup By`** · `Search Input` ·
Account Number · **Social Security Number** · Name · Address 1/2 · City/State/Zip. Results on
**`View Available Financed Credit Response`**; collisions open **`FR Customer Selection`**.

**Report Financing Aged Trial Balance** — **`Report Type`** *(Detail / Summary / **Audit**)* ·
Finance Provider · Payment Type · Date Code · **`As Of Date`** · Send Output to · Export Path.
Aging columns from **`Number of Aging Days`**.

**Report Financed Accounts With Multiple Customers** — District · Store · Send Output to · Export Path.
**Asterisk marks the customer account updated by the exception record.**

**Report Financed Credit Holds** — District · Store · Salesperson · Customer Code · Send Output to ·
Export Path.

**Report Merchandise Received But Not Invoiced** *(Received Not Recorded)* — Purchase Order Number ·
Reference Number · **`As Of Date`** · **`Exclude AP Approvals After As Of Date`** · Warehouse Location ·
Product · Group · Category · Vendor · Sort By · Inventory Type · Send Output to · Export Path.

**Report Merchandise Returned But Not Credited** — Warehouse Location · As Of Date ·
Exclude AP Approvals After As Of Date · **`Return Authorization`** · Product · Group · Category ·
Vendor · Inventory Type · Send Output to · Export Path.

**Report Merchandise Paid but Never Received** — Date Code · Start · End · **`Vendor(s)`** ·
Send Output to · Export Path.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`Multiple Customers Per Finance Account`** | **Financing Control Settings** → Receivables | **Makes customer↔finance account many-to-many** |
| **`Number of Aging Days`** | Financing Control Settings | Aged trial balance bucket widths |
| **`Auto-Pay Post Bank`** | **Finance Provider Settings** | **Excludes that provider from the aged trial balance** |
| **`Available Credit Inquiry`** | Finance Provider Settings | Whether live credit inquiries may be transmitted |
| `Add Vendor Model to Reports` | Inventory Control Settings | **Overridden** — received-not-invoiced always shows both |

---

## E. Security permissions catalog

*No new permissions surfaced in this batch.* The financing inquiries inherit `Access credit applications
for third party on-line financing` *(batch 9)* and the Receivables Security payment-type restrictions
*(batch 4)*.

---

## F. State machines and enumerations

**Customer receivables position** — Open Item · Revolving · Installment · **Grand Total**, each with
Past Due / Current Due / Total Due / Total Balance.
**Revolving plan end state** — **charged off**, retaining order-level detail net of payments and
repossessions.
**Aged trial balance report types** — Detail · Summary · **Audit**.
**Aging buckets** — configurable *(e.g. 1-7 / 8-14 / over 14, or 1-30 / 31-60 / over 60)*.
**Credit holds** — **multiple simultaneous holds per order**; four triggers sourced (`F5`, `C6`, `E1`,
`F3`) plus missing finance authorisation.
**Named GL accrual accounts (2)** — **received-not-recorded** · **returned-not-recorded**.
**Accrual audit reports (3)** — received but not invoiced · returned but not credited · **paid but
never received**.
**Finance account cardinality** — one-to-one by default; **many-to-many** with the setting on; may not
exist at all for some providers *(batch 9)*.

---

## G. Sequencing rules

1. A live credit inquiry requires `Available Credit Inquiry` active for that provider.
2. A returned account number differing from the customer's prompts to apply it to the order; declining
   forces manual entry.
3. Shared finance account numbers open `FR Customer Selection` at payment entry.
4. The multiple-customers exception records **print at End-of-Day and are then deleted**.
5. Providers with `Auto-Pay Post Bank` are omitted from the financing aged trial balance.
6. Received merchandise leaves the received-not-invoiced report when approved for payment.
7. Returned merchandise leaves the returned-not-credited report when an AP bill is created.
8. Merchandise is "never received" once a fully paid Pending Bill closes without a receipt.

---

## H. Open questions and gaps

**Gated or unreachable**
- `View Available Financed Credit Response` — the screen that displays what the provider returns.
- `View a Customer's Revolving Disputes` — connects to the `Dispute status` found in batch 13.
- `View General Revolving` — the shared panel on every receivables DTS screen.
- `Create Return-to-Vendor List` — the origin of returned-not-credited records.
- **The GL accounts themselves** — both accrual accounts are named as concepts; their slots in
  `General Ledger Assigned Account Settings` are not identified here.

**Documented but ambiguous**
- **Which `General Ledger Assigned Account Settings` slots** hold received-not-recorded and
  returned-not-recorded. Run 1 mapped ~120 slots; these two should be locatable.
- **What `Auto-Pay Post Bank` does** beyond excluding the provider from the ATB — the name suggests
  direct bank posting, which would explain the exclusion, but nothing states it.
- **Whether the multiple-customers exception is recoverable** after End-of-Day deletes it.
- **The `Audit` report type** on the aged trial balance — contents unstated.
- **Whether repossession values on charged-off plans reconcile** to run 1's repossession depreciation
  settings (which run 2 found configured in Costing Control Settings).
- **`Inventory Type`** — an unenumerated filter now seen on ten reports across three runs.
- Whether `View a Customer's Receivables Activity Summary` respects Regional Processing.

**Inferences (not in section B)**
- `Auto-Pay Post Bank` presumably means the provider funds directly to the bank, so no receivable is
  carried — which would justify the ATB exclusion. **Not stated.**
- The two accrual accounts are presumably among run 1's ~120 GL slots; not confirmed.
- The three accrual reports are presumably intended to be run at month end together; nothing says so.

---

## I. Unknown unknowns

- **Three receivables ledgers with separate past-due positions** on one customer inquiry.
- **Charged-off plans retaining order detail** net of payments and repossessions.
- **A shared `General Revolving` panel** on every receivables DTS screen.
- **A live credit-availability call to a lender** from the payment screen.
- **A returned account number able to rewrite the order's finance account.**
- **Partial SSN as a fallback identifier** in a provider lookup.
- **One finance account belonging to several customers**, by setting.
- **An exception report whose records End-of-Day deletes after printing.**
- **Configurable aging buckets** on the financing trial balance.
- **A whole finance provider silently excluded from the aged trial balance.**
- **Multiple simultaneous credit holds on one order.**
- **Two named GL accrual accounts** with purpose-built audit reports.
- **A point-in-time accrual reconstruction option** (`Exclude AP Approvals After As Of Date`).
- **Purchasing and AP accrual reports filed under Sales Views and Reports.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| Received not recorded | GL accrual for goods received but not yet approved for payment |
| Returned not recorded | GL accrual for vendor returns not yet credited |
| Paid but never received | Fully paid Pending Bill closed with no receipt |
| Multiple Customers Per Finance Account | Setting making the customer↔account relationship many-to-many |
| FR Customer Selection | Window resolving which customer a shared finance account belongs to |
| Auto-Pay Post Bank | Provider setting; excludes that provider from the aged trial balance |
| Available Credit Inquiry | Provider setting permitting live credit-availability requests |
| Number of Aging Days | Setting defining financing ATB bucket widths |
| General Revolving | Shared panel present on every receivables DTS screen |
| Charge off | Revolving plan end state; detail retained net of payments and repossessions |

---

## Contract adjudication — batch 14

| Contract | Verdict | Basis |
|---|---|---|
| **W-052 / W-053** | **CONFIRMED — two named accrual accounts** | received-not-recorded and returned-not-recorded, each with an audit report (F140, F141) |
| **W-012** | **CONFIRMED** | Configurable aging buckets; point-in-time accrual reconstruction via As Of Date (F138, F140) |
| **W-041** | **relevant** | Paid-but-never-received closes the pending-bill loop run 2 opened (F141) |
| **W-050** | **relevant** | Live credit inquiry gated per provider; SSN as fallback lookup key (F136) |
| **W-055 / W-056** | **not relevant to this batch** | — |

---

## Next — batch 15: sales performance, warranty and protection plan reporting
