# HANDOFF — Jetnine ERP / LA Mattress STORIS cutover

**Written 2026-08-26.** Read this first, then `SPRINT-STATUS.md`. Everything below was
verified against the live systems on the date above; re-check anything you are about to
depend on rather than trusting this file's freshness.

---

## 1. Where the build actually stands

**All build work is merged to `main` and deployed.** There is no unmerged work and no
open PR. `main` head is `41577bd`.

| Programme                               | State                                          |
| --------------------------------------- | ---------------------------------------------- |
| `PLAN-STORIS-CUTOVER.md` D1–D12         | Locked; implemented                            |
| `PLAN-POS-OPERATIONS.md` P1–P9          | **All nine phases built**                      |
| `PLAN-STORIS-GAP.md` G1–G15 + A5–A9     | **All fifteen closed**                         |
| Browser QA pass 1 (15 findings, D1–D15) | Fixed or dispositioned — see §5                |
| Migrations                              | 49, head `0048_sale_line_order_discount_share` |
| API test suite                          | 500 passing · e2e 8/8                          |

What remains is **not build work**. It is cutover work: data, accounts, DNS, and the
owner-side Ops list in §3.

---

## 2. Deployment topology (and the one trap in it)

| Piece             | Where                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Web (production)  | Vercel `prj_mG574V0ULR7QgDPMjbruqQfqvH1e`, team `team_di6oiEhCIT17lNXsonHt3mSc` → `https://lamattress-erp.vercel.app`. Auto-deploys `main`. |
| API (staging)     | Render `srv-da4tua3m8hqs73apsflg`, workspace `tea-da4l4hgjo6nc73db7i10` → `https://jetnine-api.onrender.com`                                |
| API deploy branch | `claude/fix-latent-int-spec-failures`                                                                                                       |
| Sprint branch     | `claude/la-mattress-erp-storis-cutover-z9xj2t`                                                                                              |

**The trap (fixed in code, needs one secret):** the Render dashboard's repo URL still
points at the _old_ repo (`AlwayzLegit/JetnineERP`) and its branch at
`claude/fix-latent-int-spec-failures`, so Render's own auto-deploy never fires even
though the service reports `autoDeploy: yes`. Since 2026-09-06
`.github/workflows/deploy-api.yml` is the auto-deploy: on every push to `main` that
touches the API it repoints the service at `AlwayzLegit/LA-Mattress-ERP@main` and
starts a Render deploy, waiting for it to go live. It needs the `RENDER_API_KEY`
repository secret (owner Ops item §3). Until that secret exists the workflow fails
on purpose and the manual sequence below still applies.

### The deploy sequence (manual, while `RENDER_API_KEY` is unset)

1. PR the sprint branch → `main`; wait for all four checks green.
2. Squash-merge. Vercel production deploys `main` on its own.
3. Merge `main` into `claude/fix-latent-int-spec-failures`, push.
4. `mcp__Render__trigger_deploy` on the API service.
5. Verify the boot log line: `Schema migrations: N/N applied, head=…`. **Do not skip
   this** — it is the only proof migrations ran.

Once the secret is set, steps 3–4 disappear: the workflow run on `main` is the deploy,
and its last step fails if Render does not reach `live`.

---

## 3. Open Ops items (owner's, not yours — flag, never silently block on)

1. **Resend DNS — in flight, see §4.** The one item with a concrete next action.
2. **Add the `RENDER_API_KEY` repository secret** (Render → Account settings → API
   keys; GitHub → Settings → Secrets and variables → Actions). That lets
   `deploy-api.yml` repoint the service at `AlwayzLegit/LA-Mattress-ERP@main` and
   deploy automatically; no dashboard edit needed after that.
3. **Rotate the shared owner password.** Credentials for `pos.lamattress@gmail.com` were
   shared into an earlier session for API testing. They were used in-session only and
   never written to the repo. Rotation is still advised and still outstanding.
4. **Two sample invoices into `docs/`** for the P4 document templates; confirm the PO
   reply-to address.
5. **Cashier + manager accounts still do not exist.** No longer blocked — see §4.

---

## 4. The two live threads you are picking up mid-flight

### 4a. Email / Resend — one step from done

Invitation email has never worked in production. Root cause, confirmed at source:
`RESEND_API_KEY` is unset on Render, so `createEmailTransport` falls back to
`MemoryTransport`, which logs the message and drops it while the endpoint still returns 201. The Resend account has no API keys and, until today, no domains.

**Already done:**

- `WEB_BASE_URL` on Render corrected to `https://lamattress-erp.vercel.app` (it had been
  pointing at a stale deploy-branch Vercel preview alias, so every invite link was broken
  regardless of mail).
- Sending domain **`mail.a-prompt.ai`** created in Resend, id
  `fbebebe1-3a0a-4e91-a82a-b333cd6769b3`, region `us-east-1`, status `not_started`.
- The dead end itself removed in code (`41577bd`): `EmailTransport` now declares
  `delivers`; when false, `POST /v1/business/members/invite` and `/:id/resend-invite`
  return `inviteLink`, and the members page shows it with a Copy button instead of
  claiming a delivery that never happened. **Account creation is unblocked today via
  copy-link, with or without Resend.**

**Note:** the _root_ `a-prompt.ai` was refused by Resend — `403: The a-prompt.ai domain
has been registered already` — meaning it is claimed in a **different Resend account**.
The subdomain sidesteps this, but somebody should find out whose account holds the root.

**Waiting on the owner:** three DNS records at GoDaddy (zone `a-prompt.ai`). Nothing
touches the apex, so no existing service can break.

