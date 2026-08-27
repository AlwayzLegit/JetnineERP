# 04 — Protection Plan Selection

**Source:** https://storis.zendesk.com/hc/en-us/articles/15294525107092-Protection-Plan-Selection
**STORIS area:** STORIS ERP > Sales Processing (POS)
**Depends on:** Point of Sale Control Settings, Protection Plan Settings, Inventory Formations, Protection Plan Product Selection — **none of which are dissected here.**

> This is the largest and most behaviorally complex screen in this handoff, and it is also the one with the most missing dependencies. Build it last. Do not start until the settings screens above are dissected.

---

## Access paths (verbatim, five of them)

> - Enter a Sales Order > Merchandise Page > Actions Button
> - Enter a Sales Order > Payment Page > Protection Plans > Actions Button
> - Enter an Exchange > Step 3 - Sales Merchandise > Actions Button
> - Enter a Return > Payment Page > Protection Plans > Actions Button
> - Adjust Dollars on a Completed Order > Payment Page > Protection Plans > Actions Button

Five entry points across sales orders, exchanges, returns, and post-completion dollar adjustments. The screen is a shared control, not a step in one flow. Whatever you build must be callable from all five contexts with the same behavior.

## Purpose

Advise the user of all qualified protection plans that may be added to a sales order, and let them:

- link plans to merchandise on an order
- view selected plans and information about plan limitations
- view plan pricing and completion status
- see which plans still have eligible merchandise that can be linked

The qualified plans displayed are based on the merchandise sold, and provide a **potential selling price** of the plans to offer to customers. The screen may also simply display plans already selected for the order.

## The three-step model

The source names three steps explicitly. This is the core of the spec.

### Step 1 — Qualification

To determine if protection plans are qualified for the order, **Protection Plan Settings** and the **merchandise on the order** are reviewed.

> This initial step **only** qualifies protection plans based on **Inventory Formations**; quantity and subtotal limitations are reviewed when linking products and protection plans (step 3).

That split matters and is easy to get wrong: **qualification is formation-based only.** A plan whose Minimum Subtotal is not met still qualifies and still appears in the grid — the subtotal check happens later, at linking time.

### Step 2 — Selection

All qualified protection plans are presented to the user for selection.

- **Multiple plans may be selected.** Explicitly stated.
- This step also provides the ability to **maintain or remove** plans already present on the order.

### Step 3 — Protection Plan Product Selection

With individual plans presented, users select individual products **from the order** and link them to the selected plan(s).

- Also allows **maintaining** products already linked to a plan.
- Also allows **removing products from one associated protection plan and moving them to another.**

This step is a separate screen — `Protection Plan Product Selection` — reached from the Select action (below). Not dissected here.

## Automatic vs. prompted vs. manual addition

Driven by two settings in **Point of Sale Control Settings**. Transcribed closely:

**`Automatically Add to Order` enabled:**

> qualified protection plans are automatically added to a sales order. Note that this only for new sales orders and the user will be informed of the addition.

So: automatic addition applies to **new sales orders only**, and the user is notified.

**`Prompt to Add to Order` enabled:**

> you are prompted to select from a list of qualified protection plans to add to a **new or existing order that has not been partially completed**.

So: prompting has a wider scope than auto-add (new _and_ existing), but is blocked once the order is **partially completed**.

**Always true regardless of settings:**

> While the Point of Sale Control Settings listed above work with the addition of protection plans, note that qualified protection plans may be **manually added at any time**.

The source also points to a `Protection Plans Overview` article for more information — worth pulling in when this screen is built.

## Grid Information

Both existing and new protection plans that qualify for the order are displayed in the grid.

> The same protection plan may be listed **more than once** in the grid if the plan is preexisting or covers different items within the order.

Non-obvious and important: the grid row is not keyed on plan. It is keyed on plan-instance. Do not de-duplicate by plan id.

### Columns

| Column                  | Definition (from source)                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Plan**                | The protection plan.                                                                               |
| **Description**         | The plan description.                                                                              |
| **Selected**            | Checked if the protection plan is already part of the sales order.                                 |
| **Current Price**       | If the plan has already been selected to use, its current selling price.                           |
| **Overridden**          | If checked, the plan's calculated selling price has been overridden.                               |
| **Suggested Price**     | The selling price of the plan, based on potentially linkable merchandise within the sales order.   |
| **Partially Completed** | If selected, this protection plan has been partially completed.                                    |
| **Minimum Subtotal**    | The minimum merchandise subtotal to which this plan can be applied.                                |
| **Maximum Subtotal**    | The maximum merchandise subtotal to which this plan can be applied.                                |
| **Maximum Quantity**    | The maximum amount of merchandise that this plan can be applied to.                                |
| **Eligible Items**      | If checked, there are unlinked products on this order that could be applied to the specified plan. |

