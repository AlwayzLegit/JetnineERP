# 00 — Coverage Matrix

All **599** articles in the STORIS **System Administration** section, dissected in full. Every row points at
a requirement entry in `parts/<slug>.md`.

**How to use:** this is the audit surface. For each row, search the repo for an existing implementation and
fill **Audit** with `DONE` / `PARTIAL` / `MISSING` / `N/A` plus a file path. Do this *before* writing code.
`N/A` is a legitimate verdict here — a large share of these articles document STORIS capability LA Mattress
does not need (multi-currency, in-house consumer lending, foreign processing). Marking something `N/A` is a
decision; record it, don't skip the row.

**Read `01-corrections-to-inventory-pack.md` before anything else** — these reference screens contradicted
the Inventory handoff pack in thirteen places, some of them load-bearing.

| Part file | Section | Articles |
|---|---|---|
| [`parts/sysadmin-a.md`](parts/sysadmin-a.md) | System Administration (A: 1–47) | 47 |
| [`parts/sysadmin-b.md`](parts/sysadmin-b.md) | System Administration (B: 48–93) | 46 |
| [`parts/control-settings-a.md`](parts/control-settings-a.md) | System Control Settings (A: positions 1–44) | 44 |
| [`parts/control-settings-b.md`](parts/control-settings-b.md) | System Control Settings (B: positions 45–87) | 43 |
| [`parts/user-security.md`](parts/user-security.md) | User Settings — Security articles | 10 |
| [`parts/user-settings-a.md`](parts/user-settings-a.md) | User Settings (A: 1–20 non-security) | 20 |
| [`parts/user-settings-b.md`](parts/user-settings-b.md) | User Settings (B: 21–39 non-security) | 19 |
| [`parts/customer-settings-a.md`](parts/customer-settings-a.md) | Customer Settings (A: 1–46) | 46 |
| [`parts/customer-settings-b.md`](parts/customer-settings-b.md) | Customer Settings (B: 47–92) | 46 |
| [`parts/customer-settings-c.md`](parts/customer-settings-c.md) | Customer Settings (C: 93–137) | 45 |
| [`parts/product-settings-a.md`](parts/product-settings-a.md) | Product Settings (A: 1–44) | 44 |
| [`parts/product-settings-b.md`](parts/product-settings-b.md) | Product Settings (B: 45–88) | 44 |
| [`parts/vendor-settings-a.md`](parts/vendor-settings-a.md) | Vendor Settings (A: 1–47) | 47 |
| [`parts/vendor-settings-b.md`](parts/vendor-settings-b.md) | Vendor Settings (B: 48–94) | 47 |
| [`parts/views-reports.md`](parts/views-reports.md) | System Administration Views and Reports | 45 |
| [`parts/account-purge-import.md`](parts/account-purge-import.md) | Account Setup · Purging Data · Importing Data | 6 |
| | **Total** | **599** |

---


## System Administration (A: 1–47)

