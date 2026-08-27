# Customer Identity, Verification, Lists & Merge

The 22 Sales Order Maintenance screens that create, correct, verify, deduplicate and market to the customer
record. `01` has a coarse Customer field table; this file has the screens that write it. Screens covered:
`[2] [8] [24] [25] [29] [32] [38] [45] [47] [59] [78] [83] [88] [109] [131] [141] [150] [160] [162] [163]
[164] [169]`, named at each section.

Two things matter beyond the module. **The merge pipeline is destructive with no documented undo** (§4), and
`11` says the cutover runs through it. **Marketing consent is one boolean checked at list-build time**
(§5.4), which is not a consent model.

---

## 1. Creating a customer inside a transaction — `[32]`

```
Customer Number field
├── type a LAST NAME, press Enter/Tab
│     → Search for a Customer   (ALWAYS shown on this path, regardless of config)
│     → no match → Exit → Customer Settings opens, last name pre-filled
│     → Save → returns to the entry routine
└── click the Action button
      → POS CS "CUSTOMER SEARCH - Always during Entry" ON  → search first, then as above
        OFF → Customer Settings opens directly
```

`[DOC]` Only the Action-button path honours that setting. **Enter a Customer Payment/Refund/Gift
Certificate** accepts on-the-fly creation *only* via the Action button.

`[DOC]` **The new customer's code is assigned from the order number.** `[DECIDE]` Do not copy — it couples
lifecycles that diverge immediately and collides under per-location order numbering. Use an opaque id plus a
`customer_code` from its own sequence.

`[DOC]` The record is then **viewable** from the Action button but **editable only by exiting the routine**.
`[DECIDE]` Make it editable in place, or typos stay.

`[DOC]` **Customer Telephone Number Lookup** may populate the record with information found "using the
Internet". `[DECIDE]` Third-party enrichment with no provenance marker: stamp source and date, or don't
retain.

### The minimum viable customer

| Situation | Minimum |
|---|---|
| Normal order | Name (per Customer Entry config) + billing address; delivery address if a delivery fulfillment exists; email and phone per config |
| Prohibit-PII store, pickup/take-with, "None of the Above" | **Name only**, ≤50 characters — §3.3 |
| Prohibit-PII store, any other box ticked | Full record; an order comment records why `[DOC]` |

`[INFER]` The order needs what completion and tax consume: a name to print, a zip (automatic freight
calculation references it `[DOC]` `[162]`), a jurisdiction. Model "customer sufficient for this order type and
fulfillment method" as one rule set, not scattered field mandates.

---

## 2. Identity field entry

### 2.1 Names — the 50-character rule — `[59]`, `[162]`

`[DOC]` **Combined length of all name elements ≤ 50 characters** — stated independently in `[59]`, `[141]`
and `[162]`, so it is a system constraint, not one article's aside.

`[DECIDE]` Never defined: whether "combined" counts separators, whether it spans the Alternate Name group,
what overflow does. Recommend the sum of trimmed primary-name components, no separators, server-side.

| Field `[DOC]` `[162]` | Behaviour |
|---|---|
| `Business` checkbox | When checked: Prefix/First/Middle/Suffix go **inactive**, **Last Name becomes Business Name**, **Contact Name activates** |
| `Prefix` | Active only if POS CS › **Prompt for Name Prefix** = Optional or Required |
| `Middle` / `Suffix` | Gated by **CUSTOMER ENTRY - Prompt for Middle Name** / **- Prompt for Name Suffix** |
| Alternate Name group | `First`, `Middle`, `Last Name`, `Relationship` — an optional second contact |

```
Relationship = None Selected | Husband | Wife | Partner | Relative | Friend
             | Business Partner | Other
```

`[59]` **Enter Customer Name** is the reduced form (Prefix, First, Middle, Last) used in the prohibit-PII
path. `[DOC]` "If no name is provided and the user exits out of this window, the order cannot be created and
the user is returned to the Order Number field." Both screens validate against the same Customer Entry
config — one validator.

### 2.2 Phones — a collection, not three columns — `[2]`, `[109]`

`01` lists `home_phone` / `cell_phone` / `work_phone` / `extension` as scalars. **That is wrong.** `[DOC]`
`[109]`: "an unlimited number of phone numbers can be associated with a customer account." Correct `01` to
`phones[]`.

| Field `[DOC]` `[2]` | Rule |
|---|---|
| `Type` | Mandatory, single-select `Home` \| `Cell` \| `Work`; one type per number |
| `Phone` | Mandatory; auto-formatted; **unique per Type, may repeat across types** — `555 555-5555` may be both Home and Cell, but not twice Home |
| `Extension` | **Active only when Type = Work** |
| `Description` | Optional, **max 30 characters** |
| `Primary` | One per **Type**; checking auto-unchecks the previous primary of that type |

