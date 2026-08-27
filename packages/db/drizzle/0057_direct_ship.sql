ALTER TABLE "purchase_orders" ADD COLUMN "direct_ship" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "ship_to_json" jsonb;