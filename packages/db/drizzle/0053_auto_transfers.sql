ALTER TABLE "locations" ADD COLUMN "replenishment_days_json" jsonb;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD COLUMN "scheduled_for" date;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;