Note the price pair: **Current Price** is what the plan is actually selling for once selected; **Suggested Price** is a computed figure from linkable merchandise. **Overridden** marks divergence from the calculated value.

## Actions

| Action           | Behavior (from source)                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Select**       | Calls **Protection Plan Product Selection**, where individual products may be added to or removed from the specified protection plan.             |
| **Select All**   | All qualified products are automatically selected for the chosen plan. A message notifies you that the protection plan was automatically created. |
| **Deselect All** | _The source article ends at this label with no description._ See open questions.                                                                  |

## Behavior rules

1. Reachable from all five access paths listed above.
2. Qualification evaluates Protection Plan Settings against order merchandise, using **Inventory Formations only**.
3. Quantity and subtotal limits are **not** applied at qualification; they are applied when linking products to plans.
4. Multiple plans may be selected for one order.
5. Plans already on the order can be maintained or removed from this screen.
6. Products can be moved from one plan to another.
7. A single plan may appear on multiple grid rows.
8. With `Automatically Add to Order` on, qualified plans are auto-added to **new sales orders**, and the user is informed.
9. With `Prompt to Add to Order` on, the user is prompted for **new or existing orders that are not partially completed**.
10. Manual addition of a qualified plan is available at any time regardless of those settings.
11. `Select All` auto-selects all qualified products for the plan and shows a confirmation message stating the plan was automatically created.
12. `Eligible Items` reflects the presence of unlinked-but-linkable products at the time the grid is rendered.

## Data model `[INFERRED]`

- Protection plan master with: description, min subtotal, max subtotal, max quantity, qualification rules keyed to Inventory Formations, pricing rules.
- Order-level plan instance: plan ref, selected flag, current price, overridden flag, suggested price, partially-completed flag.
- Link table: plan instance ↔ order line/product, supporting move between plan instances.
- Point of Sale Control Settings: `automatically_add_to_order`, `prompt_to_add_to_order` booleans.

## Acceptance criteria

- The screen opens identically from all five access paths.
- A plan whose Minimum Subtotal exceeds the order subtotal still appears in the grid (qualification is formation-only).
- Attempting to link products that breach Maximum Quantity or the subtotal band is rejected at link time.
- A plan covering two distinct item groups on one order produces two grid rows.
- Selecting two different plans on one order is permitted.
- With `Automatically Add to Order` on, a new sales order with qualifying merchandise receives its plans automatically and the user sees a notification.
- With `Automatically Add to Order` on, an **existing** order does not receive plans automatically.
- With `Prompt to Add to Order` on, a partially completed order is not prompted.
- With both settings off, a user can still add a qualified plan manually.
- Removing a product from plan A and adding it to plan B updates both plans' prices and Eligible Items flags.
- Overriding a plan's selling price sets the Overridden flag.

## Open questions

- **`Deselect All` is undocumented.** The source article ends mid-list. The obvious reading is the inverse of Select All (unlink all products from the chosen plan), but confirm — in particular whether it also removes the plan from the order or merely unlinks products.
- **What is an Inventory Formation?** Qualification depends entirely on it and it is not defined here. Needs the Inventory Formations article. **Blocker.**
- **How is Suggested Price calculated** from "potentially linkable merchandise"? Not stated. **Blocker for pricing.**
- **What does "partially completed" mean for a protection plan** as distinct from a partially completed order? The grid has a per-plan Partially Completed flag and the settings text has an order-level "partially completed" concept. Confirm they are the same notion.
- **Where is price override performed?** The grid exposes an Overridden flag but no override action. Likely on Protection Plan Product Selection or a pricing screen.
- **Return / exchange semantics.** Two of the five access paths are Enter a Return and Adjust Dollars on a Completed Order. The article describes the screen entirely in sales-order terms. How plans are cancelled, prorated, or refunded on a return is **not covered anywhere in this source**.
- **Can a plan be applied across multiple orders,** or is it strictly order-scoped? Not stated.
- Pull the `Protection Plans Overview` article before implementing.
