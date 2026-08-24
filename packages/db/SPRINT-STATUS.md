- **2026-08-24 — Post-checkpoint slice 4 (marketing):** `customer_segments` + `campaigns`
  (migration `0026_marketing`, RLS'd); `/v1/marketing/*` behind existing
  `crm.campaigns.manage` — segments are stored filters over CRM tags resolved at
  preview/send (email-holders only; imported customers included — D8 covers money flows,
  not outreach), campaigns are one-shot (marked sent before the send loop so a crash
  can't double-blast), `campaign.sent` webhook event; Marketing page in the People nav.
  marketing.int.spec.ts (8 tests) + MARKETING_TEST_DATABASE_URL in CI.