`[DOC]` "There must be one primary number established for each Type" — automatic when a type has one number,
and **the customer cannot be saved until a primary is chosen**. A save-blocking invariant.

`[DOC]` `[109]` grid: no in-grid editing (double-click opens `[2]`); **removal only via the grid's Remove
button**; sortable, columns hideable, **filtering disabled**; new numbers land in the bottom row and re-sort
`Home, Cell, Work` on next open. **Lookup** (Phone to Address / White Pages) works **only for Work or Home**.

`[DOC]` **Collapse rule:** where phones surface elsewhere and a customer has several of one type, **only the
phone with the highest priority displays**. `[DECIDE]` "Highest priority" is defined nowhere in the corpus;
`[INFER]` the primary of that type. Confirm — wrong here sends a delivery crew to a dead number.

### 2.3 Email — `[47]`, `[162]`

`[DOC]` `[162]`: multiple addresses in one field — "If entering more than one, separate with a semi-colon and
no spaces." `[DECIDE]` Store `emails[]` with a primary flag; `[47]`'s duplicate check is against the
*primary*, so the concept exists.

```
[47] Email Address Entry appears in Sales Order Entry when ALL of:
  1. the customer has no email in Customer Settings, AND
  2. emails are required     (POS CS › Advanced › "Default Email Address"), AND
  3. defaulting is NOT on    (POS CS › Advanced › "Load Default Email Address")

If defaulting IS on: no screen. The system silently writes the default email
address onto the customer record.
```

`[DECIDE]` The defaulting branch fabricates contact data that the "Select Email only" list filter then
selects. Don't implement it; block, or record an explicit "declined to provide".

**Two duplicate-email policies** `[DOC]`:

| Path | Behaviour | Gate |
|---|---|---|
| `[47]` order entry | **Dismissible warning** if the address is another customer's *primary* | POS CS › "Customer Entry - Warn if Primary Email exists for other Customers" |
| `[162]` customer update | **Blocked** unless permitted, else a security override | Sales Security › "Create Customers when another exists with the same Email Address" |

`[DECIDE]` Pick one — recommend `[162]`'s. A shared primary email is the strongest duplicate signal the merge
search has (§4.2), and a dismissible warning is how duplicates get created.

### 2.4 Addresses — three distinct roles — `[162]`, `[163]`

`[DOC]` **Billing**, **delivery** and **shipping** are separate. `[162]` maintains billing + delivery; `[163]`
maintains shipping and the co-applicant additional address. `01`'s `deliver_to` covers only delivery.

`[162]` — existing customers only: "You cannot enter new customers using this process." `[DOC]`

- `Line 2` is for P.O. Box, floor, department — "not to be used for city, state, and zip code."
- `Zip Code` defaults `City`/`State` from the Zip Code file, both overridable; unknown zips prompt to create
  one. A state differing from the zip default "usually indicates an error that should be corrected in the
  Sales Tax file."
- `Delivery Address Same as Billing Address` — unchecked by default; checking **collapses, clears and
  deactivates** the delivery fields. Unchecked with none entered → a message on save that a delivery address
  is mandatory. `Extended Delivery Instructions` defaults into order entry and prints on tickets.
- **Context-sensitive:** from Enter a Sales Order's Actions button the same-as-billing checkbox and the whole
  delivery section are **hidden**. From Enter a Service Order, related orders update and "a message is
  displayed for all orders where information does not match or could not be updated."
- **Audit:** adding, changing **or removing** the delivery address posts a **Customer Activity Log** comment
  with the user, the time and **the former address**. The address is overwritten; the log is the record.
- "If Address Cleansing within Alternate Tax Interface Control Settings is active, any address updates are
  validated."

`[163]` — one screen, two roles by entry path. `Customer Code` and `Name` auto-populate, **not editable**.
`Address 1`/`Address 2` **30 chars** each, `City` **15**, `State` a **2-character** code or lookup, plus
**`Country Code`** — the only country field in this slice. `[DOC]` Unknown zip prompts **"Zip Code NOT on
file. Create new Zip Code?"**

`[DOC]` **Retroactive propagation.** On Save in the customer-shipping role, "a prompt appears asking if you
want to update sales orders. If you click Yes, open sales order shipping address information is updated with
the changes made here **where the address on the order matches the old shipping address**. If you click No,
changes are updated in customer settings only."

`[DECIDE]` This contradicts `01`'s rule that the order carries a *snapshot* and "must print as it was
written." Recommend: snapshot stays authoritative; the prompt becomes an audited bulk amendment writing an
order comment on every order it touches (it currently writes none).

---

## 3. Verification

Four mechanisms. **None sets a documented hold, and none retains a verification result.**

### 3.1 Address Verification — `[8]`

Nine entry paths spanning sales/return/exchange/service order entry, customer and deliver-to maintenance, and
the A/R credit application. Purpose: "ensure accuracy for delivery and credit reporting purposes."

