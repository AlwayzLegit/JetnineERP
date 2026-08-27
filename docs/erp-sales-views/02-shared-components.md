# 02 — Shared Selection and Lookup Components

Covers articles 0, 10–27, 32, 95–97, 99 — the reusable UI machinery that the reports and
inquiries are built from.

---

## The multi-select picker family (articles 10–27)

**Eighteen articles describe what is essentially one component**, rendered against eighteen
different lookup tables: Customer, District Manager, Fabric Group, Finance Provider, Line
Status, Marketing Code, Method of Contact, Miscellaneous Fee, Option Type, Order, Price Level,
Product and Quantity, Product, Salesperson, Sub-Marketing Code, Warranty Category, Warranty
Component, plus the generic **Multiple Selection Lookup Window**.

Build **one component, three variants**. The differences below are the complete set — verified
by diffing all eighteen articles against each other.

### Variant A — OK/Delete picker (the default, ~12 of the 18)

The common shape:

- Appears at fields accepting multiple values.
- Add by typing into the field and pressing **Enter**, or via the **Search** button which opens
  the corresponding lookup window.
- On successful entry the item **and its description** appear in the grid; an invalid entry
  raises an error and must be re-entered or found via lookup.
- **Delete** (bottom of window) clears the **whole** grid.
- **Remove** deletes a single item — enabled by double-clicking the item, which also activates
  the buttons beside the entry field.
- Arrow keys navigate; a scroll bar appears when rows overflow; Enter or double-click selects.
- **OK** commits and returns; the calling field then displays **"..."** to signal multiple values.
- **Exit** returns without selecting anything.

Per-instance differences, and this is the entire list:
- **Customer** — searches via the **Customer Code Lookup** window; the grid shows code and name.
- **Order** — the Search button opens **a menu of inquiry routines** to find orders, not a single
  lookup.
- **Price Level** — entry is **direct only, one at a time**; no lookup window.
- **Warranty Component** — Search opens the **Component Multiple Selection Lookup Window**, and
  the Action button at the Component field opens **Warranty Component Settings** to create or
  edit a component code inline.

### Variant B — Add/Save picker (Miscellaneous Fee, Warranty Category, Product)

A different interaction with the same purpose:

- Type into the named field (Fee / Warranty Category / Product) and press **Enter** → the
  **Description** populates and the green **Add** and blue **Clear** buttons activate.
- **Add** appends the item to the **bottom** of the grid.
- **Search** opens the corresponding lookup; **OK** there adds the selections to the grid.
- **Remove** (red) deletes a selected item; **Clear** clears the *entry field* only — the item
  **remains in the grid** and no action is taken on it.
- **Save** commits (not OK). **Exit** abandons.
- The Product variant additionally has **Promote / Demote** buttons to **re-order** grid items —
  reordering only, not selection.

`[GATE]` **Read-only mode**: when reached from a view-only routine (the source names *View
Warehouse/Store Settings* and *View Advanced Product Settings*), the picker shows current
selections and nothing can be changed.

### Variant C — Multiple Selection Lookup Window (checkbox list)

The generic list picker, and the one the other two delegate to:

- Displays the records from **the settings routine associated with the current lookup** — e.g. a
  Salesperson field's Search opens a Salesperson window listing everything in Salesperson
  Settings.
- **Checkbox per row**; click to select, click again to clear.
- **Select All** / **Deselect All**.
- `[GATE]` **Choose only — you cannot create new records here.** Editing the list means going to
  the underlying settings routine (the source's example: a *Terms Code* lookup is edited via the
  Terms Code File routine).
- `[GATE]` Read-only variant when reached from a view-only routine.

### Recommendation

One `MultiSelectField` component, parameterized by the lookup source, with:
- direct entry + validation,
- a searchable list dialog with select-all,
- a chip/row list with remove and clear-all,
- optional ordering (the Product case),
- optional inline create (the Warranty Component case),
- a read-only rendering.

