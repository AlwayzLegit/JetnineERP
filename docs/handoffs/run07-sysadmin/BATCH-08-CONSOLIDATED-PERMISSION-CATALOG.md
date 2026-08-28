# Run 07 — System Administration — Batch 8: The consolidated permission catalogue

Status: complete. Findings 428–439. Read-only throughout.

**Four of the ten module security records read in full — roughly 200 named permissions.** This batch
is the consolidated permission catalogue the audit has been assembling by hand since run 01, now
sourced rather than inferred.

---

## A. Coverage log

| # | Record | id | Permissions | Status |
|---|---|---|---|---|
| 1 | **Sales Security** | 15185859408660 | **~120** | read — *"Updated as of 2/7/2024"* |
| 2 | **Logistics Security** | 15185875554452 | **~55** | read |
| 3 | **System Security** | 15185875776532 | **16** | read |
| 4 | **Service Security** | 15185875555220 | **10** | read |
| — | Purchasing · Payables · Receivables · Personal Information *(read, batch 7)* · Transfer · Import Data | — | — | six remaining |

Every record opens with the same two statements, which are structural facts about the model:
> "In order to use these security settings, **extended security must be active** on your system via
> the General System Control Settings."
> "Settings accessed from the **Create a User Group** routine apply to **all users in that group**,
> while settings accessed via **Create a User** apply to the **individual user**."

---

## B. Wiring findings

### FINDING 428 — The permission model is roughly 250 named actions across ten records

- **Invariant:** authorisation is a flat list of verbs per module, checked individually.
- **Evidence** — counted from the four records read: Sales ~120 · Logistics ~55 · System 16 ·
  Service 10 = **~200**, with six records unread. Every entry is phrased **"Allow a User To:"**
  followed by an action.
- **Maps to:** run 07 F410 (ten records) · F427 (`Report on User Security`); `W-050`.

> **The audit cited perhaps thirty of these by name across six runs.** The model is not deep — there
> are no roles, no inheritance beyond user-versus-group, no conditions — **it is very wide.** Two
> hundred booleans, and probably closer to 250 with the six unread records.
>
> That shape has consequences for the rebuild worth stating plainly. **A flat verb list is
> unmaintainable by hand at this size** — which is exactly why `Report on User Security` and
> `User Group Clone Process` exist. Any modern design would collapse most of this into roles, and the
> migration question is then *which of the 250 does the business actually differentiate on?*
> **`Report on User Security` across all users answers that empirically**, and it is a better input
> than any amount of reading.
>
> Note that **every one of these depends on Extended Security being active** (run 06 F323). With it
> off, the entire 250-permission model is inert.

### FINDING 429 — Sales Security is ~120 permissions and it is where the audit's sales findings were governed

- **Invariant:** almost every discretionary act in order entry has its own permission.
- **Evidence** — `Create a User/Group Actions - Sales Security`. Selected verbatim, grouped:

**Discounting (11)** — `Access Subtotal field on sales orders` · `Access global discounts on dollar
only adjustments` · `Access global discounts on returns` · `Access sales order line discounts` ·
`Apply Subtotal Discount%, Discount Amount or Discount Codes` · `Discount POS Dollar Adjustments` ·
`Discounts - Apply Automated Line Discounting` · **`Discounts - Apply Manager Only Discounts`** ·
`Discounts - Override Sales Discount Restrictions` · `Discounts - Suspend Automated Line Discounting
while Retaining Discounts` · `Override the Restrictions on Combining Line and Subtotal Discounts`

**Price and margin (7)** — `Change the Net Total on Sales Orders` · `Change maximum trade discount for
a sales line item` · `Change customer price category within POS entry` · `Change reduced return
price; not exceeding original price` · `Change reduced warranty price; not exceeding original price` ·
**`Maximum Price Variance`** · `Access the sales margin scratchpad within POS entry`

**Fulfillment and logistics (12)** — `Access all Delivery Route Codes` · `Change Delivery Status` ·
`Change Pickup Status` · `Change delivery contact status` · `Create Multiple Fulfillments for a
Method` · **`Override Maximum Number of Fulfillments`** · `Override Route on Sales and Service
Transactions` · `Override future scheduling restriction` · `Override delivery date restrictions based
on available date` · `Override system calculated delivery charges` · `Override Same Day Pickup
Restrictions` · `Override Parcel Route Requirement`

