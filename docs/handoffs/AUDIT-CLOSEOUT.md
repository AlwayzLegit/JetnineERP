# STORIS Parity Audit — Closeout (v2, complete)

**Seven runs. 1,776 articles inventoried. 724 findings. Read-only throughout.**

The audit set out to answer one question, taken verbatim from `BROWSER-AGENT-HANDOFF.md`:

> "What has to happen, automatically, when a business event occurs — and what would break if it didn't?"

This document supersedes the six-run closeout (retained as `AUDIT-CLOSEOUT-v1-six-runs.md`). Each run
has its own summary and batch files; nothing here replaces them. What follows is what only becomes
visible across all seven.

**The help centre is now fully covered.** Every article in every section is either read or assigned to
a named family with a stated exclusion reason. No article was skipped silently.

---

## Coverage

| Run | Section | Articles | Batches | Findings |
|---|---|---|---|---|
| 01 | Accounting | 307 | 30 | 1–328 *(run-local)* |
| 02 | Merchandising | 129 | 11 | 145 *(run-local)* |
| 03 | Sales Processing | 405 | 16 | 1–164 |
| 04 | Inventory Management *(Logistics/Delivery)* | 280 | 11 | 165–290 |
| 05 | Customer Service | 56 | 2 | 291–315 |
| 06 | Getting Started | 56 | 2 | 316–336 |
| **07** | **System Administration** | **599** | **27** | **337–724** |
| | **Total** | **1,832 slots / ~1,776 distinct** | **99** | **724** |

Runs 03–07 share a continuous finding sequence (1–724). Runs 01 and 02 were numbered run-locally
before that convention was adopted.

**Run 07 produced 54% of the audit's findings from 34% of its articles.** That ratio is the headline
methodological result: **the wiring lives in the configuration, not in the procedures.**

---

## The ten things that matter most

The six-run closeout's ten still stand. Run 07 confirmed all of them, corrected two, and added five
more. Both sets are given.

### From runs 01–06 — confirmed and, where noted, amended

**1. Margin is provisional until somebody works a queue.** Sales orders are written at average cost;
exact cost restates them and writes to `BTA`. Active cost exceptions block the physical inventory
freeze. **Run 07 adds three things:** every inventory event writes costed auditing data (batch 22
F656) — the substrate; **one purge routine deletes all of it by default** (F655); and **two more
mechanisms derive money from that provisional cost** — cost-plus pricing (batch 19 F609) and
margin-banded commission (batch 20 F633), neither documented as restating.
**Amendment:** bulk products cost out at **exact FIFO, not average** (batch 24 F689). Margin is not
provisional for that class.

**2. Order-to-piece binding is deliberately loose.** Unchanged, and reinforced: **bulk products have
no piece identity at all** (batch 24 F689) and are therefore outside As-Is, twilight and serial
tracking entirely.

**3. As-Is is the disposition hub of the inventory model.** Confirmed and extended: **`Twilight`,
finally defined** (batch 24 F680), is automatic time-decay markdown *on As-Is stock*, driven by
`Generate Daily Reports` with a group → category → global scheme hierarchy. As-Is is not just where
damaged goods go — it is where they are **priced down on a clock**.

**4. Twenty-two credit hold codes, and the release is a batch.** Confirmed. Run 07 sourced **four of
the twenty-two**: `E1` (exchange), `F3` (finance declined), `F4` (finance provider association),
`D2` (minimum deposit). It also found a **second release model** — `Re-evaluate D2 Credit Hold When
Order is Saved` (batch 25 F700) clears on save rather than at End of Day.

**5. Access control is one convention plus five kinds.** **Amended, substantially.** There are
**thirteen distinct mechanisms**, not six. Run 07 added: Report Builder file security · Report
Builder field security · purchase-status suppression · pairwise transfer security · value-altering
pad days · screen action permissions · report-author access · location restrictions · menu access ·
GL dimensional restriction.
**And one has inverted polarity:** Report Builder security is **deny-by-default** (batch 16 F540).
The six-run inference that `File Security Groups` "overrides the other six" is **retired** — it
overrides nothing and is scoped to Report Builder alone.