Do not build eighteen. The `"..."` multi-value indicator is worth keeping in spirit — show a
count and the first value or two rather than three dots.

---

## Read-only lookup windows

**UP System Action Code Lookup** (article 99) is the pattern: a read-only list of codes for a
single prompt, scrolled, selected by Enter or double-click, **not editable here** — the list is
maintained in its owning feature (for Action Codes, the *Edit Codes* feature inside the UP
System).

Same principle as Variant C: **lookups read; settings routines write.** Keep that separation.

---

## Search for a Customer (article 96)

The most-used component in the section — reached from dozens of screens — and the one with the
most business rules attached.

### Behavior

A sidebar of filters (Customer Name, General, Address, Other — collapsible, always
re-expanded on entry) plus a results grid. **Multiple filters are OR'd, not AND'd**: the source
states "results are based on hits for each field separately." Confirm that against a live system
before implementing; it is unusual and, if accurate, worth reconsidering rather than copying.

Results are **read-only**. Double-clicking transfers the customer to the calling process and
closes the window. `[GATE]` Reached **directly from a menu**, the grid is display-only and
double-click does nothing.

### Search methods

- **Starts With** (checkbox, **on by default**) — prefix match on last and/or first name.
  `[GATE]` **Ignores names containing an apostrophe.**
- **Soundex** — used when Starts With is cleared. Phonetic matching.

All name fields are case-insensitive and accept partial values.

### Fields

| Group | Fields |
|---|---|
| **Customer Name** | Last Name, Starts With, First Name, Middle, Prefix, Suffix |
| **General** | Phone (searches Home, Work, **and** Cell), Email (**primary only**, not additional addresses), SSN (**4–9 digits**) |
| **Address** | Street (billing **Address Line 1 only**, not shipping; case- and punctuation-insensitive; ignores suffixes listed in Address Exception List Settings), City, Zip Code |
| **Other** | Finance Provider — `[GATE]` active only when active finance providers exist |

`[GATE]` Middle, Prefix, and Suffix are each disabled by their own POS Control Setting
(*CUSTOMER ENTRY - Prompt for Middle Name*, *Validate Name Prefix*, *Prompt for Name Suffix*).

`[GATE]` **All name elements combined are limited to 50 characters** — the same limit that
appears in order entry.

**Zip behavior worth copying:** searching a base zip returns customers with extended zips;
searching an extended zip returns exact matches only.

### Grid

Account, Name, Address, City/Town, State (2-letter), Zip, Phone, Email, **Merge Status**,
**Inactive Date**, **Last Activity Date**, **Open Order** (Yes/No; null when results mix
customers and lead contacts). A **filter row** narrows results as you type.

Merge Status values: `Merged`, `Recommended`, `Pending`, `Attempted`, or null (already a
"merged-to" customer, or no merge status).

### Result-marking conventions

Three different suffixes carry meaning, and they are easy to miss:

| Marker | Meaning |
|---|---|
| Customer code + **`+`** | A credit-application **co-applicant** who is not a customer. The row shows the co-applicant's name and address but the **primary applicant's** code. Double-click opens the **primary applicant** |
| Name + **`+`** | A **primary customer with an associated alternate customer** (multiple fulfillments). Search matches both primary and alternate names but **only primary names display**, so the same customer can return twice when Starts With is off |
| Customer code + **`*`** | A **trade customer** (Trade/Designer feature, classified by Customer Type Code) |

**Recommendation:** three overloaded punctuation marks in one grid is not a design, it's an
accretion. Use explicit labels or badges.

### Exit-means-create — the important behavior

`[SIDE EFFECT]` Entering **Phone, Email, and/or Last Name** and then clicking **Exit without
selecting anyone** is interpreted as *"I want to create this customer"*: those values are carried
into **Advanced Customer Settings** for a new customer.

Two duplicate checks fire on that path:

**Duplicate phone** — always warns:
- *Yes* → phone propagates to the new customer
- *No* → phone does not propagate
- *Cancel* → stays in Search for a Customer

