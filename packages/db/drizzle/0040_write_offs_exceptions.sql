CREATE TABLE "write_offs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"as_is_item_id" uuid,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost_cents" integer DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	"reason_code_id" uuid,
	"reason" text,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "write_offs_quantity_positive" CHECK ("write_offs"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "exception_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"actor_user_id" uuid,
	"entity_type" text,
	"entity_id" uuid,
	"summary" text NOT NULL,
	"metadata_json" jsonb,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "vendor_ra_number" text;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "vendor_credit_cents" integer;--> statement-breakpoint
ALTER TABLE "as_is_items" ADD COLUMN "vendor_credit_status" text;--> statement-breakpoint
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_as_is_item_id_as_is_items_id_fk" FOREIGN KEY ("as_is_item_id") REFERENCES "public"."as_is_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_reason_code_id_reason_codes_id_fk" FOREIGN KEY ("reason_code_id") REFERENCES "public"."reason_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "write_offs" ADD CONSTRAINT "write_offs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_events" ADD CONSTRAINT "exception_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_events" ADD CONSTRAINT "exception_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_events" ADD CONSTRAINT "exception_events_acknowledged_by_user_id_users_id_fk" FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "write_offs_business_id_idx" ON "write_offs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "write_offs_created_idx" ON "write_offs" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "exception_events_business_id_idx" ON "exception_events" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "exception_events_open_idx" ON "exception_events" USING btree ("business_id","acknowledged_at","created_at");--> statement-breakpoint
CREATE INDEX "exception_events_actor_idx" ON "exception_events" USING btree ("business_id","actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "exception_events_type_idx" ON "exception_events" USING btree ("business_id","type");