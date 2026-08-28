# Run 03 — Sales Processing — Batch 6: Special Orders, COM, Configurators and Warranties

**Status: complete.** 8 articles. Findings 55–63.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 1 | **Special Order Entry** | /articles/15201405979796 | EXTRACTED |
| 2 | **Special Order Configurator** | /articles/15201408170772 | EXTRACTED |
| 3 | Enter Special Order Options | /articles/15201389428628 | EXTRACTED |
| 4 | **COM Order Entry/Maintenance** | /articles/15201408472596 | EXTRACTED — four tabs |
| 5 | **Deleting COM Purchase Orders** | /articles/15201404902420 | EXTRACTED — **worked use cases** |
| 6 | Extended Warranty Data Entry | /articles/15201407328916 | EXTRACTED |
| 7 | Warranty Linkage Selection | /articles/15201408655124 | EXTRACTED — thin |
| 8 | Select a Warranty Screen | /articles/15201408967828 | EXTRACTED |

Discovered and queued: `Special Order Control Settings` · `Special Order Template Settings` ·
**`Predefined Configured Item`** · `Warranty Category Settings` · `Product Configurator Scratch Pad` ·
`PO Header Comments` · `Group Settings` · `Original Document Select Screen`.

---

## B. Wiring findings

### FINDING 55 — A special order line carries its own cost build-up, separate from the product master
Fields (verbatim): Product · **`Vendor Ship From`** · `Purchase Order` · `Purchase Order Number` ·
            **`Cost` · `Freight` · `Duty` · `Total Cost`** · Additional Details · **`Vendor Model`** ·
            **`PO Shipping Instructions`** · **`Associated Inventory Formations`**
