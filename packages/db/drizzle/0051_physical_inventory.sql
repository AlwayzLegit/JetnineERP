CREATE TABLE "physical_count_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"count_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"storage_bin_id" uuid,
	"frozen_qty" integer NOT NULL,
	"frozen_reserved" integer DEFAULT 0 NOT NULL,
	"counted_qty" integer,
	"counted_by_user_id" uuid,
	"counted_at" timestamp with time zone,
	"reason_code_id" uuid,
	"posted_variance" integer
);
--> statement-breakpoint
CREATE TABLE "physical_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"count_date" date NOT NULL,
	"frozen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"posted_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"posted_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "physical_count_lines" ADD CONSTRAINT "physical_count_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_count_lines" ADD CONSTRAINT "physical_count_lines_count_id_physical_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."physical_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_count_lines" ADD CONSTRAINT "physical_count_lines_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_count_lines" ADD CONSTRAINT "physical_count_lines_storage_bin_id_storage_bins_id_fk" FOREIGN KEY ("storage_bin_id") REFERENCES "public"."storage_bins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_count_lines" ADD CONSTRAINT "physical_count_lines_counted_by_user_id_users_id_fk" FOREIGN KEY ("counted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_count_lines" ADD CONSTRAINT "physical_count_lines_reason_code_id_reason_codes_id_fk" FOREIGN KEY ("reason_code_id") REFERENCES "public"."reason_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_counts" ADD CONSTRAINT "physical_counts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_counts" ADD CONSTRAINT "physical_counts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_counts" ADD CONSTRAINT "physical_counts_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_counts" ADD CONSTRAINT "physical_counts_posted_by_user_id_users_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "physical_count_lines_count_variant_uniq" ON "physical_count_lines" USING btree ("count_id","variant_id");--> statement-breakpoint
CREATE INDEX "physical_count_lines_business_id_idx" ON "physical_count_lines" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "physical_count_lines_count_id_idx" ON "physical_count_lines" USING btree ("count_id");--> statement-breakpoint
CREATE INDEX "physical_counts_business_id_idx" ON "physical_counts" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "physical_counts_location_id_idx" ON "physical_counts" USING btree ("location_id");