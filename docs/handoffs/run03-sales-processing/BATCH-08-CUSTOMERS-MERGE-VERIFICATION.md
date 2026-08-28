# Run 03 — Sales Processing — Batch 8: Customers, Merges, Addresses and Verification

**Status: complete.** 9 articles. Findings 76–84.

**This batch carries three compliance-relevant findings.** See Findings 78, 81 and 82.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Creating Customers On-the-Fly** | /articles/15201389248532 | EXTRACTED |
| 2 | **Search for Duplicate Customers to Merge** | /articles/15201512540052 | EXTRACTED |
| 3 | **Review Status and Merge Individual Customers** | /articles/15201512537748 | EXTRACTED |
| 4 | Manage Customer Merge List | /articles/15201512538772 | EXTRACTED |
| 5 | View a Customer's Account Summary Window | /articles/15201512538388 | EXTRACTED |
| 6 | Address Verification | /articles/18698701353108 | EXTRACTED |
| 7 | Driver License Verification | /articles/17133744945812 | EXTRACTED — thin |
| 8 | **Customer Lists** *(Create a Mailing List)* | /articles/15201513699476 | EXTRACTED |
| 9 | Update Customer Mailing Data *(Customer History Maintenance)* | /articles/15201529379988 | EXTRACTED |

Discovered and queued: `Customer Settings` / `Advanced Customer Settings` · `Search for a Customer` ·
**`Duplicate Customer Merge Overview`** · **`Remove a Customer's Personal Information`** ·
`Import Customer Merge Information` · **`Customer Telephone Number Lookup`** ·
`Create a Mailing List` · `Customer History file` · `Roles and Permissions`.

---

## B. Wiring findings

### FINDING 76 — Customers can be created from almost any customer field, and the code is derived from the order number
Invariant:  "**Most Customer fields in STORIS allow you to create new customers 'on-the-fly'**, meaning
            you can create a new customer without having to exit the order-entry program."
Two paths (verbatim): typing a name into the `Customer Number` field and pressing Enter/Tab — "**The
            system uses this as the new customer's last name**"; or the Action button, whose behaviour
            depends on **`CUSTOMER SEARCH - Always during Entry`** in POS Control Settings.
Code assignment (verbatim): "The system automatically uses the name entered in `Customer Number` field
            as the last name and **also assigns a customer code based on the number of the order.**"
Edit restriction (verbatim): "**to edit the data, you must exit the current routine and open the record
            in the `Customer Settings`.**"
Exception:  "**Some routines such as the `Enter a Customer Payment/Refund/Gift Certificate` routine
            require you use the Action button** to enter customers on-the-fly."
Evidence:   Creating Customers On-the-Fly, /articles/15201389248532
Maps to:    **NEW — and it explains the duplicate problem the rest of this batch exists to solve**

> **Customer codes are derived from the order number of the transaction that created them.** So the
> primary key of a customer record encodes an accident of when they first bought something — which is
> harmless until you merge, and then it means neither code is more canonical than the other.
>
> More importantly: **creating a customer is the path of least resistance from almost every screen**,
> and the search that would prevent duplicates is optional (`CUSTOMER SEARCH - Always during Entry`).
> That is precisely why STORIS ships a four-screen merge subsystem. **The duplicate problem is
> structural, not operator error.**

### FINDING 77 — Customer merge is a four-screen subsystem with an eligibility model and a recommend state
Screens:    `Search for Duplicate Customers to Merge` → `Review Status and Merge Individual Customers` →
            `Manage Customer Merge List`; plus `View a Customer's Account Summary Window` for
            eligibility detail.
Three-state action (verbatim): "**merge individual customers, recommend them for merging, or remove a
            recommend status**… **If you have permission via your security settings you can choose to
            merge the customers immediately. If you do not have permission, you can recommend customers
            for merging at a later time.**"
Fields:     **`Eligible` · `Status` · `Current Action`** · Recommend · Merge · Remove
Batch actions: "check the box for one, multiple, or all customers listed and then select the action to
            take: **`REVIEW`, `MERGE`, `REMOVE`, or `PRINT`**."
Protection plans (verbatim): "**When working with protection plans, the protection plan register records
            are updated with the merge to customer number.**"
Evidence:   Review Status and Merge Individual Customers, /articles/15201512537748;
            Manage Customer Merge List, /articles/15201512538772
Maps to:    **NEW**

