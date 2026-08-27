CREATE TABLE "storage_bins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_levels" ADD COLUMN "storage_bin_id" uuid;--> statement-breakpoint
ALTER TABLE "storage_bins" ADD CONSTRAINT "storage_bins_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_bins" ADD CONSTRAINT "storage_bins_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "storage_bins_location_code_uniq" ON "storage_bins" USING btree ("location_id","code");--> statement-breakpoint
CREATE INDEX "storage_bins_business_id_idx" ON "storage_bins" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "storage_bins_location_id_idx" ON "storage_bins" USING btree ("location_id");--> statement-breakpoint
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_storage_bin_id_storage_bins_id_fk" FOREIGN KEY ("storage_bin_id") REFERENCES "public"."storage_bins"("id") ON DELETE set null ON UPDATE no action;