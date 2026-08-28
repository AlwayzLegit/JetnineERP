# Acceptance Tests — Screen Layer

Extends `12-acceptance-tests.md`. Same contract: a rule implemented without its test is not done.
These cover the behaviours discovered at the screen level; the module-level tests in `12` still apply
unchanged.

Tests marked `[DECIDE]` assert our **intended** behaviour, not STORIS'. Do not implement one until its
decision is answered — a green test would lock in an unapproved choice. The decision lives either as a
numbered question in `31-som-open-questions.md` or as an entry in `29-som-cross-cutting.md` §4 (rules
that bite) or §5 (documented bypasses); several of the `[DECIDE]` tests below correspond to a `29` entry
rather than a numbered question, which is why `SOM-X-05` accepts either.

Where a `[DECIDE]` test asserts the **opposite** of a `12` test, both are listed and the `12` test
describes documented behaviour until the decision is made. `SOM-OE-11` and `12` `CHG-03` are the one
current instance: `CHG-03` asserts that charge overrides do not follow a moved line (documented);
`SOM-OE-11` asserts that they do (intended). Do not implement both.

## Order entry (file 21)

```
SOM-OE-01  order-number field honours Enter only while the auto-assign control is active
SOM-OE-02  a cart id typed into the order-number field converts the cart, one line per hard kit
SOM-OE-03  step 3 is unreachable until a customer exists on the order
SOM-OE-04  direct-ship fulfillments are editable on the merchandise step only
SOM-OE-05  builder's allowance <= (total invoice - payments and deposits applied)
SOM-OE-06  deposit hold-back withholds its percent on PARTIAL shipment only
SOM-OE-07  a second exception-comment override does NOT overwrite the first justification  [DECIDE]
SOM-OE-08  abandoning the exception window does NOT silently void the price override        [DECIDE]
SOM-OE-09  mandatory order comments block save on any change to a saved order
SOM-OE-10  mandatory order comments also fire on layaway and quote conversion               [DECIDE]
SOM-OE-11  a moved line carries its installation-charge override with it                    [DECIDE]
SOM-OE-12  new fulfillments append, then re-sort on save, and the operator is told
SOM-OE-13  a cart carries no order source; conversion assigns one
SOM-OE-14  disabling ATP hides the ATP fields without destroying stored ATP data            [DECIDE]
SOM-OE-15  the address-required control cannot be defeated by delete-and-re-key             [DECIDE]
SOM-OE-16  every comment stream records origin, actor and timestamp, and none is editable
           after save except where a permission explicitly allows it
```

## Line items (file 22)

```
SOM-LI-01  split is refused for all seven blocklisted conditions, each with a distinct message
SOM-LI-02  split quantity is validated to 1..qty-1 on add
SOM-LI-03  both post-split lines re-run reservation and recompute extended price
SOM-LI-04  every line-movement constraint in 22 §5.2 is enforced — the ten enumerated ones plus
           the de-association rule stated in the same section
SOM-LI-05  a non-inventory (warranty) line moves only with its host inventory line
SOM-LI-06  an as-is serial-tracked sale carries both serial numbers
SOM-LI-07  saving a manufacturer serial does NOT delete the internal piece reference       [DECIDE]
SOM-LI-08  granting a line tax exemption unchecks product-taxable and writes an order
           comment carrying product, authorization number and override actor
SOM-LI-09  setting a tax-exempt authorization number while taxable is checked is rejected
SOM-LI-10  room code is generated as order-counter, <=17 alphanumeric; description <=30,
           duplicates within an order rejected
SOM-LI-11  extended warranty purchase price accepts 8 digits + 2 decimals; serial <=26 chars
SOM-LI-12  zeroing a reservation-required product requires BOTH the manual-reserve and the
           override-reservation-required permissions
SOM-LI-13  a line-level group price override requires a permission and records provenance   [DECIDE]
SOM-LI-14  cost is never displayed on a surface the operator's role cannot see cost on
```

## Tender and deposits (file 23)

