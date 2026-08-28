# Run 01 — Accounting — Batch 26: Bank Reconciliation and Adjustment Reports

10 articles. The reconciliation reporting trio plus the daily/period adjustment reports.
`Report Reconciliation Transactions` is the most substantive report in the whole AVR subsection —
it is effectively the bank reconciliation's data dictionary.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 271 | **Report Reconciliation Transactions** | /articles/15203128885268 | EXTRACTED |
| 272 | Report Cleared Transactions | /articles/15202553298836 | EXTRACTED |
| 273 | Report Reconciliation Errors | /articles/15203113113492 | EXTRACTED |
| 274 | Report Detailed Daily Adjustments | /articles/15202676866196 | EXTRACTED |
| 275 | Report Summarized Account Adjustments | /articles/15203214092052 | EXTRACTED |
| 276 | Report Suggested Account Adjustments | /articles/15203214702484 | EXTRACTED |
| 277 | Report Recovered Bad Debts | /articles/15203128360340 | EXTRACTED |
| 278 | Report on Third Party Accounting Transmission Errors | /articles/15203013127828 | EXTRACTED |
| 279 | Report Product with Low Stock | /articles/15203112885652 | EXTRACTED — **misfiled, see Finding 298** |
| 280 | Report Recurring Journal Entries | /articles/15203113113236 | LOGGED |

---

## B. Wiring findings

### FINDING 292 — The reconciliation report defines the Bank Reconciliation record end to end
Producer:   `Report Reconciliation Transactions` — "Data comes from the **Bank Reconciliation File**"
**Column semantics, verbatim where it matters:**
  - **Document Number** — the check or deposit number
  - **Description** — "the description that would have posted to the General Ledger.
    **Origin** defines where the posting originated (for example, **EOD** or the Manual entry type
    code). The date is the **transaction date** of the posting."
  - **Debit** — "to maintain consistency with **banks reports**, this column displays any amounts
    stored in the Bank Reconciliation record **as a credit transaction**. The system **subtracts**
    these amounts from the running balance."
  - **Credit** — "displays any amounts stored … **as a debit transaction**. The system **adds** these
    amounts to the running balance."
  - **Status** — CLEAR or OPEN "based on the status of the **`MATCHED`** flag"
  - **Origin** — "**EOD** … for deposits, **APC** for checks, and a **manual posting code** for
    manual postings"
  - **Locn** — the store location the deposit came from; **null** for records without a location
Totals:     total descriptions come from the **Short Description** field of the corresponding
            Transaction Type record, one total per transaction type present
Evidence:   Report Reconciliation Transactions, /articles/15203128885268
Maps to:    **W-034 — CONFIRMED, definitively**

> **The debit/credit columns are deliberately inverted** relative to STORIS's own storage, to match
> the bank's point of view. Anyone reconciling STORIS data to a bank statement — or building a
> replacement — must know that the stored sign and the displayed sign are opposites. This is exactly
> the kind of convention that silently breaks a migration.
> The **Origin** codes (`EOD`, `APC`, manual) confirm the three record-creation families from
> batch 3, and `Locn` confirms deposits carry a store location while other records may not.

### FINDING 293 — The reconciliation beginning balance is anchored to the last purge
Invariant:  "You define the balance (or balance forward) in the **Bank file** … This is the balance
            from '**the beginning of time**' (that is, the balance as of the last time that the
            reconciliation file was **cleared and recalculated by the purge process**). If the
            starting date specified … is **later than the last purge date**, all prior transactions
            are used to calculate a beginning balance as of the report's requested starting date."
Summary:    totals broken down **by transaction type** into **cleared** and **open**
Evidence:   Report Reconciliation Transactions, /articles/15203128885268
Maps to:    completes batch 2 (Finding 38) and batch 21 (Finding 254)

> The purge is now fully understood: it is the event that **resets the reconciliation epoch**.
> Before the purge date the balance is a stored number; after it, the balance is computed from
> retained transactions. A migration must carry both the stored balance-forward *and* the purge date,
> or every historical reconciliation report will differ.

### FINDING 294 — Misapplied-fund reapplication is invisible or visible depending on the banks involved
Rules (verbatim):
  1. "If the bank used in the misapplied transaction is the **same** as the bank designated for the
     reapplication, the transaction **does not appear** in the report."
  2. "If you reapplied funds using **different banks**, the transferred amount appears under the
     **Debit** column for original bank and the **Credit** column for the receiving bank."
Evidence:   Report Reconciliation Transactions, /articles/15203128885268
Maps to:    completes batch 5 (Finding 71) from the bank-reconciliation side

> Same-bank corrections are netted out of the bank reconciliation entirely. That is correct
> behaviour and worth reproducing — but it means the bank rec will not show that a correction
> happened, and the only trace is in the AR side.

### FINDING 295 — Cleared and error reports are BAI-keyed mirror images
`Report Cleared Transactions` — "all **cleared and/or matched**" transactions; columns
            BAI Code · BAI Description · Reference/Description · Document Number · Amount ·
            Transaction Type · **Paid Date**