| Type | Name                     | Value                                          | Priority |
| ---- | ------------------------ | ---------------------------------------------- | -------- |
| TXT  | `resend._domainkey.mail` | the DKIM `p=…` value from the Resend dashboard | —        |
| MX   | `send.mail`              | `feedback-smtp.us-east-1.amazonses.com`        | 10       |
| TXT  | `send.mail`              | `v=spf1 include:amazonses.com ~all`            | —        |

**Your next action once the owner says the records are saved:** `verify-domain` → create
a **sending-scoped** API key restricted to that domain → set `RESEND_API_KEY` and
`RESEND_FROM_EMAIL` on Render → trigger a deploy → send one real invite and confirm
arrival.

**Do not set `RESEND_API_KEY` before the domain verifies.** With a key present and the
domain unverified, `ResendTransport` throws instead of falling back, which breaks the
copy-link path that is currently the only working way to create accounts.

### 4b. A pending invite

A valid invite exists for `me.lamattress@gmail.com`, issued 2026-08-26 17:53 UTC,
**expiring 2026-08-29 17:53 UTC**. If it lapses before accounts are made, just re-send
from the members page and use the copy-link.

---

## 5. Known-real problems that are NOT fixed

**The cutover blocker: every STORIS-imported variant has `priceCents: 0`.** This is D12
behaving as designed (register-side price entry), but it means the catalog cannot sell
itself. A price source is required before go-live — either import a retail-price file
(SKU → selling price) or set prices in-app. Confirmed on live data: Q-MOS10 is genuinely
`priceCents: 0` / `costCents: 125500`; both the API projection and the table map the
fields correctly, so **this is data, not a bug** (the original D9 report was closed on
that basis).

**A cosmetic ambiguity worth fixing sometime:** the Cost column renders "hidden" both
when the viewer lacks `products.cost.view` and when cost is genuinely null. Two very
different states, one label.

**`manifest_removal` has no reason codes** in the tenant, so pull-off-run falls back to
free text under amendment A9. Add codes for that usage class to make it coded.

**Browser QA is incomplete.** The owner drives it manually in Chrome; steps 3, 5, 6 and
10 are done. **Step 2 (the security-override flow) is blocked** until a second,
non-owner identity exists — it needs a manager account to authorize against, which is
exactly what §4a unblocks. There are no browser tools in this session type; QA is either
the owner's to run or must be driven through the API.

---

## 6. Conventions that will bite you if you skip them

Read `CLAUDE.md` for the full set. The ones that have actually caused failures here:

- **Verify every gate by exit code, never by grepping output.** A `next lint` failure
  prints `Error:`; a grep for lowercase `"error "` read a red lint as green and shipped a
  broken build. This cost a CI cycle.
- **CI provisions each spec's database explicitly.** A new `*.int.spec.ts` pointing at a
  new `jetnine_*` database needs both a `createdb` line and a `*_TEST_DATABASE_URL` env
  var in `.github/workflows/ci.yml`, or it fails with `database does not exist`.
  (`jetnine_rehearsal` is the one legitimate absence — it self-skips.)
- **New tenant tables need RLS registered in two places:** the `tenant_tables` array in
  `packages/db/src/migrations/rls.sql` _and_ `TENANT_SCOPED_TABLES` in
  `packages/db/src/schema/index.ts`. `rls.test.ts` verifies this.
- **Commit generated migrations with schema changes** — CI runs a drift check.
- **Money is integer cents.** Derived money (balance due) is computed, never stored.
- **Never commit STORIS export files or secrets.** `.env.example` only.
- **The temp `apps/web/playwright.local.config.ts`** used for local e2e must never be
  committed and must be deleted after use. Never run `playwright install` — Chromium is
  at `/opt/pw-browsers/chromium`.
- Local test Postgres dies between long gaps. Restart:
  `su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/tmp/pgtest/pgdata -l /var/tmp/pgtest/pg.log -o '-p 5432 -k /var/tmp/pgtest/run -c listen_addresses=127.0.0.1' start"`

---

## 7. Judgement notes from this sprint

Three things worth inheriting, because each cost real time:

**Investigate before you "fix".** Of the 15 QA findings, three were not defects: the
delivery-run lock was already enforced server-side (only the UI was silent), tier-3 price
variance collapsing to "needs a reason" is correct when the actor holds
`orders.price_override`, and the duplicate-`/pos`-screens report was a stale cached build.
One of these was made worse by a reflexive fix — a duplicated guard that broke the
typecheck and had to be reverted. Read the code path before changing it.

**Fix the dead end, not just the symptom.** The invite bug's real defect was not the
missing API key; it was that the UI reported success for mail that went nowhere and gave
the admin no recovery path. Configuring Resend would have hidden that, not fixed it.

**Decisions in the plan docs are locked.** `PLAN-STORIS-CUTOVER.md` D1–D12,
`PLAN-POS-OPERATIONS.md` A1–A4, `PLAN-STORIS-GAP.md` A5–A9 are all owner-confirmed.
Change the doc first, in the same PR, then the code. Where a doc is silent, use the
closest STORIS convention and flag it in your summary rather than inventing one.

---

## 8. Suggested first moves

1. Read `SPRINT-STATUS.md` — it is the running log and the source of truth for what
   happened when.
2. Ask the owner whether the GoDaddy records in §4a are saved. If yes, finish the Resend
   chain and prove it with a real invite.
3. Ask about the `priceCents: 0` catalog (§5). Nothing else on the critical path matters
   until the catalog can quote a price.
4. Once a manager account exists, get the owner to run QA step 2.
