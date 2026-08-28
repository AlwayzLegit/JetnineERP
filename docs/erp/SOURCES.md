# Sources & Method

## Where this came from

STORIS' own operator help centre, `storis.zendesk.com/hc/en-us`, Sales Processing section
(`51426747540884`) and its five subsections:

| Subsection | Id | Articles |
|---|---|---|
| Sales Views and Reports | `51935617013780` | 139 |
| Credit Card Processing | `51664009169044` | 5 |
| Sales Order Maintenance | `15172885147412` | 172 |
| Financing | `15201703219220` | 50 |
| Salesperson | `15173051297172` | 39 |
| **Total** | | **405** |

All 405 article titles were enumerated via the help centre's own API, which gave the module and screen
taxonomy that shapes `01`, `02`, and `09`. Roughly 40 articles were then read in full — the ones that
define the core flows rather than describe a single field — and the rules in `03`–`10` come from those.

### Articles read in full

**Order lifecycle:** Enter a Sales Order · Order Completion Process · Order Completion Details · Order
Completion Exceptions · Sales Order Deposits · Required Deposits by Line Display · Payment Summary
Window · Enter a Customer Payment/Refund/Gift Certificate · Totals · Additional Line Item Details ·
Fulfillment Selection

**Financing & cash:** Enter a Finance Application · Finance Application Management · Manage Customer
Applications · Transmit Financing Settlement · Resubmit Settlement Errors · Balance a Cash Drawer ·
Blind Cash Balancing Screen · Balance Approval by Manager · Reconcile Cash Drawer · Installment & RTO
Online Financing Overview · Maintain Financed Balances · Enter a Customer's Revolving Plan · Enter a
Customer's Installment Contract · Authorization Display Screen · Credit Card Entry Window · View a
Customer's Account Summary Window

**Salesperson, CRM, views, reporting:** Up System Control Settings · InTouch CRM Overview · Enter a
Sales Lead · Manage Sales Leads · View and Manage Open Orders · View and Manage Open Order Lines ·
Sales Analysis Report Fields (broken — see below) · Sales Analysis Reporting Overview · Report Sales
Commissions · Multiple Salesperson Commission Screen · Pricing Rules · Order Tax Information

## Method and its limits

- **The help centre is gated.** Article URLs redirect anonymous requests to sign-in, so the pages were
  read through an authenticated browser session rather than fetched. Reproducing this research requires
  the same access.
- **Field definitions live in collapsed accordions** that plain text extraction drops, returning field
  labels with no meanings. Every article had its accordions expanded before extraction. The first pass
  on several articles produced empty definitions because of this.
- **One article is broken at the source.** "Sales Analysis Report Fields" lost its field table in
  STORIS' own content migration (no table in the DOM, empty hrefs on both in-body links). The report
  builder's *shape* was reconstructed from the linked overview article; the field catalogue is
  unrecoverable and is open question #16.
- **Two article ids resolve only with their slug appended.** Bare-id URLs silently load unrelated
  articles.
- **This is documentation, not source code or observed behaviour.** Where STORIS' docs are wrong, this
  spec inherits the error. One known instance: the total-deposit-amount field is described as showing
  a refund total, which reads as a documentation defect. Where the docs are silent, `13` says so rather
  than filling the gap.
- **Version drift:** the open-orders view has 11.0 and 10.8 documentation variants; 11.0 was used.
  Provider lists differ between the application-entry article (15 current providers) and the settlement
  articles (Citi, GE Capital, American General — apparently legacy).

## Tagging convention used throughout

| Tag | Meaning |
|---|---|
| `[DOC]` | Documented STORIS behaviour. Implement as written. |
| `[PARTIAL]` | Documented incompletely — some values shown, the domain not closed. Do not treat as exhaustive. |
| `[INFER]` | Our reading of behaviour the docs imply but never state. Implement with a `SPEC:INFER` comment. |
| `[DECIDE]` | A gap STORIS never documented, or a deliberate departure. **Stop and ask.** |
| `[LEGACY]` | Exists only to serve a STORIS internal. Carry only if the cutover needs it. |

---

## Second pass — the Sales Order Maintenance deep read

The screen-level layer (files `20`–`31`) comes from reading **all 172 articles** in the Sales Order
Maintenance subsection (`15172885147412`) in full, not a sample.

### A better extraction method

The first pass read rendered pages and had to force-expand STORIS' collapsed accordions, which was
slow and silently dropped field definitions when it failed. The second pass avoided that entirely:
the help-centre API returns each article's **complete body HTML**, accordion content included. The
working pattern, run inside an authenticated browser tab on the `storis.zendesk.com` origin:

1. Page the section's article list via `/api/v2/help_center/en-us/sections/{id}/articles.json?per_page=100`,
   following `next_page`. The order is alphabetical and stable, so index ranges are safe to hand to
   parallel workers.
2. For an article, render `article.body` into a detached element, strip `script`/`style`, take
   `innerText`, and write it into the page as a `<pre>`.
3. Read it back with the page-text tool.

Two constraints worth writing down: the JavaScript evaluation tool truncates its return value at
roughly 1000 characters, so article text must never be returned through it — only through the
page-text read; and for the largest articles the text itself must be read in slices.

### Known losses and how they were handled

- One worker's return was cut by an output size cap, losing nine articles (indexes 50–58 — the
  largest in the section, including Enter a Sales Order, Enter a Return and Enter an Exchange). These
  were re-read separately with a one-article-per-dump pattern. Final coverage was verified
  programmatically at 172/172 distinct article blocks, zero duplicates, zero gaps.
- The concatenated extraction corpus initially carried harness residue — fragments shaped like agent
  instructions and token-usage blocks appended to some article blocks. Six of the eight
  specification-writing agents independently flagged it, treated it as data rather than instruction,
  and reported it. It was stripped and the corpus re-verified. No STORIS content was affected. Anyone
  re-running this should expect the same residue and strip it before use.
- Roughly **60 content defects on STORIS' side** were catalogued rather than worked around —
  bodies that never migrated, articles whose text is duplicated with conflicting labels, field
  descriptions copy-pasted from a neighbouring field, and screens carrying two different titles. They
  are listed at the end of `31-som-open-questions.md`, and where a defect hides a rule the build needs,
  it also appears there as a numbered question.

### Coverage

| Pass | Scope | Articles enumerated | Articles read in full |
|---|---|---|---|
| First | All five Sales Processing subsections | 405 | ~40 |
| Second | Sales Order Maintenance only | 172 | **172** |

The other four subsections (Sales Views and Reports, Credit Card Processing, Financing, Salesperson —
233 articles) remain at first-pass depth: enumerated in full, with the core flows read. Files `04`–`09`
carry that material and say where it is thin.