`Report Reconciliation Errors` — "all **unmatched** (that is, not reconciled) transactions"; same
            columns but **Bank Date** and **Error Message** instead of Paid Date
Automation: the errors report, when run automatically from `Import Bank Transactions with Automatic
            Reconciliation`, defaults the bank and "**outputs the report to a .PDF print file**"
Evidence:   Report Cleared Transactions, /articles/15202553298836 · Report Reconciliation Errors, /articles/15203113113492
Maps to:    completes batch 2 (Finding 28 — the two reports the auto-import yields)

### FINDING 296 — Manual adjustments are reported daily under a different name
Producer:   `Report Detailed Daily Adjustments` — "displays **all manually posted transactions**";
            runs during **Day-Ending and Month-Ending** processing "(as the **Daily Post Report**)"
            as well as on demand
Scoping:    all transactions, or just those associated with **open item**, **deposit liability**,
            **revolving**, or **bad debt write-offs**; sorts by store location; on-demand can be based
            on **system date or transaction date**
Options:    Display Format · **Include GL Postings**
Companion:  `Report Summarized Account Adjustments` — debit and credit **manual adjustments in open
            item receivables**: "refunds, returned check fees, manual invoices and manual customer
            returns"; runnable for today, yesterday, as of a date, **current period-to-date, last
            period-to-date, or last period total**
Evidence:   Report Detailed Daily Adjustments, /articles/15202676866196 · Report Summarized Account Adjustments, /articles/15203214092052
Maps to:    **W-053 — partially CONFIRMED** — manual postings have a dedicated daily report

> The alias matters: this report is called the **Daily Post Report** inside the EOD/EOM cycle. If
> LA Mattress's finance team refers to a "daily post report", this is it. Note the four adjustment
> domains — open item, deposit liability, revolving, bad debt — which are exactly the four AR
> ledgers we have identified.

### FINDING 297 — STORIS proposes key-offs it will not perform
Producer:   `Report Suggested Account Adjustments` — "lists **by location, by account**, the credit
            and debit transactions **that should be keyed off against each other**"; selectable by
            credit amounts less than or greater than a whole-dollar threshold
Evidence:   Report Suggested Account Adjustments, /articles/15203214702484
Maps to:    NEW

> A matching engine that only advises. The key-off itself is manual (`Maintain Customer Balances`,
> batch 3). An obvious automation candidate in a rebuild — and a reason migrated AR may contain
> long-standing offsetting pairs nobody ever keyed off.

### FINDING 298 — `Report Product with Low Stock` is an inventory report filed under Accounting
Content:    products below the minimum or safety-stock quantity, or at zero on hand
Invariant:  "**Report Product with Low Stock only looks at the `Warehouse Inventory Settings`, not
            the Product file.** The settings in the Product file only default … when a **new**
            warehouse is created, not to update a current one."
Status types: below minimum · below safety stock · quantity on hand zero
Evidence:   Report Product with Low Stock, /articles/15203112885652
Maps to:    **out of scope for Accounting** — belongs with Inventory Management (already dissected)

> Second misfiled article in AVR (after `Mapping Update Audit Report`, batch 24). The wiring note is
> still worth keeping: **warehouse-level settings win over product-level defaults**, and product
> defaults only seed *new* warehouses. That is a settings-precedence rule of the same family as the
> GL account hierarchy.

### FINDING 299 — The TPA error log is drained by End-of-Day into history
Producer:   `Report on Third Party Accounting Transmission Errors` — GL errors during transfers,
            vendor updates and other TPA processes; selectable by **operator, port number and store
            location**
Invariant:  "The report lists all errors that occurred **since the last End of Day** … The **End of
            Day process removes these errors from the current log and moves them to history**.
            Depending on when you run the report and the End of Day process, and whether corrections
            were made, **you may see errors on the report that occurred during a previous transfer
            and for setup issues already corrected.** Therefore, users need to note the date and time."
Evidence:   Report on Third Party Accounting Transmission Errors, /articles/15203013127828
Maps to:    completes batch 19 (Finding 238)

> An error log that both rolls over daily and shows stale entries is a poor operational surface —
> STORIS says so itself, in effect, by telling users to check timestamps. **Port number** as a
> selection dimension is a green-screen-era artefact worth noting.

### FINDING 300 — Recovered bad debts are tracked by satisfaction date
Producer:   `Report Recovered Bad Debts` — "by customer code, all customers who have **paid off their
            debt** and the **date the debt was satisfied**"; scoped to balances "previously
            charged-off using the **Bad Debt feature in `Maintain Customer Balances` (Open Item
            Maintenance)**"
Evidence:   Report Recovered Bad Debts, /articles/15203128360340
Maps to:    completes batch 3 (Finding 46) — and names `Maintain Customer Balances`'s alias,
            **Open Item Maintenance**

---

## C. Screen and field inventory

**Report Reconciliation Transactions** — Bank · Starting Date · Ending Date · Ending Balance ·
**Reporting Mode** · Include Reconciled Only · **Report Status as of Ending Date** ·
Send Output to · Export Path.
Columns: Document Number · Reference/Comment · Description · Transaction Type · Debit · Credit ·
Issued · Status · Origin · Balance · Reconciliation Date · Locn.