**6. Licensing changes business behaviour, not just features.** Confirmed, and the model is larger:
**three shapes** — site counts, true feature toggles (batch 15 F538), and **metered monthly
consumption** (batch 17 F557) — and **two levels deep**, module plus submodule.

**7. Printing is a transactional interface.** Confirmed and extended: **twilight repricing queues a
label per location** (batch 24 F682), so the Label Queue depth measures how far the shop floor has
drifted from the database.

**8. Detect and report, don't enforce.** Confirmed many times over, and run 07 found a **weaker third
variant: neither detect nor report.** Integration credentials are explicitly **not validated**
(batch 17 F563); transfer schemas may violate location and regional restrictions with a warning
(batch 15 F519).

**9. Composition reaches the core.** Confirmed and extended: **menu items can be custom** (batch 26
F711), **five settings routines have no menu path at all**, and **settings fields name subroutines**
(batch 22 F657) and **select vendor-written tax logic** (batch 19 F614).

**10. The audit trail is prose.** **Amended — it is better than the six-run view suggested, and worse
in a specific place.** Run 07 found structured auditing where it matters most: decryption access
including *denied* attempts, with requester and grantor (batch 26 F710); before/after field values on
orders (batch 27 F719); a purge that writes two complementary logs (batch 22 F652); signature
ceremonies audited *even when cancelled* (batch 26 F716).
**But both transaction and settings auditing are opt-in and off by default** (batch 16 F561, batch 27
F719), and **six of seven destructive routines document no audit trail at all** (batch 22 F666).

### New from run 07

**11. STORIS resolves hierarchies once and stores the answer — twelve documented instances.** Tax onto
the order, commission onto order items, kit prices, fill days, stock levels, security grants, Metro 2
codes, plan promotions, delivery charges, product group, closed dates. **A rebuild that resolves live
will diverge on every settings change** — and in at least one case (revolving plan promotions,
batch 21 F646) resolve-once is **legally correct**, not incidental.

**12. The batch calendar carries thirteen End-of-Day responsibilities, with a phantom pool draining
queues by day so End of Day has less to do.** Order completion itself is queued, retried and can fail
(batch 22 F659) — and completion is when revenue is earned and tax is owed (batch 19 F615). **Seven
scheduled processes were found by encounter; there is still no catalogue.**

**13. Fall-through is the house idiom, with exactly one documented inversion.** *Blank defers, zero
forbids* — 17+ instances, stated as operating procedure (batch 14 F525). Chains run from three rungs
to **ten** (purchase lead days, topped by an external web service). **One inversion: on zip Regional
Settings a blank field overrides a populated one** (batch 19 F620). Clear one route code and you clear
all six.

**14. Compliance obligations are embedded, not bolted on.** Metro 2 credit reporting to CDIA exhibits ·
consumer credit terms held **per state** · a right-to-erasure routine that pseudonymises with nine
blocking conditions · a **state solicitation prohibition enforced at order entry by a vendor-locked
field** · a 12-month audit retention floor. **The rebuild's compliance surface is larger than the
feature list suggests.**

**15. Vendor-owned configuration is real, unmarked, and sometimes legally binding.** Five documented
regions where fields are STORIS-maintained — and STORIS marks them only sometimes. **An unmarked field
is not evidence it is site-editable.** Worse: **STORIS ships per-site custom code as configuration**
(alternate tax calculation codes, phantom subroutine names). If LA Mattress has any set, that logic
cannot be recovered from documentation.

---

## What we would get wrong, in one paragraph

