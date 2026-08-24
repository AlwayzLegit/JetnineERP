ALTER TABLE "product_variants" ADD COLUMN "reorder_point" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "reorder_qty" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "preferred_vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_preferred_vendor_id_vendors_id_fk" FOREIGN KEY ("preferred_vendor_id") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;