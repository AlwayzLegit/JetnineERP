CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"alt_text" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- search_tsv is a generated column (GENERATED ALWAYS AS … STORED) so the
-- index stays consistent with the row's text fields without trigger
-- maintenance. Drizzle doesn't model generated columns directly; we add
-- them via raw SQL here.
ALTER TABLE "product_variants" ADD COLUMN "search_tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(barcode, '')
    )
  ) STORED;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "search_tsv" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' || coalesce(sku, '') || ' ' || coalesce(description, '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX "products_search_tsv_idx" ON "products" USING gin ("search_tsv");
--> statement-breakpoint
CREATE INDEX "product_variants_search_tsv_idx" ON "product_variants" USING gin ("search_tsv");
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX "product_images_business_id_idx" ON "product_images" USING btree ("business_id");