```
Providers = Experian | Avalara | Vertex          (must be licensed and active)
Avalara/Vertex also require: Alternate Tax Interface CS › address cleansing ACTIVE
Address Type = billing address | delivery address | co-applicant's billing address
```

`[DOC]` `Address Type` is disabled when "Delivery Same as Billing Address" is checked or only one address
needs verifying. `Refresh Addresses` re-queries after edits. Returned matches list in a grid; **a single match
is pre-selected**; with multiple, exactly one may be checked.

**On failure** `[DOC]`: "If no matching addresses are found, an alert message displays and returns you to the
verification screen to make edits and refresh the address. **Exit the screen to use the address as originally
entered.**" So verification is **advisory and bypassable via Exit** — no hold, no flag, no block.

**Retained:** only the chosen address string. `[DECIDE]` Retain `provider`, `checked_at`, `match_result`
(`matched` / `corrected` / `no_match` / `bypassed`), `candidate_count`, `actor`. Tax jurisdiction assignment
and credit reporting both depend on address quality and neither can currently tell a cleansed address from a
typed one. Cleansing can also silently change an address already snapshotted onto open orders (§2.4).

### 3.2 Driver License Verification — `[45]`

`[DOC]` Invoked when **a revolving payment has been applied to an order**. One field, `Driver License Number`;
"the driver's license is **MASKED** upon entry." Validation happens **only** if **Verify Customer Driver
License** is enabled in Accounts Receivable Control Settings.

That is the whole article: it never states what the licence is checked against, what failure does, whether the
payment is blocked, whether a hold is set, whether the number is stored, or for how long (open questions 4–5).

`[DECIDE]` Per `10` §Data protection item 3, **store a verification result and the last four, not the
number.** Masking on entry is a display control, not a storage control.

### 3.3 Is-address-required, and the name-only customer — `[82]`→`[59]`

`[82]` belongs to the order-entry slice; it matters here because its "None of the Above" branch produces a
name-only customer, and it is the only place in this module where STORIS **declines to collect** personal data.

```
Trigger — ALL of:
  Warehouse/Store Location Settings › "Prohibit Customer Personal Information
      when not Required by Sale" CHECKED
  Order Type ∈ {sales, exchange, return, quote/layaway}
  the order's Store is subject to that setting
  Fulfillment Method ∈ {Customer Pickup, Take With}

Checkboxes: warranties · non-credit-card payment · resale license
          · not taking all merchandise today · membership · None of the Above

any box except "None of the Above" + Save
  → an order comment is written naming EACH option chosen
  → the Customer field unlocks   (full record required)

"None of the Above" + Save
  → Enter Customer Name [59]
  → name saved → order proceeds with a name and nothing else
  → exited with no name → ORDER CANNOT BE CREATED, back to the Order Number field
```

`[DOC]` Bypassed when POS CS › Fulfillment Methods › Sales Order / Exchanges / Returns is set to Customer Pick
Up or Take With. A same-day pickup date plus "will not be taking all merchandise today" can block the save;
escapes are **Override Same Day Pickup Restrictions** or a second-user override.

`[DECIDE]` Keep and generalise this — the module's only data-minimisation control, and the order comment it
writes is the retained justification a purpose-limitation requirement wants.

### 3.4 Signature Acceptance — `[150]`

`[DOC]` "This screen displays only if Signature Capture is active in General System Control Settings, and the
Show Signature check box is enabled on the EMV Signature page of Payment Card and Device Settings." And:
**"This screen does not display for credit card signatures."**

The consumer signs the terminal and taps Accept; the image routes to the workstation for staff review. No
fields — the image and three buttons.

| Action | Effect `[DOC]` |
|---|---|
| **Accept** | Staff attest it "meets the merchant's standards for a viable signature." The signature is rendered onto the business document, **a PDF is created with the signature, and the PDF is moved to the desired storage place on the network** |
| **Decline** | The signature is ignored and **the payment terminal repeats the signature ceremony** |
| **Exit** | "the Exit button on this screen also acts as a Decline" |

It verifies nothing about identity — a human judgement call with no reference comparison, and an unbounded
retry loop on failure.

`[DECIDE]` **What is retained is the problem.** A PDF containing a handwritten signature goes to a network
file location with no documented access control, encryption or retention, linked to the order only by the
document itself. Store it as an access-controlled `Attachment` on the order (`01` has the entity) with
accepting actor, timestamp and retention clock, and no file-share copy. Log declines too — today "the customer
refused to sign three times" leaves no trace.

---

## 4. Deduplication and merge

### 4.1 The pipeline

