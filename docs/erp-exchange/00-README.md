# Enter an Exchange — Handoff for Claude Code

## What this is

A full functional specification of the STORIS **Enter an Exchange** routine, reconstructed
from the source article. It exists so we can rebuild equivalent capability in the LA Mattress
in-house ERP.

Behavior spec, not a design doc. No stack, ORM, framework, or directory layout is
prescribed — read the repo and follow the conventions already there.

Source: <https://storis.zendesk.com/hc/en-us/articles/15201424987796-Enter-an-Exchange>

## Read in this order

| File | Covers |
|---|---|
| `01-domain-model.md` | What an exchange *is*, the invariants, the state machine, and the single most important design decision |
| `02-step1-customer.md` | Header, customer, fulfillment scheduling, contact info |
| `03-step2-return-merchandise.md` | The return leg — piece selection, pricing, As-Is, reason codes |
| `04-step3-sale-merchandise.md` | The sale leg — replacement product, pricing, sourcing, scheduling |
| `05-step4-payment-and-completion.md` | Two-sided totals, payments/refunds, financing, ticket print, completion |
| `06-settings-and-permissions.md` | Consolidated matrix of every control setting and security permission the routine touches |
| `07-build-plan.md` | Phasing, acceptance criteria, what to cut |

## The one thing to understand first

**An exchange is one document containing two opposite transactions**: a customer return and a
replacement sale. They share a customer, a date, a fulfillment, and a single net balance —
but they carry **separate salespeople, separate totals, separate discounts, separate
charges**, and they can be **split apart into two independent documents at any time**
(the Split Exchange action).

That last capability is the tell. If the two legs can be divorced mid-flight and completed
independently, they were never really one thing. **Model an exchange as a container over two
first-class transactions (a return and a sale), not as a special kind of sales order with
negative lines.** Everything else in this spec follows from that decision, and getting it
wrong is expensive to undo — the STORIS article devotes a whole FAQ and a dedicated
sub-process to unpicking exchanges that were entered as one blob.

## The four steps

```
Step 1  Customer        who, where, when, how it's fulfilled
Step 2  Return          what's coming back, at what credit, into which inventory bucket
Step 3  Sale            what's going out, at what price, from which stock
Step 4  Payment         net the two legs, settle the difference, complete
```

Steps 2 and 3 are near-mirror images with different rules. Step 4 is where the two legs meet
and where most of the accounting risk lives.

## Conventions

- **`[GATE]`** — a precondition that blocks or restricts the operation.
- **`[PERM]`** — a named user/group security permission. Full list in `06`.
- **`[SETTING]`** — a named control setting. Full list in `06`, each marked
  *keep* / *simplify* / *drop*.
- **`[SIDE EFFECT]`** — mutates state beyond the document itself.
- **`[LEGACY]`** — Windows thick-client artifact. Do not port.
- **Recommendation** — our judgment, not STORIS behavior. Never blur this line when
  implementing; if you need a rule the spec doesn't state, ask rather than invent.

## Scope note

The article cross-references roughly forty other processes (Splitting Exchanges, Payment
Summary Window, Purchase Order Reservations, Protection Plan Overview, Delivery Processing
Overview, the Revolving Worksheets, and more). Those are **named where they matter and marked
as external dependencies**; their internals are out of scope here. `06` lists them so the
dependency graph is visible before anyone starts building.