```
SOM-TD-01  the active card-processing module selects the correct card-entry surface
SOM-TD-02  under EMV, no card number is ever persisted by the application
SOM-TD-03  card-present defaults to UNCHECKED and must be set deliberately                  [DECIDE]
SOM-TD-04  the swipe control is available without first entering an authorization number    [DECIDE]
SOM-TD-05  a read-only card view re-applies masking on exit and never reveals a full number
SOM-TD-06  customer daily cash limit and payment-class access are checked before any
           tender sub-window opens
SOM-TD-07  debit accepts 19 characters, swipe only, and requires signature capture active
SOM-TD-08  terminal assignment is session state and does not survive logoff
SOM-TD-09  releasing a pre-auth for a higher amount produces the sale plus one delta sale
SOM-TD-10  a declined pre-auth is deleted; a communications error retains it for retry
SOM-TD-11  third-party financing with no authorization number sets credit hold F3 (not F5)
SOM-TD-12  a revolving plan's minimum-deposit percent overrides the order deposit hold-back
SOM-TD-13  auto-pay allocates due date, then transaction date, then lowest APR
SOM-TD-14  a typed electronic check is class EG; a scanned one is EG + EC
SOM-TD-15  a scanner cannot bypass the gift-card manual-entry permission                    [DECIDE]
SOM-TD-16  opening the cash drawer requires a permission and writes an audit record         [DECIDE]
SOM-TD-17  the revolving full-worksheet total includes pending amounts                      [DECIDE]
SOM-TD-18  required-deposits-by-line does not depend on unsaved worksheet state             [DECIDE]
SOM-TD-19  a pre-auth amount increase above the configured limit requires the override permission
```

## Pricing, discounts and tax (file 24)

```
SOM-PD-01  the ten-stage discount pipeline runs in the configured order-of-operation, and
           the configured order is what the test asserts, not entry order
SOM-PD-02  line discounts compound on a running balance, not on the original price
SOM-PD-03  the primary discount fixes the SRP-vs-standard basis for all later line discounts
SOM-PD-04  optimal-line selection picks the primary when enabled; first-entered otherwise
SOM-PD-05  subtotal coded discounts apply in grid order, top to bottom
SOM-PD-06  charges, fees and tax are never discounted
SOM-PD-07  all seven documented discount exclusion pairs are enforced
SOM-PD-08  an alternate tax interface blocks every subtotal discount
SOM-PD-09  net-total adjustment resets line prices, wipes all discounts, retains delivery
           and installation charges
SOM-PD-10  coupon redemption survives return, void and adjust; delete clears it
SOM-PD-11  an expired discount code remains usable while its coupon's own end-date override is
           current, and removing the coupon removes the associated discount code atomically
SOM-PD-12  the five-step jurisdiction decision resolves charge-by x fulfillment-method
           correctly, including the selling-store tax exception
SOM-PD-13  an RTO plan overrides customer exemption settings and strips all tax
SOM-PD-14  the internal tax calculation is used as the fallback when the tax interface is
           unreachable, and the fallback is logged
SOM-PD-15  misc fees are read-only outside the completed-order adjustment path
SOM-PD-16  stage-8 caps hold: total discount percent <= maximum subtotal discount percent, and a
           subtotal discount exceeding the open order subtotal clamps with a prompt
```

## Fulfillment scheduling (file 25)

```
SOM-FS-01  availability is the conjunction of: not past, weekday accepted, route open and
           within capacity INCLUDING this fulfillment, shared capacity respected, and
           inventory available for all lines
SOM-FS-02  a failed capacity override surfaces to the operator and does not silently leave
           lines unscheduled                                                                [DECIDE]
SOM-FS-03  restrict-scheduled-date evaluates location settings before control settings, and
           only on commit
SOM-FS-04  a multi-date quantity decrease consumes unscheduled quantity first, then works
           backwards from the last delivery date
SOM-FS-05  contact-status codes fail CLOSED when none are configured                        [DECIDE]
SOM-FS-06  editing a ship-to zip that changes delivery location prompts before rewriting
           every delivery line                                                              [DECIDE]
SOM-FS-07  the postponement counter increments symmetrically; an ASAP/CWC round trip does
           not cost an increment                                                            [DECIDE]
SOM-FS-08  each date-entry surface enforces only its documented constraints: the conversion
           prompt none, the consolidation control existing-dates-only, the scheduler all four
SOM-FS-09  completion date is bounded by the accounting period, never by route capacity
SOM-FS-10  route capacity is released when a fulfillment is rescheduled away from a date    [DECIDE]
SOM-FS-11  reserve/back-order reassignment cannot exceed available quantity in either
           direction
```

## Returns, exchanges, completion (file 26)

