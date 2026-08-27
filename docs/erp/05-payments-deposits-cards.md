# Tender, Deposits & Card Processing

## The Payment Summary — one screen, every tender `[DOC]`

STORIS routes _all_ money through a single Payment Summary window, reached from order entry,
completion, standalone payment/refund entry, and the cash-balancing manager screen. Multiple payment
types per transaction. Build this as one component with per-type sub-forms; do not scatter tender
logic across screens.

**Grid columns:** date, type, description, amount, number (check or card number, encrypted),
**New** (Yes if entered this session).

**Fields:** payment method, swipe card, payment amount, total paid, balance, payment terminal
(visible only when an EMV module is active; **mandatory for card tenders**), minimum deposit.

**Per-type sub-forms `[DOC]`**

| Type                    | Sub-form and notable fields                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Cash                    | Amount inline; no sub-form. Amount-tendered window on completion for change                   |
| Check                   | Check entry — driver's licence number mandatory or optional per the check payment-type record |
| Credit card             | Card entry — see below                                                                        |
| Debit card              | Debit entry; payment type defaults to `DEBIT`                                                 |
| Gift certificate        | Certificate number + amount, with a lookup                                                    |
| Financing (third party) | Account number, insurance (None/Single/Joint), amount, authorization number                   |
| Revolving               | Revolving worksheet, short or full form per config                                            |
| Installment             | Installment worksheet; payoff as-of date on save                                              |
| Petty cash              | Only inside cash balancing                                                                    |

## Tender rules `[DOC]`

1. **Gift certificates cannot be used on returns or exchanges.**
2. Overpayment is allowed only when the deposit-overpayment setting is on.
3. Cash refunds are capped by a daily-maximum-per-customer; exceeding it without the override
   permission **blocks the save entirely** (not just the line).
4. Payment-type-level access is enforced per user: "You do not have access to this payment type."
5. **Once a payment requiring authorization is authorized, the order must be saved** to preserve
   settlement integrity. To delete the order you must save it and re-access it. _This is the
   anti-orphaned-authorization rule and it is the most important invariant in this file._
6. Auto-pay / global auto-pay validates the payment against the **sum of standard minimum monthly
   payments** — it must equal or exceed that sum, or the operator is returned to the payment summary.
7. Only one refund payment type per session; editing one tab of the standalone payment/refund
   program inactivates the others until cleared.
8. Negative finance-receivable payments must match an existing authorization record unless the
   allow-negative-for-different-day setting is on.
9. Payments cannot be applied to installment or RTO plans through order deposits, receivables
   processing, or gift-card handling — only through the in-store finance payment path, which settles
   immediately.
10. Partial card payments are barred on **take-with** transactions — the full amount due is required.

## Deposits `[DOC]`

A deposit is a **liability**, linked to the order, that persists through completion. It is not a
reduction of a receivable.

- Once initial deposits are applied and the operator exits the order, **they cannot be edited**. New
  deposits must be added through the payment summary from order entry, or the standalone payment
  programs.
- Deposit maintenance can move a deposit to another open order, place it on account, or refund it
  through accounts payable.
- Additional deposits on an order with any fulfillment on a manifest require the
  allow-deposits-on-order setting.
- Only one deposit per session on the order-deposits path.
- Finance deposit refunds are **blocked** on orders containing unapproved deposits, even if approved
  financed deposits also exist.
- **Pre-authorized deposits and financing are mutually exclusive** — using a pre-auth deposit
  inactivates the financing payment type.
- Pending pre-authorizations surface as a message and are applied through a dedicated action; they
  are **not** visible or maintainable in the standalone payment program.

### Financed deposits `[DOC]`

Third-party payment types can serve as a deposit only when the allow-deposits-on-stock-merchandise
setting is configured — either special-order merchandise only, or all merchandise. The permitted
amount is the payment type's **maximum deposit percent** applied to the special-order total or to the
whole order accordingly.

> **No authorization number entered ⇒ the order goes on credit hold.**

