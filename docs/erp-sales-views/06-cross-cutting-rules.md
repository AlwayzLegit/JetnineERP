# 06 — Cross-Cutting Rules

Rules that apply across the whole section. Implement each **once**, centrally, rather than
per-screen as STORIS does.

---

## Regional Processing — the visibility model

`[SETTING]` Master switch: *Regional Processing* in **General System Control Settings**.

The rule, repeated in some form in roughly 40 of these articles: **a user sees only the customers
and locations they have access to.** Access comes from the **Location Restrictions** tab in Create a
User / Create a User Group.

Consequences that appear throughout:
- Every Location/Store/Warehouse field lists only permitted locations.
- Every Customer field and search returns only permitted customers.
- `[GATE]` **District-level reporting requires that the user NOT be location-restricted** — a
  district filter is meaningless for someone pinned to one store.
- `[GATE]` Users restricted by region or district **cannot sort Report Open Sales Order Summary by
  district/region**.
- Report Merchandising Activity limits Region selection to permitted regions **and** changes its cost
  calculation based on the user's login location when multiple regions are selected.

**Documented exceptions — both deliberate, both worth porting:**

| Exception | Where | Why |
|---|---|---|
| **View Customer's Historical Purchases ignores Regional Processing** for completed orders | Article 124 | You must be able to process a return or exchange for anything the company sold, wherever it was sold |
| Transfers may specify an inaccessible **shipping** location if the user has access to the **To** location | Printing handoff, `06` | Receiving stores need to pull from warehouses they don't otherwise see |

Several reports also point at *"Regional Processing - Reporting Rules"* and its **Report Exceptions**
section for report-specific behavior — Report Open Sales Order Detail, Report Open Sales Order
Summary, Report Written Sales Summary, Report Sales Orders with Delivery Dates in Jeopardy. **That
document is not in this section.** Retrieve it before implementing report scoping; it likely
contains rules this handoff does not cover.

**Recommendation:** one query-scoping layer applied at data access, driven by the user's location
and region grants, with a small, explicit, tested list of exemptions. The per-screen repetition in
the source is the signature of a rule applied ad hoc — which is how exceptions become accidents.

---

## Sales-security scoping — who can see whose numbers

A second, independent visibility axis, orthogonal to Regional Processing.

`[SETTING]` **Sales Security Access** (Advanced page, POS Control Settings) turns it on.
`[PERM]` **View All Sales Information** (Create a User/Group Actions - Sales Security) then decides
the scope: **own sales data only**, **the login store's data**, or **all data**.

Applies to: View and Manage Open Order Lines, View and Manage Open Orders, Report InTouch Analysis,
and — by extension — anything exposing salesperson-level dollars.

Related gates:
- `[SETTING]` *View Salesperson's Sales Activity* (Advanced page, POS Control Settings) controls
  whether the four sales-dollar totals appear on View Salesperson Activity at all.
- `[SETTING]` *Display Profit Dollars* (POS Control Settings) controls whether MTD Profit on View
  Summary of Sales Activity shows as dollars, as a percentage, or not at all.
- `[PERM]` CRM-InTouch access levels (Store Manager / District Manager / Corporate) determine whether
  a user may leave the Salesperson filter blank in Manage Sales Leads.
- `[PERM]` *View All Revolving Activity - View Credit Status Hold Codes* — without it, Credit Status
  Results shows **"See Cashier"** rather than hold detail.

**Recommendation:** model as a `data_scope` on the user (`self` | `store` | `region` | `all`) applied
alongside the location scope, with profit and commission visibility as separate flags. Two axes, both
enforced in one place.

---

## The permissions surface

Named permissions appearing in this section, by settings file. This is the compliance surface.

**Create a User/Group Actions — Sales Security**
- View All Sales Information
- View and Manage Open Orders - Maintain Sales Orders / - Maintain Exchanges / - Maintain Returns /
  - Maintain Transfers
- Maintain a Sales Order (Return/Exchange, etc.) from View Customer Activity
- Create Customers with another exists with the same Email Address

**Create a User/Group Actions — Receivables Security**
- View All Revolving Activity - View Credit Status Hold Codes
- View All Revolving Activity - Request Credit Information
- View All Revolving Activity - Request Credit Review
- View All Revolving Activity - Add Insurance
- View All Revolving Activity - Enter a Sales Order
- View All Revolving Activity - Take a Payment
- View All Revolving Activity - Adjust Revolving Plans
- Access employee credit applications and score reporting
- Access other credit applications and score reporting
- View Encrypted Gift Card PIN
- (unnamed) permissions for viewing credit requests where you are not the referenced salesperson

**Create a User/Group Actions — Service Security**
- Create a Service Order from Other Processes

**Create a User / Create a User Group**
- Location Restrictions (tab)
- CRM - InTouch (Security tab), with Store Manager / District Manager / Corporate levels
- Extended Security → Search for vendors, view vendor name and model numbers