```
SOM-RX-01  a return posts nothing to the GL until completion
SOM-RX-02  a return posts to the selling location; an in-house card return posts to the
           operator's log-on location
SOM-RX-03  refund and charge fields on a return half treat positive as refund
SOM-RX-04  non-refundable tender forces a new certificate and refuses cash and check
SOM-RX-05  an overridden restocking fee is not recalculated, and the override is audited
SOM-RX-06  editing a reduced return price adjusts the cost reduction to match              [DECIDE]
SOM-RX-07  adjust-dollars touches no inventory and spreads value over original quantity
SOM-RX-08  adjust-dollars refuses credit on a fully returned line
SOM-RX-09  an off-file original requires the permission and writes an inventory-activity
           record even though STORIS writes none                                           [DECIDE]
SOM-RX-10  an exchange carries independent salesperson splits per half
SOM-RX-11  both salesperson fields stay inactive until the original order is keyed
SOM-RX-12  an even exchange shows a zero balance due, not a blank
SOM-RX-13  marking an exchange line not-complete completes the sale half only
SOM-RX-14  take-with completes immediately on save
SOM-RX-15  split exchange is unavailable against installment and RTO financing
SOM-RX-16  split exchange is NOT a route to edits otherwise blocked                        [DECIDE]
SOM-RX-17  commission adjustments propagate to re-invoices forward only (455A -> 455A,
           455B; never 455)
SOM-RX-18  commission rounding distributes in 0.01% increments, positive from the top of
           the list and negative from the bottom
SOM-RX-19  commission adjustment requires a named permission                               [DECIDE]
SOM-RX-20  exchanges-on-hold-at-entry sets hold E1 and release requires the approval
           permission
SOM-RX-21  exchange cross-half discount caps hold for fixed amounts: the sale subtotal discount is
           <= the sale portion subtotal AND <= the return portion subtotal discount, and an
           uneven-for-lesser-value exchange re-checks minimum eligibility
```

## Special orders, COM, Quick Sale (file 27)

```
SOM-SO-01  hold and print status are NOT ORed across frame and component POs               [DECIDE]
SOM-SO-02  deleting a line whose PO has printed leaves the PO and records the broken link
SOM-SO-03  COM routing is refused until the frame PO exists
SOM-SO-04  COM cost rolls into the frame line's cost at cost-entry time
SOM-SO-05  fractional COM quantity in N:N syntax resolves against unit conversion
SOM-SO-06  a buying-group PO from special-order entry cannot escape hold without a buyer   [DECIDE]
SOM-SO-07  PO reservation applies to stock lines only
SOM-SO-08  every vendor-import line is special-order merchandise and produces no stock line
SOM-SO-09  quick sale draws from the sales-order number sequence
SOM-SO-10  quick sale enforces take-with only, current date, current location
SOM-SO-11  quick sale reuses the shared discount, tax and tender stack unmodified — asserted
           by running the same discount and tax test vectors through both entry paths
SOM-SO-12  an exact match to a predefined configured item replaces the option-summed price on save
```

## Customer identity, lists, merge (file 28)

```
SOM-CI-01  duplicate search: last-name prefix, phone, email, SSN exact; zip narrows only
SOM-CI-02  exactly one merge-to target may be selected
SOM-CI-03  without the merge permission a user can only recommend, and their id is recorded
SOM-CI-04  a merge writes a pre-merge snapshot before moving anything                       [DECIDE]
SOM-CI-05  a merge writes a merge event with per-object moved counts                        [DECIDE]
SOM-CI-06  the survivor retains merged-from codes as searchable aliases                     [DECIDE]
SOM-CI-07  a Removed (rejected) merge decision survives the purge process                   [DECIDE]
SOM-CI-08  a merge locks both records for the duration and fails cleanly on contention        [DECIDE]
SOM-CI-09  a dry-run merge reports what would move without moving it                        [DECIDE]
SOM-CI-10  combined customer name elements are limited to 50 characters, with "combined"
           defined explicitly in code and asserted at the boundary
SOM-CI-11  phones are unique per type, repeatable across types, and one primary per type is
           required before save
SOM-CI-12  address verification failure is advisory; the typed address is retained as typed
SOM-CI-13  driver-licence capture stores a verification result, not the number              [DECIDE]
SOM-CI-14  a name-only customer is creatable and can carry an order
SOM-CI-15  declining a signature loops the terminal ceremony rather than proceeding
SOM-CI-16  list membership is AND across criteria groups, OR within a group
SOM-CI-17  a generated list is marked stale until regenerated
SOM-CI-18  reward certificates are non-refundable and non-reloadable
SOM-CI-19  marketing code 1 and 2 must differ
SOM-CI-20  changing a shipping address does not silently rewrite existing orders            [DECIDE]
```

## Cross-cutting additions to `12`

```
SOM-X-01  the security override is one implementation: three attempts, then return to the
          prior screen, with the authorizing user recorded on the audited action
SOM-X-02  every setting that changes documented behaviour is recorded in a settings registry
          with its LA Mattress decision (configurable / fixed / dropped) — see 29 §6
SOM-X-03  no documented STORIS control bypass listed in 29 §5 is reachable in our build
SOM-X-04  every [INFER] behaviour carries a SPEC:INFER comment naming its spec section
SOM-X-05  every [DECIDE] behaviour is answered in 31, or listed in 29 §4/§5, or unreachable
          in the build
```
