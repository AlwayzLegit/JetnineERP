# Financing

Third-party consumer financing is the single most rule-dense area of STORIS Sales Processing, and for
a mattress retailer it is also the highest-volume tender. Treat phase 7 as the phase most likely to
overrun.

## Provider model `[DOC]`

One standard online third-party interface accommodates **installment**, **RTO (rent-to-own)**, and
**revolving** providers, and a single provider can offer several plan types. Provider configuration
carries: supported finance types, transport (`TCP_MANUAL` / `FTP`), settlement method (one-step /
two-step), merchant numbers, a requires-account-number-on-authorization flag, and a service URL the
provider may return with its responses.

Providers named in the docs — useful as an integration shortlist, not as a commitment: Acima,
America First Finance, Capital One, Concora, Encompass, Fairstone, Fortiva, Koalafi, Progressive,
Smart Sales and Lease, Synchrony, TD Bank, Tower Loan, Versatile, Wells Fargo. All except Encompass
and an in-house "House" plan use one standard application form. Older settlement documentation also
references Citi Finance, GE Capital, and American General — `[INFER]` legacy names retained in
stale docs; confirm before treating the Citi two-step path as current.

`[DECIDE]` Which providers LA Mattress actually uses, and whether we integrate directly or through
an aggregator. Everything in phase 7 depends on this answer.

## Application lifecycle `[DOC]`

States and transitions are in `02` §7. Actors and entry points:

**Entry.** Applications are created from a dedicated finance-application program, or from the payment
tab of order entry / exchange entry. Initial fields: store (defaults from the order), customer code,
read-only name and address, **salesperson (mandatory)**, and finance provider — or the literal value
`QUEUE` to let the finance queue route it.

Salesperson default cascade `[DOC]`:

```
first salesperson on the order → salesperson passed into the process → salesperson from the user record
```

…and note the trap: **an existing application for the selected provider overwrites any entered
salesperson code**, and changes here do not propagate to the customer or order records.

**Customer-facing kiosk `[DOC]`.** A consumer-facing application mode presents only *Enter
Application* and *Exit*, and **Exit requires a staff credential override** — explicitly so customers
cannot reach other screens. If we build self-service application entry, copy this containment.

**Management.** A management grid, gated by a location-level finance-application-manager flag, filters
by store, salesperson, date range (application creation date), and status (All / Open / Complete).
Columns: status, customer code, **tier** (populated only when the queue assigns the provider), name,
store, create date, create time, last submission, salesperson, requested amount, approved amount.

**Per-customer actions `[DOC]`.** Selecting a customer opens their applications: each line shows
provider, account number, status, completion date, approval amount. Buttons: Select, Refresh, Submit
(→ `XMIT`), Close (→ `Deleted`), More Details, Maintain Application, View Application, and **Provider
Info** — which opens the provider's web service, but *only when the provider returned a URL with its
responses*, used when the provider needs more customer data. **Total Approved Amount** is the running
total of accumulated credit limits across all approved applications.

**Decision `[DOC]`.** The provider returns approve/decline. An account number may or may not
accompany an approval and is stored when returned. **Providers who handle multiple finance types
decide which type the customer qualifies for at application time** — an order can then only use a
plan of the approved type.

**Authorization is separate from approval `[DOC]`.** After approval, a per-order authorization
request including order details is submitted. Approval returns an authorization number. A
`pre-qualify` response means approval is possible once more information (bank account, pay dates) is
supplied **outside the system** via the provider's web service, and the order goes on `F3` hold.

**Re-authorization `[DOC]`.** Monetary changes — merchandise, discounts, sales tax, delivery,
installation, fees — on an approved installment/RTO order trigger:

```
no partial completions  →  a new authorization request
partial completions     →  an authorization ADJUSTMENT request (delta: original vs updated)
```

This is easy to miss and expensive when missed: an order edited after authorization and never
re-authorized funds at the wrong amount. Put a hard invariant in the domain — an authorized order
whose monetary total changes cannot be saved without either a re-auth or an explicit override.

## Plan types `[DOC]`

### Revolving
Plan-code based, long-term, carries **MMP (minimum monthly payment)** obligations. Additional
payments are accepted only for customers with at least one active plan **with a balance and no MMP
currently due**. Entry is via a short or full revolving worksheet per config. Settles at end of day
or manually.

### Installment
Contract-based (contract number, not plan code). Additional payments accepted only for customers with
an active contract **and no installment payment currently due**. Save shows a payoff as-of date, then
the payment summary. An open-contracts window appears in receivables processing whenever open
contracts exist, explicitly "to help prevent over payments from posting."

### RTO / lease — the most constrained
- The order is **forced non-taxable**; all sales tax is stripped and the provider handles tax inside
  its payment structure. The sales-tax report flags these with a no-tax-reason code
- **The full order amount must be financed**
- **An RTO plan cannot be added if a deposit of any amount has been applied**

### Installment + RTO shared rules `[DOC]`
- Cannot be used as a deposit: max-percent-as-deposit is locked at `0.00`
- Contract/agreement printing and first-payment collection happen **outside** the system, via the
  provider connection
- Exchanges require the original order to have been financed with an installment or RTO plan, and
  **split exchange is unavailable**
- Manual posts are prohibited against financed balances (though adding transactions to a batch does
  accept them)
- Settle **on transaction completion**; partial completion sends partial settlements

### Promotional / deferred interest `[DECIDE]`
**Not documented anywhere in the source material** — yet for a mattress retailer, "12 months no
interest" is likely the highest-volume plan on the floor. Its terms live in a financing-payment-plan
settings area that was not covered. Specify this explicitly: promo length, deferred-interest accrual
and retroactive-interest behaviour, minimum purchase, and how the promo disclosure prints. **Do not
let phase 7 start without this.**

## Financed balances `[DOC]`

Used when a provider rejects a finance receivable ("could not process"). It can adjust, rewrite,
resubmit, or reject transactions; post positive and negative monetary adjustments; adjust on-account
transactions from provider payments; and make **non-monetary** changes to finance account number,
authorization number, and dispute status.

Rules:
- **Only open batches are available**; closed transactions must be moved to an open batch first
- Adjustment date cannot be in the future or in a closed month
- Multiple transactions across multiple batches per session are allowed **only if they share one
  payment type**
- If no batch is selected, the program offers to add to the next available batch
- On save, a GL distribution screen appears **once per adjustment**, allowing the last GL account in
  the batch (the finance-adjustments account) to be changed

## Related programs to build `[DOC]`

Finance payment estimator and revolving payment estimator (both reachable from the payment tab —
these are selling tools, build them early), finance queue recap, view available financed credit, view
finance credit responses, update financing credit approvals, reopen a financed transaction, transfer
financed on-account funds, apply payments from provider, retailer disclosure + signoff, finance
application acknowledgement, financing activity log.

## Open gaps `[DECIDE]`

1. **Promotional / deferred-interest plans** — see above
2. **The finance queue and tier model** — only alluded to (a tier column, a `QUEUE` provider value, a
   queue recap program). Waterfall/cascade-decline logic is undocumented and is a major behaviour:
   define whether a decline auto-submits to the next tier, and what the customer sees
3. **Aging, statement cycles, dunning, interest and finance-charge calculation** appear nowhere in
   the source material. If we carry receivables in-house rather than selling them to providers, this
   is a whole additional module
4. **Charge-off** is implied by an "overpay charged-off accounts" setting but its lifecycle is
   undocumented