Cross-referenced from the Exchange handoff (`06`) and the Printing handoff (`03`): the same user
files carry order-entry and print permissions. **Build one permission catalog for the whole ERP**, not
one per subsystem.

---

## Control settings referenced

Grouped by file. Marked *keep* / *simplify* / *drop* as a recommendation.

**Point of Sale Control Settings**

| Setting | Effect | Rec |
|---|---|---|
| Sales Security Access (Advanced) | Enables sales-data scoping | keep |
| View Salesperson's Sales Activity (Advanced) | Shows salesperson sales totals | keep |
| Display Profit Dollars | Profit as $, %, or hidden | keep |
| Sort Report By (Pricing and Commissions) | Shapes Report Sales Commissions | keep |
| Report Type (Profit Margin / Customer Name) | Commission report columns | simplify |
| Customer Retention Months (Customer) | Purges the Customer Activity Log | keep |
| Completed Orders (retention) | Bounds historical purchase inquiries | keep |
| Past Due Days / Last Activity Days | Drive C2/C3 credit holds | keep |
| Fill Layaway Orders (Inventory) | Gates layaway back-order options **and** the Layaway Reserved column | keep |
| Default Display of Vendor Model in Point of Sale | Grid default | simplify |
| CUSTOMER ENTRY - Prompt for Middle Name / Validate Name Prefix / Prompt for Name Suffix | Enable name fields in search and entry | simplify |
| CUSTOMER SEARCH - Phone Number First / Search Phone Number First | Phone-first customer creation | keep |
| Always Search for Customer | Search before Customer Settings | simplify |
| Search Information Required prior to creating a New Account | Required search before create | keep |
| Prohibit Customers with Duplicate Email Address | Duplicate-email gate | keep |
| Activate Customer Rewards Program | Shows rewards fields | keep |
| ATP Calculation: Include New Purchase Orders / Include Stock Transfers / Include Unlinked Purchase Orders | **All three off = ATP disappears from the UI** | keep |
| Default display of ATC date in Point of Sale | ATP vs ATC default | simplify |
| Fulfillment Methods - Sales Orders | Cart fulfillment default | keep |
| Next Transaction Number | Auto-numbering | simplify |
| Exception preferences (Credit Hold, Inventory, Profit and Costs, Delivery, Pricing and Commissions tabs) | Which exception reports exist | keep |

**Other files**

| File | Settings |
|---|---|
| General System Control Settings | Regional Processing; Mapping Interface |
| Accounts Receivable Control Settings | Audit All Customer Activity; Number of Months History; Daily Receipts Retention Months |
| Financing Control Settings | Number of Aging Days; Multiple Customers per Finance Account |
| Finance Provider Settings | Available Credit Inquiry; CREDIT VIEW - Activate the Online Available Credit Information Inquiry; Auto-Pay Post Bank |
| Financing Payment Plan Settings | Valid Approval Days |
| Credit Application Control Settings | For ___ Days Report is Valid; Credit Line Must Be Established / Application Date / Credit Report Date / Zero Balance Date |
| Alert Code Settings | C7 / C8 hold messages |
| Revolving Receivables Control Settings | Sort Reports By; Sort Customer By; Apply Insurance; Single Prompt for Insurance Change |
| Revolving Payment Plan Settings | Plan location and credit-score restrictions |
| Account Statement Cycling Control Settings | Cycle Schedule; Default Due Day; Auto Assign Due Date |
| Warehouse/Store Location Settings | Due Day; Ship From Location; Automated & Manual POS Numbers |
| Advanced Customer Settings | Due Day; Store Assignment; Account Comments; Inactive Date |
| Membership Reward Settings | Number of Days Before Reward Gift Certificate Can Be Used |
| Customer Rewards Control Settings | Number of Days Gift Certificate Valid |
| Gift Certificate Payment Settings + General Ledger Assigned Account Settings | GL wild-carding for gift certificates |
| Inventory Control Settings | Add Vendor Model to Reports |
| Vendor Settings | Vendor Inventory Quantities – Update Quantities |
| Shopping Cart Control Settings | Allow Changes to Default Price |
| Sales Lead System Control Settings | Salesperson for Unassigned Contacts |
| Activity Reason Settings | Lead close reasons |
| Order Source Settings | Order source codes |
| Status Code Settings | Closed Without Completion |
| Reason Code Settings | Reason Usage Code = Credit Application |
| Receivables Activity Type Settings | Renames receivables activity descriptions |
| Phantom Process Settings | Maximum Number of Concurrent Phantoms |
| Address Exception List Settings | Street suffixes ignored in customer search |
| Track Settings Activity | Which files feed the Customer Activity Log |
| Dynamic Tab Settings / Dynamic Escape Settings | DTS composition; right-click menus |

---

## Credit hold codes — collect these in one place