Revolving codes trigger a credit-line check ("A credit line must be established before financing can
be added"); an expired line yields "Credit Report required" / "Credit application requires update"
and a hold. First use triggers driver-licence verification; failure sets the `F5` hold.

Installment and RTO **cannot** be used as a deposit at all — their max-percent-as-deposit is locked
at 0.00.

## Minimum deposit `[DOC]`

The required-deposits-by-line display is reachable from the payment tab of order entry, exchange
entry, and the COD worksheet.

```
Total Minimum Deposit Required for This Order
   = the GREATER of (whole-order minimum, line-type minimum)   ← when both exist

Amount Required to Satisfy Minimum Deposit
   = total required − (monies paid + monies financed)          ← zero if deposits exceed the minimum
```

Grid: product, quantity (**all** quantity, regardless of dates or back-order state), price (single
unit after discounts), extension, fulfillment method, payment required (per line type).

- An include-estimated-tax setting adds a "With Tax" heading and folds tax into extension and
  payment required
- Delivery and installation charges appear as **separate grid lines**
- Exchanges: delivery-line amounts are reduced by return-line amounts **pro rata** to each delivery
  line's share of the total delivery amount
- Completed lines drop off the display
- Called from the COD worksheet, it shows only the back-ordered remainder

`[DECIDE]` **Where the minimum-deposit percentages live is never documented.** The display shows the
result and mentions a whole-order minimum and a line-type minimum, but not their configuration home.
Define this: most likely a per-fulfillment-method percent plus an order-level percent, both
overridable by product or category. Ask before implementing.

---

## Card processing

### Card entry `[DOC]`

| Field                | Rule                                                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card number          | No spaces. **All but the last four digits encrypted.** Any entry with a leading `X` is rejected (it would be a masked value pasted back in)                                                    |
| Type                 | Read-only, derived, with a description beneath                                                                                                                                                 |
| Verify card number   | Active only on manual entry _and_ when validate-manual-entry is on; must match or entry cannot proceed                                                                                         |
| Card present         | Manual entry only; **not stored on the order record** and unavailable after exiting                                                                                                            |
| Month / Year         | Rendered only if flagged mandatory in card payment settings                                                                                                                                    |
| CVV                  | Active only when prompt-for-CID is on for that card type. Accepts a number or `BPD` / `ILL` / `NAV`. **Not stored on the order record**                                                        |
| Amount               | Defaults to the full outstanding amount depending on a per-user setting                                                                                                                        |
| Swipe                | A successful swipe populates type. **A swiped entry cannot be edited** — return to the payment summary and restart. Button inactive if the device is not connected or signature capture is off |
| Authorization number | From the card company; rendered only if flagged mandatory                                                                                                                                      |

**Unmasking** requires a user permission _plus_ a re-authentication prompt where a second authorized
user enters credentials, and the override is **temporary**.

### Decline handling `[DOC]`

The authorization display screen appears **only on decline**. Read-only context: card type, masked
number with last four, expiration, payment amount, bank response plus a free-text message from the
authorization service. Response actions and the two exceptions (debit void, swiped pre-auth) are in
`02` §8.

### Auth vs capture `[INFER]`

The docs never state it explicitly, but the model is clearly **authorize at payment entry, fund at
settlement**: card auth happens in the payment summary, and money moves in the settlement run (`07`).
The forced-save rule (tender rule 5 above) exists to prevent orphaned authorizations. Implement
auth/capture as two distinct persisted events with their own timestamps and processor references.

### Abandoned transactions `[DOC]`

A dedicated program resolves abandoned external card transactions, and receipts can be reprinted.
Build both: with a terminal in the loop, abandonment is not an edge case.

### EMV / terminal `[DOC]`

Terminal assignment happens on step 1 of order entry (an EMV terminal selection action) and the
terminal field on the payment summary is mandatory for card tenders. A maintain-order-credits program
searches orders with EMV card activity and hands off to receivables for card refunds.

**Original payments display for refund** only when validate-original-payment-on-refunds is enabled
**or** EMV processing is in use — and they do **not** display if: no EMV module is licensed and
active; the login location is not EMV-configured; the location is EMV-enabled but the login cash
drawer has no pin-pad identifier; the original card was not processed as EMV; or the original card
data records are no longer on file.

Convenience fees require settings for both the state and the store location and apply only to gateway
processing.

### Tokenization `[DECIDE]`

STORIS documents field-level encryption and masking plus retained "card data records". Tokenization
is never mentioned. **Do not copy this.** Use processor tokenization, store only the token, last
four, brand, and expiry, and keep PANs out of our database entirely. This shrinks PCI scope and is a
deliberate, defensible departure — but it changes the refund-lookup design (the "original card data
records no longer on file" case above becomes "token expired"), so decide before phase 4.
