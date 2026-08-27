# 08 — Acceptance Criteria

Written Given/When/Then, framework-agnostic. Each maps to a **[RULE]** in
`01`–`07`. Port them into whatever test harness the repo already uses; keep the
rule IDs in the test names so coverage stays traceable.

---

## Posting & dates

**AC-1 — back-dated payment posts to drawer by system date** *(RULE 3.1 / 3.7)*
- **Given** a payment entered on 7/12 and back-dated to 7/10
- **When** Report Cash Drawer Balancing Totals is run for 7/12
- **Then** the payment appears
- **And** when run for 7/10, it does not

**AC-2 — back-dated payment posts to ledgers by transaction date** *(RULE 3.2)*
- **Given** the same payment
- **Then** the customer account shows it on 7/10
- **And** the GL account shows it on 7/10

**AC-3 — closed drawer cannot be written to** *(RULE 3.1 rationale)*
- **Given** a drawer balanced and closed for 7/10
- **When** a payment is entered on 7/12 back-dated to 7/10
- **Then** the closed 7/10 drawer is not modified

**AC-4 — both dates visible in the register** *(RULE 4.6)*
- **Given** the same payment
- **When** Report Daily Receipts Register is run with `Date Type = System Date`
- **Then** it falls on 7/12
- **And** with `Date Type = Transaction Date` it falls on 7/10

---

## Balancing

**AC-5 — within tolerance balances** *(RULE 1.1)*
- **Given** `Maximum Over/Short = 5.00`
- **When** the operator counts cash 3.00 under the system cash total
- **Then** the batch is accepted as balanced, with no warning

**AC-6 — outside tolerance warns** *(RULE 1.1)*
- **Given** the same setting
- **When** the operator counts 7.00 under
- **Then** an out-of-balance warning is raised and the batch is not balanced

**AC-7 — tolerance applies to CASH only** *(RULE 1.1)*
- **Given** a variance of 0.00 on cash and 50.00 on credit card
- **Then** the tolerance check passes

**AC-8 — retry budget suspends the drawer** *(RULE 1.2)*
- **Given** `Post to Suspense = on`, `Number of Tries = 3`
- **When** the operator saves and exits an unbalanced batch three times
- **Then** on the third the screen exits, the batch is SUSPENDED, and its totals
  are written to suspense
- **And** it can be resolved only via Balance Approval by Manager

**AC-9 — no-suspense mode blocks exit** *(RULE 1.3)*
- **Given** `Post to Suspense = off`, `Number of Tries = 3`
- **When** the operator attempts to save and exit an unbalanced batch
- **Then** the exit is refused, and `Number of Tries` has no effect

**AC-10 — blind count** *(RULE 1.4)*
- **When** the balancing screen opens
- **Then** the system cash total is not displayed or pre-filled

**AC-11 — reference numbers increment** *(I2)*
- **When** three batches are generated from `Next Reference Number = 100`
- **Then** they carry 100, 101, 102 and the setting reads 103

---

## Control settings

**AC-12 — Extended makes three fields mandatory** *(RULE from `02`)*
- **When** `Extended Cash Balancing` is checked and saved with any of
  `Group Payments by`, `Maximum Over/Short`, `Number of Tries` empty
- **Then** the save is rejected, naming the missing field

**AC-13 — Group Payments by = None is destructive and confirmed** *(RULE 4.3)*
- **When** an admin sets `Group Payments by = None`
- **Then** an explicit confirmation is required, stating that all existing cash
  receipt records will purge at End of Day

**AC-14 — Cashier mode blocked by Verify User ID During Entry** *(RULE 2.2)*
- **Given** `Verify User ID During Entry` is on in Quick Sale Control Settings
- **When** an admin selects `Group Payments by = Cashier`
- **Then** the selection is rejected, naming Quick Sale Control Settings

**AC-15 — Cashier prompt is identification only** *(RULE 2.1)*
- **Given** `Group Payments by = Cashier`
- **When** a user enters the payment routine
- **Then** an Initials + Password prompt appears
- **And** no security check is performed and no Reason for Override is requested

**AC-16 — Pre-Auth ordering enforced**
- **When** an admin attempts `Use Auth/Capture for Credit Cards` in Web Control
  Settings before `Group Payments by = Drawer` and a populated eBridge `Drawer`
