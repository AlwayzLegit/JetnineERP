# 03 — The Settings Service

**131 settings screens** across System Control Settings (87), plus per-entity settings on customer, product,
vendor, location, group and user records. This is where STORIS's business rules actually live, and it is the
single highest-leverage subsystem in the whole ERP. Build it deliberately, once, before the routines that
read it.

This supersedes and expands `09-control-settings.md` in the Inventory handoff pack.

---

## SET-001 — Scope resolution

Resolution order, most specific wins:

```
SYSTEM → COMPANY → REGION → DISTRICT → LOCATION → PRODUCT_CATEGORY → GROUP → PRODUCT
                 → VENDOR → VENDOR_REGION → VENDOR_REMIT_TO
                 → TERMS_CODE → USER_GROUP → USER
```

Scopes the Inventory pack missed, all confirmed in this section: `COMPANY`, `REGION`, `VENDOR_REMIT_TO`,
`VENDOR_REGION`, `TERMS_CODE`, `PRODUCT_CATEGORY`. Not every setting supports every scope — the registry
declares which, and the resolver rejects a write to an unsupported scope rather than silently storing it.

**`REGION` vs `DISTRICT` is a real distinction, not a synonym** (`PRD-039`): district carries *sales*
settings (price, promo, spiff, rewards); region carries *supply* settings (stock levels, lead days,
reservation, landed freight and add-on costs).

**Every setting resolves through one function.** No caching that can go stale silently. No inline defaults
scattered through the codebase — a default is a value in the registry at `SYSTEM` scope.

## SET-002 — Typed values, and the tri-state trap

**The single most dangerous pattern in this entire system**: settings where **blank, zero, and a positive
value mean three different things**, and blank is frequently the destructive one. Roughly **80 fields**
exhibit it. Examples that would each cause a serious incident:

| Setting | blank | 0 | n |
|---|---|---|---|
| `Customer Retention Period __ Months` (`SCS-054`) | **discards all new order data on completion; purges customers, history, all completed orders, comments** | — | retain n months |
| `Number of Days History` (`SCS-036`, `SCS-084`) | **deletes history at next end-of-month** | history never created | retain n days |
| `Sales Analysis Retention` (`SCS-067`) | **collects no data at all** | collects no data | retain n |
| `Deposit Hold Back %` (`SCS-002`) | permissive | **stricter than blank** | n% |
| `Audit Data Retention Days` (`ACCT-004`) | **never purged** | — | purge after n |
| `Days Retain Interface Queue` (`SYS-031`) | default 30 | **purge immediately** | retain n |
| `Reserve Product (Auto Fill) Days` (`SCS-073`) | — | **disables JIT reservation entirely** | n days |
| `Auto Schedule Days` (`CFG-POS-AUTOSCHED`) | **auto transfers disabled** | today + 1 | n + today + 1 |
| `Maximum Linked Accounts` (`CUST-087`) | unlimited | none | n |

**Requirement:** our settings service **forbids implicit tri-state**. Every nullable setting must declare a
`null_means` value in the registry, rendered in the UI as an explicit third option with its consequence
spelled out ("Blank — never purge"). A blank that destroys data must be impossible to enter by accident:
require a typed confirmation naming what will be destroyed. `SCS-072`'s `Zero Cost Written Retail Percent`
is the one place STORIS gets 0-vs-null semantics right — everything else is a landmine.

## SET-003 — Setting classes

Every registry entry carries one or more class tags, which drive UI treatment and guard rails:

| Tag | Meaning | Count found | Treatment |
|---|---|---|---|
| `[TRISTATE]` | blank / 0 / n differ | ~80 | Explicit `null_means`; no bare empty input |
| `[DESTRUCTIVE]` | changing it deletes data | ~45 | Typed confirmation naming what dies; audit row; never in a bulk editor |
| `[IRREVERSIBLE]` | cannot be undone once data exists | ~10 | Two-person approval; blocked entirely after go-live without a migration plan |
| `[GUARDED]` | unsafe while certain state exists | ~24 | Precondition check names the blocking state (open batches, in-flight documents, live reservations) |
| `[CONFLICT]` | contradicts or duplicates another | ~22 | Cross-reference rendered inline; changing one surfaces the other |

Full tables are in `parts/control-settings-b.md` under `## Dangerous settings`.

### The ones that would hurt most

1. **`Use STORIS calculations when offline`** (`SCS-006`) — default **off** means **$0.00 sales tax** during
   a tax-provider outage. Silent. Ours must fail closed: block the sale, never zero the tax.
2. **Encryption checkboxes** (`SCS-038`, `SCS-086`) — unchecking **bulk-decrypts every stored SSN, DOB and
   driver's licence**. `Encrypt Customer Password` unchecked stores eSTORIS passwords **in plaintext**.
   Ours: encryption is not a setting. It is always on.
3. **`Group Payments by = None`** (`SCS-012`) — **purges all cash receipt records at the next end-of-day.**
4. **GL account structure and masks** (`SCS-037`) — install-time schema; changing it after data exists is
   unrecoverable.
5. **`Landed Cost Distribution`** (`SCS-016`) — rewrites the costing table, must run in an open fiscal
   period, and **declining the utility silently reverts**.
6. **`Only Mark As Resolved`** (`SCS-053`) — marks unsettled card transactions completed **without
   processing them**.
7. **`Allow Transmitted AP Bill Deletion`** (`SCS-080`) — deletes already-transmitted AP bills with no
   reversal; permanent ERP↔accounting divergence.
8. **`Delete Quotes When Lead is Closed`** (`SCS-068`) — EOD auto-archive silently deletes the customer's
   quotes **and layaways**.
9. **`Insurance Required`** (`SCS-064`) — retroactively forces credit insurance onto existing plans at next
   edit; `Master Plan` locks permanently once set.
10. **`Extended Security` off** (`SCS-038`) — see `SET-004`.

## SET-004 — Do not build a security kill-switch

**`Extended Security` is a single global flag that makes every per-user permission inert while leaving the
settings visibly configured.** Nothing looks wrong. Worse, `SYS-001` Access ECL — raw database shell — is
gated by it, so **with the kill-switch off, database shell access is ungated**.

We do not reproduce this. Permissions are always enforced. There is no global disable.

## SET-005 — Guarded changes

A `[GUARDED]` setting declares its preconditions in the registry, and the service evaluates them before
allowing a write, naming the blocking state. Known cases include: `CFG-COSTING-FREIGHTMODE` while open
receiving batches exist (`COST-033`); `CFG-INV-RESERVEBY` while live reservations exist (changing it
**unreserves live merchandise**); `Landed Cost Distribution` outside an open fiscal period; location
tracking while located inventory exists.

## SET-006 — Change audit

Every settings write records actor, timestamp, scope, old value, new value, and reason. Settings changes
move inventory and money; they must be as auditable as transactions. See `05-audit-and-observability.md` —
STORIS's own settings audit (`Track Settings Activity`) **deletes its records when you turn it off**, which
is precisely the failure mode we are guarding against.

## SET-007 — Registry as data

The registry is a declared artifact — id, label, scopes, type, enum values, default, `null_means`, class
tags, guard preconditions, cross-references, and the code paths that read it. Generate the settings UI and
the documentation from it. A setting that is not in the registry does not exist.

**Build note:** with 131 screens to port, a hand-written settings UI is not viable. The registry-driven
approach is not gold-plating here; it is the only way this ships.
