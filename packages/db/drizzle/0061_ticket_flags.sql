ALTER TABLE "deliveries" ADD COLUMN "ticket_flag" text;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN "pick_list_flag" text;--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD COLUMN "ticket_flag" text;--> statement-breakpoint
ALTER TABLE "delivery_lines" ADD COLUMN "pick_list_flag" text;