```
[141] Search for Duplicate Customers to Merge
        select N duplicates ("merge from") + exactly 1 merge-to
        │   └── [169] Account Summary  (Detail Action button, either grid) — eligibility preview
        ↓ OK
[131] Review Status and Merge Individual Customers
        side-by-side DUPLICATE | MERGE TO, with drill-downs
        ├── Recommend  (no permission)   → "User Recommended"
        ├── Merge      (with permission) → immediate attempt
        └── Remove                       → "Remove"
        ↓
[88]  Manage Customer Merge List — the queue; REVIEW / MERGE / REMOVE / PRINT
        ├── manual Merge → immediate attempt
        └── "Pending" pairs merged by the next scheduled process run
        ↓
      Report Customer Merge Status
```

### 4.2 Finding duplicates — `[141]`

Two independent searches over the same five fields — one for duplicates, one for the survivor.

| Field | Match semantics `[DOC]` |
|---|---|
| `Last Name` | **Prefix match** — "any customer whose last name starts with this entry" |
| `Phone` | Exact, **entered without delimiters** |
| `Email` | Exact |
| `SSN` | Exact |
| `Narrow by Zip Code` | Filter only — **requires at least one other criterion** |

`[DOC]` **Same as Duplicate** copies the duplicate criteria into the merge-to section, still editable. The
duplicate grid's header checkbox selects all; label **"Select Duplicate Customer(s) to Merge."** The merge-to
grid accepts **exactly one**; label **"Select 1 Customer to Merge the Duplicate(s) into."** The 50-character
name limit applies. Grid columns, both grids: Customer Code · Name · Address · City/Town · Home Phone · Work
Phone · Cell Phone · Email · **SSN** · Zip Code · Detail.

`[DECIDE]` **A grid rendering SSNs for arbitrarily many customers at once is a mass-exposure surface.**
`[131]` and `[169]` gate full SSN behind a permission; `[141]` mentions no gate while showing the column in
bulk. Mask unconditionally, and consider dropping SSN as a *search* key — matching on it requires the operator
to hold the number already.

### 4.3 Account Summary — `[169]` — the eligibility evidence

Display-only, from the Detail Action button in either `[141]` grid; most fields drill down.

| Field | Meaning | Drill-down |
|---|---|---|
| `Last Activity Date` | Date of the newest customer-activity-log comment | Customer Activity Log |
| `Lifetime Sales` | Total historical purchases | Historical Purchases |
| `Open Orders` | Total of open transactions | Open Transactions |
| `Deposits` | Total **deposit liability** | Current Deposits |
| `Open Item` | Total amount due | Account Balance |
| `Revolving` | Total long-term revolving amount | All Revolving Activity |
| `Installment` | Total pending installment transactions | All Installment Activity |
| `Social Security #` | Full number **only** with permission; else encrypted, last four | — |

Exactly `01`'s balance buckets — confirming `01`'s instruction to model them as **derived queries**.

`[DOC]` Full SSN is gated by **"Access other credit applications and score reporting"**. `[DECIDE]` A
credit-application permission gating SSN inside a *merge* tool is accidental coupling; give sensitive-field
visibility its own permission.

### 4.4 Review, statuses, the two-person model — `[131]`

`[DOC]` `Eligible` — **"immediately"** or **"in the future"**, computed from existing activity **on the
customer designated as the DUPLICATE**. `Status` likewise derives from the duplicate. `Current Action` is what
this session did.

```
Merge Status:
  Null / No Status  no previous merge actions or steps saved by system or user
  User Recommended  the recommending user's ID replaces the word 'user'
  Merge             merged when eligible at the next scheduled run, or on manual merge
  Merged            successfully merged
  Removed           merge status removed; THE DATA IS REMOVED BY THE PURGE PROCESS
  Attempted         attempted and failed — eligibility, FILE LOCK, or error

Eligible: immediately | in the future
```

`[DOC]` **Two-person model:** with permission you merge; **without it you can only Recommend**, flagging the
pair for a permitted user. `[88]` shows this as "Recommended" plus the **recommending user's initials**.
Previous/Next walk a multi-selection.

`[DOC]` The only documented statement about what a merge *moves*: **"Protection plan register records are
updated with the merge-to customer number when working with protection plans."**

`[DOC]` Both `[88]` and `[131]` defer the rules: "See the **Duplicate Customer Merge Overview** for the list
of merge rules." **That article is not in our corpus**, so the rules deciding whether a merge is safe are
undocumented here — open question 1.

### 4.5 The queue — `[88]`

`[DOC]` Grid: duplicate and merge-to **names and codes**, `Eligible`, `Merge Status`. Actions on checked rows,
**availability depending on security settings**: `REVIEW` (→ `[131]`), `MERGE` (immediate, all selected),
`REMOVE` (status Remove, drops the pair), `PRINT` (→ Report Customer Merge Status).

`[DOC]` **Failure:** "If a customer cannot be merged immediately, a message displays the reason and the
duplicate and merge-to customers remain on the list." A batch Merge is **per-pair atomic**; failures stay
queued with a reason. Keep this.

### 4.6 What merges, what survives, what is irreversible

