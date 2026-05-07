-- Customers full-text search. The simple tokenizer would otherwise treat
-- emails and phones as opaque single tokens (e.g. 'bob@example.com'),
-- which kills partial matches. Pre-process the source text by replacing
-- every non-alphanumeric character with a space so 'bob@example.com'
-- becomes 'bob example com' and '+15559999999' becomes '15559999999'.
ALTER TABLE "customers" ADD COLUMN "search_tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      regexp_replace(
        coalesce(first_name, '') || ' ' ||
        coalesce(last_name, '') || ' ' ||
        coalesce(email::text, '') || ' ' ||
        coalesce(phone, ''),
        '[^a-zA-Z0-9]+', ' ', 'g'
      )
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX "customers_search_tsv_idx" ON "customers" USING gin ("search_tsv");