**Report Cleared Transactions** — columns BAI Code · BAI Description · Reference/Description ·
Document Number · Amount · Transaction Type · Paid Date.

**Report Reconciliation Errors** — columns BAI Code · BAI Description · Reference/Description ·
Document Number · Amount · Transaction Type · Bank Date · Error Message.

**Report Detailed Daily Adjustments** — Date · Code · From · To · Transactions · District · Store ·
Display Format · Include GL Postings · Send Output to · Export Path.

**Report Summarized Account Adjustments** — Date Code · As Of Date · Send Output to · Export Path.

**Report Suggested Account Adjustments** — Send Output to · Export Path (plus a credit-amount threshold).

**Report Recovered Bad Debts** — Date Code · Start Date · End Date · Send Output to · Export Path.

**Report on Third Party Accounting Transmission Errors** — Date Code · Start/End Date · Operator ·
Port Number · Store · Send Output to · Export Path.

**Report Product with Low Stock** — Product · Group · Category · Brand · Inventory Type ·
Status Type · Detail Level · three sorts · Region · Location · Exclude Special Order Products ·
Exclude Obsolete Products · Send Output to · Export Path.

---

## D. Control settings catalog (additions)

*(None new; `Warehouse Inventory Settings` precedence over the Product file is noted in Finding 298.)*

---

## E. Security permissions catalog (additions)

*(None new. Regional Processing applies to the daily/summarized/suggested adjustment reports and to
`Report Product with Low Stock`.)*

---

## F. State machines and enumerations

**Bank rec status** — CLEAR / OPEN, driven by the **`MATCHED`** flag.

**Bank rec origin codes** — `EOD` (deposits) · `APC` (checks) · manual posting code.

**Sign convention** — the report's Debit column shows records stored as **credits** (and subtracts);
the Credit column shows records stored as **debits** (and adds).

**Adjustment domains** — open item · deposit liability · revolving · bad debt write-offs.

**Low stock status types** — below minimum · below safety stock · zero on hand.

**Report period selectors seen** — today · yesterday · as of a date · current period-to-date ·
last period-to-date · last period total.

---

## G. Sequencing rules (additions)

1. Purge sets the reconciliation epoch; reports starting after it compute a beginning balance from
   retained transactions.
2. End-of-Day drains the TPA error log into history.
3. `Report Detailed Daily Adjustments` runs at Day-Ending **and** Month-Ending as the Daily Post Report.
4. `Report Reconciliation Errors` runs automatically after an automatic bank import, to PDF.

---

## H. Open questions and gaps

**1. Gated or unreachable** — none.

**2. Documented but ambiguous**
- **`Reporting Mode`** and **`Report Status as of Ending Date`** on the reconciliation report —
  two behaviour-changing options with no values or explanation. The second implies point-in-time
  reconstruction of reconciliation status, which is exactly what an auditor asks for.
- **`APC`** origin code — presumably "AP Check"; not expanded.
- **Manual posting code** — the third origin family is a *code*, not a fixed value; its domain is
  the `Reconciliation Transaction Type Settings` (batch 2) but the link is not stated.
- **Whether the sign inversion applies elsewhere** — the report says it is done "to maintain
  consistency with banks reports". Whether other bank-facing screens do the same is unstated.
- **`Report Recurring Journal Entries`** logged, not dissected.
- **`Port Number`** on the TPA error report — a session/terminal identifier not modelled anywhere.

**3. Inferences (not quotable, kept out of section B)**
- The four adjustment domains map exactly to the four AR ledgers identified across batches 3, 7, 8
  and 15 (open item, deposit liability, revolving long-term, bad debt); not stated as such.
- `Report Status as of Ending Date` probably reconstructs what was cleared *as at* a date rather than
  showing current status — the difference matters for audit and is not documented.
- `APC` almost certainly stands for AP Check, matching the `All Checks Printed Successfully` trigger
  from batch 3; not stated.

---

## I. Unknown unknowns (additions)

- **Deliberate debit/credit sign inversion** on bank-facing reports.
- **`MATCHED` flag** as the reconciliation state.
- **Origin codes** distinguishing EOD deposits, AP checks and manual postings.
- **Daily Post Report** as the EOD/EOM alias of the detailed adjustments report.
- **Suggested key-offs** as an advisory matching engine.
- **Port number** as an error-log dimension.
- **Warehouse-over-product settings precedence.**

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| MATCHED flag | The bank reconciliation record's cleared/open state |
| Origin (`EOD` / `APC` / manual) | Where a bank reconciliation record came from |
| Balance forward | The bank's stored balance as of the last purge |
| Daily Post Report | EOD/EOM alias of `Report Detailed Daily Adjustments` |
| Open Item Maintenance | Alias of `Maintain Customer Balances` |
| Suggested account adjustments | Advisory list of debit/credit pairs that should be keyed off |
| Locn | Store location on a deposit record; null for non-deposit records |
