# Run 01 — Accounting — Batch 29: Third-Party Financing Views, Signatures, and Credit History Codes

11 articles. **This closes `W-032` end to end** — `View Financing House Activity` states exactly
when financed money posts to Finance Receivables, which no earlier article did.

---

## A. Coverage log (this batch)

| # | Article | URL | Status |
|---|---|---|---|
| 303 | **View Financing House Activity** | /articles/15295155057044 | EXTRACTED |
| 304 | View Current Financing Activity | /articles/15295155059220 | EXTRACTED |
| 305 | View Historical Financing Activity | /articles/15295154860180 | EXTRACTED |
| 306 | View Available Financed Credit Response | /articles/15294751490196 | EXTRACTED |
| 307 | View Finance Credit Application | /articles/15295154559764 | EXTRACTED — thin |
| 308 | FR Cross Reference Inquiry | /articles/15294752097684 | EXTRACTED |
| 309 | **View Customer Signatures (Checks)** | /articles/15295212525844 | EXTRACTED |
| 310 | View Check Status and Payment Details | /articles/15295156260500 | EXTRACTED — thin |
| 311 | **Credit History Codes** | /articles/15295210650004 | EXTRACTED |
| 312 | View Collector Performance | /articles/15295156258196 | EXTRACTED |
| 313 | FR Customer Selection | /articles/15294752103700 | LOGGED — picker |

Newly discovered, queued: `Financing Control Settings`, `View Available Financed Credit`,
`Signature Capture Settings`, `Electronic Check Inquiry`, `Report Applied Customer Credits`,
`House Finance Provider`.

---

## B. Wiring findings

### FINDING 316 — Financed deposits post immediately; the financed amount posts at invoice
Producer:   `View Financing House Activity` — orders financed through the **House Finance Provider**
Invariant (stated twice, on both tabs): "**Approved deposits post to Finance Receivables
            immediately; the Financing amount will post to Finance Receivables once the order has
            been completed (invoiced).**"
Scope:      "shows only activity affecting the financed order" — deposits · **rewrites** ·
            **resubmits** · **rejects** (if the activity affects the order)
Tabs and payload:
  - *General:* Order Date · Customer · Name · Account · **House Account Add On** ·
    **Original Sale · Adjustments · Net Sale** · **Authorization Number · Authorization Date ·
    Authorization Expires · Authorization Maximum**
  - *Financing Data:* Financing Type · Insurance · Date · **Applied · Approved · Cashed** · **Usage Fee**
  - *Deposit Data:* Deposit Type · Insurance · Date · Applied · Approved · Cashed · Usage Fee
Evidence:   View Financing House Activity, /articles/15295155057044
Maps to:    **W-032 — CONFIRMED end to end**, **W-030 — CONFIRMED by analogy**

> This is the missing recognition rule. The financing chain is now fully evidenced:
> **application → approval (batch 9) → attach with account and authorization numbers (batch 5) →
> deposits post to FR immediately → financed amount posts to FR at invoice → funding batch
> (batch 3, Finding 35 item 5) → bank reconciliation (batch 3)**.
>
> Three attributes matter for parity: the authorization carries an **expiry** and a **maximum**
> (so an approval is a bounded facility, not a number); the transaction has three dated states
> **Applied / Approved / Cashed**; and a **usage fee** attaches to both financing and deposits —
> the fee whose account resolution was STORIS's own worked example of the GL hierarchy (batch 1).

### FINDING 317 — Financing activity is batch-scoped, and open vs closed batches are different screens
`View Current Financing Activity` — "transactions that are **unresolved within one or more open
            batches**"; filters Plan · Finance Provider · Batch Date · **Open Balance** · **On Account**
`View Historical Financing Activity` — "**resolved** transactions within one or more **closed**
            batches"; same filters minus the balance ones
Both:       inquiry by **Payment Type** or by **Finance Provider + Batch Date**
Display:    "The Customer column displays either the customer name or the customer code, depending
            [on] the **`Display Customer Name`** field in `Financing Control Settings`. Also …
            if set to display customer codes, the system displays on-account transactions as
            **`ON ACCNT`**."