Source: [`parts/sysadmin-a.md`](parts/sysadmin-a.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `SYS-001` | Access ECL | 15234737969556 | |
| `SYS-002` | Access Time Clock | 15234738561044 | |
| `SYS-003` | Administer Phantom Processes | 15234735777428 | |
| `SYS-004` | AP and GL History Conversions | 15234718452500 | |
| `SYS-005` | AP Bill Conversion | 15234718455060 | |
| `SYS-006` | Assign Conversion Import Translations | 15234721250196 | |
| `SYS-007` | Assign Daily Reports Print Destination | 15234722956820 | |
| `SYS-008` | Assign Monthly Reports Print Destination | 15234737083668 | |
| `SYS-009` | Assign Screen Action Permission | 15234722295188 | |
| `SYS-010` | Automated Data Import Settings | 15234721248788 | |
| `SYS-011` | Automatic Updates Notification Screen | 15234737965972 | |
| `SYS-012` | Check and Electronically Install STORIS Updates | 15234723874452 | |
| `SYS-013` | Confirmation Request Window | 15234718087700 | |
| `SYS-014` | Conversion Process Actions Button | 15234720878356 | |
| `SYS-015` | Copy Live Data to Learn Account | 15234722085140 | |
| `SYS-016` | Create a Catalog Spreadsheet | 15234718088596 | |
| `SYS-017` | Create Document Text | 15234722082708 | |
| `SYS-018` | Custom Plug-In Process Maintenance | 15234737967252 | |
| `SYS-019` | Cycle Module Multi-Print Assignment Screen | 15234722706068 | |
| `SYS-020` | Default Path for Micro*D Quote Documents and Images | 15234738259988 | |
| `SYS-021` | Dynamic Escape Settings | 15234736180116 | |
| `SYS-022` | Dynamic Tab Settings | 15234736179604 | |
| `SYS-023` | End of Day Reports | 15234722705300 | |
| `SYS-024` | End of Month Reports | 15234722706196 | |
| `SYS-025` | End-Of-Month Active Module Inquiry Screen | 15234722707860 | |
| `SYS-026` | End-Of-Month Module Detail Screen | 15234722727188 | |
| `SYS-027` | Enter Payments Applied to a Contract | 15234720866708 | |
| `SYS-028` | Export Protection Plan Activity | 15234723874836 | |
| `SYS-029` | Export Purchase Orders | 15234737967380 | |
| `SYS-030` | Generate Daily Reports | 15234722963092 | |
| `SYS-031` | Generate Monthly Reports | 15234737083796 | |
| `SYS-032` | Generate Monthly Reports after Daily Reports | 15234722728724 | |
| `SYS-033` | Import / Export Physical Inventory Count | 15234718452756 | |
| `SYS-034` | Import Cross Reference Data | 15234718456980 | |
| `SYS-035` | Import Data | 15234721245332 | |
| `SYS-036` | Import External Data | 15234721265684 | |
| `SYS-037` | Import Physical Inventory Count Review Screen | 15234721243924 | |
| `SYS-038` | Install Software Updates | 15234722469524 | |
| `SYS-039` | Installment Contract Load | 15234721541524 | |
| `SYS-040` | Load Import Tariff | 15234721552788 | |
| `SYS-041` | Log To Additional Account | 15234722298132 | |
| `SYS-042` | Maintain NFS Root Paths | 15234724163860 | |
| `SYS-043` | Mass Collector Reassignment | 15234738253460 | |
| `SYS-044` | Modify ArcLogistics PC Path | 15234724188820 | |
| `SYS-045` | Modify Images PC Path | 15234738255892 | |
| `SYS-046` | Modify Quickbooks PC Path | 15234739734292 | |
| `SYS-047` | Modify Routeview PC Path | 15234738251156 | |

## System Administration (B: 48–93)

Source: [`parts/sysadmin-b.md`](parts/sysadmin-b.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `SYS-048` | Modify UPS Roadnet PC Path | 15234738252436 | |
| `SYS-049` | Multi-Lingual Character Sequences (Windows' Control Sequences) | 15234737331988 | |
| `SYS-050` | Multi-Lingual Processing Set-Up | 15234723191572 | |
| `SYS-051` | Override Time Clock Entry | 15234724184468 | |
| `SYS-052` | Phantom Process Log | 15234735774356 | |
| `SYS-053` | Phantom Process Settings | 15234721715988 | |
| `SYS-054` | Physical Inventory Count Review | 15234735558420 | |
| `SYS-055` | Purchase Orders to Export | 15234736541844 | |
| `SYS-056` | Purge Costing Audit Data | 15234723643412 | |
| `SYS-057` | Purge General Ledger Data | 15234737760788 | |
| `SYS-058` | Purge Messenger Activity | 15234723664916 | |
| `SYS-059` | Purge of Sensitive Data | 15234723664532 | |
| `SYS-060` | Purge Special Order and Obsolete Products | 15234723644692 | |
| `SYS-061` | Recover STORIS Licenses | 15234739734676 | |
| `SYS-062` | Remove Sales Orders Not Processed Correctly | 15234738567700 | |
| `SYS-063` | Report Data Imported Errors and Warnings | 15234720861588 | |
| `SYS-064` | Report on Data Warehouse Activity | 15234723880468 | |
| `SYS-065` | Resync Data Warehouse | 15234737969044 | |
| `SYS-066` | Review Backup Log | 15234737083924 | |
| `SYS-067` | Review Settings Activity | 15234724473876 | |
| `SYS-068` | Right-Click Menus | 15234721931156 | |
| `SYS-069` | Run a System Backup | 15234737083284 | |
| `SYS-070` | Schedule Electronic Updates | 15234737970964 | |
| `SYS-071` | Select and Configure a Vendor for Import | 15234720865556 | |
| `SYS-072` | Select Contract Insurance | 15234718086932 | |
| `SYS-073` | Select State Screen | 15234718079764 | |
| `SYS-074` | Set Maximum Update Screen | 15234736539540 | |
| `SYS-075` | Set Product Purchase Status by Region | 15234738565396 | |
| `SYS-076` | Set Up Menus | 15234722295828 | |
| `SYS-077` | Set Up Terminal Server for a Printer | 15234724474388 | |
| `SYS-078` | Shift4 Cloud Credit Card Processing Overview | 47806055334548 | |
| `SYS-079` | Shift4 Shared Token Load | 15234725686036 | |
| `SYS-080` | Synchronize OS to STORIS Printers | 15234737966100 | |
| `SYS-081` | Translate Bubble Help | 15234737321236 | |
| `SYS-082` | Translate Dynamic Searches | 15234723190932 | |
| `SYS-083` | Translate File Descriptions | 15234723190676 | |
| `SYS-084` | Translate File Dictionaries | 15234737322516 | |
| `SYS-085` | Translate Program Errors | 15234737333908 | |
| `SYS-086` | Translation Tool | 15234723476628 | |
| `SYS-087` | Update Product Configuration Detail | 15234735558164 | |
| `SYS-088` | Update Purchase Date | 15234722465300 | |
| `SYS-089` | Updating Your Operating System for Electronic Updates | 15234722463508 | |
| `SYS-090` | User Defined Menu Description | 15234722085652 | |
| `SYS-091` | Validate STORIS License Usage | 15234738255508 | |
| `SYS-092` | View Downloaded Update List | 15234736539156 | |
| `SYS-093` | View Phantom Processes | 15234735775892 | |

## System Control Settings (A: positions 1–44)

Source: [`parts/control-settings-a.md`](parts/control-settings-a.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `SCS-001` | Account Statement Cycling Control Settings | 15186452330644 | |
| `SCS-002` | Accounts Receivable Control Settings | 15186452327572 | |
| `SCS-003` | Add Product Attribute | 15186416510612 | |
| `SCS-004` | Add Text | 15186451010836 | |
| `SCS-005` | Add-on Calculation Process | 15186451011092 | |
| `SCS-006` | Alternate Tax Interface Control Settings | 15186501542164 | |
| `SCS-007` | API Control Settings | 15186452328468 | |
| `SCS-008` | Ashley Custom Cost Formula | 20139429218196 | |
| `SCS-009` | Automatic Transfers | 15186451010708 | |
| `SCS-010` | Bar Code Add-On Settings | 15186416511636 | |
| `SCS-011` | Bar Code Control Settings | 15186501558292 | |
| `SCS-012` | Cash Balancing Control Settings | 15186452327700 | |
| `SCS-013` | Check-Levels for Exceptions | 15186416511124 | |
| `SCS-014` | Collections Processing Control Settings | 15186501540756 | |
| `SCS-015` | Commission Calculation Code Options | 15186416511252 | |
| `SCS-016` | Costing Control Settings | 15186501540884 | |
| `SCS-017` | Credit Application Control Settings | 15186501753876 | |
| `SCS-018` | Customer Rewards Control Settings | 15186452549524 | |
| `SCS-019` | Customer's Own Materials (COM) Control Settings | 15186501538708 | |
| `SCS-020` | D-Tools System Control Settings | 15186452533012 | |
| `SCS-021` | Data Warehouse Control Settings | 15186501753492 | |
| `SCS-022` | Default Check Print Bank | 15186451247636 | |
| `SCS-023` | Default Due Day Table | 15186416725012 | |
| `SCS-024` | Default Store/District Assignments - Collections | 15186451246228 | |
| `SCS-025` | Deferment Fee Table | 15186416721684 | |
| `SCS-026` | Demographic Information Screen | 15186416719508 | |
| `SCS-027` | Demographics Control Settings | 15186452537748 | |
| `SCS-028` | Due Date List Entry | 15186451511828 | |
| `SCS-029` | eBridge Commerce Credit Revew Queue Retention Days | 15186416970132 | |
| `SCS-030` | EDI Control Settings | 15186501753236 | |
| `SCS-031` | Electronic Check Processing Control Settings | 15186501753620 | |
| `SCS-032` | Enter Quick Purchase Orders | 15186452535572 | |
| `SCS-033` | eSTORIS Control Settings | 15186452536468 | |
| `SCS-034` | Event Notification Control | 16918023610516 | |
| `SCS-035` | External Communications Settings | 15186452794644 | |
| `SCS-036` | Financing Control Settings | 15186501985172 | |
| `SCS-037` | General Ledger Control Settings | 15186501980436 | |
| `SCS-038` | General System Control Settings | 15186501982740 | |
| `SCS-039` | Hi/Lo Gross Profit Option | 15186416971540 | |
| `SCS-040` | Import BIN/IIN Table | 15186452790804 | |
| `SCS-041` | Import Document Print | 15186416978452 | |
| `SCS-042` | Installment Receivables Control Settings | 15186452792724 | |
| `SCS-043` | Inventory Control Settings | 15186452794132 | |
| `SCS-044` | Legal Code Settings | 15186501982868 | |

## System Control Settings (B: positions 45–87)

Source: [`parts/control-settings-b.md`](parts/control-settings-b.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `SCS-045` | Maintain Credit Application Letter Print UNC Path | 15186451529876 | |
| `SCS-046` | Maintain Event Configuration | 41561618825108 | |
| `SCS-047` | Micro*D PreVue | 15186451515028 | |
| `SCS-048` | Net Purchase Order | 15186501108372 | |
| `SCS-049` | Notification by Warehouse Screen | 15186501105684 | |
| `SCS-050` | Notifications Control Settings | 15186452992660 | |
| `SCS-051` | Order Line Import Control Settings | 15186502242452 | |
| `SCS-052` | Payables Control Settings | 15186501543572 | |
| `SCS-053` | Payment Card and Device Settings | 15186452993556 | |
| `SCS-054` | Point of Sale Control Settings | 15186502233620 | |
| `SCS-055` | POS Bar Code Control Settings | 15186502239636 | |
| `SCS-056` | Product Auto-Numbering Exclusion Ranges | 15186501109012 | |
| `SCS-057` | Product Configurator Control Settings | 15186452992916 | |
| `SCS-058` | Purchasing Control Settings | 15186502233492 | |
| `SCS-059` | Quick Purchase Order Settings | 15186452991252 | |
| `SCS-060` | Quick Sale Control Settings | 15186501993236 | |
| `SCS-061` | Report Archive Retention Days | 15186502232724 | |
| `SCS-062` | Requested Date Calculation | 16716821448084 | |
| `SCS-063` | RetailDeck Control Settings | 15186502232340 | |
| `SCS-064` | Revolving Receivables Control Settings | 15186453252116 | |
| `SCS-065` | Route Capacity Control Settings | 15186453252372 | |
| `SCS-066` | Route Mapping Control Settings | 15186502470164 | |
| `SCS-067` | Sales Analysis Report Control Settings | 15186502479380 | |
| `SCS-068` | Sales Lead System Control Settings | 15186502476820 | |
| `SCS-069` | Sales Order Reservations | 15186501107604 | |
| `SCS-070` | Service Control Settings | 15186453256980 | |
| `SCS-071` | Shopping Cart Control Settings | 15186453256212 | |
| `SCS-072` | Special Order Control Settings | 15186453249940 | |
| `SCS-073` | Stock Reservation Settings | 15186451768852 | |
| `SCS-074` | STORIS Messenger Control Settings | 15186501104788 | |
| `SCS-075` | System Notifications | 15186452148500 | |
| `SCS-076` | System Security Window | 15186501361172 | |
| `SCS-077` | Terminal Settings | 15186452531860 | |
| `SCS-078` | Test Email Server Connection | 15186501361428 | |
| `SCS-079` | Third Party Finance Application Control Settings | 15186502670228 | |
| `SCS-080` | Third-Party Accounting Control Settings | 15186453250196 | |
| `SCS-081` | TPA Transmission Phantom | 15186501362836 | |
| `SCS-082` | Transaction Entry - User Log In Screen | 15186452147092 | |
| `SCS-083` | Twilight Discount Pricing Settings | 15186502670612 | |
| `SCS-084` | Vendor Receivables Control Settings | 15186453471636 | |
| `SCS-085` | Warehouse Management Control Settings | 36103270474004 | |
| `SCS-086` | Web Control Settings | 15186453486484 | |
| `SCS-087` | Zero-Cost Exception Handling | 15186452150932 | |

## User Settings — Security articles

Source: [`parts/user-security.md`](parts/user-security.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `SEC-001` | Create a User Actions - Transfer Security | 15185859625876 | |
| `SEC-002` | Create a User/Group Actions - Import Data Security | 15185859622804 | |
| `SEC-003` | Create a User/Group Actions - Logistics Security | 15185875554452 | |
| `SEC-004` | Create a User/Group Actions - Payables Security | 15185875557140 | |
| `SEC-005` | Create a User/Group Actions - Personal Information Security | 15185859628180 | |
| `SEC-006` | Create a User/Group Actions - Purchasing Security | 15185859411732 | |
| `SEC-007` | Create a User/Group Actions - Receivables Security | 15185875555988 | |
| `SEC-008` | Create a User/Group Actions - Sales Security | 15185859408660 | |
| `SEC-009` | Create a User/Group Actions - Service Security | 15185875555220 | |
| `SEC-010` | Create a User/Group Actions - System Security | 15185875776532 | |

## User Settings (A: 1–20 non-security)

Source: [`parts/user-settings-a.md`](parts/user-settings-a.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `USR-001` | Attachment Description Entry Screen | 15185875552660 | |
| `USR-002` | Bank to Print Checks by Currency Settings | 15185859409172 | |
| `USR-003` | Company Settings | 15185876528404 | |
| `USR-004` | Convert Comment Files | 15185859408788 | |
| `USR-005` | Country Settings | 15185876533396 | |
| `USR-006` | Create a User | 15185876530068 | |
| `USR-007` | Create a User Group | 15186132800788 | |
| `USR-008` | Customer Purge | 15185859627028 | |
| `USR-009` | Customer Service Maintenance - User File | 15185875773844 | |
| `USR-010` | Description Field - Language Translation Entry | 15185875797140 | |
| `USR-011` | Edit File Attachments | 15185859629972 | |
| `USR-012` | Foreign Processing Overview | 15185876531220 | |
| `USR-013` | Import Provider Type Settings | 15185860429204 | |
| `USR-014` | Individual Zip Codes | 15185860708884 | |
| `USR-015` | Installment Credit Approval Limits | 15185875774356 | |
| `USR-016` | Installment Credit Approval Rules | 15185859801876 | |
| `USR-017` | Insurance Underwriter Settings | 15185860428820 | |
| `USR-018` | Miscellaneous Fee Settings | 15185860430356 | |
| `USR-019` | PC Applications Window | 15185875940884 | |
| `USR-020` | Protection Plans Overview | 15185860706580 | |

## User Settings (B: 21–39 non-security)

Source: [`parts/user-settings-b.md`](parts/user-settings-b.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `USR-021` | Rate Table Settings | 15185859800852 | |
| `USR-022` | Reason Code Settings | 15185860705300 | |
| `USR-023` | Reason Code Spiff Table | 15185875940756 | |
| `USR-024` | Receivable Payment Source Settings | 15185876708756 | |
| `USR-025` | Regional Processing - Reporting Rules | 15185859800340 | |
| `USR-026` | Regional Processing - Rules, Notes, and Exceptions | 15185875941012 | |
| `USR-027` | Remove from Hold & Send via EDI Preferences | 15185860065428 | |
| `USR-028` | Restricted Payment Type Select Window | 15185876228244 | |
| `USR-029` | RF Barcode User Settings | 15185860063764 | |
| `USR-030` | Sales Performance Report | 15185860064404 | |
| `USR-031` | Schedule a Process | 15185876708628 | |
| `USR-032` | Schedule Daily Reports Preferences | 15185860064020 | |
| `USR-033` | Set Domestic Country | 15185876226580 | |
| `USR-034` | Tax Jurisdiction Reduction Percent Screen | 15185860067732 | |
| `USR-035` | Telephone Mask Settings | 15185860065044 | |
| `USR-036` | Track Settings Activity | 15185876708884 | |
| `USR-037` | User Defined Settings | 15185860707092 | |
| `USR-038` | User Group Clone Process | 15185860228628 | |
| `USR-039` | View File Attachments | 15185875552276 | |

## Customer Settings (A: 1–46)

Source: [`parts/customer-settings-a.md`](parts/customer-settings-a.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `CUST-001` | Account Status Settings | 15242611077268 | |
| `CUST-002` | Activity Reason Settings | 15242629406228 | |
| `CUST-003` | Address Exception List Settings | 15242629406612 | |
| `CUST-004` | Advanced Customer Settings | 15242629407380 | |
| `CUST-005` | Alert Code Settings | 15242629418772 | |
| `CUST-006` | Alternate Taxable Merchandise Calculation | 15242594518164 | |
| `CUST-007` | Bank Settings | 15242611081620 | |
| `CUST-008` | Card Length Format Action | 15242406194580 | |
| `CUST-009` | Cash Drawer Settings | 15242629411604 | |
| `CUST-010` | Cash Payment Settings | 15242662922644 | |
| `CUST-011` | Check Payment Settings | 15242629407508 | |
| `CUST-012` | Closing Probability Settings | 15242611077652 | |
| `CUST-013` | Collection Letter Settings | 15242611080468 | |
| `CUST-014` | Collector Settings | 15242629660820 | |
| `CUST-015` | Commission Settings | 15242611359252 | |
| `CUST-016` | Commission Settings Lookup | 15242594517268 | |
| `CUST-017` | Compliance Condition Settings | 15242629664020 | |
| `CUST-018` | Contract Balance Adjustment Settings | 15242611356692 | |
| `CUST-019` | Contract Classification Settings | 15242611357204 | |
| `CUST-020` | Create Check Run File | 15242629662100 | |
| `CUST-021` | Create/Maintain a Daily Discount Schedule | 15242611361684 | |
| `CUST-022` | Create/Maintain a Membership Discount Schedule | 15242629662868 | |
| `CUST-023` | Credit Application Settings | 15242611356948 | |
| `CUST-024` | Credit Bureau Code Settings | 15242611600916 | |
| `CUST-025` | Credit Bureau Settings | 15242629909908 | |
| `CUST-026` | Credit Card Payment Settings | 15242662922388 | |
| `CUST-027` | Credit Cards Already on File | 15242594516884 | |
| `CUST-028` | Credit Employment Status Settings | 15242629911700 | |
| `CUST-029` | Credit Review Status Code Settings | 15242611595540 | |
| `CUST-030` | Credit Score Percentile Settings | 15242629910548 | |
| `CUST-031` | Credit Source Settings | 15242611595284 | |
| `CUST-032` | Customer Alert Code Settings | 15242629910036 | |
| `CUST-033` | Customer Legal Settings | 15242609770004 | |
| `CUST-034` | Customer Legal Settings - Read Only | 15242406190740 | |
| `CUST-035` | Customer Membership Settings | 16917471620116 | |
| `CUST-036` | Customer Prefix Settings | 15297959787156 | |
| `CUST-037` | Customer Price Settings | 15242611603220 | |
| `CUST-038` | Customer Settings | 15242630128788 | |
| `CUST-039` | Customer Type Settings | 15242630128916 | |
| `CUST-040` | CVV Prompt | 15242406189204 | |
| `CUST-041` | CVV2 Prompt | 34519031274644 | |
| `CUST-042` | Debit Card Overview | 15242390516884 | |
| `CUST-043` | Debit Card Payment Settings | 15242630128404 | |
| `CUST-044` | Desjardins Configuration | 15242610006676 | |
| `CUST-045` | Enable VISA Credit Card Rules | 15242390515860 | |
| `CUST-046` | Enter Customer's Date of Birth | 15242594734612 | |

## Customer Settings (B: 47–92)

Source: [`parts/customer-settings-b.md`](parts/customer-settings-b.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `CUST-047` | Equivalent Pay Types Screen | 15242390523284 | |
| `CUST-048` | Establish Report Builder Security Codes | 15242630129940 | |
| `CUST-049` | Establish Report Builder Security Groups | 15242630130708 | |
| `CUST-050` | eSTORIS Product Search Filter | 15242611858580 | |
| `CUST-051` | Extended Receivables Insurance Code Settings | 15242630131092 | |
| `CUST-052` | Finance Application Queue Tier Settings | 15242630130324 | |
| `CUST-053` | Finance Level/MMP Table | 15242406416020 | |
| `CUST-054` | Finance Provider Settings | 15242630366228 | |
| `CUST-055` | Finance Provider Settings by Finance Type | 15242390520468 | |
| `CUST-056` | Financing Eligibility Restrictions | 15242610007444 | |
| `CUST-057` | Financing Merchant Settings | 15242630369428 | |
| `CUST-058` | Financing Payment Estimator Settings | 15242406417428 | |
| `CUST-059` | Financing Payment Plan Settings | 15242612075924 | |
| `CUST-060` | Fiscal Calendar Settings | 15242630375316 | |
| `CUST-061` | Form Settings | 15242612074644 | |
| `CUST-062` | General Ledger Accounts | 15242390520980 | |
| `CUST-063` | General Ledger Assigned Account Settings | 15242612074516 | |
| `CUST-064` | General Ledger Cost Center Settings | 15242630365716 | |
| `CUST-065` | General Ledger Insurance | 15242406635028 | |
| `CUST-066` | General Ledger User Permissions | 15242612075668 | |
| `CUST-067` | Gift Certificate Payment Settings | 15242630880916 | |
| `CUST-068` | Gift Registry Type Settings | 15242612079636 | |
| `CUST-069` | GL Account Entry Screen | 15242390750740 | |
| `CUST-070` | GL Account Settings | 15242630384532 | |
| `CUST-071` | GL Class Settings | 15242630655124 | |
| `CUST-072` | GL Group Settings | 15242612331156 | |
| `CUST-073` | GL Source Settings | 15242630657300 | |
| `CUST-074` | GL Sub-Account Entry Screen | 15242594989076 | |
| `CUST-075` | GL Sub-Account Settings | 15242612330388 | |
| `CUST-076` | GL Sub-Class Settings | 15242612335380 | |
| `CUST-077` | Hold Code Settings | 15242630657044 | |
| `CUST-078` | Installment Eligibility Restrictions | 15242630129172 | |
| `CUST-079` | Installment Payment Plan Settings | 15242612331412 | |
| `CUST-080` | Insurance Code Jurisdiction Settings | 15242610252052 | |
| `CUST-081` | Interest Rate Table | 15242610251284 | |
| `CUST-082` | Invoice Charge Settings | 15242630660372 | |
| `CUST-083` | Invoice Charge Type Settings | 15242630883476 | |
| `CUST-084` | List Zip Codes to Apply Tax Code Screen | 15242610251796 | |
| `CUST-085` | Mandatory Order Comment Settings | 15242630881556 | |
| `CUST-086` | Marketing Code Settings | 15242662912020 | |
| `CUST-087` | Membership Reward Settings | 16917259015188 | |
| `CUST-088` | Merchandise of Interest Settings | 15242630656404 | |
| `CUST-089` | Method of Contact Settings | 15242630882324 | |
| `CUST-090` | Metro 2 Code Settings | 15242594991892 | |
| `CUST-091` | Minimum Deposit Percentage Table | 15242390955284 | |
| `CUST-092` | Minimum Finance Charge Table | 15242406895636 | |

## Customer Settings (C: 93–137)

Source: [`parts/customer-settings-c.md`](parts/customer-settings-c.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `CUST-093` | Miscellaneous Payment Settings | 15242662922260 | |
| `CUST-094` | Miscellaneous Payment Type Entry Window | 15242406901140 | |
| `CUST-095` | Move Customer Purchase History for Completed Order | 15242406632084 | |
| `CUST-096` | Multiple Line Discounts Overview | 15242595452052 | |
| `CUST-097` | Non-Filing Fee Table | 15242406901908 | |
| `CUST-098` | O/S Form Screen | 15242595235092 | |
| `CUST-099` | Open To Buy Budget by Category | 15242390968084 | |
| `CUST-100` | Open To Buy Department Settings | 15242662921876 | |
| `CUST-101` | Order Source Settings | 15242662911764 | |
| `CUST-102` | Payment Commission Adjustments Screen | 15242390971412 | |
| `CUST-103` | Payment Type Override Settings | 15242595231636 | |
| `CUST-104` | Percentage Break Level Table | 15242631136532 | |
| `CUST-105` | Price Matrix Usage Codes | 15242610698004 | |
| `CUST-106` | Printer Settings | 15242631136276 | |
| `CUST-107` | Printer Zone Settings | 15242631137172 | |
| `CUST-108` | Problem Code Settings | 15297959793684 | |
| `CUST-109` | Receivables Activity Type Settings | 15242631134228 | |
| `CUST-110` | Reconciliation Deposit Type Settings | 15242663219220 | |
| `CUST-111` | Reconciliation Transaction Type Settings | 15242663219092 | |
| `CUST-112` | Referred By Settings | 15242663218068 | |
| `CUST-113` | Revolving Classification Settings | 18106520558996 | |
| `CUST-114` | Revolving Payment Plan Settings | 15242663218836 | |
| `CUST-115` | Revolving/Installment Fees | 17304693314324 | |
| `CUST-116` | Sales Coupon Settings | 15242631136660 | |
| `CUST-117` | Sales Discount Settings | 15242631135764 | |
| `CUST-118` | Sales Lead Origin Settings | 15297965121940 | |
| `CUST-119` | Sales Tax Settings | 15297959789972 | |
| `CUST-120` | Salesperson Settings | 15297965129748 | |
| `CUST-121` | Select Bank Check Run File Format | 15242407154196 | |
| `CUST-122` | Select Insurance Window | 15242610699540 | |
| `CUST-123` | Settlement Type | 15242407154324 | |
| `CUST-124` | Solicitation of Customer Information | 15297965125140 | |
| `CUST-125` | Special Character Settings | 15242595454868 | |
| `CUST-126` | Special Comment Settings | 15297965136020 | |
| `CUST-127` | Special Occasion Settings | 15297959796628 | |
| `CUST-128` | Spiff Table Settings | 15297959789076 | |
| `CUST-129` | Staff GL Limited Access Detail Screen | 15242407154068 | |
| `CUST-130` | Statement Notification Days | 15242391204500 | |
| `CUST-131` | Status Code Settings | 16917916176788 | |
| `CUST-132` | Terms Settings | 15297965130132 | |
| `CUST-133` | TPA Account Description Index | 15242391204884 | |
| `CUST-134` | TPA GL Account Entry | 15242610698132 | |
| `CUST-135` | Track Processing Activity | 15242611859732 | |
| `CUST-136` | Trade Designer Discount Settings | 15297960049684 | |
| `CUST-137` | Warehouse - O/S Form List | 15242629258644 | |

## Product Settings (A: 1–44)

Source: [`parts/product-settings-a.md`](parts/product-settings-a.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `PRD-001` | Advanced Product Settings | 15294524452244 | |
| `PRD-002` | Ashley Interface Settings | 15294470774036 | |
| `PRD-003` | Assign Options | 15294468994324 | |
| `PRD-004` | BAI Code Settings | 15294470781460 | |
| `PRD-005` | Base/Grade Configuration | 15294470263060 | |
| `PRD-006` | Brand Settings | 15294470776852 | |
| `PRD-007` | Category Settings | 15294470775956 | |
| `PRD-008` | Collection Settings | 15294470773140 | |
| `PRD-009` | Component Priced Kits | 15294468994196 | |
| `PRD-010` | Configurator Clone Process | 15294469951124 | |
| `PRD-011` | Configurator Sub-Option Rules | 15294523580180 | |
| `PRD-012` | Configurator Yardage Screen | 15294468995092 | |
| `PRD-013` | Default Product Settings | 15294524452756 | |
| `PRD-014` | Discount Costing Table | 15294522623380 | |
| `PRD-015` | District and Regional Product Settings | 15294470776724 | |
| `PRD-016` | Fabric Configuration | 15294470273812 | |
| `PRD-017` | Fabric Group Configuration | 15294523901716 | |
| `PRD-018` | Factory/Extended Warranty Code | 15294524453140 | |
| `PRD-019` | Freight Distribution | 15294522637972 | |
| `PRD-020` | Grade Description Configuration | 15294470266644 | |
| `PRD-021` | Gross Margin Calculator | 15294468990612 | |
| `PRD-022` | Group Settings | 15294470776468 | |
| `PRD-023` | Image Replication Service | 15294522840852 | |
| `PRD-024` | Image Wizard Settings | 15294555045652 | |
| `PRD-025` | Inventory Formation Settings | 15294524800404 | |
| `PRD-026` | Inventory Formations Overview | 15294522840212 | |
| `PRD-027` | Kit Promotion Settings | 15294524798740 | |
| `PRD-028` | Lay-Z-Boy Settings | 15294524801684 | |
| `PRD-029` | Line Item Text | 15294522843284 | |
| `PRD-030` | List Configuration | 15294523891732 | |
| `PRD-031` | Maintain Code | 15294523065620 | |
| `PRD-032` | Markdown Pricing | 15294469386260 | |
| `PRD-033` | Option Configuration | 15294523895444 | |
| `PRD-034` | Option Grade Price Configuration | 15294523891988 | |
| `PRD-035` | Option Price Configuration | 15294470269844 | |
| `PRD-036` | Option Type Configuration | 15294523898516 | |
| `PRD-037` | Prep Code Settings | 15294524821268 | |
| `PRD-038` | Price Adjustment Clone Process | 15294469389972 | |
| `PRD-039` | Price Adjustment Settings | 15294555043092 | |
| `PRD-040` | Price Adjustments - Actions | 15294469392020 | |
| `PRD-041` | Price/Spiff/Commission Table | 15294469387156 | |
| `PRD-042` | Product Attribute Title Settings | 15294555044628 | |
| `PRD-043` | Product Attribute Value Settings | 15294524815252 | |
| `PRD-044` | Product Benefit Settings | 15294555057556 | |

## Product Settings (B: 45–88)

Source: [`parts/product-settings-b.md`](parts/product-settings-b.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `PRD-045` | Product Benefits Entry | 15294523057812 | |
| `PRD-046` | Product Clone Process | 15294522623508 | |
| `PRD-047` | Product Configuration | 15294470271892 | |
| `PRD-048` | Product Configurator Rules Screen | 15294469952020 | |
| `PRD-049` | Product Family Settings | 15294555044244 | |
| `PRD-050` | Product Kit Settings | 15294525112980 | |
| `PRD-051` | Product Settings | 15294525107348 | |
| `PRD-052` | Product Substitution Codes | 15294523269396 | |
| `PRD-053` | Product Type Codes | 15294523058068 | |
| `PRD-054` | Protection Plan Product Selection | 15294555336084 | |
| `PRD-055` | Protection Plan Selection | 15294525107092 | |
| `PRD-056` | Protection Plan Settings | 15294555339412 | |
| `PRD-057` | Purchase Status Settings | 15294525105812 | |
| `PRD-058` | Retail Delivery Fee Overview | 48289352920852 | |
| `PRD-059` | Schedule Purchase Status | 15294523057300 | |
| `PRD-060` | Set Configuration Rules | 15294470605716 | |
| `PRD-061` | Set Configuration Sub-Option Rules | 15294470606356 | |
| `PRD-062` | Set Predefined Items | 15294525107604 | |
| `PRD-063` | Special Order Option List Settings | 15294525106452 | |
| `PRD-064` | Special Order Option Price Settings | 15294525105684 | |
| `PRD-065` | Special Order Option Settings | 15294555346196 | |
| `PRD-066` | Special Order Option Type Settings | 15294555632916 | |
| `PRD-067` | Special Order Template Settings | 15294525424020 | |
| `PRD-068` | Spiff Table Entry Screen | 15294469613972 | |
| `PRD-069` | Substitute Product List Example | 15294469609876 | |
| `PRD-070` | Substitute Product List Settings | 15294469614100 | |
| `PRD-071` | Substitute Product Selection | 15294469612564 | |
| `PRD-072` | Suite Configuration | 15294470605332 | |
| `PRD-073` | Tariff Settings | 15294555641748 | |
| `PRD-074` | Tax Class Settings | 15294555637268 | |
| `PRD-075` | Text Field - Language Translation Entry | 15294523252500 | |
| `PRD-076` | Update Product Images | 15294525418516 | |
| `PRD-077` | Update Product Images - Left Pane | 15294469614996 | |
| `PRD-078` | Update Product Images - Right Pane | 15294523253908 | |
| `PRD-079` | Update Product Images - Top Pane | 15294522840340 | |
| `PRD-080` | Vendor Inventory Quantities API Queue | 15294525418132 | |
| `PRD-081` | Vendor Ship From Freight and Cost | 15294469615124 | |
| `PRD-082` | View Web Service Results | 15294523458964 | |
| `PRD-083` | Volume Rebate Table | 15294469806228 | |
| `PRD-084` | Warranty Category Settings | 15294555642772 | |
| `PRD-085` | Warranty Component Settings | 15294555636756 | |
| `PRD-086` | Warranty Overview | 15294469806996 | |
| `PRD-087` | Warranty Replacement Screen | 15294523460244 | |
| `PRD-088` | Warranty Settings | 15294525418772 | |

## Vendor Settings (A: 1–47)

Source: [`parts/vendor-settings-a.md`](parts/vendor-settings-a.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `VEND-001` | Account Number Entry Screen | 15243029148308 | |
| `VEND-002` | Action - Volume Rebate Exceptions | 15242997286420 | |
| `VEND-003` | Advanced Regional Vendor Settings | 15243031913108 | |
| `VEND-004` | Advanced Vendor Category and Group Exception Settings - Auto-Fill Days | 15243029151636 | |
| `VEND-005` | Advanced Vendor Category and Group Exception Settings - Discount Costing | 15242997270036 | |
| `VEND-006` | Advanced Vendor Category and Group Exception Settings - Excess Stock Days | 15242997268500 | |
| `VEND-007` | Advanced Vendor Category and Group Exception Settings - Factory Default Warranty | 15243029154708 | |
| `VEND-008` | Advanced Vendor Category and Group Exception Settings - Landed Cost Add-Ons | 15243029362964 | |
| `VEND-009` | Advanced Vendor Category and Group Exception Settings - Lead Pad Days | 15243029152788 | |
| `VEND-010` | Advanced Vendor Category and Group Exception Settings - Minimum Stock Days | 15242997491988 | |
| `VEND-011` | Advanced Vendor Category and Group Exception Settings - Purchase Delivery Pad Days | 15243029150228 | |
| `VEND-012` | Advanced Vendor Category and Group Exception Settings - Purchase Lead Days | 15243029366932 | |
| `VEND-013` | Advanced Vendor Category and Group Exception Settings - Volume Rebates | 15243029154068 | |
| `VEND-014` | Advanced Vendor Settings | 15243030215572 | |
| `VEND-015` | Advanced Vendor Settings - Read Only | 15242997505812 | |
| `VEND-016` | Bank Override | 15242997491732 | |
| `VEND-017` | Bill Back Settings | 15243030216596 | |
| `VEND-018` | Birdeye Settings | 15243029363220 | |
| `VEND-019` | Broker Settings | 15243030215700 | |
| `VEND-020` | Buying Group Settings | 15243031911444 | |
| `VEND-021` | Cost Reduced Bill Back Settings | 15243031910548 | |
| `VEND-022` | Deduct From Invoice Settings | 15243032141204 | |
| `VEND-023` | Deliver To Settings | 15243032739860 | |
| `VEND-024` | Delivery Charge Settings | 15243031916948 | |
| `VEND-025` | Delivery Charge Table Settings | 15243031913748 | |
| `VEND-026` | Delivery Company Settings | 15243030217748 | |
| `VEND-027` | Delivery Contact Status Settings | 15243031912852 | |
| `VEND-028` | Delivery Survey Settings | 15243032151316 | |
| `VEND-029` | Delivery To Description Lookup | 15242997735956 | |
| `VEND-030` | Distribution Status Settings | 15243030408724 | |
| `VEND-031` | Drop Off Storage Location Table | 15243029579668 | |
| `VEND-032` | EDI Status Details Settings | 15243030412308 | |
| `VEND-033` | Electronic Merchant Settings | 15243032143252 | |
| `VEND-034` | Enter In Transit Days by Location | 15243029579796 | |
| `VEND-035` | Enter New Ship-From ID Window | 15242997759764 | |
| `VEND-036` | Enter Payables Company by Location | 15243029579156 | |
| `VEND-037` | Float Settings | 15243032138772 | |
| `VEND-038` | FOB Settings | 15243032140180 | |
| `VEND-039` | Franchise Settings | 15243032139028 | |
| `VEND-040` | Freight Forwarder Settings | 15243030715924 | |
| `VEND-041` | Group Exceptions and Category Exceptions - Advanced Vendor Settings | 15242997758740 | |
| `VEND-042` | Logistical Route Settings | 15243032419476 | |
| `VEND-043` | Maintain Invoice Charge Table Settings | 15243030720660 | |
| `VEND-044` | Minimum Stock Days | 15243029580820 | |
| `VEND-045` | Multiple Break Selection | 15243032412564 | |
| `VEND-046` | Per Piece Delivery Charge Settings | 15243032411156 | |
| `VEND-047` | Picking By Zone Assignment Window | 15242997738004 | |

## Vendor Settings (B: 48–94)

Source: [`parts/vendor-settings-b.md`](parts/vendor-settings-b.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `VEND-048` | Picking Zone Assignment Window | 15243029805972 | |
| `VEND-049` | Podium Location ID | 15243029808532 | |
| `VEND-050` | Prioritize Special Delivery Picking | 15242997977364 | |
| `VEND-051` | Purchase Delivery Pad Days | 15243029806868 | |
| `VEND-052` | Purchase Lead Days | 15243029817876 | |
| `VEND-053` | Purchase Order Item Selection | 15243030718484 | |
| `VEND-054` | Purchase Order Shipping Type Settings | 15243030726676 | |
| `VEND-055` | Purchase Order Type Settings | 15243030718740 | |
| `VEND-056` | Receiving Capacity Settings | 15243032413844 | |
| `VEND-057` | Receiving Group Settings | 15243032411284 | |
| `VEND-058` | Region Settings | 15243032741396 | |
| `VEND-059` | Regional Vendor Settings | 15243032743572 | |
| `VEND-060` | Return to Vendor Tax Settings | 15243032741012 | |
| `VEND-061` | Route Capacity Settings | 15243030956052 | |
| `VEND-062` | Select Printable Language | 15242997980180 | |
| `VEND-063` | Select Storage Locations Screen | 15243029807124 | |
| `VEND-064` | Shared Route Capacity Settings | 15243030957972 | |
| `VEND-065` | Shared Route Code Settings | 15242997978516 | |
| `VEND-066` | Shift4 Authorization | 15242997978772 | |
| `VEND-067` | Shift4 eComm Authorization | 15243029809172 | |
| `VEND-068` | Shift4 Extended Receivables Authorization | 15243029986452 | |
| `VEND-069` | Shift4 Extended Receivables MOTO Authorization | 15242998151188 | |
| `VEND-070` | Shipping Port Settings | 15243032742804 | |
| `VEND-071` | Stock Location Schema | 15243029362452 | |
| `VEND-072` | Storage Category Settings | 15243032742932 | |
| `VEND-073` | Storage Location Field | 15243029986324 | |
| `VEND-074` | Storage Location Sort Sequence | 15243029999892 | |
| `VEND-075` | Third Party Logistics EDI Settings | 15243030955412 | |
| `VEND-076` | Third Party Warehouse Management System Group Settings | 15243030956564 | |
| `VEND-077` | Tracked Storage Location Settings | 15243032962964 | |
| `VEND-078` | Tracked Warehouse Location Mask Settings | 15243032962708 | |
| `VEND-079` | Tracked Warehouse Location Verification Settings | 16914630501140 | |
| `VEND-080` | Unit of Measure Settings | 15243032963348 | |
| `VEND-081` | Update Zip Code Settings | 15243032962836 | |
| `VEND-082` | Velocity Settings | 15243031200276 | |
| `VEND-083` | Vendor Class Settings | 15243031197972 | |
| `VEND-084` | Vendor EDI Settings | 15243032140436 | |
| `VEND-085` | Vendor Rebate Settings | 15243031202452 | |
| `VEND-086` | Vendor RemitTo Settings | 15243031207444 | |
| `VEND-087` | Vendor Settings | 15243032963092 | |
| `VEND-088` | Vendor Ship from Location Lead Days | 15243029986196 | |
| `VEND-089` | Vendor Ship From Replacement Cost Settings | 15242998160660 | |
| `VEND-090` | Vendor Ship From Settings | 15243031196820 | |
| `VEND-091` | Warehouse Inventory Settings | 15243033214228 | |
| `VEND-092` | Warehouse Mapping Paths Screen | 15243029987348 | |
| `VEND-093` | Warehouse/Store Location Settings | 15243033212820 | |
| `VEND-094` | Warehouse/Store Receiving Settings | 15243031440276 | |

## System Administration Views and Reports

Source: [`parts/views-reports.md`](parts/views-reports.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `SAR-001` | Mail Multi User/Group Selection Window | 15294766344980 | |
| `SAR-002` | Multiple Activity Type Selection Window | 15294766350740 | |
| `SAR-003` | Multiple Category Selection Window | 15294752100628 | |
| `SAR-004` | Multiple Company Selection Window | 15294752252820 | |
| `SAR-005` | Multiple District Selection Window | 15294752249876 | |
| `SAR-006` | Multiple Entry Window | 15202502995604 | |
| `SAR-007` | Multiple Exception Selection Window | 15294752250772 | |
| `SAR-008` | Multiple Franchise Selection Window | 15294752478356 | |
| `SAR-009` | Multiple Function Selection Window | 15294752476692 | |
| `SAR-010` | Multiple Location Selection Window | 15294766862100 | |
| `SAR-011` | Multiple Prefixes Selection Window | 15294752807572 | |
| `SAR-012` | Multiple Printer Selection Window | 15294767010836 | |
| `SAR-013` | Multiple Probability Selection Window | 15294752810516 | |
| `SAR-014` | Multiple Reason Code Selection Window | 15294767144340 | |
| `SAR-015` | Multiple Region Selection Window | 15294752950676 | |
| `SAR-016` | Multiple Selection Entry Window | 15294767616788 | |
| `SAR-017` | Multiple Staff Selection Window | 15294752953492 | |
| `SAR-018` | Read-Only Lookup Window | 15294753602068 | |
| `SAR-019` | Report Customer Merge Status | 15202553752980 | |
| `SAR-020` | Report Error Messages | 15202742729620 | |
| `SAR-021` | Report Files Created via Entry Processes | 15202930411668 | |
| `SAR-022` | Report on Menu Access | 15203012857236 | |
| `SAR-023` | Report on User Security | 15203028700948 | |
| `SAR-024` | Report Secured Decryption Activity | 15203214259476 | |
| `SAR-025` | Report Time Clock Activity | 15203214462356 | |
| `SAR-026` | Staff Location Restriction Review | 15295211660436 | |
| `SAR-027` | Text Entry Screen | 15294766048020 | |
| `SAR-028` | Time Entry | 15294767776916 | |
| `SAR-029` | Time Interval Entry - Specify Interval | 15294767779604 | |
| `SAR-030` | Updates History Report | 15203235627028 | |
| `SAR-031` | Vendor Name Search | 15294767989268 | |
| `SAR-032` | View Advanced Customer Settings | 15295211963924 | |
| `SAR-033` | View Advanced Product Settings | 15295211514516 | |
| `SAR-034` | View Bank Settings | 15295210638740 | |
| `SAR-035` | View Bar Code Scanner Download Activity | 15295156258068 | |
| `SAR-036` | View Bill Back Settings | 15295210665492 | |
| `SAR-037` | View Create a User | 15295212294036 | |
| `SAR-038` | View Create a User Group | 15295156484244 | |
| `SAR-039` | View Deduct From Invoice Settings | 15295210967700 | |
| `SAR-040` | View Payment Settings | 15295211362708 | |
| `SAR-041` | View Rebate Plan Settings | 15295211517332 | |
| `SAR-042` | View Rebate Plan Status Settings | 15295211523476 | |
| `SAR-043` | View Terms Settings | 15295213075860 | |
| `SAR-044` | View Vendor Settings | 15295155563924 | |
| `SAR-045` | View Warehouse/Store Settings | 15295157262740 | |

## Account Setup · Purging Data · Importing Data

Source: [`parts/account-purge-import.md`](parts/account-purge-import.md)

| Req ID | Article | STORIS article id | Audit |
|---|---|---|---|
| `ACCT-001` | Configure Document Archive | 15201527824148 | |
| `ACCT-002` | Configure Document Signature Capture | 15201512181396 | |
| `ACCT-003` | Signature Audit Inquiry | 15201527971732 | |
| `ACCT-004` | Signature Audit Settings | 15201512337044 | |
| `PURGE-001` | Remove a Customer's Personal Information | 15201512686484 | |
| `IMP-001` | Import Customer Merge Information | 15201528157972 | |
