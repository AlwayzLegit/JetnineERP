ALTER TABLE "order_lines" ADD COLUMN "fulfillment_method" text;--> statement-breakpoint
ALTER TABLE "order_lines" ADD COLUMN "delivery_date" date;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_kind" text DEFAULT 'sales_order' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_instructions" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "pickup_location_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "billing_address_json" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "marketing_code" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "install_fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "other_fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "other_fee_label" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;