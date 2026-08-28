# Run 07 — System Administration — Batch 17: External Integrations and Membership Rewards

Status: complete. Findings 562–581. Read-only throughout.

**Two things close here.** `External Communications Settings` turns out to be a **23-tab registry of
every external system STORIS talks to** — the complete third-party dependency surface, in one record,
which no prior batch had located. And the **membership rewards model** is now fully reconstructed,
retiring run 03's **F158** declaration that it was *"unreconstructable"* — the third time in this run
that a scope-bounded "we cannot reconstruct this" has fallen to the section the six-run queue omitted.

---

## A. Coverage log

| # | Article | id | Section | Status |
|---|---|---|---|---|
| 1 | **External Communications Settings** | 15186452794644 | System Control Settings | read — `11.0` / `10.8` |
| 2 | **Membership Reward Settings** | 16917259015188 | Customer Settings | read |
| 3 | **Membership Rewards Program Overview** | 18382550076436 | Overviews | read (followed link) — **the model** |
| 4 | **STORIS Messenger Control Settings** | 15186501104788 | System Control Settings | read |
| 5 | **Purge Messenger Activity** | 15234723664916 | System Administration | read |
| 6 | **Payment History Profile** | 20200553866004 | Accounting › Receivables | read |
| 7 | **Credit History Codes** | 15295210650004 | Accounting Views and Reports | read (followed link) |
| 8 | **Membership Rewards FAQS** | 36207532600084 | — | noted, not read |

**Queue corrections carried from batch 16:**
- `Switch User` — **does not exist as an article.** Searches return only `Switch User Location`
  (read, batch 16 F560), `Main Menu Screen` and `System Security`. The procedure is referenced three
  times by `Switch User Location` but is not separately documented. Recorded in §H rather than
  hunted further.
- `Process List Settings` — **no article.** Referenced by `Create a User` as the place
  `List Type` = *'Accessible Location List'* is defined. Undocumented; §H.
- `Payment History Code` — resolves to **two** articles that disagree with each other (F579).

---

## B. Wiring findings

### FINDING 562 — One settings record holds the entire external dependency surface: 23 integrations

- **Invariant:** every third-party system STORIS connects to is configured on one record, one tab each.
- **Evidence** — `External Communications Settings`:
  > "**Tabs: Silanis, White Pages, Circle Graphics, RetailDeck, Server Login, Ensenda, Tender Retail, U2 Server, Shift-4, Podium, STORIS RMI, Advanced Dispatch Track, Signifyd, Kount, flexEngage, Notification Text Provider, Montage, Guardsman, Ashley API, EDI, GBS, Phoenix, Extend**"
  > "Use this routine to set up external communication settings used by STORIS programs to **connect to and validate connections to external sources.**"

| Tab | Purpose (as documented, or inferred from field names — marked) |
|---|---|
| **Silanis** | *"capture of e-Signatures on installment contracts"* |
| **White Pages** | *"WhitePages Pro API 2.0"* — identity/address lookup |
| **Circle Graphics** | *not described* — `URL` · `Access Token` · `Customer ID` · timeout |
| **RetailDeck** | *"the RetailDeck interface"* — product import (cf. Sales Security permission) |
| **Server Login** | `User ID` · `Password` — *purpose not described* |
| **Ensenda** | *"transmit manifest order details to Ensenda"* — 3PL delivery |
| **Tender Retail** | *"Tender Retail MCM server settings"* — payment |
| **U2 Server** | `Host IP Address` — the UniData/U2 platform host |
| **Shift-4** | *"between the STORIS server and the Shift-4 UTG(s) [Universal Transaction Gateway]"* — payment, **legacy config** |
| **Podium** | *"Podium reputation management service"* |
| **STORIS RMI** | *"STORIS RMI reputation management service"* |
| **Advanced Dispatch Track** | delivery dispatch/routing |
| **Signifyd** | *not described* — fraud (inferred from vendor) |
| **Kount** | `RIS`/`REST Connection URI` · `Merchant ID` — fraud (inferred) |
| **flexEngage** | *"Digital Receipts Interface module"* |
| **Notification Text Provider** | `From Telephone Used by Provider` — SMS |
| **Montage** | `Vendor Code` — *purpose not described* |
| **Guardsman** | `Retail Number` · `Vendor Code` — protection plans (inferred) |
| **Ashley API** | `Customer Number` · `Ship To Number` · `Custom Cost` — vendor integration |
| **EDI** | trading-partner transport |
| **GBS** | `Retailer Number` · `Vendor Code` — protection plans (inferred) |
| **Phoenix** | `Dealer Number` · **`Inventory Formations (Appliances)`** — protection plans (inferred) |
| **Extend** | `Store ID` · `Vendor Code` — protection plans (inferred) |

- **Maps to:** batch 15 F533 (3PL EDI) · batch 16 F559 (notification providers) · batch 13
  (protection plans) · batch 5 (UniData) · W-058, W-051.

> **For a parity audit this is the most directly actionable record found in seven runs.** It is the
> answer to *"what does STORIS talk to?"* — a question the rebuild has to answer completely, because
> every one of these is either a contract to port, a vendor to re-negotiate, or a capability to drop.
> **Nothing else in the help centre enumerates them.**
>
> **Four protection-plan providers appear** — Guardsman, GBS, Phoenix, Extend — which is more than
> batch 13's Protection Plan Settings suggested. `Phoenix` carries an
> **`Inventory Formations (Appliances)`** field, tying the provider to a product set (batch 13 F491),
> so provider selection is **merchandise-scoped**, not global.
>
> **Two reputation-management providers** (Podium, STORIS RMI) and **two payment gateways**
> (Tender Retail, Shift-4) sit side by side, both marked as alternatives rather than complements.
> **Two fraud services** (Signifyd, Kount) likewise.
>
> **`U2 Server` is the platform itself.** Batch 5 established STORIS runs on UniData; here the U2
> host address is configured as *an external communication endpoint*, which says the application
> and the database are separable deployments.
>
> **Five tabs have no descriptive text at all** — Circle Graphics, Server Login, Signifyd, Montage,
> and the bare `Connection URI`/`API Key`/`Timeout`/`UTC Offset` block between Advanced Dispatch Track
> and Kount. Their purpose is **inferred from vendor name only** and marked as such above. §H.

### FINDING 563 — STORIS explicitly declines to validate integration credentials

