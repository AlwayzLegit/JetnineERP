# STORIS Accounting reference corpus

Read `HANDOFF.md` before using anything in here. It explains the bundle, the domain, the
cutover decisions, and — importantly — what the source documentation does *not* say.

- `HANDOFF.md` — orientation, decisions, integration surfaces, cutover sequence, risk list, ask-list for STORIS.
- `INDEX.md` — all 307 articles with titles, URLs and local paths.
- `_notes/` — five analytical digests (GL+TPA, Payables, Receivables A/B, Views & Reports). Dense, cited, with inferences marked `INFERRED`.
- `00-`…`04-` folders — the verbatim help-center articles. These are the source of truth.

Working rules:
1. Cite the article file path for every factual claim about STORIS behaviour.
2. Never invent a field name, column position, or record layout. If the article doesn't state it,
   say "not stated in the article" and add it to the ask-list — do not guess.
3. The digests are analysis, not source. When they conflict with an article, the article wins.
4. This corpus is Accounting only. Sales orders, inventory, purchasing, POS and tax reporting
   are in other help-center branches and are not present here.