**Returns and exchanges (10)** — `Complete customer returns` · `Complete customer exchanges` ·
`Enter a New Exchange` · `Enter Return Portion of Existing Exchange` · `Enter return/exchange/dollar
adjustment without original order` · `Override Allowed Number of Days on Returns` ·
`Override Group Return Restriction Days` · `Override system calculated restocking fee` ·
`Change Salesperson at Entry of Return/Exchange` · `Modify Coupons and Subtotal Discounts on Returns
and Adjustments`

**Protection plans (5)** — `Override Calculated Protection Plan Price` · `Override Protection Plan
Cancellation Restriction Days` · `Override Protection Plan Limitations` · `Protection Plans - Allow
Removal of Auto Added Plans` · **`Protection Plans - Allow Sale of Manager Only Plans`**

**Data creation (5)** — `Create special order products within POS entry` · `Create stock product
within POS entry` · `Create purchase order not on hold from POS entry` · `Create Customers when
another exists with the same Email Address` · `Update a Customer Address-Modify Customer Name`

**Sensitive (3)** — **`View encrypted finance, credit card, check account numbers`** ·
`View All Sales Information` · `Backdate Transactions`

**Deletion (a sub-grid)** — `Deletion of Existing Sales Documents`: **Orders · Exchanges · Returns ·
Layaways**

- **Maps to:** run 03 F7, F15–F19, F24, F27–F33, F45, F64–F75, F12 — **the governing permissions for
  a dozen run-03 findings**; run 07 F337, F342, F345.

> **Nearly every discretionary behaviour run 03 documented has a permission here**, and reading them
> as a set says something the individual findings did not: **STORIS's sales model assumes a
> salesperson who can be trusted with almost nothing by default**, and every exception is granted
> explicitly.
>
> Three named concepts stand out. **`Manager Only` appears twice** — for discounts and for protection
> plans — so there is a *manager-only* designation on those objects that a permission unlocks; a
> **value-attached restriction** (kind 5, run 07 §E) in a second place after As-Is reason codes.
>
> **`Maximum Price Variance` is a permission, not a checkbox** — it appears at the bottom of the list
> beside `Delivery Contract Status Codes`, suggesting a value entered per user. That is what makes run
> 07 F345's price-variance rules and run 06 F316's override screen work: **the variance ceiling can be
> per user.**
>
> **`View encrypted finance, credit card, check account numbers`** is a distinct permission from batch
> 7 F418's PII masking — **card and bank numbers are governed in Sales Security, not Personal
> Information Security.** Two records, two classes of sensitive data.
>
> **`Bypass verify user ID during entry`** is the exemption from run 07 F344's Point of Sale User
> Verification.

### FINDING 430 — Logistics Security is ~55 permissions, and five of them are the same carton-requirement override

- **Invariant:** warehouse and delivery discretion is finely permissioned, with the transfer directions enumerated.
- **Evidence** — `Create a User/Group Actions - Logistics Security`. Verbatim, the **Complete Carton
  Requirements** block appears as:
  > `Override Complete Carton Requirements - Purchase Orders` ·
  > `- Store to Store Transfers` · `- Store to Warehouse Transfers` ·
  > `- Warehouse to Store Transfers` · `- Warehouse to Warehouse Transfers`
  > **…and then the same four transfer lines are listed a second time.**
  Other named permissions include: `Adjust Stock Directly to As-Is` · `Adjust inventory for locations
  when WMS is active` · `Adjust inventory quantities within stock adjustment entry` ·
  **`Apply or Remove an As-Is Restricted Reason Code to Inventory`** · `Bypass Transfer Security
  Settings` · `Change Directed Putaway Storage Location` · `Complete Merchandise Transfer` ·
  `Create a manifest with both transfers and customer deliveries` · `Delete an Entire Manifest` ·
  **`Exit a partially unloaded float during picking`** · **`Initiate the Freeze Physical Inventory
  process`** · **`Manually reserve stock merchandise`** · `Override Transfer Capacity Restrictions` ·
  `Override Transfer Restriction of Exceeding Maximum Stock Levels` ·
  **`Override capacities when scheduling Delivery routes that are closed`** ·
  **`Override capacities when scheduling Delivery routes that are full`** ·
  `Override maximum delivery date postponements for stores` ·
  `Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by **Cost** / by
  **Volume** / by **Weight** / Override Freight Amount / Allow Close Batch` · `Recount Storage
  Location` · `Schedule deliveries and pickups with unreserved merchandise` ·
  `Update status and stop time for an order on a manifest` · `Allow to Over Receive Merchandise`
