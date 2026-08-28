# Run 07 — System Administration — Batch 25: Control Settings Tail

Status: complete. Findings 694–709. Read-only throughout.

Six more control records. **`D2` is sourced** (F700), bringing the audit to four of run 04's
twenty-two credit hold codes attributed. **Batch 20 F634's collections-precedence gap closes**
(F694), and **batch 18 F595's "quick sale customers"** is explained (F709).

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **Collections Processing Control Settings** | 15186501540756 | read |
| 2 | **API Control Settings** | 15186452328468 | read — `11.0`/`10.8`, five tabs |
| 3 | **Accounts Receivable Control Settings** | 15186452327572 | read — four tabs |
| 4 | **Purchasing Control Settings** | 15186502233492 | read — ~30 flags |
| 5 | **Payment Card and Device Settings** | 15186452993556 | read — three pages |
| 6 | **Quick Sale Control Settings** | 15186501993236 | read |

**System Control Settings inventoried** (87 articles, listing read in full). The subsection is
**one record per module** plus a set of small lookup/table screens. Named but not read:
`Account Statement Cycling Control Settings` · `Alternate Tax Interface Control Settings` ·
`Ashley Custom Cost Formula` · `Automatic Transfers` · `Bar Code Add-On Settings` ·
`Cash Balancing Control Settings` · `Check-Levels for Exceptions` ·
`Commission Calculation Code Options` · `Credit Application Control Settings` ·
`Customer's Own Materials (COM) Control Settings` · `D-Tools System Control Settings` ·
`Data Warehouse Control Settings` · `Default Due Day Table` ·
`Default Store/District Assignments - Collections` · `Deferment Fee Table` ·
`Demographics Control Settings` · `eBridge Commerce Credit Review Queue Retention Days` ·
`Electronic Check Processing Control Settings` · `eSTORIS Control Settings` ·
`Event Notification Control` · `Financing Control Settings` · `Hi/Lo Gross Profit Option` ·
`Import BIN/IIN Table` · `Installment Receivables Control Settings` ·
`Maintain Event Configuration` · `Micro*D PreVue` · `Net Purchase Order` ·
`Order Line Import Control Settings` · `Payables Control Settings` · `POS Bar Code Control Settings` ·
`Product Auto-Numbering Exclusion Ranges` · `Product Configurator Control Settings` ·
`Quick Purchase Order Settings` · `Report Archive Retention Days` · `Requested Date Calculation` ·
`RetailDeck Control Settings` · `Revolving Receivables Control Settings` +~25 more.

---

## B. Wiring findings

### FINDING 694 — Collections assignment has a stated precedence, closing batch 20's gap

- **Invariant:** with several criteria configured, the system applies alphabetic, then days overdue, then amount overdue.
- **Evidence** — `Collections Processing Control Settings`:
  > "You can choose to assign customers to Collections in any or all of the following ways: **alphabetically via the customer's last name · days overdue · amount overdue**"
  > "**If you use more than one method, the system uses the above hierarchy to assign Collections, applying the first found.**"
  > "…the system then automatically assigns customers (or reassigns customers whose criteria changes) whenever… **the customer cycles, a payment causes a customer's collections criteria to change.**"
  Fields: `Alphabetical` · `Minimum Days` · `Minimum Amount` · `District` · `Location` ·
  `Collection Letters` · `Automatic Reassignment` · **`Remove When Current`** ·
  **`Default Collections Manager`** · **`Evaluate During`** · **`Number of Phantoms`**.
