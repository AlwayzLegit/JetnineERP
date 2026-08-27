# LA Mattress ERP — STORIS System Administration Parity Handoff

**Audience:** Claude Code, working in the LA Mattress ERP repo.
**Source:** STORIS Help Center → *System Administration* section — **all 599 articles across 10
subsections**, dissected in full (captured 2026-08-27).
**Companion pack:** `storis-inventory-handoff` (Inventory & Purchasing). **This pack corrects that one in
thirteen places — see `01` before building anything.**

## What this pack is

The Inventory pack answered *what the business does*. This pack answers *how the system is configured,
secured, audited, and operated* — the substrate everything else runs on. It is where the business rules
actually live: **131 settings screens, 355 permission flags, a 48-step nightly batch, and the routines an
administrator executes.**

It is also, unavoidably, a catalogue of defects. STORIS is a mature system carrying decades of decisions,
and reading the reference screens rather than the FAQs surfaced a lot that we should deliberately **not**
reproduce. `07-anti-patterns.md` is that reject list, and it is as load-bearing as the specs.

## Read in this order

| # | File | Why |
|---|---|---|
| **1** | **`01-corrections-to-inventory-pack.md`** | **Thirteen corrections to the Inventory pack, six touching P0 requirements. One (`C2`, price resolution order) makes `ITEM-040` unsafe to implement as written.** Read before touching either pack. |
| 2 | `08-open-decisions.md` | 406 decision markers; the ~15 structural ones block work. Tier 1 alone could descope a third of the build. |
| 3 | `07-anti-patterns.md` | 23 STORIS designs we reject on purpose, with what we do instead. Cite these in code comments where we diverge. |
| 4 | `00-coverage-matrix.md` | All 599 articles → requirement IDs → audit column. The audit surface. |
| 5 | `02-permissions-catalog.md` | 355 permission flags across 10 domains. **Supersedes file `10` of the Inventory pack.** |
| 6 | `03-settings-service.md` | The settings service. Build this before the routines that read it. |
| 7 | `04-eod-eom-and-jobs.md` | What `EOD-001` actually is, and what our batch runner must do instead. |
| 8 | `05-audit-and-observability.md` | STORIS has no general audit log. `RPT-AUDIT` is our design, specified here. |
| 9 | `06-privacy-retention-consent.md` | PII, erasure, retention, consent. **Two items need counsel before build.** |
| 10 | `09-follow-up-fetches.md` | 18 referenced topics outside this section, ranked. |
| — | `parts/*.md` | The 599 article specs, 3.3 MB. Reference material — read the entry, not the file. |

## How to work this pack

1. **Answer the Tier 1 and Tier 2 decisions in `08`.** Several are descoping decisions worth dozens of
   articles; answering them first avoids building things LA Mattress will never use. `D6` (price resolution
   order) blocks a P0 requirement outright.
2. **Apply the `01` corrections to the Inventory pack** in the repo, so the two packs stop disagreeing.
3. **Audit before building.** Fill the Audit column in `00` with `DONE` / `PARTIAL` / `MISSING` / `N/A` plus
   a file path. `N/A` is a legitimate verdict here and a large share of rows will earn it — but record it as
   a decision rather than skipping the row.
4. **Build the substrate first**, in this order: settings service (`03`) → permissions (`02`) → audit
   stream (`05`) → batch runner (`04`). Everything else reads from these four. Building routines first and
   retrofitting the substrate is how this project fails.
5. **Then work the domain parts**, guided by the audit.

## Rules for this work

- **Stack-agnostic by design.** No framework, ORM, or language is named. Discover the repo's conventions and
  follow them. A repo architecture doc or CLAUDE.md overrides any structural suggestion here.
- **Parity of behavior, not of screens.** STORIS routine names appear so findings stay traceable — keep a
  `storis_ref` doc comment where we implement one, and cite `07-anti-patterns.md` where we deliberately
  don't.
- **`[DECISION NEEDED]` means stop.** Do not pick a default silently. There are 406 of them; they are
  cheap to ask about and expensive to guess at.
- **Source contradictions are flagged, not resolved.** Where two STORIS articles disagree (`08`, Tier 4),
  verify against the running system. Do not pick the one that is easier to build.

## Requirement ID scheme

| Prefix | Domain | Part file |
|---|---|---|
| `SYS-` | System administration routines, EOD/EOM, conversion, purges | `sysadmin-a/b` |
| `SCS-` | System control settings (87 screens) | `control-settings-a/b` |
| `SEC-` | Security and permissions (355 flags) | `user-security`, `02` |
| `USR-` | User, company, country, credit-approval settings | `user-settings-a/b` |
| `CUST-` | Customer master, AR, financing, payment types | `customer-settings-a/b/c` |
| `PRD-` | Product master, pricing, kits, warranties | `product-settings-a/b` |
| `VEND-` | Vendor master, purchasing, AP, EDI, warehouse | `vendor-settings-a/b` |
| `SAR-` | System administration views and reports | `views-reports` |
| `ACCT-` | Document archive and signature capture | `account-purge-import` |
| `PURGE-` | PII erasure | `account-purge-import` |
| `IMP-` | Customer merge import | `account-purge-import` |
| `SET-`, `JOB-`, `AUD-`, `PRIV-`, `AP-` | Cross-cutting designs introduced by this pack | `03`–`07` |

## The four findings that matter most

If you read nothing else:

1. **`C2` — price resolution order is contradicted by the authoritative screen.** The Inventory pack's
   `ITEM-040` cannot be implemented as written. `C1` also makes the price matrix factor **100-based, not a
   decimal** — an implementation built on the FAQ version is wrong by two orders of magnitude.
2. **STORIS has no general audit log** — five disjoint partial trails, one of which deletes its own records
   when disabled, and audit entries are localized prose rather than data. We are building `RPT-AUDIT`
   ourselves.
3. **No consent capture exists anywhere in 137 customer articles**, while the system actively drives
   outbound contact. TCPA exposure with the burden of proof on us.
4. **~80 settings where blank means "destroy data"**, and a global flag that silently disables all security
   while leaving it visibly configured. Both are why `03` and `07` exist.
