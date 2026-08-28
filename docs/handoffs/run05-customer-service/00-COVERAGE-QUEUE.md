# Run 05 — STORIS `Customer Service` — Coverage queue

**Scope confirmation first**, per the working agreement: *"Before you open anything, show me the
section's subsection list and article counts so I can confirm the scope."* The listing pages were
read to enumerate only; no article was opened for content before this queue was produced.

**Read-only.** No form submitted, no setting saved, no process run.

Category: `/hc/en-us/sections/15172984123028-Customer-Service`

## Subsection list and article counts

| # | Subsection | URL | Articles |
|---|---|---|---|
| 1 | **Customer Service** *(the transactional subsection)* | /sections/15172984123028-Customer-Service | **31** |
| 2 | **Customer Service Views and Reports** | /sections/51935692811412-Customer-Service-Views-and-Reports | **25** |
| | **Total** | | **56** |

*(Pagination verified: 30 + 1; and 25 on a single page.)*

**This is the smallest run in the queue** — a fifth the size of run 04 — so the plan is to read a
much higher proportion in full rather than sample.

---

## Full article inventory

### Customer Service (31)

| Article | id |
|---|---|
| COG History Display Screen | 15203457245716 |
| COG Line Comments | 15203457247380 |
| Complete the Servicing Process | 15203457748628 |
| Create/Update a Customer Gift Registry | 15201513602708 |
| Delivery Survey Customer Information Screen | 15201528408340 |
| Delivery Survey Screen | 15201528692756 |
| Document Detail (Service) | 15201512783508 |
| **Enter a Service Order** | 15203437572628 |
| Enter a Service Purchase Order | 15203457741588 |
| Export Warranty Information to Excel | 15203437575956 |
| Gift Registry Contributions | 15201529192340 |
| Item Selection for COG Screen | 15203457243412 |
| Maintain a Customer's Own Goods (COG) Order | 15203437569428 |
| Open COG Lookup | 15203437071124 |
| Print a Completed Service Order | 15203437472660 |
| Print an In-Home Work Order | 15203437487636 |
| Print an In-Shop Order | 15203457622804 |
| Reason for Voiding Transaction Screen | 15203457258132 |
| Reinstate Completed Merchandise Service | 15203457245972 |
| Related Parts Selection | 15203457241364 |
| Report Service Revenue by Technician | 15203214703892 |
| Select Service Lines to Close | 15203437059732 |
| Serial Number Look-Up | 15203437057044 |
| Service Details Screen | 15203457257748 |
| Service Linkage Detail | 15203437242004 |
| Service Order Inquiry Screens | 15203437385748 |
| Service Order Item Comments | 15203457417748 |
| Service Order Return Print | 15203457408532 |
| Service Problem Entry Screen | 15203457407764 |
| Special Order Options Screen | 15203457405588 |
| **Tickle Process** | 15203437242900 |

### Customer Service Views and Reports (25)

Multiple Coordinator Selection Window · Multiple Problem Code Selection Window ·
Report Delinquent Service Orders · Report Items with High Average Service Days ·
Report Labor Service Schedule by Technician · Report Product Sales-to-Service Ratio ·
Report Profitability by Payment Responsibility · Report Profitability by Service Employee ·
Report Reinstated Service Orders · Report Service Chargebacks to Manufacturer ·
Report Service Order Aging · Report Service Order History · Report Service Orders ·
Report Service Orders with Service Dates in Jeopardy · Report Service Problem Activity ·
Report Service Status Durations · Report Written Services Revenue ·
View a Coordinator's Open Service Orders · View a Customer's Open Service Orders ·
View a Product's Open Service Orders · View a Salesperson's Open Service Orders ·
View a Technician's Open Service Orders · View a Vendor's Open Service Orders ·
View an Existing Service Order · View Open Service Orders for a Service Status

---

## Batch plan

| Batch | Focus | Articles |
|---|---|---|
| 1 | **Service order core** — Enter a Service Order, Service Problem Entry, Service Details, Service Linkage Detail, Document Detail (Service), Related Parts Selection | 6 |
| 2 | **Service lifecycle** — Complete the Servicing Process, Select Service Lines to Close, Reinstate Completed Merchandise Service, Reason for Voiding, Tickle Process, Enter a Service Purchase Order | 6 |
| 3 | **COG, gift registry, surveys** — the four COG articles, the two gift registry articles, the two delivery survey articles | 8 |
| 4 | **Views and reports sweep** — the six *View a X's Open Service Orders* inquiries, the profitability and status-duration reports, manufacturer chargebacks; coverage statement for the rest | 25 |

Findings continue the audit's single sequence: **run 05 starts at finding 291.**

---

## Contracts expected this run

`W-005` / `W-006` *(special orders — `Special Order Options Screen` is in this section)* ·
`W-012` *(dates, ageing, jeopardy)* · `W-024` *(holds)* · `W-039` *(exceptions)* ·
`W-050` *(access control)* · `W-052` / `W-053` *(GL — service revenue, chargebacks)* ·
`W-055` / `W-056` *(parts availability and reservation)* · `W-061` *(cost, service profitability)* ·
`W-064` *(retention)*.

## Open questions carried into run 05

**From run 04:**
- **In-home vs in-shop service.** Batch 1 F168 found `S` grid flag values `H`/`S`/`B`; batch 2 F181
  found in-shop documents **cannot be manifested** because nothing moves. This section is where the
  distinction should be defined.
- **Customer's own goods (COG).** Batch 2 F182 found COG rides the truck but never enters inventory,
  with a `New Storage Location` recorded at manifest completion. **Four COG articles are here** and
  should give the model.
- **`Closed Without Completion`** — a service line status named in `Status Code Settings` and
  referenced twice in run 04's scheduling articles. Never defined.
- **The internal mail system** (run 04 F228) — service coordination is a likely second sighting.
- **Service chargebacks to manufacturer** — the reports subsection names one; run 04 F270 found
  vendor chargebacks on inventory pieces. Whether these are the same mechanism is open.

**From run 03:**
- Service orders appear throughout Sales Processing (linked service orders on sales lines, F20; the
  `S` flag; protection plans). **This is the other end of that wiring.**
- `Credit Hold Codes List (AR)` `C4` places holds on *"all their open sales orders, **service
  orders**, and debit exchanges"* — so service orders participate in credit holds.

**From run 02:**
- Protection plans and extended warranties are sold in Sales Processing and presumably consumed here.
  `Export Warranty Information to Excel` is in this section.
