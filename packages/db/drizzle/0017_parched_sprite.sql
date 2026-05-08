CREATE TABLE "tax_class_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"tax_class_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"rate_bps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tax_class_rates" ADD CONSTRAINT "tax_class_rates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_class_rates" ADD CONSTRAINT "tax_class_rates_tax_class_id_tax_classes_id_fk" FOREIGN KEY ("tax_class_id") REFERENCES "public"."tax_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_class_rates" ADD CONSTRAINT "tax_class_rates_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_class_rates_class_location_uniq" ON "tax_class_rates" USING btree ("tax_class_id","location_id");--> statement-breakpoint
CREATE INDEX "tax_class_rates_business_id_idx" ON "tax_class_rates" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "tax_class_rates_class_id_idx" ON "tax_class_rates" USING btree ("tax_class_id");--> statement-breakpoint
CREATE INDEX "tax_class_rates_location_id_idx" ON "tax_class_rates" USING btree ("location_id");