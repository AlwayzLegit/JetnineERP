# Run 01 — Accounting

Use with `BROWSER-AGENT-HANDOFF.md`. That file has the rules, the extraction template, and the return format. This card is the assignment.

**Section:** Accounting — General Ledger, Payables, Receivables, Accounting Views and Reports (and any Accounting control-settings or setup subsection).
**Why first:** this section defines the posting table and period control, which two of our twelve shared services are built on. Everything downstream — inventory valuation, AP, AR, deposits, cash — is unusable until we can reproduce it.

---

## The nine questions this run must answer

If you answer nothing else, answer these. Quote the article for each.

1. **What is the posting table actually called, and what are its dimensions?**
   Find the screen where transaction types are mapped to G/L accounts. Record its exact name and every dimension the mapping keys on — transaction type, location, department, item category or class, reason code, tender type, anything else. Copy a full example row if the docs show one.

2. **What happens to an unmapped transaction?**
   Does STORIS block the post, route to a suspense/default account, or fail silently? This single answer determines how we build our own engine. If the docs don't say, say so explicitly — it's a real finding either way.

3. **What is the complete list of transaction types that post to the G/L?**
   Every subledger event with a mapping. This becomes our enumeration. Copy it verbatim, however long.

4. **How does period control actually work?**
   Exact name (date codes? accounting periods? both?). What states exist. Whether close is global or per subledger. What reopening requires. What happens to a post attempted into a closed period.

5. **What is the received-not-invoiced mechanism called and how does it clear?**
   The account, the screen, the matching process, the tolerance settings, and where variance goes.

6. **How does the cash chain tie together?**
   Drawer close → daily receipts register → deposit → bank reconciliation. Name every document and screen in that chain and what each one reconciles against. Include card settlement batches and financing funding batches — how do they land in the bank rec?

7. **How are customer deposits held and released?**
   Which account, at what moment it becomes revenue, what happens on cancellation, and whether stale deposits age.

8. **What does STORIS do that we haven't asked about?**
   Inter-company, allocations, recurring and reversing entries, budgets, consolidations, cost centers, statistical accounts, currency, 1099s, sales-tax filing, fixed assets, bank feeds. Anything present goes in section I of your return.

9. **What can't a user do without permission, and what is configurable?**
   Every Accounting control setting and every Accounting security permission you encounter, in sections D and E.

---

## Contracts to adjudicate this run

Mark each `CONFIRMED` (with quote) / `CONTRADICTED` (say how) / `NOT DOCUMENTED IN THIS SECTION`.

**Primary — expect these to be documented here:**
`W-036` posting-table mapping with no fall-through · `W-037` period gate on every post · `W-011` receipt accrual · `W-012` voucher match clears it · `W-013` invoice relieves inventory into COGS · `W-033` deposits as liability until delivery · `W-034` drawer → receipts → deposit → bank rec · `W-068` one definition of the GL account for a transaction · `W-069` one definition of period state

**Secondary — likely touched from the accounting side:**
`W-031` tender settlement paths · `W-032` financing funding batches · `W-035` return reversal touching the same accounts · `W-010` inventory ledger feeding valuation · `W-016` shrink posting · `W-044` RTV debit memo · `W-052` location segment on postings · `W-055` document numbering · `W-053` audit rows on accounting master data

**Values to pin down:** `W-061` how unit cost and COGS are defined and stored · `W-062` how sales tax is calculated and where the liability sits · `W-064` how order balance due is derived

---

## Article priority within the section

Sweep in this order — highest wiring density first:

1. Anything titled with `G/L Interface`, `Posting`, `Post to General Ledger`, `Account Assignment`, `Chart of Accounts setup`
2. `Control Settings` / `Parameters` articles in any Accounting subsection
3. `Date Codes`, `Period`, `Close`, `Month End`, `Year End`
4. `Enter a…` / `Process…` / `How to…` articles in Payables and Receivables
5. `Security` articles for Accounting
6. Reconciliation and matching articles
7. Accounting Views and Reports — last, and only for what each report reconciles against

Follow every linked article as you go, even out of this order — a linked page is part of its parent.

---

## Two things to watch for

**Terminology drift.** STORIS's names for these concepts are probably not the names in this card. If you find the posting table is called something else entirely, that renaming *is* the finding — record their term in the glossary and use it from then on.

**Documentation that describes a screen without describing what posting it produces.** This is the most common gap in ERP help centers and the exact thing we cannot afford to guess at. When an article shows a screen and its fields but never says what hits the ledger, record it in section H as *documented but ambiguous* rather than leaving it out. A list of those articles tells us where we'll need to ask STORIS directly or test in a sandbox.

---

## When you're done

Return sections A–J from the handoff. Then add a short closing paragraph in plain language: **if we rebuilt Accounting from only what you read, what would we get wrong?** That paragraph is what I'll act on first.
