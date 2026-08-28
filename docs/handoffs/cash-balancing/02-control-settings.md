# 02 — Cash Balancing Control Settings

**STORIS path:** `System Administration > System Settings > Customer System Settings > Cash Balancing Control Settings`

This screen is the switchboard for the entire feature. Build it before the
reports — nearly every rule in `03` is conditional on something here. It also
sets up the eBridge **Pre-Authorization** feature.

Some fields are marked in STORIS as vendor-locked (STORIS personnel only). In
an in-house ERP there is no vendor, so treat "locked" as **"restricted to a
system-administrator role, changes audited"** rather than "omit".

---

## Field reference

### `Cash Receipt Purge Days` — integer
Days after the associated cash drawers have been **balanced** that cash receipt
records remain before the End of Day process purges them.

- `Extended Cash Balancing` **on** → records survive until the full balancing
  process has completed **and** this many days have passed.
- `Extended Cash Balancing` **off** → this day count alone governs.

> **NOTE (destructive):** if `Group Payments by = None`, the Cash Balancing
> feature is inactive and **all existing cash receipt records purge** during
> End of Day.

---

### `Extended Cash Balancing` — boolean
Indicates full cash balancing is in use.

- When checked, cash drawers **must be balanced before purging**.
- When checked, `Group Payments by`, `Maximum Over/Short`, and
  `Number of Tries` become **mandatory**.

---

### `Extended Cash Balancing Report` — boolean
Selects the extended variant of the cash-balancing report. The extended
version adds, **per transaction**:

- customer's name
- cash drawer reference number
- manager's initials (only where an override was necessary)

This is the field `Report Cash Drawer Balancing Totals` reads to decide its
output format. See `03`.

---

### `Include Written Financing` — boolean
Include written-financing transactions when balancing a cash drawer.

### `Include Financed Deposits` — boolean
Include financed deposits when balancing a cash drawer.

---

### `Open Cash Drawer for Cash Only` — boolean
Controls the physical drawer-kick.

- **Checked** → drawer opens for cash transactions only.
- **Unchecked** → drawer also opens for: credit card, gift card, check,
  miscellaneous payment.

> **NOTE:** the drawer does **not** open for debit cards or
> electronically-converted checks, regardless of this setting.

---

## eBridge / WEB block

> Active only if the eBridge module is active.

Enabling the **Pre-Authorization** feature is an ordered sequence — enforce the
order, and disable downstream fields until upstream ones are satisfied:

1. Set `Group Payments by = Drawer`.
2. Populate the `Drawer` field below.
3. Then, and only then, check `Use Auth/Capture for Credit Cards` in **Web
   Control Settings**. That web setting is unavailable until steps 1–2 are done.

### `Cashier` — optional, lookup
Associates eBridge web transactions with a specific cashier (user) ID.
Selectable from a lookup list. Not required.

### `Drawer` — lookup
Associates eBridge web transactions with a specific cash drawer ID.
Active only when `Balance By = Drawer`. **Required** for Pre-Authorization.

---

## Restricted (vendor-locked in STORIS)

### `Prompt For` — enum *(LOCKED)*
Restricts cash-balancing prompts to either:

- **All** payment types that exist in the database
- **Just those Entered** during the day

Source recommends **Just those Entered**, for ease of entry and balancing.
Make that the default.

---

### `Group Payments by` — enum *(LOCKED)* — **mandatory when Extended is on**
The grouping key for balancing. Options:

| Value | Meaning |
|---|---|
| `None` | Cash balancing is **not** in use. (Triggers the purge in `Cash Receipt Purge Days`.) |
| `Cashier` | Balancing performed by cashier. |
| `Store` | Balancing performed by store. |
| `Drawer` | Users must **log in with a cash drawer** before being allowed to enter a payment. Valid whether Extended is on or off. |

When Extended is on, the source recommends Cashier, Store, or Drawer (i.e.
anything but None).

> Pre-Authorization requires `Drawer`.

**[RULE 2.1] Cashier-mode identification prompt.** With `Cashier` selected,
entering `Enter a Customer Payment` raises an Access Control Window prompting
for user **Initials and Password**. This is **identification only** — no
security check is performed, and the `Reason for Override` prompt is **not**
active. Do not reuse the authorization code path here; it is a different
interaction with the same shape.

**[RULE 2.2] Cashier-mode conflict.** The `Cashier` option is **unavailable**
if `Verify User ID During Entry` is active in any of:

- Point of Sale Control Settings
- Quick Sale Control Settings
- Service Control Settings

Enforce this as a validation, not a silent filter — tell the admin which of the
three is blocking it.

---

### `Next Reference Number` — integer
The number the system uses when generating cash-balancing batches. Incremented
by one on each batch generated.

---

### `Maximum Over/Short` — currency — **mandatory when Extended is on**
The amount by which operator-entered **CASH** totals may be over or under the
system-entered **CASH** totals. Referenced by `Balance a Cash Drawer`.

- Difference **within** the maximum → system accepts the totals as *balanced*.
- Difference **exceeds** the maximum → out-of-balance warning.

---

### `Number of Tries` — integer — **mandatory when Extended is on**
Works with `Post to Suspense`. The number of times a user may save-and-exit an
unbalanced batch (via `Balance a Cash Drawer` / the Blind Cash Balancing
screen) before the drawer is suspended. On reaching the limit, the process
exits the batch, totals are written to a suspense file, and the drawer can be
corrected/approved only via **Balance Approval by Manager**.

> **NOTE:** if `Post to Suspense` is unchecked, this value is **ignored**.

---

### `Post to Suspense` — boolean *(LOCKED)* — default **checked**
Pairs with `Number of Tries`.

- **Checked (default):** unbalanced save-and-exit is capped at `Number of
  Tries`; on reaching it the screen exits and the drawer is suspended, totals
  going to the suspense file, resolvable only via Balance Approval by Manager.
- **Unchecked (not recommended):** the drawer must be balanced before the user
  can save and exit the Blind Cash Balancing screen at all.

---

### `Excluded Payment Types` — optional, single or multi-select
Excludes one or more payment types from cash balancing. Accepts a single
payment-type code, or a multi-select lookup for several.

Effects of exclusion:

- excluded types are **not displayed** in the grid of the Blind Cash Balancing
  screen or the Balance Approval by Manager screen
- excluded types **do not appear** on `Report Cash Drawer Balancing Totals`

> **NOTE (cross-module):** if **Cash** is excluded here, the
> `Daily Maximum Cash Refund Per Customer` setting in **Accounts Receivable
> Control Settings** is **negated**, even if an amount exists in that field.
> This is a genuine cross-module coupling — surface it as a warning on save.

---

## Dependency graph (implement as validation)

```
Extended Cash Balancing = on
   ⇒ require Group Payments by
   ⇒ require Maximum Over/Short
   ⇒ require Number of Tries
   ⇒ drawers must balance before purge

Group Payments by = None
   ⇒ feature inactive
   ⇒ End of Day purges ALL cash receipt records   ← destructive, confirm

Group Payments by = Drawer
   ⇒ enables eBridge Drawer field
   ⇒ prerequisite for Pre-Authorization
   ⇒ users must log in with a drawer to take payment

Group Payments by = Cashier
   ⇒ blocked if Verify User ID During Entry is on in POS / Quick Sale / Service
   ⇒ payment entry raises identification-only Initials+Password prompt

Post to Suspense = off
   ⇒ Number of Tries ignored
   ⇒ save-and-exit while unbalanced is impossible

Excluded Payment Types contains Cash
   ⇒ AR "Daily Maximum Cash Refund Per Customer" is negated
```