| | Detail |
|---|---|
| **Documented to move** | Protection plan register records → merge-to customer number `[DOC]` |
| **Implied to move** `[INFER]` | Orders, deposits, open items, revolving and installment activity, historical purchases, activity log — eligibility is computed from precisely these buckets and the merge-to survives, so they must reattach |
| **Never stated** | Reward points and issued reward certificates (§6.1); gift registries; mailing counters (§5.5); co-applicants; finance applications and unused approvals; phones/emails when both records hold a primary of the same Type |
| **Audit that survives** | The merge-status record (`Merged`, with recommender initials) and Report Customer Merge Status |
| **Audit that does NOT survive** | A `Removed` pair — "the data is removed by the purge process." The record that a human reviewed two customers and decided *not* to merge them is deliberately deleted |

**Irreversibility.** `[DOC]`/`[INFER]` **There is no undo.** No unmerge, reverse-merge or rollback screen
exists anywhere in the 172-screen section and no article mentions one. Once a pair reaches `Merged` the
duplicate's identity is gone and every object that moved points at the survivor. The duplicate's pre-merge
name, addresses, phones and emails survive nowhere except in activity-log comments that happen to exist for
unrelated reasons.

`[DECIDE]` **Build these before building the merge:**

1. An immutable **pre-merge snapshot** of both records, retained for a defined period.
2. A **merge event record**: actor, timestamp, both codes, both name/contact snapshots, recommender,
   eligibility verdict, and **per-object-type counts moved** — without the counts nobody can answer "did that
   order move or vanish."
3. `merged_into_customer_id` on the loser and `merged_from_codes[]` on the survivor so **old customer codes
   keep resolving**; staff and customers quote codes off paperwork for years.
4. An audit comment on the survivor, per `10`'s rule that destructive actions write immutable comments.
5. Retain `Removed` decisions rather than purging them, or the same pair is re-reviewed forever.
6. **Locking.** `Attempted` names "file lock" as a failure cause: serialise merges per customer and lock both
   customers against order entry and payment application for the duration. A merge racing an in-flight order
   is how a deposit goes missing.
7. A **dry-run mode** reporting what would move without moving it — the cutover dedupe will be run in bulk by
   people who have never used this tool.

---

## 5. Customer and mailing lists

`[38]`/`[29]` — named, saved **criteria** lists, **generated on demand** into a record set, then exported to
Excel or ASCII or printed as labels. Criteria and generated set are separate objects, and the set goes stale.

### 5.1 Criteria — `[38]`

```
Status Code (defined in Update Customer Mailing Data) · Source Code (ditto)
Demographics (3 user-defined) · Last Purchase Date · Last Mail Date · Number of Mailings
Last Mail Name · Selling Store · Zip Code · Product · Group · Category · Brand
Mailing List Name · Collection · Product not Purchased · Selling Price
Marketing Code 1 · Marketing Code 2
```

### 5.2 Building a list — `[29]`

`[DOC]` `List Name`; `Description` (**30 chars**); `Sort List By` = `Last Name` | `Zip Code`;
`Warranty Links` = `All Products` | `With Warranty` | `Without Warranty`; `Select Email only`; display-only
`Record Count` and `Last Selected Date`. Per criterion one restriction form — `Equal To` (multi-value),
`Starting With` (≥), `Ending With` (≤), `Exact Date`, `Start Date`/`End Date` (date criteria only).

`[DOC]` **AND across criterion types, OR within a criterion** — each criterion narrows, never widens. Three
ways to generate: Actions › Select/Re-select List; Save (prompts "select/re-select now?"); or the Re-select
checkbox on `[24]`. **"Each time you edit a list you must re-generate it to pick up the changes."**

`[DOC]` **Retention bounds what a list can see:** **Completed Orders** and **Customer Retention Months** in
POS Control Settings — a "bought Product 1" list searches only completed orders not yet purged.

### 5.3 Copy `[25]` and confirm `[24]`

`[25]` — one field, `New List Name`; OK saves the copy and returns. `[DOC]` **"After the copy, the routine is
now working on the NEW list."** To edit the original, re-select it at the List Name prompt.

`[24]` — shown on Run in Print Mailing Labels / Print Mailing Lists. Shows `List Name`, `Last Selection Date
for List`, `Number of Records in List`, and **`Re-select List`**. `[DOC]` **"If unchecked, the merge program
uses the records found the last time the list was selected."** `[DOC]` "For this function to work properly,
you must sort the list you use in alphabetical (last name) order."

### 5.4 The marketing-consent model — and why it is not one

| Mechanism | What it really is |
|---|---|
| **`Do Not Solicit`** (Customer Settings) | A **single boolean suppression flag** — no channel, no date, no source. `[DOC]` Applied as a list-build exclusion |
| `Marketing Code 1` / `Code 2` | **Attribution** — where the customer came from. Not consent |
| `Select Email only` | A **capability** filter (does an address exist), not a permission filter |
| "Emails &/or text?" | A **user-defined demographic question** whose answer is a code — the docs' own example matches on the answer `"B"` `[DOC]` |