Creation gate: creating on the fly "is available **only if you have access via the `Create special order
            products within POS entry`** field in Sales Security."
Invariant:  "Depending on the settings in the `Special Order Control Settings`, you may be able to
            **create purchase orders for the products directly and/or add the items to the current sales
            order**."
Evidence:   Special Order Entry, /articles/15201405979796
Maps to:    **W-061 — and it closes a run-2 costing thread**

> **The sales order line carries `Cost`, `Freight`, `Duty` and `Total Cost` typed at point of sale.**
> Run 2 established that special-order products have **no average cost** (run 2 F32) and are **always
> valued at exact cost, outside the thirteen-level landed hierarchy** (run 2 F119). This is where that
> exact cost comes from: **a salesperson types it, including freight and duty, at the moment of sale.**
>
> That closes the loop and it is not a small finding. For special orders — a large share of upholstery
> business — **landed cost is a manual entry on a sales screen**, not a computed value, and every margin
> figure downstream rests on it. `Associated Inventory Formations` appears again, now as a fifth role
> for a classification the audit still cannot define.

### FINDING 56 — The configurator resolves a grade override from a three-part key, and matches predefined items on save
Grade override (verbatim): "Once you indicate the **`Primary Option`**, the system checks for a **grade
            override using the vendor, frame suite, and fabric/option suite.** If a grade override is
            found for the **vendor, frame suite, and fabric/option suite combination**, the override
            grade becomes the base grade for the primary option entered… **If no vendor, frame suite,
            and fabric/option suite combination is found, the current base grade and grade price is
            used.**"
Predefined match (verbatim): "**Important! If the configured item is an exact match to a `Predefined
            Configured Item`, the special price established for the predefined item is displayed when
            you save out of this screen and return to the order.**"
Model number: "**The `Vendor Model` number displayed on the Special Order Entry screen includes the
            option codes selected.**"
Structure: `Option Type` · `Option` · **`Sub-Option Type`** · **`Sub-Option`** · `Price` — "Option 1,
            Option 2, Option 3, **etc.**"
Scratch pad: accessed via `Product Configurator Scratch Pad`, "**the `Save` button is inactive.
            Configured products can neither be saved nor printed.**"
Evidence:   Special Order Configurator, /articles/15201408170772
Maps to:    **NEW**

> Three findings in one screen. **Grade — which drives price — is overridden by a three-part key of
> vendor × frame suite × fabric suite**, an all-or-nothing match with no partial fall-through. **A
> configured item that exactly matches a predefined configuration is silently repriced** to that
> configuration's special price on save, so the same options can produce two different prices depending
> on whether someone set up the combination in advance. And **the vendor model number is generated from
> the option codes**, which is how run 2's EDI model-number pattern validation (run 2 F79) can apply to
> configured products at all.
>
> Note "Option 1, Option 2, Option 3, **etc.**" — the configurator is **not limited to three options**,
> unlike the three-option displays seen in batch 2's clone grid and run 2's PO report. So three is a
> display limit, not a model limit. That answers a question open since batch 2.

### FINDING 57 — Special orders have two entry paths — template-driven and configurator-driven — with different price models
**Template path** (`Enter Special Order Options`): "based on the **special-order template** built for
            it… accessed from many places throughout STORIS, **as well as a dynamic escape**." Fields:
            **`Base Price` · `Base Cost` · `Option Price` · `Total Price` · `Total Cost`**; grid of
            `Option Type` · `Option` · **`Price`** · **`Cost`**. Read-only variant exists.
**Configurator path** (`Special Order Configurator`): primary option → grade override → sub-options →
            `Total` / `Price`; predefined-item repricing on save.
Shared:     both offer **`Clone From Existing Line`** *(batch 2 F22)*.
Evidence:   Enter Special Order Options, /articles/15201389428628;
            Special Order Configurator, /articles/15201408170772
Maps to:    **NEW**

> Two parallel mechanisms for the same commercial idea. **The template path exposes cost per option
> alongside price; the configurator path exposes only price** and derives cost elsewhere. Batch 1's
> price-variance rules (F13) describe "auto and user priced special order products" — that distinction
> maps onto these two paths.
>
> "**as well as a dynamic escape**" is the second appearance of `Escapes` (batch 5 H), and the first
> hint at what it means: **a mechanism for reaching a routine from an arbitrary point** — worth chasing.

### FINDING 58 — COM is a four-step wizard that creates a purchase order to the vendor
Tabs (verbatim): **`Summary` · `Step 1 COM Details` · `Step 2 PO Details` · `Step 3 Apply To`**
Invariant:  "the system **links the COM items you enter here to selected line items in the original
            sales order.**"
Step 3 fields: **`Applying Component` · `For Receiving Vendor` · `Line` · `COM Quantity` ·
            `Change In Total COM's Applied` · `Total COM's Applied`**
Invariant:  "When you click on `Save`, the **`PO Header Comments`** screen appears. When you exit from
            that screen, **the program displays the number of the purchase order created for your COM
            component.**"
Step 2 fields: `Unit Sell Price` · `Unit Cost` · **`Receiving Vendor`** · Name · Address ·
            **`COM Vendor P/O Information`** · **`P/O Line Information`**
Evidence:   COM Order Entry/Maintenance, /articles/15201408472596
Maps to:    **W-005 / W-006 — and it completes the COM loop across three runs**

> The COM mechanism is now fully assembled. Run 2 found: a COM tab existing only on POs created from
> sales entry (run 2 F1), COM as a first-class layer cost component (F36), **COM purchase orders shipped
> *to* the vendor with no receiving location** (F98), and `Linked COM Purchase Orders` on a PO line
> (F136). **This is the origin**: entering a customer's own material on a sales order **creates a
> purchase order to the receiving vendor**, carrying the customer's fabric to the factory, linked to
> specific sales order lines and quantities.
>
> `Total COM's Applied` and `Change In Total COM's Applied` mean **one COM component can be spread
> across several sales order lines** — one bolt of fabric covering a sofa and two chairs — with the
> allocation tracked. That is the real workflow for an upholstery retailer, and nothing simpler would
> represent it.

### FINDING 59 — Deleting a COM or special order line applies "all-or-nothing" logic across the whole PO family
Two permissions (verbatim): **`Delete special order line from a sales order`** and **`Delete special
            order line item linked to a purchase order not on hold`**
Hold rule (verbatim): "**The process checks the component purchase orders, as well as the main frame
            purchase order**, before allowing special order lines to be deleted. **If any of the
            purchase orders (main frame and components) are not on hold, all are considered to be not on
            hold.** In that situation, users need to have [both permissions] or obtain an override…
            **If all of the purchase orders are on hold, users with only the `Delete special order line
            from a sales order` setting enabled can delete the special order line.**"
Print rule (verbatim): "**If even one of the COM purchase orders (Main frame and components) has been
            printed, they are all considered 'printed'. They are not deleted when the line on the order
            is deleted.** If none… have been printed, they are deleted when the line on the order is
            deleted, after passing the security validation."
Orphaning:  "**When a special order purchase order has been printed, it is not deleted when the linked
            sales order line is deleted. The link to the sales order line is removed from the purchase
            order.**"
Worked cases (verbatim, three): main frame unprinted + one component printed ⇒ "**the Main Frame
            purchase order 9876 is considered to have been printed**"; main frame printed + components
            unprinted ⇒ "**the component purchase orders are considered as having been printed**";
            none printed ⇒ none considered printed.
Evidence:   Deleting COM Purchase Orders, /articles/15201404902420
Maps to:    **W-042 — a genuine cross-document propagation rule**

> **The strictest state in the family governs all of it, in both directions.** One printed component
> makes the main frame "printed"; a printed main frame makes the components "printed". One PO off hold
> makes them all off hold. That is a deliberate, symmetric, worked-through design — and the docs give
> three numbered examples precisely because it is not obvious.
>
> The consequence that matters: **deleting a sales order line can orphan a live purchase order.** The
> PO survives, the link is severed, and the vendor still owes us goods for a sale that no longer exists.
> Run 2 found the reverse orphan — an EDI invoice arriving for a purged PO (run 2 F59). **Both directions
> of that failure are now documented**, and neither has a queue or report to catch it.

### FINDING 60 — Warranty linkage is chosen explicitly, and third-party warranties block save without data
Linkage:    "This screen appears when you **add a warranty product** to the current order. Use this
            window to specify **the order (if any)** to which you want to link the warranty." Fields:
            **`Type of Linkage`** · **`Link to Document`**.
Third-party data (verbatim): "If you **exit out of this window without entering the required
            information**, a message appears stating '**Unlinked third party warranties require warranty
            data.**'" Fields: Product · Description · Brand · **`Purchase Date`** · **`Purchase Price`** ·
            **`Serial Number`**.
Return path: "This screen appears via the `Original Document Select Screen` when you select an external
            warranty for which the **`Third-Party Flag`** is set in **`Warranty Category Settings`**…
            Check the box next to the products **whose warranties the customer wants to return. For
            products (if any) you do not select on this screen, warranties remain in effect.**"
Evidence:   Warranty Linkage Selection, /articles/15201408655124;
            Extended Warranty Data Entry, /articles/15201407328916;
            Select a Warranty Screen, /articles/15201408967828
Maps to:    **NEW**

> Warranties can be **linked to another order or to nothing** — the `W` line status code from batch 1 is
> optional. **An unlinked third-party warranty demands its own product, brand, purchase date, price and
> serial number**, because there is no order to inherit them from. So the business can sell a warranty
> on goods bought elsewhere, and STORIS captures the underlying purchase as free-standing data.
>
> Returning warranties is **per covered product**, and unselected products keep cover — so a partial
> return leaves a partially-covering warranty. Nothing states whether the warranty price is prorated.

### FINDING 61 — COM components can be created on the fly and carry a unit conversion
Invariant:  "**If entering an existing component, Product File information displays… All fields are
            display-only except the `Vendor Product` field. If creating a new component, you must
            provide the information.**"
Fields:     Component · Vendor · Product · Brand · Product Group · **`Selling Unit Details`** ·
            **`Unit Conversion`** · **`Unit of Measure`**
Evidence:   COM Order Entry/Maintenance, /articles/15201408472596
Maps to:    **NEW — and it explains batch 2's `Unit Conversion`**

> Batch 2 flagged `Unit Conversion` on the line detail as undescribed. **Here is its natural home:
> customer's own material is bought in one unit and applied in another** — yards of fabric against
> pieces of furniture. `Selling Unit Details` and `Unit Conversion` together let a COM component's
> quantity mean different things on the purchase order and the sales order.
>
> On-the-fly component creation is the third "create a product mid-transaction" path in this run, after
> special-order products (F55) and `Create a RetailDeck Product`. **Point of sale can write to the
> product master three ways**, each with its own permission.

### FINDING 62 — Special-order purchase orders and sales order lines are coupled at four points
Consolidated across this batch, batch 1 and run 2:

| Coupling | Direction | Evidence |
|---|---|---|
| Selling a special order creates the PO | sale → PO | b1 F1/F51 *(run 2)*, F55 |
| Special order details typed on the PO appear on the sales order | PO → sale | run 2 F23 |
| Linking a PO line to a mismatched special order copies details onto the PO | sale → PO | run 2 F57 |
| Deleting a sale line deletes unprinted POs, orphans printed ones | sale → PO | **F59** |
| PO line changes do **not** propagate to stock sales lines | *(no propagation)* | run 2 F50 |
Maps to:    **W-042 — final shape for special orders**

> `W-042` has been through three verdicts. Run 2 batch 1 read it as confirmed; run 2 batch 3 contradicted
> it for stock products; **this settles the special-order case**: the coupling is real, bidirectional and
> quite tight — but it is **event-driven, not synchronised**, and printing severs it. Anything we build
> should model these as **four named events**, not as a maintained relationship.

### FINDING 63 — Configured products cannot be saved or printed from the scratch pad
Invariant:  "If this screen is accessed via **`Product Configurator Scratch Pad`**, the `Save` button is
            inactive. **Configured products can neither be saved nor printed.** When exiting the screen,
            you are returned to the `Product Configurator Scratch Pad`."
Evidence:   Special Order Configurator, /articles/15201408170772
Maps to:    **NEW — minor, but it names a real workflow**

> A **quoting sandbox**: a salesperson can configure and price a product for a customer without creating
> anything. Given batch 1 established that quotes are a real order type with reservation consequences,
> the scratch pad is the step before even that — and its output is **deliberately unpersistable**, so
> nothing configured there can be recovered. For a rebuild, worth knowing that "let me price this up for
> you" is a distinct mode the business already has.

---

## C. Screen and field inventory

**Special Order Entry** — Product · Vendor Ship From · Purchase Order · Purchase Order Number ·
**Cost · Freight · Duty · Total Cost** · Additional Details · Vendor Model · PO Shipping Instructions ·
**Associated Inventory Formations** · Actions.

**Special Order Configurator** — Product · **Primary Option** · Additional Information ·
Configurator Additional Information · **Base Grade** · Total · Price · **Clone From Existing Line** ·
Confirm · list view: Option 1..n · Option Type · Option · **Sub-Option Type · Sub-Option** · Price.

**Enter Special Order Options** — Product · **Special Order Detail Information** · **Base Price ·
Base Cost · Option Price · Total Price · Total Cost** · Clone From Existing Line · grid:
Option Type · Option · **Price · Cost**. Read-only variant: `Enter Special-Order Options - Read-Only`.

**COM Order Entry/Maintenance** — tabs Summary · Step 1 COM Details · Step 2 PO Details ·
Step 3 Apply To.
*Step 1*: Component · Vendor · Product · Brand · Product Group · **Selling Unit Details ·
Unit Conversion · Unit of Measure** *(display-only except `Vendor Product` for existing components)*.
*Step 2*: Component · **Unit Sell Price · Unit Cost** · Receiving Vendor · Name · Address ·
COM Vendor P/O Information · P/O Line Information.
*Step 3*: **Applying Component · For Receiving Vendor · Line · COM Quantity · Change In Total COM's
Applied · Total COM's Applied** · delete-all · remove-individual.

**Extended Warranty Data Entry** — Product · Description · Brand · **Purchase Date · Purchase Price ·
Serial Number**.

**Warranty Linkage Selection** — **Type of Linkage** · **Link to Document**.

**Select a Warranty Screen** — grid of products linked to the selected warranty, with checkboxes.

---

## D. Control settings catalog

| Setting | Lives in | What it changes |
|---|---|---|
| PO creation / add-to-order behaviour | **Special Order Control Settings** | Whether special order entry can create POs and/or add to the order |
| special-order templates | **Special Order Template Settings** | The option/price/cost structure of the template path |
| **grade override** by vendor × frame suite × fabric/option suite | (configurator settings) | Replaces the base grade, and therefore the price |
| **`Predefined Configured Item`** | (configurator settings) | Silently reprices an exactly-matching configuration on save |
| **`Third-Party Flag`** | **Warranty Category Settings** | Routes external warranties through the return-selection screen |

---

## E. Security permissions catalog

| Permission | System | Gates |
|---|---|---|
| `Create special order products within POS entry` | Sales Security | Creating special-order products on the fly |
| **`Delete special order line from a sales order`** | Sales Security | Deleting a special-order line at all |
| **`Delete special order line item linked to a purchase order not on hold`** | Sales Security | The same, when any PO in the family is off hold |

---

## F. State machines and enumerations

**Special order entry paths (2)** — template-driven (`Enter Special Order Options`, cost per option
visible) · configurator-driven (`Special Order Configurator`, grade override and predefined matching).
**Configurator structure** — Primary Option → Base Grade *(overridable)* → Option Type / Option →
Sub-Option Type / Sub-Option; **unbounded option count**.
**Special order cost build-up** — `Cost` + `Freight` + `Duty` = `Total Cost`, **hand-entered**.
**COM allocation** — one component spread across multiple sales order lines, tracked by
`Total COM's Applied`.
**PO family state rules** — **strictest wins**: any PO off hold ⇒ all off hold; any PO printed ⇒ all
printed.
**Warranty linkage** — linked to a document · unlinked *(requires full warranty data)*.
**Warranty return** — per covered product; unselected products retain cover.