> A **two-tier workflow**: staff without merge permission can *recommend*, and someone with it disposes
> of the queue in bulk. That is a well-judged design for a destructive, irreversible operation, and it
> is the audit's sixth queue-and-clear pattern.
>
> **Eligibility is computed, not assumed** — the `Eligible` flag and the account summary exist to answer
> "can these two safely become one". The only downstream effect the docs name explicitly is **protection
> plan register records being repointed**, which raises the obvious question of what *else* moves — see
> section H.

### FINDING 78 — Duplicate search is by name, phone, email **and social security number**
Invariant (verbatim): "search for duplicate and merge-to customers by **last name, phone number, email
            address, and/or social security number**. You can further narrow your search by zip code."
Displayed on both the merge review and account summary screens: **`Social Security #`** alongside
            `Last Activity Date` · `Lifetime Sales` · `Open Orders` · `Deposits` · **`Open Item` ·
            `Revolving` · `Installment`**.
Evidence:   Search for Duplicate Customers to Merge, /articles/15201512540052;
            Review Status and Merge Individual Customers, /articles/15201512537748;
            View a Customer's Account Summary Window, /articles/15201512538388
Maps to:    **compliance — extends run 1's flagged item**

> Run 1 flagged **SSN as a search key and step-up token** as one of four compliance items. **This is a
> second, independent instance**: SSN is a duplicate-search criterion in Sales Processing and is
> **displayed on two comparison screens** beside financial balances.
>
> The screens are doing something reasonable — you need strong identity matching before merging two
> customers' credit histories — but the pattern is now established across two modules, and any rebuild
> should decide deliberately whether SSN is a matching key, a stored attribute, or neither. It belongs
> in the cutover compliance list alongside run 1's four and batch 4's driver's licence capture.

### FINDING 79 — The merge comparison surfaces all three receivables ledgers side by side
Fields (both screens, verbatim): `Customer Code` · Name · Address · Phone Numbers · Email ·
            `Social Security #` · **`Last Activity Date`** · **`Lifetime Sales`** · **`Open Orders`** ·
            **`Deposits`** · **`Open Item`** · **`Revolving`** · **`Installment`**
Evidence:   View a Customer's Account Summary Window, /articles/15201512538388;
            Review Status and Merge Individual Customers, /articles/15201512537748
Maps to:    **connects to run 1's two-ledger architecture**

> Run 1 established that STORIS runs **two coexisting AR ledgers** — long-term and open-item — joined by
> monthly cycling, plus installment and revolving as distinct credit subsystems. **This screen shows
> `Open Item`, `Revolving` and `Installment` as three separate balances on one customer**, which is the
> clearest confirmation from the sales side that a customer can carry money in three places at once.
>
> That is also what makes merging consequential: **combining two customers combines three ledgers, open
> orders, deposits and lifetime sales**, and the docs describe the eligibility check without stating the
> rules. Anyone planning a data migration should treat merge history as a first-class concern.

### FINDING 80 — Address verification runs through one of three licensed external services
Invariant:  "**STORIS supports address verification and cleansing with `Experian`, `Avalara`, and
            `Vertex` services. Your address verification service must be licensed and active. If using
            Avalara or Vertex, activate address cleansing in the `Alternate Tax Interface Control
            Settings`.**"
Purpose (verbatim): "identify and select **alternate matching addresses** to ensure accuracy **for
            delivery and credit reporting purposes**."
Fields:     **`Address Type`** · **`Delivery Same as Billing Address`** · Address 1/2 · City · Zip ·
            State · grid of candidate matches.
Evidence:   Address Verification, /articles/18698701353108
Maps to:    **NEW — second external real-time dependency in the audit**