Evidence:   View Current Financing Activity, /articles/15295155059220 · View Historical Financing Activity, /articles/15295154860180
Maps to:    **W-032 — CONFIRMED** (the funding batch is the unit of resolution)

> "Unresolved within an open batch" vs "resolved within a closed batch" is the funding-batch
> lifecycle `W-032` posits, and it mirrors the current/history bifurcation seen everywhere else in
> Receivables. `ON ACCNT` is a fifth typographic sentinel (after `*`, `D*`, `$$$$$^NN`, `…`).

### FINDING 318 — A finance account number can be shared across customers, by setting
Trigger:    Assigning a finance account number already assigned to another customer
Producer:   `FR Cross Reference Inquiry` — lists all customers previously assigned to that account
            number; select one and Continue, or Exit
Gate:       "The **`Multiple Customers Per Finance Account`** field in `Financing Control Settings`
            must be selected for this screen to appear."
Evidence:   FR Cross Reference Inquiry, /articles/15294752097684
Maps to:    NEW

> Finance account numbers are **not** a unique key to a customer when this setting is on — household
> or joint accounts share one provider account. Any migration keying finance receivables on account
> number alone will merge customers. **Check this setting on the live system.**

### FINDING 319 — The provider credit response is a full account snapshot, and varies by provider
Producer:   `View Available Financed Credit Response` (from `View Available Financed Credit`)
Payload:    Customer Number · **Social Security Number** · Account Number · Finance Comment ·
            *Finance Details:* Provider · Name · **Date Opened** · Balance Due · Credit Limit ·
            Due Date · Current Balance · Last Payment · **Available Credit** · Last Payment Due ·
            **Authorized Users** · Customer Bill To Information · **Finance Customer Information**
            (a separate name/address/three phones block)
Caveat:     "**Not all fields on this screen display for all providers.**"
Evidence:   View Available Financed Credit Response, /articles/15294751490196
Maps to:    **W-060 — CONFIRMED for third-party credit**

> Two things to carry: the provider's record of the customer (**Finance Customer Information**) is
> held **separately** from ours, so name/address divergence between STORIS and the provider is
> expected and visible; and **Authorized Users** is a provider-side concept with no STORIS equivalent.
> Note the SSN appears on this screen — the fourth data-protection sighting in the run.

### FINDING 320 — Check signatures and electronic check details are archived and viewable
Producer:   `View Customer Signatures (Checks)` — "view, but **not edit**, an **archive** of check
            transactions"
Prerequisites (all three): Signature Capture installed on the PC, and active in
            `General System Control Settings`, `Signature Capture Settings`, **and the log-on location**
            (no tablet needed to view)
Drill-down: `Electronic Check Inquiry` — Order · Company (name, address, city/state/zip, telephone) ·
            **Electronic Checks** (number, **merchant number**, amount, bank number, date,
            account number, time, **authorization number**, store, check number)
Signature:  the captured signature displays; otherwise "a description of the action taken at the time
            appears in the signature space (for example, **Skipped, Cancelled, or Signature Not Available**)"
Printing:   "generates **graphical print files** similar to PrintScreen images … the system brings you
            to the **Windows Print Window** … To print to the default STORIS printer, you must
            install it on your PC."
Evidence:   View Customer Signatures (Checks), /articles/15295212525844
Maps to:    **W-054 — CONFIRMED** (a genuine archive, unlike receipts and check registers)