- **Maps to:** run 04 F170, F189, F219, F228, F240, F250, F263, F265, F266 · run 07 F367 —
  **the governing permissions for most of run 04**.

> **The duplicated block is recorded verbatim as it appears.** Whether the product shows nine entries
> or five is not something the audit can determine from the documentation, and it is not guessed at.
>
> Several entries close run-04 questions:
>
> **`Override capacities when scheduling Delivery routes that are closed`** is a *separate permission*
> from `…that are full`. Batch 3 F367 established that a route **closes** when its maximum is exceeded
> and may still be filled to the threshold. **These are the two corresponding permissions**, and they
> confirm the two-state model exactly.
>
> **`Apply or Remove an As-Is Restricted Reason Code to Inventory`** is the permission behind run 04
> F265's four-times-repeated warning, and batch 6 F408 identified the reason-code field. **The chain is
> now complete**: a checkbox on the reason code, a permission here, and a manager override at the
> point of use.
>
> **`Manually reserve stock merchandise`** is a permission the audit never met, and it matters given
> batch 2's finding that reservation is otherwise a queue-driven algorithm. **Someone can jump the
> queue**, and it is permissioned.
>
> **`Exit a partially unloaded float during picking`** is the most specific permission in the corpus,
> and it exists because run 04 F240 found float contents drift from reality — leaving a float
> half-unloaded is how that starts.
>
> **`Receive a Purchase Order with a Separate Freight Bill`** offers three distribution bases — **cost,
> volume, weight** — which is very likely the unpublished `Landed Cost Distribution` / `Distribution
> Method` enumeration that run 04 F273 and run 07 F347 both left open. **Recorded as a strong lead,
> not a resolution**, since these are permissions rather than the setting's values.

### FINDING 431 — System Security includes a database command line

- **Invariant:** sixteen system-level permissions, one of which grants raw command access.
- **Evidence** — `Create a User/Group Actions - System Security`, complete list:
  **`Access ECL command line mode`** · **`Add programs to a Dynamic Escape screen listing`** ·
  **`Assign Screen Action Permissions`** · `Change Taxable Settings` ·
  `Edit Personal Report Viewer Corporate Views` · **`Edit automated general ledger postings`** ·
  **`Export Grid Data`** · `Logout of STORIS on Switch User` · **`Merge Duplicate Customer Accounts`** ·
  **`Modify General System Control Settings data encryption`** · **`Purge secured/encrypted data`** ·
  **`Recover STORIS Licenses`** · **`Run the Daily Reports (EOD) process`** ·
  **`Run the Monthly Reports (EOM) process`** · `View and access product cost information`
- **Maps to:** run 06 F327 · run 07 F378 · run 03 F77 · run 04 F281 · batch 6 F410; `W-050`; `W-012`.

> **`Access ECL command line mode`** — ECL is UniData's Environment Control Language. **This permission
> grants a database command line inside the ERP.** It is one checkbox, it appears in an alphabetical
> list beside `Export Grid Data`, and it is the single most powerful permission in the system.
>
> Given batch 5 F395 established the platform is UniData, this is direct access to the data files
> behind every control the audit has documented. **For any security review, this is the first field to
> read.**
>
> **`Run the Daily Reports (EOD)` and `Run the Monthly Reports (EOM)` are permissions.** Twelve EOD and
> several EOM behaviours were documented across runs 03–07 — releasing credit holds, purging files,
> rescheduling transfers, processing inbound EDI, rebuilding tickle lists. **Who may trigger all of
> that is two checkboxes.**
>
> **`Purge secured/encrypted data`** is separate from the encryption toggle (F378) — so decrypting and
> destroying are distinct rights.
>
> **`Merge Duplicate Customer Accounts`** governs run 03 F77's four-screen merge subsystem.
> **`Add programs to a Dynamic Escape screen listing`** governs run 05 F298's user-customisable
> navigation — so **users cannot add their own escapes without this**, which qualifies run 05's
> reading. And **`Assign Screen Action Permissions`** points at yet another mechanism: a named article,
> `Assign Screen Action Permission`, that the audit has not read. **Possibly an eighth kind of access
> control.**

### FINDING 432 — Service Security is ten permissions, and two of them split warranty coverage

