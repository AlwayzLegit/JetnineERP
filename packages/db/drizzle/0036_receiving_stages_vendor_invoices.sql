CREATE TABLE "vendor_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"purchase_order_id" uuid,
	"number" text NOT NULL,
	"invoice_date" date,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'unmatched' NOT NULL,
	"notes" text,
	"matched_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD COLUMN "quantity_inspected" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_lines" ADD COLUMN "quantity_accepted" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_invoices_business_id_idx" ON "vendor_invoices" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "vendor_invoices_vendor_id_idx" ON "vendor_invoices" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_invoices_purchase_order_id_idx" ON "vendor_invoices" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "vendor_invoices_status_idx" ON "vendor_invoices" USING btree ("business_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_invoices_vendor_number_unique" ON "vendor_invoices" USING btree ("vendor_id","number");