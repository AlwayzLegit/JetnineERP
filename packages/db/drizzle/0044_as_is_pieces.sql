ALTER TABLE "as_is_items" ADD COLUMN "piece_number" text;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "condition" text;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "as_is_price_cents" integer;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "storage_location" text;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "reason_code_id" uuid;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD CONSTRAINT "as_is_items_reason_code_id_reason_codes_id_fk" FOREIGN KEY ("reason_code_id") REFERENCES "public"."reason_codes"("id") ON DELETE set null ON UPDATE no action;