# 08 — Open Decisions

**406 `[DECISION NEEDED]` markers** across the 16 part files. Most are local and can be answered while
building. The ones below are **structural** — they change what gets built, or they block a P0 requirement.
Answer these before Claude Code writes code against this pack.

Per-file decision counts: `control-settings-a` 54 · `control-settings-b` 48 · `customer-settings-a` 37 ·
`customer-settings-b` 33 · `customer-settings-c` 31 · `vendor-settings-a` 26 · `vendor-settings-b` 26 ·
`product-settings-a` 24 · `user-settings-a` 23 · `sysadmin-a` 22 · `sysadmin-b` 22 ·
`user-settings-b` 15 · `product-settings-b` 14 · `views-reports` 14 · `account-purge-import` 11 ·
`user-security` 6.

---

## Tier 1 — descoping decisions (each removes dozens of articles from the build)

### D1. Do we originate our own consumer credit?
**Descopes ~50 permission flags and ~9–12 settings screens if no.**
In-house installment and revolving lending drives `SCS-001`, `SCS-025`, `SCS-028`, `SCS-042`, `SCS-064`,
`CUST-081`, `CUST-087`, `CUST-090`, `CUST-113`, `CUST-114`, plus the installment credit approval rules in
`USR-*`. If LA Mattress uses third-party financing only (Synchrony, Acima), `SCS-036` becomes the priority
instead and this entire body of work becomes reference-only.
*Recommendation: confirm third-party only. It is the single biggest scope reduction available.*

### D2. Multi-currency and foreign processing — in or out?
**Descopes country/currency/FX, `Bank to Print Checks by Currency`, and a class of costing complexity.**
STORIS conflates country + currency + FX + address masks, forcing synthetic pseudo-countries (`CHNUS`), and
stores FX rates as single mutable fields with no history.
*Recommendation from two agents: do not build multi-currency.*

### D3. Multi-company / multi-entity?
`COMPANY` scope exists throughout. With multi-company on, non-default companies get GL fields
**auto-copied from the default company and locked** — the copy-down anti-pattern again (`AP-02`).
Answer determines whether `COMPANY` enters the settings resolver at all.

### D4. Region and District — do we adopt both?
They are **not synonyms**: district carries sales settings, region carries supply settings (`C3`). Adopting
neither, one, or both changes the scope resolver, the pricing model, and the transfer routing model.

### D5. Time clock, service/repair, and delivery routing — in scope?
Each pulls a substantial article set. Routing in particular has a third-party integration that writes
customer addresses back into the ERP (`SYS-047`).

## Tier 2 — blocking a P0 requirement

### D6. **Price resolution order** — `C2`
`PRD-039` says the matrix is step 1; the FAQ-derived `ITEM-040` says steps 3–4. **The resolver cannot be
built until this is settled against the live system.** Highest-priority item in this pack.

### D7. **Customer price category assignment** — `C13` note
The field has **no default, no derivation and no validation** anywhere in 137 articles, yet discount
eligibility gates on it. We must design its assignment rules ourselves. Model on `CUST-113` Revolving
Classification, which does have documented rules.

### D8. **Erasure vs warranty retention** — `PRIV-002`
Direct conflict with `MIG-030`. Four options laid out in `06-privacy-retention-consent.md`. **Needs counsel.**

### D9. **Consent model** — `PRIV-003`
No consent capture exists anywhere. TCPA exposure is $500–$1,500 per text with the burden of proof on us,
and the system actively drives outbound contact today. **Needs counsel.** The proposed append-only
`consent_event` model is in `PRIV-010`.

### D10. Costing method
Still open from the Inventory pack (`COST-010`), and now more urgent: `SCS-016` `Landed Cost Distribution`
rewrites the costing table and must run in an open fiscal period.

### D11. GL account structure and masks
`SCS-037` is install-time schema — **changing it after data exists is unrecoverable**. Decide before the
first migration load, not after.

### D12. Native GL vs third-party accounting
`SCS-080` and `PO-104` both branch on it. `PO-102`'s auto-close behavior depends on it. Decide early.

### D13. Reservation method
`CFG-INV-RESERVEBY` is a two-field pair with three valid combinations (`C10`). *Recommendation:
**Order Date + Immediate** — the only combination compatible with both ATP (`STK-053`) and prefer-PO.*

### D14. Authentication
*Recommendation: IdP / SSO.* Failing that, modern password rules — never STORIS's uppercase-only,
length-capped policy (`PRIV-007`).

### D15. Tax engine
`CUST-119` has no certificate, expiry or jurisdiction scoping; `CUST-124` hints at resale licences.
Exemption handling is almost certainly delegated to Avalara or Vertex — confirm, because `AP-12`
(fail-closed on outage) depends on how we integrate it.

## Tier 3 — needs legal review

FCRA / ECOA retention · Rule of 78 · TCPA consent (`D9`) · bankruptcy legal-code effects · Metro 2 credit
reporting (`CUST-090`, where `Compliance Condition` is "sticky" until a removal code is sent) · data
retention policy generally (`PRIV-008`) · erasure (`D8`).

## Tier 4 — source defects to resolve against the live system

The documentation itself is wrong or self-contradictory in these places. Verify in the running system
rather than trusting either version:

- `Automatically Hold POs` — hold-created-POs vs suppress-and-worklist (`C6`).
- Password max length — **10 vs 50**, two articles disagree (`PRIV-007`).
- `CUST-042` vs `CUST-043` — whether debit PANs are stored.
- `SAR-022` orientation — rows vs columns transposed between intro and field note.
- `SAR-038` Access tab — contradicts itself on whether Regional Processing is required.
- `CUST-114` add-on formula — contradicts its own worked examples.
- Three articles state **three different scope precedences** (`vendor-settings-a`).
- Three conflicting Live/Learn policies across conversion routines (`sysadmin-a`).
- `SCS-038` `Active Add-Ons` tab — referenced by three other articles, undocumented, and that article's own
  Access path is wrong.
- Stub articles with empty accordions, missing enum values: `CUST-051`, `CUST-059`, `CUST-060`,
  `Create a User Group` (recovered from its read-only twin), plus 11 articles with an empty `Access` block.
