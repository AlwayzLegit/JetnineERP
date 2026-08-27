# Cross-Cutting Findings — What the Screen Layer Changed

Reading all 172 Sales Order Maintenance screens corrected or extended the module-level spec in files
`01`–`13`. This file is the delta. Where a finding contradicts an earlier file, **the finding wins**
and the earlier file's claim is marked here as superseded.

---

## 1. Corrections to the earlier spec

| Earlier claim | Correction | Where |
|---|---|---|
| Card entry is one screen (`05`) | **Four distinct card-entry screens** exist, selected by which processing module is active, and they differ in the most important respect there is — whether the card number is ever captured inside the application. See the comparison in `23`. | `23` |
| `Customer.home_phone` / `cell_phone` / `work_phone` and one email (`01`) | Wrong shape. Phones and emails are **collections**: unique per type, repeatable across types, with one mandatory primary per type whose absence blocks save. | `28` |
| The order snapshots billing data so it prints as written (`01`) | Contradicted by a documented "update sales orders?" prompt when a shipping address changes. The snapshot-vs-live question is now an open decision. | `28`, `31` #34 |
| Discount type set and stacking precedence are undocumented (`04`, `13` #5b) | **Closed.** A discount is a settings code plus five orthogonal attributes and three gates; 16 mechanisms across four scopes; stacking is a 10-stage pipeline whose order is itself configurable. | `24` |
| An alternate tax interface replaces internal tax calculation (`04`) | Narrower than that: the internal calculation remains as the **offline fallback**. | `24` |
| Quick Sale may need its own transaction model (`03`, `13` #15) | **Resolved: fast entry mode, not a separate model.** It draws from the sales-order number sequence, is gated by the ordinary order permission, and reuses the entire line, discount, tax and tender stack. Everything unique to it is a restriction. Build one aggregate plus an entry profile. | `27` |
| The Complete control is **inactive** at WMS ship-from locations (`02` §5; `12` CMP-07) | It is **permission-gated**, not disabled: active for a user holding *Adjust inventory for locations when WMS is active*. | `26` |
| Rooms die with the order unless it partially completed (`01`, `21`) | On a partially completed order they persist until completed orders are purged for that customer by the monthly report process. | `22` |
| Line status flags are the line's status model (`02` §4) | Incomplete. ATP/ATC each carry a **source** and a **document** dimension, and warranty linkage carries its own type domain. | `22` |
| Financed deposit without an authorization number "goes on credit hold" with no code named (`05`; `12` DEP-05 likewise) | The code is **`F3`**. `F5`, which `05` uses for driver-licence failure, is a different hold. This adds a code rather than overturning one. | `23` |

## 2. New subsystems the earlier spec missed entirely

**The comment subsystem.** Six distinct comment streams exist — order comments, additional comments,
mandatory order comments, exception comments, line item comments, and a second never-printing
"reference only" line stream — plus the audit comment log. They differ in scope, in whether they
print, in whether they block save, and in who may edit them. `[INFER]` Model them as one `comment`
entity with an `origin` domain rather than six tables. Two documented traps: **exception comments
attach to the order, not the line, so a second override overwrites the first justification**, and
abandoning the exception window silently voids the price override it was justifying.

**The merge pipeline.** Four screens form a dedupe pipeline (search → account-summary preview →
review → queue) with a deliberate two-person model: without the merge permission a user may only
*recommend*. **A merge is irreversible** — no unmerge exists anywhere in the 172 screens — and
`Removed` (rejected) decisions are deleted by the purge process, so the record of a rejected merge
does not survive. `11-cutover.md` depends on this tooling; `28` specifies seven additions we need
before running it on real data.

**Purchase-order coupling.** Special orders and COM couple sales lines to purchase orders with
behaviour that surprises: hold and print status are **ORed across the frame PO and all component
POs**, so one printed PO makes them all "printed"; printed POs survive line deletion with only the
link removed; and the receiving-vendor lookup only offers vendors already carrying a PO from this
order, which means **the frame PO must be created before COM routing**.

## 3. Consolidated new enum domains

Each spec file `21`–`28` carries its own authoritative "Enums introduced" block; this section is the
register that points at them, plus the domains that need reconciling across files. **Do not treat the
list below as the definitive values** — go to the named file's block.

| Where | Section | Domains introduced |
|---|---|---|
| `21` | §8.2 | print sort, print output, cart status, cart source, cart fulfillment method, deliver-to selection, submodule licensed, address-required disclosure, comment origin `[INFER]` |
| `22` | §11.3 | ATP/ATC source, ATP/ATC document, inventory source, warranty linkage type, warranty code, service scheduled, transfer status `[PARTIAL]`, PO status `[PARTIAL]`, configured purchase status `[PARTIAL]` |
| `23` | §9.2 | credit application type, check type, ECA transaction type, card processing setup, card refund mode, finance insurance, MMP calculation type, revolving term months, due day, payments per month, plan activation, apply insurance by |
| `24` | §9.2 | discount value type, discount basis, discount scope, discount special form `[PARTIAL]`, kit source of price, **charge by**, tax fulfillment method, **sale classification**, location ATI mode, tax fulfillment selector |
| `25` | §Enums | pickup monitor status, new fulfillment status, reservation action, deliver-to source, address-update confirm, route calendar state |
| `26` | §8.2 | return fulfillment method, exchange fulfillment method, adjustment type, **completed document type**, line completion status, serial tracking direction, warranty column value, non-refundable tender `[PARTIAL]`, reason-code used-for `[PARTIAL]`, return handling method `[PARTIAL]` |
| `27` | §7.2 | template pricing mode, kit type, transfer kinds, quick-sale-restricted types, salesperson sentinel, import file types, COM fractional quantity syntax, quick sale customer code format, EDI vendor codes `[LEGACY]`, vendor field formats `[LEGACY]` |
| `28` | §7.3 | phone type, relationship, address-verify target, trade discount application, merge status, merge eligibility, list sort, warranty link filter, source code |

### Domains that must be added to `02` §13

These are the ones a reader of the module layer alone would not have:

```
Charge by                     Not Applicable | Point of Sale | Ship From Location | Point of Possession
Sale classification           In State | Out of State
Completed document type       Sale | Return | Exchange Sale | Exchange Return | Dollar Adjustment
Card processing setup         GATEWAY_CREDIT_CARD | EMV_SHIFT4 | EMV_TENDER_RETAIL | NONE
Revolving term months         2 | 3 | 6 | 12 | 18 | 24 | 36 | 48 | 60   (a discrete set, not a range)
Credit hold                   add E1 (exchange entry hold) to the 02 §6 set
Merge status                  null | User Recommended | Merge | Merged | Removed | Attempted
Phone type                    Home | Cell | Work        (display sort: Home, Cell, Work)
Trade discount application    100% | 50% | 0% | No Discount Allowed
Comment origin  [INFER]       MANUAL | SYSTEM | FIELD_CHANGE | MANDATORY_CODE | EXCEPTION
```

Note two domains already in the module layer that the screen files restate rather than introduce:
**completion notes** (nine values, already in `02` §5) and **commission type flags** (already in
`02` §13). And `F3` is already in `02` §6 — the screen layer adds only `E1`.

### One domain to reconcile before building `[DECIDE]`

**ATP source** is stated two incompatible ways. `22`, `02` §13 and `09` all use the four-value set
`Reserved Stock | Assigned Pieces | Unlinked Shipped PO | Linked Shipped PO`. `25` §6, describing the
reservation-reassignment screen, uses three different labels: `current stock`, `new PO`,
`stock transfer`. `[INFER]` These are screen-local labels for the same underlying field —
`current stock` → Reserved Stock, `new PO` → a shipped PO, and `stock transfer` has no counterpart in
the four-value set, while `Assigned Pieces` has none in `25`'s three. Resolve to one domain with an
explicit label map before either screen is built; do not let two vocabularies for one field reach the
database.

## 4. Rules that will bite if missed

Ranked by cost of getting them wrong.

1. **Installation-charge overrides do not follow a moved line** — the source fulfillment keeps the
   overridden amount. Documented verbatim, and a straight revenue leak. `[DECIDE]` do not reproduce.
2. **Line discounts compound on a running balance**, not on the original price — and a *primary*
   discount fixes the SRP-vs-standard basis for every later discount on that line.
3. **Returns reach the GL only on completion.** Money cannot move until the merchandise is physically
   back in inventory. Returns post to the selling location — except in-house card returns, which post
   to the operator's log-on location.
4. **Refund and charge fields on return halves use an inverted sign convention** (positive = refund).
5. **An overridden restocking fee is never recalculated again**, and the override is written to audit
   comments.
6. **Releasing a pre-authorized deposit** converts it to a sale *plus a second sale transaction* for
   any upward delta. A decline deletes it; a communications error retains it.
7. **A revolving plan's minimum-deposit percent overwrites the order's deposit hold-back.**
8. **Auto-pay allocates** in the order due date → transaction date → lowest APR.
9. **Commission adjustments propagate forward only across re-invoices** (455A → 455A and 455B, never
   back to 455); rounding distributes in 0.01% increments, positive from the top of the list and
   negative from the bottom.
10. **A failed capacity override leaves lines unscheduled, not errored** — silent, and the operator
    may not notice.
11. **Multi-date quantity decreases work backwards from the last delivery date** after exhausting
    unscheduled quantity.
12. **Editing a ship-to zip into a different delivery location rewrites the delivery location for
    every delivery line on the order.**
13. **Contact status codes fail open** — with none configured, all codes are visible.
14. **Editing a reduced return price or a prorated warranty price does not change the cost
    reduction** — silent margin drift.
15. **Adjust Dollars spreads remaining value over the original quantity** (120.00 over 2 = 60.00) and
    refuses credit once the line is fully returned.
16. **Non-inventory lines (warranties) move only with their host inventory line.**
17. **Split eligibility has a seven-condition blocklist**; after a split both lines re-run reservation
    and recompute extended price.
18. **Mandatory order comments block save on any change to a saved order — but are skipped for
    layaway and quote conversions.** An inconsistency worth not copying.

## 5. Documented holes we must not reproduce

Each is real STORIS behaviour that functions as a control bypass. All are `[DECIDE]` — close them.

- **The delete-and-re-key workaround.** The "is customer address required" control is documented as
  defeatable by deleting and re-entering the order. A compliance control with a published bypass.
- **Split Exchange as an edit bypass.** Documented as the way to make edits STORIS otherwise blocks
  on a joined exchange.
- **Buying-group POs from Special Order Entry escape hold with no buyer assigned.**
- **Commission adjustment explicitly bypasses the POS commission restrictions**, and no permission is
  named for it.
- **A point-of-sale scanner bypasses the gift-card manual-entry permission.**
- **Open Cash Drawer has no permission and writes no audit record.**
- **Card Present defaults to checked** on the EMV window — the fraud-liability flag, pre-answered.
- **The EMV window demands an authorization number before the Swipe button activates**, which inverts
  the actual sequence.
- **A manufacturer's-serial save deletes the STORIS piece reference.**
- **Line-level group price override (`Update Product Price`) has no documented permission** and no
  stated position in the price hierarchy.

## 6. Permission and settings surface

The screen layer roughly **triples** the permission catalogue in `10-security-permissions.md` and
adds well over a hundred named configuration settings. Rather than restate them, each spec file
`21`–`28` ends with its own consolidated settings and permissions list. Two structural observations:

- **Settings are the real product.** A large fraction of documented behaviour is conditional on a
  named setting, and several settings *delete* UI rather than disable it (unchecking all three
  ATP-inclusion settings removes the ATP fields, the grid column, and the toggle action outright).
  `[DECIDE]` We will not want this many switches. Decide per area whether a setting becomes a
  configuration value, a hard-coded LA Mattress choice, or is dropped — and record the choice, because
  "STORIS had a setting for it" will otherwise become an argument during the build.
- **The override pattern is pervasive and consistent** (`10` layer 4): three attempts, then return to
  the previous screen, with the authorizing user recorded. Implement it once, centrally.

## 7. Corpus integrity note

The extraction corpus (`raw/som-corpus.md`) initially carried harness residue from the extraction
pipeline — fragments shaped like agent instructions (`agentId: …`, "use SendMessage with to: …") and
token-usage blocks appended to some article blocks. **Six of the eight specification agents
independently identified this, treated it as data rather than instruction, and reported it.** The
residue has been stripped and the corpus re-verified at 172/172 blocks with zero remaining matches.
No STORIS content was affected. Recorded here because anyone re-running the extraction should expect
it and strip it before use.