- **Then** the setting is unavailable

**AC-17 — drawer-kick matrix** *(RULE 3.5)*
- **Given** `Open Cash Drawer for Cash Only = on` → the drawer opens for cash
  only
- **Given** it is `off` → the drawer also opens for credit card, gift card,
  check, and misc payment
- **In both cases** → the drawer does **not** open for debit card or EC check

**AC-18 — excluding Cash negates the AR refund cap** *(RULE from `02`)*
- **Given** `Daily Maximum Cash Refund Per Customer = 200.00` in AR Control
  Settings
- **When** `Cash` is added to `Excluded Payment Types`
- **Then** the cap no longer applies, and a warning is shown on save

---

## Purge & retention

**AC-19 — purge clock starts at balance, not at receipt** *(RULE 4.1)*
- **Given** `Cash Receipt Purge Days = 7` and a receipt from day 0 whose drawer
  balances on day 10
- **Then** End of Day purges it on day 17, not day 7

**AC-20 — Extended blocks purge of unbalanced drawers** *(RULE 4.2)*
- **Given** `Extended Cash Balancing = on` and an unbalanced drawer past the
  purge-day count
- **Then** its cash balancing information is not purged

**AC-21 — two independent retention clocks** *(RULE 4.4 / 4.7)*
- **Given** `Cash Receipt Purge Days` elapsed but
  `Daily Receipts Retention Months` not elapsed
- **Then** the cash receipt records purge at End of Day
- **And** the daily-detail rows survive until Generate Monthly Reports

---

## Report: Cash Drawer Balancing Totals

**AC-22 — CUS activates Balance Date** *(RULE 6.2)*
- `Date Code = CUS` → `Balance Date` editable, calendar available
- any other code → `Balance Date` populated and read-only

**AC-23 — Balance By drives field activation** *(field activation matrix, `03`)*
- `drawer` → `Drawer` active; `Operator`, `Store` inactive
- `cashier` → `Operator` active; `Drawer` inactive
- `store` → `Store` active (if `District` blank); `Drawer`, `Operator` inactive

**AC-24 — Store/District mutual exclusion** *(RULE 3.9 / 4.9)*
- entering a `Store` deactivates `District`, and vice versa, immediately — not
  on submit

**AC-25 — blank means all** *(RULE 6.5)*
- `Drawer`, `Operator`, `Store`, `District` all blank → the report covers all
  drawers, operators, locations, and districts

**AC-26 — drawer reference overrides everything** *(RULE 3.10)*
- **When** a valid `Balanced Drawer Reference` is entered
- **Then** every other Drawer field on the screen is deactivated
- **And** the report returns **all** postings to that drawer **regardless of
  posting date**, including manager overrides made on other dates
- **And** the same holds for `Unbalanced Drawer Reference`

**AC-27 — time window in 24-hour format**
- `Starting Time = 15:00` restricts to payments from 3:00 P.M. onward
- a 12-hour value such as `3:00 PM` is rejected

**AC-28 — store totals plus grand total** *(RULE 3.2)*
- `Balance By = store` across three stores → three store totals **and** a grand
  total

**AC-29 — payment-type breakout always present** *(RULE 3.1)*

**AC-30 — EC checks are a separate total** *(RULE 3.4)*
- a batch with one EC check and one manual check → two distinct check totals

**AC-31 — extended format adds three columns** *(RULE 3.3)*
- `Extended Cash Balancing Report = on` → each transaction carries customer
  name, cash drawer reference number, and manager initials where an override
  occurred
- `= off` → none of the three appear

**AC-32 — excluded payment types are absent** *(RULE 3.5 / I3)*
- a payment type in `Excluded Payment Types` does not appear on the report, is
  absent from the Blind Cash Balancing and Balance Approval grids, **and** is
  still present in the underlying data and in the Daily Receipts Register

**AC-33 — credit-card refund on a customer return is absent** *(RULE 3.6)*
- a non-drop-off customer return with a credit-card refund → does not appear,
  and is not posted to cash balancing at entry
- a **customer drop-off** return → does post at entry
- a non-drop-off return posts when the return is **completed**

---

## Report: Daily Receipts Register

**AC-34 — tender scope** *(RULE 4.1–4.3)*
- cash, check, and bank-card receipts appear
- third-party financing receipts appear
- revolving deposits and revolving financing do **not**