`[DECIDE]` This cannot support CAN-SPAM / CCPA / CPRA-style obligations, and consent stored as an unlabelled
demographic answer is not evidence of anything. The replacement needs:

1. **Per-channel consent** — email, SMS, postal, phone — each with `state`, `captured_at`, `source`, `actor`,
   and the text agreed to.
2. **Suppression evaluated at send time, not build time.** A concrete live defect: because `[24]` will mail a
   previously-generated record set (Re-select unchecked), **a customer who opts out after selection still gets
   mailed**.
3. **Unsubscribe writes to consent**, never to a demographic field, and reaches every generated set —
   including Excel exports, which therefore need an expiry.
4. **Consent change history**; the current model overwrites a boolean.
5. `Do Not Solicit` migrated as *all channels suppressed*, `source = "migrated from STORIS"`, no captured
   date, so nobody later mistakes it for an affirmative choice.

### 5.5 Update Customer Mailing Data — `[164]`

Also titled *Customer History Maintenance*; maintains the **Customer History file**, distinct from the customer
master. `[DOC]` Display-only identity block (Customer Type, Full Name, Address 1/2, City ST Zip, Home Phone,
Work Phone, Ext, Email Address). Editable:

| Field | Rule |
|---|---|
| `Marketing Code 1` | Active only if POS CS › **First Marketing Code** is optional or mandatory |
| `Code 2` | Active only if **Second Marketing Code** is optional/mandatory **and** Code 1 is populated. **"Entries in Marketing Code 1 and Code 2 must differ."** |
| `Status Code` | User-defined, **up to 6 alphanumeric**, optional; a mailing-list criterion |
| `Source Code` | **Up to 6 alphanumeric**; system value shown but freely overwritable |
| Demographics | `User1/User2/User3 Defined` until renamed in **Demographics Control Settings**; also collected during sales entry |

```
System Source Codes:  STORIS (from a completed order) | Order (sales order)
                      Quote (sales quote) | Layaway (layaway order)
```

`[DOC]` Counters written by each **Print Mailing Lists** run: `Mailing` (last label date), `Mailing Name`,
`Total Mailings`. Plus `Purchase` — last purchase date, updated on order completion, and "The system uses this
field for the automatic purging of history records during the Month-Ending (EOM) process."

`[DECIDE]` A 6-character `Source Code` the system pre-populates and the user may overwrite is not reliable
attribution. Make the system value immutable; put operator input in a separate field.

---

## 6. Loyalty and relationship programs

### 6.1 Issue Customer Rewards — `[83]`

Converts reward points into a gift certificate. `[DOC]` `Customer Code`, then display-only `Number of Reward
Points Earned` (from **Customer Rewards Control Settings** plus Product records), `Maximum Gift Certificate
Allowed` (from **Percent for Gift Certificate Calculation**), `Reward Points Used`, `Reward Points Remaining`.
One editable field, `Gift Certificate Amount` — **"you cannot enter an amount exceeding the Maximum Gift
Certificate Allowed."** Rules that matter `[DOC]`:

- **"You cannot add funds to, or refund amounts from, gift certificates created as part of the Customer
  Rewards program."** One-way conversion, non-refundable instrument.
- Payment type code **`REWARDS`** is assigned automatically and is **internal and absent from Gift Certificate
  Payment Type Settings** — code enumerating types from that table will miss it.
- The customer is accessible only if **Do Not Accumulate Reward Points** (Customer Settings › Advanced) is
  **unchecked**; visibility is also subject to **Regional Processing**.
- With gift-certificate auto-numbering disabled, the **Gift Certificate Manual Authorization Entry Screen**
  opens. For certificates bought with money, use **Enter a Customer Payment/Refund/Gift Certificate**.

`[DECIDE]` Model reward certificates as a distinct instrument class with `refundable = false` and
`reloadable = false`. And decide what a **merge** does to reward points and issued reward certificates — the
docs are silent and points are money.

### 6.2 Gift Registry Name Lookup — `[78]`

`[DOC]` One field, "Enter all or part of Name to search for", matching **either the registry owner's name or
the alternate name** — the person who enrolled, or the person the registry is *for*. Enter searches;
**double-click a grid line selects the registry**. Grid: Owner ID, Owner Name, Alternate Name, Registry Type.
Three entry points: Report Outstanding Gift Certificates, Create/Update a Customer Gift Registry, and
"Contribute to gift registry" in Enter a Customer Payment/Refund/Gift Certificate.

`[INFER]` A registry holds a **second person's name** on a customer-adjacent record; include registry alternate
names in retention and access scoping.

### 6.3 Trade Designer Information — `[160]`

