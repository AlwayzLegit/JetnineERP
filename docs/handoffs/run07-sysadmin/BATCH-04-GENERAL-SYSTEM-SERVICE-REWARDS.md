# Run 07 — System Administration — Batch 4: General System, Service, and Customer Rewards

Status: complete. Findings 377–390. Read-only throughout. No setting saved, no encryption toggled.

**This batch closes run 03's largest declared gap** (membership rewards, which run 03 batch 16 F158
called *"the single largest functional area in Sales Processing that we cannot reconstruct"* and
recommended a vendor question for), **and enumerates module licensing** — the thing run 04 found
changing business behaviour seven times and could never list.

---

## A. Coverage log

| # | Article | id | Status |
|---|---|---|---|
| 1 | **General System Control Settings** | 15186501982740 | read — four tabs; **licensing and encryption** |
| 2 | **Service Control Settings** | 15186453256980 | read — three tabs |
| 3 | **Customer Rewards Control Settings** | 15186452549524 | read — **five fields close a whole module** |

---

## B. Wiring findings

### FINDING 377 — Licensing is counted per site, not toggled per feature

- **Invariant:** the licence grants a number of users and a number of sites for four named modules.
- **Evidence** — `General System Control Settings`, **Licensing** tab:
  > "STORIS sets the following **display-only** fields automatically during the licensing setup. They display here for informational purposes and **cannot be edited on this screen.**"
  **`Licensed Client ID` · `Licensing Expires` · `Licensed Users` · `AWM Sites` ·
  `AWM Putaway Sites` · `WMS Sites` · `Barcode Sites`**
- **Maps to:** run 04 F175, F185, F190, F206, F212, F214 · run 06 F331 — **seven findings whose cause
  is now visible**; run 06 F327 (concurrent licensing); `W-050`.

> Run 04's summary opened with a caveat that governed the whole run: *"six times a licensed module was
> found to change base behaviour rather than add to it… every finding is conditional on a licence and
> settings set we have never seen."* **This is that licence set**, and its shape is a surprise.
>
> **Licensing is not a list of features. It is counts of sites.** `AWM Sites`, `AWM Putaway Sites`,
> `WMS Sites`, `Barcode Sites` — four numbers. So the question is never "do we have AWM" but **"how
> many of our warehouses have AWM"**, and run 04's findings about AWM directing pickers (F245), aisle
> locking (F229) and directed putaway (F227) apply **per site**, up to a purchased count.
>
> That materially changes how the audit's run-04 caveat should be read. It is not one configuration
> question; it is **a per-warehouse map**, and the answer for LA Mattress is a small table someone can
> read off this screen.
>
> **`AWM Putaway Sites` is licensed separately from `AWM Sites`** — directed putaway is a distinct
> purchase from warehouse management scheduling.
>
> **`Licensed Users` and `Licensing Expires`** confirm run 06 F327's concurrent-licence enforcement and
> expiry warnings at log-in, and give the two numbers behind them. **The parallel-run risk flagged
> there is now checkable**: read `Licensed Users`.
>
> Note what is **absent**: `EDI Control Settings` (run 07 F371) says EDI Processing is activated *"on
> the **Active Add-Ons** tab of the General System Control Settings"*, and **this article names four
> tabs — General, Security, Licensing, Miscellaneous — with no Active Add-Ons tab.** Either the tab is
> among the *"fields accessible by STORIS personnel only"* and undocumented, or one of the two articles
> is stale. **Recorded as observed; not reconciled.**

### FINDING 378 — Six categories of PII can be encrypted at rest, each toggle re-authenticated and run by a named phantom

- **Invariant:** database encryption is per-data-category, permissioned, and converts data in place.
- **Evidence** — `General System Control Settings`, **Security** tab:
  > "The default for these encryption settings is **checked**. The following encryption settings can only be changed if you have permission via your user/user group system security setting, "**Modify General System Control Settings data encryption**". **After each option is checked or unchecked a user security login request is shown.** The user must enter their User ID and password, **or obtain an override from another user with permission** to proceed. If you **uncheck** any of the boxes, the **encrypted data is converted to decrypted via a phantom process (`SYS.ENCRYPT.DECRYPT.PTM`)**… **The process of encrypting/decrypting data can take a significant amount of time.** It is recommended that… you run it when there are no other users on the system."
  **`Encrypt Credit Application` · `Encrypt Credit Scores` · `Encrypt Date of Birth` ·
  `Encrypt Driver's License Numbers` · `Encrypt Social Security Numbers` ·
  `Document Archive Mask PII`**
