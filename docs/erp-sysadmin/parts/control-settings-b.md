# System Control Settings — Part B (positions 45–87)

*Section: System Control Settings, `15172950973716` (**87 articles total**, confirmed by re-enumeration
with the `grab()` helper). This part covers the **last 43** articles in section enumeration order
(alphabetical, as the Zendesk section lists them).*

**Prefix:** `SCS` · **ID range:** `SCS-045` … `SCS-087`

## Split-point verification (read this first)

Independent re-enumeration of section `15172950973716` returned **87 articles**, matching part A's count.

- Position **44** = **`Legal Code Settings`** (article `15186501982868`) — part A's last entry, `SCS-044`. ✔
- Position **45** = **`Maintain Credit Application Letter Print UNC Path`** (article `15186451529876`). ✔

**The expected split point is confirmed exactly. No renumbering was needed.** Part B begins at
`SCS-045` = position 45 and ends at `SCS-087` = position 87.

## Audit — exactly which articles positions 45–87 are

| # | Req ID | Article ID | Title |
|---|---|---|---|
| 45 | SCS-045 | 15186451529876 | Maintain Credit Application Letter Print UNC Path |
| 46 | SCS-046 | 41561618825108 | Maintain Event Configuration |
| 47 | SCS-047 | 15186451515028 | Micro*D PreVue |
| 48 | SCS-048 | 15186501108372 | Net Purchase Order |
| 49 | SCS-049 | 15186501105684 | Notification by Warehouse Screen |
| 50 | SCS-050 | 15186452992660 | Notifications Control Settings |
| 51 | SCS-051 | 15186502242452 | Order Line Import Control Settings |
| 52 | SCS-052 | 15186501543572 | Payables Control Settings |
| 53 | SCS-053 | 15186452993556 | Payment Card and Device Settings |
| 54 | SCS-054 | 15186502233620 | Point of Sale Control Settings |
| 55 | SCS-055 | 15186502239636 | POS Bar Code Control Settings |
| 56 | SCS-056 | 15186501109012 | Product Auto-Numbering Exclusion Ranges |
| 57 | SCS-057 | 15186452992916 | Product Configurator Control Settings |
| 58 | SCS-058 | 15186502233492 | Purchasing Control Settings |
| 59 | SCS-059 | 15186452991252 | Quick Purchase Order Settings |
| 60 | SCS-060 | 15186501993236 | Quick Sale Control Settings |
| 61 | SCS-061 | 15186502232724 | Report Archive Retention Days |
| 62 | SCS-062 | 16716821448084 | Requested Date Calculation |
| 63 | SCS-063 | 15186502232340 | RetailDeck Control Settings |
| 64 | SCS-064 | 15186453252116 | Revolving Receivables Control Settings |
| 65 | SCS-065 | 15186453252372 | Route Capacity Control Settings |
| 66 | SCS-066 | 15186502470164 | Route Mapping Control Settings |
| 67 | SCS-067 | 15186502479380 | Sales Analysis Report Control Settings |
| 68 | SCS-068 | 15186502476820 | Sales Lead System Control Settings |
| 69 | SCS-069 | 15186501107604 | Sales Order Reservations |
| 70 | SCS-070 | 15186453256980 | Service Control Settings |
| 71 | SCS-071 | 15186453256212 | Shopping Cart Control Settings |
| 72 | SCS-072 | 15186453249940 | Special Order Control Settings |
| 73 | SCS-073 | 15186451768852 | Stock Reservation Settings |
| 74 | SCS-074 | 15186501104788 | STORIS Messenger Control Settings |
| 75 | SCS-075 | 15186452148500 | System Notifications |
| 76 | SCS-076 | 15186501361172 | System Security Window |
| 77 | SCS-077 | 15186452531860 | Terminal Settings |
| 78 | SCS-078 | 15186501361428 | Test Email Server Connection |
| 79 | SCS-079 | 15186502670228 | Third Party Finance Application Control Settings |
| 80 | SCS-080 | 15186453250196 | Third-Party Accounting Control Settings |
| 81 | SCS-081 | 15186501362836 | TPA Transmission Phantom |
| 82 | SCS-082 | 15186452147092 | Transaction Entry - User Log In Screen |
| 83 | SCS-083 | 15186502670612 | Twilight Discount Pricing Settings |
| 84 | SCS-084 | 15186453471636 | Vendor Receivables Control Settings |
| 85 | SCS-085 | 36103270474004 | Warehouse Management Control Settings |
| 86 | SCS-086 | 15186453486484 | Web Control Settings |
| 87 | SCS-087 | 15186452150932 | Zero-Cost Exception Handling |

> Conventions used below: **[GUARDED]** = unsafe to change while certain state exists;
> **[DESTRUCTIVE]** = changing this value silently destroys or purges data;
> **[TRISTATE]** = blank / zero / positive carry three different meanings;
> **[IRREVERSIBLE]** = cannot be undone once data exists;
> **[CONFLICT]** = contradicts or duplicates another setting;
> **[REUSE]** = already registered in the Inventory handoff pack — do not mint a new ID.
> Every **[DESTRUCTIVE]** and **[TRISTATE]** instance is also collected in `## Dangerous settings` at the end.

---

### `SCS-045` Maintain Credit Application Letter Print UNC Path
*storis_ref: article 15186451529876*

**Purpose.** Configures bulk/mass printing of Credit Application (credit status) Letters by emitting them as
XML files to a network path, typically so a third-party print/mail house can produce them.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Credit Application
Control Settings > General Tab > Extra Actions`. It is a sub-screen hung off the **Extra Actions** button of
`SCS-017` Credit Application Control Settings — not a top-level menu item.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Create XML for Credit Application Letters` | Checkbox | Master enable. "Check this box to create the XML for Credit Application Letters to accommodate for mass printing." **When enabled, `Path to Export to` and `Maximum Number of Letters Per XML File` become active and mandatory.** |
| `Path to Export to` | UNC / network path (text) | "Enter the network path where output files, created by the Print Credit Status Letters, is located." **Mandatory when `Create XML for Credit Application Letters` is active.** |
| `Maximum Number of Letters Per XML File` | Integer, max `999999` | Letters per output file. **[TRISTATE]** — "A **NULL** entry indicates **all** letters are permitted to be in one file." So: NULL = unlimited/one file; a positive number = chunk size; and (implicitly) `0` is not a documented value and must be rejected rather than silently meaning "zero letters per file". |

**Behavior & rules.**
- **The mandatory-ness is conditional on the checkbox**, so the three fields must be validated as a group.
- The exported letters contain **credit decision content about identified consumers** — name, address, and
  the adverse-action reason. This path is therefore a **PII egress point**; STORIS documents no encryption,
  no access control on the share, and no retention limit on the written files.
- **Blank vs NULL distinction matters:** the article says NULL, not zero. A UI that coerces an empty numeric
  field to `0` would change "one file with everything" into an undefined/degenerate batch size.

**Dependencies.** `SCS-017` Credit Application Control Settings (parent screen, General tab / Extra Actions);
the **Print Credit Status Letters** routine (the producer of these files); Enhanced Laser Forms (ELP) form
definitions for the letter body; file-system/share permissions outside STORIS.

**Build notes.**
- New IDs: `CFG-CREDIT-LETTER-XML-ENABLED` (bool), `CFG-CREDIT-LETTER-XML-PATH` (string),
  `CFG-CREDIT-LETTER-XML-MAXPERFILE` (int, nullable, 1..999999).
- **Do differently:** do not write consumer credit letters to a raw UNC share. Emit to an object store with
  server-side encryption, a signed short-lived retrieval URL for the print vendor, and a hard retention TTL.
  Log every export batch to `RPT-AUDIT` (batch id, letter count, requester, destination, timestamp).
- Model max-per-file as `nullable int` with an explicit "unlimited" radio in the UI, so NULL is a **choice**
  and never an accident of an empty box.
- `[DECISION NEEDED]` Does LA Mattress issue its own credit decisions (and therefore adverse-action letters)
  or is all financing third-party? If third-party, this whole feature is out of scope and the adverse-action
  obligation sits with the lender.

---

### `SCS-046` Maintain Event Configuration
*storis_ref: article 41561618825108*

**Purpose.** Turns individual **events** on and off per **consumer** (event subscriber), controlling which
business events are emitted at all. Works together with Notifications Control Settings to decide when emails
and/or texts fire off an event.

**Where it lives.** `Menu > System Administration > System Settings > Maintain Event Configuration`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Consumer` | Dropdown (list of available consumers) | "Select an available consumer to populate the grid and edit active events." A *consumer* here is an event subscriber/integration, not a retail customer. **The `Eventing` consumer option is only available when `Event Data Integration` is active in General System Control Settings (`SCS-038`).** |
| Grid — column 1 | Event name (read-only) | The event being subscribed to. |
| Grid — column 2 | Checkbox per row | "Select the checkbox beside the event to activate it or uncheck to deactivate that event to receive notifications for that event." |

**Behavior & rules.**
- **This is a per-consumer subscription matrix, not a global on/off.** Two consumers can disagree about
  whether a given event exists for them.
- **Gated by a licensed/global flag** (`Event Data Integration` in `SCS-038`) — the classic STORIS pattern of
  a global kill-switch making a whole screen inert, same shape as **Extended Security**.
- The article does **not** enumerate the available events or consumers — that list is data, not documentation.
  **Content gap.**
- **[GUARDED]** Un-checking an event stops emission at the source. Anything downstream that depends on that
  event (customer delivery notifications, integration feeds) silently stops with no error — the consumer just
  never hears about it again.

**Dependencies.** `SCS-038` General System Control Settings (`Event Data Integration`); `SCS-050`
Notifications Control Settings (`Capture Data Events`, and the `Event Notifications via ERP` grid);
`SCS-034` Event Notification Control (part A); the Event Repository / Event Archive and the
**Consumer Event Notification phantom**.

**Build notes.**
- New IDs: `CFG-EVENT-CONSUMERS` (table of subscribers), `CFG-EVENT-SUBSCRIPTIONS`
  (`{consumer_id, event_type, enabled}`), reusing `CFG-EVENT-DATAINTEGRATION` for the global gate.
- Build this as a proper **event bus with typed events and per-subscriber topic subscriptions**. Events should
  always be *recorded*; only *delivery* should be subscribable. STORIS conflates the two, which is why turning
  a subscription off loses the history.
- **Do differently:** show, per event type, the count of subscribers and the last delivery time, so an
  operator can see what they are about to silence. Log subscription changes to `RPT-AUDIT`.

---

### `SCS-047` Micro*D PreVue
*storis_ref: article 15186451515028*

**Purpose.** Documents the licensed interface to the **Micro*D PreVue EasyOrder Configurator**, a third-party
upholstery draping/configuration program, and how its quote documents flow into STORIS sales orders and
purchase orders as special-order lines.

**Where it lives.** Reached from the **Action button at the `Product` field** inside `Enter a Sales Order` and
`Enter a Purchase Order`. Configuration lives in the `MicroD Control Settings` routine and the
`Default Path for Micro*D Quote Documents and Images` routine.

**Fields / settings**

| Field | Type | Purpose / business rule |
|---|---|---|
| `MicroD Control Settings` (routine) | Mapping screen | "Associate the catalog items with a Vendor in STORIS." Catalog-to-vendor mapping. Individual fields are **not documented in this article**. |
| `Default Path for Micro*D Quote Documents and Images` | File path | Where EasyOrder quotes/images are stored. **Documented default: `C:\STORIS\`.** |
| `PreVue Import` (action) | Command | Imports an existing PreVue quote document. Opens a Windows Explorer browse dialog; on selection a grid of the quote's line items appears; you pick which lines convert into sales order lines; the **Special Order Entry** screen then opens for editing. |
| `PreVue EasyOrder Configurator` (action) | Command | Launches the external configurator GUI wizard, which produces a quote document that is then transferred back to STORIS. |

**Behavior & rules.**
- **Licensed companion application** — "you must have a license with STORIS to use it", installed per-PC.
  **This is a workstation-local dependency: the default path is a local `C:\` drive, not a share.**
- **Hard rule: quotes are immutable once attached.** "You **cannot edit existing quote documents**. If you have
  a line item selected and you attempt to access EasyOrder, an error message appears. **You must delete the old
  quote and create new one** using the EasyOrder Interface." So *editing a configured special-order line means
  destroying and re-creating it* — any pricing, costing, or reservation attached to the old line goes with it.
  **[IRREVERSIBLE]** at the line level.
- The imported lines land as **special orders**, so `SCS-072` Special Order Control Settings governs what
  happens next.

**Dependencies.** `SCS-072` Special Order Control Settings; Vendor Settings (catalog↔vendor association);
Enter a Sales Order / Enter a Purchase Order; per-workstation install and `C:\STORIS\` path;
`SCS-077` Terminal Settings (workstation-scoped configuration is the natural home for a local path).

**Build notes.**
- New IDs: `CFG-MICROD-ENABLED`, `CFG-MICROD-QUOTEPATH`, `CFG-MICROD-VENDORMAP`.
- **Almost certainly out of scope for LA Mattress** — this is a case-goods/upholstery draping configurator.
  Record it for completeness and skip the build. `[DECISION NEEDED]` confirm no upholstery custom-order program.
- If any configurator is ever integrated, **do differently**: store the configuration payload as versioned JSON
  **on the order line**, so a line can be re-opened and re-configured rather than deleted and re-keyed. Never
  put a per-workstation local path in a system-wide setting.

---

### `SCS-048` Net Purchase Order
*storis_ref: article 15186501108372*

**Purpose.** Defines the **"Net PO"** quantity that appears as a column across many STORIS inquiries and
reports — the supply-vs-demand netting figure that drives purchasing recommendations.

**Where it lives.** Not a screen — a **derived quantity** displayed in inquiries and reports (e.g. Product
Performance and Purchase Recommendations). Its behavior is governed by settings in `SCS-043` Inventory Control
Settings and by PO Type configuration.

**The formula (verbatim).**

> `(quantity on purchase orders, returns, and transfers in)`
> `- (quantity on sales orders but not yet reserved to the sales orders* + transfers out not yet reserved)`
> `- (layaways**)`
>
> `*` The **unreserved quantity** of a product consists of the
> `(quantity from non-layaway sales orders that are not fully reserved, including CWC's and ASAP's)`
> `- (open customer returns that are not flagged as-is)`

**Fields / governing settings**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Layaway in Net Purchase Order` (in Inventory Control Settings, `SCS-043`) | Checkbox (active/inactive) | **active** → "the system takes the quantity on purchase order and subtracts the uncommitted quantity **and the quantity on layaway sales orders**"; **inactive** → "subtracts **only** the uncommitted quantity". |
| `Include in Supply Calculation` (on the **PO Type**, per PO) | Checkbox | If checked, the purchase order **is** included in supply calculations and affects Net PO. If the type says not to include, **open orders do not affect the Net PO calculation at all.** |

**Behavior & rules.**
- **Reserved stock is deliberately excluded from demand.** Only the *unreserved* portion of a sales order
  counts as demand — because reserved quantity has already been taken out of on-hand. **Getting this wrong
  double-counts demand and over-buys.**
- **Open customer returns that are NOT flagged as-is are netted against demand** — i.e. a pending return is
  treated as incoming sellable supply *before* it physically arrives. **As-is returns are excluded** because
  they will not go back into A-stock. This is a subtle and easy-to-miss sign flip.
- `CWC` (cash-with-customer / customer-will-call) and `ASAP` orders **are** counted in unreserved demand.
- "When a sales order is entered for an item, the Net PO **decreases** by the amount on the sales order."
- **Note Net PO is a *net supply* figure, not an on-hand figure** — it excludes on-hand entirely.
- **[CONFLICT]/gotcha:** the same physical PO can be in or out of the calculation depending on its **PO Type**,
  which is a per-document attribute, while `Layaway in Net Purchase Order` is a **global** switch. Two levers
  of different scope act on one number.
- The article's Use Case narrative contains three obvious typos in the source (`THe`, `informaiton`,
  `Reccomendations`, `layway`) — noted only so the quotation is not mistaken for our error.

**Dependencies.** **[REUSE]** `CFG-INV-RESERVEBY` and the `CFG-WHINV-*` family (reservation semantics decide
what "not yet reserved" means); `SCS-043` Inventory Control Settings (`Layaway in Net Purchase Order`);
PO Type table (`Include in Supply Calculation`); `SCS-069` Sales Order Reservations; `SCS-073` Stock
Reservation Settings; Product Performance and Purchase Recommendations; Converting Order Types (a conversion
to layaway moves quantity between terms of this formula).

**Build notes.**
- New IDs: `CFG-INV-LAYAWAY-IN-NETPO` (bool), `CFG-PO-TYPE-INCLUDE-SUPPLY` (per PO-type bool).
- Implement Net PO as a **single named, tested, server-side computation** used by every report — never
  re-derived per screen. Ship a unit-test fixture for each term of the formula, including the two sign traps
  (unreserved-only demand; as-is returns excluded).
- **Do differently:** expose a **drill-down** that shows each term's contribution for a given
  product/location, because "why is Net PO 29?" is otherwise unanswerable.
- `[DECISION NEEDED]` LA Mattress layaway policy — if layaways exist at all, `Layaway in Net Purchase Order`
  should be **on** (layaway demand is real demand); if they do not, drop the setting rather than ship a
  meaningless switch.

---

### `SCS-049` Notification by Warehouse Screen
*storis_ref: article 15186501105684*

**Purpose.** Assigns, **per warehouse/location**, which users or mail groups get notified when
**one-time-buy** items are received into that location.

**Where it lives.** `STORIS Messenger Control Settings > Messaging Tab > One-Time-Buy Purchase Order
Notification field > Actions button` — a sub-screen of `SCS-074`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| Grid — location rows | Read-only | "The grid displays **all available locations**" — the row set is the location master, not user-maintained. |
| Grid — `Notification` column | User code or Mail Group code | "Click on the cell corresponding to the location for which you want to assign recipients. Then enter the code of the user or mail group you want to receive notifications." **A single column accepting either a user code or a group code — an untyped polymorphic reference.** |

**Behavior & rules.**
- Notifications are delivered to the **Tasks tab in the Send/Review Mail Messages routine** (internal STORIS
  messaging), *not* email — so this is an in-app inbox, unrelated to `SCS-050`'s email plumbing.
- **A blank cell means nobody is notified for that location.** There is no fallback recipient documented, so
  **adding a new warehouse silently creates an unmonitored location** until someone remembers this screen.
  Flagged as an operational trap.
- Scope is **one-time-buy PO receipts only** — a narrow trigger sitting behind a very generic screen name.

**Dependencies.** `SCS-074` STORIS Messenger Control Settings (parent, `One-Time-Buy Purchase Order
Notification`); Warehouse/Store Location Settings (`CFG-LOC-*` family — the row source); Mail Groups and user
codes (`SEC-*` user catalog); Send/Review Mail Messages; PO receiving (one-time-buy flag on the PO/product).

**Build notes.**
- New ID: `CFG-NOTIFY-OTB-RECEIPT-BY-LOCATION` — `{location_id → [recipient_ref]}` where `recipient_ref` is a
  **typed** union (`user:` / `group:` / `role:`), not a bare code.
- **Do differently:** allow **multiple** recipients per location (STORIS documents one cell), allow a
  **role**, and provide a **default/fallback recipient** so a new location is never silently unmonitored.
  Warn at location-creation time if no recipient is set.
- Fold into the general notification-rule engine rather than a bespoke screen; one-time-buy receipt is just
  one event type (`SCS-046`).

---

### `SCS-050` Notifications Control Settings
*storis_ref: article 15186452992660*

**Purpose.** The system's **email/SMS plumbing and event-notification console**: outbound mail transport
(direct SMTP, OAuth2 provider, or Notifications Server), which ELP form and delivery method each application
event uses, and the metered usage of licensed consumer email/text notification submodules.

**Where it lives.** `System Administration > System Settings > General Administration System Settings >
Notifications Control Settings`. **Tabs: `Configuration`, `Application Event Emails`, `Event Notifications via
ERP`.**

> **Hard prerequisite, stated in the article:** "Settings on this screen are **required in order to Schedule a
> Process**." **Email configuration is a dependency of the entire scheduler, not just of emailing.**

**Fields — `Configuration` tab, `General` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `STORIS Server Can Send Emails` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Master switch for the U2 server's ability to send mail. **Inactive for Cloud clients.** "To activate the email documents feature, **this box must be checked**." **When checked and the email fields are populated, generating a document shows the `Print Options Window` (print and/or email); when blank, the user gets only a print dialog.** A vendor-locked field that changes the UI of every document-producing routine. |
| `Update Customer Email Address` | Checkbox | On emailing a **sales order document**, compares the address used against the address in **Advanced Customer Settings**; **if they do not match, the customer record is updated with the address used to send the order.** If unchecked, no automatic update. **Does NOT apply when `Client Workstation Interactive` is the Email Method** on the Event Email ELP Form Selection tab. **This silently mutates the customer master from a send action — a data-integrity trap.** |
| `Capture Data Events` | Checkbox | "Control if captured data is used to support event processing. **This setting must be enabled in order to use the data for various notifications.**" Requires the licensed **Event Notifications via ERP** module **and** either the **Consumer Text Notifications** or **Consumer Email Notifications** submodule. |
| `Notification Register Retention Days` | Integer `0`–`99` | "Number of days Event Notification Register records are retained prior to purging." **[TRISTATE]/[DESTRUCTIVE]** — the range *starts at 0*, and `0` means **retain nothing / purge immediately**; the article documents no blank behavior and no maximum beyond 99, so **99 days is the hard ceiling on notification history.** Lowering the number purges everything older at the next purge run. |
| `"From" Email Address` | Email address | Sender address on mail from the Notifications Server. **Overridable per location** by `From Email Address` on the **Advanced tab of Warehouse/Store Location Settings**. |
| `"From" Email Name` | Text | Display name of the sender. **If not specified, the `"From" Email Address` is used as the sender name.** |
| `Send Test Email from STORIS Host Server` | Button | Enabled only if `STORIS Server Can Send Emails` is checked. |

**Fields — `Configuration` tab, `OAuth2 Authentication Settings` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Authentication Service` | Enum: **`Microsoft`**, **`Google`** | The OAuth2 email provider to authenticate against. |
| `Client ID` | Text | "Acts as an identifier for the applications." **"After the initial entry of this value, it is encrypted."** |
| `Client Secret` | Text (secret) | "Unique client secret, known only to the application and authorization server. **After the initial entry of this value, it is encrypted.**" |
| `Tenant Identifier` | Text | **Required only when `Microsoft` is the authentication service.** |
| `Authenticate with OAuth2 Authorization Server` | Button | "Obtains a refresh token to ensure all email-capable systems can access the authentication credentials needed." |

> **Context:** "Microsoft and Google are **decommissioning their SMTP support**. OAuth 2.0 can be used in place
> of SMTP." So the SMTP block below is a legacy path with an expiry date.

**Fields — `Configuration` tab, `Email Server` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `IP Address` | IP or URI | Email server address. **"If using pass-through to send emails from an email server in your own network, this is the only field in this section that is required."** **Mandatory if any grid row uses `Client Workstation Non-Interactive`.** |
| `Port` | Integer | Port for communications. |
| `User Name` | Alphanumeric | Login name for the email server. |
| `User Password` | Secure (encrypted) field | Password paired with `User Name`. |
| `Enable SSL` | Checkbox | "Connection between the Client Workstation or Notifications Server and the email server uses SSL protocol. Otherwise, leave this field blank." **Defaults to off; TLS is opt-in.** |
| `Send Test Email from Workstation to Email Server` | Button | Sends a test to the configured server. |

**Fields — `Configuration` tab, `Notifications Server` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Web Service URI` | URI | The network server designated as the Notifications Server. |
| `Wait For Server Response` | Checkbox | Checked → "the process sending the email **waits** for a response … STORIS **pauses processing** until a response is received or until `Milliseconds To Wait For Response` has elapsed, whichever comes first. If no response is received, the process **times out and an error message is issued**." Blank → "the process continues processing immediately, and **any errors occurring during communications with the Notifications Server are not displayed**." **[TRISTATE-adjacent / dangerous default]: unchecked = silent, permanent loss of delivery errors.** **If checked, `Milliseconds To Wait For Response` is mandatory.** |
| `Milliseconds To Wait For Response` | Integer (ms) | Mandatory when `Wait For Server Response` is checked. Timeout before erroring. **Blocks the user's foreground process for this long.** |
| `Test Notifications Server Connections` | Button | Tests U2 server ↔ Notifications Server. |
| `Send Test Email from Notifications Server` | Button | Sends a test from the Notifications Server. |

**Required-field set (verbatim) when sending through the Notification Server:**
`IP Address`, `Port`, `Enable SSl` *(sic)*, `Web Service URl` *(sic)*, `Milliseconds to Wait For Response`,
`"From" Email Address`, `"From" Email Name`.
Additionally: **"A `Web Service URI` and `"From" Email Address` must be defined when `Direct Ship Shipping
Notification` is chosen in Event Email ELP Selection."**

**Fields — `Application Event Emails` tab (grid)**

> "The Event rows in the grid are **populated by STORIS; you cannot add your own events.**"

| Column | Type | Purpose / business rule |
|---|---|---|
| `Event` | Read-only text | Event description — e.g. `Sale Quote`, `Sales Order`, `Shopping Cart`, `Shopping Cart eRoam`, `Direct Ship Shipping Notification`. |
| `ELP Form` | Search/select, or `Use Default Form` | Form description drawn from the associated Form Type in **Design Enhanced Laser Forms**. `Use Default Form` emails the form currently used for printing. **If `Email Format` = `HTML`, the email body is populated with an HTML version of the ELP Form.** |
| `Email Method` | Enum — exactly four values | `No Email Availability` = "ELP form for this Event row **cannot** be emailed."<br>`Client Workstation Interactive` = sent from an email client (e.g. Outlook) **on the user's workstation**.<br>`Client Workstation Non-Interactive` = sent from the user's workstation **via the configured email server**; **requires `IP Address`**.<br>`Notifications Server` = sent from the Notifications Server; **requires `Email Server`, `"From" Email Address`, and `Web Service URI`**. |
| `Email Subject` | Text, supports `%token%` | "**If you include `%token%` in the subject line, the process replaces `%token%` with the transaction number**… The process also includes the default text `Transaction` preceding the number. You can change the text." Example: `Sales Order %token%` → `Sales Order 456789`. An Action button opens the **Description Field - Language Translation Entry** screen (i18n per subject line). |
| `Email Format` | Enum: `HTML`, `PDF` | `HTML` → email body is an HTML rendering of the `ELP Form`. `PDF` → **body uses the `Email Body ELP Form` (in HTML) and the attached PDF uses the `ELP Form`** — i.e. two different forms are in play. |
| `Email Body ELP Form` | Search/select | **Used only when `Email Format` = `PDF`.** The form rendered as the HTML body. |

**Per-event method restrictions (hard rules):**
- `Shopping Cart eRoam` offers **only** `No Email Availability` and `Notifications Server`.
- `Direct Ship Shipping Notification` offers **only** `No Email Availability` and `Notifications Server`.

**Fields — `Event Notifications via ERP` tab**

> "This grid, **previously titled `Data Capture Notifications`** in previous revisions, can be used to review
> which fulfillments triggered a notification (email or text) to be sent to the consumer, primary salesperson,
> and/or 3rd party."

*`Notification Usage` — `Email Notifications`* (metered against the licensed **Consumer Email Notifications** submodule)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Actual` | Read-only count | Emails sent **month-to-date**. |
| `Maximum` | Read-only count | Contractual maximum emails per month. |

*`Notification Usage` — `Text Notifications`* (metered against **Consumer Text Notifications**)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Actual` | Read-only count | SMS texts sent MTD. |
| `Maximum` | Read-only count | Contractual maximum texts per month. |

*`Maxmium Warning Method`* *(sic — misspelled in source)*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Notify Email Address` | Email | Where the "approaching/exceeded monthly limit" alert is sent. |
| `Notify Text Telephone` | Phone | Where the warning SMS goes. **"Only available if the licensed `Consumer Text Notifications` submodule is active."** |

> **"At least one of these warning notifications must be defined."** (hard rule)

**Pacing algorithm (verbatim behavior).** "The method used to determine if the email and/or text notifications
are on pace to exceed the monthly limit is an **approximation**. The **average number of notifications sent
daily**, for both email and text, are determined. **That amount is then multiplied by 30** to provide a count
that is used to alert STORIS to send a warning message."

**Overage behavior — flagged.** "If notifications have exceeded the maximum amount and **are no longer sent**,
the events are **still captured and stored in the Event Repository for a 30 day grace period**. The
**Consumer Event Notification phantom moves them directly to the Event Archive.**" **[DESTRUCTIVE-adjacent]:
exceeding your licensed quota silently stops all customer notifications; the events survive only 30 days and
then are archived unsent. Recovery requires contacting STORIS to raise the cap.**

*Grid columns on this tab*

| Column | Type | Purpose / business rule |
|---|---|---|
| `Event` | Read-only | "The event detects **Minor** event information that is based on the **Major Events** that have been created." (Major/minor event hierarchy — see `SCS-034`.) |
| `Customer` | Enum: `None`, `Email`, `Text` | Notification method for the consumer. |
| `Salesperson` | Enum: `None`, `Email`, `Text` | Method for the **primary** salesperson on the order. |
| `Other` | Enum: `None`, `Email`, `Text` | Method for "any 3rd party vendor associated with the order". |

**Behavior & rules — summary of the hard ones.**
- **The scheduler depends on this screen.** No email config → no `Schedule a Process`.
- **`STORIS Server Can Send Emails` is vendor-locked and Cloud-disabled** — a customer cannot self-serve it.
- **`Update Customer Email Address` writes to the customer master as a side effect of sending mail**, and its
  exemption (Client Workstation Interactive) means the behavior is inconsistent across delivery methods.
- **`Wait For Server Response` unchecked = errors are swallowed.** The safe setting is the slow one.
- **`Enable SSL` is opt-in**, and credentials (`User Name`/`User Password`) can therefore be sent in clear.
- **Notification quota is a hard business ceiling**, not a soft limit: past it, customers stop being told
  their furniture is arriving, and only a 30-day archive exists.
- **`Notification Register Retention Days` max is 99** — you cannot keep a year of notification history.
- "Not all processes are available to **multi-tenancy Cloud** users."

**Dependencies.** `SCS-038` General System Control Settings (`Event Data Integration`); `SCS-046` Maintain
Event Configuration; `SCS-034` Event Notification Control (major/minor events); `SCS-078` Test Email Server
Connection; `SCS-074` STORIS Messenger Control Settings; `SCS-049`; Warehouse/Store Location Settings
(`From Email Address` on the Advanced tab — `CFG-LOC-*`); Design Enhanced Laser Forms (form catalog);
Advanced Customer Settings (email address written back); Schedule a Process; Vendor Settings; STORIS APIs;
licensed submodules **Consumer Email Notifications**, **Consumer Text Notifications**, **Event Notifications
via ERP**.

**Build notes.**
- New IDs: `CFG-NOTIFY-SERVER-CANSEND`, `CFG-NOTIFY-UPDATE-CUST-EMAIL`, `CFG-NOTIFY-CAPTURE-EVENTS`,
  `CFG-NOTIFY-REGISTER-RETENTION-DAYS`, `CFG-NOTIFY-FROM-ADDR`, `CFG-NOTIFY-FROM-NAME`,
  `CFG-NOTIFY-OAUTH-{SERVICE,CLIENTID,SECRET,TENANT}`, `CFG-NOTIFY-SMTP-{HOST,PORT,USER,PASS,SSL}`,
  `CFG-NOTIFY-WS-URI`, `CFG-NOTIFY-WAIT-RESPONSE`, `CFG-NOTIFY-WAIT-MS`,
  `CFG-NOTIFY-EVENT-FORMS` (grid), `CFG-NOTIFY-EVENT-CHANNELS` (grid),
  `CFG-NOTIFY-QUOTA-{EMAIL,TEXT}-MAX`, `CFG-NOTIFY-WARN-{EMAIL,PHONE}`.
- **Do differently — deliverability:** one transport, always TLS, always via a managed provider (SES/SendGrid
  + a real SMS gateway). Drop `Client Workstation Interactive`/`Non-Interactive` entirely — sending customer
  mail from an individual's Outlook is unauditable and destroys deliverability reputation.
- **Do differently — errors:** always asynchronous, always queued, never blocking the user's foreground
  process; a **delivery log with retry and a visible failure queue** replaces `Wait For Server Response`.
- **Do differently — customer email writeback:** never mutate the customer master implicitly. Surface a
  "this address differs from the one on file — update it?" prompt, and log the change to `RPT-AUDIT`.
- **Do differently — quota:** no hard monthly ceiling on transactional customer notifications. If any cap
  exists it must **page an operator**, not silently drop messages.
- Keep: the `%token%` subject templating (generalize to a proper template variable set), the per-locale
  subject translation, the HTML-body/PDF-attachment split, and the per-location `From` override.
- Retention: `CFG-NOTIFY-REGISTER-RETENTION-DAYS` should allow **≥ 400 days** and be **floored, not zeroable**.
- `[DECISION NEEDED]` OAuth2 provider choice (Google vs Microsoft vs neither) and who owns the sending domain
  and its SPF/DKIM/DMARC records.

---

### `SCS-051` Order Line Import Control Settings
*storis_ref: article 15186502242452*

**Purpose.** Maps third-party **catalog numbers** (Micro*D PreVue, and Flexsteel) to **STORIS vendor codes**,
and holds the markup factors used to derive retail price for products imported from the EasyOrder
Configurator.

**Where it lives.** Two documented paths to the same screen:
`System Administration > System Settings > Companion Application System Settings > MicroD Prevue System
Settings > Order Line Import Control Settings`
`System Administration > System Settings > General Administration System Settings > Interface System Settings
> MicroD Prevue System Settings > Order Line Import Control Settings`

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Catalog Number` | Code | "Enter the PreVue or Flexsteel catalog number." **Required for both interfaces.** |
| `Vendor` | STORIS vendor number (FK) | "Enter the STORIS vendor number." **The import process validates that the vendor code exists within the STORIS system.** Used both when **new product records are created** and when assigning the vendor to the **order line items added**. **Required for both interfaces.** |
| `Name` | Text | "The catalog name for the item used in the PreVue database." **Not required by Flexsteel.** |
| `Base Markup` (under `EasyOrder Markup Factors`) | Decimal, **`1` to `9.999999`** | "The base markup factor (if any) you want to use to set retail pricing for this item." **Not required for Flexsteel.** |
| `Option Markup` (under `EasyOrder Markup Factors`) | Decimal, **`1` to `9.999999`** | "The option markup factor (if any) you want to use to set retail pricing for this item." **Not required for Flexsteel.** |

**Behavior & rules.**
- **Base and option markups are separate multipliers** — the configured *options* on an upholstery item can
  carry a different markup from the base frame. That is a real pricing rule, not cosmetics.
- **Range floor is `1`, not `0`.** A markup factor below 1 (i.e. selling below the imported cost) is
  **structurally impossible**. Good guard — worth keeping.
- **The stated reason for the fields is centralization:** "The two 'markup' fields allow you to maintain
  markup information **globally, without having to update every workstation** when making a change. These
  prompts also allow you to establish **different markup factors for each catalog**." So the row is
  per-catalog, and markup is per-catalog, not per-vendor and not per-product.
- **Vendor FK is validated on import**, but nothing is documented about what happens if the catalog number is
  missing from this table — presumably the import fails or creates an unassigned product. **Content gap.**
- Requires the licensed **PreVue Interface** companion application, installed per-workstation.

**Dependencies.** `SCS-047` Micro*D PreVue (the consumer of this mapping); Vendor Settings / vendor master
(`VENDOR_*` scopes registered in wave 1); product creation and pricing (`CFG-COSTING-*` family for how the
imported cost is treated); `SCS-072` Special Order Control Settings.

**Build notes.**
- New IDs: `CFG-CATALOG-VENDOR-MAP` (`{catalog_number, vendor_id, catalog_name}`),
  `CFG-CATALOG-MARKUP-BASE`, `CFG-CATALOG-MARKUP-OPTION` (decimal ≥ 1).
- **Likely out of scope** alongside `SCS-047` for a mattress retailer. If any vendor catalog import is built,
  reuse the pattern: **catalog → vendor mapping table with a validated FK**, plus per-catalog markup, and
  **fail the import loudly** on an unmapped catalog number rather than creating orphan products.
- `[DECISION NEEDED]` Confirm no Flexsteel/PreVue interfaces are in play at LA Mattress.

---

### `SCS-052` Payables Control Settings
*storis_ref: article 15186501543572*

**Purpose.** System settings for **Accounts Payable processing** — AP bill defaults, multi-company posting
targets, automatic AP bill creation, pending-bill conversion tolerance, and (on the Advanced tab) check
printing, bill aging, and EFT remittance-advice email.

**Where it lives.** Five documented access paths to the same routine:
`Accounting > Settings > Control Settings > Payables Control Settings`
`Accounting > Payables > Payables Settings > Payables Control Settings`
`Accounting > Third Party Accounting > Payables > Payables Settings > Payables Control Settings`
`Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Accounting Control Settings
> Payables Control Settings`
`System Administration > System Settings > Accounting System Settings > Payables System Settings > Payables
Control Settings`
**Tabs: `General`, `Advanced`.**

> **Vendor warning, verbatim:** "If using the Intuit® Integrated Financials interface, STORIS comes
> pre-loaded with default settings for QuickBooks®. **With the following exceptions, we strongly advise you
> not change the default settings in this routine:** `Purge History After`, `Direct Shipments`, `Display`."
> **[GUARDED] — under QuickBooks/TPA integration, only three settings on this entire screen are considered
> safe to touch.** Note the exception list names **`Purge History After`**, which does not exist as a field
> on the screen; the corresponding field is **`Days to Keep Invoice History`**. **[CONFLICT] — naming drift
> between the warning and the field.**

**Fields — `General` tab, `Vendor Invoicing with Entry of AP Bills` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Next Number` | Integer — **(LOCKED Field – STORIS access only!)** | "The next sequence number for AP bill documents appears here." Vendor-locked document numbering. |
| `Default Terms Code` | Terms code (FK) | "**If the system cannot find a terms code to use for an AP bill, it uses the default terms code that appears here.**" A silent fallback — reuses the `TERMS_CODE` scope registered in wave 1. |
| `Default Invoice Charges to Inactive` | Checkbox | **Inverted-sense field.** Controls whether the drop-downs for the **three standard invoice charges — `Freight`, `Sales Tax`, `Miscellaneous`** — are active in `Enter/Update Individual Vendor Invoice`. "**To inactive these fields, check the box** at this field. Otherwise, leave the box blank." Overridable per-invoice: `Actions > Activate Invoice Charges`. **A checkbox named "…to Inactive" whose checked state means "disabled" is a UI trap.** |
| `Default Vendor Remit To` | Checkbox | Checked → on a **new expense AP bill** the vendor remit-to is auto-populated per **Vendor Remit To settings** (`VENDOR_REMIT_TO` scope). Unchecked → "remittance needs to be selected" manually. |
| `Prompt for Company` | Checkbox — **multi-company only** | Checked → the **AP Approval** process prompts for the company for the AP postings. Unchecked → the process uses `Company To Use`. |
| `Company To Use` | Company code (FK) — **multi-company only** | The company used for AP postings in AP Approval when `Prompt for Company` is unchecked. |
| `Days to Keep Invoice History` | Integer, **maximum `9999` days** | "Number of days you want to expire before purging AP history files." **[DESTRUCTIVE]** — "**This process purges payment records from the AP payment register that have a status of `reconciled` or `voided`.**" **Lowering this number destroys AP payment history at the next purge. The article documents no blank/zero behavior — [TRISTATE] risk: a blank or `0` value here plausibly means "purge everything", exactly the pattern wave 1 found with `Number of Days History`.** 9999 days ≈ 27 years is the ceiling. |

**Fields — `General` tab, `Automatic Creation of AP Bills` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Direct Shipments` | Checkbox | "To **automatically create AP bills for direct-ship purchase orders when the associated sales order is released for completion**, check the box." **A sales-side event (order release) creates a payable. One of the three settings the QuickBooks warning permits changing.** |
| `Bill To Company` | Company code (FK) | Company to which automatically generated **expense bills** post. "**If Multi-Company processing is not active on your system, your company defaults and you cannot edit this field.**" |
| `Refund Bill To Company` | Company code (FK), nullable | Company used for **customer refund bills**. **[TRISTATE]** — "If you leave this field blank, the system uses the **log-on store location** for customer refund bills." So blank ≠ unset; blank = "derive from the operator's login location", which makes the posting company depend on **who** processed the refund and **where they were logged in**. |
| `Return to Vendor - Use Return Location Company` | Checkbox | Checked **and** multi-company active → the **return warehouse location's company** is used when creating the AP Bill via **Complete Return-To-Vendor**. Otherwise `Bill To Company` is used. "**If multi-company processing is not active, the company defined in the `Bill To Company` setting above is used regardless of whether this check box is enabled or not.**" |

**Fields — `General` tab, `Pending Bill Conversion` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allowable Cost Variance` | Percentage | "The percentage difference between **receipt cost** and **AP bill cost** … The program converts **only** AP bills whose percentage difference between receipt cost and AP bill cost is **lower than** the value you specify here." **[TRISTATE]** — a value of `0` means *no* bill can convert automatically (nothing is strictly lower than 0), while a large value auto-converts everything including genuine vendor overcharges. **This single number is the entire three-way-match tolerance for the business.** **Not active if TPA is active.** |
| `End of Day Action` | Enum — exactly four values | What End-of-Day does when running **Convert Pending Bills**: `None`; `Convert Only` — "convert eligible pending AP bills"; `Report Exceptions Only` — "converts **no** AP bills and report exceptions"; `Convert and Report Exceptions` — "convert eligible pending AP bills **and** report exceptions". **`None` means cost variances are never surfaced at all.** |
| `Allow Payment of Pending Bills` | Checkbox — **STORIS Accounting only** | Checked → "**merchandise purchase orders can be paid prior to receiving the merchandise in STORIS.**" **This disables the receive-before-pay control — a material internal-control setting.** **Also appears in `Vendor Settings` and `Vendor Ship-From Settings`** to permit/deny at the vendor and ship-from levels — a three-level hierarchy. |
| `Paid Pending Bill Reimbursement Method` | Enum: **`Accounts Payable`**, **`Vendor Receivable`** | Default method by which vendors reimburse you for **merchandise that was paid for but was not received**. Overridable per vendor in **Vendor Settings**. **STORIS Accounting only.** |

**Fields — `General` tab, `Display` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Product` | Checkbox | Show the **Product** column in the grid of the **AP Approval Selection Screen**. |
| `Vendor Model` | Checkbox | Show the **Vendor Model** column in the same grid. **[REUSE]** — the vendor-model concept is already registered as `CFG-INV-VENDORMODEL`; this is a display consumer of it. One of the three settings the QuickBooks warning permits changing. |

**Fields — `Advanced` tab** *(the whole tab is "active only if using STORIS Accounting. Checks are printed via Enhanced Laser Forms.")*

*`Checks` group*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Print Bank` | Bank code (FK, searchable) | Default bank for check printing. **"If multi-company processing is not active, this field is required. If multi-company processing is active, this field clears and inactivates, and the `Default Check Bank` field in the Company Settings becomes mandatory."** **[GUARDED] — turning multi-company on WIPES this field.** See also `SCS-022` Default Check Print Bank. |
| `Detail Lines on Stub` | Integer — **(LOCKED FIELD - STORIS ACCESS ONLY!)** | "**The default is `14`** – the number of detail lines that print on the standard STORIS check form. When printing checks, the system **always** references this field, regardless of the type of check print." **With laser checks this is lines-available, and the program divides it by lines-per-bill to get bills-per-stub.** Worked example from the article: a 14-line stub using 2 lines per bill → **enter `7`** → 7 bills per stub × 2 lines = 14 lines. **Setting this wrong silently overflows or under-fills check stubs and can cause voided checks.** |
| `Next Positive Pay Batch` | Integer — **(LOCKED FIELD - STORIS ACCESS ONLY!)** | Number assigned to the next positive-pay batch created via **Create Bank Check File**; incremented on each run. **Resetting a positive-pay batch number causes the bank to reject or duplicate a batch.** |
| `Sort Detail Lines on Stub by` | Enum: **`Invoice Number`**, **`Invoice Date`**, **`AP Bill Number`** — **default `Invoice Number`** | Applies to **both** the standard check print and Forms Designer check print. **Far-reaching side effect:** "The option chosen here **also determines the sequence of AP bills in `Select and Approve Bills for Payment`**, including the AP checks in the grid of the **Check Review** tab of that process **as well as the invoice detail information in `Report Payables Disbursement`**." **A check-stub cosmetic setting silently re-orders an approval workflow and a financial report.** **[CONFLICT] — one setting, three unrelated consumers.** |
| `Print Checks by Descending Amount` | Checkbox | "The highest value check prints first." |
| `Print Refund Checks at End of Check Run` | Checkbox | Refund checks print after the non-refund checks. **Interaction rule, verbatim:** "If **both** `Print Refund Checks at End of Check Run` **and** `Print Checks by Descending Amount` are enabled, **non-refund checks and refund checks are grouped separately and printed in descending order.**" |

*`Bill Aging Days` group*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Bill Aging Days` | Integer | "Referenced by reports and inquiries that show AP bill aging, for example the **View a Vendor's Payable Activity** routine." (The article does not state the bucket structure — **content gap**.) |
| `Method` | Enum: **`Invoice Due Date`**, **`Discount Terms Date`**, **`Anticipated Payment Date`** | "The method by which you want open bills to age on the **Cash Requirements** and **Aged Trial Balance** reports." **Changing this restates every aging report retroactively — cash-flow forecasting shifts with no data change.** |
| `Freight in Terms Amount` | Checkbox | Checked → freight is included in the terms amount. **[TRISTATE-adjacent]** — "**If you leave this field blank, when creating AP freight bills, the system defaults the pay date instead of the terms date.**" So blank does not just exclude freight from the terms amount; it also **changes which date is defaulted on freight bills**. Two unrelated behaviors on one checkbox. |

*EFT remittance-advice email group*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Copy Emailed EFT Remittance Advice To` | Email address | An additional CC for remittance advice, on top of the email sent to the **vendor remit-to address**. Applies to `Email Remittance Advice` in **Create Electronic Funds Transfer File** and the standalone **Email Remittance Advice** routine. |
| `Email Header Message for Remittance Advice` | Text, **max 50 characters** | "The text that appears **prior to the payment table**." |
| `Email Sent By for Remittance Advice` | Email, **max 50 characters** | Address displayed after the email `From:` field. "**A valid email must be entered in the proper email format (`xxxxx@xxxxx.xxx`)**". |
| `Email Subject for Remittance Advice` | Text, **max 50 characters** | Subject line. **[TRISTATE]** — "**The subject line prints the company name associated with the bank if this setting does not contain a subject.**" Blank = derived-from-bank, not empty. |

**Behavior & rules — the hard ones.**
- **`Allow Payment of Pending Bills` is the segregation-of-duties setting on this screen.** Turning it on lets
  you pay for merchandise you have not received. It has three levels (system / vendor / vendor ship-from),
  and STORIS documents **no audit trail** for changing it.
- **`Allowable Cost Variance` is the invoice-matching tolerance and is a strict `<` comparison**, so the
  boundary case (variance exactly equal to the tolerance) does **not** convert.
- **`End of Day Action = None` silently disables pending-bill conversion and exception reporting** — bills
  accumulate unconverted with nobody told.
- **`Days to Keep Invoice History` purges reconciled/voided AP payment register records.** Reconciled and
  voided are exactly the records an auditor asks for.
- **`Refund Bill To Company` blank derives the company from the operator's login location** — a posting
  decision driven by user session state.
- **Enabling multi-company clears `Print Bank`** and moves the mandatory setting to Company Settings.
- **`Sort Detail Lines on Stub by` leaks out of check printing into an approval screen and a disbursement
  report.**
- Several fields are **`(LOCKED - STORIS access only)`**: `Next Number`, `Detail Lines on Stub`,
  `Next Positive Pay Batch`. The customer cannot self-serve document numbering or positive-pay batching.

**Dependencies.** `SCS-022` Default Check Print Bank; `SCS-037` General Ledger Control Settings; `SCS-080`
Third-Party Accounting Control Settings (TPA disables `Allowable Cost Variance`); `SCS-084` Vendor
Receivables Control Settings (`Paid Pending Bill Reimbursement Method = Vendor Receivable`); Company Settings
(`COMPANY` scope — `Default Check Bank`); Vendor Settings and Vendor Ship-From Settings (`VENDOR_REMIT_TO`,
`Allow Payment of Pending Bills`, `Paid Pending Bill Reimbursement Method`); Terms Code table (`TERMS_CODE`
scope); Enhanced Laser Forms / Forms Designer; End-of-Day; Create Bank Check File; Create Electronic Funds
Transfer File; Complete Return-To-Vendor; PO receiving; `SCS-058` Purchasing Control Settings; Intuit
Integrated Financials / QuickBooks interface. **[REUSE]** `CFG-INV-VENDORMODEL`, `CFG-INV-RCVCLOSE`
(receipt closure determines when receipt cost is final for the variance comparison), `CFG-COSTING-*`.

**Build notes.**
- New IDs: `CFG-AP-NEXTNUMBER`, `CFG-AP-DEFAULT-TERMS`, `CFG-AP-CHARGES-INACTIVE`,
  `CFG-AP-DEFAULT-REMITTO`, `CFG-AP-PROMPT-COMPANY`, `CFG-AP-COMPANY-TOUSE`,
  `CFG-AP-INVOICE-HISTORY-DAYS`, `CFG-AP-AUTO-DIRECTSHIP-BILL`, `CFG-AP-BILLTO-COMPANY`,
  `CFG-AP-REFUND-BILLTO-COMPANY`, `CFG-AP-RTV-USE-RETURN-LOC-COMPANY`, `CFG-AP-COST-VARIANCE-PCT`,
  `CFG-AP-EOD-PENDING-ACTION`, `CFG-AP-ALLOW-PAY-PENDING`, `CFG-AP-PENDING-REIMBURSE-METHOD`,
  `CFG-AP-APPROVAL-GRID-COLUMNS`, `CFG-AP-CHECK-BANK`, `CFG-AP-STUB-LINES`, `CFG-AP-NEXT-POSPAY-BATCH`,
  `CFG-AP-STUB-SORT`, `CFG-AP-CHECK-DESC-AMOUNT`, `CFG-AP-REFUND-CHECKS-LAST`, `CFG-AP-AGING-DAYS`,
  `CFG-AP-AGING-METHOD`, `CFG-AP-FREIGHT-IN-TERMS`, `CFG-AP-REMIT-{CC,HEADER,SENDER,SUBJECT}`.
- **Do differently — naming and sense:** rename `Default Invoice Charges to Inactive` to a positive
  `Invoice charges enabled by default` boolean. Never ship a checkbox whose checked state means "off".
- **Do differently — retention:** `CFG-AP-INVOICE-HISTORY-DAYS` must be **floored** (never 0/blank), and the
  purge must be **soft-delete + archive**, never a hard purge of reconciled/voided payment records. Log every
  purge run and row count to `RPT-AUDIT`.
- **Do differently — pay-before-receive:** make `CFG-AP-ALLOW-PAY-PENDING` a **permissioned, audited,
  per-transaction override** rather than a standing system flag. Record who authorized each pre-receipt payment.
- **Do differently — split the overloaded settings:** separate `Freight in Terms Amount` into
  `freight_included_in_terms_amount` and `freight_bill_date_basis` (`terms_date` | `pay_date`); separate the
  check-stub sort from the approval-screen sort and the disbursement-report sort.
- **Do differently — tolerance:** express invoice matching as **both** a percentage **and** an absolute
  dollar floor (a 5% variance on a $12 freight bill is noise; on a $40,000 container it is not), and make
  the comparison `<=` with the boundary documented.
- Keep: the vendor/ship-from override hierarchy for pending-bill payment; the `Return to Vendor` company
  derivation; the "highest check first" and "refunds last" print grouping (harmless and useful).
- `[DECISION NEEDED]` Is LA Mattress multi-company/multi-entity? Roughly a third of this screen is inert if
  not, and `Refund Bill To Company` blank-derivation is a landmine if it later becomes multi-company.
- `[DECISION NEEDED]` Third-party accounting (QuickBooks/TPA) or native GL? TPA disables `Allowable Cost
  Variance` entirely, which moves three-way matching outside the ERP.

---

### `SCS-053` Payment Card and Device Settings
*storis_ref: article 15186452993556*

**Purpose.** Configures **EMV credit/debit card processing**, the associated **signature-at-point-of-possession**
capture, and the **BIN/IIN file** download used to identify card issuers. This is the PCI-relevant screen.

**Where it lives.** `System Administration > System Settings > Companion Application System Settings >
Credit Card System Settings > Payment Card and Device Settings`.
**Page headings: `EMV`, `EMV Signature`, `BIN/IIN File`.**

> "**Legacy signature capture in conjunction with legacy credit card devices is no longer supported.**"
> Supported processors today: **`Tender Retail`** or **`Shift-4`**. "Other processors may be available in the
> future."

**Fields — `EMV` page, `General` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Processor` | **Display-only** enum: `Tender Retail`, `Shift-4` | Which processor is in use. Not operator-settable. |
| `Client ID` | GUID | "The client GUID (globally unique identifier). **This information is provided by Tender Retail or Shift-4.**" |
| `Server Time Out milliseconds` | Numeric, **min `0`**, **max length 20 characters** | Max wait for a processor-server response before assuming unresponsive and returning an error. **Hard tuning rule, verbatim: "This number should be at least 1,000 milliseconds more than the time-out value set for the EMV Server."** **[TRISTATE] — the documented minimum is `0`, which means "give up immediately"; every card transaction would error.** |
| `Shift-4 Local EMV` | Checkbox — **only available if the `EMVS4` (EMV Shift-4) module is licensed** | Checked → the account uses the **Shift-4 Cloud EMV architecture, where each pin pad is connected directly to the client workstation**. Blank → **Traditional Full Service UTG process flow**. **[GUARDED] — this switches the entire payment topology; changing it mid-day orphans in-flight terminal sessions.** |
| `Always Print Merchant Receipt` | Checkbox — **default checked** | Checked → merchant copy prints. Unchecked → merchant copy does **not** print if **(1)** the card is present and the customer signed on the payment terminal, **or (2)** the card is not present. **Precedence rule (verbatim):** "**The `Print Merchant Receipt` setting in Warehouse/Store Location Settings takes precedence over this setting.**" If this is checked but the location setting is `Never`, **no receipt prints**; if this is unchecked but the location setting is `Always`, **a receipt prints**. **"This setting does not apply when reprinting. If reprinting, both the merchant and customer copy prints."** |
| `Always Print Customer Receipt` | Checkbox — **default checked** | Same shape: **`Print Customer Receipt` in Warehouse/Store Location Settings takes precedence**, with the same `Never`/`Always` override table and the same reprint exemption. |
| `Transaction Retention Days` | Integer, **`30`–`9999`**, positive; **default `730`** ("2 years approximately, not considering leap days") | **[TRISTATE] + [DESTRUCTIVE].** "The entry in this field **must be greater than or equal to 30** in order to retain current transactions. **If you leave this field null, this indicates that no purge is to take place.**" So: **null = keep forever; 30–9999 = purge older than N days; below 30 is rejected.** Purging is executed by the scheduled process **"Purges records from CAX file older than specified age"** via **Schedule a Process** — **so the setting alone does nothing until someone schedules it, and scheduling it destroys card-transaction records.** |
| `Recurring Payment Location` | Location (FK) | "The location used for posting payments and credit card-related processing charges, such as **for customer memberships**." **"The available locations are those that are configured to use `Credit Card Gateway` or `Shift4` payments."** |

**Fields — `EMV` page, `Manual` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Manual Authorization at Non-Process Locations` | Checkbox | "Allow **non-processing locations** to call for manual authorizations." |
| `Use Payment Terminal to Prompt for Billing Zip Code` | Checkbox | Checked → the customer's **billing zip code** must be entered when a card is **manually keyed** into a payment terminal; "**this allows Shift4 UTG and the payment terminal, not STORIS, to supply the billing zip code and the remainder of the AVS data to Shift4.**" **"This setting controls the behavior for all payment terminals connected to the system; note that it is not specific to a user or a location."** Unchecked → "**STORIS supplies the billing address and zip code that is on file for the customer assigned to the current order.**" **Hard rule with fraud consequences: unchecked means AVS is answered from your own database rather than by the cardholder — AVS then validates nothing.** Setup is documented in the `Additional Setup Information` section of the `Shift-4` tab of `Online Credit Card Processing Overview`. |

**Fields — `EMV` page, `Pre-Authorized Deposits` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow Pre-Authorized Deposits` | Checkbox — **default unchecked**; **applies system-wide** | Allows a user logged in at a **Shift4 processing location** to process and maintain **a single pre-authorized deposit per order** in `Enter a Sales Order`. **Hard cardinality rule: one pre-auth per order.** |
| `Amount Increase Limit` | Integer, **`0`–`99,999`**; **required**; **default `0`** | "The amount an existing pre-authorized deposit can be increased **without requiring a security override**." **[TRISTATE] — "A value of `0` indicates that a security override is ALWAYS required."** So 0 = maximum control (not "no limit"), which is the opposite of the usual reading of 0. **The default is the safe value; raising it weakens control.** |

**Fields — `EMV` page, `Token Sharing` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Active` | Checkbox — **default off (unchecked)** | Turns token sharing on/off. When checked, STORIS shows an informational dialog naming the **`Shift4 Shared Token Load`** menu process, which loads tokens from prior Shift4 transactions. **[DESTRUCTIVE — the inverse direction]:** "If you leave this box blank, **no data is kept for the sharing of tokens** (aside from what is needed to assist in refunding between different selling locations)." **Turning token sharing off means the shared-token data stops being retained — a stored-payment-credential capability that silently ceases.** |
| `Require CVV` | Checkbox — **default unchecked** | Unchecked (default) → "**STORIS does not require the entry of the CVV when using a previously shared token.**" Checked → CVV is required **whenever a previously stored token is used for a credit card transaction (other than a refund)**. **The default is the less secure option: stored card tokens can be charged with no cardholder verification. Card-not-present fraud exposure.** |
| `Token Retention Days` | Integer, **`1`–`730`**; **required** | Days a token is retained in the STORIS database. **Hard coupling rule: "This value should be set to match the `Token Storage Duration` setting in Shift4's Dollars On The Net account settings."** **[GUARDED] — a mismatch between the two systems produces tokens that STORIS believes are valid but the processor has already expired (declines), or vice versa (orphaned local tokens).** |

**Fields — `EMV` page, `Resolve Abandoned Transactions` section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Run Automatically During EOD` | Checkbox — **default blank** | Checked → the **Resolve Abandoned Transactions** process runs during **EOD (Generate Daily Reports)**. Blank (default) → it does not; it must be run on demand from **`Resolve Abandoned External Card Transactions`** on the menu. **Default-off means abandoned card transactions accumulate unresolved unless someone remembers to run it.** |
| `Only Mark As Resolved` | Checkbox — **default unchecked** | Unchecked (default) → "**when an abandoned transaction is encountered, it is processed through the Merchant Services Provider**" — i.e. **the ERP actually completes/settles the card transaction automatically.** Checked → the process "**should not attempt to do anything** with transactions that are determined to be abandoned. The transactions are instead **marked as completed in STORIS so that they are not included again in this process**." **[DESTRUCTIVE/[IRREVERSIBLE] — checking this permanently marks real, unsettled card transactions as completed inside STORIS while doing nothing at the processor. The money never moves and the ERP will never look at them again.** |
| `Prior Days to Include` | Integer, **`0`–`999999`**; **default `30`** | **[TRISTATE]** — "**To resolve only the current day's abandoned transactions, enter `0` days.** Any setting **greater than 0** indicates that this number of days beyond the current day are to be included in the search." So `0` = today only, not "disabled". |

**Fields — `EMV Signature` page**

> "This tab contains the settings used by STORIS to control **signature capture devices** when taking a
> signature and the **EMV platform is enabled for the location**."

| Field | Type | Purpose / business rule |
|---|---|---|
| `ECA Transactions` | Checkbox | Enables Signature Capture for **electronic check authorization** transactions. Ties to `SCS-031` Electronic Check Processing Control Settings. |
| `Complete Pickup Transactions Without Accessing Order Entry` | Checkbox | Enables Signature Capture for the **`Complete a Pickup without Accessing Order Entry`** routine. |
| `Take With and Quick Sales Transactions` | Checkbox | Enables Signature Capture for **take-with orders and quick-sale transactions**. When checked, "each time you file one of these transaction types, the option appears to record a **'proof of possession' customer signature**." Signatures are viewed via **`Actions > View Signatures`** in `View an Existing Sales Order`. **Shift-4 caveat (verbatim): "your settings and the type of order determine whether the customer signature prompt appears. Also, once the order is complete, the signature CANNOT BE RECALLED in STORIS using the `View Signatures` option."** **[IRREVERSIBLE] — under Shift-4, proof-of-possession signatures become unretrievable after order completion, which defeats the entire evidentiary purpose.** |
| `Show Signature` | Checkbox | **Active only if `Signature Capture` is active in General System Control Settings (`SCS-038`).** Checked → the captured signature is displayed on the workstation for review. **"For all business documents, other than a credit card receipt, you have the opportunity to accept or decline the signature after reviewing it."** Business-document signatures appear on the **`Signature Acceptance`** screen; **credit card signatures appear on a different `Signature Display` screen, where you can view but NOT accept or decline.** Blank → no review opportunity at all. Applies to sales orders, returns, customer payments, insurance forms, etc. |
| `Amount Required for Signature` | Currency, **`.01` to `9999.99`**, nullable | Usable only if `Take With and Quick Sale Transactions` is checked. **[TRISTATE] — "If you leave this field null, then the customer is prompted to sign for proof of possession REGARDLESS of the amount."** A value → prompt only when merchandise amount is **equal to or greater than** the value. **Null = always prompt (the strict setting), a positive number = a floor. There is no documented way to say "never".** |
| `Device Character Display Limit` | Integer — **(STORIS Locked Field!)** — **default `4,096`** | Text characters (including spaces) supported by the `Additional Text` field in **`Configure Document Signature Capture`**. "If the text … surpasses the defined limit, STORIS will **analyze and separate the text into sections that fit within the display limit**. You will also be provided with a prompt to choose to continue to read or exit the prompt." **Legal consequence: a terms-and-conditions block longer than the device limit is paginated, and the customer can "exit the prompt" without reading it — then sign.** |

**Fields — `BIN/IIN File` page**

> A **BIN/IIN number is a 4-to-6 digit number** on a credit card identifying the issuing institution and the
> card's capabilities/branding. `BIN` = Bank Identification Number (older term); `IIN` = Issuer
> Identification Number (current term). The file comes from a third-party banking/processing institution.
> **"This feature is available for users of the `Shift4` platform ONLY and is not available on systems using
> either the `STORIS Legacy Credit Card` or `Tender Retail` platforms."**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Download URL` | Text (URL or IP) — **defaults to blank** | Server providing the BIN/IIN file. |
| `User ID` | Text — **defaults to blank** | Provider-assigned user ID, "submitted to the provider **when the SFTP connection is made**". |
| `Password` | Text (secret) | Password needed to extract the contents of the BIN/IIN file. **The article does NOT say this field is encrypted, unlike the OAuth2 secrets in `SCS-050`. Flagged.** |
| `File Name` | **Display-only** | **Article text says it "shows the last date that the BIN/IIN file was received and successfully processed" — which is a date, not a file name. [CONFLICT] — the field label and the documented content disagree; likely a doc error, but must be verified before mapping.** |
| `Last downloaded on` | **Display-only** date | Date of the last successful download. |

> **Failure rule (verbatim):** "If the `Download URL`, `User ID`, or `Password` fields are left blank, the
> process **does not run** from the menu system (where it shows an error dialog) or as a scheduled process
> (**where it logs errors**)." **A scheduled BIN/IIN refresh fails silently to a log.**

**Behavior & rules — the hard ones.**
- **Location settings outrank this screen for receipt printing.** Two settings with `Always`/`Never` semantics
  at the location level override two booleans here, producing a 2×3 truth table that must be implemented
  exactly. **[CONFLICT]** by design.
- **`Require CVV` defaults to off for stored tokens** — the single most consequential default on this page.
- **`Amount Increase Limit = 0` means "always require override"** — a zero that means maximum restriction,
  the inverse of the usual convention. Easy to "fix" into a security hole.
- **`Only Mark As Resolved` fabricates a completed state** for transactions that were never settled.
- **`Transaction Retention Days` null = never purge; ≥30 = purge.** No way to express "purge everything".
- **Token retention must be kept in sync with a setting in a *different vendor's* portal.**
- **Under Shift-4, captured proof-of-possession signatures cannot be recalled after order completion.**
- **`Server Time Out milliseconds` must exceed the EMV Server's own timeout by ≥1000 ms** — a cross-system
  ordering constraint with no validation.

**Dependencies.** `SCS-038` General System Control Settings (`Signature Capture` master flag);
Warehouse/Store Location Settings (`Print Merchant Receipt`, `Print Customer Receipt`, payment platform per
location — `CFG-LOC-*`); `SCS-040` Import BIN/IIN Table (part A — the consumer of the downloaded file);
`SCS-031` Electronic Check Processing Control Settings; `SCS-054` Point of Sale Control Settings;
`SCS-060` Quick Sale Control Settings; `Configure Document Signature Capture`; `Schedule a Process`
(purge job, BIN/IIN download job); `Online Credit Card Processing Overview`; `Shift4 Shared Token Load`;
`Resolve Abandoned External Card Transactions`; End-of-Day / `Generate Daily Reports`;
`SEC-*` security override for pre-auth increases; `SAR-024` Report Secured Decryption Activity.

**Build notes.**
- New IDs: `CFG-PAY-PROCESSOR`, `CFG-PAY-CLIENTID`, `CFG-PAY-TIMEOUT-MS`, `CFG-PAY-S4-LOCAL-EMV`,
  `CFG-PAY-PRINT-MERCHANT-RECEIPT`, `CFG-PAY-PRINT-CUSTOMER-RECEIPT`, `CFG-PAY-TXN-RETENTION-DAYS`,
  `CFG-PAY-RECURRING-LOCATION`, `CFG-PAY-MANUAL-AUTH-NONPROCESS`, `CFG-PAY-TERMINAL-PROMPTS-ZIP`,
  `CFG-PAY-ALLOW-PREAUTH-DEPOSIT`, `CFG-PAY-PREAUTH-INCREASE-LIMIT`, `CFG-PAY-TOKENSHARE-ACTIVE`,
  `CFG-PAY-TOKENSHARE-REQUIRE-CVV`, `CFG-PAY-TOKEN-RETENTION-DAYS`, `CFG-PAY-ABANDONED-EOD`,
  `CFG-PAY-ABANDONED-MARKONLY`, `CFG-PAY-ABANDONED-PRIORDAYS`, `CFG-SIG-{ECA,PICKUP,TAKEWITH,SHOW}`,
  `CFG-SIG-MIN-AMOUNT`, `CFG-SIG-DEVICE-CHARLIMIT`, `CFG-BIN-{URL,USERID,PASSWORD}`,
  plus `SEC-POS-OVERRIDE-PREAUTH-INCREASE`.
- **Do differently — defaults that must flip:** `Require CVV` on stored tokens defaults **on**;
  `Use Payment Terminal to Prompt for Billing Zip Code` defaults **on** (never answer AVS from our own DB);
  `Run Automatically During EOD` defaults **on** for abandoned-transaction resolution.
- **Do differently — `Only Mark As Resolved` should not exist as a standing setting.** Marking an unsettled
  transaction complete must be a **per-transaction, permissioned, reason-coded, audited** action feeding
  `RPT-AUDIT`, never a checkbox that silently applies to every future run.
- **Do differently — never store the BIN/IIN SFTP password unencrypted.** All three secret fields on this
  screen (`Client ID` is not secret, but `Password`, and the OAuth secrets in `SCS-050`) go into a secrets
  manager, referenced by handle. And **surface scheduled-job failures as alerts, not log lines.**
- **Do differently — receipt precedence:** replace the two-level `Always`/`Never`/boolean tangle with a single
  three-value setting (`always` | `never` | `by_transaction_rule`) resolved by the standard
  most-specific-scope-wins resolver (`LOCATION` beats `SYSTEM`).
- **Retention:** `CFG-PAY-TXN-RETENTION-DAYS` — model the "never purge" case as an **explicit enum choice**,
  not as null. Keep the ≥30-day floor. PCI DSS argues for the *opposite* pressure on cardholder data (retain
  no longer than necessary), so this needs a documented retention decision, not a default.
- **Signature evidence:** store signatures as immutable, timestamped, hash-chained artifacts attached to the
  document, **retrievable after completion** — explicitly fixing the Shift-4 gap. The full T&C text signed
  must be stored **with** the signature, not just referenced, and pagination must not permit "exit" without
  a recorded acknowledgement.
- `[DECISION NEEDED]` Processor choice (Shift-4 vs Tender Retail vs a modern gateway). BIN/IIN is Shift-4-only,
  and Shift-4 carries the signature-recall defect above.
- `[DECISION NEEDED]` PCI scope: do we tokenize entirely at the gateway (recommended, keeps us out of scope)
  or retain any token/BIN data locally?

---

### `SCS-054` Point of Sale Control Settings
*storis_ref: article 15186502233620*

**Purpose.** The single largest control screen in STORIS and **the place where most retail business rules
actually live** — order numbering, fulfillment defaults, credit checks, retention/purging, delivery charges
and recalculation, ATP, reservations and auto-transfers, commissions, margin exception handling, printed
documents, backdating, tax, discounts, and as-is pricing. It governs `Enter a Sales Order`,
`Enter a Shopping Cart`, exchanges, returns, and much of logistics.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Point of Sale
Control Settings`.
**Page headings: `General`, `Customer`, `Logistics`, `Inventory`, `Commissions`, `Profit and Costs`,
`Printed Documents`, `Advanced`, `Pricing`.**

---

#### `General` page

**`Transaction Numbers`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Next Point of Sale / Service Transaction` | Max **7 characters** — **(LOCKED - STORIS access ONLY!)** | Seed for auto-generated transaction numbers for sales orders, transfers and other transactions; increments by one "provided the number has not already been used in the system". **[TRISTATE] — "If you leave this field blank, users must MANUALLY enter transaction numbers for sales orders and transfers."** Interacts with `Automated & Manual POS Numbers` on the **Miscellaneous** tab of Warehouse/Store Location Settings: **"The `Next Transaction Number` field must contain a value in order to allow for both types of order numbering."** **Lower-case letters are transposed to upper-case.** **When auto-generating, the letters `O` and `I` are skipped "when creating a new customer" to avoid confusion with `0` and `1` — but they can still be used in manually created customer numbers.** |
| `Add Store To Transaction` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Prepends the warehouse/store location code to transaction numbers during sales order entry. **"Only the base transaction number increments … Store location prefixes do not increment."** |
| `Use Sales Order for Auto Transfers` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Builds a derived auto-transfer number: **prepend `"T"` to the original transaction number and append the originating line number.** Worked example, verbatim: line 2 of sales order `10303` → auto-transfer **`T103032`**. Blank → next available transaction number. **Collision hazard, acknowledged by STORIS: "Once the system creates an auto transfer for a line item using the above formula, the system assigns the next available transaction number to any ADDITIONAL auto-transfers created for the line item. The new transaction number does not include a prefix of `T`."** So the scheme is **not** stable for repeat transfers, and `T` + order + line is ambiguous for multi-digit line numbers (order `1030`, line `32` collides with order `10303`, line `2`). **[CONFLICT] — do not reproduce this numbering scheme.** |

**`Point of Sale Defaults` / `POS Transactions`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `POS Transactions` | Enum: **`Sales Order`**, **`Layaway`**, **`Sales Quote`** | Default value of `Order Type` in `Enter a Sales Order`. **Hard rule: "You cannot change a layaway order to a sales quote, or vice-versa."** |
| `Order Source` | FK to order-source list | Default order source assigned to new sales orders. **"If the Order Source is assigned to NextGen, the code may not be deleted and `Exclude During Order Entry` cannot be unchecked."** |
| `NextGen Order Source` | Code | Default order source code associated with **NextGen** sales. |
| `Order Source Required in Enter a Sales Order` | Checkbox | Requires an Order Source before a sales order can be completed. |

**`Fulfillment Methods`**

> **NOTE (verbatim):** "If the **`Prohibit Customer Personal Information when not Required by Sale`** setting
> is checked in Warehouse/Store Location Settings, STORIS **recommends** setting these next three settings to
> `No Default`. **Note that this is a recommendation and is not enforced.**" **A privacy control that is
> advisory only — exactly the kind of thing we should enforce.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Sales Orders` | Enum: **`Delivery`**, **`Customer Pick Up`**, **`Take With`**, **`No Default`** | Default `Fulfillment Method` in Sales Order Entry and `Enter a Shopping Cart`. **"`Take With` — if this option is selected, the Fulfillment Method field in `Enter a Shopping Cart` defaults to `None Selected` because a shopping cart cannot be a take-with order."** |
| `Exchanges` | Enum: **`Delivery`**, **`Customer Pick Up`**, **`Take With`**, **`No Default`** | Default `Type` in Exchange Processing. |
| `Returns` | Enum: **`Regular Pick Up`**, **`Customer Drop Off`**, **`No Default`** | Default `Type` in `Enter a Return`. **Different enum from the other two.** |

**`Delivery Locations`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Ship From Location` | Enum: **`Selling Store`**, **`Zip Code Normal Fulfillment Location`**, **`Specific Location`** | How the ship location defaults for delivery orders. `Specific Location` reveals a mandatory `Warehouse/Store Location ID` field. |
| `Stock Location` | Enum: **`Delivery Ship From` (default)**, **`Selling Store`**, **`Zip Code Delivery Stock Location`**, **`Specific Location`** | Default stock location for delivery orders. **"A specific location must be selected in order to save changes to this screen"** when `Specific Location` is chosen. **Multiple Concurrent Fulfillments rule:** with `Delivery Ship From`, "the order's Stock Location defaults to the default fulfillment location **based on the Bill To customer address**. If a stock location is not assigned, the **Normal Fulfillment Location** is used." |

**`Customer Pickup Locations`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Stock Location` | Enum: **`Pickup Location` (default)**, **`Selling Store`**, **`Zip Code Pickup Stock Location`**, **`Specific Location`** | Default stock location for customer-pickup orders; `Specific Location` requires an ID and blocks save without one. Multiple-fulfillment fallback: **Normal Fulfillment Location**. |
| `Pickup Location` | Enum: **`Selling Store`**, **`Delivery Ship From`**, **`Zip Code Pickup Fulfillment Location`**, **`No Default`**, **`Specific Location`** | **`No Default` "requires users to specify a pickup location before proceeding to the Merchandise tab in `Enter a Sales Order`."** Fallback: "If the `Pickup Fulfillment Location` is not assigned, the **Normal Fulfillment Location** is used." |

> **Scope rule (verbatim):** "The settings defined here are used as the **system default for all locations**.
> If a specific selling location requires unique defaults, they can be defined in Warehouse/Store Location
> Settings (**Inventory & Logistics** page). **The `Zip Code Pickup Stock Location` and `Zip Code Delivery
> Stock Location` options are only available when the `Delivery Locations` and `Customer Pickup Locations`
> within Warehouse/Store Location Settings are set to `Use POS Control Settings`.**" **A circular dependency:
> the location screen must defer to this screen for two of this screen's options to be selectable.**

**`Direct Shipments`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow on Sales Orders` | Checkbox | Applies to orders from `Enter a Sales Order` **and eBridge web orders**, and to carts from `Enter a Shopping Cart` **and eRoam**. **"This setting overrides the settings in the `Direct Ship` section in the Miscellaneous tab of Advanced Product Settings."** — **a system flag overriding a per-product flag.** |
| `Allow on Layaways` | Checkbox | **Hard rule: "Only one delivery method can be designated for line items on layaways; 'split tickets' … are not allowed on layaway orders. Therefore, if you select direct ship for the first line item, ALL line items on the layaway must also be direct ship until the layaway is converted to a sales order."** Also overrides Advanced Product Settings. |
| `Allow on Quotes` | Checkbox | Applies to quotes from eBridge and `Enter a Sales Order`. **Same all-or-nothing rule as layaways.** Also overrides Advanced Product Settings. |
| `Access PO Delivery Date` | Checkbox | Lets users change the date of a direct-ship item on a PO from within Sales Order Entry (via `Actions > Direct Ship Details` on the Merchandise tab → `Purchase Order Linkage Detail Maintenance Screen` → `Date`). Otherwise the change must go through `Acknowledge a Purchase Order`. |
| `Payable Approvals On Hold` | Checkbox | "When you complete a direct shipment, the system **automatically creates an AP bill for the vendor**." Checked → **all** AP bills created for direct-ship items are put on hold, and the **`Payable Approvals on Hold Code`** field activates and becomes **mandatory** (searchable list of AP hold codes). |
| `Payable Approvals on Hold Code` | AP hold code (FK) | Mandatory when the box above is checked. |

> **NextGen interaction (verbatim):** "STORIS NextGen will review the following settings to determine if
> direct ship options are available for the created shopping cart: `Direct Shipments` in Point of Sale
> Control Settings; `Checkout Settings` in NextGen. … **Direct ship ONLY products will appear in the product
> search but cannot be added to the cart.** … **Items marked as direct ship ALLOWED can be added to the
> shopping cart but the option to create a direct ship fulfillment will not be available.**" **A silent
> dead-end for the shopper.**

**`Retention Periods`** — **every field in this group is [DESTRUCTIVE]**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Voided Orders` | Days | Days from the void date that voided orders remain before purging; **the End-of-Month process** does the purge. **[TRISTATE] + [DESTRUCTIVE]: "If you leave this field blank, the system DISCARDS ALL DATA after the first End-of-Month occurs."** **STORIS recommends 60 days.** **Blank does not mean "keep forever" — it means "destroy at next EOM".** |
| `Sales Tax` | Days | Days to retain "the file log containing details on sales tax paid". **STORIS recommends at least 365 days.** No blank behavior documented — **[TRISTATE] risk**. |
| `Sales Quotes` | Integer **`0`–`999`** | Days unconverted sales quotes remain before **End-of-Day** purges them. **[TRISTATE] + [DESTRUCTIVE]: "If you enter `0`, EOD DELETES ALL unconverted sales quotes. If you leave the field BLANK, EOD does NOT delete unconverted sales quotes."** **Zero and blank are opposite instructions.** |
| `Customer Activity Log` | Integer **`1`–`9999`** days | Retention before purging via the **`Customer Activity Log`** process in Schedule a Process. **[TRISTATE]: "If no value is entered here, the customer activity log is not purged. The default setting is null (empty); if null, the purge process will not run even if set to do so."** **"When this value is changed, a warning message appears."** STORIS's own migration advice (verbatim): with 8 years accumulated, set `2555` (365×7), then `2190` (365×6), and "continue this process as necessary" — **i.e. a single large reduction is expected to be operationally dangerous.** |
| `Completed Orders` | Months | Retention before purging via the **`Completed Order Purge`** process. **[TRISTATE]: "If this field is null (empty), completed orders are ALWAYS RETAINED, though they are still purged as part of the `Customer Retention Period` setting (if set)."** **[CONFLICT] with `Customer Retention Period` on the Customer page — "If the retention period for completed orders is greater than that of the `Customer Retention Period` … a message states this and the purge set in the `Customer Retention Period` proceeds"; i.e. the CUSTOMER setting wins.** Rules: "Orders are not purged until **fully completed**. Partially completed orders remain in the system until all fulfillments … have been completed. **The completion date is that of the final invoice for the order.** Completed orders include **sales orders, quick sales, returns, exchanges, service orders, and dollar only adjustments.**" |
| `Completed Transfers` | Months | Retention before purging via **`Completed Transfer Purge`**. **[TRISTATE]: "If this field is null (empty), completed transfers are not purged and remain in the system."** |
| `Completed Order Attachments` | Months | Retention of attachments on completed orders. **[TRISTATE]: "If null, the purge is controlled by the `Completed Orders` or `Customer Purge`."** Warning message if the value exceeds `Completed Orders` or `Customer Retention Periods_Months`. |

> **STORIS's own onboarding warning for the two "Completed" purges (verbatim):** "If defining this setting
> for the first time, there may be **many** orders to purge, which will take time. STORIS recommends first
> setting this field to a **large** retention period, and then **decreasing** the period until you are at a
> manageable amount of orders to be purged." **[GUARDED] — first-time configuration of a retention field is
> itself a destructive operation.**

**`Protection Plans`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Prompt to Add to Order` | Checkbox — **default unchecked** | Prompts to add protection plan(s) whenever qualified products are added. **"Only applicable for new and open orders that have not been partially completed."** |
| `Automatically Add to New Order` | Checkbox — **default unchecked** | Auto-adds qualified plans; **"only applies to NEW orders when they are created."** |
| `Require Security to Override` | Checkbox — **only available if `Automatically Add to New Order` is checked** | Requires a security override to save a sales order with qualified lines **not** covered by a plan. Permission: **`Allow Removal of Auto Added Protection Plans`** in `Create a User/User Group - Sales Security`. |
| `Automatic Add Merchandise Overlap` | Enum: **`Highest Price`**, **`Lowest Price`**, **`Highest Profit`**, **`Prompt` (default)** | Which plan wins when multiple plans qualify for the same merchandise. **"`Prompt` … will treat the selection as if `Prompt to Add to Order` is enabled."** **"Only recognized when `Automatically Add to New Order` is enabled. It is also used in the `Protection Plan Selection` process when `Auto-Select All` is used."** |
| `Exchanges Use Existing Plan` | Checkbox — **default unchecked** | The original protection plan from returned lines becomes available for linkage to new sale lines; plans "can be reevaluated and reassigned". **"The original version of the plan and the original Protection Plan Register Code will be available to use, permitting the 3rd Party Provider to consider new merchandise and returned merchandise as adjustments to the Protection Plan."** |

**The four-way truth table for protection plan addition (verbatim from the article):**
- Neither `Prompt to Add to Order` nor `Automatically Add to New Order` → plans are added **manually** to any order.
- **Both** enabled → **automatically** added to new orders; for **existing** orders, users are **prompted**.
- `Prompt to Add to Order` only → asked whether to add, on **new or existing** orders.
- `Automatically Add to New Order` only → **manual** on existing orders, **automatic** on new orders.
- In all cases: **"Protection Plans need to be added manually to partially completed orders that already exist."**

**`Print Plan Declinations`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Order Message` | Text | Order-level printed message when a plan is declined. **"The message should be generic, stating that at least one of lines was eligible for a protection plan that was declined, instead of referring to specific products or lines."** |
| `Line Message` | Text | Line-level printed message. **"The message should refer to a specific line that was protection plan eligible but was not sold."** |

**`Other` (General page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Use Original Selling Store for Exchanges/Returns/Adjustments` | Checkbox | Applies the selling store from the original sales document to the current document. **"If `Customer Drop Off` is the selected fulfillment in `Enter a Return`, the logon location is ALWAYS the return location."** |
| `Default Dollars On Adjustments` | Checkbox | Enabled → dollars-only adjustments **do not** default the value from the original invoice; users must key a value. **Note the field name reads as the opposite of its effect. [CONFLICT]/naming trap.** |
| `Order Access Limited to Selling Store` | Checkbox | **Order-entry processes only.** Checked → only the **selling store** location determines access; users with access only to Ship or Stock (Regional) locations **cannot access or change an existing sales order**. Blank → users with access to selling, ship, **or** stock location can access. **A security rule living in a POS control setting rather than in the security module. Feed to `RPT-AUDIT`.** |
| `Exchanges on Hold at Entry` | Checkbox | Places exchange transactions on **`E1` Credit Hold**. Removal requires **`Approve E1 credit holds placed on customer exchanges`** in `Create a User/Group Actions - Sales Security`. |
| `Default Line Type with a POS Scan` | Checkbox | Checked → a scanned product label sets the line type to **`"T"` for Take With**. **"Any lines that are added to the order via POS scan and set to Take With are COMPLETED when you save out of the order."** Non-scanned lines default to the line type on the Customer tab or "the line type of the last non-scanned, non take-with line". **A scan gun therefore silently completes inventory-consuming lines at save.** |
| `Default Display of Vendor Model in Point of Sale` | Checkbox | **[REUSE] `CFG-INV-VENDORMODEL`.** Checked → these screens default to vendor model **and you cannot toggle to product view**: `Sales Margin Scratchpad`, `Advanced Line Item Display Screen`, `Costed Line Item Display Screen - Read Only`, `Group Pricing Screen`, `Line Item Full Display - Read Only`, `Line Item Linked Document Display`, `Additional Line Item Details`, `View a Customer's Historical Purchases`. |
| `Require Comments when a Sales Order is Changed` | Checkbox | Comments required when an existing sales order is modified; selected from the **`Mandatory Order Comments`** screen (maintained via `Mandatory Order Comments Settings`). **"A comment is still required when a change occurs that was NOT initiated by the user (e.g. tax update)."** — **an automated system change demands a human comment, which is a workflow defect.** |
| `Require Audit Text on Returns` | Checkbox | Prompts for comments in the `Text Entry` window on save of a new return; **"If no comment is entered, a warning message is displayed"** — **a warning, not a block, so it is not actually a requirement.** |
| `Require Audit Text on Exchanges` | Checkbox | Same, for `Enter an Exchange`. Same warning-only enforcement. |
| `Require Audit Text on Service Orders` | Checkbox | Same, for `Enter a Service Order`. Same warning-only enforcement. |
| `Default Merchandise Grid in Enter a Sales Order` | Checkbox — **default unchecked** | Checked → line item display defaults to the **pre-9.7 grid** format; blank → current list view. Toggle at runtime via `Actions > Toggle Line Display`. |
| `Allow Room Entry in Enter a Sales Order` | Checkbox | Checked → the `Rooms` field appears on **Step 2 - Merchandise** of `Enter a Sales Order` and **Step 3 - Sale Merchandise** of `Enter an Exchange`; blank → the `Room` field **and** the `Total Rooms` field in the Print Options Window are hidden. **Side effect: "If this setting is checked, the sales order print sorts by Room by default" — it changes `Sales Order Print Sort By` on the Printed Documents page.** `Room Settings` remains menu-accessible either way. |
| `Always Search for a Product During Entry` | Checkbox — **default blank** | Checked → the `Search for a Product` screen opens on an **invalid product code** at any Product prompt "during entry, report, or view processes", pre-filled with what was typed. **"ALL processes that validate the entry of a product code utilize this functionality when the setting is checked."** Blank (default) → a "cannot be found" message only. |
| `Hide Salesperson Lookup in Entry Processes` | Checkbox | Hides the Search option for `Salesperson` on the Customer page of `Enter a Sales Order`, `Enter an Exchange`, `Enter a Return`. Multiple salespeople then go through `Multiple Commission Entry` (a percentage is not required); the main salesperson can be promoted to the top of the grid. |
| `Reason Code Required When Converting Sales Order to Layaway/Quote` | Checkbox — **default unchecked** | **"The reason code used must belong to the `Sales Order to Layaway/Quote Conversion` usage type in Reason Code Settings."** |
| `Allow Installation/Restocking Charges` | Checkbox | **Misleading name:** "Check this box to **perform a security check** any time a user attempts to enter or modify installation or restocking charges." **It enables a check, it does not grant permission. [CONFLICT]/naming trap.** |
| `Prevent Users from Accessing Their Own Account` | Checkbox | Prevents a user whose **employee staff ID matches the `Employee ID` in Advanced Customer Settings** from using their own customer number in: `Adjust Revolving Plans`, `Customer Credit and Scoring Information`, `Advanced Customer Settings`, `Enter a Customer Payment`, `Enter a Customer Payment/Refund/Gift Certificate`, `Maintain Customer Deposits`, `Enter a Customer Revolving Terms and Conditions`, `Enter a Quick Sale`, `Enter a Sales Order`. **This is the self-dealing control. It should be on by default and should be audited; it is off by default and unaudited.** |

---
#### `Customer` page

**`Minimum Deposit Rules`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Required on Order` | Percentage | "**All standard sales orders must be accompanied by a deposit greater than or equal to the order price multiplied by the percent specified here.**" Failure raises an exception subject to `If Not Applied`. |
| `If Not Applied` | Check-level enum (see `SCS-013` Check-Levels for Exceptions) | Alert type when the deposit falls short. |

> **Exemption:** "If **`Service Order Exempt`** in Accounts Receivables Control Settings is enabled, service
> orders are also exempt from validation based on the Minimum Deposit Rules." (cross-screen exemption, `SCS-002`)

**`Credit Check Rules`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Last Activity __ Days` | Days | Referenced "each time you enter a customer account number into an order **or save an order**". **"If no payments or purchases exist for the customer within the number of days specified here"**, the `Initial Credit Check` / `Final Credit Check` actions apply. **If `Final Credit Check` = `Put Order on Credit Hold`, the order goes on `C3` credit hold.** |
| `Past Due __ Days` | Days | Referenced when entering/saving an order for a customer with an outstanding A/R balance. **If the balance is older than this, the checks apply. A `Final Credit Check` failure here puts the order on `C2` credit hold.** |
| `Initial Credit Check` | Enum: **`Warning Message`**, **`Do Not Check`**, **`Terminate Order`** | Response when a customer fails the check at **account-number entry**. "Note that the credit check **also searches for a credit limit** for the customer." |
| `Final Credit Check` | Enum: **`Warning Message`**, **`Do Not Check`**, **`Put Order on Credit Hold`** | Response at **save**. `Put Order on Credit Hold`: "The system reviews if the **financed amount exceeds the customer's credit limit**; if a credit check exception occurs, the sales order is placed on credit hold." **Different enum from `Initial Credit Check` — `Terminate Order` is not available at save, `Put Order on Credit Hold` is not available at entry.** |

> **Hard downstream rule, stated twice:** "**If the `Fill Orders on Credit Hold` field on the Inventory tab
> is not active, you must remove ALL credit holds from sales orders before you can reserve any line items.**"
> **Credit hold silently blocks inventory reservation, which blocks scheduling, which blocks delivery.**

**`Customer Entry`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Prompt for Middle Name` | Checkbox | Prompt/display middle name during sales order entry. |
| `Prompt for Name Suffix` | Checkbox | Prompt/display suffix ("Jr.", "Esq."). |
| `Require Date of Birth` | Checkbox | Checked → DOB is **mandatory** when creating a customer via `Advanced Customer Settings` or on-the-fly in `Enter a Sales Order` / `Enter a Quick Sale` (the **`Enter Customer's Date of Birth`** window appears). **PII collection driven by a checkbox — must be justified, and conflicts with the `Prohibit Customer Personal Information when not Required by Sale` location setting.** |
| `Validate Name Prefix` | Checkbox | Validates the prefix against the **`Customer Prefix Settings`** table; blank → any free text accepted. |
| `Warn if Primary Email exists for other Customers` | Checkbox | Warns on duplicate email. **Important side effect: "When an email address is entered into any of these processes (except `Enter a Shopping Cart`), the Customer's Primary Email Address is UPDATED to reflect this change."** The user may ignore the warning. Processes covered: `Advanced Customer Settings > General tab`; `Update a Customer Address`; `Enter a Sales Order > Customer tab > Email Address Entry` and `Customer tab > Actions > Shipping Information`; `Enter a Shopping Cart > Print Options`; `Import Data > Customer`; `Request Credit Information / Credit Application Entry > Personal tab`; `Standard Finance Credit Application - Primary` (**"applies to email address changes throughout the finance credit application process, including primary and co-applicant information as well as to specific finance providers"**). |
| `Prohibit New Customers with Duplicate Email Addresses` | Checkbox | Blocks creating a new customer address with an existing customer's email. **Overridable by the `Create Customers when another exists with the same Email Address` permission in `Create a User/Group Actions - Sales Security`.** |
| `Default Delivery Address Same as Billing Address` | Checkbox | Controls the default of `Delivery Address Same as Billing Address` in Advanced Customer Settings. |
| `Address Verification` | Checkbox | Activates Address Verification. **"The Address Verification module must be licensed in order to activate."** |
| `Prompt for Name Prefix` | Enum: **`Optional`**, **`Required`**, **`Do Not Prompt`** | Prefix prompting in sales order entry and Advanced Customer Settings. **A three-value enum sitting next to two booleans that do the same job for middle name and suffix — [CONFLICT]/inconsistent modelling.** |

**`Customer Search`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Always during Entry` | Checkbox | Checked → the `Search a Customer` screen appears each time you create a customer on-the-fly during order entry (duplicate prevention). Blank → straight to `Customer Settings`. **"When entering a customer name directly into the `Customer Number` field of an entry routine, the `Search for a Customer` screen appears WHETHER OR NOT this setting is checked."** |
| `Starting Letters of Name` | Checkbox | Defaults the search method to **`Starts With`** on last name. |
| `Phone Number First` | Checkbox | Checked → the **`Add Phone Number`** window opens after requesting a new Customer Code in Advanced Customer Settings. **"Entry of a phone number is not mandatory."** Blank → cursor goes to the next available field. |
| `Search Information Required prior to creating a New Account` | Multi-checkbox: **`Last Name`**, **`Phone Number`**, **`Email Address`** | "Choose none, one, or a combination of criteria. If checked, the user … is required to **search** for that piece(s) of information before being permitted to create a new customer account." **Enforced in `Enter a Sales Order`, `Enter a Return`, and `Enter an Exchange` ONLY** — the duplicate-prevention control does not apply where customers are most often created in bulk. |

**`Other` (Customer page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Restocking Fee on Returns` | Percentage **`0.00`–`100.00`**, nullable | Auto-calculates a restocking fee in `Enter a Return` / `Enter an Exchange`. **[TRISTATE], and one of the clearest examples in the whole section:** **null (blank) → "the restocking fee is not calculated" at all; `0` → "the restocking fee is calculated using the GROUP LEVEL setting, if any. Otherwise, it is calculated as zero and requires a user with permission … to change it"; a positive % → that rate.** Group-level source: `Restocking Fee on Returns %` in **Group Settings**. |
| `Refund as a Check` | Enum: **`Not an Option`** (never prompt), **`Prompt the User`** (always prompt), **`Customer Has No Balance Due`** (prompt only if there is no outstanding AR balance) | Controls the auto-refund-check prompt in `Enter a Return`, `Enter an Exchange`, `Adjust Dollars on a Completed Order`. |
| `Customer Retention Period __ Months` | Months | **[TRISTATE] + [DESTRUCTIVE] — the single most dangerous field on this screen.** Purges customers who for this many months have **no open sales orders and a zero A/R balance**, at "**the first End-of-Month process that occurs after the specified time period expires**". **"If you leave this field blank, the system DISCARDS ALL NEW ORDER DATA UPON COMPLETION OF THE ORDER."** It purges: **customer records, customer history records, ALL completed orders, and customer data in the Customer Comments file.** **STORIS recommends a minimum of 12 months** and warns that purged data is gone from `Create a Mailing List`, `View a Customer's Historical Purchases`, and **`Warranty Processing`** — "if you use Warranty Processing, you should set this field to at least a period matching the **longest warranty you offer**. Otherwise, the system will purge the invoice data before its associated warranty expires." **"The `Completed Orders` field … does NOT override this `Customer Retention Period` field."** Customers can also be purged via the **`Customer Purge`** process in Schedule a Process, "via a spreadsheet as a scheduled process or as a one-time purge". |
| `Purge Customers` | Enum: **`Created on the fly`**, **`Entered via File Maintenance`**, **`Both`** | Which customer types are purged during **`Generate Monthly Reports`**. |
| `Display Line Item Comment` | Checkbox/option | "Save sales order line comments in customer purchase history when the order is completed." |
| `Validate Original Payment on Refunds` | Checkbox | Checked → refunds are **restricted to the original payment type**, and **"all payments associated with an order display in the grid on the `Payment Summary Window`"**. Blank → any payment type, and **"no individual payments display in the Payment Summary Window grid"** — **two unrelated behaviors on one checkbox.** **Interaction:** if checked and the cash refund exceeds **`Daily Maximum Cash Refund Per Customer`** (Accounts Receivable Control Settings, `SCS-002`), you may issue a refund check (if available) or post the amount to the customer's open-item receivables as a credit. |
| `Activate Customer Rewards Program` | Checkbox | Master switch for Customer Rewards (`SCS-018`). |
| `Update Customer Shipping Information by Default` | Checkbox | Defaults a check into `Update Address Information` in the **`Delivery Information Window`** when address/contact info changes. **"A check in either of these boxes applies the change made in the Shipping Information window to ALL OPEN ORDERS for that customer."** **A single address edit rewrites every open order's delivery address.** |
| `Confirm Address on Orders and Exchanges` | Checkbox | Applies to **new delivery orders and the first time a line is changed to delivery** on new or existing orders. Checked → the **`Confirm Address`** window displays on Save from the Payment page. Blank → reachable manually from the Fulfillment page `Action` button at `Deliver To`. **"In the `Confirm Address` window, the customer's phone numbers are NOT automatically populated and MUST be entered before saving out of the screen."** **"Except when called because of this setting, the `Confirm Address` window is called `Delivery Information`."** — same screen, two names. |
| `Activate Customer Membership Program` | Checkbox | "Customer records are updated with membership information once the specific products are purchased." |
| `Require Phone Number for Delivery, Pickup, and Direct Ship` | Checkbox — **default unchecked**; **`Enter a Sales Order` only** | Requires a phone number on every delivery/pickup/direct-ship fulfillment at save. **"If there is no associated phone number, a WARNING message is displayed"** — again enforcement is advisory. |

---
#### `Logistics` page

| Field | Type | Purpose / business rule |
|---|---|---|
| `In-Process Delivery Restriction __ Days` | Integer **`0`–`999`**, nullable | Days before the scheduled delivery date that the **`Change Order When a Fulfillment is Scheduled and Printed`** sales-security restriction is enforced. **[TRISTATE]: "If you enter ZERO, the system enforces the restrictions only on the DAY of delivery. If you leave this field BLANK, the restriction is DISABLED."** Restrictions apply only when the order/fulfillment is **`Scheduled`**, a **Delivery Ticket has been printed**, and the delivery date is within the window. With multiple fulfillments, only the qualifying fulfillment is protected. |
| `Prompt Ticket Print in Order Entry` | Two checkboxes: **`Deliveries`**, **`Pickups`** ("one, both or neither") | **"Selecting NEITHER `Deliveries` NOR `Pickups` (both check boxes blank) DEACTIVATES the `Allow Completion After Ticket Print` setting on this page."** |

**`Delivery Charges`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Apply Pickup Charges to Returns` | Checkbox | Checked → pickup charges are calculated for customer returns using `Delivery Charge Settings`. **"This process creates NEGATIVE delivery charges (that is, charges due FROM the customer, not credited to them)."** For returns written against an original document these **override** any delivery charges defaulting from the original. Blank → the original document's delivery charges default **as a credit to the customer**. **Does not apply to the Return portion of an Exchange (a delivery charge is already calculated on the Delivery portion) nor to the Return resulting from a manual split.** |
| `Apply to Direct Shipments` | Checkbox | Allows manual entry of delivery charges for orders / individual direct-ship fulfillments. |
| `Prompt for Reason Code if Overridden` | Checkbox | Prompts for a reason code when a Delivery Charge is changed (at the **fulfillment** level under multiple fulfillments). |
| `Allow completion after ticket print` | Checkbox | Allows completing sales orders immediately after printing a delivery or pickup ticket. **Inactivated by "Do Not Prompt" at `Prompt Ticket Print in Order Entry`. Requires `Assign Specific Pieces Event` (Inventory page) to be set to `Ticket Print`.** "In the case of a split ticket, both parts cannot be completed simultaneously. Since **`Take With` lines cannot exist in a saved open order, they are completed immediately.**" |
| `If No Delivery Charge is Included` | Check-level enum | Alert when a sales order delivery is saved with no Delivery Charge, **or when the user overrides the auto-calculated charge**. |
| `Delivery Charge Settings` → `Use Delivery Settings` | Checkbox | Use the default **base** delivery charge from `Delivery Settings`. |
| `Delivery Charge Settings` → `Use Per Piece Settings` | Checkbox | Use the default **per-piece** charge from `Per Piece Settings`. **"To use the per-piece options … per-piece charges MUST EXIST in the `Per Piece Settings` routine."** |
| — combined rule — | | **"You can select one, both or neither. If BOTH options are selected, a default base delivery charge is applied to each line, then the per-piece charge to the HIGHEST LINE CHARGE is added. The result calculates as the header delivery charge."** **Selecting neither means no automatic delivery charge at all.** |
| `One Delivery Charge Per Order` | Checkbox | Checked → **"all delivery charges on an order are calculated and stored based on the FIRST delivery fulfillment created for that order"**, giving a single charge per order; the `Recalculate Delivery Charges` global Action becomes visible/active. **[GUARDED]: "permission to delete fulfillments containing delivery charges is required via `Delete the fulfillment with the delivery charge`… If the fulfillment is deleted, THE DELIVERY CHARGE IS LOST but can be recalculated via `Recalculate Delivery Charges`."** For unsaved new orders the charge automatically moves to the next earliest fulfillment. **Trap: "If an existing (previously saved) order that has NO delivery fulfillments has a delivery fulfillment ADDED to it, delivery charges are NOT automatically calculated for that new fulfillment; this also applies if an existing order has a pickup fulfillment converted into the first delivery fulfillment. `Recalculate Delivery Charges` MUST be selected."** — i.e. **silent revenue leakage.** |
| `Automatically Move Delivery Charges` | Radio: **`Do Not Move Delivery Charges` (default)**, **`Earliest Fulfillment Date`**, **`Earliest Scheduled Fulfillment Date`** | **Enabled only if `One Delivery Charge Per Order` is checked AND `Maximum Number of Fulfillments, Delivery` > 1.** `Earliest Fulfillment Date` moves the charge to the earliest-dated fulfillment "without regard for the status". `Earliest Scheduled Fulfillment Date` prefers earliest **scheduled**, then earliest **estimated**, then **ASAP or CWC**. **Error text if misconfigured (verbatim): `"Automatically Move Delivery Charge" requires "One Delivery Charge Per Order"`.** **Tax consequence (verbatim): "Tax is recalculated on orders when a fulfillment is moved. This is because delivery charges may be taxed depending on the new address a charge is moved to. Any changes result in either a Balance Due or a Refund Due."** **Moving a delivery charge silently changes what the customer owes.** |

**`Delivery Charge Recalculation`** — "check one, both, or neither… If you leave a box blank, delivery charges are not re-calculated."

| Field | Type | Purpose / business rule |
|---|---|---|
| `If Delivery Date Changes` | Checkbox | Recalculate when the delivery date changes. |
| `If Route and/or Delivery Company Changes` | Checkbox | Recalculate when route or delivery company changes. |
| `If Status Changes` | Checkbox | Recalculate when the order status changes. |
| `If Merchandise Changes` | Checkbox | Recalculate when merchandise is added or removed from an existing order. |
| `If Partially Completed` | Checkbox | **"This setting is NOT dependent on the above settings."** With multiple concurrent fulfillments: recalculate when a Delivery or Direct Ship fulfillment is **partially completed** — charges are applied to back-ordered items. **If unchecked, "the delivery charge is applied only on the first delivery fulfillment and charges are not applied to the back ordered items."** Without multiple fulfillments it recalculates on partial completion of the order. **"This method cannot be used if using multiple fulfillments"** (contradicts the paragraph above it — **[CONFLICT] in the source**). |
| `Recalculation Date` | Enum: **`Current Date`**, **`Order Date`** | Whether recalculation uses the Delivery Company Settings **for the current date** or **for the order date**. |

> **Interaction:** "If you check `Apply Pickup Charges to Returns`… this field affects the calculation of
> pickup charges for customer returns."

**`Delivery Dates`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Restrict Based on Available Date` | Checkbox | Prevents assigning delivery (customer orders and transfers) and pickup dates for out-of-stock merchandise **prior to the ATP date**; overridable only by users with the proper security. **Hard prerequisite: "In order to enable this setting, you must also enable ONE OR MORE of the following ATP Calculation settings: `Include New Purchase Orders`; `Include Stock Transfers`; `Include Unlinked Purchase Orders`."** **Does not apply to service product types `retail labor`, `service labor only`, `service charge`, `non-merchandise service`.** If `ATP CALCULATION - Applies to Parts` is blank, `Retail Part` and `Service Part Only` products bypass it. **"This setting is considered BEFORE the `Restrict Scheduled Date` setting."** |
| `Require Either Requested Date or Delivery/Pickup Date on Order` | Checkbox | Sales orders and exchanges must carry a delivery/pickup date and/or a requested date. **If the status is `Customer Will Call` or `As Soon As Possible`, a requested date is mandatory, or the status must change to `Estimated`/`Scheduled` with a date.** |
| `Restrict Scheduled Date` | Integer **`1`–`999`**, nullable | How far into the future an order can be scheduled: **scheduled delivery date ≤ current date + N**; a security override can be applied (**`Override future scheduling restriction`**). **Applies only to `Delivery` and `Pickup` fulfillment methods with status `Scheduled`.** Checked in: `Enter a Sales Order`, `Enter an Exchange`, `Logistical Scheduling`, `Schedule Orders with CWC or ASAP Fulfillment Status`, `Complete the Delivery Manifest Process`, `Orders To Be Scheduled Window`. **"This setting is OVERRIDDEN by the `Restrict Scheduled Date` field in Warehouse/Store Location Settings. If BOTH settings are null, there are NO restrictions on scheduling in the future."** **"If an override is approved for `Restrict Based on Available Date`, a SECOND override for this setting may be required."** **Does not impact Direct Ship fulfillments.** |
| `Select Delivery Date After Entering Merchandise` | Two checkboxes (exchanges, transfers) — "one, neither, or both" | Unchecked → the date is selected on the Customer page (exchanges) / General tab (transfers). Checked → the date is chosen **after** merchandise is added; those fields go inactive and the **`Select a Fulfillment Date`** window appears, **provided: the order contains at least one merchandise line; the delivery/pickup status is not `ASAP` or `CWC`; and delivery dates have not been entered for any merchandise line.** |

**`Consolidate Orders`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Consolidate Multiple Orders` | Checkbox | Unchecked → no effect on order entry. Checked → on a new sales/return/exchange the system checks for other **scheduled open orders** for the customer; a message appears at the delivery/pickup date field; **"the EARLIEST scheduled date from the other order(s) defaults into the current order's delivery or pickup date"** (overridable); on Save a prompt offers to **reschedule the other order(s)**. **"When the `Deliver To` field … is set to `Other`, the delivery is consolidated ONLY when the `Name`, `Address 1`, `Address 2`, `City`, `State`, and `Zip Code` are an EXACT match."** Subject to the `Restrict Scheduled Date` settings in both this screen and Warehouse/Store Location Settings. |
| `Prompt Date Selection` | Checkbox | Prompts to populate the scheduled delivery date with **the LATEST delivery date** from the customer's other orders. **Note the contradiction with the setting above, which defaults the EARLIEST date. [CONFLICT].** **"The `Consolidate Multiple Deliveries` box must be checked in order to use this setting."** (the article names the parent inconsistently as `Consolidate Multiple Orders` / `Consolidate Multiple Deliveries`). |
| `Include All Merchandise` | Checkbox | Checked → all orders (back-ordered, reserved) are listed as reschedulable; unchecked → **"only open scheduled orders with RESERVED merchandise qualify for rescheduling."** Requires the parent consolidate setting. |

**`Route Capacities`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Include Non-Inventory` | Checkbox | Include non-inventory products in route capacities. |
| `Include Automatic Transfers` | Checkbox | **"Only used if the `Transfers Quantity` is set to `Reserved`."** Checked → lines linked to auto-transfers count in the reserved quantity for sales orders. **"Multi-leg transfers are not included in this calculation. Once the automatic transfer (from the multi-leg transfer) is reserved, the order route capacity will then be updated."** |
| `Require Route Code for Sales Quotes` | Checkbox | Prompts for a route when creating a sales quote **if a default route is not set in the customer's zip code**. Unchecked → the prompt is deferred until the quote is converted to a sales order. |

**`Deliveries`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Status` | Enum: **`Scheduled`**, **`Estimated`** | `Scheduled` → update routing calendars only when the delivery date is scheduled. `Estimated` → update with **estimated and scheduled** orders. **[GUARDED]: "If you change the selection at this field, a warning message appears regarding the `Rebuild Route Calendar` process. This MUST BE RUN in order to save your changes."** |
| `Quantity` | Enum: **`Ordered`**, **`Reserved`** | `Ordered` → capacities updated with **ordered** items that are estimated/scheduled with delivery dates. `Reserved` → only **reserved** items. Verbatim allocation rule for `Reserved`: "**For multiple delivery dates, when updating the route quantity for a specific date, the reserved quantity allocates to each EARLIER date until the target date is reached. The system uses the balance of the reserved quantity when the target date is reached up to the delivery quantity for that date when updating the route quantity.**" **"If you select this option, ANY change in the reservations, whether manually by user or automatically by STORIS, affects the Route Capacity Calendars."** **[GUARDED]: changing it forces the `Rebuild Route Calendar` process — "You must answer Yes if you want to update your change."** |

**`Transfers`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Quantity` | Enum: **`Ordered`**, **`Reserved`** | Same semantics and same allocation rule as Deliveries `Quantity`; same **`Rebuild Route Calendar`** guard. **"If your system is set to use ATP dates, it is RECOMMENDED you set this transfer quantity field to `Ordered`."** |

**`Route Closing Period`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Deliveries __ Days` | Integer, nullable | Automatically closes delivery/service routes to scheduling N days out from today; the closed dates show as unavailable in the route calendar. **Three-level fallback: the field exists in `Logistical Route Settings`, `Service Control Settings`, and here; "If you leave the field blank in `Logistical Route Settings` for any delivery/service route, the system uses this field in `Point of Sale Control Settings` or `Service Control Settings`, depending on the route type."** **[IRREVERSIBLE] — verbatim: "If you use this feature to close dates, THEY REMAIN CLOSED EVEN IF you access this field again and change the number of days. You can 're-open' the closed dates only by doing the following: 1) change the number of days in this field … and then 2) access the dates via `Route Capacity Settings` and change the maximum number of stops for those dates."** **[TRISTATE]: blank in all three routines = feature ignored entirely.** |
| `Transfer __ Days` | Integer, nullable | Same, for transfer routes: "the number of days prior to the transfer date that transfer routes are to be automatically closed". Also fed by **`Cut Off Route ____ Days Prior to Scheduled Date`** in `Logistical Route Settings`, with this field as the fallback. **Same [IRREVERSIBLE] closed-date behavior and same blank-means-ignored rule.** |

**`Manifests`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow deposits on order` | Checkbox | Checked → additional deposits may be applied when **any individual fulfillment is on a manifest**, via `Enter a Sales Order` and `Enter a Customer Payment/Refund/Gift Certificate`. Permits: taking a deposit on such an order; **moving deposit money to** such an order; **adding or removing financing** on such an order; **reversing a credit card pre-authorization** for an order deposit. **Unchecked → "money cannot be taken for an order that has a fulfillment on a manifest."** |
| `Allow Changes to Un-manifested Fulfillments` | Checkbox | Permits, on an order that has other fulfillment(s) on a manifest: **adding/deleting lines; changing quantity; changing selling price; adding/removing subtotal or line discounts; creating new fulfillments; moving lines between un-manifested fulfillments; changing the deliver-to address; changing fulfillment location; changing fulfillment method; updating delivery and installation charges.** A message appears when such updates are made. **[GUARDED] — this is the "can I edit an order that is already on a truck" switch.** |
| `Prohibit changes to lines once an associated auto-transfer has been manifested` | Checkbox | Locks the **quantity and stock location** of a sales order merchandise line once its auto-transfer is manifested. **"Only restricts sales order fulfillments associated with auto-transfers on manifest; it does not affect transfers associated with multi-leg transfers on manifest."** Override permission: **`Override restriction of line updates once a linked auto-transfer has been manifested`** (Sales Security); otherwise a security override is required. |
| `Continue to prohibit changes after auto-transfer has been completed` | Checkbox — **only available if the setting above is checked** | Extends the lock past auto-transfer completion, covering **quantity change, stock location change, and line deletion**. Same override permission. |
| `Remove Truck Number/Stop Time when Orders are Removed` | Checkbox | **Availability conditions (all required): `Delivery Scheduling/Mapping` active in General System Control Settings; `Third Party Mapping Software Interface` in Warehouse/Store Location Settings ≠ `None`; and at least one of `Delivery Active`, `Transfer Active`, `Service Orders` checked.** Checked → truck number and stop time are removed from an order when it is removed from the manifest. |
| `Delivery, Require Reason Code if One or More Orders Removed` | Checkbox — **default unchecked** | Reason code required when a manifest is saved with one or more **delivery** orders removed via `Build a Delivery/Service/Transfer Manifest`. |
| `Service, Require Reason Code if One or More Orders Removed` | Checkbox — **default unchecked** | Same for **service** orders. |
| `Transfer, Require Reason Code if One or More Order Removed` | Checkbox — **default unchecked** | Same for **transfer** orders. |

**`Allow Updates To Manifest From`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Delivery Pick List Print` | Checkbox | Allows generating a **delivery** manifest from `Print Pick List`; activates the `Update Manifest` field in that routine. |
| `Delivery Ticket Print` | Checkbox | Allows generating a delivery manifest from `Print Delivery/Transfer Tickets`. **"This field does not affect the `Print a Delivery/Pick-Up/Transfer Ticket` routine. It only affects the `Print Delivery/Transfer Tickets` (that is, the MULTIPLE ticket print routine)."** |
| `Transfer Pick List Print` | Checkbox | Allows generating a **transfer** manifest from `Print Pick List`. |
| `Transfer Ticket Print` | Checkbox | Allows generating a transfer manifest from `Print Delivery/Transfer Tickets` (multiple-ticket routine only). |
| — combined rule — | | **"If you leave ALL of the following fields blank, users must generate delivery and transfer manifests MANUALLY."** |

**`ATP Calculation`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Default display of ATC in Point of Sale` | Checkbox | Checked → the **Available to Customer (ATC)** date is the default display on the Merchandise page of `Enter a Sales Order` and `View an Existing Sales Order`, and on the `Advanced Line Item Display Screen`, **in place of the ATP date**. **"The ATC date, as opposed to the ATP date, is calculated based on BOTH merchandise availability AND delivery route capacities."** **Audit side effect (verbatim): "an audit comment is generated for each line on a sales order, layaway, or quote with the ATC date. For each line, the comment reads `"Line <line number>, Product <product number> Available to Customer Date is <date>."`"** |
| `Include New Purchase Orders` | Checkbox | Include **new** (not-yet-existing) POs as a supply source in ATP. **Mutual-exclusion rule shared by all three "Include in ATP Calculation" fields: they "cannot be checked if either of the following is true: `Allow multiple on order line` is checked; an order line exists with multiple delivery dates."** **"This field MUST be checked if all other ATP Calculation Settings are inactive and `Restrict based on available date` is active."** |
| `Include Stock Transfers` | Checkbox — **default not checked** | Include incoming transfers in ATP. Same mutual-exclusion and same must-be-checked rule. |
| `Include Unlinked Purchase Orders` | Checkbox — **default CHECKED** | Include POs not linked to orders. Same mutual-exclusion and same must-be-checked rule. |
| `Include Retail and Service Parts` | Checkbox | Calculate ATP when `Retail Part` and `Service Part Only` products are added. **Blank → those products "do not use the `Restrict Based on Available Date` setting and ATP calculations are not performed."** |

**ATP source-selection behavior for `Include New Purchase Orders` (verbatim decision table):**
- PO exists **later** than the vendor's lead date — *Enabled*: preferred source is **a new purchase order**, "because the vendor's lead date is an indication of when a new purchase order can be received"; *Disabled*: preferred source is **the existing purchase order**.
- PO exists **earlier** than the vendor's lead date — *Enabled*: **the existing purchase order** (it has the better date); *Disabled*: **the existing purchase order**.
- **No suitable PO exists** — *Enabled*: preferred source is **a new purchase order**; *Disabled*: **"there is no preferred source; the ATP date is not calculated."**

> **Turning ATP off entirely (verbatim):** "To skip the calculation of the ATP date, do NOT check any of
> `Include New Purchase Orders`, `Include Stock Transfers`, `Include Unlinked Purchase Orders`." The
> consequences are then: **`Available to Promise Date` and `Available to Customer Date` fields disappear
> (labels and data), the `ATP Date` grid column is removed, and `Toggle Display of ATP/ATC Dates` vanishes
> from the Actions menu** on the Merchandise page of `Enter a Sales Order` / `Enter a Shopping Cart`, and the
> same applies to `View Kit Product Details`, `Advanced Line Item Display`, `Shopping Cart Line Item Display`,
> and `Reassign a Sales Reservation`. **Three checkboxes silently remove promise dates from the whole POS.**

**`Fulfillment Details` — `Initial Entry Status Defaults`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Delivery` | Enum: **`Estimated`**, **`Scheduled`**, **`Customer Will Call`**, **`As Soon As Possible`** | Default delivery status on new delivery orders in `Enter a Sales Order` / `Enter an Exchange`. **Changing it thereafter requires the `Change Delivery Status` permission, else a security override.** |
| `Pickup` | Same four values | Default status on new pickup orders; **also used when converting a delivery order to a pickup order when there are no existing pickup lines.** Requires `Change Pickup Status` permission to change. |

**`Partial Completion Status Defaults`** — "Note that these settings **cannot be used on orders with multiple delivery dates**."

| Field | Type | Purpose / business rule |
|---|---|---|
| `Delivery` | Enum: `Estimated`, `Scheduled`, `Customer Will Call`, `As Soon As Possible` | Status applied to the open part of a partially completed sales order/exchange. **"Does not apply to regular returns because they are ALWAYS set to `Scheduled`."** |
| `Pickup` | Same four values | **Hard trap: "When set to `Customer Will Call` and the pickup lines are linked to a transfer, the transfer is NOT SCHEDULED and cannot be processed through transfer completion."** Does not apply to regular returns or partially completed pickup exchanges (always `Scheduled`). |

**`Maximum Number of Fulfillments`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Delivery` | Integer **`1`–`99`**, nullable | Max delivery fulfillments per sales order. **[TRISTATE]: "Leave blank for an UNLIMITED number of fulfillments."** Overridable via **`Override Maximum Number of Fulfillments`**. **Hard validation: "These entries MUST be set to `1` if this location has the `Delivery Postponements Times` or `Pickup Postponements Times` in Warehouse/Store Location Settings set to a value of `0`. Multiple fulfillments are not permitted when postponement limits are active. These settings are validated."** |
| `Pickup` | Integer **`1`–`99`**, nullable | Same for pickups, same validation. |
| `Applies to Open Fulfillments Only` | Checkbox | Checked → the count includes **open** fulfillments only; unchecked → all fulfillments regardless of status. |

**`Other` (Logistics page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `If Delivery Date Changes` | Check-level enum | Alert type when a user changes a sales order delivery date. |
| `Report Delivery Dates in Jeopardy` | Enum: **`All Products`**, **`Stock Products`**, **`Special Order Products`** | Scope of the `Report Sales Orders with Delivery Dates in Jeopardy` routine. **Mechanism: "When running the End-of-Day process, the system checks the delivery dates of existing open sales orders and NET PURCHASE ORDERS against the quantity on hand for each item… If you schedule an order and the system determines that stock is not available to reserve to an order, the system generates an exception."** — direct consumer of `SCS-048`. |
| `Auto Transfer Warning` | Enum: **`Do Not Alert` (default)**, **`Upon Final Save`**, **`When an Auto-Transfer Is Created`**, **`All Warnings`** | `Upon Final Save` warns during final save "if the auto transfer was created in the current session **or a pre-existing one**". `When an Auto-Transfer Is Created` fires on **(1)** saving a line on the Merchandise page and **(2)** moving lines between fulfillments on the Fulfillment page. `All Warnings` = both. |
| `Manifest Exception Retention __ Months` | Integer | Months of route exception data (e.g. manifest items not delivered) retained; **purged during end-of-month processing**. **[TRISTATE] + [DESTRUCTIVE]: "If you enter ZERO here, the system does NOT RETAIN route exception data."** Used by manifest completion to track the "Not Complete" line/order, and by Report Builder. |
| `Confirm Delivery Status Upon Saving a Sales Order` | Checkbox | Prompts when saving a sales order whose fulfillment status is not `SCH`. The prompt offers **OK** (return to the Customer page and change to SCH) or **Ignore** (save as-is). |
| `Confirm Delivery Status Upon Saving an Exchange Order` | Checkbox | Same, for exchanges. |
| `Confirm Partial Delivery of Soft Kit Components` | Checkbox | Notifies users that a soft kit is scheduled for **partial** delivery. |
| `Allow Completion After Ticket Print` | Checkbox | Allows orders/fulfillments to be completed immediately after printing a delivery or pickup ticket in `Enter a Sales Order`. **[CONFLICT] — a field of this exact name also exists in the `Delivery Charges` group above with the same description; the article documents it twice. Verify whether this is one field or two before mapping.** |
| `Display Order Completion Details` | Checkbox | Checked → on the `Order Completion Details` page the user may pick **`Complete`** or **`Not Complete`**; picking `Complete` disables the `Details` button, picking `Not Complete` enables it. **Unchecked → "the `Not Complete` button … cannot be selected if the item is marked Complete", producing the message `"The status of this line cannot be set to Not Complete."`** |
| `Allow Order Entry Access in Logistical Scheduling` | Checkbox | Lets users modify sales orders directly from `Logistical Scheduling`. |
| `Limit Stock Locations Based on a User's Available Locations` | Checkbox — **STORIS-LOCKED SETTING!** | Limits selectable stock locations to the user's available locations, "specifically impacts the stocking location for order entry"; for use with **lists or regionalization**. **Verbatim use case:** a user has access to locations `66` and `88`; a customer's normal ship location is `01`; "When the Customer ID is used, the stock and fulfillment locations are updated from 2 locations (66 and 88) to 3 locations (66, 88, 01). **This allows the order to be filled with as few transfers as possible.** When this setting is checked, the stock location on an order is limited to 66 and 88." **So unchecked, using a customer ID silently widens a user's effective location access — a security-relevant side effect of a logistics optimization.** |
| `Restrict Order to one Delivery Address` | Checkbox | Restricts multiple-fulfillment logic to one delivery address per order. **"When enabled, changing the delivery address automatically changes the address of ALL delivery fulfillments"** (via `Deliver To` or the `Delivery Information` window). Applies to delivery and pickup fulfillment types. **`Direct Ship` is exempt.** **"Delivery addresses cannot be changed once the fulfillment is on a manifest."** |
| `Update Stocking Location When Fulfillment Changes` | Checkbox | Checked → changing an order's fulfillment location changes the stock location for **all lines associated with that fulfillment**. Unchecked → no effect. **Cases that block automatic update (manual update required): "Any fulfillment with a linked transfer that has had a ship ticket printed or a pick list generated; any fulfillment that has a delivery ticket or pick list generated; any fulfillment with assigned pieces."** Defaulting rules come from the **Inventory & Logistics** page of Warehouse/Store Location Settings: new order/fulfillment → rules of the **selling store**; changing fulfillment method pickup↔delivery → rules of the **selling store**; changing fulfillment location (directly or by zip change) → rules of the **new fulfillment location**. |
| `Allow Manual Entry of Stop Time in Enter a Sales Order` | Checkbox | Activates the `Time` field on the Fulfillment page and the `Delivery Time` field in `Select a Fulfillment Date`. |
| `Prohibit Unscheduled Lines` | Checkbox | Prohibits saving orders with unscheduled lines; **"a message is displayed asking for manager credentials."** Override permission: **`Override Unscheduled Merchandise Restriction`**. |
| `Default Handling Methods on Fulfillments` | Checkbox | Auto-defaults handling methods to fulfillments based on the products added. **"Handling methods must be set up before enabling this setting."** The price recalculates as items are added/removed; the method is determined via **`Fulfillment Handling Method Assignment`**. **"Unchecking this box defaults the handling method to `None Selected`."** |
| `Generate Parcel Delivery Fulfillments` | Checkbox | Auto-generates parcel fulfillments when a sales order is created. **"If this setting is enabled, the `Parcel Route Code` must be specified."** "The delivery method must be compatible with the fulfillment routes. If it isn't, a warning message is displayed." |
| `Parcel Route Code` | Route code (FK) | Route assigned to parcel fulfillments when the order zip has no associated route. **"The route code entered MUST be set as `Parcel Only` in Logistical Route Settings. If a standard route code is entered, an ERROR message is displayed."** |
| `Change Fulfillment Status to SCH with a Balance Due` | Checkbox | Checked → delivery fulfillments with a balance due may be scheduled. **Unchecked → "you cannot schedule a delivery fulfillment of an order or a debit exchange for delivery if there is an open balance"**, and the per-user **`Change Fulfillment Status to SCH with a Balance Due`** permission (Logistics Security) is consulted. **This is the "don't deliver unpaid goods" control.** |

---
#### `Inventory` page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Return Pieces to As-Is` | Checkbox | Defaults a check into `Return to As-Is` on all returns and exchanges. **Blank → "the system defaults the as-is status from the ORIGINAL SALES ORDER."** **[TRISTATE]-ish: unchecked is not "off", it is "inherit".** |
| `Assign Specific Pieces Event` | Enum: **`Ticket Print`**, **`Creating Pick List`**, **`Truck Load Process`** | When products (specific pieces) are assigned to orders. **"`Truck Load Process` applies ONLY to delivery-type order lines. Assignments for customer-pickup order lines occur during the pickup ticket print process."** **"This setting is NOT AVAILABLE if Route Mapping is active."** **"The selection you make here may affect your options for creating pick lists."** Also gates `Allow completion after ticket print` (which requires `Ticket Print`). |
| `Create a PO for Back Orderable Stock` | Enum: **`Prompt User`**, **`Allow Quantity Override`**, **`Always`** | Used **only** when the product is set up for PO creation via `PO from Order Entry` in Advanced Product Settings **and** there is insufficient quantity. `Prompt User` → Yes creates a PO for the **back order quantity with no option to specify quantity**; No skips. `Allow Quantity Override` → the `Create a Purchase Order Window` appears; **"valid quantity amounts are from one up to and including the quantity sold."** `Always` → "a prompt appears asking if you want to create a purchase order. **The purchase order is automatically created for the back order quantity.**" **[CONFLICT] — the description of `Always` still describes a prompt; the difference from `Prompt User` is undocumented.** |
| `Unassign Piece Not Completed` | Enum: **`No`**, **`Prompt`**, **`Yes`** | Whether to unassign merchandise that is Not Complete and returning via `Complete the Manifest Process`. **"The `Add to As-Is Reason Code` field on the `Pieces Not Completed Detail` screen TAKES PRIORITY over the setting in this field."** **"Does not affect special ordered and as-is pieces."** |
| `Auto Adjust Stock on Take With` | Checkbox | **[DANGEROUS]** — "enable operators to make **automatic stock adjustments** when insufficient quantity exists in the system to fill take-with sales orders and exchanges (**including line items for obsolete products**)." **This lets the POS silently create inventory that does not exist to make a sale go through — the classic source of negative/phantom on-hand.** A similar field exists in `Quick Sale Control Settings` (`SCS-060`). |

**`Inventory Reservations`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Reserve Product (Auto Fill) __ Days` | Integer — **required** | The Auto-Fill Days for **Just-In-Time Inventory**. **Resolution order: Advanced Vendor Settings — first by product, then vendor group, then vendor category, then by vendor — and only if none exists, this field.** **[TRISTATE] + [DESTRUCTIVE ON CHANGE]: "if you enter `0` (zero) here, the system does not attempt to reserve goods to line items, EFFECTIVELY DISABLING the Just-In-Time Inventory feature."** **And changing the value acts on live orders: "a message displays to ask if the fill days for open orders should be updated. If yes, the open order fill days are updated. If merchandise is RESERVED AND NOT YET ASSIGNED, and the new fill days result in a fill date AFTER the delivery date, THE MERCHANDISE IS UNRESERVED."** Changes are written to order comments. Only delivery and pickup lines are updated; **not** checked: as-is products, special order products, lines linked to a PO, service orders, returns, and lines with a delivery ticket printed. |
| `Fill Layaway Orders` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Enables JIT for layaway orders. Blank → layaways must be manually converted to sales orders first. **Hard mutual exclusion with `SCS-048`: "If `Layaway in Net Purchase Order` in Inventory Control Settings is already set when you press Save, you CANNOT check the `Fill Layaway Orders` box. … the error message, `"Fill Layaway Orders cannot be active while Layaway in Net Purchase Order is set"` appears, and you cannot save your changes."** **"Special order items must be reserved IN FULL at the time you add them to layaway orders."** **"The `Layaway Reserved` column in the grid of `View Product Availability` updates only if this setting is checked. If not checked, the LAST AVAILABLE NUMBER DISPLAYS AND REMAINS"** — **a stale number that looks live. Flagged.** |
| `Fill Orders on Credit Hold` | Checkbox | Enables JIT for orders on AR credit hold. Blank → items on a credit-held order must be reserved manually or the hold removed. **"This setting MUST be checked in order to use the `Include Order on Credit Hold` setting in Route Mapping Control Settings."** **"This setting is not reviewed for obsolete products."** |
| `Daily Auto Release of Stock` | Checkbox | Runs the **Auto Stock Release** process as part of End of Day. **"This field is INACTIVE if a check appears at either `Reserve ASAP Sales` or `Reserve CWC Sales` on the General tab of Inventory Control Settings."** |
| `Require Manual Updates to Reservations on Exchanges` | Checkbox | **Inverted-sense field.** Checked → **"the system does NOT automatically review reservations when the credit hold status or delivery date changes."** If the delivery date falls outside auto-fill days, the reservation is unchanged; if the credit hold is approved, items do **not** auto-reserve. Blank → exchanges behave like sales orders. |
| `Unreserve Assigned When Outside Fill Days` | Checkbox | Applies to **sales orders, exchanges, service orders, transfers**. Checked → **assigned (hard-committed) inventory eligible for release is automatically UNASSIGNED, and "once unassigned, the inventory is unreserved from the order."** Blank → not automatically unassigned. **Disqualified from unassignment: special order items; As-Is/Floor Sample; inventory already in picking.** **Automatic unreserve triggers (verbatim list):** delivery date moved outside the auto-fill window (`Reserve Product Auto Fill Days`); customer pickup date moved outside the fill window; the order put on credit hold while `Fill Orders on Credit Hold` is off; the order changed to **ASAP** while `Reserve ASAP Sales` is off; the order changed to **CWC** while `Reserve CWC Sales` is off; **"the line on the sales order is changed to have an unscheduled quantity. If pieces are assigned and a quantity becomes unscheduled, ALL SERIAL NUMBERS ARE REMOVED FROM THE LINE."** **"This setting only applies when a Pickup or Delivery date is moved outside of the fill window."** **[REUSE] `CFG-INV-RESERVEBY`, `CFG-WHINV-*`.** |

**`Transfers`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow Store to Store` | Checkbox | Blank → the system **prevents** transfers where neither the **main warehouse** nor the **regional warehouse** is the From or To location (both in `Enter a Transfer` and Automatic Transfers). Checked → such transfers are allowed. **"The `Main Warehouse` field in the Inventory Control Settings indicates your main warehouse, and the `Regional Warehouse` field in the Region Settings indicates your regional warehouse based on your log-in location. However, this field references the regional warehouse ONLY IF Regional Processing is active. This field does NOT reference the `Location Type Code` field in the Warehouse/Store Location Settings."** |

**`Auto Transfers`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Restrict Manifested Routes` | Checkbox | Checked → the system will not assign an auto-transfer delivery date for which a manifest already exists for that route+date; it **increments the transfer date to the next date with no manifest and displays a message with the new date**. Blank → dates are assigned regardless. |
| `Auto Schedule Period __ Days` | Integer, nullable | **[TRISTATE]: "If you enter a response at this field, the system generates an Automatic Stock Transfer document whenever the stock location on a sales order delivery differs from the ship-from location. If you leave this field BLANK, the system does NOT create automatic transfers."** **Formula (verbatim): `Transfer Date = Sales Order Delivery Date (EST or SCH) - Auto Schedule Days`.** Worked example: delivery `4/6`, auto schedule `3` → transfer date `4/3`. **"If the auto transfer date calculates to a PAST date, the system schedules the transfer for the CURRENT day."** **[REUSE] `CFG-POS-AUTOSCHED`.** |
| `Use Alternate Stock Location` | Checkbox | Enables **Store Schema Transfers**: auto-creates an auto-transfer when saving a line on a sales order or exchange sale. **"`Alternate Stock Location` is a SINGLE store location used as the secondary stocking location for the default stocking location."** If the default stocking location lacks the merchandise, an auto-transfer is created **for** the alternate stock location. |

**`Multi-Legged Transfers`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Use Stock Location Schema (Demand)` | Checkbox | Finds available stock to fill **demand** for a sales order, exchange order, or transfer; also used by "the phantom process that examines sales orders, exchange orders, and transfers to determine if a transfer is needed **or if a transfer can be deleted**". **"If using this setting, `Schedule Period Days` below MUST be populated with a number greater than zero."** **"The product MUST BE RESERVED to create this type of transfer."** |
| `Prefer Incoming Purchase Orders Before Stock Location Schema` | Checkbox — **default unchecked** | Evaluates incoming POs before applying Stock Location Schema or Alternate Stock Location to an order line. When enabled, the like-named setting in **Warehouse/Store Location Settings** is consulted — **"that setting defines the NUMBER OF DAYS that the Stock Location Schema processes will use to determine whether or not a purchase order arriving at that location is better suited to fill an order line instead of automatically creating transfers."** See `SCS-073` Stock Reservation Settings. |
| `Use Distribution Location Schema (Logistics)` | Checkbox | Creates **additional** transfers when the Stock and Fulfillment locations of a sales order/exchange differ between the From and To locations of a transfer. For transfers, "this would change the From location of the transfer to the location of the linked transfer that would fill the entered transfer". **"A logistical transfer is one … where merchandise must pass through a predefined set of locations… Product does NOT have to be reserved to create this type of transfer."** **Requires `Schedule Period Days` > 0.** |
| `Schedule Period Days` | Integer > 0 when either schema is used | "The number of days merchandise needs to transfer to the destination location… used to determine the schedule date of an auto-transfer." **"This setting is checked AFTER the `Schedule Period Days` setting in `Maintain Transfer Schedule Period Days`"** — i.e. the per-lane table wins, this is the fallback. |

**`Past Dates Rescheduling`** — four checkboxes activating the EOD auto-transfer rescheduling process

> Verbatim scope: "**for ALL types of transfers (auto, stock, as-is, floor samples, move to as-is, and
> multi-leg) with merchandise reserved and dates in the past. The transfers are rescheduled for the next
> available transfer delivery date and route. These transfers must have merchandise RESERVED, must be OPEN
> (not completed), and CANNOT BE ON A TRANSFER MANIFEST in order to be rescheduled.**"

| Field | Type | Purpose / business rule |
|---|---|---|
| `Store to Warehouse` | Checkbox | Auto-reschedule all Store→Warehouse transfers. |
| `Store to Store` | Checkbox | Auto-reschedule all Store→Store transfers. |
| `Warehouse to Store` | Checkbox | Auto-reschedule all Warehouse→Store transfers. |
| `Warehouse to Warehouse` | Checkbox | Auto-reschedule all Warehouse→Warehouse transfers. |

**`Exception Rules` (Inventory page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Zero Quantity Stock Level` | Check-level enum | Alert when stock reaches **zero** quantity for any product on a sales order. |
| `Minimum Quantity Stock Level` | Check-level enum | Alert when stock reaches the **`Minimum`** field established in **Warehouse Inventory Settings** (`CFG-WHINV-*`). |
| `Safety Quantity Stock Level` | Check-level enum | Alert when stock reaches the **`Safety`** field in Warehouse Inventory Settings. |

**`Other` (Inventory page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Adjust Soft Kit in Order Entry` | Checkbox | Checked → users can edit soft kit components on sales orders. Blank → users **can only DELETE soft kits** on sales orders, and **require a security override to access the `Group Pricing Screen`**. Override permission: **`Override soft kit restrictions`** in Extended Security. |
| `Prorate Returned Warranties` | Checkbox | Auto-prorates the price of a returned warranty in `Enter a Return` / `Enter an Exchange`, "based on the warranty term and the period of time that has elapsed since the warranty was activated". **Formula, verbatim: `(Today's Date - Warranty Start Date) / Total Warranty duration days = Prorate Percentage` then `Price - (Price * Prorate Percentage) = Prorated Price`.** **Note the formula as written yields the UNUSED portion, and gives a negative refund if the elapsed period exceeds the term (no clamp is documented). Flagged.** |
| `Quantity Error Level` | Integer | **[REUSE] `CFG-POS-QTYERR`.** Max quantity enterable "at data fields in **warehouse receiving and order entry** routines without receiving a warning message". Worked example: set to 50 → a warning appears for any quantity > 50. **"Users can override the warning and enter any quantity. This field simply provides a way to guard against keyboard errors."** |
| `Sort Report By` | Enum: **`Vendor Model Number`**, **`STORIS SKU Number`** | **[REUSE] `CFG-INV-VENDORMODEL`.** **"If `Vendor Model` is selected but the Product record does not contain the vendor model number, the report displays the product information using the SKU/product number followed by TWO ASTERISKS (`**`) to indicate that the vendor model number was not available."** |
| `Auto Fill Reporting` | Enum: **`Fully Reserved Only`**, **`Full and Partially Reserved`** | Mode of the **Automatic Stock Fill Report**, which runs during `Generate Daily Reports`. `Fully Reserved Only` → only orders that have had merchandise reserved since the last EOD **and now have ALL merchandise reserved**. `Full and Partially Reserved` → all orders with some or all merchandise reserved since the last EOD. |

---

#### `Commissions` page

**`Sales Order Salesperson Default` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Sales Order Salesperson Default` | Enum: **`In Customer Settings`**, **`The Current User`**, **`Not To Be Defaulted`** | `In Customer Settings` → use `Salesperson 1` / `Salesperson 2` on the **Point of Sale** tab of Advanced Customer Settings; **"If no default salespersons exist for the customer, default the house `ZZZ` salesperson."** `The Current User` → **"If the user is not a salesperson, default the house `ZZZ` salesperson."** `Not To Be Defaulted` → manual entry required. **Overridable by `Override Commission Rules` in Extended Security (Sales).** **"For Quick Sales, this field works in conjunction with the `Allow Entry of Salesperson` field in the Quick Sale Control Settings."** **`ZZZ` is a hard-coded magic house-account code.** |
| `Dollars Adjustments Update Salesperson Commissions` | Checkbox | Checked → **written** business updates as part of the commissions update process; blank → **only delivered business** updates. Overridable by `Override Commission Rules`. |
| `User Entering Order Must Be a Salesperson` | Checkbox | Assigns the creating user as one of the specified salespeople on new orders. **"If … the user creating the order is not set up as a salesperson, the user must assign the house salesperson (`ZZZ`)."** Overridable by `Override Commission Rules`. |
| `Salesperson Must be the Same for Return/Sale on Exchanges` | Checkbox | Forces the new-sale salesperson on an exchange to equal the return-side salesperson. **"When this setting is checked, the `Salespeople for New Sales` extra action is INACTIVE on the customer page of `Enter an Exchange`."** |

**`Commissions` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Calculation Method` | Enum: **`None`**, **`Customer Matrix`**, **`Salesperson Matrix`**, **`Gross Profit`** | `None` → no commission calculation. `Customer Matrix` → "a percentage of the **selling price or gross profit**, based upon the **customer, product, or salesperson**. The Commission Matrix uses two factors: a **calculation code** (percentage of price or profit) and a **source code** (customer, product, salesperson, or flat rate)." `Salesperson Matrix` → "variable rates by salesperson… based on the **product commission and salesperson commission categories** in Commission Settings… different rates based on the salesperson's level (e.g. regular, senior, manager)… you can also define a **variable rate table based on the gross margin percentage** earned for a line item." `Gross Profit` → uses **`Low & High Limit Percent`** and **`Low & High Commission Percent`**; "calculates commissions using the gross profit margin and the gross profit dollars from each sale… **In essence, it creates a DOUBLE SLIDING SCALE that produces a ratio that is the commission percentage.**" Selecting it opens the **`Commission Calculation`** screen (also reachable from the Action button beside the field) — see `SCS-015` and `SCS-039`. |
| `Maximum Split Commissions` | Integer **`1`–`99`**, nullable | Max salespeople in a commission split. **[TRISTATE]: "If you leave this field BLANK, you specify NO MAXIMUM."** Overridable by `Override Commission Rules`. |
| `Split Commission Evenly` | Checkbox | Even split across multiple salespeople. **"When a rounding error requires an uneven split, the system allows a `.01%` difference for any of the listed salespeople."** Overridable by `Override Commission Rules`. |
| `Report Type` | Enum: **`Customer Name`**, **`Profit Margin`** | Print mode for the Sales Commissions report. **"`Customer Name` — print by customer name (REPLACES THE COST/MARGIN FIELDS with customer name)."** **A reporting setting that suppresses margin data — effectively an information-access control living in a print option.** |
| `Retention Period __ Days` | Integer **`0`–`999`** | **[DESTRUCTIVE]** Days salesman commission data is retained before purging as part of **`Generate Monthly Reports`**. **"STORIS recommends setting this to at least 31 days."** **`0` is in range and would purge commission history immediately — payroll evidence.** |

**`Deliveries` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `On Delivery Charge` | Enum: **`None`**, **`Profit`**, **`Revenue`** | Commission method for delivery charges, delivery credits and delivery charge adjustments. **`None` clears and deactivates `Delivery Commission` and `Delivery Cost Factor`.** **`Profit` activates `Delivery Commission`, deactivates `Delivery Cost Factor`** *(the article says this, then uses `Delivery Cost Factor` in the Profit formula and says elsewhere that `Delivery Cost Factor` "is active only if you select Profit" — **[CONFLICT] in the source, must be resolved before implementing*)*. **Profit formula (verbatim): `(Delivery Charge – (Calculated Delivery Charge * Delivery Cost Factor)) * Delivery Commission`** — **"This option MAY RESULT IN A NEGATIVE COMMISSION when the difference between the delivery charge and the factored calculation delivery charge is too great."** **Revenue formula (verbatim): `Delivery Charge * Delivery Commission`.** |
| `Delivery Commission __ %` | Percentage | Active only for `Profit` or `Revenue`. |
| `Limit on Delivery Charges` | Checkbox | Only meaningful with `Profit`. Checked → **"whenever a user overrides the `Delivery Charge` field in order entry with an amount GREATER than the default charge, the system still calculates delivery commissions using the DEFAULT delivery charge."** |
| `Delivery Cost Factor __ %` | Percentage | "Active only if you select `Profit`." |

> **Delivery-commission exclusions (verbatim):** "To generate delivery charge commissions, you must be set up
> to **default** delivery charges. … The following **do not** create delivery commission records:
> **Returns, exchanges, and dollars-only adjustments that are not against an original invoice**;
> **returns you create with pickup charges (not delivery charge credits)**. **Calculated delivery charges for
> returns, exchanges, and dollars-only adjustments PRORATE BASED ON THE DELIVERY CHARGE ON THE ORIGINAL
> ORDER, not the delivery charge refunded** on the return/exchange/adjustment." Reporting: sales commission
> reports for line-item commission data; **`Delivery Commission Exceptions`** in Report Builder for exceptions.

**`Protection Plans` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `On Protection Plans` | Enum: **`None` (default)**, **`Profit`**, **`Revenue`** | `None` clears and deactivates `Protection Plan Commission`. `Profit` → commission on profit only. `Revenue` → commission on the **selling price** of the plan. |
| `Protection Plan Commission __%` | Percentage | **"The [percentage] is used IF the commission percent is not specified in the Protection Plan."** — a fallback, not an override. |

---

#### `Profit and Costs` page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Minimum Gross Profit __ %` | Percentage | **Global** minimum GP% to maintain for sales order line items **whose default selling price is changed during order entry**. Failure raises an exception governed by `Minimum Gross Profit Not Met`. **"This is a GLOBAL setting. You can also specify minimum gross profit percentages at the PRODUCT level and the STORE LOCATION level, and those settings OVERRIDE the global setting."** — three-level most-specific-wins. |
| `Sales Margin Scratchpad Cost` | Enum: **`Average Cost`**, **`Replacement Cost`**, **`Whichever Cost Is Greater`** | Costing method used in the **Sales Margin Scratchpad**. **[REUSE] `CFG-COSTING-*`.** **Flagged: the margin a salesperson sees while negotiating can be computed on a different cost basis than the margin the GL books. `Whichever Cost Is Greater` is deliberately conservative for the salesperson.** |
| `Display of Sales Summary` | Enum: **`None`**, **`Dollars`**, **`Percent`** | Display of profit figures on the **Executive Flash** inquiry. **An information-disclosure control disguised as a display preference.** |

**`Exception Rules` (Profit and Costs page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Minimum Gross Profit Not Met` | Enum: **`Do Not Alert`**, **`List On Exception Report`**, **`Warning Messages`**, **`Security Override`** | Global check level for minimum gross profit on a line whose selling price does not meet the minimum. **"This is a global setting. You can also specify check levels at the STORE LOCATION level. That setting overrides the global setting."** |
| `Zero Cost on Direct Shipment` | Check-level enum (same four values) | Alert when **releasing invoices for direct-ship zero-cost line items**. |
| `Selling Price is Below Cost` | Check-level enum | Alert when a user changes a line's selling price **below the product's cost**. **"To specify this alert by warehouse/store location, go to the `Sell Price is Below Cost` field on the Advanced page in Warehouse/Store Location Settings."** |
| `Zero Cost Non-Inventory Item` | Enum: **`Do Not Alert`**, **`List on Exception Report`**, **`Warning Messages`**, **`Security Override`** | Checked "during purchase order entry, warehouse receiving, inventory adjustments, and invoicing of credit memos" for a zero-cost, **non-inventory (intangible)** item. Related: `SCS-087` Zero-Cost Exception Handling. |

---
#### `Printed Documents` page

**`Point of Sale Behavior`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Multiple Order Copies` | Checkbox | Checked → after each sales order print, the system asks whether to print another, repeating until "No". Blank → additional copies require re-opening the order. |
| `Default to Print a Document` | Checkbox | Defaults the `Print` checkbox on the **`Print Options Window`** to checked. |
| `Default to Email a Document` | Checkbox | Defaults the `E-mail` checkbox to checked. **"If an email address is on file with the customer, the customer's name defaults as the `Recipient` and the email address defaults as well… If no email exists for the customer, one can be entered."** **"Even if this setting is checked, the ability to check the `Print` box … remains."** **"If the `Payment / Deposit receipt` email event is not set up to `Email` in Notifications Control Settings, the email fields are HIDDEN."** (dependency on `SCS-050`) |
| `Default to Digital Email a Document` | Checkbox — **default unchecked** | **For use with flexEngage.** Defaults the `Digital Email` checkbox in the Print Options Window. |
| `Print Cumulative Sales Order in View an Existing Sales Order` | Checkbox | **"To use this setting, you must select `Forms Designer` as the Sales Order document type."** Enables `Print Cumulative Sales Order` (order history) in the read-only view screen. |

**`Document Print Method`**

> "Sales orders, completed orders, shipping tickets, and COG documents print via **Enhanced Laser Forms**."

| Field | Type | Purpose / business rule |
|---|---|---|
| `POS Payment, Refund, Gift Certificate Receipt` | Checkbox | Prints a receipt at the conclusion of a cash posting session; **the form is called `PAYMENT RECEIPT`, printed via Forms Designer.** **"Receipts print for ALL `Enter a Customer Payment/Refund/Gift Certificate` payments EXCEPT previous deposits. That is, if entering a deposit for an existing order, the program prints the SALES ORDER instead of a receipt and includes the new deposit as part of the total deposits for the order."** |
| `Maintain Customer Deposits Refund Receipt` | Checkbox | Prints a receipt at the conclusion of a refund via `Maintain Customer Deposits`. **Form selection rule: "The form used is the `Payment Receipt` UNLESS the `Use Extended Payment Receipt` setting is enabled in Accounts Receivable Control Settings, in which case the `Cash Application Receipt` is printed."** **Signature/archive interaction, verbatim: "The ability to capture a customer signature is available if Signature Capture is active… While capturing a signature is NOT dependent on printing a receipt, THE SIGNATURE IS ARCHIVED ONLY IF A RECEIPT IS PRINTED. If a receipt is not printed, a signature is captured but not archived."** **[DESTRUCTIVE-adjacent] — a captured refund signature is silently discarded when receipt printing is off.** |

**`Delivery and Pickup Tickets`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Customer Pickups for Today` | Checkbox | Checked → customer pickup tickets can only be generated for orders whose scheduled pickup date **equals the current system date**. **"A checked box at this field OVERRIDES the `Delivery Lead` setting on the Inventory tab of this control settings screen."** (the article says "Inventory tab"; the `Delivery Lead` field is documented in this same `Delivery and Pickup Tickets` group — **[CONFLICT] in the source**). Blank (default) → tickets can print within the Delivery Lead. |
| `Back Order Quantity` | Checkbox/option | Print back-order quantities on delivery tickets. |
| `Delivery Lead __ Days` | Integer | Days before the scheduled delivery date that delivery tickets may be printed. **"If this setting is enabled, users CANNOT print delivery tickets until this many days before the scheduled delivery date."** |

**`Other` (Printed Documents page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Product Image Option for Forms Designer` | Enum: **`No Product Image` (default)**, **`Use Thumbnail`** (50KB), **`Use Standard Size Image`** (100KB), **`Use Large Image`** (200KB) | Whether a product image (from `Update Product Images`) appears on ELP forms. **"If no image exists, no image is rendered onto the form."** Capable forms (verbatim list): `Cumulative Sales Order`, `Exchange`, `Exchange Invoice`, `Fast Cash`, `Invoice`, `Layaway Order`, `Return`, `Return Invoice`, `Sales Order`, `Sales Quote`, `Service Order`, `Shopping Cart`. |
| `Sales Order Print Sort By` | Enum: **`Room`**, **`Group Pricing`**, **`Fulfillment`**, **`Line`** | Default for `Sort Items By` in Print Options. **[CONFLICT] in the source — it says `Room` "is the default option if the `Allow Room Entry in Enter a Sales Order` setting is set" AND that `Group Pricing` is "The default sort option".** `Fulfillment` → "Fulfillments are sorted by delivery date with **ASAP and CWC sorted at the beginning of the list**." **"This setting must be enabled to group line items by their fulfillment method when generating a printed sales order in STORIS NextGen."** |
| `Sell Price of Soft Kit Components` | Checkbox | Checked → component prices print on sales orders and delivery tickets; blank → only the total kit price. |
| `Sell Price on Transfers` | Checkbox | Print the sell price on transfer pick tickets. **Consider the information-disclosure implications for third-party carriers.** |
| `Barcode on POS Labels` | Checkbox | Include bar codes when printing POS product labels. |
| `"As Is" Line Item Text to Print on Order` | Text, **max 34 alphanumeric characters** | Text printed on **sales orders, AP bills, and delivery tickets** where as-is line items are present. Action button opens **`Description Field - Language Translation Entry`** (i18n). **A 34-character disclaimer is the entire legal notice for an as-is sale. Flagged.** |
| `Number of Confirmation Labels to Print` | Integer **`1`–`9`**, **default `2`** | Confirmation labels printed per product on the Pick List. |

---

#### `Advanced` page

| Field | Type | Purpose / business rule |
|---|---|---|
| `Sales Security Access` | Checkbox | Activates **global sales security access**: "the system requires users to enter their password before they can access certain reports and inquiries." **"This setting MUST BE ACTIVE before you can access the `View All Sales Information` field in `Create a User/Group Actions - Sales Security`."** **This is a second kill-switch of the same shape as Extended Security — a per-user permission is inert unless a global box is ticked.** |
| `Enter Cash Amount Tendered` | Checkbox | Prompts (when a cash drawer is active) for the amount given to the cashier; the system computes change due. |
| `Enter Reason Code For Line Deletion` | Checkbox | Requires a reason code when deleting one or more lines from an existing transaction (**sales orders, layaways, exchanges**). |
| `Schedule Direct Ship Lines` | Checkbox | Checked → direct-ship lines default to status `Scheduled`; blank → `Unscheduled`. **"Does not apply to direct ship lines on service orders."** |

**`Point of Sale User Verification`**

> Purpose: require user ID and password before creating or editing an order. **"The `Transaction Entry - User
> Log In Screen` appears after a user specifies the order number… The Order Comments Log records the user who
> makes the changes."** **"This feature applies to ENTRY routines only, and not to VIEW routines."**
> **"If your system is set for cash balancing by cashier, THIS FIELD IS INACTIVE."**
> Also appears in `Quick Sale Control Settings` (`SCS-060`) and `Service Control Settings` (`SCS-070`).

| Field | Type | Purpose / business rule |
|---|---|---|
| `Sales Order` | Checkbox | Require ID/password to access `Enter a Sales Order`. |
| `Exchange` | Checkbox | Require ID/password for the Exchange process. |
| `Customer Return` | Checkbox | Require ID/password for the Return process. |
| `Sales Dollar Adjustment` | Checkbox | Require ID/password for the Sales Adjustment process. |

**`Backdating Rules`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Entry Date __ Days` | Integer **`0`–`31`** | Days into an **overlap month** that qualified users can backdate **new** sales orders. Qualification: the **`Backdate Transactions`** permission. Worked example: set to 10 → qualified users can backdate 10 days into the overlap month, and are prevented at 11+. **Hard rule: "the system does NOT allow security overrides to this setting."** |
| `Completion Date __ Days` | Integer **`0`–`61`** | How many days in the past users can backdate **sales transaction completions** (sales orders, exchanges, returns, dollar adjustments to completed orders). **[CONFLICT]/bypass: "When the `Change a transaction's completion date` field is ENABLED in Sales Security, THE NUMBER OF DAYS ENTERED HERE IS IGNORED and the user can backdate the sale's completion to ANY DAY in the open sales period(s)."** When not enabled, this number applies and an override is required to go further. **Backdating a completion moves revenue between accounting periods — this is a financial-close control.** |

**`Sales Tax`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Update Tax Rate Changes` | Checkbox | **Default for the `Validate Tax Rate` field in Sales Tax Settings when NEW tax jurisdictions are created.** `Validate Tax Rate` "determines whether the system checks and **recalculates sales tax on OPEN sales orders**". **"Regardless of the initial default setting, individual tax jurisdictions can be set to validate or not validate."** **A default-for-new-records setting, not a live control — changing it does not affect existing jurisdictions.** |
| `Imbedded National Tax` | Checkbox — **STORIS-locked field** | Checked → national tax amounts are **embedded in line item prices**; blank → tax displayed separately. "Contact STORIS if you want to edit this field." |

**`Marketing Code Rules`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `First Marketing Code` | Enum: **`Optional`**, **`Mandatory`**, **`None`** | Behavior of `Marketing Information - Code 1` in `Enter a Sales Order`: active-not-mandatory / active-and-mandatory / inactive. |
| `Second Marketing Code` | Enum: **`Optional`**, **`Mandatory`**, **`None`** | Same for `Code 2`. **Hard dependency (verbatim): if `First Marketing Code` is `Optional`, only `Optional` and `None` are available here; if `Mandatory`, all options are available; if `None`, "the system sets this field to `None` and you cannot edit it."** |
| `Allow Marketing Code Changes` | Checkbox | Globally allows editing marketing codes on existing sales orders **for which no part has been completed**. "For example, if this box checked and the order is already partially invoiced you cannot edit the marketing codes." |

**`Customer Email Address`** — **note the article documents this group TWICE with different field names and slightly different rules; both variants are recorded here.**

*Variant 1 (first pass)*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Default Email Address` | Email | **"If you enter a VALID email address at this field, the `Primary Email` field in Advanced Customer Settings and order entry, as well as the `Email` field in `Enter a Sales Lead`, ALL BECOME MANDATORY when creating new customers/contacts/orders."** **[TRISTATE] — populating a "default" field silently makes a different field mandatory system-wide.** |
| `Load Default Email Address` | Checkbox | Active only when `Default Email Address` is populated. Checked → the default is auto-loaded whenever the system requires an email (users may override). Blank → users must key a valid email manually. |

*Variant 2 (second pass — the field set actually shipped, most likely)*

| Field | Type | Purpose / business rule |
|---|---|---|
| `Default Email Address` | Email | Used when an email is left blank in `Primary Email` (Advanced Customer Settings), `Email` (`Enter a Sales Leads`), or order entry, **if `Load Default Email Address` is checked**. Users can override. |
| `Email Address Required` | Checkbox | Requires an email in `Primary Email` and order entry, and in `Enter a Sales Lead`, when creating new customers/contacts/orders. **"If `Load Default Email Address` is checked, an email address is required EVEN IF this field is unchecked."** |
| `Load Default Email Address` | Checkbox | Available when `Default Email Address` is populated. **"If checked, an email is required even if `Email Address Required` is not checked."** |

**Combined behavior (verbatim, applies to both variants):**
- **Checked (`Load Default`)** — new customer saved without an email → **the system automatically adds the default email address to the customer record** ("To see the default, you must save out of the record then re-access it"); order entry for a customer with the default email → the **`Email Address Entry Screen`** appears showing the default, and you must accept it or enter another, **and "the system updates the Customer Settings with your entry upon saving the order"**; new contact in `Enter a Sales Lead` → the default is loaded if the field is empty.
- **Blank, with a `Default Email Address` entered** — new customer saved without an email → **error, and "the program requires you enter a UNIQUE email address before you can save the record"**; order entry → the Email Address Entry Screen appears and a valid email must be entered, updating Customer Settings on save; `Enter a Sales Lead` → email entry required.

> **This is a serious data-quality trap:** a house default address (e.g. `noreply@…`) gets written onto real
> customer records, permanently, as if it were the customer's own. Combined with
> `Warn if Primary Email exists for other Customers` and `Prohibit New Customers with Duplicate Email
> Addresses`, the default address will be shared by thousands of customers. **Flagged.**

**`Other` (Advanced page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Validate Alerts` | Enum: **`Never`**, **`At End-of-Day Reporting`**, **`Printing Reports On Demand`**, **`Always`** | How sales orders are re-checked for exceptions. `Never` → "the report lists ALL exceptions whether or not they have been resolved at the time of printing." `At End-of-Day Reporting` → runs the Exception Report at EOD and lists only **unresolved** transactions. `Printing Reports On Demand` → only unresolved, when any Sales Order Exceptions report is run. `Always` → **"recheck for exceptions each time the report is run AND each time a sales order is RE-OPENED."** |
| `View Salesperson's Sales Activity` | Checkbox | Shows/hides on the General page of `View Salesperson Activity`: **`Written Sales Today`, `Written Sales Month To Date`, `Delivered Sales Today`, `Delivered Sales Month To Date`.** |
| `Clear Contact Data for Partial Invoices` | Checkbox | Clears the contact status and contact date from partial invoices. |
| `Post Line Discounts to General Ledger` | Checkbox | Posts line-discount amounts to GL. **Account resolution hierarchy (verbatim, in order): 1) `Line Discount GL Account` in Sales Discount Settings; 2) `Sales Line Discount` on the General tab of Group Settings; 3) `Line Discount` on the General tab of Category Settings; 4) `Sales Line Discount` on the Sales tab of General Ledger Assigned Account Settings; 5) `GL Account Number Default` on the General tab of General Ledger Control Settings.** **"The discount RECOVERY fields that correspond to the line discount fields above also follow this hierarchy, BEGINNING WITH #2 … (i.e. does not consider the first field listed)."** |
| `Promotional Pricing Retention Period __ Months` | Integer (months/periods) | **[DESTRUCTIVE]** Periods to keep loaded **Product Adjustment** records. "For Promotional Pricing, including kit component pricing, this is the number of periods **after the promotion has expired**. For other adjustments, this is **the date the adjustment was loaded**." **Hard constraint: "The number you enter here MUST NOT BE LESS THAN the `Customer Retention Period` field on the Customer page OR the `Periods of Data Retention` field in the Sales Analysis Report Control Settings."** (cross-screen to `SCS-067`) |
| `Allowed Number of Days on Returns` | Integer, nullable | **[REUSE] `CFG-POS-RTNDAYS`.** Days returns are allowed without a security override. Worked example: 6 months → enter `180`. **[TRISTATE]: "To designate NO TIME RESTRICTION, leave this field BLANK; this is the default."** **"The number of days is verified by comparing the original order number to the original order date in the return/exchange entry process date. If an original order number is NOT PROVIDED, the user still must be permitted to continue WITHOUT the original order number."** — **the return-window control is trivially bypassed by omitting the original order number.** Override permission: **`Override Allowed Number of Days on Returns`**. |

---
#### `Pricing` page

**`Price Variance Rules`** — **the article documents this heading twice, once for stock products and once for special-order products.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Variance __ %` (stock products) | Percentage | **"For users REDUCING the selling price of a product on a sales order, enter the maximum percentage of the selling price you want to allow users to vary from the selling price established in the Advanced Product Settings. If the modified price is LESS than the selling price by a percentage GREATER than the percentage you enter here, the system may generate an alert record"** per `Variance Exceeded Alert`. **"You can also specify price variance percentages BY LOCATION via the Settings tab in Warehouse/Store Location Settings. If a price variance percent has been specified for the selling location on an order, THAT SETTING OVERRIDES the setting entered here."** **Note this constrains discounts only, not markups.** |
| `Price Variance Rules` (special-order products) | Numeric **`0`–`100`**, **up to two decimal places**, nullable | **"The maximum percentage by which the price of a SPECIAL-ORDER product being entered on a merchandise line can differ from the selling price established in Advanced Product Settings, PLUS UPCHARGES FOR SPECIAL-ORDER OPTIONS."** **[TRISTATE]: "When this setting is set to NULL, NO CHECK IS PERFORMED as to whether a special-order product differs from its set retail price."** Validation messages, verbatim: `"Entry must be less than or equal to 100."` and `"Entry must be greater than or equal to 0."` **"The settings `Variance Exceeded Alert`, `Reason Required`, and `Comment Required` function for special-order products as they do for stock products."** |
| `Variance Exceeded Alert` | Check-level enum | Alert when a price modification exceeds the allowable variance. Location-level override applies as above. |
| `Allow Price Change` | Checkbox | Checked → users may override the system-defaulted selling price in Sales Order Entry. **Blank → "users cannot override the default selling price."** **This is the master price-override switch and should be off by default.** |
| `Reason Required` | Checkbox | **"Requires a reason code REGARDLESS of the alert level selected and the user's access… This occurs regardless of the user's sales security setting `Override POS exception rules` and the `Variance Exceeded Alert` level selected."** Reason codes appear on the **`Variance from Retail`** report, which runs as part of `Generate Daily Reports`. **Location precedence: "The system checks the LOCATION first and if the box at that setting is blank, it uses the global settings established here."** |
| `Comment Required` | Checkbox | Requires a comment on a price variance exception. Viewable via `Actions > View/Edit Exception Comments` on the Merchandise tab (**`Enter Exception Comments`** window). **"The comment entered is associated with the ENTIRE ORDER, and not with a particular line."** **"Price variance checks are performed on the LINE ITEM PRICE, MODIFIED ORDER SUBTOTAL, and WITHIN GROUP PRICING. If you leave the `Threshold` field blank, this check box must also be blank."** (`Threshold` is not otherwise documented on this screen — **content gap / [CONFLICT]**.) |

**`Discounts`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Maximum Subtotal Discount __ %` | Percentage | **Required if** either `Apply Discount Codes to Subtotal` or `Apply Additional Amount or Percent to Subtotal` is checked. "The system ensures that the TOTAL discount percentage applied to the merchandise subtotal amount, **including both types of subtotal discounts**, does not exceed the maximum percent established." **[TRISTATE]: "If you apply discounts to orders by adjusting the subtotal amount, LEAVE THIS FIELD BLANK OR ENTER ZERO."** Location override: `Maximum Subtotal Discount %` on the General tab of Warehouse/Store Location Settings — **"the system checks the Warehouse/Store Location Settings FIRST, and uses the setting there IF NOT BLANK."** |
| `Apply Discount Codes to Individual Line Items` | Checkbox | Activates the `Discount` field on the Merchandise tab. **Mutually exclusive: "If you check this box, you CANNOT check the box at `Apply to Order by Adjusting Subtotal Amount`."** |
| `Apply to Sales Order by Adjusting Subtotal Amount` | Checkbox | Discounts line item prices by adjusting the subtotal on the Payment tab; **"the line items are RE-PRICED to total the newly adjusted subtotal amount."** **Mutually exclusive with `Apply Discount Codes to Individual Line Items`.** |
| `Apply Discount Codes to Subtotal` | Checkbox | Activates `Discounts - Codes` on the Payment page; **applied to the order subtotal rather than individual line items**. **"Subtotal discounts CANNOT be applied when Alternate Tax Interface is active."** (cross-screen to `SCS-006`) |
| `Apply Additional Amount or Percent to Subtotal` | Checkbox | Activates the `Percent`/`Amount` fields in `Enter a Quick Sale` (`Enter Subtotal Discount Codes` window) and the `Discount %` field on the Payment page of `Enter a Sales Order`. **"This type of discount does NOT affect line item prices; the discount amount is subtracted from the subtotal of the order."** |
| `Apply Fixed Amount Subtotal Discounts First` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Applies only to **coded** discounts to the subtotal. Checked → **all fixed-amount discounts first, then percentage discounts**, "Each discount is applied to the NET SUBTOTAL resulting from the application of the previous discount" (compounding). Unchecked → percentages first, then fixed amounts. **"Discounts to the subtotal entered as an additional amount/percent … are ALWAYS APPLIED LAST, after coded discounts."** **Discount ordering materially changes the total — and this field is vendor-locked.** |
| `Apply Fixed Amount Line Discounts First` | Checkbox — **not STORIS locked** | Line discounts only. Checked → dollar discounts subtracted from the merchandise subtotal **before** percentage discounts. Blank → percentages applied to the order line **before** dollar discounts. |
| `Set Order Quantity to 1 to Ensure Optimal Discounting if Using Schedule` | Checkbox | Enables Auto-Apply from sales order and quick sale entry when a **Daily Discount Schedule** exists for the order date (`Actions > Start Automated Line Discounting`). **Recommended pairing with `Automatically Select Optimal Lines for a New Discount` — "you will receive an error message but are still able to save if not."** **Hard mutual exclusion: this and `Automatically Apply Discounts Using Membership Discount Schedule` "are MUTUALLY EXCLUSIVE and cannot be enabled (checked) at the same time. If attempted, an error message is displayed."** **"Highly encouraged if you intend to use buy one get one, 'BOGO', discounts. Otherwise it will be the responsibility of the user to MANUALLY BREAK LINES into single quantity."** **"This setting takes effect if membership discounts are active, EVEN IF the customer is not yet enrolled in a membership plan."** |
| `Set Ordered Quantity to 1 to Ensure Optimal Discounting if Required by the Daily Discount Schedule` | Checkbox | When the Daily Discount Schedule contains a discount set as **`Apply to Additional Item of Equal or Greater Value (BOGO)`** or **`Apply to Additional Purchases`**, the ordered quantity is exploded into **individual lines of quantity 1** (qty 3 → three lines of 1). **"Validation applies to EACH LINE of the order as if entered individually, meaning ALL pop-up messages, alerts, and options are REPEATED as each line is added… if any linkable warranties exist and Warranty Category Settings is set to `Do Not Display`, the `Warranty Linkage Selection` window opens FOR EACH applicable line."** **A usability landmine at high quantities.** |
| `Automatically Select Optimal Lines for a New Discount` | Checkbox | On manually adding a discount via `Enter Discounts on Multiple Lines` or Auto-Apply, the process **"automatically defaults the discount to the order lines in a manner that is most beneficial for THE CUSTOMER"**, respecting per-discount restrictions. **"If the `Automatically Apply Discounts Using Daily Discount Schedule` field is enabled, this field MUST also be checked."** |
| `Apply to Sales Order by Adjusting Net Total` | Checkbox | Enables the `Action` button at the `Net Total` field to open **`Adjust the Net Total`**. Permission: **`Change the Net Total on Sales Orders`**. **This bypasses line pricing and subtotal discounting entirely — the deepest override available in order entry.** |
| `Reduce Subtotal Discount Amount when it exceeds the Open Order Subtotal` | Checkbox — **default unchecked** | Reduces subtotal discount(s) to match the order subtotal when the discount exceeds it. **Hard prerequisite: "To use this field, the `Maximum Subtotal Discount %` field in the above Pricing section MUST BE SET TO 100%."** A prompt confirms per discount (Yes reduces; No requires manual modification). **"Subtotal discounts are reduced beginning with the LAST discount entered."** An additional manual discount can still be applied and **"is considered FIRST if an adjustment to the subtotal is required."** **"This setting only applies to the ORIGINAL OPEN ORDER. It does NOT apply to orders that have been partially completed, even if new discounts are applied."** |
| `Automatically Apply Discounts Using Membership Discount Schedule` | Checkbox | Enables Auto-Apply based on membership. If the customer is in a membership program and `Automatically Apply Membership` is on, a confirmation prompt appears — **"If you select yes, ALL LINE DISCOUNTS ARE REPLACED by the discounts determined in Membership Discount Schedule."** **[DESTRUCTIVE at the order level — manually entered line discounts are wiped.]** Mutually exclusive with `Automatically Apply Discounts Using Daily Discount Schedule`. |

**`Soft Kits`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Apply Pricing Hierarchy to kit components in a sale when the kit is changed` | Checkbox | Checked → removing a soft-kit component or changing its quantity raises a warning; on continue, **"the soft kit GROUPING IS REMOVED and selling prices for the components are RECALCULATED using the existing pricing hierarchy for each product individually. An order comment is also created, logging the reason for the price change of each component."** Blank → component selling prices remain unchanged. **[IRREVERSIBLE at the order level — the kit grouping cannot be restored.]** |
| `Allow Quantity Ordered Greater Than One` | Checkbox | Checked → the `Quantity` prompt is enabled when a Soft Kit is added in `Enter a Sales Order`, `Enter an Exchange`, `Enter a Quick Sale`, and **"its components are added to the order with the quantity of each component line item MULTIPLIED by the value you specified"**. Blank → the Quantity prompt is inactive. |
| `Use Lowest Price` | Checkbox | For soft kit masters whose **`Source of Price` is `Product`**. Checked → total of prices derived from the **pricing hierarchy** for all components; blank → total of the **`Default Kit Selling Price`** values in Advanced Product Settings. **"Depending on your pricing setup, the price selected by the pricing hierarchy MAY NOT BE THE LOWEST PRICE specified for a product"** — **the field name is wrong. [CONFLICT].** |

**`As-Is/ Floor Sample Pricing`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Assign Price on As-Is Items` | Checkbox — **default unchecked** | Controls whether a price is defaulted when a piece is added to As-Is — **"applies to ANY process that changes the status of a piece from saleable to as-is and any process that adds inventory directly to as-is."** Active → the current selling price is presented as the default on status change, and on completion of a return (or the return portion of an exchange) in as-is status **"the price is written to the PIN (Piece INventory) record based on the current selling price of the piece."** Inactive → no default price presented, and **no price is written to the PIN record**. **Additionally (verbatim): "when this setting is enabled, it updates the price of a single product when it is changed from being a stock product. THE PRICE OF THE PRODUCT IS NOT IMPACTED BY GENERAL PRICING CHANGES. Only description and benefit changes can be tracked when this setting is enabled."** — **enabling this pins the piece's price permanently against future price changes. [IRREVERSIBLE per piece].** Changes to a product's **description, selling price, retail price, or product benefits** are picked up by the scheduled process **`Move Captured Data for Event Detection`**, and if **`Create Floor Sample Label Queue on Product Change`** (Warehouse/Store Location Settings) is enabled, floor sample inventory is queued to the **Label Queue** for `Print Queued Labels`. |
| `Assign Price on Floor Sample Items` | Checkbox — **default unchecked** | Identical semantics for pieces changed to **Floor Sample** status / returned with a **Floor Sample reason code**, including the same PIN-record write, the same price-pinning behavior, and the same Label Queue chain. |

**`Other` (Pricing page)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Use Order Date for Promotional Pricing` | Checkbox | Checked → **promotional pricing is determined by the order's CREATION date**: "if the pricing still exists within STORIS, items added to the order receive the promotional prices that existed at the time the order was created." Unchecked → promotional pricing is based on **the order LINE's written date**. **"If a line is DELETED from an existing sales order and then ADDED BACK, pricing is based on the date that the line is added back."** — **a delete-and-re-add silently re-prices at today's promotion, in both modes.** |

---

**Behavior & rules — the hard ones across the whole screen.**
- **Blank ≠ off.** On this screen blank variously means *unlimited* (`Maximum Number of Fulfillments`,
  `Maximum Split Commissions`, `Allowed Number of Days on Returns`, `Restrict Scheduled Date`), *disabled*
  (`In-Process Delivery Restriction`, `Auto Schedule Period`, `Restocking Fee on Returns`, special-order
  `Price Variance Rules`), *manual entry required* (`Next Point of Sale / Service Transaction`),
  *keep forever* (`Completed Orders`, `Completed Transfers`, `Customer Activity Log`), and
  **destroy everything at the next period close** (`Voided Orders`, `Customer Retention Period`).
  **The same visual state means opposite things field to field. This is the single biggest hazard in the screen.**
- **Zero ≠ blank.** `Sales Quotes` retention: `0` deletes all quotes, blank deletes none. `Manifest Exception
  Retention`: `0` retains nothing. `Reserve Product (Auto Fill) Days`: `0` disables JIT reservation entirely.
  `Restocking Fee`: `0` defers to the group-level rate, blank suppresses the fee.
  `In-Process Delivery Restriction`: `0` = day-of-delivery only.
- **Two settings are mutually exclusive at save time with explicit error text:** `Fill Layaway Orders` vs
  `Layaway in Net Purchase Order`; `Apply Discount Codes to Individual Line Items` vs `Apply to Order by
  Adjusting Subtotal Amount`; the daily vs membership discount auto-apply pair.
- **Two settings force a rebuild job:** the Deliveries and Transfers `Status`/`Quantity` route-capacity
  settings both demand `Rebuild Route Calendar` before the change can be saved.
- **Route Closing Period days are effectively irreversible** — changing the number does not re-open dates.
- **Credit hold blocks reservation** unless `Fill Orders on Credit Hold` is on.
- **`Sales Security Access` is a second Extended-Security-style global kill switch.**
- **`Completion Date __ Days` is fully bypassed** by a single user permission.
- **`Allowed Number of Days on Returns` is bypassed** by not supplying an original order number.
- **`Auto Adjust Stock on Take With` lets POS invent inventory.**
- **The `Default Email Address` mechanism writes a house email onto real customer records.**

**Dependencies.** Warehouse/Store Location Settings (`CFG-LOC-*`) — overrides for `Restrict Scheduled Date`,
`Maximum Subtotal Discount %`, price variance %, `Sell Price is Below Cost`, minimum GP check level, receipt
printing, `Prohibit Customer Personal Information when not Required by Sale`, `Automated & Manual POS
Numbers`, `Prefer Incoming Purchase Orders Before Stock Location Schema`, `Delivery/Pickup Postponements
Times`, `Create Floor Sample Label Queue on Product Change`, `Third Party Mapping Software Interface`,
`From Email Address`; `SCS-043` Inventory Control Settings (`Layaway in Net Purchase Order`, `Reserve ASAP
Sales`, `Reserve CWC Sales`, `Main Warehouse`); `SCS-048` Net Purchase Order; `SCS-002` Accounts Receivable
Control Settings (`Service Order Exempt`, `Daily Maximum Cash Refund Per Customer`, `Use Extended Payment
Receipt`); `SCS-013` Check-Levels for Exceptions; `SCS-015`/`SCS-039` commission calculation;
`SCS-016` Costing Control Settings (`CFG-COSTING-*`); `SCS-018` Customer Rewards; `SCS-038` General System
Control Settings (`Signature Capture`, `Delivery Scheduling/Mapping`); `SCS-050` Notifications Control
Settings; `SCS-053` Payment Card and Device Settings; `SCS-060` Quick Sale Control Settings; `SCS-065`/`SCS-066`
route capacity and mapping; `SCS-067` Sales Analysis Report Control Settings (`Periods of Data Retention`);
`SCS-070` Service Control Settings; `SCS-072` Special Order Control Settings; `SCS-073` Stock Reservation
Settings; `SCS-087` Zero-Cost Exception Handling; Advanced Product Settings (`Direct Ship`, `PO from Order
Entry`, `Default Kit Selling Price`, selling price); Advanced Vendor Settings (auto-fill days hierarchy);
Group Settings / Category Settings (restocking fee, discount GL accounts); Sales Tax Settings
(`Validate Tax Rate`); Sales Discount Settings; Reason Code Settings; Room Settings; Delivery Settings /
Per Piece Settings / Delivery Company Settings; Logistical Route Settings; Route Capacity Settings;
`Maintain Transfer Schedule Period Days`; Schedule a Process (`Completed Order Purge`, `Completed Transfer
Purge`, `Customer Activity Log`, `Customer Purge`, `Move Captured Data for Event Detection`); End-of-Day
(`Generate Daily Reports`) and End-of-Month (`Generate Monthly Reports`); Sales Security / Logistics
Security / Extended Security permission catalog in `parts/user-security-CATALOG.md`.
**[REUSE]** `CFG-INV-VENDORMODEL`, `CFG-INV-RESERVEBY`, `CFG-POS-QTYERR`, `CFG-POS-RTNDAYS`,
`CFG-POS-AUTOSCHED`, `CFG-SO-*`, `CFG-COSTING-*`, `CFG-WHINV-*`, `CFG-LOC-*`.

**Build notes.**
- This one screen is **at least eight of our configuration domains**. Do **not** reproduce it as one page.
  Split into: `order-numbering`, `fulfillment-defaults`, `credit-policy`, `retention`, `delivery-charges`,
  `atp-and-reservations`, `transfers`, `commissions`, `margin-exceptions`, `documents`, `pricing-and-discounts`.
- **Universal rule for our implementation: no setting may use blank/null to mean a behavior.** Every
  tri-state becomes an explicit enum plus an optional value — e.g. retention becomes
  `{mode: 'keep_forever' | 'purge_after', days: int}`; limits become `{unlimited: bool, max: int}`. A blank
  numeric input must be an unset value that blocks save, never an instruction.
- **All retention/purge settings become soft-delete + archive**, with a mandatory
  "you are about to permanently affect N records" preview, a permission, and an `RPT-AUDIT` entry per run.
  **Never allow a retention change to take effect on the next period close without an explicit confirmation.**
- **Model the check-level enum once** (`Do Not Alert` | `List on Exception Report` | `Warning Messages` |
  `Security Override`) and reuse it everywhere; STORIS re-declares it a dozen times on this screen.
- **Make "required" mean required.** Replace every "a warning message is displayed" enforcement
  (`Require Audit Text on *`, `Require Phone Number for …`) with a real block plus an explicit,
  permissioned, reason-coded override.
- **Implement most-specific-scope-wins** for the settings STORIS resolves ad hoc: product → location →
  system for minimum GP and price variance; product → vendor group → vendor category → vendor → system for
  auto-fill days; location → system for max subtotal discount, restrict-scheduled-date, receipt printing.
  This is exactly the resolver already specified in the Inventory pack.
- **Do differently — numbering:** never derive a document number from another document's number plus a line
  number. Use opaque ids with a separate human-readable reference; keep the location as a separate column,
  not a string prefix.
- **Do differently — `Auto Adjust Stock on Take With`:** do not ship it. If a take-with cannot be sourced,
  the sale blocks; a stock adjustment is a separate, permissioned, reason-coded, audited transaction.
- **Do differently — default customer email:** forbid a system-wide default email address entirely. If email
  is required, require a real one; if it is optional, leave it null.
- **Do differently — commission on delivery:** the `Profit` formula can go negative. Clamp at zero and alert.
- **Do differently — `Prorate Returned Warranties`:** clamp the prorate percentage to `[0,1]`.
- **Do differently — return window:** `CFG-POS-RTNDAYS` must apply even without an original order number
  (fall back to the customer's purchase history, or require an override).
- **Do differently — self-dealing:** `Prevent Users from Accessing Their Own Account` is **on, always**, and
  the attempt is logged. It should not be a preference.
- **Keep:** the ATP source-selection decision table; the reserved-quantity-allocates-to-earlier-dates rule;
  the discount-ordering options (but surface the resulting total in a preview); the `%token%`-style
  templating; the `Variance from Retail` daily report; the "cannot inactivate/one-per-order" cardinality rules.
- `[DECISION NEEDED]` LA Mattress fulfillment model — single delivery per order or multiple concurrent
  fulfillments? A very large fraction of this screen exists only to manage multi-fulfillment orders.
- `[DECISION NEEDED]` Layaway: keep or drop. If dropped, ~8 settings and one mutual exclusion disappear.
- `[DECISION NEEDED]` Commission model — the four calculation methods are genuinely different systems.
- `[DECISION NEEDED]` Retention policy per data class, with legal/tax input. STORIS's defaults (blank =
  destroy) are actively hostile and we must not inherit them.
- `[DECISION NEEDED]` Do we sell protection plans / memberships? Roughly 15 settings depend on it.

---

### `SCS-055` POS Bar Code Control Settings
*storis_ref: article 15186502239636*

**Purpose.** Preferences for Point-of-Sale bar code processing — printing **labels** and **hang-tags** used by
POS scanning — and, oddly, the master switch for the **Cash Drawer** function.

**Where it lives.** `System Administration > System Settings > Customer System Settings > POS Bar Code Control
Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Cutter Installed` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Set if a cutter unit is installed on the bar code printer in use. |
| `Local Print Driver` | Driver file name (searchable list) — **(LOCKED - STORIS access ONLY!)** | "The name of the driver file that controls the bar code printer." |
| `Use Cash Drawers` | Checkbox | Activates the Cash Drawer function. **"If you check the box, the `Cash Drawer ID Number` field on the Log In screen becomes active"** and is used to specify which drawer the logging-in user is assigned. **[CONFLICT] — the cash-drawer master switch has no business being on a bar-code screen; it belongs with `SCS-012` Cash Balancing Control Settings, and it gates `Enter Cash Amount Tendered` in `SCS-054` and the "cash balancing by cashier" mode that inactivates `Point of Sale User Verification`.** |
| `Warehouse List` | Multi-select locations (Action button → `Multiple Location Selection` screen) | "Specify one or more warehouses to which you want to apply these label settings." **"The locations you specify here are referenced by the `Price Change List`."** **[TRISTATE] risk — the article does not say what an empty list means (all locations, or none). Content gap.** |

**`Hang Tag Settings`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Name` | Program name — **(LOCKED - STORIS access ONLY!)** | "The name of the program responsible for the creation of hang-tags." A code-level hook exposed as a setting. |
| `Continuous Stock` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Checked if hang-tag stock is on a continuous roll; blank if labels feed individually. |
| `Form` | Enum: **`Plain`**, **`Form`**, **`Custom`** | `Plain` — plain white stock. `Form` — "standard label stock with pre-printed lines and boxes to separate the print information". `Custom` — "Select this option if STORIS has created a unique print routine for your specific needs." |

**`Label Settings`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Name` | Program name — **(LOCKED - STORIS access ONLY!)** | "The name of the program responsible for the creation of POS labels." |
| `Continuous Stock` | Checkbox — **(LOCKED - STORIS access ONLY!)** | **The article's help text for this field says "If your HANG-TAG stock is on a continuous roll" — copy-paste error in the source; it should refer to label stock. [CONFLICT].** |
| `Form` | Enum: **`Plain`**, **`Form`**, **`Custom`** | Same three options as hang-tags. |

**Behavior & rules.**
- **Six of the nine fields are STORIS-locked** — a customer cannot change printer plumbing or the print
  program names. That means label format changes are a support ticket.
- **The `Name` fields expose program identifiers as configuration**, i.e. the print routine is selected by
  name at runtime. **Do not reproduce this pattern** — it is arbitrary code selection by string.
- Bar code inclusion on POS labels is controlled from a *different* screen: `Barcode on POS Labels` in
  `SCS-054` (Printed Documents page). **[CONFLICT]/split responsibility.**

**Dependencies.** `SCS-010` Bar Code Add-On Settings, `SCS-011` Bar Code Control Settings (part A);
`SCS-012` Cash Balancing Control Settings; `SCS-054` (`Barcode on POS Labels`, `Enter Cash Amount Tendered`,
`Point of Sale User Verification` inactivation under cash balancing by cashier); Warehouse/Store Location
Settings (`CFG-LOC-*`); `Price Change List`; the Log In screen (`Cash Drawer ID Number`).

**Build notes.**
- New IDs: `CFG-BARCODE-POS-CUTTER`, `CFG-BARCODE-POS-DRIVER`, `CFG-CASH-DRAWERS-ENABLED`,
  `CFG-BARCODE-POS-LOCATIONS`, `CFG-BARCODE-HANGTAG-{PROGRAM,CONTINUOUS,FORM}`,
  `CFG-BARCODE-LABEL-{PROGRAM,CONTINUOUS,FORM}`.
- **Move `CFG-CASH-DRAWERS-ENABLED` to the cash-management domain** where it belongs, and reference it from
  POS. Do not inherit STORIS's placement.
- Label/hang-tag layout should be a **template asset** (a named, versioned layout definition) rather than a
  program name plus a three-value `Plain/Form/Custom` enum. `Custom` meaning "the vendor wrote you a bespoke
  routine" is not a configuration value we should ever ship.
- `[DECISION NEEDED]` Are there cash drawers at LA Mattress registers at all? If not, `Use Cash Drawers`,
  `Enter Cash Amount Tendered`, and the cash-balancing-by-cashier interactions all fall away.

---

### `SCS-056` Product Auto-Numbering Exclusion Ranges
*storis_ref: article 15186501109012*

**Purpose.** Defines numeric ranges that the standard STORIS **product automatic numbering** process must
skip — typically to reserve blocks of product IDs for a purpose (imports, a vendor block, legacy SKUs).

**Where it lives.** `Inventory Control Settings > General Tab > Next Product Number Field > Action Button`
— a sub-screen of `SCS-043`, reached from the Action button on the `Next Product Number` field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Start` | Integer **`0`–`9,999,999,999`** | Start of an excluded range. **"The start number must be equal to or less than the end number."** |
| `End` | Integer **`0`–`9,999,999,999`** | End of an excluded range. **"The end number must be equal to or greater than the start number."** |
| Grid — `Start` | Read-only | Existing exclusion ranges. |
| Grid — `End` | Read-only | — |
| Grid — `Remove` | Action | "Click `Remove` to delete any numeric ranges that you no longer want excluded from the automatic numbering process." |

**Behavior & rules.**
- **"The product ID range must be numeric"** — so exclusions can only be expressed over the numeric portion
  of the ID space; alphanumeric product codes cannot be excluded.
- **A single ID is excluded by entering the same number in both fields** (`100` through `100`).
- **"Any number of ranges"** may be entered — no documented cap.
- **[GUARDED] — removing an exclusion range immediately makes those IDs eligible for auto-assignment.** If
  the range was reserved for an integration or an incoming import, the ERP will begin issuing IDs that the
  external system also intends to use. **The article documents no check for overlap between ranges, no check
  against already-issued product IDs, and no warning on removal.**
- **[CONFLICT] — the article does not say what happens if the `Next Product Number` currently sits inside a
  newly added exclusion range.** Content gap; must be defined.

**Dependencies.** `SCS-043` Inventory Control Settings (`Next Product Number` — the parent field);
product creation routines; `Import Data > Product` and any vendor catalog import (`SCS-051`);
`SCS-062`-adjacent auto-numbering behavior in `SCS-054` (`Next Point of Sale / Service Transaction` skips
the letters `O` and `I` — a different kind of exclusion, inconsistently modelled). **[CONFLICT]** — two
different exclusion mechanisms for two different id spaces.

**Build notes.**
- New ID: `CFG-PRODUCT-NUMBER-EXCLUSIONS` — a list of `{start, end}` closed intervals.
- **Do differently:** validate on save that (a) ranges do not overlap each other, (b) the current next-number
  cursor is not inside any range (auto-advance it if it is, and say so), and (c) removing a range warns if
  any ID inside it is already in use. Log adds/removes to `RPT-AUDIT`.
- **Prefer a different design entirely:** rather than excluding ranges from a shared sequence, give each
  origin (manual, import, integration, vendor catalog) its **own** namespace or prefix. Range reservation on
  a single global counter is a 1990s pattern that fails silently.
- `[DECISION NEEDED]` Does LA Mattress use meaningful/structured SKUs? If SKUs are assigned by merchandising
  rather than auto-numbered, this screen has no analogue.

---

### `SCS-057` Product Configurator Control Settings
*storis_ref: article 15186452992916*

**Purpose.** Chooses the **string format** used to build the *configured vendor model* that is stamped onto an
order line, a purchase order line, and the inventory piece for a configured (made-to-order) product.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System Settings
> Product Configurator Control Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Configured Vendor Model Format` | Enum — exactly three values, with the article's own examples verbatim | **`Code`** → `PROD1 SIZE:M123;COLOR:B5;FAB:L`<br>**`Description`** → `PROD1 Size:Medium;Color:Blue;Fabric:Velour`<br>**`Concatenate Codes`** → `PROD1 M123B5L7` |

**Behavior & rules.**
- **The choice propagates into three different records** — order line, PO line, and **inventory piece** —
  so it is effectively part of the identity of configured stock.
- **[IRREVERSIBLE in practice / [GUARDED]]:** the article says nothing about existing data, but since the
  configured vendor model is *stored* on lines and pieces, **changing the format produces a permanently mixed
  population**: pieces created before the change carry the old format, pieces after carry the new. Matching a
  returned piece to a PO line, or a physical tag to a record, then requires knowing when it was created.
  **Flagged as a silent data-consistency hazard.**
- **Delimiter hazard, verbatim:** "**STORIS recommends that you do not use colons (`:`) and/or semi-colons
  (`;`) in the description when building option types, options and fabrics, as this may cause confusion when
  viewing the configured vendor model.**" **A recommendation, not a validation — the format is a delimited
  string with no escaping.** The `Concatenate Codes` example (`M123B5L7`) is **not parseable at all**: without
  delimiters, codes of variable length cannot be split back into option values. **Flagged.**
- Note the `Concatenate Codes` example introduces a fourth code (`L7`) not present in the other two examples
  (`FAB:L` / `Fabric:Velour`) — the source examples are inconsistent.

**Dependencies.** `SCS-047` Micro*D PreVue and `SCS-051` Order Line Import Control Settings (the other
configurator paths); `SCS-072` Special Order Control Settings; option type / option / fabric master tables;
Advanced Product Settings; PO lines; **PIN (Piece INventory)** records — see the as-is/floor-sample PIN
writes in `SCS-054`. **[REUSE]** `CFG-INV-VENDORMODEL` — this is the configured variant of that concept.

**Build notes.**
- New IDs: `CFG-CONFIGURATOR-MODEL-FORMAT` (enum `code` | `description` | `concatenated`).
- **Do differently — do not store a formatted string as the identity of a configured product.** Store the
  configuration as **structured data** (`{option_type_id: option_id, …}`) on the line and the piece, and
  render the display string on demand from the current format preference. That makes the format setting a
  pure presentation choice, reversible at any time, and eliminates the delimiter and mixed-population
  problems entirely. This is the single most valuable "do it differently" in this article.
- If a printed/scanned representation is needed, generate a **canonical, escaped, versioned** encoding
  (or just a hash/id) alongside the human-readable string.
- `[DECISION NEEDED]` Does LA Mattress sell configured products (custom sizes, fabric/firmness options)?
  Mattress retail commonly does have size/firmness/base options, so **this one is likely in scope** even
  though the other configurator articles are not.

---

### `SCS-058` Purchasing Control Settings
*storis_ref: article 15186502233492*

**Purpose.** All purchasing-system preferences: PO numbering, PO retention, vendor search filtering, PO→SO
linkage, replenishment calculations, receiving rules, PO hold policy, EDI acknowledgement handling, and PO
print options.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System Settings
> Purchasing Control Settings`. **`Actions` button → `Quick Purchase Order Settings` (`SCS-059`).**

> **Vendor warning, verbatim:** "**Many system control settings have powerful effects on your system and thus
> are accessible by STORIS personnel only. Consult your STORIS representative before attempting to edit any
> of these fields.**"
> "Purchase Orders and Return To Vendor transactions are printed via **Enhanced Laser Forms**."

**Fields — top section**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Next Purchase Order Number` | Integer, **up to seven digits** — **(LOCKED - STORIS access ONLY!)** | Seed for sequential PO numbering; `Enter a Purchase Order` increments by one per new PO. **"STORIS suggests allowing the system to assign numbers."** **[TRISTATE]: "To require your users to MANUALLY assign purchase order numbers to new purchase orders, LEAVE THE FIELD BLANK."** Interacts with `ENTRY - Allow Manually Entered Purchase Order Numbers` and `NUMBERING - Add Location Prefix…`. |
| `Days to Keep Voided Purchase Orders` | Days | **[DESTRUCTIVE]** Days voided POs remain before **purging by the End-of-Month process**. **No blank/zero behavior documented — [TRISTATE] risk; compare `Voided Orders` in `SCS-054`, where blank means "destroy at the first EOM".** |
| `Days to Keep Closed Purchase Orders` | Days — **default `180`** | **[DESTRUCTIVE]** Retention of closed POs. **The definition of "closed" DEPENDS ON ANOTHER SETTING: "If TPA (third-party accounting) is active, a purchase order is classified as 'closed' once all items have been received AND the purchase order has been AP APPROVED IN FULL. If TPA is not active, a purchase order is classified as 'closed' once all items have been received."** **Turning TPA on or off therefore silently changes which POs are eligible for purging. [GUARDED].** |

**`Vendor Class for Vendor Search`** — "**As these fields are mutually exclusive, entry of a value in either the `Include` or `Exclude` text box CLEARS any previously entered values in the other text box.**"

| Field | Type | Purpose / business rule |
|---|---|---|
| `Include` | Vendor class code(s), multi-select | Vendor classes included in the `Vendor Name Lookup` search; defaults into the `Vendor Class` field there. **Mutually exclusive with `Exclude`, and setting one silently wipes the other.** |
| `Exclude` | Vendor class code(s), multi-select | Vendor classes excluded. Same mutual exclusion. |

**Fields — continued**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Product Reports Sort` | Enum: **`Model Number`**, **`SKU Number`** | **[REUSE] `CFG-INV-VENDORMODEL`.** "If you set this field to (vendor) `Model Number` but the Product record contains no vendor model number, the report prints the **product number appended by two asterisks (`**`)**." (identical rule to `Sort Report By` in `SCS-054`) |
| `Daily Exceptions Cost Change Percent` | Percentage | Threshold for the **End of Day Exception report** "to calculate the difference between **last purchase order cost** and **current purchase order cost**." **This is the vendor-price-increase detector; set too high, cost creep goes unreported. [REUSE] `CFG-COSTING-*` family.** |
| `Sales Order Linkage Access` | Enum — five values | Access to the **`Purchase Order Reservations Screen`** (linking sales order lines to open POs during order entry): **`Prohibit`** — no access. **`Automatically`** — the screen appears on `Add` **if insufficient quantity exists**, and the Action button at `Quantity Ordered` is activated. **`Manually`** — only the Action button at `Quantity Ordered` is activated; **"If set and the `Assignment Required` checkbox in Special Order Control Settings is UNCHECKED, you can assign a vendor ship-from for an existing special order line to be used when a purchase order is created on an existing sales order."** **`Automatically if no Qty`** — the screen appears on `Add` **only if NO quantity exists** for the selected delivery date. **`Dropped/Discontinued Only`** — appears on `Add` if insufficient quantity **and** the product's purchase status is `Dropped` or `Discontinued`; **"Otherwise, an ERROR message appears and you cannot continue."** |
| `New Product Creation` | Checkbox pair: **`Product Settings (Quick)`**, **`Advanced Product Settings (Full)`** | Which version of the Product file appears when creating products on-the-fly in Purchase Order Entry. |
| `Preset Discounts` | Checkbox | Checked → the **`Purchase Order Discounts Window`** displays on initial entry of each new PO line when automatic discounts exist (from **Advanced Vendor Settings**), letting the buyer verify/change/add discounts. Blank → **"the system applies the pre-set discounts AUTOMATICALLY when you add the items to the order"** with no display. **Blank means silent application of vendor discounts — an invoice-matching risk.** |
| `Purchase Order Type Default` | PO type (FK, active types only) | Default PO type on new POs. **The PO type carries `Include in Supply Calculation`, which governs Net PO (`SCS-048`) — so this default silently determines whether new POs count as supply.** |
| `Purchase Order Shipping Type Default` | Shipping type (FK) — optional | Default for `PO Shipping Type` in `Enter a Purchase Order`. **"The selection made at this field ALSO establishes the value used for purchase orders created on-the-fly in `Enter a Sales Order`."** Codes come from `Purchase Order Shipping Type Settings`. |
| `Days to Pad Auto Reallocation` | Days | Used with the **Inter-Regional Auto Transfers** feature. When the feature finds no inventory at a location on the Auto Transfer List, it looks for open POs at that location and decides whether the PO will arrive in time; if so it creates an auto transfer from the PO's receiving location to the original order's stock location. This field pads for receiving-and-prep time. **Formula (verbatim): `acceptable date = scheduled delivery date – (delivery lead days + auto schedule days + auto reallocation pad days)`.** |
| `Report Open to Buy Department Type` | Enum: **`Product Category/Group`**, **`Region/Buying Group`** | Dimension used by `Report Open To Buy Information`. |
| `Sales Rate Replenishment Calculation` | Enum: **`Written Units`**, **`Delivered Units`** | Basis for the sales rate in **Automatic Purchase Order Replenishment**. **Formula (verbatim): `Total Units Sold / Number of Weeks`.** "STORIS references this field when determining your total units sold **and also when calculating average units sold for the two defined periods**." **Written vs delivered materially changes the buy: written leads demand by the fulfillment lag, delivered lags it.** |
| `Vendor Rebate Chargeback Method` | Enum: **`Vendor Receivable`**, **`Accounts Payable`** | `Vendor Receivable` → creates a vendor receivable open item, debiting **Vendor Receivable** for the vendor's portion of the rebate. `Accounts Payable` → creates an **AP credit bill**, debiting **Accounts Payable**. **A GL-posting decision. Cross-references `SCS-052` (`Paid Pending Bill Reimbursement Method`, same enum shape) and `SCS-084` Vendor Receivables Control Settings. [CONFLICT] risk — two screens choose between the same two subledgers for different flows; they should be consistent.** |

**Fields — the `Type - Description` group** (a long list of prefixed, categorized flags)

| Field | Type | Purpose / business rule |
|---|---|---|
| `AS-IS RECEIVING - Single P/O Transfers` | Checkbox | Checked → on receiving As-Is inventory the system looks for a transfer already created **for that purchase order**; found → add to it, else create a new one, so **"each transfer that is created contains only inventory received against a SINGLE purchase order."** Blank → a transfer may contain inventory from **multiple** POs (limited to POs associated with the As-Is receiving process); the process tries same-PO transfers first, then other transfers created by this process, then creates a new one. |
| `BACK ORDER REPLENISH - Comprehensive Replenishment` | Checkbox | Affects `Replenishment Type` in `Replenish Inventory for Current Backorder Needs`. **Checked → `Comprehensive Replenishment` is defaulted AND IS THE ONLY AVAILABLE OPTION.** Unchecked → options are **`Allocated Order Replenishment` (default)** and **`Stock Level Replenishment`**. **A checkbox that removes two choices from a downstream screen.** |
| `DELIVERY DATE/DIRECT SHIP - Calculate in Acknowledge a Purchase Order` | Checkbox | Checked → in-transit days are used when calculating delivery/shipping dates in `Acknowledge a Purchase Order`: updating `Shipping Date` auto-recalculates `Delivery Date` using in-transit days from **Vendor Settings or Vendor Ship-From Settings**. Unchecked → the two dates are independent. **EDI interaction: "If using EDI, the shipping and delivery date fields may be pre-populated … via an EDI acknowledgement. If this setting is checked, those fields are OVERRIDDEN using the in-transit calculation when manually changed."** |
| `DIRECT SHIP - Place Direct Ship Purchase Orders on Hold` | Checkbox | Assigns Hold status to direct-ship POs. **"Users cannot transmit purchase orders on Hold until the Hold status is MANUALLY removed."** **"This field OVERRIDES the setting at the `PO Submission from Order Entry` field on the Miscellaneous tab."** |
| `EDI - Allow Acknowledgment to Adjust Order Quantity` | Checkbox | **[DANGEROUS]** Enables in-transit quantity updates via the **EDI-856 Ship Acknowledgement**. Rules, verbatim: if existing in-transit quantity **matches** the ship quantity → no update; if **different** → **"the in-transit quantity is REPLACED with the ship quantity"**; **"the purchase order quantity ordered is UPDATED with the ship quantity"**; the line's in-transit quantity becomes the ship quantity. Notification: **STORIS Messenger emails to the buyer with PO number, product ID, line number and quantity change**; PO comments updated. **This lets a VENDOR'S EDI message rewrite our ordered quantity with no approval step. The only control is an after-the-fact email.** |
| `ENHANCED LASER PRINT - Print Buyer's Copy` | Checkbox | Print a buyer's version of the PO. |
| `ENHANCED LASER PRINT - Print Domestic Addendums` | Checkbox | Print addendums for domestic POs. |
| `ENHANCED LASER PRINT - Print Import Addendums` | Checkbox | Print addendums for imported POs. |
| — group rule — | | **"If you enable one or more of the following options, the documents print AUTOMATICALLY after the purchase order prints, at the SAME PRINTER as the purchase order. These fields are active ONLY if you select `Forms Designer` at the `Purchase Order form` field. STORIS provides a standard version of each … You can copy these forms and customize the copies."** |
| `ENTRY - Allow Manually Entered Purchase Order Numbers` | Checkbox | Provides the option to key a PO number **when auto-numbering is active**. "The `Next Purchase Order Number` field determines whether or not auto-numbering is active." |
| `GENERAL - Activate Buying Group` | Checkbox — **(LOCKED - STORIS access ONLY!)** | **Hard rule: "all products added to a purchase order must contain a buyer and they must ALL CONTAIN THE SAME BUYER."** **Trap, verbatim: "If this setting is active, the system does NOT specify a buyer when a purchase order is created from `Replenish Inventory for Current Back Order Needs`; in this case, the purchase order MUST BE RE-ACCESSED in order to specify a buyer, otherwise, the system KEEPS THE PURCHASE ORDER ON HOLD."** — **replenishment silently produces stuck POs.** |
| `GENERAL - Exclude Weekends in Vendor Lead Days` | Checkbox | Checked → lead days are calculated in **business days**, not actual days (10 lead days = 10 business days). **[GUARDED] — "If you CHANGE the setting at this field, ANY EXISTING PURCHASE LEAD DAYS INFORMATION CHANGES ACCORDINGLY."** i.e. toggling it retroactively moves every product's lead time and therefore every ATP date. |
| `GENERAL - Generate Daily Reports Links POs to Sales Orders` | Checkbox | Checked → **EOD automatically links un-reserved sales order lines to open POs** for that product, **"provided the receiving location of the purchase order matches the stocking location of the line item."** **"This field affects STOCK PRODUCTS ONLY and NOT hard kits."** Blank → manual linkage. |
| `GENERAL - Include As-Is Quantities in GMROI Calculation` | Checkbox | Include As-Is average quantity in **GMROI and Inventory Turns** for all reports and inquiries. **Changes every historical turn/GMROI figure the moment it is toggled — no restatement, no flag on old reports.** |
| `LEAD DAYS CALCULATION Override Lead Days if Purchase Order Date is Greater` | Checkbox | Checked → the **ATP Lead Date calculation may EXTEND the lead days** so an existing PO outside the lead window can be counted as a source of supply: "the lead days are extended to the **latest** purchase order's date… the ATP calculation includes sources of supply with dates on or earlier than the extended lead days." Overridable per vendor in **Advanced Vendor Settings**. Blank → no extension. **This makes promise dates elastic in the customer-unfriendly direction: a single late PO can stretch the promised availability of everything.** |
| `NUMBERING - Add Location Prefix to the Purchase Order Number` | Checkbox | Prefixes the alphanumeric **`Location Prefix`** (from Warehouse/Store Location Settings) to auto-generated PO numbers. **"You can use this prefix feature ONLY when you auto-assign purchase order numbers (`Next Purchase Order Number` must contain a value)."** With manual entry also allowed, the prefix applies **only to auto-numbered new POs** and prefixes "based on the default location specified in the `Receive At` prompt". **[IRREVERSIBLE per document]: "once you auto-assign a new PO number that includes the location prefix, THE PO NUMBER CANNOT BE CHANGED by selecting a different `Receive At` location."** |
| `PRINT - Prompt the User Within Enter a Purchase Order` | Enum: **`Don't Ask User`**, **`Ask the User`** | `Don't Ask User` → printing requires the separate `Print a Purchase Order` routine. `Ask the User` → on Save the `Print a Purchase Order` screen appears (**"except for orders on hold"**), offering print or email. |
| `PURCHASE STATUS - Product can be 'Dropped' with Open POS Quantity` | Checkbox | Allows setting `Purchase Status` to **`Dropped (D)`** in Advanced Product Settings even when open order quantity exceeds quantity on hand **plus** PO quantity. Blank → the change is blocked. |
| `PURCHASE STATUS - Product can be 'Discontinued' with Open POS Quantity` | Checkbox | Same for **`Discontinued (T)`**. |
| `PURCHASE STATUS - Include Incoming PO's when Determining Availability for Dropped and Discontinued Products` | Checkbox — **default unchecked** | Checked → availability for including `D`/`T` items on sales orders and transfers **adds incoming PO quantities** to the current available quantity. |
| `RECEIVING - Supply Purchase Orders must be Received` | Checkbox | Checked → **supply items (non-stock, e.g. office supplies)** can be received, partly or fully, via `Receive a Purchase Order`, using the same rules as merchandise. **Hard exclusion list even when checked (verbatim): "you CANNOT receive supply item orders in `Receive a Purchase Order with a Separate Freight Bill`, `Receive without a Purchase Order`, `Assign Purchase Orders to a Bar Code Receiving Batch`, `Receive a Purchase Order Using a POS Scanner`."** |
| `SALES RATE REPLENISH - Replenish Orderable Products` | Checkbox | Include **"orderable"** products in Automatic PO Replenishment. Definition, verbatim: "**Orderable products are products and kit components for which the `PO From Order Enter` field has been enabled in the Advanced Product Settings or Product Kit Settings.** The Auto PO Replenishment process EXCLUDES orderable products unless you check the box." |
| `SALES RATE REPLENISH - Include Store Stock Availability in Calculations` | Checkbox | Checked → store stock counts toward available quantities in replenishment. Blank → **"the system includes ONLY WAREHOUSE inventory."** **Blank systematically over-buys by ignoring stock sitting in stores.** |
| `SALES RATE REPLENISH - Utilize standard rounding for Recommended Order Quantity` | Checkbox — **default unchecked** | Applies to the `Required` and `Additional Required` columns of the **`Items for Replenishment Screen`** (after `Replenish Stock Inventory Based on Sales Rate`). **Checked → standard rounding: "2.1 through 2.4 round DOWN to 2.0, while 2.5 through 2.9 round UP to 3.0"** for both columns. **Unchecked (default) → `Required` rounds ANY decimal UP ("2.1 and 2.8 both round up to 3.0"), and `Additional Required` rounds anything below 0.5 to ZERO ("0.4 would round to 0") and everything else UP.** **The default is a systematic over-buy on the `Required` column and an asymmetric rule on the other. Flagged — this is a real inventory-dollars setting hiding as a rounding preference.** |
| `SPECIAL ORDERS - Allow Electronic Transmission of POs During Sales Entry` | Checkbox | Allows transmitting special-order POs to vendors from Sales Order Entry. **"Active only if the `Set Purchase Orders to Hold` field is NOT checked."** |
| `SPECIAL ORDERS - Place Purchase Orders Created on-the-Fly on Hold` | Checkbox | Assigns Hold to POs created on-the-fly in order entry; **"Users cannot transmit purchase orders on Hold until the Hold status is manually removed via the `On Hold` field in `Enter a Purchase Order`."** **"Active only if the `PO Submission from Order Entry` field is not checked."** **Unconditional overrides, verbatim: "REGARDLESS of the setting at this field, for FOREIGN VENDORS, the system places on Hold ALL purchase orders created via order entry. For EDI VENDORS, the system places on Hold ALL purchase orders EXCEPT when transmitting directly from order entry."** |
| `SPECIAL ORDERS - Use Replacement Cost as a Default` | Checkbox | **[TRISTATE-shaped fallback chain]** for **zero-cost special-ordered products**: checked → use **replacement cost**; "if you check the box and NO replacement cost is found, **the cost defaults to zero**". Blank → the system checks **`Zero Cost Written Retail Percent`** in Special Order Control Settings (`SCS-072`); if a percentage is present it is used to calculate an approximate cost; **"If no percentage appears, the cost defaults to zero."** **Both branches terminate in a zero cost, i.e. 100% gross margin on the line. Cross-reference `SCS-087` Zero-Cost Exception Handling and the `Zero Cost on Direct Shipment` / `Zero Cost Non-Inventory Item` alerts in `SCS-054`.** |
| `VENDOR RETURNS - Calculate Freight` | Checkbox | Calculate freight for the return-to-vendor process. |

**Behavior & rules — the hard ones.**
- **`EDI - Allow Acknowledgment to Adjust Order Quantity` lets the vendor change our PO.** This is the single
  most surprising setting in the article: an inbound EDI-856 rewrites `quantity ordered` on our purchase
  order, and the mitigation is an email to the buyer after the fact.
- **`GENERAL - Exclude Weekends in Vendor Lead Days` retroactively rewrites existing lead-day data.**
- **`Days to Keep Closed Purchase Orders` depends on the definition of "closed", which depends on whether TPA
  is active** — enabling third-party accounting changes what gets purged.
- **`GENERAL - Activate Buying Group` creates stuck, permanently-on-hold POs** out of the replenishment run.
- **`NUMBERING - Add Location Prefix` makes a PO number immutable** once assigned.
- **The rounding default systematically over-orders.**
- **Two "on hold" settings have unconditional vendor-type overrides** (foreign, EDI) that no setting can turn off.
- **`Include`/`Exclude` vendor classes silently wipe each other.**
- **`Sales Order Linkage Access` carries a long, exact eligibility list** for PO↔SO linkage (see below).

**PO↔SO linkage eligibility (verbatim, applies to `Automatic`, `Manual`, and `Dropped/Discontinued Only`).**
Items **cannot** be: on another purchase order; a kit master; as-is; an intangible product; a quote; a take-with
or direct-ship line; a special order product; a one-time-buy product; linked to an auto transfer.
Additionally: "If the status is **ASAP or CWC**, the Advanced Product Settings must be set to fill those status
codes." "If the order is **on credit hold**, the Advanced Product Settings must be set to fill credit holds,
and if the status is **estimated or scheduled**, a delivery date must be assigned and needs to be **within the
fill window**." Plus: "Other conditions must exist for the Purchase Order Reservations Screen to appear."

**Dependencies.** `SCS-048` Net Purchase Order (PO type `Include in Supply Calculation`); `SCS-043` Inventory
Control Settings; `SCS-052` Payables Control Settings (AP approval defines "closed" under TPA; direct-ship AP
bills; `Allowable Cost Variance`); `SCS-080` Third-Party Accounting Control Settings; `SCS-072` Special Order
Control Settings (`Assignment Required`, `Zero Cost Written Retail Percent`); `SCS-059` Quick Purchase Order
Settings (reached from the `Actions` button); `SCS-084` Vendor Receivables Control Settings; `SCS-030` EDI
Control Settings; `SCS-054` (ATP settings, `Create a PO for Back Orderable Stock`, zero-cost alerts);
`SCS-087` Zero-Cost Exception Handling; Advanced Vendor Settings (automatic discounts, in-transit days, lead
day override); Vendor Settings / Vendor Ship-From Settings; Advanced Product Settings (`Purchase Status`,
`PO From Order Enter`, fill flags); Product Kit Settings; Warehouse/Store Location Settings (`Location
Prefix`) — `CFG-LOC-*`; Purchase Order Shipping Type Settings; Forms Designer / Enhanced Laser Forms;
Automatic Purchase Order Replenishment; `Replenish Inventory for Current Backorder Needs`; `Replenish Stock
Inventory Based on Sales Rate`; `Report Open To Buy Information`; STORIS Messenger (`SCS-074`); End-of-Day and
End-of-Month. **[REUSE]** `CFG-INV-VENDORMODEL`, `CFG-INV-RCVCLOSE`, `CFG-COSTING-*`, `CFG-LOC-*`.

**Build notes.**
- New IDs: `CFG-PO-NEXTNUMBER`, `CFG-PO-VOID-RETENTION-DAYS`, `CFG-PO-CLOSED-RETENTION-DAYS`,
  `CFG-PO-VENDORCLASS-FILTER`, `CFG-PO-REPORT-SORT`, `CFG-PO-COSTCHANGE-PCT`, `CFG-PO-SOLINK-ACCESS`,
  `CFG-PO-NEWPRODUCT-FORM`, `CFG-PO-PRESET-DISCOUNTS`, `CFG-PO-TYPE-DEFAULT`, `CFG-PO-SHIPTYPE-DEFAULT`,
  `CFG-PO-REALLOC-PAD-DAYS`, `CFG-PO-OTB-DIMENSION`, `CFG-PO-SALESRATE-BASIS`, `CFG-PO-REBATE-CHARGEBACK`,
  `CFG-PO-ASIS-SINGLE-TRANSFER`, `CFG-PO-BO-COMPREHENSIVE`, `CFG-PO-ACK-INTRANSIT-DATES`,
  `CFG-PO-DIRECTSHIP-HOLD`, `CFG-PO-EDI-ACK-ADJUSTS-QTY`, `CFG-PO-PRINT-{BUYER,DOMESTIC,IMPORT}`,
  `CFG-PO-ALLOW-MANUAL-NUMBER`, `CFG-PO-BUYING-GROUP`, `CFG-PO-LEADDAYS-BUSINESSDAYS`,
  `CFG-PO-EOD-AUTOLINK`, `CFG-PO-GMROI-INCLUDE-ASIS`, `CFG-PO-LEADDAYS-EXTEND-TO-PO`,
  `CFG-PO-LOCATION-PREFIX`, `CFG-PO-PRINT-PROMPT`, `CFG-PO-ALLOW-DROP-WITH-OPEN`,
  `CFG-PO-ALLOW-DISC-WITH-OPEN`, `CFG-PO-DT-INCLUDE-INCOMING`, `CFG-PO-RECEIVE-SUPPLIES`,
  `CFG-PO-REPLENISH-ORDERABLE`, `CFG-PO-REPLENISH-INCLUDE-STORE`, `CFG-PO-REPLENISH-ROUNDING`,
  `CFG-PO-SO-TRANSMIT-SPECIAL`, `CFG-PO-ONFLY-HOLD`, `CFG-PO-SO-USE-REPLACEMENT-COST`,
  `CFG-PO-RTV-CALC-FREIGHT`.
- **Do differently — EDI:** an inbound acknowledgement must **never** silently amend our ordered quantity.
  Model it as a **proposed change** that lands in a buyer queue with accept/reject, and record both the
  original and the acknowledged quantity. Log to `RPT-AUDIT`.
- **Do differently — retention:** same rule as everywhere in this part. Explicit `keep_forever` vs
  `purge_after_n_days`, soft-delete plus archive, previewed and audited. And **do not let a definition
  ("closed") shift underneath a retention rule** — define closure explicitly and version it.
- **Do differently — lead days:** store lead time in a single unit with an explicit calendar
  (`{days, calendar: 'business'|'calendar'}`) so switching calendars is a **presentation/derivation** change,
  not a data rewrite.
- **Do differently — rounding:** make the replenishment rounding rule explicit and symmetric, and show the
  buyer the pre-rounded number. Default to standard rounding.
- **Do differently — zero cost:** never let a line default to zero cost silently. If neither replacement cost
  nor an estimate percentage is available, **block the line** and require a permissioned override with a
  reason. Zero cost is what makes `SCS-087` necessary.
- **Do differently — numbering:** as with `SCS-054`, keep the location as a field, not a string prefix, so a
  `Receive At` change is possible.
- Keep: the PO↔SO linkage eligibility list (it is a genuinely good rule set — encode it as a documented,
  tested predicate); the `Preset Discounts` verification window (and **default it to shown**); the
  daily cost-change exception report.
- `[DECISION NEEDED]` EDI with vendors — yes/no, and if yes, who approves quantity changes.
- `[DECISION NEEDED]` Replenishment model: sales-rate replenishment vs allocated-order vs stock-level. These
  produce very different buying behavior and only one should be the default.
- `[DECISION NEEDED]` Buying groups / buyer-per-PO — a real constraint if merchandising is split by category.

---

### `SCS-059` Quick Purchase Order Settings
*storis_ref: article 15186452991252*

**Purpose.** Settings for the **`Enter Quick Purchase Orders`** process — which PO types are usable there,
which one defaults, an optional inventory-formation filter, and whether the resulting POs are held.

**Where it lives.** `Purchasing Control Settings > Global Action` — a sub-screen of `SCS-058`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Purchase Order Types Available` | Multi-select PO types (FK) — **mandatory** | PO types usable in this process. **"The entry must be an existing Purchase Order Type and DEFAULTS TO THE `Standard` TYPE prior to specifying."** Search button → `Purchase Order Types Available` window; extra Action button → `Multiple Purchase Order Selection Window`. |
| `Quick Purchase Order Type` | PO type (FK) — **mandatory** | The type that defaults into the `Purchase Order Type` field in `Enter Quick Purchase Orders`. **Hard validation: "This entry MUST BE SPECIFIED in the `Purchase Order Types Available` field."** |
| `Inventory Formation` | FK — **optional, defaults to null** | "Specifies the Inventory Formation to **limit product availability**." Search button → `Inventory Formation` window. Extra Action button offers: **`Create New Inventory Formation`** (via Inventory Formation Settings) and **`Maintain Assigned Inventory Formation`** (edit via Inventory Formation Settings). **[TRISTATE]: null = no restriction on which products can be quick-ordered.** |
| `Place Purchase Orders on Hold` | Checkbox — **default unchecked** | Checked → **all** POs created in `Enter Quick Purchase Orders` are put on hold. |

**Behavior & rules.**
- **Referential integrity is enforced between the two mandatory fields** — the default type must be a member
  of the available set. Good; keep it. **The article does not say what happens if a type is later removed
  from `Purchase Order Types Available` while it is still the `Quick Purchase Order Type`. Content gap.**
- **`Place Purchase Orders on Hold` defaults OFF**, meaning a "quick" PO can be transmitted to a vendor
  without any review step. **Given that quick entry exists precisely to skip steps, the safe default is ON.**
- The PO type chosen here carries `Include in Supply Calculation` (see `SCS-048`), so **the quick-PO default
  type silently decides whether quick POs count as supply** in Net PO and ATP.

**Dependencies.** `SCS-058` Purchasing Control Settings (parent); `SCS-032` Enter Quick Purchase Orders
(part A); PO Type table; `Inventory Formation Settings`; `SCS-048` Net Purchase Order.

**Build notes.**
- New IDs: `CFG-QPO-TYPES-AVAILABLE`, `CFG-QPO-DEFAULT-TYPE`, `CFG-QPO-INVENTORY-FORMATION`,
  `CFG-QPO-HOLD`.
- **Do differently:** default the hold to **on**, and validate on save of the PO-type table that no
  configuration references a type being removed or inactivated (the same "cannot inactivate a code in use"
  rule part A found for legal codes).
- `[DECISION NEEDED]` Is a "quick PO" path wanted at all? It exists to bypass controls; if buying is
  centralized, drop it.

---

### `SCS-060` Quick Sale Control Settings
*storis_ref: article 15186501993236*

**Purpose.** Preferences for **Quick Sale Entry** (a.k.a. Fast Cash) — how much of the normal order-entry
ceremony to skip, what customer data to collect, salesperson defaulting, user verification, and slip-printer
receipt options.

**Where it lives.** `System Administration > System Settings > Customer System Settings > **Fast Cash Control
Settings**`. **[CONFLICT] — the article's title is `Quick Sale Control Settings` but its documented menu path
ends in `Fast Cash Control Settings`. Two names for one screen; the `FAST CASH` form type in Forms Designer
confirms the legacy name.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Automatic Stock Adjustments` | Checkbox | **[DANGEROUS]** "Enable operators to make automatic stock adjustments when **insufficient quantity exists** in the system to fill quick sale orders (**including line items for obsolete products**)." **The quick-sale twin of `Auto Adjust Stock on Take With` in `SCS-054`. Together these two settings let the POS create inventory out of nothing on the two fastest transaction paths.** |
| `Allow Line Discounts` | Checkbox | Allow line discounts on quick sale orders. |
| `Force Line Item Add` | Checkbox | Checked → merchandise lines are automatically added to the grid. Blank → the user clicks `Add` per product, or uses **`Automatically Add Selected Associated Products`**. |
| `Prompt for Telephone` | Checkbox | Prompts for the customer's telephone number during Quick Sale Entry. **"This setting also allows the `Phone Number` field in the `Quick Sale Order Information` window to be EDITED. Otherwise, this field cannot be edited."** |
| `Prompt for Zip Code` | Checkbox | Same shape for zip code, including the edit-permission side effect. **Zip code on a cash sale is a tax-jurisdiction and marketing input, not just a nicety.** |
| `Allow Entry of Salesperson` | Checkbox | Allows specifying a salesperson other than the **House salesperson `ZZZ`**. |
| `Verify User ID During Entry` | Checkbox | Requires user ID and password before creating or editing a Quick Sale. **"Applies to ENTRY routines only, and not to VIEW routines."** Behavior, verbatim: the **`Transaction Entry - User Log In Screen`** appears **immediately after a user specifies a product**; on valid credentials **"those credentials OVERRIDE the log-on user's credentials for the current order so that the current user becomes associated with the order and the current user's SECURITY SETTINGS AND LOCATION RESTRICTIONS (if any) APPLY."** The Order Comments Log records who made changes. **"Once the user saves the order, the log-on user's credentials again take precedence. However, all edits to the order remain associated with the user who made them, and if a user attempts to access that order again, the `Transaction Entry - User Log In Screen` WILL APPEAR, EVEN FOR USERS WHO PREVIOUSLY EDITED THE ORDER."** **"If your system is set for cash balancing by cashier, THIS FIELD IS INACTIVE."** Also appears in `SCS-054` (sales orders, exchanges, returns, dollar adjustments) and `SCS-070` (service orders). |
| `Print Receipt on Slip Printer` | Checkbox | Checked → quick sale receipts print on a slip printer; blank → "quick sales orders print in regular form on regular printers". **Gate for the four fields below.** |
| `Forms Designer` | Checkbox — **requires `Print Receipt on Slip Printer`** | Enables enhanced laser printing for Quick Sale programs. **"To print thermal/slip print version of sales order forms (`FAST CASH` Form Type in Forms Designer), BOTH `Print Receipt on Slip Printer` AND `Forms Designer` settings need to be active."** |
| `Print Product Description on Sales Slip` | Checkbox — **active only if `Print Receipt on Slip Printer`** | Print the product description on the receipt. **A receipt without a product description is a compliance and returns problem.** |
| `Source of Header on Sales Slip` | Enum: **`C – Company`**, **`L - Location`** — **active only if `Print Receipt on Slip Printer`** | Source of the header block on the receipt. |
| `Sales Slip Text` | Free text, **unlimited lines** — **active only if `Print Receipt on Slip Printer`** | Additional text on quick-sale slips. **"Any BLANK LINES you enter in the text box also appear on the sales slip."** **This is where the return policy would live — unlimited, unvalidated free text, with no i18n hook (unlike the `"As Is" Line Item Text` field in `SCS-054`, which does have one).** |

**The salesperson-defaulting truth table (verbatim, four rows).**
Interaction between `Allow Entry of Salesperson` (this screen) and **`Do Not Default Salesperson`** in Point of
Sale Control Settings:

| `Allow Entry of Salesperson` | `Do Not Default Salesperson` | Result |
|---|---|---|
| Checked | Checked | "the `Salesperson` field **activates with no default value**." |
| Checked | Unchecked | "this field activates and either the **House salesperson (`ZZZ`)** or the salesperson defined in the Customer record (if any) default into the `Salesperson` field." |
| Unchecked | Checked | "the `Salesperson` field **de-activates**, the House salesperson (`ZZZ`) defaults in, and **the system IGNORES the setting at the `Do Not Default Salesperson` field**." |
| Unchecked | Unchecked | "the `Salesperson` field de-activates and the House (`ZZZ`) salesperson defaults in." |

> Summary in the article's own words: "**if the `Allow Entry of Salesperson` field is unchecked, the system
> ignores the `Do Not Default Salesperson` and the House salesperson defaults into the `Salesperson` field.**"
> **[CONFLICT] — `SCS-054` documents this as a three-value enum `Sales Order Salesperson Default`
> (`In Customer Settings` / `The Current User` / `Not To Be Defaulted`), but this article calls it a checkbox
> named `Do Not Default Salesperson`. The two articles describe the same setting differently. Resolve before
> implementing.**

**Behavior & rules — the hard ones.**
- **`Verify User ID During Entry` is a genuine identity-swap**, not just a prompt: the verified user's
  **security settings and location restrictions replace the logged-in user's** for the duration of the order.
  That is a privilege-escalation surface *and* a privilege-reduction surface, and it reverts on save.
- **Every order that was ever edited under verification re-prompts forever**, including for the same user.
- **`Automatic Stock Adjustments` is the fastest way to create phantom inventory in the system.**
- **Four printing fields are dead unless a slip printer is configured**, and the receipt content
  (`Print Product Description`) is off by default in the sense that it must be explicitly enabled.
- **`ZZZ` is again a hard-coded magic salesperson code.**

**Dependencies.** `SCS-054` Point of Sale Control Settings (`Do Not Default Salesperson` /
`Sales Order Salesperson Default`, `Auto Adjust Stock on Take With`, `Point of Sale User Verification`,
`Enter Cash Amount Tendered`, discount settings that name the `Enter Quick Sale` fields);
`SCS-012` Cash Balancing Control Settings (cash balancing by cashier inactivates user verification);
`SCS-055` POS Bar Code Control Settings (`Use Cash Drawers`); `SCS-070` Service Control Settings;
Forms Designer (`FAST CASH` form type); Commission Settings and the House salesperson `ZZZ`;
Sales Tax Settings (zip → jurisdiction); `parts/user-security-CATALOG.md` (Sales Security).

**Build notes.**
- New IDs: `CFG-QS-AUTO-STOCKADJ`, `CFG-QS-ALLOW-LINE-DISCOUNTS`, `CFG-QS-FORCE-LINE-ADD`,
  `CFG-QS-PROMPT-PHONE`, `CFG-QS-PROMPT-ZIP`, `CFG-QS-ALLOW-SALESPERSON`, `CFG-QS-VERIFY-USER`,
  `CFG-QS-SLIP-PRINTER`, `CFG-QS-FORMS-DESIGNER`, `CFG-QS-SLIP-{DESCRIPTION,HEADER-SOURCE,TEXT}`.
- **Do differently — do not ship `CFG-QS-AUTO-STOCKADJ`.** Same reasoning as `SCS-054`: an unfillable line
  blocks; a stock adjustment is a separate permissioned, reason-coded, audited transaction.
- **Do differently — user verification:** do **not** swap the effective security principal mid-transaction.
  Model it as **"attributed to" plus an explicit approval record**: the transaction records both the logged-in
  operator and the verifying user, and the *verifying* user's approval is what is audited. Permissions stay
  those of the authenticated session. Feed both identities to `RPT-AUDIT`.
- **Do differently — receipt text:** make `Sales Slip Text` a structured, versioned, translatable template
  (with the return policy as a named block), not unlimited raw text whose blank lines are load-bearing.
  Version it so we can prove what a given receipt said on a given date.
- **Do differently — one salesperson-defaulting model.** Resolve the `SCS-054`/`SCS-060` contradiction into a
  single enum applied to both order types, with quick sale allowed to override only whether the field is
  editable.
- `[DECISION NEEDED]` Does LA Mattress have a genuine cash/fast-sale path (accessories at the register)?
  If yes, the zip-code prompt should be **mandatory** for tax jurisdiction correctness.

---

### `SCS-061` Report Archive Retention Days
*storis_ref: article 15186502232724*

**Purpose.** Purge policy for **archived reports** in the `Review Archived Reports` process, split by report
source (EOM, EOD, everything else) plus a retention window for `Review Print Jobs`.

**Where it lives.** `General System Control Settings > General > Report Retention Days` — a sub-screen of
`SCS-038` reached from the `Report Retention Days` field.

**Fields — all four are [DESTRUCTIVE]**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Report Retention Days` | Integer **`1`–`30`** | "Determines which **`Review Print Jobs`** reports are to be reviewed through the `Review Archived Reports` process." **Odd rule, verbatim: "If this setting is set to LESS THAN 30, NO CHANGE IS MADE during the automatic updates."** — meaning a value below 30 appears to suppress the automatic update rather than shorten retention. **[CONFLICT]/ambiguous; must be clarified before implementing.** |
| `EOM Archive Retention Days` | Integer **`1`–`395`** — **default `395`** | Purges reports with **`Source = EOM`** older than N days. **"Defaults to 395 allowing retention of a full year of `Generate Monthly Reports` (+ one month). This setting also allows the reports to be archived (using the `Download Archive Report` option in `Review Archived Reports`)."** **395 days is the hard ceiling on month-end report history — you cannot keep a two-year comparative.** |
| `EOD Archive Retention Days` | Integer **`1`–`60`** — **default `60`** | Purges reports with **`Source = EOD`** older than N days. "Defaults to 60, allowing **2 months** of daily reports to be saved." **60 days is the hard ceiling on daily report history.** |
| `Other Archive Retention Days` | Integer **`1`–`30`** | Purges reports whose Source is **anything other than EOD or EOM** older than N days. **30 days is the hard ceiling for every other report in the system, including exception reports and the `Variance from Retail` report referenced by `SCS-054`.** |

**Behavior & rules.**
- **All four fields have a hard maximum well below any sensible audit horizon.** There is no
  "keep forever" option and no blank behavior documented — **the minimum is 1, so a report archive can be
  reduced to a single day.** These are not tri-state fields; they are **capped** fields, which is arguably
  worse: **STORIS makes long report retention impossible by design.**
- **This matters more than it looks.** Wave 1 established that **STORIS has no general change-audit log**;
  the only durable evidence of what the system did on a given day is often the archived EOD/EOM report set.
  **Capping that at 60 and 395 days caps the effective audit trail.**
- **Reducing any of these values destroys archived reports at the next purge run**, with no documented
  warning, preview, or permission.

**Dependencies.** `SCS-038` General System Control Settings (parent field `Report Retention Days`);
`Review Archived Reports` and `Download Archive Report`; `Review Print Jobs`; End-of-Day
(`Generate Daily Reports`) and End-of-Month (`Generate Monthly Reports`); `SCS-067` Sales Analysis Report
Control Settings (`Periods of Data Retention`); `SAR-024` Report Secured Decryption Activity; our
`RPT-AUDIT`.

**Build notes.**
- New IDs: `CFG-REPORT-RETENTION-PRINTJOBS`, `CFG-REPORT-RETENTION-EOM`, `CFG-REPORT-RETENTION-EOD`,
  `CFG-REPORT-RETENTION-OTHER`.
- **Do differently — remove the ceilings.** Report archives are cheap; audit gaps are not. Allow arbitrary
  retention with an explicit `keep_forever` option, and set defaults at **7 years for EOM**, **2 years for
  EOD**, **1 year for other**, subject to a records-retention decision.
- **Do differently — move report archives to object storage** with lifecycle policies rather than purging
  inside the ERP, and make the purge a soft, previewed, audited operation like every other retention field
  in this part.
- **Because `RPT-AUDIT` is ours to design, do not let report archives be the audit trail.** Reports are a
  convenience copy; the audit log is the record.
- `[DECISION NEEDED]` Records-retention policy and legal hold. Any legal hold must **suspend** these purges
  outright, which STORIS has no mechanism for.

---

### `SCS-062` Requested Date Calculation
*storis_ref: article 16716821448084*

**Purpose.** Defines how the **requested date** on sales order fulfillments is derived and back-filled when
the `Requested Date Calculation` scheduled process runs — i.e. a bulk mutation of order data driven entirely
by these settings.

**Where it lives.** `Schedule a Process > Select `Requested Date Calculation` process > Select `Global
Actions``.

> **Scope exclusion, verbatim:** "**Layaways and sales quotes are NOT included in the recalculation process;
> they must be converted to sales orders for the request date to be updated.**"

**Fields — `Requested Date +/- Days`** ("Use these settings to update all order fulfillments that **do not
have a requested date assigned**.")

| Field | Type | Purpose / business rule |
|---|---|---|
| `EST/SCH Status Fulfillments` | Integer, nullable, **`-99` to `99`** | **[TRISTATE — and the cleanest four-way example in the section, verbatim]:** **`Null`** → "the requested date is left null"; **`Zero`** → "the requested date is populated **with the fulfillment date**"; **`1 to 99`** → "the requested date is populated as the fulfillment date **plus** the value of the integer"; **`-1 to -99`** → "the requested date is populated as the fulfillment date **minus** the absolute value of the integer, **so long as it is not earlier than the order date**." |
| `ASAP Status Fulfillments` | Integer, nullable, **`0` to `99`** | Same semantics, **but no negative range**: `Null` → left null; `Zero` → fulfillment date; `1 to 99` → fulfillment date plus N. |
| `CWC Status Fulfillments` | Integer, nullable, **`0` to `99`** | Same as ASAP. `Null` → left null; `Zero` → fulfillment date; `1 to 99` → fulfillment date plus N. |

**Fields — `Requested Date Recalculation Selection`** ("Use this setting to update the requested date of
**recently created orders where the requested date falls OUTSIDE of the general rules established above**.")

| Field | Type | Purpose / business rule |
|---|---|---|
| `Order Date Days` | Integer **`1`–`10`**, nullable | **[TRISTATE] + [DESTRUCTIVE]:** **`Null`** → "**no requested dates updated**"; **`1 to 10`** → "the system **recalculates** the order request date for all orders created between the current date minus the integer value entered here." **Worked example, verbatim: "Set `Order Date Days` to 3. If the current date is May 5th, when the scheduled process runs today the request date is recalculated for all orders created between May 2-5."** **This branch OVERWRITES requested dates that already exist — unlike the `+/- Days` group, which only fills blanks. That distinction is easy to miss and is the dangerous part of this screen: a customer-communicated requested date can be silently replaced by a derived one.** |

**Behavior & rules.**
- **Two different write policies live on one screen:** the `+/- Days` group **only fills nulls**; the
  `Order Date Days` group **recalculates (overwrites)** for orders within the lookback window.
- **The negative range exists only for EST/SCH**, clamped so the requested date can never precede the order
  date. ASAP and CWC cannot go negative at all.
- **Null on any of the three status fields means "leave it null"**, not "use a default" — so a partially
  configured screen leaves a mixed population of dated and undated fulfillments.
- **This is a bulk data mutation driven by a scheduler**, and the article documents **no dry-run, no report of
  what changed, and no undo**.
- The requested date feeds delivery-date requirements in `SCS-054` (`Require Either Requested Date or
  Delivery/Pickup Date on Order`) and jeopardy reporting — **so changing these settings changes which orders
  appear to be at risk.**

**Dependencies.** `Schedule a Process`; `SCS-054` Point of Sale Control Settings (`Require Either Requested
Date or Delivery/Pickup Date on Order`, fulfillment statuses `Estimated`/`Scheduled`/`CWC`/`ASAP`,
`Report Delivery Dates in Jeopardy`); `Report Inventory Fill Dates in Jeopardy`;
`Create a User/Group Actions - Sales Security`; `SCS-065`/`SCS-066` routing.

**Build notes.**
- New IDs: `CFG-REQDATE-EST-SCH-OFFSET`, `CFG-REQDATE-ASAP-OFFSET`, `CFG-REQDATE-CWC-OFFSET`,
  `CFG-REQDATE-LOOKBACK-DAYS`.
- **Do differently — separate the two policies into two named jobs**: `backfill_missing_requested_dates`
  and `recalculate_recent_requested_dates`. One fills, one overwrites; they should never share a screen.
- **Do differently — the overwrite job must produce a change report** (order, fulfillment, old date, new
  date) and be runnable in **dry-run** mode. Log the run summary to `RPT-AUDIT`.
- **Do differently — never overwrite a requested date that a human entered.** Distinguish
  `requested_date_source` = `customer` | `derived`, and only recalculate `derived` values. This single field
  removes the entire hazard.
- Model the offsets as `{mode: 'leave_null' | 'use_fulfillment_date' | 'offset', days: int}` — do not encode
  three behaviors in the sign and nullity of one integer.
- `[DECISION NEEDED]` Does LA Mattress capture a customer-requested date distinct from the scheduled date?
  If not, this whole process is unnecessary.

---

### `SCS-063` RetailDeck Control Settings
*storis_ref: article 15186502232340*

**Purpose.** Configures the **RetailDeck** interface — importing vendor "lineup" product data into STORIS,
including which vendor/brand/group new products land under and how selling price is derived from cost.

**Where it lives.** `Actions` button on the **Additional Settings** tab of `Inventory Control Settings`
(`SCS-043`). "If you do not use RetailDeck, you can ignore this file."

> **Activation rule, verbatim:** "To activate the RetailDeck Interface in STORIS, **enter a response at the
> `Import Lineup Every x Hours`** below **and ensure RetailDeck exists on your workstation**. Once the
> interface is active on your workstation, you can import RetailDeck data if you have access via the
> **`Import Products from Retail Deck`** field in the **Extended Security (Sales)**."
> **Note the wave-1 finding applies: Extended Security is a global kill-switch, so that permission is inert
> unless Extended Security is on.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Import Lineup Every x Hours` | Integer (hours), nullable | Refresh interval from client to the server RetailDeck file. "if you set this field to 24, then the next time you access RetailDeck, if the deck hasn't been refreshed for 24 hours, an automatic update occurs." **[TRISTATE] — this field IS the master switch: "If you enter a response at this prompt and RetailDeck exists on the client workstation, you ACTIVATE the RetailDeck interface. If you leave this field BLANK, you INACTIVATE the RetailDeck interface AND ALL THE OTHER FIELDS ON THIS SCREEN."** |
| `Timeout Extraction After x Seconds` | Integer (seconds) | Extraction timeout; the process times out if it has not completed. |
| `Last Import Occurred at` | **Display-only** date/time | When the RetailDeck file was last imported. |
| `Import Deck` | Button | Re-synchronizes RetailDeck from the PC to the STORIS server. **Two behaviors: if RetailDeck IS resident on the local PC, "the program launches the synchronization program"; if it is NOT resident, "the program SETS BACK the date and time to the current system date and time MINUS the interval hours specified above. In this way, the next time a user with RetailDeck on their PC accesses this, an update occurs."** — **clicking a button on a machine without the software silently rewinds a timestamp to force someone else's machine to sync. Flagged as surprising.** |
| `Product Vendor is` | Vendor (FK, searchable) | Vendor assigned to **all** products imported from RetailDeck. **"The Vendor ID from this field is used during the RetailDeck import. If `Update Vendor Quantities` in Vendor Settings is selected, the `Vendor Inventory` records are updated for that vendor and model number."** **"If the `All Vendor Products` setting in Vendor Settings is NOT selected, validation will be run to see if the product already exists in STORIS. If the product does not exist in the standard STORIS database, NO `VENDOR.INVENTORY` RECORD WILL BE CREATED."** — **a silent skip.** |
| `Default Product Brand is` | Brand (FK, searchable) | Fallback brand: **"If RetailDeck's brand does not exist in any brands in STORIS (specified at the `RetailDeck Manufacturer` field in the Brand Settings), the system assigns the brand you specify here."** |
| `Default Product Group is` | Group (FK, searchable) | Fallback group: **"If RetailDeck's 'minor code' does not exist in any groups in STORIS (specified at the `RetailDeck Minor` field in the Brand Settings), the system assigns the group you specify here."** (the article says `Brand Settings` for the group mapping too — likely a doc error for `Group Settings`; **[CONFLICT]**) |
| `Default WMS Group is` | WMS group (FK, `Read-Only Lookup Window`) | **"If WMS is active, new products created from sales order entry MUST have a WMS group specified."** This is the default used when new products are created during order entry. Cross-references `SCS-085` Warehouse Management Control Settings. |
| `Selling Price Markup is` | Percentage, nullable | **[TRISTATE] and financially significant:** "the percentage of the RetailDeck product cost by which to mark up the selling price… the system **adds this percentage to the cost** to create the selling price. **If you enter `0`, the cost and price will be the SAME. If you leave this field EMPTY, the process leaves BLANK all price fields on newly created products.**" **Zero = sell at cost (0% margin); blank = no price at all (product cannot be sold until priced).** |
| `Rounded` | Enum: **`None`**, **`Up`**, **`Down`**, **`Nearest`** | Rounding of the calculated selling price. `None` — no rounding. `Up` — to the higher dollar/cent amount. `Down` — to the lower. `Nearest` — "to the lower or higher dollar/cent amount, whichever is closest to the new number". |
| `to $` | Currency ending value | Used with `Rounded` to set the **price ending**. Worked examples, verbatim: **`4.99` + `Up`** → a calculated `$24.31` rounds to **`$24.99`**; **`.99` + `Down` or `Nearest`** → `$24.31` is lowered to **`$23.99`**. **(The first example is internally inconsistent — "the next highest number that ends in 4.99" from $24.31 would be $24.99 only if the ending is `.99`, not `4.99`. Source error; flagged.)** |
| `XML Tag Name for Cost` | Text (tag name, **without `<` or `>`**) | The XML tag from which cost is extracted in the RetailDeck download file. **Data mapping expressed as a raw string in a settings field.** |
| `Column Name Availability` | Text (XML tag name) | Tag used to obtain quantity availability. **[TRISTATE]: "If it is NOT SET, no quantity information is returned."** **"The return may be either product availability, OR ELSE a Boolean response showing whether or not the product is available, with `1` meaning available and `0` meaning none available."** — **the same field can carry a quantity or a boolean, and nothing distinguishes them; `1` is ambiguous between "one unit" and "available". Flagged as a genuine parsing hazard.** |

**Behavior & rules.**
- **One field (`Import Lineup Every x Hours`) is both a tuning parameter and the feature's on/off switch**,
  and blanking it silently deactivates ten other fields.
- **Pricing on import can silently produce zero-margin or unpriced products.**
- **Brand/group fallbacks mean unmapped vendor data lands in a catch-all bucket** rather than failing —
  merchandising hierarchy quietly degrades over time.
- **The `1`/`0` boolean-or-quantity ambiguity** in `Column Name Availability` is the kind of defect that
  produces wrong availability on the sales floor.
- **Workstation-local dependency** (RetailDeck must exist on the PC), same shape as `SCS-047`.

**Dependencies.** `SCS-043` Inventory Control Settings (parent, Additional Settings tab); Vendor Settings
(`Update Vendor Quantities`, `All Vendor Products`) and the `VENDOR.INVENTORY` file; Brand Settings
(`RetailDeck Manufacturer`, `RetailDeck Minor`); Group Settings; `SCS-085` Warehouse Management Control
Settings (WMS group requirement); Extended Security (Sales) — `Import Products from Retail Deck`;
Advanced Product Settings (price fields); `SCS-051` (the other vendor-catalog import path).
**[REUSE]** `CFG-INV-VENDORMODEL`, `CFG-COSTING-*`.

**Build notes.**
- New IDs: `CFG-RETAILDECK-INTERVAL-HOURS`, `CFG-RETAILDECK-TIMEOUT-SEC`, `CFG-RETAILDECK-VENDOR`,
  `CFG-RETAILDECK-DEFAULT-BRAND`, `CFG-RETAILDECK-DEFAULT-GROUP`, `CFG-RETAILDECK-DEFAULT-WMSGROUP`,
  `CFG-RETAILDECK-MARKUP-PCT`, `CFG-RETAILDECK-ROUNDING-MODE`, `CFG-RETAILDECK-ROUNDING-ENDING`,
  `CFG-RETAILDECK-TAG-COST`, `CFG-RETAILDECK-TAG-AVAILABILITY`.
- **Do differently — separate the enable flag from the interval.** Never let blanking a numeric field turn a
  whole integration off.
- **Do differently — imports must fail loudly.** An unmapped brand, group, or product should land in an
  **exception queue** for a merchandiser to resolve, not be silently defaulted or silently skipped.
- **Do differently — never create a sellable product with a blank or cost-equal price.** Import products in a
  `draft`/`not sellable` state until priced and categorized.
- **Do differently — field mapping belongs in an integration mapping definition** (versioned, testable),
  not in two free-text tag-name settings. And **type the availability response explicitly**
  (`quantity` | `boolean`) rather than inferring it.
- Keep: the price-ending rounding model (`mode` + `ending`) — it is a genuinely useful retail pricing rule
  and we should reuse it generally, not only on import.
- `[DECISION NEEDED]` Is RetailDeck (or any vendor lineup feed) in scope? If not, extract only the
  **rounding model** and the **import-exception principle** and drop the rest.

---

### `SCS-064` Revolving Receivables Control Settings
*storis_ref: article 15186453252116*

**Purpose.** System preferences for **in-house revolving credit** — worksheet access, minimum monthly payment
(MMP) rounding and calculation, master-plan consolidation, credit holds, credit insurance, statement
disclosures, paper statement fees, and payment-estimator defaults.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Revolving
Receivables Settings > Revolving Receivables Control Settings`.
**Page headings: `General`, `Insurance`, `Statement`, `Miscellaneous`.**

> **Vendor warning, verbatim:** "**Many system control settings have powerful effects on your system and thus
> are accessible by STORIS personnel only. Consult your STORIS representative before attempting to edit any
> of these fields.**"

**Fields — `General`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Access Worksheet within Sales Order Entry` | Checkbox | Checked → the **full revolving worksheet**, "which includes **customer credit information**", opens from within entry of sales orders, debit exchanges and service orders (when a revolving plan is added as a deposit or financed payment). Blank → a **shortened worksheet without customer credit information**. **This is effectively a PII/credit-data disclosure control for the sales floor, expressed as a convenience setting.** |
| `Round Payment Up to Next Highest Dollar` | Checkbox | Rounds calculated MMPs **up** to the next whole dollar. **Rounding a consumer-credit minimum payment up is a disclosure-sensitive change (Reg Z); the disclosed MMP must match what is billed.** |
| `Plan Auditing` | Checkbox — **(LOCKED Field – STORIS access only!)** | Checked → revolving auditing is active. **"The audit data that is generated when this box is checked is used ONLY FOR INTERNAL DIAGNOSTIC PURPOSES."** **[DESTRUCTIVE-adjacent] — unchecked, "this audit data is not generated" at all. Combined with wave 1's finding that STORIS has no general change-audit log, the only revolving audit trail is a vendor-locked diagnostic feature that is off unless STORIS turns it on.** |
| `Allow Payment Agreements` | Checkbox — **default unchecked** | Enables the **Payment Agreements** feature for revolving payments. **Hard side effect, verbatim: "When active, extraction numbers `0001`/`0002` require AGREEMENT-BASED MATCHING for EVERY customer on the account, even ones which do not use an agreement."** *(the article renders this note twice, the second time as "even ones **never meant to use** an agreement" — same meaning, different wording).* **[GUARDED] — switching this on changes payment matching for the entire receivable portfolio, not just agreement customers.** |
| `Prompt User to Add New Order Balance to Plan` | Checkbox | Checked → when an order financed with a revolving plan has its balance **increased**, the user is prompted on save (sales order, exchange, or service order) to add the additional balance to the plan. Blank → **"the order is saved with a balance due; credit hold checking applies to the balance due."** **Blank silently leaves an unfunded balance on a financed order.** |
| `Update Customer Credit Date` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Tracks and updates the date a customer establishes credit by carrying a revolving balance. **Feeds credit-history derivations; being vendor-locked means we cannot see or change how "credit established" is dated.** |
| `Charge Back Waived Interest on MMP Balances, Days Overdue` | Checkbox **plus** an integer days entry box | Checked → **waived interest is charged back** to plans that become delinquent, after the specified number of days following delinquency. **[TRISTATE-shaped]: "If you leave the CHECK BOX blank, waived interest is not charged back."** — the checkbox gates, the number delays. **This is a retroactive interest assessment on a consumer account and is one of the most legally sensitive settings in the section: deferred-interest chargeback on delinquency is heavily regulated and must match the disclosed agreement exactly.** |
| `State Regulations Based Upon` | Radio: **`Customer's Store State`**, **`Customer's Bill-to State`** | "Define what location revolving type postings will process from." `Customer's Store State` — the state where the customer's store is located. `Customer's Bill-to State` — the state where the customer resides. **[GUARDED] — this single radio button decides which state's usury, late-fee and disclosure law is applied to a consumer credit account. Changing it re-bases compliance for the whole portfolio.** |
| `Master Plan` | Revolving plan code (FK, searchable) | Designates the **master revolving plan** for all revolving customers. "Once a master plan is specified, the system ensures that a master revolving plan exists for a customer **whenever any revolving plan is created**. If a master revolving plan does not exist for the customer, **the system automatically creates it**." Effect: **"late and other fees are applied to the master plan from subsidiary plans and charges are consolidated for statement printing."** **[IRREVERSIBLE — verbatim: "Following initial entry of a plan code in this field, the field becomes LOCKED and you cannot change it without assistance from STORIS."]** **This is the clearest one-way door in part B.** |
| `Prime Interest Rate %` | Percentage — optional | Prime rate used when calculating interest for **variable rate** revolving plans. **[TRISTATE]: "If you leave this optional field blank, calculations are not based on the prime rate."** **A single global number driving variable-rate consumer interest, with no effective-date history documented — so a rate change silently applies to all future calculations with no record of the prior rate. Flagged.** |
| `Revolving Credit Hold Amount` | Currency — optional | Maximum order amount financeable with a revolving plan. **Exceeding it puts the order on `F1` credit hold.** **[TRISTATE]: "If you leave this field blank, orders with revolving plans do NOT go on F1 credit hold but are subject to other credit holds."** |
| `Dispute Retention Months` | Integer — **mandatory** | **[DESTRUCTIVE]** Months to retain **resolved dispute data, including the associated comments**, before purging **during the month-ending process**. **Billing-dispute records are FCBA evidence; purging them on a configurable clock is a compliance exposure. Mandatory, so there is no "keep forever".** |
| `Sort Reports By` | Enum: **`Store`**, **`Customer`** — **default `Store`** | Primary sort for revolving receivables reports. |
| `Sort Customer By` | Enum: **`Account Number`**, **`Name`** — **default `Account Number`** | Sort of customer data within those reports. |

**Fields — `Insurance`** (credit insurance sold with revolving plans)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Insurance Required` | Checkbox | Checked → insurance is **required on all revolving plans**; the Revolving Worksheet and `Enter a Customer's Revolving Terms & Conditions` **"check this setting and ENFORCE the sale of insurance."** **[GUARDED] + [DANGEROUS]: "If this setting is enabled, all FUTURE revolving plans require insurance. However, if there is an EXISTING plan that does not have insurance and you EDIT the plan via `Enter a Customer's Revolving Terms & Conditions`, INSURANCE MUST BE ADDED to the revolving plan in order to Save your changes."** **So an unrelated edit to an existing plan forces a credit-insurance sale onto a customer who never bought one. This is a tying/compliance problem, not a configuration nicety. Flag hard.** |
| `Prompt For Insurance If Not Added To Revolving Worksheet` | Checkbox | Checked → on Save of the Revolving Worksheet (from `Enter a Sales Order`) with no insurance on the plan, a message reminds the user and **asks if they want to add it now**. **"With this field enabled, a check for insurance is performed EACH TIME the user accesses the revolving worksheet for a plan without insurance and then clicks Save."** **A repeated up-sell prompt for an insurance product, driven by a system setting. Flagged.** |
| `Single Prompt for Insurance Change` | Checkbox — **default unchecked** | Checked → **one** insurance and/or cancellation letter and **one** signature regardless of how many active revolving plans the customer has; **"Once complete, the change in insurance affects ALL ACTIVE REVOLVING PLANS on the customer's account."** **"This setting applies when Signature Capture is active."** Unchecked → a letter **per plan**, with a signature per printing. **Interaction: "If `Revolving Terms and Conditions - Apply Insurance to All Plans` in `Create a User/Group Actions - Receivables Security` is checked and a change is made to an insurance plan, ALL active insurance plans are changed to that selection. If `Single Prompt for Insurance Change` is also checked, users are still only prompted ONCE for a signature and to print one insurance and/or cancellation letter."** **One signature authorizing a change across every plan is a consent-scope problem.** |
| `Default Insurance From Other Plans` | Checkbox | Checked → on a new **pending** plan during worksheet entry, the system checks the customer's other **active** plans (including **delinquent, promotional, import and manual transfers**) for insurance; if found, **"the insurance code from that plan is defaulted to the new pending plan AND THE USER CANNOT EDIT THE INSURANCE on the new plan."** Also **"the `Plan ID` field in `Update Revolving Insurance Plans` becomes a REQUIRED field."** Blank → no default, insurance may be added freely, and **"the `Plan ID` field in `Update Revolving Insurance Plans` MUST BE LEFT BLANK."** **Extra rule, verbatim: "A) If the NEW PLAN EXISTS, no change to the insurance code occurs, regardless of whether or not the current plan has an insurance code. B) If the new plan does NOT exist, either: no insurance code is added if the current plan has no insurance code, or insurance code is added if the current plan has an insurance code."** The code remains editable via `Enter a Customer's Revolving Terms & Conditions`. |
| `Insurance File Format` | Enum — **default `None Selected`** | **The article says "There are TWO format settings available" and then lists THREE: `LOTS` ("Life of the South"), `PREM` ("Premier"), `CSI` ("Central States Indemnity Co.").** **[CONFLICT] in the source.** **"When Central States Indemnity Co (CSI) is selected, ONLY Insurance Plans that apply insurance by `Customer` will be available. Additionally, the CSI insurance file format is LIMITED TO ENROLLMENTS AND CANCELLATIONS."** — a hard coupling to `Apply Insurance By`. |
| `Do Not Default Insurance After Days` | Integer days — optional | Checks the customer's **date of last activity** before defaulting insurance on a pending plan: if last activity is earlier than `current date − N`, **no insurance plan defaults** (the operator may still add it). **[TRISTATE]: "If you leave this field blank, no check for the customer's date of last activity takes place."** |
| `Apply Insurance By` | Enum: **`Plan`** (default), **`Customer`** — **STORIS locked field** | "(Important! This is a STORIS locked field. Contact STORIS for help updating this field and for questions setting up your vendors)". **"By default insurance is applied by the PLAN."** **"When `Customer` is selected, the insurance field is GRAYED OUT and unavailable in the sales order worksheet. The insurance for the revolving plan gets populated on the worksheet based on the `Revolving Insurance` appearing for the customer in `Customer Credit and Scoring Information`."** **[GUARDED] — switching this changes the unit of enrolment for an insurance product that customers already hold, and it gates which `Insurance File Format` values are usable.** |

**Fields — `Statement`**

*`Payment Notification Parameters`* — "Define the following settings to calculate the minimum monthly payment
(MMP) and estimated totals to display in the **`Minimum Payment Warning`** printed on the customer's revolving
statement."

| Field | Type | Purpose / business rule |
|---|---|---|
| `Percentage of Balance to Calculate MMP` | Percentage | "The percentage used to calculate the minimum monthly payment (MMP) **based on the current balance**." |
| `Percentage of Balance to Calculate MMP (Ins)` | Percentage | The same, **for customers with insurance** — a separate, higher-or-lower MMP basis. |
| `APR to Calculate Interest Rate` | Percentage (APR) | "The Annual Percentage Rate (APR) used to calculate the interest rate" **for the statement's amortization illustration**. |
| `Minimum MMP Amount` | Currency | **Verbatim rule: "The calculated MMP will be compared to this minimum MMP amount. If the calculated MMP is LESS, the minimum MMP is used in the amortization calculation AS LONG AS the customer's AR balance is GREATER than the minimum MMP. If the balance is LESS, the AR BALANCE is used as the MMP amount in the calculation."** — a three-branch floor rule. |

> **These four fields drive a REGULATED DISCLOSURE.** The "Minimum Payment Warning" (how long it takes to pay
> off at the minimum) is a **CARD Act-style statement disclosure**. Configuring the percentages and APR
> incorrectly produces a **materially false statement to the consumer**. **This is the highest-consequence
> group of numeric fields in part B.** Flag hard.

*`Paper Statement Fee`* — "To activate paper statement fees, the following fields must be set."

| Field | Type | Purpose / business rule |
|---|---|---|
| `Amount` | Numeric **`0`–`99`** | The paper statement fee. **"This fee is charged during REVOLVING CYCLING."** **[TRISTATE]: `0` presumably means no fee, but the article does not say, and the range starts at 0 — content gap. Charging consumers for paper statements is itself restricted in several jurisdictions.** |
| `GL Account` | GL account (FK) | Account used to track paper statement fees added during the revolving cycle process. |

**Fields — `Miscellaneous`: `Revolving Payment Estimator Defaults`**

> **Scope rule, verbatim:** "The following settings can also be established **by location** using the
> `Revolving Payment Estimator Defaults` settings in Warehouse/Store Location Settings. If settings by
> location were not established, the system uses these global settings. **`Default Option` settings in
> Warehouse/Store Location Settings, if any, TAKE PRECEDENCE over these global settings.**"

| Field | Type | Purpose / business rule |
|---|---|---|
| `Option 1` / `Option 2` / `Option 3` | Revolving plan (FK, dropdown) ×3 | Default plans shown in the corresponding `Option 1/2/3` fields of the **`Revolving Payment Estimator`**. |
| `Allow Changes` (per Option) | Checkbox ×3 | Checked → the defaulted plan **can** be changed in the estimator. Blank → **"the plan defaults in the estimator, but CANNOT be changed."** **Locking the estimator to three plans steers which credit product a customer is offered.** |

**Behavior & rules — the hard ones.**
- **`Master Plan` is a permanent, one-way decision** — once set it is locked and only STORIS can change it,
  and it silently auto-creates master plans for customers.
- **`Insurance Required` retroactively forces insurance onto existing plans at the next edit.**
- **`Allow Payment Agreements` changes payment matching for every customer on the account.**
- **`State Regulations Based Upon` chooses the governing state law with one radio button.**
- **`Charge Back Waived Interest…` retroactively assesses interest that was waived.**
- **`Plan Auditing` is the only revolving audit trail, is vendor-locked, and produces "internal diagnostic"
  data only.**
- **The `Payment Notification Parameters` group drives a consumer disclosure and has no validation.**
- **`Dispute Retention Months` is mandatory** — resolved disputes will be purged, period.

**Dependencies.** `SCS-002` Accounts Receivable Control Settings; `SCS-001` Account Statement Cycling Control
Settings; `SCS-042` Installment Receivables Control Settings; `SCS-044` Legal Code Settings (`Hold
Statements`, `Allow Payments`, bankruptcy/deceased effects); `SCS-014` Collections Processing Control
Settings; `SCS-025` Deferment Fee Table; `SCS-023` Default Due Day Table; `SCS-036` Financing Control
Settings; `SCS-037` General Ledger Control Settings (paper statement fee GL account); `SCS-053` Payment Card
and Device Settings (`Signature Capture`); `SCS-038` General System Control Settings (`Signature Capture`
master flag); `Revolving Payment Plan Settings`; `Enter a Customer's Revolving Terms & Conditions`;
`Update Revolving Insurance Plans`; `Customer Credit and Scoring Information`; `Adjust Revolving Plans`;
Warehouse/Store Location Settings (`Revolving Payment Estimator Defaults`, `Default Option`) — `CFG-LOC-*`;
`Create a User/Group Actions - Receivables Security` (`Revolving Terms and Conditions - Apply Insurance to
All Plans`); month-ending process; the revolving cycling process.

**Build notes.**
- New IDs: `CFG-REV-WORKSHEET-FULL`, `CFG-REV-ROUND-MMP-UP`, `CFG-REV-PLAN-AUDIT`,
  `CFG-REV-ALLOW-PAYMENT-AGREEMENTS`, `CFG-REV-PROMPT-ADD-BALANCE`, `CFG-REV-UPDATE-CREDIT-DATE`,
  `CFG-REV-CHARGEBACK-WAIVED-INTEREST`, `CFG-REV-CHARGEBACK-DAYS`, `CFG-REV-STATE-BASIS`,
  `CFG-REV-MASTER-PLAN`, `CFG-REV-PRIME-RATE`, `CFG-REV-CREDIT-HOLD-AMOUNT`,
  `CFG-REV-DISPUTE-RETENTION-MONTHS`, `CFG-REV-REPORT-SORT`, `CFG-REV-CUSTOMER-SORT`,
  `CFG-REV-INS-REQUIRED`, `CFG-REV-INS-PROMPT`, `CFG-REV-INS-SINGLE-PROMPT`,
  `CFG-REV-INS-DEFAULT-FROM-OTHER`, `CFG-REV-INS-FILE-FORMAT`, `CFG-REV-INS-NODEFAULT-AFTER-DAYS`,
  `CFG-REV-INS-APPLY-BY`, `CFG-REV-STMT-MMP-PCT`, `CFG-REV-STMT-MMP-PCT-INS`, `CFG-REV-STMT-APR`,
  `CFG-REV-STMT-MMP-MIN`, `CFG-REV-PAPER-FEE-AMOUNT`, `CFG-REV-PAPER-FEE-GL`,
  `CFG-REV-ESTIMATOR-OPTION-{1,2,3}`, `CFG-REV-ESTIMATOR-ALLOWCHANGE-{1,2,3}`.
- **`[DECISION NEEDED]` — the big one: does LA Mattress carry its own revolving receivable, or is all
  consumer credit third-party (Synchrony/Wells/Affirm etc.)?** If third-party, **this entire article is out
  of scope** and the relevant screens are `SCS-036` Financing Control Settings and `SCS-079` Third Party
  Finance Application Control Settings. **We should not build in-house revolving credit without a deliberate,
  legally-reviewed decision — it brings Reg Z / Reg B / FCRA / FDCPA / state usury obligations with it.**
- If it **is** in scope, do differently:
  - **Every rate, percentage, and fee must be effective-dated and versioned**, with the value that was in
    force at the time stored on the plan and on each statement. STORIS stores a single current value; that
    makes historical disclosures unreproducible. This is the most important structural fix.
  - **`Insurance Required` must never apply retroactively.** Requirements attach at plan creation; editing an
    existing plan must not force a new product onto the customer.
  - **Remove `Prompt For Insurance If Not Added…`** or make it a single, non-repeating, logged offer with a
    recorded customer response. Repeated system-driven insurance prompts are a UDAAP risk.
  - **Consent must be scoped.** One signature changes one plan unless the customer explicitly authorizes an
    account-wide change; record the scope with the signature.
  - **`Master Plan` must be changeable** with a migration path, not locked forever.
  - **`Plan Auditing` becomes `RPT-AUDIT`, always on**, covering rate changes, insurance changes, fee
    assessments, waived-interest chargebacks, disputes, and plan edits.
  - **`Dispute Retention Months` gets a legal-hold-aware floor** (FCBA/records retention), and disputes are
    archived, never purged.
  - **Validate the disclosure math.** The MMP/APR/minimum group must be covered by tests against a
    known-good amortization, and the statement must render the same numbers that the billing engine uses.
  - **`State Regulations Based Upon` should not be a global toggle.** Determine governing law per account at
    origination, store it on the account, and never re-base it.

---

### `SCS-065` Route Capacity Control Settings
*storis_ref: article 15186453252372*

**Purpose.** Global **delivery-capacity cutoffs by day of week and route type** — stops, pieces/hours,
dollars and volume — plus over-capacity thresholds, stop consolidation, and capacity-log retention.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Logistical System
Settings > Route Capacity Control Settings`. **Tabs: `Sun` – `Sat`, `Settings`.**

> **Four cutoff points may be combined:** number of stops; number of pieces; dollar value of goods being
> delivered; capacity units available on the trucks.
> **Enforcement:** "If you enter an order whose quantities exceed a route's capacity, **a warning message
> appears and you cannot proceed** unless you have access via **`Override capacities when scheduling routes
> that are full`** on the **Logistics** tab of the **Extended Security** settings."
> **Scope/precedence:** "The values you enter here **default into the `Route Capacity Settings` whenever you
> create a NEW route code**… **Cutoff points for individual routes OVERRIDE any global cutoff points you
> specify here.**" And on the day tabs: "These settings here are used **when the Capacities in `Logistical
> Route Settings` are not set (left blank)**."

**Fields — header**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Route Type` | Enum: **`(DL) Delivery route`**, **`(CS) Customer Service route`**, **`(TR) Transfer route`** | The route type whose capacities are being maintained. **The whole screen is scoped by this value — the day tabs mean different things per type.** |

**Fields — `Sun` – `Sat` tabs** (identical field set per day; **"These fields are not mandatory."**)

> **[GUARDED] — the rebuild warning, verbatim:** "**Adjustment to any of the below fields results in a message
> with the option to rebuild the route calendar. If you choose to rebuild the route calendar, the new maximum
> level(s) for ALL route calendars for ALL route types for ALL days are adjusted, INCLUDING MAXIMUM LEVELS
> THAT HAVE BEEN MANUALLY ADJUSTED. If you do NOT choose to rebuild the route calendar, the changes to the
> maximum level(s) are saved but maximum levels for existing routes are not changed. Only route calendars
> created after this adjustment are affected. THIS MAY CAUSE ROUTES TO GO OVER CAPACITY.**"
> **Both answers are damaging: rebuild wipes every manual per-day override, and not rebuilding leaves
> inconsistent capacities that permit over-booking. This is one of the sharpest settings in part B.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Maximum Stops` | Integer, nullable | **[TRISTATE], stated explicitly:** "**To PREVENT deliveries on this day of the week, enter ZERO (0). If you leave this field BLANK for a specific day of the week, the system does not check or monitor that day.**" Worked examples from the article: Saturday `25`; Sunday `0` (no deliveries); Monday blank (no limits). |
| `Maximum Pieces/Hours` | Integer, nullable — **label changes with `Route Type`** | With `Route Type = Delivery`: max **units** delivered that day; `0` = no deliveries; blank = not checked. **With `Route Type = Customer Service` the label becomes `Maximum Hours`**: max **service hours**; `0` = no service hours; **blank = UNLIMITED hours**. **Same [TRISTATE] pattern; note the article says "unlimited" for the CS case and "do not check or monitor" for the delivery case — functionally the same, but worth pinning down.** |
| `Maximum Dollars` | Currency, nullable | Max dollar value of deliveries that day. `0` = prevent deliveries; blank = not checked/monitored. **"This field is NOT ACTIVE when specifying TRANSFER capacities or for CUSTOMER SERVICE routes."** |
| `Maximum Volume` | Numeric capacity units, nullable | Max truck capacity units for the day. **"You can specify the precise cubic feet of the product OR assign units to merchandise… For example, a three-cushion sofa might equal 3 units; a two-cushion sofa might equal 2 units."** `0` = prevent deliveries; blank = not checked. **Hard data dependency: "The Product record contains a `Volume` field… To properly calculate maximum capacity units, you MUST enter a value in this field for the delivery scheduling program."** — **an unpopulated product `Volume` silently makes volume capacity meaningless.** |

> "You can **audit changes to the above fields via the `Track Settings Activity` routine**." — **note this is
> the only settings-change audit mechanism named anywhere in part B, and it is scoped to these fields.**
> Relevant to wave 1's finding that STORIS has no general change-audit log.

**Fields — `Settings` tab**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Warning Message When Over Capacity` | Checkbox | Issues a warning when filing a document that exceeds capacity for any of: **`stops`, `volume`, `weight`, `dollars`**. **Note `weight` appears here but there is no `Maximum Weight` field on the day tabs — [CONFLICT]/gap; weight defaults live in `SCS-066`.** |
| `Consolidate Stops` | Checkbox | Consolidates delivery orders into a **single stop** when two or more share **all four** of: **`delivery route`, `delivery date`, `customer code`, `delivery address` (addresses must match EXACTLY)**. **"when scheduling orders, if you check the `Past Dates` field in the `Logistical Scheduling` routine, the program does NOT consolidate stops."** |
| `Route Capacity Log Retention Days` | Integer **`0`–`99`** — **mandatory**, **default `30`** | **[DESTRUCTIVE] + [TRISTATE]** Days that route capacity entries **for the specified route type** are retained in the **`View Routing Capacity Log`**; older entries are **purged as part of end-of-day**. **`0` is in range and means retain nothing.** **"Entries recorded as part of the `View Routing Capacity Log` process ACCUMULATE QUICKLY and, therefore, may result in a very large file. STORIS recommends regular purging… to prevent any slowdown of your STORIS system."** **Note the retention is per route type, so three different values can exist.** |
| `Unit Capacity Threshold %` | Integer **`0`–`999`**, nullable | Percentage over maximum capacity that **units** may be scheduled on an **open** route. |
| `Dollar Capacity Threshold %` | Integer **`0`–`999`**, nullable | Same, for **dollars**. |
| `Cube Capacity Threshold %` | Integer **`0`–`999`**, nullable | Same, for **cubes**. |

**The threshold semantics (verbatim, and this is a textbook tri-state).**
- A value `1`–`999`: "the order can be scheduled, **provided the percentage over does not exceed the
  percentage in this field**."
- **`0%`**: "**A threshold set to zero (0%) cannot exceed the maximum capacity without requiring an
  override.** Routes nearing maximum capacity continue to show on the calendar."
- **`null` (blank)**: "**A threshold set to null (blank) allows an order of ANY SIZE to be added to the route
  despite going over maximum capacity; a security override is NOT required.**" (and, in each field's own
  text, "the FIRST order that is attempted to be scheduled on a route that exceeds the maximum is permitted
  to be scheduled, **regardless of** the number of units the route exceeds its capacity").
- **In all cases: "if the order puts a route over capacity… but this field allows it to be added to the
  route, THE ROUTE IS THEN CLOSED to further scheduling."**

> **So `0` is the strict setting and blank is the wide-open setting — the exact inversion of the intuitive
> reading, and the inverse of how blank behaves on the day tabs (where blank = unmonitored, which is also
> permissive, but where `0` = forbidden rather than strict).** Flag hard.

**Worked configuration example (verbatim).** "Determine the minimum volume at which the route should be
closed (example **4,800**). Determine the maximum volume that you would allow on the route (example
**5,280**). Set your `Maximum Volume` field to **4,800** and set the `Cube Capacity Threshold` field to
**10%**. In this example, if the current volume is 4,780, the user is allowed to choose the route and bring
the capacity to 5,280 **without requiring override**. Additionally, the route is closed as soon as 4,800 is
exceeded, preventing that route from being chosen."

**Behavior & rules — the hard ones.**
- **Editing any day-tab capacity forces a choice between wiping all manual route-calendar overrides and
  leaving the system able to over-book.**
- **`0` vs blank means the opposite thing on the two halves of this screen.**
- **Volume capacity silently does nothing if the product `Volume` field is unpopulated.**
- **Per-route settings beat these globals**, and these globals are only **copied down** into new route codes
  — the same copy-down-not-inheritance pattern wave 1 found for group permissions. **Changing a global does
  not update existing routes.**
- **Over-capacity enforcement depends on Extended Security being on** (`Override capacities when scheduling
  routes that are full`), which per wave 1 is a single global kill-switch.

**Dependencies.** `Route Capacity Settings` (per-route cutoffs — the override); `Logistical Route Settings`
(`Capacities`, `Cut Off Route __ Days Prior to Scheduled Date`); `Shared Route Capacity Settings`;
`SCS-054` Point of Sale Control Settings (`Route Capacities` group — `Include Non-Inventory`,
`Include Automatic Transfers`, `Require Route Code for Sales Quotes`; Deliveries/Transfers `Status` and
`Quantity`; `Route Closing Period` days); `SCS-066` Route Mapping Control Settings; `SCS-070` Service Control
Settings (CS routes); Product record `Volume` field; `View Routing Capacity Log`; `Logistical Scheduling`
(`Past Dates`); `Rebuild Route Calendar`; `Track Settings Activity`; Extended Security (Logistics tab);
End-of-Day. **[REUSE]** `CFG-LOC-*`.

**Build notes.**
- New IDs: `CFG-ROUTECAP-TYPE-SCOPE`, `CFG-ROUTECAP-{DOW}-{STOPS,PIECES,DOLLARS,VOLUME}` (7×4 per route
  type), `CFG-ROUTECAP-WARN-OVER`, `CFG-ROUTECAP-CONSOLIDATE-STOPS`, `CFG-ROUTECAP-LOG-RETENTION-DAYS`,
  `CFG-ROUTECAP-THRESHOLD-{UNIT,DOLLAR,CUBE}-PCT`.
- **Do differently — the tri-states.** Model each capacity as
  `{mode: 'unlimited' | 'closed' | 'limit', value: number}` and each threshold as
  `{mode: 'strict' | 'unlimited' | 'percent', percent: number}`. Blank must never mean "wide open".
  **Default thresholds to `strict`.**
- **Do differently — live inheritance, not copy-down.** Per-route capacity should be an *override* resolved
  at read time against the global default (most-specific-scope-wins), so changing the global takes effect
  everywhere it has not been overridden and the rebuild dilemma disappears entirely. This is the same fix
  wave 1 specified for group permissions.
- **Do differently — validate the data dependency.** If any route uses volume capacity, warn on products
  with no `Volume`, and report the coverage percentage.
- **Add a `Maximum Weight` day field** or remove `weight` from the over-capacity warning list — the source is
  internally inconsistent.
- **Retention:** `CFG-ROUTECAP-LOG-RETENTION-DAYS` should be floored above 0 and archived rather than purged;
  the capacity log is the evidence for why a delivery was or was not schedulable.
- Keep: the four-way capacity model (stops / units / dollars / volume) — it is a good model; the
  close-the-route-once-exceeded behavior; the exact-match stop consolidation rule (but consider fuzzy address
  matching with confirmation).
- `[DECISION NEEDED]` Does LA Mattress run its own delivery fleet (capacity really matters) or use
  third-party/parcel delivery (in which case `SCS-066` matters more than this screen)?

---

### `SCS-066` Route Mapping Control Settings
*storis_ref: article 15186502470164*

**Purpose.** Defaults and export rules for **third-party routing/mapping interfaces** — stop times, unload
times, default volume/weight, and precisely **which orders, lines, quantities and fields are sent to the
routing provider**.

**Where it lives.** Two documented paths:
`System Administration > System Settings > Customer System Settings > Logistical System Settings > Routing
Interface System Settings > Route Mapping Control Settings`
`System Administration > System Settings > Customer System Settings > Interface System Settings > Route
Interface System Settings > Route Mapping Control Settings`

> **Activation scope, verbatim:** "the **Third-Party Mapping Interface is active ONLY for locations enabled
> via the `Route Map Interface` field on the `Inventory & Logistics` tab in the Warehouse/Store Location
> Settings.**"
> **The defaulting hierarchy** named at the top of the article, most specific first:
> **`Advanced Product Settings` → `Category Settings` → `Route Mapping Control Settings`.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Base Stop Time` | Minutes | "The **minimum** number of minutes required for **every** stop. The system **adds** the stop time you enter here to each stop, **in addition to the specified unload times of each item**." Purpose: "compensate for normal delivery-oriented occurrences or preparation time (for example, **paperwork, waiting for customers, collecting COD moneys**)." **This number multiplies across every stop — it is the single biggest driver of how many stops fit in a day.** |
| `Default Unload Time` | Minutes | "**The LOWEST LEVEL on the hierarchy** the system uses to default the unload time for one item" — i.e. used only when Product and Category have no value. |
| `Default Volume` | Numeric (user-defined unit) | Delivery volume defaulted "**only when delivery volume information is not available from the Product and Category files**". **"The unit of measure you use for volume calculations is user-defined."** **"STORIS recommends that when assigning units of measure, you be CONSISTENT throughout the system."** — **a recommendation, with no validation; mixing cubic feet and "units" silently corrupts every capacity calculation.** |
| `Default Weight` | Numeric | Delivery weight for a single item, defaulted only when unavailable from Product and Category. **(The article's text says "when delivery VOLUME information is not available" for the weight field too — copy-paste error in the source. [CONFLICT].)** |
| `Days to Hold Mapping Exceptions` | Integer **`2`–`12`** | **[DESTRUCTIVE]** Days mapping exceptions are retained; **"The End of Day process DELETES mapping exceptions older than the number of days you specify."** **A 12-day maximum on routing exception history.** |
| `Service Base Stop Time` | Minutes | Minimum minutes for every **service** stop, added to each stop, for "paperwork, waiting for the customer, etc." |
| `Load Address Corrections` | Checkbox | Checked → **"the system automatically updates CUSTOMER HISTORY RECORDS with address corrections from the mapping program."** **[DANGEROUS] — a third-party geocoder silently rewrites customer address data of record. No review, no audit mentioned.** |
| `Include Non-Inventory Dollars` | Checkbox | Send non-inventory dollars to the third-party interface. |
| `Include Fulfillments with Reserved Transfers` | Checkbox — **default blank** | Checked → orders with **linked auto transfers** are exported; **"The process includes ONLY reserved orders with linked auto transfers WHOSE RECEIVING DATE IS PRIOR TO THE DELIVERY DATE."** Blank → excluded. |
| `Pick by Route When Mapping Active` | Checkbox — **(LOCKED - STORIS access ONLY!)** — **default unchecked** | Allows adding orders and transfers to **RF picking without a truck number**. **"However, if adding an order to picking based on the route, the AWM process CANNOT SCHEDULE ITS PICK and it must be picked MANUALLY."** **Verbatim vendor warning: "STORIS Warning! This is NOT the recommended way of processing picks as it could prevent or make more difficult getting pieces that are added to picking to the correct truck. If you choose to use this method… it could cause DATA ISSUES WITH PICKING, AND LEAD TO THE NEED FOR DATA REPAIR BY STORIS."** **"To ensure data integrity, ALL ORDERS MUST HAVE A TRUCK ASSIGNED."** Trucks may be assigned outside the interface via `Enter a Sales Order` or `Logistical Scheduling` — "the preferred method of processing last minute add-ons". **This is the most explicitly self-condemned setting in part B.** |

**`STORIS and Advanced Dispatch Track Interface` group**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Use Order Quantity instead of Delivery Quantity - STORIS ONLY` | Checkbox — **(LOCKED - STORIS access ONLY!)** | Checked → the **order quantity** on the delivery order/exchange line is passed to the STORIS Mapping Interface; blank → the **delivery quantity** is passed. **"The quantity is used in the calculation of the line's EXTENDED PRICE, VOLUME, WEIGHT and UNLOAD TIME, which is also passed to the interface."** **Definitions, verbatim: `Order Quantity` = "Actual order quantity for line item; does not consider reserved or delivery quantity." `Delivery Quantity` = "The line's order quantity, MINUS the line's hold back quantity" OR "the line's SCHEDULED quantity, if a line's scheduled quantity is less than the above quantity" OR "the line's RESERVED quantity, if a line's reserved quantity is less than either of the above quantities."** **"This setting is only used with the STORIS Route Mapping Interface. RouteView, ARC Logistics, and UPC Roadnet mapping interfaces IGNORE this setting."** **Checked systematically over-states truck volume and weight — you will route for goods that are not going on the truck.** |
| `Include Vendor Model Number` | Checkbox — **default CHECKED** | Checked → the **vendor model number** of line items (from Advanced Product Settings) is sent to the third-party routing provider. **"If you uncheck this box… This allows you to PRIVATE LABEL products and SUPPRESS EXPOSURE OF THE VENDOR MODEL NUMBER to a third party."** **[REUSE] `CFG-INV-VENDORMODEL`.** **A competitive-information disclosure control that defaults to disclosing.** |
| `Include Orders on Credit Hold` | Checkbox | Include credit-held **delivery** orders in the routing export. **Hard prerequisite: "In order to use this setting, the `Fill Orders on Credit Hold` setting in Point of Sale Control Settings must be checked."** **Operational warning, verbatim: "Orders must be released from credit hold BEFORE the creation of the manifest; therefore, orders exported for routing MAY NOT MATCH THE MANIFEST unless those that were on credit hold have been released prior to the delivery ticket print and manifest creation. If an order is still on credit hold when the routing information is returned, a message alerts the user… If the credit hold is resolved, THE ROUTE MAPPING INTERFACE MUST BE RUN AGAIN in order to include the order."** **"When checked, all locations using the route mapping interface of STORIS include orders on credit hold in the routing export; locations using Route View, ARC Logistics, and UPS Roadnet are NOT AFFECTED by this setting."** |
| `Include Non-Inventory Lines` | Checkbox | Allows **intangible** line items into the third-party interface: "delivery lines for non-inventory items are added to the order total and sent". **Gates `Suppress Non-Inventory Price and Quantity`.** |
| `Suppress Non-Inventory Price and Quantity` | Checkbox — **default unchecked**; **requires `Include Non-Inventory Lines`** | **"Otherwise, a warning message appears."** Checked → intangible line price and quantity are sent **with their values set to ZERO**. Unchecked → actual price and quantity are sent. **Another third-party disclosure control, again defaulting to disclose.** |
| `Include Unreserved Fulfillments - Advanced Dispatch Track Only` | Checkbox — **default unchecked** | Exports selected **unreserved** fulfillments for routing via **Advanced Dispatch Track**; "**no lines in the order must be reserved** to qualify sending the fulfillment to Dispatch Track". **"This setting only applies to Advanced Dispatch Track, and NOT to any other routing software, INCLUDING LEGACY DISPATCH TRACK."** When checked, `Include Unreserved Orders` in `Run Dispatch Track Mapping Interface` becomes available to include/exclude completely unreserved orders. Unchecked → only fulfillments with **at least one piece reserved** are exported. **"This setting is INDEPENDENT of `Use Order Quantity instead of Delivery Quantity`; these settings can be used together."** |
| `Automatically Complete Unlinked Non-Inventory Lines` | Checkbox — **default unchecked** | **[DANGEROUS]** "When enabled, **Web Completion, Dispatch Track, and EDI 214 automatically complete unlinked non-inventory lines if the fulfillment is completed by the receipt of other merchandise.**" **A remote/third-party signal auto-completes revenue-bearing intangible lines (delivery charges, setup, haul-away) that were never explicitly delivered. Flag hard — this recognizes revenue on services that may not have been performed.** |

**Behavior & rules — the hard ones.**
- **`Load Address Corrections` lets an external mapping provider overwrite customer address history.**
- **`Automatically Complete Unlinked Non-Inventory Lines` lets an external signal complete billable service
  lines.**
- **`Pick by Route When Mapping Active` is documented by the vendor as likely to corrupt data.**
- **Two settings default to disclosing commercially sensitive data to a third party**
  (`Include Vendor Model Number` checked by default; `Suppress Non-Inventory Price and Quantity` unchecked).
- **Provider-specific behavior is scattered through the screen**: several settings apply only to the STORIS
  interface, or only to Advanced Dispatch Track, and are **silently ignored** by RouteView, ARC Logistics,
  UPS Roadnet, and legacy Dispatch Track. **[CONFLICT] — one settings screen governing five interfaces with
  different honored subsets is a maintenance trap.**
- **The credit-hold export can desynchronize the routing plan from the manifest**, and the only remedy is
  re-running the interface.
- **`Days to Hold Mapping Exceptions` caps routing-exception history at 12 days.**

**Dependencies.** Warehouse/Store Location Settings (`Route Map Interface` on Inventory & Logistics,
`Third Party Mapping Software Interface`, `Delivery Active` / `Transfer Active` / `Service Orders`) —
`CFG-LOC-*`; Advanced Product Settings (unload time, volume, weight, vendor model) and Category Settings —
the defaulting hierarchy; `SCS-054` Point of Sale Control Settings (`Fill Orders on Credit Hold`,
`Assign Specific Pieces Event` — *not available if Route Mapping is active*, `Remove Truck Number/Stop Time
when Orders are Removed`, `Generate Parcel Delivery Fulfillments`); `SCS-065` Route Capacity Control
Settings; `SCS-070` Service Control Settings; `SCS-038` General System Control Settings
(`Delivery Scheduling/Mapping`); `SCS-085` Warehouse Management Control Settings (AWM / RF picking);
`SCS-030` EDI Control Settings (EDI 214); `Run Dispatch Track Mapping Interface`; `Logistical Scheduling`;
`Build a Delivery/Service/Transfer Manifest`; `Report Orders Completed via a Remote Process`.
**[REUSE]** `CFG-INV-VENDORMODEL`, `CFG-INV-RESERVEBY`, `CFG-LOC-*`.

**Build notes.**
- New IDs: `CFG-ROUTEMAP-BASE-STOP-MIN`, `CFG-ROUTEMAP-DEFAULT-UNLOAD-MIN`, `CFG-ROUTEMAP-DEFAULT-VOLUME`,
  `CFG-ROUTEMAP-DEFAULT-WEIGHT`, `CFG-ROUTEMAP-EXCEPTION-DAYS`, `CFG-ROUTEMAP-SERVICE-BASE-STOP-MIN`,
  `CFG-ROUTEMAP-LOAD-ADDRESS-CORRECTIONS`, `CFG-ROUTEMAP-INCLUDE-NONINV-DOLLARS`,
  `CFG-ROUTEMAP-INCLUDE-RESERVED-TRANSFERS`, `CFG-ROUTEMAP-PICK-BY-ROUTE`,
  `CFG-ROUTEMAP-USE-ORDER-QTY`, `CFG-ROUTEMAP-INCLUDE-VENDORMODEL`, `CFG-ROUTEMAP-INCLUDE-CREDITHOLD`,
  `CFG-ROUTEMAP-INCLUDE-NONINV-LINES`, `CFG-ROUTEMAP-SUPPRESS-NONINV-PRICE-QTY`,
  `CFG-ROUTEMAP-INCLUDE-UNRESERVED-ADT`, `CFG-ROUTEMAP-AUTOCOMPLETE-NONINV`.
- **Do differently — address corrections are a proposal, not a write.** Geocoder corrections land in a
  review queue (or are applied only to the *delivery* address on the fulfillment, never to the customer
  master) with the original preserved and the change logged to `RPT-AUDIT`.
- **Do differently — never auto-complete billable lines from an external signal.** Non-inventory lines
  representing performed services must be completed explicitly, by a person or by a delivery confirmation
  that actually asserts the service happened.
- **Do differently — default to NOT disclosing** vendor model numbers and non-inventory prices to third
  parties; make disclosure an opt-in per provider, documented in the provider contract.
- **Do differently — one integration adapter per provider.** Provider-specific settings belong on the
  provider's own configuration, not mixed into a global screen where most values are silently ignored.
- **Do differently — units.** Define volume and weight with an explicit unit of measure on the field itself
  (`{value, uom}`) and validate consistency, rather than "be consistent throughout the system".
- **Do not implement `Pick by Route When Mapping Active`.** The vendor says it causes data corruption.
- **Retention:** raise `CFG-ROUTEMAP-EXCEPTION-DAYS` well beyond 12 and archive rather than delete.
- `[DECISION NEEDED]` Routing provider selection, and whether we route in-house at all. Also whether delivery
  charges and setup fees (non-inventory lines) are exported and how they are confirmed as performed.

---

### `SCS-067` Sales Analysis Report Control Settings
*storis_ref: article 15186502479380*

**Purpose.** Governs the **sales analysis detail** used by the SABRE Report Manager — how many periods of
written/delivered/register detail are retained, what counts as written business, and how much of a zip code
is captured for geographic analysis.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Sales Analysis
Report Control Settings`. Consumed by `Create a Sales Analysis Report (SABRE Report Manager)`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Sales Analysis Retention` | Integer periods | **[TRISTATE] + [DESTRUCTIVE], verbatim: "Enter the number of periods to maintain written and delivered sales analysis detail records. IF YOU LEAVE THIS FIELD BLANK OR ENTER ZERO, THE SYSTEM COLLECTS NO DATA."** — **blank/zero does not mean "keep forever" and does not even mean "purge"; it means the detail is NEVER COLLECTED, so sales analysis reporting silently returns nothing.** "The End of Month can process purged data that is older than the number of periods specified." |
| `Written Business Retention` | Integer **`1`–`99`** periods — **required**, **default `1`** | **[DESTRUCTIVE]** Periods to retain written business. "**The `Purging Written Business Data` process runs during closing a sales period** and the transactions fall within the desired retention period." **"The purge date is determined by the End of Month date MINUS the purge dates defined."** **The default of ONE period means written-business history is destroyed after a single month unless someone changes it.** |
| `Sales Register Retention` | Integer **`1`–`99`** periods — **required**, **default `1` month** | **[DESTRUCTIVE]** Periods to retain sales register information. **`Purging Sales Register Data`** runs at sales-period close, same purge-date rule. **Same one-period default — the sales register is the transaction-level record of what was sold.** |
| `Include Service in Sales Analysis` | Checkbox | Include customer service in sales analysis reports. |
| `Include Layaways in Sales Analysis` | Checkbox | Include layaways as **written business**. **Non-obvious side effect, verbatim: "When checked, the ORDER DATE OF THE LAYAWAY IS NOT CHANGED when converted to a sales order. When unchecked, THE DATE OF THE ORDER IS UPDATED TO THE DATE OF THE CONVERSION."** **A reporting checkbox that mutates the order date on conversion. "If the order date is changed during a conversion, a comment is written to the Order Comments."** **This shifts revenue between periods and changes commission attribution. Flag hard.** Written business surfaces in: `Create a Sales Analysis Report`, `Data Warehouse`, `EIS`, `Report Written Sales Dollars`, `Report Written Sales by Salesperson`, `View Summary of Sales Activity`, `View Salesperson Activity`. |
| `Dollar-Only Adjustments to Written Business` | Checkbox | Checked → dollar-only adjustments count as **written AND delivered** sales figures. Blank → **delivered only**. "The system **also** includes the adjustments in the **salesperson activity data for written sales figures**." **[CONFLICT] — the last sentence appears to contradict the blank case; verify.** |
| `Country Code` | Country code | The country for which zip-capture is being defined. |
| `Fields to Capture` | Integer (count of zip fields) | **"Enter the number of fields from the country's zip code you want to capture for sales analysis SABRE reports."** Worked example, verbatim: US zip codes have two fields, a 5-digit zip and a 4-digit suffix (`12345-6789`); **enter `1` to capture only `12345`, `2` to capture `12345-6789`.** **A data-minimization control — capturing ZIP+4 is materially more identifying than ZIP5.** |
| Grid — `Country Codes` / `Zip Codes Fields` | Read-only rows | Populated via `Add` after entering a country code and field count. |

**Behavior & rules.**
- **`Sales Analysis Retention` blank = collect nothing.** This is the third distinct meaning of blank found so
  far in part B (others: keep forever, destroy at period close). **A user who blanks it to "turn off purging"
  turns off the entire dataset instead.**
- **Two mandatory retention fields default to one period.** Out of the box, this system keeps one month of
  written business and one month of sales register detail.
- **The purge runs at sales-period close, not at a scheduled job** — so it is tied to the accounting calendar
  and cannot be paused independently.
- **`Include Layaways in Sales Analysis` has a data-mutating side effect** unrelated to reporting.
- **Cross-screen constraint from `SCS-054`:** `Promotional Pricing Retention Period __ Months` "must not be
  less than … the `Periods of Data Retention` field in the Sales Analysis Report Control Settings."
  **[CONFLICT] — that named field does not appear on this screen; the closest is `Sales Analysis Retention`.
  Reconcile the naming.**

**Dependencies.** `SCS-054` Point of Sale Control Settings (`Promotional Pricing Retention Period`,
`Customer Retention Period`, `Completed Orders`); `SCS-021` Data Warehouse Control Settings; `SCS-061`
Report Archive Retention Days; `SCS-015`/`SCS-039` commissions (written vs delivered basis);
`Create a Sales Analysis Report (SABRE Report Manager)`; `Report Written Sales Dollars`;
`Report Written Sales by Salesperson`; `View Summary of Sales Activity`; `View Salesperson Activity`;
EIS; End-of-Month / sales period close; Converting Order Types (layaway → sales order).

**Build notes.**
- New IDs: `CFG-SA-DETAIL-RETENTION-PERIODS`, `CFG-SA-WRITTEN-RETENTION-PERIODS`,
  `CFG-SA-REGISTER-RETENTION-PERIODS`, `CFG-SA-INCLUDE-SERVICE`, `CFG-SA-INCLUDE-LAYAWAYS`,
  `CFG-SA-DOLLAR-ADJ-WRITTEN`, `CFG-SA-ZIP-CAPTURE` (`{country_code → field_count}`).
- **Do differently — separate collection from retention.** "Do we record sales analysis detail at all" and
  "how long do we keep it" must be two settings. Blank must never mean "stop collecting".
- **Do differently — defaults.** Written business and sales register retention default to **at least 36
  periods**, and neither is purgeable below a policy floor.
- **Do differently — never let a reporting flag change transactional data.** Layaway→order conversion date
  behavior is an order-lifecycle rule; make it its own explicit setting
  (`layaway_conversion_preserves_order_date`) and record both dates on the order regardless.
- **Do differently — sales analysis should be derived**, not a separately retained detail file. If the order
  and invoice records are retained, analysis is a query. That removes three retention fields and three purge
  jobs. This is the highest-value simplification in this article.
- Keep: the **zip-capture granularity control** — it is a genuine privacy/data-minimization lever and we
  should generalize it (capture ZIP5 by default; ZIP+4 only where a business case exists).
- `[DECISION NEEDED]` Fiscal period definition, and whether analysis retention should be governed by the same
  records-retention policy as `SCS-061` and `SCS-054`.

---

### `SCS-068` Sales Lead System Control Settings
*storis_ref: article 15186502476820*

**Purpose.** Preferences for the **InTouch CRM** contact-management feature — default activity types,
lead auto-archiving and purging, ownership loss, missed-activity thresholds, lead closure behavior, and a
user-defined field builder for the lead entry screen.

**Where it lives.** `System Administration Settings > System Settings > Customer System Settings > Sales Lead
System Settings > Sales Lead System Control Settings`.
**Tabs: `General`, `Missed Activity`, `Lead Information`, `User-Defined`.**

**Fields — `General`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Default Activity Type for Completed Order` | Activity type code (FK, `Default Activity Type for Invoicing Lookup`) | Activity type stamped on a lead when an invoice affecting it is processed. Suggested setup, verbatim: "create an activity type of `'Sold'` with a description of `'Sold - Invoiced'`." **"If you check the box at the `Close Lead When Order is Invoiced` field on the `Lead Information` tab, the system uses the value in this field as the activity type code in a lead/contact."** (note the Lead Information tab actually names the field `Close Lead When Order is Completed` — **[CONFLICT] in the source**) |
| `Default Activity Type for Adding a Lead` | Activity type code (FK) | Defaults as the `Action/Reason` on `Enter a Sales Lead` for a new lead; overridable. Suggested: `'New'` / `"Added Lead/Contact"`. |
| `Default Activity Type for Adding Comments` | Activity type code (FK) | Used **"when a user OTHER THAN THE OWNER of the sales lead adds comments."** |
| `Default Activity Type for Auto Archive` | Activity type code (FK) — **default `ARCHV` ("Archive Lead")** | Activity type stamped when a lead is moved to history during **auto archive via `Generate Daily Reports`**. |
| `Default Method of Contact` | Method-of-contact code (FK) — optional | **[TRISTATE]: "if you leave it blank users MUST enter a method of contact in Lead/Contact entry rather than accept a default."** |
| `Default Probability of Purchase` | Probability code (FK) — optional | Same shape: blank forces manual entry. |
| `Method of Contact for Laydowns` | Method-of-contact code (FK) | Used "when an invoice for a **lead-tracked product** is created **without a lead ever existing** (that is, a method of contact for **laydowns**)." **A "laydown" is a walk-in sale with no prior lead — this back-fills CRM attribution for it.** |
| `Next Action Days for New Opportunity Lead` | Integer days | Days added to the current date to set the **next contact date for callbacks** when (a) a lead-tracked product was sold and invoiced **and** (b) `Create New Opportunity When Lead is Closed` is checked. |
| `Salesperson Code for Unassigned Contacts` | Salesperson code (FK) | A **phantom salesperson** for unassigned contacts; another salesperson takes ownership by adding their number. **[TRISTATE]: "If this field is left empty, NO Salesperson is listed on an Unassigned Lead/Contact and IT BECOMES ELIGIBLE FOR ASSIGNMENT BY ANY OF THE REASSIGNMENT UTILITIES."** |
| `Auto Archive Reason Code` | Reason code (FK) — **required** | Reason used when a lead is automatically moved to history; **"must already exist in `Lead Reason File Maintenance`."** Example: `ARCHV - EOD ARCHIVE OLD LEADS`. |
| `Auto Archive if Next Activity Date is Past Due More Than` | Integer days | **[DESTRUCTIVE — see below]** Days a **next activity date** may be past the system date before **End-of-Day** copies the lead to history. **Hard rule: "BOTH the next activity date AND the last contact date must be past in order to move the lead to history."** **"Any quotes/layaways associated with this lead WILL BE DELETED if the `Delete Quotes/Layaways when Lead is Closed?` field is set to `'Y'`."** **"The Lead/Contact Salesperson is RE-ASSIGNED to the default salesperson for Unassigned Lead/Contacts."** Worked example, verbatim: next activity date `6/10/2007` with a setting of `10` → during EOD on `6/21/2007` the lead is moved to History and closed. |
| `Auto Archive if Last Contact Date is Past Due More Than` | Integer days | The companion condition; both must be satisfied. |
| `Lose Ownership if Last Contact Date is Past Due More Than` | Integer days | **Verbatim rule: "The system looks at the SYSTEM DATE MINUS THE LAST CONTACT DATE. If the result is GREATER THAN OR EQUAL TO the number of days in this field, AND the Next Activity Date is LESS THAN the system date, the record becomes eligible for reassignment of salesperson by ANY Contact Management staff member, REGARDLESS OF THEIR SECURITY LEVEL."** **"The reassignment is NOT an automatic operation; reassignment must be completed manually."** **A setting that explicitly bypasses the security model — flag.** |
| `Maximum Days Next Contact Date Can Be Past Today` | Integer days | Max days **into the future** the next contact date may be set. Worked example, verbatim: set to `7`, lead created `12/10/2007` → "the Next Contact Date must be less than or equal to **12/18/2007**." **(7 days from 12/10 is 12/17, not 12/18 — the source example is off by one. Flagged: the boundary is ambiguous, inclusive vs exclusive.)** |
| `Purge Lead History After This Many Days` | Integer **`1`–`999`** | **[TRISTATE] + [DESTRUCTIVE]:** days closed leads remain before being **purged by End of Month**; closed leads live in the **`LEAD.HISTORY`** file. **"If this field is NULL (ZERO OR LEFT BLANK), historic leads are NEVER PURGED."** **Note here zero and blank BOTH mean keep-forever — the opposite convention from `Sales Analysis Retention` two articles earlier and from `Sales Quotes` retention in `SCS-054`.** |
| `Purge Contacts With No Active Or Historic Leads` | Checkbox — **default not checked** | **[DESTRUCTIVE]** Uses End of Month to **delete contact records** meeting **all** of: **not linked to a customer record; no active leads; no historic leads on file.** **Interacts with the field above: if lead history is purged first, previously-protected contacts become eligible for deletion at the following month-end. A two-setting chain that quietly destroys marketing contacts.** |

**Fields — `Missed Activity`** (a "scrolling" grid of two fields)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Missed Activity Code and Description` | Activity type code + description | Codes indicating missed-activity actions. **Hard validation: "Each entry is validated against the Activity Type file and the activity type MUST HAVE A CLASS OF `"M"`."** Intended use: "a series of codes, one for activities three days late, another for five days late, another for seven days late." Description displays once the code is entered. |
| `Counts as Missed After These Days` | Integer days | Days before a missed activity is recognized. **"If an activity type is entered, entry of the days is REQUIRED."** |

**Fields — `Lead Information`** — **"The fields on this tab affect ONLY products set up for lead-tracking in the `Product Group Settings`."**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Close Lead When Order is Completed` | Checkbox | Checked → close sales leads **upon invoicing**. Blank → close **when the order is written**. **Both states close the lead; there is no "do not close" option.** |
| `Delete Quotes When Lead is Closed` | Checkbox | **[DESTRUCTIVE]** Checked → **quotes/layaways for the lead/contact are DELETED when the lead is closed.** Combined with auto-archive above, **an untouched lead silently destroys the customer's outstanding quote and layaway at End-of-Day.** **This is the single most dangerous setting in this article.** |
| `Allow Service Order in Lead Maintenance` | Checkbox | Makes the customer service order program accessible from lead maintenance screens. |
| `Create New Opportunity When Lead is Closed` | Checkbox | Creates a new lead with activity type class **"new opportunity"** when a lead/contact is **invoiced completely upon creation**. |
| `Lead Activity Type Code for New Opportunity` | Activity type code (FK) | Must already exist in `Type of Activity Settings`. |
| `Salesperson for Leads from eSTORIS` | Salesperson (FK) | Default salesperson for leads obtained via eSTORIS; must exist in `Salesperson Settings`. **"Active only if eSTORIS is active."** |

**Fields — `User-Defined`** (a mini form-builder; each grid line is a prompt on `Enter a Sales Lead`)

| Field | Type | Purpose / business rule |
|---|---|---|
| `Line Number` | Integer | Grid line for the prompt; **"This number also determines the ORDER on which prompts display on the Sales Leads screen."** |
| `Screen Text` | Text | The prompt label. |
| `Data Type` | Enum: **`Alpha-numeric`**, **`Alphabetic`**, **`Numeric`** | Input type. |
| `Maximum Length` | Integer | Max characters the input field holds. |
| `Number of Decimals` | Integer **`0`–`4`** | Active only when `Data Type` is numeric. |
| `Mandatory` | **`Y`** or blank | "`Y` … require a response from users before they can exit the screen." **A `Y`/blank flag rather than a checkbox — legacy typing.** |
| `Default Value` | Text | Default for the prompt. **"The response you enter here VERIFIES AGAINST the response you enter into the `Filename` field below."** |
| `File Name for Entry Verification` | **STORIS filename** | **"Enter the STORIS FILENAME against which you want to reconcile the entry in the `Default` column."** **[DANGEROUS] — validation is configured by naming a raw internal data file. This is arbitrary data access by string, with no documented restriction on which file may be named. Do not reproduce.** |

**Behavior & rules — the hard ones.**
- **Three settings chain into silent data destruction:** auto-archive (EOD) → `Delete Quotes When Lead is
  Closed` (deletes quotes and layaways) → `Purge Lead History After This Many Days` (EOM) →
  `Purge Contacts With No Active Or Historic Leads` (EOM, deletes the contact). **A customer who was quoted
  and did not buy can be erased end-to-end by four settings, with no notification.**
- **Auto-archive also reassigns the salesperson** to the unassigned phantom, which changes attribution.
- **`Lose Ownership…` explicitly grants reassignment power "regardless of their security level".**
- **Blank/zero conventions are inconsistent with the rest of the section** (here zero = never purge).
- **`File Name for Entry Verification` exposes internal filenames as configuration.**

**Dependencies.** `Type of Activity Settings` (activity types and classes, class `"M"` for missed);
`Lead Reason File Maintenance`; `Product Group Settings` (lead-tracked products); `Salesperson Settings`;
`SCS-033` eSTORIS Control Settings; `SCS-070` Service Control Settings (service order access from leads);
`SCS-054` Point of Sale Control Settings (`Default Email Address` / `Email Address Required` apply to
`Enter a Sales Lead`); `SCS-027` Demographics Control Settings; `Enter a Sales Lead`; `LEAD.HISTORY` file;
End-of-Day (`Generate Daily Reports`) and End-of-Month.

**Build notes.**
- New IDs: `CFG-LEAD-ACTTYPE-{INVOICE,ADD,COMMENT,ARCHIVE,NEWOPP}`, `CFG-LEAD-DEFAULT-CONTACT-METHOD`,
  `CFG-LEAD-DEFAULT-PROBABILITY`, `CFG-LEAD-LAYDOWN-CONTACT-METHOD`, `CFG-LEAD-NEXTACTION-DAYS`,
  `CFG-LEAD-UNASSIGNED-SALESPERSON`, `CFG-LEAD-ARCHIVE-REASON`, `CFG-LEAD-ARCHIVE-NEXTACT-DAYS`,
  `CFG-LEAD-ARCHIVE-LASTCONTACT-DAYS`, `CFG-LEAD-LOSE-OWNERSHIP-DAYS`, `CFG-LEAD-MAX-FUTURE-CONTACT-DAYS`,
  `CFG-LEAD-HISTORY-PURGE-DAYS`, `CFG-LEAD-PURGE-ORPHAN-CONTACTS`, `CFG-LEAD-MISSED-ACTIVITY-RULES`,
  `CFG-LEAD-CLOSE-ON-COMPLETE`, `CFG-LEAD-DELETE-QUOTES-ON-CLOSE`, `CFG-LEAD-ALLOW-SERVICE-ORDER`,
  `CFG-LEAD-CREATE-NEWOPP`, `CFG-LEAD-ESTORIS-SALESPERSON`, `CFG-LEAD-USERFIELDS`.
- **Do differently — never delete a quote or layaway as a side effect of a CRM state change.** Closing a lead
  archives the lead; the quote has its own lifecycle and its own retention rule (`Sales Quotes` in
  `SCS-054`). **Do not implement `CFG-LEAD-DELETE-QUOTES-ON-CLOSE` at all.**
- **Do differently — archive, never purge, contacts.** Contact deletion must be driven by a **privacy/erasure
  request** (a deliberate, logged, verified process), not by an inactivity clock. Note the inverse obligation
  too: CCPA/GDPR-style deletion requests need a *real* erasure path, which this is not (it only deletes
  contacts with no links).
- **Do differently — reassignment respects permissions.** Replace "regardless of their security level" with
  an explicit `lead.reassign` permission plus an eligibility rule.
- **Do differently — user-defined fields** get a real schema (typed, validated, optionally FK-constrained to
  a **named reference list**, never to a raw filename), with i18n on the label and an audit of definition
  changes.
- **Do differently — marketing consent.** Lead records are marketing data; capture and honor consent/opt-out
  state on the contact, and make suppression (see `SCS-044`'s `Do Not Solicit`) authoritative over any CRM
  activity.
- `[DECISION NEEDED]` Is CRM in scope for the ERP at all, or does LA Mattress use a dedicated CRM? If
  external, the ERP only needs to emit lead/sale events and honor suppression.

---

### `SCS-069` Sales Order Reservations
*storis_ref: article 15186501107604*

**Purpose.** Explains **which processes reserve stock to sales orders** and the rules every one of them
follows. Not a settings screen — a rules document that ties several settings together.

**Where it lives.** Not a screen. The behavior is driven by `Inventory Control Settings` (`SCS-043`),
`Advanced Product Settings`, `District and Regional Product Settings`, and `Special Order Control Settings`
(`SCS-072`).

**The four reservation processes (verbatim).**
1. **`End-of-Day` process (`Generate Daily Reports`).**
2. **On-Line Receipts** — "use the **`Online Receipts Reservations`** field in the Inventory Control
   Settings. **STORIS' online fill logic includes stock received by stock transfers in the
   `Complete the Manifest Process` routine.**"
3. **Receipts of purchase orders linked directly to a sales order line item.**
4. **`Enter a Sales Order`** (using **Just-In-Time Inventory** processing).

**Governing settings**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Reserve by Date Type` (Inventory Control Settings) | Enum | **[REUSE] `CFG-INV-RESERVEBY`.** "When determining reservation priority, each process references the `Reserve by Date Type` field in the Inventory Control Settings **as well as the auto-fill days**." **Override hierarchy, verbatim: "You can also establish settings that OVERRIDE the `Reserve by Date Type` field in Inventory Control Settings by using the `Reserve by` field in `Advanced Product Settings` AND/OR `District and Regional Product Settings`."** — a three-level product/district-region/system resolution. |
| `Auto-Fill Days` (`Reserve Product (Auto Fill) __ Days`, `SCS-054`) | Integer | **Hard system limit: "The auto-fill days MAXIMUM IS 999. The system does not reserve any merchandise whose delivery date is MORE THAN 999 DAYS IN THE FUTURE."** |
| `Online Receipts Reservations` (Inventory Control Settings) | Setting | Enables reservation at the moment of receipt, including stock received by stock transfers in `Complete the Manifest Process`. |
| `Assignment Required` (Special Order Control Settings, `SCS-072`) | Checkbox | **"To AUTOMATICALLY reserve special-order items via sales order entry, a check must appear at the `Assignment Required` field in the Special Order Control Settings."** |

**Behavior & rules — hard rules stated in the article.**
- **"All processes that reserve stock follow the same rules."** (a good invariant, worth preserving)
- **Special-order items reserve to sales orders ONLY** on (a) receipt of a purchase order **linked directly
  to a sales order line item**, or (b) **manual** reservation via sales order entry — unless
  `Assignment Required` is checked, which enables automatic reservation at entry.
- **"Inventory that you adjust in via `Enter a Stock Adjustment` reserves to open sales orders during the
  FIRST End-of-Day (`Generate Daily Reports`) process you run following the adjustment."** — **a stock
  adjustment silently commits inventory to orders at the next EOD; it is not available for anything else the
  next morning.**
- **"Dropped or discontinued products must be reserved MANUALLY in Sales Order Entry, REGARDLESS of delivery
  status and/or auto-fill days."**
- **"Reservation rules also apply to Service orders."**
- **The 999-day ceiling is absolute** and is not a setting — an order dated more than 999 days out can never
  hold a reservation. Combined with `SCS-054`'s `Restrict Scheduled Date` (max 999 days) the two limits line
  up, but `Restrict Scheduled Date` can be **null** (unlimited), which allows scheduling an order that can
  never be filled. **[CONFLICT].**

**Dependencies.** `SCS-043` Inventory Control Settings (`Reserve by Date Type`, `Online Receipts
Reservations`, `Reserve ASAP Sales`, `Reserve CWC Sales`, `Layaway in Net Purchase Order`); `SCS-054` Point of
Sale Control Settings (`Reserve Product (Auto Fill) __ Days`, `Fill Layaway Orders`, `Fill Orders on Credit
Hold`, `Daily Auto Release of Stock`, `Unreserve Assigned When Outside Fill Days`,
`Require Manual Updates to Reservations on Exchanges`, `Restrict Scheduled Date`); `SCS-072` Special Order
Control Settings (`Assignment Required`); `SCS-073` Stock Reservation Settings; `SCS-048` Net Purchase Order
(unreserved quantity is the demand term); Advanced Product Settings and District and Regional Product
Settings (`Reserve by`); `Enter a Stock Adjustment`; `Complete the Manifest Process`; End-of-Day.
**[REUSE]** `CFG-INV-RESERVEBY`, `CFG-WHINV-*`, `CFG-POS-AUTOSCHED`.

**Build notes.**
- No new settings IDs — this article documents behavior, not fields. It is the **specification for the
  reservation engine**, and should be treated as such.
- **Keep the invariant: one reservation engine, one rule set, called from every entry point.** STORIS states
  this explicitly and it is the right design. Our implementation should expose a single
  `reserve(order_line, context)` service used by receipt, EOD, order entry, transfer completion, and
  adjustment posting.
- **Do differently — make the 999-day ceiling explicit and validated at order entry**, not a silent
  non-reservation. If an order is dated beyond the horizon, say so when it is scheduled.
- **Do differently — a stock adjustment should not silently commit stock at EOD.** Reservation should happen
  synchronously with a visible result, or be queued with a reviewable preview.
- **Do differently — make reservation decisions explainable.** Every reservation (and every failure to
  reserve) records which rule and which date basis applied. "Why is this order not reserved?" is the single
  most common operational question in furniture retail and STORIS gives no answer.
- Implement `Reserve by` resolution with the standard most-specific-scope-wins resolver:
  **product → district/region → system**.
- `[DECISION NEEDED]` Reservation basis (`CFG-INV-RESERVEBY`) for LA Mattress, and whether special orders
  auto-reserve at entry (`Assignment Required`).

---

### `SCS-070` Service Control Settings
*storis_ref: article 15186453256980*

**Purpose.** Controls the **Customer Service module** — service order statuses and defaults, coordinator
assignment, credit checking, labor and parts pricing, vendor chargebacks for warranty work, and service
scheduling/tickle processing.

**Where it lives.** Two documented paths:
`System Administration > System Settings > Customer System Settings > Sales and Service System Settings >
Service Control Settings`
`System Administration > System Settings > Customer System Settings > Service Control Settings`
**Tabs: `General`, `Parts and Labor`, `Scheduling`.**
"Printing **In Shop Work Order** forms, **In Home Work Order** forms, and **Service Order** forms is done via
Enhanced Laser Forms."

**Fields — `General`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Status for New Orders` | Service status code — **(LOCKED - STORIS access ONLY!)** | Default status when new service lines are entered. |
| `Status for Closed Orders` | Service status code — **(LOCKED - STORIS access ONLY!)** | Default status when service lines are closed (completed). **Hard validation: "This field CANNOT be set to a status code that is set to `Close Without Completion` in the Status Code Settings."** |
| `Deposit Holdback is %` | Percentage | "The percentage of the deposit to **hold back on partially completed service orders**." **A customer-money retention rule expressed as one percentage.** |
| `Keep Status Data for Days` | Integer days | **[DESTRUCTIVE]** Days the system retains **status analysis data** (used for the `Status Analysis Report`) before purging. No blank/zero behavior documented — **[TRISTATE] risk.** |
| `Default Service Location` | Warehouse location (FK) | Default service location. **"Depending on the type of service order, the shipping location, and your Regional Processing settings (if any), the system MAY use this location IF IT CANNOT DETERMINE another service location."** — a last-resort fallback. |
| `Default Service Type` | Enum: **`In-Home`**, **`In-Shop`**, **`Quick In-Shop`** | Referenced when creating a new service document. |
| `Allow Service with no Coordinator` | Checkbox | Checked → a service order may be created with the `Coordinator` field blank (**`None Assigned`**). Blank → a coordinator is mandatory on new service orders (**"Entry of a coordinator is not mandatory on existing pending service orders."**). **Auto-assignment rule, verbatim: "If you check this field and then leave the `Coordinator` field blank when creating the service order, an End-of-Day process AUTOMATICALLY ASSIGNS service orders to coordinators BASED ON AVAILABILITY, REGARDLESS OF THE SERVICE ORDER STATUS."** **Exception: "The coordinator is NOT assigned when FORCING PENDING service orders, created by users WITHOUT SECURITY to create full service orders, regardless of this setting."** — **so a low-privilege user's forced pending order stays permanently unassigned. Flagged.** |
| `Allow Service Order to be Reinstated` | Checkbox | Whether a **merchandise line** on a service order can be reinstated after completion. **"Non-merchandise and stock service order lines are NOT available for reinstatement."** **"The option to reinstate a line closed on ANOTHER service order or on the currently accessed service order is only available if this field is selected AND the user has the required user security."** |
| `Allow Problem Text Change` | Checkbox | Selected → existing **problem description text** may be **changed** (and new text added). Not selected → **users may only ADD problem description text.** **The unchecked state is the audit-friendly one: the customer's reported problem becomes append-only. Checked lets the record of what the customer said be rewritten. Flagged.** |
| `Allow Financing` | Checkbox | Whether service order payments may be financed. |
| `Perform Credit Check` | Checkbox | Whether the system credit-checks customers and puts service orders on credit hold. **"The credit checking is based on the Point of Sale Control Settings"** (`SCS-054` `Credit Check Rules`) — including the `C2`/`C3` hold codes and the `Fill Orders on Credit Hold` reservation interaction. |
| `Verify User ID During Entry` | Checkbox | Same identity-swap mechanism as `SCS-060`: the **`Transaction Entry - User Log In Screen`** appears **immediately after entering the order number for a new transaction**; **"those credentials OVERRIDE the log-on user's credentials for the current order so that the current user becomes associated with the order. Once you save the order, the log-on user's credentials once again take precedence."** **"If your system is set for cash balancing by cashier, this field is inactive."** Also in `SCS-054` and `SCS-060`. |
| `Store Location is Same as Service Location` | Checkbox | Checked → **"the store location is automatically changed to be equal to the service location following entry of the customer"** in `Enter a Service Order`, and further manual changes to the service location also change the store location. **Asymmetric: "If the STORE location is changed INDEPENDENTLY of the service location, the SERVICE location is NOT updated."** **The store location drives revenue and commission attribution, so this silently reassigns the sale. Flagged.** |
| `Verify Labor for In-Home Service Orders` | Checkbox — **default unchecked** | "the existence of labor is verified for the specified Service Order." **"Either one, both, or neither … can be selected."** |
| `Verify Labor for In-Shop Service Orders` | Checkbox — **default unchecked** | Same for in-shop. |

**Fields — `Parts and Labor`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Default Labor Rate Per Hour` | Currency/hour | Default labor **rate** used in Service Order creation **"if the rate cannot be determined from the labor technician's Staff record."** — a technician→system fallback. |
| `Allow Labor Rate Change` | Checkbox | Whether defaulted labor **prices** may be changed in Service Order entry. **"Sales Order exception checking, such as below cost check, variance from retail, etc., WILL APPLY to these changes."** (ties to `SCS-054` Profit and Costs and Pricing pages) |
| `Default Labor Cost Per Hour` | Currency/hour | Default labor **cost** when it cannot be determined **from the labor technician's Staff record OR in the Product record**. **Cost, not price — this drives service margin. [REUSE] `CFG-COSTING-*`.** |
| `Labor Time Increments (hhmm)` | Minutes | **"The MINIMUM labor time, entered in minute increments, to be used in determining labor charges. For example, if set to `10`, any entry for labor time will be ADJUSTED UP to the next 10 minute increment."** **Always rounds up — a systematic upward bias in customer labor charges. Flagged (and it is a disclosed-billing-practice question).** |
| `Minutes Unit of Measure Code` | UOM code (FK) | "The user-defined code that represents minutes. **The code entered here must exist in the `Unit of Measure Settings` file.**" |
| `Hours Unit of Measure Code` | UOM code (FK) | Same, for hours. **Two settings exist because the unit of measure for time is itself user-defined data — a design we should not copy.** |
| `Allow Parts Price Change` | Checkbox | Whether defaulted **parts** prices may be modified. Same Sales Order exception checking applies. |
| `House Vendor Code` | Vendor code (FK) | **"The code of the vendor record that was created FOR THE RETAILER'S OWN COMPANY."** Used as the default when entering a product with an **inventory type of `2` (retail labor), `4` (service labor only), `5` (service charge only), or `6` (non-merchandise service)**. **Note the verbatim inventory-type enumeration — useful for our product-type model.** |
| `Vendor Chargeback Method` | Enum: **`D-Debit Payable`**, **`V-Vendor Receivables`**, **`R-Report Only`** | Reimbursement of parts charges that are a third party's responsibility. `D` → "a **debit AP bill** generates for the third-party vendor **upon completion of this Part line**." `V` → "**Vendor Receivables** updates for the third-party vendor upon completion of this Part line." `R` → "**Neither Payables nor Receivables are posted.** The chargeback information appears only on the **`Vendor Chargeback Report`**." **Availability rules, verbatim: "This field is active ONLY for extended warranties, factory warranties, or warranties from third-party companies, AND if Accounts Payable AND Vendor Receivables modules are BOTH active… If NEITHER module is active, this field is inactive and the system uses the `Report Only` option. If only ONE of those modules is available, this field is also inactive and the system selects the appropriate option."** **"Depending on modules active on your system, the system may reference this field IF a vendor chargeback method has not been specified at the `Chargeback Method` field in the Vendor Settings."** — vendor-level override, system-level fallback. |
| `Payables Hold Code` | AP hold code (FK) — optional | Hold code applied to **AP bills created automatically for completed service orders**; "assigned to ALL AP bills generated automatically from customer service chargebacks (you create a customer service chargeback when you finalize a service order for which the reimbursement method is set to `Debit Payable`)." |
| `On-the-Fly PO's on Hold` | Checkbox | Places on Hold all **"parts" purchase orders created on-the-fly** in `Enter a Service Order`, "so you can review the orders before processing them." |
| `Verify Warranty Expiration` | Checkbox | **"Indicates whether warranty expiration dates should be ENFORCED when assigning responsibility for charges. If the field is NOT selected, THE USER MAY ASSIGN WARRANTY RESPONSIBILITY AFTER THE EXPIRATION DATE."** **[DANGEROUS] — unchecked, the system will bill a vendor or a warranty company for work outside the warranty term. That is a chargeback dispute or worse. Default should be checked; the article does not state a default.** |
| `Auto Adjust Parts on Quick In-Shop` | Checkbox | **[DANGEROUS]** "Enable operators to make automatic stock adjustments when insufficient quantity exists in the system to fill **quick in-shop** service orders (**including line items for obsolete products**)." **The third instance of this pattern (with `SCS-054` `Auto Adjust Stock on Take With` and `SCS-060` `Automatic Stock Adjustments`).** |

**Fields — `Scheduling`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Tickle Processing Active` | Checkbox | Master switch for **Tickle** processing (task/callback reminders). **"If NOT active, service employees will not be notified of any conditions that would cause auto assignment of a task. If this field is not selected, the following THREE fields controlling Customer Calls WILL BE SET TO NULL and will not be active."** **[DESTRUCTIVE — unchecking it NULLS the three dependent values, so re-enabling requires re-entering them.]** |
| `After Last Call Days` | Integer days, nullable | Days to tickle the Coordinator **after the Last Contact Date**. **[TRISTATE]: "Entry of `0` will tickle ON THE EXACT DAY that the tickle process is run. If left NULL, the tickle process will DISREGARD this field."** |
| `Call Customer Days` | Integer days, nullable | Days to tickle the Coordinator **before the Next Contact Date**. **[TRISTATE], and it is the master of the three: "Entry of `0` will tickle THE DAY AFTER the Next Contact Date. For ANY TICKLING TO BE ACTIVE you must have this field set with a value OTHER THAN NULL. If this field is NULL, the tickling process WILL NOT WORK during End of Day processing."** — **so `Tickle Processing Active` being checked is not sufficient; this one field silently disables the whole feature.** |
| `Call Before In-Home Days` | Integer days, nullable | Days to tickle the Coordinator **before the scheduled In-Home service date**. **`0` tickles the day AFTER the scheduled date; null → disregarded.** **Note all three "0" behaviors are off-by-one in different directions.** |
| `Average Travel Time` | Hours | **"Used for route capacity planning. Enter the average amount of travel time (hours) you want to allow to lapse between in-home service calls. The program ADDS the travel time you enter here to scheduled stops."** Interacts with `Service Base Stop Time` in `SCS-066` and `Maximum Hours` in `SCS-065`. |
| `Print Problem on COG Document` | Checkbox | Whether **Problem Description** text prints on COG documents. **Consider what the customer's problem text may contain before printing it on a document that travels.** |
| `Allow Manifest Update from Picking` | Checkbox | Activates the `Update Manifest` field in **Pick List Entry** for **service** manifests. Blank → service manifests must be generated manually. (parallel to the four `Allow Updates To Manifest From` flags in `SCS-054`) |
| `Cut Off Routes Days Prior to Scheduled Date` | Integer days, nullable | **Identical text and identical [IRREVERSIBLE] behavior to `SCS-054`'s `Route Closing Period` fields.** Three-place fallback: `Logistical Route Settings` → this screen (service routes) or Point of Sale Control Settings (delivery routes). **"If you use this feature to close dates, THEY REMAIN CLOSED EVEN IF you access this field again and change the number of days. You can 're-open' the closed dates only by: 1) change the number of days in this field … and then 2) access the dates via `Route Capacity Settings` and change the maximum number of stops for those dates."** **[TRISTATE]: blank in all three routines = feature ignored.** |

**Behavior & rules — the hard ones.**
- **`Call Customer Days = null` silently disables ALL tickle processing**, even with `Tickle Processing
  Active` checked; and unchecking the master **nulls** the three day fields.
- **`Verify Warranty Expiration` unchecked lets staff bill warranty work after expiry.**
- **`Labor Time Increments` always rounds up.**
- **`Store Location is Same as Service Location` silently moves revenue/commission attribution** and is
  asymmetric.
- **`Allow Problem Text Change` lets the customer's reported problem be rewritten.**
- **Auto coordinator assignment runs at EOD "regardless of the service order status"**, but never for forced
  pending orders from low-privilege users — which therefore stay unassigned indefinitely.
- **`Auto Adjust Parts on Quick In-Shop` is the third phantom-inventory switch in this section.**
- **The vendor chargeback method degrades silently** based on which modules are licensed.

**Dependencies.** `SCS-054` Point of Sale Control Settings (credit check rules, `Route Closing Period`,
`Point of Sale User Verification`, pricing exception checks, `Prorate Returned Warranties`);
`SCS-052` Payables Control Settings (AP hold codes, debit AP bills); `SCS-084` Vendor Receivables Control
Settings; `SCS-058` Purchasing Control Settings (parts POs, on-hold rules); `SCS-065` Route Capacity Control
Settings (`(CS) Customer Service route`, `Maximum Hours`); `SCS-066` Route Mapping Control Settings
(`Service Base Stop Time`, service orders in the mapping interface); `SCS-060` Quick Sale Control Settings
and `SCS-012` Cash Balancing (user verification inactivation); `SCS-002` Accounts Receivable Control Settings
(`Service Order Exempt` from minimum deposit rules); `SCS-068` Sales Lead System Control Settings
(`Allow Service Order in Lead Maintenance`); Status Code Settings (`Close Without Completion`);
Unit of Measure Settings; Staff records (technician labor rate/cost); Vendor Settings (`Chargeback Method`);
Warranty Category Settings and warranty registration; Enhanced Laser Forms; End-of-Day.
**[REUSE]** `CFG-COSTING-*`, `CFG-LOC-*`, `CFG-INV-RESERVEBY` (reservation rules apply to service orders per
`SCS-069`).

**Build notes.**
- New IDs: `CFG-SVC-STATUS-NEW`, `CFG-SVC-STATUS-CLOSED`, `CFG-SVC-DEPOSIT-HOLDBACK-PCT`,
  `CFG-SVC-STATUS-RETENTION-DAYS`, `CFG-SVC-DEFAULT-LOCATION`, `CFG-SVC-DEFAULT-TYPE`,
  `CFG-SVC-ALLOW-NO-COORDINATOR`, `CFG-SVC-ALLOW-REINSTATE`, `CFG-SVC-ALLOW-PROBLEM-TEXT-CHANGE`,
  `CFG-SVC-ALLOW-FINANCING`, `CFG-SVC-CREDIT-CHECK`, `CFG-SVC-VERIFY-USER`,
  `CFG-SVC-STORELOC-FOLLOWS-SVCLOC`, `CFG-SVC-VERIFY-LABOR-{INHOME,INSHOP}`,
  `CFG-SVC-DEFAULT-LABOR-RATE`, `CFG-SVC-ALLOW-LABOR-RATE-CHANGE`, `CFG-SVC-DEFAULT-LABOR-COST`,
  `CFG-SVC-LABOR-INCREMENT-MIN`, `CFG-SVC-UOM-{MINUTES,HOURS}`, `CFG-SVC-ALLOW-PARTS-PRICE-CHANGE`,
  `CFG-SVC-HOUSE-VENDOR`, `CFG-SVC-CHARGEBACK-METHOD`, `CFG-SVC-AP-HOLD-CODE`,
  `CFG-SVC-ONTHEFLY-PO-HOLD`, `CFG-SVC-VERIFY-WARRANTY-EXPIRY`, `CFG-SVC-AUTO-STOCKADJ-QUICK`,
  `CFG-SVC-TICKLE-ACTIVE`, `CFG-SVC-TICKLE-AFTER-LASTCALL`, `CFG-SVC-TICKLE-CALL-CUSTOMER`,
  `CFG-SVC-TICKLE-BEFORE-INHOME`, `CFG-SVC-AVG-TRAVEL-HOURS`, `CFG-SVC-PRINT-PROBLEM-ON-COG`,
  `CFG-SVC-MANIFEST-FROM-PICKING`, `CFG-SVC-ROUTE-CUTOFF-DAYS`.
- **Do differently — never null a user's data when a feature is toggled off.** `Tickle Processing Active`
  should disable the feature and preserve the three values.
- **Do differently — `Verify Warranty Expiration` defaults ON**, and assigning warranty responsibility past
  expiry requires a permissioned, reasoned, audited override.
- **Do differently — labor rounding is a stated, disclosed policy**: make the increment and the rounding
  direction explicit (`up` | `nearest`), show the rounded time to the customer, and default to `nearest`.
- **Do differently — problem text is append-only**, always. Corrections are new entries, not edits.
- **Do differently — do not couple store location to service location silently.** If the sale should be
  attributed to the servicing store, make that an explicit, visible attribution field.
- **Do differently — do not ship `CFG-SVC-AUTO-STOCKADJ-QUICK`** (same reasoning as the other two).
- **Do differently — units of time are not user-defined data.** Minutes and hours are fixed; drop the two
  UOM-code settings.
- Keep: the `Close Without Completion` validation on the closed-status field; the three-way chargeback
  method with a vendor-level override; the on-the-fly parts-PO hold (and **default it to on**); the
  inventory-type taxonomy (`2` retail labor, `4` service labor only, `5` service charge only,
  `6` non-merchandise service) — that is a useful, explicit product-type model.
- `[DECISION NEEDED]` Does LA Mattress run in-house service/warranty work (mattress warranty inspections are
  common) or refer everything to the manufacturer? If in-house, the chargeback and warranty-expiry settings
  are load-bearing.

---

### `SCS-071` Shopping Cart Control Settings
*storis_ref: article 15186453256212*

**Purpose.** Settings for the **Shopping Cart** feature — carts that are later converted into sales orders —
separated by entry channel: eSTORIS internet store, in-STORIS `Create/Edit a Shopping Cart`, and the
**eRoam II** iPad application.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Shopping Cart
Control Settings`.
**Tabs listed in the article's header: `General`, `PDA`, `eSTORIS`, `PC/Terminal`, `eRoam` — but the body
says "This routine is separated into FOUR tabs, one for each of the above entry methods" and documents only
`General`, `eSTORIS`, `PC/Terminal`, `eRoam`. The `PDA` tab is named and never documented. [CONFLICT] /
content gap.**

**Fields — `General`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow Changes to Default Price` | Checkbox | Checked → users may change item pricing on the **Merchandise** tab of `Enter a Shopping Cart` **or in the eRoam cart**. Blank → **"users cannot change pricing of a cart item in STORIS or in eRoam II."** **Applies to both STORIS and eRoam II with one switch; note there is no equivalent for eSTORIS (the customer-facing store), where price change is presumably impossible.** |

**Fields — `eSTORIS`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `eSTORIS Shopping Cart Retention Days` | Integer days | **[DESTRUCTIVE]** Days eSTORIS cart data is retained; **purged during End-of-Day**. Worked example: "if you enter `60` here, the system purges all eSTORIS shopping cart data 60 days old or more each time EOD procedures are run." **No blank/zero behavior documented — [TRISTATE] risk.** |
| `Price Change with Lower/Higher Current Price` | Checkbox | Checked → on cart→sales-order conversion **"the system uses the CURRENT price in the system for each product."** Blank → **"the system uses the prices in the shopping cart."** **"This field applies ONLY to shopping carts created on eSTORIS."** **Checked means the price can go UP between the customer adding to cart online and the order being written — the field name says "Lower/Higher" explicitly. That is a customer-facing pricing-integrity decision.** |

**Fields — `PC/Terminal`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Shopping Cart Retention Days` | Integer days | **[DESTRUCTIVE]** Days in-STORIS cart data is retained; purged during EOD. Same 60-day worked example. |
| `Change Price with Lower Current Price` | Checkbox | Checked → on conversion the system **compares** current price with cart price and **"uses the LOWER of the two as a default."** "That is, if the price has been reduced since the quote was issued, the system uses the lower price." Blank → cart price is the default. **[CONFLICT] — this is the customer-favorable variant, while the eSTORIS field above is the "current price wins, up or down" variant. Two channels, two different pricing-integrity policies, differently named. That inconsistency will surface as a customer complaint.** |
| `Costed Line Item Inquiry Uses` | Enum: **`Average Cost`**, **`Replacement Cost`** | Costing method in the **`Shopping Cart Costed Line Item Display`** screen (`Actions` at the bottom of the Merchandise tab). **[REUSE] `CFG-COSTING-*`.** **Note `SCS-054`'s `Sales Margin Scratchpad Cost` offers a third option, `Whichever Cost Is Greater`, which is absent here — [CONFLICT] between two margin-display settings.** |

**Fields — `eRoam`** ("eRoam II is a STORIS application developed for the iPad® and iPad mini®")

| Field | Type | Purpose / business rule |
|---|---|---|
| `Maximum Product Search Results` | Integer — **default `200`** | Caps product search results in eRoam. "When you establish a maximum number of results in this field, you **increase the speed** at which your search results are returned." **A silent truncation: a salesperson may never see a product that exists.** |
| `Maximum Customer Search Results` | Integer — **default `200`** | Same for customer search. **Silent truncation on customer lookup drives duplicate-customer creation — which the `SCS-054` `Customer Search` settings exist to prevent. [CONFLICT] in effect.** |
| `eROAM Shopping Cart Retention Days` | Integer days | **[DESTRUCTIVE]** Days eRoam carts are retained before EOD purge. Worked example: `10` → eRoam carts older than 10 days are purged. |

**Behavior & rules.**
- **Three separate retention fields for the same object** (a shopping cart) differing only by origin channel,
  each with its own EOD purge. **A cart's lifespan depends on where it was created.**
- **Two different price-on-conversion policies** across channels, one of which can raise the price.
- **Search result caps are silent** and are not surfaced to the user ("showing 200 of N").
- **The `PDA` tab is named in the header and never documented** — either a vestigial tab or a documentation
  gap; must be checked against a live system.
- **Nothing here documents cart abandonment notification, cart-to-lead linkage, or consent**, though carts
  contain customer identity and the eSTORIS cart is a consumer-facing artifact.

**Dependencies.** `SCS-033` eSTORIS Control Settings; `SCS-086` Web Control Settings; `SCS-054` Point of Sale
Control Settings (`Fulfillment Methods` — a shopping cart cannot be a take-with order; `Sales Margin
Scratchpad Cost`; customer search/duplicate rules; `Direct Shipments` and the NextGen cart rules;
`Application Event Emails` row `Shopping Cart` / `Shopping Cart eRoam` in `SCS-050`); `SCS-016` Costing
Control Settings (`CFG-COSTING-*`); Advanced Product Settings (pricing hierarchy); End-of-Day.

**Build notes.**
- New IDs: `CFG-CART-ALLOW-PRICE-CHANGE`, `CFG-CART-RETENTION-{ESTORIS,TERMINAL,EROAM}-DAYS`,
  `CFG-CART-CONVERT-PRICE-{ESTORIS,TERMINAL}`, `CFG-CART-COSTED-DISPLAY-BASIS`,
  `CFG-CART-MAX-RESULTS-{PRODUCT,CUSTOMER}`.
- **Do differently — one cart, one retention rule, one conversion-pricing policy.** Channel of origin is an
  attribute of the cart, not a reason for three configurations. Pick a single, documented price-on-conversion
  rule (recommended: **honor the cart price for N days, then re-price with an explicit, visible notice**) and
  apply it everywhere.
- **Do differently — never silently raise a price** between cart and order. If the current price is higher,
  show both and require an explicit acknowledgement.
- **Do differently — never silently truncate a search.** Return a count with the page, and page rather than cap.
- **Do differently — carts are customer data.** Retention should follow the customer-data policy, carts
  should be archivable, and abandonment should be an **event** (`SCS-046`) rather than a purge.
- Keep: the lower-price-wins conversion rule as the **default** policy — it is the customer-favorable and
  operationally simplest choice.
- `[DECISION NEEDED]` Which cart channels exist for LA Mattress (web store, in-store terminal, sales-floor
  tablet)? eRoam II is an iPad app tied to STORIS and is almost certainly replaced by our own tooling.

---

### `SCS-072` Special Order Control Settings
*storis_ref: article 15186453249940*

**Purpose.** How STORIS handles **special-order products** in entry routines — on-the-fly product creation,
where special orders are allowed, zero-cost gross-profit estimation, template retention, and automatic
purchase-order creation and assignment.

**Where it lives.** `System Administration > System Settings > Merchandising and Distribution System Settings
> Special Order Control Settings`.

**Fields — `Product Created in Sales Order`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Advanced Product Settings` | Checkbox | Checked → the **`Advanced Product Settings`** routine is used when creating products on-the-fly in sales order entry; blank → the simpler **`Product Settings`** routine. (parallel to `New Product Creation` in `SCS-058`) |
| `Serial Number Required` | Checkbox | Requires a serial number when entering the product information. |
| `Commission Category` | Commission category (FK) | **Default product commission category for special order products.** Feeds the `Salesperson Matrix` / `Customer Matrix` commission methods in `SCS-054`. |

**Fields — `Allow`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Layaways` | Checkbox | Allow special-order products on **layaway** orders. **Note `SCS-069`: "Special order items must be reserved IN FULL at the time you add them to layaway orders" — so allowing this has a hard reservation consequence.** |
| `Quotes` | Checkbox | Allow special-order products on **quote** orders. |

**Fields — continued**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Zero Cost Written Retail Percent` | Percentage, nullable | **[TRISTATE], and the article spells the hierarchy out precisely.** "Specify the percentage of the selling price you want to use when calculating the **approximate cost** for zero-cost, special ordered products." **Resolution hierarchy, verbatim: "The cost calculation obtains the zero-cost retail percent using a hierarchy comprised of `Group Settings`, `Category Settings`, and `Special Order Control Settings`, IN THIS ORDER. The FIRST zero-cost percent amount found using this hierarchy is the percent used. A VALUE OF ZERO IS A VALID AMOUNT in the zero-cost retail percent AND IS USED in the hierarchy. THE VALUE MUST BE NULL IN ORDER TO MOVE TO THE NEXT HIERARCHY LEVEL."** — **the clearest statement anywhere in this section that `0` and `null` are different, and it is the correct semantics.** **"This cost is NOT WRITTEN TO THE PURCHASE ORDER, and is used to determine the approximate gross profit amount that displays on the following reports: `Report Written Sales Dollars` and `Report Written Sales by Salesperson`."** **Override, verbatim: "If a check appears at the `Use Replacement Cost as Default` field on the Miscellaneous tab in the Purchasing Control Settings, THE SYSTEM USES THE REPLACEMENT COST for each product INSTEAD of the percentage you enter here."** (cross-reference `SCS-058`) |
| `Inactive Template Retention Days` | Numeric, **maximum 4 digits** — **required** | **[DESTRUCTIVE]** Days to keep **inactive special order templates** before purging during **`Generate Monthly Reports`**. **Mandatory, so there is no keep-forever. A special-order template encodes a configured product; purging it loses the ability to reproduce a past configuration.** |

**Fields — `Purchase Order`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Automatically Create` | Checkbox | Checked → **a purchase order is created automatically** when a special-order product is entered on a sales order and insufficient stock exists. Blank → **"if no stock is reserved for the sales order, the system PROMPTS you to create a purchase order."** |
| `Assignment Required` | Checkbox | Requires users to **either create/modify a purchase order OR reserve the item** when ordering a special-order product. Blank → **"users must manually reserve special order items to sales orders."** **Hard rule: "You CANNOT DISABLE this field when ATP is active."** **Security interaction, verbatim: "This field OVERRIDES the `Create special order purchase orders within POS entry` field in the Extended Security settings. If you leave this field BLANK, the `Create special order purchase orders within POS entry` field determines whether the option appears… If you leave BLANK BOTH this field AND the `Create special order purchase orders within POS entry` field, NO OPTION APPEARS to create purchase orders during sales order entry."** — **a control setting overriding a security permission, and a two-blank state that silently removes a capability.** Also referenced by `SCS-058` (`Sales Order Linkage Access = Manually` behavior) and `SCS-069` (auto-reservation of special orders). |
| `Buying Group` | Buying group (FK) | Default buying group when creating POs on-the-fly for special-order products in Sales Order Entry. **"The system uses this entry IF NO BUYING GROUP IS ASSIGNED in the Advanced Vendor Settings for the vendor on the purchase order."** — vendor-level first, this as fallback. Interacts with `GENERAL - Activate Buying Group` in `SCS-058`, which requires every product on a PO to share one buyer. |

**Behavior & rules — the hard ones.**
- **`Zero Cost Written Retail Percent` is a fabricated cost used for reporting only.** It never reaches the
  purchase order, but it **does** drive the gross-profit figures salespeople and managers see on
  `Report Written Sales Dollars` and `Report Written Sales by Salesperson`. **Set it wrong and every special
  order reports a fictional margin.** Combined with `SCS-058`'s zero-cost fallbacks (which both terminate in
  a literal zero cost), a zero-cost special order can report **100% margin**.
- **`0` vs `null` semantics here are explicit and correct** — `0` is a real value that stops the hierarchy;
  only `null` falls through. **Adopt this convention system-wide.**
- **`Assignment Required` cannot be turned off when ATP is active**, and it **overrides** an Extended Security
  permission — a control setting beating the security model, which is the inverse of how we want it.
- **Two blanks (`Assignment Required` and the Extended Security permission) silently remove the ability to
  create special-order POs from order entry** — a capability disappears with no error.
- **`Inactive Template Retention Days` is mandatory** and destroys configured-product templates.

**Dependencies.** `SCS-058` Purchasing Control Settings (`Use Replacement Cost as Default`,
`Sales Order Linkage Access`, `SPECIAL ORDERS - *` flags, `GENERAL - Activate Buying Group`);
`SCS-069` Sales Order Reservations (`Assignment Required` enables auto-reservation of special orders);
`SCS-054` Point of Sale Control Settings (special-order `Price Variance Rules`, direct ship, layaway rules,
commission methods); `SCS-087` Zero-Cost Exception Handling; `SCS-047` Micro*D PreVue and `SCS-051` Order Line
Import (special-order lines created by configurators); `SCS-057` Product Configurator Control Settings;
Group Settings and Category Settings (`Zero Cost Written Retail Percent` hierarchy); Advanced Vendor Settings
(buying group); Advanced Product Settings / Product Settings; Commission Settings; Extended Security
(`Create special order purchase orders within POS entry`); `Special Order Processing Overview`;
`Generate Monthly Reports`. **[REUSE]** `CFG-COSTING-*`, `CFG-INV-RESERVEBY`, `CFG-SO-*`.

**Build notes.**
- New IDs: `CFG-SO-PRODUCT-FORM`, `CFG-SO-SERIAL-REQUIRED`, `CFG-SO-COMMISSION-CATEGORY`,
  `CFG-SO-ALLOW-LAYAWAY`, `CFG-SO-ALLOW-QUOTE`, `CFG-SO-ZEROCOST-RETAIL-PCT`,
  `CFG-SO-TEMPLATE-RETENTION-DAYS`, `CFG-SO-AUTO-CREATE-PO`, `CFG-SO-ASSIGNMENT-REQUIRED`,
  `CFG-SO-BUYING-GROUP`. **(These belong to the `CFG-SO-*` family already registered in the Inventory pack —
  reuse those IDs where they already exist rather than minting duplicates.)**
- **Adopt the `0`-is-a-value / `null`-falls-through convention** from `Zero Cost Written Retail Percent` as
  the **house rule for every hierarchical setting** in our resolver. It is the one place STORIS gets
  tri-state semantics right, and it should be the pattern for `CFG-*` resolution generally.
- **Do differently — a fabricated cost must be visibly fabricated.** If cost is estimated, every report and
  screen showing the resulting margin must mark it as estimated, and the estimate basis must be recorded on
  the line. Better: **do not let a special-order line be written without a real cost** — require the vendor
  quote, or block the margin display.
- **Do differently — security wins over settings.** A control setting must never override a permission.
  Model this as: the *capability* is permission-gated; the *policy* (auto-create vs prompt vs manual) is the
  setting. The "both blank = feature vanishes" state must be impossible.
- **Do differently — special-order templates are configuration records; archive, never purge.**
- Keep: the `Automatically Create` / prompt distinction; the vendor-then-system buying-group fallback; the
  ATP-forces-assignment rule (it is correct — you cannot promise a date on an unassigned special order).
- `[DECISION NEEDED]` Special orders in a mattress business are usually limited (custom sizes, split kings,
  adjustable base configurations). Confirm scope; if special orders exist, `CFG-SO-ZEROCOST-RETAIL-PCT` and
  the margin-reporting question matter immediately.

---

### `SCS-073` Stock Reservation Settings
*storis_ref: article 15186451768852*

**Purpose.** Specifies the **`Reservation Priority` × `Reservation Date`** matrix that decides *which order
line gets the stock*, at three scopes (system / product / district-region), plus the
**"Prefer Purchase Orders over Schema Days"** rule that suppresses automatic transfers when an incoming PO
will arrive in time. This is the core allocation policy of the whole ERP.

**Where it lives.** The two fields live on: **`Inventory Control Settings` (General tab)**,
**`Advanced Product Settings` (Settings page)**, and **`District and Regional Product Settings`
(Regional Settings tab)**. This article documents the combinations and their rules.

**Fields — `Reservation Priority` × `Reservation Date` combinations (verbatim)**

*System level — `Inventory Control Settings`, General tab:*
1. **Prioritize by `Delivery Date` & reserve by `Delivery Date within Auto Fill Days` (fill period)**
2. **Prioritize by `Ordered Date` & reserve by `Delivery Date within Auto Fill Days` (fill period)**
3. **Prioritize by `Ordered Date` & reserve `Immediately`** — "prioritize orders by date of entry without
   considering auto-fill days"

*Product level — `Advanced Product Settings`, Settings page:*
1. **Prioritize by `Inventory Control Setting` & reserve by `Inventory Control Setting`** — **hard rule:
   "If you select `Use Inventory Control Setting` at `Reservation Priority` you MUST ALSO select
   `Use Inventory Control Setting` at `Reservation Date`."** (the two cannot be mixed across scopes)
2. Prioritize by `Ordered Date` & reserve by `Delivery Date within Auto Fill Days`
3. Prioritize by `Delivery Date` & reserve by `Delivery Date within Auto Fill Days`
4. Prioritize by `Ordered Date` & reserve `Immediately`

*Regional product level — `District and Regional Product Settings`, Regional Settings tab:*
1. **Prioritize by `Product Setting` & reserve by `Product Setting`** — same paired-inheritance rule.
2. Prioritize by `Ordered Date` & reserve by `Delivery Date within Auto Fill Days`
3. Prioritize by `Delivery Date` & reserve by `Delivery Date within Auto Fill Days`
4. Prioritize by `Ordered Date` & reserve `Immediately`

**Rules for using these fields (verbatim, all hard rules).**
- "Reservation by **order date**, whether it is configured to use the fill window or reserve immediately,
  **prioritizes order lines using the ORDER LINE'S TIMESTAMP instead of the order date and written time.**"
- "When selecting to prioritize by order date and reserve immediately, **ATP can be active**."
- "**Reservation MUST be prioritized by order date and reserved immediately when ATP is active AND
  `Reserve ASAP Sales` or `Reserve CWC Sales` is active.**"
- "**You CANNOT select the combination of `Delivery Date` prioritization and a reservation date of
  `Immediate`.**" (so the 3×2 matrix has a forbidden cell)
- "**Reservation cannot be prioritized by `Order Date` and reserved by `Delivery Date within Auto Fill Days`
  UNLESS ALL ATP Calculation Settings are INACTIVE in your Point of Sale Control Settings.**"

**When auto-fill days are IGNORED under `Order Date (Reserve Immediately)` (verbatim list).**
Layaway/sales quotes converted to sales orders; an order placed on or removed from credit hold; a new line
added; delivery/pickup dates changed for the order or its lines; a line's fill days changed via
**`Additional Line Item Details`**; a line linked to a purchase order via **`Purchase Order Reservation`**;
creating and maintaining a **linked transfer** for a line.

**Logistical scheduling interaction (verbatim).** "Reservations are **maintained** when reserving by
`Delivery Date (Reserve Within Fill Days)` or `Order Date (Reserve Within Fill Days)`. **Reservations are
UNAFFECTED by changes to the delivery schedule when reserving by `Order Date (Reserve Immediately)`.**"

**`Prefer Purchase Orders over Schema Days`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Prefer Incoming Purchase Orders Before Stock Location Schema` (Point of Sale Control Settings, `SCS-054`) | Checkbox | **"This setting ENABLES the functionality REGARDLESS of how the other settings are configured."** |
| `Prefer Purchase Order Over Schema __ Days` (Warehouse/Store Location Settings) | Integer days | **"Define the number of days that a sales order line can be filled by an incoming purchase order. If the purchase order falls within this number of days, NO TRANSFERS ARE AUTOMATICALLY CREATED to fill the order line."** |

**Required reservation configurations for the PO-preference logic (verbatim).** On `Inventory Control
Settings` (General tab), `Advanced Product Settings` (Settings page) and `District and Regional Product
Settings` (Regional Settings tab), one of exactly two configurations must be set:
- **Configuration 1: `Reservation Priority` = `Delivery Date`; `Reservation Date` = `Delivery Date within
  Auto Fill Days`.**
- **Configuration 2: `Reservation Priority` = `Order Date`; `Reservation Date` = `Immediate`.**

> **[GUARDED], verbatim:** "**If any of the below processes are not set as required and the
> `Prefer Incoming Purchase Orders Before Stock Location Schema` logic is enabled, A WARNING APPEARS; as
> such, if the logic is enabled and then the below settings are changed in a way that does not align with
> the logic, A WARNING APPEARS.**" **A warning only — the system permits an inconsistent configuration in
> which the feature silently misbehaves.**

**Criteria an incoming PO line must meet to be preferred (verbatim).** It must: be **for the same product**;
be **to be received at the line's current stock location**; have a **scheduled date before or within the
`Prefer Purchase Order Over Schema Days`**; be **not on hold**; and have **"enough quantity purchased to fill
the quantity ordered on the order line AFTER CONSIDERING OTHER ORDERS THAT MAY HAVE PRIORITY IN THE
RESERVATION QUEUE."**

Additional order-entry considerations (verbatim):
- "If reserving by **delivery date within auto fill days**, have a scheduled delivery date **within the set
  number of days past the current line's scheduled fulfillment date**."
- "If stock schema is being applied to a **newly created line that has just been added to an UNSCHEDULED
  fulfillment**, the fulfillment date used for comparison will be **the current system date**."
- "If reserving by **Order Date - Immediate**, **the current system date** will be used to determine the
  start of the preferred purchase order window in place of the scheduled delivery date."

**Rule application (verbatim).** "If a purchase order line meets these criteria and is found to be preferable
to the automatic creation of transfers through the **Stock Location Schema** or **Alternate Stock Location**
functionality, **a schema is not applied and those transfers are not automatically created. AN AUDIT COMMENT
IS WRITTEN.**" The check occurs whenever schema/alternate-location logic is applied: **adding a new line to a
Sales Order or Exchange; changing the stock location on an existing line; changing the fulfillment location
on a fulfillment; adding a fulfillment date to an unscheduled fulfillment; changing the fulfillment date from
outside to inside the fill window; changing a fulfillment status from CWC or ASAP to Estimated or Scheduled.**

**Worked use cases (verbatim scenario).** Product `BCH1`; location `01` has a Stock Location Schema to a
single warehouse, location `88`; **5 days** to transfer 88→01; **no quantity on hand at 01**; 88 has enough;
`Prefer Purchase Order Over Schema Days` = **3**; date **08/20**; fill window **15 days**.

| Case | Setup | Result (verbatim) |
|---|---|---|
| **1** | PO qty 3 due at `01` on **8/28**; new line qty **1**, scheduled **08/25** | "the stock location will remain at location 01 and a transfer from 88 will not be created" — the PO arrives **within 3 days** of the line's scheduled date. |
| **2** | Same PO; an **earlier** sales order for qty **2** already in the reservation queue; new line qty **1** behind it | "The stock location will remain at location 01 and a transfer from 88 will not be created. **There is enough quantity available on the incoming purchase order, even after accounting for the order ahead** of the current line in the reservation queue." |
| **3** | Same PO; earlier order qty **2** ahead in the queue; new line qty **3** | "The line will not reserve at 01 and **the stock location will be switched to 88 and an auto transfer will be created from 88 to 01. THE FULL QUANTITY OF 3 will be transferred**… because after accounting for the already existing sales order ahead of the current line, there is not enough quantity left on the purchase order. **Transfers from other locations can be created.**" |
| **4** | Same PO (due 8/28); new line qty **1**, scheduled **08/20** | "The line will not reserve at 01 and the stock location will be switched to 88 and an auto transfer for a quantity of 1 will be created… **because the purchase order is scheduled to arrive MORE THAN 3 DAYS PAST the scheduled date of the sales order line.**" |

**Behavior & rules — the hard ones.**
- **This is a three-scope setting pair with a forbidden combination, two mandatory combinations, and two
  ATP-conditional prohibitions.** It is the most constrained configuration in the entire section, and the
  constraints are **enforced inconsistently** — some are hard ("you cannot select"), one is a warning only.
- **Priority is by order-line TIMESTAMP, not order date**, whenever order-date priority is chosen. That is a
  real fairness rule: two lines written the same day are ordered by the second they were keyed.
- **`Order Date (Reserve Immediately)` makes reservations immune to schedule changes**, which is either a
  feature (stability) or a defect (stock held for a date that moved out a month) depending on the business.
- **The seven "auto-fill days are ignored" events** are a list every implementation must reproduce exactly;
  they are the events at which a reservation is re-evaluated.
- **Case 3 is the sharp one:** falling one unit short of PO coverage flips the line from "wait for the PO" to
  "transfer the ENTIRE quantity from another warehouse" — an all-or-nothing switch with real freight cost.
- **`Reservation Priority` and `Reservation Date` must inherit as a PAIR** (product-level "use inventory
  control setting" requires both); they cannot be resolved independently.

**Dependencies.** `SCS-043` Inventory Control Settings (`Reservation Priority`, `Reservation Date`,
`Reserve ASAP Sales`, `Reserve CWC Sales`, `Online Receipts Reservations`); Advanced Product Settings
(Settings page); District and Regional Product Settings (Regional Settings tab); `SCS-054` Point of Sale
Control Settings (`Prefer Incoming Purchase Orders Before Stock Location Schema`, ATP Calculation Settings,
`Reserve Product (Auto Fill) __ Days`, `Use Stock Location Schema (Demand)`, `Use Alternate Stock Location`,
`Use Distribution Location Schema (Logistics)`, `Schedule Period Days`); Warehouse/Store Location Settings
(`Prefer Purchase Order Over Schema __ Days`) — `CFG-LOC-*`; `SCS-069` Sales Order Reservations;
`SCS-048` Net Purchase Order; `Additional Line Item Details`; `Purchase Order Reservation`;
`Logistical Scheduling`; Automatic Transfers; `Auto-Fill Days Setup`; Purchase Statuses.
**[REUSE]** `CFG-INV-RESERVEBY` (this **is** that setting), `CFG-WHINV-*`, `CFG-LOC-*`, `CFG-POS-AUTOSCHED`.

**Build notes.**
- **This article is the specification for our allocation engine.** Treat the combination matrix, the five
  hard rules, the seven ignore-events, and the four use cases as an **acceptance test suite**. They are the
  most valuable content in part B for implementation purposes.
- Model the pair as a single value object `ReservationPolicy {priority, date_basis}` resolved by the standard
  most-specific-scope-wins resolver (**product → district/region → system**), **inherited as a unit** —
  which is exactly what STORIS's "must also select Use … Setting" rule is groping toward.
- **Enumerate the legal combinations in the type**, so the forbidden cell (`Delivery Date` + `Immediate`) is
  unrepresentable rather than validated.
- **Do differently — make the ATP-compatibility constraints hard errors, not warnings.** A configuration that
  the vendor says will misbehave must not be savable.
- **Do differently — reservation decisions must be explainable.** STORIS writes an audit comment when the
  PO-preference rule suppresses a transfer; extend that to **every** allocation decision: which policy,
  which queue position, which competing lines, why this location.
- **Do differently — Case 3's all-or-nothing behavior should be configurable**: partial fill from the PO plus
  a transfer for the shortfall is usually cheaper than transferring the whole quantity.
- **Do differently — the `Order Date (Reserve Immediately)` immunity to schedule changes should be an
  explicit choice**, surfaced as "reservations follow the schedule" vs "reservations are locked at entry",
  not a side effect of a priority setting.
- `[DECISION NEEDED]` **Allocation policy for LA Mattress.** Order-date-immediate (first-come-first-served,
  ATP-compatible) vs delivery-date-within-fill-window (just-in-time). This decision constrains ATP, ASAP/CWC
  handling, and the whole transfer strategy, so it should be made early and once.

---

### `SCS-074` STORIS Messenger Control Settings
*storis_ref: article 15186501104788*

**Purpose.** Preferences for the **STORIS Messenger** internal e-mail/task system — message retention,
login behavior, and the set of **automatic operational notifications** sent on receiving, reservation, PO
date changes, and EOD/EOM failure.

**Where it lives.** Two documented paths:
`System Administration > Messenger > STORIS Messenger Control Settings`
`System Administration > System Settings > General Administration System Settings > STORIS Messenger Control
Settings`
**Tabs: `General Information`, `Messaging`.**

**Fields — `General Information`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Closed Retention Days` | Integer **`0`–`999`** | **[TRISTATE] + [DESTRUCTIVE]** Days closed STORIS e-mail messages are retained; **"The End-of-Day process automatically detects deleted messages that are older than the number of days specified here and purges them."** **"A NULL value indicates NO PURGE is to be processed."** **So null = keep forever, `0` = purge immediately.** Viewable via the **`Closed`** tab in `Send/Review Mail Messages`. |
| `Inbound /Outbound Retention Days` | Integer days | **[DESTRUCTIVE]** Retention of inbound and/or outbound messages, purged by EOD. **The article does NOT state a range or a null behavior for this field, unlike the two around it — content gap and a [TRISTATE] risk.** |
| `Task Retention Days` | Integer **`0`–`999`** | **[DESTRUCTIVE]** Retention of **tasked** messages, purged by EOD. **Tasks are work items (e.g. "your special order arrived") — purging them destroys the record that a salesperson was told.** |
| `Message Review at Login` | Checkbox | Checked → for users with unread mail, `Send/Review Mail Messages` opens automatically at log-in. **Per-user override, verbatim: "if the `Message Review Logon` field in the User file is — ENABLED, it OVERRIDES this field; — DISABLED, it DEFERS to this field."** **An asymmetric override: the user setting can only turn it ON, never off.** |

**Fields — `Messaging` → `Send Message`**

> **Audit note, verbatim:** "When an automatic e-mail is generated based upon any of the three following
> settings, **an audit comment is also written to the ORDER DOCUMENT** indicating when the message was sent.
> The comment includes the **date, time, location, user initials, and subject (how order has been filled)**."
> **The article then lists FOUR settings under "the three following settings" — [CONFLICT] in the source:**
> `When a Special Order Item is Received`, `When Back-Order is Filled by Linked Purchase Order`,
> `When Received Merchandise is Reserved`, `When Received Merchandise cannot be Reserved`.

| Field | Type | Purpose / business rule |
|---|---|---|
| `When a Special Order Item is Received` | Two checkboxes: **`Location STORIS Mail ID`**, **`Salesperson`** — "one, both or neither" | `Location STORIS Mail ID` → notifies the employee at the **`STORIS Mail ID`** field in Warehouse/Store Location Settings **for the receiving location**; the e-mail appears on the **`Inbound`** tab. `Salesperson` → notifies **the salesperson associated with the original purchase order**; the e-mail appears on the **`Tasks`** tab. **"if neither option is checked, NO EMPLOYEES ARE NOTIFIED"** — a special order can arrive and nobody is told. |
| `When Back-Order is filled by Linked Purchase Order` | Same two checkboxes | Same recipients and same tabs. **Split-ticket rule, verbatim: "For split tickets, the program checks lines with the SAME TYPE AND DATE. For example, if a customer pick-up line is filled, the program checks all the remaining pick-up lines for that date. IF THEY ARE ALL COMPLETE, the program sends the email message. If multiple delivery dates are present, the program checks all other line items with the same delivery date. If they are all complete, the program sends the email."** — **notification fires only when the whole same-date group is fillable, not per line.** **"When you fill a back-order, if this field is set to something other than `N`, the `Warehouse Receiving Update Process` sends a mail message… to the inbox of the mail recipient specified for the receiving location via the `STORIS Mail ID` field."** (note the legacy `N` value leaking into the description) |
| `Purchase Order Delivery Date Changes` | Two checkboxes — **default none (both unchecked)** | Who is emailed when a **PO delivery date changes**. `Location STORIS Mail ID` → the address in the **`STORIS Mail ID`** field on the **Miscellaneous** tab of Warehouse/Store Location Settings; **"A message is sent for EACH LINKED SALES ORDER for any purchase order line with a delivery date change."** `Salesperson` → **the primary salesperson on the sales order linked to the purchase order**, again per linked sales order. **Routines checked (verbatim): `Enter a Purchase Order`, `Acknowledge a Purchase Order`, `EDI Purchase Order Acknowledgements`, `EDI Advance Ship Notice`, `EDI Purchase Order Change Acknowledgement`, `EDI Translate EXIM EDI Status Details`.** **Default off means a vendor can move a delivery date — including via EDI — and no one is told. Pair this with `SCS-058`'s `EDI - Allow Acknowledgment to Adjust Order Quantity`, whose only mitigation is a Messenger email.** |
| `When Received Merchandise Could Not be Reserved` | Two checkboxes — **both unchecked by default** | Notifies when merchandise received from a PO **could not be reserved "because the order item record was LOCKED BY ANOTHER USER at that time."** Same two recipients and tabs. **Hard prerequisite, verbatim: "When the `Online Receipts Reservation` setting in Inventory Control Settings is NOT SET, messages are not sent because merchandise received from purchase orders that are linked to sales orders are not reserved to those sales orders; therefore, merchandise reservation is not attempted."** **A record-lock is being surfaced to a salesperson as a business notification — and it is off by default, so the failure is silent.** |
| `To Buyer When Purchase Order Is` | Two options: **`Over-Received`**, **`Partially Received`** | Conditions under which the **buyer** associated with a PO is emailed. "STORIS Messenger sends the e-mail when you receive the purchase order item into inventory." Viewable on the **`Tasks`** tab. **Over-receipt is an inventory and payables discrepancy; notification is optional.** |
| `When a One-Time-Buy Purchase Order is Received` | Recipient list | Users notified when a one-time-buy product is received. **Search button offers: `Staff`, `Mail Group Display`. Action button offers: `Buyers`, `Notification by Warehouse`** — the latter opens `SCS-049`. |
| `When Received Merchandise is Reserved` | Recipient list (searchable user list) | Users notified when the system **successfully** reserves received merchandise. |
| `When an EOD/EOM Processing Error is Reported` | Staff member or mail group (FK) | **Email notification "when EOD/EOM CANNOT RUN"**, including **the reason** the process did not run. **Hard scope limit, verbatim: "This is used ONLY when `Schedule Daily Reports`/`Generate Monthly Reports` is initiated via `Schedule a Process`. When running daily/monthly processing MANUALLY, these types of errors are DISPLAYED ON THE SCREEN."** **This is the single most important notification in the article — EOD not running means no reservations, no purges, no exception reports, no auto-transfers — and it is a single optional recipient field with no escalation.** |

**Behavior & rules — the hard ones.**
- **Nearly every notification defaults to nobody.** Special-order arrival, back-order fill, PO date change,
  failed reservation, over-receipt — all default to no recipient. **The system's default posture is silence.**
- **`When an EOD/EOM Processing Error is Reported` only fires for scheduled runs**, and points at one user or
  group. If that person is on holiday, a failed nightly close is invisible.
- **`Message Review at Login` can only be strengthened per user, never weakened.**
- **Retention: `null` = keep forever, `0` = purge now** — the opposite of `SCS-054`'s `Voided Orders` and
  `Customer Retention Period` conventions, and the same as `SCS-068`'s lead history. **Three conventions in
  one section.**
- **The "record was locked by another user" notification** reveals that reservation failures due to
  concurrency are a normal, expected operational event in STORIS.
- **Recipient identity is a location-level `STORIS Mail ID` field**, i.e. one mailbox per location — no
  roles, no groups at that level, no escalation.

**Dependencies.** `SCS-049` Notification by Warehouse Screen (sub-screen of `One-Time-Buy Purchase Order
Notification`); `SCS-050` Notifications Control Settings (external email; the two systems are separate);
`SCS-043` Inventory Control Settings (`Online Receipts Reservation`); `SCS-058` Purchasing Control Settings
(EDI acknowledgement quantity changes notify via Messenger; buyer/buying group); `SCS-030` EDI Control
Settings; `SCS-069`/`SCS-073` reservation behavior; `SCS-072` Special Order Control Settings;
Warehouse/Store Location Settings (`STORIS Mail ID`, Miscellaneous tab) — `CFG-LOC-*`; User file
(`Message Review Logon`); Mail Groups; `Send/Review Mail Messages` (`Inbound` / `Tasks` / `Closed` tabs);
`Warehouse Receiving Update Process`; `Schedule a Process`; End-of-Day / End-of-Month;
`Report Sales Orders with Delivery Dates in Jeopardy`.

**Build notes.**
- New IDs: `CFG-MSGR-RETENTION-{CLOSED,INOUT,TASK}-DAYS`, `CFG-MSGR-REVIEW-AT-LOGIN`,
  `CFG-MSGR-NOTIFY-SPECIALORDER-RECEIVED`, `CFG-MSGR-NOTIFY-BACKORDER-FILLED`,
  `CFG-MSGR-NOTIFY-PO-DATE-CHANGE`, `CFG-MSGR-NOTIFY-RESERVE-FAILED`,
  `CFG-MSGR-NOTIFY-RESERVE-SUCCEEDED`, `CFG-MSGR-NOTIFY-BUYER-RECEIPT`,
  `CFG-MSGR-NOTIFY-OTB-RECEIVED`, `CFG-MSGR-NOTIFY-EOD-FAILURE`.
- **Do differently — one notification system, not two.** STORIS Messenger (internal) and Notifications
  Control Settings (external email/SMS) are separate stacks with separate retention and separate recipient
  models. We should have **one event bus** (`SCS-046`) with **channel adapters** (in-app, email, SMS, Slack).
- **Do differently — operational alerts are not configurable to zero.** EOD/EOM failure, over-receipt, and
  failed reservation must always alert, with an **escalation policy** (primary → backup → on-call) rather
  than a single mailbox. And EOD failure must alert **whether the run was scheduled or manual**.
- **Do differently — recipients are roles**, resolved to people at send time, with a mandatory fallback.
  A location's "mail ID" as the unit of routing does not survive staff turnover.
- **Do differently — do not surface record-lock contention as a business notification.** Retry it. If it
  still fails, that is a system alert, not a salesperson's task.
- **Retention:** apply the same house rule — explicit `keep_forever` vs `purge_after`, archived not deleted,
  and never destroy **task** records that evidence someone was notified.
- Keep: the **audit comment written back to the order document** when a notification fires (date, time,
  location, user, subject). That is a good pattern and should feed `RPT-AUDIT`.
- Keep: the **split-ticket "notify only when the whole same-date group is fillable"** rule — it prevents
  notification spam and matches how orders are actually delivered.
- `[DECISION NEEDED]` Which of these operational events matter at LA Mattress, and who owns each. The
  default-silent posture is the thing to fix first.

---

### `SCS-075` System Notifications
*storis_ref: article 15186452148500*

**Purpose.** Configures **logon-time warnings** about two (three) impending outages: the accounting **period
overlap** ending, the **STORIS license** expiring, and the **UniData license** expiring. Explicitly framed as
"help anticipate prevent accounts from becoming inaccessible" *(sic)*.

**Where it lives.** `General System Control Settings > global Actions button on General tab > System
Notifications` — a sub-screen of `SCS-038`.

**Fields** (three sections, each with the same pair)

| Section | Field | Type | Purpose / business rule |
|---|---|---|---|
| `Account in Overlap` | `Number of Days` | Integer **`0`–`999`** — **default `7`** | If the current date is within N days of **the end of the period**, a **SCiX notification message** is displayed at logon to the listed users. |
| `Account in Overlap` | `Send Notification To` | One or more user IDs | **[TRISTATE]: "If this field is BLANK, NO NOTIFICATION IS SENT."** "If multiple users are selected, **ellipses** are displayed; otherwise, **initials** of the single user are displayed." |
| `License Expiration` | `Number of Days` | Integer **`0`–`999`** — **default `7`** | Same rule for the **STORIS license expiry**. |
| `License Expiration` | `Send Notification To` | One or more user IDs | Same; blank = silent. |
| `UniData License Expiration Notification` | `Number of Days` | Integer **`0`–`185`** — **default `45`** | Separate, longer horizon for the **UniData (database) license**. |
| `UniData License Expiration Notification` | `Send Notification To` | One or more user IDs | **"This setting DEFAULTS TO THE `System Admin ID` setting in the Security tab of General System Control Settings."** — the only one of the three with a sensible default recipient. |

**The UniData message (verbatim).** When a listed user logs in within the window:
> `"The UniData license for this server is due to expire on <expiration date>. This system will not be usable
> after that date."`

**Behavior & rules.**
- **All three notifications are silent by default except UniData**, which inherits the System Admin ID.
  **The two that are blank by default are the ones that make the system unusable: an expired STORIS license
  and a closed period.**
- **Notification is at logon only.** A user who does not log in is never told; there is no email, no
  escalation, no dashboard. **Compare `SCS-074`'s EOD/EOM failure notification — the same single-recipient,
  single-channel weakness.**
- **`0` is a legal value** for all three day counts and means "warn on the day it happens" — i.e. no warning
  at all in practice. **[TRISTATE]-adjacent.**
- **"Account in Overlap"** refers to the accounting period overlap window (see `SCS-054`'s
  `Backdating Rules > Entry Date __ Days`, which is bounded at 31 days "into an overlap month"). Losing the
  overlap window silently blocks backdated entry.

**Dependencies.** `SCS-038` General System Control Settings (parent; `System Admin ID` on the Security tab);
`SCS-054` Point of Sale Control Settings (`Backdating Rules` depend on the overlap period);
`SCS-037` General Ledger Control Settings / period close; `SCS-074` STORIS Messenger Control Settings
(the other operational-alert mechanism); SCiX notification framework; licensing.

**Build notes.**
- New IDs: `CFG-SYSNOTIFY-OVERLAP-{DAYS,RECIPIENTS}`, `CFG-SYSNOTIFY-LICENSE-{DAYS,RECIPIENTS}`,
  `CFG-SYSNOTIFY-UNIDATA-{DAYS,RECIPIENTS}`.
- **Do differently — availability-threatening alerts are not optional and not logon-only.** License expiry,
  period close, and any "the system will stop working" condition should be **monitoring alerts** with a
  default recipient that cannot be emptied, an escalation chain, and multiple channels.
- **In our stack most of this disappears**: there is no per-server database license to expire. What survives
  is the **accounting-period warning**, which belongs in the close checklist, not in a logon popup.
- Keep: the idea of a **long, separate horizon** for infrastructure expiry (45 days) versus operational
  windows (7 days).
- `[DECISION NEEDED]` Where operational alerts land for LA Mattress (email, Slack, PagerDuty) — this and
  `SCS-074` should share one answer.

---

### `SCS-076` System Security Window
*storis_ref: article 15186501361172*

**Purpose.** (Article is effectively a stub — it documents a single modal dialog and has no fields.) The
window that appears when a user attempts to edit a **STORIS-locked field**.

**Where it lives.** Not a menu item. It appears in place, on any locked field.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| — none — | Modal message + `Exit` button | Verbatim: **"This window appears if you attempt to access a STORIS-locked field. Only STORIS personnel can edit STORIS-locked fields. If you want to edit this field, contact your STORIS representative. To exit this screen, click on `Exit`."** |

**Behavior & rules.**
- **This is the enforcement mechanism for the `(LOCKED - STORIS access ONLY!)` marker** that appears on
  dozens of fields across this section. Part B alone catalogues locked fields in `SCS-052` (`Next Number`,
  `Detail Lines on Stub`, `Next Positive Pay Batch`), `SCS-054` (`Next Point of Sale / Service Transaction`,
  `Add Store To Transaction`, `Use Sales Order for Auto Transfers`, `Fill Layaway Orders`,
  `Limit Stock Locations Based on a User's Available Locations`, `Apply Fixed Amount Subtotal Discounts
  First`, `Imbedded National Tax`), `SCS-055` (six fields), `SCS-058` (`Next Purchase Order Number`,
  `GENERAL - Activate Buying Group`), `SCS-053` (`Device Character Display Limit`), `SCS-064`
  (`Plan Auditing`, `Update Customer Credit Date`, `Apply Insurance By`), `SCS-066`
  (`Pick by Route When Mapping Active`, `Use Order Quantity instead of Delivery Quantity`), `SCS-070`
  (`Status for New Orders`, `Status for Closed Orders`).
- **It is a vendor-controlled authority boundary, not a customer-configurable permission.** No amount of
  administrator privilege in the customer's own system unlocks these fields. **This is the single largest
  structural difference between STORIS's configuration model and the one we should build.**
- **The article documents no way to see WHY a field is locked, what it does, or how to request a change** —
  only "contact your STORIS representative."

**Dependencies.** Every screen in this section that carries a `(LOCKED …)` field;
`parts/user-security-CATALOG.md` (the customer-side permission model, which is orthogonal to this).

**Build notes.**
- **No settings to implement.** The requirement this article generates is a **negative** one.
- **Do differently — there is no vendor tier in our system.** Every setting is owned by LA Mattress. What
  replaces STORIS-locking is a **risk tier on each setting**: `normal`, `sensitive` (requires elevated
  permission + reason + `RPT-AUDIT` entry), and `dangerous` (additionally requires a second approver and a
  confirmation that names the blast radius — the [DESTRUCTIVE] and [IRREVERSIBLE] settings collected at the
  end of this file are the initial membership of that tier).
- **Do differently — always explain the restriction.** If a setting cannot be changed here and now, the UI
  must say *why*, *what it affects*, and *who can change it*.
- **Note for the coverage matrix:** this is one of the two thinnest articles in part B (the other is
  `SCS-078`). It is still worth an entry because it names the enforcement mechanism behind ~25 locked fields.

---

### `SCS-077` Terminal Settings
*storis_ref: article 15186452531860*

**Purpose.** Registry of **payment terminal IDs** (EMV terminals tied to a Shift4 UTG) and **tethered
terminal IDs** (signature-capture devices), and the hierarchy that decides which terminal a user's session
and each credit card sale actually use.

**Where it lives.** `Menu` (the article gives only "Menu" as the access path — **content gap**).
**Two sections: `EMV Terminal`, `Tethered Terminal`.**

**Terminal ID (TID) defaulting hierarchy at login (verbatim, in order).**
1. **"The TID assigned to a user via `Create a User`."**
2. **"If there is no TID assigned to a user, the default is EMPTY (no selection)."**
3. **"The TID specified for the cash drawer at the `Default Payment Terminal` field."**
4. **"The user may choose or change the TID at login."**
- **"The TID selected at login (INCLUDING NO SELECTION/EMPTY) is the default TID used during the FIRST credit
  card sale."**
- **"The `STORIS Payment Summary Window` allows a user to CHANGE the TID."**

> **[CONFLICT] in the source — step 2 says the default is empty when no user TID exists, and step 3 then says
> the cash drawer's `Default Payment Terminal` is used. Those cannot both be the next step. The ordering must
> be verified against a live system before implementing.**

**Fields — `EMV Terminal`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Terminal ID` | Alphanumeric, **unlimited length, first 50 characters display** | "A unique alphanumeric identifier assigned to the payment terminal with the **Shift4 UTG**. Each payment terminal is assigned its own ID that **must be registered with STORIS** so that it can be sent to the UTG to be processed." **Hard caveat, verbatim: "There is currently NO WAY TO VALIDATE the choice of `Terminal ID` and `UTG`; therefore, THE PROGRAM MUST ACCEPT THE CHOICE AS ENTERED."** **A typo here produces a terminal that silently fails to process cards.** |
| `Location` | Store or warehouse location (FK, dropdown) | The location the terminal belongs to. **"If the selected location has ONE UTG assigned to it, that UTG defaults in the `UTG` field WHERE IT CANNOT BE CHANGED; if the selected location has MORE THAN ONE UTG, the `UTG` field becomes ACTIVE and can be changed."** |
| `Description` | Text, **max 30 characters**, multilingual | Shown next to the Terminal ID wherever a selection is offered (e.g. `Payment Terminal`). Action button opens **`Description Field - Language Translation Entry`**. |
| `UTG` | UTG (dropdown) | The Universal Transaction Gateway associated with the terminal. **"Available ONLY if more than one UTG is associated with the selected location."** **"This field is active only if using EMV - Shift4; this field is INACTIVE if using EMV - Tender Retail."** Same "no validation" caveat repeated. |
| `Signature Capture` | Checkbox — **default CHECKED** | Whether this payment terminal can capture signatures digitally. In the grid, checked renders as **`Yes`** and unchecked as **`No`** in the `Signature Capture` column. **Defaulting to "this device can capture signatures" is optimistic; a wrong value here means signatures are silently not captured on a device that cannot do it, or are requested from one that cannot.** |
| Grid | Read-only rows | Existing EMV terminals. **Add** with the green `Add` button; **edit** by double-clicking a row (fields populate above); **delete** by double-clicking then clicking the red `Remove` button. **[GUARDED] — the article documents no check for a terminal in use, no soft-delete, and no history. Removing a TID that appears on historical transactions loses the link between a card transaction and the device that took it — a PCI/forensics problem.** |

**Fields — `Tethered Terminal`**

**Tethered Terminal ID hierarchy (verbatim).**
- **"The device selected at User Log In determines where the customer's signature is sent."**
- **"Within Warehouse/Store Location Settings, if `EMV Enabled`, `Signature Capture Enabled`, and
  `SHIFT4 Enabled` are active, the user can choose what device the signature is sent to."**
- **"If the `Payment Terminal` is selected, `Tethered Terminal` MAY NOT be selected."** (mutually exclusive)
- **"If you are logging onto a touch mobile device, `Current Mobile Device` receives the customer's
  signature."**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Terminal ID` | Alphanumeric, unique | ID of the tethered device, registered with STORIS. **Hard validation, verbatim: "The Tethered Terminal ID may NOT be `"NEW"` or ANY PHRASE CONTAINING `"NEW"` (such as `NEW-1`)."** — a reserved-word collision leaking into user-facing validation. |
| `Location` | Store or warehouse location (FK) | Location association. |
| `Description` | Free-form text, **multilingual** | Description of the device. (no length limit stated, unlike the EMV description's 30 characters — **[CONFLICT]/gap**) |
| `Network Name` | **Display-only**, pre-populated by device registration | **"The network name populated CANNOT BE CHANGED by the system administrator, it is used by STORIS to communicate with the selected device."** |
| Grid | Read-only rows | Same Add / double-click-to-edit / Remove mechanics as the EMV grid. |

**Behavior & rules — the hard ones.**
- **No validation of `Terminal ID` or `UTG` at all** — the vendor states this twice. Terminal registration is
  a typo away from a store that cannot take cards.
- **The reserved word `"NEW"`** (and anything containing it) is rejected for tethered IDs — a legacy sentinel
  value surfacing as a business rule.
- **The TID hierarchy has an internal contradiction** (empty vs cash-drawer default) and ends with
  **"the user may change it at login"** and **"the Payment Summary Window allows a user to change the TID"** —
  so the terminal a transaction is attributed to is ultimately operator-chosen, at two points.
- **Payment terminal and tethered terminal are mutually exclusive per session.**
- **Terminal rows are hard-deleted from a grid.**

**Dependencies.** `SCS-053` Payment Card and Device Settings (`Processor`, `Shift-4 Local EMV`, signature
settings, `Manual Authorization at Non-Process Locations`); `SCS-038` General System Control Settings
(`Signature Capture` master flag); Warehouse/Store Location Settings (`EMV Enabled`,
`Signature Capture Enabled`, `SHIFT4 Enabled`, UTG assignment per location) — `CFG-LOC-*`;
`Create a User` (per-user TID assignment) — `parts/user-security-CATALOG.md`; `SCS-012` Cash Balancing
Control Settings and `SCS-055` (`Use Cash Drawers`, `Default Payment Terminal` on the cash drawer);
`STORIS Payment Summary Window`; the STORIS log-in screen; Shift4 UTG.

**Build notes.**
- New IDs: `CFG-TERMINAL-EMV` (table: `{terminal_id, location_id, description_i18n, utg_id,
  signature_capture}`), `CFG-TERMINAL-TETHERED` (table: `{terminal_id, location_id, description_i18n,
  network_name}`), plus `CFG-TERMINAL-DEFAULT-RESOLUTION` for the hierarchy.
- **Do differently — validate device registration against the gateway.** A terminal record should be
  **verified** (a test transaction or a gateway lookup) before it can be used, and its status shown in the
  grid. "The program must accept the choice as entered" is not acceptable for payment infrastructure.
- **Do differently — never hard-delete a terminal.** Deactivate. Every card transaction must retain an
  immutable reference to the device that processed it, for chargeback defense and PCI forensics.
- **Do differently — the device used should be derived, not chosen.** Bind a terminal to a workstation or a
  session at registration; let an operator change it only with a reason, and log the change. Two
  user-controlled opportunities to change the attributed terminal is a reconciliation problem.
- **Do differently — no reserved words in user-entered identifiers.** If `"NEW"` is a sentinel internally,
  that is an implementation detail that must not reach validation rules.
- Keep: the location→UTG defaulting (auto-select when unambiguous, prompt when not) and the multilingual
  device description.
- `[DECISION NEEDED]` Payment device topology at LA Mattress — countertop terminals per register, mobile
  devices on the sales floor, or both. `SCS-053`'s `Shift-4 Local EMV` (pin pad per workstation) vs
  Traditional UTG is the same decision.

---

### `SCS-078` Test Email Server Connection
*storis_ref: article 15186501361428*

**Purpose.** (Article is nearly a stub — one modal with three display-only fields and a `Run` button.)
Sends a **test email to the logged-on user's own address** to verify email server configuration.

**Where it lives.** "This screen appears when you click on the **`Test Email`** button in the
**Notifications Control Settings** (`SCS-050`)."
**[CONFLICT] — `SCS-050` documents four separate test buttons (`Send Test Email from STORIS Host Server`,
`Send Test Email from Workstation to Email Server`, `Test Notifications Server Connections`,
`Send Test Email from Notifications Server`) and none of them is named `Test Email`. Which button opens this
screen is undocumented.**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `To Email Address` | **Display-only** | "The send-to email address appears." Per the intro, this is **the log-on user's email address** — the test always goes to yourself. |
| `From Email Address` | **Display-only**, defaults | "Displays the email address of the log-on user." **So the test sends from the user to the user — it does NOT exercise the configured `"From" Email Address` from `SCS-050`.** Flagged: a passing test does not prove production sends will work. |
| `Email Server Name` | **Display-only**, defaults | The configured email server name. |
| `Run` | Button | Sends the test email. |

**Behavior & rules.**
- **Verbatim troubleshooting instruction:** "If an email does not appear in the log-on user's inbox and you
  are sure the email address is correct, **contact STORIS**." — **no error text, no SMTP response, no log.
  The only diagnostic is "did it arrive?"**
- **The test uses the logged-on user's address for both From and To**, so it does not validate the sender
  identity, SPF/DKIM alignment, the `"From" Email Name`, or deliverability to an external recipient — the
  three things that actually break in production email.
- All three fields are display-only, so **the test cannot be pointed at another address** to check external
  deliverability.

**Dependencies.** `SCS-050` Notifications Control Settings (all email server, OAuth2, and Notifications
Server fields; the four test buttons); the User file (log-on user's email address).

**Build notes.**
- No settings IDs — this is a diagnostic tool, and the requirement is to build **a better one**.
- **Do differently — a real connectivity test.** Ours should: let the operator enter **any** destination
  address; send **as the configured production sender**; display the **full SMTP/API transcript** including
  response codes; check **SPF, DKIM and DMARC alignment** for the sending domain; and write the result to a
  visible history so "it worked last Tuesday" is answerable.
- **Do differently — surface errors, never "contact the vendor".** Every failure mode should name the field
  that is wrong.
- Pair this with the `SCS-050` build note about **an asynchronous delivery log with a visible failure queue**;
  a test button is a poor substitute for observability.
- **Note for the coverage matrix:** thin article, kept for completeness and because it exposes a real gap in
  how STORIS validates its own email configuration.

---

### `SCS-079` Third Party Finance Application Control Settings
*storis_ref: article 15186502670228*

**Purpose.** Controls the **field-by-field entry rules** for standard third-party finance credit
applications — for every field on the Primary Applicant and Co-Applicant screens, whether it is optional,
mandatory, or hidden, and whether a default may be supplied.

**Where it lives.** The article gives no menu path (**content gap**); by convention it sits under
`System Administration > System Settings > Accounting System Settings`. **Tabs: `Primary Applicant`,
`Co-Applicant`.**

> **Structure, verbatim:** "For **each field** on the Primary Applicant and Co-Applicant entry screens,
> **there is a corresponding entry in this program**." So this screen is a **row-per-application-field
> configuration grid**, and the article documents the three grid columns rather than the fields themselves.
> **The set of application fields is not enumerated anywhere in the article — a significant content gap, and
> the one thing we would most need to reproduce the screen.**

**Fields (grid columns)**

| Column | Type | Purpose / business rule |
|---|---|---|
| `Entry Description` | Read-only text | "The description in this column corresponds to the **entry field label on the application entry screen**." |
| `Entry Type` | Enum: **`Optional`** (default), **`Mandatory`**, **`Not Needed`** | Whether the field is optional, required, or suppressed during application entry. **"The default for each field in this column is `Optional`."** |
| `Force Re-Entry` | Checkbox | Checked → **"users must ALWAYS enter new information when prompted."** Blank, with `Entry Type` = `Optional` or `Mandatory` → **"the system supplies a DEFAULT (if available) for the field during application entry."** **"If the entry type for the field is `Not Needed`, leave this box blank."** |

**Behavior & rules.**
- **Co-applicant suppression, verbatim:** "If the provider you use **does not accept co-applicants**, ALL
  fields on the `Co-Applicant` tab **should be set to `Not Needed`**. If your control settings are set in
  this way, **the `Co-applicant` check box and button are NOT ACTIVE on the application entry screen.**"
  **A whole feature is disabled by setting every row of a grid to a value — there is no single switch, so it
  is easy to leave one row non-`Not Needed` and half-enable co-applicants.**
- **`Force Re-Entry` unchecked means the system pre-fills a consumer credit application from stored data.**
  That is convenient and dangerous: an applicant's income, employment, or address can be carried forward
  from an old record into a **new credit application that the lender will rely on**. **Flag hard — this is a
  data-accuracy and potentially a fair-lending/misrepresentation exposure.** The safe default is
  `Force Re-Entry` checked for anything the applicant attests to.
- **`Entry Type` defaults to `Optional` for every field**, which means the shipped configuration collects an
  incomplete application and lets the lender decline for missing data.
- **This screen decides what PII is collected.** Setting a field to `Mandatory` compels collection of
  identity, income, employment and possibly SSN data; setting it to `Not Needed` avoids collecting it.
  **It is therefore a data-minimization control and should be reviewed as one** — the same category as
  `Fields to Capture` in `SCS-067` and `Prohibit Customer Personal Information when not Required by Sale`
  referenced in `SCS-054`.
- **No validation rules, formats, or cross-field dependencies are configurable here** — only
  presence/absence and default behavior.

**Dependencies.** `SCS-017` Credit Application Control Settings (part A); `SCS-045` Maintain Credit
Application Letter Print UNC Path; `SCS-036` Financing Control Settings; `SCS-064` Revolving Receivables
Control Settings (the in-house alternative); `SCS-054` Point of Sale Control Settings
(`Warn if Primary Email exists for other Customers` — its list explicitly includes
`Standard Finance Credit Application - Primary`, "including primary and co-applicant information as well as
to specific finance providers"); `Request Credit Information / Credit Application Entry`;
Finance Provider Settings; Advanced Customer Settings; encryption of stored SSNs (wave 1's
"unchecking an encryption box bulk-decrypts every stored SSN" finding in General System Control Settings);
`SAR-024` Report Secured Decryption Activity.

**Build notes.**
- New IDs: `CFG-FINAPP-FIELD-RULES` — a table `{applicant_role: 'primary'|'co', field_key,
  entry_type: 'optional'|'mandatory'|'not_needed', force_reentry: bool}`, plus
  `CFG-FINAPP-ALLOW-COAPPLICANT` (an explicit switch, see below).
- **Do differently — add an explicit `co-applicant supported` flag** rather than inferring it from "every row
  is Not Needed". Derive the tab's availability from the flag, and grey the rows accordingly.
- **Do differently — `Force Re-Entry` defaults to CHECKED** for every attested field (income, employment,
  housing cost, SSN, DOB). Pre-filling a credit application from stale data is not a convenience we should
  ship. Where pre-fill is allowed, **show the applicant the pre-filled value and require confirmation**, and
  record that confirmation.
- **Do differently — per-provider rule sets.** Field requirements are a property of the **finance provider**,
  not of our system; model them as provider-scoped configuration (`VENDOR_*`-style scope) so switching or
  adding a provider does not mean re-keying a global grid.
- **Do differently — collect the minimum.** Default `Entry Type` to `not_needed` and require a deliberate
  decision to collect each PII element, with the business justification recorded next to it.
- **Every application entry, and every field pre-filled rather than re-entered, must be logged to
  `RPT-AUDIT`** — including who submitted it and to which provider.
- `[DECISION NEEDED]` Which finance providers LA Mattress uses, whether co-applicants are supported, and
  whether any applicant PII is stored by us at all (strongly prefer: submit to the provider, store only a
  token and the decision).
- `[DECISION NEEDED]` Legal review of adverse-action notice obligations if we surface decline decisions
  (see `SCS-045`).

---

### `SCS-080` Third-Party Accounting Control Settings
*storis_ref: article 15186453250196*

**Purpose.** Control settings for the **third-party accounting (TPA) interface** — the general controls, plus
package-specific tabs for **Intuit/QuickBooks** and for a **Generic** export interface.

**Where it lives.** Three documented access paths:
`Accounting > General Ledger > General Ledger Settings > Third Party Accounting Control Settings`
`Accounting > Third Party Accounting > General Ledger > General Ledger Settings > Accounting Control Settings
> Third Party Accounting Control Settings`
`Accounting > Settings > General Ledger Settings > Third Party Accounting Control Settings`
**Tabs: `General`, `Intuit`, `Generic`.** "The `General` tab contains controls not specific to any particular
accounting package."

**Fields — `General`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Item Code for Customer Refunds` | Item code | "The item code to use when **adding a customer return**." Superseded for multi-company by `Multi-Company Refund Item Code` on the Intuit tab. |
| `Date of Last GL Synchronization` | **Read-only** date | Date the **GL Account Synchronization** last ran. **"You SHOULD RUN THE GL SYNC after adding a new account to your TPA package."** — **a manual step with no enforcement; a new GL account in QuickBooks is invisible to STORIS until someone remembers.** |
| `Days Before Purging History Log` | Integer days | **[DESTRUCTIVE]** Days before the **TPA history log** is purged. **The TPA history log is the evidence of what was transmitted to the accounting system. No range, default, or blank behavior documented — [TRISTATE] risk.** |
| `Summarize GL Postings` | Checkbox | Checked → GL postings are **summarized** before transmission to the TPA. Blank → transmitted **in detailed format**. **[IRREVERSIBLE in effect — once summarized postings have been transmitted, the detail does not exist on the accounting side. Reconciling a summarized period back to source transactions requires the STORIS-side detail, which `Days Before Purging History Log` will eventually destroy.]** |
| `Summarize By Company, By date` | Enum: **`By Posting Source, By Account`**, **`By Account`** | Only meaningful when `Summarize GL Postings` is checked. **`By Posting Source, By Account`** — "the system combines **only those GL batches that have the SAME posting source**." **`By Account`** — "the system combines GL batches with **DIFFERENT posting sources**." **The field's label ("By Company, By date") does not match either of its documented values. [CONFLICT] in the source.** **Choosing `By Account` destroys the posting-source dimension, which is what tells you whether a GL amount came from sales, receiving, payables or an adjustment.** |

**Fields — `Intuit`**

> **Vendor warning, verbatim:** "If using the **Intuit Integrated Financials** interface, STORIS comes
> delivered with **default settings for QuickBooks®. We strongly advise you not change these settings, with
> the following exception: `Use Account Numbers (QB Only)` — this setting should be determined by your
> company."** **(Compare `SCS-052`, whose QuickBooks warning permits three exceptions. Two screens, two
> different exception lists.)**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Default Vendor Type` | Vendor type | "The default vendor type that **QuickBooks® assigns to vendors transferred from STORIS**." |
| `Optimal Number of Transactions` | Integer | "Used for **fine-tuning the performance of data transmissions** between STORIS and QuickBooks®." — a batch size. **No range or default documented.** |
| `Use Account Numbers (QB Only)` | Checkbox | Checked → **account NUMBERS** rather than **account NAMES** are used in QuickBooks. **The one setting the vendor says the customer should decide.** **[GUARDED] — switching this changes how every posting is matched to a QuickBooks account; doing it mid-period will mis-post or fail.** |
| `QuickBooks Version` | Enum: **`United States`**, **`Canada`** | Which QuickBooks edition is in use. |
| `QuickBooks 2010 or Above` | Checkbox | "If using QuickBooks, and your release is 2010 or above, check the box." |
| `QuickBooks 2010 or Above` *(second occurrence)* | Checkbox | **The article documents this field TWICE with the same name; the second says "This field is active ONLY if you set your `QuickBooks Version` to `Canada`."** **[CONFLICT] — either there are two identically-named fields (US and Canada variants) or the documentation is duplicated. Must be verified.** |
| `Multi-Company Refund Item Code` | Item code | Code transmitted to QuickBooks for **multi-company refunds**. **"For multi-company refunds, this code SUPERSEDES the code entered at the `Item Code for Customer Refunds` field on the General tab."** "You associate this code with a GL account in QuickBooks in the same way you set up a receivables account for single-company refunds." |

**Fields — `Generic`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Allow Multiple Export Files at One Time` | Checkbox | **Inverted-sense field, verbatim: "To PREVENT the system from CHECKING FOR EXISTING EXPORT FILES, check the box."** **[DANGEROUS] — the box named "allow multiple export files" actually disables the safety check that stops a second export from being produced (or overwriting one) while an earlier file is still unprocessed. That is how the same GL batch gets posted twice, or a batch gets lost.** |
| `Allow Transmitted AP Bill Deletion` | Checkbox | **[DANGEROUS]** "To allow users to **delete AP Bills that have ALREADY BEEN TRANSMITTED** to the generic interface, check the box." **Deleting a bill that has already been sent to the accounting system leaves the two systems permanently out of balance, with no reversing entry. This is the clearest "silently destroys reconcilability" setting in part B's accounting screens.** |

**Behavior & rules — the hard ones.**
- **`Allow Transmitted AP Bill Deletion` breaks reconciliation between the ERP and the accounting system**,
  by design, with no compensating entry.
- **`Allow Multiple Export Files at One Time` disables a duplicate/overwrite guard** and is named as if it
  grants a capability.
- **`Summarize GL Postings` + `By Account` collapses the audit dimension** of GL postings before they leave
  the building; the only remaining detail is the TPA history log, which is on a purge clock.
- **GL account synchronization is manual and unmonitored** — the screen shows a date but nothing warns when
  it is stale.
- **Whether TPA is active changes behavior in two other screens:** `SCS-052`'s `Allowable Cost Variance` is
  **inactive if TPA is active**, and `SCS-058`'s definition of a **"closed" purchase order** changes
  (received **and** AP-approved in full, vs merely received) — which in turn changes what
  `Days to Keep Closed Purchase Orders` purges. **Enabling TPA silently rewires invoice matching and PO
  retention.**
- **Two screens give contradictory "do not change the QuickBooks defaults" exception lists.**

**Dependencies.** `SCS-037` General Ledger Control Settings; `SCS-052` Payables Control Settings
(`Allowable Cost Variance` disabled under TPA; QuickBooks default-settings warning; AP bills);
`SCS-058` Purchasing Control Settings (`Days to Keep Closed Purchase Orders` definition of "closed" depends
on TPA); `SCS-084` Vendor Receivables Control Settings; `SCS-064`/`SCS-002` receivables (refund item codes);
Company Settings (`COMPANY` scope — multi-company refunds); GL Account Synchronization;
`Accounting in STORIS`; Intuit Integrated Financials / QuickBooks; the Generic export interface.

**Build notes.**
- New IDs: `CFG-TPA-REFUND-ITEM-CODE`, `CFG-TPA-HISTORY-RETENTION-DAYS`, `CFG-TPA-SUMMARIZE-GL`,
  `CFG-TPA-SUMMARIZE-LEVEL`, `CFG-TPA-QB-DEFAULT-VENDOR-TYPE`, `CFG-TPA-QB-BATCH-SIZE`,
  `CFG-TPA-QB-USE-ACCOUNT-NUMBERS`, `CFG-TPA-QB-VERSION`, `CFG-TPA-QB-2010-PLUS`,
  `CFG-TPA-QB-MULTICOMPANY-REFUND-ITEM`, `CFG-TPA-GENERIC-ALLOW-MULTIPLE-EXPORTS`,
  `CFG-TPA-GENERIC-ALLOW-DELETE-TRANSMITTED`.
- **Do differently — a transmitted document is immutable.** `CFG-TPA-GENERIC-ALLOW-DELETE-TRANSMITTED` should
  not exist. Correcting a transmitted AP bill is a **reversal plus a new bill**, both transmitted, both
  logged. This is non-negotiable for reconcilability.
- **Do differently — export batches are idempotent and tracked.** Each batch gets an id, a checksum, a
  status (`built` → `transmitted` → `acknowledged`), and the system refuses to build a new batch while an
  unacknowledged one exists. That replaces `Allow Multiple Export Files at One Time` entirely, in the safe
  direction.
- **Do differently — always transmit detail, summarize on the accounting side if the accountant wants it.**
  If summarization is required by the target package, retain the full detail **and the summarization
  mapping** on our side, permanently, and reconcile automatically.
- **Do differently — GL account sync is automatic and monitored.** Alert when the chart of accounts differs
  or when the sync is stale (this belongs with `SCS-074`/`SCS-075`'s alerting).
- **Do differently — retention.** `CFG-TPA-HISTORY-RETENTION-DAYS` gets a policy floor tied to the statutory
  retention period for financial records, and archives rather than purges.
- **Make TPA-conditional behavior explicit.** If enabling third-party accounting changes invoice matching
  and PO closure semantics, that must be stated at the point of enabling, with the affected settings listed.
- `[DECISION NEEDED]` **Native GL vs third-party accounting for LA Mattress.** This is a foundational
  decision: under TPA, three-way invoice matching moves outside the ERP (`SCS-052`'s `Allowable Cost
  Variance` goes inert), PO closure changes meaning, and reconciliation becomes an integration problem.

---

### `SCS-081` TPA Transmission Phantom
*storis_ref: article 15186501362836*

**Purpose.** The background ("phantom") process that **automatically transmits third-party-accounting
transactions at defined daily intervals**, for STORIS Accounting users.

**Where it lives.** Activated via the **`Auto Start Transmission`** field on the **STORIS Accounting** tab of
the **TPA Control Settings** (`SCS-080`); configured in **`Phantom Process Settings`**; operated via
**`Administer Phantom Processes`**.

**Fields / settings**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Auto Start Transmission` (on TPA Control Settings, STORIS Accounting tab) | Checkbox | Activates the TPA Transmission phantom. **This field is not documented on the `SCS-080` article — the "STORIS Accounting" tab is not among the three tabs that article lists (`General`, `Intuit`, `Generic`). [CONFLICT]/content gap between the two articles.** |
| Phantom selection | `TPA.403.PTM` | In `Phantom Process Settings`, the `Action` button at the `Process` field lists phantoms; select **`TPA.403.PTM`**. **"STORIS has already entered the RECOMMENDED SETTINGS for this phantom. No other fields require a response. If you want to change an existing setting, CONTACT YOUR STORIS REPRESENTATIVE FIRST."** |
| — | — | The article then lists three items with no explanation, apparently the transaction classes the phantom transmits: **`GL Batch Creation`**, **`AP Bill Creation`**, **`Shared file update (includes AP Bill deletion)`**. **Content gap — these are named and never described.** |

**Behavior & rules.**
- **The critical rule, verbatim and flagged by STORIS itself as "Important!":** "**Unlike the batch TPA
  transmission, the auto-transmission process DOES NOT RE-TRANSMIT REJECTED `GL.POST` AND `AP.BILL` RECORDS
  from prior transmissions. You must address the reason for rejection and then MANUALLY RESUBMIT the record
  for transmission.**" **[DANGEROUS] — a rejected GL posting or AP bill is silently left behind by the
  automatic process forever. The ERP and the accounting system diverge, and nothing re-tries, and the article
  names no report, alert, or queue for finding rejected records.** This is the counterpart to `SCS-080`'s
  `Allow Transmitted AP Bill Deletion`: one setting lets you delete what was sent, this process quietly drops
  what was rejected. **Together they are the two ways TPA reconciliation breaks.**
- **`Shared file update (includes AP Bill deletion)`** implies the phantom also transmits **deletions** —
  consistent with `SCS-080`'s deletion setting and equally hazardous.
- **`Administer Phantom Processes`** is the operational surface: "manually **start, stop, and suspend**
  phantom processes as well as **view the log**. The **`Count`** column of the grid displays the number of
  transmissions initiated by the process." **A count is the only health metric.**
- **STORIS Accounting users only** — this whole article is inapplicable under a pure third-party accounting
  arrangement, which is itself confusing given the screen is called *TPA* Transmission.

**Dependencies.** `SCS-080` Third-Party Accounting Control Settings (`Auto Start Transmission` on the STORIS
Accounting tab; `Allow Transmitted AP Bill Deletion`; summarization); `SCS-037` General Ledger Control
Settings; `SCS-052` Payables Control Settings (AP bills); `Phantom Process Settings`;
`Administer Phantom Processes`; the `GL.POST` and `AP.BILL` files; `Schedule a Process`;
`SCS-074` STORIS Messenger Control Settings (where a rejection alert *should* go).

**Build notes.**
- New IDs: `CFG-TPA-AUTOTRANSMIT-ENABLED`, `CFG-TPA-AUTOTRANSMIT-SCHEDULE`.
- **Do differently — rejections are a first-class queue, not a silent drop.** Every transmitted record has a
  status (`pending` → `transmitted` → `accepted` | `rejected`), rejections carry the provider's reason,
  and a **visible failure queue** with counts and ages sits on the accounting dashboard. Automatic retry with
  backoff for transient failures; human resolution for business rejections. **Never a fire-and-forget job.**
- **Do differently — reconcile continuously.** A daily job that compares ERP-side GL/AP totals with the
  accounting system's and alerts on any variance is worth more than the transmission job itself.
- **Do differently — "contact your STORIS representative before changing this" is not a design.** Job
  configuration (interval, batch size, retry policy) belongs to us, with sensible defaults and documentation.
- **Alerting:** transmission failure and non-empty rejection queues must page someone (see `SCS-074`/`SCS-075`
  build notes — one alerting system, mandatory recipients, escalation).
- `[DECISION NEEDED]` Same as `SCS-080`: native GL vs third-party accounting. This article only matters under
  STORIS Accounting **with** a TPA interface, which is a narrow hybrid we may not need at all.

---

### `SCS-082` Transaction Entry - User Log In Screen
*storis_ref: article 15186452147092*

**Purpose.** The modal that demands a **user ID and password before creating or editing a transaction**, when
`Verify User ID During Entry` is active for that order type. Documents the credential-override behavior that
`SCS-054`, `SCS-060` and `SCS-070` all refer to.

**Where it lives.** Not a menu item. It appears inside entry routines. **"This screen appears ONLY if the
`Verify User ID During Entry` field is active for the CURRENT ORDER TYPE. For example, if entering a service
order and this screen appears, the `Verify User ID During Entry` field is active in the Service Control
Settings."**

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `User ID` | Alphanumeric, **up to four characters** | "To access the order-entry screen, enter your STORIS User ID." **A four-character user ID namespace is small enough that ID reuse after staff turnover is likely — which matters because this ID becomes the attribution on the order.** |
| `Password` | Password | "Passwords reside in the `Create a User` settings. You can change a user password at any time via `Create a User`. **(If using complex passwords, you CANNOT change the password via `Create a User`.)**" **Hard gate, verbatim: "For this field to be active, EXTENDED SECURITY MUST BE ACTIVE via the General System Control Settings."** — **the wave-1 global kill-switch again: with Extended Security off, the password field is inactive and the whole verification mechanism is inert.** **"If using Complex Passwords, the password you enter must conform to PCI requirements."** |

**Behavior & rules — the credential-override semantics (verbatim).**
- "Once you enter a valid user ID and password, **your user credentials OVERRIDE the log-on user's
  credentials for the current order so that YOUR SECURITY SETTINGS AND LOCATION RESTRICTIONS (if any)
  APPLY**."
- "The **Order Comments Log** makes a record of your edits."
- "Once you save the order, **the log-on user's credentials again take precedence in the system**. However,
  the system records all your edits, and **if you attempt to access the order again, THIS SCREEN WILL APPEAR
  AGAIN**."
- **"Anytime you edit the `Create a User` settings, YOU MUST RESTART YOUR SESSION for the change to take
  effect."** — **permission changes are not live; a revoked permission remains in force until the user logs
  out. That is a security defect worth naming explicitly.**

**Analysis — why this matters more than its size suggests.**
- **This is a genuine session-scoped privilege substitution.** It can *elevate* (a manager unlocks an action
  the cashier cannot perform) **or** *restrict* (the verifying user has tighter location restrictions than
  the logged-on user, which then apply). Both directions are live.
- **It is the mechanism behind three separate control settings** (`SCS-054` `Point of Sale User
  Verification` for sales orders / exchanges / returns / dollar adjustments; `SCS-060` for quick sales;
  `SCS-070` for service orders) and it is **inactivated system-wide when cash balancing by cashier is on**.
- **The only audit is a comment in the Order Comments Log.** There is no security event, no failed-attempt
  record, and per wave 1 no general change-audit log. **A shared or borrowed password leaves nothing but a
  free-text comment.**
- **The four-character ID plus "you must restart your session" plus "Extended Security must be active"**
  combine into a weak identity story for what is functionally a manager-override mechanism.

**Dependencies.** `SCS-038` General System Control Settings (**Extended Security** master switch;
Complex Passwords / PCI); `SCS-054` Point of Sale Control Settings (`Point of Sale User Verification` group);
`SCS-060` Quick Sale Control Settings (`Verify User ID During Entry`); `SCS-070` Service Control Settings
(`Verify User ID During Entry`); `SCS-012` Cash Balancing Control Settings (cash balancing by cashier
inactivates all three); `Create a User` and `parts/user-security-CATALOG.md`; Order Comments Log.

**Build notes.**
- No new settings IDs (the switches live on the three control screens). The requirement here is the
  **mechanism**.
- **Do differently — separate authentication from authorization attribution.** As noted under `SCS-060`:
  the session's principal does not change. A verification produces an **approval record**
  `{approver_user_id, approved_action, transaction_id, timestamp, reason}` attached to the transaction, and
  the approver's permission is what is checked for the specific privileged action. This preserves
  accountability for both people and eliminates the "whose location restrictions apply?" ambiguity.
- **Do differently — permission changes take effect immediately.** No "restart your session".
- **Do differently — log every verification attempt, success and failure**, to `RPT-AUDIT`, not to a free-text
  order comment. Rate-limit failures.
- **Do differently — no shared secrets for overrides.** Manager approval should use the manager's own
  authenticated session (a scan, a PIN tied to an individual, or an approval request to their device) —
  never a typed password at someone else's keyboard, which is how override credentials get shared.
- **Do differently — user IDs are opaque and never reused.** Four characters is not enough.
- `[DECISION NEEDED]` What actions require a second-person approval at LA Mattress (price override below
  cost, return past window, refund over a threshold, pre-auth increase, backdating), and what the approval
  UX is. Several settings across part B assume this mechanism exists.

---

### `SCS-083` Twilight Discount Pricing Settings
*storis_ref: article 15186502670612*

**Purpose.** Defines the **twilight discount pricing** scheme — a schedule by which the price of **As-Is
inventory** decreases automatically the longer an item remains unsold.

**Where it lives.** `System Administration > System Settings > Customer System Settings > Pricing System
Settings > Twilight Discount Pricing Settings`.

> **Scope, verbatim:** "**Twilight discount pricing applies to As-Is inventory ONLY.**"
> **Override, verbatim:** "You can also apply Twilight pricing via the **Category Settings**. **Twilight
> pricing by category OVERRIDES any twilight pricing you specify here.**" — category → system precedence.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Period Measurement` | Enum: **`Months`**, **`Days`** | The unit of time for the scheme. |
| `Reduction Period` | Integer (in the chosen unit) | "The amount of time that must elapse before the system applies twilight discount pricing." **Off-by-one rule, verbatim: "if you set your reduction period to 7 days, the system applies twilight discount pricing on the 8TH DAY."** **Hard construction rule for a recurring schedule, verbatim: "For continuous twilight pricing (for example, every 7 days until an item is sold) THE TABLE MUST BE BUILT SO THAT EACH TWILIGHT PERIOD BUILDS UPON THE PRIOR desired amount of time (in this case every 7 days): 7 days, 14 days, 21 days, 28 days, etc."** — **the periods are CUMULATIVE from the start, not intervals; and a recurring markdown must be entered as an explicit row per step, so the schedule eventually runs out and the price stops falling.** |
| `Reduction Percent` | Percentage | "The discount percentage to apply to a twilight product's **As-Is STARTING price** when a reduction period expires." **Critical: each row's percentage applies to the AS-IS STARTING PRICE, not to the previously reduced price — so the reductions do NOT compound. A 10% row at 7 days and a 20% row at 14 days yields 90% then 80% of the original, not 90% then 72%.** Flagged, because the naive reading is compounding. |
| `Line Discount Rounding Method` | Enum: **`None`**, **`Up`**, **`Down`**, **`Nearest`** | Rounding applied to the new sale price. `None` — no rounding. `Up` — to the higher dollar/cent amount. `Down` — to the lower. `Nearest` — "to the lower or higher dollar/cent amount, whichever is closest to the new number". |
| `Round To` | Enum: **`None`**, **`Penny`**, **`Dime`**, **`Dollar`**, **`Ten`**, **`Hundred`**, **`Thousand`** | Rounds to a monetary decimal. **"This field and the `End In` field are MUTUALLY EXCLUSIVE. If you use this field, the `End In` field is INACTIVE."** |
| `End In` | Currency ending value | Rounds to a price **ending**. **Mutually exclusive with `Round To`.** Worked examples, verbatim: **`4.99` + `Up`** → "the system rounds each sale price to the next highest number that ends in `4.99`. The sale price calculated by the system as `$24.31` would be changed to **`$24.99`**"; **`.99` + `Down` or `Nearest`** → `$24.31` "would be lowered to **`$23.99`**". **(Same internally inconsistent example as `SCS-063` — `$24.31` → `$24.99` is an ending of `.99`, not `4.99`. The two articles share the copy and the error.)** |
| Grid | Rows of `{Reduction Period, Reduction Percent}` | "To edit an item, **double click** on it in the grid. To enter a new discount, click on **`Add`** or **`Clear`** until the `Reduction` field is empty." |

**Behavior & rules — the hard ones.**
- **Reductions are computed from the As-Is starting price, not cumulatively.** Getting this wrong either
  under-discounts (never clearing the floor sample) or over-discounts (selling below cost).
- **The schedule is a finite table of cumulative elapsed-time thresholds**, not a recurring rule. An item
  that outlives the last row stops being marked down.
- **`Reduction Period` is exclusive** — the discount applies on the day *after* the period elapses.
- **Category-level twilight pricing wins over this screen entirely** (not per-field — "overrides any twilight
  pricing you specify here"). **[GUARDED] — adding a category-level scheme silently disables the global one
  for that category's products.**
- **Nothing here references cost.** A twilight schedule can drive an As-Is price below cost with no check;
  the `Selling Price is Below Cost` alert in `SCS-054` is a *manual price change* alert, and it is not
  documented as applying to automatic twilight reductions. **[CONFLICT]/gap — flag.**
- **Interaction with `SCS-054`'s `Assign Price on As-Is Items` / `Assign Price on Floor Sample Items`:** those
  settings pin a piece's price at the moment it becomes As-Is and state that "**the price of the product is
  not impacted by general pricing changes**". **Whether a twilight reduction counts as a "general pricing
  change" (and is therefore suppressed) is not documented anywhere. This is a real, unresolved contradiction
  between two screens that both claim to own As-Is pricing.**

**Dependencies.** Category Settings (overriding twilight scheme); `SCS-054` Point of Sale Control Settings
(`As-Is/ Floor Sample Pricing` group, `Return Pieces to As-Is`, `Selling Price is Below Cost`,
`"As Is" Line Item Text to Print on Order`, discount rounding); `SCS-016` Costing Control Settings
(`CFG-COSTING-*` — cost floor); `SCS-063` RetailDeck Control Settings (shares the rounding model);
`SCS-044` Legal Code Settings → `SCS-043` Inventory Control Settings (the `Repossession` / as-is reason
codes); `Twilight Inventory Adjustments` and `Enter a Stock Adjustment` (named in `SCS-054`);
`Pricing Rules`; PIN (Piece INventory) records.

**Build notes.**
- New IDs: `CFG-TWILIGHT-PERIOD-UNIT`, `CFG-TWILIGHT-SCHEDULE` (`[{elapsed, reduction_pct}]`),
  `CFG-TWILIGHT-ROUNDING-METHOD`, `CFG-TWILIGHT-ROUND-TO`, `CFG-TWILIGHT-END-IN`.
- **Do differently — express the schedule as a rule, not a table.** Support both an explicit step table
  **and** a recurring rule (`every N days, −X% of original, floor at Y`), so a floor sample cannot stop being
  marked down because the table ran out.
- **Do differently — a mandatory price floor.** Never let an automatic markdown take a piece below
  `cost × floor_multiple` (or below a configured absolute floor) without an alert and an override.
  This is the single most important addition.
- **Do differently — resolve the As-Is pricing ownership contradiction explicitly.** Decide once whether a
  piece's price is pinned at As-Is conversion or continues to be driven by the twilight schedule, and make
  the answer visible on the piece.
- **Do differently — make the non-compounding basis explicit in the UI** ("−20% of original price → $X"),
  with a preview of the full markdown ladder and the resulting margin at each step.
- **Do differently — record every automatic markdown** on the piece (old price, new price, rule, date) and
  feed it to `RPT-AUDIT`. An automatic price change with no trail is indistinguishable from an unauthorized one.
- Keep: the **`Round To` / `End In` mutually-exclusive rounding model** — it is the same good model as
  `SCS-063` and should be a **shared, reusable pricing-rounding component** used by twilight pricing, import
  pricing, promotional pricing and manual markdowns alike. Fix the documented example's inconsistency in our
  own docs.
- `[DECISION NEEDED]` Does LA Mattress mark down floor models and returned/as-is mattresses on a clock?
  (Very likely yes — floor model rotation is a core mattress-retail practice, so **this article is probably
  in scope**, unlike most of the configurator/CRM ones.) If so, decide the ladder, the floor, and who is
  alerted when a piece reaches the last step unsold.

---

### `SCS-084` Vendor Receivables Control Settings
*storis_ref: article 15186453471636*

**Purpose.** Preferences for the **Vendor Receivables (VR) module** — amounts owed *to us* by vendors
(warranty chargebacks, rebates, defective allowances) — covering history retention, numbering, due-date and
aging defaults, AP hold codes, and bank reconciliation.

**Where it lives.** `System Administration > System Settings > Accounting System Settings > Vendor
Receivables Systems Settings > Vendor Receivables Control Settings`.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Number of Days History` | Integer **`0`–`999`** | **[TRISTATE] + [DESTRUCTIVE] — and this is the field family wave 1 flagged.** "Enter the number of days you want **closed** vendor receivable transactions to remain in the system before purging." **"If you enter ZERO (0), THE SYSTEM DOES NOT CREATE VENDOR RECEIVABLE HISTORY RECORDS. STORIS RECOMMENDS YOU NOT SET THIS FIELD TO ZERO."** — **`0` does not purge history; it means history is never written at all. A third distinct meaning for a retention "0" in this section (compare `SCS-054` `Sales Quotes` where 0 = delete all, and `SCS-074` `Closed Retention Days` where 0 = purge immediately). The article does not document blank.** |
| `Next Reference Number` | Integer, nullable | Number assigned to the next receivable record created when **manually posting adjustments**; increments by one. **[TRISTATE]: "If you leave this field BLANK, the system assigns `10000` as the startup number."** |
| `Next Deposit Number` | Integer, nullable | "The number used by the **Cash Application** program to associate **all receivables paid by the same check or AP bill**." Increments by one. **[TRISTATE]: "If left BLANK, YOU MUST ENTER A UNIQUE DEPOSIT NUMBER FOR EACH PAYMENT."** — blank switches the whole process from automatic to manual keying. |
| `Default Due Days` | Integer **`0`–`999`** | "The number of days the system adds to the default due date of a receivable transaction." **Override, verbatim: "If a `VR Terms Code` appears in the Vendor record for the vendor involved in a given transaction, the system uses that code to calculate the default due date and IGNORES the number that appears here."** — vendor-level wins; reuses the `TERMS_CODE` and `VENDOR_*` scopes. |
| `Number of Aging Days` | Integer **`0`–`999`** — **"may initially be set to 30"** | "The number of days to be represented in **each 'bucket'** on the **Aged Trial Balance** report." **A single bucket width, so the buckets are uniform (0–30, 31–60, …). `0` is in range and would be nonsensical.** |
| `Payables Hold Code` | AP hold code (FK) | Hold code applied to **debit AP bills generated automatically** from the **Manual Adjustments** tab of `Apply Payments and Maintain Vendor Receivables Balances`, "when you convert an adjustment to a payable." |
| `Bank Reconciliation Deposit Code` | Deposit type code (FK), nullable | Deposit type used for VR transactions under the **Bank Reconciliation** feature. **[TRISTATE] + [DESTRUCTIVE-adjacent]: "If you leave this field BLANK, THE SYSTEM DOES NOT CREATE BANK RECONCILIATION RECORDS FOR VR TRANSACTIONS."** — **vendor receivable cash silently never appears in bank reconciliation.** |
| `Report Sort By` | Enum: **`Product Code`**, **`Vendor Model Number`** | Sort of vendor receivable reports. **[REUSE] `CFG-INV-VENDORMODEL`.** |

**Behavior & rules — the hard ones.**
- **`Number of Days History = 0` disables history creation.** STORIS's own text says do not do it. **This is
  the exact pattern wave 1 identified (`a blank Number of Days History deletes history at next end-of-month`)
  appearing again with a different, equally surprising meaning.**
- **Three of the eight fields change behavior fundamentally when blank** (`Next Reference Number`,
  `Next Deposit Number`, `Bank Reconciliation Deposit Code`), and in three different directions:
  substitute a default, force manual entry, or suppress an accounting artifact.
- **The vendor's `VR Terms Code` silently overrides `Default Due Days`**, so the system default may never be
  used for the vendors that matter.
- **`Bank Reconciliation Deposit Code` blank creates an un-reconcilable cash stream** — vendor receivable
  payments hit the bank but not the reconciliation.
- **This module is the counterpart of several settings elsewhere:** `SCS-052`'s
  `Paid Pending Bill Reimbursement Method` (`Accounts Payable` | `Vendor Receivable`), `SCS-058`'s
  `Vendor Rebate Chargeback Method` (same pair), and `SCS-070`'s `Vendor Chargeback Method`
  (`D-Debit Payable` | `V-Vendor Receivables` | `R-Report Only`). **Three screens independently choose
  between AP and VR for three different flows; nothing keeps them consistent. [CONFLICT].**

**Dependencies.** `SCS-052` Payables Control Settings (`Paid Pending Bill Reimbursement Method`, AP hold
codes); `SCS-058` Purchasing Control Settings (`Vendor Rebate Chargeback Method`); `SCS-070` Service Control
Settings (`Vendor Chargeback Method`, `Payables Hold Code`); `SCS-002` Accounts Receivable Control Settings;
`SCS-037` General Ledger Control Settings; `SCS-080` Third-Party Accounting Control Settings; Vendor Settings
(`VR Terms Code`, `Chargeback Method`) — `VENDOR_*` scopes; Terms Code table (`TERMS_CODE` scope);
`Apply Payments and Maintain Vendor Receivables Balances`; Cash Application; Bank Reconciliation;
Aged Trial Balance; `Complete Return-To-Vendor`.

**Build notes.**
- New IDs: `CFG-VR-HISTORY-DAYS`, `CFG-VR-NEXT-REFERENCE`, `CFG-VR-NEXT-DEPOSIT`, `CFG-VR-DEFAULT-DUE-DAYS`,
  `CFG-VR-AGING-BUCKET-DAYS`, `CFG-VR-AP-HOLD-CODE`, `CFG-VR-BANKREC-DEPOSIT-CODE`, `CFG-VR-REPORT-SORT`.
- **Do differently — history is not optional.** `CFG-VR-HISTORY-DAYS` becomes
  `{mode: 'keep_forever' | 'archive_after', days}` with a policy floor; **there is no "do not record" option.**
- **Do differently — one chargeback-destination decision.** Model "who absorbs a vendor-responsible amount"
  once (`AP credit` vs `vendor receivable` vs `report only`), scoped by vendor with a system default, and
  have warranty, rebate, RTV and pending-bill reimbursement all read the same setting. Three independent
  copies is how a vendor ends up both credited and invoiced.
- **Do differently — bank reconciliation coverage must be complete.** Any cash-affecting subledger that can
  be excluded from reconciliation by leaving a code blank is a control failure; make the code required.
- **Do differently — aging buckets are a list**, not a single width (`[30, 60, 90, 120+]`), and should be
  shared with AP aging (`SCS-052` `Bill Aging Days`) and AR aging.
- Keep: vendor-level `VR Terms Code` precedence over the system default (correct scope resolution), and the
  deposit-number grouping of receivables paid by one check.
- `[DECISION NEEDED]` Does LA Mattress pursue vendor receivables (warranty reimbursements, defective
  allowances, co-op) as a tracked subledger, or net them informally against payables? Mattress vendors do
  significant warranty and comfort-exchange reimbursement, so **this is plausibly in scope.**

---

### `SCS-085` Warehouse Management Control Settings
*storis_ref: article 36103270474004*

**Purpose.** Settings for STORIS to communicate with **third-party warehouse management systems (WMS)** —
what product data is exported, which provider, the file delimiter, and a few export inclusions.

**Where it lives.** `System Administrations > System Settings > Purchasing and Logistic System Settings`
*(sic — the article's path is truncated and does not name the screen itself)*.

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Send Product Data` | Enum — **`None` (default)**, **`Single`**, **`Location`** | How product records are posted to the export file. **`None`** — "Selected by default, indicates that **no records are posted**." **`Single`** — "post a **single record for the location**." **`Location`** — "post **multiple records, one for each WMS location**." **[TRISTATE] with a default of "do nothing": WMS receives no product master until this is changed.** |
| `Auto Start WMS Phantom` | Checkbox | Checked → STORIS checks whether the WMS phantom is running **when a user logs in** *and* **when a user exits a process and returns to the menu screen**, and starts it if not. Blank → no automatic launch. **A background integration whose liveness depends on somebody using the menu. If nobody returns to the menu, the phantom stays down.** |
| `WMS Third Party Provider` | Enum: **`None`**, **`RedPrairie`**, **`Discrete`**, **`STORISAPI`** | The WMS provider. |
| `WMS Delimiter for Import/Export` | Single character | "The delimiter character used for **AWM import and export records**." **[DANGEROUS] — a single-character delimiter with no documented escaping. Any product description, vendor model or location name containing that character corrupts the record. Compare `SCS-057`'s colon/semicolon warning and `SCS-086`'s primary/secondary delimiters — three screens with the same unescaped-delimiter design.** |
| `WMS User` | User ID, nullable | "A specific user ID to be used in **WMS adjustment comments**." **[TRISTATE]: "If left BLANK the WMS PHANTOM ID is used for the adjustment comments."** **This is the attribution on inventory adjustments originating from the WMS — i.e. who appears to have moved the stock.** |
| `Increment routing number on partial completion` | Checkbox | Checked → the **routing number is incremented on partial completion** of orders and transfers: "Every time a new an order is completed a new routing number is assigned, the next time it's sent to third party warehouse management interface, **it will be associated with a DIFFERENT routing number**." *(source sentence is garbled)* **[GUARDED] — changing this changes the identity key the WMS uses to track a shipment mid-flight; toggling it while partial completions are open will orphan records on the WMS side.** |
| `Include Intangible Products` | Checkbox | Include **non-inventory products** in **all** WMS exports. |
| `Include Replacement Cost in Product Export` | Checkbox | Include products' **replacement cost** in the WMS product export. **A cost-disclosure decision: replacement cost is commercially sensitive and is being sent to a third-party logistics system. Compare `SCS-066`'s `Include Vendor Model Number` and `Suppress Non-Inventory Price and Quantity`, which exist for exactly this reason — but this one has no suppression counterpart and no stated default.** |

**Behavior & rules.**
- **Defaults are "off"** (`Send Product Data = None`, provider presumably `None`), so the integration is
  inert until deliberately configured — which is the right default here, unlike most of this section.
- **Phantom liveness is tied to user behavior**, not to a supervisor or scheduler.
- **The WMS is a source of inventory adjustments**, attributed to a configurable user. **An adjustment made
  by a warehouse system should never be attributable to a named human by configuration — that is a false
  audit trail.**
- **A WMS group is mandatory on new products when WMS is active** — see `SCS-063`'s
  `Default WMS Group is`: "If WMS is active, new products created from sales order entry MUST have a WMS
  group specified." **That requirement is documented on the RetailDeck screen, not here. [CONFLICT]/gap.**
- **`SCS-054`'s `Assign Specific Pieces Event` and `SCS-066`'s `Pick by Route When Mapping Active`** both
  interact with AWM picking; the latter is the setting STORIS explicitly warns can require data repair.
- The article is thin for a subject this large — **no import definitions, no field mappings, no error
  handling, no reconciliation of on-hand between STORIS and the WMS. Significant content gap.**

**Dependencies.** `SCS-063` RetailDeck Control Settings (`Default WMS Group is`); `SCS-054` Point of Sale
Control Settings (`Assign Specific Pieces Event`, picking); `SCS-066` Route Mapping Control Settings
(`Pick by Route When Mapping Active`, AWM); `SCS-043` Inventory Control Settings; `Enter a Stock Adjustment`;
`Complete Return-To-Vendor`; `WMS Transactions`; phantom process administration
(`Administer Phantom Processes`, cf. `SCS-081`); Warehouse/Store Location Settings (`CFG-LOC-*`);
STORIS API.

**Build notes.**
- New IDs: `CFG-WMS-SEND-PRODUCT-DATA`, `CFG-WMS-AUTOSTART-PHANTOM`, `CFG-WMS-PROVIDER`,
  `CFG-WMS-DELIMITER`, `CFG-WMS-USER`, `CFG-WMS-INCREMENT-ROUTING-ON-PARTIAL`,
  `CFG-WMS-INCLUDE-INTANGIBLES`, `CFG-WMS-INCLUDE-REPLACEMENT-COST`.
- **Do differently — no delimited flat files.** Use a structured, typed interchange (JSON/Avro over an API or
  a queue) with a schema. Delimiter settings should not exist. If a legacy flat file is unavoidable, define
  quoting and escaping and validate on write.
- **Do differently — machine actors are machine actors.** WMS-originated adjustments are attributed to a
  **service principal** (`system:wms`), never to a configurable human user ID. Keep the originating WMS
  document reference on the adjustment.
- **Do differently — integration liveness is monitored**, not started opportunistically by user navigation.
  A health check, a heartbeat, and an alert (see `SCS-074`/`SCS-075` build notes).
- **Do differently — reconcile on-hand.** A scheduled two-way comparison of quantities between the ERP and
  the WMS, with a variance report, is the missing control in this whole article.
- **Do differently — think before exporting cost.** `CFG-WMS-INCLUDE-REPLACEMENT-COST` defaults **off**, and
  the decision is documented in the 3PL contract.
- `[DECISION NEEDED]` Is a third-party WMS in scope for LA Mattress, or is warehouse management native to
  the ERP? If native, most of this article disappears but the **piece/location tracking model**
  (`CFG-INV-LOCTRACK` from the Inventory pack) becomes correspondingly more important.

---

### `SCS-086` Web Control Settings
*storis_ref: article 15186453486484*

**Purpose.** Parameters for the **eSTORIS Virtual Store** (and eBridge/eRoam web channels) — order defaults,
credit-card authorization policy for web orders, web inventory availability rules, gift certificates,
administration/retention, customer password encryption, order-confirmation email, and the **product export**
definition.

**Where it lives.** Two documented paths:
`System Administration > System Settings > Customer System Settings > Interface System Settings > Web System
Settings > Web Control Settings`
`System Administration > System Settings > General Administration System Settings > Interface System Settings
> Web System Settings > Web Control Settings`
**Tabs: `Virtual Store`, `Administration`, `Export`.**

**Fields — `Virtual Store` → `Defaults`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Salesperson` | Salesperson code (FK) | "The salesperson code to use for **all eSTORIS sales orders**." **All web revenue is attributed to one salesperson — a commission and reporting decision.** |
| `Selling Store` | Location code (FK) | Store location for all eSTORIS sales orders. **"To facilitate reporting, STORIS RECOMMENDS you set up a SEPARATE LOCATION for use exclusively with web transactions."** |
| `Add Store to Manual POS Number` | Enum: **`Point of Sale Control Setting`**, **`Add Store to Transaction`**, **`Do Not Add Store to Transaction`** | How **manually assigned** web order numbers are handled. The first option defers to `Add Store To Transaction` in `SCS-054`; the other two **"control web order numbers ONLY."** |
| `Parcel Route` | Parcel route code (FK, searchable) | Route used to ship parcels ordered on eSTORIS. (see `SCS-054` `Parcel Route Code` / `Generate Parcel Delivery Fulfillments` — **two parcel-route settings on two screens, [CONFLICT] risk**) |
| `Direct Ship Delivery Company` | Delivery company code (FK) — optional | Used to **calculate the delivery charge for direct-ship line items that come from the web**. Blank = no such calculation. |
| `Delivery Date Status` | Enum: **`ASAP`**, **`CWC (Customer Will Call)`**, **`Estimated Delivery Date (EST)`**, **`Scheduled Delivery Date (SCH)`** | Default delivery scheduling method for all eSTORIS orders. **Hard interaction, verbatim: "If using the Pre-Authorization feature, IF YOU SELECT `SCH` AT THIS FIELD, PRE-AUTHORIZATION IS NOT AVAILABLE because the system then processes ALL eSTORIS orders AS SALES."** — **choosing a scheduling default silently converts every web order from an authorization to a completed sale, i.e. the card is charged rather than held.** Flag hard. |

**Fields — `Virtual Store` → `Order Source`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `eRoam, eBridge` | Order source (FK) | Default order source applied automatically to transactions created via the eRoam / eBridge processes. |

**Fields — `Virtual Store` → `Credit`**

> **"The following three fields do not apply to EMV credit card processing via the web."**
> **[CONFLICT]/content gap — the article documents one field heading (`Disable Credit Card Authorizations`)
> followed by THREE unlabelled paragraphs describing what are clearly separate fields: a
> **pre-authorization activation** field, a **`Use Auth/Capture for Credit Cards`** field, and a
> **reversal-message** field. The headings are missing from the source. Recorded below as best reconstructed;
> must be verified against a live screen.**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Disable Credit Card Authorizations` | Checkbox | Checked → prevents automatic processing of credit card orders entered through **eBridge**, **including pre-authorizations**. **"Active only if Credit Card Processing is active on your system."** **"This setting does NOT affect web pick-up orders."** **Behavior when checked, verbatim: "eBridge assigns the order a Hold status of `Pending Auth`, and sends it to the `Process Web Payments` routine where you can review the transaction and AUTHORIZE IT OR REJECT IT."** |
| *(unlabelled)* pre-authorization activation | Checkbox | "To activate the **Pre-Authorization** feature for use when processing credit cards via eBridge, check the box." **"Active only if STORIS has ENABLED THIS FEATURE FOR YOU INTERNALLY and the `eSTORIS Drawer` field in the Cash Balancing Control Settings is POPULATED."** |
| *(unlabelled)* reversal message | Checkbox | "If you want STORIS to **transmit a message to the credit card acquirer informing them of a reversal**, check this box." **"In order to enable this setting, you must ALSO check the box at the `Use Auth/Capture for Credit Cards` field."** **Not sending a reversal leaves a hold on the customer's card until it expires — a real consumer-harm setting that is off by default.** |
| `Credit Hold Authorized Deliveries` | Checkbox | Checked → **all orders submitted via eSTORIS and then authorized are placed on `I2` credit hold**, "so you can review them before final processing." **"Active only if the box at the `Disable Credit Card Authorizations` field is EMPTY."** |
| `Credit Application Provider` | Provider (FK) | Default provider for credit applications submitted via eSTORIS. (ties to `SCS-079`) |

**Fields — `Virtual Store` → `Inventory`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Minimum Number Of Lead Days` | Integer days | "The minimum number of days from the date of the order you want to expire before **scheduled orders ship**." **Hard rule: "`Minimum Number of Lead Days` MAY ONLY BE USED IF ATP IS NOT BEING USED."** |
| `Allow Auto PO Creation` | Checkbox | Activates automatic purchase order creation from eSTORIS. **A consumer web order can create a purchase order with no human in the loop.** |
| `Require Available Merchandise` | Checkbox | Checked → a **product availability check throughout the shopping cart and checkout process**: "eSTORIS PREVENTS customers from adding products with a **zero quantity-on-hand** to a shopping cart. If a customer accesses an existing shopping cart containing one or more products with a zero quantity-on-hand, **an error message appears indicating the products are not available and THE PROGRAM REMOVES THE PRODUCTS FROM THE SHOPPING CART.**" **[DESTRUCTIVE at the cart level — the customer's cart is silently emptied of anything that went out of stock. Note the check is on quantity ON HAND, not on ATP, so anything on order but not received is unsellable online.]** |
| `Accept Out-Of-Stock Discontinued Products` | Checkbox | With the field below: when a web order contains a line for an out-of-stock **dropped or discontinued** product, the system looks for a scheduled PO line containing that product and, if found, **automatically links the sales order line to the purchase order line**. |
| `Accept Out-Of-Stock Dropped Products` | Checkbox | Same, for `Dropped`. |
| — combined conditions (verbatim, all must be met) — | | The PO contains a line for the Discontinued or Dropped product; **the PO's delivery location must match the stock location of the order line**; the PO must be **a type that has `Allow Sales Order Linkage to Purchase Order` enabled**; **the PO line must be able to COMPLETELY fulfil the sales order line** (accounting for quantity already received and quantity already assigned to other sales orders); **the PO cannot be on Approval Hold.** **"If the conditions above are not met, or the appropriate setting (discontinued/dropped) is not checked, THE ENTIRE ORDER IS REJECTED."** **[DANGEROUS] — one unlinkable line rejects the customer's whole web order.** |
| `Warehouse Product Availability` | Enum: **`Main Warehouse`**, **`Regional Warehouse`**, **`Closest Warehouse`**, **`Specific Warehouses`** | Method for calculating availability of products ordered on the web. |
| `Specific Warehouses` | Multi-select locations (Search) | Active when `Warehouse Product Availability = Specific Warehouses`. **The set of locations whose stock the website is allowed to see — a direct driver of what appears purchasable.** |

**Fields — `Virtual Store` → `Gift Certificate`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Last Number Used` | Integer — **STORIS initially defines `1000`** | The last gift certificate number used by eSTORIS; **editable**. **"If STORIS comes across a number that has already been used, IT IGNORES IT AND SEARCHES FOR THE NEXT UNUSED NUMBER."** **[GUARDED] — an editable, guessable, sequential gift-certificate number starting at 1000. Sequential bearer instruments are trivially enumerable; this is a fraud exposure, not a numbering preference.** |
| `Add Store to Number` | Checkbox | Prefixes the eSTORIS store's location code to each gift certificate number. |
| `Specific Gift (Payment) Type` | Gift certificate type (FK, searchable) | Type used for eSTORIS purchases of gift certificates. |

**Fields — `Administration`**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Days to Retain Remote Order Data` | Integer **`1`–`99`** | **[DESTRUCTIVE]** Days remote order data remains before purging. **99-day ceiling.** |
| `Days to Save Statistics` | Integer, **max `99`** | **[DESTRUCTIVE]** Days to retain **statistics based on searches conducted on the web**; older statistics are purged. **Web search data is behavioral customer data — a 99-day cap is coincidentally privacy-friendly, but it is also the ceiling on merchandising analytics.** |
| `Product Purchase Statuses for Clearance` | Multi-select: **`D Dropped`**, **`T Discontinued`**, **`M Markdown`** | Purchase statuses designated "clearance" for **web products** (products assigned to a web category). **Behavior, verbatim: assigning a web product to one of these statuses makes the system "check for the existence of a web category code consisting of the product's WEB MASTER SUFFIXED BY the contents of the `Clearance Suffix` field. If that web category EXISTS, the program ADDS the product to that web category. If the web category DOES NOT EXIST, the system MAKES A NOTE OF IT."** — **a silent no-op when the category is missing. "Clearance web categories display only on eSTORIS."** **Reverse behavior, verbatim: "If you return ALL products in a clearance web category back to a purchase status other than one of the above, you remove all products from the web category, SO THE SYSTEM DELETES IT."** **[DESTRUCTIVE] — emptying a clearance category deletes the category, along with whatever merchandising configuration it carried.** |
| `Clearance Suffix` | Suffix code | The suffix that differentiates a web category from its clearance counterpart. |
| `Encrypt Customer Password` | Checkbox — **(LOCKED field - STORIS access ONLY!)** | **[IRREVERSIBLE — the most explicit one-way door in the entire section, verbatim: "WARNING! Once this box is checked THERE IS NO WAY TO UNDO THIS PROCESS. If this field is currently unchecked, checking this field ENCRYPTS ALL THE PREVIOUSLY PLAIN TEXT CUSTOMER PASSWORDS."]** **The corollary is the finding: with this unchecked, eSTORIS customer passwords are stored in PLAIN TEXT. This is the mirror image of the wave-1 SSN finding (unchecking an encryption box bulk-decrypts every stored SSN) — same mechanism, opposite direction, and here the unsafe state is the default-shipped one.** Note also that "encrypt" is the wrong primitive for passwords (they should be **hashed**, and reversibly encrypting them means they can be recovered). |
| `"From" Email Address` | Email | **"When sending an email from STORIS, the email address specified in this field will OVERRIDE that in Notifications Control Settings."** (a third From-address precedence level alongside `SCS-050`'s global and the per-location override) |
| `Order Confirmation Email` | Enum: **`Do Not Send`**, **`From Database Server`**, **`From Web Server`** | Whether and from where order confirmation emails are sent for web orders. **`Do Not Send` means a customer places a web order and receives no confirmation.** |
| `Disable Auto Email When Credit Card is Authorized/Declined` | Checkbox | Checked → suppresses the automatic email to customers whose card transaction is authorized **or declined**. **Suppressing a decline notice leaves the customer believing the order succeeded.** |
| `Web Pickup Locations` | Multi-select locations (Search) | Locations available for web-order customer pickups. **[TRISTATE]: "If you specify NO locations at this field, the system assumes you DO NOT WANT TO ALLOW customer pickups for web orders."** When populated, the customer sees the list via the **`Choose Pickup Location`** button on the **Cart Display** page. |
| `Default Tax ID Number` | Text, **up to 15 characters** | **Verbatim: "The purpose of both fields is to allow the order submission process to CONTINUE WITH DEFAULT VALUES until you have upgraded to the required eBridge minimum release version, 2.1.0.11. THESE FIELDS ARE NOT REQUIRED TO HAVE 'REAL' DATA; for example, you can enter a tax ID of `"999999"` and `"10"` for the expiration date."** **[DANGEROUS] — a documented instruction to enter fake tax-exemption data so that order submission does not fail. Whatever this feeds (tax exemption certificates, presumably) will be populated with `999999`.** |
| `Default Tax Expiration Add On Days` | Text, **up to 3 characters** | The companion field; same instruction to use placeholder data. |

**Fields — `Export` tab**

> "Use this tab to maintain **which of the STORIS provided columns are included in the eSTORIS product
> export**. You can select the fields, delimiters, and name of the file to be used when data is exported."

| Field | Type | Purpose / business rule |
|---|---|---|
| `Export File to` | Path + file name | Where the product data is exported. **"NO VALIDATION CHECK IS PERFORMED; user may specify new or existing location and file name."** **[DANGEROUS] — an unvalidated arbitrary file path, with the ability to name an EXISTING file (i.e. overwrite it).** |
| `Primary Field Delimiter` | Character (dropdown) | "Used to separate **every grid column** that is chosen." |
| `Secondary Field Delimiter` | Character (dropdown) | "Used to separate data elements that exist **within** major fields of the grid… **Example: The dimensions field contains length, height and width therefore you would want to select a secondary field delimiter to separate into three sub-fields.**" |
| Grid — checkbox per field | Checkbox | Include/exclude each data field in the output. |
| Grid — `Web Data Fields` | Read-only | "The name of the column heading used in the output data field." |
| Grid — `Export Sequence` | Integer | "The order that a field is placed in the export file when a column is checked. This number is **incriminated** *(sic — 'incremented')* in all appropriate fields when a new field is selected… and is **decremented** when a field is removed." |
| Grid — annotations | Read-only text | **"If the field is MANDATORY, the field contains the word `'mandatory'`. If the field requires additional processing time, the field contains a phrase stating `'extensive processing time may be required'`."** |

**Behavior & rules — the hard ones.**
- **`Encrypt Customer Password` is irreversible, vendor-locked, and its unchecked state means plaintext
  customer passwords.**
- **`Delivery Date Status = SCH` silently disables pre-authorization and charges cards immediately.**
- **`Require Available Merchandise` empties a customer's saved cart** when stock goes to zero, and uses
  on-hand rather than ATP.
- **One unlinkable dropped/discontinued line rejects the entire web order.**
- **Gift certificate numbers are sequential, editable, and start at `1000`.**
- **The documentation instructs the operator to enter fake tax data** (`999999`) to keep order submission
  working.
- **Emptying a clearance web category deletes it.**
- **`Export File to` performs no path validation and can overwrite an existing file.**
- **Two unescaped delimiter settings** — the third instance of this pattern (with `SCS-057` and `SCS-085`).
- **Three levels of "From" email precedence** now exist (`SCS-050` global, per-location, and this screen).

**Dependencies.** `SCS-033` eSTORIS Control Settings; `SCS-071` Shopping Cart Control Settings (eSTORIS cart
retention and conversion pricing); `SCS-050` Notifications Control Settings (`"From" Email Address`, event
email rows for `Shopping Cart` / `Shopping Cart eRoam`); `SCS-054` Point of Sale Control Settings
(`Add Store To Transaction`, parcel routes, ATP settings, direct ship, order sources);
`SCS-053` Payment Card and Device Settings; `SCS-012` Cash Balancing Control Settings (`eSTORIS Drawer`);
`SCS-079` Third Party Finance Application Control Settings (`Credit Application Provider`);
`SCS-058` Purchasing Control Settings (PO types, `Allow Sales Order Linkage to Purchase Order`, dropped and
discontinued purchase statuses); `SCS-073` Stock Reservation Settings; `Process Web Payments`; eBridge
(minimum release `2.1.0.11`); eRoam; Web Category / web master structures; Reason Code Settings;
Sales Tax Settings (tax exemption). **[REUSE]** `CFG-LOC-*`, `CFG-INV-RESERVEBY`.

**Build notes.**
- New IDs: `CFG-WEB-DEFAULT-{SALESPERSON,SELLINGSTORE}`, `CFG-WEB-MANUAL-NUMBER-PREFIX`,
  `CFG-WEB-PARCEL-ROUTE`, `CFG-WEB-DIRECTSHIP-DELIVERY-COMPANY`, `CFG-WEB-DELIVERY-DATE-STATUS`,
  `CFG-WEB-ORDER-SOURCE`, `CFG-WEB-DISABLE-CC-AUTH`, `CFG-WEB-PREAUTH-ENABLED`,
  `CFG-WEB-SEND-REVERSAL-MESSAGE`, `CFG-WEB-CREDITHOLD-AUTHORIZED`, `CFG-WEB-CREDITAPP-PROVIDER`,
  `CFG-WEB-MIN-LEAD-DAYS`, `CFG-WEB-ALLOW-AUTO-PO`, `CFG-WEB-REQUIRE-AVAILABLE`,
  `CFG-WEB-ACCEPT-OOS-{DISCONTINUED,DROPPED}`, `CFG-WEB-AVAILABILITY-SOURCE`,
  `CFG-WEB-AVAILABILITY-LOCATIONS`, `CFG-WEB-GIFTCERT-{LASTNUMBER,ADDSTORE,TYPE}`,
  `CFG-WEB-RETENTION-{REMOTEORDER,STATISTICS}-DAYS`, `CFG-WEB-CLEARANCE-STATUSES`,
  `CFG-WEB-CLEARANCE-SUFFIX`, `CFG-WEB-ENCRYPT-PASSWORDS`, `CFG-WEB-FROM-EMAIL`,
  `CFG-WEB-ORDER-CONFIRMATION`, `CFG-WEB-DISABLE-CC-RESULT-EMAIL`, `CFG-WEB-PICKUP-LOCATIONS`,
  `CFG-WEB-DEFAULT-TAXID`, `CFG-WEB-DEFAULT-TAX-EXPIRY-DAYS`, `CFG-WEB-EXPORT-{PATH,DELIM1,DELIM2,FIELDS}`.
- **Do differently — passwords are never stored, encrypted or otherwise.** Salted, slow hashes (argon2/bcrypt),
  no configuration switch, no vendor lock. `CFG-WEB-ENCRYPT-PASSWORDS` must not exist. If we ever inherit
  plaintext credentials, force a reset — do not "encrypt" them.
- **Do differently — never charge before it is due.** Authorization vs capture is an explicit, deliberate
  policy setting, not a side effect of a delivery-status default. **Always transmit reversals.**
- **Do differently — availability on the web is ATP, not on-hand**, and out-of-stock items stay in the cart
  as back-orderable with a promise date, or are clearly marked — never silently removed.
- **Do differently — never reject a whole order for one line.** Split the order or hold the line.
- **Do differently — gift certificate numbers are random, unguessable, and single-use**, with the balance
  held server-side. Sequential numbering of a bearer instrument is a fraud invitation.
- **Do differently — never document or accept placeholder data in a tax field.** If a value is unavailable,
  the flow fails or the record is marked incomplete; `999999` in a tax ID is a compliance problem waiting to
  be found in an audit.
- **Do differently — exports go to a controlled destination** (object storage with a signed URL), never an
  arbitrary path, and never overwrite silently. Use a schema, not two delimiter characters.
- **Do differently — one From-address precedence chain**, documented, with three levels at most and visible
  resolution.
- Keep: the **clearance-category-by-purchase-status** automation (but do not delete a category when it
  empties, and alert instead of silently noting a missing category); the **`Web Pickup Locations`** model;
  the **`Export Sequence` + mandatory-field annotations** (a decent export-definition UI).
- `[DECISION NEEDED]` What is the web channel for LA Mattress — eSTORIS-equivalent in the ERP, or a separate
  commerce platform integrating via API? If the latter, most of this article becomes an integration contract
  rather than settings, and the availability/authorization decisions move to the storefront.

---

### `SCS-087` Zero-Cost Exception Handling
*storis_ref: article 15186452150932*

**Purpose.** Documents the four options of the **`Automatic Handling of Cost Exceptions`** field in
**Costing Control Settings** (`SCS-016`) — what the system does when a **zero cost** is found.

**Where it lives.** Not a screen of its own: `Costing Control Settings` → `Automatic Handling of Cost
Exceptions`. (Part A noted the option list for the Costing Control Settings exception-handling enums as a
content gap — **this article supplies it.**)

**Fields**

| Field | Type | Purpose / business rule |
|---|---|---|
| `Automatic Handling of Cost Exceptions` (in Costing Control Settings) | Enum — exactly four values, verbatim | **`Do not Handle`** = "**Leave the exception as it is.** If you select this option, **you must manually solve the exception.** The exception appears in the **`Report Active Costing Exceptions`** report, which runs at End of Day or on demand."<br>**`Use Average`** = "Use the **average cost of the product** to solve the exception."<br>**`Use Replacement Cost`** = "Use the **replacement cost for the model number** to solve the exception."<br>**`Skip the Exception`** = "**Allow the inventory to be received AT ZERO COST and CLEAR the exception.** The accepted cost exception appears in the **`Report Solved Costing Exceptions`** routine, which runs at End of Day or on demand." |

**Behavior & rules — the hard ones.**
- **`Skip the Exception` is the dangerous value.** It **receives inventory at zero cost and marks the
  exception solved**, so the item enters stock with no cost basis. Every downstream number is then wrong:
  gross margin on the sale is 100%, COGS is understated, inventory valuation is understated, and GMROI and
  commission calculations based on profit are distorted. **The record of it exists only in
  `Report Solved Costing Exceptions`, which is subject to `SCS-061`'s 30-day "other" report retention.**
- **`Use Average` and `Use Replacement Cost` fabricate a cost silently.** They are better than zero, but the
  received cost is then not the vendor's cost, and no flag distinguishes a derived cost from an actual one
  in the article's description.
- **`Do not Handle` is the only option that preserves the truth**, at the price of manual work — and the
  exception then lives on a report, not in a work queue.
- **Note the difference in granularity:** `Use Average` is **per product**; `Use Replacement Cost` is **per
  model number** (i.e. per vendor model). Those are not the same key. **[CONFLICT]/subtlety worth catching.**
- **This enum is the tail end of a chain of zero-cost fallbacks across part B**, all of which can terminate
  in a zero or fabricated cost: `SCS-058` `SPECIAL ORDERS - Use Replacement Cost as a Default` (both branches
  end at zero), `SCS-072` `Zero Cost Written Retail Percent` (a reporting-only estimate), `SCS-054`
  `Zero Cost on Direct Shipment` and `Zero Cost Non-Inventory Item` (alert levels only), and this setting.
  **Five separate mechanisms, no single owner of "what is this item's cost".**

**Dependencies.** `SCS-016` Costing Control Settings (the parent field, plus the other three
exception-handling enums part A flagged as undocumented); `SCS-058` Purchasing Control Settings
(`SPECIAL ORDERS - Use Replacement Cost as a Default`, `Daily Exceptions Cost Change Percent`);
`SCS-072` Special Order Control Settings (`Zero Cost Written Retail Percent`); `SCS-054` Point of Sale
Control Settings (`Zero Cost on Direct Shipment`, `Zero Cost Non-Inventory Item`,
`Sales Margin Scratchpad Cost`, `Selling Price is Below Cost`); `SCS-052` Payables Control Settings
(`Allowable Cost Variance` — the AP-side comparison of receipt cost to bill cost);
`Report Active Costing Exceptions`; `Report Solved Costing Exceptions`; `View Product Cost Activity`;
warehouse receiving; End-of-Day. **[REUSE]** `CFG-COSTING-*`, `CFG-INV-RCVCLOSE`.

**Build notes.**
- New ID: `CFG-COSTING-ZEROCOST-HANDLING` (enum `do_not_handle` | `use_average` | `use_replacement` |
  `skip`) — **but see below; the recommendation is to not ship the fourth value.**
- **Do differently — `skip` must not exist.** Receiving at zero cost should be impossible without a
  permissioned, reason-coded, per-receipt override that is logged to `RPT-AUDIT` and reported until resolved.
- **Do differently — a derived cost is labelled as derived.** Store `cost_basis`
  (`vendor_invoice` | `average` | `replacement` | `estimated` | `zero`) on every receipt and inventory layer,
  surface it wherever margin is shown, and report on the population of non-`vendor_invoice` costs.
- **Do differently — exceptions belong in a work queue, not a report.** `Report Active Costing Exceptions`
  should be a live queue with an owner, an age, and an alert when it grows — and it must not be purged.
- **Do differently — one cost resolver.** Consolidate the five zero-cost mechanisms above into a single
  documented fallback chain, defined once, tested, and visible on the line.
- Keep: the two-report split (**active** vs **solved** exceptions) — that distinction is genuinely useful and
  should become "open queue" vs "resolution log".
- `[DECISION NEEDED]` The cost fallback chain for LA Mattress, and whether receiving may ever proceed without
  a cost. Recommended answer: **no** — block the receipt, since a mattress receipt without cost corrupts
  margin reporting for the life of the inventory layer.

---

## Dangerous settings

Collected from `SCS-045` … `SCS-087`. Wave 1 (part A) identified two recurring patterns and asked part B to
hunt for them deliberately. **Both recur heavily.** A third and fourth pattern were also found often enough
to be worth naming.

### A. Settings whose blank / zero / positive values mean three different things — **[TRISTATE]**

The single most dangerous property of this section is that **"blank" has no consistent meaning**. Across
part B it means, in different fields: *unlimited*, *disabled*, *keep forever*, *destroy everything at the
next period close*, *never collect the data at all*, *substitute a hard-coded default*, *force manual entry*,
*suppress an accounting artifact*, and *the strictest possible setting*. **Zero is equally overloaded.**

| Req | Setting | blank / null | zero | positive |
|---|---|---|---|---|
| `SCS-045` | `Maximum Number of Letters Per XML File` | all letters in one file | *(undefined — must be rejected)* | chunk size |
| `SCS-050` | `Notification Register Retention Days` | *(undocumented)* | retain nothing | days retained (max 99) |
| `SCS-052` | `Days to Keep Invoice History` | *(undocumented — purge-all risk)* | *(purge-all risk)* | days (max 9999) |
| `SCS-052` | `Refund Bill To Company` | **derive from operator's log-on store** | — | that company |
| `SCS-052` | `Allowable Cost Variance` | *(undocumented)* | **nothing auto-converts** (strict `<`) | tolerance % |
| `SCS-052` | `Email Subject for Remittance Advice` | prints the bank's company name | — | that subject |
| `SCS-052` | `Freight in Terms Amount` (checkbox) | excludes freight **and** defaults the pay date instead of the terms date | — | includes freight |
| `SCS-053` | `Transaction Retention Days` | **never purge** | *(below 30 rejected)* | purge older than N (30–9999) |
| `SCS-053` | `Amount Increase Limit` | — | **override ALWAYS required** (strictest) | amount allowed without override |
| `SCS-053` | `Prior Days to Include` | *(undocumented)* | **today only** | N days back |
| `SCS-053` | `Server Time Out milliseconds` | — | **give up immediately** | ms to wait |
| `SCS-053` | `Amount Required for Signature` | **always prompt** (strictest) | — | prompt at ≥ amount |
| `SCS-054` | `Next Point of Sale / Service Transaction` | **manual numbering required** | — | auto-number seed |
| `SCS-054` | `Voided Orders` retention | **DESTROYS ALL at first End-of-Month** | — | days held |
| `SCS-054` | `Sales Quotes` retention | EOD deletes **nothing** | **EOD deletes ALL unconverted quotes** | days held (0–999) |
| `SCS-054` | `Customer Activity Log` | never purged (default) | — | days (1–9999) |
| `SCS-054` | `Completed Orders` retention | **always retained** | — | months held |
| `SCS-054` | `Completed Transfers` retention | not purged | — | months held |
| `SCS-054` | `Completed Order Attachments` | governed by Completed Orders / Customer purge | — | months held |
| `SCS-054` | `Customer Retention Period __ Months` | **DISCARDS ALL NEW ORDER DATA ON COMPLETION** | — | months held |
| `SCS-054` | `Restocking Fee on Returns` | **no fee calculated** | **use the GROUP-level rate**, else zero | that % |
| `SCS-054` | `In-Process Delivery Restriction __ Days` | **restriction disabled** | **day of delivery only** | N days before |
| `SCS-054` | `Restrict Scheduled Date` | **no future limit** | — | max days ahead (1–999) |
| `SCS-054` | `Maximum Number of Fulfillments` (Delivery / Pickup) | **unlimited** | — | 1–99 |
| `SCS-054` | `Manifest Exception Retention __ Months` | *(undocumented)* | **retain nothing** | months held |
| `SCS-054` | `Reserve Product (Auto Fill) __ Days` | *(required field)* | **JIT reservation DISABLED entirely** | fill window |
| `SCS-054` | `Auto Schedule Period __ Days` | **no automatic transfers created** | — | days before delivery |
| `SCS-054` | `Maximum Split Commissions` | **no maximum** | — | 1–99 |
| `SCS-054` | `Allowed Number of Days on Returns` | **no time restriction** (default) | — | days allowed |
| `SCS-054` | special-order `Price Variance Rules` | **no check performed at all** | 0% variance allowed | max % (0–100) |
| `SCS-054` | `Maximum Subtotal Discount __ %` | *(blank OR zero = "adjusting subtotal" mode)* | same | max discount % |
| `SCS-054` | `Default Email Address` | no email requirement | — | **makes email MANDATORY system-wide** |
| `SCS-054` | `Route Closing Period` (Deliveries / Transfer) | feature ignored (in all three routines) | — | days closed ahead |
| `SCS-055` | `Warehouse List` | *(undocumented — all or none?)* | — | those locations |
| `SCS-058` | `Next Purchase Order Number` | **manual PO numbering required** | — | auto-number seed |
| `SCS-058` | `Days to Keep Voided / Closed Purchase Orders` | *(undocumented)* | *(purge-all risk)* | days held |
| `SCS-059` | `Inventory Formation` | **no product restriction** | — | that formation |
| `SCS-061` | all four report-retention fields | *(no blank — capped at 30 / 395 / 60 / 30)* | *(min 1)* | days held |
| `SCS-062` | `EST/SCH Status Fulfillments` | leave requested date null | **use the fulfillment date** | fulfillment date **+N**; negative → **−N**, floored at order date |
| `SCS-062` | `ASAP` / `CWC Status Fulfillments` | leave null | use fulfillment date | +N (no negatives) |
| `SCS-062` | `Order Date Days` | **no requested dates updated** | — | **OVERWRITES** requested dates for orders created in the last N days |
| `SCS-063` | `Import Lineup Every x Hours` | **deactivates the whole RetailDeck interface and every field on the screen** | — | refresh interval |
| `SCS-063` | `Selling Price Markup is` | **leaves ALL price fields blank on new products** | **price = cost (0% margin)** | markup % |
| `SCS-063` | `Column Name Availability` | **no quantity information returned** | — | tag name (value may be a quantity **or** a 1/0 boolean) |
| `SCS-064` | `Prime Interest Rate %` | variable-rate calculations not based on prime | — | that rate |
| `SCS-064` | `Revolving Credit Hold Amount` | **no F1 credit hold at all** | — | max financeable amount |
| `SCS-064` | `Do Not Default Insurance After Days` | **no last-activity check performed** | — | days of AR inactivity |
| `SCS-064` | `Paper Statement Fee > Amount` | *(undocumented)* | presumably no fee | fee (0–99) |
| `SCS-065` | `Maximum Stops` / `Pieces/Hours` / `Dollars` / `Volume` (per day) | **day not checked or monitored** | **NO deliveries permitted that day** | the cap |
| `SCS-065` | `Unit` / `Dollar` / `Cube Capacity Threshold %` | **ANY order may exceed capacity, no override needed** | **cannot exceed max without an override** (strictest) | % over allowed |
| `SCS-065` | `Route Capacity Log Retention Days` | *(mandatory)* | **retain nothing** | days (0–99, default 30) |
| `SCS-066` | `WMS`-style defaults (`Default Volume`, `Default Weight`) | fall through to Product/Category only | — | the default |
| `SCS-067` | `Sales Analysis Retention` | **THE SYSTEM COLLECTS NO DATA** | **same — collects no data** | periods retained |
| `SCS-068` | `Default Method of Contact` / `Default Probability of Purchase` | **users must enter manually** | — | that default |
| `SCS-068` | `Salesperson Code for Unassigned Contacts` | **lead eligible for reassignment by any utility** | — | phantom salesperson |
| `SCS-068` | `Purge Lead History After This Many Days` | **never purged** | **never purged** | days (1–999) |
| `SCS-070` | `After Last Call Days` | tickle disregards this field | **tickle on the exact day the process runs** | N days after |
| `SCS-070` | `Call Customer Days` | **ALL tickle processing silently disabled** | **tickle the day AFTER the next contact date** | N days before |
| `SCS-070` | `Call Before In-Home Days` | disregarded | **tickle the day AFTER the scheduled date** | N days before |
| `SCS-072` | `Zero Cost Written Retail Percent` | **falls through to the next hierarchy level** | **a real value that STOPS the hierarchy** | that % |
| `SCS-073` | *(paired policy)* | — | — | see the forbidden/mandatory combination rules |
| `SCS-074` | `Closed Retention Days` | **no purge processed** | **purge immediately** | days (0–999) |
| `SCS-074` | `Inbound/Outbound Retention Days` | *(undocumented)* | *(undocumented)* | days |
| `SCS-075` | `Send Notification To` (×3) | **no notification is sent** | — | those users |
| `SCS-075` | `Number of Days` (×3) | — | **warn on the day it happens (i.e. no warning)** | days ahead |
| `SCS-077` | Terminal ID at login | **empty selection is itself the default used for the first card sale** | — | that TID |
| `SCS-079` | `Force Re-Entry` (unchecked) | **system pre-fills a consumer credit application from stored data** | — | applicant must re-enter |
| `SCS-080` | `Days Before Purging History Log` | *(undocumented)* | *(undocumented)* | days |
| `SCS-084` | `Number of Days History` | *(undocumented)* | **NO VENDOR RECEIVABLE HISTORY RECORDS ARE CREATED** | days (0–999) |
| `SCS-084` | `Next Reference Number` | **system uses `10000` as the startup number** | — | that seed |
| `SCS-084` | `Next Deposit Number` | **a unique deposit number must be keyed for every payment** | — | that seed |
| `SCS-084` | `Bank Reconciliation Deposit Code` | **NO bank reconciliation records created for VR transactions** | — | that code |
| `SCS-085` | `WMS User` | **the WMS phantom ID is used on adjustment comments** | — | that user ID |
| `SCS-085` | `Send Product Data` | `None` (default) = **no records posted** | — | `Single` / `Location` |
| `SCS-086` | `Web Pickup Locations` | **customer pickup for web orders is disallowed entirely** | — | those locations |
| `SCS-086` | `Direct Ship Delivery Company` | no delivery charge calculated for web direct-ship | — | that company |

### B. Settings whose change silently destroys data — **[DESTRUCTIVE]**

| Req | Setting | What is destroyed, and when |
|---|---|---|
| `SCS-054` | **`Customer Retention Period __ Months`** | Purges **customer records, customer history, ALL completed orders, and Customer Comments** at the first End-of-Month after the period. **Blank = discard all new order data on completion.** Overrides the `Completed Orders` setting. Destroys warranty-linked invoice data. **The most destructive single field in part B.** |
| `SCS-054` | **`Voided Orders`** retention | Blank → **all voided-order data discarded at the first End-of-Month.** |
| `SCS-054` | **`Sales Quotes`** retention | `0` → **End-of-Day deletes every unconverted sales quote.** |
| `SCS-054` | `Completed Orders` / `Completed Transfers` / `Completed Order Attachments` | Scheduled purges; STORIS itself warns that a first-time setting will purge a large backlog and advises stepping the value down gradually. |
| `SCS-054` | `Customer Activity Log` | Purged by a scheduled process; STORIS advises reducing the value **year by year** rather than in one step. |
| `SCS-054` | `Manifest Exception Retention __ Months` | `0` → route/delivery exception data never retained. |
| `SCS-054` | `Reserve Product (Auto Fill) __ Days` | **Changing the value unreserves live merchandise**: reserved-but-unassigned stock whose new fill date falls after the delivery date is **unreserved**. |
| `SCS-054` | `Promotional Pricing Retention Period __ Months` | Purges loaded Product Adjustment records. |
| `SCS-052` | **`Days to Keep Invoice History`** | **Purges AP payment register records with status `reconciled` or `voided`** — precisely the audit population. |
| `SCS-053` | `Transaction Retention Days` | Card transaction records (CAX file) purged by a scheduled process. |
| `SCS-053` | `Token Sharing > Active` (unchecked) | **No token-sharing data is retained** beyond the refund minimum. |
| `SCS-053` | **`Only Mark As Resolved`** | **Marks real, unsettled card transactions as completed** without processing them. Irrecoverable — the ERP never revisits them. |
| `SCS-050` | `Notification Register Retention Days` | Event Notification Register purged; 99-day ceiling. Also: exceeding the licensed notification quota archives events **unsent** after a 30-day grace period. |
| `SCS-054` (`SCS-050` interaction) | `Maintain Customer Deposits Refund Receipt` unchecked | **A captured customer signature is captured but NOT archived** when no receipt is printed. |
| `SCS-058` | `Days to Keep Voided / Closed Purchase Orders` | Purged at End-of-Month; **the definition of "closed" changes if TPA is enabled**, changing what is eligible. |
| `SCS-061` | All four report-retention fields | Archived reports purged; **hard ceilings of 30 / 395 / 60 / 30 days** cap the effective audit trail, since STORIS has no general change log. |
| `SCS-062` | `Order Date Days` | **Overwrites existing requested dates** on orders created within the lookback window — including dates a customer asked for. |
| `SCS-064` | `Dispute Retention Months` (mandatory) | **Resolved billing disputes and their comments** purged at month-end. |
| `SCS-064` | `Plan Auditing` unchecked | **Revolving audit data is never generated.** |
| `SCS-065` | Day-tab capacities + **Rebuild Route Calendar** | Rebuilding **overwrites every manually adjusted maximum on every route calendar, for all route types and days**. Declining the rebuild leaves routes able to exceed capacity. |
| `SCS-065` | `Route Capacity Log Retention Days` | `0` → capacity log retains nothing; EOD purge. |
| `SCS-066` | `Days to Hold Mapping Exceptions` | Mapping exceptions deleted by EOD; **12-day maximum**. |
| `SCS-066` | `Load Address Corrections` | **A third-party mapping provider overwrites customer address history records.** |
| `SCS-067` | **`Sales Analysis Retention`** | Blank **or zero** → **sales analysis detail is never collected**; existing purges run at End-of-Month. |
| `SCS-067` | `Written Business Retention` / `Sales Register Retention` | **Default is ONE period** — written business and sales register detail destroyed after a single month out of the box. |
| `SCS-068` | `Delete Quotes When Lead is Closed` | **Quotes AND layaways for the lead are deleted** when the lead closes — including automatic End-of-Day auto-archive closures. |
| `SCS-068` | `Purge Lead History` + `Purge Contacts With No Active Or Historic Leads` | A two-step chain that **deletes the contact record entirely** at month-end once its lead history has been purged. |
| `SCS-070` | `Keep Status Data for Days` | Service status analysis data purged. |
| `SCS-070` | **`Tickle Processing Active`** unchecked | **NULLS the three dependent day fields** — the configuration is destroyed, not just disabled. |
| `SCS-071` | Three cart-retention fields | eSTORIS / terminal / eRoam carts purged at EOD, each on its own clock. |
| `SCS-072` | `Inactive Template Retention Days` (mandatory) | **Inactive special-order templates purged** at month-end — losing the ability to reproduce a past configuration. |
| `SCS-074` | `Closed` / `Inbound-Outbound` / `Task Retention Days` | Messenger messages **and task records** purged by EOD. |
| `SCS-080` | `Days Before Purging History Log` | **TPA history log** — the record of what was transmitted to the accounting system. |
| `SCS-080` | `Summarize GL Postings` + `By Account` | **Collapses the posting-source dimension** before transmission; the detail exists only in the TPA history log, which is itself on a purge clock. |
| `SCS-080` | **`Allow Transmitted AP Bill Deletion`** | **Deletes AP bills that have already been transmitted** to the accounting system, with no reversing entry. Permanent divergence between the two systems. |
| `SCS-080` | `Allow Multiple Export Files at One Time` | Disables the existing-export-file check — enables duplicate posting or an overwritten batch. |
| `SCS-081` | TPA Transmission Phantom | **Rejected `GL.POST` and `AP.BILL` records are NOT re-transmitted** by the automatic process, ever. |
| `SCS-084` | **`Number of Days History = 0`** | **Vendor receivable history records are never created.** STORIS explicitly recommends against it. |
| `SCS-084` | `Bank Reconciliation Deposit Code` blank | **No bank reconciliation records are created for VR transactions.** |
| `SCS-086` | `Require Available Merchandise` | **Silently removes out-of-stock products from a customer's saved shopping cart.** |
| `SCS-086` | Clearance web categories | **Returning all products to a non-clearance status DELETES the web category.** |
| `SCS-086` | `Days to Retain Remote Order Data` / `Days to Save Statistics` | Purged; **99-day ceilings**. |
| `SCS-087` | `Automatic Handling of Cost Exceptions = Skip the Exception` | **Receives inventory at zero cost and clears the exception**, permanently destroying the cost basis of that inventory layer. |

### C. Irreversible once data exists — **[IRREVERSIBLE]**

| Req | Setting | Why it is one-way |
|---|---|---|
| `SCS-086` | **`Encrypt Customer Password`** | Verbatim: **"Once this box is checked there is no way to undo this process."** Checking it encrypts all previously **plain-text** customer passwords. Vendor-locked. The unchecked state means passwords are stored in plaintext. |
| `SCS-064` | **`Master Plan`** | "Following initial entry of a plan code in this field, **the field becomes LOCKED and you cannot change it without assistance from STORIS.**" It also auto-creates master plans for every revolving customer. |
| `SCS-054` / `SCS-070` | **`Route Closing Period` / `Cut Off Routes Days Prior to Scheduled Date`** | "If you use this feature to close dates, **they remain closed even if you access this field again and change the number of days**" — reopening requires a second manual step per date in `Route Capacity Settings`. |
| `SCS-058` | `NUMBERING - Add Location Prefix to the Purchase Order Number` | "Once you auto-assign a new PO number that includes the location prefix, **the PO number cannot be changed** by selecting a different `Receive At` location." |
| `SCS-054` | `Assign Price on As-Is Items` / `Assign Price on Floor Sample Items` | Enabling pins a piece's price: **"The price of the product is not impacted by general pricing changes."** |
| `SCS-054` | `Apply Pricing Hierarchy to kit components…` | Removing a soft-kit component **removes the kit grouping permanently** and re-prices every component. |
| `SCS-057` | `Configured Vendor Model Format` | The formatted string is **stored** on order lines, PO lines and inventory pieces; changing the format leaves a permanently mixed population. |
| `SCS-047` | Micro*D quote documents | **"You cannot edit existing quote documents… you must delete the old quote and create a new one."** |
| `SCS-053` | `Take With and Quick Sales Transactions` signatures under Shift-4 | **"Once the order is complete, the signature cannot be recalled in STORIS."** |
| `SCS-053` | `Only Mark As Resolved` | Fabricates a completed state for unsettled transactions; the process never looks at them again. |
| `SCS-080` | `Summarize GL Postings` | Once summarized postings are transmitted, the detail does not exist on the accounting side. |

### D. Unsafe to change while certain state exists — **[GUARDED]**

| Req | Setting | State that makes it unsafe |
|---|---|---|
| `SCS-065` | Day-tab capacities | Existing route calendars with **manual adjustments**; open scheduled routes. Both answers to the rebuild prompt are damaging. |
| `SCS-054` | Deliveries / Transfers `Status` and `Quantity` (route capacity) | Requires **`Rebuild Route Calendar`** before the change can be saved. |
| `SCS-054` | `Reserve Product (Auto Fill) __ Days` | **Open orders with reserved-but-unassigned merchandise** — they get unreserved. |
| `SCS-054` | `Fill Layaway Orders` ↔ `Layaway in Net Purchase Order` | Mutually exclusive; save is blocked with an explicit error. |
| `SCS-073` | `Reservation Priority` / `Reservation Date` | ATP active; `Reserve ASAP/CWC Sales` active; open order lines with multiple delivery dates; `Allow multiple on order line`. One forbidden combination, two mandatory ones, and a **warning-only** guard on the PO-preference configuration. |
| `SCS-052` | `Print Bank` | **Enabling multi-company CLEARS this field** and moves the mandatory setting to Company Settings. |
| `SCS-052` | `Next Positive Pay Batch` | Resetting the number causes the bank to reject or duplicate a batch. |
| `SCS-053` | `Shift-4 Local EMV` | In-flight terminal sessions; changes the entire payment topology. |
| `SCS-053` | `Token Retention Days` | Must match **Shift4's own `Token Storage Duration`** in a different vendor's portal. |
| `SCS-058` | `GENERAL - Exclude Weekends in Vendor Lead Days` | **"Any existing purchase lead days information changes accordingly"** — retroactively moves every ATP date. |
| `SCS-058` | `Days to Keep Closed Purchase Orders` | The meaning of "closed" changes when **TPA is enabled**. |
| `SCS-080` | `Use Account Numbers (QB Only)` | Changing mid-period mis-posts or fails; matching key changes. |
| `SCS-080` | Enabling TPA at all | Silently disables `SCS-052`'s `Allowable Cost Variance` (three-way matching) and redefines PO closure. |
| `SCS-064` | `Insurance Required` | **Existing plans without insurance**: any later edit forces insurance to be added before saving. |
| `SCS-064` | `Allow Payment Agreements` | Changes payment matching (`extraction numbers 0001/0002`) for **every customer on the account**. |
| `SCS-064` | `Apply Insurance By` | Customers already enrolled; also gates which `Insurance File Format` values are legal. |
| `SCS-064` | `State Regulations Based Upon` | Re-bases governing state law for the **entire existing portfolio**. |
| `SCS-054` | `Allow Changes to Un-manifested Fulfillments` and the two auto-transfer lock settings | Fulfillments already **on a manifest**; auto-transfers already manifested or completed. |
| `SCS-054` | `One Delivery Charge Per Order` | Existing multi-fulfillment orders; deleting the charge-bearing fulfillment **loses the delivery charge**. |
| `SCS-056` | Removing a `Product Auto-Numbering Exclusion Range` | IDs in the range may be reserved for an integration or an in-flight import. |
| `SCS-077` | Removing an EMV / tethered terminal row | Historical card transactions referencing that TID lose the device link. |
| `SCS-085` | `Increment routing number on partial completion` | **Open partial completions** — toggling orphans records on the WMS side. |
| `SCS-063` | `Import Lineup Every x Hours` | Blanking it deactivates the interface and every other field on the screen. |
| `SCS-046` | Un-checking an event for a consumer | Downstream consumers stop receiving the event with no error. |

### E. Settings that contradict or duplicate another — **[CONFLICT]** (selected)

- **Three different `0`/blank retention conventions** exist side by side: `0` = purge everything
  (`SCS-054` `Sales Quotes`), `0` = purge immediately (`SCS-074`), `0` = never record anything
  (`SCS-084`, `SCS-067`), blank = keep forever (`SCS-068`, `SCS-074`), blank = destroy everything
  (`SCS-054` `Voided Orders`, `Customer Retention Period`).
- **`Completed Orders` vs `Customer Retention Period`** (`SCS-054`) — the customer setting wins and a
  message says so; two settings own the same data.
- **`Allow Completion After Ticket Print`** is documented **twice** on `SCS-054` (Logistics page, two groups).
- **`Sales Order Print Sort By`** (`SCS-054`) — the article names **two different defaults** (`Room` and
  `Group Pricing`).
- **`Sales Order Salesperson Default`** (`SCS-054`, a three-value enum) vs **`Do Not Default Salesperson`**
  (`SCS-060`, described as a checkbox) — the same setting, documented incompatibly.
- **`Sales Margin Scratchpad Cost`** (`SCS-054`: three options) vs **`Costed Line Item Inquiry Uses`**
  (`SCS-071`: two options) — two margin-display cost bases that should agree.
- **Three separate AP-vs-VR destination settings**: `Paid Pending Bill Reimbursement Method` (`SCS-052`),
  `Vendor Rebate Chargeback Method` (`SCS-058`), `Vendor Chargeback Method` (`SCS-070`).
- **Two parcel-route settings**: `Parcel Route Code` (`SCS-054`) and `Parcel Route` (`SCS-086`).
- **Three "From" email precedence levels**: `SCS-050` global, Warehouse/Store Location Settings per-location,
  and `SCS-086` web override.
- **Two QuickBooks "do not change the defaults" warnings with different exception lists** (`SCS-052`,
  `SCS-080`).
- **Two cart price-on-conversion policies** (`SCS-071`: eSTORIS "current price, up or down" vs PC/Terminal
  "lower of the two").
- **`Restrict Scheduled Date` can be null (unlimited)** while **`SCS-069`'s 999-day reservation ceiling is
  absolute** — an order can be scheduled that can never be reserved.
- **`weight` appears in `SCS-065`'s over-capacity warning list** with no corresponding `Maximum Weight` field.
- **`SCS-081` references a "STORIS Accounting" tab on TPA Control Settings** that `SCS-080` does not document.
- **`SCS-063` documents the WMS-group requirement** that belongs to `SCS-085`.
- **`SCS-078` names a `Test Email` button** that does not appear among `SCS-050`'s four test buttons.
- **`SCS-052`'s QuickBooks exception list names `Purge History After`**, a field that does not exist on the
  screen (the real field is `Days to Keep Invoice History`).
- **`SCS-067`'s `Sales Analysis Retention`** is referred to from `SCS-054` as `Periods of Data Retention`.
- **Unescaped single-character delimiters** in three places: `SCS-057` (configured vendor model),
  `SCS-085` (WMS import/export), `SCS-086` (primary and secondary export delimiters).
- **Three "automatic stock adjustment" switches** that let the POS create inventory that does not exist:
  `SCS-054` `Auto Adjust Stock on Take With`, `SCS-060` `Automatic Stock Adjustments`,
  `SCS-070` `Auto Adjust Parts on Quick In-Shop`.

---

## Part B summary notes

**Coverage.** 43 of 43 assigned articles written up (`SCS-045` … `SCS-087`), positions 45–87 of the System
Control Settings section enumeration. **No article was skipped or sampled.** Two articles are genuinely thin
and are marked as such in place (`SCS-076` System Security Window, `SCS-078` Test Email Server Connection);
both were retained because each documents a mechanism referenced by many other articles.

**Split point.** Re-enumeration confirmed 87 articles, position 44 = `Legal Code Settings` and position 45 =
`Maintain Credit Application Letter Print UNC Path`, exactly as expected. **No renumbering was required.**

**Known content gaps inside articles that were read** (the source itself does not document these):
- `SCS-071` — the **`PDA` tab** is named in the tab list and never documented.
- `SCS-079` — **the application field list itself** is never enumerated; only the three grid columns are.
- `SCS-086` — the `Credit` section is missing **three field headings**; the paragraphs describe a
  pre-authorization field, a `Use Auth/Capture for Credit Cards` field, and a reversal-message field.
- `SCS-081` — `GL Batch Creation`, `AP Bill Creation`, and `Shared file update (includes AP Bill deletion)`
  are listed with no explanation.
- `SCS-085` — no import definitions, field mappings, error handling, or on-hand reconciliation.
- `SCS-077` — the access path is given only as "Menu".
- `SCS-051`, `SCS-047` — `MicroD Control Settings` field-level detail is never given.
- Blank/zero behavior is undocumented for: `SCS-052` `Days to Keep Invoice History` and
  `Allowable Cost Variance`; `SCS-058` both PO-retention fields; `SCS-070` `Keep Status Data for Days`;
  `SCS-071` all three cart-retention fields; `SCS-074` `Inbound/Outbound Retention Days`;
  `SCS-080` `Days Before Purging History Log`; `SCS-084` `Number of Days History` (blank case);
  `SCS-055` `Warehouse List`; `SCS-064` `Paper Statement Fee > Amount`.

**No article content addressed the reader as an agent or attempted to give instructions.** All text was
ordinary product documentation. The only text that reads like an instruction to the operator and is worth
flagging on its own merits is `SCS-086`'s advice to enter placeholder tax data (`"999999"`), which is a
documentation defect, not an injection attempt.
