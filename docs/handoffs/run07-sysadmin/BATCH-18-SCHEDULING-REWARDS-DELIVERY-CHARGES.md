# Run 07 — System Administration — Batch 18: Scheduling, Rewards and Delivery Charges

Status: complete. Findings 582–602. Read-only throughout.

**Three structural closures.** `Schedule a Process` finally enumerates how scheduled work runs
(batch 17 §I). The **two rewards programs** turn out to be independent and additive, which resolves
the ambiguity batch 17 F573 recorded. And the **delivery charge model** is read end to end,
confirming batch 17 F572 and correcting run 04.

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **Schedule a Process** | 15185876708628 | User Settings | read — `11.0`/`10.8`, *"Updated as of 5/29/25"* |
| 2 | **Customer Rewards Control Settings** | 15186452549524 | System Control Settings | read |
| 3 | **Customer Rewards Overview** | 15186451245588 | Overviews | read — **the model** |
| 4 | **Issue Customer Rewards** | 15201409254292 | Sales Processing | read (followed link) |
| 5 | **Advanced Customer Settings** | 15242629407380 | Customer Settings | read — `11.0`/`10.8`, six pages |
| 6 | **Customer Membership Settings** | 16917471620116 | Customer Settings | read |
| 7 | **Customer Type Settings** | 15242630128916 | Customer Settings | read |
| 8 | **Delivery Charge Table Settings** | 15243031913748 | Vendor Settings | read |
| 9 | **Delivery Company Settings** | 15243030217748 | Vendor Settings | read — **corrects run 04** |
| 10 | **View Advanced Customer Settings** | 15295211963924 | Customer Settings | noted, not read (view-only twin) |

---

## B. Wiring findings

### FINDING 582 — Scheduled processes run as phantoms and need a daemon started from control settings

- **Invariant:** nothing scheduled executes unless the Process Scheduler phantom is running.
- **Evidence** — `Schedule a Process`:
  > "This process allows you to schedule processes to **run as phantoms** at scheduled times. **In order for the scheduled processes to execute, the `Process Scheduler` phantom must be launched. See the `Start Scheduler Phantom` field in General System Control Settings.**"
  > "You can schedule processes to **run one or more times during a single day, each with its own runtime options, and each with its own schedule.**"
  Fields: `Description` · `Process` · `Type` · `Day` · `Time` · **`Run as User`** · `Send Output To` ·
  `Send Completion Notification To` · `Report Only If Errors` · Grid · Actions.
- **Maps to:** batch 5 (phantoms = UniData daemons) · batch 17 F573, F575 (four named scheduled
  processes) · batch 16 F559 (notification config gates scheduling) · W-041.

> **This closes batch 17's §I gap about scheduled processes, though not the way expected.** There is
> no published catalogue of schedulable processes — the `Process` field is a picker, and its contents
> are not enumerated in the documentation. **The four the audit found by encounter
> (`Scheduled Settings Update`, `Purge Customer Reward Points`, `Reward Gift Certificate Generation`,
> `Customer Membership Renewals`) remain the only named ones.** Recorded in §H as still open.
>
> **What *is* closed is the execution model, and it is fragile in a specific way:** a single phantom,
> started from a field in General System Control Settings, is the thing that makes every scheduled
> process run. **If it is not launched, everything scheduled silently does not happen** — no error,
> because nothing ran to produce one. Combined with batch 17 F580 (EOD/EOM error notification is
> itself a setting), STORIS has **two independent ways for overnight work to fail silently**.
>
> **Multiple runs per day, each with its own options**, means a schedule entry is a
> `(process, day, time, options, run-as)` tuple, not a process-level setting.

### FINDING 583 — A scheduled process runs under a named user's security, including cost restrictions

- **Invariant:** `Run as User` determines both the archive attribution and the data the process may see.
- **Evidence** — `Schedule a Process`:
  > "**When you enter a value into the `Run as User` field, the `Creator` column in the Review Archived Reports process shows this same value.**"
  > "…**security restrictions may prevent certain users from accessing the preferences window. In addition, restriction rules apply to the data available for view, such as costing data, by specific users or user groups. Refer to Create a User and Create a User Group location restrictions and security settings.**"
  > "**Important: This process allows you to send process results via email to selected users. STORIS recommends that prior to scheduling processes, you ensure your settings do not cause the process to distribute sensitive data to undesired users.**"
- **Maps to:** batch 16 F540–F545 (Report Builder security, deny-by-default) · batch 16 F552
  (location restrictions) · batch 15 F523 (viewer-dependent values) · W-050.

> **Scheduled output is a documented data-leak channel, and STORIS says so in an `Important` block
> rather than a NOTE** — the strongest warning phrasing the audit has seen in seven runs.
>
> **The mechanism is a privilege-boundary crossing:** the process runs with `Run as User`'s
> permissions — including their cost visibility and location scope — and then emails the result to a
> *different* list of recipients who may have neither. **A user who cannot see cost in Report Builder
> can be emailed a scheduled report full of it.** That is not a bug in STORIS; it is an unguarded
> composition of two features, and it is exactly the shape a rebuild should close by evaluating
> recipient entitlement at send time, not just author entitlement at run time.
>
> **For the cutover:** the live `Schedule a Process` grid is worth auditing on its own — every entry
> is a standing data flow with a `Run as User` and a recipient list.

### FINDING 584 — Report Builder reports opt into scheduling, and are then output-restricted

