ALTER TABLE "locations" ADD COLUMN "location_type" text DEFAULT 'store' NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD COLUMN "ticket_printed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD COLUMN "ticket_print_count" integer DEFAULT 0 NOT NULL;