- **Invariant:** creating service is permissioned separately for covered and uncovered merchandise.
- **Evidence** — `Create a User/Group Actions - Service Security`, complete list:
  `Complete service orders` · `Create a Service Order from Other Processes` ·
  **`Create Service for Merchandise Covered by an Extended Warranty`** ·
  **`Create Service for Merchandise not Covered by an Extended Warranty`** ·
  `Delete open service orders` · `Enter service orders with scheduled/estimated/pending status` ·
  **`Modify warranty terms in service order entry`** ·
  **`Override preset vendor charge-back method within service entry`** ·
  `Reinstate completed service orders` · **`View and Access Costs Associated with Service`**
- **Maps to:** run 05 F297, F304, F305, F308; `W-050`; `W-061`.

> **The covered/uncovered split is the interesting one.** A user can be allowed to book warranty work
> and not chargeable work, or the reverse — which maps directly onto run 05 F297's four payment
> responsibilities. Booking uncovered service means charging a customer; booking covered service means
> claiming against a warranty. **Different money, different authority.**
>
> **`Modify warranty terms in service order entry`** is a strong permission — altering the terms of a
> plan at the point of claim.
>
> **`Override preset vendor charge-back method within service entry`** is the **seventh** appearance of
> the chargeback-method family and the first that is a *permission*. Batch 4 F383 upgraded inference
> I-16 to "probable"; this adds that the method is **preset and overridable per service order**, which
> is consistent with one shared concept.
>
> Run 05 F304 found `Reinstate completed service orders` from the reinstatement article. **Confirmed in
> place.**

### FINDING 433 — User-versus-group is the only inheritance in the model

- **Invariant:** permissions are set identically at user and group level, with no other structure.
- **Evidence** — stated verbatim in all four records:
  > "Settings accessed from the **Create a User Group** routine apply to **all users in that group**, while settings accessed via **Create a User** apply to the **individual user**."
  Plus `Create a User`'s **`User Group`** field and the **`User Group Clone Process`** article.
- **Maps to:** F428; batch 7 F414; `W-050`.

> **No roles, no hierarchy, no deny-overrides-allow.** A user belongs to one group and can have
> individual settings; **which wins when they conflict is not stated in any of the four records.**
> That is a significant omission and it is Section H.
>
> `User Group Clone Process` exists because copying a group is the only way to manage 250 booleans at
> scale. **For the rebuild this is the clearest argument for a role model**: STORIS's own tooling is a
> clone button and a report.

### FINDING 434 — Permissions name their own overrides, which is how the audit's override findings connect

- **Invariant:** most "override" behaviours documented across six runs correspond to a named permission here.
- **Evidence**, mapped:

| Audit finding | Permission |
|---|---|
| run 04 F165 — schedule beyond the horizon | `Override future scheduling restriction` |
| run 04 F250 / run 05 F296 / run 07 F367 — route capacity | `Override capacities when scheduling Delivery routes that are **full**` **and** `…that are **closed**` |
| run 04 F263 / run 07 F364 — As-Is markdown cap | `Override Maximum Percentage for As-Is Selling Price Adjustment` |
| run 04 F265 — As-Is Restricted reason codes | `Apply or Remove an As-Is Restricted Reason Code to Inventory` |
| run 04 F228 — over-receiving | `Allow to Over Receive Merchandise` |
| run 04 F189 — delete a manifest | `Delete an Entire Manifest` |
| run 04 F170 — post-manifest edits | `Update status and stop time for an order on a manifest` |
| run 04 F251 — transfer security tables | `Bypass Transfer Security Settings` |
| run 03 F13 / run 07 F345 — price variance | `Maximum Price Variance` |
| run 03 F68 — return windows | `Override Allowed Number of Days on Returns` |
| run 03 F48 — protection plan cancellation | `Override Protection Plan Cancellation Restriction Days` |
| run 05 F305 — reinstatement | `Reinstate completed service orders` |
| run 06 F327 — licence recovery | `Recover STORIS Licenses` |
| run 07 F339 — auto-transfer manifest lock | `Override restriction of line updates once a linked auto transfer has been manifested` |
| run 07 F344 — POS user verification | `Bypass verify user ID during entry` |

- **Maps to:** run 06 F316 (the override screen); `W-050`.