> Run 2 found the Ashley ATP web service as the first external real-time dependency. **This is the
> second**, and it is more entangled: **the same vendors that do tax (Avalara, Vertex) also do address
> cleansing**, configured from the tax settings file. So enabling an Alternate Tax Interface — which
> batch 1 showed removes line-level exemption and subtotal discounts — **also changes address handling.**
>
> The stated purposes are **delivery and credit reporting**, which ties address quality to Metro 2
> reporting (run 1) as well as to routing (batch 3's zip-driven route codes). A bad address is a
> logistics problem *and* a credit-bureau problem.

### FINDING 81 — Customer records can be populated from an internet lookup
Invariant (verbatim): "When creating a new customer record in the `Customer Settings`, you may use the
            **`Customer Telephone Number Lookup`** to help find customer information **using the
            Internet. If information is found, the customer record is populated with that
            information.**"
Evidence:   Creating Customers On-the-Fly, /articles/15201389248532
Maps to:    **compliance — NEW**

> **A phone number typed at point of sale can be resolved against an internet service and the returned
> personal data written into the customer record.** The article gives no service name, no consent step,
> no indication of what fields are populated and no audit statement.
>
> This is a third external dependency, and unlike ATP and address verification it is **enriching
> personal data from a third party at the moment of first contact**. For a business subject to
> California privacy law — which LA Mattress is — that is worth an explicit decision rather than
> inheritance. **Recorded as a compliance item; the documentation is too thin to assess it further.**

### FINDING 82 — Mailing lists are built from twenty criteria including three user-defined demographics
Criteria (verbatim, complete): `Status Code` · `Source Code` · **`Demographics` (3 user-defined
            options)** · `Last Purchase Date` · `Last Mail Date` · `Number of Mailings` ·
            `Last Mail Name` · `Selling Store` · `Zip Code` · `Product` · `Group` · `Category` ·
            `Brand` · `Mailing List Name` · **`Product not Purchased`** · `Selling Price` ·
            `Marketing Code 1` · `Marketing Code 2`
Restrictions: `Equal-To` *(worked example: "all customers who answered 'B' to the 'Emails &/or text?'
            demographic question")* · Start and Ending Ranges · **`Warranty linkage`** ·
            **`Email Only`** · `List Information` (street address, email, or both) · Name of Last Mailing
Export:     "**export the list to an Excel® file or an ASCII file**… you can also use the `Report
            Builder` to create customer lists."
Evidence:   Customer Lists, /articles/15201513699476
Maps to:    **compliance — NEW; and a fifth export path**

> **`Product not Purchased` is a real targeting primitive** — select customers who bought X but not Y —
> which is genuinely useful merchandising. So is `Warranty linkage` as a segment.
>
> Two concerns. The worked example shows a **demographic question capturing communication consent**
> ("Emails &/or text?") stored as a free-form demographic answer rather than a structured consent flag —
> and the same routine offers `Email Only` filtering, so **consent and targeting live in the same
> uncontrolled field.** And the whole list **exports to Excel or ASCII** with no stated permission,
> adding a fifth uncontrolled export path to the four run 2 found. A customer list containing names,
> addresses and email addresses leaving the system unlogged is a real exposure.

### FINDING 83 — Mailing data lives in a separate Customer History file with its own maintenance screen
Invariant:  "Use this screen to maintain **selected header information for customer records stored in
            the `Customer History` file.** The system uses this information **in mailings and
            reporting.**"
Fields:     Customer Code · **`Customer Type`** · Full Name · Address · Phones · Email ·
            **`Marketing Code 1` / `Code 2`** · **`Status Code`** · **`Source Code`** ·
            **`Customer Demographic Information`** · `Purchase` · `Mailing` · **`Mailing Name`** ·
            **`Total Mailings`**
Evidence:   Update Customer Mailing Data, /articles/15201529379988
Maps to:    **NEW — a fourth named data store in the audit**

> After `BTA`, `PRODUCT.HISTORY` and the completed order history file (run 2), **`Customer History` is
> the fourth named store**. It holds a **denormalised copy of the customer header** — name, address,
> phones, email — for mailing and reporting, maintained through its own screen.
>
> That means **customer contact details exist in at least two places**, and this article describes
> editing the copy. Nothing states whether the two synchronise. For a migration that is a concrete
> risk: extracting customers from one file may miss corrections made in the other, and a merge (Finding
> 77) may or may not repoint the history record. **Neither question is answered anywhere read so far.**

### FINDING 84 — Driver's licence verification is a one-field screen with a settings-gated validation
Invariant:  "Use this routine to enter the driver's license for the associated customer. **This process
            validates the driver's license if the setting, `Verify Customer Driver License` in
            `Accounts Receivable Control Settings` is enabled.**"
Field:      `Driver License Number` *(one field)*
Cross-ref:  triggered on first application of a revolving receivables financing payment code; **failure
            places the order on `F5` credit hold** *(batch 1 F10)*. Also captured independently on the
            `Check Entry Window` *(batch 4 F44)*.
Evidence:   Driver License Verification, /articles/17133744945812;
            Enter a Sales Order, /articles/15201409256084
Maps to:    **compliance — consolidates two capture paths**

> The screen itself is trivial; **the wiring around it is not.** Driver's licence numbers enter STORIS
> from two unrelated paths — **cheque payment and revolving credit application** — and only one of them
> validates, gated by a Receivables setting. What "validates" means is not stated: format check,
> external service, or match against a stored value.
>
> Combined with SSN (Finding 78), the customer record accumulates **two government identifiers**, and
> the audit has now found neither a retention statement nor a purge routine for either. `Remove a
> Customer's Personal Information` appeared as a related article and is queued — **it is the one place
> a deletion capability might be documented.**

---

## C. Screen and field inventory

**Search for Duplicate Customers to Merge** — two symmetric panels, **DUPLICATE CUSTOMER** and
**MERGE TO CUSTOMER**, each: Last Name · Phone · Email · **SSN** · **Narrow by Zip Code** · Search ·
grid *(with Action buttons previewing merge eligibility)*. **`Same as Duplicate`** on the merge-to panel.

**Review Status and Merge Individual Customers** — *MERGE DETAILS*: **`Eligible` · `Status` ·
`Current Action`** · Recommend · Merge · Remove. *INFORMATION / DUPLICATE / MERGE TO*: Customer Code ·
Name · Address · Phone Numbers · Email · **Social Security #** · **Last Activity Date** ·
**Lifetime Sales** · **Open Orders** · **Deposits** · **Open Item** · **Revolving** · **Installment** ·
Previous / Next.

**Manage Customer Merge List** — grid with checkboxes · **REVIEW · MERGE · REMOVE · PRINT**.

**View a Customer's Account Summary Window** — same comparison fields as above, single customer.

**Address Verification** — **`Address Type`** · **`Delivery Same as Billing Address`** · Address 1 ·
Address 2 · City · Zip Code · State · grid of alternate matching addresses.

**Driver License Verification** — `Driver License Number`.

**Customer Lists** *(Create a Mailing List)* — **`Criteria Name`** with eighteen criteria (Finding 82) ·
restrictions: Equal-To · Start/Ending Ranges · **Warranty linkage** · **Email Only** ·
**List Information** (street, email, or both) · Name of Last Mailing. Exports to **Excel or ASCII**.

**Update Customer Mailing Data** *(Customer History Maintenance)* — Customer Code · **Customer Type** ·
Full Name · Address 1/2 · City ST Zip · Home Phone · Work Phone · Ext · Email Address ·
**Marketing Code 1 / Code 2** · **Status Code** · **Source Code** ·
**Customer Demographic Information** · Purchase · Mailing · **Mailing Name** · **Total Mailings** · Save.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| **`CUSTOMER SEARCH - Always during Entry`** | POS Control Settings | Whether the duplicate-preventing search runs before customer creation |
| `Verify Customer Driver License` | **Accounts Receivable Control Settings** | Whether the licence is validated; failure ⇒ `F5` hold |
| `Address Cleansing` | **Alternate Tax Interface Control Settings** | Address verification via Avalara or Vertex |
| address verification licence | (licensing) | **Experian**, Avalara or Vertex |
| `Status Code` / `Source Code` / demographics | **Update Customer Mailing Data** | Mailing-list segmentation values |
| `Active Member` | Advanced Customer Settings | Membership state; **manually** maintained on returns *(batch 7)* |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| merge authority *(unnamed)* | "your security settings" | **Merging immediately** vs only recommending |
| `Change Taxable Settings` | System Security | Customer tax exemption fields *(batch 1)* |

> The merge permission is referenced but **not named** in any article read. Given the operation is
> destructive and irreversible, identifying it is a cutover priority.

---

## F. State machines and enumerations

**Customer creation paths (3)** — typed into a Customer field · Action button · **internet lookup
population**.
**Customer code origin** — derived from the order number that created the customer.
**Merge states** — eligible / not eligible · **recommended** · merged · recommend removed.
**Merge batch actions** — REVIEW · MERGE · REMOVE · PRINT.
**Customer balances shown at merge (3 ledgers)** — Open Item · Revolving · Installment *(plus Deposits,
Open Orders, Lifetime Sales)*.
**Address verification services** — Experian · Avalara · Vertex.
**Named data stores in the audit (4)** — `BTA` · `PRODUCT.HISTORY` · completed order history ·
**`Customer History`**.
**Export paths (5)** — Excel · HTML · Report Builder data files · Data Warehouse · **mailing-list
ASCII/Excel**.
**Government identifiers captured** — SSN *(merge search, display)* · driver's licence *(cheque
payment, revolving credit)*.

---

## G. Sequencing rules

1. A customer typed into a Customer field triggers the search screen, then Customer Settings.
2. The new customer's code is assigned from the creating order's number.
3. Editing a just-created customer requires exiting the entry routine.
4. Merge eligibility is evaluated before merging; without permission the user may only recommend.
5. Merging repoints protection plan register records to the merge-to customer.
6. Address cleansing requires a licensed service, and for Avalara/Vertex an ATI setting.
7. Driver's licence validation runs only when the Receivables setting is enabled; failure ⇒ `F5`.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Duplicate Customer Merge Overview`** — the conceptual article behind this whole subsystem, and the
  most likely place the merge rules are stated. **Read first in the next sweep.**
- **`Remove a Customer's Personal Information`** — the only candidate for a documented deletion or
  right-to-erasure capability anywhere in the audit. **High priority given Findings 78, 81 and 84.**
- `Customer Settings` / `Advanced Customer Settings` — the customer master itself, referenced from every
  batch of this run.
- `Search for a Customer` · `Import Customer Merge Information` · `Create a Mailing List` ·
  **`Customer Telephone Number Lookup`**.

**Documented but ambiguous**
- **What a merge actually moves.** Only protection plan register records are named. Orders, deposits,
  three ledger balances, credit applications, mailing history and lifetime sales are all displayed as
  comparison data — **nothing says what happens to them.**
- **What makes a customer `Eligible`** — the flag exists, the rules do not.
- **Whether `Customer History` synchronises with the customer master**, and whether a merge repoints it.
- **What the `Customer Telephone Number Lookup` service is**, what it returns, and whether the lookup is
  logged or consented.
- **What "validates" means** for a driver's licence — format, external service, or stored match.
- **Whether SSN and driver's licence numbers are retained, masked or purgeable.** No article read so far
  states a policy.
- **Whether merges are reversible or audited** — no undo, log or report is mentioned.
- **`Customer Type`** on the history record — an unenumerated classification.
- **`Purchase` and `Mailing`** as bare field names on the history screen.

**Inferences (not in section B)**
- The unnamed merge permission is presumably in Sales or System Security; no article names it.
- `Customer History` is presumably maintained by a nightly process from the customer master; the article
  describes only manual editing.
- The demographic "Emails &/or text?" example is presumably being used as a consent record; the docs
  treat it purely as a segmentation field.

---

## I. Unknown unknowns

- **Customer codes derived from the order number** that created them.
- **A four-screen merge subsystem** with computed eligibility and a recommend-then-approve queue.
- **SSN as a duplicate-search key**, displayed beside financial balances on two screens.
- **Three receivables ledgers shown per customer** — open item, revolving, installment.
- **Address verification through Experian, Avalara or Vertex**, configured from the tax settings.
- **An internet lookup that populates customer records** from a phone number.
- **`Product not Purchased`** as a mailing-list targeting primitive.
- **Communication consent stored as a free-form demographic answer.**
- **Customer lists exporting to Excel/ASCII** with no stated control.
- **A separate `Customer History` file** holding a duplicate of the customer header.
- **Driver's licence numbers entering from two unrelated paths**, only one validated.
- **No documented deletion, retention or audit** for either government identifier.

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| On-the-fly customer creation | Creating a customer from within an entry routine; code derived from the order number |
| Merge-to customer | The surviving record in a customer merge |
| Recommend | Merge queue state for users without merge authority |
| Eligible | Computed merge-eligibility flag; rules undocumented |
| Customer History file | Separate store holding a copy of the customer header for mailings and reporting |
| Status Code / Source Code | Mailing segmentation values maintained in Update Customer Mailing Data |
| Product not Purchased | Mailing-list criterion selecting customers who did *not* buy something |
| Customer Telephone Number Lookup | Internet service populating a new customer record from a phone number |
| Address cleansing | Verification via Experian, Avalara or Vertex; configured in ATI settings |

---

## Contract adjudication — batch 8

| Contract | Verdict | Basis |
|---|---|---|
| **W-050** | **CONFIRMED, with a gap** | Merge authority is permissioned but the permission is never named (F77) |
| **W-012** | **relevant** | `Last Activity Date` and mailing history are the customer-side date model (F79, F83) |
| **W-052 / W-053** | **not documented in this batch** | Merge's effect on three ledger balances is displayed but not specified |
| **W-055 / W-056** | **not relevant to this batch** | — |
| **W-061** | **not relevant to this batch** | — |

---

## Next — batch 9: financing applications and providers