- **Invariant:** a report joins the schedule via a checkbox on its definition and can only write to the archive.
- **Evidence** — `Schedule a Process`:
  > "**Schedule a Process honors reports that have the box `Add to Schedule a Process` in `Create a Report` enabled. The report name of each process in the schedule a process grid is taken from the `Description` setting in the Create a Report process.**"
  > "**`Send Completion Notification To` setting is active for scheduled processes created through Create a Report. `Output Settings` is inactive for these, and the only output type available for these scheduled processes is the Report Archive.**"
  > "Use the **`Report Data Import Errors and Warnings`** process…to regenerate error reports. **Error data is retained until it is purged via `Generate Monthly Reports` as per the retention period set in `Days Retail Import Errors` in General System Control Settings.**"
  Preferences are available for named processes only:
  > "You can specify preferences (via the Actions button) for the **`View Summary of Sales Activity`** process and for the **`Convert Comment Files`** process."
- **Maps to:** batch 16 F546 (report `Access` field) · batch 14 F515 (`Generate Monthly Reports`
  purging) · F582 · W-041, W-050.

> **Scheduled Report Builder output cannot be emailed — only archived.** That is a deliberate
> narrowing and it partially mitigates F583's leak channel for the *report* path, though not for the
> *process* path, which retains `Send Output To`. **Two scheduling paths with different data-egress
> rules**, distinguished by whether the thing scheduled is a report or a process.
>
> **Two more named processes**, both with run-time preferences: `View Summary of Sales Activity` and
> `Convert Comment Files`. That brings the encountered total to six, still without a catalogue.
>
> **Fifth `Generate Monthly Reports` responsibility** — import error retention joins kit promotions
> (batch 14 F515) and reward points (batch 17 F573).

### FINDING 585 — There are two rewards programs, not one, with parallel settings records

- **Invariant:** Customer Rewards is a standalone feature; Membership Rewards is a richer one layered on it, each with its own control record.
- **Evidence** — `Customer Rewards Overview`:
  > "Use the **Customer Rewards** feature to award loyalty points to customers based on their purchases… Gift Certificates can be generated **on demand** using `Issue Customer Rewards`."
  > "**NOTE: For increased rewards benefits, including generating gift certificates automatically, it is recommended to use a Membership Rewards Program.**"
  `Customer Rewards Control Settings` carries a **near-duplicate field set** to `Membership Reward
  Settings` (batch 17): `Reward Points Accumulated Only with Purchase Membership` ·
  `Reward Points are Calculated at ____ % for Customers` · `Accumulated Points are Valid for ____ Days` ·
  `Gift Certificates can be Issued for ____ % of the Accumulated Points` ·
  `Gift Certificates are Valid for ____ Days`.
  > "**NOTE: The settings in this routine are global. They affect all customers and products.** To award reward points on a product-by-product basis, use the Advanced Product Settings. To restrict selected customers…, use the Customer Settings."