- **Maps to:** run 06 F316 (the security override) · run 06 F323 (Complex Passwords / PCI) ·
  run 03 F78 (duplicate search by SSN) · run 03 F90 (the credit application's personal data);
  `W-050`; **NEW** — no contract covers data protection.

> **The most sensitive settings the audit has found, and they are defended properly.** A dedicated
> permission, **re-authentication after each individual toggle**, and the run-06 F316 override screen
> offered as the alternative — three of the audit's credential mechanisms converging on one checkbox.
>
> **Defaults are on**, which is the right default and worth noting: a site has to deliberately turn
> encryption *off*.
>
> The operational warning is real: unchecking runs a conversion phantom over the whole database.
> **`SYS.ENCRYPT.DECRYPT.PTM`** is the first named phantom process in the audit and it supports
> **inference I-66** from batch 3 — a phantom is a background process, not a placeholder record. Run 04
> inference I-43 is now firmly wrong.
>
> Run 03 found the credit application collects *"a very large set of personal and financial data"*
> (F90) and that duplicate search runs on **social security number** (F78). **Both are encryptable
> here**, and `Document Archive Mask PII` extends protection into the archived-document store — which
> connects to run 05's file attachments and run 03 F53's archived signed documents.
>
> For the rebuild this is a short, concrete requirements list: **credit applications, credit scores,
> dates of birth, driver's licence numbers, SSNs, and archived documents.**

### FINDING 379 — Regional Processing has four named restriction switches

- **Invariant:** the location-scoping judged *inverted* in eight runs is four toggles.
- **Evidence** — `General System Control Settings`, **Miscellaneous** tab:
  **`Multi-Company Processing`** · **`Regional Processing`** · **Restrictions:**
  **`Customer Lookup` · `Inter-Region Stock Transfers` · `Inter-Region Auto-Transfers` ·
  `Product Use/Lookup`**
  > "**Regional restriction by district or region is not available to Cloud (SaaS) users.** However, Cloud users can use the **location restriction** feature to apply security restrictions, and **regional/district pricing is available** as well."
- **Maps to:** `W-050` — **inverted, upheld eight times across six runs; the mechanism is now
  enumerated**; run 04 F251 (transfer security tables).

> **Eight upholdings and this is the first sight of the switches.** Regional Processing is a master
> toggle plus **four restriction categories** — and they are narrower than the audit's evidence
> suggested. The boilerplate *"you can inquire only about customers and locations to which you have
> access"* appeared on dozens of reports across five runs; **the actual restrictions are customer
> lookup, product use/lookup, and two transfer categories.**
>
> **Inter-region stock transfers and auto-transfers are separately restrictable**, which sits beside
> run 04 F251's location-pair security matrix as a second movement-scoped control.
>
> **The SaaS carve-out is a genuine deployment fact**: region/district restriction is unavailable in
> the cloud, replaced by location restriction. So **the answer to "how is access scoped here" depends
> on whether LA Mattress is on-premise or SaaS** — a question the audit has never asked and which
> changes an access-control model it spent six runs mapping.
>
> **`Multi-Company Processing`** alongside `Default Company Number` (General tab) and
> `Inbound 810 Invoice Company` / `Use Specific Company To Pay For Invoices` (run 07 F371) establishes
> **multi-company as a real dimension** — never seen in seven runs, and it sits above Regional
> Processing in scope.

### FINDING 380 — Active Directory authentication exists, which qualifies run 06's "authentication is optional"

- **Invariant:** log-in can defer to an external directory.
- **Evidence** — `General System Control Settings`, **Security** tab:
  **`System Admin ID` · `User ID at Login` · `Extended Security` ·
  **`Use Active Directory Authentication`** · `Report Builder Security` · `Complex Passwords` ·
  `Password Expires After` · `Menu Timeout After` · `Login Timeout After` · `Timeout Notification` ·
  `Report Error Messages`**
- **Maps to:** run 06 F323 — **qualifies it**; `W-050`.

> Run 06 F323 found that `Extended Security` is *"the switch that turns the password field on"* and
> concluded **STORIS can run with identification and no authentication.** That stands — but
> **`Use Active Directory Authentication`** is a third posture the audit did not know about:
> credentials can be delegated to the corporate directory.
>
> So the log-in posture is **three-way**: no password · STORIS password · **Active Directory**. That
> materially changes the cutover question. If LA Mattress uses AD, **STORIS user accounts are already
> federated identities** and migrating them is a different problem — an easier one.
>
> **`Menu Timeout After` and `Login Timeout After`** are two separate inactivity timeouts with a
> `Timeout Notification`, and **`System Admin ID`** names a single super-user account. Neither appeared
> in run 06.

### FINDING 381 — Five settings define the entire customer rewards model

- **Invariant:** rewards are a purchase percentage, an expiry, a conversion rate to gift certificates, and a second expiry.
- **Evidence** — `Customer Rewards Control Settings`, complete body:
  > "Use this routine to specify **the amount of reward points you want to award customers for their purchases** and **the length of time reward points and gift certificates remain valid**."
  **`Reward Points Accumulated Only with Purchase Membership`**
  **`Reward Points are Calculated at ____ % for Customers`**
  **`Accumulated Points are Valid for ____ Days`**
  **`Gift Certificates can be Issued for ____ % of the Accumulated Points`**
  **`Gift Certificates are Valid for ____ Days`**
  > "The settings in this routine are **global**. They affect all customers and products. To award reward points **on a product-by-product basis, use the Advanced Product Settings**. To **restrict selected customers** from the Customer Rewards feature, use the **Customer Settings**."
- **Maps to:** run 03 batch 16 F158 — **the gap it declared unreconstructable is closed**;
  run 07 F343; `W-028`.

> **Run 03 batch 16 F158 is worth quoting against this**, because it is the audit's clearest case of
> a conclusion being right about the evidence and wrong about the world:
>
> > "**Nothing we have read in three runs says how points are earned, at what rate, what redeems them, whether redemption is a tender type, or what happens to a balance at renewal.** No control-settings record for it has been named. … **This is the single largest functional area in Sales Processing that we cannot reconstruct.** … it is a candidate for a targeted vendor question rather than more reading."
>
> **Every one of those questions is answered by five fields.** Points are earned as a **percentage of
> purchase**; they **expire after N days**; they are **redeemed by converting a percentage of the
> balance into a gift certificate**, which **itself expires**. So redemption is **not** a tender type —
> it is gift-certificate issuance, which is why run 03 batch 16 found `View Reward Gift Certificates`
> as a sibling screen and could not place it.
>
> **The vendor question was unnecessary.** The answer was in a section the six-run queue did not
> include. That is the strongest possible argument for this seventh run, and a caution worth carrying:
> **"we cannot reconstruct this" should always be qualified by "from the sections we have read."**
>
> The **third fall-through** appears again — global here, per product in Advanced Product Settings, per
> customer in Customer Settings.
>
> **`Reward Points Accumulated Only with Purchase Membership`** ties the two programs run 07 F343
> separated: **points can be made contingent on paid membership.** So rewards and membership are
> distinct programs with an optional dependency, which is exactly why one inquiry screen showed both.

### FINDING 382 — Service order status defaults and status-history retention are configured

- **Invariant:** new and closed service order statuses are defaults, and status history has a retention.
- **Evidence** — `Service Control Settings`, **General** tab:
  **`Status for New Orders` · `Status for Closed Orders` · `Keep Status Data for Days` ·
  `Deposit Holdback is %` · `Default Service Location` · `Default Service Type` ·
  `Allow Service with no Coordinator` · `Allow Service Order to be Reinstated` ·
  `Allow Problem Text Change` · `Allow Financing` · `Perform Credit Check` ·
  `Verify User ID During Entry` · `Store Location is Same as Service Location` ·
  `Verify Labor for In-Home Service Orders` · `Verify Labor for In-Shop Service Orders`**
- **Maps to:** run 05 F306 (event-sourced status history) — **its retention**; run 05 F304, F305;
  run 05 F293 (`Default Service Type`); `W-064`; `W-012`.

> **`Keep Status Data for Days` is the retention for run 05 F306's status-duration history** — the only
> event-sourced status log the audit found in six runs. It has a lifespan, and it is a **days** counter
> rather than months, which suggests a shorter horizon than most STORIS history.
>
> That qualifies run 05's recommendation. The audit said the business's **real service cycle times are
> recoverable from STORIS**, unlike most of run 04. **They are recoverable only as far back as this
> setting allows** — worth reading the value before promising an analysis.
>
> **`Deposit Holdback is %`** is new: service orders hold back a percentage of deposit. Nothing in run
> 05 mentioned it, and it connects service to the deposit machinery of run 03 batch 5.
>
> **`Allow Problem Text Change`** governs the problem narrative that run 05 F311 identified as *the
> durable payload of a service order* — the only thing that survives reinstatement. Whether it can be
> edited after the fact is a setting.
>
> **`Perform Credit Check` and `Allow Financing`** confirm run 05's closing observation that
> **service orders are financial documents**, and give the two switches.

### FINDING 383 — Labour is configured with rate, cost, time increments and two units of measure

- **Invariant:** service labour has a chargeable rate, an internal cost, and a granularity.
- **Evidence** — `Service Control Settings`, **Parts and Labor** tab:
  **`Default Labor Rate Per Hour` · `Allow Labor Rate Change` · `Default Labor Cost Per Hour` ·
  `Labor Time Increments (hhmm)` · `Minutes Unit of Measure Code` · `Hours Unit of Measure Code` ·
  `Allow Parts Price Change` · `House Vendor Code` · `Vendor Chargeback Method` ·
  `Payables Hold Code` · `On-the-Fly PO's on Hold` · `Verify Warranty Expiration` ·
  `Auto Adjust Parts on Quick In-Shop`**
- **Maps to:** run 05 F295 (labour lines) · run 05 F307 (profitability by employee) · run 05 F308 ·
  `W-061`.

> **Rate and cost are separate fields**, which is what makes run 05 F307's `Report Profitability by
> Service Employee` possible — margin on labour is rate minus cost, and both have system defaults.
>
> **`Labor Time Increments (hhmm)`** with separate minute and hour unit-of-measure codes means labour
> is billed in configured blocks. Run 05 catalogued `Labor Time` and `Labor Rate` on the line without
> knowing the granularity.
>
> **`House Vendor Code`** is the internal "vendor" that in-house labour is booked against — the
> mechanism by which own-technician work flows through the same parts-and-labour structure as an
> outside contractor's.
>
> **`Verify Warranty Expiration`** is the switch behind run 05's four payment responsibilities: it
> checks whether the warranty is still live before assigning cost to it.
>
> **`Vendor Chargeback Method` appears here for a sixth time**, in a sixth record. The naming problem
> the audit has tracked since run 02 now spans: Purchasing Control Settings · Volume Rebate Status ·
> Enter a Stock Adjustment · Report Service Chargebacks to Manufacturer · Inventory Control Settings ·
> **Service Control Settings**. Batch 2 F363 linked two of them; **this is a third instance of the same
> field name as the Inventory Control Settings default**, which suggests one shared concept after all.
> **Inference I-16 is upgraded from "downgraded twice" back to "probable"** — but still not stated.

### FINDING 384 — Tickling has four timing settings, not one

- **Invariant:** service follow-up is governed by four day-counters plus a travel-time average.
- **Evidence** — `Service Control Settings`, **Scheduling** tab:
  **`Tickle Processing Active` · `After Last Call Days` · `Call Customer Days` ·
  `Call Before In-Home Days` · `Average Travel Time` · `Print Problem on COG Document` ·
  `Allow Manifest Update from Picking` · `Cut Off Routes Days Prior to Scheduled Date`**
- **Maps to:** run 05 F291, F292 — **CONFIRMED and extended**; run 07 F339 (manifest update from
  picking); `W-012`.

> Run 05 F292 found tickling driven by `Call Customer Days` against the Last Contact date. **There are
> three day-counters**: `Call Customer Days`, **`After Last Call Days`**, and **`Call Before In-Home
> Days`** — the last being a *pre-visit reminder*, which is exactly the use case the Tickle Process
> article opened with (*"call the customer the day before a technician is scheduled to arrive"*) and
> which the audit could not tie to a setting.
>
> **`Average Travel Time`** feeds service scheduling the way `Base Stop Time` feeds delivery routing
> (run 07 F369) — the labour-time model for service calls.
>
> **`Cut Off Routes Days Prior to Scheduled Date`** is a service-side route closing rule, distinct
> from the capacity-driven closing found in batch 3 F367. **Two ways a route closes**, and neither
> article mentions the other.
>
> **`Allow Manifest Update from Picking`** is the service counterpart of run 07 F339's four
> `Allow Updates To Manifest From` switches — so the pick-list-creates-manifest behaviour of run 06
> F335 is configurable per module.

### FINDING 385 — Log files are retained five days and the period is not user-settable

- **Invariant:** system logging has a fixed, vendor-controlled retention.
- **Evidence** — `General System Control Settings`, preamble:
  > "**Log files are active and retained for a period of 5 days** until **automatically turned off by Generate Daily Reports (End of Day process) and purged**. This amount of time **can be manually changed only by STORIS. There is no setting displayed for this function.**"
- **Maps to:** `W-064` — **a retention chain with no setting**; run 06 F326; `W-012`.

> **The second retention chain in the audit with no user-facing setting**, after run 06 F326's
> `Purge Messenger Activity`. Here it is worse: **the value exists, is five days, and is not displayed
> anywhere.**
>
> A **twelfth EOD behaviour**, and one that matters for any investigation: **whatever went wrong more
> than five days ago has no log.** For a cutover with a parallel run, that is a short window, and it is
> not extendable without calling STORIS.

### FINDING 386 — There is a communications server, recommended for PCI compliance

- **Invariant:** clients are expected to connect through an intermediary server.
- **Evidence** — `General System Control Settings`, Miscellaneous:
  > "**STORIS highly recommends you make use of the communications server.** The "Comm" server resides **in between your PC workstations and the STORIS server**… users connect to the communications server, which in turn connects to the STORIS server on the users' behalf."
  > "Activating the **Comm Server Redirection path** – **helps protect your data in the event of a network failure**, and – **assists in PCI compliance.**"
  > "Enabling the **Deployment Server path** – provides more control in deployment functions (for example, allows access to **automatic SCI and Help updates**)."
  Four testable paths: **`File Redirect` · `SCiX AU Deployment` · `Bassett XML Catalog` ·
  `End of Day AIX Back Up`**, each with a **TEST button**.
- **Maps to:** run 06 F323 (PCI via Complex Passwords) — **a second PCI touchpoint**; run 03 batch 4
  (card processing); **NEW**.

> **Second PCI reference in the audit**, and this one is architectural rather than a password rule.
> The comm server is a **proxy tier**, and its absence is a compliance gap the vendor flags but does
> not enforce.
>
> **`Bassett XML Catalog`** names a specific furniture manufacturer's product catalogue feed — an
> **eighth named external dependency**, and the first that is a *content* feed rather than a service.
> With `Ashley Custom Cost Formula` in this same subsection, **STORIS ships vendor-specific
> integrations for named manufacturers.** That is worth knowing: some of what looks like configuration
> is actually a supplier-specific feature.
>
> **`End of Day AIX Back Up`** and `Eject Tape on AIX Server` (General tab) place the platform: **AIX**,
> with tape backup, alongside a **Cloud (SaaS)** option with its own time-zone settings. **Two
> deployment models**, and run 07 F379 shows they differ in access-control capability.

### FINDING 387 — Home currency is a single system-wide setting

- **Invariant:** the system has one home currency.
- **Evidence** — `General System Control Settings`, General tab: **`Home Currency`**.
- **Maps to:** run 04 F272 (an exchange rate on landed-cost distribution) — **the other half**;
  `W-061`.

> Run 04 F272 found an `Exchange Rate` field on `Distribute Add-on Receiving Costs` and called
> multi-currency *"the first sighting in four runs"*, asking whether currency appears anywhere else.
>
> **It appears here, once, as a single home currency.** So the model is: **one home currency, foreign
> amounts converted at entry.** STORIS is not multi-currency in the ledger sense; it accepts
> foreign-denominated vendor invoices for landed cost and converts them. That is a much smaller
> requirement than "multi-currency ERP" and it is worth stating plainly.

### FINDING 388 — Scheduled processes have a maximum, and three phantoms auto-start

- **Invariant:** background processing is capped and daemon-started.
- **Evidence** — `General System Control Settings`, General tab:
  **`Maximum Scheduled Processes` · `Auto Start Process Scheduler Phantom` ·
  `Auto Start FR CFA Phantom` · `Additional "Logto" Account Name` ·
  `EOD Completion Email Address` · `File Save with Scheduled EOD` · `File Save Storage Device`**
- **Maps to:** run 07 F375 (`Auto Start WMS Phantom`) · run 07 F378 (`SYS.ENCRYPT.DECRYPT.PTM`) —
  **inference I-66 confirmed**; run 06 F327.

> **Three auto-start phantoms now named** — Process Scheduler, FR CFA *(the Customer Facing
> Application)*, and WMS — plus a named conversion phantom. **Batch 3's inference I-66 is confirmed:
> a phantom is a background daemon**, and run 04's I-43 (a placeholder record) is definitively wrong.
> Recorded as a resolved inference.
>
> **`Maximum Scheduled Processes`** is a concurrency cap on the scheduler — a real operational limit
> for anyone planning batch work, and the second such limit after `Licensed Users`.
>
> **`EOD Completion Email Address`** is a **sixth notification channel**: End of Day emails a human
> when it finishes. The audit has now found six — STORIS Messenger, flexEngage, the envelope icon,
> System Notification, ELP, and this — **each discovered incidentally, none described anywhere as a
> system.**

### FINDING 389 — Spreadsheet import uses three configurable token characters

- **Invariant:** import files carry in-band control characters that the site defines.
- **Evidence** — `General System Control Settings`, **Import Spreadsheet Data Tokens**:
  **`Column Calculation Indicator` · `Clear Data/Field Indicator` · `Multiple Value Indicator` ·
  `Days Retain Import Errors` · `Days Retain Interface Queue`**
- **Maps to:** the `Importing Data` subsection (1 article, unread); `W-064`; **NEW**.

> Three **in-band token characters** in import spreadsheets: one marks a computed column, one means
> *clear this field*, one separates multiple values in a cell. That last pair is the interesting one —
> **there is an explicit "make this empty" token**, distinct from leaving a cell blank, which is the
> classic import ambiguity and STORIS resolves it deliberately.
>
> For any data migration **into** the new system this is directly reusable design, and for migration
> **out of** STORIS it is a warning: **historic import files encode meaning in characters the site
> chose.**
>
> Two more retention counters — import errors and the interface queue — bringing the run's total to
> around twenty-five.

### FINDING 390 — On-the-fly maintenance and on-hold on-the-fly POs are both switches

- **Invariant:** creating master data mid-transaction is permitted by setting, in two places.
- **Evidence** — `General System Control Settings`, General tab: **`On-The-Fly Maintenance`**.
  And `Service Control Settings`, Parts and Labor: **`On-the-Fly PO's on Hold`**.
- **Maps to:** run 04 F257 (special-order products created on the fly from a transfer) ·
  run 08 *(service parts)*; `W-024`; `W-050`.

> Run 04 F257 found that a transfer clerk with the right user setting can **create a product and a
> purchase order from the transfer screen**. `On-The-Fly Maintenance` is the system-level switch above
> that, and **`On-the-Fly PO's on Hold`** is the control: POs created that way land **on hold**.
>
> That is a well-judged pairing — allow the convenience, then quarantine the result — and it connects
> to run 04 F203's PO on-hold namespace. **A rebuild that allows master-data creation mid-flow should
> copy the hold**, not just the convenience.

---

## C. Screen and field inventory

| Screen | Structure |
|---|---|
| **General System Control Settings** *(tabs: General, Security, Licensing, Miscellaneous)* | **General:** Terminal Mode Screen Title · Report Displayed/Print Title · Font for PDF Reports · Default Company Number · **Home Currency** · Report Retention Days · Include Legend on Reports · Print Company Header · On-The-Fly Maintenance · EOD Completion Email Address · File Save with Scheduled EOD · File Save Storage Device · Eject Tape on AIX Server · Maximum Scheduled Processes · Auto Start Process Scheduler Phantom · Auto Start FR CFA Phantom · Additional "Logto" Account Name · Cloud Service (SaaS) Time Zone · Ignore Daylight Savings · Offset Cloud Server by ___ Hours. **Security:** System Admin ID · User ID at Login · Extended Security · Use Active Directory Authentication · Report Builder Security · Complex Passwords · Password Expires After · Menu Timeout After · Login Timeout After · Timeout Notification · Report Error Messages · **6 encryption toggles**. **Licensing:** *(display-only)* Licensed Client ID · Licensing Expires · Licensed Users · AWM Sites · AWM Putaway Sites · WMS Sites · Barcode Sites. **Miscellaneous:** Multi-Company Processing · Regional Processing *(+4 restrictions)* · Product IDs Starting with Zero · Only Complete Product on Ship Ticket · 'Alternate' English same as 'English' · Skip EDI Data Encryption · Use Expanded Customer Address · **URL and Server Paths** *(4, each with a TEST button)* · **Import Spreadsheet Data Tokens** *(5)* |
| **Service Control Settings** *(tabs: General, Parts and Labor, Scheduling)* | as quoted in F382–F384 |
| **Customer Rewards Control Settings** | 5 fields, F381 |

---

## D. Control settings catalog (additions)

Roughly 90 fields across three records. Newly confirmed cross-references:

| Prior finding | Confirmed |
|---|---|
| run 03 batch 16 F158 | **the entire rewards model** (F381) |
| run 04's licensing caveat | `AWM Sites` / `AWM Putaway Sites` / `WMS Sites` / `Barcode Sites` (F377) |
| run 04 F272 | `Home Currency` (F387) |
| run 05 F291, F292 | `Tickle Processing Active`, three day-counters (F384) |
| run 05 F304, F305 | `Allow Service Order to be Reinstated` (F382) |
| run 05 F306 | `Keep Status Data for Days` (F382) |
| run 06 F323 | the Security tab, **plus Active Directory** (F380) |
| run 06 F327 | `Licensed Users`, `Licensing Expires` (F377) |

---

## E. Security permissions catalog (additions)

- **`Modify General System Control Settings data encryption`** — a user/user-group system security
  setting, with **per-toggle re-authentication** and the run-06 F316 override as the alternative (F378).
- **`System Admin ID`** — a named super-user account.
- **`Report Builder Security`** — a switch on the Security tab, tying to run 01's Report Builder work.
- **Regional Processing's four restriction categories** (F379).
- **`Verify User ID During Entry`** *(Service Control Settings)* — the service-side instance of run 07
  F344's Point of Sale User Verification, confirming it exists in three records as stated there.

---

## F. State machines and enumerations (additions)

- **Licence dimensions (7):** Client ID · Expires · **Users** · **AWM Sites** · **AWM Putaway Sites** ·
  **WMS Sites** · **Barcode Sites** (F377).
- **Encryptable PII categories (6)** (F378).
- **Regional Processing restrictions (4)** (F379).
- **Log-in postures (3):** none · STORIS password · **Active Directory** (F380).
- **Rewards model (5 parameters)** (F381).
- **Tickle timings (3 day-counters)** (F384).
- **Named phantoms (4):** Process Scheduler · FR CFA · WMS · `SYS.ENCRYPT.DECRYPT.PTM` (F388, F375, F378).
- **Deployment models (2):** on-premise AIX with tape · Cloud (SaaS) with time-zone offset (F386).
- **Import tokens (3)** (F389).

---

## G. Sequencing rules

1. Encryption toggle changed → **re-authentication** → `SYS.ENCRYPT.DECRYPT.PTM` converts the data
   (F378).
2. **End of Day** → log files turned off and purged after **5 days**; EOD completion emailed (F385, F388).
3. Purchase → **reward points at a percentage** → points expire after N days → **converted to a gift
   certificate** at a percentage → certificate expires after N days (F381).
4. Service order → statuses default from settings; **status history kept for N days** (F382).
5. On-the-fly PO created → **placed on hold** (F390).

---

## H. Open questions and gaps

### Resolved this batch

- **The customer rewards model** — run 03 batch 16 F158's declared-unreconstructable area (F381).
- **Module licensing** — run 04's governing caveat (F377).
- **Regional Processing's mechanism** — eight upholdings, now enumerated (F379).
- **Inference I-66** *(a phantom is a background process)* — **confirmed** by four named phantoms.
  Run 04 **I-43 is wrong** and is retired.
- **Multi-currency scope** — one home currency (F387).

### Newly opened

- **The `Active On-Adds` / `Active Add-Ons` tab discrepancy** (F377) — `EDI Control Settings` names a
  tab that this article does not list. Unreconciled.
- **`Bassett XML Catalog`** and **`Ashley Custom Cost Formula`** — vendor-specific shipped
  integrations (F386).
- **`Deposit Holdback is %`** on service orders — new, unexplained (F382).
- **`Additional "Logto" Account Name`**, **`Only Complete Product on Ship Ticket`**,
  **`'Alternate' English same as 'English'`**, **`Skip EDI Data Encryption`**,
  **`Product IDs Starting with Zero`**, **`Use Expanded Customer Address`** — named, unexplained.
- **`Auto Adjust Parts on Quick In-Shop`** — implies a "Quick In-Shop" flow not seen in run 05.

### Still unresolved

- The audit's undefined terms: **`Twilight`** and **`ELP`** remain; nothing resolved this batch.
- **`Track Settings Activity`** — still the highest-priority unread routine (batch 3 F368).

### Inferences

- **I-68:** `FR CFA` is the Customer Facing Application phantom — run 03 F93 found a consumer-facing
  locked kiosk credit application. *The abbreviation fits; not stated.*
- **I-69:** The `Active Add-Ons` tab is among the fields *"accessible by STORIS personnel only"* and is
  therefore omitted from this article. *Plausible given the article's own caveat; not stated.*

---

## I. Unknown unknowns

- **"We cannot reconstruct this" was section-bound, not absolute** (F381). Run 03 spent a batch
  concluding the rewards module was unreconstructable and recommending a vendor question; five fields
  in an unread section answered it completely. **Every such conclusion in six runs deserves re-testing
  against System Administration before it is acted on.**
- **Deployment model changes the access-control model** (F379). Region/district restriction is
  unavailable on SaaS. Six runs mapped Regional Processing without asking where STORIS runs.
- **Vendor-specific integrations ship in the product** (F386). Bassett and Ashley are named in
  settings and article titles. Some of what the audit read as generic configuration may be
  supplier-specific, and the boundary is not marked.
- **Six notification channels, none described as a system** (F388). Every one was found incidentally.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **AWM Sites / AWM Putaway Sites / WMS Sites / Barcode Sites** | Licence counts, per warehouse, per module |
| **`SYS.ENCRYPT.DECRYPT.PTM`** | Phantom converting PII between encrypted and plain |
| **Phantom** | A background daemon *(confirmed)* |
| **Comm server** | Proxy tier between workstations and the STORIS server; assists PCI compliance |
| **Home Currency** | The single system currency; foreign amounts convert at entry |
| **House Vendor Code** | The internal vendor in-house service labour is booked against |
| **Labor Time Increments** | The billing granularity for service labour |
| **Import data tokens** | In-band characters marking computed columns, field clearing, multiple values |
| **`Logto` account** | An additional named account on the General tab; unexplained |

---

## Contract adjudication — batch 4

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — Regional Processing enumerated after eight upholdings** | Four restrictions (F379); Active Directory as a third posture (F380); encryption permission (F378) |
| **W-028** *(gift certificates and loyalty)* | **CONFIRMED — run 03's declared gap closed** | The five-parameter rewards model, redeemed **as gift certificates** (F381) |
| **W-064** *(retention)* | **CONFIRMED** | Status data, report retention, import errors, interface queue, and a **5-day log retention with no setting** (F382, F385, F389) |
| **W-012** *(dates and batch processes)* | **CONFIRMED — a twelfth EOD behaviour** | Log purge and EOD completion email (F385, F388) |
| **W-061** *(cost)* | **CONFIRMED** | Labour rate vs cost as separate defaults (F383); one home currency (F387) |
| **W-024** *(holds)* | **CONFIRMED** | On-the-fly POs land on hold (F390) |
| **W-046** *(chargebacks)* | **inference I-16 upgraded to probable** | A sixth instance, matching the Inventory Control Settings field name (F383) |
| **Licensing** | **NEW — enumerated** | F377 |
| **Data protection / PII encryption** | **NEW — no contract covers it** | F378 |
| **Deployment model** | **NEW** | F379, F386 |

---

## Next — batch 5

`STORIS Messenger Control Settings` · `System Notifications` · `Event Notification Control` ·
**`Track Settings Activity`** · `Terminal Settings` · `Bar Code Control Settings` — then the
remainder of System Control Settings with a coverage statement.