- **Invariant:** connection parameters are stored as typed, unverified, with the responsibility stated as the user's.
- **Evidence** — `External Communications Settings`, twice:
  > "**NOTE: The STORIS RMI URL and API Key fields are not validated by STORIS, so it is the responsibility of the user to ensure that the data entered is correct.**"
  > "**NOTE: Be sure to enter the API Code, API Key, and API URL fields accurately because they are not validated by STORIS.**"
  Against the record's own stated purpose:
  > "…used by STORIS programs to connect to and **validate connections to** external sources."
  And several tabs *do* offer explicit test actions — `Send Test Email from STORIS Host Server`,
  `Test Notifications Server Connections` (batch 16, Notifications Control Settings).
- **Maps to:** run 04 **F290** (*detect-and-report as house style*) · batch 15 F519 (schemas not
  enforced) · W-058.

> **This is a third variant of the house style, and the weakest one: neither detect nor report.**
> Run 04 found STORIS detects and reports rather than enforcing; batch 15 found it warns and stores
> anyway. Here it does not check at all, and says so.
>
> **The record's opening sentence claims validation and two NOTEs withdraw it** for the tabs where it
> matters most. The distinction appears to be that **connectivity can be tested where STORIS owns the
> protocol** (its own email and notification servers) and **not where a third party owns it** — which
> is a reasonable line, but it means a typo in an API key surfaces as a silent integration failure at
> transaction time, not at save.
>
> **For the cutover:** the live values in this record cannot be assumed correct just because they are
> present. Anything in here that the rebuild inherits should be **connection-tested independently**
> before go-live.

### FINDING 564 — Podium's authentication mode is chosen by which URI field is populated

- **Invariant:** two URI fields select between session-token and merchant-ID authentication, with a stated precedence.
- **Evidence** — `External Communications Settings`, Podium tab:
  > "**The following two fields can both be populated. If the `Datafeed URI` is populated, that address is used with Podium; if that field is not populated, the `Podium URI` field is used. If both fields are populated, the `Datafeed URI` is used.**"
  > "**When the `Datafeed URI` field is populated, STORIS makes communication with a session token received from Podium after submitting both the `STORIS ID` and `STORIS SECRET` in a specially formatted message. This authentication token is used for the current communications session and then destroyed. Every time a new communications session is created, a new token is created.**"
  > "**When the `Datafeed URI` field is not populated, STORIS makes communication with the `Podium URI` and uses the `Merchant ID` as authentication.**"
  > "These parameters are **global for the entire user account.**"
  > "To use this service, the **Reputation Management Interface module and Podium submodule must be licensed and active** via the Licensing tab of General System Control Settings."
- **Maps to:** F562 · batch 4 (licensing) · batch 16 F557 (module + submodule) · W-051, W-058.

> **Presence-of-a-field as a mode switch** — the same blank-versus-populated idiom the audit has met
> 17+ times in fall-through hierarchies, applied here to **choose an authentication protocol**. The
> precedence is stated explicitly, which is more than most STORIS fall-throughs manage.
>
> **The two modes are not equivalent in security terms**, and a rebuild should not treat them as
> interchangeable: one is ephemeral per-session tokens derived from an ID/secret pair, the other is a
> **static merchant ID used as the credential**. If LA Mattress is on the `Podium URI` path, they are
> authenticating with a long-lived shared identifier.
>
> The **module + submodule** licensing shape recurs from batch 16 F557 (`Consumer Email
> Notifications` as a submodule). **Licensing is two levels deep**, and batch 4's enumeration was
> single-level. Recorded as a refinement in §H.

### FINDING 565 — Integration settings can be configured before the module is licensed

- **Invariant:** two tabs explicitly permit setup while inactive, decoupling configuration from entitlement.
- **Evidence** — `External Communications Settings`:
  > "This tab is used for Advanced Dispatch Track. **It is available whether or not the account has been licensed to allow the merchant to enter the required settings before using Advanced Dispatch Track functionality.**"
  > "To use this service, the `Digital Receipts Interface` module must be active via the Licensing tab… **NOTE: Setup of this tab is permitted even if the `Digital Receipts Interface` module is not active.**"
  > "**The `User ID`, password, and URL are encrypted on the STORIS database.**" *(flexEngage)*
- **Maps to:** batch 15 **F538** (a licensed module validated **at save**, refusing the save) · batch 4 · W-051.

> **STORIS is inconsistent about this, and the inconsistency is documented rather than accidental.**
> Batch 15 F538 found `Vendor Quantity on Hand` **refusing the save** when unlicensed. Here two tabs
> go out of their way to say the opposite. So the product contains both *configure-then-license* and
> *license-then-configure*, with no stated rule for which applies.
>
> **The pre-configuration model is the better one** and is worth adopting uniformly in the rebuild —
> it lets a site prepare an integration before the commercial paperwork lands. But the audit records
> that **STORIS does both**, so a rebuild that picks one will diverge from the legacy behaviour on
> some screens either way.
>
> **flexEngage's credentials are encrypted at rest and the docs say so.** No other tab makes this
> claim — including the payment gateways. That is almost certainly documentation omission rather
> than a real difference, but it is **not something the audit can assume**: whether Shift-4 and
> Tender Retail credentials are encrypted is unstated. §H, and it matters for the extract.

### FINDING 566 — Saving the Extend tab forces a validation against Point of Sale Control Settings

- **Invariant:** one integration's save triggers a compliance check on an unrelated settings record.
- **Evidence** — `External Communications Settings`, Extend tab:
  > "**NOTE: Extend's API requires that the customer have an email address on file. To ensure customers are created with an email address, upon saving out of this process, Point of Sale Control Settings will be reviewed to ensure the `Email Address Required` setting is enabled. If not, a warning message is displayed.**"
- **Maps to:** batch 1 (POS Control Settings) · F563 · run 03 (customer creation) · W-058.

