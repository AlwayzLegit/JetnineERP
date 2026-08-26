CREATE TABLE "as_is_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"source" text DEFAULT 'return' NOT NULL,
	"status" text DEFAULT 'pending_review' NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"restocked_variant_id" uuid,
	"notes" text,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "as_is_items_quantity_positive" CHECK ("as_is_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "store_credit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"delta_cents" integer NOT NULL,
	"reason" text,
	"reference_type" text,
	"reference_id" uuid,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "qty_returned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD CONSTRAINT "as_is_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD CONSTRAINT "as_is_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD CONSTRAINT "as_is_items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD CONSTRAINT "as_is_items_restocked_variant_id_product_variants_id_fk" FOREIGN KEY ("restocked_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD CONSTRAINT "as_is_items_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_credit_entries" ADD CONSTRAINT "store_credit_entries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_credit_entries" ADD CONSTRAINT "store_credit_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_credit_entries" ADD CONSTRAINT "store_credit_entries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "as_is_items_business_id_idx" ON "as_is_items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "as_is_items_status_idx" ON "as_is_items" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "as_is_items_variant_id_idx" ON "as_is_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "as_is_items_location_id_idx" ON "as_is_items" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "store_credit_entries_business_id_idx" ON "store_credit_entries" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "store_credit_entries_customer_id_idx" ON "store_credit_entries" USING btree ("business_id","customer_id");