- **Maps to:** **batch 20 F634 §H item 3** (*"Collector assignment precedence across five composable
  dimensions"*) — **closed for three of them** · batch 20 F635 · W-035.

> **Batch 20 read `Collector Settings` and could not find the precedence; it is in the control record,
> not the collector record.** Alphabetic beats days beats amount, first match wins.
>
> **Three of the five dimensions are now ordered.** `District` and `Location` also appear here as
> fields, and the stated hierarchy does not mention them — so they are most likely *filters* on the
> collector pool rather than *criteria* in the walk. **Not stated; recorded at reduced severity.** §H.
>
> **Two automatic triggers**, and the second is the interesting one: *a payment causes a customer's
> collections criteria to change*. So **collections assignment is re-evaluated on cash receipt**, not
> only on the billing cycle. A rebuild's payment posting path must fire that evaluation.

### FINDING 695 — Changing the collections parameters does not reassign anyone

- **Invariant:** edits to this record take effect only when Mass Collector Reassignment is run.
- **Evidence** — `Collections Processing Control Settings`:
  > "**NOTE: Changing the parameters on this screen does not automatically reassign customer collections assignments. To apply the changes, you must run the `Mass Collector Reassignment` routine.**"
- **Maps to:** **batch 20 F635** (changing a *collector's* criteria **does** cascade immediately) ·
  resolve-once-and-store · W-035.

> **The two records behave in opposite ways, and this is worth stating plainly.** Change a
> **collector's** criteria and the system immediately strips their assignments and re-runs (batch 20
> F635). Change the **control settings** — the rules that define what criteria even mean — and
> **nothing happens** until someone runs a separate routine.
>
> **That asymmetry is a trap.** An administrator switching the company from amount-based to age-based
> collections will see no change, conclude the setting did not take, and change something else.
> **A rebuild should either propagate both or prompt on both**; silently propagating one and not the
> other is the worst of the three options.

### FINDING 696 — Installment events that zero a balance do not re-evaluate collections

- **Invariant:** deferments and contract re-writes that bring the balance to zero leave the customer in collections.
- **Evidence** — `Collections Processing Control Settings`:
  > "**When an installment transaction brings the customer's account current balance due to 0.00, such as when processing a payment deferment or contract re-write, the customer is not re-evaluated for collections. The customer is not automatically reassigned to a new collector and is not removed from collections.**"
- **Maps to:** F694 (`Remove When Current`) · batch 21 F645 (`Allow Deferment`) · run 01 (installment
  receivables) · W-035.

> **A documented exception to `Remove When Current`**, and a defensible one: a deferment does not mean
> the customer paid, it means the debt moved. **Removing them from collections because a balance
> arithmetic hit zero would lose the account.**
>
> **But it is stated as behaviour, not as policy**, with no way to change it — so a customer whose
> contract is genuinely re-written to current stays assigned until someone intervenes manually.
> **A rebuild should make this an explicit rule with a reason recorded**, rather than an invisible
> exception, since it is the kind of thing that produces "why is this good customer still in
> collections".

### FINDING 697 — Collections evaluation runs on a configurable phantom pool

- **Invariant:** the record specifies when evaluation runs and how many phantoms serve it.
- **Evidence** — `Collections Processing Control Settings` fields: **`Evaluate During`** ·
  **`Number of Phantoms`**.
  `Accounts Receivable Control Settings` carries the parallel: **`Number of Cycle Phantoms`** ·
  `Credit Hold Queue Refresh`.
- **Maps to:** batch 22 F657, F658 (the phantom pool and its autoscaler) · batch 18 F582 · W-041.

> **Batch 22 F657 established that phantom counts are vendor-set and *not to be changed*. Here two
> business records expose phantom counts directly to the administrator** — collections evaluation and
> AR cycling each get their own pool size.
>
> **So the "do not change" rule is not universal**: it applies to `Phantom Process Settings`, while
> module-level records surface their own tuning. **A rebuild does not need this** — modern queue
> runtimes size themselves — but it confirms batch 22's reading that **queue depth is
> business-visible**: someone chose these numbers because collections was running too slowly.

### FINDING 698 — The API is eBridge Commerce, licensed with submodules, and carries its own POS defaults

- **Invariant:** API order submission has a dedicated control record supplying defaults for orders with no user.
- **Evidence** — `API Control Settings`:
  > "Use this routine to establish parameters for **eBridge Commerce order submission.**"
  > "**APIs must be licensed and active via General System Control Settings. The API license has submodules, such as eBridge Commerce.**"
  Tabs and selected fields: Warehouse (`Warehouse Product Availability` · `On Display Product
  Locations` · `On Display Reason Codes`) · Inventory (`Require Available Merchandise` ·
  `Accept Out-Of-Stock Discontinued Products`) · Fulfillment (`Parcel Route` ·
  `Local Parcel Shipping Only` · `Direct Ship Delivery Company` · `Minimum Number Of Lead Days` ·
  `Delivery Date Status` · `Pickup Date Status` · `Delivery Pad Days` · `Pickup Pad Days`) ·
  **Default Point of Sale** (`Selling Store` · `Salesperson` · `Order Source` ·
  `Add Store to Manual POS Number`) · Other (`Salesperson` · **`Allow Auto PO Creation`** ·
  **`Allow Scheduling of Orders on Credit Hold`** · `Order Source` ·
  `# of Times to Attempt to Send to YOTPO` · `Default Tax ID Number` ·
  `Default Tax Expiration Add On Days`).
- **Maps to:** batch 17 F564 (module + submodule licensing) · batch 18 F590 (the interactive rung an
  API cannot answer) · batch 15 F523 (pad days) · W-051, W-058.

> **This is the record that answers batch 18 F590's problem.** That finding noted that the delivery
> company hierarchy has an *interactive* middle rung — a prompt — which an API order cannot answer,
> so integration orders would fall to the `ZZZZZ` sentinel. **The API control record supplies exactly
> the defaults a headless order needs**: selling store, salesperson, order source, delivery company
> for direct ship, parcel route, lead days and pad days.
>
> **`Allow Scheduling of Orders on Credit Hold` is the one to flag.** Run 03 F153 established that a
> credit hold is released by End of Day, not by approval. **This setting lets API orders be scheduled
> while still held** — a deliberate bypass of a control the store-side path enforces. Worth an
> explicit decision in the rebuild rather than inheritance.
>
> **`YOTPO` is a review/UGC platform** and a **third** unlisted integration, after Avalara (batch 18
> F598) and Birdeye (batch 23 §I). **Batch 17 F562's "complete external dependency surface" is now
> contradicted three times.**

### FINDING 699 — API orders can auto-attach related items from collections or formations

- **Invariant:** related-item suggestions are generated from either cross-cutting product mechanism.
- **Evidence** — `API Control Settings`, Other tab:
  > "**`Create Related Items From Product Collections`** · **`Create Related Items From Inventory Formations`**"
- **Maps to:** batch 24 F685 (collections) · batch 13 F491 (inventory formations) · batch 13 F493
  (add-on sales prompts) · W-014.

> **Two independent switches for the two cross-cutting product mechanisms**, which confirms batch 24
> F685's conclusion that collections and formations are genuinely different things — **a site can use
> one, the other, or both to drive web merchandising.**
>
> **It also makes formations a web-facing construct**, joining batch 13's finding that they drive
> add-on sales prompts in store. **Sixth consumer of Inventory Formations.**

### FINDING 700 — `D2` is the minimum-deposit credit hold, set per order type

- **Invariant:** an order failing a line-type minimum deposit is placed on D2 hold and can still be saved.
- **Evidence** — `Accounts Receivable Control Settings`, Deposits tab:
  > "**If you enter a minimum deposit %, then when in order entry if one or more line items does not meet its minimum deposit requirement, the order is placed on `D2` credit hold and you can save the order.**"
  > "For each of the **five order types**, enter the percentage of the line item price you want designated as the minimum deposit requirement. **If you leave a field blank, you indicate no minimum deposit requirement for the line item type.**"
  Order types: **`Whole Order` · `Take With Lines` · `Customer Pickup Lines` · `Delivery Lines` ·
  `Direct Shipment Lines`**.
  > "**You cannot specify a minimum deposit percent for delivery/install charges, although they appear on the `Required Deposits by Line` screen. The whole order minimum includes delivery/install charges.**"
  Also: `Include Estimated Tax and Fees` · `Customers with Credit Exempt` ·
  `Service Orders Exempt` · `Maximum Balance` · `Over Maximum Balance` ·
  **`Re-evaluate D2 Credit Hold When Order is Saved`** · `Immediate Deposit Refund Types`.
- **Maps to:** **run 04 F201** (the 22-code credit hold catalogue) · batch 20 F627 (`F3`, `F4`) ·
  the Sales Security handoff (`Approve E1 credit holds`, `Override Minimum Deposit on Take With
  Orders`) · W-035.

> **Fourth of twenty-two credit hold codes sourced** — `E1` (exchange), `F3` (finance declined),
> `F4` (finance provider), and now `D2` (minimum deposit). Run 04 catalogued the codes; run 07 is
> steadily attributing their causes.
>
> **Blank means no requirement, which is the *blank defers* idiom used as "no rule"** rather than "use
> the parent". Five independent thresholds, one per fulfilment type, because the deposit risk differs
> — a delivery order with stock in the warehouse is a different exposure from a direct shipment.
>
> **`Re-evaluate D2 Credit Hold When Order is Saved` makes the hold dynamic:** add a deposit and the
> hold can clear on save. That is a meaningfully better design than run 03 F153's credit holds, which
> wait for End of Day. **Two hold-release models in one system.**

### FINDING 701 — Take-with orders are the one case a deposit shortfall blocks completion

- **Invariant:** every other order type may be saved on D2 hold; take-with cannot be completed.
- **Evidence** — `Accounts Receivable Control Settings`:
  > "**The exception to this is that take-with orders not meeting the minimum deposit requirement cannot be completed.**"
- **Maps to:** F700 · the Sales Security handoff (`Override Minimum Deposit on Take With Orders`) ·
  batch 14 F520 · W-035.

> **The logic is sound and worth naming: take-with means the goods leave with the customer**, so a
> deposit shortfall is not a credit risk to be flagged — it is money that will never be collected.
> Every other type has a later touchpoint.
>
> **The Sales Security permission `Override Minimum Deposit on Take With Orders` is the escape
> hatch**, and this is now a fully-closed override pair — restriction here, override there — matching
> the pattern the Sales Security handoff recommended documenting for all 27 overrides. **Second
> worked example after batch 18 F596's duplicate-email pair.**

### FINDING 702 — Minimum deposit percentages double as the deposit hold-back rule

- **Invariant:** when `Deposit Hold Back %` is unset, the per-type minimums govern hold-back on partial completions.
- **Evidence** — `Accounts Receivable Control Settings`:
  > "**NOTE: These fields are used primarily to place an open order on credit hold if the requirement is not met. They are also used for deposit hold-back on partial completions, if the `Deposit Hold Back %` field is not set. This prevents the back-order from being placed on `D2` credit hold.**"
  Related fields: `Deposit Hold Back %` · `Deposit Overpayment Allowed` · `Deposit Hold Back` ·
  `Next Deposit Number` · `Service to Sales Deposit Move`.
- **Maps to:** F700 · run 03 (partial completion, deposits) · the Sales Security handoff
  (`Override Deposit Hold Back on an Order`) · W-035.

> **One setting serving two purposes, with a fall-through between them** — and the stated reason is
> circular in a pleasing way: hold back enough deposit on a partial completion **so that the
> remaining back-order does not immediately fail its own minimum-deposit test.** The system is
> protecting itself from its own rule.
>
> **A rebuild must implement this or partial completions will cascade into D2 holds**, which is
> exactly the sort of emergent behaviour that looks like a bug and is actually a missing rule.

### FINDING 703 — Gift card numbering is either prefix-validated or sequence-generated, never both

- **Invariant:** five card prefixes are active only when no next-certificate-number is set.
- **Evidence** — `Accounts Receivable Control Settings`, Gift Cards and Certificates tab:
  > "**To enable gift card swiping, you must enter a value at the `Card Number Prefix` field below. To ensure your card numbering sequence is compatible with STORIS, contact STORIS before you buy gift cards.**"
  > "Use the `Card Number Prefix` fields below to enter **up to five gift card prefix numbers. If not using the `Next Certificate Number` field below, then when creating gift cards you must specify a card number, either manually or by swiping. The card number you specify must begin with a string of characters specified at one of these fields. Otherwise, the system rejects the entry. Note that these fields are active only if no response exists at the `Next Certificate Number` prompt.**"
  > "…**if the gift cards were imported and begin with alpha (A-Z) characters, when manually entering or accessing the gift card the alpha characters are not included.**"
  Also: `Gift Processing` · `Purchase Gift` · `Add Funds to Existing` · `Refund Gift Balance` ·
  `Zero Balance Retention Days` · `Card Swipe Required` · `Validate Manual Entry` ·
  `Gift Registry Default Type` · `In-Store Use Only Default Type` · `Next Registry Certificate Number`.
- **Maps to:** batch 18 F588 (`REWARDS` is a closed internal type) · batch 21 F637 · W-035.

> **Two mutually exclusive numbering models**: physical pre-printed cards validated by prefix, or
> system-generated sequential certificates. **The presence-of-a-value mode switch again** (batch 17
> F564's Podium URIs), and the exclusivity is stated rather than left to inference.
>
> **The alpha-prefix stripping note is a data hazard**: imported cards beginning with letters are
> accessed *without* those letters, so **the stored number and the entered number differ**. Any
> migration matching gift cards by number must replicate that stripping or lose balances.
>
> **`Refund Gift Balance` as a setting** contrasts with batch 18 F588's finding that reward
> certificates can *never* be refunded. **Purchased gift value is refundable by configuration;
> reward value is not, by design.**

### FINDING 704 — AR holds two identity-verification controls

- **Invariant:** duplicate SSNs can be permitted or blocked, and driver's licence verification can be required.
- **Evidence** — `Accounts Receivable Control Settings`, General tab:
  > **`Allow Duplicate Social Security Numbers`** · **`Verify Customer Driver License`** ·
  > **`Automatic Display of Legal Settings`** · `Secured Audit Retention Months` ·
  > `Audit All Customer Activity` · `Allow Overpayments on Charged Off Accounts` ·
  > `Days to Limit Backdating during NSF / Misapply` · `Automatic Charge-Off` ·
  > `Charge-Off before Non-Accrual` · `Tax Adjustments for Charge-offs` · `Credit Aging Method` ·
  > `Past Due / Open Order Hold` · `Daily Maximum Cash Refund Per Customer`.
  Credit Reporting tab: `NFS Export File` · `Exclude Account if Balance Is:` · `Metro 2 Format` ·
  `Retention Days`.
- **Maps to:** batch 18 F599 (the PII block) · batch 22 F652 (`Secured Data` purge) · batch 19 F603
  (legal settings) · batch 20 F606 (Metro 2 exclusions) · W-036, W-064.

> **`Allow Duplicate Social Security Numbers` is a setting a rebuild should think hard about
> inheriting.** It exists because families share addresses and data-entry errors happen — but a
> system that permits duplicate SSNs cannot use SSN as an identity key, which has downstream effects
> on credit reporting (batch 20 F606) where the SSN *is* the bureau's key.
>
> **`Secured Audit Retention Months` here and the `Secured Data` purge in batch 22 F652 are the same
> retention story from two records** — the purge routine reads per-type retention, this holds an audit
> retention. **Two clocks on one sensitive-data lifecycle.**
>
> **`Automatic Display of Legal Settings` surfaces batch 19 F603's collections flags automatically**
> — so a collector opening an account sees the legal status without navigating three levels of
> Actions button. Good design, and it partly mitigates F603's menu-less-routine problem.
>
> **`Automatic Charge-Off` and `Charge-Off before Non-Accrual`** name a charge-off state machine the
> audit has not read. §I.

### FINDING 705 — Purchasing Control Settings is ~30 named behaviour flags behind a STORIS-only warning

- **Invariant:** the record opens with a warning that many of its fields are vendor-editable only.
- **Evidence** — `Purchasing Control Settings`:
  > "**NOTE: Many system control settings have powerful effects on your system and thus are accessible by STORIS personnel only. Consult your STORIS representative before attempting to edit any of these fields.**"
  > "**Purchase Orders and Return To Vendor transactions are printed via `Enhanced Laser Forms`.**"
  Selected flags, verbatim: `AS-IS RECEIVING - Single P/O Transfers` ·
  `BACK ORDER REPLENISH - Comprehensive Replenishment` ·
  `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` ·
  `DIRECT SHIP - Place Direct Ship Purchase Orders on Hold` ·
  `EDI - Allow Acknowledgment to Adjust Order Quantity` · `ENTRY - Allow Manually Entered Purchase
  Order Numbers` · `GENERAL - Activate Buying Group` · `GENERAL - Exclude Weekends in Vendor Lead
  Days` · **`GENERAL - Generate Daily Reports Links POs to Sales Orders`** ·
  `GENERAL - Include As-Is Quantities in GMROI Calculation` ·
  `LEAD DAYS CALCULATION Override Lead Days if Purchase Order Date is Greater` ·
  `NUMBERING - Add Location Prefix to the Purchase Order Number` ·
  `RECEIVING - Supply Purchase Orders must be Received` ·
  `SALES RATE REPLENISH - Replenish Orderable Products` · `…Include Store Stock Availability in
  Calculations` · `…Utilize standard rounding for Recommended Order Quantity` ·
  `SPECIAL ORDERS - Allow Electronic Transmission of POs During Sales Entry` ·
  `SPECIAL ORDERS - Place Purchase Orders Created on-the-Fly on Hold` ·
  `SPECIAL ORDERS - Use Replacement Cost as a Default` · `VENDOR RETURNS - Calculate Freight`.
  Plus: `Next Purchase Order Number` · `Days to Keep Voided Purchase Orders` ·
  `Days to Keep Closed Purchase Orders` · `Vendor Class for Vendor Search` (`Include` / `Exclude`,
  *"mutually exclusive"*) · `Daily Exceptions Cost Change Percent` · `Sales Order Linkage Access` ·
  `Preset Discounts` · `Days to Pad Auto Reallocation` · `Vendor Rebate Chargeback Method`.
- **Maps to:** batch 23 F669 (`Activate Buying Group`) · batch 15 F522, F527 (lead days, in-transit) ·
  batch 22 F657 (vendor-owned settings) · W-016, W-051.

> **The vendor-owned-settings pattern reaches a whole record.** Batch 15 F531 found unnamed
> vendor-maintained fields; batch 20 F628 found a labelled locked block; batch 22 F657 found a
> do-not-change record. **This one warns that *many* of its fields are STORIS-only without saying
> which — the worst variant.** §H, and it compounds batch 16's unknown-unknown that the audit has
> been reading ~50 control records assuming they are site-editable.
>
> **`GENERAL - Generate Daily Reports Links POs to Sales Orders` is a significant discovery.** Run 04
> and the Sales Security handoff both treat PO-to-sales-order linkage as a manual or entry-time act.
> **A daily batch also creates those links** — an eleventh batch-calendar responsibility, and it
> means linkage state can change overnight without anyone acting.
>
> **`Daily Exceptions Cost Change Percent` is a threshold on the cost-exception queue** that run 03
> F144 and run 04 F219 built the margin chain around. **A tuning knob on the audit's most
> consequential mechanism**, named here for the first time.

### FINDING 706 — Two flags permit dropped and discontinued products to keep open sales quantity

- **Invariant:** purchase status changes can be applied despite open POS quantity, and incoming POs can count toward availability.
- **Evidence** — `Purchasing Control Settings`:
  > "**`PURCHASE STATUS - Product can be 'Dropped' with Open POS Quantity`**"
  > "**`PURCHASE STATUS - Product can be 'Discontinued' with Open POS Quantity`**"
  > "**`PURCHASE STATUS - Include Incoming PO's when Determining Availability for Dropped and Discontinued Products`**"
- **Maps to:** batch 14 F506 (the six purchase status types and their oversell rules) · W-016.

> **Batch 14 established that `D` and `T` prevent overselling. These flags decide whether you may
> even *enter* those statuses while customers are waiting** — which is a different question, and a
> commercially important one: dropping a product with open orders means those orders may never be
> filled.
>
> **The third flag softens the block**: incoming purchase orders can count toward availability for
> dropped and discontinued products, so open orders backed by an inbound PO remain fillable.
> **Together the three make status change a governed operation rather than a data edit**, and a
> rebuild that treats purchase status as a simple field will lose all three controls.

### FINDING 707 — Card processing is EMV-only, with token sharing and an End-of-Day abandonment sweep

- **Invariant:** legacy signature capture is unsupported; tokens are shareable with retention; abandoned transactions resolve at EOD.
- **Evidence** — `Payment Card and Device Settings`:
  > "**NOTE: Legacy signature capture in conjunction with legacy credit card devices is no longer supported.**"
  > "Currently, this page is used to establish settings for **EMV online credit card processing with `Tender Retail` or `Shift-4` as the processor. Other processors may be available in the future.**"
  > **Token Sharing**: `Active` · `Require CVV` · **`Token Retention Days`**
  > **Resolve Abandoned Transactions**: **`Run Automatically During EOD`** · `Only Mark As Resolved` ·
  > `Prior Days to Include`
  > **Pre-Authorized Deposits**: `Allow Pre-Authorized Deposits` · **`Amount Increase Limit`**
  Also: `Processor` · `Client ID` · `Server Time Out milliseconds` · `Shift-4 Local EMV` ·
  `Always Print Merchant Receipt` · `Always Print Customer Receipt` · `Transaction Retention Days` ·
  `Recurring Payment Location` · `Manual Authorization at Non-Process Locations` ·
  `Use Payment Terminal to Prompt for Billing Zip Code`; EMV Signature page: `ECA Transactions` ·
  `Complete Pickup Transactions Without Accessing Order Entry` ·
  `Take With and Quick Sales Transactions` · `Show Signature` · `Amount Required for Signature` ·
  `Device Character Display Limit`.
- **Maps to:** **batch 22 F653** (`Retain Settled Card Number for NN Days` — this is the record) ·
  batch 17 F575 (*"Shift4 or the new gateway"*; token portability) · batch 21 F638, F639 · W-035, W-058.

> **This is the PCI control record batch 22 F653 pointed at, and it answers batch 17 F575's token
> question in part.** `Token Sharing` with `Token Retention Days` is how membership auto-renewal gets
> a stored credential — **and it confirms the tokens are STORIS-held with a retention clock, not
> merely processor-side.**
>
> **Twelfth End-of-Day responsibility, and a financially material one:** `Resolve Abandoned
> Transactions` sweeps card transactions left in limbo. **`Only Mark As Resolved` is the flag to
> understand** — it appears to distinguish actually resolving from merely flagging, which are very
> different outcomes for money in flight. Not explained. §H.
>
> **`Amount Increase Limit` on pre-authorised deposits caps how much a pre-auth can grow** — a real
> consumer-protection control, and one a rebuild must carry as a hard limit rather than a warning.
>
> **Batch 21 F639's swipe/signature coupling is now dated**: legacy signature capture is unsupported,
> so that finding describes a superseded configuration. **Recorded as a correction.**

### FINDING 708 — The BIN/IIN download fails differently depending on how it is invoked

- **Invariant:** with blank credentials the process shows a dialog from the menu and logs errors when scheduled.
- **Evidence** — `Payment Card and Device Settings`, BIN/IIN File page:
  > "A **BIN/IIN number is a 4 to 6 digit number on a credit card that identifies the institution issuing the card. It also identifies the capabilities and branding of the card.**"
  > "The BIN/IIN file is provided by a **3rd party banking or processing institution** and typically contains a list of all the numbers currently in use."
  > "**NOTE: This feature is available for users of the Shift4 platform only and is not available on systems using either the STORIS Legacy Credit Card or Tender Retail platforms.**"
  > "**NOTE: If the `Download URL`, `User ID`, or `Password` fields are left blank, the process does not run from the menu system (where it shows an error dialog) or as a scheduled process (where it logs errors).**"
  Fields: `Download URL` · `User ID` · `Password` · `File Name` · `Last downloaded on`.
- **Maps to:** batch 18 F582, F583 (scheduled processes) · batch 17 F563 (unvalidated credentials) ·
  W-058.

> **The same failure, two different visibilities** — a dialog a human sees, a log entry nobody
> necessarily reads. **That is the scheduled-process blind spot batch 18 F582 identified**, stated
> here explicitly by the vendor.
>
> **Three card platforms are now named** — Shift4, Tender Retail, and STORIS Legacy Credit Card —
> with feature availability differing between them. **Which platform LA Mattress runs determines
> whether BIN/IIN data exists at all**, and BIN data drives card-type routing and surcharge
> eligibility. Adds to the live-system checklist.

### FINDING 709 — Quick Sale is a distinct entry mode, which explains uneditable "quick sale customers"

- **Invariant:** a configurable minimal-prompt sale path with its own printing model.
- **Evidence** — `Quick Sale Control Settings`:
  > "Use this routine to specify your preferences for **Quick Sale Entry**. The first group of settings determine **how 'quick' you want your Quick Sale Entry process to be. For example, do you want to collect customer zip code information from Quick sales?**"
  Fields: `Automatic Stock Adjustments` · `Allow Line Discounts` · `Force Line Item Add` ·
  `Prompt for Telephone` · **`Prompt for Zip Code`** · `Allow Entry of Salesperson` ·
  **`Verify User ID During Entry`** · `Print Receipt on Slip Printer` · `Forms Designer` ·
  `Print Product Description on Sales Slip` · `Source of Header on Sales Slip` · `Sales Slip Text`.
  > "**NOTE: In order to print thermal/slip print version of sales order forms ('FAST CASH' Form Type in Forms Designer), both the `Print Receipt on Slip Printer` and `Forms Designer` settings need to be active.**"
- **Maps to:** **batch 18 F595 §H item 6** (*"quick sale customers are uneditable, undefined"*) —
  **now explained** · the Sales Security handoff (`Bypass verify user ID during entry`) · W-036.

> **Batch 18 recorded "you cannot edit quick sale customers" as an undefined third customer class. It
> is not a class of customer — it is a class of *sale*.** A quick sale collects minimal or no customer
> detail (zip and phone are optional prompts), so whatever customer record it produces is a stub with
> nothing meaningful to edit. **§H item closed.**
>
> **`Verify User ID During Entry` here pairs with the Sales Security permission `Bypass verify user ID
> during entry`** — another closed restriction/override pair, the third worked example after F701 and
> batch 18 F596. **The pattern the Sales Security handoff recommended is holding up: every override
> permission has a settings-side restriction, and the audit keeps finding them.**
>
> **`Automatic Stock Adjustments` on a sale path** means a quick sale can move inventory without a
> separate adjustment — consistent with counter/cash-and-carry retail, and a write path into
> inventory the rebuild must account for.

---

## C. Screen and field inventory (additions)

Field lists inline above. Tab structures: `API Control Settings` — Warehouse · Inventory ·
Fulfillment · Default Point of Sale · Other. `Accounts Receivable Control Settings` — General ·
Gift Cards and Certificates · Credit Reporting · Deposits. `Payment Card and Device Settings` —
EMV · EMV Signature · BIN/IIN File.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Evaluate During` · `Number of Phantoms` | Collections Processing Control Settings | When and with what parallelism collections evaluates (F697) |
| `Remove When Current` | Collections Processing Control Settings | Auto-removal on balance clearing, with a documented exception (F696) |
| `Allow Scheduling of Orders on Credit Hold` | API Control Settings | Lets headless orders bypass a store-side control (F698) |
| minimum deposit % × five order types | AR Control Settings › Deposits | D2 hold thresholds; also deposit hold-back fallback (F700, F702) |
| `Re-evaluate D2 Credit Hold When Order is Saved` | AR Control Settings | Makes D2 dynamic rather than EOD-released (F700) |
| `Allow Duplicate Social Security Numbers` | AR Control Settings | Whether SSN can be an identity key (F704) |
| `GENERAL - Generate Daily Reports Links POs to Sales Orders` | Purchasing Control Settings | A daily batch creates PO↔SO links (F705) |
| `Daily Exceptions Cost Change Percent` | Purchasing Control Settings | Threshold on the cost-exception queue (F705) |
| `Token Sharing` / `Token Retention Days` | Payment Card and Device Settings | Stored payment credentials for recurring charges (F707) |
| `Resolve Abandoned Transactions` › `Run Automatically During EOD` | Payment Card and Device Settings | Nightly sweep of in-flight card transactions (F707) |

---

## F. State machines and enumerations (additions)

**Collections assignment precedence** — alphabetic → days overdue → amount overdue, first found
(F694).

**Credit hold codes sourced: four of twenty-two** — `D2` minimum deposit (F700) · `E1` exchange ·
`F3` finance declined · `F4` finance provider (batch 20 F627).

**Minimum deposit order types** — five: Whole Order · Take With · Customer Pickup · Delivery ·
Direct Shipment (F700).

**Card platforms** — Shift4 · Tender Retail · STORIS Legacy Credit Card, with differing feature
availability (F708).

**End-of-Day responsibilities, cumulative: twelve** — the nine from batch 22, plus PO↔SO linkage via
Generate Daily Reports (F705), twilight repricing (batch 24 F680), and abandoned card transaction
resolution (F707).

---

## G. Sequencing rules (additions)

**Control-record edits do not propagate; collector-record edits do** (F695 vs batch 20 F635) — the
same domain, opposite behaviours.

**Presence-of-a-value as a mode switch — third instance**: gift card prefixes are active only when
`Next Certificate Number` is empty (F703); cf. Podium URIs (batch 17 F564), Twilight reason code
(batch 24 F681).

**One setting serving two purposes with a fall-through between them** (F702) — minimum deposit % also
governs hold-back when `Deposit Hold Back %` is unset.

---

## H. Open questions and gaps

1. **Purchasing Control Settings warns that "many" fields are STORIS-only without naming them**
   (F705). The worst variant of the vendor-owned-settings problem, on a record with ~30 behaviour
   flags. **Compounds batch 16 §I.**
2. **`Only Mark As Resolved`** (F707) — the difference between resolving an abandoned card
   transaction and flagging it is money in flight. Unexplained.
3. **Do `District` and `Location` participate in the collections precedence?** (F694). They are
   fields on the record but absent from the stated hierarchy.
4. **`Automatic Charge-Off` / `Charge-Off before Non-Accrual`** (F704) — a charge-off state machine
   named, unread.
5. **Which card platform does LA Mattress run?** (F708). Determines BIN/IIN availability, and pairs
   with batch 17 F575's gateway question.
6. **`Vendor Rebate Chargeback Method`** and `Sales Order Linkage Access` (F705) — named,
   undescribed.

**Resolved this batch**

7. **Batch 20 F634's collections precedence** — closed for the three stated criteria (F694).
8. **Batch 18 F595's "quick sale customers"** — a class of *sale*, not of customer (F709).
9. **Batch 22 F653's `Payment Card and Device Settings`** — read (F707).

**Correction**

10. **Batch 21 F639 describes a superseded configuration** (F707). *"Legacy signature capture in
    conjunction with legacy credit card devices is no longer supported"* — the swipe/signature
    coupling applies to the legacy platform, not EMV.

**Inferences**

- **I-111** — `District` and `Location` on the collections record are collector-pool filters rather
  than assignment criteria. **Consistent with the field list; not stated.**

---

## I. Unknown unknowns

- **`YOTPO`** (F698) — a **third** integration absent from batch 17 F562's 23 tabs, after Avalara and
  Birdeye. That inventory is now contradicted three times.
- **A charge-off state machine** with non-accrual (F704), tax adjustments and overpayment rules.
- **`eBridge Commerce`** (F698) — the API product name; its own Help lives outside STORIS.
- **`GMROI` calculation** (F705) — a merchandising metric with an As-Is inclusion flag; never
  described.
- **`Micro*D PreVue`, `D-Tools`, `Demographics Control Settings`** in the listing — three more
  external or analytical subsystems.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **`D2` credit hold** | Placed when a line fails its minimum deposit percentage |
| **Deposit hold-back** | Deposit retained on a partial completion so the back-order does not fail its own minimum |
| **eBridge Commerce** | The API submodule handling external order submission |
| **Token sharing** | STORIS-held payment credentials with a retention clock, enabling recurring charges |
| **BIN/IIN** | The 4–6 digit issuer identifier on a card; Shift4 platform only |
| **Quick Sale** | A minimal-prompt counter sale mode producing stub customer records |
| **Abandoned transaction** | A card transaction left in flight, swept nightly |

---

## Contract adjudication — batch 25

| Contract | Verdict | Basis |
|---|---|---|
| **W-035** *(receivables / holds)* | **CONFIRMED — `D2` sourced** | F700, F701, F702 |
| **W-036** *(customer master)* | **CONFIRMED** | Identity controls (F704); quick sale stubs (F709) |
| **W-041** *(batch calendar)* | **CONFIRMED — twelve EOD responsibilities** | F705, F707 |
| **W-051** *(licensing)* | **CONFIRMED — submodules again** | API licence has submodules (F698) |
| **W-016** *(purchasing)* | **CONFIRMED — status change is governed** | F705, F706 |
| **W-058** *(external interfaces)* | **CONTRADICTED — third time** | YOTPO absent from the integration record (F698) |
| **W-050** *(access control)* | **CONFIRMED** | Two more restriction/override pairs closed (F701, F709) |
| **W-064** *(auditability)* | **CONFIRMED** | Secured audit retention; audit-all-activity flag (F704) |
| **Headless-order defaults** | **NEW — no contract covers it** | F698 |

---

## Next — batch 26

**Views and Reports** (45) · **Account Setup** (4) · **Purging Data** (1) · **Importing Data** (1) —
bulk inventory of the four smallest subsections, closing them completely.