We would build a system that is correct about data and wrong about timing, matter and polarity. We
would release credit holds at approval, book margin at the sale, and post returns when entered — three
obviously-correct choices, three breaks with parity. We would bind orders to serial numbers early and
break picking, damage handling and counting at once. We would treat As-Is as a discount flag and have
nowhere to put damaged goods, vendor returns, write-offs **or the markdown clock that runs on them**.
We would resolve every hierarchy live and quietly restate history on every settings change. We would
read the permission tables uniformly and **invert Report Builder security so it fails open**. We would
implement plan eligibility as a database constraint and break the nightly balance transfer that is
designed to bypass it. And we would model erasure against an account rather than a person, and satisfy
a privacy request while leaving the same person fully identified on three other records.

---

## Recommended next steps

**Do these first — they are cheap and they convert documented behaviour into confirmed local fact.**

1. **Run three reports and keep the output.** `Report on User Security` (every user and group × ~360
   settings) · `Report on Menu Access` (groups × every menu item) · `Staff Location Restriction
   Review`. Together they are the entire configured access model, and no amount of reading
   substitutes for them.
2. **Download the STORIS data dictionary** — the Excel listing every Report Builder source file and
   field, behind the customer web-site login. **The highest-value artefact named in the audit**: it
   is the schema this audit reconstructed one screen at a time.
3. **Answer six configuration questions**: which payment gateway · which platform (Windows / AIX /
   SCO / HP) · which UniData version · is Third-Party Accounting active · how many users have
   `Standard Files` checked · is `When an EOD/EOM Processing Error is Reported` enabled.
4. **Read both audit opt-in lists** — `Track Settings Activity` and `Track Processing Activity`.
   Whatever is not listed has no history, and that gap cannot be filled retroactively.

**Then ask STORIS five questions the documentation genuinely does not answer:**

5. User-versus-group precedence for the ~360 module permissions.
6. Landed add-on cost precedence across its four configuration levels — this feeds margin.
7. Which Vendor EDI fields are STORIS-maintained, and whether any alternate tax calculation codes are
   set for this site.
8. The putaway tie-break between velocity and storage category.
9. **`Velocity` itself**, and the five remaining undefined terms: fly-by fulfillment · `Float Label` ·
   `Ship Direct` (on a transfer) · `CFO Fields` · `Bypass Interim` · `Times per Day` · dollars-only
   adjustment.

**Then run five parity tests against live STORIS** — all observable, none needing the vendor:

10. Does a cost-plus matrix price restate when the cost does? Does margin-banded commission?
11. Payment history code `0` — "current, no balance" or "cycle never ran"?
12. Is the auto-fill additive term applied once or twice?
13. Delivery charge tables — flat-per-tier or rate-times-quantity?
14. What protects cost on *regular* STORIS reports, given the `Cost` classification is inert outside
    Report Builder?

**One further reading run is worth doing:**

15. **The Configurator** — ~14 articles, a third pricing system with its own overrides and a `graded
    price` concept (batch 19 F608). It is the largest coherent subsystem the audit did not read, and
    for a furniture retailer it is likely to matter.

---

## Deliverables

```
run01-accounting/                    run05-customer-service/
run02-merchandising/                 run06-getting-started/
run03-sales-processing/              run07-system-administration/   ← 27 batches + summary
run04-logistics-delivery/            handoffs/HANDOFF-SALES-SECURITY.md
AUDIT-CLOSEOUT.md            (this file, v2)
AUDIT-CLOSEOUT-v1-six-runs.md
REMAINING-WORK-REPORT.md
```

---

*Seven runs complete. Method per `BROWSER-AGENT-HANDOFF.md` and `KICKOFF-PROMPT.md`; read-only
throughout; every finding carries a verbatim quote, and everything that does not is recorded as an
inference. Self-corrections were recorded explicitly rather than quietly updated — there are sixteen
of them in run 07 alone, listed in `RUN-07-SYSTEM-ADMINISTRATION-SUMMARY.md` §E.*