---

## G. Sequencing rules

1. Creating a special-order product on the fly requires `Create special order products within POS entry`.
2. The configurator resolves the grade override before pricing options.
3. An exact match to a predefined configured item reprices the line on save.
4. Saving the configurator returns to Special Order Entry with the option-coded vendor model.
5. Saving COM entry opens `PO Header Comments`, then reports the created purchase order number.
6. Deleting a special-order line evaluates hold and print state **across the whole PO family**.
7. A printed special-order PO survives deletion of its sales order line; only the link is removed.
8. Unlinked third-party warranties cannot be saved without product, date, price and serial.
9. Warranty returns are selected per product; unselected products keep cover.

---

## H. Open questions and gaps

**Gated or unreachable**
- **`Special Order Control Settings`** — governs auto-creation, assignment and PO behaviour; referenced
  from run 2 and three batches of this run. Still unread.
- `Special Order Template Settings` · **`Predefined Configured Item`** setup · `Warranty Category
  Settings` · `Product Configurator Scratch Pad`.
- **`frame suite` and `fabric/option suite`** — two classification objects used in the grade override
  key, defined nowhere.

**Documented but ambiguous**
- **`Base Grade`** and grade pricing — central to configured pricing, never explained.
- **Whether the hand-entered special order `Freight` and `Duty` ever reconcile** to the landed-cost
  machinery run 2 mapped. Nothing connects them, and run 2 F119 says special orders are excluded from
  landed distribution entirely.