- **Maps to:** **batch 17 F573** (*"the same setting name exists on two different records… the sentence
  does not say which governs"*) — **now explained** · batch 17 F568 · W-063.

> **Batch 17 recorded an unresolved two-rung hierarchy for `Accumulated Points are Valid for __ Days`.
> The resolution is that it is not a hierarchy at all — it is two programs.** Customer Rewards reads
> its own record; Membership Rewards reads its own. Which applies depends on whether the customer has
> a membership and on `Reward Points Accumulated Only with Purchased Membership`.
>
> **That flag is the join between them**, and it sits in the *Customer Rewards* record: set it, and
> plain Customer Rewards stops accruing for non-members, leaving Membership Rewards as the only
> earning path. Batch 17 F573's §H item is **partially closed** — the two records are distinguished,
> though the docs still never state the precedence explicitly for a member who would qualify under
> both. Retained in §H at reduced severity.
>
> **The practical difference is automation:** plain Customer Rewards issues certificates *on demand*
> only; automatic generation is a membership feature.

### FINDING 586 — Global and per-product reward calculations are additive and independently switchable

- **Invariant:** two accrual sources stack, and turning either off leaves the other running.
- **Evidence** — `Customer Rewards Overview`:
  > "…the system calculates reward points for the customer based on **both** of the following: Your settings in the Customer Rewards Control Settings. **These settings are global, and the system applies them to all items on all sales orders, in addition to any points applied via the Product file** … The `Rewards Indicator` and `Rewards Factor` fields in the Product Settings. **These settings apply reward points on a product-by-product basis, in addition to any points applied via the global settings.**"
  > "The global calculation is **distinct** from the product-specific calculations…, and **turning off one setting does not de-activate the other.**" *(stated twice, once from each side)*
- **Maps to:** batch 14 F510 (`Reward Factor`/`Reward Indicator` on the **District** tab) · batch 11
  (Advanced Product Settings) · batch 15 F524 (additive hierarchy rung) · W-063.

> **A second additive-rather-than-selective structure**, after batch 15 F524's auto-fill days. The
> audit's default assumption — first match wins — is wrong in both cases, and both are in *incentive*
> calculations, where getting it wrong means paying out the wrong amount.
>
> **The "turning off one does not de-activate the other" sentence is stated twice, from both sides.**
> That is documentation doing its job: it is warning about the exact mistake an administrator makes
> when they think they have switched rewards off and have only switched off one source.
>
> **Batch 14 F510 found `Reward Factor` and `Reward Indicator` on the District tab of District and
> Regional Product Settings; this article places the same two field names in "Product Settings".** So
> the per-product source may itself resolve through the product hierarchy — **which would make reward
> accrual district-varying and additive at the same time.** The docs do not say. §H.

### FINDING 587 — Points are calculated on net value minus the payment-page discount

- **Invariant:** the accrual base excludes a specific discount field, not discounts generally.
- **Evidence** — `Customer Rewards Overview`:
  > "**NOTE: When calculating customer rewards, the system issues points based on the net value of the order minus any discounts entered in the `Discount` field on the Payment page of the `Enter a Sales Order` routine.**"
- **Maps to:** run 03 (order entry, discounts) · batch 16 §3.1 (the two-axis discount model) · W-063.

> **This is the arithmetic batch 17 F569 flagged as missing — partially.** It names the base (net
> value) and one exclusion (the Payment-page `Discount` field). It does **not** say how line
> discounts or subtotal discounts interact, and the Sales Security dissection established those are
> separate mechanisms. **So one of at least three discount types is documented as reducing the reward
> base and the other two are unaddressed.** §H, at reduced severity from F569.
>
> A rebuild needs this pinned down precisely: it is the difference between rewarding gross and
> rewarding margin, on every order.

### FINDING 588 — Reward gift certificates use a closed internal payment type

- **Invariant:** `REWARDS` is a system-assigned payment type that cannot be funded, refunded, or configured.
- **Evidence** — `Issue Customer Rewards`:
  > "**NOTE: You cannot add funds to, or refund amounts from, gift certificates created as part of the Customer Rewards program. The system automatically assigns these gift certificates a payment type code of `REWARDS`. This code is internal and does not appear in the Gift Certificate Payment Type Settings.**"
  Fields: `Customer Code` · `Number of Reward Points Earned` · **`Maximum Gift Certificate Allowed`** ·
  `Reward Points Used` · `Reward Points Remaining` · `Gift Certificate Amount`.
- **Maps to:** batch 17 F574 (*"value that cannot become cash"*) · run 03 (payment types) · W-035, W-063.

> **Batch 17 established that reward value can never be refunded as cash; this names the mechanism.**
> It is a **hidden payment type** — `REWARDS` exists in the data but not in the settings screen that
> lists payment types, so a site cannot see it, edit it, or accidentally make it refundable.
>
> **That is a good pattern and worth copying**: enforce the constraint by making the tender type
> system-owned rather than by adding rules to a configurable one. But it has a migration
> consequence — **`REWARDS` will appear in extracted payment data with no matching row in the payment
> type reference table.** Anyone reconciling those two files will read it as orphaned data. It is not.
>
> **Partial redemption is supported** (`Reward Points Used` / `Reward Points Remaining`), so points
> are a decrementing balance, not a one-shot conversion.

### FINDING 589 — Delivery Charge Table Settings has no menu entry

- **Invariant:** the routine is reachable only through Delivery Company Settings.
- **Evidence** — `Delivery Charge Table Settings`:
  > "**This process is only accessible through Delivery Company Settings and is not available through the menu.**"
- **Maps to:** batch 16 F548 (Actions buttons as cross-module navigation) · run 04 · W-059.

> **A settings record with no menu presence.** This is why run 04 read `Delivery Company Settings`
> and never reached the table definition — there is no path to it from a menu, and the audit's
> section-listing approach would not surface it as a separate destination.
>
> **It also sharpens batch 16 F548's finding about `Assign Screen Action Permission`:** if a group is
> denied the Actions item that opens this routine, **the routine becomes wholly unreachable for
> them** — not degraded, absent. Menu-less routines make Actions-menu permissions load-bearing in a
> way the permission screen does not communicate.

### FINDING 590 — The delivery company defaults through three rungs ending in a reserved code

- **Invariant:** zip-code route → manual route entry → the delivered fallback company `ZZZZZ`.
- **Evidence** — `Delivery Company Settings`:
  > "**If the customer's zip code contains a default route code**, sales order-entry defaults the delivery company associated with that route code."
  > "**If the customer's zip code does not contain a default route code, the `Route Code Entry Window` appears**, via which you can enter a route code."
  > "**If the customer's zip code does not contain a default route code and you do not enter a route code…, the program uses the default delivery code (`ZZZZZ`).**"
  > "**NOTE: STORIS comes installed with a default delivery company whose code is `ZZZZZ`. You cannot delete this delivery company, as STORIS applies it to orders for which a delivery company cannot otherwise be found.**"
  > "**STORIS delivery orders require a delivery company.**"
- **Maps to:** batch 15 F521 (`RFND`) · batch 16 F541 (`STD`) · batch 14 F506 (purchase status types) ·
  run 04 (routing) · W-059.

> **A fifth reserved, undeletable vendor-owned record** — after `RFND`, `STD`, the six purchase status
> types, and `Standard Files`. The pattern is now firmly established: **STORIS guarantees a
> resolution never fails by shipping a terminal fallback row that cannot be removed.**
>
> **This is a genuinely good design and the rebuild should adopt it deliberately**, because the
> alternative — a nullable delivery company — pushes the "what if none?" question into every
> downstream consumer. One undeletable sentinel answers it once.
>
> **The middle rung is interactive**, which makes this the audit's first hierarchy with a *human* in
> it: rung 2 is a modal prompt, not a lookup. A rebuild's automated order paths (API, eSTORIS) have no
> user to prompt, so they fall from rung 1 straight to `ZZZZZ` — **and orders created by integration
> will systematically carry the fallback company** unless zip codes are well-populated.

### FINDING 591 — Three delivery company types, and two of them determine the company differently

- **Invariant:** self-owned, third-party and parcel differ in whether destination or product picks the carrier.
- **Evidence** — `Delivery Company Settings`:
  > "**Self-Owned** — for deliveries with company vehicles. STORIS' standard way of delivering is via company-owned vehicles."
  > "**Third Party** — …You define the delivery company via the `Route Code` field in the `Logistical Route Settings`. **The order-entry program determines the delivery company based on the delivery destination.**"
  > "**Parcel** — …**STORIS delivers by parcel service based on the products on the order as opposed to the order destination.**"
  Fields: `Delivery Company Code` · `Name` · address · `Telephone` · `Contact` ·
  **`Delivery Company Type`** · **`Use Delivery Charge Tables`** · `Flat Charge` ·
  **`Third Party Logistics EDI Code`**.
- **Maps to:** batch 3 (Logistical Route Settings) · batch 15 F533 (3PL EDI) · run 04 (routing,
  parcel) · batch 16 §3 (`Override Parcel Route Requirement`) · W-059.

> **Destination-driven versus product-driven carrier selection in the same field.** For third party,
> geography picks the carrier; for parcel, **the merchandise does** — which makes sense (parcel-able
> goods are a property of the product) but means the carrier-selection algorithm branches on a type
> code before it even looks at the order.
>
> **`Third Party Logistics EDI Code` on this record is the join batch 15 F533 was missing** — that
> batch read the 3PL EDI settings and noted 3PL codes *"cannot be deleted if assigned to any delivery
> company"* without having seen where the assignment lives. **It lives here.** Chain closed.
>
> `Flat Charge` versus `Use Delivery Charge Tables` is a **two-mode switch on pricing**, with the
> tables tab gated: *"To access this tab, a check must appear at `Use Delivery Charge Tables`."*

### FINDING 592 — A charge table is a two-dimensional tier definition with two calculation modes

- **Invariant:** `Value Type` and `Range Unit of Measure` define the tiers; the value is either a flat charge or a multiplier.
- **Evidence** — `Delivery Charge Table Settings`:
  > "**The `Value Type` and `Range Unit of Measure` are required fields that define the nature of the tiers in the delivery charge table.**"
  > "**NOTE: The information in the Delivery Charge Table grid is automatically sorted in descending order.**"
  > "…you have the following options: **1) calculate by weight using a series of one more or flat charges** you specify in the grid. For example, you can assess a flat delivery charge of $1 to deliver up to one pound…, $2 for two pounds…, and so on **OR 2) calculate by weight using a series of one or more per-weight-unit charges to be multiplied by the number in the `Lower Range` field.**"
  Fields: `Code` · `Description` · `Value Type` · `Range Unit of Measure` ·
  `Associate Table With Specific Inventory` · **`Inventory Formation`** ·
  **`All Lines Must Be Included in Formation`** · `Handling Method | Use Case` ·
  **`Membership Product Code`** · `Lower Range` · `Value`.
- **Maps to:** batch 17 F572 · batch 13 F491 (Inventory Formations) · run 04 (handling methods) · W-059.

> **The same grid supports flat-per-tier and rate-times-quantity, and nothing in the field list says
> which.** The mode is implied by how the site fills in `Value` — a semantic that lives in the
> operator's head, not in the data. **A rebuild reading a live charge table cannot tell the two
> apart**, which makes this a migration hazard: the same numbers mean different money under the two
> readings. Recorded in §H; **resolvable by parity test** against known orders.
>
> **Descending sort is not cosmetic.** With `Lower Range` tiers sorted high-to-low, evaluation
> naturally reads down until the order's value exceeds a threshold — which is the standard way to
> implement banded pricing, and it means **grid order here is derived, unlike the charge-table
> priority list in F593 where order is configured.** Two orderings on one screen pair, one automatic
> and one manual.
>
> **A fifth Inventory Formation consumer** (batch 13 F491), and the strictest use of one yet:
> `All Lines Must Be Included in Formation` makes the table apply only if **every** line qualifies.

### FINDING 593 — Charge tables are prioritized with Promote/Demote and evaluated first-match — confirming F572 at source

- **Invariant:** a delivery company holds several tables in a configured order; the first match wins.
- **Evidence** — `Delivery Company Settings`, Delivery Charge Tables tab:
  > "**Multiple tables per vendor may be set up and prioritized.**"
  > "This section allows you to **apply and prioritize multiple delivery charge table(s)** to this delivery company." — `Code` · `Add` · Grid · **`Prioritize Delivery Charge Tables Promote/Demote`**
  > "**NOTE: If a new delivery charge table has been created, the `Clear` button does not delete the new table.** The Clear button does not delete delivery charge tables, which are still available through the Search button at the `Code` field."
  Table-level modifiers: `Minimum Charge` · `Maximum Charge` · `Additional Charge` ·
  `Minimum Purchase Amount` · `Alternate Charge for Specific Inventory` · `Alternate Charge` ·
  `Inventory Formation` · `All Lines Must Be Included in Formation`.
  With batch 17's statement from the membership side:
  > "…**the charge tables are reviewed and applied in order and once a match is found any further tables are ignored.**"
- **Maps to:** **run 04 (`Delivery Company Settings` read without recording grid-order significance)**
  — **corrected** · batch 17 F572 · batch 15 F518 (Promote/Demote on Stock Location Schema) · W-059.

> **Confirmed from both sides.** Batch 17 inferred the ordering rule from the membership benefit
> article; here it is in the routine itself, with the Promote/Demote controls that make order
> configurable. **Run 04's reading of this record is corrected**, not extended: it recorded the
> fields and missed that **sequence is the logic**.
>
> **Third instance of the ordered-list resolver** (Stock Location Schema, delivery charge tables, and
> the derived descending sort in F592). It is a house pattern; the rebuild should implement ordered
> rule-lists once.
>
> **The Clear-button NOTE is a usability warning with a data consequence:** tables detached from a
> company are not deleted and remain findable. So the live system will contain **orphaned charge
> tables referenced by nobody**, and an extract that pulls all tables will over-count what is
> actually in force.

### FINDING 594 — Delivery charges recalculate on two triggers, and split orders are charged in full up front

- **Invariant:** the charge is recomputed on zip change or on opening Totals; a partial release still carries the whole order's charge.
- **Evidence** — `Delivery Company Settings`:
  > "STORIS calculates (or recalculates) the delivery charge in any of the following situations within an order-entry routine: **you change the ship-to zip code · you access the Totals page of the routine**"
  > "**For split orders, the system applies the full delivery charge during the initial release for completion of the order. That is, even if only a portion of the order is for delivery, the system still calculates delivery charges based on the entire order and defaults the charge during the initial release for completion. You can override this amount.**"
  > "**You can have only one freight company associated with an order**, identified at the `Ship Via` field on the Additional Fulfillment Information Screen."
- **Maps to:** run 03 (order totals) · run 04 (split orders, fulfillments) · batch 16 §3.7
  (`Override system calculated delivery charges`) · W-059.

> **"You access the Totals page" is a recalculation trigger, which means the charge is a function of
> *navigation*.** A user who never opens Totals may complete an order whose delivery charge was
> computed against an older basket. That is fragile, and a rebuild should recompute on basket change
> rather than on page visit — **but it means legacy orders may carry charges that do not match their
> final contents**, and reconciliation against migrated data should expect discrepancies rather than
> treat them as extraction errors.
>
> **Charging the whole order at first release is a deliberate commercial choice** — the customer pays
> delivery once, not per split — and it is overridable via the Sales Security permission the earlier
> handoff catalogued. **One carrier per order** is a hard constraint that a rebuild supporting
> multi-carrier fulfilment would break.

### FINDING 595 — On-the-fly customers are numbered with the sales ticket number

- **Invariant:** customers created during order entry take the ticket number as their customer number, which constrains the manual numbering scheme forever.
- **Evidence** — `Advanced Customer Settings`:
  > "**Use care when assigning customer numbers. For new customers you create on-the-fly during sales order entry, the system assigns the sales ticket number as their customer number. For this reason, when you initially design your customer records, do not use numbers that may equal your future sales ticket numbers.** To determine the sales order numbering sequence that best suits your needs, contact your STORIS representative."
  > "**You cannot edit quick sale customers.**"
  > "**NOTE: You can use the Regional Processing feature to restrict user access to customer records.**"
  > "To create new customers via this routine, you must have access via the **`Advanced Customer Settings; Create new customer`** field on the **Extended Security (Receivables)** routine."
- **Maps to:** batch 6 (Regional Processing) · batches 7–9 (Extended Security modules) · run 03
  (order entry) · W-036.

> **Two identifier spaces share one namespace, and the collision is the site's problem to avoid.**
> This is a 1980s-era design decision surfacing as a permanent constraint: manually-assigned customer
> numbers must dodge the future sales ticket sequence, forever.
>
> **For the migration this is a concrete data-quality question with a concrete answer available:**
> LA Mattress's customer file will contain two populations — deliberate numbers and ticket-derived
> ones — and they are distinguishable by whether the number matches an order. **A rebuild should
> issue surrogate customer IDs and keep the STORIS number as a legacy reference**, rather than
> inheriting the namespace collision.
>
> **"Quick sale customers" are uneditable**, which implies a third customer class beyond permanent
> and on-the-fly. The term is not defined here. §H.

### FINDING 596 — Duplicate-customer detection has four outcomes depending on how the screen was reached

- **Invariant:** the same duplicate check accepts or rejects the entry based on whether an order is being created and whether the existing account was used.
- **Evidence** — `Advanced Customer Settings`:
  > "When entering an Email or phone number in Home, Cell or Work **that is associated with an existing account, a message confirms the existence of the other account.** Depending on how this…process is accessed, the following verification occurs:"
  > "**When creating a sales order and** — the existing account is **not** used, **you may create the new customer, even if it is a duplicate.** · the existing account **is** used, you are returned to Enter a Sales Order. **If one customer account matches, the information is populated in the order. If multiple customer accounts match, the Search for a Customer process open** from which to select a customer."
  > "**When not creating a sales order and** — the existing account is **not** used, **the entry is rejected.** · the existing account **is** used, the entry is accepted."
  > "When entering the Email address, **`Prohibit New Customers with Duplicate Email Addresses` in Point of Sale Control Settings** as well as **`Create Customers with Duplicate Information` in Create a User/Group Actions - Sales Security** may prevent entry of a duplicate email."
- **Maps to:** batch 1 (POS Control Settings) · the Sales Security handoff
  (`Create Customers when another exists with the same Email Address`) · W-036.

> **Duplicate policy is looser inside order entry than outside it**, deliberately: a salesperson with
> a customer standing in front of them can create the duplicate; an administrator doing data entry
> cannot. That is a defensible rule and an easy one to lose in a rebuild that centralises validation.
>
> **Three controls stack on one decision** — the context (order vs not), a POS control setting, and a
> Sales Security permission. **This is the override-implies-a-restriction pattern from the Sales
> Security handoff, confirmed from the settings side:** `Prohibit New Customers with Duplicate Email
> Addresses` is the restriction, and `Create Customers when another exists with the same Email
> Address` is its override. **A clean matched pair, worth citing in the handoff as the worked
> example.**

### FINDING 597 — Tax-exemption changes do not propagate to open orders

- **Invariant:** updating a customer's tax settings requires manually revisiting every open order.
- **Evidence** — `Advanced Customer Settings`, Tax section:
  > "**When tax exemption details are updated, you must access any open orders for this customer and change the `Charge Sales Tax` check box in Order Tax Information.** Tax validation is done after entering the Customer Number in a sales order or exchange. **Note that some Rent to Own financing plans qualify for tax exemption despite the settings in this process; in this case, the settings here are overridden.**"
  > "If you do NOT want the system to calculate sales tax on this customer's sales orders, **do NOT select the `Charge on Sales` field**…"
  Fields: `Charge on Sales` · `Charge National` · `ID Number` · `ID Expiration Date` ·
  `Alternate ID` · `Entity Use Code` · `Referred By`.
- **Maps to:** batch 15 F526, batch 16 F547 (**resolve once, store the answer**) · run 01 (tax) ·
  batch 16 §3.10 (`Override Charge Sales Tax Settings`) · W-039.

> **The copy-at-write idiom again, and here it has a compliance edge.** Tax status is resolved onto
> the order when the customer is entered; changing the customer afterwards leaves every open order
> taxed the old way. **STORIS puts the remediation on the user** — go and fix each order — with no
> list, no prompt and no report of affected orders.
>
> **This is the seventh instance of resolve-once-and-store** (tax, commission, cost, kit price, fill
> days, security grants, stock levels). It is unambiguously the house rule. But of the seven, **this
> is the one with an external regulator**, and a rebuild should at minimum surface the affected open
> orders rather than expecting someone to remember.
>
> **`ID Expiration Date` means exemption certificates expire and nothing here says what happens when
> they do.** §H.

### FINDING 598 — Avalara replaces the tax fields when online and falls back to them when not

- **Invariant:** two tax fields are ignored under Avalara but used for offline determinations.
- **Evidence** — `Advanced Customer Settings`:
  > "**NOTE: For Avalara users: The `Charge on Sales` and `Charge National` fields are not used when Avalara is active; however, they are considered when Avalara is offline and STORIS must make offline tax determinations.**"
- **Maps to:** batch 17 F562 (external integrations) · run 01 (tax) · F597 · W-039, W-058.

> **A documented degraded mode for an external dependency**, and the only one the audit has found
> stated this explicitly. STORIS keeps the local fields populated as a **fallback tax authority** for
> when the service is unreachable.
>
> **The design is right and the consequence is subtle:** the local fields must be kept accurate even
> though they normally do nothing, because they are what the business bills on during an outage.
> **Data that is inert until it is critical is data nobody maintains.** A rebuild using an external
> tax service should decide deliberately whether to keep a fallback at all — and if it does, whether
> a stale fallback is better or worse than refusing the sale.
>
> **Avalara joins the external dependency inventory** (batch 17 F562), and notably it is **not** one
> of the 23 tabs on `External Communications Settings` — so that record is **not** the complete
> integration surface after all. Recorded as a correction in §H.

### FINDING 599 — The customer record carries PII and finance accounts behind a Sales Security permission

- **Invariant:** DOB, SSN and driver's licence sit on the Receivables page; finance account numbers require the encryption-viewing permission.
- **Evidence** — `Advanced Customer Settings`, Receivables page:
  > "**Personally Identifiable Information** — `Date of Birth` · `Social Security Number` · `Driver License Number`"
  > "The account number and finance provider code **can only be entered for online financing providers**. You can enter multiple finance account numbers and finance providers. **Note that to edit these fields, you must have access via the `View encrypted finance, credit card, check account numbers` field in the Extended Security - Sales Security settings.**"
  Also: `Credit Limit` · `Terms` · `Due Day` · `Charge Late Fees` · `Autopay on Account` ·
  `Hold Customer's Statement` · `Revolving Statement Delivery Method` ·
  `Charge Revolving Paper Statement Fee` · `Revolving Credit Agreement Printed`.
- **Maps to:** the **Sales Security handoff §3.12** (flagged as PCI-relevant) · run 01 (receivables) ·
  batch 5 (`SYS.ENCRYPT.DECRYPT.PTM`) · W-036, W-050.

> **The handoff flagged `View encrypted finance, credit card, check account numbers` as PCI-relevant
> and recommended a decision before extract. This is the screen where those numbers are entered**, and
> it sits alongside SSN, date of birth and driver's licence in a block STORIS itself labels
> *Personally Identifiable Information*.
>
> **That label is useful — it means STORIS already knows which fields these are**, which makes them
> findable in the extract rather than requiring discovery. **The recommendation stands and hardens:
> decide what the rebuild stores before the extract runs, not after**, and treat this block plus the
> finance grid as a single classified region.
>
> The permission gates **editing**, and the field group is a grid supporting **multiple** finance
> accounts per customer — so a single customer may carry several provider relationships.

### FINDING 600 — Customer type deletion is protected by a manual pre-check, not by the system

- **Invariant:** the code cannot be deleted while assigned, and STORIS tells the user to find the assignments themselves with a report.
- **Evidence** — `Customer Type Settings`:
  > "**The system does not permit you to delete a customer type code…if it is currently assigned to any customers. Before deleting a code, you should run a Report Builder report to list customers with the customer type code assigned** in the `Customer Type` field of Advanced Customer Settings. **Once you remove the code from those customer records, you can delete the customer type code** from the system using this routine."
  > "Use this routine to create and maintain customer type codes that you use with the **Trade/Designer feature**."
- **Maps to:** batch 17 F577 (seven deletion policies) · batch 14 F516 (warned cascade **with a
  count**) · W-034.

> **An eighth deletion behaviour: referentially blocked, with the discovery burden on the user.**
> Batch 14's substitution list *told* the user how many records were affected. This one blocks and
> says "go run a report". Same guard, opposite helpfulness — **and the contrast is worth carrying
> into the rebuild as a rule: if you block a deletion, show what is blocking it.**
>
> The **Trade/Designer feature** is named here for the first time in seven runs — a B2B/interior-design
> customer channel. No article the audit has read describes what it changes. §I.

### FINDING 601 — The customer record carries two salespeople with split commission

- **Invariant:** a customer has up to two default salespeople, each with a commission percentage.
- **Evidence** — `Advanced Customer Settings`, Point of Sale page:
  > "**Salespeople** — `Salesperson 1 Code` · `Salesperson 1 Commission _ %` · `Salesperson 2 Code` · `Salesperson 2 Commission _ %`"
  Also on that page: `Store Location` · `Delivery Instructions for Billing Address` ·
  `Account Comments` · `Price Category Code` · `Commission Category Code` · `Commission _ %`.
- **Maps to:** run 03 (commission and spiff) · batch 14 F513 (kit commission inversion) ·
  batch 16 §3.5 · W-046.

> **Commission attribution has a customer-level default, which the audit had not recorded.** Run 03
> built the commission model from the order and product sides; the customer is a **third input**, and
> it is a *pair* with independent percentages — so house-account splits are a first-class concept.
>
> Note there are **two commission percentage fields on one page** — one per salesperson, and a third
> standalone `Commission _ %` next to `Commission Category Code`. **Their relationship is not
> stated.** §H.

### FINDING 602 — The membership record is duplicated between two screens

- **Invariant:** `Customer Membership Settings` exposes the same fields as the Advanced Customer Settings membership block.
- **Evidence** — `Customer Membership Settings` fields: `Customer Code` · `Active Member` ·
  `Initial Membership Date` · `Renewal` · `Renewal Date` · `Cancellation Date` · `Product Code` ·
  `Fee` · `Terms` · `Payment Card` · `Revolving Plan` · `Store of Purchase` · `Linked Customer Code` ·
  `Accumulate Reward Points`.
  `Advanced Customer Settings` › Point of Sale › **Membership Benefit Program** carries the same
  thirteen, and `Accumulate Reward Points` appears on its **Advanced** page.
- **Maps to:** batch 17 F576 (cancellation writable from two screens) · W-063.

> **Batch 17 recorded that `Active Member` is writable from two screens and flagged the breadth of
> write access to a flag that cancels benefits immediately. Both screens are now read and they are the
> same record**, not two records — a dedicated maintenance screen over a section of the customer file.
>
> `Linked Customer Code` plus `Maximum Number of Linked Accounts` (batch 17) means **a membership
> spans multiple customer records** — one payer, several beneficiaries. That is a household model, and
> it interacts with batch 17 F568's rule that only one of a person's accounts may hold a membership.
> **The linking is how the others get benefits.** A rebuild needs both the uniqueness rule and the
> link graph.

---

## C. Screen and field inventory (additions)

Field lists are inline above. `Advanced Customer Settings` page structure:
**General · Point of Sale · Receivables · Advanced · eSTORIS · User Defined Settings**, with
*"Support Files: Zip Code, Sales Tax, Warehouse Location, Terms, and Salesperson"*.

*Advanced page:* `Inactive Date` · `Language` · `Track Purchase History` ·
**Merge Details** (`Status, By, Merge To`) · `Classification` · `Customer Type` · `Employee ID` ·
`Accumulate Reward Points` · `Okay to Solicit`.
*eSTORIS page* (*"only active if this customer has an eSTORIS account"*): `Website Password` ·
`Reset Password` · `Allow Web Access` · `View Financial Information Online`.
*User Defined Settings:* same disclaimer as batch 14 — *"Entries on this screen are for information
only; no processing occurs based on this information."*

> **`Merge Details` (Status, By, Merge To) is a customer-merge audit trail** — evidence that customer
> merging exists as a process. No article the audit has read documents it. §I.

---

## D. Control settings catalog (additions)

| Setting | Record | Decides |
|---|---|---|
| `Start Scheduler Phantom` | General System Control Settings | Whether **anything** scheduled runs (F582) |
| `Days Retail Import Errors` | General System Control Settings | Import-error retention, purged by `Generate Monthly Reports` (F584) |
| `Add to Schedule a Process` | Create a Report | Opts a report into scheduling (F584) |
| `Activate Customer Rewards Program` | POS Control Settings › Customer | Master switch for plain rewards (F585) |
| `Prohibit New Customers with Duplicate Email Addresses` | POS Control Settings | Restriction paired with a Sales Security override (F596) |
| `Use Delivery Charge Tables` | Delivery Company Settings | Gates the charge-table tab; alternative is `Flat Charge` (F591) |

---

## E. Security permissions catalog (additions)

| Permission | Record | Effect |
|---|---|---|
| `Advanced Customer Settings; Create new customer` | **Extended Security (Receivables)** | Required to create customers in this routine (F595) |
| `View encrypted finance, credit card, check account numbers` | Extended Security (Sales) | Gates **editing** the finance-account grid (F599) |
| `Create Customers with Duplicate Information` | Sales Security | Override of the duplicate-email restriction (F596) |

---

## F. State machines and enumerations (additions)

**Delivery company type** — `Self-Owned` · `Third Party` (destination-driven) · `Parcel`
(product-driven) (F591).

**Delivery company resolution** — zip route code → interactive Route Code Entry Window → `ZZZZZ`
(F590).

**Membership lifecycle fields** — `Initial Membership Date` → `Renewal Date` → `Cancellation Date`,
with `Active Member` as the live flag (F602).

**Named scheduled processes, cumulative: six** — `Scheduled Settings Update` ·
`Purge Customer Reward Points` · `Reward Gift Certificate Generation` ·
`Customer Membership Renewals` · `View Summary of Sales Activity` · `Convert Comment Files`.
**Still no catalogue** (§H).

---

## G. Sequencing rules (additions)

**Ordered-list resolvers — third instance**: delivery charge tables, Promote/Demote, first match wins
(F593). Plus a *derived* descending sort inside each table (F592).

**Additive rather than selective — second instance**: global + per-product rewards stack (F586);
cf. auto-fill days (batch 15 F524).

**Resolve once, store the answer — seventh instance**: customer tax status is fixed onto the order at
customer entry (F597).

**Reserved undeletable fallback rows — fifth instance**: `ZZZZZ` (F590); cf. `RFND`, `STD`,
`Standard Files`, the six purchase status types.

---

## H. Open questions and gaps

1. **No catalogue of schedulable processes exists** (F582, F584). Six named by encounter. The
   `Process` picker's contents are only visible in the live system. **Observable — worth capturing
   during the live-system session.**
2. **Charge-table calculation mode is not stored** (F592). Flat-per-tier and rate-times-quantity are
   distinguished only by operator intent. **Parity test against known orders.**
3. **Reward accrual base is only partly defined** (F587). The Payment-page `Discount` is excluded;
   line and subtotal discounts are unaddressed.
4. **Whether the per-product reward source resolves through the product hierarchy** (F586) — batch 14
   F510 put `Reward Factor`/`Reward Indicator` on the District tab; this article says "Product
   Settings".
5. **Membership vs plain rewards precedence** for a customer who qualifies under both (F585).
   Downgraded from batch 17 F573 but not closed.
6. **"Quick sale customers"** (F595) — a third customer class, uneditable, undefined.
7. **What happens when a tax exemption `ID Expiration Date` passes** (F597).
8. **Three commission percentage fields on one page** with no stated relationship (F601).

**Correction to batch 17**

9. **`External Communications Settings` is not the complete integration surface.** Avalara is an
   external tax service (F598) and has **no tab** on that record. Batch 17 F562 called it *"the
   complete external dependency surface"* — that is **too strong**. It is the largest single
   inventory of integrations, not an exhaustive one. **Recorded as a correction.**

**Correction to run 04**

10. **`Delivery Company Settings` grid order is semantically significant** (F593). Run 04 recorded the
    fields without it. Batch 17 F572 inferred it; this confirms it at source.

**Inferences**

- **I-98** — `Value Type` on a charge table probably enumerates weight/cube/dollar/piece, from the
  worked weight example and the existence of `Range Unit of Measure`. **Values not published.**
- **I-99** — `Envelope` beside the email and phone fields is likely the mail/contact-preference icon
  run 06 met. **Not stated here.**

---

## I. Unknown unknowns

- **Customer merge exists** (§C, `Merge Details`: Status, By, Merge To). A destructive,
  history-rewriting operation with an audit trail on the customer record and **no article the audit
  has read.** Directly relevant to migration — merged customers have predecessors.
- **The Trade/Designer feature** (F600) — a B2B channel gated by customer type. Named once, never
  described.
- **A scheduled process emails results to recipients who may lack entitlement to the data** (F583).
  STORIS warns about it rather than preventing it. **The live schedule is a standing set of data
  flows nobody has reviewed.**
- **Orphaned delivery charge tables persist** (F593) — detached tables remain in the system and
  findable.

---

## J. Glossary (additions)

| Term | Plain description |
|---|---|
| **Process Scheduler phantom** | The daemon that must be running for any scheduled process to execute |
| **`ZZZZZ`** | Delivered, undeletable fallback delivery company |
| **`REWARDS`** | Internal, unconfigurable payment type for reward gift certificates |
| **Customer Rewards** | Standalone loyalty program; manual certificate issue |
| **Membership Rewards** | The richer program layered on it; automatic certificates, plan benefits |
| **Delivery charge table** | Banded pricing by a `Value Type` × `Range Unit of Measure`, either flat or multiplied |
| **Quick sale customer** | An uneditable customer class (undefined) |
| **Trade/Designer** | A B2B customer channel selected by customer type (undescribed) |

---

## Contract adjudication — batch 18

| Contract | Verdict | Basis |
|---|---|---|
| **W-041** *(batch calendar)* | **CONFIRMED — execution model found** | One phantom gates all scheduled work (F582) |
| **W-050** *(access control)* | **CONFIRMED — with a leak channel** | Scheduled output crosses a privilege boundary (F583) |
| **W-063** *(loyalty)* | **CONFIRMED — two programs, additive sources** | F585, F586, F587, F588 |
| **W-059** *(delivery charges)* | **CONFIRMED — model read end to end; run 04 corrected** | F590–F594 |
| **W-036** *(customer master)* | **CONFIRMED** | Numbering collision (F595), duplicate policy (F596), PII block (F599) |
| **W-039** *(tax)* | **CONFIRMED, with a propagation hole** | Exemption changes do not reach open orders (F597); Avalara fallback (F598) |
| **W-046** *(commission)* | **CONFIRMED — third input found** | Customer-level salesperson pair (F601) |
| **W-034** *(deletion)* | **CONFIRMED — eighth behaviour** | Blocked with manual discovery (F600) |
| **W-058** *(external interfaces)* | **CONTRADICTED in part** | Avalara is an integration with no tab on the integration record (F598) |
| **Menu-less routines** | **NEW** | F589 |

---

## Next — batch 19

**Customer Settings** core: `Customer Price Settings` · `Customer Price Category` ·
`Search for a Customer` · `View Customer Activity` · `Credit Status Results` ·
`Sales Tax Settings` · `Zip Code Settings` — and the **legal/collections** records that batch 17
F575 exposed.