> **Fifteen of the audit's override findings map to a named permission**, which validates run 06 F316's
> reading: the override screen asks for *"a user with security access"* and **this is the access it
> means.**
>
> The pattern is consistent enough to state as a rule: **wherever STORIS documents a restriction, it
> documents an override, and the override is a permission in one of these ten records.** For the
> rebuild, that is a clean design — every constraint has a named, auditable escape — and it is worth
> preserving even if the 250 booleans are collapsed into roles.

### FINDING 435 — Two permissions govern Dynamic Tab Views, confirming composition is permissioned

- **Invariant:** who may maintain a DTS view is a permission.
- **Evidence** — Sales Security: **`Dynamic Tab View - Maintain a Service Order`** ·
  **`Dynamic Tab View-Maintain a Sales Order`** *(spacing verbatim)*.
  System Security: **`Add programs to a Dynamic Escape screen listing`**.
- **Maps to:** run 03 F155, F156 · run 04 F281 · run 04 F199 · run 05 F298 — **the governance of
  screen composition**; `W-050`.

> Run 03 F155/F156 found Dynamic Tab Settings composing screens, run 04 F281 found the Kardex is a DTS
> inquiry, and run 05 F298 found users can add their own escapes. **All three are permissioned**, and
> the audit's §I warning that *"our screen inventory is a lower bound"* now has a governance answer:
> **only permitted users change it.**
>
> Note these are *maintain* permissions on specific documents — sales orders and service orders — so
> DTS views are edited per document type.

### FINDING 436 — Costs are hidden by default in three separate records

- **Invariant:** viewing product and service cost is separately permissioned per module.
- **Evidence** — System Security: **`View and access product cost information`** ·
  Service Security: **`View and Access Costs Associated with Service`** ·
  Sales Security: `Access the sales margin scratchpad within POS entry` ·
  and run 04 F264's Extended Security `View and Access Product Cost Information` on the Vendor
  Chargeback tab.
- **Maps to:** run 04 F264 · run 05 F307 · batch 6 F403 (the costing table exception); `W-061`;
  `W-050`.

> **Cost visibility is governed in at least three places**, and batch 6 F403 found the Costing Table
> Inquiry **ignores location restrictions entirely** on the assumption that whoever reads it is
> unrestricted.
>
> Put together: **cost is permissioned by module but unscoped by location.** A user who can see costs
> can see all of them. That is a coherent position — cost is a company-level fact — but it should be a
> deliberate decision in the rebuild rather than an inherited one.

### FINDING 437 — Deletion of sales documents is a four-way sub-grid

- **Invariant:** deletion rights are granted per document type.
- **Evidence** — Sales Security, at the end of the list:
  > **`Deletion of Existing Sales Documents`** → **`Orders` · `Exchanges` · `Returns` · `Layaways`**
  Plus separately: `Delete quotes` · `Delete shopping carts` · `Delete open service orders`
  *(Service Security)* · `Delete an Entire Manifest` *(Logistics)* · and six line-level delete
  permissions in Sales Security.
- **Maps to:** `W-034`; run 04 F222, F225 (unpermissioned destructive operations) — **by contrast**.

> **Sales deletion is carefully permissioned** — four document types, plus quotes and carts separately,
> plus six line-level variants distinguished by what the line is linked to.
>
> That contrast is worth drawing. Run 04 found **four irreversible operations with no permission
> named** — clearing a physical inventory (F222), deleting a receiving batch (F225), and two others —
> and batch 5 F394 added a fifth (disabling settings auditing deletes its history). **Sales documents
> are protected; warehouse and administrative destruction is not.**
>
> Whether that is a documentation gap or a real asymmetry cannot be determined from the articles.
> Recorded as observed, and it is a concrete question for a security review.

### FINDING 438 — Several permissions confirm findings the audit could only infer

- **Invariant:** the permission list corroborates behaviours documented indirectly elsewhere.
- **Evidence**, selected:
  - **`Schedule deliveries and pickups with unreserved merchandise`** *(Logistics)* — confirms run 04
    F208's auto-transfer settings from the user side.
  - **`Change Fulfillment Status to SCH with a Balance Due`** *(Logistics)* — matches the POS Control
    Settings field of the same name (run 07 F337).
  - **`Change auto transfer date to be greater than delivery date`** *(Logistics)* — a constraint the
    audit never met.
  - **`Complete Orders for Ship Locations Other Than Login Locations`** and **`Complete Returns for
    Return Locations Other Than Login Locations`** *(Sales)* — the permissioned form of batch 6 F403's
    location exceptions.
  - **`Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers`**
    *(Sales)* — confirms batch 4 F381's rewards-to-gift-certificate model **and** adds a restriction
    the rewards record did not mention.
  - **`Increase Sell price above Max Sell price for Repossessions`** *(Sales)* — connects to run 04's
    `Repossession Maximum $` field, which §H carried as unexplained.
  - **`Create order from eRoam`** and **`Import Products from Retail Deck`** *(Sales)* — two named
    external systems, adding to the audit's external-dependency inventory.
