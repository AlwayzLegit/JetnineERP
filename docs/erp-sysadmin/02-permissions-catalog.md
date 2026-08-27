# LA Mattress ERP — Consolidated Permission Catalog

**Supersedes file 10 of the Inventory handoff pack.** This is the single register of every ERP permission we
intend to implement, keyed by requirement ID, one table per security domain.

*Sources:* the ten STORIS "Security" articles in System Administration → User Settings
(`SEC-001` … `SEC-010`, see `user-security.md` for per-article detail and `storis_ref` article IDs), plus the
`SEC-*` IDs already registered in the Inventory pack, which are reused verbatim where the permission is the
same one.

**Column meanings**
- `ID` — our requirement ID. Format `SEC-<DOMAIN>-<MNEMONIC>`. IDs marked **(existing)** were minted in the
  Inventory pack and are reused, not re-minted.
- `Permission` — **verbatim STORIS wording.** Do not paraphrase these; they are how the business will search.
- `Gates / effect` — what the permission actually controls.
- `Notes` — defaults, dependencies, precedence, and where we intend to deviate.

Domains: `SLS` Sales · `PO` Purchasing · `PAY` Payables · `AR` Receivables · `LOG` Logistics ·
`SVC` Service · `SYS` System · `XFER` Transfer · `IMP` Import Data · `PII` Personal Information.

---

## Preamble — the permission model

### 1. User-level vs group-level assignment, and how conflicts resolve

**In STORIS.** Both scopes exist. Nine of the ten extended-security screens hang off *both* the User record
(`Create a User > Security tab > Actions`) and the User Group record (`Create a User Group > General tab >
Actions`); **Transfer Security is user- and location-scoped only and has no group-level form.** Assigning a
user group is mandatory for every user.

