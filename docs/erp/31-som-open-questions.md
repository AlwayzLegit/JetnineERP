# Open Questions — Screen Layer

Continues the numbering in `13-open-questions.md` (which ends at #28). Questions #29–#58 live here;
this file is the single global register, and the local question lists at the end of `21`–`28` cross-
reference into it. Same two kinds: **Type A**,
STORIS documents it incompletely or not at all; **Type B**, we understand it and should deliberately
not copy it. Both need a human answer, not a coding decision.

`13` had nine blocking questions. Four are now **closed** by the screen layer and two more are
narrowed. The net question count went up; the blocking count went down.

---

## Resolved from `13`

| # | Question | Resolution |
|---|---|---|
| 5b | Discount type set and stacking precedence | **Closed.** Fully established — see `24` and `29` §1. A discount is a settings code plus five orthogonal attributes and three gates; stacking is a ten-stage pipeline whose order is itself a configuration value. |
| 15 | Quick Sale: separate transaction model or fast mode? | **Closed: fast entry mode.** Shares the number sequence, the permission, and the entire line/discount/tax/tender stack. Build one aggregate plus an entry profile. |
| 24 | Completion Date Entry field rules | **Closed** — see `25` §2.5: defaults to the current date, gated by *Change a transaction's completion date*, bounded by *Days to Allow Completion Backdating*, no forward dating. |
| 27 | Line type vs the completion "notes" classification | **Closed.** The notes classification is a real second dimension, fully enumerated at nine values (`02` §5, `26` §8.2) and distinct from line type. Model both. |
| 5 | Tax engine or in-house? | **Narrowed.** An external interface does not replace the internal calculation; the internal one remains the offline fallback. So we need both regardless, which makes the decision about which is primary, not about whether to build one. |
| 8 | Settlement error blast radius | **Unchanged**, but note the same all-or-nothing pattern appears in PO hold/print status (`29` §2) — it is a house style, not a one-off. |

---

## Blocking — answer before the named phase

### 29. Configured-product price and description composition — Type A, phase 1
Product configuration screens (options, fabric, configurator) never document **how a configured
product's final price and description are assembled** from the base product plus its selections. This
blocks special orders entirely, which for a mattress retailer means blocking a meaningful share of
revenue. Need: the composition formula, precedence when an option carries its own price, and how the
description is built for printing.

### 30. The "Duplicate Customer Merge Overview" article is not in the corpus — Type A, phase 11
It holds the merge **eligibility rules**, and the four merge screens reference them without restating
them. `11-cutover.md` depends on this tooling. Either retrieve that article or specify eligibility
ourselves before the cutover dedupe runs on real data.

### 31. Merge is irreversible with no snapshot — Type B, phase 11
No unmerge exists in any of the 172 screens, and rejected merge decisions are deleted by the purge
process. `28` specifies seven additions (pre-merge snapshot, merge event with per-object counts,
`merged_from` aliases, audit comment, retained rejections, record locking, dry-run). Confirm we build
them — a destructive irreversible bulk operation on customer identity is the single riskiest thing in
the cutover.

### 32. Which card-processing model do we adopt — Type B, phase 4
The four card-entry screens are four genuinely different security postures, and one of them
(gateway/standard) captures the card number inside the application. This is the concrete form of
`13` #3. Decide the target posture — terminal-captured, never in our database — and the answer
determines which screens exist at all.

### 33. The settings explosion — Type B, phase 0
Well over a hundred named configuration settings govern documented behaviour, and some *delete* UI
rather than disable it. `[DECIDE]` per area: configurable value, fixed LA Mattress choice, or dropped.
Record each decision in a settings registry (`30` SOM-X-02). Without this, "STORIS had a setting for
it" becomes an argument during every phase.

### 34. Order snapshot vs live customer data — Type A/B, phase 1
`01` assumes the order snapshots billing data so it prints as written. A documented "update sales
orders?" prompt on shipping-address change contradicts that. Decide the rule — snapshot with explicit
re-sync, or live join with historical print copies — because it affects every printed document and
every reconciliation.

---

## Design decisions — the documented bypasses

Each is real STORIS behaviour functioning as a control bypass (full list in `29` §5). All Type B, all
recommend *close it*, all need confirmation because closing one changes a workflow someone relies on.

### 35. The delete-and-re-key workaround for the address-required control — phase 1
### 36. Split Exchange as a route to otherwise-blocked edits — phase 6
### 37. Buying-group POs escaping hold with no buyer — phase 1
### 38. Commission adjustment bypassing POS commission restrictions with no named permission — phase 9
### 39. Scanner bypass of the gift-card manual-entry permission — phase 3
### 40. Open Cash Drawer with no permission and no audit record — phase 8
### 41. Card Present defaulting to checked — phase 4
Pre-answering a fraud-liability flag on the operator's behalf.
### 42. Authorization number demanded before the swipe control activates — phase 4
Inverts the real sequence; likely a documentation error but it reads as behaviour.
### 43. Manufacturer's-serial save deleting the internal piece reference — phase 1
### 44. Line-level group price override with no permission and no place in the hierarchy — phase 2

---

## Undocumented mechanics

### 45. Route capacity unit — Type A, phase 5
Never published whether capacity counts volume or stops. Pickups carry no shipping volume at all,
which suggests stops, but it is not stated. Capacity **release** on reschedule is also never stated.

### 46. Coded-vs-additional subtotal discount order — Type A, phase 2
The pipeline is established but the ordering between coded subtotal discounts and additional
amount/percent discounts is not.

### 47. Whether the tax base is gross or net of subtotal discounts — Type A, phase 2
Material to every tax calculation and unresolved.

### 48. The order-of-operation value set — Type A, phase 2
The discount pipeline order is configurable, but the permitted values are never listed.

### 49. Driver-licence failure behaviour and retention — Type A, phase 3
Masked on entry, validated only when a setting is on; failure behaviour, blocking, hold and storage
are all undocumented. Related to `13` #14.

### 50. "Combined" in the 50-character name limit — Type A, phase 1
Three screens impose it; none define which elements combine or whether separators count.

### 51. Phone "highest priority" — Type A, phase 1
Referenced as a selection rule, never defined.

### 52. Contradictory duplicate-email policies — Type A, phase 1
Two screens state different rules.

### 53. Which security file owns off-file-original returns — Type A, phase 6
### 54. Two conflicting commission date-attribution rules — Type A, phase 9
`13` and the screen layer disagree; the screen layer has the more specific statement but they cannot
both hold.
### 55. Adjust-dollars averaging convention — Type A, phase 6
Value spreads over the original quantity; whether that is intended or an artifact is unclear.

---

### 56. One return window or two? — Type A, phase 6
Two differently named setting pairs govern how late a return may be entered — *Allowed Number of Days
on Return* / *Override Allowed Number of Days on Returns*, and *Return Restriction Days* / *Override
Return Restriction Days*. Both live in POS control settings and both appear to do the same job.
Determine whether STORIS has one control under two names or two genuinely different windows. If one,
do not ship two. (Raised as `26` §8.4 #1.)

### 57. Discount-code category exclusion reads backwards — Type A, phase 2
On the return and exchange screens, discount codes whose customer price category **matches** the
customer's are **excluded** from the dropdown — which as written hides exactly the codes that ought to
apply. Verify against a live system; this is more likely a documentation inversion than behaviour, but
it cannot be implemented either way as written. (Raised as `26` §8.4 #6.)

### 58. Does a blank variance threshold fall through or terminate? — Type A, phase 2
The precedence cascade for the special-order price-variance threshold is documented (product →
location → POS control, all blank means no check), but not what a blank at *one* level does: fall
through to the next level, or end the check. Money-critical, because it decides when a discount trips
a variance exception. (Raised as `24` §4.4.)

## Content defects in the source

Not questions for us — defects on STORIS' side, recorded so nobody wastes time re-reading these
looking for detail that is not there. Roughly **60 defects** are tabulated across the consolidated
sections of `21`–`28`. The notable ones:

- **Cost Entry Screen** — body never migrated; a single paragraph with no field definitions
- **Sales Analysis Report Fields** — field table lost in migration (this is `13` #16, in the earlier
  section)
- **Finance Receivable Entry** — entire body duplicated with *conflicting* field labels between copies
- **Re-assign a Sales Reservation** — body duplicated, and the second copy drops a rule
- **Term MMP Table** — titled "Read Only" but documents a Save that reduces the MMP
- **Enter a Return** — the quantity-returned definition contains the brand field's text
- **Adjust Dollars on a Completed Order** — refund/even-exchange wording copy-pasted from the exchange
  article; "zip code from the Product file" is nonsense
- **Access Control Window** — names the same field both "User ID" and "Initials"
- **Additional Fulfillment Information** — the General tab has no fields at all
- **Sales Tax Processing Overview** — promises three RTO criteria, lists two
- Several screens carry two different titles; several field descriptions are copy-paste errors from a
  neighbouring field; one warranty-duplicate message ships an unsubstituted `~` placeholder

Where a defect hides a rule we need, it appears above as a numbered question. Where it is only sloppy
prose, it stays here.