- **Maps to:** multiple; `W-050`.

> **`Repossession Maximum $`** was recorded in run 04 batch 9 §C as *"unexplained and unexpected — a
> repossession ceiling on an inventory piece"*, and carried as an open question through the closeout.
> **The permission names what it does**: it is a maximum selling price for repossessed goods, and
> exceeding it is permissioned. **Closed.**
>
> **`eRoam`** and **`Retail Deck`** are the ninth and tenth named external systems in the audit
> (`RetailDeck Control Settings` is also an article in System Control Settings). Both appear to be
> product-sourcing or ordering integrations.

### FINDING 439 — Six module security records remain unread, and one is the largest gap

- **Invariant:** the catalogue is four-tenths complete.
- **Evidence** — unread: `Purchasing Security` (15185859411732) · `Payables Security`
  (15185875557140) · `Receivables Security` (15185875555988) · `Transfer Security` (15185859625876) ·
  `Import Data Security` (15185859622804). `Personal Information Security` was read in batch 7.
- **Maps to:** F428; run 01 (Accounting) · run 02 (Merchandising).

> Recorded so the completeness claim is honest. **Purchasing, Payables and Receivables Security are the
> three that govern runs 01 and 02** — the Accounting and Merchandising runs, which between them
> produced 473 findings and cited permissions the audit could not source.
>
> `Receivables Security` in particular holds `Approve F4 credit holds placed on financed orders`
> (run 04 F202), and `Purchasing Security` presumably holds the **two inverted PO-hold permissions**
> that run 02 identified and the audit has referenced ever since without seeing them.
>
> **The catalogue is tractable and half-built.** Six records, one batch.

---

## C. Screen and field inventory

All four records share one structure: **`Grid` · `Check` · `Clear` · `Allow a User To:` [list]**.
Sales Security ends with three non-boolean entries — **`Delivery Contract Status Codes`** and
**`Maximum Price Variance`**, plus the four-way `Deletion of Existing Sales Documents` sub-grid.

---

## D. Control settings catalog (additions)

| Setting | Record | Effect |
|---|---|---|
| **Extended Security** | General System Control Settings | **Prerequisite for all ten permission records** |
| `Manager Only` *(on discounts and protection plans)* | *(object-level, record unread)* | Unlocked by two Sales Security permissions (F429) |

---

## E. Security permissions catalog — CONSOLIDATED

### The model

| Layer | Mechanism |
|---|---|
| **Prerequisite** | `Extended Security` active (General System Control Settings) |
| **Grant** | **Ten** `Create a User/Group Actions - <Module> Security` records, **~250 boolean actions** |
| **Scope** | Regional Processing four-level hierarchy · **seven location lists** per user · 22 documented exceptions · **session accumulation** |
| **Beneath** | `File Security Groups` · `Field Security Codes` · `Assign Screen Action Permissions` |
| **Data-level** | PII masking × 4 surfaces · encrypted card/bank number viewing · cost visibility × 3 records |
| **Value-attached** | As-Is Restricted reason codes · `Manager Only` discounts and plans |
| **State-based** | Manifest membership · aisle locks · order-level picking exclusivity · deposits/financing on an order |
| **Inheritance** | User **or** group only; conflict resolution **undocumented** |
| **Point-of-use** | The Security Override Screen (run 06 F316) — supervisor credentials and/or reason code |
| **Audit** | **`Report on User Security`** · `Track Settings Activity` · `Review Settings Activity` |

### Record inventory

| Record | Permissions | Read |
|---|---|---|
| Sales Security | ~120 | ✔ |
| Logistics Security | ~55 | ✔ |
| System Security | 16 | ✔ |
| Service Security | 10 | ✔ |
| Personal Information Security | ~9 | ✔ *(batch 7)* |
| Purchasing Security | ? | — |
| Payables Security | ? | — |
| Receivables Security | ? | — |
| Transfer Security | ? | — |
| Import Data Security | ? | — |

---

