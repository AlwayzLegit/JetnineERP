CREATE TABLE "vendor_po_cutting_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"cutting_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "landed_cost_json" jsonb;--> statement-breakpoint
ALTER TABLE "vendor_po_cutting_dates" ADD CONSTRAINT "vendor_po_cutting_dates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_po_cutting_dates" ADD CONSTRAINT "vendor_po_cutting_dates_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_po_cutting_dates" ADD CONSTRAINT "vendor_po_cutting_dates_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_po_cutting_dates_vendor_collection_uniq" ON "vendor_po_cutting_dates" USING btree ("vendor_id","collection_id");--> statement-breakpoint
CREATE INDEX "vendor_po_cutting_dates_business_id_idx" ON "vendor_po_cutting_dates" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "vendor_po_cutting_dates_vendor_id_idx" ON "vendor_po_cutting_dates" USING btree ("vendor_id");