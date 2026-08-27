ALTER TABLE "inventory_levels" ADD COLUMN "floor_sample" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD COLUMN "serial_ids_json" jsonb;