- **`Type of Linkage`** on warranty linkage — the enumeration is not given.
- **Whether a partially returned warranty is prorated** — unselected products keep cover, but the price
  treatment is unstated.
- **`Associated Inventory Formations`** on the special order — a fifth role for a term still undefined.
- **`Selling Unit Details`** — named beside Unit Conversion and Unit of Measure, undescribed.
- **What happens to an orphaned special-order PO** — no queue, report or alert is named.
- Whether the "dynamic escape" access to `Enter Special Order Options` is the same `Escapes` element
  seen on three entry screens.

**Inferences (not in section B)**
- `frame suite` / `fabric/option suite` are presumably vendor-defined product families used to price
  fabric grades; the articles use them only as key components.
- An orphaned special-order PO presumably surfaces on the open-PO reports run 2 catalogued; nothing says
  it is flagged as orphaned.
- The scratch pad is presumably intended for quoting; the article says only that saving is disabled.

---

## I. Unknown unknowns

- **Special order cost, freight and duty typed at point of sale** — the origin of run 2's "exact cost".
- **A grade override keyed on vendor × frame suite × fabric suite**, all-or-nothing.
- **Predefined configured items silently repricing an exact match on save.**
- **Vendor model numbers generated from option codes** — feeding EDI pattern validation.
- **Unbounded configurator options**, against three-option displays elsewhere.
- **COM entry creating a purchase order to the vendor**, with one component spread across lines.
- **Strictest-state-wins across a PO family**, in both directions, with three worked examples.
- **Deleting a sales order line orphaning a printed purchase order.**
- **Unlinked third-party warranties** on goods bought elsewhere, with their own captured purchase data.
- **Per-product warranty returns** leaving partial cover in force.
- **Unit conversion on COM components** — bought in yards, applied to pieces.
- **A configurator scratch pad whose output cannot be saved or printed.**

