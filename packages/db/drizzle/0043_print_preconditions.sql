ALTER TABLE "orders" ADD COLUMN "ticket_print_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "relock_at" timestamp with time zone;