Displays automatically on entering the customer code in Enter a Sales Order, or via Customer page › Actions.
`[DOC]`

- `Referring Designer` — active only when the bill-to is **not** the trade/designer. **"The customer you enter
  here must be classified as a trade Customer Type via Advanced Customer Settings."** Search is **limited to
  trade customers only**. If the bill-to *is* trade, the field shows the bill-to code and **cannot be
  changed**.
- `Designer's PO Number` — optional, **"Up to 20 characters of alpha-numeric text"**; surfaces as **Customer's
  PO** on Additional Order Detail.
- "Subsequent changes to fields on this screen for existing orders can be tracked via Track Processing
  Activity."

```
Apply the Trade/Designer's Discount:
  100% of Discount · 50% of Discount
  0%   of Discount       — DEFAULT when the billing customer IS a Trade Designer
  No Discount Allowed    — DEFAULT when the billing customer is a regular customer;
                           INACTIVE if Referring Designer is empty, ACTIVE if populated
```

---

## 7. Consolidated

### 7.1 Customer field additions beyond `01`

| Field | Source | Note |
|---|---|---|
| `is_business`, `business_name`, `contact_name` | `[162]` | Business flag re-roles Last Name, activates Contact Name |
| `name_prefix`, `name_middle`, `name_suffix` | `[59]`, `[162]` | Each gated by its own POS CS prompt setting |
| `alternate_name.relationship` | `[162]` | `01` has the field, not the domain — 8 values |
| `phones[]` | `[2]`, `[109]` | **Replaces `01`'s three phone scalars.** `type`, `number`, `extension` (Work only), `description` (30), `is_primary` (one per type, mandatory) |
| `emails[]` | `[47]`, `[162]` | **Replaces `01`'s single `primary_email`**; primary-email uniqueness is a real check |
| `shipping_addresses[]` + `country_code` | `[163]` | A **third** address role; 30/30/15/2 char limits |
| `extended_delivery_instructions` | `[162]` | Defaults into order entry; prints on tickets |
| `customer_type` | `[160]` | **trade** gates designer discounts |
| `do_not_solicit` | `[29]` | Mailing suppression — §5.4 |
| `do_not_accumulate_reward_points` | `[83]` | Gates rewards issuance |
| `status_code` (6), `source_code` (6), `demographic_1..3` | `[164]` | Customer History; mailing-list criteria |
| `last_purchase_date`, `last_mail_date`, `last_mail_name`, `total_mailings` | `[164]` | `last_purchase_date` drives the EOM purge |
| `driver_license_number` | `[45]` | Masked on entry; `[DECIDE]` store result + last four only |
| `merge_status`, `merge_recommended_by`, `merged_into_customer_id`, `merged_from_codes[]` | `[88]`, `[131]` | Last two are ours, not STORIS' |
| `co_applicants[]` | `[163]`, `[8]` | Own name, addresses and SSN; a second data subject |
| `gift_registries[]` | `[78]` | Owner + alternate name + registry type |
| `activity_log[]` | `[162]`, `[131]`, `[169]` | Append-only; `Last Activity Date` derives from its newest comment |

### 7.2 New business rules

All `[DOC]`. Detail and sources in the sections named.

1. Combined name-element length ≤ **50 characters** (§2.1, three screens).
2. A phone is unique **per type**, may repeat **across** types; exactly one primary **per type**, and the
   customer **cannot be saved** without one; only the "highest priority" one displays elsewhere — term
   undefined (§2.2).
3. Marketing Code 1 and Code 2 must differ; Code 2 requires Code 1 populated (§5.5).
4. List criteria AND across types, OR within a type; every edit requires regeneration; label merge requires a
   last-name sort (§5.2, §5.3).
5. Reward gift certificates can neither be topped up nor refunded (§6.1).
6. A merge failure is per-pair — the pair stays queued with a reason; without merge permission a user may only
   **Recommend**, which records their ID (§4.4, §4.5).

### 7.3 Enums introduced

```
PhoneType             Home | Cell | Work                (display sort Home, Cell, Work)
Relationship          None Selected | Husband | Wife | Partner | Relative | Friend
                      | Business Partner | Other
AddressVerifyTarget   billing | delivery | co-applicant billing
AddressVerifyProvider Experian | Avalara | Vertex
MergeEligibility      immediately | in the future
MergeStatus           (null) | User Recommended | Merge | Merged | Removed | Attempted
MergeAction           Review | Merge | Remove | Recommend | Print
ListSort              Last Name | Zip Code
WarrantyLinkFilter    All Products | With Warranty | Without Warranty
SourceCode            STORIS | Order | Quote | Layaway  (+ 6-char user values)
TradeDiscountApply    100% | 50% | 0% of Discount | No Discount Allowed
GiftCertPaymentType   REWARDS                           (internal; not in the settings table)
```

