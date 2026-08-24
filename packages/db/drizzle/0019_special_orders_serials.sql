CREATE TABLE "serial_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"serial" text NOT NULL,
	"status" text DEFAULT 'in_stock' NOT NULL,
	"order_line_id" uuid,
	"customer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "po_line_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"po_line_id" uuid NOT NULL,
	"order_line_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" text DEFAULT 'ordered' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "serial_tracked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_line_allocations" ADD CONSTRAINT "po_line_allocations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "po_line_allocations" ADD CONSTRAINT "po_line_allocations_po_line_id_purchase_order_lines_id_fk" FOREIGN KEY ("po_line_id") REFERENCES "public"."purchase_order_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "serial_units_business_variant_serial_uniq" ON "serial_units" USING btree ("business_id","variant_id","serial");--> statement-breakpoint
CREATE INDEX "serial_units_business_id_idx" ON "serial_units" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "serial_units_variant_id_idx" ON "serial_units" USING btree ("variant_id","location_id","status");--> statement-breakpoint
CREATE INDEX "serial_units_order_line_id_idx" ON "serial_units" USING btree ("order_line_id");--> statement-breakpoint
CREATE INDEX "po_line_allocations_business_id_idx" ON "po_line_allocations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "po_line_allocations_po_line_id_idx" ON "po_line_allocations" USING btree ("po_line_id");--> statement-breakpoint
CREATE INDEX "po_line_allocations_order_line_id_idx" ON "po_line_allocations" USING btree ("order_line_id");