> This is the **only true archive** found in the run: signatures are stored, not regenerated, and
> the absence of a signature is itself recorded as a typed reason. Contrast receipt reprints
> (batch 23) and check registers (batch 25), both regenerated. Whatever we build should archive
> rendered documents the way this archives signatures.
> Note **merchant number** again (cf. batch 25's check transaction reporting) — check acceptance is
> merchant-scoped.

### FINDING 321 — Credit history codes are a nine-value cycle-time delinquency scale
Enumeration (verbatim), "applying the status of the account **at the time the last cycle process was run**":
| Code | Meaning |
|---|---|
| `C` | current — 0–29 days, balance paid |
| `0` | current — 0–30 days, **no balance** |
| `1` | 30–59 days late |
| `2` | 60–89 days late |
| `3` | 90–119 days late |
| `4` | 120–149 days late |
| `5` | 150–179 days late |
| `6` | 180+ days late |
Evidence:   Credit History Codes, /articles/15295210650004
Maps to:    **completes batch 16, Finding 219** (`Payment History Profile`)

> These are the same codes as the Metro 2 payment history profile — and this article gives the
> distinction the other one omitted: **`C` = current with a balance paid; `0` = current with no
> balance**. Batch 16 found that `0` also means "cycle processing was not run", so `0` is **triply
> overloaded**: no balance, current, or no cycle. That is a genuine data-quality hazard for any
> delinquency history we migrate, and it is now fully characterised.
> Note the code set is **stamped at cycle time**, so it is a per-cycle snapshot, not a live value.

### FINDING 322 — Collector performance is measured per aging bucket against per-bucket quotas
Producer:   `View Collector Performance` — "period-to-date and year-to-date dollars collected **for
            each aging category**"; if quotas exist (in `Collector Settings`) it indicates whether
            they were met
Payload:    per collections period (e.g. 1-30 days): **Quota · Amount collected · Percentage above or
            below quota**, for both PTD and YTD · Collected today and yesterday ·
            **Letters** requested today, yesterday and period-to-date
Note:       "This inquiry is also available as a **dynamic escape**."
Evidence:   View Collector Performance, /articles/15295156258196
Maps to:    completes batch 27, Finding 305 — quotas are **per aging bucket**, not a single target

> Quotas are set per aging bucket, which makes collections performance a matrix rather than a number.
> And **letters requested** is tracked as a productivity metric alongside dollars — so the letter
> assignment in batch 10 feeds performance measurement.
> "**Dynamic escape**" is a new UI concept: an inquiry reachable from wherever the user happens to be.

---

## C. Screen and field inventory

**View Financing House Activity** — Order; tabs General / Financing Data / Deposit Data (fields at
Finding 316).

**View Current Financing Activity** — Filter · Plan · Finance Provider · Batch Date · Open Balance ·
On Account · Grid.

**View Historical Financing Activity** — Filter · Plan · Finance Provider · Batch Date · Grid.

**View Available Financed Credit Response** — fields at Finding 319.

**View Finance Credit Application** — Selling Store · Customer Code · Finance Provider · Actions
(read-only twin of Finance Application entry / Credit Application Maintenance).

**FR Cross Reference Inquiry** — grid of customers sharing a finance account number; Continue / Exit.

**View Customer Signatures (Checks)** — Checking Account Number · Grid → `Electronic Check Inquiry`.

**View Check Status and Payment Details** — Bank · Date · Time/Code · Type · Status
(read-only twin of `Select and Approve Bills for Payment`).

**View Collector Performance** — Collector · Period to Date (Quota, Collected, % vs quota per aging
bucket) · Year to Date (same) · Collected (today, yesterday) · Letters (today, yesterday, PTD).

---

## D. Control settings catalog (additions)

| Setting | Lives in | What it changes |
|---|---|---|
| Display Customer Name | Financing Control Settings | Customer name vs code on financing activity grids (`ON ACCNT` for on-account) |
| Multiple Customers Per Finance Account | Financing Control Settings | Permits one provider account across several customers |
| Signature Capture | General System Control Settings + Signature Capture Settings + log-on location | Three-way gate on signature capture and viewing |
| collector quotas (per aging bucket) | Collector Settings | Basis for collector performance |

---

## E. Security permissions catalog (additions)

*(None new. Regional Processing applies to `View Finance Credit Application`.)*

---

## F. State machines and enumerations

**Credit history codes** — `C` · `0` · `1` · `2` · `3` · `4` · `5` · `6` (Finding 321).

**Financing transaction dated states** — Applied · Approved · Cashed.

**Financing batch states** — open (unresolved) · closed (resolved).

**House financing activity types** — deposits · rewrites · resubmits · rejects.

**Authorization attributes** — Number · Date · **Expires** · **Maximum**.

**Signature outcomes** — captured · Skipped · Cancelled · Signature Not Available.

**Typographic sentinels (final list)** — `*` no vendor model · `D*` deleted order ·
`$$$$$^NN` unresolved GL account · `…` multiple documents · `P` paid pending bill · `ON ACCNT`
on-account financing transaction.

---

## G. Sequencing rules (additions)

1. Approved financed **deposits** post to Finance Receivables **immediately**.
2. The financed **order amount** posts to Finance Receivables **at invoice (completion)**.
3. Financing transactions resolve within a batch; the batch then closes and moves to history.
4. Credit history codes are stamped at each cycle run.

---

## H. Open questions and gaps

**1. Gated or unreachable** — `View Customer Signatures (Checks)` requires Signature Capture
installed and active in three places; unavailable otherwise.

**2. Documented but ambiguous**
- **`House Account Add On`** — a field on financed orders, undescribed.
- **`Cashed`** — the third dated state; whether it means the provider funded us or the customer's
  instrument cleared is not stated. It matters for revenue and cash recognition. **Ask STORIS.**
- **`Usage Fee`** — appears on both financing and deposits; its calculation basis is undocumented
  (only its GL account resolution is, from batch 1).
- **`Authorization Maximum` vs `Authorization Number`** — whether incremental authorisation is
  supported (`W-030`) is implied by "Maximum" but never stated.
- **`Report Applied Customer Credits`** — surfaced as a related article; not in the Accounting
  section listing. Another possibly-unlisted report.
- **Remaining AVR articles** (multi-select picker windows, `GL Account Description Lookup`,
  `Report Analysis of Account Activity`, `Report Summarized Aging Receivables`,
  `Report Customer's Receivables Activity`, `View an Existing Account Budget`,
  `View Billed Purchase Orders By Vendor`, `View Completed Credit Requests`, `View a Vendor's
  Current/Historical Balances`, `Open Item Receivables History Detail Inquiry`) are lookup windows
  and summary variants of reports already dissected — see the closing note.

**3. Inferences (not quotable, kept out of section B)**
- `Cashed` most likely means the provider's funding cleared, given the funding-batch model; not stated.
- `Authorization Maximum` plus an expiry strongly suggests a revolving facility per order rather than
  a single-shot approval, which would support incremental authorisation; not stated.
- `House Finance Provider` appears to be a designated provider representing in-house paper within
  the third-party financing framework; not stated.

---

## I. Unknown unknowns (additions)

- **House Finance Provider** as a provider identity for in-house financing.
- **Authorization expiry and maximum** on financed orders.
- **Applied / Approved / Cashed** as three dated financing states.
- **Shared finance account numbers** across customers.
- **Provider-held customer identity** separate from STORIS's.
- **Authorized Users** on a provider account.
- **Signature archive with typed absence reasons.**
- **Merchant number** on electronic checks.
- **Per-aging-bucket collector quotas.**
- **Dynamic escapes** as a UI navigation concept.
- **Windows print path** for graphical archives, bypassing STORIS printing.

---

## J. Glossary (additions)

| STORIS term | Plain description |
|---|---|
| House Finance Provider | The provider identity through which in-house financed orders are processed |
| Applied / Approved / Cashed | The three dated states of a financing or financed-deposit transaction |
| Authorization Maximum | The ceiling on a financing authorisation, alongside its expiry |
| Usage Fee | Per-transaction financing fee; the GL hierarchy's worked example |
| Funding batch | The open/closed unit within which financing transactions resolve |
| `ON ACCNT` | Display sentinel for an on-account financing transaction |
| Credit history code | Per-cycle delinquency stamp, `C`/`0`–`6` |
| Dynamic escape | An inquiry reachable contextually from other screens |
| Electronic Check Inquiry | Archived electronic check detail including merchant and authorization numbers |
