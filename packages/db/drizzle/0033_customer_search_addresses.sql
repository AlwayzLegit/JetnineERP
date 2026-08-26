-- Universal customer search (PLAN-POS-OPERATIONS §4): the New Sale search
-- box matches addresses too, so the generated tsvector now folds in
-- addresses_json. Same normalization as 0003: every non-alphanumeric
-- character becomes a space, so "760 S. Serrano Ave." matches "serrano".
ALTER TABLE "customers" DROP COLUMN "search_tsv";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "search_tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      regexp_replace(
        coalesce(first_name, '') || ' ' ||
        coalesce(last_name, '') || ' ' ||
        coalesce(email::text, '') || ' ' ||
        coalesce(phone, '') || ' ' ||
        coalesce(addresses_json::text, ''),
        '[^a-zA-Z0-9]+', ' ', 'g'
      )
    )
  ) STORED;--> statement-breakpoint
CREATE INDEX "customers_search_tsv_idx" ON "customers" USING gin ("search_tsv");