---

## J. Glossary

| STORIS term | Plain description |
|---|---|
| COM | Customer's own material; entry creates a PO to the vendor, linked to sales lines |
| Total COM's Applied | Allocation of one COM component across several sales order lines |
| Primary Option / Base Grade | Configurator inputs; grade drives price and can be overridden |
| Frame suite / fabric-option suite | Undefined classifications forming the grade-override key |
| Predefined Configured Item | A saved configuration with a special price, matched exactly on save |
| Special order template | The option/price/cost structure behind the non-configurator path |
| Strictest-state-wins | Any PO in a special-order family off hold or printed makes all of them so |
| Type of Linkage | Undocumented enumeration for attaching a warranty to a document |
| Unit Conversion | Relates a COM component's purchase unit to its application unit |
| Product Configurator Scratch Pad | Quoting sandbox; configured products cannot be saved or printed |

---

## Contract adjudication — batch 6

| Contract | Verdict | Basis |
|---|---|---|
| **W-042** | **final shape for special orders — four named events, not synchronisation** | F59, F62 |
| **W-005 / W-006** | **CONFIRMED** | COM entry and special order entry both create purchase orders from the sale (F55, F58) |
| **W-061** | **CONFIRMED, with a material finding** | Special order cost, freight and duty are hand-entered at point of sale (F55) |
| **W-050** | **CONFIRMED, extended** | Two new Sales Security permissions with a strictest-state-wins evaluation (F59) |
| **W-052 / W-053** | **not documented in this batch** | — |

---

## Next — batch 7: returns, exchanges, quick sale, shopping cart and pickups