## F. State machines and enumerations (additions)

- **Permission count:** ~200 read, ~250 estimated across ten records.
- **Sales deletion sub-grid (4):** Orders · Exchanges · Returns · Layaways.
- **Freight distribution bases (3):** cost · volume · weight *(a strong lead on the unpublished
  `Landed Cost Distribution` values)*.
- **Transfer directions (4):** store→store · store→warehouse · warehouse→store · warehouse→warehouse.
- **Route override states (2):** full · **closed**.
- **Service creation split (2):** covered by extended warranty · not covered.

---

## G. Sequencing rules

1. Extended Security must be active → **otherwise none of the ~250 permissions apply**.
2. Restriction encountered → **Security Override Screen** → a user holding the corresponding
   permission authorises (run 06 F316, F434).
3. User record changed → **STORIS restart required** before it takes effect (batch 7 F421).

---

## H. Open questions and gaps

### Resolved this batch

- **The consolidated permission catalogue** — sourced for four of ten records (F428–F432).
- **`Repossession Maximum $`** — carried unexplained since run 04 batch 9; **closed** (F438).
- **The two route-override states** — batch 3 F367's full-versus-closed model confirmed by two
  separate permissions (F430).
- **Fifteen override findings** mapped to named permissions (F434).

### Newly opened — priority

- **`Access ECL command line mode`** (F431) — a database command line as a checkbox. **First field to
  read in any security review.**
- **`Assign Screen Action Permission`** — a named article and a permission; **possibly an eighth kind
  of access control**.
- **User-versus-group conflict resolution is undocumented** (F433). Four records state both levels
  exist; **none says which wins.**
- The **six unread module security records** (F439), three of which govern runs 01 and 02.

### Still open

- Whether Logistics Security's duplicated carton block is nine entries or five (F430).
- Whether the three freight distribution bases are the `Landed Cost Distribution` values (F430).
- `Delivery Contract Status Codes` and `Manager Only` designations — named, unexplained.

### Inferences

- **I-76:** `Landed Cost Distribution` / `Distribution Method` takes the values **cost, volume,
  weight**, matching the three freight-distribution permissions. *A permission list is not a value
  list; recorded as a lead.*
- **I-77:** Individual user settings override group settings, since the records describe individual
  settings as applying "to the individual user". *Not stated; the opposite is equally readable.*

---

## I. Unknown unknowns

- **A database command line is one permission** (F431). Everything the audit has documented about
  controls, holds, costing and access is enforced by application code that this bypasses.
- **The model has no conflict resolution documented** (F433). With users in groups and individual
  overrides, "what can this person actually do" may not be answerable from the screens at all — which
  is presumably why `Report on User Security` exists and reports **both** enabled and disabled
  settings.
- **Sales documents are protected from deletion; warehouse and administrative destruction is not**
  (F437). Five destructive operations across runs 04–07 have no named permission.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **ECL** | UniData's Environment Control Language — a database command line, granted by one permission |
| **Manager Only** | A designation on discounts and protection plans, unlocked by permission |
| **Maximum Price Variance** | A per-user price-reduction ceiling in Sales Security |
| **Complete Carton Requirements** | A receiving/transfer constraint, overridable per document direction |
| **eRoam / Retail Deck** | Named external systems for order creation and product import |

---

## Contract adjudication — batch 8

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** *(access control)* | **CONFIRMED — the catalogue is sourced, not inferred** | ~200 permissions across four records (F428–F432); fifteen audit override findings mapped (F434) |
| **W-034** *(deletion)* | **CONFIRMED, with an asymmetry** | Sales deletion is four-way permissioned; warehouse destruction is not (F437) |
| **W-061** *(cost)* | **CONFIRMED** | Cost visibility permissioned in three records, unscoped by location (F436) |
| **W-024** *(holds)* | **CONFIRMED** | `Approve E1 credit holds…` in Sales Security (F429) |
| **W-046** *(chargebacks)* | **seventh instance — consistent with one concept** | `Override preset vendor charge-back method within service entry` (F432) |
| **Screen composition** | **CONFIRMED as permissioned** | Two DTS maintain permissions, one Dynamic Escape permission (F435) |

---

## Next — batch 9

The six remaining module security records — **Purchasing, Payables, Receivables, Transfer, Import
Data** — completing the catalogue; plus `Assign Screen Action Permission`, `Create a User Group`, and
a coverage statement closing **User Settings** (49).