> **A cross-record consistency check at save time — and the audit's first example of one that reaches
> into a *different* settings record to verify a *precondition of a third party's API*.**
>
> It is a warning, not a block (F563's house style again), so the misconfiguration is permitted. But
> the design instinct is right and worth copying: **an integration knows what the rest of the system
> must be configured to do for it to work**, and says so at the moment someone turns it on.
>
> **For the rebuild this generalises into a useful pattern** — integration preconditions as
> declarative checks run at enablement. Extend needs customer email; Podium needs licensing; Ensenda
> needs its whole field set (*"If the `Activate Service` field is checked, the remaining fields on
> this screen are mandatory"*). Three different precondition styles on one record.

### FINDING 567 — An integration is gated on the underlying database version

- **Invariant:** Silanis e-signature requires a minimum UniData release.
- **Evidence** — `External Communications Settings`, Silanis tab:
  > "**NOTE: In order to use this feature, clients need to establish a partnership with Silanis and must be running UniData v7.3.x or higher.**"
- **Maps to:** batch 5 (**UniData named**) · batch 16 F556 (UniData licence expiry) · batch 4 (AIX vs Cloud) · W-051.

> **The third time UniData surfaces as a *business* constraint rather than an implementation detail.**
> Batch 5 identified it as the platform; batch 16 found its licence expiry can stop the business;
> here a **feature is unavailable below a database version**.
>
> For LA Mattress this is a concrete question with a concrete answer available from their system:
> **which UniData version are they on?** It bounds which STORIS features are actually reachable today,
> and therefore what the parity target genuinely is — separately from the Cloud-tenancy restriction
> found in batch 16 F559.
>
> Note also *"clients need to establish a partnership with Silanis"* — several of these 23 are
> **commercial relationships the site holds directly**, not things STORIS resells. The extract will
> show configuration; it will not show which contracts exist.

### FINDING 568 — The membership rewards model, reconstructed — retiring run 03 F158

- **Invariant:** membership and rewards are independent features that compose, with a five-record setup chain.
- **Evidence** — `Membership Rewards Program Overview`:
  > "This feature allows customers to accumulate rewards on completed orders as part of participating in a membership program. **The functionalities of customer membership programs and customer rewards are applicable separately, but membership rewards allow them to work in conjunction with additional benefits.**"
  > "**The sale of a membership program triggers the accumulation of customer rewards points on future completed orders.**"
  The setup chain, verbatim:
  > "**`Customer Rewards Control Settings`** > Select `Reward Points Accumulated Only With Purchased Membership`…
  > **`Point of Sale Control Settings`** > Select the `Activate Customer Rewards Program` and `Activate Customer Membership Program` settings.
  > **`Membership Rewards Settings`** > …establish the rules…
  > **`Advanced Product Settings`** > …**Uncheck the `Product Earns Reward Points` setting for any product that is not eligible**…
  > **`Customer Membership Settings`** > …view and manage customers' memberships."
  > "When the **`Accumulate Reward Points`** field is checked in **Advanced Customer Settings** for a customer with a purchased membership, the accumulation is **conditional with the customer's membership status and the settings in Membership Rewards Settings.**"
  > "…**one person can have multiple accounts in the customer master file, however only one of those accounts may have a membership program.**"
- **Maps to:** **run 03 F158** (*"membership rewards declared unreconstructable"*) — **retired** ·
  batch 4 (rewards model, partial) · batch 14 F510 (rewards vary by district) · W-046, W-063.

> **Run 03 concluded the rewards model could not be rebuilt from the documentation. It can — the
> documentation was in a different section.** This is the **third** time in run 07 that a
> scope-bounded "unreconstructable" has fallen: rewards (here), messenger retention (F581), and five
> of the thirteen undefined terms. The meta-lesson is now firmly established and should be stated
> plainly in the run summary: **the audit's negative conclusions were conclusions about coverage, not
> about STORIS.**
>
> **The model is a five-way AND**, and every one of the five can silently switch rewards off:
> POS Control Settings must activate *both* programs · Customer Rewards Control Settings decides
> whether membership is required · the customer must have `Accumulate Reward Points` checked ·
> the product must not have `Product Earns Reward Points` unchecked · the membership must be active.
>
> **The multi-account sentence is a real data-model constraint**: a person may hold several customer
> records but **at most one may carry a membership**. That is a uniqueness rule across records that a
> naive rebuild will not enforce, and it is the kind of thing that produces double-accrual.

### FINDING 569 — Reward accrual rates vary by payment class

- **Invariant:** points are earned at one rate normally and a different rate on revolving sales.
- **Evidence** — `Membership Reward Settings`:
  > "**Reward Points are Calculated at: ___% for Customers** | Use Case"
  > "**Reward Points for Revolving Sales are Calculated at: __% for Customers** | Use Case"
  `Membership Rewards Program Overview`:
  > "**Reward points may vary based on how an order was paid. Membership Rewards settings is used to determine how points are earned based on the various payment classes.**"
- **Maps to:** run 03 (payment types) · batch 13 (protection plans) · F570 · W-046, W-063.

> **Loyalty accrual is a function of tender type**, which couples the rewards engine to the payment
> module. The stated reason is commercial — revolving (in-house finance) sales are worth more to the
> business, so they earn more.
>
> **The same split recurs for protection plans** (F570: `Periods` vs `Periods When Paid With Revolving
> Plan`), so this is not a rewards quirk — **"paid with revolving" is a system-wide benefit
> multiplier**. A rebuild should model it once, as a property of the order's tender mix, not twice.
>
> Both fields carry a `Use Case` link the audit has **not** read — the worked examples showing how the
> percentage actually applies (to order total? to eligible lines? net of discount?). **The arithmetic
> is not on this page.** §H.

### FINDING 570 — Protection plans are *extended* or *enhanced*, and the two are different mechanisms

- **Invariant:** members who buy a plan get added time; members who buy none get a free plan.
- **Evidence** — `Membership Rewards Program Overview`:
  > "An **'enhanced'** warranty is provided **when the customer does not purchase a warranty** that is available for the merchandise purchased. An **'extended'** warranty **adds time to a warranty purchased.**"
  > "**Extend** — For members who purchase a protection plan for qualified merchandise, the length…can be extended by the `Period` established in Membership Rewards Settings. **Or, if the order meets the `Minimum Required Finance Amount`, then the `Periods When Paid With Revolving Plan` is used** for the extension. **This does not apply to manufacturer warranties.**"
  > "**Enhance** — For members who do not purchase a protection plan, but receive one as a free benefit. **This type of plan runs concurrently to the manufacturer's warranty when the `Extended Warranty Start` is set to `Factory Expires` in Warranty Settings.**"
  > "**Enhancing/Extending the warranties may be limited to specific merchandise.**"
  Settings: `Extend/Enhance Protection Plans` · `Period Type` · `Periods` ·
  `Periods When Paid With Revolving Plan` · `Minimum Finance Amount`.
- **Maps to:** batch 13 F495–F499 (Protection Plan Settings) · batch 11 (Warranty Settings,
  reference-only) · F569 · W-028.

> **Batch 13 closed Protection Plan Settings without knowing plans could be granted as a membership
> benefit.** The model is one dimension larger than recorded: a plan on an order may be *sold*,
> *extended* or *enhanced*, and only the first is a revenue event.
>
> **The "does not apply to manufacturer warranties" exclusion is precise and load-bearing** — the
> benefit attaches to *protection plans*, which batch 13 established are site-configured products with
> their own GL accounts, not to the factory warranty that batch 11 found is reference-only data.
>
> **Note the contradiction with the Enhance rule**, which *does* interact with the manufacturer
> warranty: the free plan *"runs concurrently to the manufacturer's warranty"* when
> `Extended Warranty Start` = `Factory Expires`. Extend ignores factory warranty; Enhance is
> positioned relative to it. **Two benefits, two different relationships to the same date.**

### FINDING 571 — The "enhanced" free plan is built by configuration, not by code

- **Invariant:** a zero-price protection plan over an inventory formation, with a zero-term warranty, *is* the enhancement mechanism.
- **Evidence** — `Membership Rewards Program Overview`, Setup for Enhance:
  > "**`Inventory Formation Settings`** > An inventory formation that includes products eligible for protection plan benefits must be created.
  > **`Warranty Settings`** > A warranty must be created for members who do not purchase another protection plan. **Assign the `Periods` for Labor and Parts to be 0.**
  > **`Protection Plan Settings`** > A protection plan must be created… The `Warranty Terms` should be assigned to the above warranty code. The `Inventory Formation` should be assigned to the above formation. **Set the `Pricing Method` to `Fixed Amount`, with a `Price Amount` of $0.00.**
  > **Select the `Protection Plan Selection Required for Membership Customers` checkbox for enhanced protection plans. For extended Protection Plans, leave this box unchecked.**"
- **Maps to:** batch 13 F491 (Inventory Formations) · batch 13 F497 (Pricing Method) · batch 11
  (Warranty Settings) · F570 · W-028.

> **This is configuration-as-implementation, and it is the clearest example the audit has found.**
> There is no "membership benefit plan" entity. The benefit is assembled from **three existing
> records** — a formation defining eligible merchandise, a warranty with zero-length terms, and a
> plan priced at a fixed $0.00 — plus one checkbox that flips the whole assembly from *extend* mode
> to *enhance* mode.
>
> **Batch 13's `Pricing Method` values were unpublished; `Fixed Amount` is now one of them.** A small
> gain, recorded.
>
> **The rebuild implication cuts both ways.** Reproducing this faithfully means the rebuild inherits a
> benefit that is invisible as a concept and only legible to someone who knows the recipe — a support
> burden. Modelling it as a first-class "membership benefit" is cleaner. But at **cutover**, the
> extract will contain $0.00 plans and zero-period warranties that look like data errors and are not:
> **anyone cleaning the migration data must know this recipe or they will delete the benefit.**

### FINDING 572 — Delivery charge tables are evaluated in list order and stop at the first match

- **Invariant:** free/reduced membership delivery tables must be sequenced ahead of charging tables.
- **Evidence** — `Membership Rewards Program Overview`:
  > "To waive or reduce delivery fees as part of a membership benefit, use **`Delivery Charge Table Settings`** and enter the appropriate **`Membership Product Code`** to include customers who are members under the new delivery charge amount. **Any free or reduced delivery charge tables should be listed in the `Delivery Company Settings` grid first before the tables that assign a delivery charge, as the charge tables are reviewed and applied in order and once a match is found any further tables are ignored.**"
- **Maps to:** run 04 (delivery charges, Delivery Company Settings) · batch 15 F518 (ordered schemas
  with Promote/Demote) · W-059, W-063.

> **A second ordered-list resolver, and the second one where sequence is the whole logic.** Batch 15
> found Stock Location Schema ordered by precedence with Promote/Demote buttons; this is the same
> pattern in delivery pricing — **first match wins, order is the configuration**.
>
> **This is a silent-failure design.** Put the membership table below a general table that also
> matches and the benefit simply never applies: no error, no warning, and the customer is charged.
> Nothing validates the ordering. Run 04 read `Delivery Company Settings` without recording that its
> grid order is semantically significant — **a correction by addition to run 04**, §H.
>
> `Membership Product Code` on a delivery charge table means **the membership product is a
> discriminator in pricing**, not just a customer flag.

### FINDING 573 — Reward points expire by two different clocks, drained by End of Month or a scheduled process

- **Invariant:** validity days come from either of two settings records, plus grace days, and purging runs monthly or on demand.
- **Evidence** — `Membership Rewards Program Overview`:
  > "Reward points are purged through either through the **End of Month** process or manually through **`Schedule a Process`**."
  > "Using the End of Month process, reward points are purged when the date has exceeded the **`Accumulated Points are Valid for __ Days` in Customer Rewards Control Settings *or* Membership Rewards Settings** plus any **`Purge Grace Days`** established in Membership Reward Settings."
  > "The scheduled process **`Purge Customer Reward Points`** can also be used to purge reward points at more frequent intervals at a desired day and/or time."
  `Membership Reward Settings` also carries: `Purge Reward Points if Membership is No Longer Active`.
- **Maps to:** batch 5 (the batch calendar) · batch 14 F508, F515 · batch 15 F529 · batch 16 F559
  (`Schedule a Process` gated on notification config) · W-041, W-063.

> **The word "or" is doing unexplained work.** The same setting name exists on **two different
> records** — `Customer Rewards Control Settings` and `Membership Rewards Settings` — and the
> sentence does not say which governs, or whether it depends on membership status. This is a
> two-rung hierarchy with **no stated resolution**. §H.
>
> **Fifth End-of-Month responsibility**, alongside `Generate Monthly Reports` purging kit promotions
> (batch 14 F515) and messenger purging (F581). The audit's standing conclusion holds: **the batch
> calendar is business logic** — here it is the thing that expires customer money.
>
> `Purge Customer Reward Points` and (F574) `Reward Gift Certificate Generation` are **two more named
> scheduled processes**, joining `Customer Membership Renewals` (F575). Run 07 has now named four
> scheduled processes plus `Scheduled Settings Update` (batch 14 F508). **There is no consolidated
> list of them anywhere.** §I.

### FINDING 574 — Reward gift certificate money can never become cash, by four separate rules

- **Invariant:** returns, deletions and overpayments all route certificate value back to a certificate, never to a refund.
- **Evidence** — `Membership Rewards Program Overview`:
  > "**Returns** — When returning items bought with a rewards gift certificate, **whenever possible the amount will be refunded to the existing certificate**, if the certificate has been purged or expired, **a new certificate will be issued regardless of whether the customer has an existing membership.** When returning items that generated rewards points, **the reward points are removed from the customer's account.**"
  > "**Order Deletion** — If an order with a rewards gift certificate applied to it is being deleted, **the gift certificate balance will be updated in the customer's account. This prevents the need for the user to maintain customer deposits and eliminates the possibility of refunding the certificate amount to the customer as cash.**"
  > "**Order Overpayment** — …the certificate is updated when there are no other payments that meet or exceed the overpayment. **If multiple rewards gift certificates are applied to an order resulting in an overpayment, no gift certificate amount is posted the customer's open item account. No overpayment or rewards gift certificate amount can be refunded to the customer.**"
  > "In order to apply a rewards gift certificate to a sales order, the **`Must be an Active Member to Redeem Reward Gift Certificate`** setting…must be checked, if the membership is no longer active, **a warning message appears**."
  Settings: `Gift Certificates can be Issued for: __% of the Accumulated Points` ·
  `Gift Certificates are Valid for __ Days` · `Gift Certificates Issued for Refunds are Valid for __ Days` ·
  `Automatically Create Reward Gift Certificates` · `Create Reward Gift Certificates __ Months` ·
  `Minimum Reward Amount` · `Number of Days Before Points Can Be Converted to a Gift Certificate` ·
  `Number of Days Before Reward Gift Certificate Can be Used` ·
  `Must be Redeemed By Customer Who Was Issued the Gift Certificate` ·
  `Reward Gift Certificates Can Be Used To Pay For` · `Protection Plans`.
- **Maps to:** run 03 (deposits, refunds) · batch 16 §3 Sales Security
  (`Override the Restriction to Limit Use of Rewards Gift Certificates to Issuing Customers`) ·
  W-035, W-063.

> **The design goal is stated outright — *"eliminates the possibility of refunding the certificate
> amount to the customer as cash"*** — and it is enforced at four separate exit points. This is
> unusually explicit intent for STORIS documentation, and it is the right rule: reward value is a
> promotional liability, not tender.
>
> **The multiple-certificate overpayment case is a deliberate value sink.** *"No overpayment or
> rewards gift certificate amount can be refunded"* — the money is neither returned nor credited to
> the open-item account. **A rebuild must decide whether to reproduce that**, because it is a
> customer-visible loss with no audit trail described, and it will generate complaints.
>
> **Two anti-fraud controls with a documented override:** the certificate can be locked to its issuing
> customer, and redemption can require active membership. The Sales Security permission dissected
> earlier this session (`Override the Restriction to Limit Use of Rewards Gift Certificates to
> Issuing Customers`) is **exactly the escape hatch for the first** — a clean example of the
> override-implies-a-restriction pattern from that handoff, confirmed from the other side.
>
> **Four separate delay/validity timers** — days before points convert, days before a certificate can
> be used, certificate validity days, and a *different* validity for refund-issued certificates. All
> configurable, none defaulted in the docs.

### FINDING 575 — Auto-renewal requires a stored payment token and fails for six named reasons

- **Invariant:** membership renewal is a scheduled charge against a shared gateway token, blocked by six account conditions.
- **Evidence** — `Membership Rewards Program Overview`:
  > "**Automatic renewal occurs when memberships are setup to `Automatically Renew` in Membership Rewards Settings and a scheduled process has been created for `Customer Membership Renewals`. For renewals to occur, the customer must have a shared token from either Shift4 or the new gateway.**"
  > "The **`Prompt for Auto-Renewal`** in Membership Rewards Settings creates a popup message to prompt the customer if they would like to automatically renew…"
  > "**A renewal will not occur for any of the following reasons: Renewal will exceed the customer's credit limit. · The account has been charged off. · The account has legal settings assigned that do not allow payments to be added. · The revolving plan is closed. · The customer's account is closed. · The customer does not have a revolving plan or credit card on file.**"
- **Maps to:** F562 (Shift-4) · run 03 (payments, credit limits) · batch 5 (the batch calendar) ·
  W-035, W-063.

> **Six blocking conditions, enumerated — which is rare and valuable.** Most STORIS failure paths in
> this audit are undocumented; this one lists them, and they span **three modules**: credit
> (limit, charge-off), legal/collections (*"legal settings assigned that do not allow payments"*), and
> payments (closed plan, no token). A rebuild's renewal job needs all six as explicit guards.
>
> **"Legal settings that do not allow payments to be added" names a collections/legal subsystem the
> audit has never read** — it implies accounts under legal action have a payment-blocking flag. §I.
>
> **"Shift4 or the new gateway"** is the audit's first sighting of a **payment platform migration in
> progress at STORIS**. `External Communications Settings` (F562) shows the Shift-4 tab marked
> *"Legacy Shift4 configuration"* pointing at `Shift4 Cloud Credit Card Processing Overview`. So there
> are **two Shift-4 integrations**, old and new, and the docs do not name the new gateway here.
> **Directly relevant to the cutover:** LA Mattress's tokens live in whichever gateway they are on,
> and stored tokens are generally **not portable** between processors. §H — flagged as a question to
> resolve early, since it affects every recurring charge.

### FINDING 576 — Cancellation is immediate and reachable three ways, including by return

- **Invariant:** unchecking one flag ends the membership and all benefits at once; a product return can do it.
- **Evidence** — `Membership Rewards Program Overview`:
  > "**Membership cancellations occur when the `Active Member` option in Advanced Customer Settings or Customer Membership Settings is unchecked. It can be unchecked manually, when a renewal is unsuccessful, or when a membership product is returned. The membership and its associated benefits are canceled immediately.**"
  > "**The period when a membership can be returned is determined by the `Number of Days that a Membership Product Can Be Added to a Return` setting… Note that memberships cannot be returned when the customer has open orders.**"
  `Membership Reward Settings` also carries: `Number of Days New Memberships Can Be Sold Before Renewal Date` ·
  `Check Order's Written Date if Customer is not a Member When Completing Order` ·
  `Maximum Number of Linked Accounts` · `Not Available to these Customer Price Categories` ·
  `Prompt User For Completion of a Take With Membership Product`.
- **Maps to:** F575 · run 03 (returns) · batch 14 (return restrictions) · W-063.

> **One boolean on the customer record is the membership's on/off switch**, writable from two screens
> and settable by two automatic paths. That is a lot of write access to a flag that
> *"immediately"* cancels benefits — including, per F570, protection plan enhancements that may
> already be attached to delivered merchandise. **What happens to an already-granted enhanced plan
> when membership lapses is not stated.** §H — and it is a real commercial question, not a modelling
> nicety.
>
> **"Memberships cannot be returned when the customer has open orders"** is a sensible guard with an
> obvious motive: open orders may be pricing benefits that would vanish mid-flight.
>
> **`Check Order's Written Date if Customer is not a Member When Completing Order`** is a
> retro-eligibility rule — someone who joins between writing and completing an order can still be
> treated as a member. Backdating eligibility is unusual and worth carrying deliberately.

### FINDING 577 — A seventh deletion policy: history-based

- **Invariant:** the settings record is deletable only when the membership product has no activity anywhere, including in completed orders.
- **Evidence** — `Membership Reward Settings`:
  > "**NOTE: A settings record can only be deleted when there has been no activity for the membership product in open orders, shopping carts, or completed orders.**"
- **Maps to:** batch 14 §G · batch 15 F536 · batch 16 · W-034.

> **The complete catalogue is now seven policies**, and this is the strictest:
>
> | Policy | Gate | Example |
> |---|---|---|
> | Forbidden outright | never deletable | Purchase statuses (batch 14 F507) |
> | Blocked — referential | something points at it | Handling method; Vendor EDI record; 3PL code |
> | Blocked — stateful | it currently holds something | Storage location (batch 15 F536) |
> | **Blocked — historical** | **it was ever used, including in closed transactions** | **Membership reward settings (F577)** |
> | Warned cascade | shows affected count, then proceeds | Substitution list (batch 14 F516) |
> | Silent cascade | rewrites consumers without asking | Inventory formation (batch 13 F494) |
> | Self-healing | consumers clean themselves up | User/group in purchase statuses (batch 14 F507) |
>
> **Historical blocking is different in kind from the other two blocks** and cannot be implemented as
> a foreign key or a state check — it requires scanning transaction history, including *completed*
> orders that will never change again. In practice it means **a membership settings record is
> permanently undeletable once anyone has ever bought the product.** That is probably intentional
> (the record explains historical accruals) but it means the live system accumulates settings records
> forever, and the extract will contain obsolete ones that cannot be pruned.

### FINDING 578 — Payment history is a nine-value coded string with two immutable values

- **Invariant:** each cycle period carries one code; `0` and `B` cannot be edited, and the most recent period is hidden.
- **Evidence** — `Payment History Profile`:

| Code | Description |
|---|---|
| `0` | *"0 payments past due (current account) – **Cannot update**"* |
| `1`–`6` | 30-59 · 60-89 · 90-119 · 120-149 · 150-179 · **180+** days past due |
| `C` | *"STORIS defined for Current"* |
| `B` | *"Customer does not exist – **Cannot update**"* |

  > "**NOTE: The most recent cycle period cannot be edited and has been omitted from the display. In the grid, month 1 indicates the cycle period before the most recent period.**"
  > "**Periods in which the code is 0 cannot be updated because cycle processing was not run for the customer. Periods with a code of `B` cannot be updated because the customer did not exist in those periods.** Attempting to edit these fields will result in a warning message being displayed and the entry being rejected."
- **Maps to:** run 03 / run 05 (receivables) · batch 10 (status codes) · W-035, W-036.

> **This is a credit-bureau-style trade line held internally** — a fixed-width history where position
> is the period and the character is the delinquency bucket. The buckets are the standard 30-day
> ladder.
>
> **Two codes mean "no data", for two different reasons**, and both are immutable: `0` means the cycle
> process never ran, `B` means the customer did not exist. Distinguishing *absence of processing*
> from *absence of customer* is a good design and a rebuild should keep both rather than collapsing
> them to null.
>
> **The most recent period is deliberately hidden and uneditable** — a small integrity control that
> stops anyone rewriting the period the system is still computing.

### FINDING 579 — Two articles define the payment history codes differently

- **Invariant:** `C` and `0` carry different meanings in the maintenance screen and the reference article.
- **Evidence** — `Payment History Profile`:
  > "`0` — **0 payments past due (current account)**" · "`C` — **STORIS defined for Current**"
  `Credit History Codes`:
  > "**`C` - The account is/was current. (0-29 days balance paid)**"
  > "**`0` - The account is/was current. (0-30 days w/ no balance)**"
  > "When displaying the recent credit history for a customer, STORIS uses the following codes, **applying the status of the account at the time the last cycle process was run**."
- **Maps to:** F578 · W-035.

> **The two articles agree on `1`–`6` and disagree on `C` and `0`.** `Credit History Codes` draws the
> distinction as **balance paid** (`C`) versus **no balance at all** (`0`), which is a meaningful
> commercial difference — a customer who pays on time is not the same as one who never owed. But
> `Payment History Profile` says `0` cannot be edited *"because cycle processing was not run"*, which
> is a **third** meaning: no data.
>
> **`0` therefore has two documented meanings and they are incompatible** — "current with no balance"
> and "never processed". The audit **will not resolve this by reasoning**; it is recorded as a
> documentation contradiction and a **parity test to run against live data**, since the distribution
> of `0` values in the real history will settle it. §H.
>
> Note the boundary wording also differs: `C` is *0-29 days* and `0` is *0-30 days* — overlapping
> ranges in the same list.

### FINDING 580 — Automatic messenger emails write an audit comment onto the order document

- **Invariant:** four inventory events trigger an email and simultaneously stamp the order with who/when/where.
- **Evidence** — `STORIS Messenger Control Settings`:
  > "**NOTE: When an automatic e-mail is generated based upon any of the three following settings, an audit comment is also written to the order document indicating when the message was sent. The comment includes the date, time, location, user initials, and subject (how order has been filled) of the e-mail sent to the employee.**"
  > "**-When a Special Order Item is Received · -When Back-Order is Filled by Linked Purchase Order · -When Received Merchandise is Reserved · -When Received Merchandise cannot be Reserved**"
  Full trigger list on the Messaging tab: `When a Special Order Item is Received` ·
  `When Back-Order is filled by Linked Purchase Order` · `Purchase Order Delivery Date Changes` ·
  `When Received Merchandise Could Not be Reserved` · `To Buyer When Purchase Order Is` ·
  `When a One-Time-Buy Purchase Order is Received` · `When Received Merchandise is Reserved` ·
  **`When an EOD/EOM Processing Error is Reported`**.
- **Maps to:** run 05 F292 (the tickle notification matrix) · batch 5 (seven notification channels) ·
  run 06 F316 · batch 15 F529 · W-041, W-064.

> **The docs say "three following settings" and list four** — the same off-by-one defect pattern as
> batch 15 F528 ("five fields" followed by seven). **Recorded, not silently corrected.**
>
> **The notification and the audit trail are the same event**, which is a genuinely good design: you
> cannot have been notified without the order recording it. The comment carries **location and user
> initials**, so the order document accumulates a provenance trail of automated activity, not just
> human edits. Run 05's tickle matrix recorded the notifications; it did not record that they leave
> evidence on the document.
>
> **`When an EOD/EOM Processing Error is Reported` is the important one operationally.** It is the
> only channel the audit has found by which **a failed nightly batch reaches a human**. Given how much
> business logic runs in End of Day (releasing credit holds, reserving hard kits, raising POs,
> expiring reward points), **this setting is the difference between a silent overnight failure and a
> noticed one.** Worth confirming it is enabled in live STORIS.

### FINDING 581 — Messenger retention is three independent periods, purged at End of Month, gated by an administrator flag

- **Invariant:** closed, inbound/outbound and task messages age separately; a monthly job deletes them; only mail administrators may run it manually.
- **Evidence** — `STORIS Messenger Control Settings`:
  > "**`Closed Retention Days` · `Inbound /Outbound Retention Days` · `Task Retention Days`**" · `Message Review at Login`
  `Purge Messenger Activity`:
  > "Use this routine to purge STORIS Messenger messages **marked for deletion**. The program purges **all messages deleted before a user-defined cutoff date.**"
  > "**This program runs during End-of-Month processing, purging all messages deleted before the number of days defined at the `History Retention Days` field in the STORIS Messenger Control Settings.**"
  > "**NOTE: This process is available only to users with the `Mail Administrator` field enabled in their User file (Staff File) record.**"
- **Maps to:** run 06 F316 (STORIS Messenger named) · **the audit's "messenger retention
  unreconstructable" note** — **retired** · batch 16 (Staff file vocabulary) · W-041, W-064.

> **Second "unreconstructable" retired in one batch** (with F568). Messenger retention was recorded as
> unanswerable; it is three named fields and a monthly job.
>
> **Deletion is two-phase**: users mark messages for deletion (they land on a `Closed` tab, still
> readable via `Send/Review Mail Messages`), and a **separate monthly purge** actually removes them.
> So "deleted" in STORIS Messenger means *pending deletion* for up to a month plus the retention
> window. **For a rebuild handling discovery or retention obligations, that distinction matters.**
>
> **The article names a fourth retention field — `History Retention Days` — that is not in the control
> settings field list** (which shows Closed, Inbound/Outbound, Task). Either a fourth field the field
> list omits, or a stale name for one of the three. §H.
>
> **`Mail Administrator` is a permission living on the User file outside the ten security modules** —
> consistent with batch 16's finding that the access-control surface is wider than the module records.

---

## C. Screen and field inventory (additions)

Field lists are given inline above. Structural summary:

| Screen | Tabs |
|---|---|
| `External Communications Settings` | **23** (F562) |
| `Membership Reward Settings` | General · Reward Points · Reward Gift Certificates · Extend/Enhance Protection Plans |
| `STORIS Messenger Control Settings` | General Information · Messaging |
| `Purge Messenger Activity` | single field: `Cutoff Date` |
| `Payment History Profile` | grid of cycle periods × codes |

---

## D. Control settings catalog (additions)

| Setting | Record | What it decides |
|---|---|---|
| `Reward Points Accumulated Only With Purchased Membership` | Customer Rewards Control Settings | Whether rewards require a membership (F568) |
| `Activate Customer Rewards Program` / `Activate Customer Membership Program` | POS Control Settings | Two master switches, both required (F568) |
| `Product Earns Reward Points` | Advanced Product Settings | Per-product accrual eligibility (F568) |
| `Accumulate Reward Points` | Advanced Customer Settings | Per-customer accrual (F568) |
| `Active Member` | Advanced Customer Settings / Customer Membership Settings | The membership on/off flag (F576) |
| `Accumulated Points are Valid for __ Days` | **both** Customer Rewards Control Settings **and** Membership Rewards Settings | Point expiry — **precedence unstated** (F573) |
| `Extended Warranty Start` = `Factory Expires` | Warranty Settings | Positions an enhanced plan against factory warranty (F570) |
| `Protection Plan Selection Required for Membership Customers` | Protection Plan Settings | Switches enhance mode on (F571) |
| `Email Address Required` | POS Control Settings | Checked when saving the Extend tab (F566) |
| `History Retention Days` | STORIS Messenger Control Settings | Messenger purge cutoff (F581) |
| `Membership Product Code` | Delivery Charge Table Settings | Makes a charge table membership-scoped (F572) |

---

## E. Security permissions catalog (additions)

| Permission | Where | Effect |
|---|---|---|
| **`Mail Administrator`** | User file (Staff File) | Required to run `Purge Messenger Activity` (F581) |

> Confirms batch 16's conclusion that permissions exist **outside** the ten security modules.

---

## F. State machines and enumerations (additions)

**Payment history codes** — nine values, two immutable (F578); **contradicted between two articles**
for `C` and `0` (F579).

**Membership lifecycle** — sold → active → (auto-renew | lapse | manual cancel | returned) →
cancelled, benefits ending **immediately** (F575, F576).

**Protection plan benefit modes** — sold · **extended** · **enhanced** (F570).

**Reward value lifecycle** — points accrued (rate by payment class) → held (`Number of Days Before
Points Can Be Converted`) → certificate issued (manual or scheduled) → usable after a delay →
expires → purged (EOM or scheduled) (F569, F573, F574).

**Named scheduled processes, run 07 cumulative:** `Scheduled Settings Update` · `Purge Customer
Reward Points` · `Reward Gift Certificate Generation` · `Customer Membership Renewals`. Plus EOD, EOM
and `Generate Monthly Reports`. **No consolidated list exists in the docs** (§I).

---

## G. Sequencing rules (additions)

**Ordered lists where sequence *is* the logic** — second instance: delivery charge tables, first match
wins, free tables must be sequenced first (F572); cf. Stock Location Schema (batch 15 F518).

**Deletion policies: seven** (F577).

**Presence-of-a-value as a mode switch** — Podium's dual URI selects the authentication protocol
(F564).

**Five-way AND for rewards accrual** (F568) — system, system, customer, product, membership status.

---

## H. Open questions and gaps

**Material gaps**

1. **Which payment gateway is LA Mattress on?** (F575). *"Shift4 or the new gateway"*, plus a
   Shift-4 tab marked *legacy*. Stored payment tokens are generally not portable between processors,
   and membership auto-renewal depends on them. **Resolve early — it affects every recurring charge.**
2. **Which UniData version?** (F567). Bounds which STORIS features are reachable, independently of the
   Cloud-tenancy restriction (batch 16 F559).
3. **Are payment-gateway credentials encrypted at rest?** (F565). Stated for flexEngage only. Unstated
   for Shift-4 and Tender Retail. Matters for the extract.
4. **`Accumulated Points are Valid for __ Days` exists on two records with no stated precedence**
   (F573).
5. **`0` in payment history has two incompatible documented meanings** (F579). **Parity test** —
   the live distribution will settle it.
6. **What happens to an already-granted enhanced protection plan when membership lapses?** (F576).
   Benefits end *"immediately"*; a plan already attached to delivered goods is not addressed.
7. **The reward percentage arithmetic** (F569). Both rate fields carry unread `Use Case` links.
   Percentage of what — order total, eligible lines, net of discount — is not on the page.

**Documented but ambiguous**

8. **"three following settings" followed by four** (F580) — same defect shape as batch 15 F528.
9. **`History Retention Days`** (F581) is named by the purge article but absent from the control
   settings field list, which shows three differently-named retention fields.
10. **Five tabs of `External Communications Settings` have no descriptive text** (F562) — Circle
    Graphics, Server Login, Signifyd, Montage, and an unlabelled block. Purpose **inferred from
    vendor name only**; explicitly not treated as fact.
11. **Licensing is two levels deep** (F564) — module + submodule. Batch 4 enumerated one level.

**Queue corrections**

12. **`Switch User` does not exist as an article** (§A). Referenced three times by `Switch User
    Location`, never documented. Struck from the queue as unreachable-by-search rather than unread.
13. **`Process List Settings` does not exist as an article** (§A), though `Create a User` references
    it by name for `List Type` = *'Accessible Location List'*.

**Corrections to earlier runs**

14. **Run 03 F158 retired** (F568). Membership rewards are fully reconstructable.
15. **"Messenger retention unreconstructable" retired** (F581).
16. **Run 04's `Delivery Company Settings` reading is incomplete** (F572) — the grid's **order is
    semantically significant** and run 04 did not record it.
17. **Batch 13's protection plan model is one dimension short** (F570) — plans may be sold, extended
    or enhanced.
18. **Batch 13's `Pricing Method` gains a known value** (F571): `Fixed Amount`.

**Inferences (recorded as inference, not finding)**

- **I-95** — Guardsman, GBS, Phoenix and Extend are protection-plan/service-contract providers, from
  vendor names and the `Retail Number`/`Dealer Number`/`Retailer Number` field shapes. **The docs do
  not say.** Not adopted.
- **I-96** — Signifyd and Kount are fraud-screening services. Kount's `RIS Connection URI` supports
  this. **Not stated in the article.**
- **I-97** — `Server Login` (bare `User ID`/`Password`) may be the credentials STORIS uses for the
  customer web site download referenced by `Maintain Report Dictionaries` (batch 16). **Purely
  speculative; not adopted.**

---

## I. Unknown unknowns

- **A legal/collections subsystem exists** (F575): *"the account has legal settings assigned that do
  not allow payments to be added."* Accounts under legal action carry payment-blocking flags. **The
  audit has never read this area** — it is in Accounting/Receivables, which run 01 covered, but this
  specific mechanism does not appear in any batch.
- **No consolidated list of scheduled processes exists.** Run 07 has now named four (`Scheduled
  Settings Update`, `Purge Customer Reward Points`, `Reward Gift Certificate Generation`, `Customer
  Membership Renewals`) by encountering them one at a time. `Schedule a Process` presumably
  enumerates them and has not been read. **This is a small, high-value target.**
- **Two Shift-4 integrations coexist** (F562, F575), one marked legacy. A platform migration is in
  progress at STORIS itself, which means **the parity target is moving**.
- **Five external integrations are undocumented even as to purpose** (F562). If STORIS ships tabs it
  does not describe, the integration surface may be larger than 23.
- **`Reward Gift Certificates Can Be Used To Pay For` is a field with an unpublished value list**
  (F574), immediately followed by `Protection Plans` — suggesting an enumeration of payable
  categories the audit cannot see.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| **Enhanced protection plan** | A free plan for members who bought none — built as a $0 fixed-price plan over an inventory formation |
| **Extended protection plan** | Added time on a plan the member did buy; does not apply to manufacturer warranties |
| **Revolving sale** | An order paid on in-house finance; earns different reward and benefit rates |
| **Reward gift certificate** | Redeemed reward points; can never be refunded as cash |
| **Membership product** | The saleable product whose purchase confers membership; also a discriminator in delivery pricing |
| **`Mail Administrator`** | User-file flag permitting manual messenger purges |
| **Payment history code** | Per-cycle delinquency character, `0`/`C`/`1`–`6`/`B` |
| **UTG** | Shift-4 Universal Transaction Gateway |
| **MCM** | Tender Retail's server component |
| **Shared token** | Stored gateway payment credential enabling membership auto-renewal |

---

## Contract adjudication — batch 17

| Contract | Verdict | Basis |
|---|---|---|
| **W-058** *(external interfaces)* | **CONFIRMED — and far larger than the contract assumed** | 23 integrations in one record (F562) |
| **W-051** *(licensing)* | **CONFIRMED — two levels deep** | Module + submodule (F564); config permitted pre-licence (F565) |
| **W-063** *(loyalty / rewards)* | **CONFIRMED — model fully reconstructed** | F568–F576; **run 03 F158 retired** |
| **W-028** *(protection plans)* | **CONFIRMED — one dimension added** | Sold vs extended vs enhanced (F570, F571) |
| **W-041** *(batch calendar)* | **CONFIRMED — fifth EOM job, four named scheduled processes** | F573, F581 |
| **W-034** *(deletion)* | **CONFIRMED — seventh policy** | History-based blocking (F577) |
| **W-035** *(receivables)* | **CONFIRMED** | Payment history enumeration (F578); renewal blocked by six account conditions (F575) |
| **W-046** *(commission / incentive)* | **CONFIRMED** | Accrual varies by payment class (F569) |
| **W-059** *(delivery charges)* | **CONFIRMED — with a correction to run 04** | Charge tables are order-dependent, first match wins (F572) |
| **W-064** *(auditability)* | **CONFIRMED** | Automatic emails stamp the order document (F580) |
| **Credential validation** | **CONTRADICTED** | The record claims to validate connections; two NOTEs say it does not (F563) |
| **Configuration-as-implementation** | **NEW — no contract covers it** | The enhanced plan is three records and a checkbox (F571) |
| **Value that cannot become cash** | **NEW** | F574 |

---

## Next — batch 18

`Schedule a Process` — to enumerate the scheduled processes run 07 has been meeting one at a time
(§I) · `Customer Rewards Control Settings` · `Customer Membership Settings` ·
`Advanced Customer Settings` · `Delivery Charge Table Settings` — then the rest of
**Customer Settings** (137, ~133 unread), the run's largest remaining subsection.