Hold codes surface across at least six screens and reports here and in the Exchange handoff, each
documenting a fragment. Consolidated:

| Code | Meaning | Source |
|---|---|---|
| `C2`, `C3` | Past-due / inactivity holds, from *Past Due Days* and *Last Activity Days* | Credit Status Results |
| `C6` | Credit decision pending; visible in Review Pending Credit Requests until approved **and** a credit limit is established | Exchange handoff `05` |
| `C7` | Account assigned to a collector | Alert Code Settings |
| `C8` | Account closed to new activity | Alert Code Settings |
| `D2` | A sales-order credit hold; shows as `D2 - Approved` between approval and the next EOD | Report Open Orders on Credit Hold |
| `E1` | Exchange on hold at entry, pending approval | Exchange handoff `01` |

Define the full set in one place with its own release permissions. Do not scatter them.

---

## End of Day, End of Month, and scheduled processes

Many of these reports are not user-initiated at all.

**Produced automatically during End of Day / Generate Daily Reports:** Report Applied Customer
Credits, Report Current Inventory Adjustments, Report Deleted Orders (with **different selection
logic** — see `05`), Report Installment Receivables Activity, Report Installment Delinquency
Statistics Summary, Report Revolving Receivables Activity, Report Financed Accounts With Multiple
Customers, Report Financing Settlement Status (recap becomes a separate report).

`[SIDE EFFECT]` **EOD mutates state, not just output:**
- Voided orders are **flagged as reported** once they appear on the EOD report.
- Credit hold codes are **removed from approved orders**.
- Revolving plans are **removed from dispute**.
- **Report Financed Accounts With Multiple Customers deletes its exception records after printing.**

**Produced during End of Month:** Report Miscellaneous Fees.
`[SIDE EFFECT]` **Generate Monthly Reports purges `DAILY.DETAIL`** (per *Daily Receipts Retention
Months*), and **EOM can purge closed-period data** — which is why Report Written Sales Dollars is
documented as able to read closed periods and why `LPTO` can come back empty.

**Runnable as scheduled processes:** Report Daily Financing Payments (Report Archive or XML), Report
External Credit Card Transactions (requires *Enter Process Preferences* configuration), View and
Manage Open Orders (NFS or Report Archive; different fields, extra output columns, Past/Future Days
instead of dates).

**Recommendation — this is the most important item in this document.** A batch process that both
produces reports and mutates business state is a design we should not carry forward. Separate them:
- **State transitions** (clearing holds, flagging reported, releasing disputes) become explicit,
  individually triggerable, individually auditable operations.
- **Reports** become pure reads that can run any time, repeatedly, without changing anything.

The report-deletes-its-own-source-records behavior in Report Financed Accounts With Multiple
Customers is the clearest example of why: printing is not a lifecycle event, and a record that exists
only on paper is a record that has been lost.

---

## Data retention — what disappears and when

| Data | Governed by | Effect |
|---|---|---|
| Customer Activity Log | *Customer Retention Months* (POS Control Settings) | Log entries purged |
| Completed orders / invoices | *Completed Orders* + *Customer Retention Months* | Historical purchase inquiries can't find purged invoices |
| Closed A/R items | *Number of Months History* (AR Control Settings) | Bounds View a Customer's Historical Balance Details |
| Daily receipts (`DAILY.DETAIL`) | *Daily Receipts Retention Months* | Purged by Generate Monthly Reports |
| Closed-period written sales | End-of-Month purge | `LPTO` returns nothing; written-sales history needs EIS or custom reports |
| Shopping carts | Close Cart → purged at Day-Ending | Closed carts vanish |
| Archived leads | — | **Quotes stemming from an archived lead stop showing on Open Leads by Salesperson** |

Every one of these is a place where a report silently returns less than the user expects. In our
system, when a query's range extends beyond retention, **say so in the output** rather than returning
a quietly truncated result.

---

## Written vs. delivered

The single most important reporting concept in this section, and it is never defined in one place.

- **Written** — the sale as booked at order entry. Report Average Value of Sales Orders defines it
  precisely: *"the order amount as it was at the time of initial entry"*, with later changes excluded.
- **Delivered** — the sale as fulfilled and recognized.

Reports that offer both: View Summary of Sales Activity (separate Written and Delivered tabs), Report
Merchandising Activity (Sales = Written / Delivered), Report Average Value of Sales Orders (Based
On), Report Sales History by Initial Marketing Code (both amounts).

Related distinctions that behave the same way: **Open vs. Completed** (Report Products Sold Without
Warranties, Report Missed Sales Opportunities), and **written cost vs. actual cost** — the source of
the negative-margin adjustments explained in `05` § Report Written Sales Dollars.

**Recommendation:** make written/delivered a first-class dimension of the reporting model — one
definition, one implementation, available to every revenue report — rather than a per-report option
each report interprets slightly differently.
