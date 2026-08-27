# 05 — Order and Customer Documents

Covers: **Print a Completed Order**, **Print Completed Orders**, **Print Status Letter**,
**Print Mailing Lists**.

These are the customer-facing outputs. Unlike the fulfillment documents in `06`, **none of
them mutate order state** — with one exception noted under Mailing Lists.

---

## Print a Completed Order

**Entry:** Customer > Point of Sale > Print Documents > Print a Completed Order.
**Purpose:** reprint one or more already-completed orders.

### Fields

| Field | Behavior |
|---|---|
| **Completed Order** | Enter the completed order number. The Search button opens *Customer Buy History Inquiry* (View a Customer's Historical Purchases) to pick one |
| **Add** | Adds the entered document to the print list; the Document Number and Ship To name appear in the grid |
| **Grid** | Selected orders with the name the order was shipped or invoiced to |

Multiple documents are added **one at a time**.

**Build note:** the add-to-list-then-run pattern recurs across several routines (here, and in
Print a Delivery/Pick-Up/Transfer Ticket). Build one reusable "document batch picker"
component: typed entry with lookup, add, list with remove, run. Do not reimplement it per
screen.

---

## Print Completed Orders

**Entry:** Customer > Coordination and Logistics > Delivery Processing > Print Completed
Orders; also under Merchandising and Distribution > Logistics > Delivery Processing.

**Purpose:** print completed orders in bulk by selection criteria. The criteria-driven
counterpart to the routine above.

### Fields

| Field | Behavior |
|---|---|
| **Location** | Arrow-select from locations available to the logged-in user |
| **Date Code** | `CUS` (custom range), `TDAY` (today), `YDAY` (yesterday) |
| **Start Date** | `[GATE]` active only when Date Code = `CUS`. Blank → earliest available date |
| **End Date** | `[GATE]` active only when Date Code = `CUS`. Blank → latest available date |
| **Route Code** | Optional. Blank → all orders. **Entering a route inactivates Truck** |
| **Truck** | Optional. Blank → all trucks. **Entering a truck inactivates Route Code.** `[GATE]` active only when the Mapping Interface is active via General System Control Settings |

Note this screen gates Truck on a **global** setting (General System Control Settings) while
the fulfillment routines in `06` gate the equivalent field on a **per-location** setting
(Mapping Active in Warehouse/Store Location Settings). That inconsistency is almost certainly
historical. Unify on the per-location rule; it is the more specific and more useful one.

The date range is on **completion date**.

---

## Print Status Letter

**Entry (four paths, and the entry path changes the screen's behavior):**

- Review Pending Credit Requests > Credit Request Review > **Actions**
- View Completed Credit Requests > Credit Request Review Screen (Read Only) > **Actions**
- Customer Credit and Scoring Information > **Actions**
- Customer Credit and Scoring Information > check **Print Credit Limit Change Letter**, then
  Save

**Purpose:** **reprint** credit request status letters and credit limit change letters,
**one at a time**. The initial batch printing happens elsewhere, in *Print Credit Request
Status Letters*.

`[SIDE EFFECT]` After printing, a prompt asks whether the letter printed properly. Answering
**Yes records audit comments** against the record. The letter print is itself an auditable
event — port this. Compliance correspondence needs a record that it was produced and
believed delivered.

### The screen has two distinct modes

Every field below behaves differently depending on whether you arrived to print an
**approval/decline letter** or a **credit limit change letter**.

#### Letter Type

**Approval/decline mode** — dropdown: `Approval`, `Decline`, `Conditional`, narrowed by
prior state:

| Situation | Available options |
|---|---|
| Approved request, *Approval Letter Previous Conditional Approvals Entry* **set** on the General tab of Credit Application Control Settings, and the request was previously conditionally approved | `Approval`, `Conditional` |
| Approved request, that setting **not** set | `Approval` only — **prompt inactivated** |
| Declined request, *Decline Letter Previous Conditional Approvals* **set**, and previously conditionally declined | `Decline`, `Conditional` |
| Declined request, that setting **not** set | `Decline` only — **prompt inactivated** |

**Credit limit change mode** — **read-only**. Defaults to `Increase` if the limit was
increased or Credit Limit Increase Letter was chosen from Actions; `Decrease` if decreased or
Credit Limit Decrease Letter was chosen. Cannot be changed on this screen.

#### Reason

- **Approval/decline mode:** dropdown, initially populated with the current reason on the
  credit request. `[GATE]` **Editable only when called from a declined closed request.**
- **Credit limit change mode:** defaults to the entry made on the Customer Credit and Scoring
  Information screen when the limit was **decreased**, and is editable there. **Not available
  when printing an Increase letter.**

#### Plan Requested

- **Approval/decline mode:** dropdown of available finance plans. **Required.**
- **Credit limit change mode:** inactive.

#### Plan Approved

- **Approval/decline mode:** dropdown of finance plans — the plan approved or offered. **Not
  required.** Any valid finance plan may be specified.
- **Credit limit change mode:** inactive.

#### Output Type

- **Approval/decline mode:** `Print` or `Email`. Default `Print`.
- **Credit limit change mode:** `Print`, and `Email` when configured.

`[GATE]` **Email is available only when both hold:**
1. an email address exists for the customer receiving the letter, **and**
2. the letter type supports email, per the *Event Email ELP Form Selection* tab of
   **Notifications Control Settings** — specifically, email is available as long as
   *No Email Availability* is **not** set.

**Save** prints the letter.

### Build notes

This screen is a compliance artifact. Adverse-action notices on credit decisions are
regulated correspondence, and the field-level rules above encode who may restate what after
a decision has been made — note especially that Reason is editable *only* for a declined
closed request.

Do not simplify these rules away. Implement the two modes as two explicitly distinct
operations sharing a renderer, rather than one screen with conditional fields — the STORIS
single-screen approach is why the article has to say everything twice.

`[SETTING] keep` — both *Previous Conditional Approvals* settings and the email-availability
configuration. These are policy switches with legal weight, not UI preferences.

---

## Print Mailing Lists

**Also titled:** Print Mail Labels/Proof.
**Entry:** Customer > Coordination and Logistics > Mailing Labels > Print Mailing Labels.

**Purpose:** export a mailing list created in *Create a Mailing List* to Excel or ASCII, for
printing with third-party software. Despite the name, this routine **exports**; it does not
lay out labels.

### Fields

| Field | Behavior |
|---|---|
| **Date of Mailing** | Defaults to today, editable, calendar picker. `[SIDE EFFECT]` updates **Date of Last Mailing** in Update Customer Mailing Data (Customer History Maintenance), making it available as future selection criteria |
| **Name of Mailing** | Optional, e.g. "Summer Sale". `[SIDE EFFECT]` updates **Name of Last Mailing** in the same routine, likewise usable as future criteria |
| **Mail List Name** | The mailing list code to export. Search button opens a menu of lists |
| **List Information** | `Address Only`, `Email Only`, `Both` |
| **Send Output to** | Read-only display; change via Actions > Output Settings |
| **Export Path** | Read-only. **No export path is shown if output is Screen** |
| **Run** | Produces the export |

`[SIDE EFFECT]` Printing a list for a customer **increments the Total Number of Mailings**
field in Update Customer Mailing Data for that customer.

### Build notes

The three side effects together make this a **campaign-send event**, not a report:
last-mailing date, last-mailing name, and a lifetime mailing counter all advance on run.
Downstream segmentation then selects on those fields — "customers not mailed in 6 months"
depends on this routine having run.

Model it accordingly: a `MailingCampaign` record (date, name, list, contents) with recipient
rows, rather than a fire-and-forget export. That gives us the same selection capability plus
the auditability STORIS lacks — as specified, there is no record of *who* was on the list,
only that each recipient's counter went up.

**Note the contact-data implication:** `Email Only` and `Both` mean this routine exports
customer email addresses to a file for use in third-party software. Whatever we build should
route email campaigns through a proper sending path with suppression and unsubscribe
handling rather than emitting address lists — and if a file export is retained, it needs
access control and an audit record.