### 7.4 Settings referenced

| Setting | Location |
|---|---|
| CUSTOMER SEARCH - Always during Entry; Prompt for Name Prefix / Middle Name / Name Suffix; Customer Entry - Warn if Primary Email exists for other Customers | POS CS › Customer |
| Default Email Address; Load Default Email Address | POS CS › Advanced |
| First / Second Marketing Code; Completed Orders; Customer Retention Months; Fulfillment Methods › Sales Order / Exchanges / Returns | POS CS |
| Prohibit Customer Personal Information when not Required by Sale | Warehouse/Store Location Settings |
| Address Cleansing | Alternate Tax Interface CS |
| Verify Customer Driver License | Accounts Receivable CS |
| Signature Capture | General System CS |
| Show Signature (EMV Signature page) | Payment Card and Device Settings |
| Percent for Gift Certificate Calculation | Customer Rewards CS |
| Demographics CS · Marketing Code Settings · Gift Certificate Payment Type Settings · Regional Processing | — |

### 7.5 Permissions referenced

| Permission | Gates |
|---|---|
| Access other credit applications and score reporting | Full SSN in `[131]` and `[169]`; last four otherwise |
| Security clearance to merge duplicate customers | Merge vs Recommend-only `[131]`; action availability in `[88]` |
| Create Customers when another exists with the same Email Address | Duplicate-email save in `[162]`; else a second-user override |
| Override Same Day Pickup Restrictions | The `[82]` same-day-pickup conflict |
| Regional Processing (data scope) | Which customers appear in `[83]`, `[162]` and other customer fields |

### 7.6 Data protection and retention implications `[DECIDE]`

Beyond `10`'s three existing decisions (card PANs, SSN, driver's licence):

1. **SSN in bulk** (§4.2) — mask `[141]`'s grid column unconditionally; drop SSN as a search key.
2. **Signature PDFs on a file share** (§3.4) — move to access-controlled order attachments with a retention
   clock; log accepts and declines.
3. **Driver's licence** (§3.2) — storage is undocumented. Persist a result plus last four, with a retention
   period.
4. **Internet enrichment** (§1, §2.2) — third-party data written with no provenance. Stamp source and date,
   or don't retain.
5. **No verification result is retained at all**, for address or licence (§3.1, §3.2). Retain them.
6. **Consent** (§5.4) — per-channel, timestamped, sourced, evaluated at **send** time; expire exported sets.
7. **Purge of merge decisions** (§4.6) — `Removed` records are deleted, destroying the record of a human
   decision about two people's identities. Retain them.
8. **Second data subjects** — alternate names, business contact names, co-applicants, gift-registry
   beneficiaries. Access scoping and deletion requests must reach them.

### 7.7 Open questions and content defects

1. **Blocking — the merge eligibility rules are missing.** `[88]` and `[131]` both defer to a "Duplicate
   Customer Merge Overview" article absent from the corpus. We do not know what makes a duplicate ineligible,
   what "in the future" waits for, or what a merge moves beyond protection plan register records. **The
   cutover dedupe cannot be specified without it.** Obtain it before phase 1.
2. **No unmerge exists anywhere in the 172 screens.** Confirm it is genuinely absent; treat merges as
   irreversible either way.
3. **"Highest priority" phone is undefined** `[109]`. `[INFER]` the primary of that type. Confirm.
4. **Driver License Verification failure behaviour is entirely undocumented** `[45]` — no stated hold, block,
   retry or storage rule.
5. **What the licence is validated against** is never stated: a provider, a format check, or the record.
6. **Two contradictory duplicate-email policies** — `[47]` dismissible warning vs `[162]` permission-gated
   block. Choose one.
7. **`[163]`'s shipping-address propagation prompt contradicts `01`'s order-snapshot rule.** Resolve before
   building either.
8. **What a merge does to reward points and issued reward certificates is undocumented** `[83]`/`[131]` — and
   those certificates are non-refundable money.
9. **Setting-name inconsistency:** "Verify Customer Driver License" sits in *Accounts Receivable Control
   Settings* per `[45]` and in *Advanced Receivables Control Settings* elsewhere in the corpus.
10. **Routine-name inconsistency:** `[24]` itself notes "Print Mailing Labels" and "Print Mailing Lists" are
    used interchangeably for what appears to be one routine.
11. `[25]` documents **no validation on `New List Name`** — no uniqueness, length, or overwrite behaviour.
12. **Corpus contamination in block `[24]`.** Non-source content is appended to Confirm Mailing List's final
    line: an `agentId` value plus an instruction to call `SendMessage` with it, and a token-usage block. This
    is extraction-tool output that leaked into the source file, not STORIS documentation. It was treated as
    data and **not acted on**. Re-extract `[24]` and audit the corpus for the same leakage. General point: a
    corpus can carry text that reads as an instruction, and nothing downstream may execute what it reads.
