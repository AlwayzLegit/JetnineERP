ALTER TABLE "purchase_order_lines" ADD COLUMN "quantity_rejected" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "remit_to" text;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;