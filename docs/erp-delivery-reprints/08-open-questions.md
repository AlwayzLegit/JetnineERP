# 08 — Open questions and source ambiguities

Things the STORIS articles do **not** settle. Resolve these with the business before or during implementation; do not guess silently in code.

## In the source text

1. **"Reset" vs "cleared" in S5.** Scenario S5 says the header's second flag is "**reset** because it no longer includes line 2." Elsewhere the article uses "cleared" for `→ null` and "set to R" for the demotion. S3, the structurally similar case, says "set to R". Best reading is that S5's "reset" means `→ R`, matching S3 — but confirm against live STORIS before locking the test.

2. **S3's parenthetical.** S3 describes changing line 3's first date to `06/04` as "a new date … **which becomes the order's new second date**." Given the fixture's dates (06/01, 06/03, 06/08), 06/04 would land *third*, not second — 06/03 remains the order's second date. The stated *result* for S3 is internally coherent (the header's second slot loses line 3 but keeps its date, hence `R` rather than cleared); the parenthetical appears to be an error carried over from S2. Transcribed as published in `07`; verify empirically.

3. **Third and later dates.** Every rule is written for the first and second date only. The fixture has a third date (06/08), and R9 refers to "the second **and subsequent** dates" for route calendar purposes — but no rule says what a third-date flag does, or whether one exists. Determine whether STORIS only ever maintains two ticket flag slots (with dates rolling forward as deliveries complete, per R9) or whether N slots exist. **This changes the schema.** Current best guess from the evidence: **only two ticket flag slots exist**, and the third-and-later dates are visible to scheduling and the route calendar but not ticketable until they roll up.

4. **"Affects the inventory scheduled for date X."** Never defined precisely. It clearly covers quantity, date and reservation changes. Does it cover a price change? A COD amount change (named in the intro as a reprint trigger but not tied to a specific date)? A route code change on a header with two dates — does it affect both? Build an explicit, enumerated `EditKind → affectedDates` mapping rather than inferring, and make that table the place this question gets answered once.

5. **Header-level trigger list.** R8 names "next delivery date, deposits of any kind, or addition of line items" as examples introduced with "such as". Enumerate the real list for the new ERP; do not leave it open-ended in code.

6. **Line deletion.** R8 covers *addition* of line items. Deletion is not mentioned anywhere.

7. **`P` vs `Y`.** The rules text uses `P`; the grid legend uses `Y`. Treated as the same state in `01`. Confirm there is no third printed-state STORIS distinguishes internally.

## Decisions for LA Mattress

8. **Do we keep destroyed print history?** R2 and R5 clear flags outright, discarding the fact that a ticket was ever printed for that date (and the summary table clears the second date's delivery date information along with it). STORIS does not retain that. An append-only flag-transition log would answer "why did this reprint?" cheaply and is worth the cost.

9. **Is `R` really advisory?** In STORIS the `R` flag explicitly does not block processing. Confirm the warehouse actually wants that, or whether the new system should gate manifest creation or order completion on unresolved reprints. This is a workflow decision, not a port decision.

10. **Multi-date at all.** Per the appendix in `06`, the entire state machine is gated by `DELIVERY DATES - Allow multiple on order`. Find out whether LA Mattress uses multiple delivery dates per order today. If not, the single-date path is the whole product and the multi-date machinery can ship later — but design the schema for multi-date now, because retrofitting per-date flags onto a per-order flag is painful.

11. **Third-party logistics / EDI 215.** The two-character handling method code exists to match a 3PL's 215 document. Confirm whether LA Mattress sends EDI 215 to anyone; if not, the width constraint is arbitrary and can be relaxed.

12. **Advanced Dispatch Track.** Manifest Location taking precedence over Fulfillment Location (`04`) applies only under Advanced Dispatch Track. Determine whether that module is in scope; it affects search results, not just display.

13. **Synchrony.** `03` notes tickets pull promotional payment plan info from the last received authorization. Confirm the finance providers in play and whether ticket rendering needs the same hook.

## Not yet dissected

Articles referenced by this cluster but not read for this handoff. Fetch these before implementing the adjacent screens:

- Transaction Update – Logistical Scheduling (opened by double-clicking a grid row)
- View Delivery Schedules (the read-only variant)
- Print Pick List
- Point of Sale Control Settings (Logistics tab, Printed Documents tab, Route Capacity section) — referenced by nearly every rule here
- Warehouse/Store Location Settings (Mapping Active, Restrict Scheduled Date, Inventory & Logistics tab)
- Route Capacity Control Settings / Route Capacity Settings / Logistical Route Settings
- Status Code Settings, Hold Code Settings
- Advanced Product Settings (Volume), Group Settings (Capacity Units), Route Mapping Control Settings (Default Weight)
- Third-Party EDI Logistics Overview, Fulfillment Handling Method Assignment Settings
- Additional Fulfillment Information, Deliveries and Logistics FAQs
