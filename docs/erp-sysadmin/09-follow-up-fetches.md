# 09 — Follow-Up Fetches

Articles referenced by this section but living outside it. Each closes a known gap. Ordered by value.

| # | Article / topic | STORIS id | Closes |
|---|---|---|---|
| 1 | **Personally Identifiable Information (PII) Overview** | `15201512686228` | Referenced directly by `PURGE-001`; likely carries the retention and lawful-basis rules the erasure screen omits. Feeds `D8`, `PRIV-002`. |
| 2 | **Purge of Sensitive Data** | `15234723664532` | The only audited purge; its `Social Security` type is reportedly non-functional. Feeds `JOB-004`. |
| 3 | **Third Party Logistics EDI Settings** | — | Holds the actual flags behind `Third Party Logistics EDI Code`, which lets a carrier write delivery-completion state onto our orders. Feeds `AP-11`. |
| 4 | **On Hold Purchase Order Overview** | — | Still the authoritative source for `PO-080`; this pack closed it only partially (`C6`). |
| 5 | **Inter-Regional Transfers** | — | Deferred by the Inventory pack's `XFR-060`; region scope is now confirmed to exist (`C3`), so this matters more than it did. |
| 6 | **Duplicate Customer Merge Overview** | `15201528158996` | The downstream half of `IMP-001`; merge has no timestamp and no before-image (`CUST-004`). |
| 7 | **Manage Customer Merge List** | `15201512538772` | Same. |
| 8 | **Purge General Ledger Data** | `15234737760788` | Hits all companies with no selector. |
| 9 | **Purge Costing Audit Data** | `15234723643412` | Both dates blank purges everything. |
| 10 | **Purge Cash Drawer Data** | `15201688543636` | Not in this section at all. |
| 11 | **Purge Special Order and Obsolete Products** | `15234723644692` | — |
| 12 | **Solicitation of Customer Information** | `15297965125140` | Feeds `D9`, `PRIV-003`. |
| 13 | **Warehouse Inventory Settings** | — | Referenced by `PRD-050` and `PRD-059` but **absent from Product Settings**; `CFG-WHINV-*` is currently specified from FAQ answers only. |
| 14 | **In Transit Days Hierarchy** | — | Feeds delivery-date promising and `VEND-041`'s manual-PO gap (`AP-22`). |
| 15 | **AP Hold code table** (Payables section) | — | The code table behind `VEND-087`'s `Hold Code`; completes `C6`. |
| 16 | **Vendor Receivables** (section) | — | Where RTV expected-credit vs credit-received matching actually lives. |
| 17 | **Vendor return tax matrix** | — | Referenced by `VEND-060`. |
| 18 | **Price Matrix Usage Codes** — live system | `CUST-105` | The article is captured; what is needed is **verification against the running system** of the 100-based factor arithmetic (`C1`) and the resolution order (`C2`, `D6`). Not a fetch — a test. |

**Note on #18:** it is the most important item on this list. Two of the thirteen corrections in
`01-corrections-to-inventory-pack.md` rest on reading a documented rule that contradicts another documented
rule. Both cannot be right, and pricing is where being wrong is most expensive.
