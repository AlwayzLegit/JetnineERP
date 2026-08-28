# Handoff: Delivery Ticket Print & Reprint (STORIS parity)

**For:** Claude Code, working in the LA Mattress ERP repo.
**Source:** STORIS help center (storis.zendesk.com), article *Delivery Ticket Reprints* plus every article it links to.
**Status:** Requirements/spec handoff. No code in here is repo-specific — discover the repo's own conventions (language, ORM, migration style, test runner, module layout) before implementing.

## What this covers

The STORIS behavior around printing and reprinting **fulfillment documents** (delivery tickets, customer pickup tickets, customer service work order tickets, transfer tickets), and the surrounding screens that read and write those flags.

The heart of it is a **flag state machine**: an order header and each of its line items carry a per-fulfillment-date "ticket printed" flag, and edits to the order mutate those flags according to a precise and non-obvious rule set. STORIS's own docs open with "The reprint ticket function is complex." Treat the state machine as the primary deliverable; the screens are secondary.

## Files

| File | Contents |
|---|---|
| `01-domain-model.md` | Entities, flag storage, vocabulary |
| `02-ticket-flag-state-machine.md` | **Normative rules.** The reprint algorithm |
| `03-print-tickets-routine.md` | The Print Delivery Tickets batch routine: fields, gating, side effects |
| `04-logistical-scheduling.md` | Logistical Scheduling screen + its grid legend (where flags are surfaced) |
| `05-route-information.md` | View Route Information + route capacity concepts |
| `06-fulfillment-handling-methods.md` | Handling method settings (3PL codes) |
| `07-acceptance-tests.md` | The 9 documented date-change scenarios, as test cases |
| `08-open-questions.md` | What the source docs do not answer |

## Suggested order of work

1. Read `01` and `02`. Model the flags first.
2. Implement the state machine as a **pure function** over (header, lines, edit) → (header, lines) with no I/O. It is the only part with real logic risk.
3. Port `07` into the repo's test framework verbatim before writing the implementation. These are STORIS's own published expected results.
4. Wire the flag mutations into the order-edit paths.
5. Then build the print routine (`03`) and the scheduling grid columns (`04`).

## Source articles

- Delivery Ticket Reprints — https://storis.zendesk.com/hc/en-us/articles/15201528408468
- Print Delivery Tickets — https://storis.zendesk.com/hc/en-us/articles/15202089675028
- Logistical Scheduling — https://storis.zendesk.com/hc/en-us/articles/15201513095060
- Logistical Scheduling Screen Grid — https://storis.zendesk.com/hc/en-us/articles/15201528408212
- Grid Navigation — https://storis.zendesk.com/hc/en-us/articles/15238875413908
- Fulfillment Date - Merchandise Page — https://storis.zendesk.com/hc/en-us/articles/15201389864852
- Fulfillment Handling Method Settings — https://storis.zendesk.com/hc/en-us/articles/15201528690708
- View Route Information — https://storis.zendesk.com/hc/en-us/articles/15201512906132