But STORIS does **not** resolve a conflict at runtime, because at runtime there is nothing to resolve:
**group settings are a template that is copied down into individual user records; enforcement reads only the
user record.** The mechanism is the `Reset User Members` checkbox on the User Group record — *"When checked
the system applies changes made to security settings to all other users in the current user group (that is,
the system updates those individual user records). If you leave the box blank, the system does not update
individual user records."* The same checkbox is used to re-stamp a user's settings when they move between
groups. Group values also act as the default at user creation (Sales Security, *Complete Orders for Ship
Locations Other Than Login Locations*: *"When creating a new user, this setting defaults to checked, unless
you assign a user group that has this setting unchecked."*).

Consequences to be aware of when reading a STORIS system: editing a group **does not** change existing
members' effective rights unless `Reset User Members` is ticked; when it is ticked it **silently overwrites**
every per-user exception with no diff and no undo; and the answer to "what can this user do?" is always the
user row, never the group row. Note that the group's *menu security* and *location/regional restrictions* are
a different, genuinely group-scoped mechanism and are not affected by this.

**In our ERP.** Do not copy the copy-down model. We assign permissions to **roles**, users hold one or more
roles, and a user may additionally hold **user-level grants and denials** as exceptions. Resolution is
evaluated live, in this order:

1. **User-level `deny`** — wins over everything. Nothing overrides an explicit user denial.
2. **User-level `allow`** — wins over any role.
3. **Role-level `deny`** — if any held role denies, the permission is denied.
4. **Role-level `allow`** — if any held role allows and none denies, the permission is allowed.
5. Otherwise **`inherit` falls through to the system default for that permission**, which is `deny` for
   everything except a short, explicitly-listed set of safe read permissions.

That is: **most-specific scope wins; within a scope, `deny` beats `allow`.** Editing a role takes effect
immediately for every holder — there is no propagation step and no `Reset User Members` equivalent.

### 2. Three-state grant / deny / inherit

Every permission is stored as one of `allow`, `deny`, `inherit` at each scope — never a bare boolean. This
matters because STORIS's two-state checkboxes conflate three different meanings of "unchecked":

- *unchecked = ask a manager* (the common case: the Access Control Window / Security Override Screen appears
  and a permitted user's credentials let the action proceed);
- *unchecked = hard stop* (e.g. `Recover STORIS Licenses`: *"the screen cannot be accessed and no security
  override option is available"*; `Backdate Transactions`: *"the system does not allow security overrides to
  this setting"*; `Import Products from Retail Deck`; `Edit purchase orders that have been printed or
  emailed`);
- *unchecked = degraded mode* (e.g. read-only instead of blocked, blind count sheets instead of no count
  sheets, `"See Cashier"` instead of a hold code).

We therefore carry a second axis alongside the three-state value, borrowed from the one STORIS setting that
already gets it right (`Allow to Over Receive Merchandise`, whose values are literally `No` / `Yes` /
`Override Required`):

- `enforcement: hard | override_allowed | degrade`
- `require_second_signature: bool` — independent of whether the permission is granted. STORIS needs this:
  `Override Allowed Number of Days on Returns` and `Override Group Return Restriction Days` both demand an
  override **even when the flag is checked**, *"to ensure that the approval of the return is written in the
  audit comments."* Approval-for-audit is a separate concern from authorisation and must be modelled as one.

`inherit` is the default state of every new permission at every scope, so adding a permission to the codebase
never silently grants it to anyone.

### 3. Server-side enforcement

**Every permission is enforced on the server, at the point of effect, without exception.** The UI may hide or
disable a control as a convenience; that is never the enforcement. STORIS leans heavily on client-side
behaviour — *"the button is not active"*, *"the tab is inactive for this user"*, *"the field is unavailable"*,
*"opens in read-only mode"* — which is fine as UX and worthless as security.

Concretely:
- Authorisation happens in the service layer, against the **effective permission set of the authenticated
  principal**, re-derived per request; never from a client-supplied role, scope or flag.
- Override flows (`enforcement: override_allowed`) are **server-mediated**: the client posts the action plus
  the approver's credentials, the server authenticates the approver, checks that the *approver* holds the
  permission, performs the action, and records both identities. The client never learns whether a given
  approver would have succeeded.
- Batch, import, scheduled, print and export paths re-check permissions **at execution time against the
  requesting user**, not at queue time. STORIS gets this right for print (`SEC-COST-VIEW` suppresses cost on
  Forms Designer output) and we must generalise it.
- Config gates are evaluated server-side too, and reported: a permission that is granted but inert because a
  configuration flag is off must resolve to `inert(reason)`, not to `allow`. STORIS has many of these
  (`Override Handling Method on a Fulfillment` does nothing unless `Default Handling Methods on Fulfillments`
  is on; `Enter payments during cash balancing by cashier` does nothing unless `Balance By = Cashier`) and
  they make permission audits meaningless.

### 4. Field-level redaction for cost-style permissions

A whole class of permissions is not about *doing* but about *seeing*, and these are enforced by redaction, not
by blocking. STORIS's examples: `View and access product cost information` (`SEC-COST-VIEW`),
`View and Access Costs Associated with Service`, `View encrypted finance, credit card, check account numbers`,
`View encrypted AP account numbers`, `View Encrypted Gift Card PIN`, and the whole Personal Information
Security matrix.

Our rules:
- **Redaction is applied in the serializer**, at the API boundary. The unmasked value never leaves the server
  for a principal that lacks the permission. Masking in a template or a front-end formatter is not redaction.
- **Redaction is per-channel.** STORIS models PII visibility as a matrix of `{data class} × {screen, report,
  printed document, export}` and this is correct — a user may legitimately read an SSN on screen and still
  receive it masked in a CSV. We adopt the same shape and extend the data classes beyond STORIS's
  `Date of Birth` / `Driver License Number` / `Social Security Number`.
- **Derived and aggregate values leak too.** If cost is redacted, margin, markup and landed-cost columns are
  redacted with it; totals that would let cost be back-computed from a permitted field are suppressed.
  STORIS handles the print case and not the arithmetic case.
- **No entry-session exemption.** STORIS states that *"if the user entered the data STORIS does not
  immediately mask the data"* and only masks on re-access. We mask immediately after save, for everyone
  without the permission, author included.
- **Successful unmasks are logged**, not only denials — for PII and payment data the read *is* the auditable
  event. Log principal, record, field class, channel and reason.
- Redaction permissions are `enforcement: hard`. There is no "ask a manager to see the SSN" flow; the
  permitted user retrieves it themselves so the log names the person who actually saw it.

### 5. Audit logging of denied attempts

Every authorisation decision that is not a plain `allow` is logged, and every override is logged regardless
of outcome. The record carries: timestamp, principal, effective role set, permission ID, decision
(`deny` / `override_required` / `override_granted` / `override_refused` / `inert`), the resource and its
identifiers, the entry point, and — for overrides — the **approver's** identity as a distinct field from the
actor's.

This is deliberately stricter than STORIS, which is inconsistent about it. STORIS does log some overrides
(*"When credentials are supplied in a security override, an audit comment is logged"*; *"the audit file
updates indicating the user who authorized the sale"*; *"Document comments are generated for all security
overrides"*) — and explicitly does **not** log others: *Receive a Purchase Order with a Separate Freight Bill
- Override Freight Amount* carries the line **"Use of this security override is not recorded."** on a field
that changes money. There is no acceptable version of that in our system.

Additional rules:
- Denials are logged even when the UI would have hidden the control, because a denial reaching the server
  means either a stale client or a probe, and both are worth seeing.
- Repeated denials for the same principal/permission pair inside a short window raise an operational alert.
- Audit records are append-only, retained independently of the business records they describe, and are
  themselves readable only under a permission (`SEC-SYS-AUDIT-VIEW`) that cannot be granted by the same
  people who can grant break-glass permissions.
- Break-glass permissions (`SEC-SYS-ECL` has no equivalent and will not be built; `SEC-SYS-PURGE-ENC`,
  `SEC-SYS-ENCRYPT`, `SEC-SYS-ASSIGNPERM`) additionally require dual control and are time-boxed; their grant,
  use and expiry are all logged and alerted.

---

## Sales (`SLS`) — from `SEC-008`

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-SLS-SUBTOTAL-ACCESS` | Access Subtotal field on sales orders | Discount an order by adjusting the subtotal on the Payment tab of order entry. | |
| `SEC-SLS-ROUTE-ALL` | Access all Delivery Route Codes | All delivery route codes via lookup in Enter a Return, Enter an Exchange, Additional Fulfillment Information. | Unchecked ⇒ lookup restricted to routes for the specified zip code. |
| `SEC-SLS-GDISC-DOLLARADJ` | Access global discounts on dollar only adjustments | Apply/remove global discounts at `Discount Code(s)`, Payment tab of Adjust Dollars on a Completed Order. | |
| `SEC-SLS-GDISC-RETURN` | Access global discounts on returns | Global discounts on the Payment tab of return entry. | |
| `SEC-SLS-LINEDISC` | Access sales order line discounts | Enter/edit line discounts on Merchandise tab (orders) and Sell Merchandise tab (exchanges). | Unchecked ⇒ only auto-apply discounting. Does not cover Payment-tab discounts. |
| `SEC-SLS-MARGIN-SCRATCHPAD` | Access the sales margin scratchpad within POS entry | Sales Margin Scratchpad from Actions on the Merchandise tab. | Exposes margin ⇒ treat as cost-adjacent; pair with `SEC-COST-VIEW`. |
| `SEC-SLS-STOCKLOC-CHANGE` | Allow user to change stock location on Sales Orders and Exchanges | Change merchandise stock location. | **Default checked.** Does not affect as-is pieces. |
| `SEC-SLS-SUBTOTAL-DISC` | Apply Subtotal Discount%, Discount Amount or Discount Codes | Subtotal discounts on the Payment tab via codes, amount or percent. | |
| `SEC-SLS-E1HOLD` | Approve E1 credit holds placed on customer exchanges | Approve exchanges on E1 credit hold. | Relevant when `Exchanges on Hold at Entry` is active in POS Control Settings. |
| `SEC-SLS-MULTILEG-BO` | Back Order Multi-Leg Transfer | Reserve/back-order a line on a multi-leg stock transfer, incl. `Reserved Quantity`. | |
| `SEC-SLS-BACKDATE` | Backdate Transactions | Backdate new orders in an overlap month to the previous month. | **HARD DENY — "the system does not allow security overrides to this setting."** Window from `Days To Allow Backdating`. |
| `SEC-SLS-BYPASS-VERIFYID` | Bypass verify user ID during entry | Skip initials+password during Sales Order, Quick Sale, Service Order, Exchange, Return, Sales Adjustment. | Governed by `Verify User ID During Entry` (POS Control Settings, Advanced). |
| `SEC-SLS-FILLDAYS` | Change Auto Fill Days on Transactions | Override `Fill Days` in the Product Full Display Screen. | |
| `SEC-SLS-MKTCODE` | Change Marketing Code | Change marketing codes on existing orders **for which no part has been completed**. | |
| `SEC-SLS-COMPLETIONDATE` | Change a transaction's completion date | Edit completion dates via the Completion Date Entry Screen. | Else Access Control Window. Also bounded by `Days to Allow Completion Backdating`. |
| `SEC-SLS-PRICECAT` | Change customer price category within POS entry | Edit `Price Category Code` (Advanced Customer Settings, POS page) and `Price Category` (Additional Order Detail, Other). | Blank ⇒ security override window. |
| `SEC-SLS-DELIVCONTACT-STATUS` | Change delivery contact status | Change delivery contact status on sales orders. | |
| `SEC-SLS-DELIVSTATUS` | Change Delivery Status | Change delivery status on a sales order or exchange. | **Delivery only — not pickup, not service.** |
| `SEC-SLS-TRADEDISC-MAX` | Change maximum trade discount for a sales line item | Change max available trade discount % via extra Action on Trade Pricing and Discounting. | Trade/designer sales feature only. |
| `SEC-SLS-CHG-SCHED-PRINTED` | Change Order when a Fulfillment is Scheduled and Printed | Blank ⇒ blocks 17 named changes to inventory on the first delivery date of an SCH order whose ticket is printed, inside `In-Process Delivery Restriction Days`. | Full blocked-action list in `user-security.md` `SEC-008`. |
| `SEC-SLS-CHG-SCHED-FULFILL` | Change Order Fulfillments with a Status of Scheduled | Add/delete/move lines, change deliver-to, date, route/truck, fulfillment location, quantities; delete an order with a scheduled fulfillment. | **Default checked.** Else security override. |
| `SEC-SLS-QPICKUP-QTY` | Change pickup quantity during quick pickup order completion | Edit `Quantity Picked Up` in Complete a Pickup without Accessing Order Entry. | |
| `SEC-SLS-PICKUPSTATUS` | Change Pickup Status | Change pickup details on a sales order. | **Pickup only, not delivery.** |
| `SEC-SLS-RTNPRICE-UP` | Change reduced return price; not exceeding original price | Increase the refunded price up to (not exceeding) original selling price minus adjustments. | Only applies if `Reduce Customer Returns by ___ %` (Costing Control Settings) or `Reduce Customer Returns %` (Group Settings) is set. **Cost reduction does not change when the price is edited.** |
| `SEC-SLS-WTYPRICE-UP` | Change reduced warranty price; not exceeding original price | Increase prorated warranty price up to original. | Only if `Prorate Returned Warranties` is checked. |
| `SEC-SLS-REQDATE` | Change Requested Date in Enter a Sales Order or Enter an Exchange | Edit `Requested Date` on a fulfillment. | Else security override. |
| `SEC-SLS-SP-AT-RTN-ENTRY` | Change Salesperson at Entry of Return/Exchange | Change return salesperson ID during initial entry. | Does not restrict Salesperson ID on returns/exchanges against invoices not on file. |
| `SEC-SLS-COD-AMT` | Change the COD amount due within POS entry | Override `COD Amount Due` via Additional Order Detail. | |
| `SEC-SLS-NETTOTAL` | Change the Net Total on Sales Orders | Adjust the Net Total ("Out The Door" total). | Else Security Override Screen at the Action button on `Net Total`. |
| `SEC-SLS-SPIFF-AMT` | Change the calculated spiff amount within POS entry | Edit `Spiff Amount` on the Commission/Spiff Updates Screen. | |
| `SEC-SLS-COMMCAT` | Change the commission category within POS entry | Edit `Commission Category` on the Commission/Spiff Updates Screen. | |
| `SEC-SLS-SP-OPEN-TXN` | Change the salesperson indicated on an open transaction | View and edit `Salesperson` on an existing open order. | |
| `SEC-SLS-COMPLETE-EXCH` | Complete customer exchanges | Complete via Enter an Exchange. | Else Access Control Window at `Complete Exchange`. |
| `SEC-SLS-COMPLETE-RTN` | Complete customer returns | Complete via Enter a Return. | Else Access Control Window at `Complete Customer Return`. |
| `SEC-SLS-COMPLETE-OFFLOC` | Complete Orders for Ship Locations Other Than Login Locations | Complete orders/exchanges where login location ≠ ship location. | **Defaults checked for a new user unless the assigned group has it unchecked** — the clearest statement of the copy-down model. |
| `SEC-SLS-COMPLETE-RTN-OFFLOC` | Complete Returns for Return Locations Other Than Login Locations | Complete a return regardless of location. | **Default checked.** |
| `SEC-SLS-COMPLETE-SO` | Complete sales orders | Complete via Enter a Sales Order. | Else Access Control Window at `Completion Type`. |
| `SEC-SLS-DUPEMAIL-CUST` | Create Customers when another exists with the same Email Address | Override `Prohibit New Customers with Duplicate Email Addresses`. | **Required to update a customer email that exists on another record via Update Customer Address.** |
| `SEC-SLS-NEWORDER-ERP` | Allow Creation of New Orders in ERP from Enter a Sales Order | Create new orders regardless of the location's setting in Warehouse/Store Location Settings. | If the location allows it, the user can create orders regardless. |
| `SEC-SLS-MULTI-FULFILL` | Create Multiple Fulfillments for a Method | More than one fulfillment per method per order. | Unchecked ⇒ one per method. **Checked still requires an override to assign lines to multiple same-method fulfillments.** Needs `Maximum Number of Fulfillments` to permit it. |
| `SEC-SLS-EROAM-ORDER` | Create order from eRoam | `Create Order` button in eRoam. | |
| `SEC-SLS-PO-NOTHOLD-POS` | Create purchase order not on hold from POS entry | On-the-fly POs from order entry follow normal hold rules. | Unchecked ⇒ **all** such POs are placed on hold regardless of other settings. |
| `SEC-SLS-SPECORD-PROD` | Create special order products within POS entry | Special-order products on-the-fly; activates `Special Order Entry` on the Action button at `Product`. | |
| `SEC-SLS-STOCK-PROD` | Create stock product within POS entry | Stock products on-the-fly; unlocks `Create New Product`. | Blank ⇒ security override. |
| `SEC-SLS-DEL-STOCKLINE-PO` | Delete a Stock Merchandise Line Item Linked to a Purchase Order not on Hold | Delete stock lines designated for a not-on-hold PO. | |
| `SEC-SLS-DEL-DIRECTSHIP` | Delete direct ship line items on an order | Delete direct-ship lines linked to a PO. | Three documented carve-outs where deletion works without it (no PO link; quote/layaway; order unsaved since line added). |
| `SEC-SLS-DEL-QUOTE` | Delete quotes | Delete sales quotes. | |
| `SEC-SLS-DEL-SPECORD-LINE` | Delete special order line from a sales order | Delete a special-order line at any time, PO-linked or stock-reserved. | Also governs COM component special-order lines and their linked POs. |
| `SEC-SLS-DEL-CART` | Delete shopping carts | Delete shopping carts. | |
| `SEC-SLS-DEL-SPECORD-PO` | Delete special order line item linked to a purchase order not on hold | `Remove` works on special-order lines linked to not-on-hold POs. | Unchecked ⇒ button clickable but override required. Also governs COM components. |
| `SEC-SLS-DEL-DELIVFULFILL` | Delete the fulfillment with the delivery charge | Delete the fulfillment holding the delivery charge, via the Delete button or automatic empty-fulfillment deletion on save. | **Only consulted when `One Delivery Charge Per Order` is enabled. Never applies to Direct Ship fulfillments.** |
| `SEC-SLS-EDIT-OPEN-TXN` | Delete/Edit information on open transactions | Access existing sales, service and transfer orders and change/delete information. | Very broad; a de-facto master edit flag. |
| `SEC-SLS-EDIT-DEPOSIT-LINES` | Delete/Edit line items on transactions with deposits applied | Edit/delete lines on orders with deposits applied. | |
| `SEC-SLS-DS-DEL-LINE-PO` | Direct Ship - Delete a Direct Ship Order Line Item when the Linked Purchase Order is not On Hold | Delete lines that are both direct-ship and linked to a not-on-hold direct-ship PO. | |
| `SEC-SLS-DISC-DOLLARADJ` | Discount POS Dollar Adjustments | Discount point-of-sale dollar adjustments. | |
| `SEC-SLS-DISC-AUTOAPPLY` | Discounts - Apply Automated Line Discounting | `Start Automated Line Discounting`, `Suspend Automated Line Discounting - Remove Discounts`. | Blank ⇒ manager approval. |
| `SEC-SLS-DISC-MGRONLY` | Discounts - Apply Manager Only Discounts | Apply manager-only discounts. | |
| `SEC-SLS-DISC-OVERRIDE-RESTR` | Discounts - Override Sales Discount Restrictions | Retain a discount that has ceased to qualify on re-evaluation. | **Discounts are re-evaluated continuously as orders change.** |
| `SEC-SLS-DISC-SUSPEND-KEEP` | Discounts - Suspend Automated Line Discounting while Retaining Discounts | Suspend auto-apply without losing applied discounts. | |
| `SEC-SLS-DTV-SVCORDER` | Dynamic Tab View - Maintain a Service Order | Enter a Service Order in entry mode from inquiry screens. | Unchecked ⇒ read-only. **Collapse with the other entry-vs-read-only flags in our model.** |
| `SEC-SLS-DTV-SALESORDER` | Dynamic Tab View-Maintain a Sales Order | Enter a Sales Order in entry mode from seven named inquiry screens. | Unchecked ⇒ read-only. Same collapse. |
| `SEC-SLS-EXCH-RTN-PORTION` | Enter Return Portion of Existing Exchange | Edit the return portion of an exchange. | **Default checked.** Unchecked ⇒ sale portion only. No effect on deleting sale-portion lines. |
| `SEC-SLS-BUILDER-ALLOWANCE` | Edit the builder allowance amount within POS entry | Add/edit a builder's allowance on a fulfillment sub-document. | |
| `SEC-SLS-EDIT-TAX-AMT` | Edit the calculated sales tax amount on open transactions | Change sales tax information in Enter a Sales Order. | |
| `SEC-SLS-INSTALL-RESTOCK-CHG` | Enter Installation/Restocking Charges | Controls access to `Allow Installation/Restocking Charges` in POS Control Settings. | Else security override. |
| `SEC-SLS-NEW-EXCHANGE` | Enter a New Exchange | Create a new exchange. | **Default checked.** Unchecked ⇒ view existing exchanges only. |
| `SEC-RTN-NOORIG` **(existing)** | Enter return/exchange/dollar adjustment without original order | Returns, exchanges or dollar adjustments with no original document on file. | **Reused from the Inventory pack — do not mint a new ID.** |
| `SEC-SLS-LAYAWAY` | Enter/Edit Layaway Orders | Enter/edit layaways. | Converting a sales order to a layaway evaluates this; inadequate security ⇒ manager override to continue. |
| `SEC-SLS-MULTISHIP` | Enter/Edit Multi Ship Masters | Enter/edit multi ship masters. | |
| `SEC-SLS-SALESORDER` | Enter/Edit Sales Orders | Enter/edit sales orders **and convert shopping carts to sales orders**. | |
| `SEC-SLS-QUOTE` | Enter/Edit Sales Quotes | Enter/edit quotes. | Converting an order to a quote evaluates this. |
| `SEC-SLS-FR-ADJ-PARTIAL` | Finance Receivables - Allow Adjustments After Partial Completion | Controls `CONTRACTS - Allow Adjustments after Partial Completion` in Finance Provider Settings. | **Checked ⇒ override credentials required EVERY time a finance adjustment order is changed; order comments record the access.** Same-named flag also in `AR`. |
| `SEC-SLS-IMPORT-RETAILDECK` | Import Products from Retail Deck | Import products from the RetailDeck database. | **HARD DENY — "the system does not permit a manager override."** |
| `SEC-SLS-REPO-SELLPRICE-UP` | Increase Sell price above Max Sell price for Repossessions | Exceed the Repossession Maximum (As-Is Status tab, Enter a Stock Adjustment). | |
| `SEC-SLS-VCA-COG` | Maintain a Customer's Own Goods Order from View Customer Activity | Entry mode vs read-only for Maintain a COG Order. | Collapse candidate. |
| `SEC-SLS-VCA-RETURN` | Maintain a Return from View Customer Activity | Entry mode vs read-only for Enter a Return. | Collapse candidate. |
| `SEC-SLS-VCA-SALESORDER` | Maintain a Sales Order from View Customer Activity | Entry mode vs read-only for Enter a Sales Order. | Collapse candidate. |
| `SEC-SLS-VCA-EXCHANGE` | Maintain an Exchange from View Customer Activity | Entry mode vs read-only for Enter an Exchange. | Collapse candidate. |
| `SEC-SLS-DEPOSITS-AFTER-DEL` | Maintain customer deposits immediately after order deletion | Reach Maintain Customer Deposits from Enter a Sales Order after deleting a deposited order — to apply, refund, put on-account, or issue finance credit. | Money-movement path reached from a delete. |
| `SEC-SLS-LINK-PO` | Manually Link Purchase Orders on Sales Orders and Exchanges | Link a PO for a stock product in order/exchange entry. | Enabled ⇒ Purchase Order Reservations shows per `Sales Order Linkage Access` (Purchasing Control Settings); disabled ⇒ that setting is not displayed. |
| `SEC-SLS-MOD-COUPON-RTN` | Adjustments Modify Coupons and Subtotal Discounts on Returns and Adjustments | Add/remove/adjust coupon or subtotal discount in Enter a Return / Adjust Dollars on a Completed Order, incl. auto-calculated amounts. | |
| `SEC-SLS-RTNDAYS-OVERRIDE` | Override Allowed Number of Days on Returns | Enter/approve a return past `Allowed Number of Days on Returns`. | **Unchecked by default. A security override is required even when checked — deliberately, so the approval reaches the audit comments.** Model with `require_second_signature`. |
| `SEC-SLS-PPLAN-PRICE-OVR` | Override Calculated Protection Plan Price | Override calculated Protection Plan prices in Protection Plan Product Selection. | **"Once the price has been changed, a security override is required."** |
| `SEC-SLS-TAXEXEMPT-OVR` | Override Charge Sales Tax Settings | Override `Charge Sales Tax` in Order Tax Information. **Overriding makes the entire transaction tax exempt.** | **Subordinate to `SEC-SYS-TAXABLE` — that must be checked for this to be usable.** Full decision flow in `user-security.md`. |
| `SEC-SLS-COMMRULES-OVR` | Override Commission Rules | Override commission rules on the Pricing and Commissions tab of POS Control Settings. | **Applies to sales orders, quick sales, layaways, quotes, and the "sale" portion of an exchange. NOT to returns, dollar adjustments, or the "return" portion of an exchange.** |
| `SEC-SLS-DEPOSIT-HOLDBACK` | Override Deposit Hold Back on an Order | Modify `Deposit Hold Back` on the Other page of Additional Order Detail. | Row appears twice, identically, in the source article. |
| `SEC-SLS-GRPRTNDAYS-OVR` | Override Group Return Restriction Days | Enter/approve a return past `Return Restriction Days` in Group Settings. | **Unchecked by default; override still required even when checked, for the audit trail.** |
| `SEC-SLS-HANDLING-METHOD` | Override Handling Method on a Fulfillment | Change the default handling method on a fulfillment in sales/exchange/return entry. | **Inert unless `Default Handling Methods on Fulfillments` is enabled — no security check happens at all in that case.** |
| `SEC-SLS-MAXFULFILL-OVR` | Override Maximum Number of Fulfillments | Exceed `Maximum Number of Fulfillments`. | Re-accessing an already-overridden order needs no new override unless the count increases. |
| `SEC-SLS-ASIS-PCT-OVR` | Override Maximum Percentage for As-Is Selling Price Adjustment | Decrease an as-is price by more than `Maximum Percentage Reduction` (Inventory Control Settings). | |
| `SEC-SLS-TAKEWITH-DEPOSIT` | Override Minimum Deposit on Take With Orders | Override `Minimum Deposit Percent for Take With Lines` (AR Control Settings). | Applies only to Enter a Sales Order and Enter an Exchange. |
| `SEC-SLS-PARCELROUTE-OVR` | Override Parcel Route Requirement | Save an order with incompatible parcel route settings. | Enter a Sales Order only. |
| `SEC-SLS-PPLAN-CANCELDAYS` | Override Protection Plan Cancellation Restriction Days | Override cancellation restriction days in Protection Plan Settings. | |
| `SEC-SLS-PPLAN-LIMITS` | Override Protection Plan Limitations | Override plan minimum/maximum/quantity limitations. | |
| `SEC-SLS-ROUTE-OVR` | Override Route on Sales and Service Transactions | Manually change route code on the Customer page of Enter a Sales Order / Return / Exchange (`Route`) and Enter a Service Order (`Service Route`). | **Existing users/groups default checked; NEW users/groups default unchecked.** |
| `SEC-SLS-AUTOXFER-MANIFEST` | Override restriction of line updates once a linked auto transfer has been manifested | Override `Prohibit changes to lines once an associated auto-transfer has been manifested`. | See Third Party Logistics. |
| `SEC-SLS-QUOTECONV-DISC` | Override Sales Quote Conversion Discount Restriction | Convert a quote with a discount code before the advertised sale's start date. | Else override required. |
| `SEC-SLS-SAMEDAY-PICKUP` | Override Same Day Pickup Restrictions | Override same-day pickup restrictions. | Evaluated for locations with `Prohibit Customer Personal Information when not Required by Sale` checked. |
| `SEC-SLS-SOFTKIT-OVR` | Override soft kit restrictions | Override `Adjust Soft Kit in Order Entry` (POS Control Settings). | |
| `SEC-SLS-DELIVDATE-AVAIL` | Override delivery date restrictions based on available date | Assign delivery dates for out-of-stock merchandise before the next available date, incl. Purchase Delivery Pad Days. | Only when `Restrict Delivery Date Based On Available Date` is active. |
| `SEC-SLS-FUTURESCHED-OVR` | Override future scheduling restriction | Security-override a scheduled date beyond `Restrict Scheduled Date`. | **Unchecked by default.** Setting lives in Warehouse/Store Location Settings or POS Control Settings. |
| `SEC-SLS-DELIVCHG-OVR` | Override system calculated delivery charges | Manually override calculated delivery/pickup charges. | Also unlocks `Remove Delivery Override Flag` on the Payment tab; also examined when continuing an order that fails the minimum delivery purchase. |
| `SEC-SLS-RESTOCKFEE-OVR` | Override system calculated restocking fee | Override the calculated restocking fee in Enter a Return / Enter an Exchange. | **Default checked.** |
| `SEC-SLS-DISC-MINPURCHASE` | Override the Minimum Purchase Requirements on Discounts | Apply a coupon/discount code below `Minimum Subtotal Required`. | Else manager override. |
| `SEC-SLS-DISC-COMBINE` | Override the Restrictions on Combining Line and Subtotal Discounts | Combine a line discount with a coupon/subtotal discount code. | |
| `SEC-SLS-REWARDGC-ISSUER` | Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers | Override `Must be Redeemed By Customer Who Was Issued Gift Certificate` (Membership Reward Settings). | **Unchecked by default.** |
| `SEC-SLS-MEMBERPROD-RTN` | Override Restricting Membership Products on Return | Allow a membership product onto a return after override. | **Unchecked by default. Downstream member-only discounts, free/reduced delivery and reward certificates must then be adjusted MANUALLY.** |
| `SEC-SLS-PPLAN-REMOVE-AUTO` | Protection Plans - Allow Removal of Auto Added Plans | Save new orders where qualified lines are not covered by a protection plan. | **Default checked. Only applies when `Require Security to Override` is checked in POS Control Settings.** |
| `SEC-SLS-PPLAN-MGRONLY` | Protection Plans - Allow Sale of Manager Only Plans | Provide the required security to override the sale of manager-only plans. | **Unchecked by default.** |
| `SEC-SLS-VENDOR-SEARCH` | Search for vendors, view vendor name and model numbers | Vendor info via Vendor Name Search, Search for a Product, View Product Availability. | Blank ⇒ Vendor Name Lookup blocked (codes still typeable) and `Vendor Model`, `Vendor`, `Display` inactivated in Advanced Product Lookup. |
| `SEC-SLS-SELL-FLOORSAMPLE` | Sell designated floor sample merchandise | Add floor-sample as-is items matching the `Floor Sample` reason code (Inventory Control Settings). | Unauthorized ⇒ warning + block; **an authorized override writes the authorizing user into the audit file.** |
| `SEC-SLS-SELL-KITCOMPONENT` | Sell kit component products separately from their assigned kit | Enter "kit only" components on orders in any quantity. | **Overrides a checked `Kit Component` box in Advanced Product Settings.** |
| `SEC-SLS-CUSTNAME-EDIT` | Update a Customer Address-Modify Customer Name | Governs `Prefix, First, Middle, Last Name, Suffix` and Alternate Name `First, Middle, Last Name` in Update a Customer Address. | **Default checked.** Else override prompt. |
| `SEC-SLS-UPDATE-SCHED-ORDER` | Update a delivery order with a scheduled status | Update a delivery-scheduled order/exchange. | Without it and without override ⇒ **view mode only**. |
| `SEC-SLS-UPD-SPECORD-PO` | Update special order line item linked to PO not on hold | Update order quantity on a special-order line linked to a not-on-hold PO. | **If the PO IS on hold, all users may update regardless.** Unchecked ⇒ quantity locked, `Remove` inactive, special-order entry read-only. |
| `SEC-SLS-VMOO-EXCHANGE` | View and Manage Open Orders - Maintain Exchanges | Manage exchanges via View and Manage Open Orders. | **Unchecked by default.** Does not affect read-only viewing. Collapse candidate. |
| `SEC-SLS-VMOO-RETURN` | View and Manage Open Orders - Maintain Returns | Manage returns there. | **Unchecked by default.** Collapse candidate. |
| `SEC-SLS-VMOO-SALESORDER` | View and Manage Open Orders - Maintain Sales Orders | Manage sales orders there. | **Unchecked by default.** Collapse candidate. |
| `SEC-SLS-VMOO-TRANSFER` | View and Manage Open Orders - Maintain Transfers | Manage transfers there. | **Unchecked by default.** Collapse candidate. |
| `SEC-SLS-VIEW-ENCRYPTED-ACCT` | View encrypted finance, credit card, check account numbers | View account numbers unmasked on re-access; enables `Account Number Full Display` self-unmask via the Access Control Window. | **Field-level redaction (§4). "STORIS no longer stores full credit card numbers, credit card numbers cannot be decrypted."** |
| `SEC-SLS-DEL-ORDERS` | *(Deletion of Existing Sales Documents →)* **Orders** | `All` / `None` / `Without Money`. | Regular sales orders only. |
| `SEC-SLS-DEL-EXCHANGES` | *(Deletion of Existing Sales Documents →)* **Exchanges** | `All` / `None` / `Without Money`. | |
| `SEC-SLS-DEL-RETURNS` | *(Deletion of Existing Sales Documents →)* **Returns** | `All` / `None` / `Without Money`. | |
| `SEC-SLS-DEL-LAYAWAYS` | *(Deletion of Existing Sales Documents →)* **Layaways** | `All` / `None` / `Without Money`. | |
| `SEC-SLS-VIEW-ALL-SALES` | View All Sales Information | `No` = own sales only (Salesperson fields inactive, own ID defaults in). `Yes` = all accessible locations (`Store` field becomes active). `Store` = current store only. | **Gate: `Sales Security Access` must be checked on the Advanced page of POS Control Settings for this field to be reachable.** |
| `SEC-SLS-DELIVCONTACT-CODES` | Delivery Contract Status Codes | Which Delivery Contact Status codes the user may select on an order, return or exchange. | **Blank = ALL codes allowed** (contrast `SEC-AR-CREDITHOLD-CODES`, where blank = none). Multi-select with Select All / Deselect All. |
| `SEC-SLS-MAX-PRICE-VARIANCE` | Maximum Price Variance | Max percentage a price override may deviate from the calculated price. Null or `0`–`100`. | Null ⇒ no limit (a user with `Override Transactions Entry Exceptions` may go to 100%). `100` ⇒ discount up to 100%. **`0` is ambiguous in the source — `[DECISION NEEDED]`, recommend `0` = no deviation permitted.** |

---

## Purchasing (`PO`) — from `SEC-006`

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-PO-REPLEN-PRODSET` | Access product settings during the replenishment process | Advanced Product Settings via Actions at the bottom of the Items for Replenishment Screen. | *"The restriction at the Actions button can be overridden by users with proper security clearance."* |
| `SEC-PO-VIEW-COMMENTS` | Access the Comments tab from View a Purchase Order | Comments tab in View a Purchase Order. | |
| `SEC-PO-CONFIG-COST` | Change Total Cost on a Configured Product | Change `Unit Cost` for a configured product during PO entry. | **"This setting does not override any other rules or settings regarding purchase order costs."** |
| `SEC-PO-PAYBEFORE-RECEIPT` | Change purchase order Pay Before Receipt setting | Change `Pay Prior to Receipt` on the Totals tab of Enter a Purchase Order. | **"Document comments are generated for all security overrides."** |
| `SEC-PO-REPLEN-NOTHOLD` | Create replenishment purchase order not on hold | POs from Replenish Inventory for Current Back Order Needs that do not default to hold. | Blank ⇒ such POs are placed on hold. |
| `SEC-PO-NEWPROD` | Create new products within purchase order entry | Products on-the-fly in Enter a Purchase Order **and** the editable Product file via `Review Product Settings`. | Blank ⇒ no on-the-fly creation **and** `Review Product Settings` is read-only. **Split into two permissions for us.** |
| `SEC-PO-SOPOS` **(existing)** | Create special order purchase orders within POS entry | POs on-the-fly in order entry for special-order products. | **Reused from the Inventory pack. `Purchase Order/Assignment Required` in Special Order Control Settings OVERRIDES this — if checked, everyone must create a PO or reserve inventory regardless.** |
| `SEC-PO-STOCKPOS` | Create stock product purchase orders within POS entry | POs on-the-fly in order entry for stock products. | Interacts with `PO From Order Entry` (Product Settings): **this flag suppresses the zero-stock "create a PO?" prompt.** |
| `SEC-PO-DS-ADDLINE` | Direct Ship - Add a New Line to a Direct Ship Purchase Order | Add a new sales-order line to a direct-ship PO. | **The new line auto-links to the same sales order as the existing lines.** |
| `SEC-PO-DS-DELETE` | Direct Ship - Delete a Direct Ship Purchase Order or a Direct Ship Purchase Order Line | Delete direct-ship lines linked to a PO, or the entire PO. | |
| `SEC-PO-EDIT-EDI` **(existing)** | Edit EDI purchase orders that were electronically submitted | Edit POs already submitted electronically to manufacturers/vendors. | **Reused from the Inventory pack.** Explicitly paired with `SEC-PO-EDIT-SENT`. |
| `SEC-PO-EDIT-SENT` **(existing)** | Edit purchase orders that have been printed or emailed | Edit POs submitted by print or email. | **Reused from the Inventory pack. Default checked. Unchecked ⇒ message and stop — no override path described. HARD DENY.** |
| `SEC-PO-EDIT-BUYERSHEET` | Edit purchase orders within the Full Buyer's Worksheet | Access and edit an existing PO from the Purchasing tab of Product Performance and Purchase Recommendations. | Unchecked ⇒ Purchase Order Inquiry (read-only) only. |
| `SEC-PO-EDI-SUBMIT-POS` | Electronically submit (EDI) purchase orders within POS entry | Submit POs via EDI from Sales Order Entry. | |
| `SEC-PO-REDUCE-SPECORD` | Reduce Special Order quantities on Purchase Orders linked to a Sales Order | Remove PO lines for special-order products linked to a sales order, reduce line quantity, or delete the whole PO. | |
| `SEC-PO-REDUCE-BELOW-BILLED` | Reduce purchase quantity below billed quantity | Reduce ordered quantity linked to a **paid Pending Bill** below the billed quantity. | Creates a bill/receipt mismatch — high-risk. |
| `SEC-PO-REOPEN-CLOSED` | Reopen a Closed Purchase Order | Open closed POs in Enter a Purchase Order. | |
| `SEC-PO-UPD-REPLCOST` | Update product replacement or special order option cost within purchase entry screens | Update replacement costs from Purchase Order Entry, Purchase Order Acknowledgement, Product Performance and Purchase Recommendations, Enter Special Order Options. | Checked ⇒ editing `Unit Cost` prompts to push into `Replacement Cost`. **Same field is also writable under `SEC-PAY-REPLCOST` — unify into one Inventory-owned permission.** |
| `SEC-PO-VIEW-EXPRECEIPT` | View expected receipt date for a product | Expected receipt date in View Product Activity and View Product Availability. | |
| `SEC-PO-VIEW-TRUEDELIV` | View True PO Delivery Date | **Excludes purchase delivery pad days** from purchase-lead-day calculation, showing the "true" date. | A data-transformation permission, not an access grant. Classify separately. |
| `SEC-PO-HOLD-CREATE` | Create Manual Purchase Order On Hold | `Always` / `Never` / `Threshold`. Applies only when a new PO is created with `On Hold` unchecked. | `Always` ⇒ forced on hold and the box is **inaccessible**. `Threshold` ⇒ auto-hold above the amount, with warning *"Sub Total exceeds your threshold of xxxx, purchase order will be placed on hold."* |
| `SEC-PO-HOLD-CREATE-AMT` | Threshold Amount *(for Create Manual Purchase Order On Hold)* | Ceiling before auto-hold. | **Unavailable until mode = `Threshold`, then MANDATORY. "any integer greater than or equal to zero" — integer dollars; use minor units for us.** |
| `SEC-PO-HOLD-RELEASE` | Take Purchase Order Off Hold | `Always` / `Never` / `Threshold`. Applies when opening an existing PO with `On Hold` checked. | `Threshold` ⇒ subtotal below the amount processes; above ⇒ override offered and **an audit comment is recorded**; no override ⇒ entry rejected. |
| `SEC-PO-HOLD-RELEASE-AMT` | Threshold Amount *(for Take Purchase Order Off Hold)* | Ceiling for release without override. | **Independent of the create threshold.** Mandatory once mode = `Threshold`. |

---

## Payables (`PAY`) — from `SEC-004`

**Module gate:** *"These settings are available only if AP, GL or TPA is active."*

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-PAY-GL-ACCTSETTINGS` | Access General Ledger Account Settings | Grants all five GL routines: `Cost Center Settings`, `Sub-Account Settings`, `Accounts Settings`, `General Ledger Period Settings`, `General Ledger Control Settings`. | Unchecked ⇒ Access Control Window demands a permitted user's ID and password. **Five capabilities on one flag — split for us.** |
| `SEC-PAY-APPROVE-REFUNDBILL` | Approve refund bills | Approve customer refund bills in Select and Approve Bills for Payment. | **Default checked.** New batch ⇒ `Customer Refund` defaults unchecked and prompts for override. Existing batch already containing refunds ⇒ override mandatory to continue. **Default to DENY for us.** |
| `SEC-PAY-EXCHRATE` | Change exchange rate during vendor invoice entry | `Exchange Rate` in Enter/Update Individual Vendor Invoice. | |
| `SEC-PAY-TERMS` | Change invoice payment terms during vendor invoice entry | `Terms` on the Check Information tab of Enter/Update Individual Vendor Invoice. | Unchecked ⇒ Access Control Window (initials + password). |
| `SEC-PAY-REPLCOST` | Change product replacement cost during vendor invoice entry | Editing `Unit Cost` offers to push it into `Replacement Cost` (Advanced Product Settings). | **Only regular merchandise bills (`Merchandise/Invoice`, `Direct Ship/Invoice`), excluding special-order processing on those orders.** Overlaps `SEC-PO-UPD-REPLCOST`. |
| `SEC-PAY-RECON-BALANCE` | Change reconciliation beginning balance in Bank Settings | `Beginning Balance` on the Reconciliation tab of Bank Settings. | **Also permits Purge Reconciled Transactions — a destructive action bundled behind a balance edit. SPLIT for us.** |
| `SEC-PAY-BILLDATE` | Change transaction entry date for new payable bills | Change the transaction date on new payable bills. | *"you can prevent users from back-dating AP bills."* Blank ⇒ must accept the default date. |
| `SEC-PAY-NEWVENDOR` | Create new vendors during vendor invoice entry | Vendors on-the-fly during invoice entry. | |
| `SEC-PAY-REMITTO` | Create vendor remit-to addresses during vendor invoice entry | Vendor remit-to records on-the-fly. | Unchecked ⇒ Access Control Window. **Also restricts temporarily overriding the customer's remit-to address for the current bill (Update Customer Remit-To).** Payment-redirection risk — treat as high-sensitivity. |
| `SEC-PAY-DEL-TPA-BILLS` | Delete payable bills after third party accounting transmission | Delete transmitted AP bills **including customer refunds**. | **Active only if TPA is active in General System Control Settings.** |
| `SEC-PAY-PRINT-APCHECKS` | Print accounts payable checks | Print AP checks. | |
| `SEC-PAY-PRINT-REFUNDCHECKS` | Print refund checks | Print customer refund checks in Select and Approve Bills for Payment and Print Checks. | **Default checked.** Not enabled + batch contains refunds ⇒ override required to reach Print Checks. **Default to DENY for us.** |
| `SEC-PAY-ALT-PAYMETHOD` | Select alternate payment methods during vendor invoice entry | Alternate payment methods in vendor invoice entry. | |
| `SEC-PAY-UPD-EXPORTED-RUN` | Update an exported check run | Update an exported check run in Select and Approve Bills for Payment. | **Without it the process opens in query mode — no updates or deletions.** |
| `SEC-PAY-VIEW-ENCRYPTED-ACCT` | View encrypted AP account numbers | View `Account Number` on the General tab of Bank Settings. | **Field-level redaction (§4) — otherwise the program encrypts the field.** |

---

## Receivables (`AR`) — from `SEC-007`

### Credit applications & scoring

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-ACCESS-3PFINANCE` | Access credit applications for Third Party On-Line financing | Existing credit applications from third-party providers. | Enumerated providers: `CitiFinancial`, `Wells Fargo`, `GE Capital`, `Encompass`, `Capital One`, `TD Bank`. |
| `SEC-AR-ACCESS-EMPCREDIT` | Access employee credit applications and score reporting | Credit applications for **employee** customers, plus scores and SSNs. | **Prerequisite for the same-named flag in `PII`.** |
| `SEC-AR-ACCESS-OTHERCREDIT` | Access other credit applications and score reporting | Credit applications for **non-employee** customers via Request Credit Information, plus scores and SSNs. | **When unchecked, Review Pending and Review Pending on Hold deny access even to the initiating salesperson.** |
| `SEC-AR-ACCESS-REQCREDITINFO` | Access credit applications - Request Credit Information | Narrow carve-out: update a credit application via Request Credit Information only, for users lacking the above. | **Unchecked by default.** Documented back door: a user with none of these may still re-access an application **they created**, while it is **open** and the salesperson code matches; once approved or declined, all restrictions apply. |
| `SEC-AR-DUEDAY-CHANGE` | Allow Due Day Change | `Due Day` in Advanced Customer Settings **when the customer has an active balance**. | **Unchecked by default. If the customer has NO active balance the due day changes with no override at all.** Permitted users may self-override with their initials. |
| `SEC-AR-UPD-CREDITSCORE` | Update Customer's credit score | `Primary` / `Co-applicant Credit Score` in Customer Credit and Scoring Information. | |
| `SEC-AR-UPD-BANKRUPTCYSCORE` | Update bankruptcy score | `Primary` / `Co-applicant Bankruptcy Score`. | |
| `SEC-AR-UPD-CLASSIFICATION` | Update Scoring classification | `Classification`. | |
| `SEC-AR-UPD-CREDITSOURCE` | Update credit source | `Credit Source`. | |
| `SEC-AR-UPD-LIEN` | Update Customer lien requests | `Request a Lien`. | |
| `SEC-AR-UPD-CREDITLIMIT` | Update Customer's Credit Limit | `Customer Credit Limit` and `Co-signer Credit Limit`. | Required alongside `SEC-AR-MAXCREDITLIMIT`. |
| `SEC-AR-UPD-CREDITHOLD` | Update Manually Entered Customer Credit Holds | `Place Credit Hold`. | |
| `SEC-AR-UPD-WEBLOCK` | Update Customer's Web Lock | `Web Access Locked` on the eSTORIS tab of Advanced Customer Settings. | |
| `SEC-AR-UNLIMITED-CREDIT` | Establish unlimited credit limit for customer | Enter a **null** credit limit = unlimited credit. | **Mutually exclusive with `SEC-AR-MAXCREDITLIMIT` — enforce as a save-time constraint, not a note.** |
| `SEC-AR-APPROVE-F4HOLD` | Approve F4 credit holds placed on financed orders | Remove F4 credit holds. | |
| `SEC-AR-REVPEND-APPROVE-SO` | Review Pending Credit Request - Manually approve linked sales order | Manually approve an order linked to a credit request after approving the request (e.g. limit $1000, order $1100). | Works with the `Installment Credit Approval Limits` sub-screen. |
| `SEC-AR-REMOVE-COAPPLICANT` | Remove Co-applicant from Credit Application | Remove the co-applicant when the primary account has a receivable balance on file. | **Default checked.** |
| `SEC-AR-OVERRIDE-FINQUEUE` | Finance Application - Override finance queue | Override the FR Application Queue's automatic provider selection. | **Unchecked by default.** |
| `SEC-AR-RESUBMIT-SETTLEMENT` | Review and resubmit failed finance settlement batches | `Resubmit Settlement Errors` in Finance Receivables. | |

### Customer & deposit maintenance

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-CUST-STORELOC` | Advanced Customer Settings - Change customer store location | Change a customer's store location. | **Does not affect Reassign a Customer's Store Location.** |
| `SEC-AR-CUST-CREATE` | Advanced Customer Settings - Create new customer | Create customers via Customer Settings / Advanced Vendor Settings. | **Does not apply to on-the-fly creation.** |
| `SEC-AR-DUP-SSN` | Override Duplicate Social Security Number Restriction | Override `Allow Duplicate Social Security Numbers` (AR Control Settings). | **Also applies to co-applicant SSNs.** |
| `SEC-AR-MCB-REFUND` | Maintain Customer Balances - Refund | Refund Action fields on the **Keyoffs tab**. | |
| `SEC-AR-MCB-CHARGEOFF` | Maintain Customer Balances - Charge off an Account Balance | **Bad Debt tab** ("Bab Debt" in source). | |
| `SEC-AR-MCB-KEYOFF` | Maintain Customer Balances - Key Off a Credit/Debit Balance | **Key-Offs tab**. | |
| `SEC-AR-MCB-MANUALADJ` | Maintain Customer Balances - Manually Adjust an Account Balance | **Manual Adjustments tab**. | |
| `SEC-AR-MCD-APPLY` | Maintain Customer Deposits - Apply | `A` (Apply) at the `Action` field. | |
| `SEC-AR-MCD-CHECKREFUND` | Maintain Customer Deposits - Check Refund | `R` (Check Refund). | |
| `SEC-AR-MCD-FINCREDIT` | Maintain Customer Deposits - Finance Credit | `F` (Finance Credit) — removes a financed deposit and credits finance receivables. | |
| `SEC-AR-MCD-IMMEDREFUND` | Maintain Customer Deposits - Immediate Refund | `I` (Immediate Refund) — original payment type. | **The payment type must also be active at `Immediate Deposit Refund Types` in AR Control Settings.** |
| `SEC-AR-MCD-ONACCOUNT` | Maintain Customer Deposits - On-Account | `O` (On-Account). | |
| `SEC-AR-DEPOSIT-OVERPAY` | Apply a Deposit Greater than the Balance Due | Deposits exceeding the balance due. | **Unchecked by default. Only consulted when `Deposit Overpayment Allowed` is checked in AR Control Settings.** |
| `SEC-AR-OVERPAY-CHARGEDOFF` | Overpay Charged Off Accounts | Overpay charged-off accounts. | **Unchecked by default. Only when `Allow Overpayments on Charged Off Accounts` is enabled in AR Control Settings.** |
| `SEC-AR-MAXCASHREFUND-OVR` | Override Daily Maximum Cash Refund Per Customer | Override the AR Control Settings daily cash refund cap. | Messages verbatim: *"The maximum cash amount allowed for a refund is $XXXX.XX. Continue?"* / *"The customer has exceeded the Daily Maximum Cash Refund Per Customer amount by $XXXX.XX. Continue?"* Unchecked ⇒ manager initials + password. |
| `SEC-AR-PREAUTH-INCREASE` | Override Pre-Authorized Deposit Amount Increase Limit | Increase a pre-authorized deposit beyond `Amount Increase Limit` (EMV tab, Payment Card and Device Settings). | Requires username + password in the Access Control Window. |

### Payment entry & refunds

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-PAY-NOAUTOPAY` | Apply payments without Autopay | Apply payments to open items/revolving with or without Auto Pay. | **Applies only to Enter a Customer Payment/Refund/Gift Certificate — NOT Enter a Customer Payment.** |
| `SEC-AR-BACKDATE-PAYMENTS` | Backdate Payments | Backdate payments within an open sales month to dates not yet closed. | Else override required. |
| `SEC-AR-FINANCE-PAYMENT` | Enter a customer finance payment | Payments received from customers for financed orders. | |
| `SEC-AR-NEG-FINPAYMENT` | Enter a negative customer finance payment after settlement | Negative finance receivables payments after settlement. | Accounting-correction path; high-risk. |
| `SEC-AR-CASHBAL-MGR` | Enter payments during cash balancing approval by manager | Reach the payment screen via `Cash Post` from Balance Approval by Manager. | |
| `SEC-AR-CASHBAL-CASHIER` | Enter payments during cash balancing by cashier | Enter payments via the payment programs. | **Inert unless `Balance By` = `Cashier` in Cash Balancing Control Settings.** |
| `SEC-AR-REFUND-DEPOSIT` | Enter a Payment/Refund/Gift Certificate - Issue Deposit Refund | Process deposit refunds. | |
| `SEC-AR-REFUND-CHECK` | Enter a Payment/Refund/Gift Certificate - Issue Refund by Check | `Issue Refund By` = check. | |
| `SEC-AR-REFUND-GIFT` | Enter a Payment/Refund/Gift Certificate - Issue Refund by Gift | `Issue Refund By` = gift card/certificate. | |
| `SEC-AR-REFUND-OTHER` | Enter a Payment/Refund/Gift Certificate - Issue Refund by Other | `Issue Refund By` = any other method. | |
| `SEC-AR-REFUND-GIFTBALANCE` | Enter a Payment/Refund/Gift Certificate - Refund Gift Balance | Refund gift card/certificate balances. | **Works with `Refund Gift Balance` in AR Control Settings, which decides whether the system issues such refunds at all.** |
| `SEC-AR-EDIT-FINPROV-AMT` | Edit a finance provider payment amount after batch selection | `Amount` in Apply Payments From Finance Provider. | |
| `SEC-AR-DEFAULT-PAYAMT` | Receive a Default for the Payment Amount | Default the payment amount into the Payment Summary / payment entry window. | Blank ⇒ the user must type the amount. UX-flavoured but affects miskeying risk. |
| `SEC-AR-LEGAL-PAYOVERRIDE` | Legal Settings - Override Payment Restrictions | Post payments to customers with legal codes set to refuse payments. | Applies across seven named entry processes. **NOT available for eSTORIS, eBridge or Import Customer Payment — those fail with an error code.** |
| `SEC-AR-IMPMISAPPLY` | Import Customer Payments - Misapply Payments | `Misapply Payments` on the Selection tab of Import Customer Payments. | **Unchecked by default.** Layers on top of the `Import Customer Payments` row in `IMP`. |
| `SEC-AR-MANUAL-EXTCC-AUTH` | Allow Manual External Credit Card Authorization | Manually authorize external credit card transactions. | |
| `SEC-AR-EMV-MANUAL-ENTRY` | EMV-Allow Manual EMV Credit Card Entry | Manager-override capability for manual credit card entries. | **Unchecked by default.** |
| `SEC-AR-TYPE-CCNUM` | Type in credit card numbers if using online processing | Manual keying of card numbers. | **"This is for Legacy credit card processing only."** |
| `SEC-AR-TYPE-CHECKNUM` | Type in checking account numbers if using online processing | Manual keying of checking account numbers. | |
| `SEC-AR-TYPE-FINACCT` | Type in finance account numbers if using online processing | Manual keying of finance account numbers. | |
| `SEC-AR-TYPE-AUTHNUM` | Type in authorization numbers for financed orders | Manual keying of authorization numbers under electronic financing. | |
| `SEC-AR-TYPE-GIFTNUM` | Type in Gift Certificate/Card number during payment entry | Key rather than swipe a gift card. | **Without it, POS barcode scanner input is still accepted — the system counts scanner input as "non-manual".** |
| `SEC-AR-TYPE-NEWGIFTNUM` | Type in new gift card numbers if card swiping is required | Overrides `Require Swipe for Gift Certificates?` (AR Control Settings). | |
| `SEC-AR-VIEW-GIFTPIN` | View Encrypted Gift Card PIN | View a gift card's full PIN in View a Gift Certificate. | **Unchecked by default. Field-level redaction (§4).** |
| `SEC-AR-COLLECTOR-AUTODISPLAY` | Collector Review - Automatic Display of Customer User Defined Settings | Auto-open User Defined Settings on customer select in Collector Review - Customer Update. | **Unchecked by default. This is a UI preference, not a permission — move it out of the security model.** |

### Installment receivables

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-INST-GRACEDAYS` | Installment - Add Contract Grace Days | Manage and Adjust Installment Contracts > Adjust Payment Terms. | |
| `SEC-AR-INST-ADJBALANCE` | Installment - Adjust a contract balance | > Adjust a Contract Balance. | |
| `SEC-AR-INST-STATUS` | Installment - Change a contract status | > Update Contract Status. | |
| `SEC-AR-INST-ACTEXPDATES` | Installment - Contract Activation/Expiration Dates | Override activation/expiration dates in > Installment Worksheet. | |
| `SEC-AR-INST-EXCL-AUTOPAY` | Installment - Exclude Contracts from Auto Pay | `Exclude Contracts from Auto Pay` on Adjust Payment Terms. | |
| `SEC-AR-INST-EXTENDMONTHS` | Installment - Extend Contract's Number of Months | > Adjust Payment Terms. | |
| `SEC-AR-INST-FORGIVE-LATEFEE` | Installment - Forgive Late Fees on a payment due | > Forgive Late Fees. | |
| `SEC-AR-INST-MERGE` | Installment - Merge Contracts | > Installment Worksheet. | |
| `SEC-AR-INST-REFINANCE` | Installment - Refinance Customers | > Installment Worksheet. | |
| `SEC-AR-INST-MA-CREDITREVIEW` | Installment - Manage and Adjust - Credit Request Review | Extra-action button. | Without permission **the button is not active** (client-side gating — enforce server-side for us). |
| `SEC-AR-INST-MA-SALESORDER` | Installment - Manage and Adjust - Enter a Sales Order | Extra-action button. | Same. |
| `SEC-AR-INST-MA-REQCREDIT` | Installment - Manage and Adjust - Request Credit Information | Extra-action button. | Same. |
| `SEC-AR-INST-MA-TAKEPAYMENT` | Installment - Manage and Adjust - Take a Payment | Extra-action button. | **Which payment screen opens is set by `SEC-AR-INST-PAYMETHOD`.** |
| `SEC-AR-INST-RTN-CANCELDAYS` | Installment - Override Customer Return Automatic Cancellation Days | Override the auto-cancel window after a customer return in Enter a Return. | **Blank ⇒ the user cannot enter financing on a return at all and the credit goes on account.** |
| `SEC-AR-INST-DEFERFEE` | Installment - Override Deferment Fee | > Defer Installment Payments. | |
| `SEC-AR-INST-DEFERSETTINGS` | Installment - Override Deferment Settings | Override the deferment count limit. | Blank ⇒ limited by `Defer [] Payments Within a Rolling 12 Month Period` (Installment Receivables Control Settings). |
| `SEC-AR-INST-DUEDAY` | Installment - Override Due Day | Override the default due day in the Installment Worksheet. | |
| `SEC-AR-INST-DUEDAY-CHANGE` | Installment - Override Due Day/Change Settings | Change `Due Day` on Adjust Payment Terms. | **Permits changing ANY customer's due day. Field unavailable if the customer has a past due balance.** |
| `SEC-AR-INST-REVOKE-SAC` | Installment - Override Revoke Same as Cash Terms | Override revocation of "same as cash" on payoff. | **Unchecked by default.** Bounded by `Revoke Same as Cash After ___ Late Fees` (Installment Payment Plan Settings). |
| `SEC-AR-INST-BACKDATE-PAYOFF` | Installment - Override the Maximum Days for Back-Dating Payoffs | Applies in Enter a Customer Payment and Enter a Customer Payment/Refund/Gift Certificate. | |

### Revolving receivables

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-REV-INSURANCE-EDIT` | Change or remove insurance on a customer's revolving plan | Change/remove insurance on a revolving plan. | **Does not apply to initial entry of an insurance code. If `Insurance Required` is enabled in Revolving Receivables Control Settings, insurance cannot be removed from an existing plan at all.** |
| `SEC-AR-FR-ADJ-PARTIAL` | Finance Receivables - Allow Adjustments After Partial Completion | Controls `Contracts - Allow Adjustments after Partial Completion` in Finance Provider Settings. | Same-named flag also in `SLS`. |
| `SEC-AR-FR-PLAN-ELIGIBILITY` | Finance Receivables - Override Plan Eligibility Restrictions | Apply a promotional finance plan whose eligibility restrictions are unmet. | **Answering Yes puts the order on `F4` credit hold and saves it** (clear via Update Financing Credit Approvals). |
| `SEC-AR-REVR-CLASSCODE` | Revolving Payment Plan Restrictions - Override Classification Code Restriction | Approve a plan when the customer's Revolving Classification Code does not match. | |
| `SEC-AR-REVR-LOCATION` | Revolving Payment Plan Restrictions - Override Location Restrictions | Manually enter a location-restricted plan at `Financing Payment Type Code`. | **Unchecked by default.** |
| `SEC-AR-REVR-MAXSCORE` | Revolving Payment Plan Restrictions - Override Maximum Credit Score | Same, max-credit-score restriction. | **Unchecked by default.** |
| `SEC-AR-REVR-MINSCORE` | Revolving Payment Plan Restrictions - Override Minimum Credit Score | Same, min-credit-score restriction. | **Unchecked by default.** |
| `SEC-AR-REVR-MINDEPOSIT` | Revolving Payment Plan Restrictions - Override Minimum Deposit Amount | Same, minimum deposit amount/percentage. | **Unchecked by default. NOT re-evaluated on the open part of a partially invoiced order unless a material change is made.** |
| `SEC-AR-REVR-MINFINANCED` | Revolving Payment Plan Restrictions - Override Minimum Financed Amount | Same, minimum financed amount. | **Unchecked by default. Same non-re-evaluation exception. "When credentials are supplied in a security override, an audit comment is logged."** |
| `SEC-AR-REVR-PASTDUEDAYS` | Revolving Payment Plan Restrictions - Override Past Due Days | Same, past-due-days restriction. | **Unchecked by default.** |
| `SEC-AR-REVR-ACTIVEDATES` | Revolving Payment Plan Restrictions - Override Plan Active Dates | Same, plan active dates. | **Unchecked by default.** |
| `SEC-AR-RTC-ADDPLAN` | Revolving Terms and Conditions - Add a New Plan | Add a new plan in Enter a Customer's Revolving Terms & Conditions. | Blank ⇒ may edit existing plans but not add. |
| `SEC-AR-RTC-INSURANCE-ALL` | Revolving Terms and Conditions - Apply Insurance to All Plans | Propagate an insurance change to **all** the customer's plans on Save, with a warning and a prompt to print insurance letters per plan. | **Only meaningful for users who already hold `SEC-AR-REV-INSURANCE-EDIT`.** Without it, only the edited plan changes. |
| `SEC-AR-RTC-CLOSEPLAN` | Revolving Terms and Conditions - Close a Plan | `Closed` date field; closes an active plan to new activity. | Otherwise the field is inactive. |
| `SEC-AR-RTC-INCREASE-MMP` | Revolving Terms and Conditions - Increase MMP Amount | `MMP $` / `MMP % of Balance`. | |
| `SEC-AR-RTC-PAYAGREEMENTS` | Revolving Terms and Conditions - Maintain Payment Agreements | `Payment Agreement` global extra action. | **Only if Payment Agreements are active in both Revolving Receivables Control Settings and the Revolving Payment Plan.** |
| `SEC-AR-RTC-PROMOPLANS` | Revolving Terms and Conditions - Maintain Promotional Plans | Add/change promotional plans (no interest / no payments). | |
| `SEC-AR-RTC-LOWEST-MMP` | Revolving Terms and Conditions - Override Lowest MMP Allowed Restriction | Set plan MMP below the minimum in Revolving Payment Plan Settings. | **Unchecked by default.** |
| `SEC-AR-RW-ADDON-PCTPAID` | Revolving Worksheet - Override Required Percentage Paid for Add-On | Override `Required Percentage Paid before Add-on Allowed`. | |
| `SEC-AR-RW-REDUCE-MMP` | Revolving Worksheet - Reduce MMP Amount on Fixed MMP Plans | Reset MMP lower during worksheet entry. | **Only for plans calculating MMP `As a Fixed MMP Amount`.** |
| `SEC-AR-VAR-ADDINSURANCE` | View All Revolving Activity - Add Insurance | `Add Insurance` extra action in View All Revolving Plan Activity for a Customer. | **Only offered when NONE of the customer's active or pending plans have insurance; adds to all ACTIVE plans at once, not pending.** |
| `SEC-AR-VAR-ADJUSTPLANS` | View All Revolving Activity - Adjust Revolving Plans | Access and adjust plans from that screen. | |
| `SEC-AR-VAR-CREDITREVIEW` | View All Revolving Activity - Credit Request Review | `Review Credit` extra action. | **Additionally requires `SEC-AR-ACCESS-EMPCREDIT` and/or `SEC-AR-ACCESS-OTHERCREDIT`.** |
| `SEC-AR-VAR-SALESORDER` | View All Revolving Activity - Enter a Sales Order | Extra-action button. | Inactive without permission. |
| `SEC-AR-VAR-REQCREDIT` | View All Revolving Activity - Request Credit Information | Extra-action button. | Inactive without permission. |
| `SEC-AR-VAR-TAKEPAYMENT` | View All Revolving Activity - Take a Payment | Opens Enter a Customer Payment/Refund/Gift Certificate. | |
| `SEC-AR-VAR-HOLDCODES` | View All Revolving Activity - View Credit Status Hold Codes | View credit status hold codes in View All Revolving Plan Activity. | **Default checked. Unchecked ⇒ the user sees the literal string `"See Cashier"` in Credit Status Results — a degrade, not a block.** |

### Repossession

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-REPO-WAIVED-LET` | Repossession - Access Waived (LET) Items | Waived Item Select screen during repossession. | **Default checked. Unchecked ⇒ cannot include "Items Purchased Since Last Zero Balance Date" on Request Legally Entitled To (LET) Documents, cannot add waived items via Process Repossessed Items, and `Add Waived Items` in Original Document Select is inactive.** |
| `SEC-AR-REPO-LEGAL-OVR` | Repossession - Override Legal Setting for Allowing Repossessions | Post repossessions when the legal setting `Allow Repossession` is not checked. | Legally sensitive — require second signature in our model. |

### Non-boolean Receivables settings

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-AR-MAXCREDITLIMIT` | Set a Customer's Maximum Credit Limit to $ | Ceiling on the customer credit limit this user/group may set. | **Requires `SEC-AR-UPD-CREDITLIMIT`. Mutually exclusive with `SEC-AR-UNLIMITED-CREDIT` — "you cannot also set a maximum amount in this field."** |
| `SEC-AR-INST-PAYMETHOD` | Installment; Manage and Adjust Payment Method | Enum: `Enter a Customer Payment` \| `Enter a Customer Payment/Refund/Gift Certificate`. | Chooses which screen `SEC-AR-INST-MA-TAKEPAYMENT` opens. A routing setting, not an access grant. |
| `SEC-AR-PAYCLASS-ACCESS` | Payment Class Access — Cash, Checks, Credit Cards, Financing, Miscellaneous, Gift Cards, Debit Cards, Revolving, Installment | Permit/deny access to the payment types in each class when applying money to an order. | **All nine checked by default. INVERTED SEMANTICS INSIDE: within a permitted class, the Action button opens a list where a TICK means the user is NOT permitted to use that payment type (documented example: allow the Credit Cards class, tick `VISA` to deny VISA). Re-model as a pure allow-list at payment-type level.** |
| `SEC-AR-CREDITHOLD-CODES` | Credit Hold Queue Codes | Which hold codes appear on the Credit Hold Queue screen for this user. | **Blank ⇒ description reads `"No Credit Hold Codes"` and the user cannot access the Credit Hold Queue at all** (opposite of `SEC-SLS-DELIVCONTACT-CODES`, where blank = all). **Affects the Credit Hold Queue ONLY — not Update Receivables Credit Approvals or Update Financing Credit Approvals.** |
| `SEC-AR-INST-APPROVAL-LIMITS` | *(Actions →)* Installment Credit Approval Limits | Separate limits sub-screen reached from the Actions button. | Not documented in this article; interacts with `SEC-AR-REVPEND-APPROVE-SO`. **Treat as a separate requirement to be sourced elsewhere.** |

---

## Logistics (`LOG`) — from `SEC-003`

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-LOG-ADJ-DIRECT-ASIS` | Adjust Stock Directly to As-Is | **As-Is Adjustment tab** on Enter a Stock Adjustment. | |
| `SEC-LOG-ADJ-WMS-LOC` | Adjust inventory for locations when WMS is active | Stock adjustments, PO receipts, and order release for completion **at WMS locations**. | |
| `SEC-LOG-ADJ-QTY` | Adjust inventory quantities within stock adjustment entry | **Quantity tab** (increase/decrease QOH) and **Write-Off tab** (write off non-saleable goods). | Two capabilities in one flag — split for us. |
| `SEC-LOG-ASIS-RESTRICTED-RC` | Apply or Remove an As-Is Restricted Reason Code to Inventory | Assign/remove reason codes flagged "As-Is Restricted" in Reason Code Settings. | Otherwise an override is required. |
| `SEC-LOG-BYPASSXFER` | Bypass Transfer Security Settings | **Overrides `SEC-XFER-MATRIX` entirely** — *"Users that have this setting enabled are able to override security for users that are restricted."* | **Make this a named break-glass role for us, not an ordinary checkbox.** Any transfer-rights audit must read this first. |
| `SEC-LOG-PUTAWAY-LOC` | Change Directed Putaway Storage Location | Manually change putaway destination during directed putaway. | Else Security Override Screen. |
| `SEC-LOG-FLOORTAG-PRINTOPTS` | Change Floor Tag Print Options | `Form Name` / `Print Method` in the four floor-tag print routines (Inventory, Transfer, Barcode, Purchase Order). | |
| `SEC-LOG-SCH-BALANCEDUE` | Change Fulfillment Status to SCH with a Balance Due | Schedule delivery fulfillments for **unpaid** orders. | **If the same-named setting is enabled in POS Control Settings, ALL users get this and the per-user flag is not reviewed. If neither is enabled the order cannot be scheduled at all.** Global-wins semantics — report as `inert` in our engine. |
| `SEC-LOG-AUTOXFER-DATE` | Change auto transfer date to be greater than delivery date | Auto-transfer dates may surpass the linked order's delivery date. | Merchandise then arrives after the customer's date. |
| `SEC-LOG-COMPLETE-XFER` | Complete Merchandise Transfer | Complete a merchandise transfer. | |
| `SEC-LOG-COMPLETE-XFER-RECV` | Complete Transfer from Receiving Location Only | Restricts completion to users logged into the receiving location. | |
| `SEC-LOG-FREIGHT-BATCH` | Create a container freight batch | New freight batches via Receive a Purchase Order with a Separate Freight Bill. | |
| `SEC-LOG-MANIFEST-MIXED` | Create a manifest with both transfers and customer deliveries | Add merchandise transfers to a delivery manifest. | Manifest Routing feature. |
| `SEC-LOG-DEL-MANIFEST` | Delete an Entire Manifest | Delete a whole shipping manifest. | **Default checked.** Unchecked ⇒ override required. |
| `SEC-LOG-XFER-MULTILOC` | Distribute transfer quantities to multiple locations in one transfer | Multi-destination transfer entry. | |
| `SEC-LOG-ADJ-SOINFO` | Enter a Stock Adjustment - Change Special Order Detail on a Specific Piece | **SO Info tab** in Enter a Stock Adjustment. | Otherwise the tab is inactive. |
| `SEC-LOG-ADJ-ASIS-SPIFF` | Enter a Stock Adjustment - Update an as-is piece spiff table | `Spiff Amount` on the **Move to As-Is** and **As-Is Status** tabs. | Does not prevent creating spiff tables in Spiff Table Settings — applying them needs this. |
| `SEC-LOG-VENDOR-CHARGEBACK` | Enter vendor charge-back adjustments | **Vendor Chargebacks tab** in Enter a Stock Adjustment. | |
| `SEC-LOG-ROUTE-CAPACITY-SETUP` | Establish Route Capacity Control Settings | Route Capacity Control Settings; default delivery route cutoff parameters. | |
| `SEC-LOG-EXIT-PARTIAL-FLOAT` | Exit a partially unloaded float during picking | RF: exit unload before scanning all merchandise. | **Unloaded pieces retain their float links; only Review Float Status clears them.** Without permission ⇒ override. |
| `SEC-LOG-COUNTSHEET-QTY` | Generate count sheets with inventory quantity | Print count sheets showing inventory quantities. | **Unchecked ⇒ `Generate Blind Format` is auto-selected and unavailable — blind sheets only.** A degrade, not a block. |
| `SEC-LOG-FREEZE-PHYSINV` | Initiate the Freeze Physical Inventory process | Freeze Inventory (Physical Inventory Freeze). | |
| `SEC-LOG-MANUAL-RESERVE` | Manually reserve stock merchandise | Force/remove reservation of stock to an order line, via Additional Line Item Details (`Reserved Quantity`) and the Inventory Selection Screen (`Assign Pieces`). | **Overrides write the overriding user's ID into audit comments. NOT consulted by Reassign a Sales Reservation — that needs menu security.** |
| `SEC-LOG-CARTON-PO` | Override Complete Carton Requirements - Purchase Orders | Override the complete-carton rule when creating a PO. | **Implement as one permission with a leg parameter across the next five rows.** |
| `SEC-LOG-CARTON-S2S` | Override Complete Carton Requirements - Store to Store Transfers | Same, store→store. | |
| `SEC-LOG-CARTON-S2W` | Override Complete Carton Requirements - Store to Warehouse Transfers | Same, store→warehouse. | |
| `SEC-LOG-CARTON-W2S` | Override Complete Carton Requirements - Warehouse to Store Transfers | Same, warehouse→store. | |
| `SEC-LOG-CARTON-W2W` | Override Complete Carton Requirements - Warehouse to Warehouse Transfers | Same, warehouse→warehouse. | |
| `SEC-LOG-DISTSTATUS-XFER` | Override Distribution Status - Only at Selling Location for Transfers | Transfer products whose Advanced Product Settings distribution status is *"Only at Selling Store"*, **when the transfer originates from a warehouse**. | Else standard override prompt. |
| `SEC-LOG-XFER-CAPACITY` | Override Transfer Capacity Restrictions | Override transfer route restrictions **including scheduling transfers on over-capacity days**. | Else credential prompt. |
| `SEC-LOG-XFER-MAXSTOCK` | Override Transfer Restriction of Exceeding Maximum Stock Levels | Exceed max stock level in a transfer. | Else override required. |
| `SEC-LOG-ROUTECAP-CLOSED` | Override capacities when scheduling Delivery routes that are closed | Override volume / dollar amount / stops / units on **closed** routes. | |
| `SEC-LOG-ROUTECAP-FULL` | Override capacities when scheduling Delivery routes that are full | Same capacities on **full** routes. | |
| `SEC-LOG-POSTPONE-MAX` | Override maximum delivery date postponements for stores | Keep postponing delivery/pickup dates after auto-release. | **Active only if Auto Stock Release is active.** |
| `SEC-LOG-PRINT-PICKUPTICKET` | Print a customer pickup ticket within POS entry | `Print Pickup Ticket` (Enter a Sales Order) and `Print Exchange Ticket` (Enter an Exchange). | |
| `SEC-LOG-PRINT-DELIVTICKET` | Print a delivery ticket within POS entry | `Print Delivery Ticket`, `Print Exchange Ticket`, Print Delivery Tickets. | |
| `SEC-LOG-PRINT-XFERTICKET` | Print a transfer ticket within Transfer Entry | Pickup/delivery tickets from Enter a Transfer, incl. As-Is, Floor Sample, Move to As-Is, Stock. | |
| `SEC-LOG-FB-CLOSEBATCH` | Receive a Purchase Order with a Separate Freight Bill - Allow Close Batch | `Close Batches` option in that routine. | **Default checked.** |
| `SEC-LOG-FB-DIST-COST` | Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by Cost | Select `Cost` in `Freight Distribution by`. | **Implement the next three rows as one permission with an allowed-methods set.** |
| `SEC-LOG-FB-DIST-VOLUME` | Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by Volume | Select `Volume`. | |
| `SEC-LOG-FB-DIST-WEIGHT` | Receive a Purchase Order with a Separate Freight Bill - Freight Distribution by Weight | Select `Weight`. | |
| `SEC-LOG-FB-OVERRIDE-AMT` | Receive a Purchase Order with a Separate Freight Bill - Override Freight Amount | Change `Total Freight Amount` away from the Vendor Ship From Settings default. | **"Use of this security override is not recorded." — an unlogged override on a money field. UNACCEPTABLE; ours logs. Six-case override matrix in `user-security.md` `SEC-003`.** |
| `SEC-LOG-RECOUNT-STORAGELOC` | Recount Storage Location | Re-enter a count to **replace** rather than add to an existing count. | **Only applicable when `RF Physical Count – Use STORIS label as UPC` is checked in Warehouse/Store Location Settings.** |
| `SEC-LOG-SCH-UNRESERVED` | Schedule deliveries and pickups with unreserved merchandise | Apply SCH status to orders/exchanges with unreserved lines; **also applies to linked auto-transfers**. | **Checked on SAVE in Sales/Exchange Entry; on LINE UPDATE in Logistical Scheduling. With multiple fulfillments/dates, only the next delivery date is evaluated.** |
| `SEC-LOG-SCH-MIXEDROUTE` | Schedule deliveries and service orders for the same route | Mix delivery and service orders on one route. | |
| `SEC-LOG-ASIS-SELLPRICE` | Set or change As-is selling price within stock adjustment entry | Set/change the as-is selling price in Enter a Stock Adjustment. | |
| `SEC-LOG-SUPPLY-DEFAULTQTY` | Supply Default Quantities within Receive a Purchase Order | Controls the `Supply Default Quantities` checkbox in Receive a Purchase Order. | **Checked ⇒ defaults checked and editable. Unchecked ⇒ defaults unchecked and ticking it raises the Security Override Screen.** Applies to Receive Merchandise **and** Reverse a Receiving Error. Guards against blind receiving. |
| `SEC-LOG-ADJ-TRANSFER` | Transfer merchandise within stock adjustment entry | Move merchandise between locations inside Enter a Stock Adjustment. | Bypasses normal transfer entry — cross-check against `SEC-XFER-MATRIX`. |
| `SEC-LOG-MANIFEST-STATUSTIME` | Update status and stop time for an order on a manifest | Delivery contact status and stop time via Transaction Update – Logistical Scheduling. | |
| `SEC-LOG-UPD-MANIFESTED-AUTOXFER` | Update an Order with a linked Auto-Transfer on a Manifest | Update an order/exchange with a line linked to a manifested auto-transfer. | **Without it and without an override, the order opens read-only.** |
| `SEC-LOG-VIEW-ROUTECAL` | View a route's capacity calendar within POS entry | Read-only Route Capacity Settings via the Action button at `Next Date` in Enter a Sales Order. | Else Access Control Window. |
| `SEC-LOG-OVERRECEIVE` | Allow to Over Receive Merchandise | `No` / `Yes` / `Override Required`. Covers receiving more than the **open quantity** on a PO line, and scheduling to over-receive via Assign Purchase Orders to a Bar Code Receiving Batch. | *Open quantity = order quantity − quantity already received.* **The only genuine three-state permission in STORIS — the model for our whole `deny/allow/allow_with_override` scheme. Does NOT affect RF users; RF over-receiving is governed by `Allow Over Receiving` in Bar Code Control Settings.** |

---

## Service (`SVC`) — from `SEC-009`

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-SVC-COMPLETE` | Complete service orders | Complete via Enter a Service Order. | Blank ⇒ Access Control Window on the completion attempt. |
| `SEC-SVC-CREATE-FROM-OTHER` | Create a Service Order from Other Processes | Create a service order from the `Create a Service Order` **extra action** in other processes (not the menu option). | **Unchecked by default.** |
| `SEC-SVC-CREATE-COVERED` | Create Service for Merchandise Covered by an Extended Warranty | Service orders for merchandise under extended warranty. | **Default checked.** |
| `SEC-SVC-CREATE-UNCOVERED` | Create Service for Merchandise not Covered by an Extended Warranty | Service orders for merchandise **not** under extended warranty. | **Default checked — margin leak. Default this to DENY for us.** |
| `SEC-SVC-DELETE-OPEN` | Delete open service orders | Delete open service orders. | |
| `SEC-SVC-STATUS-ENTRY` | Enter service orders with scheduled/estimated/pending status | Enter complete service orders with status `estimated`, `scheduled` or `pending`. | **Blank ⇒ the user can create ONLY pending orders (may still enter customer/delivery info, create customers on-the-fly, and access audit comments).** Model as an allowed-target-status set. |
| `SEC-SVC-WARRANTY-TERMS` | Modify warranty terms in service order entry | Change warranty terms for **parts and labor** coverage. | |
| `SEC-SVC-CHARGEBACK-OVR` | Override preset vendor charge-back method within service entry | Override the charge-back method preset in Vendor Settings / Service Control Settings. | Controls how third-party-responsible parts charges are reimbursed. |
| `SEC-SVC-REINSTATE` | Reinstate completed service orders | Reinstate previously **closed** service merchandise lines during service order entry. | |
| `SEC-SVC-VIEW-COSTS` | View and Access Costs Associated with Service | View the cost of **parts, labor and charges** on a service line. | **Unchecked by default. Field-level redaction (§4). Explicitly a sibling of `SEC-COST-VIEW`: "This setting is unchecked by default to match the default setting of View and Access Product Cost Information. For existing clients, the conversion process will define this setting based on what the user defined in View and Access Product Cost Information." Unify the two into one scoped cost-visibility permission.** |

---

## System (`SYS`) — from `SEC-010`

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-SYS-ECL` | Access ECL command line mode | Run Access ECL to reach the **ECL command line prompt**. Checked ⇒ clicking `Access ECL` prompts for a user password, then opens the prompt. | **Effectively root over the ERP. DO NOT BUILD AN EQUIVALENT. If an escape hatch is ever needed it belongs in infrastructure with its own identity, MFA and session recording.** |
| `SEC-SYS-DYNESCAPE-EDIT` | Add programs to a Dynamic Escape screen listing | Right-click on a dynamic-escape-capable screen exposes `Dynamic Escape Settings`, letting the user edit right-click menus in place. | Blank ⇒ can access but not edit right-click menus. |
| `SEC-SYS-ASSIGNPERM` | Assign Screen Action Permissions | Restrict other users' access to specific Actions-menu functions, via the Assign Screen Actions Permissions routine. | **META-PERMISSION — authority over other people's permissions. Break-glass: dual control, time-boxed, alerting. Must not be grantable by whoever can also grant `SEC-SYS-AUDIT-VIEW`.** |
| `SEC-SYS-TAXABLE` | Change Taxable Settings | Change the taxable status for a specific order via Order Tax Information. | Blank ⇒ security override required. **"This setting takes precedence over the Override Charge Sales Tax Settings" — top of the tax-exemption precedence chain, above `SEC-SLS-TAXEXEMPT-OVR`.** |
| `SEC-SYS-CORPVIEW-EDIT` | Edit Personal Report Viewer Corporate Views | Create/modify the **Corporate View** in the Personal Report Viewer and use `Save Corporate View`. | **The view is uploaded to the server so all other users get it — a per-user permission writing system-wide shared state. Treat as a publish action with review.** |
| `SEC-SYS-GL-MANUALPOST` | Edit automated general ledger postings | Accounts Receivable Manual Adjustment GL Postings and Vendor Receivable Manual Adjustment GL Postings. | |
| `SEC-SYS-EXPORT-GRID` | Export Grid Data | Option to export grid data. | **Ships enabled (*"leave this setting checked"*) — a bulk data-egress default. DEFAULT OFF for us, and log every export with row count and filter criteria.** |
| `SEC-SYS-LOGOUT-ON-SWITCH` | Logout of STORIS on Switch User | Checked ⇒ `Switch User` logs the user out. Blank ⇒ `Switch User` shows the login screen. | **A session-behaviour preference, not a permission. Move out of the security model.** |
| `SEC-SYS-MERGE-CUSTOMERS` | Merge Duplicate Customer Accounts | Merge duplicate customers. | Without it users can only **recommend** merges via Review Status and Merge Individual Customer. Destructive and hard to reverse — require second signature. |
| `SEC-SYS-ENCRYPT` | Modify General System Control Settings data encryption | Change the **Database Encryption Settings** on the Security tab of General System Control Settings. | Without it, a security override is required — **which is far too weak for this. Break-glass with dual control for us.** |
| `SEC-SYS-PURGE-ENC` | Purge secured/encrypted data | Run **Purge Encrypted Data** to purge encrypted sensitive customer data — *"social security numbers, credit card numbers, checking account numbers, etc."* | **Irreversible destruction of regulated data, overridable by a colleague's password in STORIS. Break-glass with dual control and alerting for us.** |
| `SEC-SYS-RECOVER-LICENSES` | Recover STORIS Licenses | Access the Recover STORIS Licenses routine. | **HARD DENY — "the screen cannot be accessed and no security override option is available."** The only hard deny on this screen, and on the least dangerous item on it. |
| `SEC-SYS-RUN-EOD` | Run the Daily Reports (EOD) process | Initiate Generate Daily Reports (Day Ending / EOD). | *"Typically this setting should be reserved for the system manager."* |
| `SEC-SYS-RUN-EOM` | Run the Monthly Reports (EOM) process | Initiate Generate Monthly Reports (Month Ending / EOM). | *"Typically this setting should be reserved for the system manager."* |
| `SEC-COST-VIEW` **(existing)** | View and access product cost information | Access cost information during inventory and sales entry processing. | **Reused from the Inventory pack. Field-level redaction (§4) that reaches into the print pipeline: "if a user without access to costing information attempts to print a document with costing information included, the costing information does not appear on the printed document."** Sibling of `SEC-SVC-VIEW-COSTS`. |
| `SEC-SYS-AUDIT-VIEW` | *(no STORIS equivalent — ours)* | Read the authorisation audit log. | **New for LA Mattress (§5). Segregated from `SEC-SYS-ASSIGNPERM`: whoever grants break-glass must not also control who can read the log.** |

---

## Transfer (`XFER`) — from `SEC-001`

**Scope note: this is the only domain with NO group-level form.** It is assigned per **user** (via Create a
User) or per **logon location** (via Warehouse/Store Location Settings), never per user group.

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-XFER-MATRIX` | *(Transfer Security grid)* — `From Location` / `To Location` pairs added via the `Add` button | Allow-list of From→To location combinations for which the user or logon location may create transfers. | **Inert unless `TRANSFERS - Use Transfer Security Tables` is checked on the Additional Settings tab of Inventory Control Settings. FAIL-CLOSED: "If this box is checked and no tables are created, users cannot create transfers." Denial is overridable by a user who holds the needed pair.** Defeated wholesale by `SEC-LOG-BYPASSXFER`. |
| `SEC-XFER-MATRIX-SUBJECT` | `Logon / User` *(display only)* | Identifies whether the table is keyed on a warehouse/store code or a user ID. | Two independent tables can exist for the same transfer. **`[DECISION NEEDED]` — STORIS does not state how they combine; assume both must permit (AND).** |
| `SEC-XFER-MATRIX-REMOVEALL` | *(Actions →)* Remove All | *"You can use this action to remove all the rows in the grid at one time versus removing each row individually."* | One click can empty a user's entire transfer allow-list, which with the fail-closed rule means a total lockout. Require confirmation and log it. |

---

## Import Data (`IMP`) — from `SEC-002`

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-IMP-<importer>` | *(one grid row per import process)* — *"Items listed in the grid correspond to the import processes listed in the Import Data routine."* | Checked ⇒ the user/group may run that import. Unchecked ⇒ *"require the user/user group to obtain a security override in order to access the import process."* | **The row set is DYNAMIC, derived from the Import Data routine — not a fixed list. `SEC-IMP-*` IDs are minted per importer from the registry. ALL import processes are checked by default — the most permissive default in the pack, on bulk data mutation. DEFAULT NEW IMPORTERS TO DENY for us.** |
| `SEC-IMP-CUSTPAY` | *(the `Import Customer Payments` row)* | Run the Import Customer Payments import. | Layered with the finer `SEC-AR-IMPMISAPPLY` (`Import Customer Payments - Misapply Payments`, unchecked by default). Note that `SEC-AR-LEGAL-PAYOVERRIDE` is **not** available on this path — legal-code violations fail with an error code instead of prompting. |

---

## Personal Information (`PII`) — from `SEC-005`

**Read this table carefully — it is the one place where the STORIS screen and the STORIS *labels* disagree.**
The article exposes only **five** labelled settings, but its own prose says the screen offers four options for
each of three data categories. Verbatim: *"**Settings Listed Below** — For each category listed below, options
are offered for **viewing, reporting, document printing, and exporting**. If an option is checked, the user or
group of users are permitted to view the information unmasked."* Categories listed: `Date of Birth`,
`Driver License Number`, `Social Security Number`.

Two of the five labels are written generically to cover all three categories at once — *"View **(date of
birth/driver license/social security)** information on …"* — while the other two are written for date of
birth alone. So the labels are an incomplete rendering of a 3 × 4 grid.

**Verbatim rows (these five, and only these five, appear as labels on the screen):**

| ID | Permission (verbatim STORIS wording) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-PII-EMPCREDIT` | Access employee credit applications and score reporting | View applications and score reporting **for other employees**. | **Hard prerequisite: *"In order for a user to view sensitive employee information they must first be granted access to view sensitive customer information."* — i.e. `SEC-AR-ACCESS-OTHERCREDIT`. Same permission name as `SEC-AR-ACCESS-EMPCREDIT`; one setting surfaced on two screens.** |
| `SEC-PII-EXPORT` | View (date of birth/driver license/social security) information on documents exported to user’s workstation | Unmasked in workstation exports *"that [do] not fit into the reporting category"* — worked example: **Insurance Premium File Creation**. Blank ⇒ cannot view unmasked. | Label covers **all three** categories. |
| `SEC-PII-PRINT` | View (date of birth/driver license/social security) information on printed documents | Unmasked on output *"printed via Enhanced Laser Printing or forms printing."* Blank ⇒ cannot view unmasked. | Label covers **all three** categories. |
| `SEC-PII-DOB-REPORT` | View date of birth information on reports | DOB unmasked on reports. Blank ⇒ masked. | Label names **date of birth only**. |
| `SEC-PII-DOB-SCREEN` | View date of birth information on screens | DOB unmasked on screens. | Label names **date of birth only**. **Entry-session leak, verbatim: *"if the user entered the data STORIS does not immediately mask the data. When a user without this box checked accesses the customer again, the sensitive data is masked."* — masking applies on RE-ACCESS. We mask immediately, author included.** |

**Derived rows — implied by the "Settings Listed Below" prose, NOT verbatim labels.** These are the four
missing cells of the 3 × 4 grid (driver licence and SSN on reports and screens). Confirm against a live STORIS
screen before treating the wording as authoritative.

| ID | Permission (derived, wording ours) | Gates / effect | Notes |
|---|---|---|---|
| `SEC-PII-DL-REPORT` *(derived)* | View driver license information on reports | DL number unmasked on reports. | Implied by "options are offered for … reporting" for the `Driver License Number` category. |
| `SEC-PII-DL-SCREEN` *(derived)* | View driver license information on screens | DL number unmasked on screens. | Implied by "options are offered for viewing …". |
| `SEC-PII-SSN-REPORT` *(derived)* | View social security information on reports | SSN unmasked on reports. | Implied. |
| `SEC-PII-SSN-SCREEN` *(derived)* | View social security information on screens | SSN unmasked on screens. | Implied. Highest-sensitivity cell of the grid. |

`[DECISION NEEDED]` — whether STORIS really ships 5 settings or 12 does not change what **we** build: we
implement the full `field_class × channel` grid regardless. Flagged so nobody reads five checkboxes off a live
STORIS screen and concludes the catalog is wrong.

**Related, but not on this screen:**

| ID | Setting (verbatim) | Gates / effect | Notes |
|---|---|---|---|
| `CFG-SYS-DOCARCHIVE-MASKPII` | Document Archive Mask PII | Masking on **archived** documents. | **A global checkbox in General System Control Settings, outside this permission screen — a compliance hole. Archived artefacts should inherit the requester's redaction automatically.** |

**Extension for LA Mattress.** STORIS hard-codes three data classes. Ours is
`pii_access(subject, field_class, channel)` with `field_class` extensible — at minimum add bank account
number, card PAN/last-4, phone, email and address, plus the payment-data classes STORIS scatters into other
domains (`SEC-SLS-VIEW-ENCRYPTED-ACCT`, `SEC-PAY-VIEW-ENCRYPTED-ACCT`, `SEC-AR-VIEW-GIFTPIN`) and the cost
classes (`SEC-COST-VIEW`, `SEC-SVC-VIEW-COSTS`). All redaction permissions in this ERP belong to one
mechanism, not five.

---

## Cross-domain precedence, in one place

| Rule | Winner | Loser |
|---|---|---|
| Tax exemption | `SEC-SYS-TAXABLE` (System) — *"takes precedence"* | `SEC-SLS-TAXEXEMPT-OVR` (Sales) |
| Transfer routing | `SEC-LOG-BYPASSXFER` (Logistics) | `SEC-XFER-MATRIX` (Transfer) |
| Special-order PO requirement | `Purchase Order/Assignment Required` (Special Order Control Settings) | `SEC-PO-SOPOS` |
| Scheduling unpaid fulfillments | `Change Fulfillment Status to SCH with a Balance Due` (POS Control Settings) — global grant to everyone | `SEC-LOG-SCH-BALANCEDUE` (not reviewed at all when the global is on) |
| Employee PII / credit | `SEC-AR-ACCESS-OTHERCREDIT` is a **prerequisite** | `SEC-PII-EMPCREDIT` / `SEC-AR-ACCESS-EMPCREDIT` |
| Insurance propagation | `SEC-AR-REV-INSURANCE-EDIT` is a **prerequisite** | `SEC-AR-RTC-INSURANCE-ALL` |
| Revolving credit review | one of `SEC-AR-ACCESS-EMPCREDIT` / `SEC-AR-ACCESS-OTHERCREDIT` is a **prerequisite** | `SEC-AR-VAR-CREDITREVIEW` |
| Max credit limit | `SEC-AR-UNLIMITED-CREDIT` and `SEC-AR-MAXCREDITLIMIT` are **mutually exclusive** | — |
| PO on hold, on-the-fly from POS | `SEC-SLS-PO-NOTHOLD-POS` unchecked forces hold *regardless of other on-hold settings* | `SEC-PO-HOLD-CREATE` |
| RF over-receiving | `Allow Over Receiving` (Bar Code Control Settings) | `SEC-LOG-OVERRECEIVE` (does not affect RF at all) |
| Everything on all ten screens | **Extended Security active** (General System Control Settings) — the global kill-switch | every `SEC-*` in this catalog |

## Permissions with NO override path (hard denies in STORIS)

`SEC-SLS-BACKDATE` · `SEC-SLS-IMPORT-RETAILDECK` · `SEC-PO-EDIT-SENT` · `SEC-SYS-RECOVER-LICENSES`

Everything else that is unchecked is either *ask a permitted colleague for credentials* or *degrade to
read-only / blind / masked*. Note the inversion this produces: **licence recovery is a hard deny while
purging encrypted PII and changing database encryption are merely override-gated.** Our defaults invert that.

## Defaults that ship OPEN in STORIS and that we deliberately close

| Permission | STORIS default | Ours |
|---|---|---|
| `SEC-IMP-*` (every import process) | checked | **deny** |
| `SEC-SYS-EXPORT-GRID` | checked | **deny**, and log every export |
| `SEC-PAY-APPROVE-REFUNDBILL` | checked | **deny** |
| `SEC-PAY-PRINT-REFUNDCHECKS` | checked | **deny** |
| `SEC-SVC-CREATE-UNCOVERED` | checked | **deny** |
| `SEC-SLS-DELIVCONTACT-CODES` | blank = all codes | **blank = none** |
| `SEC-SLS-RESTOCKFEE-OVR` | checked | **deny** |
| `SEC-AR-PAYCLASS-ACCESS` | all nine classes checked | **explicit allow-list only** |