**AC-35 — transaction type and class** *(from `04`)*
- each row carries type ∈ {payment, deposit, on-account} and class ∈ {cash,
  charge, guaranteed check, electronic check, manual check}

**AC-36 — daily-reports mode windows on last run** *(RULE 4.5)*
- run via Generate Daily Reports → covers transactions since the last
  daily-reports process, ignoring any date-range criteria

**AC-37 — Basic PDF splits into four items** *(RULE 4.8)*
- output = Basic PDF → detail, receivables recap by store, recap by bank, and
  G/L recap generate as separate items
- only the detail item ends with a legend

---

## Report: Cash Requirements

**AC-38 — sort/total hierarchy** *(RULE 5.1)*
- totals break after each vendor, then bank, then company

**AC-39 — status column carries the AP bill status code** *(RULE 5.2)*
- a bill on Hold → `H` in the status column between Type and Invoice Number

**AC-40 — Past Due population** *(RULE 5.3)*
- invoice date after the As-Of date → `Past Due` populated
- reporting off Anticipated Pay Date or Discount Date earlier than the As-Of
  date → invoice date is used to decide pay/past-due

**AC-41 — Multi-Company behavior**
- Multi-Company Processing on → `Company` accepts one or more; blank = all
- off → the default company shows and the field is inactive

**AC-42 — aging defaults inherit from Payables Control Settings**
- `Aging Method` defaults from `Bill Aging Method`
- `Aging Days` defaults from `Bill Aging Days`

**AC-43 — Pending Bills option is gated on the checkbox**
- unchecked → the All / Pay Before Receipt / Don't Pay Before Receipt option is
  inactive

**AC-44 — run-time options print on the last page** *(RULE 5.4)*

---

## Regional Processing

**AC-45 — activation precondition** *(RULE 6.6)*
- a warehouse location without a District or Region → activation fails with the
  documented message

**AC-46 — inter-region transfer bar is absolute** *(RULE 6.7)*
- a user with full unrestricted access, and a user with list access spanning two
  regions, are **both** prevented from creating an inter-region transfer

**AC-47 — reports are user-scoped** *(RULE 6.9)*
- two users with different location restrictions run identical criteria → they
  get different row sets
- and no cached result crosses between them

**AC-48 — four independent restriction areas**
- sales entry, sales inquiry/reports, inventory entry, inventory
  inquiry/reports each honor their own mode from {No Restrictions, Logon
  Location, District, Location List}
- sales areas key on District, inventory areas on Region

**AC-49 — known-number override** *(RULE 6.8)*
- decision-dependent: assert whichever behavior `09` resolves, and assert it
  explicitly rather than leaving it untested

---

## Switch User Location

**AC-50 — drawer unassigned on location switch** *(RULE 7.1)*
- a user holding a drawer switches location → the drawer is unassigned, and the
  user is informed

**AC-51 — terminal unassigned when invalid** *(RULE 7.2)*

**AC-52 — printer falls back to screen** *(RULE 7.3)*
- invalid printer at the new location → printer unassigned and output
  designation becomes screen output
- **and** `Send Output to` on any open report screen reflects the change

**AC-53 — Input Processing notified** *(RULE 7.4)*

---

## Change Details

**AC-54 — zero-sum enforcement** *(RULE 7.6)*
- increasing one transaction's `Remaining $` without a matching decrease → save
  is refused
- with a matching decrease → save succeeds and the plan balance is unchanged

**AC-55 — Promotion Expires gated on Interest Waived**
- `Interest Waived $` empty → `Promotion Expires` inactive

**AC-56 — MMP change recalculates the plan MMP**
- Per Sales Order plan, `MMP $` changed → the plan MMP is recalculated
- non–Per Sales Order plan → `MMP $` inactive

**AC-57 — expired no-payments promotion rolls into MMP at cycle**

**AC-58 — save routes through GL Distribution when permitted** *(RULE 7.7)*
- user with GL access → GL Distribution screen appears before commit
- user without → commit proceeds directly
- both produce identical postings

---

## Credit Review Comments

**AC-59 — auto-comment on each of five events** *(RULE 7.5)*
- application entered / changed / reviewed, credit report reviewed, credit
  report printed → each writes a comments record

**AC-60 — Export Path inactive in this routine**
