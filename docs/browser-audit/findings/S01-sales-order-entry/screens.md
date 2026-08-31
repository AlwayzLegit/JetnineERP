# S01 — Screen Inventory

| #   | Screen name                | URL                                  | Type   | Reached from                     | Notes                                                                                          |
| --- | -------------------------- | ------------------------------------ | ------ | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | New Sale (order entry)     | `/pos`                               | form   | Left nav → New Sale              | Three numbered cards + right rail (Totals, Payments, Complete / Save as Draft)                 |
| 2   | New customer (inline)      | `/pos`                               | form   | New Sale → "+ New customer"      | Expands in place inside the Customer card; 11 fields, placeholder-only labels                  |
| 3   | Customer search results    | `/pos`                               | modal  | New Sale → customer search field | Suggestion list overlays the Items card                                                        |
| 4   | Add Product                | `/pos`                               | modal  | New Sale → "Add Product"         | Search + vendor/stock/source filters; 100-row cap                                              |
| 5   | Sale complete confirmation | `/pos`                               | form   | New Sale → Complete              | Single card: "Order … complete", Open order / New Sale                                         |
| 6   | Orders list                | `/orders`                            | list   | Left nav → Orders                | 50 rows + "Load more"; search, status select, Past due, My orders                              |
| 7   | Order detail               | `/orders/<id>`                       | detail | Orders list row click            | Lines, Payments, Payment plan, Deliveries & fulfillment; right rail Customer / Money / actions |
| 8   | Order not found            | `/orders/<bad-id>`                   | detail | Direct URL                       | Single red line + link, no page chrome                                                         |
| 9   | Print — Invoice            | `/print/orders/<id>/invoice`         | print  | Order detail → Invoice           | Opens in a new tab                                                                             |
| 10  | Print — Delivery ticket    | `/print/orders/<id>/delivery-ticket` | print  | Order detail → Delivery ticket   | Warns that printing locks the order                                                            |
| 11  | Print — Pick list          | `/print/orders/<id>/pick-list`       | print  | Order detail → Pick list         |                                                                                                |
| 12  | Sales (invoice register)   | `/sales`                             | list   | Left nav → Sales                 | Separate table convention from Orders                                                          |

**Skipped, with reason**

| Screen                                         | Reason                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Open register / shift session                  | Opening a register creates a cash-drawer shift record — outside the S01 naming convention and belongs to S12 |
| Exchanges (`/exchanges/new?originalOrderId=…`) | Belongs to S04                                                                                               |
| Deliveries scheduling                          | Belongs to S05; the order detail states scheduling is not built yet                                          |
| Layaway plan ("Start layaway plan")            | Creates a recurring payment schedule; deferred to S03 to avoid a second money-bearing artifact               |