**Duplicate primary email** — `[GATE]` warns only when *Prohibit Customers with Duplicate Email
Address* is enabled in POS Control Settings:
- *Yes* → `[PERM]` requires *Create Customers with another exists with the same Email Address*
  (Sales Security) or a manager override; with it, the email propagates. Without it, the user
  stays in Search
- *No* → email does not propagate
- *Cancel* → stays in Search

`[SETTING]` *Search Information Required prior to creating a New Account* (POS Control Settings)
can require specific fields to have been searched before a new customer may be created.

**Recommendation:** "exit without selecting" is a terrible signal for "create a new record." Make
creation an explicit button. Keep everything else — the duplicate checks, the permission gate,
and the carry-forward of typed values are all good.

**Missing customer?** The source's own troubleshooting: check the **Inactive Date** field on the
Advanced page of Advanced Customer Settings — a merged customer shows the date it went inactive.

---

## Phone Number Lookup (article 32)

Reverse address lookup from a phone number, to speed customer creation.

- Uses the **WhitePages Pro API 2.0** for US numbers; requires an account.
- Available at Home Phone / Work Phone fields and in on-the-fly customer creation.
- `[SETTING]` **Search Phone Number First** (POS Control Settings):
  - **enabled** → entering a new customer name in the Customer Code field opens Customer Settings
    prompting for **Home Phone first**; a complete number triggers an automatic lookup, provided
    no last name or address has been entered yet. A Work Phone entry triggers it too.
  - **disabled** → enter a full number, then click the **Action** button beside the field.
- `[SETTING]` *Always Search for Customer* makes Search for a Customer appear before Customer
  Settings.
- Results are a list of directory listings, or a not-found message. Double-clicking a listing
  **populates name and address fields automatically**.
- The source flags **variable latency** dependent on the internet connection.

**Recommendation:** the pattern (enrich a customer record from a phone number at the point of
entry) is sound and still useful. The vendor is a decision, not a given — check whether
WhitePages Pro is still the right provider and what it costs, and make the provider pluggable.
Handle the failure and slow paths deliberately: a lookup that hangs must never block order entry.

---

## Cart search components

### Search for a Cart by a Specific Product (article 95)

Find shopping carts containing a given product. Reached from the menu or from the Search button
at the Cart ID field in Create/Edit a Shopping Cart.

**Header (locks after a valid product is chosen):** Product (Search opens Search for a Product,
which can return a **list** of products), Vendor, Brand, Vendor Model. A **counter below Brand**
indicates an active product list, showing position and total, with **Previous/Next** to walk it.

**Open Shopping Carts tab:** Location (defaults from user/login; `[GATE]` Regional Processing
applies), then read-only availability for the product at that location — **Cart Quantity, On
Hand, As-Is, Net Available, Net PO**.

**Grid:** Shopping Cart (ID), **Source** (`PS` = pocket PC, `QTE` = manual cart, `WEB` = eSTORIS),
Customer Code, Customer Name, Create Date, **Purchase Time Frame**, Home Phone, Cart Quantity.
Double-click → View Shopping Cart.

**Actions:** Search Related Collection, View Benefits.
**General Info tab** (menu access only): identical to the General Information page of View
Product Activity.

This is a genuine sales tool — "who has this mattress in a cart" is a callable list. Keep it.

### Shopping Cart Selector Screen (article 97)

A simpler cart finder from the Cart ID Search button: filter by **Customer Code** (Search opens
Search for a Customer), **Last Name**, **Phone Number**, **Email Address**, **Salesperson**
(Search opens Salesperson Lookup). Matching carts populate the grid — Cart, Customer Name, Date,
City/Town, Address/Phone/Email — and double-clicking loads the cart into Enter a Shopping Cart.
**Clear** starts a new search.

Two cart-search screens with overlapping purpose is one too many; fold them into one search with
both product and customer filters.
